// @ts-check
// SAMPL-1-168: 그룹 수정 경로에는 접수번호 중복 검사가 아예 없었다 — 로컬조차
//
// SAMPL-1-167 독립 리뷰가 "그룹 수정은 클라우드 확인을 우회한다"고 지적했는데,
// 확인해 보니 그보다 컸다. `grep -c duplicateNumbers` → 3, **전부 신규 등록 분기**였다.
// 기존 접수를 열어 접수번호를 이미 있는 번호로 바꾸면 아무 경고 없이 저장됐다.
//
// ⚠️ 이 스펙이 지키는 계약은 **둘**이고, 둘째가 더 위험하다:
//    ① 다른 접수의 번호로 바꾸면 막는다 (로컬·클라우드 양쪽)
//    ② **자기 번호를 그대로 두면 통과한다** — 자기 제외를 잘못 만들면
//       아무것도 바꾸지 않은 저장조차 막히고, 담당자에게는 앱이 고장난 것과 같다.
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

/** Firebase를 흉내낸다. SAMPL-1-167 스펙과 같은 이유로 `firestoreDb`를 겨냥한다. */
async function stubCloud(page, cloudLogs, enabled = true) {
    await page.evaluate(([logs, on]) => {
        const mgr = /** @type {any} */ (window).soilManager;
        /** @type {any} */ (window).firebaseConfig = { isEnabled: () => on };
        if (!on) return;
        mgr._firebaseCache.clear();
        const db = /** @type {any} */ (window).firestoreDb || {};
        const stub = Object.assign(Object.create(Object.getPrototypeOf(db) || Object.prototype), db);
        delete stub.getAllWithMeta;
        stub.getAll = async () => logs;
        /** @type {any} */ (window).firestoreDb = stub;
    }, [cloudLogs, enabled]);
}

/**
 * 기존 그룹 접수 한 건을 로컬에 심고 수정 화면을 연다.
 * 실제 등록을 거치지 않는 이유: 이 스펙이 보려는 것은 **수정 분기**이고,
 * 등록 경로의 재부여가 끼면 무엇이 막았는지 흐려진다.
 */
async function seedAndEdit(page, receptionNumber, groupId = 'g-1', others = []) {
    await page.evaluate(([rn, gid, extra]) => {
        const mgr = /** @type {any} */ (window).soilManager;
        const year = String(mgr.selectedYear);
        const rec = {
            id: 'own-1', groupId: gid, receptionNumber: rn, name: '홍길동',
            phoneNumber: '010-1234-5678', date: '2026-08-21', subCategory: '밭',
            landClass1: '농가의뢰', purpose: '토양검정', receptionMethod: '방문',
            lotAddress: '문단리 224', area: '100', cropsDisplay: '고추',
            parcelIndex: 1, cropIndex: 0,
            parcels: [{ lotAddress: '문단리 224', crops: [{ name: '고추', area: '100' }] }],
            updatedAt: '2026-08-21T00:00:00.000Z',
        };
        const all = [rec, ...extra];
        localStorage.setItem(mgr.getStorageKey(year), JSON.stringify(all));
        mgr.sampleLogs = all;
        // ⚠️ **앱의 실제 수정 열기 경로를 쓴다.** editingGroupIds만 손으로 세우면
        //    폼이 비어 있어 접수번호가 1로 읽히고(실측), 검사가 아니라 채번을
        //    시험하게 된다 — 무엇을 검증했는지 알 수 없어진다.
        mgr.populateFormForGroupEdit([rec]);
    }, [receptionNumber, groupId, others]);
}

