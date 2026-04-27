# 흙토람 결과 입력 — 엑셀 가져오기 모달 설계 문서

> **티켓**: SAMPL-1-1 (`3c937f22-6b43-4085-8be4-4f77facb1921`)
> **작성일**: 2026-04-27
> **작성자**: Claude Code (사용자 협의 기반)
> **대상 영역**: `src/heuktoram/` (흙토람 결과 입력 페이지)
> **상태**: 설계 (Phase 미정 — 구현 착수 전 의사결정 필요)

---

## 0. 요약 (TL;DR)

흙토람 결과 입력 페이지의 현재 "셀 클릭 → Ctrl+V" 방식은 엑셀의 컬럼 순서·행 정렬·헤더 위치에 강하게 의존하여 사용자 실수를 유발한다. **파일 업로드 + 시트별 그리드 미리보기 + 행·열 시각 지정 + 흙토람 필드 매핑 + 본필지/하위필지 자동 동기화**로 전환하면 실 데이터(`sample.xlsx`) 분석 결과 모든 패턴을 안정적으로 흡수할 수 있다.

3단계로 점진 출시:

| Phase | 범위 | 예상 공수 |
|---|---|---|
| **P1** | 모달 + 텍스트 붙여넣기 + 컬럼 명시 매핑 | 0.5일 |
| **P2** | 파일 업로드 + 시트 탭 + 그리드 미리보기 + 행·열 시각 지정 | 2~3일 |
| **P3** | 매핑 프로파일 저장 + 자동 추정 학습 + 일괄 작업 | 1일 |

---

## 1. 배경

### 1.1 현재 구현의 한계

`src/heuktoram/heuktoram-script.js:762-817` `handlePaste()`는 다음 가정에 의존한다:

1. 사용자가 **시작 셀을 정확히 클릭**해야 한다.
2. 엑셀의 **컬럼 순서**가 흙토람 16개 필드 순서(`testDate`→`usageCode`)와 일치해야 한다.
3. 엑셀의 **행 순서**가 화면에 표시된 시료 행 순서와 일치해야 한다.
4. 엑셀에 **헤더 행이 없거나** 헤더 행을 사용자가 수동으로 잘라내야 한다.
5. **빈 셀도 그대로 덮어쓴다** (이미 입력된 값이 빈 값으로 사라질 수 있음).

이 5개 가정이 모두 실 데이터에서 자주 깨진다.

### 1.2 실 데이터(`sample.xlsx`) 분석 — 한계의 구체적 사례

`/Users/leechanhee/Dropbox/Mac/Downloads/sample.xlsx` (3시트, 14.8KB) 분석 결과:

| 시트 | 행수 | 열수 | 헤더 위치 | 매칭 키 컬럼명 | 결과 컬럼 |
|---|---:|---:|---|---|---|
| `인산 규산` | 16 | 3 | R1 | `번호` | `인산` / `규산` (둘 중 하나만) |
| `유기물` | 74 | 4 | **R3** (R1 빈, R2 기관명) | `시료 이름` (문자/숫자 혼재) | `최종 결과값\nOM(g/kg)` |
| `ph, ec` | 26 | 3 | R1 | `정체` (오타, 추정 = 검체) | `pH`, `Calculated EC value` |

이 한 파일에서 다음이 모두 발생한다:

- 시트마다 **헤더 위치가 다름** (R1 vs R3)
- 헤더에 **줄바꿈/오타/영문 혼재** (`측정값\nTC(%)`, `정체`, `Calculated EC value`)
- 시료 번호가 **문자열·숫자 혼재** (`'436'` vs `502`)
- 시료 번호가 **비순차** (`인산 규산` 시트: 1~14 → 17 → 21 → 42)
- **빈 셀이 정상 데이터** (인산 또는 규산 둘 중 하나만 측정)
- 시트마다 **다른 결과 항목**만 담김 (16개 컬럼 양식과 미일치)

현재 방식으로는 위 6가지가 모두 사용자 실수로 이어진다.

### 1.3 개선 방향

> **에러를 줄이는 가장 빠른 길은 "사용자 의도를 명시화"하는 것이다.**

행 매칭(어느 시료에?)과 열 매칭(어느 항목에?) 두 축을 사용자가 화면에서 시각적으로 지정하게 하면, 엑셀 양식이 어떻든 정확히 들어간다. 텍스트 붙여넣기보다 **파일 자체를 인식**하면 데이터 타입(날짜·숫자) 보존, 시트 자동 분리, 빈 셀 명확화까지 동시에 해결된다.

---

## 2. 요구사항

### 2.1 기능 요구사항 (FR)

