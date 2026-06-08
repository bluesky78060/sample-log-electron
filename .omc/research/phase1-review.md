# Phase 1 코드 리뷰 — L1 중복 5종 BaseSampleManager 공통화 (SAMPL-2-14)

- **리뷰 대상**: `git diff e0f8bc4..41a3d8e -- src/ tests/` (cb72935, 396406e, 0813635, 6271dc1, ddf36af + 빌드 41a3d8e)
- **변경 규모**: src/ 8개 파일, +251 / -563 (순절감 -312줄, docs/ 빌드 제외)
- **검증 방법**: 5벌 원본 코드와 Base 구현 라인 단위 대조, 호출부/DOM 캐시/엔트리 import 순서 확인, vitest 전체 38/38 통과 확인

## Strengths

1. **Task 1-1 (주소 파싱)**: `splitLegacyAddress`의 정규식이 6곳 원본(`/^\((\d{5})\)\s*(.+)$/`)과 동일하고, 미매칭 시 `road = address` 반환이 원본 else 분기를 정확히 보존. `applyLegacyAddress`의 가드 `if (log.addressRoad || !log.address) return`은 원본 `if (!log.addressRoad && log.address)`와 논리 동치. 핵심 계약인 **`postcodeEl.value = postcodeEl.value || postcode`가 그대로 보존**됨 (BaseSampleManager.js:988).
2. **heavy-metal 지역변수 방식 교체 안전 확인**: heavy-metal은 `this.addressPostcode`/`this.addressRoad` 프로퍼티가 없어 Base의 `document.getElementById('addressPostcode'/'addressRoad')` 폴백을 타는데, 이는 원본 지역변수가 조회하던 것과 동일한 ID(heavy-metal/index.html:247,253)다. 원본의 `addressHidden = getElementById('address')` 등 주변 코드는 그대로 남아 있어(heavy-metal-script.js:355-363) 간섭 없음.
3. **soil 그룹수정본(firstLog) 처리 보존**: `applyLegacyAddress(firstLog)`로 치환(soil-script.js:2121)되었고 soil은 `this.addressPostcode/addressRoad`를 cacheDom에서 캐시(soil-script.js:185-186)하므로 원본과 동일 경로.
4. **Task 1-4 soil 오버라이드 정밀 보존**: `matchesLotFilter`는 원본의 `matchesLot=false` 초기값 + `parcels 없으면 false` 패턴을 early-return으로 동치 변환했고, `some()` 내부(단일어 subLot 매칭, 2어 이상 ri+lot 매칭)는 원본 그대로 복사. `matchesPurposeFilter`도 verbatim. `getFilterKeys()`의 `[...super, 'lot', 'purpose']`가 원본 hasFilter 키 집합과 일치하며, `updateSearchButtonState`의 super 호출 + purposeFilter 블록 분리도 동작 동일.
5. **Task 1-5 무변형 승격 확인**: `getGroupMembers`는 water/pesticide 2벌과 바이트 단위 동일(diff 대조). 호출부는 water-script.js:416, pesticide-script.js:986, 2511뿐이고 soil/compost/heavy-metal은 자체 정의가 없어 상속만 받고 미사용 — 무해.
6. **훅 관례 준수**: `matchesTypeSpecificFilters`/`getFilterKeys`가 기존 `getAdditionalMigrations`/`onAfterLoad` 훅 패턴과 일관되고, 신규 메서드 전부 JSDoc 보유. Base +155줄은 필터 패밀리(~85) + getGroupMembers(~28) + applyLegacyAddress(~14) + migrate 강화로 구성되어 비대화라기보다 5벌 흡수에 정확히 비례.
7. **L2 경로 무간섭**: `migrateCompletedField`는 loadYearData의 동일 지점(BaseSampleManager.js:425)에서 동일 인터페이스(Array→Array)로 호출되고 결과를 `this.sampleLogs`에 즉시 재할당하므로, 객체 복사 방식 변경에도 stale reference 없음. saveLogs는 손대지 않음.
8. **테스트**: 신규 `tests/unit/utils-address.test.js` 5케이스(5자리 분리, prefix 없음, null/빈문자, 4자리 미분리 고정, 공백 무관)가 기존 정규식 동작을 회귀 고정. 전체 vitest 5파일 38/38 통과.
9. **방어 코드 superset**: Base 공통 필터의 `(log.name || '')`, `log.receptionNumber || ''` 가드는 원본 water/soil/pesticide에 없던 null 안전장치 — 기존 정상 데이터에서는 동작 동일, 비정상 데이터에서만 TypeError 대신 미매칭 처리 (안전한 방향의 superset). compost/pesticide의 무가드 `this.addressPostcode.value` 직접 접근도 Base에서 null 가드로 개선.
10. **빌드 커밋 분리**: 41a3d8e는 docs/ 산출물만 포함 — src 변경과 깔끔히 분리됨.

