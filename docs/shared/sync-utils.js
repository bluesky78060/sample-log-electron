/**
 * @fileoverview 클라우드 동기화 유틸리티
 * @description Firebase와 로컬 데이터 간 스마트 병합 기능
 */

// ========================================
// 타임스탬프 헬퍼
// ========================================

/**
 * 다양한 형식의 타임스탬프를 밀리초로 변환
 * @param {Object|string|number|null} updatedAt - 타임스탬프
 * @returns {number} 밀리초 타임스탬프 (없으면 0)
 */
function getTimestamp(updatedAt) {
    if (!updatedAt) return 0;
    // Firestore Timestamp 객체
    if (updatedAt.seconds) return updatedAt.seconds * 1000;
    // ISO 문자열
    if (typeof updatedAt === 'string') return new Date(updatedAt).getTime();
    // 숫자
    if (typeof updatedAt === 'number') return updatedAt;
    return 0;
}

// ========================================
// 스마트 병합
// ========================================

/**
 * 로컬과 클라우드 데이터를 updatedAt 기준으로 스마트 병합
 * @param {Array} localData - 로컬 데이터 배열
 * @param {Array} cloudData - 클라우드 데이터 배열
 * @returns {Object} { data: 병합된 배열, hasChanges: 변경 여부, updated: 업데이트 건수, added: 추가 건수 }
 */
function smartMerge(localData, cloudData) {
    const localMap = new Map();

    // 로컬 데이터를 ID로 매핑
    localData.forEach(item => {
        const id = item.id || item.receptionNumber;
        if (id) localMap.set(id, item);
    });

    const merged = [];
    const processedIds = new Set();
    let updated = 0;
    let added = 0;
    let hasChanges = false;

    // 클라우드 데이터 기준으로 병합
    cloudData.forEach(cloudItem => {
        const id = cloudItem.id || cloudItem.receptionNumber;
        if (!id) return;

        processedIds.add(id);
        const localItem = localMap.get(id);

        if (!localItem) {
            // 클라우드에만 있는 데이터 (새로 추가됨)
            merged.push(cloudItem);
            added++;
            hasChanges = true;
        } else {
            // 양쪽에 있는 데이터 - updatedAt 비교
            const cloudTime = getTimestamp(cloudItem.updatedAt);
            const localTime = getTimestamp(localItem.updatedAt);

            if (cloudTime > localTime) {
                // 클라우드가 더 최신
                merged.push(cloudItem);
                updated++;
                hasChanges = true;
            } else {
                // 로컬이 더 최신이거나 동일
                merged.push(localItem);
            }
        }
    });

    // 로컬에만 있는 데이터 추가 (클라우드에 아직 업로드 안된 것)
    localData.forEach(localItem => {
        const id = localItem.id || localItem.receptionNumber;
        if (id && !processedIds.has(id)) {
            merged.push(localItem);
        }
    });

    // 접수번호 기준 정렬
    merged.sort((a, b) => {
        const aNum = parseInt(a.receptionNumber) || 0;
        const bNum = parseInt(b.receptionNumber) || 0;
        return aNum - bNum;
    });

    return { data: merged, hasChanges, updated, added };
}

// ========================================
// 전역 내보내기
// ========================================

window.SyncUtils = {
    smartMerge,
    getTimestamp
};
