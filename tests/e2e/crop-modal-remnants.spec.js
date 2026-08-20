// @ts-check
// SAMPL-2-31: 농약·중금속의 작물 모달 잔해 제거
//
// 지운 것: 농약 `#cropModal` 마크업(열리는 경로가 없고 목록에 아무것도 렌더되지 않았다),
//          농약·중금속의 죽은 배선, 그리고 **남은 사용처가 0인** CSS 규칙들.
//
// ⚠️ 이 테스트의 목적은 "지웠는가"보다 **"살아 있어야 할 것이 안 깨졌는가"** 다.
//    CSS 삭제는 조용히 화면을 망가뜨린다 — `.crop-list`는 토양이 **두 곳**에서 쓰고
//    (작물 검색 모달의 `ul`, 레코드 상세의 태그 `div`), 모달 항목은 `.crop-row-*`로
//    옮겨갔지만 `.crop-list li` 규칙은 여전히 그 `li`에 적용된다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const EXPECTED_VERSION = require('../../package.json').version;

async function open(page, path, ready) {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const res = await page.goto(path);
    expect(res && res.status(), `docs${path} 없음 — \`npm run build\` 먼저`).toBeLessThan(400);
    await page.waitForFunction(ready, { timeout: 15000 });
    expect(
        await page.evaluate(() => /** @type {any} */ (window).APP_VERSION),
        'docs/의 APP_VERSION이 package.json과 다르다 — 빌드 누락이거나 다른 프로젝트다'
    ).toBe(EXPECTED_VERSION);
}

