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

describe('collectCrops / distributeCrops — 배정을 실제 이동으로 (SAMPL-1-161)', () => {
    // 🚨 이 티켓의 이유. 예전에는 배정이 `subLotTarget` 꼬리표뿐이라
    //    엑셀·목록·흙토람(전부 `subLot.crops`만 읽는다)에 반영되지 않았다.
    //    화면은 `고추 [문단리 226]`인데 엑셀은 상위 필지 행에 넣었다.
    it('상위로 배정하면 상위에, 하위로 배정하면 하위 crops로 간다', () => {
        const parcel = {
            crops: [{ name: '고추', area: '100' }],
            subLots: [{ lotAddress: '문단리 225', crops: [] }],
        }
        const edited = S.collectCrops(parcel)
        edited[0].subLotTarget = '문단리 225'
        S.distributeCrops(parcel, edited)

        expect(parcel.crops, '상위에 남으면 엑셀이 상위 행에 넣는다').toEqual([])
        expect(parcel.subLots[0].crops.map((c) => c.name)).toEqual(['고추'])
    })

    it('되돌리면 다시 상위로 온다', () => {
        const parcel = {
            crops: [],
            subLots: [{ lotAddress: 'A', crops: [{ name: '고추', area: '100' }] }],
        }
        const edited = S.collectCrops(parcel)
        expect(edited[0].subLotTarget).toBe('A')
        edited[0].subLotTarget = 'all'
        S.distributeCrops(parcel, edited)

        expect(parcel.crops.map((c) => c.name)).toEqual(['고추'])
        expect(parcel.subLots[0].crops).toEqual([])
    })

    it('소속 꼬리표는 데이터에 남기지 않는다 — 위치가 곧 소속이다', () => {
        const parcel = { crops: [{ name: '고추', area: '1' }], subLots: [] }
        S.distributeCrops(parcel, S.collectCrops(parcel))
        expect('subLotTarget' in parcel.crops[0]).toBe(false)
    })

    // ⚠️ 배정이 잘못됐다고 작물을 없애면 담당자가 입력한 자료가 조용히 사라진다
    it('가리킬 하위필지가 없으면 버리지 않고 상위에 둔다', () => {
        const parcel = { crops: [], subLots: [{ lotAddress: 'A', crops: [] }] }
        S.distributeCrops(parcel, [{ name: '고추', area: '1', subLotTarget: '없는주소' }])
        expect(parcel.crops.map((c) => c.name), '작물이 사라졌다').toEqual(['고추'])
    })

    it('문자열 하위필지(구 데이터)를 객체로 승격해 작물을 담는다', () => {
        const parcel = { crops: [], subLots: ['A'] }
        S.distributeCrops(parcel, [{ name: '고추', area: '1', subLotTarget: 'A' }])
        expect(typeof parcel.subLots[0]).toBe('object')
        expect(parcel.subLots[0].lotAddress).toBe('A')
        expect(parcel.subLots[0].crops.map((c) => c.name)).toEqual(['고추'])
    })

    it('모달이 하위필지 작물도 함께 보여준다 (배정 변경이 가능하려면 필요)', () => {
        const parcel = {
            crops: [{ name: '고추' }],
            subLots: [{ lotAddress: 'A', crops: [{ name: '배추' }] }],
        }
        expect(S.collectCrops(parcel).map((c) => `${c.name}/${c.subLotTarget}`))
            .toEqual(['고추/all', '배추/A'])
    })

    it('여러 하위필지에 각각 다른 작물을 나눈다', () => {
        const parcel = {
            crops: [],
            subLots: [{ lotAddress: 'A', crops: [] }, { lotAddress: 'B', crops: [] }],
        }
        S.distributeCrops(parcel, [
            { name: '고추', subLotTarget: 'A' },
            { name: '배추', subLotTarget: 'B' },
            { name: '무',   subLotTarget: 'all' },
        ])
        expect(parcel.subLots[0].crops.map((c) => c.name)).toEqual(['고추'])
        expect(parcel.subLots[1].crops.map((c) => c.name)).toEqual(['배추'])
        expect(parcel.crops.map((c) => c.name)).toEqual(['무'])
    })

    it('망가진 입력에서도 터지지 않는다', () => {
        for (const bad of [null, undefined, {}, { crops: null, subLots: 'x' }]) {
            expect(() => S.collectCrops(bad)).not.toThrow()
            expect(() => S.distributeCrops(bad, null)).not.toThrow()
        }
    })
})

