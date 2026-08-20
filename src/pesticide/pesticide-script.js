/**
 * @fileoverview 잔류농약 시료 전용 스크립트
 * PesticideSampleManager - BaseSampleManager 상속
 */

// ========================================
// 상수 및 설정
// ========================================

/** @type {string} */
const SAMPLE_TYPE = '잔류농약';

/** @type {string} */
const STORAGE_KEY = 'pesticideSampleLogs';

/** @type {string} */
const AUTO_SAVE_FILE = 'pesticide-autosave.json';

// 면적 단위 변환 상수
const PYEONG_TO_M2 = 3.305785;

// ========================================
// PesticideSampleManager 클래스
// ========================================

class PesticideSampleManager extends window.BaseSampleManager {
    constructor() {
        super({
            moduleKey: 'pesticide',
            moduleName: '잔류농약',
            storageKey: STORAGE_KEY,
            sampleType: SAMPLE_TYPE,
            autoSaveFile: AUTO_SAVE_FILE,
            debug: !!window.DEBUG
        });

        // Pesticide-specific state
        this.listViewStale = true;
        this.currentSearchFilter = {
            dateFrom: '',
            dateTo: '',
            name: '',
            receptionFrom: '',
            receptionTo: '',
            completed: 'incomplete'
        };
        this.isFullView = false;
        this.autoSaveFileHandle = null;
        this.currentRegistrationData = null;

        // Request items
        this.requestItemCounter = 1;

        // 그룹 묶음 수정용 (같은 접수로 만든 N개 행 추적)
        this.editingGroupIds = [];

        // Parcel system (legacy compat - pesticide doesn't use parcels actively)
        this.parcels = [];
        this.parcelIdCounter = 0;

        // Crop modal state
        this.currentParcelIdForCrop = null;
        this.tempCropAreas = [];
        this.currentSubLotParcelId = null;
        this.currentSubLotIndex = null;

        // Crop search modal state
        this.tempSelectedCrops = [];
        this.confirmedCrops = [];

        // Region selection
        this.currentRegionSelection = null;

        // Mail date
        this.pendingMailDateIds = [];

        // Pagination (pesticide uses its own pagination, NOT PaginationManager)
        this.currentFlatRows = [];

        // DOM refs (set in cacheElements)
        this.dateInput = null;
        this.applicantTypeSelect = null;
        this.birthDateField = null;
        this.corpNumberField = null;
        this.birthDateInput = null;
        this.corpNumberInput = null;
        this.receptionNumberInput = null;
        this.receptionMethodBtns = null;
        this.receptionMethodInput = null;
        this.navSubmitBtn = null;
        this.navResetBtn = null;
        this.selectAllCheckbox = null;
        this.paginationContainer = null;
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

        // Producer address
        this.producerAddressInput = null;
        this.producerAddressAutocomplete = null;

        // Request items container
        this.requestItemsList = null;

        // Registration result modal refs
        this.registrationResultModal = null;
        this.resultTableBody = null;

        // Parcels container
        this.parcelsContainer = null;

        // Crop area modal refs
        this.cropAreaModal = null;
        this.cropAreaList = null;

        // Area formatting from common module
        this.formatArea = window.SampleUtils?.formatArea || (v => v);
        this.getUnitLabel = window.SampleUtils?.getUnitLabel || (v => v);
        this.formatAreaWithUnit = window.SampleUtils?.formatAreaWithUnit || ((area, unit) => `${area} ${unit}`);

        // pesticide-specific FileAPI excel save
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

        // Override different IDs (pesticide uses logTableBody / emptyState getElementById)
        this.tableBody = document.getElementById('logTableBody');
        this.emptyState = document.getElementById('emptyState');

        // Date input
        this.dateInput = document.getElementById('date');

        // Applicant type
        this.applicantTypeSelect = document.getElementById('applicantType');
        this.birthDateField = document.getElementById('birthDateField');
        this.corpNumberField = document.getElementById('corpNumberField');
        this.birthDateInput = document.getElementById('birthDate');
        this.corpNumberInput = document.getElementById('corpNumber');

        // Reception
        this.receptionNumberInput = document.getElementById('receptionNumber');
        this.receptionMethodBtns = document.querySelectorAll('.reception-method-btn');
        this.receptionMethodInput = document.getElementById('receptionMethod');

        // Nav buttons
        this.navSubmitBtn = document.getElementById('navSubmitBtn');
        this.navResetBtn = document.getElementById('navResetBtn');
        this.selectAllCheckbox = document.getElementById('selectAll');

        // Pagination elements
        this.paginationContainer = document.getElementById('pagination');
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

        // Producer address
        this.producerAddressInput = document.getElementById('producerAddress');
        this.producerAddressAutocomplete = document.getElementById('producerAddressAutocomplete');

        // Request items
        this.requestItemsList = document.getElementById('requestItemsList');

        // Registration result modal
        this.registrationResultModal = document.getElementById('registrationResultModal');
        this.resultTableBody = document.getElementById('resultTableBody');

        // Parcels
        this.parcelsContainer = document.getElementById('parcelsContainer');

        // Crop area modal
        this.cropAreaModal = document.getElementById('cropAreaModal');
        this.cropAreaList = document.getElementById('cropAreaList');

        // Items per page init
        this.itemsPerPage = parseInt(localStorage.getItem('pesticideItemsPerPage'), 10) || 100;
        if (this.itemsPerPageSelect) {
            this.itemsPerPageSelect.value = this.itemsPerPage;
        }
    }

    // ========================================
    // Override: 연락처 자동 하이픈 포맷팅
    // (base의 window.formatPhoneNumber 의존을 SampleUtils 경로로 대체)
    // ========================================

