// @ts-check
// SAMPL-1-155: 접수번호 정합성 점검 (설정 화면)
//
// SAMPL-1-153이 앞으로의 가져오기를, SAMPL-2-30이 입구를 막았지만
// **그 전에 저장된 레코드는 아무도 손대지 않았다.** 이 화면은 그것을 찾아낸다.
//
// ⚠️ 이 스펙이 단정하는 방식: 순수 함수는 단위 테스트가 덮으므로, 여기서는
//    **화면이 실제로 무엇을 말하는지**를 본다. 특히 "문제 0건"을 분명히
//    말하는지 — 조용한 성공은 점검이 돌지 않은 것과 구별되지 않는다.
//
// ⚠️ docs/ 빌드 산출물 대상 — `npm run build` 먼저.
const { test, expect } = require('@playwright/test');

async function openSettings(page) {
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    const res = await page.goto('/settings/');
    expect(res && res.status(), 'docs/settings/ 없음 — `npm run build` 먼저').toBeLessThan(400);
    // 버튼 배선이 끝날 때까지 기다린다. 요소 존재만 보면 배선 전에 눌러
    // "아무 일도 안 일어난다"를 제품 결함으로 오독한다 (SAMPL-2-36에서 배운 것).
    await page.waitForFunction(() => !!window.ReceptionAudit, { timeout: 15000 });
    await expect(page.locator('#receptionAuditBtn')).toBeVisible();
}

/** 연도별 토양 데이터를 심고 새로고침한다 */
async function seed(page, byYear) {
    await page.evaluate((data) => {
        localStorage.clear();
        for (const [year, logs] of Object.entries(data)) {
            localStorage.setItem(`soilSampleLogs_${year}`, JSON.stringify(logs));
        }
    }, byYear);
    await page.reload();
    await page.waitForFunction(() => !!window.ReceptionAudit, { timeout: 15000 });
}

const log = (id, rn, sub, cls) => ({
    id, receptionNumber: rn, name: `민원인${id}`, subCategory: sub,
    landClass1: cls || '농가의뢰', parcels: [],
});

test.describe('접수번호 정합성 점검 (SAMPL-1-155)', () => {
    test('데이터가 정상이면 "문제 0건"이라고 분명히 말한다', async ({ page }) => {
        await openSettings(page);
        await seed(page, {
            2026: [log('a', '1', '논'), log('b', 'F1', '성토'), log('c', '2-1', '밭')],
        });

        await page.locator('#receptionAuditBtn').click();
        const box = page.locator('#receptionAuditResult');
        await expect(box).toContainText('문제 0건');
        await expect(box).toContainText('3건 검사');
        // 문제가 없으면 CSV 버튼은 나오지 않는다
        await expect(page.locator('#receptionAuditCsvBtn')).toBeHidden();
    });

    test('손상 데이터를 유형별로 집계해 보여준다', async ({ page }) => {
        await openSettings(page);
        await seed(page, {
            2025: [log('ok', '1', '논')],
            2026: [
                log('a', '1', '성토'),      // 성토인데 F 없음
                log('b', 'F9', '논'),       // F인데 성토 아님
                log('c', 'f3', '성토'),     // 소문자 f
                log('d', '12abc', '논'),    // 형식 아님
            ],
        });

        await page.locator('#receptionAuditBtn').click();
        const box = page.locator('#receptionAuditResult');
        await expect(box).toContainText('4건 확인됨');
        await expect(box).toContainText('2026년');
        await expect(box).toContainText('성토인데 F 없음 1건');
        await expect(box).toContainText('F인데 성토 아님 1건');
        await expect(box).toContainText('소문자 f 1건');
        await expect(box).toContainText('형식 아님 1건');
        // 문제 없는 연도는 나열하지 않는다
        await expect(box).not.toContainText('2025년');
        // ⚠️ 고치지 않는다는 것을 화면이 말해야 한다 — 사용자가 "정리됐다"고 오해하면 안 된다
        await expect(box).toContainText('고치지 않습니다');
        await expect(page.locator('#receptionAuditCsvBtn')).toBeVisible();
    });

    test('같은 경지구분 안의 중복 번호를 잡는다', async ({ page }) => {
        await openSettings(page);
        await seed(page, {
            2026: [log('a', '5', '논', '농가의뢰'), log('b', '5', '밭', '농가의뢰')],
        });
        await page.locator('#receptionAuditBtn').click();
        await expect(page.locator('#receptionAuditResult')).toContainText('중복 번호 1종(2건)');
    });

    test('경지구분이 다른 같은 번호는 중복이 아니다 (과잉탐지 방지)', async ({ page }) => {
        await openSettings(page);
        await seed(page, {
            2026: [log('a', '5', '논', '농가의뢰'), log('b', '5', '논', '공익직불제')],
        });
        await page.locator('#receptionAuditBtn').click();
        await expect(page.locator('#receptionAuditResult')).toContainText('문제 0건');
    });

    test('저장된 토양 데이터가 없으면 그렇다고 말한다', async ({ page }) => {
        await openSettings(page);
        await seed(page, {});
        await page.locator('#receptionAuditBtn').click();
        await expect(page.locator('#receptionAuditResult')).toContainText('저장된 토양 데이터가 없습니다');
    });

    test('점검 배선이 다른 설정 기능을 죽이지 않는다', async ({ page }) => {
        // SAMPL-1-156이 값비싸게 배운 것: 배선 하나가 던지면 뒤에 남은 배선이 통째로 죽는다.
        await openSettings(page);
        // 이 파일 뒤쪽에서 배선되는 버튼들이 살아 있는지 본다
        await expect(page.locator('#clearCacheBtn')).toBeVisible();
        await expect(page.locator('#exportAllBtn')).toBeVisible();
    });
});

