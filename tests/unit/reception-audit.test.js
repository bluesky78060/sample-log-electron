// @ts-check
import { describe, it, expect, beforeAll } from 'vitest'

// SAMPL-1-155: 저장된 접수번호의 정합성 점검 (순수 함수)
//
// SAMPL-1-153이 앞으로의 가져오기를, SAMPL-2-30이 입구를 막았지만
// **그 전에 저장된 레코드는 아무도 손대지 않았다.** 이 모듈은 그것을 찾아내기만 한다.
beforeAll(async () => {
    // @ts-ignore - 전역 IIFE 스크립트라 export가 없다 (sublot-identity.test.js와 같은 패턴)
    await import('../../src/shared/reception-audit.js')
})

const audit = (logs, year) => window.ReceptionAudit.auditReceptionNumbers(logs, year)
const summarize = (reports) => window.ReceptionAudit.summarizeAudit(reports)

const rec = (o) => ({ id: o.id || 'x', receptionNumber: o.rn, name: o.name || 'A', subCategory: o.sub, landClass1: o.cls })

describe('auditReceptionNumbers — 정상 데이터', () => {
    it('문제가 없으면 issueCount가 0이다', () => {
        const r = audit([
            rec({ id: '1', rn: '1', sub: '논' }),
            rec({ id: '2', rn: '2-1', sub: '밭' }),
            rec({ id: '3', rn: 'F1', sub: '성토' }),
            rec({ id: '4', rn: 'F2-1', sub: '성토' }),
        ], 2026)
        expect(r.issueCount).toBe(0)
        expect(r.total).toBe(4)
        expect(r.year).toBe('2026')
    })

    it('빈 배열·null도 안전하다', () => {
        expect(audit([], 2026).issueCount).toBe(0)
        expect(audit(null, 2026).total).toBe(0)
        expect(audit(undefined).total).toBe(0)
    })

    it('접수번호가 빈 레코드는 점검 대상이 아니다', () => {
        // 별개의 문제이고, 여기 섞으면 보고서가 무엇을 말하는지 흐려진다
        const r = audit([rec({ id: '1', rn: '', sub: '논' }), rec({ id: '2', rn: null, sub: '성토' })], 2026)
        expect(r.issueCount).toBe(0)
        expect(r.total).toBe(2)   // 전체 건수에는 잡힌다
    })
})

describe('auditReceptionNumbers — F 접두 불변식', () => {
    it('성토인데 F가 없으면 잡는다 (SAMPL-1-153 손상 데이터의 모습)', () => {
        const r = audit([rec({ id: 'a', rn: '1', sub: '성토' })], 2026)
        expect(r.fillWithoutF.map(x => x.id)).toEqual(['a'])
        expect(r.issueCount).toBe(1)
    })

    it('F인데 성토가 아니면 잡는다 (유령 번호)', () => {
        const r = audit([rec({ id: 'b', rn: 'F5', sub: '논' })], 2026)
        expect(r.fWithoutFill.map(x => x.id)).toEqual(['b'])
    })

    it('소문자 f는 따로 분류하고 다른 유형에 겹쳐 넣지 않는다', () => {
        const r = audit([rec({ id: 'c', rn: 'f3', sub: '성토' })], 2026)
        expect(r.lowercaseF.map(x => x.id)).toEqual(['c'])
        // ⚠️ 이중 계상 금지. 'f3'은 형식에도 맞지 않지만 두 곳에 넣으면
        //    4건짜리 데이터가 "5건"으로 보고돼 담당자가 목록과 대조할 수 없다
        //    (E2E가 실제로 잡은 결함이다).
        expect(r.fillWithoutF).toEqual([])
        expect(r.badFormat).toEqual([])
        expect(r.issueCount).toBe(1)
    })

    it('구분이 비어 있어도 F 접두면 잡는다', () => {
        const r = audit([rec({ id: 'd', rn: 'F1', sub: '' })], 2026)
        expect(r.fWithoutFill.map(x => x.id)).toEqual(['d'])
    })
})

