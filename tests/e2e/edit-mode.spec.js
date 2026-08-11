// @ts-check
const { test, expect } = require('@playwright/test')

/**
 * SAMPL-1-147 회귀 테스트: 목록 → [수정] 시 기본정보 저장 실패
 *
 * 실측으로 확인된 원인 4건:
 *  ① loadYearData가 편집 중에도 접수번호 입력칸을 다음 자동번호로 덮어씀
 *  ② 편집 중 연도 변경 시 sampleLogs가 교체되어 저장 실패 (수질=무반응 / 중금속=가짜 성공)
 *  ③ editingId(문자열) vs l.id 엄격 비교 → 숫자형 id 레코드에서 조용히 실패
 *  ④ 편집 시 레코드 재조립에서 폼 외부 필드 유실 (수질 mailDate / 중금속 mailDate+testResult)
 */

const YEAR = new Date().getFullYear()

/**
 * 수질 레코드 1건.
 * __sentinel: 편집 시 레코드 재조립이 "폼에 없는 필드"를 보존하는지 감시하는 미지 필드.
 * 이 단언이 깨지면 기존 레코드 전개(`...prev`)가 사라졌거나 제외 목록이 과도해진 것이다.
 */
function waterRecord(overrides = {}) {
    return {
        id: 'w-uuid-1', groupId: 'wg-1', receptionNumber: '7', date: `${YEAR}-03-01`,
        name: '수정테스트', phoneNumber: '010-1234-5678',
        address: '경북 봉화군 봉화읍 1', addressRoad: '경북 봉화군 봉화읍 1',
        addressDetail: '', addressPostcode: '',
        sampleType: '물', sampleName: '지하수', sampleCount: '1',
        samplingLocation: '봉화읍 내성리', mainCrop: '벼', testItems: '생활용수',
        purpose: '참고용', receptionMethod: '방문', note: '',
        mailDate: `${YEAR}-03-05`, testResult: 'pass', isComplete: false,
        __sentinel: 'keep-me',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        ...overrides
    }
}

function heavyMetalRecord(overrides = {}) {
    return {
        id: 'hm-uuid-1', receptionNumber: '5', date: `${YEAR}-03-01`,
        name: '중금속테스트', phoneNumber: '010-2222-3333',
        address: '경북 봉화군 봉화읍 2', addressRoad: '경북 봉화군 봉화읍 2',
        addressDetail: '', addressPostcode: '',
        applicantType: '개인', birthDate: '1980-01-01',
        samplingLocation: '봉화읍 내성리', cropName: '사과', treeAge: '5',
        samplingDate: `${YEAR}-02-20`, sampleCount: 1,
        analysisItems: ['구리'], purpose: '일반재배', receptionMethod: '방문', note: '',
        mailDate: `${YEAR}-03-05`, testResult: 'pass', isComplete: false,
        __sentinel: 'keep-me',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        ...overrides
    }
}

/** 시드 후 목록 뷰에서 첫 행의 [수정] 진입 */
async function seedAndEnterEdit(page, path, storageKey, record, editBtnSelector) {
    await page.goto(path)
    await page.evaluate(([k, v]) => {
        localStorage.clear()
        localStorage.setItem(k, JSON.stringify([v]))
    }, [storageKey, record])
    await page.reload()
    await page.waitForTimeout(1200)

    await page.click('.nav-btn[data-view="list"]')
    await page.locator(editBtnSelector).first().click()
    await expect(page.locator('#formView')).toHaveClass(/active/)
}

const readLogs = (page, key) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || '[]'), key)

