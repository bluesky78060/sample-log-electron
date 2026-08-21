/**
 * SoilResultImporter
 *
 * 토양 시료 접수 — 흙토람式 엑셀/붙여넣기 가져오기 모달 (자체 완결).
 *
 * 흙토람 결과 입력 모달(heuktoram-result-importer.js)의 인터랙션 패턴을 따르되,
 * 접수 레코드 "신규 등록"용으로 재구성한다. 모달 DOM·스타일을 이 모듈이 직접
 * 주입하므로 외부 마크업/CSS(heuktoram-style.css)에 의존하지 않는다.
 *
 * 흐름:
 *   1) 엑셀 데이터 입력  — 파일 업로드(드래그앤드롭) / 텍스트 붙여넣기 토글
 *   2) 컬럼 매핑         — 엑셀 컬럼 → 접수 필드 (접수번호[선택]·성명·연락처·
 *                          지번주소·작물·면적·구분·목적·비고), 자동 매핑 추정
 *   3) 경지구분 1차      — 11값 드롭다운 → 가져오는 모든 행에 일괄 적용
 *   4) 옵션             — 접수번호 자동부여 / 중복 시(건너뛰기·덮어쓰기)
 *   5) 미리보기          — 생성될 행 표 + 신규/중복/오류 배지 + 건수 요약
 *
 * 저장은 window.soilManager.addImportedRecord(record) 로 위임한다.
 *
 * @global window.SoilResultImporter (싱글턴 인스턴스)
 */