// ============================================================================
// SAMPL-1-161 리뷰가 찾은 데이터 유실 경로 (코드리뷰 + 독립모델이 각각 지적)
//
// 아래 계약들은 전부 **작물이 조용히 사라지거나 복제되는** 경로를 막는다.
// 하나라도 되돌리면 담당자가 입력한 자료가 손실된다.
// ============================================================================

describe('collectCrops — 기존 꼬리표를 보존한다 (M-1)', () => {
    // 🚨 처음 구현은 상위 작물에 `subLotTarget: ALL`을 무조건 박았다.
    //    그러면 예전에 배정해 둔 레코드를 열어 **확정만 해도** 배정이 소멸했고,
    //    호출부의 `resolveForEdit`는 항상 'all'만 받아 no-op이 됐다.
    it('상위 작물의 기존 배정이 살아남는다', () => {
        const parcel = {
            crops: [{ name: '고추', subLotTarget: '문단리 226' }],
            subLots: [{ lotAddress: '문단리 226', crops: [] }],
        }
        expect(S.collectCrops(parcel)[0].subLotTarget).toBe('문단리 226')
    })

    it('꼬리표가 없으면 전체로 본다', () => {
        const parcel = { crops: [{ name: '고추' }], subLots: [] }
        expect(S.collectCrops(parcel)[0].subLotTarget).toBe('all')
    })

    // 보존된 꼬리표가 실제 이동으로 이어져야 이관이 성립한다
    it('꼬리표 보존 → 확정 시 실제로 하위필지로 옮겨진다', () => {
        const parcel = {
            crops: [{ name: '고추', area: '100', subLotTarget: '문단리 226' }],
            subLots: [{ lotAddress: '문단리 226', crops: [] }],
        }
        S.distributeCrops(parcel, S.collectCrops(parcel))
        expect(parcel.subLots[0].crops.map((c) => c.name)).toEqual(['고추'])
        expect(parcel.crops).toEqual([])
    })
})

describe('중복 주소 하위필지 — 복제되지 않는다 (M-3)', () => {
    // 🚨 예전에는 `byKey`가 뒤엣것으로 덮어써서, 초기화되지 않은 첫엣것의 작물이
    //    남은 채 `collectCrops`가 걷어온 사본이 뒤엣것에 담겨 **고추가 두 번** 셌다.
    //    엑셀 행과 총면적이 두 배가 된다.
    it('왕복해도 작물이 늘지 않는다', () => {
        const parcel = {
            crops: [],
            subLots: [
                { lotAddress: 'A', crops: [{ name: '고추', area: '100' }] },
                { lotAddress: 'A', crops: [{ name: '배추', area: '50' }] },
            ],
        }
        S.distributeCrops(parcel, S.collectCrops(parcel))
        const all = [
            ...parcel.crops.map((c) => c.name),
            ...parcel.subLots.flatMap((l) => l.crops.map((c) => c.name)),
        ]
        expect(all.filter((n) => n === '고추'), '고추가 복제됐다').toHaveLength(1)
        expect(all.sort()).toEqual(['고추', '배추'])
    })
})

describe("주소가 'all'인 하위필지 — 상위로 흡수되지 않는다 (m-2)", () => {
    // `buildOptions`는 이 키를 제외하는데 `collectCrops`가 걷으면 상위로 빨려 들어간다
    it('작물이 그 하위필지에 남는다', () => {
        const parcel = { crops: [], subLots: [{ lotAddress: 'all', crops: [{ name: '고추' }] }] }
        S.distributeCrops(parcel, S.collectCrops(parcel))
        expect(parcel.crops, '상위로 흡수됐다').toEqual([])
        expect(parcel.subLots[0].crops.map((c) => c.name)).toEqual(['고추'])
    })
})

