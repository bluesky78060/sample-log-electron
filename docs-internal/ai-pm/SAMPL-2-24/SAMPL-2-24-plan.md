# SAMPL-2-24 구현 플랜 — typecheck 실제 게이트

- 선행: `SAMPL-2-24-direction.md`
- 플랜 리뷰: 사용자 지시로 생략 (저위험 — `src/` 런타임 코드 무변경, 설정·테스트 파일만)

## 변경

| # | 파일 | 내용 |
|---|---|---|
| ① | `tsconfig.json` (신규) | `allowJs` + `checkJs: false` + `noEmit`, `strict: true`지만 `noImplicitAny: false`. include에 `src`/`scripts`/`tests`/`types` |
| ② | `types/globals.d.ts` (신규) | `window.*` 전역 선언. 실제 노출 목록(`grep "window.XxxManager ="`)에서 확인한 14개 + 공용 헬퍼 |
| ③ | `tests/e2e/edit-mode.spec.js` | `page.evaluate(([k, v]) => …, [key, rec])` → 객체 인자 `({ k, v }) => …, { k: key, v: rec }` 6곳 |
| ④ | `tests/e2e/soil-group-edit.spec.js` | `querySelector()?.value` → 입력 요소로 좁히는 지역 헬퍼 |
| ⑤ | `.github/workflows/typecheck.yml` (신규) | main push/PR에서 `npm install` → `npm run typecheck` |
| ⑥ | 브랜치 보호 | required status check에 `typecheck` 추가 (PR에서 잡이 한 번 돈 뒤) |

## 순서

1. ① → ② → 오류 수 확인 (25 → 10)
2. ③ → ④ → **오류 0건 확인**
3. 뮤테이션 검증: 의도적 타입 오류 주입 → exit non-zero 확인 → 복원
4. E2E 219건 회귀 (③④가 테스트 파일이므로 필수)
5. ⑤ 커밋 → PR → typecheck 잡 통과 확인
6. 머지 후 ⑥ required check 등록 → 다음 PR부터 강제
7. 코드 리뷰 → approve

## 영향 범위

- 신규: `tsconfig.json`, `types/globals.d.ts`, `.github/workflows/typecheck.yml`
- 수정: `tests/e2e/edit-mode.spec.js`, `tests/e2e/soil-group-edit.spec.js`
- **`src/` 앱 런타임 코드 무변경** → 사용자 영향 없음

## 롤백

`tsconfig.json`을 지우면 이전 상태(위장 통과)로 돌아간다. 테스트 파일 수정은 동작 동일(타입 표현만 변경).
required check 등록은 API로 즉시 해제 가능.
