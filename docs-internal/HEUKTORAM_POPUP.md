# 흙토람 팝업 윈도우 구현 가이드

## 개요

v1.7.67부터 흙토람 페이지는 **별도 팝업 창**으로 열린다. 토양 접수 목록 페이지를 유지한 채 흙토람 내보내기 작업을 수행할 수 있어, 두 화면을 나란히 놓고 데이터를 비교할 수 있다.

## 변경 전/후 비교

| 항목 | 변경 전 (v1.7.66) | 변경 후 (v1.7.67) |
|------|-------------------|-------------------|
| 이동 방식 | `window.location.href` (페이지 전환) | Electron: `BrowserWindow` 팝업 / 웹: `window.open` |
| 토양 페이지 | **사라짐** (흙토람으로 대체) | **유지됨** (별도 창) |
| 데이터 전달 | `sessionStorage` | `localStorage` 임시 키 |
| 뒤로가기 | 페이지 전환 (`window.location.href`) | 창 닫기 (`window.close()`) |
| 데이터 비교 | 불가 (한 화면만) | **가능** (두 화면 동시) |

## 아키텍처

```
토양 접수 목록 (soil)                          흙토람 내보내기 (heuktoram)
┌─────────────────────────┐                   ┌──────────────────────────┐
│ [흙토람 내보내기] 클릭  │                   │ 별도 BrowserWindow       │
│                         │── localStorage ──▶│                          │
│ ① localStorage에        │   임시 키 전달    │ ③ localStorage에서 읽기  │
│   연도/선택ID 저장      │                   │   즉시 삭제              │
│                         │── IPC ──────────▶│                          │
│ ② openHeuktoram() 호출  │   Main Process    │ ④ 데이터 로드 & 렌더    │
│                         │   BrowserWindow   │                          │
│ 페이지 그대로 유지      │                   │ ⑤ 닫기 버튼 = 창 닫기   │
└─────────────────────────┘                   └──────────────────────────┘
```

## 변경 파일 및 코드

### 1. Main Process (`src/index.js`)

IPC 핸들러 `open-heuktoram` 추가. 별도 `BrowserWindow`를 생성하여 흙토람 페이지를 로드한다.

```javascript
ipcMain.handle('open-heuktoram', async () => {
    const heuktoramWindow = new BrowserWindow({
        width: 1400,
        height: 850,
        minWidth: 1000,
        minHeight: 600,
        title: '흙토람 내보내기',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
    });

    // Vite dev server 연결 시도 → 실패 시 docs/ 빌드 파일 로드
    try {
        // ... Vite dev server 확인 ...
        heuktoramWindow.loadURL(`${VITE_DEV_SERVER_URL}/heuktoram/`);
    } catch {
        const heuktoramPath = path.join(__dirname, '..', 'docs', 'heuktoram', 'index.html');
        heuktoramWindow.loadFile(heuktoramPath);
    }
    return true;
});
```

**핵심 설정:**
- `preload` 스크립트 동일 적용 → `window.electronAPI` 사용 가능
- `contextIsolation: true` → 보안 유지
- 로드 전략: 메인 윈도우와 동일 (Vite dev → docs/ 폴백)

### 2. Preload (`src/preload.js`)

