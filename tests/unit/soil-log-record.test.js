import { describe, it, expect, beforeAll } from 'vitest'

// soil-log-record.js → window.SoilLogRecord.buildSoilLogRecord
let build
beforeAll(async () => {
    await import('../../src/soil/soil-log-record.js')
    build = window.SoilLogRecord.buildSoilLogRecord
})

const parcel = (over = {}) => ({
    lotAddress: '봉화군 봉화읍 내성리 123',
    isMountain: false,
    subLots: [{ id: 's1' }],
    crops: [{ name: '벼', area: '1000' }, { name: '콩', area: '500' }],
    category: '논',
    purpose: '일반재배',
    note: '비고',
    ...over,
})

// 신규 등록: commonData에 createdAt/updatedAt 포함 (메인 submitForm 신규 분기)
const commonNew = {
    date: '2026-06-04', name: '홍길동', phoneNumber: '010', address: '주소',
    subCategory: '-', purpose: '무농약', landClass1: '농가의뢰', receptionMethod: '-',
    note: '', createdAt: 'C', updatedAt: 'U',
}
// 그룹 수정: commonData에 updatedAt만 (createdAt/isComplete는 existingLog에서 보존)
const commonGroup = {
    date: '2026-06-04', name: '홍길동', phoneNumber: '010', address: '주소',
    subCategory: '-', purpose: '무농약', landClass1: '농가의뢰', receptionMethod: '-',
    note: '', updatedAt: 'U',
}

describe('buildSoilLogRecord — 신규 단일(필지 단위)', () => {
    const r = () => build(parcel(), {
        receptionNumber: '5', commonData: commonNew, groupId: 'g1',
        index: 0, totalParcels: 2, isGroupEdit: false,
    })

    it('공통 필드 + commonData spread', () => {
        const rec = r()
        expect(rec.receptionNumber).toBe('5')
        expect(rec.groupId).toBe('g1')
        expect(rec.parcelIndex).toBe(1)
        expect(rec.totalParcels).toBe(2)
        expect(rec.name).toBe('홍길동')
        expect(rec.landClass1).toBe('농가의뢰')   // 메인 고유 필드
        expect(rec.createdAt).toBe('C')           // commonData에서
        expect(rec.updatedAt).toBe('U')
    })
    it('parcel.category/purpose가 commonData보다 우선', () => {
        const rec = r()
        expect(rec.subCategory).toBe('논')      // parcel.category
        expect(rec.purpose).toBe('일반재배')     // parcel.purpose
    })
    it('단일 모드: 작물 전체 합산 area, join cropsDisplay, subLots 복제', () => {
        const rec = r()
        expect(rec.area).toBe('1500')                  // 1000+500
        expect(rec.cropsDisplay).toBe('벼, 콩')
        expect(rec.parcels[0].subLots).toEqual([{ id: 's1' }])
        expect(rec.parcels[0].crops).toHaveLength(2)
        expect(rec.cropIndex).toBeUndefined()          // 단일 모드는 cropIndex 없음
    })
    it('신규 모드: isComplete/businessRegNo/basePnu 필드 없음(기존 동작 보존)', () => {
        const rec = r()
        expect('isComplete' in rec).toBe(false)
        expect('businessRegNo' in rec).toBe(false)
        expect('basePnu' in rec).toBe(false)
    })
})

describe('buildSoilLogRecord — 신규 분할(작물별)', () => {
    const r = () => build(parcel(), {
        receptionNumber: '5-1', commonData: commonNew, groupId: 'g1',
        index: 0, totalParcels: 2, crop: { name: '콩', area: '500' }, cropIndex: 1, isGroupEdit: false,
    })
    it('분할 모드: 단일 작물 area/cropsDisplay, subLots 미복제, cropIndex', () => {
        const rec = r()
        expect(rec.area).toBe('500')
        expect(rec.cropsDisplay).toBe('콩')
        expect(rec.parcels[0].subLots).toEqual([])     // 분할은 subLots 미복제
        expect(rec.parcels[0].crops).toEqual([{ name: '콩', area: '500' }])
        expect(rec.cropIndex).toBe(2)                  // cropIndex+1
    })
    it('메인 키 순서 보존: cropIndex가 parcelIndex 뒤, totalParcels 앞', () => {
        const rec = r()
        const keys = Object.keys(rec)
        expect(keys.indexOf('cropIndex')).toBe(keys.indexOf('parcelIndex') + 1)
        expect(keys.indexOf('cropIndex')).toBeLessThan(keys.indexOf('totalParcels'))
    })
})

describe('buildSoilLogRecord — 그룹수정(existingLog 보존)', () => {
    const existing = {
        id: 'old-id', createdAt: 'OLD-C', isComplete: true,
    }
    it('id/createdAt/isComplete 보존 (메인은 gongik/basePnu/businessRegNo 미주입)', () => {
        const rec = build(parcel(), {
            receptionNumber: '5', commonData: commonGroup, groupId: 'g1',
            index: 0, totalParcels: 1, isGroupEdit: true, existingLog: existing,
        })
        expect(rec.id).toBe('old-id')
        expect(rec.createdAt).toBe('OLD-C')
        expect(rec.isComplete).toBe(true)
        // 메인 인라인은 이 필드들을 주입하지 않음 (commonData/별도 경로로 흐름)
        expect('businessRegNo' in rec).toBe(false)
        expect('basePnu' in rec).toBe(false)
        expect('gongikOrder' in rec).toBe(false)
    })
    it('그룹수정 + 분할 조합: 보존 필드와 cropIndex가 함께 작동', () => {
        const rec = build(parcel(), {
            receptionNumber: '5-1', commonData: commonGroup, groupId: 'g1',
            index: 0, totalParcels: 1, crop: { name: '콩', area: '500' }, cropIndex: 1,
            isGroupEdit: true, existingLog: existing,
        })
        expect(rec.cropIndex).toBe(2)
        expect(rec.area).toBe('500')
        expect(rec.cropsDisplay).toBe('콩')
        expect(rec.parcels[0].subLots).toEqual([])
        expect(rec.id).toBe('old-id')
        expect(rec.createdAt).toBe('OLD-C')
        expect(rec.isComplete).toBe(true)
    })
    it('existingLog 없으면(인덱스 초과) 기본값으로 보존 필드 채움', () => {
        const rec = build(parcel(), {
            receptionNumber: '6', commonData: commonGroup, groupId: 'g1',
            index: 1, totalParcels: 2, isGroupEdit: true, existingLog: undefined, now: 'NOW',
        })
        expect(rec.id).toBeTruthy()           // 새 id 생성
        expect(rec.createdAt).toBe('NOW')
        expect(rec.isComplete).toBe(false)
    })
})

