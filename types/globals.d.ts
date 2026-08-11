/**
 * 전역 선언 — SAMPL-2-24
 *
 * 이 앱은 번들러 도입 전부터 전역에 모듈을 노출하는 구조로 커왔다
 * (src/shared/*.js 끝의 `window.XxxManager = ...`, 최상위 `function`/`const` 선언).
 * `// @ts-check`가 붙은 파일에서 그것을 참조하면 선언이 없어 오류가 난다.
 *
 * ## `declare var` + `interface Window`를 같이 두는 이유
 *
 * 두 접근 형태가 소스에 섞여 있어 한쪽만으로는 절반만 커버된다 (실측):
 *
 *   window.showToast(...)   → interface Window 가 필요
 *   showToast(...)          → declare var 가 필요 (없으면 TS2304/TS2551)
 *
 * 실제 사용 빈도도 bare 쪽이 더 많다 — showToast는 window. 95곳 / bare 127곳,
 * escapeHTML은 14곳 / 62곳. `declare var`는 typeof globalThis에 들어가고
 * lib.dom이 `declare var window: Window & typeof globalThis`로 선언하므로
 * 두 형태를 모두 통과시킨다.
 *
 * ## 타입이 `any`인 이유
 *
 * 실제 클래스 타입을 JS 구현에서 끌어오려면 각 모듈에 JSDoc을 붙이고 export 구조를
 * 바꿔야 한다. 이 파일의 목적은 "전역이 존재한다"를 인정해 게이트를 세우는 것이고,
 * 실질 검사는 그 전역을 쓰는 코드 쪽에서 일어난다. 개별 타입 부여는 별건이다.
 *
 * 예외는 `electronAPI`다 — 웹에서는 undefined이므로 `any`로 두면 이 앱에서 가장
 * 중요한 가드(Electron/Web 분기)를 검사기가 놓친다. 최소 객체 타입을 준다.
 *
 * 새 전역을 노출하면 여기에도 추가한다 — 그러지 않으면 @ts-check 파일에서 쓸 수 없다.
 */

declare global {
    // ── 시료 타입별 매니저 (각 페이지 진입 스크립트가 노출) ──
    var soilManager: any;
    var waterManager: any;
    var compostManager: any;
    var heavyMetalManager: any;
    var pesticideManager: any;
    var heuktoramManager: any;
    var waterAnalysisManager: any;

    // ── 공용 모듈 (src/shared/) ──
    var BaseSampleManager: any;
    var AddressManager: any;
    var CacheManager: any;
    var ExcelImportManager: any;
    var PaginationManager: any;
    var ThemeManager: any;
    var storageManager: any;
    var firestoreDb: any;
    var firebaseConfig: any;
    var SyncUtils: any;
    var SampleUtils: any;
    var SoilLogRecord: any;
    var logger: any;

    // ── 전역 헬퍼 ──
    var showToast: any;
    var escapeHTML: any;
    var sanitizeHTML: any;
    var formatPhoneNumber: any;
    var loadFromAutoSaveFile: any;
    var getSelectedIds: any;

    // ── 앱 버전 (constants.js가 노출) ──
    var APP_VERSION: string;

    interface Window {
        soilManager: any;
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
        sanitizeHTML: any;
        formatPhoneNumber: any;
        loadFromAutoSaveFile: any;
        getSelectedIds: any;

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
