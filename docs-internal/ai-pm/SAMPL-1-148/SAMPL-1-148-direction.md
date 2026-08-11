# SAMPL-1-148 Discovery — 조용한 실패·가짜 성공 잔여 경로

- 티켓: SAMPL-1-148 / 작성일 2026-08-11
- 방향 확정: 사용자 "후속 티켓도 발행해서 같이 수정해줘" (2026-08-11)
- 선행: SAMPL-1-147 (동일 결함 계열의 주 경로 수정)

## 1. 목표 (Why)

SAMPL-1-147에서 "저장이 실패했는데 사용자가 알 수 없는 경로"를 제거했으나,
코드 리뷰와 적대적 검증이 **같은 계열의 잔여 경로 7곳**을 찾아냈다.
목표는 남은 경로를 같은 계약(`notifyEditTargetMissing`)으로 통일해, 5개 시료 타입 전체에서
"조용한 실패"와 "가짜 성공"이 하나도 남지 않게 하는 것이다.

## 2. 사용자 (Who)

SAMPL-1-147과 동일. 특히 분석결과 입력은 담당자가 여러 항목을 타이핑한 뒤 저장하는 작업이므로,
실패가 조용하면 입력분 전체가 사라진다.

## 3. 범위 (What)

### ① soil 그룹 수정 경로 가드 부재 (코드 리뷰 MINOR-1)

`src/soil/soil-script.js:1868-1874`

```javascript
const oldGroupLogs = this.editingGroupIds
    .map(eid => this.sampleLogs.find(l => String(l.id) === String(eid)))
    .filter(Boolean);
const groupId = oldGroupLogs[0]?.groupId;            // 전부 못 찾으면 undefined
this.sampleLogs = this.sampleLogs.filter(l => l.groupId !== groupId);
```

- `oldGroupLogs`가 비면 `groupId: undefined` 고아 레코드가 생성되고 성공 토스트가 뜬다(`:1941`)
- `filter(l => l.groupId !== undefined)`가 groupId 없는 레코드를 배열에서 떨어뜨리고 `saveLogs`가 축소본을 기록
- SAMPL-1-147의 연도 변경 가드로 주 트리거는 막혔지만 근본 가드가 없다

> soil 단건 경로(`:1946-1949`)는 SAMPL-1-147에서 이미 `notifyEditTargetMissing`으로 처리됨.

### ② 분석결과 입력/저장 경로 6곳 (코드 리뷰 MINOR-2 · 적대적 검증 MINOR 4)

코드로 확인한 실제 위치:

| 파일 | 조회 | 저장 |
|---|---|---|
| `compost-script.js` | `openCompostAnalysisModal` `:2193-2194` | `saveCompostAnalysis` `:2444-2445` |
| `heavy-metal-script.js` | `openHeavyMetalAnalysisModal` `:1913-1914` | (`:2068-2069`) |
| `pesticide-script.js` | `openPesticideAnalysisModal` `:3892-3893` | (`:4224-4225`) |

6곳 모두 `const log = ...find(...); if (!log) return;` 형태로 아무 안내 없이 끝난다.
수질은 SAMPL-1-147에서 이미 처리됨(`water-script.js:1994`, `:2224`).

## 4. 제약

- 분석결과 경로의 문구는 "수정할 데이터를 찾을 수 없습니다"가 맥락에 맞지 않다
  (코드 리뷰 S7). `notifyEditTargetMissing`에 문구 오버라이드가 필요하다.
- 이 3개 타입은 water와 달리 `_analysisLogId`가 아니라 `_caLogId`/`_hmLogId`/`_paLogId`를 쓴다.
- `docs/`는 빌드 산출물이므로 워크플로우 문서 원본은 `docs-internal/ai-pm/SAMPL-1-148/`에 둔다.

## 5. 우선순위

1. ① soil 그룹 가짜 성공 (고아 레코드 생성 + 잘못된 성공 메시지)
2. ② 분석결과 저장 3곳 (입력분 유실을 사용자가 인지 못함)
3. ② 분석결과 조회 3곳 (모달이 그냥 안 열림)

## 6. 리스크

- `notifyEditTargetMissing`에 문구 파라미터를 추가하면 SAMPL-1-147의 기존 호출부 9곳의 동작이 바뀔 수 있다
  → 기본값을 유지하는 선택적 인자로 설계한다.
- soil 그룹 가드 추가로 정상 그룹 수정이 막히면 회귀다 → E2E로 정상 경로를 함께 고정한다.

## 7. 검증

- E2E: soil 그룹 수정 대상 소실 시 실패 안내 + 고아 레코드 미생성 + 정상 그룹 수정 유지
- 단위: `notifyEditTargetMissing` 문구 오버라이드 동작
- 전체 회귀: `npm run test:unit`, `npm test`
