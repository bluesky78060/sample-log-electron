/**
 * @fileoverview Firebase 설정 및 초기화 (compat 버전)
 * @description Firebase Firestore 연결 설정
 *
 * 사용 전 Firebase Console에서 프로젝트 생성 필요:
 * 1. https://console.firebase.google.com/ 접속
 * 2. 프로젝트 생성 (예: sample-log-bonghwa)
 * 3. Firestore Database 생성 (테스트 모드로 시작)
 * 4. 프로젝트 설정 > 웹 앱 추가 > 설정값 복사
 * 5. 설정 페이지에서 값 입력
 */

// ========================================
// Firebase 초기화 상태
// ========================================

/** @type {boolean} 디버그 모드 (프로덕션에서는 false) */
const DEBUG_FIREBASE = true;

/** 조건부 로깅 */
const logFirebase = (...args) => DEBUG_FIREBASE && console.log('[Firebase]', ...args);

let db = null;
let isFirebaseEnabled = false;
let isOfflineEnabled = false;
let firebaseConfigData = null;

// localStorage 키
const FIREBASE_CONFIG_KEY = 'firebase_config';

// 기본 Firebase 설정 (내장)
const DEFAULT_FIREBASE_CONFIG = {
    apiKey: "AIzaSyAe8PmU_xPmUCPC7Ift9BYtp7Reib4cWLQ",
    authDomain: "sample-log-electron.firebaseapp.com",
    projectId: "sample-log-electron",
    storageBucket: "sample-log-electron.firebasestorage.app",
    messagingSenderId: "714729425268",
    appId: "1:714729425268:web:dcd6eaa5b64ab227378421",
    measurementId: "G-5ET4E14885"
};

/**
 * localStorage에서 Firebase 설정 로드 (없으면 기본값 사용)
 * @returns {Object|null}
 */
function loadFirebaseConfig() {
    try {
        const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Firebase 설정 로드 실패:', e);
    }
    // localStorage에 설정이 없으면 기본 설정 사용
    return DEFAULT_FIREBASE_CONFIG;
}

/**
 * Firebase 설정이 유효한지 확인
 * @returns {boolean}
 */
function isFirebaseConfigValid() {
    const config = loadFirebaseConfig();
    if (!config) return false;

    return config.apiKey &&
           config.apiKey.trim() !== '' &&
           config.apiKey !== 'YOUR_API_KEY' &&
           config.projectId &&
           config.projectId.trim() !== '' &&
           config.projectId !== 'YOUR_PROJECT_ID';
}

/**
 * Firebase 초기화 (compat 버전)
 * @returns {Promise<boolean>} 초기화 성공 여부
 */
async function initializeFirebase() {
    logFirebase('초기화 시작...');

    // 이미 초기화되어 있으면 true 반환
    if (isFirebaseEnabled && db) {
        logFirebase('이미 초기화됨');
        return true;
    }

    // 네트워크 접근 체크
    if (window.NetworkAccess) {
        const accessResult = await window.NetworkAccess.checkAccess();
        logFirebase('네트워크 접근 체크:', accessResult);

        if (!accessResult.allowed) {
            logFirebase('네트워크 접근 거부:', accessResult.reason);
            console.warn('[Firebase] 허용되지 않은 네트워크입니다. 로컬 모드로 동작합니다.');
            return false;
        }
    }

    // firebase compat SDK가 로드되었는지 확인
    if (typeof firebase === 'undefined') {
        console.error('[Firebase] SDK가 로드되지 않았습니다. firebase-app-compat.js를 먼저 로드하세요.');
        return false;
    }

    firebaseConfigData = loadFirebaseConfig();
    logFirebase('로드된 설정:', firebaseConfigData ? '있음' : '없음');

    if (!firebaseConfigData) {
        logFirebase('설정이 없습니다. localStorage 모드로 동작합니다.');
        return false;
    }

    logFirebase('설정값 확인:', {
        apiKey: firebaseConfigData.apiKey ? firebaseConfigData.apiKey.substring(0, 10) + '...' : '없음',
        projectId: firebaseConfigData.projectId || '없음',
        authDomain: firebaseConfigData.authDomain || '없음'
    });

    if (!isFirebaseConfigValid()) {
        logFirebase('설정이 유효하지 않습니다.');
        return false;
    }

    try {
        logFirebase('앱 초기화 중...');

        // 이미 초기화된 앱이 있는지 확인
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfigData);
        }

        db = firebase.firestore();
        logFirebase('Firestore 연결됨');

        // 오프라인 지원 활성화
        try {
            await db.enablePersistence();
            isOfflineEnabled = true;
            logFirebase('오프라인 지원 활성화됨');
        } catch (err) {
            console.warn('[Firebase] 오프라인 지원 에러:', err.code, err.message);
            if (err.code === 'failed-precondition') {
                console.warn('[Firebase] 여러 탭이 열려 있어 오프라인 지원이 제한됩니다.');
            } else if (err.code === 'unimplemented') {
                console.warn('[Firebase] 이 브라우저는 오프라인 지원을 지원하지 않습니다.');
            }
        }

        isFirebaseEnabled = true;
        logFirebase('초기화 완료:', firebaseConfigData.projectId);
        return true;
    } catch (error) {
        console.error('[Firebase] 초기화 실패:', error);
        console.error('[Firebase] 에러 상세:', error.message, error.stack);
        return false;
    }
}

/**
 * Firestore DB 인스턴스 반환
 * @returns {Object|null}
 */
function getDb() {
    return db;
}

/**
 * Firebase 활성화 여부 확인
 * @returns {boolean}
 */
function isEnabled() {
    return isFirebaseEnabled;
}

/**
 * 오프라인 지원 활성화 여부 확인
 * @returns {boolean}
 */
function isOfflineSupported() {
    return isOfflineEnabled;
}

// 전역으로 내보내기
window.firebaseConfig = {
    initialize: initializeFirebase,
    getDb: getDb,
    isEnabled: isEnabled,
    isOfflineSupported: isOfflineSupported,
    isConfigValid: isFirebaseConfigValid
};
