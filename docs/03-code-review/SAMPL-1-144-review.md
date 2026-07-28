# SAMPL-1-144 코드 리뷰

**리뷰어**: `oh-my-claudecode:code-reviewer` (Opus, 독립 컨텍스트 · READ-ONLY)
**대상**: `src/water/water-script.js`, `tests/e2e/water-group-edit.spec.js` + 빌드 산출물
**일시**: 2026-07-28

## 1차 판정

```text
🔴 CRITICAL: 0건 / 🟠 MAJOR: 1건 / 🟡 MINOR: 3건 / 🔵 SUGGESTION: 5건
→ 판정: CHANGES_REQUESTED
```

## 검증 통과 항목

**참조 전수 확인** — `src/water/water-script.js` 내 8곳 전부 안전:

| 위치 | 성격 | 상태 |
|---|---|---|
| 필드 `null` 초기화 | 안전 | — |
| `getElementById` 대입 (null 허용) | 안전 | — |
| `editSample()` 내부 | **기존** 가드 | — |
| `onAfterFormReset()` | 본 변경으로 가드 | ✅ |
| 라디오 `change` 핸들러 | 본 변경으로 가드 | ✅ |

`src/` 전체에서 다른 파일의 참조 0건. 빌드 번들 역검증도 가드 누락 0.

**뮤테이션 테스트** — 리뷰어가 `docs/`를 스크래치패드에 복사해 가드를 지점별로 하나씩 되돌린
번들을 별도 포트에 서빙하고 재실행(저장소는 무수정). 테스트가 순환 논증이 아님을 실증:

| 시나리오 | SAMPL-1-81 | SAMPL-1-144 |
|---|---|---|
| 현재 코드 (가드 있음) | ✅ pass | ✅ pass |
| A: `onAfterFormReset` 가드만 제거 | ❌ **fail** (`#listView` hidden) | ❌ **fail** |
| B: `change` 핸들러 가드만 제거 | ✅ pass | ❌ **fail** (pageErrors 4건) |

→ 두 수정 지점이 **각각 독립적으로 mutation-killed**. 특히 시나리오 A에서 SAMPL-1-81이
`#listView`가 `hidden`으로 실패한 것이 결정적 — 사용자가 겪은 "수정이 안 된다" 증상 그 자체다.

**기타 통과 항목**

- 셀렉터 타당성: `<label class="test-item-option">` 구조 실재, `water-style.css:312`의
  `display:none` 때문에 `check()`가 actionability 검사에서 실패 → **라벨 클릭 선택이 옳다**
- 조용한 오동작 없음: 뮤테이션 B에서 예외 4건 중에도 `toBeChecked()` 통과 → 라디오 checked는
  브라우저 네이티브 동작이며 핸들러와 무관. 가드로 잃는 것은 이미 없는 컨테이너의 클래스 토글뿐
  → **사용자 체감 기능 손실 0**
- 회귀 없음: `src/shared/` 공유 모듈 무변경, **전체 e2e 205/205 통과**
- 컨벤션: `editSample()` 기존 관용구와 정확히 일치

## 지적사항 및 조치

### 🟠 MAJOR-1 — 재빌드 번들이 untracked: 커밋 누락 시 배포본에 버그가 그대로 남음

`docs/`는 GitHub Pages 배포 본체인데 신규 번들이 untracked이고 `git check-ignore` 대상도 아니라
명시적 `git add` 없이는 조용히 빠진다. 게다가 `.github/workflows/build.yml`이 Playwright를
실행하지 않아 이를 잡을 CI 게이트가 없다 → **완전히 조용한 실패**.

**조치: 해결.** 소스·테스트와 함께 빌드 산출물 전체를 스테이징.
> 커밋 자체는 사용자 권한이므로 리뷰 시점에는 수행하지 않았고, 이후 v1.17.6 릴리스 커밋에 포함됨.

### 🟡 MINOR-1 — 주석 사실관계 오류

`469-473행`을 "이벤트 핸들러"로 지칭했으나 실제로는 `editSample()` 내부의 폼 데이터 채우기 로직.

**조치: 해결.** (MINOR-2와 함께 처리)

