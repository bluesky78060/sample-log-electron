# SAMPL-1-156 코드 리뷰 — 메인 soil 작물 검색 모달 이식

- 대상: 브랜치 `feat/soil-crop-search` 워킹트리 (`src/`, `tests/`, `types/`)
- 성격: `sample-log-soil` SLS-1-228(`c8cf319`) + SLS-1-229(`a1fd708`) 이식

## 검증 레인

| 레인 | 수행 | 결과 |
| --- | --- | --- |
| `code-reviewer` (Claude Opus) | ✅ | **APPROVED** — 🔴0/🟠0/🟡5/🔵4 |
| 적대적 검증 (`critic`, "이 변경을 반증하라") | ⏳ | 아래 채움 |
| **독립 모델 교차 리뷰 (codex)** | ✅ **실행함** | **APPROVED** — 🔴0/🟠0/🟡2 |
| 플랜 리뷰 | ❌ **생략** | 사용자 지시(코드 수정·중요도 낮음). `SAMPL-1-156-plan-review.md`에 기록 |

> 이 세션 내내 독립 모델 레인이 불가였다(gemini `GOOGLE_CLOUD_PROJECT` 미설정, codex vendor 바이너리 `ENOENT`).
> 이번에 **codex가 복구되어 실제로 실행했다** — gemini는 여전히 불가.

## 변경 요약

| 파일 | 내용 |
| --- | --- |
| `src/soil/crop-search.js` (신규 71줄) | 순수 검색 모듈 `window.CropSearch = {filterCrops, categoriesOf, normalize}` |
| `src/soil/soil-entry.js` | `crop-search.js` import (soil-script보다 먼저) |
| `src/soil/index.html` | 툴바 `#cropSearchBtn` 추가 · `#cropModal`의 구 다중선택 UI → 복사 안내로 교체 |
| `src/soil/soil-script.js` | `_bindCropSearchModal()` 추가 + 구 죽은 배선 블록 제거 |
| `src/style.css` | `.crop-row-*` · `.crop-copy-hint` 라이트 규칙 |
| `types/globals.d.ts` | `CROP_DATA`·`CROP_CATEGORIES`·`CropSearch` (declare var + interface Window 양쪽) |
| `tests/unit/crop-search.test.js` (14건) · `tests/e2e/soil-crop-search.spec.js` (11건) | 신규 |

툴바 순서: 작물 · 내보내기 · 저장 · 불러오기 · 가져오기 · 흙토람

## 메인 고유 판단 — soil을 그대로 베끼지 않은 곳

### 1) 배선 위치가 다르다

soil은 배선이 `_bindStatisticsAndLegacyModals` / `_bindNavAndPagination` 등으로 쪼개져 있어
작물 배선이 **접수 등록 배선보다 앞**이었다. 메인은 `setupTypeSpecificEvents()` 단일 블록 780줄이고
접수 등록·초기화가 그 안 `:4423-4424`에 있다.

→ 작물 배선을 **블록 맨 끝**에 두고 try/catch로 한 번 더 감쌌다. 두 겹이다.

### 2) 구 죽은 배선 블록을 제거했다 (독립 리뷰 지적)

메인에는 구 다중선택 UI의 잔해 배선이 `:4276-4300`에 남아 있었다. codex가 "닫기·카테고리
초기화 코드가 남아 리스너가 중복 등록된다"고 지적해 확인 후 제거했다.

- `#openCropModalBtn`은 HTML에 없어 아무 일도 하지 않았다
- 닫기/오버레이 리스너가 새 배선과 **중복 등록**됐다
- **분류 옵션을 init 때 한 번만** 만들었다 — `crop-data-loader.js`가 런타임에
  `CROP_CATEGORIES`를 갈아끼우면 옛 분류가 남는 구조였다 (새 배선은 열 때마다 다시 만든다)

### 3) E2E 대기 조건을 고쳤다 — 11건 전부 실패했던 원인

soil의 스펙은 `window.CROP_DATA && window.CropSearch`를 기다린다. 그런데 `CropSearch`는
**모듈 로드 시점**에 생기고 배선은 `DOMContentLoaded` 이후 `soilManager` 생성 때 붙는다.
메인에서는 그 간격이 벌어져 배선 전에 클릭했고, "배선이 끊겼다"는 **오판**으로 11건이 실패했다.

