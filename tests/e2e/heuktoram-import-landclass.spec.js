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

// SAMPL-1-182: 모호 번호마다 경고줄이 하나씩 쌓여 120행이면 요약 영역이 수천 px가 됐다.
const rangeLogs = (landClass1, prefix, n) =>
    Array.from({ length: n }, (_, i) => log(`${prefix}${i + 1}`, String(i + 1), landClass1));

/** 저장된 분석값(pH) 건수와 키 */
const storedPh = (page) => page.evaluate((year) => {
    const ls = JSON.parse(localStorage.getItem(`soilTestResults_${year}`) || '{}');
    return Object.keys(ls).filter((k) => ls[k]?.pH != null && ls[k].pH !== '');
}, YEAR);

test('모호 번호 120개는 경고 한 줄로 합쳐지고 저장은 여전히 0건이다', async ({ page }) => {
    const logs = [...rangeLogs('농가의뢰', 'f', 120), ...rangeLogs('공익직불제', 'g', 120), log('u', '999', '농가의뢰')];
    await openHeuktoram(page, logs);
    const tsv = ['시료번호\tpH', ...Array.from({ length: 120 }, (_, i) => `${i + 1}\t6.5`), '999\t7.7'].join('\n');
    await page.locator('#importResultBtn').click();
    await page.locator('input[name="importerMode"][value="paste"]').check();
    await page.locator('#importerTextarea').fill(tsv);
    await page.locator('#autoMapImporterBtn').click();

    const bar = page.locator('#importerSummary .importer-warning-bar');
    const lines = (await bar.innerText()).split('\n').filter(Boolean);
    expect(lines, '모호 번호마다 경고줄이 쌓였다').toHaveLength(1);
    expect(lines[0]).toContain('시료번호 120개가 여러 경지구분에 있어 저장하지 않았습니다(1, 2, 3 … 외 117개)');
    expect(await page.locator('#importerSummary').innerText()).toContain('120건 미매칭');

    await page.locator('#saveResultImporterBtn').click();
    expect(await storedPh(page), '모호한 번호가 저장됐다').toEqual(['u_0_0']);
});

test('모호 사유 종류별로 경고는 한 줄씩이고, 행별 사유는 미매칭 목록에 남는다', async ({ page }) => {
    const dup = log('d2', '9', '농가의뢰');
    await openHeuktoram(page, [A, B, C, log('d1', '9', '농가의뢰'), dup]);
    await page.locator('#importResultBtn').click();
    await page.locator('input[name="importerMode"][value="paste"]').check();
    await page.locator('#importerTextarea').fill('시료번호\tpH\n5\t6.5\n9\t6.6\n7\t7.1');
    await page.locator('#autoMapImporterBtn').click();
    const lines = (await page.locator('#importerSummary .importer-warning-bar').innerText()).split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);
    expect(lines.join('|')).toContain('시료번호 1개가 여러 경지구분에 있어');
    expect(lines.join('|')).toContain('시료번호 1개가 같은 경지구분에 여러 건 있어');
    const list = await page.locator('#importerPreviewList').innerText();
    expect(list).toContain('같은 경지구분(농가의뢰)에 2건 있음');
    // 흙토람 화면에 없는 조작(「경지구분을 골라 가져오세요」)을 안내하지 않는다
    expect(list).toContain('토양 목록에서 경지구분 탭을 고르고 행을 선택한 뒤 흙토람을 여세요');
    expect(list).not.toContain('경지구분을 골라 가져오세요');
});

// 경고 합치기는 입력 순서·필드 수와 무관해야 한다. 합치는 블록이 행·필드 반복문 안에 있으면
// 매칭 행이 모호 행보다 앞이거나 없을 때 경고가 사라지고, 필드가 많으면 같은 문장이 쌓인다.
const MULTI = '시료번호 2개가 여러 경지구분에 있어 저장하지 않았습니다(5, 6)';
const dupPair = (n) => [log(`m${n}`, String(n), '농가의뢰'), log(`n${n}`, String(n), '공익직불제')];
for (const [label, tsv] of [
    ['매칭 행이 모호 행보다 앞', '시료번호\tpH\n7\t7.1\n5\t6.5\n6\t6.6'],
    ['매칭 행이 없음', '시료번호\tpH\n5\t6.5\n6\t6.6'],
    ['필드가 둘이고 매칭 행이 마지막', '시료번호\tpH\t유기물\n5\t6.5\t2.1\n6\t6.6\t2.2\n7\t7.1\t2.3'],
    ['매칭 행과 모호 행이 섞임', '시료번호\tpH\n5\t6.5\n7\t7.1\n6\t6.6\n8\t7.2'],
]) {
    test(`경고는 정확히 한 줄이다: ${label}`, async ({ page }) => {
        await openHeuktoram(page, [...dupPair(5), ...dupPair(6), log('u7', '7', '농가의뢰'), log('u8', '8', '농가의뢰')]);
        await page.locator('#importResultBtn').click();
        await page.locator('input[name="importerMode"][value="paste"]').check();
        await page.locator('#importerTextarea').fill(tsv);
        await page.locator('#autoMapImporterBtn').click();
        const lines = (await page.locator('#importerSummary .importer-warning-bar').innerText()).split('\n').filter(Boolean);
        expect(lines).toEqual([MULTI]);
    });
}

test('붙여넣기 모드 미매칭 CSV: 데이터 행이 헤더보다 칸이 많아도 _사유 제목이 사유 값 위에 온다', async ({ page }) => {
    await openHeuktoram(page, [A, B, C]);
    await page.locator('#importResultBtn').click();
    await page.locator('input[name="importerMode"][value="paste"]').check();
    await page.locator('#importerTextarea').fill('시료번호\tpH\n5\t6.5\t메모\n7\t7.1\t-');
    await page.locator('#autoMapImporterBtn').click();
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#downloadUnmatchedCsvBtn').click(),
    ]);
    const chunks = [];
    for await (const c of await download.createReadStream()) chunks.push(c);
    const [header, row] = Buffer.concat(chunks).toString('utf8').replace(/^﻿/, '').split('\r\n');
    expect(header).toBe('_원본행번호,시료번호,pH,열3,_사유');
    expect(row.startsWith('2,5,6.5,메모,')).toBe(true);
});

// 공백뿐인 경지구분은 누락(농가의뢰)과 같이 본다 — 내보내기(dataRow[3])와 같은 기준
test('syncToSiblings: 공백뿐인 landClass1은 누락(농가의뢰)과 같은 경지구분으로 묶는다', async ({ page }) => {
    await openHeuktoram(page, [log('s1', '5', '   '), log('s2', '5-1', undefined), log('s3', '5-2', '공익직불제')]);
    const out = await page.evaluate(() => {
        const m = /** @type {any} */ (window).heuktoramManager;
        const key = (id) => m.flatRows.find((r) => r.log.id === id).key;
        m.syncToSiblings(key('s1'), 'pH', '6.5');
        return { s2: m.testResults[key('s2')]?.pH ?? null, s3: m.testResults[key('s3')]?.pH ?? null };
    });
    expect(out).toEqual({ s2: '6.5', s3: null });
});
