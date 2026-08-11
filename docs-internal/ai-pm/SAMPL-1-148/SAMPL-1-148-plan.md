# SAMPL-1-148 구현 플랜 (개정판) — 조용한 실패·가짜 성공 잔여 경로

- 선행 문서: `SAMPL-1-148-direction.md`, 플랜 리뷰 1차 CHANGES_REQUESTED (MAJOR 1 / MINOR 5)
- 기반: SAMPL-1-147에서 도입한 `notifyEditTargetMissing()` 계약 재사용
- **선행 티켓: SAMPL-2-22를 먼저 완료한다** — 이 티켓이 `src/` 6파일을 고쳐 `docs/` 번들 해시가 전부 바뀌므로,
  참조 정합성 검사기가 먼저 있어야 커밋을 검증할 수 있다.

## 설계 원칙

1. **한 가지 계약으로 통일** — 새 헬퍼를 만들지 않고 SAMPL-1-147의 `notifyEditTargetMissing`을 재사용한다.
2. **문구는 맥락에 맞게** — 분석결과 경로에 "수정할 데이터"라고 말하지 않는다.
3. **가드 추가가 정상 경로를 막지 않음을 테스트로 고정**한다.

## 변경 A — `notifyEditTargetMissing`에 문구 오버라이드 추가

`src/shared/BaseSampleManager.js`

```js
notifyEditTargetMissing(context, detail = {}, message = BaseSampleManager.EDIT_TARGET_MISSING_MESSAGE) {
    this.showToast(message, 'error');
    ...
}
```

+ 분석결과 전용 문구 상수 추가:

```js
// "저장할"이 아니라 "입력할" — 조회(모달 열기)와 저장 양쪽에서 성립해야 한다 (플랜 리뷰 MINOR-1)
static ANALYSIS_TARGET_MISSING_MESSAGE = '분석결과를 입력할 접수 데이터를 찾을 수 없습니다. 다른 연도의 데이터일 수 있습니다.';
```

**호출부 실측 11곳** (플랜 리뷰 MINOR-2 정정):
`water:412, 733, 1996, 2226` / `heavy-metal:323` / `BaseSampleManager:1335` /
`soil:1951, 2139` / `compost:512` / `pesticide:808, 976`.
이 중 변경 C가 손대는 water 분석 2곳(`1996`, `2226`)을 제외한 **9곳은 3번째 인자 미전달 → 동작 불변**.
`notifyEditTargetMissing`은 Base에만 정의되고 서브클래스 오버라이드가 없어 회귀 위험이 없다(리뷰 확인).

## 변경 B — soil 그룹 수정 가드

`src/soil/soil-script.js:1868-1874` — `oldGroupLogs` 계산 직후:

```js
if (oldGroupLogs.length === 0) {
    this.notifyEditTargetMissing('submitForm(group)', { editingGroupIds: this.editingGroupIds });
    return;
}
```

`groupId`가 `undefined`인 상태로 `filter`/`push`가 진행되는 것을 원천 차단한다.
(단건 경로는 SAMPL-1-147에서 이미 처리됨)

## 변경 C — 분석결과 경로 6곳

각 지점의 `if (!log) return;`을 안내 + 진단 로그 + return으로 교체한다.

| 파일 | 함수 | 라인 | 상태 변수 |
|---|---|---|---|
| `compost-script.js` | `openCompostAnalysisModal` | `:2193-2194` | `_caLogId` |
| `compost-script.js` | `saveCompostAnalysis` | `:2444-2445` | `_caLogId` |
| `heavy-metal-script.js` | `openHeavyMetalAnalysisModal` | `:1913-1914` | `_hmLogId` |
| `heavy-metal-script.js` | `saveHeavyMetalAnalysis` | `:2068-2069` | `_hmLogId` |
| `pesticide-script.js` | `openPesticideAnalysisModal` | `:3892-3893` | `_paLogId` |
| `pesticide-script.js` | `async savePesticideAnalysis` | `:4224-4225` | `_paLogId` |

(플랜 리뷰가 6개 라인·함수명 전부 실제 코드와 일치함을 확인했다.)

저장·조회 양쪽 모두 `ANALYSIS_TARGET_MISSING_MESSAGE`를 쓴다.
수질(`water-script.js:1996`, `:2226`)도 같은 문구로 통일해 5타입 일관성을 맞춘다.

> 3타입의 저장 함수에는 `if (!logId) return;`이 `if (!log)` 앞에 하나 더 있다
> (`compost:2442`, `hm:2066`, `pest:4222`). `closeModal`이 null로 리셋하므로 모달이 열린 상태에서는
> 도달 불가한 방어선이다 — **미변경**으로 둔다.

### 조회 경로에도 안내가 필요한 이유 (플랜 리뷰 ④ 답변)

- 호출부 4곳 모두 단일 클릭 위임 핸들러(`water:1399`, `hm:498`, `compost:956`, `pest:2453`)라
  렌더 루프에서 불리지 않는다 → 토스트 스팸 위험 0
- water는 이미 `openAnalysisModal`에 안내가 있어(SAMPL-1-147) 빼면 5타입 비일관
- "모달이 안 열린다"는 인지되지만 **원인과 복구 경로("다른 연도")는 전달되지 않는다** — 사용자는 재클릭만 반복
- 패키징 앱 사후 추적의 유일한 단서인 `logger.error` 진단이 조회 경로엔 지금 전혀 없다

