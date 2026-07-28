// @ts-check
const { test, expect } = require('@playwright/test')

/**
 * SAMPL-1-81 회귀 테스트: 수질 그룹 수정 시 빈 채취장소 멤버가 삭제되지 않아야 한다.
 *
 * 버그: editSample→setSamplingLocations가 빈 채취장소를 필터링해 멤버보다 적은 행을 만들고,
 *       updateSample이 필터된 개수 기준으로 removedIds를 산정해 유효 멤버를 영구 삭제했다.
 *       (Firebase 미설정 테스트 환경에서도 로컬 삭제로 재현됨)
 */
test.describe('수질 그룹 수정 — 빈 채취장소 멤버 보존 (SAMPL-1-81)', () => {

    test('빈 채취장소를 가진 그룹 멤버는 수정 후에도 삭제되지 않는다', async ({ page }) => {
        // SAMPL-1-144: uncaught 예외 수집. 이 단언이 없던 탓에 onAfterFormReset의
        // 100% 재현 TypeError가 7개월간 green으로 통과했다.
        const pageErrors = []
        page.on('pageerror', e => pageErrors.push(e.message))

        await page.goto('/water/')
        await page.evaluate(() => localStorage.clear())

        const year = new Date().getFullYear()
        // 2개 멤버 그룹 — 멤버 B는 채취장소가 비어 있음(레거시/임포트 데이터 가정)
        await page.evaluate((y) => {
            localStorage.setItem(`waterSampleLogs_${y}`, JSON.stringify([
                {
                    id: 'grp-a', groupId: 'g1', receptionNumber: '1', date: `${y}-03-01`,
                    name: '그룹수정테스트', phoneNumber: '010-0000-1111',
                    sampleType: '물', sampleName: '지하수', testItems: '생활용수',
                    samplingLocation: '봉화읍 내성리', mainCrop: '벼',
                    purpose: '참고용', receptionMethod: '방문', sampleCount: '1',
                    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
                },
                {
                    id: 'grp-b', groupId: 'g1', receptionNumber: '2', date: `${y}-03-01`,
                    name: '그룹수정테스트', phoneNumber: '010-0000-1111',
                    sampleType: '물', sampleName: '지하수', testItems: '생활용수',
                    samplingLocation: '', mainCrop: '콩',  // ← 빈 채취장소
                    purpose: '참고용', receptionMethod: '방문', sampleCount: '1',
                    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
                }
            ]))
        }, year)

        await page.reload()
        await page.waitForLoadState('networkidle')

        // 목록 뷰 — 등록 직후 2건 확인
        await page.click('.nav-btn[data-view="list"]')
        await page.waitForSelector('#listView', { state: 'visible' })
        await expect(page.locator('#logTableBody tr')).toHaveCount(2)

        // 그룹의 첫 행 수정 진입
        await page.locator('#logTableBody .btn-edit').first().click()
        await page.waitForTimeout(300)

        // 수정 전(버그) 동작: setSamplingLocations가 빈 채취장소를 필터링하면 멤버 B의 행이 사라져
        // 행 수가 1이 된다. 수정 후에는 멤버 수만큼(2행) 생성되어야 한다.
        const rowCount = await page.evaluate(() => {
            const list = document.getElementById('samplingLocationsList')
            return list ? list.querySelectorAll('.sampling-location-input').length : 0
        })
        expect(rowCount).toBe(2)  // SAMPL-1-81: 빈 채취장소 멤버도 행으로 보존

        // 빈 채취장소(B)를 채워 저장을 유효하게 만든 뒤 성명 변경
        const locInputs = page.locator('#samplingLocationsList .sampling-location-input')
        await locInputs.nth(1).fill('봉화읍 유곡리')
        await page.fill('#name', '그룹수정완료')

        // 수정 완료
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(400)

        // ── 핵심 단언: 두 멤버 모두 보존(삭제 0) + 변경 반영
        const remaining = await page.evaluate((y) =>
            JSON.parse(localStorage.getItem(`waterSampleLogs_${y}`) || '[]'), year)
        expect(remaining.length).toBe(2)                                  // 멤버 삭제 없음
        expect(remaining.filter(r => r.name === '그룹수정완료').length).toBe(2)  // 두 멤버 모두 갱신
        // 인덱스 정렬: 각 멤버의 채취장소가 보존/갱신되고 비어 있지 않음
        expect(remaining.every(r => r.samplingLocation)).toBe(true)

        // ── SAMPL-1-144: 수정 저장은 목록 뷰로 복귀해야 하고, uncaught 예외가 없어야 한다
        await expect(page.locator('#listView')).toBeVisible()
        expect(pageErrors).toEqual([])
    })
})

/**
 * SAMPL-1-144 회귀 테스트: onAfterFormReset / 검사항목 라디오 핸들러가
 * DOM에 없는 컨테이너(livingWaterItems, agriculturalWaterItems)를 참조해
 * `TypeError: Cannot read properties of null (reading 'classList')`를 던지던 문제.
 *
 * 두 컨테이너는 커밋 ac54454(수질 레이아웃 개편)에서 마크업이 삭제되었으나
 * 스크립트 참조가 남아 폼 리셋·라디오 토글 시 100% 예외가 발생했다.
 */
test.describe('수질 폼 — 삭제된 검사항목 컨테이너 참조 크래시 (SAMPL-1-144)', () => {

    test('검사항목 라디오 토글과 폼 초기화에서 uncaught 예외가 발생하지 않는다', async ({ page }) => {
        const pageErrors = []
        page.on('pageerror', e => pageErrors.push(e.message))

        await page.goto('/water/')
        await page.evaluate(() => localStorage.clear())
        await page.reload()
        await page.waitForLoadState('networkidle')

        // 삭제된 컨테이너가 실제로 없음을 고정 — 있다면 이 테스트의 전제가 바뀐 것
        const containersExist = await page.evaluate(() => ({
            living: !!document.getElementById('livingWaterItems'),
            agri: !!document.getElementById('agriculturalWaterItems')
        }))
        expect(containersExist).toEqual({ living: false, agri: false })

        // 매니저 초기화 완료를 명시적으로 고정 — 리스너 미부착 상태에서 클릭하면
        // change 핸들러 경로를 밟지 않은 채 pageErrors가 비어 false-pass한다.
        await page.waitForFunction(() => !!window.waterManager)

        // 라디오 토글 (검사항목 change 핸들러 경로).
        // input 자체는 CSS로 display:none이므로 실제 사용자와 동일하게 라벨을 클릭한다.
        const agriLabel = page.locator('label.test-item-option:has(input[value="농업용수"])')
        const livingLabel = page.locator('label.test-item-option:has(input[value="생활용수"])')
        await agriLabel.click()
        await expect(page.locator('input[name="testItems"][value="농업용수"]')).toBeChecked()
        await livingLabel.click()
        await expect(page.locator('input[name="testItems"][value="생활용수"]')).toBeChecked()

        // 폼 리셋 (onAfterFormReset 경로) — 매니저를 직접 호출해 confirm 모달 의존 제거
        await page.evaluate(() => window.waterManager.resetForm())

        expect(pageErrors).toEqual([])
    })
})