→ `window.soilManager`까지 기다리도록 고쳤다. 제품 결함이 아니라 테스트 타이밍 결함이었고,
   프로브로 실제 콘솔 오류 0건·리셋 정상 동작을 확인한 뒤 판정했다.

### 4) `types/globals.d.ts` — 테스트 계측은 넣지 않았다

메인은 `@ts-check` 파일을 CI에서 검사한다(soil은 안 한다). 새 스펙에서 10건이 났다.
운영 전역(`CROP_DATA`·`CROP_CATEGORIES`·`CropSearch`)만 선언에 추가하고,
테스트 전용 프로브 `__kd`는 스펙 안에서 캐스팅했다 — 계측이 운영 타입에 새지 않게.

## 독립 모델 교차 리뷰 (codex) — APPROVED

```text
🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 2건
→ 판정: APPROVED
```

확인된 것: 구 UI 참조 잔존 없음 · XSS 경로 없음(전부 `textContent`/`dataset`) ·
clipboard 부재와 Promise 거부 양쪽 처리 · 배선 예외 격리.

| 🟡 | 내용 | 처리 |
| --- | --- | --- |
| 1 | **Excel 수식 주입** — 업로드한 작물명이 `=HYPERLINK(...)`이면 붙여넣은 엑셀이 수식으로 해석 | **미조치**(아래 사유) |
| 2 | 모달 DOM이 없으면 버튼이 노출된 채 무반응 | ✅ **반영** — `#cropSearchBtn`도 함께 숨긴다 |

**🟡1을 고치지 않은 이유**: 복사되는 값은 담당자가 **자기가 업로드한** 작물 목록의 이름이다.
공격자가 아니라 사용자 자신이 넣은 데이터이고, `'` 접두 같은 완화는 정상 작물명까지 오염시킨다.
이 앱의 실제 위협 모델(단일 기관 담당자, 내부 데이터)에서 비용이 이득을 넘는다고 판단했다.
후속 티켓 후보로 남긴다.

## 코드 리뷰 (`code-reviewer`) — APPROVED

```text
🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 5건 / 🔵 SUGGESTION: 4건
→ 판정: APPROVED
```

리뷰어가 4개 게이트를 **직접 실행해** 확증했고(typecheck·단위 14·E2E 11·check:docs),
`docs/` 산출물에 `crop-row-name` 존재와 `confirmCropSelection` 0건까지 확인했다.
`grass` 아이콘은 로컬 번들 폰트(`material-icons-outlined.woff2`, 2,183 글리프)를 fontTools로 열어
실재를 확인했다 — CDN 가정으로 넘어가지 않았다.

| 🟡/🔵 | 내용 | 처리 |
| --- | --- | --- |
| 🟡1 | 구 작물 모달 죽은 블록이 중복 배선으로 남음 | ✅ **반영** — codex도 같은 것을 지적했다. `:4276-4300` 제거 |
| 🟡2 | 마크업 드리프트 시 조용한 early return → 죽은 버튼 | ✅ **반영** — `throw`로 바꿔 호출부가 로그하고 버튼을 숨기게 했다 |
| 🟡3 | **키보드만으로는 이 기능을 전혀 쓸 수 없다** | ✅ **반영** — `tabIndex`·`role=button`·Enter/Space 처리·닫을 때 포커스 복귀. E2E 2건 추가 |
| 🟡4 | **상한 200이 카탈로그의 61%를 감춘다** (801건 중 `기타` 318·`과수` 170) | ✅ **반영** — `DEFAULT_LIMIT` 200 → 1000 |
| 🟡5 | 죽은 CSS(`.crop-list .crop-name` 등) 위에 거의 같은 규칙을 한 벌 더 얹음 | ❌ **미조치** — 리뷰어가 "지금 고치면 농약 회귀 위험"이라 권고. 후속 티켓 |
| 🔵1 | `render()`의 `!CS` 가드가 죽은 계산 뒤에 있고, 그 경로에서 화면이 직전 상태로 남음 | ✅ **반영** — 가드를 맨 위로, 목록 비우고 사유 표시 |
| 🔵2 | E2E 토스트 단언이 넓어 무관한 토스트로도 통과 | ✅ **반영** — `#toastContainer .toast.error .toast-message` + 문구 단언 |
| 🔵3 | `crop-search.js`에 `// @ts-check` 추가 | ✅ **반영** — 아래 참조 |
| 🔵4 | 농약/중금속 작물 모달 잔해 정리 | ❌ **미조치** — 후속 티켓 |

