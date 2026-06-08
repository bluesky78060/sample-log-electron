# L1 중복 분석 보고서 — 5개 시료 스크립트 Template Method 공통화 근거 자료

- 조사일: 2026-06-08 (읽기 전용)
- 대상: `/Users/leechanhee/sample-log-electron/src/{soil,water,compost,heavy-metal,pesticide}/*-script.js` + `src/shared/BaseSampleManager.js`
- 파일 규모: soil 4,612줄 / pesticide 4,408줄 / compost 2,853줄 / water 2,589줄 / heavy-metal 2,341줄 / Base 1,206줄

---

## 1. 주소 파싱 중복 블록 (레거시 `(우편번호) 주소` 분리)

### 1.1 위치 — 5개 파일 6곳

| # | 파일:라인 | 포함 함수 | 호출 경로 |
|---|---|---|---|
| 1 | `src/soil/soil-script.js:2037-2045` | `populateFormForEdit(log)` (2022-2124) | `editSample(id)`(1958) → 단독 레코드 분기(1973) |
| 2 | `src/soil/soil-script.js:2147-2155` | `populateFormForGroupEdit(groupLogs)` (2126-2255) | `editSample(id)` → 그룹 분기(1968) — **soil은 2벌 보유** |
| 3 | `src/water/water-script.js:498-506` | `editSample(id)` (467-589) | Base 테이블 이벤트 위임 `.btn-edit` (BaseSampleManager.js:710-713) |
| 4 | `src/compost/compost-script.js:652-660` | `editSample(id)` (616-720) | 동일 (이벤트 위임) |
| 5 | `src/heavy-metal/heavy-metal-script.js:390-398` | `editSample(id)` (369-460) | 동일 |
| 6 | `src/pesticide/pesticide-script.js:1069-1077` | `populateFormForEdit(log)` (1030-1154) | `editSample(id)`(1023-1028) 위임 |

### 1.2 전체 코드 인용 (soil-script.js:2036-2045)

```javascript
// addressRoad가 없으면 address에서 파싱 (레거시 데이터 호환)
if (!log.addressRoad && log.address) {
    const addressMatch = log.address.match(/^\((\d{5})\)\s*(.+)$/);
    if (addressMatch) {
        if (this.addressPostcode) this.addressPostcode.value = this.addressPostcode.value || addressMatch[1];
        if (this.addressRoad) this.addressRoad.value = addressMatch[2];
    } else {
        if (this.addressRoad) this.addressRoad.value = log.address;
    }
}
```

### 1.3 동일 여부와 차이점

- **로직 100% 동일**: 정규식 `/^\((\d{5})\)\s*(.+)$/`, 분기 구조, 폴백(매치 실패 시 address 전체를 addressRoad에) 모두 6곳 동일.
- **표면적 차이 3가지뿐**:
  1. null 가드 스타일 — soil/water는 `if (this.addressPostcode) ...` 가드, compost/pesticide는 가드 없이 직접 대입(compost-script.js:655-656, pesticide-script.js:1072-1073), heavy-metal은 지역변수(`getElementById` 결과)에 대입(heavy-metal-script.js:381-397).
  2. DOM 참조 방식 — heavy-metal만 `this.addressPostcode` 캐시 대신 함수 내 `document.getElementById('addressPostcode')` 지역변수 사용.
  3. 변수명 — soil 그룹수정본만 `log` 대신 `firstLog`(soil-script.js:2148).

### 1.4 shared 모듈에 유사 기능 존재 여부

- **`src/shared/address-parser.js:11-85` `parseAddressParts(address)`**: 우편번호 prefix를 **제거**(17행 `address.replace(/^\(\d{5}\)\s*/, '')`)한 뒤 시도/시군구/읍면동/나머지로 분해. **우편번호를 버리기 때문에** "우편번호+도로명 분리" 용도로는 그대로 못 씀. 현재 5개 스크립트의 엑셀 내보내기에서만 사용 중 (soil:4208, water:1906, compost:1996, heavy-metal:1793, pesticide:2267).
- **`src/shared/address.js` `AddressManager`**: juso API 검색 모달 UI 클래스 (생성자 옵션: postcodeInput/roadInput/detailInput/hiddenInput). 저장된 레거시 문자열 파싱 기능은 없음.
- **왜 안 쓰는가**: "(12345) 도로명..." → `{postcode, road}` 분리를 하는 공유 헬퍼가 **존재하지 않아서**가 정답. 각 스크립트가 editSample 작성 시 같은 코드를 복붙. → 공통화 시 `BaseSampleManager`에 `applyLegacyAddress(log)` 헬퍼(또는 sync-utils류 순수함수 `splitLegacyAddress(address)`)를 신설하면 6곳 → 1곳.
- 참고: 동일 정규식의 변형(`/^\((\d{5})\)\s*/`)이 라벨 인쇄(soil:2776, pesticide:1843)와 water `buildTableRow`(water-script.js:150)에도 존재 — 헬퍼 신설 시 함께 흡수 가능.