| ID | 요구사항 | Phase |
|---|---|---|
| FR-1 | 결과 입력 페이지에 "엑셀로 결과 입력" 진입 버튼 추가 | P1 |
| FR-2 | 텍스트 붙여넣기 모드: 큰 textarea 1개 + 매핑 UI | P1 |
| FR-3 | 매칭 키(시료번호) 컬럼 사용자 지정 | P1 |
| FR-4 | 결과 항목(흙토람 16개 필드) 다중 선택 + 컬럼 매핑 | P1 |
| FR-5 | 저장 전 미리보기 (매칭 N건 / 미매칭 M건 / 범위초과 K건) | P1 |
| FR-6 | 본필지 → 하위필지(`-1`, `-2`) 자동 동기화 | P1 |
| FR-7 | 빈 셀은 덮어쓰지 않음 (옵션 토글) | P1 |
| FR-8 | 기존값 충돌 시 미리보기에서 "기존 → 신규" 표시 | P1 |
| FR-9 | `.xlsx`/`.xls` 파일 업로드 (드래그앤드롭 + 파일선택) | P2 |
| FR-10 | 시트 탭으로 시트 전환, 시트별 매핑 상태 독립 보존 | P2 |
| FR-11 | 시트 데이터를 엑셀 모양 그리드로 미리보기 (행번호·A/B/C 헤더) | P2 |
| FR-12 | 그리드의 **행 번호 클릭** → 헤더 행 지정 | P2 |
| FR-13 | 그리드의 **컬럼 헤더 클릭** → 매칭 키/필드 매핑 | P2 |
| FR-14 | 헤더 위치 자동 추정 (첫 비어있지 않은 행) | P2 |
| FR-15 | 매칭 키 정규화 (문자/숫자 혼재 → `String().trim()`) | P2 |
| FR-16 | 매핑 프로파일 저장/불러오기 (localStorage) | P3 |
| FR-17 | "지난 매핑 적용" 버튼 — 같은 양식 반복 입력 가속 | P3 |
| FR-18 | 미매칭 행 CSV 다운로드 | P3 |

### 2.2 비기능 요구사항 (NFR)

| ID | 항목 | 기준 |
|---|---|---|
| NFR-1 | 보안 | 파일 파싱은 **클라이언트 사이드 단독** (서버 업로드 0). 시료 정보 외부 유출 위험 0. |
| NFR-2 | 성능 | 1000행 미만에서 60fps 유지. 그 이상은 가상 스크롤로 처리(P2 마지막 단계). |
| NFR-3 | 호환성 | 현재 `handlePaste`(직접 셀 붙여넣기) 동작은 **유지**. 모달은 추가 진입점. |
| NFR-4 | 가독성 | 미리보기 그리드의 매핑된 컬럼은 색 배지로 즉시 식별 가능. |
| NFR-5 | 접근성 | 키보드만으로 모달 전 단계 완료 가능 (Tab/Enter/Esc). |
| NFR-6 | XSS | 엑셀 셀 값은 `sanitize.js`의 `escapeHTML`로 일괄 처리. |
| NFR-7 | 다크모드 | 기존 페이지 다크모드 토큰 그대로 사용. |

---

## 3. UX 설계

### 3.1 진입점

```
┌─ [흙토람] 결과 입력 페이지 ─────────────────────────────┐
│ ... 기존 도구바 ...                                       │
│ [📋 엑셀로 결과 입력]  ← 신규 버튼                       │
│ [📥 직접 붙여넣기 안내]  ← 기존 동작 설명 (모달 toggle) │
└──────────────────────────────────────────────────────────┘
```

기존 직접 셀 붙여넣기는 그대로 동작. 새 모달은 **별도 진입점**으로 추가하여 사용자가 상황에 맞게 선택.

### 3.2 모달 흐름 (Phase 2 기준)

```
┌─[1]─────────┐  ┌─[2]─────────┐  ┌─[3]─────────┐  ┌─[4]─────────┐
│ 파일 업로드  │→ │ 시트 선택    │→ │ 그리드 매핑  │→ │ 미리보기·저장 │
│ (.xlsx/.xls) │  │ (자동 탭)    │  │ 행·열 시각  │  │ N건 매칭 표시│
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
                                       ▲    ▲
                                       │    │
                              헤더 행 클릭  컬럼 헤더 클릭
                              ("이 행이 헤더") ("매칭 키" / "pH" / ...)
```

