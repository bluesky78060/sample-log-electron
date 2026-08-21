// @ts-check
// SAMPL-1-170: 공통 엑셀 가져오기(수질·퇴비·중금속·잔류농약)에 접수번호 중복 검사가 없었다
//
// `_autoAssignReceptionNumbers()`는 **모든 행에 번호가 없을 때만** 로컬 max+1을 부여하고,
// 시트에 번호가 하나라도 있으면 **검사 없이 그대로 저장**했다. 이미 있는 번호와 겹쳐도
// 경고가 없었다. 접수번호는 분석결과 매칭 키라, 겹치면 어느 시료의 결과인지 확정할 수 없다.
//
// ⚠️ 이 스펙은 **저장된 번호**를 단정한다. SAMPL-1-169에서 미리보기만 단정한 테스트가
//    "화면에는 3·4, 저장은 1·2"를 통과시켰다. 같은 실수를 반복하지 않는다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

/** @param mode 'ok' | 'error' | 'disabled' */
async function stubCloud(page, managerName, cloudLogs, mode = 'ok') {
    await page.evaluate(([name, logs, m]) => {
        const mgr = /** @type {any} */ (window)[name];
        if (m === 'disabled') {
            /** @type {any} */ (window).firebaseConfig = { isEnabled: () => false };
            return;
        }
        /** @type {any} */ (window).firebaseConfig = { isEnabled: () => true };
        mgr._firebaseCache?.clear();
        const db = /** @type {any} */ (window).firestoreDb || {};
        const stub = Object.assign(Object.create(Object.getPrototypeOf(db) || Object.prototype), db);
        delete stub.getAllWithMeta;
        stub.getAll = m === 'error'
            ? async () => { throw new Error('네트워크 없음'); }
            : async () => logs;
        /** @type {any} */ (window).firestoreDb = stub;
    }, [managerName, cloudLogs, mode]);
}

/**
 * 실제 파일 입력 경로로 시트를 넣는다. 페이지 번들에 XLSX가 들어 있어
 * 브라우저에서 만들어 File로 넘길 수 있다 — 가짜 진입점을 만들지 않는다.
 */
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
    await expect(page.locator('#excelImportModal')).not.toHaveClass(/hidden/);
}

/** 3단계까지 진행한다 (1: 시트 → 2: 매핑 → 3: 미리보기) */
async function goToPreview(page) {
    await page.click('#excelImportNextBtn');
    await page.click('#excelImportNextBtn');
    return page.locator('#excelImportModal');
}

/** 저장된 접수번호를 localStorage에서 읽는다 (메모리 배열이 아니라) */
async function persistedNumbers(page, managerName, storageKey) {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForFunction((n) => typeof window[n] !== 'undefined', managerName);
    return page.evaluate(([name, key]) => {
        const mgr = /** @type {any} */ (window)[name];
        const k = typeof mgr.getStorageKey === 'function'
            ? mgr.getStorageKey(mgr.selectedYear) : `${key}_${mgr.selectedYear}`;
        const raw = localStorage.getItem(k);
        return (raw ? JSON.parse(raw) : []).map((l) => String(l.receptionNumber));
    }, [managerName, storageKey]);
}

const cloudRec = (rn, name) => ({
    id: `cloud-${rn}`, receptionNumber: rn, name,
    date: '2026-03-11', updatedAt: '2026-03-11T00:00:00.000Z',
});

const HEADER = ['접수번호', '성명', '연락처', '채취장소'];
const row = (rn, name) => [rn, name, '010-1111-1111', '봉화읍 내성리 1'];

