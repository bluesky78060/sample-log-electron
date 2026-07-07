// npm packages
import * as XLSX from 'xlsx-js-style';
import DOMPurify from 'dompurify';
window.XLSX = XLSX; // 작물 데이터 .xlsx 파싱에 필요 (SAMPL-1-126, soil-entry.js와 동일 패턴)
window.DOMPurify = DOMPurify;

// Shared modules (순서 유지 - window.* 전역 설정)
import '../shared/logger.js';
import '../shared/network-config.js';
import '../shared/network-access.js';
import '../shared/firebase-config.js';
import '../shared/firestore-db.js';
import '../shared/storage-manager.js';
import '../shared/sanitize.js';
import '../shared/toast.js';
import '../shared/theme.js';
import '../shared/cache-manager.js';

// MRL API (식품안전나라)
import '../shared/mrl-api.js';

// 작물 데이터 (SAMPL-1-126): 번들 기본값 + 자체 업로드 로더/파서
import '../cropData.js';
import '../shared/crop-data-loader.js';

// Main script
import './settings-script.js';
