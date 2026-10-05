import { describe, it, expect, beforeAll } from 'vitest'

// SAMPL-1-182: numberScopeFilter가 **없으면** 범위를 거르지 않는다(수질·퇴비 등 다른 타입의 기존 동작).
// 필터가 모든 타입에 적용되는 변이(`_scoped`가 설정과 무관하게 거름)를 이 테스트가 잡는다.
beforeAll(async () => {
    await import('../../src/shared/excel-import-manager.js')
})

const existing = [
    { receptionNumber: '5', landClass1: '공익직불제' },
    { receptionNumber: '8', landClass1: '공익직불제' },
]
const onlyFarm = (log) => (log.landClass1 || '농가의뢰') === '농가의뢰'

function build(extra) {
    const m = new window.ExcelImportManager({ getExistingLogs: () => existing, ...extra })
    m._parsedLogs = [{ receptionNumber: '5' }]
    return m
}

describe('numberScopeFilter 유무에 따른 범위', () => {
    it('필터 없음: 공익직불제 5가 풀에 들어가 시트 5가 중복으로 잡힌다', () => {
        const m = build({})
        m._detectDuplicateNumbers()
        expect(m._dupNumbers).toEqual(['5'])
    })
    it('필터 있음(대조군): 공익직불제 5는 풀에서 빠져 시트 5는 중복이 아니다', () => {
        const m = build({ numberScopeFilter: onlyFarm })
        m._detectDuplicateNumbers()
        expect(m._dupNumbers).toEqual([])
    })
    it('필터 없음: 자동 부여가 범위 밖 최대값(8)을 넘겨 9부터 준다', () => {
        const m = build({})
        m._parsedLogs = [{ receptionNumber: '' }]
        m._autoAssignReceptionNumbers()
        expect(m._parsedLogs[0].receptionNumber).toBe('9')
    })
    it('필터 있음(대조군): 범위 밖 번호를 무시해 1부터 준다', () => {
        const m = build({ numberScopeFilter: onlyFarm })
        m._parsedLogs = [{ receptionNumber: '' }]
        m._autoAssignReceptionNumbers()
        expect(m._parsedLogs[0].receptionNumber).toBe('1')
    })
})
