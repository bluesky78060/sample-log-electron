# SAMPL-2-22 Discovery — docs/ 번들 참조 정합성 검사

- 티켓: SAMPL-2-22 (코드 품질 관리 에픽) / 작성일 2026-08-11
- 방향 확정: 사용자 "후속 티켓도 발행해서 같이 수정해줘" (2026-08-11)

## 1. 목표 (Why)

SAMPL-1-147 리뷰 중, **커밋된 `docs/`가 존재하지 않는 번들을 참조하는 상태**가 발견됐다.
GitHub Pages 웹 버전이 스크립트 404로 동작하지 않는 상태였고, 아무도 이를 알아채지 못했다.
목표는 같은 상태가 다시 커밋·배포되는 것을 기계적으로 막는 것이다.

## 2. 근거 (직접 검증)

```bash
$ git show HEAD:docs/water/index.html | grep -o 'assets/[a-z-]*\.js'
assets/water-BjjuMcel.js
assets/tooltip-BSe7NLj2.js

$ git cat-file -e HEAD:docs/assets/water-BjjuMcel.js   # → 없음
$ git cat-file -e HEAD:docs/assets/tooltip-BSe7NLj2.js # → 없음
```

HEAD = `964fd44` (v1.17.7). 5개 시료 페이지 + 분석 페이지 4종 + 공용 `tooltip` 등 총 18건.
Electron 앱은 자체 번들을 쓰므로 영향 없고, **웹 배포만 깨진 상태**였다.

SAMPL-1-147의 재빌드로 현재 워크트리 `docs/`는 참조 26건 전부 정상(직접 확인).
따라서 이 티켓의 산출물은 **수정이 아니라 재발 방지 장치**다.

## 3. 원인

`docs/`는 Vite `emptyOutDir` 산출물이다(`vite.config.js`). 빌드 없이 `src/`만 수정하고 커밋하거나,
빌드 산출물 일부만 스테이징하면 `index.html`의 해시 참조와 실제 `assets/` 파일이 어긋난다.
해시 파일명이라 어긋나도 로컬 Electron 실행에서는 드러나지 않는다.

## 4. 범위 (What)

- `docs/**/*.html`이 참조하는 `assets/*.js`·`*.css`가 실제로 존재하는지 검사하는 스크립트
- 실패 시 어긋난 참조를 파일별로 출력하고 비정상 종료
- 기존 `.githooks` 인프라(`package.json`의 `core.hooksPath .githooks`)에 연결

## 5. 제약

- 프로젝트에 별도 lint 인프라가 없다(`npm run lint`는 스텁) → 의존성 추가 없이 node 기본 API로 구현
- pre-push에서 항상 빌드를 강제하면 개발 흐름이 느려진다 → 검사만 하고 빌드는 강제하지 않는다
- 검사 대상은 커밋된 `docs/`가 아니라 워킹트리 `docs/`로 한다(pre-push 시점에 스테이징 상태 반영)

## 6. 리스크

- 정상 상황에서 오탐이 나면 push가 막혀 개발을 방해한다 → 참조 추출 정규식을 보수적으로,
  외부 URL(`http`)·데이터 URI는 제외한다.
- `docs/`에 빌드 산출물이 아닌 문서(`00-discovery` 등)가 섞여 있다 → HTML만 검사하고 md는 무시한다.

## 7. 검증

- 현재 `docs/`에서 통과(참조 26건, 누락 0건)
- 일부러 번들 파일명을 바꿔 실패를 유발했을 때 정확히 그 파일을 지적하는지 확인
- `git show HEAD:docs/`(깨진 상태)를 임시 디렉터리에 풀어 실패 재현
