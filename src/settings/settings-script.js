// Firebase 설정 저장 키 (firebase-config.js의 FIREBASE_CONFIG_KEY와 동일 값)
const SETTINGS_FIREBASE_KEY = 'firebase_config';
const SAMPLE_TYPES = [
    { key: 'soil', name: '토양', icon: '🌱', storagePrefix: 'soilSampleLogs' },
    { key: 'water', name: '수질분석', icon: '💧', storagePrefix: 'waterSampleLogs' },
    { key: 'pesticide', name: '잔류농약', icon: '🧪', storagePrefix: 'pesticideSampleLogs' },
    { key: 'compost', name: '가축분뇨퇴비', icon: '🐄', storagePrefix: 'compostSampleLogs' },
    { key: 'heavyMetal', name: '토양 중금속', icon: '⚗️', storagePrefix: 'heavyMetalSampleLogs' }
];

// Electron 환경 확인
const isElectron = window.electronAPI?.isElectron === true;

// ========================================
// 인증 파일 관련 함수 (Electron 전용)
// ========================================

// 인증 파일 상태 확인 및 UI 업데이트
async function checkAuthFileStatus() {
    const statusEl = document.getElementById('authFileStatus');
    const uploadArea = document.getElementById('authFileUploadArea');
    const infoArea = document.getElementById('authFileInfo');

    if (!isElectron) {
        // 웹 환경: localStorage에서 설정 확인
        if (window.firebaseConfig?.isEnabled?.()) {
            statusEl.className = 'status-badge connected';
            statusEl.textContent = '● 연결됨';
            uploadArea.style.display = 'none';
            infoArea.style.display = 'block';
            document.getElementById('authFileProjectId').textContent = '웹 환경 - 설정 저장됨';
        } else {
            statusEl.className = 'status-badge disconnected';
            statusEl.textContent = '● 미등록';
            uploadArea.style.display = 'block';
            infoArea.style.display = 'none';
        }
        // 웹 환경에서도 인증 파일 업로드 가능하도록 섹션 표시
        document.querySelector('#authFileSection .alert-info').innerHTML = sanitizeHTML(
            '<strong>인증 파일이란?</strong><br>' +
            'Firebase 접근을 위한 인증 파일을 업로드하면 자동으로 설정됩니다.<br>' +
            '<small style="color: #64748b;">(웹 환경: 설정이 브라우저에 저장됩니다)</small>'
        );
        return;
    }

    try {
        const result = await window.electronAPI.readAuthFile();

        if (result.exists && result.content) {
            try {
                const config = JSON.parse(result.content);
                if (config.projectId) {
                    // 인증 파일 등록됨
                    statusEl.className = 'status-badge connected';
                    statusEl.textContent = '● 등록됨';
                    uploadArea.style.display = 'none';
                    infoArea.style.display = 'block';
                    document.getElementById('authFileProjectId').textContent = `프로젝트: ${config.projectId}`;
                    return;
                }
            } catch (e) {
                console.error('인증 파일 파싱 오류:', e);
            }
        }

        // 인증 파일 미등록
        statusEl.className = 'status-badge disconnected';
        statusEl.textContent = '● 미등록';
        uploadArea.style.display = 'block';
        infoArea.style.display = 'none';
    } catch (error) {
        console.error('인증 파일 확인 오류:', error);
    }
}

// 인증 파일 저장
async function saveAuthFile(content) {
    try {
        // JSON 파싱 검증
        const config = JSON.parse(content);
        if (!config.apiKey || !config.projectId) {
            alert('유효하지 않은 인증 파일입니다.\nAPI Key와 Project ID가 필요합니다.');
            return false;
        }

        if (!isElectron) {
            // 웹 환경: localStorage에 저장
            if (window.firebaseConfig?.saveConfig) {
                window.firebaseConfig.saveConfig(config);
            }

            // Firebase 재초기화
            if (window.firebaseConfig?.reinitialize) {
                const initResult = await window.firebaseConfig.reinitialize();
                if (initResult) {
                    alert('인증 파일이 적용되고 Firebase가 연결되었습니다.\n프로젝트: ' + config.projectId);
                } else {
                    alert('인증 파일이 저장되었지만 Firebase 연결에 실패했습니다.\n페이지를 새로고침해주세요.');
                }
            } else {
                alert('인증 파일이 저장되었습니다.\n페이지를 새로고침하면 적용됩니다.');
            }
            await checkAuthFileStatus();
            updateConnectionStatus();
            return true;
        }

        // Electron 환경: 파일 시스템에 저장
        const result = await window.electronAPI.saveAuthFile(content);
        if (result.success) {
            // Firebase 재초기화 (새 인증 파일 적용)
            if (window.firebaseConfig?.reinitialize) {
                const initResult = await window.firebaseConfig.reinitialize();
                if (initResult) {
                    alert('인증 파일이 등록되고 Firebase가 연결되었습니다.\n프로젝트: ' + config.projectId);
                } else {
                    alert('인증 파일은 등록되었지만 Firebase 연결에 실패했습니다.\n앱을 재시작해주세요.');
                }
            } else {
                alert('인증 파일이 등록되었습니다.\n앱을 재시작하면 적용됩니다.');
            }
            await checkAuthFileStatus();
            updateConnectionStatus();
            return true;
        } else {
            alert('인증 파일 저장 실패: ' + (result.error || '알 수 없는 오류'));
            return false;
        }
    } catch (error) {
        alert('인증 파일 형식이 올바르지 않습니다.\nJSON 형식의 파일이 필요합니다.');
        return false;
    }
}

