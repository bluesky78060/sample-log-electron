import { describe, it, expect, beforeAll } from 'vitest'

// SAMPL-1-159: 하위필지 식별 (순수 로직)
//
// 이 파일이 지키는 계약:
//   1) 문자열(구 데이터)과 객체(신 데이터) 양쪽에서 같은 키가 나온다
//   2) 저장한 선택이 다시 열 때 복원된다 (키가 왕복한다)
//   3) 가리킬 대상이 사라지면 '전체'로 떨어진다 (조용히 남지 않는다)

/** @type {any} */
let S

beforeAll(async () => {
    // @ts-ignore - 전역 IIFE 스크립트라 export가 없다
    globalThis.window = globalThis.window || {}
    await import('../../src/soil/sublot-identity.js')
    // @ts-ignore
    S = globalThis.window.SubLotIdentity
})

describe('keyOf — 구·신 데이터가 같은 키를 낸다', () => {
    it('객체에서 lotAddress를 뽑는다', () => {
        expect(S.keyOf({ lotAddress: '문단리 224', crops: [] })).toBe('문단리 224')
    })

    it('문자열은 그대로 쓴다 (구 데이터)', () => {
        expect(S.keyOf('문단리 224')).toBe('문단리 224')
    })

    // 🚨 이게 이 티켓의 핵심. 같은 하위필지가 문자열이든 객체든 키가 같아야
    //    편집(문자열→객체 마이그레이션) 전후로 선택이 유지된다.
    it('같은 주소면 형태가 달라도 키가 같다', () => {
        expect(S.keyOf('문단리 224')).toBe(S.keyOf({ lotAddress: '문단리 224' }))
    })

    it('앞뒤 공백을 없앤다 — 공백 하나로 선택이 깨지면 안 된다', () => {
        expect(S.keyOf('  문단리 224  ')).toBe('문단리 224')
        expect(S.keyOf({ lotAddress: ' 문단리 224 ' })).toBe('문단리 224')
    })

    it('빈 값·null·undefined는 빈 문자열', () => {
        for (const bad of [null, undefined, '', '   ', {}, { lotAddress: null }]) {
            expect(S.keyOf(bad)).toBe('')
        }
    })
})

describe('buildOptions', () => {
    it('첫 항목은 항상 전체다', () => {
        const opts = S.buildOptions([])
        expect(opts.length).toBe(1)
        expect(opts[0].value).toBe('all')
    })

    // 🚨 예전 결함의 정확한 재현 방지.
    it('객체 하위필지가 [object Object]가 되지 않는다', () => {
        const opts = S.buildOptions([{ lotAddress: '문단리 224', crops: [] }])
        expect(opts[1].value).toBe('문단리 224')
        expect(opts[1].label).toBe('하위 1: 문단리 224')
        expect(JSON.stringify(opts)).not.toContain('[object Object]')
    })

    it('문자열과 객체가 섞여도 둘 다 나온다', () => {
        const opts = S.buildOptions(['A', { lotAddress: 'B' }, 'C'])
        expect(opts.map((o) => o.value)).toEqual(['all', 'A', 'B', 'C'])
        expect(opts[2].label).toBe('하위 2: B')
    })

    // 주소가 없으면 식별할 수 없다. value=""는 '전체'와 구분되지 않아
    // 사용자가 고른 것과 다른 것이 저장된다.
    it('주소가 없는 하위필지는 옵션에서 빠진다', () => {
        const opts = S.buildOptions([{ crops: [] }, '', { lotAddress: 'B' }])
        expect(opts.map((o) => o.value)).toEqual(['all', 'B'])
    })

    // 번호는 **원본 배열의 위치**여야 한다 — 건너뛴 것 때문에 번호가 밀리면
    // 화면의 "하위 2"와 실제 두 번째 하위필지가 어긋난다.
    it('건너뛴 항목이 있어도 번호는 원본 위치를 따른다', () => {
        const opts = S.buildOptions([{ crops: [] }, { lotAddress: 'B' }])
        expect(opts[1].label).toBe('하위 2: B')
    })

    it('배열이 아니어도 터지지 않는다', () => {
        for (const bad of [null, undefined, 'x', 42]) {
            expect(S.buildOptions(bad)).toEqual([{ value: 'all', label: '전체 (상위 필지 전체)' }])
        }
    })

    // 이미 중복이 저장된 레코드에서는 키가 겹친다 (새로 만드는 것은 canAdd가 막는다).
    it('이미 저장된 중복 주소는 같은 키를 갖는다', () => {
        const opts = S.buildOptions(['A', 'A'])
        expect(opts[1].value).toBe(opts[2].value)
        expect(opts[1].label).toBe('하위 1: A')
        expect(opts[2].label).toBe('하위 2: A')
    })

    // 예약값과 같은 주소는 '전체'와 구분되지 않는다
    it("주소가 'all'인 하위필지는 옵션에서 빠진다", () => {
        expect(S.buildOptions(['all', 'B']).map((o) => o.value)).toEqual(['all', 'B'])
    })
})

