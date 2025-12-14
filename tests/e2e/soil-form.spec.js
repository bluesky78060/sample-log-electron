// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 토양 시료 접수 폼 테스트
 */
test.describe('토양 시료 접수', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/soil/');
        // 페이지 로드 대기
        await page.waitForLoadState('networkidle');
    });

    test('페이지 제목 확인', async ({ page }) => {
        await expect(page).toHaveTitle(/토양/);
    });

    test('접수번호 필드가 존재하는지 확인', async ({ page }) => {
        await expect(page.locator('#receptionNumber')).toBeVisible();
    });

    test('날짜 필드가 존재하는지 확인', async ({ page }) => {
        await expect(page.locator('#date')).toBeVisible();
    });

    test('연도 선택 드롭다운이 있는지 확인', async ({ page }) => {
        await expect(page.locator('#yearSelect')).toBeVisible();
    });

    test('네비게이션 바가 존재하는지 확인', async ({ page }) => {
        await expect(page.locator('.navbar')).toBeVisible();
    });

    test('메인 콘텐츠 영역이 존재하는지 확인', async ({ page }) => {
        await expect(page.locator('.main-content')).toBeVisible();
    });
});
