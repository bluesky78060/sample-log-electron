# 흙토람 내보내기 모듈 가이드

## 개요

흙토람(Heuktoram)은 **국립농업과학원 흙토람 시스템**에 토양검정 결과를 일괄 업로드하기 위한 엑셀(.xlsx) 서식을 생성하는 모듈이다. 토양 접수 대장의 데이터를 읽어와 검정 결과를 입력하고, 흙토람 56컬럼 표준 서식으로 내보낸다.

## 파일 구조

```
src/heuktoram/
├── index.html              # 페이지 구조 (테이블, 네비게이션 바)
├── heuktoram-entry.js      # Vite 진입점 (ES Module imports)
├── heuktoram-script.js     # 비즈니스 로직 (HeuktoramManager 클래스)
└── heuktoram-style.css     # 전용 스타일 (보라색 테마)
```

## 토양 페이지와의 관계

### 데이터 흐름

```
토양 접수 대장 (soil)                        흙토람 내보내기 (heuktoram)
┌──────────────────────┐                    ┌──────────────────────┐
│ soilSampleLogs_2026  │ ── localStorage ──▶│ 접수 데이터 읽기      │
│ (접수번호, 성명,      │                    │ (읽기 전용, 수정 없음) │
│  필지주소, 작물,      │                    │                      │
│  경지구분, 면적 등)   │                    │ soilTestResults_2026  │
└──────────────────────┘                    │ (검정 결과 별도 저장)  │
                                            └──────────────────────┘
```

- **토양 데이터**: `soilSampleLogs_{year}` 키로 localStorage에서 **읽기만** 수행
- **검정 결과**: `soilTestResults_{year}` 키로 localStorage에 **별도 저장** (토양 데이터 원본 수정 없음)
- 두 데이터는 `rowKey` (`{logId}_{parcelIdx}_c{cropIdx}`)로 연결

### 페이지 간 이동

토양 접수 목록에서 흙토람 페이지로 이동할 때 **sessionStorage**를 통해 데이터를 전달한다:

```javascript
// 토양 페이지 (soil-script.js:3676~3681)
sessionStorage.setItem('heuktoram_year', this.selectedYear);        // 연도
sessionStorage.setItem('heuktoram_selected_ids', JSON.stringify(selectedIds));  // 선택된 접수 ID
sessionStorage.setItem('heuktoram_from', '../soil/index.html');     // 뒤로가기 경로
window.location.href = '../heuktoram/index.html';
```

```javascript
// 흙토람 페이지 (heuktoram-script.js:119~150)
// restoreFromSoilPage()에서 sessionStorage 읽고 삭제
const year = sessionStorage.getItem('heuktoram_year');
const selectedIdsJson = sessionStorage.getItem('heuktoram_selected_ids');
```

| sessionStorage 키 | 용도 | 사용 후 |
|---|---|---|
| `heuktoram_year` | 토양 데이터 연도 | 즉시 삭제 |
| `heuktoram_selected_ids` | 선택된 접수 ID 배열 (JSON) | 즉시 삭제 |
| `heuktoram_from` | 뒤로가기 대상 URL | 즉시 삭제 |

### 토양 페이지에 필요한 요소

토양 페이지(`soil/index.html`)에 흙토람 버튼이 있어야 한다:

```html
<button id="heuktoramBtn" ...>흙토람 내보내기</button>
```

## 구동 방식

### 초기화 순서

```
DOMContentLoaded
  └─ new HeuktoramManager()
       ├─ cacheElements()         # DOM 요소 캐싱
       ├─ setDefaultYear()        # 현재 연도 기본값
       ├─ restoreFromSoilPage()   # sessionStorage에서 연도/선택 ID 복원
       ├─ bindEvents()            # 이벤트 바인딩
       ├─ loadData()              # 토양 접수 데이터 + 검정 결과 로드
       │    ├─ loadSampleLogs()   # localStorage: soilSampleLogs_{year}
       │    ├─ loadTestResults()  # localStorage: soilTestResults_{year}
       │    └─ buildFlatRows()    # 계층 데이터 → flat 행 변환
       ├─ render()                # 테이블 렌더링
       └─ ThemeManager.init()     # 다크모드 초기화
```

### 핵심 데이터 변환: buildFlatRows()

토양 접수 데이터는 계층 구조(log → parcels → crops/subLots)이나, 흙토람 서식은 flat(행 1개 = 필지 1개)이다.

```
접수 #325 (안진환)
├── 필지: 소지리 535
│   ├── 작물1: 브로콜리 700평 → 접수번호: 325 (본필지)
│   └── 작물2: 양배추 600평  → 접수번호: 325-1 (하위필지)
└── 하위 지번: 소지리 515
    └── 작물: 무 400평       → 접수번호: 325-2 (하위필지)
```

**규칙:**
- 필지의 첫 번째 작물 = 본필지 (원본 접수번호)
- 같은 필지의 2번째+ 작물 = 하위필지 (-1, -2, ...)
- 실제 하위 지번(subLots)도 연번으로 이어짐
- `entryCounter`로 필지 단위 카운터 관리

### 검정 결과 동기화

같은 접수번호(log.id)의 모든 행은 **동일한 토양 시료**이므로 검정 결과를 자동 동기화한다:

```javascript
// syncToSiblings(key, field, value)
// 한 셀을 편집하면 같은 log.id의 모든 형제 행에 동일 값 전파
const siblingRows = this.flatRows.filter(r =>
    r.log.id === editedRow.log.id && r.key !== key
);
```

