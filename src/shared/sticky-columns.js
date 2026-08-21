// @ts-check
/**
 * @fileoverview 목록 표의 왼쪽 고정 열 오프셋을 **실제 폭에서 계산**한다 (SAMPL-1-171).
 *
 * ## 왜 필요한가
 *
 * 고정 열의 `left`가 페이지별 CSS에 **픽셀로 박혀** 있었는데, 폭은 대부분
 * `min-width`라 내용에 따라 늘어난다. 그래서 가로로 스크롤하면 각 고정 열이
 * **자기 자리보다 왼쪽에 주차**해 앞 열 위로 올라탔다 — 담당자에게는 "화면이 밀린다".
 *
 * 실측(1280px, 토양 목록): `col-name`은 CSS `left: 435px`인데 실제 자리는 483px로
 * **48px 어긋났고**, 끝까지 스크롤하면 `완료→접수번호` 4px, `접수일자→구분` 14px가
 * 실제로 겹쳤다.
 *
 * ⚠️ CSS 상수로는 맞출 수 없다. 폭이 **내용·글꼴·확대율·모드**(공익직불제 열
 *    표시/숨김)에 따라 달라진다. `col-order`(차수)는 `sticky-col`을 달고도
 *    `left` 규칙이 아예 없어(실측 `auto`) 그 모드에서는 고정되지도 않았다.
 *
 * ## 어떻게
 *
 * 헤더 행의 셀 폭을 왼쪽부터 누적해 각 고정 열의 `left`를 정하고,
 * **열 클래스 단위 규칙**으로 한 번에 적용한다. 행마다 인라인 스타일을 쓰지 않는다 —
 * 목록이 수백 행일 때 그 비용이 그대로 드러난다.
 *
 * 페이지별 CSS의 하드코딩 값은 **그대로 둔다.** 이 스크립트가 돌기 전 첫 페인트에서
 * 고정 열이 풀려 보이지 않게 하는 바닥값 역할을 한다.
 *
 * ⚠️ 계산값에 `!important`를 붙인다. 명시도로 이기려 했다가 실패했다 —
 *    `.data-table.gongik-on .col-order`(0,3,0)가 스코프 선택자(0,2,1)를 이겨
 *    **공익직불제 모드에서만 하드코딩 값이 되살아났다**(실측: `left: 150px`,
 *    14px 겹침). 선택자를 더 길게 쓰는 것은 명시도 겨루기일 뿐이고, 다음에
 *    누가 규칙 하나를 더 얹으면 같은 방식으로 조용히 깨진다.
 *    "계산값이 항상 이긴다"를 규칙으로 못박는다.
 */

/** 생성한 규칙을 담을 style 요소의 id */
const STYLE_ID = 'sticky-col-offsets';
/** 표를 가리키는 스코프 속성 — 전역 규칙이 다른 표에 새지 않게 한다 */
const SCOPE_ATTR = 'data-sticky-scope';

let scopeSeq = 0;
/** @type {WeakMap<Element, string>} */
const scopeIds = new WeakMap();
/** 마지막으로 계산에 쓴 열 폭 — 그대로면 다시 재지 않는다 */
/** @type {WeakMap<Element, Array<number> & {applied?: number}>} */
const lastWidths = new WeakMap();
/** 재는 동안만 고정을 푸는 클래스 */
const MEASURING_CLASS = 'sticky-measuring';

/**
 * 이 표에 붙일 스코프 값을 정한다 (한 번만).
 * @param {Element} table
 * @returns {string}
 */
function scopeFor(table) {
    let id = scopeIds.get(table);
    if (!id) {
        id = `s${++scopeSeq}`;
        scopeIds.set(table, id);
        table.setAttribute(SCOPE_ATTR, id);
    }
    return id;
}

/**
 * 고정 열이 들어 있는 헤더 행을 찾는다.
 * @param {Element} table
 * @returns {HTMLTableRowElement|null}
 */
function stickyHeaderRow(table) {
    const rows = table.querySelectorAll('thead tr');
    for (const row of rows) {
        if (row.querySelector('th.sticky-col')) return /** @type {HTMLTableRowElement} */ (row);
    }
    return null;
}