### 🟡 MINOR-2 — 주석의 하드코딩된 행 번호는 코드 삽입 시 즉시 무효화

이번 변경 자체가 그 취약성을 증명 — 플랜의 "511-512행"이 주석 2줄 삽입 후 513-514행으로 밀렸다.

**조치: 해결.** 두 주석 모두 행 번호를 심볼명으로 교체.

```javascript
// 두 컨테이너는 ac54454(수질: 검사항목 상세정보 삭제)에서 마크업이 제거되어 항상 null —
// editSample()의 동일 가드와 같은 이유 (SAMPL-1-144)
```

### 🟡 MINOR-3 — 리스너 미부착 상태에서 false-pass 가능

`toBeChecked()`는 브라우저 네이티브 동작이라 change 핸들러 부착 여부와 무관(뮤테이션 B가 증명).
느린 CI(`retries:2`/`workers:1`)에서 모듈 초기화 전 클릭 시 `pageErrors`가 비어 조용히 통과한다.

**조치: 해결.** 라벨 클릭 전 `await page.waitForFunction(() => !!window.waterManager)` 추가.

### 🔵 SUGGESTION 5건 — 후속 티켓으로 이관

| # | 내용 |
|---|---|
| S-1 | 토글 블록 3중 중복 → `syncTestItemContainers(value)` 헬퍼 추출 (DRY) |
| S-2 | 죽은 코드·CSS 정리 티켓을 **실제로 발행할 것** (미발행 시 결정이 부채로 전락) |
| S-3 | `waitForLoadState('networkidle')`은 Playwright 비권장 API |
| S-4 | `navResetBtn` + `confirm()` 실제 버튼 경로 미커버. 단 SAMPL-1-81이 진짜 사용자 경로에서 동일 함수를 밟고 mutation-killed되어 합산 커버리지 충분 |
| S-5 | (기존 결함) `getElementById('tableBody')`는 매칭 id 없음(실제 `logTableBody`). `querySelector('tbody')` 폴백 덕에 동작하나 마크업 순서가 바뀌면 엉뚱한 테이블에 바인딩 |

## 2차 판정 (재리뷰)

```text
🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 0건 / 🔵 SUGGESTION: 5건 (후속 이관)
→ 판정: APPROVED
```

리뷰어는 작업트리가 아닌 **스테이징된 블롭**을 `git show :경로`로 직접 검사해 4건 전부를 독립 검증했다.

| 항목 | 결과 |
|---|---|
| MAJOR-1 | ✅ 무가드 0 (두 요소 각각 총 5 / 가드 5). 스테이징된 `docs/water/index.html`이 신규 번들 참조. 4개 경로 **unstaged drift 0** |
| MINOR-1 | ✅ 오기 제거, `editSample()의 동일 가드와 같은 이유`로 교체 |
| MINOR-2 | ✅ 두 주석 모두 행 번호 → 심볼명 |
| MINOR-3 | ✅ `waitForFunction`이 `containersExist` 단언 뒤, 라벨 클릭 앞에 정확히 배치 |

**재검증 증거**

- 소스 무가드 0: `= null` / `getElementById` / `if (this.` 제외 참조 grep → 출력 없음
- **뮤테이션 재실행**: `waitForFunction` 추가가 탐지력을 약화시켰는지 확인하기 위해 change 핸들러
  가드만 되돌린 번들(5→3)로 재실행 → 신규 테스트가 **pageErrors 4건으로 여전히 fail**. 탐지력 유지
- 회귀: `water-group-edit.spec.js` 2/2 통과, 저장소 무수정·green 복원 완료

**리뷰어 최우선 권고**: 후속 티켓 중 **CI(`build.yml`)에 Playwright e2e 단계 추가**가 1순위.
현재 e2e 게이트가 없는 것이 MAJOR-1이 "조용한 실패"가 될 수 있었던 근본 원인이며,
이번엔 사람이 잡았지만 다음에도 잡힌다는 보장이 없다.

## 릴리스

v1.17.6으로 릴리스. 릴리스 시점 검증: 단위 241/241, e2e 205/205 통과.
