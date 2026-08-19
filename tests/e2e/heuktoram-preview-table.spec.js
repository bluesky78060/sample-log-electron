// @ts-check
// SAMPL-1-158: 흙토람 결과 가져오기 미리보기 — 가로 표
//
// 예전에는 셀 하나가 한 줄이라 분석항목 10개 기준 **시료 5건이면 상한 50이 다 찼다.**
// 6건째부터 "… (전체 N셀)"로 접혀 확인이 안 됐다. 이 스펙의 핵심은 그 지점이다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const EXPECTED_VERSION = require('../../package.json').version;

const YEAR = '2026';
const SAMPLE_COUNT = 8;   // 옛 상한(5건)을 넘겨야 회귀를 잡는다

/** 토양 접수 대장을 심는다 — 흙토람은 여기서 시료 목록을 읽는다 */
function seedLogs(count) {
    const logs = [];
    for (let i = 1; i <= count; i++) {
        logs.push({
            id: 'log-' + i,
            receptionNumber: String(i),
            name: '민원인' + i,
            date: '2026-08-01',
            parcels: [],
        });
    }
    return logs;
}

async function openHeuktoram(page) {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.addInitScript(
        ([year, logs]) => {
            localStorage.setItem(`soilSampleLogs_${year}`, JSON.stringify(logs));
            localStorage.setItem('heuktoram_year', year);
        },
        [YEAR, seedLogs(SAMPLE_COUNT)]
    );
    const res = await page.goto('/heuktoram/');
    expect(res && res.status(), 'docs/heuktoram/ 없음 — `npm run build` 먼저').toBeLessThan(400);
    // 형제 프로젝트의 docs/를 검증하지 않도록 지문을 본다 (SAMPL-1-157에서 실제로 겪었다)
    await page.waitForFunction(() => !!window.PreviewTable, { timeout: 15000 });
    expect(
        await page.evaluate(() => /** @type {any} */ (window).APP_VERSION),
        '다른 프로젝트의 docs/를 검증하고 있다'
    ).toBe(EXPECTED_VERSION);
}

/** 붙여넣기 모드로 TSV를 넣고 자동 매핑까지 */
async function paste(page, tsv) {
    await page.locator('#importResultBtn').click();
    await expect(page.locator('#resultImporterModal')).not.toHaveClass(/hidden/);
    await page.locator('input[name="importerMode"][value="paste"]').check();
    await page.locator('#importerTextarea').fill(tsv);
    await page.locator('#autoMapImporterBtn').click();
}

/** 시료 N건 × 항목 M개짜리 TSV */
function tsv(count) {
    const head = '시료번호\tpH\t유기물\t유효인산\t칼륨\t칼슘\t마그네슘\t규산\tEC';
    const lines = [head];
    for (let i = 1; i <= count; i++) {
        lines.push([i, (5 + i * 0.1).toFixed(1), 20 + i, 100 + i, 0.4, 4.2, 1.05, 130, 0.25].join('\t'));
    }
    return lines.join('\n');
}

const TABLE = '#importerPreviewList table.importer-pv-table';
const BODY_ROWS = `${TABLE} tbody tr`;