test.describe('SAMPL-1-147 — 목록 수정 시 기본정보 저장', () => {

    test('수질: 접수번호·성명 수정이 저장된다', async ({ page }) => {
        const pageErrors = []
        page.on('pageerror', e => pageErrors.push(e.message))
        const key = `waterSampleLogs_${YEAR}`

        await seedAndEnterEdit(page, '/water/', key, waterRecord(), '#logTableBody .btn-edit')
        await expect(page.locator('#receptionNumber')).toHaveValue('7')

        await page.fill('#receptionNumber', '77')
        await page.fill('#name', '수정된이름')
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(800)

        const logs = await readLogs(page, key)
        expect(logs).toHaveLength(1)
        expect(logs[0].receptionNumber).toBe('77')
        expect(logs[0].name).toBe('수정된이름')
        expect(pageErrors).toEqual([])
    })

    test('수질: 편집 중 데이터 재로드가 접수번호를 덮어쓰지 않는다 (원인 ①)', async ({ page }) => {
        const key = `waterSampleLogs_${YEAR}`
        await seedAndEnterEdit(page, '/water/', key, waterRecord(), '#logTableBody .btn-edit')
        await expect(page.locator('#receptionNumber')).toHaveValue('7')

        // 편집 상태에서 연도 데이터 재로드 (Firebase 지연 로드와 동일 경로)
        await page.evaluate(y => window.waterManager.loadYearData(String(y)), YEAR)
        await page.waitForTimeout(600)

        await expect(page.locator('#receptionNumber')).toHaveValue('7')
    })

    test('수질: 수정해도 폼 외부 필드(mailDate 등)가 유실되지 않는다 (원인 ④)', async ({ page }) => {
        const key = `waterSampleLogs_${YEAR}`
        const seeded = waterRecord()
        await seedAndEnterEdit(page, '/water/', key, seeded, '#logTableBody .btn-edit')

        await page.fill('#name', '보존확인')
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(800)

        const logs = await readLogs(page, key)
        expect(logs[0].mailDate).toBe(seeded.mailDate)
        expect(logs[0].testResult).toBe(seeded.testResult)

        // 앞으로 추가되는 필드가 수정 시 유실되는지 감시하는 센티넬 (상단 주석 참조)
        expect(logs[0].__sentinel).toBe('keep-me')
    })

    test('중금속: 수정해도 우편발송일자·판정이 유실되지 않는다 (원인 ④ CRITICAL)', async ({ page }) => {
        const key = `heavyMetalSampleLogs_${YEAR}`
        const seeded = heavyMetalRecord()
        await seedAndEnterEdit(page, '/heavy-metal/', key, seeded, '.btn-edit')

        await page.fill('#name', '보존확인')
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(800)

        const logs = await readLogs(page, key)
        expect(logs).toHaveLength(1)
        expect(logs[0].name).toBe('보존확인')
        expect(logs[0].mailDate).toBe(seeded.mailDate)
        expect(logs[0].testResult).toBe(seeded.testResult)
        expect(logs[0].__sentinel).toBe('keep-me')
    })

    test('수질: 편집 중 연도 변경을 취소하면 연도·편집 상태가 유지된다 (원인 ②)', async ({ page }) => {
        const key = `waterSampleLogs_${YEAR}`
        await seedAndEnterEdit(page, '/water/', key, waterRecord(), '#logTableBody .btn-edit')

        let dialogShown = false
        page.on('dialog', d => { dialogShown = true; d.dismiss() })
        await page.selectOption('#yearSelect', String(YEAR + 1))
        await page.waitForTimeout(600)
        expect(dialogShown).toBe(true)

        await expect(page.locator('#yearSelect')).toHaveValue(String(YEAR))
        expect(await page.evaluate(() => window.waterManager.editingId)).toBeTruthy()

        // 편집이 살아 있으므로 저장이 정상 반영된다
        await page.fill('#name', '취소후저장')
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(800)
        const logs = await readLogs(page, key)
        expect(logs[0].name).toBe('취소후저장')
    })

    test('수질: 편집 중 연도 변경을 확인하면 연도가 실제로 바뀌고 편집이 해제된다 (원인 ②)', async ({ page }) => {
        const key = `waterSampleLogs_${YEAR}`
        await seedAndEnterEdit(page, '/water/', key, waterRecord(), '#logTableBody .btn-edit')

        // 확인창이 실제로 떴는지까지 단언 — 이 단언이 없으면 가드를 제거하고
        // 편집 상태만 정리하는 변경이 들어와도 테스트가 통과한다
        let dialogShown = false
        page.on('dialog', d => { dialogShown = true; d.accept() })
        await page.selectOption('#yearSelect', String(YEAR + 1))
        await page.waitForTimeout(900)
        expect(dialogShown).toBe(true)

        // resetForm이 yearSelect를 구 연도로 되돌리는 순서 결함의 회귀 방지
        await expect(page.locator('#yearSelect')).toHaveValue(String(YEAR + 1))
        expect(await page.evaluate(() => window.waterManager.selectedYear)).toBe(String(YEAR + 1))
        expect(await page.evaluate(() => window.waterManager.isEditing())).toBe(false)

        // 원본 연도 데이터는 손상되지 않는다
        const logs = await readLogs(page, key)
        expect(logs).toHaveLength(1)
        expect(logs[0].name).toBe('수정테스트')
    })

    test('중금속: 대상이 사라지면 성공 토스트 대신 실패 안내가 뜬다 (원인 ② 가짜 성공)', async ({ page }) => {
        const key = `heavyMetalSampleLogs_${YEAR}`
        await seedAndEnterEdit(page, '/heavy-metal/', key, heavyMetalRecord(), '.btn-edit')

        // 편집 대상이 사라진 상황을 직접 만든다 (편집 중 연도 변경과 동일한 상태)
        await page.evaluate(() => { window.heavyMetalManager.sampleLogs = [] })
        await page.fill('#name', '사라진대상')
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(800)

        const toasts = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.toast, #toast')).map(t => t.textContent || ''))
        expect(toasts.some(t => t.includes('찾을 수 없습니다'))).toBe(true)
        expect(toasts.some(t => t.includes('수정되었습니다'))).toBe(false)
    })

    test('수질 그룹 수정: 행별 폼 밖 필드가 자기 행에 유지된다 (원인 ④ 그룹 경로)', async ({ page }) => {
        const key = `waterSampleLogs_${YEAR}`
        // 비연속 접수번호 그룹 3건 — oldOrdered 정렬과 행 매핑이 어긋나는지까지 본다
        const rows = [5, 9, 12].map((n, i) => waterRecord({
            id: `wg-${n}`, receptionNumber: String(n),
            samplingLocation: `장소${i + 1}`, mainCrop: `작물${i + 1}`, sampleNote: `비고${i + 1}`,
            mailDate: `${YEAR}-04-0${i + 1}`, __sentinel: `row-${i + 1}`
        }))

        await page.goto('/water/')
        await page.evaluate(([k, v]) => {
            localStorage.clear()
            localStorage.setItem(k, JSON.stringify(v))
        }, [key, rows])
        await page.reload()
        await page.waitForTimeout(1200)

        await page.click('.nav-btn[data-view="list"]')
        await page.locator('#logTableBody .btn-edit').first().click()
        await expect(page.locator('#formView')).toHaveClass(/active/)
        expect(await page.evaluate(() => window.waterManager.editingGroupIds.length)).toBe(3)

        await page.fill('#name', '그룹수정후')
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(1000)

        const logs = (await readLogs(page, key)).sort(
            (a, b) => parseInt(a.receptionNumber, 10) - parseInt(b.receptionNumber, 10))
        expect(logs).toHaveLength(3)
        expect(logs.every(l => l.name === '그룹수정후')).toBe(true)
        // 행별 값이 뒤섞이지 않고 각자 자기 행에 남아야 한다
        logs.forEach((l, i) => {
            expect(l.samplingLocation).toBe(`장소${i + 1}`)
            expect(l.mailDate).toBe(`${YEAR}-04-0${i + 1}`)
            expect(l.__sentinel).toBe(`row-${i + 1}`)
        })
    })

    test('수질: 레거시 배열을 가진 단건은 수정 후 낡은 값이 부활하지 않는다', async ({ page }) => {
        const key = `waterSampleLogs_${YEAR}`
        // 쓰기 지점이 없는 읽기 전용 레거시 배열 — editSample이 단수 필드보다 우선 참조한다
        const seeded = waterRecord({
            id: 'legacy-1', groupId: undefined,
            samplingLocation: '장소A', sampleCount: '2',
            samplingLocations: ['장소A', '장소B'],
            samplingCrops: ['벼', '콩'],
            samplingNotes: ['비고A', '비고B'],
            sampleNamesPerRow: ['지하수', '지하수']
        })

        await page.goto('/water/')
        await page.evaluate(([k, v]) => {
            localStorage.clear()
            localStorage.setItem(k, JSON.stringify([v]))
        }, [key, seeded])
        await page.reload()
        await page.waitForTimeout(1200)

        await page.click('.nav-btn[data-view="list"]')
        await page.locator('#logTableBody .btn-edit').first().click()
        await expect(page.locator('#formView')).toHaveClass(/active/)

        // 두 번째 채취장소를 수정한 뒤 저장
        const locInputs = page.locator('#samplingLocationsList .sampling-location-input')
        await expect(locInputs).toHaveCount(2)
        await locInputs.nth(1).fill('장소B-수정')
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(1000)

        const logs = await readLogs(page, key)
        // 레거시 배열은 제거되어야 한다 — 남으면 재편집 시 낡은 값이 우선 참조된다
        for (const l of logs) {
            expect(l.samplingLocations).toBeUndefined()
            expect(l.samplingCrops).toBeUndefined()
            expect(l.samplingNotes).toBeUndefined()
            expect(l.sampleNamesPerRow).toBeUndefined()
        }
        // 원본 레코드를 이어받은 행에서는 미지 필드가 보존되어야 한다.
        // (행이 1건 → 2건으로 늘었으므로 두 번째 행은 신규 레코드이고 폼 밖 필드가 없는 것이 정상)
        expect(logs.filter(l => l.__sentinel === 'keep-me')).toHaveLength(1)
        expect(logs.map(l => l.samplingLocation).sort()).toEqual(['장소A', '장소B-수정'])
    })

    test('토양 그룹 수정: 폼 밖 필드(우편발송일자·공익직불제)가 유실되지 않는다 (원인 ④)', async ({ page }) => {
        const key = `soilSampleLogs_${YEAR}`
        // 같은 groupId를 가진 다필지 그룹 2건. 폼에 입력란이 없는 필드를 채워둔다.
        const common = {
            groupId: 'sg-1', date: `${YEAR}-03-01`, name: '그룹보존테스트', phoneNumber: '010-4444-5555',
            address: '경북 봉화군 봉화읍 3', addressRoad: '경북 봉화군 봉화읍 3', addressDetail: '', addressPostcode: '',
            subCategory: '논', purpose: '일반재배', landClass1: '농가의뢰',
            receptionMethod: '방문', note: '', totalParcels: 2, isComplete: false,
            mailDate: `${YEAR}-03-05`,
            gongikOrder: '2', gongikBaseYear: String(YEAR), businessRegNo: '1234567890', basePnu: '4792025021001230000',
            __sentinel: 'keep-me',
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        }
        const mkParcel = (lot, cropName) => ({
            parcels: [{ id: `p-${lot}`, lotAddress: lot, isMountain: false, subLots: [],
                crops: [{ name: cropName, area: '1000', unit: 'm2', code: '' }], category: '논', purpose: '일반재배', note: '' }],
            lotAddress: lot, area: '1000', cropsDisplay: cropName
        })

        await page.goto('/soil/')
        await page.evaluate(([k, rows]) => {
            localStorage.clear()
            localStorage.setItem(k, JSON.stringify(rows))
        }, [key, [
            { ...common, ...mkParcel('내성리 100', '벼'), id: 'sg-a', receptionNumber: '11', parcelIndex: 1 },
            { ...common, ...mkParcel('내성리 200', '콩'), id: 'sg-b', receptionNumber: '12', parcelIndex: 2 }
        ]])
        await page.reload()
        await page.waitForTimeout(1500)

        await page.click('.nav-btn[data-view="list"]')
        await page.locator('.btn-edit').first().click()
        await expect(page.locator('#formView')).toHaveClass(/active/)
        // 그룹 수정 모드로 진입했는지 확인 (접수번호는 기본번호만 표시)
        expect(await page.evaluate(() => window.soilManager.editingGroupIds.length)).toBe(2)

        await page.fill('#name', '그룹수정후')
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(1000)

        const logs = await readLogs(page, key)
        expect(logs).toHaveLength(2)
        expect(logs.every(l => l.name === '그룹수정후')).toBe(true)

        for (const l of logs) {
            expect(l.mailDate).toBe(common.mailDate)
            expect(l.gongikOrder).toBe(common.gongikOrder)
            expect(l.gongikBaseYear).toBe(common.gongikBaseYear)
            expect(l.businessRegNo).toBe(common.businessRegNo)
            expect(l.basePnu).toBe(common.basePnu)
            expect(l.__sentinel).toBe('keep-me')
        }
    })

    // ── SAMPL-1-148: 조용한 실패·가짜 성공 잔여 경로 ──────────────────────

    test('토양 그룹 수정: 대상이 사라지면 실패 안내 + groupId 없는 레코드가 삭제되지 않는다', async ({ page }) => {
        const key = `soilSampleLogs_${YEAR}`
        const common = {
            groupId: 'sg-1', date: `${YEAR}-03-01`, name: '그룹가드테스트', phoneNumber: '010-4444-5555',
            address: '경북 봉화군 봉화읍 3', addressRoad: '경북 봉화군 봉화읍 3', addressDetail: '', addressPostcode: '',
            subCategory: '논', purpose: '일반재배', landClass1: '농가의뢰',
            receptionMethod: '방문', note: '', totalParcels: 2, isComplete: false,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        }
        const mkParcel = (lot, cropName) => ({
            parcels: [{ id: `p-${lot}`, lotAddress: lot, isMountain: false, subLots: [],
                crops: [{ name: cropName, area: '1000', unit: 'm2', code: '' }], category: '논', purpose: '일반재배', note: '' }],
            lotAddress: lot, area: '1000', cropsDisplay: cropName
        })

        await page.goto('/soil/')
        await page.evaluate(([k, rows]) => {
            localStorage.clear()
            localStorage.setItem(k, JSON.stringify(rows))
        }, [key, [
            { ...common, ...mkParcel('내성리 100', '벼'), id: 'sg-a', receptionNumber: '11', parcelIndex: 1 },
            { ...common, ...mkParcel('내성리 200', '콩'), id: 'sg-b', receptionNumber: '12', parcelIndex: 2 },
            // groupId가 없는 레거시 단건 — 가드가 없으면 filter(l => l.groupId !== undefined)에
            // 떨어져 saveLogs가 축소본을 기록하며 영구 삭제된다
            { ...common, ...mkParcel('내성리 300', '고추'), id: 'solo-1', receptionNumber: '13', groupId: undefined }
        ]])
        await page.reload()
        await page.waitForTimeout(1500)

        await page.click('.nav-btn[data-view="list"]')
        await page.locator('.btn-edit').first().click()
        await expect(page.locator('#formView')).toHaveClass(/active/)
        expect(await page.evaluate(() => window.soilManager.editingGroupIds.length)).toBe(2)

        // 편집 대상이 사라진 상황 (편집 중 연도 변경·다중 창 동기화와 동일 상태)
        await page.evaluate(() => { window.soilManager.sampleLogs = [] })
        await page.fill('#name', '사라진그룹')
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(1000)

        const toasts = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.toast, #toast')).map(t => t.textContent || ''))
        expect(toasts.some(t => t.includes('찾을 수 없습니다'))).toBe(true)
        expect(toasts.some(t => t.includes('수정되었습니다'))).toBe(false)

        const logs = await readLogs(page, key)
        // groupId: undefined 고아 레코드가 생기지 않아야 한다
        expect(logs.filter(l => !l.groupId && l.id !== 'solo-1')).toHaveLength(0)
        // 그리고 레거시 단건이 삭제되지 않아야 한다 (실제 데이터 삭제 경로 고정)
        expect(logs.some(l => l.id === 'solo-1')).toBe(true)
    })

    test('퇴·액비 분석결과: 대상이 사라지면 저장 시 실패 안내가 뜬다', async ({ page }) => {
        const key = `compostSampleLogs_${YEAR}`
        const rec = {
            id: 'cp-1', receptionNumber: '3', date: `${YEAR}-03-01`,
            name: '퇴비테스트', phoneNumber: '010-7777-8888',
            address: '경북 봉화군 봉화읍 4', addressRoad: '경북 봉화군 봉화읍 4', addressDetail: '', addressPostcode: '',
            applicantType: '개인', birthDate: '1980-01-01',
            farmName: '봉화농장', farmAddress: '봉화읍 4', farmArea: '1000', farmAreaUnit: 'm2',
            sampleType: '가축분퇴비', animalType: '소', productionDate: `${YEAR}-02-01`,
            sampleCount: '1', rawMaterials: '우분', purpose: '일반재배',
            receptionMethod: '방문', note: '', isComplete: false,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        }

        await page.goto('/compost/')
        await page.evaluate(([k, v]) => {
            localStorage.clear()
            localStorage.setItem(k, JSON.stringify([v]))
        }, [key, rec])
        await page.reload()
        await page.waitForTimeout(1200)

        await page.click('.nav-btn[data-view="list"]')
        await page.locator('.btn-analysis-open').first().click()
        await page.waitForTimeout(600)

        // 모달 진입 후 대상 소실 → 저장
        await page.evaluate(() => { window.compostManager.sampleLogs = [] })
        await page.click('#saveCompostAnalysisBtn')
        await page.waitForTimeout(800)

        const toasts = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.toast, #toast')).map(t => t.textContent || ''))
        expect(toasts.some(t => t.includes('분석결과를 입력할 접수 데이터'))).toBe(true)
        // 실패 안내와 성공 처리가 동시에 일어나는 가짜 성공을 배제한다
        expect(toasts.some(t => t.includes('저장되었습니다'))).toBe(false)
        expect(await page.evaluate(y =>
            localStorage.getItem(`compostTestResults_${y}`), YEAR)).toBeNull()
    })

    test('퇴·액비 분석결과: 대상이 없으면 모달이 열리지 않고 안내가 뜬다 (조회 경로)', async ({ page }) => {
        const key = `compostSampleLogs_${YEAR}`
        const rec = {
            id: 'cp-2', receptionNumber: '4', date: `${YEAR}-03-01`,
            name: '퇴비조회테스트', phoneNumber: '010-9999-0000',
            address: '경북 봉화군 봉화읍 5', addressRoad: '경북 봉화군 봉화읍 5', addressDetail: '', addressPostcode: '',
            sampleType: '가축분퇴비', animalType: '소', sampleCount: '1',
            purpose: '일반재배', receptionMethod: '방문', note: '', isComplete: false,
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        }

        await page.goto('/compost/')
        await page.evaluate(([k, v]) => {
            localStorage.clear()
            localStorage.setItem(k, JSON.stringify([v]))
        }, [key, rec])
        await page.reload()
        await page.waitForTimeout(1200)

        await page.click('.nav-btn[data-view="list"]')
        // 클릭 직전에 대상 소실 (목록 DOM은 stale한 dataset.id를 들고 있다)
        await page.evaluate(() => { window.compostManager.sampleLogs = [] })
        await page.locator('.btn-analysis-open').first().click()
        await page.waitForTimeout(700)

        const toasts = await page.evaluate(() =>
            Array.from(document.querySelectorAll('.toast, #toast')).map(t => t.textContent || ''))
        expect(toasts.some(t => t.includes('분석결과를 입력할 접수 데이터'))).toBe(true)
        // 모달의 hidden 여부는 초기값이 hidden이라 수정 전 코드에서도 통과한다(무효 단언).
        // 가드가 _caLogId 대입보다 먼저 실행돼 stale 상태를 남기지 않는지를 본다.
        expect(await page.evaluate(() => window.compostManager._caLogId ?? null)).toBeNull()
    })

    test('수질: 숫자형 id 레코드도 수정이 저장된다 (원인 ③)', async ({ page }) => {
        const key = `waterSampleLogs_${YEAR}`
        await seedAndEnterEdit(page, '/water/', key, waterRecord({ id: 1706000000000 }), '#logTableBody .btn-edit')

        await page.fill('#name', '숫자아이디')
        await page.click('#navSubmitBtn')
        await page.waitForTimeout(800)

        const logs = await readLogs(page, key)
        expect(logs[0].name).toBe('숫자아이디')
    })
})
