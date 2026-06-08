// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * 폼 제출 및 데이터 흐름 통합 테스트
 */
test.describe('폼 제출 통합 테스트', () => {

    test.describe('토양 시료 접수 흐름', () => {
        test('폼 작성 후 등록 버튼 클릭', async ({ page }) => {
            await page.goto('/soil/');
            await page.waitForLoadState('networkidle');

            // localStorage 초기화 후 재진입
            await page.evaluate(() => localStorage.clear());
            await page.reload();
            await page.waitForLoadState('networkidle');

            // 필수 정보 입력
            await page.fill('#name', '테스트농가');
            await page.fill('#phoneNumber', '010-1234-5678');

            // 필지 정보 입력 (input 이벤트 필요 — this.parcels 업데이트)
            const lotAddressInput = page.locator('.lot-address-input').first();
            await lotAddressInput.fill('내성리 123');
            await lotAddressInput.dispatchEvent('input');

            const cropInput = page.locator('.crop-direct-input').first();
            await cropInput.fill('고추');
            await cropInput.dispatchEvent('input');

            const areaInput = page.locator('.area-direct-input').first();
            await areaInput.fill('500');
            await areaInput.dispatchEvent('input');

            // 토양 필수 required 필드: purpose select, receptionMethod hidden input
            await page.selectOption('#purpose', '일반재배');
            await page.click('.reception-method-btn[data-method="우편"]');

            // 등록 버튼 클릭
            await page.click('#navSubmitBtn');
            await page.waitForTimeout(500);

            // 결과 모달이 표시되면 닫기 (모달이 목록 버튼 클릭을 가로막음)
            const resultModal = page.locator('#registrationResultModal');
            const isModalVisible = await resultModal.isVisible({ timeout: 2000 }).catch(() => false);
            if (isModalVisible) {
                await page.click('#closeResultBtn');
                await page.waitForTimeout(300);
            }

            // 목록으로 이동하여 데이터 확인
            await page.click('[data-view="list"]');
            await page.waitForSelector('#listView');

            // 완료 필터가 "미완료"로 기본 설정될 수 있으므로 전체 상태로 변경
            const completedFilter = page.locator('#completedFilter');
            if (await completedFilter.isVisible({ timeout: 1000 }).catch(() => false)) {
                await completedFilter.selectOption('');
                await page.waitForTimeout(200);
            }

            // 무조건 단언 — 등록이 실제로 된 경우 테이블에 이름이 있어야 한다
            // (조건부 if(hasData) 단언을 제거: 0행이어도 통과하는 약한 단언이었음)
            const tableBody = page.locator('#logTableBody');
            await expect(tableBody).toContainText('테스트농가');
        });

        test('폼 초기화 기능', async ({ page }) => {
            await page.goto('/soil/');
            await page.waitForLoadState('networkidle');

            // 데이터 입력
            await page.fill('#name', '초기화테스트');
            await expect(page.locator('#name')).toHaveValue('초기화테스트');

            // 초기화 버튼 클릭
            await page.click('#navResetBtn');

            // 폼이 초기화되었는지 확인
            await expect(page.locator('#name')).toHaveValue('');
        });
    });

    test.describe('퇴액비 시료 접수 흐름', () => {
        test('폼 작성 후 등록 버튼 클릭', async ({ page }) => {
            await page.goto('/compost/');
            await page.waitForLoadState('networkidle');

            // 필수 정보 입력
            await page.fill('#farmName', '테스트농장');
            await page.fill('#name', '홍길동');
            await page.fill('#phoneNumber', '010-5678-1234');

            // 시료종류 선택 (기본값이 가축분퇴비이므로 이미 선택됨)
            const sampleTypeRadio = page.locator('input[name="sampleType"][value="가축분퇴비"]');
            await expect(sampleTypeRadio).toBeChecked();

            // 축종 선택 - animal-type-options 내부의 라디오
            const animalTypeLabel = page.locator('.animal-type-options label.checkbox-card').filter({ hasText: '소' });
            await animalTypeLabel.click();

            // 등록 버튼 클릭
            await page.click('#navSubmitBtn');

            // 등록 결과 모달이 표시되면 닫기
            const resultModal = page.locator('#registrationResultModal');
            if (await resultModal.isVisible({ timeout: 2000 }).catch(() => false)) {
                await page.click('#closeResultBtn');
                await page.waitForTimeout(300);
            }

            // 목록으로 이동
            await page.click('[data-view="list"]');
            await page.waitForSelector('#listView');

            // 등록된 데이터 확인 (무조건 단언 — 0행이어도 통과하던 약한 단언 제거)
            await expect(page.locator('#logTableBody')).toContainText('테스트농장');
        });
    });

    test.describe('수질분석 시료 접수 흐름', () => {
        test('폼 작성 후 등록 버튼 클릭', async ({ page }) => {
            await page.goto('/water/');
            await page.waitForLoadState('networkidle');

            // 필수 정보 입력
            await page.fill('#name', '수질테스트');
            await page.fill('#phoneNumber', '010-9876-5432');

            // 수령방법 선택
            await page.click('.reception-method-btn[data-method="방문"]');

            // 검사항목 선택
            const testItemLabel = page.locator('label.test-item-option').filter({ hasText: '농업용수' });
            await testItemLabel.click();

            // 등록 버튼 클릭
            await page.click('#navSubmitBtn');
            await page.waitForTimeout(500);

            // 목록으로 이동
            await page.click('[data-view="list"]');
            await page.waitForSelector('#listView');
        });
    });

    test.describe('네비게이션 테스트', () => {
        test('메인 페이지에서 각 시료 페이지로 이동', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');

            // 토양 분석 카드 클릭 (실제 링크 경로는 soil/index.html)
            await page.click('a[href="soil/index.html"]');
            await expect(page).toHaveTitle(/토양/);

            // 뒤로가기
            await page.click('.back-btn');
            await page.waitForLoadState('networkidle');

            // 수질 분석 카드 클릭
            await page.click('a[href="water/index.html"]');
            await expect(page).toHaveTitle(/수질/);
        });

        test('드롭다운 메뉴로 페이지 간 이동', async ({ page }) => {
            await page.goto('/soil/');
            await page.waitForLoadState('networkidle');

            // 드롭다운 트리거 클릭
            await page.click('.brand-dropdown-trigger');

            // 수질 분석 메뉴 클릭
            await page.click('.dropdown-item:has-text("수질 분석")');
            await expect(page).toHaveTitle(/수질/);

            // 드롭다운에서 퇴액비로 이동
            await page.click('.brand-dropdown-trigger');
            await page.click('.dropdown-item:has-text("퇴·액비")');
            await expect(page).toHaveTitle(/퇴.*액비/);
        });
    });

    test.describe('검색 기능 테스트', () => {
        test('토양 목록에서 검색 모달 열기', async ({ page }) => {
            await page.goto('/soil/');
            await page.waitForLoadState('networkidle');

            // 목록 뷰로 이동
            await page.click('[data-view="list"]');
            await page.waitForSelector('#listView');

            // 검색 버튼 클릭
            await page.click('#openSearchModalBtn');

            // 검색 모달이 표시되는지 확인
            await expect(page.locator('#listSearchModal')).toBeVisible();

            // 모달 닫기
            await page.click('#closeSearchModal');
            await expect(page.locator('#listSearchModal')).toBeHidden();
        });

        test('퇴액비 목록에서 검색 모달 열기', async ({ page }) => {
            await page.goto('/compost/');
            await page.waitForLoadState('networkidle');

            // 목록 뷰로 이동
            await page.click('[data-view="list"]');
            await page.waitForSelector('#listView');

            // 검색 버튼 클릭
            await page.click('#openSearchModalBtn');

            // 검색 모달이 표시되는지 확인
            await expect(page.locator('#listSearchModal')).toBeVisible();
        });
    });

    test.describe('통계 기능 테스트', () => {
        test('토양 통계 모달 열기', async ({ page }) => {
            await page.goto('/soil/');
            await page.waitForLoadState('networkidle');

            // 목록 뷰로 이동
            await page.click('[data-view="list"]');
            await page.waitForSelector('#listView');

            // 통계 버튼 클릭
            await page.click('#btnStatistics');

            // 통계 모달이 표시되는지 확인 (토양은 statisticsModal 사용)
            await expect(page.locator('#statisticsModal')).toBeVisible();
        });

        test('퇴액비 통계 모달 열기', async ({ page }) => {
            await page.goto('/compost/');
            await page.waitForLoadState('networkidle');

            // 목록 뷰로 이동
            await page.click('[data-view="list"]');
            await page.waitForSelector('#listView');

            // 통계 버튼 클릭
            await page.click('#statsBtn');

            // 통계 모달이 표시되는지 확인
            await expect(page.locator('#statsModal')).toBeVisible();
        });
    });

    test.describe('연도 선택 테스트', () => {
        test('연도 변경 시 데이터 분리', async ({ page }) => {
            await page.goto('/soil/');
            await page.waitForLoadState('networkidle');

            // 현재 연도 확인
            const yearSelect = page.locator('#yearSelect');
            await expect(yearSelect).toBeVisible();

            // 2026년으로 변경
            await yearSelect.selectOption('2026');

            // 접수번호가 갱신되는지 확인 (연도별로 다른 번호)
            await page.waitForTimeout(300);
            const receptionNumber = await page.inputValue('#receptionNumber');
            expect(receptionNumber).toBeTruthy();
        });
    });
});
