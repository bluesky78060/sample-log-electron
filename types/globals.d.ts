/**
 * 전역 선언 — SAMPL-2-24 도입, SAMPL-2-25에서 역할 정정
 *
 * 이 앱은 번들러 도입 전부터 전역에 모듈을 노출하는 구조로 커왔다
 * (src/shared/*.js 끝의 `window.Xxx = ...`, 최상위 `function`/`const`/`class` 선언).
 *
 * ## `declare var`에 넣을 것과 넣지 말 것 (SAMPL-2-25 실측)
 *
 * **넣지 않는다 — `src/`에 최상위 정의가 있는 전역.**
 * TS는 전역 스크립트(import/export 없는 파일)의 최상위 선언을 전역으로 수집하므로,
 * 정의 파일이 이미 선언 제공자다. `d.ts`에 또 선언하면 **TS2300 Duplicate identifier**가 난다.
 * 실측: `d.ts`에서 `sanitizeHTML`/`escapeHTML`을 빼도 다른 @ts-check 파일에서 그대로 쓸 수 있었다.
 *   → escapeHTML·sanitizeHTML(sanitize.js), formatPhoneNumber(utils.js), logger(logger.js),
 *     APP_VERSION(constants.js), BaseSampleManager·ThemeManager·AddressManager·CacheManager·
 *     ExcelImportManager(각 shared 모듈), waterManager(water-script.js), heavyMetalManager(heavy-metal-script.js)
 *
 * **넣는다 — IIFE 내부에서 `window.X = ...`로만 노출되어 최상위 선언이 없는 것,**
 * 그리고 외부 라이브러리 전역(CDN/번들로 들어와 소스에 선언이 없다).
 *
 * ## `interface Window`는 별개다
 *
 * `window.X` 형태 접근에는 `interface Window` 항목이 필요하다. 자기정의 전역이라도
 * `window.`로 접근하는 코드가 있으면 여기에는 남겨야 한다 — 중복 충돌은 `declare var`에서만 난다.
 *
 * ## 타입이 `any`인 이유
 *
 * 실제 타입을 JS 구현에서 끌어오려면 각 모듈에 JSDoc을 붙이고 export 구조를 바꿔야 한다.
 * 이 파일의 목적은 "전역이 존재한다"를 인정하는 것이고 실질 검사는 사용처에서 일어난다.
 * 예외는 `electronAPI` — 웹에서 undefined이므로 옵셔널 객체로 두어 무가드 접근을 잡는다.
 *
 * 새 전역을 노출하면 위 기준으로 판정해 추가한다.
 */

declare global {
    // ── 외부 라이브러리 전역 (소스에 선언이 없다) ──
    /** DOMPurify — sanitize.js가 XSS 방지에 사용. CDN 또는 번들로 주입된다 */
    var DOMPurify: any;
    /** SheetJS — 엑셀 가져오기/내보내기 */
    var XLSX: any;
    /** Firebase compat SDK */
    var firebase: any;

    // ── IIFE 내부에서 window에만 노출되는 전역 (최상위 선언 없음) ──
    var soilManager: any;
    // 작물 데이터 — cropData.js가 선언하고 crop-data-loader.js가 런타임에 교체한다 (SAMPL-1-156)
    var CROP_DATA: any[];
    var CROP_CATEGORIES: string[];
    var CropSearch: any;
    /** 하위필지 식별 순수 로직 (SAMPL-1-159) */
    var SubLotIdentity: any;
    /** 흙토람 미리보기 표 구성 순수 로직 (SAMPL-1-158) */
    var PreviewTable: any;
    /** 접수번호 정합성 점검 순수 로직 (SAMPL-1-155) */
    var ReceptionAudit: any;
    var compostManager: any;
    var pesticideManager: any;
    var heuktoramManager: any;
    var waterAnalysisManager: any;
    var PaginationManager: any;
    var storageManager: any;
    var firestoreDb: any;
    var firebaseConfig: any;
    var SyncUtils: any;
    var SampleUtils: any;
    var SoilLogRecord: any;
    var showToast: any;
    var loadFromAutoSaveFile: any;
    var getSelectedIds: any;

    /**
     * `window.X` 접근용. 자기정의 전역도 window로 접근하는 코드가 있으므로 여기엔 남긴다
     * (중복 충돌은 declare var에서만 발생한다).
     */
    interface Window {
        soilManager: any;
        CROP_DATA: any[];
        CROP_CATEGORIES: string[];
        CropSearch: any;
        /** 접수번호 정합성 점검 순수 로직 (SAMPL-1-155) */
        ReceptionAudit: any;
        /** 하위필지 식별 순수 로직 (SAMPL-1-159) */
        SubLotIdentity: any;
        PreviewTable: any;
        waterManager: any;
        compostManager: any;
        heavyMetalManager: any;
        pesticideManager: any;
        heuktoramManager: any;
        waterAnalysisManager: any;

        BaseSampleManager: any;
        AddressManager: any;
        CacheManager: any;
        ExcelImportManager: any;
        PaginationManager: any;
        ThemeManager: any;
        storageManager: any;
        firestoreDb: any;
        firebaseConfig: any;
        SyncUtils: any;
        SampleUtils: any;
        SoilLogRecord: any;
        logger: any;

        showToast: any;
        escapeHTML: any;
        /** HTML **속성 값** 전용 escape — escapeHTML은 따옴표를 변환하지 않는다 (SAMPL-2-32) */
        escapeAttr: (value: any) => string;
        sanitizeHTML: any;
        formatPhoneNumber: any;
        loadFromAutoSaveFile: any;
        getSelectedIds: any;

        SIDO_LIST: any;
        SIDO_SHORT_MAP: any;
        MrlNameCanon: any;
        PesticideUseType: any;
        PESTICIDE_NAME_MAP: any;
        PsisParse: any;

        APP_VERSION: string;

        /**
         * Electron preload가 contextBridge로 노출한다. 웹에서는 undefined이므로
         * 반드시 옵셔널 체이닝(`window.electronAPI?.x`)으로 접근해야 한다.
         * `any`가 아니라 옵셔널 객체로 두어 검사기가 무가드 접근을 잡게 한다.
         */
        electronAPI?: { isElectron?: boolean;[key: string]: any };

        /** file-api.js가 설정하는 실행 환경 플래그 */
        isElectron?: boolean;
    }
}

export {};
