// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 성토 행 엑셀 가져오기 접수번호 회귀 (SAMPL-1-153)
 *
 * 수정 전 증상: 구분='성토' 행을 가져오면 미리보기는 1,2,3인데 실제로는 1,1,1이
 * 저장되고, 이후 일반 접수의 자동채번이 영구히 1번에 고정됐다.
 *
 * 이 스펙이 단정하는 방식이 중요하다 — 단위 테스트는 순수 계층만 덮고,
 * `sampleLogs`(메모리 배열)만 읽거나 `not.toBe('')` 수준으로 단정하면
 * **전 레코드가 '1'이어도 통과한다**. 실제로 테스트 프로젝트에서 75건이 전부
 * 통과하는 상태로 이 결함이 새어나갔다. 그래서:
 *   - 새로고침 후 localStorage를 읽어 지속성까지 확인한다
 *   - 접수번호 유일성과 **실제 번호값**을 정확 일치로 단정한다
 */

const PASTE_HEADER = '성명\t연락처\t지번주소\t작물\t면적\t구분\t목적';

/** 저장된 레코드를 localStorage에서 읽는다 (메모리 배열이 아니라) */
async function readPersisted(page) {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
    return page.evaluate(() => {
        const year = window.soilManager.selectedYear;
        const raw = localStorage.getItem(`soilSampleLogs_${year}`);
        return (raw ? JSON.parse(raw) : []).map((l) => ({
            receptionNumber: String(l.receptionNumber ?? ''),
            name: l.name ?? '',
            subCategory: l.subCategory ?? '',
        }));
    });
}

/** 접수번호가 모두 채워져 있고 중복이 없는지 */
function expectUniqueReceptionNumbers(records) {
    const nums = records.map((r) => r.receptionNumber);
    for (const n of nums) {
        expect(n).not.toBe('');
        expect(n).not.toBe('null');
        expect(n).not.toBe('undefined');
    }
    expect(new Set(nums).size, `접수번호 중복: ${nums.join(', ')}`).toBe(nums.length);
}

/** 모달을 열고 붙여넣기 모드로 데이터를 입력한 뒤 자동매핑까지 수행 */
async function pasteAndAutoMap(page, dataRows) {
    await page.click('#soilImportBtn');
    const modal = page.locator('#soilImporterModal');
    await expect(modal).toBeVisible();
    await modal.locator('input[name="sriMode"][value="paste"]').check();
    await modal.locator('[data-el="textarea"]').fill([PASTE_HEADER, ...dataRows].join('\n'));
    await modal.locator('[data-act="automap"]').click();
    return modal;
}

/** 미리보기 표의 접수번호 열(2번째 셀) */
function previewNumbers(modal) {
    return modal.locator('.sri-pv-table tbody tr td:nth-child(2)').allTextContents();
}