test.describe('작물 모달 잔해 제거 (SAMPL-2-31)', () => {
    // ── 살아 있어야 하는 것 ────────────────────────────────────────────────

    test('토양 작물 검색 모달의 목록 항목 스타일이 살아 있다', async ({ page }) => {
        await open(page, '/soil/', () => !!window.soilManager && !!window.CropSearch);

        const style = await page.evaluate(() => {
            const modal = document.getElementById('cropModal');
            if (!modal) return null;
            modal.classList.remove('hidden');
            const ul = document.getElementById('cropList');
            if (!ul) return null;
            // ⚠️ 항목을 **둘** 넣는다. `.crop-list li:last-child`가 구분선을 없애므로
            //    하나만 넣고 첫 항목의 `border-bottom`을 보면 항상 `0px`이다.
            const li = document.createElement('li');
            li.className = 'crop-row';
            li.textContent = '고추';
            ul.appendChild(li);
            const li2 = document.createElement('li');
            li2.className = 'crop-row';
            li2.textContent = '배추';
            ul.appendChild(li2);
            const cs = getComputedStyle(li);
            const wrap = document.querySelector('.crop-list-wrapper');
            const wcs = wrap ? getComputedStyle(wrap) : null;
            return {
                display: cs.display,
                paddingLeft: cs.paddingLeft,
                borderBottomWidth: cs.borderBottomWidth,
                cursor: cs.cursor,
                wrapperBorder: wcs ? wcs.borderTopWidth : null,
                // ⚠️ `max-height`가 아니라 `height`를 본다. `#cropModal .crop-list-wrapper`가
                //    SAMPL-1-157(검색 중 모달이 흔들리던 문제)에서 **의도적으로**
                //    `max-height: none` + 고정 높이로 덮어쓴다.
                wrapperHeight: wcs ? wcs.height : null,
                wrapperMaxHeight: wcs ? wcs.maxHeight : null,
                wrapperOverflowY: wcs ? wcs.overflowY : null,
            };
        });

        expect(style, '토양 작물 검색 모달이 없다 — 이 테스트가 무의미하다').toBeTruthy();
        const s = /** @type {NonNullable<typeof style>} */ (style);
        // `.crop-list li` 규칙 (남겨야 하는 것)
        expect(s.display, '.crop-list li 규칙이 사라졌다').toBe('flex');
        expect(s.paddingLeft, '.crop-list li 여백이 사라졌다').not.toBe('0px');
        expect(s.borderBottomWidth, '.crop-list li 구분선이 사라졌다').not.toBe('0px');
        expect(s.cursor).toBe('pointer');
        // ⚠️ `.crop-list`의 `list-style: none`은 단언하지 않는다 — Tailwind preflight가
        //    이미 `ul`의 불릿을 없애므로 그 규칙을 지워도 통과한다(변이 검증 실측).
        //    지키지 못하는 단언은 거짓 안전감만 남긴다.
        // `.crop-list-wrapper` / `#cropModal .crop-list-wrapper`
        expect(s.wrapperBorder, '.crop-list-wrapper 테두리가 사라졌다').not.toBe('0px');
        // ⚠️ `height`만 보면 안 된다 — 블록 요소의 computed height는 언제나 px라
        //    `not.toBe('auto')`는 **구조적으로 항상 참**이다(실측으로 겪었다).
        //    `#cropModal` 전용 규칙만이 `max-height`를 `none`으로 만든다 — 그게 판별 신호다.
        expect(s.wrapperMaxHeight, '작물 검색 모달의 고정 높이 규칙이 사라졌다 (SAMPL-1-157 회귀)')
            .toBe('none');
        // ⚠️ 이 줄은 **높이 회귀 방어가 아니라 가시성 확인**이다. 고정 높이 규칙을 지워도
        //    항목이 있으면 높이는 양수라 통과한다 — 판별 신호는 바로 위의 `max-height: none`이다.
        //    (모달이 `display:none`이면 `height: 'auto'` → `NaN > 0` → 실패한다.)
        expect(parseFloat(String(s.wrapperHeight)), '모달이 보이지 않는다').toBeGreaterThan(0);
        expect(s.wrapperOverflowY, '목록 스크롤이 사라졌다').toBe('auto');
    });

    // 🚨 **실물이 있는 자리에서 렌더한다.** 처음에는 `document.body`에 노드를 붙였는데,
    //    실제 태그는 `soil-script.js`가 **`table.result-table` 안**에 만든다
    //    (`.result-table .crop-list` / `.result-table .crop-tag`가 눈에 보이는 값을 결정한다).
    //    떼어 놓고 재면 그 규칙들이 애초에 매치되지 않아, 누군가 그것을 "중복 같다"며
    //    지워도 이 테스트는 **그대로 통과**한다 — 레코드 상세만 조용히 깨진다 (코드리뷰 실측).
    test('토양 레코드 상세의 작물 태그 스타일이 살아 있다', async ({ page }) => {
        await open(page, '/soil/', () => !!window.soilManager);

        const style = await page.evaluate(() => {
            const table = document.createElement('table');
            table.className = 'result-table';
            const td = document.createElement('td');
            const tr = document.createElement('tr');
            const tbody = document.createElement('tbody');
            const box = document.createElement('div');
            box.className = 'crop-list';
            const tag = document.createElement('span');
            tag.className = 'crop-tag';
            tag.textContent = '고추: 100m²';
            box.appendChild(tag);
            td.appendChild(box); tr.appendChild(td); tbody.appendChild(tr);
            table.appendChild(tbody); document.body.appendChild(table);
            const cs = getComputedStyle(tag);
            const bcs = getComputedStyle(box);
            return {
                display: cs.display,
                borderRadius: cs.borderRadius,
                padding: cs.paddingLeft,
                bg: cs.backgroundColor,
                boxDisplay: bcs.display,
                boxGap: bcs.gap,
                boxWrap: bcs.flexWrap,
            };
        });

        // 태그: `.result-table .crop-tag`가 결정한다 (flex 자식이라 display는 `flex`로 blockify된다)
        expect(style.display, '.crop-tag 규칙이 사라졌다').toBe('flex');
        expect(style.padding).not.toBe('0px');
        expect(style.bg, '.crop-tag 배경이 사라졌다').not.toBe('rgba(0, 0, 0, 0)');
        // ⚠️ **디자인 값이 아니라 캐스케이드를 고정한다.** 일반 `.crop-tag`는 알약(999px),
        //    표 안 변형은 사각(작은 값)이다. `.result-table .crop-tag`를 지우면 일반 규칙이
        //    이겨 알약이 되므로 그걸 판별 신호로 쓴다 — 표 변형의 수치를 바꾸는
        //    정상적인 디자인 변경에는 걸리지 않는다.
        expect(style.borderRadius, '.crop-tag 둥근 모서리가 사라졌다').not.toBe('0px');
        expect(style.borderRadius, '.result-table .crop-tag가 사라져 알약 모양으로 바뀌었다')
            .not.toBe('999px');
        // 컨테이너: `.result-table .crop-list` — 지우면 태그가 줄바꿈 없이 세로로 쌓인다
        expect(style.boxDisplay, '.result-table .crop-list가 사라져 태그가 세로로 쌓인다').toBe('flex');
        expect(style.boxGap, '태그 사이 간격이 사라졌다').not.toBe('normal');
        expect(style.boxWrap, '태그가 줄바꿈되지 않는다').toBe('wrap');
    });

    // ── 지운 것이 정말 없는가 ──────────────────────────────────────────────

    test('농약 페이지에 작물 검색 모달 잔해가 없다', async ({ page }) => {
        await open(page, '/pesticide/', () => !!(/** @type {any} */ (window).pesticideManager));

        const found = await page.evaluate(() => ({
            cropModal: !!document.getElementById('cropModal'),
            cropList: !!document.getElementById('cropList'),
            selectedTags: !!document.getElementById('selectedCropTags'),
            confirmBtn: !!document.getElementById('confirmCropSelection'),
            selectedSection: document.querySelectorAll('.selected-section').length,
        }));

        expect(found.cropModal, '고아 모달 마크업이 남아 있다').toBe(false);
        expect(found.cropList).toBe(false);
        expect(found.selectedTags).toBe(false);
        expect(found.confirmBtn).toBe(false);
        expect(found.selectedSection).toBe(0);
    });

    test('농약·중금속 페이지가 콘솔 오류 없이 뜬다', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (e) => errors.push(String(e)));
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

        // ⚠️ 준비 조건은 **페이지 전용 매니저**다. `readyState === 'complete'`만 보면
        //    스크립트가 통째로 로드되지 않아도 참이 되고, 아래 네트워크 오류 필터가
        //    그 실패까지 걸러내 **초록불인데 앱이 안 뜬 상태**가 된다 (독립 모델 지적).
        const pages = [
            ['/pesticide/', () => !!(/** @type {any} */ (window).pesticideManager)],
            ['/heavy-metal/', () => !!(/** @type {any} */ (window).heavyMetalManager)],
        ];
        for (const [path, ready] of pages) {
            await open(page, path, /** @type {any} */ (ready));
            await page.waitForTimeout(300);
        }
        // 외부 API(주소·MRL) 호출 실패는 이 티켓과 무관하다. 다만 **앱 자산**의 로드 실패는
        // 걸러내지 않는다 — 그게 삭제로 깨진 신호일 수 있다.
        const relevant = errors.filter((e) => {
            const isAppAsset = /\/assets\/|\.js\b|\.css\b/.test(e);
            if (isAppAsset) return true;
            return !/Failed to load resource|net::|ERR_/i.test(e);
        });
        expect(relevant, `삭제로 인한 오류: ${relevant.join(' | ')}`).toEqual([]);
    });

    // ⚠️ `#cropModal`·`#searchCropBtn`의 부재는 **단언하지 않는다.** 중금속 HTML에는
    //    애초에 그 id가 없었으므로(그래서 배선이 도달 불가였다) 변경 전에도 통과한다 —
    //    구조적으로 항상 참인 단언이다 (적대적 검증 지적).
    //    검증력이 있는 것은 메서드 제거, 그리고 작물 칸이 **평범한 자유 입력**으로
    //    남아 있는지다(검색 버튼이 되살아나면 여기서 걸린다).
    test('중금속에 도달 불가였던 작물 검색 배선이 없다', async ({ page }) => {
        await open(page, '/heavy-metal/', () => !!(/** @type {any} */ (window).heavyMetalManager));

        const found = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).heavyMetalManager;
            const cropInput = document.getElementById('cropName');
            return {
                method: !!(mgr && typeof mgr.setupCropSearch === 'function'),
                cropInputExists: !!cropInput,
                cropInputType: cropInput ? cropInput.getAttribute('type') : null,
                searchAffordance: document.querySelectorAll(
                    '.btn-search-crop, .crop-input-wrapper, #searchCropBtn').length,
            };
        });

        expect(found.method, 'setupCropSearch가 아직 있다').toBe(false);
        expect(found.cropInputExists, '작물 입력 칸까지 사라졌다').toBe(true);
        expect(found.cropInputType, '작물 칸이 자유 입력이 아니다').toBe('text');
        expect(found.searchAffordance, '작물 검색 버튼 잔해가 남아 있다').toBe(0);
    });

    // ── 티켓의 주장 자체를 검증한다 ────────────────────────────────────────
    //
    // 🚨 지금까지의 테스트는 **남긴 것**과 **농약·중금속의 부재**만 봤다. 이 티켓이
    //    실제로 주장하는 것은 "지운 선택자의 사용처가 **어느 페이지에도** 0"인데,
    //    그걸 검증하는 단언이 하나도 없었다 (적대적 검증 지적).
    //    지운 규칙이 사실 어딘가에 필요했더라도 350건이 전부 초록이었다.
    const DELETED = [
        '.btn-text-danger', '.selected-section', '.tag-container', '.no-selection',
        '.crop-list li.selected', '.crop-list li input[type="checkbox"]',
        '.crop-list .crop-name', '.crop-list .crop-category', '.crop-list .crop-code',
        '.crop-tag .remove-tag', '.btn-search-crop', '.crop-input-wrapper',
    ];
    // `style.css`를 싣는 페이지 전부
    const PAGES = [
        '/soil/', '/water/', '/compost/', '/heavy-metal/', '/pesticide/',
        '/water-analysis/', '/compost-analysis/', '/heavy-metal-analysis/',
        '/pesticide-analysis/', '/heuktoram/', '/settings/',
    ];

    // ⚠️ 라이트·다크를 **한 테스트에서** 본다. 페이지마다 두 번 열면 로드가 22회가 되고,
    //    병렬 실행 부하가 늘어 다른 스펙(목록 행 렌더)이 타임아웃으로 흔들렸다(실측).
    //    선택자 매칭은 테마와 무관하지만, 테마별 규칙도 지웠으므로 양쪽에서 확인한다.
    for (const path of PAGES) {
        test(`${path}: 지운 선택자를 쓰는 요소가 없다 (라이트·다크)`, async ({ page }) => {
            page.on('dialog', (d) => d.dismiss().catch(() => {}));
            const res = await page.goto(path);
            expect(res && res.status(), `docs${path} 없음`).toBeLessThan(400);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(400);

            const found = await page.evaluate((sels) => {
                // 숨겨진 모달 안까지 본다 — `hidden` 상태로 살아 있는 마크업을 놓치지 않는다
                document.querySelectorAll('.modal.hidden').forEach((m) => m.classList.remove('hidden'));
                /** @type {Record<string, any>} */
                const hits = {};
                for (const theme of ['light', 'dark']) {
                    document.documentElement.setAttribute('data-theme', theme);
                    for (const sel of sels) {
                        let n = 0;
                        try { n = document.querySelectorAll(sel).length; } catch { n = -1; }
                        if (n !== 0) hits[`${theme}:${sel}`] = n;
                    }
                }
                return hits;
            }, DELETED);

            expect(found, `지운 선택자가 아직 쓰인다: ${JSON.stringify(found)}`).toEqual({});
        });
    }
});
