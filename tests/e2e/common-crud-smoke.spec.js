// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * L1 리팩토링 안전망: 5개 시료 타입 공통 CRUD 스모크
 *
 * 목적: Phase 1~3 리팩토링 중 등록/수정/리셋 핵심 흐름이 깨지는 것을 즉시 감지한다.
 * 단언은 모두 무조건(unconditional) — if(hasData) 조건부 단언 금지.
 *
 * 타입별 필수 필드 보강 내역:
 *  - soil:        필지주소(.lot-address-input)+input이벤트, 작물(.crop-direct-input)+input이벤트,
 *                 면적(.area-direct-input)+input이벤트, purpose select(일반재배), receptionMethod 버튼(우편)
 *  - water:       receptionMethod 버튼(방문), 채취장소(.sampling-location-input)
 *                 purpose/testItems는 HTML에 checked 기본값 있음
 *                 navResetBtn → confirm('...') 다이얼로그 — page.dialog 허용 필요
 *  - compost:     farmName, 축종(.animal-type-options label[소])
 *                 sampleType 기본값 '가축분퇴비'로 충족
 *  - heavy-metal: samplingLocation, cropName, samplingDate(today), analysisItems(구리 체크),
 *                 purpose(radio 첫 클릭), receptionMethod 버튼(우편)
 *                 navResetBtn → confirm('...') 다이얼로그 — page.dialog 허용 필요
 *  - pesticide:   의뢰항목(.request-crop-name 첫 행 입력), purpose select(참고용),
 *                 receptionMethod 버튼(우편)
 *
 * 리셋 동작 차이:
 *  - soil:       navResetBtn → resetFormKeepReceptionInfo() → name 유지(비워지지 않음)
 *  - water:      navResetBtn → confirm() → resetForm() — confirm 허용 시 name 비워짐
 *  - compost:    navResetBtn → 직접 resetForm() — name 비워짐
 *  - heavy-metal:navResetBtn → confirm() → resetForm() — confirm 허용 시 name 비워짐
 *  - pesticide:  navResetBtn → form.reset() 직접 — name 비워짐
 *
 * water/pesticide submitForm 차이:
 *  - water:   navSubmitBtn → checkValidity() 후 submitForm() — form.requestSubmit() 아님
 *  - pesticide: navSubmitBtn → Base 경유(884라인) 또는 타입 자체 바인딩
 */

const TYPES = [
    {
        key: 'soil',
        path: '/soil/',
        label: '토양',
        storageKey: (year) => `soilSampleLogs_${year}`,
        // navResetBtn → resetFormKeepReceptionInfo() → form.reset() 포함하므로 name 비워짐
        // (접수번호/날짜는 유지, name은 form.reset()으로 비워짐)
        nameCleared: true,
        needsConfirm: false,
        fillRequired: async (page) => {
            // 필지 주소 (input 이벤트 필요 — this.parcels 업데이트)
            const lotInput = page.locator('.lot-address-input').first();
            await lotInput.fill('내성리 123');
            await lotInput.dispatchEvent('input');
            // 작물명 (input 이벤트 필요 — updateFirstCrop 트리거)
            const cropInput = page.locator('.crop-direct-input').first();
            await cropInput.fill('고추');
            await cropInput.dispatchEvent('input');
            // 면적 (input 이벤트 필요 — updateFirstCrop 완성)
            const areaInput = page.locator('.area-direct-input').first();
            await areaInput.fill('500');
            await areaInput.dispatchEvent('input');
            // purpose select — required, 기본값 ""
            await page.selectOption('#purpose', '일반재배');
            // receptionMethod hidden input — required
            await page.click('.reception-method-btn[data-method="우편"]');
        },
    },
    {
        key: 'water',
        path: '/water/',
        label: '수질분석',
        storageKey: (year) => `waterSampleLogs_${year}`,
        // navResetBtn → confirm() → resetForm() → name 비워짐
        nameCleared: true,
        needsConfirm: true,
        fillRequired: async (page) => {
            // receptionMethod hidden input — required
            await page.click('.reception-method-btn[data-method="방문"]');
            // sampleName select — required, 기본값 ""
            await page.selectOption('#sampleName', '지하수');
            // 채취장소 — required
            const locInput = page.locator('.sampling-location-input').first();
            await locInput.fill('내성리 지하수');
            // purpose/testItems는 HTML checked 기본값 있음
        },
    },
    {
        key: 'compost',
        path: '/compost/',
        label: '퇴비',
        storageKey: (year) => `compostSampleLogs_${year}`,
        // navResetBtn → confirm() → resetForm() → name 비워짐
        nameCleared: true,
        needsConfirm: true,
        fillRequired: async (page) => {
            await page.fill('#farmName', '스모크농장');
            // 축종 라디오 — 레이블 클릭
            const animalLabel = page.locator('.animal-type-options label.checkbox-card').filter({ hasText: '소' });
            await animalLabel.click();
            // sampleType 기본값 '가축분퇴비'로 충족
        },
    },
    {
        key: 'heavy-metal',
        path: '/heavy-metal/',
        label: '중금속',
        storageKey: (year) => `heavyMetalSampleLogs_${year}`,
        // navResetBtn → confirm() → resetForm() → name 비워짐
        nameCleared: true,
        needsConfirm: true,
        fillRequired: async (page) => {
            await page.fill('#samplingLocation', '봉화군 내성리');
            await page.fill('#cropName', '벼');
            const today = new Date().toISOString().split('T')[0];
            await page.fill('#samplingDate', today);
            // 분석항목: 체크박스가 CSS로 숨겨질 수 있으므로 label 클릭 방식 사용
            await page.locator('label.analysis-item').first().click();
            // 목적 라디오 — 첫 번째(일반재배) label 클릭
            await page.locator('input[name="purpose"]').first().evaluate(el => el.click());
            // receptionMethod hidden input — required
            await page.click('.reception-method-btn[data-method="우편"]');
        },
    },
    {
        key: 'pesticide',
        path: '/pesticide/',
        label: '잔류농약',
        storageKey: (year) => `pesticideSampleLogs_${year}`,
        // navResetBtn → form.reset() 직접 — name 비워짐
        nameCleared: true,
        needsConfirm: false,
        fillRequired: async (page) => {
            // 의뢰항목 첫 행 (.request-crop-name)
            const cropInput = page.locator('.request-item .request-crop-name').first();
            await cropInput.fill('사과');
            // purpose select — required, 기본값 ""
            await page.selectOption('#purpose', '참고용');
            // receptionMethod hidden input — required
            await page.click('.reception-method-btn[data-method="우편"]');
        },
    },
];

