// @ts-check
// SAMPL-1-167 (= SAMPL-1-166 A안): 등록 직전 클라우드 접수번호 확인
//
// 등록 시 중복 검사가 **localStorage만** 봤다. 다른 자리에서 먼저 접수돼 아직
// 이 기기로 동기화되지 않은 건은 보이지 않고, 그대로 같은 번호가 나갔다.
// 담당자 데이터에서 다필지 접수 한 건 분량(328·329·330)이 통째로 두 번 부여된 것이
// 그렇게 일어났다.
//
// ⚠️ 이 스펙이 지키는 계약은 **둘**이다:
//    ① 클라우드에만 있는 번호와 겹치면 **막고 재부여**한다
//    ② 클라우드를 확인하지 못해도 **등록은 된다** — 이 앱은 오프라인 우선이다.
//       다만 확인하지 못했다는 사실을 조용히 넘기지 않는다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

async function openSoil(page) {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const res = await page.goto('/soil/');
    expect(res && res.status(), 'docs/soil/ 없음 — `npm run build` 먼저').toBeLessThan(400);
    await page.waitForFunction(() => !!window.soilManager, { timeout: 15000 });
    await page.evaluate(() => localStorage.clear());
}

/**
 * Firebase를 흉내낸다. 실제 Firestore 없이 이 경로를 지날 방법이 없어 최소한만 스텁한다.
 * @param mode 'ok' | 'timeout' | 'error' | 'disabled'
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
        // ⚠️ **`firestoreDb`를 스텁한다.** `loadFromFirebase`는 오류를 삼키고
        //    `{ data: [] }`를 돌려주므로(BaseSampleManager.js:583) 그것을 스텁하면
        //    "실패를 실패로 아는지"를 검증할 수 없다 — 실제 경로는 firestoreDb다.
        // ⚠️ 객체를 통째로 갈아치우면 `isEnabled` 등 다른 메서드가 사라져
        //    앱의 다른 경로가 깨진다(실측: `n.isEnabled is not a function`).
        //    **기존 객체를 보존하고 읽기만 바꾼다.**
        const db = /** @type {any} */ (window).firestoreDb || {};
        const stub = Object.assign(Object.create(Object.getPrototypeOf(db) || Object.prototype), db);
        // getAllWithMeta가 있으면 그쪽이 먼저 쓰이므로 함께 막는다
        delete stub.getAllWithMeta;
        if (m === 'error') {
            stub.getAll = async () => { throw new Error('네트워크 없음'); };
        } else if (m === 'timeout') {
            // 상한(4초)보다 오래 걸리게 한다 — 무한 대기하지 않는지 본다
            stub.getAll = () => new Promise((r) => setTimeout(() => r([]), 30000));
        } else {
            stub.getAll = async () => logs;
        }
        /** @type {any} */ (window).firestoreDb = stub;
    }, [cloudLogs, mode]);
}

