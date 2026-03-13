# 주소 필드 분리 및 파싱 개선

## 문제 설명

시료 접수 시스템에서 주소는 다음 필드로 구성되어 있습니다:
- `addressPostcode`: 우편번호 (예: 36239)
- `addressRoad`: 도로명주소 (readonly, 다음 우편번호 API로 자동 입력)
- `addressDetail`: 상세주소 (사용자 직접 입력)
- `address`: hidden 필드 (합쳐진 전체 주소, 예: "(36239) 경상북도 봉화군 봉화읍... 상세주소내용")

v1.7.67 이전에는 다음과 같은 문제가 발생했습니다.

## 주요 문제

### 문제 1: 토양(soil) 저장 시 개별 필드 미저장

**증상:**
- 토양 스크립트에서 `address: formData.get('address')` (hidden 합쳐진 값)만 저장
- `addressRoad`, `addressDetail`, `addressPostcode`를 별도 필드로 저장하지 않음
- water, compost, pesticide, heavy-metal은 이미 개별 필드를 저장하고 있었음

**영향:**
- 토양 시료만 데이터 일관성 부재
- 다른 시료 타입과 비교하면 데이터 구조 불일치

### 문제 2: 수정 시 상세주소가 본주소에 편입

**증상:**
- 편집 폼(`populateFormForEdit`)에서 `log.address` (합쳐진 문자열)를 regex로 파싱
- 기존 regex: `(.+?\))\s*(.*)` → 우편번호 괄호 기준으로만 분리 시도
- 상세주소와 도로명주소 사이 구분이 불가능

**결과:**
- 상세주소 전체가 readonly인 `addressRoad` 필드에 편입
- 사용자가 도로명주소 필드를 수정할 수 없는 상황 발생

**예시:**
```
저장된 address: "(36239) 경상북도 봉화군 봉화읍 원암로 5 2층 사무실"
파싱 시도:
  - 우편번호: 36239 ✓
  - 도로명: "경상북도 봉화군 봉화읍 원암로 5 2층 사무실" ✗
  - 상세주소: (구분 불가)
```

### 문제 3: 테이블/뷰 모달에서 상세주소 미표시

**증상:**
- 목록 테이블과 상세보기 모달에서 `addressRoad`만 표시
- `addressDetail` 필드 누락으로 전체 주소 정보 불완전

**영향:**
- 사용자가 확인해야 할 중요 정보(상세주소) 미표시
- 완전한 배송지/방문지 정보 제공 불가능

## 해결 방법 (v1.7.68)

### 수정 1: 토양 저장 로직 (soil-script.js)

토양 스크립트의 3개 저장 위치에 개별 필드 저장 추가:

1. **그룹 수정 저장** (줄 ~1615)
2. **단일 수정 저장** (줄 ~1710)
3. **신규 등록 저장** (줄 ~1784)

추가된 필드:
```javascript
addressPostcode: this.addressPostcode?.value,
addressRoad: this.addressRoad?.value,
addressDetail: this.addressDetail?.value
```

**영향:**
- 토양 시료도 다른 시료 타입과 동일한 필드 구조로 통일
- 데이터베이스 일관성 확보

### 수정 2: 편집 폼 주소 로드 (5개 시료 타입)

모든 시료 타입의 `populateFormForEdit` 함수 수정:

**패턴 (신규 데이터 - addressRoad 필드 존재):**
```javascript
if (this.addressPostcode) this.addressPostcode.value = log.addressPostcode || '';
if (this.addressRoad) this.addressRoad.value = log.addressRoad || '';
if (this.addressDetail) this.addressDetail.value = log.addressDetail || '';
if (this.addressHidden) this.addressHidden.value = log.address || '';
```

**레거시 폴백 (기존 데이터 - addressRoad 필드 없음):**
```javascript
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

**로직:**
1. 직접 필드 사용 (신규 데이터)
2. addressRoad 필드가 없으면 address 문자열 파싱
3. `(우편번호) 주소` 패턴으로 정규식 매칭
4. 패턴 매칭 실패 시 address 전체를 addressRoad에 할당

**수정된 파일:**
- `src/soil/soil-script.js` (populateFormForEdit + 그룹 편집 2곳)
- `src/pesticide/pesticide-script.js` (populateFormForEdit 1곳)
- `src/water/water-script.js`, `src/compost/compost-script.js`, `src/heavy-metal/heavy-metal-script.js` (레거시 폴백 추가)

### 수정 3: 테이블/뷰 모달 표시 (5개 시료 타입)

주소 표시 패턴:
```javascript
[row.addressRoad || row.address, row.addressDetail].filter(Boolean).join(' ')
```

**로직:**
1. `addressRoad` 있으면 사용, 없으면 `address` 폴백
2. `addressDetail` 추가
3. 공백으로 결합
4. 빈 값은 `filter(Boolean)` 제거

**표시 예:**
- 신규 데이터: "경상북도 봉화군 봉화읍 원암로 5 2층 사무실"
- 레거시 데이터: "(36239) 경상북도 봉화군... 상세주소"

## 레거시 데이터 호환성

### 호환성 전략

**기존 데이터 (v1.7.67 이전):**
```json
{
  "id": "sample-001",
  "address": "(36239) 경상북도 봉화군 봉화읍 원암로 5 2층 사무실",
  "addressPostcode": "36239",
  "addressRoad": null,
  "addressDetail": null
}
```

**신규 데이터 (v1.7.68 이후):**
```json
{
  "id": "sample-002",
  "address": "(36239) 경상북도 봉화군 봉화읍 원암로 5 2층 사무실",
  "addressPostcode": "36239",
  "addressRoad": "경상북도 봉화군 봉화읍 원암로 5",
  "addressDetail": "2층 사무실"
}
```

### 로드 시 처리

- **신규 데이터:** `addressRoad`, `addressDetail` 직접 사용
- **레거시 데이터:** `address` 문자열에서 파싱하여 자동 변환
- 패턴 매칭 실패 시 `address` 전체를 도로명에 할당 (데이터 손실 방지)

## 주소 데이터 흐름 (v1.7.68)

```
입력 단계
  ├─ 다음 우편번호 API → addressPostcode (예: 36239)
  ├─ 다음 우편번호 API → addressRoad (예: 경상북도 봉화군 봉화읍 원암로 5)
  └─ 사용자 입력 → addressDetail (예: 2층 사무실)

