/**
 * sync-utils.js 단위 테스트 (vitest)
 * 실행: npm run test:unit
 */
import { describe, it, expect, beforeAll } from 'vitest'

let SyncUtils

beforeAll(async () => {
    await import('../../src/shared/sync-utils.js')
    SyncUtils = window.SyncUtils
})

describe('mergeCloudData', () => {
    it('미업로드 로컬 항목(syncedAt 없음)은 병합 후 보존되고 localOnly로 보고된다', () => {
        const local = [
            { id: 'a', receptionNumber: '1', syncedAt: '2026-06-01T00:00:00Z' },
            { id: 'b', receptionNumber: '2' }  // 오프라인 작성분 — syncedAt 없음
        ]
        const cloud = [
            { id: 'a', receptionNumber: '1', syncedAt: { seconds: 1780000000 } }
        ]
        const result = SyncUtils.mergeCloudData(local, cloud)
        expect(result.data.length).toBe(2)
        expect(result.localOnly.length).toBe(1)
        expect(result.localOnly[0].id).toBe('b')
    })

    it('동기화된 적 있는 로컬 항목이 클라우드에 없으면 삭제된다 (기존 의도 회귀 확인)', () => {
        const local = [
            { id: 'a', receptionNumber: '1', syncedAt: '2026-06-01T00:00:00Z' },
            { id: 'b', receptionNumber: '2', syncedAt: '2026-06-01T00:00:00Z' }  // 다른 기기에서 삭제됨
        ]
        const cloud = [{ id: 'a', receptionNumber: '1' }]
        const result = SyncUtils.mergeCloudData(local, cloud)
        expect(result.data.length).toBe(1)
        expect(result.deleted).toBe(1)
        expect(result.localOnly.length).toBe(0)
    })

    it('updatedAt이 더 최신인 쪽이 이긴다', () => {
        const local = [{ id: 'a', receptionNumber: '1', name: '로컬수정', updatedAt: 2000 }]
        const cloud = [{ id: 'a', receptionNumber: '1', name: '클라우드구버전', updatedAt: 1000 }]
        const result = SyncUtils.mergeCloudData(local, cloud)
        expect(result.data[0].name).toBe('로컬수정')

        const result2 = SyncUtils.mergeCloudData(
            [{ id: 'a', receptionNumber: '1', name: '로컬구버전', updatedAt: 1000 }],
            [{ id: 'a', receptionNumber: '1', name: '클라우드수정', updatedAt: 2000 }]
        )
        expect(result2.data[0].name).toBe('클라우드수정')
    })

    // SAMPL-1-80: 캐시(불완전 가능) 읽기에서는 cross-device 삭제를 적용하지 않는다
    it('fromCache=true(비신뢰 읽기)면 syncedAt 로컬 항목을 삭제하지 않고 보존한다', () => {
        const local = [
            { id: 'a', receptionNumber: '1', syncedAt: '2026-06-01T00:00:00Z' },
            { id: 'b', receptionNumber: '2', syncedAt: '2026-06-01T00:00:00Z' }  // 캐시가 누락했을 뿐 실제 존재
        ]
        const cloud = [{ id: 'a', receptionNumber: '1' }]  // 캐시에서 온 불완전 응답 (b 누락)
        const result = SyncUtils.mergeCloudData(local, cloud, { fromCache: true })
        expect(result.data.length).toBe(2)               // b 보존
        expect(result.data.find(x => x.id === 'b')).toBeTruthy()
        expect(result.deleted).toBe(0)                   // 삭제 0건
    })

    it('fromCache=false(서버 authoritative)면 기존대로 cross-device 삭제를 반영한다', () => {
        const local = [
            { id: 'a', receptionNumber: '1', syncedAt: '2026-06-01T00:00:00Z' },
            { id: 'b', receptionNumber: '2', syncedAt: '2026-06-01T00:00:00Z' }
        ]
        const cloud = [{ id: 'a', receptionNumber: '1' }]
        const result = SyncUtils.mergeCloudData(local, cloud, { fromCache: false })
        expect(result.data.length).toBe(1)
        expect(result.deleted).toBe(1)
    })

    it('smartMerge allowDeletions=false면 syncedAt 로컬 항목을 보존한다', () => {
        const local = [{ id: 'b', receptionNumber: '2', syncedAt: '2026-06-01T00:00:00Z' }]
        const cloud = []
        const result = SyncUtils.smartMerge(local, cloud, { allowDeletions: false })
        expect(result.data.length).toBe(1)
        expect(result.deleted).toBe(0)
    })
})

