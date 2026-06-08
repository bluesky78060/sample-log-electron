# L1 코드 중복 제거 — Template Method 공통화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 5개 시료 스크립트(합계 ~16,800줄)에 분산된 280~800줄의 중복을 BaseSampleManager Template Method로 흡수해 "1곳 수정 = 5개 타입 반영" 구조를 만든다.

**Architecture:** 위험도 오름차순 4-Phase. Phase 0(안전망) → Phase 1(무충돌 즉시 승격 — 쉬움 3종 + 순수 유틸 2종) → Phase 2(상태 통일 후 editSample/resetForm) → Phase 3(submitForm 부분 공통화 + 블록 중복). 각 Phase = 독립 AI PM 티켓, 매 단계 E2E 그린 유지.

**Tech Stack:** Vanilla JS (window.* 전역), vitest (단위), Playwright (E2E), 기존 훅 관례 준수 (`on{Before|After}*`/`get*()`/truthy-교체 계약)

**근거 자료:** `.omc/research/l1-duplication-analysis.md` (2026-06-08 정밀 조사 — 모든 file:line 인용의 출처)

---

## 전체 로드맵

| Phase | 내용 | 위험도 | 예상 절감 | 티켓 |
|-------|------|--------|----------|------|
| 0 | E2E 안전망 보강 (선행 필수) | — | 0줄 (테스트 +250줄) | SAMPL 신규 #1 |
| 1 | 무충돌 즉시 승격 5건 | 낮음 | ~250줄 | SAMPL 신규 #2 |
| 2 | 상태 통일 + editSample/resetForm | 중간 | ~300줄 | SAMPL 신규 #3 |
| 3 | submitForm 부분 공통화 + 블록 4종 | 높음 | ~250줄 | SAMPL 신규 #4 |

**중단 가능 설계**: 각 Phase는 독립적으로 가치가 있고, 어느 Phase에서 멈춰도 코드베이스는 이전보다 좋은 상태로 남는다.

---

# Phase 0: E2E 안전망 보강 (선행 필수)

> 조사 §5 결론: 현 E2E는 리팩토링 안전망으로 불충분. soil 제출/수정만 실질 보호, **pesticide·heavy-metal은 6개 메서드 전부 무방비**, soil 단언 일부는 `if (hasData)` 조건부라 0행이어도 통과.

### Task 0-1: 5개 타입 공통 스모크 E2E (파라미터라이즈드)

**Files:**
- Create: `tests/e2e/common-crud-smoke.spec.js`

- [ ] **Step 1: 파라미터라이즈드 스모크 테스트 작성**

```javascript
// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * L1 리팩토링 안전망: 5개 시료 타입 공통 CRUD 스모크
 * 등록 → 목록 단언(무조건) → 수정 → 단언 → 리셋
 */
const TYPES = [
    { key: 'soil',        path: '/soil/',        name: '토양' },
    { key: 'water',       path: '/water/',       name: '수질분석' },
    { key: 'compost',     path: '/compost/',     name: '퇴비' },
    { key: 'heavy-metal', path: '/heavy-metal/', name: '중금속' },
    { key: 'pesticide',   path: '/pesticide/',   name: '잔류농약' },
];

for (const t of TYPES) {
    test.describe(`${t.name} CRUD 스모크`, () => {
        test.beforeEach(async ({ page }) => {
            await page.goto(t.path);
            await page.evaluate(() => localStorage.clear());
            await page.reload();
            await page.waitForLoadState('networkidle');
        });

        test('등록 → 목록 반영 (무조건 단언)', async ({ page }) => {
            await page.fill('#name', `스모크${t.key}`);
            await page.fill('#phoneNumber', '010-1234-5678');
            // 타입별 필수 필드는 기본값/첫 옵션으로 충족된다고 가정하되,
            // 제출 실패 시 토스트/검증 메시지를 캡처해 단언 실패 사유를 남긴다
            await page.click('#navSubmitBtn');
            // 결과 모달 닫기 (있으면)
            const modalClose = page.locator('.modal .btn-close, .modal-close').first();
            if (await modalClose.isVisible({ timeout: 2000 }).catch(() => false)) {
                await modalClose.click();
            }
            await page.click('a[href="#list"], #navListBtn');
            await expect(page.locator('#logTableBody')).toContainText(`스모크${t.key}`);
        });

        test('수정 → 변경 반영', async ({ page }) => {
            // 등록
            await page.fill('#name', `수정전${t.key}`);
            await page.fill('#phoneNumber', '010-1111-2222');
            await page.click('#navSubmitBtn');
            const modalClose = page.locator('.modal .btn-close, .modal-close').first();
            if (await modalClose.isVisible({ timeout: 2000 }).catch(() => false)) {
                await modalClose.click();
            }
            await page.click('a[href="#list"], #navListBtn');
            // 수정 진입
            await page.locator('#logTableBody .btn-edit').first().click();
            await page.fill('#name', `수정후${t.key}`);
            await page.click('#navSubmitBtn');
            const modalClose2 = page.locator('.modal .btn-close, .modal-close').first();
            if (await modalClose2.isVisible({ timeout: 2000 }).catch(() => false)) {
                await modalClose2.click();
            }
            await page.click('a[href="#list"], #navListBtn');
            await expect(page.locator('#logTableBody')).toContainText(`수정후${t.key}`);
            await expect(page.locator('#logTableBody')).not.toContainText(`수정전${t.key}`);
        });

        test('리셋 → 폼 비움', async ({ page }) => {
            await page.fill('#name', '리셋테스트');
            await page.click('#navResetBtn');
            await expect(page.locator('#name')).toHaveValue('');
        });
    });
}
```

