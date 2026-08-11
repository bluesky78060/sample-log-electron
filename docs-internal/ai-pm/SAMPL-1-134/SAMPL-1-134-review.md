# SAMPL-1-134 코드 리뷰 — 토양 일괄 완료 선택 배지 미갱신 버그 수정 + 필터 숨김 안내 토스트

- **리뷰 수행**: code-reviewer 에이전트 (Opus)
- **대상 파일**: `src/soil/soil-script.js` (L4139-4150)

## 결과 요약

🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 1건 / 🔵 SUGGESTION: 2건
→ 판정: **APPROVED**

## 리뷰 포인트별 확인

1. **`updateSelectedCount()` 호출 위치**: `filterAndRenderLogs()`로 DOM이 재구성된 뒤 호출되어야 정확한 체크박스 개수를 읽음 — 순서 정확.
2. **`hiddenByFilter` 조건식**: `completedFilter` 옵션값(`''`/`incomplete`/`completed`)과 정확히 매칭. 전체 필터(`''`)에서 오탐 없음.
3. **옵셔널 체이닝**: soil 페이지엔 항상 요소가 존재하나 방어적으로 안전.
4. **문자열/사이드이펙트**: 이상 없음.

## MINOR

- `soil-script.js:4144`: 필터 판정을 DOM(`completedFilter.value`) 대신 내부 상태(`this.currentSearchFilter.completed`)로 읽는 편이 소스 일원화 측면에서 더 견고함. 현재는 change 핸들러로 동기화되어 있어 실제 버그는 아님 — 후속 개선 후보.

## SUGGESTION (범위 외, 후속 티켓 후보)

- `btnBulkDelete` 핸들러도 render 후 `updateSelectedCount()`를 호출하지 않아 동일한 stale-badge 잠재 버그가 있음 — 동일 패턴 적용 검토.
- 필터 안내 문구("미완료"/"완료") 하드코딩이 분산돼 있으나 현재 규모에서는 유지 무방.

## 결론

데이터 저장 로직은 건드리지 않고 화면 버그만 정확히 수정. Playwright 재현으로 배지 제거 동작 확인됨. APPROVED.
