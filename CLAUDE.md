# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

시료 접수 대장 (Sample Log) - 봉화군 농업기술센터에서 사용하는 농업 시료 접수/관리 시스템. Electron 데스크톱 앱 + GitHub Pages 웹 앱 듀얼 환경.

## AI PM 작업 관리 (필수)

이 프로젝트의 모든 작업은 **AI PM System MCP**를 통해 티켓을 발행한 후 진행해야 한다.

- **프로젝트 ID**: `81150a9b-6422-46d9-a0e2-385336cfe038`
- **MCP 서버**: `ai-pm` (배포 DB 사용: `https://ai-pm-system.onrender.com`)
- **데이터베이스**: Render 배포 서버의 PostgreSQL DB (로컬 DB 사용 금지)
- **MCP 설정**: `~/.claude/.mcp.json` → `API_URL=https://ai-pm-system.onrender.com`

### 에픽 ID (대시보드 노출을 위해 create_task 시 반드시 epic_id 명시)

| 에픽 | ID | 용도 |
|------|----|------|
| General | `3fc0cdd8-3f26-4223-bd0a-b63444f25f98` | 일반 버그수정/기능추가 (기본) |
| 코드 품질 관리 | `7e1b839f-2bf2-4b22-aa50-2de74878a4e6` | 코드리뷰/보안/리팩터링 |

> ⚠️ `epic_id` 없이 `project_id`만 넘기면 `epic_id: null`로 저장되어 대시보드에서 보이지 않는다.

### 작업 흐름

1. **작업 시작 전**: `create_task`로 티켓 발행 (제목, 설명, 우선순위, **epic_id** 포함)
2. **작업 진행 중**: `smart_workflow(task_id, 'start_work')`로 in_progress 전환
3. **빌드/테스트**: 실행 후 `smart_workflow(task_id, 'submit_test', test_results=[...])` (build 타입 필수, output 10자+)
4. **코드 리뷰**: code-reviewer로 리뷰 후 `smart_workflow(task_id, 'approve_review', notes='...')` (20자+)
5. 자동 done 전환
6. **대규모 작업**: `create_epic` → `decompose_task`로 하위 태스크 분할

### 코드 리뷰 심각도 분류

리뷰 notes 형식:
```
🔴 CRITICAL: N건 - [내용]
🟠 MAJOR: N건 - [내용]
🟡 MINOR: N건 - [내용]
🔵 SUGGESTION: N건 - [내용]
→ 판정: APPROVED / CHANGES_REQUESTED
```
- CRITICAL/MAJOR 0건 → `approve_review` 진행
- CRITICAL/MAJOR 1건 이상 → `request_changes` → 수정 → 리뷰 (최대 3회 반복)

### 금지 사항

- **epic_id: null로 티켓 발행 절대 금지** (대시보드 미노출)
- 티켓 없이 코드 변경 금지
- `update_task_status`로 testing→review, review→done 직접 전환 금지 (서버 차단됨)
- 빌드 미실행 submit_test / 리뷰 미수행 approve_review 금지

### 사용 가능한 도구

| 도구 | 용도 |
|------|------|
| `create_task` | 새 작업 티켓 발행 |
| `create_epic` | 에픽(대규모 기능) 생성 |
| `decompose_task` | 태스크를 하위 태스크로 분할 |
| `smart_workflow` | 워크플로우 전환 (start_work, submit_test, approve_review) |
| `set_priority` | 우선순위 설정 |
| `add_dependency` | 태스크 간 의존성 추가 |
| `list_tasks` | 태스크 목록 조회 |
| `get_project_status` | 프로젝트 전체 현황 조회 |

## Commands

```bash
# 개발 서버 실행 (Electron)
npm start

# 개발 모드 (DevTools 포함)
npm run start:dev

# 웹 개발 서버 (Vite, localhost:3000)
npm run dev

# Electron + Vite 동시 실행
npm run dev:electron

# Vite 빌드 (Tailwind CSS + 버전 동기화 + 번들링 → docs/ 출력)
npm run build

# Tailwind CSS 빌드 (단독)
npm run build:css

# 패키지 빌드 (build 포함, 현재 OS용)
npm run package

# 설치 파일 생성 (build 포함, Windows: exe, macOS: zip)
npm run make

# E2E 테스트 (Playwright, docs/ 폴더 대상)
npm test                  # 전체 테스트
npx playwright test tests/e2e/search-filter.spec.js  # 단일 테스트
npm run test:ui           # UI 모드
npm run test:report       # 리포트 확인
```

## Architecture

### Dual Environment (Electron + Web)

앱은 Electron 데스크톱과 웹 브라우저 양쪽에서 동작:

- **Electron**: `window.electronAPI`를 통한 파일 시스템, IPC 통신
- **Web**: File System Access API 또는 다운로드 폴백

