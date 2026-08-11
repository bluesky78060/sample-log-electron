import { describe, it, expect, beforeAll } from 'vitest'

// soil-result-importer.js를 import → window.SoilResultImporter 노출 (IIFE, jsdom 환경)
// 테스트 대상: 엑셀 컬럼 헤더 → 접수 필드 자동 매핑 순수 로직 (SAMPL-1-85)
//   instance._fns = { normalizeHeader, scoreFieldHeader, computeAutoMapping, auditDuplicateKeywords }
beforeAll(async () => {
    await import('../../src/soil/soil-result-importer.js')
})

const fns = () => window.SoilResultImporter._fns
const map = (headers) => fns().computeAutoMapping(headers)
const norm = (s) => fns().normalizeHeader(s)

describe('normalizeHeader — 헤더 정규화', () => {
    it('공백·구분기호·괄호·㎡ 제거 + 소문자화', () => {
        expect(norm('전화 번호')).toBe('전화번호')
        expect(norm('전화-번호')).toBe('전화번호')
        expect(norm('주소(도로명)')).toBe('주소도로명')
        expect(norm('면적㎡')).toBe('면적')
        expect(norm('  No.  ')).toBe('no')
    })
    it('null/undefined → 빈 문자열', () => {
        expect(norm(null)).toBe('')
        expect(norm(undefined)).toBe('')
    })
})

describe('computeAutoMapping — 한글 표준 헤더', () => {
    it('대표적인 헤더 세트를 올바른 필드로 매핑', () => {
        const m = map(['접수번호', '성명', '연락처', '지번주소', '작물', '면적', '구분', '목적', '비고'])
        expect(m.receptionNumber).toBe(0)
        expect(m.name).toBe(1)
        expect(m.phoneNumber).toBe(2)
        expect(m.lotAddress).toBe(3)
        expect(m.cropsDisplay).toBe(4)
        expect(m.area).toBe(5)
        expect(m.subCategory).toBe(6)
        expect(m.purpose).toBe(7)
        expect(m.note).toBe(8)
    })

    it('기관별 동의어 변형도 인식 (의뢰인/휴대폰/소재지/재배작물 등)', () => {
        const m = map(['의뢰인', '휴대폰번호', '소재지', '재배작물', '재배면적'])
        expect(m.name).toBe(0)
        expect(m.phoneNumber).toBe(1)
        expect(m.lotAddress).toBe(2)
        expect(m.cropsDisplay).toBe(3)
        expect(m.area).toBe(4)
    })
})

describe('computeAutoMapping — 영문 헤더', () => {
    it('영문 컬럼명 인식', () => {
        const m = map(['name', 'phone', 'address', 'crop', 'area'])
        expect(m.name).toBe(0)
        expect(m.phoneNumber).toBe(1)
        expect(m.lotAddress).toBe(2)
        expect(m.cropsDisplay).toBe(3)
        expect(m.area).toBe(4)
    })

    it('2글자 영문 키워드(no)는 완전일치만 — 무관 헤더에 과매칭 안 함', () => {
        // 'note'는 'no'를 부분포함하지만 영문 2글자는 완전일치 전용 → receptionNumber로 잘못 안 감
        const m = map(['note'])
        expect(m.note).toBe(0)
        expect(m.receptionNumber).toBeUndefined()
    })
})

describe('computeAutoMapping — 충돌·우선순위·중복 컬럼', () => {
    it('각 필드·컬럼은 1회만 할당 (1:1 greedy)', () => {
        const m = map(['성명', '성명'])
        // 두 컬럼 모두 name 후보지만 name은 한 컬럼에만 할당
        const assignedCols = Object.values(m)
        expect(new Set(assignedCols).size).toBe(assignedCols.length)
        expect(m.name).toBe(0) // 동점 시 앞 컬럼 우선
    })

    it('완전일치가 부분일치보다 우선 (EXACT > INCLUDE)', () => {
        // '접수번호'(name 후보 아님) vs '번호' — 둘 다 receptionNumber 후보
        const m = map(['접수번호', '관리번호'])
        expect(m.receptionNumber).toBe(0) // '접수번호' 완전일치 우선
    })

    it('매칭 없는 헤더는 미할당', () => {
        const m = map(['알수없는컬럼', 'xyz'])
        expect(Object.keys(m).length).toBe(0)
    })

    it('빈 헤더 배열 → 빈 매핑', () => {
        expect(map([])).toEqual({})
        expect(map(['', '', ''])).toEqual({})
    })
})

