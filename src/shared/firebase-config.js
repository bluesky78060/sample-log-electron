/**
 * @fileoverview Firebase 설정 및 초기화
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
let app = null;
let db = null;
let isFirebaseEnabled = false;
let isOfflineEnabled = false;
let firebaseConfig = null;

// localStorage 키
const FIREBASE_CONFIG_KEY = 'firebase_config';

/**
 * localStorage에서 Firebase 설정 로드
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
    return null;
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
 * Firebase 초기화
 * @returns {Promise<boolean>} 초기화 성공 여부
 */
async function initializeFirebase() {
    console.log('[Firebase] 초기화 시작...');

    // 이미 초기화되어 있으면 true 반환
    if (isFirebaseEnabled && db) {
        console.log('[Firebase] 이미 초기화됨');
        return true;
    }

    firebaseConfig = loadFirebaseConfig();
    console.log('[Firebase] 로드된 설정:', firebaseConfig ? '있음' : '없음');

    if (!firebaseConfig) {
        console.log('[Firebase] 설정이 없습니다. localStorage 모드로 동작합니다.');
        return false;
    }

    console.log('[Firebase] 설정값 확인:', {
        apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 10) + '...' : '없음',
        projectId: firebaseConfig.projectId || '없음',
        authDomain: firebaseConfig.authDomain || '없음'
    });

    if (!isFirebaseConfigValid()) {
        console.log('[Firebase] 설정이 유효하지 않습니다.');
        return false;
    }

    try {
        console.log('[Firebase] SDK 로드 중...');
        // Firebase 앱 초기화
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, enableIndexedDbPersistence } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        console.log('[Firebase] SDK 로드 완료, 앱 초기화 중...');
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);

        console.log('[Firebase] Firestore 연결됨');

        // 오프라인 지원 활성화
        try {
            await enableIndexedDbPersistence(db);
            isOfflineEnabled = true;
            console.log('[Firebase] 오프라인 지원 활성화됨');
        } catch (err) {
            console.warn('[Firebase] 오프라인 지원 에러:', err.code, err.message);
            if (err.code === 'failed-precondition') {
                console.warn('[Firebase] 여러 탭이 열려 있어 오프라인 지원이 제한됩니다.');
            } else if (err.code === 'unimplemented') {
                console.warn('[Firebase] 이 브라우저는 오프라인 지원을 지원하지 않습니다.');
            }
        }

        isFirebaseEnabled = true;
        console.log('[Firebase] 초기화 완료:', firebaseConfig.projectId);
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
