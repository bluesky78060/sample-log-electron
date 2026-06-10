/**
 * 토양 시료 로그 레코드 빌더 (순수 팩토리 · 단위 테스트 대상)
 *
 * submitForm의 4개 분기(그룹수정/신규 × 작물분할/단일)에 거의 동일하게 중복되던
 * 레코드 객체 리터럴을 단일화한다. 모드별 차이는 opts로 흡수해 동작을 그대로 보존:
 *   - isGroupEdit=true  : 그룹 수정 — existingLog에서 id/createdAt/isComplete 보존
 *                         (createdAt/isComplete는 totalParcels 뒤에 명시 삽입)
 *   - isGroupEdit=false : 신규 등록 — createdAt/updatedAt 등은 호출측 commonData에 포함
 *   - crop 지정         : 한 필지 다중작물 분할 모드(작물별 1건, subLots 미복제, cropIndex 부여)
 *   - crop 미지정       : 필지 단위 1건(작물 전체 합산)
 *
 * 메인 데이터 모델 보존 포인트(soil 프로젝트와의 차이):
 *   - cropIndex는 분할 모드에서 parcelIndex 바로 뒤(totalParcels 앞)에 삽입한다.
 *   - 그룹 수정 보존 필드는 id/createdAt/isComplete 뿐이다
 *     (gongik/basePnu/businessRegNo는 commonData/별도 경로로 흐르므로 여기서 주입하지 않음).
 *   - commonData에 landClass1/receptionMethod 등 메인 고유 필드가 spread로 포함된다.
 *
 * @global window.SoilLogRecord
 */
(function () {
    'use strict';

    function newId(fallback) {
        return (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : fallback;
    }

    /**
     * 레코드 1건 생성.
     * @param {Object} parcel - 필지 { lotAddress, isMountain, subLots, crops, category, purpose, note }
     * @param {Object} opts
     * @param {string} opts.receptionNumber
     * @param {Object} opts.commonData     - 폼 공통 데이터(모드별 구성 다름, 그대로 spread)
     * @param {string} opts.groupId
     * @param {number} opts.index          - 0-based 필지 인덱스
     * @param {number} opts.totalParcels
     * @param {Object} [opts.crop]         - 분할 모드의 단일 작물 (없으면 필지 단위)
     * @param {number} [opts.cropIndex]    - 0-based 작물 인덱스 (분할 모드)
     * @param {boolean} [opts.isGroupEdit] - 그룹 수정 모드 여부
     * @param {Object} [opts.existingLog]  - 그룹 수정 시 보존할 기존 레코드(없을 수 있음)
     * @param {string} [opts.now]          - 생성 시각 ISO(미지정 시 호출 시점)
     * @returns {Object} 시료 로그 레코드
     */
    function buildSoilLogRecord(parcel, opts) {
        const o = opts || {};
        const common = o.commonData || {};
        const crop = o.crop || null;
        const isSplit = crop != null;
        const existingLog = o.existingLog;
        const isGroupEdit = !!o.isGroupEdit;
        const nowISO = o.now || new Date().toISOString();

        const rec = {
            id: (existingLog && existingLog.id) || newId(nowISO),
            receptionNumber: o.receptionNumber,
            ...common,
            subCategory: parcel.category || common.subCategory,
            purpose: parcel.purpose || common.purpose,
            groupId: o.groupId,
            parcelIndex: o.index + 1
        };

        // 분할 모드: cropIndex는 parcelIndex 바로 뒤(totalParcels 앞)에 삽입 — 메인 인라인 순서 보존
        if (isSplit) rec.cropIndex = o.cropIndex + 1;

        rec.totalParcels = o.totalParcels;

        // 그룹 수정 모드: 기존 레코드에서 보존(없으면 기본값) — totalParcels 뒤 명시 삽입
        if (isGroupEdit) {
            rec.createdAt = (existingLog && existingLog.createdAt) || nowISO;
            rec.isComplete = (existingLog && existingLog.isComplete) || false;
        }

        rec.parcels = [{
            id: newId(nowISO),
            lotAddress: parcel.lotAddress,
            isMountain: parcel.isMountain || false,
            subLots: isSplit ? [] : [...parcel.subLots],
            crops: isSplit ? [{ ...crop }] : parcel.crops.map(c => ({ ...c })),
            category: parcel.category || '',
            purpose: parcel.purpose || '',
            note: parcel.note || ''
        }];
        rec.lotAddress = parcel.lotAddress;
        rec.area = isSplit
            ? (parseFloat(crop.area) || 0).toString()
            : parcel.crops.reduce((sum, c) => sum + (parseFloat(c.area) || 0), 0).toString();
        rec.cropsDisplay = isSplit
            ? (crop.name || '-')
            : (parcel.crops.map(c => c.name).join(', ') || '-');

        return rec;
    }

    const api = { buildSoilLogRecord };
    if (typeof window !== 'undefined') window.SoilLogRecord = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