describe('canAdd — 중복을 입력 시점에 막는다', () => {
    // 🚨 독립 모델 리뷰가 찾은 구체적 피해.
    //    주소가 같은 하위필지 둘 중 하나를 지우면, 지워진 쪽을 가리켰던 작물이
    //    **조용히 남은 쪽을 가리킨다.** 주소를 키로 쓰는 한 중복은 허용할 수 없다.
    it('이미 있는 주소는 거절한다', () => {
        const r = S.canAdd('문단리 224', [{ lotAddress: '문단리 224' }])
        expect(r.ok).toBe(false)
        expect(r.reason).toContain('이미 있는')
    })

    it('구 데이터(문자열)와도 비교한다', () => {
        expect(S.canAdd('A', ['A']).ok).toBe(false)
        expect(S.canAdd('A', [{ lotAddress: 'A' }]).ok).toBe(false)
    })

    it('공백 차이만 있는 주소도 중복으로 본다', () => {
        expect(S.canAdd('  A  ', ['A']).ok).toBe(false)
    })

    it('새 주소는 허용한다', () => {
        expect(S.canAdd('B', ['A']).ok).toBe(true)
        expect(S.canAdd('A', []).ok).toBe(true)
        expect(S.canAdd('A', null).ok).toBe(true)
    })

    it('빈 주소와 예약값은 거절한다', () => {
        expect(S.canAdd('', []).ok).toBe(false)
        expect(S.canAdd('   ', []).ok).toBe(false)
        const r = S.canAdd('all', [])
        expect(r.ok).toBe(false)
        expect(r.reason).toContain('예약')
    })

    // 🚨 중복을 막았을 때 실제로 오매핑이 불가능해지는지 — 시나리오로 확인한다.
    it('중복을 막으면 삭제 후 오매핑이 생기지 않는다', () => {
        const subLots = ['A']
        // 같은 주소를 또 넣으려는 시도가 막힌다
        expect(S.canAdd('A', subLots).ok).toBe(false)
        // 다른 주소로 넣고 그것을 가리킨 뒤 삭제하면 '전체'로 떨어진다 (조용히 딴 데로 안 간다)
        subLots.push('B')
        expect(S.resolveTarget('B', subLots)).toBe('B')
        subLots.splice(1, 1)
        expect(S.resolveTarget('B', subLots)).toBe('all')
    })
})

describe('normalizeParcels — 저장 직전 정리', () => {
    it("저장된 [object Object]를 all로 바꾸고 개수를 보고한다", () => {
        const parcels = [{
            subLots: [{ lotAddress: 'A' }],
            crops: [
                { name: '고추', subLotTarget: '[object Object]' },
                { name: '배추', subLotTarget: 'A' },
            ],
        }]
        expect(S.normalizeParcels(parcels)).toBe(1)
        expect(parcels[0].crops.map((c) => c.subLotTarget)).toEqual(['all', 'A'])
    })

    it('하위필지가 있는데 안 맞는 값은 정리한다', () => {
        const parcels = [{ subLots: [{ lotAddress: 'B' }], crops: [{ subLotTarget: 'A' }] }]
        expect(S.normalizeParcels(parcels)).toBe(1)
        expect(parcels[0].crops[0].subLotTarget).toBe('all')
    })

    // 🚨 코드 리뷰가 찾은 회귀. 이 테스트는 예전에 **버그를 계약으로 굳혀** 뒀다
    //    (`subLots: []` → 'all' 기대). 실제로는 분할모드 저장이 `subLots: []`로
    //    기록하면서 `subLotTarget`은 보존하므로(`soil-log-record.js:89-90`),
    //    무조건 정리하면 **그룹수정으로 폼을 여는 순간 배정이 통째로 지워진다.**
    it('대조할 하위필지가 없으면 판정을 보류한다 (분할모드 보존)', () => {
        const parcels = [{ subLots: [], crops: [{ subLotTarget: '문단리 225' }] }]
        expect(S.normalizeParcels(parcels)).toBe(0)
        expect(parcels[0].crops[0].subLotTarget, '분할모드 배정이 지워졌다').toBe('문단리 225')
    })

    it('하위필지 필드가 아예 없어도 보류한다', () => {
        const parcels = [{ crops: [{ subLotTarget: '문단리 225' }] }]
        expect(S.normalizeParcels(parcels)).toBe(0)
        expect(parcels[0].crops[0].subLotTarget).toBe('문단리 225')
    })

    // 단, 어떤 상황에서도 유효할 수 없는 값은 하위필지가 없어도 정리한다
    it('[object Object]는 대조 대상이 없어도 정리한다', () => {
        const parcels = [{ subLots: [], crops: [{ subLotTarget: '[object Object]' }] }]
        expect(S.normalizeParcels(parcels)).toBe(1)
        expect(parcels[0].crops[0].subLotTarget).toBe('all')
    })

    it('주소가 빈 하위필지만 있으면 판정할 수 없다 — 보류한다', () => {
        const parcels = [{ subLots: [{ crops: [] }], crops: [{ subLotTarget: 'A' }] }]
        expect(S.normalizeParcels(parcels)).toBe(0)
        expect(parcels[0].crops[0].subLotTarget).toBe('A')
    })

    // 없던 필드를 새로 만들면 저장 diff가 커지고 동기화가 시끄러워진다
    it('원래 없던 subLotTarget은 만들지 않는다', () => {
        const parcels = [{ subLots: [], crops: [{ name: '고추' }] }]
        expect(S.normalizeParcels(parcels)).toBe(0)
        expect('subLotTarget' in parcels[0].crops[0]).toBe(false)
    })

    it('정리할 것이 없으면 0을 반환하고 값을 건드리지 않는다', () => {
        const parcels = [{ subLots: ['A'], crops: [{ subLotTarget: 'A' }, { subLotTarget: 'all' }] }]
        expect(S.normalizeParcels(parcels)).toBe(0)
        expect(parcels[0].crops.map((c) => c.subLotTarget)).toEqual(['A', 'all'])
    })

    it('망가진 입력에서도 터지지 않는다', () => {
        for (const bad of [null, undefined, 'x', [null], [{ crops: null }], [{}]]) {
            expect(() => S.normalizeParcels(bad)).not.toThrow()
        }
    })
})