> ⚠️ 셀렉터(`#navSubmitBtn`, `#logTableBody`, `.btn-edit` 등)는 기존 spec(form-submission.spec.js, edit-test.spec.js)에서 검증된 것을 사용하되, 타입별 필수 필드 차이로 제출이 막히면 **해당 타입의 최소 필수 필드를 beforeEach에 추가**한다 (heavy-metal은 명시적 필수검증 7건 — heavy-metal-script.js:298-364 참조).

- [ ] **Step 2: 실행 — 5개 타입 통과 확인**

Run: `npm run build && npx playwright test tests/e2e/common-crud-smoke.spec.js`
Expected: 15 passed (3 테스트 × 5 타입). 실패 타입은 필수 필드 보강 후 재실행.

- [ ] **Step 3: 기존 약한 단언 강화**

`tests/e2e/form-submission.spec.js:44-48`의 `if (hasData)` 조건부 단언을 무조건 단언으로 교체:

```javascript
// 기존: if (hasData) { expect(...) }  → 0행이어도 통과하는 약한 단언
// 교체:
await expect(page.locator('#logTableBody')).toContainText('홍길동');
```
(해당 spec의 실제 변수명/검증 대상에 맞춰 적용)

- [ ] **Step 4: migrateCompletedField 시드 테스트 추가**

`tests/e2e/legacy-migration.spec.js` 생성:

```javascript
const { test, expect } = require('@playwright/test');

test('레거시 completed 필드가 isComplete로 마이그레이션된다', async ({ page }) => {
    await page.goto('/water/');
    const year = new Date().getFullYear();
    await page.evaluate((y) => {
        localStorage.setItem(`waterSampleLogs_${y}`, JSON.stringify([
            { id: 'legacy1', receptionNumber: '1', name: '레거시', completed: true },
            { id: 'legacy2', receptionNumber: '2', name: '미완료', isCompleted: false }
        ]));
    }, year);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const migrated = await page.evaluate((y) =>
        JSON.parse(localStorage.getItem(`waterSampleLogs_${y}`) || '[]'), year);
    // 마이그레이션 후 isComplete 체계로 통일, 레거시 키 제거
    expect(migrated.find(l => l.id === 'legacy1').isComplete).toBe(true);
    expect(migrated.find(l => l.id === 'legacy1').completed).toBeUndefined();
});
```

> 주의: 마이그레이션 결과가 localStorage에 즉시 재기록되지 않으면(메모리만 변환) 단언 대상을 테이블 렌더 결과(완료 배지)로 바꾼다 — 실행 시 실제 동작 확인 후 조정.

- [ ] **Step 5: 전체 회귀 + 커밋**

Run: `npm test`
Expected: 기존 185 + 신규 ~17 모두 PASS

```bash
git add tests/e2e/common-crud-smoke.spec.js tests/e2e/legacy-migration.spec.js tests/e2e/form-submission.spec.js
git commit -m "test: L1 리팩토링 안전망 — 5타입 CRUD 스모크 + 레거시 마이그레이션 시드 테스트 (Phase 0)"
```

---

# Phase 1: 무충돌 즉시 승격 (쉬움 5건, ~250줄 절감)

> 조사 §6 결론: 저장·삭제와 무관한 항목들은 soil 충돌 없이 즉시 승격 가능.

