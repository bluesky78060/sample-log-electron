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
    })
})
