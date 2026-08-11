# SAMPL-1-147 코드 리뷰

- 리뷰어: code-reviewer 에이전트 (Opus, 독립 레인) + 적대적 검증(critic)
- 대상: `git diff src/ tests/` (커밋 전)

## 판정

```text
🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 5건 / 🔵 SUGGESTION: 9건
→ 판정: APPROVED
```

## 리뷰어가 수행한 검증 (인용)

| 항목 | 결과 |
|---|---|
| `npx vitest run` | 267 pass / 17 files |
| `npx playwright test tests/e2e/edit-mode.spec.js` | 8 pass |
| `node --check` (8파일) | 전부 통과 |
| **뮤테이션 검증** (수정 전 소스를 별도 워크트리에서 재빌드 후 신규 spec 실행) | **7 fail / 1 pass** |

뮤테이션 검증이 핵심이다. 신규 테스트가 실제로 결함을 잡는지 확인했고, 실패 메시지가 원인 4건을 각각 지목했다:

- 원인 ①: `#receptionNumber` = "8" (기대 "7") — 편집 중 자동번호 덮어쓰기 재현
- 원인 ④: `logs[0].mailDate` = undefined (수질·중금속 양쪽)
- 원인 ②(취소): `#yearSelect` = "2027" — 가드 없으면 연도가 그냥 바뀜
- 원인 ②(가짜 성공): `'찾을 수 없습니다'` 토스트 부재
- 원인 ③: `logs[0].name` = "수정테스트" (저장 안 됨)

유일하게 수정 전에도 통과한 1건은 해피패스 기준선(`edit-mode.spec.js:73`).

## 중점 항목 검증 결과

- **A. `...prev` 전개 부작용 없음** — 수질에서 제외한 배열 4개가 `editSample`이 단수 필드보다 우선 참조하는 필드 전부와 정확히 일치(`water-script.js:448/449/450/453`). 그 외 우선 참조 레거시 필드는 grep 결과 없음. 중금속·농약은 복수형 레거시 필드가 없어 제외 대상 없음이 맞음.
- **B. 전개 순서 정확** — 3타입 모두 `...prev` → `...commonData` → 명시 필드. 폼 `name=` 속성 전수와 대조해 폼에서 지운 값이 `''`로 정상 덮임을 확인.
- **C. 연도 변경 가드 상태 일관** — 취소 시 조기 return으로 `selectedYear`·`sampleLogs`가 함께 구 연도 유지. 확인 시 `newYear` 재설정 + `syncYearSelects`로 최종 일치.
- **D. `notifyEditTargetMissing` 의존성 안전** — `showToast`는 `window.showToast` 미로드 시 no-op, `moduleKey`는 생성자 세팅, `logger?.error || console.error` 폴백 적절.
- **F. 엄격 id 비교 코드베이스 전체 0건** 확인.

## 처리한 지적

| # | 등급 | 지적 | 처리 |
|---|---|---|---|
| MINOR-3 | 🟡 | `__sentinel` 주석이 폐기된 화이트리스트 메커니즘을 설명 → 미래 담당자를 오수정으로 유도 | **수정** — 주석을 전개 방식 기준으로 재작성 |
| MINOR-5 | 🟡 | 단위 테스트 건수 보고 불일치(15건 → 실제 13건) | **정정** — approve 노트에 실제 13건 기재 |
| MINOR-4 | 🟡 | 빌드가 `docs/03-code-review/` 13건을 삭제 | **복구** — `git checkout -- docs/03-code-review/`, 이번 문서는 `docs-internal/`에 보관 |
| S2 | 🔵 | accept/dismiss 테스트가 확인창 표시 자체를 단언하지 않아, 가드를 제거해도 통과 | **반영** — `dialogShown` 플래그 단언 추가 (8건 유지 통과) |

## 후속 티켓 권장 (이 티켓 범위 외, 동일 결함 계열)

1. **MINOR-1** `soil-script.js:1868-1874` — soil **그룹** 수정 경로만 대상 미발견 가드가 없다.
   `oldGroupLogs`가 전부 비면 `groupId: undefined` 고아 레코드가 생기고 성공 토스트가 뜬다(중금속에서 제거한 가짜 성공과 동일 형태).
   이번 연도 변경 가드로 주 트리거는 막혔으나 근본 가드는 없음.
2. **MINOR-2** 분석결과 경로의 조용한 return이 수질만 정리됨 —
   `compost:2194/2445`, `heavy-metal:1914/2069`, `pesticide:3893/4225`.
   특히 `save*Analysis`는 사용자가 입력을 끝내고 저장을 누른 시점에 무반응.
3. **Open Question** `BaseSampleManager.js:458` — `loadYearData`가 편집 중에도 `sampleLogs`를 통째로 교체하는 것 자체는 그대로.
   원인 ②의 근본 메커니즘이 예방이 아니라 탐지(안내)로만 처리됨. 편집 중 재로드 유예를 검토할 가치 있음.
4. **S8 하네스 갭** — `npm run lint`는 `echo "No linting configured"` 스텁, `npm run typecheck`는 `tsconfig.json`이 없어 tsc 헬프만 출력.
   이런 결함(엄격 비교·필드 유실)을 기계적으로 잡는 정적 게이트가 실질적으로 부재.

## 별건 발견 (가치 큼)

