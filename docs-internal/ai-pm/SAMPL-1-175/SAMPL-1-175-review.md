# SAMPL-1-175 코드 리뷰 — v1.17.10 릴리스

## 담은 것

| 티켓 | 내용 |
| --- | --- |
| SAMPL-1-173 | 토양 목록에서 경지구분 열 감춤 (`allclass-on`·`full-view`에서 복원) |
| SAMPL-1-174 | 전체 보기 토글 시 열 12개가 함께 줄던 것 — 필지 주소 열이 흡수 |

## 변경

- `package.json` 1.17.9 → **1.17.10**
- `src/release/index.html`에 v1.17.10 항목 추가

## 버전 동기화 확인

CLAUDE.md는 "`package.json`만 고치면 `sync-version`이 나머지 4곳을 반영한다"고 적는다.
**믿지 않고 빌드 후 다섯 곳을 모두 확인했다.**

| 위치 | 값 |
| --- | --- |
| `package.json` | `"version": "1.17.10"` ✅ |
| `src/shared/constants.js` | `const APP_VERSION = '1.17.10'` ✅ |
| `src/index.html` | `id="appVersion">v1.17.10` ✅ |
| `src/manual/index.html` | version-badge·footer ✅ |
| `package-lock.json` | `"version": "1.17.10"` ✅ |

## 릴리스 노트 확인

⚠️ 처음 삽입이 **구조를 깨뜨렸다** — 새 항목이 기존 `version-entry` div **안쪽**으로
들어갔다. `git checkout`으로 되돌리고 `<!-- v1.17.9 -->` 주석부터 시작하는 블록 전체를
앵커로 다시 넣었다.

노트는 담당자가 읽는 글이라 **화면에서 실제로 확인했다**(headless 렌더):

| 항목 | 값 |
| --- | --- |
| `version-dot latest` | 1개 ✅ |
| `badge-latest` | 1개 ✅ |
| 첫 항목 | v1.17.10 ✅ |
| 전체 항목 수 | 71개 |

이전 최신(v1.17.9)의 `version-dot latest`·`badge-latest`가 제거되고 `새기능` 배지만 남은 것,
새 항목이 타임라인 맨 위에 놓인 것을 스크린샷으로 눈으로 봤다.

## 검증 결과

| 항목 | 결과 |
| --- | --- |
| `npm run build` | ✅ |
| `npm run typecheck` | ✅ 오류 0 (CI 39s pass) |
| `npm run check:docs` | ✅ 누락 0건 (CI 15s pass) |
| `npm run test:unit` | ✅ 534 passed |
| `npm test` (E2E) | ✅ 462 passed / 4 skipped |

⚠️ **E2E 첫 실행에서 1건이 빨간불이었다** — `sticky-columns.spec.js`(/soil/) "끝까지 가로
스크롤해도 고정 열이 겹치지 않는다". 릴리스를 진행하기 전에 회귀인지 확인했다:

- 단독 실행 **12건 전부 통과**
- 전체 스위트 재실행 **462건 통과**

**플레이키다.** 그 스펙 주석이 이미 기록한 성질이다 — "단독 실행은 통과, 5개 병렬에서는
어긋난 채 멈췄다". 병렬 부하에서 폭 정착이 늦어진다. 이번 변경(버전 문자열·릴리스 노트)은
목록 동작과 무관하므로 회귀일 수 없다는 점도 근거가 된다.

> 초록이 될 때까지 다시 돌리는 것과, **왜 빨간불이었는지 설명한 뒤 다시 돌리는 것**은 다르다.
> 후자만 기록으로 남길 값이 있다.

## 판정

```text
🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 0건 / 🔵 SUGGESTION: 0건
→ 판정: APPROVED
```

릴리스 절차(버전·노트·빌드·CI·태그)만 담은 변경이며 코드 로직 변경이 없다.
담은 두 티켓은 각각 code-reviewer 2라운드 + codex 독립 리뷰 + 변이 검증을 이미 통과했다
(`SAMPL-1-173-review.md`, `SAMPL-1-174-review.md`).
