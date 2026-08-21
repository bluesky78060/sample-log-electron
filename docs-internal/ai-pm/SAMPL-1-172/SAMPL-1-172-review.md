# SAMPL-1-172 코드 리뷰 — 붙여넣기 가져오기 배치 저장

🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 0건 / 🔵 SUGGESTION: 0건
→ 판정: APPROVED

## 측정이 먼저였다

담당자 요청으로 **고칠 값어치가 있는지부터 쟀다.**

| 행 수 | 수정 전 | 행당 | 저장 호출 | localStorage 누적 쓰기 |
| --- | --- | --- | --- | --- |
| 200 | 0.68초 | 3.4ms | 200 | 15 MB |
| 400 | 1.74초 | 4.4ms | 400 | 60 MB |
| 800 | 4.50초 | 5.6ms | 800 | 240 MB |
| **1,200** | **8.75초** | 7.3ms | 1,200 | **540 MB** |

행 6배에 시간 12.9배 — 초선형이다. 실제 데이터는 1MB 남짓인데 **540MB를 썼다.**

| | 수정 후 (1,200행) |
| --- | --- |
| 소요 | **12.6ms** |
| 저장 호출 | **1** |
| localStorage 쓰기 | **0.9 MB** |

### 측정에서 한 번 틀렸다

`localStorage.clear()`만 하고 쟀더니 매니저가 이미 메모리로 읽어 둔 배열이 남아
회차마다 기준선이 커졌다(저장건수 50 → 150 → 350 → 750). 그 상태로는 **O(n²)인지
기준선 증가인지 구별할 수 없다.** `mgr.sampleLogs = []`까지 비우고 다시 쟀다.

## 범위를 좁혔다 — 티켓의 내 서술이 틀렸다

티켓에 "5개 시료 타입이 모두 같은 구조"라고 썼는데 **확인해 보니 아니었다.**
공통 `ExcelImportManager`의 `onImportComplete`는 **이미 배치**다
(forEach push → `saveLogs()` 1회 → `filterAndRenderLogs()` 1회).

문제는 **토양 붙여넣기 경로 하나**였다 — `soil-result-importer.js`의 `_commit`이
행마다 `addImportedRecord`를 부른다.

## 원인

`persistRecords` → `saveLogs()`는 **배열 전체**를 `JSON.stringify`해 localStorage에
쓰고, **전체를 Firestore에 `batchSave`**한다. 행마다 부르면 배열이 커질수록
한 행당 비용도 같이 커진다.

⚠️ 티켓에는 "Firestore 개별 쓰기"라고 적었으나 실제로는 **전체 batchSave**다 —
적은 것보다 나쁘다.

## 수정

- `addImportedRecord(record, { defer })` — `defer`면 push만 하고 저장·재렌더를 미룬다.
  기본값이 비활성이라 기존 단건 호출부는 그대로다.
- `addImportedRecords(records)` — 루프를 돌고 **끝에 한 번만** 저장·재렌더한다.
  한 건이 실패해도 나머지는 저장한다 — 대량 입력에서 한 줄 때문에 전부 잃는 것이
  담당자에게 최악이다.
- 한 건도 못 넣었으면 저장하지 않는다. 빈 저장은 아무것도 바꾸지 않으면서
  Firestore 전체 동기화를 한 번 더 일으킨다.

**채번은 그대로다.** `addImportedRecord`가 `push`를 먼저 하므로 배치 안에서도
다음 레코드가 앞 레코드를 본다 — 성토 F 접두, 하위필지·분할 `groupId`,
SAMPL-1-170의 중복 검사가 모두 유지된다(독립 리뷰 확인).

## 테스트 — 시간을 재지 않는다

성능 수치를 단정하면 기계 성능에 따라 흔들려 "가끔 실패하는 테스트"가 된다.
대신 **원인인 호출 횟수**를 단정했다 — 그것이 1이면 O(n²)가 구조적으로 불가능하다.

| 변이 | 검출 |
| --- | --- |
| A. 배치 경로 제거 | 호출 횟수 시험 |
| B. `defer` 무시 | 호출 횟수 시험 |
| C. 실패 격리 제거 | "한 건 실패해도 나머지 저장" |

## 검증

| 항목 | 결과 |
| --- | --- |
| `npm run build` | ✓ |
| `npm run check:docs` | 누락 0건 |
| `npx tsc -b` | TYPECHECK=0 |
| `npm run test:unit` | 534 passed |
| `npx playwright test` | **452 passed / 4 skipped / 0 failed** |
| 기존 가져오기 스펙 | 29건 전원 통과 (동작 불변 확인) |
| `npm run lint` | **미구성 저장소 — 실행하지 않음** |
| gemini 레인 | **실행하지 못함** — `GOOGLE_CLOUD_PROJECT` 미설정 |

## 재지 않은 것

**Firebase를 켠 상태는 재지 않았다.** 수정 전에는 행마다 전체 batchSave가 나갔으므로
1,200행 = 네트워크 전체 동기화 1,200회였다. 실제 Firestore가 필요해 제외했고,
로컬만으로도 초선형이 확인돼 수정 근거로는 충분했다.
독립 리뷰가 지적한 대로, 최종 `persistRecords` 자체가 실패하면 배치 전체가
저장되지 않는다 — 이번 변경이 만든 회귀는 아니고 저장 API의 기존 구조다.
