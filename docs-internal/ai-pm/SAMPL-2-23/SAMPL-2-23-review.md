# SAMPL-2-23 코드 리뷰

- 리뷰어: code-reviewer 에이전트 (Opus, 독립 레인)
- 1차 판정: **CHANGES_REQUESTED** (MAJOR 1 / MINOR 5 / SUGGESTION 6) → MAJOR + MINOR 4건 반영 후 재검증

## 🟠 MAJOR — ②가 고아 문제를 `docs/`에서 `src/`로 옮긴 것에 그침 (해소)

리뷰어 지적: `src/manual/index.html`이 참조하는 이미지는 **01·02·04·09 + 흙토람 2건뿐**이고
나머지 5건(03·05·06·07·08, ~1MB)은 이전 후에도 고아다. 변경 자신이 근거로 든 문구
("결과물이 어떤 HTML도 참조하지 않는 고아가 되고")가 새 위치에서도 그대로 성립한다.

**이게 단순 용량 문제가 아닌 이유**: `.githooks/pre-push` 태그 게이트가 `src/` 오염을 차단하므로,
태그 전에 `npm test`를 한 번 돌리면 **2.7MB PNG를 커밋해야 태그를 푸시할 수 있다.**
그중 1MB는 어디에도 표시되지 않고 git 히스토리에 영구 잔존한다.

오케스트레이터 검증:
```
설명서 참조: 01-main, 02-soil-register, 04-soil-list, 09-label-print, heuktoram-* 2건
미참조:      03-soil-parcel, 05-pesticide-register, 06-water-register,
             07-compost-register, 08-heavy-metal-register
02 vs 03 SHA-256: 0dadfc9f72df6241... 동일 → 주석이 말하는 "필지 추가" 조작이 없다
```

**처리 — 리뷰어의 두 옵션을 모두 적용:**
1. 미참조 캡처 5건을 스펙에서 제거 + 파일 `git rm` (2.7MB → 1.7MB)
2. 남은 4건도 `test.skip(!process.env.UPDATE_SCREENSHOTS)` 뒤로 분리 →
   평시 `npm test`가 소스 트리를 더럽히지 않는다. `npm run test:screenshots` 스크립트 추가.

**실증 검증** (커밋 후 깨끗한 상태에서):
| 시점 | `git status --porcelain -- src/ package.json package-lock.json scripts/` |
|---|---|
| E2E 전 | 0건 |
| E2E 210 pass + 4 skipped 후 | **0건** |
| 태그 게이트 시뮬레이션 | `[OK] Pre-tag check passed` |

## 🟡 MINOR 처리

| # | 지적 | 처리 |
|---|---|---|
| M-1 | `restore-ai-pm-docs.js`가 라우팅 불가 .md를 무음 스킵 → 며칠 뒤 훅이 막힐 때 원인 추적 불가 | `console.warn`으로 파일명 출력 |
| M-2 | 동일 내용이 git에 두 번 추적됨(원본 30건 + `docs/` 파생물 27건). 스크립트 주석은 "파생물"이라 정의했는데 커밋되고 있어 정의와 구현이 어긋남 | `docs/00~03`을 `.gitignore` + `git rm -r --cached`(27건 → 0건). 훅은 파일시스템 존재만 보므로 그대로 통과, 빌드가 재생성. 신규 클론 안내를 CLAUDE.md에 추가 |
| M-3 | `sync-version`이 lock을 쓰기 시작했는데 태그 게이트는 lock을 미검사 | `.githooks/pre-push`에 `package-lock.json` 추가 |
| M-4 | `03-soil-parcel.png`이 `02`와 바이트 동일 — 테스트가 주석대로 동작하지 않음 | MAJOR 옵션 1로 해소(파일·테스트 제거) |
| M-5 | 스크린샷 최신화가 `build → test → build` 2패스를 요구하는데 문서화·검출 수단이 없음. 2패스를 빼먹으면 각자 자기 일관적이라 `check:docs`가 통과하고 낡은 스크린샷이 조용히 배포됨 | CLAUDE.md에 순서와 함정을 명시 |

SUGGESTION 중 미반영: lock 포맷 자동 감지(S1 — 오늘 byte-identical 확인됨),
`generate_release_notes` 소음 우려(S3 — 유지 판단), `src/public` 주의사항(S4),
`typecheck` 위장 통과(S5 — 별건), `@ts-check` 추가(S6).

## 리뷰어가 독립 재검증한 사항

| 항목 | 결과 |
|---|---|
| ① lock 갱신 | `JSON.stringify(JSON.parse(raw),null,2)+'\n' === raw` → **byte-identical true** (481,823 bytes 동일). `lockfileVersion 3`은 최상위 `dependencies`가 없고 `packages` 키가 전부 경로 문자열이라 키 순서 재배열 위험도 없음 |
| ③ .nojekyll | `vite.config.js` `root:'src'` → publicDir 기본값이 정확히 `src/public` |
| ④ 복원 | 2회 연속 실행 → 30개 멱등, 원본↔사본 드리프트 0건. 접미사 우선순위(`-review`가 `-plan-review`의 부분 문자열) 해결 방식 정확 |
| ⑤ | 훅 경로 주장 사실 확인(`plan-review-guard.sh:44-46`, `codex-review-guard.sh:27`) |
| ⑥ | YAML 파싱 성공, `body`+`generate_release_notes` 둘 다 v3 `action.yml`에 존재하며 공존 동작 명시됨. `sample-log-setup.exe`가 `forge.config.js:47` `setupExe`와 일치 |
| 흙토람 이미지 2건 | 영향 없음 확인 — mtime 유지, 해시 불변, 설명서 참조 정상 |

## 최종 검증

- 단위 **271 pass** / E2E **210 pass + 4 skipped**(스크린샷 분리) / 빌드 4회 / `check:docs` 누락 0건
- `npm run test:screenshots`에 `UPDATE_SCREENSHOTS=1` 부여 시 4건 정상 실행
- `sh -n .githooks/pre-push` 통과, 스크립트 3개 `node --check` 통과
- 태그 게이트 시뮬레이션 통과

## Open Question 해소

리뷰어가 LOW 신뢰도로 남긴 "내부 리뷰 문서가 Pages에 공개될 가능성":
`gh api repos/bluesky78060/sample-log-electron` → **`visibility: public`**.
저장소가 공개이므로 git으로 이미 열려 있고 Pages 노출은 신규 노출이 아니다.
다만 M-2(gitignore)로 `docs/` 쪽 배포는 사라진다.