/**
 * 이 셀이 고정 열임을 나타내는 클래스를 고른다.
 *
 * ⚠️ `sticky-col` 자체는 선택자로 쓸 수 없다 — 모든 고정 열이 공유하므로
 *    그것으로 규칙을 쓰면 마지막 값이 전부를 덮는다. 열을 특정하는
 *    `col-*` 클래스가 필요하다.
 * @param {Element} th
 * @returns {string|null}
 */
function columnClassOf(th) {
    for (const cls of th.classList) {
        if (cls.startsWith('col-')) return cls;
    }
    return null;
}

/**
 * 한 표의 고정 열 오프셋을 다시 계산해 규칙으로 적용한다.
 *
 * @param {Element} table `.data-table`
 * @returns {number} 적용한 열 수 (0이면 아무것도 하지 않았다)
 */
function applyToTable(table) {
    const row = stickyHeaderRow(table);
    if (!row) return 0;
    const wrap = table.closest('.table-wrapper');
    if (!wrap) return 0;

    // 표가 화면에 없으면(다른 뷰를 보고 있다) 폭이 전부 0이라 계산이 무의미하다.
    // 그 상태로 규칙을 쓰면 모든 열이 left: 0이 되어 겹침이 더 심해진다.
    const cells = Array.from(row.children);
    const widths = cells.map(c => c.getBoundingClientRect().width);
    if (widths.reduce((a, b) => a + b, 0) === 0) return 0;

    // 폭이 그대로면 오프셋도 그대로다. 스크롤할 때마다 불리므로 여기서 빠져나가는 것이
    // 중요하다 — 아래 정밀 측정은 강제 레이아웃을 두 번 일으킨다.
    const prevWidths = lastWidths.get(table);
    if (prevWidths && prevWidths.length === widths.length
        && prevWidths.every((w, i) => w === widths[i])) {
        return 0;   // 폭이 그대로 — 다시 잴 것이 없다
    }

    const offsets = measureNaturalOffsets(table, cells, wrap);

    const scope = scopeFor(table);
    const rules = [];
    for (let i = 0; i < cells.length; i++) {
        const th = cells[i];
        if (!th.classList.contains('sticky-col')) continue;
        const cls = columnClassOf(th);
        if (!cls) continue;
        // ⚠️ 소수점을 버리지 않는다. 열마다 반올림하면 그 오차가 누적돼
        //    오른쪽 열일수록 어긋난다 — 지금 고치려는 결함과 같은 모양이 된다.
        rules.push(
            `[${SCOPE_ATTR}="${scope}"] th.${cls},[${SCOPE_ATTR}="${scope}"] td.${cls}` +
            `{left:${offsets[i].toFixed(3)}px !important}`
        );
    }
    lastWidths.set(table, widths);
    if (rules.length === 0) return 0;

    let style = document.getElementById(`${STYLE_ID}-${scope}`);
    if (!style) {
        style = document.createElement('style');
        style.id = `${STYLE_ID}-${scope}`;
        document.head.appendChild(style);
    }
    const css = rules.join('');
    // 같은 내용을 다시 쓰면 브라우저가 스타일을 재계산한다. 리사이즈처럼
    // 연달아 불릴 때 헛일이 된다.
    if (style.textContent !== css) style.textContent = css;
    return rules.length;
}

/**
 * 각 열이 **고정되지 않았다면 있었을 자리**를 잰다 (SAMPL-1-171).
 *
 * ⚠️ 폭을 더해서 구하면 안 된다. `border-collapse: separate`에서 셀의 rect 폭과
 *    실제 자리 이동량이 미세하게 어긋나, 오른쪽 열일수록 누적된다
 *    (실측: 합산으로 계산했을 때 1~3px씩 겹침이 남았다).
 *
 * ⚠️ **시험이 이 선택을 붙잡지 못한다.** 폭 합산으로 되돌리는 변이를 넣어도
 *    E2E 11건이 그대로 통과했다 — 남는 오차가 1px이라 "겹치지 않는다" 기준을
 *    지나간다. 그럼에도 남긴 이유는 **구성상 옳기** 때문이다:
 *    `border-collapse`·`border-spacing`·표의 안쪽 여백을 일일이 더하지 않아도
 *    브라우저가 실제로 배치한 자리를 그대로 읽는다.
 *    0.5px 단위를 단정하는 시험도 써 봤지만 폰트가 정착하는 동안 서브픽셀이
 *    계속 흔들려 실행마다 결과가 달라졌다 — 흔들리는 시험은 두지 않았다.
 *
 * 그래서 고정을 **잠깐 풀고** 실제 자리를 읽는다. 같은 동기 블록 안에서 되돌리므로
 * 중간 상태가 화면에 그려지지 않는다. 비용이 있어(강제 레이아웃 2회) 폭이 달라졌을
 * 때만 부른다.
 *
 * @param {Element} table
 * @param {Array<Element>} cells 헤더 행의 셀들
 * @param {Element} wrap 스크롤 컨테이너 (`.table-wrapper`)
 * @returns {Array<number>} 셀별 자연 위치 (스크롤포트 내용 원점 기준)
 */
