// @ts-check
//
// SAMPL-1-177 — 퇴비 목록 검색 모달의 농장주소 검색
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
//
// ⚠️ 필터 결과만 page.evaluate로 확인하면 안 된다. 모달의 입력 배선(열기 시 값 복원,
//    적용 버튼 클릭, 초기화)이 끊겨도 통과해 버린다 — soil SLS-1-197 MINOR-2의 교훈.
//    그래서 화면에서 실제로 열고, 채우고, 누른다.
const { test, expect } = require('@playwright/test');

/** 농장주소가 서로 다른 3건 — 시군만 같고 읍면이 다르다 */
const FIXTURES = [
    { id: 'c0', receptionNumber: '101', name: '김퇴비', farmAddress: '봉화군 물야면 오전리 123' },
    { id: 'c1', receptionNumber: '102', name: '이퇴비', farmAddress: '봉화군 봉화읍 내성리 224-15' },
    { id: 'c2', receptionNumber: '103', name: '박퇴비', farmAddress: '영주시 풍기읍 성내리 7' },
];

async function seedAndShowList(page) {
    await page.evaluate((rows) => {
        const mgr = /** @type {any} */ (window).compostManager;
        const logs = rows.map((r) => ({
            ...r,
            phoneNumber: '010-1234-5678',
            date: '2026-08-21',
            receptionMethod: '방문',
            sampleName: '퇴비',
            isComplete: false,
        }));
        localStorage.setItem(mgr.getStorageKey(mgr.selectedYear), JSON.stringify(logs));
        mgr.sampleLogs = logs;
        if (typeof mgr.switchView === 'function') mgr.switchView('list');
        mgr.filterAndRenderLogs();
    }, FIXTURES);
    await page.waitForFunction(
        () => document.querySelectorAll('.data-table tbody tr').length > 0,
        { timeout: 10000 }
    );
}

/** 화면에서 실제로 검색을 수행한다 (모달 열기 → 입력 → 적용) */
async function searchFarmAddress(page, query) {
    await page.click('#openSearchModalBtn');
    await expect(page.locator('#listSearchModal')).toBeVisible();
    await page.fill('#searchFarmAddressInput', query);
    await page.click('#applySearchBtn');
    await expect(page.locator('#listSearchModal')).toBeHidden();
}

/** 화면에 남은 접수번호들 — 어느 행이 살아남았는지로 판정한다 */
async function visibleReceptionNumbers(page) {
    return page.$$eval('.data-table tbody tr', (rows) =>
        rows.map((tr) => (tr.textContent || '')).filter((t) => t.trim())
    );
}

test.describe('퇴비 농장주소 검색 (SAMPL-1-177)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/compost/');
        await page.waitForLoadState('networkidle');
        await page.click('[data-view="list"]');
        await page.waitForSelector('#listView');
        await seedAndShowList(page);
    });

    test('검색 모달에 농장주소 입력 필드가 있다', async ({ page }) => {
        await page.click('#openSearchModalBtn');
        await expect(page.locator('#listSearchModal')).toBeVisible();
        await expect(page.locator('#searchFarmAddressInput')).toBeVisible();
    });

    test('농장주소 일부로 걸러진다', async ({ page }) => {
        await searchFarmAddress(page, '물야');

        const texts = await visibleReceptionNumbers(page);
        expect(texts).toHaveLength(1);
        expect(texts[0]).toContain('김퇴비');
    });

    test('띄어쓴 여러 단어는 모두 포함해야 걸린다', async ({ page }) => {
        // "봉화"만으로는 2건 (물야면·봉화읍)
        await searchFarmAddress(page, '봉화');
        expect(await visibleReceptionNumbers(page)).toHaveLength(2);

        // "봉화 봉화읍"은 두 단어를 모두 가진 1건만
        await searchFarmAddress(page, '봉화 봉화읍');
        const texts = await visibleReceptionNumbers(page);
        expect(texts).toHaveLength(1);
        expect(texts[0]).toContain('이퇴비');
    });

    test('일치하는 농장주소가 없으면 한 건도 남지 않는다', async ({ page }) => {
        await searchFarmAddress(page, '존재하지않는주소');
        expect(await visibleReceptionNumbers(page)).toHaveLength(0);
    });

    test('검색 중이면 검색 버튼에 표시가 붙고, 다시 열면 입력값이 남아 있다', async ({ page }) => {
        await searchFarmAddress(page, '물야');

        const btn = page.locator('#openSearchModalBtn');
        await expect(btn).toHaveClass(/has-filter/);
        await expect(btn).toContainText('검색 중');

        // 모달을 다시 열면 직전 입력이 복원돼야 한다
        await page.click('#openSearchModalBtn');
        await expect(page.locator('#searchFarmAddressInput')).toHaveValue('물야');
    });

    test('전체 초기화로 농장주소 조건이 풀린다', async ({ page }) => {
        await searchFarmAddress(page, '물야');
        expect(await visibleReceptionNumbers(page)).toHaveLength(1);

        await page.click('#openSearchModalBtn');
        await page.click('#resetSearchBtn');
        await expect(page.locator('#listSearchModal')).toBeHidden();

        expect(await visibleReceptionNumbers(page)).toHaveLength(3);
        await expect(page.locator('#openSearchModalBtn')).not.toHaveClass(/has-filter/);

        await page.click('#openSearchModalBtn');
        await expect(page.locator('#searchFarmAddressInput')).toHaveValue('');
    });

    test('농장주소 입력에서 Enter로 검색된다', async ({ page }) => {
        await page.click('#openSearchModalBtn');
        await page.fill('#searchFarmAddressInput', '풍기');
        await page.press('#searchFarmAddressInput', 'Enter');
        await expect(page.locator('#listSearchModal')).toBeHidden();

        const texts = await visibleReceptionNumbers(page);
        expect(texts).toHaveLength(1);
        expect(texts[0]).toContain('박퇴비');
    });

    test('기존 성명 검색과 함께 걸린다 (AND)', async ({ page }) => {
        await page.click('#openSearchModalBtn');
        await page.fill('#searchFarmAddressInput', '봉화');
        await page.fill('#searchNameInput', '이퇴비');
        await page.click('#applySearchBtn');

        const texts = await visibleReceptionNumbers(page);
        expect(texts).toHaveLength(1);
        expect(texts[0]).toContain('이퇴비');
    });
});
