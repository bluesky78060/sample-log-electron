/**
 * @fileoverview 토양 시료 전용 스크립트
 * SoilSampleManager - BaseSampleManager 상속
 */

// ========================================
// 상수 및 설정
// ========================================

/** @type {string} */
const SAMPLE_TYPE = '토양';

/** @type {string} */
const STORAGE_KEY = 'soilSampleLogs';

/** @type {string} */
const AUTO_SAVE_FILE = 'soil-autosave.json';

// ========================================
// 경지구분 1차 (landClass1)
// ========================================

/**
 * 경지구분 1차 값 목록 (단일 소스 — 폼/탭 option은 이 배열로 JS 동적 생성)
 * @type {string[]}
 */
const LAND_CLASS1_OPTIONS = ['개량제', '전략', '직불', '자체', '기타', '친환경', '유기농', '무농약', 'GAP', '농가의뢰', '대표필지', '공익직불제'];
// SAMPL-1-89: 공익직불제 기준년도(이행점검명) 선택지 (임시값, 추후 교체 가능)
const GONGIK_BASE_YEAR_OPTIONS = ['2024토양화학성분 기준', '2025토양화학성분 기준', '2026토양화학성분 기준', '2027토양화학성분 기준'];

/** @type {string} 기본 경지구분 1차 */
const LAND_CLASS1_DEFAULT = '농가의뢰';

/**
 * 통계용 라벨·색상 매핑. LAND_CLASS1_OPTIONS 변경 시 함께 갱신할 것.
 * 매핑 외 값은 category-other 폴백.
 */
const LAND_CLASS1_STATS_MAPPING = {
    '농가의뢰': { label: '🧑‍🌾 농가의뢰', class: 'purpose-general' },
    '공익직불제': { label: '🏛️ 공익직불제', class: 'purpose-gap' },
    '대표필지': { label: '📍 대표필지', class: 'category-facility' },
    '개량제': { label: '🧪 개량제', class: 'category-fill' },
    '전략': { label: '🎯 전략', class: 'category-fruit' },
    '직불': { label: '💰 직불', class: 'purpose-lowcarbon' },
    '자체': { label: '🏢 자체', class: 'category-facility' },
    '친환경': { label: '🌿 친환경', class: 'purpose-nopesticide' },
    '유기농': { label: '♻️ 유기농', class: 'purpose-organic' },
    '무농약': { label: '🍃 무농약', class: 'category-field' },
    'GAP': { label: '✅ GAP', class: 'purpose-gap' },
    '기타': { label: '📦 기타', class: 'category-other' }
};

// ========================================
// SoilSampleManager 클래스
// ========================================

class SoilSampleManager extends window.BaseSampleManager {
    constructor() {
        super({
            moduleKey: 'soil',
            moduleName: '토양',
            storageKey: STORAGE_KEY,
            sampleType: SAMPLE_TYPE,
            autoSaveFile: AUTO_SAVE_FILE,
            debug: !!window.DEBUG
        });

        // Soil-specific state
        this.parcels = [];
        this.parcelIdCounter = 0;
        this.currentRegistrationData = null;
        this.listViewStale = true;
        this.currentSearchFilter = {
            dateFrom: '',
            dateTo: '',
            name: '',
            receptionFrom: '',
            receptionTo: '',
            lot: '',
            purpose: '',
            landClass1: LAND_CLASS1_DEFAULT, // SAMPL-1-88: 목록 기본 경지구분 = 농가의뢰 (별도 관리)
            completed: 'incomplete'
        };
        this.isFullView = false;
        this.autoSaveFileHandle = null;
        this.regionSelectionModalData = null;
        // editingId / editingGroupIds 는 Base 생성자에서 초기화 (편집 상태 표준화)
        this.pendingMailDateIds = [];

        // Pagination state (soil uses its own pagination, NOT PaginationManager)
        this.currentFlatRows = [];

        // Modal state
        this.currentParcelIdForCrop = null;
        this.tempCropAreas = [];
        this.currentSubLotParcelId = null;
        this.currentSubLotIndex = null;

        // Crop modal state (legacy)
        this.tempSelectedCrops = [];
        this.confirmedCrops = [];

        // Soil-specific DOM refs (set in cacheElements)
        this.dateInput = null;
        this.parcelsContainer = null;
        this.addParcelBtn = null;
        this.parcelsDataInput = null;
        this.emptyParcels = null;
        this.paginationContainer = null;
        this.receptionNumberInput = null;
        this.subCategorySelect = null;
        this.purposeSelect = null;
        this.landClass1Select = null;
        this.receptionMethodBtns = null;
        this.receptionMethodInput = null;
        this.navSubmitBtn = null;
        this.navResetBtn = null;
        this.selectAllCheckbox = null;
        this.logTable = null;
        this.listViewTitle = null;

        // Pagination DOM refs
        this.paginationInfo = null;
        this.itemsPerPageSelect = null;
        this.pageNumbersContainer = null;
        this.firstPageBtn = null;
        this.prevPageBtn = null;
        this.nextPageBtn = null;
        this.lastPageBtn = null;

        // Address refs
        this.addressPostcode = null;
        this.addressRoad = null;
        this.addressDetail = null;
        this.addressHidden = null;
        this.addressManager = null;

        // Modal refs
        this.cropAreaModal = null;
        this.cropAreaList = null;
        this.addCropAreaBtn = null;
        this.confirmCropAreaBtn = null;
        this.cancelCropAreaBtn = null;
        this.closeCropAreaModalBtn = null;
        this.registrationResultModal = null;
        this.resultTableBody = null;
        this.listSearchModal = null;
        this.statisticsModal = null;
        this.mailDateModal = null;
        this.regionSelectionModal = null;

        // Area formatting from shared utils
        if (window.SampleUtils) {
            this.formatArea = window.SampleUtils.formatArea;
            this.getUnitLabel = window.SampleUtils.getUnitLabel;
            this.formatAreaWithUnit = window.SampleUtils.formatAreaWithUnit;
        }

        // soil 전용 엑셀 저장 함수 추가
        if (this.FileAPI) {
            this.FileAPI.saveExcel = async function(buffer, suggestedName = 'data.xlsx') {
                if (window.isElectron) {
                    const filePath = await window.electronAPI.saveFileDialog({
                        title: '엑셀 파일 저장',
                        defaultPath: suggestedName,
                        filters: [
                            { name: 'Excel Files', extensions: ['xlsx'] },
                            { name: 'All Files', extensions: ['*'] }
                        ]
                    });
                    if (filePath) {
                        const result = await window.electronAPI.writeFile(filePath, buffer);
                        return result.success;
                    }
                    return false;
                }
                return false;
            };
        }
    }

    // ========================================
    // Override: DOM 요소 캐싱
    // ========================================

    cacheElements() {
        super.cacheElements();

        // Override different IDs (soil uses logTableBody / emptyState)
        this.tableBody = document.getElementById('logTableBody');
        this.emptyState = document.getElementById('emptyState');

        // Soil-specific elements
        this.dateInput = document.getElementById('date');
        this.parcelsContainer = document.getElementById('parcelsContainer');
        this.addParcelBtn = document.getElementById('addParcelBtn');
        this.parcelsDataInput = document.getElementById('parcelsData');
        this.emptyParcels = document.getElementById('emptyParcels');
        this.paginationContainer = document.getElementById('pagination');
        this.receptionNumberInput = document.getElementById('receptionNumber');
        this.subCategorySelect = document.getElementById('subCategory');
        this.purposeSelect = document.getElementById('purpose');
        this.landClass1Select = document.getElementById('landClass1');
        this.landClass1Tab = document.getElementById('landClass1Tab');
        // 경지구분 1차 폼/탭 option 동적 생성 (LAND_CLASS1_OPTIONS 단일 소스)
        this.populateLandClass1Options();
        this.receptionMethodBtns = document.querySelectorAll('.reception-method-btn');
        this.receptionMethodInput = document.getElementById('receptionMethod');
        this.navSubmitBtn = document.getElementById('navSubmitBtn');
        this.navResetBtn = document.getElementById('navResetBtn');
        this.selectAllCheckbox = document.getElementById('selectAll');
        this.logTable = document.getElementById('logTable');
        this.listViewTitle = document.getElementById('listViewTitle');

        // Pagination elements
        this.paginationInfo = document.getElementById('paginationInfo');
        this.itemsPerPageSelect = document.getElementById('itemsPerPage');
        this.pageNumbersContainer = document.getElementById('pageNumbers');
        this.firstPageBtn = document.getElementById('firstPage');
        this.prevPageBtn = document.getElementById('prevPage');
        this.nextPageBtn = document.getElementById('nextPage');
        this.lastPageBtn = document.getElementById('lastPage');

        // Address refs
        this.addressPostcode = document.getElementById('addressPostcode');
        this.addressRoad = document.getElementById('addressRoad');
        this.addressDetail = document.getElementById('addressDetail');
        this.addressHidden = document.getElementById('address');

        // Modal refs
        this.cropAreaModal = document.getElementById('cropAreaModal');
        this.cropAreaList = document.getElementById('cropAreaList');
        this.addCropAreaBtn = document.getElementById('addCropAreaBtn');
        this.confirmCropAreaBtn = document.getElementById('confirmCropAreaBtn');
        this.cancelCropAreaBtn = document.getElementById('cancelCropAreaBtn');
        this.closeCropAreaModalBtn = document.getElementById('closeCropAreaModal');
        this.registrationResultModal = document.getElementById('registrationResultModal');
        this.resultTableBody = document.getElementById('resultTableBody');
        this.listSearchModal = document.getElementById('listSearchModal');
        this.statisticsModal = document.getElementById('statisticsModal');
        this.mailDateModal = document.getElementById('mailDateModal');
        this.regionSelectionModal = document.getElementById('regionSelectionModal');
    }

    // ========================================
    // 경지구분 1차 (landClass1) 헬퍼
    // ========================================

    /**
     * 폼 select(#landClass1)와 목록 탭 select(#landClass1Tab) option을
     * LAND_CLASS1_OPTIONS 단일 소스로 동적 생성한다.
     */
    populateLandClass1Options() {
        if (this.landClass1Select && this.landClass1Select.options.length === 0) {
            const frag = document.createDocumentFragment();
            LAND_CLASS1_OPTIONS.forEach(value => {
                const opt = document.createElement('option');
                opt.value = value;
                opt.textContent = value;
                if (value === LAND_CLASS1_DEFAULT) opt.selected = true;
                frag.appendChild(opt);
            });
            this.landClass1Select.appendChild(frag);
            this.landClass1Select.value = LAND_CLASS1_DEFAULT;
        }
        if (this.landClass1Tab && this.landClass1Tab.options.length === 0) {
            const frag = document.createDocumentFragment();
            const allOpt = document.createElement('option');
            allOpt.value = '';
            allOpt.textContent = '전체 경지구분';
            frag.appendChild(allOpt);
            LAND_CLASS1_OPTIONS.forEach(value => {
                const opt = document.createElement('option');
                opt.value = value;
                opt.textContent = value;
                frag.appendChild(opt);
            });
            this.landClass1Tab.appendChild(frag);
            this.landClass1Tab.value = LAND_CLASS1_DEFAULT; // SAMPL-1-88: 기본 농가의뢰 (전체 옵션은 유지)
        }
    }

    /**
     * 현재 폼의 경지구분 1차 값 (없으면 기본값).
     * @returns {string}
     */
    getCurrentLandClass1() {
        return (this.landClass1Select?.value) || LAND_CLASS1_DEFAULT;
    }

    /**
     * 추가 마이그레이션: 로드 시 landClass1 누락 레코드를 기본값으로 채움.
     * @returns {Array<Function>}
     */
    getAdditionalMigrations() {
        return [
            ...super.getAdditionalMigrations(),
            (logs) => {
                if (!Array.isArray(logs)) return logs;
                logs.forEach(log => {
                    if (log && (log.landClass1 === undefined || log.landClass1 === null || log.landClass1 === '')) {
                        log.landClass1 = LAND_CLASS1_DEFAULT;
                    }
                });
                return logs;
            },
            // SAMPL-1-89: 공익직불제 전용 메타 기본값 (차수·기준년도)
            (logs) => {
                if (!Array.isArray(logs)) return logs;
                logs.forEach(log => {
                    if (log && log.gongikOrder === undefined) log.gongikOrder = '1';
                    if (log && log.gongikBaseYear === undefined) log.gongikBaseYear = '';
                });
                return logs;
            }
        ];
    }

    // ========================================
    // Override: 뷰 초기화
    // ========================================

    initViews() {
        // 오늘 날짜 설정
        if (this.dateInput) {
            this.dateInput.valueAsDate = new Date();
        }

        // 기존 데이터 마이그레이션 (년도 없는 기존 데이터를 현재 년도로 이동)
        const oldData = SampleUtils.safeParseJSON(this.storageKey, []);
        if (oldData.length > 0) {
            const yearKey = this.getStorageKey(this.selectedYear);
            if (!localStorage.getItem(yearKey)) {
                localStorage.setItem(yearKey, JSON.stringify(oldData));
                this.log('기존 데이터를 년도별 저장소로 마이그레이션:', oldData.length, '건');
            }
        }

        // 리스트 뷰 제목 업데이트
        this.updateListViewTitle();

        // 페이지당 항목 수 초기화
        if (this.itemsPerPageSelect) {
            this.itemsPerPageSelect.value = this.itemsPerPage;
        }
    }

    // ========================================
    // Override: 페이지네이션 (soil은 PaginationManager 사용 안함)
    // ========================================

    initPagination() {
        // soil은 자체 페이지네이션 사용 - PaginationManager 초기화 건너뜀
        this.itemsPerPage = parseInt(localStorage.getItem('soilItemsPerPage'), 10) || 100;
    }

    // ========================================
    // Override: 렌더링 전 데이터 가공 (flattenLogsForTable)
    // ========================================

    prepareDataForRender(logs) {
        return this.flattenLogsForTable(logs);
    }

    // ========================================
    // Override: switchView (listViewStale 로직)
    // ========================================

    switchView(viewName) {
        // 뷰 전환 시 열려있는 자동완성 리스트 모두 닫기
        this.closeAllAutocomplete();

        const views = document.querySelectorAll('.view');
        const navItems = document.querySelectorAll('.nav-btn');

        views.forEach(view => view.classList.remove('active'));
        navItems.forEach(nav => nav.classList.remove('active'));

        const targetView = document.getElementById(`${viewName}View`);
        const targetNav = document.querySelector(`.nav-btn[data-view="${viewName}"]`);

        if (targetView) targetView.classList.add('active');
        if (targetNav) targetNav.classList.add('active');

        // 목록 뷰로 전환 시 데이터 변경이 있을 때만 새로고침
        if (viewName === 'list' && this.listViewStale) {
            this.filterAndRenderLogs();
            this.listViewStale = false;
        }
    }

    /**
     * 열려있는 모든 자동완성 리스트 닫기
     */
    closeAllAutocomplete() {
        document.querySelectorAll('.crop-autocomplete-list.show, .lot-address-autocomplete-list.show')
            .forEach(el => el.classList.remove('show'));
    }

    // ========================================
    // Override: updateRecordCount (no "총" prefix)
    // ========================================

    updateRecordCount() {
        if (!this.recordCountEl) return;
        const total = this.sampleLogs.length;
        const incomplete = this.sampleLogs.filter(log => !log.isComplete).length;
        if (incomplete > 0) {
            this.recordCountEl.textContent = `${total}건 (미완료 ${incomplete}건)`;
        } else {
            this.recordCountEl.textContent = `${total}건`;
        }
    }

    // ========================================
    // Override: setupReceptionMethod (different selectors)
    // ========================================

