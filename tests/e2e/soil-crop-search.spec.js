// @ts-check
// SAMPL-1-156: 툴바 작물 검색 (조회 전용 + 복사)
//
// 엑셀 서식에 작물명을 적을 때 정확한 이름을 찾아 복사하는 창구.
//
// ⚠️ 셀렉터를 **#cropModal 안으로 한정**한다. `crop-list` 클래스는 모달 전용이 아니라
//    필지 화면의 작물 표시에도 쓰인다(soil-script.js:3402-3410). 범위를 안 좁히면
//    엉뚱한 요소를 세면서 통과한다.
//
// ⚠️ 모달이 열린 상태로는 접수 등록 버튼을 클릭할 수 없다 — 오버레이가 화면 전체를
//    덮는다(style.css:3945-3963). 초기화 회귀는 **닫은 뒤** 확인한다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

const MODAL = '#cropModal';
const ROWS = '#cropModal #cropList li';

async function openSoil(page) {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const res = await page.goto('/soil/');
    expect(res && res.status(), 'docs/soil/ 없음 — `npm run build` 먼저').toBeLessThan(400);
    // ⚠️ window.CropSearch는 **모듈 로드 시점**에 생긴다. 배선은 DOMContentLoaded 이후
    //    soilManager가 만들어질 때 붙으므로, CropSearch만 기다리면 배선 전에 클릭해
    //    "배선이 끊겼다"고 오판한다(실제로 그렇게 11건이 실패했다).
    await page.waitForFunction(
        () => !!window.CROP_DATA && !!window.CropSearch && !!window.soilManager,
        { timeout: 15000 }
    );
}

async function openModal(page) {
    await page.locator('#cropSearchBtn').click();
    await expect(page.locator(MODAL)).not.toHaveClass(/hidden/);
}