for (const t of TYPES) {
    test.describe(`${t.label} CRUD 스모크`, () => {

        test.beforeEach(async ({ page }) => {
            await page.goto(t.path);
            await page.evaluate(() => localStorage.clear());
            await page.reload();
            await page.waitForLoadState('networkidle');
        });

        // ──────────────────────────────────────────────────────
        // 시나리오 1: 등록 → 목록 반영 (무조건 단언)
        // ──────────────────────────────────────────────────────
        test('등록 → 목록 반영 (무조건 단언)', async ({ page }) => {
            const uniqueName = `스모크${t.key}`;

            await page.fill('#name', uniqueName);
            await page.fill('#phoneNumber', '010-1234-5678');
            await t.fillRequired(page);

            // water는 navSubmitBtn → checkValidity() → submitForm() 직접 호출
            // 다른 타입은 navSubmitBtn → form.requestSubmit() 또는 submitForm() 직접
            await page.click('#navSubmitBtn');
            await page.waitForTimeout(300);

            // 결과 모달 닫기
            const resultModal = page.locator('#registrationResultModal');
            const isModalVisible = await resultModal.isVisible({ timeout: 2000 }).catch(() => false);
            if (isModalVisible) {
                await page.click('#closeResultBtn');
                await page.waitForTimeout(200);
            }

            // 목록 뷰 전환
            await page.click('.nav-btn[data-view="list"]');
            await page.waitForSelector('#listView', { state: 'visible' });

            // 무조건 단언
            await expect(page.locator('#logTableBody')).toContainText(uniqueName);
        });

        // ──────────────────────────────────────────────────────
        // 시나리오 2: 수정 → 변경 반영
        // ──────────────────────────────────────────────────────
        test('수정 → 변경 반영', async ({ page }) => {
            const beforeName = `수정전${t.key}`;
            const afterName = `수정후${t.key}`;

            // ── 등록
            await page.fill('#name', beforeName);
            await page.fill('#phoneNumber', '010-1111-2222');
            await t.fillRequired(page);
            await page.click('#navSubmitBtn');
            await page.waitForTimeout(300);

            const resultModal = page.locator('#registrationResultModal');
            const isModalVisible = await resultModal.isVisible({ timeout: 2000 }).catch(() => false);
            if (isModalVisible) {
                await page.click('#closeResultBtn');
                await page.waitForTimeout(200);
            }

            // 목록 뷰
            await page.click('.nav-btn[data-view="list"]');
            await page.waitForSelector('#listView', { state: 'visible' });
            await expect(page.locator('#logTableBody')).toContainText(beforeName);

            // ── 수정 진입
            await page.locator('#logTableBody .btn-edit').first().click();
            await page.waitForTimeout(300);

            // 이름 변경
            await page.fill('#name', afterName);

            // 수정 완료 제출
            await page.click('#navSubmitBtn');
            await page.waitForTimeout(300);

            // 수정 후 모달 닫기 (있으면)
            const resultModal2 = page.locator('#registrationResultModal');
            const isModal2Visible = await resultModal2.isVisible({ timeout: 1000 }).catch(() => false);
            if (isModal2Visible) {
                await page.click('#closeResultBtn');
                await page.waitForTimeout(200);
            }

            // 목록 뷰 전환 (수정 후 자동 전환되지 않는 타입 대비)
            const isListVisible = await page.locator('#listView').isVisible({ timeout: 500 }).catch(() => false);
            if (!isListVisible) {
                await page.click('.nav-btn[data-view="list"]');
                await page.waitForSelector('#listView', { state: 'visible' });
            }

            // 무조건 단언
            await expect(page.locator('#logTableBody')).toContainText(afterName);
            await expect(page.locator('#logTableBody')).not.toContainText(beforeName);
        });

        // ──────────────────────────────────────────────────────
        // 시나리오 3: 리셋 → 폼 비움
        // ──────────────────────────────────────────────────────
        test('리셋 → 폼 비움', async ({ page }) => {
            await page.fill('#name', '리셋테스트');
            await expect(page.locator('#name')).toHaveValue('리셋테스트');

            if (t.needsConfirm) {
                // water/heavy-metal: navResetBtn → confirm() 다이얼로그 → 허용해야 resetForm 실행
                page.once('dialog', dialog => dialog.accept());
            }
            await page.click('#navResetBtn');
            await page.waitForTimeout(200);

            if (t.nameCleared) {
                // 대부분 타입: resetForm() → form.reset() → name 비워짐
                await expect(page.locator('#name')).toHaveValue('');
            } else {
                // soil: resetFormKeepReceptionInfo() → name 유지 (현재 동작 고정)
                // 이것이 의도된 UX — 리팩토링 후에도 이 동작이 유지되어야 함
                await expect(page.locator('#name')).not.toHaveValue('');
            }
        });

    });
}
