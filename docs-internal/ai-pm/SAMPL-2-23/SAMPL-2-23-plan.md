# SAMPL-2-23 구현 플랜 — 릴리스 파이프라인 위생 정리

- 선행: `SAMPL-2-23-direction.md`
- 플랜 리뷰: 사용자 지시로 생략 (저위험 위생 작업, 앱 런타임 로직 무변경)

## 변경 ① — `sync-version.js`에 `package-lock.json` 추가

`scripts/sync-version.js`에 네 번째 대상 추가:
- `version` (루트)
- `packages[""].version`

정규식 치환이 아니라 `JSON.parse` → 필드 갱신 → `JSON.stringify(obj, null, 2)`로 처리한다.
lock 파일은 수만 줄이라 정규식이 다른 패키지의 `"version"`을 잘못 건드릴 위험이 있다.
들여쓰기 2칸 + 끝 개행을 보존해 diff를 최소화한다.

## 변경 ② — 스크린샷 출력 경로 이전

`tests/e2e/screenshots.spec.js:5`
```js
const screenshotDir = path.join(__dirname, '../../src/manual/images');
```

+ `docs/manual/images/` 고아 파일 삭제 (어떤 HTML도 참조하지 않음, ~1.8MB).
`docs/`는 빌드 산출물이므로 소스에서 지우는 것이 아니라 디렉터리 자체를 제거한다.

주의: `src/manual/index.html`이 `images/*.png`를 상대 경로로 참조하는지 확인하고,
참조 형태에 따라 Vite가 해시 자산으로 재작성하는지 검증한다.

## 변경 ③ — `docs/.nojekyll`

빈 파일 생성. `emptyOutDir`는 dotfile을 지우지 않으므로 빌드 후에도 생존한다(검증 항목).
`src/`에 두면 Vite가 복사하지 않을 수 있어 `docs/`에 직접 만들고 커밋한다.
이 파일은 빌드 산출물이 아니라 배포 설정이므로 "docs/ 직접 수정 금지" 예외에 해당한다 — 주석 대신 커밋 메시지로 근거를 남긴다.

## 변경 ④ — 빌드 후 워크플로우 문서 자동 복원

`scripts/restore-ai-pm-docs.js` 신규:
- `docs-internal/ai-pm/*/` 의 `*-direction.md` → `docs/00-discovery/`
- `*-plan.md` → `docs/01-plan/`
- `*-plan-review.md` → `docs/02-review/`
- `*-review.md` → `docs/03-code-review/`
- 대상 디렉터리가 없으면 생성. 원본이 없으면 조용히 통과(신규 클론 등).

`package.json`의 `build` 스크립트 끝에 연결한다.
글로벌 훅이 `docs/` 경로를 요구하므로 사본은 유지하되 손 복원을 없앤다(direction ④ 참조).

`docs/03-code-review/`에는 git이 추적하는 과거 리뷰 문서 14건이 있다.
복원 스크립트는 `docs-internal/`에 원본이 있는 것만 덮어쓰고 나머지는 건드리지 않는다
(과거 문서는 `docs-internal/`에 없으므로 git 추적본이 그대로 남는다 → 빌드가 지운 뒤 `git checkout`으로 복구해야 한다).
→ 복원 스크립트가 `git checkout -- docs/03-code-review/`까지 수행하면 부작용이 크므로,
과거 14건은 **이번에 `docs-internal/ai-pm/legacy/`로 이관**해 복원 대상에 포함시킨다.

## 변경 ⑤ — CLAUDE.md 정정

- "버전 관리 3곳: package.json / constants.js(자동) / src/index.html(수동, 폴백용)"
  → 실제로는 `sync-version`이 `constants.js` + `src/index.html` + `src/manual/index.html` 3곳을 자동 갱신,
    `package-lock.json`은 변경 ①로 추가됨을 명시
- "태그 시 src/release/index.html에 새 버전 항목 추가 필수 (docs/ + 테스트 프로젝트 동기화)"
  → 테스트 프로젝트는 1.10.0에서 TS로 분기된 독립 코드베이스이므로 릴리스 동기화 대상이 아님을 명시.
    포팅은 별도 티켓(선례 SAMPL-1-77, 진행 중 SAMPL-1-124)

## 변경 ⑥ — GitHub Release 본문

`.github/workflows/build.yml`의 release 스텝에 본문을 전달한다.
`src/release/index.html`에서 최신 항목을 텍스트로 뽑는 것은 HTML 파싱이 필요해 과하다.
→ 태그 메시지(`git tag -a`로 이미 사용자 관점 요약을 넣고 있다)를 본문으로 쓰는 방식이 가장 단순하다.
`softprops/action-gh-release`류를 쓰는지 확인하고, `body` 또는 `generate_release_notes` 옵션으로 처리한다.

## 순서

1. ① → 검증(`npm run sync-version` 후 lock 확인)
2. ② → 스크린샷 스펙 실행해 출력 위치 확인, 고아 삭제
3. ③ → 빌드 후 생존 확인
4. ④ → 과거 리뷰 14건 이관 + 스크립트 작성 + `build` 연결, 빌드 단독 실행으로 복원 확인
5. ⑤ ⑥ → 문서/워크플로 수정 (⑥은 문법 확인까지, 동작은 다음 릴리스에서 검증)
6. `npm run test:unit`, `npm test`, `npm run check:docs`
7. 코드 리뷰 → approve

## 영향 범위

- `scripts/sync-version.js`, `scripts/restore-ai-pm-docs.js`(신규), `package.json`
- `tests/e2e/screenshots.spec.js`
- `docs/.nojekyll`(신규), `docs/manual/images/`(삭제), `docs/00~03`(복원 자동화)
- `CLAUDE.md`, `.github/workflows/build.yml`
- **`src/` 앱 코드 무변경** → 런타임 회귀 위험 없음

## 롤백

각 항목이 독립적이다. 문제 시 해당 파일만 되돌리면 된다.
가장 위험한 것은 ④의 과거 문서 이관(파일 이동)이므로 이 부분만 별도 커밋으로 분리한다.