    setupReceptionMethod() {
        if (this.receptionMethodBtns) {
            this.receptionMethodBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.receptionMethodBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (this.receptionMethodInput) {
                        this.receptionMethodInput.value = btn.dataset.method;
                    }
                });
            });
        }
    }

    // ========================================
    // Override: setupEventListeners
    // ========================================

    setupEventListeners() {
        // 네비게이션
        this.setupNavigation();

        // 폼 이벤트
        this.setupFormEvents();

        // 연도 선택
        this.setupYearSelection();

        // 전화번호 포맷팅
        this.setupPhoneFormatting();

        // 수령 방법 선택
        this.setupReceptionMethod();
    }

    // ========================================
    // Override: setupPhoneFormatting
    // ========================================

    setupPhoneFormatting() {
        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput && window.SampleUtils?.setupPhoneNumberInput) {
            window.SampleUtils.setupPhoneNumberInput(phoneInput);
        }
    }

    // ========================================
    // Override: setupFormEvents
    // ========================================

    setupFormEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });

            // 폼 리셋 시 필지도 초기화
            this.form.addEventListener('reset', () => {
                setTimeout(() => {
                    this.parcels = [];
                    this.parcelIdCounter = 0;
                    if (this.parcelsContainer) this.parcelsContainer.innerHTML = '';
                    this.addParcel();
                }, 0);
            });
        }
    }

    // ========================================
    // Override: setupYearSelection (extra auto-save logic)
    // ========================================

    setupYearSelection() {
        const yearSelect = document.getElementById('yearSelect');
        const listYearSelect = document.getElementById('listYearSelect');

        // newYear 선캡처 + 편집 중 가드 — Base setupYearSelection과 동일 계약 (SAMPL-1-147)
        const handleYearChange = async (e, selectEl) => {
            const newYear = e.target.value;
            if (!this.confirmYearChangeWhileEditing(selectEl, newYear)) return;
            this.syncYearSelects(newYear);
            await this.loadYearData(newYear);
            // 로컬 모드에서만 auto-save 로드 (Firebase 모드에서는 로드 안함)
            if (window.isElectron && this.FileAPI && !window.firebaseConfig?.isEnabled()) {
                await this.loadAutoSaveForSelectedYear();
            }
            this.showToast(`${newYear}년 데이터를 불러왔습니다.`, 'success');
        };

        if (yearSelect) yearSelect.addEventListener('change', (e) => handleYearChange(e, yearSelect));
        if (listYearSelect) listYearSelect.addEventListener('change', (e) => handleYearChange(e, listYearSelect));
    }

    // ========================================
    // Override: 연도 변경 hook
    // ========================================

    onYearChange(newYear) {
        this.updateListViewTitle();
    }

    // ========================================
    // Override: saveLogs (soil-specific: sessionStorage)
    // ========================================

    async saveLogs() {
        const yearStorageKey = this.getStorageKey(this.selectedYear);
        this.listViewStale = true;
        this._firebaseCache.delete(this.selectedYear);  // PER-9: 캐시 무효화

        // ID가 없는 항목에 ID 추가 (in-place)
        // 배열을 새 복사본으로 교체하지 않고 제자리에서 id만 보충한다. 복사본 교체 시
        // 외부(예: runVerificationForModal에 넘긴 newLogs)에 보관된 log 참조가 고아가 되어
        // 이후 mutation(addressVerified 등)이 실제 sampleLogs에 반영되지 않는 문제가 있었다.
        // (필지 검증 빨강 표시 유실 근본 차단)
        this.sampleLogs.forEach(item => {
            if (!item.id) item.id = this.generateId();
        });

        // 로컬 저장 (Firebase는 개별 변경 시 호출자에서 직접 처리)
        try {
            localStorage.setItem(yearStorageKey, JSON.stringify(this.sampleLogs));
            this.log('로컬 저장 완료:', this.sampleLogs.length, '건');
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                (window.logger?.warn || console.warn)('localStorage 용량 초과:', e);
                this.showToast('저장 공간이 부족합니다. 오래된 연도의 데이터를 정리해 주세요.', 'error');
                return;
            }
            throw e;
        }

        // 자동 저장 실행
        const autoSaveEnabled = localStorage.getItem('soilAutoSaveEnabled') === 'true';
        if (autoSaveEnabled && (window.isElectron ? this.FileAPI?.autoSavePath : this.autoSaveFileHandle)) {
            this.autoSaveToFile();
        }

        this.updateRecordCount();

        sessionStorage.setItem('lastSaveTime', new Date().toISOString());
    }

    // ========================================
    // Firebase 개별 저장 (Quota 절감: 변경분만 write)
    // ========================================

    /**
     * 레코드를 Firestore에 개별 저장 (백그라운드, fire-and-forget)
     * @param {Array|Object} logs - 저장할 레코드 (배열 또는 단일 객체)
     */
    firebaseSaveRecords(logs) {
        if (!window.firestoreDb?.isEnabled()) return;
        const arr = Array.isArray(logs) ? logs : [logs];
        const year = parseInt(this.selectedYear, 10);
        const promises = arr
            .filter(log => log.id)
            .map(log => window.firestoreDb.save('soil', year, String(log.id), log));
        Promise.allSettled(promises).then(results => {
            // firestoreDb.save는 실패 시 throw가 아닌 false resolve → value 검사 필수
            const failed = results.filter(r => r.status === 'rejected' || r.value === false);
            if (failed.length > 0) {
                (window.logger?.error || console.error)('Firebase 저장 실패:', failed.length, '건');
                this._handleCloudSyncFailure();
            }
        });
    }

    /**
     * 레코드를 Firestore에서 개별 삭제 (백그라운드, fire-and-forget)
     * @param {Array|string} ids - 삭제할 ID (배열 또는 단일 문자열)
     */
    firebaseDeleteRecords(ids) {
        if (!window.firestoreDb?.isEnabled()) return;
        const arr = Array.isArray(ids) ? ids : [ids];
        const year = parseInt(this.selectedYear, 10);
        const promises = arr.map(id => window.firestoreDb.delete('soil', year, String(id)));
        Promise.allSettled(promises).then(results => {
            const failed = results.filter(r => r.status === 'rejected' || r.value === false);
            if (failed.length > 0) {
                (window.logger?.error || console.error)('Firebase 삭제 실패:', failed.length, '건');
                this._handleCloudSyncFailure();
            }
        });
    }

    /**
     * 전체 데이터를 Firestore에 동기화 (대량 import 전용)
     */
    firebaseBatchSync() {
        if (!window.firestoreDb?.isEnabled()) return;
        const snapshot = [...this.sampleLogs]; // 레이스 컨디션 방지: 현재 시점 스냅샷
        if (snapshot.length === 0) return; // 빈 배열은 batchSave가 false를 반환하므로 호출 생략
        window.firestoreDb.batchSave('soil', parseInt(this.selectedYear, 10), snapshot)
            .then(ok => {
                if (ok) {
                    this._clearCloudSyncFailure();
                    this.log('Firebase 전체 동기화 완료:', snapshot.length, '건');
                } else {
                    this._handleCloudSyncFailure();
                }
            })
            .catch(err => {
                (window.logger?.error || console.error)('Firebase 전체 동기화 실패:', err);
                this._handleCloudSyncFailure();
            });
    }

    /**
     * L2: soil의 saveLogs는 로컬 전용이므로 online 복귀 재시도는 전체 동기화로 수행
     */
    _retryCloudSyncAction() {
        this.saveLogs();          // 로컬 상태 저장 (멱등)
        this.firebaseBatchSync(); // 클라우드 전체 동기화
    }

    /**
     * persistRecords 오버라이드 — soil saveLogs는 로컬 전용이므로 Firebase 개별 동기화 (L1 Phase 3 P3-C)
     * @param {Array} newLogs - 신규/갱신 레코드 (개별 set)
     * @param {Array<string>} removedIds - 삭제할 레코드 ID (개별 delete)
     */
    persistRecords(newLogs = [], removedIds = []) {
        this.saveLogs();                                          // 로컬(멱등)
        if (removedIds.length) this.firebaseDeleteRecords(removedIds);
        if (newLogs.length) this.firebaseSaveRecords(newLogs);
    }

    // ========================================
    // Override: deleteSample (soil-specific: inline Firebase delete)
    // ========================================

    async deleteSample(id, receptionNumber = null) {
        const beforeCount = this.sampleLogs.length;
        this.sampleLogs = this.sampleLogs.filter(log => String(log.id) !== String(id));
        const deleted = beforeCount - this.sampleLogs.length;
        await this.saveLogs();
        this.filterAndRenderLogs();
        if (deleted > 0) {
            this.showToast('삭제되었습니다.', 'success');
        }

        // Firebase에서도 삭제
        this.firebaseDeleteRecords(id);

        // 삭제한 항목이 수정 중이던 항목이면 수정 모드 취소
        if (String(this.editingId) === String(id)) {
            this.cancelEditMode();
        }

        // 삭제된 접수번호의 기본번호를 입력란에 세팅 (재입력 편의)
        if (receptionNumber && this.receptionNumberInput) {
            const baseNumber = receptionNumber.split('-')[0];
            // 해당 기본번호가 더 이상 존재하지 않으면 입력란에 세팅
            const stillExists = this.sampleLogs.some(log =>
                (log.receptionNumber || '').split('-')[0] === baseNumber
            );
            if (!stillExists) {
                this.receptionNumberInput.value = baseNumber;
            }
        }
    }

    /**
     * 그룹 삭제: 같은 groupId를 가진 모든 시료를 삭제하고 접수번호를 재사용 가능하도록 세팅
     * @param {string} groupId - 삭제할 그룹 ID
     * @param {string} baseReceptionNumber - 삭제 후 세팅할 접수번호
     */
    async deleteGroup(groupId, baseReceptionNumber) {
        const groupLogs = this.sampleLogs.filter(log => log.groupId === groupId);
        const deleteIds = groupLogs.map(log => log.id);

        this.sampleLogs = this.sampleLogs.filter(log => log.groupId !== groupId);
        await this.saveLogs();
        this.filterAndRenderLogs();

        // Firebase에서도 삭제
        this.firebaseDeleteRecords(deleteIds);

        // 수정 중이던 항목이 삭제 그룹에 포함되면 수정 모드 취소
        if (deleteIds.map(String).includes(String(this.editingId))) {
            this.cancelEditMode();
        }

        // 삭제된 접수번호를 입력란에 세팅하여 재입력 편의 제공
        if (baseReceptionNumber && this.receptionNumberInput) {
            this.receptionNumberInput.value = baseReceptionNumber;
        }

        this.showToast(`${groupLogs.length}건이 삭제되었습니다. 접수번호 ${baseReceptionNumber}번으로 재입력할 수 있습니다.`, 'success');
    }

    // ========================================
    // Override: renderLogs (soil-specific pagination)
    // ========================================

    renderLogs(logs) {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = '';

        // SAMPL-1-89: 공익직불제 탭 선택 시 전용 컬럼(차수·경영체등록번호·기준년도) 표시 + 일괄바
        const gongikOn = this.currentSearchFilter?.landClass1 === '공익직불제';
        document.getElementById('logTable')?.classList.toggle('gongik-on', gongikOn);
        this._syncGongikBulkBar();

        this.updateRecordCount();

        if (!logs || logs.length === 0) {
            if (this.emptyState) this.emptyState.classList.remove('hidden');
            if (this.paginationContainer) this.paginationContainer.style.display = 'none';
            this.currentFlatRows = [];
            this.updatePaginationUI();
            return;
        }

        if (this.emptyState) this.emptyState.classList.add('hidden');
        if (this.paginationContainer) this.paginationContainer.style.display = 'flex';

        // 접수번호 기준 오름차순 정렬 (1, 1-1, 1-2, 2, 3-1 등 지원)
        const sortedLogs = [...logs].sort((a, b) => {
            const partsA = (a.receptionNumber || '').replace(/^F/, '').split('-').map(Number);
            const partsB = (b.receptionNumber || '').replace(/^F/, '').split('-').map(Number);
            for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
                const va = partsA[i] || 0;
                const vb = partsB[i] || 0;
                if (va !== vb) return va - vb;
            }
            return 0;
        });

        // 데이터 평탄화
        this.currentFlatRows = this.flattenLogsForTable(sortedLogs);

        // 페이지네이션 계산
        this.totalPages = Math.ceil(this.currentFlatRows.length / this.itemsPerPage) || 1;
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        this.renderCurrentPage();
    }

    /** SAMPL-1-89: 공익직불제 탭일 때만 차수·기준년도 일괄 적용 바 표시 */
    _syncGongikBulkBar() {
        const bar = document.getElementById('gongikBulkBar');
        if (bar) bar.style.display = (this.currentSearchFilter?.landClass1 === '공익직불제') ? '' : 'none';
    }

    /** SAMPL-1-89: 공익직불제 전체 레코드에 차수·기준년도 일괄 적용 */
    applyGongikBulk() {
        const order = document.getElementById('gongikBulkOrder')?.value || '1';
        const baseYear = document.getElementById('gongikBulkBaseYear')?.value || '';
        const targets = this.sampleLogs.filter(l => (l.landClass1 || LAND_CLASS1_DEFAULT) === '공익직불제');
        if (targets.length === 0) {
            this.showToast('공익직불제 레코드가 없습니다.', 'warning');
            return;
        }
        const orderLabel = order === '2' ? '2차' : '1차';
        if (!confirm(`${this.selectedYear}년 공익직불제 ${targets.length}건(현재 필터 무관 전체)에 차수=${orderLabel}, 기준년도=${baseYear || '(없음)'}을(를) 일괄 적용합니다. 계속하시겠습니까?`)) return;
        const now = new Date().toISOString();
        targets.forEach(l => { l.gongikOrder = order; l.gongikBaseYear = baseYear; l.updatedAt = now; });
        this.persistRecords(targets); // 로컬 + Firebase 동기화
        this.filterAndRenderLogs();
        this.showToast(`공익직불제 ${targets.length}건에 일괄 적용했습니다.`, 'success');
    }

    // ========================================
    // Override: setupTableEventDelegation (soil uses its own)
    // ========================================

    setupTableEventDelegation() {
        // soil handles table events in setupTypeSpecificEvents via direct delegation
        // Do not call base class setupTableEventDelegation
    }

    // ========================================
    // 접수번호 생성
    // ========================================

    /**
     * 일반 시료 다음 접수번호 (경지구분 1차별 독립 시퀀스).
     * @param {string} [landClass1] 기준 경지구분 1차 (미지정 시 현재 폼 값)
     * @returns {string}
     */
    generateNextReceptionNumber(landClass1) {
        const targetClass = landClass1 || this.getCurrentLandClass1();
        const nextNumber = window.ReceptionNumber.computeNextNumber(this.sampleLogs, targetClass);
        this.log('다음 접수번호 생성:', nextNumber, '(경지구분1차:', targetClass, ')');
        return String(nextNumber);
    }

    /**
     * 성토 시료 다음 접수번호 (경지구분 1차별 독립 시퀀스, F 접두).
     * @param {string} [landClass1] 기준 경지구분 1차 (미지정 시 현재 폼 값)
     * @returns {string}
     */
    generateNextFillReceptionNumber(landClass1) {
        const targetClass = landClass1 || this.getCurrentLandClass1();
        const nextNumber = window.ReceptionNumber.computeNextNumber(this.sampleLogs, targetClass, { fill: true });
        this.log('다음 성토 접수번호 생성: F' + nextNumber, '(경지구분1차:', targetClass, ')');
        return `F${nextNumber}`;
    }

    // ========================================
    // 엑셀 가져오기 연동 (SAMPL-1-85: SoilResultImporter)
    // ========================================

    /**
     * 지정 연도·경지구분 1차의 다음 접수번호(정수). SoilResultImporter 미리보기용.
     * @param {number|string} [year] 대상 연도 (미지정 시 현재 연도)
     * @param {string} [landClass1] 경지구분 1차 (미지정 시 농가의뢰)
     * @returns {number}
     */
    getNextNumberForClass(year, landClass1) {
        const targetClass = landClass1 || LAND_CLASS1_DEFAULT;
        const targetYear = year || this.selectedYear;
        // 현재 로드된 연도면 메모리 데이터, 아니면 해당 연도 저장소를 읽는다.
        const logs = (String(targetYear) === String(this.selectedYear))
            ? this.sampleLogs
            : SampleUtils.safeParseJSON(this.getStorageKey(targetYear), []);
        return window.ReceptionNumber.computeNextNumber(logs, targetClass);
    }

    /**
     * 현재 연도 저장소에 가져온 레코드 한 건 추가 (SoilResultImporter 위임 대상).
     * receptionNumber 미지정 시 landClass1별 독립 번호를 자동 부여한다.
     * 저장은 persistRecords(L1 Phase 3 P3-C: 로컬 + Firebase 개별 동기화)로 위임.
     * @param {Object} record - { name, phoneNumber, lotAddress, cropsDisplay, area,
     *   subCategory, purpose, note, landClass1, receptionNumber? }
     * @returns {Object} 저장된 레코드(부여된 receptionNumber 포함)
     */
    addImportedRecord(record) {
        const src = record || {};
        const landClass1 = src.landClass1 || LAND_CLASS1_DEFAULT;

        // 접수번호: 지정값 우선, 없으면 경지구분 1차별 독립 번호 자동 부여.
        //
        // 성토(subCategory='성토')는 'F' 접두의 **별 시퀀스**를 쓴다. 이 분기가 없으면
        // computeNextNumber가 일반 체계(fill=false)로 계산하며 방금 저장한 성토 레코드를
        // 제외하므로 카운터가 전진하지 않고, 가져온 성토 행 전부가 '1'로 저장된다.
        // 그 뒤로는 일반 접수의 자동채번도 1번에 고정된다 (SAMPL-1-153).
        const isFill = src.subCategory === '성토';
        const receptionNumber = (src.receptionNumber != null && String(src.receptionNumber).trim() !== '')
            ? String(src.receptionNumber).trim()
            : (isFill
                ? this.generateNextFillReceptionNumber(landClass1)
                : String(this.getNextNumberForClass(this.selectedYear, landClass1)));

        const lotAddress = src.lotAddress || '';
        const cropsDisplay = src.cropsDisplay || '-';
        const area = (parseFloat(src.area) || 0).toString();
        const nowISO = new Date().toISOString();

        const newLog = {
            id: crypto.randomUUID(),
            receptionNumber,
            date: src.date || new Date().toISOString().slice(0, 10),
            name: src.name || '',
            phoneNumber: src.phoneNumber || '',
            address: src.address || '',
            addressPostcode: src.addressPostcode || '',
            addressRoad: src.addressRoad || '',
            addressDetail: src.addressDetail || '',
            subCategory: src.subCategory || '-',
            purpose: src.purpose || '',
            landClass1,
            receptionMethod: src.receptionMethod || '-',
            note: src.note || '',
            // SAMPL-1-89: 공익직불제 전용 메타 (가져오기 컬럼 매핑 시 채워짐)
            businessRegNo: src.businessRegNo || '',
            gongikOrder: src.gongikOrder || '1',
            gongikBaseYear: src.gongikBaseYear || '',
            // SAMPL-1-93: 필지 PNU 코드 보존 (주소 자동완성 시 채워짐)
            basePnu: src.basePnu || '',
            createdAt: nowISO,
            updatedAt: nowISO,
            groupId: crypto.randomUUID(),
            parcelIndex: 1,
            totalParcels: 1,
            parcels: [{
                id: crypto.randomUUID(),
                lotAddress,
                isMountain: false,
                subLots: [],
                crops: (cropsDisplay && cropsDisplay !== '-')
                    ? [{ name: cropsDisplay, area: (parseFloat(area) || 0).toString() }]
                    : [],
                category: src.subCategory || '',
                purpose: src.purpose || '',
                note: src.note || ''
            }],
            lotAddress,
            area,
            cropsDisplay
        };

        this.sampleLogs.push(newLog);
        this.persistRecords([newLog]); // 로컬 + Firebase 개별 저장
        this.filterAndRenderLogs();
        this.log('가져오기 레코드 추가:', receptionNumber, '(경지구분1차:', landClass1, ')');
        return newLog;
    }

    // ========================================
    // 접수번호 가져오기 (연도 제외)
    // ========================================

    getReceptionNumber() {
        if (!this.receptionNumberInput) {
            (window.logger?.warn || console.warn)('접수번호 입력란을 찾을 수 없습니다');
            return '';
        }
        const value = this.receptionNumberInput.value.trim();
        if (!value) {
            (window.logger?.warn || console.warn)('접수번호가 비어있습니다');
            return '';
        }
        const parts = value.split('-');
        if (parts.length >= 2) {
            const numberPart = parts.slice(1).join('-');
            this.log('접수번호 추출:', value, '->', numberPart);
            return numberPart;
        }
        this.log('접수번호 형식 확인:', value);
        return value;
    }

    // ========================================
    // 필지 관리 시스템
    // ========================================

    addParcel() {
        this.log('필지 추가 함수 호출됨');
        const parcelId = `parcel-${this.parcelIdCounter++}`;
        const parcel = {
            id: parcelId,
            lotAddress: '',
            isMountain: false,
            subLots: [],
            crops: [],
            category: '',
            purpose: '',
            note: ''
        };
        this.parcels.push(parcel);
        this.log('생성된 필지 ID:', parcelId, '전체 필지 개수:', this.parcels.length);

        this.renderParcelCard(parcel, this.parcels.length);
        this.updateParcelsData();
        this.updateEmptyParcelsState();
    }

    removeParcel(parcelId) {
        if (this.parcels.length > 1) {
            this.parcels = this.parcels.filter(p => p.id !== parcelId);
            const el = document.getElementById(parcelId);
            if (el) el.remove();
            this.updateParcelNumbers();
            this.updateParcelsData();
        } else {
            alert('최소 1개의 필지가 필요합니다.');
        }
    }

    updateEmptyParcelsState() {
        if (this.emptyParcels) {
            if (this.parcels.length === 0) {
                this.emptyParcels.style.display = 'block';
            } else {
                this.emptyParcels.style.display = 'none';
            }
        }
    }

    updateParcelNumbers() {
        if (!this.parcelsContainer) return;
        const cards = this.parcelsContainer.querySelectorAll('.parcel-card');
        cards.forEach((card, idx) => {
            card.querySelector('h4').textContent = `필지 ${idx + 1}`;
        });
    }

    updateParcelsData() {
        // 저장 직전에 하위필지 배정을 정리한다 (SAMPL-1-159).
        // 모달에서만 정리하면 모달을 열지 않고 저장되는 경로에서 예전 결함이 남긴
        // `'[object Object]'`가 그대로 재저장된다.
        // ⚠️ 옵셔널 체이닝을 쓰지 않는다. 모듈이 없으면 **조용한 no-op**이 되어
        //    쓰레기 값이 신호 없이 재저장된다. 이 파일의 다른 호출부(:1587·:1615·:3729)도
        //    무가드이므로 여기만 관대하면 하필 저장 경로가 가장 조용해진다.
        window.SubLotIdentity.normalizeParcels(this.parcels);
        if (this.parcelsDataInput) {
            this.parcelsDataInput.value = JSON.stringify(this.parcels);
        }
    }

    updateAllParcelNumbers() {
        this.parcels.forEach((parcel) => {
            this.updateSubLotsDisplay(parcel.id);
            this.updateCropsAreaDisplay(parcel.id);
        });
    }

    updateParcelCardsMode(isFillMode) {
        if (this.parcelsContainer) {
            if (isFillMode) {
                this.parcelsContainer.classList.add('fill-mode');
            } else {
                this.parcelsContainer.classList.remove('fill-mode');
            }
        }
    }

    // ========================================
    // 필지 카드 렌더링
    // ========================================

    renderParcelCard(parcel, index) {
        this.log('필지 카드 렌더링 시작:', parcel.id, 'index:', index);

        const card = document.createElement('div');
        card.className = 'parcel-card';
        card.id = parcel.id;

        const firstCrop = parcel.crops[0] || { name: '', area: '' };
        const parcelNumber = index;

        const parcelCategory = parcel.category || '';
        const parcelPurpose = parcel.purpose || '';
        card.innerHTML = sanitizeHTML(`
            <div class="parcel-card-header">
                <h4>필지 ${parcelNumber}</h4>
                <div class="parcel-header-selects">
                    <select class="parcel-category-select" data-id="${parcel.id}" id="parcel-category-${parcel.id}">
                        <option value="">구분</option>
                        <option value="논" ${parcelCategory === '논' ? 'selected' : ''}>논</option>
                        <option value="밭" ${parcelCategory === '밭' ? 'selected' : ''}>밭</option>
                        <option value="과수" ${parcelCategory === '과수' ? 'selected' : ''}>과수</option>
                        <option value="시설" ${parcelCategory === '시설' ? 'selected' : ''}>시설</option>
                        <option value="임야" ${parcelCategory === '임야' ? 'selected' : ''}>임야</option>
                        <option value="성토" ${parcelCategory === '성토' ? 'selected' : ''}>성토</option>
                    </select>
                    <select class="parcel-purpose-select" data-id="${parcel.id}" id="parcel-purpose-${parcel.id}">
                        <option value="">용도</option>
                        <option value="일반재배" ${parcelPurpose === '일반재배' ? 'selected' : ''}>일반재배</option>
                        <option value="무농약" ${parcelPurpose === '무농약' ? 'selected' : ''}>무농약</option>
                        <option value="유기" ${parcelPurpose === '유기' ? 'selected' : ''}>유기</option>
                        <option value="GAP" ${parcelPurpose === 'GAP' ? 'selected' : ''}>GAP</option>
                        <option value="저탄소" ${parcelPurpose === '저탄소' ? 'selected' : ''}>저탄소</option>
                    </select>
                </div>
                <button type="button" class="btn-remove-parcel" data-id="${parcel.id}">삭제</button>
            </div>
            <div class="parcel-form-grid">
                <div class="parcel-left-column">
                    <div class="parcel-form-group">
                        <label for="lot-address-${parcel.id}">
                            필지 주소 (주 지번) <span class="label-hint">* 리+지번 입력 후 Enter</span>
                        </label>
                        <div class="lot-address-row" style="display:flex; gap:0.5rem; align-items:flex-start;">
                            <div class="lot-address-autocomplete-wrapper" style="flex:1; min-width:0;">
                                <input type="text" class="lot-address-input"
                                       id="lot-address-${parcel.id}"
                                       name="lot-address-${parcel.id}"
                                       data-id="${parcel.id}"
                                       placeholder="예: 문단리 224, 문단리 산 423"
                                       value="${escapeAttr(parcel.lotAddress)}">
                                <ul class="lot-address-autocomplete-list" id="lotAutocomplete-${parcel.id}"></ul>
                            </div>
                            <button type="button" class="mountain-btn" data-id="${parcel.id}" data-active="${parcel.isMountain ? 'true' : 'false'}" aria-pressed="${parcel.isMountain ? 'true' : 'false'}" style="flex:0 0 auto; padding:0.5rem 1rem; border:1px solid ${parcel.isMountain ? '#f59e0b' : '#d1d5db'}; border-radius:0.5rem; background:${parcel.isMountain ? '#fef3c7' : '#f9fafb'}; color:${parcel.isMountain ? '#92400e' : '#374151'}; font-weight:${parcel.isMountain ? '600' : 'normal'}; font-size:0.875rem; cursor:pointer; user-select:none; white-space:nowrap; transition:all 0.15s;">산</button>
                        </div>
                    </div>
                    <div class="crop-area-row">
                        <div class="parcel-form-group">
                            <label for="crop-direct-${parcel.id}">작물명</label>
                            <div class="crop-autocomplete-wrapper">
                                <input type="text" class="crop-direct-input"
                                       id="crop-direct-${parcel.id}"
                                       name="crop-direct-${parcel.id}"
                                       data-id="${parcel.id}"
                                       placeholder="예: 고추"
                                       value="${escapeAttr(firstCrop.name)}">
                                <ul class="crop-autocomplete-list" id="autocomplete-direct-${parcel.id}"></ul>
                            </div>
                        </div>
                        <div class="parcel-form-group">
                            <label for="area-direct-${parcel.id}">면적</label>
                            <div class="area-input-group">
                                <input type="number" class="area-direct-input"
                                       id="area-direct-${parcel.id}"
                                       name="area-direct-${parcel.id}"
                                       data-id="${parcel.id}"
                                       placeholder="면적"
                                       value="${escapeAttr(firstCrop.area)}">
                                <div class="area-unit-toggle" id="area-unit-${parcel.id}" data-id="${parcel.id}" data-unit="${escapeAttr(firstCrop.unit || 'm2')}">
                                    <button type="button" class="unit-btn ${(!firstCrop.unit || firstCrop.unit === 'm2') ? 'active' : ''}" data-value="m2">㎡</button>
                                    <button type="button" class="unit-btn ${firstCrop.unit === 'pyeong' ? 'active' : ''}" data-value="pyeong">평</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="btn-add-crop-compact" data-id="${parcel.id}">
                        <span>+</span> 추가 작물
                    </button>
                    <div class="crops-area-container" id="cropsArea-${parcel.id}">
                        ${this._renderAdditionalCrops(parcel)}
                    </div>
                </div>
                <div class="parcel-right-column">
                    <div class="parcel-form-group">
                        <label for="sub-lot-${parcel.id}">하위 필지</label>
                        <div class="sub-lot-input-wrapper">
                            <div class="lot-address-autocomplete-wrapper">
                                <input type="text" class="sub-lot-input"
                                       id="sub-lot-${parcel.id}"
                                       name="sub-lot-${parcel.id}"
                                       data-id="${parcel.id}"
                                       placeholder="예: 문단리 224, 문단리 산 423">
                                <ul class="lot-address-autocomplete-list" id="subLotAutocomplete-${parcel.id}"></ul>
                            </div>
                            <button type="button" class="btn-add-sub-lot-icon" data-id="${parcel.id}" title="하위 필지 추가">+</button>
                        </div>
                        <div class="sub-lots-container" id="subLots-${parcel.id}">
                            ${this._renderSubLots(parcel, parcelNumber)}
                        </div>
                    </div>
                </div>
                <div class="parcel-note-row">
                    <div class="parcel-form-group parcel-note-group">
                        <label for="parcel-note-${parcel.id}">기타주소</label>
                        <input type="text" class="parcel-note-input"
                               id="parcel-note-${parcel.id}"
                               name="parcel-note-${parcel.id}"
                               data-id="${parcel.id}"
                               placeholder="예: 1동, 2동"
                               value="${escapeAttr(parcel.note || '')}">
                    </div>
                </div>
                <div class="parcel-summary" id="summary-${parcel.id}">
                    ${this.renderParcelSummary(parcel)}
                </div>
            </div>
        `);

        if (!this.parcelsContainer) {
            (window.logger?.error || console.error)('parcelsContainer를 찾을 수 없습니다!');
            return;
        }

        this.parcelsContainer.appendChild(card);

        // 이벤트 바인딩
        this.bindDirectCropAutocomplete(parcel.id);
        this.bindLotAddressAutocomplete(parcel.id);
        this.bindSubLotAutocomplete(parcel.id);
        this.bindAreaUnitConversion(parcel.id);
        this.bindParcelSelects(parcel.id);
    }

    _renderAdditionalCrops(parcel) {
        const formatAreaWithUnit = this.formatAreaWithUnit || window.SampleUtils?.formatAreaWithUnit || ((v) => v);
        return parcel.crops.slice(1).map((crop, idx) => {
            const safeCropName = escapeHTML(crop.name);
            return `
                <div class="crop-area-item" data-index="${idx + 1}">
                    <span class="crop-name">${safeCropName}</span>
                    <span class="crop-area">${formatAreaWithUnit(crop.area, crop.unit || 'm2')}</span>
                    <button type="button" class="remove-crop-area">&times;</button>
                </div>
            `;
        }).join('');
    }

    _renderSubLotCard(parcel, subLot, idx, parcelNumber) {
        const formatArea = this.formatArea || window.SampleUtils?.formatArea || ((v) => v);
        const number = `${parcelNumber}-${idx + 1}`;
        const lotAddress = typeof subLot === 'string' ? subLot : subLot.lotAddress;
        const crops = typeof subLot === 'string' ? [] : (subLot.crops || []);
        const subLotCropsId = `subLotCrops-${parcel.id}-${idx}`;
        const safeLotAddress = escapeHTML(lotAddress);
        return `
            <div class="sub-lot-card">
                <div class="sub-lot-card-header">
                    <div class="sub-lot-info">
                        <span class="sub-lot-number">${number}</span>
                        <span class="sub-lot-value">${safeLotAddress}</span>
                    </div>
                    <button type="button" class="remove-sub-lot" data-index="${idx}">&times;</button>
                </div>
                <div class="sub-lot-crops-list" id="${subLotCropsId}">
                    ${crops.map((crop, cropIdx) => {
                        const safeCropName = escapeHTML(crop.name);
                        return `
                        <div class="sub-lot-crop-item">
                            <span class="crop-name">${safeCropName}</span>
                            <div class="crop-area-info">
                                <span class="crop-area">${formatArea(crop.area)} m²</span>
                                <button type="button" class="remove-sublot-crop" data-sublot-index="${idx}" data-crop-index="${cropIdx}">&times;</button>
                            </div>
                        </div>
                    `;}).join('')}
                </div>
                <button type="button" class="btn-add-sublot-crop" data-parcel-id="${parcel.id}" data-sublot-index="${idx}">
                    + 작물 추가
                </button>
            </div>
        `;
    }

    _renderSubLots(parcel, parcelNumber) {
        return parcel.subLots.map((subLot, idx) =>
            this._renderSubLotCard(parcel, subLot, idx, parcelNumber)
        ).join('');
    }

    // ========================================
    // 필지별 구분/목적 드롭다운 이벤트 바인딩
    // ========================================

    bindParcelSelects(parcelId) {
        const categorySelect = document.getElementById(`parcel-category-${parcelId}`);
        const purposeSelectEl = document.getElementById(`parcel-purpose-${parcelId}`);

        const toggleHasValue = (selectEl) => {
            selectEl.classList.toggle('has-value', selectEl.value !== '');
        };

        if (categorySelect) {
            toggleHasValue(categorySelect);
            categorySelect.addEventListener('change', (e) => {
                toggleHasValue(e.target);
                const parcel = this.parcels.find(p => p.id === parcelId);
                if (parcel) {
                    parcel.category = e.target.value;
                    this.updateParcelsData();
                }
            });
        }

        if (purposeSelectEl) {
            toggleHasValue(purposeSelectEl);
            purposeSelectEl.addEventListener('change', (e) => {
                toggleHasValue(e.target);
                const parcel = this.parcels.find(p => p.id === parcelId);
                if (parcel) {
                    parcel.purpose = e.target.value;
                    this.updateParcelsData();
                }
            });
        }
    }

    // ========================================
    // 면적 단위 변환 이벤트 바인딩
    // ========================================

    bindAreaUnitConversion(parcelId) {
        const areaInput = document.getElementById(`area-direct-${parcelId}`);
        const unitToggle = document.getElementById(`area-unit-${parcelId}`);

        if (!areaInput || !unitToggle) return;

        const unitButtons = unitToggle.querySelectorAll('.unit-btn');
        unitButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const newUnit = btn.dataset.value;
                const previousUnit = unitToggle.dataset.unit;
                if (newUnit === previousUnit) return;
                unitButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                unitToggle.dataset.unit = newUnit;
            });
        });
    }

    // ========================================
    // 필지 주소 자동완성 바인딩
    // ========================================

    bindLotAddressAutocomplete(parcelId) {
        const lotInput = document.querySelector(`.lot-address-input[data-id="${parcelId}"]`);
        const autocompleteList = document.getElementById(`lotAutocomplete-${parcelId}`);
        window.AddressAutocomplete.bind(lotInput, autocompleteList, {
            regionKeys: ['bonghwa', 'yeongju', 'uljin'],
            onInput: () => this.updateParcelLotAddress(parcelId),
            onSelect: (_value, ctx) => {
                // 산 필지 선택 시 parcel.isMountain + 토글 버튼 자동 동기화
                if (ctx && typeof ctx.isMountain === 'boolean') {
                    this.syncMountainCheckbox(parcelId, ctx.isMountain);
                }
                this.updateParcelLotAddress(parcelId);
            },
            onShowModal: (result) => this.showRegionSelectionModal(result, parcelId, lotInput),
        });
    }

    /**
     * 산 필지 버튼 + parcel.isMountain 상태 동기화
     */
    syncMountainCheckbox(parcelId, isMountain) {
        const parcel = this.parcels.find(p => p.id === parcelId);
        if (parcel) parcel.isMountain = !!isMountain;
        this.applyMountainToggleStyle(parcelId, !!isMountain);
    }

    /**
     * '산' 버튼 외관 갱신 (data-active + 색 팔레트)
     */
    applyMountainToggleStyle(parcelId, isMountain) {
        const btn = document.querySelector(`.mountain-btn[data-id="${parcelId}"]`);
        if (!btn) return;
        btn.dataset.active = isMountain ? 'true' : 'false';
        btn.setAttribute('aria-pressed', isMountain ? 'true' : 'false');
        btn.style.background = isMountain ? '#fef3c7' : '#f9fafb';
        btn.style.borderColor = isMountain ? '#f59e0b' : '#d1d5db';
        btn.style.color = isMountain ? '#92400e' : '#374151';
        btn.style.fontWeight = isMountain ? '600' : 'normal';
    }

    // ========================================
    // 하위 지번 자동완성 바인딩
    // ========================================

    bindSubLotAutocomplete(parcelId) {
        const subLotInput = document.querySelector(`.sub-lot-input[data-id="${parcelId}"]`);
        const autocompleteList = document.getElementById(`subLotAutocomplete-${parcelId}`);
        window.AddressAutocomplete.bind(subLotInput, autocompleteList, {
            regionKeys: ['bonghwa', 'yeongju', 'uljin'],
            onShowModal: (result) => this.showRegionSelectionModal(result, parcelId, subLotInput),
        });
    }

    // ========================================
    // 직접 입력 자동완성 바인딩
    // ========================================

    bindDirectCropAutocomplete(parcelId) {
        const cropInput = document.querySelector(`.crop-direct-input[data-id="${parcelId}"]`);
        const autocompleteList = document.getElementById(`autocomplete-direct-${parcelId}`);

        if (!cropInput || !autocompleteList) return;

        cropInput.addEventListener('input', (e) => {
            const value = e.target.value.trim().toLowerCase();
            if (value.length > 0 && typeof CROP_DATA !== 'undefined') {
                const matches = CROP_DATA.filter(crop =>
                    crop.name.toLowerCase().includes(value)
                ).slice(0, 8);

                if (matches.length > 0) {
                    autocompleteList.innerHTML = '';
                    matches.forEach(crop => {
                        const li = document.createElement('li');
                        li.dataset.code = crop.code || '';
                        li.dataset.name = crop.name || '';
                        li.textContent = `${crop.name} (${crop.category})`;
                        autocompleteList.appendChild(li);
                    });
                    autocompleteList.classList.add('show');
                } else {
                    autocompleteList.classList.remove('show');
                }
            } else {
                autocompleteList.classList.remove('show');
            }
            this.updateFirstCrop(parcelId);
        });

        cropInput.addEventListener('blur', () => {
            setTimeout(() => { autocompleteList.classList.remove('show'); }, 200);
        });

        autocompleteList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const name = e.target.dataset.name;
                cropInput.value = name;
                autocompleteList.classList.remove('show');
                this.updateFirstCrop(parcelId);
                const areaInput = document.querySelector(`.area-direct-input[data-id="${parcelId}"]`);
                if (areaInput) areaInput.focus();
            }
        });
    }

    // ========================================
    // 필지 주소 업데이트
    // ========================================

    updateParcelLotAddress(parcelId) {
        const parcel = this.parcels.find(p => p.id === parcelId);
        const lotInput = document.querySelector(`.lot-address-input[data-id="${parcelId}"]`);

        if (parcel && lotInput) {
            const newValue = lotInput.value.trim();
            if (!newValue) {
                this.showToast('필지 주소를 입력해주세요.', 'warning');
                lotInput.focus();
                return;
            }
            parcel.lotAddress = newValue;
            this.updateParcelsData();
            this.updateParcelSummary(parcelId);
        }
    }

    // ========================================
    // 첫 번째 작물 업데이트
    // ========================================

    updateFirstCrop(parcelId) {
        const parcel = this.parcels.find(p => p.id === parcelId);
        const cropInput = document.querySelector(`.crop-direct-input[data-id="${parcelId}"]`);
        const areaInput = document.querySelector(`.area-direct-input[data-id="${parcelId}"]`);
        const unitToggle = document.getElementById(`area-unit-${parcelId}`);

        if (!parcel || !cropInput || !areaInput) return;

        const cropName = cropInput.value.trim();
        const cropArea = areaInput.value.trim();
        const unit = unitToggle ? unitToggle.dataset.unit : 'm2';

        if (cropName && cropArea) {
            if (parcel.crops.length === 0) {
                parcel.crops.push({ name: cropName, area: cropArea, code: '', unit: unit });
            } else {
                parcel.crops[0].name = cropName;
                parcel.crops[0].area = cropArea;
                parcel.crops[0].unit = unit;
            }
        } else {
            if (parcel.crops.length === 1 && (!parcel.crops[0].name || !parcel.crops[0].area)) {
                parcel.crops = [];
            }
        }

        this.updateParcelSummary(parcelId);
        this.updateParcelsData();
    }

    // ========================================
    // 필지 요약 렌더링
    // ========================================

    renderParcelSummary(parcel) {
        const allCrops = [
            ...parcel.crops,
            ...parcel.subLots.flatMap(subLot => {
                if (typeof subLot === 'string') return [];
                return subLot.crops || [];
            })
        ].filter(c => c.name && c.area);

        let m2Total = 0;
        let pyeongTotal = 0;
        allCrops.forEach(crop => {
            const area = parseFloat(crop.area) || 0;
            if (crop.unit === 'pyeong') {
                pyeongTotal += area;
            } else {
                m2Total += area;
            }
        });

        const cropCount = allCrops.length;
        const subLotCount = parcel.subLots.length;

        const areaParts = [];
        if (m2Total > 0) areaParts.push(`${m2Total.toLocaleString()} ㎡`);
        if (pyeongTotal > 0) areaParts.push(`${pyeongTotal.toLocaleString()} 평`);
        const areaDisplay = areaParts.length > 0 ? areaParts.join(' / ') : '0';

        return `
            <div class="summary-item">
                <span>하위 필지:</span>
                <span>${subLotCount}개</span>
            </div>
            <div class="summary-item">
                <span>작물 수:</span>
                <span>${cropCount}개</span>
            </div>
            <div class="summary-item total-area">
                <span>총 면적:</span>
                <span>${areaDisplay}</span>
            </div>
        `;
    }

    updateParcelSummary(parcelId) {
        const parcel = this.parcels.find(p => p.id === parcelId);
        const summaryEl = document.getElementById(`summary-${parcelId}`);
        if (summaryEl && parcel) {
            summaryEl.innerHTML = sanitizeHTML(this.renderParcelSummary(parcel));
        }
    }

    // ========================================
    // 하위 지번 표시 업데이트
    // ========================================

    updateSubLotsDisplay(parcelId) {
        const parcel = this.parcels.find(p => p.id === parcelId);
        const parcelIndex = this.parcels.indexOf(parcel) + 1;
        const container = document.getElementById(`subLots-${parcelId}`);
        if (!container || !parcel) return;

        const formatAreaWithUnit = this.formatAreaWithUnit || window.SampleUtils?.formatAreaWithUnit || ((v) => v);

        container.innerHTML = sanitizeHTML(parcel.subLots.map((subLot, idx) => {
            const number = `${parcelIndex}-${idx + 1}`;
            const lotAddress = typeof subLot === 'string' ? subLot : subLot.lotAddress;
            const crops = typeof subLot === 'string' ? [] : (subLot.crops || []);
            const subLotCropsId = 'subLotCrops-' + parcelId + '-' + idx;
            const safeLotAddress = escapeHTML(lotAddress);
            return `
                <div class="sub-lot-card bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-slate-200 dark:border-zinc-700">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="sub-lot-number bg-primary text-white px-2 py-1 rounded text-xs font-bold">` + number + `</span>
                            <span class="sub-lot-value font-medium text-slate-800 dark:text-slate-200">` + safeLotAddress + `</span>
                        </div>
                        <button type="button" class="remove-sub-lot text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 text-lg" data-index="` + idx + `">&times;</button>
                    </div>
                    <div class="sub-lot-crops-list space-y-1" id="` + subLotCropsId + `">
                        ` + crops.map((crop, cropIdx) => {
                            const safeCropName = escapeHTML(crop.name);
                            return `
                            <div class="flex items-center justify-between bg-white dark:bg-zinc-900 px-2 py-1.5 rounded text-xs">
                                <span class="font-medium text-slate-700 dark:text-slate-300">` + safeCropName + `</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-slate-600 dark:text-slate-400">` + formatAreaWithUnit(crop.area, crop.unit || 'm2') + `</span>
                                    <button type="button" class="remove-sublot-crop text-slate-400 hover:text-red-500 text-sm" data-sublot-index="` + idx + `" data-crop-index="` + cropIdx + `">&times;</button>
                                </div>
                            </div>
                        `;}).join('') + `
                    </div>
                    <button type="button" class="btn-add-sublot-crop mt-2 w-full text-xs text-primary hover:text-primary-hover font-medium py-1.5 border border-dashed border-primary rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" data-parcel-id="` + parcelId + `" data-sublot-index="` + idx + `">
                        + 작물 추가
                    </button>
                </div>
            `;
        }).join(''));
    }

    // ========================================
    // 작물 면적 표시 업데이트
    // ========================================

    updateCropsAreaDisplay(parcelId) {
        const parcel = this.parcels.find(p => p.id === parcelId);
        if (!parcel) return;
        const container = document.getElementById(`cropsArea-${parcelId}`);
        if (!container) return;

        const formatAreaWithUnit = this.formatAreaWithUnit || window.SampleUtils?.formatAreaWithUnit || ((v) => v);

        container.innerHTML = sanitizeHTML(parcel.crops.slice(1).map((crop, idx) => {
            const subLotLabel = this.getSubLotLabel(crop.subLotTarget, parcel);
            const safeCropName = escapeHTML(crop.name);
            const safeSubLotLabel = escapeHTML(subLotLabel);
            return `
                <div class="crop-area-item" data-index="${idx + 1}">
                    <span class="crop-name">${safeCropName}</span>
                    <span class="crop-area">${formatAreaWithUnit(crop.area, crop.unit || 'm2')}</span>
                    ${subLotLabel ? `<span class="crop-sublot">${safeSubLotLabel}</span>` : ''}
                    <button type="button" class="remove-crop-area">&times;</button>
                </div>
            `;
        }).join(''));
    }

    getSubLotLabel(subLotTarget, parcel) {
        // ⚠️ 예전에는 `subLots.indexOf(subLotTarget)`로 비교했다. 하위필지가 객체면
        //    문자열과 절대 같지 않아 **항상 라벨이 사라졌다** (SAMPL-1-159).
        return window.SubLotIdentity.labelOf(subLotTarget, parcel?.subLots);
    }

    // ========================================
    // 작물+면적 입력 모달
    // ========================================

    openCropAreaModal(parcelId) {
        this.currentParcelIdForCrop = parcelId;
        const parcel = this.parcels.find(p => p.id === parcelId);
        // 저장된 subLotTarget을 여기서 정리한다 (SAMPL-1-159).
        // ⚠️ `resolveTarget`이 아니라 `resolveForEdit`다. 판정할 수 없을 때(분할모드
        //    레코드처럼 subLots가 빈 경우) 원값을 보존한다 — 무조건 정리하면
        //    수정 버튼만 눌러도 배정이 소멸한다(적대적 검증 실측).
        //    저장 경로(normalizeParcels)와 **같은 규칙**을 쓴다.
        this.tempCropAreas = parcel.crops.map(c => ({
            ...c,
            subLotTarget: window.SubLotIdentity.resolveForEdit(c.subLotTarget, parcel.subLots)
        }));
        this.renderCropAreaModal();
        if (this.cropAreaModal) this.cropAreaModal.classList.remove('hidden');
    }

    getSubLotOptions(parcelId) {
        const parcel = this.parcels.find(p => p.id === parcelId);
        if (!parcel) return [];
        // 식별자는 **주소**다 (SAMPL-1-159). 하위필지 원소가 문자열(구)·객체(신)로
        // 섞여 있어 양쪽에서 주소를 뽑아 키로 쓴다. 인덱스를 쓰지 않은 이유는
        // 하위필지 삭제(:3740 splice)로 순서가 밀리면 조용히 딴 것을 가리키기 때문이다.
        return window.SubLotIdentity.buildOptions(parcel.subLots);
    }

    closeCropAreaModalFn() {
        if (this.cropAreaModal) this.cropAreaModal.classList.add('hidden');
        this.currentParcelIdForCrop = null;
        // ⚠️ 하위필지 상태를 반드시 지운다 (SAMPL-1-159).
        //    예전에는 취소로 닫아도 남아, 다음에 **상위 필지** 작물 모달을 열었을 때
        //    그 작물이 하위필지로 잘못 귀속돼 저장됐다(적대적 검증 실측).
        //    하위필지 작물은 엑셀·흙토람이 실제로 읽으므로 조용한 데이터 오귀속이다.
        //    `confirmCropArea`는 정상 확정 시에만 지웠기 때문에 취소 경로가 새고 있었다.
        this.currentSubLotParcelId = null;
        this.currentSubLotIndex = null;
        this.tempCropAreas = [];
    }

    renderCropAreaModal() {
        if (this.tempCropAreas.length === 0) {
            this.tempCropAreas.push({ name: '', area: '', code: '', subLotTarget: 'all' });
        }

        const subLotOptions = this.getSubLotOptions(this.currentParcelIdForCrop || this.currentSubLotParcelId);
        // ⚠️ 하위필지 자신의 작물 모달에서는 하위필지 선택을 **렌더하지 않는다** (SAMPL-1-159).
        //    그 모달의 작물은 이미 그 하위필지 것인데, 선택이 뜨면 **다른 하위필지를 가리키게**
        //    저장할 수 있다. 화면은 '전체'로 보이는데 상태는 undefined인 불일치도 생긴다.
        //    이 값은 어디서도 읽히지 않아 조용한 모순 데이터로만 남는다.
        const isSubLotOwnModal = this.currentSubLotParcelId !== null && this.currentSubLotParcelId !== undefined;
        const hasSubLots = !isSubLotOwnModal && subLotOptions.length > 1;

        if (!this.cropAreaList) return;

        this.cropAreaList.innerHTML = sanitizeHTML(this.tempCropAreas.map((crop, idx) => `
            <div class="crop-area-input-row" data-index="${idx}">
                <div class="crop-select-wrapper crop-autocomplete-wrapper">
                    <input type="text" class="crop-search-input"
                           id="crop-search-${idx}"
                           name="crop-search-${idx}"
                           placeholder="작물명 검색..."
                           value="${escapeAttr(crop.name)}"
                           data-index="${idx}">
                    <ul class="crop-autocomplete-list" id="autocomplete-${idx}"></ul>
                </div>
                <div class="area-input-wrapper">
                    <input type="number" class="area-input"
                           id="area-input-${idx}"
                           name="area-input-${idx}"
                           placeholder="면적"
                           value="${escapeAttr(crop.area ?? '')}"
                           data-index="${idx}">
                    <div class="area-unit-toggle area-unit-modal-toggle"
                         id="area-unit-modal-${idx}"
                         data-index="${idx}"
                         data-unit="${escapeAttr(crop.unit || 'm2')}">
                        <button type="button" class="unit-btn ${(!crop.unit || crop.unit === 'm2') ? 'active' : ''}" data-value="m2">㎡</button>
                        <button type="button" class="unit-btn ${crop.unit === 'pyeong' ? 'active' : ''}" data-value="pyeong">평</button>
                    </div>
                </div>
                ${hasSubLots ? `
                <div class="sublot-select-wrapper">
                    <select class="sublot-select"
                            id="sublot-select-${idx}"
                            name="sublot-select-${idx}"
                            data-index="${idx}">
                        ${subLotOptions.map(opt => `
                            <option value="${escapeAttr(opt.value)}" ${crop.subLotTarget === opt.value ? 'selected' : ''}>
                                ${escapeHTML(opt.label)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                ` : ''}
                <button type="button" class="btn-remove-row" data-index="${idx}">&times;</button>
            </div>
        `).join(''));

        this.bindAutocompleteEvents();
    }

    bindAutocompleteEvents() {
        if (!this.cropAreaList) return;

        const searchInputs = this.cropAreaList.querySelectorAll('.crop-search-input');

        searchInputs.forEach((input) => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                const value = e.target.value.trim().toLowerCase();
                const autocompleteList = document.getElementById(`autocomplete-${idx}`);

                this.tempCropAreas[idx].name = e.target.value;
                this.tempCropAreas[idx].code = '';

                if (value.length > 0 && typeof CROP_DATA !== 'undefined') {
                    const matches = CROP_DATA.filter(crop =>
                        crop.name.toLowerCase().includes(value)
                    ).slice(0, 10);

                    if (matches.length > 0) {
                        autocompleteList.innerHTML = '';
                        matches.forEach(crop => {
                            const li = document.createElement('li');
                            li.dataset.code = crop.code || '';
                            li.dataset.name = crop.name || '';
                            li.textContent = `${crop.name} (${crop.category})`;
                            autocompleteList.appendChild(li);
                        });
                        // 모달 내부 → overflow:hidden 회피를 위해 fixed 포지션으로 좌표 계산
                        const rect = e.target.getBoundingClientRect();
                        autocompleteList.style.position = 'fixed';
                        autocompleteList.style.top = `${rect.bottom + 2}px`;
                        autocompleteList.style.left = `${rect.left}px`;
                        autocompleteList.style.width = `${rect.width}px`;
                        autocompleteList.style.right = 'auto';
                        autocompleteList.classList.add('show');
                    } else {
                        autocompleteList.classList.remove('show');
                    }
                } else {
                    autocompleteList.classList.remove('show');
                }
            });

            input.addEventListener('blur', () => {
                setTimeout(() => {
                    const idx = parseInt(input.dataset.index, 10);
                    const autocompleteList = document.getElementById(`autocomplete-${idx}`);
                    if (autocompleteList) autocompleteList.classList.remove('show');
                }, 200);
            });
        });

        const autocompleteLists = this.cropAreaList.querySelectorAll('.crop-autocomplete-list');
        autocompleteLists.forEach(list => {
            list.addEventListener('click', (e) => {
                if (e.target.tagName === 'LI') {
                    const idx = parseInt(list.id.replace('autocomplete-', ''));
                    const name = e.target.dataset.name;
                    const code = e.target.dataset.code;
                    this.tempCropAreas[idx].name = name;
                    this.tempCropAreas[idx].code = code;
                    const input = this.cropAreaList.querySelector(`.crop-search-input[data-index="${idx}"]`);
                    input.value = name;
                    list.classList.remove('show');
                    const areaInput = this.cropAreaList.querySelector(`.area-input[data-index="${idx}"]`);
                    if (areaInput) areaInput.focus();
                }
            });
        });

        this.cropAreaList.querySelectorAll('.area-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                this.tempCropAreas[idx].area = e.target.value;
            });
        });

        this.cropAreaList.querySelectorAll('.area-unit-modal-select').forEach((select) => {
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index, 10);
                this.tempCropAreas[index].unit = e.target.value;
            });
        });

        this.cropAreaList.querySelectorAll('.sublot-select').forEach(select => {
            select.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                this.tempCropAreas[idx].subLotTarget = e.target.value;
            });
        });

        this.cropAreaList.querySelectorAll('.btn-remove-row').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index, 10);
                if (this.tempCropAreas.length > 1) {
                    this.tempCropAreas.splice(idx, 1);
                    this.renderCropAreaModal();
                }
            });
        });

        this.cropAreaList.querySelectorAll('.area-unit-modal-toggle .unit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const toggle = e.target.closest('.area-unit-modal-toggle');
                const value = e.target.dataset.value;
                toggle.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                toggle.dataset.unit = value;
            });
        });
    }

    // ========================================
    // 하위 지번 작물 추가 모달
    // ========================================

    openSubLotCropModal(parcelId, subLotIndex) {
        this.currentSubLotParcelId = parcelId;
        this.currentSubLotIndex = subLotIndex;

        const parcel = this.parcels.find(p => p.id === parcelId);
        const subLot = parcel.subLots[subLotIndex];

        this.tempCropAreas = subLot.crops && subLot.crops.length > 0
            ? subLot.crops.map(c => ({ ...c }))
            : [{ name: '', area: '', code: '' }];

        this.renderCropAreaModal();
        if (this.cropAreaModal) this.cropAreaModal.classList.remove('hidden');
    }

    confirmCropArea() {
        const validCrops = this.tempCropAreas.filter(c => c.name.trim() && c.area).map((crop, idx) => {
            const unitToggle = document.getElementById(`area-unit-modal-${idx}`);
            const unit = unitToggle ? unitToggle.dataset.unit : 'm2';
            return { ...crop, unit: unit };
        });

        if (this.currentSubLotParcelId && this.currentSubLotIndex !== null) {
            const parcel = this.parcels.find(p => p.id === this.currentSubLotParcelId);
            if (parcel.subLots[this.currentSubLotIndex]) {
                if (typeof parcel.subLots[this.currentSubLotIndex] === 'string') {
                    const lotAddress = parcel.subLots[this.currentSubLotIndex];
                    parcel.subLots[this.currentSubLotIndex] = { lotAddress: lotAddress, crops: [] };
                }
                parcel.subLots[this.currentSubLotIndex].crops = validCrops;
            }
            this.updateSubLotsDisplay(this.currentSubLotParcelId);
            this.updateParcelSummary(this.currentSubLotParcelId);
            this.updateParcelsData();
            this.currentSubLotParcelId = null;
            this.currentSubLotIndex = null;
        } else {
            const parcel = this.parcels.find(p => p.id === this.currentParcelIdForCrop);
            parcel.crops = validCrops;
            this.updateCropsAreaDisplay(this.currentParcelIdForCrop);
            this.updateParcelSummary(this.currentParcelIdForCrop);
            this.updateParcelsData();
        }

        this.closeCropAreaModalFn();
    }

    // ========================================
    // 폼 제출 처리
    // ========================================

    submitForm() {
        const validParcels = this.parcels.filter(p => p.lotAddress.trim());
        if (validParcels.length === 0) {
            this.showToast('최소 1개의 필지 주소를 입력해주세요.', 'warning');
            return;
        }

        const formData = new FormData(this.form);

        // 그룹 수정 모드인 경우
        if (this.editingGroupIds && this.editingGroupIds.length > 0) {
            const baseReceptionNumber = formData.get('receptionNumber');
            const isFillNumber = baseReceptionNumber.startsWith('F');
            const baseNumber = isFillNumber
                ? parseInt(baseReceptionNumber.replace('F', ''), 10) || 1
                : parseInt(baseReceptionNumber, 10) || 1;

            const commonData = {
                ...this.collectCommonFormData(formData),
                subCategory: formData.get('subCategory') || '-',
                landClass1: formData.get('landClass1') || LAND_CLASS1_DEFAULT,
                receptionMethod: formData.get('receptionMethod') || '-',
                updatedAt: new Date().toISOString()
            };

            // editingGroupIds(순서 보존) 기준으로 기존 그룹 레코드 복원 — id/createdAt 위치 매핑 유지
            const oldGroupLogs = this.editingGroupIds
                .map(eid => this.sampleLogs.find(l => String(l.id) === String(eid)))
                .filter(Boolean);

            // 대상이 전부 사라졌으면(편집 중 연도 변경·다중 창 동기화 등) 중단한다 (SAMPL-1-148).
            // 그냥 진행하면 groupId=undefined 레코드가 생기고, 아래 filter가
            // groupId 없는 레코드를 전부 배열에서 떨어뜨려 saveLogs가 축소본을 기록한다.
            // 게다가 성공 토스트까지 떠서 사용자가 실패를 인지할 수 없다.
            if (oldGroupLogs.length === 0) {
                this.notifyEditTargetMissing('submitForm(group)', { editingGroupIds: this.editingGroupIds });
                return;
            }

            const groupId = oldGroupLogs[0]?.groupId;

            // 기존 그룹 레코드 모두 제거
            this.sampleLogs = this.sampleLogs.filter(l => l.groupId !== groupId);

            // 새 레코드 생성 (필지 수 × 작물 수에 맞춰)
            const newLogs = [];
            let existingLogIdx = 0;
            validParcels.forEach((parcel, index) => {
                const num = baseNumber + index;
                const validCrops = parcel.crops.filter(c => c.name.trim());
                const useSubNumbers = validCrops.length > 1;

                if (useSubNumbers) {
                    // 첫 작물은 기본번호, 두 번째부터 -1, -2
                    // 하위필지(subLots)는 작물별로 복제하지 않음
                    validCrops.forEach((crop, cropIndex) => {
                        const baseNum = isFillNumber ? `F${num}` : String(num);
                        const receptionNumber = cropIndex === 0 ? baseNum : `${baseNum}-${cropIndex}`;
                        const existingLog = oldGroupLogs[existingLogIdx++];
                        newLogs.push(window.SoilLogRecord.buildSoilLogRecord(parcel, {
                            receptionNumber,
                            commonData,
                            groupId,
                            index,
                            totalParcels: validParcels.length,
                            crop,
                            cropIndex,
                            isGroupEdit: true,
                            existingLog
                        }));
                    });
                } else {
                    const receptionNumber = isFillNumber ? `F${num}` : String(num);
                    const existingLog = oldGroupLogs[existingLogIdx++];
                    newLogs.push(window.SoilLogRecord.buildSoilLogRecord(parcel, {
                        receptionNumber,
                        commonData,
                        groupId,
                        index,
                        totalParcels: validParcels.length,
                        isGroupEdit: true,
                        existingLog
                    }));
                }
            });

            newLogs.forEach(log => {
                delete log.addressVerified; // 주소 편집 시 검증 초기화
                this.sampleLogs.push(log);
            });
            // localStorage 먼저(ID 할당 보장) + Firebase 삭제분 제거/새 레코드 저장 — persistRecords (L1 Phase 3 P3-C)
            const newIds = new Set(newLogs.map(l => l.id));
            const removedIds = oldGroupLogs.filter(l => !newIds.has(l.id)).map(l => l.id);

            // SAMPL-1-82: 빈 필지주소/빈 작물명이 필터(validParcels·validCrops)되면 해당 멤버가
            // removedIds에 포함돼 조용히 삭제된다. 삭제 전 사용자에게 확인 — 취소 시 원본 복원.
            if (removedIds.length > 0 &&
                !confirm(`기존 ${oldGroupLogs.length}건 중 ${removedIds.length}건이 삭제됩니다. (빈 필지 주소 또는 빈 작물명이 있으면 해당 항목이 제외됩니다.) 계속하시겠습니까?`)) {
                this.sampleLogs = this.sampleLogs.filter(l => l.groupId !== groupId);  // 방금 추가한 새 레코드 제거
                this.sampleLogs.push(...oldGroupLogs);                                 // 원본 그룹 복원
                this.filterAndRenderLogs();
                return;
            }
            this.persistRecords(newLogs, removedIds);
            this.filterAndRenderLogs();
            this.validateAndMarkLogs(newLogs).catch(err => // 그룹 수정 후 재검증 (백그라운드)
                (window.logger?.error || console.error)('VWORLD 재검증 오류:', err)
            );
            this.cancelEditMode();
            this.showToast(`${newLogs.length}건의 시료가 수정되었습니다.`, 'success');
            this.switchView('list');
            return;
        }

        // 수정 모드인 경우
        if (this.editingId) {
            // String 정규화: 숫자형 id 레코드에서도 조회되도록 (SAMPL-1-147)
            const logIndex = this.sampleLogs.findIndex(l => String(l.id) === String(this.editingId));
            if (logIndex === -1) {
                this.notifyEditTargetMissing('submitForm');
                return;
            }

            const existingLog = this.sampleLogs[logIndex];
            const firstParcelCategory = validParcels[0]?.category;
            const firstParcelPurpose = validParcels[0]?.purpose;
            const mainSubCategory = formData.get('subCategory') || '-';
            const effectiveSubCategory = firstParcelCategory || mainSubCategory;
            const effectivePurpose = firstParcelPurpose || formData.get('purpose');

            const updatedLog = {
                ...existingLog,
                ...this.collectCommonFormData(formData),
                receptionNumber: formData.get('receptionNumber'),
                subCategory: effectiveSubCategory,
                purpose: effectivePurpose,
                landClass1: formData.get('landClass1') || existingLog.landClass1 || LAND_CLASS1_DEFAULT,
                receptionMethod: formData.get('receptionMethod') || '-',
                parcels: validParcels.map(p => ({
                    id: p.id || crypto.randomUUID(),
                    lotAddress: p.lotAddress,
                    isMountain: p.isMountain || false,
                    subLots: [...p.subLots],
                    crops: p.crops.map(c => ({ ...c })),
                    category: p.category || '',
                    purpose: p.purpose || '',
                    note: p.note || ''
                })),
                updatedAt: new Date().toISOString()
            };

            if (validParcels.length > 0) {
                const firstParcel = validParcels[0];
                updatedLog.lotAddress = firstParcel.lotAddress;
                updatedLog.area = firstParcel.crops.reduce((sum, c) => sum + (parseFloat(c.area) || 0), 0).toString();
                updatedLog.cropsDisplay = firstParcel.crops.map(c => c.name).join(', ') || '-';
            }

            delete updatedLog.addressVerified; // 주소 편집 시 검증 초기화
            this.sampleLogs[logIndex] = updatedLog;
            this.persistRecords([updatedLog]); // localStorage + Firebase 개별 저장 (L1 Phase 3 P3-C)
            this.filterAndRenderLogs();
            this.validateAndMarkLogs([updatedLog]).catch(err => // 편집 후 재검증 (백그라운드)
                (window.logger?.error || console.error)('VWORLD 재검증 오류:', err)
            );
            this.cancelEditMode();
            this.showToast('수정이 완료되었습니다.', 'success');
            this.switchView('list');
            return;
        }

        // 신규 등록 모드
        const baseReceptionNumber = formData.get('receptionNumber');
        const isFillNumber = baseReceptionNumber.startsWith('F');
        const baseNumber = isFillNumber
            ? parseInt(baseReceptionNumber.replace('F', ''), 10) || 1
            : parseInt(baseReceptionNumber, 10) || 1;

        const numbersToCheck = validParcels.map((_, index) => {
            const num = baseNumber + index;
            return isFillNumber ? `F${num}` : String(num);
        });

        const yearStorageKey = this.getStorageKey(this.selectedYear);
        const latestLogs = SampleUtils.safeParseJSON(yearStorageKey, []);

        // 접수번호는 경지구분 1차별 독립 시퀀스이므로 중복 검사도 현재 경지구분 범위로 한정
        const currentLandClass1 = this.getCurrentLandClass1();
        const duplicateNumbers = numbersToCheck.filter(numToCheck => {
            return latestLogs.some(log => {
                if ((log.landClass1 || LAND_CLASS1_DEFAULT) !== currentLandClass1) return false;
                const logBaseNumber = (log.receptionNumber || '').split('-')[0];
                return logBaseNumber === numToCheck;
            });
        });

        if (duplicateNumbers.length > 0) {
            this.sampleLogs = latestLogs;
            this.filterAndRenderLogs();
            const nextAvailable = isFillNumber
                ? this.generateNextFillReceptionNumber()
                : this.generateNextReceptionNumber();
            this.receptionNumberInput.value = nextAvailable;
            this.showToast(`접수번호 ${duplicateNumbers.join(', ')}이(가) 이미 존재합니다. ${nextAvailable}번으로 변경되었습니다.`, 'warning');
            return;
        }

        const commonData = {
            ...this.collectCommonFormData(formData),
            subCategory: formData.get('subCategory') || '-',
            landClass1: formData.get('landClass1') || LAND_CLASS1_DEFAULT,
            receptionMethod: formData.get('receptionMethod') || '-',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const groupId = crypto.randomUUID();

        const newLogs = [];
        validParcels.forEach((parcel, index) => {
            const num = baseNumber + index;
            const validCrops = parcel.crops.filter(c => c.name.trim());
            const useSubNumbers = validCrops.length > 1;

            if (useSubNumbers) {
                // 한 필지에 작물이 여러 개: 321, 321-1, 321-2 형태
                // 첫 작물은 기본번호, 두 번째부터 -1, -2
                // 하위필지(subLots)는 작물별로 복제하지 않음 (필지 단위이므로)
                validCrops.forEach((crop, cropIndex) => {
                    const baseNum = isFillNumber ? `F${num}` : String(num);
                    const receptionNumber = cropIndex === 0 ? baseNum : `${baseNum}-${cropIndex}`;
                    newLogs.push(window.SoilLogRecord.buildSoilLogRecord(parcel, {
                        receptionNumber,
                        commonData,
                        groupId,
                        index,
                        totalParcels: validParcels.length,
                        crop,
                        cropIndex,
                        isGroupEdit: false
                    }));
                });
            } else {
                // 작물 1개: 기존처럼 단순 번호
                const receptionNumber = isFillNumber ? `F${num}` : String(num);
                newLogs.push(window.SoilLogRecord.buildSoilLogRecord(parcel, {
                    receptionNumber,
                    commonData,
                    groupId,
                    index,
                    totalParcels: validParcels.length,
                    isGroupEdit: false
                }));
            }
        });

        newLogs.forEach(log => this.sampleLogs.push(log));
        this.persistRecords(newLogs); // localStorage + Firebase 개별 저장 (L1 Phase 3 P3-C)
        this.filterAndRenderLogs();
        this.form.reset();
        // yearSelect 복원: form.reset()이 yearSelect를 첫 옵션(2025)으로 되돌리므로 복원
        { const _yearSelect = document.getElementById('yearSelect'); if (_yearSelect && this.selectedYear) _yearSelect.value = this.selectedYear; }
        if (this.dateInput) this.dateInput.valueAsDate = new Date();

        // 주소 필드 초기화
        if (this.addressPostcode) this.addressPostcode.value = '';
        if (this.addressRoad) this.addressRoad.value = '';
        if (this.addressDetail) this.addressDetail.value = '';
        if (this.addressHidden) this.addressHidden.value = '';

        // 필지 초기화
        this.parcels = [];
        this.parcelIdCounter = 0;
        if (this.parcelsContainer) this.parcelsContainer.innerHTML = '';
        this.addParcel();

        this.receptionNumberInput.value = this.generateNextReceptionNumber();

        const parcelCount = newLogs.length;
        this.showToast(`${parcelCount}건의 시료가 접수되었습니다.`, 'success');

        // 등록 결과 모달 표시 (검증 중 상태)
        const resultData = {
            ...newLogs[newLogs.length - 1],
            parcels: validParcels.map(p => ({
                lotAddress: p.lotAddress,
                isMountain: p.isMountain || false,
                subLots: [...p.subLots],
                crops: p.crops.map(c => ({ ...c }))
            })),
            totalRegistered: parcelCount,
            _newLogIds: newLogs.map(l => l.id)
        };
        this.showRegistrationResult(resultData);
        this.switchView('list');

        // 주소 검증 실행 → 모달에 결과 반영
        this.runVerificationForModal(newLogs);
    }

    // ========================================
    // 수정 모드 관리
    // ========================================

    editSample(id) {
        const logItem = this.sampleLogs.find(l => String(l.id) === String(id));
        if (!logItem) {
            this.notifyEditTargetMissing('editSample', { requestedId: id });
            return;
        }

        // groupId가 있고 같은 그룹에 2개 이상의 레코드가 있으면 그룹 수정
        if (logItem.groupId) {
            const groupLogs = this.sampleLogs
                .filter(l => l.groupId === logItem.groupId)
                .sort((a, b) => (a.parcelIndex || 0) - (b.parcelIndex || 0));
            if (groupLogs.length > 1) {
                this.populateFormForGroupEdit(groupLogs);
                return;
            }
        }
        // 단독 레코드는 기존 방식
        this.populateFormForEdit(logItem);
    }

    // 편집 취소 = Base resetForm (공통 골격 + onAfterFormReset)
    cancelEditMode() {
        this.resetForm();
    }

    // Override: 리셋 후 타입 고유 초기화 (구분 옵션 재주입/주소/필지)
    // 공통 골격(form.reset/yearSelect/편집해제/navSubmitBtn/날짜/접수번호)은 Base.resetForm
    onAfterFormReset() {
        const subCatSelect = document.getElementById('subCategory');
        if (subCatSelect) {
            subCatSelect.disabled = false;
            subCatSelect.innerHTML = sanitizeHTML(`
                <option value="">선택하세요</option>
                <option value="논">🌾 논</option>
                <option value="밭">🥬 밭</option>
                <option value="과수">🍎 과수</option>
                <option value="시설">🏠 시설</option>
                <option value="임야">🌲 임야</option>
                <option value="성토">🚜 성토</option>
            `);
            subCatSelect.value = '';
        }

        if (this.landClass1Select) this.landClass1Select.value = LAND_CLASS1_DEFAULT;

        if (this.addressPostcode) this.addressPostcode.value = '';
        if (this.addressRoad) this.addressRoad.value = '';
        if (this.addressDetail) this.addressDetail.value = '';
        if (this.addressHidden) this.addressHidden.value = '';

        this.parcels = [];
        this.parcelIdCounter = 0;
        if (this.parcelsContainer) this.parcelsContainer.innerHTML = '';
        this.addParcel();
    }

    // Override: 편집 시 폼 뷰 전환 (직접 DOM 토글 + 스크롤, 토스트 없음)
    switchToEditFormView() {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('formView').classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.nav-btn[data-view="form"]').classList.add('active');

        setTimeout(() => {
            this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // 폼 복원 폴백 헬퍼는 순수 모듈 window.SoilLogRecord로 위임 (SAMPL-1-119)
    // — resolveParcelCategory / resolveParcelPurpose / cropsFromDisplay

    populateFormForEdit(log) {
        this.editingId = log.id;
        this.editingGroupIds = [];

        // 공통 필드(접수번호/날짜/성명/전화/주소+레거시/수령방법/비고) — Base
        this.populateCommonFields(log);

        const subCategorySelect = document.getElementById('subCategory');
        if (subCategorySelect) {
            subCategorySelect.disabled = false;
            subCategorySelect.innerHTML = sanitizeHTML(`
                <option value="">선택하세요</option>
                <option value="논">🌾 논</option>
                <option value="밭">🥬 밭</option>
                <option value="과수">🍎 과수</option>
                <option value="시설">🏠 시설</option>
                <option value="임야">🌲 임야</option>
                <option value="성토">🚜 성토</option>
            `);
            subCategorySelect.value = log.subCategory || '';
        }

        if (this.purposeSelect) {
            this.purposeSelect.value = log.purpose || '';
        }

        if (this.landClass1Select) {
            this.landClass1Select.value = log.landClass1 || LAND_CLASS1_DEFAULT;
        }

        this.parcels = [];
        this.parcelIdCounter = 0;
        if (this.parcelsContainer) this.parcelsContainer.innerHTML = '';

        if (log.parcels && log.parcels.length > 0) {
            const singleParcel = log.parcels.length === 1;
            log.parcels.forEach(parcel => {
                const parcelId = `parcel-${this.parcelIdCounter++}`;
                const hasCrops = parcel.crops && parcel.crops.length > 0;
                // crops 폴백은 단일 필지 로그에서만 (cropsDisplay는 로그 전체 요약이므로
                // 다필지 단일 로그에 일괄 적용하면 잘못 분배됨)
                const crops = hasCrops
                    ? parcel.crops.map(c => ({ ...c }))
                    : (singleParcel ? window.SoilLogRecord.cropsFromDisplay(log) : []);
                const newParcel = {
                    id: parcelId,
                    lotAddress: parcel.lotAddress || '',
                    isMountain: parcel.isMountain || false,
                    subLots: parcel.subLots ? [...parcel.subLots] : [],
                    crops,
                    category: window.SoilLogRecord.resolveParcelCategory(parcel.category, log),
                    purpose: window.SoilLogRecord.resolveParcelPurpose(parcel.purpose, log),
                    note: parcel.note || ''
                };
                this.parcels.push(newParcel);
                this.renderParcelCard(newParcel, this.parcels.length);
            });
        } else {
            this.addParcel();
            if (log.lotAddress) {
                this.parcels[0].lotAddress = log.lotAddress;
                const lotInput = document.querySelector(`.lot-address-input[data-id="${this.parcels[0].id}"]`);
                if (lotInput) lotInput.value = log.lotAddress;
            }
        }

        this.updateParcelsData();

        this.enterEditModeUI();
    }

    populateFormForGroupEdit(groupLogs) {
        const firstLog = groupLogs[0];

        // 그룹 수정 모드 플래그 (editingGroupIds: 순서 보존 — submitForm에서 id/createdAt 위치 매핑)
        this.editingId = null;
        this.editingGroupIds = groupLogs.map(l => String(l.id));

        // 접수번호 (기본번호만, 서브넘버 -1,-2 제외)
        const baseRecNum = (firstLog.receptionNumber || '').split('-')[0];
        this.receptionNumberInput.value = baseRecNum;
        if (this.dateInput) this.dateInput.value = firstLog.date || '';
        document.getElementById('name').value = firstLog.name || '';
        document.getElementById('phoneNumber').value = firstLog.phoneNumber || '';

        // 주소 필드 처리: 개별 저장 필드 우선 사용
        if (this.addressPostcode) this.addressPostcode.value = firstLog.addressPostcode || '';
        if (this.addressRoad) this.addressRoad.value = firstLog.addressRoad || '';
        if (this.addressDetail) this.addressDetail.value = firstLog.addressDetail || '';
        if (this.addressHidden) this.addressHidden.value = firstLog.address || '';

        // addressRoad가 없으면 address에서 파싱 (레거시 데이터 호환)
        this.applyLegacyAddress(firstLog);

        const subCategorySelect = document.getElementById('subCategory');
        if (subCategorySelect) {
            subCategorySelect.disabled = false;
            subCategorySelect.innerHTML = sanitizeHTML(`
                <option value="">선택하세요</option>
                <option value="논">🌾 논</option>
                <option value="밭">🥬 밭</option>
                <option value="과수">🍎 과수</option>
                <option value="시설">🏠 시설</option>
                <option value="임야">🌲 임야</option>
                <option value="성토">🚜 성토</option>
            `);
            subCategorySelect.value = firstLog.subCategory || '';
        }

        if (this.purposeSelect) this.purposeSelect.value = firstLog.purpose || '';
        if (this.landClass1Select) this.landClass1Select.value = firstLog.landClass1 || LAND_CLASS1_DEFAULT;

        const receptionMethodBtns = document.querySelectorAll('.reception-method-btn');
        receptionMethodBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.method === firstLog.receptionMethod) btn.classList.add('active');
        });
        if (this.receptionMethodInput) this.receptionMethodInput.value = firstLog.receptionMethod || '';

        const noteInput = document.getElementById('note');
        if (noteInput) noteInput.value = firstLog.note || '';

        // 필지 카드 렌더링 - 같은 parcelIndex의 서브넘버 레코드는 하나의 필지로 합침
        this.parcels = [];
        this.parcelIdCounter = 0;
        if (this.parcelsContainer) this.parcelsContainer.innerHTML = '';

        // parcelIndex 기준으로 그룹화 (서브넘버 = 같은 필지의 다른 작물)
        const parcelMap = new Map();
        groupLogs.forEach(log => {
            const pIdx = log.parcelIndex || 1;
            if (!parcelMap.has(pIdx)) {
                parcelMap.set(pIdx, []);
            }
            parcelMap.get(pIdx).push(log);
        });

        // parcelIndex 순서대로 필지 카드 생성
        const sortedParcelIndices = [...parcelMap.keys()].sort((a, b) => a - b);
        sortedParcelIndices.forEach(pIdx => {
            const logsForParcel = parcelMap.get(pIdx);
            const firstLog = logsForParcel[0];
            // parcels[0]가 없어도 카드를 건너뛰지 않고 최상위 필드로 합성 (필지 누락 방지)
            const parcel = firstLog.parcels?.[0] || {};

            // 같은 필지의 여러 작물을 합침 — 각 로그의 crops가 비면 cropsDisplay/area로 폴백
            const mergedCrops = [];
            logsForParcel.forEach(log => {
                const logCrops = log.parcels?.[0]?.crops;
                if (logCrops && logCrops.length > 0) {
                    logCrops.forEach(c => mergedCrops.push({ ...c }));
                } else {
                    window.SoilLogRecord.cropsFromDisplay(log).forEach(c => mergedCrops.push(c));
                }
            });

            const parcelId = `parcel-${this.parcelIdCounter++}`;
            const newParcel = {
                id: parcelId,
                lotAddress: parcel.lotAddress || firstLog.lotAddress || '',
                isMountain: parcel.isMountain || false,
                subLots: parcel.subLots ? [...parcel.subLots] : [],
                crops: mergedCrops.length > 0 ? mergedCrops : [{ name: '', area: '' }],
                category: window.SoilLogRecord.resolveParcelCategory(parcel.category, firstLog),
                purpose: window.SoilLogRecord.resolveParcelPurpose(parcel.purpose, firstLog),
                note: parcel.note || ''
            };
            this.parcels.push(newParcel);
            this.renderParcelCard(newParcel, this.parcels.length);
        });

        // 필지가 하나도 없으면 빈 카드 추가
        if (this.parcels.length === 0) this.addParcel();

        this.updateParcelsData();

        // 버튼 상태 변경
        if (this.navSubmitBtn) {
            this.navSubmitBtn.title = '수정 완료';
            this.navSubmitBtn.classList.add('btn-edit-mode');
        }

        // 폼 뷰로 전환
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById('formView').classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.nav-btn[data-view="form"]').classList.add('active');

        setTimeout(() => {
            this.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    // ========================================
    // 검색/필터 (공통 4조건은 Base filterAndRenderLogs — soil 고유 조건만 오버라이드)
    // ========================================

    // Override: 타입 고유 필터 — 필지(lot) 다단계 매칭 + 목적(purpose)
    matchesTypeSpecificFilters(log) {
        return this.matchesLotFilter(log) && this.matchesPurposeFilter(log) && this.matchesLandClass1Filter(log);
    }

    matchesLandClass1Filter(log) {
        return !this.currentSearchFilter.landClass1 ||
            (log.landClass1 || LAND_CLASS1_DEFAULT) === this.currentSearchFilter.landClass1;
    }

    matchesLotFilter(log) {
        if (!this.currentSearchFilter.lot) return true;

        const searchQuery = this.currentSearchFilter.lot.trim().toLowerCase();
        const searchTerms = searchQuery.split(/\s+/).filter(t => t);

        const getSubLotAddress = (subLot) => {
            if (typeof subLot === 'string') return subLot.toLowerCase();
            if (subLot && typeof subLot === 'object' && subLot.lotAddress) return subLot.lotAddress.toLowerCase();
            return '';
        };

        if (!log.parcels || log.parcels.length === 0) return false;

        return log.parcels.some(parcel => {
            const lotAddrLower = parcel.lotAddress ? parcel.lotAddress.toLowerCase() : '';
            if (lotAddrLower.includes(searchQuery)) return true;
            if (searchTerms.every(term => lotAddrLower.includes(term))) return true;
            if (searchTerms.length === 1) {
                const term = searchTerms[0];
                if (parcel.subLots && parcel.subLots.length > 0) {
                    if (parcel.subLots.some(subLot => {
                        const addr = getSubLotAddress(subLot);
                        return addr && addr.includes(term);
                    })) return true;
                }
            }
            if (searchTerms.length >= 2) {
                const riTerm = searchTerms[0];
                const lotTerms = searchTerms.slice(1);
                const matchesRi = lotAddrLower.includes(riTerm);
                if (matchesRi && parcel.subLots && parcel.subLots.length > 0) {
                    const matchesSubLots = lotTerms.every(lotTerm =>
                        parcel.subLots.some(subLot => {
                            const addr = getSubLotAddress(subLot);
                            return addr && addr.includes(lotTerm);
                        })
                    );
                    if (matchesSubLots) return true;
                }
            }
            return false;
        });
    }

    matchesPurposeFilter(log) {
        return !this.currentSearchFilter.purpose ||
            (log.purpose || '') === this.currentSearchFilter.purpose;
    }

    /**
     * 현재 경지구분 1차 탭으로 필터링된 레코드 반환. (SAMPL-1-95, soil 이식)
     * 탭이 '전체'(빈 값)면 전체 sampleLogs 반환.
     * 통계·엑셀 내보내기가 현재 탭 데이터 기준으로 동작하도록 사용.
     * @returns {Array}
     */
    getTabFilteredLogs() {
        const tab = this.currentSearchFilter.landClass1;
        if (!tab) return this.sampleLogs;
        return this.sampleLogs.filter(log => (log.landClass1 || LAND_CLASS1_DEFAULT) === tab);
    }

    // Override: 검색 버튼 상태 판정 키 — lot/purpose 추가
    // landClass1(경지구분 탭)은 제외: 탭 has-filter는 updateSearchButtonState에서 독립 표시하므로,
    // 여기 포함하면 탭만 켜도 🔍검색 버튼이 불필요하게 '검색 중'으로 강조됨 (SAMPL-1-84 리뷰).
    getFilterKeys() {
        return [...super.getFilterKeys(), 'lot', 'purpose'];
    }

    // Override: 공통 검색 버튼 갱신 + soil 고유 purposeFilter 표시
    updateSearchButtonState() {
        super.updateSearchButtonState();
        const purposeFilter = document.getElementById('purposeFilter');
        if (purposeFilter) {
            if (this.currentSearchFilter.purpose) {
                purposeFilter.classList.add('has-filter');
            } else {
                purposeFilter.classList.remove('has-filter');
            }
        }
        const landClass1Tab = this.landClass1Tab || document.getElementById('landClass1Tab');
        if (landClass1Tab) {
            if (this.currentSearchFilter.landClass1) {
                landClass1Tab.classList.add('has-filter');
            } else {
                landClass1Tab.classList.remove('has-filter');
            }
        }
    }

    // ========================================
    // 통계 기능
    // ========================================

    calculateStatistics() {
        // SAMPL-1-95: 현재 경지구분 탭 기준으로 집계 (경지구분별·수령방법별은 전체 유지)
        const logs = this.getTabFilteredLogs();
        const total = logs.length;
        const completed = logs.filter(log => log.isComplete).length;
        const pending = total - completed;

        const bySubCategory = {};
        const categoryMapping = {
            '논': { label: '🌾 논', class: 'category-rice' },
            '밭': { label: '🥬 밭', class: 'category-field' },
            '과수': { label: '🍎 과수', class: 'category-fruit' },
            '시설': { label: '🏠 시설', class: 'category-facility' },
            '임야': { label: '🌲 임야', class: 'category-forest' },
            '성토': { label: '🏗️ 성토', class: 'category-fill' },
            '기타': { label: '📦 기타', class: 'category-other' }
        };

        logs.forEach(log => {
            const category = log.subCategory || '기타';
            if (!bySubCategory[category]) {
                bySubCategory[category] = { count: 0, ...categoryMapping[category] || categoryMapping['기타'] };
            }
            bySubCategory[category].count++;
        });

        const purposeMapping = {
            '일반재배': { label: '🌾 일반재배', class: 'purpose-general' },
            '유기': { label: '♻️ 유기', class: 'purpose-organic' },
            '무농약': { label: '🍃 무농약', class: 'purpose-nopesticide' },
            'GAP': { label: '✅ GAP', class: 'purpose-gap' },
            '저탄소': { label: '🌱 저탄소', class: 'purpose-lowcarbon' }
        };
        const byPurpose = {};
        Object.entries(purposeMapping).forEach(([key, val]) => {
            byPurpose[key] = { count: 0, ...val };
        });

        logs.forEach(log => {
            const purpose = log.purpose || '기타';
            if (!byPurpose[purpose]) {
                byPurpose[purpose] = { count: 0, ...purposeMapping[purpose] || { label: purpose, class: 'purpose-general' } };
            }
            byPurpose[purpose].count++;
        });

        const byMonth = {};
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        for (let i = 1; i <= 12; i++) {
            const monthKey = String(i).padStart(2, '0');
            byMonth[monthKey] = { count: 0, completed: 0, pending: 0, label: monthNames[i - 1], class: 'month' };
        }
        logs.forEach(log => {
            if (log.date) {
                const monthNum = log.date.substring(5, 7);
                if (byMonth[monthNum]) {
                    byMonth[monthNum].count++;
                    if (log.isComplete) { byMonth[monthNum].completed++; } else { byMonth[monthNum].pending++; }
                }
            }
        });

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

        const byReceptionMethod = {};
        const methodMapping = {
            '우편': { label: '📮 우편', class: 'method-mail' },
            '이메일': { label: '📧 이메일', class: 'method-email' },
            '팩스': { label: '📠 팩스', class: 'method-fax' },
            '직접방문': { label: '🚶 직접방문', class: 'method-visit' }
        };
        // 수령방법별 집계: 경지구분 간 비교 목적이므로 전체 기준 유지
        this.sampleLogs.forEach(log => {
            const method = log.receptionMethod || '기타';
            if (!byReceptionMethod[method]) {
                byReceptionMethod[method] = { count: 0, ...methodMapping[method] || { label: method, class: 'method-mail' } };
            }
            byReceptionMethod[method].count++;
        });

        // 경지구분별 집계: 경지구분 간 비교가 목적이므로 탭 필터와 무관하게 전체 기준
        const byLandClass = {};
        this.sampleLogs.forEach(log => {
            const landClass = log.landClass1 || LAND_CLASS1_DEFAULT;
            if (!byLandClass[landClass]) {
                byLandClass[landClass] = { count: 0, ...LAND_CLASS1_STATS_MAPPING[landClass] || { label: landClass, class: 'category-other' } };
            }
            byLandClass[landClass].count++;
        });

        return { total, completed, pending, bySubCategory, byPurpose, byMonth, byQuarter, byReceptionMethod, byLandClass };
    }

    openStatisticsModal() {
        if (!this.statisticsModal) return;
        const stats = this.calculateStatistics();
        document.getElementById('statTotalCount').textContent = stats.total.toLocaleString();
        document.getElementById('statCompletedCount').textContent = stats.completed.toLocaleString();
        document.getElementById('statPendingCount').textContent = stats.pending.toLocaleString();
        const completedRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;
        const pendingRate = stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : 0;
        const totalBadge = document.getElementById('statTotalBadge');
        const completedRateEl = document.getElementById('statCompletedRate');
        const pendingRateEl = document.getElementById('statPendingRate');
        if (totalBadge) totalBadge.textContent = `${stats.total}건`;
        if (completedRateEl) completedRateEl.textContent = `${completedRate}%`;
        if (pendingRateEl) pendingRateEl.textContent = `${pendingRate}%`;
        this.renderVerticalBarChart('statsByCategory', stats.bySubCategory);
        this.renderHorizontalBarChart('statsByPurpose', stats.byPurpose);
        this.renderHorizontalBarChart('statsByLandClass', stats.byLandClass);
        this.renderMonthlyChart('statsByMonth', stats.byMonth);
        this.renderQuarterlySummary('statsQuarterly', stats.byQuarter);
        this.renderMethodCards('statsByReceptionMethod', stats.byReceptionMethod);
        const monthRange = document.getElementById('statsMonthRange');
        if (monthRange) monthRange.textContent = `${new Date().getFullYear()}년 1월 ~ 12월`;
        this.statisticsModal.classList.remove('hidden');
    }

    renderVerticalBarChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const entries = Object.entries(data).sort((a, b) => b[1].count - a[1].count);
        if (entries.length === 0) {
            container.innerHTML = sanitizeHTML('<div class="stats-empty">데이터가 없습니다</div>');
            return;
        }
        const maxCount = Math.max(...entries.map(([, v]) => v.count));
        container.innerHTML = '';
        const barsDiv = document.createElement('div');
        barsDiv.className = 'vertical-bars';
        entries.forEach(([key, value]) => {
            const heightPercent = maxCount > 0 ? (value.count / maxCount) * 100 : 0;
            const group = document.createElement('div');
            group.className = 'vertical-bar-group';
            const barContainer = document.createElement('div');
            barContainer.className = 'vertical-bar-container';
            const bar = document.createElement('div');
            bar.className = `vertical-bar ${value.class}`;
            bar.style.height = `${heightPercent}%`;
            barContainer.appendChild(bar);
            const label = document.createElement('span');
            label.className = 'vertical-bar-label';
            label.textContent = value.label;
            group.appendChild(barContainer);
            group.appendChild(label);
            barsDiv.appendChild(group);
        });
        container.appendChild(barsDiv);
    }

    renderHorizontalBarChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const entries = Object.entries(data).sort((a, b) => b[1].count - a[1].count);
        if (entries.length === 0) {
            container.innerHTML = sanitizeHTML('<div class="stats-empty">데이터가 없습니다</div>');
            return;
        }
        const maxCount = Math.max(...entries.map(([, v]) => v.count));
        container.innerHTML = '';
        entries.forEach(([key, value]) => {
            const percent = maxCount > 0 ? (value.count / maxCount) * 100 : 0;
            const item = document.createElement('div');
            item.className = 'stat-bar-item';
            const label = document.createElement('span');
            label.className = 'stat-bar-label';
            label.textContent = value.label;
            const wrapper = document.createElement('div');
            wrapper.className = 'stat-bar-wrapper';
            const bar = document.createElement('div');
            bar.className = `stat-bar ${value.class}`;
            bar.style.width = `${percent}%`;
            wrapper.appendChild(bar);
            const val = document.createElement('span');
            val.className = 'stat-bar-value-outside';
            val.textContent = value.count;
            item.appendChild(label);
            item.appendChild(wrapper);
            item.appendChild(val);
            container.appendChild(item);
        });
    }

    renderMethodCards(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const entries = Object.entries(data).sort((a, b) => b[1].count - a[1].count);
        if (entries.length === 0) {
            container.innerHTML = sanitizeHTML('<div class="stats-empty">데이터가 없습니다</div>');
            return;
        }
        container.innerHTML = '';
        entries.forEach(([key, value]) => {
            const card = document.createElement('div');
            card.className = 'method-card';
            const name = document.createElement('span');
            name.className = 'method-card-name';
            name.textContent = value.label;
            const count = document.createElement('span');
            count.className = 'method-card-count';
            count.textContent = value.count;
            card.appendChild(name);
            card.appendChild(count);
            container.appendChild(card);
        });
    }

    renderBarChart(containerId, data, prefix) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const entries = Object.entries(data).sort((a, b) => b[1].count - a[1].count);
        if (entries.length === 0) {
            container.innerHTML = sanitizeHTML('<div class="stats-empty">데이터가 없습니다</div>');
            return;
        }
        const maxCount = Math.max(...entries.map(([, v]) => v.count));
        container.innerHTML = sanitizeHTML(entries.map(([key, value]) => {
            const percent = maxCount > 0 ? (value.count / maxCount) * 100 : 0;
            const showInside = percent > 20;
            return `
                <div class="stat-bar-item">
                    <span class="stat-bar-label">${value.label}</span>
                    <div class="stat-bar-wrapper">
                        <div class="stat-bar ${value.class}" style="width: ${percent}%"></div>
                        ${showInside ? `<span class="stat-bar-count">${value.count}건</span>` : ''}
                    </div>
                    ${!showInside ? `<span style="font-size: 0.75rem; color: #6b7280; min-width: 40px;">${value.count}건</span>` : ''}
                </div>
            `;
        }).join(''));
    }

    renderMonthlyChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
        const maxCount = Math.max(...entries.map(([, v]) => v.count), 1);
        const totalCount = entries.reduce((sum, [, v]) => sum + v.count, 0);
        if (totalCount === 0) {
            container.innerHTML = sanitizeHTML('<div class="stats-empty">데이터가 없습니다</div>');
            return;
        }
        container.innerHTML = '';
        const chart = document.createElement('div');
        chart.className = 'monthly-chart';
        const barsRow = document.createElement('div');
        barsRow.className = 'monthly-bars';
        entries.forEach(([key, value]) => {
            const heightPercent = maxCount > 0 ? (value.count / maxCount) * 100 : 0;
            const completedPercent = value.count > 0 ? (value.completed / value.count) * 100 : 0;
            const group = document.createElement('div');
            group.className = 'monthly-bar-group';
            const barContainer = document.createElement('div');
            barContainer.className = 'monthly-bar-container';
            const stack = document.createElement('div');
            stack.className = 'monthly-bar-stack';
            stack.style.height = `${heightPercent}%`;
            const completed = document.createElement('div');
            completed.className = 'monthly-bar-completed';
            completed.style.height = `${completedPercent}%`;
            completed.title = `완료: ${value.completed}건`;
            const pending = document.createElement('div');
            pending.className = 'monthly-bar-pending';
            pending.style.height = `${100 - completedPercent}%`;
            pending.title = `미완료: ${value.pending}건`;
            stack.appendChild(completed);
            stack.appendChild(pending);
            barContainer.appendChild(stack);
            if (value.count > 0) {
                const val = document.createElement('span');
                val.className = 'monthly-bar-value';
                val.textContent = value.count;
                barContainer.appendChild(val);
            }
            const label = document.createElement('span');
            label.className = 'monthly-bar-label';
            label.textContent = value.label;
            group.appendChild(barContainer);
            group.appendChild(label);
            barsRow.appendChild(group);
        });
        chart.appendChild(barsRow);
        const legend = document.createElement('div');
        legend.className = 'monthly-legend';
        legend.innerHTML = sanitizeHTML('<span class="legend-item"><span class="legend-color completed"></span> 완료</span><span class="legend-item"><span class="legend-color pending"></span> 미완료</span>');
        chart.appendChild(legend);
        container.appendChild(chart);
    }

    renderQuarterlySummary(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const totalCount = Object.values(data).reduce((sum, q) => sum + q.count, 0);
        container.innerHTML = sanitizeHTML(`
            <div class="quarterly-summary">
                ${Object.entries(data).map(([key, value]) => {
                    const percent = totalCount > 0 ? ((value.count / totalCount) * 100).toFixed(1) : 0;
                    const completionRate = value.count > 0 ? ((value.completed / value.count) * 100).toFixed(0) : 0;
                    return `
                        <div class="quarterly-item">
                            <div class="quarterly-label">${value.label}</div>
                            <div class="quarterly-stats">
                                <span class="quarterly-count">${value.count}건</span>
                                <span class="quarterly-percent">(${percent}%)</span>
                            </div>
                            <div class="quarterly-completion">
                                <div class="completion-bar">
                                    <div class="completion-fill" style="width: ${completionRate}%"></div>
                                </div>
                                <span class="completion-text">완료율 ${completionRate}%</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `);
    }

    // ========================================
    // 체크박스 선택 기능
    // ========================================

    updateSelectAllState() {
        const rowCheckboxes = this.tableBody.querySelectorAll('.row-checkbox');
        const checkedBoxes = this.tableBody.querySelectorAll('.row-checkbox:checked');

        if (this.selectAllCheckbox) {
            if (rowCheckboxes.length === 0) {
                this.selectAllCheckbox.checked = false;
                this.selectAllCheckbox.indeterminate = false;
            } else if (checkedBoxes.length === 0) {
                this.selectAllCheckbox.checked = false;
                this.selectAllCheckbox.indeterminate = false;
            } else if (checkedBoxes.length === rowCheckboxes.length) {
                this.selectAllCheckbox.checked = true;
                this.selectAllCheckbox.indeterminate = false;
            } else {
                this.selectAllCheckbox.checked = false;
                this.selectAllCheckbox.indeterminate = true;
            }
        }
    }

    updateSelectedCount() {
        const checkedBoxes = this.tableBody.querySelectorAll('.row-checkbox:checked');
        const count = checkedBoxes.length;

        let badge = document.getElementById('selectedCountBadge');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.id = 'selectedCountBadge';
                badge.className = 'selected-count-badge';
                const recordCount = document.getElementById('recordCount');
                if (recordCount) {
                    recordCount.parentNode.insertBefore(badge, recordCount.nextSibling);
                }
            }
            badge.textContent = `${count}건 선택`;
        } else if (badge) {
            badge.remove();
        }

        this.log(`${count}개 항목 선택됨`);
    }

    getSelectedIds() {
        const checkedBoxes = this.tableBody.querySelectorAll('.row-checkbox:checked');
        return Array.from(checkedBoxes).map(cb => cb.dataset.id);
    }

    selectByName(farmerKey) {
        const rowCheckboxes = this.tableBody.querySelectorAll('.row-checkbox');
        const targetCheckboxes = [];

        rowCheckboxes.forEach(cb => {
            const tr = cb.closest('tr');
            const nameCell = tr?.querySelector('.col-name');
            if (nameCell && nameCell.dataset.farmerKey === farmerKey) {
                targetCheckboxes.push(cb);
            }
        });

        if (targetCheckboxes.length === 0) return;

        const allChecked = targetCheckboxes.every(cb => cb.checked);
        targetCheckboxes.forEach(cb => { cb.checked = !allChecked; });

        this.updateSelectAllState();
        this.updateSelectedCount();
    }

    // ========================================
    // 라벨 인쇄 기능
    // ========================================

    // openLabelPrintWithData → Base 승격. soil은 address 재파싱 변형이므로 훅만 오버라이드 (L1 Phase 3 P3-B)
    getLabelAddressParts(log) {
        const addressFull = log.address || '';
        const zipMatch = addressFull.match(/^\((\d{5})\)\s*/);
        const postalCode = zipMatch ? zipMatch[1] : '';
        const address = zipMatch ? addressFull.replace(zipMatch[0], '') : addressFull;
        return { address: address, postalCode: postalCode };
    }

    // ========================================
    // 등록 결과 모달
    // ========================================

    showRegistrationResult(logData) {
        this.currentRegistrationData = logData;
        const formatArea = this.formatArea || window.SampleUtils?.formatArea || ((v) => v);

        const basicRows = [
            { label: '접수번호', value: logData.receptionNumber },
            { label: '접수일자', value: logData.date },
            { label: '성명', value: logData.name },
            { label: '전화번호', value: logData.phoneNumber },
            { label: '주소', value: [logData.addressRoad || logData.address, logData.addressDetail].filter(Boolean).join(' ') || '-' },
            { label: '구분', value: logData.subCategory || '-' },
            { label: '목적 (용도)', value: logData.purpose || '-' },
            { label: '수령 방법', value: logData.receptionMethod || '-' },
            { label: '비고', value: logData.note || '-' }
        ];

        BaseSampleManager.buildResultTable(this.resultTableBody, basicRows);

        if (logData.parcels && logData.parcels.length > 0) {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            th.textContent = '필지 정보';
            th.style.verticalAlign = 'top';
            const td = document.createElement('td');
            const parcelsDiv = document.createElement('div');
            parcelsDiv.className = 'parcels-section';

            logData.parcels.forEach((parcel, idx) => {
                const parcelDiv = document.createElement('div');
                parcelDiv.className = 'parcel-item';
                const header = document.createElement('div');
                header.className = 'parcel-header';
                header.textContent = `필지 ${idx + 1}`;
                parcelDiv.appendChild(header);
                const addressDiv = document.createElement('div');
                addressDiv.textContent = parcel.lotAddress;
                parcelDiv.appendChild(addressDiv);

                const noteDiv = document.createElement('div');
                noteDiv.className = 'text-sm text-gray';
                noteDiv.textContent = '기타주소: ' + (parcel.note || '-');
                parcelDiv.appendChild(noteDiv);

                if (parcel.subLots && parcel.subLots.length > 0) {
                    const subLotsDiv = document.createElement('div');
                    subLotsDiv.className = 'text-sm text-gray';
                    subLotsDiv.textContent = '하위 지번: ' + parcel.subLots.map(s =>
                        typeof s === 'string' ? s : s.lotAddress
                    ).join(', ');
                    parcelDiv.appendChild(subLotsDiv);
                }

                if (parcel.crops && parcel.crops.length > 0) {
                    const cropList = document.createElement('div');
                    cropList.className = 'crop-list';
                    parcel.crops.forEach(crop => {
                        const cropTag = document.createElement('span');
                        cropTag.className = 'crop-tag';
                        cropTag.textContent = `${crop.name}: ${formatArea(crop.area)}m²`;
                        cropList.appendChild(cropTag);
                    });
                    parcelDiv.appendChild(cropList);
                } else {
                    const noCrop = document.createElement('span');
                    noCrop.className = 'text-gray';
                    noCrop.textContent = '작물 정보 없음';
                    parcelDiv.appendChild(noCrop);
                }

                parcelsDiv.appendChild(parcelDiv);
            });

            td.appendChild(parcelsDiv);
            tr.appendChild(th);
            tr.appendChild(td);
            this.resultTableBody.appendChild(tr);
        }

        // 주소 검증 상태 UI 초기화
        const verifyStatus = document.getElementById('addressVerifyStatus');
        const verifySpinner = document.getElementById('verifySpinner');
        const verifyResult = document.getElementById('verifyResult');
        const closeBtn = document.getElementById('closeResultBtn');
        const exportBtn = document.getElementById('exportResultBtn');
        const editBtn = document.getElementById('editResultBtn');

        if (verifyStatus) verifyStatus.style.display = 'block';
        if (verifySpinner) verifySpinner.style.display = 'flex';
        if (verifyResult) { verifyResult.style.display = 'none'; verifyResult.innerHTML = ''; }
        if (closeBtn) closeBtn.disabled = true;
        if (exportBtn) exportBtn.disabled = true;
        if (editBtn) editBtn.style.display = 'none';

        if (this.registrationResultModal) this.registrationResultModal.classList.remove('hidden');
    }

    /**
     * 등록 완료 모달에서 주소 검증 실행 후 결과 반영
     */
    async runVerificationForModal(newLogs) {
        this._verificationInProgress = true;
        const verifySpinner = document.getElementById('verifySpinner');
        const verifyResult = document.getElementById('verifyResult');
        const closeBtn = document.getElementById('closeResultBtn');
        const exportBtn = document.getElementById('exportResultBtn');
        const editBtn = document.getElementById('editResultBtn');

        try {
            await this.validateAndMarkLogs(newLogs);
        } catch (err) {
            (window.logger?.error || console.error)('VWORLD 검증 오류:', err);
        }

        this._verificationInProgress = false;

        // 검증 결과 확인
        const invalidLogs = newLogs.filter(l => l.addressVerified === false);
        const validLogs = newLogs.filter(l => l.addressVerified === true);
        const skipLogs = newLogs.filter(l => l.addressVerified === undefined);

        // 스피너 숨기고 결과 표시
        if (verifySpinner) verifySpinner.style.display = 'none';
        if (verifyResult) {
            verifyResult.style.display = 'block';
            if (invalidLogs.length > 0) {
                // 불일치 주소 목록 (필지만)
                const invalidAddresses = [];
                invalidLogs.forEach(log => {
                    if (log.parcels) {
                        log.parcels.forEach(p => {
                            if (p.lotAddress) invalidAddresses.push(p.lotAddress);
                        });
                    }
                });
                verifyResult.className = 'verify-result verify-fail';
                verifyResult.innerHTML = `<span>&#10060; 필지 주소 ${invalidLogs.length}건 불일치</span>` +
                    (invalidAddresses.length > 0 ? `<div class="verify-addresses">${escapeHTML(invalidAddresses.join(', '))}</div>` : '');
            } else if (skipLogs.length === newLogs.length) {
                verifyResult.className = 'verify-result verify-skip';
                verifyResult.innerHTML = '<span>&#9888; 주소 검증을 수행할 수 없습니다 (API 키 또는 네트워크 확인)</span>';
            } else {
                verifyResult.className = 'verify-result verify-pass';
                verifyResult.innerHTML = `<span>&#9989; 필지 주소 ${validLogs.length}건 검증 완료</span>`;
            }
        }

        // 버튼 활성화
        if (closeBtn) closeBtn.disabled = false;
        if (exportBtn) exportBtn.disabled = false;

        // 불일치 시 수정 버튼 표시
        if (invalidLogs.length > 0 && editBtn) {
            editBtn.style.display = 'inline-block';
            editBtn.textContent = '수정';
        }
    }

    closeRegistrationResultModal() {
        if (this._verificationInProgress) return; // 검증 중 닫기 방지
        if (this.registrationResultModal) this.registrationResultModal.classList.add('hidden');
        this.currentRegistrationData = null;
    }

    // ========================================
    // 지역 선택 모달 (중복 리 이름)
    // ========================================

    showRegionSelectionModal(parseResult, parcelId, inputElement) {
        this.regionSelectionModalData = { result: parseResult, parcelId, inputElement };
        const duplicateVillageName = document.getElementById('duplicateVillageName');
        const regionOptions = document.getElementById('regionOptions');

        if (duplicateVillageName) duplicateVillageName.textContent = parseResult.villageName;

        if (regionOptions) {
            regionOptions.innerHTML = sanitizeHTML(parseResult.locations.map((location, index) => `
                <div class="region-option" data-index="${index}">
                    <div class="region-option-content">
                        <div class="region-option-title">${escapeHTML(location.fullAddress)}</div>
                        <div class="region-option-subtitle">${escapeHTML(location.region)} ${escapeHTML(location.district)}</div>
                    </div>
                    <div class="region-option-icon">→</div>
                </div>
            `).join(''));

            regionOptions.querySelectorAll('.region-option').forEach(option => {
                option.addEventListener('click', () => {
                    const index = parseInt(option.dataset.index, 10);
                    this.selectRegion(index);
                });
            });
        }

        if (this.regionSelectionModal) this.regionSelectionModal.classList.remove('hidden');
    }

    selectRegion(index) {
        if (!this.regionSelectionModalData) return;
        const location = this.regionSelectionModalData.result.locations[index];
        const lotNumber = this.regionSelectionModalData.result.lotNumber;
        const fullAddress = lotNumber ? `${location.fullAddress} ${lotNumber}` : location.fullAddress;
        this.regionSelectionModalData.inputElement.value = fullAddress;
        this.updateParcelLotAddress(this.regionSelectionModalData.parcelId);
        this.closeRegionSelectionModal();
        this.showToast('지역이 선택되었습니다', 'success');
    }

    closeRegionSelectionModal() {
        if (this.regionSelectionModal) this.regionSelectionModal.classList.add('hidden');
        this.regionSelectionModalData = null;
    }

    // ========================================
    // 데이터 평탄화
    // ========================================

    flattenLogsForTable(logs) {
        const rows = [];
        logs.forEach(log => {
            if (log.parcels && log.parcels.length > 0) {
                let subLotIndex = 1;
                const singleParcelLog = log.parcels.length === 1;
                log.parcels.forEach(parcel => {
                    // SAMPL-1-119: parcels[0]가 비어있는 레코드(레거시/동기화/부분저장)는
                    // 단일 필지에 한해 최상위 cropsDisplay/area로 폴백 (편집 폼과 동일 동작)
                    const effectiveCrops = (parcel.crops && parcel.crops.length > 0)
                        ? parcel.crops
                        : (singleParcelLog ? window.SoilLogRecord.cropsFromDisplay(log) : []);
                    const cropsDisplay = effectiveCrops.length > 0
                        ? effectiveCrops.map(c => c.name).join(', ') : '-';
                    let m2Total = 0;
                    let pyeongTotal = 0;
                    effectiveCrops.forEach(c => {
                        const area = parseFloat(c.area) || 0;
                        if (c.unit === 'pyeong') { pyeongTotal += area; } else { m2Total += area; }
                    });
                    const areaParts = [];
                    if (m2Total > 0) areaParts.push(`${m2Total.toLocaleString()}㎡`);
                    if (pyeongTotal > 0) areaParts.push(`${pyeongTotal.toLocaleString()}평`);
                    const areaDisplay = areaParts.length > 0 ? areaParts.join(' / ') : '-';
                    const effectiveLotAddress = parcel.lotAddress || (singleParcelLog ? log.lotAddress : '');
                    const lotAddressDisplay = effectiveLotAddress
                        ? (parcel.isMountain ? `${effectiveLotAddress} (산)` : effectiveLotAddress) : '-';

                    rows.push({
                        ...log,
                        _isFirstRow: subLotIndex === 1,
                        _subLotIndex: subLotIndex,
                        _displayNumber: log.receptionNumber,
                        _lotAddress: lotAddressDisplay,
                        _cropsDisplay: cropsDisplay,
                        _areaDisplay: areaDisplay,
                        _parcelPurpose: window.SoilLogRecord.resolveParcelPurpose(parcel.purpose, log)
                    });
                    subLotIndex++;

                    if (parcel.subLots && parcel.subLots.length > 0) {
                        parcel.subLots.forEach((subLot, idx) => {
                            const lotAddress = typeof subLot === 'string' ? subLot : subLot.lotAddress;
                            const subLotCrops = typeof subLot === 'string' ? [] : (subLot.crops || []);
                            const subLotCropsDisplay = subLotCrops.length > 0
                                ? subLotCrops.map(c => c.name).join(', ') : '-';
                            let subM2Total = 0;
                            let subPyeongTotal = 0;
                            subLotCrops.forEach(c => {
                                const area = parseFloat(c.area) || 0;
                                if (c.unit === 'pyeong') { subPyeongTotal += area; } else { subM2Total += area; }
                            });
                            const subAreaParts = [];
                            if (subM2Total > 0) subAreaParts.push(`${subM2Total.toLocaleString()}㎡`);
                            if (subPyeongTotal > 0) subAreaParts.push(`${subPyeongTotal.toLocaleString()}평`);
                            const subAreaDisplay = subAreaParts.length > 0 ? subAreaParts.join(' / ') : '-';

                            rows.push({
                                ...log,
                                _isFirstRow: false,
                                _subLotIndex: subLotIndex,
                                _displayNumber: `${log.receptionNumber}-${idx + 1}`,
                                _lotAddress: lotAddress,
                                _cropsDisplay: subLotCropsDisplay,
                                _areaDisplay: subAreaDisplay,
                                _parcelPurpose: window.SoilLogRecord.resolveParcelPurpose(parcel.purpose, log)
                            });
                            subLotIndex++;
                        });
                    }
                });

                if (subLotIndex === 1) {
                    rows.push({
                        ...log, _isFirstRow: true, _subLotIndex: 1, _displayNumber: log.receptionNumber,
                        _lotAddress: '-', _subLot: '-', _cropsDisplay: '-', _areaDisplay: '-'
                    });
                }
            } else {
                rows.push({
                    ...log, _isFirstRow: true, _subLotIndex: 1, _displayNumber: log.receptionNumber,
                    _lotAddress: log.lotAddress || '-', _subLot: '-',
                    _cropsDisplay: log.cropsDisplay || '-',
                    _areaDisplay: log.area ? parseFloat(log.area).toLocaleString() : '-'
                });
            }
        });
        return rows;
    }

    // ========================================
    // 페이지네이션
    // ========================================

    renderCurrentPage() {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = '';

        // SAMPL-1-89: 공익직불제 탭이면 전용 컬럼 표시(페이지 이동 시에도 유지)
        const gongikOn = this.currentSearchFilter?.landClass1 === '공익직불제';
        document.getElementById('logTable')?.classList.toggle('gongik-on', gongikOn);

        if (this.currentFlatRows.length === 0) {
            this.updatePaginationUI();
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.currentFlatRows.length);
        const pageRows = this.currentFlatRows.slice(startIndex, endIndex);

        const fragment = document.createDocumentFragment();
        let prevName = startIndex > 0 ? (this.currentFlatRows[startIndex - 1]?.name || null) : null;

        pageRows.forEach((row) => {
            if (prevName !== null && row.name !== prevName) {
                const separatorTr = document.createElement('tr');
                separatorTr.className = 'farm-separator';
                const separatorTd = document.createElement('td');
                // SAMPL-1-89: 공익직불제 ON: +3(차수·경영체·기준년도) −4(목적·수령방법·비고·발송일자) = 18
                separatorTd.colSpan = gongikOn ? 18 : 19;
                separatorTr.appendChild(separatorTd);
                fragment.appendChild(separatorTr);
            }
            prevName = row.name;

            const isComplete = row.isComplete || false;
            const tr = document.createElement('tr');
            tr.className = isComplete ? 'row-completed' : '';
            const methodText = row.receptionMethod || '-';

            const addressFull = [row.addressRoad || row.address, row.addressDetail].filter(Boolean).join(' ') || '';
            const zipMatch = addressFull.match(/^\((\d{5})\)\s*/);
            const zipcode = zipMatch ? zipMatch[1] : '';
            const addressOnly = zipMatch ? addressFull.replace(zipMatch[0], '') : addressFull;
            const displayAddress = addressOnly && addressOnly !== '-' && typeof SIDO_PATTERN !== 'undefined' && SIDO_PATTERN.test(addressOnly)
                ? addressOnly.replace(SIDO_PATTERN, '') : (addressOnly || '-');

            const combinedNote = row.note?.trim() || '-';

            tr.dataset.id = row.id;

            // 체크박스
            const tdCheckbox = document.createElement('td');
            tdCheckbox.className = 'col-checkbox sticky-col';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'row-checkbox';
            checkbox.dataset.id = row.id;
            tdCheckbox.appendChild(checkbox);
            tr.appendChild(tdCheckbox);

            // 완료 버튼
            const tdComplete = document.createElement('td');
            tdComplete.className = 'col-complete sticky-col';
            const btnComplete = document.createElement('button');
            btnComplete.className = `btn-complete ${isComplete ? 'completed' : ''}`;
            btnComplete.dataset.id = row.id;
            btnComplete.title = isComplete ? '완료 취소' : '완료';
            btnComplete.textContent = isComplete ? '✔' : '';
            tdComplete.appendChild(btnComplete);
            tr.appendChild(tdComplete);

            // 접수번호
            const tdNumber = document.createElement('td');
            tdNumber.className = 'col-num sticky-col';
            tdNumber.textContent = row._displayNumber;
            tr.appendChild(tdNumber);

            // SAMPL-1-89: 공익직불제 전용 — 차수 편집 셀 (접수번호 다음, gongik-on일 때만 표시)
            const tdOrder = document.createElement('td');
            tdOrder.className = 'col-order gongik-col sticky-col';
            const orderSelect = document.createElement('select');
            orderSelect.className = 'gongik-order-select';
            orderSelect.dataset.id = row.id;
            [['1', '1차'], ['2', '2차']].forEach(([val, label]) => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = label;
                orderSelect.appendChild(opt);
            });
            orderSelect.value = row.gongikOrder || '1';
            tdOrder.appendChild(orderSelect);
            tr.appendChild(tdOrder);

            // 날짜
            const tdDate = document.createElement('td');
            tdDate.className = 'col-date sticky-col';
            tdDate.textContent = row.date;
            tr.appendChild(tdDate);

            // 하위 카테고리
            const tdSubCategory = document.createElement('td');
            tdSubCategory.className = 'col-category sticky-col';
            tdSubCategory.textContent = row.subCategory || '-';
            tr.appendChild(tdSubCategory);

            // 목적
            const tdPurpose = document.createElement('td');
            tdPurpose.className = 'col-purpose sticky-col gongik-hide';
            tdPurpose.textContent = row._parcelPurpose || row.purpose || '-';
            tr.appendChild(tdPurpose);

            // 경지구분 1차
            const tdLandClass1 = document.createElement('td');
            tdLandClass1.className = 'col-landclass1 sticky-col';
            tdLandClass1.textContent = row.landClass1 || LAND_CLASS1_DEFAULT;
            tr.appendChild(tdLandClass1);

            // 성명 (클릭 시 같은 이름 일괄 선택)
            const tdName = document.createElement('td');
            tdName.className = 'col-name sticky-col';
            tdName.dataset.name = row.name;
            tdName.dataset.farmerKey = `${row.name}|${row.phoneNumber || ''}`;
            tdName.textContent = row.name;
            tdName.title = `"${row.name}" 클릭하면 같은 이름+전화번호 일괄 선택`;
            tr.appendChild(tdName);

            // SAMPL-1-89: 공익직불제 전용 — 경영체등록번호 (성명 다음, gongik-on일 때만 표시)
            const tdBizReg = document.createElement('td');
            tdBizReg.className = 'col-bizreg gongik-col';
            tdBizReg.textContent = row.businessRegNo || '-';
            tr.appendChild(tdBizReg);

            // 우편번호
            const tdZipcode = document.createElement('td');
            tdZipcode.className = 'col-zipcode';
            tdZipcode.textContent = zipcode || '-';
            tr.appendChild(tdZipcode);

            // 주소 (클릭 시 시도 포함 전체 주소 복사)
            const tdAddress = document.createElement('td');
            tdAddress.className = 'col-address';
            tdAddress.textContent = displayAddress;
            if (addressOnly && addressOnly !== '-') {
                const copyAddress = addressOnly.replace(
                    /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)(\s)/,
                    (_, sido, sp) => (window.expandSido ? window.expandSido(sido) : sido) + sp
                );
                tdAddress.style.cursor = 'pointer';
                tdAddress.title = '클릭하여 주소 복사';
                tdAddress.addEventListener('click', () => {
                    navigator.clipboard.writeText(copyAddress).then(() => {
                        this.showToast('주소가 복사되었습니다.', 'success');
                    }).catch(() => {
                        this.showToast('주소 복사에 실패했습니다.', 'error');
                    });
                });
            }
            tr.appendChild(tdAddress);

            // 필지 주소 (SAMPL-1-130: 저장값은 시도 포함 유지, 화면 표시에서만 시도 제거)
            const tdLotAddress = document.createElement('td');
            tdLotAddress.className = 'col-lot-address';
            const displayLotAddress = row._lotAddress && typeof SIDO_PATTERN !== 'undefined' && SIDO_PATTERN.test(row._lotAddress)
                ? row._lotAddress.replace(SIDO_PATTERN, '') : row._lotAddress;
            tdLotAddress.textContent = displayLotAddress;
            if (row.addressVerified === false) {
                tdLotAddress.classList.add('address-invalid');
                tdLotAddress.title = '지번 주소가 VWORLD에서 확인되지 않았습니다';
            }
            tr.appendChild(tdLotAddress);

            // 기타주소
            const tdParcelNote = document.createElement('td');
            const parcelNoteText = row.parcels && row.parcels[0] ? (row.parcels[0].note || '-') : '-';
            tdParcelNote.textContent = parcelNoteText;
            tr.appendChild(tdParcelNote);

            // 작물
            const tdCrops = document.createElement('td');
            tdCrops.className = 'text-truncate';
            tdCrops.setAttribute('data-tooltip', row._cropsDisplay);
            tdCrops.textContent = row._cropsDisplay;
            tr.appendChild(tdCrops);

            // 면적
            const tdArea = document.createElement('td');
            tdArea.textContent = row._areaDisplay;
            tr.appendChild(tdArea);

            // 전화번호
            const tdPhone = document.createElement('td');
            tdPhone.textContent = row.phoneNumber && window.SampleUtils?.formatPhoneNumber
                ? (window.SampleUtils.formatPhoneNumber(row.phoneNumber) || row.phoneNumber)
                : (row.phoneNumber || '-');
            tr.appendChild(tdPhone);

            // 수령방법
            const tdMethod = document.createElement('td');
            tdMethod.className = 'col-method gongik-hide';
            tdMethod.textContent = methodText;
            tr.appendChild(tdMethod);

            // 비고
            const tdNote = document.createElement('td');
            tdNote.className = 'col-note gongik-hide';
            tdNote.title = combinedNote;
            const noteDiv = document.createElement('div');
            noteDiv.className = 'note-cell';
            noteDiv.textContent = combinedNote;
            tdNote.appendChild(noteDiv);
            tr.appendChild(tdNote);

            // 우편일자
            const tdMailDate = document.createElement('td');
            tdMailDate.className = 'col-mail-date gongik-hide';
            tdMailDate.textContent = row.mailDate || '-';
            tr.appendChild(tdMailDate);

            // SAMPL-1-89: 공익직불제 전용 — 기준년도 편집 셀 (관리 직전, gongik-on일 때만 표시)
            const tdBaseYear = document.createElement('td');
            tdBaseYear.className = 'col-baseyear gongik-col';
            const baseYearSelect = document.createElement('select');
            baseYearSelect.className = 'gongik-baseyear-select';
            baseYearSelect.dataset.id = row.id;
            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = '(선택)';
            baseYearSelect.appendChild(emptyOpt);
            GONGIK_BASE_YEAR_OPTIONS.forEach((val) => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = val;
                baseYearSelect.appendChild(opt);
            });
            baseYearSelect.value = row.gongikBaseYear || '';
            tdBaseYear.appendChild(baseYearSelect);
            tr.appendChild(tdBaseYear);

            // 액션 버튼
            const tdAction = document.createElement('td');
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'table-actions';
            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn-edit';
            btnEdit.dataset.id = row.id;
            btnEdit.textContent = '수정';
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-delete';
            btnDelete.dataset.id = row.id;
            btnDelete.textContent = '삭제';
            actionsDiv.appendChild(btnEdit);
            actionsDiv.appendChild(btnDelete);
            tdAction.appendChild(actionsDiv);
            tr.appendChild(tdAction);
            fragment.appendChild(tr);
        });

        this.tableBody.appendChild(fragment);
        this.updatePaginationUI();
    }

    updatePaginationUI() {
        const totalItems = this.currentFlatRows.length;
        const startItem = totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);

        if (this.paginationInfo) {
            this.paginationInfo.textContent = `${totalItems.toLocaleString()}건 중 ${startItem.toLocaleString()}-${endItem.toLocaleString()}`;
        }
        if (this.firstPageBtn) this.firstPageBtn.disabled = this.currentPage === 1;
        if (this.prevPageBtn) this.prevPageBtn.disabled = this.currentPage === 1;
        if (this.nextPageBtn) this.nextPageBtn.disabled = this.currentPage === this.totalPages;
        if (this.lastPageBtn) this.lastPageBtn.disabled = this.currentPage === this.totalPages;
        this.renderPageNumbers();
    }

    renderPageNumbers() {
        if (!this.pageNumbersContainer) return;
        if (this.totalPages <= 1) { this.pageNumbersContainer.innerHTML = ''; return; }
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        const fragment = document.createDocumentFragment();
        if (startPage > 1) {
            fragment.appendChild(this.createPageButton(1));
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                fragment.appendChild(ellipsis);
            }
        }
        for (let i = startPage; i <= endPage; i++) {
            fragment.appendChild(this.createPageButton(i));
        }
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'page-ellipsis';
                ellipsis.textContent = '...';
                fragment.appendChild(ellipsis);
            }
            fragment.appendChild(this.createPageButton(this.totalPages));
        }
        this.pageNumbersContainer.innerHTML = '';
        this.pageNumbersContainer.appendChild(fragment);
    }

    createPageButton(pageNum) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (pageNum === this.currentPage ? ' active' : '');
        btn.textContent = pageNum;
        btn.addEventListener('click', () => this.goToPage(pageNum));
        return btn;
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.renderCurrentPage();
        const tableContainer = document.querySelector('.table-container');
        if (tableContainer) tableContainer.scrollTop = 0;
    }

    // ========================================
    // 자동 저장 관련
    // ========================================

    async autoSaveToFile() {
        return await SampleUtils.performAutoSave({
            FileAPI: this.FileAPI,
            moduleKey: 'soil',
            data: this.sampleLogs,
            webFileHandle: this.autoSaveFileHandle,
            log: (...args) => this.log(...args)
        });
    }

    async loadAutoSaveForSelectedYear() {
        if (!window.isElectron || !this.FileAPI?.autoSavePath || this.sampleLogs.length > 0) return;
        const autoSaveData = await window.loadFromAutoSaveFile();
        if (autoSaveData && autoSaveData.length > 0) {
            this.sampleLogs = autoSaveData;
            localStorage.setItem(this.getStorageKey(this.selectedYear), JSON.stringify(this.sampleLogs));
            this.filterAndRenderLogs();
            if (this.receptionNumberInput) {
                this.receptionNumberInput.value = this.generateNextReceptionNumber();
            }
            this.log(`${this.selectedYear}년 자동 저장 데이터 로드:`, autoSaveData.length, '건');
        }
    }

    // ========================================
    // 헬퍼
    // ========================================

    updateListViewTitle() {
        if (this.listViewTitle) {
            this.listViewTitle.textContent = '토양 접수 목록';
        }
    }

    resetFormKeepReceptionInfo() {
        const receptionNumber = this.receptionNumberInput?.value;
        const date = this.dateInput?.value;
        this.form.reset();
        // yearSelect 복원: form.reset()이 yearSelect를 첫 옵션(2025)으로 되돌리므로 복원
        { const _yearSelect = document.getElementById('yearSelect'); if (_yearSelect && this.selectedYear) _yearSelect.value = this.selectedYear; }
        // landClass1 복원: option.selected는 attribute가 아닌 property로 설정되어 있어
        // form.reset()이 첫 옵션(개량제)으로 되돌리므로 기본값(농가의뢰)을 명시적으로 복원
        if (this.landClass1Select) this.landClass1Select.value = LAND_CLASS1_DEFAULT;
        setTimeout(() => {
            if (receptionNumber && this.receptionNumberInput) this.receptionNumberInput.value = receptionNumber;
            if (date && this.dateInput) this.dateInput.value = date;
        }, 10);
    }

    // ========================================
    // Override: setupTypeSpecificEvents - ALL soil-specific event handlers
    // ========================================

    setupTypeSpecificEvents() {
        const self = this;

        // 시료 타입 네비게이션 선택
        const sampleTypeBtns = document.querySelectorAll('.type-btn');
        sampleTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sampleTypeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchView('form');
            });
        });

        // 주소 검색 모듈
        this.addressManager = new window.AddressManager({
            searchBtn: document.getElementById('searchAddressBtn'),
            postcodeInput: this.addressPostcode,
            roadInput: this.addressRoad,
            detailInput: this.addressDetail,
            hiddenInput: this.addressHidden,
            modal: document.getElementById('addressModal'),
            closeBtn: document.getElementById('closeAddressModal'),
            container: document.getElementById('daumPostcodeContainer')
        });

        // 빈 상태 버튼
        const btnGoForm = document.querySelector('.btn-go-form');
        if (btnGoForm) btnGoForm.addEventListener('click', () => this.switchView('form'));

        const btnAddParcelEmpty = document.querySelector('.btn-add-parcel-empty');
        if (btnAddParcelEmpty) btnAddParcelEmpty.addEventListener('click', () => this.addParcel());

        // 구분 변경 시 접수번호 업데이트 (수정 모드에서는 원본 접수번호 유지)
        if (this.subCategorySelect) {
            this.subCategorySelect.addEventListener('change', (e) => {
                const isFill = e.target.value === '성토';
                if (this.receptionNumberInput && !this.isEditing()) {
                    this.receptionNumberInput.value = isFill
                        ? this.generateNextFillReceptionNumber()
                        : this.generateNextReceptionNumber();
                }
                this.updateParcelCardsMode(isFill);
            });
        }

        // 경지구분 1차 변경 시 접수번호를 해당 분류 기준으로 재추천 (수정 모드 제외)
        if (this.landClass1Select) {
            this.landClass1Select.addEventListener('change', () => {
                if (this.receptionNumberInput && !this.isEditing()) {
                    const isFill = this.subCategorySelect?.value === '성토';
                    this.receptionNumberInput.value = isFill
                        ? this.generateNextFillReceptionNumber()
                        : this.generateNextReceptionNumber();
                }
            });
        }

        // 초기 필지 1개 추가
        this.addParcel();

        // 접수번호 변경 시 모든 필지 번호 업데이트
        if (this.receptionNumberInput) {
            this.receptionNumberInput.addEventListener('input', () => this.updateAllParcelNumbers());
        }

        // 필지 추가 버튼
        if (this.addParcelBtn) {
            this.addParcelBtn.addEventListener('click', () => this.addParcel());
        }

        // 필지 컨테이너 이벤트 위임
        if (this.parcelsContainer) {
            this.parcelsContainer.addEventListener('click', (e) => {
                const target = e.target;
                if (target.classList.contains('btn-remove-parcel')) {
                    this.removeParcel(target.dataset.id);
                }
                if (target.classList.contains('btn-add-sub-lot-icon')) {
                    const parcelId = target.dataset.id;
                    const input = document.querySelector(`.sub-lot-input[data-id="${parcelId}"]`);
                    const value = input.value.trim();
                    if (value) {
                        const parcel = this.parcels.find(p => p.id === parcelId);
                        // ⚠️ 주소가 작물 배정의 식별자다 (SAMPL-1-159). 중복을 허용하면
                        //    둘 중 하나를 지웠을 때 그쪽을 가리켰던 작물이 **조용히 남은 쪽으로**
                        //    옮겨간다. 사용자는 알 수 없으므로 입력 시점에 막는다.
                        const check = window.SubLotIdentity.canAdd(value, parcel.subLots);
                        if (!check.ok) {
                            this.showToast(check.reason, 'warning');
                            return;
                        }
                        parcel.subLots.push({ lotAddress: value, crops: [] });
                        this.updateSubLotsDisplay(parcelId);
                        this.updateParcelSummary(parcelId);
                        this.updateParcelsData();
                        input.value = '';
                    }
                }
                if (target.classList.contains('remove-sub-lot')) {
                    const subLotIndex = parseInt(target.dataset.index, 10);
                    const container = target.closest('.sub-lots-container');
                    const parcelId = container.id.replace('subLots-', '');
                    const parcel = this.parcels.find(p => p.id === parcelId);
                    parcel.subLots.splice(subLotIndex, 1);
                    this.updateSubLotsDisplay(parcelId);
                    this.updateParcelSummary(parcelId);
                    // ⚠️ `updateParcelsData()`가 배정을 '전체'로 정리하는데, 예전에는
                    //    작물 목록을 다시 그리지 않아 **배지가 옛 값을 계속 보여줬다** —
                    //    손실 사실이 화면에 감춰졌다 (적대적 검증 실측).
                    const cleaned = window.SubLotIdentity.normalizeParcels(this.parcels);
                    this.updateCropsAreaDisplay(parcelId);
                    this.updateParcelsData();
                    if (cleaned > 0) {
                        this.showToast(`하위필지 삭제로 작물 ${cleaned}건의 배정을 '전체'로 되돌렸습니다.`, 'warning');
                    }
                }
                if (target.classList.contains('btn-add-sublot-crop')) {
                    this.openSubLotCropModal(target.dataset.parcelId, parseInt(target.dataset.sublotIndex, 10));
                }
                if (target.classList.contains('remove-sublot-crop')) {
                    const subLotIndex = parseInt(target.dataset.sublotIndex, 10);
                    const cropIndex = parseInt(target.dataset.cropIndex, 10);
                    const container = target.closest('.sub-lots-container');
                    const parcelId = container.id.replace('subLots-', '');
                    const parcel = this.parcels.find(p => p.id === parcelId);
                    if (parcel.subLots[subLotIndex] && parcel.subLots[subLotIndex].crops) {
                        parcel.subLots[subLotIndex].crops.splice(cropIndex, 1);
                        this.updateSubLotsDisplay(parcelId);
                        this.updateParcelSummary(parcelId);
                        this.updateParcelsData();
                    }
                }
                if (target.classList.contains('btn-add-crop-area') || target.classList.contains('btn-add-crop-compact')) {
                    this.openCropAreaModal(target.dataset.id);
                }
                if (target.classList.contains('remove-crop-area')) {
                    const item = target.closest('.crop-area-item');
                    const container = target.closest('.crops-area-container');
                    if (!container) return;
                    const parcelId = container.id.replace('cropsArea-', '');
                    const index = parseInt(item.dataset.index, 10);
                    const parcel = this.parcels.find(p => p.id === parcelId);
                    if (parcel && parcel.crops[index]) {
                        parcel.crops.splice(index, 1);
                        this.updateCropsAreaDisplay(parcelId);
                        this.updateParcelSummary(parcelId);
                        this.updateParcelsData();
                    }
                }
                // 산 필지 토글 버튼 (한 번 누르면 ON, 다시 누르면 OFF)
                const mountainBtn = target.closest('.mountain-btn');
                if (mountainBtn) {
                    e.preventDefault();
                    const parcelId = mountainBtn.dataset.id;
                    const next = mountainBtn.dataset.active !== 'true';
                    const parcel = this.parcels.find(p => p.id === parcelId);
                    if (parcel) { parcel.isMountain = next; this.updateParcelsData(); }
                    this.applyMountainToggleStyle(parcelId, next);
                }
            });

            this.parcelsContainer.addEventListener('input', (e) => {
                if (e.target.classList.contains('lot-address-input')) {
                    const parcelId = e.target.dataset.id;
                    const parcel = this.parcels.find(p => p.id === parcelId);
                    parcel._tempLotAddress = e.target.value;
                    parcel.lotAddress = e.target.value;
                    this.updateParcelsData();
                }
                if (e.target.classList.contains('area-direct-input')) {
                    this.updateFirstCrop(e.target.dataset.id);
                }
                if (e.target.classList.contains('parcel-note-input')) {
                    const parcelId = e.target.dataset.id;
                    const parcel = this.parcels.find(p => p.id === parcelId);
                    if (parcel) { parcel.note = e.target.value; this.updateParcelsData(); }
                }
            });

            this.parcelsContainer.addEventListener('blur', (e) => {
                if (e.target.classList.contains('parcel-note-input')) {
                    const parcel = this.parcels.find(p => p.id === e.target.dataset.id);
                    if (parcel) { parcel.note = e.target.value; this.updateParcelsData(); }
                }
                if (e.target.classList.contains('lot-address-input')) {
                    const parcel = this.parcels.find(p => p.id === e.target.dataset.id);
                    if (parcel) { parcel.lotAddress = e.target.value.trim(); this.updateParcelsData(); }
                }
            }, true);

            this.parcelsContainer.addEventListener('keypress', (e) => {
                if (e.target.classList.contains('sub-lot-input') && e.key === 'Enter') {
                    e.preventDefault();
                    const addBtn = document.querySelector(`.btn-add-sub-lot-icon[data-id="${e.target.dataset.id}"]`);
                    if (addBtn) addBtn.click();
                }
            });
        }

        // 작물 모달 이벤트
        if (this.closeCropAreaModalBtn) this.closeCropAreaModalBtn.addEventListener('click', () => this.closeCropAreaModalFn());
        if (this.cancelCropAreaBtn) this.cancelCropAreaBtn.addEventListener('click', () => this.closeCropAreaModalFn());
        if (this.cropAreaModal) {
            const overlay = this.cropAreaModal.querySelector('.modal-overlay');
            if (overlay) overlay.addEventListener('click', () => this.closeCropAreaModalFn());
        }
        if (this.addCropAreaBtn) this.addCropAreaBtn.addEventListener('click', () => {
            this.tempCropAreas.push({ name: '', area: '', code: '' });
            this.renderCropAreaModal();
        });
        if (this.confirmCropAreaBtn) this.confirmCropAreaBtn.addEventListener('click', () => this.confirmCropArea());

        // 테이블 이벤트 위임
        if (this.tableBody) {
            this.tableBody.addEventListener('click', (e) => {
                const completeBtn = e.target.closest('.btn-complete');
                if (completeBtn) {
                    const id = completeBtn.dataset.id;
                    const log = this.sampleLogs.find(l => String(l.id) === id);
                    if (log) {
                        const newCompletedStatus = !log.isComplete;
                        const receptionNumber = log.receptionNumber || '';
                        // 본필지+하위필지 연동: 첫 번째 '-' 앞 숫자로 그룹핑
                        // 503, 503-1, 503-2 → 모두 baseNumber '503'으로 같은 그룹
                        // 성토(F접두사)와 일반 시료는 번호가 같아도 별개 그룹으로 분리
                        const relatedLogs = window.ReceptionGroup.findRelatedLogs(this.sampleLogs, receptionNumber);
                        relatedLogs.forEach(relatedLog => {
                            relatedLog.isComplete = newCompletedStatus;
                            relatedLog.updatedAt = new Date().toISOString();
                            const relatedRows = this.tableBody.querySelectorAll(`tr[data-id="${relatedLog.id}"]`);
                            relatedRows.forEach(relatedRow => {
                                const relatedButton = relatedRow?.querySelector('.btn-complete');
                                if (relatedButton) {
                                    if (newCompletedStatus) {
                                        relatedRow.classList.add('row-completed');
                                        relatedButton.classList.add('completed');
                                        relatedButton.textContent = '✔';
                                        relatedButton.title = '완료 취소';
                                    } else {
                                        relatedRow.classList.remove('row-completed');
                                        relatedButton.classList.remove('completed');
                                        relatedButton.textContent = '';
                                        relatedButton.title = '완료';
                                    }
                                }
                            });
                        });
                        this.saveLogs();
                        this.firebaseSaveRecords(relatedLogs); // 완료 상태 변경분만 저장
                        const count = relatedLogs.length;
                        if (newCompletedStatus) {
                            this.showToast(count > 1 ? `${count}개 시료가 완료 처리되었습니다` : '완료 처리되었습니다', 'success');
                        } else {
                            this.showToast(count > 1 ? `${count}개 시료가 완료 취소되었습니다` : '완료 취소되었습니다', 'success');
                        }
                    } else {
                        // 배지를 눌렀는데 아무 일도 안 일어나는 조용한 실패 방지 (SAMPL-1-148)
                        this.notifyEditTargetMissing('toggleComplete', { requestedId: id });
                    }
                }

                const deleteBtn = e.target.closest('.btn-delete');
                if (deleteBtn) {
                    const id = deleteBtn.dataset.id;
                    const targetLog = this.sampleLogs.find(log => String(log.id) === String(id));

                    if (targetLog?.groupId) {
                        const groupLogs = this.sampleLogs.filter(log => log.groupId === targetLog.groupId);

                        if (groupLogs.length > 1) {
                            const baseNumber = (targetLog.receptionNumber || '').split('-')[0];
                            const numbers = groupLogs.map(l => l.receptionNumber).join(', ');
                            const choice = confirm(
                                `같은 접수 그룹(${numbers})이 ${groupLogs.length}건 있습니다.\n` +
                                `[확인] 그룹 전체 삭제 (삭제 후 ${baseNumber}번으로 재입력 가능)\n` +
                                `[취소] 이 항목만 삭제`
                            );

                            if (choice) {
                                this.deleteGroup(targetLog.groupId, baseNumber);
                            } else {
                                this.deleteSample(id, targetLog.receptionNumber);
                            }
                            return;
                        }
                    }

                    if (confirm('정말 삭제하시겠습니까?')) {
                        this.deleteSample(id, targetLog?.receptionNumber);
                    }
                }

                const editBtn = e.target.closest('.btn-edit');
                if (editBtn) {
                    this.editSample(editBtn.dataset.id);
                }
            });

            // 체크박스 이벤트
            this.tableBody.addEventListener('change', (e) => {
                if (e.target.classList.contains('row-checkbox')) {
                    this.updateSelectAllState();
                    this.updateSelectedCount();
                    return;
                }
                // SAMPL-1-89: 공익직불제 전용 — 차수/기준년도 행별 인라인 편집
                const isOrder = e.target.classList.contains('gongik-order-select');
                const isBaseYear = e.target.classList.contains('gongik-baseyear-select');
                if (isOrder || isBaseYear) {
                    const id = e.target.dataset.id;
                    const log = this.sampleLogs.find(l => String(l.id) === String(id));
                    if (log) {
                        const val = e.target.value;
                        if (isOrder) log.gongikOrder = val;
                        else log.gongikBaseYear = val;
                        log.updatedAt = new Date().toISOString();
                        this.persistRecords([log]); // 로컬 + Firebase 동기화
                        // 같은 log가 여러 행(필지)으로 펼쳐진 경우 형제 select 값 동기화
                        const cls = isOrder ? 'gongik-order-select' : 'gongik-baseyear-select';
                        this.tableBody.querySelectorAll(`.${cls}[data-id="${id}"]`).forEach(sel => {
                            if (sel !== e.target) sel.value = val;
                        });
                    } else {
                        // 차수/기준년도를 골랐는데 반영되지 않는 조용한 실패 방지 (SAMPL-1-148)
                        this.notifyEditTargetMissing('gongikInlineEdit', { requestedId: id });
                    }
                }
            });
        }

        // 전체 선택 체크박스
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const rowCheckboxes = this.tableBody.querySelectorAll('.row-checkbox');
                rowCheckboxes.forEach(cb => { cb.checked = isChecked; });
                this.updateSelectedCount();
            });
        }

        // 성명 클릭 시 같은 이름 일괄 선택
        if (this.tableBody) {
            this.tableBody.addEventListener('click', (e) => {
                const nameCell = e.target.closest('.col-name');
                if (nameCell && nameCell.dataset.farmerKey) {
                    this.selectByName(nameCell.dataset.farmerKey);
                }
            });
        }

        // 전역 등록
        window.getSelectedIds = () => this.getSelectedIds();

        // 전체 보기/기본 보기 토글
        const viewToggleBtn = document.getElementById('viewToggleBtn');
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => {
                this.isFullView = !this.isFullView;
                const toggleText = viewToggleBtn.querySelector('.toggle-text');
                const toggleIcon = viewToggleBtn.querySelector('.toggle-icon');
                if (this.isFullView) {
                    if (this.logTable) this.logTable.classList.add('full-view');
                    if (toggleText) toggleText.textContent = '기본 보기';
                    if (toggleIcon) toggleIcon.textContent = '👁️‍🗨️';
                    viewToggleBtn.classList.add('active');
                } else {
                    if (this.logTable) this.logTable.classList.remove('full-view');
                    if (toggleText) toggleText.textContent = '전체 보기';
                    if (toggleIcon) toggleIcon.textContent = '👁️';
                    viewToggleBtn.classList.remove('active');
                }
            });
        }

        // 검색 모달
        const openSearchModalBtn = document.getElementById('openSearchModalBtn');
        const closeSearchModalBtn = document.getElementById('closeSearchModal');
        const searchDateFromInput = document.getElementById('searchDateFromInput');
        const searchDateToInput = document.getElementById('searchDateToInput');
        const searchNameInput = document.getElementById('searchNameInput');
        const searchReceptionFromInput = document.getElementById('searchReceptionFromInput');
        const searchReceptionToInput = document.getElementById('searchReceptionToInput');
        const searchLotInput = document.getElementById('searchLotInput');
        const clearSearchDateBtn = document.getElementById('clearSearchDate');
        const clearSearchReceptionBtn = document.getElementById('clearSearchReception');
        const clearSearchLotBtn = document.getElementById('clearSearchLot');
        const resetSearchBtn = document.getElementById('resetSearchBtn');
        const applySearchBtn = document.getElementById('applySearchBtn');

        const purposeFilter = document.getElementById('purposeFilter');
        if (purposeFilter) {
            purposeFilter.addEventListener('change', (e) => {
                this.currentSearchFilter.purpose = e.target.value;
                this.filterAndRenderLogs();
            });
        }

        const landClass1Tab = this.landClass1Tab || document.getElementById('landClass1Tab');
        if (landClass1Tab) {
            landClass1Tab.addEventListener('change', (e) => {
                this.currentSearchFilter.landClass1 = e.target.value;
                this.filterAndRenderLogs();
            });
        }

        // SAMPL-1-89: 공익직불제 일괄 적용 바 — 기준년도 옵션 채우기 + 적용 버튼
        const gbBaseYear = document.getElementById('gongikBulkBaseYear');
        if (gbBaseYear) {
            gbBaseYear.innerHTML = '<option value="">기준년도(선택)</option>'
                + GONGIK_BASE_YEAR_OPTIONS.map(v => `<option value="${v}">${v}</option>`).join('');
        }
        const gbApplyBtn = document.getElementById('gongikBulkApplyBtn');
        if (gbApplyBtn) gbApplyBtn.addEventListener('click', () => this.applyGongikBulk());

        const completedFilter = document.getElementById('completedFilter');
        if (completedFilter) {
            completedFilter.addEventListener('change', (e) => {
                this.currentSearchFilter.completed = e.target.value;
                this.filterAndRenderLogs();
            });
        }

        if (openSearchModalBtn) {
            openSearchModalBtn.addEventListener('click', () => {
                if (searchDateFromInput) searchDateFromInput.value = this.currentSearchFilter.dateFrom;
                if (searchDateToInput) searchDateToInput.value = this.currentSearchFilter.dateTo;
                if (searchNameInput) searchNameInput.value = this.currentSearchFilter.name;
                if (searchReceptionFromInput) searchReceptionFromInput.value = this.currentSearchFilter.receptionFrom;
                if (searchReceptionToInput) searchReceptionToInput.value = this.currentSearchFilter.receptionTo;
                if (searchLotInput) searchLotInput.value = this.currentSearchFilter.lot;
                if (this.listSearchModal) this.listSearchModal.classList.remove('hidden');
                if (searchNameInput) searchNameInput.focus();
            });
        }

        const closeSearchModal = () => { if (this.listSearchModal) this.listSearchModal.classList.add('hidden'); };
        if (closeSearchModalBtn) closeSearchModalBtn.addEventListener('click', closeSearchModal);
        if (this.listSearchModal) {
            const overlay = this.listSearchModal.querySelector('.modal-overlay');
            if (overlay) overlay.addEventListener('click', closeSearchModal);
        }

        if (clearSearchDateBtn) clearSearchDateBtn.addEventListener('click', () => {
            if (searchDateFromInput) searchDateFromInput.value = '';
            if (searchDateToInput) searchDateToInput.value = '';
        });
        if (clearSearchReceptionBtn) clearSearchReceptionBtn.addEventListener('click', () => {
            if (searchReceptionFromInput) searchReceptionFromInput.value = '';
            if (searchReceptionToInput) searchReceptionToInput.value = '';
        });
        if (clearSearchLotBtn) clearSearchLotBtn.addEventListener('click', () => {
            if (searchLotInput) searchLotInput.value = '';
        });

        if (resetSearchBtn) {
            resetSearchBtn.addEventListener('click', () => {
                if (searchDateFromInput) searchDateFromInput.value = '';
                if (searchDateToInput) searchDateToInput.value = '';
                if (searchNameInput) searchNameInput.value = '';
                if (searchReceptionFromInput) searchReceptionFromInput.value = '';
                if (searchReceptionToInput) searchReceptionToInput.value = '';
                if (searchLotInput) searchLotInput.value = '';
                if (purposeFilter) purposeFilter.value = '';
                if (completedFilter) completedFilter.value = 'incomplete';
                // 경지구분 1차 탭은 별도 필터이므로 고급검색 초기화 시 유지
                this.currentSearchFilter = { dateFrom: '', dateTo: '', name: '', receptionFrom: '', receptionTo: '', lot: '', purpose: '', landClass1: this.currentSearchFilter.landClass1 || '', completed: 'incomplete' };
                this.filterAndRenderLogs();
                closeSearchModal();
            });
        }

        if (applySearchBtn) {
            applySearchBtn.addEventListener('click', () => {
                this.currentSearchFilter.dateFrom = searchDateFromInput?.value || '';
                this.currentSearchFilter.dateTo = searchDateToInput?.value || '';
                this.currentSearchFilter.name = (searchNameInput?.value || '').toLowerCase();
                this.currentSearchFilter.receptionFrom = searchReceptionFromInput?.value || '';
                this.currentSearchFilter.receptionTo = searchReceptionToInput?.value || '';
                this.currentSearchFilter.lot = (searchLotInput?.value || '').toLowerCase();
                this.filterAndRenderLogs();
                closeSearchModal();
            });
        }

        const searchInputs = [searchNameInput, searchReceptionFromInput, searchReceptionToInput, searchLotInput];
        searchInputs.forEach(input => {
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && applySearchBtn) applySearchBtn.click();
                });
            }
        });

        // 라벨 인쇄
        const btnLabelPrint = document.getElementById('btnLabelPrint');
        if (btnLabelPrint) {
            btnLabelPrint.addEventListener('click', () => {
                const selectedIds = this.getSelectedIds();
                if (selectedIds.length === 0) {
                    if (this.sampleLogs.length === 0) { alert('인쇄할 데이터가 없습니다.'); return; }
                    if (!confirm(`선택된 항목이 없습니다.\n전체 ${this.sampleLogs.length}건을 라벨 인쇄하시겠습니까?`)) return;
                    this.openLabelPrintWithData(this.sampleLogs);
                } else {
                    const selectedLogs = this.sampleLogs.filter(log => selectedIds.includes(String(log.id)));
                    this.openLabelPrintWithData(selectedLogs);
                }
            });
        }

        // 일괄 완료
        const btnBulkComplete = document.getElementById('btnBulkComplete');
        if (btnBulkComplete) {
            btnBulkComplete.addEventListener('click', () => {
                const selectedIds = this.getSelectedIds();
                if (selectedIds.length === 0) { alert('완료 처리할 항목을 선택해주세요.'); return; }

                // 연관 접수번호(같은 base 번호) 포함한 실제 처리 대상 사전 계산
                // 성토(F접두사)와 일반 시료는 분리하여 그룹핑 (순수 로직 위임)
                const targetIds = window.ReceptionGroup.computeBulkTargetIds(this.sampleLogs, selectedIds);
                // 선택 대상이 모두 완료 상태면 → 일괄 해제, 아니면 → 일괄 완료
                const allComplete = [...targetIds].every(id => {
                    const log = this.sampleLogs.find(l => String(l.id) === id);
                    return log?.isComplete === true;
                });
                const newStatus = !allComplete;
                const actionLabel = newStatus ? '완료 처리' : '완료 해제';

                const extraCount = targetIds.size - selectedIds.length;
                const confirmMsg = extraCount > 0
                    ? `선택한 ${selectedIds.length}건 + 연관 접수번호 ${extraCount}건 포함\n총 ${targetIds.size}건을 ${actionLabel}하시겠습니까?`
                    : `선택한 ${selectedIds.length}건을 ${actionLabel}하시겠습니까?`;
                if (!confirm(confirmMsg)) return;

                const now = new Date().toISOString();
                const changedLogs = [];
                this.sampleLogs.forEach(log => {
                    if (targetIds.has(String(log.id))) {
                        log.isComplete = newStatus;
                        log.updatedAt = now;
                        changedLogs.push(log);
                    }
                });
                this.saveLogs();
                this.firebaseSaveRecords(changedLogs);
                this.filterAndRenderLogs();
                if (this.selectAllCheckbox) { this.selectAllCheckbox.checked = false; this.selectAllCheckbox.indeterminate = false; }
                this.updateSelectedCount();

                // 현재 완료여부 필터에 의해 처리 대상이 목록에서 즉시 숨겨지는 경우 안내
                const filterValue = document.getElementById('completedFilter')?.value;
                const hiddenByFilter = (filterValue === 'incomplete' && newStatus === true)
                    || (filterValue === 'completed' && newStatus === false);
                const hiddenNote = hiddenByFilter
                    ? ` ("${filterValue === 'incomplete' ? '미완료' : '완료'}" 필터로 인해 목록에서 숨겨짐)`
                    : '';
                this.showToast(`${changedLogs.length}건이 ${actionLabel}되었습니다.${hiddenNote}`, 'success');
            });
        }

        // 선택 삭제
        const btnBulkDelete = document.getElementById('btnBulkDelete');
        if (btnBulkDelete) {
            btnBulkDelete.addEventListener('click', () => {
                const selectedIds = this.getSelectedIds();
                if (selectedIds.length === 0) { alert('삭제할 항목을 선택해주세요.'); return; }
                if (!confirm(`선택한 ${selectedIds.length}건을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) return;
                this.sampleLogs = this.sampleLogs.filter(log => !selectedIds.includes(String(log.id)));
                this.saveLogs();
                this.firebaseDeleteRecords(selectedIds);
                this.filterAndRenderLogs();
                if (this.selectAllCheckbox) { this.selectAllCheckbox.checked = false; this.selectAllCheckbox.indeterminate = false; }
                this.updateSelectedCount();
                if (selectedIds.map(String).includes(String(this.editingId))) this.cancelEditMode();
                this.showToast(`${selectedIds.length}건이 삭제되었습니다.`, 'success');
            });
        }

        // 일괄 우편발송일자
        const btnBulkMailDate = document.getElementById('btnBulkMailDate');
        const closeMailDateModal = document.getElementById('closeMailDateModal');
        const cancelMailDateBtn = document.getElementById('cancelMailDateBtn');
        const confirmMailDateBtn = document.getElementById('confirmMailDateBtn');
        const mailDateInput = document.getElementById('mailDateInput');
        const mailDateInfo = document.getElementById('mailDateInfo');

        const closeMailDateModalFn = () => {
            if (this.mailDateModal) this.mailDateModal.classList.add('hidden');
            this.pendingMailDateIds = [];
        };

        if (closeMailDateModal) closeMailDateModal.addEventListener('click', closeMailDateModalFn);
        if (cancelMailDateBtn) cancelMailDateBtn.addEventListener('click', closeMailDateModalFn);
        if (this.mailDateModal) {
            const overlay = this.mailDateModal.querySelector('.modal-overlay');
            if (overlay) overlay.addEventListener('click', closeMailDateModalFn);
        }

        if (confirmMailDateBtn) {
            confirmMailDateBtn.addEventListener('click', () => {
                const inputDate = mailDateInput?.value;
                if (!inputDate) { this.showToast('날짜를 선택해주세요.', 'warning'); return; }
                let updatedCount = 0;
                const changedLogs = [];
                // in-place 갱신: 배열을 새 참조로 교체하지 않고 매칭 log 객체를 제자리에서 수정해
                // 외부 참조 고아화를 방지한다 (saveLogs in-place 취지와 통일)
                this.sampleLogs.forEach(log => {
                    if (this.pendingMailDateIds.includes(String(log.id))) {
                        updatedCount++;
                        log.mailDate = inputDate;
                        log.updatedAt = new Date().toISOString();
                        changedLogs.push(log);
                    }
                });
                this.saveLogs();
                this.firebaseSaveRecords(changedLogs);
                this.filterAndRenderLogs();
                if (this.selectAllCheckbox) { this.selectAllCheckbox.checked = false; this.selectAllCheckbox.indeterminate = false; }
                closeMailDateModalFn();
                this.showToast(`${updatedCount}건의 발송일자가 입력되었습니다.`, 'success');
            });
        }

        if (btnBulkMailDate) {
            btnBulkMailDate.addEventListener('click', () => {
                const selectedIds = this.getSelectedIds();
                if (selectedIds.length === 0) { this.showToast('발송일자를 입력할 항목을 선택해주세요.', 'warning'); return; }
                this.pendingMailDateIds = selectedIds;
                const today = new Date().toISOString().split('T')[0];
                if (mailDateInput) mailDateInput.value = today;
                if (mailDateInfo) mailDateInfo.textContent = `선택한 ${selectedIds.length}건의 우편발송일자를 입력하세요.`;
                if (this.mailDateModal) this.mailDateModal.classList.remove('hidden');
            });
        }

        // 통계
        const btnStatistics = document.getElementById('btnStatistics');
        const closeStatisticsModal = document.getElementById('closeStatisticsModal');
        const closeStatisticsBtn = document.getElementById('closeStatisticsBtn');

        if (btnStatistics) btnStatistics.addEventListener('click', () => this.openStatisticsModal());
        if (closeStatisticsModal) closeStatisticsModal.addEventListener('click', () => { if (this.statisticsModal) this.statisticsModal.classList.add('hidden'); });
        if (closeStatisticsBtn) closeStatisticsBtn.addEventListener('click', () => { if (this.statisticsModal) this.statisticsModal.classList.add('hidden'); });
        if (this.statisticsModal) {
            this.statisticsModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) this.statisticsModal.classList.add('hidden');
            });
        }

        // (SAMPL-1-156) 구 작물 모달의 죽은 배선을 제거했다.
        //  - `#openCropModalBtn`은 HTML에 없어 아무 일도 하지 않았다
        //  - 닫기/오버레이 리스너가 _bindCropSearchModal의 것과 중복 등록됐다
        //  - 분류 옵션을 **init 때 한 번만** 만들어, crop-data-loader가 런타임에
        //    CROP_CATEGORIES를 갈아끼우면 옛 분류가 남았다 (이제 열 때마다 다시 만든다)

        // 엑셀 내보내기
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => {
            this.exportToExcel();
        });

        // JSON 저장/불러오기
        const saveJsonBtn = document.getElementById('saveJsonBtn');
        const loadJsonInput = document.getElementById('loadJsonInput');

        SampleUtils.setupJSONSaveHandler({
            buttonElement: saveJsonBtn,
            sampleType: SAMPLE_TYPE,
            getData: () => this.sampleLogs,
            FileAPI: this.FileAPI,
            filePrefix: '시료접수대장',
            showToast: (msg, type) => this.showToast(msg, type)
        });

        SampleUtils.setupJSONLoadHandler({
            inputElement: loadJsonInput,
            getData: () => this.sampleLogs,
            setData: (data) => { this.sampleLogs = data; },
            saveData: () => { this.saveLogs(); this.firebaseBatchSync(); },
            renderData: () => this.filterAndRenderLogs(),
            showToast: (msg, type) => this.showToast(msg, type),
            deduplicateById: true
        });

        // 자동 저장 설정
        SampleUtils.setupAutoSaveFolderButton({
            moduleKey: 'soil',
            FileAPI: this.FileAPI,
            selectedYear: this.selectedYear,
            getWebFileHandle: () => this.autoSaveFileHandle,
            setWebFileHandle: (handle) => { this.autoSaveFileHandle = handle; },
            autoSaveCallback: () => this.autoSaveToFile(),
            showToast: (msg, type) => this.showToast(msg, type)
        });

        SampleUtils.setupAutoSaveToggle({
            moduleKey: 'soil',
            FileAPI: this.FileAPI,
            getWebFileHandle: () => this.autoSaveFileHandle,
            setWebFileHandle: (handle) => { this.autoSaveFileHandle = handle; },
            autoSaveCallback: () => this.autoSaveToFile(),
            showToast: (msg, type) => this.showToast(msg, type),
            log: (...args) => this.log(...args)
        });

        // 흙토람 내보내기 버튼 (별도 창으로 열기)
        const heuktoramBtn = document.getElementById('heuktoramBtn');
        if (heuktoramBtn) heuktoramBtn.addEventListener('click', () => {
            const selectedIds = this.getSelectedIds();
            localStorage.setItem('heuktoram_year', this.selectedYear);
            localStorage.setItem('heuktoram_selected_ids', JSON.stringify(selectedIds));

            const isElectron = window.electronAPI?.isElectron === true;
            if (isElectron) {
                window.electronAPI.openHeuktoram();
            } else {
                const popup = window.open('../heuktoram/index.html', '_blank');
                if (!popup) {
                    window.location.href = '../heuktoram/index.html';
                }
            }

            // H-2: 흙토람 로드 실패 시 잔류 데이터 정리 (5초 후)
            setTimeout(() => {
                localStorage.removeItem('heuktoram_year');
                localStorage.removeItem('heuktoram_selected_ids');
            }, 5000);
        });

        // 엑셀 서식 다운로드 (ExcelImportManager — 서식 버튼 전용, 가져오기는 SoilResultImporter)
        this.initExcelImporter();

        // 전체화면 뷰어
        const openViewerBtn = document.getElementById('openViewerBtn');
        if (openViewerBtn) {
            openViewerBtn.addEventListener('click', () => {
                const viewerWindow = window.open('viewer.html', 'DataViewer', 'width=1400,height=800,scrollbars=yes,resizable=yes');
                if (!viewerWindow) alert('팝업이 차단되었습니다.\n브라우저 설정에서 팝업을 허용해주세요.');
            });
        }

        // 등록 결과 모달 이벤트
        const closeRegistrationModal = document.getElementById('closeRegistrationModal');
        const closeResultBtn = document.getElementById('closeResultBtn');
        const exportResultBtn = document.getElementById('exportResultBtn');
        const editResultBtn = document.getElementById('editResultBtn');

        if (closeRegistrationModal) closeRegistrationModal.addEventListener('click', () => this.closeRegistrationResultModal());
        if (closeResultBtn) closeResultBtn.addEventListener('click', () => this.closeRegistrationResultModal());
        if (this.registrationResultModal) {
            const overlay = this.registrationResultModal.querySelector('.modal-overlay');
            if (overlay) overlay.addEventListener('click', () => this.closeRegistrationResultModal());
        }
        if (editResultBtn) {
            editResultBtn.addEventListener('click', () => {
                if (this.currentRegistrationData) {
                    const dataToEdit = this.currentRegistrationData;
                    this.closeRegistrationResultModal();
                    this.populateFormForEdit(dataToEdit);
                }
            });
        }
        if (exportResultBtn) exportResultBtn.addEventListener('click', () => this.exportRegistrationResult());

        // 지역 선택 모달 이벤트
        const closeRegionModal = document.getElementById('closeRegionModal');
        const cancelRegionSelection = document.getElementById('cancelRegionSelection');
        if (closeRegionModal) closeRegionModal.addEventListener('click', () => this.closeRegionSelectionModal());
        if (cancelRegionSelection) cancelRegionSelection.addEventListener('click', () => this.closeRegionSelectionModal());
        if (this.regionSelectionModal) {
            const overlay = this.regionSelectionModal.querySelector('.modal-overlay');
            if (overlay) overlay.addEventListener('click', () => this.closeRegionSelectionModal());
        }

        // 네비게이션 바 버튼
        if (this.navResetBtn) this.navResetBtn.addEventListener('click', () => this.resetFormKeepReceptionInfo());
        if (this.navSubmitBtn) this.navSubmitBtn.addEventListener('click', () => this.form.requestSubmit());

        // 페이지네이션 이벤트
        if (this.firstPageBtn) this.firstPageBtn.addEventListener('click', () => this.goToPage(1));
        if (this.prevPageBtn) this.prevPageBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        if (this.nextPageBtn) this.nextPageBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        if (this.lastPageBtn) this.lastPageBtn.addEventListener('click', () => this.goToPage(this.totalPages));
        if (this.itemsPerPageSelect) {
            this.itemsPerPageSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value, 10);
                localStorage.setItem('soilItemsPerPage', this.itemsPerPage);
                this.currentPage = 1;
                this.filterAndRenderLogs();
            });
        }

        // ⚠️ 작물 검색 배선은 **맨 마지막**에, 통째로 try/catch 안에 둔다 (SAMPL-1-156).
        //    이 함수는 780줄짜리 단일 배선 블록이고 접수 등록 버튼이 :4424에서 배선된다.
        //    중간에서 예외가 나면 뒤따르는 배선이 하나도 실행되지 않는데,
        //    BaseSampleManager.js:127의 try/catch가 그 예외를 삼켜 화면은 멀쩡해 보인다.
        //    조회 전용 부가기능 때문에 접수 등록이 죽는 일은 없어야 한다.
        try {
            this._bindCropSearchModal();
        } catch (err) {
            (window.logger?.error || console.error)('[작물검색] 배선 실패 — 기능만 비활성화합니다.', err);
            const btn = document.getElementById('cropSearchBtn');
            if (btn) btn.style.display = 'none';
        }
    }

    // ========================================
    // 작물 검색 모달 (SAMPL-1-156) — 조회 전용, 작물명을 클립보드로 복사
    // ========================================

    _bindCropSearchModal() {
        const openBtn = document.getElementById('cropSearchBtn');
        const modal = document.getElementById('cropModal');
        const input = document.getElementById('cropSearchInput');
        const filter = document.getElementById('cropCategoryFilter');
        const listEl = document.getElementById('cropList');
        const countEl = document.getElementById('cropResultCount');
        // ⚠️ 조용한 return이 아니라 **던진다**. 가장 발생 확률이 높은 실패는 마크업 드리프트인데
        //    (id 오타로 #cropModal이 사라짐) return하면 버튼은 멀쩡히 보이면서 눌러도 무반응이고
        //    콘솔에도 아무것도 안 남는다. 호출부 try/catch가 사유를 로그하고 버튼을 숨긴다.
        if (!modal || !listEl) throw new Error('작물 검색 모달 마크업 없음 (#cropModal / #cropList)');

        const escHandler = (e) => { if (e.key === 'Escape') closeModal(); };
        const closeModal = () => {
            modal.classList.add('hidden');
            document.removeEventListener('keydown', escHandler);
            // 포커스를 연 버튼으로 되돌린다 — 안 그러면 Tab 순서가 문서 처음으로 튄다
            openBtn?.focus();
        };

        const render = () => {
            const CS = window.CropSearch;
            if (!CS) {
                // 그냥 return하면 목록·건수가 **직전 상태 그대로** 남아 사용자가 최신이라 오해한다
                listEl.innerHTML = '';
                if (countEl) countEl.textContent = '작물 검색 모듈을 불러오지 못했습니다';
                return;
            }
            // ⚠️ 매번 window.CROP_DATA를 다시 읽는다. 작물 데이터는 3계층(번들→로컬→Firestore)으로
            //    런타임에 교체된다(crop-data-loader.js). 캡처하면 업로드한 목록이 조용히 무시된다.
            const crops = Array.isArray(window.CROP_DATA) ? window.CROP_DATA : [];
            const r = CS.filterCrops(crops, {
                keyword: input ? input.value : '',
                category: filter ? filter.value : '전체',
            });
            listEl.innerHTML = '';
            if (!r.items.length) {
                // 목록 높이가 고정이라(SAMPL-1-157) 안내가 없으면 빈 상자만 남는다
                const empty = document.createElement('li');
                empty.className = 'crop-empty';
                empty.textContent = '조건에 맞는 작물이 없습니다. 검색어나 분류를 바꿔 보세요.';
                listEl.appendChild(empty);
            }
            for (const c of r.items) {
                const li = document.createElement('li');
                li.className = 'crop-row';
                li.dataset.name = c.name || '';
                li.title = '클릭하여 작물명 복사';
                // 마우스 없이도 쓸 수 있어야 한다 — li + click만으로는 키보드 사용자가
                // 작물명을 복사할 방법이 아예 없다 (코드 리뷰 지적)
                li.tabIndex = 0;
                li.setAttribute('role', 'button');
                // ⚠️ textContent만 쓴다. CROP_DATA는 사용자가 올린 .xlsx에서도 온다(SAMPL-1-126).
                const nameEl = document.createElement('span');
                nameEl.className = 'crop-row-name';
                nameEl.textContent = c.name || '';
                const catEl = document.createElement('span');
                catEl.className = 'crop-row-cat';
                catEl.textContent = c.category || '';
                const codeEl = document.createElement('span');
                codeEl.className = 'crop-row-code';
                codeEl.textContent = c.code || '';
                li.append(nameEl, catEl, codeEl);
                listEl.appendChild(li);
            }
            if (countEl) {
                countEl.textContent = r.truncated
                    ? `${r.items.length}개 표시 / 전체 ${r.total}개 — 검색으로 좁혀 주세요`
                    : `${r.total}개 작물`;
            }
        };

        const rebuildCategories = () => {
            if (!filter) return;
            const CS = window.CropSearch;
            const prev = filter.value || '전체';
            const cats = CS
                ? CS.categoriesOf(window.CROP_DATA, window.CROP_CATEGORIES)
                : (Array.isArray(window.CROP_CATEGORIES) ? window.CROP_CATEGORIES : []);
            filter.innerHTML = '';
            const all = document.createElement('option');
            all.value = '전체';
            all.textContent = '전체 카테고리';
            filter.appendChild(all);
            for (const cat of cats) {
                if (cat === '전체') continue;
                const opt = document.createElement('option');
                opt.value = cat;
                opt.textContent = cat;
                filter.appendChild(opt);
            }
            // 고르고 있던 분류는 유지한다 (다시 열었다고 초기화되면 성가시다)
            filter.value = cats.includes(prev) ? prev : '전체';
        };

        const openModal = () => {
            rebuildCategories();
            if (input) input.value = '';
            render();
            modal.classList.remove('hidden');
            document.addEventListener('keydown', escHandler);
            input?.focus();
        };

        if (openBtn) openBtn.addEventListener('click', openModal);
        input?.addEventListener('input', render);
        filter?.addEventListener('change', render);

        // 행 클릭 → 작물명 복사 (대상이 앱 밖의 엑셀이라 폼 채우기가 아니라 복사다)
        const copyFromRow = (li) => {
            const name = li.dataset.name || '';
            if (!name) return;
            // ⚠️ clipboard가 없는 환경에서는 writeText 호출 **자체가 동기 예외**라
            //    아래 .catch()가 돌지 않는다 — 아무 안내 없이 조용히 실패한다.
            //    복사가 전부인 기능이므로 먼저 막고 사유를 알린다.
            if (!navigator.clipboard?.writeText) {
                this.showToast('이 환경에서는 작물명 복사를 쓸 수 없습니다. 이름을 직접 옮겨 적어 주세요.', 'error');
                return;
            }
            navigator.clipboard.writeText(name).then(() => {
                this.showToast(`'${name}' 복사됨 — 엑셀에 붙여넣으세요.`, 'success');
            }).catch(() => {
                this.showToast('작물명 복사에 실패했습니다.', 'error');
            });
        };

        listEl.addEventListener('click', (e) => {
            const li = e.target.closest('li.crop-row');
            if (li) copyFromRow(li);
        });
        listEl.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const li = e.target.closest('li.crop-row');
            if (!li) return;
            e.preventDefault();   // Space가 목록을 스크롤하지 않도록
            copyFromRow(li);
        });

        document.getElementById('closeCropModal')?.addEventListener('click', closeModal);
        document.getElementById('cancelCropSelection')?.addEventListener('click', closeModal);
        modal.querySelector('.modal-overlay')?.addEventListener('click', closeModal);
    }

    // ========================================
    // 엑셀 내보내기
    // ========================================

    exportToExcel() {
        // SAMPL-1-95: 현재 경지구분 탭 기준 데이터로 내보내기 (선택 항목 있으면 그 항목 우선)
        const tabLogs = this.getTabFilteredLogs();
        if (tabLogs.length === 0) { alert('내보낼 데이터가 없습니다.'); return; }
        const selectedIds = this.getSelectedIds();
        const logsToExport = selectedIds.length > 0
            ? tabLogs.filter(log => selectedIds.includes(log.id)) : tabLogs;
        if (selectedIds.length > 0) this.showToast(`선택한 ${logsToExport.length}건을 내보냅니다.`, 'info');

        const reversedLogs = [...logsToExport].sort((a, b) => {
            const partsA = (a.receptionNumber || '').replace(/^F/, '').split('-').map(Number);
            const partsB = (b.receptionNumber || '').replace(/^F/, '').split('-').map(Number);
            for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
                const va = partsA[i] || 0;
                const vb = partsB[i] || 0;
                if (va !== vb) return va - vb;
            }
            return 0;
        });
        const excelData = [];

        reversedLogs.forEach(log => {
            const addressParts = parseAddressParts(log.addressRoad || log.address || '');
            const fullAddress = [log.addressRoad, log.addressDetail].filter(Boolean).join(' ') || '-';
            if (log.parcels && log.parcels.length > 0) {
                log.parcels.forEach((parcel) => {
                    const cropsDisplay = parcel.crops && parcel.crops.length > 0
                        ? parcel.crops.map(c => c.name).join(', ') : '-';
                    const totalArea = parcel.crops ? parcel.crops.reduce((sum, c) => sum + (parseFloat(c.area) || 0), 0) : 0;
                    const excelLotAddress = parcel.lotAddress ? (parcel.isMountain ? `${parcel.lotAddress} (산)` : parcel.lotAddress) : '-';
                    excelData.push({
                        '접수번호': log.receptionNumber, '접수일자': log.date, '구분': log.subCategory || '-',
                        '경지구분1차': log.landClass1 || LAND_CLASS1_DEFAULT,
                        '목적(용도)': parcel.purpose || log.purpose || '-', '성명': log.name, '전화번호': log.phoneNumber,
                        '시도': addressParts.sido || '-', '시군구': addressParts.sigungu || '-',
                        '읍면동': addressParts.eupmyeondong || '-', '나머지주소': addressParts.rest || '-',
                        '전체주소': fullAddress, '필지 주소': excelLotAddress, '작물': cropsDisplay,
                        '면적(m²)': totalArea > 0 ? totalArea : '-', '수령 방법': log.receptionMethod || '-',
                        '비고': log.note || '-', '완료여부': log.isComplete ? '완료' : '미완료',
                        '등록일시': log.createdAt ? new Date(log.createdAt).toLocaleString('ko-KR') : '-'
                    });
                    if (parcel.subLots && parcel.subLots.length > 0) {
                        parcel.subLots.forEach((subLot, sIdx) => {
                            const subLotAddress = typeof subLot === 'string' ? subLot : subLot.lotAddress;
                            const subLotCrops = typeof subLot === 'string' ? [] : (subLot.crops || []);
                            const subLotCropsDisplay = subLotCrops.length > 0 ? subLotCrops.map(c => c.name).join(', ') : '-';
                            const subLotTotalArea = subLotCrops.length > 0 ? subLotCrops.reduce((sum, c) => sum + (parseFloat(c.area) || 0), 0) : 0;
                            excelData.push({
                                '접수번호': `${log.receptionNumber}-${sIdx + 1}`, '접수일자': log.date,
                                '구분': log.subCategory || '-', '경지구분1차': log.landClass1 || LAND_CLASS1_DEFAULT,
                                '목적(용도)': parcel.purpose || log.purpose || '-',
                                '성명': log.name, '전화번호': log.phoneNumber, '시도': addressParts.sido || '-',
                                '시군구': addressParts.sigungu || '-', '읍면동': addressParts.eupmyeondong || '-',
                                '나머지주소': addressParts.rest || '-', '전체주소': fullAddress,
                                '필지 주소': subLotAddress, '작물': subLotCropsDisplay,
                                '면적(m²)': subLotTotalArea > 0 ? subLotTotalArea : '-',
                                '수령 방법': log.receptionMethod || '-', '비고': log.note || '-',
                                '완료여부': log.isComplete ? '완료' : '미완료',
                                '등록일시': log.createdAt ? new Date(log.createdAt).toLocaleString('ko-KR') : '-'
                            });
                        });
                    }
                });
            } else {
                excelData.push({
                    '접수번호': log.receptionNumber, '접수일자': log.date, '구분': log.subCategory || '-',
                    '경지구분1차': log.landClass1 || LAND_CLASS1_DEFAULT,
                    '목적(용도)': log.purpose || '-', '성명': log.name, '전화번호': log.phoneNumber,
                    '시도': addressParts.sido || '-', '시군구': addressParts.sigungu || '-',
                    '읍면동': addressParts.eupmyeondong || '-', '나머지주소': addressParts.rest || '-',
                    '전체주소': fullAddress, '필지 주소': log.lotAddress || '-',
                    '작물': log.cropsDisplay || '-', '면적(m²)': log.area || '-',
                    '수령 방법': log.receptionMethod || '-', '비고': log.note || '-',
                    '완료여부': log.isComplete ? '완료' : '미완료',
                    '등록일시': log.createdAt ? new Date(log.createdAt).toLocaleString('ko-KR') : '-'
                });
            }
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(sanitizeExcelData(excelData));
        // 컬럼 순서: 접수번호, 접수일자, 구분, 경지구분1차, 목적(용도), 성명, 전화번호,
        //            시도, 시군구, 읍면동, 나머지주소, 전체주소, 필지 주소, 작물,
        //            면적(m²), 수령 방법, 비고, 완료여부, 등록일시
        ws['!cols'] = [
            { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 15 },
            { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
            { wch: 10 }, { wch: 10 }, { wch: 20 }, { wch: 8 }, { wch: 18 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, '시료접수대장');
        const today = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `토양_접수대장_${today}.xlsx`);
    }

    // ========================================
    // 등록 결과 엑셀 내보내기
    // ========================================

    exportRegistrationResult() {
        if (!this.currentRegistrationData) return;
        const formatArea = this.formatArea || window.SampleUtils?.formatArea || ((v) => v);
        const excelData = [];
        excelData.push({ '항목': '접수번호', '내용': this.currentRegistrationData.receptionNumber });
        excelData.push({ '항목': '접수일자', '내용': this.currentRegistrationData.date });
        excelData.push({ '항목': '구분', '내용': this.currentRegistrationData.subCategory || '-' });
        excelData.push({ '항목': '목적 (용도)', '내용': this.currentRegistrationData.purpose || '-' });
        excelData.push({ '항목': '성명', '내용': this.currentRegistrationData.name });
        excelData.push({ '항목': '전화번호', '내용': this.currentRegistrationData.phoneNumber });
        excelData.push({ '항목': '주소', '내용': this.currentRegistrationData.address || '-' });
        excelData.push({ '항목': '수령 방법', '내용': this.currentRegistrationData.receptionMethod || '-' });
        excelData.push({ '항목': '비고', '내용': this.currentRegistrationData.note || '-' });

        if (this.currentRegistrationData.parcels && this.currentRegistrationData.parcels.length > 0) {
            excelData.push({ '항목': '', '내용': '' });
            excelData.push({ '항목': '=== 필지 정보 ===', '내용': '' });
            this.currentRegistrationData.parcels.forEach((parcel, idx) => {
                excelData.push({ '항목': `필지 ${idx + 1}`, '내용': parcel.lotAddress });
                if (parcel.subLots && parcel.subLots.length > 0) {
                    excelData.push({ '항목': '  하위 필지', '내용': parcel.subLots.map(s => typeof s === 'string' ? s : s.lotAddress).join(', ') });
                }
                if (parcel.crops && parcel.crops.length > 0) {
                    parcel.crops.forEach(crop => {
                        excelData.push({ '항목': '  작물', '내용': `${crop.name} (${formatArea(crop.area)}m²)` });
                    });
                }
            });
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(sanitizeExcelData(excelData));
        ws['!cols'] = [{ wch: 20 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, ws, '등록결과');
        XLSX.writeFile(wb, `등록결과_${this.currentRegistrationData.receptionNumber}_${this.currentRegistrationData.name}.xlsx`);
        this.showToast('엑셀 파일로 내보내기 완료', 'success');
    }

    // ========================================
    // 엑셀 가져오기 초기화
    // ========================================


    // ========================================
    initExcelImporter() {
        const excelImporter = new ExcelImportManager({
            appFields: [
                { key: 'receptionNumber', label: '접수번호' }, { key: 'date', label: '접수일자' },
                { key: 'subCategory', label: '구분(논/밭)' }, { key: 'purpose', label: '목적(용도)' },
                { key: 'name', label: '성명' }, { key: 'phoneNumber', label: '전화번호' },
                { key: 'address', label: '주소' }, { key: 'lotAddress', label: '필지 주소' },
                { key: 'crop', label: '작물' }, { key: 'area', label: '면적(m2)' },
                { key: 'receptionMethod', label: '수령방법' }, { key: 'note', label: '비고' }
            ],
            autoMapRules: {
                '접수번호': 'receptionNumber', '번호': 'receptionNumber', 'no': 'receptionNumber',
                '접수일자': 'date', '날짜': 'date', '일자': 'date',
                '구분': 'subCategory', '분류': 'subCategory', '논밭': 'subCategory',
                '목적': 'purpose', '용도': 'purpose', '목적(용도)': 'purpose',
                '성명': 'name', '이름': 'name', '의뢰인': 'name', '의뢰자': 'name',
                '전화번호': 'phoneNumber', '연락처': 'phoneNumber', '전화': 'phoneNumber', '휴대폰': 'phoneNumber',
                '주소': 'address', '의뢰인주소': 'address', '자택주소': 'address',
                '필지': 'lotAddress', '필지주소': 'lotAddress', '필지 주소': 'lotAddress',
                '지번': 'lotAddress', '소재지': 'lotAddress', '토지소재지': 'lotAddress',
                '작물': 'crop', '작물명': 'crop', '재배작물': 'crop',
                '면적': 'area', '면적(m²)': 'area', '면적(m2)': 'area', '재배면적': 'area',
                '수령방법': 'receptionMethod', '수령 방법': 'receptionMethod',
                '비고': 'note', '메모': 'note', '참고': 'note'
            },
            templateConfig: {
                headers: ['접수번호', '구분', '목적(용도)', '필지 주소', '작물', '면적(m2)', '비고'],
                sampleRow: ['1', '밭', '일반재배', '봉화군 봉화읍 문단리 224', '고추', '1500', ''],
                colWidths: [{ wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 20 }],
                sheetName: '토양시료', fileName: '토양_가져오기_서식'
            },
            previewColumns: [
                { key: 'receptionNumber', label: '접수번호' }, { key: 'date', label: '접수일자' },
                { key: 'subCategory', label: '구분' }, { key: 'name', label: '성명' },
                { key: 'lotAddress', label: '필지 주소' }, { key: 'cropsDisplay', label: '작물' },
                { key: 'area', label: '면적(m2)' }, { key: 'note', label: '비고' }
            ],
            getCommonData: () => {
                const groupId = crypto.randomUUID();
                return {
                    date: document.getElementById('importDate').value || new Date().toISOString().slice(0, 10),
                    name: document.getElementById('importName').value.trim(),
                    phone: document.getElementById('importPhone').value.trim(),
                    address: document.getElementById('importAddress').value.trim(),
                    method: document.getElementById('importMethod').value,
                    purpose: document.getElementById('importPurpose').value,
                    groupId, now: new Date().toISOString()
                };
            },
            buildRecord: (getVal, parseExcelDate, common) => {
                const receptionNumber = getVal('receptionNumber') || '';
                const dateVal = getVal('date');
                const date = parseExcelDate(dateVal) || common.date;
                const subCategory = getVal('subCategory') || '밭';
                const purpose = getVal('purpose') || common.purpose;
                const name = getVal('name') || common.name;
                const phoneNumber = getVal('phoneNumber') || common.phone;
                const address = getVal('address') || common.address;
                const lotAddress = getVal('lotAddress') || '';
                const crop = getVal('crop') || '';
                const areaVal = getVal('area');
                const area = areaVal ? String(parseFloat(areaVal) || 0) : '0';
                const receptionMethod = getVal('receptionMethod') || common.method;
                const note = getVal('note') || '';
                return {
                    id: crypto.randomUUID(), receptionNumber, date, name, phoneNumber, address,
                    subCategory, purpose, receptionMethod, note, groupId: common.groupId,
                    parcelIndex: 0, totalParcels: 0,
                    parcels: [{ id: crypto.randomUUID(), lotAddress, isMountain: false, subLots: [],
                        crops: crop ? [{ name: crop, area: area, unit: 'm2' }] : [],
                        category: subCategory, purpose, note: '' }],
                    lotAddress, area, cropsDisplay: crop || '-',
                    createdAt: common.now, updatedAt: common.now
                };
            },
            skipRowCheck: (record) => {
                if (!record.lotAddress && record.cropsDisplay === '-' && !record.name) return `필지주소, 작물, 성명이 모두 비어 있어 건너뜁니다.`;
                return null;
            },
            postBuildRecords: (records) => {
                const total = records.length;
                records.forEach((l, i) => { l.parcelIndex = i + 1; l.totalParcels = total; });
            },
            getExistingLogs: () => this.sampleLogs,
            autoNumberFilter: (log) => {
                if (!log.receptionNumber) return false;
                if (log.subCategory === '성토') return false;
                const base = log.receptionNumber.split('-')[0];
                if (base.startsWith('F')) return false;
                return true;
            },
            autoNumberExtract: (log) => {
                const base = log.receptionNumber.split('-')[0];
                return parseInt(base, 10);
            },
            onImportComplete: (records) => {
                records.forEach(logEntry => this.sampleLogs.push(logEntry));
                this.sampleLogs.sort((a, b) => {
                    const partsA = (a.receptionNumber || '').replace(/^F/, '').split('-').map(Number);
                    const partsB = (b.receptionNumber || '').replace(/^F/, '').split('-').map(Number);
                    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
                        const va = partsA[i] || 0;
                        const vb = partsB[i] || 0;
                        if (va !== vb) return va - vb;
                    }
                    return 0;
                });
                this.saveLogs();
                this.firebaseBatchSync(); // 대량 import는 전체 동기화
                this.filterAndRenderLogs();
                this.log('엑셀 가져오기 완료:', records.length, '건');
            }
        });
        excelImporter.init();
    }

    // Override: 초기화 후 추가 로직
    // ========================================

    async postInit() {
        // 초기 접수번호 설정
        if (this.receptionNumberInput) {
            this.receptionNumberInput.value = this.generateNextReceptionNumber();
        }

        // 로컬 모드에서만 auto-save 로드 (Firebase 모드에서는 로드 안함)
        if (window.isElectron && this.FileAPI?.autoSavePath && !window.firebaseConfig?.isEnabled()) {
            const autoSaveData = await window.loadFromAutoSaveFile();
            if (autoSaveData && autoSaveData.length > 0 && this.sampleLogs.length === 0) {
                this.sampleLogs = autoSaveData;
                localStorage.setItem(this.getStorageKey(this.selectedYear), JSON.stringify(this.sampleLogs));
                this.log('로컬 모드: 자동 저장 파일에서 데이터 로드됨:', autoSaveData.length, '건');
                this.filterAndRenderLogs();
                if (this.receptionNumberInput) {
                    this.receptionNumberInput.value = this.generateNextReceptionNumber();
                }
            }
        }

        this.log('토양 시료 접수 페이지 초기화 완료');

        // 기존 addressVerified: false 데이터 처리
        const invalidLogs = this.sampleLogs.filter(l => l.addressVerified === false);
        if (invalidLogs.length > 0) {
            // Electron: IPC로 재검증 가능
            if (window.electronAPI?.vworldGeocode) {
                this.validateAndMarkLogs(invalidLogs).catch(err =>
                    (window.logger?.error || console.error)('기존 필지 재검증 오류:', err)
                );
            } else {
                // 웹: CORS로 VWORLD 접근 불가 → 잘못된 검증 결과 초기화
                let cleared = false;
                invalidLogs.forEach(log => {
                    delete log.addressVerified;
                    cleared = true;
                });
                if (cleared) {
                    try {
                        localStorage.setItem(this.getStorageKey(this.selectedYear), JSON.stringify(this.sampleLogs));
                    } catch { /* ignore */ }
                    this.filterAndRenderLogs();
                }
            }
        }
    }

    // ========================================
    // VWORLD 지번 주소 검증
    // ========================================

    async validateParcelAddress(lotAddress) {
        if (!lotAddress || lotAddress === '-') return null;
        if (!navigator.onLine) return null;

        // 시·도 결정 (전국 기관용 — 봉화군/경상북도 가정 제거)
        //  1) 주소에 시·도가 이미 있으면(자동완성 선택 시 JUSO siNm 포함) 약어를 정식명으로 펼쳐 사용
        //     (예: '경북 봉화군…' → '경상북도 봉화군…')
        //  2) 시·도가 없으면 설정의 '기본 시·도'(app_default_sido)로 prefix
        //  3) 설정값도 없으면 시·도 미상 → null 반환(검증 스킵). 강제 prefix로 인한 오검증 방지.
        // 탐지는 constants.js의 완전한 SIDO_PATTERN 재사용(특별자치도 표기 포함). 누락 시 폴백 정규식.
        const SIDO_RE = window.SIDO_PATTERN
            || /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주|경기도|강원도|강원특별자치도|충청북도|충청남도|전라북도|전북특별자치도|전라남도|경상북도|경상남도|제주도|제주특별자치도)\s*/;
        // 선두 약어 시·도 → 정식명 매핑은 address-parser.js SSOT(window.expandSido) 재사용
        const SHORT_SIDO_RE = /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)(\s)/;
        let fullAddress;
        if (SIDO_RE.test(lotAddress)) {
            fullAddress = lotAddress.replace(SHORT_SIDO_RE, (_, sido, sp) => (window.expandSido ? window.expandSido(sido) : sido) + sp);
        } else {
            let defaultSido = '';
            try { defaultSido = (localStorage.getItem('app_default_sido') || '').trim(); } catch { defaultSido = ''; }
            if (!defaultSido) return null; // 시·도 미상 → 검증 스킵(오검증 방지)
            fullAddress = `${defaultSido} ${lotAddress}`;
        }

        // Electron: main process IPC (apiKey는 main의 process.env에서 직접 사용 → 렌더러 노출 없음)
        if (window.electronAPI?.vworldGeocode) {
            try {
                return await window.electronAPI.vworldGeocode(fullAddress);
            } catch {
                return null;
            }
        }

        // 웹 환경: VWORLD API 키를 렌더러/번들에 노출하지 않기 위해 직접 fetch 경로를 제거함.
        // 좌표 기반 필지 검증은 Electron(IPC, main 프로세스 process.env)에서만 수행하며,
        // 웹 환경에서는 검증을 생략한다(null). 웹에서 검증이 필요하면 서버 프록시를 도입할 것.
        return null;
    }

    async validateAndMarkLogs(logs) {
        const BATCH_SIZE = 5;
        let changed = false;

        for (let i = 0; i < logs.length; i += BATCH_SIZE) {
            const batch = logs.slice(i, i + BATCH_SIZE);
            const results = await Promise.allSettled(
                batch.map(async (log) => {
                    // 필지 주소만 검증 (하위필지는 지번만 저장되므로 제외)
                    const addresses = [];
                    if (log.parcels && log.parcels.length > 0) {
                        log.parcels.forEach(p => {
                            if (p.lotAddress) addresses.push(p.lotAddress);
                        });
                    } else if (log.lotAddress) {
                        addresses.push(log.lotAddress);
                    }
                    if (addresses.length === 0) return null;
                    const verifications = await Promise.allSettled(
                        addresses.map(addr => this.validateParcelAddress(addr))
                    );
                    const values = verifications
                        .filter(r => r.status === 'fulfilled' && r.value !== null)
                        .map(r => r.value);
                    if (values.length === 0) return null;
                    return values.every(v => v === true);
                })
            );
            results.forEach((r, idx) => {
                if (r.status === 'fulfilled' && r.value !== null) {
                    batch[idx].addressVerified = r.value;
                    // 안전망(defense-in-depth): saveLogs는 in-place라 고아 참조가 생기지 않지만,
                    // 전달된 log가 실제 this.sampleLogs 항목과 다른 참조이면 id로 찾아 동기화한다.
                    // (동일 참조면 스킵) — addressVerified가 영속화·풀렌더에 반영되도록 보장.
                    const liveLog = this.sampleLogs.find(l => String(l.id) === String(batch[idx].id));
                    if (liveLog && liveLog !== batch[idx]) liveLog.addressVerified = r.value;
                    changed = true;
                }
            });
        }

        if (changed) {
            // localStorage + Firebase 개별 저장 (addressVerified 영속화)
            try {
                localStorage.setItem(this.getStorageKey(this.selectedYear), JSON.stringify(this.sampleLogs));
            } catch { /* 저장 실패 시 무시 */ }
            const verifiedLogs = logs.filter(l => l.addressVerified !== undefined);
            if (verifiedLogs.length > 0) this.firebaseSaveRecords(verifiedLogs);
            // 전체 재렌더링 대신 검증 결과 셀만 DOM에서 직접 업데이트
            logs.forEach(log => {
                const invalidClass = log.addressVerified === false;
                this.tableBody?.querySelectorAll(`tr[data-id="${log.id}"] td.col-lot-address`).forEach(td => {
                    td.classList.toggle('address-invalid', invalidClass);
                    td.title = invalidClass ? '지번 주소가 VWORLD에서 확인되지 않았습니다' : '';
                });
            });
            const invalidCount = logs.filter(l => l.addressVerified === false).length;
            if (invalidCount > 0) {
                this.showToast(`${invalidCount}건의 필지 주소를 확인하세요 (지번 불일치)`, 'warning');
            }
        }
    }
}

// ========================================
// 인스턴스 생성 및 초기화
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    const manager = new SoilSampleManager();
    await manager.init();
    await manager.postInit();
    window.soilManager = manager;
});