---

## 2. 6개 핵심 메서드 변형도 분석

### 2.0 위치/줄수 총괄표

| 메서드 | Base | soil | water | compost | heavy-metal | pesticide |
|---|---|---|---|---|---|---|
| `submitForm` | :1012 (abstract, throw) | 1592-1956 (365줄) | 349-435 (87줄) + `updateSample` 837-930 (94줄) | 513-610 (98줄) | 298-364 (67줄) | 808-988 (181줄) |
| `resetForm` | :1028 (abstract, throw) | 2018-2020 (3줄, `cancelEditMode` 1976-2016 위임) | 594-653 (60줄) | 726-794 (69줄) | 465-513 (49줄) | 1160-1179 (20줄) + `cancelEditMode` 1181-1218 |
| `editSample` | :1020 (abstract, throw) | 1958-1974 (17줄) + `populateFormForEdit` 2022-2124 (103줄) + `populateFormForGroupEdit` 2126-2255 (130줄) | 467-589 (123줄) | 616-720 (105줄) | 369-460 (92줄) | 1023-1028 (6줄) + `populateFormForEdit` 1030-1154 (125줄) |
| `filterAndRenderLogs` | :982-984 (기본: 무필터 렌더) | 2262-2344 (83줄) | 1287-1321 (35줄) | 1903-1940 (38줄) | 1017-1050 (34줄) | 1675-1708 (34줄) |
| `prepareDataForRender` | :1050-1052 (identity) | 266-268 (3줄, flatten 위임) | 131-138 (8줄) | 195-201 (7줄) | 67-73 (7줄) | 329-337 (9줄) |
| `migrateCompletedField` | :1067-1075 (`completed` 기본값 부여) | 247-260 (14줄) | 116-126 (11줄) | 176-189 (14줄) | 52-62 (11줄) | 273-286 (14줄) |

### 2.1 `filterAndRenderLogs` — 난이도: **쉬움** (최우선 승격 대상)

- **공통 골격(5/5 동일)**: `sampleLogs.filter(log => matchesName && matchesReception && matchesDate && matchesCompleted)` → `this.renderLogs(filtered)` → `this.updateSearchButtonState()`. water(1287-1321)/compost(1903-1940)/heavy-metal(1017-1050)/pesticide(1675-1708) 4곳은 **변수명(filtered/filteredLogs)과 주석 외 사실상 문자 단위 동일**. 이름 검색·접수번호 범위(`extractReceptionNumber` 사용)·날짜 범위·완료 상태 4개 조건.
- **변형 지점**: soil만 +2 조건 — 필지 검색 `matchesLot`(soil-script.js:2284-2327, subLots 다단계 매칭 43줄)과 목적 필터 `matchesPurpose`(2330-2331).
- **승격안**: Base에 4개 공통 조건 구현 + `matchesTypeSpecificFilters(log)` 훅(기본 `return true`) → soil만 lot/purpose 오버라이드. 부속 `updateSearchButtonState`도 동일 패턴 중복(필터 키 목록만 차이)이라 `getFilterKeys()` 훅으로 같이 흡수 가능.
- **근거**: 4/5가 동일 코드 + soil 차이는 순수 추가 조건이므로 훅 1개로 끝.

### 2.2 `migrateCompletedField` — 난이도: **쉬움**