describe('distributeCrops — 판정 불가 시 꼬리표를 보존한다 (분할모드)', () => {
    // 🚨 SAMPL-1-159가 `resolveForEdit`로 막았던 회귀. 분할모드 레코드는
    //    `subLots: []`로 저장되면서 배정은 보존한다(`soil-log-record.js:89-90`).
    //    꼬리표를 지우면 사용자가 **수정 버튼만 눌러도** 배정이 영구 소멸한다.
    it('대조할 하위필지가 없으면 원값을 남긴다', () => {
        const parcel = { crops: [], subLots: [] }
        S.distributeCrops(parcel, [{ name: '고추', subLotTarget: '문단리 225' }])
        expect(parcel.crops[0].subLotTarget, '분할모드 배정이 지워졌다').toBe('문단리 225')
    })

    it('대조할 하위필지가 있는데 안 맞으면 꼬리표를 버린다', () => {
        const parcel = { crops: [], subLots: [{ lotAddress: 'B', crops: [] }] }
        S.distributeCrops(parcel, [{ name: '고추', subLotTarget: '없는주소' }])
        expect(parcel.crops[0].name, '작물이 사라졌다').toBe('고추')
        expect('subLotTarget' in parcel.crops[0]).toBe(false)
    })
})

describe('cloneSubLots — 저장 레코드와의 별칭을 끊는다 (C-2)', () => {
    // 🚨 폼이 `subLots`를 얕게 복사해 저장 레코드와 **같은 객체**를 썼다.
    //    `distributeCrops`가 그것을 제자리에서 비우므로, 사용자가 수정을
    //    **취소해도 저장본이 이미 바뀌어** 있었다.
    it('하위필지 작물을 건드려도 원본이 그대로다', () => {
        const saved = [{ lotAddress: 'A', crops: [{ name: '고추', area: '100' }] }]
        const form = S.cloneSubLots(saved)
        form[0].crops.push({ name: '배추' })
        form[0].crops[0].name = '무'
        expect(saved[0].crops.map((c) => c.name), '저장본이 오염됐다').toEqual(['고추'])
    })

    it('distributeCrops가 복사본만 비운다', () => {
        const saved = [{ lotAddress: 'A', crops: [{ name: '고추' }] }]
        const parcel = { crops: [], subLots: S.cloneSubLots(saved) }
        S.distributeCrops(parcel, [])
        expect(saved[0].crops, '저장본의 작물이 사라졌다').toHaveLength(1)
    })

    it('문자열 하위필지(구 데이터)는 그대로 둔다', () => {
        expect(S.cloneSubLots(['A', 'B'])).toEqual(['A', 'B'])
    })

    it('망가진 입력에서도 터지지 않는다', () => {
        for (const bad of [null, undefined, 'x', [null, 3]]) {
            expect(() => S.cloneSubLots(bad)).not.toThrow()
        }
    })
})

