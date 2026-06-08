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
        this.sampleType = config.sampleType || config.moduleName;
        this.autoSaveFile = config.autoSaveFile || `${config.moduleKey}-autosave.json`;
        this.debug = config.debug || false;

        // 상태
        this.sampleLogs = [];
        this.selectedYear = new Date().getFullYear().toString();
        this.editingId = null;
        // 검색 필터 상태 (서브클래스가 자체 기본값으로 덮어쓸 수 있음)
        this.currentSearchFilter = {
            dateFrom: '', dateTo: '', name: '',
            receptionFrom: '', receptionTo: '', completed: ''
        };
        this.currentPage = 1;
        this.itemsPerPage = 100;
        this.totalPages = 1;
        this.isCloudSyncing = false;
        this._cloudSyncFailed = false;       // L2: 클라우드 동기화 실패 상태 (중복 토스트 방지)
        this._retryCloudSyncHandler = null;  // L2: online 복귀 재시도 리스너 참조
        this.cloudSyncPromise = null;  // Promise-based lock
        this.listViewStale = true;  // PER-5: 목록 뷰 리렌더 필요 여부
        this._firebaseCache = new Map();  // PER-9: 연도별 Firebase 데이터 캐시 { data, timestamp }
        this._firebaseCacheTTL = 30000;   // PER-9: 캐시 유효 시간 (30초)
        this._firebaseCacheMax = 5;       // 메모리 누수 방지: 캐시 보관 연도 상한
        this._hashChangeHandler = null;   // destroy()에서 해제하기 위한 핸들러 참조

        // PaginationManager 인스턴스
        this.pagination = null;

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
            this.log('초기화 시작');

            // FileAPI 초기화
            if (this.FileAPI) {
                await this.FileAPI.init(this.getCurrentYear());
            }

            // Firebase + AutoSave 병렬 초기화
            await Promise.all([
                this.initFirebase(),
                this.initAutoSave()
            ]);

            // UI 초기화 (DOM 요소 캐싱)
            this.initUI();

            // 데이터가 있는 연도 찾기
            this.selectedYear = this.findYearWithData();
            this.syncYearSelects(this.selectedYear);
            this.log('선택된 연도:', this.selectedYear);

            // 선택된 연도의 데이터 로드
            await this.loadYearData(this.selectedYear);

            // 이벤트 리스너 설정
            this.setupEventListeners();

            // 타입별 추가 이벤트 (서브클래스 hook)
            this.setupTypeSpecificEvents();

            // hash 기반 뷰 전환
            this.handleHashChange();
            this._hashChangeHandler = () => this.handleHashChange();
            window.addEventListener('hashchange', this._hashChangeHandler);

            this.log('초기화 완료');
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
                    this.log('JSON 파싱 오류 (무시됨):', key, e.message);
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
     * localStorage에서 JSON 배열을 안전하게 읽기 (M5: 3벌 중복 제거)
     * @param {string} key - localStorage 키
     * @returns {Array}
     */
    safeParseArray(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    /**
     * 데이터 저장
     */
    async saveLogs() {
        this.listViewStale = true;  // PER-5: 데이터 변경 시 목록 리렌더 필요
        this._firebaseCache.delete(this.selectedYear);  // PER-9: 캐시 무효화
        // 저장 전 hook (서브클래스에서 데이터 가공)
        const processed = this.onBeforeSave(this.sampleLogs);
        if (processed) this.sampleLogs = processed;

        const yearStorageKey = this.getStorageKey(this.selectedYear);

        // ID 생성 (없는 경우)
        this.sampleLogs = this.sampleLogs.map(item => ({
            ...item,
            id: item.id || this.generateId()
        }));

        // 로컬 저장 먼저 (UI 블로킹 방지)
        try {
            localStorage.setItem(yearStorageKey, JSON.stringify(this.sampleLogs));
            this.log('💾 로컬 저장 완료:', this.sampleLogs.length, '건');
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                (window.logger?.warn || console.warn)('localStorage 용량 초과:', e);
                this.showToast('저장 공간이 부족합니다. 오래된 연도의 데이터를 정리해 주세요.', 'error');
                return;
            }
            throw e;
        }

        // Firebase 백그라운드 동기화 (UI 비블로킹 — 실패 시 토스트 + online 재시도)
        // 주의: batchSave는 실패 시 throw가 아닌 false 반환 → 반환값 검사 필수
        // 빈 배열은 batchSave가 false를 반환하므로 호출 생략
        if (window.firestoreDb?.isEnabled() && this.sampleLogs.length > 0) {
            window.firestoreDb.batchSave(this.moduleKey, parseInt(this.selectedYear, 10), this.sampleLogs)
                .then(ok => {
                    if (ok) {
                        this._clearCloudSyncFailure();
                        this.log('Firebase 동기화 완료:', this.sampleLogs.length, '건');
                    } else {
                        this._handleCloudSyncFailure();
                    }
                })
                .catch(err => {
                    (window.logger?.error || console.error)('Firebase 동기화 실패:', err);
                    this._handleCloudSyncFailure();
                });
        }

        // 자동 저장 트리거
        this.triggerAutoSave();

        // 레코드 수 업데이트
        this.updateRecordCount();

        // 저장 후 hook
        this.onAfterSave(this.sampleLogs);
    }

    /**
     * 샘플 삭제 - Firebase 우선
     * @param {string} id - 삭제할 샘플 ID
     */
    async deleteSample(id) {
        this.listViewStale = true;  // PER-5
        this._firebaseCache.delete(this.selectedYear);  // PER-9: 캐시 무효화

        // 로컬 삭제 먼저 (UI 블로킹 방지)
        this.sampleLogs = this.sampleLogs.filter(l => String(l.id) !== String(id));
        await this.saveLogs();
        this.filterAndRenderLogs();
        this.showToast('삭제되었습니다.', 'success');

        // Firebase 삭제 (백그라운드 — 실패 시 다음 병합에서 항목이 부활할 수 있으므로 사용자에게 알림)
        if (window.firestoreDb?.isEnabled()) {
            window.firestoreDb.delete(this.moduleKey, parseInt(this.selectedYear, 10), String(id))
                .then(ok => {
                    if (ok) this.log('Firebase 삭제 완료:', id);
                    else this._handleCloudSyncFailure();
                })
                .catch(err => {
                    (window.logger?.error || console.error)('Firebase 삭제 실패:', err);
                    this._handleCloudSyncFailure();
                });
        }
    }

    /**
     * L2: 클라우드 동기화 실패 처리 — 사용자 알림 + 온라인 복귀 시 1회 자동 재시도
     * batchSave/delete는 실패 시 false를 반환하므로 호출부에서 이 메서드를 호출한다.
     */
    _handleCloudSyncFailure() {
        if (this._cloudSyncFailed) return;  // 이미 알림/재시도 대기 중이면 중복 방지
        this._cloudSyncFailed = true;
        this.showToast(
            '클라우드 동기화 실패 — 데이터는 이 컴퓨터에 저장되어 있습니다. 온라인 연결 시 자동 재시도합니다.',
            'error'
        );
        if (!this._retryCloudSyncHandler) {
            this._retryCloudSyncHandler = () => {
                this._retryCloudSyncHandler = null;
                this._cloudSyncFailed = false;
                this.log('🔁 온라인 복귀 — 클라우드 동기화 재시도');
                this._retryCloudSyncAction();
            };
            window.addEventListener('online', this._retryCloudSyncHandler, { once: true });
        }
    }

    /**
     * L2: online 복귀 시 실행할 재시도 동작 — 서브클래스 오버라이드 지점
     * (기본: saveLogs가 전체 batchSave를 수행. soil처럼 saveLogs가 로컬 전용인
     *  서브클래스는 클라우드 동기화 메서드로 오버라이드할 것)
     */
    _retryCloudSyncAction() {
        this.saveLogs();
    }

    /**
     * L2: 동기화 성공 시 실패 상태 해제 — 플래그 리셋 + 대기 중 재시도 리스너 정리
     */
    _clearCloudSyncFailure() {
        this._cloudSyncFailed = false;
        if (this._retryCloudSyncHandler) {
            window.removeEventListener('online', this._retryCloudSyncHandler);
            this._retryCloudSyncHandler = null;
        }
    }

    /**
     * 년도별 데이터 로드
     * @param {string} year - 연도
     */
    async loadYearData(year) {
        this.listViewStale = true;  // PER-5
        this.log(`📅 ${year}년 데이터 로드 시작`);

        try {
            const yearStorageKey = this.getStorageKey(year);
            this.log(` loadYearData - storageKey:`, yearStorageKey);

            // Firebase가 활성화되어 있으면 Firebase에서 먼저 데이터 로드
            if (window.firebaseConfig?.isEnabled()) {
                try {
                    // PER-9: TTL 기반 Firebase 캐시 확인
                    const cacheEntry = this._firebaseCache.get(year);
                    const cacheValid = cacheEntry && (Date.now() - cacheEntry.timestamp < this._firebaseCacheTTL);
                    this.log(cacheValid ? ` Firebase 캐시 사용 (${year}년)` : ` Firebase에서 데이터 로드 시작`);
                    const firebaseLogs = cacheValid ? cacheEntry.data : await this.loadFromFirebase(year);

                    if (firebaseLogs && firebaseLogs.length > 0) {
                        this.log(` Firebase 데이터:`, firebaseLogs.length, '건');

                        // L2-P0: 무병합 덮어쓰기 금지 — 미업로드 로컬 항목(syncedAt 없음) 보존
                        const localLogs = this.safeParseArray(yearStorageKey);
                        const merged = window.SyncUtils?.mergeCloudData
                            ? window.SyncUtils.mergeCloudData(localLogs, firebaseLogs)
                            : { data: this.smartMerge(localLogs, firebaseLogs), localOnly: [] };
                        this.sampleLogs = merged.data;

                        // PER-9: TTL 포함 캐시 저장 (Firebase 원본 응답 기준 — 병합 결과 아님)
                        if (!cacheValid) {
                            // 메모리 누수 방지: 상한 초과 시 가장 오래된 항목 제거(LRU 근사)
                            if (this._firebaseCache.size >= this._firebaseCacheMax && !this._firebaseCache.has(year)) {
                                this._firebaseCache.delete(this._firebaseCache.keys().next().value);
                            }
                            this._firebaseCache.set(year, { data: JSON.parse(JSON.stringify(firebaseLogs)), timestamp: Date.now() });
                        }

                        // 병합 결과를 localStorage에 저장
                        localStorage.setItem(yearStorageKey, JSON.stringify(merged.data));
                        this.log(` Firebase 데이터를 localStorage에 캐싱 (로컬 전용 ${merged.localOnly.length}건 보존)`);

                        // 보존된 로컬 전용 항목을 클라우드로 재업로드 (전체가 아닌 localOnly만 —
                        // 전체 재업로드 시 모든 문서의 updatedAt이 갱신되어 타 기기 병합을 교란함)
                        if (merged.localOnly.length > 0 && window.firestoreDb?.isEnabled()) {
                            window.firestoreDb.batchSave(this.moduleKey, parseInt(year, 10), merged.localOnly)
                                .then(ok => {
                                    if (ok) {
                                        this.log(`☁️ 로컬 전용 ${merged.localOnly.length}건 클라우드 업로드 완료`);
                                        // M-1: 캐시 무효화 — TTL 창 내 stale 캐시로 인한 반복 재업로드 방지
                                        this._firebaseCache.delete(year);
                                    } else {
                                        this._handleCloudSyncFailure();
                                    }
                                })
                                .catch(() => this._handleCloudSyncFailure());
                        }
                    } else {
                        this.log(` Firebase에 데이터 없음, localStorage 확인`);
                        // Firebase에 데이터가 없으면 localStorage 확인
                        this.sampleLogs = this.safeParseArray(yearStorageKey);
                    }
                } catch (error) {
                    (window.logger?.error || console.error)('Firebase 로드 실패:', error);
                    // Firebase 로드 실패 시 localStorage 폴백
                    this.sampleLogs = this.safeParseArray(yearStorageKey);
                }
            } else {
                this.log(` Firebase 비활성화, localStorage에서 로드`);
                // Firebase가 비활성화되어 있으면 localStorage에서 로드
                this.sampleLogs = this.safeParseArray(yearStorageKey);
            }

            this.log(` 최종 sampleLogs 설정:`, this.sampleLogs.length, '건');
            // 공통 마이그레이션 적용
            this.sampleLogs = this.migrateCompletedField(this.sampleLogs);

            // 추가 마이그레이션 (서브클래스 hook)
            const migrations = this.getAdditionalMigrations();
            for (const migrate of migrations) {
                const result = migrate(this.sampleLogs);
                if (result) this.sampleLogs = result;
            }

            // 후처리 hook (예: water의 smartMerge)
            const processed = this.onAfterLoad(this.sampleLogs, year);
            if (processed) this.sampleLogs = processed;

            // UI 업데이트 (기본 필터 적용)
            this.filterAndRenderLogs();
            this.updateRecordCount();

            // 다음 접수번호 설정 (서브클래스에서 구현된 경우)
            if (typeof this.generateNextReceptionNumber === 'function') {
                const nextNumber = this.generateNextReceptionNumber();
                const receptionNumberInput = document.getElementById('receptionNumber');
                if (receptionNumberInput && nextNumber) {
                    receptionNumberInput.value = nextNumber;
                    receptionNumberInput.dataset.baseNumber = nextNumber;
                }
            }

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
        if (!window.firebaseConfig?.isEnabled()) {
            return;
        }

        // Promise-based lock: 이미 동기화 중이면 기존 작업 완료 대기
        if (this.cloudSyncPromise) {
            this.log('⏳ 기존 동기화 작업 대기 중...');
            await this.cloudSyncPromise;
            return;
        }

        this.cloudSyncPromise = (async () => {
            this.isCloudSyncing = true;
            this.log('☁️ 클라우드 동기화 시작');

            try {
                const firebaseLogs = await this.loadFromFirebase(year);

                if (firebaseLogs && firebaseLogs.length > 0) {
                    // Firebase fetch 중 saveLogs()가 this.sampleLogs를 변경했을 수 있으므로
                    // 스냅샷(localLogs) 대신 현재 this.sampleLogs를 로컬 기준으로 사용
                    const currentLogs = this.sampleLogs;
                    const mergedLogs = this.smartMerge(currentLogs, firebaseLogs);

                    if (mergedLogs.length !== currentLogs.length ||
                        this.hasChanges(currentLogs, mergedLogs)) {

                        this.sampleLogs = mergedLogs;
                        try {
                            localStorage.setItem(this.getStorageKey(year), JSON.stringify(mergedLogs));
                        } catch (e) {
                            if (e.name === 'QuotaExceededError' || e.code === 22) {
                                (window.logger?.warn || console.warn)('동기화 중 localStorage 용량 초과:', e);
                                this.sampleLogs = currentLogs;
                                return;
                            }
                            throw e;
                        }
                        this.log('✅ 클라우드 데이터 병합 완료');
                    }
                }
            } finally {
                this.isCloudSyncing = false;
                this.cloudSyncPromise = null;
            }
        })();

        await this.cloudSyncPromise;
    }

    /**
     * Firebase에서 데이터 로드
     * @param {string} year - 연도
     */
    async loadFromFirebase(year) {
        try {
            this.log(` Firebase getAll 호출 - moduleKey: ${this.moduleKey}, year: ${year}`);
            this.log(` Firebase 상태:`, {
                isEnabled: window.firestoreDb?.isEnabled ? window.firestoreDb.isEnabled() : 'isEnabled 메서드 없음',
                getAll: typeof window.firestoreDb?.getAll,
                firestoreDb: !!window.firestoreDb
            });

            const data = await window.firestoreDb.getAll(this.moduleKey, parseInt(year, 10));
            this.log(` Firebase 응답:`, data ? `${data.length}건` : 'null/undefined');
            this.log(` Firebase 데이터 샘플:`, data && data.length > 0 ? data[0] : 'No data');
            return data || [];
        } catch (error) {
            console.error(`[${this.moduleName}] Firebase 로드 오류 상세:`, error);
            (window.logger?.error || console.error)('Firebase 로드 실패:', error);
            return [];
        }
    }

    /**
     * 스마트 병합 - utils.js의 함수 사용
     */
    smartMerge(localData, firebaseData) {
        if (window.SyncUtils?.smartMerge) {
            // SyncUtils.smartMerge는 { data, hasChanges, ... } 객체를 반환하므로
            // 배열 계약을 유지하기 위해 data를 언래핑한다 (객체를 그대로 쓰면 데이터 손상)
            const result = window.SyncUtils.smartMerge(localData, firebaseData);
            return Array.isArray(result) ? result : (result?.data || []);
        }
        // 폴백: id 기준 union merge (로컬 우선 — Firebase만 반환하면 로컬 변경 유실)
        const map = new Map();
        const noId = [];
        [...(firebaseData || []), ...(localData || [])].forEach(item => {
            if (item?.id) map.set(String(item.id), item);
            else if (item) noId.push(item);
        });
        return [...Array.from(map.values()), ...noId];
    }

    /**
     * 데이터 변경 감지 (최적화: 배열의 경우 id/updatedAt만 비교)
     */
    hasChanges(data1, data2) {
        if (!Array.isArray(data1) || !Array.isArray(data2)) {
            return JSON.stringify(data1) !== JSON.stringify(data2);
        }
        if (data1.length !== data2.length) return true;
        for (let i = 0; i < data1.length; i++) {
            if (data1[i].id !== data2[i].id) return true;
            if (data1[i].updatedAt !== data2[i].updatedAt) return true;
        }
        return false;
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
            // 자동 저장 활성화 여부 확인
            const enabledKey = `${this.moduleKey}AutoSaveEnabled`;
            if (localStorage.getItem(enabledKey) !== 'true') return;

            const currentDataHash = this.hashData(this.sampleLogs);

            // 데이터가 변경된 경우만 저장
            if (currentDataHash !== this.lastSavedDataHash) {
                const content = JSON.stringify({
                    version: '2.0',
                    exportDate: new Date().toISOString(),
                    totalRecords: this.sampleLogs.length,
                    data: this.sampleLogs
                }, null, 2);
                const result = await this.FileAPI.autoSave(content);

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
        const str = JSON.stringify(data);
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
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

        // 이벤트 위임 설정
        this.setupTableEventDelegation();
    }

    /**
     * 테이블 이벤트 위임 설정 (메모리 효율적인 이벤트 처리)
     */
    setupTableEventDelegation() {
        if (!this.tableBody || !window.EventDelegator) return;

        this.tableDelegator = new window.EventDelegator(this.tableBody);

        // 수정 버튼
        this.tableDelegator.on('click', '.btn-edit', (e, target) => {
            const id = target.dataset.id;
            if (id) this.editSample(id);
        });

        // 삭제 버튼
        this.tableDelegator.on('click', '.btn-delete', (e, target) => {
            const id = target.dataset.id;
            if (id && confirm('이 항목을 삭제하시겠습니까?')) {
                this.deleteSample(id);
            }
        });

        // 완료 토글 버튼
        this.tableDelegator.on('click', '.btn-complete', (e, target) => {
            const id = target.dataset.id;
            if (id && typeof this.toggleComplete === 'function') {
                this.toggleComplete(id);
            }
        });

        // 판정 토글 버튼
        this.tableDelegator.on('click', '.btn-result', (e, target) => {
            const id = target.dataset.id;
            if (id && typeof this.toggleResult === 'function') {
                this.toggleResult(id);
            }
        });

        // 접수번호 클릭 (편집)
        this.tableDelegator.on('click', '.btn-link.edit-btn', (e, target) => {
            e.preventDefault();
            const row = target.closest('tr');
            const editBtn = row?.querySelector('.btn-edit');
            const id = editBtn?.dataset.id;
            if (id) this.editSample(id);
        });
    }

    /**
     * 리소스 정리 (메모리 누수 방지)
     */
    destroy() {
        // 이벤트 위임 정리
        if (this.tableDelegator) {
            this.tableDelegator.destroy();
            this.tableDelegator = null;
        }

        // 자동 저장 타이머 정리
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }

        // hashchange 리스너 해제 (익명 핸들러 누수 방지)
        if (this._hashChangeHandler) {
            window.removeEventListener('hashchange', this._hashChangeHandler);
            this._hashChangeHandler = null;
        }

        // Firebase 캐시/페이지네이션/싱크 프로미스 정리
        this._firebaseCache.clear();
        this.pagination = null;
        this.cloudSyncPromise = null;

        // 참조 정리
        this.form = null;
        this.tableBody = null;
        this.emptyState = null;
        this.recordCountEl = null;
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

        // 목록 뷰로 전환 시 변경된 경우에만 테이블 새로고침 (PER-5)
        if (viewName === 'list' && this.listViewStale) {
            this.filterAndRenderLogs();
            this.listViewStale = false;
        }
    }

    /**
     * 레코드 수 업데이트
     */
    updateRecordCount() {
        if (!this.recordCountEl) return;
        const total = this.sampleLogs.length;
        const incomplete = this.sampleLogs.filter(log => !log.isComplete).length;
        if (incomplete > 0) {
            this.recordCountEl.textContent = `${total}건 (미완료 ${incomplete}건)`;
        } else {
            this.recordCountEl.textContent = `총 ${total}건`;
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
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return (typeof SampleUtils !== 'undefined' && SampleUtils.generateUUID) ? SampleUtils.generateUUID() : crypto.randomUUID();
    }

    /**
     * 디버그 로그
     */
    log(...args) {
        if (this.debug) {
            (window.logger?.debug || console.log)(`[${this.moduleName}]`, ...args);
        }
    }

    /**
     * 레거시 address 문자열을 주소 입력 필드(addressPostcode/addressRoad)에 반영
     * addressRoad가 이미 있으면 건드리지 않음 (6곳 중복 코드의 공통 계약)
     * @param {Object} log - 시료 레코드
     */
    applyLegacyAddress(log) {
        if (log.addressRoad || !log.address) return;
        const { postcode, road } = window.SampleUtils.splitLegacyAddress(log.address);
        const postcodeEl = this.addressPostcode || document.getElementById('addressPostcode');
        const roadEl = this.addressRoad || document.getElementById('addressRoad');
        if (postcode && postcodeEl) postcodeEl.value = postcodeEl.value || postcode;
        if (roadEl) roadEl.value = road;
    }

    // ========================================
    // 추상 메서드 (서브클래스에서 구현 필요)
    // ========================================

    /**
     * 필터를 적용한 렌더링 — 공통 4조건(성명/접수번호 범위/날짜 범위/완료 상태)
     * + 타입 고유 필터 훅(matchesTypeSpecificFilters)
     */
    filterAndRenderLogs() {
        const filtered = this.sampleLogs.filter(log =>
            this.matchesNameFilter(log) &&
            this.matchesReceptionFilter(log) &&
            this.matchesDateFilter(log) &&
            this.matchesCompletedFilter(log) &&
            this.matchesTypeSpecificFilters(log)
        );
        this.renderLogs(filtered);
        this.updateSearchButtonState();
    }

    /** 성명 검색 필터 */
    matchesNameFilter(log) {
        return !this.currentSearchFilter.name ||
            (log.name || '').toLowerCase().includes(this.currentSearchFilter.name);
    }

    /** 접수번호 범위 필터 */
    matchesReceptionFilter(log) {
        if (!this.currentSearchFilter.receptionFrom && !this.currentSearchFilter.receptionTo) return true;
        const logNum = this.extractReceptionNumber(log.receptionNumber || '');
        const fromNum = this.currentSearchFilter.receptionFrom ? parseInt(this.currentSearchFilter.receptionFrom, 10) : 0;
        const toNum = this.currentSearchFilter.receptionTo ? parseInt(this.currentSearchFilter.receptionTo, 10) : Infinity;
        if (fromNum && logNum < fromNum) return false;
        if (toNum !== Infinity && logNum > toNum) return false;
        return true;
    }

    /** 날짜 범위 필터 */
    matchesDateFilter(log) {
        if (!this.currentSearchFilter.dateFrom && !this.currentSearchFilter.dateTo) return true;
        const logDate = log.date;
        if (this.currentSearchFilter.dateFrom && logDate < this.currentSearchFilter.dateFrom) return false;
        if (this.currentSearchFilter.dateTo && logDate > this.currentSearchFilter.dateTo) return false;
        return true;
    }

    /** 완료 상태 필터 */
    matchesCompletedFilter(log) {
        if (this.currentSearchFilter.completed === 'completed') return log.isComplete === true;
        if (this.currentSearchFilter.completed === 'incomplete') return !log.isComplete;
        return true;
    }

    /** 타입 고유 필터 훅 — soil이 필지(lot)/목적(purpose) 조건으로 오버라이드 */
    matchesTypeSpecificFilters(log) {
        return true;
    }

    /**
     * 접수번호 문자열 끝의 숫자 추출 (필터 비교용)
     * @param {string} receptionNumber
     * @returns {number}
     */
    extractReceptionNumber(receptionNumber) {
        const match = (receptionNumber || '').match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
    }

    /**
     * 검색 버튼 상태 갱신 — 활성 필터 존재 시 has-filter 표시
     * 검사할 필터 키 목록은 getFilterKeys() 훅으로 결정 (soil: lot/purpose 추가)
     */
    updateSearchButtonState() {
        const f = this.currentSearchFilter;
        const hasFilter = this.getFilterKeys().some(key => f[key]) ||
            (f.completed && f.completed !== 'incomplete');
        const openSearchModalBtn = document.getElementById('openSearchModalBtn');
        if (openSearchModalBtn) {
            if (hasFilter) {
                openSearchModalBtn.classList.add('has-filter');
                openSearchModalBtn.innerHTML = window.sanitizeHTML('🔍 검색 중');
            } else {
                openSearchModalBtn.classList.remove('has-filter');
                openSearchModalBtn.innerHTML = window.sanitizeHTML('🔍 검색');
            }
        }
    }

    /** 검색 버튼 상태 판정에 쓰는 필터 키 목록 훅 (completed는 별도 판정) */
    getFilterKeys() {
        return ['dateFrom', 'dateTo', 'name', 'receptionFrom', 'receptionTo'];
    }

    /**
     * 로그 렌더링 (테이블 그리기)
     * @abstract
     */
    renderLogs(logs) {
        // 서브클래스의 prepareDataForRender hook (soil/pesticide: flattenLogsForTable)
        const preparedData = this.prepareDataForRender(logs);

        if (this.pagination) {
            this.pagination.setData(preparedData);
        } else {
            // PaginationManager 없이 직접 렌더링 (폴백)
            if (this.tableBody) {
                this.tableBody.innerHTML = '';
                preparedData.forEach((item, index) => {
                    const row = this.buildTableRow(item, index);
                    if (row) this.tableBody.appendChild(row);
                });
            }
        }
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

    /**
     * 테이블 행 빌드 (PaginationManager에서 호출)
     * @abstract
     * @param {Object} item - 데이터 항목
     * @param {number} index - 인덱스
     * @returns {HTMLElement} tr 요소
     */
    buildTableRow(item, index) {
        // 서브클래스에서 구현 필요
        // PaginationManager 미사용 시에는 구현하지 않아도 됨
        return null;
    }

    /**
     * 렌더 전 데이터 가공 — 기본: 접수번호 숫자 오름차순 정렬
     * (soil/pesticide는 flattenLogsForTable 오버라이드 유지)
     * @param {Array} logs - 원본 데이터
     * @returns {Array} 가공된 데이터
     */
    prepareDataForRender(logs) {
        return [...logs].sort((a, b) =>
            (parseInt(a.receptionNumber, 10) || 0) - (parseInt(b.receptionNumber, 10) || 0));
    }

    /**
     * 추가 마이그레이션 함수 목록 (pesticide: migrateProducerAddress 등)
     * @returns {Array<Function>} 마이그레이션 함수 배열
     */
    getAdditionalMigrations() {
        return [];
    }

    /**
     * 레거시 완료 필드 마이그레이션: completed/isCompleted → isComplete 통합
     * (구 Base의 completed 체계는 5개 타입 전부가 폐기 — isComplete가 현행)
     * @param {Array} logs - 데이터
     * @returns {Array} 마이그레이션된 데이터
     */
    migrateCompletedField(logs) {
        if (!Array.isArray(logs)) return logs;
        return logs.map(log => {
            const migrated = { ...log };
            if (migrated.isComplete === undefined) {
                if (migrated.completed !== undefined) migrated.isComplete = !!migrated.completed;
                else if (migrated.isCompleted !== undefined) migrated.isComplete = !!migrated.isCompleted;
                else migrated.isComplete = false;
            }
            delete migrated.completed;
            delete migrated.isCompleted;
            return migrated;
        });
    }

    /**
     * hash 기반 뷰 전환
     */
    handleHashChange() {
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            this.switchView(hash);
        }
    }

    /**
     * 타입별 추가 이벤트 설정 (서브클래스에서 override)
     */
    setupTypeSpecificEvents() {
        // 서브클래스에서 오버라이드
    }

    /**
     * 페이지 변경 시 콜백 (서브클래스에서 override)
     */
    onPageChange(page, pageData) {
        // 서브클래스에서 오버라이드 가능
    }

    /**
     * 데이터 로드 후처리 hook
     */
    onAfterLoad(data, year) {
        return data;
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
        if (!window.PaginationManager) return;

        this.pagination = new window.PaginationManager({
            storageKey: `${this.moduleKey}ItemsPerPage`,
            defaultItemsPerPage: 100,
            onPageChange: (page, pageData) => {
                this.onPageChange(page, pageData);
            },
            renderRow: (item, index) => {
                return this.buildTableRow(item, index);
            }
        });

        this.pagination.setTableElements(
            this.tableBody,
            this.emptyState
        );
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

    // ========================================
    // 정적 유틸리티 메서드
    // ========================================

    /**
     * 등록 결과 테이블 빌드 (DOM 직접 조작으로 XSS 방지)
     * @param {HTMLElement} tableBody - tbody 요소
     * @param {Array<{label: string, value: string, isMultiline?: boolean}>} rows - 테이블 행 데이터
     */
    static buildResultTable(tableBody, rows) {
        if (!tableBody) return;

        tableBody.innerHTML = '';

        rows.forEach(({ label, value, isMultiline }) => {
            const tr = document.createElement('tr');
            const th = document.createElement('th');
            const td = document.createElement('td');

            th.textContent = label;

            if (isMultiline && value && value !== '-') {
                // 줄바꿈을 <br>로 변환 (의뢰물품명 등)
                const div = document.createElement('div');
                div.className = 'request-content';
                String(value).split('\n').forEach((line, idx, arr) => {
                    div.appendChild(document.createTextNode(line));
                    if (idx < arr.length - 1) {
                        div.appendChild(document.createElement('br'));
                    }
                });
                td.appendChild(div);
            } else {
                td.textContent = value || '-';
            }

            tr.appendChild(th);
            tr.appendChild(td);
            tableBody.appendChild(tr);
        });
    }
}

// 전역으로 내보내기 (Vite 번들 환경에서도 window에 노출)
window.BaseSampleManager = BaseSampleManager;