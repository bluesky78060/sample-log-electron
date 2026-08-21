# SAMPL-2-25 코드 리뷰 — typecheck 범위 확대 (node/browser 분리)

## 착수 전 확인 — 티켓 4항목 중 2개는 이미 끝나 있었다

| 항목 | 상태 |
| --- | --- |
| ③ include 글롭이 `.js` 전용 | **이미 완료** — `.ts/.mts/.cts/.mjs/.cjs` + 루트 설정 4개까지 들어 있었다 |
| ④ vitest `@shared` alias 대응 `paths` | **이미 완료** |
| ② `src/shared/` 순수 모듈 opt-in | **부분 완료** — 8파일 |
| ① node/browser 분리 | **미완** ← 이번 작업 |

## ①의 주장을 실측으로 확인했다

브라우저 모듈을 흉내낸 파일을 `src/shared/`에 넣었다.

```js
// @ts-check
export function probe() {
    return process.platform + String(Buffer.from('x')) + __dirname;
}
```

**`npm run typecheck` exit 0.** 이 앱의 중심 불변식(Electron=Node vs Web=브라우저)을
게이트가 전혀 잡지 못하고 있었다 — 웹에서 그대로 런타임 크래시다.

## 분리만으로는 되지 않았다 — jszip

`tsconfig.node.json`(types: ["node"]) / `tsconfig.browser.json`(types: [])으로 나누고
루트를 references 전용으로 바꿨는데, **누수 프로브가 여전히 통과했다.**

`--explainFiles`로 추적하니 `@types/node`가 브라우저 프로젝트에 **80개 파일**째
들어와 있었다.

```text
node_modules/@types/node/index.d.ts
  Type library referenced via 'node' from file 'node_modules/jszip/index.d.ts'
node_modules/jszip/index.d.ts
  Imported via 'jszip' from file 'src/heuktoram/heuktoram-entry.js'
```

`compilerOptions.types`는 **자동 포함**만 막는다. 의존성이 직접 적은
`/// <reference types="node" />`는 막지 못한다.

→ 브라우저 프로젝트에서만 jszip을 `types/stubs/jszip.d.ts`로 돌렸다.
**80 → 0.** 프로브가 3건 오류로 잡힌다.

안전 근거: `checkJs`가 false라 실제 검사 대상은 `@ts-check` 파일뿐이고,
jszip을 쓰는 `heuktoram-entry.js`에는 그 주석이 없다. 타입이 느슨해져 곤란해지는
사용처가 **현재 없다.** 그 조건이 깨지면 어떻게 해야 하는지 스텁 파일에 적어 뒀다.

## ② 확대 — 8 → 10파일

`src/soil/reception-number.js`, `src/shared/sync-utils.js`에 `@ts-check`를 붙였다.
전자는 붙이자마자 `window.ReceptionNumber` 미선언(TS2339)을 냈고, CLAUDE.md 규칙대로
`types/globals.d.ts`에 등록했다.

`src/shared/pesticide-name-map.js`는 **제외했다.** `typeof module !== "undefined"`
UMD 패턴이라 브라우저 프로젝트에서 `module`이 없어 오탐이 난다. 같은 이유로
`constants.js`·`logger.js`의 `typeof process !== 'undefined'` 가드도 그대로 두었다 —
그것은 **올바른 이중 환경 패턴**이지 결함이 아니다.

## 독립 리뷰 레인

- **gemini: 미수행** — `GOOGLE_CLOUD_PROJECT` 미설정. **실행하지 않은 검증을 통과로 적지 않는다.**
- **codex: 2라운드 수행**

### 1라운드 — MAJOR 2 / MINOR 1

| 심각도 | 지적 | 대응 |
| --- | --- | --- |
| MAJOR | `@types/node` 임계값이 `<=5`. **1~5개만 새어도** 그 안에 `process`·`Buffer` 선언이 있으면 검사가 무력해진다 | `-gt 0`으로 바꿨다. "조금 새는 것"은 안전하지 않다 |
| MAJOR | 자기검사가 **"파일이 포함됐는가"만** 센다. 72개 파일에서 `@ts-check`를 전부 떼도 숫자는 그대로여서 CI가 통과한다 | `@ts-check` 파일 수를 따로 세는 단계 + **CI에서 실제 누수 프로브를 돌려 게이트가 잡는지 실증**하는 단계를 넣었다 |
| MINOR | 절대 파일 수 임계값은 디렉터리 단위 누락을 못 잡는다 | 부분 대응(opt-in 수 추가). 기대 파일 목록 고정은 별건으로 남긴다 |

