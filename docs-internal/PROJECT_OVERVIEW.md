# 시료접수대장 (Sample Log) 프로젝트 상세 문서

## 1. 프로젝트 개요

### 1.1 목적

**시료접수대장**은 봉화군 농업기술센터 안전성분석센터에서 사용하는 **농업 시료 접수/관리 시스템**입니다. 토양, 수질, 퇴·액비, 중금속, 잔류농약 5가지 시료 유형의 접수부터 분석결과 입력, 엑셀 내보내기까지 전 과정을 관리합니다.

### 1.2 사용자

- **주 사용자**: 봉화군 농업기술센터 안전성분석센터 직원
- **사용 환경**: Windows 데스크톱 (Electron 앱), 웹 브라우저 (GitHub Pages)
- **사용 목적**: 농가 시료 접수, 분석결과 기록, 행정 보고서 출력

### 1.3 기술 스택

| 카테고리 | 기술 |
|----------|------|
| **프레임워크** | Electron 39.2.6 (데스크톱), Vite 5 (웹 빌드) |
| **언어** | JavaScript (ES2020+), HTML5, CSS3 |
| **스타일** | Tailwind CSS v3, 커스텀 CSS (5,700+ 줄) |
| **데이터베이스** | localStorage (Primary), Firebase Firestore (Optional Sync) |
| **빌드** | Electron Forge (패키징), Vite (번들링), Tailwind (CSS) |
| **CI/CD** | GitHub Actions (Windows 빌드 + GitHub Releases) |
| **테스트** | Playwright (E2E) |
| **라이브러리** | Firebase SDK ^12.7.0, SheetJS (xlsx), DOMPurify |

### 1.4 버전

- **현재 버전**: v1.8.0
- **릴리즈 방식**: Git 태그 → GitHub Actions → Windows 설치 파일 자동 빌드
- **자동 업데이트**: electron-updater (GitHub Releases 피드)

---

## 2. 실행 환경

### 2.1 듀얼 환경 (Electron + Web)

```
┌─────────────────────────────────────────────┐
│              Electron 데스크톱                │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Main Process│  │  Renderer (BrowserW) │  │
│  │ (Node.js)   │←→│  (Chromium)           │  │
│  │ - IPC       │  │  - window.electronAPI │  │
│  │ - 파일 I/O  │  │  - Firebase           │  │
│  │ - 자동업데이트│  │  - UI 렌더링          │  │
│  └─────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              웹 브라우저 (GitHub Pages)       │
│  ┌──────────────────────────────────────┐   │
│  │  동일 Renderer 코드                    │   │
│  │  - File System Access API (폴백: 다운로드)│   │
│  │  - Firebase                           │   │
│  │  - UI 렌더링                           │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

환경 감지:
```javascript
const isElectron = window.electronAPI?.isElectron === true;
```

### 2.2 프로세스 아키텍처

**Main Process** (`src/index.js`):
- 창 관리 (BrowserWindow)
- IPC 핸들러 (18채널)
- 자동 업데이터 (electron-updater)
- CSP 보안 헤더 설정
- 경로 보안 검증 (traversal 방지)
- 분석결과 팝업 창 관리
- VWORLD 지오코딩 프록시 (CORS 우회)

**Preload** (`src/preload.js`):
- `contextBridge`로 `window.electronAPI` 노출
- 18개 IPC 채널 (파일 I/O, 인증, 분석 팝업, 시스템)

---

## 3. 폴더 구조

```
src/
├── index.js                # Main Process (Electron)
├── preload.js              # Context Bridge
├── index.html              # 홈 페이지 (5개 시료 카드 그리드)
├── main-entry.js           # Vite 진입점
├── style.css               # 전역 CSS (5,700+ 줄)
├── styles/
│   ├── input.css            # Tailwind 진입점
│   └── theme-colors.css     # 시료별 테마 색상 변수
│
├── shared/                  # 공통 모듈 (~26개)
│   ├── BaseSampleManager.js # 시료 관리 베이스 클래스
│   ├── storage-manager.js   # 듀얼 스토리지 (localStorage + Firestore)
│   ├── firestore-db.js      # Firestore CRUD (compat SDK)
│   ├── firebase-config.js   # Firebase 초기화
│   ├── file-api.js          # 파일 시스템 추상화
│   ├── constants.js         # 전역 상수 (APP_VERSION 포함)
│   ├── excel-import-manager.js # 엑셀 가져오기 3단계 마법사
│   ├── sanitize.js          # XSS 방지 (DOMPurify)
│   ├── path-security.js     # 경로 traversal 방지
│   ├── mrl-api.js           # 식품안전나라 MRL API 모듈
│   ├── pesticide-name-map.js # 농약명 영한 매핑 (551건)
│   ├── pesticide-data.js    # 잔류농약 525종 데이터
│   └── (기타 13개)           # toast, theme, logger, pagination 등
│
├── soil/                    # 토양 시료
│   ├── index.html
│   ├── soil-script.js       # SoilSampleManager extends BaseSampleManager
│   └── soil-style.css
├── water/                   # 수질 시료
├── compost/                 # 퇴·액비 시료
├── heavy-metal/             # 토양 중금속 시료
├── pesticide/               # 잔류농약 시료
│
├── heuktoram/               # 흙토람 연동 (토양 분석결과 → 국가 시스템 양식)
├── water-analysis/          # 수질 분석결과 조회
├── pesticide-analysis/      # 잔류농약 분석결과 조회
├── compost-analysis/        # 퇴·액비 분석결과 조회
├── heavy-metal-analysis/    # 중금속 분석결과 조회
│
├── settings/                # 설정 페이지
├── label-print/             # 라벨 인쇄
├── manual/                  # 사용 설명서
└── release/                 # 릴리즈 노트