test.describe('공통 엑셀 가져오기의 접수번호 중복 검사 (SAMPL-1-170)', () => {
    test.beforeEach(async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        await page.goto('/water/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.waterManager !== 'undefined');
        await page.evaluate(() => localStorage.clear());
    });

    // 🚨 이 티켓이 없애는 것. 예전에는 아무 경고 없이 저장됐다.
    test('로컬에 이미 있는 번호가 시트에 있으면 저장하지 않는다', async ({ page }) => {
        await stubCloud(page, 'waterManager', [], 'disabled');
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).waterManager;
            const rec = { id: 'own-1', receptionNumber: '5', name: '기존', date: '2026-08-21' };
            mgr.sampleLogs = [rec];
            localStorage.setItem(mgr.getStorageKey(mgr.selectedYear), JSON.stringify([rec]));
        });

        await importSheet(page, [HEADER, row('5', '홍길동')]);
        const modal = await goToPreview(page);
        await expect(modal.locator('#excelImportPreviewSummary, [id*="previewSummary"]').first())
            .toContainText('이미 쓰이고 있습니다');

        await page.click('#excelImportNextBtn');
        // 막혀야 한다 — 모달이 그대로 열려 있다
        await expect(modal).not.toHaveClass(/hidden/);

        const saved = await page.evaluate(() =>
            (/** @type {any} */ (window).waterManager.sampleLogs || []).map((l) => String(l.receptionNumber)));
        expect(saved, `중복이 저장됐다: ${saved}`).toEqual(['5']);
    });

    // 🚨 SAMPL-1-167~169가 등록·수정·토양가져오기에서 막은 것과 같은 구멍
    test('클라우드에만 있는 번호도 잡는다', async ({ page }) => {
        await stubCloud(page, 'waterManager', [cloudRec('7', '박성권')]);
        await importSheet(page, [HEADER, row('7', '홍길동')]);
        const modal = await goToPreview(page);

        await page.click('#excelImportNextBtn');
        await expect(modal, '클라우드 번호를 놓쳤다').not.toHaveClass(/hidden/);
    });

    test('겹치지 않으면 그대로 저장된다 (과잉차단 방지)', async ({ page }) => {
        await stubCloud(page, 'waterManager', [cloudRec('7', '박성권')]);
        await importSheet(page, [HEADER, row('100', '홍길동')]);
        const modal = await goToPreview(page);
        await page.click('#excelImportNextBtn');
        await expect(modal).toHaveClass(/hidden/);

        const saved = await persistedNumbers(page, 'waterManager', 'waterSampleLogs');
        expect(saved, `저장됨: ${saved}`).toEqual(['100']);
        // 클라우드 사본이 저장에 새어 나오면 안 된다
        expect(saved).not.toContain('7');
    });

    // 🚨 미리보기가 아니라 **저장된 번호**로 확인한다 (SAMPL-1-169의 교훈)
    test('자동부여가 클라우드 번호를 건너뛴 채 저장된다', async ({ page }) => {
        await stubCloud(page, 'waterManager', [cloudRec('1', '박성권'), cloudRec('2', '박성현')]);
        // 접수번호 열을 비워 자동부여를 태운다
        await importSheet(page, [HEADER, ['', '홍길동', '010-1111-1111', '봉화읍 내성리 1'],
                                         ['', '김철수', '010-2222-2222', '봉화읍 내성리 2']]);
        const modal = await goToPreview(page);
        await page.click('#excelImportNextBtn');
        await expect(modal).toHaveClass(/hidden/);

        const saved = await persistedNumbers(page, 'waterManager', 'waterSampleLogs');
        expect(saved, `클라우드 1·2와 겹쳤다: ${saved}`).toEqual(['3', '4']);
    });

    // 배치 안에서 같은 번호가 두 번 나오는 것도 중복이다
    test('시트 안에서 같은 번호가 두 번 나오면 잡는다', async ({ page }) => {
        await stubCloud(page, 'waterManager', [], 'disabled');
        await importSheet(page, [HEADER, row('9', '홍길동'), row('9', '김철수')]);
        const modal = await goToPreview(page);
        await page.click('#excelImportNextBtn');
        await expect(modal, '배치 내 중복을 놓쳤다').not.toHaveClass(/hidden/);
    });

    // 오프라인 우선 — 확인 실패가 가져오기를 막으면 현장에서 못 쓴다
    test('클라우드 확인에 실패해도 가져오기는 되고, 실패를 알린다', async ({ page }) => {
        await stubCloud(page, 'waterManager', [], 'error');
        await importSheet(page, [HEADER, row('100', '홍길동')]);
        const modal = await goToPreview(page);
        await expect(modal.locator('#excelImportPreviewSummary, [id*="previewSummary"]').first())
            .toContainText('클라우드를 확인하지 못했습니다');

        await page.click('#excelImportNextBtn');
        await expect(modal, '확인 실패가 가져오기를 막았다').toHaveClass(/hidden/);
        const saved = await persistedNumbers(page, 'waterManager', 'waterSampleLogs');
        expect(saved).toEqual(['100']);
    });
});

test.describe('가져오기 세션 상태 (SAMPL-1-170 · 독립 리뷰)', () => {
    test.beforeEach(async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        await page.goto('/water/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.waterManager !== 'undefined');
        await page.evaluate(() => localStorage.clear());
    });

    // 🚨 이전 세션의 확인 결과를 물려받으면, 연도를 바꾸고 새 파일을 연 뒤
    //    조회가 끝나기 전에 눌러도 저장이 통과한다 — 새 연도를 확인하지 않은 채로.
    test('새로 열면 이전 세션의 확인 결과를 쓰지 않는다', async ({ page }) => {
        await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            w.firebaseConfig = { isEnabled: () => true };
            w.__n = 0;
            w.waterManager.fetchCloudReceptionRecords = async () => {
                w.__n++;
                if (w.__n === 1) return { records: [], unavailable: false, reason: 'ok' };
                return new Promise(() => {});   // 두 번째 조회는 도착하지 않는다
            };
        });

        // 1차 세션: 조회를 끝까지 마치고 닫는다
        await importSheet(page, [HEADER, row('100', '홍길동')]);
        await page.waitForFunction(() => /** @type {any} */ (window).__n === 1);
        await page.click('#closeExcelImportModal');

        // 2차 세션: 조회가 도착하지 않는다
        await importSheet(page, [HEADER, row('200', '김철수')]);
        const modal = await goToPreview(page);
        await page.click('#excelImportNextBtn');

        await expect(modal, '이전 세션의 확인 결과로 저장됐다').not.toHaveClass(/hidden/);
    });

    // 🚨 빈 접수번호로 저장되면 그 시료의 분석결과를 붙일 수 없다
    test('일부 행만 번호가 있는 시트도 빈 행을 채워 저장한다', async ({ page }) => {
        await stubCloud(page, 'waterManager', [], 'disabled');
        await importSheet(page, [HEADER,
            row('10', '홍길동'),
            ['', '김철수', '010-2222-2222', '봉화읍 내성리 2'],
        ]);
        const modal = await goToPreview(page);
        await page.click('#excelImportNextBtn');
        await expect(modal).toHaveClass(/hidden/);

        const saved = await persistedNumbers(page, 'waterManager', 'waterSampleLogs');
        expect(saved.filter((n) => n === '' || n === 'undefined' || n === 'null'),
            `접수번호 없이 저장됐다: ${saved}`).toEqual([]);
        expect(saved.sort(), `저장됨: ${saved}`).toEqual(['10', '11']);
    });
});

