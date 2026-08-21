import { describe, it, expect, beforeAll, beforeEach } from 'vitest'

beforeAll(async () => {
    await import('../../src/shared/BaseSampleManager.js')
})

function createManager() {
    return new window.BaseSampleManager({
        moduleKey: 'test',
        moduleName: '테스트',
        storageKey: 'testSampleLogs',
        autoSaveFile: 'test-autosave.json'
    })
}

describe('safeParseArray', () => {
    let manager

    beforeEach(() => {
        manager = createManager()
        localStorage.clear()
    })

    it('유효한 배열 파싱', () => {
        localStorage.setItem('key', JSON.stringify([{ id: 1 }, { id: 2 }]))
        expect(manager.safeParseArray('key')).toEqual([{ id: 1 }, { id: 2 }])
    })

    it('키 없으면 빈 배열', () => {
        expect(manager.safeParseArray('nonexistent')).toEqual([])
    })

    it('빈 문자열이면 빈 배열', () => {
        localStorage.setItem('key', '')
        expect(manager.safeParseArray('key')).toEqual([])
    })

    it('배열이 아닌 값이면 빈 배열', () => {
        localStorage.setItem('key', JSON.stringify({ foo: 'bar' }))
        expect(manager.safeParseArray('key')).toEqual([])
    })

    it('잘못된 JSON이면 빈 배열', () => {
        localStorage.setItem('key', 'not-json{{{')
        expect(manager.safeParseArray('key')).toEqual([])
    })

    it('null 저장값이면 빈 배열', () => {
        localStorage.setItem('key', JSON.stringify(null))
        expect(manager.safeParseArray('key')).toEqual([])
    })
})

describe('smartMerge 폴백 (SyncUtils 없을 때)', () => {
    let manager

    beforeEach(() => {
        manager = createManager()
        // SyncUtils 없음 → 폴백 로직 사용
        window.SyncUtils = undefined
    })

    it('로컬이 Firebase를 덮어씀 (같은 id)', () => {
        const local = [{ id: '1', value: 'local', updatedAt: '2026-01-02' }]
        const firebase = [{ id: '1', value: 'firebase', updatedAt: '2026-01-01' }]
        const result = manager.smartMerge(local, firebase)
        expect(result).toHaveLength(1)
        expect(result[0].value).toBe('local')
    })

    it('로컬과 Firebase 합쳐짐 (다른 id)', () => {
        const local = [{ id: '1', value: 'a' }]
        const firebase = [{ id: '2', value: 'b' }]
        const result = manager.smartMerge(local, firebase)
        expect(result).toHaveLength(2)
        const ids = result.map(r => r.id)
        expect(ids).toContain('1')
        expect(ids).toContain('2')
    })

    it('id 없는 항목도 보존', () => {
        const local = [{ id: '1', value: 'a' }, { value: 'no-id' }]
        const firebase = []
        const result = manager.smartMerge(local, firebase)
        expect(result).toHaveLength(2)
        expect(result.some(r => r.value === 'no-id')).toBe(true)
    })

    it('null/undefined 입력 안전 처리', () => {
        expect(manager.smartMerge(null, null)).toEqual([])
        expect(manager.smartMerge([], [])).toEqual([])
        expect(manager.smartMerge([{ id: '1' }], null)).toHaveLength(1)
    })
})

describe('updateRecordCount', () => {
    it('미완료 있으면 건수+미완료 표시', () => {
        const manager = createManager()
        const el = document.createElement('span')
        manager.recordCountEl = el
        manager.sampleLogs = [
            { isComplete: true },
            { isComplete: false },
            { isComplete: false }
        ]
        manager.updateRecordCount()
        expect(el.textContent).toBe('3건 (미완료 2건)')
    })

    it('전원 완료면 "총 N건"', () => {
        const manager = createManager()
        const el = document.createElement('span')
        manager.recordCountEl = el
        manager.sampleLogs = [{ isComplete: true }, { isComplete: true }]
        manager.updateRecordCount()
        expect(el.textContent).toBe('총 2건')
    })

    it('빈 목록이면 "총 0건"', () => {
        const manager = createManager()
        const el = document.createElement('span')
        manager.recordCountEl = el
        manager.sampleLogs = []
        manager.updateRecordCount()
        expect(el.textContent).toBe('총 0건')
    })
})