(function () {
    'use strict';

    // ============================================================
    // 상수
    // ============================================================
    const FILE_SIZE_WARN = 5 * 1024 * 1024;    // 5MB: 경고만
    const FILE_SIZE_HARD = 50 * 1024 * 1024;   // 50MB: 거부
    const PREVIEW_ROW_LIMIT = 200;             // 미리보기 표 최대 행
    const LAND_CLASS1_OPTIONS = ['개량제', '전략', '직불', '자체', '기타', '친환경', '유기농', '무농약', 'GAP', '농가의뢰', '대표필지', '공익직불제'];
    const LAND_CLASS1_DEFAULT = '농가의뢰';

    // 매핑 대상 접수 필드 (순서 = 매핑 UI 표시 순서)
    // key: record 필드명, label: UI 표시명, auto: 자동 매핑용 헤더 키워드(정규화)
    //   - 각 기술센터마다 컬럼명이 제각각이므로 동의어를 폭넓게 등록한다.
    //   - 매칭은 _autoMap()의 스코어 기반 전역 최적화로 처리(긴/정확 키워드 우선).
    const TARGET_FIELDS = [
        { key: 'receptionNumber', label: '접수번호', optional: true,
          auto: ['접수번호', '접수no', '접수번호no', '번호', '연번', '순번', '일련번호', '관리번호', '정렬번호', 'no', 'num', 'seq', 'index', 'id'] },
        { key: 'name',            label: '성명',
          auto: ['성명', '이름', '성함', '의뢰인', '의뢰자', '의뢰인명', '농가명', '농가', '경영체명', '농업인', '농업인명', '신청인', '신청자', '신청인명', '대표자', '대표자명', '경작자', '경작자명', '경작인', '민원인', '고객명', '고객', '토지소유자', '소유자', '소유자명', '재배자', 'name', 'farmer', 'applicant', 'owner'] },
        { key: 'phoneNumber',     label: '연락처',
          auto: ['연락처', '전화', '전화번호', '휴대폰', '휴대폰번호', '핸드폰', '핸드폰번호', '휴대전화', '휴대전화번호', '연락전화', '연락번호', '핸펀', 'phone', 'tel', 'telephone', 'hp', 'mobile', 'cell', 'cellphone', 'contact'] },
        { key: 'lotAddress',      label: '지번주소',
          auto: ['지번주소', '지번', '소재지', '소재지지번', '토지소재지', '필지', '필지주소', '시료채취지', '채취지', '채취지주소', '경작지', '경작지주소', '농지', '농지주소', '토지주소', '포장주소', '포장위치', '시료위치', '주소', 'address', 'addr', 'jibun', 'lot', 'parcel'] },
        { key: 'cropsDisplay',    label: '작물',
          auto: ['작물', '작물명', '재배작물', '재배작목', '작목', '작목명', '품목', '품목명', '재배품목', '경작작물', 'crop', 'crops', 'item'] },
        { key: 'area',            label: '면적',
          auto: ['면적', '재배면적', '경작면적', '필지면적', '농지면적', '포장면적', '시료면적', '제곱미터', '평방미터', 'area', 'size'] },
        { key: 'subCategory',     label: '구분',
          auto: ['구분', '지목', '토지구분', '전답구분', '논밭구분', '시료구분', '경지지목', 'category', 'type', 'gubun'] },
        { key: 'purpose',         label: '목적',
          auto: ['목적', '용도', '사용용도', '분석목적', '검정목적', '신청목적', '의뢰목적', '시료목적', 'purpose', 'usage', 'use'] },
        { key: 'note',            label: '비고',
          auto: ['비고', '비고란', '메모', '참고', '참고사항', '특이사항', '기타', '기타사항', '코멘트', 'note', 'notes', 'remark', 'remarks', 'memo', 'comment', 'comments', 'etc'] },
        // 공익직불제용 (선택) — gongik:true 인 항목은 경지구분1차='공익직불제'일 때 강조
        { key: 'businessRegNo',   label: '경영체등록번호', optional: true, gongik: true,
          auto: ['경영체등록번호', '농업경영체등록번호', '농업경영체', '경영체', '경영체번호', '경영체등록', '등록번호', '경영등록번호', 'businessregno', 'bizregno', 'bizno', 'businessno', 'farmbizno'] },
        { key: 'addressRoad',     label: '농가주소(경작자)', optional: true, gongik: true,
          // '농가' 단독은 성명(name)과 의미 충돌하므로 제외, '농가주소' 등 명시 키워드만 사용
          auto: ['농가주소', '농업인주소', '경영체주소', '경작자주소', '거주지주소', '거주지', '도로명주소', '도로명', '주소도로명', '신청인주소', '의뢰인주소', '대표자주소', 'farmeraddr', 'addressroad', 'roadaddr', 'roadaddress'] },
        { key: 'date',            label: '접수일자', optional: true, gongik: true,
          auto: ['접수일자', '접수일', '접수날짜', '조사일자', '조사일', '분석의뢰일', '의뢰일', '의뢰일자', '신청일', '신청일자', '채취일', '채취일자', '시료채취일', '등록일', '등록일자', '일자', '날짜', 'date', 'regdate', 'recvdate'] },
    ];

    // 자동매핑 동점 처리용: TARGET_FIELDS 정의 순서 (앞 필드 우선)
    const FIELD_ORDER = new Map(TARGET_FIELDS.map((f, i) => [f.key, i]));

    // ============================================================
    // 헬퍼
    // ============================================================
    function normalizeHeader(text) {
        // 공백(\s, 개행 포함)·괄호·㎡ 외에 흔한 구분기호(-, _, /, ., ·, :, ;, |, *, #, ㎥)도
        // 제거해 '전화 번호', '전화-번호', '주소(도로명)' 같은 변형을 한 형태로 수렴시킨다.
        return String(text || '')
            .replace(/[\s()[\]{}㎡㎥\-_/.,·:;|*#]/g, '')
            .toLowerCase();
    }

    // ── 자동매핑 점수 상수 ───────────────────────────────────────
    // 구간 베이스 간격(≥200)이 가산항(키워드/헤더 길이, 현실상 ≤ ~12)보다 훨씬 커서
    // 길이에 관계없이 EXACT > AFFIX > INCLUDE > RINCLUDE 불변식이 항상 성립한다.
    const SCORE_EXACT    = 1000; // 완전 일치 (헤더 == 키워드)
    const SCORE_AFFIX    = 500;  // 접두/접미 일치 (헤더가 키워드로 시작/끝남)
    const SCORE_INCLUDE  = 300;  // 부분 포함 (키워드 ⊂ 헤더)
    const SCORE_RINCLUDE = 100;  // 역포함 (헤더 ⊂ 키워드, 약식 표기)
    // 영문/숫자 전용 키워드 판별 — 2글자(no/id/hp 등)는 완전일치 전용으로 제한해
    // 우연한 부분일치 과매칭을 막는다(한글은 글자당 정보량이 커서 2글자도 허용).
    const ASCII_KEYWORD = /^[a-z0-9]+$/;

    // 키워드 정규화 사전계산: TARGET_FIELDS 각 필드에 _autoNorm = [{nk, ascii}] 부착.
    // 매 _autoMap 호출마다 normalizeHeader(키워드)를 반복 계산하지 않도록 1회만 수행.
    TARGET_FIELDS.forEach((f) => {
        const seen = new Set();
        f._autoNorm = [];
        for (const kw of f.auto) {
            const nk = normalizeHeader(kw);
            if (!nk || seen.has(nk)) continue;
            seen.add(nk);
            f._autoNorm.push({ nk, ascii: ASCII_KEYWORD.test(nk) });
        }
    });

    /**
     * 정규화 헤더 nh 와 필드의 사전계산 키워드(autoNorms = [{nk, ascii}])의 적합도 점수.
     *  - 0                  : 매칭 없음
     *  - SCORE_EXACT+len    : 완전 일치 (가장 신뢰도 높음)
     *  - SCORE_AFFIX+len    : 헤더가 키워드로 시작/끝남
     *  - SCORE_INCLUDE+len  : 키워드가 헤더에 포함
     *  - SCORE_RINCLUDE+len : 헤더가 키워드에 포함 (헤더가 더 짧은 약식)
     * 같은 필드의 여러 키워드 중 최고 점수를 채택한다.
     *
     * 영문 2글자 키워드는 완전일치 외 매칭(접두접미/부분/역포함)에서 제외(minMatch=3)해
     * 'no'·'id' 등이 무관한 헤더에 우연히 끼어드는 과매칭을 방지한다.
     */
    function scoreFieldHeader(autoNorms, nh) {
        if (!nh) return 0;
        let best = 0;
        for (const { nk, ascii } of autoNorms) {
            const minMatch = ascii ? 3 : 2;
            let s = 0;
            if (nh === nk) {
                s = SCORE_EXACT + nk.length;
            } else if (nk.length >= minMatch && (nh.startsWith(nk) || nh.endsWith(nk))) {
                s = SCORE_AFFIX + nk.length;
            } else if (nk.length >= minMatch && nh.includes(nk)) {
                s = SCORE_INCLUDE + nk.length;
            } else if (nk.length >= 3 && nh.length >= 3 && nk.includes(nh)) {
                // 헤더가 키워드보다 짧은 약식(예: 헤더 '경영체' ⊂ 키워드 '경영체번호').
                // 약식은 한글/영문 구분 없이 3글자 이상만 허용(minMatch 미적용, 의도적 고정).
                // 가산항은 헤더 길이(nh.length) — 더 긴 약식일수록 신뢰도가 높으므로 차등.
                s = SCORE_RINCLUDE + nh.length;
            }
            if (s > best) best = s;
        }
        return best;
    }

    /**
     * 헤더 배열 → { fieldKey: colIdx } 자동 매핑 (순수 함수, DOM 비의존 · 단위 테스트 대상).
     * 모든 (필드 × 컬럼) 쌍을 점수화한 뒤 [점수 ↓ → FIELD_ORDER → colIdx ↑] 순으로
     * 정렬해 필드·컬럼을 각각 1회씩 greedy 할당한다. 전역 최적에 가까운 결정적 매칭.
     */
    function computeAutoMapping(headers) {
        const normHeaders = (headers || []).map((h) => normalizeHeader(h));
        const candidates = [];
        for (const f of TARGET_FIELDS) {
            normHeaders.forEach((nh, colIdx) => {
                if (!nh) return;
                const score = scoreFieldHeader(f._autoNorm, nh);
                if (score > 0) candidates.push({ fieldKey: f.key, colIdx, score });
            });
        }
        candidates.sort((a, b) =>
            b.score - a.score ||
            FIELD_ORDER.get(a.fieldKey) - FIELD_ORDER.get(b.fieldKey) ||
            a.colIdx - b.colIdx
        );
        const mapping = {};
        const usedCols = new Set();
        for (const c of candidates) {
            if (mapping[c.fieldKey] != null || usedCols.has(c.colIdx)) continue;
            mapping[c.fieldKey] = c.colIdx;
            usedCols.add(c.colIdx);
        }
        return mapping;
    }

    /**
     * 교차 필드 동일 키워드 점검(개발 보조). 두 필드 이상에 같은 정규화 키워드가
     * 등록되면 동점이 FIELD_ORDER로만 갈리므로, 의도치 않은 중복을 콘솔 경고로 노출한다.
     * @returns {string[]} 중복 키워드 설명 목록 (없으면 빈 배열)
     */
    function auditDuplicateKeywords() {
        const seen = new Map();
        for (const f of TARGET_FIELDS) {
            for (const { nk } of f._autoNorm) {
                if (!seen.has(nk)) seen.set(nk, []);
                seen.get(nk).push(f.key);
            }
        }
        const dups = [];
        for (const [nk, keys] of seen) {
            if (keys.length > 1) dups.push(`${nk} → [${keys.join(', ')}]`);
        }
        if (dups.length) logWarn('[자동매핑] 교차 필드 중복 키워드(우선순위 FIELD_ORDER 적용):', dups.join(' / '));
        return dups;
    }

    // ============================================================
    // 접수번호 채번 (순수 함수, DOM/매니저 비의존 · 단위 테스트 대상)
    // ============================================================

    /**
     * 기존 레코드에서 "같은 경지구분1차 + 같은 시퀀스(일반/성토)" 범위의 접수번호 집합.
     *
     * ⚠️ 이 함수의 분류 규칙은 `reception-number.js`의 `computeNextNumber`와
     * **한 줄씩 같아야 한다.** 어긋나면 미리보기가 보여준 번호와 실제 저장 번호가 달라진다
     * (SAMPL-1-153이 정확히 그 결함이었다):
     *  - 성토(`subCategory==='성토'`)는 F 접두의 별 시퀀스이고 두 시퀀스는 서로를 제외한다
     *  - 일반 시퀀스에서는 `F` 접두 번호를 제외한다
     *  - 성토 시퀀스에서는 `F`를 떼고 숫자만 비교한다
     *  - 서브넘버(`5-1`)는 본번(`5`)으로 접어 넣는다
     *
     * @param {Array<Object>} logs
     * @param {string} landClass1
     * @param {{fill?: boolean}} [opts]
     * @returns {Set<string>}
     */
    function collectExistingNumbers(logs, landClass1, opts) {
        const fill = !!(opts && opts.fill);
        // computeNextNumber(reception-number.js)와 같이 기본 경지구분으로 폴백한다
        const target = landClass1 || LAND_CLASS1_DEFAULT;
        const set = new Set();
        for (const log of (logs || [])) {
            if (!log || !log.receptionNumber) continue;
            if ((log.landClass1 || LAND_CLASS1_DEFAULT) !== target) continue;
            if (fill !== (log.subCategory === '성토')) continue;
            const base = String(log.receptionNumber).split('-')[0].trim();
            if (!fill && base.startsWith('F')) continue;
            set.add(fill ? base.replace('F', '') : base);
        }
        return set;
    }

    /**
     * 기존 레코드의 접수번호 **본번 표기 그대로**의 집합 (경지구분1차 범위).
     *
     * 자동채번 풀(collectExistingNumbers)과 목적이 다르다:
     *  - 자동채번 풀은 매니저 computeNextNumber를 따라 시퀀스를 분리하고 F를 떼거나 제외한다
     *  - 이 함수는 **수동 입력 번호의 중복 판정**용이라 표기를 그대로 둔다
     *
     * 수동 번호 중복은 시퀀스와 무관하게 판정해야 한다. 폼 등록 경로도 그렇게 한다
     * (`soil-script.js`의 `logBaseNumber === numToCheck` — subCategory를 보지 않는다).
     * 시퀀스별로 나눠 판정하면 구분='성토' 행에 수동 번호 `5`를 주었을 때
     * 일반 `5`와 충돌하는 것을 놓쳐 같은 번호가 두 건 저장된다.
     * `F5`와 `5`는 표기가 달라 서로 충돌하지 않는다 — 그것이 이 함수가 표기를 보존하는 이유다.
     */
    function collectLiteralNumbers(logs, landClass1) {
        const target = landClass1 || LAND_CLASS1_DEFAULT;
        const set = new Set();
        for (const log of (logs || [])) {
            if (!log || !log.receptionNumber) continue;
            if ((log.landClass1 || LAND_CLASS1_DEFAULT) !== target) continue;
            // ⚠️ **본번으로 접지 않는다.** 예전에는 `.split('-')[0]`로 잘라 넣어
            //    저장된 `5-1`이 `5`로 들어갔고, 그래서 들어온 `5-2`가 그 `5`와 충돌해
            //    정상 행이 "중복"으로 버려졌다 (SAMPL-1-154). 표기 그대로가 맞다 —
            //    이 함수의 목적 자체가 "수동 입력 번호를 표기 그대로 비교"하는 것이다.
            set.add(String(log.receptionNumber).trim());
        }
        return set;
    }

    /**
     * 서브넘버 행(`5`, `5-1`, `5-2`)을 한 접수로 묶는다 (SAMPL-1-154, 순수 함수).
     *
     * 반환: `Map<rowIndex, group>`. 그룹에 속하지 않는 행은 키가 없다.
     *   group = { id, mode: 'split'|'sublot', leaderRow, cropIndex, size, subLots? }
     *
     * 판별 규칙 — **지번주소**로 가른다:
     *   같으면 `split`  (한 지번의 여러 작물 — 폼의 분할모드와 같은 모양)
     *   다르면 `sublot` (한 접수의 여러 지번 — 대장 내보내기가 쓰는 모양)
     *
     * 묶는 조건은 **본번 행이 배치에 있을 것**이다. `5-1`, `5-2`만 온 파일은
     * 무엇을 의도했는지 알 수 없으므로 추측하지 않는다.
     *
     * @param {Array<Array<string>>} rows
     * @param {Object} mapping
     * @param {boolean} autoAll  자동부여 강제 여부 — 참이면 수동 번호가 없어 그룹도 없다
     */
    function buildSubNumberGroups(rows, mapping, autoAll) {
        const groupOf = new Map();
        if (autoAll || mapping.receptionNumber == null) return groupOf;
        // ⚠️ 지번주소 컬럼이 매핑되지 않으면 모든 주소가 ''이라 **무조건 같아 보인다**
        //    → 전부 분할모드로 오판한다. 하위필지인지 판단할 정보가 없으면 묶지 않는다
        //    (독립 리뷰 지적). 묶지 않아도 각 행은 자기 번호로 등록되므로 유실은 없다.
        if (mapping.lotAddress == null) return groupOf;

        const cell = (row, key) => {
            const idx = mapping[key];
            if (idx == null || idx < 0) return '';
            return String(row[idx] ?? '').trim();
        };

        // 본번별로 행을 모은다 (원본 순서 유지)
        const byBase = new Map();
        rows.forEach((row, rowIndex) => {
            const recNo = cell(row, 'receptionNumber');
            if (!recNo) return;                       // 빈 칸은 자동부여로 간다
            const base = recNo.split('-')[0].trim();
            if (!base) return;
            if (!byBase.has(base)) byBase.set(base, []);
            byBase.get(base).push({ rowIndex, recNo, row });
        });

        for (const [base, members] of byBase) {
            if (members.length < 2) continue;                       // 혼자면 그룹이 아니다
            const leader = members.find((m) => m.recNo === base);
            if (!leader) continue;                                  // 본번 행이 없으면 묶지 않는다
            // 본번 행이 둘 이상이면 그것은 진짜 중복이다 — 그룹으로 감싸 감추지 않는다
            if (members.filter((m) => m.recNo === base).length > 1) continue;

            const leadAddr = cell(leader.row, 'lotAddress');
            const followers = members.filter((m) => m !== leader);

            // ⚠️ 주소 칸이 **비어 있으면** 컬럼이 매핑됐어도 판단 근거가 없다.
            //    빈 값끼리는 `'' === ''`로 "같아 보여" 분할모드로 오판한다
            //    (독립 리뷰 MINOR). 매핑 자체가 없는 경우와 똑같이 묶지 않는다.
            if (!leadAddr || followers.some((m) => !cell(m.row, 'lotAddress'))) continue;

            const sameAddress = followers.every((m) => cell(m.row, 'lotAddress') === leadAddr);
            const mode = sameAddress ? 'split' : 'sublot';
            const id = `imp-${base}`;

            groupOf.set(leader.rowIndex, {
                id, mode, size: members.length, leaderRow: leader.rowIndex, cropIndex: 0,
                // ⚠️ `subLots`는 **여기서 만들지 않는다.** 이 함수는 중복 판정 전에 돌아
                //    건너뛸 행까지 넣게 되는데, 그 값은 어차피 행 루프 뒤 후처리가
                //    `status === 'sub'`인 항목만으로 통째로 덮는다.
                //    한때 여기서도 만들었다가 **덮여서 도달하지 않는 죽은 코드**가 됐고,
                //    변이 검증이 그것을 잡아냈다(면적 전달을 없애도 테스트가 통과했다).
                //    출처를 하나로 둔다 — 아래 "하위필지 선두의 subLots를 다시 만든다" 참조.
            });
            followers.forEach((m, i) => {
                groupOf.set(m.rowIndex, {
                    id, mode, size: members.length, leaderRow: leader.rowIndex,
                    cropIndex: i + 1,
                });
            });
        }
        return groupOf;
    }

    /** 번호 집합에서 다음 번호를 추정한다 (매니저 미준비 시 폴백) */
    function inferNextNumber(existing) {
        let maxN = 0;
        existing.forEach((n) => {
            const v = parseInt(n, 10);
            if (!Number.isNaN(v) && v > maxN) maxN = v;
        });
        return maxN + 1;
    }

    /**
     * 파싱된 행 + 매핑 → 미리보기 항목·집계 (순수 함수).
     *
     * 반환 `null`은 "미리보기를 만들 수 없음"이다 — 행이 없거나, 매핑이 없거나,
     * 식별 필드(성명·지번주소·접수번호)가 하나도 매핑되지 않은 경우.
     *
     * @param {Object} o
     * @param {Array<Array<string>>} o.rows
     * @param {Object} o.mapping  { 필드키: 컬럼인덱스 }
     * @param {string} o.landClass1
     * @param {boolean} [o.autoNumber]
     * @param {'skip'|'overwrite'} [o.dupPolicy]
     * @param {Set<string>} [o.existing]      일반 시퀀스 기존 번호
     * @param {number|null} [o.nextNumber]    일반 시퀀스 시작 번호
     * @param {Set<string>} [o.existingFill]  성토 시퀀스 기존 번호
     * @param {number|null} [o.nextFillNumber] 성토 시퀀스 시작 번호(F 접두 없이)
     * @param {Set<string>} [o.existingLiteral] 수동 번호 중복 판정용 — 표기 그대로, 시퀀스 통합
     * @param {Array<Object>} [o.logs] 기존 레코드. 주면 위 세 풀을 여기서 도출한다(권장).
     *   개별 풀 인자는 단위 테스트 주입용이다.
     */
    function computePreview(o) {
        const rows = o.rows || [];
        const mapping = o.mapping || {};
        const landClass1 = o.landClass1 || LAND_CLASS1_DEFAULT;
        const dupPolicy = o.dupPolicy || 'skip';
        // 세 풀은 항상 같은 로그에서 나와야 한다. `logs`를 주면 여기서 도출하므로
        // 호출부가 하나를 빠뜨릴 수 없다 — 빠뜨리면 그 검사가 조용히 사라진다
        // (SAMPL-1-153 리뷰에서 실제로 그렇게 중복 검사가 없어졌다).
        // 개별 풀 인자는 단위 테스트에서 특정 상태를 주입할 때만 쓴다.
        // logs를 줬는데 배열이 아니면(손상된 localStorage 등) 조용히 넘기지 않는다 —
        // 그러면 세 풀이 모두 비어 중복 검사가 사라진다.
        if (o.logs != null && !Array.isArray(o.logs)) {
            logWarn('[가져오기] computePreview: logs가 배열이 아님 — 중복 검사가 비어 있게 됩니다', o.logs);
        }
        const hasLogs = Array.isArray(o.logs);
        const existing = hasLogs ? collectExistingNumbers(o.logs, landClass1) : (o.existing || new Set());
        const existingFill = hasLogs ? collectExistingNumbers(o.logs, landClass1, { fill: true }) : (o.existingFill || new Set());
        // 수동 번호 중복 판정용 — 표기 그대로, 두 시퀀스 통합
        const existingLiteral = hasLogs ? collectLiteralNumbers(o.logs, landClass1) : (o.existingLiteral || new Set());

        const mappedKeys = Object.keys(mapping);
        // 최소 1개 식별 필드가 매핑돼야 의미 있음
        const hasIdentity = mapping.name != null || mapping.lotAddress != null || mapping.receptionNumber != null;
        if (rows.length === 0 || mappedKeys.length === 0 || !hasIdentity) return null;

        // 접수번호 컬럼이 매핑되지 않았으면 자동부여가 강제된다
        const autoAll = !!o.autoNumber || mapping.receptionNumber == null;

        // 커서는 autoAll이 아니어도 반드시 초기화한다 — 접수번호 컬럼은 매핑됐지만
        // 특정 행의 칸만 빈 경우에도 자동부여로 넘어가기 때문이다.
        // (초기화를 autoAll로 감싸면 그 행의 번호가 String(null) → 'null'이 된다 → SAMPL-1-151)
        let nextNum = o.nextNumber != null ? o.nextNumber : inferNextNumber(existing);
        let nextFill = o.nextFillNumber != null ? o.nextFillNumber : inferNextNumber(existingFill);

        // 배치 내 사용 번호 — 두 시퀀스가 독립이므로 집합도 따로 둔다
        // (일반 5와 성토 F5는 충돌이 아니다)
        const seenInBatch = new Set();
        const seenFillInBatch = new Set();
        // 수동 번호 중복 판정용 배치 집합 (표기 그대로, 시퀀스 무관)
        const seenLiteralInBatch = new Set();

        // ------------------------------------------------------------------
        // 서브넘버 그룹 사전 판별 (SAMPL-1-154)
        //
        // `-N` 접미사는 이 저장소에서 **두 가지**를 뜻한다 (soil-script.js:2054 주석):
        //    분할모드 = 한 지번에 작물 여럿  → 5, 5-1  (지번주소 **같음**)
        //    하위필지 = 한 접수에 지번 여럿  → 5, 5-1  (지번주소 **다름**)
        // 대장 내보내기는 하위필지를 `{본번}-{n}` + 각자의 지번주소로 쓰므로
        // (soil-script.js:4856) 내보내기→가져오기 왕복이 이 판별에 달려 있다.
        //
        // ⚠️ **본번 행(`5`)이 배치에 있을 때만 묶는다.** `5-1`, `5-2`만 온 파일은
        //    의도를 알 수 없으므로 추측하지 않고 각자 원문 번호로 등록한다.
        //    이 티켓의 목적은 "묶는 것"이 아니라 **조용한 유실을 없애는 것**이다.
        const groupOf = buildSubNumberGroups(rows, mapping, autoAll);

        const items = [];
        // `sub` = 하위필지로 선두 행에 접힌 행. 신규도 중복도 아니므로 따로 센다 —
        // 어느 쪽에 섞어도 사용자가 읽는 숫자가 거짓이 된다 (SAMPL-1-154).
        const stats = { total: rows.length, new: 0, dup: 0, err: 0, sub: 0 };

        rows.forEach((row, rowIndex) => {
            const get = (key) => {
                const idx = mapping[key];
                if (idx == null || idx < 0) return '';
                return String(row[idx] ?? '').trim();
            };
            const rec = {
                name: get('name'),
                phoneNumber: get('phoneNumber'),
                lotAddress: get('lotAddress'),
                cropsDisplay: get('cropsDisplay'),
                area: get('area'),
                subCategory: get('subCategory'),
                purpose: get('purpose'),
                note: get('note'),
                businessRegNo: get('businessRegNo'),
                addressRoad: get('addressRoad'),
                date: get('date'),
                landClass1,
            };

            // 식별 정보 없는 빈 행 → 오류
            if (!rec.name && !rec.lotAddress) {
                stats.err++;
                items.push({ status: 'err', reason: '성명·주소 없음', display: '(빈 행)', rec });
                return;
            }

            let recNo;
            let useAuto = autoAll;
            if (!useAuto) {
                recNo = get('receptionNumber');
                // 매핑은 있으나 그 칸이 빈 행은 자동부여로 넘긴다
                if (!recNo) useAuto = true;
            }

            // 성토는 F 접두의 별 시퀀스다. 이 분기가 없으면 성토 행에 일반 번호가 찍히고,
            // 저장된 성토 레코드는 일반 풀에서 제외돼 카운터가 전진하지 않아
            // 전 행이 같은 번호로 저장된다 (SAMPL-1-153).
            const isFill = rec.subCategory === '성토';
            const pool = isFill ? existingFill : existing;
            const seenPool = isFill ? seenFillInBatch : seenInBatch;

            // ------------------------------------------------------------------
            // 불변식: **`F` 접두 ⟺ subCategory === '성토'** (SAMPL-2-30)
            //
            // 이 불변식이 코드로 강제되지 않아, 대장을 내보낸 뒤 **구분 컬럼을 매핑하지
            // 않고** 재가져오면 기존 `F1` 성토 행이 `subCategory='-'`인 두 번째 F1
            // 레코드로 저장됐다. 그 레코드는 일반 풀에서도(F 접두라) 성토 풀에서도
            // (구분이 성토가 아니라) 빠져 **두 시퀀스 어디에도 보이지 않는 유령 번호**가 된다.
            //
            // 방향이 둘이라 서로 다르게 다룬다:
            //   F인데 성토가 아니다 → **막는다.** 저장하면 되돌리기 어려운 오염이고,
            //                          사용자가 할 일(구분 컬럼 매핑)이 분명하다.
            //   성토인데 F가 아니다 → **경고만.** 여기서 `F`를 붙여 정규화하면
            //                          SAMPL-1-153이 리뷰로 확정한 "수동 번호는 표기
            //                          그대로, 시퀀스 무관 비교" 계약이 깨진다
            //                          (성토 '1'이 'F1'이 되면 기존 일반 '1'과의
            //                          충돌을 놓친다). 계약은 두고 사람이 알게 한다.
            //
            // ⚠️ 접두 판정은 **대문자 `F`만** 본다. 한때 `/^f/i`로 소문자까지 받았는데,
            //    정작 성토 번호를 숫자로 바꾸는 곳들(`collectExistingNumbers`,
            //    `reception-number.js`, 채번 키)은 전부 `replace('F','')` 즉 대문자만
            //    벗긴다. 그래서 `f3`을 F로 인정하면 `parseInt('f3')`가 NaN이 되어
            //    **성토 커서가 전진하지 않고** 미리보기와 실제 채번이 어긋난다
            //    (독립 리뷰 MAJOR — 내가 만든 불일치였다).
            //    대소문자 통일은 그 11개 지점의 채번 의미를 함께 바꾸는 일이라 별건이고,
            //    여기서는 **소문자를 아예 막는다** (경고만으로는 오염을 못 막는다 —
            //    저장되면 커서가 전진하지 않아 죽은 번호가 남는다).
            let invariantWarn;
            if (!useAuto) {
                const literalNo = String(recNo).trim();

                // 소문자 `f`는 **막는다.** 한때 경고만 붙였는데, 그러면 사용자가 그대로
                // 저장할 수 있고 저장된 `f3`은 `parseInt('f3')`가 NaN이라 채번 커서에
                // 반영되지 않는다 — 목록 정렬·자동채번·중복 판정 어디에서도 숫자로
                // 취급되지 않는 죽은 번호가 남는다 (독립 리뷰 2라운드 MAJOR).
                // 경고는 **알려주기만 할 뿐 오염을 막지 못한다.**
                if (/^f/.test(literalNo)) {
                    stats.err++;
                    items.push({
                        status: 'err',
                        reason: '접수번호가 소문자 f로 시작합니다 — 대문자 F로 고쳐 주세요 (소문자는 번호로 인식되지 않습니다)',
                        display: recNo, rec,
                    });
                    return;
                }

                // 같은 이유로 **형식 자체를 검사한다.** `abc`·`Fabc`·`12abc`처럼
                // 숫자로 파싱되지 않는 번호는 예전부터 그냥 저장됐는데, 저장된 뒤
                // `parseInt`가 NaN이거나 앞부분만 잘려 **채번 커서·정렬·중복 판정이
                // 전부 어긋난다**. 소문자 f만 막고 이쪽을 두면 같은 구멍이 남는다
                // (독립 리뷰 3라운드 MAJOR — 내가 만든 것은 아니나 같은 계열이다).
                //
                // 허용 형식: `5` · `5-1` · `F5` · `F5-1` (본번 + 선택적 가지번호)
                if (!/^F?\d+(-\d+)*$/.test(literalNo)) {
                    stats.err++;
                    items.push({
                        status: 'err',
                        reason: '접수번호 형식이 아닙니다 — 숫자, 5-1 같은 가지번호, 성토는 F5 형식만 됩니다',
                        display: recNo, rec,
                    });
                    return;
                }

                const hasF = /^F/.test(literalNo);
                if (hasF && !isFill) {
                    stats.err++;
                    items.push({
                        status: 'err',
                        reason: 'F 접두는 성토 전용입니다 — 구분 컬럼을 매핑하거나 번호에서 F를 빼세요',
                        display: recNo, rec,
                    });
                    return;
                }
                if (!hasF && isFill) {
                    invariantWarn = '성토인데 F 접두가 없습니다 — 이 번호는 일반 목록에서 보이지 않습니다';
                }
            }

            if (useAuto) {
                // 기존·배치 양쪽을 피해 증가시킨다
                let candidate = isFill ? nextFill : nextNum;
                while (pool.has(String(candidate)) || seenPool.has(String(candidate))) candidate++;
                seenPool.add(String(candidate));
                recNo = isFill ? `F${candidate}` : String(candidate);
                // 뒤따르는 수동 행이 이 번호와 충돌하는 것을 감지해야 한다
                seenLiteralInBatch.add(recNo);
                if (isFill) nextFill = candidate + 1;
                else nextNum = candidate + 1;
                stats.new++;
                items.push({ status: 'new', display: recNo, rec: { ...rec, receptionNumber: undefined }, auto: true });
            } else {
                const literal = String(recNo).trim();
                const base = literal.split('-')[0].trim();
                const group = groupOf.get(rowIndex);

                // 중복 판정은 **표기 그대로, 시퀀스 무관**이다 (폼 등록 경로와 동일 규칙).
                // 시퀀스별로 나눠 판정하면 구분='성토' 행의 수동 번호 `5`가 일반 `5`와
                // 충돌하는 것을 놓쳐 같은 번호가 두 건 저장된다.
                //
                // ⚠️ 비교 키는 `base`가 아니라 `literal`이다. 본번으로 접으면 `5-1`이
                //    `5`를 점유해 뒤따르는 `5-2`가 "중복"으로 버려진다 (SAMPL-1-154).
                const isDup = existingLiteral.has(literal) || seenLiteralInBatch.has(literal);
                const willBeSaved = !(isDup && dupPolicy === 'skip');
                seenLiteralInBatch.add(literal);

                // 커서는 시퀀스별로 올린다 — 매니저가 그 시퀀스로 채번하기 때문이다.
                // 성토 시퀀스는 F를 떼고 숫자만 본다 (computeNextNumber와 동일).
                //
                // 저장되지 않는 행(건너뛰는 중복)의 번호는 배치 집합에도 넣지 않는다.
                // 넣으면 뒤따르는 자동부여 행이 그 번호를 피해 가면서 미리보기가
                // 실제 저장 번호보다 앞서 나간다 (미리보기 ≠ 저장).
                const key = isFill ? base.replace('F', '') : base;
                if (willBeSaved) seenPool.add(key);

                // 수동 번호가 실제로 저장되면 매니저의 max+1 채번이 그 번호를 넘어간다.
                // 미리보기 커서도 같이 올려야 뒤따르는 자동부여 행의 표시 번호가 실제와 맞는다
                // (기존 최대 10에 수동 50을 저장하면 다음 자동번호는 11이 아니라 51이다).
                if (willBeSaved) {
                    const baseNum = parseInt(key, 10);
                    if (!Number.isNaN(baseNum)) {
                        if (isFill) { if (baseNum + 1 > nextFill) nextFill = baseNum + 1; }
                        else if (baseNum + 1 > nextNum) nextNum = baseNum + 1;
                    }
                }

                if (isDup) {
                    stats.dup++;
                    items.push({
                        status: 'dup', display: recNo, skip: dupPolicy === 'skip',
                        rec: { ...rec, receptionNumber: recNo }, group, warn: invariantWarn,
                    });
                } else if (group && group.mode === 'sublot' && group.cropIndex > 0) {
                    stats.sub++;
                    // 하위필지 행은 **선두 행 안으로 접힌다** — 별 레코드가 아니다.
                    // `dup`가 아니므로 조용히 버려지지 않고, `new`도 아니므로
                    // 등록 건수를 부풀리지도 않는다. 사용자에게는 "묶임"으로 보인다.
                    items.push({
                        status: 'sub', display: recNo,
                        rec: { ...rec, receptionNumber: recNo }, group, warn: invariantWarn,
                    });
                } else {
                    stats.new++;
                    items.push({ status: 'new', display: recNo, rec: { ...rec, receptionNumber: recNo }, group, warn: invariantWarn });
                }
            }
        });

        // ------------------------------------------------------------------
        // 하위필지 선두의 subLots를 **실제로 접힐 행만으로** 다시 만든다.
        //
        // `buildSubNumberGroups`는 중복 판정 전에 돌기 때문에 잠정치에 건너뛸 행까지
        // 들어 있다. 그대로 두면 미리보기가 "⚠️ 중복 · 건너뜀"이라 말한 행이
        // **선두 레코드 안에 되살아나** 미리보기와 저장이 어긋난다 (독립 리뷰 MAJOR).
        //
        // 접히는 것은 `status === 'sub'`인 행뿐이다:
        //   - `dup` + 건너뛰기 → 어디에도 저장되지 않는다 (미리보기 그대로)
        //   - `dup` + 덮어쓰기 → **자기 레코드로** 저장된다. 여기 또 넣으면 두 번 저장된다
        //   - `err`            → 저장되지 않는다
        //
        // rows와 items는 1:1이다 (모든 행이 정확히 한 항목을 push한다).
        //
        // ⚠️ **한 번만 순회한다.** 선두마다 items 전체를 filter하면 O(n²)이라
        //    "1만 그룹 × 2만 행" 같은 대량 가져오기에서 화면이 멎는다 (독립 리뷰 MAJOR).
        //    `PREVIEW_ROW_LIMIT`은 그리는 행만 제한할 뿐 계산량은 줄이지 않는다.
        const subLotsByGroup = new Map();
        const leadsByGroup = new Map();
        for (const it of items) {
            if (!it.group) continue;
            if (it.group.mode !== 'sublot') continue;
            if (it.group.cropIndex === 0) {
                leadsByGroup.set(it.group.id, it);
            } else if (it.status === 'sub') {
                if (!subLotsByGroup.has(it.group.id)) subLotsByGroup.set(it.group.id, []);
                subLotsByGroup.get(it.group.id).push({
                    lotAddress: it.rec.lotAddress || '',
                    cropsDisplay: it.rec.cropsDisplay || '',
                    area: it.rec.area || '',
                });
            }
        }
        for (const [gid, lead] of leadsByGroup) {
            lead.group = { ...lead.group, subLots: subLotsByGroup.get(gid) || [] };
        }

        // 실제 등록될 건수 = new + (덮어쓰기 정책의 dup)
        const willImport = items.filter(it =>
            it.status === 'new' || (it.status === 'dup' && !it.skip)
        ).length;

        return { items, stats, willImport, landClass1 };
    }

    /** 속성 위치 전용 이스케이프 — 본문용 escapeHtml을 속성에 쓰면 안 된다 (SAMPL-2-32) */
    function escapeAttrLocal(s) {
        if (typeof window.escapeAttr === 'function') return window.escapeAttr(s);
        return String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function escapeHtml(s) {
        // window.escapeHTML은 따옴표를 변환하지 않는다 (SAMPL-2-32). 위임하지 않는다.
        // 속성 위치라면 window.escapeAttr를 쓸 것.
        return String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function toast(msg, type) {
        if (typeof window.showToast === 'function') return window.showToast(msg, type);
        if (window.toast && typeof window.toast.show === 'function') return window.toast.show(msg, type);
        (type === 'error' ? console.error : console.log)('[가져오기]', msg);
    }

    function logWarn(...args) { (window.logger?.warn || console.warn)(...args); }
    function logErr(...args) { (window.logger?.error || console.error)(...args); }

    // ============================================================
    // 스코프드 스타일 (1회 주입)
    // ============================================================
    const STYLE_ID = 'soil-importer-style';
    function injectStyle() {
        if (document.querySelector(`style[data-soil-importer]`)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.setAttribute('data-soil-importer', '');
        style.textContent = `
.sri-overlay{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;
  background:rgba(15,23,42,.55);backdrop-filter:blur(3px);padding:24px 14px;overflow-y:auto}
.sri-overlay[hidden]{display:none}
.sri-dialog{font-family:'Noto Sans KR','Inter',system-ui,sans-serif;width:100%;max-width:1040px;margin:auto;
  background:#fff;border-radius:18px;box-shadow:0 30px 90px rgba(15,23,42,.32);overflow:hidden;
  border:1px solid #e2e8f0;display:flex;flex-direction:column;max-height:calc(100vh - 48px)}
.sri-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 24px;
  border-bottom:1px solid #e2e8f0;background:linear-gradient(135deg,#f0fdf4 0%,#eff6ff 100%);flex:0 0 auto}
.sri-header h2{margin:0;font-size:1.18rem;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:9px}
.sri-close{border:1px solid #e2e8f0;background:#fff;border-radius:10px;width:36px;height:36px;cursor:pointer;
  font-size:1rem;color:#64748b;transition:all .2s;display:flex;align-items:center;justify-content:center;line-height:1}
.sri-close:hover{background:#fef2f2;color:#ef4444;border-color:#fecaca}
.sri-body{padding:22px 24px;overflow-y:auto;flex:1 1 auto}
.sri-sec{margin-bottom:24px}
.sri-sec:last-child{margin-bottom:0}
.sri-sec>h3{font-size:.98rem;font-weight:600;margin:0 0 12px;color:#0f172a;display:flex;align-items:center;gap:8px}
.sri-stepnum{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;
  background:#22c55e;color:#fff;font-size:.74rem;font-weight:700;flex:0 0 auto}
.sri-help{font-size:.8rem;color:#64748b;margin:0 0 10px;line-height:1.5}
/* mode toggle */
.sri-mode{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.sri-mode label{flex:1;min-width:200px;display:flex;align-items:center;gap:10px;cursor:pointer;padding:12px 16px;
  border:1.5px solid #e2e8f0;border-radius:12px;transition:all .2s;background:#fff}
.sri-mode label:hover{border-color:#bbf7d0}
.sri-mode label.active{border-color:#22c55e;background:#f0fdf4;box-shadow:0 2px 8px rgba(34,197,94,.12)}
.sri-mode input{accent-color:#22c55e;width:17px;height:17px;margin:0}
.sri-mt-title{font-weight:600;font-size:.92rem;color:#1e293b}
.sri-mt-sub{font-size:.76rem;color:#64748b;display:block;margin-top:1px}
/* dropzone */
.sri-dropzone{border:2px dashed #93c5fd;border-radius:14px;padding:28px 20px;text-align:center;
  background:linear-gradient(180deg,#f0f9ff,#fff);transition:all .2s;cursor:pointer}
.sri-dropzone:hover,.sri-dropzone.is-dragover{border-color:#3b82f6;background:#eff6ff}
.sri-dz-icon{font-size:2.2rem;display:block;margin-bottom:8px}
.sri-dz-main{font-weight:600;font-size:.94rem;margin-bottom:4px;color:#1e293b}
.sri-dz-sub{font-size:.8rem;color:#64748b}
.sri-dz-btn{margin-top:14px;border:none;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;
  padding:10px 22px;border-radius:10px;font-weight:600;cursor:pointer;font-size:.88rem;font-family:inherit}
.sri-dz-btn:hover{filter:brightness(1.05)}
.sri-fileinfo{margin-top:12px;font-size:.84rem;color:#166534;background:#f0fdf4;border:1px solid #bbf7d0;
  border-radius:10px;padding:8px 12px;display:flex;align-items:center;gap:6px}
.sri-fileinfo[hidden]{display:none}
.sri-file-opts{display:flex;gap:12px;margin-top:14px;flex-wrap:wrap}
.sri-file-opts[hidden]{display:none}
.sri-fo{flex:1;min-width:150px}
.sri-fo label{font-size:.8rem;color:#475569;display:block;margin-bottom:5px;font-weight:500}
.sri-fo .sri-chk{display:flex;align-items:center;gap:7px;font-size:.84rem;color:#475569;cursor:pointer;margin-top:24px}
/* paste */
.sri-paste[hidden]{display:none}
.sri-paste textarea{width:100%;min-height:120px;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 14px;
  font-family:'SF Mono',ui-monospace,Menlo,monospace;font-size:.82rem;resize:vertical;color:#1e293b;line-height:1.5}
.sri-paste textarea:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
.sri-paste .sri-chk{display:flex;align-items:center;gap:7px;font-size:.84rem;color:#475569;cursor:pointer;margin-top:10px}
/* selects/inputs */
.sri-dialog select,.sri-input{width:100%;padding:9px 12px;border:1.5px solid #e2e8f0;border-radius:10px;
  font-family:inherit;font-size:.88rem;background:#fff;color:#1e293b;cursor:pointer}
.sri-dialog select:focus,.sri-input:focus{outline:none;border-color:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.12)}
.sri-chk input,.sri-radio input{accent-color:#22c55e;width:16px;height:16px;margin:0}
/* mapping */
.sri-maphead{display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.sri-automap{border:1.5px solid #22c55e;background:#fff;color:#16a34a;padding:8px 16px;border-radius:10px;
  font-weight:600;cursor:pointer;font-size:.84rem;font-family:inherit;transition:all .2s;margin-left:auto}
.sri-automap:hover{background:#22c55e;color:#fff}
.sri-mapgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px 16px}
.sri-maprow{display:flex;align-items:center;gap:8px}
/* 공익직불제 강조 (경지구분1차='공익직불제'일 때) */
.sri-mapgrid.gongik-active .sri-maprow--gongik{background:#ecfdf5;border:1.5px solid #22c55e;
  border-radius:10px;padding:8px 10px}
.sri-maprow--gongik .sri-gbadge{display:none;margin-left:6px;font-size:.66rem;font-weight:700;color:#fff;
  background:#22c55e;border-radius:8px;padding:1px 6px;white-space:nowrap}
.sri-mapgrid.gongik-active .sri-maprow--gongik .sri-gbadge{display:inline-flex;align-items:center}
.sri-maplabel{flex:0 0 78px;font-size:.83rem;color:#334155;font-weight:500}
.sri-maplabel .sri-opt{color:#94a3b8;font-weight:400;font-size:.74rem}
.sri-maparrow{color:#94a3b8;flex:0 0 auto}
.sri-maprow select{flex:1;min-width:0}
/* bulk landclass */
.sri-bulk{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:#f0fdf4;border:1px solid #bbf7d0;
  border-radius:12px;padding:14px 18px}
.sri-bulk-label{font-weight:600;font-size:.9rem;flex:0 0 auto;color:#166534}
.sri-bulk select{flex:1;min-width:180px;max-width:240px}
.sri-bulk .sri-bulk-note{font-size:.8rem;color:#64748b}
/* options */
.sri-opts{display:flex;flex-direction:column;gap:10px}
.sri-chk,.sri-radio{display:flex;align-items:center;gap:9px;font-size:.88rem;cursor:pointer;color:#334155}
.sri-opt-sub{display:flex;gap:18px;padding-left:26px;margin-top:2px;flex-wrap:wrap}
.sri-muted{color:#64748b;font-size:.8rem}
/* preview */
.sri-pv-summary{display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap}
.sri-pill{padding:6px 14px;border-radius:20px;font-size:.82rem;font-weight:600;display:flex;align-items:center;gap:6px}
.sri-pill.new{background:#dcfce7;color:#166534}
.sri-pill.dup{background:#fef3c7;color:#92400e}
.sri-pill.err{background:#fee2e2;color:#991b1b}
/* 하위필지로 접힌 행 — 중복(노랑)과 **다른 색**이어야 한다. 같은 색이면
   사용자가 여전히 "버려졌다"고 읽는다 (SAMPL-1-154). */
.sri-pill.sub{background:#dbeafe;color:#1e40af}
.sri-pv-empty{padding:18px;text-align:center;color:#94a3b8;font-size:.86rem;border:1px dashed #e2e8f0;border-radius:12px}
.sri-pv-wrap{border:1px solid #e2e8f0;border-radius:12px;overflow:auto;max-height:260px}
.sri-pv-table{margin:0;border-collapse:collapse;font-size:.8rem;min-width:640px;width:100%}
.sri-pv-table th{position:sticky;top:0;z-index:1;background:#f8fafc;font-weight:600;color:#334155;font-size:.76rem;
  padding:8px 10px;text-align:left;border-bottom:1px solid #e2e8f0;white-space:nowrap}
.sri-pv-table td{padding:7px 10px;border-bottom:1px solid #f1f5f9;color:#334155;white-space:nowrap}
.sri-pv-table tr:last-child td{border-bottom:0}
.sri-pv-table tr.is-dup td{background:#fffbeb}
.sri-pv-table tr.is-err td{background:#fef2f2}
.sri-pv-table td.addr{white-space:normal;min-width:160px;max-width:240px}
.sri-status{padding:2px 9px;border-radius:12px;font-size:.72rem;font-weight:600;white-space:nowrap}
.sri-status.new{background:#dcfce7;color:#166534}
.sri-status.dup{background:#fef3c7;color:#92400e}
.sri-status.err{background:#fee2e2;color:#991b1b}
.sri-status.sub{background:#dbeafe;color:#1e40af}
.sri-status.warn{background:#fef3c7;color:#92400e;margin-left:4px}
.sri-reason{font-size:.72rem;color:#991b1b;white-space:normal;max-width:220px;margin-top:2px}
.sri-pv-table tr.is-sub td{background:#eff6ff}
.sri-pv-overflow{padding:8px 10px;font-size:.78rem;color:#94a3b8;text-align:center}
/* footer */
.sri-footer{display:flex;align-items:center;gap:12px;padding:16px 24px;border-top:1px solid #e2e8f0;
  background:#f8fafc;flex:0 0 auto;flex-wrap:wrap}
.sri-footer-note{font-size:.83rem;color:#64748b}
.sri-spacer{flex:1}
.sri-btn-cancel{border:1.5px solid #e2e8f0;background:#fff;color:#475569;padding:10px 22px;border-radius:11px;
  font-weight:600;cursor:pointer;font-size:.9rem;font-family:inherit}
.sri-btn-cancel:hover{background:#f1f5f9}
.sri-btn-import{border:none;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;padding:10px 26px;
  border-radius:11px;font-weight:700;cursor:pointer;font-size:.9rem;font-family:inherit;
  box-shadow:0 4px 14px rgba(34,197,94,.3);display:flex;align-items:center;gap:7px}
.sri-btn-import:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 18px rgba(34,197,94,.4)}
.sri-btn-import:disabled{opacity:.5;cursor:not-allowed;box-shadow:none}
.sri-btn-dlerr{border:1.5px solid #fca5a5;background:#fff1f2;color:#b91c1c;padding:10px 18px;border-radius:11px;
  font-weight:600;cursor:pointer;font-size:.88rem;font-family:inherit;transition:all .2s}
.sri-btn-dlerr:hover{background:#fee2e2;border-color:#f87171}
.sri-btn-dlerr[hidden]{display:none}
@media (max-width:880px){
  .sri-mapgrid{grid-template-columns:1fr 1fr}
}
@media (max-width:640px){
  .sri-mapgrid{grid-template-columns:1fr}
  .sri-body{padding:18px 16px}
  .sri-header,.sri-footer{padding:14px 16px}
  .sri-bulk select{max-width:none}
}
/* 다크 모드 */
[data-theme="dark"] .sri-dialog{background:#1c1917;border-color:rgba(148,163,184,.2)}
[data-theme="dark"] .sri-header{background:linear-gradient(135deg,rgba(34,197,94,.12),rgba(59,130,246,.1));
  border-bottom-color:rgba(148,163,184,.15)}
[data-theme="dark"] .sri-header h2{color:#f1f5f9}
[data-theme="dark"] .sri-close{background:#292524;border-color:#44403c;color:#a8a29e}
[data-theme="dark"] .sri-sec>h3{color:#e5e7eb}
[data-theme="dark"] .sri-help,[data-theme="dark"] .sri-muted,[data-theme="dark"] .sri-bulk-note{color:#a8a29e}
[data-theme="dark"] .sri-mode label{background:#292524;border-color:#44403c}
[data-theme="dark"] .sri-mode label.active{background:rgba(34,197,94,.12);border-color:#22c55e}
[data-theme="dark"] .sri-mt-title{color:#e5e7eb}
[data-theme="dark"] .sri-dropzone{background:linear-gradient(180deg,rgba(59,130,246,.08),#1c1917);border-color:#3b6ea5}
[data-theme="dark"] .sri-dz-main{color:#e5e7eb}
[data-theme="dark"] .sri-dialog select,[data-theme="dark"] .sri-input,[data-theme="dark"] .sri-paste textarea{
  background:#292524;color:#e5e7eb;border-color:#57534e}
[data-theme="dark"] .sri-maplabel,[data-theme="dark"] .sri-chk,[data-theme="dark"] .sri-radio,
[data-theme="dark"] .sri-fo label{color:#d6d3d1}
[data-theme="dark"] .sri-bulk{background:rgba(34,197,94,.08);border-color:rgba(34,197,94,.25)}
[data-theme="dark"] .sri-bulk-label{color:#86efac}
[data-theme="dark"] .sri-pv-wrap{border-color:#44403c}
[data-theme="dark"] .sri-pv-table th{background:#292524;color:#d6d3d1;border-bottom-color:#44403c}
[data-theme="dark"] .sri-pv-table td{color:#d6d3d1;border-bottom-color:#332f2c}
[data-theme="dark"] .sri-pv-table tr.is-dup td{background:rgba(234,179,8,.08)}
[data-theme="dark"] .sri-pv-table tr.is-err td{background:rgba(239,68,68,.1)}
[data-theme="dark"] .sri-pv-empty{border-color:#44403c;color:#78716c}
[data-theme="dark"] .sri-footer{background:#231f1d;border-top-color:#44403c}
[data-theme="dark"] .sri-btn-cancel{background:#292524;color:#d6d3d1;border-color:#57534e}
[data-theme="dark"] .sri-btn-dlerr{background:#2d1515;border-color:#7f1d1d;color:#fca5a5}
[data-theme="dark"] .sri-btn-dlerr:hover{background:#3f1a1a;border-color:#ef4444}
[data-theme="dark"] .sri-mapgrid.gongik-active .sri-maprow--gongik{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.5)}
`;
        document.head.appendChild(style);
    }

    // ============================================================
    // 모달 마크업 (1회 주입)
    // ============================================================
    const MODAL_ID = 'soilImporterModal';
    function buildModal() {
        let modal = document.getElementById(MODAL_ID);
        if (modal) return modal;

        const landOpts = LAND_CLASS1_OPTIONS.map(v =>
            `<option value="${v}"${v === LAND_CLASS1_DEFAULT ? ' selected' : ''}>${v}</option>`
        ).join('');

        modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.className = 'sri-overlay';
        modal.hidden = true;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'sriTitle');
        modal.innerHTML = `
<div class="sri-dialog" role="document">
  <header class="sri-header">
    <h2 id="sriTitle">📥 토양 시료 엑셀 가져오기</h2>
    <button type="button" class="sri-close" data-act="close" aria-label="닫기">✕</button>
  </header>
  <div class="sri-body">
    <!-- 1. 입력 방식 -->
    <section class="sri-sec">
      <h3><span class="sri-stepnum">1</span> 엑셀 데이터 입력</h3>
      <div class="sri-mode" role="radiogroup" aria-label="입력 방식">
        <label class="active" data-mode-label="file">
          <input type="radio" name="sriMode" value="file" checked>
          <span><span class="sri-mt-title">📤 엑셀 파일 업로드</span><span class="sri-mt-sub">권장 · .xlsx / .xls 드래그앤드롭</span></span>
        </label>
        <label data-mode-label="paste">
          <input type="radio" name="sriMode" value="paste">
          <span><span class="sri-mt-title">📋 텍스트 붙여넣기</span><span class="sri-mt-sub">엑셀 셀 복사 → 붙여넣기</span></span>
        </label>
      </div>
      <!-- file mode -->
      <div data-area="file">
        <div class="sri-dropzone" data-el="dropzone" tabindex="0" role="button" aria-label="엑셀 파일 선택">
          <input type="file" data-el="fileInput" accept=".xlsx,.xls,.csv" hidden>
          <span class="sri-dz-icon">⬆️</span>
          <div class="sri-dz-main">파일을 여기로 끌어다 놓으세요</div>
          <div class="sri-dz-sub">또는 아래 버튼으로 파일을 선택합니다 (.xlsx / .xls / .csv)</div>
          <button type="button" class="sri-dz-btn" data-act="pick">파일 선택</button>
        </div>
        <div class="sri-fileinfo" data-el="fileInfo" hidden></div>
        <div class="sri-file-opts" data-el="fileOpts" hidden>
          <div class="sri-fo">
            <label>시트 선택</label>
            <select data-el="sheetSelect"></select>
          </div>
          <div class="sri-fo">
            <label>헤더 행</label>
            <input type="number" class="sri-input" data-el="headerRow" min="1" value="1" title="헤더가 있는 행 번호">
          </div>
          <div class="sri-fo">
            <label class="sri-chk"><input type="checkbox" data-el="noHeader"> 헤더 없음</label>
          </div>
        </div>
      </div>
      <!-- paste mode -->
      <div class="sri-paste" data-area="paste" hidden>
        <textarea data-el="textarea" placeholder="엑셀에서 셀을 복사한 뒤 여기에 붙여넣으세요 (탭 구분)&#10;예) 성명&#9;연락처&#9;지번주소&#9;작물&#9;면적&#9;구분&#9;목적&#10;홍길동&#9;010-1234-5678&#9;봉화읍 내성리 123&#9;벼&#9;1200&#9;논&#9;일반재배"></textarea>
        <label class="sri-chk"><input type="checkbox" data-el="hasHeader" checked> 첫 행은 헤더입니다</label>
      </div>
    </section>

    <!-- 2. 컬럼 매핑 -->
    <section class="sri-sec">
      <div class="sri-maphead">
        <h3 style="margin:0"><span class="sri-stepnum">2</span> 컬럼 매핑</h3>
        <button type="button" class="sri-automap" data-act="automap">✨ 자동 매핑 추정</button>
      </div>
      <p class="sri-help">엑셀의 각 컬럼이 어느 접수 항목인지 지정하세요. 접수번호는 비우면 경지구분별 자동부여됩니다.</p>
      <div class="sri-mapgrid" data-el="mapGrid"></div>
    </section>

    <!-- 3. 경지구분 1차 -->
    <section class="sri-sec">
      <h3><span class="sri-stepnum">3</span> 경지구분 1차 일괄선택</h3>
      <div class="sri-bulk">
        <span class="sri-bulk-label">🏷️ 모든 행에 적용:</span>
        <select data-el="bulkLandClass" aria-label="경지구분 1차 일괄선택">${landOpts}</select>
        <span class="sri-bulk-note">가져오는 전체 행에 동일 적용됩니다</span>
      </div>
    </section>

    <!-- 4. 옵션 -->
    <section class="sri-sec">
      <h3><span class="sri-stepnum">4</span> 옵션</h3>
      <div class="sri-opts">
        <label class="sri-chk"><input type="checkbox" data-el="autoNumber" checked> 접수번호 자동부여 <span class="sri-muted">(경지구분별 독립 시퀀스)</span></label>
        <span class="sri-muted">중복 접수번호가 있을 때:</span>
        <div class="sri-opt-sub">
          <label class="sri-radio"><input type="radio" name="sriDup" value="skip" checked> 건너뛰기</label>
          <label class="sri-radio"><input type="radio" name="sriDup" value="overwrite"> 그래도 추가 <span class="sri-muted">(같은 접수번호가 중복 등록됨)</span></label>
        </div>
      </div>
    </section>

    <!-- 5. 미리보기 -->
    <section class="sri-sec" style="margin-bottom:4px">
      <h3><span class="sri-stepnum">5</span> 미리보기</h3>
      <div class="sri-pv-summary" data-el="summary">
        <span class="sri-muted">데이터·컬럼 매핑을 지정하면 미리보기가 표시됩니다.</span>
      </div>
      <div data-el="previewBox"><div class="sri-pv-empty">아직 표시할 데이터가 없습니다.</div></div>
    </section>
  </div>
  <footer class="sri-footer">
    <span class="sri-footer-note" data-el="footerNote"></span>
    <span class="sri-spacer"></span>
    <button type="button" class="sri-btn-dlerr" data-act="dlErrorCsv" hidden>⚠️ 오류 행 CSV</button>
    <button type="button" class="sri-btn-cancel" data-act="close">취소</button>
    <button type="button" class="sri-btn-import" data-act="import" disabled>📥 가져오기</button>
  </footer>
</div>`;
        document.body.appendChild(modal);
        return modal;
    }

    // ============================================================
    // 클래스
    // ============================================================
    class SoilResultImporter {
        constructor() {
            this._els = null;
            this._built = false;
            this._state = this._initialState();
        }

        _initialState() {
            return {
                mode: 'file',
                // file
                fileName: '',
                sheets: {},
                sheetNames: [],
                activeSheet: '',
                headerRowIdx: 0,        // 0-based; -1 = 헤더 없음
                // paste
                rawText: '',
                hasHeader: true,
                // 공통
                fieldMapping: {},        // { fieldKey: colIdx }
                bulkLandClass: LAND_CLASS1_DEFAULT,
                autoNumber: true,
                dupPolicy: 'skip',       // 'skip' | 'overwrite'
                preview: null,
                // 클라우드 접수번호 (SAMPL-1-169). 모달을 열 때 **한 번만** 읽는다 —
                // `_recompute`는 키 입력마다 돌아 매번 부르면 네트워크를 두드린다.
                cloudRecords: null,
                cloudUnavailable: false,
                // "아직 안 읽음"과 "읽었지만 확인할 것이 없음"(Firebase 꺼짐)은 다르다.
                // 둘을 구별하지 않으면 꺼진 설치본에서 영영 응답을 기다리게 된다.
                cloudChecked: false,
                // ⚠️ **이 캐시가 어느 연도 것인지** 함께 들고 다닌다. 연도만 바뀌고
                //    캐시는 그대로면 지난해 번호로 올해를 검사하게 된다.
                cloudYear: null,
                // 미리보기가 **어느 연도 기준으로 계산됐는지**. 연도가 바뀐 뒤
                // 재계산 없이 곧바로 저장하는 경로를 막는 데 쓴다.
                previewYear: null,
            };
        }

        // ----------------------------------------------------------
        // 빌드 & 바인딩 (lazy)
        // ----------------------------------------------------------
        _ensureBuilt() {
            if (this._built) return;
            injectStyle();
            const modal = buildModal();
            const $ = (sel) => modal.querySelector(sel);
            const els = { modal };
            modal.querySelectorAll('[data-el]').forEach(node => {
                els[node.getAttribute('data-el')] = node;
            });
            this._els = els;
            this._bind();
            this._built = true;
        }

        _bind() {
            const m = this._els.modal;

            // 액션 버튼 (close/import/automap/pick) — 위임
            m.addEventListener('click', (e) => {
                const actEl = e.target.closest('[data-act]');
                if (!actEl || !m.contains(actEl)) return;
                const act = actEl.getAttribute('data-act');
                if (act === 'close') this.close();
                else if (act === 'import') this._commit();
                else if (act === 'automap') this._autoMap();
                else if (act === 'dlErrorCsv') this._downloadErrorCsv();
                else if (act === 'pick') { e.stopPropagation(); this._els.fileInput?.click(); }
            });
            // 오버레이 클릭 → 닫기 (다이얼로그 내부 클릭은 무시)
            m.addEventListener('mousedown', (e) => { if (e.target === m) this.close(); });

            // 모드 토글
            m.querySelectorAll('input[name="sriMode"]').forEach(r => {
                r.addEventListener('change', () => { if (r.checked) this._switchMode(r.value); });
            });

            // 붙여넣기 — **디바운스한다** (SAMPL-2-30 🔵).
            //
            // `_refresh()`는 파싱 + 전체 재계산 + 표 재렌더를 한다. 그것을 키 입력마다
            // 돌리면 수백 행을 붙여넣고 한 글자 고칠 때 입력이 눈에 띄게 끊긴다.
            // 붙여넣기 자체는 `input` 한 번이라 150ms 뒤 한 번만 돌아도 체감은 같다.
            //
            // ⚠️ 모달을 닫을 때 타이머를 반드시 정리한다. 남겨두면 닫힌 뒤 콜백이 깨어나
            //    이미 비운 상태를 만지며, 그 예외는 아무도 보지 않는다.
            this._els.textarea?.addEventListener('input', () => {
                this._state.rawText = this._els.textarea.value;
                clearTimeout(this._recomputeTimer);
                this._recomputeTimer = setTimeout(() => this._refresh(), 150);
            });
            this._els.hasHeader?.addEventListener('change', () => {
                this._state.hasHeader = this._els.hasHeader.checked;
                this._refresh();
            });

            // 파일 선택 / 드래그앤드롭
            this._els.fileInput?.addEventListener('change', (e) => {
                const f = e.target.files?.[0];
                if (f) this._handleFile(f);
                e.target.value = '';
            });
            const dz = this._els.dropzone;
            if (dz) {
                dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('is-dragover'); });
                dz.addEventListener('dragleave', () => dz.classList.remove('is-dragover'));
                dz.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dz.classList.remove('is-dragover');
                    const f = e.dataTransfer?.files?.[0];
                    if (f) this._handleFile(f);
                });
                dz.addEventListener('click', (e) => {
                    if (e.target.closest('[data-act="pick"]')) return; // 버튼이 별도 처리
                    this._els.fileInput?.click();
                });
                dz.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._els.fileInput?.click(); }
                });
            }

            // 시트 / 헤더 행 / 헤더 없음
            this._els.sheetSelect?.addEventListener('change', () => {
                this._state.activeSheet = this._els.sheetSelect.value;
                this._refresh();
            });
            this._els.headerRow?.addEventListener('input', () => {
                const v = parseInt(this._els.headerRow.value, 10);
                if (!Number.isNaN(v) && v >= 1) { this._state.headerRowIdx = v - 1; this._refresh(); }
            });
            this._els.noHeader?.addEventListener('change', () => {
                if (this._els.noHeader.checked) {
                    this._state.headerRowIdx = -1;
                    if (this._els.headerRow) this._els.headerRow.disabled = true;
                } else {
                    const v = parseInt(this._els.headerRow?.value || '1', 10);
                    this._state.headerRowIdx = Number.isNaN(v) ? 0 : Math.max(0, v - 1);
                    if (this._els.headerRow) this._els.headerRow.disabled = false;
                }
                this._refresh();
            });

            // 경지구분 1차 / 옵션
            this._els.bulkLandClass?.addEventListener('change', () => {
                this._state.bulkLandClass = this._els.bulkLandClass.value || LAND_CLASS1_DEFAULT;
                this._syncGongikHighlight();
                this._recompute(); this._renderPreview();
            });
            this._els.autoNumber?.addEventListener('change', () => {
                this._state.autoNumber = this._els.autoNumber.checked;
                this._refresh();
            });
            // ⚠️ 라디오 라벨을 "덮어쓰기"로 되돌리지 말 것 (SAMPL-2-30 ②).
            //    `_commit`은 `addImportedRecord`를 부르고 그 메서드는 항상 새 id로
            //    push하므로 **기존 레코드를 갱신하지 않는다** — 같은 접수번호가 두 줄이 된다.
            //    라벨이 동작과 다르면 사용자는 "덮어썼겠지" 하고 목록을 확인하지 않는다.
            //    진짜 upsert가 생기면 그때 문구를 바꾼다.
            //    (마크업 쪽에 이 주석을 두면 템플릿 리터럴 안의 백틱이 문자열을 끊는다 — 실측)
            m.querySelectorAll('input[name="sriDup"]').forEach(r => {
                r.addEventListener('change', () => {
                    if (r.checked) { this._state.dupPolicy = r.value; this._recompute(); this._renderPreview(); }
                });
            });

            // ESC 닫기
            this._escHandler = (e) => {
                if (e.key === 'Escape' && !this._els.modal.hidden) this.close();
            };
        }

        // ----------------------------------------------------------
        // 열기/닫기
        // ----------------------------------------------------------
        open() {
            this._ensureBuilt();
            this._state = this._initialState();
            const e = this._els;
            // UI 리셋
            if (e.textarea) e.textarea.value = '';
            if (e.hasHeader) e.hasHeader.checked = true;
            if (e.fileInput) e.fileInput.value = '';
            if (e.fileInfo) { e.fileInfo.hidden = true; e.fileInfo.textContent = ''; }
            if (e.fileOpts) e.fileOpts.hidden = true;
            if (e.sheetSelect) e.sheetSelect.innerHTML = '';
            if (e.headerRow) { e.headerRow.value = '1'; e.headerRow.disabled = false; }
            if (e.noHeader) e.noHeader.checked = false;
            if (e.bulkLandClass) e.bulkLandClass.value = LAND_CLASS1_DEFAULT;
            if (e.autoNumber) e.autoNumber.checked = true;
            this._els.modal.querySelectorAll('input[name="sriMode"]').forEach(r => { r.checked = (r.value === 'file'); });
            this._els.modal.querySelectorAll('input[name="sriDup"]').forEach(r => { r.checked = (r.value === 'skip'); });
            this._switchMode('file');
            this._renderMapping();
            this._refresh();

            this._els.modal.hidden = false;
            // 클라우드는 **여는 순간 한 번만** 읽는다. 기다리지 않는다 —
            // 담당자가 붙여넣기·매핑을 하는 동안 도착하면 그때 미리보기가 갱신된다.
            // 세대를 올려 이전 세션의 늦은 응답이 이 세션에 섞이지 않게 한다.
            this._cloudGen = (this._cloudGen || 0) + 1;
            this._loadCloudRecords(this._cloudGen);
            document.addEventListener('keydown', this._escHandler);
            // 첫 포커스 → 닫기 버튼 (접근성)
            this._els.modal.querySelector('.sri-close')?.focus();
        }

        close() {
            if (!this._els?.modal) return;
            // 재계산 디바운스 타이머를 반드시 끈다. 남겨두면 닫힌 뒤 콜백이 깨어나
            // 이미 비운 상태를 만지고, 그 예외는 아무도 보지 않는다 (SAMPL-2-30 🔵).
            clearTimeout(this._recomputeTimer);
            this._recomputeTimer = null;
            this._els.modal.hidden = true;
            document.removeEventListener('keydown', this._escHandler);
        }

        _switchMode(mode) {
            if (this._state.mode !== mode) {
                // 모드 전환 시 인덱스 기반 매핑 초기화 (의미가 다름)
                this._state.fieldMapping = {};
            }
            this._state.mode = mode;
            const m = this._els.modal;
            m.querySelector('[data-area="file"]').hidden = (mode !== 'file');
            m.querySelector('[data-area="paste"]').hidden = (mode !== 'paste');
            m.querySelectorAll('[data-mode-label]').forEach(lbl => {
                lbl.classList.toggle('active', lbl.getAttribute('data-mode-label') === mode);
            });
            if (mode === 'paste') this._els.textarea?.focus();
            this._refresh();
        }

        // ----------------------------------------------------------
        // 입력 파싱
        // ----------------------------------------------------------
        _parseInput() {
            return this._state.mode === 'file' ? this._parseFile() : this._parsePaste();
        }

        _parsePaste() {
            const text = this._state.rawText || '';
            if (!text.trim()) return { headers: [], rows: [], maxCol: 0 };
            const lines = text.split(/\r?\n/).filter(l => l.length > 0);
            const split = lines.map(l => l.split('\t'));
            const maxCol = split.reduce((mx, r) => Math.max(mx, r.length), 0);
            let headers, rows;
            if (this._state.hasHeader && split.length > 0) {
                headers = split[0].slice();
                rows = split.slice(1);
            } else {
                headers = Array.from({ length: maxCol }, (_, i) => `열 ${i + 1}`);
                rows = split;
            }
            rows = rows.map(r => {
                const padded = r.slice();
                while (padded.length < maxCol) padded.push('');
                return padded.slice(0, maxCol);
            });
            return { headers, rows, maxCol };
        }

        _parseFile() {
            const sheet = this._state.activeSheet ? this._state.sheets[this._state.activeSheet] : null;
            if (!sheet || !sheet.rows || sheet.rows.length === 0) return { headers: [], rows: [], maxCol: 0 };
            const allRows = sheet.rows;
            const maxCol = sheet.maxCol;
            const hIdx = this._state.headerRowIdx;
            let headers, rows;
            if (hIdx >= 0 && hIdx < allRows.length) {
                headers = (allRows[hIdx] || []).slice();
                rows = allRows.slice(hIdx + 1);
            } else {
                headers = Array.from({ length: maxCol }, (_, i) => `열 ${i + 1}`);
                rows = allRows;
            }
            rows = rows
                .map(r => {
                    const padded = (r || []).map(c => this._normalizeCell(c));
                    while (padded.length < maxCol) padded.push('');
                    return padded.slice(0, maxCol);
                })
                .filter(r => r.some(c => c !== '' && c != null));
            headers = headers.map(c => this._normalizeCell(c));
            while (headers.length < maxCol) headers.push('');
            headers = headers.slice(0, maxCol);
            return { headers, rows, maxCol };
        }

        _normalizeCell(value) {
            if (value == null) return '';
            if (value instanceof Date && !Number.isNaN(value.getTime())) {
                const y = value.getFullYear();
                const mo = String(value.getMonth() + 1).padStart(2, '0');
                const d = String(value.getDate()).padStart(2, '0');
                return `${y}-${mo}-${d}`;
            }
            return String(value);
        }

        // ----------------------------------------------------------
        // 파일 처리
        // ----------------------------------------------------------
        async _handleFile(file) {
            if (!file) return;
            const XLSX = window.XLSX;
            if (!XLSX) { toast('엑셀 라이브러리(XLSX)를 사용할 수 없습니다.', 'error'); return; }
            if (file.size > FILE_SIZE_HARD) {
                toast(`파일이 너무 큽니다 (${(file.size / 1048576).toFixed(0)}MB > 50MB 한계).`, 'error');
                return;
            }
            if (file.size > FILE_SIZE_WARN) {
                toast(`파일이 큰 편입니다 (${(file.size / 1048576).toFixed(1)}MB). 처리에 시간이 걸릴 수 있습니다.`, 'warning');
            }
            try {
                const buffer = await file.arrayBuffer();
                const wb = XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: true });
                if (!wb.SheetNames || wb.SheetNames.length === 0) { toast('시트를 찾을 수 없습니다.', 'error'); return; }
                const sheets = {};
                const sheetNames = [];
                for (const name of wb.SheetNames) {
                    const ws = wb.Sheets[name];
                    const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
                    const maxCol = aoa.reduce((mx, r) => Math.max(mx, (r || []).length), 0);
                    sheets[name] = { rows: aoa, maxCol };
                    sheetNames.push(name);
                }
                this._state.fileName = file.name;
                this._state.sheets = sheets;
                this._state.sheetNames = sheetNames;
                this._state.activeSheet = sheetNames[0];
                this._state.headerRowIdx = 0;
                this._state.fieldMapping = {};

                // paste 모드에서 파일 드롭 시 file 모드로 전환
                if (this._state.mode !== 'file') {
                    this._state.mode = 'file';
                    this._els.modal.querySelectorAll('input[name="sriMode"]').forEach(r => { r.checked = (r.value === 'file'); });
                    this._els.modal.querySelector('[data-area="file"]').hidden = false;
                    this._els.modal.querySelector('[data-area="paste"]').hidden = true;
                    this._els.modal.querySelectorAll('[data-mode-label]').forEach(lbl => {
                        lbl.classList.toggle('active', lbl.getAttribute('data-mode-label') === 'file');
                    });
                }

                if (this._els.fileInfo) {
                    this._els.fileInfo.innerHTML = `📄 <strong>${escapeHtml(file.name)}</strong> · 시트 ${sheetNames.length}개`;
                    this._els.fileInfo.hidden = false;
                }
                this._renderSheetSelect();
                if (this._els.headerRow) { this._els.headerRow.value = '1'; this._els.headerRow.disabled = false; }
                if (this._els.noHeader) this._els.noHeader.checked = false;
                if (this._els.fileOpts) this._els.fileOpts.hidden = false;

                this._refresh();
                // 자동 매핑 시도 (헤더가 있을 때 편의)
                this._autoMap(true);
                toast(`✅ ${file.name} 로드 완료 (시트 ${sheetNames.length}개)`, 'success');
            } catch (err) {
                logErr('엑셀 파일 파싱 실패:', err);
                toast('엑셀 파일을 읽을 수 없습니다.', 'error');
            }
        }

        _renderSheetSelect() {
            const sel = this._els.sheetSelect;
            if (!sel) return;
            sel.innerHTML = '';
            for (const name of this._state.sheetNames) {
                const opt = document.createElement('option');
                opt.value = name;
                const sheet = this._state.sheets[name];
                opt.textContent = `${name} (${sheet.rows.length}행)`;
                sel.appendChild(opt);
            }
            sel.value = this._state.activeSheet;
        }

        // ----------------------------------------------------------
        // 매핑 UI
        // ----------------------------------------------------------
        _renderMapping() {
            const grid = this._els.mapGrid;
            if (!grid) return;
            const { headers } = this._parseInput();
            grid.innerHTML = '';
            const frag = document.createDocumentFragment();
            for (const f of TARGET_FIELDS) {
                const row = document.createElement('div');
                row.className = 'sri-maprow' + (f.gongik ? ' sri-maprow--gongik' : '');
                const label = document.createElement('span');
                label.className = 'sri-maplabel';
                label.innerHTML = `${escapeHtml(f.label)}${f.optional ? '<span class="sri-opt"> (선택)</span>' : ''}` +
                    (f.gongik ? '<span class="sri-gbadge">공익직불제</span>' : '');
                const arrow = document.createElement('span');
                arrow.className = 'sri-maparrow';
                arrow.textContent = '→';
                const select = document.createElement('select');
                select.dataset.fieldKey = f.key;
                select.setAttribute('aria-label', `${f.label} 컬럼 매핑`);
                const emptyLabel = f.optional ? '(비움 · 자동부여)' : '(없음)';
                select.innerHTML = `<option value="-1">${emptyLabel}</option>` +
                    headers.map((h, i) =>
                        `<option value="${i}">${i + 1}열${h ? ` · ${escapeHtml(String(h).slice(0, 16))}` : ''}</option>`
                    ).join('');
                const cur = this._state.fieldMapping[f.key];
                select.value = (typeof cur === 'number' && cur >= 0) ? String(cur) : '-1';
                select.addEventListener('change', () => {
                    const v = parseInt(select.value, 10);
                    if (Number.isNaN(v) || v < 0) delete this._state.fieldMapping[f.key];
                    else this._state.fieldMapping[f.key] = v;
                    this._recompute(); this._renderPreview();
                });
                row.append(label, arrow, select);
                frag.appendChild(row);
            }
            grid.appendChild(frag);
            this._syncGongikHighlight();
        }

        /** 경지구분1차='공익직불제'면 매핑 그리드에 gongik-active 토글 */
        _syncGongikHighlight() {
            const grid = this._els?.mapGrid;
            if (!grid) return;
            const active = (this._state.bulkLandClass || LAND_CLASS1_DEFAULT) === '공익직불제';
            grid.classList.toggle('gongik-active', active);
        }

        _autoMap(silent) {
            const { headers } = this._parseInput();
            if (headers.length === 0) {
                if (!silent) toast('먼저 데이터를 입력/업로드하세요.', 'warning');
                return;
            }
            // 순수 매핑 로직은 computeAutoMapping()으로 분리(단위 테스트 대상).
            const mapping = computeAutoMapping(headers);
            this._state.fieldMapping = mapping;
            this._renderMapping();
            this._recompute(); this._renderPreview();
            const count = Object.keys(mapping).length;
            if (!silent) toast(`자동 매핑 ${count}건 적용`, count > 0 ? 'success' : 'warning');
        }

        // ----------------------------------------------------------
        // 미리보기 계산
        // ----------------------------------------------------------
        _refresh() {
            this._renderMapping();
            this._recompute();
            this._renderPreview();
        }

        /** 현재 연도 범위의 기존 접수 레코드 (매니저 미준비 시 localStorage 폴백) */
        _existingLogs() {
            const mgr = window.soilManager;
            // ⚠️ **클라우드도 풀에 넣는다** (SAMPL-1-169). 로컬만 보면 다른 자리에서
            //    먼저 접수된 번호가 미리보기에 "신규"로 표시되고, 자동부여도 그 번호를
            //    피하지 못한다 — 등록(SAMPL-1-167)·수정(SAMPL-1-168)에서 막은 것과
            //    같은 구멍이 가져오기에 남아 있었다.
            //    `computePreview`가 이 배열 하나에서 세 풀을 모두 도출하므로
            //    여기서 합치면 수동 중복 판정과 자동부여 회피가 함께 고쳐진다.
            // ⚠️ 연도가 맞을 때만 합친다. 이것이 **이벤트에 기대지 않는 안전망**이다 —
            //    연도 변경을 어디선가 놓치더라도 지난해 번호가 올해 판정에 섞이지 않는다
            //    (독립 3차 리뷰: 조회가 끝난 뒤 연도를 바꾸는 경로가 남아 있었다).
            const cloudFresh = Array.isArray(this._state.cloudRecords)
                && String(this._state.cloudYear) === String(mgr?.selectedYear);
            const cloud = cloudFresh ? this._state.cloudRecords : [];
            if (mgr && Array.isArray(mgr.sampleLogs)) return cloud.length ? [...mgr.sampleLogs, ...cloud] : mgr.sampleLogs;
            const year = (mgr && mgr.selectedYear) || new Date().getFullYear();
            try {
                // 저장 키는 **매니저에게 묻는다.** 문자열을 복제해 두면 매니저가 키 규칙을
                // 바꿨을 때 이쪽만 옛 키를 읽어 **중복 검사 풀이 통째로 비고**, 그러면
                // 모든 행이 "신규"가 되어 중복이 그대로 저장된다 (SAMPL-2-30 🟡).
                const key = (mgr && typeof mgr.getStorageKey === 'function')
                    ? mgr.getStorageKey(year)
                    : `soilSampleLogs_${year}`;
                const raw = localStorage.getItem(key);
                const local = raw ? JSON.parse(raw) : [];
                return cloud.length ? [...local, ...cloud] : local;
            } catch (_) { return cloud; }
        }

        /**
         * 캐시된 클라우드 번호가 현재 연도 것인지 확인하고, 아니면 다시 읽는다.
         * 재조회가 도는 동안에는 `_existingLogs`가 낡은 캐시를 합치지 않는다.
         */
        _ensureCloudYearFresh() {
            const st = this._state;
            const mgr = window.soilManager;
            if (!st || !mgr || !st.cloudChecked) return;
            if (String(st.cloudYear) === String(mgr.selectedYear)) return;
            // ⚠️ **캐시를 비우지 않는다.** 비우면 연도 도장이 무의미해지고,
            //    `_existingLogs`의 연도 대조가 죽은 코드가 된다 (변이로 실측).
            //    도장이 어긋난 캐시는 어차피 합쳐지지 않으므로 그대로 둔다 —
            //    검사가 한 군데(도장 대조)에만 있는 편이 확인하기 쉽다.
            st.cloudChecked = false;
            st.cloudUnavailable = false;
            this._cloudGen = (this._cloudGen || 0) + 1;
            this._loadCloudRecords(this._cloudGen);
        }

        /**
         * 클라우드 접수번호를 한 번 읽어 상태에 담는다 (SAMPL-1-169).
         *
         * 매니저가 이미 만들어 둔 `fetchCloudReceptionRecords`를 그대로 쓴다 —
         * 시간초과 상한·오류 처리·`loadFromFirebase`의 오류 삼킴 회피가 거기 들어 있다.
         *
         * ⚠️ **실패해도 가져오기를 막지 않는다.** 이 앱은 오프라인 우선이다.
         *    대신 미리보기에 확인하지 못했다고 적는다 — 조용히 넘기면 담당자는
         *    "중복 없음"과 "확인 못 함"을 구별할 수 없다.
         */
        async _loadCloudRecords(gen) {
            const mgr = window.soilManager;
            if (!mgr || typeof mgr.fetchCloudReceptionRecords !== 'function') {
                if (gen === this._cloudGen && this._state) this._state.cloudChecked = true;
                return;
            }
            // ⚠️ **요청 당시의 연도를 붙잡아 둔다.** 응답을 기다리는 사이에 담당자가
            //    연도를 바꾸면, 도착한 2026년 번호가 2027년 미리보기의 중복 판정과
            //    자동부여 풀에 들어간다 — 엉뚱한 해의 번호를 피해 채번하게 된다.
            const year = mgr.selectedYear;
            let state = null;
            let unavailable = false;
            try {
                const res = await mgr.fetchCloudReceptionRecords(year);
                state = res.records || null;
                unavailable = !!res.unavailable;
            } catch (_) {
                unavailable = true;
            }

            // ⚠️ **낡은 응답을 버린다.** 세 가지를 다 확인해야 한다:
            //    ① 세대 — 모달을 닫았다 다시 열면 `_state`가 새 객체로 갈리는데,
            //       await에서 깨어난 이 코드는 **새 상태를 가리킨다.** 세대를 안 보면
            //       이전 세션의 응답이 새 세션에 조용히 들어간다 (독립 리뷰 MAJOR).
            //    ② 모달이 아직 열려 있는지
            //    ③ 연도가 그대로인지
            if (gen !== this._cloudGen) return;
            if (!this._state || this._els?.modal?.hidden) return;

            // ⚠️ 연도가 바뀌었으면 **버리는 것으로 끝내면 안 된다.** 버리기만 하면
            //    새 연도는 영영 확인되지 않고, `cloudChecked`가 false로 남아
            //    "확인 실패" 표시조차 뜨지 않는다 — 담당자는 클라우드를 검사한 줄 안다
            //    (독립 재리뷰 MAJOR). 새 연도로 다시 읽는다.
            // 문자열/숫자 혼용에 대비해 정규화한다. 항등 비교면 숫자로 대입된 순간
            //    정상 응답까지 버리게 된다.
            if (String(mgr.selectedYear) !== String(year)) {
                this._cloudGen = (this._cloudGen || 0) + 1;
                return this._loadCloudRecords(this._cloudGen);
            }

            this._state.cloudRecords = state;
            this._state.cloudUnavailable = unavailable;
            this._state.cloudChecked = true;
            this._state.cloudYear = year;
            // 응답이 늦게 오므로 그때 미리보기를 다시 그린다
            this._recompute();
            this._renderPreview();
        }

        // 풀을 하나씩 뽑아 넘기는 진입점(_existingNumbers)은 두지 않는다.
        // computePreview가 logs에서 세 풀을 함께 도출한다 — 하나를 빠뜨리면
        // 그 검사가 조용히 사라지고, 그것이 이 티켓의 회귀 원인이었다.

        /**
         * 미리보기 재계산. 순수 계산은 computePreview()에 위임하고
         * 이 메서드는 매니저·상태에서 입력을 모으는 일만 한다.
         */
        _recompute() {
            // 조회가 끝난 뒤 연도가 바뀌었으면 다시 읽는다. `_recompute`는 모달이
            // 살아 있는 동안 계속 불리므로, 연도 변경 이벤트를 따로 듣지 않아도
            // 여기서 반드시 걸린다.
            this._ensureCloudYearFresh();
            const { rows } = this._parseInput();
            const landClass1 = this._state.bulkLandClass || LAND_CLASS1_DEFAULT;
            const mgr = window.soilManager;
            const year = (mgr && mgr.selectedYear) || new Date().getFullYear();

            // 일반과 성토(F 접두)는 완전히 분리된 채번이라 양쪽을 다 넘겨야 한다.
            // 한쪽만 넘기면 성토 행 미리보기가 실제 저장 번호와 어긋난다 (SAMPL-1-153).
            // 번호 풀은 computePreview가 이 로그에서 직접 도출한다 (하나를 빠뜨릴 수 없게)
            const logs = this._existingLogs();

            const nextNumber = (mgr && typeof mgr.getNextNumberForClass === 'function')
                ? mgr.getNextNumberForClass(year, landClass1)
                : null;
            // 성토 커서. 일반 쪽과 **대칭인** 메서드를 쓴다 (SAMPL-2-30 🔵).
            //  - 연도를 넘긴다: `generateNextFillReceptionNumber`는 `this.sampleLogs`만 보아
            //    연도를 무시했다. 일반만 연도를 받으면 성토 커서만 틀리게 된다.
            //  - 로그를 찍지 않는다: 재계산은 키 입력마다 일어나 콘솔을 덮었다.
            //  - `'F3'` 문자열에서 숫자를 되뽑는 우회도 없어진다.
            let nextFillNumber = null;
            if (mgr && typeof mgr.getNextFillNumberForClass === 'function') {
                const n = mgr.getNextFillNumberForClass(year, landClass1);
                if (typeof n === 'number' && !Number.isNaN(n)) nextFillNumber = n;
            } else if (mgr && typeof mgr.generateNextFillReceptionNumber === 'function') {
                // 구 매니저 폴백
                const parsed = parseInt(String(mgr.generateNextFillReceptionNumber(landClass1)).replace('F', ''), 10);
                if (!Number.isNaN(parsed)) nextFillNumber = parsed;
            }

            this._state.previewYear = year;
            this._state.preview = computePreview({
                rows,
                mapping: this._state.fieldMapping,
                landClass1,
                autoNumber: this._state.autoNumber,
                dupPolicy: this._state.dupPolicy,
                logs,
                nextNumber,
                nextFillNumber,
            });
        }

        // ----------------------------------------------------------
        // 미리보기 렌더
        // ----------------------------------------------------------
        _renderPreview() {
            const summary = this._els.summary;
            const box = this._els.previewBox;
            const importBtn = this._els.modal.querySelector('[data-act="import"]');
            const dlErrBtn = this._els.modal.querySelector('[data-act="dlErrorCsv"]');
            const note = this._els.footerNote;
            if (!summary || !box) return;

            const p = this._state.preview;
            if (!p) {
                summary.innerHTML = '<span class="sri-muted">데이터·컬럼 매핑을 지정하면 미리보기가 표시됩니다.</span>';
                box.innerHTML = '<div class="sri-pv-empty">성명 또는 지번주소 컬럼을 매핑하면 미리보기가 생성됩니다.</div>';
                if (importBtn) { importBtn.disabled = true; importBtn.textContent = '📥 가져오기'; }
                if (dlErrBtn) { dlErrBtn.hidden = true; dlErrBtn.textContent = '⚠️ 오류 행 CSV'; }
                if (note) note.textContent = '';
                return;
            }

            summary.innerHTML =
                `<span class="sri-pill new">✅ 신규 ${p.stats.new}</span>` +
                // 하위필지로 접힌 행은 신규도 중복도 아니다. 어느 쪽에 섞어도 사용자가
                // 읽는 숫자가 거짓이 된다 — 0이면 아예 보여주지 않는다 (SAMPL-1-154).
                (p.stats.sub > 0 ? `<span class="sri-pill sub">🔗 하위필지 ${p.stats.sub}</span>` : '') +
                `<span class="sri-pill dup">⚠️ 중복 ${p.stats.dup}</span>` +
                `<span class="sri-pill err">⛔ 오류 ${p.stats.err}</span>` +
                // 확인하지 못했다는 사실을 조용히 넘기지 않는다 (SAMPL-1-169).
                // 이 표시가 없으면 담당자는 "중복 0"과 "확인 못 함"을 구별할 수 없다.
                (this._state.cloudUnavailable
                    ? '<span class="sri-pill err sri-cloudfail" title="다른 자리에서 같은 번호를 쓰고 있어도 여기서는 보이지 않습니다">' +
                      '☁️ 클라우드 확인 실패 — 이 컴퓨터 기록만 검사</span>'
                    : '');

            const shown = p.items.slice(0, PREVIEW_ROW_LIMIT);
            const labels = { new: '신규', dup: '중복', err: '오류', sub: '하위필지' };
            const trs = shown.map(it => {
                const r = it.rec || {};
                const cls = it.status === 'dup' ? 'is-dup'
                    : (it.status === 'err' ? 'is-err' : (it.status === 'sub' ? 'is-sub' : ''));
                // 불변식 경고는 **행 위에** 보여야 한다. 요약 숫자에만 넣으면
                // 어느 행이 문제인지 알 수 없어 사용자가 손쓸 수가 없다 (SAMPL-2-30 ③).
                const warnBadge = it.warn
                    ? `<span class="sri-status warn" title="${escapeAttrLocal(it.warn)}">⚠️ 확인</span>`
                    : '';
                const statusBadge = `<span class="sri-status ${it.status}">${labels[it.status]}${it.skip ? ' · 건너뜀' : ''}</span>${warnBadge}`;
                return `<tr class="${cls}">
                    <td>${statusBadge}</td>
                    <td>${escapeHtml(it.display ?? '')}${it.reason ? `<div class="sri-reason">${escapeHtml(it.reason)}</div>` : ''}</td>
                    <td>${escapeHtml(r.name ?? '')}</td>
                    <td>${escapeHtml(r.phoneNumber ?? '')}</td>
                    <td class="addr">${escapeHtml(r.lotAddress ?? '')}</td>
                    <td>${escapeHtml(r.cropsDisplay ?? '')}</td>
                    <td>${escapeHtml(r.area ?? '')}</td>
                    <td>${escapeHtml(p.landClass1 ?? '')}</td>
                    <td>${escapeHtml(r.subCategory ?? '')}</td>
                    <td>${escapeHtml(r.purpose ?? '')}</td>
                    <td>${escapeHtml(r.note ?? '')}</td>
                </tr>`;
            }).join('');

            const overflow = p.items.length > PREVIEW_ROW_LIMIT
                ? `<div class="sri-pv-overflow">… 외 ${p.items.length - PREVIEW_ROW_LIMIT}건 (전체 ${p.items.length}건은 가져오기 시 모두 처리)</div>`
                : '';

            box.innerHTML = trs
                ? `<div class="sri-pv-wrap"><table class="sri-pv-table">
                    <thead><tr><th>상태</th><th>접수번호</th><th>성명</th><th>연락처</th><th>지번주소</th><th>작물</th><th>면적</th><th>경지구분1차</th><th>구분</th><th>목적</th><th>비고</th></tr></thead>
                    <tbody>${trs}</tbody></table></div>${overflow}`
                : '<div class="sri-pv-empty">표시할 행이 없습니다.</div>';

            if (importBtn) {
                importBtn.disabled = p.willImport === 0;
                importBtn.textContent = p.willImport > 0 ? `📥 ${p.willImport}건 가져오기` : '📥 가져오기';
            }
            if (dlErrBtn) {
                if (p.stats.err > 0) {
                    dlErrBtn.hidden = false;
                    dlErrBtn.textContent = `⚠️ 오류 행 CSV (${p.stats.err}건)`;
                } else {
                    dlErrBtn.hidden = true;
                    dlErrBtn.textContent = '⚠️ 오류 행 CSV';
                }
            }
            if (note) {
                // 접힌 행이 있으면 **왜 등록 건수가 행 수보다 적은지** 설명한다.
                // 설명이 없으면 사용자가 "버려졌다"고 읽는다 — 이 티켓의 원래 증상이
                // 바로 그 오해였다 (SAMPL-1-154).
                const subNote = p.stats.sub > 0
                    ? ` (같은 본번의 서브넘버 ${p.stats.sub}건은 하위필지로 묶여 함께 저장됩니다)`
                    : '';
                note.textContent =
                    `총 ${p.stats.total}건 중 ${p.willImport}건이 [${p.landClass1}]으로 등록됩니다${subNote}`;
            }
        }

        // ----------------------------------------------------------
        // 저장 커밋
        // ----------------------------------------------------------
        _commit() {
            const p = this._state.preview;
            if (!p) return;
            const mgr = window.soilManager;
            if (!mgr || typeof mgr.addImportedRecord !== 'function') {
                toast('접수 매니저가 준비되지 않았습니다. 잠시 후 다시 시도하세요.', 'error');
                return;
            }

            // ⚠️ **연도가 바뀐 뒤 재계산 없이 누른 경우를 막는다** (독립 4차 리뷰 MAJOR).
            //    미리보기는 계산 당시 연도의 번호 풀로 채번했다. 그대로 저장하면
            //    지난해 기준으로 뽑은 번호가 올해에 들어간다.
            //
            //    조용히 다시 계산해서 저장하지는 않는다 — 담당자가 화면에서 본 번호와
            //    실제로 저장되는 번호가 달라진다. 다시 계산해 **보여주고**, 확인한 뒤
            //    누르게 한다. 한 번 더 누르는 대신, 본 것과 저장되는 것이 같아진다.
            if (this._state.previewYear != null
                && String(this._state.previewYear) !== String(mgr.selectedYear)) {
                this._recompute();
                this._renderPreview();
                toast('연도가 바뀌어 미리보기를 다시 계산했습니다. 접수번호를 확인한 뒤 다시 눌러 주세요.', 'warning');
                return;
            }

            // ⚠️ **재조회가 아직 안 끝났으면 그 미리보기는 클라우드를 반영하지 못했다**
            //    (독립 5차 리뷰 MAJOR). 위 가드가 재계산을 걸면 `previewYear`는 곧바로
            //    새 연도가 되지만 클라우드 응답은 아직 오지 않았다 — 그 상태로 두 번째를
            //    누르면 로컬만 본 번호가 저장된다.
            //
            //    Firebase를 쓰지 않는 설치본(`cloudChecked`가 true로 끝남)이나 확인에
            //    실패한 경우는 여기 걸리지 않는다. **기다리는 중일 때만** 멈춘다.
            if (this._state.cloudChecked === false) {
                this._renderPreview();
                toast('클라우드 접수번호를 확인하는 중입니다. 잠시 후 다시 눌러 주세요.', 'warning');
                return;
            }

            // ⚠️ 미리보기의 그룹 id(`imp-5`)를 **그대로 저장하면 안 된다.** 그것은 배치 안에서
            //    행을 묶기 위한 키일 뿐이라, 다른 경지구분·다른 날 가져오기에서 같은 본번이
            //    나오면 서로 무관한 두 접수가 같은 groupId를 갖게 되고 그룹 수정이 둘을
            //    한 접수로 연다. 실행마다 진짜 UUID로 해석한다 (SAMPL-1-154).
            /** @type {Array<Object>} 준비된 레코드 — 루프가 끝난 뒤 한 번에 저장한다 */
            const toSave = [];
            const groupIdOf = new Map();
            const resolveGroupId = (key) => {
                if (!groupIdOf.has(key)) groupIdOf.set(key, crypto.randomUUID());
                return groupIdOf.get(key);
            };

            let applied = 0, failed = 0;
            for (const it of p.items) {
                if (it.status === 'err') continue;
                if (it.status === 'dup' && it.skip) continue;
                // 하위필지 행은 선두 행 안으로 접힌다 — 여기서 따로 저장하지 않는다.
                // (선두 행이 `group.subLots`를 들고 간다 — SAMPL-1-154)
                if (it.status === 'sub') continue;
                try {
                    const rec = { ...it.rec };
                    // 🚨 **미리보기가 보여준 번호를 그대로 저장한다** (SAMPL-1-169).
                    //    예전에는 자동부여 행의 번호를 지워 매니저가 다시 부여하게 했다.
                    //    그런데 매니저의 채번(`getNextNumberForClass`)은 **로컬만** 본다 —
                    //    클라우드에 1·2가 있으면 화면에는 3으로 보이는데 실제로는 1이
                    //    저장됐다(실측: 미리보기 3·4 → 저장 1·2). 표시만 고치고 저장은
                    //    그대로인 셈이라, 이 티켓이 막으려던 충돌이 그대로 일어난다.
                    //
                    //    ⚠️ 이 저장소가 이미 한 번 겪은 실패다 — SAMPL-1-153의
                    //       "미리보기는 1,2,3인데 실제로는 1,1,1". 그때 세운 규칙이
                    //       **미리보기 = 저장**이고, 그 규칙을 여기서도 지킨다.
                    if (it.auto && it.display) rec.receptionNumber = it.display;
                    else if (it.auto) delete rec.receptionNumber;
                    // 서브넘버 그룹 정보를 매니저에 그대로 넘긴다.
                    //   sublot → 선두 레코드의 parcels[0].subLots를 채운다
                    //   split  → 같은 groupId를 공유하고 cropIndex가 붙는다
                    if (it.group) {
                        rec.groupId = resolveGroupId(it.group.id);
                        rec.cropIndex = it.group.cropIndex;
                        if (it.group.mode === 'sublot' && it.group.subLots) {
                            rec.subLots = it.group.subLots;
                        }
                    }
                    // ⚠️ 여기서 저장하지 않는다 — 아래에서 **한 번에** 넣는다 (SAMPL-1-172).
                    //    행마다 저장하면 배열 전체를 다시 쓰고 목록을 다시 그려 O(n²)가 된다.
                    toSave.push(rec);
                } catch (err) {
                    failed++;
                    logErr('가져오기 레코드 준비 실패:', err, it.rec);
                }
            }

            // 배치 저장. 한 건이 실패해도 나머지는 들어간다 — 대량 입력에서
            // 한 줄 때문에 전부 잃는 것은 담당자에게 최악이다.
            if (toSave.length > 0) {
                if (typeof mgr.addImportedRecords === 'function') {
                    const res = mgr.addImportedRecords(toSave);
                    applied += res.added.length;
                    failed += res.failed.length;
                    for (const f of res.failed) logErr('가져오기 레코드 저장 실패:', f.error, f.record);
                } else {
                    // 구 매니저 폴백 — 느리지만 동작은 한다
                    for (const rec of toSave) {
                        try { mgr.addImportedRecord(rec); applied++; }
                        catch (err) { failed++; logErr('가져오기 레코드 저장 실패:', err, rec); }
                    }
                }
            }

            const parts = [`✅ ${applied}건 가져오기 완료`];
            if (p.stats.dup > 0) parts.push(`중복 ${p.stats.dup}건`);
            if (p.stats.err > 0) parts.push(`오류 ${p.stats.err}건`);
            if (failed > 0) parts.push(`실패 ${failed}건`);
            toast(parts.join(' · '), failed > 0 ? 'warning' : 'success');
            this.close();
        }

        // ----------------------------------------------------------
        // 오류 행 CSV 다운로드
        // ----------------------------------------------------------
        _downloadErrorCsv() {
            const items = this._state.preview?.items || [];
            const errs = items.filter(it => it.status === 'err');
            if (errs.length === 0) return;

            /** CSV 셀 이스케이프 (RFC 4180 + CSV 인젝션 방지) */
            function csvCell(val) {
                let s = String(val ?? '');
                // CSV 인젝션 방지: 수식 시작 문자 앞에 작은따옴표 삽입
                if (s.length > 0 && '=+-@|'.includes(s[0])) s = "'" + s;
                // 콤마·큰따옴표·개행이 포함되면 큰따옴표로 감싸고 내부 " → ""
                if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
                    s = '"' + s.replace(/"/g, '""') + '"';
                }
                return s;
            }

            const header = ['성명', '연락처', '지번주소', '작물', '면적', '구분', '목적', '오류사유'];
            const lines = [header.map(csvCell).join(',')];
            for (const it of errs) {
                const r = it.rec || {};
                lines.push([
                    csvCell(r.name),
                    csvCell(r.phoneNumber),
                    csvCell(r.lotAddress),
                    csvCell(r.cropsDisplay),
                    csvCell(r.area),
                    csvCell(r.subCategory),
                    csvCell(r.purpose),
                    csvCell(it.reason),
                ].join(','));
            }

            const bom = '﻿';
            const csv = bom + lines.join('\r\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const a = document.createElement('a');
            a.href = url;
            a.download = `가져오기_오류행_${dateStr}.csv`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast(`오류 행 ${errs.length}건을 CSV로 저장했습니다.`, 'success');
        }
    }

    // ============================================================
    // 싱글턴 노출 + 버튼 연결
    // ============================================================
    function attachOpenButton() {
        const btn = document.getElementById('soilImportBtn');
        if (btn && !btn._sriBound) {
            btn._sriBound = true;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.SoilResultImporter.open();
            });
        }
    }

    const instance = new SoilResultImporter();
    window.SoilResultImporter = instance;

    // 단위 테스트용 순수 매핑 로직 노출 (DOM 비의존) — 외부 호출은 권장하지 않음
    instance._fns = {
        normalizeHeader, scoreFieldHeader, computeAutoMapping, auditDuplicateKeywords,
        // 접수번호 채번 (SAMPL-1-153) — 성토/일반 시퀀스 분리가 여기서 결정된다
        collectExistingNumbers, collectLiteralNumbers, computePreview,
    };

    // 로드 시 1회: 교차 필드 중복 키워드가 있으면 콘솔 경고(개발 보조)
    auditDuplicateKeywords();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachOpenButton);
    } else {
        attachOpenButton();
    }
})();
