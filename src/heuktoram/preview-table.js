// @ts-check
/**
 * 흙토람 결과 가져오기 — 미리보기 표 구성 (순수 로직, SAMPL-1-158)
 *
 * `_buildPreview`가 만드는 **셀 배열**을 시료 한 건이 한 줄인 **표**로 묶는다.
 *
 * 왜 표인가:
 *  - 셀 하나가 한 줄이면 분석항목 10개 × 시료 5건 = 50줄로 미리보기 상한을 채운다.
 *    6건째부터 접혀서 확인이 안 됐다. 같은 상한이 표에서는 **시료 50건**을 담는다.
 *  - 같은 항목이 시료마다 흩어져 있으면 시료 간 비교가 불가능하다.
 *  - 사용자가 엑셀에 입력한 모양(가로)과 일치한다.
 *
 * ⚠️ 이 모듈은 DOM도 window 전역도 건드리지 않는다. 렌더는 호출부가 한다.
 * 노출: window.PreviewTable
 */
(function () {
    'use strict';

    const DEFAULT_ROW_LIMIT = 50;

    /**
     * 시료 한 건이 얼마나 "눈에 띄어야" 하는가 — 큰 값이 위로 간다.
     * 기존 셀 정렬 규칙(충돌 2점 · 범위경고 1점)을 **시료 단위로** 승계한다.
     * @param {Array<any>} cells
     */
    function rowScore(cells) {
        let score = 0;
        for (const c of cells) {
            if (!c) continue;
            if (c.hasConflict) score += 2;
            if (c.rangeWarning) score += 1;
        }
        return score;
    }

    /**
     * 셀 배열 → 표.
     *
     * @param {Array<any>} matched `_buildPreview`의 `result.matched`
     * @param {Array<string>} fields 사용자가 매핑한 **필드 순서**. 열 순서가 여기서 나온다
     * @param {Object} [opts]
     * @param {number} [opts.rowLimit=50] 표시할 최대 **시료 수**(셀 수가 아니다)
     * @returns {{columns: string[], rows: Array<{sampleNumber: string, cells: Object<string, any>}>,
     *            totalRows: number, truncated: boolean, overwritten: number}}
     *   `overwritten`: 같은 (시료, 필드)가 두 번 이상 와서 한 칸으로 합쳐진 횟수.
     *   요약줄이 "N셀 저장 예정"과 화면 칸 수의 차이를 설명하는 데 쓴다.
     */
    function buildTable(matched, fields, opts) {
        const list = Array.isArray(matched) ? matched : [];
        const declared = Array.isArray(fields) ? fields : [];
        const limit = (opts && Number.isFinite(opts.rowLimit)) ? Number(opts.rowLimit) : DEFAULT_ROW_LIMIT;

        // 시료번호별로 묶는다. Map은 삽입 순서를 지키므로 엑셀에 나온 순서가 기본이 된다.
        const bySample = new Map();
        const present = new Set();
        // 같은 (시료, 필드)가 두 번 이상 온 횟수. 표는 한 칸으로 합쳐 보여주므로
        // 이 값을 알리지 않으면 "N셀 저장 예정"과 화면의 칸 수가 어긋나 보인다.
        let overwritten = 0;
        for (const c of list) {
            if (!c) continue;
            const key = String(c.sampleNumber ?? '');
            if (!bySample.has(key)) bySample.set(key, { sampleNumber: key, cells: Object.create(null) });

            // ⚠️ 같은 시료·같은 필드가 두 번 오면 **저장이 실제로 남길 값**을 골라야 한다.
            //    `_commit`은 `if (!m.willApply) continue;` 뒤에 apply()하므로
            //    최종값은 **willApply인 것 중 마지막**이지 그냥 마지막이 아니다.
            //    충돌 정책이 skip/fillBlank일 때 뒤엣것이 willApply=false가 되는데,
            //    무조건 뒤엣것을 보여주면 화면은 6.9(취소선)인데 저장은 5.3이 된다.
            //    전부 건너뛰기면 마지막 것을 그대로 두어 "건너뜀"이 보이게 한다.
            const cells = bySample.get(key).cells;
            const prev = cells[c.field];
            if (prev) overwritten++;
            if (!prev || c.willApply || !prev.willApply) cells[c.field] = c;
            present.add(c.field);
        }

        // 열은 **선언된 순서**를 따르되, 값이 하나도 없는 필드는 뺀다.
        // matched에서 유추하면 skipEmpty가 만든 구멍 때문에 열 순서가 흔들린다.
        const columns = declared.filter((f) => present.has(f));
        // 선언에 없는데 데이터에 있는 필드까지 잃지 않도록 뒤에 붙인다.
        // ⚠️ 현재 호출 경로에서는 **도달하지 않는다** — 자동·수동 매핑 모두 키가
        //    `resultFields`에서 오므로 declared가 항상 present를 덮는다.
        //    매핑 방식이 늘어날 때를 대비한 방어이지, 지금 동작하는 기능이 아니다.
        for (const f of present) {
            if (!columns.includes(f)) columns.push(f);
        }

        const all = [...bySample.values()];
        // 정렬은 **안정적**이어야 한다 — 점수가 같으면 엑셀 순서를 유지한다.
        const ordered = all
            .map((r, i) => ({ r, i, s: rowScore(Object.values(r.cells)) }))
            .sort((a, b) => (b.s - a.s) || (a.i - b.i))
            .map((x) => x.r);

        return {
            columns,
            rows: ordered.slice(0, limit),
            totalRows: ordered.length,
            truncated: ordered.length > limit,
            overwritten,
        };
    }

    // @ts-ignore - window 전역 노출 (이 저장소의 공통 패턴)
    window.PreviewTable = { buildTable, rowScore, DEFAULT_ROW_LIMIT };
})();