describe('computeAutoMapping — 공익직불제(선택) 필드', () => {
    it('경영체등록번호·접수일자 인식', () => {
        const m = map(['경영체등록번호', '접수일자'])
        expect(m.businessRegNo).toBe(0)
        expect(m.date).toBe(1)
    })
})

describe('auditDuplicateKeywords — 교차 필드 중복 키워드 점검', () => {
    it('배열을 반환 (정의상 중복 0건이 바람직)', () => {
        const dups = fns().auditDuplicateKeywords()
        expect(Array.isArray(dups)).toBe(true)
    })
})

// ============================================================
// 접수번호 채번 (SAMPL-1-153)
//
// 이 계층은 결함이 새어나간 뒤에야 테스트가 생겼다. 성토(subCategory='성토')는
// 'F' 접두의 별 시퀀스인데 가져오기 경로가 일반 채번만 써서, 성토 행 전부가
// 같은 번호로 저장되고 이후 일반 자동채번이 1번에 고정됐다.
// ============================================================

const collect = (logs, cls, opts) => fns().collectExistingNumbers(logs, cls, opts)
const preview = (o) => fns().computePreview(o)

// 표준 매핑: 접수번호 0 / 성명 1 / 지번주소 2
const MAP = { receptionNumber: 0, name: 1, lotAddress: 2 }
// 성토 판정용: 성명 0 / 지번주소 1 / 구분 2
const MAP_FILL = { name: 0, lotAddress: 1, subCategory: 2 }

describe('collectExistingNumbers — 일반 시퀀스', () => {
    const logs = [
        { receptionNumber: '5', landClass1: '농가의뢰' },
        { receptionNumber: '6-1', landClass1: '농가의뢰' },        // 서브넘버 → 본번으로 접힘
        { receptionNumber: '7', landClass1: '공익직불제' },         // 다른 경지구분 → 제외
        { receptionNumber: '8', landClass1: '농가의뢰', subCategory: '성토' }, // 성토 → 제외
        { receptionNumber: 'F9', landClass1: '농가의뢰' },          // F 접두 → 제외
        { receptionNumber: 10, landClass1: '농가의뢰' },            // 숫자형도 처리
    ]

    it('같은 경지구분1차만 모으고 서브넘버는 본번으로 접는다', () => {
        expect([...collect(logs, '농가의뢰')].sort()).toEqual(['10', '5', '6'])
    })

    it('성토·F접두를 제외한다 (computeNextNumber와 동일 조건)', () => {
        const s = collect(logs, '농가의뢰')
        expect(s.has('8')).toBe(false)
        expect(s.has('F9')).toBe(false)
        expect(s.has('9')).toBe(false)
    })

    it('landClass1이 없으면 기본값(농가의뢰)으로 간주', () => {
        expect(collect([{ receptionNumber: '3' }], '농가의뢰').has('3')).toBe(true)
    })

    it('빈 입력·접수번호 없는 레코드', () => {
        expect(collect([], '농가의뢰').size).toBe(0)
        expect(collect(null, '농가의뢰').size).toBe(0)
        expect(collect([{ receptionNumber: '' }, {}], '농가의뢰').size).toBe(0)
    })
})

