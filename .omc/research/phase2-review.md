# SAMPL-2-15 코드 리뷰 — L1 Phase 2 (편집 상태 통일 + editSample/resetForm Template Method)

리뷰 대상: `git diff 3b6e4ef..HEAD -- src/ tests/` (커밋 7개, 빌드 커밋 제외)
검증: `node --check` 6파일 통과 / vitest 38/38 통과 / E2E 202/202(사전 확인)

---

## Strengths

- **Task 2-1 변수 통일 완전**: `grep "editingLogId\|editingGroupId\b"` → **0건**, `editingGroupLogs`/`editingGroupId` 잔존 참조도 0건. soil 그룹 삭제/단건 삭제/일괄 삭제 경로(soil:538/572/1704/3834), subCategory change 핸들러(soil:3362)까지 새 변수명(`editingId`/`editingGroupIds`)을 일관되게 사용.
- **soil 그룹 편집 재구성 등가성**: 기존 `this.editingGroupLogs` 스냅샷을 `editingGroupIds.map(find).filter(Boolean)`로 복원(soil:1606-1609). `editingGroupIds`가 순서 보존 배열이라 `existingLogIdx` 위치 매핑(id/createdAt/isComplete 승계)과 `groupId = oldGroupLogs[0]?.groupId`가 원본과 동등.
- **water/compost 날짜 보존 정책 정확 수용**: 원본 resetForm은 접수번호를 저장→복원했다가 `generateNextReceptionNumber()`로 다시 덮어쓰는 구조(복원은 사실상 dead). 신규는 `shouldPreserveDateOnReset()=true`로 날짜만 보존, 접수번호는 Base가 재생성 → 순효과 동일. water `dataset.baseNumber` 동기화도 onAfterFormReset에서 보존(water:528).
- **soil/pesticide 토스트 미표시 보존**: 두 타입은 `switchToEditFormView()`를 직접 DOM 토글+scrollIntoView(토스트 없음)로 오버라이드 → 원본의 "토스트 없이 폼 전환" 동작 정확히 유지(soil:1996-2005, pesticide:984-994).
- **heavy-metal 이중 클래스 분리 정확**: 수령방법 버튼이 `active`(+hidden input)는 Base `populateReceptionMethod`, `selected`는 타입 훅이 담당 — 원본의 `active`+`selected` 동시 토글을 호출 순서(common→typeSpecific) 보장으로 재현(heavy-metal:362-365).
- **editingId 정합성 개선**: Base.editSample이 `editingId = log.id`(정규 id)로 설정 → compost(496)·heavy-metal(297-324) 단순 `l.id === editingId` 비교가 항상 성립. 기존 `editingId = id`(dataset 문자열)보다 타입 안전.
- **그룹 편집 경로 보존**: soil populateFormForGroupEdit, water 멤버 다행 전개, pesticide N행 재구성 모두 삭제되지 않고 유지. water/pesticide는 Base 템플릿 대신 자체 editSample 유지하며 공통부만 `populateCommonFields`/`enterEditModeUI`에 위임.
- **null 가드 강화**: 원본 water/compost/pesticide는 `this.birthDateField.classList…`를 무가드 접근 → Base populateApplicantType은 모든 요소에 `if` 가드 추가(회귀 아닌 안전성 향상).
- **L2 무간섭**: saveLogs/deleteSample/loadYearData/_retryCloudSyncAction 영역 변경 없음. soil saveLogs 오버라이드 보존. soil `resetFormKeepReceptionInfo` 별도 UX(soil:3310, navReset 바인딩 4057) 유지. cancelEditMode↔resetForm 관계는 역전(이제 cancel→Base.resetForm)되었으나 무한재귀 없음(Base.resetForm는 cancelEditMode 미호출).

## Issues

### Critical
- 없음

### Important
- 없음

### Minor
- 🟡 **heavy-metal 편집 토스트 문구 변경** (heavy-metal-script.js, `switchToEditFormView` 미오버라이드 → Base 기본 사용): 원본 `'수정 모드입니다.'` → Base 기본 `'수정 모드입니다. 변경 후 등록 버튼을 클릭하세요.'`. 기능 동작은 동일(폼 전환·navSubmitBtn)하나 사용자 노출 문구가 길어짐. water/compost는 원래 긴 문구라 통일 효과지만, heavy-metal만 문구가 바뀐 점은 계획에 명시되지 않음. 의도적 통일이면 수용 가능.

### Suggestion
- 🔵 **pesticide resetForm의 navSubmitBtn 복원 추가**: 원본 pesticide `resetForm`은 navSubmitBtn을 복원하지 않았으나(복원은 cancelEditMode에만 존재), 신규는 Base.resetForm 경유로 항상 복원. 편집상태 해제 시 버튼 복원이 더 정합적이므로 개선으로 판단되나 동작 추가임을 기록.
- 🔵 **soil 그룹 복원 견고성**: `oldGroupLogs`를 sampleLogs에서 `find`+`filter(Boolean)`로 재구성하므로, 멤버 id가 누락되면 위치 매핑이 한 칸 밀릴 수 있음. 편집 중 그룹 멤버 삭제 시 cancelEditMode로 편집이 취소되어 실무상 안전하나, 기존 스냅샷 방식보다 미세하게 취약. 방어적으로 길이 불일치 가드를 고려할 수 있음(필수 아님).

## 집계

🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 1건 / 🔵 SUGGESTION: 2건

→ 판정: **APPROVED**

행동 보존 리팩토링으로서 5개 타입의 편집/리셋 동작이 원본과 등가임을 정독 확인. 발견된 항목은 모두 비차단(문구 통일 1, 개선/견고성 제안 2)이며 CRITICAL·MAJOR 0건.
