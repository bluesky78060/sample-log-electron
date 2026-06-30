# SAMPL-1-119 — 토양 그룹 수정 시 데이터 초기화·중복 등록 버그 수정

- **티켓**: SAMPL-1-119 (General epic) · 상태: done
- **작성일**: 2026-06-30
- **영향 범위**: 토양(soil) 시료 모듈 — 그룹/단건 수정 폼, 목록 표시
- **수정 파일**: `src/soil/soil-log-record.js`, `src/soil/soil-script.js`, `tests/unit/soil-log-record.test.js`, `tests/e2e/soil-group-edit.spec.js`

---

## 1. 증상 (사용자 보고)

> 토양에서 **그룹핑으로 묶인 시료를 "수정"**하면 입력창에서 기존에 입력했던 내용 — **필지별 구분(category)·용도(purpose)·작물명·면적** — 이 사라진다. 그래서 다시 입력해서 저장하면 **같은 접수번호로 중복 등록**된다.

핵심 단서: **단건 수정은 멀쩡한데 그룹 수정에서만** 값이 사라진다. 목록 화면에는 값이 보이는데 수정 폼을 열면 비어 있다.

---

## 2. 데이터 모델 배경

토양 레코드는 동일 정보를 **두 위치**에 가진다.

| 위치 | 필드 | 용도 |
| --- | --- | --- |
| **최상위(top-level)** | `subCategory`, `purpose`, `cropsDisplay`, `area`, `lotAddress` | 목록/요약/엑셀/라벨 표시의 **권위 필드** |
| **필지별(parcels[0])** | `category`, `purpose`, `crops[]`, `lotAddress` | 수정 폼의 필지 카드 입력값 |

신규 등록 시 `buildSoilLogRecord`(`src/soil/soil-log-record.js`)가 두 위치를 함께 채운다. 그러나 **임포트·Firestore 동기화·레거시·부분저장** 등으로 만들어진 레코드는 **최상위 요약 필드만 채워지고 `parcels[0]`이 비어 있는("stub") 상태**가 될 수 있다. 목록은 최상위 필드로 그리므로 정상으로 보인다.

여러 필지/다작물 시료는 **필지·작물마다 1건씩, 같은 `groupId`로 묶인 다수 레코드**로 저장된다(예: `503`, `503-1`, `504`). 그룹 수정은 이 묶음을 하나의 폼으로 펼쳐서 편집한다.

---

## 3. 근본 원인

수정 폼 복원과 목록 평탄화가 **`parcels[0]`의 값만 읽고 최상위 권위 필드로 폴백하지 않았다.**

### 3-1. 그룹 수정 폼 복원 — `populateFormForGroupEdit`
필지 카드를 만들 때 아래처럼 `parcels[0]`만 참조했고, `parcels[0]`이 없으면 카드를 아예 건너뛰었다.

```js
const parcel = firstLog.parcels?.[0];
if (!parcel) return;                              // ← 필지 카드 자체가 누락
// ...
category: parcel.category || '',                 // ← 최상위 subCategory 폴백 없음
purpose:  parcel.purpose  || '',                 // ← 최상위 purpose 폴백 없음
crops: mergedCrops.length > 0 ? mergedCrops : [{ name: '', area: '' }],  // ← cropsDisplay 폴백 없음
```

→ stub 레코드는 구분·용도·작물명·면적이 **빈 칸**으로 복원된다.

### 3-2. 단건 수정 폼 복원 — `populateFormForEdit`
동일하게 `parcel.category || ''`, `parcel.crops ? ... : []`만 사용해 같은 취약점이 있었다.
(단, 단일 필지 레코드는 보통 `parcels[0]`이 채워져 있어 사용자가 그룹에서만 체감.)

### 3-3. 목록 표시 — `flattenLogsForTable`
목록 행도 `parcel.crops`/`parcel.lotAddress`만 보고 최상위로 폴백하지 않아, 완전한 stub 레코드는 목록에서도 작물/면적이 `-`로 표시됐다(코드 리뷰에서 발견·동시 수정).

### 3-4. "중복 등록"의 진짜 인과
그룹 수정 **저장 경로**(`submitForm`)는 `sampleLogs.filter(l => l.groupId !== groupId)`로 기존 그룹을 제거한 뒤 **같은 `groupId`로 재생성**하므로 그 자체로는 중복을 만들지 않는다(브라우저로 확인: 저장 후 2건 유지). 실제 중복은 **폼이 비어 보여서 사용자가 새로 입력·재등록**한 2차 행위였다. → **폼 복원이 정상화되면 재입력이 불필요해져 중복이 원천 차단**된다.

---

## 4. 수정 내용

### 4-1. 순수 폴백 헬퍼 추가 — `src/soil/soil-log-record.js`
테스트 가능성을 위해 DOM 비의존 순수 함수로 분리하고 `window.SoilLogRecord`에 노출.

```js
// 필지 구분: 필지별 값 우선, 없으면 최상위 subCategory('-' 센티넬 제외)
function resolveParcelCategory(parcelCategory, log) {
    if (parcelCategory) return parcelCategory;
    const sub = log && log.subCategory;
    return (sub && sub !== '-') ? sub : '';
}

// 필지 용도: 필지별 값 우선, 없으면 최상위 purpose
function resolveParcelPurpose(parcelPurpose, log) {
    return parcelPurpose || (log && log.purpose) || '';
}

// cropsDisplay(콤마 결합 가능) + area → crops 배열 재구성
// 콤마 결합형은 작물별 면적 분배가 불가하므로 area는 첫 작물에만 부여한다.
function cropsFromDisplay(log) {
    const disp = ((log && log.cropsDisplay) || '').trim();
    if (!disp || disp === '-') return [];
    const names = disp.split(',').map(s => s.trim()).filter(Boolean);
    return names.map((name, i) => ({ name, area: i === 0 ? ((log && log.area) || '') : '' }));
}
```

