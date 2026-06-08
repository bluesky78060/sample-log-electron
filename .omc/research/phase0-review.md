# Phase 0 E2E 안전망 코드 리뷰 (SAMPL-2-13)

- **리뷰 대상**: `git diff bc1c897..139d835 -- tests/` (커밋 229f4d2, 139d835)
- **변경 파일**: `tests/e2e/common-crud-smoke.spec.js` (신규 264줄), `tests/e2e/legacy-migration.spec.js` (신규 165줄), `tests/e2e/form-submission.spec.js` (수정 +52/-19)
- **리뷰 일자**: 2026-06-08
- **검증 방법**: 소스(src/) 대조 + 실제 테스트 실행

---

## 실행 증거

```
npx playwright test common-crud-smoke legacy-migration form-submission
→ 28 passed (19.6s)   (스모크 15 + 마이그레이션 2 + form-submission 11)
```

## src/ 무변경 확인 (관점 5)

`git diff bc1c897..139d835 --name-status` 결과 `tests/e2e/` 3개 파일만 변경 (A/A/M). **src/ 변경 없음 — 통과.**

---

## Strengths

1. **무조건 단언 원칙 준수 (관점 1 통과)** — 등록/수정 시나리오의 핵심 단언(`toContainText(uniqueName)`, `not.toContainText(beforeName)`, `toHaveCount`, `toHaveText('✅'/'⬜'/'✓')`)은 전부 무조건 실행된다. 조건부(`if (isModalVisible)`, `if (!isListVisible)`, completedFilter 가시성 체크)는 모두 플로우 보조에 한정되며 단언을 우회하는 곳은 없다.
2. **기존 약한 단언 실제 제거** — form-submission.spec.js의 `if (hasData) expect(...)` 패턴 2곳(토양/퇴액비)을 무조건 단언으로 교체. 0행이어도 통과하던 구멍이 막혔다.
3. **리팩토링 안전망 가치 높음 (관점 2 통과)** — 핵심 발견: `BaseSampleManager.js:1067`의 기존 `migrateCompletedField`는 5개 타입 오버라이드와 **의미가 다르다** (Base는 `completed:false` 기본값 추가, 오버라이드는 `completed/isCompleted → isComplete` 변환 + 키 삭제). Phase 1에서 5벌→Base 통합 시 실수로 현재 Base 의미를 채택하면 `isComplete`가 설정되지 않아 ✅/✓ 렌더 단언이 즉시 실패한다. 정확히 의도한 회귀를 잡는 시드 테스트다.
4. **부분 문자열 함정 회피** — '완료레거시' ⊂ '미완료레거시' 문제를 인지하고 `tr[data-id="legacy-w1"]`로 행을 특정. `data-id` 설정은 소스에서 확인됨 (water-script.js:145, heavy-metal-script.js:102).
5. **타입별 렌더 차이 정확 반영** — water `✅/⬜`(water-script.js:188), heavy-metal `✓/○`(heavy-metal-script.js:146) 구분이 소스와 일치.
6. **completedFilter 기본값 함정 처리** — 목록 기본 필터가 '미완료'(selected)인 것을 인지하고 완료 항목 단언 전 '전체 상태'로 전환 (legacy-migration 양쪽 테스트).
7. **dialog 핸들러를 클릭 전에 등록** — `page.once('dialog', accept)` 후 `click('#navResetBtn')` 순서로 race 없음 (관점 3 부분 통과).

---

## Issues

### Critical

없음.

### Important (Major)

없음. (아래 Minor 1은 실행 동작에 영향 없는 문서 결함이라 Major로 올리지 않았으나, **Phase 1 착수 전 수정 권장**.)

### Minor

