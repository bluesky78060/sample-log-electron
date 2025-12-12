const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: '시료 접수 대장',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools in dev mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ========================================
// 파일 시스템 IPC 핸들러
// ========================================

// 파일 저장 다이얼로그
ipcMain.handle('save-file-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: options.title || '파일 저장',
        defaultPath: options.defaultPath || '',
        filters: options.filters || [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePath) {
        return result.filePath;
    }
    return null;
});

// 파일 열기 다이얼로그
ipcMain.handle('open-file-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: options.title || '파일 열기',
        filters: options.filters || [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

// 파일 쓰기
ipcMain.handle('write-file', async (event, filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// 파일 읽기
ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return { success: true, content };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// 자동 저장 설정 파일 경로
function getSettingsPath() {
    return path.join(app.getPath('userData'), 'settings.json');
}

// 설정 로드
function loadSettings() {
    try {
        const settingsPath = getSettingsPath();
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('설정 로드 오류:', error);
    }
    return {};
}

// 설정 저장
function saveSettings(settings) {
    try {
        const settingsPath = getSettingsPath();
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('설정 저장 오류:', error);
        return false;
    }
}

// 자동 저장 경로 가져오기
ipcMain.handle('get-auto-save-path', async () => {
    const settings = loadSettings();
    if (settings.autoSaveFolder) {
        return path.join(settings.autoSaveFolder, 'auto-save.json');
    }
    // 기본 경로
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'auto-save.json');
});

// 자동 저장 폴더 선택
ipcMain.handle('select-auto-save-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: '자동 저장 폴더 선택',
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: '폴더 선택'
    });

    if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
    }

    const selectedFolder = result.filePaths[0];
    const settings = loadSettings();
    settings.autoSaveFolder = selectedFolder;
    saveSettings(settings);

    return {
        success: true,
        folder: selectedFolder,
        path: path.join(selectedFolder, 'auto-save.json')
    };
});

// 현재 자동 저장 폴더 가져오기
ipcMain.handle('get-auto-save-folder', async () => {
    const settings = loadSettings();
    return settings.autoSaveFolder || app.getPath('userData');
});

// 앱 데이터 경로 가져오기
ipcMain.handle('get-app-path', async () => {
    return app.getPath('userData');
});
