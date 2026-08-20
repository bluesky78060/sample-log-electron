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

    it('성토 수동 번호는 표기 그대로 중복 판정한다', () => {
        // 기존 F3(성토)과 일반 3이 함께 있는 대장. 수동 F3은 F3과 충돌하고,
        // F9는 어느 표기와도 겹치지 않는다. 일반 3은 F3과 다른 표기다.
        const r = preview({
            rows: [['F3', 'A', '주소', '성토'], ['F9', 'B', '주소', '성토']],
            mapping: { receptionNumber: 0, name: 1, lotAddress: 2, subCategory: 3 },
            logs: [
                { receptionNumber: 'F3', subCategory: '성토', landClass1: '농가의뢰' },
                { receptionNumber: '3', subCategory: '논', landClass1: '농가의뢰' },
            ],
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
            mapping: MAP, nextNumber: 11, dupPolicy: 'skip',
            logs: [{ receptionNumber: '10' }, { receptionNumber: '80' }],
        })
        expect(r.items[0].skip).toBe(true)
        expect(r.items[1].display).toBe('11')
    })

    it('덮어쓰기 정책의 중복 행은 저장되므로 커서를 올린다', () => {
        const r = preview({
            rows: [['80', 'A', '주소'], ['', 'B', '주소']],
            mapping: MAP, nextNumber: 11, dupPolicy: 'overwrite',
            logs: [{ receptionNumber: '10' }, { receptionNumber: '80' }],
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
            mapping: MAP, dupPolicy: 'overwrite',
            logs: [{ receptionNumber: '5' }],
        })
        // `sub`는 SAMPL-1-154에서 추가된 집계다 — 하위필지로 선두 행에 접힌 행 수.
        // toEqual로 두어 새 키가 조용히 늘어나면 여기서 잡히게 한다.
        expect(r.stats).toEqual({ total: 3, new: 1, dup: 1, err: 1, sub: 0 })
        expect(r.willImport).toBe(2)
    })

    it('landClass1이 모든 행에 일괄 적용된다', () => {
        const r = preview({ rows: [['A'], ['B']], mapping: { name: 0 }, landClass1: '공익직불제' })
        expect(r.landClass1).toBe('공익직불제')
        expect(r.items.every(i => i.rec.landClass1 === '공익직불제')).toBe(true)
    })
})