/** 수정 폼을 채우고 저장한다. `newNumber`가 null이면 기존 번호를 그대로 둔다. */
async function editAndSubmit(page, newNumber, newName = '홍길동') {
    await page.evaluate(([rn, name]) => {
        const set = (id, v) => {
            const el = /** @type {any} */ (document.getElementById(id));
            if (el) { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }
        };
        set('receptionMethod', '방문');
        set('name', name);
        set('phoneNumber', '010-1234-5678');
        set('date', '2026-08-21');
        set('subCategory', '밭');
        set('landClass1', '농가의뢰');
        if (rn !== null) set('receptionNumber', rn);
        const purpose = /** @type {any} */ (document.getElementById('purpose'));
        if (purpose && purpose.options.length > 1) {
            purpose.selectedIndex = 1;
            purpose.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }, [newNumber, newName]);
    await page.locator('.lot-address-input').first().fill('문단리 224');
    await page.locator('.crop-direct-input').first().fill('고추');
    await page.locator('.area-direct-input').first().fill('100');

    return page.evaluate(async () => {
        const mgr = /** @type {any} */ (window).soilManager;
        const toasts = [];
        const orig = mgr.showToast.bind(mgr);
        mgr.showToast = (msg, type) => { toasts.push({ msg, type }); return orig(msg, type); };
        await mgr.submitForm();
        return {
            toasts,
            saved: (mgr.sampleLogs || []).map((l) => `${l.name}:${l.receptionNumber}`),
        };
    });
}

const rec = (id, rn, name) => ({
    id, receptionNumber: rn, name, subCategory: '밭', landClass1: '농가의뢰',
    date: '2026-03-11', updatedAt: '2026-03-11T00:00:00.000Z', parcels: [],
});

test.describe('그룹 수정의 접수번호 중복 검사 (SAMPL-1-168)', () => {
    // 🚨 가장 중요한 계약. 자기 제외가 깨지면 정상 수정이 전부 막힌다.
    test('자기 번호를 그대로 두면 통과한다 (과잉차단 방지)', async ({ page }) => {
        await openSoil(page);
        // 자기 자신의 클라우드 사본. **id가 같다** — Firestore 문서 id가 레코드 id이고,
        // `smartMerge`도 id로 짝짓는다. id가 다르면 그것은 사본이 아니라 진짜 중복이다.
        await stubCloud(page, [{ ...rec('own-1', '328', '홍길동'), groupId: 'g-1' }]);
        await seedAndEdit(page, '328');

        const out = await editAndSubmit(page, '328', '홍길순');   // 번호는 그대로, 이름만 수정

        const blocked = out.toasts.find((t) => String(t.msg).includes('이미 다른 접수에'));
        expect(blocked, `자기 번호인데 막혔다: ${JSON.stringify(out.toasts)}`).toBeFalsy();
        expect(out.saved.some((s) => s === '홍길순:328'), `수정이 저장되지 않았다: ${out.saved}`).toBe(true);
    });

    test('번호를 아예 건드리지 않아도 통과한다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [], false);   // Firebase 꺼짐 — 로컬만
        await seedAndEdit(page, '328');

        const out = await editAndSubmit(page, null, '홍길순');

        expect(out.toasts.filter((t) => String(t.msg).includes('이미 다른 접수에'))).toEqual([]);
        expect(out.saved.some((s) => s === '홍길순:328'), `저장됨: ${out.saved}`).toBe(true);
    });

    // 🚨 이 티켓이 없애려는 것. 예전에는 로컬조차 검사하지 않아 그냥 저장됐다.
    test('로컬의 다른 접수 번호로 바꾸면 막는다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [], false);
        // 같은 경지구분에 이미 500번을 쓰는 **다른** 접수가 있다
        await seedAndEdit(page, '328', 'g-1', [{
            id: 'other-1', groupId: 'g-2', receptionNumber: '500', name: '박성권',
            landClass1: '농가의뢰', subCategory: '밭', date: '2026-08-21',
            parcelIndex: 1, cropIndex: 0, parcels: [],
            updatedAt: '2026-08-21T00:00:00.000Z',
        }]);

        const out = await editAndSubmit(page, '500');

        const blocked = out.toasts.find((t) => String(t.msg).includes('이미 다른 접수에'));
        expect(blocked, `막지 않았다: ${JSON.stringify(out.toasts)}`).toBeTruthy();
        expect(blocked.msg).toContain('500');
        // 막았으면 **아무것도 바꾸지 않아야** 한다 — 기존 접수가 사라지면 안 된다
        expect(out.saved.some((s) => s === '홍길동:328'), `기존 접수가 사라졌다: ${out.saved}`).toBe(true);
        expect(out.saved.some((s) => s.endsWith(':500') && s.startsWith('홍길동')), `저장됨: ${out.saved}`).toBe(false);
    });

    // 🚨 SAMPL-1-167이 등록에서 막은 것과 같은 구멍이 수정에도 있었다
    test('클라우드에만 있는 번호로 바꿔도 막는다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [rec('cloud-500', '500', '박성권')]);
        await seedAndEdit(page, '328');

        const out = await editAndSubmit(page, '500');

        const blocked = out.toasts.find((t) => String(t.msg).includes('이미 다른 접수에'));
        expect(blocked, `클라우드 번호를 놓쳤다: ${JSON.stringify(out.toasts)}`).toBeTruthy();
        expect(out.saved.some((s) => s === '홍길동:328'), `기존 접수가 사라졌다: ${out.saved}`).toBe(true);
    });

    // ⚠️ 자기 제외는 **id와 groupId 두 갈래**다. 아래 두 시험은 각각 한 갈래만
    //    살아 있어도 통과하지 않도록, 다른 갈래가 듣지 않는 상황을 만든다.
    //    (변이 검증에서 둘이 서로를 가려 어느 쪽도 죽은 코드로 보였다.)

    // groupId가 없는 옛 레코드 — 이때는 **id 제외만이** 정상 수정을 살린다
    test('groupId 없는 옛 접수도 자기 번호로 저장된다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [], false);
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            const year = String(mgr.selectedYear);
            const rec = {
                id: 'own-1', receptionNumber: '328', name: '홍길동',   // groupId 없음
                phoneNumber: '010-1234-5678', date: '2026-08-21', subCategory: '밭',
                landClass1: '농가의뢰', purpose: '토양검정', receptionMethod: '방문',
                lotAddress: '문단리 224', area: '100', cropsDisplay: '고추',
                parcelIndex: 1, cropIndex: 0,
                parcels: [{ lotAddress: '문단리 224', crops: [{ name: '고추', area: '100' }] }],
                updatedAt: '2026-08-21T00:00:00.000Z',
            };
            localStorage.setItem(mgr.getStorageKey(year), JSON.stringify([rec]));
            mgr.sampleLogs = [rec];
            mgr.populateFormForGroupEdit([rec]);
        });

        const out = await editAndSubmit(page, '328', '홍길순');

        const blocked = out.toasts.find((t) => String(t.msg).includes('이미 다른 접수에'));
        expect(blocked, `옛 레코드의 자기 번호가 막혔다: ${JSON.stringify(out.toasts)}`).toBeFalsy();
        expect(out.saved.some((s) => s === '홍길순:328'), `저장됨: ${out.saved}`).toBe(true);
    });

    // 다른 자리에서 이 그룹에 필지가 추가됐다 — id는 모르지만 **같은 접수**다.
    // 이때는 **groupId 제외만이** 정상 수정을 살린다.
    test('다른 자리가 같은 그룹에 추가한 레코드는 충돌이 아니다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [{ ...rec('cloud-extra', '328', '홍길동'), groupId: 'g-1' }]);
        await seedAndEdit(page, '328');

        const out = await editAndSubmit(page, '328', '홍길순');

        const blocked = out.toasts.find((t) => String(t.msg).includes('이미 다른 접수에'));
        expect(blocked, `같은 그룹인데 막혔다: ${JSON.stringify(out.toasts)}`).toBeFalsy();
        expect(out.saved.some((s) => s === '홍길순:328'), `저장됨: ${out.saved}`).toBe(true);
    });

    // 채번은 경지구분 1차별 독립이다 — 다른 구분의 같은 번호는 충돌이 아니다
    test('다른 경지구분의 같은 번호는 막지 않는다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [{ ...rec('cloud-500', '500', '박성권'), landClass1: '공익직불제' }]);
        await seedAndEdit(page, '328');

        const out = await editAndSubmit(page, '500');

        expect(out.toasts.filter((t) => String(t.msg).includes('이미 다른 접수에'))).toEqual([]);
        expect(out.saved.some((s) => s === '홍길동:500'), `저장됨: ${out.saved}`).toBe(true);
    });
});

