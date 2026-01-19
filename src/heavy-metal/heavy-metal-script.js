/**
 * @fileoverview 토양 중금속 시료 전용 스크립트
 * @description 중금속 분석용 토양 시료 접수/관리 기능
 */

// ========================================
// 상수 정의
// ========================================

/** @type {string} */
const SAMPLE_TYPE = '중금속';

/** @type {string} */
const STORAGE_KEY = 'heavyMetalSampleLogs';

/** @type {string} */
const AUTO_SAVE_FILE = 'heavy-metal-autosave.json';

/** @type {boolean} 디버그 모드 (프로덕션에서는 false) */
const DEBUG = false;

/**
 * 디버그 로그 함수
 * @param {...any} args - 로그 인자
 * @returns {void}
 */
const log = (...args) => DEBUG && console.log(...args);

// ========================================
// 페이지네이션 상태
// ========================================

/** @type {number} */
let currentPage = 1;

/** @type {number} */
let itemsPerPage = parseInt(localStorage.getItem('heavyMetalItemsPerPage'), 10) || 100;

/** @type {number} */
let totalPages = 1;

/** @type {HeavyMetalSampleLog[]} */
let currentLogsData = [];

// 중금속 분석 항목 목록
const ANALYSIS_ITEMS = ['구리', '납', '니켈', '비소', '수은', '아연', '카드뮴', '6가크롬'];

// 년도별 스토리지 키 생성
function getStorageKey(year) {
    return `${STORAGE_KEY}_${year}`;
}

// 데이터가 있는 연도 자동 감지 (현재 연도부터 과거로 검색)
function findYearWithData() {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2020; year--) {
        const key = getStorageKey(year);
        const data = localStorage.getItem(key);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return year.toString();
                }
            } catch (e) {}
        }
    }
    return currentYear.toString();
}

// 년도 선택 관련 변수
let selectedYear = findYearWithData();

// 공통 모듈에서 가져온 변수/함수 사용 (../shared/*.js)
// window.isElectron, window.createFileAPI 등 전역 변수 사용
const FileAPI = window.createFileAPI('heavy-metal');