describe('migrateParcels — 옛 꼬리표를 로드 시 실제 이동으로 이관한다 (M-2)', () => {
    // 🚨 이관을 편집 화면에만 두면, 사용자가 그 레코드를 열기 전까지
    //    엑셀·목록·흙토람은 계속 상위 필지 행에 넣는다 — 원 결함이 그대로다.
    it('유효한 배정을 하위필지로 옮긴다', () => {
        const parcels = [{
            crops: [{ name: '고추', area: '100', subLotTarget: '문단리 226' }, { name: '배추', area: '50' }],
            subLots: [{ lotAddress: '문단리 226', crops: [] }],
        }]
        expect(S.migrateParcels(parcels)).toBe(1)
        expect(parcels[0].subLots[0].crops.map((c) => c.name)).toEqual(['고추'])
        expect(parcels[0].crops.map((c) => c.name)).toEqual(['배추'])
        expect('subLotTarget' in parcels[0].subLots[0].crops[0]).toBe(false)
    })

    it('멱등이다 — 두 번 돌려도 복제되지 않는다', () => {
        const parcels = [{
            crops: [{ name: '고추', subLotTarget: 'A' }],
            subLots: [{ lotAddress: 'A', crops: [] }],
        }]
        S.migrateParcels(parcels)
        expect(S.migrateParcels(parcels), '두 번째에도 옮길 것이 있다고 봤다').toBe(0)
        expect(parcels[0].subLots[0].crops).toHaveLength(1)
    })

    // 분할모드 레코드는 복원 가능성을 남겨 둬야 한다 (SAMPL-1-159)
    it('가리킬 하위필지가 없으면 건드리지 않는다', () => {
        const parcels = [{ crops: [{ name: '고추', subLotTarget: '문단리 225' }], subLots: [] }]
        expect(S.migrateParcels(parcels)).toBe(0)
        expect(parcels[0].crops[0].subLotTarget).toBe('문단리 225')
    })

    it('배정 없는 작물은 상위에 그대로 둔다', () => {
        const parcels = [{
            crops: [{ name: '고추' }],
            subLots: [{ lotAddress: 'A', crops: [] }],
        }]
        expect(S.migrateParcels(parcels)).toBe(0)
        expect(parcels[0].crops.map((c) => c.name)).toEqual(['고추'])
    })

    // 🚨 필지별 카운터를 안 쓰면 앞 필지가 옮겼다는 이유로 뒤 필지 배열까지 갈아치운다
    it('아무것도 안 옮긴 필지의 작물 배열은 유지된다', () => {
        const untouched = [{ name: '무' }]
        const parcels = [
            { crops: [{ name: '고추', subLotTarget: 'A' }], subLots: [{ lotAddress: 'A', crops: [] }] },
            { crops: untouched, subLots: [{ lotAddress: 'B', crops: [] }] },
        ]
        S.migrateParcels(parcels)
        expect(parcels[1].crops, '건드리지 않은 필지의 배열이 교체됐다').toBe(untouched)
    })

    it('망가진 입력에서도 터지지 않는다', () => {
        for (const bad of [null, undefined, [null], [{ crops: 'x', subLots: 3 }]]) {
            expect(() => S.migrateParcels(bad)).not.toThrow()
        }
    })
})

describe('migrateParcels — 혼합 상태에서 복제하지 않는다', () => {
    // 🚨 꼬리표는 표시 전용이었으므로, 배정도 해 두고 하위필지 카드에서 같은 작물을
    //    직접 입력한 레코드가 있을 수 있다. 그대로 밀어 넣으면 면적이 두 배가 된다.
    it('같은 작물이 이미 그 하위필지에 있으면 넣지 않는다', () => {
        const parcels = [{
            crops: [{ name: '고추', area: '100', subLotTarget: 'A' }],
            subLots: [{ lotAddress: 'A', crops: [{ name: '고추', area: '100' }] }],
        }]
        S.migrateParcels(parcels)
        expect(parcels[0].subLots[0].crops, '이관이 작물을 복제했다').toHaveLength(1)
        expect(parcels[0].crops, '상위에서 제거되지 않았다').toEqual([])
    })

    it('면적이 다르면 다른 작물로 보고 둘 다 남긴다', () => {
        const parcels = [{
            crops: [{ name: '고추', area: '50', subLotTarget: 'A' }],
            subLots: [{ lotAddress: 'A', crops: [{ name: '고추', area: '100' }] }],
        }]
        S.migrateParcels(parcels)
        expect(parcels[0].subLots[0].crops.map((c) => c.area).sort()).toEqual(['100', '50'])
    })
})

