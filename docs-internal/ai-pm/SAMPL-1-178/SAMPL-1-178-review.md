# SAMPL-1-178 코드 리뷰 — [운영] 경지구분이 다른 같은 번호 시료가 함께 완료·분석값 공유되는 결함

대상: 메인 브랜치 bluesky78060/sampl-1-178-landclass-fix, 커밋 b4859cb(작업자) · 3ba64db(Fable 둘째 레인 수정), 기준 origin/main 1cdb4d5.

## 3중 검증
1. code-reviewer (Claude Opus) — b4859cb: 🔴0 🟠0 🟡2 🔵5 → APPROVED. build·typecheck·check:docs·vitest 538·전체 E2E 475/0 재현, 변이 M1a~M6 재현, 전 경로 전수 조사에서 혼입 결함 없음. 기록: review-cr-1-178.md
2. Fable review (다른 시각의 둘째 레인 — codex 5계정 한도·gemini 402 로 대체) — b4859cb 반증 실패, 대신 가져오기 두 경로의 혼입을 재현·수정(3ba64db):
   - 🟠 흙토람 결과 가져오기 keyMap 이 같은 번호의 다른 경지구분 시료에 저장 순서 따라 분석값을 넣음(재현) → 후보 1건일 때만 매칭, 모호하면 미매칭+사유.
   - 🟡 토양 공통 엑셀 가져오기가 경지구분 무시(재현) → numberScopeFilter. (재리뷰 결과: UI 에서 도달 불가한 경로 — 방어 코드)
   - 일괄 완료 E2E 추가. 전체 E2E 482/0, 변이 MX1·MX2·M1b·MH1. 기록: SAMPL-1-178-fable-review.md(브랜치)
3. 적대적 검증 — code-reviewer 재리뷰(3ba64db): 🔴0 🟠0 🟡1 🔵4 → APPROVED. 재빌드 docs diff 0, 금지 파일 0, vitest 538, 전체 E2E 481/1(부하 플레이키, 단독 재실행 통과). 변이 MX1·MH1 재현, 추가 변이 MB(첫 행 매칭) 잡힘, MA(전 타입 필터) 생존 — 실데이터 동작 동일, node 차등 테스트 20,000건이 잡음(5,426 불일치). 4개 타입(물·퇴비·중금속·잔류농약) 차등 테스트 불일치 0.

## 판정
🔴 CRITICAL: 0건 / 🟠 MAJOR: 0건 / 🟡 MINOR: 3건 / 🔵 SUGGESTION: 9건
→ 판정: APPROVED

## 배포 시 주의
- docs 재빌드로 DOMPurify 3.4.7→3.4.13 반영(lock 기준 — 운영 docs 가 오래된 node_modules 로 빌드돼 있었음). PR 본문에 명시. 메인 체크아웃 node_modules 는 npm ci 필요.
- 후속: SAMPL-1-182(비차단 지적 묶음).
