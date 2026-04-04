# App Planner - MCP 기반 앱 개발 플래닝 & 자율 오케스트레이션

> **버전**: v2.0 | **작성일**: 2026-03-26 | **작성자**: Claude Code

## 개요

`/app-planner`는 Claude Code 커스텀 커맨드로, 사용자와의 **6단계 인터뷰**를 통해 체계적인 앱 개발 계획을 수립하고, **AI 팀이 자율적으로 구현까지 완수**합니다.

### v2.0 변경사항
- **자율 오케스트레이션 추가**: 플랜 확정 후 AI가 자동으로 팀 편성 → 상세 플랜 → 검증 → 구현
- **인간 개입 최소화**: 인터뷰 + 최종 확인 외에는 AI가 모든 판단 수행
- **자동 플랜 검증**: 메인 오케스트레이터가 각 에이전트 플랜을 5가지 기준으로 검증
- **Wave 기반 병렬 실행**: 의존성 그래프에 따른 최적 병렬 구현

## 전체 워크플로우

```
[사용자] ←→ [인터뷰 6단계] → [마스터 플랜] → [사용자 확인]
                                                    ↓
                                            [이후 AI 자율 수행]
                                                    ↓
                                        [작업 분해 & 팀 편성]
                                                    ↓
                                    [에이전트별 상세 플랜 작성] (병렬)
                                                    ↓
                                    [메인 오케스트레이터 검증] (자동)
                                        ↙           ↘
                                APPROVED      REVISION_REQUIRED
                                    ↓              ↓
                                [구현]      [수정 지시 → 재검증]
                                    ↓          (최대 2회)
                            [Wave별 병렬 구현]
                                    ↓
                            [통합 검증 & 완료 보고]
```

## 구성 파일

| 파일 | 위치 | 역할 |
|------|------|------|
| `app-planner.md` | `~/.claude/commands/` | 슬래시 커맨드 정의 (글로벌) |
| `app-planner-trigger.sh` | `~/.claude/hooks/` | 키워드 자동 감지 hook (글로벌) |
| `settings.json` | `~/.claude/` | hook 등록 (UserPromptSubmit) |

## 사용법

### 방법 1: 직접 호출

```
/app-planner
/app-planner 할일 관리 앱
/app-planner todo app with Firebase
```

### 방법 2: 자동 감지

앱 개발 관련 키워드를 입력하면 hook이 자동 감지하여 `/app-planner` 실행을 안내합니다.

**감지 키워드 예시:**

| 언어 | 키워드 |
|------|--------|
| 한국어 | 앱 만들어, 프로젝트 시작, 서비스 개발, 대시보드 만들어, MVP 만들어, 개발해줘 |
| 영어 | build me, create an app, I want to build, let's build, scaffold, new project |
| 일본어 | アプリ作って, サイト作って, プロジェクト作 |
| 중국어 | 做一个应用, 开发一个, 新建项目 |

---

## PART A: 인터뷰 프로세스 (6단계)

플래너는 `AskUserQuestion` 도구를 사용하여 클릭 가능한 선택지로 질문합니다.

### Phase 1: 앱 개요 파악

| 질문 | 선택지 |
|------|--------|
| 앱 유형 | 웹 앱 / 데스크톱 앱 / 모바일 앱 / 풀스택 앱 |
| 앱 목적 | 업무 관리 / 데이터 관리 / 커뮤니티 / 커머스·비즈니스 |
| 대상 사용자 | 개인용 / 소규모 팀 / 기업용 / 일반 대중 |

### Phase 2: 핵심 기능 정의

| 질문 | 선택지 |
|------|--------|
| 인증 방식 | 불필요 / 기본 로그인 / 소셜 로그인 / 역할 기반 권한 |
| 데이터 저장 | 로컬만 / 클라우드 DB / 로컬+클라우드 동기화 |
| 핵심 기능 (복수) | CRUD / 검색·필터 / 파일 업로드 / 실시간 알림 / 대시보드·차트 / 내보내기 / 다국어 |

### Phase 3: 기술 스택 & MCP 서비스

**사용 가능한 MCP 서비스:**

| MCP 서버 | 용도 | 적합한 경우 |
|----------|------|------------|
| Firebase | 인증, Firestore DB, Storage, Hosting | 빠른 백엔드 구축, 실시간 데이터 |
| Neon | 서버리스 PostgreSQL | 복잡한 관계형 데이터, SQL 필요 |
| Playwright | 브라우저 자동화, E2E 테스트 | QA 자동화, 크롤링 |
| Canva | 디자인 에셋 생성, 이미지 편집 | 마케팅 자료, 썸네일 |
| Pencil | UI/UX 디자인 (.pen 파일) | 목업, 프로토타입 디자인 |
| Context7 | 라이브러리 최신 문서 참조 | 새 라이브러리 학습 |
| 21st Magic | UI 컴포넌트 생성 | 빠른 컴포넌트 제작 |

