// npm packages
import * as XLSX from 'xlsx-js-style';
import JSZip from 'jszip';
// sanitize.js의 `sanitizeHTML`이 이 전역을 읽는다 (SAMPL-2-34).
// 없으면 마크업을 통째로 이스케이프해 화면에 태그가 글자로 나온다.
//
// ⚠️ **이 대입이 sanitize.js보다 먼저 실행되지는 않는다.** `import`는 호이스팅되므로
//    번들에서 이 줄은 거의 마지막에 온다(실측: main 번들의 84/102 지점).
//    안전한 이유는 순서가 아니라 `sanitizeHTML`이 **호출 시점에** 전역을 읽기 때문이다.
//    그래서 모듈 최상위에서 `sanitizeHTML(...)`을 부르거나 `const P = DOMPurify`로
//    캡처하면 조용히 폴백한다 — 그때는 이 배치로 막을 수 없다.
import DOMPurify from 'dompurify';
window.XLSX = XLSX;
window.JSZip = JSZip;
window.DOMPurify = DOMPurify;

// Shared modules
import '../shared/sanitize.js';
// 정적 시·군 데이터 제거 - juso API 단독 사용
import '../shared/constants.js';
import '../shared/utils.js';
import '../shared/toast.js';
import '../shared/address.js';
import '../shared/address-parser.js';
import '../shared/theme.js';
import '../shared/tooltip.js';
import '../shared/logger.js';

// 분석결과 영속 저장소(Dexie/IndexedDB) — window.AnalysisDB 노출
import '../shared/analysis-db.js';

// 결과 가져오기 모달 (Phase 1)
// 미리보기 표 구성 순수 로직 (SAMPL-1-158 — importer보다 먼저: window.PreviewTable 준비)
import './preview-table.js';
import './heuktoram-result-importer.js';

// Main script
import './heuktoram-script.js';