1. **🟡 스모크 spec 헤더 주석 블록이 5건 중 3건 사실과 불일치** — `tests/e2e/common-crud-smoke.spec.js:25-29`
   - **soil**: 주석 "name 유지(비워지지 않음)" ← **틀림**. `src/soil/soil-script.js:3419-3429` `resetFormKeepReceptionInfo()`는 `this.form.reset()`을 호출하므로 `#name`은 비워지고 접수번호/날짜만 복원된다. **TYPES 설정 `nameCleared:true`(44행)와 인라인 주석이 맞고, 헤더 주석이 틀렸다 (관점 4 판정: 잘못된 동작 고정 아님 — 실행되는 단언은 실제 src 동작과 일치).**
   - **compost**: 주석 "직접 resetForm()" ← 틀림. `src/compost/compost-script.js:905-908`에 `confirm()` 있음 (설정 `needsConfirm:true`는 맞음).
   - **heavy-metal**: 주석 "confirm() → resetForm()" ← 틀림. `src/heavy-metal/heavy-metal-script.js:1139`는 confirm 없이 `this.resetForm()` 직접 호출 (resetForm 본문 :465에도 confirm 없음).
   - 리스크: 안전망 spec의 동작 명세표가 부정확하면 Phase 1 리팩토러가 "soil은 name 유지가 의도"라고 오독하고 동작을 바꿀 수 있다. 주석 3곳 수정 필요.
2. **🟡 heavy-metal `needsConfirm:true` 설정 오류** — `common-crud-smoke.spec.js:106` 부근. 소스에 confirm이 없으므로 `page.once('dialog')` 핸들러는 영원히 발화하지 않는 죽은 핸들러다. 현재는 무해(테스트 통과 확인)하나, 향후 해당 페이지에 다른 dialog가 생기면 의도치 않게 auto-accept할 수 있다. `needsConfirm:false`로 수정 권장.
3. **🟡 `nameCleared` else 분기가 데드 코드** — `common-crud-smoke.spec.js:253-259`. 5개 타입 모두 `nameCleared:true`이므로 else(약한 단언 `not.toHaveValue('')`)는 절대 실행되지 않으며, 그 안의 주석("soil: name 유지")도 1번과 같은 오류를 반복한다. 분기 제거 또는 주석 정정 권장.

### Suggestion

1. **🔵 고정 `waitForTimeout` 다수 (관점 3)** — 테스트당 200~500ms 고정 슬립 4~6회 (smoke:166,172,200,210,228,246 등). 현재 로컬 28개 19.6s 전부 통과 + CI는 workers=1·retries=2로 완화되지만, CI 부하 시 flake의 전형적 원인. `expect().toContainText()` 자동 폴링이 이미 대부분을 커버하므로 모달 닫힘은 `expect(resultModal).toBeHidden()` 등으로 대체 가능. `localStorage.clear→reload→networkidle` 패턴 자체는 안전 (clear로 firebase_config 제거 → 네트워크 미발생 확인).
2. **🔵 소스 라인번호 하드코딩 주석** — legacy-migration.spec.js 헤더의 "water-script.js:116-126", "heavy-metal-script.js:52-62", "BaseSampleManager.loadYearData:420" 등은 현재 정확함을 확인했으나(420행 호출, 메모리만 변환·재저장 없음 — 렌더 단언 선택은 타당), Phase 1 리팩토링 후 즉시 낡는다. 함수명 위주 서술 권장.
3. **🔵 heavy-metal purpose 라디오를 `evaluate(el => el.click())`로 클릭** — Playwright 액션 가능성 검사를 우회한다. 같은 파일의 분석항목처럼 label 클릭 방식으로 통일 권장.

---

## 집계

🔴 CRITICAL: 0 / 🟠 MAJOR: 0 / 🟡 MINOR: 3 / 🔵 SUGGESTION: 3

## Assessment: **APPROVED**

- 핵심 단언은 전부 무조건이며 src 실제 동작과 일치한다 (soil 리셋의 name 비움 포함 — 헤더 주석만 틀렸고 코드는 맞음).
- migrateCompletedField Base 통합 시 의미 차이(Base의 completed:false 기본값 vs 오버라이드의 isComplete 변환)로 인한 회귀를 정확히 잡는 안전망이다.
- 28개 테스트 전체 통과 실행 증거 확보, src/ 무변경 확인.
- 조건: Phase 1 착수 전 Minor 1~3(주석 정정, needsConfirm:false, 데드 분기 정리) 후속 처리 권장 — 블로킹 아님.
