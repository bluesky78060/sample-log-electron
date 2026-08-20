// @ts-check
// SAMPL-2-34: sanitizeHTML이 DOMPurify 없이 조용히 폴백한다
//
// `sanitizeHTML()`은 DOMPurify가 없으면 **HTML 전체를 이스케이프해서** 반환한다.
// 그러면 화면에 태그가 글자로 나온다:
//
//   sanitizeHTML('<div class="x">…</div>')  →  &lt;div class="x"&gt;…&lt;/div&gt;
//
// 13페이지 중 6곳(`/`·분석 4종·흙토람)에 DOMPurify가 없다.
// **지금은 무해하다** — 그 페이지들이 `sanitizeHTML`을 호출하지 않기 때문이다(실측 0건).
// 즉 "조용히 실패 중"이 아니라 **"아직 실패하지 않았을 뿐"** 이고,
// 그 페이지에 한 줄만 추가하면 화면이 깨진다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const EXPECTED_VERSION = require('../../package.json').version;

/** 이 앱의 모든 페이지.
 *  ⚠️ 하드코딩이라 **새 페이지가 늘면 여기서 빠진다.** 그 구멍은
 *     `scripts/check-docs-assets.js`의 커버리지 검사가 메운다 —
 *     그쪽은 `docs/`의 HTML을 전부 훑고 **필수 CI**라 새 페이지를 자동으로 잡는다.
 *     이 스펙은 런타임 동작(전역 노출·폴백 경고)을 본다. */
const PAGES = [
    { name: '메인', path: '/' },
    { name: '토양', path: '/soil/' },
    { name: '수질', path: '/water/' },
    { name: '퇴비', path: '/compost/' },
    { name: '잔류농약', path: '/pesticide/' },
    { name: '중금속', path: '/heavy-metal/' },
    { name: '수질분석', path: '/water-analysis/' },
    { name: '퇴비분석', path: '/compost-analysis/' },
    { name: '중금속분석', path: '/heavy-metal-analysis/' },
    { name: '잔류농약분석', path: '/pesticide-analysis/' },
    { name: '흙토람', path: '/heuktoram/' },
    { name: '라벨인쇄', path: '/label-print/' },
    { name: '설정', path: '/settings/' },
];

// ⚠️ 빌드 신선도는 **맨 앞에서 한 번만** 본다. 예전에는 이 단언이 마지막
//    DOMPurify 테스트 안에 있어, `npm run build`를 잊으면 13건이 "DOMPurify가 없다 —
//    화면이 깨진다"고 외치고 진짜 원인(낡은 빌드)은 14번째에서만 보였다(코드 리뷰 지적).
test('docs/가 최신 빌드다 (선행 확인)', async ({ page }) => {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const res = await page.goto('/soil/');
    expect(res && res.status(), 'docs/soil/ 없음 — `npm run build` 먼저').toBeLessThan(400);
    await page.waitForFunction(() => !!window.APP_VERSION, { timeout: 15000 });
    expect(
        await page.evaluate(() => /** @type {any} */ (window).APP_VERSION),
        'docs/의 APP_VERSION이 package.json과 다르다 — `npm run build`를 잊었거나 다른 프로젝트다. ' +
        '아래 DOMPurify 실패들은 이것의 결과일 수 있다'
    ).toBe(EXPECTED_VERSION);
});

for (const p of PAGES) {
    test(`${p.name}: DOMPurify가 로드된다 (SAMPL-2-34)`, async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        const res = await page.goto(p.path);
        expect(res && res.status(), `docs${p.path} 없음 — \`npm run build\` 먼저`).toBeLessThan(400);
        await page.waitForFunction(() => !!window.sanitizeHTML, { timeout: 15000 });

        const out = await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            // 실제로 마크업이 살아남는지 본다 — 존재 여부만 보면 설정이 바뀌었을 때 놓친다
            const html = w.sanitizeHTML('<div class="probe"><span>x</span></div>');
            const d = document.createElement('div');
            d.innerHTML = html;
            return {
                hasDOMPurify: typeof w.DOMPurify !== 'undefined',
                markupSurvived: !!d.querySelector('.probe span'),
                raw: html.slice(0, 60),
            };
        });

        expect(
            out.hasDOMPurify,
            'DOMPurify가 없다 — sanitizeHTML이 마크업을 통째로 이스케이프해 화면이 깨진다'
        ).toBe(true);
        expect(
            out.markupSurvived,
            `sanitizeHTML이 마크업을 살리지 못했다: ${out.raw}`
        ).toBe(true);
    });
}

// 🚨 방어가 실제로 동작하는지 — DOMPurify를 지운 상태에서 조용히 넘어가지 않아야 한다.
test('DOMPurify가 없으면 조용히 넘어가지 않고 알린다 (SAMPL-2-34)', async ({ page }) => {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    const res = await page.goto('/soil/');
    expect(res && res.status()).toBeLessThan(400);
    await page.waitForFunction(() => !!window.sanitizeHTML, { timeout: 15000 });

    await page.evaluate(() => {
        // 라이브러리가 사라진 상황을 만든다 (설정 변경·번들 사고 등)
        // @ts-ignore
        delete window.DOMPurify;
        /** @type {any} */ (window).__probe = /** @type {any} */ (window).sanitizeHTML('<div>x</div>');
    });

    expect(
        errors.filter((e) => /DOMPurify/i.test(e)).length,
        'DOMPurify 없이 sanitizeHTML이 불렸는데 콘솔에 아무 경고가 없다 — 조용한 실패다'
    ).toBeGreaterThan(0);
});
