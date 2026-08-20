# SAMPL-2-36 코드 리뷰 — main의 npm test 빨간불 (수질·중금속 E2E 14건)

## 대상

| 파일 | 변경 |
| --- | --- |
| `tests/e2e/list-row-actions.spec.js` | 대기 조건 강화 + 렌더 검증 단언 추가 |
| `tests/e2e/entity-display.spec.js` | 동일 |
| `src/shared/BaseSampleManager.js` | `renderLogs` 조용한 폴백에 경고 / `initPagination` 사각지대 경고 |

## 진단 근거 (실측)

수정 전 `origin/main`(d375c42):

```text
npm test → 365 tests, 347 passed / 4 skipped / 14 failed, E2E_EXIT=1
```

실패는 수질·중금속에만 몰렸다. **제품 결함이 아님**을 실사용 경로로 확인했다:

```text
REAL_water       = {logs:3, tableBody:"logTableBody", pagination:true,  rows:3, btnEdit:3}
REAL_heavy-metal = {logs:3, tableBody:"logTableBody", pagination:true,  rows:3, btnEdit:3}
REAL_soil        = {logs:3, tableBody:"logTableBody", pagination:false, rows:5, btnEdit:3}
```

하네스 시점 상태:

```text
PROBE_water = {preparedLen:3, hasPagination:false, tableBody:"NULL", rowsAfter:0}
PROBE_soil  = {preparedLen:3, hasPagination:false, tableBody:"logTableBody", rowsAfter:5}
```

`mgr.cacheElements()`를 수동 호출하면 `{before:"NULL", after:"logTableBody", rows:3}`로 즉시 정상.
→ **원인은 타이밍**이며, `renderLogs`의 `if (this.tableBody)` 가드가 그것을 조용히 삼켰다.

## 독립 리뷰 레인

- **gemini: 미수행** — `GOOGLE_CLOUD_PROJECT` 미설정으로 CLI가 거부.
  SAMPL-1-156 리뷰에서와 같은 한계다. **실행하지 않은 검증을 통과로 적지 않는다.**
- **codex: 수행** — 판정 **CHANGES_REQUESTED** (CRITICAL 0 / MAJOR 1 / MINOR 2 / SUGGESTION 1)

### codex 지적과 대응

| 심각도 | 지적 | 대응 |
| --- | --- | --- |
| MAJOR | `!!mgr.tableBody`는 DOM 참조 할당일 뿐 초기화 완료가 아니다. 이후 초기화가 렌더 결과를 덮을 수 있다 | 최종 상태를 **자동 재시도되는 `toHaveCount`**로 직접 기다리도록 변경. 늦게 끝난 초기화가 행을 덮어써도 잡힌다 |
| MINOR | `not.toHaveCount(0)`은 1건만 그려져도, 남의 데이터가 그려져도 통과 | `.btn-edit` **3건 전부** + **우리가 심은 id**(`[data-id="row1"]`)까지 단언. entity-display는 `RECORD.id`로 단언 |
| MINOR | `renderLogs` 경고가 복구 가능한 초기화 경쟁에서도 잡음이 된다 / `pagination`이 있고 그 안의 tableBody가 없는 경우는 진단 안 됨 | 인스턴스당 **1회만** 기록(`_warnedNoTableBody`) + `initPagination`에서 `tableBody` 부재를 별도 경고해 사각지대 제거 |
| SUGGESTION | `waitForTimeout(400)` 고정 대기 제거 | **미채택.** `switchView` 직후 안정화 목적이 남아 있고, 이번 실패의 원인이 아니다. 대신 뒤따르는 `toHaveCount`가 자동 재시도하므로 고정 대기에 의존하지 않는다 |

## 변이 검증

| 변이 | 결과 |
| --- | --- |
| 대기 조건을 `!!window[m]`만으로 되돌린다 | 수질·중금속 **재실패** (검출) |
| 심는 건수를 3 → 2로 줄인다 | `심은 3건이 모두 렌더되지 않았다` **실패** (검출) |
| 심는 id를 `row1` → `other1`로 바꾼다 | `그려진 행이 우리가 심은 레코드가 아니다` **실패** (검출) |

세 변이 모두 검출됐다 — 단언이 껍데기가 아님을 실증한다.

### codex 2라운드 — 수정본 재리뷰

> 규칙(`~/.claude/rules/ai-pm-ticket.md`): **찾은 쪽과 고친 쪽이 다르면 수정본을 다시 리뷰에
> 넣는다. 수정본은 아무도 검토하지 않은 새 코드다.**

1라운드 지적을 반영한 diff를 그대로 다시 넣고, 네 지점을 콕 집어 물었다:
`_warnedNoTableBody` 지연 초기화 / `initPagination` 경고가 정상 흐름에서 뜨는지 /
`.btn-edit` 3건 단언이 5개 타입 전부에서 타당한지(토양 농가 구분선) /
`entity-display`의 `RECORD.id` 셀렉터 실재 여부.

**결과: CRITICAL 0 / MAJOR 0 / MINOR 0 / SUGGESTION 0 — 새 결함 없음.**

- `_warnedNoTableBody`는 데이터가 있고 `tableBody`가 없을 때만 지연 초기화되며 인스턴스당 1회
- `initPagination` 경고는 정상 순서(`cacheElements()` → `initPagination()`)에서 뜨지 않는다
- 토양 농가 구분선 행에는 `.btn-edit`이 없어 3건 단언에 영향 없다
- 다섯 타입 모두 `data-id`에 실제 레코드 id를 넣으므로 셀렉터가 유효하다

> ⚠️ codex는 `node --check`까지만 했고 **Playwright는 실행하지 못했다**
> (샌드박스가 포트 8899 listen을 거부, `EPERM`). E2E 실증은 이쪽 실행 결과가 근거다.

## 최종 검증

| 항목 | 결과 |
| --- | --- |
| 빌드 | 성공, `docs/`를 소스와 함께 커밋 |
| 단위 | **421 pass** (20 파일) |
| E2E | **361 pass / 4 skip / 0 fail**, `E2E_EXIT=0` (수정 전 14 fail) |
| `npm run typecheck` | **0건** (1차 시도에서 TS2339 2건이 잡혀 `/** @type {any} */` 캐스트로 수정) |
| `npm run check:docs` | 참조 143건, 누락 **0건** |
| `npm run lint` | **미구성** — 이 저장소의 lint는 `echo "No linting configured"`. 실행하지 않은 검증을 통과로 적지 않기 위해 `skip` 제출 |

## 남은 한계

- **gemini 레인 미수행** (위 사유). 다중 모델 교차는 codex 1레인 + 적대적 변이 검증으로 대체했다.
- 이 수정은 **하네스와 진단**을 고쳤을 뿐, water/heavy-metal의 초기화가 soil보다 늦게
  `cacheElements()`에 도달하는 **구조 자체는 그대로**다. 실사용에는 영향이 없음을 확인했으나
  (위 REAL_* 실측), 초기화 순서를 타입 간에 맞추는 것은 별건으로 남는다.
- `waitForTimeout(400)` 고정 대기는 두 스펙에 그대로 남아 있다 (SUGGESTION 미채택 사유 위 참조).

## 판정

🔴 CRITICAL: 0건 / 🟠 MAJOR: 1건 (수정 완료) / 🟡 MINOR: 2건 (수정 완료) / 🔵 SUGGESTION: 1건 (미채택, 사유 기록)

2라운드(수정본 재리뷰): CRITICAL 0 / MAJOR 0 / MINOR 0 / SUGGESTION 0

→ **APPROVED**
