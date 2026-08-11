// SAMPL-1-147: 편집 모드 가드 단위 테스트
// - isEditing(): 편집 상태 판별
// - confirmYearChangeWhileEditing(): 편집 중 연도 변경 확인/취소
//   ★ 확인 시 셀렉트가 새 연도로 남아야 한다 (yearSelect가 <form> 내부여서
//     resetForm()이 구 연도로 되돌리는 순서 결함의 회귀 방지)
// - loadYearData(): 편집 중 접수번호 입력칸을 덮어쓰지 않는다
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'

beforeAll(async () => {
    await import('../../src/shared/BaseSampleManager.js')
})

function createManager() {
    const manager = new window.BaseSampleManager({
        moduleKey: 'test',
        moduleName: '테스트',
        storageKey: 'testSampleLogs',
        autoSaveFile: 'test-autosave.json'
    })
    manager.showToast = vi.fn()
    return manager
}

describe('isEditing', () => {
    let manager

    beforeEach(() => {
        manager = createManager()
    })

    it('편집 중이 아니면 false', () => {
        expect(manager.isEditing()).toBe(false)
    })

    it('editingId가 있으면 true', () => {
        manager.editingId = 'abc'
        expect(manager.isEditing()).toBe(true)
    })

    it('그룹 편집(editingGroupIds)만 있어도 true', () => {
        manager.editingId = null
        manager.editingGroupIds = ['a', 'b']
        expect(manager.isEditing()).toBe(true)
    })

    it('editingGroupIds가 빈 배열이면 false', () => {
        manager.editingGroupIds = []
        expect(manager.isEditing()).toBe(false)
    })
})

describe('confirmYearChangeWhileEditing', () => {
    let manager
    let selectEl

    beforeEach(() => {
        manager = createManager()
        manager.selectedYear = '2026'
        document.body.innerHTML = `
            <form id="sampleForm">
                <select id="yearSelect">
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                </select>
                <input type="text" id="receptionNumber" />
            </form>
        `
        selectEl = document.getElementById('yearSelect')
        selectEl.value = '2027'
        manager.form = document.getElementById('sampleForm')
        manager.generateNextReceptionNumber = () => '1'
    })

    it('편집 중이 아니면 확인 없이 통과', () => {
        const confirmSpy = vi.spyOn(window, 'confirm')
        expect(manager.confirmYearChangeWhileEditing(selectEl, '2027')).toBe(true)
        expect(confirmSpy).not.toHaveBeenCalled()
        confirmSpy.mockRestore()
    })

    it('편집 중 취소하면 false + 셀렉트가 기존 연도로 원복', () => {
        manager.editingId = 'abc'
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

        expect(manager.confirmYearChangeWhileEditing(selectEl, '2027')).toBe(false)
        expect(selectEl.value).toBe('2026')
        expect(manager.editingId).toBe('abc')  // 편집 상태 유지

        confirmSpy.mockRestore()
    })

    it('편집 중 확인하면 편집 해제 + 셀렉트는 새 연도 유지', () => {
        manager.editingId = 'abc'
        manager.editingGroupIds = ['abc', 'def']
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

        expect(manager.confirmYearChangeWhileEditing(selectEl, '2027')).toBe(true)
        // ★ resetForm()이 구 연도(2026)로 되돌려도 최종값은 새 연도여야 한다
        expect(selectEl.value).toBe('2027')
        expect(manager.editingId).toBeNull()
        expect(manager.editingGroupIds).toEqual([])
        expect(manager.isEditing()).toBe(false)

        confirmSpy.mockRestore()
    })

    it('cancelEditMode 기본 구현이 resetForm으로 편집을 해제한다', () => {
        manager.editingId = 'abc'
        manager.cancelEditMode()
        expect(manager.editingId).toBeNull()
    })
})

