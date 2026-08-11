# SAMPL-2-24 Discovery — typecheck 위장 게이트를 실제 게이트로

- 티켓: SAMPL-2-24 / 작성일 2026-08-11
- 방향 확정: 사용자 "typecheck 게이트도 설정해줘" (2026-08-11)
- 선행: SAMPL-1-149 · SAMPL-2-23 리뷰가 지적한 하네스 갭

## 목표

`npm run typecheck`는 `tsc --noEmit`인데 **`tsconfig.json`이 없어 tsc 도움말만 출력하고 exit 0** 한다.
아무것도 검사하지 않으면서 통과하는 위장 게이트다. 이것을 실제로 실패할 수 있는 게이트로 만든다.

## 실측한 오류 규모

TypeScript 5.9.3이 이미 devDependencies에 있다. 임시 tsconfig로 측정:

| 방식 | 오류 수 | 구성 |
|---|---|---|
| `@ts-check` opt-in (`checkJs: false`) | **25건** | 전부 `window.*` 전역 미선언 계열 |
| 전체 검사 (`checkJs: true`, src 115파일) | **2654건** | TS2339 2256 / TS2304 179 / TS2551 118 |

`@ts-check`는 `tests/e2e/` 20개 파일에 이미 붙어 있고 `src/`에는 없다.

**2654건은 게이트로 만들 수 없다.** 이 앱은 번들러 도입 전부터 `window.*`에 모듈을 노출하는
구조로 커왔고(`src/shared/*.js` 끝의 `window.XxxManager = ...`), 그 패턴 전체가 타입 오류로 잡힌다.

## 범위

opt-in 방식으로 **25건 → 0건**을 만들어 게이트를 세운다.

1. `tsconfig.json` — `allowJs`, `checkJs: false`, `noEmit`. `@ts-check` 파일만 검사
2. `types/globals.d.ts` — `window.soilManager` 등 전역 선언 (25 → 10건)
3. `tests/e2e/edit-mode.spec.js` — `page.evaluate([k, v])` 배열 인자를 객체로 (10 → 4건).
   배열 구조분해는 `(string | Record)[]` union으로 추론돼 `localStorage.setItem(k, ...)`의
   string 파라미터에 대입 불가 오류가 난다
4. `tests/e2e/soil-group-edit.spec.js` — `querySelector()?.value`를 입력 요소로 좁힘 (4 → 0건)
5. `.github/workflows/typecheck.yml` — CI 잡
6. main 브랜치 보호의 required status check에 `typecheck` 추가

## 제약

- `npm ci`는 이 저장소에서 실패한 이력이 있다 → CI는 `build.yml`과 같은 `npm install`을 쓴다
- required status check는 그 check가 한 번 실행된 뒤 등록하는 것이 안전하다
  → 이번 PR에서 잡을 돌린 뒤 등록한다
- main 직접 푸시가 차단돼 있으므로(SAMPL-2-23 이후) PR 워크플로로 진행한다

## 비범위

- `checkJs: true` 전체 전환(2654건). 전역 선언을 보강하면 상당수 줄지만 별건 규모다
- `npm run lint` 스텁(`echo "No linting configured"`) — 사용자가 typecheck만 요청
- 개별 매니저에 실제 타입 붙이기 — `globals.d.ts`는 `any`로 두었다.
  목적은 "전역이 존재한다"를 인정해 게이트를 세우는 것이고 실질 검사는 사용처에서 일어난다

## 검증

- `npm run typecheck` → 오류 0건, exit 0
- **뮤테이션 검증**: `@ts-check` 파일에 의도적 타입 오류를 넣으면 exit non-zero
- E2E 219건 회귀 (테스트 파일 2개를 고쳤으므로 동작 확인 필수)
- CI 잡이 PR에서 통과