### 3.3 모달 전체 와이어프레임

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🟢 엑셀로 결과 입력                                          [✕]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  📂 파일:  sample.xlsx (14.8 KB)                       [파일 변경]   │
│                                                                       │
│  📑 시트:  ┌──────────┬──────────┬─────────┐                        │
│           │ 인산 규산  │ 유기물 ★  │ ph, ec  │                        │
│           └──────────┴──────────┴─────────┘                        │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │     │  A         │  B         │  C [매핑▼] │  D [매핑▼] │    │
│  │ R1  │            │            │            │            │    │
│  │ R2  │ 봉화군농…   │            │            │            │    │
│  │ R3 ★│ 연번        │ 시료 이름   │ 측정값 TC… │ 최종 OM…   │ ◀ 헤더 │
│  │ R4  │ 1          │ '436'      │ 1.96       │ 29.03      │    │
│  │ R5  │ 2          │ '437'      │ 1.06       │ 15.70      │    │
│  │ ... │            │            │            │            │    │
│  │ R74 │ 69         │ 504        │ 2.12       │ 31         │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                       │
│  📋 매핑 상태                                                        │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ 🔑 매칭 키           : B열 (시료 이름)            [변경]   │    │
│  │ 🟦 유기물(organicMatter): D열 (최종 OM g/kg)      [변경]   │    │
│  │ ⬜ pH                : (미매핑)                  [지정]   │    │
│  │ ⬜ EC                : (미매핑)                  [지정]   │    │
│  │ ⬜ 유효인산           : (미매핑)                  [지정]   │    │
│  │ ... (16개 필드)                                            │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ⚙️  옵션                                                            │
│   ☑ 빈 셀은 덮어쓰지 않음                                           │
│   ☑ 본필지 결과를 하위필지(-1,-2)에 자동 반영                        │
│   ☐ 기존 값이 있으면 건너뛰기  (해제 시 덮어쓰기)                    │
│                                                                       │
│  🔍 미리보기 (D열 매핑 기준)                                          │
│   ✅ 69건 매칭  ⚠️  0건 미매칭  ⚠️  2건 범위초과(OM<1 또는 >300)    │
│                                                                       │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ 시료 436 ▶ organicMatter: (없음 → 29.03)                 │    │
│  │ 시료 437 ▶ organicMatter: (없음 → 15.70)                 │    │
│  │ ... (개별 행 펼치기 가능)                                    │    │
│  └───────────────────────────────────────────────────────────┘    │
│                                                                       │
│                          [취소]  [지난 매핑 적용]  [69건 저장]       │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 인터랙션 상세

| 사용자 동작 | 시스템 반응 | 코드 후보 |
|---|---|---|
| 파일 드롭 또는 선택 | `XLSX.read` 후 시트 탭 표시, 첫 시트 활성 | `_handleFileDrop` |
| 시트 탭 클릭 | 그리드 영역에 해당 시트 데이터 렌더 | `_renderSheet(sheetName)` |
| **행 번호 클릭** | "이 행을 헤더로 지정" 컨펌 → 위쪽은 회색 처리 | `_setHeaderRow(rowIdx)` |
| **컬럼 헤더 클릭** | 팝오버 → "매칭 키" / "흙토람 필드" 선택 | `_assignColumn(colIdx, type)` |
| 매핑 변경 | 미리보기 즉시 재계산 (debounce 200ms) | `_recomputePreview()` |
| 옵션 토글 | 미리보기 즉시 재계산 | 동상 |
| `[저장]` | `applyResults()` → `testResults` 업데이트 + `syncToSiblings` | `_commit()` |
| `Esc` | 모달 닫기 (변경사항 잃음 경고) | `_closeModal` |

### 3.5 미리보기 시각 규칙

| 상태 | 색상/배지 |
|---|---|
| 매칭 성공 | 녹색 체크 ✅ |
| 미매칭 (시료번호 없음) | 황색 ⚠️ + 미매칭 키 표시 |
| 매칭됐으나 값이 비어있음 | 회색 — (옵션에 따라 건너뛰기) |
| 범위 초과 (`fieldRanges` 위반) | 주황 경고 (저장은 가능, 시각 표시) |
| 기존 값 덮어쓰기 | 청색 배지 `(기존: X → 신규: Y)` |
| 본필지→하위필지 동기화 예정 | 보라 배지 `(+2 하위필지 동시 반영)` |

---

## 4. 기술 설계

### 4.1 모듈 구조

신규 모듈 1개 + 기존 모듈 재사용:

```
src/heuktoram/
├── heuktoram-script.js       (기존, 수정: 진입 버튼·callback만 추가)
├── heuktoram-result-importer.js  (신규, 본 문서의 핵심)
└── index.html                (수정: 모달 마크업 추가)

src/shared/
├── excel-import-manager.js    (재사용: 파싱·자동매핑 로직 일부 차용)
├── sanitize.js                (재사용: escapeHTML)
└── constants.js               (수정: 흙토람 필드 라벨 사전 추가)
```

> **재사용 결정 이유**: 기존 `ExcelImportManager`는 시료 *목록* 가져오기용이고 DOM ID(`excelImportModal`, `excelImportStep1` 등)를 고정해서 사용한다. 흙토람 결과 입력은 *결과 컬럼*을 채우는 다른 모드이므로, **별도 클래스로 분리**하되 다음 코드 패턴을 차용한다:
> - `XLSX.read(data, { type: 'array' })` (`excel-import-manager.js:148`)
> - `sheet_to_json(ws, { header: 1, defval: '' })` (`excel-import-manager.js:151`)
> - 자동 매핑 (헤더 정규화 후 패턴 매칭, `excel-import-manager.js:191-208`)
> - `sanitizeExcelAoa()` (XSS 방지)

