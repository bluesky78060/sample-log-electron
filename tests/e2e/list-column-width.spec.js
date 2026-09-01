// @ts-check
// SAMPL-1-174(토양)·SAMPL-1-176(퇴비): '전체 보기'를 켜면 열 폭이 통째로 움찔하던 것
//
// `.data-table`이 `width: 100%`라 표가 화면보다 **좁으면** 남는 폭을 모든 열이
// 나눠 갖는다. 그 상태에서 전체 보기로 열 둘(우편번호·경지구분)이 끼어들면
// 나머지가 전부 그만큼 양보한다 — 실측(1800px): **12개 열이 최대 20.6px씩** 줄었다.
//
// 필지 주소 열 하나가 남는 폭을 흡수하게 해서, 폭이 바뀌는 열을 1개로 묶었다.
// 선례: sample-log-soil SLS-1-279 (같은 증상·같은 해법).
//
// ⚠️ **넓은 화면에서만 재현된다.** 표가 화면보다 넓으면 남는 폭 자체가 없어
//    아무 열도 움직이지 않는다(1280px 실측: 0개).
//    기본 1280으로 두면 이 스펙은 늘 통과하며 아무것도 지키지 못한다.
//
// ⚠️ 2560px로 재는 이유는 **여유(headroom)** 때문이다. 1800px에서는 전체 보기 쪽
//    남는 폭이 76px뿐인데(래퍼 1758 − 최소 표 폭 1682), 경지구분 열 하나가 정확히
//    76.5px다 — 그만한 열이 하나만 더 늘면 슬랙이 사라지고 **이 시험은 실패가 아니라
//    조용히 통과한다**(움직일 폭이 없으니 아무 열도 안 움직인다). 독립 리뷰가 짚었다.
//    2560px면 여유가 836px로 열 열 개분이다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

/** 흡수 열 — 이 열만은 폭이 변해도 된다 (그러라고 만든 것이다) */
const ABSORBER = 'col-lot-address';

/**
 * 폭이 **멈출 때까지** 기다린다.
 *
 * ⚠️ 웹 폰트가 단계적으로 로드되는 동안 열 폭이 계속 커진다
 *    (`sticky-columns.js`가 기록한 실측: 32 → 35.8 → 39.1 → 40).
 *    기다리지 않고 재면 토글과 무관한 **폰트 정착분**까지 "폭이 바뀌었다"로
 *    잡혀, 실제로 17개 열이 일제히 1.25배로 보고됐다 — 측정이 흔들린 것이지
 *    앱이 잘못한 것이 아니다.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} headSelector 폭을 지켜볼 머리글 칸 선택자 (표마다 다르다)
 */
async function waitForStableWidths(page, headSelector) {
    // ⚠️ `document.fonts.ready`를 **그대로 반환하면 안 된다.** FontFaceSet은 직렬화되지
    //    않아 던지고, `.catch()`가 삼키면 폰트 대기가 통째로 사라진 채 폴링만 남는다.
    await page.evaluate(() => document.fonts?.ready.then(() => undefined)).catch(() => {});
    // ⚠️ 선택자가 아무것도 잡지 못하면 빈 문자열끼리 비교돼 **곧바로 "안정"이 된다** —
    //    기다리는 시늉만 하고 지나간다. 그 조용한 무효화를 여기서 끊는다.
    const heads = await page.locator(headSelector).count();
    expect(heads, `폭을 지켜볼 머리글 칸을 찾지 못했다: ${headSelector}`).toBeGreaterThan(0);
    await page.evaluate(() => { const w = /** @type {any} */ (window); delete w.__lastW; w.__sameW = 0; });
    // 연속 **3회** 같아야 안정으로 본다. 2회면 폰트 로드 단계 사이의 정체 구간이
    // 폴링 간격(250ms)을 넘을 때 그것을 "멈췄다"로 오인할 수 있다.
    await page.waitForFunction((sel) => {
        const w = /** @type {any} */ (window);
        const now = Array.from(document.querySelectorAll(sel))
            .map((t) => t.getBoundingClientRect().width.toFixed(2)).join(',');
        w.__sameW = (w.__lastW === now) ? w.__sameW + 1 : 0;
        w.__lastW = now;
        return w.__sameW >= 2;
    }, headSelector, { timeout: 15000, polling: 250 });
}