### Phase 4: 데이터 모델 & 화면 구성
### Phase 5: 배포 & 운영
### Phase 6: 추가 요구사항

---

## PART B: 마스터 플랜 → 사용자 확인

인터뷰 완료 후 마스터 플랜 문서 생성 → `docs/01-plan/`에 저장 → 사용자 최종 확인 1회

---

## PART C: 자율 오케스트레이션 (AI 완전 자동)

사용자 확인 후 AI가 자율적으로 수행하는 5단계:

### Step 1: 작업 분해 & 팀 편성

| 작업 유형 | 배정 에이전트 | 모델 |
|-----------|-------------|------|
| 프로젝트 초기 셋업 | `executor` | sonnet |
| DB 스키마/마이그레이션 | `executor` | sonnet |
| 백엔드 API/서비스 | `executor` | sonnet |
| 복잡한 비즈니스 로직 | `executor-high` | opus |
| UI 컴포넌트/페이지 | `designer` | sonnet |
| 복잡한 UI 시스템 | `designer-high` | opus |
| 인증/보안 | `executor` + `security-reviewer` | sonnet/opus |
| 문서/README | `writer` | haiku |
| 테스트 코드 | `tdd-guide` | sonnet |
| 빌드 에러 수정 | `build-fixer` | sonnet |

### Step 2: 에이전트별 상세 플랜 작성 (병렬)

각 에이전트가 담당 작업의 상세 구현 플랜 작성 (코드 X, 플랜만)

### Step 3: 메인 오케스트레이터 자동 검증

**5가지 검증 기준:**
1. 마스터 플랜 정합성
2. 파일 충돌 없음
3. 의존성 순서 올바름
4. 기술적 실현 가능성
5. 완전성 (에러 처리, 엣지케이스)

- APPROVED → 구현 진행
- REVISION_REQUIRED → 수정 지시 (최대 2회, 3회째는 메인이 직접 수정)

### Step 4: Wave 기반 병렬 구현

```
Wave 1: [의존성 없는 작업들] → 병렬 실행
    ↓ (빌드 검증)
Wave 2: [Wave 1에 의존하는 작업들] → 병렬 실행
    ↓ (빌드 검증)
Wave 3: ...
```

### Step 5: 통합 검증 & 완료 보고

1. 빌드 검증
2. 코드 리뷰 (`code-reviewer`)
3. 보안 검토 (`security-reviewer`, 해당 시)
4. 사용자에게 최종 완료 보고

---

## PART D: 비상 프로토콜

### 사용자 개입이 필요한 경우만
1. 동등한 기술적 선택지가 있고 AI 판단 불가
2. 마스터 플랜에 없는 기능이 필요
3. 같은 문제로 3회 이상 실패
4. API 키 등 사용자만 제공 가능한 정보 필요

### AI가 자율 판단하는 경우
- 라이브러리 버전, 파일 구조, 코드 패턴, 에러 처리, 빌드 에러 수정, 플랜 수정 지시

---

## Hook 동작 원리

```
사용자 입력 → UserPromptSubmit 이벤트
  → app-planner-trigger.sh 실행
    → 키워드 매칭 (grep -iE)
      → 매칭됨: "[App Planner] ..." 메시지 출력 → Claude가 /app-planner 실행
      → 매칭 안됨: 아무 출력 없음 (무시)
```

---

## 설정 위치

### 글로벌 (모든 프로젝트 적용)

```
~/.claude/
├── commands/app-planner.md          # 커맨드 정의
├── hooks/app-planner-trigger.sh     # 키워드 감지 hook
└── settings.json                    # hook 등록
```

---

## 트러블슈팅

| 문제 | 원인 | 해결 |
|------|------|------|
| 키워드 입력해도 감지 안됨 | hook 미등록 또는 스크립트 실행 권한 없음 | `chmod +x ~/.claude/hooks/app-planner-trigger.sh` 확인 |
| `/app-planner` 명령어 없음 | 커맨드 파일 없음 | `~/.claude/commands/app-planner.md` 존재 확인 |
| 자율 오케스트레이션 안됨 | 에이전트 도구 사용 불가 | Agent/Task 도구 권한 확인 |
| AskUserQuestion이 안 뜸 | Claude Code 버전 이슈 | 최신 버전 업데이트 |
