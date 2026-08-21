// @ts-check
// SAMPL-1-169: 가져오기 미리보기가 클라우드 접수번호를 보지 않는다
//
// 등록(SAMPL-1-167)과 수정(SAMPL-1-168)에는 등록 직전 클라우드 확인을 붙였는데
// **가져오기에는 없었다.** 미리보기 중복 판정 자체는 있으나(SAMPL-1-153/154)
// 로컬 기준이라, 다른 자리에서 먼저 접수된 번호를 "신규"로 표시하고
// 자동부여도 그 번호를 피하지 못한다.
//
// ⚠️ 이 스펙이 지키는 계약은 **셋**이다:
//    ① 클라우드에만 있는 번호를 **중복으로 표시**한다
//    ② 자동부여가 클라우드 번호를 **건너뛴다** (이쪽이 더 위험하다 — 조용하다)
//    ③ 클라우드를 확인하지 못해도 **가져오기는 된다**. 다만 못 했다고 말한다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const PASTE_HEADER = '성명\t연락처\t지번주소\t작물\t면적\t구분\t목적';

/**
 * Firebase를 흉내낸다. `firestoreDb`를 겨냥하는 이유는 SAMPL-1-167 스펙과 같다 —
 * `loadFromFirebase`는 오류를 삼키고 `{data: []}`를 돌려주므로 그것을 스텁하면
 * "실패를 실패로 아는지"를 검증할 수 없다.
 * @param mode 'ok' | 'error' | 'disabled'
 */
async function stubCloud(page, cloudLogs, mode = 'ok') {
    await page.evaluate(([logs, m]) => {
        const mgr = /** @type {any} */ (window).soilManager;
        if (m === 'disabled') {
            /** @type {any} */ (window).firebaseConfig = { isEnabled: () => false };
            return;
        }
        /** @type {any} */ (window).firebaseConfig = { isEnabled: () => true };
        mgr._firebaseCache.clear();
        const db = /** @type {any} */ (window).firestoreDb || {};
        const stub = Object.assign(Object.create(Object.getPrototypeOf(db) || Object.prototype), db);
        delete stub.getAllWithMeta;
        stub.getAll = m === 'error'
            ? async () => { throw new Error('네트워크 없음'); }
            : async () => logs;
        /** @type {any} */ (window).firestoreDb = stub;
    }, [cloudLogs, mode]);
}

const cloudRec = (rn, name) => ({
    id: `cloud-${rn}`, receptionNumber: rn, name, subCategory: '밭',
    landClass1: '농가의뢰', date: '2026-03-11',
    updatedAt: '2026-03-11T00:00:00.000Z', parcels: [],
});

/** 모달을 열고 붙여넣기 → 자동매핑. 클라우드 응답이 도착할 때까지 기다린다. */
async function pasteAndAutoMap(page, dataRows) {
    await page.click('#soilImportBtn');
    const modal = page.locator('#soilImporterModal');
    await expect(modal).toBeVisible();
    // 클라우드는 모달을 여는 순간 비동기로 읽힌다. 응답 전에 단정하면
    // "아직 안 왔다"를 "안 본다"로 착각하게 된다.
    await page.waitForFunction(
        () => {
            const st = /** @type {any} */ (window).SoilResultImporter?._state;
            return !!st && st.cloudChecked === true;
        },
        { timeout: 10000 }
    );
    await modal.locator('input[name="sriMode"][value="paste"]').check();
    await modal.locator('[data-el="textarea"]').fill([PASTE_HEADER, ...dataRows].join('\n'));
    await modal.locator('[data-act="automap"]').click();
    return modal;
}

/** 미리보기 표의 접수번호 열 */
const previewNumbers = (modal) =>
    modal.locator('.sri-pv-table tbody tr td:nth-child(2)').allTextContents();

