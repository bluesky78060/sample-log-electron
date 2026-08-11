/**
 * 토양 시료 로그 레코드 빌더 (순수 팩토리 · 단위 테스트 대상)
 *
 * submitForm의 4개 분기(그룹수정/신규 × 작물분할/단일)에 거의 동일하게 중복되던
 * 레코드 객체 리터럴을 단일화한다. 모드별 차이는 opts로 흡수해 동작을 그대로 보존:
 *   - isGroupEdit=true  : 그룹 수정 — existingLog 전체를 보존(폼 밖 필드 포함, SAMPL-1-147)
 *                         (createdAt/isComplete는 totalParcels 뒤에 명시 삽입)
 *   - isGroupEdit=false : 신규 등록 — createdAt/updatedAt 등은 호출측 commonData에 포함
 *   - crop 지정         : 한 필지 다중작물 분할 모드(작물별 1건, subLots 미복제, cropIndex 부여)
 *   - crop 미지정       : 필지 단위 1건(작물 전체 합산)
 *
 * 메인 데이터 모델 보존 포인트(soil 프로젝트와의 차이):
 *   - cropIndex는 분할 모드에서 parcelIndex 바로 뒤(totalParcels 앞)에 삽입한다.
 *   - 그룹 수정은 existingLog를 전개해 폼 밖 필드까지 보존한다 (SAMPL-1-147).
 *     mailDate·gongikOrder·gongikBaseYear·businessRegNo·basePnu는 폼에 입력란이 없고
 *     목록 인라인/일괄바/결과 가져오기로만 설정되므로, 열거 방식으로는 조용히 유실됐다.
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
            // 그룹 수정 시 기존 레코드를 먼저 펼쳐 폼 밖 필드를 보존한다 (SAMPL-1-147).
            // mailDate(우편발송일자)와 공익직불제 필드(gongikOrder/gongikBaseYear/businessRegNo/basePnu)는
            // 폼에 입력란이 없고 목록 인라인·일괄바·결과 가져오기로만 설정되므로,
            // 보존 목록을 열거하는 방식으로는 필드가 추가될 때마다 조용히 유실된다.
            // 단건 수정 분기(soil-script.js: `...existingLog`)와 계약을 일치시킨다.
            // 아래 필드들은 전개 뒤에서 전부 재대입되므로 낡은 값이 남지 않는다.
            ...(isGroupEdit && existingLog ? existingLog : {}),
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
        // 분할이 아니면 기존 레코드에서 펼쳐진 낡은 cropIndex를 제거 (작물 2개 → 1개로 줄인 경우)
        else if ('cropIndex' in rec) delete rec.cropIndex;

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

    // ── 폼 복원 폴백 (SAMPL-1-119) ─────────────────────────────────────
    // parcels[0]가 비어있는 레코드(레거시/Firestore 동기화/부분저장)는 수정 폼 복원 시
    // 레코드 최상위 권위 필드로 보완한다. 정상 데이터(필지별 값 존재)는 발동하지 않아 동작 보존.

    /** 필지 구분: 필지별 값 우선, 없으면 최상위 subCategory('-' 센티넬 제외) */
    function resolveParcelCategory(parcelCategory, log) {
        if (parcelCategory) return parcelCategory;
        const sub = log && log.subCategory;
        return (sub && sub !== '-') ? sub : '';
    }

    /** 필지 용도: 필지별 값 우선, 없으면 최상위 purpose */
    function resolveParcelPurpose(parcelPurpose, log) {
        return parcelPurpose || (log && log.purpose) || '';
    }

    /**
     * cropsDisplay(콤마 결합 가능) + area → crops 배열 재구성.
     * 콤마 결합형은 작물별 면적 분배가 불가하므로 area는 첫 작물에만 부여한다.
     */
    function cropsFromDisplay(log) {
        const disp = ((log && log.cropsDisplay) || '').trim();
        if (!disp || disp === '-') return [];
        const names = disp.split(',').map(s => s.trim()).filter(Boolean);
        return names.map((name, i) => ({ name, area: i === 0 ? ((log && log.area) || '') : '' }));
    }

    const api = { buildSoilLogRecord, resolveParcelCategory, resolveParcelPurpose, cropsFromDisplay };
    if (typeof window !== 'undefined') window.SoilLogRecord = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