describe('indexSubLots — 세 함수가 같은 규칙을 쓴다', () => {
    // 🚨 이 규칙이 함수마다 달랐던 것이 중복 주소 복제(M-3)의 원인이었다.
    it('빈 주소·all·중복을 제외하고 첫 항목만 남긴다', () => {
        const lots = [
            { lotAddress: '', crops: [] },
            { lotAddress: 'all', crops: [] },
            { lotAddress: 'A', crops: [{ name: '첫번째' }] },
            { lotAddress: 'A', crops: [{ name: '두번째' }] },
            { lotAddress: 'B', crops: [] },
        ]
        const idx = S.indexSubLots(lots)
        expect([...idx.keys()]).toEqual(['A', 'B'])
        expect(idx.get('A').crops[0].name, '중복 주소에서 뒤엣것을 골랐다').toBe('첫번째')
    })

    // ⚠️ 읽기 호출부가 데이터를 바꾸면, 모달을 열고 취소만 해도 변경이 기록된다
    it('promote 없이는 데이터를 건드리지 않는다', () => {
        const lots = ['A', { lotAddress: 'B' }]
        S.indexSubLots(lots)
        expect(lots[0], '문자열이 승격됐다').toBe('A')
        expect('crops' in lots[1], 'crops가 덧붙었다').toBe(false)
    })

    it('promote면 문자열을 승격하고 crops를 보장한다', () => {
        const lots = ['A', { lotAddress: 'B' }]
        S.indexSubLots(lots, true)
        expect(lots[0]).toEqual({ lotAddress: 'A', crops: [] })
        expect(lots[1].crops).toEqual([])
    })

    // collectCrops(읽기)와 distributeCrops(쓰기)가 같은 집합을 봐야 한다
    it('collectCrops가 걷는 하위필지와 distributeCrops가 담는 곳이 일치한다', () => {
        const parcel = {
            crops: [],
            subLots: [
                { lotAddress: 'A', crops: [{ name: '고추', area: '1' }] },
                { lotAddress: 'A', crops: [{ name: '배추', area: '2' }] },
                { lotAddress: 'all', crops: [{ name: '무', area: '3' }] },
            ],
        }
        const before = S.collectCrops(parcel).map((c) => c.name).sort()
        S.distributeCrops(parcel, S.collectCrops(parcel))
        const after = [
            ...parcel.crops.map((c) => c.name),
            ...parcel.subLots.flatMap((l) => (l.crops || []).map((c) => c.name)),
        ].sort()
        expect(after, `걷은 것과 담긴 것이 다르다: ${JSON.stringify({ before, after })}`)
            .toEqual(['고추', '무', '배추'])
    })
})

describe('migrateParcels — 진짜 중복은 삼키지 않는다', () => {
    // 🚨 중복 대조를 `lot.crops`(실행 중 갱신됨)로 하면 **방금 옮겨 넣은 것**까지
    //    대조 대상이 되어, 같은 작물을 두 시료로 따로 접수한 레코드에서
    //    두 번째가 조용히 사라진다. 무인 로드 변형이라 아무도 모른다.
    it('같은 작물 두 건을 배정했으면 둘 다 옮긴다', () => {
        const parcels = [{
            crops: [
                { name: '고추', area: '100', unit: 'm2', subLotTarget: 'A' },
                { name: '고추', area: '100', unit: 'm2', subLotTarget: 'A' },
            ],
            subLots: [{ lotAddress: 'A', crops: [] }],
        }]
        S.migrateParcels(parcels)
        expect(parcels[0].subLots[0].crops, '진짜 중복 한 건이 삼켜졌다').toHaveLength(2)
        expect(parcels[0].crops).toEqual([])
    })

    // 이미 하위필지에 있던 것과의 중복만 막는다 (이전 계약 유지)
    it('이미 있던 것과 겹치면 여전히 넣지 않는다', () => {
        const parcels = [{
            crops: [{ name: '고추', area: '100', unit: 'm2', subLotTarget: 'A' }],
            subLots: [{ lotAddress: 'A', crops: [{ name: '고추', area: '100', unit: 'm2' }] }],
        }]
        S.migrateParcels(parcels)
        expect(parcels[0].subLots[0].crops).toHaveLength(1)
    })
})

describe('indexSubLots — 문자열보다 객체가 키를 갖는다', () => {
    // 🚨 문자열(구 데이터)이 키를 차지하면, 같은 주소 객체가 들고 있던 작물이
    //    모달에서 보이지도 편집되지도 않는 **유령 작물**이 된다 (엑셀엔 나온다).
    it('같은 주소에 문자열과 객체가 섞이면 객체를 쓴다', () => {
        const lots = ['A', { lotAddress: 'A', crops: [{ name: '마늘' }] }]
        expect(S.indexSubLots(lots).get('A').crops.map((c) => c.name)).toEqual(['마늘'])
    })

    it('collectCrops가 그 작물을 보여준다', () => {
        const parcel = {
            crops: [{ name: '고추' }],
            subLots: ['A', { lotAddress: 'A', crops: [{ name: '마늘' }] }],
        }
        expect(S.collectCrops(parcel).map((c) => c.name).sort())
            .toEqual(['고추', '마늘'])
    })
})