- **공통 골격**: `completed`/`isCompleted` 레거시 필드 → `isComplete`로 통합 후 delete. 5곳 모두 동일 매핑 로직.
- **변형**: soil(247-260)/compost(176-189)/pesticide(273-286)는 `isComplete === undefined → false` 기본값 부여 3줄이 추가, water(116-126)/heavy-metal(52-62)은 없음 — **의도적 차이라기보다 복붙 시점 차이로 보임** (water/hm도 기본값 부여가 무해함).
- **주의**: Base 구현(1067-1075)은 **`completed: false`를 부여하는 반대 방향 로직** — 5개 서브클래스 전부가 이를 폐기하고 isComplete 체계로 재구현했으므로, Base 기본 구현 자체를 isComplete 버전으로 교체하고 서브클래스 6벌 제거가 정답. 호출처는 Base `loadYearData`(BaseSampleManager.js:420) 단 한 곳.
- **승격안**: Base 본문 교체(undefined 기본값 포함 superset 버전) → 5개 서브클래스 메서드 삭제. 훅 불필요.

### 2.3 `prepareDataForRender` — 난이도: **쉬움**

- **공통 골격**: 접수번호 숫자 오름차순 정렬. water(131-138)/compost(195-201)/heavy-metal(67-73) 3곳 문자 동일.
- **변형**: pesticide(329-337) = 정렬 + `flattenLogsForTable(sorted)`; soil(266-268) = 정렬 없이 `flattenLogsForTable(logs)`만.
- **승격안**: Base에 `sortByReceptionNumber` 기본 구현 + soil/pesticide는 flatten 오버라이드 유지(이미 훅으로 설계된 메서드 — Base renderLogs:992가 호출). 사실상 정렬 로직만 Base로 올리면 됨.

### 2.4 `editSample` — 난이도: **중간**

- **공통 골격 (5/5)**: ① id로 log 조회(String 비교) → ② 편집 상태 세팅(`editingId`/`editingLogId`+`editingGroupIds`) → ③ 폼 채우기: 접수번호·날짜·성명·전화 → 주소 4필드 + §1 레거시 파싱 → 법인/개인 토글 → 타입 고유 필드 → 수령방법 버튼 active 토글 → ④ `navSubmitBtn` '수정 완료' + `btn-edit-mode` → ⑤ 폼 뷰 전환(+토스트).
- **블록 단위 동일 코드**:
  - 법인/개인 토글 ~16줄: water:512-526, compost:627-641, heavy-metal:428-448, pesticide:1046-1060 — 거의 동일 (soil은 법인 개념 없음).
  - 수령방법 버튼 토글 ~6줄: soil:2066-2075, water:552-557, compost:707-710, heavy-metal:419-425(+`selected` 클래스 추가), pesticide:1092-1100.
  - 뷰 전환: water/compost/heavy-metal/pesticide-cancelEdit은 `switchView('form')`+토스트, soil/pesticide-populate는 직접 DOM 조작 + `scrollIntoView`(soil:2116-2123, pesticide:1146-1153 동일).
- **변형 지점(타입 고유)**: soil 필지 배열 재구성(2080-2109)·그룹 수정 별도 경로(populateFormForGroupEdit), water 채취장소 다행 전개+getGroupMembers(529-549), pesticide 의뢰항목 N행 재구성(1114-1137), compost 축종/면적단위(666-697), heavy-metal 분석항목 체크박스(407-411).
- **승격안**: Base에 Template Method `editSample(id)` = find → `populateCommonFields(log)`(접수번호/날짜/이름/전화/주소+레거시파싱/법인토글/수령방법) → `populateTypeSpecificFields(log)` 훅 → enterEditMode UI. **난이도 중간 근거**: 골격은 명확하나 (a) 편집 상태 변수명이 soil만 `editingLogId`/`editingGroupId`로 다름, (b) soil·water·pesticide의 그룹 편집 분기가 서로 다른 시점에 끼어듦, (c) heavy-metal은 this 캐시 대신 getElementById 직접 사용 — DOM 캐시 통일 선행 필요.

### 2.5 `resetForm` — 난이도: **중간**

- **공통 골격**: `form.reset()` → **yearSelect 복원 1줄(5/5 문자 동일**: soil:1988, water:600, compost:733, heavy-metal:468, pesticide:1165 — "form.reset()이 yearSelect를 첫 옵션(2025)으로 되돌리므로 복원" 주석까지 동일) → 날짜 오늘로 → 편집 상태 해제 → navSubmitBtn 복원 → `generateNextReceptionNumber()` 재설정.
- **변형 지점**: water/compost는 접수번호·날짜 **보존** 후 복원(water:595-609, compost:727-743), 나머지는 재생성. 타입별 잔여 초기화: soil 필지+서브카테고리 옵션 재주입(1989-2013), water 검사항목/채취장소(623-638), compost 축종/면적단위(758-780), heavy-metal 분석항목/인증안내(503-512), pesticide 의뢰항목(1175). soil/pesticide는 `resetForm`과 별개로 `cancelEditMode`가 사실상 같은 일을 한 번 더 구현(soil:1976-2016, pesticide:1181-1218 — 내부 중복).
- **승격안**: Base `resetForm()` = reset + yearSelect 복원 + 날짜 + 접수번호 + 편집해제 + `onAfterFormReset()` 훅. **중간 근거**: 흐름은 같지만 "보존 vs 재생성" 정책 차이와 soil/pesticide의 resetForm/cancelEditMode 이중 구조 정리가 선행돼야 함.

