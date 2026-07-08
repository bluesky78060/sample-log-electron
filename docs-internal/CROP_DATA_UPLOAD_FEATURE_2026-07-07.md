# 작물 데이터 직접 업로드 기능 — 설계·구현·버그수정 문서

- **버전**: v1.17.0 (2026-07-07 릴리스)
- **관련 티켓**: SAMPL-1-126(기능), SAMPL-1-127(토스트 수정), SAMPL-1-128(파서 수정)
- **대상**: 메인 프로젝트(`sample-log-electron`)
- **작성일**: 2026-07-07

---

## 1. 배경 및 목적

### 1.1 해결하려는 문제

작물 코드 데이터(`CROP_DATA`)는 농촌진흥청 비료사용처방(흙토람) 작물정보를 기준으로 하며, **매년 1회 갱신**된다. 기존에는 이 데이터가 `src/cropData.js` 소스코드 안에 하드코딩되어 있어, 데이터만 바뀌어도 매번 다음 과정을 거쳐야 했다.

1. 새 엑셀을 받아 개발자가 `cropData.js` 배열을 수정
2. 빌드 → docs/ 재생성
3. 커밋 → 태그 → GitHub Actions 릴리스
4. 3개 프로젝트(메인/soil/테스트) 각각 반복

즉 **데이터 갱신인데 코드 배포 절차 전체**가 필요했다(직전 사례: SAMPL-1-125).

### 1.2 목표

담당자(비개발자)가 **설정 화면에서 새 엑셀을 업로드**하면, 코드 수정·재배포·개발자 개입 없이 작물 목록이 갱신되도록 한다. 사무실 여러 PC 환경을 고려해, 한 대에서 업로드하면 나머지 PC에도 자동 반영되어야 한다.

---

## 2. 아키텍처 개요

### 2.1 데이터 흐름

```
[설정 화면] 엑셀 업로드
    │
    ▼
parseCropExcelFile(ArrayBuffer)   ← 클라이언트에서 파싱(메모리)
    │  { data: [{code,name,category}], ... }
    ▼
saveCropDataUpload(parsed, version)
    ├─▶ 로컬 파일 저장: {userData}/crop-data.json  (envelope)
    ├─▶ Firestore 백업:  appConfig/cropData 문서    (best-effort)
    └─▶ window.CROP_DATA 즉시 교체 (재시작 불필요)

[앱 시작 시 — soil/heavy-metal/pesticide 페이지]
loadCropDataOnStartup()   ← fire-and-forget
    우선순위:  Firestore(더 최신) → 로컬 파일 → 번들 기본값(cropData.js)
```

### 2.2 3계층 저장 전략

| 계층 | 위치 | 역할 |
|---|---|---|
| **번들 기본값** | `src/cropData.js` (배열) | 최후의 안전망. 절대 삭제하지 않음. 로컬/클라우드가 모두 없을 때 사용 |
| **로컬 파일** | `{userData}/crop-data.json` | 실제 사용 데이터. envelope 구조 `{data, updatedAt, version}` |
| **Firestore** | `appConfig/cropData` 문서 | 여러 PC 동기화용 백업. 온라인·Firebase 설정 시에만 동작 |

**envelope 구조가 필수인 이유**: "Firestore가 로컬보다 최신인지"를 `updatedAt` 문자열(ISO8601) 비교로 판단하려면, 로컬 파일에도 타임스탬프가 있어야 한다. 순수 배열로 저장하면 이 비교가 불가능해 여러 PC 동기화가 깨진다.

### 2.3 핵심 원칙

- **오프라인 우선**: Firestore는 "있으면 좋은" 동기화 계층일 뿐, 필수 의존성이 아니다. 로컬 파일만으로 완전히 동작한다.
- **기동을 절대 막지 않음**: `loadCropDataOnStartup()`은 `await` 없이 fire-and-forget으로 호출한다. 네트워크(Firestore) 조회가 페이지 렌더를 막지 않는다. `CROP_DATA`는 사용자 인터랙션 시점(작물 자동완성 열 때)에만 참조되므로, 로딩이 그 전에 끝나면 되고 실패해도 번들 기본값이 유지된다.
- **부분 적용 방지**: 업로드 시 파싱 실패는 저장 전에 throw되어 기존 데이터가 보존된다. 로컬 저장 실패 시 중단(에러), Firestore 저장 실패는 경고만 하고 무시.

---

## 3. 구현 상세 (SAMPL-1-126)

### 3.1 신규 모듈: `src/shared/crop-data-loader.js`

`window.CropDataLoader`로 노출. 순수 로직(파싱/매핑)과 I/O 오케스트레이션을 분리해 단위 테스트가 가능하도록 구성.