describe('computePreview — 수동 번호 중복은 시퀀스 무관·표기 그대로 (SAMPL-1-153 리뷰 회귀)', () => {
    // 순수화 과정에서 중복 판정 풀을 시퀀스별로 나눴다가, 구분='성토' 행의 수동 번호가
    // 일반 번호와 충돌하는 것을 놓쳐 같은 번호가 두 건 저장되는 회귀를 만들었다.
    // 폼 등록 경로(soil-script.js)는 `logBaseNumber === numToCheck`로 subCategory와
    // 무관하게 비교한다 — 그것이 이 앱의 확립된 규칙이다.
    const collectLit = (logs, cls) => fns().collectLiteralNumbers(logs, cls)
    const MAP_FULL = { receptionNumber: 0, name: 1, lotAddress: 2, subCategory: 3 }

    // 프로덕션과 같은 경로로 넘긴다 — `logs`를 주면 computePreview가 세 풀을 도출한다.
    // 풀을 직접 주입하면 "호출부가 풀을 빠뜨리는" 형태의 회귀를 이 테스트가 놓친다.
    const withPools = (logs, rows, opts = {}) => preview({
        rows, mapping: MAP_FULL, landClass1: '농가의뢰', dupPolicy: opts.dupPolicy || 'skip',
        logs,
        nextNumber: opts.nextNumber ?? 1,
        nextFillNumber: opts.nextFillNumber ?? 1,
    })

    it('성토 행의 F 없는 수동 번호가 기존 일반 번호와 충돌하면 dup', () => {
        const logs = [
            { receptionNumber: '1', subCategory: '논', landClass1: '농가의뢰' },
            { receptionNumber: '2', subCategory: '논', landClass1: '농가의뢰' },
            { receptionNumber: '3', subCategory: '논', landClass1: '농가의뢰' },
        ]
        const r = withPools(logs, [
            ['1', 'A', '주소', '성토'], ['2', 'B', '주소', '성토'], ['3', 'C', '주소', '성토'],
        ], { nextNumber: 4 })
        expect(r.items.map(i => i.status)).toEqual(['dup', 'dup', 'dup'])
        expect(r.willImport).toBe(0)   // 기본 정책(skip)에서 한 건도 등록되지 않는다
    })

    it('배치 내부에서도 시퀀스를 넘어 충돌을 잡는다', () => {
        const r = withPools([], [['1', 'A', '주소', '논'], ['1', 'B', '주소', '성토']])
        expect(r.items.map(i => i.status)).toEqual(['new', 'dup'])
    })

    it('F 접두 수동 번호도 기존 F 번호와 충돌하면 dup', () => {
        // 구 코드는 일반 풀에서 F 접두를 제외해 이 충돌을 구조적으로 놓쳤다
        const logs = [{ receptionNumber: 'F5', subCategory: '성토', landClass1: '농가의뢰' }]
        const r = withPools(logs, [['F5', 'A', '주소', '성토']], { nextFillNumber: 6 })
        expect(r.items[0].status).toBe('dup')
    })

    it('F5와 5는 표기가 달라 충돌하지 않는다 (과잉수정 방지)', () => {
        const logs = [{ receptionNumber: 'F5', subCategory: '성토', landClass1: '농가의뢰' }]
        const r = withPools(logs, [['5', 'A', '주소', '논']])
        expect(r.items[0].status).toBe('new')
    })

    it('자동부여한 번호와 뒤따르는 수동 번호가 충돌하면 dup', () => {
        const r = withPools([], [['', 'A', '주소', '논'], ['1', 'B', '주소', '논']])
        expect(r.items.map(i => i.status)).toEqual(['new', 'dup'])
    })

    it('성토 자동부여는 여전히 F 시퀀스를 쓴다 (본 수정 유지)', () => {
        const r = withPools([], [['', 'A', '주소', '성토'], ['', 'B', '주소', '성토'], ['', 'C', '주소', '논']])
        expect(r.items.map(i => i.display)).toEqual(['F1', 'F2', '1'])
    })

    it('경지구분 1차 범위를 넘어선 번호는 충돌이 아니다', () => {
        const logs = [{ receptionNumber: '5', subCategory: '논', landClass1: '공익직불제' }]
        const r = withPools(logs, [['5', 'A', '주소', '논']])
        expect(r.items[0].status).toBe('new')
    })
})

describe('collectLiteralNumbers', () => {
    const collectLit = (logs, cls) => fns().collectLiteralNumbers(logs, cls)

    it('표기를 그대로 보존하고 두 시퀀스를 통합한다', () => {
        const logs = [
            { receptionNumber: '5', subCategory: '논', landClass1: '농가의뢰' },
            { receptionNumber: 'F2', subCategory: '성토', landClass1: '농가의뢰' },
            { receptionNumber: '7', subCategory: '성토', landClass1: '농가의뢰' }, // F 없는 성토
        ]
        expect([...collectLit(logs, '농가의뢰')].sort()).toEqual(['5', '7', 'F2'])
    })

    // ⚠️ **계약이 바뀌었다** (SAMPL-1-154). 예전에는 서브넘버를 본번으로 접었고
    //    이 테스트가 그 동작을 고정하고 있었다 — 그런데 그것이 바로 결함이었다.
    //    저장된 `5-1`이 `5`로 들어가면 들어온 `5-2`가 그 `5`와 충돌해
    //    **정상 행이 "중복"으로 조용히 버려진다.**
    //    이 함수의 목적은 "수동 입력 번호를 표기 그대로 비교"하는 것이므로
    //    접지 않는 쪽이 원래 의도에 맞다.
    it('서브넘버를 접지 않고 표기 그대로 담으며 경지구분 범위를 지킨다', () => {
        const logs = [
            { receptionNumber: '5-1', landClass1: '농가의뢰' },
            { receptionNumber: '9', landClass1: '공익직불제' },
        ]
        expect([...collectLit(logs, '농가의뢰')]).toEqual(['5-1'])
    })

    it('landClass1 생략 시 기본값으로 폴백한다 (computeNextNumber와 동일)', () => {
        expect(collectLit([{ receptionNumber: '5' }], undefined).has('5')).toBe(true)
    })

    it('빈 입력·접수번호 없는 레코드', () => {
        expect(collectLit([], '농가의뢰').size).toBe(0)
        expect(collectLit(null, '농가의뢰').size).toBe(0)
        expect(collectLit([{ receptionNumber: '' }, {}], '농가의뢰').size).toBe(0)
    })
})