### 검정 결과 저장

```javascript
// localStorage 키: soilTestResults_{year}
// 값 구조:
{
    "{logId}_{parcelIdx}_c{cropIdx}": {
        "testDate": "2026-03-12",
        "soiling": "미해당",
        "clay": "",
        "pH": "6.5",
        "organicMatter": "25",
        "availableP": "180",
        "exK": "0.35",
        "exCa": "5.2",
        "exMg": "1.8",
        "silica": "",
        "ec": "0.8",
        "limeReq": "0",
        "NO3N": "",
        "cec": "",
        "NH4N": "",
        "usageCode": "0"
    }
}
```

## 엑셀 내보내기 서식 (56컬럼)

### 헤더 구조 (4행)

```
행1: 대분류 (채취정보, 필지, 의뢰인, 토양분석결과, ...)
행2: 중분류 (채취년도, 채취자, 경지구분, ...)
행3: 소분류 (연도, 성명, 1차, 2차, 용도구분, ...)
행4: 세부분류 (코드명, 코드, ...)
```

### 주요 데이터 컬럼 매핑

| 인덱스 | 컬럼명 | 값 출처 |
|--------|--------|---------|
| 0 | 필지/하위필지 구분 | `row.isSubLot ? '하위필지' : '필지'` |
| 1 | 채취년도 | 네비게이션 바 `collectYear` 입력값 |
| 2 | 시료채취자 | 네비게이션 바 `collector` 입력값 |
| 3 | 접수일자 | `row.log.date` |
| 4 | 경지구분 1차 | 고정: `'농가의뢰'` |
| 5 | 경지구분 2차 | `getCategoryCode()` → 논/밭/과수/시설/임야 |
| 6 | 용도구분 | `일반적인토양검정-0` ~ `녹비작물-3` (라벨+코드) |
| 7 | 시행전후 | 용도구분 0이면 빈값, 1~3이면 N/Y |
| 8 | 시료번호 | `row.log.receptionNumber` (원본, -1/-2 제외) |
| 9~12 | 시도/시군구/읍면동/리 | `parseLotAddress()` 파싱 결과 |
| 13 | 산 여부 | `isMountain ? '산' : ''` |
| 14~15 | 본번/부번 | 지번 파싱 |
| 18 | 면적(㎡) | 평이면 자동 변환 (`* 3.3058`) |
| 19 | 검정일 | `result.testDate` |
| 20~28 | 의뢰인 정보 | 성명, 도로명주소 파싱 |
| 32 | 작물명 | `row.crop.name` |
| 33 | 성토 여부 | 해당/미해당 |
| 34~46 | 검정 결과 13항목 | clay, pH, OM, AP, K, Ca, Mg, Si, EC, 석회, NO3N, CEC, NH4N |
| 47 | 전화번호 | `-` 제거 |
| 50~53 | 용도구분 체크 | 해당 코드에만 `'1'` |
| 54~55 | 시행전후 체크 | N→[54], Y→[55]에 `'1'` |

## 경지구분별 필수 검정 필드

| 경지구분 | 필수 필드 (노란 배경) |
|----------|----------------------|
| 밭/과수/시설/임야/성토 | pH, 유기물, 유효인산, K, Ca, Mg, EC, **석회요구량** |
| 논 | pH, 유기물, 유효인산, K, Ca, Mg, EC, **유효규산** |
| 작물 블루베리 | pH, 유기물, 유효인산, K, Ca, Mg, EC, **CEC** |

## 기본 숨김 컬럼

성토, 점토함량, NO3-N, NH4-N → 네비게이션 바 "전체보기" 버튼으로 토글

## 의존 모듈

```javascript
// heuktoram-entry.js
import * as XLSX from 'xlsx';        // 엑셀 생성
import '../shared/sanitize.js';       // XSS 방지
import '../bonghwaData.js';           // 봉화군 지역 데이터 (REGION_NAMES)
import '../shared/constants.js';      // 전역 상수
import '../shared/utils.js';          // 유틸리티
import '../shared/toast.js';          // 토스트 알림
import '../shared/address.js';        // 주소 데이터
import '../shared/address-parser.js'; // 주소 파싱
import '../shared/theme.js';          // 다크모드
import '../shared/tooltip.js';        // 툴팁
import '../shared/logger.js';         // 로깅
```

## Vite 빌드 설정

```javascript
// vite.config.js - rollupOptions.input에 추가
heuktoram: resolve(__dirname, 'src/heuktoram/index.html')
```

## 테스트 프로젝트 적용 시 주의사항

1. **localStorage 키**: 테스트 프로젝트는 `test_soilSampleLogs_{year}` 접두사를 사용하므로, `loadSampleLogs()`와 `loadTestResults()`의 키를 변경해야 함
2. **암호화**: 테스트 프로젝트에 암호화가 적용된 경우, localStorage 읽기 시 복호화 로직 추가 필요
3. **파일 복사 목록**:
   - `src/heuktoram/` 폴더 전체 복사
   - `vite.config.js`에 `heuktoram` 엔트리 추가
   - `src/soil/index.html`에 흙토람 버튼 추가 (이미 있다면 확인)
   - `src/soil/soil-script.js`에 흙토람 버튼 이벤트 확인
4. **동기화 제외 파일**: `heuktoram-script.js`의 localStorage 키가 `test_` 접두사인지 확인 후 복사