### 2.6 `submitForm` — 난이도: **어려움**

- **공통 골격(전 타입)**: FormData 수집 → 검증 → `{id, receptionNumber, date, name, phoneNumber, applicantType, birthDate/corpNumber, address 4종, purpose, receptionMethod, note, isComplete, createdAt, updatedAt}` 공통 레코드 생성 → 수정/신규 분기 → `saveLogs()` → 결과 모달 → reset → 목록 갱신.
- **구조적 변형이 큼**:
  - **1폼=1레코드**: compost(513-610, FormData 기반 필드 복사), heavy-metal(298-364, 명시적 필수검증 7건 + getElementById 기반).
  - **1폼=N레코드(그룹)**: water(349-435: 채취장소별 N행 + groupId, 수정은 updateSample 837-930으로 분리), pesticide(808-988: 의뢰항목별 N행, 수정 시 그룹 삭제+재생성+Firestore 개별 delete 856-864), soil(1592-1956: 필지×작물 서브넘버 'N-1' 체계, 그룹 수정/단건 수정/신규 3경로 + `firebaseSaveRecords`/`firebaseDeleteRecords` 개별 동기화 + VWORLD 주소검증 1953-1955).
  - 저장 방식 차이: soil만 `saveLogs()`가 로컬 전용이라 submitForm 내부에서 Firebase 개별 저장을 직접 호출(soil:1711-1716, §6 참조).
- **승격안**: 통째 Template Method화는 비현실적. 현실적 단계는 (1) `collectCommonFormData(formData)` — 공통 레코드 필드 생성 헬퍼(5곳의 commonData 리터럴 중복 제거: water:375-395, pesticide:866-882·929-953, compost:529-598, heavy-metal:322-347, soil:1609-1622), (2) 제출 마무리 시퀀스 `finishSubmit({mode})`(saveLogs→render→reset→toast→switchView) 추출. **어려움 근거**: 그룹 의미론(soil 서브넘버 vs water/pesticide 연번)이 타입마다 다르고, soil은 클라우드 동기화 경로까지 분기(§6 충돌 지점).

### 2.7 Base 동명 메서드 존재 여부 요약

- 존재(abstract/throw): `submitForm`(BaseSampleManager.js:1012-1014), `editSample`(1020-1022), `resetForm`(1028-1030).
- 존재(기본 구현): `filterAndRenderLogs`(982-984, 무필터), `prepareDataForRender`(1050-1052, identity), `migrateCompletedField`(1067-1075, **서브클래스와 의미 충돌하는 completed 체계**).

---

## 3. 기존 훅 패턴 인벤토리 (BaseSampleManager.js)

새 훅 설계가 따라야 할 관례. 정의 위치 = BaseSampleManager.js 기준.

### 3.1 추상 메서드 (미구현 시 throw)

| 메서드 | 정의 | 호출 위치 |
|---|---|---|
| `submitForm()` | :1012 | `setupFormEvents` submit 리스너 :884 |
| `editSample(id)` | :1020 | 테이블 이벤트 위임 :712, :745 |
| `resetForm()` | :1028 | cancelBtn 리스너 :891 |

### 3.2 선택적 오버라이드 훅 (기본 구현 있음)

