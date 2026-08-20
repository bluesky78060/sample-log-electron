// @ts-check
/**
 * 하위필지 식별 — 순수 로직 (SAMPL-1-159)
 *
 * ## 왜 필요한가
 *
 * 작물의 `subLotTarget`은 "이 작물이 어느 하위필지 것인가"를 가리킨다. 그런데
 * `getSubLotOptions`가 `<option value>`에 하위필지 **원소를 통째로** 넣었다.
 * 원소는 신규 데이터에서 `{lotAddress, crops}` **객체**이므로:
 *
 *   value="[object Object]"      화면: 하위 1: [object Object]
 *
 * 게다가 선택하면 `subLotTarget = e.target.value`로 **DOM에서 온 문자열**이 저장되는데,
 * 다시 열 때 비교는 `subLotTarget === opt.value`(문자열 vs 객체)라 영원히 거짓이었다.
 * → 저장한 선택이 복원되지 않았다.
 *
 * ## 식별자를 주소로 정한 이유
 *
 * 하위필지 원소는 **문자열(구 데이터)과 객체(신 데이터)가 섞여 있다** — 코드 곳곳이
 * `typeof === 'string'`으로 분기하고, `confirmCropArea`가 편집 시 문자열을 객체로
 * 마이그레이션한다. 그래서 양쪽에서 **주소**를 뽑아 키로 쓴다.
 *
 * 인덱스를 키로 쓰지 않았다: 하위필지는 **삭제가 가능하다**(`soil-script.js:3740`
 * `subLots.splice`). 삭제로 인덱스가 밀리면 저장된 선택이 **다른 하위필지를 가리킨다** —
 * 조용히 틀리는 쪽이라 더 나쁘다. 주소는 순서에 안전하다.
 *
 * ⚠️ **주소가 키이므로 중복을 허용하면 키가 아니다.** 처음에는 "같은 주소면 표시가 같은 것이
 *    맞고 애초에 입력 실수"라고 판단했는데, 독립 모델 리뷰가 구체적 피해를 지적했다:
 *    주소가 같은 하위필지 둘 중 하나를 지우면 **지워진 쪽을 가리켰던 작물이 조용히
 *    남은 쪽을 가리킨다.** 사용자는 알 수 없다.
 *    → `canAdd`로 **입력 시점에 중복을 막는다.** 그래야 주소가 진짜 식별자가 된다.
 *    이미 중복이 저장된 레코드에서는 여전히 겹치지만, 새로 만들 수는 없다.
 *
 * 노출: window.SubLotIdentity
 */
