// @ts-check
// SAMPL-2-33: 이스케이프한 값을 textContent에 넣어 엔티티가 화면에 보인다
//
// `escapeHTML`한 값을 `textContent`·`dataset`에 그대로 넣으면 **이중 이스케이프**가 된다.
// `textContent`는 HTML을 해석하지 않으므로 이스케이프가 필요 없고, 넣으면 코드가 글자로 보인다.
//
//   입력: 김&철수    →    화면: 김&amp;철수
//   입력: <특수>     →    화면: &lt;특수&gt;
//
// 실측(수정 전): 수질 6셀·3툴팁, 잔류농약 5셀·2툴팁, 중금속 4셀·1툴팁, 퇴비 3셀·1툴팁.
//
// ⚠️ **토양이 0건인 이유를 처음에 틀리게 적었다** (적대적 검증이 잡음).
//    "템플릿 문자열로 그리므로 이스케이프가 올바른 자리에 있다"고 썼는데 **거짓이다.**
//    토양도 `createElement` + `textContent` + **원본 값**을 쓴다
//    (`soil-script.js:3397`·`:3416`·`:3456`·`:3483`; `innerHTML`은 비우기뿐).
//    즉 **이미 이 수정이 하는 것을 하고 있어서** 0건이었다.
//
//    그 거짓 설명은 위험한 방향으로 틀렸다 — "토양엔 이스케이프가 있다"고 읽히지만
//    실제로는 **목록 경로에 이스케이프가 아예 없다.** 누군가 토양 목록에
//    `innerHTML` 셀을 추가하면 방어가 없으므로 반드시 `escapeHTML`을 붙여야 한다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const EXPECTED_VERSION = require('../../package.json').version;

/** 엔티티가 글자로 보이면 잡히는 패턴 */
const ENTITY = /&amp;|&lt;|&gt;|&quot;|&#39;/;

const TYPES = [
    { name: '토양', path: '/soil/', mgr: 'soilManager' },
    { name: '수질', path: '/water/', mgr: 'waterManager' },
    { name: '퇴비', path: '/compost/', mgr: 'compostManager' },
    { name: '잔류농약', path: '/pesticide/', mgr: 'pesticideManager' },
    { name: '중금속', path: '/heavy-metal/', mgr: 'heavyMetalManager' },
];

/** `&`·`<`·`>`를 담은 레코드 — 어느 필드가 어느 타입에 쓰이는지 몰라 넉넉히 채운다 */
const RECORD = {
    id: 'r1', receptionNumber: '1',
    name: '김&철수',
    // ⚠️ 실제 XSS 페이로드를 넣는다 (독립 리뷰 지적). `<특수>` 같은 한글 태그만으로는
    //    새 HTML sink가 생겼을 때 검출력이 약하다.
    note: '<img src=x onerror=alert(1)><script>alert(2)</script> 비고',
    address: '봉화군 A&B로 1',
    addressRoad: '봉화군 A&B로 1',
    date: '2026-08-20', phoneNumber: '010-1234-5678',
    cropName: '고추&배추', mainCrop: '고추&배추',
    sampleName: '시료<1>', samplingLocation: '창고&저장고',
    farmName: 'A&B농장', companyName: 'A&B농장', farmAddress: '봉화군 A&B로 2',
    producerName: '김&철수', producerAddress: '봉화군 A&B로 3',
    requestContent: '검사<의뢰>',
    parcels: [{ id: 'p1', lotAddress: '문단리 224', subLots: [], crops: [{ name: '고추', area: '100' }] }],
};

async function openList(page, type, dialogs) {
    // ⚠️ 다이얼로그를 **수집**한다. 그냥 dismiss하면 페이로드의 `alert(1)`이 조용히
    //    삼켜져 **XSS가 터졌다는 가장 강한 신호를 버리게 된다**(코드 리뷰 지적).
    page.on('dialog', (d) => {
        if (dialogs) dialogs.push(d.message());
        d.dismiss().catch(() => {});
    });
    const res = await page.goto(type.path);
    expect(res && res.status(), `docs${type.path} 없음 — \`npm run build\` 먼저`).toBeLessThan(400);
    // ⚠️ 매니저 **객체**만 기다리면 안 된다 — `tableBody` 바인딩까지 기다려야 한다.
    //    수질·중금속은 그 바인딩이 늦어, 사이에 심으면 `renderLogs`가 조용히 0행을
    //    렌더하고 엔티티 검사가 "검사할 셀이 없어서" 통과/실패한다 (SAMPL-2-36).
    await page.waitForFunction(
        (m) => { const mgr = /** @type {any} */ (window)[m]; return !!mgr && !!mgr.tableBody; },
        type.mgr,
        { timeout: 15000 }
    );
    expect(
        await page.evaluate(() => /** @type {any} */ (window).APP_VERSION),
        'docs/의 APP_VERSION이 package.json과 다르다 — 빌드 누락이거나 다른 프로젝트다'
    ).toBe(EXPECTED_VERSION);

    await page.evaluate(([m, rec]) => {
        const mgr = /** @type {any} */ (window)[m];
        mgr.sampleLogs = [rec];
        if (typeof mgr.filterAndRenderLogs === 'function') mgr.filterAndRenderLogs();
        if (typeof mgr.switchView === 'function') mgr.switchView('list');
    }, [type.mgr, RECORD]);
    await page.waitForTimeout(400);

    // ⚠️ 0행이면 엔티티 검사는 **검사할 셀이 없어서** 통과한다 — 가장 나쁜 위장이다.
    //    심은 레코드가 실제로 그려졌는지 여기서 못 박는다 (SAMPL-2-36).
    //
    //    개수만 세지 않고 **우리가 심은 id**(`RECORD.id === 'r1'`)인지까지 본다 —
    //    페이지가 자체 로드한 데이터가 그려졌다면 그 안에는 검사할 엔티티가 없다
    //    (독립 리뷰 지적). `toHaveCount`는 자동 재시도하므로 늦은 렌더도 잡는다.
    await expect(
        page.locator(`.btn-edit[data-id="${RECORD.id}"]`),
        '심은 레코드가 렌더되지 않았다 — 엔티티 검사가 남의 표를 검사하게 된다'
    ).toHaveCount(1);
}