describe('auditReceptionNumbers — 형식', () => {
    it.each(['abc', 'Fabc', '12abc', '5x', 'F', '-1'])('형식이 아닌 %s를 잡는다', (bad) => {
        const r = audit([rec({ id: 'z', rn: bad, sub: '논' })], 2026)
        expect(r.badFormat.map(x => x.receptionNumber)).toEqual([bad])
    })

    it('형식이 깨진 것은 F 불변식보다 먼저 잡는다 — 고칠 수 있는 순서다', () => {
        // 'Fabc'는 F 접두이면서 형식도 아니다. 형식이 깨져 있으면 불변식을
        // 따질 수 없으므로 형식 쪽으로만 분류한다.
        const r = audit([rec({ id: 'z', rn: 'Fabc', sub: '논' })], 2026)
        expect(r.badFormat.map(x => x.id)).toEqual(['z'])
        expect(r.fWithoutFill).toEqual([])
        expect(r.issueCount).toBe(1)
    })

    it('분류는 배타적이라 건수 합계가 실제 레코드 수와 같다', () => {
        const r = audit([
            rec({ id: 'a', rn: '1', sub: '성토' }),
            rec({ id: 'b', rn: 'F9', sub: '논' }),
            rec({ id: 'c', rn: 'f3', sub: '성토' }),
            rec({ id: 'd', rn: '12abc', sub: '논' }),
        ], 2026)
        expect(r.issueCount).toBe(4)   // 4개 레코드 = 4건 (중복 계상 없음)
        expect(r.fillWithoutF).toHaveLength(1)
        expect(r.fWithoutFill).toHaveLength(1)
        expect(r.lowercaseF).toHaveLength(1)
        expect(r.badFormat).toHaveLength(1)
    })

    it.each(['5', '5-1', 'F5', 'F5-1', '5-1-2'])('정상 형식 %s는 잡지 않는다', (ok) => {
        const sub = ok.startsWith('F') ? '성토' : '논'
        expect(audit([rec({ id: 'z', rn: ok, sub })], 2026).badFormat).toEqual([])
    })
})

describe('auditReceptionNumbers — 중복', () => {
    it('같은 경지구분 안의 같은 번호를 묶어 보고한다', () => {
        const r = audit([
            rec({ id: '1', rn: '5', sub: '논', cls: '농가의뢰' }),
            rec({ id: '2', rn: '5', sub: '밭', cls: '농가의뢰' }),
        ], 2026)
        expect(r.duplicates).toHaveLength(1)
        expect(r.duplicates[0].receptionNumber).toBe('5')
        expect(r.duplicates[0].landClass1).toBe('농가의뢰')
        expect(r.duplicates[0].records.map(x => x.id)).toEqual(['1', '2'])
    })

    it('경지구분이 다르면 중복이 아니다 — 채번이 그 단위로 독립이다', () => {
        const r = audit([
            rec({ id: '1', rn: '5', sub: '논', cls: '농가의뢰' }),
            rec({ id: '2', rn: '5', sub: '논', cls: '공익직불제' }),
        ], 2026)
        expect(r.duplicates).toEqual([])
    })

    it('landClass1이 없으면 기본값으로 묶는다', () => {
        const r = audit([
            rec({ id: '1', rn: '5', sub: '논' }),
            rec({ id: '2', rn: '5', sub: '논', cls: '농가의뢰' }),
        ], 2026)
        expect(r.duplicates).toHaveLength(1)
    })

    it('공백만 다른 번호도 같은 번호로 본다', () => {
        const r = audit([
            rec({ id: '1', rn: ' 5 ', sub: '논' }),
            rec({ id: '2', rn: '5', sub: '논' }),
        ], 2026)
        expect(r.duplicates).toHaveLength(1)
    })
})

describe('summarizeAudit', () => {
    it('문제 없는 연도는 줄을 만들지 않는다', () => {
        const s = summarize([audit([rec({ id: '1', rn: '1', sub: '논' })], 2025)])
        expect(s.totalIssues).toBe(0)
        expect(s.lines).toEqual([])
        expect(s.yearsWithIssues).toEqual([])
        expect(s.totalRecords).toBe(1)
    })

    it('문제 있는 연도만 사유와 함께 나열한다', () => {
        const s = summarize([
            audit([rec({ id: '1', rn: '1', sub: '논' })], 2025),
            audit([
                rec({ id: '2', rn: '1', sub: '성토' }),
                rec({ id: '3', rn: 'F9', sub: '논' }),
            ], 2026),
        ])
        expect(s.yearsWithIssues).toEqual(['2026'])
        expect(s.totalRecords).toBe(3)
        expect(s.totalIssues).toBe(2)
        expect(s.lines).toHaveLength(1)
        expect(s.lines[0]).toContain('2026년')
        expect(s.lines[0]).toContain('성토인데 F 없음 1건')
        expect(s.lines[0]).toContain('F인데 성토 아님 1건')
    })

    it('빈 입력도 안전하다', () => {
        expect(summarize([]).totalIssues).toBe(0)
        expect(summarize(null).lines).toEqual([])
    })
})