// 인증 파일 삭제
async function deleteAuthFile() {
    if (!confirm('인증 파일을 삭제하시겠습니까?\nFirebase 연결이 해제됩니다.')) {
        return;
    }

    if (!isElectron) {
        // 웹 환경: localStorage에서 삭제
        if (window.firebaseConfig?.resetConfig) {
            window.firebaseConfig.resetConfig();
        }
        alert('Firebase 설정이 삭제되었습니다.');
        await checkAuthFileStatus();
        updateConnectionStatus();
        return;
    }

    try {
        const result = await window.electronAPI.deleteAuthFile();
        if (result.success) {
            // Firebase 설정도 초기화
            if (window.firebaseConfig?.resetConfig) {
                window.firebaseConfig.resetConfig();
            }
            alert('인증 파일이 삭제되었습니다.');
            await checkAuthFileStatus();
            updateConnectionStatus();
        } else {
            alert('인증 파일 삭제 실패: ' + (result.error || '알 수 없는 오류'));
        }
    } catch (error) {
        alert('인증 파일 삭제 중 오류 발생: ' + error.message);
    }
}

// 파일 선택 버튼 클릭 (Electron 네이티브 다이얼로그 사용)
document.getElementById('selectAuthFileBtn')?.addEventListener('click', async () => {
    if (isElectron && window.electronAPI?.selectAuthFile) {
        // Electron 네이티브 파일 선택 다이얼로그
        try {
            const result = await window.electronAPI.selectAuthFile();
            if (result.canceled) {
                return;
            }
            if (result.success) {
                // Firebase 재초기화 (새 인증 파일 적용)
                if (window.firebaseConfig?.reinitialize) {
                    const initResult = await window.firebaseConfig.reinitialize();
                    if (initResult) {
                        alert('인증 파일이 등록되고 Firebase가 연결되었습니다.\n프로젝트: ' + result.projectId);
                    } else {
                        alert('인증 파일은 등록되었지만 Firebase 연결에 실패했습니다.\n앱을 재시작해주세요.');
                    }
                } else {
                    alert('인증 파일이 등록되었습니다.\n앱을 재시작하면 적용됩니다.\n프로젝트: ' + result.projectId);
                }
                await checkAuthFileStatus();
                updateConnectionStatus();
            } else {
                alert('인증 파일 등록 실패: ' + (result.error || '알 수 없는 오류'));
            }
        } catch (error) {
            alert('파일 선택 중 오류 발생: ' + error.message);
        }
    } else {
        // 웹 환경 폴백
        document.getElementById('authFileInput').click();
    }
});

// 파일 선택 처리 (웹 환경용)
document.getElementById('authFileInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        await saveAuthFile(event.target.result);
    };
    reader.readAsText(file);

    // 입력 초기화
    e.target.value = '';
});

// 인증 파일 삭제 버튼
document.getElementById('deleteAuthFileBtn')?.addEventListener('click', deleteAuthFile);

// 드래그 앤 드롭 지원
const uploadArea = document.getElementById('authFileUploadArea');
if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.querySelector('div').style.borderColor = '#3b82f6';
        uploadArea.querySelector('div').style.background = '#eff6ff';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.querySelector('div').style.borderColor = '#cbd5e1';
        uploadArea.querySelector('div').style.background = '#f8fafc';
    });

    uploadArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadArea.querySelector('div').style.borderColor = '#cbd5e1';
        uploadArea.querySelector('div').style.background = '#f8fafc';

        const file = e.dataTransfer.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            await saveAuthFile(event.target.result);
        };
        reader.readAsText(file);
    });
}

// 수동 설정 토글
function toggleManualSettings() {
    const content = document.getElementById('manualSettingsContent');
    const toggle = document.getElementById('manualSettingsToggle');
    if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.textContent = '▲ 접기';
    } else {
        content.style.display = 'none';
        toggle.textContent = '▼ 펼치기';
    }
}

// 수동 설정 토글 버튼 이벤트 리스너 (인라인 onclick 대체)
document.getElementById('manual-settings-toggle')?.addEventListener('click', toggleManualSettings);

// ========================================
// 기존 Firebase 설정 관련 함수
// ========================================

// 저장된 설정 로드
function loadSavedConfig() {
    const saved = localStorage.getItem(SETTINGS_FIREBASE_KEY);
    if (saved) {
        try {
            const config = JSON.parse(saved);
            document.getElementById('apiKey').value = config.apiKey || '';
            document.getElementById('projectId').value = config.projectId || '';
            document.getElementById('authDomain').value = config.authDomain || '';
            document.getElementById('storageBucket').value = config.storageBucket || '';
            document.getElementById('messagingSenderId').value = config.messagingSenderId || '';
            document.getElementById('appId').value = config.appId || '';
        } catch (e) {
            console.error('Firebase 설정 파싱 오류:', e);
            localStorage.removeItem(SETTINGS_FIREBASE_KEY);
        }
    }
}

// 설정 저장
document.getElementById('firebaseForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const config = {
        apiKey: document.getElementById('apiKey').value.trim(),
        projectId: document.getElementById('projectId').value.trim(),
        authDomain: document.getElementById('authDomain').value.trim(),
        storageBucket: document.getElementById('storageBucket').value.trim(),
        messagingSenderId: document.getElementById('messagingSenderId').value.trim(),
        appId: document.getElementById('appId').value.trim()
    };

    localStorage.setItem(SETTINGS_FIREBASE_KEY, JSON.stringify(config));

    const statusEl = document.getElementById('connectionStatus');
    statusEl.className = 'status-badge';
    statusEl.style.background = '#e0f2fe';
    statusEl.style.color = '#0369a1';
    statusEl.textContent = '● 저장됨';

    alert('설정이 저장되었습니다. "연결 테스트" 버튼을 눌러 연결을 확인하세요.');
});

// 연결 상태 업데이트
function updateConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    if (window.firebaseConfig?.isEnabled?.()) {
        statusEl.className = 'status-badge connected';
        statusEl.textContent = '● 연결됨';
        document.getElementById('migrateAllBtn').disabled = false;
    } else {
        statusEl.className = 'status-badge disconnected';
        statusEl.textContent = '● 미연결';
    }
}