test.describe('가져오기의 클라우드 접수번호 확인 (SAMPL-1-169)', () => {
    test.beforeEach(async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        await page.goto('/soil/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
        await page.evaluate(() => localStorage.clear());
    });

    // 🚨 담당자가 손으로 적어 넣은 번호가 다른 자리에서 이미 쓰였을 때
    test('클라우드에만 있는 번호를 중복으로 표시한다', async ({ page }) => {
        await stubCloud(page, [cloudRec('328', '박성권')]);
        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);
        // 접수번호 자동부여를 끄고 328을 직접 넣는다
        await modal.locator('[data-el="autoNumber"]').uncheck();
        await modal.locator('[data-el="textarea"]').fill(
            [`${PASTE_HEADER}\t접수번호`,
             '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배\t328'].join('\n')
        );
        await modal.locator('[data-act="automap"]').click();

        await expect(modal.locator('.sri-pill.dup')).toContainText('중복 1');
    });

    // 🚨 이쪽이 더 위험하다 — 자동부여는 담당자가 번호를 보지 않는다
    test('자동부여가 클라우드 번호를 건너뛴다', async ({ page }) => {
        await stubCloud(page, [cloudRec('1', '박성권'), cloudRec('2', '박성현')]);
        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);
        // 로컬은 비어 있으니 고치기 전에는 1이 나왔다 — 클라우드의 1·2와 정면 충돌
        const nums = await previewNumbers(modal);
        expect(nums, `클라우드 번호를 피하지 못했다: ${nums}`).toEqual(['3']);
    });

    // 이 앱은 오프라인 우선이다. 확인 실패가 가져오기를 막으면 현장에서 못 쓴다.
    test('클라우드 확인에 실패해도 가져오기는 되고, 실패를 표시한다', async ({ page }) => {
        await stubCloud(page, [], 'error');
        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);

        await expect(modal.locator('.sri-cloudfail')).toBeVisible();
        // 막히지 않는다
        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();
        const saved = await page.evaluate(() =>
            (/** @type {any} */ (window).soilManager.sampleLogs || []).map((l) => String(l.receptionNumber)));
        expect(saved, `가져오기가 막혔다: ${saved}`).toEqual(['1']);
    });

    // Firebase를 쓰지 않는 설치본은 확인할 것이 없다 — 경고할 일도 아니다
    test('Firebase가 꺼져 있으면 실패 표시를 하지 않는다', async ({ page }) => {
        await stubCloud(page, [], 'disabled');
        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);
        await expect(modal.locator('.sri-cloudfail')).toHaveCount(0);
        expect(await previewNumbers(modal)).toEqual(['1']);
    });

    // 🚨 이 저장소가 이미 한 번 겪은 실패다 — SAMPL-1-153: "미리보기는 1,2,3인데
    //    실제로는 1,1,1". 미리보기만 단정하면 **표시만 고치고 저장은 그대로**여도 통과한다.
    //    커밋 시 자동부여 행은 receptionNumber를 지워 매니저가 다시 부여하는데,
    //    매니저는 로컬만 본다(soil-script.js: getNextNumberForClass).
    test('자동부여가 클라우드 번호를 피한 채 **저장**된다', async ({ page }) => {
        await stubCloud(page, [cloudRec('1', '박성권'), cloudRec('2', '박성현')]);
        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
            '김철수\t010-2222-2222\t봉화읍 내성리 2\t배추\t200\t밭\t일반재배',
        ]);
        expect(await previewNumbers(modal), '미리보기').toEqual(['3', '4']);

        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();

        // 메모리 배열이 아니라 **저장된 것**을 읽는다
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
        const persisted = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            const raw = localStorage.getItem(mgr.getStorageKey(mgr.selectedYear));
            return (raw ? JSON.parse(raw) : []).map((l) => String(l.receptionNumber));
        });
        expect(persisted, `미리보기는 3·4인데 저장은 ${persisted}`).toEqual(['3', '4']);
    });

    // 🚨 한 겹 더 아래의 같은 결함 (독립 6차 리뷰 MAJOR).
    //    SAMPL-1-167에서 `loadFromFirebase`의 오류 삼킴을 피했는데, 실제 운영 경로인
    //    `getAllWithMeta`도 오류를 `{documents: []}`로 삼킨다 — 실패한 조회가
    //    "이 연도에 0건"과 똑같이 보여 중복 검사가 조용히 통과했다.
    test('getAllWithMeta가 오류를 삼켜도 실패로 인식한다', async ({ page }) => {
        await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            w.firebaseConfig = { isEnabled: () => true };
            w.soilManager._firebaseCache.clear();
            const db = w.firestoreDb || {};
            const stub = Object.assign(Object.create(Object.getPrototypeOf(db) || Object.prototype), db);
            // firestore-db.js의 catch가 실제로 돌려주는 모양 그대로
            stub.getAllWithMeta = async () => ({ documents: [], fromCache: false, error: new Error('권한 없음') });
            w.firestoreDb = stub;
        });

        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);

        await expect(modal.locator('.sri-cloudfail'),
            '오류를 빈 결과로 받아 "확인함"으로 처리했다').toBeVisible();
    });

    // 오류가 없으면 빈 결과는 그냥 빈 결과다 (과잉경고 방지)
    test('진짜로 0건이면 실패 표시를 하지 않는다', async ({ page }) => {
        await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            w.firebaseConfig = { isEnabled: () => true };
            w.soilManager._firebaseCache.clear();
            const db = w.firestoreDb || {};
            const stub = Object.assign(Object.create(Object.getPrototypeOf(db) || Object.prototype), db);
            stub.getAllWithMeta = async () => ({ documents: [], fromCache: false });
            w.firestoreDb = stub;
        });

        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);
        await expect(modal.locator('.sri-cloudfail')).toHaveCount(0);
        expect(await previewNumbers(modal)).toEqual(['1']);
    });

    // 클라우드 사본이 목록·저장에 새어 나오면 안 된다 — 풀은 검사용일 뿐이다
    test('클라우드 레코드가 저장 결과에 섞이지 않는다', async ({ page }) => {
        await stubCloud(page, [cloudRec('9', '박성권')]);
        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);
        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();

        const names = await page.evaluate(() =>
            (/** @type {any} */ (window).soilManager.sampleLogs || []).map((l) => l.name));
        expect(names.filter((n) => n === '박성권'), `클라우드 사본이 새어 나왔다: ${names}`).toEqual([]);
        expect(names).toContain('홍길동');
    });
});