describe('summarizeAudit — 단위 표기 (독립 리뷰 반영)', () => {
    it('중복은 종 수와 영향 레코드 수를 함께 적는다', () => {
        // 헤더가 "1건"인데 CSV에는 2줄이 나와 담당자가 대조할 수 없었다
        const s = summarize([audit([
            rec({ id: '1', rn: '5', sub: '논' }),
            rec({ id: '2', rn: '5', sub: '논' }),
        ], 2026)])
        expect(s.lines[0]).toContain('중복 번호 1종(2건)')
    })

    it('소문자 f 문구는 형식 재확인을 함께 안내한다', () => {
        // 배타 분류라 소문자는 형식 검사를 거치지 않는다 — 'fabc'는 대문자로
        // 고쳐도 여전히 형식이 틀리다. 그 사실을 사용자가 알아야 한다.
        const s = summarize([audit([rec({ id: '1', rn: 'fabc', sub: '논' })], 2026)])
        expect(s.lines[0]).toContain('소문자 f 1건')
        expect(s.lines[0]).toContain('형식 재확인')
    })
})

describe('diagnoseEmptyResult — 왜 없는지를 말한다 (SAMPL-1-163)', () => {
    const diag = (o) => window.ReceptionAudit.diagnoseEmptyResult(o)

    // 🚨 담당자가 실제로 막힌 지점. 예전에는 아래 네 경우가 전부
    //    '저장된 토양 데이터가 없습니다.' 한 문장이었다.
    it('저장소가 완전히 비면 환경을 의심하라고 말한다', () => {
        const d = diag({ soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: false })
        expect(d.kind).toBe('no-keys-at-all')
        expect(d.message).toContain('전혀 없습니다')
        expect(d.hint).toContain('다른 곳에서 점검했을 가능성')
    })

    it('다른 시료는 있고 토양만 없으면 그렇게 말한다 — 환경은 맞다', () => {
        const d = diag({ soilKeyCount: 0, otherTypeKeyCount: 3, totalRecords: 0, isElectron: true })
        expect(d.kind).toBe('no-soil-keys')
        expect(d.message).toContain('다른 시료 데이터는 3종')
        expect(d.hint).toContain('저장소 자체는 맞습니다')
    })

    it('토양 저장소는 있는데 0건이면 정상일 수 있다고 말한다', () => {
        const d = diag({ soilKeyCount: 2, otherTypeKeyCount: 0, totalRecords: 0, isElectron: true })
        expect(d.kind).toBe('empty-soil-keys')
        expect(d.message).toContain('연도 2개')
        expect(d.hint).toContain('정상입니다')
    })

    it('레코드가 있으면 진단하지 않는다', () => {
        const d = diag({ soilKeyCount: 1, otherTypeKeyCount: 0, totalRecords: 5, isElectron: true })
        expect(d.kind).toBe('has-records')
        expect(d.message).toBe('')
    })

    // ⚠️ 이 앱의 중심 불변식: Electron 앱과 웹은 **별개 저장소**다.
    //    앱으로 접수하고 웹에서 점검하면 정상 데이터가 있어도 0건이 나온다.
    it('어디서 실행했는지를 항상 알린다', () => {
        expect(diag({ soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: true }).hint)
            .toContain('Electron 앱')
        expect(diag({ soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: false }).hint)
            .toContain('웹 브라우저')
    })

    it('Firestore가 범위 밖임을 화면 문구가 말한다', () => {
        // 리뷰 문서에만 적혀 있으면 담당자는 볼 일이 없다
        const d = diag({ soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: false })
        expect(d.hint).toContain('Firestore')
    })

    it('세 경우의 문장이 서로 달라야 한다 (한 문장으로 뭉치면 회귀다)', () => {
        const a = diag({ soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: false })
        const b = diag({ soilKeyCount: 0, otherTypeKeyCount: 2, totalRecords: 0, isElectron: false })
        const c = diag({ soilKeyCount: 1, otherTypeKeyCount: 0, totalRecords: 0, isElectron: false })
        expect(new Set([a.message, b.message, c.message]).size).toBe(3)
        expect(new Set([a.kind, b.kind, c.kind]).size).toBe(3)
    })
})

