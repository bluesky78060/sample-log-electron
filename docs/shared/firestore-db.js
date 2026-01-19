/**
 * @fileoverview Firestore 데이터베이스 CRUD 모듈
 * @description 시료 데이터의 Firestore 저장/조회/수정/삭제 기능
 *
 * 컬렉션 구조:
 * - soilSamples: 토양 시료
 * - waterSamples: 수질분석 시료
 * - compostSamples: 퇴·액비 시료
 * - heavyMetalSamples: 토양 중금속 시료
 * - pesticideSamples: 잔류농약 시료
 */

// Firestore 모듈 참조
let firestore = null;

/** @type {boolean} 디버그 모드 (프로덕션에서는 false) */
const DEBUG_FIRESTORE = true;

/** 조건부 로깅 */
const logFirestore = (...args) => DEBUG_FIRESTORE && console.log('[Firestore]', ...args);

// 컬렉션 이름 매핑
const COLLECTION_MAP = {
    'soil': 'soilSamples',
    'water': 'waterSamples',
    'compost': 'compostSamples',
    'heavyMetal': 'heavyMetalSamples',
    'heavy-metal': 'heavyMetalSamples',
    'pesticide': 'pesticideSamples'
};

/**
 * Firestore 모듈 초기화
 * @returns {Promise<boolean>} 초기화 성공 여부
 */
async function initFirestore() {
    if (!window.firebaseConfig?.isEnabled()) {
        logFirestore('Firebase가 비활성화 상태입니다.');
        return false;
    }

    try {
        firestore = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        logFirestore('모듈 로드 완료');
        return true;
    } catch (error) {
        console.error('[Firestore] 모듈 로드 실패:', error);
        return false;
    }
}

/**
 * 컬렉션 이름 가져오기
 * @param {string} sampleType - 시료 타입 (soil, water, compost, heavyMetal, pesticide)
 * @param {number} year - 연도
 * @returns {string} 컬렉션 이름
 */
function getCollectionName(sampleType, year) {
    const baseName = COLLECTION_MAP[sampleType] || sampleType;
    return `${baseName}_${year}`;
}

/**
 * 단일 문서 저장/업데이트
 * @param {string} sampleType - 시료 타입
 * @param {number} year - 연도
 * @param {string} docId - 문서 ID
 * @param {Object} data - 저장할 데이터
 * @returns {Promise<boolean>} 성공 여부
 */
async function saveDocument(sampleType, year, docId, data) {
    if (!window.firebaseConfig?.isEnabled()) {
        return false;
    }

    try {
        const db = window.firebaseConfig.getDb();
        const collectionName = getCollectionName(sampleType, year);

        const { doc, setDoc, serverTimestamp } = firestore;
        const docRef = doc(db, collectionName, docId);

        await setDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp(),
            syncedAt: serverTimestamp()
        }, { merge: true });

        logFirestore(`저장 완료: ${collectionName}/${docId}`);
        return true;
    } catch (error) {
        console.error('Firestore 저장 실패:', error);
        return false;
    }
}

/**
 * 단일 문서 조회
 * @param {string} sampleType - 시료 타입
 * @param {number} year - 연도
 * @param {string} docId - 문서 ID
 * @returns {Promise<Object|null>} 문서 데이터 또는 null
 */
async function getDocument(sampleType, year, docId) {
    if (!window.firebaseConfig?.isEnabled()) {
        return null;
    }

    try {
        const db = window.firebaseConfig.getDb();
        const collectionName = getCollectionName(sampleType, year);

        const { doc, getDoc } = firestore;
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Firestore 조회 실패:', error);
        return null;
    }
}

/**
 * 컬렉션 전체 조회
 * @param {string} sampleType - 시료 타입
 * @param {number} year - 연도
 * @param {Object} options - 조회 옵션
 * @param {boolean} options.skipOrder - 정렬 생략 (속도 향상)
 * @returns {Promise<Array>} 문서 배열
 */