### 4.2 클래스 설계

```javascript
class HeuktoramResultImporter {
    constructor(config) {
        // config:
        //   resultFields: string[]            (흙토람 16개 필드 키)
        //   fieldLabels:  { [key]: string }   (한글 라벨)
        //   fieldRanges:  { [key]: {min,max,label,unit} }
        //   flatRows:     {key, sampleNumber, isMain, parentKey}[]  (현재 화면 시료 목록)
        //   testResults:  { [rowKey]: { [field]: value } }  (현재 결과)
        //   onApply:      (updates) => void   (저장 콜백)
        //   syncToSiblings: (rowKey, field, value) => void  (기존 함수 주입)

        this.config = config;
        this.state = this._initialState();
    }

    /** 모달 열기 (진입점) */
    open() { ... }

    /** 파일 → 워크북 → 시트 캐시 */
    async _loadFile(file) { ... }
        // XLSX.read(buffer, { type: 'array', cellDates: true })
        //   ↓
        // workbook.SheetNames.forEach → sheet_to_json (header:1, defval:null)
        //   ↓
        // this.state.sheets[sheetName] = { rows: [[...]], maxRow, maxCol }

    /** 시트 활성화 + 헤더 자동 추정 */
    _activateSheet(sheetName) { ... }
        // headerRowIdx = inferHeaderRow(rows)
        //   = 첫 번째로 셀 채움률 ≥ 50% 인 행

    /** 그리드 렌더 (행번호 + A/B/C 헤더 + 데이터) */
    _renderGrid() { ... }
        // 1000행 미만: 일반 <table>
        // 이상: 가상 스크롤 (P2 마지막 단계)

    /** 행 번호 클릭 → 헤더 지정 */
    _setHeaderRow(rowIdx) { ... }

    /** 컬럼 헤더 클릭 → 매핑 팝오버 */
    _assignColumn(colIdx, type, fieldKey?) { ... }
        // type: 'matchKey' | 'field' | 'unmap'

    /** 매칭 + 검증 + 미리보기 빌드 */
    _recomputePreview() {
        // 1. 매칭 키 컬럼 가져오기
        // 2. 모든 데이터 행을 순회
        //    - 키 정규화: String(row[keyCol]).trim()
        //    - flatRows에서 sampleNumber === key && isMain 검색
        // 3. 매핑된 각 필드에 대해
        //    - 빈 셀 + skipEmpty 옵션 → 건너뛰기
        //    - 기존값 + skipExisting 옵션 → 건너뛰기
        //    - fieldRanges 검증 → 범위초과 플래그
        //    - 본필지 매칭 시 하위필지 보존 표시
        // 4. 결과 객체 빌드:
        //    {
        //      matched: [{rowKey, field, oldValue, newValue, siblings: [...]}],
        //      unmatched: [{rowIdx, key}],
        //      rangeViolations: [{rowKey, field, value, range}],
        //    }
    }

    /** 저장 커밋 */
    _commit() {
        // matched 모든 항목을 onApply 콜백으로 전달
        // 본필지 항목은 syncToSiblings 호출
        // 토스트 + 모달 닫기
    }
}
```

### 4.3 데이터 모델

#### 4.3.1 모달 내부 상태

```typescript
interface ImporterState {
  mode: 'file' | 'paste';        // P1: 'paste'만, P2: 'file' 추가
  workbook: XLSX.WorkBook | null;
  sheets: {
    [sheetName: string]: {
      rows: any[][];              // 모든 셀 (header:1)
      headerRowIdx: number | null;
      mapping: {
        matchKeyCol: number | null;
        fields: { [colIdx: number]: string };  // colIdx → 흙토람 필드 키
      };
    };
  };
  activeSheet: string;
  options: {
    skipEmpty: boolean;          // 기본 true
    skipExisting: boolean;       // 기본 false
    syncSiblings: boolean;       // 기본 true
  };
  preview: PreviewResult | null;
}

interface PreviewResult {
  matched: Array<{
    rowKey: string;
    sampleNumber: string;
    field: string;
    oldValue: any;
    newValue: any;
    siblings: string[];          // 동기화될 하위필지 rowKey 목록
    rangeWarning?: string;
  }>;
  unmatched: Array<{ excelRowIdx: number; key: string }>;
  rangeViolations: number;       // 매칭은 됐으나 범위 초과
  totalCells: number;
}
```

#### 4.3.2 매핑 프로파일 (P3)