describe('computePreview — 저장되지 않는 행은 배치 집합에도 남지 않는다 (SAMPL-1-153 재리뷰 M-2)', () => {
    // 건너뛰는 중복 행의 번호가 배치 집합에 남으면, 뒤따르는 자동부여 행이 그 번호를
    // 피해 가면서 미리보기가 실제 저장 번호보다 앞서 나간다 (미리보기 ≠ 저장).
    const MAP_FULL = { receptionNumber: 0, name: 1, lotAddress: 2, subCategory: 3 }

    it('건너뛴 성토 중복 뒤의 자동부여가 매니저와 같은 번호를 보여준다', () => {
        // 대장: F1(성토) · 2(일반). 배치: 성토 수동 '2'(일반 2와 표기 충돌 → skip) + 성토 자동
        const r = preview({
            rows: [['2', 'A', '주소', '성토'], ['', 'B', '주소', '성토']],
            mapping: MAP_FULL, landClass1: '농가의뢰', dupPolicy: 'skip',
            logs: [
                { receptionNumber: 'F1', subCategory: '성토', landClass1: '농가의뢰' },
                { receptionNumber: '2', subCategory: '논', landClass1: '농가의뢰' },
            ],
            nextNumber: 3, nextFillNumber: 2,
        })
        expect(r.items[0].status).toBe('dup')
        expect(r.items[0].skip).toBe(true)
        // 행1이 저장되지 않으므로 매니저는 F2를 부여한다 (수정 전에는 F3을 보여줬다)
        expect(r.items[1].display).toBe('F2')
    })

    it('덮어쓰기 정책이면 저장되므로 배치 집합에 남는다', () => {
        const r = preview({
            rows: [['2', 'A', '주소', '논'], ['', 'B', '주소', '논']],
            mapping: MAP_FULL, landClass1: '농가의뢰', dupPolicy: 'overwrite',
            logs: [{ receptionNumber: '2', subCategory: '논', landClass1: '농가의뢰' }],
            nextNumber: 3,
        })
        expect(r.items[0].skip).toBe(false)
        expect(r.items[1].display).toBe('3')
    })

    it('logs가 배열이 아니면 경고하되 죽지 않는다', () => {
        const r = preview({
            rows: [['5', 'A', '주소', '논']], mapping: MAP_FULL,
            logs: { not: 'an array' }, nextNumber: 1,
        })
        expect(r).not.toBeNull()
        expect(r.items[0].status).toBe('new')
    })
})

describe('collectExistingNumbers — 기본 경지구분 폴백 (computeNextNumber와 대칭)', () => {
    it('landClass1 생략 시 기본값으로 폴백한다', () => {
        expect(collect([{ receptionNumber: '5' }], undefined).has('5')).toBe(true)
        expect(collect([{ receptionNumber: 'F5', subCategory: '성토' }], undefined, { fill: true }).has('5')).toBe(true)
    })
})