| 함수 | 라인 | 역할 |
|---|---|---|
| `mapGroupToCategory(group)` | 21 | 작물구분(그룹) → cropData.js 카테고리 축약 매핑 |
| `parseCropRows(rows)` | 43 | 2차원 배열(sheet_to_json header:1) → `[{code,name,category}]`. 헤더 탐지·필터 |
| `parseCropExcelFile(arrayBuffer)` | 113 | .xlsx ArrayBuffer → 배열. `window.XLSX` 필요 |
| `getLocalCropPath()` | 132 | `{userData}/crop-data.json` 절대경로. 웹 환경이면 null |
| `readLocalEnvelope()` | 143 | 로컬 envelope 읽기. 없거나 실패 시 null |
| `writeLocalEnvelope(envelope)` | 160 | 로컬 envelope 쓰기 |
| `applyCropData(data)` | 175 | `window.CROP_DATA`/`CROP_CATEGORIES` 교체 |
| `loadCropDataOnStartup()` | 186 | 기동 시 우선순위 로딩(fire-and-forget) |
| `saveCropDataUpload(parsed, version)` | 220 | envelope 저장(로컬+Firestore) + 즉시 반영 |

### 3.2 카테고리 축약 매핑

메인/soil의 `cropData.js`는 세분류를 축약해 저장하는 관례가 있어, 파서도 동일 규칙을 적용한다.

| 원본 작물구분 | 저장 카테고리 |
|---|---|
| 곡류(벼), 곡류(기타) | 곡류 |
| 유지류 | 유지작물 |
| 인경채류 | 양념채소 |
| 경엽채류 | 엽경채류 |
| 기타, 미분류 | 기타 |
| 그 외(서류/과채류/근채류/산채류/과수/약용작물/화훼류/사료작물) | 원문 그대로 |

> ⚠️ **관례 차이**: 테스트 프로젝트(`cropData.ts`)는 세분류 원문을 그대로 category로 저장한다. 이 업로드 기능은 아직 테스트/soil에 미반영이며, 반영 시 각 프로젝트의 카테고리 관례를 지켜야 한다. 상세: 메모리 `cropdata-sync-pattern`.

### 3.3 Firestore 함수: `src/shared/firestore-db.js`

기존 sample-type+year 스코프 함수들과 독립적인 별도 함수 2개 추가.

| 함수 | 라인 | 비고 |
|---|---|---|
| `saveCropDataConfig(data, version)` | 467 | `appConfig/cropData` 문서에 `{data, version, updatedAt}` set |
| `getCropDataConfig()` | 491 | 문서 조회. 없거나 Firebase 미설정이면 null |

두 함수 모두 **`if (!window.firebaseConfig?.isEnabled()) return ...` 가드**로 시작하며(파일 내 모든 함수의 관례), 파일 끝 `window.firestoreDb = {...}` export 객체(530-531행)에 등록되어 다른 모듈에서 호출 가능하다.

### 3.4 로드 순서 배선

`cropData.js`를 ESM import하는 곳은 정확히 3개 렌더러 진입점이다. 각 파일에서 `cropData.js` 다음에 로더를 import하고 fire-and-forget으로 호출한다.

- `src/soil/soil-entry.js:35-36`
- `src/heavy-metal/heavy-metal-entry.js:35-36`
- `src/pesticide/pesticide-entry.js:35-36`

```js
import '../shared/crop-data-loader.js';
window.CropDataLoader?.loadCropDataOnStartup?.(); // fire-and-forget (await 금지)
```

> `src/index.js`는 Electron **메인 프로세스**라 `cropData.js`를 로드하지 않는다 — 여기서 배선하면 안 된다(초기 계획의 오류였고 플랜 리뷰에서 교정됨).

### 3.5 설정 화면

- **`src/settings/index.html`**: "🌾 작물 데이터 관리" 카드(상태박스·파일입력·업로드 버튼·진행표시). 기존 MRL API 카드 패턴을 따름.
- **`src/settings/settings-entry.js`**: `window.XLSX`(xlsx-js-style), `cropData.js`, `crop-data-loader.js` import 추가(24행 등). 이게 없으면 파서가 `window.XLSX.read()`에서 즉시 에러.
- **`src/settings/settings-script.js`**:
  - `updateCropDataStatusUI()` (809행): 상태박스 갱신(현재 버전/작물 수/마지막 갱신/저장 위치)
  - `cropDataUploadBtn` 클릭 핸들러 (836행): 파일 읽기 → 파싱 → 확인창 → `saveCropDataUpload` → 성공 토스트 → 상태 갱신. 파싱 실패 시 에러 토스트만, 기존 데이터 보존.

### 3.6 보안(경로)