### Task 1-1: `splitLegacyAddress` 순수 헬퍼 (TDD) — 6곳+3곳 흡수

**Files:**
- Modify: `src/shared/utils.js` (window.SampleUtils에 함수 추가 — 기존 관례)
- Test: `tests/unit/utils-address.test.js` (Create)
- Modify (교체): soil-script.js:2037-2045, 2147-2155 / water-script.js:498-506 / compost-script.js:652-660 / heavy-metal-script.js:390-398 / pesticide-script.js:1069-1077

- [ ] **Step 1: 실패하는 단위 테스트 작성**

```javascript
const { test } = require('node:test'); // 또는 vitest — 기존 tests/unit 관례 따름
const assert = require('node:assert');
// utils.js의 듀얼 export 보장 후 require (sync-utils.js 선례)

test('우편번호 prefix가 있으면 분리한다', () => {
    assert.deepStrictEqual(
        SampleUtils.splitLegacyAddress('(36231) 경북 봉화군 봉화읍 내성로 39'),
        { postcode: '36231', road: '경북 봉화군 봉화읍 내성로 39' }
    );
});
test('prefix가 없으면 전체를 road로 반환한다', () => {
    assert.deepStrictEqual(
        SampleUtils.splitLegacyAddress('경북 봉화군 봉화읍'),
        { postcode: null, road: '경북 봉화군 봉화읍' }
    );
});
test('null/빈 문자열은 양쪽 null', () => {
    assert.deepStrictEqual(SampleUtils.splitLegacyAddress(''), { postcode: null, road: null });
    assert.deepStrictEqual(SampleUtils.splitLegacyAddress(null), { postcode: null, road: null });
});
```

- [ ] **Step 2: utils.js에 구현 + 듀얼 export (sync-utils.js:178-193 선례)**

```javascript
/**
 * 레거시 "(우편번호) 주소" 문자열 분리
 * 6곳 중복(editSample/populateFormForEdit) + 라벨 인쇄/테이블 변형 3곳을 대체
 * @param {string|null} address
 * @returns {{postcode: string|null, road: string|null}}
 */
function splitLegacyAddress(address) {
    if (!address) return { postcode: null, road: null };
    const m = address.match(/^\((\d{5})\)\s*(.+)$/);
    return m ? { postcode: m[1], road: m[2] } : { postcode: null, road: address };
}
```

- [ ] **Step 3: BaseSampleManager에 적용 헬퍼 추가**

폼 채우기 6곳이 공유할 적용 메서드 (Base에 추가 — Phase 2의 populateCommonFields가 이를 재사용):

```javascript
    /**
     * 레거시 address 문자열을 주소 입력 필드(addressPostcode/addressRoad)에 반영
     * addressRoad가 이미 있으면 건드리지 않음 (6곳 중복 코드의 공통 계약)
     * @param {Object} log - 시료 레코드
     */
    applyLegacyAddress(log) {
        if (log.addressRoad || !log.address) return;
        const { postcode, road } = window.SampleUtils.splitLegacyAddress(log.address);
        const postcodeEl = this.addressPostcode || document.getElementById('addressPostcode');
        const roadEl = this.addressRoad || document.getElementById('addressRoad');
        if (postcode && postcodeEl) postcodeEl.value = postcodeEl.value || postcode;
        if (roadEl) roadEl.value = road;
    }
```

- [ ] **Step 4: 6곳 교체 (한 파일씩, 파일마다 E2E 스모크 실행)**

각 위치의 9줄 블록을 `this.applyLegacyAddress(log);` 1줄로 교체 (soil 그룹수정본은 `firstLog` 전달). heavy-metal은 지역변수 방식이므로 교체 시 주변 코드의 변수 의존 확인.

Run per-file: `npm run build && npx playwright test tests/e2e/common-crud-smoke.spec.js`

- [ ] **Step 5: 커밋**

```bash
git commit -m "refactor: 레거시 주소 파싱 6벌 → splitLegacyAddress/applyLegacyAddress 공통화 (L1 Phase 1)"
```

### Task 1-2: `migrateCompletedField` — Base 본문 교체 + 5벌 삭제

**Files:** Modify: `src/shared/BaseSampleManager.js:1067-1075`, 5개 스크립트의 해당 메서드 삭제 (soil:247-260, water:116-126, compost:176-189, heavy-metal:52-62, pesticide:273-286)

