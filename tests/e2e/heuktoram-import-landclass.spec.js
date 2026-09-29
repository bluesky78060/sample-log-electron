// @ts-check
// SAMPL-1-178 연장: 흙토람 결과 가져오기의 매칭 키는 시료번호뿐이라, 경지구분이 다른
// 같은 번호('농가의뢰 5'·'공익직불제 5')가 한 표에 오르면 `keyMap`(Map<번호, 행>)에서
// 마지막 행이 이겼다. 가져온 분석값이 **저장 순서에 따라** 남의 시료에 들어갔고 경고도 없었다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const EXPECTED_VERSION = require('../../package.json').version;
const YEAR = '2026';

const log = (id, rn, landClass1) => ({
    id, receptionNumber: rn, name: '민원인-' + id, date: '2026-09-01',
    subCategory: '밭', landClass1, parcels: [],
});
// 흙토람은 접수번호로 정렬하지만 같은 번호끼리는 저장 순서를 유지한다(stable sort)
const A = log('a', '5', '농가의뢰');
const B = log('b', '5', '공익직불제');
const C = log('c', '7', '농가의뢰');       // 유일한 번호 — 양성 대조

async function openHeuktoram(page, logs) {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.addInitScript(([year, l]) => {
        localStorage.setItem(`soilSampleLogs_${year}`, JSON.stringify(l));
        localStorage.setItem('heuktoram_year', year);
    }, [YEAR, logs]);
    const res = await page.goto('/heuktoram/');
    expect(res && res.status(), 'docs/heuktoram/ 없음 — `npm run build` 먼저').toBeLessThan(400);
    await page.waitForFunction((n) => {
        const m = /** @type {any} */ (window).heuktoramManager;
        return !!m && Array.isArray(m.flatRows) && m.flatRows.length === n;
    }, logs.length, { timeout: 15000 });
    expect(await page.evaluate(() => /** @type {any} */ (window).APP_VERSION),
        '다른 프로젝트의 docs/를 검증하고 있다').toBe(EXPECTED_VERSION);
}

/** 붙여넣기 → 자동 매핑 → 저장. 저장된 pH를 localStorage에서 읽는다 */
async function importAndRead(page, tsv) {
    await page.locator('#importResultBtn').click();
    await expect(page.locator('#resultImporterModal')).not.toHaveClass(/hidden/);
    await page.locator('input[name="importerMode"][value="paste"]').check();
    await page.locator('#importerTextarea').fill(tsv);
    await page.locator('#autoMapImporterBtn').click();
    const summary = await page.locator('#importerSummary').innerText();
    const list = await page.locator('#importerPreviewList').innerText();
    await page.locator('#saveResultImporterBtn').click();
    const stored = await page.evaluate((year) => {
        const ls = JSON.parse(localStorage.getItem(`soilTestResults_${year}`) || '{}');
        return Object.fromEntries(['a', 'b', 'c'].map((id) => [id, ls[`${id}_0_0`]?.pH ?? null]));
    }, YEAR);
    return { summary, list, stored };
}

const TSV = '시료번호\tpH\n5\t6.5\n7\t7.1';

for (const [label, logs] of [['농가의뢰 5 → 공익직불제 5', [A, B, C]], ['공익직불제 5 → 농가의뢰 5', [B, A, C]]]) {
    test(`저장 순서 ${label}: 시료번호 5는 어느 쪽에도 들어가지 않고 사유가 보인다`, async ({ page }) => {
        await openHeuktoram(page, logs);
        const { summary, list, stored } = await importAndRead(page, TSV);
        expect(stored, '같은 번호가 여러 경지구분에 있는데 한쪽에 저장됐다').toEqual({ a: null, b: null, c: '7.1' });
        expect(summary).toContain('1건 미매칭');
        expect(list).toContain('여러 경지구분');
        expect(list).toContain('농가의뢰');
        expect(list).toContain('공익직불제');
    });
}