환경 감지 패턴 (모든 스크립트 공통):

```javascript
const isElectron = window.electronAPI?.isElectron === true;
```

### Process Architecture

```text
Main Process (src/index.js)
├── IPC Handlers: 파일 I/O, 다이얼로그, Firebase 인증, 앱 정보
├── Auto-Updater: electron-updater (GitHub Releases)
├── Path Security: 경로 순회 공격 방지, 허용 디렉토리 검증
└── CSP Headers: Content-Security-Policy 설정

Preload (src/preload.js)
└── contextBridge → window.electronAPI 노출
    ├── 파일: saveFileDialog, openFileDialog, writeFile, readFile
    ├── 자동저장: getAutoSavePath, selectAutoSaveFolder
    └── Firebase: readAuthFile, saveAuthFile, deleteAuthFile
```

### Folder Structure

```text
src/
├── index.js              # Main process
├── preload.js            # Context bridge
├── index.html            # 메인 페이지 (카드 그리드 + 상단 바)
├── main-entry.js         # Vite 진입점 (ES Module)
├── shared/               # 공통 모듈 (~26개, window.* 전역 노출)
├── styles/               # Tailwind input CSS, 테마 색상
├── soil/                 # 토양 시료
├── water/                # 수질분석 시료
├── compost/              # 퇴·액비 시료
├── heavy-metal/          # 토양 중금속 시료
├── pesticide/            # 잔류농약 시료
├── settings/             # 설정 페이지 (Firebase)
├── label-print/          # 라벨 인쇄
├── manual/               # 사용설명서
└── release/              # 릴리즈 노트 페이지

docs/                     # GitHub Pages 배포용 (Vite 번들 빌드 결과물)
tests/e2e/                # Playwright E2E 테스트 (docs/ 대상)
```

### Sample Type Page Pattern

모든 시료 타입(`soil`, `water`, `compost`, `heavy-metal`, `pesticide`)은 동일 패턴:

```text
{type}/
├── index.html           # 페이지 구조 + 스크립트/스타일 로드
├── {type}-script.js     # 비즈니스 로직 (접수, 조회, 내보내기)
└── {type}-style.css     # 타입별 추가 스타일
```

각 스크립트 필수 상수:

```javascript
const SAMPLE_TYPE = '토양';           // 시료 타입명
const STORAGE_KEY = 'soilSampleLogs'; // localStorage 키
const AUTO_SAVE_FILE = 'soil-autosave.json';
```

초기화 흐름: `DOMContentLoaded` → FileAPI 초기화 → Firebase/자동저장 병렬 init → UI 셋업

### Shared Modules (src/shared/)

모든 모듈은 IIFE 또는 클래스로 `window.*`에 전역 노출:

| 모듈                       | 전역 객체                  | 역할                                           |
| -------------------------- | -------------------------- | ---------------------------------------------- |
| `BaseSampleManager.js`     | `BaseSampleManager`        | 모든 시료 타입 공통 CRUD 베이스 클래스         |
| `firestore-db.js`          | `window.firestoreDb`       | Firestore CRUD (compat SDK)                    |
| `storage-manager.js`       | `window.storageManager`    | 듀얼 스토리지: localStorage + Firestore 싱크   |
| `firebase-config.js`       | `window.firebaseConfig`    | Firebase 초기화, 인증 파일 관리                |
| `file-api.js`              | `FileAPI`                  | Electron/Web 파일 시스템 추상화                |
| `constants.js`             | `SampleConstants`          | 전역 상수 (페이지네이션, 타이머, 검증, 버전)   |
| `utils.js`                 | `SampleUtils`              | 유틸리티 (전화번호/면적 포맷, 날짜, UUID)      |
| `pagination.js`            | `PaginationManager`        | 페이지네이션 상태 관리                         |
| `cache-manager.js`         | `CacheManager`             | 매주 금요일 자동 캐시 정리                     |
| `logger.js`                | `window.logger`            | 로깅 (콘솔 + 옵셔널 체이닝)                   |
| `toast.js`                 | -                          | 토스트 알림 UI                                 |
| `tooltip.js`               | -                          | 툴팁 UI                                        |
| `theme.js`                 | -                          | 다크모드/테마 관리                              |
| `excel-import-manager.js`  | `ExcelImportManager`       | 엑셀 가져오기 공통 모듈 (5개 시료 타입 공유)   |
| `search-filter.js`         | -                          | 고급 검색/필터                                  |
| `form-validator.js`        | -                          | 폼 유효성 검사                                  |
| `sync-utils.js`            | -                          | Firestore 동기화 유틸리티                       |
| `auth-file.js`             | -                          | Firebase 인증 파일 관리                         |
| `address.js`               | -                          | 주소 데이터                                     |
| `address-parser.js`        | -                          | 주소 파싱                                       |
| `network-config.js`        | -                          | 네트워크(Firebase) 설정                         |
| `network-access.js`        | -                          | 네트워크 접근 제어                              |
| `main-init.js`             | -                          | 메인 페이지 초기화                              |
| `sanitize.js`              | -                          | XSS 방지, HTML/JSON 새니타이징                 |
| `path-security.js`         | -                          | 경로 검증, traversal 공격 방지                 |