test.describe('성토 행 가져오기 접수번호 (SAMPL-1-153)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/soil/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
        await page.evaluate(() => localStorage.clear());
    });

    test('구분=성토 행은 F 접두 시퀀스로 채번되고 중복되지 않는다', async ({ page }) => {
        const modal = await pasteAndAutoMap(page, [
            '성토1\t010-1111-1111\t봉화읍 내성리 1\t-\t100\t성토\t일반재배',
            '성토2\t010-2222-2222\t봉화읍 내성리 2\t-\t200\t성토\t일반재배',
            '성토3\t010-3333-3333\t봉화읍 내성리 3\t-\t300\t성토\t일반재배',
        ]);

        // 미리보기가 F 접두를 보여준다 (수정 전에는 1, 2, 3)
        expect(await previewNumbers(modal)).toEqual(['F1', 'F2', 'F3']);

        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();

        const persisted = await readPersisted(page);
        expect(persisted).toHaveLength(3);
        expect(persisted.every((s) => s.subCategory === '성토')).toBe(true);
        expectUniqueReceptionNumbers(persisted);
        // 미리보기가 보여준 번호와 실제 저장 번호가 같아야 한다 (수정 전에는 1, 1, 1)
        expect(persisted.map((s) => s.receptionNumber)).toEqual(['F1', 'F2', 'F3']);
    });

    test('가져오기 후에도 일반 자동채번이 1번에 고정되지 않는다', async ({ page }) => {
        // 수정 전에는 성토 레코드가 일반 풀에서 제외돼 카운터가 전진하지 않았다
        const modal = await pasteAndAutoMap(page, [
            '성토1\t010-1111-1111\t봉화읍 내성리 1\t-\t100\t성토\t일반재배',
            '일반1\t010-2222-2222\t봉화읍 내성리 2\t벼\t200\t논\t일반재배',
        ]);
        expect(await previewNumbers(modal)).toEqual(['F1', '1']);
        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();

        // 저장 후 일반 다음번호는 2여야 한다 (수정 전에는 1로 고정)
        const next = await page.evaluate(() =>
            window.soilManager.getNextNumberForClass(window.soilManager.selectedYear, '농가의뢰'),
        );
        expect(next).toBe(2);
    });

    test('일반·성토가 섞인 배치도 각자의 시퀀스로 채번된다', async ({ page }) => {
        const modal = await pasteAndAutoMap(page, [
            '일반A\t010-1111-1111\t봉화읍 내성리 1\t벼\t100\t논\t일반재배',
            '성토A\t010-2222-2222\t봉화읍 내성리 2\t-\t200\t성토\t일반재배',
            '일반B\t010-3333-3333\t봉화읍 내성리 3\t고추\t300\t밭\t일반재배',
            '성토B\t010-4444-4444\t봉화읍 내성리 4\t-\t400\t성토\t일반재배',
        ]);
        expect(await previewNumbers(modal)).toEqual(['1', 'F1', '2', 'F2']);

        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();

        const persisted = await readPersisted(page);
        expectUniqueReceptionNumbers(persisted);
        expect(persisted.map((s) => s.receptionNumber)).toEqual(['1', 'F1', '2', 'F2']);
    });

    test('기존 레코드가 있으면 두 시퀀스가 각자 이어진다', async ({ page }) => {
        // beforeEach가 저장소를 비우므로 여기서만 시드해
        // "빈 저장소에서만 통과하는 테스트" 사각지대를 덮는다
        await page.evaluate(() => {
            const year = window.soilManager.selectedYear;
            localStorage.setItem(`soilSampleLogs_${year}`, JSON.stringify([
                { id: 'seed-1', receptionNumber: '7', name: '기존일반', landClass1: '농가의뢰', subCategory: '논', parcels: [] },
                { id: 'seed-2', receptionNumber: 'F4', name: '기존성토', landClass1: '농가의뢰', subCategory: '성토', parcels: [] },
            ]));
        });
        // 매니저는 init 시점에 저장소를 읽으므로 새로고침해야 메모리에 반영된다
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => (window.soilManager?.sampleLogs || []).length === 2);

        const modal = await pasteAndAutoMap(page, [
            '신규일반\t010-1111-1111\t봉화읍 내성리 9\t벼\t100\t논\t일반재배',
            '신규성토\t010-2222-2222\t봉화읍 내성리 10\t-\t200\t성토\t일반재배',
        ]);
        // 기존 최대 일반 7 → 8, 기존 최대 성토 F4 → F5
        expect(await previewNumbers(modal)).toEqual(['8', 'F5']);

        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();

        const persisted = await readPersisted(page);
        expectUniqueReceptionNumbers(persisted);
        expect(persisted.map((s) => s.receptionNumber).sort()).toEqual(['7', '8', 'F4', 'F5']);
    });

    test('성토 행의 수동 번호가 기존 일반 번호와 겹치면 등록되지 않는다', async ({ page }) => {
        // 리뷰 회귀: 중복 판정 풀을 시퀀스별로 나눴다가 이 충돌을 놓쳐
        // 같은 접수번호가 두 건 저장됐다. 폼 등록 경로는 시퀀스 무관하게 막는다.
        await page.evaluate(() => {
            const year = window.soilManager.selectedYear;
            localStorage.setItem(`soilSampleLogs_${year}`, JSON.stringify([
                { id: 's1', receptionNumber: '1', name: '기존1', landClass1: '농가의뢰', subCategory: '논', parcels: [] },
                { id: 's2', receptionNumber: '2', name: '기존2', landClass1: '농가의뢰', subCategory: '논', parcels: [] },
            ]));
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => (window.soilManager?.sampleLogs || []).length === 2);

        // 접수번호 컬럼을 매핑해 수동 번호 경로를 태운다
        await page.click('#soilImportBtn');
        const modal = page.locator('#soilImporterModal');
        await expect(modal).toBeVisible();
        await modal.locator('input[name="sriMode"][value="paste"]').check();
        await modal.locator('[data-el="textarea"]').fill([
            '접수번호\t성명\t지번주소\t구분',
            '1\t성토A\t봉화읍 내성리 1\t성토',
            '2\t성토B\t봉화읍 내성리 2\t성토',
        ].join('\n'));
        await modal.locator('[data-act="automap"]').click();
        // 자동부여 체크를 해제해 매핑된 수동 번호를 쓰게 한다
        await modal.locator('[data-el="autoNumber"]').uncheck();

        await expect(modal.locator('.sri-pill.dup')).toContainText('중복 2');
        await expect(modal.locator('[data-act="import"]')).toBeDisabled();

        // 기본 정책(건너뛰기)에서 한 건도 등록되지 않고 대장이 그대로여야 한다
        const persisted = await readPersisted(page);
        expect(persisted.map((s) => s.receptionNumber)).toEqual(['1', '2']);
        expectUniqueReceptionNumbers(persisted);
    });

    test('일반 행만 가져오면 기존 동작이 유지된다 (회귀 방지)', async ({ page }) => {
        const modal = await pasteAndAutoMap(page, [
            '홍길동\t010-1111-2222\t봉화읍 내성리 123\t벼\t1200\t논\t일반재배',
            '김철수\t010-3333-4444\t물야면 오전리 45\t고추\t800\t밭\t일반재배',
        ]);
        expect(await previewNumbers(modal)).toEqual(['1', '2']);

        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();

        const persisted = await readPersisted(page);
        expect(persisted.map((s) => s.name)).toEqual(['홍길동', '김철수']);
        expectUniqueReceptionNumbers(persisted);
        expect(persisted.map((s) => s.receptionNumber)).toEqual(['1', '2']);
    });
});

