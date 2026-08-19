import { describe, it, expect, beforeAll } from 'vitest'

// sanitize.js를 jsdom 환경에서 import → window.escapeHTML 등 설정됨
beforeAll(async () => {
    await import('../../src/shared/sanitize.js')
})

describe('escapeAttr (SAMPL-2-32)', () => {
    // 🚨 이 함수의 존재 이유. escapeHTML은 textContent→innerHTML 방식이라
    //    따옴표를 변환하지 않아 속성 위치에서 탈출이 가능하다.
    it('따옴표를 변환한다 — escapeHTML과 갈리는 지점', () => {
        expect(escapeAttr('a"b')).toBe('a&quot;b')
        expect(escapeAttr("a'b")).toBe('a&#39;b')
        // 대조: escapeHTML은 따옴표를 통과시킨다 (이 차이가 결함의 원인이었다)
        expect(escapeHTML('a"b')).toBe('a"b')
    })

    it('속성 탈출 페이로드를 무력화한다', () => {
        const payload = '" onfocus=alert(1) x="'
        const esc = escapeAttr(payload)
        expect(esc).not.toContain('"')

        // 실제로 파싱해서 확인한다 — 문자열 검사만으로는 부족하다
        const d = document.createElement('div')
        d.innerHTML = `<input value="${esc}">`
        const input = d.querySelector('input')
        expect([...input.attributes].map(a => a.name)).toEqual(['value'])
        // 값은 원본 그대로 복원돼야 한다 (엔티티가 문자로 보이면 안 된다)
        expect(input.getAttribute('value')).toBe(payload)
    })

    it('꺽쇠와 앰퍼샌드도 변환한다', () => {
        expect(escapeAttr('<img>&')).toBe('&lt;img&gt;&amp;')
    })

    // 앰퍼샌드를 **먼저** 변환한다. 그래야 속성에서 값을 꺼낼 때 원본이 복원된다.
    // (독립 리뷰 지적: 예전 문구 "이중 인코딩을 막는다"는 동작과 반대였다 —
    //  `&lt;` → `&amp;lt;`가 되는 것이 **맞다.** HTML 왕복 후 다시 `&lt;`가 된다.)
    it('앰퍼샌드를 먼저 변환해 속성 왕복에서 원본이 복원된다', () => {
        expect(escapeAttr('&lt;')).toBe('&amp;lt;')

        const d = document.createElement('div')
        d.innerHTML = `<input value="${escapeAttr('&lt;')}">`
        expect(d.querySelector('input').getAttribute('value')).toBe('&lt;')
    })

    // escapeAttr는 escapeHTML의 상위집합이다 — 텍스트 위치에서도 표시가 같다.
    // 이 성질이 없으면 "여긴 텍스트니 escapeHTML로 되돌리자"는 판단이 정당해진다.
    it('텍스트 위치에서도 표시가 달라지지 않는다', () => {
        const raw = 'a"b\'c<d&e'
        const d = document.createElement('div')
        d.innerHTML = `<span>${escapeAttr(raw)}</span>`
        expect(d.querySelector('span').textContent).toBe(raw)
    })

    it('null/undefined → 빈 문자열', () => {
        expect(escapeAttr(null)).toBe('')
        expect(escapeAttr(undefined)).toBe('')
    })

    it('숫자·빈 문자열을 다룬다 — 면적처럼 숫자가 오는 자리가 있다', () => {
        expect(escapeAttr(42)).toBe('42')
        expect(escapeAttr(0)).toBe('0')
        expect(escapeAttr('')).toBe('')
    })

    it('평범한 한글은 그대로 둔다', () => {
        expect(escapeAttr('봉화군 문단리 224')).toBe('봉화군 문단리 224')
    })
})

describe('escapeHTML', () => {
    it('script 태그 이스케이프', () => {
        expect(escapeHTML('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
    })

    it('꺽쇠 괄호 이스케이프 (XSS 방지 핵심)', () => {
        expect(escapeHTML('<img src=x onerror=alert(1)>')).toContain('&lt;')
        expect(escapeHTML('<img src=x onerror=alert(1)>')).toContain('&gt;')
    })

    it('null/undefined → 빈 문자열', () => {
        expect(escapeHTML(null)).toBe('')
        expect(escapeHTML(undefined)).toBe('')
    })

    it('일반 텍스트 그대로 반환', () => {
        expect(escapeHTML('봉화군 농업기술센터')).toBe('봉화군 농업기술센터')
    })

    it('숫자를 문자열로 변환', () => {
        expect(escapeHTML(42)).toBe('42')
    })

    it('& 이스케이프', () => {
        expect(escapeHTML('a & b')).toBe('a &amp; b')
    })
})