describe('computePreview — 서브넘버 행은 한 접수로 묶는다 (SAMPL-1-154)', () => {
    // 🚨 이 티켓의 증상 그대로. `5`, `5-1`, `5-2`가 들어오면 두 번째부터 "중복"으로
    //    판정돼 기본 정책(건너뛰기)에서 조용히 사라졌다. 사용자에게는 "중복 2건"으로만
    //    보여 **정상 동작으로 오해**한다 — 그것이 가장 위험한 지점이었다.
    //
    // `-N` 접미사는 이 저장소에서 두 가지를 뜻한다(soil-script.js:2054 주석):
    //    분할모드 = 한 지번에 작물 여럿   → 5, 5-1   (지번주소 같음)
    //    하위필지 = 한 접수에 지번 여럿   → 5, 5-1   (지번주소 다름)
    // 대장 내보내기는 하위필지를 `{본번}-{n}` + 각자의 지번주소로 쓴다(soil-script.js:4856).
    // 따라서 **지번주소로 판별**한다 — 담당자 확인을 받은 결정이다 (2026-08-20).
    const MAP = { receptionNumber: 0, name: 1, lotAddress: 2, cropsDisplay: 3 }
    const run = (rows, opts = {}) => preview({
        rows, mapping: MAP, landClass1: '농가의뢰', dupPolicy: opts.dupPolicy || 'skip',
        logs: opts.logs || [],
        nextNumber: opts.nextNumber ?? 1,
        nextFillNumber: opts.nextFillNumber ?? 1,
    })

    it('지번주소가 다르면 하위필지 한 접수로 묶는다', () => {
        const r = run([
            ['5', 'A', '문단리 224', '고추'],
            ['5-1', 'A', '문단리 225', '마늘'],
            ['5-2', 'A', '문단리 226', '무'],
        ])
        // 조용히 버려지지 않는다 — 어느 행도 dup이 아니다
        expect(r.items.map(i => i.status)).toEqual(['new', 'sub', 'sub'])
        expect(r.stats.dup).toBe(0)
        // 접수는 1건이다 (하위필지가 있는 필지는 접수번호 1개 — 2026-08-20 확정 규칙)
        expect(r.willImport).toBe(1)
        const lead = r.items[0]
        expect(lead.group.mode).toBe('sublot')
        // `area`는 면적 컬럼이 매핑되지 않은 이 케이스에서 ''이다.
        // 면적 보존은 아래 '하위필지 면적이 보존된다'가 따로 덮는다.
        expect(lead.group.subLots).toEqual([
            { lotAddress: '문단리 225', cropsDisplay: '마늘', area: '' },
            { lotAddress: '문단리 226', cropsDisplay: '무', area: '' },
        ])
    })

    it('지번주소가 같으면 분할모드로 묶는다 — 접수번호는 원문대로 보존', () => {
        const r = run([
            ['5', 'A', '문단리 224', '고추'],
            ['5-1', 'A', '문단리 224', '배추'],
        ])
        expect(r.items.map(i => i.status)).toEqual(['new', 'new'])
        // 분할모드는 작물마다 레코드가 하나씩이다 (폼 등록 경로와 같은 모양)
        expect(r.willImport).toBe(2)
        expect(r.items.map(i => i.display)).toEqual(['5', '5-1'])
        expect(r.items[0].group.mode).toBe('split')
        // 같은 접수이므로 groupId를 공유하고 cropIndex가 0,1로 붙는다
        expect(r.items[0].group.id).toBe(r.items[1].group.id)
        expect(r.items.map(i => i.group.cropIndex)).toEqual([0, 1])
    })

    it('진짜 같은 번호는 여전히 dup이다 (과잉수정 방지)', () => {
        const r = run([
            ['5', 'A', '문단리 224', '고추'],
            ['5', 'B', '문단리 999', '무'],
        ])
        expect(r.items.map(i => i.status)).toEqual(['new', 'dup'])
    })

    it('본번 행이 없으면 묶지 않고 각자 원문 번호로 등록한다', () => {
        // 손으로 만든 파일에서 5-1, 5-2만 오는 경우 — 의도를 알 수 없으므로
        // 추측해서 묶지 않는다. 조용한 유실만 없으면 된다.
        const r = run([
            ['5-1', 'A', '문단리 225', '마늘'],
            ['5-2', 'A', '문단리 226', '무'],
        ])
        expect(r.items.map(i => i.status)).toEqual(['new', 'new'])
        expect(r.items.map(i => i.display)).toEqual(['5-1', '5-2'])
        expect(r.willImport).toBe(2)
    })

    it('기존 레코드 5-1과 들어온 5-1은 표기 그대로 충돌한다', () => {
        // collectLiteralNumbers가 본번으로 접으면 이 판정이 무너진다
        const logs = [{ receptionNumber: '5-1', subCategory: '논', landClass1: '농가의뢰' }]
        const r = run([['5-1', 'A', '문단리 225', '마늘']], { logs })
        expect(r.items[0].status).toBe('dup')
    })

    it('기존 레코드 5가 있어도 들어온 5-1은 그것과 충돌하지 않는다', () => {
        const logs = [{ receptionNumber: '5', subCategory: '논', landClass1: '농가의뢰' }]
        const r = run([['5-1', 'A', '문단리 225', '마늘']], { logs })
        expect(r.items[0].status).toBe('new')
    })
    // 🚨 독립 리뷰(codex)가 찾은 MAJOR. 미리보기가 "건너뜀"이라 말한 행이
    //    선두 레코드의 subLots 안에 되살아났다 — 미리보기 ≠ 저장.
    it('건너뛰는 중복 하위필지는 선두의 subLots에도 들어가지 않는다', () => {
        const logs = [{ receptionNumber: '5-1', subCategory: '논', landClass1: '농가의뢰' }]
        const r = run([
            ['5', 'A', '문단리 224', '고추'],
            ['5-1', 'A', '문단리 225', '마늘'],   // 기존과 표기가 같아 dup
            ['5-2', 'A', '문단리 226', '무'],
        ], { logs })
        expect(r.items.map(i => i.status)).toEqual(['new', 'dup', 'sub'])
        expect(r.items[1].skip).toBe(true)
        // 건너뛴 225는 어디에도 없어야 한다
        expect(r.items[0].group.subLots).toEqual([
            { lotAddress: '문단리 226', cropsDisplay: '무', area: '' },
        ])
    })

    // 🚨 같은 리뷰의 MAJOR. 하위필지 작물 면적이 '0'으로 고정돼 조용히 사라졌다.
    it('하위필지 면적이 보존된다', () => {
        const MAP_AREA = { receptionNumber: 0, name: 1, lotAddress: 2, cropsDisplay: 3, area: 4 }
        const r = preview({
            rows: [
                ['5', 'A', '문단리 224', '고추', '100'],
                ['5-1', 'A', '문단리 225', '마늘', '50'],
            ],
            mapping: MAP_AREA, landClass1: '농가의뢰', dupPolicy: 'skip',
            logs: [], nextNumber: 1, nextFillNumber: 1,
        })
        expect(r.items[0].group.subLots).toEqual([
            { lotAddress: '문단리 225', cropsDisplay: '마늘', area: '50' },
        ])
    })

    // 🚨 같은 리뷰의 MINOR. 지번주소가 매핑 안 되면 전부 ''이라 "같아 보여"
    //    무조건 분할모드로 오판했다. 판단 근거가 없으면 묶지 않는 쪽이 안전하다.
    it('지번주소 컬럼이 매핑되지 않으면 묶지 않는다', () => {
        const r = preview({
            rows: [['5', 'A', '고추'], ['5-1', 'A', '마늘']],
            mapping: { receptionNumber: 0, name: 1, cropsDisplay: 2 },
            landClass1: '농가의뢰', dupPolicy: 'skip',
            logs: [], nextNumber: 1, nextFillNumber: 1,
        })
        expect(r.items.every(i => i.group === undefined)).toBe(true)
        expect(r.items.map(i => i.status)).toEqual(['new', 'new'])
        expect(r.willImport).toBe(2)
    })
    // 🚨 2라운드 리뷰 MINOR. 주소 컬럼은 매핑됐지만 값이 비면 '' === ''로 "같아 보여"
    //    분할모드로 오판했다. 매핑이 아예 없는 경우와 똑같이 판단 불가다.
    it('지번주소 값이 비어 있으면 묶지 않는다', () => {
        const r = run([
            ['5', 'A', '', '고추'],
            ['5-1', 'A', '', '마늘'],
        ])
        expect(r.items.every(i => i.group === undefined)).toBe(true)
        expect(r.items.map(i => i.status)).toEqual(['new', 'new'])
        expect(r.willImport).toBe(2)
    })

    // 🚨 2라운드 리뷰 MAJOR(O(n^2))를 고치며 후처리를 단일 순회로 바꿨다.
    //    묶임 결과가 규모와 무관하게 같아야 한다 — 리팩터링이 동작을 바꾸지 않았음을 고정한다.
    it('그룹이 많아도 각 선두가 자기 하위필지만 가진다', () => {
        const rows = []
        for (let n = 1; n <= 30; n++) {
            rows.push([String(n), `사람${n}`, `주소${n}-본`, '고추'])
            rows.push([`${n}-1`, `사람${n}`, `주소${n}-하나`, '마늘'])
            rows.push([`${n}-2`, `사람${n}`, `주소${n}-둘`, '무'])
        }
        const r = run(rows)
        expect(r.willImport).toBe(30)
        expect(r.stats.sub).toBe(60)
        expect(r.stats.dup).toBe(0)
        const leads = r.items.filter(i => i.group && i.group.cropIndex === 0)
        expect(leads).toHaveLength(30)
        for (const lead of leads) {
            const n = lead.display
            expect(lead.group.subLots.map(s => s.lotAddress))
                .toEqual([`주소${n}-하나`, `주소${n}-둘`])
        }
    })
})