// heavy-metal 전용 웹 환경 자동저장 확장
FileAPI.autoSaveFolderHandle = null;
const originalAutoSave = FileAPI.autoSave.bind(FileAPI);
FileAPI.autoSave = async function(content) {
    // Electron 환경에서는 기본 autoSave 사용
    if (window.isElectron) {
        return originalAutoSave(content);
    }
    // 웹 환경에서 폴더 핸들이 있으면 사용
    if (this.autoSaveFolderHandle) {
        try {
            const fileHandle = await this.autoSaveFolderHandle.getFileHandle(AUTO_SAVE_FILE, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            return true;
        } catch (e) {
            console.error('자동 저장 실패:', e);
            return false;
        }
    }
    return false;
};

document.addEventListener('DOMContentLoaded', async () => {
    log('🚀 중금속 페이지 로드 시작');
    log(window.isElectron ? '🖥️ Electron 환경' : '🌐 웹 브라우저 환경');

    await FileAPI.init(selectedYear);

    // Firebase 초기화와 AutoSave 초기화를 병렬로 실행
    let firebaseReady = false;

    // Firebase 초기화 Promise
    const firebaseInitPromise = (async () => {
        try {
            if (window.firebaseConfig?.initialize) {
                const firebaseInitialized = await window.firebaseConfig.initialize();
                if (firebaseInitialized && window.firestoreDb?.init) {
                    await window.firestoreDb.init();
                    log('☁️ Firebase 초기화 완료');
                    return true;
                }
            }
        } catch (err) {
            console.warn('Firebase 초기화 실패, 로컬 모드로 동작:', err);
        }
        return false;
    })();

    // AutoSave 초기화 Promise
    const autoSaveInitPromise = SampleUtils.initAutoSave({
        moduleKey: 'heavyMetal',
        moduleName: '중금속',
        FileAPI: FileAPI,
        currentYear: selectedYear,
        log: log,
        showToast: window.showToast
    });

    // 병렬 실행 후 결과 대기
    const [firebaseResult] = await Promise.all([firebaseInitPromise, autoSaveInitPromise]);
    firebaseReady = firebaseResult;

    // 자동 저장 파일에서 데이터 로드하는 함수 (공통 모듈 사용)
    window.loadFromAutoSaveFile = async function() {
        return await SampleUtils.loadFromAutoSaveFile(FileAPI, log);
    };

    // ========================================
    // DOM 요소 참조
    // ========================================
    const form = document.getElementById('sampleForm');
    const tableBody = document.getElementById('logTableBody');
    const emptyState = document.getElementById('emptyState');
    const dateInput = document.getElementById('date');
    const samplingDateInput = document.getElementById('samplingDate');
    const recordCountEl = document.getElementById('recordCount');
    const navItems = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    // 분석항목 체크박스
    const analysisCheckboxes = document.querySelectorAll('input[name="analysisItems"]');
    const selectedItemsCount = document.getElementById('selectedItemsCount');
    const selectAllItemsBtn = document.getElementById('selectAllItemsBtn');

    // 목적 라디오 버튼
    const purposeRadios = document.querySelectorAll('input[name="purpose"]');
    const certificationNotice = document.getElementById('certificationNotice');

    // 주소 관련
    const searchAddressBtn = document.getElementById('searchAddressBtn');
    const addressPostcode = document.getElementById('addressPostcode');
    const addressRoad = document.getElementById('addressRoad');
    const addressDetail = document.getElementById('addressDetail');
    const addressHidden = document.getElementById('address');
    const addressModal = document.getElementById('addressModal');
    const closeAddressModalBtn = document.getElementById('closeAddressModal');
    const daumPostcodeContainer = document.getElementById('daumPostcodeContainer');

    // 채취장소 자동완성
    const samplingLocationInput = document.getElementById('samplingLocation');
    const samplingLocationAutocomplete = document.getElementById('samplingLocationAutocomplete');

    // 작물 검색
    const cropNameInput = document.getElementById('cropName');
    const searchCropBtn = document.getElementById('searchCropBtn');
    const cropModal = document.getElementById('cropModal');

    // ========================================
    // 데이터 초기화
    // ========================================
    // 기존 데이터 마이그레이션 (년도 없는 데이터 → 현재 년도로)
    const oldData = localStorage.getItem(STORAGE_KEY);
    if (oldData) {
        const currentYearKey = getStorageKey(selectedYear);
        if (!localStorage.getItem(currentYearKey)) {
            localStorage.setItem(currentYearKey, oldData);
            log('📦 기존 중금속 데이터를 현재 년도로 마이그레이션 완료');
        }
    }

    // safeParseJSON 사용으로 에러 핸들링
    let sampleLogs = SampleUtils.safeParseJSON(getStorageKey(selectedYear), []);
    let editingIndex = -1;
    let isAllSelected = false;
    let autoSaveFileHandle = null;  // Web 환경 자동저장 파일 핸들

    // 오늘 날짜 설정
    const today = new Date().toISOString().split('T')[0];
    if (dateInput) dateInput.value = today;
    if (samplingDateInput) samplingDateInput.value = today;

    // ========================================
    // 년도 선택 기능
    // ========================================
    const yearSelect = document.getElementById('yearSelect');
    const listYearSelect = document.getElementById('listYearSelect');
    const listViewTitle = document.getElementById('listViewTitle');

    // 현재 년도 선택
    if (yearSelect) {
        yearSelect.value = selectedYear;
    }
    if (listYearSelect) {
        listYearSelect.value = selectedYear;
    }

    // 두 연도 선택 드롭다운 동기화
    function syncYearSelects(newYear) {
        if (yearSelect) yearSelect.value = newYear;
        if (listYearSelect) listYearSelect.value = newYear;
    }

    // 목록 뷰 타이틀 업데이트
    function updateListViewTitle() {
        if (listViewTitle) {
            listViewTitle.textContent = `${selectedYear}년 토양 중금속 접수 목록`;
        }
    }

    // Firebase에서 데이터 로드 (클라우드 동기화)
    async function loadFromFirebase(year) {
        try {
            // storageManager가 클라우드 모드인지 확인
            if (window.storageManager?.isCloudEnabled()) {
                const cloudData = await window.storageManager.load('heavyMetal', parseInt(year), getStorageKey(year));
                if (cloudData && cloudData.length > 0) {
                    // localStorage에도 저장 (캐시)
                    localStorage.setItem(getStorageKey(year), JSON.stringify(cloudData));
                    log('☁️ Firebase에서 데이터 로드:', cloudData.length, '건');
                    return cloudData;
                }
            }
            // firestoreDb 직접 사용 (storageManager가 초기화되지 않은 경우)
            if (window.firestoreDb?.isEnabled()) {
                const cloudData = await window.firestoreDb.getAll('heavyMetal', parseInt(year));
                if (cloudData && cloudData.length > 0) {
                    // localStorage에도 저장 (캐시)
                    localStorage.setItem(getStorageKey(year), JSON.stringify(cloudData));
                    log('☁️ Firebase에서 데이터 로드 (직접):', cloudData.length, '건');
                    return cloudData;
                }
            }
        } catch (error) {
            console.error('Firebase 데이터 로드 실패:', error);
        }
        return null;
    }

    // 년도별 데이터 로드 함수 (Firebase 우선, 로컬 폴백)
    async function loadYearData(year) {
        const yearStorageKey = getStorageKey(year);

        // 1. Firebase에서 먼저 로드 시도
        if (window.firestoreDb?.isEnabled()) {
            try {
                log('☁️ Firebase에서 데이터 로드 중...');
                const cloudData = await window.firestoreDb.getAll('heavyMetal', parseInt(year), { skipOrder: true });

                if (cloudData && cloudData.length > 0) {
                    const localData = SampleUtils.safeParseJSON(yearStorageKey, []);

                    // 스마트 병합: 최신 데이터 선택
                    const mergedData = smartMerge(localData, cloudData);
                    sampleLogs = mergedData.data;
                    localStorage.setItem(yearStorageKey, JSON.stringify(mergedData.data));

                    renderLogs(sampleLogs);
                    const receptionInput = document.getElementById('receptionNumber');
                    if (receptionInput) {
                        receptionInput.value = generateNextReceptionNumber();
                    }
                    updateListViewTitle();

                    if (mergedData.hasChanges) {
                        log('☁️ Firebase에서 동기화 완료:', mergedData.data.length, '건');
                        showToast(`클라우드에서 동기화됨 (${mergedData.updated}건 업데이트, ${mergedData.added}건 추가)`, 'success');
                    } else {
                        log('☁️ Firebase 로드 완료:', cloudData.length, '건');
                    }
                    return;
                }
            } catch (error) {
                console.error('Firebase 로드 실패, 로컬 데이터 사용:', error);
            }
        }

        // 2. Firebase 사용 불가 또는 데이터 없음 → 로컬에서 로드
        sampleLogs = SampleUtils.safeParseJSON(yearStorageKey, []);
        renderLogs(sampleLogs);

        const receptionInput = document.getElementById('receptionNumber');
        if (receptionInput) {
            receptionInput.value = generateNextReceptionNumber();
        }
        updateListViewTitle();
    }

    // 클라우드 동기화 함수 (백그라운드 실행)
    async function syncWithCloud(year) {
        try {
            if (!window.firestoreDb?.isEnabled()) return;

            log('☁️ 클라우드 동기화 시작...');
            const cloudData = await window.firestoreDb.getAll('heavyMetal', parseInt(year), { skipOrder: true });

            if (!cloudData || cloudData.length === 0) {
                log('☁️ 클라우드에 데이터 없음');
                return;
            }

            const yearStorageKey = getStorageKey(year);
            const localData = SampleUtils.safeParseJSON(yearStorageKey, []);

            // 스마트 병합: ID 기반으로 최신 데이터 선택
            const mergedData = smartMerge(localData, cloudData);

            // 변경사항이 있으면 업데이트
            if (mergedData.hasChanges) {
                sampleLogs = mergedData.data;
                localStorage.setItem(yearStorageKey, JSON.stringify(mergedData.data));
                renderLogs(sampleLogs);
                const receptionInput = document.getElementById('receptionNumber');
                if (receptionInput) {
                    receptionInput.value = generateNextReceptionNumber();
                }
                log('☁️ 클라우드에서 동기화 완료:', mergedData.data.length, '건');
                showToast(`클라우드에서 동기화됨 (${mergedData.updated}건 업데이트, ${mergedData.added}건 추가)`, 'success');
            } else {
                log('☁️ 로컬과 클라우드 데이터 동일 (', localData.length, '건)');
            }
        } catch (error) {
            console.error('클라우드 동기화 실패:', error);
        }
    }

    // 스마트 병합 함수 참조 (공통 모듈 사용)
    const smartMerge = window.SyncUtils.smartMerge;

    // 연도 전환 시 자동 저장 파일 복원
    async function loadAutoSaveForSelectedYear() {
        if (!window.isElectron || !FileAPI.autoSavePath || sampleLogs.length > 0) return;

        const autoSaveData = await window.loadFromAutoSaveFile();
        if (autoSaveData && autoSaveData.length > 0) {
            sampleLogs = autoSaveData;
            localStorage.setItem(getStorageKey(selectedYear), JSON.stringify(sampleLogs));
            renderLogs(sampleLogs);
            const receptionInput = document.getElementById('receptionNumber');
            if (receptionInput) {
                receptionInput.value = generateNextReceptionNumber();
            }
            log(`📂 ${selectedYear}년 자동 저장 데이터 로드:`, autoSaveData.length, '건');
        }
    }

    // 년도 선택 변경 이벤트
    if (yearSelect) {
        yearSelect.addEventListener('change', async (e) => {
            selectedYear = e.target.value;
            syncYearSelects(selectedYear);
            loadYearData(selectedYear);
            // 자동 저장 경로도 연도별로 업데이트
            if (window.isElectron) {
                await FileAPI.updateAutoSavePath(selectedYear);
                await loadAutoSaveForSelectedYear();
            }
            showToast(`${selectedYear}년 데이터를 불러왔습니다.`, 'success');
        });
    }

    if (listYearSelect) {
        listYearSelect.addEventListener('change', async (e) => {
            selectedYear = e.target.value;
            syncYearSelects(selectedYear);
            loadYearData(selectedYear);
            // 자동 저장 경로도 연도별로 업데이트
            if (window.isElectron) {
                await FileAPI.updateAutoSavePath(selectedYear);
                await loadAutoSaveForSelectedYear();
            }
            showToast(`${selectedYear}년 데이터를 불러왔습니다.`, 'success');
        });
    }

    // 초기 타이틀 설정
    updateListViewTitle();

    // ========================================
    // 뷰 전환 기능
    // ========================================
    function switchView(viewName) {
        views.forEach(view => view.classList.remove('active'));
        navItems.forEach(nav => nav.classList.remove('active'));

        const targetView = document.getElementById(`${viewName}View`);
        const targetNav = document.querySelector(`.nav-btn[data-view="${viewName}"]`);

        if (targetView) targetView.classList.add('active');
        if (targetNav) targetNav.classList.add('active');

        if (viewName === 'list') {
            renderLogs();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchView(item.dataset.view);
        });
    });

    // 빈 상태에서 폼으로 이동
    const btnGoForm = document.querySelector('.btn-go-form');
    if (btnGoForm) {
        btnGoForm.addEventListener('click', () => switchView('form'));
    }

    // 토스트 메시지 - 공통 모듈 사용 (../shared/toast.js)
    const showToast = window.showToast;

    // ========================================
    // 분석항목 선택 관리
    // ========================================
    function updateSelectedItemsCount() {
        const checked = document.querySelectorAll('input[name="analysisItems"]:checked');
        if (selectedItemsCount) {
            selectedItemsCount.textContent = checked.length;
        }
    }

    analysisCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateSelectedItemsCount);
    });

    // 전체 선택 버튼
    if (selectAllItemsBtn) {
        selectAllItemsBtn.addEventListener('click', () => {
            isAllSelected = !isAllSelected;
            analysisCheckboxes.forEach(cb => {
                cb.checked = isAllSelected;
            });
            selectAllItemsBtn.textContent = isAllSelected ? '전체 해제' : '전체 선택';
            updateSelectedItemsCount();
        });
    }

    // ========================================
    // 목적 선택 - 인증용 안내
    // ========================================
    purposeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const isCertification = ['무농약', '유기농', 'GAP', '저탄소'].includes(radio.value);
            if (certificationNotice) {
                certificationNotice.classList.toggle('hidden', !isCertification);
            }
            // 인증용 선택 시 전체 항목 자동 선택
            if (isCertification) {
                analysisCheckboxes.forEach(cb => cb.checked = true);
                isAllSelected = true;
                if (selectAllItemsBtn) selectAllItemsBtn.textContent = '전체 해제';
                updateSelectedItemsCount();
            }
        });
    });

    // ========================================
    // 법인여부 선택 (개인/법인)
    // ========================================
    const applicantTypeSelect = document.getElementById('applicantType');
    const birthDateField = document.getElementById('birthDateField');
    const corpNumberField = document.getElementById('corpNumberField');
    const birthDateInput = document.getElementById('birthDate');
    const corpNumberInput = document.getElementById('corpNumber');

    if (applicantTypeSelect) {
        applicantTypeSelect.addEventListener('change', () => {
            const isCorpSelected = applicantTypeSelect.value === '법인';
            if (isCorpSelected) {
                birthDateField.classList.add('hidden');
                corpNumberField.classList.remove('hidden');
                birthDateInput.value = '';
            } else {
                birthDateField.classList.remove('hidden');
                corpNumberField.classList.add('hidden');
                corpNumberInput.value = '';
            }
        });
    }

    // ========================================
    // 수령 방법 선택
    // ========================================
    const receptionMethodBtns = document.querySelectorAll('.reception-method-btn');
    const receptionMethodInput = document.getElementById('receptionMethod');

    receptionMethodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            receptionMethodBtns.forEach(b => b.classList.remove('active', 'selected'));
            btn.classList.add('active', 'selected');
            if (receptionMethodInput) {
                receptionMethodInput.value = btn.dataset.method;
            }
        });
    });

    // ========================================
    // 전화번호 자동 하이픈 - 공통 모듈 사용
    // ========================================
    const phoneNumberInput = document.getElementById('phoneNumber');
    window.SampleUtils.setupPhoneNumberInput(phoneNumberInput);

    // 주소 검색 - 공통 모듈 사용 (../shared/address.js)
    const addressManager = new window.AddressManager({
        searchBtn: searchAddressBtn,
        postcodeInput: addressPostcode,
        roadInput: addressRoad,
        detailInput: addressDetail,
        hiddenInput: addressHidden,
        modal: addressModal,
        closeBtn: closeAddressModalBtn,
        container: daumPostcodeContainer
    });

    // ========================================
    // 채취장소 자동완성 (경상북도 전체)
    // ========================================
    const GYEONGBUK_REGION_NAMES = [
        '포항시', '경주시', '김천시', '안동시', '구미시',
        '영천시', '상주시', '문경시', '경산시',
        '군위군', '의성군', '청송군', '영양군', '영덕군',
        '청도군', '고령군', '성주군', '칠곡군', '예천군',
        '봉화군', '울릉군', '영주시', '울진군'
    ];

    if (samplingLocationInput && samplingLocationAutocomplete) {
        samplingLocationInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();
            samplingLocationAutocomplete.innerHTML = '';
            samplingLocationAutocomplete.classList.remove('show');

            if (value.length < 1) return;

            // 이미 완성된 주소인지 확인
            if (GYEONGBUK_REGION_NAMES.some(name => value.startsWith(name))) {
                return;
            }

            // 자동완성 제안
            if (typeof suggestRegionVillages === 'function') {
                const suggestions = suggestRegionVillages(value, null);
                if (suggestions.length > 0) {
                    samplingLocationAutocomplete.innerHTML = suggestions.slice(0, 10).map(suggestion => `
                        <li data-village="${suggestion.village}" data-district="${suggestion.district}" data-region="${suggestion.region}">
                            ${suggestion.displayText}
                        </li>
                    `).join('');
                    samplingLocationAutocomplete.classList.add('show');
                }
            }
        });

        // Enter 키로 자동완성 확인 - 중복 리 검색 지원
        samplingLocationInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = samplingLocationInput.value.trim();

                // 이미 완전한 주소면 무시
                if (GYEONGBUK_REGION_NAMES.some(name => value.startsWith(name))) {
                    samplingLocationAutocomplete.innerHTML = '';
                    samplingLocationAutocomplete.classList.remove('show');
                    return;
                }

                if (typeof parseParcelAddress === 'function') {
                    const result = parseParcelAddress(value);
                    if (result) {
                        // 여러 지역에서 중복되는 경우 (isDuplicate: true) - 드롭다운 표시
                        if (result.isDuplicate && result.locations) {
                            samplingLocationAutocomplete.innerHTML = result.locations.map(loc => `
                                <li data-village="${result.villageName}" data-district="${loc.district}" data-region="${loc.region}" data-lot="${result.lotNumber || ''}">
                                    ${loc.fullAddress} ${result.lotNumber || ''}
                                </li>
                            `).join('');
                            samplingLocationAutocomplete.classList.add('show');
                        }
                        // 단일 지역 내 중복인 경우
                        else if (result.alternatives && result.alternatives.length > 1) {
                            samplingLocationAutocomplete.innerHTML = result.alternatives.map(district => `
                                <li data-village="${result.village}" data-district="${district}" data-lot="${result.lotNumber || ''}" data-region="${result.region}">
                                    ${result.region} ${district} ${result.village} ${result.lotNumber || ''}
                                </li>
                            `).join('');
                            samplingLocationAutocomplete.classList.add('show');
                        } else if (result.fullAddress) {
                            // 단일 매칭 - 바로 변환
                            samplingLocationAutocomplete.innerHTML = '';
                            samplingLocationAutocomplete.classList.remove('show');
                            samplingLocationInput.value = result.fullAddress;
                        }
                    }
                }
            }
        });

        // 자동완성 목록 클릭 시 (중복 리 선택 포함)
        samplingLocationAutocomplete.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const village = e.target.dataset.village;
                const district = e.target.dataset.district;
                const region = e.target.dataset.region;
                const lot = e.target.dataset.lot;

                // 클릭 시 전체 주소로 변환
                const currentValue = samplingLocationInput.value.trim();
                const match = currentValue.match(/(\d+[\d\-]*)$/);
                const lotNumber = lot || (match ? match[1] : '');

                const fullAddress = lotNumber
                    ? `${region} ${district} ${village} ${lotNumber}`
                    : `${region} ${district} ${village}`;

                samplingLocationInput.value = fullAddress;
                samplingLocationAutocomplete.innerHTML = '';
                samplingLocationAutocomplete.classList.remove('show');
            }
        });

        // 포커스 아웃 시 목록 숨김
        samplingLocationInput.addEventListener('blur', () => {
            setTimeout(() => {
                samplingLocationAutocomplete.innerHTML = '';
                samplingLocationAutocomplete.classList.remove('show');
            }, 200);
        });
    }

    // ========================================
    // 작물 검색 모달
    // ========================================
    if (searchCropBtn && cropModal) {
        const closeCropModal = document.getElementById('closeCropModal');
        const cancelCropSelection = document.getElementById('cancelCropSelection');
        const confirmCropSelection = document.getElementById('confirmCropSelection');
        const cropSearchInput = document.getElementById('cropSearchInput');
        const cropList = document.getElementById('cropList');
        const cropCategoryFilter = document.getElementById('cropCategoryFilter');
        const cropResultCount = document.getElementById('cropResultCount');

        let selectedCrop = null;

        searchCropBtn.addEventListener('click', () => {
            cropModal.classList.remove('hidden');
            if (cropSearchInput) cropSearchInput.focus();
            renderCropList();
        });

        function closeCropModalFn() {
            cropModal.classList.add('hidden');
        }

        if (closeCropModal) closeCropModal.addEventListener('click', closeCropModalFn);
        if (cancelCropSelection) cancelCropSelection.addEventListener('click', closeCropModalFn);
        cropModal.querySelector('.modal-overlay')?.addEventListener('click', closeCropModalFn);

        function renderCropList() {
            if (!cropList || typeof CROP_DATA === 'undefined') return;

            const searchTerm = cropSearchInput?.value.toLowerCase() || '';
            const category = cropCategoryFilter?.value || '전체';
            let crops = [];

            // 카테고리 옵션 채우기
            if (cropCategoryFilter && cropCategoryFilter.options.length === 1) {
                Object.keys(CROP_DATA).forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    cropCategoryFilter.appendChild(option);
                });
            }

            // 작물 필터링
            if (category === '전체') {
                Object.values(CROP_DATA).forEach(arr => crops.push(...arr));
            } else {
                crops = CROP_DATA[category] || [];
            }

            if (searchTerm) {
                crops = crops.filter(c => c.toLowerCase().includes(searchTerm));
            }

            cropList.innerHTML = '';
            crops.forEach(crop => {
                const li = document.createElement('li');
                li.textContent = crop;
                li.className = selectedCrop === crop ? 'selected' : '';
                li.addEventListener('click', () => {
                    selectedCrop = crop;
                    renderCropList();
                });
                cropList.appendChild(li);
            });

            if (cropResultCount) {
                cropResultCount.textContent = `${crops.length}개 작물`;
            }
        }

        if (cropSearchInput) {
            cropSearchInput.addEventListener('input', renderCropList);
        }
        if (cropCategoryFilter) {
            cropCategoryFilter.addEventListener('change', renderCropList);
        }

        if (confirmCropSelection) {
            confirmCropSelection.addEventListener('click', () => {
                if (selectedCrop && cropNameInput) {
                    cropNameInput.value = selectedCrop;
                }
                closeCropModalFn();
            });
        }
    }

    // ========================================
    // 접수번호 생성
    // ========================================
    const receptionNumberInput = document.getElementById('receptionNumber');

    // 다음 접수번호 생성
    function generateNextReceptionNumber() {
        let maxNumber = 0;

        // 기존 데이터에서 최대 번호 찾기
        // 형식: 1, 2, 3 (숫자만)
        sampleLogs.forEach(log => {
            if (log.receptionNumber) {
                const num = parseInt(log.receptionNumber, 10);
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            }
        });

        // 다음 번호 생성
        const nextNumber = maxNumber + 1;
        log(`📋 다음 접수번호 생성: ${nextNumber} (기존 최대: ${maxNumber})`);
        return String(nextNumber);
    }

    // 초기 접수번호 설정
    if (receptionNumberInput) {
        receptionNumberInput.value = generateNextReceptionNumber();
    }

    // ========================================
    // 폼 제출 처리
    // ========================================
    const navSubmitBtn = document.getElementById('navSubmitBtn');
    const navResetBtn = document.getElementById('navResetBtn');

    if (navSubmitBtn) {
        navSubmitBtn.addEventListener('click', submitForm);
    }

    if (navResetBtn) {
        navResetBtn.addEventListener('click', resetForm);
    }

    function submitForm() {
        // 필수 필드 검증
        const name = document.getElementById('name')?.value.trim();
        const phoneNumber = document.getElementById('phoneNumber')?.value.trim();
        const samplingLocation = document.getElementById('samplingLocation')?.value.trim();
        const cropName = document.getElementById('cropName')?.value.trim();
        const samplingDate = document.getElementById('samplingDate')?.value;
        const selectedPurpose = document.querySelector('input[name="purpose"]:checked')?.value;
        const selectedItems = Array.from(document.querySelectorAll('input[name="analysisItems"]:checked')).map(cb => cb.value);

        if (!name) {
            showToast('성명을 입력해주세요.', 'error');
            document.getElementById('name')?.focus();
            return;
        }
        if (!phoneNumber) {
            showToast('연락처를 입력해주세요.', 'error');
            document.getElementById('phoneNumber')?.focus();
            return;
        }
        if (!samplingLocation) {
            showToast('시료채취 장소를 입력해주세요.', 'error');
            document.getElementById('samplingLocation')?.focus();
            return;
        }
        if (!cropName) {
            showToast('재배 작물을 입력해주세요.', 'error');
            document.getElementById('cropName')?.focus();
            return;
        }
        if (!samplingDate) {
            showToast('시료 채취일을 선택해주세요.', 'error');
            document.getElementById('samplingDate')?.focus();
            return;
        }
        if (selectedItems.length === 0) {
            showToast('분석의뢰 항목을 1개 이상 선택해주세요.', 'error');
            return;
        }
        if (!selectedPurpose) {
            showToast('목적(용도)을 선택해주세요.', 'error');
            return;
        }

        // 법인여부 데이터 가져오기
        const applicantType = applicantTypeSelect?.value || '개인';

        // 데이터 수집
        const data = {
            id: editingIndex >= 0 ? sampleLogs[editingIndex].id : Date.now(),
            receptionNumber: document.getElementById('receptionNumber')?.value || generateNextReceptionNumber(),
            date: document.getElementById('date')?.value || today,
            name: name,
            phoneNumber: phoneNumber,
            applicantType: applicantType,
            birthDate: applicantType === '개인' ? (birthDateInput?.value || '') : '',
            corpNumber: applicantType === '법인' ? (corpNumberInput?.value || '') : '',
            addressPostcode: addressPostcode?.value || '',
            addressRoad: addressRoad?.value || '',
            addressDetail: addressDetail?.value || '',
            address: addressHidden?.value || '',
            samplingLocation: samplingLocation,
            cropName: cropName,
            treeAge: document.getElementById('treeAge')?.value || '',
            samplingDate: samplingDate,
            sampleCount: document.getElementById('sampleCount')?.value || 1,
            analysisItems: selectedItems,
            purpose: selectedPurpose,
            receptionMethod: receptionMethodInput?.value || '',
            note: document.getElementById('note')?.value || '',
            isCompleted: editingIndex >= 0 ? sampleLogs[editingIndex].isCompleted : false,
            createdAt: editingIndex >= 0 ? sampleLogs[editingIndex].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (editingIndex >= 0) {
            sampleLogs[editingIndex] = data;
            showToast('접수 정보가 수정되었습니다.', 'success');
            editingIndex = -1;
        } else {
            sampleLogs.push(data);
            showToast('접수가 등록되었습니다.', 'success');
        }

        saveData();
        resetForm();
        renderLogs();
    }

    function resetForm() {
        form?.reset();
        editingIndex = -1;

        // 네비게이션 바 버튼 원래대로 복원
        const navSubmitBtn = document.getElementById('navSubmitBtn');
        if (navSubmitBtn) {
            navSubmitBtn.title = '접수 등록';
            navSubmitBtn.classList.remove('btn-edit-mode');
        }

        // 오늘 날짜 재설정
        if (dateInput) dateInput.value = today;
        if (samplingDateInput) samplingDateInput.value = today;

        // 다음 접수번호 자동 생성
        if (receptionNumberInput) receptionNumberInput.value = generateNextReceptionNumber();

        // 수령 방법 선택 초기화
        receptionMethodBtns.forEach(btn => btn.classList.remove('active', 'selected'));
        if (receptionMethodInput) receptionMethodInput.value = '';

        // 법인여부 초기화 (개인으로 복원)
        if (applicantTypeSelect) applicantTypeSelect.value = '개인';
        if (birthDateField) birthDateField.classList.remove('hidden');
        if (corpNumberField) corpNumberField.classList.add('hidden');
        if (birthDateInput) birthDateInput.value = '';
        if (corpNumberInput) corpNumberInput.value = '';

        // 분석항목 초기화
        analysisCheckboxes.forEach(cb => cb.checked = false);
        isAllSelected = false;
        if (selectAllItemsBtn) selectAllItemsBtn.textContent = '전체 선택';
        updateSelectedItemsCount();

        // 인증용 안내 숨기기
        if (certificationNotice) certificationNotice.classList.add('hidden');
    }

    // ========================================
    // 데이터 저장 및 로드
    // ========================================
    function saveData() {
        const yearStorageKey = getStorageKey(selectedYear);

        // 1. ID가 없는 항목에 ID 추가 (로컬 저장 전에 처리)
        sampleLogs = sampleLogs.map(item => ({
            ...item,
            id: item.id || (Date.now().toString(36) + Math.random().toString(36).substr(2, 9))
        }));

        // 2. 로컬(localStorage)에 먼저 저장
        localStorage.setItem(yearStorageKey, JSON.stringify(sampleLogs));
        log('💾 로컬 저장 완료:', sampleLogs.length, '건');

        // 3. Firebase 클라우드에 마이그레이션 (백그라운드)
        if (window.firestoreDb?.isEnabled()) {
            window.firestoreDb.batchSave('heavyMetal', parseInt(selectedYear), sampleLogs)
                .then(() => log('☁️ Firebase 마이그레이션 완료'))
                .catch(err => {
                    console.error('Firebase 마이그레이션 실패:', err);
                    showToast('클라우드 동기화 실패', 'error');
                });
        }

        // 4. 자동 저장
        autoSaveToFile();
    }

    // 자동 저장 수행 함수 (공통 모듈 사용)
    async function autoSaveToFile() {
        return await SampleUtils.performAutoSave({
            FileAPI: FileAPI,
            moduleKey: 'heavyMetal',
            data: sampleLogs,
            webFileHandle: autoSaveFileHandle,
            log: log
        });
    }

    // ========================================
    // 목록 렌더링
    // ========================================

    // 페이지네이션 DOM 요소
    const paginationInfo = document.getElementById('paginationInfo');
    const itemsPerPageSelect = document.getElementById('itemsPerPage');
    const pageNumbersContainer = document.getElementById('pageNumbers');
    const firstPageBtn = document.getElementById('firstPage');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const lastPageBtn = document.getElementById('lastPage');
    const paginationContainer = document.getElementById('pagination');

    // 페이지네이션 초기화
    if (itemsPerPageSelect) {
        itemsPerPageSelect.value = itemsPerPage;
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value, 10);
            localStorage.setItem('heavyMetalItemsPerPage', itemsPerPage);
            currentPage = 1;
            renderCurrentPage();
        });
    }

    // 페이지네이션 버튼 이벤트
    if (firstPageBtn) firstPageBtn.addEventListener('click', () => goToPage(1));
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    if (lastPageBtn) lastPageBtn.addEventListener('click', () => goToPage(totalPages));

    function goToPage(page) {
        if (page < 1 || page > totalPages) return;
        currentPage = page;
        renderCurrentPage();
        const tableWrapper = document.querySelector('.table-wrapper');
        if (tableWrapper) tableWrapper.scrollTop = 0;
    }

    function renderCurrentPage() {
        if (!tableBody) return;

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = currentLogsData.slice(startIndex, endIndex);

        tableBody.innerHTML = '';
        pageData.forEach((logItem) => {
            const tr = document.createElement('tr');
            tr.dataset.index = sampleLogs.indexOf(logItem);

            const analysisItemsStr = logItem.analysisItems ? logItem.analysisItems.join(', ') : '';
            const isAllItems = logItem.analysisItems && logItem.analysisItems.length === ANALYSIS_ITEMS.length;
            const analysisItemsDisplay = !logItem.analysisItems || logItem.analysisItems.length === 0
                ? '-'
                : isAllItems
                    ? '전체 항목'
                    : analysisItemsStr;

            // 접수 방법 텍스트
            const methodText = logItem.receptionMethod || '-';

            // XSS 방지: 사용자 입력 데이터 이스케이프
            const safeName = escapeHTML(logItem.name || '-');
            const safeAddress = escapeHTML(logItem.address || '');
            const safeAddressRoad = escapeHTML(logItem.addressRoad || '-');
            const safePhone = escapeHTML(logItem.phoneNumber || '-');
            const safeSamplingLocation = escapeHTML(logItem.samplingLocation || '-');
            const safeCropName = escapeHTML(logItem.cropName || '-');
            const safeNote = escapeHTML(logItem.note || '-');

            // 법인여부 및 생년월일/법인번호
            const applicantType = logItem.applicantType || '개인';
            const birthOrCorp = applicantType === '법인' ? (logItem.corpNumber || '-') : (logItem.birthDate || '-');

            // 테이블 행 HTML: 개별 데이터는 이미 escapeHTML로 이스케이프됨
            tr.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" data-index="${escapeHTML(String(tr.dataset.index))}"></td>
                <td>
                    <button class="btn-complete ${logItem.isCompleted ? 'completed' : ''}" title="${logItem.isCompleted ? '완료됨' : '미완료'}">
                        ${logItem.isCompleted ? '✓' : '○'}
                    </button>
                </td>
                <td class="col-result">
                    <button class="btn-result ${logItem.testResult === 'pass' ? 'pass' : logItem.testResult === 'fail' ? 'fail' : ''}"
                            title="${logItem.testResult === 'pass' ? '적합' : logItem.testResult === 'fail' ? '부적합' : '미판정 (클릭하여 변경)'}">
                        ${logItem.testResult === 'pass' ? '적합' : logItem.testResult === 'fail' ? '부적합' : '-'}
                    </button>
                </td>
                <td>${escapeHTML(logItem.receptionNumber || '-')}</td>
                <td>${escapeHTML(logItem.date || '-')}</td>
                <td>${safeName}</td>
                <td class="col-applicant-type col-hidden">${escapeHTML(applicantType)}</td>
                <td class="col-birth-corp col-hidden">${escapeHTML(birthOrCorp)}</td>
                <td title="${safeAddress}">${safeAddressRoad.substring(0, 20)}${safeAddressRoad.length > 20 ? '...' : ''}</td>
                <td>${safePhone}</td>
                <td title="${safeSamplingLocation}">${safeSamplingLocation.substring(0, 15)}${safeSamplingLocation.length > 15 ? '...' : ''}</td>
                <td>${safeCropName}${logItem.treeAge ? ' (' + escapeHTML(String(logItem.treeAge)) + '년생)' : ''}</td>
                <td>${escapeHTML(logItem.samplingDate || '-')}</td>
                <td title="${escapeHTML(analysisItemsStr)}">${escapeHTML(analysisItemsDisplay)}</td>
                <td>${escapeHTML(logItem.purpose || '-')}</td>
                <td>${escapeHTML(methodText)}</td>
                <td title="${safeNote}">${safeNote.substring(0, 10)}${safeNote.length > 10 ? '...' : ''}</td>
                <td class="col-mail-date">${escapeHTML(logItem.mailDate || '-')}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-edit" title="수정">✏️</button>
                        <button class="btn-delete" title="삭제">🗑️</button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);
        });

        updatePaginationUI();
    }

    function updatePaginationUI() {
        const totalItems = currentLogsData.length;
        totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        if (currentPage > totalPages) currentPage = totalPages;

        const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);

        if (paginationInfo) {
            paginationInfo.textContent = `${totalItems}건 중 ${startItem}-${endItem}`;
        }

        if (firstPageBtn) firstPageBtn.disabled = currentPage === 1;
        if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
        if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;
        if (lastPageBtn) lastPageBtn.disabled = currentPage === totalPages;

        renderPageNumbers();
    }

    function renderPageNumbers() {
        if (!pageNumbersContainer) return;
        pageNumbersContainer.innerHTML = '';

        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pageNumbersContainer.appendChild(createPageButton(1));
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbersContainer.appendChild(ellipsis);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbersContainer.appendChild(createPageButton(i));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                pageNumbersContainer.appendChild(ellipsis);
            }
            pageNumbersContainer.appendChild(createPageButton(totalPages));
        }
    }

    function createPageButton(pageNum) {
        const btn = document.createElement('button');
        btn.className = `page-btn ${pageNum === currentPage ? 'active' : ''}`;
        btn.textContent = pageNum;
        btn.addEventListener('click', () => goToPage(pageNum));
        return btn;
    }

    function renderLogs(logsToRender = sampleLogs) {
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (logsToRender.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (paginationContainer) paginationContainer.style.display = 'none';
            if (recordCountEl) recordCountEl.textContent = '0건';
            currentLogsData = [];
            updatePaginationUI();
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (paginationContainer) paginationContainer.style.display = 'flex';
        if (recordCountEl) recordCountEl.textContent = `${logsToRender.length}건`;

        // 접수번호 기준 오름차순 정렬
        currentLogsData = [...logsToRender].sort((a, b) => {
            const numA = parseInt(a.receptionNumber, 10) || 0;
            const numB = parseInt(b.receptionNumber, 10) || 0;
            return numA - numB;
        });

        totalPages = Math.ceil(currentLogsData.length / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        renderCurrentPage();
    }

    // ========================================
    // 수정 기능
    // ========================================
    function editLog(index) {
        const log = sampleLogs[index];
        if (!log) return;

        editingIndex = index;

        // 폼에 데이터 채우기
        document.getElementById('receptionNumber').value = log.receptionNumber || '';
        document.getElementById('date').value = log.date || '';
        document.getElementById('name').value = log.name || '';
        document.getElementById('phoneNumber').value = log.phoneNumber || '';
        if (addressPostcode) addressPostcode.value = log.addressPostcode || '';
        if (addressRoad) addressRoad.value = log.addressRoad || '';
        if (addressDetail) addressDetail.value = log.addressDetail || '';
        if (addressHidden) addressHidden.value = log.address || '';
        document.getElementById('samplingLocation').value = log.samplingLocation || '';
        document.getElementById('cropName').value = log.cropName || '';
        document.getElementById('treeAge').value = log.treeAge || '';
        document.getElementById('samplingDate').value = log.samplingDate || '';
        document.getElementById('sampleCount').value = log.sampleCount || 1;
        document.getElementById('note').value = log.note || '';

        // 분석항목 체크
        analysisCheckboxes.forEach(cb => {
            cb.checked = log.analysisItems?.includes(cb.value) || false;
        });
        updateSelectedItemsCount();

        // 목적 선택
        purposeRadios.forEach(radio => {
            radio.checked = radio.value === log.purpose;
        });

        // 수령방법 선택
        receptionMethodBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.method === log.receptionMethod);
            btn.classList.toggle('selected', btn.dataset.method === log.receptionMethod);
        });
        if (receptionMethodInput) receptionMethodInput.value = log.receptionMethod || '';

        // 법인여부/생년월일/법인번호 설정
        const applicantType = log.applicantType || '개인';
        if (applicantTypeSelect) {
            applicantTypeSelect.value = applicantType;
            if (applicantType === '법인') {
                birthDateField.classList.add('hidden');
                corpNumberField.classList.remove('hidden');
                if (corpNumberInput) corpNumberInput.value = log.corpNumber || '';
                if (birthDateInput) birthDateInput.value = '';
            } else {
                birthDateField.classList.remove('hidden');
                corpNumberField.classList.add('hidden');
                if (birthDateInput) birthDateInput.value = log.birthDate || '';
                if (corpNumberInput) corpNumberInput.value = '';
            }
        }

        // 네비게이션 바 버튼 텍스트/스타일 변경
        const navSubmitBtn = document.getElementById('navSubmitBtn');
        if (navSubmitBtn) {
            navSubmitBtn.title = '수정 완료';
            navSubmitBtn.classList.add('btn-edit-mode');
        }

        // 폼 뷰로 전환
        switchView('form');
        showToast('수정 모드입니다.', 'warning');
    }

    // ========================================
    // 엑셀 내보내기
    // ========================================

    // parseAddressParts는 ../shared/address-parser.js에서 전역으로 제공됨

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (sampleLogs.length === 0) {
                showToast('내보낼 데이터가 없습니다.', 'error');
                return;
            }

            const exportData = sampleLogs.map(log => {
                // 분석항목 표시
                const isAllItems = log.analysisItems && log.analysisItems.length === ANALYSIS_ITEMS.length;
                const analysisDisplay = !log.analysisItems || log.analysisItems.length === 0
                    ? '-'
                    : isAllItems
                        ? '전체 항목'
                        : log.analysisItems.join(', ');

                // 주소 파싱 (시도, 시군구, 읍면동, 나머지주소 분리)
                const addressParts = parseAddressParts(log.addressRoad || log.address || '');

                // 법인여부 및 생년월일/법인번호
                const applicantType = log.applicantType || '개인';
                const birthOrCorp = applicantType === '법인' ? (log.corpNumber || '-') : (log.birthDate || '-');

                return {
                    '접수번호': log.receptionNumber || '-',
                    '접수일자': log.date || '-',
                    '성명': log.name || '-',
                    '법인여부': applicantType,
                    '생년월일/법인번호': birthOrCorp,
                    '연락처': log.phoneNumber || '-',
                    '우편번호': log.addressPostcode || '-',
                    '시도': addressParts.sido || '-',
                    '시군구': addressParts.sigungu || '-',
                    '읍면동': addressParts.eupmyeondong || '-',
                    '나머지주소': (addressParts.rest + (log.addressDetail ? ' ' + log.addressDetail : '')).trim() || '-',
                    '시료채취장소': log.samplingLocation || '-',
                    '재배작물': log.cropName || '-',
                    '과수년생': log.treeAge || '-',
                    '채취일': log.samplingDate || '-',
                    '시료수': log.sampleCount || '-',
                    '분석항목': analysisDisplay,
                    '목적': log.purpose || '-',
                    '수령방법': log.receptionMethod || '-',
                    '비고': log.note || '-',
                    '완료여부': log.isCompleted ? '완료' : '미완료',
                    '등록일시': log.createdAt ? new Date(log.createdAt).toLocaleString('ko-KR') : '-'
                };
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();

            // 열 너비 설정
            ws['!cols'] = [
                { wch: 10 },  // 접수번호
                { wch: 12 },  // 접수일자
                { wch: 10 },  // 성명
                { wch: 8 },   // 법인여부
                { wch: 15 },  // 생년월일/법인번호
                { wch: 15 },  // 연락처
                { wch: 8 },   // 우편번호
                { wch: 12 },  // 시도
                { wch: 10 },  // 시군구
                { wch: 10 },  // 읍면동
                { wch: 25 },  // 나머지주소
                { wch: 25 },  // 시료채취장소
                { wch: 12 },  // 재배작물
                { wch: 10 },  // 과수년생
                { wch: 12 },  // 채취일
                { wch: 8 },   // 시료수
                { wch: 40 },  // 분석항목
                { wch: 15 },  // 목적
                { wch: 10 },  // 수령방법
                { wch: 20 },  // 비고
                { wch: 8 },   // 완료여부
                { wch: 20 }   // 등록일시
            ];

            XLSX.utils.book_append_sheet(wb, ws, '토양중금속접수');

            const fileName = `토양중금속_접수대장_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            showToast('엑셀 파일이 다운로드되었습니다.', 'success');
        });
    }

    // ========================================
    // JSON 저장/불러오기 (공통 모듈 사용)
    // ========================================
    SampleUtils.setupJSONSaveHandler({
        buttonElement: document.getElementById('saveJsonBtn'),
        sampleType: SAMPLE_TYPE,
        getData: () => sampleLogs,
        FileAPI: FileAPI,
        filePrefix: '토양중금속',
        showToast: showToast
    });

    SampleUtils.setupJSONLoadHandler({
        inputElement: document.getElementById('loadJsonInput'),
        getData: () => sampleLogs,
        setData: (data) => { sampleLogs = data; },
        saveData: saveData,
        renderData: renderLogs,
        showToast: showToast
    });

    // ========================================
    // 자동저장 설정 (공통 모듈 사용)
    // ========================================

    // 자동 저장 폴더/파일 선택 버튼 설정 (공통 모듈 사용)
    SampleUtils.setupAutoSaveFolderButton({
        moduleKey: 'heavyMetal',
        FileAPI: FileAPI,
        selectedYear: selectedYear,
        getWebFileHandle: () => autoSaveFileHandle,
        setWebFileHandle: (handle) => { autoSaveFileHandle = handle; },
        autoSaveCallback: autoSaveToFile,
        showToast: showToast
    });

    // 자동 저장 토글 이벤트 설정 (공통 모듈 사용)
    SampleUtils.setupAutoSaveToggle({
        moduleKey: 'heavyMetal',
        FileAPI: FileAPI,
        getWebFileHandle: () => autoSaveFileHandle,
        setWebFileHandle: (handle) => { autoSaveFileHandle = handle; },
        autoSaveCallback: autoSaveToFile,
        showToast: showToast,
        log: log
    });

    // ========================================
    // 클라우드 마이그레이션 버튼
    // ========================================
    const migrateBtn = document.getElementById('migrateBtn');
    if (migrateBtn) {
        migrateBtn.addEventListener('click', async () => {
            // Firebase 초기화 시도
            let firebaseInitialized = false;
            let firestoreInitialized = false;
            let initError = null;

            try {
                if (window.firebaseConfig?.initialize) {
                    firebaseInitialized = await window.firebaseConfig.initialize();
                    console.log('Firebase 초기화 결과:', firebaseInitialized);
                }
            } catch (err) {
                console.error('Firebase 초기화 에러:', err);
                initError = err;
            }

            try {
                if (firebaseInitialized && window.firestoreDb?.init) {
                    firestoreInitialized = await window.firestoreDb.init();
                    console.log('Firestore 초기화 결과:', firestoreInitialized);
                }
            } catch (err) {
                console.error('Firestore 초기화 에러:', err);
                initError = err;
            }

            if (!window.firestoreDb?.isEnabled()) {
                if (initError) {
                    showToast('Firebase 초기화 실패: ' + initError.message, 'error');
                } else if (!firebaseInitialized) {
                    showToast('Firebase 연결 실패. 콘솔에서 에러를 확인하세요.', 'error');
                } else if (!firestoreInitialized) {
                    showToast('Firestore 모듈 로드 실패. 페이지를 새로고침하세요.', 'error');
                } else {
                    showToast('Firebase가 설정되지 않았습니다.', 'error');
                }
                return;
            }

            if (sampleLogs.length === 0) {
                showToast('마이그레이션할 데이터가 없습니다.', 'warning');
                return;
            }

            if (!confirm(`현재 ${selectedYear}년 데이터 ${sampleLogs.length}건을 클라우드에 업로드하시겠습니까?`)) {
                return;
            }

            try {
                migrateBtn.disabled = true;
                migrateBtn.textContent = '⏳';

                const dataWithIds = sampleLogs.map(item => ({
                    ...item,
                    id: item.id || (Date.now().toString(36) + Math.random().toString(36).substr(2, 9))
                }));

                await window.firestoreDb.batchSave('heavyMetal', parseInt(selectedYear), dataWithIds);

                sampleLogs = dataWithIds;
                localStorage.setItem(getStorageKey(selectedYear), JSON.stringify(sampleLogs));

                showToast(`${dataWithIds.length}건 클라우드 업로드 완료`, 'success');
            } catch (error) {
                console.error('마이그레이션 실패:', error);
                showToast('클라우드 업로드 실패: ' + error.message, 'error');
            } finally {
                migrateBtn.disabled = false;
                migrateBtn.textContent = '☁️';
            }
        });
    }

    // Electron 환경에서 자동 저장 파일 로드
    if (window.isElectron && FileAPI.autoSavePath) {
        const autoSaveData = await window.loadFromAutoSaveFile();
        if (autoSaveData && autoSaveData.length > 0) {
            sampleLogs = autoSaveData;
            localStorage.setItem(getStorageKey(selectedYear), JSON.stringify(sampleLogs));
            log('📂 중금속 자동 저장 파일에서 데이터 로드됨:', autoSaveData.length, '건');
            renderLogs();
        }
    }

    // ========================================
    // 테이블 이벤트 위임 (한 번만 등록 - Electron 호환)
    // ========================================
    tableBody?.addEventListener('click', (e) => {
        const tr = e.target.closest('tr[data-index]');
        if (!tr) return;
        const realIdx = parseInt(tr.dataset.index, 10);

        // 완료 토글
        if (e.target.closest('.btn-complete')) {
            sampleLogs[realIdx].isCompleted = !sampleLogs[realIdx].isCompleted;
            sampleLogs[realIdx].updatedAt = new Date().toISOString();
            saveData();
            renderLogs();
            return;
        }

        // 판정 토글 (미판정 → 적합 → 부적합 → 미판정)
        if (e.target.closest('.btn-result')) {
            const logItem = sampleLogs[realIdx];
            if (!logItem.testResult || logItem.testResult === '') {
                logItem.testResult = 'pass';
            } else if (logItem.testResult === 'pass') {
                logItem.testResult = 'fail';
            } else {
                logItem.testResult = '';
            }
            logItem.updatedAt = new Date().toISOString();
            saveData();
            renderLogs();
            return;
        }

        // 수정 버튼
        if (e.target.closest('.btn-edit')) {
            editLog(realIdx);
            return;
        }

        // 삭제 버튼
        if (e.target.closest('.btn-delete')) {
            if (confirm('정말 삭제하시겠습니까?')) {
                const deletedItem = sampleLogs[realIdx];
                const deletedId = deletedItem?.id;

                sampleLogs.splice(realIdx, 1);
                saveData();
                renderLogs();
                showToast('삭제되었습니다.', 'success');

                // Firebase에서도 삭제
                if (deletedId && window.firestoreDb?.isEnabled()) {
                    window.firestoreDb.delete('heavy-metal', parseInt(selectedYear), deletedId)
                        .catch(err => console.error('Firebase 삭제 실패:', err));
                }
            }
            return;
        }
    });

    // ========================================
    // 선택 삭제
    // ========================================
    const btnBulkDelete = document.getElementById('btnBulkDelete');
    const selectAllCheckbox = document.getElementById('selectAll');

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.row-checkbox');
            checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
        });
    }

    if (btnBulkDelete) {
        btnBulkDelete.addEventListener('click', () => {
            const checked = document.querySelectorAll('.row-checkbox:checked');
            if (checked.length === 0) {
                showToast('삭제할 항목을 선택해주세요.', 'warning');
                return;
            }

            if (confirm(`${checked.length}건의 데이터를 삭제하시겠습니까?`)) {
                const indices = Array.from(checked).map(cb => parseInt(cb.dataset.index, 10)).sort((a, b) => b - a);
                // 삭제 전 ID들 수집 (인덱스가 변경되기 전에)
                const deletedIds = indices.map(idx => sampleLogs[idx]?.id).filter(id => id);

                indices.forEach(idx => sampleLogs.splice(idx, 1));
                saveData();
                renderLogs();
                showToast(`${checked.length}건이 삭제되었습니다.`, 'success');

                // Firebase에서도 삭제
                if (deletedIds.length > 0 && window.firestoreDb?.isEnabled()) {
                    Promise.all(deletedIds.map(id =>
                        window.firestoreDb.delete('heavy-metal', parseInt(selectedYear), id)
                    ))
                        .then(() => log('☁️ Firebase 일괄 삭제 완료:', deletedIds.length, '건'))
                        .catch(err => console.error('Firebase 일괄 삭제 실패:', err));
                }
            }
        });
    }

    // ========================================
    // 우편발송일자 일괄 입력 (모달 사용)
    // ========================================
    const btnBulkMailDate = document.getElementById('btnBulkMailDate');
    const mailDateModal = document.getElementById('mailDateModal');
    const closeMailDateModal = document.getElementById('closeMailDateModal');
    const cancelMailDateBtn = document.getElementById('cancelMailDateBtn');
    const confirmMailDateBtn = document.getElementById('confirmMailDateBtn');
    const mailDateInput = document.getElementById('mailDateInput');
    const mailDateInfo = document.getElementById('mailDateInfo');

    let pendingMailDateIndices = [];

    function openMailDateModal(indices) {
        pendingMailDateIndices = indices;
        const today = new Date().toISOString().split('T')[0];
        if (mailDateInput) mailDateInput.value = today;
        if (mailDateInfo) mailDateInfo.textContent = `선택한 ${indices.length}건의 우편발송일자를 입력하세요.`;
        if (mailDateModal) mailDateModal.classList.remove('hidden');
    }

    function closeMailDateModalFn() {
        if (mailDateModal) mailDateModal.classList.add('hidden');
        pendingMailDateIndices = [];
    }

    if (closeMailDateModal) closeMailDateModal.addEventListener('click', closeMailDateModalFn);
    if (cancelMailDateBtn) cancelMailDateBtn.addEventListener('click', closeMailDateModalFn);
    if (mailDateModal) {
        mailDateModal.querySelector('.modal-overlay')?.addEventListener('click', closeMailDateModalFn);
    }

    if (confirmMailDateBtn) {
        confirmMailDateBtn.addEventListener('click', () => {
            const inputDate = mailDateInput?.value;

            if (!inputDate) {
                showToast('날짜를 선택해주세요.', 'warning');
                return;
            }

            // 선택된 항목들의 발송일자 업데이트
            pendingMailDateIndices.forEach(idx => {
                if (sampleLogs[idx]) {
                    sampleLogs[idx].mailDate = inputDate;
                    sampleLogs[idx].updatedAt = new Date().toISOString();
                }
            });

            saveData();
            renderLogs();

            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            }

            closeMailDateModalFn();
            showToast(`${pendingMailDateIndices.length}건의 발송일자가 입력되었습니다.`, 'success');
        });
    }

    if (btnBulkMailDate) {
        btnBulkMailDate.addEventListener('click', () => {
            const checked = document.querySelectorAll('.row-checkbox:checked');
            if (checked.length === 0) {
                showToast('발송일자를 입력할 항목을 선택해주세요.', 'warning');
                return;
            }

            const indices = Array.from(checked).map(cb => parseInt(cb.dataset.index, 10));
            openMailDateModal(indices);
        });
    }

    // ========================================
    // 검색 모달
    // ========================================
    const listSearchModal = document.getElementById('listSearchModal');
    const openSearchModalBtn = document.getElementById('openSearchModalBtn');
    const closeSearchModal = document.getElementById('closeSearchModal');
    const searchDateFromInput = document.getElementById('searchDateFromInput');
    const searchDateToInput = document.getElementById('searchDateToInput');
    const searchNameInput = document.getElementById('searchNameInput');
    const searchReceptionFromInput = document.getElementById('searchReceptionFromInput');
    const searchReceptionToInput = document.getElementById('searchReceptionToInput');
    const clearSearchDate = document.getElementById('clearSearchDate');
    const clearSearchReception = document.getElementById('clearSearchReception');
    const applySearchBtn = document.getElementById('applySearchBtn');
    const resetSearchBtn = document.getElementById('resetSearchBtn');

    // 현재 검색 필터 상태
    let currentSearchFilter = {
        dateFrom: '',
        dateTo: '',
        name: '',
        receptionFrom: '',
        receptionTo: ''
    };

    // 접수번호에서 숫자 부분 추출
    function extractReceptionNumber(receptionNumber) {
        const match = receptionNumber.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    }

    function filterAndRenderLogs() {
        const filtered = sampleLogs.filter(log => {
            // 성명 검색
            const matchesName = !currentSearchFilter.name ||
                (log.name || '').toLowerCase().includes(currentSearchFilter.name);

            // 접수번호 범위 검색
            let matchesReception = true;
            if (currentSearchFilter.receptionFrom || currentSearchFilter.receptionTo) {
                const logNum = extractReceptionNumber(log.receptionNumber || '');
                const fromNum = currentSearchFilter.receptionFrom ? parseInt(currentSearchFilter.receptionFrom, 10) : 0;
                const toNum = currentSearchFilter.receptionTo ? parseInt(currentSearchFilter.receptionTo, 10) : Infinity;
                if (fromNum && logNum < fromNum) matchesReception = false;
                if (toNum !== Infinity && logNum > toNum) matchesReception = false;
            }

            // 날짜 범위 검색
            let matchesDate = true;
            if (currentSearchFilter.dateFrom || currentSearchFilter.dateTo) {
                const logDate = log.date;
                if (currentSearchFilter.dateFrom && logDate < currentSearchFilter.dateFrom) matchesDate = false;
                if (currentSearchFilter.dateTo && logDate > currentSearchFilter.dateTo) matchesDate = false;
            }

            return matchesName && matchesReception && matchesDate;
        });

        renderLogs(filtered);
        updateSearchButtonState();
        showToast(`${filtered.length}건의 검색 결과`, 'success');
    }

    function updateSearchButtonState() {
        const hasFilter = currentSearchFilter.dateFrom || currentSearchFilter.dateTo ||
            currentSearchFilter.name || currentSearchFilter.receptionFrom || currentSearchFilter.receptionTo;
        if (openSearchModalBtn) {
            if (hasFilter) {
                openSearchModalBtn.classList.add('has-filter');
                openSearchModalBtn.innerHTML = '🔍 검색 중';
            } else {
                openSearchModalBtn.classList.remove('has-filter');
                openSearchModalBtn.innerHTML = '🔍 검색';
            }
        }
    }

    if (openSearchModalBtn && listSearchModal) {
        openSearchModalBtn.addEventListener('click', () => {
            if (searchDateFromInput) searchDateFromInput.value = currentSearchFilter.dateFrom;
            if (searchDateToInput) searchDateToInput.value = currentSearchFilter.dateTo;
            if (searchNameInput) searchNameInput.value = currentSearchFilter.name;
            if (searchReceptionFromInput) searchReceptionFromInput.value = currentSearchFilter.receptionFrom;
            if (searchReceptionToInput) searchReceptionToInput.value = currentSearchFilter.receptionTo;
            listSearchModal.classList.remove('hidden');
            if (searchNameInput) searchNameInput.focus();
        });
    }

    if (closeSearchModal) {
        closeSearchModal.addEventListener('click', () => {
            listSearchModal.classList.add('hidden');
        });
    }
    listSearchModal?.querySelector('.modal-overlay')?.addEventListener('click', () => {
        listSearchModal.classList.add('hidden');
    });

    if (clearSearchDate) {
        clearSearchDate.addEventListener('click', () => {
            if (searchDateFromInput) searchDateFromInput.value = '';
            if (searchDateToInput) searchDateToInput.value = '';
        });
    }

    if (clearSearchReception) {
        clearSearchReception.addEventListener('click', () => {
            if (searchReceptionFromInput) searchReceptionFromInput.value = '';
            if (searchReceptionToInput) searchReceptionToInput.value = '';
        });
    }

    if (applySearchBtn) {
        applySearchBtn.addEventListener('click', () => {
            currentSearchFilter.dateFrom = searchDateFromInput ? searchDateFromInput.value : '';
            currentSearchFilter.dateTo = searchDateToInput ? searchDateToInput.value : '';
            currentSearchFilter.name = searchNameInput ? searchNameInput.value.toLowerCase() : '';
            currentSearchFilter.receptionFrom = searchReceptionFromInput ? searchReceptionFromInput.value : '';
            currentSearchFilter.receptionTo = searchReceptionToInput ? searchReceptionToInput.value : '';
            filterAndRenderLogs();
            listSearchModal.classList.add('hidden');
        });
    }

    if (resetSearchBtn) {
        resetSearchBtn.addEventListener('click', () => {
            if (searchDateFromInput) searchDateFromInput.value = '';
            if (searchDateToInput) searchDateToInput.value = '';
            if (searchNameInput) searchNameInput.value = '';
            if (searchReceptionFromInput) searchReceptionFromInput.value = '';
            if (searchReceptionToInput) searchReceptionToInput.value = '';
            currentSearchFilter = { dateFrom: '', dateTo: '', name: '', receptionFrom: '', receptionTo: '' };
            renderLogs();
            updateSearchButtonState();
            listSearchModal.classList.add('hidden');
        });
    }

    // Enter 키로 검색
    [searchNameInput, searchReceptionFromInput, searchReceptionToInput].forEach(input => {
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && applySearchBtn) applySearchBtn.click();
            });
        }
    });

    // ========================================
    // 통계 모달
    // ========================================
    const statisticsModal = document.getElementById('statisticsModal');
    const btnStatistics = document.getElementById('btnStatistics');
    const closeStatisticsModal = document.getElementById('closeStatisticsModal');
    const closeStatisticsBtn = document.getElementById('closeStatisticsBtn');

    if (btnStatistics && statisticsModal) {
        btnStatistics.addEventListener('click', () => {
            updateStatistics();
            statisticsModal.classList.remove('hidden');
        });
    }

    [closeStatisticsModal, closeStatisticsBtn].forEach(btn => {
        btn?.addEventListener('click', () => statisticsModal.classList.add('hidden'));
    });
    statisticsModal?.querySelector('.modal-overlay')?.addEventListener('click', () => {
        statisticsModal.classList.add('hidden');
    });

    function updateStatistics() {
        // 총 접수
        document.getElementById('statTotalCount').textContent = sampleLogs.length;

        // 완료/미완료
        const completed = sampleLogs.filter(l => l.isCompleted).length;
        document.getElementById('statCompletedCount').textContent = completed;
        document.getElementById('statPendingCount').textContent = sampleLogs.length - completed;

        // 분석항목별 통계
        const byAnalysisItem = {};
        ANALYSIS_ITEMS.forEach(item => byAnalysisItem[item] = 0);
        sampleLogs.forEach(log => {
            (log.analysisItems || []).forEach(item => {
                if (byAnalysisItem[item] !== undefined) byAnalysisItem[item]++;
            });
        });
        renderBarChart('statsByAnalysisItem', byAnalysisItem);

        // 목적별 통계
        const byPurpose = {};
        sampleLogs.forEach(log => {
            const p = log.purpose || '미지정';
            byPurpose[p] = (byPurpose[p] || 0) + 1;
        });
        renderBarChart('statsByPurpose', byPurpose);

        // 월별 집계 (1~12월 전체, 완료/미완료 구분)
        const byMonth = {};
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

        // 1~12월 초기화
        for (let i = 1; i <= 12; i++) {
            const monthKey = String(i).padStart(2, '0');
            byMonth[monthKey] = {
                count: 0,
                completed: 0,
                pending: 0,
                label: monthNames[i - 1],
                class: 'month'
            };
        }

        // 데이터 집계
        sampleLogs.forEach(log => {
            if (log.date) {
                const monthNum = log.date.substring(5, 7);
                if (byMonth[monthNum]) {
                    byMonth[monthNum].count++;
                    if (log.isCompleted) {
                        byMonth[monthNum].completed++;
                    } else {
                        byMonth[monthNum].pending++;
                    }
                }
            }
        });

        // 분기별 집계
        const byQuarter = {
            Q1: { count: 0, completed: 0, pending: 0, label: '1분기 (1~3월)' },
            Q2: { count: 0, completed: 0, pending: 0, label: '2분기 (4~6월)' },
            Q3: { count: 0, completed: 0, pending: 0, label: '3분기 (7~9월)' },
            Q4: { count: 0, completed: 0, pending: 0, label: '4분기 (10~12월)' }
        };

        Object.entries(byMonth).forEach(([monthKey, data]) => {
            const monthNum = parseInt(monthKey, 10);
            let quarter;
            if (monthNum <= 3) quarter = 'Q1';
            else if (monthNum <= 6) quarter = 'Q2';
            else if (monthNum <= 9) quarter = 'Q3';
            else quarter = 'Q4';

            byQuarter[quarter].count += data.count;
            byQuarter[quarter].completed += data.completed;
            byQuarter[quarter].pending += data.pending;
        });

        renderMonthlyChart('statsByMonth', byMonth);
        renderQuarterlySummary('statsQuarterly', byQuarter);

        // 수령방법별 통계
        const byMethod = {};
        sampleLogs.forEach(log => {
            const m = log.receptionMethod || '미지정';
            byMethod[m] = (byMethod[m] || 0) + 1;
        });
        renderBarChart('statsByReceptionMethod', byMethod);
    }

    function renderMonthlyChart(containerId, byMonth) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
        const maxCount = Math.max(...entries.map(([, v]) => v.count), 1);
        const totalCount = entries.reduce((sum, [, v]) => sum + v.count, 0);

        if (totalCount === 0) {
            container.innerHTML = '<div class="stats-empty">데이터가 없습니다</div>';
            return;
        }

        container.innerHTML = `
            <div class="monthly-chart">
                <div class="monthly-bars">
                    ${entries.map(([key, value]) => {
                        const heightPercent = maxCount > 0 ? (value.count / maxCount) * 100 : 0;
                        const completedPercent = value.count > 0 ? (value.completed / value.count) * 100 : 0;
                        return `
                            <div class="monthly-bar-group">
                                <div class="monthly-bar-container">
                                    <div class="monthly-bar-stack" style="height: ${heightPercent}%">
                                        <div class="monthly-bar-completed" style="height: ${completedPercent}%" title="완료: ${value.completed}건"></div>
                                        <div class="monthly-bar-pending" style="height: ${100 - completedPercent}%" title="미완료: ${value.pending}건"></div>
                                    </div>
                                    ${value.count > 0 ? `<span class="monthly-bar-value">${value.count}</span>` : ''}
                                </div>
                                <span class="monthly-bar-label">${value.label}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="monthly-legend">
                    <span class="legend-item"><span class="legend-color completed"></span> 완료</span>
                    <span class="legend-item"><span class="legend-color pending"></span> 미완료</span>
                </div>
            </div>
        `;
    }

    function renderQuarterlySummary(containerId, byQuarter) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = Object.entries(byQuarter).sort((a, b) => a[0].localeCompare(b[0]));
        const totalCount = entries.reduce((sum, [, v]) => sum + v.count, 0);

        if (totalCount === 0) {
            container.innerHTML = '<div class="stats-empty">데이터가 없습니다</div>';
            return;
        }

        container.innerHTML = `
            <div class="quarterly-summary">
                ${entries.map(([key, data]) => `
                    <div class="quarterly-card">
                        <div class="quarterly-header">${data.label}</div>
                        <div class="quarterly-count">${data.count}<span>건</span></div>
                        <div class="quarterly-details">
                            <span class="detail-completed">완료 ${data.completed}</span>
                            <span class="detail-pending">미완료 ${data.pending}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderBarChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = Object.entries(data);
        const maxVal = Math.max(...entries.map(([, v]) => v), 1);

        // 분석항목별 클래스 매핑
        const analysisClassMap = {
            '납(Pb)': 'analysis-pb',
            '카드뮴(Cd)': 'analysis-cd',
            '비소(As)': 'analysis-as',
            '수은(Hg)': 'analysis-hg',
            '크롬(Cr)': 'analysis-cr',
            '구리(Cu)': 'analysis-cu',
            '니켈(Ni)': 'analysis-ni',
            '아연(Zn)': 'analysis-zn'
        };

        // 목적별 클래스 매핑
        const purposeClassMap = {
            '농경지': 'purpose-farm',
            '공장부지': 'purpose-factory',
            '주거지역': 'purpose-residential',
            '기타': 'purpose-other'
        };

        // 수령방법별 클래스 매핑
        const methodClassMap = {
            '우편': 'method-mail',
            '이메일': 'method-email',
            '팩스': 'method-fax',
            '직접방문': 'method-visit'
        };

        container.innerHTML = entries.map(([label, value]) => {
            const barClass = analysisClassMap[label] || purposeClassMap[label] || methodClassMap[label] || '';
            return `
                <div class="stat-bar-row">
                    <span class="stat-bar-label">${label}</span>
                    <div class="stat-bar-track">
                        <div class="stat-bar-fill ${barClass}" style="width: ${(value / maxVal) * 100}%"></div>
                    </div>
                    <span class="stat-bar-value">${value}</span>
                </div>
            `;
        }).join('');
    }

    // ========================================
    // 라벨 인쇄
    // ========================================
    const btnLabelPrint = document.getElementById('btnLabelPrint');
    if (btnLabelPrint) {
        btnLabelPrint.addEventListener('click', () => {
            const checked = document.querySelectorAll('.row-checkbox:checked');
            if (checked.length === 0) {
                showToast('라벨 인쇄할 항목을 선택해주세요.', 'warning');
                return;
            }

            const selectedData = Array.from(checked).map(cb => {
                const idx = parseInt(cb.dataset.index, 10);
                return sampleLogs[idx];
            });

            // 라벨 인쇄 페이지로 데이터 전달
            localStorage.setItem('labelPrintData', JSON.stringify({
                type: '중금속',
                data: selectedData
            }));

            window.location.href = '../label-print/index.html';
        });
    }

    // ========================================
    // 초기 렌더링
    // ========================================

    // 초기 데이터 로드 (Firebase 우선)
    await loadYearData(selectedYear);
    updateSelectedItemsCount();

    log('✅ 중금속 페이지 초기화 완료');
});