합성 단계
  └─ AddressManager.updateFullAddress()
     → address (hidden) = "(36239) 경상북도 봉화군 봉화읍 원암로 5 2층 사무실"

저장 단계
  └─ formData → 4개 필드 저장
     - address: "(36239) 경상북도 봉화군 봉화읍 원암로 5 2층 사무실"
     - addressPostcode: "36239"
     - addressRoad: "경상북도 봉화군 봉화읍 원암로 5"
     - addressDetail: "2층 사무실"

로드 단계 (편집)
  ├─ 신규 데이터 → log.addressRoad, log.addressDetail 직접 사용
  └─ 레거시 데이터 → log.address 파싱하여 addressRoad, addressDetail 복원

표시 단계 (테이블/모달)
  └─ [addressRoad || address, addressDetail].filter(Boolean).join(' ')
     → "경상북도 봉화군 봉화읍 원암로 5 2층 사무실"
```

## 영향 받는 파일

| 파일 | 변경 사항 |
|------|---------|
| `src/soil/soil-script.js` | 저장 3곳 + 편집 2곳 + 테이블/뷰 |
| `src/pesticide/pesticide-script.js` | 편집 1곳 + 테이블/뷰 |
| `src/water/water-script.js` | 편집 레거시 폴백 + 테이블 |
| `src/compost/compost-script.js` | 편집 레거시 폴백 |
| `src/heavy-metal/heavy-metal-script.js` | 편집 레거시 폴백 + 테이블/뷰 |

## 테스트 방법

### 1. 신규 시료 등록 테스트

1. 토양/수질/퇴비 등 페이지 접속
2. 다음 우편번호 API로 주소 검색 및 입력
3. 상세주소 직접 입력
4. 저장
5. **검증:** 개발자 도구 → 로컬스토리지 확인
   - `addressPostcode`, `addressRoad`, `addressDetail` 모두 저장되었는지 확인

### 2. 레거시 데이터 편집 테스트

1. v1.7.67 이전에 저장된 시료 검색
2. 편집 버튼 클릭
3. **검증:** 주소 필드가 올바르게 분리되어 표시되는지 확인
   - addressPostcode: 우편번호 파싱
   - addressRoad: 도로명 주소
   - addressDetail: 상세주소 (또는 빈 값)

### 3. 테이블 표시 테스트

1. 시료 목록 페이지에서 주소 열 확인
2. **검증:**
   - 신규 데이터: 도로명 + 상세주소 표시
   - 레거시 데이터: 파싱된 주소 표시

### 4. 상세보기 모달 테스트

1. 시료 행 클릭하여 상세보기 모달 열기
2. **검증:** 주소 정보가 완전하게 표시되는지 확인
   - 우편번호
   - 도로명주소
   - 상세주소 (있을 경우)

### 5. 호환성 테스트

1. 신규 데이터와 레거시 데이터 모두 정상 작동 확인
2. 레거시 데이터 편집 후 저장할 때 신규 포맷으로 변환 확인

## 향후 개선사항

### 1. 주소 데이터 마이그레이션

기존 데이터의 `address` 필드를 자동으로 파싱하여 `addressRoad`, `addressDetail`로 변환하는 마이그레이션 스크립트 개발 권장.

```javascript
// 예시 마이그레이션 로직
function migrateAddressData(logs) {
  return logs.map(log => {
    if (!log.addressRoad && log.address) {
      const match = log.address.match(/^\((\d{5})\)\s*(.+)$/);
      return {
        ...log,
        addressRoad: match ? match[2] : log.address,
        addressPostcode: match ? match[1] : log.addressPostcode
      };
    }
    return log;
  });
}
```

### 2. 주소 API 개선

다음 우편번호 API 대신 카카오맵 API 사용으로 더 정확한 주소 분리:
- 도로명주소와 지번주소 동시 제공
- 좌표 정보 포함
- 더 상세한 주소 정보 제공

### 3. 주소 입력 UI 개선

- 구/동 선택 드롭다운 추가
- 주소 검색 결과 미리보기
- 주소 호환성 검증 기능

## 버전 정보

- **수정 버전:** v1.7.68
- **영향 대상:** Electron 앱 + 웹 앱 (GitHub Pages)
- **테스트 프로젝트:** sample-log-electron-test 동기화 완료

---

**수정일**: 2026-03-13
**작성자**: Claude Opus 4
