// @ts-check
// SAMPL-2-32: 속성 위치 XSS — 사용자 입력이 속성을 탈출하지 못하는지
//
// `escapeHTML`은 `textContent → innerHTML` 방식이라 **따옴표를 변환하지 않는다.**
// 그래서 `value="${escapeHTML(v)}"` 형태의 자리마다 속성 탈출이 가능했다.
// 실측으로 `<input>`에 `onfocus`가 주입되는 것을 확인했고, 속성 전용 `escapeAttr`로 막았다.
//
// ⚠️ **요소 수를 세는 방식으로는 잡히지 않는다.** 탈출은 새 태그를 만드는 대신
//    기존 요소에 **속성을 붙인다**. 그래서 이 스펙은 항상 `attributes` 목록을 본다
//    (SAMPL-1-158에서 img 개수만 세다 놓친 선례가 있다).
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const EXPECTED_VERSION = require('../../package.json').version;

/** 속성 탈출을 노리는 페이로드 모음 — 한 종류만 쓰면 그 종류만 막힌다 */
const PAYLOADS = [
    '" onfocus=alert(1) x="',
    "' onfocus=alert(1) x='",
    '" onmouseover="window.__PWNED=1',
    '"><img src=x onerror=alert(1)>',
];

async function open(page, path) {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const res = await page.goto(path);
    expect(res && res.status(), `docs${path} 없음 — \`npm run build\` 먼저`).toBeLessThan(400);
    await page.waitForFunction(() => !!window.escapeAttr, { timeout: 15000 });
    expect(
        await page.evaluate(() => /** @type {any} */ (window).APP_VERSION),
        'docs/의 APP_VERSION이 package.json과 다르다 — ' +
        '(1) `npm run build`를 잊었거나 (2) 다른 프로젝트의 docs/를 검증하고 있다'
    ).toBe(EXPECTED_VERSION);
}

