// @ts-check
// SAMPL-2-35: 목록 행의 수정·삭제 버튼이 화면 안에 있어야 한다
//
// 목록 표가 가로로 넘치는데(`.table-wrapper` scrollWidth 1506 vs clientWidth 1238)
// 관리(수정·삭제) 열이 그 넘친 영역에 있어 **1280 화면에서는 보이지 않았다.**
// 담당자는 수정하려면 매번 가로 스크롤을 해야 했다. 5개 시료 타입 전부 그랬다.
//
// E2E도 같은 이유로 막혔고, 그 우회(`force: true`)가 클릭을 무효로 만들면서
// 테스트는 통과시켜 **SAMPL-1-160 오진**을 낳았다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const EXPECTED_VERSION = require('../../package.json').version;

/** 시료 타입별 목록 진입 정보 */
const TYPES = [
    { name: '토양', path: '/soil/', mgr: 'soilManager' },
    { name: '수질', path: '/water/', mgr: 'waterManager' },
    { name: '퇴비', path: '/compost/', mgr: 'compostManager' },
    { name: '잔류농약', path: '/pesticide/', mgr: 'pesticideManager' },
    { name: '중금속', path: '/heavy-metal/', mgr: 'heavyMetalManager' },
];

async function openList(page, type) {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const res = await page.goto(type.path);
    expect(res && res.status(), `docs${type.path} 없음 — \`npm run build\` 먼저`).toBeLessThan(400);
    // ⚠️ 매니저 **객체**만 기다리면 안 된다. 수질·중금속은 `tableBody` 바인딩이 그보다
    //    늦게 끝나고(`cacheElements`가 아직 안 돌았다), 그 사이에 데이터를 심으면
    //    `renderLogs`의 `if (this.tableBody)` 폴백이 **조용히 0행을 렌더한다** —
    //    예외도 콘솔 오류도 없다. 그러면 뒤쪽 단언이 "버튼이 화면 밖"이라고 실패해
    //    원인을 감춘다. 실제로 main에서 14건이 이 사유로 빨간불이었다 (SAMPL-2-36).
    await page.waitForFunction(
        (m) => { const mgr = /** @type {any} */ (window)[m]; return !!mgr && !!mgr.tableBody; },
        type.mgr,
        { timeout: 15000 }
    );
    expect(
        await page.evaluate(() => /** @type {any} */ (window).APP_VERSION),
        'docs/의 APP_VERSION이 package.json과 다르다 — 빌드 누락이거나 다른 프로젝트다'
    ).toBe(EXPECTED_VERSION);

    // ⚠️ **3건**을 심는다. 1건만 심으면 짝수 행이 없어 줄무늬 차이가 나지 않고,
    //    배경 검사가 `white == white`로 항상 통과한다 — 실제로 그렇게 무효했다
    //    (배경을 흰색 고정으로 되돌리는 변이가 통과했다).
    await page.evaluate((m) => {
        const mgr = /** @type {any} */ (window)[m];
        mgr.sampleLogs = [1, 2, 3].map((i) => ({
            id: i === 1 ? 'row1' : `row${i}`,
            receptionNumber: String(i),
            name: `민원인${i}`,
            date: '2026-08-20',
            phoneNumber: `010-1234-567${i}`,
            address: `봉화군 봉화읍 문단리 ${220 + i}`,
            parcels: [{
                id: `p${i}`, lotAddress: `문단리 ${220 + i}`, subLots: [],
                crops: [{ name: '고추', area: '100' }],
            }],
        }));
        if (typeof mgr.filterAndRenderLogs === 'function') mgr.filterAndRenderLogs();
        if (typeof mgr.switchView === 'function') mgr.switchView('list');
    }, type.mgr);
    await page.waitForTimeout(400);

    // 심은 데이터가 실제로 그려졌는지 **여기서** 확인한다. 0행인 채로 진행하면
    // 모든 후속 단언이 엉뚱한 사유로 실패한다 (SAMPL-2-36).
    //
    // ⚠️ `not.toHaveCount(0)`으로는 부족하다 (독립 리뷰 지적) — 1건만 그려져도,
    //    우리가 심지 않은 잔여 데이터가 그려져도 통과한다. 그래서 두 가지를 본다:
    //      (1) **3건 전부** 그려졌는가 — `.btn-edit`은 행마다 1개다.
    //          `tr` 수로 세면 안 된다. 토양은 농가 구분선 행이 끼어 5행이 된다.
    //      (2) 그것이 **우리가 심은 id**인가 — 페이지가 자체 로드한 데이터일 수 있다.
    //    `toHaveCount`는 자동 재시도하므로, 늦게 끝난 초기화가 행을 덮어써도 잡힌다.
    await expect(
        page.locator('.btn-edit'),
        '심은 3건이 모두 렌더되지 않았다 — 목록 렌더 경로가 조용히 죽었다'
    ).toHaveCount(3);
    await expect(
        page.locator('.btn-edit[data-id="row1"]'),
        '그려진 행이 우리가 심은 레코드가 아니다 — 페이지 자체 데이터를 검사하고 있다'
    ).toHaveCount(1);
}

