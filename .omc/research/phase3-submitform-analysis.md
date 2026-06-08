# Phase 3 (submitForm 공통화) 정밀 조사 보고서

- 조사일: 2026-06-08 (읽기 전용)
- 대상: `/Users/leechanhee/sample-log-electron/src/{soil,water,compost,heavy-metal,pesticide}/*-script.js` + `src/shared/BaseSampleManager.js` + `src/label-print/label-app.js`
- 참고: 이전 분석 `.omc/research/l1-duplication-analysis.md` §2.6/§4.3/§4.4 (줄번호는 Phase 1·2로 모두 무효 — 본 보고서가 최신)

## 0. Phase 1·2 완료 현황 (출발점)

`editSample`/`resetForm` 계열은 **이미 Base Template Method화 완료**됨. Phase 3는 submitForm만 남은 상태.

Base가 현재 제공하는 헬퍼 (BaseSampleManager.js):
- `editSample(id)` Template Method — :1152-1160 (find → editingId 세팅 → `populateCommonFields` → `populateTypeSpecificFields` 훅 → `enterEditModeUI`)
- `populateCommonFields(log)` :1168-1195 (접수번호/날짜/성명/전화/주소4+레거시/`populateApplicantType`/`populateReceptionMethod`/비고)
- `populateApplicantType(log)` :1202-1221 (법인/개인 토글, soil은 요소 없어 자동 스킵)
- `populateReceptionMethod(log)` :1227-1232
- `applyLegacyAddress(log)` (호출 :1188)
- `enterEditModeUI()` :1243-1250 / `switchToEditFormView()` :1256-1259 (soil/pesticide 오버라이드)
- `resetForm()` Template Method :1266-1298 + 훅 `shouldPreserveDateOnReset()` :1301-1303 (water/compost true), `onAfterFormReset()` :1306
- `prepareDataForRender` :1327-1330, `migrateCompletedField` :1341+, `getGroupMembers` :1001

→ **편집/리셋 쪽 공통 인프라는 이미 존재**하므로, Phase 3는 그것을 submitForm의 "수정 분기"에서 재사용하는 방향과 자연스럽게 맞물린다. 단, **현재 submitForm 5종은 이 헬퍼들을 거의 사용하지 않고 자체적으로 필드를 재수집**한다(아래 §1).

---

## 1. submitForm 5종 현재 구조 (file:line)

| 타입 | submitForm 위치 | 줄수 | 분리된 수정 메서드 | 그룹 의미론 |
|---|---|---|---|---|
| soil | `soil-script.js:1573-1936` | 364 | 없음 (내부 3분기: 그룹수정/단건수정/신규) | **1폼=N레코드** (필지×작물 서브넘버 `N-1`) |
| water | `water-script.js:323-407` | 85 | `updateSample()` :713-812 (94줄) | **1폼=N레코드** (채취장소별 groupId) |
| compost | `compost-script.js:482-579` | 98 | 없음 (if/else 수정·신규) | **1폼=1레코드** |
| heavy-metal | `heavy-metal-script.js:272-338` | 67 | 없음 (단일 data 객체 + if/else) | **1폼=1레코드** |
| pesticide | `pesticide-script.js:789-969` | 181 | 없음 (내부 2분기: 그룹수정/신규) | **1폼=N레코드** (의뢰항목별 groupId) |

Base `submitForm`은 추상(throw) — 호출처는 `setupFormEvents` submit 리스너 + 각 타입 navSubmitBtn.

### 1.1 공통 레코드 필드 생성부 (commonData 리터럴) — 정확한 위치

