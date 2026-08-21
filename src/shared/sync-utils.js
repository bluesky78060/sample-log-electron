// @ts-check
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
// ID 정규화 헬퍼
// ========================================

/**
 * ID를 문자열로 정규화하여 일관된 비교 가능하게 함
 * 숫자, 문자열 혼용 문제 해결
 * @param {string|number|null|undefined} id - 원본 ID
 * @returns {string|null} 정규화된 문자열 ID
 */
function normalizeId(id) {
    if (id === null || id === undefined) return null;
    if (typeof id === 'number' && !isNaN(id)) return String(id);
    if (typeof id === 'string') {
        const trimmed = id.trim();
        return trimmed !== '' ? trimmed : null;
    }
    return null;
}

/**
 * 아이템에서 ID 추출 (정규화 포함)
 * @param {Object} item - 데이터 아이템
 * @returns {string|null} 정규화된 ID
 */
function getItemId(item) {
    if (!item) return null;
    return normalizeId(item.id) || normalizeId(item.receptionNumber);
}

// ========================================
// 스마트 병합
// ========================================

/**
 * 로컬과 클라우드 데이터를 updatedAt 기준으로 스마트 병합
 * Firebase가 진실의 원천(source of truth) - 클라우드에서 삭제된 항목은 로컬에서도 삭제
 * @param {Array} localData - 로컬 데이터 배열
 * @param {Array} cloudData - 클라우드 데이터 배열
 * @param {Object} [options] - 옵션
 * @param {boolean} [options.allowDeletions=true] - cross-device 삭제 반영 여부.
 *   false면 클라우드에 없는 syncedAt 로컬 항목을 삭제하지 않고 보존한다.
 *   (SAMPL-1-80: 캐시/불완전 읽기에서 유효 레코드가 영구 삭제되는 것을 방지)
 * @returns {Object} { data: 병합된 배열, hasChanges: 변경 여부, updated: 업데이트 건수, added: 추가 건수, deleted: 삭제 건수 }
 */
function smartMerge(localData, cloudData, options = {}) {
    const { allowDeletions = true } = options;
    const localMap = new Map();
    const cloudIds = new Set();

    // 로컬 데이터를 정규화된 ID로 매핑
    localData.forEach(item => {
        const id = getItemId(item);
        if (id) localMap.set(id, item);
    });

    // 클라우드 ID 집합 생성 (정규화된 ID 사용)
    cloudData.forEach(item => {
        const id = getItemId(item);
        if (id) cloudIds.add(id);
    });

    const merged = [];
    const processedIds = new Set();
    let updated = 0;
    let added = 0;
    let deleted = 0;
    let hasChanges = false;

    // 클라우드 데이터 기준으로 병합
    cloudData.forEach(cloudItem => {
        const id = getItemId(cloudItem);
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
                merged.push({ ...localItem });
            }
        }
    });

    // 로컬에만 있는 데이터 처리
    // - syncedAt이 있으면: 이전에 클라우드와 동기화된 적 있음 → 클라우드에서 삭제됨 → 로컬에서도 삭제
    //   (단, allowDeletions=false면 보존 — 신뢰할 수 없는 캐시/불완전 읽기에서는 삭제 판정 무효)
    // - syncedAt이 없으면: 아직 업로드 안된 로컬 데이터 → 유지
    localData.forEach(localItem => {
        const id = getItemId(localItem);
        if (id && !processedIds.has(id)) {
            if (localItem.syncedAt && allowDeletions) {
                // 이전에 동기화된 적 있는데 (authoritative) 클라우드에 없음 = 클라우드에서 삭제됨
                deleted++;
                hasChanges = true;
                // merged에 추가하지 않음 (삭제)
            } else {
                // 아직 업로드 안된 로컬 데이터 또는 비신뢰 읽기(allowDeletions=false) → 유지
                merged.push({ ...localItem });
            }
        }
    });

    // 접수번호 기준 정렬
    merged.sort((a, b) => {
        const aNum = parseInt(a.receptionNumber, 10) || 0;
        const bNum = parseInt(b.receptionNumber, 10) || 0;
        // 숫자 동률(또는 비숫자 접수번호로 NaN→0 clump) 시 문자열 보조 정렬로 안정화
        return aNum - bNum || String(a.receptionNumber || '').localeCompare(String(b.receptionNumber || ''));
    });

    // ⚠️ **번호 충돌을 조용히 통과시키지 않는다** (SAMPL-1-166).
    //    이 병합은 `id` 기준이라, id가 다르고 접수번호가 같은 두 레코드는
    //    **둘 다 살아남는다.** 실제로 그렇게 새어 들어온 중복이 담당자 데이터에서
    //    3종 6건 발견됐다(2026-08-21). 접수번호는 분석결과 매칭 키이므로
    //    같은 번호가 둘이면 어느 시료의 결과인지 확정할 수 없다.
    //
    //    등록을 막지는 않는다 — 이 앱은 오프라인 우선이고, 병합은 이미 일어난 뒤다.
    //    대신 **누가 겹쳤는지 알려준다.** 사후 발견이라도 조용한 것보다 낫다.
    const receptionConflicts = findReceptionConflicts(merged);

    return { data: merged, hasChanges, updated, added, deleted, receptionConflicts };
}