    setupPhoneFormatting() {
        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput && window.SampleUtils?.setupPhoneNumberInput) {
            window.SampleUtils.setupPhoneNumberInput(phoneInput);
        }
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
    }

    // ========================================
    // Override: 페이지네이션 초기화 (PaginationManager 사용 안 함)
    // ========================================

    initPagination() {
        // pesticide는 자체 페이지네이션을 사용하므로 PaginationManager 초기화하지 않음
        // 대신 setupPaginationEvents에서 자체 이벤트를 설정
    }

    // ========================================
    // Override: 테이블 이벤트 위임 (자체 이벤트 핸들러 사용)
    // ========================================

    setupTableEventDelegation() {
        // pesticide는 setupTypeSpecificEvents에서 자체 이벤트 위임을 설정하므로
        // base class의 EventDelegator를 사용하지 않음
    }

    // ========================================
    // Override: 추가 마이그레이션
    // ========================================

    getAdditionalMigrations() {
        return [
            (logs) => {
                this.migrateProducerAddress(logs);
                return logs;
            }
        ];
    }

    // 생산지 주소 마이그레이션 (면+리만 있는 주소에 봉화군 추가)
    migrateProducerAddress(logs) {
        const bonghwaDistricts = ['봉화읍', '물야면', '봉성면', '법전면', '춘양면', '소천면', '재산면', '명호면', '상운면', '석포면'];
        const districtPattern = new RegExp(`^(${bonghwaDistricts.join('|')})\\s+`);

        let migrated = 0;
        logs.forEach(log => {
            if (log.producerAddress) {
                const addr = log.producerAddress.trim();
                if (addr.startsWith('봉화군') || addr.startsWith('영주시') || addr.startsWith('울진군') || addr.startsWith('경상북도')) {
                    return;
                }
                if (districtPattern.test(addr)) {
                    log.producerAddress = '봉화군 ' + addr;
                    migrated++;
                }
            }
        });
        if (migrated > 0) {
            this.log('📍 생산지 주소 마이그레이션:', migrated, '건');
        }
        return migrated;
    }

    // ========================================
    // Override: 렌더링 전 데이터 정렬 + 평탄화
    // ========================================

    prepareDataForRender(logs) {
        const sorted = [...logs].sort((a, b) => {
            const numA = parseInt(a.receptionNumber, 10) || 0;
            const numB = parseInt(b.receptionNumber, 10) || 0;
            return numA - numB;
        });
        return this.flattenLogsForTable(sorted);
    }

    // ========================================
    // Override: 뷰 전환 (listViewStale 지원)
    // ========================================

    switchView(viewName) {
        const views = document.querySelectorAll('.view');
        const navItems = document.querySelectorAll('.nav-btn');

        views.forEach(view => view.classList.remove('active'));
        navItems.forEach(nav => nav.classList.remove('active'));

        const targetView = document.getElementById(`${viewName}View`);
        const targetNav = document.querySelector(`.nav-btn[data-view="${viewName}"]`);

        if (targetView) targetView.classList.add('active');
        if (targetNav) targetNav.classList.add('active');

        if (viewName === 'list' && this.listViewStale) {
            this.filterAndRenderLogs();
            this.listViewStale = false;
        }
    }

    // ========================================
    // Override: 레코드 수 업데이트 (총 접두사 없음)
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
    // Override: 연도 변경 시 hook
    // ========================================

    onYearChange(newYear) {
        this.updateListViewTitle();
        // 연도 변경 시 분석결과 캐시 무효화 + Firestore 재동기화
        this._cachedPesticideResults = null;
        this.syncPesticideTestResultsFromFirestore();
    }

    // onBeforeSave: BaseSampleManager.saveLogs에서 listViewStale 설정하므로 별도 오버라이드 불필요

    // ========================================
    // Override: 저장 후 hook (자동 저장)
    // ========================================

    onAfterSave(data) {
        const autoSaveEnabled = localStorage.getItem('pesticideAutoSaveEnabled') === 'true';
        if (autoSaveEnabled && (window.isElectron ? this.FileAPI?.autoSavePath : this.autoSaveFileHandle)) {
            this.autoSaveToFile();
        }
        sessionStorage.setItem('lastSaveTime', new Date().toISOString());
    }

    // ========================================
    // Override: 수령 방법 버튼 설정 (pesticide uses .reception-method-btn with data-method)
    // ========================================

    setupReceptionMethod() {
        // pesticide uses .reception-method-btn with data-method, NOT .method-btn with data-value
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
    // 접수번호 자동 카운터
    // ========================================

    generateNextReceptionNumber() {
        let maxNumber = 0;
        this.sampleLogs.forEach(logItem => {
            if (logItem.receptionNumber) {
                const baseNumber = logItem.receptionNumber.split('-')[0];
                const num = parseInt(baseNumber, 10);
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            }
        });
        const nextNumber = maxNumber + 1;
        this.log(`📋 다음 접수번호 생성: ${nextNumber} (기존 최대: ${maxNumber})`);
        return String(nextNumber);
    }

    // ========================================
    // 리스트 뷰 제목 업데이트
    // ========================================

    updateListViewTitle() {
        const listViewTitle = document.getElementById('listViewTitle');
        if (listViewTitle) {
            listViewTitle.textContent = `잔류농약 접수 목록`;
        }
    }

    // ========================================
    // 면적 변환
    // ========================================

    convertM2ToPyeong(m2) {
        return (parseFloat(m2) / PYEONG_TO_M2).toFixed(2);
    }

    convertPyeongToM2(pyeong) {
        return (parseFloat(pyeong) * PYEONG_TO_M2).toFixed(2);
    }

    // ========================================
    // 접수번호 가져오기 (연도 제외, 번호만)
    // ========================================

    getReceptionNumber() {
        if (!this.receptionNumberInput) {
            console.warn('접수번호 입력란을 찾을 수 없습니다');
            return '';
        }
        const value = this.receptionNumberInput.value.trim();
        if (!value) {
            console.warn('접수번호가 비어있습니다');
            return '';
        }
        const parts = value.split('-');
        if (parts.length >= 2) {
            const numberPart = parts.slice(1).join('-');
            this.log(`접수번호 추출: ${value} → ${numberPart}`);
            return numberPart;
        }
        this.log(`접수번호 형식 확인: ${value}`);
        return value;
    }

    // ========================================
    // 의뢰 항목 관리
    // ========================================

    addRequestItem() {
        this.requestItemCounter++;
        const index = this.requestItemCounter - 1;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'request-item';
        itemDiv.dataset.index = index;

        itemDiv.innerHTML = sanitizeHTML(`
            <div class="request-item-header">
                <span class="item-number">의뢰 ${this.requestItemCounter}</span>
                <button type="button" class="btn-remove-item" title="항목 삭제">✕</button>
            </div>
            <div class="form-row">
                <div class="form-field full-width">
                    <label>생산지 주소 <span class="label-hint">* 리+지번 입력 후 Enter</span></label>
                    <div class="producer-address-autocomplete-wrapper">
                        <input type="text" class="request-producer-address" name="producerAddress[]" placeholder="예: 문단리 123, 문단리 산 45">
                        <ul class="producer-address-autocomplete-list"></ul>
                    </div>
                </div>
            </div>
            <div class="form-row">
                <div class="form-field full-width">
                    <label>의뢰물품명(작물명)</label>
                    <input type="text" class="request-crop-name" name="requestContent[]" placeholder="예: 사과, 배, 포도 등">
                </div>
            </div>
        `);

        this.requestItemsList.appendChild(itemDiv);

        const removeBtn = itemDiv.querySelector('.btn-remove-item');
        removeBtn.addEventListener('click', () => {
            itemDiv.remove();
            this.updateRequestItemNumbers();
            this.updateRemoveButtonsVisibility();
        });

        this.initRequestItemAutocomplete(itemDiv);
        this.updateRemoveButtonsVisibility();

        itemDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    updateRequestItemNumbers() {
        const items = this.requestItemsList.querySelectorAll('.request-item');
        items.forEach((item, idx) => {
            const numberSpan = item.querySelector('.item-number');
            if (numberSpan) {
                numberSpan.textContent = `의뢰 ${idx + 1}`;
            }
            item.dataset.index = idx;
        });
        this.requestItemCounter = items.length;
    }

    updateRemoveButtonsVisibility() {
        const items = this.requestItemsList.querySelectorAll('.request-item');
        items.forEach((item) => {
            const removeBtn = item.querySelector('.btn-remove-item');
            if (removeBtn) {
                removeBtn.style.display = items.length > 1 ? 'flex' : 'none';
            }
        });
    }

    initRequestItemAutocomplete(itemDiv) {
        const addressInput = itemDiv.querySelector('.request-producer-address');
        const autocompleteList = itemDiv.querySelector('.producer-address-autocomplete-list');

        if (!addressInput || !autocompleteList) return;

        addressInput.addEventListener('input', () => {
            const value = addressInput.value.trim();

            if (value.startsWith('봉화군') || value.startsWith('영주시') || value.startsWith('울진군')) {
                autocompleteList.classList.remove('show');
                return;
            }

            if (value.length > 0 && typeof suggestRegionVillages === 'function') {
                const suggestions = suggestRegionVillages(value, ['bonghwa', 'yeongju', 'uljin'], true);
                if (suggestions.length > 0) {
                    autocompleteList.innerHTML = '';
                    suggestions.forEach(item => {
                        const li = document.createElement('li');
                        li.dataset.village = item.village || '';
                        li.dataset.district = item.district || '';
                        li.dataset.regionKey = item.regionKey || '';
                        li.dataset.region = item.region || '';
                        li.dataset.isMountain = item.isMountain || false;
                        li.textContent = item.displayText || '';
                        autocompleteList.appendChild(li);
                    });
                    autocompleteList.classList.add('show');
                } else {
                    autocompleteList.classList.remove('show');
                }
            } else {
                autocompleteList.classList.remove('show');
            }
        });

        addressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = addressInput.value.trim();

                if (value.startsWith('봉화군') || value.startsWith('영주시') || value.startsWith('울진군')) {
                    autocompleteList.classList.remove('show');
                    return;
                }

                if (typeof parseParcelAddress === 'function') {
                    const result = parseParcelAddress(value);
                    if (result) {
                        if (result.isDuplicate) {
                            this.showProducerRegionSelectionModal(result, addressInput);
                        } else {
                            addressInput.value = result.fullAddress;
                            autocompleteList.classList.remove('show');
                        }
                    }
                }
            }
        });

        autocompleteList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const village = e.target.dataset.village;
                const district = e.target.dataset.district;
                const regionKey = e.target.dataset.regionKey;
                const isMountain = e.target.dataset.isMountain === 'true';

                const villageWithMountain = isMountain ? `${village} 산` : village;
                // SAMPL-1-48: window.LOCAL_REGIONS는 SAMPL-1-46에서 제거됨. 안전 fallback만 유지
                const region = e.target.dataset.region || regionKey;
                const fullAddress = `${region} ${district} ${villageWithMountain}`;
                const currentValue = addressInput.value.trim();
                const match = currentValue.match(/\d+(-\d+)?$/);
                const number = match ? ' ' + match[0] : '';

                addressInput.value = fullAddress + number;
                autocompleteList.classList.remove('show');
            }
        });

        document.addEventListener('click', (e) => {
            if (!addressInput.contains(e.target) && !autocompleteList.contains(e.target)) {
                autocompleteList.classList.remove('show');
            }
        });
    }

    getRequestItems() {
        const items = [];
        const requestItems = this.requestItemsList?.querySelectorAll('.request-item') || [];

        requestItems.forEach((item, idx) => {
            const addressInput = item.querySelector('.request-producer-address');
            const cropInput = item.querySelector('.request-crop-name');

            const address = addressInput?.value.trim() || '';
            const crop = cropInput?.value.trim() || '';

            if (address || crop) {
                items.push({
                    index: idx,
                    producerAddress: address,
                    cropName: crop
                });
            }
        });

        return items;
    }

    resetRequestItems() {
        const items = this.requestItemsList?.querySelectorAll('.request-item') || [];
        items.forEach((item, idx) => {
            if (idx === 0) {
                const addressInput = item.querySelector('.request-producer-address');
                const cropInput = item.querySelector('.request-crop-name');
                if (addressInput) addressInput.value = '';
                if (cropInput) cropInput.value = '';
            } else {
                item.remove();
            }
        });
        this.requestItemCounter = 1;
        this.updateRemoveButtonsVisibility();
    }

    // ========================================
    // 생산지 주소 자동완성
    // ========================================

    setupProducerAddressAutocomplete() {
        if (!this.producerAddressInput || !this.producerAddressAutocomplete) return;
        this.log('📍 생산지 주소 자동완성 초기화');

        this.producerAddressInput.addEventListener('input', () => {
            const value = this.producerAddressInput.value.trim();

            if (value.startsWith('봉화군') || value.startsWith('영주시') || value.startsWith('울진군')) {
                this.producerAddressAutocomplete.classList.remove('show');
                return;
            }

            if (value.length > 0 && typeof suggestRegionVillages === 'function') {
                const suggestions = suggestRegionVillages(value, ['bonghwa', 'yeongju', 'uljin'], true);
                if (suggestions.length > 0) {
                    this.producerAddressAutocomplete.innerHTML = '';
                    suggestions.forEach(item => {
                        const li = document.createElement('li');
                        li.dataset.village = item.village || '';
                        li.dataset.district = item.district || '';
                        li.dataset.regionKey = item.regionKey || '';
                        li.dataset.region = item.region || '';
                        li.dataset.isMountain = item.isMountain || false;
                        li.textContent = item.displayText || '';
                        this.producerAddressAutocomplete.appendChild(li);
                    });
                    this.producerAddressAutocomplete.classList.add('show');
                } else {
                    this.producerAddressAutocomplete.classList.remove('show');
                }
            } else {
                this.producerAddressAutocomplete.classList.remove('show');
            }
        });

        this.producerAddressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = this.producerAddressInput.value.trim();

                if (value.startsWith('봉화군') || value.startsWith('영주시') || value.startsWith('울진군')) {
                    this.producerAddressAutocomplete.classList.remove('show');
                    return;
                }

                if (typeof parseParcelAddress === 'function') {
                    const result = parseParcelAddress(value);
                    if (result) {
                        if (result.isDuplicate) {
                            this.showProducerRegionSelectionModal(result, this.producerAddressInput);
                        } else if (result.alternatives && result.alternatives.length > 1) {
                            this.producerAddressInput.value = result.fullAddress;
                            this.producerAddressAutocomplete.classList.remove('show');
                        } else {
                            this.producerAddressInput.value = result.fullAddress;
                            this.producerAddressAutocomplete.classList.remove('show');
                        }
                    }
                }
            }
        });

        this.producerAddressAutocomplete.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const village = e.target.dataset.village;
                const district = e.target.dataset.district;
                const regionKey = e.target.dataset.regionKey;
                const isMountain = e.target.dataset.isMountain === 'true';

                const villageWithMountain = isMountain ? `${village} 산` : village;
                // SAMPL-1-48: window.LOCAL_REGIONS는 SAMPL-1-46에서 제거됨. 안전 fallback만 유지
                const region = e.target.dataset.region || regionKey;
                const fullAddress = `${region} ${district} ${villageWithMountain}`;
                const currentValue = this.producerAddressInput.value.trim();
                const numberMatch = currentValue.match(/\d+(-\d+)?$/);
                const number = numberMatch ? ' ' + numberMatch[0] : '';

                this.producerAddressInput.value = fullAddress + number;
                this.producerAddressAutocomplete.classList.remove('show');
            }
        });

        document.addEventListener('click', (e) => {
            if (!this.producerAddressInput.contains(e.target) && !this.producerAddressAutocomplete.contains(e.target)) {
                this.producerAddressAutocomplete.classList.remove('show');
            }
        });
    }

    showProducerRegionSelectionModal(result, inputElement) {
        const modal = document.getElementById('regionSelectionModal');
        const duplicateVillageName = document.getElementById('duplicateVillageName');
        const regionOptions = document.getElementById('regionOptions');

        if (!modal || !regionOptions) return;

        duplicateVillageName.textContent = result.villageName;

        regionOptions.innerHTML = sanitizeHTML(result.locations.map(loc => `
            <button type="button" class="region-option-btn" data-address="${escapeAttr(loc.fullAddress)}">
                ${escapeHTML(loc.region)} ${escapeHTML(loc.district)}
            </button>
        `).join(''));

        regionOptions.querySelectorAll('.region-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const number = result.lotNumber ? ' ' + result.lotNumber : '';
                inputElement.value = btn.dataset.address + number;
                modal.classList.add('hidden');
            });
        });

        modal.classList.remove('hidden');
    }

    // ========================================
    // Override: 폼 제출 처리
    // ========================================

    submitForm() {
        const formData = new FormData(this.form);

        // 수정 모드인 경우 (그룹 멤버 전체 삭제+재생성)
        if (this.editingId) {
            const editingLog = this.sampleLogs.find(l => String(l.id) === String(this.editingId));
            if (!editingLog) {
                this.notifyEditTargetMissing('submitForm');
                return;
            }

            const requestItems = this.getRequestItems();
            if (requestItems.length === 0) {
                this.showToast('최소 하나의 의뢰 항목을 입력해주세요.', 'error');
                return;
            }

            const oldMembers = (this.editingGroupIds && this.editingGroupIds.length > 0)
                ? this.sampleLogs.filter(l => this.editingGroupIds.includes(String(l.id)))
                : [editingLog];

            const oldById = new Map(oldMembers.map(m => [String(m.id), m]));
            const groupId = editingLog.groupId || oldMembers[0]?.groupId || crypto.randomUUID();

            // 정렬 (Firestore 삭제와 재생성, 확인 다이얼로그에서 재사용)
            const oldOrdered = oldMembers.slice().sort((a, b) => {
                const na = parseInt(a.receptionNumber, 10) || 0;
                const nb = parseInt(b.receptionNumber, 10) || 0;
                return na - nb;
            });

            // SAMPL-1-82: 실제로 재사용되지 않는(삭제될) 멤버 기준으로 확인 — count가 아닌 id 차집합.
            // (count 기준은 item.index 매핑상 개수는 유지되나 특정 멤버가 미재사용되는 경우를 놓침)
            const reusedIds = new Set();
            requestItems.forEach((item, idx) => {
                const prev = oldOrdered[item.index] || oldOrdered[idx];
                if (prev) reusedIds.add(String(prev.id));
            });
            const prospectiveRemoved = oldOrdered.filter(o => !reusedIds.has(String(o.id)));
            if (prospectiveRemoved.length > 0 &&
                !confirm(`기존 ${oldMembers.length}건 중 ${prospectiveRemoved.length}건이 삭제됩니다. 계속하시겠습니까?`)) {
                return;
            }

            // 접수번호 파싱
            const receptionRaw = (formData.get('receptionNumber') || '').toString().trim();
            const receptionNumbers = receptionRaw.split(',').map(n => n.trim()).filter(n => n);
            const safeBaseParsed = parseInt(receptionNumbers[0], 10);
            const safeBase = !isNaN(safeBaseParsed) ? safeBaseParsed : (parseInt(this.generateNextReceptionNumber(), 10) || 1);

            // 기존 그룹 멤버 로컬에서 제거
            this.sampleLogs = this.sampleLogs.filter(l => !oldById.has(String(l.id)));

            const commonData = {
                ...this.collectCommonFormData(formData),
                subCategory: formData.get('subCategory') || '-',
                receptionMethod: formData.get('receptionMethod') || '-',
                producerName: formData.get('producerName') || ''
            };

            const nowIso = new Date().toISOString();
            const newIds = new Set();  // SAMPL-1-82: 재사용된 기존 멤버 id 추적
            requestItems.forEach((item, idx) => {
                // 빈 항목이 있어 DOM 인덱스와 결과 배열 인덱스가 다를 수 있으므로,
                // oldOrdered와 매핑할 때 item.index(DOM 순서)를 우선 사용
                const prev = oldOrdered[item.index] || oldOrdered[idx];
                const newLog = {
                    // 기존 레코드를 먼저 펼쳐 폼 밖 필드(후발 추가 필드 포함)를 보존한다 (SAMPL-1-147)
                    ...(prev || {}),
                    ...commonData,
                    id: prev?.id || crypto.randomUUID(),
                    groupId,
                    receptionNumber: receptionNumbers[idx] || String(safeBase + idx),
                    producerAddress: item.producerAddress,
                    requestContent: item.cropName,
                    isComplete: prev?.isComplete || false,
                    testResult: prev?.testResult ?? '',
                    createdAt: prev?.createdAt || nowIso,
                    updatedAt: nowIso
                };
                newIds.add(String(newLog.id));
                this.sampleLogs.push(newLog);
            });

            // SAMPL-1-82: 재사용되지 않은 기존 멤버 id만 삭제.
            // slice(newSlotCount)는 중간 빈 행이 있으면 item.index로 재사용된(살아남을) 멤버 id를
            // 삭제 대상에 잘못 포함시켜 클라우드에서 엉뚱한 멤버를 지운다 → id 집합 차집합으로 정정.
            const removedIds = oldOrdered
                .filter(o => !newIds.has(String(o.id)))
                .map(o => String(o.id));

            this.persistRecords([], removedIds);
            this.filterAndRenderLogs();
            this.cancelEditMode();
            this.showToast('수정이 완료되었습니다.', 'success');
            this.switchView('list');
            return;
        }

        // 신규 등록 모드
        const requestItems = this.getRequestItems();

        if (requestItems.length === 0) {
            this.showToast('최소 하나의 의뢰 항목을 입력해주세요.', 'error');
            return;
        }

        const baseReceptionNumber = parseInt(formData.get('receptionNumber'), 10);
        const createdLogs = [];
        // 동일 폼 제출로 생성된 N개 행을 그룹으로 묶기 위한 식별자
        const groupId = crypto.randomUUID();

        requestItems.forEach((item, idx) => {
            const itemReceptionNumber = String(baseReceptionNumber + idx);

            const newLog = {
                id: crypto.randomUUID(),
                ...this.collectCommonFormData(formData),
                groupId,
                receptionNumber: itemReceptionNumber,
                subCategory: formData.get('subCategory') || '-',
                receptionMethod: formData.get('receptionMethod') || '-',
                producerName: formData.get('producerName') || '',
                producerAddress: item.producerAddress,
                requestContent: item.cropName,
                isComplete: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            this.sampleLogs.push(newLog);
            createdLogs.push(newLog);
        });

        this.persistRecords(createdLogs);
        this.filterAndRenderLogs();
        this.form.reset();
        // yearSelect 복원: form.reset()이 yearSelect를 첫 옵션(2025)으로 되돌리므로 복원
        { const _yearSelect = document.getElementById('yearSelect'); if (_yearSelect && this.selectedYear) _yearSelect.value = this.selectedYear; }
        this.dateInput.valueAsDate = new Date();

        // 주소 필드 초기화
        this.addressPostcode.value = '';
        this.addressRoad.value = '';
        this.addressDetail.value = '';
        this.addressHidden.value = '';

        // 의뢰 항목 초기화
        this.resetRequestItems();

        // 다음 접수번호 자동 생성
        this.receptionNumberInput.value = this.generateNextReceptionNumber();

        const itemCount = createdLogs.length;
        this.showToast(`${itemCount}건의 시료가 접수되었습니다.`, 'success');

        if (createdLogs.length === 1) {
            this.showRegistrationResult(createdLogs[0]);
        } else {
            this.showMultipleRegistrationResult(createdLogs);
        }

        this.switchView('list');
    }

    // ========================================
    // Override: 샘플 편집
    // ========================================

    // ========================================
    // 샘플 수정 (그룹 멤버 조회는 Base getGroupMembers 사용)
    // ========================================
    editSample(id) {
        const logItem = this.sampleLogs.find(l => String(l.id) === String(id));
        if (!logItem) {
            this.notifyEditTargetMissing('editSample', { requestedId: id });
            return;
        }
        this.populateFormForEdit(logItem);
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

    populateFormForEdit(log) {
        const groupMembers = this.getGroupMembers(log);
        this.editingId = log.id;
        this.editingGroupIds = groupMembers.map(m => String(m.id));

        // 공통 필드(날짜/성명/전화/주소+레거시/법인토글/수령방법/비고) — Base
        this.populateCommonFields(log);

        // 그룹 멤버가 2개 이상이면 모든 접수번호를 표시 (공통이 채운 단건 접수번호 덮어씀)
        const receptionNumbersStr = groupMembers
            .map(m => m.receptionNumber || '')
            .filter(v => v)
            .join(', ');
        this.receptionNumberInput.value = receptionNumbersStr || (log.receptionNumber || '');

        // 구분 선택
        const subCategorySelect = document.getElementById('subCategory');
        if (subCategorySelect) {
            subCategorySelect.value = log.subCategory || '';
        }

        // 목적 선택
        const purposeSelect = document.getElementById('purpose');
        if (purposeSelect) {
            purposeSelect.value = log.purpose || '';
        }

        // 생산자 성명
        const producerNameInput = document.getElementById('producerName');
        if (producerNameInput) {
            producerNameInput.value = log.producerName || '';
        }

        // 의뢰 항목 초기화 후 그룹 멤버 모두 채우기
        this.resetRequestItems();
        const groupMembersForForm = (this.editingGroupIds && this.editingGroupIds.length > 1)
            ? this.sampleLogs
                .filter(l => this.editingGroupIds.includes(String(l.id)))
                .sort((a, b) => {
                    const na = parseInt(a.receptionNumber, 10) || 0;
                    const nb = parseInt(b.receptionNumber, 10) || 0;
                    return na - nb;
                })
            : [log];
        // 필요한 개수만큼 추가 항목 생성 (첫 항목은 이미 존재)
        for (let i = 1; i < groupMembersForForm.length; i++) {
            this.addRequestItem();
        }
        const requestItemEls = this.requestItemsList?.querySelectorAll('.request-item') || [];
        groupMembersForForm.forEach((member, idx) => {
            const itemEl = requestItemEls[idx];
            if (!itemEl) return;
            const addressInput = itemEl.querySelector('.request-producer-address');
            const cropInput = itemEl.querySelector('.request-crop-name');
            if (addressInput) addressInput.value = member.producerAddress || '';
            if (cropInput) cropInput.value = member.requestContent || '';
        });

        // 편집 모드 UI (navSubmitBtn + 폼 뷰 전환) — Base
        this.enterEditModeUI();
    }

    // ========================================
    // Override: 폼 초기화
    // ========================================

    // Override: 리셋 후 타입 고유 초기화 (주소/의뢰항목)
    // 공통 골격(form.reset/yearSelect/편집해제/navSubmitBtn/날짜/접수번호)은 Base.resetForm
    onAfterFormReset() {
        // 주소 필드 초기화
        if (this.addressPostcode) this.addressPostcode.value = '';
        if (this.addressRoad) this.addressRoad.value = '';
        if (this.addressDetail) this.addressDetail.value = '';
        if (this.addressHidden) this.addressHidden.value = '';

        // 의뢰 항목 초기화
        this.resetRequestItems();
    }

    // 편집 취소: Base resetForm(공통 골격 + onAfterFormReset) + 구분/필지 정리
    cancelEditMode() {
        this.resetForm();

        const subCatSelect = document.getElementById('subCategory');
        if (subCatSelect) {
            subCatSelect.disabled = false;
            subCatSelect.value = '';
        }

        // 필지 초기화
        this.parcels = [];
        this.parcelIdCounter = 0;
        if (this.parcelsContainer) {
            this.parcelsContainer.innerHTML = '';
        }
    }

    // ========================================
    // Override: renderLogs (자체 페이지네이션)
    // ========================================

    renderLogs(logs) {
        this.tableBody.innerHTML = '';
        this.updateRecordCount();

        if (logs.length === 0) {
            this.emptyState.classList.remove('hidden');
            if (this.paginationContainer) this.paginationContainer.style.display = 'none';
            this.currentFlatRows = [];
            this.updatePaginationUI();
        } else {
            this.emptyState.classList.add('hidden');
            if (this.paginationContainer) this.paginationContainer.style.display = 'flex';

            this.currentFlatRows = this.prepareDataForRender(logs);

            this.totalPages = Math.ceil(this.currentFlatRows.length / this.itemsPerPage) || 1;
            if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

            this.renderCurrentPage();
        }
    }

    // ========================================
    // 데이터 평탄화 (하위 지번별로 행 분리)
    // ========================================

    flattenLogsForTable(logs) {
        const rows = [];

        logs.forEach(log => {
            if (log.parcels && log.parcels.length > 0) {
                let subLotIndex = 1;

                log.parcels.forEach(parcel => {
                    const cropsDisplay = parcel.crops && parcel.crops.length > 0
                        ? parcel.crops.map(c => c.name).join(', ')
                        : '-';

                    let m2Total = 0;
                    let pyeongTotal = 0;
                    if (parcel.crops) {
                        parcel.crops.forEach(c => {
                            const area = parseFloat(c.area) || 0;
                            if (c.unit === 'pyeong') {
                                pyeongTotal += area;
                            } else {
                                m2Total += area;
                            }
                        });
                    }

                    const areaParts = [];
                    if (m2Total > 0) areaParts.push(`${m2Total.toLocaleString()}㎡`);
                    if (pyeongTotal > 0) areaParts.push(`${pyeongTotal.toLocaleString()}평`);
                    const areaDisplay = areaParts.length > 0 ? areaParts.join(' / ') : '-';

                    rows.push({
                        ...log,
                        _isFirstRow: subLotIndex === 1,
                        _subLotIndex: subLotIndex,
                        _displayNumber: log.receptionNumber,
                        _lotAddress: parcel.lotAddress || '-',
                        _cropsDisplay: cropsDisplay,
                        _areaDisplay: areaDisplay
                    });
                    subLotIndex++;

                    if (parcel.subLots && parcel.subLots.length > 0) {
                        parcel.subLots.forEach((subLot, idx) => {
                            const lotAddress = typeof subLot === 'string' ? subLot : subLot.lotAddress;
                            const subLotCrops = typeof subLot === 'string' ? [] : (subLot.crops || []);

                            const subLotCropsDisplay = subLotCrops.length > 0
                                ? subLotCrops.map(c => c.name).join(', ')
                                : '-';

                            let subM2Total = 0;
                            let subPyeongTotal = 0;
                            subLotCrops.forEach(c => {
                                const area = parseFloat(c.area) || 0;
                                if (c.unit === 'pyeong') {
                                    subPyeongTotal += area;
                                } else {
                                    subM2Total += area;
                                }
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
                                _areaDisplay: subAreaDisplay
                            });
                            subLotIndex++;
                        });
                    }
                });
            } else {
                rows.push({
                    ...log,
                    _isFirstRow: true,
                    _subLotIndex: 1,
                    _displayNumber: log.receptionNumber,
                    _lotAddress: log.lotAddress || '-',
                    _subLot: '-',
                    _cropsDisplay: log.cropsDisplay || '-',
                    _areaDisplay: log.area ? parseFloat(log.area).toLocaleString() : '-'
                });
            }
        });

        return rows;
    }

    // ========================================
    // 페이지네이션 시스템
    // ========================================

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.renderCurrentPage();
        const tableWrapper = document.querySelector('.table-wrapper');
        if (tableWrapper) tableWrapper.scrollTop = 0;
    }

    renderCurrentPage() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageRows = this.currentFlatRows.slice(startIndex, endIndex);

        this.tableBody.innerHTML = '';
        const fragment = document.createDocumentFragment();
        pageRows.forEach((row) => {
            const isComplete = row.isComplete || false;
            const tr = document.createElement('tr');
            tr.className = isComplete ? 'row-completed' : '';
            const methodText = row.receptionMethod || '-';

            const addressFull = [row.addressRoad || row.address, row.addressDetail].filter(Boolean).join(' ') || '';
            const zipMatch = addressFull.match(/^\((\d{5})\)\s*/);
            const zipcode = row.addressPostcode || (zipMatch ? zipMatch[1] : '');
            const addressOnly = zipMatch ? addressFull.replace(zipMatch[0], '') : addressFull;

            const applicantType = row.applicantType || '개인';
            const birthOrCorp = applicantType === '법인' ? (row.corpNumber || '-') : (row.birthDate || '-');

            const displayAddress = addressOnly && addressOnly !== '-' && SIDO_PATTERN.test(addressOnly)
                ? addressOnly.replace(SIDO_PATTERN, '')
                : (addressOnly || '-');

            const safeName = escapeHTML(row.name);
            const safeDisplayAddress = escapeHTML(displayAddress);
            const safeProducerName = escapeHTML(row.producerName || '-');
            const producerAddrWithoutSido = (row.producerAddress || '-').replace(/^경상북도\s*/, '');
            const safeProducerAddress = escapeHTML(producerAddrWithoutSido);
            const safeRequestContent = escapeHTML(row.requestContent || '-');
            const displayPhone = row.phoneNumber && window.SampleUtils?.formatPhoneNumber
                ? (window.SampleUtils.formatPhoneNumber(row.phoneNumber) || row.phoneNumber)
                : (row.phoneNumber || '-');
            const safePhone = escapeHTML(displayPhone);
            const safeNote = escapeHTML(row.note || '-');

            tr.dataset.id = row.id;

            // Checkbox column
            const tdCheckbox = document.createElement('td');
            tdCheckbox.className = 'sticky-col col-checkbox';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'row-checkbox';
            checkbox.dataset.id = row.id;
            tdCheckbox.appendChild(checkbox);
            tr.appendChild(tdCheckbox);

            // Complete button column
            const tdComplete = document.createElement('td');
            tdComplete.className = 'sticky-col col-complete';
            const btnComplete = document.createElement('button');
            btnComplete.className = 'btn-complete' + (isComplete ? ' completed' : '');
            btnComplete.dataset.id = row.id;
            btnComplete.title = isComplete ? '완료 취소' : '완료';
            btnComplete.textContent = isComplete ? '✔' : '';
            tdComplete.appendChild(btnComplete);
            tr.appendChild(tdComplete);

            // Result button column
            const tdResult = document.createElement('td');
            tdResult.className = 'sticky-col col-result';
            const btnResult = document.createElement('button');
            btnResult.className = 'btn-result';
            if (row.testResult === 'pass') {
                btnResult.classList.add('pass');
                btnResult.textContent = '불검출';
                btnResult.title = '불검출';
            } else if (row.testResult === 'fail') {
                btnResult.classList.add('fail');
                btnResult.textContent = '검출';
                btnResult.title = '검출';
            } else {
                btnResult.textContent = '-';
                btnResult.title = '미판정 (클릭하여 변경)';
            }
            btnResult.dataset.id = row.id;
            tdResult.appendChild(btnResult);
            tr.appendChild(tdResult);

            // Display number
            const tdNumber = document.createElement('td');
            tdNumber.className = 'sticky-col col-num';
            tdNumber.textContent = row._displayNumber;
            tr.appendChild(tdNumber);

            // Date
            const tdDate = document.createElement('td');
            tdDate.className = 'sticky-col col-date';
            tdDate.textContent = row.date;
            tr.appendChild(tdDate);

            // Applicant type (hidden)
            const tdApplicantType = document.createElement('td');
            tdApplicantType.className = 'col-applicant-type col-hidden';
            tdApplicantType.textContent = applicantType;
            tr.appendChild(tdApplicantType);

            // Birth/Corp number (hidden)
            const tdBirthCorp = document.createElement('td');
            tdBirthCorp.className = 'col-birth-corp col-hidden';
            tdBirthCorp.textContent = birthOrCorp;
            tr.appendChild(tdBirthCorp);

            // Sub category
            const tdSubCategory = document.createElement('td');
            tdSubCategory.className = 'sticky-col col-category';
            tdSubCategory.textContent = row.subCategory || '-';
            tr.appendChild(tdSubCategory);

            // Purpose
            const tdPurpose = document.createElement('td');
            tdPurpose.className = 'sticky-col col-purpose';
            tdPurpose.textContent = row.purpose || '-';
            tr.appendChild(tdPurpose);

            // Name (클릭 시 같은 이름 일괄 선택)
            const tdName = document.createElement('td');
            tdName.className = 'sticky-col col-name';
            tdName.dataset.name = row.name || '';
            tdName.textContent = safeName;
            tdName.title = `"${safeName}" 클릭하면 같은 이름 일괄 선택`;
            tr.appendChild(tdName);

            // Zipcode (hidden)
            const tdZipcode = document.createElement('td');
            tdZipcode.className = 'col-zipcode col-hidden';
            tdZipcode.textContent = zipcode || '-';
            tr.appendChild(tdZipcode);

            // Address
            const tdAddress = document.createElement('td');
            tdAddress.className = 'col-address';
            tdAddress.textContent = safeDisplayAddress;
            tr.appendChild(tdAddress);

            // Producer name
            const tdProducerName = document.createElement('td');
            tdProducerName.textContent = safeProducerName;
            tr.appendChild(tdProducerName);

            // Producer address
            const tdProducerAddress = document.createElement('td');
            tdProducerAddress.className = 'col-producer-address';
            tdProducerAddress.textContent = safeProducerAddress;
            tr.appendChild(tdProducerAddress);

            // Request content
            const tdRequestContent = document.createElement('td');
            tdRequestContent.className = 'text-truncate';
            tdRequestContent.dataset.tooltip = safeRequestContent;
            tdRequestContent.textContent = safeRequestContent;
            tr.appendChild(tdRequestContent);

            // Phone
            const tdPhone = document.createElement('td');
            tdPhone.textContent = safePhone;
            tr.appendChild(tdPhone);

            // Reception method
            const tdMethod = document.createElement('td');
            tdMethod.textContent = methodText;
            tr.appendChild(tdMethod);

            // Note
            const tdNote = document.createElement('td');
            tdNote.className = 'col-note text-truncate';
            tdNote.dataset.tooltip = safeNote;
            tdNote.textContent = safeNote;
            tr.appendChild(tdNote);

            // Mail date
            const tdMailDate = document.createElement('td');
            tdMailDate.className = 'col-mail-date';
            tdMailDate.textContent = row.mailDate || '-';
            tr.appendChild(tdMailDate);

            // Analysis result button
            const tdAnalysis = document.createElement('td');
            tdAnalysis.className = 'col-analysis';
            const btnAnalysis = document.createElement('button');
            btnAnalysis.className = 'btn-analysis-open';
            btnAnalysis.dataset.id = row.id;
            btnAnalysis.title = '분석결과 입력/수정';
            const existingResult = this.loadTestResultForLog(row.id);
            // 우선순위: detections 존재 > allNd 플래그 > 빈 상태
            // (데이터 무결성: 둘 다 true인 불일치 케이스 방지)
            if (existingResult?.detections?.length > 0) {
                btnAnalysis.classList.add('has-result');
                btnAnalysis.textContent = `${existingResult.detections.length}건`;
            } else if (existingResult?.allNd) {
                btnAnalysis.classList.add('has-result');
                btnAnalysis.textContent = '불검출';
            } else {
                btnAnalysis.textContent = '결과입력';
            }
            tdAnalysis.appendChild(btnAnalysis);
            tr.appendChild(tdAnalysis);

            // Action buttons
            const tdActions = document.createElement('td');
            tdActions.className = 'col-action';   // sticky 고정 (SAMPL-2-35)
            const divActions = document.createElement('div');
            divActions.className = 'table-actions';
            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn-edit';
            btnEdit.dataset.id = row.id;
            btnEdit.textContent = '수정';
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-delete';
            btnDelete.dataset.id = row.id;
            btnDelete.textContent = '삭제';
            divActions.appendChild(btnEdit);
            divActions.appendChild(btnDelete);
            tdActions.appendChild(divActions);
            tr.appendChild(tdActions);
            fragment.appendChild(tr);
        });
        this.tableBody.appendChild(fragment);

        this.updatePaginationUI();
    }

    updatePaginationUI() {
        const totalItems = this.currentFlatRows.length;
        this.totalPages = Math.ceil(totalItems / this.itemsPerPage) || 1;

        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const startItem = totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);

        if (this.paginationInfo) {
            this.paginationInfo.textContent = `${totalItems}건 중 ${startItem}-${endItem}`;
        }

        if (this.firstPageBtn) this.firstPageBtn.disabled = this.currentPage === 1;
        if (this.prevPageBtn) this.prevPageBtn.disabled = this.currentPage === 1;
        if (this.nextPageBtn) this.nextPageBtn.disabled = this.currentPage === this.totalPages;
        if (this.lastPageBtn) this.lastPageBtn.disabled = this.currentPage === this.totalPages;

        this.renderPageNumbers();
    }

    renderPageNumbers() {
        if (!this.pageNumbersContainer) return;
        if (this.totalPages <= 1) {
            this.pageNumbersContainer.innerHTML = '';
            return;
        }

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
        btn.className = `page-btn ${pageNum === this.currentPage ? 'active' : ''}`;
        btn.textContent = pageNum;
        btn.addEventListener('click', () => this.goToPage(pageNum));
        return btn;
    }

    // ========================================
    // 자동 저장
    // ========================================

    async autoSaveToFile() {
        return await SampleUtils.performAutoSave({
            FileAPI: this.FileAPI,
            moduleKey: 'pesticide',
            data: this.sampleLogs,
            webFileHandle: this.autoSaveFileHandle,
            log: (...args) => this.log(...args)
        });
    }

    // ========================================
    // 검색 필터
    // ========================================

    // ========================================
    // 체크박스 관리
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
        this.log(`${count}개 항목 선택됨`);
    }

    getSelectedIds() {
        const checkedBoxes = this.tableBody.querySelectorAll('.row-checkbox:checked');
        return Array.from(checkedBoxes).map(cb => cb.dataset.id);
    }

    // ========================================
    // 등록 결과 모달
    // ========================================

    showRegistrationResult(logData) {
        this.currentRegistrationData = logData;

        const rows = [
            { label: '접수번호', value: logData.receptionNumber },
            { label: '접수일자', value: logData.date },
            { label: '성명', value: logData.name },
            { label: '전화번호', value: logData.phoneNumber },
            { label: '주소', value: [logData.addressRoad || logData.address, logData.addressDetail].filter(Boolean).join(' ') || '-' },
            { label: '구분', value: logData.subCategory || '-' },
            { label: '목적 (용도)', value: logData.purpose || '-' },
            { label: '수령 방법', value: logData.receptionMethod || '-' },
            { label: '생산자 성명', value: logData.producerName || '-' },
            { label: '생산지 주소', value: logData.producerAddress || '-' },
            { label: '의뢰물품명', value: logData.requestContent || '-', isMultiline: true },
            { label: '비고', value: logData.note || '-' }
        ];

        BaseSampleManager.buildResultTable(this.resultTableBody, rows);
        this.registrationResultModal.classList.remove('hidden');
    }

    showMultipleRegistrationResult(logs) {
        const modal = document.getElementById('registrationResultModal');
        const tableBody = document.getElementById('registrationResultTable');

        if (!modal || !tableBody) return;

        const esc = window.escapeHTML || escapeHTML;
        const rows = logs.map(log => {
            const addrWithoutSido = (log.producerAddress || '-').replace(/^경상북도\s*/, '');
            return `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${esc(log.receptionNumber)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${esc(addrWithoutSido)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${esc(log.requestContent || '-')}</td>
            </tr>
        `;
        }).join('');

        tableBody.innerHTML = sanitizeHTML(`
            <div style="margin-bottom: 16px; text-align: center;">
                <span style="font-size: 2rem;">✅</span>
                <p style="font-size: 1.1rem; font-weight: 600; color: #22C55E; margin: 8px 0;">${logs.length}건 접수 완료</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <thead>
                    <tr style="background: #F3E8FF;">
                        <th style="padding: 8px; text-align: left; border-bottom: 2px solid #DDD6FE;">접수번호</th>
                        <th style="padding: 8px; text-align: left; border-bottom: 2px solid #DDD6FE;">생산지 주소</th>
                        <th style="padding: 8px; text-align: left; border-bottom: 2px solid #DDD6FE;">의뢰물품명</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
            <div style="margin-top: 12px; padding: 8px; background: #F0FDF4; border-radius: 6px; font-size: 0.85rem; color: #15803D;">
                <strong>접수일:</strong> ${esc(logs[0].date)} | <strong>의뢰인:</strong> ${esc(logs[0].name)} | <strong>생산자:</strong> ${esc(logs[0].producerName || '-')}
            </div>
        `);

        modal.classList.remove('hidden');
    }

    closeRegistrationResultModal() {
        this.registrationResultModal.classList.add('hidden');
        this.currentRegistrationData = null;
    }

    // ========================================
    // 라벨 인쇄
    // ========================================

    // openLabelPrintWithData → Base 승격. pesticide는 address 재파싱 변형이므로 훅만 오버라이드 (L1 Phase 3 P3-B)
    getLabelAddressParts(log) {
        const addressFull = log.address || '';
        const zipMatch = addressFull.match(/^\((\d{5})\)\s*/);
        const postalCode = zipMatch ? zipMatch[1] : '';
        const address = zipMatch ? addressFull.replace(zipMatch[0], '') : addressFull;
        return { address: address, postalCode: postalCode };
    }

    // ========================================
    // 우편발송일자 일괄 입력
    // ========================================

    openMailDateModal(selectedIds) {
        this.pendingMailDateIds = selectedIds;
        const mailDateInput = document.getElementById('mailDateInput');
        const mailDateInfo = document.getElementById('mailDateInfo');
        const mailDateModal = document.getElementById('mailDateModal');
        const today = new Date().toISOString().split('T')[0];
        if (mailDateInput) mailDateInput.value = today;
        if (mailDateInfo) mailDateInfo.textContent = `선택한 ${selectedIds.length}건의 우편발송일자를 입력하세요.`;
        if (mailDateModal) mailDateModal.classList.remove('hidden');
    }

    closeMailDateModal() {
        const mailDateModal = document.getElementById('mailDateModal');
        if (mailDateModal) mailDateModal.classList.add('hidden');
        this.pendingMailDateIds = [];
    }

    // ========================================
    // 통계 기능
    // ========================================

    calculateStatistics() {
        const total = this.sampleLogs.length;
        const completed = this.sampleLogs.filter(log => log.isComplete).length;
        const pending = total - completed;

        // 목적(용도)별 — 폼 옵션 순서 유지, 0건도 표시
        const purposeOrder = [
            { key: '참고용', label: '📝 참고용', class: 'purpose-reference' },
            { key: '제출(급식)', label: '🍽️ 제출(급식)', class: 'purpose-meal' },
            { key: '제출(기타)', label: '📋 제출(기타)', class: 'purpose-other' },
            { key: '인증(무농약)', label: '🍃 인증(무농약)', class: 'purpose-nopesticide' },
            { key: '인증(유기농)', label: '♻️ 인증(유기농)', class: 'purpose-organic' },
            { key: '인증(GAP)', label: '✅ 인증(GAP)', class: 'purpose-gap' },
            { key: '인증(글로벌GAP)', label: '🌍 인증(글로벌GAP)', class: 'purpose-globalgap' },
        ];
        const byPurpose = {};
        // 모든 항목을 폼 순서대로 초기화 (0건 포함)
        purposeOrder.forEach(p => {
            byPurpose[p.key] = { count: 0, label: p.label, class: p.class };
        });

        this.sampleLogs.forEach(log => {
            const purpose = log.purpose || '기타';
            if (!byPurpose[purpose]) {
                byPurpose[purpose] = { count: 0, label: purpose, class: 'purpose-other' };
            }
            byPurpose[purpose].count++;
        });

        // 구분별
        const categoryMapping = {
            '생산물': { label: '🥬 생산물', class: 'category-field' },
            '작물체': { label: '🌿 작물체', class: 'category-fruit' },
            '토양': { label: '🌱 토양', class: 'category-rice' }
        };
        const byCategory = {};
        Object.entries(categoryMapping).forEach(([key, val]) => {
            byCategory[key] = { count: 0, ...val };
        });
        this.sampleLogs.forEach(log => {
            const cat = log.subCategory || '';
            if (cat && byCategory[cat]) {
                byCategory[cat].count++;
            }
        });

        const byMonth = {};
        const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        for (let i = 1; i <= 12; i++) {
            const monthKey = String(i).padStart(2, '0');
            byMonth[monthKey] = { count: 0, completed: 0, pending: 0, label: monthNames[i - 1], class: 'month' };
        }

        this.sampleLogs.forEach(log => {
            if (log.date) {
                const monthNum = log.date.substring(5, 7);
                if (byMonth[monthNum]) {
                    byMonth[monthNum].count++;
                    if (log.isComplete) {
                        byMonth[monthNum].completed++;
                    } else {
                        byMonth[monthNum].pending++;
                    }
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

        const methodMapping = {
            '우편': { label: '📮 우편', class: 'method-mail' },
            '이메일': { label: '📧 이메일', class: 'method-email' },
            '팩스': { label: '📠 팩스', class: 'method-fax' },
            '직접방문': { label: '🚶 직접방문', class: 'method-visit' }
        };
        const byReceptionMethod = {};
        Object.entries(methodMapping).forEach(([key, val]) => {
            byReceptionMethod[key] = { count: 0, ...val };
        });
        this.sampleLogs.forEach(log => {
            const method = log.receptionMethod || '';
            if (method && byReceptionMethod[method]) {
                byReceptionMethod[method].count++;
            }
        });

        return { total, completed, pending, byCategory, byPurpose, byMonth, byQuarter, byReceptionMethod };
    }

    openStatisticsModal() {
        const statisticsModal = document.getElementById('statisticsModal');
        if (!statisticsModal) return;

        const stats = this.calculateStatistics();

        document.getElementById('statTotalCount').textContent = stats.total.toLocaleString();
        document.getElementById('statCompletedCount').textContent = stats.completed;
        document.getElementById('statPendingCount').textContent = stats.pending;

        const completedRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0;
        const pendingRate = stats.total > 0 ? ((stats.pending / stats.total) * 100).toFixed(1) : 0;
        const totalBadge = document.getElementById('statTotalBadge');
        const completedRateEl = document.getElementById('statCompletedRate');
        const pendingRateEl = document.getElementById('statPendingRate');
        if (totalBadge) totalBadge.textContent = `${stats.total}건`;
        if (completedRateEl) completedRateEl.textContent = `${completedRate}%`;
        if (pendingRateEl) pendingRateEl.textContent = `${pendingRate}%`;
        const monthRange = document.getElementById('statsMonthRange');
        if (monthRange) monthRange.textContent = `${new Date().getFullYear()}년 1월 ~ 12월`;

        this.renderBarChart('statsByCategory', stats.byCategory, 'category', true);
        this.renderBarChart('statsByPurpose', stats.byPurpose, 'purpose', false);
        this.renderMonthlyChart('statsByMonth', stats.byMonth);
        this.renderQuarterlySummary('statsQuarterly', stats.byQuarter);
        this.renderMethodCards('statsByReceptionMethod', stats.byReceptionMethod);

        statisticsModal.classList.remove('hidden');
    }

    renderBarChart(containerId, data, prefix, sortByCount = true) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = Object.entries(data);
        if (sortByCount) entries.sort((a, b) => b[1].count - a[1].count);

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
            bar.className = `stat-bar ${value.class || ''}`;
            bar.style.width = `${percent}%`;
            wrapper.appendChild(bar);

            if (percent > 20) {
                const countSpan = document.createElement('span');
                countSpan.className = 'stat-bar-count';
                countSpan.textContent = `${value.count}건`;
                wrapper.appendChild(countSpan);
            }

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

        const entries = Object.entries(data);

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

        const barsContainer = document.createElement('div');
        barsContainer.className = 'monthly-bars';

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

            const completedBar = document.createElement('div');
            completedBar.className = 'monthly-bar-completed';
            completedBar.style.height = `${completedPercent}%`;
            completedBar.title = `완료: ${value.completed}건`;

            const pendingBar = document.createElement('div');
            pendingBar.className = 'monthly-bar-pending';
            pendingBar.style.height = `${100 - completedPercent}%`;
            pendingBar.title = `미완료: ${value.pending}건`;

            stack.appendChild(completedBar);
            stack.appendChild(pendingBar);
            barContainer.appendChild(stack);

            if (value.count > 0) {
                const valueSpan = document.createElement('span');
                valueSpan.className = 'monthly-bar-value';
                valueSpan.textContent = value.count;
                barContainer.appendChild(valueSpan);
            }

            const labelSpan = document.createElement('span');
            labelSpan.className = 'monthly-bar-label';
            labelSpan.textContent = value.label;

            group.appendChild(barContainer);
            group.appendChild(labelSpan);
            barsContainer.appendChild(group);
        });

        chart.appendChild(barsContainer);

        const legend = document.createElement('div');
        legend.className = 'monthly-legend';

        const completedLegend = document.createElement('span');
        completedLegend.className = 'legend-item';
        const completedColor = document.createElement('span');
        completedColor.className = 'legend-color completed';
        completedLegend.appendChild(completedColor);
        completedLegend.appendChild(document.createTextNode(' 완료'));

        const pendingLegend = document.createElement('span');
        pendingLegend.className = 'legend-item';
        const pendingColor = document.createElement('span');
        pendingColor.className = 'legend-color pending';
        pendingLegend.appendChild(pendingColor);
        pendingLegend.appendChild(document.createTextNode(' 미완료'));

        legend.appendChild(completedLegend);
        legend.appendChild(pendingLegend);
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
    // 엑셀 내보내기
    // ========================================

    exportToExcel() {
        if (this.sampleLogs.length === 0) {
            alert('내보낼 데이터가 없습니다.');
            return;
        }

        const selectedIds = this.getSelectedIds();
        const logsToExport = selectedIds.length > 0
            ? this.sampleLogs.filter(log => selectedIds.includes(log.id))
            : this.sampleLogs;

        if (selectedIds.length > 0) {
            this.showToast(`선택한 ${logsToExport.length}건을 내보냅니다.`, 'info');
        }

        const reversedLogs = [...logsToExport].sort((a, b) => {
            const numA = parseInt(String(a.receptionNumber).replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(String(b.receptionNumber).replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });
        const excelData = [];

        reversedLogs.forEach(log => {
            const applicantType = log.applicantType || '개인';
            const birthOrCorp = applicantType === '법인' ? (log.corpNumber || '-') : (log.birthDate || '-');
            const addressParts = parseAddressParts(log.addressRoad || log.address || '');
            const fullAddress = [log.addressRoad, log.addressDetail].filter(Boolean).join(' ') || '-';

            if (log.parcels && log.parcels.length > 0) {
                log.parcels.forEach((parcel, pIdx) => {
                    const cropsDisplay = parcel.crops && parcel.crops.length > 0
                        ? parcel.crops.map(c => c.name).join(', ')
                        : '-';

                    excelData.push({
                        '접수번호': log.receptionNumber,
                        '접수일자': log.date,
                        '법인여부': applicantType,
                        '생년월일/법인번호': birthOrCorp,
                        '구분': log.subCategory || '-',
                        '목적(용도)': log.purpose || '-',
                        '성명': log.name,
                        '전화번호': log.phoneNumber,
                        '우편번호': log.addressPostcode || '-',
                        '시도': addressParts.sido || '-',
                        '시군구': addressParts.sigungu || '-',
                        '읍면동': addressParts.eupmyeondong || '-',
                        '나머지주소': (addressParts.rest + (log.addressDetail ? ' ' + log.addressDetail : '')).trim() || '-',
                        '전체주소': fullAddress,
                        '필지 주소': parcel.lotAddress || '-',
                        '작물': cropsDisplay,
                        '수령 방법': log.receptionMethod || '-',
                        '비고': log.note || '-',
                        '완료여부': log.isComplete ? '완료' : '미완료',
                        '등록일시': log.createdAt ? new Date(log.createdAt).toLocaleString('ko-KR') : '-'
                    });

                    if (parcel.subLots && parcel.subLots.length > 0) {
                        parcel.subLots.forEach((subLot, sIdx) => {
                            const subLotAddress = typeof subLot === 'string' ? subLot : subLot.lotAddress;
                            const subLotCrops = typeof subLot === 'string' ? [] : (subLot.crops || []);
                            const subLotCropsDisplay = subLotCrops.length > 0 ? subLotCrops.map(c => c.name).join(', ') : '-';

                            excelData.push({
                                '접수번호': `${log.receptionNumber}-${sIdx + 1}`,
                                '접수일자': log.date,
                                '법인여부': applicantType,
                                '생년월일/법인번호': birthOrCorp,
                                '구분': log.subCategory || '-',
                                '목적(용도)': log.purpose || '-',
                                '성명': log.name,
                                '전화번호': log.phoneNumber,
                                '우편번호': log.addressPostcode || '-',
                                '시도': addressParts.sido || '-',
                                '시군구': addressParts.sigungu || '-',
                                '읍면동': addressParts.eupmyeondong || '-',
                                '나머지주소': (addressParts.rest + (log.addressDetail ? ' ' + log.addressDetail : '')).trim() || '-',
                                '전체주소': fullAddress,
                                '필지 주소': subLotAddress,
                                '작물': subLotCropsDisplay,
                                '수령 방법': log.receptionMethod || '-',
                                '비고': log.note || '-',
                                '완료여부': log.isComplete ? '완료' : '미완료',
                                '등록일시': log.createdAt ? new Date(log.createdAt).toLocaleString('ko-KR') : '-'
                            });
                        });
                    }
                });
            } else {
                excelData.push({
                    '접수번호': log.receptionNumber,
                    '접수일자': log.date,
                    '법인여부': applicantType,
                    '생년월일/법인번호': birthOrCorp,
                    '구분': log.subCategory || '-',
                    '목적(용도)': log.purpose || '-',
                    '성명': log.name,
                    '전화번호': log.phoneNumber,
                    '우편번호': log.addressPostcode || '-',
                    '시도': addressParts.sido || '-',
                    '시군구': addressParts.sigungu || '-',
                    '읍면동': addressParts.eupmyeondong || '-',
                    '나머지주소': (addressParts.rest + (log.addressDetail ? ' ' + log.addressDetail : '')).trim() || '-',
                    '전체주소': fullAddress,
                    '필지 주소': log.producerAddress || log.lotAddress || '-',
                    '작물': log.requestContent || log.cropsDisplay || '-',
                    '수령 방법': log.receptionMethod || '-',
                    '비고': log.note || '-',
                    '완료여부': log.isComplete ? '완료' : '미완료',
                    '등록일시': log.createdAt ? new Date(log.createdAt).toLocaleString('ko-KR') : '-'
                });
            }
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(sanitizeExcelData(excelData));

        ws['!cols'] = [
            { wch: 14 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 8 },
            { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 12 },
            { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
            { wch: 10 }, { wch: 20 }, { wch: 8 }, { wch: 18 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, '시료접수대장');

        const today = new Date().toISOString().slice(0, 10);
        const filename = `잔류농약_접수대장_${today}.xlsx`;
        XLSX.writeFile(wb, filename);
    }

    // ========================================
    // 등록 결과 엑셀 내보내기
    // ========================================

    exportRegistrationResult() {
        if (!this.currentRegistrationData) return;

        const excelData = [
            { '항목': '접수번호', '내용': this.currentRegistrationData.receptionNumber },
            { '항목': '접수일자', '내용': this.currentRegistrationData.date },
            { '항목': '구분', '내용': this.currentRegistrationData.subCategory || '-' },
            { '항목': '목적 (용도)', '내용': this.currentRegistrationData.purpose || '-' },
            { '항목': '성명', '내용': this.currentRegistrationData.name },
            { '항목': '전화번호', '내용': this.currentRegistrationData.phoneNumber },
            { '항목': '주소', '내용': this.currentRegistrationData.address || '-' },
            { '항목': '수령 방법', '내용': this.currentRegistrationData.receptionMethod || '-' },
            { '항목': '생산자 성명', '내용': this.currentRegistrationData.producerName || '-' },
            { '항목': '생산지 주소', '내용': this.currentRegistrationData.producerAddress || '-' },
            { '항목': '의뢰물품명', '내용': this.currentRegistrationData.requestContent || '-' },
            { '항목': '비고', '내용': this.currentRegistrationData.note || '-' }
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(sanitizeExcelData(excelData));
        ws['!cols'] = [{ wch: 20 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, ws, '등록결과');

        const fileName = `등록결과_${this.currentRegistrationData.receptionNumber}_${this.currentRegistrationData.name}.xlsx`;
        XLSX.writeFile(wb, fileName);
        this.showToast('엑셀 파일로 내보내기 완료', 'success');
    }

    // ========================================
    // 지역 선택 모달 (중복 리)
    // ========================================

    showRegionSelectionModal(parseResult, parcelId, inputElement) {
        const regionSelectionModal = document.getElementById('regionSelectionModal');
        if (!regionSelectionModal) return;

        this.currentRegionSelection = {
            result: parseResult,
            parcelId,
            inputElement
        };

        const duplicateVillageName = document.getElementById('duplicateVillageName');
        if (duplicateVillageName) {
            duplicateVillageName.textContent = parseResult.villageName;
        }

        const regionOptions = document.getElementById('regionOptions');
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

        regionSelectionModal.classList.remove('hidden');
    }

    selectRegion(index) {
        if (!this.currentRegionSelection) return;

        const location = this.currentRegionSelection.result.locations[index];
        const lotNumber = this.currentRegionSelection.result.lotNumber;
        const fullAddress = lotNumber ? `${location.fullAddress} ${lotNumber}` : location.fullAddress;

        this.currentRegionSelection.inputElement.value = fullAddress;
        this.closeRegionSelectionModal();
        this.showToast('지역이 선택되었습니다', 'success');
    }

    closeRegionSelectionModal() {
        const regionSelectionModal = document.getElementById('regionSelectionModal');
        if (regionSelectionModal) {
            regionSelectionModal.classList.add('hidden');
        }
        this.currentRegionSelection = null;
    }

    // ========================================
    // Override: 타입별 이벤트 설정
    // ========================================

    setupTypeSpecificEvents() {
        // -- 주소 검색 (AddressManager) --
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

        // -- 전화번호 자동 하이픈 --
        const phoneNumberInput = document.getElementById('phoneNumber');
        window.SampleUtils.setupPhoneNumberInput(phoneNumberInput);

        // -- 법인여부 선택 --
        if (this.applicantTypeSelect) {
            this.applicantTypeSelect.addEventListener('change', () => {
                const isCorpSelected = this.applicantTypeSelect.value === '법인';
                if (isCorpSelected) {
                    this.birthDateField.classList.add('hidden');
                    this.corpNumberField.classList.remove('hidden');
                    this.birthDateInput.value = '';
                } else {
                    this.birthDateField.classList.remove('hidden');
                    this.corpNumberField.classList.add('hidden');
                    this.corpNumberInput.value = '';
                }
            });
        }

        // -- 시료 타입 네비게이션 --
        const sampleTypeBtns = document.querySelectorAll('.type-btn');
        sampleTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sampleTypeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchView('form');
            });
        });

        // -- 빈 상태 "새 시료 접수하기" 버튼 --
        const btnGoForm = document.querySelector('.btn-go-form');
        if (btnGoForm) {
            btnGoForm.addEventListener('click', () => this.switchView('form'));
        }

        // -- 생산지 주소 자동완성 --
        this.setupProducerAddressAutocomplete();

        // -- 의뢰 항목 관리 --
        const btnAddRequestItem = document.getElementById('btnAddRequestItem');
        if (btnAddRequestItem) {
            btnAddRequestItem.addEventListener('click', () => this.addRequestItem());
        }

        // 첫 번째 항목 자동완성 초기화
        const firstRequestItem = this.requestItemsList?.querySelector('.request-item');
        if (firstRequestItem) {
            this.initRequestItemAutocomplete(firstRequestItem);
            const firstRemoveBtn = firstRequestItem.querySelector('.btn-remove-item');
            if (firstRemoveBtn) {
                firstRemoveBtn.addEventListener('click', () => {
                    if (this.requestItemsList.querySelectorAll('.request-item').length > 1) {
                        firstRequestItem.remove();
                        this.updateRequestItemNumbers();
                        this.updateRemoveButtonsVisibility();
                    }
                });
            }
        }

        // -- 테이블 이벤트 위임 (완료/판정/삭제/수정) --
        this.tableBody?.addEventListener('click', (e) => {
            // 완료 버튼
            const completeBtn = e.target.closest('.btn-complete');
            if (completeBtn) {
                const id = completeBtn.dataset.id;
                const logItem = this.sampleLogs.find(l => String(l.id) === id);
                if (logItem) {
                    const newCompletedStatus = !logItem.isComplete;
                    const receptionNumber = logItem.receptionNumber || '';
                    const baseNumber = receptionNumber.split('-').slice(0, 2).join('-');

                    const relatedLogs = this.sampleLogs.filter(l => {
                        const logBaseNumber = (l.receptionNumber || '').split('-').slice(0, 2).join('-');
                        return logBaseNumber === baseNumber && baseNumber !== '';
                    });

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

            // 판정 버튼
            const resultBtn = e.target.closest('.btn-result');
            if (resultBtn) {
                const id = resultBtn.dataset.id;
                const log = this.sampleLogs.find(l => String(l.id) === id);
                if (log) {
                    if (!log.testResult || log.testResult === '') {
                        log.testResult = 'pass';
                    } else if (log.testResult === 'pass') {
                        log.testResult = 'fail';
                    } else {
                        log.testResult = '';
                    }
                    log.updatedAt = new Date().toISOString();
                    this.saveLogs();
                    this.filterAndRenderLogs();
                } else {
                    this.notifyEditTargetMissing('toggleResult', { requestedId: id });
                }
            }

            // 삭제 버튼 (같은 그룹 멤버 모두 삭제)
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                const target = this.sampleLogs.find(l => String(l.id) === String(id));
                const members = target ? this.getGroupMembers(target) : [];
                const memberIds = new Set(members.map(m => String(m.id)));
                const confirmMsg = members.length > 1
                    ? `같은 접수로 등록된 ${members.length}건이 함께 삭제됩니다. 정말 삭제하시겠습니까?`
                    : '정말 삭제하시겠습니까?';
                if (confirm(confirmMsg)) {
                    this.sampleLogs = this.sampleLogs.filter(item => !memberIds.has(String(item.id)));
                    this.saveLogs();
                    this.filterAndRenderLogs();
                    this.showToast(members.length > 1 ? `${members.length}건 삭제되었습니다.` : '삭제되었습니다.', 'success');

                    if (window.firestoreDb?.isEnabled()) {
                        const year = parseInt(this.selectedYear, 10);
                        memberIds.forEach(mid => {
                            window.firestoreDb.delete('pesticide', year, mid)
                                .catch(err => (window.logger?.error || console.error)('Firebase 삭제 실패:', err));
                        });
                    }

                    if (this.editingId && memberIds.has(String(this.editingId))) {
                        this.cancelEditMode();
                    }
                }
            }

            // 수정 버튼
            const editBtn = e.target.closest('.btn-edit');
            if (editBtn) {
                const id = editBtn.dataset.id;
                const logItem = this.sampleLogs.find(l => String(l.id) === id);
                if (logItem) {
                    this.populateFormForEdit(logItem);
                }
            }

            // 분석결과 버튼
            const analysisBtn = e.target.closest('.btn-analysis-open');
            if (analysisBtn) {
                this.openPesticideAnalysisModal(analysisBtn.dataset.id);
            }
        });

        // -- 체크박스 선택 --
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const rowCheckboxes = this.tableBody.querySelectorAll('.row-checkbox');
                rowCheckboxes.forEach(checkbox => {
                    checkbox.checked = isChecked;
                });
                this.updateSelectedCount();
            });
        }

        this.tableBody.addEventListener('change', (e) => {
            if (e.target.classList.contains('row-checkbox')) {
                this.updateSelectAllState();
                this.updateSelectedCount();
            }
        });

        // 성명 클릭 시 같은 이름 일괄 선택
        if (this.tableBody) {
            this.tableBody.addEventListener('click', (e) => {
                const nameCell = e.target.closest('.col-name');
                if (nameCell && nameCell.dataset.name) {
                    const targetName = nameCell.dataset.name;
                    const rowCheckboxes = this.tableBody.querySelectorAll('.row-checkbox');
                    const targetCheckboxes = [];

                    rowCheckboxes.forEach(cb => {
                        const tr = cb.closest('tr');
                        const nc = tr?.querySelector('.col-name');
                        if (nc && nc.dataset.name === targetName) {
                            targetCheckboxes.push(cb);
                        }
                    });

                    if (targetCheckboxes.length === 0) return;
                    const allChecked = targetCheckboxes.every(cb => cb.checked);
                    targetCheckboxes.forEach(cb => { cb.checked = !allChecked; });

                    this.updateSelectAllState();
                    this.updateSelectedCount();
                }
            });
        }

        window.getSelectedIds = () => this.getSelectedIds();

        // -- 전체 보기/기본 보기 토글 --
        const viewToggleBtn = document.getElementById('viewToggleBtn');
        const logTable = document.getElementById('logTable');
        if (viewToggleBtn) {
            viewToggleBtn.addEventListener('click', () => {
                this.isFullView = !this.isFullView;
                const toggleText = viewToggleBtn.querySelector('.toggle-text');
                const toggleIcon = viewToggleBtn.querySelector('.toggle-icon');

                if (this.isFullView) {
                    logTable.classList.add('full-view');
                    toggleText.textContent = '기본 보기';
                    toggleIcon.textContent = '👁️‍🗨️';
                    viewToggleBtn.classList.add('active');
                } else {
                    logTable.classList.remove('full-view');
                    toggleText.textContent = '전체 보기';
                    toggleIcon.textContent = '👁️';
                    viewToggleBtn.classList.remove('active');
                }
            });
        }

        // -- 검색 모달 --
        const listSearchModal = document.getElementById('listSearchModal');
        const openSearchModalBtn = document.getElementById('openSearchModalBtn');
        const closeSearchModalBtn = document.getElementById('closeSearchModal');
        const searchDateFromInput = document.getElementById('searchDateFromInput');
        const searchDateToInput = document.getElementById('searchDateToInput');
        const searchNameInput = document.getElementById('searchNameInput');
        const searchReceptionFromInput = document.getElementById('searchReceptionFromInput');
        const searchReceptionToInput = document.getElementById('searchReceptionToInput');
        const clearSearchDateBtn = document.getElementById('clearSearchDate');
        const clearSearchReceptionBtn = document.getElementById('clearSearchReception');
        const resetSearchBtn = document.getElementById('resetSearchBtn');
        const applySearchBtn = document.getElementById('applySearchBtn');
        const completedFilter = document.getElementById('completedFilter');

        if (completedFilter) {
            completedFilter.addEventListener('change', () => {
                this.currentSearchFilter.completed = completedFilter.value;
                this.filterAndRenderLogs();
            });
        }

        if (openSearchModalBtn) {
            openSearchModalBtn.addEventListener('click', () => {
                searchDateFromInput.value = this.currentSearchFilter.dateFrom;
                searchDateToInput.value = this.currentSearchFilter.dateTo;
                searchNameInput.value = this.currentSearchFilter.name;
                searchReceptionFromInput.value = this.currentSearchFilter.receptionFrom;
                searchReceptionToInput.value = this.currentSearchFilter.receptionTo;
                listSearchModal.classList.remove('hidden');
                searchNameInput.focus();
            });
        }

        const closeSearchModal = () => { listSearchModal.classList.add('hidden'); };

        if (closeSearchModalBtn) closeSearchModalBtn.addEventListener('click', closeSearchModal);
        if (listSearchModal) listSearchModal.querySelector('.modal-overlay')?.addEventListener('click', closeSearchModal);

        if (clearSearchDateBtn) {
            clearSearchDateBtn.addEventListener('click', () => {
                searchDateFromInput.value = '';
                searchDateToInput.value = '';
            });
        }

        if (clearSearchReceptionBtn) {
            clearSearchReceptionBtn.addEventListener('click', () => {
                searchReceptionFromInput.value = '';
                searchReceptionToInput.value = '';
            });
        }

        if (resetSearchBtn) {
            resetSearchBtn.addEventListener('click', () => {
                searchDateFromInput.value = '';
                searchDateToInput.value = '';
                searchNameInput.value = '';
                searchReceptionFromInput.value = '';
                searchReceptionToInput.value = '';
                if (completedFilter) completedFilter.value = 'incomplete';
                this.currentSearchFilter = { dateFrom: '', dateTo: '', name: '', receptionFrom: '', receptionTo: '', completed: 'incomplete' };
                this.filterAndRenderLogs();
                closeSearchModal();
            });
        }

        if (applySearchBtn) {
            applySearchBtn.addEventListener('click', () => {
                this.currentSearchFilter.dateFrom = searchDateFromInput.value;
                this.currentSearchFilter.dateTo = searchDateToInput.value;
                this.currentSearchFilter.name = searchNameInput.value.toLowerCase();
                this.currentSearchFilter.receptionFrom = searchReceptionFromInput.value;
                this.currentSearchFilter.receptionTo = searchReceptionToInput.value;
                this.filterAndRenderLogs();
                closeSearchModal();
            });
        }

        [searchNameInput, searchReceptionFromInput, searchReceptionToInput].forEach(input => {
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') applySearchBtn.click();
                });
            }
        });

        // -- 라벨 인쇄 --
        const btnLabelPrint = document.getElementById('btnLabelPrint');
        if (btnLabelPrint) {
            btnLabelPrint.addEventListener('click', () => {
                const selectedIds = this.getSelectedIds();
                if (selectedIds.length === 0) {
                    if (this.sampleLogs.length === 0) {
                        alert('인쇄할 데이터가 없습니다.');
                        return;
                    }
                    if (!confirm(`선택된 항목이 없습니다.\n전체 ${this.sampleLogs.length}건을 라벨 인쇄하시겠습니까?`)) {
                        return;
                    }
                    this.openLabelPrintWithData(this.sampleLogs);
                } else {
                    const selectedLogs = this.sampleLogs.filter(log => selectedIds.includes(String(log.id)));
                    this.openLabelPrintWithData(selectedLogs);
                }
            });
        }

        // -- 선택 삭제 --
        const btnBulkDelete = document.getElementById('btnBulkDelete');
        if (btnBulkDelete) {
            btnBulkDelete.addEventListener('click', () => {
                const selectedIds = this.getSelectedIds();
                if (selectedIds.length === 0) {
                    alert('삭제할 항목을 선택해주세요.');
                    return;
                }
                if (!confirm(`선택한 ${selectedIds.length}건을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) {
                    return;
                }

                this.sampleLogs = this.sampleLogs.filter(log => !selectedIds.includes(String(log.id)));
                this.saveLogs();
                this.filterAndRenderLogs();

                if (window.firestoreDb?.isEnabled()) {
                    Promise.all(selectedIds.map(id =>
                        window.firestoreDb.delete('pesticide', parseInt(this.selectedYear, 10), id)
                    ))
                        .then(() => this.log('☁️ Firebase 일괄 삭제 완료:', selectedIds.length, '건'))
                        .catch(err => (window.logger?.error || console.error)('Firebase 일괄 삭제 실패:', err));
                }

                if (this.selectAllCheckbox) {
                    this.selectAllCheckbox.checked = false;
                    this.selectAllCheckbox.indeterminate = false;
                }

                if (selectedIds.includes(this.editingId)) {
                    this.cancelEditMode();
                }

                this.showToast(`${selectedIds.length}건이 삭제되었습니다.`, 'success');
            });
        }

        // -- 우편발송일자 일괄 입력 --
        const btnBulkMailDate = document.getElementById('btnBulkMailDate');
        const mailDateModal = document.getElementById('mailDateModal');
        const closeMailDateModalBtn = document.getElementById('closeMailDateModal');
        const cancelMailDateBtn = document.getElementById('cancelMailDateBtn');
        const confirmMailDateBtn = document.getElementById('confirmMailDateBtn');

        const closeMailDateModalFn = () => this.closeMailDateModal();
        if (closeMailDateModalBtn) closeMailDateModalBtn.addEventListener('click', closeMailDateModalFn);
        if (cancelMailDateBtn) cancelMailDateBtn.addEventListener('click', closeMailDateModalFn);
        if (mailDateModal) {
            mailDateModal.querySelector('.modal-overlay')?.addEventListener('click', closeMailDateModalFn);
        }

        if (confirmMailDateBtn) {
            confirmMailDateBtn.addEventListener('click', () => {
                const mailDateInput = document.getElementById('mailDateInput');
                const inputDate = mailDateInput?.value;
                if (!inputDate) {
                    this.showToast('날짜를 선택해주세요.', 'warning');
                    return;
                }

                let updatedCount = 0;
                this.sampleLogs = this.sampleLogs.map(log => {
                    if (this.pendingMailDateIds.includes(String(log.id))) {
                        updatedCount++;
                        return { ...log, mailDate: inputDate, updatedAt: new Date().toISOString() };
                    }
                    return log;
                });

                this.saveLogs();
                this.filterAndRenderLogs();

                if (this.selectAllCheckbox) {
                    this.selectAllCheckbox.checked = false;
                    this.selectAllCheckbox.indeterminate = false;
                }

                this.closeMailDateModal();
                this.showToast(`${updatedCount}건의 발송일자가 입력되었습니다.`, 'success');
            });
        }

        if (btnBulkMailDate) {
            btnBulkMailDate.addEventListener('click', () => {
                const selectedIds = this.getSelectedIds();
                if (selectedIds.length === 0) {
                    this.showToast('발송일자를 입력할 항목을 선택해주세요.', 'warning');
                    return;
                }
                this.openMailDateModal(selectedIds);
            });
        }

        // -- 통계 --
        const btnStatistics = document.getElementById('btnStatistics');
        const statisticsModal = document.getElementById('statisticsModal');
        const closeStatisticsModal = document.getElementById('closeStatisticsModal');
        const closeStatisticsBtn = document.getElementById('closeStatisticsBtn');

        if (btnStatistics) {
            btnStatistics.addEventListener('click', () => this.openStatisticsModal());
        }
        if (closeStatisticsModal) {
            closeStatisticsModal.addEventListener('click', () => statisticsModal.classList.add('hidden'));
        }
        if (closeStatisticsBtn) {
            closeStatisticsBtn.addEventListener('click', () => statisticsModal.classList.add('hidden'));
        }
        if (statisticsModal) {
            statisticsModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay')) {
                    statisticsModal.classList.add('hidden');
                }
            });
        }

        // -- MRL 검색 모달 --
        this.bindMrlSearchModal();

        // -- 엑셀 내보내기 --
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel());
        }

        // -- JSON 저장/불러오기 --
        const saveJsonBtn = document.getElementById('saveJsonBtn');
        const loadJsonInput = document.getElementById('loadJsonInput');

        SampleUtils.setupJSONSaveHandler({
            buttonElement: saveJsonBtn,
            sampleType: SAMPLE_TYPE,
            getData: () => this.sampleLogs,
            FileAPI: this.FileAPI,
            filePrefix: '잔류농약접수대장',
            showToast: window.showToast
        });

        SampleUtils.setupJSONLoadHandler({
            inputElement: loadJsonInput,
            getData: () => this.sampleLogs,
            setData: (data) => { this.sampleLogs = data; },
            saveData: () => this.saveLogs(),
            renderData: () => this.filterAndRenderLogs(),
            showToast: window.showToast,
            deduplicateById: true
        });

        // -- 전체화면 뷰어 --
        const openViewerBtn = document.getElementById('openViewerBtn');
        if (openViewerBtn) {
            openViewerBtn.addEventListener('click', () => {
                const viewerWindow = window.open('viewer.html', 'DataViewer',
                    'width=1400,height=800,scrollbars=yes,resizable=yes');
                if (!viewerWindow) {
                    alert('팝업이 차단되었습니다.\n브라우저 설정에서 팝업을 허용해주세요.');
                }
            });
        }

        // -- 자동 저장 토글 --
        SampleUtils.setupAutoSaveToggle({
            moduleKey: 'pesticide',
            FileAPI: this.FileAPI,
            getWebFileHandle: () => this.autoSaveFileHandle,
            setWebFileHandle: (handle) => { this.autoSaveFileHandle = handle; },
            autoSaveCallback: () => this.autoSaveToFile(),
            showToast: window.showToast,
            log: (...args) => this.log(...args)
        });

        // 자동 저장 폴더/파일 선택 버튼 설정
        SampleUtils.setupAutoSaveFolderButton({
            moduleKey: 'pesticide',
            FileAPI: this.FileAPI,
            selectedYear: this.selectedYear,
            getWebFileHandle: () => this.autoSaveFileHandle,
            setWebFileHandle: (handle) => { this.autoSaveFileHandle = handle; },
            autoSaveCallback: () => this.autoSaveToFile(),
            showToast: window.showToast
        });

        // 페이지 로드 시 자동 저장 상태 복원
        const autoSaveEnabled = localStorage.getItem('pesticideAutoSaveEnabled') === 'true';
        this.log('🔧 자동저장 상태 확인:', { autoSaveEnabled, isElectron: window.isElectron, autoSavePath: this.FileAPI?.autoSavePath });
        if (autoSaveEnabled && window.isElectron && this.FileAPI?.autoSavePath) {
            this.log('🔧 Electron 환경에서 자동저장 활성화');
            SampleUtils.updateAutoSaveStatus('active');
            this.autoSaveToFile();
        }

        // -- 페이지네이션 이벤트 --
        if (this.itemsPerPageSelect) {
            this.itemsPerPageSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value, 10);
                localStorage.setItem('pesticideItemsPerPage', this.itemsPerPage);
                this.currentPage = 1;
                this.renderCurrentPage();
            });
        }

        if (this.firstPageBtn) this.firstPageBtn.addEventListener('click', () => this.goToPage(1));
        if (this.prevPageBtn) this.prevPageBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        if (this.nextPageBtn) this.nextPageBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        if (this.lastPageBtn) this.lastPageBtn.addEventListener('click', () => this.goToPage(this.totalPages));

        // -- 폼 리셋 핸들러 --
        this.form.addEventListener('reset', () => {
            setTimeout(() => {
                if (this.addressPostcode) this.addressPostcode.value = '';
                if (this.addressRoad) this.addressRoad.value = '';
                if (this.addressDetail) this.addressDetail.value = '';
                if (this.addressHidden) this.addressHidden.value = '';
            }, 0);
        });

        // -- 네비게이션 바 초기화/접수등록 버튼 --
        if (this.navResetBtn) {
            this.navResetBtn.addEventListener('click', () => {
                const receptionNumber = document.getElementById('receptionNumber')?.value;
                const date = document.getElementById('date')?.value;

                this.form.reset();
                // yearSelect 복원: form.reset()이 yearSelect를 첫 옵션(2025)으로 되돌리므로 복원
                { const _yearSelect = document.getElementById('yearSelect'); if (_yearSelect && this.selectedYear) _yearSelect.value = this.selectedYear; }

                setTimeout(() => {
                    if (receptionNumber) {
                        document.getElementById('receptionNumber').value = receptionNumber;
                    }
                    if (date) {
                        document.getElementById('date').value = date;
                    }
                }, 10);
            });
        }

        if (this.navSubmitBtn) {
            this.navSubmitBtn.addEventListener('click', () => {
                this.form.requestSubmit();
            });
        }

        // -- 등록 결과 모달 이벤트 --
        const closeRegistrationModal = document.getElementById('closeRegistrationModal');
        const closeResultBtn = document.getElementById('closeResultBtn');
        const exportResultBtn = document.getElementById('exportResultBtn');
        const editResultBtn = document.getElementById('editResultBtn');

        if (closeRegistrationModal) {
            closeRegistrationModal.addEventListener('click', () => this.closeRegistrationResultModal());
        }
        if (closeResultBtn) {
            closeResultBtn.addEventListener('click', () => this.closeRegistrationResultModal());
        }
        if (this.registrationResultModal) {
            this.registrationResultModal.querySelector('.modal-overlay')?.addEventListener('click', () => this.closeRegistrationResultModal());
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

        if (exportResultBtn) {
            exportResultBtn.addEventListener('click', () => this.exportRegistrationResult());
        }

        // -- 지역 선택 모달 --
        const regionSelectionModal = document.getElementById('regionSelectionModal');
        const closeRegionModal = document.getElementById('closeRegionModal');
        const cancelRegionSelection = document.getElementById('cancelRegionSelection');

        if (closeRegionModal) {
            closeRegionModal.addEventListener('click', () => this.closeRegionSelectionModal());
        }
        if (cancelRegionSelection) {
            cancelRegionSelection.addEventListener('click', () => this.closeRegionSelectionModal());
        }
        if (regionSelectionModal) {
            const overlay = regionSelectionModal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.addEventListener('click', () => this.closeRegionSelectionModal());
            }
        }

        // -- 기존 작물 검색 모달 (기존 코드 호환, 숨김) --
        const cropModal = document.getElementById('cropModal');
        const openCropModalBtn = document.getElementById('openCropModalBtn');
        const closeCropModalBtn = document.getElementById('closeCropModal');
        const cancelCropBtn = document.getElementById('cancelCropSelection');

        if (typeof CROP_CATEGORIES !== 'undefined') {
            const cropCategoryFilter = document.getElementById('cropCategoryFilter');
            if (cropCategoryFilter) {
                CROP_CATEGORIES.forEach(cat => {
                    if (cat !== '전체') {
                        const option = document.createElement('option');
                        option.value = cat;
                        option.textContent = cat;
                        cropCategoryFilter.appendChild(option);
                    }
                });
            }
        }

        if (openCropModalBtn) openCropModalBtn.style.display = 'none';

        const closeModal = () => { if (cropModal) cropModal.classList.add('hidden'); };
        if (closeCropModalBtn) closeCropModalBtn.addEventListener('click', closeModal);
        if (cancelCropBtn) cancelCropBtn.addEventListener('click', closeModal);
        if (cropModal) cropModal.querySelector('.modal-overlay')?.addEventListener('click', closeModal);

        // -- 엑셀 가져오기 (ExcelImportManager) --
        const excelImporter = new ExcelImportManager({
            appFields: [
                { key: 'receptionNumber', label: '접수번호' },
                { key: 'date', label: '접수일자' },
                { key: 'subCategory', label: '구분' },
                { key: 'purpose', label: '목적(용도)' },
                { key: 'name', label: '성명' },
                { key: 'phoneNumber', label: '전화번호' },
                { key: 'address', label: '주소' },
                { key: 'producerName', label: '생산자' },
                { key: 'producerAddress', label: '생산자 주소' },
                { key: 'requestContent', label: '의뢰내용(작물)' },
                { key: 'receptionMethod', label: '수령방법' },
                { key: 'note', label: '비고' }
            ],
            autoMapRules: {
                '접수번호': 'receptionNumber', '번호': 'receptionNumber', 'no': 'receptionNumber',
                '접수일자': 'date', '날짜': 'date', '일자': 'date',
                '구분': 'subCategory', '분류': 'subCategory',
                '목적': 'purpose', '용도': 'purpose', '목적(용도)': 'purpose',
                '성명': 'name', '이름': 'name', '의뢰인': 'name',
                '전화번호': 'phoneNumber', '연락처': 'phoneNumber', '전화': 'phoneNumber',
                '주소': 'address', '의뢰인주소': 'address',
                '생산자': 'producerName', '생산자명': 'producerName', '생산농가': 'producerName',
                '생산자주소': 'producerAddress', '생산지': 'producerAddress', '생산자 주소': 'producerAddress',
                '의뢰내용': 'requestContent', '작물': 'requestContent', '작물명': 'requestContent', '검체명': 'requestContent',
                '수령방법': 'receptionMethod', '수령 방법': 'receptionMethod', '통보방법': 'receptionMethod',
                '비고': 'note', '메모': 'note'
            },
            templateConfig: {
                headers: ['접수번호', '구분', '목적(용도)', '생산자', '생산자 주소', '의뢰내용(작물)', '비고'],
                sampleRow: ['1', '생산물', '참고용', '홍길동', '봉화군 봉화읍 내성리', '사과', ''],
                colWidths: [
                    { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
                    { wch: 30 }, { wch: 15 }, { wch: 20 }
                ],
                sheetName: '잔류농약시료',
                fileName: '잔류농약_가져오기_서식'
            },
            previewColumns: [
                { key: 'receptionNumber', label: '접수번호' },
                { key: 'date', label: '접수일자' },
                { key: 'subCategory', label: '구분' },
                { key: 'name', label: '성명' },
                { key: 'producerName', label: '생산자' },
                { key: 'requestContent', label: '의뢰내용' },
                { key: 'purpose', label: '목적' },
                { key: 'note', label: '비고' }
            ],
            getCommonData: () => ({
                date: document.getElementById('importDate').value || new Date().toISOString().slice(0, 10),
                name: document.getElementById('importName').value.trim(),
                phone: document.getElementById('importPhone').value.trim(),
                address: document.getElementById('importAddress').value.trim(),
                method: document.getElementById('importMethod').value,
                purpose: document.getElementById('importPurpose').value,
                now: new Date().toISOString()
            }),
            buildRecord: (getVal, parseExcelDate, common) => {
                const receptionNumber = getVal('receptionNumber') || '';
                const dateVal = getVal('date');
                const date = parseExcelDate(dateVal) || common.date;
                const subCategory = getVal('subCategory') || '생산물';
                const purpose = getVal('purpose') || common.purpose;
                const name = getVal('name') || common.name;
                const phoneNumber = getVal('phoneNumber') || common.phone;
                const address = getVal('address') || common.address;
                const producerName = getVal('producerName') || '';
                const producerAddress = getVal('producerAddress') || '';
                const requestContent = getVal('requestContent') || '';
                const receptionMethod = getVal('receptionMethod') || common.method;
                const note = getVal('note') || '';

                return {
                    id: crypto.randomUUID(),
                    receptionNumber,
                    date,
                    applicantType: '개인',
                    birthDate: '',
                    corpNumber: '',
                    name,
                    phoneNumber,
                    address,
                    addressPostcode: '',
                    addressRoad: address,
                    addressDetail: '',
                    subCategory,
                    purpose,
                    receptionMethod,
                    note,
                    producerName,
                    producerAddress,
                    requestContent,
                    isComplete: false,
                    createdAt: common.now,
                    updatedAt: common.now
                };
            },
            skipRowCheck: (record, rowIdx) => {
                if (!record.requestContent && !record.producerName && !record.name) {
                    return `행 ${rowIdx + 2}: 의뢰내용, 생산자, 성명이 모두 비어 있어 건너뜁니다.`;
                }
                return null;
            },
            getExistingLogs: () => this.sampleLogs,
            onImportComplete: (records) => {
                records.forEach(logEntry => this.sampleLogs.push(logEntry));
                this.sampleLogs.sort((a, b) => {
                    const numA = parseInt(a.receptionNumber, 10) || 0;
                    const numB = parseInt(b.receptionNumber, 10) || 0;
                    if (numA !== numB) return numA - numB;
                    return (a.receptionNumber || '').localeCompare(b.receptionNumber || '');
                });
                this.saveLogs();
                this.filterAndRenderLogs();
            }
        });
        excelImporter.init();

        // 분석결과 입력 모달
        this.initPesticideAnalysisModal();

        // 분석결과 조회 페이지 열기 버튼
        const pesticideAnalysisBtn = document.getElementById('pesticideAnalysisBtn');
        if (pesticideAnalysisBtn) pesticideAnalysisBtn.addEventListener('click', () => {
            localStorage.setItem('pesticideAnalysis_year', this.selectedYear);
            const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.dataset.id).filter(Boolean);
            localStorage.setItem('pesticideAnalysis_selected_ids', JSON.stringify(selectedIds));

            const isElectron = window.electronAPI?.isElectron === true;
            if (isElectron) {
                window.electronAPI.openPesticideAnalysis();
            } else {
                const popup = window.open('../pesticide-analysis/index.html', '_blank');
                if (!popup) window.location.href = '../pesticide-analysis/index.html';
            }
        });

        // Firestore에서 분석 결과 동기화
        this.syncPesticideTestResultsFromFirestore();
    }

    // ========================================
    // 잔류농약 분석결과 모달
    // ========================================

    initPesticideAnalysisModal() {
        const modal = document.getElementById('pesticideAnalysisModal');
        if (!modal) return;

        const closeModal = () => { modal.classList.add('hidden'); this._paLogId = null; };
        document.getElementById('closePesticideAnalysisModal')?.addEventListener('click', closeModal);
        document.getElementById('cancelPesticideAnalysisBtn')?.addEventListener('click', closeModal);
        modal.querySelector('.modal-overlay')?.addEventListener('click', closeModal);
        modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        // 진단 모달: Ctrl+Shift+D
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
                e.preventDefault();
                this.openDebugModal();
            }
        });
        this.initDebugModal();

        document.getElementById('paAddRowBtn')?.addEventListener('click', () => this.addDetectionRow());
        document.getElementById('paAllNdBtn')?.addEventListener('click', () => this.setAllNd(true));
        document.getElementById('paCancelNdBtn')?.addEventListener('click', () => this.setAllNd(false));
        document.getElementById('savePesticideAnalysisBtn')?.addEventListener('click', () => this.savePesticideAnalysis());

        // MRL 일괄 조회 버튼
        document.getElementById('paMrlLookupBtn')?.addEventListener('click', () => this.lookupAllMrl());

        // MRL API 키 설정 버튼
        document.getElementById('paMrlSetKeyBtn')?.addEventListener('click', () => this.promptMrlApiKey());
    }

    // ========================================
    // MRL 통합 (식품안전나라 API)
    // ========================================
    async initMrlForModal() {
        const statusEl = document.getElementById('paMrlStatus');
        const textEl = document.getElementById('paMrlStatusText');
        const setKeyBtn = document.getElementById('paMrlSetKeyBtn');
        if (!statusEl) return;

        const MrlApi = window.MrlApi;
        if (!MrlApi) {
            statusEl.classList.remove('hidden', 'pa-mrl-status-warn');
            statusEl.classList.add('pa-mrl-status-error');
            textEl.textContent = 'MRL API 모듈 로드 실패';
            if (setKeyBtn) setKeyBtn.classList.add('hidden');
            return;
        }

        statusEl.classList.remove('hidden');
        await MrlApi.ensureEmbeddedKey?.(); // SAMPL-1-99: 내장 키 로드 완료 전 '미설정' 오판 방지
        if (!MrlApi.hasApiKey()) {
            statusEl.classList.add('pa-mrl-status-warn');
            statusEl.classList.remove('pa-mrl-status-error');
            textEl.textContent = '식품안전나라 API 키가 설정되지 않아 MRL 자동 조회 비활성';
            if (setKeyBtn) setKeyBtn.classList.remove('hidden');
            return;
        }

        // 캐시 상태 확인 + 필요 시 동기화
        const status = MrlApi.getCacheStatus();
        if (status.cached && !status.expired) {
            await MrlApi.init();
            statusEl.classList.remove('pa-mrl-status-warn', 'pa-mrl-status-error');
            textEl.textContent = `MRL 데이터 준비 완료 (${status.count}건, 캐시)`;
            if (setKeyBtn) setKeyBtn.classList.add('hidden');
            return;
        }

        // 캐시 없음 또는 만료 → 다운로드
        statusEl.classList.add('pa-mrl-status-warn');
        textEl.textContent = 'MRL 데이터 다운로드 중... (최초 1회 약 15초)';
        try {
            const result = await MrlApi.sync(({ loaded, total }) => {
                textEl.textContent = `MRL 데이터 다운로드 중... ${loaded}/${total}`;
            });
            if (result.success) {
                statusEl.classList.remove('pa-mrl-status-warn', 'pa-mrl-status-error');
                textEl.textContent = `MRL 데이터 준비 완료 (${result.count}건)`;
                if (setKeyBtn) setKeyBtn.classList.add('hidden');
            } else {
                statusEl.classList.remove('pa-mrl-status-warn');
                statusEl.classList.add('pa-mrl-status-error');
                textEl.textContent = `MRL 다운로드 실패: ${result.error || 'Unknown'}`;
            }
        } catch (e) {
            statusEl.classList.remove('pa-mrl-status-warn');
            statusEl.classList.add('pa-mrl-status-error');
            textEl.textContent = `MRL 다운로드 오류: ${e.message}`;
        }
    }

    promptMrlApiKey() {
        // 설정 페이지로 안내
        if (confirm('식품안전나라 OpenAPI 인증키는 설정 페이지에서 관리됩니다.\n\n설정 페이지를 여시겠습니까?')) {
            // 설정 페이지 이동 (새 탭/창)
            const settingsUrl = '../settings/index.html';
            if (window.electronAPI?.isElectron) {
                window.location.href = settingsUrl;
            } else {
                window.open(settingsUrl, '_blank');
            }
        }
    }

    // ========================================
    // MRL 검색 모달 (접수목록 진입점)
    // ========================================
    bindMrlSearchModal() {
        const modal = document.getElementById('mrlSearchModal');
        const openBtn = document.getElementById('openMrlSearchModalBtn');
        if (!modal || !openBtn) return;

        const closeBtns = [
            document.getElementById('closeMrlSearchModal'),
            document.getElementById('closeMrlSearchBtn')
        ];
        const input = document.getElementById('mrlSearchInput');
        const clearBtn = document.getElementById('mrlSearchClearBtn');
        const setKeyBtn = document.getElementById('mrlSearchSetKeyBtn');
        const backBtn = document.getElementById('mrlBackToCandidatesBtn');
        const foodFilterInput = document.getElementById('mrlFoodFilterInput');

        // 모달 내부 검색 상태
        this._mrlSearch = { candidates: [], selectedKor: null, selectedEngNames: [], rows: [], debounceTimer: null };
        // SAMPL-1-104: PSIS 공식 용도 조회 — in-memory 캐시 + 레이스 가드 토큰
        this._psisUseCache = new Map(); // kor → { useName, ts }
        this._psisLookupToken = 0;

        const closeModal = () => { modal.classList.add('hidden'); };
        const openModal = () => {
            modal.classList.remove('hidden');
            this.resetMrlSearchUI();
            this.refreshMrlSearchStatus();
            // SAMPL-1-99: 내장 키 로드가 아직이면 완료 후 상태줄 재갱신 (메모이즈라 비용 없음)
            window.MrlApi?.ensureEmbeddedKey?.().then(() => this.refreshMrlSearchStatus());
            // 캐시 미로드 시 init 시도 (네트워크 없음)
            if (window.MrlApi && !window.MrlApi.isReady()) {
                window.MrlApi.init().then(() => this.refreshMrlSearchStatus());
            }
            if (input) setTimeout(() => input.focus(), 50);
        };

        openBtn.addEventListener('click', openModal);
        closeBtns.forEach(b => b && b.addEventListener('click', closeModal));
        modal.querySelector('.modal-overlay')?.addEventListener('click', closeModal);
        modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        if (setKeyBtn) setKeyBtn.addEventListener('click', () => this.promptMrlApiKey());

        if (input) {
            input.addEventListener('input', () => {
                if (clearBtn) clearBtn.classList.toggle('hidden', !input.value);
                clearTimeout(this._mrlSearch.debounceTimer);
                this._mrlSearch.debounceTimer = setTimeout(() => {
                    this.runMrlPesticideSearch(input.value);
                }, 200);
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (input) { input.value = ''; input.focus(); }
                clearBtn.classList.add('hidden');
                this.resetMrlSearchUI();
            });
        }
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showMrlCandidateView());
        }
        if (foodFilterInput) {
            foodFilterInput.addEventListener('input', () => this.renderMrlResultTable(foodFilterInput.value));
        }
    }

    /** 상태 안내줄 갱신 (API 키/캐시 상태) */
    refreshMrlSearchStatus() {
        const statusEl = document.getElementById('mrlSearchStatus');
        const textEl = document.getElementById('mrlSearchStatusText');
        const setKeyBtn = document.getElementById('mrlSearchSetKeyBtn');
        if (!statusEl || !textEl) return;
        const MrlApi = window.MrlApi;

        const setState = (cls, text, showKey) => {
            statusEl.classList.remove('hidden', 'mrl-search-status-warn', 'mrl-search-status-error');
            if (cls) statusEl.classList.add(cls);
            textEl.textContent = text;
            if (setKeyBtn) setKeyBtn.classList.toggle('hidden', !showKey);
        };

        if (!MrlApi) {
            setState('mrl-search-status-error', 'MRL API 모듈 로드 실패', false);
            return false;
        }
        if (!MrlApi.hasApiKey()) {
            setState('mrl-search-status-warn', '식품안전나라 API 키가 설정되지 않아 MRL 검색을 사용할 수 없습니다.', true);
            return false;
        }
        const status = MrlApi.getCacheStatus();
        if (!status.cached) {
            setState('mrl-search-status-warn', 'MRL 데이터가 아직 준비되지 않았습니다. 잔류농약 분석결과 화면에서 "MRL 일괄 조회"를 한 번 실행하세요.', false);
            return false;
        }
        if (!MrlApi.isReady()) {
            setState('mrl-search-status-warn', 'MRL 데이터 로딩 중...', false);
            return false;
        }
        setState('', `MRL 데이터 준비 완료 (${status.count}건${status.expired ? ', 갱신 권장' : ''})`, false);
        return true;
    }

    /** MRL 검색 모달 UI 초기화 */
    resetMrlSearchUI() {
        if (this._mrlSearch) {
            this._mrlSearch.candidates = [];
            this._mrlSearch.selectedKor = null;
            this._mrlSearch.selectedEngNames = [];
            this._mrlSearch.rows = [];
        }
        const candSection = document.getElementById('mrlCandidateSection');
        const resultSection = document.getElementById('mrlResultSection');
        const emptyEl = document.getElementById('mrlSearchEmpty');
        const foodFilter = document.getElementById('mrlFoodFilterInput');
        if (candSection) candSection.classList.add('hidden');
        if (resultSection) resultSection.classList.add('hidden');
        if (foodFilter) foodFilter.value = '';
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
            emptyEl.textContent = '농약명을 입력하면 식품별 잔류허용기준(MRL)을 검색합니다.';
        }
    }

    /** 농약명 검색 실행 (한/영) */
    runMrlPesticideSearch(rawQuery) {
        const MrlApi = window.MrlApi;
        const MrlSearch = window.MrlSearch;
        const candSection = document.getElementById('mrlCandidateSection');
        const resultSection = document.getElementById('mrlResultSection');
        const emptyEl = document.getElementById('mrlSearchEmpty');

        const query = (rawQuery || '').trim();
        if (resultSection) resultSection.classList.add('hidden');

        if (!query) { this.resetMrlSearchUI(); return; }

        const ready = this.refreshMrlSearchStatus();
        if (!ready || !MrlApi || !MrlApi.isReady() || !MrlSearch) {
            if (candSection) candSection.classList.add('hidden');
            if (emptyEl) {
                emptyEl.classList.remove('hidden');
                emptyEl.textContent = 'MRL 데이터가 준비되지 않아 검색할 수 없습니다.';
            }
            return;
        }

        // MRL 데이터의 고유 한글 농약명 목록 (캐시는 한글 농약명)
        const korNames = this._getMrlKorPesticideNames();
        const nameMap = (window.PESTICIDE_NAME_MAP && window.PESTICIDE_NAME_MAP.map) || null;
        const candidates = MrlSearch.findPesticideCandidates(query, korNames, nameMap, 50);
        this._mrlSearch.candidates = candidates;

        if (!candidates.length) {
            if (candSection) candSection.classList.add('hidden');
            if (emptyEl) {
                emptyEl.classList.remove('hidden');
                emptyEl.textContent = `"${query}"에 해당하는 농약을 찾을 수 없습니다.`;
            }
            return;
        }

        // 단일 매치 & MRL 보유 → 바로 테이블
        const mrlMatches = candidates.filter(c => c.inMrl);
        if (candidates.length === 1 && candidates[0].inMrl) {
            this.selectMrlPesticide(candidates[0], false);
            return;
        }
        if (mrlMatches.length === 1 && candidates.length <= 1) {
            this.selectMrlPesticide(mrlMatches[0], false);
            return;
        }

        this.renderMrlCandidateList(candidates);
    }

    /** MRL 캐시의 고유 한글 농약명 목록 (캐싱) */
    _getMrlKorPesticideNames() {
        const MrlApi = window.MrlApi;
        if (!MrlApi || !MrlApi.isReady()) return [];
        // getRowCount 변동 시에만 재계산
        const count = MrlApi.getRowCount();
        if (this._mrlKorCache && this._mrlKorCacheCount === count) return this._mrlKorCache;
        const set = new Set();
        // allRows 직접 접근 불가 → getAllByCrop/getAllByPesticide는 단일용.
        // searchNames로는 전수 확보 불가하므로 캐시 데이터를 직접 재구성한다.
        const names = this._extractMrlKorNames();
        names.forEach(n => set.add(n));
        this._mrlKorCache = Array.from(set);
        this._mrlKorCacheCount = count;
        return this._mrlKorCache;
    }

    /** MrlApi 캐시에서 고유 한글 농약명 추출 (localStorage 슬림 캐시 사용) */
    _extractMrlKorNames() {
        try {
            const raw = localStorage.getItem('mrl_cache_data');
            if (!raw) return [];
            const slim = JSON.parse(raw);
            if (!Array.isArray(slim)) return [];
            const set = new Set();
            for (const r of slim) {
                if (r && r.pest) set.add(r.pest);
            }
            return Array.from(set);
        } catch (e) {
            window.logger?.warn?.('[MRL검색] 농약명 추출 실패', e);
            return [];
        }
    }

    /** 농약 후보 리스트 렌더 */
    /**
     * 농약 용도 → 배지용 CSS 클래스 (SAMPL-1-101)
     * @param {string|null} use 용도 문자열
     * @returns {string} use-* 클래스명
     */
    mrlUseTypeClass(use) {
        switch (use) {
            case '살충제': return 'use-insecticide';
            case '살균제': return 'use-fungicide';
            case '제초제': return 'use-herbicide';
            case '살응애제': return 'use-acaricide';
            case '생장조정제': return 'use-pgr';
            case '살선충제': return 'use-nematicide';
            case '기타': return 'use-etc';
            default: return 'use-unknown';
        }
    }

    /**
     * 농약 한글명으로 용도 배지 <span> 생성 (DOM API, textContent).
     * @param {string} kor 한글 농약명
     * @param {string[]} [engNames] 영문명(있으면 우선 조회)
     * @param {boolean} [showUnknown=false] 미분류 시 회색 배지 표시 여부
     * @returns {HTMLElement|null}
     */
    createMrlUseBadge(kor, engNames, showUnknown) {
        const UseType = window.PesticideUseType;
        if (!UseType) return null;
        let use = null;
        if (Array.isArray(engNames)) {
            for (const eng of engNames) {
                use = UseType.get(eng);
                if (use) break;
            }
        }
        if (!use) use = UseType.getByKor(kor);
        if (!use && !showUnknown) return null;

        const badge = document.createElement('span');
        badge.className = `mrl-use-badge ${this.mrlUseTypeClass(use)}`;
        badge.textContent = use || '미분류';
        return badge;
    }

    // ===== SAMPL-1-104: PSIS 공식 용도 조회 (캐시 + 레이스 가드) =====

    /** localStorage 캐시 키 + TTL(30일). */
    get _psisCacheKey() { return 'psis_use_cache_v1'; }
    get _psisCacheTtlMs() { return 30 * 24 * 60 * 60 * 1000; }

    /** localStorage에서 농약별 용도 캐시 조회 (유효 시 useName, 아니면 null). */
    _getPsisCached(kor) {
        const now = Date.now();
        // 1) in-memory 우선
        const mem = this._psisUseCache.get(kor);
        if (mem && (now - mem.ts) < this._psisCacheTtlMs) return mem.useName;
        // 2) localStorage 폴백
        try {
            const raw = localStorage.getItem(this._psisCacheKey);
            if (!raw) return null;
            const store = JSON.parse(raw);
            const entry = store && store[kor];
            if (entry && typeof entry.ts === 'number' && (now - entry.ts) < this._psisCacheTtlMs) {
                this._psisUseCache.set(kor, { useName: entry.useName || null, ts: entry.ts });
                return entry.useName || null;
            }
        } catch { /* 손상된 캐시는 무시 */ }
        return null;
    }

    /** 농약별 용도 결과를 in-memory + localStorage 캐시에 저장. */
    _setPsisCached(kor, useName) {
        const ts = Date.now();
        this._psisUseCache.set(kor, { useName: useName || null, ts });
        try {
            const raw = localStorage.getItem(this._psisCacheKey);
            const store = (raw && JSON.parse(raw)) || {};
            store[kor] = { useName: useName || null, ts };
            localStorage.setItem(this._psisCacheKey, JSON.stringify(store));
        } catch { /* 쿼터 초과 등은 무시 (in-memory는 유지됨) */ }
    }

    /**
     * 결과 헤더의 용도 배지를 공식(PSIS) 값으로 비동기 교체.
     * 정적표 배지를 즉시 유지하고, Electron + psisLookupUse 가능 시에만 시도.
     * 레이스 가드: 호출 시점 토큰/현재 선택 kor 와 응답 시점이 일치할 때만 DOM 반영.
     * @param {string} kor 한글 농약명
     */
    async _enrichMrlUseBadgeWithPsis(kor) {
        if (!kor) return;
        const api = window.electronAPI;
        if (!(api && api.isElectron === true && typeof api.psisLookupUse === 'function')) return;

        const token = ++this._psisLookupToken;
        const apply = (useName) => {
            if (!useName) return;
            // 레이스 가드: 토큰 + 현재 선택 농약 동시 일치해야 반영
            if (token !== this._psisLookupToken) return;
            if (this._mrlSearch.selectedKor !== kor) return;
            this._applyOfficialMrlUseBadge(useName);
        };

        // 1) 캐시 우선
        const cached = this._getPsisCached(kor);
        if (cached) { apply(cached); return; }

        // 2) 공식 조회
        try {
            const res = await api.psisLookupUse(kor);
            const useName = res && res.useName ? String(res.useName).trim() : null;
            if (useName) {
                this._setPsisCached(kor, useName);
                apply(useName);
            } else if (res && res.error) {
                window.logger?.warn?.(`[PSIS] "${kor}" 용도 조회 실패: ${res.error}`);
            }
        } catch (e) {
            window.logger?.warn?.(`[PSIS] "${kor}" 용도 조회 예외: ${e?.message || e}`);
        }
    }

    /** 결과 헤더의 용도 배지를 공식 값으로 교체(텍스트·클래스·툴팁). */
    _applyOfficialMrlUseBadge(useName) {
        const titleEl = document.getElementById('mrlResultTitle');
        if (!titleEl) return;
        const badge = titleEl.querySelector('.mrl-use-badge');
        if (!badge) return;
        badge.className = `mrl-use-badge ${this.mrlUseTypeClass(useName)}`;
        badge.textContent = useName;
        badge.title = '농촌진흥청 등록정보 (공식)';
        // 안내 아이콘 툴팁도 공식 출처로 갱신
        const note = titleEl.querySelector('.mrl-use-note');
        if (note) note.title = '용도: 농촌진흥청 농약등록정보 (공식)';
    }

    renderMrlCandidateList(candidates) {
        const candSection = document.getElementById('mrlCandidateSection');
        const resultSection = document.getElementById('mrlResultSection');
        const emptyEl = document.getElementById('mrlSearchEmpty');
        const listEl = document.getElementById('mrlCandidateList');
        const countEl = document.getElementById('mrlCandidateCount');
        if (!candSection || !listEl) return;

        if (emptyEl) emptyEl.classList.add('hidden');
        if (resultSection) resultSection.classList.add('hidden');
        candSection.classList.remove('hidden');
        if (countEl) countEl.textContent = `${candidates.length}개 농약`;

        // SAMPL-1-100: 테이블과 동일하게 DOM API 렌더 (sanitizer 화이트리스트 의존 제거)
        listEl.textContent = '';
        const frag = document.createDocumentFragment();
        candidates.forEach((c, i) => {
            const li = document.createElement('li');
            li.className = `mrl-candidate-item${c.inMrl ? '' : ' mrl-cand-disabled'}`;

            const korSpan = document.createElement('span');
            korSpan.className = 'mrl-cand-kor';
            korSpan.textContent = c.kor;
            li.appendChild(korSpan);

            const eng = c.engNames && c.engNames.length ? c.engNames.join(', ') : '';
            if (eng) {
                const engSpan = document.createElement('span');
                engSpan.className = 'mrl-cand-eng';
                engSpan.textContent = eng;
                li.appendChild(engSpan);
            }
            // SAMPL-1-101: 농약 용도 배지 (미분류는 생략)
            const useBadge = this.createMrlUseBadge(c.kor, c.engNames, false);
            if (useBadge) li.appendChild(useBadge);
            if (!c.inMrl) {
                const badge = document.createElement('span');
                badge.className = 'mrl-cand-nomrl';
                badge.textContent = '기준없음';
                li.appendChild(badge);
            } else {
                const arrow = document.createElement('span');
                arrow.className = 'material-icons-outlined mrl-cand-arrow';
                arrow.textContent = 'chevron_right';
                li.appendChild(arrow);
            }

            li.addEventListener('click', () => {
                const cand = candidates[i];
                if (cand && cand.inMrl) this.selectMrlPesticide(cand, true);
            });
            frag.appendChild(li);
        });
        listEl.appendChild(frag);
    }

    /** 후보 리스트 화면으로 복귀 */
    showMrlCandidateView() {
        const candSection = document.getElementById('mrlCandidateSection');
        const resultSection = document.getElementById('mrlResultSection');
        if (resultSection) resultSection.classList.add('hidden');
        if (candSection && this._mrlSearch.candidates.length > 1) {
            candSection.classList.remove('hidden');
        }
    }

    /** 농약 선택 → 식품별 MRL 테이블 표시 */
    selectMrlPesticide(candidate, cameFromList) {
        const MrlApi = window.MrlApi;
        const candSection = document.getElementById('mrlCandidateSection');
        const resultSection = document.getElementById('mrlResultSection');
        const emptyEl = document.getElementById('mrlSearchEmpty');
        const korEl = document.getElementById('mrlResultPesticideKor');
        const engEl = document.getElementById('mrlResultPesticideEng');
        const backBtn = document.getElementById('mrlBackToCandidatesBtn');
        const foodFilter = document.getElementById('mrlFoodFilterInput');
        if (!resultSection || !MrlApi) return;

        this._mrlSearch.selectedKor = candidate.kor;
        this._mrlSearch.selectedEngNames = candidate.engNames || [];

        // 해당 농약의 모든 식품별 레코드
        const records = MrlApi.getAllByPesticide(candidate.kor) || [];
        this._mrlSearch.rows = records.map(r => ({
            food: r.FOOD_KOR_NM || '',
            category: r.LCLAS_NM || '',
            mrl: r.MRL_VAL || '',
            unit: 'mg/kg'
        })).sort((a, b) => a.food.localeCompare(b.food, 'ko'));

        if (emptyEl) emptyEl.classList.add('hidden');
        if (candSection) candSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        if (korEl) korEl.textContent = candidate.kor;
        if (engEl) engEl.textContent = candidate.engNames && candidate.engNames.length ? `(${candidate.engNames.join(', ')})` : '';

        // SAMPL-1-101: 용도 배지 + 안내 텍스트 (결과 헤더 1곳)
        const titleEl = document.getElementById('mrlResultTitle');
        if (titleEl) {
            // 기존 배지/안내 제거 후 재구성 (DOM API)
            titleEl.querySelectorAll('.mrl-use-badge, .mrl-use-note').forEach(el => el.remove());
            const useBadge = this.createMrlUseBadge(candidate.kor, candidate.engNames, true);
            if (useBadge) {
                titleEl.appendChild(useBadge);
                const note = document.createElement('span');
                note.className = 'mrl-use-note material-icons-outlined';
                note.textContent = 'info';
                note.style.fontSize = '14px';
                note.title = '용도 분류는 참고용입니다 (IRAC/FRAC/HRAC 기반)';
                titleEl.appendChild(note);
            }
        }

        // SAMPL-1-104: 정적표 배지는 즉시 표시(위)하고, Electron에서는 공식(PSIS) 용도를 비동기 교체
        this._enrichMrlUseBadgeWithPsis(candidate.kor);

        if (backBtn) backBtn.classList.toggle('hidden', !(cameFromList && this._mrlSearch.candidates.length > 1));
        if (foodFilter) foodFilter.value = '';

        this.renderMrlResultTable('');
    }

    /** 식품별 MRL 테이블 렌더 (식품명 필터 적용) */
    renderMrlResultTable(filterRaw) {
        const tbody = document.getElementById('mrlResultTableBody');
        const countEl = document.getElementById('mrlResultCount');
        if (!tbody) return;
        const MrlSearch = window.MrlSearch;
        const norm = MrlSearch ? MrlSearch.normalize : (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
        const filter = norm(filterRaw);

        const rows = (this._mrlSearch.rows || []).filter(r => !filter || norm(r.food).includes(filter));
        if (countEl) countEl.textContent = `${rows.length}건`;

        // SAMPL-1-100: innerHTML+sanitizeHTML은 화이트리스트에서 tr/td가 제거되어
        // 행이 한 덩어리 텍스트로 합쳐짐 → DOM API + textContent로 렌더 (XSS 원천 차단)
        tbody.textContent = '';

        if (!rows.length) {
            const msg = (this._mrlSearch.rows || []).length
                ? '필터 조건에 맞는 식품이 없습니다.'
                : '이 농약의 MRL 기준이 없습니다.';
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 4;
            td.className = 'mrl-result-empty-row';
            td.textContent = msg;
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        const frag = document.createDocumentFragment();
        rows.forEach(r => {
            const tr = document.createElement('tr');
            const cells = [
                ['mrl-col-food', r.food],
                ['mrl-col-category', r.category || '-'],
                ['mrl-col-value', r.mrl !== '' ? r.mrl : '-'],
                ['mrl-col-unit', r.unit]
            ];
            cells.forEach(([cls, val]) => {
                const td = document.createElement('td');
                td.className = cls;
                td.textContent = String(val ?? '');
                tr.appendChild(td);
            });
            frag.appendChild(tr);
        });
        tbody.appendChild(frag);
    }

    /**
     * 단일 행의 MRL 조회 + 판정 갱신
     * @param {HTMLElement} tr Original 행 (pa-detection-row, not pa-acid-row)
     */
    updateRowMrl(tr) {
        if (!tr || tr.classList.contains('pa-acid-row')) return;

        const MrlApi = window.MrlApi;
        const mrlCell = tr.querySelector('.pa-mrl-cell');
        const judgeCell = tr.querySelector('.pa-judgment-cell');
        if (!mrlCell || !judgeCell) return;

        // 작물명
        const crop = (document.getElementById('paCrop')?.textContent || '').trim();
        // 농약명 (영문)
        const nameInput = tr.querySelector('.pa-name-input');
        const engName = (nameInput?.value || '').trim();

        if (!crop || !engName || crop === '-') {
            mrlCell.textContent = '-';
            mrlCell.className = 'pa-mrl-cell pa-mrl-none';
            this.setJudgmentBadge(judgeCell, null);
            return;
        }

        if (!MrlApi || !MrlApi.isReady()) {
            mrlCell.textContent = '대기';
            mrlCell.className = 'pa-mrl-cell pa-mrl-loading';
            this.setJudgmentBadge(judgeCell, null);
            return;
        }

        const r = MrlApi.lookupByEng(crop, engName);
        if (r.error === 'NO_MAPPING') {
            mrlCell.textContent = '매핑없음';
            mrlCell.className = 'pa-mrl-cell pa-mrl-error';
            mrlCell.title = `${engName}의 한글 매핑이 없습니다`;
            this.setJudgmentBadge(judgeCell, null);
            return;
        }
        if (r.error === 'NO_MRL') {
            mrlCell.textContent = '기준없음';
            mrlCell.className = 'pa-mrl-cell pa-mrl-none';
            mrlCell.title = `${crop} + ${r.korPesticide}의 MRL 기준이 없습니다`;
            this.setJudgmentBadge(judgeCell, null);
            return;
        }

        // 정상 결과
        mrlCell.innerHTML = '';
        const valSpan = document.createElement('span');
        valSpan.textContent = r.value;
        mrlCell.appendChild(valSpan);

        // matchLevel이 'category' 또는 'alias'이면 출처 표시
        if ((r.matchLevel === 'category' || r.matchLevel === 'alias') && r.crop) {
            mrlCell.className = 'pa-mrl-cell pa-mrl-category';
            const srcSpan = document.createElement('span');
            srcSpan.className = 'pa-mrl-src';
            srcSpan.textContent = `(${r.crop})`;
            mrlCell.appendChild(srcSpan);
        } else {
            mrlCell.className = 'pa-mrl-cell';
        }
        mrlCell.title = `${r.korPesticide} (${r.mappingConfidence}) / ${r.category || ''} / ${r.matchLevel || 'exact'}`;

        // 검출량(Original val) 가져와서 판정
        const origValInput = tr.querySelector('.pa-orig-val');
        const detected = parseFloat(origValInput?.value);
        if (!isNaN(detected)) {
            const judgment = MrlApi.judge(detected, r.value);
            this.setJudgmentBadge(judgeCell, judgment);
        } else {
            this.setJudgmentBadge(judgeCell, null);
        }
    }

    setJudgmentBadge(cell, judgment) {
        if (!cell) return;
        cell.innerHTML = '';
        const span = document.createElement('span');
        span.className = 'pa-judgment-badge';
        if (judgment === 'pass') {
            span.classList.add('pa-judgment-pass');
            span.textContent = '적합';
        } else if (judgment === 'fail') {
            span.classList.add('pa-judgment-fail');
            span.textContent = '부적합';
        } else {
            span.classList.add('pa-judgment-none');
            span.textContent = '-';
        }
        cell.appendChild(span);
    }

    /**
     * 모든 행의 MRL 일괄 조회
     */
    async lookupAllMrl() {
        const MrlApi = window.MrlApi;
        if (!MrlApi) {
            window.showToast?.('MRL API 모듈이 로드되지 않았습니다', 'warning');
            return;
        }
        await MrlApi.ensureEmbeddedKey?.(); // SAMPL-1-99: 내장 키 로드 완료 전 '미설정' 오판 방지
        if (!MrlApi.hasApiKey()) {
            this.promptMrlApiKey();
            return;
        }
        if (!MrlApi.isReady()) {
            await this.initMrlForModal();
        }
        if (!MrlApi.isReady()) return;

        const rows = document.querySelectorAll('#paDetectionsBody .pa-detection-row:not(.pa-acid-row)');
        rows.forEach(tr => this.updateRowMrl(tr));

        // 전체 판정 자동 연동
        this.autoUpdateOverallJudgment();

        const cnt = rows.length;
        window.showToast?.(`${cnt}건 MRL 조회 완료`, 'success');
    }

    /**
     * 개별 행 판정 결과를 바탕으로 전체 판정(상단 라디오) 자동 연동
     * - 하나라도 부적합 → fail
     * - 전부 적합 → pass
     * - 그 외 → 변경 안 함
     */
    autoUpdateOverallJudgment() {
        const rows = document.querySelectorAll('#paDetectionsBody .pa-detection-row:not(.pa-acid-row)');
        if (!rows.length) return;

        let anyFail = false;
        let anyJudged = false;
        let allPass = true;
        rows.forEach(tr => {
            const badge = tr.querySelector('.pa-judgment-badge');
            if (!badge) return;
            if (badge.classList.contains('pa-judgment-fail')) {
                anyFail = true;
                anyJudged = true;
            } else if (badge.classList.contains('pa-judgment-pass')) {
                anyJudged = true;
            } else {
                allPass = false;
            }
        });

        if (!anyJudged) return;

        let target = null;
        if (anyFail) target = 'fail';
        else if (allPass) target = 'pass';

        if (target) {
            const radio = document.querySelector(`input[name="paJudgment"][value="${target}"]`);
            if (radio && !radio.checked) radio.checked = true;
        }
    }

    openPesticideAnalysisModal(logId) {
        const log = this.sampleLogs.find(l => String(l.id) === String(logId));
        if (!log) {
            this.notifyEditTargetMissing('openPesticideAnalysisModal', { requestedId: logId },
                window.BaseSampleManager.ANALYSIS_TARGET_MISSING_MESSAGE);
            return;
        }

        const modal = document.getElementById('pesticideAnalysisModal');
        if (!modal) return;

        this._paLogId = logId;

        // 시료 정보 채우기
        document.getElementById('paReceptionNumber').textContent = log.receptionNumber || '-';
        document.getElementById('paDate').textContent = log.date || '-';
        document.getElementById('paCategory').textContent = log.subCategory || '-';
        document.getElementById('paName').textContent = log.name || '-';
        document.getElementById('paCrop').textContent = log.requestContent || log.cropName || '-';
        document.getElementById('paPurpose').textContent = log.purpose || '-';

        // 기존 결과 로드
        const existing = this.loadTestResultForLog(logId);
        document.getElementById('paTestDate').value = existing?.testDate || '';

        // 판정
        const judgment = existing?.judgment || '';
        if (['', 'pass', 'fail'].includes(judgment)) {
            const radio = document.querySelector(`input[name="paJudgment"][value="${judgment}"]`);
            if (radio) radio.checked = true;
        }

        // 검출 농약 행 렌더
        const tbody = document.getElementById('paDetectionsBody');
        tbody.innerHTML = '';

        // 데이터 무결성: detections가 존재하면 allNd는 false여야 함
        // (allNd와 detections가 동시에 true인 불일치 상태 정리)
        const hasDetections = existing?.detections?.length > 0;
        this._paAllNd = hasDetections ? false : (existing?.allNd || false);
        this.updateNdStatusUI();

        if (hasDetections) {
            for (const det of existing.detections) {
                this.addDetectionRow(det);
            }
        }

        this.updateDetectionCount();
        this.toggleEmptyMsg();
        modal.classList.remove('hidden');

        // MRL API 초기화 + 기존 행 자동 조회
        this.initMrlForModal().then(() => {
            const rows = document.querySelectorAll('#paDetectionsBody .pa-detection-row:not(.pa-acid-row)');
            rows.forEach(tr => this.updateRowMrl(tr));
            this.autoUpdateOverallJudgment();
        }).catch(err => {
            window.logger?.warn?.('[Pesticide] MRL init 실패', err);
        });
    }

    addDetectionRow(data = null) {
        const tbody = document.getElementById('paDetectionsBody');
        if (!tbody) return;

        const tr = document.createElement('tr');
        tr.className = 'pa-detection-row';
        // Original 행만 카운트 (Acid 행 제외)
        const rowIdx = tbody.querySelectorAll('.pa-detection-row:not(.pa-acid-row)').length;

        // 자동 계산 헬퍼
        const createCalcInput = (prefix, fieldData) => {
            const rawIn = document.createElement('input');
            rawIn.type = 'text';
            rawIn.className = `pa-raw-input pa-${prefix}-raw`;
            rawIn.placeholder = '-';
            rawIn.autocomplete = 'off';
            if (fieldData?.raw) rawIn.value = fieldData.raw;

            const dilIn = document.createElement('input');
            dilIn.type = 'text';
            dilIn.className = `pa-dilution-input pa-${prefix}-dil`;
            dilIn.placeholder = '1';
            dilIn.autocomplete = 'off';
            dilIn.value = fieldData?.dil || '1';

            const valIn = document.createElement('input');
            valIn.type = 'text';
            valIn.className = `pa-value-input pa-${prefix}-val`;
            valIn.placeholder = '0.00';
            valIn.autocomplete = 'off';
            if (fieldData?.val) valIn.value = fieldData.val;

            const calc = () => {
                const ppb = parseFloat(rawIn.value);
                const dil = Math.max(parseFloat(dilIn.value) || 1, 1);
                if (!isNaN(ppb)) {
                    valIn.value = ((ppb * dil) / 1000).toFixed(3).replace(/\.?0+$/, '');
                } else {
                    valIn.value = '';
                }
            };
            rawIn.addEventListener('input', calc);
            dilIn.addEventListener('input', calc);

            return { rawIn, dilIn, valIn };
        };

        // === 1행: Original ===

        // No (rowSpan=2)
        const tdNo2 = document.createElement('td');
        tdNo2.className = 'pa-col-no';
        tdNo2.rowSpan = 2;
        tdNo2.textContent = rowIdx + 1;
        tr.appendChild(tdNo2);

        // 장비 (rowSpan=2)
        const tdEquip = document.createElement('td');
        tdEquip.className = 'pa-col-equip';
        tdEquip.rowSpan = 2;
        const selEquip = document.createElement('select');
        selEquip.className = 'pa-equip-select';
        ['GC', 'LC'].forEach(m => {
            const opt = document.createElement('option');
            opt.value = m; opt.textContent = m;
            selEquip.appendChild(opt);
        });
        if (data?.equipment) selEquip.value = data.equipment;
        tdEquip.appendChild(selEquip);
        tr.appendChild(tdEquip);

        // 농약명 (rowSpan=2)
        const tdName = document.createElement('td');
        tdName.className = 'pa-col-name';
        tdName.rowSpan = 2;
        const nameWrapper = document.createElement('div');
        nameWrapper.className = 'pa-autocomplete-wrapper';
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'pa-name-input';
        nameInput.placeholder = '농약명 검색...';
        nameInput.autocomplete = 'off';
        if (data?.name) {
            nameInput.value = data.name;
            nameInput.classList.toggle('pa-name-qualitative', window.isQualitativePesticide?.(data.name));
        }

        const sugList = document.createElement('ul');
        sugList.className = 'pa-suggestions hidden';
        nameInput.addEventListener('input', () => {
            const q = nameInput.value.trim();
            if (q.length < 1) { sugList.classList.add('hidden'); return; }
            const equip = selEquip.value || 'all';
            const results = window.searchPesticides ? window.searchPesticides(q, equip, 10) : [];
            sugList.innerHTML = '';
            if (results.length === 0) { sugList.classList.add('hidden'); return; }
            results.forEach(p => {
                const li = document.createElement('li');
                li.className = 'pa-suggestion-item';
                const isQual = window.isQualitativePesticide ? window.isQualitativePesticide(p.engName) : false;
                li.innerHTML = `<span class="pa-sug-name${isQual ? ' pa-sug-qualitative' : ''}">${this.escapeHTMLForSuggestion(p.engName)}</span>`;
                li.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    nameInput.value = p.engName;
                    nameInput.dataset.engName = p.engName;
                    nameInput.classList.toggle('pa-name-qualitative', window.isQualitativePesticide?.(p.engName));
                    sugList.classList.add('hidden');
                });
                sugList.appendChild(li);
            });
            const rect = nameInput.getBoundingClientRect();
            sugList.style.top = `${rect.bottom + 2}px`;
            sugList.style.left = `${rect.left}px`;
            sugList.style.width = `${rect.width}px`;
            sugList.classList.remove('hidden');
        });
        nameInput.addEventListener('blur', () => { setTimeout(() => sugList.classList.add('hidden'), 200); });
        nameWrapper.appendChild(nameInput);
        nameWrapper.appendChild(sugList);
        tdName.appendChild(nameWrapper);
        tr.appendChild(tdName);

        // Original 구분 라벨
        const tdOrigLabel = document.createElement('td');
        tdOrigLabel.className = 'pa-col-type pa-type-orig';
        tdOrigLabel.textContent = 'Original';
        tr.appendChild(tdOrigLabel);

        // Original 입력 필드
        const orig = createCalcInput('orig', {
            raw: data?.origRaw || '', dil: data?.origDil || '1', val: data?.origVal || ''
        });
        const tdOrigRaw = document.createElement('td'); tdOrigRaw.appendChild(orig.rawIn); tr.appendChild(tdOrigRaw);
        const tdOrigDil = document.createElement('td'); tdOrigDil.appendChild(orig.dilIn); tr.appendChild(tdOrigDil);
        const tdOrigVal = document.createElement('td'); tdOrigVal.appendChild(orig.valIn); tr.appendChild(tdOrigVal);

        // MRL 기준 (rowSpan=2) - 작물 + 농약명으로 자동 조회
        const tdMrl = document.createElement('td');
        tdMrl.className = 'pa-col-mrl';
        tdMrl.rowSpan = 2;
        const mrlSpan = document.createElement('span');
        mrlSpan.className = 'pa-mrl-cell pa-mrl-none';
        mrlSpan.textContent = '-';
        tdMrl.appendChild(mrlSpan);
        tr.appendChild(tdMrl);

        // 판정 (rowSpan=2)
        const tdJudge = document.createElement('td');
        tdJudge.className = 'pa-col-judgment pa-judgment-cell';
        tdJudge.rowSpan = 2;
        this.setJudgmentBadge(tdJudge, null);
        tr.appendChild(tdJudge);

        // 농약명 변경 시 MRL 재조회 (debounce 300ms)
        let mrlDebounceTimer = null;
        const triggerMrl = () => {
            if (mrlDebounceTimer) clearTimeout(mrlDebounceTimer);
            mrlDebounceTimer = setTimeout(() => {
                this.updateRowMrl(tr);
                this.autoUpdateOverallJudgment();
            }, 300);
        };
        nameInput.addEventListener('change', triggerMrl);
        nameInput.addEventListener('blur', triggerMrl);
        // 검출량(Original val) 변경 시 판정 재갱신
        orig.valIn.addEventListener('input', triggerMrl);
        orig.rawIn.addEventListener('input', triggerMrl);
        orig.dilIn.addEventListener('input', triggerMrl);

        // 삭제 (rowSpan=2)
        const tdDel = document.createElement('td');
        tdDel.className = 'pa-col-del';
        tdDel.rowSpan = 2;
        const btnDel = document.createElement('button');
        btnDel.className = 'pa-del-btn';
        btnDel.title = '삭제';
        btnDel.textContent = '✕';
        btnDel.addEventListener('click', () => {
            tr.remove();
            tr2.remove();
            this.renumberDetectionRows();
            this.updateDetectionCount();
            this.toggleEmptyMsg();
        });
        tdDel.appendChild(btnDel);
        tr.appendChild(tdDel);

        // === 2행: Acid ===
        const tr2 = document.createElement('tr');
        tr2.className = 'pa-detection-row pa-acid-row';

        const tdAcidLabel = document.createElement('td');
        tdAcidLabel.className = 'pa-col-type pa-type-acid';
        tdAcidLabel.textContent = 'Acid';
        tr2.appendChild(tdAcidLabel);

        const acid = createCalcInput('acid', {
            raw: data?.acidRaw || '', dil: data?.acidDil || '1', val: data?.acidVal || ''
        });
        const tdAcidRaw = document.createElement('td'); tdAcidRaw.appendChild(acid.rawIn); tr2.appendChild(tdAcidRaw);
        const tdAcidDil = document.createElement('td'); tdAcidDil.appendChild(acid.dilIn); tr2.appendChild(tdAcidDil);
        const tdAcidVal = document.createElement('td'); tdAcidVal.appendChild(acid.valIn); tr2.appendChild(tdAcidVal);

        tbody.appendChild(tr);
        tbody.appendChild(tr2);
        this.updateDetectionCount();
        this.toggleEmptyMsg();

        if (!data) nameInput.focus();
    }

    escapeHTMLForSuggestion(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    renumberDetectionRows() {
        // No 셀은 Original 행(rowSpan=2)에만 있음 — acid-row 제외
        const origRows = document.querySelectorAll('#paDetectionsBody .pa-detection-row:not(.pa-acid-row)');
        origRows.forEach((tr, idx) => {
            const noCell = tr.querySelector('.pa-col-no');
            if (noCell) noCell.textContent = idx + 1;
        });
    }

    updateDetectionCount() {
        const count = document.querySelectorAll('#paDetectionsBody .pa-detection-row:not(.pa-acid-row)').length;
        const el = document.getElementById('paDetectionCount');
        if (el) el.textContent = `${count}건`;
    }

    setAllNd(isNd) {
        this._paAllNd = isNd;
        if (isNd) {
            // 전체 불검출 시 기존 검출 행 모두 제거 + 판정 자동 선택
            const tbody = document.getElementById('paDetectionsBody');
            if (tbody) tbody.innerHTML = '';
            this.updateDetectionCount();
            const radio = document.querySelector('input[name="paJudgment"][value="pass"]');
            if (radio) radio.checked = true;
        } else {
            // 해제 시 판정 초기화
            const radio = document.querySelector('input[name="paJudgment"][value=""]');
            if (radio) radio.checked = true;
        }
        this.updateNdStatusUI();
        this.toggleEmptyMsg();
    }

    updateNdStatusUI() {
        const ndStatus = document.getElementById('paNdStatus');
        const emptyMsg = document.getElementById('paEmptyMsg');
        const addBtn = document.getElementById('paAddRowBtn');

        if (this._paAllNd) {
            if (ndStatus) ndStatus.classList.remove('hidden');
            if (emptyMsg) emptyMsg.style.display = 'none';
            if (addBtn) addBtn.disabled = true;
        } else {
            if (ndStatus) ndStatus.classList.add('hidden');
            if (addBtn) addBtn.disabled = false;
        }
    }

    toggleEmptyMsg() {
        const count = document.querySelectorAll('#paDetectionsBody .pa-detection-row:not(.pa-acid-row)').length;
        const msg = document.getElementById('paEmptyMsg');
        if (msg) msg.style.display = (count > 0 || this._paAllNd) ? 'none' : 'block';
    }

    async savePesticideAnalysis() {
        const logId = this._paLogId;
        if (!logId) return;

        const log = this.sampleLogs.find(l => String(l.id) === String(logId));
        if (!log) {
            this.notifyEditTargetMissing('savePesticideAnalysis', { requestedId: logId },
                window.BaseSampleManager.ANALYSIS_TARGET_MISSING_MESSAGE);
            return;
        }

        // 안전 체크: 모달이 비어있는데 저장하려 하면 (placeholder 방지)
        const preCheckRows = document.querySelectorAll('#paDetectionsBody .pa-detection-row:not(.pa-acid-row)');
        const isSavingEmpty = preCheckRows.length === 0 && !this._paAllNd;
        if (isSavingEmpty) {
            const existing = this.loadTestResultForLog(logId);
            if (existing?.detections?.length > 0) {
                // 기존에 검출 데이터가 있는데 모두 삭제하고 저장하려 함 → 확인
                if (!confirm(
                    '⚠️ 경고\n\n' +
                    `기존에 저장된 검출 농약 ${existing.detections.length}건이 모두 삭제됩니다.\n\n` +
                    '정말 저장하시겠습니까?\n' +
                    '(전체 불검출이라면 "전체 불검출" 버튼을 먼저 클릭하세요)'
                )) {
                    return;
                }
            } else if (!confirm('검출 농약이 없고 "전체 불검출"도 선택되지 않았습니다.\n빈 상태로 저장하시겠습니까?')) {
                return;
            }
        }

        const allResults = this.loadAllPesticideTestResults();

        // 검출 농약 수집
        const detections = [];
        // Original 행만 순회 (Acid 행은 바로 다음 형제)
        const origRows = document.querySelectorAll('#paDetectionsBody .pa-detection-row:not(.pa-acid-row)');
        origRows.forEach(tr => {
            const equipment = tr.querySelector('.pa-equip-select')?.value || 'GC';
            const name = tr.querySelector('.pa-name-input')?.value?.trim() || '';
            const engName = tr.querySelector('.pa-name-input')?.dataset?.engName || '';

            // Original (현재 행)
            const origRaw = tr.querySelector('.pa-orig-raw')?.value?.trim() || '';
            const origDil = tr.querySelector('.pa-orig-dil')?.value?.trim() || '1';
            const origVal = tr.querySelector('.pa-orig-val')?.value?.trim() || '';

            // Acid (다음 형제 행)
            const acidRow = tr.nextElementSibling;
            const acidRaw = acidRow?.querySelector('.pa-acid-raw')?.value?.trim() || '';
            const acidDil = acidRow?.querySelector('.pa-acid-dil')?.value?.trim() || '1';
            const acidVal = acidRow?.querySelector('.pa-acid-val')?.value?.trim() || '';

            // 최종 검출량: Original 우선, 없으면 Acid
            const value = origVal || acidVal || '';

            if (name) {
                detections.push({ equipment, name, engName, origRaw, origDil, origVal, acidRaw, acidDil, acidVal, value });
            }
        });

        // 데이터 무결성: detections가 있으면 allNd는 false (상호 배타)
        const finalAllNd = detections.length > 0 ? false : (this._paAllNd || false);

        allResults[logId] = {
            id: logId,
            testDate: document.getElementById('paTestDate')?.value || '',
            judgment: document.querySelector('input[name="paJudgment"]:checked')?.value || '',
            allNd: finalAllNd,
            detections: detections,
            updatedAt: new Date().toISOString()
        };

        // 판정: 라디오 버튼 값 사용 (전체 불검출/검출 추가 시 자동 선택됨)
        const selectedJudgment = document.querySelector('input[name="paJudgment"]:checked')?.value || '';
        if (selectedJudgment) {
            allResults[logId].judgment = selectedJudgment;
        } else if (this._paAllNd && detections.length === 0) {
            allResults[logId].judgment = 'pass';
        } else if (detections.length > 0) {
            allResults[logId].judgment = 'fail';
        }

        this.saveAllPesticideTestResults(allResults);

        // 접수 데이터 판정 동기화 (항상 반영)
        log.testResult = allResults[logId].judgment || '';
        this.saveLogs();

        document.getElementById('pesticideAnalysisModal')?.classList.add('hidden');
        this._paLogId = null;
        this.filterAndRenderLogs();
        this.showToast('분석결과가 저장되었습니다.', 'success');
    }

    // === 데이터 저장/로드 ===

    loadTestResultForLog(logId) {
        if (!this._cachedPesticideResults) {
            this._cachedPesticideResults = this.loadAllPesticideTestResults();
        }
        return this._cachedPesticideResults[logId] || null;
    }

    loadAllPesticideTestResults() {
        const key = `pesticideTestResults_${this.selectedYear}`;
        try {
            const data = localStorage.getItem(key);
            if (!data) return {};
            return JSON.parse(data) || {};
        } catch (e) {
            (window.logger?.error || console.error)('잔류농약 검사 결과 로드 실패:', e);
            return {};
        }
    }

    // ========================================
    // 진단 모달 (DevTools 대체)
    // ========================================
    initDebugModal() {
        const modal = document.getElementById('pesticideDebugModal');
        if (!modal) return;

        const close = () => modal.classList.add('hidden');
        document.getElementById('closePesticideDebugModal')?.addEventListener('click', close);
        modal.querySelector('.modal-overlay')?.addEventListener('click', close);
        modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

        const output = document.getElementById('pdbgOutput');
        const recNoInput = document.getElementById('pdbgRecNo');

        const writeOutput = (label, obj) => {
            const ts = new Date().toLocaleTimeString();
            const text = `[${ts}] ${label}\n${'='.repeat(60)}\n${JSON.stringify(obj, null, 2)}\n\n`;
            output.value = text + output.value;
        };

        document.getElementById('pdbgLookupBtn')?.addEventListener('click', () => {
            const recNo = parseInt(recNoInput.value, 10);
            if (!recNo) {
                output.value = '접수번호를 입력하세요\n';
                return;
            }
            const report = this.debugTestResult(recNo);
            writeOutput(`접수번호 ${recNo} 조회`, report || { error: '찾을 수 없음' });
        });

        document.getElementById('pdbgAllBtn')?.addEventListener('click', () => {
            const result = this.debugAllResults();
            const summary = {
                year: this.selectedYear,
                totalLogs: this.sampleLogs.length,
                totalResults: Object.keys(result.allResults).length,
                orphanedResults: result.orphanedResults,
                orphanedData: result.orphanedResults.map(k => ({ key: k, data: result.allResults[k] })),
                inconsistent: result.inconsistent,
                logsWithoutResult: result.logsWithoutResult.map(l => ({ recNo: l.receptionNumber, name: l.name, logId: l.id }))
            };
            writeOutput('전체 데이터 진단', summary);
        });

        document.getElementById('pdbgCopyBtn')?.addEventListener('click', () => {
            output.select();
            document.execCommand('copy');
            window.showToast?.('클립보드에 복사됨', 'success');
        });

        document.getElementById('pdbgRepairBtn')?.addEventListener('click', async () => {
            if (!window.firestoreDb?.isEnabled()) {
                writeOutput('Firestore 재동기화', { error: 'Firestore 비활성화 상태' });
                return;
            }
            if (!confirm('Firestore에서 잔류농약 결과 데이터를 재다운로드합니다.\n로컬 데이터와 병합됩니다. 계속하시겠습니까?')) return;
            writeOutput('Firestore 재동기화', { status: '시작...' });
            try {
                await this.syncPesticideTestResultsFromFirestore();
                const after = this.debugAllResults();
                writeOutput('Firestore 재동기화 완료', {
                    totalResults: Object.keys(after.allResults).length,
                    message: '완료. 위 "전체 진단" 버튼으로 재확인하세요'
                });
                this.renderTable?.();
            } catch (e) {
                writeOutput('Firestore 재동기화 실패', { error: e.message });
            }
        });

        // 강제 복원: 타임스탬프 무시, Firestore 데이터로 로컬 완전 덮어쓰기
        document.getElementById('pdbgForceBtn')?.addEventListener('click', async () => {
            if (!window.firestoreDb?.isEnabled()) {
                writeOutput('강제 복원', { error: 'Firestore 비활성화 상태' });
                return;
            }
            const msg =
                '⚠️ 경고 ⚠️\n\n' +
                'Firestore의 데이터로 로컬 데이터를 완전히 덮어씁니다.\n' +
                '타임스탬프를 무시하고 Firestore를 진실의 원천(source of truth)으로 삼습니다.\n\n' +
                '로컬에만 있고 Firestore에 없는 변경사항은 손실됩니다.\n\n' +
                '계속하시겠습니까?';
            if (!confirm(msg)) return;
            writeOutput('강제 복원', { status: '시작...' });
            try {
                const result = await this.forceRestoreFromFirestore();
                writeOutput('강제 복원 완료', result);
                this.renderTable?.();
            } catch (e) {
                writeOutput('강제 복원 실패', { error: e.message, stack: e.stack });
            }
        });
    }

    /**
     * Firestore를 진실의 원천으로 삼아 로컬 데이터 완전 덮어쓰기
     * 타임스탬프 기반 병합을 하지 않음 — Firestore 데이터가 모든 케이스에서 승리
     */
    async forceRestoreFromFirestore() {
        if (!window.firestoreDb?.isEnabled()) {
            throw new Error('Firestore not enabled');
        }
        const year = parseInt(this.selectedYear, 10);
        const cloudData = await window.firestoreDb.getAll('pesticideTestResults', year);

        if (!cloudData || cloudData.length === 0) {
            throw new Error('Firestore에 데이터 없음 (연도: ' + year + ')');
        }

        // Firestore → 로컬 매핑 (타임스탬프 무시)
        const forced = {};
        for (const doc of cloudData) {
            const key = doc._resultKey || doc.id;
            if (!key) continue;
            const { _resultKey, syncedAt, ...rest } = doc;
            forced[key] = rest;
        }

        const lsKey = `pesticideTestResults_${this.selectedYear}`;
        const before = JSON.parse(localStorage.getItem(lsKey) || '{}');

        // 로컬에만 있던 키 추적 (손실 보고용)
        const localOnlyKeys = Object.keys(before).filter(k => !(k in forced));

        // 완전 덮어쓰기
        localStorage.setItem(lsKey, JSON.stringify(forced));
        this._cachedPesticideResults = forced;

        // 접수 데이터 판정도 함께 동기화
        let logSyncCount = 0;
        for (const [resultId, resultData] of Object.entries(forced)) {
            const log = this.sampleLogs.find(l => String(l.id) === String(resultId));
            if (log) {
                const detCount = resultData.detections?.length || 0;
                // judgment 재계산: detections 우선, 그 다음 allNd
                let newJudgment = resultData.judgment || '';
                if (!newJudgment) {
                    if (detCount > 0) newJudgment = 'fail';
                    else if (resultData.allNd) newJudgment = 'pass';
                }
                if (newJudgment && log.testResult !== newJudgment) {
                    log.testResult = newJudgment;
                    logSyncCount++;
                }
            }
        }

        // sampleLogs 저장 (log.testResult 변경 반영)
        if (logSyncCount > 0) {
            this.saveLogs();
        }

        // 1번 시료 확인용 요약
        const rec1 = this.sampleLogs.find(l => String(l.receptionNumber) === '1');
        const rec1Result = rec1 ? forced[rec1.id] : null;

        return {
            restored: Object.keys(forced).length,
            previousLocal: Object.keys(before).length,
            localOnlyKeys: localOnlyKeys,
            localOnlyLost: localOnlyKeys.length,
            logTestResultSynced: logSyncCount,
            rec1_check: rec1Result ? {
                logId: rec1.id,
                allNd: rec1Result.allNd,
                detectionsCount: rec1Result.detections?.length || 0,
                sampleDetection: rec1Result.detections?.[0] || null
            } : '접수번호 1 데이터 없음',
            message: '복원 완료. 접수 목록 새로고침 후 확인하세요'
        };
    }

    openDebugModal() {
        const modal = document.getElementById('pesticideDebugModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        // 자동으로 전체 진단 1회 실행
        document.getElementById('pdbgAllBtn')?.click();
    }

    /**
     * 진단 유틸: 전체 데이터 상태를 스캔해서 불일치/미매칭 보고서 출력
     * 사용: window.pesticideManager.debugAllResults()
     */
    debugAllResults() {
        const year = this.selectedYear;
        const key = `pesticideTestResults_${year}`;
        const raw = localStorage.getItem(key);
        const allResults = raw ? JSON.parse(raw) : {};
        const resultKeys = Object.keys(allResults);
        const logIds = this.sampleLogs.map(l => l.id);

        // 결과 키 vs log ID 비교
        const orphanedResults = resultKeys.filter(k => !logIds.includes(k));
        const logsWithoutResult = this.sampleLogs.filter(l => !allResults[l.id]);
        const inconsistent = resultKeys.filter(k => {
            const r = allResults[k];
            return r.allNd && r.detections?.length > 0;
        });

        console.group(`📊 잔류농약 데이터 진단 (${year}년)`);
        console.log('localStorage 키:', key);
        console.log('총 log 수:', this.sampleLogs.length);
        console.log('총 result 수:', resultKeys.length);
        console.log('orphaned results (log 없는 result):', orphanedResults.length, orphanedResults);
        console.log('logs without result (result 없는 log):', logsWithoutResult.length);
        console.log('inconsistent (allNd+detections 동시):', inconsistent.length, inconsistent);

        // 모든 log의 간단 요약
        const summary = this.sampleLogs.map(l => {
            const r = allResults[l.id];
            return {
                recNo: l.receptionNumber,
                logId: l.id?.slice(0, 8),
                name: l.name,
                log_testResult: l.testResult,
                hasResult: !!r,
                allNd: r?.allNd ?? '-',
                detCount: r?.detections?.length ?? '-',
            };
        });
        console.table(summary);
        console.groupEnd();
        return { allResults, orphanedResults, logsWithoutResult, inconsistent };
    }

    /**
     * 진단 유틸: DevTools 콘솔에서 호출하여 특정 접수번호의 저장 상태 확인
     * 사용: window.pesticideManager.debugTestResult(1)  // 접수번호로 조회
     *      window.pesticideManager.debugTestResult('id-xxx', true)  // logId로 조회
     */
    debugTestResult(ref, byLogId = false) {
        let log;
        if (byLogId) {
            log = this.sampleLogs.find(l => String(l.id) === String(ref));
        } else {
            log = this.sampleLogs.find(l => String(l.receptionNumber) === String(ref));
        }
        if (!log) {
            console.warn('[debug] 접수 데이터 없음:', ref);
            return null;
        }
        const allResults = this.loadAllPesticideTestResults();
        const result = allResults[log.id];
        const report = {
            logId: log.id,
            receptionNumber: log.receptionNumber,
            name: log.name,
            crop: log.requestContent || log.cropName,
            log_testResult: log.testResult,
            analysis: result || null,
            hasAnalysis: !!result,
            allNd: result?.allNd,
            detectionsCount: result?.detections?.length || 0,
            detections: result?.detections,
            inconsistent: result ? (result.allNd && result.detections?.length > 0) : false
        };
        console.table({ [log.receptionNumber]: report });
        console.log('전체 객체:', report);
        return report;
    }

    saveAllPesticideTestResults(results) {
        const key = `pesticideTestResults_${this.selectedYear}`;
        try {
            localStorage.setItem(key, JSON.stringify(results));
            this._cachedPesticideResults = results;
            this.syncPesticideTestResultsToFirestore(results);
        } catch (e) {
            (window.logger?.error || console.error)('잔류농약 검사 결과 저장 실패:', e);
        }
    }

    async syncPesticideTestResultsToFirestore(results) {
        if (!window.firestoreDb?.isEnabled()) return;
        try {
            const year = parseInt(this.selectedYear, 10);
            const entries = Object.entries(results);
            if (entries.length === 0) return;
            const documents = entries.map(([docKey, data]) => ({
                ...data,
                id: docKey,
                _resultKey: docKey,
            }));
            await window.firestoreDb.batchSave('pesticideTestResults', year, documents);
        } catch (e) {
            (window.logger?.error || console.error)('잔류농약 Firestore 동기화 실패:', e);
        }
    }

    /**
     * 분석결과가 "빈 placeholder" 상태인지 판단
     * - detections 없음 + allNd 플래그만 있는 상태는 실제 데이터가 아닌 빈 저장 껍데기로 간주
     * - 단, judgment이 명확히 'pass'로 저장된 경우는 사용자가 의도적으로 "전체 불검출"을 확정한 것으로 봄
     */
    isAnalysisPlaceholder(result) {
        if (!result) return true;
        const hasDetections = Array.isArray(result.detections) && result.detections.length > 0;
        if (hasDetections) return false;
        // detections 없고, judgment도 명확한 pass가 아니면 placeholder로 간주
        if (result.judgment === 'pass') return false;
        // allNd + judgment이 빈 문자열 = 애매한 상태 → placeholder
        return true;
    }

    /**
     * 안전 병합: 두 결과 중 "실 데이터"가 placeholder를 덮어쓰지 않도록
     * @returns {object} 병합된 결과 (cloud 또는 local 중 선택)
     */
    mergeResultSafe(localVal, cloudVal) {
        if (!cloudVal) return localVal;
        if (!localVal) return cloudVal;

        const localIsPlaceholder = this.isAnalysisPlaceholder(localVal);
        const cloudIsPlaceholder = this.isAnalysisPlaceholder(cloudVal);

        // 1) 한 쪽만 placeholder → 실데이터 승
        if (localIsPlaceholder && !cloudIsPlaceholder) return cloudVal;
        if (!localIsPlaceholder && cloudIsPlaceholder) return localVal;

        // 2) 양쪽 다 실데이터 OR 양쪽 다 placeholder → updatedAt 기준
        const localTs = localVal.updatedAt ? new Date(localVal.updatedAt).getTime() : 0;
        const cloudTs = cloudVal.updatedAt ? new Date(cloudVal.updatedAt).getTime() : 0;
        return cloudTs >= localTs ? cloudVal : localVal;
    }

    async syncPesticideTestResultsFromFirestore() {
        if (!window.firestoreDb?.isEnabled()) return;
        try {
            const year = parseInt(this.selectedYear, 10);
            const cloudData = await window.firestoreDb.getAll('pesticideTestResults', year);
            if (!cloudData || cloudData.length === 0) return;

            const cloudMap = {};
            for (const doc of cloudData) {
                const key = doc._resultKey || doc.id;
                if (key) {
                    const { _resultKey, syncedAt, ...rest } = doc;
                    cloudMap[key] = rest;
                }
            }

            const localResults = this.loadAllPesticideTestResults();
            const merged = { ...localResults };
            const conflictLog = { placeholderOverrides: 0, cloudOverrides: 0, localKept: 0 };

            for (const [key, cloudVal] of Object.entries(cloudMap)) {
                const localVal = merged[key];
                const chosen = this.mergeResultSafe(localVal, cloudVal);

                if (chosen === cloudVal && localVal) {
                    if (this.isAnalysisPlaceholder(localVal) && !this.isAnalysisPlaceholder(cloudVal)) {
                        conflictLog.placeholderOverrides++;
                    } else {
                        conflictLog.cloudOverrides++;
                    }
                } else if (chosen === localVal && localVal) {
                    conflictLog.localKept++;
                }
                merged[key] = chosen;
            }

            (window.logger?.info || console.info)('[Pesticide] Firestore 동기화 완료:', conflictLog);
            const lsKey = `pesticideTestResults_${this.selectedYear}`;
            localStorage.setItem(lsKey, JSON.stringify(merged));
            this._cachedPesticideResults = merged;

            // 접수 데이터의 판정도 동기화
            let syncCount = 0;
            for (const [resultId, resultData] of Object.entries(merged)) {
                const log = this.sampleLogs.find(l => String(l.id) === String(resultId));
                if (log && resultData.judgment) {
                    log.testResult = resultData.judgment;
                    syncCount++;
                }
            }
            if (syncCount > 0) {
                this.saveLogs();
                (window.logger?.info || console.log)(`[잔류농약] Firestore → 접수 대장 판정 동기화: ${syncCount}건`);
            }

            this.filterAndRenderLogs();
            (window.logger?.info || console.log)(`[잔류농약] Firestore → localStorage 동기화 완료: ${Object.keys(merged).length}건`);
        } catch (e) {
            (window.logger?.error || console.error)('잔류농약 Firestore 로드 실패:', e);
        }
    }
}

// ========================================
// 인스턴스 생성 및 초기화
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    const manager = new PesticideSampleManager();
    await manager.init();
    window.pesticideManager = manager;
});
