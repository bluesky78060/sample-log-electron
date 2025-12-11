const { contextBridge, ipcRenderer } = require('electron');

// 렌더러 프로세스에 안전하게 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
    // 파일 저장 다이얼로그
    saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),

    // 파일 열기 다이얼로그
    openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),

    // 파일 쓰기
    writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),

    // 파일 읽기
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

    // 자동 저장 경로 가져오기
    getAutoSavePath: () => ipcRenderer.invoke('get-auto-save-path'),

    // 앱 데이터 경로 가져오기
    getAppPath: () => ipcRenderer.invoke('get-app-path'),

    // Electron 환경 여부
    isElectron: true
});
