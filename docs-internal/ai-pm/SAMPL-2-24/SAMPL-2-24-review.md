# SAMPL-2-24 코드 리뷰

- 리뷰어: code-reviewer 에이전트 (Opus, 독립 레인)
- 1차 판정: **CHANGES_REQUESTED** (MAJOR 4 / MINOR 5 / SUGGESTION 3) — revert 금지 명시
- 처리: MAJOR 3건 + MINOR 3건 + SUGGESTION 1건 반영, MAJOR 1건은 SAMPL-2-25로 분리

## 🟠 MAJOR 1 — `interface Window`가 절반만 커버 (해소)

지적: `declare global { interface Window { showToast: any } }`는 `window.showToast`만 합법화하고
**bare 식별자 접근은 여전히 TS2304/TS2551**이다. 실측한 2654건 중
TS2304 179 + TS2551 118 = **297건이 정확히 이 클래스**인데 하나도 해결되지 않는다.

실제 사용 빈도(리뷰어 집계): `showToast` window. 95 / bare 127, `escapeHTML` 14 / 62,
`SampleUtils` 42 / 41 — bare 쪽이 더 많다.

**오케스트레이터 실측 검증:**
```
A. interface Window 만:  showToast/escapeHTML/SampleUtils → TS2304 3건 (window.showToast는 통과)
B. declare var 추가:     동일 코드 → exit 0
```

**처리**: `declare var` + `interface Window`를 **양쪽에** 둔다. `declare var`는 `typeof globalThis`에
들어가고 lib.dom이 `declare var window: Window & typeof globalThis`로 선언하므로 두 형태를 모두 통과시킨다.

부수 이득 — MINOR 7(`electronAPI: any`가 이중 환경 가드를 버림)도 함께 처리했다:
```
window.electronAPI.saveFile()  → error TS18048: 'window.electronAPI' is possibly 'undefined'
```
`any` 대신 `electronAPI?: { isElectron?: boolean; [k: string]: any }`로 두어 무가드 접근을 잡는다.
이 앱에서 게이트 하나로 가장 값이 큰 항목이다.

## 🟠 MAJOR 4 — 필수 게이트가 부동 버전으로 돌아 main을 무작위로 잠글 수 있음 (해소)

지적: `npm install` + `"typescript": "^5.9.3"` 조합이면 TS 마이너 릴리스가 새 오류를 도입하는 날
**아무 잘못 없는 PR이 전부 머지 불가**가 된다(`enforce_admins: true`라 우회 수단 없음).

**원인 규명**: 워크플로 주석의 "npm ci는 실패한 이력이 있다"가 재확인되지 않은 전언이라는
리뷰어 지적을 받아 실제 원인을 확인했다:

```
$ npm ci --dry-run
npm error `npm ci` can only install packages when your package.json and
package-lock.json are in sync.
npm error Invalid: lock file's @esbuild/aix-ppc64@0.28.0 does not satisfy @esbuild/aix-ppc64@0.28.2
```

**도구 문제가 아니라 커밋된 lock이 stale했던 것이다.** SAMPL-1-149에서 "무관한 의존성 상승"으로
판단해 되돌린 78줄이 실은 package.json이 요구하는 해석이었다.

**처리**: `npm install`로 lock 동기화 → `npm ci --dry-run` 통과 확인 →
CI를 `npm ci`로 전환 + `typescript`를 `5.9.3` 정확 버전으로 고정(캐럿 제거).

## 🟠 MAJOR 2 — 점진 확대 경로가 classic script에서 막힘 (문서화로 처리)

지적: `module: "ESNext"` + import/export 없는 파일 → TS가 전역 스크립트로 취급 →
최상위 `const SAMPLE_TYPE`이 전역 스코프를 공유해 **TS2451(Cannot redeclare)** 충돌.
`@ts-check` 없는 파일의 선언도 충돌에 참여하며, 오류는 `@ts-check` 붙인 파일에 보고된다.

**오케스트레이터 실측:**
```
a.js(@ts-check) + b.js(no @ts-check), 둘 다 const SAMPLE_TYPE
→ error TS2451: Cannot redeclare block-scoped variable 'SAMPLE_TYPE'
실제 소스: soil-script.js:11 / compost-script.js:14 / pesticide-script.js:11 — 3개가 같은 이름
```

즉 CLAUDE.md의 "새 파일·수정 파일에 `// @ts-check` 한 줄을 붙이면 게이트 범위가 넓어진다"는
**모듈 형태 파일에만 참**이었다. 부정확한 서술을 정정했다:
- 모듈 형태만 한 줄로 가능함을 명시
- classic script는 IIFE 감싸기 또는 상수를 생성자 옵션으로 옮기는 선행 작업이 필요함을 경고
- 확대하기 쉬운 대상(`src/shared/`의 순수 모듈)을 제시

## 🟠 MAJOR 3 — `types: ["node"]`가 브라우저 코드에 Node 전역 허용 → **SAMPL-2-25로 분리**

