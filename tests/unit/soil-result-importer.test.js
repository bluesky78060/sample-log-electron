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