function measureNaturalOffsets(table, cells, wrap) {
    table.classList.add(MEASURING_CLASS);
    try {
        // sticky `left`는 **스크롤포트의 안쪽 가장자리**가 기준이다. 컨테이너의 테두리와
        // 현재 스크롤량을 빼야 스크롤 위치와 무관한 값이 나온다.
        const wrapRect = wrap.getBoundingClientRect();
        const borderLeft = parseFloat(getComputedStyle(wrap).borderLeftWidth) || 0;
        const originX = wrapRect.left + borderLeft - wrap.scrollLeft;
        return cells.map(c => c.getBoundingClientRect().left - originX);
    } finally {
        // ⚠️ **반드시 되돌린다.** 예외가 나면 고정이 풀린 채로 남아, 고치려던 결함보다
        //    나쁜 상태(고정 열이 아예 따라 흐르는 목록)가 된다 (독립 리뷰 지적).
        table.classList.remove(MEASURING_CLASS);
    }
}

/**
 * 재는 동안 고정을 푸는 규칙을 한 번 넣는다.
 * `!important`를 쓰는 이유는 페이지별 CSS가 `position: sticky`를 직접 선언하기
 * 때문이다 — 명시도 싸움을 하느니 재는 순간에만 확실히 이기는 편이 낫다.
 */
function injectMeasuringRule() {
    if (document.getElementById(`${STYLE_ID}-measure`)) return;
    const el = document.createElement('style');
    el.id = `${STYLE_ID}-measure`;
    el.textContent =
        `.${MEASURING_CLASS} th.sticky-col,.${MEASURING_CLASS} td.sticky-col` +
        '{position:static !important}';
    document.head.appendChild(el);
}

/**
 * 화면 안의 모든 목록 표에 적용한다.
 * @returns {number} **다시 잰** 표 수 (0이면 폭이 그대로였다는 뜻)
 */
function refreshStickyColumns() {
    let n = 0;
    for (const table of document.querySelectorAll('table.data-table')) {
        if (applyToTable(table) > 0) n++;
    }
    return n;
}

/**
 * 이 시간 동안 폭이 그대로면 멈춘 것으로 본다 (ms).
 *
 * ⚠️ 처음에는 **연속 프레임 수**로 셌는데 부하가 걸리면 새어 나갔다 — 폰트 로드
 *    단계 사이에 3프레임 넘는 틈이 생겨 아직 변할 것이 남았는데 그만뒀다
 *    (실측: 단독 실행은 통과, 5개 병렬에서는 공익직불제 시험이 실패).
 *    프레임이 아니라 시간으로 본다.
 */
const SETTLE_QUIET_MS = 600;
/** 아무리 늦어도 이 시간이면 그만둔다 (ms) */
const SETTLE_TIMEOUT_MS = 5000;
/** 정착 확인 간격 (ms) */
const SETTLE_POLL_MS = 100;

let settling = false;

/**
 * **폭이 멈출 때까지 몇 프레임 따라간다** (SAMPL-1-171).
 *
 * ⚠️ 한 번 재고 마는 구현은 어긋난 채 남는다. 폭은 렌더 뒤에도 계속 변한다 —
 *    웹 폰트가 단계적으로 로드되기 때문이다(실측: 32 → 35.8 → 39.1 → 40).
 *
 * ⚠️ `ResizeObserver`로 헤더 셀을 관찰하는 방법을 먼저 썼는데 **동작하지 않았다.**
 *    `display: table-cell` 요소는 관찰 대상으로 신뢰할 수 없다 — 열 폭을 220px로
 *    강제해도 콜백이 오지 않는 것을 실측했다. 그래서 관찰 대신 따라간다.
 *
 * 스크롤 이벤트에서는 다시 재지 않는다. 정밀 측정이 강제 레이아웃을 두 번
 * 일으켜 **스크롤이 버벅일** 수 있고, 담당자가 호소한 것이 바로 스크롤 중 이상이다.
 */
