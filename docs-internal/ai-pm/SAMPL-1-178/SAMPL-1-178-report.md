# SAMPL-1-178 — 토양: 경지구분이 다른 같은 번호 시료가 함께 완료·분석값 공유되는 결함

- 저장소: 메인(운영) sample-log-electron, 브랜치 `bluesky78060/sampl-1-178-landclass-fix` (기준 origin/main `1cdb4d5`)
- 출발점: SAMPL-2-27 독립 리뷰 1라운드의 「메인 프로젝트 판정」과 MAJOR-1·MAJOR-2
- 배경: 접수번호는 경지구분(landClass1)별 독립 시퀀스다. '농가의뢰 5'와 '공익직불제 5'는 **다른 농가의 시료**다.

## 결과 요약

| # | 항목 | 재현(수정 전) | 수정 | 수정 후 | 변이 검증 |
|---|------|---------------|------|---------|-----------|
| 1 | 완료·일괄 완료 연동이 경지구분을 무시 | **재현됨** — 단위 4건 실패, E2E 1건 실패 | `reception-group.js` 두 함수에 경지구분 일치 조건, 완료 버튼 호출부가 `log.landClass1` 전달 | 통과 | M1a·M1b·M1c 모두 해당 테스트만 실패 |
| 2 | 흙토람 `syncToSiblings`가 경지구분을 무시 | **재현됨** — 공익직불제 5에 pH 6.5가 저장됨 | 형제 조건에 경지구분 일치 추가. 성토는 base에 'F'가 남아 이미 갈림(테스트로 확인) | 통과 | M2 — 해당 테스트만 실패 |
| 3 | 연속 신규 등록 후 경지구분이 '개량제'로 바뀜 | **재현됨** — 두 번째 등록이 '개량제'로 저장됨 | `populateLandClass1Options`에서 `opt.defaultSelected = true` | 통과 | M3 — 해당 테스트만 실패 |

세 항목 모두 재현됐다. 「재현 안 됨」 항목은 없다.

## 1. 완료·일괄 완료 연동 (실행 확인된 결함)

**재현** — 수정 전 `npx vitest run tests/unit/reception-group.test.js`:

```
 Test Files  1 failed (1)
      Tests  4 failed | 31 passed (35)
AssertionError: expected [ 'a', 'a1', 'b', 'b1', 'f' ] to deeply equal [ 'a', 'a1', 'f' ]
```

수정 전 docs/ 대상 E2E(`soil-landclass-isolation.spec.js` 완료 버튼 테스트, 당시 농가의뢰 행 클릭판): `"b": true`(공익직불제 5가 함께 완료됨).

**수정**

- `src/soil/reception-group.js` — `findRelatedLogs(logs, receptionNumber, landClass1)`에 3번째 인자 추가, `computeBulkTargetIds`는 선택 로그의 경지구분을 그룹 키에 포함. 누락값은 `'농가의뢰'`로 본다(옛 데이터 호환, soil-script의 `LAND_CLASS1_DEFAULT`와 같은 값).
- `src/soil/soil-script.js:4425` — 완료 버튼이 `log.landClass1`을 넘긴다. 일괄 완료(`:4721`)는 로그 자체에서 읽으므로 호출부 변경 없음.
- 성토(F) 구분은 그대로 유지.

**테스트**

- 단위: `tests/unit/reception-group.test.js`에 4건 추가(누락값=농가의뢰 포함). 기존 31건(동치성 회귀 가드 포함)은 그대로 통과 — 경지구분이 없는 로그끼리는 예전과 같은 결과.
- E2E: 완료 버튼 테스트는 **공익직불제 행을 누른다.** 농가의뢰 행을 누르면 호출부가 경지구분을 빠뜨려도(누락=농가의뢰) 통과해 버려 변이 M1c가 살아남는다 — 그래서 바꿨다.

## 2. 흙토람 syncToSiblings (코드로만 확인 → E2E로 재현)

**재현** — 수정 전 docs/ 대상, 농가의뢰 5(a)·농가의뢰 5-1(a1)·공익직불제 5(b)·성토 F5(f)를 심고 `heuktoramManager.handleCellEdit('a_0_0','pH','6.5')` 후 `localStorage.soilTestResults_2026`:

```
- Expected  - 1
+ Received  + 1
-   "b": null,
+   "b": "6.5",
```

다른 농가 시료(b)의 검정결과가 조용히 덮어써졌다. 흙토람 내보내기로 이어진다.

**수정** — `src/heuktoram/heuktoram-script.js` `syncToSiblings`: 형제 조건에 `(log.landClass1 || '농가의뢰')` 일치 추가.
성토 구분 조건은 **추가하지 않았다** — 흙토람의 base는 `replace(/-\d+$/, '')`라 'F'가 남아('F5' ≠ '5') 이미 갈린다. 같은 테스트의 `f: null`이 수정 전·후·M2 변이에서 모두 유지돼 이를 확인한다.

## 3. 연속 신규 등록 후 경지구분 초기화 (코드로만 확인 → E2E로 재현)

**재현** — 수정 전 docs/ 대상, 첫 등록은 '대표필지', 두 번째는 경지구분을 건드리지 않고 `soilManager.submitForm()`:

```
Error: 첫 등록 후 폼 경지구분이 기본값으로 돌아오지 않았다
Expected: "농가의뢰"   Received: "개량제"
Error: 두 번째 등록이 기본값이 아닌 경지구분으로 저장됐다
-   "농가의뢰",
+   "개량제",
```

