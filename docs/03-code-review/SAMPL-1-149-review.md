# SAMPL-1-149 릴리스 사후 리뷰 (v1.17.8)

- 리뷰어: code-reviewer 에이전트 (Opus, 독립 레인)
- 대상: `4ab7377` (release: v1.17.8) — 이미 `origin/main` 푸시 + 태그 배포 완료 상태
- 판정: **APPROVED** (CRITICAL 0 / MAJOR 0 / MINOR 4 / SUGGESTION 6) — **롤백 사유 없음**

## 배포 실측 검증

| 항목 | 결과 |
|---|---|
| 웹 버전 스크립트 (상용 URL 직접 호출) | 5개 시료 페이지 전부 **HTTP 200** (직전까지 404) |
| `Check docs assets` (신규 CI) | success |
| `pages build and deployment` | success |
| `Build and Release` | success |
| 릴리스 자산 | `sample-log-setup.exe`, `sample-log-1.17.8-full.nupkg`, `latest.yml`, `RELEASES` |
| 배포된 `latest.yml` | `version: 1.17.8` |
| 공용 청크 `tooltip-BCT0FCN6.js` | `APP_VERSION` 런타임 반영 확인 |
| `docs/assets`의 `1.17.7` 잔존 | **0건** |

리뷰어가 두 커밋의 트리를 각각 추출해 검사: `b6952ce` 참조 148건 누락 0건, `4ab7377` 참조 148건 누락 0건
→ Pages가 중간 커밋을 단독 노출해도 안전한 상태였다. v1.17.7의 재발 조건(부분 갱신된 `docs/`)은 없다.

## 릴리스 규칙 준수

- 버전: `package.json` / `constants.js`(sync-version 자동) / `index.html` / `manual/index.html` 전부 `1.17.8`
- `src/release/index.html` ↔ `docs/release/index.html` **바이트 단위 동일**
- `version-dot latest`·`badge-latest` 각 **1회**(v1.17.8)로 정확히 이전, v1.17.7은 정상 강등
- HTML 무결: `<div>` 개폐 557:557, `version-entry`·`version-number` 각 69개
- 문구: 내부 용어(`isEditing`/`groupId`/`String()`) 노출 0건, 기존 항목 톤과 일관

## 지적 사항

### 🟡 MINOR-1 — `package-lock.json`의 version이 `1.17.7`로 남음 (작성자 실수)

`npm ci`가 실패해 `npm install`을 쓴 뒤, 무관한 의존성 버전 상승(esbuild 0.28.0→0.28.2 등 78줄)을
제외하려고 `git checkout -- package-lock.json`으로 되돌렸다. 그때 **`version` 필드까지 1.17.7로 되돌아간 것을 놓쳤다.**

- 배포 파손 없음: `build.yml`은 `npm ci`가 아니라 `npm install`을 쓰고, `latest.yml` 버전은 `package.json`에서 나온다(실제 배포본 1.17.8 확인)
- 다만 v1.17.7 릴리스(36acadb)에서도 같은 누락이 있었던 **반복 패턴**이고, 향후 `npm ci` 도입 시 실패 지점
- Fix: `scripts/sync-version.js`에 `version`·`packages[""].version` 갱신 추가

### 🟡 MINOR-4 — 릴리스 커밋에 E2E 스크린샷 부산물 PNG 7건 포함 (작성자 실수)

근인: `tests/e2e/screenshots.spec.js:5`가 **빌드 산출물 디렉터리에 직접 쓴다.**

```javascript
const screenshotDir = path.join(__dirname, '../../docs/manual/images');
```

전체 E2E를 여러 번 돌린 흔적(`521672 → 521901` 같은 미세 증분)이 커밋에 쓸려 들어갔다.

리뷰어가 확인한 사실:
1. **완전한 고아 파일** — `docs/manual/index.html`은 Vite가 재작성한 `../assets/01-main-*.png`를 참조한다.
   `docs/manual/images/` 9개(~1.8MB)를 참조하는 HTML은 저장소 전체에 **0건**
