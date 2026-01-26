// ========================================
// Base Sample Manager 클래스
// 모든 시료 타입의 공통 기능을 관리하는 기본 클래스
// ========================================

/**
 * 시료 관리의 기본 클래스
 * 모든 시료 타입 (soil, water, compost, pesticide, heavy-metal)이 공통으로 사용하는 기능 제공
 */
class BaseSampleManager {
    /**
     * @param {Object} config - 시료 타입별 설정
     * @param {string} config.moduleKey - 모듈 키 (예: 'soil', 'water')
     * @param {string} config.moduleName - 모듈 표시명 (예: '토양', '수질분석')
     * @param {string} config.storageKey - localStorage 키 (예: 'soilSampleLogs')
     * @param {boolean} config.debug - 디버그 모드 여부
     */
    constructor(config) {
        // 설정
        this.moduleKey = config.moduleKey;
        this.moduleName = config.moduleName;
        this.storageKey = config.storageKey;
        this.debug = config.debug || false;

        // 상태
        this.sampleLogs = [];
        this.selectedYear = new Date().getFullYear().toString();
        this.editingId = null;
        this.currentPage = 1;
        this.itemsPerPage = 100;
        this.totalPages = 1;
        this.isCloudSyncing = false;

        // DOM 참조 (서브클래스에서 설정)
        this.form = null;
        this.tableBody = null;
        this.emptyState = null;
        this.recordCountEl = null;

        // 자동 저장 관련
        this.autoSaveTimer = null;
        this.lastSavedDataHash = null;

        // FileAPI 인스턴스
        if (window.createFileAPI) {
            this.FileAPI = window.createFileAPI(this.moduleKey);
        }
    }

    // ========================================
    // 초기화
    // ========================================

    /**
     * 매니저 초기화
     */
    async init() {
        try {
            // FileAPI 초기화
            if (this.FileAPI) {
                await this.FileAPI.init(this.getCurrentYear());
            }

            // Firebase 초기화
            await this.initFirebase();

            // 자동 저장 초기화
            await this.initAutoSave();

            // 데이터가 있는 연도 찾기
            this.selectedYear = this.findYearWithData();

            // 선택된 연도의 데이터 로드
            await this.loadYearData(this.selectedYear);

            // UI 초기화
            this.initUI();

            // 이벤트 리스너 설정
            this.setupEventListeners();

            this.log('✅ 매니저 초기화 완료');
        } catch (error) {
            (window.logger?.error || console.error)('매니저 초기화 실패:', error);
        }
    }

    /**
     * Firebase 초기화
     */
    async initFirebase() {
        if (window.firebaseConfig?.initialize && !window.firebaseInitialized) {
            try {
                window.firebaseInitialized = await window.firebaseConfig.initialize();
                this.log('Firebase 초기화 결과:', window.firebaseInitialized);
            } catch (err) {
                (window.logger?.error || console.error)('Firebase 초기화 에러:', err);
            }
        }

        if (window.firebaseInitialized && window.firestoreDb?.init && !window.firestoreInitialized) {
            try {
                window.firestoreInitialized = await window.firestoreDb.init();
                this.log('Firestore 초기화 결과:', window.firestoreInitialized);
            } catch (err) {
                (window.logger?.error || console.error)('Firestore 초기화 에러:', err);
            }
        }
    }

    // ========================================
    // 연도 관리
    // ========================================

    /**
     * 현재 연도 반환
     */
    getCurrentYear() {
        return new Date().getFullYear();
    }

    /**
     * 연도별 스토리지 키 생성
     * @param {string} year - 연도
     */
    getStorageKey(year) {
        return `${this.storageKey}_${year}`;
    }