- [ ] **Step 1: Base 구현을 서브클래스 superset 버전으로 교체**

> ⚠️ 현재 Base 구현은 `completed: false`를 부여하는 **반대 방향 로직** — 5개 서브클래스 전부가 폐기한 체계다. isComplete 체계로 교체:

```javascript
    /**
     * 레거시 완료 필드 마이그레이션: completed/isCompleted → isComplete 통합
     * (구 Base의 completed 체계는 5개 타입 전부가 폐기 — isComplete가 현행)
     * @param {Array} logs
     * @returns {Array}
     */
    migrateCompletedField(logs) {
        return logs.map(log => {
            const migrated = { ...log };
            if (migrated.isComplete === undefined) {
                if (migrated.completed !== undefined) migrated.isComplete = !!migrated.completed;
                else if (migrated.isCompleted !== undefined) migrated.isComplete = !!migrated.isCompleted;
                else migrated.isComplete = false;
            }
            delete migrated.completed;
            delete migrated.isCompleted;
            return migrated;
        });
    }
```

(교체 전 5개 서브클래스 구현을 읽고 위 superset이 전부를 포괄하는지 확인 — soil/compost/pesticide의 "undefined → false 기본값"과 water/heavy-metal의 단순 매핑 모두 포함됨)

- [ ] **Step 2: 5개 서브클래스의 동명 메서드 삭제 → Step 3: Phase 0의 legacy-migration.spec + 전체 E2E → Step 4: 커밋**

```bash
git commit -m "refactor: migrateCompletedField 5벌 제거 — Base superset 구현으로 통합 (L1 Phase 1)"
```

### Task 1-3: `prepareDataForRender` — Base 정렬 기본 구현

**Files:** Modify: BaseSampleManager.js:1050-1052, 삭제: water:131-138, compost:195-201, heavy-metal:67-73 (soil:266-268·pesticide:329-337의 flatten 오버라이드는 유지)

- [ ] **Step 1: Base 기본 구현을 접수번호 정렬로 교체**

```javascript
    /**
     * 렌더 전 데이터 가공 — 기본: 접수번호 숫자 오름차순 정렬
     * (soil/pesticide는 flattenLogsForTable 오버라이드 유지)
     */
    prepareDataForRender(logs) {
        return [...logs].sort((a, b) =>
            (parseInt(a.receptionNumber, 10) || 0) - (parseInt(b.receptionNumber, 10) || 0));
    }
```

- [ ] **Step 2: water/compost/heavy-metal 3벌 삭제 → E2E → 커밋**

```bash
git commit -m "refactor: prepareDataForRender 3벌 제거 — Base 정렬 기본 구현 (L1 Phase 1)"
```

### Task 1-4: `filterAndRenderLogs` — Base 공통 4조건 + 타입 훅

**Files:** Modify: BaseSampleManager.js:982-984, 삭제: water:1287-1321, compost:1903-1940, heavy-metal:1017-1050, pesticide:1675-1708, 축소: soil:2262-2344 (훅 오버라이드로)

- [ ] **Step 1: Base 구현 — 공통 4조건 (4개 타입의 문자 단위 동일 코드를 기준으로)**

water-script.js:1287-1321을 원본으로 Base에 이식하되, 마지막에 타입 훅 추가:

```javascript
    filterAndRenderLogs() {
        const filtered = this.sampleLogs.filter(log =>
            this.matchesNameFilter(log) &&
            this.matchesReceptionFilter(log) &&
            this.matchesDateFilter(log) &&
            this.matchesCompletedFilter(log) &&
            this.matchesTypeSpecificFilters(log)   // 훅 (기본 true)
        );
        this.renderLogs(filtered);
        this.updateSearchButtonState();
    }

    /** 타입 고유 필터 훅 — soil이 필지/목적 조건으로 오버라이드 */
    matchesTypeSpecificFilters(log) { return true; }
```

(4개 보조 매처는 water 구현의 조건식을 메서드로 분해 — 구현 시 water 원본의 `extractReceptionNumber` 의존이 Base에 존재하는지 확인, 없으면 함께 이식)

- [ ] **Step 2: 4개 타입 메서드 삭제, soil은 `matchesTypeSpecificFilters`로 lot/purpose 조건(soil:2284-2331)만 남기고 골격 삭제**

- [ ] **Step 3: `updateSearchButtonState` 동일 패턴이면 `getFilterKeys()` 훅으로 함께 흡수 (구현 시 5곳 비교 후 판단 — 차이가 키 목록뿐이면 진행, 구조가 다르면 스킵하고 백로그)**