## Issues

### Critical (🔴)

없음.

### Important (🟠)

없음.

### Minor (🟡)

1. **`src/shared/BaseSampleManager.js:1199-1213` — migrate 충돌 레코드의 우선순위 변화 (이론적 엣지)**
   원본 soil/compost/pesticide는 `isComplete = isComplete || isCompleted || completed || false`의 **truthy OR-체인**(어느 필드든 truthy면 true)이었으나, 새 구현은 **defined 우선순위**(isComplete 정의 시 falsy여도 유지 → completed → isCompleted 순)다. 차이가 나는 케이스:
   - `{isComplete: false, completed: true}` → 구: true / 신: false
   - `{completed: false, isCompleted: true}` → 구: true(isCompleted 우선) / 신: false(completed가 먼저 defined)

   다만 이런 레코드는 "두 세대 레거시 필드가 동시에 존재하며 값이 충돌"해야 발생하는데, 구 마이그레이션이 첫 로드에서 레거시 필드를 delete하므로 실데이터 존재 가능성은 사실상 0에 수렴. 행동 보존을 엄밀히 원하면 `if (migrated.isComplete === undefined) migrated.isComplete = !!(migrated.isCompleted || migrated.completed)`로 OR-체인 복원 권장. (water/heavy-metal에 추가된 "undefined→false 기본값"은 검증 결과 무해 — 소비처가 `=== true` / `!isComplete` / truthiness 판정뿐이라 undefined와 false가 동치.)

### Suggestion (🔵)

1. **`src/shared/BaseSampleManager.js:32-35` — Base 기본 `completed: ''` vs 서브클래스 관례 `'incomplete'`**
   5개 서브클래스 전부 생성자에서 `completed: 'incomplete'`로 덮어쓰므로 현재 무해하나, 미래 서브클래스가 덮어쓰기를 잊으면 기본 필터 동작(미완료만 표시)이 달라진다. Base 기본값을 `'incomplete'`로 맞추면 안전.
2. **`src/water/water-script.js:123`, `src/soil/soil-script.js:2701,3065`, `src/pesticide/pesticide-script.js:1319,1734` — zipMatch형 레거시 주소 파싱 잔존**
   라벨/테이블 변형용 `match(/^\((\d{5})\)\s*/)` 5곳이 남아 있다. 형태가 달라(road 캡처 없음) Task 1-1의 6곳 범위 밖이긴 하나, 후속 Phase에서 `splitLegacyAddress`로 흡수 가능.

## 검증 항목별 판정 요약

| 항목 | 판정 |
|------|------|
| 1-1 주소 파싱 6벌 동등성 (postcode `||` 보존, heavy-metal 지역변수, soil firstLog) | ✅ 동등 |
| 1-2 migrate superset (undefined→false 무해성) | ✅ 무해 / 🟡 OR-체인 엣지 1건 |
| 1-3 prepare 정렬 동등성 (보조 정렬 원본에도 없음, soil:247·pesticide:310 오버라이드 유지) | ✅ 동등 |
| 1-4 filter 4조건 + soil lot/purpose + extractReceptionNumber + updateSearchButtonState | ✅ 동등 (null 가드만 superset) |
| 1-5 getGroupMembers 무변형 승격, 미사용 타입 무해 | ✅ 확인 |
| 전반 (Base 비대화, JSDoc/훅 관례, L2 간섭, this 바인딩/null 가드) | ✅ 양호 |
| 테스트 | ✅ vitest 38/38 통과 |

## 집계

🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 1건 / 🔵 SUGGESTION: 2건

## Assessment: APPROVED

행동 보존 리팩토링의 의도가 정확히 달성됨. 유일한 의미 변화(migrate OR-체인 → defined 우선순위)는 첫 로드에서 레거시 필드가 소거되는 마이그레이션 특성상 실데이터 도달 불가능한 이론적 엣지로, 승인을 막지 않는다.