describe('collectExistingNumbers — 성토 시퀀스', () => {
    const logs = [
        { receptionNumber: '5', landClass1: '농가의뢰' },
        { receptionNumber: 'F2', landClass1: '농가의뢰', subCategory: '성토' },
        { receptionNumber: 'F7-1', landClass1: '농가의뢰', subCategory: '성토' },
        { receptionNumber: '3', landClass1: '농가의뢰', subCategory: '성토' }, // F 없는 성토
        { receptionNumber: 'F9', landClass1: '공익직불제', subCategory: '성토' },
    ]

    it('fill=true면 성토만 모으고 F를 떼서 숫자로 넣는다', () => {
        expect([...collect(logs, '농가의뢰', { fill: true })].sort()).toEqual(['2', '3', '7'])
    })

    it('두 시퀀스가 서로를 제외한다', () => {
        expect([...collect(logs, '농가의뢰')]).toEqual(['5'])
        expect(collect(logs, '농가의뢰', { fill: true }).has('5')).toBe(false)
    })

    it('경지구분 범위는 성토에도 적용된다', () => {
        expect([...collect(logs, '공익직불제', { fill: true })]).toEqual(['9'])
    })
})

describe('computePreview — 미리보기를 만들 수 없는 조건', () => {
    it('행 없음 / 매핑 없음 / 식별 필드 미매핑 → null', () => {
        expect(preview({ rows: [], mapping: MAP })).toBeNull()
        expect(preview({ rows: [['1', 'A', '주소']], mapping: {} })).toBeNull()
        expect(preview({ rows: [['벼', '1000']], mapping: { cropsDisplay: 0, area: 1 } })).toBeNull()
    })

    it('성명만 매핑돼도 만들어진다', () => {
        expect(preview({ rows: [['홍길동']], mapping: { name: 0 } })).not.toBeNull()
    })
})

describe('computePreview — 성토(F) 시퀀스 채번', () => {
    it('구분=성토 행은 F 접두로 채번되고 번호가 전진한다 (SAMPL-1-153 회귀)', () => {
        const r = preview({
            rows: [['A', '주소1', '성토'], ['B', '주소2', '성토'], ['C', '주소3', '성토']],
            mapping: MAP_FILL, nextFillNumber: 1,
        })
        // 수정 전에는 1, 1, 1로 저장돼 유일성이 깨졌다
        expect(r.items.map(i => i.display)).toEqual(['F1', 'F2', 'F3'])
        expect(new Set(r.items.map(i => i.display)).size).toBe(3)
    })

    it('일반과 성토가 섞이면 각자의 시퀀스로 채번된다', () => {
        const r = preview({
            rows: [['A', '주소1', '논'], ['B', '주소2', '성토'], ['C', '주소3', '밭'], ['D', '주소4', '성토']],
            mapping: MAP_FILL, nextNumber: 10, nextFillNumber: 3,
        })
        expect(r.items.map(i => i.display)).toEqual(['10', 'F3', '11', 'F4'])
    })

    it('성토 커서는 기존 성토 번호를 건너뛴다', () => {
        const r = preview({
            rows: [['A', '주소1', '성토'], ['B', '주소2', '성토']],
            mapping: MAP_FILL, existingFill: new Set(['3', '4']), nextFillNumber: 3,
        })
        expect(r.items.map(i => i.display)).toEqual(['F5', 'F6'])
    })

    it('일반 5와 성토 F5는 충돌이 아니다', () => {
        const r = preview({
            rows: [['A', '주소1', '논'], ['B', '주소2', '성토']],
            mapping: MAP_FILL,
            existing: new Set(['4']), nextNumber: 5,
            existingFill: new Set(['4']), nextFillNumber: 5,
        })
        expect(r.items.map(i => i.display)).toEqual(['5', 'F5'])
        expect(r.stats.dup).toBe(0)
    })

    it('성토 수동 번호는 성토 풀로 중복 판정한다', () => {
        const r = preview({
            rows: [['F3', 'A', '주소', '성토'], ['F9', 'B', '주소', '성토']],
            mapping: { receptionNumber: 0, name: 1, lotAddress: 2, subCategory: 3 },
            existing: new Set(['3']),      // 일반 3은 성토 판정에 영향 없어야 한다
            existingFill: new Set(['3']),
        })
        expect(r.items[0].status).toBe('dup')
        expect(r.items[1].status).toBe('new')
    })

    it('성토 수동 번호가 저장되면 성토 커서만 올라간다', () => {
        const r = preview({
            rows: [['F50', 'A', '주소', '성토'], ['', 'B', '주소', '성토'], ['', 'C', '주소', '논']],
            mapping: { receptionNumber: 0, name: 1, lotAddress: 2, subCategory: 3 },
            nextNumber: 7, nextFillNumber: 2,
        })
        expect(r.items[1].display).toBe('F51')  // 성토 커서 상향
        expect(r.items[2].display).toBe('7')    // 일반 커서는 그대로
    })

    it('자동부여 행의 rec에는 receptionNumber를 넣지 않는다 (매니저가 채번한다)', () => {
        const r = preview({ rows: [['A', '주소', '성토']], mapping: MAP_FILL, nextFillNumber: 4 })
        expect(r.items[0].display).toBe('F4')
        expect(r.items[0].auto).toBe(true)
        expect(r.items[0].rec.receptionNumber).toBeUndefined()
        expect(r.items[0].rec.subCategory).toBe('성토')
    })
})

