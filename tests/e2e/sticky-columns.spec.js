// @ts-check
// SAMPL-1-171: 목록을 가로로 스크롤하면 고정 열이 겹쳐 "화면이 밀린다"
//
// 고정 열의 `left`가 페이지별 CSS에 **픽셀로 박혀** 있었는데 폭은 `min-width`라
// 내용에 따라 늘어난다. 그래서 각 고정 열이 자기 자리보다 왼쪽에 주차해 앞 열 위로
// 올라탔다. 실측(1280px, 토양): `col-name`이 CSS 435px인데 실제 자리는 483px —
// **48px 어긋났고**, 끝까지 스크롤하면 `완료→접수번호` 4px, `접수일자→구분` 14px가
// 실제로 겹쳤다.
//
// ⚠️ 이 스펙은 **담당자가 보는 증상**을 단정한다 — CSS 값이 아니라 화면 위 겹침이다.
//    `left` 값만 비교하면 계산이 맞아도 실제로 겹치는 경우를 놓친다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

/** 시료 타입별 진입점 — 5개 전부 같은 결함이 있었다 */
const TYPES = [
    { path: '/soil/', mgr: 'soilManager', key: 'soilSampleLogs' },
    { path: '/water/', mgr: 'waterManager', key: 'waterSampleLogs' },
    { path: '/compost/', mgr: 'compostManager', key: 'compostSampleLogs' },
    { path: '/heavy-metal/', mgr: 'heavyMetalManager', key: 'heavyMetalSampleLogs' },
    { path: '/pesticide/', mgr: 'pesticideManager', key: 'pesticideSampleLogs' },
];

/** 열을 넓힐 만한 긴 내용 — 짧은 값만 넣으면 어긋남이 드러나지 않는다 */
const LONG_ADDR = '봉화군 봉화읍 내성리 224-15번지 일원';

/**
 * 앱이 오프셋 조정을 **끝낼 때까지** 기다린다.
 *
 * ⚠️ 폭만 보고 기다리면 부족하다 — 폭이 멈춰도 앱이 마지막 한 번을 아직 반영하지
 *    않았을 수 있다. 실측: 폭 안정만 기다렸더니 5개 병렬 실행에서 결과가
 *    10~12건으로 흔들렸다. 앱이 실제로 써 놓은 값이 멈추는 것을 본다.
 *
 * ⚠️ 고정 시간(200ms 등)으로 기다리지 않는다. 웹 폰트가 단계적으로 로드되며
 *    폭이 32 → 35.8 → 39.1 → 40으로 계속 바뀌고(실측), 그 사이에 재면
 *    실행마다 결과가 달라진다 — 앱이 아니라 측정이 흔들리는 것이다.
 */
async function waitForStableOffsets(page) {
    await page.evaluate(() => { delete (/** @type {any} */ (window)).__lastCss; });
    await page.waitForFunction(() => {
        const row = document.querySelector('.data-table thead tr');
        if (!row) return false;
        const w = /** @type {any} */ (window);
        // 앱이 써 놓은 규칙 + 현재 폭을 함께 본다. 규칙이 아직 없으면 기다린다.
        // ⚠️ 측정용 스타일(`sticky-col-offsets-measure`)은 세지 않는다. 접두사가 같아
        //    그것만 보고 "준비됐다"고 판단하면 **오프셋이 아직 없어도** 대기가 끝난다
        //    (실측: 그 탓에 하드코딩 값으로 잰 결과가 섞여 실행마다 흔들렸다).
        const style = Array.from(document.querySelectorAll('style[id^="sticky-col-offsets-"]'))
            .map((e) => e.textContent || '')
            .filter((t) => t.includes('data-sticky-scope'))
            .join('|');
        if (!style) return false;
        const widths = Array.from(row.children).map((c) => c.getBoundingClientRect().width).join(',');
        const now = `${style}##${widths}`;
        const stable = w.__lastCss === now;
        w.__lastCss = now;
        return stable;
    }, { timeout: 15000, polling: 250 });
}