```typescript
interface MappingProfile {
  id: string;
  name: string;                  // 사용자 지정명 (예: "흙토람 보고서 양식 v2")
  signature: string;             // 헤더 키들의 해시 (자동 매칭용)
  sheetMappings: {
    [sheetNamePattern: string]: {
      headerRowIdx: number;
      matchKeyHeader: string;    // 헤더 텍스트로 저장 (인덱스 X)
      fields: { [headerText: string]: string };  // 헤더텍스트 → 필드키
    };
  };
  createdAt: string;
  lastUsedAt: string;
}

// localStorage key: heuktoramImportProfiles_v1
```

### 4.4 핵심 알고리즘

#### 4.4.1 헤더 행 자동 추정

```javascript
function inferHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    const filled = row.filter(c => c !== null && c !== '' && c !== undefined).length;
    const fillRate = filled / row.length;
    // 헤더 휴리스틱: 채움률 ≥ 50% + 첫 셀이 문자열 + 다음 행에 숫자가 1개 이상
    if (fillRate >= 0.5 && typeof row[0] === 'string' && hasNumberInNextRow(rows, i)) {
      return i;
    }
  }
  return 0; // 기본값
}
```

`sample.xlsx`의 `유기물` 시트:
- R1: 모두 `null` → fillRate 0% → 스킵
- R2: 1셀만 채움 → fillRate 25% → 스킵
- R3: 4셀 모두 채움 → fillRate 100% → 헤더로 인식 ✅

#### 4.4.2 자동 컬럼 매핑

기존 `excel-import-manager.js:191-208`의 `_autoMap` 패턴을 흙토람 필드 사전으로 확장:

```javascript
const HEUKTORAM_HEADER_PATTERNS = {
  // 매칭 키 후보
  '시료번호':   { type: 'matchKey' },
  '시료이름':   { type: 'matchKey' },
  '연번':       { type: 'matchKey' },
  '번호':       { type: 'matchKey' },
  '검체':       { type: 'matchKey' },
  '정체':       { type: 'matchKey' },  // sample.xlsx 오타 대응

  // 흙토람 결과 필드
  'pH':                       { type: 'field', key: 'pH' },
  'ec':                       { type: 'field', key: 'ec' },
  'calculatedecvalue':        { type: 'field', key: 'ec' },
  '유기물':                   { type: 'field', key: 'organicMatter' },
  '최종결과값om':              { type: 'field', key: 'organicMatter' },
  'om(g/kg)':                 { type: 'field', key: 'organicMatter' },
  '인산':                     { type: 'field', key: 'availableP' },
  '유효인산':                 { type: 'field', key: 'availableP' },
  '규산':                     { type: 'field', key: 'silica' },
  '유효규산':                 { type: 'field', key: 'silica' },
  '치환성칼륨':               { type: 'field', key: 'exK' },
  '치환성칼슘':               { type: 'field', key: 'exCa' },
  '치환성마그네슘':            { type: 'field', key: 'exMg' },
  '석회요구량':               { type: 'field', key: 'limeReq' },
  'no3-n':                    { type: 'field', key: 'NO3N' },
  'nh4-n':                    { type: 'field', key: 'NH4N' },
  'cec':                      { type: 'field', key: 'cec' },
  // ...
};

function normalizeHeader(text) {
  return String(text).replace(/\s+/g, '').replace(/[\r\n]/g, '').toLowerCase();
}
```

`sample.xlsx`의 `유기물` 시트 헤더 `'측정값\nTC(%)'`는 `'측정값tc(%)'`로 정규화되어 패턴에 없으므로 미매핑 — 사용자가 직접 D열을 `organicMatter`로 지정해야 함. 그러나 `'최종 결과값\nOM(g/kg)'`은 정규화 후 `'최종결과값om(g/kg)'`로 매칭되어 자동 추정 성공.

#### 4.4.3 매칭 로직

```javascript
function matchByKey(rows, headerRowIdx, matchKeyCol, flatRows) {
  const dataRows = rows.slice(headerRowIdx + 1);
  const keyMap = new Map();
  flatRows
    .filter(r => r.isMain)              // 본필지만 매칭 대상
    .forEach(r => keyMap.set(String(r.sampleNumber).trim(), r));

  return dataRows.map((row, i) => {
    const rawKey = row[matchKeyCol];
    if (rawKey == null || rawKey === '') return { excelRowIdx: i, status: 'empty' };
    const key = String(rawKey).trim();
    const matchedRow = keyMap.get(key);
    return matchedRow
      ? { excelRowIdx: i, status: 'matched', rowKey: matchedRow.key, key }
      : { excelRowIdx: i, status: 'unmatched', key };
  });
}
```

#### 4.4.4 본필지 → 하위필지 동기화

기존 `heuktoram-script.js:719-757` `syncToSiblings()` 그대로 호출. 모달은 함수 참조만 주입받아 사용:

