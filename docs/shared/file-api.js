// ========================================
// 공통 파일 API 모듈
// Electron과 Web 환경 모두 지원
// ========================================
(function() {
    'use strict';

    // Electron 환경 감지
    const isElectron = window.electronAPI?.isElectron === true;

    /**
     * 파일 API 팩토리 함수
     * @param {string} sampleType - 시료 타입 (soil, water, pesticide, compost, heavy-metal)
     * @returns {object} FileAPI 인스턴스
     */
    function createFileAPI(sampleType) {
        return {
            autoSavePath: null,
            sampleType: sampleType,

            // 초기화
            async init(year) {
                if (isElectron) {
                    this.autoSavePath = await window.electronAPI.getAutoSavePath(this.sampleType, year);
                }
            },

            // 연도 변경 시 경로 업데이트
            async updateAutoSavePath(year) {
                if (isElectron) {
                    this.autoSavePath = await window.electronAPI.getAutoSavePath(this.sampleType, year);
                }
            },

            // 파일 저장
            async saveFile(content, suggestedName = 'data.json') {
                if (isElectron) {
                    const filePath = await window.electronAPI.saveFileDialog({
                        title: '파일 저장',
                        defaultPath: suggestedName,
                        filters: [
                            { name: 'JSON Files', extensions: ['json'] },
                            { name: 'All Files', extensions: ['*'] }
                        ]
                    });
                    if (filePath) {
                        const result = await window.electronAPI.writeFile(filePath, content);
                        return result.success;
                    }
                    return false;
                } else {
                    // Web File System Access API
                    if ('showSaveFilePicker' in window) {
                        try {
                            const handle = await window.showSaveFilePicker({
                                suggestedName,
                                types: [{
                                    description: 'JSON Files',
                                    accept: { 'application/json': ['.json'] }
                                }]
                            });
                            const writable = await handle.createWritable();
                            await writable.write(content);
                            await writable.close();
                            return true;
                        } catch (e) {
                            if (e.name !== 'AbortError') console.error(e);
                            return false;
                        }
                    } else {
                        // 폴백: Blob 다운로드
                        const blob = new Blob([content], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = suggestedName;
                        a.click();
                        URL.revokeObjectURL(url);
                        return true;
                    }
                }
            },

            // 파일 열기
            async openFile() {
                if (isElectron) {
                    const filePath = await window.electronAPI.openFileDialog({
                        title: '파일 열기',
                        filters: [
                            { name: 'JSON Files', extensions: ['json'] },
                            { name: 'All Files', extensions: ['*'] }
                        ]
                    });
                    if (filePath) {
                        const result = await window.electronAPI.readFile(filePath);
                        if (result.success) {
                            return result.content;
                        }
                    }
                    return null;
                } else {
                    // Web File System Access API
                    if ('showOpenFilePicker' in window) {
                        try {
                            const [handle] = await window.showOpenFilePicker({
                                types: [{
                                    description: 'JSON Files',
                                    accept: { 'application/json': ['.json'] }
                                }]
                            });
                            const file = await handle.getFile();
                            return await file.text();
                        } catch (e) {
                            if (e.name !== 'AbortError') console.error(e);
                            return null;
                        }
                    } else {
                        return null;
                    }
                }
            },

            // 자동 저장
            async autoSave(content) {
                if (isElectron && this.autoSavePath) {
                    const result = await window.electronAPI.writeFile(this.autoSavePath, content);
                    return result.success;
                }
                return false;
            },

            // 자동 저장 데이터 로드
            async loadAutoSave() {
                if (isElectron && this.autoSavePath) {
                    const result = await window.electronAPI.readFile(this.autoSavePath);
                    if (result.success) {
                        return result.content;
                    }
                }
                return null;
            }
        };
    }

    // 전역으로 내보내기
    window.createFileAPI = createFileAPI;
    window.isElectron = isElectron;
})();