test.describe('낡은 클라우드 응답 (SAMPL-1-169 · 독립 리뷰 MAJOR)', () => {
    // 🚨 처음 구현에는 주석만 "낡은 응답을 거른다"고 적혀 있고 **실제로는 거르지 못했다.**
    //    모달을 다시 열면 `_state`가 새 객체가 되는데, await에서 깨어난 코드는
    //    그 **새 상태**를 가리켜 이전 세션의 응답이 그대로 들어갔다.
    //    거짓 주석은 없는 것보다 나쁘다 — 다음 사람이 확인했다고 믿는다.

    test.beforeEach(async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        await page.goto('/soil/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
        await page.evaluate(() => localStorage.clear());
    });

    test('닫았다 다시 연 뒤 도착한 이전 응답은 버린다', async ({ page }) => {
        // 첫 세션의 응답을 손으로 붙잡아 뒀다가 두 번째 세션이 열린 뒤에 풀어 준다
        await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            w.firebaseConfig = { isEnabled: () => true };
            w.__release = null;
            const mgr = w.soilManager;
            let call = 0;
            mgr.fetchCloudReceptionRecords = () => {
                call++;
                if (call === 1) {
                    // 첫 호출: 아무도 풀어 주기 전까지 매달아 둔다
                    return new Promise((resolve) => { w.__release = () => resolve({
                        records: [{ id: 'stale', receptionNumber: '777', name: '낡은응답',
                                    landClass1: '농가의뢰', subCategory: '밭' }],
                        unavailable: false, reason: 'ok' }); });
                }
                return Promise.resolve({ records: [], unavailable: false, reason: 'ok' });
            };
        });

        await page.click('#soilImportBtn');
        await expect(page.locator('#soilImporterModal')).toBeVisible();
        // 첫 세션을 닫고 다시 연다 (두 번째 호출은 즉시 빈 배열로 끝난다)
        await page.locator('#soilImporterModal [data-act="close"], #soilImporterModal .sri-close').first().click();
        await page.click('#soilImportBtn');
        await page.waitForFunction(() => /** @type {any} */ (window).SoilResultImporter?._state?.cloudChecked === true);

        // 이제 첫 세션의 응답을 풀어 준다 — 새 세션에 섞이면 안 된다
        await page.evaluate(() => /** @type {any} */ (window).__release?.());
        await page.waitForTimeout(200);

        const leaked = await page.evaluate(() => {
            const st = /** @type {any} */ (window).SoilResultImporter._state;
            return (st.cloudRecords || []).map((r) => String(r.receptionNumber));
        });
        expect(leaked, `이전 세션 응답이 새 세션에 섞였다: ${leaked}`).not.toContain('777');
    });

    test('응답을 기다리는 사이 연도가 바뀌면 그 응답을 쓰지 않는다', async ({ page }) => {
        await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            w.firebaseConfig = { isEnabled: () => true };
            const mgr = w.soilManager;
            w.__release = null;
            mgr.fetchCloudReceptionRecords = () => new Promise((resolve) => {
                w.__release = () => resolve({
                    records: [{ id: 'other-year', receptionNumber: '888', name: '지난해',
                                landClass1: '농가의뢰', subCategory: '밭' }],
                    unavailable: false, reason: 'ok' });
            });
        });

        await page.click('#soilImportBtn');
        await expect(page.locator('#soilImporterModal')).toBeVisible();
        // 응답 도착 전에 연도를 바꾼다
        await page.evaluate(() => { /** @type {any} */ (window).soilManager.selectedYear += 1; });
        await page.evaluate(() => /** @type {any} */ (window).__release?.());
        await page.waitForTimeout(200);

        const used = await page.evaluate(() => {
            const st = /** @type {any} */ (window).SoilResultImporter._state;
            return (st.cloudRecords || []).map((r) => String(r.receptionNumber));
        });
        expect(used, `다른 해의 번호를 이 해의 풀에 넣었다: ${used}`).not.toContain('888');
    });

    // 버리는 것으로 끝내면 새 연도가 영영 확인되지 않는다 (독립 재리뷰 MAJOR)
    test('연도가 바뀌면 새 연도로 다시 읽는다', async ({ page }) => {
        await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            w.firebaseConfig = { isEnabled: () => true };
            w.__years = [];
            w.__release = [];
            w.soilManager.fetchCloudReceptionRecords = (y) => {
                w.__years.push(String(y));
                return new Promise((resolve) => {
                    w.__release.push(() => resolve({
                        records: [{ id: `y-${y}`, receptionNumber: '555', name: `${y}년`,
                                    landClass1: '농가의뢰', subCategory: '밭' }],
                        unavailable: false, reason: 'ok' }));
                });
            };
        });

        await page.click('#soilImportBtn');
        await expect(page.locator('#soilImporterModal')).toBeVisible();
        const before = await page.evaluate(() => String(/** @type {any} */ (window).soilManager.selectedYear));

        // 응답 전에 연도를 바꾸고, 그 뒤에 낡은 응답을 풀어 준다
        await page.evaluate(() => { const w = /** @type {any} */ (window);
            w.soilManager.selectedYear = String(Number(w.soilManager.selectedYear) + 1); });
        await page.evaluate(() => /** @type {any} */ (window).__release[0]?.());
        await page.waitForTimeout(200);

        const years = await page.evaluate(() => /** @type {any} */ (window).__years);
        expect(years, `새 연도로 다시 읽지 않았다: ${years}`).toHaveLength(2);
        expect(years[1], `다시 읽은 연도가 틀리다: ${years}`).toBe(String(Number(before) + 1));

        // 새 응답이 도착하면 그때는 쓴다
        await page.evaluate(() => /** @type {any} */ (window).__release[1]?.());
        await page.waitForFunction(() => /** @type {any} */ (window).SoilResultImporter?._state?.cloudChecked === true,
            { timeout: 5000 });
    });

    // 🚨 3차 리뷰가 잡은 일반형. 앞의 두 시험은 **응답 대기 중** 연도 변경만 봤다.
    //    조회가 이미 끝난 뒤 연도를 바꾸면 지난해 캐시가 그대로 쓰였다.
    test('조회가 끝난 뒤 연도를 바꿔도 지난해 번호를 쓰지 않는다', async ({ page }) => {
        await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            w.firebaseConfig = { isEnabled: () => true };
            w.__years = [];
            w.soilManager.fetchCloudReceptionRecords = async (y) => {
                w.__years.push(String(y));
                // 지난해에만 1·2가 있다. 새 연도는 비어 있다.
                const first = w.__years.length === 1;
                return { records: first
                    ? [{ id: 'a', receptionNumber: '1', name: '지난해', landClass1: '농가의뢰', subCategory: '밭' },
                       { id: 'b', receptionNumber: '2', name: '지난해', landClass1: '농가의뢰', subCategory: '밭' }]
                    : [], unavailable: false, reason: 'ok' };
            };
        });

        // 1차 조회를 끝까지 마친다
        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);
        expect(await previewNumbers(modal), '지난해 1·2를 피해야 한다').toEqual(['3']);

        // 조회가 **끝난 뒤** 연도를 바꾼다
        await page.evaluate(() => { const w = /** @type {any} */ (window);
            w.soilManager.selectedYear = String(Number(w.soilManager.selectedYear) + 1); });
        // 재계산을 유발한다
        await modal.locator('[data-act="automap"]').click();
        await page.waitForFunction(() => /** @type {any} */ (window).__years.length === 2, { timeout: 5000 });
        await page.waitForFunction(() => /** @type {any} */ (window).SoilResultImporter?._state?.cloudChecked === true,
            { timeout: 5000 });
        await modal.locator('[data-act="automap"]').click();

        // 새 연도는 비어 있으니 1이어야 한다. 3이면 지난해 캐시를 그대로 쓴 것이다.
        const nums = await previewNumbers(modal);
        expect(nums, `지난해 캐시로 새 연도를 채번했다: ${nums}`).toEqual(['1']);
    });

    // ⚠️ 연도 도장이 지키는 것은 **재조회가 도착하기 전 그 창**이다.
    //    재조회를 끝까지 기다리면 그 창을 지나쳐 버려, 도장을 지워도 테스트가 통과한다
    //    (변이로 실측 — 도장 대조가 죽은 코드로 보였다). 그래서 여기서는 붙잡아 둔다.
    test('재조회가 도착하기 전에는 지난해 캐시를 쓰지 않는다', async ({ page }) => {
        await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            w.firebaseConfig = { isEnabled: () => true };
            w.__n = 0;
            w.soilManager.fetchCloudReceptionRecords = async (y) => {
                w.__n++;
                if (w.__n === 1) {
                    return { records: [
                        { id: 'a', receptionNumber: '1', name: '지난해', landClass1: '농가의뢰', subCategory: '밭' },
                        { id: 'b', receptionNumber: '2', name: '지난해', landClass1: '농가의뢰', subCategory: '밭' },
                    ], unavailable: false, reason: 'ok' };
                }
                // 두 번째(새 연도) 조회는 **도착하지 않는다** — 그 창을 붙잡아 둔다
                return new Promise(() => {});
            };
        });

        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);
        expect(await previewNumbers(modal), '지난해 1·2를 피해야 한다').toEqual(['3']);

        await page.evaluate(() => { const w = /** @type {any} */ (window);
            w.soilManager.selectedYear = String(Number(w.soilManager.selectedYear) + 1); });
        await modal.locator('[data-act="automap"]').click();
        await page.waitForFunction(() => /** @type {any} */ (window).__n === 2, { timeout: 5000 });
        await modal.locator('[data-act="automap"]').click();

        // 새 연도 응답은 아직 없다. 지난해 캐시를 쓰면 3이 나온다.
        const nums = await previewNumbers(modal);
        expect(nums, `재조회 전에 지난해 캐시를 썼다: ${nums}`).toEqual(['1']);
    });

    // 🚨 4차 리뷰가 잡은 마지막 구멍. 앞의 시험들은 연도 변경 뒤 **재계산을 유발한** 상태만
    //    봤다. 연도를 바꾸고 곧바로 가져오기를 누르면 낡은 미리보기가 그대로 저장됐다.
    test('연도를 바꾸고 곧바로 저장하면 다시 계산해 보여주고 멈춘다', async ({ page }) => {
        await stubCloud(page, []);
        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);
        expect(await previewNumbers(modal)).toEqual(['1']);

        // 재계산을 유발하지 않고 연도만 바꾼 뒤 곧바로 저장을 누른다
        await page.evaluate(() => { const w = /** @type {any} */ (window);
            w.soilManager.selectedYear = String(Number(w.soilManager.selectedYear) + 1); });
        await modal.locator('[data-act="import"]').click();

        // 저장되지 않고 모달이 열려 있어야 한다 — 본 것과 저장되는 것이 달라지면 안 된다
        await expect(modal).toBeVisible();
        const saved = await page.evaluate(() =>
            (/** @type {any} */ (window).soilManager.sampleLogs || []).length);
        expect(saved, `낡은 미리보기가 그대로 저장됐다`).toBe(0);

        // 연도가 바뀌면 새 연도로 다시 읽으므로, 그 확인이 끝나기를 기다린다.
        // (기다리지 않고 누르면 '확인 중입니다'로 한 번 더 막힌다 — 의도된 동작이다.)
        await page.waitForFunction(() => /** @type {any} */ (window).SoilResultImporter?._state?.cloudChecked === true,
            { timeout: 10000 });
        // 다시 누르면 저장된다 (영영 막히면 그것대로 못 쓴다)
        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();
    });

    // 🚨 5차 리뷰 MAJOR. 위 가드가 재계산을 걸면 previewYear는 곧바로 새 연도가 되지만
    //    클라우드 응답은 아직 오지 않았다 — 두 번째 클릭이 로컬만 본 번호를 저장했다.
    test('재조회가 끝나기 전 두 번째 클릭은 저장하지 않는다', async ({ page }) => {
        await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            w.firebaseConfig = { isEnabled: () => true };
            w.__n = 0;
            w.soilManager.fetchCloudReceptionRecords = async () => {
                w.__n++;
                if (w.__n === 1) return { records: [], unavailable: false, reason: 'ok' };
                return new Promise(() => {});   // 재조회는 도착하지 않는다
            };
        });

        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);
        await page.evaluate(() => { const w = /** @type {any} */ (window);
            w.soilManager.selectedYear = String(Number(w.soilManager.selectedYear) + 1); });

        await modal.locator('[data-act="import"]').click();   // 1차: 연도 가드
        await expect(modal).toBeVisible();
        await modal.locator('[data-act="import"]').click();   // 2차: 아직 확인 중
        await expect(modal, '클라우드 확인 중인데 저장됐다').toBeVisible();

        const saved = await page.evaluate(() =>
            (/** @type {any} */ (window).soilManager.sampleLogs || []).length);
        expect(saved, '클라우드 미확인 상태로 저장됐다').toBe(0);
    });

    // _recompute는 키 입력마다 돈다 — 거기서 읽으면 타자마다 네트워크를 두드린다
    test('모달 한 번 여는 동안 클라우드는 한 번만 읽는다', async ({ page }) => {
        await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            w.firebaseConfig = { isEnabled: () => true };
            w.__calls = 0;
            w.soilManager.fetchCloudReceptionRecords = async () => {
                w.__calls++;
                return { records: [], unavailable: false, reason: 'ok' };
            };
        });

        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
        ]);
        // 재계산을 여러 번 유발한다
        await modal.locator('[data-el="textarea"]').fill(
            [PASTE_HEADER,
             '홍길동\t010-1111-1111\t봉화읍 내성리 1\t고추\t100\t밭\t일반재배',
             '김철수\t010-2222-2222\t봉화읍 내성리 2\t배추\t200\t밭\t일반재배'].join('\n'));
        await modal.locator('[data-act="automap"]').click();

        const calls = await page.evaluate(() => /** @type {any} */ (window).__calls);
        expect(calls, `클라우드를 ${calls}번 읽었다`).toBe(1);
    });
});