### 🔵3에서 실제로 결함이 나왔다

리뷰어는 "`@ts-check`를 붙인 사본을 돌려봤고 오류 0건"이라고 했지만, 실제 프로젝트 설정으로
붙이니 **TS18048 1건**이 났다.

```js
const limit = Number.isFinite(opts.limit) ? opts.limit : DEFAULT_LIMIT;  // 'limit' is possibly 'undefined'
```

`Number.isFinite`는 타입 가드가 아니라 TS가 좁히지 못한다. `typeof === 'number'`를 앞에 두어
고쳤다(NaN/Infinity 배제는 그대로). **ad-hoc 검증과 실제 게이트가 다를 수 있다는 사례**로 남긴다.

## 설명서 스크린샷 — 함께 갱신했다

`src/manual/images/{01-main,02-soil-register,04-soil-list}.png`가 툴바를 담고 있어 새 버튼 때문에
낡았다. CLAUDE.md의 **2패스 절차**를 그대로 따랐다(`build` → `UPDATE_SCREENSHOTS=1 test:screenshots`
→ `build`). 두 번째 빌드를 빼먹으면 `docs/manual/index.html`이 구 해시를 가리키면서도
`check:docs`는 통과해 낡은 스크린샷이 조용히 배포된다.

갱신된 이미지에서 작물 아이콘이 툴바 맨 앞에 들어간 것을 눈으로 확인했다.

## 변이 검증

| 변이 | 결과 |
| --- | --- |
| 배선을 블록 **앞쪽**으로 옮기고 try/catch 제거 + 예외 발생 | E2E **다수 실패** (검출) |
| 같은 위치에 try/catch만 복구 | **통과** — 보호가 실제 요인임을 확인 |
| `li.tabIndex`·`role` 제거 | `키보드만으로 작물명을 복사할 수 있다` **실패** |
| `openBtn?.focus()` 제거 | `닫으면 포커스가 연 버튼으로 돌아온다` **실패** |
| clipboard 부재 가드 제거 | `복사를 쓸 수 없는 환경에서는 사유를 알린다` **실패** |

> ⚠️ 정직하게 적는다: 최종 배치(블록 맨 끝)에서는 **try/catch만 떼는 변이로 테스트가 깨지지 않는다**
> — 뒤에 남은 배선이 없기 때문이다. 깨지는 변이는 "앞쪽으로 옮기고 try/catch를 뗀다"이고,
> 그 변이로 실패함을 실제로 확인했다. 이 사실을 스펙 주석에도 적었다.

## 최종 검증

| 항목 | 결과 |
| --- | --- |
| 단위 | **323 pass** (18 파일, 신규 `crop-search.test.js` 14건 포함) |
| E2E | **229 pass / 4 skip / 0 fail** (233건, 신규 스펙 13건 포함, 기존 회귀 0) |
| `npm run typecheck` | 오류 **0건** |
| `npm run check:docs` | 참조 148건, 누락 **0건** |
| `npm run lint` | **미구성** — 이 저장소의 lint 스크립트는 `echo "No linting configured"`. 실행하지 않은 검증을 통과로 적지 않기 위해 `skip`으로 제출했다 |
| 빌드 | 성공, `docs/`를 소스와 함께 커밋 |

## 남은 한계

- **gemini 레인 미수행** — `GOOGLE_CLOUD_PROJECT` 미설정. codex로 대체했다
- **Electron 실행 미검증** — 웹(docs/) 대상으로만 E2E를 돌렸다. `navigator.clipboard`가
  Electron secure context에서 어떻게 동작하는지는 코드 가드로만 대응했고 실기 확인은 못 했다
- `src/pesticide/index.html`의 같은 잔해는 **손대지 않았다** (자기완결 상태 유지). 별 티켓 후보
- `heavy-metal-script.js:1452-1478`의 죽은 참조도 그대로 (가드가 있어 무해). 별 티켓 후보
- `.selected-section` CSS는 pesticide가 아직 쓰므로 남겼다
