# SAMPL-2-22 플랜 리뷰 (1차)

- 리뷰어: critic 에이전트 (Opus, 독립 레인) + 오케스트레이터 검증
- 판정: **CHANGES_REQUESTED** (MAJOR 3 / MINOR 2) → 개정판 반영 완료

## 지적 사항 및 처리

| # | 등급 | 지적 | 오케스트레이터 검증 | 처리 |
|---|---|---|---|---|
| MAJOR-1 | 🟠 | 태그 푸시 분기는 실제 배포 트리거가 아니다. Pages는 main push로 배포된다 | **확인** — `gh api .../pages` → `"source": {"branch":"main","path":"/docs"}`. `build.yml`은 `push: tags:['v*']`만이고 Pages 스텝 없음. 깨진 커밋 `36acadb`(v1.17.7)는 main push 시점에 이미 공개됨 | GitHub Actions `push: branches:[main]` 잡을 주 게이트로 추가 |
| MAJOR-2 | 🟠 | 일반 푸시 제외 근거가 사실과 다름 — 이 검사는 빌드를 강제하지 않는다 | 타당 — 낡았지만 자기 일관적인 `docs/`는 통과한다. 리뷰어 실측: 최근 20커밋 중 18개 통과, 실제로 깨진 2개만 실패(오탐 0) | pre-push를 태그 분기 밖으로 이동, Discovery §5 근거 정정 |
| MAJOR-3 | 🟠 | 워킹트리 검사는 배포될 내용을 검증하지 못한다 (설계상 false negative) | **확인** — 현재 저장소가 반례: `git status --short docs/` = 미추적 14 + 삭제 9 + 수정 12. 워킹트리는 일관되지만 HEAD는 깨져 있음 | 검사 대상을 `local_sha` 트리로 변경, 스크립트에 `--dir` 인자 추가 |
| MINOR-1 | 🟡 | "참조 26건"이 틀렸다 (실제 137건). 누락 18건은 정확 | **확인** — 내 이전 측정은 `docs/*/index.html`+`docs/index.html`만 본 부분 집계였다. 재귀 전체는 훨씬 많다 | 합격 조건을 "누락 0건"으로만 두고 총계는 참고 출력 |
| MINOR-2 | 🟡 | Discovery §2의 `grep -o 'assets/[a-z-]*\.js'`는 대문자·숫자가 없어 해시를 못 잡는다 | 타당 | 정규식 정정 |

## 리뷰어가 검증해 준 사항 (플랜 근거 보강)

- **정규식 추출 방식: 미탐 0 / 오탐 0** — `docs/` HTML의 참조 형태는
  `<script type="module" crossorigin src>`, `<link rel="modulepreload" href>`, `<link rel="stylesheet" href>` 뿐.
  루트 절대경로·쿼리스트링·비모듈 script 모두 0건. 상대경로만 사용.
- **동적 import 미탐 우려는 근거 없음** — Vite가 엔트리의 정적 청크 그래프 전체에 `modulepreload`를 찍는다.
  `docs/assets/` 51개 중 어떤 HTML에서도 참조되지 않는 파일은 0개.
- **함정 발견**: JS 내부를 스캔하면 즉시 오탐 — `pesticide-*.js`에 실행되지 않는 UMD 폴백
  `require("./mrl-name-canon.js")`가 있고 그 파일은 존재하지 않는다. → HTML 전용 스캔 유지.
- `docs/00-discovery` 등에는 HTML이 없어(md만) 검사 대상에서 자연히 제외된다.

## Open Question 해소

리뷰어가 "Pages 소스가 정말 main /docs 설정인지 확인 불가"로 남긴 항목을
`gh api repos/bluesky78060/sample-log-electron/pages`로 직접 확인했다 → `main` + `/docs` 확정.
따라서 MAJOR-1의 결론이 유효하다.
