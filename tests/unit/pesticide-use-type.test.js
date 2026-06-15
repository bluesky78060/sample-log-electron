import { describe, it, expect, beforeAll } from 'vitest'

let UseType

beforeAll(async () => {
    await import('../../src/shared/pesticide-use-type.js')
    UseType = window.PesticideUseType
})

// getByKor 테스트용 최소 name-map (영문키 → { kor })
const NAME_MAP = {
    'Diazinon': { kor: '다이아지논' },
    'Azoxystrobin': { kor: '아족시스트로빈' },
    'Atrazine': { kor: '아트라진' },
    'Paclobutrazol': { kor: '파클로부트라졸' },
    'Carbofuran': { kor: '카보퓨란' },
    // 미분류 성분 (용도 맵에 없음)
    'ZZZ-unknown': { kor: '미지물질' }
}

describe('PesticideUseType.get — 대표 성분 분류', () => {
    const cases = [
        ['Diazinon', '살충제'],
        ['Imidacloprid', '살충제'],
        ['Chlorantraniliprole', '살충제'],
        ['Azoxystrobin', '살균제'],
        ['Tebuconazole', '살균제'],
        ['Mancozeb', '살균제'],
        ['Atrazine', '제초제'],
        ['Glyphosate', '제초제'],
        ['Pendimethalin', '제초제'],
        ['Paclobutrazol', '생장조정제'],
        ['Uniconazole', '생장조정제'],
        ['Bifenazate', '살응애제'],
        ['Hexythiazox', '살응애제'],
        ['Fluensulfone', '살선충제'],
        ['Piperonyl butoxide', '기타']
    ]
    it.each(cases)('%s → %s', (eng, expected) => {
        expect(UseType.get(eng)).toBe(expected)
    })
})

describe('PesticideUseType.get — 정규화 매칭', () => {
    it('대소문자 무시', () => {
        expect(UseType.get('diazinon')).toBe('살충제')
        expect(UseType.get('AZOXYSTROBIN')).toBe('살균제')
    })
    it('공백 제거 매칭', () => {
        expect(UseType.get('  Atrazine  ')).toBe('제초제')
        expect(UseType.get('Piperonyl  butoxide')).toBe('기타')
    })
    it('괄호 부가표기 제거 매칭 (Chlorpyrifos(-ethyl))', () => {
        expect(UseType.get('Chlorpyrifos(-ethyl)')).toBe('살충제')
        expect(UseType.get('Chlorpyrifos')).toBe('살충제')
    })
})

describe('PesticideUseType.get — 미등재/빈 입력', () => {
    it('미등재 성분은 null', () => {
        expect(UseType.get('Water')).toBeNull()
        expect(UseType.get('NonExistentPesticideXyz')).toBeNull()
    })
    it('빈/널 입력은 null', () => {
        expect(UseType.get('')).toBeNull()
        expect(UseType.get(null)).toBeNull()
        expect(UseType.get(undefined)).toBeNull()
    })
})

describe('PesticideUseType.getByKor — 한글명 역조회', () => {
    beforeAll(() => {
        window.PESTICIDE_NAME_MAP = { map: NAME_MAP }
    })

    it('한글명으로 용도 조회', () => {
        expect(UseType.getByKor('다이아지논')).toBe('살충제')
        expect(UseType.getByKor('아족시스트로빈')).toBe('살균제')
        expect(UseType.getByKor('아트라진')).toBe('제초제')
        expect(UseType.getByKor('파클로부트라졸')).toBe('생장조정제')
    })
    it('공백/대소 정규화도 적용', () => {
        expect(UseType.getByKor(' 다이아지논 ')).toBe('살충제')
    })
    it('name-map에 없는 한글명은 null', () => {
        expect(UseType.getByKor('존재하지않는농약')).toBeNull()
    })
    it('name-map에 있으나 용도 미분류면 null', () => {
        expect(UseType.getByKor('미지물질')).toBeNull()
    })
    it('빈 입력은 null', () => {
        expect(UseType.getByKor('')).toBeNull()
        expect(UseType.getByKor(null)).toBeNull()
    })
})

describe('PesticideUseType.getByKor — name-map 미로드 시', () => {
    it('window.PESTICIDE_NAME_MAP 없으면 null (안전)', () => {
        const saved = window.PESTICIDE_NAME_MAP
        delete window.PESTICIDE_NAME_MAP
        expect(UseType.getByKor('다이아지논')).toBeNull()
        window.PESTICIDE_NAME_MAP = saved
    })
})

describe('맵 무결성', () => {
    it('모든 분류값이 허용된 용도 문자열', () => {
        const allowed = new Set(UseType.USE_TYPES)
        // 대표 키들의 반환값 검증
        const samples = [
            'Diazinon', 'Azoxystrobin', 'Atrazine', 'Paclobutrazol',
            'Bifenazate', 'Fluensulfone', 'Piperonyl butoxide'
        ]
        for (const s of samples) {
            const v = UseType.get(s)
            expect(v === null || allowed.has(v)).toBe(true)
        }
    })
    it('USE_TYPES 는 7개 표준 용도', () => {
        expect(UseType.USE_TYPES).toEqual(
            ['살충제', '살균제', '제초제', '살응애제', '생장조정제', '살선충제', '기타']
        )
    })
    it('meta 카운트 일관성 (classified + unclassified = 552)', () => {
        expect(UseType.meta.classified + UseType.meta.unclassified).toBe(552)
        expect(UseType.meta.classified).toBeGreaterThan(0)
        expect(UseType.meta.source).toContain('IRAC')
    })
})
