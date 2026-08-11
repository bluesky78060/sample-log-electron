# SAMPL-1-147 구현 플랜 (개정판) — 목록 수정 시 기본정보 저장 실패

- 티켓: SAMPL-1-147 / 우선순위 P2
- 선행: `SAMPL-1-147-direction.md` (Discovery), `SAMPL-1-147-plan-review.md` (1차 리뷰 CHANGES_REQUESTED)
- 개정 사유: 1차 리뷰 CRITICAL 1건 + MAJOR 6건 반영

## 설계 원칙

1. **실패를 숨기지 않는다** — 저장 실패 **및 편집 진입 실패** 경로 전부에 사용자 안내를 남긴다.
2. **원인 차단 + 안전망 이중화** — 편집 상태와 연도 데이터가 어긋나는 상황 자체를 막고, 그래도 어긋나면 알린다.
3. **보존은 명시로, 재발은 테스트로** — 필드 보존은 화이트리스트로 하고, 화이트리스트의 취약점은 키 집합 비교 테스트로 막는다.

## 변경 A — 편집 중 접수번호 자동 덮어쓰기 방지 (안전망)

`src/shared/BaseSampleManager.js`

1. 헬퍼 추가: `isEditing()` → `!!(this.editingId || (this.editingGroupIds && this.editingGroupIds.length))`
2. `loadYearData`의 접수번호 갱신 블록(454-462)을 `if (!this.isEditing() && ...)`로 감싼다.
3. `soil-script.js:3655`, `:3667`의 동일 의도 인라인 가드를 `isEditing()`으로 통일.

> 리뷰 MAJOR 7: `loadYearData` 호출 지점은 `init()`(:101), Base 연도 change(:936/:943), soil 연도 change(:498) **3곳뿐**이다.
> 변경 B가 연도 변경 경로를 막으므로 A는 사실상 **안전망**이며, 단독으로는 신고 증상을 해소하지 못한다.
> 진짜 발생 경로 특정을 위해 변경 C의 실패 분기에 `window.logger` 진단 로그를 남긴다.

## 변경 B — 편집 중 연도 변경: 확인 → 편집 해제 → 연도 실제 반영

`src/shared/BaseSampleManager.js`

1. Base에 편집 해제 계약을 승격: `cancelEditMode() { this.resetForm(); }`
   (soil은 동일 구현이라 무해, pesticide는 필지 정리를 더하는 확장 구현이 자동 사용됨)
2. 가드 메서드:
   ```js
   confirmYearChangeWhileEditing(selectEl, newYear) {
       if (!this.isEditing()) return true;
       if (!confirm('수정 중인 내용이 있습니다. 연도를 변경하면 수정이 취소됩니다. 계속하시겠습니까?')) {
           if (selectEl && this.selectedYear) selectEl.value = this.selectedYear;  // 셀렉트 원복
           return false;
       }
       this.cancelEditMode();                       // 편집 해제 (폼 초기화 포함)
       if (selectEl) selectEl.value = newYear;      // ★ resetForm이 되돌린 값을 새 연도로 재설정
       return true;
   }
   ```
3. `setupYearSelection`의 두 핸들러: **`const newYear = e.target.value`를 최상단에서 선캡처**하고,
   가드가 false면 **조기 return**(`syncYearSelects`도 실행하지 않음), 이후 전부 `newYear` 사용.
4. **`soil-script.js:492`의 오버라이드 `setupYearSelection`에도 동일 적용** (선캡처 + 가드 + `newYear` 사용).

> 리뷰 MAJOR 2가 지적한 핵심: `yearSelect`는 `<form id="sampleForm">` **내부**(water/index.html:185+195 등)이고
> `resetForm()`이 `yearSelect.value = this.selectedYear`로 원복하므로(`BaseSampleManager.js:1386-1387`),
> 선캡처와 재설정 없이는 **편집만 취소되고 연도는 그대로**가 된다.
> 리뷰 Ambiguity: 가드 false 시 `syncYearSelects`까지 건너뛰는 **조기 return**임을 명시한다
> (`selectedYear`만 바뀌면 구 연도 데이터가 새 연도 키에 저장되는 사고 발생).

## 변경 C — 조용한 실패 / 가짜 성공 제거 (저장 + 진입 양쪽)

공통 문구(5개 타입 통일):
`'수정할 데이터를 찾을 수 없습니다. 다른 연도의 데이터일 수 있습니다.'`
+ 실패 시 `window.logger?.warn`로 `editingId`·`selectedYear`·`sampleLogs.length` 기록(원인 특정용).

### 저장 경로

| 파일 | 현재 | 변경 |
|---|---|---|
| `heavy-metal-script.js:335-339` | 찾기 실패와 무관하게 성공 토스트 | `editIdx < 0`이면 실패 토스트 + `return` (saveLogs/resetForm 미실행) |
| `water-script.js:724-725` | `if (!log) return;` | 실패 토스트 + 진단 로그 후 return |
| `compost-script.js:508-538` | `if (log) {...}` (else 없음) | `else` 실패 안내 추가 |
| `soil-script.js:1947`, `pesticide-script.js:808` | `'수정할 데이터를 찾을 수 없습니다.'` | 공통 문구로 갱신 (일관성) |

