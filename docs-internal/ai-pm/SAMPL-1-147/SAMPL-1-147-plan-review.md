# SAMPL-1-147 플랜 리뷰 (1차)

- 리뷰어: critic 에이전트 (Opus, 독립 레인) + 오케스트레이터 검증
- 대상: `docs/01-plan/SAMPL-1-147-plan.md` (초판)
- 판정: **CHANGES_REQUESTED** → 개정판 반영 완료

## 지적 사항 및 처리

| # | 등급 | 지적 | 오케스트레이터 검증 | 처리 |
|---|---|---|---|---|
| 1 | 🔴 CRITICAL | 중금속 편집 시 `mailDate` + `testResult` 동시 유실 (플랜 범위 밖) | **확인** — `heavy-metal-script.js:1202`(mailDate 일괄 입력), `:515-521`·`:2166`(testResult)가 폼 외부에서 레코드에 직접 쓰는데, `submitForm`은 `sampleLogs[editIdx] = data`로 레코드를 전체 교체 | 변경 E를 중금속까지 확장. `find` 3회 중복도 정리 |
| 2 | 🟠 MAJOR | 변경 B의 `resetForm()` → `e.target.value` 순서 결함으로 **연도 변경이 무효화**됨 | **확인** — `yearSelect`(water/index.html:195)가 `<form id="sampleForm">`(:185) 내부이고, `resetForm()`이 `yearSelect.value = this.selectedYear`로 원복(`BaseSampleManager.js:1386-1387`). 핸들러는 그 뒤에 `e.target.value`를 읽음 | `newYear` 선캡처 + 확인 후 셀렉트 값 재설정 |
| 3 | 🟠 MAJOR | `resetForm()`이 아니라 `cancelEditMode()`가 정식 편집 해제 API (pesticide 잔여 필지 누출) | **확인** — `pesticide-script.js:1070-1085`가 `resetForm()` + subCategory 활성화 + 필지 초기화 | Base에 `cancelEditMode()` 기본 구현(= `resetForm()`) 추가해 계약 정리 |
| 4 | 🟠 MAJOR | 빌드(`emptyOutDir`)가 untracked인 이 티켓 문서를 영구 삭제 | **확인** — `vite.config.js` outDir `../docs`, 프로젝트 메모리에도 기록된 반복 함정 | 원본을 `docs-internal/ai-pm/SAMPL-1-147/`에 두고 `docs/`로 복사. 빌드 후 재복사 |
| 5 | 🟠 MAJOR | 편집 *진입* 실패도 무반응 (`editSample`의 `!log` 분기) | **확인** — `BaseSampleManager.js:1267`, `water-script.js:411`, `:1971`, `:2198` | 변경 C에 진입 경로 4곳 추가 |
| 6 | 🟠 MAJOR | 테스트가 최우선 원인(가짜 성공)을 검증 안 함. Playwright 기본 dismiss 때문에 **확인(accept) 경로가 미검증** | 타당 — 기존 관행 `soil-group-edit.spec.js:16`에 `dialog accept` 선례 있음 | 변경 F로 테스트 항목 재작성: 단위 3건 + E2E 6건, accept/dismiss 양쪽 |
| 7 | 🟠 MAJOR | 원인 ①의 UI 트리거는 연도 변경뿐 → 변경 B 적용 후 ①은 안전망에 불과. 진짜 원인 미확정 가능성 | **확인** — `loadYearData` 호출 지점은 `init()`·Base 연도 change·soil 연도 change 3곳뿐 | ①을 "안전망" 성격으로 문서 명시 + 실패 경로에 `window.logger` 진단 로그 추가 |
| 8 | 🟡 MINOR 1·2 | 실패 문구가 기존 표현과 불일치하고, 실제 트리거(다른 연도)를 지시하지 않음 | 확인 — 기존은 `'수정할 데이터를 찾을 수 없습니다.'` | 문구를 5개 타입 공통으로 통일하고 soil/pesticide도 함께 갱신(영향 범위에 반영) |
| 9 | 🟡 MINOR 3 | 라인 드리프트 2건 (`soil:1946-1949`→`1945-1948`, `setupYearSelection 925-947`→`929-946`) | 확인 | 개정판에서 정정 |
| 10 | 🟡 MINOR 4·5 | `water:414`는 단독으로 무효(이미 문자열), `water:809`/`:819` 반쪽 정규화 누락 | 확인 | `water:414`는 Base와 동일하게 `log.id` 대입으로 통일, 809/819 포함 |
| 11 | 🟡 MINOR 6 | 중금속 실패 후 `editingId` 잔존 | 확인 | **의도적 유지** — 연도를 되돌려 재시도할 수 있어야 함. 안내 문구로 복구 경로 제시 |

## 반영하지 않은 권고

- **`...prev` 전체 전개 + 레거시 배열 `delete`** (Skeptic 관점 대안): 채택하지 않음.
  `samplingLocations`/`samplingCrops`/`samplingNotes`/`sampleNamesPerRow`는 쓰기 지점이 없는 읽기 전용 레거시 필드인데
  `water-script.js:448`이 이를 `samplingLocation`보다 **우선 참조**한다. 전개하면 편집 화면이 낡은 값으로 되돌아가는
  실사용 회귀가 즉시 발생하고, `delete`는 레거시 데이터를 파괴하는 마이그레이션 성격의 별개 결정이라 이 티켓 범위를 넘는다.
  화이트리스트의 구조적 취약점(새 필드 추가 시 재발)은 **"수정 전후 레코드 키 집합 비교" 회귀 테스트**로 막는다.
- **사용자 재확인 1문항** (MAJOR 7 해소책): 프로젝트 자동 진행 원칙에 따라 중단 없이 진행.
  대신 실패 경로 진단 로그로 실제 발생 경로를 사후 특정할 수 있게 한다.

## 리뷰어가 확인해 준 사항 (플랜 근거 보강)

- `confirm()`은 이 프로젝트 관행과 일치 (src 전반 40곳 이상, Electron 렌더러에서 정상 동작)
- 변경 D의 String 통일은 그룹 편집·`editingGroupIds`·`persistRecords(removedIds)`와 **충돌 없음** (해당 경로는 이미 전부 String 정규화)
- 필드 유실 전수 감사: water=`mailDate`만, 중금속=`mailDate`+`testResult`, compost(`Object.assign`)·soil(`...existingLog`)·pesticide(명시 보존)=누락 없음
- 기존 e2e 회귀 위험 없음 — 연도를 바꾸는 기존 테스트 2건은 편집 모드가 아니라 `confirm`이 뜨지 않음