// 연결 테스트
document.getElementById('testConnectionBtn').addEventListener('click', async () => {
    const statusEl = document.getElementById('connectionStatus');
    const authStatusEl = document.getElementById('authFileStatus');

    statusEl.className = 'status-badge';
    statusEl.style.background = '#fef3c7';
    statusEl.style.color = '#92400e';
    statusEl.textContent = '● 연결 중...';

    try {
        // Firebase 초기화 시도
        const initialized = await window.firebaseConfig.initialize();

        if (initialized) {
            statusEl.className = 'status-badge connected';
            statusEl.style.background = '#dcfce7';
            statusEl.style.color = '#16a34a';
            statusEl.textContent = '● 연결됨';

            if (authStatusEl) {
                authStatusEl.className = 'status-badge connected';
                authStatusEl.textContent = '● 연결됨';
            }

            document.getElementById('migrateAllBtn').disabled = false;
            renderMigrationList();
            alert('Firebase 연결 성공!');
        } else {
            statusEl.className = 'status-badge disconnected';
            statusEl.style.background = '#fef3c7';
            statusEl.style.color = '#d97706';
            statusEl.textContent = '● 미연결';

            if (isElectron) {
                alert('Firebase 연결 실패.\n인증 파일이 등록되어 있는지 확인하세요.');
            } else {
                alert('Firebase 연결 실패.\n수동 설정값을 확인해주세요.');
            }
        }
    } catch (error) {
        statusEl.className = 'status-badge error';
        statusEl.style.background = '#fee2e2';
        statusEl.style.color = '#dc2626';
        statusEl.textContent = '● 연결 실패';
        console.error('연결 테스트 실패:', error);
        alert('연결 실패: ' + error.message);
    }
});

// 마이그레이션 목록 렌더링 (모든 연도 포함, DOM API 사용 - XSS 방지)
function renderMigrationList() {
    const container = document.getElementById('migrationList');
    const currentYear = new Date().getFullYear();
    const MIN_YEAR = 2020;

    container.innerHTML = '';

    SAMPLE_TYPES.forEach(type => {
        // 모든 연도의 데이터 수집
        let totalCount = 0;
        const yearDetails = [];

        for (let year = MIN_YEAR; year <= currentYear; year++) {
            const storageKey = `${type.storagePrefix}_${year}`;
            const data = localStorage.getItem(storageKey);
            let count = 0;
            if (data) {
                try { count = JSON.parse(data).length; } catch (e) { console.error(`${storageKey} 파싱 오류:`, e); }
            }
            if (count > 0) {
                totalCount += count;
                yearDetails.push(`${year}년: ${count}건`);
            }
        }

        // DOM 요소 생성
        const item = document.createElement('div');
        item.className = 'migration-item';

        const info = document.createElement('div');
        info.className = 'migration-item-info';

        const icon = document.createElement('span');
        icon.className = 'migration-item-icon';
        icon.textContent = type.icon;

        const textDiv = document.createElement('div');

        const name = document.createElement('div');
        name.className = 'migration-item-name';
        name.textContent = type.name;

        const count = document.createElement('div');
        count.className = 'migration-item-count';
        count.textContent = `${totalCount}건 ${yearDetails.length > 0 ? '(' + yearDetails.join(', ') + ')' : ''}`;

        textDiv.appendChild(name);
        textDiv.appendChild(count);
        info.appendChild(icon);
        info.appendChild(textDiv);

        const btn = document.createElement('button');
        btn.className = 'btn btn-primary btn-sm';
        btn.textContent = '마이그레이션';
        btn.disabled = totalCount === 0;
        btn.addEventListener('click', () => migrateTypeAllYears(type.key, type.storagePrefix));

        item.appendChild(info);
        item.appendChild(btn);
        container.appendChild(item);
    });
}

// 개별 타입의 모든 연도 마이그레이션
async function migrateTypeAllYears(sampleType, storagePrefix) {
    if (!window.storageManager?.isCloudEnabled()) {
        alert('Firebase가 연결되지 않았습니다.');
        return;
    }

    const currentYear = new Date().getFullYear();
    const MIN_YEAR = 2020;
    let totalCount = 0;
    let successYears = [];

    try {
        for (let year = MIN_YEAR; year <= currentYear; year++) {
            const storageKey = `${storagePrefix}_${year}`;
            const data = localStorage.getItem(storageKey);
            if (data) {
                const result = await window.storageManager.migrate(sampleType, year, storageKey);
                if (result.success && result.count > 0) {
                    totalCount += result.count;
                    successYears.push(`${year}년: ${result.count}건`);
                }
            }
        }

        if (totalCount > 0) {
            alert(`마이그레이션 완료!\n\n총 ${totalCount}건\n${successYears.join('\n')}`);
            renderMigrationList();
        } else {
            alert('마이그레이션할 데이터가 없습니다.');
        }
    } catch (error) {
        alert('마이그레이션 중 오류 발생: ' + error.message);
    }
}

// 전체 마이그레이션 (모든 타입, 모든 연도)
document.getElementById('migrateAllBtn').addEventListener('click', async () => {
    if (!confirm('모든 데이터를 Firebase로 마이그레이션하시겠습니까?\n(2020년 ~ 현재 연도의 모든 데이터)')) {
        return;
    }

    const currentYear = new Date().getFullYear();
    const MIN_YEAR = 2020;
    let totalCount = 0;
    let details = [];

    for (const type of SAMPLE_TYPES) {
        let typeCount = 0;

        for (let year = MIN_YEAR; year <= currentYear; year++) {
            const storageKey = `${type.storagePrefix}_${year}`;
            const data = localStorage.getItem(storageKey);
            if (data) {
                try {
                    const result = await window.storageManager.migrate(type.key, year, storageKey);
                    if (result.success && result.count > 0) {
                        totalCount += result.count;
                        typeCount += result.count;
                    }
                } catch (error) {
                    console.error(`${type.name} ${year}년 마이그레이션 실패:`, error);
                }
            }
        }

        if (typeCount > 0) {
            details.push(`${type.name}: ${typeCount}건`);
        }
    }

    alert(`전체 마이그레이션 완료!\n\n총 ${totalCount}건\n${details.join('\n')}`);
    renderMigrationList();
});