| 타입 | commonData 위치 | 수집 방식 |
|---|---|---|
| soil 그룹수정 | `:1590-1603` | FormData + `this.addressPostcode?.value` |
| soil 신규 | `:1806-1820` | 동일 |
| water 신규 | `:348-368` | FormData |
| water updateSample | `:736-752` | FormData |
| compost 신규 | inline `data` `:540-568` | FormData |
| compost 수정 | inline `log.x =` `:498-521` | FormData (객체 직접 대입) |
| heavy-metal | 단일 `data` `:296-321` | **DOM 직접** (`document.getElementById(...).value`) |
| pesticide 그룹수정 | `:847-863` | FormData |
| pesticide 신규 | inline `newLog` `:910-934` | FormData |

**5종 commonData 필드 교집합 (전 타입 동일 키·동일 로직)**:
`date, name, phoneNumber, address, addressPostcode, addressRoad, addressDetail, purpose, receptionMethod, note` (10개).

**4종 공유 (soil 제외 — soil은 법인 개념 없음)**:
`applicantType, birthDate(개인), corpNumber(법인)` — 분기 코드 100% 동일:
```js
applicantType === '개인' ? formData.get('birthDate') : ''
applicantType === '법인' ? formData.get('corpNumber') : ''
```
(water:351-353, compost:500-502/545-546, heavy-metal:302-304, pesticide:850-851/916-917)

**라이프사이클 필드** `createdAt/updatedAt/isComplete`: 신규는 5종 모두 `new Date().toISOString()`·`isComplete:false`, 수정은 기존값 보존 (heavy-metal:318-319, pesticide prev?.* :877-879, water prev?.* :788-790).

**타입 고유 필드(commonData 밖 또는 안에 섞임)**:
- soil: `subCategory`(:1598/1814), parcels 배열/lotAddress/area/cropsDisplay (레코드별)
- water: `sampleType:'물'`(:349), `sampleName, testItems`(:361/363), samplingLocation/mainCrop/sampleNote/sampleCount (레코드별)
- compost: `farmName, farmAddress, farmArea, farmAreaUnit, sampleType, animalType, productionDate, sampleCount, rawMaterials` (:547-561)
- heavy-metal: `samplingLocation, cropName, treeAge, samplingDate, sampleCount, analysisItems[]` (:309-314)
- pesticide: `subCategory`(:858), `producerName`(:862), producerAddress/requestContent (레코드별)

### 1.2 제출 마무리 시퀀스 위치 (저장→렌더→reset→toast→뷰전환)

| 타입 | 신규 마무리 | 수정 마무리 |
|---|---|---|
| soil | :1893-1935 (saveLogs+firebaseSaveRecords→render→form.reset+수동초기화→generateNext→toast→showRegistrationResult→switchView('list')→runVerificationForModal) | 그룹 :1693-1707 / 단건 :1760-1770 (saveLogs+firebase→render→validate→cancelEditMode→toast→switchView) |
| water | :389-406 (saveLogs→toast→showRegistrationResult→`resetForm()`→접수번호) | updateSample :796-811 (saveLogs→render→toast→resetForm→editId해제→navBtn복원→switchView) |
| compost | :570-577 (saveLogs→toast→showRegistrationResult→`resetForm()`→접수번호) | :523-536 (saveLogs→toast→resetForm→접수번호→editId=null→navBtn복원→switchView) |
| heavy-metal | :329-337 (push→toast→showRegistrationResult→listViewStale→saveLogs→`resetForm()`→filterAndRenderLogs) | :323-327→공유 :334-337 |
| pesticide | :940-968 (saveLogs→render→form.reset+수동초기화→resetRequestItems→generateNext→toast→show(Multiple)RegistrationResult→switchView) | :885-890 (saveLogs→render→cancelEditMode→toast→switchView) |

→ **water/compost/heavy-metal은 이미 Base `resetForm()` 호출**로 마무리 일부 공통화됨. **soil/pesticide만 `form.reset()`+수동 초기화**를 인라인 유지(필지/의뢰항목 등 복잡 초기화 때문).

---

## 2. collectCommonFormData 추출 가능성

**결론: 추출 가능하나 "전부 공통"은 아니고 4+1 구조. 난이도 중간.**

