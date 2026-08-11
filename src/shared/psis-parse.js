// @ts-check
/**
 * psis-parse.js — 농촌진흥청 PSIS 농약등록정보 API(XML) 순수 파서 (UMD).
 *
 * Node(main process) + 브라우저 양용. 외부 의존성 없음(순수 함수) → 단위테스트 대상.
 * 응답 XML에서 농약 용도(useName: 살충제/살균제/제초제 등)를 추출한다.
 *
 * 설계:
 *  - <errorCode> 가 있으면 인증 실패 등 → { useName: null, error: '<code>: <msg>' }
 *  - 정상 응답: 한 농약은 여러 작물 레코드를 가지며 같은 용도를 반복하므로,
 *    모든 <useName> 값을 수집해 "가장 빈도 높은 비어있지 않은 값"(다수결)을 채택.
 *  - 태그 중첩/네임스페이스(prefix:useName)에 관대하게 정규식 추출.
 *  - XML 엔티티(&amp; &lt; &gt; &quot; &apos; &#nn;)를 디코드하고 트림.
 */
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') window.PsisParse = api;
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /** XML 엔티티 디코드 (숫자/16진수 참조 포함). */
    function decodeEntities(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
                const code = parseInt(h, 16);
                return Number.isFinite(code) ? String.fromCodePoint(code) : _;
            })
            .replace(/&#(\d+);/g, (_, d) => {
                const code = parseInt(d, 10);
                return Number.isFinite(code) ? String.fromCodePoint(code) : _;
            })
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&amp;/g, '&');
    }

    /**
     * XML 문자열에서 주어진 (네임스페이스 무시) 로컬 태그명의 모든 텍스트 값을 추출.
     * @param {string} xml
     * @param {string} localName 예: 'useName'
     * @returns {string[]}
     */
    function extractTagValues(xml, localName) {
        if (typeof xml !== 'string' || !xml) return [];
        // (?:\w+:)? 로 네임스페이스 prefix 허용, 속성도 허용. 내용은 비탐욕 캡처.
        const re = new RegExp(
            '<(?:[\\w.-]+:)?' + localName + '(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?' + localName + '>',
            'gi'
        );
        const out = [];
        let m;
        while ((m = re.exec(xml)) !== null) {
            out.push(decodeEntities(m[1]).trim());
        }
        return out;
    }

    /** 첫 번째 매칭 태그의 텍스트(트림·디코드)만 반환. 없으면 null. */
    function extractFirstTagValue(xml, localName) {
        const vals = extractTagValues(xml, localName);
        return vals.length ? vals[0] : null;
    }

    /**
     * RDA 용도 표기(짧은 형태)를 앱 표준 라벨로 정규화한다.
     * 실제 API는 '살충'/'살균'/'제초'처럼 접미사 '제' 없이 반환한다
     * (예: 다이아지논 → useName='살충'). 정적표·배지 클래스는 '살충제' 형식을
     * 기대하므로 '제'를 보강한다. 이미 '제'로 끝나면 그대로 둔다.
     * @param {string|null} raw
     * @returns {string|null}
     */
    function normalizeUseName(raw) {
        if (raw == null) return null;
        const s = String(raw).trim();
        if (!s) return null;
        // 이미 표준형(…제)이면 유지: 살충제 / 생장조정제 등
        if (/제$/.test(s)) return s;
        // 짧은 형태(살충/살균/제초/살응애/살선충/생장조정/살서/전착 …) → '제' 보강
        return s + '제';
    }

    /**
     * 응답 XML에서 농약 용도(useName)를 추출한다.
     * @param {string} xmlString
     * @returns {{ useName: string|null, error: string|null }}
     */
    function parsePsisUseName(xmlString) {
        if (typeof xmlString !== 'string' || !xmlString.trim()) {
            return { useName: null, error: 'empty_response' };
        }

        // 1) 에러 응답 우선 처리: <errorCode>...</errorCode>
        const errorCode = extractFirstTagValue(xmlString, 'errorCode');
        if (errorCode) {
            const errorMsg = extractFirstTagValue(xmlString, 'errorMsg') || '';
            return { useName: null, error: `${errorCode}: ${errorMsg}`.trim() };
        }

        // 2) 모든 useName 수집 후 다수결(비어있지 않은 값 중 최빈)
        const values = extractTagValues(xmlString, 'useName').filter(v => v !== '');
        if (!values.length) {
            return { useName: null, error: null };
        }

        const counts = new Map();
        let best = null;
        let bestCount = 0;
        for (const v of values) {
            const next = (counts.get(v) || 0) + 1;
            counts.set(v, next);
            if (next > bestCount) {
                bestCount = next;
                best = v;
            }
        }
        // 다수결 승자를 앱 표준 라벨('살충제' 등)로 정규화해 반환
        return { useName: normalizeUseName(best), error: null };
    }

    return {
        parsePsisUseName,
        normalizeUseName,
        // 내부 헬퍼(테스트 편의상 노출)
        decodeEntities,
        extractTagValues
    };
}));
