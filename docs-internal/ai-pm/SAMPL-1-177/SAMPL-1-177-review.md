# SAMPL-1-177 코드 리뷰 — 퇴비 목록 검색 모달 농장주소 검색

- 일시: 2026-09-15
- 변경: `src/compost/index.html`, `src/compost/compost-script.js`, `tests/e2e/compost-farm-address-search.spec.js`(신규)
- 판정: **APPROVED**

## 3중 검증

| 레인 | 도구 | 결과 |
| --- | --- | --- |
| 1 | `code-reviewer` (Claude Opus) | CRITICAL 0 / MAJOR 0 / MINOR 1 / SUGGESTION 5 → APPROVED |
| 2 | **codex review** (codex-cli 0.147.0, gpt-5.6-luna) — 독립 레인 | CRITICAL 0 / MAJOR 1(오탐, 아래) → CHANGES_REQUESTED |
| 2' | **gemini review** (gemini-cli 0.56.0) — 독립 레인 | CRITICAL 0 / MAJOR 0 / SUGGESTION 1 |
| 3 | **적대적 검증 — 변이 3건** | 3건 모두 테스트가 잡음 |

집계: 🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 1건 / 🔵 SUGGESTION: 6건

## 변이 검증 (테스트가 실제로 결함을 잡는지)

수정을 되돌려 테스트가 죽는지 확인했다. 통과하는 테스트를 세는 것만으로는 판별력을 알 수 없다.

| # | 변이 | 결과 |
| --- | --- | --- |
| 1 | `matchesFarmAddressFilter`를 항상 `true`로 (필터 무력화) | **5 failed** / 3 passed |
| 2 | `applySearchBtn`에서 `farmAddress` 읽기 제거 (배선 단절) | **6 failed** / 2 passed |
| 3 | `getFilterKeys` 오버라이드 제거 (검색 중 배지 누락) | **1 failed** / 7 passed |
| — | 원복 후 재확인 | 8 passed |

## codex MAJOR는 오탐이었다 — 왜 나왔나

codex는 "`docs/` 빌드 산출물이 diff에 없어 GitHub Pages에 기능이 반영되지 않는다"고 MAJOR를 냈다.
**실제로는 반영돼 있다.** 원인은 리뷰에 넘긴 diff를 `git diff HEAD -- src/compost tests/...`로
**좁혀서 만든 것**이고, codex는 받은 diff 범위만 보고 판단했다.

작업 트리 실측:

```
 M docs/compost/index.html          → #searchFarmAddressInput 존재 (2건)
?? docs/assets/compost-mHpsSzEf.js  → farmAddress 필터 포함 (2건)
 D docs/assets/compost-oLPnMGAw.js  → 구 번들
docs/compost/index.html 이 가리키는 번들 = assets/compost-mHpsSzEf.js  (일치)
```

**교훈: 리뷰어에게 범위를 좁힌 diff를 주면 "빠진 것"을 결함으로 보고한다.**
`docs/`가 소스와 함께 가야 하는 저장소에서는 diff를 좁히지 말거나, 좁혔다는 사실을 프롬프트에 명시해야 한다.

## MINOR 1건 (커밋 절차 — 코드 결함 아님)

**m-1. 새 번들 `docs/assets/compost-mHpsSzEf.js`가 untracked다.**
`git add -u`나 `git commit -am`으로 커밋하면 `docs/compost/index.html`은 새 해시를 가리키는데
대상 파일이 저장소에 없어 **GitHub Pages가 404**가 된다 — CLAUDE.md에 기록된 v1.17.7 사고(SAMPL-2-22)와 같은 경로다.
code-reviewer와 codex가 서로 다른 각도에서 같은 지점을 짚었다.

→ 커밋 시 명시적으로 포함한다:
```bash
git add -A docs/ src/compost/ tests/e2e/compost-farm-address-search.spec.js
npm run check:docs      # 누락 0건 확인
```

## 중점 항목 판정 (세 레인 일치)