docs/                        # GitHub Pages 배포용 (Vite 빌드 결과)
tests/e2e/                   # Playwright E2E 테스트
scripts/                     # 빌드/매핑 스크립트
.github/workflows/           # CI/CD
```

---

## 4. 기능 상세

### 4.1 홈 페이지

| 기능 | 설명 |
|------|------|
| 시료 카드 그리드 | 5개 시료 타입 카드 (토양/수질/퇴액비/중금속/잔류농약) |
| 클라우드 동기화 | 전체 시료 타입 × 전체 연도 양방향 싱크 |
| 다크모드 토글 | 라이트/다크 테마 전환 |
| 기관명 표시 | 설정에서 커스터마이징 가능 |
| 버전 표시 | Electron 또는 constants.js에서 자동 감지 |
| 주간 캐시 정리 | 매주 금요일 자동 실행 |

### 4.2 시료 접수 페이지 (5개 공통)

#### 공통 기능

| 기능 | 설명 |
|------|------|
| **접수 폼** | 접수번호(자동), 접수일자, 성명, 전화번호, 주소(카카오 우편번호 API), 수령방법 |
| **목록 뷰** | 페이지네이션 테이블 (10~500행), 완료/미완료 상태, 체크박스 선택 |
| **검색/필터** | 성명, 접수번호, 날짜 범위, 필지주소, 목적, 완료 상태 |
| **엑셀 내보내기** | 스타일 포함 .xlsx 파일 생성 (xlsx-js-style) |
| **엑셀 가져오기** | 3단계 마법사 (파일선택 → 컬럼 매핑 → 미리보기/확인) |
| **JSON 백업** | 수동 저장/복원 |
| **자동 저장** | 토글 가능, 폴더 선택, 연도별 JSON 파일 |
| **일괄 완료** | 선택된 시료 일괄 완료 처리 |
| **일괄 삭제** | 선택된 시료 삭제 |
| **발송일자** | 시료 발송 날짜 일괄 입력 |
| **라벨 인쇄** | 라벨 인쇄 페이지로 이동 |
| **통계** | 구분별/목적별/월별 통계 모달 |
| **시료 타입 전환** | 드롭다운으로 5개 타입 간 빠른 이동 |
| **다크모드** | 완전한 다크 테마 지원 |

#### 토양 (Soil) 전용

| 기능 | 설명 |
|------|------|
| 필지 시스템 | 한 접수에 여러 필지 (필지주소, 작물, 면적, 하위필지) |
| 구분 | 논/밭/과수/시설/임야/성토 |
| 목적(용도) | 일반재배/무농약/유기/GAP/저탄소 |
| 지역 선택 | 봉화군/영주시/울진군 지역 모달 |
| 작물 면적 관리 | 작물별 면적 입력 모달 |
| 흙토람 연동 | 국가 토양 검사 시스템 양식 내보내기 |

#### 수질 (Water) 전용

| 기능 | 설명 |
|------|------|
| 신청인 구분 | 개인(주민번호) / 법인(사업자번호) |
| 검사항목 | 생활용수 21항목 / 농업용수 17항목 |
| 시료명 | 지하수/지표수/기타 |
| 채취장소 | 행별 개별 시료명 입력 |
| 분석결과 입력 | 20항목 모달 (pH, EC, 대장균군, 질산성질소, 다이아지논, 파라티온 등) |

#### 퇴·액비 (Compost) 전용

| 기능 | 설명 |
|------|------|
| 유형 | 퇴비/액비 |
| 축종 | 소/돼지/닭/오리/말/혼합/기타 |
| 분석항목 | 함수율/부숙도/염분/구리/아연 (축종별 기준) |

#### 토양 중금속 (Heavy Metal) 전용

| 기능 | 설명 |
|------|------|
| 분석항목 | 8항목 (Cd/Cu/As/Hg/Pb/Cr6+/Zn/Ni) |
| 기준 | 토양오염우려기준 1/2/3지역 |

#### 잔류농약 (Pesticide) 전용

| 기능 | 설명 |
|------|------|
| 신청인 구분 | 개인/법인 |
| 의뢰물품 | 생산물/작물체/가공품 |
| 농약 자동완성 | 525종 GC/LC 구분 자동완성 |
| MRL 자동 조회 | 식품안전나라 API 연동 (18,129건) |
| 영한 매핑 | 525종 영문 → 한글 99.8% 매핑 |
| 작물 별명 | 159건 (서리태→대두, 찰옥수수→옥수수 등) |
| 계층 조회 | 개별식품 → 별명 → 중분류 fallback |
| Original/Acid | 2행 구조 분석값 입력 |
| 정성 46종 | 파란색 강조 표시 |
| 자동 판정 | 검출량 vs MRL → 적합/부적합 뱃지 |

### 4.3 분석결과 조회 페이지 (5개)

Electron에서는 팝업 창, 웹에서는 새 탭으로 열림.

| 페이지 | 기능 |
|--------|------|
| **흙토람** | 토양 분석결과 일괄 편집, 수집년도/분석관/검사일 설정, 국가 시스템 호환 양식 내보내기 |
| **수질 분석결과** | 검사일 + 20항목 결과 입력, 생활/농업용수 필터, 엑셀 내보내기 |
| **잔류농약 분석결과** | 검출/불검출/미입력 필터, MRL 기준값 자동 표시, 엑셀 내보내기 |
| **퇴·액비 분석결과** | 시료별 결과 표시, 엑셀 내보내기 |
| **중금속 분석결과** | 시료별 8항목 결과, 엑셀 내보내기 |

### 4.4 설정 페이지

| 섹션 | 기능 |
|------|------|
| **Firebase 인증 파일** | firebase-auth.json 업로드/선택/삭제, 연결 테스트, 수동 설정 입력 |
| **기관명** | 표시 기관명 커스터마이징 |
| **네트워크 접근 제어** | 웹 환경 IP 기반 게이트웨이 제한 |
| **데이터 마이그레이션** | localStorage → Firestore 일괄 업로드 |
| **캐시 관리** | 수동 캐시 삭제, 자동 정리 상태, 캐시 크기 표시 |
| **MRL API 설정** | 식품안전나라 API 키 관리, 캐시 상태, 연결 테스트, 수동 동기화 |

### 4.5 라벨 인쇄

| 기능 | 설명 |
|------|------|
| 레이아웃 | 2열9행(18매) / 3열7행(21매) / 4열6행(24매) |
| 주소 자동 축소 | 긴 주소 2줄 시 글꼴 자동 축소 + 상단 정렬 |
| A4 여백 | 상단 16mm, 좌측 5mm, 하단 12mm |
| 인쇄 미리보기 | 60% 축소 미리보기 |

### 4.6 기타

| 기능 | 설명 |
|------|------|
| **사용 설명서** | 내장 도움말 문서 |
| **릴리즈 노트** | 버전별 변경 이력 (타임라인 UI) |

---

## 5. 데이터 모델

### 5.1 저장 구조

```
localStorage (Primary)
├── soilSampleLogs_2026       → 토양 시료 데이터 (JSON)
├── waterSampleLogs_2026      → 수질 시료 데이터
├── pesticideSampleLogs_2026  → 잔류농약 시료 데이터
├── compostSampleLogs_2026    → 퇴·액비 시료 데이터
├── heavyMetalSampleLogs_2026 → 중금속 시료 데이터
├── pesticideTestResults_2026 → 잔류농약 분석결과
├── waterTestResults_2026     → 수질 분석결과
├── firebase_config           → Firebase 설정
├── mrl_cache_data            → MRL 기준값 캐시 (18,129건)
├── mrl_cache_meta            → MRL 캐시 메타 (TTL 7일)
└── mrl_api_key               → 식품안전나라 API 키

