# L1 Phase 3 (SAMPL-2-16) submitForm 부분 공통화 — 실행 보고서

- 일자: 2026-06-08
- 작업: executor-high (단독)
- 검증: 매 단계 `npm run build` + `common-crud-smoke` + `edit-delete` + `test:unit`, 최종 `npm test` 202개 + `test:unit` 38개 전부 GREEN

## Status

**DONE** — P3-B / P3-A / P3-C(soil 포함) 전부 성공. P3-D 보류(지시대로 미수행).

| 하위 | 결과 | 커밋 SHA | 변경(src) |
|---|---|---|---|
| P3-B (라벨 Base 승격 + heavy-metal 버그수정) | 성공 | `2d864fd` | 6 files +61/−116 |
| P3-A (collectCommonFormData) | 성공 | `73751cd` | 6 files +57/−133 |
| P3-C water/pesticide (persistRecords) | 성공 | `40b8f75` | 3 files +27/−21 |
| P3-C soil (persistRecords 오버라이드 + 3분기 치환) | 성공(E2E 통과, revert 없음) | `5512396` | 1 file +15/−9 |
| docs/ 재빌드 | — | `dee8059` | (빌드 산출물) |

**총 절감(src/, 2d864fd~1..5512396)**: +160 / −279 = **net −119줄** (추가분 대부분은 Base 신규 헬퍼 4종 본문 ~115줄, 5개 스크립트에서 중복 ~279줄 제거).

## P3-B 상세 — 라벨 Base 승격 + heavy-metal 버그 수정

- Base 신규: `openLabelPrintWithData(logs)` + `getLabelAddressParts(log)` 훅.
  - Base 기본 `getLabelAddressParts` = 분리필드(addressRoad/addressDetail/addressPostcode) 방식 → water/compost/heavy-metal 흡수.
  - soil/pesticide는 `getLabelAddressParts`만 오버라이드(`address` 정규식 재파싱), `openLabelPrintWithData`는 Base 공유.
- water/compost: `openLabelPrintWithData` 메서드 삭제(Base 기본 사용).
- **heavy-metal 라벨 포맷 버그 수정 확인**:
  - label-app.js `checkForPassedData()` (현행 :804-828, 핵심 :809) 는 `if (Array.isArray(data) && data.length > 0)` 로 **배열만 수용**.
  - 기존 heavy-metal 인라인 리스너는 `localStorage.setItem('labelPrintData', JSON.stringify({type:'중금속', data: selectedData}))` 로 **객체**를 저장 → `Array.isArray` 탈락 → 라벨 인쇄 무동작(버그).
  - 수정: 인라인 리스너를 `this.openLabelPrintWithData(selectedData)` 호출로 교체 → 배열 `[{name,address,postalCode}]` 저장으로 정상화.
  - heavy-metal 레코드는 분리 주소필드(addressRoad/addressDetail/addressPostcode)를 보유(submitForm data 객체 확인) → Base 기본 매핑이 정확.

## P3-A 상세 — collectCommonFormData

- Base 신규: `collectCommonFormData(formData)` — 10개 교집합(date/name/phoneNumber/address/addressPostcode/addressRoad/addressDetail/purpose/receptionMethod/note) + 법인3(applicantType/birthDate/corpNumber). createdAt/updatedAt/isComplete/타입고유필드는 호출부 책임(미포함).
- soil 자동 스킵: 가드 `if (this.applicantTypeSelect || document.getElementById('applicantType'))` — soil 폼에 applicantType 요소 없음 확인 → 법인3 미포함.
- 타입별 적용(water→compost→pesticide→soil→heavy-metal):
  - water: submitForm/updateSample commonData 2곳 → `{...collectCommonFormData, sampleType:'물', sampleName, testItems, ...}` 로 분리.
  - compost: 수정(Object.assign 변형) + 신규(스프레드) 2곳.
  - pesticide: 그룹수정/신규 2곳. `receptionMethod||'-'`, `subCategory||'-'`, `producerName` 은 스프레드 뒤 오버라이드로 기존 기본값 보존. 미사용 `applicantType` const 2개 제거.
  - soil: 그룹수정/단건수정(updatedLog ...existingLog 위)/신규 3곳. soil 주소 입력은 `name` 속성 보유 확인(readonly 필드도 FormData 포함) → `this.addressPostcode?.value` 대신 FormData 경로 사용해도 동등.