// 전체 데이터 내보내기
document.getElementById('exportAllBtn').addEventListener('click', () => {
    const currentYear = new Date().getFullYear();
    const allData = {};

    SAMPLE_TYPES.forEach(type => {
        const storageKey = `${type.storagePrefix}_${currentYear}`;
        const data = localStorage.getItem(storageKey);
        if (data) {
            try { allData[type.key] = JSON.parse(data); } catch (e) { console.error(`${type.key} 파싱 오류:`, e); }
        }
    });

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-log-backup-${currentYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

// ========================================
// 캐시 관리 UI
// ========================================

// 캐시 상태 표시
function updateCacheStatusUI() {
    if (!window.CacheManager) return;

    const status = CacheManager.getCacheStatus();

    document.getElementById('cacheDataCount').textContent = `${status.totalKeys}건`;
    document.getElementById('cacheDataSize').textContent = `${status.totalSizeMB} MB`;

    const lastClearEl = document.getElementById('lastCacheClear');
    if (status.lastClear.lastClear) {
        const lastDate = status.lastClear.lastClear;
        lastClearEl.textContent = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}-${String(lastDate.getDate()).padStart(2, '0')} ${String(lastDate.getHours()).padStart(2, '0')}:${String(lastDate.getMinutes()).padStart(2, '0')}`;
    } else {
        lastClearEl.textContent = '없음';
    }
}

// 캐시 삭제 버튼
document.getElementById('clearCacheBtn').addEventListener('click', () => {
    if (!confirm('캐시된 시료 데이터를 삭제하시겠습니까?\n\n삭제 후 앱을 새로고침하면 Firebase에서 데이터를 다시 불러옵니다.\n(Firebase 설정 및 연결 정보는 유지됩니다)')) {
        return;
    }

    if (window.CacheManager) {
        CacheManager.clearCache(true);
        updateCacheStatusUI();
    }
});

// 상태 새로고침 버튼
document.getElementById('refreshCacheStatusBtn').addEventListener('click', () => {
    updateCacheStatusUI();
});

// 초기 상태 표시
updateCacheStatusUI();

// ========================================
// 식품안전나라 MRL API 관리
// ========================================
function formatRelativeTime(ms) {
    if (!ms) return '없음';
    const diff = Date.now() - ms;
    const min = Math.floor(diff / 60000);
    const hour = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (day > 0) return `${day}일 전`;
    if (hour > 0) return `${hour}시간 전`;
    if (min > 0) return `${min}분 전`;
    return '방금 전';
}

function formatDateTime(ms) {
    if (!ms) return '없음';
    const d = new Date(ms);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function setConnStatus(text, type) {
    const el = document.getElementById('mrlConnStatus');
    if (!el) return;
    el.textContent = text;
    el.style.color = type === 'ok' ? '#059669'
                    : type === 'warn' ? '#d97706'
                    : type === 'error' ? '#dc2626'
                    : '#64748b';
}

function updateMrlStatusUI() {
    const MrlApi = window.MrlApi;
    if (!MrlApi) {
        setConnStatus('MrlApi 모듈 로드 실패', 'error');
        return;
    }

    // 키 필드
    const keyInput = document.getElementById('mrlApiKey');
    if (keyInput) {
        keyInput.value = MrlApi.getApiKey() || '';
    }

    // 캐시 상태
    const status = MrlApi.getCacheStatus();
    const countEl = document.getElementById('mrlCacheCount');
    const lastEl = document.getElementById('mrlLastSync');
    const expEl = document.getElementById('mrlCacheExpiry');

    if (!status.cached) {
        if (countEl) countEl.textContent = '없음';
        if (lastEl) lastEl.textContent = '한 번도 동기화되지 않음';
        if (expEl) { expEl.textContent = '없음'; expEl.style.color = '#64748b'; }
    } else {
        if (countEl) countEl.textContent = `${status.count.toLocaleString()}건`;
        if (lastEl) lastEl.textContent = `${formatDateTime(status.timestamp)} (${formatRelativeTime(status.timestamp)})`;
        if (expEl) {
            if (status.expired) {
                expEl.textContent = '⚠️ 만료됨 (재동기화 권장)';
                expEl.style.color = '#d97706';
            } else {
                const ttlMs = MrlApi.CACHE_TTL_MS - status.ageMs;
                const daysLeft = Math.ceil(ttlMs / 86400000);
                expEl.textContent = `✅ 유효 (${daysLeft}일 남음)`;
                expEl.style.color = '#059669';
            }
        }
    }

    // 연결 상태
    if (!MrlApi.hasApiKey()) {
        setConnStatus('API 키 미설정', 'warn');
    } else if (status.cached && !status.expired) {
        setConnStatus('정상 (캐시 유효)', 'ok');
    } else if (status.cached && status.expired) {
        setConnStatus('캐시 만료 (재동기화 필요)', 'warn');
    } else {
        setConnStatus('API 키 있음 - 동기화 대기', 'warn');
    }
}

function showMrlProgress(show) {
    const bar = document.getElementById('mrlProgressBar');
    if (bar) bar.classList.toggle('hidden', !show);
}

function updateMrlProgress(loaded, total) {
    const fill = document.getElementById('mrlProgressFill');
    const text = document.getElementById('mrlProgressText');
    const pct = total > 0 ? (loaded / total) * 100 : 0;
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `${loaded.toLocaleString()} / ${total.toLocaleString()} (${pct.toFixed(0)}%)`;
}

// API 키 저장
document.getElementById('mrlApiKeySave')?.addEventListener('click', () => {
    const MrlApi = window.MrlApi;
    if (!MrlApi) { showToast('MrlApi 모듈 로드 실패', 'error'); return; }
    const input = document.getElementById('mrlApiKey');
    const key = (input?.value || '').trim();
    if (!key) {
        if (confirm('API 키를 비우시겠습니까? MRL 자동 조회가 비활성화됩니다.')) {
            MrlApi.setApiKey('');
            MrlApi.clearCache();
            updateMrlStatusUI();
            showToast('API 키가 제거되었습니다', 'info');
        }
        return;
    }
    MrlApi.setApiKey(key);
    showToast('API 키가 저장되었습니다', 'success');
    updateMrlStatusUI();
});

// 키 표시/숨김 토글
document.getElementById('mrlApiKeyToggle')?.addEventListener('click', () => {
    const input = document.getElementById('mrlApiKey');
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
});

// 지금 동기화
document.getElementById('mrlSyncBtn')?.addEventListener('click', async () => {
    const MrlApi = window.MrlApi;
    if (!MrlApi) return;
    if (!MrlApi.hasApiKey()) {
        showToast('먼저 API 키를 저장하세요', 'warning');
        return;
    }

    const btn = document.getElementById('mrlSyncBtn');
    btn.disabled = true;
    btn.textContent = '⏳ 동기화 중...';
    showMrlProgress(true);
    updateMrlProgress(0, 1);
    setConnStatus('다운로드 중...', 'warn');

    try {
        const result = await MrlApi.sync(({ loaded, total }) => {
            updateMrlProgress(loaded, total);
        });
        if (result.success) {
            showToast(`동기화 완료: ${result.count}건`, 'success');
        } else {
            showToast(`동기화 실패: ${result.error}`, 'error');
        }
    } catch (e) {
        showToast(`오류: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🔄 지금 동기화';
        setTimeout(() => showMrlProgress(false), 1000);
        updateMrlStatusUI();
    }
});

// 연결 테스트
document.getElementById('mrlTestBtn')?.addEventListener('click', async () => {
    const MrlApi = window.MrlApi;
    if (!MrlApi) return;
    const key = MrlApi.getApiKey();
    if (!key) {
        showToast('먼저 API 키를 저장하세요', 'warning');
        return;
    }

    const btn = document.getElementById('mrlTestBtn');
    btn.disabled = true;
    btn.textContent = '⏳ 테스트 중...';
    setConnStatus('테스트 중...', 'warn');

    try {
        // 1건만 가져와서 검증 (HTTPS 사용)
        const url = `https://openapi.foodsafetykorea.go.kr/api/${encodeURIComponent(key)}/${MrlApi.SERVICE_ID}/json/1/1`;
        const res = await fetch(url);
        const text = await res.text();
        const contentType = (res.headers.get('content-type') || '').toLowerCase();

        if (contentType.includes('text/html') || text.trim().startsWith('<')) {
            setConnStatus('❌ 인증키 오류 또는 활성화 대기', 'error');
            showToast('인증키가 유효하지 않거나 아직 활성화되지 않았습니다', 'error');
            return;
        }

        const data = JSON.parse(text);
        const payload = data[MrlApi.SERVICE_ID];
        if (payload?.RESULT?.CODE === 'INFO-000') {
            const total = parseInt(payload.total_count || '0', 10);
            setConnStatus(`✅ 정상 (전체 ${total.toLocaleString()}건)`, 'ok');
            showToast(`연결 성공! 전체 ${total.toLocaleString()}건`, 'success');
        } else {
            setConnStatus(`❌ API 오류: ${payload?.RESULT?.MSG || 'Unknown'}`, 'error');
            showToast(`API 오류: ${payload?.RESULT?.MSG}`, 'error');
        }
    } catch (e) {
        setConnStatus(`❌ 네트워크 오류: ${e.message}`, 'error');
        showToast(`연결 실패: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🔌 연결 테스트';
    }
});

// MRL 캐시 삭제
document.getElementById('mrlClearCacheBtn')?.addEventListener('click', () => {
    const MrlApi = window.MrlApi;
    if (!MrlApi) return;
    if (!confirm('MRL 캐시를 삭제하시겠습니까?\n다음 조회 시 다시 다운로드됩니다 (약 15초).')) {
        return;
    }
    MrlApi.clearCache();
    showToast('MRL 캐시가 삭제되었습니다', 'info');
    updateMrlStatusUI();
});

// 페이지 로드 시 상태 표시
updateMrlStatusUI();

// ========================================
// 작물 데이터 관리 UI (SAMPL-1-126)
// ========================================

// 상태 박스 갱신
async function updateCropDataStatusUI() {
    const verEl = document.getElementById('cropDataVersion');
    const countEl = document.getElementById('cropDataCount');
    const updEl = document.getElementById('cropDataUpdatedAt');
    const srcEl = document.getElementById('cropDataSource');
    if (!verEl || !countEl || !updEl || !srcEl) return;

    const count = Array.isArray(window.CROP_DATA) ? window.CROP_DATA.length : 0;
    countEl.textContent = count ? `${count.toLocaleString()}건` : '-';

    let envelope = null;
    try {
        envelope = await window.CropDataLoader?.readLocalEnvelope?.();
    } catch { /* ignore */ }

    if (envelope) {
        verEl.textContent = envelope.version || '-';
        updEl.textContent = envelope.updatedAt ? String(envelope.updatedAt).slice(0, 10) : '-';
        srcEl.textContent = window.firebaseConfig?.isEnabled?.() ? '로컬 + 클라우드' : '로컬';
    } else {
        verEl.textContent = '내장 기본값';
        updEl.textContent = '-';
        srcEl.textContent = '앱 내장';
    }
}

// 업로드 버튼
document.getElementById('cropDataUploadBtn')?.addEventListener('click', async () => {
    const Loader = window.CropDataLoader;
    if (!Loader) { showToast('작물 데이터 모듈 로드 실패', 'error'); return; }

    const fileInput = document.getElementById('cropDataFile');
    const file = fileInput?.files?.[0];
    if (!file) { showToast('업로드할 .xlsx 파일을 선택하세요', 'warning'); return; }

    const btn = document.getElementById('cropDataUploadBtn');
    const progress = document.getElementById('cropDataProgress');
    btn.disabled = true;
    btn.textContent = '⏳ 처리 중...';
    progress?.classList.remove('hidden');

    try {
        const buf = await file.arrayBuffer();
        const parsed = Loader.parseCropExcelFile(buf); // 실패 시 throw → 기존 데이터 보존
        const prevCount = Array.isArray(window.CROP_DATA) ? window.CROP_DATA.length : 0;

        const ok = confirm(
            `작물 ${parsed.length.toLocaleString()}건을 불러왔습니다.\n` +
            `(기존 ${prevCount.toLocaleString()}건 → 신규 ${parsed.length.toLocaleString()}건)\n\n` +
            '적용하시겠습니까?'
        );
        if (!ok) return;

        const versionLabel = new Date().toISOString().slice(0, 10);
        await Loader.saveCropDataUpload(parsed, versionLabel);

        showToast(`작물 데이터가 갱신되었습니다 (${parsed.length.toLocaleString()}건)`, 'success');
        if (fileInput) fileInput.value = '';
        await updateCropDataStatusUI();
    } catch (e) {
        showToast(`작물 데이터 처리 실패: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '📤 업로드';
        progress?.classList.add('hidden');
    }
});

// 페이지 로드 시 상태 표시
updateCropDataStatusUI();

// ========================================
// 네트워크 접근 제어 UI
// ========================================

function initNetworkAccessUI() {
    if (!window.NetworkAccess) return;

    const statusEl = document.getElementById('networkAccessStatus');
    const envEl = document.getElementById('currentEnvironment');
    const gatewayEl = document.getElementById('allowedGateway');
    const publicIPEl = document.getElementById('currentPublicIP');
    const accessEl = document.getElementById('currentAccessStatus');

    // 환경 표시
    const isElectron = window.electronAPI?.isElectron === true || window.location.protocol === 'file:';
    envEl.textContent = isElectron ? 'Electron (항상 허용)' : '웹 브라우저';

    // 허용된 게이트웨이 표시
    const allowedGateway = NetworkAccess.getAllowedGateway();
    if (allowedGateway) {
        gatewayEl.textContent = allowedGateway;
    } else {
        gatewayEl.textContent = '설정 없음';
        gatewayEl.style.color = '#dc2626';
    }

    // 네트워크 상태 확인
    async function refreshNetworkStatus() {
        publicIPEl.textContent = '확인 중...';
        accessEl.textContent = '확인 중...';

        const publicIP = await NetworkAccess.getCurrentIP();
        publicIPEl.textContent = publicIP || '확인 불가';

        const access = await NetworkAccess.checkAccess();
        accessEl.textContent = access.allowed ? `허용 (${access.reason})` : `거부 (${access.reason})`;
        accessEl.style.color = access.allowed ? '#16a34a' : '#dc2626';

        // 상태 배지 업데이트
        if (access.allowed) {
            statusEl.className = 'status-badge connected';
            statusEl.textContent = '● 허용';
        } else {
            statusEl.className = 'status-badge disconnected';
            statusEl.textContent = '● 거부';
        }
    }

    document.getElementById('checkNetworkBtn').addEventListener('click', refreshNetworkStatus);

    // 초기 상태 확인
    refreshNetworkStatus();
}

initNetworkAccessUI();

// ========================================
// 기관명 설정
// ========================================
const DEFAULT_ORG_NAME = '봉화군농업기술센터 안전성분석센터';
const ORG_NAME_KEY = 'app_org_name';

function loadOrgName() {
    const saved = localStorage.getItem(ORG_NAME_KEY);
    document.getElementById('orgName').value = saved || DEFAULT_ORG_NAME;
}

document.getElementById('saveOrgNameBtn').addEventListener('click', () => {
    const value = document.getElementById('orgName').value.trim();
    if (!value) {
        alert('기관명을 입력해주세요.');
        return;
    }
    localStorage.setItem(ORG_NAME_KEY, value);
    const statusEl = document.getElementById('orgNameSaveStatus');
    statusEl.style.display = 'inline';
    setTimeout(() => { statusEl.style.display = 'none'; }, 2000);
});

document.getElementById('resetOrgNameBtn').addEventListener('click', () => {
    if (!confirm('기관명을 기본값으로 복원하시겠습니까?')) return;
    localStorage.removeItem(ORG_NAME_KEY);
    document.getElementById('orgName').value = DEFAULT_ORG_NAME;
    const statusEl = document.getElementById('orgNameSaveStatus');
    statusEl.textContent = '기본값 복원됨';
    statusEl.style.display = 'inline';
    setTimeout(() => {
        statusEl.textContent = '저장됨';
        statusEl.style.display = 'none';
    }, 2000);
});

loadOrgName();

// ========================================
// 기본 시·도 설정 (필지 주소 검증용)
// ========================================
const DEFAULT_SIDO_KEY = 'app_default_sido';

function loadDefaultSido() {
    const saved = localStorage.getItem(DEFAULT_SIDO_KEY);
    const el = document.getElementById('defaultSido');
    if (el) el.value = saved || '';
}

const saveDefaultSidoBtn = document.getElementById('saveDefaultSidoBtn');
if (saveDefaultSidoBtn) {
    saveDefaultSidoBtn.addEventListener('click', () => {
        const value = document.getElementById('defaultSido').value;
        if (value) {
            localStorage.setItem(DEFAULT_SIDO_KEY, value);
        } else {
            localStorage.removeItem(DEFAULT_SIDO_KEY);
        }
        const statusEl = document.getElementById('defaultSidoSaveStatus');
        if (statusEl) {
            statusEl.style.display = 'inline';
            setTimeout(() => { statusEl.style.display = 'none'; }, 2000);
        }
    });
}

loadDefaultSido();

// 초기화
loadSavedConfig();
renderMigrationList();

// 인증 파일 상태 확인 (Electron)
checkAuthFileStatus();

// 연결 상태 확인
(async function() {
    if (window.storageManager) {
        const mode = await window.storageManager.init();
        const statusEl = document.getElementById('connectionStatus');
        if (mode === 'cloud') {
            statusEl.className = 'status-badge connected';
            statusEl.textContent = '● 연결됨';
            document.getElementById('migrateAllBtn').disabled = false;

            // 인증 파일 섹션도 연결됨으로 표시
            const authStatusEl = document.getElementById('authFileStatus');
            if (authStatusEl) {
                authStatusEl.className = 'status-badge connected';
                authStatusEl.textContent = '● 연결됨';
            }
        }
    }
})();

// ============================================================
// 접수번호 정합성 점검 (SAMPL-1-155)
//
// SAMPL-1-153이 앞으로의 가져오기를, SAMPL-2-30이 입구를 막았지만
// **그 전에 저장된 레코드는 아무도 손대지 않았다.** 이 기능은 그것을 찾아낸다.
//
// ⚠️ **찾기만 하고 고치지 않는다.** 접수번호는 라벨·흙토람 내보내기·대장 출력에
//    이미 쓰였을 수 있어, 도구가 조용히 재부여하면 종이와 화면이 어긋난다.
//
// ⚠️ 배선 전체를 try/catch로 감싸고 실패하면 버튼을 숨긴다. 이 파일은 위에서
//    아래로 실행되는 스크립트라, 여기서 던지면 **뒤에 남은 배선이 통째로 죽는다**
//    (SAMPL-1-156이 값비싸게 배운 것).
// ============================================================
(function bindReceptionAudit() {
    const btn = document.getElementById('receptionAuditBtn');
    const csvBtn = document.getElementById('receptionAuditCsvBtn');
    const box = document.getElementById('receptionAuditResult');
    if (!btn || !box) return;

    /**
     * 점검할 저장소 키를 모두 찾는다.
     *
     * ⚠️ **연도 없는 레거시 키(`soilSampleLogs`)도 포함해야 한다.**
     *    `cache-manager.js:24`가 그 키의 존재를 명시한다. 연도 키만 훑으면
     *    레거시 데이터를 통째로 건너뛰고 **"문제 0건"이라 말하게 된다** —
     *    이 점검이 막으려는 바로 그 조용한 실패다 (독립 리뷰 지적).
     * @returns {Array<{key: string, label: string}>}
     */
    function findSoilStores() {
        const stores = [];
        let hasLegacy = false;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            const m = /^soilSampleLogs_(\d{4})$/.exec(key);
            if (m) stores.push({ key, label: m[1] });
            else if (key === 'soilSampleLogs') hasLegacy = true;
        }
        stores.sort((a, b) => a.label.localeCompare(b.label));
        // 레거시는 맨 뒤에 둔다 — 연도 목록의 정렬을 흐트러뜨리지 않는다
        if (hasLegacy) stores.push({ key: 'soilSampleLogs', label: '연도없음(레거시)' });
        return stores;
    }

    /**
     * 다른 시료 타입의 저장소 키 수를 센다 (SAMPL-1-163).
     *
     * 토양이 0건일 때 **환경이 틀린 것인지 토양만 없는 것인지**를 가르는 신호다.
     * 다른 시료가 있으면 저장소 자체는 맞는 곳이다.
     */
    function countOtherTypeStores() {
        const prefixes = SAMPLE_TYPES
            .filter((t) => t.key !== 'soil')
            .map((t) => t.storagePrefix);
        // ⚠️ **타입 수**를 센다. 키 수를 세면 `waterSampleLogs_2025`·`_2026` 두 연도가
        //    "2종"으로 표시돼 담당자가 시료 종류로 오해한다 (독립 리뷰 MINOR).
        const found = new Set();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            for (const pre of prefixes) {
                // ⚠️ 접두사로 시작하기만 하면 세면 `waterSampleLogs_backup` 같은
                //    저장소 규칙 밖의 키까지 잡힌다. 연도 4자리 또는 레거시(연도 없음)만 인정한다.
                if (key === pre || new RegExp(`^${pre}_\\d{4}$`).test(key)) {
                    found.add(pre);
                    break;
                }
            }
        }
        return found.size;
    }

    let lastReports = [];
    /** 읽지 못한 저장소 이름 — 조용히 넘기면 "문제 0건"이 거짓이 된다 */
    let unreadable = [];
    /**
     * **찾은** 토양 저장소 키 수 (파싱 성공분이 아니라).
     * 파싱 성공분만 세면 손상된 JSON이 있을 때 "키가 없다"로 재분류돼
     * 바로 위의 `⛔ 읽지 못한 저장소` 경고와 본문이 서로 다른 말을 한다.
     */
    let soilStoreCount = 0;

    function render(reports) {
        const S = window.ReceptionAudit;
        const summary = S.summarizeAudit(reports);
        box.innerHTML = '';

        // ⚠️ 읽지 못한 저장소가 있으면 **무엇을 말하든 그 전에** 알린다.
        //    "문제 0건"이 "검사하지 못했다"를 덮으면 안 된다.
        if (unreadable.length) {
            const warn = document.createElement('div');
            warn.style.cssText =
                'padding:0.9rem;border-radius:8px;border:1px solid #fca5a5;background:#fef2f2;margin-bottom:0.75rem;color:#991b1b';
            warn.textContent =
                `⛔ 읽지 못한 저장소가 있습니다: ${unreadable.join(', ')} — 아래 결과는 그 데이터를 포함하지 않습니다.`;
            box.appendChild(warn);
        }

        const wrap = document.createElement('div');
        wrap.style.cssText = 'padding:0.9rem;border-radius:8px;border:1px solid #e2e8f0;background:#f8fafc';

        if (summary.totalRecords === 0) {
            // ⚠️ 예전에는 여기서 `저장된 토양 데이터가 없습니다.` 한 문장만 냈다.
            //    그 문장은 네 가지 상황(키 없음 / 토양만 없음 / 키는 있고 0건 /
            //    다른 환경에서 실행)을 전부 덮어 **담당자가 다음에 무엇을 할지 알 수 없었다**
            //    (SAMPL-1-163 — 담당자가 실제로 이 화면에 막혔다).
            const S = window.ReceptionAudit;
            const d = S.diagnoseEmptyResult({
                soilKeyCount: soilStoreCount,
                otherTypeKeyCount: countOtherTypeStores(),
                totalRecords: summary.totalRecords,
                isElectron: window.electronAPI?.isElectron === true,
                // 주간 캐시 정리 흔적. 이 키는 CacheManager의 KEYS_TO_PRESERVE에 있어
                // 정리 때 지워지지 않으므로, 남아 있으면 "정리된 적이 있다"는 증거다.
                lastCacheClearMs: Number(localStorage.getItem('lastCacheClear')) || null,
                // 0건을 지운 실행도 시각을 남기므로 건수까지 넘겨야 근거가 정확하다.
                // 구 설치본에는 이 키가 없다 — 그때는 null이 되어 최근성만으로 판단한다.
                lastCacheClearCount: localStorage.getItem('lastCacheClearCount') == null
                    ? null
                    : Number(localStorage.getItem('lastCacheClearCount')),
            });
            const head = document.createElement('div');
            head.style.cssText = 'font-weight:600;margin-bottom:0.4rem';
            head.textContent = d.message;
            const hint = document.createElement('div');
            hint.style.cssText = 'font-size:0.84rem;color:#475569;line-height:1.5';
            // ⚠️ textContent만 쓴다 — 값에 사용자 데이터가 섞이지 않지만 규칙을 지킨다
            // 순수 함수가 일반 텍스트를 돌려주므로 여기서 손볼 것이 없다
            //    (표현 계층을 순수 함수에 섞지 않는다 — 독립 리뷰 SUGGESTION)
            hint.textContent = d.hint;
            wrap.appendChild(head);
            wrap.appendChild(hint);
            box.appendChild(wrap);
            if (csvBtn) csvBtn.hidden = true;
            return;
        }

        if (summary.totalIssues === 0) {
            // ⚠️ "0건"을 분명히 말한다. 아무것도 안 보여주면 사용자는 점검이
            //    돌지 않은 것으로 오해한다 — 조용한 성공은 실패와 구별되지 않는다.
            wrap.style.borderColor = '#86efac';
            wrap.style.background = '#f0fdf4';
            wrap.textContent =
                `✅ 확인 결과 문제 0건 (${summary.totalRecords}건 검사, ${reports.length}개 연도)`;
            box.appendChild(wrap);
            if (csvBtn) csvBtn.hidden = true;
            return;
        }

        wrap.style.borderColor = '#fcd34d';
        wrap.style.background = '#fffbeb';
        const head = document.createElement('div');
        head.style.cssText = 'font-weight:600;margin-bottom:0.5rem';
        head.textContent =
            `⚠️ ${summary.totalIssues}건 확인됨 (${summary.totalRecords}건 검사)`;
        wrap.appendChild(head);

        const ul = document.createElement('ul');
        ul.style.cssText = 'margin:0 0 0.5rem 1.1rem;font-size:0.86rem;color:#334155';
        for (const line of summary.lines) {
            const li = document.createElement('li');
            li.textContent = line;   // textContent만 — 값은 사용자 데이터에서 온다
            ul.appendChild(li);
        }
        wrap.appendChild(ul);

        const note = document.createElement('div');
        note.style.cssText = 'font-size:0.8rem;color:#92400e';
        note.textContent =
            '이 도구는 고치지 않습니다. CSV를 내려받아 확인한 뒤, 재부여 여부는 담당자가 판단해 주세요.';
        wrap.appendChild(note);

        box.appendChild(wrap);
        if (csvBtn) csvBtn.hidden = false;
    }

    function toCsv(reports) {
        /** CSV 인젝션 방지 + RFC 4180 (soil-result-importer.js와 같은 규칙) */
        function cell(val) {
            let s = String(val ?? '');
            // ⚠️ 선행 **제어문자**도 막는다. Excel이 앞의 탭·개행을 지우고 나면
            //    그 뒤의 `=`가 수식으로 살아난다 (독립 리뷰 지적).
            //    `soil-result-importer.js`는 `=+-@|`만 보는데, 그쪽도 같은 구멍이 있다.
            if (/^[\t\r\n=+\-@|]/.test(s)) s = "'" + s;
            if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
                s = '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
        }
        const lines = [['연도', '유형', '접수번호', '성명', '구분', '경지구분1차', 'id'].map(cell).join(',')];
        const push = (year, kind, r) =>
            lines.push([year, kind, r.receptionNumber, r.name, r.subCategory, r.landClass1, r.id].map(cell).join(','));

        for (const rep of reports) {
            rep.fillWithoutF.forEach(r => push(rep.year, '성토인데 F 없음', r));
            rep.fWithoutFill.forEach(r => push(rep.year, 'F인데 성토 아님', r));
            rep.lowercaseF.forEach(r => push(rep.year, '소문자 f', r));
            rep.badFormat.forEach(r => push(rep.year, '형식 아님', r));
            rep.duplicates.forEach(d => d.records.forEach(r => push(rep.year, '중복 번호', r)));
        }
        return lines.join('\n');
    }

    btn.addEventListener('click', () => {
        try {
            const S = window.ReceptionAudit;
            if (!S) {
                box.textContent = '점검 모듈을 불러오지 못했습니다.';
                return;
            }
            const stores = findSoilStores();
            soilStoreCount = stores.length;
            unreadable = [];
            lastReports = [];
            for (const store of stores) {
                let logs = [];
                try {
                    const raw = localStorage.getItem(store.key);
                    logs = raw ? JSON.parse(raw) : [];
                } catch (e) {
                    // 손상된 JSON을 조용히 빈 배열로 넘기면 "문제 0건"이라 말하게 된다 —
                    // 그것이 이 점검이 막으려는 바로 그 종류의 거짓말이다.
                    // 화면에도 **읽지 못했다고 말한다.**
                    (window.logger?.warn || console.warn)(`[정합성 점검] ${store.label} 데이터를 읽지 못했습니다`, e);
                    unreadable.push(store.label);
                    continue;
                }
                lastReports.push(S.auditReceptionNumbers(logs, store.label));
            }
            render(lastReports);
        } catch (err) {
            (window.logger?.error || console.error)('[정합성 점검] 실패', err);
            box.textContent = '점검 중 오류가 발생했습니다. 콘솔을 확인해 주세요.';
        }
    });

    csvBtn?.addEventListener('click', () => {
        try {
            const csv = toCsv(lastReports);
            const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `접수번호-정합성-점검.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            (window.logger?.error || console.error)('[정합성 점검] CSV 실패', err);
        }
    });
})();