/** 필수 필드 + 필지 하나를 채우고 접수번호를 지정한다 */
async function fillForm(page, receptionNumber, lot = '문단리 224') {
    await page.evaluate((rn) => {
        const set = (id, v) => {
            const el = /** @type {any} */ (document.getElementById(id));
            if (el) { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }
        };
        set('receptionMethod', '방문');
        set('name', '홍길동');
        set('phoneNumber', '010-1234-5678');
        set('date', '2026-08-21');
        set('receptionNumber', rn);
        const purpose = /** @type {any} */ (document.getElementById('purpose'));
        if (purpose && purpose.options.length > 1) {
            purpose.selectedIndex = 1;
            purpose.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, receptionNumber);
    await page.locator('.lot-address-input').first().fill(lot);
    await page.locator('.crop-direct-input').first().fill('고추');
    await page.locator('.area-direct-input').first().fill('100');
}

/** 등록을 시도하고 토스트를 모은다 */
async function submitAndCollect(page) {
    return page.evaluate(async () => {
        const mgr = /** @type {any} */ (window).soilManager;
        const toasts = [];
        const orig = mgr.showToast.bind(mgr);
        mgr.showToast = (msg, type) => { toasts.push({ msg, type }); return orig(msg, type); };
        await mgr.submitForm();
        return {
            toasts,
            saved: (mgr.sampleLogs || []).map((l) => `${l.name}:${l.receptionNumber}`),
            inputValue: /** @type {any} */ (document.getElementById('receptionNumber'))?.value || '',
        };
    });
}

const cloudRec = (rn, name) => ({
    id: `cloud-${rn}`, receptionNumber: rn, name, subCategory: '밭',
    landClass1: '농가의뢰', date: '2026-03-11',
    updatedAt: '2026-03-11T00:00:00.000Z', parcels: [],
});

test.describe('등록 직전 클라우드 확인 (SAMPL-1-167)', () => {
    // 🚨 담당자 데이터에서 실제로 일어난 일. 로컬은 비어 있는데 클라우드에 328이 있다.
    test('클라우드에만 있는 번호와 겹치면 막고 재부여한다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [cloudRec('328', '박성권')]);
        await fillForm(page, '328');

        const out = await submitAndCollect(page);

        // 등록되지 않았다 — 로컬에 새 레코드가 없다
        expect(out.saved.filter((s) => s.includes('홍길동')), `저장됨: ${out.saved}`).toEqual([]);
        const warn = out.toasts.find((t) => String(t.msg).includes('이미 존재합니다'));
        expect(warn, `차단 알림이 없다: ${JSON.stringify(out.toasts)}`).toBeTruthy();
        // 재부여된 번호가 클라우드 번호(328)를 피해야 한다 — 아니면 충돌을 옮길 뿐이다
        expect(out.inputValue).not.toBe('328');
        expect(Number(out.inputValue)).toBeGreaterThan(328);
    });

    test('겹치지 않으면 그대로 등록된다 (과잉차단 방지)', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [cloudRec('328', '박성권')]);
        await fillForm(page, '400');

        const out = await submitAndCollect(page);
        expect(out.saved.some((s) => s === '홍길동:400'), `저장됨: ${out.saved}`).toBe(true);
        // 클라우드 사본이 목록에 겹쳐 보이면 안 된다 — 이 화면은 저장소의 거울이어야 한다
        expect(out.saved.filter((s) => s.includes('박성권')), `클라우드 사본이 새어 나왔다: ${out.saved}`).toEqual([]);
    });

    // ⚠️ 이 앱은 오프라인 우선이다. 확인 실패가 등록을 막으면 현장에서 못 쓴다.
    test('클라우드 확인에 실패해도 등록은 되고, 확인하지 못했다고 알린다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [], 'error');
        await fillForm(page, '400');

        const out = await submitAndCollect(page);
        expect(out.saved.some((s) => s === '홍길동:400'), `등록이 막혔다: ${out.saved}`).toBe(true);
        const warn = out.toasts.find((t) => String(t.msg).includes('클라우드를 확인하지 못했습니다'));
        expect(warn, `확인 실패를 조용히 넘겼다: ${JSON.stringify(out.toasts)}`).toBeTruthy();
    });

    test('응답이 없어도 상한 안에 포기하고 등록된다', async ({ page }) => {
        test.setTimeout(30000);
        await openSoil(page);
        await stubCloud(page, [], 'timeout');
        await fillForm(page, '400');

        const started = Date.now();
        const out = await submitAndCollect(page);
        const elapsed = Date.now() - started;

        expect(out.saved.some((s) => s === '홍길동:400'), `등록이 막혔다: ${out.saved}`).toBe(true);
        // 상한(4초)을 크게 넘기면 담당자에게는 앱이 죽은 것과 같다
        expect(elapsed, `상한을 넘겨 ${elapsed}ms 걸렸다`).toBeLessThan(15000);
        expect(out.toasts.some((t) => String(t.msg).includes('클라우드를 확인하지 못했습니다'))).toBe(true);
    });

    // Firebase를 쓰지 않는 설치본은 확인할 것이 없다 — 경고할 일도 아니다
    test('Firebase가 꺼져 있으면 조용히 로컬만 검사한다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [], 'disabled');
        await fillForm(page, '400');

        const out = await submitAndCollect(page);
        expect(out.saved.some((s) => s === '홍길동:400')).toBe(true);
        expect(out.toasts.filter((t) => String(t.msg).includes('클라우드를 확인하지 못했습니다'))).toEqual([]);
    });
});

test.describe('이중 제출 (SAMPL-1-167 · 독립 리뷰 MAJOR)', () => {
    // 🚨 이 티켓의 수정이 만들 뻔한 결함. submitForm이 클라우드 확인 때문에 async가 됐고,
    //    그 사이(최대 4초)에 버튼을 다시 누르면 **같은 번호로 두 건이 등록된다** —
    //    없애려던 중복을 수정이 만들어내는 셈이다.
    test('확인 중 다시 눌러도 두 번 등록되지 않는다', async ({ page }) => {
        await openSoil(page);
        // 느린 클라우드를 흉내내 await 창을 벌린다
        await page.evaluate(() => {
            /** @type {any} */ (window).firebaseConfig = { isEnabled: () => true };
            const db = /** @type {any} */ (window).firestoreDb || {};
            const stub = Object.assign(Object.create(Object.getPrototypeOf(db) || Object.prototype), db);
            delete stub.getAllWithMeta;
            stub.getAll = () => new Promise((r) => setTimeout(() => r([]), 600));
            /** @type {any} */ (window).firestoreDb = stub;
        });
        await fillForm(page, '400');

        const saved = await page.evaluate(async () => {
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.showToast = () => {};
            // 첫 제출이 끝나기 전에 두 번 더 누른다
            const a = mgr.submitForm();
            const b = mgr.submitForm();
            const c = mgr.submitForm();
            await Promise.all([a, b, c]);
            return (mgr.sampleLogs || []).map((l) => `${l.name}:${l.receptionNumber}`);
        });

        expect(saved.filter((s) => s === '홍길동:400'), `이중 등록: ${saved}`).toHaveLength(1);
    });
});