- **수집 방식 불일치가 1차 장벽**: 4종(soil/water/compost/pesticide)은 `new FormData(this.form)` 기반, **heavy-metal만 `document.getElementById().value` 직접 읽기**(:296-321). 헬퍼를 FormData 기반으로 만들면 heavy-metal은 그대로 못 쓴다. → 해법 (a) heavy-metal을 FormData로 통일(폼에 name 속성 필요 — 확인 과제), 또는 (b) 헬퍼를 `collectCommonFormData(formData)` + heavy-metal은 임시 FormData 생성/별도 경로.
- **법인 분기**: 4종 공유, soil은 없음. 헬퍼 내부에서 `populateApplicantType`의 역(逆) 패턴으로 `if (this.applicantTypeSelect)` 가드를 두면 soil 자동 스킵 가능(Base `populateApplicantType` :1204 선례와 동일 전략).
- **추출 대상 (헬퍼가 돌려줄 객체)**: 10개 교집합 + 법인 3필드(조건부) = 13키. 타입 고유 필드는 호출부에서 spread 후 덧붙임:
  ```js
  const common = this.collectCommonFormData(formData); // Base
  const record = { ...common, subCategory: ..., parcels: ... }; // 타입별
  ```
- **차이 흡수 포인트**:
  - water만 `sampleType:'물'` + `testItems`/`sampleName`을 commonData에 포함 → 타입별 spread로 이동.
  - createdAt/updatedAt/isComplete는 **헬퍼에 넣지 말 것**(신규 vs 수정 정책이 달라 호출부 책임). 헬퍼는 "사용자 입력 필드"만.
- **난이도 평가: 중간**. 순수 함수에 가깝고 부작용 없음(저장/DOM 변경 없음)이라 안전하지만, heavy-metal DOM-read 통일과 water 고유필드 분리가 선행.

---

## 3. persistRecords 전략 훅 설계

### 3.1 현재 각 타입의 저장+동기화 방식

| 타입 | 로컬 저장 | Firebase 동기화 경로 |
|---|---|---|
| water/compost/heavy-metal | Base `saveLogs()` (:223-278) | `saveLogs` 내부 `batchSave`(전체) — :254-268 |
| water updateSample (축소분) | `saveLogs` | **추가로** 축소된 멤버 개별 `firestoreDb.delete`(:764-771) |
| pesticide | `saveLogs`(batchSave) | **추가로** 그룹 수정 축소분 개별 `firestoreDb.delete('pesticide', year, rid)`(:837-845) |
| soil | `saveLogs()` 오버라이드 (:408~, **로컬 전용·batchSave 안 함**) | `firebaseSaveRecords(logs)`(:454-474, 개별 set) / `firebaseDeleteRecords(ids)`(:475-511, 개별 delete) 직접 호출 |

soil submitForm 내 클라우드 호출 지점: 그룹수정 :1698-1699(`firebaseDeleteRecords(removedIds)`+`firebaseSaveRecords(newLogs)`), 단건수정 :1762(`firebaseSaveRecords(updatedLog)`), 신규 :1895(`firebaseSaveRecords(newLogs)`).

### 3.2 ⚠️ L2(SAMPL-1-76) 충돌 검증 — **중요**

L2가 확립한 동기화 계약(BaseSampleManager.js):
- `saveLogs()` :223 — water/compost/heavy-metal은 batchSave 포함, soil은 로컬 전용 오버라이드.
- `deleteSample(id)` :284 — Base는 단일 인자, soil은 `deleteSample(id, receptionNumber=null)` 오버라이드(시그니처 다름).
- `_handleCloudSyncFailure()` :312 / `_retryCloudSyncAction()` :335 — soil이 오버라이드(:514, `saveLogs()`+`firebaseBatchSync()`).

**`persistRecords(newLogs, removedIds)` 훅 설계가 이 계약과 충돌하지 않으려면**:

1. **persistRecords는 "동기화 전략 훅"의 형제로 추가**해야 하며, `saveLogs`/`deleteSample`/`_retryCloudSyncAction`을 **건드리지 않는다**. 이 셋은 L2 자산으로 보존.
2. **Base 기본 구현** (water/compost/heavy-metal용):
   ```js
   persistRecords(newLogs = [], removedIds = []) {
     this.saveLogs(); // batchSave가 newLogs 포함 전체 동기화
     // removedIds: 축소분 개별 삭제 (water/pesticide 패턴 흡수)
     if (removedIds.length && window.firestoreDb?.isEnabled?.()) {
       const year = parseInt(this.selectedYear, 10);
       removedIds.forEach(id => window.firestoreDb.delete(this.moduleKey, year, String(id))
         .catch(e => this._handleCloudSyncFailure?.()));
     }
   }
   ```
   → water `:764-771`·pesticide `:837-845`의 개별 delete 루프가 이 기본 구현으로 흡수됨(현재 pesticide는 `'pesticide'` 하드코딩 :841 — `this.moduleKey`로 교체하면 통일).
3. **soil 오버라이드** (saveLogs가 로컬 전용이므로):
   ```js
   persistRecords(newLogs = [], removedIds = []) {
     this.saveLogs();                                   // 로컬(멱등)
     if (removedIds.length) this.firebaseDeleteRecords(removedIds);
     if (newLogs.length) this.firebaseSaveRecords(newLogs);
   }
   ```
   → 이것은 **`_retryCloudSyncAction` 오버라이드(:514)와 정확히 같은 선례 패턴**. soil의 saveLogs+firebaseSaveRecords 쌍 호출(현 :1693-1699, :1761-1762, :1894-1895)이 단일 `persistRecords` 호출로 정리됨.
4. **삭제 시그니처 충돌은 persistRecords 범위 밖**: `deleteSample(id, receptionNumber)` soil 오버라이드는 그대로 둔다. persistRecords는 submitForm(저장)만 담당하고 삭제 버튼 경로는 기존 deleteSample 유지.

→ **충돌 없음 확인**: persistRecords는 L2가 만든 `_retryCloudSyncAction` 전략 훅 패턴을 **그대로 답습**하는 것이므로 일관적이고 안전. 각 타입이 오버라이드할 것은 soil 1곳뿐(나머지 4종은 Base 기본 사용, pesticide는 moduleKey 통일만).

---

## 4. finishSubmit 시퀀스 공통성

신규 등록 마무리의 골격은 5종 유사하나 **3가지 변형축**:

1. **결과 모달**: 4종 `showRegistrationResult(data)` 단건 / pesticide만 N건일 때 `showMultipleRegistrationResult`(:965) 분기 / soil은 검증상태 포함 `showRegistrationResult` + `runVerificationForModal`(:1935) 추가.
2. **리셋 방식**: water/compost/heavy-metal = Base `resetForm()` 호출(공통화 완료). soil/pesticide = `form.reset()`+수동 필드/필지/의뢰항목 초기화(soil:1897-1912, pesticide:942-957) — 복잡 초기화 때문.
3. **뷰 전환**: soil/pesticide/water-update/compost-update/pesticide는 `switchView('list')`, water/compost 신규는 switchView 호출 없음(폼 유지).

**공통 추출 가능 핵심**: `saveLogs/persistRecords → filterAndRenderLogs → toast` 3단계는 5종 동일. 그 앞뒤(결과모달, reset, switchView)는 변형.

**권장**: `finishSubmit({ records, mode, message })` 같은 통짜 헬퍼는 변형이 커서 **비권장**. 대신 작은 단위로:
- `persistRecords()` (§3) — 저장+동기화
- 결과 모달/리셋/뷰전환은 각 타입 유지하되, water/compost/heavy-metal은 이미 `resetForm()` 공유 중이므로 추가 작업 불필요.
→ finishSubmit 공통화의 ROI는 persistRecords보다 낮음. **collectCommonFormData + persistRecords 2개에 집중**하는 것이 현실적.

