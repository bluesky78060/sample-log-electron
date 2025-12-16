// ========================================
// 공통 유틸리티 모듈
// 모든 시료 모듈에서 공통으로 사용하는 함수들
// ========================================

/**
 * 전화번호 자동 포맷팅
 * @param {string} value - 입력값
 * @returns {string} 포맷된 전화번호
 */
function formatPhoneNumber(value) {
    const numbers = value.replace(/[^\d]/g, '');

    if (numbers.length <= 3) {
        return numbers;
    } else if (numbers.length <= 7) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
        if (numbers.startsWith('02')) {
            // 서울 지역번호
            if (numbers.length <= 9) {
                return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`;
            } else {
                return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6)}`;
            }
        } else {
            // 휴대폰 또는 일반 지역번호
            return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
        }
    }
    return value;
}

/**
 * 전화번호 입력 이벤트 핸들러 설정
 * @param {HTMLInputElement} input - 전화번호 입력 요소
 */
function setupPhoneNumberInput(input) {
    if (!input) return;

    input.addEventListener('input', function(e) {
        const cursorPos = this.selectionStart;
        const oldLength = this.value.length;
        this.value = formatPhoneNumber(this.value);
        const newLength = this.value.length;
        const newCursorPos = cursorPos + (newLength - oldLength);
        this.setSelectionRange(newCursorPos, newCursorPos);
    });
}

/**
 * 숫자 천 단위 구분자 포맷팅
 * @param {string|number} value - 숫자 값
 * @returns {string} 포맷된 숫자
 */
function formatNumber(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('ko-KR');
}

/**
 * 면적 포맷팅
 * @param {string|number} value - 면적 값
 * @returns {string} 포맷된 면적
 */
function formatArea(value) {
    return formatNumber(value);
}

/**
 * 단위 라벨 반환
 * @param {string} unit - 단위 코드 ('pyeong' 또는 'm2')
 * @returns {string} 단위 라벨
 */
function getUnitLabel(unit) {
    return unit === 'pyeong' ? '평' : '㎡';
}

/**
 * 면적과 단위를 함께 포맷팅
 * @param {string|number} area - 면적 값
 * @param {string} unit - 단위 코드
 * @returns {string} 포맷된 문자열
 */
function formatAreaWithUnit(area, unit) {
    return `${formatArea(area)} ${getUnitLabel(unit)}`;
}

/**
 * 뷰 전환 함수 생성기
 * @param {Object} options - 옵션
 * @param {NodeList} options.views - 뷰 요소들
 * @param {NodeList} options.navItems - 네비게이션 버튼들
 * @param {Function} [options.onListView] - 목록 뷰 전환 시 콜백
 * @returns {Function} switchView 함수
 */
function createViewSwitcher(options) {
    const { views, navItems, onListView } = options;

    return function switchView(viewName) {
        views.forEach(view => view.classList.remove('active'));
        navItems.forEach(nav => nav.classList.remove('active'));

        const targetView = document.getElementById(`${viewName}View`);
        const targetNav = document.querySelector(`.nav-btn[data-view="${viewName}"]`);

        if (targetView) targetView.classList.add('active');
        if (targetNav) targetNav.classList.add('active');

        // 목록 뷰로 전환 시 콜백 실행
        if (viewName === 'list' && typeof onListView === 'function') {
            onListView();
        }
    };
}

/**
 * 네비게이션 이벤트 핸들러 설정
 * @param {NodeList} navItems - 네비게이션 버튼들
 * @param {Function} switchView - 뷰 전환 함수
 */
function setupNavigation(navItems, switchView) {
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.dataset.view;
            if (viewName) {
                switchView(viewName);
            }
        });
    });
}

/**
 * 연도 선택 핸들러 생성기
 * @param {Object} options - 옵션
 * @param {string} storageKeyPrefix - 스토리지 키 접두사
 * @param {Function} loadYearData - 연도 데이터 로드 함수
 * @param {Object} FileAPI - 파일 API 인스턴스
 * @param {Function} showToast - 토스트 메시지 함수
 * @returns {Object} { getStorageKey, setupYearSelect }
 */
