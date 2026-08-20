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

    // window 전역 노출 (이 저장소의 공통 패턴)
    window.SubLotIdentity = { keyOf, buildOptions, canAdd, resolveTarget, resolveForEdit, canJudge, labelOf, normalizeParcels, ALL };
})();
