/**
 * 전역(window.*) 선언 — SAMPL-2-24
 *
 * 이 앱은 번들러 도입 전부터 `window.*`에 모듈을 노출하는 구조로 커왔다
 * (src/shared/*.js 끝의 `window.XxxManager = ...`). 그래서 `// @ts-check`가 붙은 파일에서
 * 그 전역을 참조하면 TS2339(Property does not exist on Window)가 난다.
 *
 * 타입을 `any`로 둔 이유: 실제 클래스 타입을 JS 구현에서 끌어오려면 각 모듈에
 * JSDoc 타입을 붙이고 export 구조를 바꿔야 한다. 이 파일의 목적은 "전역이 존재한다"를
 * 인정해 게이트를 세우는 것이고, 실질 검사는 그 전역을 쓰는 코드 쪽에서 일어난다.
 * 개별 매니저에 타입을 붙이는 것은 별건이다.
 *
 * 새 전역을 노출하면 여기에도 추가한다 — 그러지 않으면 @ts-check 파일에서 쓸 수 없다.
 */

declare global {
  interface Window {
    // 시료 타입별 매니저 (각 페이지 진입 스크립트가 노출)
    soilManager: any;
    waterManager: any;
    compostManager: any;
    heavyMetalManager: any;
    pesticideManager: any;
    heuktoramManager: any;
    waterAnalysisManager: any;

    // 공용 모듈 (src/shared/)
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

    // Electron preload가 노출하는 브리지 (웹에서는 undefined)
    electronAPI: any;
    isElectron: boolean;

    // 전역 헬퍼
    showToast: any;
    escapeHTML: any;
    sanitizeHTML: any;
    formatPhoneNumber: any;
    loadFromAutoSaveFile: any;
    getSelectedIds: any;

    // 앱 버전 (constants.js가 노출)
    APP_VERSION: string;
  }
}

export {};