function createYearHandler(options) {
    const { storageKeyPrefix, loadYearData, FileAPI, showToast } = options;

    /**
     * 년도별 스토리지 키 생성
     * @param {string} year - 연도
     * @returns {string} 스토리지 키
     */
    function getStorageKey(year) {
        return `${storageKeyPrefix}_${year}`;
    }

    /**
     * 연도 선택 이벤트 설정
     * @param {HTMLSelectElement} yearSelect - 연도 선택 요소
     * @param {Object} state - 상태 객체 (selectedYear 포함)
     */
    function setupYearSelect(yearSelect, state) {
        if (!yearSelect) return;

        yearSelect.addEventListener('change', async (e) => {
            state.selectedYear = e.target.value;
            loadYearData(state.selectedYear);

            // 자동 저장 경로도 연도별로 업데이트
            if (window.isElectron && FileAPI) {
                await FileAPI.updateAutoSavePath(state.selectedYear);
            }

            if (showToast) {
                showToast(`${state.selectedYear}년 데이터를 불러왔습니다.`, 'success');
            }
        });
    }

    return { getStorageKey, setupYearSelect };
}

/**
 * localStorage에서 안전하게 JSON 파싱
 * @param {string} key - localStorage 키
 * @param {*} defaultValue - 파싱 실패 시 기본값
 * @returns {*} 파싱된 값 또는 기본값
 */
function safeParseJSON(key, defaultValue = []) {
    try {
        const value = localStorage.getItem(key);
        if (!value) return defaultValue;
        return JSON.parse(value);
    } catch (error) {
        console.error(`JSON 파싱 오류 (${key}):`, error);
        return defaultValue;
    }
}

/**
 * 데이터 마이그레이션 (년도 없는 기존 데이터를 현재 년도로 이동)
 * @param {string} oldKey - 기존 스토리지 키
 * @param {string} newKey - 새 스토리지 키
 * @param {Function} log - 로그 함수
 * @returns {Array} 마이그레이션된 데이터
 */
function migrateOldData(oldKey, newKey, log = console.log) {
    const newData = safeParseJSON(newKey, []);
    if (newData.length > 0) return newData;

    const oldData = safeParseJSON(oldKey, []);
    if (oldData.length > 0) {
        localStorage.setItem(newKey, JSON.stringify(oldData));
        log('📂 기존 데이터를 년도별 저장소로 마이그레이션:', oldData.length, '건');
        return oldData;
    }

    return [];
}

/**
 * 자동 저장 초기화 (Electron 환경)
 * @param {Object} options - 옵션
 * @param {string} options.moduleKey - 모듈 키 (soil, water, etc.)
 * @param {string} options.moduleName - 모듈 이름 (한글)
 * @param {Object} options.FileAPI - 파일 API 인스턴스
 * @param {string} options.currentYear - 현재 연도
 * @param {Function} [options.log] - 로그 함수
 */
async function initAutoSave(options) {
    const { moduleKey, moduleName, FileAPI, currentYear, log = console.log } = options;

    if (!window.isElectron) return;

    const autoSaveToggle = document.getElementById('autoSaveToggle');
    const folderSelectedKey = `${moduleKey}AutoSaveFolderSelected`;
    const enabledKey = `${moduleKey}AutoSaveEnabled`;
    const hasSelectedFolder = localStorage.getItem(folderSelectedKey) === 'true';

    if (!hasSelectedFolder) {
        // 잠시 후 폴더 선택 다이얼로그 표시 (UI 로드 후)
        setTimeout(async () => {
            const confirmSelect = confirm(`${moduleName} 자동 저장 기능을 사용하시겠습니까?\n\n저장할 폴더를 선택해주세요.`);
            if (confirmSelect) {
                try {
                    const result = await window.electronAPI.selectAutoSaveFolder();
                    if (result.success) {
                        FileAPI.autoSavePath = await window.electronAPI.getAutoSavePath(moduleKey, currentYear);
                        localStorage.setItem(folderSelectedKey, 'true');
                        localStorage.setItem(enabledKey, 'true');
                        if (autoSaveToggle) {
                            autoSaveToggle.checked = true;
                            autoSaveToggle.dispatchEvent(new Event('change'));
                        }
                        log(`📁 ${moduleName} 자동 저장 폴더 설정됨:`, result.folder);
                    }
                } catch (error) {
                    console.error('폴더 선택 오류:', error);
                }
            }
        }, 500);
    } else {
        // 이전에 폴더를 선택한 경우, 자동 저장 기본 활성화
        localStorage.setItem(enabledKey, 'true');
        if (autoSaveToggle) {
            autoSaveToggle.checked = true;
        }
    }
}