/**
 * 서브넘버 행이 조용히 버려지던 문제 (SAMPL-1-154)
 *
 * 수정 전 증상: `5`, `5-1`, `5-2`를 가져오면 두 번째부터 "중복"으로 판정돼
 * 기본 정책(건너뛰기)에서 사라졌다. 사용자에게는 "⚠️ 중복 2건"으로만 보여
 * **정상 동작으로 오해**한다 — 그것이 가장 위험한 지점이었다.
 *
 * ⚠️ 이 스펙은 **저장된 결과**를 본다. 미리보기만 보면 접히는 것과 버려지는 것을
 *    구별할 수 없다 — SAMPL-1-153이 같은 함정에 빠졌다(미리보기 1,2,3 / 저장 1,1,1).
 */
const PASTE_HEADER_NUM = '접수번호\t성명\t연락처\t지번주소\t작물\t면적\t구분\t목적';

async function pasteWithNumbers(page, dataRows) {
    await page.click('#soilImportBtn');
    const modal = page.locator('#soilImporterModal');
    await expect(modal).toBeVisible();
    await modal.locator('input[name="sriMode"][value="paste"]').check();
    await modal.locator('[data-el="textarea"]').fill([PASTE_HEADER_NUM, ...dataRows].join('\n'));
    await modal.locator('[data-act="automap"]').click();
    // ⚠️ "접수번호 자동부여"는 **기본 켜짐**이다. 켜진 채로는 엑셀의 접수번호를
    //    아예 쓰지 않으므로(`autoAll`) 이 스펙이 검증하려는 경로에 도달하지 못한다.
    //    실제로 이 해제를 빼먹어 저장 번호가 1, 2로 나왔다.
    await modal.locator('[data-el="autoNumber"]').uncheck();
    return modal;
}

