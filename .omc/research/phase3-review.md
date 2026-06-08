# Phase 3 (submitForm 부분 공통화) 코드 리뷰 — SAMPL-2-16

- 리뷰일: 2026-06-08 (읽기 전용 정독)
- 대상: `git diff ed81b5c..5512396 -- src/ tests/` (커밋 4개: 2d864fd P3-B, 73751cd P3-A, 40b8f75 P3-C water/pesticide, 5512396 P3-C soil)
- 순절감: -119줄 (160 insertions / 279 deletions)
- 근거 조사: `.omc/research/phase3-submitform-analysis.md`

## Strengths

- **L2 자산 불가침 확인됨**: Base diff에서 `saveLogs/deleteSample/_handleCloudSyncFailure/_retryCloudSyncAction/firebaseSaveRecords/firebaseDeleteRecords` 정의부 삭제·수정 0건. persistRecords는 이들을 *호출만* 하며, soil의 `_retryCloudSyncAction` 오버라이드 선례 패턴을 그대로 답습 → 일관적.
- **P3-B heavy-metal 버그 수정 정확**: 기존 `{type:'중금속', data}` 객체는 `label-app.js:809` `Array.isArray(data)` 검사에서 탈락해 라벨 무동작이었음. 이제 `this.openLabelPrintWithData(selectedData)` → 배열 `[{name,address,postalCode}]` 정상화. heavy-metal 레코드는 분리 주소필드(addressRoad/addressDetail/addressPostcode)를 가지므로 Base 기본 `getLabelAddressParts`(분리필드)가 정확히 매핑됨(name=log.name, address=road+detail, postalCode=postcode). 5종 호출부 9곳 모두 Base 메서드로 정상 연결.
- **getLabelAddressParts 훅 분리 적절**: soil/pesticide의 `address` 재파싱(`^\((\d{5})\)` zip 추출) 변형을 오버라이드로 정확히 보존. water/compost/heavy-metal은 Base 기본(분리필드) 사용.
- **collectCommonFormData 등가성 검증 통과**:
  - soil의 `this.addressPostcode?.value` → `formData.get('addressPostcode')` 전환은 등가. 해당 필드는 `readonly`(disabled 아님)이고 name 속성 보유 → FormData에 포함되며 빈 값은 `''` 반환. (soil/water/compost/heavy-metal/pesticide HTML 전수 확인)
  - 법인3 가드 `if (this.applicantTypeSelect || document.getElementById('applicantType'))` → soil(요소 없음) 자동 스킵, 4종 정상 수집. `populateApplicantType` 선례와 동일 전략.
  - heavy-metal 오버라이드 보존: `...collectCommonFormData()` 스프레드 **이후** `date: ...|| today`, `name: name`(trim), `phoneNumber`(trim) 재대입 → 고유 동작 유지.
  - water 고유필드(`sampleType:'물'`/`sampleName`/`testItems`) 스프레드 분리 정확. updateSample은 원본대로 sampleName 미포함 유지.
  - pesticide 기본값(`receptionMethod||'-'`, `subCategory||'-'`) 스프레드 후 재대입으로 보존.
  - createdAt/updatedAt/isComplete는 헬퍼에서 제외, 호출부가 책임짐(신규/수정 정책 분리) — 설계 의도대로.
- **persistRecords 등가성 검증 통과**:
  - water `removedIds = oldOrdered.slice(newSlotCount)`는 기존 `for(i=newSlotCount; i<oldOrdered.length)` 삭제 범위와 동일. 조건도 등가(removedIds 비면 no-op).
  - pesticide `'pesticide'` 하드코딩 → `this.moduleKey` 통일: moduleKey='pesticide' 확인, firestore-db 매핑 `'pesticide'→'pesticideSamples'` 동일 → 컬렉션명 불변.
  - soil 오버라이드 등가: 그룹수정/단건수정/신규 3분기 모두 `saveLogs()→firebaseDeleteRecords(removedIds)→firebaseSaveRecords(newLogs)` 순서·인자 일치. 단건수정의 기존 `firebaseSaveRecords(updatedLog)`(단일객체)→`persistRecords([updatedLog])`는 `firebaseSaveRecords`가 `Array.isArray? logs:[logs]`로 정규화하므로 완전 등가.
- 그룹 의미론(soil 서브넘버 / water·pesticide groupId / compost·hm 단건) 미변경. this 바인딩·옵셔널 체이닝·JSDoc 관례 양호.

## Issues

### Critical
- 없음.

### Important
- 없음.

### Minor
- `src/shared/BaseSampleManager.js:1188-1192` — Base 기본 `persistRecords`의 개별 delete catch에 `this._handleCloudSyncFailure?.()` 추가됨. 기존 water `updateSample`/pesticide 그룹수정의 개별 delete 루프는 **실패 시 로그만** 남기고 동기화 실패 핸들러를 호출하지 않았음. 이는 행동 *추가*(축소 멤버 Firestore 삭제 실패 시 클라우드 동기화 실패 배너/재시도 트리거)로, 의미상 일관성 개선이나 엄밀히는 기존 동작과 다름. 회귀 위험은 낮음(에러 경로 한정, 오프라인 큐 재시도와 정합). 의도된 것이면 유지 무방.

### Suggestion
- `persistRecords(newLogs, ...)`의 `newLogs` 인자는 Base 기본 구현에서 미사용(saveLogs batchSave가 처리). pesticide 신규가 `persistRecords(createdLogs)`로 전달하지만 Base에선 무시됨 — JSDoc에 명시돼 있어 혼동 적으나, 향후 오해 방지를 위해 호출부를 `persistRecords()` 또는 `persistRecords([])`로 통일 고려 가능(soil 오버라이드는 newLogs를 실제 사용하므로 인자 시그니처 자체는 유지 필요).

## 집계
🔴 0 / 🟠 0 / 🟡 1 / 🔵 1

## Assessment: APPROVED

행동 보존 리팩토링으로서 5종 등가성·L2 불가침·heavy-metal 버그 수정 모두 코드 정독으로 확인됨. Critical·Major 0건. Minor 1건(persistRecords 에러핸들러 추가)은 일관성 개선 성격이며 회귀 위험 낮음. vitest 38/38·E2E 202/202 통과 전제 하에 승인.