test.describe('복합 접수번호 (SAMPL-1-170 · 독립 재리뷰 MAJOR)', () => {
    // 🚨 수질은 그룹 접수를 `"100, 101"`처럼 쉼표로 이어 붙여 저장한다
    //    (water-script.js의 receptionNumbers.join(', ')).
    //    통째로 비교하면 101이 이미 쓰이고 있는데도 겹침을 못 보고,
    //    parseInt('100, 101')은 100이라 최대값 계산도 틀린다.
    test.beforeEach(async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        await page.goto('/water/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.waterManager !== 'undefined');
        await page.evaluate(() => localStorage.clear());
    });

    test('그룹 접수의 낱개 번호와 겹치면 잡는다', async ({ page }) => {
        await stubCloud(page, 'waterManager', [], 'disabled');
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).waterManager;
            const rec = { id: 'g-1', receptionNumber: '100, 101', name: '기존그룹', date: '2026-08-21' };
            mgr.sampleLogs = [rec];
            localStorage.setItem(mgr.getStorageKey(mgr.selectedYear), JSON.stringify([rec]));
        });

        await importSheet(page, [HEADER, row('101', '홍길동')]);
        const modal = await goToPreview(page);
        await page.click('#excelImportNextBtn');

        await expect(modal, '"100, 101" 안의 101을 놓쳤다').not.toHaveClass(/hidden/);
    });

    test('그룹 접수의 낱개 번호를 넘겨 자동부여한다', async ({ page }) => {
        await stubCloud(page, 'waterManager', [], 'disabled');
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).waterManager;
            const rec = { id: 'g-1', receptionNumber: '100, 101', name: '기존그룹', date: '2026-08-21' };
            mgr.sampleLogs = [rec];
            localStorage.setItem(mgr.getStorageKey(mgr.selectedYear), JSON.stringify([rec]));
        });

        await importSheet(page, [HEADER, ['', '홍길동', '010-1111-1111', '봉화읍 내성리 1']]);
        const modal = await goToPreview(page);
        await page.click('#excelImportNextBtn');
        await expect(modal).toHaveClass(/hidden/);

        const saved = await persistedNumbers(page, 'waterManager', 'waterSampleLogs');
        // parseInt('100, 101') = 100 → 101을 부여해 충돌했다
        expect(saved, `기존 101과 겹쳤다: ${saved}`).toContain('102');
    });
});

test.describe('토양의 공통 엑셀 가져오기 (SAMPL-1-170 · 독립 3차 리뷰 MAJOR)', () => {
    // 🚨 "토양은 자체 importer만 쓴다"고 넘겼는데 **틀렸다.** 토양도 공통
    //    ExcelImportManager를 쓴다(soil-script.js). `manager`를 넘기지 않아
    //    토양의 엑셀 가져오기만 클라우드를 확인하지 못한 채 남아 있었다.
    //    (붙여넣기 경로인 soil-result-importer.js와는 별개다.)
    test('토양 엑셀 가져오기도 클라우드 번호를 잡는다', async ({ page }) => {
        page.on('dialog', (d) => d.dismiss().catch(() => {}));
        await page.goto('/soil/');
        await page.waitForLoadState('networkidle');
        await page.waitForFunction(() => typeof window.soilManager !== 'undefined');
        await page.evaluate(() => localStorage.clear());
        await stubCloud(page, 'soilManager', [cloudRec('7', '박성권')]);

        await importSheet(page, [['접수번호', '성명', '연락처', '지번주소'],
                                 ['7', '홍길동', '010-1111-1111', '봉화읍 내성리 1']]);
        const modal = await goToPreview(page);
        await page.click('#excelImportNextBtn');

        await expect(modal, '토양 엑셀 가져오기가 클라우드 번호를 놓쳤다').not.toHaveClass(/hidden/);
    });
});