describe('diagnoseEmptyResult — 표현 계층 분리 (독립 리뷰 SUGGESTION)', () => {
    const diag = (o) => window.ReceptionAudit.diagnoseEmptyResult(o)

    it('순수 함수는 마크다운을 돌려주지 않는다', () => {
        // 화면이 `**`를 지우게 하면 표현 계층이 순수 함수에 섞인다
        for (const o of [
            { soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: false },
            { soilKeyCount: 0, otherTypeKeyCount: 2, totalRecords: 0, isElectron: true },
            { soilKeyCount: 1, otherTypeKeyCount: 0, totalRecords: 0, isElectron: true },
        ]) {
            const d = diag(o)
            expect(d.message).not.toContain('**')
            expect(d.hint).not.toContain('**')
        }
    })

    it('저장소가 완전히 비면 다음 행동을 직접 말한다', () => {
        const d = diag({ soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: false })
        expect(d.hint).toContain('앱을 열어 같은 화면에서 다시 실행하세요')
    })
})

describe('diagnoseEmptyResult — 주간 캐시 정리 (SAMPL-1-164)', () => {
    const diag = (o) => window.ReceptionAudit.diagnoseEmptyResult(o)

    // 🚨 담당자가 금요일에 실제로 마주친 상황.
    //    CacheManager가 매주 금요일 시료 캐시를 지우는데, 지워진 데이터는
    //    **시료 페이지를 열 때** Firebase에서 다시 불러온다. 설정 화면에는 그 기능이 없다.
    //    그 상태에서 "환경이 다를 것"이라고 말하면 틀린 방향을 가리키는 것이고,
    //    담당자는 클라우드에 멀쩡히 있는 데이터가 사라졌다고 오해한다.
    it('캐시 정리 흔적이 있으면 그것을 원인으로 지목한다', () => {
        const d = diag({
            soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: true,
            lastCacheClearMs: Date.UTC(2026, 7, 21),
            nowMs: Date.UTC(2026, 7, 22),
        })
        expect(d.kind).toBe('cache-cleared')
        expect(d.message).toContain('캐시가 정리돼')
        expect(d.hint).toContain('사라진 것이 아닙니다')
        expect(d.hint).toContain('토양 목록 화면을 한 번 열어')
    })

    it('정리 날짜를 함께 보여준다', () => {
        const d = diag({
            soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: true,
            lastCacheClearMs: new Date(2026, 7, 21).getTime(),
            nowMs: new Date(2026, 7, 22).getTime(),
        })
        expect(d.message).toContain('2026-08-21')
    })

    it('캐시 흔적이 없으면 기존 환경 안내를 유지한다', () => {
        const d = diag({
            soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: true,
            lastCacheClearMs: null,
        })
        expect(d.kind).toBe('no-keys-at-all')
        expect(d.message).toContain('전혀 없습니다')
    })

    it('두 문장이 서로 달라야 한다 (한쪽으로 뭉치면 회귀다)', () => {
        const base = { soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: true }
        const cleared = diag({ ...base, lastCacheClearMs: Date.now() })
        const never = diag({ ...base, lastCacheClearMs: null })
        expect(cleared.message).not.toBe(never.message)
        expect(cleared.kind).not.toBe(never.kind)
    })

    it('캐시 흔적이 있어도 데이터가 있으면 진단하지 않는다', () => {
        const d = diag({
            soilKeyCount: 1, otherTypeKeyCount: 0, totalRecords: 7, isElectron: true,
            lastCacheClearMs: Date.now(),
        })
        expect(d.kind).toBe('has-records')
    })

    it('토양 키가 있으면 캐시 흔적보다 그쪽을 먼저 말한다', () => {
        // 이미 불러온 뒤라면 캐시 이야기는 더 이상 원인이 아니다
        const d = diag({
            soilKeyCount: 2, otherTypeKeyCount: 0, totalRecords: 0, isElectron: true,
            lastCacheClearMs: Date.now(),
        })
        expect(d.kind).toBe('empty-soil-keys')
    })
})