describe('notifyReceptionConflicts — 병합 충돌을 알린다 (SAMPL-1-166)', () => {
    let manager
    let toasts

    beforeEach(() => {
        manager = createManager()
        toasts = []
        manager.showToast = (msg, type) => toasts.push({ msg, type })
    })

    // 🚨 담당자 데이터에서 3종 6건이 몇 달간 아무도 모른 채 있었다.
    //    병합이 id 기준이라 번호 충돌을 조용히 통과시켰기 때문이다.
    it('충돌을 담당자에게 알린다', () => {
        manager.notifyReceptionConflicts([
            { landClass1: '농가의뢰', receptionNumber: '328', ids: ['a', 'b'] },
        ])
        expect(toasts).toHaveLength(1)
        expect(toasts[0].msg).toContain('농가의뢰 328')
        expect(toasts[0].type).toBe('warning')
        // 다음에 무엇을 할지도 알려야 한다
        expect(toasts[0].msg).toContain('접수번호 정합성 점검')
    })

    // ⚠️ 병합은 화면을 열 때마다 일어난다. 매번 띄우면 담당자가 곧 무시하게 되고,
    //    그러면 알림이 없는 것과 같아진다.
    it('같은 충돌을 반복해서 띄우지 않는다', () => {
        const c = [{ landClass1: '농가의뢰', receptionNumber: '328', ids: ['a', 'b'] }]
        manager.notifyReceptionConflicts(c)
        manager.notifyReceptionConflicts(c)
        manager.notifyReceptionConflicts(c)
        expect(toasts).toHaveLength(1)
    })

    it('새 충돌은 다시 알린다', () => {
        manager.notifyReceptionConflicts([{ landClass1: '농가의뢰', receptionNumber: '328', ids: ['a', 'b'] }])
        manager.notifyReceptionConflicts([{ landClass1: '농가의뢰', receptionNumber: '329', ids: ['c', 'd'] }])
        expect(toasts).toHaveLength(2)
        expect(toasts[1].msg).toContain('329')
    })

    it('충돌이 없으면 아무 말도 하지 않는다 (과잉알림 방지)', () => {
        manager.notifyReceptionConflicts([])
        manager.notifyReceptionConflicts(undefined)
        manager.notifyReceptionConflicts(null)
        expect(toasts).toEqual([])
    })

    it('많으면 앞의 셋만 적고 나머지 수를 알린다', () => {
        manager.notifyReceptionConflicts([
            { landClass1: '농가의뢰', receptionNumber: '1', ids: ['a', 'b'] },
            { landClass1: '농가의뢰', receptionNumber: '2', ids: ['c', 'd'] },
            { landClass1: '농가의뢰', receptionNumber: '3', ids: ['e', 'f'] },
            { landClass1: '농가의뢰', receptionNumber: '4', ids: ['g', 'h'] },
            { landClass1: '농가의뢰', receptionNumber: '5', ids: ['i', 'j'] },
        ])
        expect(toasts[0].msg).toContain('외 2종')
        expect(toasts[0].msg).not.toContain('농가의뢰 4')
    })
})

describe('notifyReceptionConflicts — 재발을 놓치지 않는다 (독립 리뷰 MAJOR)', () => {
    let manager
    let toasts

    beforeEach(() => {
        manager = createManager()
        toasts = []
        manager.showToast = (msg, type) => toasts.push({ msg, type })
    })

    // 🚨 억제 키가 `경지구분/번호`뿐이면, 담당자가 고친 뒤 **다른 레코드가 같은
    //    번호로 다시 겹쳐도** 같은 키라 영원히 침묵한다. 재발을 놓치는 것이
    //    이 기능이 막으려는 바로 그 실패다.
    it('같은 번호라도 겹친 레코드가 달라지면 다시 알린다', () => {
        manager.notifyReceptionConflicts([
            { landClass1: '농가의뢰', receptionNumber: '328', ids: ['A', 'B'] },
        ])
        // 담당자가 B를 고쳤고, 나중에 다른 기기의 C가 같은 번호로 들어왔다
        manager.notifyReceptionConflicts([
            { landClass1: '농가의뢰', receptionNumber: '328', ids: ['A', 'C'] },
        ])
        expect(toasts).toHaveLength(2)
    })

    it('완전히 같은 충돌은 여전히 한 번만 알린다', () => {
        const c = [{ landClass1: '농가의뢰', receptionNumber: '328', ids: ['A', 'B'] }]
        manager.notifyReceptionConflicts(c)
        manager.notifyReceptionConflicts(c)
        expect(toasts).toHaveLength(1)
    })

    it('id 순서가 달라도 같은 충돌로 본다 (병합 순서에 흔들리지 않는다)', () => {
        manager.notifyReceptionConflicts([{ landClass1: '농가의뢰', receptionNumber: '328', ids: ['A', 'B'] }])
        manager.notifyReceptionConflicts([{ landClass1: '농가의뢰', receptionNumber: '328', ids: ['B', 'A'] }])
        expect(toasts).toHaveLength(1)
    })
})
