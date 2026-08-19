# SAMPL-2-32 코드 리뷰 — 속성 위치 XSS (escapeAttr 도입)

- 대상: 브랜치 `fix/escape-attr-xss` (`src/`·`tests/`·`types/`·`CLAUDE.md`)

## 검증 레인

| 레인 | 수행 | 결과 |
| --- | --- | --- |
| `code-reviewer` (Claude Opus) | ✅ | **CHANGES_REQUESTED** — 🟠2/🟡5/🔵4 → **전부 반영** |
| 적대적 검증 (`critic`, "이 변경을 반증하라") | ✅ | **ACCEPT-WITH-RESERVATIONS** — 🟠2/🟡7 → **🟠 둘 다 이 티켓에서 닫음** |
| **독립 모델 교차 리뷰 (codex)** | ✅ **실행함** | 🟠1/🟡4 → 반영 |
| 플랜 리뷰 | ❌ **생략** | 사용자 지시(코드 수정) |

> gemini는 `GOOGLE_CLOUD_PROJECT` 미설정으로 여전히 불가.

## 🚨 먼저 — 내 최초 위험도 판단이 틀렸다

티켓을 발행할 때 **`soil-script.js:1147`(필지 비고)이 뚫린다고 적었는데 사실이 아니다.**

그 경로는 `card.innerHTML = sanitizeHTML(...)`을 거치고, `sanitizeHTML`은 DOMPurify +
`ALLOWED_ATTR` 화이트리스트 + `FORBID_ATTR`로 `on*`을 걷어낸다. 내가 jsdom에서
`escapeHTML` + 생 `innerHTML`만 시험하고 **하류 살균기를 건너뛴** 것이 원인이다.
적대적 검증이 DOMPurify가 소일·농약·라벨 페이지에 실제로 로드됨을 독립 확인했다.

**실제로 노출된 곳은 `src/shared/excel-import-manager.js:247,256`** 였다 —
`row.innerHTML = \`...\``로 **DOMPurify를 거치지 않고** 엑셀 헤더·셀값을 `title="..."`에 넣는다.
값의 출처가 외부 `.xlsx`다. 변이로 확증했다(되돌리면 `<span>`에 `onfocus`·`x` 주입).

적대적 검증은 여기서 더 나아가 **실제 악성 `.xlsx`를 만들어 진짜 가져오기 마법사를
끝까지 몰아** 주입 0건·값 완전 보존을 확인했다. 내 `Object.create` 테스트가
실제 경로를 대표한다는 것도 그 과정에서 반증 시도 끝에 확인됐다.

## 무엇을 바꿨나

`escapeHTML`은 `div.textContent → innerHTML` 방식이라 브라우저가 `&`·`<`·`>`만 변환하고
**따옴표를 통과시킨다**(실측: `escapeHTML('a"b<c')` → `a"b&lt;c`).

| 파일 | 내용 |
| --- | --- |
| `src/shared/sanitize.js` | **속성 전용 `escapeAttr()` 추가** + `window.escapeAttr`. `escapeHTML`에 "요소 내용 전용"임과 왜 그것을 고치지 않았는지 명시 |
| `src/soil/soil-script.js` | 지번주소·작물명·면적·비고·모달 작물명/면적·`data-unit`×2·**하위필지 option** |
| `src/shared/excel-import-manager.js` | 엑셀 헤더 title·셀값 title·option value |
| `src/pesticide/pesticide-script.js` | `data-address` |
| `src/label-print/label-app.js` | 컬럼 option value·**컬럼 텍스트**·**미리보기 표 헤더/셀**·**인쇄 라벨 본문** |
| `src/soil/soil-result-importer.js` | `escapeHTML` 위임 제거(따옴표 미변환 구현에 위임하지 않는다) |
| `src/heuktoram/heuktoram-result-importer.js` | 중복 `escapeAttr` → 공용 위임 |
| `types/globals.d.ts` · `CLAUDE.md` | 선언 추가 · 어긋난 지침 정정 |

