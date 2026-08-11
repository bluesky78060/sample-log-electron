# SAMPL-2-25 구현 플랜 — typecheck 범위 확대

- 선행: `SAMPL-2-25-direction.md` (실측 결과·핵심 발견 포함)
- 플랜 리뷰: 사용자 지시로 생략

## 변경 ① — `types/globals.d.ts` 역할 정정

**제거**: `src/`에 최상위 정의가 있는 전역 (정의 파일이 제공자이므로 `d.ts` 선언은 TS2300 중복을 만든다)
- `sanitizeHTML`, `escapeHTML` (sanitize.js:11,49) 등 — grep으로 최상위 `function`/`const` 정의를 찾아 판정

**추가**: 외부 라이브러리 전역
- `DOMPurify` (sanitize.js가 쓴다), `XLSX`, `firebase`
- `SIDO_LIST`, `SIDO_SHORT_MAP` (address-parser.js가 `window.`로 읽는다 — 정의 위치 확인 후 판정)

## 변경 ② — node/browser tsconfig 분리

```
tsconfig.json          → references만 (tsc -b 진입점)
tsconfig.node.json     → src/index.js, src/preload.js, scripts/, tests/, types: ["node"]
tsconfig.browser.json  → src/** 나머지, types: [], lib: ES2022 + DOM
```

`package.json`: `"typecheck": "tsc -b"`.
브라우저 프로젝트에서 `process`/`Buffer`/`__dirname`/`require()`가 **오류로 잡히는지** 실측해 증거를 남긴다.

두 프로젝트가 `types/globals.d.ts`를 공유하려면 각 include에 넣는다.
`composite: true`가 필요하면 `noEmit`과 충돌하므로 `emitDeclarationOnly`/`tsBuildInfoFile` 조정이 필요할 수 있다 —
실패 시 `tsc -b` 대신 두 프로젝트를 순차 실행하는 `npm-run-all` 없는 방식(`tsc -p a && tsc -p b`)으로 폴백한다.

## 변경 ③ — `src/shared/` 순수 모듈 5개 opt-in

`sanitize.js`(5) · `address-parser.js`(4) · `mrl-name-canon.js`(2) · `pesticide-use-type.js`(3) · `psis-parse.js`(1)

각 파일에 `// @ts-check` 추가 후 드러난 오류를 수정한다. 유형별 처리:
- TS2300 → 변경 ①로 해소
- TS2304/TS2339 (외부·미선언 전역) → 변경 ①로 해소
- **TS2322 (`string | undefined` → `string`)** → 실제 타입 문제. JSDoc 또는 가드로 수정.
  런타임 동작을 바꾸지 않는 방향으로만 고친다(대응 단위 테스트로 확인)
- TS1003 (문법) → 원인 확인 후 판단

## 변경 ④ — include 글롭 + paths

- `src/**/*.{js,mjs,cjs,ts}` 등으로 확장 (`.ts` 추가 시 조용히 무시되는 것 방지)
- 루트 설정 파일 4개(`forge.config.js`, `vite.config.js`, `vitest.config.js`, `playwright.config.js`) 포함
- `"paths": { "@shared/*": ["src/shared/*"] }` — `vitest.config.js:11`의 alias와 짝을 맞춘다

## 변경 ⑤ — lock 크로스플랫폼 재생성

현재 lock은 Linux 러너에서 `npm ci`가 거부된다(`Missing: esbuild@0.28.2`).
`rm -rf node_modules package-lock.json && npm install`로 재생성한 뒤:
- `npm ci --dry-run` 통과 확인
- 단위·E2E·빌드 재확인 (의존성이 실제로 바뀌므로 필수)
- 성공하면 `typecheck.yml`을 `npm ci`로 되돌린다

**마지막에 수행한다** — 실패하면 `node_modules`가 없어 이후 검증이 전부 막힌다.

## 순서

1. ① → ③(5파일 opt-in) → 오류 0건
2. ② 분리 → MAJOR 3 해소 실측
3. ④ 글롭·paths
4. 단위 271 / E2E / 빌드 / check:docs 회귀
5. ⑤ lock 재생성 → `npm ci` 검증 → CI 되돌리기
6. PR → CI 통과 → 머지 → 코드 리뷰 → approve

## 영향 범위

- **런타임 코드 수정**: `src/shared/` 5파일 (SAMPL-2-23/24와 달리 설정 파일만이 아니다)
  → 대응 단위 테스트 5개로 동작 보존 확인
- 설정: `tsconfig*.json`, `types/globals.d.ts`, `package.json`, `.github/workflows/typecheck.yml`
- `package-lock.json` 재생성

## 롤백

각 단계가 독립적이다. ⑤가 실패하면 `git checkout -- package-lock.json && npm install`로 복구한다.