| 훅 | 정의 | 호출 위치 | 반환 규약 |
|---|---|---|---|
| `setupTypeSpecificEvents()` | :1090 | `init()` :100 | void |
| `initViews()` | :1115 | `initUI()` :692 | void |
| `initPagination()` | :1122 | `initUI()` :695 | void |
| `onYearChange(newYear)` | :1145 | `syncYearSelects()` :190 | void |
| `onBeforeSave(data)` | :1152 | `saveLogs()` :220-221 | **truthy 반환 시 sampleLogs 교체** (`if (processed) this.sampleLogs = processed`) |
| `onAfterSave(data)` | :1159 | `saveLogs()` :270 | void |
| `onAfterLoad(data, year)` | :1104 | `loadYearData()` :430-431 | truthy 반환 시 교체 |
| `getAdditionalMigrations()` | :1058 | `loadYearData()` :423-427 | **함수 배열** 반환, 각 함수가 truthy 반환 시 교체 (pesticide:292-299 사용 중) |
| `migrateCompletedField(logs)` | :1067 | `loadYearData()` :420 | 변환된 배열 반환 |
| `prepareDataForRender(logs)` | :1050 | `renderLogs()` :992 | 가공 배열 반환 |
| `buildTableRow(item, index)` | :1039 | `renderLogs()` :1001, `initPagination` renderRow :1131-1133 | tr 요소 또는 null |
| `onPageChange(page, pageData)` | :1097 | `initPagination` 콜백 :1128-1129 | void |
| `filterAndRenderLogs()` | :982 | `deleteSample`:284, `loadYearData`:434, `switchView`:812 | void |
| `_retryCloudSyncAction()` | :328 | `_handleCloudSyncFailure()` :317 | void — JSDoc(:324-327)에 "soil처럼 saveLogs가 로컬 전용인 서브클래스는 오버라이드할 것" 명시 |

### 3.3 관례 정리 (새 훅 설계 가이드)

1. **명명**: 라이프사이클 = `on{Before|After}{동사}` / 수집형 = `get*()` (배열 반환) / 이벤트 바인딩 = `setup*()` / 내부용 = `_*`.
2. **데이터 변환 훅 계약**: "truthy 반환 시 결과로 교체, falsy면 무시" 패턴 (:220-221, :430-431) — 새 훅도 이 계약 유지.
3. **파이프라인 훅**: `getAdditionalMigrations()`처럼 함수 배열을 반환하면 Base가 순차 적용 — 다단 변형에 적합.
4. **JSDoc에 오버라이드 의도 명시** (`@abstract`, "서브클래스에서 오버라이드 가능") + 호출부 주석으로 대표 사용처 기록(:991 "soil/pesticide: flattenLogsForTable").
5. 정적 유틸은 `static` (예: `buildResultTable` :1172 — XSS 방지 DOM 빌더, 5개 스크립트 결과 모달이 공유).

---

## 4. 블록 중복 4종

### 4.1 폼 필드 채우기 (~90-125줄) — 5/5 중복, 변형도 중

- 위치: soil `populateFormForEdit` 2022-2124 (103줄) + `populateFormForGroupEdit` 2126-2255 / water `editSample` 475-584 / compost `editSample` 622-719 / heavy-metal `editSample` 375-459 / pesticide `populateFormForEdit` 1030-1154.
- 공통부(§2.4): 기본 4필드 + 주소 4필드 + 레거시 파싱(§1) + 법인토글 + 수령방법 + navSubmitBtn + 뷰 전환 ≈ **55-60줄이 5벌 중복**. 타입 고유부 30-60줄.
- 변형도: **중** — 공통부는 거의 동일하나 soil(법인 없음·서브카테고리 innerHTML 재주입 2050-2060)과 heavy-metal(getElementById 직접)이 이탈.

### 4.2 그룹 멤버 조회 `getGroupMembers` (~22줄) — 2/5 중복, 변형도 0

- water-script.js:444-465, pesticide-script.js:1000-1021 — 주석 포함 **문자 단위 동일** (groupId 일치 → createdAt+name+phone+date 휴리스틱 → 자기 자신 → receptionNumber 오름차순 정렬).
- soil은 다른 그룹 모델: `editSample` 내 groupId 필터+parcelIndex 정렬(soil-script.js:1963-1971) 및 `deleteGroup`(565-599). compost/heavy-metal은 그룹 개념 없음.
- 승격: Base 메서드로 올려도 무해(soil은 미사용, compost/hm은 단일 멤버 반환). 변형도 낮아 즉시 가능.

### 4.3 우편발송일자 모달 (~60-80줄) — 5/5 중복, 변형도 중