`process.platform`/`Buffer`/`__dirname`/`require()`가 모두 통과해(리뷰어 실측),
브라우저 파일이 Node API를 쓰는 것을 검사기가 놓친다. 현재 검사 대상이 tests/e2e(진짜 Node 컨텍스트)뿐이라
**영향은 0**이지만 브라우저 파일 확대의 장벽이다. node/browser 프로젝트 분리는 규모가 있어 별건으로 옮겼다.

## 🟡 MINOR 처리

| # | 지적 | 처리 |
|---|---|---|
| M-8 | `check-docs.yml` 주석이 이 변경으로 거짓이 됨("게이트가 아니라 사후 경보기다", "브랜치 보호 404", "PR 이력 0건") — **이 티켓 범위였다** | 현재 사실로 갱신(required check 2개, enforce_admins, PR #1·#2 존재) |
| M-9 | 게이트 잡 node 20 vs 릴리스 빌드 node 22 | typecheck.yml을 22로 통일 — 검증 런타임과 배포 런타임을 맞춤 |
| M-5 | `include`가 `.js` 전용 → 미래 `.ts` 파일이 조용히 검사 밖 | SAMPL-2-25로 이관 |
| M-6 | 선언 29개 중 24개가 미사용 | `declare var` 전환으로 형태 자체가 정확해졌고, 확대 시 쓰인다 |
| M-7 | `electronAPI: any`가 이중 환경 가드를 버림 | **반영** (MAJOR 1 항목 참조) |

## 🔵 SUGGESTION 10 반영 — 게이트 자기검사

원래의 실패 양식(조용한 exit 0)이 `include` 오타·경로 이동으로 재발할 수 있다는 지적.
CI에 검사 대상 수 확인 스텝을 추가했다:

```yaml
n=$(npx tsc -p tsconfig.json --noEmit --listFilesOnly | grep -c 'tests/e2e/.*\.spec\.js')
if [ "$n" -lt 20 ]; then exit 1; fi
```
현재 21개. `package.json`의 `typecheck`도 `tsc -p tsconfig.json --noEmit`로 설정 파일을 명시했다.

## 리뷰어가 독립 검증해 준 사항

- `npx tsc --noEmit` → exit 0, 413파일 로드 (tsconfig가 실제로 읽힘)
- 브랜치 보호 실물 확인: `contexts: ["check-docs-assets","typecheck"]`, `strict`, `enforce_admins`
- **`npx vite build` 성공** — 새 루트 tsconfig.json이 릴리스 파이프라인을 교란하지 않음
  (esbuild가 루트 tsconfig를 읽으므로 확인 대상이었고, 내 검증 목록에 빌드가 없었다)
- `strict: true` + `noImplicitAny: false` 조합이 의도대로 동작(strictNullChecks 살아 있음)
- `declare global` + `export {}` 패턴 정확, `types/**/*.d.ts`가 프로그램에 로드됨
- **테스트 수정이 동작 보존적**: `page.evaluate` 배열→객체는 Playwright 직렬화상 동등,
  6개 호출 지점 키 대조 전부 일치, `undefined` 보존. `val()` 헬퍼는 원본 `?.value || ''`와 완전 동일
- `cache: npm`은 lock이 커밋돼 있어 정상 동작

## 리뷰어의 솔직한 평가 (E 항목)

> **진짜 게이트이지만, 지금 지키는 범위는 tests/e2e 21파일이고 애플리케이션 코드는 0파일이다.**
> "main에 typecheck 게이트를 걸었다"는 서술은 실제보다 넓게 들린다.
>
> 형식적 조치는 아니다. (1) 조용히 통과할 수 없게 됐고 (2) 데이터 유실 버그가 났던 영역의
> 회귀 테스트가 잠기고 (3) `window.` 계약이 처음으로 한 파일에 문서화됐다.
> 다만 21개 `@ts-check` 주석은 이 티켓이 추가한 것이 아니라 이미 있던 것이고,
> 이 티켓이 한 일은 "이미 있던 opt-in을 강제로 만든 것"이다. 범위 확대 기여는 0이다.

이 평가를 그대로 수용한다. `declare var` 전환으로 297건 클래스가 해소돼 확대의 첫 단계는 열렸고,
실제 확대(`src/shared/` 순수 모듈 opt-in)는 SAMPL-2-25에서 수행한다.

## 기록 정확성 정정

리뷰어 지적: `SAMPL-2-24-plan-review.md`는 "E2E 219건", 커밋 메시지는 "210 pass + 4 skipped"(=214)로 어긋난다.
정확한 값은 **210 pass + 4 skipped = 214**다(스크린샷 4건이 SAMPL-2-23에서 UPDATE_SCREENSHOTS 뒤로 분리됨).
plan-review 문서의 숫자를 정정했다.

## 최종 검증

- `npm run typecheck` → **0건**, exit 0, 검사 대상 spec 21개
- 뮤테이션 2종: 타입 오류 주입 → exit 2 / bare 전역 접근 → 0건 / 무가드 electronAPI → TS18048
- `npm ci --dry-run` 통과 (lock 동기화 확인)
- 단위 271 pass / E2E 210 pass + 4 skipped / 빌드 성공 / check:docs 누락 0건