test.describe('점검이 조용히 거짓말하지 않는다 (SAMPL-1-155 · 독립 리뷰 반영)', () => {
    test('연도 없는 레거시 키도 검사한다', async ({ page }) => {
        // cache-manager.js:24가 레거시 키(soilSampleLogs)의 존재를 명시한다.
        // 연도 키만 훑으면 그 데이터를 통째로 건너뛰고 "문제 0건"이라 말하게 된다.
        await openSettings(page);
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('soilSampleLogs', JSON.stringify([
                { id: 'legacy', receptionNumber: '1', name: '옛민원', subCategory: '성토', landClass1: '농가의뢰', parcels: [] },
            ]));
        });
        await page.reload();
        await page.waitForFunction(() => !!window.ReceptionAudit, { timeout: 15000 });

        await page.locator('#receptionAuditBtn').click();
        const box = page.locator('#receptionAuditResult');
        await expect(box).toContainText('1건 확인됨');
        await expect(box).toContainText('연도없음(레거시)');
        await expect(box).toContainText('성토인데 F 없음 1건');
    });

    test('읽지 못한 저장소가 있으면 결과보다 먼저 알린다', async ({ page }) => {
        // 손상된 JSON을 조용히 빈 배열로 넘기면 "문제 0건"이 거짓이 된다.
        await openSettings(page);
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('soilSampleLogs_2026', '{이건 JSON이 아니다');
            localStorage.setItem('soilSampleLogs_2025', JSON.stringify([
                { id: 'ok', receptionNumber: '1', name: 'A', subCategory: '논', landClass1: '농가의뢰', parcels: [] },
            ]));
        });
        await page.reload();
        await page.waitForFunction(() => !!window.ReceptionAudit, { timeout: 15000 });

        await page.locator('#receptionAuditBtn').click();
        const box = page.locator('#receptionAuditResult');
        // ⚠️ "문제 0건"이 "검사하지 못했다"를 덮으면 안 된다
        await expect(box).toContainText('읽지 못한 저장소가 있습니다');
        await expect(box).toContainText('2026');
    });
});
