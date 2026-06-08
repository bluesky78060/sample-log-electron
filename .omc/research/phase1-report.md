# L1 Phase 1 실행 보고서 — 무충돌 즉시 승격 5건 (SAMPL-2-14)

- 실행일: 2026-06-08
- 시작 SHA: `e0f8bc484aecdb10f82785ebea20e83f1d672020`
- 종료 SHA: `41a3d8e` (docs 재빌드 포함)

## Status: DONE

전 태스크 완료, 전체 회귀 202/202 통과, 단위 38/38 통과.

## 태스크별 결과

### Task 1-1: splitLegacyAddress / applyLegacyAddress (TDD) — `cb72935`
- 변경: `src/shared/utils.js` (+13, splitLegacyAddress 추가 + SampleUtils export), `src/shared/BaseSampleManager.js` (applyLegacyAddress 헬퍼), 5개 시료 스크립트 6곳 교체 (soil 2곳 — populateFormForEdit/populateFormForGroupEdit `firstLog`), `tests/unit/utils-address.test.js` 신규 (5케이스)
- TDD: 테스트 선작성 → 5 failed (red) → 구현 → 5 passed (green) 확인
- 듀얼 export 판단: 기존 `tests/unit/utils.test.js`가 **vitest+jsdom에서 utils.js를 직접 import 후 window.SampleUtils 사용**하는 선례가 있어 sync-utils식 CommonJS 듀얼 export는 불필요 — 기존 관례를 따름 (utils.js는 모듈 로드 시 window.addEventListener를 호출하므로 jsdom 환경이 전제)
- heavy-metal 지역변수 방식: applyLegacyAddress의 `this.addressPostcode || getElementById` 폴백으로 흡수 (hm은 this 캐시가 없어 getElementById 폴백 경로 사용)
- 검증: unit 38 PASS / build OK / 스모크+레거시 E2E 17 PASS
- diff: 8 files, +67 / -54

### Task 1-2: migrateCompletedField 통합 — `396406e`
- Base 본문을 플랜의 isComplete superset 버전으로 교체, 5개 서브클래스 동명 메서드 삭제
- superset 확인: soil/compost/pesticide(레거시 매핑 + undefined→false 기본값), water/heavy-metal(매핑만) 5벌을 직접 대조 — 플랜 버전이 전부 포괄. 차이는 (a) water/hm에 기본값 부여 추가(무해 — 렌더/필터 모두 truthiness 비교), (b) in-place 변형 → `{...log}` 복사(loadYearData가 반환값으로 재할당하므로 동작 동일), (c) isComplete 기존값 보존 우선순위가 명확해짐(레거시 키와 isComplete가 충돌하는 비현실적 케이스에서 isComplete 우선 — 플랜 명세대로)
- 검증: legacy-migration.spec 2건(✅/⬜, ✓ 렌더 단언) 직접 안전망 PASS / 17 E2E PASS / unit 38 PASS
- diff: 6 files, +10 / -91

### Task 1-3: prepareDataForRender 기본 정렬 — `0813635`
- Base identity 구현 → 접수번호 숫자 오름차순 정렬로 교체, water/compost/heavy-metal 3벌 삭제
- soil(flatten)/pesticide(sort+flatten) 오버라이드는 유지
- 검증: unit 38 PASS / build OK / 17 E2E PASS
- diff: 4 files, +4 / -36

### Task 1-4: filterAndRenderLogs 공통화 — `6271dc1` (최대 절감)
- Base: water 원본(문자 단위 동일 4벌의 기준)을 4개 매처 메서드(matchesNameFilter/matchesReceptionFilter/matchesDateFilter/matchesCompletedFilter)로 분해 + `matchesTypeSpecificFilters(log)` 훅(기본 true)
- `extractReceptionNumber` 5벌 → Base 승격 (Base에 부재 확인 후 이식, `(receptionNumber || '')` null 가드로 compost/hm의 호출부 가드까지 superset)
- Base 생성자에 `currentSearchFilter` 기본값 추가 (5개 서브클래스 모두 자체 초기화 확인 — 안전망 차원)
- soil: 골격 삭제 → `matchesTypeSpecificFilters` = matchesLotFilter(필지 다단계 43줄) + matchesPurposeFilter 오버라이드
- 4개 타입(water/compost/heavy-metal/pesticide): filterAndRenderLogs + updateSearchButtonState + extractReceptionNumber 전부 삭제
- 검증: unit 38 PASS / build OK / 스모크+레거시+**search-filter 포함 30 E2E PASS**
- diff: 6 files, +139 / -325

### Task 1-5: getGroupMembers Base 승격 — `ddf36af`
- water 원본을 Base로 무변형 이동 (water/pesticide 2벌이 문자 단위 동일임을 직접 대조 확인 — 조사 §4.2 일치)
- water/pesticide 2벌 삭제 + 잔존 사용처(water editSample, pesticide populateFormForEdit·테이블 위임 2곳) Base 상속으로 해결 확인
- 검증: unit 38 PASS / build OK / 17 E2E PASS
- diff: 3 files, +31 / -57

