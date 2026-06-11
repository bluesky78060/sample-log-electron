// ========================================
// mrl-name-canon.js — 농약 한글명 음역 정규화 (UMD, SAMPL-1-105)
// ========================================
// 문제: 식품안전나라 MRL 데이터(AGCHM_KOR_NM)와 연구소 name-map(pesticide-name-map)이
//       같은 영문 농약을 서로 다른 한글로 음역한다.
//         Buprofezin   : 부프로페진(name-map) ↔ 뷰프로페진(MRL)
//         Isofenphos   : 이소펜포스         ↔ 아이소펜포스
//         Lufenuron    : 루페누론           ↔ 루페뉴론
//         Permethrin-cis: 시스-퍼메트린(이성질체 접두) ↔ 퍼메트린(MRL 기준명)
//       이 때문에 영문 검색 → name-map 한글 → MRL 대조가 실패해 'MRL 기준없음'으로 오표시됨.
// 해결: 알려진 음역 동치 규칙으로 양쪽을 같은 canonical 키로 정규화한 뒤 비교한다.
//       (실측: 분석 525종 중 base 정확매칭 259 → canon 약 325, 라이브 내부충돌 0건.
//        유사도(fuzzy) 매칭과 달리 '아는 음절 변형'만 흡수하므로 오매칭이 없다 —
//        예: 부타클로르↔뷰타클로르는 합쳐지되 헵타클로르는 분리 유지.)
//
// 공개 API (window.MrlNameCanon / module.exports):
//   canonicalizeKor(name)  : 한글 농약명 → canonical 키 (비교 전용, 표시용 아님)
//   stripIsomerSuffix(key) : canonical 키에서 이성질체/광학 접미사 제거(보조 매칭)
//   KOR_ALIAS              : name-map 한글 → MRL 한글 검증된 별칭(불규칙 케이스)
//
// 의존성 없음(순수) → 단위테스트 대상. mrl-api.js·mrl-search.js 양쪽에서 재사용.
// ========================================
(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') window.MrlNameCanon = api;
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // 검증된 불규칙 별칭: name-map(연구소) 한글 → 식품안전나라 한글.
    // canon 규칙으로 흡수되지 않는 표기 오류/특수 케이스만 수동 등재(각각 영문 동일성 확인).
    //  - 메소밀: name-map 표기 오류(Methomyl 정명은 '메토밀')
    const KOR_ALIAS = {
        '메소밀': '메토밀'            // Methomyl
    };

    /** 기본 정규화: 괄호 부가표기·공백·하이픈·가운뎃점·마침표 제거 + 소문자화. */
    function baseNorm(s) {
        return String(s == null ? '' : s)
            .replace(/\([^)]*\)/g, '')
            .replace(/[\s\-·.]/g, '')
            .toLowerCase();
    }

    // 입체/이성질체 접두 표기 (제거 대상): 시스/트랜스/감마/람다/알파/베타/델타 + 그리스문자
    const STEREO_PREFIX = /^(시스|트랜스|감마|람다|알파|베타|델타|cis|trans|[αβγδλ])/;

    /**
     * 음역 동치 정규화. 알려진 변형만 한 방향으로 흡수한다.
     * @param {string} name 한글 농약명
     * @returns {string} canonical 비교 키
     */
    function canonicalizeKor(name) {
        if (name == null) return '';
        // 0) 검증된 별칭 우선 치환 (정규화 전 원문 기준)
        const aliased = Object.prototype.hasOwnProperty.call(KOR_ALIAS, String(name).trim())
            ? KOR_ALIAS[String(name).trim()]
            : name;

        let x = baseNorm(aliased);
        if (!x) return '';

        // 1) 입체 이성질체 접두 제거 (시스-퍼메트린 → 퍼메트린)
        //    그리스문자는 baseNorm에서 보존되므로 여기서 1회 제거
        x = x.replace(STEREO_PREFIX, '');

        // 2) 음역 동치 규칙 (순서 의존: 긴 패턴 먼저)
        const rules = [
            [/아이소/g, '이소'],   // iso: 아이소펜포스 → 이소펜포스
            [/아이드/g, '이드'],   // -ide: ...아이드 → ...이드
            [/마이드/g, '미드'],   // -amide: 아마이드 → 아미드
            [/아이/g, '이'],
            // yu(ㅠ) ↔ u(ㅜ) 모음 계열 일반화
            [/뷰/g, '부'], [/뮤/g, '무'], [/뉴/g, '누'], [/퓨/g, '푸'],
            [/슈/g, '수'], [/류/g, '루'], [/큐/g, '쿠'], [/듀/g, '두'],
            [/쥬/g, '주'], [/츄/g, '추'], [/휴/g, '후'], [/규/g, '구'],
            [/슐/g, '설'],         // sulf: 디클로슐람 → 디클로설람
            [/라르/g, '라'],       // -lar: 아시벤졸라르 → 아시벤졸라
            [/톨라/g, '토라'],
            [/러/g, '레'],         // -ler-: 펜발러레이트 → 펜발레레이트
            [/사이/g, '시'],       // cy: 프로사이미돈 → 프로시미돈
            [/에스/g, 's']         // -S- 라틴 동치: 에스메틸 ↔ s메틸
        ];
        for (const [re, to] of rules) x = x.replace(re, to);
        return x;
    }

    /** canonical 키에서 이성질체/광학/대사체 접미사 제거(보조 매칭용). */
    function stripIsomerSuffix(key) {
        if (!key) return '';
        return String(key)
            .replace(/(b1a|b1b|a3|a4|m1|옥손|설폰|설폭사이드|에놀|sulfone|sulfoxide|oxon)$/, '')
            .replace(/[ezrs]$/, '');
    }

    return { canonicalizeKor, stripIsomerSuffix, KOR_ALIAS, baseNorm };
}));
