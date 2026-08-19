// @ts-check
import { describe, it, expect, beforeAll } from 'vitest'

// SAMPL-1-158: 흙토람 미리보기 표 구성 (순수 로직)
//
// 셀 하나가 한 줄이던 미리보기를 시료 한 건이 한 줄인 표로 묶는다.
// 이 파일이 지키는 계약은 두 가지다.
//   1) 화면이 보여주는 값이 저장될 값과 같아야 한다 (중복 필드 처리)
//   2) 열 집합·순서가 데이터에 따라 흔들리지 않아야 한다 (skipEmpty 구멍)

/** @type {any} */
let PT

beforeAll(async () => {
    // 전역 IIFE 모듈 — window에 붙는다
    // @ts-ignore
    globalThis.window = globalThis.window || {}
    // @ts-ignore - 전역 IIFE 스크립트라 export가 없다(TS2306). 부수효과만 필요하다.
    await import('../../src/heuktoram/preview-table.js')
    // @ts-ignore
    PT = globalThis.window.PreviewTable
})

/** 셀 하나 만들기 */
function cell(sampleNumber, field, newValue, extra = {}) {
    return {
        rowKey: 'k' + sampleNumber,
        sampleNumber: String(sampleNumber),
        field,
        oldValue: '',
        newValue: String(newValue),
        hasConflict: false,
        willApply: true,
        rangeWarning: null,
        ...extra,
    }
}

const FIELDS = ['ph', 'om', 'p2o5']

describe('buildTable — 묶기', () => {
    it('시료 한 건이 한 줄이 된다', () => {
        const t = PT.buildTable(
            [cell(1, 'ph', 5.3), cell(1, 'om', 29), cell(2, 'ph', 6.1)],
            FIELDS
        )
        expect(t.rows.length).toBe(2)
        expect(t.rows[0].sampleNumber).toBe('1')
        expect(t.rows[0].cells.ph.newValue).toBe('5.3')
        expect(t.rows[0].cells.om.newValue).toBe('29')
    })

    it('셀이 없는 칸은 비어 있다 — 없는 값을 지어내지 않는다', () => {
        const t = PT.buildTable([cell(1, 'ph', 5.3), cell(2, 'om', 31)], FIELDS)
        const row1 = t.rows.find((r) => r.sampleNumber === '1')
        expect(row1.cells.om).toBeUndefined()
    })

    it('빈 입력에서도 터지지 않는다', () => {
        for (const bad of [[], null, undefined]) {
            const t = PT.buildTable(bad, FIELDS)
            expect(t.rows).toEqual([])
            expect(t.totalRows).toBe(0)
            expect(t.truncated).toBe(false)
        }
    })

    // 🚨 이 계약이 깨지면 "본 것과 저장된 것"이 어긋난다.
    //    _commit은 `if (!m.willApply) continue;` 뒤에 apply()하므로
    //    **최종값은 willApply인 것 중 마지막**이다. 표도 정확히 그것을 보여야 한다.
    it('같은 시료·같은 필드가 두 번 오면 뒤엣것이 이긴다 (저장 결과와 일치)', () => {
        const t = PT.buildTable([cell(1, 'ph', 5.3), cell(1, 'ph', 6.9)], FIELDS)
        expect(t.rows[0].cells.ph.newValue).toBe('6.9')
    })

    // 🚨 독립 모델 리뷰가 찾은 결함.
    //    충돌 정책이 skip/fillBlank면 뒤엣것이 willApply=false가 된다.
    //    그때 무조건 뒤엣것을 보여주면 화면은 6.9(취소선), 실제 저장은 5.3이 된다.
    it('뒤엣것이 건너뛰기면 실제로 적용될 앞엣것을 보여준다', () => {
        const t = PT.buildTable(
            [cell(1, 'ph', 5.3), cell(1, 'ph', 6.9, { willApply: false, hasConflict: true })],
            FIELDS
        )
        expect(t.rows[0].cells.ph.newValue, '저장은 5.3인데 화면은 6.9를 보여준다').toBe('5.3')
        expect(t.rows[0].cells.ph.willApply).toBe(true)
    })

    it('전부 건너뛰기면 마지막 것을 건너뜀 표시로 보여준다', () => {
        const t = PT.buildTable(
            [
                cell(1, 'ph', 5.3, { willApply: false }),
                cell(1, 'ph', 6.9, { willApply: false }),
            ],
            FIELDS
        )
        expect(t.rows[0].cells.ph.newValue).toBe('6.9')
        expect(t.rows[0].cells.ph.willApply).toBe(false)
    })
})