### docs 재빌드 — `41a3d8e`
- `build: L1 Phase 1 반영 docs/ 재빌드` — src/tests만 태스크별 커밋, docs/는 마지막 1회 커밋 (지시 준수)

## updateSearchButtonState 흡수 여부: **흡수함**

근거 — 5곳 비교 결과:
- water/compost/heavy-metal/pesticide 4곳: hasFilter 판정 키 5종(dateFrom/dateTo/name/receptionFrom/receptionTo) + completed 특수 판정 + 버튼 class/innerHTML 토글이 사실상 동일 (pesticide의 early-return만 스타일 차이)
- soil 1곳: 판정 키에 lot/purpose 2종 추가 + purposeFilter 요소 class 토글 블록만 추가
- → 차이가 "키 목록 + soil 고유 UI 1블록"뿐이므로 플랜 기준(차이가 키 목록뿐이면 진행) 충족. Base에 `getFilterKeys()` 훅(기본 5종) 기반 공통 구현, soil은 `getFilterKeys()`(+lot/purpose)와 `updateSearchButtonState()`(super 호출 + purposeFilter 토글)만 오버라이드.
- sanitizeHTML 참조는 Base에서 `window.sanitizeHTML`로 명시 (서브클래스의 bare 전역 참조와 런타임 동일, unit 테스트 환경에서 ReferenceError 방지)

## 총 절감 (git diff --stat e0f8bc4..HEAD -- src/)

```
 src/compost/compost-script.js         | 101 +------------------
 src/heavy-metal/heavy-metal-script.js |  92 +----------------
 src/pesticide/pesticide-script.js     | 113 +--------------------
 src/shared/BaseSampleManager.js       | 155 +++++++++++++++++++++++++++--
 src/shared/utils.js                   |  13 +++
 src/soil/soil-script.js               | 181 ++++++++++------------------------
 src/water/water-script.js             | 126 +----------------------
 7 files changed, 218 insertions(+), 563 deletions(-)
```

**순절감: -345줄** (5개 시료 스크립트에서 -558줄 제거, Base/utils에 +168줄 집약 — 플랜 예상 ~250줄 초과 달성. extractReceptionNumber/updateSearchButtonState 5벌 추가 흡수 효과)

## 최종 검증 증거

- `npm run test:unit`: **38 passed** (38) — 신규 utils-address 5건 포함
- `npm run build`: 성공 (vite, 기존 chunk-size 경고만)
- `npx playwright test common-crud-smoke + legacy-migration`: 매 태스크 후 **17 passed**
- Task 1-4 후 search-filter.spec 포함: **30 passed**
- `npm test` 전체: **202 passed** (1.6m)
- 매 태스크 후 6개 파일 `node --check` 구문 검증 통과

## 특이사항/우려

1. **docs 커밋에 manual 이미지 6장 신규 포함** (`docs/manual/images/*.png`, 기존 미추적 상태): `src/manual/images/`에 존재하는 정적 자산을 vite가 docs/로 복사한 정당한 빌드 산출물 — 이전 빌드에서 커밋 누락됐던 것이 이번에 포함됨. 문제 없음.
2. **migrateCompletedField 의미 변화(의도된 superset)**: water/hm 데이터도 이제 isComplete 기본값 false를 부여받음. 렌더·필터가 모두 truthiness 비교라 동작 차이 없음을 코드로 확인.
3. **Base filterAndRenderLogs의 기존 "무필터" 기본 구현 소멸**: BaseSampleManager의 직접 인스턴스화 사용처는 없고(5개 시료 매니저가 유일한 서브클래스, 전부 currentSearchFilter 초기화), Base 생성자 기본값도 추가해 방어. tests/unit/base-manager.test.js는 해당 경로 미사용 확인.
4. **이름 필터 미세 가드 강화**: soil/water/pesticide의 `log.name.toLowerCase()`(name undefined 시 throw 가능)가 Base의 `(log.name || '')`로 통일 — 결함 수정 방향의 superset.
5. 다음 단계 참고: Phase 2 선행 과제(soil editingLogId→editingId 통일)는 본 Phase 범위 밖으로 미수행. 테스트 프로젝트(TS) 동기화는 별도 티켓 필요 (sync-rule.md 2026-06-08 경고).

## 커밋 목록

| Task | SHA | 메시지 |
|---|---|---|
| 1-1 | `cb72935` | refactor: 레거시 주소 파싱 6벌 → splitLegacyAddress/applyLegacyAddress 공통화 (L1 Phase 1) |
| 1-2 | `396406e` | refactor: migrateCompletedField 5벌 제거 — Base superset 구현으로 통합 (L1 Phase 1) |
| 1-3 | `0813635` | refactor: prepareDataForRender 3벌 제거 — Base 정렬 기본 구현 (L1 Phase 1) |
| 1-4 | `6271dc1` | refactor: filterAndRenderLogs 5벌 → Base 공통 4조건 + matchesTypeSpecificFilters 훅 (L1 Phase 1) |
| 1-5 | `ddf36af` | refactor: getGroupMembers 2벌 제거 — Base 승격 (L1 Phase 1) |
| docs | `41a3d8e` | build: L1 Phase 1 반영 docs/ 재빌드 |
