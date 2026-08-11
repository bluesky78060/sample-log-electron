// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * 사용 설명서 스크린샷 캡처 (SAMPL-2-23)
 *
 * 평시 `npm test`에서는 실행하지 않는다. 이 스펙은 소스 트리(src/manual/images)에 파일을 쓰므로
 * 매번 돌면 (a) E2E를 돌릴 때마다 git diff가 생기고, (b) .githooks/pre-push의 태그 게이트가
 * src/ 오염을 차단하므로 태그 푸시 전에 스크린샷을 커밋해야 하는 상황이 된다.
 *
 * 설명서 화면을 갱신할 때만 의도적으로 실행한다:
 *   npm run build                                   # 최신 docs/를 서빙 대상으로 만든다
 *   UPDATE_SCREENSHOTS=1 npm run test:screenshots
 *   npm run build                                   # 새 이미지를 해시 자산으로 설명서에 반영
 *   git add -A src/manual/images docs/ && git commit
 *
 * 캡처 대상은 src/manual/index.html이 실제로 참조하는 화면만 둔다.
 * 참조되지 않는 캡처는 어디에도 표시되지 않으면서 git 히스토리에 영구 잔존한다
 * (이전에 03/05/06/07/08 5건 ~1MB가 그 상태였다. 설명서에 해당 화면을 넣을 때 되살릴 것).
 */

const screenshotDir = path.join(__dirname, '../../src/manual/images');

test.describe('사용 설명서 스크린샷 캡처', () => {

  test.skip(!process.env.UPDATE_SCREENSHOTS,
    'UPDATE_SCREENSHOTS=1 일 때만 실행 (소스 트리에 파일을 씀)');

  test('01. 메인 화면', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, '01-main.png'),
      fullPage: false
    });
  });

  test('02. 토양 시료 접수 - 등록 화면', async ({ page }) => {
    await page.goto('/soil/');
    await page.waitForLoadState('networkidle');
    // 등록 뷰가 기본
    await page.screenshot({
      path: path.join(screenshotDir, '02-soil-register.png'),
      fullPage: false
    });
  });

  test('04. 토양 시료 - 목록 화면', async ({ page }) => {
    await page.goto('/soil/');
    await page.waitForLoadState('networkidle');

    // 목록 보기 클릭
    const listViewBtn = page.locator('[data-view="list"], .nav-btn:has-text("목록")');
    if (await listViewBtn.count() > 0) {
      await listViewBtn.first().click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: path.join(screenshotDir, '04-soil-list.png'),
      fullPage: false
    });
  });

  test('09. 라벨 인쇄 화면', async ({ page }) => {
    await page.goto('/label-print/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: path.join(screenshotDir, '09-label-print.png'),
      fullPage: false
    });
  });

});