```javascript
// 흙토람 페이지에서 모달 생성 시
const importer = new HeuktoramResultImporter({
  // ...
  syncToSiblings: (rowKey, field, value) =>
    this.syncToSiblings(rowKey, field, value),  // 기존 메서드 그대로
});
```

### 4.5 라이브러리·의존성

| 항목 | 라이브러리 | 추가 여부 |
|---|---|---|
| 엑셀 파싱 | `xlsx-js-style` (이미 설치) | ❌ (재사용) |
| 모달 UI | 기존 Tailwind 클래스 + 페이지별 CSS | ❌ |
| 파일 드롭 | 표준 `DragEvent` API | ❌ |
| 가상 스크롤 (1000행+) | `tanstack/virtual` 또는 자체 구현 | P2 후반에 결정 |
| 토스트 | `window.showToast` (이미 존재) | ❌ |
| XSS | `sanitize.js` `escapeHTML` | ❌ |

> **신규 npm 의존성 0**. 현재 프로젝트 자원만으로 P1·P2 완성 가능.

### 4.6 보안

| 위협 | 대응 |
|---|---|
| 엑셀 셀의 `=cmd|` 수식 (Excel CSV injection) | 현재 `sanitizeExcelAoa`(import 시점에 적용 X — 출력 시만)와 별개로, 가져오기 단계에서 셀 값을 **순수 문자열로 강제 변환** + 수식 토큰 제거 (`= + - @ \t \r`로 시작하면 prefix `'`) |
| 셀 값에 HTML/스크립트 | `escapeHTML` 일괄 적용 후 DOM 삽입 |
| 매우 큰 파일 (>10MB) DoS | 업로드 시 파일 크기 검사 (기본 한계 5MB), 초과 시 경고 |
| 매크로 포함 .xlsm | `xlsx-js-style`은 매크로 무시. 추가 검증 불필요. |
| 파일이 서버로 누출 | 클라이언트 단독 처리, `fetch`/`XHR` 호출 0 — 코드 리뷰에서 검증 |

### 4.7 성능

| 시나리오 | 현재 추정치 | 목표 |
|---|---|---|
| 100행 시트 파싱 + 렌더 | 50ms | 100ms 이내 |
| 1000행 시트 그리드 렌더 | 800ms (테이블 일반 렌더) | 200ms 이내 (가상 스크롤) |
| 매핑 변경 후 미리보기 갱신 | - | debounce 200ms |
| 저장 (1000행) | - | 500ms 이내 (`syncToSiblings` 호출 N회) |

가상 스크롤은 P2 마지막 단계에서 도입 (현재 시료 데이터 규모로는 1000행 미만이 일반적이라 P2 초기에는 불필요).

### 4.8 테스트 전략

#### 4.8.1 단위 테스트

| 함수 | 입력 | 기대 출력 |
|---|---|---|
| `inferHeaderRow` | `sample.xlsx`의 `유기물` 시트 | `2` (R3) |
| `inferHeaderRow` | `sample.xlsx`의 `인산 규산` 시트 | `0` (R1) |
| `normalizeHeader('측정값\nTC(%)')` | - | `'측정값tc(%)'` |
| `matchByKey` | 시료번호 `'436'` (문자열) vs `flatRows`에 `436` (숫자) | 매칭 ✅ |
| `matchByKey` | 비어있는 키 행 | `status: 'empty'` |
| `matchByKey` | flatRows에 없는 키 | `status: 'unmatched'` |
| `_recomputePreview` (skipEmpty=true) | 빈 셀 포함 | 빈 셀 항목 누락 |
| `_recomputePreview` (skipExisting=false) | 기존값 있음 | `oldValue → newValue` 표시 |

#### 4.8.2 E2E 테스트 (Playwright)

기존 `tests/e2e/`에 추가:

1. `heuktoram-excel-import-paste.spec.js` (P1): 텍스트 붙여넣기 + 매핑 + 저장
2. `heuktoram-excel-import-file.spec.js` (P2): `sample.xlsx` 업로드 → 시트 전환 → 헤더 R3 지정 → D열 매핑 → 저장 → 결과 검증
3. `heuktoram-excel-import-sibling.spec.js`: 본필지 입력 후 하위필지 자동 동기화 확인
4. `heuktoram-excel-import-empty.spec.js`: 빈 셀 옵션 ON/OFF 동작 확인

#### 4.8.3 회귀 테스트

기존 `handlePaste` 동작은 절대 깨지면 안 됨. 기존 페이스트 E2E (있다면) 모두 통과해야 함.

---

## 5. 단계적 출시 계획

### 5.1 Phase 1 — 모달 기본 골격 + 텍스트 붙여넣기 (0.5일)

**범위**:

- 결과 입력 페이지에 "엑셀로 결과 입력" 버튼 추가
- 모달 마크업 (헤더 행 입력, 매칭 키 컬럼 인덱스 입력, 16개 필드 매핑 UI, 큰 textarea)
- `HeuktoramResultImporter` 클래스 신규 작성 (텍스트 모드만)
- 매칭/검증/미리보기/저장 로직
- 본필지 → 하위필지 동기화 (`syncToSiblings` 재사용)

**완료 조건**:

- `sample.xlsx`의 `유기물` 시트 R3 헤더, 시료 이름 컬럼 매칭, OM 컬럼 매핑이 텍스트 붙여넣기로 처리됨
- 미리보기에서 매칭/미매칭/범위 초과 표시 정확
- 빈 셀 건너뛰기 옵션 동작
- 기존 `handlePaste` 전혀 영향 없음

### 5.2 Phase 2 — 파일 업로드 + 시트 탭 + 그리드 미리보기 (2~3일)

**범위**:

- 파일 드롭존 UI
- `XLSX.read` 통합, 다중 시트 추출
- 시트 탭 전환
- 그리드 렌더 (행번호·A/B/C 헤더·데이터 셀)
- 행 번호 클릭 → 헤더 행 지정
- 컬럼 헤더 클릭 → 매핑 팝오버
- 헤더 행 자동 추정 (`inferHeaderRow`)
- 자동 컬럼 매핑 사전 (`HEUKTORAM_HEADER_PATTERNS`)

**완료 조건**:

- `sample.xlsx`를 업로드 → 3개 시트 모두 매핑·저장 가능
- 1000행 시트가 200ms 이내 렌더 (가상 스크롤 도입 후)
- E2E 테스트 4개 모두 통과
- 다크모드 시각 일관성

### 5.3 Phase 3 — 매핑 프로파일 + 자동화 (1일)

**범위**:

- localStorage에 `heuktoramImportProfiles_v1` 저장
- 헤더 시그니처 자동 인식 → "이 양식 ◯◯◯ 프로파일이 있어요" 안내
- "지난 매핑 적용" 버튼
- 미매칭 행 CSV 다운로드 (`Blob` + `URL.createObjectURL`)
- 일괄 입력 시나리오: 한 번 매핑 후 여러 시트를 순차 적용

**완료 조건**:

- 같은 양식 엑셀 두 번째 입력 시 매핑 시간 1초 미만
- 미매칭 행 CSV에 시료번호·원본 데이터 모두 포함

---

## 6. 의사결정 필요 항목

구현 착수 전에 확정해야 할 5가지:

| # | 항목 | 옵션 | 권장 |
|---|---|---|---|
| 1 | 출시 단위 | (a) P1만 → 검증 후 P2 (b) 한 번에 P2까지 | **(a)** — 모달 UX 검증 후 진행 안전 |
| 2 | 매핑 프로파일 (P3) | (a) 출시 (b) 실사용 후 결정 | **(b)** — P1·P2 사용량 보고 결정 |
| 3 | 매칭 실패 행 처리 | (a) 무시 + 토스트 (b) 미리보기에 강조 + CSV 다운로드 (c) "신규 시료 생성" 옵션 | **(b)** — 사용자가 원인 파악 가능 |
| 4 | 지원 포맷 | (a) `.xlsx`만 (b) `.xlsx` + `.xls` (c) + `.csv` | **(b)** — `.csv`는 별도 모드로 추후 |
| 5 | 기존값 덮어쓰기 정책 | (a) 항상 덮어쓰기 (b) 빈 칸만 채우기 (c) 미리보기에서 "기존 → 신규" 표시 후 사용자 선택 | **(c)** — 가장 안전, 미리보기 활용 |

---

## 7. 영향 범위 / 변경 예상 파일

| 파일 | 변경 종류 | 분량 |
|---|---|---|
| `src/heuktoram/heuktoram-result-importer.js` | 신규 | ~500 LOC |
| `src/heuktoram/heuktoram-script.js` | 수정 (진입 버튼 콜백·`syncToSiblings` 노출) | ~30 LOC |
| `src/heuktoram/index.html` | 수정 (모달 마크업 추가) | ~150 LOC |
| `src/heuktoram/heuktoram-style.css` | 수정 (그리드·매핑 UI 스타일) | ~200 LOC |
| `src/heuktoram/heuktoram-entry.js` | 수정 (XLSX import 그대로 — 이미 사용 중) | 0 LOC |
| `src/shared/constants.js` | 수정 (`HEUKTORAM_HEADER_PATTERNS` 추가) | ~50 LOC |
| `tests/e2e/heuktoram-excel-import-*.spec.js` | 신규 (4개 파일) | ~300 LOC |
| `docs/` (배포본) | 빌드 산출물 자동 동기화 | 자동 |

기존 `handlePaste` 코드는 **건드리지 않음** — 두 진입점 병존.

---

## 8. 마이그레이션 / 호환성

