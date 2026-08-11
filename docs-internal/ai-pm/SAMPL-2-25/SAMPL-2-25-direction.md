# SAMPL-2-25 Discovery — typecheck 범위 확대

- 티켓: SAMPL-2-25 / 작성일 2026-08-11
- 방향 확정: 사용자 "둘다 진행해줘" (2026-08-11)
- 선행: SAMPL-2-24 (게이트 도입, 검사 범위 tests/e2e 21파일 / src/ 0파일)

## 목표

SAMPL-2-24가 세운 게이트는 진짜이지만 **애플리케이션 코드를 한 파일도 지키지 않는다.**
`src/`를 게이트에 들이고, 그 과정을 막는 구조적 장벽을 제거한다.

## 실측

### 후보 5개 파일 opt-in 시 오류 (파일별)

| 파일 | 줄 | 오류 |
|---|---|---|
| `sanitize.js` | 146 | 5건 |
| `address-parser.js` | 103 | 4건 |
| `mrl-name-canon.js` | 97 | 2건 |
| `pesticide-use-type.js` | 703 | 3건 |
| `psis-parse.js` | 130 | 1건 |

대응 단위 테스트가 모두 있다(`sanitize.test.js`, `utils-address.test.js`, `mrl-name-canon.test.js`,
`pesticide-use-type.test.js`, `psis-parse.test.js`).

### 오류 유형과 원인

```
TS2300: Duplicate identifier 'sanitizeHTML'          ← globals.d.ts 선언 vs 정의 파일 충돌
TS2304: Cannot find name 'DOMPurify'                 ← 외부 라이브러리 전역 미선언
TS2339: Property 'SIDO_LIST' does not exist          ← window 전역 미선언
TS2322: Type 'string | undefined' → 'string'         ← 실제 타입 문제 (strictNullChecks)
TS1003: Identifier expected                          ← 확인 필요
```

### 핵심 발견 — 자기가 정의하는 전역은 `d.ts`에 선언하면 안 된다

`globals.d.ts`에 `var sanitizeHTML: any`를 선언했는데 `sanitize.js:11`이 최상위
`function sanitizeHTML`을 선언한다 → **TS2300 중복**. SAMPL-2-24의 `declare var` 추가가
이 충돌을 만들었다.

`d.ts`에서 해당 선언을 빼고 검증한 결과, **다른 `@ts-check` 파일에서 `escapeHTML`/`sanitizeHTML`을
그대로 쓸 수 있었다**(오류 0건). 정의 파일이 프로그램에 있으면 TS가 최상위 선언을 전역으로 인식하므로
`d.ts` 선언이 불필요하다.

→ `globals.d.ts`의 역할을 정정한다:
- **넣지 않는다**: `src/`에 최상위 정의가 있는 전역 (정의 파일이 제공자)
- **넣는다**: `window.X = ...`로만 노출되고 최상위 선언이 없는 것, 외부 라이브러리 전역(DOMPurify/XLSX/firebase)

## 범위

1. `globals.d.ts` 역할 정정 — 자기정의 전역 제거, 외부 라이브러리 전역 추가
2. node/browser tsconfig 분리 (MAJOR 3) — `types: ["node"]`가 브라우저 코드에서
   `process`/`Buffer`/`__dirname`/`require()`를 통과시키는 것을 막는다
3. `src/shared/` 순수 모듈 5개 opt-in + 드러난 실제 타입 오류 수정
4. `include` 글롭 확장(`.ts`/`.mjs`/`.cjs`) + 루트 설정 파일 포함 + `@shared` paths
5. lock 크로스플랫폼 재생성 — 현재 lock은 Linux 러너에서 `npm ci`가 거부된다

## 제약

- `src/{soil,compost,pesticide}/*-script.js`는 같은 `SAMPLE_TYPE`을 선언해 opt-in 불가(TS2451).
  IIFE 감싸기나 상수 이관은 런타임 변경이라 이 티켓 범위 밖이다.
- lock 재생성은 `node_modules` 삭제를 요구해 실패 시 작업이 중단된다 → 마지막에 수행하고 검증한다.

## 검증

- `npm run typecheck` 0건 유지 + 검사 대상이 21 → 26파일 이상으로 증가
- 브라우저 파일에서 `process.platform` 등이 **오류로 잡히는지** 실측(MAJOR 3 해소 증거)
- 단위 271 / E2E 214 / 빌드 / check:docs 회귀
- `npm ci` 실제 실행 성공(lock 재생성 검증)
