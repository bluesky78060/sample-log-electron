// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * L1 리팩토링 안전망: migrateCompletedField 레거시 필드 마이그레이션 시드 테스트
 *
 * 목적: "migrateCompletedField 5벌 → Base 통합" 리팩토링(Phase 1, Task 1-2)의 직접 안전망.
 *       현재 동작을 정확히 고정하여 리팩토링 후 회귀를 즉시 감지한다.
 *
 * 현재 동작 분석 (2026-06-08):
 *  - BaseSampleManager.loadYearData:420에서 migrateCompletedField 호출
 *  - 마이그레이션은 this.sampleLogs(메모리)만 변환하고 localStorage에 재기록하지 않음
 *    (420라인 이후 saveLogs() 호출 없음)
 *  - 따라서 localStorage 재기록 여부가 아닌 테이블 렌더 결과로 단언
 *
 * water-script.js:116-126 migrateCompletedField 동작:
 *  - completed:true → isComplete:true, completed 키 제거
 *  - isCompleted:false → isComplete:false, isCompleted 키 제거
 *  - isComplete 이미 있으면 건드리지 않음
 *
 * 완료 버튼 렌더 (water-script.js:185-188):
 *  - isComplete=true  → btnComplete 텍스트 '✅'
 *  - isComplete=false → btnComplete 텍스트 '⬜'
 */

test.describe('migrateCompletedField 레거시 필드 마이그레이션', () => {

    /**
     * 테스트 1: water 타입
     * - completed:true → 목록에서 완료 버튼이 ✅ 로 렌더되어야 함
     * - isCompleted:false → 목록에서 완료 버튼이 ⬜ 로 렌더되어야 함
     */
    test('water: completed→isComplete 마이그레이션 후 완료 버튼 렌더 확인', async ({ page }) => {
        await page.goto('/water/');
        await page.evaluate(() => localStorage.clear());

        const year = new Date().getFullYear();
        await page.evaluate((y) => {
            localStorage.setItem(`waterSampleLogs_${y}`, JSON.stringify([
                {
                    id: 'legacy-w1',
                    groupId: 'g1',
                    receptionNumber: '1',
                    date: `${y}-01-10`,
                    name: '완료레거시',
                    phoneNumber: '010-0000-0001',
                    sampleType: '물',
                    samplingLocation: '테스트 지하수',
                    testItems: '생활용수',
                    purpose: '참고용',
                    receptionMethod: '방문',
                    // 레거시 필드: completed:true
                    completed: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'legacy-w2',
                    groupId: 'g2',
                    receptionNumber: '2',
                    date: `${y}-01-10`,
                    name: '미완료레거시',
                    phoneNumber: '010-0000-0002',
                    sampleType: '물',
                    samplingLocation: '테스트 농업용수',
                    testItems: '농업용수',
                    purpose: '참고용',
                    receptionMethod: '방문',
                    // 레거시 필드: isCompleted:false
                    isCompleted: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]));
        }, year);

        await page.reload();
        await page.waitForLoadState('networkidle');

        // 목록 뷰로 이동
        await page.click('.nav-btn[data-view="list"]');
        await page.waitForSelector('#listView', { state: 'visible' });

        // 완료 필터 기본값이 "미완료"일 수 있으므로 전체 보기로 변경
        const completedFilter = page.locator('#completedFilter');
        if (await completedFilter.isVisible({ timeout: 1000 }).catch(() => false)) {
            await completedFilter.selectOption('');
            await page.waitForTimeout(200);
        }

        // 테이블에 두 행이 있어야 함
        const rows = page.locator('#logTableBody tr');
        await expect(rows).toHaveCount(2);

        // ── 단언 1: completed:true → 완료 버튼이 ✅ 렌더
        // 주의: '완료레거시'는 '미완료레거시'의 부분 문자열이므로 접수번호로 행 특정
        const row1 = page.locator('#logTableBody tr[data-id="legacy-w1"]');
        const completeBtn1 = row1.locator('.btn-complete');
        await expect(completeBtn1).toHaveText('✅');

        // ── 단언 2: isCompleted:false → 완료 버튼이 ⬜ 렌더
        const row2 = page.locator('#logTableBody tr[data-id="legacy-w2"]');
        const completeBtn2 = row2.locator('.btn-complete');
        await expect(completeBtn2).toHaveText('⬜');
    });

    /**
     * 테스트 2: heavy-metal 타입
     * - 마이그레이션은 BaseSampleManager 경유이므로 서브클래스 구현이 동일한지 확인
     * - heavy-metal-script.js:52-62도 동일 로직 (water와 같은 패턴)
     * - completed:true 시드 → 목록에서 완료 버튼이 ✅
     */
    test('heavy-metal: completed→isComplete 마이그레이션 후 완료 버튼 렌더 확인', async ({ page }) => {
        await page.goto('/heavy-metal/');
        await page.evaluate(() => localStorage.clear());

        const year = new Date().getFullYear();
        await page.evaluate((y) => {
            localStorage.setItem(`heavyMetalSampleLogs_${y}`, JSON.stringify([
                {
                    id: 'legacy-hm1',
                    receptionNumber: '1',
                    date: `${y}-01-15`,
                    name: '중금속완료',
                    phoneNumber: '010-0000-0003',
                    samplingLocation: '봉화군 내성리',
                    cropName: '벼',
                    samplingDate: `${y}-01-14`,
                    analysisItems: ['구리'],
                    purpose: '일반재배',
                    receptionMethod: '방문',
                    // 레거시 필드: completed:true
                    completed: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]));
        }, year);

        await page.reload();
        await page.waitForLoadState('networkidle');

        // 목록 뷰로 이동
        await page.click('.nav-btn[data-view="list"]');
        await page.waitForSelector('#listView', { state: 'visible' });

        // 완료 필터 기본값이 "미완료"일 수 있으므로 전체 보기로 변경
        const completedFilter2 = page.locator('#completedFilter');
        if (await completedFilter2.isVisible({ timeout: 1000 }).catch(() => false)) {
            await completedFilter2.selectOption('');
            await page.waitForTimeout(200);
        }

        // 행 존재 확인
        const rows = page.locator('#logTableBody tr');
        await expect(rows).toHaveCount(1);

        // completed:true → 완료 버튼이 ✓ 렌더 (heavy-metal-script.js:146 기준)
        // heavy-metal은 water(✅/⬜)와 다른 텍스트 사용: ✓/○
        const row1 = page.locator('#logTableBody tr[data-id="legacy-hm1"]');
        const completeBtn1 = row1.locator('.btn-complete');
        await expect(completeBtn1).toHaveText('✓');
    });

});
