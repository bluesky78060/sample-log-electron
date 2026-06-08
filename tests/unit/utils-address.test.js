import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(async () => {
    await import('../../src/shared/utils.js')
})

describe('splitLegacyAddress — 레거시 "(우편번호) 주소" 분리', () => {
    it('우편번호 prefix가 있으면 분리한다', () => {
        expect(window.SampleUtils.splitLegacyAddress('(36231) 경북 봉화군 봉화읍 내성로 39'))
            .toEqual({ postcode: '36231', road: '경북 봉화군 봉화읍 내성로 39' })
    })

    it('prefix가 없으면 전체를 road로 반환한다', () => {
        expect(window.SampleUtils.splitLegacyAddress('경북 봉화군 봉화읍'))
            .toEqual({ postcode: null, road: '경북 봉화군 봉화읍' })
    })

    it('null/빈 문자열은 양쪽 null', () => {
        expect(window.SampleUtils.splitLegacyAddress('')).toEqual({ postcode: null, road: null })
        expect(window.SampleUtils.splitLegacyAddress(null)).toEqual({ postcode: null, road: null })
        expect(window.SampleUtils.splitLegacyAddress(undefined)).toEqual({ postcode: null, road: null })
    })

    it('우편번호가 5자리가 아니면 분리하지 않는다 (기존 정규식 동작 고정)', () => {
        expect(window.SampleUtils.splitLegacyAddress('(123) 어딘가'))
            .toEqual({ postcode: null, road: '(123) 어딘가' })
    })

    it('괄호 뒤 공백 유무와 무관하게 분리한다', () => {
        expect(window.SampleUtils.splitLegacyAddress('(36231)경북 봉화군'))
            .toEqual({ postcode: '36231', road: '경북 봉화군' })
    })
})