(function () {
    'use strict';

    const ALL = 'all';

    /**
     * 하위필지 원소에서 **식별 키**(주소)를 뽑는다.
     * 문자열이면 그대로, 객체면 `lotAddress`. 주소가 없으면 빈 문자열.
     * @param {any} lot
     * @returns {string}
     */
    function keyOf(lot) {
        if (lot === null || lot === undefined) return '';
        const raw = (typeof lot === 'object') ? lot.lotAddress : lot;
        return String(raw ?? '').trim();
    }

    /**
     * 드롭다운 옵션 목록. 첫 항목은 항상 '전체'다.
     *
     * ⚠️ 키가 비었거나 예약값 `'all'`과 같은 하위필지는 **건너뛴다.** 식별할 수 없고,
     *    그 값은 '전체'와 구분되지 않아 조용한 오선택을 만든다. (본문 주석 참조)
     *
     * @param {Array<any>} subLots
     * @returns {Array<{value: string, label: string}>}
     */
    function buildOptions(subLots) {
        const options = [{ value: ALL, label: '전체 (상위 필지 전체)' }];
        const list = Array.isArray(subLots) ? subLots : [];
        list.forEach((lot, idx) => {
            const key = keyOf(lot);
            // 주소가 없거나 예약값 'all'과 같으면 식별할 수 없다.
            // `value=""`나 `value="all"`은 '전체'와 구분되지 않아 조용한 오선택을 만든다.
            //
            // ⚠️ 이 제외가 그 하위필지를 고립시키지는 않는다 — 하위필지 카드에 자기
            //    **'작물 추가' 버튼**이 따로 있고(`btn-add-sublot-crop`) 그쪽은 인덱스로
            //    동작한다(`openSubLotCropModal`). 상위 필지의 작물 모달에서만 지목할 수
            //    없을 뿐이다. 주소가 비었으니 목록에 보여줄 이름도 없다.
            //    (입력 경로는 `canAdd`가 빈 주소를 막으므로, 이 경우는 가져온 데이터뿐이다.)
            if (!key || key === ALL) return;
            options.push({ value: key, label: `하위 ${idx + 1}: ${key}` });
        });
        return options;
    }

    /**
     * 이 주소를 하위필지로 **추가할 수 있는가.**
     *
     * ⚠️ 주소가 키이므로 **중복을 허용하면 키가 아니다.** 독립 모델 리뷰가 지적한
     *    시나리오: 주소가 같은 하위필지 둘 중 하나를 지우면, 지워진 쪽을 가리켰던
     *    작물이 **조용히 남은 쪽을 가리킨다.** 사용자는 알 수 없다.
     *    → 입력 시점에 막는다. 그래야 주소가 진짜 식별자가 된다.
     *
     * @param {string} address 추가하려는 주소
     * @param {Array<any>} subLots 기존 하위필지
     * @returns {{ok: boolean, reason?: string}}
     */
    function canAdd(address, subLots) {
        const key = String(address ?? '').trim();
        if (!key) return { ok: false, reason: '주소를 입력하세요.' };
        if (key === ALL) return { ok: false, reason: `'${ALL}'은 예약된 값이라 하위필지 주소로 쓸 수 없습니다.` };
        const list = Array.isArray(subLots) ? subLots : [];
        if (list.some((lot) => keyOf(lot) === key)) {
            return { ok: false, reason: `이미 있는 하위필지입니다: ${key}` };
        }
        return { ok: true };
    }

    /**
     * 저장된 `subLotTarget`이 지금도 유효한가 — 아니면 '전체'로 되돌린다.
     *
     * 이 함수가 **마이그레이션 역할**을 한다. 예전 결함으로 `'[object Object]'`가
     * 저장된 레코드가 있고, 하위필지가 삭제되어 가리키던 대상이 사라진 경우도 있다.
     * 둘 다 '전체'로 떨어뜨린다 — 있지도 않은 대상을 가리키는 채로 남기면
     * 라벨이 조용히 사라져 사용자가 원인을 알 수 없다.
     *
     * @param {any} subLotTarget
     * @param {Array<any>} subLots
     * @returns {string} 유효한 키 또는 'all'
     */
    function resolveTarget(subLotTarget, subLots) {
        const target = String(subLotTarget ?? '').trim();
        if (!target || target === ALL) return ALL;
        const list = Array.isArray(subLots) ? subLots : [];
        return list.some((lot) => keyOf(lot) === target) ? target : ALL;
    }

    /**
     * 목록 화면에 붙는 라벨 (`[주소]`). '전체'이거나 유효하지 않으면 빈 문자열.
     * @param {any} subLotTarget
     * @param {Array<any>} subLots
     * @returns {string}
     */
    function labelOf(subLotTarget, subLots) {
        const resolved = resolveTarget(subLotTarget, subLots);
        return resolved === ALL ? '' : `[${resolved}]`;
    }

    /** 예전 결함이 남긴, 어떤 상황에서도 유효할 수 없는 값 */
    function isGarbageTarget(value) {
        return String(value ?? '').trim() === '[object Object]';
    }

    /**
     * "이 값은 유효하지 않다"고 **말할 수 있는가.**
     *
     * 식별 가능한 하위필지가 하나도 없으면 판정할 수 없다. 분할모드 저장이
     * `subLots: []`로 기록하면서 배정은 보존하기 때문이다(`soil-log-record.js:89-90`).
     * @param {Array<any>} subLots
     */
    function canJudge(subLots) {
        return (Array.isArray(subLots) ? subLots : []).some((l) => !!keyOf(l));
    }

    /**
     * **편집 화면용** 정리 — 판정할 수 없으면 원값을 그대로 돌려준다.
     *
     * ⚠️ `resolveTarget`을 편집 경로에 그대로 쓰면 안 된다. 적대적 검증이 실측한 경로:
     *    분할모드 레코드(`subLots: []` + 배정 보존)를 수정하려고 열면 배정이 `'all'`로
     *    바뀌고, 확인만 눌러도 영구 소멸한다. 사용자는 그 화면에서 배정을
     *    **볼 수도 바꿀 수도 없다**(하위필지가 없으니 드롭다운도 없다).
     *
     *    `normalizeParcels`와 **같은 규칙**을 쓴다 — 두 정리 경로가 다른 불변식을
     *    가지면 다음 사람이 어느 쪽에 맞출지 알 수 없다.
     *
     * @param {any} subLotTarget
     * @param {Array<any>} subLots
     * @returns {any} 유효한 키 · 'all' · (판정 불가 시) 원값
     */
    function resolveForEdit(subLotTarget, subLots) {
        if (isGarbageTarget(subLotTarget)) return ALL;
        if (!canJudge(subLots)) return subLotTarget;
        return resolveTarget(subLotTarget, subLots);
    }

    /**
     * 필지 배열의 모든 작물 `subLotTarget`을 제자리에서 정리한다.
     *
     * ⚠️ 모달에서만 정리하면 **모달을 열지 않고 저장되는 경로**에서 예전 결함이 남긴
     *    `'[object Object]'`가 그대로 재저장된다(독립 모델 리뷰 지적).
     *    저장 직전에 한 번 더 훑어 데이터 자체를 깨끗하게 만든다.
     *
     * ## 🚨 "판정 불가"와 "무효"를 구분한다 (코드 리뷰가 찾은 회귀)
     *
     * 처음에는 대조할 하위필지가 없으면 무조건 `'all'`로 떨어뜨렸다. 그런데
     * **분할모드 저장이 `subLots: []`로 기록하면서 `subLotTarget`은 보존한다**
     * (`soil-log-record.js:89-90`). 그래서 그룹수정으로 폼을 열면
     * `populateFormForGroupEdit`이 마지막에 `updateParcelsData()`를 호출하는 순간
     * **배정이 통째로 지워졌다** — 사용자는 수정 버튼만 눌렀는데.
     *
     * 게다가 이 필드는 표시 전용이라 예전 코드에서는 값이 스토리지에 **살아 있었고**,
     * 하위필지 주소를 다시 넣으면 라벨이 복원됐다. 무조건 정리는 그 복구 가능성을 파괴한다.
     *
     * → **대조할 하위필지가 있을 때만** 무효를 판정한다. 없으면 판정을 보류한다.
     *   단 `'[object Object]'`는 어떤 상황에서도 유효할 수 없으므로 항상 정리한다.
     *
     * @param {Array<any>} parcels
     * @returns {number} 실제로 바꾼 작물 수 (0이면 정리할 것이 없었다)
     */
    function normalizeParcels(parcels) {
        const list = Array.isArray(parcels) ? parcels : [];
        let changed = 0;
        for (const parcel of list) {
            if (!parcel) continue;

            // 하위필지 **자신의** 작물에도 배정이 남아 있을 수 있다. 예전 UI가
            // 하위필지 모달에서 다른 하위필지를 가리키게 저장할 수 있었기 때문이다
            // (적대적 검증 지적). 그 작물은 이미 자기 하위필지 것이므로 배정이 무의미하다.
            for (const lot of (Array.isArray(parcel.subLots) ? parcel.subLots : [])) {
                if (!lot || typeof lot !== 'object' || !Array.isArray(lot.crops)) continue;
                for (const crop of lot.crops) {
                    if (!crop || crop.subLotTarget === undefined) continue;
                    if (crop.subLotTarget !== ALL) {
                        crop.subLotTarget = ALL;
                        changed++;
                    }
                }
            }

            if (!Array.isArray(parcel.crops)) continue;
            for (const crop of parcel.crops) {
                if (!crop) continue;
                const before = crop.subLotTarget;
                // 'all'이 기본값이므로, 원래 비어 있던 것을 굳이 채우지는 않는다 —
                // 저장 데이터에 없던 필드를 새로 만들면 diff가 커지고 동기화가 시끄러워진다.
                if (before === undefined) continue;
                // 편집 화면과 **같은 규칙**을 쓴다 (resolveForEdit)
                const after = resolveForEdit(before, parcel.subLots);
                if (before !== after) {
                    crop.subLotTarget = after;
                    changed++;
                }
            }
        }
        return changed;
    }

    /**
     * 필지의 **모든 작물**을 편집용 한 목록으로 모은다 (SAMPL-1-161).
     *
     * 상위 필지 작물과 각 하위필지 작물을 합치되, 어디 소속인지 `subLotTarget`으로 표시한다.
     * 작물·면적 모달이 이 목록을 편집하고 `distributeCrops`가 다시 나눈다.
     *
     * ## 왜 합치는가
     * 예전에는 모달이 `parcel.crops`만 편집했고, 하위필지 배정은 `subLotTarget` 꼬리표만
     * 붙였다. 그런데 **엑셀·목록·흙토람은 `subLot.crops`만 읽어서** 배정이 반영되지 않았다
     * (화면은 `고추 [문단리 226]`인데 엑셀은 상위 필지 행에 넣었다).
     * 이제 배정이 실제 이동이 되므로, 모달이 하위필지 작물까지 보여줘야 배정을
     * 되돌리거나 옮길 수 있다.
     *
     * @param {any} parcel
     * @returns {Array<any>} `subLotTarget`이 채워진 작물 목록
     */
    function collectCrops(parcel) {
        const out = [];
        const own = Array.isArray(parcel?.crops) ? parcel.crops : [];
        for (const c of own) {
            if (!c) continue;
            // ⚠️ 기존 꼬리표를 **덮어쓰지 않는다.** 처음 구현은 여기서 `ALL`을 박았는데,
            //    그러면 예전에 배정해 둔 레코드를 열어 확정만 해도 배정이 소멸했고
            //    (SAMPL-1-159가 `resolveForEdit`로 막아둔 회귀가 되살아났다),
            //    호출부의 `resolveForEdit`는 항상 `ALL`만 받는 no-op이 됐다.
            //    꼬리표를 살려 두면 그 값이 `distributeCrops`에서 **실제 이동**이 되므로
            //    옛 데이터가 모달을 거치는 것만으로 새 구조로 이관된다.
            out.push({ ...c, subLotTarget: c.subLotTarget ?? ALL });
        }
        // `distributeCrops`와 **같은 색인 규칙**을 쓴다. 규칙이 어긋나면 걷은 것과
        // 담는 곳이 달라져 작물이 복제된다(적대적 검증 실측: 중복 주소에서 고추가 두 번).
        // 여기는 읽기이므로 승격하지 않는다 — 모달을 열기만 해도 데이터가 바뀌면 안 된다.
        for (const [key, lot] of indexSubLots(parcel?.subLots)) {
            // 문자열 하위필지(구 데이터)는 작물을 가질 수 없다 (승격은 확정 시에 일어난다)
            if (typeof lot !== 'object' || !Array.isArray(lot.crops)) continue;
            for (const c of lot.crops) {
                if (!c) continue;
                out.push({ ...c, subLotTarget: key });
            }
        }
        return out;
    }

    /**
     * 편집된 작물 목록을 `parcel.crops`와 각 `subLot.crops`로 **제자리에서** 다시 나눈다.
     *
     * ⚠️ 가리킬 하위필지가 없는 작물은 **버리지 않고 상위 필지에 둔다.** 배정이 잘못됐다고
     *    작물을 없애면 담당자가 입력한 자료가 조용히 사라진다.
     *
     * ⚠️ 문자열 하위필지는 객체로 승격한다 — 작물을 담으려면 `crops` 배열이 필요하다.
     *    기존 `confirmCropArea`가 하던 것과 같은 처리다.
     *
     * @param {any} parcel 제자리에서 수정된다
     * @param {Array<any>} crops `subLotTarget`을 가진 편집 결과
     */
    function distributeCrops(parcel, crops) {
        if (!parcel) return;
        const list = Array.isArray(crops) ? crops : [];
        const subLots = Array.isArray(parcel.subLots) ? parcel.subLots : [];

        // 하위필지를 키로 찾을 수 있게 준비하면서 문자열을 객체로 승격한다
        const byKey = indexSubLots(subLots, true);

        const own = [];
        for (const lot of byKey.values()) lot.crops = [];
        // 대조할 하위필지가 없으면 배정의 유효성을 **판정할 수 없다** — `resolveForEdit`와 같은 규칙.
        const judgeable = canJudge(subLots);

        for (const c of list) {
            if (!c) continue;
            const target = String(c.subLotTarget ?? ALL);
            const lot = target !== ALL ? byKey.get(target) : null;
            const { subLotTarget, ...rest } = c;
            if (lot) {
                // 소속 표시는 데이터에 남기지 않는다 — 위치가 곧 소속이다
                lot.crops.push(rest);
            } else if (target !== ALL && !judgeable) {
                // 분할모드 레코드(`subLots: []` + 배정 보존)다. 꼬리표를 지우면
                // 사용자가 수정 버튼만 눌러도 배정이 영구 소멸한다 (SAMPL-1-159).
                // 하위필지 주소를 다시 넣으면 이 값으로 복원되므로 살려 둔다.
                own.push({ ...rest, subLotTarget });
            } else {
                own.push(rest);
            }
        }
        parcel.crops = own;
    }

    /**
     * 하위필지를 **주소 → 하위필지 객체**로 색인한다 (SAMPL-1-161).
     *
     * ## 🚨 이 규칙은 한 벌이어야 한다
     * `collectCrops`(걷기)·`distributeCrops`(나누기)·`migrateParcels`(이관)가
     * 각자 조금씩 다르게 구현했다가 **중복 주소에서만 규칙이 어긋나** 작물이
     * 복제됐다(적대적 검증 실측: 고추가 두 번, 총면적 2배).
     * 그래서 세 곳이 이 함수 하나를 쓴다 — 규칙을 바꾸려면 여기만 바꾼다.
     *
     * 규칙:
     *  - 주소가 없으면 제외 (식별 불가)
     *  - 주소가 `'all'`이면 제외 — 상위 필지를 뜻하는 예약어다 (`buildOptions`와 동일)
     *  - 주소가 중복되면 **첫 번째만** 등록
     *  - 문자열 하위필지(구 데이터)는 객체로 승격하고 `crops` 배열을 보장 (제자리)
     *
     * ⚠️ `promote`가 참일 때만 데이터를 건드린다. **읽기만 하는 호출부는 반드시 거짓**을
     *    넘겨야 한다 — 모달을 열기만 하고 취소했는데 하위필지 모양이 바뀌면
     *    Firestore 동기화 diff가 시끄러워지고, 사용자가 안 한 변경이 기록된다.
     *
     * @param {Array<any>} subLots `promote`가 참이면 제자리에서 승격된다
     * @param {boolean} [promote] 문자열을 객체로 승격하고 `crops`를 보장할지 (기본 false)
     * @returns {Map<string, any>}
     */
    function indexSubLots(subLots, promote) {
        const byKey = new Map();
        const list = Array.isArray(subLots) ? subLots : [];
        // ⚠️ **객체를 먼저 등록한다.** 같은 주소에 문자열(구 데이터)과 객체가 섞여 있을 때
        //    문자열이 키를 차지하면, 객체가 들고 있던 작물이 모달에서 보이지도 편집되지도
        //    않는 **유령 작물**이 된다(엑셀·흙토람에는 나온다). 문자열은 작물을 가질 수
        //    없으므로 객체에 우선권을 준다.
        const order = [
            ...list.map((lot, i) => i).filter((i) => list[i] && typeof list[i] === 'object'),
            ...list.map((lot, i) => i).filter((i) => !list[i] || typeof list[i] !== 'object'),
        ];
        order.forEach((i) => {
            const lot = list[i];
            const key = keyOf(lot);
            if (!key || key === ALL || byKey.has(key)) return;
            if (promote) {
                if (typeof lot === 'string') {
                    list[i] = { lotAddress: lot, crops: [] };
                } else if (!Array.isArray(lot.crops)) {
                    lot.crops = [];
                }
            }
            byKey.set(key, list[i]);
        });
        return byKey;
    }

    /**
     * 이 필지가 **쓸 수 있는 하위필지를 가졌는가** (SAMPL-1-161).
     *
     * 저장 경로가 분할모드로 갈지 판단할 때 쓴다. 분할모드는 `buildSoilLogRecord`에서
     * `subLots: isSplit ? []`로 하위필지를 버리므로, 하위필지가 있으면 분할하면 안 된다.
     * `canJudge`와 같은 규칙(식별 가능한 하위필지가 하나라도 있는가)이지만
     * **호출 의도가 달라** 이름을 따로 둔다 — 한쪽 규칙만 바뀌면 안 되는 자리다.
     *
     * @param {any} parcel
     * @returns {boolean}
     */
    function hasUsableSubLots(parcel) {
        return canJudge(parcel && parcel.subLots);
    }

    /**
     * 옛 꼬리표 배정을 **실제 이동**으로 이관한다 (SAMPL-1-161).
     *
     * ## 왜 로드 시점인가
     * 배정이 `subLotTarget` 꼬리표뿐이던 시절에 저장된 레코드가 남아 있다.
     * 이관을 편집 화면(`collectCrops` → `distributeCrops`)에만 두면
     * **사용자가 그 레코드를 열어 확정하기 전까지** 엑셀·목록·흙토람은 계속
     * 상위 필지 행에 넣는다 — 이 티켓이 고치려는 결함이 그대로 남는다.
     * 게다가 화면은 `[문단리 226]` 라벨을 계속 붙여 거짓말을 이어간다.
     *
     * 그래서 로드 직후 한 번 훑는다. 멱등이라 매 로드마다 안전하게 다시 돌 수 있다.
     *
     * ## ⚠️ 이 함수는 **저장하지 않는다** — 부르는 쪽마다 따로 걸어야 한다
     * 이관 결과는 메모리의 사본에만 반영된다. 그래서 localStorage를 **직접 읽는
     * 다른 페이지**는 이 이관을 자동으로 얻지 못한다. 실제로 흙토람이 그렇다
     * (`heuktoram-script.js`의 `loadSampleLogs`가 localStorage를 직접 읽는다).
     * → 현재 걸어 둔 곳: 토양 `getAdditionalMigrations()` 훅, 흙토람 `loadSampleLogs()`.
     *   **새로 토양 데이터를 읽는 화면을 만들면 여기도 함께 걸어야 한다.**
     *
     * (처음 이 주석은 "모든 읽기 경로가 이미 이관된 모양을 본다"고 적었는데 거짓이었다 —
     *  코드 리뷰가 흙토람 경로로 반증했다.)
     *
     * ⚠️ 가리킬 하위필지가 없는 꼬리표는 **건드리지 않는다.** 분할모드 레코드
     *    (`subLots: []` + 배정 보존)의 복원 가능성을 파괴하기 때문이다 (SAMPL-1-159).
     *
     * @param {Array<any>} parcels 제자리에서 수정된다
     * @returns {number} 실제로 옮긴 작물 수
     */
    function migrateParcels(parcels) {
        const list = Array.isArray(parcels) ? parcels : [];
        let moved = 0;
        for (const parcel of list) {
            if (!parcel || !Array.isArray(parcel.crops) || !Array.isArray(parcel.subLots)) continue;

            // 주소 → 하위필지. 중복은 첫 번째만 (`collectCrops`·`distributeCrops`와 같은 규칙)
            const byKey = indexSubLots(parcel.subLots, true);
            if (byKey.size === 0) continue;

            const own = [];
            // ⚠️ 중복 대조는 **이관 시작 전 스냅샷**과만 한다. `lot.crops`를 그대로 보면
            //    방금 옮겨 넣은 것까지 대조 대상이 되어, 같은 작물을 두 시료로 따로
            //    접수한 레코드에서 **두 번째가 조용히 사라진다**(적대적 검증 실측).
            //    이건 무인 로드 변형이라 토스트도 확인도 없다.
            const preexisting = new Map();
            for (const [k, lot] of byKey) preexisting.set(k, lot.crops.slice());
            // ⚠️ 필지별 카운터다. 누적 `moved`로 판정하면 **앞 필지가 옮겼다는 이유로**
            //    아무것도 안 옮긴 뒤 필지의 배열까지 새 배열로 갈아치운다.
            let movedHere = 0;
            for (const crop of parcel.crops) {
                if (!crop) continue;
                const target = String(crop.subLotTarget ?? ALL);
                const lot = target !== ALL ? byKey.get(target) : null;
                if (!lot) {
                    own.push(crop);
                    continue;
                }
                const { subLotTarget, ...rest } = crop;
                // ⚠️ **이미 같은 작물이 그 하위필지에 있으면 넣지 않는다.**
                //    꼬리표는 표시 전용이었으므로, 담당자가 배정도 해 두고 하위필지 카드에서
                //    같은 작물을 직접 입력한 레코드가 있을 수 있다. 그대로 밀어 넣으면
                //    이관 순간 작물이 둘이 되어 면적이 두 배로 잡힌다(독립 모델 리뷰 지적).
                //    이름·면적·단위가 모두 같으면 같은 입력이 두 번 기록된 것으로 본다 —
                //    이름만으로 판단하면 정말 다른 두 작물을 잘못 합칠 수 있다.
                const dup = (preexisting.get(target) || []).some((c) =>
                    c && c.name === rest.name
                    && String(c.area ?? '') === String(rest.area ?? '')
                    && (c.unit || 'm2') === (rest.unit || 'm2'));
                if (!dup) lot.crops.push(rest);
                // 건너뛴 것도 상위에서는 빠지므로 "옮겼다"로 센다 —
                // 반환값은 **상위에서 제거된 수**다 (호출부의 요약 재계산 조건이 그 기준이다).
                movedHere++;
            }
            if (movedHere > 0) {
                parcel.crops = own;
                moved += movedHere;
            }
        }
        return moved;
    }

    /**
     * 하위필지 배열을 **깊은 복사**한다 (SAMPL-1-161).
     *
     * ## 왜 필요한가
     * `populateFormForEdit`는 폼용 필지를 만들 때 `crops`는 깊은 복사하면서
     * `subLots`는 `[...parcel.subLots]`로 얕게 복사했다. 그래서 폼의 하위필지 객체가
     * `sampleLogs`의 **저장 레코드와 같은 객체**였고, `distributeCrops`가 그것을
     * 제자리에서 비웠다 다시 채우는 순간 저장본이 함께 바뀌었다.
     * 사용자가 수정을 **취소해도** 메모리의 레코드는 이미 변경돼 있었고,
     * 이후 아무 저장(자동저장·다른 건 등록·완료 토글)에서 그대로 영속화됐다.
     *
     * 문자열 하위필지(구 데이터)는 불변이므로 그대로 둔다.
     *
     * @param {Array<any>|null|undefined} subLots
     * @returns {Array<any>} 원본과 객체를 공유하지 않는 새 배열
     */
    function cloneSubLots(subLots) {
        return (Array.isArray(subLots) ? subLots : []).map((lot) => {
            if (!lot || typeof lot !== 'object') return lot;
            return {
                ...lot,
                crops: Array.isArray(lot.crops) ? lot.crops.map((c) => ({ ...c })) : lot.crops
            };
        });
    }

    // window 전역 노출 (이 저장소의 공통 패턴)
    window.SubLotIdentity = { keyOf, buildOptions, canAdd, resolveTarget, resolveForEdit, canJudge, labelOf, normalizeParcels, migrateParcels, hasUsableSubLots, indexSubLots, collectCrops, distributeCrops, cloneSubLots, ALL };
})();
