# SAMPL-1-173 코드 리뷰 — 토양 목록 경지구분 열 감춤

## 요청

> "목록 에서 경지 구분을 감추기 해줘"

## 구현

| 파일 | 변경 |
| --- | --- |
| `src/soil/soil-style.css` | 경지구분 열 기본 `display:none` + `.allclass-on`·`.full-view` 복원 규칙, 모드별 sticky 바닥값, 주석 정정 |
| `src/soil/soil-script.js` | `_syncTableModeClasses()`·`_visibleColumnCount()`·`_syncSeparatorColSpan()`·`_logTableEl()` 추가, 구분선 colSpan 하드코딩 제거 |
| `tests/e2e/list-landclass-hidden.spec.js` | 신규 6건 |
| `tests/e2e/sticky-columns.spec.js` | '전체 보기' 토글 케이스 1건 추가 |

설계: 열을 지우지 않고 **감춘다**. 탭이 구분 하나를 가리킬 때만 감추고, '전체 경지구분' 탭(`allclass-on`)과 '전체 보기' 토글(`full-view`)에서는 되살린다. 우편번호 열(`col-zipcode`)의 선례를 따랐다.

## 1라운드 (code-reviewer, Opus)

```text
🔴 CRITICAL: 0건 / 🟠 MAJOR: 1건 / 🟡 MINOR: 2건 / 🔵 SUGGESTION: 2건
→ 판정: CHANGES_REQUESTED
```

- **MAJOR-1** '전체 경지구분' 탭에서는 "탭이 이미 구분을 보여 준다"는 전제가 깨진다. 12개 구분의 행이 섞이고 채번이 구분 단위로 독립이라(`reception-number.js`) 같은 접수번호가 여러 줄로 보이는데, 그 이유를 설명하는 열이 사라진다. → `.allclass-on` 도입으로 해결.
- MINOR-1 인쇄 복원 규칙 없음 → 우편번호와 같은 취급임을 주석에 명시.
- MINOR-2 낡은 `gongik-on` 오프셋 주석 → 정정.
- SUGGESTION-1 불필요한 `!important` → 제거(명시도 0,3,1 vs 0,2,1로 이미 이김).
- SUGGESTION-2 `toBeHidden()`이 요소 부재도 통과 / 되살아나는 고정 열의 오프셋 회귀 가드 없음 → 각각 보강.

## 독립 리뷰 (codex, 다른 계열 모델)

```text
🔴 CRITICAL: 0건 / 🟠 MAJOR: 1건(오탐) / 🔵 SUGGESTION: 1건
```

- MAJOR "docs/ 산출물이 diff에 없다" → **오탐**. 넘긴 diff를 `src/`·`tests/`로 한정한 탓이며, `docs/assets/soil-*.css|js`에 새 규칙이 실제로 들어가 있음을 확인했다.
- 확인해 준 항목: 호출 지점 완전성, 세 클래스 조합 명시도, `_visibleColumnCount()` 폴백, XSS 없음.
- SUGGESTION 조합·재렌더 경로 시험 부족 → 2라운드 지적과 함께 반영.

## 2라운드 (code-reviewer, Opus — 수정본 재리뷰)

```text
🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 2건 / 🔵 SUGGESTION: 4건
→ 판정: APPROVED (MINOR 2건 머지 전 처리 권고)
```

1라운드 지적 5건 모두 해결 확인. 새 지적 2건은 **추가 변경(`_visibleColumnCount()` 도입)이 만든 회귀**였다 — 찾은 쪽과 고친 쪽이 달라 수정본을 다시 리뷰에 넣은 것이 값을 했다.

- **MINOR-1 (실측)** '전체 보기' 토글은 다시 그리지 않으므로 구분선 `colSpan`이 옛 값(17)에 머물러 **선이 217px 짧게 끊겼다.** 예전 하드코딩(18/19)은 실제보다 *커서* 브라우저가 잘라내 무해했는데, 정확한 계산으로 바꾸며 *모자라는* 쪽 — 보이는 쪽 — 으로 틀어졌다. → `_syncSeparatorColSpan()`을 토글 핸들러에 연결.
- **MINOR-2 (실측)** 남긴 `left` 바닥값(435/429)이 경지구분 숨김 이후 자연 위치보다 커져, 첫 페인트에 성명 열이 **기본 +28px / 공익직불제 +42px** 밀렸다. sticky의 `left`는 자연 위치보다 작을 때만 무해한 바닥값이다. → 모드별 바닥값(365/359) 추가 + 주석의 뒤집힌 근거 정정.
- SUGGESTION 4건(중복 3줄, 표 조회 방식, JSDoc, 0건 경로 시험) → 전부 반영.

## 변이 검증

수정이 실제로 회귀를 막는지, 시험이 그것을 붙잡는지 각각 되돌려 확인했다.

| 변이 | 결과 |
| --- | --- |
| `display:none` 규칙 제거 | 기본 숨김 시험 **FAIL** ✅ |
| `.full-view` 복원 규칙 제거 | 전체 보기 시험 **FAIL** ✅ |
| `_syncSeparatorColSpan()` 호출 제거 | 구분선 시험 **FAIL** ✅ |
| 모드별 sticky 바닥값 제거 | 첫 페인트 밀림 시험 **FAIL** ✅ |

## 검증 결과

| 항목 | 결과 |
| --- | --- |
| `npm run build` | ✅ |
| `npm run typecheck` | ✅ 오류 0 |
| `npm run check:docs` | ✅ 누락 0건 |
| `npm run test:unit` | ✅ 534 passed |
| `npm test` (E2E) | ✅ 460 passed / 4 skipped |

## 부수 확인 — sample-log-soil과의 목록 일치

두 앱을 나란히 띄워 실측한 결과, 이번 변경으로 목록 열 구성이 완전히 일치한다:
기본 17열·공익직불제 16열·전체 22 th 구성·탭 옵션 13개·기준년도 옵션 모두 동일.
soil은 SLS-1-261에서 같은 감춤을 이미 적용해 두었고, 메인만 남아 있어 달라 보였다.

차이가 남은 곳은 `.allclass-on` 하나다 — soil에는 없다. soil의 주석은 *"탭에 '전체'가 없다"* 고 적었지만
`populateLandClass1Options()`가 `value=''` 옵션을 실제로 만들므로, **soil에도 같은 구멍이 있다**(별도 SLS 티켓 대상).

## 판정

```text
🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 0건(2건 모두 수정) / 🔵 SUGGESTION: 0건(4건 모두 반영)
→ 판정: APPROVED
```
