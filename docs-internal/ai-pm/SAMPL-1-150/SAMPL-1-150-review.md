# SAMPL-1-150 검증 결과 — 의존성 21개 업그레이드 (유지 결정)

- 사용자 결정: **유지 및 검증** (2026-08-11) — 되돌리기 대신 (b)
- 판정: **검증 통과 → 유지 확정 + 4종 정확 버전 고정**

## 검증 1 — `npm run make` (@electron-forge 7.11.2)

첫 시도는 실패했다. 원인은 **의존성과 무관한 사전 조건**이다:

```
✖ Packaging application [FAILED: ENOENT: no such file or directory, lstat './.env']
```

`forge.config.js:13`이 `extraResource: ['./app-update.yml', './.env']`로 `.env`를 동봉하고,
CI는 secrets에서 생성한다(`build.yml:40-48`). 로컬에는 `.env`가 없다(`.gitignore:61`).
→ 더미 `.env`(4개 키, 값은 `verify-dummy`)로 재실행해 성공. 검증 후 삭제했다.

```
✔ Making a zip distributable for darwin/arm64
✔ Making distributables
Artifacts available at: out/make
→ out/make/zip/darwin/arm64/sample-log-darwin-arm64-1.17.8.zip  (185MB)
```

> ⚠️ 백그라운드 실행의 종료 코드가 **0으로 보고됐지만 실제로는 실패**했다.
> 출력을 직접 확인하지 않았다면 "make 통과"로 잘못 기록했을 것이다.
> (같은 현상이 이 세션의 `npm ci`에서도 있었다 — 백그라운드 exit code를 신뢰하지 말 것.)

## 검증 2 — fuses 실측 (설정 파일이 아니라 **산출물**)

`npx @electron/fuses read --app out/sample-log-darwin-arm64/sample-log.app`

| fuse | `forge.config.js:78-83` | 산출물 실측 |
|---|---|---|
| `RunAsNode` | false | **Disabled** ✓ |
| `EnableCookieEncryption` | true | **Enabled** ✓ |
| `EnableNodeOptionsEnvironmentVariable` | false | **Disabled** ✓ |
| `EnableNodeCliInspectArguments` | false | **Disabled** ✓ |
| `EnableEmbeddedAsarIntegrityValidation` | true | **Enabled** ✓ |
| `OnlyLoadAppFromAsar` | true | **Enabled** ✓ |

6종 전부 일치. ASAR 무결성 해시도 `Info.plist`에 기록됐다:

```
Resources/app.asar → hash ca11e18f...1e82 / algorithm SHA256
```

`extraResource` 2종(`.env`, `app-update.yml`)이 `Contents/Resources/`에 정상 동봉됐다.

## 검증 3a — electron-updater 6.8.9 API 호환성

Electron main 프로세스에서 확인(창을 만들지 않아 GUI 없음). `src/index.js:76-81,486`이 쓰는 API 전부 유지:

```
electron-updater 로드: OK / 버전 6.8.9
  setFeedURL: function          checkForUpdatesAndNotify: function
  on: function                  checkForUpdates: function
  logger/autoDownload/autoInstallOnAppQuit 대입: OK
  setFeedURL(github provider): OK
  currentVersion: 39.2.6
```

## 검증 3b — firebase 12.17.1 / @firebase/firestore 4.17.0 초기화 경로

더미 config로 compat SDK 초기화. 앱이 실제로 쓰는 API 전부 통과:

```
firebase SDK 버전: 12.17.0
initializeApp: OK ([DEFAULT])        firebase.firestore(): OK
collection('soilSamples_2026'): OK   doc(id).set: function
batch().set: function                FieldValue.serverTimestamp: function
enablePersistence: function          auth(): function
```

## 검증 4 — 배포된 GitHub Pages (Playwright, 6페이지)

| 페이지 | 페이지 오류 | HTTP 4xx·5xx | APP_VERSION | 매니저 |
|---|---|---|---|---|
| `/` `/soil/` `/water/` `/compost/` `/heavy-metal/` `/pesticide/` | **0건** | **0건** | 1.17.8 | 각 페이지 정상 |

`firebase SDK: 없음`은 결함이 아니다 — `firebaseConfig.isEnabled()`가 `false`(미설정)이므로
SDK를 지연 로드하지 않는 정상 동작이고, `firestoreDb` 객체는 정상 노출된다.

## 검증 5 — 나머지 18개 패키지

`dompurify 3.4.7 → 3.4.13`은 XSS 방지 경로라 별도 확인이 필요했다 →
`sanitize.test.js` 포함 단위 **271건 통과**. 나머지(vite/vitest/jsdom/postcss/autoprefixer/dexie 등)는
빌드·테스트 통과로 커버된다.

## 조치 — 4종 정확 버전 고정

`package.json`의 표기가 실제 설치와 어긋나 있었다(`^12.7.0`인데 12.17.1 설치).
**검증한 버전으로 고정**했다 — CI가 검증할 수 없는 패키지가 부동 버전이면 다음 lock 재생성에서
또 조용히 올라간다. `electron: 39.2.6`이 이미 고정된 선례를 따랐다.

| 패키지 | 이전 | 이후 |
|---|---|---|
| `firebase` | `^12.7.0` | **`12.17.1`** |
| `electron-updater` | `^6.6.2` | **`6.8.9`** |
| `@electron-forge/*` (8개) | `^7.10.2` | **`7.11.2`** |

고정 후 `npm ci --dry-run` 통과, 설치 버전 불변 확인.
기존 고정: `electron 39.2.6`, `typescript 5.9.3`, `@playwright/test 1.57.0`.

## 남은 한계 (사용자 확인 항목)

- **Firestore 실계정 쓰기/읽기는 하지 않았다.** 운영 자격이 필요하고 실데이터에 영향을 준다.
  초기화·API 존재까지만 확인했다. 연도 전환 + 싱크 1건 쓰기/읽기는 **사용자가 직접 확인**할 항목이다.
- **Windows Squirrel 설치본은 macOS에서 만들 수 없다.** zip maker만 검증했다.
  다음 태그 푸시 시 GitHub Actions(`windows-latest`)에서 확인된다.
- **electron-updater의 실제 업데이트 흐름**은 새 릴리스가 있어야 검증된다. 초기화·피드 설정까지만 확인했다.

## 최종 검증

typecheck 0건 / 단위 **271 pass** / E2E **210 pass + 4 skipped** / 빌드 성공 /
`check:docs` 누락 0건 / `npm ci --dry-run` 통과