test.describe('단일 수정의 접수번호 중복 검사 (SAMPL-1-168 · 독립 리뷰 MAJOR)', () => {
    // 🚨 처음에 "단일 수정은 번호를 못 바꾼다"고 판단해 범위에서 뺐는데 **틀렸다**.
    //    `collectCommonFormData`에는 번호가 없지만 그 아래에서 다시 읽는다:
    //      updatedLog = { ...existingLog, ...collectCommonFormData(formData),
    //                     receptionNumber: formData.get('receptionNumber'), ... }
    //    독립 리뷰가 잡았다. 이 무리는 그 판단이 다시 틀리지 않도록 붙잡아 둔다.

    /** 단일 수정 대상 한 건을 심고 수정 화면을 연다 */
    async function seedSingleEdit(page, receptionNumber, others = []) {
        await page.evaluate(([rn, extra]) => {
            const mgr = /** @type {any} */ (window).soilManager;
            const year = String(mgr.selectedYear);
            const rec = {
                id: 'own-1', groupId: 'g-1', receptionNumber: rn, name: '홍길동',
                phoneNumber: '010-1234-5678', date: '2026-08-21', subCategory: '밭',
                landClass1: '농가의뢰', purpose: '토양검정', receptionMethod: '방문',
                lotAddress: '문단리 224', area: '100', cropsDisplay: '고추',
                parcelIndex: 1, cropIndex: 0,
                parcels: [{ lotAddress: '문단리 224', crops: [{ name: '고추', area: '100' }] }],
                updatedAt: '2026-08-21T00:00:00.000Z',
            };
            const all = [rec, ...extra];
            localStorage.setItem(mgr.getStorageKey(year), JSON.stringify(all));
            mgr.sampleLogs = all;
            mgr.editSample('own-1');   // 앱의 실제 단일 수정 경로
        }, [receptionNumber, others]);
    }

    test('다른 접수의 번호로 바꾸면 막는다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [], false);
        await seedSingleEdit(page, '328', [{
            id: 'other-1', groupId: 'g-2', receptionNumber: '500', name: '박성권',
            landClass1: '농가의뢰', subCategory: '밭', date: '2026-08-21',
            parcelIndex: 1, cropIndex: 0, parcels: [],
            updatedAt: '2026-08-21T00:00:00.000Z',
        }]);

        const out = await editAndSubmit(page, '500');

        const blocked = out.toasts.find((t) => String(t.msg).includes('이미 다른 접수에'));
        expect(blocked, `단일 수정이 중복을 통과시켰다: ${JSON.stringify(out.toasts)}`).toBeTruthy();
        expect(out.saved.some((s) => s === '홍길동:328'), `기존 접수가 사라졌다: ${out.saved}`).toBe(true);
    });

    test('자기 번호를 그대로 두면 통과한다 (과잉차단 방지)', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [], false);
        await seedSingleEdit(page, '328');

        const out = await editAndSubmit(page, '328', '홍길순');

        expect(out.toasts.filter((t) => String(t.msg).includes('이미 다른 접수에'))).toEqual([]);
        expect(out.saved.some((s) => s === '홍길순:328'), `저장됨: ${out.saved}`).toBe(true);
    });

    // 하위필지·분할로 `5-1`이 폼에 올라온다. 한쪽만 원문으로 비교하면 겹침을 통째로 놓친다.
    test('하위번호(5-1)로 열려도 기준번호로 비교한다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [], false);
        await seedSingleEdit(page, '328-1', [{
            id: 'other-1', groupId: 'g-2', receptionNumber: '500', name: '박성권',
            landClass1: '농가의뢰', subCategory: '밭', date: '2026-08-21',
            parcelIndex: 1, cropIndex: 0, parcels: [],
            updatedAt: '2026-08-21T00:00:00.000Z',
        }]);

        const out = await editAndSubmit(page, '500-1');

        const blocked = out.toasts.find((t) => String(t.msg).includes('이미 다른 접수에'));
        expect(blocked, `하위번호라서 놓쳤다: ${JSON.stringify(out.toasts)}`).toBeTruthy();
    });

    // 성토(F) 번호도 같은 규칙을 받아야 한다 — 독립 리뷰가 미검증으로 지적한 경계
    test('성토(F) 번호도 중복이면 막는다', async ({ page }) => {
        await openSoil(page);
        await stubCloud(page, [], false);
        await seedSingleEdit(page, 'F3', [{
            id: 'other-1', groupId: 'g-2', receptionNumber: 'F7', name: '박성권',
            landClass1: '농가의뢰', subCategory: '성토', date: '2026-08-21',
            parcelIndex: 1, cropIndex: 0, parcels: [],
            updatedAt: '2026-08-21T00:00:00.000Z',
        }]);

        const out = await editAndSubmit(page, 'F7');

        const blocked = out.toasts.find((t) => String(t.msg).includes('이미 다른 접수에'));
        expect(blocked, `F번호를 놓쳤다: ${JSON.stringify(out.toasts)}`).toBeTruthy();
    });
});