test.describe('목록 열 폭 안정성 (토양)', () => {
    test.use({ viewport: { width: 2560, height: 900 } });

    test.beforeEach(async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        const res = await page.goto('/soil/');
        expect(res && res.status(), 'docs/soil/ 없음 — `npm run build` 먼저').toBeLessThan(400);
        await page.waitForFunction(
            () => { const m = /** @type {any} */ (window).soilManager; return !!m && !!m.tableBody; },
            null, { timeout: 15000 }
        );
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.sampleLogs = [1, 2, 3].map((i) => ({
                id: `r${i}`, receptionNumber: String(i), name: `민원인${i}`, date: '2026-08-20',
                landClass1: '농가의뢰', subCategory: '밭', purpose: '일반재배', receptionMethod: '우편',
                phoneNumber: `010-1234-567${i}`, note: '비고', mailDate: '2026-08-21',
                address: '경상북도 봉화군 봉화읍 문단리 221번지 일원',
                parcels: [{ id: `p${i}`, lotAddress: '문단리 221-15', subLots: [], crops: [{ name: '고추', area: '1000' }] }],
            }));
            mgr.filterAndRenderLogs();
            mgr.switchView('list');
        });
        // 성명이 서로 달라 농가 구분선이 사이에 끼므로 데이터 행만 센다
        await expect(page.locator('#logTableBody tr:not(.farm-separator)')).toHaveCount(3);
    });

    /** 보이는 머리글 칸의 폭을 열 이름으로 읽는다 */
    const widths = (page) => page.evaluate(() => {
        const vis = (el) => getComputedStyle(el).display !== 'none';
        /** @type {Record<string, number>} */
        const out = {};
        Array.from(document.querySelectorAll('#logTable thead th')).forEach((t) => {
            if (!vis(t)) return;
            const key = Array.from(t.classList).find((c) => c.startsWith('col-'))
                || (t.textContent || '').trim() || '(체크)';
            out[key] = Math.round(t.getBoundingClientRect().width * 10) / 10;
        });
        return out;
    });

    test('전체 보기를 켜도 필지 주소 말고는 폭이 그대로다', async ({ page }) => {
        const wrap = await page.evaluate(() => {
            const w = /** @type {HTMLElement} */ (document.querySelector('.table-wrapper'));
            return { client: w.clientWidth, scroll: w.scrollWidth };
        });
        // 남는 폭이 없으면 애초에 재분배가 일어나지 않는다 — 그 상태로 통과해도 의미가 없다
        expect(wrap.scroll, '표가 화면보다 넓다 — 이 폭에서는 증상이 재현되지 않는다')
            .toBeLessThanOrEqual(wrap.client);

        await waitForStableWidths(page, '#logTable thead th');
        const before = await widths(page);
        // ⚠️ `col-` 클래스가 없는 열은 **머리글 텍스트**를 키로 쓴다. 같은 이름의 열이
        //    둘 생기면 뒤엣것이 앞엣것을 덮어 **한 열이 검사에서 조용히 사라진다.**
        //    실패가 아니라 침묵이므로 여기서 미리 드러낸다.
        expect(Object.keys(before).length, '열 이름이 겹쳐 일부가 검사에서 빠졌다')
            .toBe(await page.locator('#logTable thead th:visible').count());

        await page.locator('#viewToggleBtn').click();
        await expect(page.locator('#logTable th.col-landclass1')).toBeVisible();
        await waitForStableWidths(page, '#logTable thead th');
        const after = await widths(page);

        const moved = Object.keys(before)
            .filter((k) => after[k] !== undefined && Math.abs(after[k] - before[k]) > 0.5)
            .map((k) => `${k}: ${before[k]} → ${after[k]}`);

        expect(moved.length, `열이 늘지 않았다 — 시험이 무효다`).toBeGreaterThan(0);
        expect(
            moved.filter((m) => !m.startsWith(ABSORBER)),
            `필지 주소 말고 폭이 바뀐 열이 있다: ${moved.join(' / ')}`
        ).toEqual([]);
    });

    test('기본 보기로 되돌리면 폭도 되돌아온다', async ({ page }) => {
        await waitForStableWidths(page, '#logTable thead th');
        const before = await widths(page);
        const toggle = page.locator('#viewToggleBtn');
        await toggle.click();
        await expect(page.locator('#logTable th.col-landclass1')).toBeVisible();
        await toggle.click();
        await expect(page.locator('#logTable th.col-landclass1')).toBeHidden();

        await waitForStableWidths(page, '#logTable thead th');
        const after = await widths(page);
        const moved = Object.keys(before)
            .filter((k) => after[k] !== undefined && Math.abs(after[k] - before[k]) > 0.5)
            .map((k) => `${k}: ${before[k]} → ${after[k]}`);
        expect(moved, `왕복했는데 폭이 제자리로 오지 않았다: ${moved.join(' / ')}`).toEqual([]);
    });
});