test.describe('속성 위치 XSS 방어 (SAMPL-2-32)', () => {
    test('escapeAttr가 어떤 페이로드로도 속성을 늘리지 못한다', async ({ page }) => {
        await open(page, '/soil/');

        for (const payload of PAYLOADS) {
            const attrs = await page.evaluate((p) => {
                const d = document.createElement('div');
                d.innerHTML = `<input value="${/** @type {any} */ (window).escapeAttr(p)}">`;
                const el = d.querySelector('input');
                return el ? [...el.attributes].map((a) => a.name) : null;
            }, payload);
            expect(attrs, `페이로드 '${payload}'에서 속성이 주입됐다: ${JSON.stringify(attrs)}`)
                .toEqual(['value']);
        }
    });

    // 🚨 대조군. 옛 함수로는 실제로 뚫린다는 것을 테스트가 스스로 증명한다 —
    //    이게 없으면 위 테스트가 "원래 안전했는데 괜히 고쳤다"와 구분되지 않는다.
    test('옛 escapeHTML로는 실제로 뚫린다 (회귀 대조군)', async ({ page }) => {
        await open(page, '/soil/');
        const attrs = await page.evaluate(() => {
            const d = document.createElement('div');
            d.innerHTML = `<input value="${/** @type {any} */ (window).escapeHTML('" onfocus=alert(1) x="')}">`;
            const el = d.querySelector('input');
            return el ? [...el.attributes].map((a) => a.name) : null;
        });
        expect(
            attrs,
            'escapeHTML이 따옴표를 막는다면 이 티켓의 전제가 틀렸다. ' +
            '⚠️ SAMPL-2-33에서 escapeHTML을 고치면 이 테스트가 **개선 때문에** 실패한다 — ' +
            '그때는 이 대조군을 지울 것(결함이 아니다).'
        ).toContain('onfocus');
    });

    // 🚨 여기가 **실제로 노출됐던 자리**다.
    //    소일·농약·라벨 화면의 속성 싱크는 모두 `sanitizeHTML`(DOMPurify)을 거치므로
    //    화이트리스트가 `on*`을 걷어낸다. 반면 엑셀 가져오기 컬럼 매핑 UI는
    //    `row.innerHTML = \`...\`` 로 **DOMPurify를 거치지 않고** 엑셀 헤더·셀값을
    //    `title="..."`에 넣었다. 값의 출처가 외부 .xlsx라 이 경로가 진짜 문제였다.
    test('엑셀 컬럼 매핑 UI에서 헤더·셀값이 속성을 탈출하지 못한다', async ({ page }) => {
        await open(page, '/soil/');
        await page.waitForFunction(() => !!window.ExcelImportManager, { timeout: 15000 });

        const result = await page.evaluate((payload) => {
            const host = document.createElement('div');
            document.body.appendChild(host);

            // 실제 템플릿을 그대로 통과시킨다 (DOMPurify 없는 경로)
            const M = /** @type {any} */ (window).ExcelImportManager;
            const inst = Object.create(M.prototype);
            inst._excelHeaders = [payload];
            inst._excelData = [[payload]];
            inst._columnMapping = {};
            inst.config = { appFields: [{ key: 'name', label: '성명' }] };
            inst._els = { mappingArea: host };
            inst._updateMappingProgress = () => {};
            inst._recomputePreview = () => {};

            let err = null;
            try { inst._renderColumnMapping(); } catch (e) { err = String(e); }

            const bad = [];
            for (const el of host.querySelectorAll('*')) {
                for (const a of el.attributes) {
                    if (/^on/i.test(a.name) || a.name === 'x') bad.push(el.tagName + '/' + a.name);
                }
            }
            const titled = host.querySelector('[title]');
            return { err, rendered: host.innerHTML.length > 0, bad,
                     title: titled ? titled.getAttribute('title') : null };
        }, PAYLOADS[0]);

        expect(result.err, `렌더가 실패했다: ${result.err}`).toBeNull();
        expect(result.rendered, '아무것도 렌더되지 않아 검증이 무의미하다').toBe(true);
        expect(result.bad, `속성이 주입됐다: ${JSON.stringify(result.bad)}`).toEqual([]);
        // 값이 온전히 살아 있어야 한다 — 막느라 표시를 깨면 안 된다
        expect(result.title).toBe(PAYLOADS[0]);
    });

    // 🚨 코드 리뷰가 내 grep이 놓친 자리를 찾았다 — **escape가 아예 없는** 자리는
    //    `attr="${...escape...}"` 패턴으로 안 잡힌다. 라벨 인쇄의 엑셀 컬럼명이 그랬다.
    //    값은 외부 .xlsx에서 오고, 텍스트 위치라 `<b>`·`<img>`가 살아남았다.
    //
    // ⚠️ 이 테스트는 **실제 label-app.js를 거쳐야** 의미가 있다.
    //    처음엔 템플릿 모양만 테스트 안에서 재현했는데, 소스의 escape를 떼는 변이가
    //    그대로 통과했다 — 테스트가 소스를 전혀 건드리지 않았기 때문이다.
    //    지금은 `localStorage.labelPrintData` 진입점으로 실제 렌더를 태운다.
    test('라벨 인쇄 컬럼 선택에서 엑셀 컬럼명이 태그로 해석되지 않는다', async ({ page }) => {
        const EVIL = '<img src=x onerror=alert(1)><b>굵게';

        // ⚠️ 라벨 인쇄 화면은 `constants.js`를 로드하지 않아 `APP_VERSION`이 없다.
        //    그런데 형제 프로젝트에도 `/label-print/`가 **둘 다 존재**하므로 지문은 필요하다.
        //    → 같은 서버임을 `/soil/`에서 확인한 뒤 이동한다.
        await open(page, '/soil/');

        await page.addInitScript((evil) => {
            localStorage.setItem('labelPrintData', JSON.stringify([
                { [evil]: '값1', 성명: '홍길동', 우편번호: '12345' },
            ]));
        }, EVIL);

        const res = await page.goto('/label-print/');
        expect(res && res.status(), 'docs/label-print/ 없음').toBeLessThan(400);

        // 실제 렌더가 끝나기를 기다린다 (createFieldMappings가 채운다)
        const opts = page.locator('#labelFieldMapping select option');
        await expect(opts.first()).toBeAttached({ timeout: 15000 });

        const out = await page.evaluate((evil) => {
            const host = document.getElementById('labelFieldMapping');
            if (!host) return null;
            const match = [...host.querySelectorAll('option')]
                .find((o) => (o.getAttribute('value') || '').includes('img'));
            return {
                rendered: host.querySelectorAll('option').length,
                survivingTags: [...host.querySelectorAll('img, b')].map((e) => e.tagName),
                text: match ? match.textContent.trim() : null,
                value: match ? match.getAttribute('value') : null,
                evil,
            };
        }, EVIL);

        if (!out) throw new Error('#labelFieldMapping을 찾지 못했다');
        expect(out.rendered, '옵션이 렌더되지 않아 검증이 무의미하다').toBeGreaterThan(1);
        // 태그가 살아남으면 항목이 비어 보이고, img는 외부 요청까지 낸다
        expect(out.survivingTags, `태그가 살아남았다: ${JSON.stringify(out.survivingTags)}`).toEqual([]);
        expect(out.text, '컬럼명이 태그로 먹혀 텍스트가 사라졌다').toContain('굵게');
        expect(out.text).toContain('<img');
        expect(out.value, '속성 값이 잘렸다').toBe(EVIL);
    });

    // 🚨 적대적 검증이 찾은 것. 미리보기 표(`createDataTable`)가 엑셀 헤더·셀값을
    //    **무이스케이프**로 innerHTML에 넣었다. 실측으로 <img> 2개가 주입됐고
    //    헤더 텍스트가 사라졌다. DOMPurify가 실행만 막아준 상태였다 —
    //    이 스펙이 스스로 적은 원칙("DOMPurify에 의존하지 않는다")을 위반하고 있었다.
    test('미리보기 표에서 엑셀 헤더·셀값이 태그로 해석되지 않는다', async ({ page }) => {
        const EVIL_COL = '가<b>나';
        const EVIL_VAL = '<img src=x onerror=alert(1)>값';

        await open(page, '/soil/');
        await page.addInitScript(([c, v]) => {
            localStorage.setItem('labelPrintData', JSON.stringify([
                { [c]: v, 성명: '홍길동', 우편번호: '12345' },
            ]));
        }, [EVIL_COL, EVIL_VAL]);

        const res = await page.goto('/label-print/');
        expect(res && res.status()).toBeLessThan(400);
        await expect(page.locator('#labelDataTable td').first()).toBeAttached({ timeout: 15000 });

        const out = await page.evaluate(() => {
            const host = document.getElementById('labelDataTable');
            if (!host) return null;
            return {
                tags: [...host.querySelectorAll('img, b')].map((e) => e.tagName),
                headText: [...host.querySelectorAll('th')].map((e) => e.textContent.trim()),
                cellText: [...host.querySelectorAll('td')].map((e) => e.textContent.trim()),
            };
        });
        if (!out) throw new Error('#labelDataTable을 찾지 못했다');
        expect(out.tags, `태그가 주입됐다: ${JSON.stringify(out.tags)}`).toEqual([]);
        // 헤더·셀 문자열이 **문자 그대로** 남아야 한다 (태그로 먹히면 사라진다)
        expect(out.headText.join('|'), '헤더가 태그로 먹혔다').toContain('가<b>나');
        expect(out.cellText.join('|'), '셀값이 태그로 먹혔다').toContain('<img');
    });

    // 🚨 같은 계열이지만 피해가 더 크다 — **실제 인쇄물**이다.
    //    성명·주소·우편번호는 전부 엑셀 출처이고, 담당자는 인쇄한 뒤에야 안다.
    test('인쇄되는 라벨 본문이 태그로 해석되지 않는다', async ({ page }) => {
        const EVIL_NAME = '홍<b>길동';

        await open(page, '/soil/');
        await page.addInitScript((n) => {
            localStorage.setItem('labelPrintData', JSON.stringify([
                { 성명: n, 도로명주소: '봉화군 <i>문단리</i> 224', 우편번호: '12345' },
            ]));
        }, EVIL_NAME);

        const res = await page.goto('/label-print/');
        expect(res && res.status()).toBeLessThan(400);
        await expect(page.locator('#labelDataTable td').first()).toBeAttached({ timeout: 15000 });

        // 라벨 생성 버튼을 눌러 실제 인쇄 시트를 만든다
        const genBtn = page.locator('#btnGenerateLabels').first();
        await genBtn.click();
        await expect(page.locator('.label-name-line').first()).toBeAttached({ timeout: 15000 });

        const out = await page.evaluate(() => ({
            tags: [...document.querySelectorAll('.label-item b, .label-item i')].map((e) => e.tagName),
            name: (document.querySelector('.label-name-line') || {}).textContent || '',
            addr: (document.querySelector('.label-address-line') || {}).textContent || '',
        }));
        expect(out.tags, `인쇄물에 태그가 살아남았다: ${JSON.stringify(out.tags)}`).toEqual([]);
        expect(out.name, '성명이 태그로 먹혀 글자가 사라졌다').toContain('홍<b>길동');
        expect(out.addr).toContain('<i>');
    });

    // 🚨 코드 리뷰가 찾은 두 번째 누락. 하위필지 선택 `<option value="${opt.value}">`이
    //    escape 없이 놓여 있었다. 하위필지는 문자열(구 데이터)과 객체(신 데이터)가 섞여 있고
    //    (`soil-script.js`가 곳곳에서 `typeof === 'string'`으로 분기한다),
    //    문자열인 경우 값이 사용자가 적은 주소다. 따옴표가 있으면 **조용히 잘렸다**.
    //    공격이 없어도 데이터가 깨지는 쪽이 더 실질적인 피해다.
    test('하위필지 선택에서 따옴표가 든 주소가 잘리지 않는다', async ({ page }) => {
        const ADDR = '문단리 224" onfocus=alert(1) x="';
        await open(page, '/soil/');
        await page.waitForFunction(() => !!window.soilManager, { timeout: 15000 });

        const out = await page.evaluate((addr) => {
            const mgr = /** @type {any} */ (window).soilManager;
            if (typeof mgr.getSubLotOptions !== 'function' || !mgr.cropAreaList) {
                return { skipped: 'getSubLotOptions 또는 cropAreaList 없음' };
            }
            // 구 데이터 형태: 하위필지가 **문자열**
            mgr.parcels = [{ id: 'p1', lotAddress: 'A', subLots: [addr], crops: [] }];
            mgr.currentParcelIdForCrop = 'p1';
            mgr.tempCropAreas = [{ name: '고추', area: '100', code: '', subLotTarget: 'all' }];
            mgr.renderCropAreaModal();

            const host = mgr.cropAreaList;
            const opts = [...host.querySelectorAll('option')];
            const target = opts.find((o) => (o.getAttribute('value') || '').includes('문단리'));
            const bad = [];
            for (const el of host.querySelectorAll('*')) {
                for (const a of el.attributes) {
                    if (/^on/i.test(a.name) || a.name === 'x') bad.push(el.tagName + '/' + a.name);
                }
            }
            return { optCount: opts.length, bad, value: target ? target.getAttribute('value') : null };
        }, ADDR);

        expect(out.skipped, `건너뜀: ${out.skipped}`).toBeUndefined();
        expect(out.optCount, '하위필지 옵션이 렌더되지 않아 검증이 무의미하다').toBeGreaterThan(1);
        expect(out.bad, `속성이 주입됐다: ${JSON.stringify(out.bad)}`).toEqual([]);
        // 🚨 핵심: 따옴표에서 잘리면 담당자가 고른 하위필지가 딴 것이 된다
        expect(out.value, '값이 따옴표에서 잘렸다').toBe(ADDR);
    });

    // DOMPurify가 걷어내 준다는 사실에 의존하지 않는다는 것을 명시한다.
    // ⚠️ 정확히 적는다(독립 리뷰 지적): DOMPurify는 npm 번들이고 각 entry에서 대입하므로
    //    "로드 실패"는 사실상 불가하며, 없으면 sanitizeHTML이 **HTML 전체를 이스케이프**해
    //    화면에 태그가 문자로 보인다 — 조용히가 아니라 시끄럽게 실패한다.
    //    이 테스트가 대비하는 것은 **설정 변경**이다 (ALLOWED_ATTR·FORBID_ATTR 완화).
    test('DOMPurify를 거치는 경로도 escapeAttr로 자체 방어한다', async ({ page }) => {
        await open(page, '/soil/');
        const leaked = await page.evaluate((payload) => {
            const d = document.createElement('div');
            // sanitizeHTML을 **거치지 않고** 소일 템플릿과 같은 형태만 재현한다
            d.innerHTML = `<input class="parcel-note-input" value="${/** @type {any} */ (window).escapeAttr(payload)}">`;
            const el = d.querySelector('input');
            return el ? [...el.attributes].map((a) => a.name) : null;
        }, PAYLOADS[0]);
        expect(leaked, `DOMPurify 없이도 안전해야 한다: ${JSON.stringify(leaked)}`)
            .toEqual(['class', 'value']);
    });
});