for (const type of TYPES) {
    test.describe(`${type.name} 목록 표시 (SAMPL-2-33)`, () => {
        test('셀에 엔티티 코드가 글자로 보이지 않는다', async ({ page }) => {
            await openList(page, type);

            const out = await page.evaluate((pat) => {
                const re = new RegExp(pat);
                const cells = [...document.querySelectorAll('.data-table tbody td')];
                return {
                    total: cells.length,
                    bad: cells
                        .map((td) => (td.textContent || '').trim())
                        .filter((t) => re.test(t))
                        .slice(0, 5),
                };
            }, ENTITY.source);

            expect(out.total, '목록이 렌더되지 않아 검증이 무의미하다').toBeGreaterThan(0);
            expect(
                out.bad,
                `엔티티 코드가 글자로 보인다: ${JSON.stringify(out.bad)}`
            ).toEqual([]);
        });

        // 툴팁은 `dataset.tooltip`/`setAttribute`로 넣는다 — 여기도 같은 이중 이스케이프가 난다.
        test('툴팁에 엔티티 코드가 글자로 보이지 않는다', async ({ page }) => {
            await openList(page, type);

            const out = await page.evaluate((pat) => {
                const re = new RegExp(pat);
                const all = [...document.querySelectorAll('[data-tooltip], [title]')]
                    .map((e) => e.getAttribute('data-tooltip') || e.getAttribute('title') || '');
                return { total: all.length, bad: all.filter((t) => re.test(t)).slice(0, 5) };
            }, ENTITY.source);

            // 툴팁이 하나도 없으면 이 검사는 아무것도 증명하지 못한다 (코드 리뷰 지적)
            expect(out.total, '툴팁이 하나도 없어 검증이 무의미하다').toBeGreaterThan(0);
            expect(out.bad, `툴팁에 엔티티 코드가 보인다: ${JSON.stringify(out.bad)}`).toEqual([]);
        });

        // 🚨 코드 리뷰가 잡은 회귀. 이스케이프를 벗기면서 폴백이 없는 자리에
        //    `undefined`가 그대로 보이게 됐다(잔류농약). `escapeHTML(undefined)`는 ''를
        //    반환했으므로 예전에는 감춰져 있었다 — 표시를 고치는 티켓이 새 표시 버그를 냈다.
        test('값이 없는 필드에 undefined가 보이지 않는다', async ({ page }) => {
            await openList(page, type);
            await page.evaluate((m) => {
                const mgr = /** @type {any} */ (window)[m];
                // 이름·비고가 빠진 레코드
                mgr.sampleLogs = [{ id: 'r9', receptionNumber: '9', date: '2026-08-20' }];
                if (typeof mgr.filterAndRenderLogs === 'function') mgr.filterAndRenderLogs();
            }, type.mgr);
            await page.waitForTimeout(300);

            const bad = await page.evaluate(() => {
                const texts = [...document.querySelectorAll('.data-table tbody td')]
                    .map((td) => (td.textContent || '').trim());
                const tips = [...document.querySelectorAll('[data-tooltip], [title]')]
                    .map((e) => e.getAttribute('data-tooltip') || e.getAttribute('title') || '');
                return [...texts, ...tips].filter((t) => /undefined|null|NaN/.test(t)).slice(0, 5);
            });
            expect(bad, `빈 값 자리에 이런 글자가 보인다: ${JSON.stringify(bad)}`).toEqual([]);
        });

        // 🚨 값을 그대로 넘기다가 **템플릿 경로의 이스케이프까지 지우면 XSS가 된다.**
        //    표시를 고치는 김에 방어가 사라지지 않았는지 함께 본다.
        test('원본 값을 넘기되 태그로 해석되지는 않는다', async ({ page }) => {
            /** @type {string[]} */
            const dialogs = [];
            await openList(page, type, dialogs);

            const out = await page.evaluate(() => {
                const body = document.querySelector('.data-table tbody');
                if (!body) return null;
                return {
                    // `<특수>`, `시료<1>` 같은 값이 태그로 먹히면 요소가 생긴다
                    // 실제 페이로드가 만들 요소들을 센다
                    injected: body.querySelectorAll('script, img, 의뢰').length,
                    // 값 자체는 살아 있어야 한다
                    hasAmp: (body.textContent || '').includes('&'),
                    hasLt: (body.textContent || '').includes('<'),
                };
            });
            if (!out) throw new Error('목록 본문을 찾지 못했다');

            expect(out.injected, '값이 태그로 해석돼 요소가 생성됐다').toBe(0);
            expect(out.hasAmp, "'&'가 든 값이 화면에서 사라졌다").toBe(true);
            // 값이 **온전히 살아 있어야** 한다 — 막느라 데이터를 깎으면 안 된다
            expect(out.hasLt, "'<'가 든 값이 화면에서 사라졌다").toBe(true);

            // 🚨 `injected`와 **독립된 두 번째 방어선**. 페이로드가 실행되면 alert가 뜬다.
            //    요소 검사만으로는 새 실행 경로(이벤트 핸들러 등)를 놓칠 수 있다.
            expect(
                dialogs,
                `스크립트가 실행됐다: ${JSON.stringify(dialogs)}`
            ).toEqual([]);
        });
    });
}