function scheduleStickyColumns() {
    if (settling) return;
    settling = true;
    const started = Date.now();
    let lastChange = started;
    const tick = () => {
        const now = Date.now();
        if (refreshStickyColumns() > 0) lastChange = now;
        if (now - lastChange > SETTLE_QUIET_MS || now - started > SETTLE_TIMEOUT_MS) {
            settling = false;
            return;
        }
        // ⚠️ `requestAnimationFrame`으로 돌면 **부하가 걸릴 때 굶는다.** 프레임이
        //    드물어지면 아직 변할 것이 남았는데도 "조용하다"고 판단해 그만뒀다
        //    (실측: 단독 실행은 통과, 5개 병렬에서는 어긋난 채 멈췄다).
        //    타이머는 그리기 부하와 무관하게 온다. 10Hz로 몇 초 재는 비용은 무시할 만하다.
        setTimeout(tick, SETTLE_POLL_MS);
    };
    // 첫 번째는 곧바로 — 그려지기 전에 맞춰 두면 어긋난 화면이 보이지 않는다
    requestAnimationFrame(tick);
}

/**
 * 폭이 달라질 수 있는 계기를 붙인다.
 *
 * - 창 크기 변경
 * - 표의 클래스 변경 — 공익직불제 모드 전환이 `gongik-on`을 토글해 열이 나타난다
 * - 표 크기 변경 — 뷰 전환으로 숨어 있던 표가 드러나는 순간을 잡는다
 *   (그 전에는 폭이 0이라 계산할 수 없다)
 */
function installStickyColumns() {
    injectMeasuringRule();
    window.addEventListener('resize', scheduleStickyColumns);

    // ⚠️ **스크롤할 때는 다시 재지 않는다.** 한때 scroll 이벤트에서 동기로 다시
    //    쟀는데, 아래 정밀 측정이 강제 레이아웃을 두 번 일으켜 **스크롤이 버벅일**
    //    위험이 있었다 — 담당자가 호소한 것이 바로 스크롤 중 이상이라 그 대가는
    //    치를 수 없다. 대신 폭이 달라지는 순간을 관찰해 미리 맞춰 둔다.
    //
    //    폭은 렌더 뒤에도 한동안 변한다(웹 폰트가 단계적으로 로드된다 — 실측:
    //    32 → 35.8 → 39.1 → 40). 헤더 셀 관찰자가 그 단계마다 다시 재
    //    435px → 483.7px로 수렴하는 것을 확인했다.
    if (document.fonts?.ready) document.fonts.ready.then(scheduleStickyColumns).catch(() => {});

    const tables = document.querySelectorAll('table.data-table');
    if (typeof MutationObserver === 'function') {
        const mo = new MutationObserver(scheduleStickyColumns);
        for (const t of tables) mo.observe(t, { attributes: true, attributeFilter: ['class'] });
    }
    // 표 전체의 크기 변화 — 뷰 전환으로 숨어 있던 표가 드러나는 순간을 잡는다
    // (그 전에는 폭이 0이라 계산할 수 없다). 열 사이의 재배분은 이것으로 못 잡으므로
    // 위 `scheduleStickyColumns`가 몇 프레임 따라가며 마무리한다.
    if (typeof ResizeObserver === 'function') {
        const ro = new ResizeObserver(scheduleStickyColumns);
        for (const t of tables) ro.observe(t);
    }
    scheduleStickyColumns();
}

if (typeof window !== 'undefined') {
    window.refreshStickyColumns = refreshStickyColumns;
    window.scheduleStickyColumns = scheduleStickyColumns;
    window.installStickyColumns = installStickyColumns;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', installStickyColumns);
    } else {
        installStickyColumns();
    }
}

// Node (단위 테스트)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { refreshStickyColumns, scheduleStickyColumns, installStickyColumns };
}
