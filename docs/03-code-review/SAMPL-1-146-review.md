# SAMPL-1-146 코드리뷰 — v1.17.7 릴리스

- **리뷰어**: `oh-my-claudecode:code-reviewer` (독립 컨텍스트)
- **판정**: **APPROVE** — CRITICAL 0 / HIGH 0 / MEDIUM 1 / LOW 1 (둘 다 비차단)
- **일자**: 2026-07-29

## 게이트

| 항목 | 결과 |
| --- | --- |
| `npx vitest run` | **253 passed** (16 files) |
| `npx playwright test` | **205 passed** (회귀 0) |
| `npm run build` | 성공 |
| lint | 이 저장소는 미설정 |

## 검증 5항목 전부 PASS

### 1. 버전 일치

`package.json`·`constants.js`·`src/index.html`·`src/manual/index.html` 전부 `1.17.7`.
빌드 산출물(`docs/index.html`·`docs/manual`·`docs/release`)도 반영됨.
`build.yml`이 `latest.yml`에 넣을 버전을 `package.json`에서 읽는 것과 일치.

**플랜 리뷰 CRITICAL이 실질적이었다.** 계획 2절이 "확인한다"는 조사 표현이라
편집 지시가 아니었고, 그대로 실행했으면 태그는 v1.17.7인데 `latest.yml`·앱 버전·
설명서가 전부 1.17.6인 채로 서명된 Release가 나갈 뻔했다.

### 2. 릴리스 노트 vs 실제 변경

5개 항목을 `git show 6dcd393`·현재 diff와 1:1 대조 — **과장 없음.**
`numFmt '@'`, 시트명·`*`·안내문·행 높이, 범례 열 34~40 숨김, 검증 `endRow` 확대,
A2 굵은 빨강 + 이번 테두리까지 전부 근거가 있다.

### 3. "최신" 표시

`version-dot latest` 1개, `badge-latest` 1개, 둘 다 v1.17.7에.
v1.17.6은 v1.17.5와 같은 모습으로 강등. 빌드 산출물도 동일
(`badge-latest` 3건은 CSS 정의 2 + 실사용 1).

### 4. A2 테두리가 실제 산출물에 반영됨

빌드된 `docs/assets/heuktoram-C66DSgQr.js`에서
`border:{bottom:{style:"thin",color:{rgb:"FF000000"}}}`를 직접 확인.
**소스가 아니라 minify된 번들에서 확인했다.**

### 5. 배포 직전 점검

`origin/main` 대비 2커밋(`8ea3d37` v1.17.6, `6dcd393` SAMPL-1-145)이 이번에 함께 나간다.
`docs/03-code-review/` 12개 온전(복구 확인). 참조 자산 누락 없음.

**리뷰어가 알려준 사실**: 로컬 `v1.17.6` 태그가 원격에 push된 적이 없다
(`git ls-remote --tags`는 v1.17.5까지). v1.17.7이 대체하므로 무해하지만
**v1.17.6은 자체 설치 파일 빌드를 갖지 못한다.**

## MEDIUM (비차단) — 테스트가 왕복 검증이 아니다

`objectLiteral('cellA2.s')`는 소스 문자열을 파싱해 `eval`할 뿐,
`XLSX.write` → `read` 왕복으로 실제 `.xlsx` 출력을 보지 않는다.
"객체 리터럴이 소스에 있다"만 증명한다.

다만 **이 diff가 만든 패턴이 아니고**(폰트 단언이 이미 같은 방식),
테두리 동작은 형제 저장소 `sample-log-soil`(SLS-1-212, v1.14.2 배포)에서
이미 실측 확인됐다. 후속으로 왕복 검증을 넣을 가치는 있다.

## LOW (범위 밖, 기존)

`buildDataValidations`의 JSDoc이 "현재는 용도구분(F열)만"이라 적혀 있으나
F·G·U 셋 다 반환한 지 오래다. 이 diff가 만든 것이 아니라 후속 대상.

## 리뷰어가 짚은 강점

- 릴리스 노트가 실제 독자(농업기술센터)를 향해 쓰였고 코드 변경과 1:1 추적된다
- A2 테두리에 "A1은 borderId 0이라 우연이 아니다"라는 근거 주석이 있어
  나중에 "정리"하다 지우는 것을 막는다
- "최신" 배지 강등이 dot·badge 양쪽에 일관되게 적용됐다 — 중복 표시는 릴리스
  페이지에서 흔한 혼란 원인이다

## 뮤테이션 (2종 사살)

A2 테두리 제거, 테두리 스타일 `thin` → `medium`.

## 판정

**승인 — 배포 가능.**