Firestore (Optional Sync)
├── soilSamples_2026          → 토양 컬렉션
├── waterSamples_2026         → 수질 컬렉션
├── pesticideSamples_2026     → 잔류농약 컬렉션
├── compostSamples_2026       → 퇴·액비 컬렉션
├── heavyMetalSamples_2026    → 중금속 컬렉션
├── pesticideTestResults_2026 → 잔류농약 분석결과
├── waterTestResults_2026     → 수질 분석결과
├── compostTestResults_2026   → 퇴·액비 분석결과
├── heavyMetalTestResults_2026→ 중금속 분석결과
└── _system                   → 시스템 설정

JSON File (Auto-save)
└── auto-save-{type}-{year}.json → 파일 시스템 백업
```

### 5.2 공통 필드 (모든 시료 타입)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string (UUID) | 고유 식별자 |
| `receptionNumber` | string | 접수번호 (예: "503", "503-1") |
| `date` | string | 접수일자 (YYYY-MM-DD) |
| `name` | string | 성명 |
| `phoneNumber` | string | 전화번호 |
| `address` | string | 주소 |
| `addressPostcode` | string | 우편번호 |
| `addressRoad` | string | 도로명 주소 |
| `addressDetail` | string | 상세 주소 |
| `receptionMethod` | string | 수령 방법 |
| `note` | string | 비고 |
| `isComplete` | boolean | 완료 여부 |
| `createdAt` | string (ISO) | 생성 시각 |
| `updatedAt` | string (ISO) | 수정 시각 |

### 5.3 토양 추가 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `subCategory` | string | 구분 (논/밭/과수/시설/임야/성토) |
| `purpose` | string | 목적 (일반재배/무농약/유기/GAP/저탄소) |
| `parcels[]` | array | 필지 배열 |
| `parcels[].lotAddress` | string | 필지 주소 |
| `parcels[].crops[]` | array | 작물 배열 (이름, 면적, 코드) |
| `parcels[].subLots[]` | array | 하위 필지 배열 |
| `groupId` | string | 그룹 ID (다중 필지 묶음) |
| `parcelIndex` | number | 필지 순번 |
| `cropIndex` | number | 작물 순번 |
| `testResult` | string | 분석결과 판정 |

### 5.4 수질 추가 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `applicantType` | string | 신청인 유형 (개인/법인) |
| `birthDate` / `corpNumber` | string | 주민번호/사업자번호 |
| `testItems` | string | 검사항목 (생활용수/농업용수) |
| `sampleName` | string | 시료명 (지하수/지표수/기타) |
| `samplingLocations[]` | array | 채취장소 배열 |

### 5.5 잔류농약 추가 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `applicantType` | string | 개인/법인 |
| `subCategory` | string | 생산물/작물체/가공품 |
| `requestContent` | string | 의뢰물품 (작물명) |

### 5.6 분석결과 데이터 (잔류농약 예시)

```javascript
{
  id: 'excel_2025_3',
  testDate: '2026-04-03',
  judgment: 'fail',
  allNd: false,
  detections: [
    { equipment: 'GC', name: 'Diazinon', engName: 'Diazinon',
      origRaw: '15000', origDil: '100', origVal: '0.015',
      acidRaw: '12000', acidDil: '100', acidVal: '0.012',
      value: '0.015' },
    // ...
  ],
  updatedAt: '2026-04-07T08:00:00.000Z'
}
```

---

## 6. 외부 서비스 연동

### 6.1 Firebase / Firestore

- **SDK**: Firebase Compat v12.7.0 (모듈러 아님)
- **인증**: `firebase-auth.json` 파일 기반 (Electron: userData에 저장)
- **동기화**: 오프라인 우선 — localStorage가 Primary, Firestore는 Optional
- **캐시**: Firestore IndexedDB 캐시로 오프라인 쓰기 지원
- **병합**: `mergeResultSafe()` — placeholder vs 실 데이터 안전 병합

### 6.2 식품안전나라 OpenAPI (MRL)

- **서비스 ID**: I1050 (식품별 농약잔류허용기준)
- **데이터**: 18,129건 MRL 기준값
- **캐시**: localStorage에 7일 TTL
- **조회 순서**: 개별식품 → 작물 별명 → 중분류 fallback
- **매핑**: 영한 551건 (99.8%), 작물 별명 159건

### 6.3 카카오 우편번호 API

- 주소 검색 모달 (`postcode.v2.js`)

### 6.4 VWORLD 지오코딩 API

- 토양 시료의 필지 주소 검증
- Main Process에서 프록시 (CORS 우회)

### 6.5 Google Fonts

- Inter, Noto Sans KR, Fraunces, Material Icons Outlined

---

## 7. 보안

| 항목 | 구현 |
|------|------|
| **CSP** | 엄격한 Content-Security-Policy (unsafe-eval 차단, connect-src 화이트리스트) |
| **경로 보안** | 이중 레이어 — Main `validateFilePath()` + Renderer `PathSecurity` |
| **XSS 방지** | DOMPurify + `escapeHTML` 폴백, `sanitizeHTML` 래퍼 |
| **IPC 속도 제한** | 채널당 30콜/초 |
| **파일 크기 제한** | 읽기 50MB, 설정 10KB |
| **인증 파일 권한** | 0o600 (소유자만) |
| **Context Isolation** | `contextIsolation: true`, `nodeIntegration: false` |
| **내비게이션 제한** | docs 디렉토리 + dev 서버 외 URL 차단 |
| **Security Fuses** | ASAR 무결성, nodeOptions/inspection 비활성화 |
| **추가 헤더** | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy |

---

## 8. 빌드 & 배포

### 8.1 빌드 파이프라인

```
npm run build
  ├── build:css      → Tailwind CSS 컴파일
  ├── sync-version   → package.json → constants.js 버전 동기화
  └── vite build     → src/ → docs/ 번들링