리뷰가 **정상이라고 확인한 것**: jszip 스텁의 안전성 근거, `src/index.js`·`preload.js`가
node 프로젝트에 정확히 포함되고 브라우저에서 재유입되지 않는 점, `tsc -b`+composite
캐시가 낡은 결과를 통과시키는 재현 사례 없음, `reception-number.js`의 `@ts-check`가
실제 JSDoc 기반 검사를 제공한다는 점.

### 2라운드 — MAJOR 1 (1라운드 수정본에서)

**고정 프로브 파일명이 실제 소스를 파괴할 수 있다.** `src/shared/__gate_probe__.js`와
같은 이름의 소스가 생기면 `cat >`가 덮어쓰고 `rm -f`가 지운다 — **CI가 소스를
파괴하면서 통과한다.**

→ `mktemp` 성격의 고유 이름(`$(date +%s%N)`)으로 바꾸고, 만들자마자
`trap 'rm -f "$probe"' EXIT`를 걸어 중단·취소 경로에서도 남지 않게 했다.
MINOR로 지적된 정리 보장도 이 `trap`이 함께 해결한다.
SUGGESTION(임계값이 느슨함)도 반영해 기준을 현재 수와 같게 조였다.

## CI 자기검사 (로컬 재현 전부 통과)

| 검사 | 값 | 기준 |
| --- | --- | --- |
| node 프로젝트 spec 파일 | 32 | ≥20 |
| browser 프로젝트 src 파일 | 72 | ≥50 |
| `src/`의 `@ts-check` 파일 | 10 | ≥10 |
| browser 프로젝트 `@types/node` | 0 | =0 |
| **누수 프로브 검출** | exit 2, 오류 3건 | 반드시 실패해야 함 |

마지막 항목이 이 워크플로의 핵심이다. 앞의 넷은 **간접 지표**이고,
지표는 진짜 게이트가 죽어도 초록불일 수 있다 — SAMPL-2-24의 위장 게이트가 그랬다.

## 최종 검증

| 항목 | 결과 |
| --- | --- |
| 빌드 | 성공 |
| 단위 | **482 pass** |
| E2E | **376 pass / 4 skip / 0 fail** |
| `npm run typecheck` (`tsc -b`) | **0건** |
| `npm run check:docs` | 누락 **0건** |
| `npm run lint` | **미구성** — `skip` 제출 |

## 남은 한계

- **`checkJs`는 여전히 false다.** 전체 전환은 별건이며, 티켓 ⑤가 말한 재측정도 하지 않았다.
- **jszip 스텁은 조건부 안전이다.** heuktoram에 `@ts-check`를 붙이면 `any`가 흘러간다.
  스텁 파일에 그 조건을 적어 뒀다.
- `pesticide-name-map.js` 등 UMD 패턴 파일은 브라우저 프로젝트에서 오탐이 나 opt-in하지 못했다.
- CI 임계값은 여전히 **절대 수**다. 디렉터리 단위 누락은 못 잡는다(리뷰 MINOR, 별건).
- 루트의 `copy-*.js`·`import-soil-data.js`는 두 프로젝트 어디에도 없다 —
  DevTools에 수동으로 붙여 넣는 운영 스크립트이고 이전에도 검사 대상이 아니었다.

## 판정

1라운드: 🟠 MAJOR 2 / 🟡 MINOR 1 — 전건 대응
2라운드: 🟠 MAJOR 1 (1라운드 수정본이 만든 것) / 🟡 MINOR 1 / 🔵 SUGGESTION 1 — 전건 대응

합계 🔴 CRITICAL: 0건 / 🟠 MAJOR: 3건 / 🟡 MINOR: 2건 / 🔵 SUGGESTION: 1건

→ **APPROVED**