- [ ] **Step 4: E2E (search-filter.spec 포함) → 커밋**

```bash
git commit -m "refactor: filterAndRenderLogs 5벌 → Base 공통 4조건 + matchesTypeSpecificFilters 훅 (L1 Phase 1)"
```

### Task 1-5: `getGroupMembers` — Base 승격 (2벌 삭제)

**Files:** Modify: BaseSampleManager.js (메서드 추가), 삭제: water-script.js:444-465, pesticide-script.js:1000-1021 (문자 단위 동일 — 조사 §4.2)

- [ ] **Step 1: water 원본을 Base로 이동 (무변형) → Step 2: 2벌 삭제 → Step 3: E2E → 커밋**

```bash
git commit -m "refactor: getGroupMembers 2벌 제거 — Base 승격 (L1 Phase 1)"
```

### Task 1-6: Phase 1 마무리

- [ ] 빌드 + 전체 E2E + `npm run test:unit` → AI PM submit_test → 코드 리뷰 → approve_review
- [ ] 절감 측정: `git diff --stat <phase1-시작>..HEAD -- src/` 로 실제 감소 줄수 기록

---

# Phase 2: 상태 통일 + editSample/resetForm 승격 (~300줄 절감)

> 선행 조건: Phase 0·1 완료. 조사 §6.5: soil의 편집 상태 변수(`editingLogId`/`editingGroupId`)가 Base(`editingId`)와 불일치 — 통일이 선결.

### Task 2-1: 편집 상태 변수 통일

- [ ] soil의 `editingLogId` → `editingId`, `editingGroupId`/`editingGroupLogs` → Base에 `editingGroupIds` 정식 필드 추가 (water/pesticide가 이미 사용하는 이름으로 표준화). soil 내 전체 치환 + heavy-metal의 getElementById 직접 사용을 this 캐시로 통일.
- [ ] 검증: `grep -rn "editingLogId\|editingGroupId" src/` 0건, E2E edit-test.spec + 스모크 통과
- [ ] 커밋: `refactor: 편집 상태 변수 표준화 — editingId/editingGroupIds로 통일 (L1 Phase 2 선행)`

### Task 2-2: `editSample` Template Method

- [ ] Base에 골격 구현 (조사 §2.4의 5/5 공통 골격 기준):

```javascript
    editSample(id) {
        const log = this.sampleLogs.find(l => String(l.id) === String(id));
        if (!log) return;
        this.editingId = log.id;
        this.populateCommonFields(log);      // 접수번호/날짜/성명/전화/주소4종 + applyLegacyAddress + 법인토글 + 수령방법
        this.populateTypeSpecificFields(log); // 훅 (abstract 아님 — 기본 no-op)
        this.enterEditModeUI();               // navSubmitBtn '수정 완료' + btn-edit-mode + 폼 뷰 전환
    }
```

- [ ] `populateCommonFields`는 조사 §4.1의 공통부 55-60줄을 이식 (법인/개인 토글 ~16줄, 수령방법 버튼 토글 ~6줄 포함 — soil은 법인 없음이므로 토글 내부에서 요소 부재 시 스킵)
- [ ] 5개 타입을 한 타입씩 마이그레이션 (타입마다: 고유 필드 로직만 `populateTypeSpecificFields`로 이동 → 골격 삭제 → 해당 타입 E2E). 그룹 편집(soil populateFormForGroupEdit, water 다행 전개, pesticide N행 재구성)은 **이 단계에서 건드리지 않고** populateTypeSpecificFields 안에 유지
- [ ] 커밋 (타입별 1커밋, 총 5커밋)

### Task 2-3: `resetForm` 골격 승격

- [ ] Base 구현: `form.reset()` → yearSelect 복원(5/5 동일 1줄) → 날짜 오늘 → 편집 상태 해제 → navSubmitBtn 복원 → 접수번호 재설정 → `onAfterFormReset()` 훅
- [ ] "접수번호 보존 vs 재생성" 정책 차이(water/compost는 보존)는 `shouldPreserveReceptionInfo()` 훅(기본 false)으로 수용. soil의 `resetFormKeepReceptionInfo` 별도 UX는 유지(공통화 대상 아님 — 조사 §6.6)
- [ ] soil/pesticide의 resetForm/cancelEditMode 내부 중복은 cancelEditMode가 Base resetForm을 호출하도록 정리
- [ ] E2E → 커밋