```

### 8.2 릴리즈 흐름

```
1. package.json 버전 업데이트
2. npm run build
3. src/release/index.html에 릴리즈 노트 추가
4. git commit + git tag v1.8.0
5. git push origin main && git push origin v1.8.0
6. GitHub Actions 자동 실행:
   - Windows (windows-latest), Node 22
   - npm run make → Squirrel 설치 파일
   - GitHub Release 생성 + latest.yml (자동 업데이트 피드)
```

### 8.3 자동 업데이트

- `electron-updater`가 GitHub Releases의 `latest.yml` 확인
- 새 버전 발견 시 자동 다운로드 → 사용자에게 재시작 프롬프트

---

## 9. 아키텍처 패턴

### 9.1 사용된 디자인 패턴

| 패턴 | 적용 |
|------|------|
| **Template Method** | `BaseSampleManager` — init/save/render 흐름 정의, 서브클래스가 훅 오버라이드 |
| **Strategy** | `StorageManager` — LOCAL_ONLY / CLOUD_SYNC 모드 투명 전환 |
| **Adapter** | `FileAPI` — Electron IPC / Web File System Access API 추상화 |
| **Factory** | `createFileAPI(sampleType)` — 환경 인식 인스턴스 생성 |
| **Builder** | `ExcelImportManager` — 3단계 마법사, 플러그형 콜백 |
| **Observer** | 온/오프라인 이벤트 → 자동 동기화 트리거 |
| **Singleton** | `analysisWindows` Map — 분석 창 하나만 유지 |

### 9.2 CSS 아키텍처

```
1. shared/tailwind-output.css    ← Tailwind v3 유틸리티
2. style.css                     ← 전역 디자인 시스템 (5,700+ 줄)
3. {type}-style.css              ← 시료별 오버라이드
```

스코핑: `.{type}-navbar ~ .main-content .component` (sibling combinator)

### 9.3 모듈 시스템

- 공유 모듈: IIFE/클래스 → `window.*` 전역 노출
- 진입점: ES Module import 순서 관리 (`{type}-entry.js`)
- Firebase SDK: ES Import (compat 모드)

---

## 10. 주요 버전 이력

| 버전 | 날짜 | 주요 변경 |
|------|------|-----------|
| v1.8.0 | 2026-04 | TypeScript 설정, Vitest 추가 |
| v1.7.99 | 2026-04 | 수질 특정유해물질 11항목 수정 |
| v1.7.98 | 2026-04 | **MRL 자동 조회**, 동기화 안전 개선, 라벨 수정 |
| v1.7.97 | 2026-04 | 수질 유기인 → 다이아지논·파라티온 |
| v1.7.96 | 2026-04 | 잔류농약 Original/Acid 2행 + 정성 46종 |
| v1.7.95 | 2026-04 | 분석결과 입력 (5개 타입) + 목록 고정 컬럼 |
| v1.7.94 | 2026-04 | 퇴·액비/중금속 분석결과 + 리팩터링 |

---

## 11. 관련 문서

| 문서 | 파일 |
|------|------|
| 디자인 시스템 | `docs-internal/DESIGN_SYSTEM.md` |
| 통계 모달 현재 구현 | `docs-internal/STATISTICS_CURRENT_IMPLEMENTATION.md` |
| 통계 모달 개선 기획 | `docs-internal/STATISTICS_MODAL_REDESIGN.md` |
| MRL 목업 | `docs-internal/MRL_LOOKUP_MOCKUP.html` |
| 사용 설명서 | `src/manual/index.html` |

---

*문서 작성일: 2026-04-21*
*대상 버전: v1.8.0*
*파일: docs-internal/PROJECT_OVERVIEW.md*