describe('diagnoseEmptyResult — 캐시 흔적의 근거를 검증한다 (독립 리뷰 MAJOR)', () => {
    const diag = (o) => window.ReceptionAudit.diagnoseEmptyResult(o)
    const base = { soilKeyCount: 0, otherTypeKeyCount: 0, totalRecords: 0, isElectron: true }
    const DAY = 24 * 60 * 60 * 1000

    // 🚨 lastCacheClear는 **영구 보존 키**다. 3개월 전 흔적을 지금의 원인으로 단정하면
    //    틀린 방향을 가리킨다 — 그 사이에 목록을 열었다면 데이터가 돌아왔을 것이다.
    it('오래된 정리 흔적은 원인으로 삼지 않는다', () => {
        const now = Date.now()
        const d = diag({ ...base, lastCacheClearMs: now - 90 * DAY, lastCacheClearCount: 5, nowMs: now })
        expect(d.kind).toBe('no-keys-at-all')
    })

    it('최근(8일 이내) 정리는 원인으로 삼는다', () => {
        const now = Date.now()
        const d = diag({ ...base, lastCacheClearMs: now - 3 * DAY, lastCacheClearCount: 5, nowMs: now })
        expect(d.kind).toBe('cache-cleared')
    })

    // 🚨 수동 캐시 삭제는 **0건을 지워도** 시각을 남긴다. 시각만 보면
    //    "언젠가 정리 함수가 돌았다"는 흔적일 뿐 지금 빈 저장소의 증거가 아니다.
    it('0건을 지운 정리는 원인이 아니다', () => {
        const now = Date.now()
        const d = diag({ ...base, lastCacheClearMs: now - 1 * DAY, lastCacheClearCount: 0, nowMs: now })
        expect(d.kind).toBe('no-keys-at-all')
    })

    it('건수 기록이 없는 구 설치본은 최근성만으로 판단한다', () => {
        const now = Date.now()
        const d = diag({ ...base, lastCacheClearMs: now - 1 * DAY, lastCacheClearCount: null, nowMs: now })
        expect(d.kind).toBe('cache-cleared')
    })

    it.each([0, NaN, Infinity, -1])('비정상 시각 %s는 무시한다', (bad) => {
        const d = diag({ ...base, lastCacheClearMs: bad, lastCacheClearCount: 5, nowMs: Date.now() })
        expect(d.kind).toBe('no-keys-at-all')
    })

    it('미래 시각도 무시한다 (시계가 어긋난 기기)', () => {
        const now = Date.now()
        const d = diag({ ...base, lastCacheClearMs: now + 10 * DAY, lastCacheClearCount: 5, nowMs: now })
        expect(d.kind).toBe('no-keys-at-all')
    })
})

