# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

시료 접수 대장 (Sample Log) - 봉화군 농업기술센터에서 사용하는 농업 시료 접수/관리 시스템. Electron 데스크톱 앱 + GitHub Pages 웹 앱 듀얼 환경.

## Commands

```bash
# 개발 서버 실행 (Electron)
npm start

# 개발 모드 (DevTools 포함)
npm start -- --dev

# 웹 개발 서버 (Vite, docs/ 기반)
npm run dev

# 패키지 빌드 (현재 OS용)
npm run package

# 설치 파일 생성 (Windows: exe, macOS: zip)
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
├── index.html            # 메인 페이지 (시료 타입 선택, 버전 표시)
├── shared/               # 공통 모듈 (~30개, window.* 전역 노출)
├── soil/                 # 토양 시료
├── water/                # 수질분석 시료
├── compost/              # 퇴·액비 시료
├── heavy-metal/          # 토양 중금속 시료
├── pesticide/            # 잔류농약 시료
├── settings/             # 설정 페이지 (Firebase, 암호화)
└── label-print/          # 라벨 인쇄

docs/                     # GitHub Pages 배포용 (src와 동일하게 유지)
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

| 모듈                     | 전역 객체                  | 역할                                           |
| ------------------------ | -------------------------- | ---------------------------------------------- |
| `BaseSampleManager.js`   | `BaseSampleManager`        | 모든 시료 타입 공통 CRUD 베이스 클래스         |
| `firestore-db.js`        | `window.firestoreDb`       | Firestore CRUD (compat SDK)                    |
| `storage-manager.js`     | `window.storageManager`    | 듀얼 스토리지: localStorage + Firestore 싱크   |
| `firebase-config.js`     | `window.firebaseConfig`    | Firebase 초기화, 인증 파일 관리                |
| `file-api.js`            | `FileAPI`                  | Electron/Web 파일 시스템 추상화                |
| `constants.js`           | `SampleConstants`          | 전역 상수 (페이지네이션, 타이머, 검증)         |
| `utils.js`               | `SampleUtils`              | 유틸리티 (전화번호/면적 포맷, 날짜, UUID)      |
| `encryption-manager.js`  | `window.encryptionManager` | AES-256-GCM 암호화 라이프사이클                |
| `crypto-utils.js`        | `window.CryptoUtils`       | PBKDF2 키 유도, 암/복호화, 비밀번호 검증 UI    |
| `PaginationManager.js`   | `PaginationManager`        | 페이지네이션 상태 관리                         |
| `cache-manager.js`       | `CacheManager`             | 매주 금요일 자동 캐시 정리                     |
| `sanitize.js`            | -                          | XSS 방지, HTML/JSON 새니타이징                 |
| `path-security.js`       | -                          | 경로 검증, traversal 공격 방지                 |

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

민감 필드(이름, 전화번호, 주소 등)는 레코드 단위 암호화:

- `crypto-utils.js`: PBKDF2 키 유도 + AES-256-GCM 암/복호화
- `encryption-manager.js`: 키 파일 로드 → 비밀번호 입력 → 마스터키 유도 → 세션 유지
- 암호화된 레코드는 `_enc` 필드에 IV+CT 저장, 원본 필드는 삭제
- 비밀번호 변경 시 모든 데이터 재암호화 + 롤백 메커니즘

### IPC Communication

Main process와 Renderer 간 통신 (`ipcRenderer.invoke` / `ipcMain.handle`):

| 채널                                                | 용도                                  |
| --------------------------------------------------- | ------------------------------------- |
| `save-file-dialog` / `open-file-dialog`             | 파일 다이얼로그                       |
| `write-file` / `read-file`                          | 파일 읽기/쓰기                        |
| `get-auto-save-path`                                | 연도별 자동 저장 경로                 |
| `read-auth-file` / `save-auth-file`                 | Firebase 인증 파일                    |
| `read-key-file`                                     | 암호화 키 파일 로드                   |
| `save-salt` / `load-salt`                           | PBKDF2 Salt 관리                      |
| `store-session-password` / `get-session-password`   | 세션 비밀번호 (메인 프로세스 메모리)  |
| `get-app-version`                                   | 앱 버전 조회                          |

## Development Notes

### src와 docs 동기화

GitHub Pages 배포를 위해 `docs/` 폴더는 `src/`와 동일하게 유지:

```bash
rsync -av --delete --exclude='*.backup' src/ docs/
```

### 버전 업데이트

버전은 두 곳에서 관리 (반드시 함께 수정):

1. `package.json` → `version` 필드
2. `src/index.html` → 폴백 버전 텍스트 (Electron 외 환경용)

### 릴리스 (GitHub Actions)

태그 푸시 시 Windows 설치 파일 자동 빌드 (.github/workflows/build.yml):

```bash
git tag v1.7.52
git push origin v1.7.52
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
- **Security Fuses**: ASAR 무결성, nodeOptions/inspection 비활성화
- **Firebase SDK**: Compat 모드 (modular 아님)