for (const type of TYPES) {
    test.describe(`${type.name} 목록 행 버튼 (SAMPL-2-35)`, () => {
        // 🚨 실사용 문제. 1280 화면(흔한 노트북)에서 수정 버튼이 화면 밖이면
        //    담당자는 매번 가로로 스크롤해야 한다.
        test('수정 버튼이 화면 안에 있다', async ({ page }) => {
            await openList(page, type);

            const geo = await page.evaluate(() => {
                const b = document.querySelector('.btn-edit');
                if (!b) return null;
                const r = b.getBoundingClientRect();
                const wrap = document.querySelector('.table-wrapper');
                return {
                    right: Math.round(r.x + r.width),
                    left: Math.round(r.x),
                    viewportW: innerWidth,
                    // 표가 실제로 넘치는가 — 이 조건이 없으면 결함을 재현할 수 없다
                    overflowX: wrap ? wrap.scrollWidth - wrap.clientWidth : 0,
                };
            });
            if (!geo) throw new Error('.btn-edit을 찾지 못했다 — 목록이 렌더되지 않았다');

            // ⚠️ 표가 넘치지 않으면 이 테스트는 아무것도 증명하지 못한다
            //    (독립 모델 리뷰 지적: fixture가 화면 폭에 맞아버리면 결함을 놓친다).
            expect(
                geo.overflowX,
                '표가 가로로 넘치지 않아 이 테스트가 무의미하다 — 열이 줄었거나 화면이 넓다'
            ).toBeGreaterThan(0);

            expect(
                geo.right,
                `수정 버튼이 화면 밖이다 (오른쪽 끝 ${geo.right}px > 뷰포트 ${geo.viewportW}px). ` +
                '담당자가 가로 스크롤 없이는 누를 수 없다'
            ).toBeLessThanOrEqual(geo.viewportW);
            expect(geo.left, '수정 버튼이 화면 왼쪽 밖이다').toBeGreaterThanOrEqual(0);
        });

        // 🚨 눈으로 보고 발견한 결함 — 테스트가 없으면 다시 깨진다.
        //    `.data-table thead th`가 이미 `z-index: 10`인데 관리 헤더에 3을 줘서
        //    **다른 헤더 셀이 그 위를 덮었다.** 버튼은 제자리인데 헤더만 옆 열 제목
        //    ("수령 방법")이 보이는 상태였다 — 셀과 제목이 어긋나 읽을 수 없다.
        test('관리 헤더가 다른 열 제목에 가려지지 않는다', async ({ page }) => {
            await openList(page, type);

            const out = await page.evaluate(() => {
                const th = document.querySelector('.data-table th.col-action');
                if (!th) return null;
                const r = th.getBoundingClientRect();
                const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
                return {
                    isSelf: top === th || th.contains(top),
                    covering: top ? `${top.tagName}.${String(top.className).slice(0, 30)}` : null,
                    coveringText: top ? (top.textContent || '').trim().slice(0, 10) : null,
                };
            });
            if (!out) throw new Error('관리 헤더를 찾지 못했다');

            expect(
                out.isSelf,
                `관리 헤더가 가려졌다 — 그 자리에 ${out.covering}("${out.coveringText}")가 보인다`
            ).toBe(true);
        });

        // 고정 셀이 흰색으로 고정되면 행 배경(줄무늬·hover·완료)이 그 칸에서 끊긴다.
        //
        // ⚠️ **hover로 검사한다.** 다른 방법은 전부 막혔다(실측):
        //    - 줄무늬: 토양은 농가 구분선(`tr.farm-separator`)이 사이에 끼어
        //      데이터 행이 전부 홀수가 되므로 `nth-child(even)`이 걸리지 않는다
        //    - 완료 행: fixture의 `isComplete`는 기본 필터("미완료")에 걸러지고,
        //      렌더 후 `row-completed` 클래스를 붙여도 배경이 바뀌지 않는다
        //      (더 높은 특이도의 규칙이 덮는 것으로 보이나 원인 미확정)
        //    hover는 모든 타입에서 색이 바뀌고 실제 사용자 동작이기도 하다.
        test('관리 셀이 불투명하면서 hover 강조를 반영한다', async ({ page }) => {
            await openList(page, type);

            // ⚠️ **데이터 행만** 본다. 토양 목록의 `tr.farm-separator`(td 1개)에는
            //    관리 셀이 없어 전체 행을 훑으면 `null`로 오탐한다(실측).
            const row = page.locator('.data-table tbody tr').filter({
                has: page.locator('td.col-action'),
            }).first();
            await expect(row).toBeAttached();

            // ⚠️ 마우스를 먼저 표 밖으로 치운다. 이전 동작의 잔여 위치가 그 행 위에 있으면
            //    `before`가 이미 hover 상태라 `after`와 같아져 간헐 실패한다(전체 병렬 실행에서 실측).
            await page.mouse.move(0, 0);
            await page.waitForTimeout(150);

            const before = await page.evaluate(() => {
                const tr = [...document.querySelectorAll('.data-table tbody tr')]
                    .find((r) => r.querySelector('td.col-action'));
                if (!tr) return { row: null, cell: null };
                const td = tr.querySelector('td.col-action');
                return { row: getComputedStyle(tr).backgroundColor,
                         cell: td ? getComputedStyle(td).backgroundColor : null };
            });

            await row.hover();
            // ⚠️ 고정 대기(200ms)로는 전체 스위트 병렬 실행에서 간헐 실패했다.
            //    hover 색이 실제로 반영될 때까지 폴링한다.
            await expect
                .poll(async () => page.evaluate(() => {
                    const tr = [...document.querySelectorAll('.data-table tbody tr')]
                        .find((r) => r.querySelector('td.col-action'));
                    return tr ? getComputedStyle(tr).backgroundColor : null;
                }), { timeout: 5000 })
                .not.toBe(before.row);

            const after = await page.evaluate(() => {
                const tr = [...document.querySelectorAll('.data-table tbody tr')]
                    .find((r) => r.querySelector('td.col-action'));
                if (!tr) return { row: null, cell: null };
                const td = tr.querySelector('td.col-action');
                return { row: getComputedStyle(tr).backgroundColor,
                         cell: td ? getComputedStyle(td).backgroundColor : null };
            });

            // hover로 행 색이 실제로 바뀌어야 이 검사가 의미를 갖는다
            expect(
                after.row,
                `hover해도 행 배경이 그대로(${after.row})라 이 검사가 무의미하다`
            ).not.toBe(before.row);

            // ⚠️ **"셀 == 행"을 요구하지 않는다.** 그건 틀린 계약이었다.
            //    행의 hover 강조는 반투명(`rgba(...,0.24)`)인데 sticky 셀은 다른 셀 위에
            //    떠 있으므로 **불투명**이어야 한다 — 반투명이면 뒤 글자가 비친다
            //    (실측: `inherit`으로 색을 맞췄더니 alpha 0.05가 되어 전화번호가 비쳤다.
            //     색은 "같았으므로" 그 검사를 통과했다).
            //    이 저장소의 기존 `sticky-col`이 쓰는 방식이 정답이다:
            //    **불투명한 유사색**을 페이지별로 둔다.
            //
            //    그래서 계약은 둘이다: (1) 불투명 (2) hover에서 색이 바뀐다(강조가 전달된다).
            const alpha = (c) => {
                const m = String(c).match(/rgba?\(([^)]+)\)/);
                if (!m) return null;
                const parts = m[1].split(',').map((v) => parseFloat(v));
                return parts.length > 3 ? parts[3] : 1;
            };

            expect(
                alpha(after.cell),
                `hover 시 관리 셀이 반투명하다(${after.cell}) — 뒤 셀 글자가 비친다`
            ).toBe(1);
            expect(
                alpha(before.cell),
                `기본 상태에서 관리 셀이 반투명하다(${before.cell}) — 뒤 셀 글자가 비친다`
            ).toBe(1);
            expect(
                after.cell,
                `hover해도 관리 셀 색이 그대로(${after.cell})다 — 고정 셀에서 강조가 끊긴다`
            ).not.toBe(before.cell);
        });

        // 🚨 적대적 검증이 실측한 기능 차단.
        //    공익직불제 모드의 기준년도·차수는 셀 안 `<select>`로 직접 편집하는데,
        //    고정된 관리 열이 그 위를 덮어 **드롭다운을 누르면 삭제 버튼이 눌렸다.**
        //    그 모드에서는 고정을 푼다(사용자 결정).
        test('공익직불제 모드에서는 관리 열이 인라인 편집을 덮지 않는다', async ({ page }) => {
            await openList(page, type);

            const out = await page.evaluate(() => {
                const table = document.getElementById('logTable') || document.querySelector('.data-table');
                if (!table) return { skipped: '표를 찾지 못했다' };
                if (!table.classList.contains('gongik-on')) table.classList.add('gongik-on');

                const td = document.querySelector('td.col-action');
                if (!td) return { skipped: '관리 셀이 없다' };
                const pos = getComputedStyle(td).position;

                // 관리 열이 덮는 다른 셀이 있는지 (같은 행 기준)
                const tr = td.closest('tr');
                if (!tr) return { skipped: '행을 찾지 못했다' };
                const ar = td.getBoundingClientRect();
                const overlaps = [...tr.querySelectorAll('td')]
                    .filter((c) => c !== td)
                    .map((c) => {
                        const r = c.getBoundingClientRect();
                        return Math.min(r.right, ar.right) - Math.max(r.left, ar.left);
                    })
                    .filter((ov) => ov > 1);
                return { pos, maxOverlap: overlaps.length ? Math.round(Math.max(...overlaps)) : 0 };
            });

            expect(out.skipped, `건너뜀: ${out.skipped}`).toBeUndefined();
            expect(out.pos, '공익직불제 모드인데 관리 열이 고정돼 있다').toBe('static');
            expect(
                out.maxOverlap,
                `관리 열이 다른 셀을 ${out.maxOverlap}px 덮는다 — 인라인 편집이 막힌다`
            ).toBe(0);
        });

        // 🚨 이것이 SAMPL-1-160 오진의 직접 원인이었다.
        //    `force` 없이 클릭이 핸들러에 닿아야 한다.
        test('수정 버튼을 force 없이 클릭할 수 있고 핸들러에 닿는다', async ({ page }) => {
            await openList(page, type);

            // ⚠️ **클릭 도달 자체**를 계측한다. 처음에는 `editSample`을 가로챘는데
            //    잔류농약은 그것을 거치지 않고 `populateFormForEdit`을 직접 부른다
            //    (`pesticide-script.js:2447-2453`). 페이지마다 핸들러가 달라 공통 지점이 없다.
            await page.evaluate(() => {
                /** @type {any} */ (window).__hitId = null;
                document.addEventListener('click', (e) => {
                    const btn = /** @type {any} */ (e.target)?.closest?.('.btn-edit');
                    if (btn) /** @type {any} */ (window).__hitId = String(btn.dataset.id);
                }, true);
            });

            // ⚠️ `force: true`를 쓰지 않는다. 그 우회가 클릭을 무효로 만들면서도
            //    테스트는 통과시켜, 폼이 안 채워진 것을 제품 결함으로 오진하게 했다(SAMPL-1-160).
            await page.locator('.btn-edit').first().click({ timeout: 10000 });

            expect(
                await page.evaluate(() => /** @type {any} */ (window).__hitId),
                '클릭이 수정 버튼에 닿지 않았다 — 다른 요소가 위를 덮고 있다'
            ).toBe('row1');

            // 도달만으로는 부족하다 — 실제로 편집 화면으로 전환됐는지 본다.
            //
            // ⚠️ 처음에는 `!formView.classList.contains('hidden')`으로 봤는데 **무효했다**
            //    (독립 모델 리뷰 지적). 이 앱의 뷰는 `hidden`이 아니라 **`active` 클래스**로
            //    전환하므로(`switchView`) 목록 상태에서도 항상 `true`가 나왔다.
            //    또 통과시키려고 넣은 단언이 아무것도 검증하지 않은 사례다.
            const activeView = await page.evaluate(() => {
                const el = document.querySelector('.view.active');
                return el ? el.id : null;
            });
            expect(activeView, '클릭은 닿았는데 편집 화면으로 전환되지 않았다').toBe('formView');
        });
    });
}