## 변경 C-2 — 중금속 완료/판정 토글 (플랜 리뷰 MINOR-4)

`heavy-metal-script.js:517`(`toggleComplete`), `:530`(`toggleResult`)도 `if (!log) return;`이다.
사용자가 목록의 완료/판정 배지를 눌렀는데 아무 일도 일어나지 않는 동일 계열 조용한 실패다
(다른 4타입은 구현 형태가 달라 해당 없음). 토글은 멱등이라 위험 0, 각 1줄.

이 2곳을 포함해야 direction §1의 "하나도 남지 않게" 선언이 거짓이 되지 않는다.

## 변경 D — 테스트

### E2E (`tests/e2e/edit-mode.spec.js`에 추가)

1. **토양 그룹 수정 대상 소실** — 그룹 편집 진입 후 `soilManager.sampleLogs = []` → 저장
   → 실패 안내가 뜨고, 성공 토스트가 없고, `groupId: undefined` 레코드가 생기지 않는다.
   **추가 단언(플랜 리뷰 MINOR-5)**: 시드에 `{ id: 'solo-1', groupId: undefined }` 1건을 넣고
   **저장 시도 후에도 solo-1이 localStorage에 남아 있는지** 확인한다.
   변경 B가 막는 코드는 `filter(l => l.groupId !== groupId)`인데 `groupId === undefined`면
   groupId 없는 레코드를 전부 배열에서 떨어뜨리고 `saveLogs`가 그 축소본을 localStorage에 덮어쓴다.
   실제 데이터 삭제 경로를 고정하는 유일한 단언이다.
2. **퇴·액비 분석결과 저장 대상 소실** — 분석 모달 진입 후 `sampleLogs = []` → 저장
   → 실패 안내가 뜬다 (조용한 종료가 아님). 셀렉터: 진입 `.btn-analysis-open`, 저장 `#saveCompostAnalysisBtn`
3. **분석결과 조회 경로 (플랜 리뷰 ⑤)** — `.btn-analysis-open` 클릭 전에 `sampleLogs = []`
   → 토스트가 뜨고 모달이 `hidden`을 유지한다. 변경 C의 6곳 중 조회 3곳이 미검증이면 안 된다.

**회귀 앵커 (신규 테스트 불필요)**: 기존 `edit-mode.spec.js:282`(토양 그룹 수정 폼 밖 필드 보존)가
정상 soil 그룹 경로를 통과시킨다 → 변경 B의 가드가 정상 그룹 수정을 막으면 **그 테스트가 실패**한다.

### 단위 (`tests/unit/edit-mode-guards.test.js`에 추가)

4. `notifyEditTargetMissing`의 세 번째 인자로 문구를 바꿀 수 있고, 생략 시 기본 문구가 쓰인다
5. `ANALYSIS_TARGET_MISSING_MESSAGE !== EDIT_TARGET_MISSING_MESSAGE`이고 둘 다 `'다른 연도'`를 포함한다

## 순서 (플랜 리뷰 MAJOR-1 반영)

1. **SAMPL-2-22 완료 선행** (검사기 확보)
2. 변경 A → B → C → C-2
3. 테스트 D 작성
4. `npm run test:unit`
5. `npm run build` ← `docs/`가 비워지고 번들 해시가 전부 바뀐다
6. 워크플로우 문서를 `docs/00~03`에 재복사 (플랜 리뷰 가드 훅이 `docs/` 경로를 요구하므로 필수 —
   리뷰어는 이 리포에 훅이 없다고 판단했으나, 훅은 글로벌 `~/.claude/hooks/plan-review-guard.sh`에 있고
   실제로 `start_work`를 차단했다)
7. `npm test` (전체 E2E 회귀)
8. `npm run check:docs` (SAMPL-2-22 산출물) — 누락 0건 확인
9. 코드 리뷰 → approve

### 커밋 시 주의 (MAJOR-1의 핵심)

이 티켓은 `src/` 6파일을 고쳐 **모든 번들 해시가 바뀐다**. `src/`만 커밋하면 `docs/`가 어긋난 채
main에 올라가고 Pages가 또 깨진다(v1.17.7이 정확히 그 사고였다). 커밋은 반드시:

```bash
git add -A docs/ src/ tests/ scripts/
git status --short docs/   # D / ?? 가 0건이어야 한다
npm run check:docs         # 누락 0건
```

`docs/03-code-review/*.md` 14건이 빌드로 삭제된 상태라면, `docs-internal/`에 원본이 있으므로
**삭제를 확정해 커밋**한다(direction §4의 `docs-internal/` 결정과 일관 — `docs/`는 Pages 공개 영역이다).

## 영향 범위

- `src/shared/BaseSampleManager.js` (선택적 인자 추가 — 하위 호환)
- `src/soil/soil-script.js` (그룹 가드 1곳)
- `src/compost/compost-script.js`, `src/heavy-metal/heavy-metal-script.js`, `src/pesticide/pesticide-script.js` (각 2곳)
- `src/water/water-script.js` (문구 통일 2곳)
- 테스트 2파일

## 롤백

전부 "실패 시 안내 추가"라 정상 경로 동작을 바꾸지 않는다. 회귀 시 해당 파일 단위로 되돌릴 수 있다.