describe('buildSoilLogRecord — 엣지', () => {
    it('빈 작물명 → cropsDisplay 하이픈', () => {
        const rec = build(parcel({ crops: [{ name: '', area: '0' }] }), {
            receptionNumber: '1', commonData: commonNew, groupId: 'g', index: 0, totalParcels: 1, isGroupEdit: false,
        })
        expect(rec.cropsDisplay).toBe('-')
    })
    it('isMountain/parcel 필드 매핑', () => {
        const rec = build(parcel({ isMountain: true }), {
            receptionNumber: '1', commonData: commonNew, groupId: 'g', index: 0, totalParcels: 1, isGroupEdit: false,
        })
        expect(rec.parcels[0].isMountain).toBe(true)
        expect(rec.lotAddress).toBe('봉화군 봉화읍 내성리 123')
    })
})

describe('동치성: buildSoilLogRecord vs 기존 인라인 객체 리터럴', () => {
    // 메인 submitForm 인라인 레코드 조립 재현 (회귀 가드)
    // crypto.randomUUID로 생성되는 id/parcels[0].id는 제외하고 비교
    const stripIds = (rec) => {
        const { id, parcels, ...rest } = rec
        const p = parcels.map(({ id: _pid, ...pr }) => pr)
        return { ...rest, parcels: p }
    }

    const legacyNewSingle = (parcel, commonData, groupId, index, total) => {
        const parcelSubCategory = parcel.category || commonData.subCategory
        const parcelPurpose = parcel.purpose || commonData.purpose
        return {
            id: 'x', receptionNumber: '5',
            ...commonData,
            subCategory: parcelSubCategory, purpose: parcelPurpose,
            groupId, parcelIndex: index + 1, totalParcels: total,
            parcels: [{
                id: 'x', lotAddress: parcel.lotAddress, isMountain: parcel.isMountain || false,
                subLots: [...parcel.subLots], crops: parcel.crops.map(c => ({ ...c })),
                category: parcel.category || '', purpose: parcel.purpose || '', note: parcel.note || ''
            }],
            lotAddress: parcel.lotAddress,
            area: parcel.crops.reduce((s, c) => s + (parseFloat(c.area) || 0), 0).toString(),
            cropsDisplay: parcel.crops.map(c => c.name).join(', ') || '-'
        }
    }

    const legacyGroupSplit = (parcel, crop, cropIndex, commonData, groupId, index, total, existingLog) => {
        const parcelSubCategory = parcel.category || commonData.subCategory
        const parcelPurpose = parcel.purpose || commonData.purpose
        return {
            id: existingLog?.id || 'x', receptionNumber: '5-1',
            ...commonData,
            subCategory: parcelSubCategory, purpose: parcelPurpose,
            groupId, parcelIndex: index + 1, cropIndex: cropIndex + 1, totalParcels: total,
            createdAt: existingLog?.createdAt || 'NOW',
            isComplete: existingLog?.isComplete || false,
            parcels: [{
                id: 'x', lotAddress: parcel.lotAddress, isMountain: parcel.isMountain || false,
                subLots: [], crops: [{ ...crop }],
                category: parcel.category || '', purpose: parcel.purpose || '', note: parcel.note || ''
            }],
            lotAddress: parcel.lotAddress,
            area: (parseFloat(crop.area) || 0).toString(),
            cropsDisplay: crop.name || '-'
        }
    }

    it('신규 단일: 필드/값/키순서 동일', () => {
        const built = build(parcel(), {
            receptionNumber: '5', commonData: commonNew, groupId: 'g1',
            index: 0, totalParcels: 2, isGroupEdit: false,
        })
        const legacy = legacyNewSingle(parcel(), commonNew, 'g1', 0, 2)
        expect(stripIds(built)).toEqual(stripIds(legacy))
        expect(Object.keys(stripIds(built))).toEqual(Object.keys(stripIds(legacy)))
    })

    it('그룹수정 분할: 필드/값/키순서 동일', () => {
        const existing = { id: 'old-id', createdAt: 'OLD-C', isComplete: true }
        const built = build(parcel(), {
            receptionNumber: '5-1', commonData: commonGroup, groupId: 'g1',
            index: 0, totalParcels: 1, crop: { name: '콩', area: '500' }, cropIndex: 1,
            isGroupEdit: true, existingLog: existing, now: 'NOW',
        })
        const legacy = legacyGroupSplit(parcel(), { name: '콩', area: '500' }, 1, commonGroup, 'g1', 0, 1, existing)
        expect(stripIds(built)).toEqual(stripIds(legacy))
        expect(Object.keys(stripIds(built))).toEqual(Object.keys(stripIds(legacy)))
    })
})
