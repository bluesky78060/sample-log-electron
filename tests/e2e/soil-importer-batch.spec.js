// @ts-check
// SAMPL-1-172: 붙여넣기 가져오기가 행마다 전체 저장·전체 재렌더를 반복했다
//
// `addImportedRecord`가 레코드마다 `persistRecords`(→ `saveLogs`: 배열 전체
// `JSON.stringify` + localStorage 쓰기 + **전체 Firestore batchSave**)와
// `filterAndRenderLogs`(목록 전체 재렌더)를 불렀다. 배열이 커질수록 한 행당 비용도
// 같이 커져 O(n²)가 된다.
//
// 실측(Firebase 꺼짐, 로컬만):
//   200행 0.68초 → 1,200행 8.75초 (행 6배에 시간 12.9배)
//   1,200행을 넣으려고 localStorage에 **540MB**를 썼다 (실제 데이터는 1MB 남짓)
//   수정 후: 1,200행 12.6ms, 쓰기 0.9MB, 저장 호출 1회
//
// ⚠️ 이 스펙은 **시간을 재지 않는다.** 기계 성능에 따라 흔들려 "가끔 실패하는
//    테스트"가 된다. 대신 원인인 **호출 횟수**를 단정한다 — 그것이 1이면 O(n²)가
//    구조적으로 불가능하다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const HEADER = '성명\t연락처\t지번주소\t작물\t면적\t구분\t목적';

/** 저장·재렌더 호출을 센다 */
async function countCalls(page) {
    await page.evaluate(() => {
        const w = /** @type {any} */ (window);
        const mgr = w.soilManager;
        w.__c = { persist: 0, render: 0, lsCalls: 0 };
        for (const [name, key] of [['persistRecords', 'persist'], ['filterAndRenderLogs', 'render']]) {
            const orig = mgr[name].bind(mgr);
            mgr[name] = (...a) => { w.__c[key]++; return orig(...a); };
        }
        const setItem = localStorage.setItem.bind(localStorage);
        localStorage.setItem = (k, v) => { w.__c.lsCalls++; return setItem(k, v); };
    });
}

async function pasteImport(page, rows) {
    await page.click('#soilImportBtn');
    const modal = page.locator('#soilImporterModal');
    await expect(modal).toBeVisible();
    await modal.locator('input[name="sriMode"][value="paste"]').check();
    await modal.locator('[data-el="textarea"]').fill([HEADER, ...rows].join('\n'));
    await modal.locator('[data-act="automap"]').click();
    await modal.locator('[data-act="import"]').click();
    await expect(modal).toBeHidden();
}

const dataRow = (i) =>
    `홍길동${i}\t010-1111-1111\t봉화군 봉화읍 내성리 ${i + 1}\t고추\t100\t밭\t일반재배`;

test.describe('붙여넣기 가져오기 배치 저장 (SAMPL-1-172)', () => {
    test.beforeEach(async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        await page.goto('/soil/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
        // ⚠️ localStorage만 비우면 부족하다 — 매니저가 이미 메모리로 읽어 둔 배열이
        //    남아 기준선이 커진다(실측: 저장건수 50 → 150 → 350 → 750).
        await page.evaluate(() => {
            localStorage.clear();
            const mgr = /** @type {any} */ (window).soilManager;
            mgr.sampleLogs = [];
            mgr.filterAndRenderLogs();
        });
    });

    // 🚨 원인을 직접 단정한다. 60행을 넣는데 저장이 60번 일어나면 그것이 결함이다.
    test('여러 행을 넣어도 저장과 재렌더는 각각 한 번뿐이다', async ({ page }) => {
        await countCalls(page);
        await pasteImport(page, Array.from({ length: 60 }, (_, i) => dataRow(i)));

        const c = await page.evaluate(() => /** @type {any} */ (window).__c);
        expect(c.persist, `저장이 ${c.persist}번 일어났다`).toBe(1);
        expect(c.render, `목록 재렌더가 ${c.render}번 일어났다`).toBe(1);
        expect(c.lsCalls, `localStorage 쓰기가 ${c.lsCalls}번 일어났다`).toBe(1);
    });

    // 배치로 바꾸면서 데이터가 달라지면 성능은 의미가 없다.
    // ⚠️ 미리보기가 아니라 **저장된 것**을 읽는다 (SAMPL-1-169의 교훈).
    test('배치로 넣어도 저장 결과가 그대로다', async ({ page }) => {
        await pasteImport(page, Array.from({ length: 30 }, (_, i) => dataRow(i)));

        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
        const saved = await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            const raw = localStorage.getItem(mgr.getStorageKey(mgr.selectedYear));
            return (raw ? JSON.parse(raw) : []).map((l) => ({
                n: String(l.receptionNumber), name: l.name,
            }));
        });

        expect(saved).toHaveLength(30);
        // 접수번호가 1..30으로 빠짐없이, 중복 없이
        expect(saved.map((s) => s.n)).toEqual(Array.from({ length: 30 }, (_, i) => String(i + 1)));
        expect(saved[0].name).toBe('홍길동0');
        expect(saved[29].name).toBe('홍길동29');
    });

    // 한 줄이 잘못돼도 나머지는 들어가야 한다 — 대량 입력에서 전부 잃는 것이 최악이다
    test('한 건이 실패해도 나머지는 저장된다', async ({ page }) => {
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).soilManager;
            const orig = mgr.addImportedRecord.bind(mgr);
            let n = 0;
            mgr.addImportedRecord = (rec, opt) => {
                n++;
                if (n === 3) throw new Error('의도적 실패');
                return orig(rec, opt);
            };
        });
        await pasteImport(page, Array.from({ length: 5 }, (_, i) => dataRow(i)));

        const saved = await page.evaluate(() =>
            (/** @type {any} */ (window).soilManager.sampleLogs || []).map((l) => l.name));
        expect(saved, `실패 한 건 때문에 나머지를 잃었다: ${saved}`).toHaveLength(4);
        expect(saved).not.toContain('홍길동2');   // 3번째만 빠진다
    });
});
