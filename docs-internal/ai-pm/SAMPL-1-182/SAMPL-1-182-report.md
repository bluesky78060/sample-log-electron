# SAMPL-1-182 후속 정리 보고서

기준: origin/main 5b2f863 (v1.17.13). 브랜치 bluesky78060/sampl-1-182-followup.

## 항목별 결과

| # | 항목 | 결과 |
| - | ---- | ---- |
| 1 | 경고줄 폭주 | 수정함. 모호 번호를 종류별(여러 경지구분 / 같은 경지구분 N건)로 모아 경고 한 줄. 행별 사유는 미매칭 목록·CSV에만 남음. 저장·매칭 동작 불변 |
| 2 | 사유 문구 | 수정함. 「토양 목록에서 경지구분 탭을 고르고 행을 선택한 뒤 흙토람을 여세요」. 옛 문구를 단정하던 기존 테스트는 없었음 |
| 3 | CSV 헤더 패딩 | **재현됨**. 헤더 `시료번호\tpH`, 데이터 `5\t6.5\t메모`일 때 CSV 첫 줄이 `_원본행번호,시료번호,pH,_사유`(열3 없음)로 나와 `_사유` 제목이 사유 값보다 한 칸 앞. 헤더를 max(헤더 길이, maxCol)까지 채워 수정 |
| 4a | `heuktoram-script.js` 폴백 | 수정함. `window.ReceptionNumber.DEFAULT_LAND_CLASS` 사용 + trim 후 폴백(내보내기와 같은 기준). `heuktoram-entry.js`에 `reception-number.js` import 추가(script보다 먼저). 공백뿐인 landClass1이 누락과 같은 그룹으로 묶임(동작 변경, 테스트로 고정) |
| 4b | `reception-group.js` 폴백 | **의도적으로 건드리지 않음.** `reception-number.js`는 `window.ReceptionNumber = ...`를 가드 없이 대입하고 `module.exports`가 없어 node에서 require할 수 없다. `tests/unit/reception-group.test.js`는 reception-group.js만 import하므로 단일 출처를 읽게 하면 그 테스트가 깨지고, 폴백을 남기면 복제가 그대로다. 로딩 순서(soil-entry.js에서 reception-number가 먼저)는 문제 없음 — 막힌 것은 단위 테스트 쪽 |
| 5a | `findRelatedLogs(logs, targetLog)` | 수정함. 호출부는 soil-script.js 1곳 + 단위 테스트(reception-group.test.js). 동작 불변 |
| 5b | `isSameGroup` | 사용처 grep 결과 운영 0건, 테스트만. **주석으로 "경지구분 미비교"를 명시**(더 작은 변경). 인자가 번호 문자열이라 경지구분 비교를 넣으려면 시그니처와 테스트 호출 5곳을 바꿔야 한다 |
| 7 | ExcelImportManager 단위 테스트 | 추가함 (`tests/unit/excel-import-number-scope.test.js`, 4건) |

## 변이 검증

| 변이 | 실패한 테스트 |
| ---- | ------------- |
| M1 경고 합치기 되돌림(행마다 push) | e2e 「모호 번호 120개…」, 「모호 사유 종류별…」 |
| M2 사유 문구 되돌림 | e2e 「모호 사유 종류별…」 (문구 단정) |
| M3 CSV 헤더 패딩 되돌림 | e2e 「미매칭 CSV…」 — Expected `…,pH,열3,_사유` / Received `…,pH,_사유` |
| M4 trim 되돌림(`log.landClass1 \|\| 기본값`) | e2e 「syncToSiblings: 공백뿐인 landClass1…」 |
| M5 findRelatedLogs가 기준 경지구분을 무시 | unit 「findRelatedLogs: 공익직불제 5 → 공익직불제 일반 그룹만」 |
| MA `_scoped`가 필터 없을 때도 농가의뢰로 거름 | unit 「필터 없음: …중복으로 잡힌다」, 「필터 없음: 자동 부여…」 2건 |

M1~M4는 소스를 되돌린 뒤 `npm run build`로 docs/를 다시 만들어 실행했고, 끝나고 소스와 docs/를 수정본으로 복구했다.
M5·MA는 unit 단독 실행. 항목 5a의 호출부 누락(soil-script.js가 log를 안 넘기는 경우)은 별도 변이를 돌리지 않았다 — 시그니처상 인자 누락이 불가능해진 것이 이 항목의 목적이다.

## 실행한 명령과 수치

- `npm run build`: 통과
- `npm run typecheck`: 오류 0 (출력 없음)
- `npm run check:docs`: HTML 15개, 참조 143건, 누락 0
- `npm run test:unit`: 22 files, 542 tests 통과 (수정 전 기준선은 따로 재지 않음)
- `npx playwright test tests/e2e/heuktoram-import-landclass.spec.js tests/e2e/heuktoram-preview-table.spec.js`: 16 통과
- `npx playwright test` 전체, 수정 전(origin/main docs): 481 통과 / 1 실패 / 4 skip. 실패는 `sticky-columns.spec.js:129 (/soil/) 끝까지 가로 스크롤해도 고정 열이 겹치지 않는다`
- 수정 후: 486 통과 / 0 실패 / 4 skip (신규 e2e 4건 포함). 신규 실패 0. 기준선의 sticky-columns 실패는 수정 후 통과했다 — 수정과 무관한 비결정 실패로 보이나 원인은 조사하지 않았다.

## docs/ 커밋 범위 (중요)

origin/main의 docs/ 번들은 **lock과 다른 의존성으로 빌드돼 있다**(번들 안 firebase SDK 버전이 12.6.0, lock은 12.17.1; 메인 체크아웃 node_modules는 firebase 12.7.0·vite 5.4.11). node_modules가 lock과 일치하는데도(package-lock 전 항목 대조, 불일치 0) 소스 변경 없이 `npm run build`만 해도 docs/ 번들 29개 파일이 바뀐다. 전부 커밋하면 무관한 페이지의 번들까지 재생성되므로,
**이번에 바뀐 두 페이지(soil, heuktoram)와 그 의존 청크만** 새 빌드에서 가져왔다:
`docs/soil/index.html`, `docs/heuktoram/index.html`, 새 `soil-*.js`·`heuktoram-*.js`·`reception-number-*.js`·`logger-*.js`·`firestore-db-*.js`, 그리고 참조가 끊긴 옛 `soil-*.js`·`heuktoram-*.js` 삭제.
다른 페이지는 옛 청크(theme-*, firestore-db-BQbEXcjV 등)를 그대로 쓰므로 한 페이지가 두 버전을 동시에 싣지는 않는다(import 그래프로 확인). `check:docs` 통과, e2e 전체 통과.
빌드가 `src/manual/index.html`의 월 표기를 「10월」로 바꿔 놓아(sync-version의 날짜 의존) 되돌렸다.
다음 담당자가 lock대로 전체 빌드하면 나머지 페이지 번들이 한꺼번에 바뀐다 — 별도 정리 티켓 후보.

## 건드리지 않은 것

- 6번, 8번, 9번, 흙토람 내보내기 J열: 범위 밖. 9번 보완 내용: 이번 작업에서 다루지 않았다(티켓 본문 참조).
- soil-script.js·soil-result-importer.js·sync-utils.js·heuktoram-script.js:1582의 기존 복제, package.json, package-lock.json, 릴리스 노트, 테스트 프로젝트.
- 주의: 이 worktree의 `package-lock.json`이 처음부터 수정 상태(peer 플래그 제거 등)여서 `git checkout`으로 되돌렸다.