test.describe('흙토람 미리보기 표 (SAMPL-1-158)', () => {
    // 🚨 이 티켓의 존재 이유. 셀 기준 상한이었다면 5건에서 잘렸다.
    test('시료 8건이 전부 보인다 — 옛 상한(셀 50)이라면 5건에서 잘렸다', async ({ page }) => {
        await openHeuktoram(page);
        await paste(page, tsv(SAMPLE_COUNT));

        await expect(page.locator(TABLE), '표가 그려지지 않았다').toBeVisible();
        await expect(page.locator(BODY_ROWS)).toHaveCount(SAMPLE_COUNT);

        // 잘렸다는 안내가 없어야 한다
        await expect(page.locator('#importerPreviewList .importer-preview-overflow')).toHaveCount(0);
    });

    // 🚨 적대적 검증이 실측으로 잡은 것.
    //    `.importer-pv-scroll`에 `overflow-x:auto`를 주면 CSS 규격상 `overflow-y`가
    //    `visible` → `auto`로 승격되어 **그 요소가 sticky의 기준 스크롤포트**가 된다.
    //    그런데 높이 제한이 없어 스스로는 스크롤되지 않고, 실제로 스크롤되는 것은
    //    바깥 `.importer-preview-list`(max-height 260px)다. 결과: 헤더가 위로 밀려 사라진다.
    //    행 상한을 5 → 50으로 올린 이 티켓에서 이건 목적 자체를 무너뜨린다.
    test('행을 스크롤해도 헤더와 시료번호 열이 남는다', async ({ page }) => {
        await openHeuktoram(page);
        await paste(page, tsv(SAMPLE_COUNT));

        const m = await page.evaluate(() => {
            const outer = document.querySelector('.importer-preview-list');
            const inner = document.querySelector('.importer-pv-scroll');
            const th = document.querySelector('.importer-pv-table thead th');
            if (!outer || !inner || !th) return null;

            const canScroll = (el) => el.scrollHeight - el.clientHeight > 4;
            // 세로로 실제 움직이는 요소가 sticky의 기준이어야 한다.
            // 바깥이 움직이면 헤더는 안쪽에 붙은 채 통째로 밀려 사라진다.
            const scroller = { outer: canScroll(outer), inner: canScroll(inner) };

            inner.scrollTop = inner.scrollHeight;
            return {
                scroller,
                innerTop: inner.getBoundingClientRect().top,
                headerTop: th.getBoundingClientRect().top,
                moved: inner.scrollTop > 0,
            };
        });
        if (!m) throw new Error('표나 스크롤 상자를 찾지 못했다');

        expect(m.scroller.inner, '표 상자가 세로로 스크롤되지 않는다').toBe(true);
        expect(
            m.scroller.outer,
            '바깥 상자가 세로로 스크롤된다 — 그러면 sticky 헤더가 통째로 밀려 사라진다'
        ).toBe(false);
        expect(m.moved, '스크롤이 실제로 일어나지 않아 검증이 무의미하다').toBe(true);
        expect(
            Math.abs(m.headerTop - m.innerTop),
            `헤더가 붙지 않고 ${Math.round(m.innerTop - m.headerTop)}px 밀려 올라갔다`
        ).toBeLessThanOrEqual(1);
    });

    test('시료 한 건이 한 줄, 분석항목은 가로 열이다', async ({ page }) => {
        await openHeuktoram(page);
        await paste(page, tsv(3));

        const headers = await page.locator(`${TABLE} thead th`).allInnerTexts();
        expect(headers[0].trim()).toBe('시료번호');
        expect(headers.length, '분석항목이 열로 서지 않았다').toBeGreaterThan(3);

        // 첫 열(행 헤더)이 시료번호다
        const keys = await page.locator(`${BODY_ROWS} th`).allInnerTexts();
        expect(keys.map((s) => s.trim()).sort()).toEqual(['1', '2', '3']);
    });

    test('셀 값이 해당 시료·항목 자리에 들어간다', async ({ page }) => {
        await openHeuktoram(page);
        await paste(page, tsv(3));

        const headers = (await page.locator(`${TABLE} thead th`).allInnerTexts()).map((s) => s.trim());
        const phIdx = headers.findIndex((h) => h.includes('pH'));
        expect(phIdx, 'pH 열을 찾지 못했다').toBeGreaterThan(0);

        // 시료 2의 pH는 5.2 (tsv 생성 규칙: 5 + i*0.1)
        const row2 = page.locator(BODY_ROWS).filter({ has: page.locator('th', { hasText: /^2$/ }) });
        // th가 0번이므로 td 인덱스는 phIdx-1
        await expect(row2.locator('td').nth(phIdx - 1)).toHaveText('5.2');
    });

    // 🚨 적대적 검증·코드 리뷰가 함께 지적한 fail-open.
    //    모듈이 없으면 "저장될 항목이 없습니다"가 뜨는데 버튼은 살아서 N셀을 썼다.
    //    화면과 동작이 정반대인 상태로 미리보기 없이 데이터가 저장된다.
    test('미리보기 모듈이 없으면 저장을 막는다 — 조용히 넘어가지 않는다', async ({ page }) => {
        await openHeuktoram(page);
        await page.evaluate(() => { delete (/** @type {any} */ (window)).PreviewTable; });
        await paste(page, tsv(3));

        await expect(page.locator('#importerPreviewList')).toContainText('불러오지 못했습니다');
        await expect(
            page.locator('#saveResultImporterBtn'),
            '미리보기가 없는데 저장 버튼이 살아 있다'
        ).toBeDisabled();
    });

    test('시료번호가 중복되면 요약줄에서 알린다', async ({ page }) => {
        await openHeuktoram(page);
        // 같은 시료번호 1이 두 번 — 표는 한 칸으로 합치므로 배지와 칸 수가 어긋난다
        await paste(page, '시료번호\tpH\n1\t5.3\n1\t6.9');

        await expect(page.locator(BODY_ROWS)).toHaveCount(1);
        await expect(
            page.locator('#importerSummary'),
            '합쳐서 사라진 값이 있는데 아무 안내가 없다'
        ).toContainText('중복');
    });

    test('미매칭 행은 표가 아니라 아래에 따로 나열된다', async ({ page }) => {
        await openHeuktoram(page);
        // 999는 대장에 없는 시료번호다
        await paste(page, '시료번호\tpH\n1\t5.3\n999\t6.1');

        await expect(page.locator(BODY_ROWS), '미매칭이 표에 섞였다').toHaveCount(1);
        await expect(page.locator('#importerPreviewList .is-unmatched')).toHaveCount(1);
        await expect(page.locator('#importerPreviewList .is-unmatched')).toContainText('999');
    });

    test('범위를 벗어난 값은 칸에 표시되고 사유가 남는다', async ({ page }) => {
        await openHeuktoram(page);
        // pH 99는 권장 범위를 크게 벗어난다
        await paste(page, '시료번호\tpH\n1\t5.3\n2\t99');

        const warn = page.locator(`${TABLE} td.is-warn`);
        await expect(warn, '범위 초과 표시가 사라졌다').toHaveCount(1);
        // 사유는 배지 대신 title로 옮겼다 — 비어 있으면 사용자가 이유를 알 수 없다
        expect((await warn.getAttribute('title')) || '').not.toBe('');
    });

    // 값은 사용자가 붙여넣은 엑셀에서 온다. 표로 바꾸면서 escape 경로가 끊기면
    // 여기가 그대로 주입면이 된다.
    // 🚨 독립 모델 리뷰가 찾은 경로. 사유를 title 속성에 넣으면서 **속성 위치**가 새로 생겼는데,
    //    공용 window.escapeHTML은 textContent→innerHTML 방식이라 **따옴표를 변환하지 않는다.**
    //    본문만 검사하는 테스트로는 이 경로가 잡히지 않는다.
    test('충돌 값에 따옴표가 있어도 title 속성을 탈출하지 못한다', async ({ page }) => {
        await openHeuktoram(page);
        // 기존값을 직접 심어 충돌 상태를 만든다 (title이 붙는 조건).
        // 저장 버튼을 거치지 않는 이유: 이 테스트가 보려는 건 escape이지 저장 흐름이 아니다.
        await page.evaluate(() => {
            const mgr = /** @type {any} */ (window).heuktoramManager;
            const key = mgr.flatRows[0].key;
            mgr.testResults[key] = { ...(mgr.testResults[key] || {}), pH: '5.3' };
        });

        await paste(page, '시료번호\tpH\n1\t"><img src=x onerror=alert(1)>');

        // ⚠️ `img` 요소만 세면 **놓친다.** 실제 탈출은 태그를 만드는 대신
        //    `<td>`에 onerror·src 같은 **속성을 주입**했다 (실측). 속성을 직접 본다.
        const probe = await page.evaluate(() => {
            const td = document.querySelector('.importer-pv-table td.is-conflict');
            if (!td) return null;
            return {
                attrs: [...td.attributes].map((a) => a.name),
                title: td.getAttribute('title') || '',
            };
        });
        if (!probe) throw new Error('충돌 칸을 찾지 못했다');
        expect(
            probe.attrs.sort(),
            `속성이 주입됐다: ${JSON.stringify(probe.attrs)}`
        ).toEqual(['class', 'title']);
        // 사유가 잘리지 않고 온전히 들어가야 한다 — 잘리면 사용자가 이유를 못 읽는다
        expect(probe.title, 'title이 잘렸다 — 속성 탈출의 흔적이다').toContain('onerror');
        await expect(page.locator(`${TABLE} img`)).toHaveCount(0);
    });

    test('붙여넣은 값의 HTML이 실행되지 않는다', async ({ page }) => {
        await openHeuktoram(page);
        await paste(page, '시료번호\tpH\n1\t<img src=x onerror=alert(1)>');

        await expect(page.locator(`${TABLE} img`), 'HTML이 그대로 파싱됐다').toHaveCount(0);
        await expect(page.locator(BODY_ROWS).first()).toContainText('<img');
    });
});