describe('resolveTarget — 마이그레이션', () => {
    const LOTS = [{ lotAddress: 'A' }, 'B']

    it('유효한 키는 그대로 둔다', () => {
        expect(S.resolveTarget('A', LOTS)).toBe('A')
        expect(S.resolveTarget('B', LOTS)).toBe('B')
    })

    it('전체·빈 값은 전체다', () => {
        for (const v of ['all', '', null, undefined, '   ']) {
            expect(S.resolveTarget(v, LOTS)).toBe('all')
        }
    })

    // 🚨 예전 결함이 남긴 쓰레기. 그대로 두면 라벨이 조용히 사라져
    //    사용자가 "왜 하위필지 표시가 없지?"를 알 수 없다.
    it('[object Object]가 저장돼 있으면 전체로 떨어뜨린다', () => {
        expect(S.resolveTarget('[object Object]', LOTS)).toBe('all')
    })

    // 하위필지 삭제로 가리키던 대상이 사라진 경우
    it('가리키는 하위필지가 없어졌으면 전체로 떨어뜨린다', () => {
        expect(S.resolveTarget('A', [{ lotAddress: 'B' }])).toBe('all')
        expect(S.resolveTarget('A', [])).toBe('all')
        expect(S.resolveTarget('A', null)).toBe('all')
    })

    // DOM은 문자열만 주지만, 코드가 실수로 객체를 넘길 수 있다.
    // 그때 String(객체) = '[object Object]'가 되어 '전체'로 떨어진다 — 조용히 통과하지 않는다.
    it('객체를 넘기면 전체로 떨어진다 (조용히 통과하지 않는다)', () => {
        expect(S.resolveTarget({ lotAddress: 'A' }, LOTS)).toBe('all')
    })

    it('편집으로 문자열이 객체가 돼도 선택이 유지된다', () => {
        expect(S.resolveTarget('B', ['B'])).toBe('B')
        expect(S.resolveTarget('B', [{ lotAddress: 'B', crops: [] }])).toBe('B')
    })
})

describe('labelOf', () => {
    const LOTS = [{ lotAddress: '문단리 224' }]

    it('유효한 대상은 대괄호로 감싼다', () => {
        expect(S.labelOf('문단리 224', LOTS)).toBe('[문단리 224]')
    })

    it('전체·무효는 빈 문자열 — 화면에 아무것도 붙지 않는다', () => {
        expect(S.labelOf('all', LOTS)).toBe('')
        expect(S.labelOf('[object Object]', LOTS)).toBe('')
        expect(S.labelOf('없는주소', LOTS)).toBe('')
    })
})

describe('왕복 — 이 티켓이 고치려는 것', () => {
    // 🚨 "고르고 저장했는데 다시 열면 선택이 풀린다"의 직접 재현.
    it('옵션에서 고른 값이 그대로 유효한 대상으로 복원된다', () => {
        const subLots = [{ lotAddress: '문단리 224', crops: [] }, '문단리 225']
        for (const opt of S.buildOptions(subLots)) {
            // DOM은 항상 문자열을 돌려준다
            const fromDom = String(opt.value)
            expect(
                S.resolveTarget(fromDom, subLots),
                `옵션 '${opt.label}'을 고르면 복원되지 않는다`
            ).toBe(fromDom)
        }
    })
})