- **heavy-metal: collectCommonFormData 포함함 (이유)**: 폼 전 필드에 `name` 속성 존재 + `this.form`(sampleForm) 캐시 확인 → `new FormData(this.form)` 로 통일 가능. 단, heavy-metal 고유 동작(date `||today`, name/phoneNumber `.trim()`)을 보존하기 위해 date/name/phoneNumber 3개는 스프레드 뒤 오버라이드. 따라서 helper가 흡수한 필드는 address4 + 법인3 + purpose + receptionMethod + note. 미사용 `applicantType/applicantTypeSelect` const 제거.

## P3-C 상세 — persistRecords 전략 훅

- Base 기본 `persistRecords(newLogs=[], removedIds=[])`: `saveLogs()` + removedIds 개별 `firestoreDb.delete(this.moduleKey, year, id)` (실패 시 `_handleCloudSyncFailure?.()`).
- water updateSample: 인라인 firestore delete 루프 → `removedIds = oldOrdered.slice(newSlotCount).map(...)` 수집 + `this.persistRecords([], removedIds)`.
- pesticide: 그룹수정 delete 루프(하드코딩 `'pesticide'` 포함)를 제거 → removedIds 수집 + `persistRecords([], removedIds)`. **`'pesticide'` 하드코딩은 Base persistRecords가 `this.moduleKey`를 사용함으로써 자연 해소**. 신규모드 `saveLogs()`→`persistRecords(createdLogs)`.
- compost/heavy-metal: 그룹 축소 개념 없음 → 변경 없음(Base 기본 상속만).
- **soil persistRecords 오버라이드** (saveLogs가 로컬 전용이므로): `saveLogs()` + `removedIds→firebaseDeleteRecords` + `newLogs→firebaseSaveRecords`. `_retryCloudSyncAction` 오버라이드 선례와 동일 패턴.
  - soil submitForm 3분기 치환:
    - 그룹수정: `saveLogs()+firebaseDeleteRecords(removedIds)+firebaseSaveRecords(newLogs)` → `persistRecords(newLogs, removedIds)`.
    - 단건수정: `saveLogs()+firebaseSaveRecords(updatedLog)` → `persistRecords([updatedLog])`.
    - 신규: `saveLogs()+firebaseSaveRecords(newLogs)` → `persistRecords(newLogs)`.
  - **soil 치환 결과: E2E 통과 (revert 없음)**. common-crud-smoke 토양 등록+수정, edit-delete, form-submission, 최종 `npm test` 202개 전부 GREEN.

## L2 자산 무수정 확인

`saveLogs` / `deleteSample` / `_handleCloudSyncFailure` / `_retryCloudSyncAction` / `firebaseSaveRecords` / `firebaseDeleteRecords` 정의는 **수정/삭제 없음** — persistRecords가 *호출만* 함. git diff 검증 결과 해당 메서드 정의부 `-`(삭제) 라인 0건, 변경 라인은 모두 신규 persistRecords 본문의 `+`(추가)뿐. soil `deleteSample(id, receptionNumber)` 시그니처 오버라이드도 그대로 유지(persistRecords 범위 밖).

## 특이사항 / 우려

1. **docs/ 커밋에 무관 변경 포함 가능성**: `dee8059`(docs 재빌드)에 `docs/manual/images/*.png` 등 빌드 무관 바이너리 변경이 함께 스테이징됨(작업 시작 전 워킹트리에 이미 존재하던 변경으로 추정). src 로직과 무관하나 커밋 메시지("L1 Phase 3 docs 재빌드")와 정확히 일치하지는 않음. 필요 시 후속 정리 권장.
2. **heavy-metal trim 보존**: heavy-metal은 원래 name/phoneNumber를 `.trim()`하여 저장(타 타입은 미trim). 동작 보존을 위해 오버라이드 유지 → 타입 간 trim 정책 불일치는 그대로 남음(별도 통일 시 백로그).
3. **P3-A heavy-metal 동작 동등성**: date `||today`, name/phoneNumber `.trim()` 오버라이드로 기존 저장 포맷과 동일. purpose는 helper의 `formData.get('purpose')`(체크된 라디오) = 기존 selectedPurpose와 동등.
4. AI PM submit_test/approve_review 워크플로는 오케스트레이터 책임으로 미수행(코드 구현+검증만 완료). 빌드 출력·테스트 결과는 본 보고서에 기재.
5. P3-D(submitForm Template Method 골격화) 지시대로 **미수행**.