리뷰 중 확인된 사실: **HEAD(`964fd44`)에 커밋된 `docs/`가 존재하지 않는 번들을 참조하고 있었다.**
`docs/water/index.html → assets/water-BjjuMcel.js`처럼 5개 시료 페이지 + 분석 페이지 4종 + 공용 `tooltip`까지 총 18건.
즉 v1.17.7 GitHub Pages는 스크립트 404 상태였다. 이번 재빌드로 현재 `docs/`는 참조 누락 0건.
의도한 수정은 아니지만 웹 배포가 함께 복구된다. 릴리스 파이프라인에 `docs/` 참조 정합성 검사를 넣을 것을 별건으로 권고.

## 적대적 검증 (critic, "이 변경을 반증하라") — 반례 4건

코드 리뷰가 APPROVED를 낸 뒤 별도 레인에서 적대적 검증을 수행했고, **코드 리뷰어와 작성자 모두 놓친
CRITICAL 반례 1건**이 나왔다. 이 검증이 없었으면 데이터 유실이 그대로 배포됐다.

### CRITICAL — 토양 그룹 수정이 폼 밖 필드 5종을 성공 토스트와 함께 삭제 (수정 완료)

`src/soil/soil-log-record.js:54-73` — `isGroupEdit`일 때 `createdAt`/`isComplete`만 보존하고
나머지는 새로 조립. 같은 `submitForm`의 **단건 분기는 `...existingLog`로 전부 보존**하므로
두 분기의 계약이 갈려 있었다.

직접 검증한 유실 필드 (5개 모두 soil 폼에 `name=` 입력란 없음):

| 필드 | 설정 경로 |
|---|---|
| `mailDate` | 목록 일괄 우편발송일자 입력 |
| `gongikOrder`, `gongikBaseYear` | 목록 인라인 select / `applyGongikBulk` |
| `businessRegNo`, `basePnu` | 결과 가져오기(`soil-result-importer.js`), 목록 렌더(`:3371`) |

공익직불제는 농가 보조금 제도 데이터이므로, 일괄 적용 직후 아무 그룹이나 한 번 수정하면
그 그룹의 값만 조용히 초기화되고 화면에는 성공 메시지가 뜬다. `persistRecords`로 Firestore까지 즉시 전파된다.

**수정**: `soil-log-record.js:61`에 `...(isGroupEdit && existingLog ? existingLog : {})` 전개를 추가해
단건 분기와 계약을 일치시켰다. 부수적으로 작물 2개 → 1개로 줄일 때 낡은 `cropIndex`가
남는 문제도 함께 막았다(`else if ('cropIndex' in rec) delete rec.cropIndex`).

**뮤테이션 검증**: 이 전개를 제거하고 재빌드하면 신규 E2E가 정확히
`mailDate`/`gongikOrder`/`gongikBaseYear`/`businessRegNo`에서 실패함을 확인했다.

### MAJOR — 테스트가 그룹 수정 경로를 0건 실행 (수정 완료)

신규 E2E 8건이 전부 단건 시드였다. 그 결과 water의 레거시 배열 제외 구조분해가
모든 테스트에서 `undefined`로만 실행되어 **"제외"라는 동작 자체가 한 번도 검증되지 않았다.**
이 커버리지 공백이 위 CRITICAL이 통과해버린 이유다.

**수정**: E2E 3건 추가 — 수질 그룹 3건(비연속 접수번호 5/9/12, 행별 값 유지),
레거시 배열 보유 단건(배열 제거 + 미지 필드 보존), 토양 그룹 수정(위 CRITICAL 회귀 테스트).
단위 3건 추가 — 그룹 수정 폼 밖 필드 보존, 낡은 `cropIndex` 제거, 키 집합 동치.

### MINOR — 분석결과 경로 조용한 실패 3타입 6곳 → SAMPL-1-148로 분리

### 반증 실패 (주장이 견고함으로 확인된 항목)

적대적 검증이 다음을 깨뜨리려 했으나 실패했다:

- **연도 변경 가드** — 진입점 전수(Base + soil 오버라이드 2곳), `listYearSelect` 취소 경로,
  확인 후 복합 시나리오(새 연도 기준 접수번호 재계산, 버튼 복원, 구 연도 데이터 무손상) 모두 정합
- **`...prev` 전개** — 5타입 폼 `name=` 전수 대조 결과 폼에서 지운 값이 남는 사례 없음.
  `||` 폴백은 전개 뒤라 값 반전 불가
- **레거시 배열 4개 제외로 충분** — `editSample`이 단수 필드보다 우선 참조하는 배열이 정확히 그 4개이고,
  `applyLegacyAddress`는 `addressRoad` 존재 시 조기 return
- **행 매핑 정합성** — 비연속 접수번호(5/9/12)에서도 `getGroupMembers`와 `oldOrdered`가 동일 키로 정렬
- **id 정규화 잔여 8곳** — 전부 `dataset.id`(문자열) 또는 `String()` 정규화 Set에서 오므로 정상 동작

## 검증 후 최종 테스트 결과

- 단위: **269 pass** (신규 13 + soil-log-record 3 추가)
- E2E: **216 pass** (기존 205 회귀 없음 + 신규 11)
- 빌드: 성공, `docs/` 참조 26건 누락 0건

## 다른 계열 모델 교차검증 — 미실행 (사실 기록)

CLAUDE.md 3중 검증의 둘째 레인을 이번에는 **실행하지 못했다**:

- `gemini`: `GOOGLE_CLOUD_PROJECT`/`GOOGLE_CLOUD_PROJECT_ID` 미설정으로 거부
- `codex`: vendor 바이너리 누락 (`ENOENT`, 구독 종료 상태)

실행하지 않은 검증을 기록해 훅을 통과시키지 않는다는 규칙에 따라 그대로 남긴다.
대체로 **적대적 검증(critic에 "이 변경을 반증하라")** 을 수행했다.