### Data Storage Strategy

```text
localStorage (Primary)
├── {storageKey}_{year}  → 연도별 시료 데이터 (JSON)
├── soilItemsPerPage     → 페이지당 항목 수 설정
└── firebase_config      → Firebase 설정

Firestore (Optional Sync)
├── {type}Samples_{year} → 연도별 컬렉션
└── _system              → 암호화 키/Salt 저장

JSON File (Auto-save)
└── auto-save-{type}-{year}.json → 파일 시스템 백업
```

- 오프라인 우선: localStorage 읽기는 항상 동작, Firestore는 온라인 시 싱크
- Firestore IndexedDB 캐시로 오프라인 쓰기 지원

### Encryption (AES-256-GCM)

> **참고**: 암호화 기능은 테스트 프로젝트(`sample-log-electron-test`)에만 구현되어 있으며, 메인 프로젝트에는 `encryption-manager.js`, `crypto-utils.js`가 존재하지 않음. 메인→테스트 동기화 시 암호화 관련 코드를 덮어쓰지 않도록 주의.

### IPC Communication

Main process와 Renderer 간 통신 (`ipcRenderer.invoke` / `ipcMain.handle`):

| 채널                                                  | 용도                                  |
| ----------------------------------------------------- | ------------------------------------- |
| `save-file-dialog` / `open-file-dialog`               | 파일 다이얼로그                       |
| `write-file` / `read-file`                            | 파일 읽기/쓰기                        |
| `get-auto-save-path`                                  | 연도별 자동 저장 경로                 |
| `select-auto-save-folder` / `get-auto-save-folder`    | 자동저장 폴더 선택/조회               |
| `get-app-path`                                        | 앱 데이터 경로 조회                   |
| `get-app-version`                                     | 앱 버전 조회                          |
| `read-auth-file` / `save-auth-file` / `delete-auth-file` | Firebase 인증 파일 CRUD            |
| `check-auth-file` / `select-auth-file`                | 인증 파일 존재 확인 / 선택 다이얼로그 |

## Development Notes

### src와 docs 동기화

GitHub Pages 배포를 위해 `docs/`는 Vite 번들 빌드 결과물로 생성:

```bash
npm run build    # vite build → docs/ 출력 (Tailwind CSS + 버전 동기화 포함)
```

빌드 파이프라인: `build:css` (Tailwind) → `sync-version` (constants.js 버전 반영) → `vite build` (번들링 → docs/)

### 버전 업데이트

버전은 세 곳에서 관리 (`npm run sync-version`으로 자동 동기화):

1. `package.json` → `version` 필드 (소스)
2. `src/shared/constants.js` → `APP_VERSION` (sync-version으로 자동 반영)
3. `src/index.html` → 폴백 버전 텍스트 (Electron 외 환경용, 수동 수정)

### 릴리스 (GitHub Actions)

태그 푸시 시 Windows 설치 파일 자동 빌드 (.github/workflows/build.yml):

```bash
git tag v1.7.55
git push origin v1.7.55
```

빌드: Windows (windows-latest), Node 20, `npm run make` → GitHub Release 생성

### 테스트 프로젝트 (sample-log-electron-test)

별도 테스트 프로젝트가 존재하며, `test_` 접두사 Firestore 컬렉션 사용. 암호화 관련 파일은 독립 관리되므로 메인→테스트 동기화 시 암호화 코드를 덮어쓰지 않아야 함.

### 새 시료 타입 추가 시

1. `src/{type}/` 폴더 생성 (기존 타입 복사)
2. `SAMPLE_TYPE`, `STORAGE_KEY`, `AUTO_SAVE_FILE` 상수 변경
3. `src/index.html`에 네비게이션 링크 추가
4. `src/shared/firestore-db.js`에 컬렉션 매핑 추가 (필요 시)
5. `docs/`에 동기화

### Build Configuration

- **Electron Forge** + Squirrel (Windows), Zip (macOS), Deb/RPM (Linux)
- **Vite**: 웹 빌드 번들러 (`vite build src` → `docs/` 출력)
- **Tailwind CSS v3**: `src/styles/input.css` → `src/shared/tailwind-output.css`
- **Security Fuses**: ASAR 무결성, nodeOptions/inspection 비활성화
- **Firebase SDK**: Compat 모드 (modular 아님, `firebase: ^12.7.0`)
- **CI 주의**: `network-config.example.js` → `network-config.js` 복사 필요 (빌드 전)
