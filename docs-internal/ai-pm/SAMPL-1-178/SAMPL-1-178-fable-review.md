# SAMPL-1-178 — 둘째 레인(Fable) 독립 검증

- 대상: 커밋 `b4859cb` (부모 origin/main `1cdb4d5`), 브랜치 `bluesky78060/sampl-1-178-landclass-fix`
- 방식: 반증 목표. 같은 패턴(본번 접기 비교가 경지구분·성토·하위필지 중 하나를 빠뜨림)이 남은 경로를 전수 조사하고, 가설은 재현 테스트로 먼저 실패를 보인 뒤 고쳤다. 재현되지 않은 것은 고치지 않았다.
- 표기: **실행 확인** = 테스트로 실행. **코드로만** = 읽어서 판단, 실행하지 않음.

## 판정 요약

| # | 심각도 | 항목 | 재현 | 처리 |
|---|--------|------|------|------|
| 0 | 🟠 MAJOR (수정됨) | 흙토람 결과 가져오기(`heuktoram-result-importer.js`)의 `keyMap`이 번호당 행 하나만 담아, 경지구분이 다른 같은 번호가 있으면 **저장 순서에 따라 남의 시료에** 분석값이 들어감. 경고 없음 (코디네이터 가설) | **실행 확인** — 두 순서 모두 재현 | 수정 + E2E 2건 |
| 1 | 🟡 MINOR (수정됨) | 토양 공통 엑셀 가져오기(`ExcelImportManager`)의 중복 판정·자동채번이 경지구분을 무시 | **실행 확인** — E2E 3건 실패 | 수정 + 테스트 4건 |
| 2 | 🔵 SUGGESTION (수정됨) | 일괄 완료(M1b)에 E2E가 없어 화면 배선은 단위 테스트에만 의존 | — (결함 아님) | E2E 1건 추가, 변이 M1b가 이 테스트를 죽이는 것 확인 |
| 3 | 🔵 SUGGESTION (보고만) | `deleteSample`의 재입력 편의 prefill(`soil-script.js:704-712`)이 경지구분을 안 봄 | 코드로만 | 표시 편의뿐이라 안 고침 |
| 4 | 🔵 SUGGESTION (보고만) | 성토 판정 기준이 두 가지(F 접두 vs `subCategory==='성토'`) | 코드로만 | 이 커밋 이전부터, importer 경고가 막고 있음 |

b4859cb의 세 수정 자체에서는 결함을 찾지 못했다.

## 1. 전수 조사 — 본번 접기 비교가 남은 경로

`split('-')[0]`·`replace(/-\d+$/)`·`parseReceptionGroup`·`baseNumber`를 `src/soil`·`src/heuktoram`·`src/shared`·`src/label-print`에서 전부 찾아 하나씩 봤다.