async function seedAndShowList(page, mgrName, count = 6) {
    await page.evaluate(([name, n, addr]) => {
        const mgr = /** @type {any} */ (window)[name];
        const logs = Array.from({ length: n }, (_, i) => ({
            id: `r${i}`, receptionNumber: String(300 + i), name: `홍길동${i}`,
            phoneNumber: '010-1234-5678', date: '2026-08-21',
            subCategory: '밭', landClass1: '농가의뢰', purpose: '토양검정',
            receptionMethod: '방문', lotAddress: addr, samplingLocation: addr,
            address: addr, farmName: `봉화농원${i}`, sampleName: `시료${i}`,
            area: '1000', cropsDisplay: '고추, 배추, 마늘',
            parcelIndex: 1, cropIndex: 0, parcels: [],
        }));
        localStorage.setItem(mgr.getStorageKey(mgr.selectedYear), JSON.stringify(logs));
        mgr.sampleLogs = logs;
        if (typeof mgr.switchView === 'function') mgr.switchView('list');
        mgr.filterAndRenderLogs();
    }, [mgrName, count, LONG_ADDR]);
    await page.waitForFunction(
        () => document.querySelectorAll('.data-table tbody tr').length > 0,
        { timeout: 10000 }
    );
    await waitForStableOffsets(page);
}

/**
 * 가로로 끝까지 스크롤한 뒤 **인접 고정 열의 겹침**을 잰다.
 * 폭 0인 열(모드에 따라 숨는 열)은 자리를 차지하지 않으므로 센다고 의미가 없다.
 */
async function overlapsAfterScroll(page) {
    return page.evaluate(async () => {
        const wrap = document.querySelector('.table-wrapper');
        if (!wrap) return { error: 'table-wrapper 없음' };
        wrap.scrollLeft = wrap.scrollWidth;   // 끝까지
        // scroll 이벤트가 온 뒤 그려진 자리를 본다. 프로그램으로 바꾼 scrollLeft의
        // 이벤트는 곧바로 오지 않으므로, 기다리지 않으면 **고치기 전 상태**를 재게 된다.
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const ths = Array.from(document.querySelectorAll('.data-table thead th'))
            .filter((th) => getComputedStyle(th).position === 'sticky'
                && th.classList.contains('sticky-col')
                && th.getBoundingClientRect().width > 0);
        const rects = ths.map((th) => {
            const r = th.getBoundingClientRect();
            return { cls: th.className, left: r.left, right: r.right };
        });
        const bad = [];
        for (let i = 0; i < rects.length - 1; i++) {
            const a = rects[i], b = rects[i + 1];
            // 소수점 오차 1px는 봐준다 — 그 이상은 눈에 보이는 겹침이다
            if (b.left < a.right - 1) {
                bad.push(`${a.cls} → ${b.cls}: ${Math.round(a.right - b.left)}px`);
            }
        }
        return { count: rects.length, bad, scrollLeft: wrap.scrollLeft };
    });
}

for (const t of TYPES) {
    test.describe(`고정 열 겹침 (${t.path})`, () => {
        test.beforeEach(async ({ page }) => {
            page.on('dialog', (d) => d.dismiss().catch(() => {}));
            await page.goto(t.path);
            await page.waitForLoadState('networkidle');
            await page.waitForFunction((n) => typeof window[n] !== 'undefined', t.mgr);
            await page.evaluate(() => localStorage.clear());
        });

        // 🚨 담당자가 보고한 증상. 가로로 스크롤하면 열이 서로 타고 넘었다.
        test('끝까지 가로 스크롤해도 고정 열이 겹치지 않는다', async ({ page }) => {
            await seedAndShowList(page, t.mgr);
            const r = await overlapsAfterScroll(page);
            expect(r.error, String(r.error)).toBeUndefined();
            expect(r.count, '고정 열을 찾지 못했다 — 스펙이 아무것도 검증하지 못한다').toBeGreaterThan(1);
            expect(r.scrollLeft, '가로로 스크롤되지 않았다 — 겹침을 볼 수 없다').toBeGreaterThan(0);
            expect(r.bad, `겹침: ${r.bad?.join(' / ')}`).toEqual([]);
        });

        // 창 폭이 바뀌면 열 폭도 재배분된다
        test('창 폭을 바꾼 뒤에도 겹치지 않는다', async ({ page }) => {
            await seedAndShowList(page, t.mgr);
            await page.setViewportSize({ width: 900, height: 800 });
            await waitForStableOffsets(page);

            const r = await overlapsAfterScroll(page);
            expect(r.bad, `900px에서 겹침: ${r.bad?.join(' / ')}`).toEqual([]);
        });
    });
}