### Task 2-4: Phase 2 마무리 — submit_test → 리뷰 → approve_review → 절감 측정

---

# Phase 3: submitForm 부분 공통화 + 블록 중복 4종 (~250줄 절감)

> 조사 §2.6: 통째 Template Method화는 비현실적 (그룹 의미론이 타입마다 다름). 부분 추출 3종 + 블록 2종만 진행. **이 Phase는 착수 전 별도 상세 플랜 필수** (이 문서는 인터페이스만 확정).

### Task 3-1: `collectCommonFormData()` — 공통 레코드 필드 생성 헬퍼

5곳의 commonData 리터럴 중복(water:375-395, pesticide:866-882·929-953, compost:529-598, heavy-metal:322-347, soil:1609-1622)을 흡수하는 Base 헬퍼. 반환: `{receptionNumber, date, name, phoneNumber, applicantType, birthDate, corpNumber, address 4종, purpose, receptionMethod, note, isComplete, createdAt, updatedAt}`.

### Task 3-2: `persistRecords(newLogs, removedIds)` 전략 훅

조사 §6 결론의 핵심: 저장 전략(배치 vs 개별)을 `_retryCloudSyncAction` 선례(L2에서 확립)처럼 전략 훅으로 분리.
- Base 기본: `saveLogs()` (= localStorage + 전체 batchSave)
- soil 오버라이드: `saveLogs()` + `firebaseSaveRecords(newLogs)` + `firebaseDeleteRecords(removedIds)`
- pesticide의 그룹 수정 시 개별 delete(pesticide-script.js:856-864)도 이 훅으로 수렴

### Task 3-3: `finishSubmit({mode})` — 제출 마무리 시퀀스 (persistRecords → render → reset → toast → switchView)

### Task 3-4: 우편발송일자 모달 공통화 (조사 §4.3 — 5벌, 클로저형/메서드형 혼재를 Base 메서드형으로 통일, soil의 개별 동기화는 persistRecords 훅 경유)

### Task 3-5: 라벨 인쇄 공통화 (조사 §4.4 — 4벌 동일 + heavy-metal 이탈. **선행 확인**: label-print 페이지가 heavy-metal의 `{type, data}` 포맷과 표준 포맷을 모두 수용하는지 — 미수용이면 heavy-metal은 제외하고 4벌만)

### Task 3-6: Phase 3 마무리 — submit_test → 리뷰 → approve_review

---

## 위험 관리

| 위험 | 완화 |
|------|------|
| E2E가 못 잡는 회귀 (필터 결과, 마이그레이션) | Phase 0에서 시드 기반 테스트 선행 추가 |
| soil 저장 경로 파손 (L2에서 막 수정한 영역) | Phase 1은 저장·삭제 무관 항목만, 저장 관련은 Phase 3에서 persistRecords 훅으로 격리 |
| heavy-metal의 DOM 접근 이질성 | Phase 2-1에서 this 캐시로 통일 후 진행 |
| 큰 diff로 리뷰 불가능 | 태스크별 커밋 + 타입별 마이그레이션 1커밋, Phase별 티켓 분리 |
| 중간 중단 | 각 Phase 독립 가치 — 어디서 멈춰도 개선 상태 유지 |

## 테스트 프로젝트 동기화 주의

테스트 프로젝트는 **TypeScript로 마이그레이션됨** (sync-rule.md 2026-06-08 경고). 각 Phase 완료 시 .js 복사가 아닌 **의미 단위 TS 포팅** 별도 티켓 발행 (SAMPL-1-77 선례).

## Self-Review 결과

- ✅ 조사 보고서의 6개 섹션이 모두 플랜에 반영됨 (§1→Task 1-1, §2→Task 1-2~4·2-2~3·3-1, §3→훅 설계 관례, §4→Task 1-5·3-4~5, §5→Phase 0, §6→persistRecords 훅·Task 2-1)
- ✅ 난이도 평가와 Phase 배치 일치 (쉬움→P1, 중간→P2, 어려움→P3)
- ✅ Phase 3은 인터페이스만 확정하고 상세 플랜 별도 명시 (불확실성 정직 반영 — 4,400줄 파일의 사전 전체 코딩은 무책임)
- ✅ 이름 일관성: `splitLegacyAddress`/`applyLegacyAddress`, `matchesTypeSpecificFilters`, `populateCommonFields`/`populateTypeSpecificFields`, `persistRecords`, `onAfterFormReset` — 기존 관례(§3.3) 준수
