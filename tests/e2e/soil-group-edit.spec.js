// @ts-check
const { test, expect } = require('@playwright/test')

/**
 * SAMPL-1-119 회귀 테스트: 토양 그룹 수정 폼 복원.
 *
 * 버그: populateFormForGroupEdit/populateFormForEdit/flattenLogsForTable가 parcels[0]만 읽고
 *       레코드 최상위 권위 필드(subCategory/purpose/cropsDisplay/area)로 폴백하지 않아,
 *       parcels[0]가 비어있는 레코드(레거시/Firestore 동기화/부분저장)의 구분·용도·작물명·면적이
 *       그룹 수정 폼과 목록에서 빈 칸/'-'로 표시됐다. 사용자가 재입력 → 중복 등록으로 이어졌다.
 */
test.describe('토양 그룹 수정 — 빈 parcels[0] 폼 복원 (SAMPL-1-119)', () => {

    test('상위 필드만 있는 그룹도 수정 폼·목록에서 구분/용도/작물명/면적이 복원되고 중복 없이 저장된다', async ({ page }) => {
        // 그룹 수정 무변경 저장 시 삭제 확인 다이얼로그가 뜨면 수락 (정상 경로에선 발생 안 함)
        page.on('dialog', d => d.accept())

        await page.goto('/soil/')
        await page.evaluate(() => localStorage.clear())

        const year = new Date().getFullYear()
        // parcels[0]가 stub(category/purpose/crops 비어있음)이고 요약은 최상위에만 있는 2필지 그룹
        await page.evaluate((y) => {
            const mk = (o) => Object.assign({
                date: `${y}-03-01`, name: '그룹복원테스트', phoneNumber: '010-0000-2222',
                address: '경북 봉화군 봉화읍 내성리', landClass1: '농가의뢰',
                receptionMethod: '직접', note: '', groupId: 'gid-119',
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isComplete: false,
            }, o)
            localStorage.setItem(`soilSampleLogs_${y}`, JSON.stringify([
                mk({ id: 's1', receptionNumber: '501', subCategory: '밭', purpose: '무농약',
                    parcelIndex: 1, totalParcels: 2,
                    parcels: [{ id: 'z1', lotAddress: '내성리 100', isMountain: false, subLots: [], crops: [], category: '', purpose: '', note: '' }],
                    lotAddress: '내성리 100', area: '1000', cropsDisplay: '고추' }),
                mk({ id: 's2', receptionNumber: '502', subCategory: '논', purpose: '일반재배',
                    parcelIndex: 2, totalParcels: 2,
                    parcels: [{ id: 'z2', lotAddress: '내성리 200', isMountain: false, subLots: [], crops: [], category: '', purpose: '', note: '' }],
                    lotAddress: '내성리 200', area: '2000', cropsDisplay: '벼' }),
            ]))
        }, year)

        await page.reload()
        await page.waitForLoadState('networkidle')

        // ── 목록: 2건 + 작물/면적이 '-'가 아니라 최상위 값으로 표시(flatten 폴백)
        await page.click('.nav-btn[data-view="list"]')
        await page.waitForSelector('#listView', { state: 'visible' })
        await expect(page.locator('#logTableBody tr')).toHaveCount(2)
        const listText = await page.locator('#logTableBody').innerText()
        expect(listText).toContain('고추')
        expect(listText).toContain('벼')

        // ── 그룹 수정 진입 (첫 행)
        await page.locator('#logTableBody .btn-edit').first().click()
        await page.waitForSelector('.parcel-card', { state: 'visible' })
        await page.waitForTimeout(200)

        // ── 핵심 단언: 필지 카드에 구분/용도/작물명/면적이 복원됨 (버그 시 모두 빈 칸)
        const cards = await page.evaluate(() =>
            [...document.querySelectorAll('.parcel-card')].map(c => ({
                cat: c.querySelector('.parcel-category-select')?.value || '',
                pur: c.querySelector('.parcel-purpose-select')?.value || '',
                crop: c.querySelector('.crop-direct-input')?.value || '',
                area: c.querySelector('.area-direct-input')?.value || '',
            })))
        expect(cards.length).toBe(2)
        expect(cards[0]).toEqual({ cat: '밭', pur: '무농약', crop: '고추', area: '1000' })
        expect(cards[1]).toEqual({ cat: '논', pur: '일반재배', crop: '벼', area: '2000' })

        // ── 무변경 저장 → 중복 없이 2건 유지 + parcels[0] 자기치유
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(400)

        const after = await page.evaluate((y) =>
            JSON.parse(localStorage.getItem(`soilSampleLogs_${y}`) || '[]'), year)
        expect(after.length).toBe(2)                                              // 중복 없음
        expect(after.map(r => r.receptionNumber).sort()).toEqual(['501', '502'])  // 접수번호 보존
        // 저장 시 parcels[0]가 폼 복원값으로 채워짐(치유)
        expect(after.every(r => r.parcels?.[0]?.category)).toBe(true)
        expect(after.every(r => (r.parcels?.[0]?.crops || []).length > 0)).toBe(true)
    })
})
