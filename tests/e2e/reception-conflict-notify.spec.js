// @ts-check
// SAMPL-1-166: 클라우드 병합이 접수번호 충돌을 조용히 통과시킨다
//
// 담당자 실데이터에서 중복 3종·6건이 발견됐다. 같은 날, 연속 번호 3개, 필지 구성까지 동일 —
// 다필지 접수 한 건 분량의 번호가 통째로 두 번 부여됐다.
//
// 원인이 두 겹이다:
//   ① 등록 시 중복 검사(soil-script.js:2265)가 **localStorage만** 읽어,
//      다른 기기·창에서 먼저 접수돼 아직 동기화되지 않은 건을 못 본다
//   ② `smartMerge`(sync-utils.js)는 **id 기준**이라 id가 다르고 번호가 같으면
//      **둘 다 조용히 살아남는다** — 번호는 정렬에만 쓴다
//
// ⚠️ 이 스펙이 지키는 계약: **첫 화면 로드 경로에서 알림이 울린다.**
//    독립 리뷰가 잡은 것이 정확히 이것이다 — `syncWithCloud`만 알리면
//    담당자가 실제로 겪는 경로(`loadYearData`)에서는 침묵한다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

async function openSoil(page) {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const res = await page.goto('/soil/');
    expect(res && res.status(), 'docs/soil/ 없음 — `npm run build` 먼저').toBeLessThan(400);
    await page.waitForFunction(() => !!window.soilManager, { timeout: 15000 });
}

/**
 * Firebase를 흉내내 `loadYearData`의 병합 경로를 태운다.
 * 실제 Firestore 없이 이 경로를 지날 방법이 없어 최소한만 스텁한다.
 */
async function loadWithCloud(page, localLogs, cloudLogs) {
    return page.evaluate(([local, cloud]) => {
        const mgr = /** @type {any} */ (window).soilManager;
        const year = String(mgr.selectedYear);
        localStorage.setItem(mgr.getStorageKey(year), JSON.stringify(local));

        // 병합 경로의 관문 두 개만 연다
        /** @type {any} */ (window).firebaseConfig = { isEnabled: () => true };
        mgr._firebaseCache.clear();
        mgr.loadFromFirebase = async () => ({ data: cloud, fromCache: false });

        const toasts = [];
        mgr.showToast = (msg, type) => toasts.push({ msg, type });

        return mgr.loadYearData(year).then(() => ({
            toasts,
            saved: (mgr.sampleLogs || []).map((l) => `${l.id}:${l.receptionNumber}`),
        }));
    }, [localLogs, cloudLogs]);
}

const rec = (id, rn) => ({
    id, receptionNumber: rn, name: `민원인${id}`, subCategory: '밭',
    landClass1: '농가의뢰', date: '2026-03-11',
    updatedAt: '2026-03-11T00:00:00.000Z', parcels: [],
});

test.describe('클라우드 병합의 접수번호 충돌 알림 (SAMPL-1-166)', () => {
    test.beforeEach(async ({ page }) => {
        await openSoil(page);
        await page.evaluate(() => localStorage.clear());
    });

    // 🚨 담당자 데이터에서 실제로 일어난 일. 로컬과 클라우드에 id가 다르고
    //    번호가 같은 레코드가 있으면 병합 후 둘 다 남는다 — 아무도 모른 채로.
    test('첫 화면 로드에서 충돌을 알린다', async ({ page }) => {
        const out = await loadWithCloud(page, [rec('local-1', '328')], [rec('cloud-1', '328')]);

        // 기존 동작은 유지된다 — 둘 다 살아남는다 (데이터를 지우지 않는다)
        expect(out.saved.sort(), `저장 결과: ${out.saved}`).toEqual(['cloud-1:328', 'local-1:328']);
        // ⚠️ 그러나 **조용하지는 않아야 한다**
        const warn = out.toasts.find((t) => String(t.msg).includes('접수번호가 겹칩니다'));
        expect(warn, `알림이 없다: ${JSON.stringify(out.toasts)}`).toBeTruthy();
        expect(warn.msg).toContain('농가의뢰 328');
        // 다음에 무엇을 할지도 알려야 한다
        expect(warn.msg).toContain('접수번호 정합성 점검');
    });

    test('겹치지 않으면 아무 말도 하지 않는다 (과잉알림 방지)', async ({ page }) => {
        const out = await loadWithCloud(page, [rec('local-1', '328')], [rec('cloud-1', '329')]);
        expect(out.saved).toHaveLength(2);
        expect(out.toasts.filter((t) => String(t.msg).includes('접수번호가 겹칩니다'))).toEqual([]);
    });
});
