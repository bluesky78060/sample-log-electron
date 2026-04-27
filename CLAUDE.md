# CLAUDE.md

Claude Code 가이드 문서.

## Project Overview

시료 접수 대장 (Sample Log) - 봉화군 농업기술센터 농업 시료 접수/관리 시스템. **Electron 데스크톱 앱 + GitHub Pages 웹 앱** 듀얼 환경.

## AI PM 작업 관리 (필수)

모든 코드 변경은 **AI PM System MCP** 티켓 발행 후 진행. 전역 워크플로우는 `~/.claude/rules/ai-pm-ticket.md` 참조.

- **프로젝트 ID**: `ca36c527-a379-47e9-bdda-938d57fa916c`
- **프로젝트 코드**: `SAMPL`
- **API URL**: `https://ai-pm-system.onrender.com` (로컬 DB 사용 금지)

### 에픽 ID (`create_task` 시 반드시 명시)

| 에픽           | ID                                     | 용도                            |
| -------------- | -------------------------------------- | ------------------------------- |
| General        | `b0b0e282-9c1d-41ad-986d-3d347077e6a5` | 일반 버그수정/기능추가 (기본)   |
| 코드 품질 관리 | `19f4f1e5-164a-4a2c-a89a-00272d4607bf` | 코드리뷰/보안/리팩터링          |

> ⚠️ `epic_id` 누락 시 대시보드에 노출되지 않음.

### 코드 리뷰 notes 형식

```text
🔴 CRITICAL: N건 / 🟠 MAJOR: N건 / 🟡 MINOR: N건 / 🔵 SUGGESTION: N건
→ 판정: APPROVED / CHANGES_REQUESTED
```

CRITICAL·MAJOR 0건 → `approve_review`, 1건+ → `request_changes` (최대 3회).

### 자동 진행 원칙

사용자가 작업을 요청하면 **중간에 확인 없이 자동으로 전 단계를 완료**한다:
1. 티켓 발행 → start_work → 구현 → 빌드 → submit_test → 코드리뷰 → approve_review 순서를 연속 실행
2. 각 단계 완료 후 "진행할까요?" 묻지 않음
3. CHANGES_REQUESTED 시만 수정 후 재진행, 그 외 자동 완료

## Commands

```bash
npm start              # Electron 실행
npm run start:dev      # DevTools 포함
npm run dev            # Vite 웹 서버 (localhost:3000)
npm run dev:electron   # Electron + Vite 동시
npm run build          # Tailwind + sync-version + Vite → docs/
npm run package        # 현재 OS용 패키지
npm run make           # 설치 파일 (Win: exe, Mac: zip)
npm test               # Playwright E2E (docs/ 대상)
```

자세한 스크립트는 `package.json` 참조.

## Architecture

### Dual Environment (Electron + Web)

- **Electron**: `window.electronAPI` (IPC, 파일 시스템)
- **Web**: File System Access API 또는 다운로드 폴백

```javascript
const isElectron = window.electronAPI?.isElectron === true;
```

### Process Architecture

- **Main** (`src/index.js`): IPC 핸들러, 자동 업데이터 (electron-updater), 경로 보안, CSP
- **Preload** (`src/preload.js`): `contextBridge`로 `window.electronAPI` 노출 (파일 I/O, 자동저장, Firebase 인증)

IPC 채널 전체 목록은 `src/preload.js` 참조.

### Folder Structure

```text
src/
├── index.js, preload.js, index.html, main-entry.js
├── shared/               # 공통 모듈 (~26개, window.* 전역 노출)
├── styles/               # Tailwind input, 테마
├── {soil,water,compost,heavy-metal,pesticide}/   # 5개 시료 타입 (동일 패턴)
└── {settings,label-print,manual,release}/        # 기타 페이지

docs/                     # GitHub Pages 배포용 (Vite 빌드 결과)
tests/e2e/                # Playwright (docs/ 대상)
```

### Sample Type Page Pattern

5개 시료 타입(`soil/water/compost/heavy-metal/pesticide`)은 동일 구조:

```text
{type}/
├── index.html
├── {type}-script.js    # 비즈니스 로직
└── {type}-style.css
```

각 스크립트 필수 상수:

```javascript
const SAMPLE_TYPE = '토양';
const STORAGE_KEY = 'soilSampleLogs';
const AUTO_SAVE_FILE = 'soil-autosave.json';
```

초기화: `DOMContentLoaded` → FileAPI → Firebase/자동저장 병렬 init → UI.

### Shared Modules (src/shared/)

모든 모듈은 `window.*`에 전역 노출. **핵심 모듈만** 명시 (나머지는 파일명으로 유추):

| 모듈                       | 역할                                           |
| -------------------------- | ---------------------------------------------- |
| `BaseSampleManager.js`     | 시료 타입 공통 CRUD 베이스 클래스              |
| `firestore-db.js`          | Firestore CRUD (compat SDK)                    |
| `storage-manager.js`       | 듀얼 스토리지: localStorage + Firestore 싱크   |
| `excel-import-manager.js`  | 엑셀 가져오기 공통 모듈 (5개 시료 공유)        |
| `file-api.js`              | Electron/Web 파일 시스템 추상화                |
| `constants.js`             | 전역 상수 (`APP_VERSION` 포함)                 |
| `sanitize.js`              | XSS 방지, HTML/JSON 새니타이징                 |
| `path-security.js`         | 경로 검증, traversal 공격 방지                 |

기타: `toast`, `tooltip`, `theme`, `logger`, `pagination`, `cache-manager`, `utils`, `search-filter`, `form-validator`, `sync-utils`, `auth-file`, `address(-parser)`, `network-config/access`, `main-init`, `firebase-config`.

### Data Storage Strategy

```text
localStorage (Primary)
├── {storageKey}_{year}  → 연도별 시료 데이터 (JSON)
├── soilItemsPerPage     → 페이지 설정
└── firebase_config      → Firebase 설정

Firestore (Optional Sync)
├── {type}Samples_{year} → 연도별 컬렉션
└── _system              → 암호화 키/Salt 저장

JSON File (Auto-save)
└── auto-save-{type}-{year}.json
```

- 오프라인 우선: localStorage는 항상 동작, Firestore는 온라인 시 싱크
- Firestore IndexedDB 캐시로 오프라인 쓰기 지원

### Encryption (AES-256-GCM)

> ⚠️ 암호화는 **테스트 프로젝트에만 구현**됨 (`sample-log-electron-test`). 메인 프로젝트에는 `encryption-manager.js`, `crypto-utils.js` 없음. **메인→테스트 동기화 시 암호화 코드를 덮어쓰지 말 것.**

## Development Notes

### Build & 버전

- 빌드 파이프라인: `build:css` (Tailwind) → `sync-version` → `vite build` → `docs/`
- 버전 관리 3곳: `package.json` (소스) / `src/shared/constants.js` (자동 동기화) / `src/index.html` (수동, 폴백용)
- `npm run sync-version`으로 constants.js 자동 반영

### 릴리스 (GitHub Actions)

```bash
git tag v1.7.55 && git push origin v1.7.55
```

Windows(windows-latest) + Node 20에서 `npm run make` → GitHub Release 자동 생성. 태그 시 **`src/release/index.html`에 새 버전 항목 추가 필수** (docs/ + 테스트 프로젝트 동기화).

### 새 시료 타입 추가 시

1. `src/{type}/` 폴더 생성 (기존 타입 복사)
2. `SAMPLE_TYPE`, `STORAGE_KEY`, `AUTO_SAVE_FILE` 상수 변경
3. `src/index.html`에 네비게이션 링크 추가
4. `src/shared/firestore-db.js`에 컬렉션 매핑 추가 (필요 시)
5. `docs/`에 동기화

### Build Configuration

- **Electron Forge** + Squirrel(Win) / Zip(Mac) / Deb·RPM(Linux)
- **Vite** (`src` → `docs/`), **Tailwind v3** (`src/styles/input.css` → `src/shared/tailwind-output.css`)
- **Firebase SDK**: Compat 모드 (`firebase: ^12.7.0`)
- **Security Fuses**: ASAR 무결성, nodeOptions/inspection 비활성화
- **CI 주의**: 빌드 전 `network-config.example.js` → `network-config.js` 복사 필요

### 테스트 프로젝트

`sample-log-electron-test`는 `test_` 접두사 Firestore 컬렉션 사용. 암호화 파일은 독립 관리.