test.describe('작물 검색 (SAMPL-1-156)', () => {
    test('툴바 버튼으로 열리고 작물이 보인다', async ({ page }) => {
        await openSoil(page);
        await expect(page.locator(MODAL), '처음에는 닫혀 있어야 한다').toHaveClass(/hidden/);

        await openModal(page);
        expect(await page.locator(ROWS).count(), '목록이 비었다').toBeGreaterThan(0);
        await expect(page.locator('#cropResultCount')).toContainText(/\d+개/);
    });

    test('검색하면 목록이 좁혀지고 건수가 맞는다', async ({ page }) => {
        await openSoil(page);
        await openModal(page);
        const before = await page.locator(ROWS).count();

        await page.locator('#cropSearchInput').fill('고추');
        await expect
            .poll(() => page.locator(ROWS).count(), { timeout: 5000 })
            .toBeLessThan(before);

        const names = await page.locator(`${ROWS} .crop-row-name`).allInnerTexts();
        expect(names.length, '검색 결과가 없다').toBeGreaterThan(0);
        for (const n of names) {
            expect(n, `'고추'와 무관한 '${n}'이 남았다`).toContain('고추');
        }
    });

    test('분류 필터가 실제로 거른다', async ({ page }) => {
        await openSoil(page);
        await openModal(page);

        // 첫 행의 분류를 골라서 거른다 (고정 분류명에 의존하지 않는다)
        const cat = (await page.locator(`${ROWS} .crop-row-cat`).first().innerText()).trim();
        await page.locator('#cropCategoryFilter').selectOption(cat);

        const cats = await page.locator(`${ROWS} .crop-row-cat`).allInnerTexts();
        expect(cats.length).toBeGreaterThan(0);
        for (const c of cats) {
            expect(c.trim(), `분류 '${cat}'로 걸렀는데 '${c}'가 남았다`).toBe(cat);
        }
    });

    test('행을 클릭하면 작물명이 복사된다', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await openSoil(page);
        await openModal(page);

        const first = page.locator(ROWS).first();
        const name = (await first.locator('.crop-row-name').innerText()).trim();
        await first.click();

        const copied = await page.evaluate(() => navigator.clipboard.readText());
        expect(copied, '클립보드에 작물명이 들어가지 않았다').toBe(name);
    });

    // 🚨 clipboard가 없으면 writeText 호출 자체가 동기 예외라 .catch()가 돌지 않는다.
    //    가드가 없으면 눌러도 아무 일이 안 일어나고, 사용자는 왜 안 되는지 모른다.
    test('복사를 쓸 수 없는 환경에서는 사유를 알린다', async ({ page }) => {
        await openSoil(page);
        await page.evaluate(() => {
            Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
        });
        await openModal(page);
        await page.locator(ROWS).first().click();
        // ⚠️ `.toast, [class*="toast"]`로 잡으면 **항상 존재하는 #toastContainer**에 먼저 매칭되고,
        //    5초 안에 무관한 토스트(싱크·자동저장)가 뜨기만 해도 통과한다 (코드 리뷰 지적).
        //    error 토스트의 **문구까지** 단언한다.
        await expect(
            page.locator('#toastContainer .toast.error .toast-message'),
            '복사가 안 되는데 아무 안내가 없다'
        ).toContainText('작물명 복사를 쓸 수 없습니다', { timeout: 5000 });
    });

    // 마우스 없이도 복사할 수 있어야 한다 — li + click만 두면 키보드 사용자는
    // 이 기능을 **전혀** 쓸 수 없다.
    test('키보드만으로 작물명을 복사할 수 있다', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await openSoil(page);
        await openModal(page);

        const first = page.locator(ROWS).first();
        const name = (await first.locator('.crop-row-name').innerText()).trim();
        await first.focus();
        await page.keyboard.press('Enter');

        expect(
            await page.evaluate(() => navigator.clipboard.readText()),
            'Enter로 복사되지 않았다 — 행에 tabindex/키 처리가 없다'
        ).toBe(name);
    });

    test('닫으면 포커스가 연 버튼으로 돌아온다', async ({ page }) => {
        await openSoil(page);
        await openModal(page);
        await page.keyboard.press('Escape');
        await expect(page.locator(MODAL)).toHaveClass(/hidden/);
        expect(
            await page.evaluate(() => document.activeElement?.id),
            '포커스가 복귀하지 않아 Tab 순서가 문서 처음으로 튄다'
        ).toBe('cropSearchBtn');
    });

    test('조회 전용이다 — 선택/확정 UI가 없다', async ({ page }) => {
        await openSoil(page);
        await openModal(page);
        // 폼에 채우는 기능이 아니므로 "선택 완료"가 있으면 안 된다
        await expect(page.locator('#confirmCropSelection')).toHaveCount(0);
        await expect(page.locator('#selectedCropTags')).toHaveCount(0);
    });

    test('ESC로 닫힌다', async ({ page }) => {
        await openSoil(page);
        await openModal(page);
        await page.keyboard.press('Escape');
        await expect(page.locator(MODAL)).toHaveClass(/hidden/);
    });

    // ⚠️ "닫은 뒤 ESC를 또 눌러도 안 열린다"로는 누수를 **잡지 못한다** —
    //    남은 핸들러가 이미 닫힌 모달을 또 닫아도 화면이 그대로라 구분이 안 된다.
    //    (실제로 removeEventListener를 지우는 변이가 그 단언을 통과했다.)
    //    그래서 등록/해제 횟수를 직접 센다.
    test('여닫기를 반복해도 keydown 핸들러가 쌓이지 않는다', async ({ page }) => {
        await openSoil(page);
        // __kd는 이 테스트 전용 프로브라 types/globals.d.ts(운영 전역)에 넣지 않고
        // 여기서 캐스팅한다 — 테스트 계측이 운영 타입에 새는 것을 막는다.
        await page.evaluate(() => {
            const w = /** @type {any} */ (window);
            const d = /** @type {any} */ (document);
            w.__kd = 0;
            const add = /** @type {any} */ (document.addEventListener.bind(document));
            const rem = /** @type {any} */ (document.removeEventListener.bind(document));
            d.addEventListener = (/** @type {any} */ t, /** @type {any[]} */ ...r) => {
                if (t === 'keydown') w.__kd++;
                return add(t, ...r);
            };
            d.removeEventListener = (/** @type {any} */ t, /** @type {any[]} */ ...r) => {
                if (t === 'keydown') w.__kd--;
                return rem(t, ...r);
            };
        });

        for (let i = 0; i < 3; i++) {
            await openModal(page);
            await page.keyboard.press('Escape');
            await expect(page.locator(MODAL)).toHaveClass(/hidden/);
        }

        expect(
            await page.evaluate(() => /** @type {any} */ (window).__kd),
            '닫을 때 해제하지 않아 핸들러가 쌓였다'
        ).toBe(0);
    });

    // 🚨 이 티켓의 1순위 리스크.
    //    메인의 배선은 setupTypeSpecificEvents(:3644~) 단일 블록 780줄이고,
    //    접수 등록·초기화가 그 안 :4423-4424에서 배선된다. 중간에서 예외가 나면
    //    뒤따르는 배선이 실행되지 않는데, BaseSampleManager.js:127의 try/catch가
    //    그 예외를 삼켜 **아무 소리 없이** 죽는다.
    //    → 그래서 작물 배선을 **블록 맨 끝**에 두고 try/catch로 한 번 더 감쌌다.
    test('작물 검색을 써도 접수 등록 배선이 살아 있다', async ({ page }) => {
        await openSoil(page);
        await openModal(page);
        await page.locator('#cancelCropSelection').click();
        await expect(page.locator(MODAL)).toHaveClass(/hidden/);

        // 뒤 그룹에서 배선되는 것들이 전부 살아 있는지 본다
        for (const sel of ['#navSubmitBtn', '#navResetBtn', '#exportBtn', '#soilImportBtn']) {
            await expect(page.locator(sel), `${sel} 배선이 끊겼다`).toBeVisible();
        }

        // ⚠️ 보이는 것만으로는 배선을 보장하지 못한다 — 클릭이 핸들러에 닿는지 봐야 한다.
        //    접수 등록(#navSubmitBtn)은 빈 폼에서 HTML5 검증에 막혀 관측 신호가 없으므로,
        //    바로 옆 줄(:4423)에서 배선되는 초기화 버튼으로 확인한다.
        await page.locator('#name').fill('배선확인');
        await page.locator('#navResetBtn').click();
        await expect(
            page.locator('#name'),
            '초기화를 눌러도 값이 그대로다 — setupTypeSpecificEvents의 뒤쪽 배선이 실행되지 않았다'
        ).toHaveValue('', { timeout: 5000 });
    });

    // 🚨 위 테스트는 **모달을 여는 데 의존**해서, 배선이 통째로 실패하면 함께 죽는다.
    //    정작 확인해야 할 것은 "모달이 죽어도 접수는 살아 있는가"다.
    //    ⚠️ 정직하게 적는다: 메인에서는 작물 배선이 블록 **맨 끝**이라
    //    try/catch만 떼는 변이로는 이 테스트가 깨지지 않는다 — 뒤에 남은 배선이 없다.
    //    깨지는 변이는 "배선 호출을 블록 앞쪽으로 옮기고 try/catch를 뗀다"이다.
    test('작물 검색 배선이 실패해도 접수 화면은 동작한다', async ({ page }) => {
        await openSoil(page);
        await page.locator('#name').fill('배선확인');
        await page.locator('#navResetBtn').click();
        await expect(
            page.locator('#name'),
            '초기화가 동작하지 않는다 — setupTypeSpecificEvents의 뒤쪽 배선이 실행되지 않았다'
        ).toHaveValue('', { timeout: 5000 });
    });

    test('작물 데이터가 교체되면 다시 열 때 반영된다', async ({ page }) => {
        await openSoil(page);
        // 로더가 런타임에 갈아끼우는 상황을 흉내 낸다 (crop-data-loader.js:175-180)
        await page.evaluate(() => {
            window.CROP_DATA = [{ code: '99999', name: '테스트작물', category: '테스트분류' }];
            window.CROP_CATEGORIES = ['테스트분류'];
        });
        await openModal(page);

        await expect(page.locator(ROWS), '교체된 목록이 반영되지 않았다').toHaveCount(1);
        await expect(page.locator(`${ROWS} .crop-row-name`)).toHaveText('테스트작물');
        // 분류 옵션도 다시 만들어져야 한다 (초기화 때 한 번만 만들면 옛 분류가 남는다)
        const opts = await page.locator('#cropCategoryFilter option').allInnerTexts();
        expect(opts, '분류 옵션이 갱신되지 않았다').toContain('테스트분류');
    });
});