### 진입 경로 (리뷰 MAJOR 5)

| 파일 | 변경 |
|---|---|
| `BaseSampleManager.js:1266-1267` (`editSample`) | `!log`이면 실패 토스트 + 진단 로그 |
| `water-script.js:410-411` (`editSample`) | 동일 |
| `water-script.js:1970-1971`, `:2197-2198` (분석결과 모달) | 동일 |

> 중금속은 실패 후 `editingId`를 **의도적으로 유지**한다(연도를 되돌려 재시도 가능). 안내 문구가 복구 경로를 제시한다.

## 변경 D — id 비교 정규화

- `water-script.js:414` — Base(`:1268`)와 동일하게 `this.editingId = log.id`
- `water-script.js:724`, `:809`, `:819`, `:1970`, `:2197` — `String(...) === String(...)`
- `compost-script.js:508`, `heavy-metal-script.js:330/331/336`, `soil-script.js:1945` — 동일 정규화

> 리뷰 확인: 그룹 편집·`editingGroupIds`·`persistRecords(removedIds)` 경로는 이미 전부 String 정규화되어 충돌 없음.

## 변경 E — 편집 시 폼 외부 필드 보존

전수 감사 결과(리뷰 검증): **water = `mailDate`**, **중금속 = `mailDate` + `testResult`** 누락.
compost(`Object.assign`) / soil(`...existingLog`) / pesticide(명시 보존)는 누락 없음.

- `water-script.js:769-783` — `mailDate: prev?.mailDate || ''` 추가
- `heavy-metal-script.js:317-337` — `mailDate: existing?.mailDate || ''`, `testResult: existing?.testResult || ''` 추가.
  `find`를 3회(330/331/336) 호출하던 것을 `const existing = ...` 한 번으로 정리.

`...prev` 전체 전개를 쓰지 않는 이유는 리뷰 문서 "반영하지 않은 권고" 참조
(레거시 배열 `samplingLocations` 등이 `water-script.js:448`에서 우선 참조되어 편집 화면이 낡은 값으로 회귀).

## 변경 F — 테스트 (리뷰 MAJOR 6 반영)

### 단위 (`tests/unit/`, 기존 `base-manager.test.js` 패턴 = vitest + jsdom)

1. `isEditing()` — editingId / editingGroupIds / 둘 다 없음 3케이스
2. `confirmYearChangeWhileEditing()` — **확인 시 셀렉트가 `newYear`로 남는지**(변경 B MAJOR 1 회귀 방지), 취소 시 구 연도로 원복 + false
3. `loadYearData` 접수번호 가드 — 편집 중이면 입력칸 값이 유지되는지

### E2E (`tests/e2e/edit-mode.spec.js`, `docs/` 대상)

1. 수질: 목록 → 수정 → 접수번호·성명 변경 → 저장 반영 + 폼 닫힘
2. 수질: `mailDate` 보존 + **수정 전후 레코드 키 집합 비교**(화이트리스트 재발 방지)
3. 중금속: `mailDate` + `testResult` 보존 (CRITICAL 1 회귀)
4. 편집 중 연도 변경 — `dialog.dismiss()`: 연도·편집 상태 유지, 저장 시 정상 반영
5. 편집 중 연도 변경 — `dialog.accept()`: **연도가 실제로 새 연도로 바뀌고** 편집 해제 (MAJOR 1 회귀)
6. 중금속: 저장 대상이 없을 때(`page.evaluate`로 `sampleLogs` 비움) **성공 토스트가 뜨지 않고 실패 안내가 뜨는지** (변경 C 회귀)

## 순서 (리뷰 MAJOR 4 반영)

1. 문서 원본은 `docs-internal/ai-pm/SAMPL-1-147/`에 보관 (git 추적 대상, 빌드 영향 없음)
2. 구현 A → B → C → D → E
3. 테스트 작성 F
4. `npm run test:unit`
5. `npm run build` ← **`docs/`가 비워짐**
6. `docs/00-discovery`·`01-plan`·`02-review`에 원본 **재복사** (플랜 리뷰 가드 통과 유지)
7. `npm test` (E2E, `docs/` 대상)
8. 코드 리뷰 → approve

## 영향 범위

- 공통: `src/shared/BaseSampleManager.js` (5개 시료 타입 전체) — 회귀 위험 최상, 커밋 분리
- 개별: `soil` / `water` / `compost` / `heavy-metal` / `pesticide`(문구 통일만)
- 테스트: `tests/unit/`, `tests/e2e/edit-mode.spec.js` 신규
- 테스트 프로젝트(TS)는 이번 동기화 대상 아님

## 롤백

공통 클래스 변경(A·B)과 타입별 변경(C·D·E)을 **별도 커밋**으로 분리해, 회귀 발생 시 공통 변경만 되돌릴 수 있게 한다.
