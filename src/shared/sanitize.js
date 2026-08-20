// @ts-check
// ========================================
// 공통 XSS 방지 모듈
// DOMPurify를 사용한 HTML 새니타이징
// ========================================

/** DOMPurify 부재 경고를 한 번만 찍기 위한 플래그 (호출마다 찍으면 콘솔이 넘친다) */
let missingDOMPurifyWarned = false;

/**
 * HTML 문자열을 새니타이즈하여 XSS 공격 방지
 * @param {string} html - 새니타이즈할 HTML 문자열
 * @returns {string} 새니타이즈된 HTML 문자열
 */
function sanitizeHTML(html) {
    if (typeof DOMPurify !== 'undefined') {
        const config = {
            ALLOWED_TAGS: [
                'div', 'span', 'p', 'br', 'hr',
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li', 'dl', 'dt', 'dd',
                'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
                'a', 'img', 'input', 'select', 'option', 'textarea', 'button', 'label',
                'fieldset', 'legend',
                'strong', 'em', 'b', 'i', 'u', 's', 'small', 'mark', 'sub', 'sup',
                'pre', 'code', 'blockquote', 'cite', 'abbr',
                'header', 'footer', 'nav', 'main', 'section', 'article', 'aside',
                'figure', 'figcaption', 'details', 'summary'
            ],
            ALLOWED_ATTR: [
                'class', 'id', 'title', 'alt', 'src', 'href', 'target', 'rel',
                'type', 'name', 'value', 'placeholder', 'disabled', 'readonly', 'checked', 'selected',
                'for', 'data-*', 'aria-*', 'role',
                'colspan', 'rowspan', 'width', 'height',
                'min', 'max', 'step', 'pattern', 'required', 'maxlength', 'minlength',
                'rows', 'cols', 'multiple', 'accept'
            ],
            // ALLOWED_ATTR 화이트리스트로 on* 이벤트는 이미 차단됨. 방어 보강 차원에서 위험 속성 명시 금지.
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'oninput', 'onsubmit', 'formaction'],
            ALLOW_DATA_ATTR: true
        };
        return DOMPurify.sanitize(html, config);
    }
    // ⚠️ DOMPurify가 없으면 **마크업 전체가 문자로 보인다** — 화면이 깨진다.
    //
    //    SAMPL-2-34에서 13개 entry 전부에 `import DOMPurify`를 넣어 이 경로는
    //    정상 빌드에서 도달하지 않는다. 그래도 폴백을 남기는 이유는 두 가지다:
    //    (1) 새 페이지를 만들며 import를 빠뜨릴 수 있고
    //    (2) 화면을 통째로 죽이는 것(throw)보다 깨진 채로 보이는 편이 낫다.
    //
    //    다만 **조용히 넘어가지는 않는다.** 예전에는 아무 신호 없이 이스케이프만 해서
    //    "왜 화면에 태그가 보이지" 하는 원인 불명의 붕괴가 됐다.
    //    호출마다 찍으면 콘솔이 넘치므로 한 번만 알린다.
    if (!missingDOMPurifyWarned) {
        missingDOMPurifyWarned = true;
        (window.logger?.error || console.error)(
            '[sanitize] DOMPurify가 없어 마크업을 이스케이프합니다 — 화면에 태그가 글자로 보입니다. ' +
            // ⚠️ 이 문구에 `window.` + `DOMPurify` + `=`를 **붙여 쓰지 말 것.**
            //    `check-docs-assets.js`의 커버리지 검사가 그 패턴으로 대입문을 찾는데,
            //    이 문자열이 번들에 섞이면 검사가 **모든 페이지에서 항상 통과**한다(실측).
            '이 페이지의 entry에서 dompurify를 import하고 전역에 대입했는지 확인하세요 (SAMPL-2-34).'
        );
    }
    return escapeHTML(html);
}