/** 저장된 레코드를 필지·하위필지까지 읽는다 */
async function readPersistedFull(page) {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
    return page.evaluate(() => {
        const year = window.soilManager.selectedYear;
        const raw = localStorage.getItem(`soilSampleLogs_${year}`);
        return (raw ? JSON.parse(raw) : []).map((l) => {
            const p = (l.parcels || [])[0] || {};
            return {
                rn: String(l.receptionNumber ?? ''),
                groupId: l.groupId ?? '',
                lotAddress: p.lotAddress ?? l.lotAddress ?? '',
                crops: (p.crops || []).map((c) => c.name),
                subLots: (p.subLots || []).map((s) => ({
                    addr: typeof s === 'string' ? s : s.lotAddress,
                    crops: (typeof s === 'string' ? [] : (s.crops || [])).map((c) => c.name),
                    areas: (typeof s === 'string' ? [] : (s.crops || [])).map((c) => c.area),
                })),
            };
        });
    });
}

test.describe('서브넘버 행 가져오기 (SAMPL-1-154)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/soil/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
        await page.evaluate(() => localStorage.clear());
    });

    // 🚨 이 티켓의 증상 그대로. 수정 전에는 저장이 1건이었다.
    test('지번주소가 다르면 하위필지 한 접수로 묶인다 — 어느 행도 버려지지 않는다', async ({ page }) => {
        const modal = await pasteWithNumbers(page, [
            '5\t홍길동\t010-1111-2222\t봉화읍 내성리 224\t고추\t100\t밭\t일반재배',
            '5-1\t홍길동\t010-1111-2222\t봉화읍 내성리 225\t마늘\t200\t밭\t일반재배',
            '5-2\t홍길동\t010-1111-2222\t봉화읍 내성리 226\t무\t300\t밭\t일반재배',
        ]);

        // 수정 전: ['5', '5-1', '5-2']이지만 뒤 두 건이 dup로 표시되고 버려졌다
        expect(await previewNumbers(modal)).toEqual(['5', '5-1', '5-2']);

        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();

        const persisted = await readPersistedFull(page);
        // 접수는 1건 — 하위필지가 있는 필지는 접수번호를 1개만 받는다 (2026-08-20 확정)
        expect(persisted, `저장 결과: ${JSON.stringify(persisted)}`).toHaveLength(1);
        expect(persisted[0].rn).toBe('5');
        expect(persisted[0].lotAddress).toContain('224');
        expect(persisted[0].crops).toEqual(['고추']);
        // ⚠️ 핵심: 나머지 두 지번이 **살아 있어야 한다**. 수정 전에는 사라졌다.
        expect(persisted[0].subLots.map((s) => s.addr)).toEqual([
            '봉화읍 내성리 225', '봉화읍 내성리 226',
        ]);
        expect(persisted[0].subLots.map((s) => s.crops)).toEqual([['마늘'], ['무']]);
    });

    test('지번주소가 같으면 분할모드 — 작물마다 레코드가 하나씩, groupId를 공유한다', async ({ page }) => {
        const modal = await pasteWithNumbers(page, [
            '5\t홍길동\t010-1111-2222\t봉화읍 내성리 224\t고추\t100\t밭\t일반재배',
            '5-1\t홍길동\t010-1111-2222\t봉화읍 내성리 224\t배추\t200\t밭\t일반재배',
        ]);
        expect(await previewNumbers(modal)).toEqual(['5', '5-1']);

        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();

        const persisted = await readPersistedFull(page);
        expect(persisted, `저장 결과: ${JSON.stringify(persisted)}`).toHaveLength(2);
        expect(persisted.map((s) => s.rn)).toEqual(['5', '5-1']);
        expect(persisted.map((s) => s.crops)).toEqual([['고추'], ['배추']]);
        // 같은 접수이므로 groupId를 공유한다 — 수정 화면이 두 행을 한 접수로 연다
        expect(persisted[0].groupId).toBe(persisted[1].groupId);
        expect(persisted[0].groupId).not.toBe('');
    });

    test('진짜 같은 번호는 여전히 중복으로 걸러진다 (과잉수정 방지)', async ({ page }) => {
        const modal = await pasteWithNumbers(page, [
            '5\t홍길동\t010-1111-2222\t봉화읍 내성리 224\t고추\t100\t밭\t일반재배',
            '5\t김철수\t010-3333-4444\t물야면 오전리 45\t무\t300\t밭\t일반재배',
        ]);
        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();

        const persisted = await readPersistedFull(page);
        expect(persisted).toHaveLength(1);
        expect(persisted[0].rn).toBe('5');
    });
    // 🚨 리뷰 전에 스스로 찾은 결함. 미리보기의 그룹 키(`imp-5`)를 그대로 저장하면
    //    **다른 가져오기에서 같은 본번이 나올 때 무관한 두 접수가 같은 groupId를 갖는다.**
    //    그러면 그룹 수정이 둘을 한 접수로 열어 남의 레코드를 건드린다.
    test('서로 다른 가져오기의 같은 본번이 groupId를 공유하지 않는다', async ({ page }) => {
        const first = await pasteWithNumbers(page, [
            '5\t홍길동\t010-1111-2222\t봉화읍 내성리 224\t고추\t100\t밭\t일반재배',
            '5-1\t홍길동\t010-1111-2222\t봉화읍 내성리 224\t배추\t200\t밭\t일반재배',
        ]);
        await first.locator('[data-act="import"]').click();
        await expect(first).toBeHidden();

        // 두 번째 가져오기 — 다른 사람, 다른 본번이지만 같은 서브넘버 구조
        const second = await pasteWithNumbers(page, [
            '7\t김철수\t010-3333-4444\t물야면 오전리 45\t무\t300\t밭\t일반재배',
            '7-1\t김철수\t010-3333-4444\t물야면 오전리 45\t파\t400\t밭\t일반재배',
        ]);
        await second.locator('[data-act="import"]').click();
        await expect(second).toBeHidden();

        const persisted = await readPersistedFull(page);
        expect(persisted).toHaveLength(4);
        const g5 = persisted.filter((r) => r.rn.startsWith('5')).map((r) => r.groupId);
        const g7 = persisted.filter((r) => r.rn.startsWith('7')).map((r) => r.groupId);
        // 각 접수 안에서는 공유하고
        expect(new Set(g5).size, `5번 그룹: ${g5}`).toBe(1);
        expect(new Set(g7).size, `7번 그룹: ${g7}`).toBe(1);
        // 접수끼리는 절대 공유하지 않는다
        expect(g5[0]).not.toBe(g7[0]);
        // UUID여야 한다 — `imp-5` 같은 배치 내부 키가 새어나가면 안 된다
        expect(g5[0]).not.toMatch(/^imp-/);
    });
    // 🚨 독립 리뷰(codex)가 찾은 MAJOR 두 건 — **저장까지** 봐야 잡힌다.
    //    미리보기만 보면 둘 다 멀쩡해 보인다.
    test('하위필지 면적이 저장까지 보존되고, 건너뛴 중복은 되살아나지 않는다', async ({ page }) => {
        // 기존에 5-1이 있어 그 행은 dup·건너뜀이 된다
        await page.evaluate(() => {
            const year = window.soilManager.selectedYear;
            localStorage.setItem(`soilSampleLogs_${year}`, JSON.stringify([
                { id: 'seed-1', receptionNumber: '5-1', name: '기존', landClass1: '농가의뢰', subCategory: '밭', parcels: [] },
            ]));
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => (window.soilManager?.sampleLogs || []).length === 1);

        const modal = await pasteWithNumbers(page, [
            '5\t홍길동\t010-1111-2222\t봉화읍 내성리 224\t고추\t100\t밭\t일반재배',
            '5-1\t홍길동\t010-1111-2222\t봉화읍 내성리 225\t마늘\t50\t밭\t일반재배',
            '5-2\t홍길동\t010-1111-2222\t봉화읍 내성리 226\t무\t70\t밭\t일반재배',
        ]);
        await modal.locator('[data-act="import"]').click();
        await expect(modal).toBeHidden();

        const persisted = await readPersistedFull(page);
        const lead = persisted.find((r) => r.rn === '5');
        expect(lead, `저장 결과: ${JSON.stringify(persisted)}`).toBeTruthy();
        // 건너뛴 225는 선두 안에도 없어야 한다 (수정 전에는 되살아났다)
        expect(lead.subLots.map((s) => s.addr)).toEqual(['봉화읍 내성리 226']);
        // 면적이 '0'으로 뭉개지지 않아야 한다 (수정 전에는 전부 '0')
        expect(lead.subLots[0].areas).toEqual(['70']);
    });
});