| 타입 | open/close | 셋업(확정 리스너 포함) |
|---|---|---|
| soil | 인라인 클로저 `closeMailDateModalFn` | soil-script.js:3948-4005 (58줄, `firebaseSaveRecords(changedLogs)` 추가 동기화 3985) |
| water | `openMailDateModal` 1370-1380, `closeMailDateModalFn` 1382-1386 | 1695-1745 |
| compost | 인라인 클로저 | 1379-1437 (59줄) |
| heavy-metal | `openMailDateModal` 1071-1080, `closeMailDateModalFn` 1082-1085 | 1327-1390 |
| pesticide | `openMailDateModal` 1876-1885, `closeMailDateModal` 1887-1891 | 2886-2931 |
- 공통 로직: 선택 ID 수집 → 오늘 날짜 기본값 → 확정 시 `log.mailDate`/`updatedAt` 갱신 → saveLogs → 렌더 → 토스트. 변형: 메서드형(water/hm/pest) vs 클로저형(soil/compost), soil만 in-place 갱신 + Firebase 개별 저장.

### 4.4 라벨 인쇄 `openLabelPrintWithData` (~25-30줄) — 4/5 동일 + 1 이탈

- soil-script.js:2773-2797, water-script.js:1341-1366, compost-script.js:1340-1374, pesticide-script.js:1840-1871 — `{name, address, postalCode}` 매핑 → 주소 기준 dedupe → `localStorage('labelPrintData')` → `../label-print/` 이동. soil/pesticide는 `log.address`에서 우편번호 re-파싱, water/compost는 `addressRoad/addressPostcode` 필드 사용 (미세 변형).
- **heavy-metal만 이탈**: 인라인 리스너(heavy-metal-script.js:1415-1437)가 `{type: '중금속', data: 전체레코드}` 형태로 저장 — **다른 4곳과 데이터 포맷 자체가 다름**. 공통화 시 label-print 페이지의 양 포맷 수용 여부 확인 필수.

---

## 5. 안전망 평가 (tests/e2e/ — Playwright, docs/ 빌드 대상, playwright.config.js:23,39-40)

총 16개 spec, 2,389줄. 6개 메서드별 커버리지:

| 메서드 | 커버 | 근거 | 회귀 감지력 |
|---|---|---|---|
| `submitForm` | soil/compost/water만, 부분적 | form-submission.spec.js:10-49 (soil 입력→등록→목록 텍스트 확인), :68(compost), :109(water). 단 soil 검증이 `if (hasData)` 조건부(form-submission.spec.js:44-48)라 **0행이어도 통과하는 약한 단언**. data-persistence.spec.js:62-88은 등록 후 `#logTableBody` 텍스트를 무조건 단언(가장 강함). **pesticide/heavy-metal 제출 플로우 테스트 전무** (두 spec 모두 필드 존재/입력 가능 확인뿐 — pesticide-form.spec.js:40-55, heavy-metal-form.spec.js:36-46) | 중(3타입)/없음(2타입) |
| `resetForm` | soil/compost/water | form-submission.spec.js:51-65, edit-delete.spec.js:149,164,184 — `#navResetBtn` 클릭 후 name 비움 확인. 접수번호 보존/재생성 정책·편집모드 해제는 미검증 | 중 |
| `editSample` | soil만 | edit-test.spec.js:5-101 (등록→수정 버튼→값 변경→재등록→`expect(newName).toBe('수정된이름')` :100-101 — 실질 검증). edit-delete.spec.js는 버튼 **존재**만 확인(:31,43) | 중(soil)/없음(나머지 4타입) |
| `filterAndRenderLogs` | 표면적 | search-filter.spec.js — 5개 타입 모두 검색 모달 열기는 확인하나(soil :19-108, 나머지 :120-178) 입력 후 **필터링 결과 행 수/내용 단언 없음**. 완료상태·접수번호 범위 필터 동작 미검증 | 약 |
| `prepareDataForRender` | 간접 | soil flatten은 parcel-duplicate.spec.js(92줄)와 edit-test가 간접 통과. 정렬 동작 단언 없음 | 약 |
| `migrateCompletedField` | 없음 | 레거시 `completed` 필드 시드 후 로드하는 테스트 없음 | 없음 |

**종합**: 리팩토링 안전망으로는 **불충분**. soil 제출/수정/리셋만 실질 보호되고, pesticide·heavy-metal은 6개 메서드 전부 무방비. 권고: 공통화 착수 전 (1) 5개 타입 공통 "등록→목록 단언→수정→단언→리셋" 파라미터라이즈드 스모크 추가, (2) localStorage 시드 기반 마이그레이션/필터 결과 단언 테스트 추가. 기존 `if (hasData)` 조건부 단언(form-submission.spec.js:44)은 무조건 단언으로 강화 필요.