원인: `opt.selected = true`는 property라 `form.reset()`이 첫 옵션('개량제')으로 되돌린다. 신규 등록 경로(`:2633`)에만 복원이 없었다.

**수정** — `src/soil/soil-script.js` `populateLandClass1Options`: `opt.defaultSelected = true`. `resetFormKeepReceptionInfo`의 명시적 복원은 그대로 두고, 틀리게 된 주석만 고쳤다.

## 변이 검증

변이마다 원본 3파일 복원 → 변이 1개 적용 → `npm run build` → 단위 + 새 E2E 스펙 실행. 스크립트: 작업 세션 scratchpad `mutrun.py`(재시도 세션에서 다시 실행한 결과가 아래 표다 — 첫 시도의 기록은 /tmp 초기화로 사라졌다).

| 변이 | 내용 | 단위(reception-group) | E2E(새 스펙 3건) |
|------|------|-----------------------|------------------|
| M1a | `findRelatedLogs`의 경지구분 조건 제거 | 2 실패 / 33 통과 (findRelatedLogs 2건) | 완료 버튼 1건만 실패 |
| M1b | `computeBulkTargetIds`의 경지구분 조건 제거 | 2 실패 / 33 통과 (computeBulkTargetIds 2건) | 3 통과 — 일괄 완료 E2E가 없어 단위로만 잡힌다. 호출부는 로그만 넘겨 전달 누락 변이가 성립하지 않는다 |
| M1c | 완료 버튼 호출부가 `log.landClass1`을 안 넘김 | 35 통과 | 완료 버튼 1건만 실패 |
| M2 | 흙토람 형제 조건의 경지구분 제거 | 35 통과 | 흙토람 1건만 실패 |
| M3 | `defaultSelected` → `selected` | 35 통과 | 연속 등록 1건만 실패 |

변이 후 원본 3파일 복원을 `cmp`로 확인(3건 모두 동일)하고 최종 빌드를 다시 했다.

## 최종 검증

수정 전 기준선은 origin/main `1cdb4d5`를 임시 worktree로 떠서 같은 `node_modules`로 빌드해 쟀다.

| 검사 | 수정 전(1cdb4d5) | 수정 후 |
|------|------------------|---------|
| `npm run build` | 성공 | 성공 (exit 0, `✓ built in 4.11s`) |
| `npm run typecheck` | — | 성공 (exit 0) |
| `npm run check:docs` | — | `HTML 15개, 참조 143건` / `[OK] 누락 0건` |
| `npm run test:unit` | — | `Test Files 21 passed (21)` / `Tests 538 passed (538)` |
| 새 스펙 단위(`reception-group.test.js`) | **4 failed** / 31 passed | 35 passed |
| 새 스펙 E2E(`soil-landclass-isolation.spec.js`) | **3 failed** (완료 버튼 `Expected -2 / Received +2`, 연속 등록 `"농가의뢰"` 기대·`"개량제"` 수신, 흙토람 `Expected -1 / Received +1`) | 3 passed |
| 전체 E2E(`npx playwright test`) | 472 passed / 4 skipped / 0 failed (476) | 475 passed / 4 skipped / 0 failed (479) |

전체 E2E 증가분 3건은 새 스펙이다. **신규 실패 0건.** 수정 전 행의 새 스펙 결과는 수정본의 테스트 파일을 기준선 worktree에 복사해 돌린 것이다.

## 이미 오염된 데이터 점검 방법 (제안만 — 코드 추가 없음)

이 결함은 **같은 연도·같은 본번·같은 성토 구분·다른 경지구분** 쌍에서만 일어난다. 점검은 그 쌍을 뽑아 사람이 보는 것이다.

1. **완료 상태** — 토양 목록에서 경지구분 탭을 「전체 경지구분」으로 두고 접수번호로 정렬한다. 같은 번호가 두 경지구분에 있고 둘 다 완료(✔)인데 실제로는 한쪽만 분석이 끝났다면 잘못 번진 것이다. 완료 버튼은 기록에 `updatedAt`만 남기므로, 두 기록의 `updatedAt`이 같은 시각(초 단위까지)이면 한 번의 클릭으로 함께 바뀌었을 가능성이 높다.
2. **흙토람 검정결과** — 흙토람 화면에서 토양 목록 선택 없이(그 연도 전체) 열고, 같은 번호의 다른 경지구분 행끼리 pH·유기물 등 값이 **전 항목 동일**한지 본다. 실제 분석값이 전 항목 우연히 같을 확률은 낮다. 원자료는 IndexedDB `SampleAnalysisDB`(주 저장소)와 localStorage `soilTestResults_<연도>`(미러)에 `<기록 id>_<필지>_…` 키로 있다.
3. 기계적으로 뽑고 싶다면 개발자 도구 콘솔에서 `soilSampleLogs_<연도>`를 읽어 `(본번, 성토 여부)`로 묶고 경지구분이 2종 이상인 그룹만 출력한 뒤, 각 기록 id로 `soilTestResults_<연도>`의 값을 나란히 비교하면 된다. 수정은 원자료(분석 성적서)와 대조한 뒤 손으로 한다 — 어느 쪽이 원본인지는 데이터만으로 알 수 없다.

## 범위 밖 (이번에 건드리지 않음)

- SAMPL-2-27 리뷰의 MINOR-1(건수 표시), MINOR-2(엑셀 경지구분 열)는 테스트 프로젝트 지적이다. 메인 엑셀에는 `경지구분1차` 열이 이미 있다.
- 버전(package.json)·릴리스 노트 미변경, push·PR 없음.