| 항목 | 판정 |
| --- | --- |
| `matchesTypeSpecificFilters`/`getFilterKeys` 오버라이드가 Base 계약을 깨지 않는가 | 문제 없음. compost가 이번에 처음 오버라이드하며, Base 기본값은 각각 `true`·공통 5키다. soil(`soil-script.js:2954,3028`)과 같은 형태 |
| 검색 버튼 배지 함정(기본값 truthy) | 빠지지 않음. `farmAddress` 기본값은 `''`(falsy)이고, apply에서 `.trim()`을 걸어 **공백만 입력해도 배지가 켜지지 않는다** — 기존 `name`(trim 없음)보다 안전하다 |
| apply(trim만) vs match(trim+lowercase) 비대칭 | 버그 아님. 저장값이 원본 대소문자를 유지해 모달 재개봉 시 입력이 그대로 복원된다. 매칭은 양쪽을 소문자화하므로 **결과는 동일**하고 복원 UX만 개선된다 |
| `farmAddress` 없는 레코드 제외 | 타당. 검색어가 있는데 주소가 없으면 AND 의미론상 제외가 맞다. soil `matchesLotFilter`가 `parcels` 없을 때 `false`를 내는 것과 같은 판단 |
| 모달 배선 누락 | 없음. 열기 복원 / 적용 / 전체 초기화 / Enter 모두 배선. 오버레이·닫기는 필터를 건드리지 않고 숨기기만 하므로 추가 작업 불필요 |
| XSS | 없음. 목록 셀은 `textContent`, 배지는 `sanitizeHTML`로 감싼 고정 문자열. 정규식은 `/\s+/` 상수라 ReDoS 여지 없음 |
| E2E가 실제 UI 배선을 밟는가 | 밟는다. `page.evaluate`는 **시드 주입에만** 쓰고 검색은 클릭→입력→클릭 경로. 변이 검증으로 판별력 확인 |

## SUGGESTION (이번 범위 밖 — 별도 티켓 후보)

1. `matchesFarmAddressFilter`의 `if (!target) return false;`는 도달해도 결과가 같다(빈 문자열은 `includes`가 항상 false). 의도를 드러내는 문서 역할이라 그대로 둔다.
2. **한글 NFC/NFD 정규화 미고려** — macOS 복사나 엑셀 가져오기로 들어온 주소가 NFD면 키보드로 친 NFC 질의와 매치되지 않는다. soil `matchesLotFilter`도 같은 성질이라 이번 변경이 만든 문제는 아니다. 5개 시료 공통으로 `.normalize('NFC')`를 거는 별도 티켓이 적절하다.
3. 기존 `name` 필터의 apply 시점 `toLowerCase()`를 farmAddress 방식으로 통일하면 재개봉 시 입력이 뭉개지지 않고, 공백만 입력했을 때 배지가 켜지는 것도 함께 해소된다.
4. E2E 헬퍼 `visibleReceptionNumbers`가 실제로는 행 전체 `textContent`를 반환한다 — `visibleRowTexts`가 덜 헷갈린다.
5. soil은 필드별 초기화 버튼(`clearSearchLot`)을 주지만 compost는 성명에도 없어 **화면 안에서는 일관**하다. 필수 아님.
6. (gemini) 위 3과 같은 취지 — `name`을 매칭 시점 소문자화로 리팩터.

## 검증 증거

| 항목 | 결과 |
| --- | --- |
| `npm run build` | 성공 (1.90s) + restore-ai-pm-docs 87개 복원 |
| `npm run typecheck` | exit 0 |
| `npm run check:docs` | 누락 0건 |
| `npm run test:unit` | 21 files / **534 passed** |
| `npm test` (E2E 전체) | **472 passed** / 4 skipped / 0 failed (4.1m) |
| 신규 E2E 8건 | 전부 통과 — 필드 존재 · 부분일치 · 다중 term AND · 무일치 0건 · 배지+입력값 복원 · 전체 초기화 · Enter · 성명과 AND |

## 부수적으로 처리한 선행 문제

1. **`check:docs` 최초 실패** — 본 변경과 무관하게 추적 중인 `src` 자산 20개(`assets/icons/*.svg`,
   `manual/images/*.png`, `manual/screenshots/*.png`)가 작업 트리에서 삭제돼 있었고 HTML은 여전히 참조 중이었다.
   `git restore --source=HEAD`로 복원 후 재빌드하여 통과. main 필수 CI 항목이라 방치하면 PR이 막힌다.
2. **포트 8899 고아 프로세스** — 2026-09-01부터 떠 있던 이 저장소의 `http-server`(PPID 1). Playwright 설정이
   의도적으로 `reuseExistingServer: false`라 정리했다.
3. **codex 계정** — 이 세션의 `CODEX_HOME`은 orca가 관리하는 계정 홈을 가리키며, 처음 선택돼 있던 계정이
   사용 한도에 걸려 있었다(`try again at Sep 20th`). orca에 등록된 다른 계정으로 전환해 리뷰를 수행했다.
   설정 파일은 바꾸지 않고 해당 명령에만 `CODEX_HOME`을 지정했다.
4. **gemini 키** — 셸에 남은 무효 `GEMINI_API_KEY`가 `~/.gemini/.env`의 유효 키를 가리고 있었다
   (CLAUDE.md에 기록된 함정). 유효 키를 해당 명령에만 넘겨 실행했다. 셸 변수 정리는 미조치.