### `escapeHTML`을 고치지 않은 이유 (A안 폐기)

호출부 63곳 중 **27곳이 결과를 `textContent`·`dataset`에 그대로 넣는다.**
브라우저 실측:

```
raw        : 김&철수 "특수" <태그>
현재 표시   : 김&amp;철수 "특수" &lt;태그&gt;   ← 이미 깨져 있다
```

따옴표까지 변환하면 이 **기존 버그가 따옴표가 흔한 비고·주소 칸으로 번진다.**
→ B안(속성 전용 함수)을 택하고, 이중 이스케이프는 **SAMPL-2-33**으로 분리했다.

## 리뷰가 찾은 것 — 내 grep 패턴 자체가 틀렸다

### 🟠 `attr="${...escape...}"` 패턴은 **escape가 없는 자리를 못 찾는다**

code-reviewer가 자기 1차 판정도 함께 정정하며 지적했다. 알려진 **결함의 모양**으로
찾았기 때문에, **위험의 모양**(무이스케이프)은 보이지 않았다. 그렇게 두 곳을 놓쳤다.

| 놓친 곳 | 값 출처 | 실측 결과 |
| --- | --- | --- |
| `label-app.js:349` 텍스트 위치 | 엑셀 컬럼명 | `<b>굵게` → **`굵게`만 남고** `<b>` 요소 생성. `<img src=…>`는 외부 요청까지 낸다 |
| `soil-script.js:1668` option 속성·텍스트 | 하위필지 주소(문자열 데이터) | `문단리 224" onfocus=…` → **`문단리 224`에서 잘림**. 공격 없이도 데이터가 깨진다 |

### 🟠 적대적 검증이 범위를 넓혀 찾은 두 건 — 이 티켓에서 닫았다

| 위치 | 내용 |
| --- | --- |
| `label-app.js:300,311` | 미리보기 표가 엑셀 헤더·셀값을 **무이스케이프**로 넣었다. 실측 `<img>` 2개 주입, 헤더 텍스트 소멸 |
| `label-app.js:519,527,528` | **실제 인쇄되는 라벨 본문**(성명·주소·우편번호, 전부 엑셀 출처)이 무이스케이프. 담당자는 인쇄한 뒤에야 안다 |

`isLong` 줄바꿈 계산은 **원본 길이**로 이미 끝난 뒤라 그대로 뒀다 — 이스케이프 후
길이로 재면 `&amp;`가 5자로 세어져 임계값이 틀어진다(리뷰 지적).

### 🟡 그 밖에 반영한 것

| 항목 | 조치 |
| --- | --- |
| 죽은 변수 `safeLotAddress`·`safeCropName`(`:1037-1038`) | 제거 |
| `escapeAttr` 사본이 heuktoram에 중복 | 공용 위임으로 통합 |
| `soil-result-importer`가 따옴표 미변환 구현에 위임 | 위임 제거 |
| `String(sampleValue \|\| '')`가 숫자 `0`을 빈칸으로 | `?? ''` |
| "속성 **전용**"이라는 표현이 과도 | `escapeAttr`는 `escapeHTML`의 **상위집합**이고 텍스트에도 안전함을 명시(되돌리기 방지) |
| 인용부호 없는 속성은 막을 수 없다 | JSDoc에 전제 명시 (`escapeAttr('x onfocus=1')`은 무인용 속성에서 주입된다 — 실측) |
| 테스트 문구 "이중 인코딩을 막는다"가 동작과 반대 | `&`를 먼저 변환하는 것이 **왕복 복원을 위해 맞다**로 정정 + 왕복 단언 추가 |
| 대조군 테스트가 SAMPL-2-33으로 깨질 것 | 실패 시 삭제하라는 지시를 단언 메시지에 박음 |
| 버전 지문 실패를 "다른 프로젝트"로만 안내 | "빌드 누락일 수도 있다"를 병기 |
| `CLAUDE.md`가 `types/globals.d.ts`와 어긋남 | `declare var` 예외 규칙을 명시 |