2. **CLAUDE.md "docs/ 직접 수정 금지, 빌드로만 갱신" 위반** — 빌드가 만든 것도, `src/manual/images/` 사본도 아니다
3. **`emptyOutDir: true`와 충돌** — 다음 빌드가 지우므로 다음 릴리스에 영문 모를 삭제 diff가 뜬다
4. **부수 효과**: 정작 설명서가 보여주는 스크린샷은 v1.14.0(a9c6041) 것이다. 캡처 스위트가 있는데도
   결과가 참조되지 않는 `docs/`로 흘러가 버려진다

v1.16.0 · v1.16.1 · v1.16.3 · v1.17.8에서 반복된 패턴.
Fix: `screenshotDir`을 `src/manual/images`로 이전(그러면 빌드가 해시 자산으로 반영 → 설명서도 자동 최신화) + `docs/manual/images/` 삭제

### 🟡 MINOR-2 — CLAUDE.md의 버전 위치 기술이 실제와 다름

`sync-version.js`는 `constants.js` + `src/index.html` + `src/manual/index.html` **3곳을 자동** 갱신한다.
CLAUDE.md는 `src/index.html`을 "수동, 폴백용"이라 하고 `manual/index.html`은 언급하지 않는다.

### 🟡 MINOR-3 — 릴리즈 노트 문구

- 항목 1·2가 포함관계라 같은 사고를 두 번 읽게 된다
- "원인 **네 가지를** 모두" — 원인 개수는 내부 관점
- "**배포 전** 자동 점검" — 담당자 업무가 아니라 문장이 붕 뜬다
- 제목이 웹 버전 복구를 포괄하지 못한다 → 웹만 쓰는 담당자는 자기 문제가 고쳐졌는지 알 수 없다

## 테스트 프로젝트 제외 판단 — 타당 (리뷰어 확인)

- 테스트 프로젝트 현재 버전 **1.10.0**, 릴리즈 노트 최신 항목 **v1.7.75**, 이미 TypeScript 분기
- 메인이 1.17.8인데 테스트가 1.10.0 → "동기화"가 아니라 **독립 포팅 프로젝트**
- 릴리스 커밋에 끼우면 오히려 원자성이 깨진다

## 후속 권고 (SUGGESTION)

1. CLAUDE.md의 "테스트 프로젝트 동기화 필수"는 1.10.0 이후 모든 릴리스가 위반한 **사문 규칙** → 명문화 정정
2. GitHub Release 본문이 비어 있다 → `src/release/index.html` 항목을 `--notes`로 전달
3. `docs/00-discovery`·`01-plan`·`02-review`·`03-code-review`를 `docs/` 밖으로 — `emptyOutDir`가 매 빌드마다 지워
   손으로 복원해야 하고, `docs-internal/ai-pm/`에 **바이트 동일 사본이 이미 있다**(순수 부채)
4. `docs/.nojekyll` 없음 — Vite가 `_` 접두 청크를 뱉는 순간 Jekyll이 조용히 누락시켜 **SAMPL-2-22와 같은 404 재발**.
   `check-docs-assets.js`는 트리 존재만 보므로 이 실패 모드를 잡지 못한다
5. `Check docs assets`를 required status check로 승격 (현재 유일한 차단선은 로컬 훅)
6. pre-push 훅이 tip 커밋만 검사 → `git rev-list remote_sha..local_sha`로 각 커밋 순회

## 리뷰어가 평가한 강점

- 재발 방지 장치가 사고 원인(부분 갱신된 `docs/`)에 정확히 겨눠졌고, **워킹트리가 아니라 푸시되는 커밋 트리**를 검사한다
- 검사 스크립트의 비범위 선언이 모범적 — "빌드를 강제하면 오탐이 폭발해 훅이 무력화된다"는 절제 판단
- exit code 1/2 분리로 `--no-verify` 상습화 경로를 사전 차단 (실패하는 방향까지 설계)
- CI 워크플로가 자기 한계("게이트가 아니라 사후 경보기")와 승격 조건을 문서화
- 릴리즈 노트가 내부 개념을 담당자 체감으로 번역 (특히 "가짜 성공"을 실제 화면 경험으로 풀어낸 부분)
