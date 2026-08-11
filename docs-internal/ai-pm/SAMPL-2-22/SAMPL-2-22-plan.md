# SAMPL-2-22 구현 플랜 (개정판) — docs/ 번들 참조 정합성 검사

- 선행: `SAMPL-2-22-direction.md`, 플랜 리뷰 1차 CHANGES_REQUESTED (MAJOR 3 / MINOR 2)
- **실행 순서: 이 티켓을 SAMPL-1-148보다 먼저 완료한다** (148이 `docs/`를 재생성하므로 검사기가 먼저 있어야 그 커밋을 검증할 수 있다)

## 리뷰로 정정된 전제 (직접 재확인)

```
$ gh api repos/bluesky78060/sample-log-electron/pages
"source": { "branch": "main", "path": "/docs" }
```

**Pages는 `main` 브랜치의 `/docs`를 직접 서빙한다 — 태그와 무관하다.**
`.github/workflows/build.yml`은 `push: tags: ['v*']`에서만 돌고 Pages 배포 스텝이 없다.
즉 깨진 `docs/`는 **main에 push되는 순간** 공개된다. 태그 시점 검사는 이미 배포된 뒤에 발동한다.

또한 **워킹트리 검사는 이 실패를 잡지 못한다.** 현재 저장소가 그 반례다:
`git status --short docs/` = 미추적 14건 + 삭제 9건 + 수정 12건 → 워킹트리는 자기 일관적이지만 HEAD는 깨져 있다.

## 변경 A — 검사 스크립트

`scripts/check-docs-assets.js` (의존성 없음, node 기본 API)

- `--dir=<path>` 인자로 검사 대상 디렉터리를 받는다 (기본 `docs`).
  → 워킹트리(`npm run check:docs`)와 커밋 트리(훅/CI에서 `git archive`로 추출한 임시 디렉터리) 양쪽에서 재사용.
- `**/*.html` 재귀 수집 → `src="…"` / `href="…"` 중 `.js`/`.css`로 끝나고
  `http`·`//`·`data:`·`#`·`mailto:`로 시작하지 않는 참조 추출 → HTML 위치 기준 경로 해석 → 존재 확인
- 누락분을 `HTML → 참조`로 출력, 1건 이상이면 exit 1
- 참조 총계는 **참고 출력**으로만 (빌드마다 변함 — 합격 조건은 "누락 0건")
- 헤더 주석에 한계 명시: HTML에서 참조되지 않는 동적 import 청크와 CSS `url()` 자산은 검출 대상이 아니며,
  Vite가 정적 그래프 전체에 `modulepreload`를 찍는다는 전제에 의존한다.
- **JS 파일 내부는 스캔하지 않는다** — `docs/assets/pesticide-*.js`에 실행되지 않는 UMD 폴백
  `require("./mrl-name-canon.js")`가 있어 즉시 오탐이 난다.

`package.json`: `"check:docs": "node scripts/check-docs-assets.js"`

## ⚠️ 착지 순서 (코드 리뷰 M4 — 자기 봉쇄 방지)

**HEAD의 `docs/`가 이미 18건 깨져 있으므로, `docs/`를 포함하지 않는 커밋은 이 훅에 스스로 막힌다.**
(리뷰어가 dangling 커밋으로 실증: 4개 파일만 담은 커밋 → 훅 exit 1)

따라서 SAMPL-2-22 · SAMPL-1-148의 산출물과 **재빌드된 `docs/` 전체를 같은 커밋에** 넣어야 한다:

```bash
npm run build
git add -A docs/ src/ tests/ scripts/ .githooks/ .github/ package.json
git status --short docs/    # D / ?? 가 0건이어야 한다
npm run check:docs          # 누락 0건
```

"검사기를 먼저 둔다"는 취지는 커밋을 합치는 것으로 달성한다 — 순서를 뒤집을 필요는 없다.

## 변경 B — GitHub Actions (2차 그물, 게이트 아님)

**정정 (코드 리뷰 M3)**: 이 워크플로는 배포를 막지 못한다.
- `gh api .../branches/main/protection` → **404 (브랜치 보호 없음)**
- PR 이력 **0건** → `pull_request` 트리거는 사실상 발동하지 않음
- legacy Pages 빌드는 Actions와 무관하게 병렬 배포 → push 수락 **후**에 도는 잡은 사후 경보기

**실제 차단 게이트는 pre-push 훅**이고, 이 잡은 훅이 `--no-verify`로 우회되거나
`core.hooksPath` 미설정으로 동작하지 않았을 때를 잡는 2차 그물이다.
진짜 게이트로 승격하려면 **main 브랜치 보호 + required status check 등록**이 필요하다(사용자 결정 사항).

`.github/workflows/check-docs.yml` 신규:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

체크아웃된 **커밋된** 트리를 검사하므로 Pages가 실제로 서빙할 내용과 일치하고, `--no-verify`로 우회할 수 없다.
Pages 배포 트리거(main push)와 1:1로 일치하는 유일한 지점이다.

## 변경 C — pre-push 훅 (로컬 조기 피드백)

`.githooks/pre-push`의 태그 분기 **밖**으로 검사를 옮긴다 (모든 ref에 적용).
기존 dirty 검사는 태그 전용으로 그대로 둔다.

검사 대상은 워킹트리가 아니라 **푸시되는 커밋(`local_sha`)의 트리**:
`git archive <local_sha> docs | tar -x -C <임시디렉터리>` 후 `--dir=<임시디렉터리>/docs`로 검사.

일반 푸시까지 거는 근거(리뷰가 정정한 부분): **이 검사는 빌드를 강제하지 않는다.**
빌드하지 않은 낡은 `docs/`는 자기 일관적이라 통과하고, 실패하는 것은 `docs/`가 *부분적으로만* 갱신된 경우뿐이다.
리뷰어가 최근 20개 커밋을 실측한 결과 18개 통과 / 실제로 깨진 2개(`36acadb`, `964fd44`)만 실패 → **오탐 0**.

## 검증

1. 현재 워킹트리 `docs/` → 누락 0건 (참조 총계는 출력만 확인, 137건 내외)
2. `git archive HEAD docs` 추출본 → **누락 18건 재현** (v1.17.7이 깨져 있었다는 증거)
3. 번들 파일 하나를 임시 rename → 그 참조를 정확히 지적하며 exit 1
4. `sh -n .githooks/pre-push` 문법 검사
5. 워크플로우 YAML 파싱 확인

## 영향 범위

- 신규: `scripts/check-docs-assets.js`, `.github/workflows/check-docs.yml`
- 수정: `package.json`(1줄), `.githooks/pre-push`
- `src/` 무변경 → 앱 런타임 영향 없음

## 비범위 (명시)

- **고아 자산 검사**(참조되지 않는 낡은 번들)는 하지 않는다 — 런타임 영향이 0이고 오탐 소음만 늘린다.
- CSS `url()` 자산, 진짜 동적 `import()` 청크는 범위 밖 (한계로 주석에 명시)

## 롤백

훅 한 줄 + 스크립트/워크플로우 파일 제거로 즉시 원복. 런타임 영향 없음.