describe('loadYearData 접수번호 가드', () => {
    let manager
    let recEl

    beforeEach(() => {
        manager = createManager()
        localStorage.clear()
        window.firebaseConfig = undefined
        window.firestoreDb = undefined
        document.body.innerHTML = '<input type="text" id="receptionNumber" />'
        recEl = document.getElementById('receptionNumber')
        manager.filterAndRenderLogs = vi.fn()
        manager.updateRecordCount = vi.fn()
        manager.triggerAutoSave = vi.fn()
        manager.generateNextReceptionNumber = () => '99'
        localStorage.setItem('testSampleLogs_2026', JSON.stringify([{ id: 'a', receptionNumber: '7' }]))
    })

    it('편집 중이 아니면 다음 접수번호로 갱신', async () => {
        recEl.value = '7'
        await manager.loadYearData('2026')
        expect(recEl.value).toBe('99')
    })

    it('편집 중이면 입력칸을 덮어쓰지 않는다', async () => {
        recEl.value = '7'
        manager.editingId = 'a'
        await manager.loadYearData('2026')
        expect(recEl.value).toBe('7')
    })

    it('그룹 편집 중에도 입력칸을 덮어쓰지 않는다', async () => {
        recEl.value = '7, 8, 9'
        manager.editingGroupIds = ['a', 'b', 'c']
        await manager.loadYearData('2026')
        expect(recEl.value).toBe('7, 8, 9')
    })
})

describe('notifyEditTargetMissing', () => {
    it('안내 토스트를 띄우고 진단 로그를 error 레벨로 남긴다', () => {
        const manager = createManager()
        const logger = { error: vi.fn() }
        window.logger = logger

        manager.editingId = 'abc'
        manager.selectedYear = '2026'
        manager.sampleLogs = [{ id: 'x' }]
        manager.notifyEditTargetMissing('updateSample', { requestedId: 'abc' })

        expect(manager.showToast).toHaveBeenCalledWith(
            window.BaseSampleManager.EDIT_TARGET_MISSING_MESSAGE,
            'error'
        )
        expect(logger.error).toHaveBeenCalledTimes(1)
        const [message, detail] = logger.error.mock.calls[0]
        expect(message).toContain('updateSample')
        expect(detail).toMatchObject({
            editingId: 'abc',
            selectedYear: '2026',
            logCount: 1,
            requestedId: 'abc'
        })

        window.logger = undefined
    })

    it('안내 문구가 원인(다른 연도)을 지목한다', () => {
        expect(window.BaseSampleManager.EDIT_TARGET_MISSING_MESSAGE).toContain('다른 연도')
    })

    // SAMPL-1-148
    it('세 번째 인자로 문구를 바꿀 수 있고, 생략하면 기본 문구를 쓴다', () => {
        const manager = createManager()
        window.logger = { error: () => {} }

        manager.notifyEditTargetMissing('saveCompostAnalysis', {},
            window.BaseSampleManager.ANALYSIS_TARGET_MISSING_MESSAGE)
        expect(manager.showToast).toHaveBeenLastCalledWith(
            window.BaseSampleManager.ANALYSIS_TARGET_MISSING_MESSAGE, 'error')

        manager.notifyEditTargetMissing('updateSample')
        expect(manager.showToast).toHaveBeenLastCalledWith(
            window.BaseSampleManager.EDIT_TARGET_MISSING_MESSAGE, 'error')

        window.logger = undefined
    })

    it('분석결과 문구는 편집 문구와 다르고, 둘 다 원인을 지목한다', () => {
        const edit = window.BaseSampleManager.EDIT_TARGET_MISSING_MESSAGE
        const analysis = window.BaseSampleManager.ANALYSIS_TARGET_MISSING_MESSAGE
        expect(analysis).not.toBe(edit)
        expect(analysis).toContain('다른 연도')
        // "저장할"이 아니라 "입력할" — 조회(모달 열기)와 저장 양쪽에서 성립해야 한다
        expect(analysis).toContain('입력할')
    })
})