로컬 파일 경로는 `window.electronAPI.getAppPath()`(= `app.getPath('userData')`) + 고정 파일명 `crop-data.json`으로 구성한다. 사용자 입력이 경로에 닿지 않는다. userData 경로는 기존 `write-file`/`read-file` IPC의 화이트리스트에 이미 포함되어 있어 **신규 IPC 채널·보안 로직 불필요**(`.omc/skills/electron-path-security.md` 참조).

---

## 4. 버그 수정 상세

업로드 기능 릴리스 후 "업로드가 안 된다"는 제보가 있었고, 원인이 **두 겹**으로 밝혀졌다. 첫 번째 버그가 두 번째 버그의 증상을 가리고 있었다.

### 4.1 SAMPL-1-127 — 설정 페이지 토스트 무반응

**증상**: 업로드 버튼을 눌러도 아무 반응 없음. 콘솔에 `Toast container not found`.

**근본 원인**: `showToast()`(`src/shared/toast.js:18`)는 `document.getElementById('toastContainer')`를 찾고, 없으면 `console.warn` 후 return한다. 그런데 **설정 페이지에는 `#toastContainer` div와 토스트 CSS가 둘 다 없었다**. soil 등 다른 페이지는 전역 `style.css`를 로드하고 컨테이너 div도 갖고 있지만, 설정 페이지는 자체 디자인(웜 팔레트)을 쓰느라 `style.css`를 로드하지 않고 컨테이너도 없었다. 결과적으로 설정 페이지의 **모든 showToast 호출(17개, MRL 동기화 포함)이 조용히 무시**되어 온 기존 잠재 버그였다. 업로드 기능이 토스트를 주 피드백으로 쓰면서 표면화됨.

**수정**: `src/settings/index.html`에
1. `</body>` 앞에 `<div id="toastContainer" class="toast-container"></div>` 추가
2. 인라인 `<style>`에 self-contained 토스트 CSS 추가

전역 `style.css`를 링크하지 않고 인라인으로 넣은 이유: style.css는 설정 페이지와 다른 디자인 시스템(색/폰트)이라 통째로 로드하면 설정 화면 고유 디자인과 충돌한다. 그래서 CSS 변수(`--gray-800` 등)에 의존하지 않고 **리터럴 색상**으로 self-contained CSS만 인라인했다.

**부수 효과**: 이 수정으로 설정 페이지의 다른 토스트(MRL 동기화 등)도 함께 정상 복구됨.

### 4.2 SAMPL-1-128 — 파서 헤더 컬럼명 불일치

**증상**: (토스트 수정 후 드러남) 에러 토스트 "작물 데이터 처리 실패: 필수 컬럼(작물코드/작물명/표시여부)을 찾을 수 없습니다."

**근본 원인**: `parseCropRows`가 헤더 행을 **정확일치**로 탐지했다(`REQUIRED = ['작물코드','작물명','표시여부']`). 그러나 실제 농진청 파일의 헤더 셀은 접두어가 붙어 있다:

```
행1: 작물정보(2026.07.01기준)        ← 제목 행
행2: 작물코드 | 작물구분 | 작물명 | 비료사용추천 발급여부 | 작물목록 표시여부 | 비고   ← 실제 헤더
행3: (빈 행)
행4: 00165 | 곡류(벼) | 밭벼(비화산회토) | 발급 | 표시 | ...  ← 데이터 시작
```

`'표시여부'`는 `'작물목록 표시여부'`와 정확일치하지 않아 헤더 탐지 실패 → throw.

**왜 테스트가 못 잡았나**: 기존 유닛테스트 fixture가 실제 파일이 아니라 **파서가 기대하는 가짜 헤더**(`'표시여부'`, `'발급여부'`)로 만들어져 있었다. 즉 파서를 실제가 아닌 자기 자신의 가정에 대해 검증하고 있었다.

**수정**: `src/shared/crop-data-loader.js`의 컬럼 탐지를 **정확일치 → 부분포함(`includes`) 매칭**으로 변경.

```js
const COLS = { code:['작물코드'], name:['작물명'], show:['표시여부'], group:['작물구분'] };
// 헤더 셀이 후보 키워드를 "포함"하면 매칭 → '작물목록 표시여부'.includes('표시여부') === true
```

실제 헤더셋에서 각 컬럼이 유일하게 올바른 인덱스로 해석됨을 확인(무충돌: `'작물목록 표시여부'.includes('작물명')` === false 등). 또한 `group` 컬럼 sentinel을 `undefined` → `-1`(`findIndex`)로 바꾸며 가드도 `groupCol !== -1`로 일관되게 수정.

**테스트 보강**: fixture를 실제 헤더명(`'작물목록 표시여부'` 등)으로 교체하고, 실제 파일 레이아웃(제목행+접두어헤더+빈행+데이터)을 재현한 회귀 테스트를 추가했다.