---

## 5. 우편발송일자 모달 (§4.3 재확인 — 최신 줄번호)

| 타입 | open/close | 셋업(확정 리스너) | 특이점 |
|---|---|---|---|
| soil | 인라인 클로저 `closeMailDateModalFn` (:3847) | :3839-3893 | 확정 시 **in-place 갱신 + `saveLogs()`+`firebaseSaveRecords(changedLogs)`** (:3875-3876) |
| water | `openMailDateModal` :1187-1196 / `closeMailDateModalFn` :1198-1202 (메서드형) | :1512~ (`saveLogs` :1543) | pendingMailDateIds |
| compost | `setupBulkMailDate()` :1264~ 내부 클로저 `closeModalFn` :1273 | saveLogs :1302 | 메서드 래핑 |
| heavy-metal | `openMailDateModal` :907-916 / `closeMailDateModalFn` :918-922 | :1163~ (saveLogs :1196) | **`pendingMailDateIndices`(인덱스 기반)** — 나머지는 ID 기반 |
| pesticide | `openMailDateModal` :1694-1703 / `closeMailDateModal` :1705-1709 | :2697~ (saveLogs :2729) | pendingMailDateIds |

공통 로직: 선택 수집 → 오늘 기본값 → 확정 시 `log.mailDate`/`updatedAt` 갱신 → 저장 → render → toast. 변형: (a) 메서드형(water/hm/pest) vs 클로저형(soil/compost), (b) soil만 Firebase 개별 동기화, (c) heavy-metal만 인덱스 기반 식별.
→ **Phase 3 범위 밖 권장**(submitForm과 무관). 공통화하려면 별도 태스크 + persistRecords 재사용(soil의 firebaseSaveRecords가 persistRecords로 흡수되면 모달도 그 훅 호출로 통일 가능). 우선순위 낮음.

---

## 6. 라벨 인쇄 (§4.4 재확인) — ⚠️ heavy-metal 포맷 이탈 = 잠재 버그

| 타입 | 메서드/위치 | localStorage 저장 포맷 |
|---|---|---|
| soil | `openLabelPrintWithData` :2664-2687 | **배열** `[{name,address,postalCode}]` (address에서 `(우편)` re-파싱) |
| water | :1158-1182 | **배열** (addressRoad/addressDetail/addressPostcode 필드 사용) |
| compost | :1227-1258 | **배열** (water와 동일 방식) |
| pesticide | :1658-1688 | **배열** (soil과 동일, address re-파싱) |
| heavy-metal | **메서드 없음**, 인라인 리스너 :1252-1271 | **객체** `{type:'중금속', data: selectedData}` ← 이탈 |

**label-print 소비부 (`label-app.js:804-828`)**:
```js
const data = JSON.parse(passedData);
if (Array.isArray(data) && data.length > 0) { ... }  // 배열만 수용!
```
→ **label-print은 배열만 처리**. heavy-metal이 보내는 `{type,data}` 객체는 `Array.isArray` 검사에서 탈락 → **무시됨(라벨 인쇄 무동작 버그)**. 4종은 정상, heavy-metal만 깨진 상태.

**함의**: Phase 3에서 `openLabelPrintWithData(logs)`를 Base로 승격(4종 거의 동일)하고 heavy-metal을 거기에 맞추면, **공통화가 곧 heavy-metal 버그 수정**이 된다. 단, 주소 매핑 2변형(soil/pesticide는 `address` re-파싱 vs water/compost는 분리 필드) 흡수 필요 — `getLabelAddressParts(log)` 작은 훅으로 분리하면 됨.

---

## 7. Phase 3 권장 분할 (하위 태스크 / 순서 / 난이도)

위험도 순으로 **저위험 → 고위험** 진행, persistRecords를 가장 마지막에 격리.

