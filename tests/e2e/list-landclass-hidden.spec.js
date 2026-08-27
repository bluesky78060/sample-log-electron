// @ts-check
// SAMPL-1-173: 토양 목록의 '경지구분' 열은 탭이 구분 하나를 가리킬 때만 감춘다
//
// 그때는 목록 상단의 경지구분 탭 셀렉트가 이미 답을 보여 주어 열이 중복이었다.
// 값을 확인해야 할 때는 '전체 보기' 토글로 되살린다 — 우편번호 열과 같은 방식이라
// **정보가 사라지는 것이 아니라 접히는** 것이다. 그 두 상태를 함께 단정한다.
//
// 🚨 '전체 경지구분' 탭은 예외다 (독립 리뷰 MAJOR-1). 12개 구분의 행이 한 화면에
//    섞이는데 탭 표시값은 "전체 경지구분"뿐이고, 채번이 경지구분 단위로 독립이라
//    **같은 접수번호가 여러 줄로 보인다.** 그 이유를 설명하는 열을 감추면 안 된다.
//
// ⚠️ CSS 규칙 문자열이 아니라 **화면에 보이는지**를 본다. `display:none`을 다른
//    규칙이 나중에 덮어써도 이 단언은 잡아낸다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

test.describe('토양 목록 경지구분 열 감춤', () => {
    test.beforeEach(async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        const res = await page.goto('/soil/');
        expect(res && res.status(), 'docs/soil/ 없음 — `npm run build` 먼저').toBeLessThan(400);
        await page.waitForFunction(
            () => { const m = /** @type {any} */ (window).soilManager; return !!m && !!m.tableBody; },
            null,
            { timeout: 15000 }
        );
        // 열이 실제로 그려져야 한다 — 0행이면 td 단언이 의미를 잃는다
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.sampleLogs = [{
                id: 'row1', receptionNumber: '1', name: '민원인1', date: '2026-08-20',
                landClass1: '농가의뢰', phoneNumber: '010-1234-5671',
                address: '봉화군 봉화읍 문단리 221',
                parcels: [{ id: 'p1', lotAddress: '문단리 221', subLots: [], crops: [{ name: '고추', area: '100' }] }],
            }];
            if (typeof mgr.filterAndRenderLogs === 'function') mgr.filterAndRenderLogs();
            if (typeof mgr.switchView === 'function') mgr.switchView('list');
        });
        await expect(page.locator('#logTableBody tr')).toHaveCount(1);
    });

    test('기본 보기에서는 경지구분 열이 보이지 않는다', async ({ page }) => {
        // ⚠️ `toBeHidden()`만으로는 **열이 마크업에서 사라진 경우도 통과한다.**
        //    감춘 것과 지운 것은 다르다 — 존재를 먼저 못박는다.
        await expect(page.locator('#logTable th.col-landclass1')).toHaveCount(1);
        await expect(page.locator('#logTableBody td.col-landclass1')).toHaveCount(1);
        await expect(page.locator('#logTable th.col-landclass1')).toBeHidden();
        await expect(page.locator('#logTableBody td.col-landclass1')).toBeHidden();
    });

    // SAMPL-1-173: 구분선(farm-separator)이 덮는 열 수는 실제로 그려진 헤더 셀에서 센다.
    // 예전 하드코딩(18/19)은 기본 숨김 열을 세지 않아 2 컸다 — 브라우저가 잘라내
    // 화면에는 드러나지 않았지만, 다음에 열을 건드리는 사람이 믿을 계산이 틀려 있었다.
    test('농가 구분선이 보이는 열 수와 정확히 맞는다', async ({ page }) => {
        // 성명이 다른 두 행이 있어야 구분선이 생긴다
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.sampleLogs.push({
                id: 'row2', receptionNumber: '2', name: '이농가', date: '2026-08-20',
                landClass1: '농가의뢰', phoneNumber: '010-1234-5672',
                address: '봉화군 봉화읍 문단리 222',
                parcels: [{ id: 'p2', lotAddress: '문단리 222', subLots: [], crops: [{ name: '고추', area: '100' }] }],
            });
            mgr.filterAndRenderLogs();
        });
        const r = await page.evaluate(() => {
            const vis = (el) => getComputedStyle(el).display !== 'none';
            const sep = /** @type {HTMLTableCellElement|null} */ (
                document.querySelector('#logTable tbody tr.farm-separator td'));
            const shown = Array.from(document.querySelectorAll('#logTable thead th')).filter(vis).length;
            return { colSpan: sep ? sep.colSpan : null, shown };
        });
        expect(r.colSpan, '구분선이 없다 — 이 시험이 아무것도 검증하지 못한다').not.toBeNull();
        expect(r.colSpan).toBe(r.shown);
    });

    // 🚨 '전체 보기' 토글은 **다시 그리지 않는다** — 클래스만 바꾼다. 그래서 감춰 뒀던
    //    열이 되살아나도 이미 그려진 구분선은 렌더 당시의 colSpan을 들고 있었다
    //    (독립 리뷰 실측: 17로 남아 선이 217px 짧게 끊겼다).
    test('전체 보기로 열이 되살아나도 구분선이 따라 늘어난다', async ({ page }) => {
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.sampleLogs.push({
                id: 'row2', receptionNumber: '2', name: '이농가', date: '2026-08-20',
                landClass1: '농가의뢰', phoneNumber: '010-1234-5672',
                address: '봉화군 봉화읍 문단리 222',
                parcels: [{ id: 'p2', lotAddress: '문단리 222', subLots: [], crops: [{ name: '고추', area: '100' }] }],
            });
            mgr.filterAndRenderLogs();
        });
        const read = () => page.evaluate(() => {
            const vis = (el) => getComputedStyle(el).display !== 'none';
            const sep = /** @type {HTMLTableCellElement|null} */ (
                document.querySelector('#logTable tbody tr.farm-separator td'));
            return {
                colSpan: sep ? sep.colSpan : null,
                shown: Array.from(document.querySelectorAll('#logTable thead th')).filter(vis).length,
            };
        });
        const before = await read();
        expect(before.colSpan, '구분선이 없다 — 이 시험이 아무것도 검증하지 못한다').not.toBeNull();
        expect(before.colSpan).toBe(before.shown);

        await page.locator('#viewToggleBtn').click();
        await expect(page.locator('#logTable th.col-landclass1')).toBeVisible();
        const after = await read();
        expect(after.shown, '전체 보기인데 열이 늘지 않았다 — 시험이 무효다').toBeGreaterThan(before.shown);
        expect(after.colSpan, '구분선이 옛 열 수에 머물러 짧게 끊긴다').toBe(after.shown);
    });

    // 🚨 sticky `left`가 자연 위치보다 **크면** scrollLeft 0에서도 열을 오른쪽으로 밀어
    //    다음 열을 덮는다. 경지구분을 감추면서 CSS 바닥값이 그 유해한 쪽으로 넘어갔었다
    //    (독립 리뷰 실측: 기본 +28px, 공익직불제 +42px). 계산이 오기 전 한 프레임의 문제라
    //    앱이 써 놓은 계산 규칙을 걷어내고 첫 페인트 상태를 재현해 본다.
    test('고정 열 계산이 오기 전에도 열이 밀리지 않는다', async ({ page }) => {
        for (const tab of ['농가의뢰', '공익직불제']) {
            await page.selectOption('#landClass1Tab', tab);
            await page.waitForTimeout(300);
            const drift = await page.evaluate(() => {
                // 앱이 계산해 넣은 규칙만 걷어낸다 (측정용 -measure 스타일은 남긴다)
                document.querySelectorAll('style[id^="sticky-col-offsets-"]').forEach((el) => {
                    if ((el.textContent || '').includes('data-sticky-scope')) el.remove();
                });
                const table = /** @type {HTMLElement} */ (document.getElementById('logTable'));
                const wrap = /** @type {HTMLElement} */ (table.closest('.table-wrapper'));
                wrap.scrollLeft = 0;
                const vis = (el) => getComputedStyle(el).display !== 'none';
                const ths = Array.from(table.querySelectorAll('thead th.sticky-col')).filter(vis);
                const stuck = ths.map((t) => t.getBoundingClientRect().left);
                // 고정을 풀면 각 열의 자연 위치가 드러난다
                table.classList.add('sticky-measuring');
                const natural = ths.map((t) => t.getBoundingClientRect().left);
                table.classList.remove('sticky-measuring');
                return ths.map((t, i) => (stuck[i] - natural[i] > 1
                    ? `${t.className.split(' ')[0]}: +${(stuck[i] - natural[i]).toFixed(1)}px`
                    : null)).filter(Boolean);
            });
            expect(drift, `${tab} 탭에서 첫 페인트에 열이 밀린다: ${drift.join(' / ')}`).toEqual([]);
        }
    });

    // 결과가 0건이면 renderCurrentPage에 닿지 않는다 — renderLogs 쪽 호출만이 이 경로를 덮는다
    test('결과가 0건이어도 모드 클래스가 맞는다', async ({ page }) => {
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.sampleLogs = [];
            mgr.currentSearchFilter.landClass1 = '';
            mgr.filterAndRenderLogs();
        });
        await expect(page.locator('#logTable')).toHaveClass(/allclass-on/);
        // ⚠️ 0건이면 빈 상태 안내가 표를 대신해 표시돼 `toBeVisible()`은 면적 0으로 실패한다.
        //    여기서 볼 것은 **규칙이 적용되었는가**이지 화면에 그려졌는가가 아니다.
        expect(await page.locator('#logTable th.col-landclass1').evaluate(
            (el) => getComputedStyle(el).display
        )).toBe('table-cell');
    });

    test("'전체 경지구분' 탭에서는 감추지 않는다", async ({ page }) => {
        // 두 구분의 행을 함께 놓는다 — 이 탭의 실제 모습이다
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.sampleLogs.push({
                id: 'row2', receptionNumber: '1', name: '박직불', date: '2026-08-20',
                landClass1: '공익직불제', phoneNumber: '010-1234-5672',
                address: '봉화군 봉화읍 문단리 222',
                parcels: [{ id: 'p2', lotAddress: '문단리 222', subLots: [], crops: [{ name: '고추', area: '100' }] }],
            });
            mgr.filterAndRenderLogs();
        });
        await page.selectOption('#landClass1Tab', '');
        await expect(page.locator('#logTable')).toHaveClass(/allclass-on/);
        await expect(page.locator('#logTable th.col-landclass1')).toBeVisible();
        // 같은 접수번호 1번이 두 줄인 이유를 이 열이 설명한다
        await expect(page.locator('#logTableBody td.col-landclass1')).toHaveCount(2);
        await expect(page.locator('#logTableBody td.col-landclass1').first()).toBeVisible();

        // 구분 하나를 고르면 다시 접힌다
        await page.selectOption('#landClass1Tab', '농가의뢰');
        await expect(page.locator('#logTable')).not.toHaveClass(/allclass-on/);
        await expect(page.locator('#logTable th.col-landclass1')).toBeHidden();
    });

    test("'전체 보기'로 되살리고 다시 접을 수 있다", async ({ page }) => {
        const toggle = page.locator('#viewToggleBtn');
        await toggle.click();
        await expect(page.locator('#logTable th.col-landclass1')).toBeVisible();
        await expect(page.locator('#logTableBody td.col-landclass1')).toBeVisible();

        await toggle.click();
        await expect(page.locator('#logTable th.col-landclass1')).toBeHidden();
        await expect(page.locator('#logTableBody td.col-landclass1')).toBeHidden();
    });
});