    /**
     * 데이터가 있는 연도 자동 감지
     */
    findYearWithData() {
        const currentYear = this.getCurrentYear();
        // 현재 연도부터 2020년까지 검색
        for (let year = currentYear; year >= 2020; year--) {
            const key = this.getStorageKey(year);
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return year.toString();
                    }
                } catch (e) {
                    // 잘못된 데이터 무시
                }
            }
        }
        return currentYear.toString();
    }

    /**
     * 연도 선택 드롭다운 동기화
     * @param {string} newYear - 새로운 연도
     */
    syncYearSelects(newYear) {
        const yearSelect = document.getElementById('yearSelect');
        const listYearSelect = document.getElementById('listYearSelect');

        if (yearSelect) yearSelect.value = newYear;
        if (listYearSelect) listYearSelect.value = newYear;

        this.selectedYear = newYear;
        this.onYearChange(newYear);
    }

    // ========================================
    // 데이터 관리
    // ========================================

    /**
     * 데이터 저장
     */
    saveLogs() {
        const yearStorageKey = this.getStorageKey(this.selectedYear);

        // ID 생성 (없는 경우)
        this.sampleLogs = this.sampleLogs.map(item => ({
            ...item,
            id: item.id || this.generateId()
        }));

        // localStorage 저장
        localStorage.setItem(yearStorageKey, JSON.stringify(this.sampleLogs));
        this.log('💾 로컬 저장 완료:', this.sampleLogs.length, '건');

        // Firebase 저장
        if (window.firestoreDb?.isEnabled()) {
            window.firestoreDb.batchSave(this.moduleKey, parseInt(this.selectedYear), this.sampleLogs)
                .then(() => this.log('☁️ Firebase 저장 완료'))
                .catch(err => {
                    (window.logger?.error || console.error)('Firebase 저장 실패:', err);
                    this.showToast('클라우드 동기화 실패', 'error');
                });
        }

        // 자동 저장 트리거
        this.triggerAutoSave();

        // 레코드 수 업데이트
        this.updateRecordCount();
    }

    /**
     * 샘플 삭제
     * @param {string} id - 삭제할 샘플 ID
     */
    deleteSample(id) {
        this.sampleLogs = this.sampleLogs.filter(l => String(l.id) !== id);
        this.saveLogs();
        this.renderLogs(this.sampleLogs);

        if (window.firestoreDb?.isEnabled()) {
            window.firestoreDb.delete(this.moduleKey, parseInt(this.selectedYear), id)
                .then(() => this.log('☁️ Firebase 삭제 완료:', id))
                .catch(err => (window.logger?.error || console.error)('Firebase 삭제 실패:', err));
        }

        this.showToast('삭제되었습니다.', 'success');
    }

    /**
     * 년도별 데이터 로드
     * @param {string} year - 연도
     */
    async loadYearData(year) {
        this.log(`📅 ${year}년 데이터 로드 시작`);

        try {
            const yearStorageKey = this.getStorageKey(year);

            // 로컬 데이터 먼저 로드
            const localData = localStorage.getItem(yearStorageKey);
            let localLogs = [];

            if (localData) {
                try {
                    localLogs = JSON.parse(localData);
                    if (!Array.isArray(localLogs)) {
                        localLogs = [];
                    }
                } catch (e) {
                    (window.logger?.error || console.error)('로컬 데이터 파싱 에러:', e);
                    localLogs = [];
                }
            }

            // Firebase 데이터와 동기화
            if (window.firestoreDb?.isEnabled()) {
                try {
                    await this.syncWithCloud(year, localLogs);
                } catch (error) {
                    (window.logger?.error || console.error)('클라우드 동기화 실패:', error);
                    // 동기화 실패해도 로컬 데이터는 사용
                }
            }

            // 최종 데이터 로드
            const finalData = localStorage.getItem(yearStorageKey);
            if (finalData) {
                this.sampleLogs = JSON.parse(finalData);
            } else {
                this.sampleLogs = localLogs;
            }

            // UI 업데이트
            this.renderLogs(this.sampleLogs);
            this.updateRecordCount();

            // FileAPI 경로 업데이트
            if (this.FileAPI) {
                await this.FileAPI.updateAutoSavePath(year);
            }

            // 자동 저장 트리거
            this.triggerAutoSave();

            this.log(`✅ ${year}년 데이터 로드 완료:`, this.sampleLogs.length, '건');
        } catch (error) {
            (window.logger?.error || console.error)('데이터 로드 실패:', error);
            this.showToast('데이터 로드 실패', 'error');
        }
    }

    /**
     * 클라우드 동기화
     * @param {string} year - 연도
     * @param {Array} localLogs - 로컬 로그 데이터
     */
    async syncWithCloud(year, localLogs) {
        if (!window.firestoreDb?.isEnabled() || this.isCloudSyncing) {
            return;
        }

        this.isCloudSyncing = true;
        this.log('☁️ 클라우드 동기화 시작');

        try {
            const firebaseLogs = await this.loadFromFirebase(year);

            if (firebaseLogs && firebaseLogs.length > 0) {
                const mergedLogs = this.smartMerge(localLogs, firebaseLogs);

                if (mergedLogs.length !== localLogs.length ||
                    this.hasChanges(localLogs, mergedLogs)) {

                    this.sampleLogs = mergedLogs;
                    localStorage.setItem(this.getStorageKey(year), JSON.stringify(mergedLogs));
                    this.log('✅ 클라우드 데이터 병합 완료');
                }
            }
        } finally {
            this.isCloudSyncing = false;
        }
    }

    /**
     * Firebase에서 데이터 로드
     * @param {string} year - 연도
     */
    async loadFromFirebase(year) {
        try {
            return await window.firestoreDb.loadAll(this.moduleKey, parseInt(year));
        } catch (error) {
            (window.logger?.error || console.error)('Firebase 로드 실패:', error);
            return null;
        }
    }

    /**
     * 스마트 병합 - utils.js의 함수 사용
     */
    smartMerge(localData, firebaseData) {
        if (window.smartMerge) {
            return window.smartMerge(localData, firebaseData);
        }
        // 폴백: Firebase 데이터 우선
        return firebaseData;
    }

    /**
     * 데이터 변경 감지
     */
    hasChanges(data1, data2) {
        return JSON.stringify(data1) !== JSON.stringify(data2);
    }

    // ========================================
    // 자동 저장
    // ========================================

    /**
     * 자동 저장 초기화
     */
    async initAutoSave() {
        if (!this.FileAPI || !window.isElectron) {
            return;
        }

        // SampleUtils가 있으면 사용
        if (window.SampleUtils?.initAutoSave) {
            await window.SampleUtils.initAutoSave({
                moduleKey: this.moduleKey,
                moduleName: this.moduleName,
                FileAPI: this.FileAPI,
                currentYear: this.selectedYear,
                log: (...args) => this.log(...args),
                showToast: window.showToast
            });

            // 자동 저장 파일에서 데이터 로드하는 함수
            window.loadFromAutoSaveFile = async () => {
                return await window.SampleUtils.loadFromAutoSaveFile(this.FileAPI, (...args) => this.log(...args));
            };
        } else {
            // 폴백: 기본 자동 저장 처리
            try {
                const savedData = await this.FileAPI.loadAutoSave();
                if (savedData) {
                    this.lastSavedDataHash = this.hashData(savedData);
                }
            } catch (error) {
                this.log('자동 저장 데이터 로드 실패:', error);
            }
        }
    }

    /**
     * 자동 저장 트리거
     */
    triggerAutoSave() {
        if (!this.FileAPI || !window.isElectron) {
            return;
        }

        // 기존 타이머 클리어
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        // 3초 후 저장
        this.autoSaveTimer = setTimeout(() => {
            this.performAutoSave();
        }, 3000);
    }

    /**
     * 자동 저장 수행
     */
    async performAutoSave() {
        try {
            const currentDataHash = this.hashData(this.sampleLogs);

            // 데이터가 변경된 경우만 저장
            if (currentDataHash !== this.lastSavedDataHash) {
                const content = JSON.stringify(this.sampleLogs, null, 2);
                const result = await this.FileAPI.saveAutoSave(content);

                if (result) {
                    this.lastSavedDataHash = currentDataHash;
                    this.log('✅ 자동 저장 완료');
                }
            }
        } catch (error) {
            this.log('자동 저장 실패:', error);
        }
    }

    /**
     * 데이터 해시 생성
     */
    hashData(data) {
        return JSON.stringify(data).length.toString();
    }

    // ========================================
    // UI 관리
    // ========================================

    /**
     * UI 초기화
     */
    initUI() {
        // DOM 요소 캐싱
        this.cacheElements();

        // 뷰 초기화
        this.initViews();

        // 페이지네이션 초기화
        this.initPagination();
    }

    /**
     * DOM 요소 캐싱
     */
    cacheElements() {
        this.form = document.getElementById('sampleForm');
        this.tableBody = document.getElementById('sampleTableBody');
        this.emptyState = document.querySelector('.empty-state');
        this.recordCountEl = document.getElementById('recordCount');
    }

    /**
     * 뷰 전환
     * @param {string} viewName - 뷰 이름
     */
    switchView(viewName) {
        const views = document.querySelectorAll('.view');
        const navItems = document.querySelectorAll('.nav-btn');

        views.forEach(view => view.classList.remove('active'));
        navItems.forEach(nav => nav.classList.remove('active'));

        const targetView = document.getElementById(`${viewName}View`);
        const targetNav = document.querySelector(`.nav-btn[data-view="${viewName}"]`);

        if (targetView) targetView.classList.add('active');
        if (targetNav) targetNav.classList.add('active');

        // 목록 뷰로 전환 시 테이블 새로고침
        if (viewName === 'list') {
            this.renderLogs(this.sampleLogs);
        }
    }

    /**
     * 레코드 수 업데이트
     */
    updateRecordCount() {
        if (this.recordCountEl) {
            this.recordCountEl.textContent = `총 ${this.sampleLogs.length}건`;
        }
    }

    /**
     * 토스트 메시지 표시
     */
    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        }
    }

    // ========================================
    // 이벤트 리스너
    // ========================================

    /**
     * 이벤트 리스너 설정
     */
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

    /**
     * 네비게이션 이벤트 설정
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-btn');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const viewName = item.dataset.view;
                this.switchView(viewName);
            });
        });
    }

    /**
     * 폼 이벤트 설정
     */
    setupFormEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitForm();
            });

            // 취소 버튼
            const cancelBtn = document.getElementById('cancelBtn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.resetForm();
                    this.editingId = null;
                    this.switchView('register');
                });
            }
        }
    }

    /**
     * 연도 선택 이벤트 설정
     */
    setupYearSelection() {
        const yearSelect = document.getElementById('yearSelect');
        const listYearSelect = document.getElementById('listYearSelect');

        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.syncYearSelects(e.target.value);
                this.loadYearData(e.target.value);
            });
        }

        if (listYearSelect) {
            listYearSelect.addEventListener('change', (e) => {
                this.syncYearSelects(e.target.value);
                this.loadYearData(e.target.value);
            });
        }
    }

    /**
     * 전화번호 포맷팅 설정
     */
    setupPhoneFormatting() {
        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput && window.formatPhoneNumber) {
            phoneInput.addEventListener('input', (e) => {
                e.target.value = window.formatPhoneNumber(e.target.value);
            });
        }
    }

    /**
     * 수령 방법 버튼 설정
     */
    setupReceptionMethod() {
        const methodBtns = document.querySelectorAll('.method-btn');
        const methodInput = document.getElementById('receptionMethod');

        methodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                methodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (methodInput) {
                    methodInput.value = btn.dataset.value;
                }
            });
        });
    }

    // ========================================
    // 유틸리티 메서드
    // ========================================

    /**
     * 고유 ID 생성
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 디버그 로그
     */
    log(...args) {
        if (this.debug) {
            console.log(`[${this.moduleName}]`, ...args);
        }
    }

    // ========================================
    // 추상 메서드 (서브클래스에서 구현 필요)
    // ========================================

    /**
     * 로그 렌더링 (테이블 그리기)
     * @abstract
     */
    renderLogs(logs) {
        throw new Error('renderLogs must be implemented by subclass');
    }

    /**
     * 폼 제출 처리
     * @abstract
     */
    submitForm() {
        throw new Error('submitForm must be implemented by subclass');
    }

    /**
     * 샘플 편집
     * @abstract
     */
    editSample(id) {
        throw new Error('editSample must be implemented by subclass');
    }

    /**
     * 폼 초기화
     * @abstract
     */
    resetForm() {
        throw new Error('resetForm must be implemented by subclass');
    }

    // ========================================
    // Hook 메서드 (선택적 오버라이드)
    // ========================================

    /**
     * 뷰 초기화 시 호출
     */
    initViews() {
        // 서브클래스에서 오버라이드 가능
    }

    /**
     * 페이지네이션 초기화
     */
    initPagination() {
        // 서브클래스에서 오버라이드 가능
    }

    /**
     * 연도 변경 시 호출
     */
    onYearChange(newYear) {
        // 서브클래스에서 오버라이드 가능
    }

    /**
     * 데이터 저장 전 처리
     */
    onBeforeSave(data) {
        return data;
    }

    /**
     * 데이터 저장 후 처리
     */
    onAfterSave(data) {
        // 서브클래스에서 오버라이드 가능
    }
}

// 전역으로 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseSampleManager;
} else {
    window.BaseSampleManager = BaseSampleManager;
}