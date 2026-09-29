// @ts-check
// SAMPL-1-178 독립 검증: 토양의 공통 엑셀 가져오기(ExcelImportManager)가 접수번호를
// **경지구분과 무관하게** 비교했다. 가져온 행은 경지구분이 없어 농가의뢰인데,
// 공익직불제 5가 있으면 농가의뢰 5를 "이미 쓰이고 있다"며 막고, 자동부여는
// 공익직불제 번호 위로 건너뛰었다. 폼·붙여넣기 가져오기(soil-result-importer)는
// 경지구분 범위로 보므로 같은 번호가 경로마다 다르게 판정됐다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const EXPECTED_VERSION = require('../../package.json').version;
const HEADER = ['접수번호', '구분', '목적(용도)', '필지 주소', '작물', '면적(m2)', '비고'];
const row = (rn, addr) => [rn, '밭', '일반재배', addr, '고추', '100', ''];
const rec = (id, rn, landClass1, extra = {}) => ({
    id, receptionNumber: rn, name: '민원인-' + id, date: '2026-09-01',
    subCategory: '밭', landClass1, parcels: [], ...extra,
});

async function openSoil(page, localLogs, cloudLogs) {
    page.on('dialog', (d) => d.accept().catch(() => {}));
    await page.goto('/soil/');
    await page.waitForFunction(() => {
        const m = /** @type {any} */ (window).soilManager;
        return !!m && !!m.tableBody;
    }, null, { timeout: 15000 });
    expect(await page.evaluate(() => /** @type {any} */ (window).APP_VERSION)).toBe(EXPECTED_VERSION);
    await page.evaluate(([local, cloud]) => {
        const w = /** @type {any} */ (window);
        const mgr = w.soilManager;
        localStorage.clear();
        mgr.sampleLogs = local;
        localStorage.setItem(mgr.getStorageKey(mgr.selectedYear), JSON.stringify(local));
        if (cloud) {
            w.firebaseConfig = { isEnabled: () => true };
            mgr._firebaseCache?.clear();
            const db = w.firestoreDb || {};
            const stub = Object.assign(Object.create(Object.getPrototypeOf(db) || Object.prototype), db);
            delete stub.getAllWithMeta;
            stub.getAll = async () => cloud;
            w.firestoreDb = stub;
        } else {
            w.firebaseConfig = { isEnabled: () => false };
        }
    }, [localLogs, cloudLogs]);
}

// excel-import-dup-check.spec.js와 같은 방식 — 실제 파일 입력 경로로 넣는다
async function importSheet(page, aoa) {
    await page.evaluate((rows) => {
        const X = /** @type {any} */ (window).XLSX;
        const wb = X.utils.book_new();
        X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(rows), 'Sheet1');
        const out = X.write(wb, { bookType: 'xlsx', type: 'array' });
        const file = new File([out], 'import.xlsx',
            { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const dt = new DataTransfer();
        dt.items.add(file);
        const input = /** @type {any} */ (document.getElementById('excelImportInput'));
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }, aoa);
    const modal = page.locator('#excelImportModal');
    await expect(modal).not.toHaveClass(/hidden/);
    await page.click('#excelImportNextBtn');
    await page.click('#excelImportNextBtn');
    return modal;
}

/** 저장된 (접수번호, 경지구분) 쌍 — 메모리가 아니라 localStorage에서 */
async function persisted(page) {
    return page.evaluate(() => {
        const mgr = /** @type {any} */ (window).soilManager;
        const raw = localStorage.getItem(mgr.getStorageKey(mgr.selectedYear));
        return (raw ? JSON.parse(raw) : []).map((l) => [String(l.receptionNumber), l.landClass1 || '농가의뢰']);
    });
}

test.describe('토양 엑셀 가져오기의 접수번호 판정은 경지구분 범위다 (SAMPL-1-178 독립 검증)', () => {
    test('로컬에 공익직불제 5만 있으면 시트의 농가의뢰 5는 중복이 아니다', async ({ page }) => {
        await openSoil(page, [rec('g', '5', '공익직불제')], null);
        const modal = await importSheet(page, [HEADER, row('5', '문단리 1')]);
        await page.click('#excelImportNextBtn');
        await expect(modal, '다른 경지구분의 같은 번호를 중복으로 막았다').toHaveClass(/hidden/);
        expect(await persisted(page)).toEqual([['5', '공익직불제'], ['5', '농가의뢰']]);
    });

    test('클라우드에 공익직불제 5만 있어도 같다', async ({ page }) => {
        await openSoil(page, [], [rec('cloud-g', '5', '공익직불제', { updatedAt: '2026-09-01T00:00:00.000Z' })]);
        const modal = await importSheet(page, [HEADER, row('5', '문단리 1')]);
        await page.click('#excelImportNextBtn');
        await expect(modal, '클라우드의 다른 경지구분 번호를 중복으로 막았다').toHaveClass(/hidden/);
        expect(await persisted(page)).toEqual([['5', '농가의뢰']]);
    });

    // 과잉차단 방지의 반대편 — 같은 경지구분의 겹침은 여전히 막아야 한다
    test('로컬에 농가의뢰 5가 있으면 시트의 5는 여전히 막힌다', async ({ page }) => {
        await openSoil(page, [rec('a', '5', '농가의뢰')], null);
        const modal = await importSheet(page, [HEADER, row('5', '문단리 1')]);
        await page.click('#excelImportNextBtn');
        await expect(modal, '같은 경지구분의 중복을 놓쳤다').not.toHaveClass(/hidden/);
        expect(await persisted(page)).toEqual([['5', '농가의뢰']]);
    });

    test('자동부여는 농가의뢰 시퀀스에서 이어진다 (공익직불제 번호 위로 건너뛰지 않는다)', async ({ page }) => {
        await openSoil(page, [
            rec('a1', '1', '농가의뢰'), rec('a2', '2', '농가의뢰'),
            rec('g1', '30', '공익직불제'), rec('f1', 'F40', '농가의뢰', { subCategory: '성토' }),
        ], null);
        const modal = await importSheet(page, [HEADER, row('', '문단리 1'), row('', '문단리 2')]);
        await page.click('#excelImportNextBtn');
        await expect(modal).toHaveClass(/hidden/);
        // onImportComplete가 F를 떼고 숫자순 정렬하므로 F40이 맨 뒤다
        const saved = (await persisted(page)).filter(([, lc]) => lc === '농가의뢰').map(([rn]) => rn);
        expect(saved, `가져온 번호: ${saved}`).toEqual(['1', '2', '3', '4', 'F40']);
    });
});