| 경로 | 위치 | 경지구분 | 성토 | 판정 |
|------|------|----------|------|------|
| 완료 버튼 | `reception-group.js findRelatedLogs` | ✅ (b4859cb) | ✅ F 접두 | 정상 |
| 일괄 완료 | `reception-group.js computeBulkTargetIds` | ✅ (b4859cb) | ✅ | 정상 (E2E 추가, #2) |
| 흙토람 형제 동기화 | `heuktoram-script.js syncToSiblings` | ✅ (b4859cb) | ✅ base에 F 잔존 | 정상 |
| 채번 | `reception-number.js computeNextNumber` | ✅ | ✅ `subCategory` | 정상 |
| 폼 등록·수정 중복 판정 | `soil-script.js findDuplicateReceptionNumbers` | ✅ | 표기 그대로 비교 | 정상 |
| 붙여넣기 가져오기 | `soil-result-importer.js collectExistingNumbers/collectLiteralNumbers` | ✅ | ✅ | 정상 |
| **공통 엑셀 가져오기** | `excel-import-manager.js _existingNumberSet/_fillBlankReceptionNumbers/_autoAssignReceptionNumbers` | **❌** | 표기 그대로 | **#1 수정** |
| 삭제 | `soil-script.js:4461-4489` | `groupId` 기준 | — | 접수번호 비교 없음 |
| 삭제 후 prefill | `soil-script.js:704-712` | ❌ | 문자열 비교라 구분됨 | #3 보고만 |
| 그룹 수정 폼 채움 | `soil-script.js:2835` | 표시용 | — | 비교 아님 |
| 흙토람 내보내기 | `heuktoram-script.js:1592,1966` | 행마다 `log.landClass1` 출력 | — | `baseReceptionNumber`는 표시용, 검정값 키는 `log.id` |
| 분석결과 저장·조회 | `heuktoram testResults[`${log.id}_…`]` | 레코드 단위 키 | — | 레코드 간 전파는 `syncToSiblings`뿐 |
| **흙토람 결과 가져오기** | `heuktoram-result-importer.js _recomputePreview keyMap` | **❌** 시료번호만 | 표기 그대로 | **#0 수정**. 내 첫 전수조사가 놓쳤다 — `split`·`replace`가 아니라 `Map.set` 덮어쓰기라 grep 패턴에 안 걸렸다. 코디네이터 가설로 잡혔다 |
| 통계 | `soil-script.js getStatistics byLandClass` | 경지구분별 집계 | — | 비교 아님 |
| 라벨 인쇄 | `src/label-print/*.js` | 접수번호 그룹핑 없음 | — | 해당 없음 |
| 하위필지 배정 | `SubLotIdentity.migrateParcels` | 필지 단위 | — | 접수번호 비교 없음 |
| 클라우드 충돌 감지 | `sync-utils.js:187` | ✅ `landClass1/receptionNumber` 키 | — | 정상 |

### #0 🟠 흙토람 결과 가져오기가 같은 번호의 다른 경지구분 시료에 저장 (실행 확인 → 수정)

흙토람 화면에는 경지구분 필터가 없다. 연도 전체(또는 토양 목록의 '전체 경지구분' 탭에서 고른 것)를 열면 '농가의뢰 5'와 '공익직불제 5'가 같은 표에 오른다. `_recomputePreview`의 `keyMap`은 `Map<시료번호, 행>`이라 두 번째 행이 첫 행을 덮고, 붙여넣은 `5`의 값은 **저장 순서상 마지막 시료**에 들어갔다. 미매칭 표시도 경고도 없었다. `syncToSiblings`(b4859cb가 고친 것)와 같은 결과 — 남의 농가 분석값 오염 — 를 다른 입구가 만든다.

**재현** (수정 전 docs, `tests/e2e/heuktoram-import-landclass.spec.js` 신규, 붙여넣기 `시료번호\tpH\n5\t6.5\n7\t7.1`):

| 저장 순서 | 결과(수정 전) |
|-----------|---------------|
| [농가의뢰 5(a), 공익직불제 5(b), 농가의뢰 7(c)] | `b: "6.5"` — 공익직불제 5에 저장 |
| [b, a, c] | `a: "6.5"` — 농가의뢰 5에 저장 |
| 유일 번호 7 (양성 대조) | `c: "7.1"` 정상 |

**수정** — `src/heuktoram/heuktoram-result-importer.js`

- `keyMap`을 `Map<번호, 행[]>`로. 후보가 정확히 1건일 때만 매칭한다.
- 2건 이상이면 미매칭으로 보내고 사유를 붙인다: 경지구분이 다르면 「시료번호 5가 여러 경지구분에 있음(농가의뢰, 공익직불제) — 경지구분을 골라 가져오세요」, 같으면 「같은 경지구분(농가의뢰)에 2건 있음 — 접수번호를 확인하세요」(진짜 중복 번호). 사유는 미리보기 목록의 미매칭 줄, 요약 경고줄, 미매칭 CSV의 `_사유` 열에 나온다.
- 한 레코드는 non-subLot 행을 최대 1개만 내므로(`buildFlatRows`: 첫 행만 `isSubLot=false`) 후보 2건 = 레코드 2건이다. 같은 레코드가 둘로 세이지는 않는다.
- 저장 로직(`_commit`)은 안 건드렸다. 매칭이 안 되면 `matched`에 없어 저장되지 않는다.

「경지구분을 골라」는 토양 목록에서 경지구분 탭을 고르고 행을 선택해 흙토람으로 넘기는(`preSelectedLogIds`) 기존 흐름을 가리킨다. 흙토람 화면에 경지구분 필터를 새로 두는 것은 기능 추가라 하지 않았다.

### #1 🟡 토양 공통 엑셀 가져오기가 경지구분을 무시 (실행 확인 → 수정)

토양의 엑셀 가져오기 서식에는 경지구분 열이 없어 가져온 행은 전부 농가의뢰다(`buildRecord`가 `landClass1`을 안 넣고 로드 마이그레이션이 `농가의뢰`로 채움). 그런데 `ExcelImportManager`는 기존 레코드를 **경지구분과 무관하게** 모아 (a) 시트 번호의 중복을 판정하고 (b) 자동채번의 최대값을 구했다. 폼·붙여넣기 가져오기는 경지구분 범위로 보므로 **같은 번호가 경로마다 다르게 판정**됐다.

**재현** (수정 전 docs, `tests/e2e/soil-excel-import-landclass.spec.js` 신규):

| 시나리오 | 결과(수정 전) |
|----------|---------------|
| 로컬에 공익직불제 5만 있고 시트가 5 | 「이미 쓰이고 있습니다」로 **차단** (모달 `class="modal"` 유지) |
| 클라우드에 공익직불제 5만 있고 시트가 5 | 같은 차단 |
| 농가의뢰 1·2, 공익직불제 30, 성토 F40이 있고 시트 번호 빈칸 2행 | `1,2,31,32,F40` — 공익직불제 30 위로 건너뜀 (기대 3·4) |
| 로컬에 농가의뢰 5가 있고 시트가 5 (음성 대조) | 차단 — 수정 전·후 모두 통과 |

데이터 오염은 아니다(막거나 번호를 건너뛸 뿐). 그래서 MINOR. 다만 담당자는 「5번이 이미 있다」는 메시지를 보고 목록을 뒤져도 농가의뢰 5를 찾지 못한다.

**수정**

- `src/shared/excel-import-manager.js`: `config.numberScopeFilter`(선택) 추가. `_scoped(logs)` 헬퍼가 `_existingNumberSet`(중복 판정·`_assignFrom` 공용), `_fillBlankReceptionNumbers`, `_autoAssignReceptionNumbers`의 기존 레코드에 적용된다. 설정이 없으면 예전과 동일 — 수질·퇴비·중금속·잔류농약은 영향 없다.
- `src/soil/soil-script.js initExcelImporter`: `numberScopeFilter: (log) => (log.landClass1 || LAND_CLASS1_DEFAULT) === LAND_CLASS1_DEFAULT`, `buildRecord`에 `landClass1: LAND_CLASS1_DEFAULT` 명시(범위와 같은 값이라는 것이 코드에 드러나도록).

경지구분을 서식에서 받는 것은 기능 추가라 하지 않았다(SAMPL-2-27 MINOR-2와 같은 주제, 별도 티켓 감).

### #2 🔵 일괄 완료 E2E 추가

작업자 보고대로 호출부가 로그만 넘겨 전달 누락 변이는 성립하지 않지만, `soil-script.js`가 다시 인라인 그룹핑으로 돌아가는 회귀는 단위 테스트가 못 잡는다. `tests/e2e/soil-landclass-isolation.spec.js`에 「일괄 완료: 공익직불제 5 선택이 농가의뢰 5·성토 F5로 번지지 않는다」를 추가했다(체크박스 `b` → `#btnBulkComplete` → confirm 수락 → `{a:false,a1:false,b:true,b1:true,f:false}`). 변이 M1b가 이 테스트를 죽인다(아래 표).

## 2. b4859cb 세 수정의 반증 시도

| 질문 | 확인 | 결과 |
|------|------|------|
| 레거시 레코드(landClass1 없음)에서 조건이 일관된가 | 코드로: `reception-group`·`heuktoram`·`reception-number`·`soil-result-importer`·`findDuplicateReceptionNumbers`·`sync-utils` 모두 `\|\| '농가의뢰'`. 로드 시 `getAdditionalMigrations`가 채움. 흙토람은 localStorage를 직접 읽어 마이그레이션을 안 타지만 같은 폴백. 실행: 기존 E2E·단위의 `a1`(undefined)이 양성 대조 | 일관됨 |
| 빈 문자열 `''` | `'' \|\| '농가의뢰'` — 세 곳 동일 | 일관됨 |
| 성토(F)에서도 맞는가 | 코드로: `reception-group`은 `isFill`(F 접두), 흙토람은 base에 F가 남아 `'F5' !== '5'`. 실행: 새 일괄 완료 E2E의 `f`(F5, 공익직불제), 기존 흙토람 E2E의 `f` | 맞음 |
| 성토 판정 기준 불일치(#4) | `reception-number.js`는 `subCategory==='성토'`, 그룹·흙토람은 F 접두. `subCategory='성토'`인데 번호에 F가 없으면 그룹에서는 일반 5와 형제가 된다. 이 커밋 이전부터이며 `soil-result-importer`가 「성토인데 F 접두가 없습니다」로 경고한다 | 보고만 (재현 안 함, 이 티켓 범위 밖) |
| `defaultSelected`가 다른 reset 경로를 깨는가 | `resetFormKeepReceptionInfo`·`resetForm`은 명시 복원을 그대로 둠. `populateLandClass1Options`는 `options.length === 0`일 때만 채우고 HTML `<select id="landClass1">`은 비어 있어 항상 이 경로를 탄다 | 문제 없음 |
| 흙토람 `preSelectedLogIds`로 일부만 열면 형제 동기화가 화면 밖 레코드에 안 미친다 | 이 커밋 이전부터의 설계(표시 행만 동기화) | 언급만 |

## 3. 검증 기록

기준선은 이 worktree의 b4859cb(수정 전) 빌드로 쟀다. 모두 실제 실행.

| 검사 | 수정 전 (b4859cb) | 수정 후 |
|------|-------------------|---------|
| `npm run build` | exit 0 | exit 0 |
| `npm run typecheck` | — | exit 0 |
| `npm run check:docs` | — | `HTML 15개, 참조 143건` / `[OK] 누락 0건` |
| `npm run test:unit` | 538 passed | 538 passed (21 files) |
| 새 스펙 `soil-excel-import-landclass.spec.js` (4건) | **3 failed** / 1 passed | 4 passed |
| `soil-landclass-isolation.spec.js` (3 → 4건) | 3 passed / 신규 일괄 완료 passed(수정 대상 아님) | 4 passed |
| 새 스펙 `heuktoram-import-landclass.spec.js` (2건) | **2 failed** (`b: "6.5"` / `a: "6.5"`) | 2 passed |
| `heuktoram-preview-table.spec.js` (10건, 회귀) | — | 10 passed |
| 전체 `npx playwright test` — #1·#2 반영 후 | 474 passed / **1 failed** / 4 skipped (479) | 480 passed / 0 failed / 4 skipped (484) |
| 전체 `npx playwright test` — #0까지 반영 후(최종) | — | 482 passed / 0 failed / 4 skipped (486) |

기준선 실패 1건은 `legacy-migration.spec.js:113` 중금속 `completed→isComplete` 테스트의 `.nav-btn` 클릭 30초 타임아웃이다. 토양·이 커밋과 무관하고, 같은 docs로 단독 재실행하면 통과했다 — 병렬 부하 플레이키로 본다. 작업자 보고의 475/0과 다른 것은 이 1건이다.

### 변이 검증

변이마다 원본 백업 → 변이 1개 → `npm run build` → 관련 스펙(+ `reception-group.test.js`) → 원본 복원(`cmp`/`filecmp` 동일 확인) → 최종 빌드. MX1·MX2·M1b는 scratchpad `mutrun.py`, MH1은 같은 절차를 손으로.

| 변이 | 내용 | E2E (8건) | 단위 (35건) |
|------|------|-----------|-------------|
| MX1 | 토양 `numberScopeFilter` 제거 | **3 failed** (로컬 차단·클라우드 차단·`1,2,31,32,F40`) / 5 passed | 35 passed |
| MX2 | `_scoped`가 필터하지 않음 | **3 failed** (같은 3건) / 5 passed | 35 passed |
| M1b | `computeBulkTargetIds` 경지구분 조건 제거 | **1 failed** (일괄 완료 E2E) / 7 passed | **2 failed** (computeBulkTargetIds 2건) / 33 passed |
| MH1 | 흙토람 importer: 후보 2건 이상이어도 마지막 행에 매칭(예전 동작) | **2 failed** (새 흙토람 스펙 2건) / 10 passed (`heuktoram-preview-table` 회귀 없음) | — |

## 4. 변경 파일

- `src/heuktoram/heuktoram-result-importer.js` — `keyMap` 복수 후보 + 미매칭 사유(목록·경고줄·CSV)
- `src/shared/excel-import-manager.js` — `numberScopeFilter` + `_scoped`
- `src/soil/soil-script.js` — `numberScopeFilter`, `buildRecord.landClass1`
- `tests/e2e/heuktoram-import-landclass.spec.js` — 신규 2건 (저장 순서 양방향)
- `tests/e2e/soil-excel-import-landclass.spec.js` — 신규 4건
- `tests/e2e/soil-landclass-isolation.spec.js` — 일괄 완료 1건 추가
- `docs/` — 빌드 산출물 (공통 모듈이라 5개 시료 번들 + 흙토람 번들 재해시)

`package-lock.json`(npm install 부산물 peer 플래그)·`.claude/`·`.omc/`는 넣지 않았다. AI PM 티켓 상태는 건드리지 않았다.
