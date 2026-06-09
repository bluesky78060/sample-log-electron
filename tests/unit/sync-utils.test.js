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