### P3-A. `collectCommonFormData(formData)` Base 헬퍼 추출 — 난이도: **중간**
- 10개 교집합 + 법인 3필드(조건부 가드) 반환. createdAt/updatedAt/isComplete 제외.
- 적용 순서: water → compost → pesticide → soil(법인 없음, 가드로 자동) → heavy-metal(**선행: DOM-read를 FormData로 통일하거나 헬퍼에 임시 FormData 주입**).
- 안전성: 부작용 없는 순수 데이터 수집이라 회귀 위험 낮음. 단, water `sampleType:'물'`·`testItems` 등 고유필드를 spread로 분리하는 작업 동반.
- **선결 과제**: heavy-metal 폼의 name 속성 유무 확인(없으면 FormData 통일 불가 → 헬퍼를 getter-맵 방식으로 설계).

### P3-B. `openLabelPrintWithData(logs)` Base 승격 + heavy-metal 버그 수정 — 난이도: **쉬움**
- 4종 거의 동일 → Base로 올리고 `getLabelAddressParts(log)` 훅으로 주소 2변형 흡수.
- heavy-metal 인라인 리스너(:1252-1271)를 `this.openLabelPrintWithData(selectedData)` 호출로 교체 → **객체→배열 포맷 정상화(버그 수정)**.
- submitForm과 독립적이라 먼저 착수해도 무방. **가장 안전하고 즉시 가치(버그 수정)**.

### P3-C. `persistRecords(newLogs, removedIds)` 전략 훅 도입 — 난이도: **어려움 (격리 필수)**
- §3.2 설계: Base 기본(batchSave+removedIds 개별삭제) + soil 오버라이드(firebaseSaveRecords/firebaseDeleteRecords).
- **격리 전략**:
  1. **L2 자산 불가침**: `saveLogs`/`deleteSample`/`_retryCloudSyncAction`/`_handleCloudSyncFailure`는 수정 금지. persistRecords는 이들을 *호출만* 한다.
  2. **soil 단독 PR**: soil의 5개 클라우드 호출 지점(submitForm 3곳 + 모달은 별도)을 persistRecords 단일 호출로 치환하는 작업은 **soil 전용 커밋**으로 분리. soil submitForm의 그룹/단건/신규 3분기 각각에 대해 before/after Firestore 레코드 수를 검증.
  3. **pesticide moduleKey 통일**: :841 `'pesticide'` 하드코딩 → `this.moduleKey`로 교체(Base 기본 persistRecords 사용 위해).
  4. **테스트 선행**(§아래): persistRecords 도입 전, soil 그룹수정 시 "삭제분 Firestore delete + 신규 set" 동작을 검증하는 통합 테스트 추가.
- **적용 순서**: water/compost/heavy-metal(Base 기본으로 무변경에 가깝게) → pesticide(moduleKey + removedIds 경로) → **soil 최후 단독**.

### P3-D. (선택) submitForm Template Method 골격화 — 난이도: **어려움, 비권장(후순위)**
- 그룹 의미론(soil 서브넘버 vs water/pesticide 연번 vs compost/hm 단건)이 타입마다 달라 통짜 Template화는 ROI 낮음.
- A+C 완료 후 남는 중복은 "수정/신규 분기 + 접수번호 파싱"인데, 이건 그룹 모델별로 갈려 강제 통일 시 가독성 악화. **현 단계에서는 하지 않기를 권장**.

### 안전망 보강 (모든 태스크 선행)
이전 §5 분석대로 pesticide/heavy-metal submitForm은 E2E 무방비. P3 착수 전:
- 5타입 "등록→목록행 단언→(수정→단언)" 파라미터라이즈드 스모크 추가.
- soil persistRecords용 Firestore 호출 횟수/인자 단언(mock) 테스트.
- label-print 배열 수용 회귀 테스트(heavy-metal 포함).

### 권장 실행 순서 요약
**P3-B(쉬움·버그수정) → P3-A(중간) → 안전망 보강 → P3-C(soil 최후 격리) → [P3-D 보류]**
