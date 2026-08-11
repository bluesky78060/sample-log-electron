# SAMPL-1-148 코드 리뷰

- 리뷰어: code-reviewer 에이전트 (Opus, 독립 레인)
- 판정: **APPROVED** (CRITICAL 0 / MAJOR 0 / MINOR 4 / SUGGESTION 5) — MINOR 4건 모두 반영 후 재검증

## 처리한 MINOR

| # | 지적 | 검증 | 처리 |
|---|---|---|---|
| M-1 | 플랜의 "다른 4타입은 구현 형태가 달라 해당 없음"이 **사실과 다름**. compost `toggleComplete:1019`/`toggleTestResult:1033`는 heavy-metal과 구조적으로 동일한 `if (log) {}` | **확인** — compost 두 함수가 동일 구조, `toggleResult:1050`은 alias. soil `:3838`·pesticide `:2347/:2396`도 인라인 핸들러 안에서 같은 패턴 | **범위 확대해 수정** — water 2곳, compost 2곳, soil 2곳(완료 토글 + 공익직불제 인라인 편집), pesticide 2곳. 총 8곳 추가 |
| M-2 | 조회 경로 E2E의 모달 `hidden` 단언이 **수정 전에도 통과**(초기값이 `class="modal hidden"`) | 타당 — 실질 신호가 토스트 단언 하나뿐이었다 | `_caLogId`가 `null`로 남는지(가드가 대입보다 먼저 실행되는지) 단언으로 교체. **뮤테이션 검증**: 가드 제거 시 실패 확인 |
| M-3 | 저장 E2E에 부정 단언이 없어 "실패 안내 + 성공 처리 동시 발생"을 못 잡음 | 타당 | 성공 토스트 부재 + `compostTestResults_{year}` 미생성 단언 추가 |
| M-4 | 호출부가 상수 참조를 잘못 평가하면 빈 토스트로 가드가 다시 조용해질 수 있음 | 타당 (방어 가치 있음 — 이 티켓의 주제가 그것) | `showToast(message \|\| 기본값)` 정규화 |

SUGGESTION 중 S-5(id 비교 우변 미정규화)는 토글 수정 과정에서 compost 2곳을 `String(id)`로 함께 정리했다.
S-1(가드 조건을 `!groupId`로), S-2(부분 소실 시 위치 매핑 — 선재 이슈), S-3(토글 전용 문구 상수), S-4(`!logId` 로그)는
동작 영향이 없어 미반영. S-2는 관찰 항목으로 기록한다.

## 리뷰어가 검증해 준 사항

- **선택적 3번째 인자 회귀 없음** — 호출부 20곳(정의 1 + 호출 20) 중 3번째 인자를 넘기는 곳은 분석결과 8곳뿐,
  나머지 12곳은 기본값 경로. `notifyEditTargetMissing`은 Base에만 정의되고 오버라이드 없음.
- **`window.BaseSampleManager.ANALYSIS_TARGET_MISSING_MESSAGE` 안전** — 빌드 산출물에서 직접 확인:
  esbuild `__publicField`가 프로퍼티명을 **문자열 리터럴로 보존**하고, 접근부도 동일 이름으로 남는다.
  시점 문제도 없다 — 5개 타입이 `extends window.BaseSampleManager`로 모듈 평가 시점에 전역을 참조하므로
  전역이 없으면 페이지 자체가 뜨지 않는다.
- **soil 가드 위치·조건 정확** — 위험한 `filter`(`:1884`)보다 먼저 차단. `length > 0` ⟹ `groupId` 정의됨(동치).
  정상 그룹 수정은 `length === 2`로 통과하며 기존 회귀 앵커(`edit-mode.spec.js:282`)가 고정.
- **토글 안내는 과잉 아님** — 호출부 4곳 전부 클릭 위임 핸들러(`hm:480,486`, `Base:767,776`),
  목록 렌더 직후 프로그램적 호출 경로 없음 → 토스트 스팸 위험 0. (오케스트레이터도 독립 확인)
- **분석결과 8곳 일관성 확인** — 문구·`{ requestedId }` detail·context 함수명 1:1 일치.
  독립 분석 페이지 4종(`src/*-analysis/`)은 단건 조회를 쓰지 않아(배열 일괄 로드) 이 결함 계열에 해당 없음.
- **`solo-1` 생존 단언 유효** — 가드가 없으면 `filter` → `push` → `persistRecords`가 축소본을 덮어써 실패.
  `JSON.stringify`가 `groupId: undefined` 키를 떨어뜨려 "groupId 없는 레거시 레코드"를 정확히 재현.

## 최종 검증

| 항목 | 결과 |
|---|---|
| 단위 | 271 pass (17 파일) |
| E2E | **219 pass** (기존 216 회귀 없음 + 신규 3) |
| 뮤테이션 검증 (1차) | soil 그룹 가드 + compost 분석결과 가드 제거 → 신규 3건 전부 실패 |
| 뮤테이션 검증 (M-2 교체분) | 조회 가드 제거 → 교체한 `_caLogId` 단언이 실패 |
| 빌드 / `check:docs` | 성공 / 참조 148건 누락 0건 |
| `node --check` | 수정 7파일 전부 통과 |

## M-1 범위 확대 상세 (조용한 실패 10곳 추가)

리뷰 후 전수 재확인해 사용자 단일 액션 경로를 모두 처리했다:

| 파일 | 경로 |
|---|---|
| `water-script.js` | `toggleComplete`, `toggleTestResult` |
| `compost-script.js` | `toggleComplete`, `toggleTestResult`, `updateMaturity`(부숙도), `updateMoisture`(함수율) |
| `soil-script.js` | 완료 토글 인라인 핸들러, 공익직불제 차수/기준년도 인라인 편집 |
| `pesticide-script.js` | 완료 토글, 판정 토글 인라인 핸들러 |
| `heavy-metal-script.js` | `toggleComplete`, `toggleResult` (플랜 C-2 원안) |

### 의도적 제외 (배치 루프 — 개별 스킵이 정상)

- `compost-script.js:2572`, `heavy-metal-script.js:2196` — Firestore 분석결과 판정 동기화 루프
  (`Object.entries(merged)` 순회). 못 찾은 항목 스킵이 정상이며, 안내를 붙이면 토스트 스팸이 된다.
- `heavy-metal-script.js:1224` — 일괄 우편발송일자 `forEach` 루프. 같은 이유.

이로써 direction §1의 "5개 시료 타입 전체에서 조용한 실패·가짜 성공이 하나도 남지 않게"가
**사용자 단일 액션 경로에 대해** 성립한다. 배치 루프는 위와 같이 명시적 비범위다.

## 하네스 갭 (별건 기록)

리뷰어가 지적한 사실: 이 리포에는 **정적 타입·린트 게이트가 없다**.
`npm run lint`은 `echo "No linting configured"` 스텁이고, `typescript-language-server` 미설치로 LSP 진단도 불가.
`node --check`(구문) + 271 단위 + 219 E2E가 그 자리를 대신하고 있다.
이번 결함군(엄격 비교, 필드 유실, 조용한 실패)은 린터/타입 게이트가 기계적으로 잡아줄 수 있는 종류다 → 별건 후보.