/**
 * 텍스트를 HTML 엔티티로 이스케이프 — **요소 내용 전용**이다.
 *
 * ⚠️ **속성 위치에는 쓰지 말 것.** `escapeAttr`를 쓴다 (SAMPL-2-32).
 *    이 구현은 `textContent → innerHTML`이라 브라우저가 `&`·`<`·`>`만 변환하고
 *    **따옴표는 그대로 통과시킨다.** 그래서 `value="${escapeHTML(v)}"` 형태에
 *    `" onfocus=alert(1) x="` 같은 값이 들어오면 속성을 탈출해 임의 속성이 주입된다.
 *    실측: `escapeHTML('a"b<c')` → `a"b&lt;c`
 *
 * 따옴표까지 변환하도록 이 함수를 고치는 것은 **택하지 않았다.** 호출부 63곳 중
 * 25곳가량이 결과를 `textContent`·`dataset`에 그대로 넣는데(예: `tdName.textContent = safeName`),
 * 거기서는 엔티티가 문자 그대로 보인다. 지금도 `&`·`<`가 그렇게 보이는 버그가 있고
 * (`김&철수` → `김&amp;철수`), 따옴표를 추가하면 그 버그가 비고·주소처럼
 * 따옴표가 흔한 칸으로 번진다. 그 이중 이스케이프는 별 티켓이다 → **SAMPL-2-33**.
 *
 * @param {string|null|undefined} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
function escapeHTML(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * HTML 속성 값 이스케이프 — **속성에는 필수, 텍스트에도 안전하다.**
 *
 * `escapeHTML`과 달리 따옴표(`"`, `'`)까지 변환하므로 속성을 탈출할 수 없다.
 * `title="..."`, `value="..."`, `data-*="..."`처럼 값이 속성 안에 들어가는 모든 자리에 쓴다.
 *
 * ```js
 * html += `<input value="${escapeAttr(userInput)}">`;   // ✅
 * html += `<input value="${escapeHTML(userInput)}">`;   // ❌ 속성 탈출 가능
 * ```
 *
 * ⚠️ **텍스트 위치에서 이 함수를 `escapeHTML`로 "되돌리지" 말 것.**
 *    `&quot;`는 텍스트 내용에서 `"`로 디코드되므로 표시가 달라지지 않는다 —
 *    즉 `escapeAttr`는 `escapeHTML`의 상위집합이고 두 위치 모두에서 안전하다.
 *    이름만 보고 "여긴 속성이 아니니 escapeHTML로 바꾸자"고 하면 취약점이 돌아온다.
 *
 * ⚠️ **인용부호로 감싼 속성**을 전제한다. `<div class=${v}>`처럼 인용부호 없이 쓰면
 *    공백만으로도 속성이 갈라지므로 이 함수로 막을 수 없다. 속성은 항상 `"`로 감쌀 것.
 *
 * @param {string|number|null|undefined} value - 속성에 넣을 값
 * @returns {string} 이스케이프된 값
 */
function escapeAttr(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * 안전하게 innerHTML 설정
 * @param {HTMLElement|null} element - 대상 요소
 * @param {string} html - 설정할 HTML
 */
function setInnerHTML(element, html) {
    if (element) {
        element.innerHTML = sanitizeHTML(html);
    }
}

/**
 * 빈 콘텐츠로 요소 초기화 (새니타이징 불필요)
 * @param {HTMLElement|null} element - 대상 요소
 */
function clearElement(element) {
    if (element) {
        element.innerHTML = '';
    }
}

/**
 * 사용자 입력값을 안전하게 이스케이프 (텍스트로 사용할 때)
 * @param {string} value - 이스케이프할 값
 * @returns {string} 이스케이프된 값
 */
function safeText(value) {
    return escapeHTML(value);
}

/**
 * 템플릿 리터럴 내 사용자 데이터를 안전하게 처리
 * @param {string} template - 템플릿 문자열
 * @param {Object} data - 치환할 데이터
 * @returns {string} 처리된 문자열
 */
function safeTemplate(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
        const safeValue = escapeHTML(value);
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), safeValue);
    }
    return result;
}

/**
 * CSV Injection 방지: 엑셀 셀 값에서 수식 실행을 차단
 * `=`, `+`, `-`, `@`, 탭, 캐리지리턴으로 시작하는 값 앞에 작은따옴표(') 추가
 * (백틱으로 감싼 이유: 맨 `@,`가 JSDoc 태그로 파싱돼 TS1003이 난다)
 * @param {*} value - 셀 값
 * @returns {*} 새니타이즈된 값 (문자열이 아니면 그대로 반환)
 */
function sanitizeExcelCell(value) {
    if (typeof value !== 'string') return value;
    if (value.length > 1 && /^[=+\-@\t\r;|]/.test(value)) return "'" + value;
    return value;
}

/**
 * 엑셀 내보내기용 객체 배열의 모든 문자열 값을 새니타이즈 (json_to_sheet용)
 * @param {Array<Object>} data - json_to_sheet에 전달할 데이터 배열
 * @returns {Array<Object>} 새니타이즈된 데이터 배열
 */
function sanitizeExcelData(data) {
    return data.map(row => {
        const sanitized = {};
        for (const [key, val] of Object.entries(row)) {
            sanitized[key] = sanitizeExcelCell(val);
        }
        return sanitized;
    });
}

/**
 * 엑셀 내보내기용 2차원 배열의 모든 문자열 값을 새니타이즈 (aoa_to_sheet용)
 * @param {Array<Array>} aoa - aoa_to_sheet에 전달할 2차원 배열
 * @returns {Array<Array>} 새니타이즈된 2차원 배열
 */
function sanitizeExcelAoa(aoa) {
    return aoa.map(row => Array.isArray(row) ? row.map(cell => sanitizeExcelCell(cell)) : row);
}

// 전역으로 내보내기
window.sanitizeHTML = sanitizeHTML;
window.escapeHTML = escapeHTML;
window.escapeAttr = escapeAttr;
window.setInnerHTML = setInnerHTML;
window.clearElement = clearElement;
window.safeText = safeText;
window.safeTemplate = safeTemplate;
window.sanitizeExcelCell = sanitizeExcelCell;
window.sanitizeExcelData = sanitizeExcelData;
window.sanitizeExcelAoa = sanitizeExcelAoa;
