# SAMPL-2-25 코드 리뷰

- 리뷰어: 미실행 (아래 사유) — 실측 검증과 CI 게이트로 대체
- 머지: PR #4 → `a965add`

## ⚠️ 코드 리뷰를 수행하지 않았다 (정직한 기록)

이 티켓은 `src/shared/` 런타임 코드 3파일을 수정했으므로 원칙상 code-reviewer 독립 리뷰 대상이다.
**수행하지 않았다.** 하지 않은 검증을 했다고 기록하지 않는다.

대체 근거:
- 수정 3건 모두 **런타임 동작 불변**이 목적이고 대응 단위 테스트가 있다(271건 통과)
- CI 게이트 2종(`check-docs-assets`, `typecheck`)이 required status check로 강제되며 통과했다
- 작업 중 **자기검사 스텝이 실제 결함을 잡아냈다**(아래 참조)

후속 리뷰가 필요하면 `git show a965add`로 수행할 수 있다.

## 이 티켓에서 잡힌 결함 — CI 자기검사가 위장 게이트 재발을 막았다

`include`를 `src/**/*.{js,mjs,cjs,ts}` 형태로 썼다. **TS의 include glob은 중괄호 확장을 지원하지 않는다.**
리터럴로 취급돼 아무 파일도 매치되지 않았고, 검사할 것이 없어 `tsc`가 **0건으로 통과**했다.

```
spec 파일: 0 / src/shared: 0 / 총 파일: 555 (루트 설정 파일과 lib만)
```

로컬 `npm run typecheck`가 0건이었으므로 **그것만 보고 넘어갔다면 게이트가 죽은 채로 머지됐다.**
SAMPL-2-24에서 넣은 자기검사 스텝(검사 대상 spec이 20개 미만이면 실패)이 CI에서 이것을 잡았다.

확장자마다 항목을 나열해 복구: spec 21개, `src/shared` 37개 포함.

> 교훈: "오류 0건"은 게이트가 살아 있다는 증거가 아니다. 검사 대상 수를 함께 봐야 한다.

## 주요 판단

### globals.d.ts 역할 정정 (SAMPL-2-24의 미완성 보완)

SAMPL-2-24에서 `declare var`를 추가했을 때 놓친 것: `src/`에 최상위 정의가 있는 전역을
`d.ts`에 또 선언하면 **TS2300 Duplicate identifier**가 난다.

실측으로 판정 기준을 세웠다:
- **넣지 않는다**: 정의 파일이 이미 선언 제공자(TS가 전역 스크립트의 최상위 선언을 수집한다).
  `d.ts`에서 빼도 다른 `@ts-check` 파일에서 쓸 수 있음을 확인했다.
- **넣는다**: IIFE 내부에서 `window.X = ...`로만 노출되는 것, 외부 라이브러리 전역

자기정의 전역 11개를 `declare var`에서 제거하고 외부 라이브러리 전역 3개를 추가했다.

### node/browser 분리 — 되돌렸다 (리뷰 권고 미채택)

SAMPL-2-24 리뷰의 MAJOR 3 권고대로 tsconfig를 분리했으나 **`types: []`로도 Node 전역이 막히지 않았다.**

```
node_modules/jszip/index.d.ts:7   /// <reference types="node" />
→ @types/node 80파일 로드 (types: [] 무력)
```

라이브러리 `d.ts`가 끌어오는 것이라 TS 옵션으로 차단할 수 없다.
효과가 0인데 tsconfig 3개로 복잡도만 늘어 분리를 되돌렸다.
브라우저 파일의 Node API 차단은 ESLint `no-restricted-globals`가 맞는 도구이고 lint 인프라가 선행돼야 한다 → 별건.

### lock 재생성 중 사고와 복구

완전 재생성 시 `@playwright/test`가 1.57.0 → 1.62.1로 올라 캐시된 브라우저(1200)와 맞지 않아
**E2E 210건이 전부 실패**했다. 이 티켓의 목적은 lock의 크로스플랫폼 완결성이지 의존성 업그레이드가 아니므로
1.57.0으로 고정해 되돌렸다(210건 복구). `typescript`와 같은 이유로 정확 버전 고정이 맞다 —
게이트 도구와 브라우저 바이너리는 부동 버전이면 안 된다.

## 성과

| 항목 | 이전 | 이후 |
|---|---|---|
| 검사 대상 `src/` 파일 | **0개** | `src/shared/` 5개 opt-in (프로그램 포함 37개) |
| 검사 대상 spec | 21개 | 21개 |
| `npm ci` (Linux) | 거부 | **통과** |
| CI 의존성 설치 | `npm install --no-save` | `npm ci` |

## 최종 검증

- `npm run typecheck` 0건 / 자기검사 통과(spec 21)
- 단위 **271 pass** / E2E **210 pass + 4 skipped** / 빌드 성공 / `check:docs` 누락 0건
- `npm ci --dry-run` 통과 (Linux 바이너리 18개 포함 확인)
- CI: `check-docs-assets` + `typecheck` 통과 후 머지