/**
 * 자동 저장 파일에서 데이터 로드
 * @param {Object} FileAPI - 파일 API 인스턴스
 * @param {Function} [log] - 로그 함수
 * @returns {Promise<Array|null>} 로드된 데이터 또는 null
 */
async function loadFromAutoSaveFile(FileAPI, log = console.log) {
    if (!window.isElectron || !FileAPI.autoSavePath) return null;

    try {
        const content = await FileAPI.loadAutoSave();
        if (content) {
            const parsed = JSON.parse(content);
            const loadedData = parsed.data || parsed;
            if (Array.isArray(loadedData) && loadedData.length > 0) {
                log('📂 자동 저장 파일에서 데이터 로드:', loadedData.length, '건');
                return loadedData;
            }
        }
    } catch (error) {
        console.error('자동 저장 파일 로드 오류:', error);
    }
    return null;
}

/**
 * 자동 저장 수행
 * @param {Object} options - 옵션
 * @param {Object} options.FileAPI - 파일 API 인스턴스
 * @param {string} options.moduleKey - 모듈 키
 * @param {Array} options.data - 저장할 데이터
 * @param {Function} [options.log] - 로그 함수
 * @returns {Promise<boolean>} 성공 여부
 */
async function performAutoSave(options) {
    const { FileAPI, moduleKey, data, log = console.log } = options;
    const enabledKey = `${moduleKey}AutoSaveEnabled`;

    if (!window.isElectron) return false;
    if (localStorage.getItem(enabledKey) !== 'true') return false;
    if (!FileAPI.autoSavePath) return false;

    try {
        const saveData = JSON.stringify({
            timestamp: new Date().toISOString(),
            data: data
        }, null, 2);

        const success = await FileAPI.autoSave(saveData);
        if (success) {
            log('💾 자동 저장 완료');
        }
        return success;
    } catch (error) {
        console.error('자동 저장 오류:', error);
        return false;
    }
}

/**
 * 디버그 로그 함수 생성기
 * @param {boolean} debug - 디버그 모드 여부
 * @returns {Function} 로그 함수
 */
function createLogger(debug) {
    return (...args) => debug && console.log(...args);
}

/**
 * HTML 이스케이프 (XSS 방지)
 * @param {string} str - 이스케이프할 문자열
 * @returns {string} 이스케이프된 문자열
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD)
 * @param {Date|string} date - 날짜
 * @returns {string} 포맷된 날짜
 */
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 오늘 날짜를 입력 요소에 설정
 * @param {HTMLInputElement} dateInput - 날짜 입력 요소
 */
function setTodayDate(dateInput) {
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
}

/**
 * UUID 생성 (간단한 버전)
 * @returns {string} UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 전역으로 내보내기
window.SampleUtils = {
    // 포맷팅
    formatPhoneNumber,
    setupPhoneNumberInput,
    formatNumber,
    formatArea,
    getUnitLabel,
    formatAreaWithUnit,
    formatDate,

    // 뷰 & 네비게이션
    createViewSwitcher,
    setupNavigation,

    // 연도 & 데이터
    createYearHandler,
    safeParseJSON,
    migrateOldData,

    // 자동 저장
    initAutoSave,
    loadFromAutoSaveFile,
    performAutoSave,

    // 유틸리티
    createLogger,
    escapeHTML,
    setTodayDate,
    generateUUID
};