### 4-2. 폼 복원·목록에 폴백 적용 — `src/soil/soil-script.js`

**그룹 수정** (`populateFormForGroupEdit`):
- `if (!parcel) return;` → `const parcel = firstLog.parcels?.[0] || {};` (카드 누락 방지, 최상위로 합성)
- 각 멤버 로그의 `crops`가 비면 `cropsFromDisplay(log)`로 보강하여 `mergedCrops` 집계
- `category`/`purpose`/`lotAddress`를 `resolveParcel*` 및 최상위 `lotAddress`로 폴백
- 폴백 소스는 그룹 대표가 아닌 **해당 필지 레코드(`firstLog = logsForParcel[0]`)** — 필지별 구분이 다른 다필지 그룹에서도 정확

**단건 수정** (`populateFormForEdit`):
- `crops` 폴백은 **단일 필지 로그(`log.parcels.length === 1`)에서만** 적용
  (`cropsDisplay`는 로그 전체 요약이라 다필지 단일 로그에 일괄 적용하면 오분배되므로 게이팅)
- `category`/`purpose`는 `resolveParcel*`로 폴백

**목록 평탄화** (`flattenLogsForTable`):
- 단일 필지 로그 한정으로 `crops` 비면 `cropsFromDisplay(log)`, `lotAddress` 비면 `log.lotAddress` 폴백
- `_parcelPurpose`도 `resolveParcelPurpose(parcel.purpose, log)`로 일원화(렌더-측 임시 폴백 의존 제거 — 코드 리뷰 SUGGESTION 반영)

### 4-3. 회귀 안전성(중요)
- **`buildSoilLogRecord`(저장 경로)는 불변** → 정상 데이터의 저장 동작 동일
- 폴백은 모두 **truthy 단락**(`parcel.x || ...`)이라 **`parcels[0]`이 채워진 정상 데이터에는 발동하지 않음**
- 부수 효과: stub 그룹을 한 번 **수정·저장하면 `parcels[0]`이 폼 복원값으로 채워져 자기치유(self-heal)**됨

---

## 5. 검증

### 5-1. 브라우저 실증(Playwright MCP) — 3가지 데이터 상태
| 상태 | 수정 전 | 수정 후 |
| --- | --- | --- |
| `parcels[0]` 완비(정상) | 정상 | 정상(회귀 없음) |
| 상위 필드만 + `parcels[0].category/purpose` 빈값 | 구분·용도 빈 칸 | 정상 복원 |
| 완전 stub(`parcels[0].crops=[]`) | 구분·용도·작물명·면적 빈 칸 | 정상 복원 |

저장 후: **2건 유지(중복 0), 접수번호 보존, `parcels[0]` 자기치유** 확인.

### 5-2. 단위 테스트 — `tests/unit/soil-log-record.test.js`
헬퍼 3종 경계 케이스 14건 추가(센티넬 `'-'`, 콤마 결합, `null`, `area` 누락 등). **전체 223건 통과.**

### 5-3. E2E 테스트 — `tests/e2e/soil-group-edit.spec.js` (신규)
실제 UI 구동: stub 그룹 주입 → 목록 표시 확인 → **수정 버튼 클릭** → 필지 카드 값 복원 단언 → 저장 후 중복 0·자기치유 단언. **전체 E2E 204건 통과(회귀 없음).**
> 참고: 최초 실행 시 Playwright chromium 바이너리 미설치로 실패 → `npx playwright install chromium` 후 정상.

### 5-4. 리뷰
- **critic(Opus) 플랜 리뷰**: REVISE → 지적(목록 표시 폴백·순수헬퍼 추출·`'-'` 가드·폴백 소스 명확화) 전부 반영 후 ACCEPT
- **code-reviewer(Opus) 코드 리뷰**: **APPROVED** (CRITICAL 0 / MAJOR 0 / MINOR 1 / SUGGESTION 3)
- 빌드: `npm run build` 통과

---

## 6. 잔여 백로그(비차단)

1. **`buildSoilLogRecord` 비대칭**: top-level은 `subCategory: parcel.category || common.subCategory`로 폴백하나 `parcels[0].category: parcel.category || ''`는 폴백 안 함. 폼레벨 구분만 입력 시 신규 stub을 만들 수 있음(읽기측 폴백+자기치유로 영향 해소). 소스 차단을 원하면 대칭화 검토.
2. **미편집 레코드 일괄 리페어**: 읽기측 폴백으로 표시·편집은 정상화되나, 디스크의 stub 레코드는 편집 전까지 그대로. 필요 시 1회성 정규화 스캔 검토.
3. **면적 단위 best-effort**: `cropsFromDisplay`는 `log.area`를 단위 없이 부여 → 평(坪) 레거시는 ㎡로 표기될 수 있음(이미 유실된 레코드 한정).

---

## 7. 배포

- 소스는 `src/`. 배포본 `docs/`는 `npm run build`(Vite, **emptyOutDir**)로만 갱신(직접 수정 금지).
- 본 수정은 build 완료 상태. 배포하려면 `docs/` 빌드 산출물과 `src/` 변경을 함께 커밋·푸시.
- 메인↔테스트 프로젝트 동기화는 별도 판단(테스트 프로젝트는 TS 포팅 규칙).
