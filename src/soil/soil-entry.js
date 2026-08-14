// npm packages
import * as XLSX from 'xlsx-js-style';
import DOMPurify from 'dompurify';
window.XLSX = XLSX;
window.DOMPurify = DOMPurify;

// Shared modules (순서 유지 - window.* 전역 설정)
import '../shared/sanitize.js';
import '../shared/constants.js';
import '../shared/file-api.js';
import '../shared/utils.js';
import '../shared/toast.js';
import '../shared/pagination.js';
import '../shared/address.js';
import '../shared/address-parser.js';
import '../shared/autocomplete-manager.js';
import '../shared/juso-service.js';
import '../shared/search-filter.js';
import '../shared/form-validator.js';
import '../shared/theme.js';
import '../shared/tooltip.js';
import '../shared/logger.js';
import '../shared/network-config.js';
import '../shared/network-access.js';
import '../shared/firebase-config.js';
import '../shared/firestore-db.js';
import '../shared/storage-manager.js';
import '../shared/sync-utils.js';
import '../shared/BaseSampleManager.js';
import '../shared/excel-import-manager.js';

// Data
import '../cropData.js';
// 작물 데이터 자체 업로드 로더 (SAMPL-1-126): cropData.js 뒤에 로드해 window.CROP_DATA 교체 가능
import '../shared/crop-data-loader.js';
window.CropDataLoader?.loadCropDataOnStartup?.(); // fire-and-forget (await 금지)
// 정적 시·군 데이터 제거 - 자동완성은 juso API 단독

// Soil-specific pure logic modules (window.* 전역, soil-script보다 먼저 로드)
import './reception-number.js';
// 레코드 빌더 순수 로직 (soil-script.js 전 — window.SoilLogRecord 준비)
import './soil-log-record.js';
// 완료 그룹핑 순수 로직 (soil-script.js 전 — window.ReceptionGroup 준비)
import './reception-group.js';
// 작물 검색 순수 로직 (SAMPL-1-156 — window.CropSearch 준비)
import './crop-search.js';

// Main script
import './soil-script.js';

// 엑셀 가져오기 모달 (SAMPL-1-85: soil-result-importer, 자체완결 · soil-script 이후 로드)
import './soil-result-importer.js';