---

## 6. soil 특수성 — Base 우회와 공통화 충돌 지점

soil은 Firebase 동기화 전략이 Base와 정반대(전체 batchSave ↔ 변경분 개별 write)라서, 6개 메서드를 Base로 올릴 때 **저장/삭제를 건드리는 모든 공통 코드가 soil 분기를 요구**한다.

1. **`saveLogs()` 오버라이드 (soil-script.js:427-465)**: Base(:216-271)와 달리 **Firebase batchSave를 하지 않는 로컬 전용** 구현. `onBeforeSave`/`onAfterSave` 훅 호출도 없음(Base :220, :270) — soil에서는 이 두 훅이 **죽은 훅**. ID 부여도 복사본 교체 대신 in-place(:436-439, 외부 참조 고아화 방지 주석). sessionStorage `lastSaveTime` 기록(:464). → **충돌**: 공통 submitForm/마무리 시퀀스가 "saveLogs만 부르면 클라우드까지 동기화된다"고 가정하면 soil에서 클라우드 유실. soil은 항상 `saveLogs()+firebaseSaveRecords(변경분)` 쌍 호출 필요(예: soil-script.js:1709-1716, 1910-1912, 3984-3985, 4069).
2. **`deleteSample(id, receptionNumber=null)` 오버라이드 (soil-script.js:542-573)**: Base(:277-299)와 **시그니처부터 다름**(두 번째 인자 추가). `firebaseDeleteRecords`(개별 삭제, :496-511) 사용 + 편집 중 항목 삭제 시 `cancelEditMode()`(:556-558) + 접수번호 재사용 세팅(:561-572). 추가로 Base에 없는 `deleteGroup`(:580-606) 보유. → **충돌**: Base 테이블 이벤트 위임(:716-721)은 `deleteSample(id)` 단일 인자 호출 — soil은 자체 위임(soil-script.js:3688, 3695)에서 receptionNumber를 넘김. 공통 삭제 플로우 설계 시 시그니처 통일 또는 옵션 객체화 필요.
3. **`_retryCloudSyncAction()` 오버라이드 (soil-script.js:533-536, 직전 L2 작업)**: Base 기본(:328-330, `saveLogs()` 재호출=batchSave 재시도)이 soil에서는 무의미하므로 `saveLogs()+firebaseBatchSync()`로 교체. Base JSDoc(:324-327)이 이 오버라이드 지점을 명문화 — **이미 확립된 "동기화 전략 훅" 선례**이며, 새 공통화도 이 패턴(전략 메서드 분리)을 따라야 함.
4. **개별 동기화 3종 세트는 soil에만 존재**: `firebaseSaveRecords`(:496-511), `firebaseDeleteRecords`(:517-528), `firebaseBatchSync`(:530-548 부근). 다른 4타입은 Base의 batchSave 경로 사용(단, pesticide 그룹 수정 시 개별 delete 직접 호출 — pesticide-script.js:856-864 — soil 방식의 부분 차용이 이미 발생).
5. **편집 상태 변수 이원화**: soil은 `editingLogId`/`editingGroupId`/`editingGroupLogs`(soil-script.js:1976-1978), 나머지는 `editingId`(+water/pesticide `editingGroupIds`). Base의 `this.editingId`(:30)와 불일치 — 공통 editSample/resetForm 승격 전 상태 변수 통일이 선행 과제.
6. **resetForm 의미 차이**: soil `resetForm`은 `cancelEditMode` 위임(:2018-2020)이며 navResetBtn은 아예 별도 메서드 `resetFormKeepReceptionInfo`(:3419, 바인딩 :4166)를 사용 — Base cancelBtn 플로우(:888-895)와 다른 UX. 공통 resetForm 훅 설계 시 soil의 "접수정보 유지 리셋" 변형을 훅으로 수용해야 함.

**결론적 함의**: §2의 6개 메서드 중 저장·삭제와 무관한 `filterAndRenderLogs`/`migrateCompletedField`/`prepareDataForRender`는 soil 충돌 없이 즉시 승격 가능. `editSample`/`resetForm`은 상태 변수 통일 후 가능. `submitForm`은 "저장 전략(배치 vs 개별)"을 `_retryCloudSyncAction` 선례처럼 전략 훅(예: `persistRecords(newLogs, removedIds)`)으로 분리해야 soil을 깨지 않는다.