/**
 * 병합 결과에서 **접수번호가 겹치는 무리**를 찾는다 (SAMPL-1-166, 순수 함수).
 *
 * 겹침 판정은 `경지구분1차 + 접수번호` 범위다 — 채번이 경지구분 단위로 독립이라
 * 다른 경지구분의 같은 번호는 충돌이 아니다.
 *
 * ⚠️ **접수번호가 빈 레코드는 세지 않는다.** 그것은 별개의 문제이고,
 *    여기 섞으면 "빈 번호끼리 충돌"이라는 무의미한 보고가 쏟아진다.
 *
 * @param {Array<Object>} records
 * @returns {Array<{landClass1: string, receptionNumber: string, ids: Array<string>}>}
 */
function findReceptionConflicts(records) {
    const list = Array.isArray(records) ? records : [];
    /** @type {Map<string, Array<string>>} */
    const byKey = new Map();

    for (const r of list) {
        if (!r) continue;
        const num = String(r.receptionNumber ?? '').trim();
        if (!num) continue;
        const cls = r.landClass1 || '농가의뢰';
        const key = `${cls}\u0000${num}`;
        const bucket = byKey.get(key);
        if (bucket) bucket.push(String(r.id ?? ''));
        else byKey.set(key, [String(r.id ?? '')]);
    }

    const out = [];
    for (const [key, ids] of byKey) {
        if (ids.length < 2) continue;
        const sep = key.indexOf('\u0000');
        out.push({
            landClass1: key.slice(0, sep),
            receptionNumber: key.slice(sep + 1),
            ids,
        });
    }
    return out;
}

/**
 * 클라우드 로드 시 안전 병합 — smartMerge 결과에 로컬 전용(미업로드) 항목 목록을 추가로 반환
 * loadYearData의 무병합 덮어쓰기(데이터 유실)를 대체하기 위한 함수
 * @param {Array} localData - 로컬 데이터 배열
 * @param {Array} cloudData - 클라우드 데이터 배열
 * @returns {Object} { data, hasChanges, updated, added, deleted, localOnly }
 *   localOnly: 클라우드에 없어서 재업로드가 필요한 로컬 항목 배열
 */
function mergeCloudData(localData, cloudData, options = {}) {
    // SAMPL-1-80: fromCache(비신뢰 읽기)면 cross-device 삭제를 적용하지 않는다.
    // 캐시/오프라인/일시단절로 불완전한 클라우드 응답이 와도 유효 로컬 레코드를 보존.
    const { fromCache = false } = options;
    const result = smartMerge(localData, cloudData, { allowDeletions: !fromCache });

    const cloudIds = new Set();
    (cloudData || []).forEach(item => {
        const id = getItemId(item);
        if (id) cloudIds.add(id);
    });

    const localOnly = result.data.filter(item => {
        const id = getItemId(item);
        return id && !cloudIds.has(id);
    });

    return { ...result, localOnly };
}

// ========================================
// 전역 내보내기
// ========================================

const SyncUtilsAPI = {
    smartMerge,
    mergeCloudData,
    getTimestamp,
    normalizeId,
    getItemId,
    findReceptionConflicts
};

// 브라우저: window 전역 노출 (기존 패턴 유지)
if (typeof window !== 'undefined') {
    window.SyncUtils = SyncUtilsAPI;
}
// Node (단위 테스트): CommonJS export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyncUtilsAPI;
}