describe('buildTable — 중복 알리기', () => {
    // 표는 (시료,필드)를 한 칸으로 합치므로 "N셀 저장 예정"과 칸 수가 어긋난다.
    // 합쳐서 사라진 값이 몇 개인지 알려주지 않으면 사용자는 화면에서 그 수를 찾다 만다.
    it('덮어쓴 셀 수를 보고한다', () => {
        const t = PT.buildTable(
            [cell(1, 'ph', 5.3), cell(1, 'ph', 6.9), cell(2, 'ph', 7.0)],
            FIELDS
        )
        expect(t.overwritten).toBe(1)
    })

    it('중복이 없으면 0이다', () => {
        const t = PT.buildTable([cell(1, 'ph', 5.3), cell(2, 'ph', 6.1)], FIELDS)
        expect(t.overwritten).toBe(0)
    })
})

describe('buildTable — 열', () => {
    it('열 순서는 데이터가 아니라 선언한 매핑 순서를 따른다', () => {
        // 데이터는 p2o5 → ph → om 순으로 들어오지만 선언은 ph → om → p2o5
        const t = PT.buildTable(
            [cell(1, 'p2o5', 234), cell(1, 'ph', 5.3), cell(1, 'om', 29)],
            FIELDS
        )
        expect(t.columns).toEqual(['ph', 'om', 'p2o5'])
    })

    // skipEmpty가 켜져 있으면 전부 빈 필드는 matched에 아예 안 들어온다.
    // 그 필드까지 열로 세우면 항상 빈 열이 남는다.
    it('값이 하나도 없는 필드는 열에서 빠진다', () => {
        const t = PT.buildTable([cell(1, 'ph', 5.3), cell(2, 'ph', 6.1)], FIELDS)
        expect(t.columns).toEqual(['ph'])
    })

    // 매핑을 바꾸는 도중 등 선언에 없는 필드가 섞일 수 있다. 조용히 버리면
    // 저장은 되는데 미리보기에는 안 보이는 값이 생긴다 — 가장 나쁜 경우다.
    it('선언에 없는 필드도 잃지 않고 뒤에 붙는다', () => {
        const t = PT.buildTable([cell(1, 'ph', 5.3), cell(1, 'unknown', 7)], FIELDS)
        expect(t.columns).toEqual(['ph', 'unknown'])
    })

    it('fields 인자가 없어도 데이터에서 열을 만든다', () => {
        const t = PT.buildTable([cell(1, 'ph', 5.3)], null)
        expect(t.columns).toEqual(['ph'])
    })
})

describe('buildTable — 정렬', () => {
    it('충돌·범위초과가 있는 시료가 위로 온다', () => {
        const t = PT.buildTable(
            [
                cell(1, 'ph', 5.3),
                cell(2, 'ph', 6.1, { hasConflict: true, oldValue: '5.9' }),
                cell(3, 'ph', 9.9, { rangeWarning: '범위 초과' }),
            ],
            FIELDS
        )
        // 충돌(2점) > 범위경고(1점) > 없음(0점)
        expect(t.rows.map((r) => r.sampleNumber)).toEqual(['2', '3', '1'])
    })

    it('점수가 같으면 엑셀에 나온 순서를 유지한다 (안정 정렬)', () => {
        const t = PT.buildTable(
            [cell(7, 'ph', 5), cell(3, 'ph', 5), cell(9, 'ph', 5)],
            FIELDS
        )
        expect(t.rows.map((r) => r.sampleNumber)).toEqual(['7', '3', '9'])
    })

    it('rowScore는 한 시료 안의 셀 점수를 합산한다', () => {
        expect(PT.rowScore([{ hasConflict: true }, { rangeWarning: 'x' }])).toBe(3)
        expect(PT.rowScore([])).toBe(0)
        expect(PT.rowScore([null, undefined])).toBe(0)
    })
})

describe('buildTable — 상한', () => {
    // 🚨 이 티켓의 핵심. 상한이 **셀**이 아니라 **시료**를 세어야 한다.
    it('상한은 셀이 아니라 시료 수를 센다', () => {
        // 시료 10건 × 필드 3개 = 셀 30개. 셀 기준이라면 잘려야 하지만 시료 기준이면 다 들어온다
        const many = []
        for (let i = 1; i <= 10; i++) {
            for (const f of FIELDS) many.push(cell(i, f, i))
        }
        const t = PT.buildTable(many, FIELDS, { rowLimit: 10 })
        expect(t.rows.length).toBe(10)
        expect(t.truncated).toBe(false)
    })

    it('상한을 넘으면 자르고 총계를 그대로 보고한다', () => {
        const many = []
        for (let i = 1; i <= 12; i++) many.push(cell(i, 'ph', i))
        const t = PT.buildTable(many, FIELDS, { rowLimit: 10 })
        expect(t.rows.length).toBe(10)
        expect(t.totalRows).toBe(12)   // 자르기 **전** 값이어야 한다
        expect(t.truncated).toBe(true)
    })

    it('기본 상한은 50건이다', () => {
        expect(PT.DEFAULT_ROW_LIMIT).toBe(50)
        const many = []
        for (let i = 1; i <= 60; i++) many.push(cell(i, 'ph', i))
        const t = PT.buildTable(many, FIELDS)
        expect(t.rows.length).toBe(50)
        expect(t.totalRows).toBe(60)
    })
})