test.describe('공익직불제 모드 (토양)', () => {
    // 🚨 `col-order`(차수)는 sticky-col을 달고도 **`left` 규칙이 아예 없었다**
    //    (실측 css-left: auto). 그 모드에서는 고정되지도 않고, 뒤 열들의
    //    하드코딩 오프셋도 이 열의 폭을 전혀 반영하지 않았다.
    test('차수 열이 나타나도 고정 열이 겹치지 않는다', async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        await page.goto('/soil/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
        await page.evaluate(() => localStorage.clear());
        await seedAndShowList(page, 'soilManager');

        // 토글 전 규칙을 기억해 둔다 — 앱이 **실제로 반응했는지** 확인하기 위해서다.
        // 그냥 정착만 기다리면 아직 반응하지 않은 상태도 "안정"으로 보인다.
        const before = await page.evaluate(() =>
            Array.from(document.querySelectorAll('style[id^="sticky-col-offsets-"]'))
                .map((e) => e.textContent || '').filter((t) => t.includes('data-sticky-scope')).join('|'));

        await page.evaluate(() => document.getElementById('logTable')?.classList.add('gongik-on'));
        await page.waitForFunction((prev) => {
            const now = Array.from(document.querySelectorAll('style[id^="sticky-col-offsets-"]'))
                .map((e) => e.textContent || '').filter((t) => t.includes('data-sticky-scope')).join('|');
            return now !== prev;
        }, before, { timeout: 15000, polling: 100 });
        await waitForStableOffsets(page);

        const r = await overlapsAfterScroll(page);
        expect(r.bad, `공익직불제 모드 겹침: ${r.bad?.join(' / ')}`).toEqual([]);
    });
});

test.describe("'전체 보기' 토글 (토양)", () => {
    // 🚨 SAMPL-1-173에서 경지구분 열이 기본 숨김이 되며 **숨었다 되살아나는 고정 열**이
    //    생겼다. 숨은 동안 그 열에 기록되는 `left`는 무의미한 값이라(실측 -21px),
    //    되살아날 때 재계산이 따라오지 않으면 앞 열 위로 올라탄다.
    //    이 조합은 어느 스펙도 보지 않았다 — 위 describe들은 토글을 한 번도 켜지 않는다.
    test('감춰졌던 경지구분 열이 되살아나도 고정 열이 겹치지 않는다', async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        await page.goto('/soil/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
        await page.evaluate(() => localStorage.clear());
        await seedAndShowList(page, 'soilManager');

        // 숨은 상태를 먼저 확인한다 — 여기가 0폭이어야 이 시험이 의미를 갖는다
        expect(
            await page.locator('#logTable th.col-landclass1').isVisible(),
            '경지구분 열이 이미 보인다 — 되살아나는 순간을 검증할 수 없다'
        ).toBe(false);

        // 앱이 **실제로 반응했는지** 본다. 정착만 기다리면 무반응도 "안정"으로 보인다.
        const before = await page.evaluate(() =>
            Array.from(document.querySelectorAll('style[id^="sticky-col-offsets-"]'))
                .map((e) => e.textContent || '').filter((t) => t.includes('data-sticky-scope')).join('|'));

        await page.locator('#viewToggleBtn').click();
        await expect(page.locator('#logTable th.col-landclass1')).toBeVisible();
        await page.waitForFunction((prev) => {
            const now = Array.from(document.querySelectorAll('style[id^="sticky-col-offsets-"]'))
                .map((e) => e.textContent || '').filter((t) => t.includes('data-sticky-scope')).join('|');
            return now !== prev;
        }, before, { timeout: 15000, polling: 100 });
        await waitForStableOffsets(page);

        const r = await overlapsAfterScroll(page);
        expect(r.bad, `전체 보기 겹침: ${r.bad?.join(' / ')}`).toEqual([]);
    });
});