## 변이 검증

| 변이 | 결과 |
| --- | --- |
| 엑셀 매핑 title을 `escapeHTML`로 되돌림 | `<span>`에 `onfocus`·`x` 주입 → **실패** |
| 라벨 컬럼 텍스트 escape 제거 | `IMG`·`B` 태그 생존 → **실패** |
| 하위필지 option 속성 escape 제거 | 값이 따옴표에서 잘림 → **실패** |
| 미리보기 표 헤더 escape 제거 | **실패** |
| 인쇄 라벨 성명 escape 제거 | **실패** |

> ⚠️ **첫 시도의 라벨 테스트는 변이를 통과했다.** 템플릿 모양을 테스트 안에서 재현해
> 소스를 전혀 거치지 않았기 때문이다. `localStorage.labelPrintData` 진입점으로
> **실제 렌더를 태우도록** 고친 뒤에야 잡혔다. 통과하는 테스트가 무엇을 증명하는지는
> 변이로만 알 수 있다.

## 최종 검증

| 항목 | 결과 |
| --- | --- |
| 단위 | **349 pass** (`sanitize.test.js`에 8건 추가) |
| E2E | **249 pass / 4 skip / 0 fail** (253건, 신규 `attr-injection.spec.js` 8건) |
| `typecheck` · `check:docs` | 오류 **0건** |
| `lint` | **미구성** — 이 저장소의 lint 스크립트는 `echo "No linting configured"` |

적대적 검증이 별도로 확인한 것: 이중 인코딩 없음(`&amp;amp;lt;` 왕복 보존),
`0`·빈 문자열·`null`·Date 정상, DOMPurify 화이트리스트에 `javascript:` href·`formaction`·
`style`·`<svg onload>`·`<iframe srcdoc>` 전부 차단, 필지 7개 케이스 회귀 0.

**부수 효과로 실제 버그를 고쳤다** — 종전 경로에서 비고 `1동 "특수"`는 `1동 `으로
**잘려 저장되고 있었다**(적대적 검증 실측). `value="${firstCrop.area}"`가 찍던
`undefined`도 사라졌다.

## 후속 티켓 (코드 주석에 번호를 박았다)

| 티켓 | 내용 | 우선순위 |
| --- | --- | --- |
| `SAMPL-2-33` | 이스케이프한 값을 `textContent`에 넣어 엔티티가 화면에 보임 (27곳) | 3 |
| `SAMPL-1-159` | 하위필지 option `value`가 객체라 `[object Object]` 표시 + 선택 복원 실패 | 2 |
| `SAMPL-2-34` | `sanitizeHTML`이 DOMPurify 없이 조용히 폴백 — 13페이지 중 6곳 미로드 | 3 |

## 남은 한계 (정직하게)

- **Electron 실행 미검증.** 다만 `src/index.js:360,622,714`가 `docs/`를 로드하므로
  **검증할 산출물이 둘이 아니라 하나**임을 적대적 검증이 코드로 확인했다
- **작물 면적 모달을 UI 클릭으로 열지 않았다** — `renderCropAreaModal()`을 직접 호출해
  실 템플릿·실 DOM으로 검증했다. 버튼 클릭 → 선택 → 저장 전 경로는 미확인
- `heuktoram`·`*-analysis` 4페이지의 자체 importer에는 페이로드를 흘리지 않았다
- **형제 프로젝트**(`sample-log-electron-test`, `sample-log-soil`)에 같은 결함이 있을 가능성이
  높다 — `escapeHTML`이 같은 구현이면 동일하다. 미확인
- `escapeHtml`(로컬, 따옴표 변환) vs `escapeHTML`(전역, 미변환)이 **대소문자만 다르고
  의미가 반대**다. 개명이 필요하다는 지적을 받았으나 이번 범위에서는 하지 않았다
