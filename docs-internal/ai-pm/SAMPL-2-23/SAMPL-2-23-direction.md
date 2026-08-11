# SAMPL-2-23 Discovery — 릴리스 파이프라인 위생 정리

- 티켓: SAMPL-2-23 / 작성일 2026-08-11
- 방향 확정: 사용자 "1번 2번 순서대로 진행해줘" + "코드 수정이나 중요도 낮은 작업은 플랜리뷰하지말고 진행" (2026-08-11)
- 선행: SAMPL-1-149 릴리스 사후 리뷰의 MINOR 4건 + SUGGESTION 6건

## 목표

v1.17.8 릴리스에서 드러난 파이프라인 위생 문제를 정리한다. 앱 런타임 로직은 건드리지 않는다.
전부 "다음 릴리스에서 같은 실수가 반복되지 않게" 하는 성격이다.

## 범위

| # | 항목 | 근거 |
|---|---|---|
| ① | `sync-version.js`에 `package-lock.json` 갱신 추가 | lock version이 1.17.7로 남음. v1.17.7에서도 같은 누락 → 반복 패턴 |
| ② | 스크린샷 출력 경로 `docs/manual/images` → `src/manual/images` | 빌드 산출물에 직접 쓰기(CLAUDE.md 위반), `emptyOutDir` 충돌, 고아 ~1.8MB가 릴리스 커밋에 유입 |
| ③ | `docs/.nojekyll` 추가 | Vite가 `_` 접두 청크를 뱉으면 Jekyll이 조용히 누락 → SAMPL-2-22와 같은 404 재발. 현 검사기로 미검출 |
| ④ | 빌드 후 워크플로우 문서 자동 복원 | `emptyOutDir`가 매 빌드마다 `docs/00~03`을 지워 손으로 복원해 왔다 |
| ⑤ | CLAUDE.md 정정 | 버전 위치 기술이 실제와 다름, 테스트 프로젝트 동기화는 사문 규칙 |
| ⑥ | GitHub Release 본문 채우기 | 현재 비어 있어 자동업데이트 사용자가 변경 내용을 못 봄 |

## ④ 설계 변경 (리뷰 권고와 다른 선택)

리뷰어는 `docs/00-discovery`·`01-plan`·`02-review`·`03-code-review` **사본 제거**를 권했다
(`docs-internal/ai-pm/`에 바이트 동일 사본이 있으므로 순수 부채라는 근거).

**그대로 하면 안 된다.** 확인 결과 글로벌 훅이 `docs/` 경로를 하드코딩한다:

- `~/.claude/hooks/plan-review-guard.sh:44-46` → `docs/00-discovery`, `docs/01-plan`, `docs/02-review`
- `~/.claude/hooks/codex-review-guard.sh:27` → `docs/03-code-review`

사본을 제거하면 **이후 모든 티켓의 `start_work`/`approve_review`가 차단**된다.
글로벌 훅은 다른 프로젝트에도 적용되므로 이 티켓에서 수정할 범위가 아니다.

→ **대체 조치**: `docs/` 사본을 유지하되, 빌드 파이프라인이 자동 복원하게 한다.
리뷰어의 실제 의도("빌드 후 손으로 복원하는 작업을 없애라")는 이 방식으로 달성된다.

## 제약

- `docs/`는 Pages 공개 영역이다. ②의 고아 파일 삭제는 공개 용량을 ~1.8MB 줄인다.
- ②로 `src/manual/images/`가 갱신되면 빌드가 해시 자산으로 반영해 **설명서 스크린샷이 v1.14.0에서 현재로 최신화**된다.
  이는 부수 효과가 아니라 이득이다.
- ⑥은 `build.yml` 수정이므로 실제 검증이 다음 태그 푸시 때만 가능하다 → 문법 확인까지만 하고 동작 검증은 다음 릴리스로 미룬다.

## 검증

- ① `npm run sync-version` 후 lock의 두 version 필드가 package.json과 일치
- ② 스크린샷 스펙 실행 → `src/manual/images/`에 기록, `docs/`는 빌드로만 갱신됨을 확인
- ③ 빌드 후에도 `docs/.nojekyll` 생존(dotfile은 `emptyOutDir` 대상 아님) 확인
- ④ `npm run build` 단독 실행 후 `docs/00~03`이 자동 복원됨을 확인
- 전체 회귀: `npm run test:unit`, `npm test`, `npm run check:docs`

## 플랜 리뷰 생략

사용자가 저위험 작업에 대해 플랜 리뷰 생략을 명시 지시했다.
독립 critic 리뷰를 **수행하지 않았다** — 하지 않은 검증을 했다고 기록하지 않는다.
코드 리뷰(approve 전)는 규칙대로 수행한다.