describe('computePreview — 수동 번호와 자동부여가 섞인 배치', () => {
    // 매니저 addImportedRecord는 레코드마다 max+1로 다시 채번한다.
    // 수동 번호가 먼저 저장되면 뒤따르는 자동부여 번호가 그 위로 올라간다.
    it('수동 번호가 기존 최대값보다 크면 이후 자동부여가 그 위에서 이어진다', () => {
        const r = preview({
            rows: [['50', 'A', '주소'], ['', 'B', '주소']],
            mapping: MAP, existing: new Set(['10']), nextNumber: 11,
        })
        expect(r.items.map(i => i.display)).toEqual(['50', '51'])
    })

    it('건너뛰는 중복 행은 저장되지 않으므로 커서를 올리지 않는다', () => {
        const r = preview({
            rows: [['80', 'A', '주소'], ['', 'B', '주소']],
            mapping: MAP, existing: new Set(['10', '80']), nextNumber: 11, dupPolicy: 'skip',
        })
        expect(r.items[0].skip).toBe(true)
        expect(r.items[1].display).toBe('11')
    })

    it('덮어쓰기 정책의 중복 행은 저장되므로 커서를 올린다', () => {
        const r = preview({
            rows: [['80', 'A', '주소'], ['', 'B', '주소']],
            mapping: MAP, existing: new Set(['10', '80']), nextNumber: 11, dupPolicy: 'overwrite',
        })
        expect(r.items[0].skip).toBe(false)
        expect(r.items[1].display).toBe('81')
    })

    it("빈 칸 자동부여가 문자열 'null'을 만들지 않는다 (SAMPL-1-151 회귀)", () => {
        // 커서 초기화를 autoAll로 감싸면 String(null) → 'null'이 된다
        const r = preview({
            rows: [['', 'A', '주소'], ['', 'B', '주소']],
            mapping: MAP, existing: new Set(['1', '2']),
        })
        expect(r.items.map(i => i.display)).toEqual(['3', '4'])
        expect(r.items.some(i => i.display === 'null')).toBe(false)
    })
})

describe('computePreview — 오류 행과 집계', () => {
    it('성명·주소 모두 비면 err이고 커서에 영향이 없다', () => {
        const r = preview({
            rows: [['', '', ''], ['', 'B', '주소']],
            mapping: MAP, existing: new Set(['10']), nextNumber: 11,
        })
        expect(r.items[0].status).toBe('err')
        expect(r.items[0].reason).toBe('성명·주소 없음')
        expect(r.items[1].display).toBe('11')
    })

    it('stats와 willImport가 맞물린다 (new + 덮어쓰기 dup)', () => {
        const r = preview({
            rows: [['5', 'A', '주소'], ['9', 'B', '주소'], ['', '', '']],
            mapping: MAP, existing: new Set(['5']), dupPolicy: 'overwrite',
        })
        expect(r.stats).toEqual({ total: 3, new: 1, dup: 1, err: 1 })
        expect(r.willImport).toBe(2)
    })

    it('landClass1이 모든 행에 일괄 적용된다', () => {
        const r = preview({ rows: [['A'], ['B']], mapping: { name: 0 }, landClass1: '공익직불제' })
        expect(r.landClass1).toBe('공익직불제')
        expect(r.items.every(i => i.rec.landClass1 === '공익직불제')).toBe(true)
    })
})