`openHeuktoram` API 노출:

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
    // ... 기존 API ...
    openHeuktoram: () => ipcRenderer.invoke('open-heuktoram'),
    isElectron: true
});
```

### 3. 토양 스크립트 (`src/soil/soil-script.js`)

흙토람 버튼 클릭 이벤트:

```javascript
const heuktoramBtn = document.getElementById('heuktoramBtn');
if (heuktoramBtn) heuktoramBtn.addEventListener('click', () => {
    const selectedIds = this.getSelectedIds();
    // localStorage 임시 키로 데이터 전달
    localStorage.setItem('heuktoram_year', this.selectedYear);
    localStorage.setItem('heuktoram_selected_ids', JSON.stringify(selectedIds));

    const isElectron = window.electronAPI?.isElectron === true;
    if (isElectron) {
        // Electron: IPC로 별도 BrowserWindow 팝업
        window.electronAPI.openHeuktoram();
    } else {
        // 웹: 새 탭 열기, 차단 시 페이지 전환 폴백
        const popup = window.open('../heuktoram/index.html', '_blank');
        if (!popup) {
            window.location.href = '../heuktoram/index.html';
        }
    }
});
```

### 4. 흙토람 스크립트 (`src/heuktoram/heuktoram-script.js`)

데이터 복원을 `sessionStorage` → `localStorage`로 변경:

```javascript
restoreFromSoilPage() {
    // localStorage 임시 키에서 데이터 복원
    const year = localStorage.getItem('heuktoram_year');
    const selectedIdsJson = localStorage.getItem('heuktoram_selected_ids');

    if (year) {
        this.selectedYear = year;
        // ... 연도 설정 ...
        localStorage.removeItem('heuktoram_year');  // 즉시 삭제
    }

    if (selectedIdsJson) {
        // ... 선택 ID 파싱 ...
        localStorage.removeItem('heuktoram_selected_ids');  // 즉시 삭제
    }

    // 뒤로가기 버튼 → 창 닫기
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.close();  // 팝업 창 닫기
        });
    }
}
```

## 데이터 전달 방식

### 왜 sessionStorage → localStorage로 변경했는가?

| 저장소 | 창 간 공유 | 비고 |
|--------|-----------|------|
| `sessionStorage` | X (창마다 독립) | 팝업 창에서 접근 불가 |
| `localStorage` | O (같은 origin 공유) | 팝업 창에서 즉시 읽기 가능 |

### 전달 키

| localStorage 키 | 용도 | 생명주기 |
|------------------|------|----------|
| `heuktoram_year` | 토양 데이터 연도 | 흙토람에서 읽은 직후 삭제 |
| `heuktoram_selected_ids` | 선택된 접수 ID 배열 (JSON) | 흙토람에서 읽은 직후 삭제 |

> `heuktoram_from` 키는 제거됨 (뒤로가기가 `window.close()`로 변경되어 불필요)

## 환경별 동작

### Electron

```
[사용자] 흙토람 버튼 클릭
    ↓
[Renderer] localStorage에 연도/선택ID 저장
    ↓
[Renderer] window.electronAPI.openHeuktoram() → IPC invoke
    ↓
[Main Process] new BrowserWindow() 생성
    ↓
[Main Process] heuktoramWindow.loadFile('docs/heuktoram/index.html')
    ↓
[흙토람 Renderer] localStorage에서 연도/선택ID 읽기 → 삭제
    ↓
[흙토람 Renderer] 토양 데이터 로드 → 테이블 렌더링
```

### 웹 (GitHub Pages)

```
[사용자] 흙토람 버튼 클릭
    ↓
[Renderer] localStorage에 연도/선택ID 저장
    ↓
[Renderer] window.open('../heuktoram/index.html', '_blank')
    ↓ (팝업 차단 시)
[Renderer] window.location.href로 페이지 전환 (폴백)
    ↓
[흙토람] localStorage에서 연도/선택ID 읽기 → 삭제
```

## 주의사항

### Electron 앱 재시작 필요

`src/index.js`(Main Process)를 수정한 경우, **Electron 앱을 재시작해야** 새 IPC 핸들러가 반영된다. `npm run build`는 웹 번들(docs/)만 빌드하며 메인 프로세스에는 영향을 주지 않는다.

```bash
# 앱 재시작 (DevTools 포함)
npm run start:dev

# 앱 재시작 (일반)
npm start
```

### localStorage 키 충돌 방지

`heuktoram_year`, `heuktoram_selected_ids`는 임시 키로, 흙토람에서 읽은 직후 즉시 삭제된다. 만약 흙토람 창이 열리지 않으면 이 키가 localStorage에 남을 수 있으나, 다음 흙토람 열기 시 덮어쓰므로 문제가 없다.

### 테스트 프로젝트 적용 시

테스트 프로젝트(`sample-log-electron-test`)에 적용 시 변경할 파일:

1. `src/index.js` - `open-heuktoram` IPC 핸들러 추가
2. `src/preload.js` - `openHeuktoram` API 추가
3. `src/soil/soil-script.js` - 흙토람 버튼 이벤트 변경
4. `src/heuktoram/heuktoram-script.js` - `restoreFromSoilPage()` 변경

> localStorage 키는 `test_` 접두사 없이 `heuktoram_year`, `heuktoram_selected_ids` 그대로 사용 (임시 키이므로 데이터 저장소와 충돌 없음)

## 변경 이력

| 버전 | 변경 내용 |
|------|-----------|
| v1.7.66 | 흙토람 최초 구현 (페이지 전환 방식, sessionStorage) |
| v1.7.67 | 팝업 윈도우 방식으로 변경 (BrowserWindow, localStorage) |