// SAMPL-1-176: 퇴비도 같은 증상이었다 — 전체 보기로 숨김 열 셋(법인여부·생년월일/법인번호·
// 우편번호)이 드러나면 나머지가 전부 양보했다. 실측(2560px) **14개 열**이 최대 33.5px씩.
// 흡수 열은 **농장주소**다(토양은 필지 주소).
//
// ⚠️ 퇴비는 표가 더 넓어(2369px) 2560px에서야 남는 폭이 생긴다. 토양과 같은 폭으로
//    재면 증상이 재현되지 않아 **아무것도 지키지 못한 채 통과**한다.
test.describe('목록 열 폭 안정성 (퇴비)', () => {
    test.use({ viewport: { width: 2560, height: 900 } });

    /** 흡수 열 — 이 열만은 폭이 변해도 된다 */
    const COMPOST_ABSORBER = 'col-farm-address';
    /** 퇴비 표는 id가 없다 — tbody를 가진 표로 거슬러 올라간다 (실측 25칸 매칭) */
    const COMPOST_HEAD = 'table:has(#logTableBody) thead th';

    /**
     * 숨김 열이 **셋 다** 드러났는지 본다.
     *
     * ⚠️ 하나만 확인하면 나머지 둘이 빠진 채로도 시험이 진행된다 — 폭 재분배의
     *    원인이 줄어든 상태에서 재게 되므로 결과가 흐려진다. 독립 리뷰 지적.
     */
    async function expectHiddenColumnsShown(page) {
        for (const cls of ['col-applicant-type', 'col-birth-corp', 'col-postcode']) {
            await expect(page.locator(`#logTableBody td.${cls}`).first(),
                `전체 보기인데 ${cls}가 드러나지 않았다`).toBeVisible();
        }
    }

    test.beforeEach(async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        const res = await page.goto('/compost/');
        expect(res && res.status(), 'docs/compost/ 없음 — `npm run build` 먼저').toBeLessThan(400);
        await page.waitForFunction(
            () => !!(/** @type {any} */ (window).compostManager), null, { timeout: 15000 });
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).compostManager;
            mgr.sampleLogs = [1, 2, 3].map((i) => ({
                id: `r${i}`, receptionNumber: String(i), name: `민원인${i}`, date: '2026-08-20',
                farmName: `봉화농장${i}`, phoneNumber: `010-1234-567${i}`, note: '비고',
                address: '경상북도 봉화군 봉화읍 문단리 221번지 일원',
                farmAddress: '경상북도 봉화군 봉화읍 문단리 330-2번지',
                // ⚠️ 렌더러가 읽는 이름 그대로 — `addressPostcode`·`birthDate`다
                //    (`compost-script.js`). 다른 이름으로 넣으면 열은 그려지되 값이
                //    '-'가 되어 **시험이 무엇을 보고 있는지 흐려진다**. 독립 리뷰 지적.
                addressPostcode: '36229', applicantType: '개인', birthDate: '1980-01-01',
                area: '1000', sampleKind: '퇴비', animalType: '우분',
                productionDate: '2026-07-01', purpose: '일반', notifyMethod: '우편',
                mailDate: '2026-08-21',
            }));
            mgr.filterAndRenderLogs();
            mgr.switchView('list');
        });
        await expect(page.locator('#logTableBody tr')).toHaveCount(3);
    });

    /** 퇴비 표는 id가 없다 — tbody에서 거슬러 올라간다 */
    const compostWidths = (page) => page.evaluate(() => {
        const table = document.querySelector('#logTableBody')?.closest('table');
        const vis = (el) => getComputedStyle(el).display !== 'none';
        /** @type {Record<string, number>} */
        const out = {};
        Array.from(table?.querySelectorAll('thead th') || []).forEach((t) => {
            if (!vis(t)) return;
            const key = Array.from(t.classList).find((c) => c.startsWith('col-'))
                || (t.textContent || '').trim() || '(체크)';
            out[key] = Math.round(t.getBoundingClientRect().width * 10) / 10;
        });
        return out;
    });

    test('전체 보기를 켜도 농장주소 말고는 폭이 그대로다', async ({ page }) => {
        const wrap = await page.evaluate(() => {
            const w = /** @type {HTMLElement|null} */ (
                document.querySelector('#logTableBody')?.closest('.table-wrapper') || null);
            return { client: w?.clientWidth ?? 0, scroll: w?.scrollWidth ?? 0 };
        });
        // 남는 폭이 없으면 재분배 자체가 없다 — 그 상태로 통과해도 의미가 없다
        expect(wrap.scroll, '표가 화면보다 넓다 — 이 폭에서는 증상이 재현되지 않는다')
            .toBeLessThanOrEqual(wrap.client);

        await waitForStableWidths(page, COMPOST_HEAD);
        const before = await compostWidths(page);
        await page.locator('#toggleColumnsBtn').click();
        await expectHiddenColumnsShown(page);
        await waitForStableWidths(page, COMPOST_HEAD);
        const after = await compostWidths(page);

        const moved = Object.keys(before)
            .filter((k) => after[k] !== undefined && Math.abs(after[k] - before[k]) > 0.5)
            .map((k) => `${k}: ${before[k]} → ${after[k]}`);

        expect(moved.length, '열이 늘지 않았다 — 시험이 무효다').toBeGreaterThan(0);
        expect(
            moved.filter((m) => !m.startsWith(COMPOST_ABSORBER)),
            `농장주소 말고 폭이 바뀐 열이 있다: ${moved.join(' / ')}`
        ).toEqual([]);
    });

    // ⚠️ 좁은 화면에서는 **예전과 완전히 같아야** 한다. `min-width: 250px`를 남긴 이유이고,
    //    "표를 밀지 않는다"는 원래 설계 의도가 지켜지는지를 본다.
    test('표가 화면보다 넓으면 흡수 열도 250px에 머문다', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await waitForStableWidths(page, COMPOST_HEAD);
        const before = await compostWidths(page);
        await page.locator('#toggleColumnsBtn').click();
        await expectHiddenColumnsShown(page);
        await waitForStableWidths(page, COMPOST_HEAD);
        const after = await compostWidths(page);

        expect(before[COMPOST_ABSORBER], '좁은 화면인데 흡수 열이 250px를 넘는다').toBe(250);
        const moved = Object.keys(before)
            .filter((k) => after[k] !== undefined && Math.abs(after[k] - before[k]) > 0.5)
            .map((k) => `${k}: ${before[k]} → ${after[k]}`);
        expect(moved, `좁은 화면에서 폭이 움직였다: ${moved.join(' / ')}`).toEqual([]);
    });
});