async function getAllDocuments(sampleType, year, options = {}) {
    if (!window.firebaseConfig?.isEnabled()) {
        return [];
    }

    try {
        const db = window.firebaseConfig.getDb();
        const collectionName = getCollectionName(sampleType, year);

        const { collection, getDocs, query, orderBy } = firestore;

        // 정렬 옵션 - 인덱스 없이 빠르게 조회하려면 skipOrder: true
        let q;
        if (options.skipOrder) {
            q = query(collection(db, collectionName));
        } else {
            try {
                q = query(collection(db, collectionName), orderBy('updatedAt', 'desc'));
            } catch (indexError) {
                // 인덱스 오류 시 정렬 없이 재시도
                console.warn('[Firestore] 인덱스 없음, 정렬 없이 조회:', indexError.message);
                q = query(collection(db, collectionName));
            }
        }

        const querySnapshot = await getDocs(q);

        const documents = [];
        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });

        // skipOrder인 경우 로컬에서 정렬
        if (options.skipOrder && documents.length > 0) {
            documents.sort((a, b) => {
                const aTime = a.updatedAt?.seconds || 0;
                const bTime = b.updatedAt?.seconds || 0;
                return bTime - aTime;
            });
        }

        logFirestore(`조회 완료: ${collectionName} (${documents.length}건)`);
        return documents;
    } catch (error) {
        console.error('Firestore 전체 조회 실패:', error);
        return [];
    }
}

/**
 * 문서 삭제 (id 필드 기반 쿼리로 삭제)
 * @param {string} sampleType - 시료 타입
 * @param {number} year - 연도
 * @param {string} docId - 데이터의 id 필드 값
 * @returns {Promise<boolean>} 성공 여부
 */
async function deleteDocument(sampleType, year, docId) {
    if (!window.firebaseConfig?.isEnabled()) {
        return false;
    }

    try {
        const db = window.firebaseConfig.getDb();
        const collectionName = getCollectionName(sampleType, year);

        // ID를 문자열로 변환
        const stringDocId = typeof docId === 'number' ? String(docId) : String(docId || '');
        if (!stringDocId) {
            console.error('Firestore 삭제 실패: 유효하지 않은 문서 ID');
            return false;
        }

        const { doc, deleteDoc, collection, query, where, getDocs } = firestore;

        // 1차: 문서 ID로 직접 삭제 시도
        try {
            await deleteDoc(doc(db, collectionName, stringDocId));
            logFirestore(`삭제 완료 (문서ID): ${collectionName}/${stringDocId}`);
            return true;
        } catch (directError) {
            logFirestore(`문서ID로 삭제 실패, 쿼리로 재시도: ${stringDocId}`);
        }

        // 2차: id 필드로 쿼리하여 삭제
        const q = query(collection(db, collectionName), where('id', '==', stringDocId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            logFirestore(`삭제 대상 없음: ${collectionName} id=${stringDocId}`);
            return false;
        }

        // 찾은 문서 삭제
        const deletePromises = [];
        querySnapshot.forEach((docSnap) => {
            deletePromises.push(deleteDoc(doc(db, collectionName, docSnap.id)));
        });
        await Promise.all(deletePromises);

        logFirestore(`삭제 완료 (쿼리): ${collectionName} id=${stringDocId} (${querySnapshot.size}건)`);
        return true;
    } catch (error) {
        console.error('Firestore 삭제 실패:', error);
        return false;
    }
}

/**
 * 여러 문서 일괄 저장 (배치)
 * Firestore writeBatch는 최대 500개 작업으로 제한되므로 청크로 나누어 처리
 * @param {string} sampleType - 시료 타입
 * @param {number} year - 연도
 * @param {Array} documents - 저장할 문서 배열 [{id, ...data}]
 * @returns {Promise<boolean>} 성공 여부
 */
async function batchSave(sampleType, year, documents) {
    if (!window.firebaseConfig?.isEnabled() || !documents.length) {
        return false;
    }

    try {
        const db = window.firebaseConfig.getDb();
        const collectionName = getCollectionName(sampleType, year);

        const { doc, writeBatch, serverTimestamp } = firestore;

        // Firestore batch는 최대 500개로 제한됨
        const BATCH_SIZE = 450;
        const chunks = [];
        for (let i = 0; i < documents.length; i += BATCH_SIZE) {
            chunks.push(documents.slice(i, i + BATCH_SIZE));
        }

        logFirestore(`배치 저장 시작: ${collectionName} (${documents.length}건, ${chunks.length}개 청크)`);

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex];
            const batch = writeBatch(db);

            chunk.forEach((docData) => {
                // ID 유효성 검사 - 문자열로 변환 (원본 ID 유지)
                let docId = docData.id;

                // 숫자형 ID는 문자열로만 변환 (원본 값 유지)
                if (typeof docId === 'number') {
                    docId = String(docId);
                } else if (!docId || typeof docId !== 'string' || docId.trim() === '') {
                    // ID가 없거나 유효하지 않으면 새로 생성
                    docId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
                }

                const docRef = doc(db, collectionName, docId);
                batch.set(docRef, {
                    ...docData,
                    id: docId, // 문자열 ID 저장
                    updatedAt: serverTimestamp(),
                    syncedAt: serverTimestamp()
                }, { merge: true });
            });

            await batch.commit();
            logFirestore(`청크 ${chunkIndex + 1}/${chunks.length} 완료 (${chunk.length}건)`);
        }

        logFirestore(`배치 저장 완료: ${collectionName} (${documents.length}건)`);
        return true;
    } catch (error) {
        console.error('Firestore 배치 저장 실패:', error);
        return false;
    }
}