describe('detailLines — 어떤 번호가 문제인지 보여준다 (SAMPL-1-165)', () => {
    const details = (logs, limit) =>
        window.ReceptionAudit.detailLines(audit(logs, 2026), limit)

    // 🚨 담당자가 실제로 마주친 결과: "중복 번호 3종(6건)"만 보이고
    //    어떤 번호인지는 CSV를 열어야 알 수 있었다.
    it('중복 번호와 그 번호를 쓰는 사람들을 함께 보여준다', () => {
        const d = details([
            rec({ id: '1', rn: '5', sub: '논', name: '홍길동' }),
            rec({ id: '2', rn: '5', sub: '밭', name: '김철수' }),
        ])
        expect(d).toHaveLength(1)
        expect(d[0].label).toContain('중복')
        expect(d[0].lines[0]).toContain('농가의뢰 5')
        expect(d[0].lines[0]).toContain('2건')
        // 번호만 알려주면 어느 접수끼리 겹쳤는지 알 수 없다
        expect(d[0].lines[0]).toContain('홍길동')
        expect(d[0].lines[0]).toContain('김철수')
    })

    it('유형별로 나눠 보여준다', () => {
        const d = details([
            rec({ id: 'a', rn: '1', sub: '성토', name: 'A' }),
            rec({ id: 'b', rn: 'F9', sub: '논', name: 'B' }),
            rec({ id: 'c', rn: 'f3', sub: '논', name: 'C' }),
            rec({ id: 'd', rn: '12abc', sub: '논', name: 'D' }),
        ])
        expect(d.map(g => g.label)).toEqual([
            '성토인데 F 접두 없음',
            'F 접두인데 성토 아님',
            '소문자 f로 시작',
            '접수번호 형식이 아님',
        ])
        expect(d[0].lines[0]).toContain('A')
    })

    it('문제가 없으면 빈 배열이다', () => {
        expect(details([rec({ id: '1', rn: '1', sub: '논' })])).toEqual([])
    })

    // ⚠️ 손상이 수백 건이면 화면이 끝없이 길어져 결국 못 읽는다.
    it('상한을 넘으면 자르고 남은 수를 알린다', () => {
        const many = []
        for (let i = 1; i <= 25; i++) many.push(rec({ id: `x${i}`, rn: `${i}`, sub: '성토', name: `사람${i}` }))
        const d = details(many, 10)
        expect(d[0].lines).toHaveLength(10)
        expect(d[0].hiddenCount).toBe(15)
    })

    it('상한 안이면 자르지 않는다', () => {
        const d = details([rec({ id: 'a', rn: '1', sub: '성토' })], 10)
        expect(d[0].hiddenCount).toBe(0)
    })

    it('limit이 없거나 잘못되면 기본값을 쓴다', () => {
        const many = []
        for (let i = 1; i <= 15; i++) many.push(rec({ id: `x${i}`, rn: `${i}`, sub: '성토' }))
        expect(details(many).at(0).lines).toHaveLength(10)
        expect(details(many, 0).at(0).lines).toHaveLength(10)
        expect(details(many, -5).at(0).lines).toHaveLength(10)
    })
})

describe('detailLines — 그룹 내부 상한과 식별자 (독립 리뷰 MAJOR)', () => {
    const details = (logs, limit) =>
        window.ReceptionAudit.detailLines(audit(logs, 2026), limit)

    // 🚨 한 번호에 1,000건이 걸리면 이름 1,000개가 한 줄에 나와 화면을 읽을 수 없다.
    it('한 중복 그룹 안에서도 상한을 두고 남은 수를 알린다', () => {
        const many = []
        for (let i = 1; i <= 12; i++) {
            many.push({ id: `id-${i}`, receptionNumber: '5', name: `사람${i}`, subCategory: '논', landClass1: '농가의뢰' })
        }
        const d = details(many)
        const line = d.at(-1).lines[0]
        expect(line).toContain('12건')
        expect(line).toContain('외 7건')      // 5건만 보이고 7건은 접힌다
        expect(line).toContain('사람1')
        expect(line).not.toContain('사람12')
    })

    // 🚨 성명·구분이 같으면 두 레코드를 구별할 수 없다 — 어느 쪽이 정본인지 못 고른다.
    it('접수일자와 id로 같은 이름의 레코드를 구별할 수 있다', () => {
        const d = details([
            { id: 'aaaaaaaa-1111', receptionNumber: '5', name: '홍길동', subCategory: '논', landClass1: '농가의뢰', date: '2026-03-04' },
            { id: 'bbbbbbbb-2222', receptionNumber: '5', name: '홍길동', subCategory: '논', landClass1: '농가의뢰', date: '2026-05-01' },
        ])
        const line = d.at(-1).lines[0]
        expect(line).toContain('2026-03-04')
        expect(line).toContain('2026-05-01')
        expect(line).toContain('#aaaaaaaa')
        expect(line).toContain('#bbbbbbbb')
    })

    it('식별 정보가 하나도 없어도 줄이 비지 않는다', () => {
        const d = details([
            { receptionNumber: '5', landClass1: '농가의뢰' },
            { receptionNumber: '5', landClass1: '농가의뢰' },
        ])
        expect(d.at(-1).lines[0]).toContain('식별 정보 없음')
    })

    it('그룹이 상한 안이면 접지 않는다', () => {
        const d = details([
            { id: 'a', receptionNumber: '5', name: 'A', subCategory: '논', landClass1: '농가의뢰' },
            { id: 'b', receptionNumber: '5', name: 'B', subCategory: '논', landClass1: '농가의뢰' },
        ])
        expect(d.at(-1).lines[0]).not.toContain('외 ')
    })
})
