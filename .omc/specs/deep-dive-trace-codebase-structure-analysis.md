# Deep Dive Trace: codebase-structure-analysis

날짜: 2026-06-07 | 대상: sample-log-electron | 유형: 브라운필드 아키텍처 탐색

## Observed Result

코드베이스 전체 구조 분석 요청. 사전 탐색에서 5개 시료 스크립트 합계 ~16,800줄(soil 4,594 / pesticide 4,408 / compost 2,853 / water 2,589 / heavy-metal 2,341), shared 모듈 33개, BaseSampleManager 1,122줄 확인.

## Ranked Hypotheses

| Rank | Hypothesis | Confidence | Evidence Strength | Why it leads |
|------|------------|------------|-------------------|--------------|
| 1 | L1: 공통화 불완전 — 복사-붙여넣기 중복 잔존 | High (85%) | Strong | 비트 단위 동일 코드 280줄+ 직접 확인, 6개 핵심 메서드 100% 오버라이드, 상속 효율 38.4% |
| 2 | L3: 문서-구현 불일치 | High (99%) | Strong | 파일 시스템 직접 검증: 모듈 5개·폴더 5개 미기재, docs-internal 14K줄 미언급 |
| 3 | L2: 듀얼 환경/스토리지 정합성 리스크 | Medium-High | Strong (구조) / Medium (실손실) | 구조적 리스크는 확실하나 실제 데이터 유실 발생 여부는 런타임 미검증 |

## Evidence Summary by Hypothesis

### L1 — 코드 중복/공통화 한계 (STRONGLY SUPPORTED)
- 5개 스크립트에 **정확히 동일한 주소 파싱 코드 20줄** 중복: soil-script.js:2020, water-script.js:499, pesticide-script.js:1070, compost-script.js:653, heavy-metal-script.js:391 (~80줄 순수 중복)
- 6개 핵심 메서드(submitForm, resetForm, editSample, filterAndRenderLogs, prepareDataForRender, migrateCompletedField)를 **5개 스크립트 모두 동일 패턴으로 재구현** (BaseSampleManager에 없음)
- 상속 효율성 38.4% (목표 >60%)
- 확인된 중복 블록: 폼 필드 채우기 100줄, 그룹 멤버 로직 50줄, 우편 모달 80줄, 라벨 인쇄 40줄 → **확인 중복 280줄+, 리팩토링 가능 추정 500–800줄**

### L2 — 듀얼 환경/듀얼 스토리지 정합성 (STRONGLY SUPPORTED, 구조적)
- **isElectron 분기 우회 40+곳**: file-api.js:10의 중앙 추상화를 우회한 직접 분기 (water-script, settings-script 4곳, soil-script.js:3378, logger.js:17-18 등)
- **Fire-and-Forget 싱크**: storage-manager.js:85-98 — localStorage 동기 저장 후 Firestore 비동기 결과 무시
- sync-utils.js:121-135 — syncedAt 기반 자동 삭제 로직 (유실 위험 연계)
- Electron만 자동저장 JSON 생성 (index.js:908-937), Web은 미지원 (file-api.js:145-151) → 환경별 백업 비대칭
- docs/ 빌드 산출물을 git 커밋 + **docs/ 직접 수정 커밋 이력 존재** → 소스-산출물 불일치 리스크

### L3 — 문서-구현 불일치 (STRONGLY SUPPORTED)
- CLAUDE.md "shared 모듈 ~26개" vs 실제 31~33개 파일 (~20% 과소 기재)
- 미기재 핵심 모듈 5개: autocomplete-manager.js, juso-service.js, mrl-api.js, pesticide-data.js, pesticide-name-map.js
- 미기재 기능 폴더 5개: compost-analysis, heavy-metal-analysis, pesticide-analysis, water-analysis, **heuktoram** (프로젝트 메모리상 hot path 3위인데 문서 부재)
- docs-internal/ 14,094줄 내부 문서가 CLAUDE.md에 0회 언급
- 구현 양식 변경: 문서는 const 기반 패턴, 실제는 클래스 생성자 옵션 기반 (water, heavy-metal)

## Evidence Against / Missing Evidence

- **L1 반증**: soil의 필지/작물 관리(~1,000줄)는 정당한 도메인 특화. BaseSampleManager + ExcelImportManager로 부분 공유는 이미 존재
- **L2 반증**: file-api.js 추상화 자체는 잘 설계됨. Firestore IndexedDB 캐시로 오프라인 쓰기 일부 보호
- **L3 반증**: 버전 3곳 동기화 정확(1.14.1), 필수 상수 5개 스크립트 모두 준수, tests/e2e·Playwright 설정 일치, BaseSampleManager 상속 패턴·window.* 전역 노출 기술 정확

## Per-Lane Critical Unknowns

- **Lane 1 (코드 중복)**: submitForm() 등 6개 메서드를 BaseSampleManager로 올리지 않은 것이 의도적 결정인가, 리팩토링 미완료인가? (Template Method 패턴 도입 여부 판단 필요)
- **Lane 2 (듀얼 스토리지)**: Firestore 저장 실패 시 로컬 syncedAt 필드가 설정되는가? (설정된다면 sync-utils의 자동 삭제와 결합해 실제 데이터 유실 가능 — 런타임 테스트 필요)
- **Lane 3 (문서 갭)**: 미기재 모듈 5개(autocomplete-manager, juso-service, mrl-api 등)가 프로덕션 활성 기능인가 dead code인가?

## Rebuttal Round

- **리더(L1)에 대한 최강 반박**: "중복은 양적 문제일 뿐, 실질 위험은 L2의 데이터 정합성이다. 중복 코드는 동작하지만 fire-and-forget 싱크는 사용자 데이터를 잃을 수 있다."
- **리더가 유지된 이유**: L1은 증거가 비트 단위로 확정적(High 85%)이고, L2의 실손실은 런타임 미검증(Medium). 다만 **수정 우선순위는 L2가 앞설 수 있음** — 확실성 순위 ≠ 위험 순위.

## Convergence / Separation Notes

- L1과 L3은 동일 기저 메커니즘으로 부분 수렴: **"점진적 복사-확장 성장 + 아키텍처 통합/문서화 후행"**. 새 시료 타입을 기존 타입 복사로 추가하는 공식 패턴(CLAUDE.md에 명시됨)이 중복과 문서 부채를 동시에 생산.
- L2는 독립적 메커니즘(동시성/정합성 설계 결함)으로 분리 유지.

## Most Likely Explanation

이 코드베이스는 "기존 타입 복사 → 상수 변경" 방식의 공식 확장 패턴으로 성장했고, BaseSampleManager/ExcelImportManager로 공통화를 시작했으나 Template Method 수준까지 완료하지 못해 핵심 메서드 6개와 280~800줄의 중복이 잔존한다. 같은 성장 방식이 문서 부채(모듈 5개·폴더 5개 미기재)를 낳았으며, 별도로 듀얼 스토리지 싱크에 fire-and-forget 구조 리스크가 존재한다.

## Critical Unknown (종합)

**무엇을 먼저 고칠 것인가에 대한 사용자의 위험 선호**: 확실하지만 양적인 부채(L1 중복), 잠재적이지만 치명적인 리스크(L2 데이터 유실), 즉시 수정 가능한 저비용 항목(L3 문서) 중 우선순위.

## Recommended Discriminating Probe

L2 핵심 미지수 해소가 최우선: storage-manager.js:85-98의 Firestore 실패 경로에서 syncedAt 설정 여부를 코드 추적 + 오프라인 시뮬레이션으로 검증 → 유실 가능이면 L2가 P0로 승격.