describe('findReceptionConflicts — 병합이 삼킨 번호 충돌을 드러낸다 (SAMPL-1-166)', () => {
    const find = (records) => SyncUtils.findReceptionConflicts(records)

    // 🚨 담당자 실데이터에서 실제로 일어난 일.
    //    smartMerge는 **id 기준**이라 id가 다르고 접수번호가 같은 두 레코드는
    //    둘 다 조용히 살아남았다. 접수번호는 분석결과 매칭 키인데도.
    it('id가 다르고 번호가 같으면 충돌로 잡는다', () => {
        const c = find([
            { id: '108e3c0d', receptionNumber: '328', landClass1: '농가의뢰' },
            { id: '9174bba3', receptionNumber: '328', landClass1: '농가의뢰' },
        ])
        expect(c).toHaveLength(1)
        expect(c[0].receptionNumber).toBe('328')
        expect(c[0].landClass1).toBe('농가의뢰')
        expect(c[0].ids).toEqual(['108e3c0d', '9174bba3'])
    })

    it('겹치지 않으면 아무것도 잡지 않는다 (과잉탐지 방지)', () => {
        expect(find([
            { id: 'a', receptionNumber: '328', landClass1: '농가의뢰' },
            { id: 'b', receptionNumber: '329', landClass1: '농가의뢰' },
        ])).toEqual([])
    })

    // 채번은 경지구분 단위로 독립이다 — 다른 경지구분의 같은 번호는 충돌이 아니다
    it('경지구분이 다르면 충돌이 아니다', () => {
        expect(find([
            { id: 'a', receptionNumber: '5', landClass1: '농가의뢰' },
            { id: 'b', receptionNumber: '5', landClass1: '공익직불제' },
        ])).toEqual([])
    })

    it('landClass1이 없으면 기본값으로 묶는다', () => {
        expect(find([
            { id: 'a', receptionNumber: '5' },
            { id: 'b', receptionNumber: '5', landClass1: '농가의뢰' },
        ])).toHaveLength(1)
    })

    // ⚠️ 빈 번호끼리 "충돌"이라고 보고하면 무의미한 경고가 쏟아진다
    it('접수번호가 빈 레코드는 세지 않는다', () => {
        expect(find([
            { id: 'a', receptionNumber: '', landClass1: '농가의뢰' },
            { id: 'b', receptionNumber: null, landClass1: '농가의뢰' },
            { id: 'c', landClass1: '농가의뢰' },
        ])).toEqual([])
    })

    it('공백만 다른 번호도 같은 번호로 본다', () => {
        expect(find([
            { id: 'a', receptionNumber: ' 5 ', landClass1: '농가의뢰' },
            { id: 'b', receptionNumber: '5', landClass1: '농가의뢰' },
        ])).toHaveLength(1)
    })

    it('셋 이상 겹쳐도 한 무리로 묶는다', () => {
        const c = find([
            { id: 'a', receptionNumber: '5', landClass1: '농가의뢰' },
            { id: 'b', receptionNumber: '5', landClass1: '농가의뢰' },
            { id: 'c', receptionNumber: '5', landClass1: '농가의뢰' },
        ])
        expect(c).toHaveLength(1)
        expect(c[0].ids).toHaveLength(3)
    })

    it('빈 입력·null도 안전하다', () => {
        expect(find([])).toEqual([])
        expect(find(null)).toEqual([])
        expect(find([null, undefined])).toEqual([])
    })
})

describe('smartMerge — 충돌을 결과에 실어 보낸다 (SAMPL-1-166)', () => {
    it('병합 결과에 receptionConflicts가 포함된다', () => {
        // 로컬에만 있는 328과 클라우드에만 있는 328이 만나 둘 다 살아남는 상황
        const r = SyncUtils.smartMerge(
            [{ id: 'local-1', receptionNumber: '328', landClass1: '농가의뢰', updatedAt: '2026-03-11T00:00:00Z' }],
            [{ id: 'cloud-1', receptionNumber: '328', landClass1: '농가의뢰', updatedAt: '2026-03-11T00:00:00Z' }],
            { allowDeletions: false }
        )
        expect(r.data.length).toBe(2)   // 둘 다 살아남는다 (기존 동작 유지)
        expect(r.receptionConflicts).toHaveLength(1)
        expect(r.receptionConflicts[0].receptionNumber).toBe('328')
    })

    it('충돌이 없으면 빈 배열이다', () => {
        const r = SyncUtils.smartMerge(
            [{ id: 'a', receptionNumber: '1', landClass1: '농가의뢰', updatedAt: '2026-03-11T00:00:00Z' }],
            [{ id: 'b', receptionNumber: '2', landClass1: '농가의뢰', updatedAt: '2026-03-11T00:00:00Z' }],
            { allowDeletions: false }
        )
        expect(r.receptionConflicts).toEqual([])
    })
})