/**
 * localStorage 데이터를 Firestore로 마이그레이션
 * @param {string} sampleType - 시료 타입
 * @param {number} year - 연도
 * @param {string} localStorageKey - localStorage 키
 * @returns {Promise<{success: boolean, count: number}>} 결과
 */
async function migrateFromLocalStorage(sampleType, year, localStorageKey) {
    if (!window.firebaseConfig?.isEnabled()) {
        return { success: false, count: 0 };
    }

    try {
        const localData = localStorage.getItem(localStorageKey);
        if (!localData) {
            logFirestore('마이그레이션할 데이터가 없습니다.');
            return { success: true, count: 0 };
        }

        const samples = JSON.parse(localData);
        if (!Array.isArray(samples) || samples.length === 0) {
            return { success: true, count: 0 };
        }

        // ID가 없는 경우 생성
        const documentsWithId = samples.map(sample => ({
            ...sample,
            id: sample.id || generateMigrationId()
        }));

        await batchSave(sampleType, year, documentsWithId);

        logFirestore(`마이그레이션 완료: ${localStorageKey} → Firestore (${documentsWithId.length}건)`);
        return { success: true, count: documentsWithId.length };
    } catch (error) {
        console.error('마이그레이션 실패:', error);
        return { success: false, count: 0 };
    }
}

/**
 * 마이그레이션용 ID 생성
 * @returns {string} 고유 ID
 */
function generateMigrationId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 실시간 동기화 리스너 설정
 * @param {string} sampleType - 시료 타입
 * @param {number} year - 연도
 * @param {Function} callback - 변경 시 호출될 콜백 함수
 * @returns {Function|null} 구독 해제 함수 또는 null
 */
function subscribeToChanges(sampleType, year, callback) {
    if (!window.firebaseConfig?.isEnabled()) {
        return null;
    }

    try {
        const db = window.firebaseConfig.getDb();
        const collectionName = getCollectionName(sampleType, year);

        const { collection, onSnapshot, query, orderBy } = firestore;
        const q = query(collection(db, collectionName), orderBy('updatedAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const documents = [];
            snapshot.forEach((doc) => {
                documents.push({ id: doc.id, ...doc.data() });
            });
            callback(documents, snapshot.metadata.fromCache);
        }, (error) => {
            console.error('실시간 동기화 에러:', error);
        });

        logFirestore(`실시간 동기화 시작: ${collectionName}`);
        return unsubscribe;
    } catch (error) {
        console.error('실시간 동기화 설정 실패:', error);
        return null;
    }
}

/**
 * Firestore 연결 상태 확인
 * @returns {boolean} 활성화 여부
 */
function isFirestoreEnabled() {
    return window.firebaseConfig?.isEnabled() === true && firestore !== null;
}

/**
 * 오프라인 지원 여부 확인
 * @returns {boolean} 오프라인 지원 여부
 */
function isFirestoreOfflineEnabled() {
    return window.firebaseConfig?.isOfflineSupported() === true;
}

// 전역으로 내보내기
window.firestoreDb = {
    init: initFirestore,
    save: saveDocument,
    get: getDocument,
    getAll: getAllDocuments,
    delete: deleteDocument,
    batchSave: batchSave,
    migrate: migrateFromLocalStorage,
    subscribe: subscribeToChanges,
    isEnabled: isFirestoreEnabled,
    isOfflineEnabled: isFirestoreOfflineEnabled,
    getCollectionName: getCollectionName
};
