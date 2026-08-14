// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
    testDir: './tests/e2e',

    // 테스트 실행 설정
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,

    // 리포터 설정
    reporter: 'html',

    // 공통 설정
    use: {
        // 웹 버전 테스트용 기본 URL (docs 폴더 기준)
        //
        // 🚨 포트는 이 저장소 전용이어야 한다 (SAMPL-1-157).
        //    형제 프로젝트 3개(메인 · sample-log-electron-test · sample-log-soil)가 모두
        //    `docs/`에 `/soil/`을 낸다. 예전 8888 + `reuseExistingServer: true` 조합에서는
        //    다른 프로젝트가 8888을 물고 있으면 playwright가 **그 서버를 그대로 써서**
        //    엉뚱한 산출물을 검증했다. 원본을 이식한 기능이라 셀렉터가 전부 일치해
        //    13건 중 12건이 두 앱을 구분하지 못했다 — 적대적 검증이 실증했다.
        baseURL: 'http://localhost:8899',

        // 스크린샷 및 트레이스
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    // 프로젝트별 설정
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // 웹 서버 자동 실행 (docs 폴더 서빙)
    webServer: {
        command: 'npx http-server docs -p 8899 -c-1',
        url: 'http://localhost:8899',
        // 남의 서버를 재사용하지 않는다. 포트가 잡혀 있으면 **시끄럽게 실패**하는 편이
        // 조용히 다른 프로젝트를 검증하는 것보다 낫다.
        reuseExistingServer: false,
        timeout: 30000,
    },
});