**e2e 검증**: 실제 파일(`작물정보(2026-07-01기준).xlsx`)로 `parseCropExcelFile` 실행 → **801건 파싱**, 카테고리 분포가 SAMPL-1-125 pandas 기준값과 정확히 일치(곡류40/과수170/기타318/… 합 801), 미표시(01054) 제외, 이름변경(00236='산마늘(명이나물)') 정상 확인.

> **교훈**: 외부 파일을 다루는 파서의 테스트 fixture는 파서가 기대하는 형태가 아니라 **실제 파일 구조**를 반영해야 한다. 그렇지 않으면 테스트가 통과해도 실제 파일에서 실패한다.

---

## 5. 변경 파일 목록

| 파일 | 티켓 | 변경 |
|---|---|---|
| `src/shared/crop-data-loader.js` | 126, 128 | 신규 모듈 + 파서 부분포함 매칭 수정 |
| `src/shared/firestore-db.js` | 126 | `saveCropDataConfig`/`getCropDataConfig` 추가 |
| `src/settings/index.html` | 126, 127 | 작물 카드 + toastContainer/토스트 CSS |
| `src/settings/settings-entry.js` | 126 | XLSX/cropData/loader import |
| `src/settings/settings-script.js` | 126 | 업로드 핸들러 + 상태 UI |
| `src/soil/soil-entry.js` | 126 | 로더 import + 기동 호출 |
| `src/heavy-metal/heavy-metal-entry.js` | 126 | 동상 |
| `src/pesticide/pesticide-entry.js` | 126 | 동상 |
| `tests/unit/crop-data-loader.test.js` | 126, 128 | 신규 테스트 + 실제 헤더 fixture 회귀 |
| `src/cropData.js` | — | **변경 없음**(번들 기본값 유지) |

`src/index.js`, `src/preload.js`, `src/shared/toast.js`는 변경하지 않았다.

---

## 6. 사용법 (담당자용)

1. 농촌진흥청에서 새 작물정보 `.xlsx` 파일을 내려받는다.
2. 앱 → **설정 → 작물 데이터 관리** 카드로 이동.
3. **파일 선택** → 새 엑셀 선택 → **업로드**.
4. "작물 N건을 불러왔습니다. (기존 N건 → 신규 N건) 적용하시겠습니까?" 확인창에서 **확인**.
5. 우하단 초록색 성공 토스트가 뜨고 상태박스(현재 버전/마지막 갱신/저장 위치)가 갱신된다.
6. **여러 PC**: Firebase 연결 상태라면 한 대에서 업로드하면 다른 PC는 다음 실행 시 자동 반영된다.

문제가 있으면(파일 형식 오류 등) 빨간 에러 토스트가 뜨고 기존 데이터는 그대로 유지된다.

---

## 7. 향후 유지보수 / 확장

- **엑셀 포맷 변경 대응**: 헤더명이 또 바뀌면 `crop-data-loader.js`의 `COLS` 후보 키워드에 추가한다. 단, 키워드끼리 상호 부분문자열이 되지 않도록 주의(예: '작물코드'와 '작물명칭코드'가 공존하면 오매칭 가능).
- **테스트/soil 프로젝트 반영**: 아직 미반영. 반영 시 각 프로젝트의 카테고리 관례(테스트=세분류 원문, soil=축약)를 지킬 것.
- **Firestore 보안 규칙**: 신규 `appConfig` 컬렉션의 read/write 허용 여부는 Firebase 콘솔에서 확인 필요(Open Question). 규칙이 기본 거부면 백업 write가 조용히 실패한다(로컬 저장은 정상).

### 알려진 사소한 이슈(비차단)
- 설정 화면 최초 로드 시 상태카드 "작물 수"가 잠깐 번들 기본값 개수를 보여줄 수 있음(업로드 직후엔 정상). 코스메틱.
- `heavy-metal-script.js:1437-1455`가 `CROP_DATA`를 배열이 아닌 객체로 취급하는 **기존 버그**가 있음(이 기능과 무관, 별도 확인 필요).

---

## 8. 관련 문서 / 메모리

- 메모리: `cropdata-upload-feature`(기능 요약), `cropdata-sync-pattern`(3개 프로젝트 갱신·카테고리 매핑 규칙)
- AI PM 산출물: `docs/00-discovery/SAMPL-1-126-direction.md`, `docs/01-plan/SAMPL-1-126-plan.md`, `docs/02-review/SAMPL-1-126-plan-review.md`, `docs/03-code-review/SAMPL-1-{126,127,128}-review.md`
- 스킬: `.omc/skills/electron-path-security.md`(경로 화이트리스트)