- **기존 사용자 영향 0**: 기존 셀 직접 붙여넣기는 그대로. 모달은 추가 진입점.
- **localStorage 충돌 없음**: 기존 키(`soilSampleLogs_*`, `soilItemsPerPage`)와 충돌하지 않는 신규 키 `heuktoramImportProfiles_v1` 사용.
- **테스트 프로젝트 동기화**: 메모리 룰에 따라 메인 → `sample-log-electron-test`로 동기화 시 암호화 코드 보존 + STORAGE_KEY 접두사 유지 필요. 본 모달 자체는 암호화와 무관.
- **롤백 용이**: 진입 버튼 한 줄을 hidden 처리하면 즉시 비활성화 가능.

---

## 9. 부록

### 9.1 흙토람 16개 결과 필드 (코드 기준)

`heuktoram-script.js:68-71` `resultFields`:

| 순서 | 필드 키 | 한글 라벨 | 단위 | 범위 |
|---:|---|---|---|---|
| 1 | `testDate` | 검정일자 | - | - |
| 2 | `soiling` | 토양오염도 | - | - |
| 3 | `clay` | 토성 | - | - |
| 4 | `pH` | pH | - | 3.5 ~ 9.5 |
| 5 | `organicMatter` | 유기물 | g/kg | 1 ~ 300 |
| 6 | `availableP` | 유효인산 | mg/kg | (코드 참조) |
| 7 | `exK` | 치환성칼륨 | cmolc/kg | (코드 참조) |
| 8 | `exCa` | 치환성칼슘 | cmolc/kg | (코드 참조) |
| 9 | `exMg` | 치환성마그네슘 | cmolc/kg | (코드 참조) |
| 10 | `silica` | 유효규산 | mg/kg | (코드 참조) |
| 11 | `ec` | EC | dS/m | (코드 참조) |
| 12 | `limeReq` | 석회요구량 | kg/10a | (코드 참조) |
| 13 | `NO3N` | NO3-N | mg/kg | - |
| 14 | `cec` | CEC | cmolc/kg | (코드 참조) |
| 15 | `NH4N` | NH4-N | mg/kg | - |
| 16 | `usageCode` | 용도코드 | - | - |

### 9.2 `sample.xlsx` 분석 결과

| 시트 | 헤더 위치 | 매칭 키 컬럼 | 결과 컬럼 | 흙토람 필드 매핑 |
|---|---|---|---|---|
| `인산 규산` | R1 | `번호` (A열) | `인산` (B열) / `규산` (C열) | `availableP`, `silica` |
| `유기물` | R3 | `시료 이름` (B열) | `최종 결과값 OM(g/kg)` (D열) | `organicMatter` |
| `ph, ec` | R1 | `정체` (A열, 추정 = 검체) | `pH` (B열), `Calculated EC value` (C열) | `pH`, `ec` |

### 9.3 코드 참조 위치

- `src/heuktoram/heuktoram-script.js:62-71` — 결과 필드 정의
- `src/heuktoram/heuktoram-script.js:73-` `fieldRanges` — 범위 검증
- `src/heuktoram/heuktoram-script.js:248` — paste 이벤트 등록
- `src/heuktoram/heuktoram-script.js:719-757` — `syncToSiblings`
- `src/heuktoram/heuktoram-script.js:762-817` — 기존 `handlePaste`
- `src/heuktoram/heuktoram-script.js:1137-1151` — 기존 엑셀 다운로드 로직 (참조용)
- `src/heuktoram/heuktoram-entry.js:2` — `import * as XLSX from 'xlsx-js-style'`
- `src/shared/excel-import-manager.js:140-208` — 차용할 파싱·자동매핑 패턴
- `src/shared/sanitize.js` — `escapeHTML`

### 9.4 용어

| 용어 | 정의 |
|---|---|
| **본필지** | 한 시료에 대해 메인 행. `flatRows`의 `isMain: true`. |
| **하위필지** | 같은 시료의 분할 필지(`-1`, `-2`). 본필지 결과를 그대로 받음. |
| **매칭 키** | 엑셀 행과 화면 시료 행을 묶어주는 식별자. 일반적으로 시료번호. |
| **결과 컬럼** | 흙토람 16개 필드 중 하나. (`pH`, `ec`, `organicMatter` 등) |
| **자동 매핑** | 엑셀 헤더 텍스트를 정규화 후 `HEUKTORAM_HEADER_PATTERNS` 사전과 매칭. |
| **매핑 프로파일** | 같은 양식 엑셀을 반복 처리하기 위해 저장한 매핑 설정. |

---

## 10. 변경 이력

| 일자 | 작성자 | 내용 |
|---|---|---|
| 2026-04-27 | Claude Code | 최초 작성 (sample.xlsx 분석 + 4단계 UX + 4단계 기술 설계 + 3단계 출시 계획) |
