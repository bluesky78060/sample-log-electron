// ========================================
// 수질분석 시료 전용 스크립트
// ========================================
const SAMPLE_TYPE = '물';
const STORAGE_KEY = 'waterSampleLogs';
const AUTO_SAVE_FILE = 'water-autosave.json';

// ========================================
// Electron / Web 환경 감지 및 파일 API 추상화
// ========================================
const isElectron = window.electronAPI?.isElectron === true;

// Electron 환경에서의 파일 시스템 API
const FileAPI = {
    autoSavePath: null,

    async init() {
        if (isElectron) {
            this.autoSavePath = await window.electronAPI.getAutoSavePath('water');
            console.log('📁 Electron 수질 자동 저장 경로:', this.autoSavePath);
        }
    },

    async saveFile(content, suggestedName = 'water-data.json') {
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

    async autoSave(content) {
        if (isElectron && this.autoSavePath) {
            const result = await window.electronAPI.writeFile(this.autoSavePath, content);
            return result.success;
        }
        return false;
    },

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

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 수질분석 페이지 로드 시작');
    console.log(isElectron ? '🖥️ Electron 환경' : '🌐 웹 브라우저 환경');

    await FileAPI.init();

    // Electron 환경: 자동 저장 기본 활성화 및 첫 실행 시 폴더 선택
    if (isElectron) {
        const autoSaveToggle = document.getElementById('autoSaveToggle');
        const hasSelectedFolder = localStorage.getItem('waterAutoSaveFolderSelected') === 'true';

        // 처음 실행이거나 폴더가 선택되지 않은 경우
        if (!hasSelectedFolder) {
            // 잠시 후 폴더 선택 다이얼로그 표시 (UI 로드 후)
            setTimeout(async () => {
                const confirmSelect = confirm('수질분석 자동 저장 기능을 사용하시겠습니까?\n\n저장할 폴더를 선택해주세요.');
                if (confirmSelect) {
                    try {
                        const result = await window.electronAPI.selectAutoSaveFolder();
                        if (result.success) {
                            FileAPI.autoSavePath = await window.electronAPI.getAutoSavePath('water');
                            localStorage.setItem('waterAutoSaveFolderSelected', 'true');
                            localStorage.setItem('waterAutoSaveEnabled', 'true');
                            if (autoSaveToggle) {
                                autoSaveToggle.checked = true;
                            }
                            console.log('📁 수질 자동 저장 폴더 설정됨:', result.folder);
                        }
                    } catch (error) {
                        console.error('폴더 선택 오류:', error);
                    }
                }
            }, 500);
        } else {
            // 이전에 폴더를 선택한 경우, 자동 저장 기본 활성화
            localStorage.setItem('waterAutoSaveEnabled', 'true');
            if (autoSaveToggle) {
                autoSaveToggle.checked = true;
            }
        }
    }

    // ========================================
    // DOM 요소
    // ========================================
    const form = document.getElementById('sampleForm');
    const tableBody = document.getElementById('logTableBody');
    const emptyState = document.getElementById('emptyState');
    const dateInput = document.getElementById('date');
    const navItems = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const recordCountEl = document.getElementById('recordCount');

    // 오늘 날짜 설정
    dateInput.valueAsDate = new Date();

    // ========================================
    // 년도 선택 기능
    // ========================================
    const yearSelect = document.getElementById('yearSelect');
    const listViewTitle = document.getElementById('listViewTitle');
    let selectedYear = new Date().getFullYear().toString();

    // 현재 년도로 드롭다운 기본값 설정
    if (yearSelect) {
        yearSelect.value = selectedYear;
    }

    // 년도별 스토리지 키 생성
    function getStorageKey(year) {
        return `${STORAGE_KEY}_${year}`;
    }

    // 년도 선택 시 제목 업데이트
    function updateListViewTitle() {
        if (listViewTitle) {
            listViewTitle.textContent = `${selectedYear}년 수질분석 접수 목록`;
        }
    }

    // 초기 제목 설정
    updateListViewTitle();

    // ========================================
    // 데이터 로드 (년도별)
    // ========================================
    let sampleLogs = JSON.parse(localStorage.getItem(getStorageKey(selectedYear))) || [];

    // 기존 데이터 마이그레이션 (년도 없는 기존 데이터를 현재 년도로 이동)
    const oldData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (oldData.length > 0 && sampleLogs.length === 0) {
        sampleLogs = oldData;
        localStorage.setItem(getStorageKey(selectedYear), JSON.stringify(sampleLogs));
        console.log('📂 기존 데이터를 년도별 저장소로 마이그레이션:', sampleLogs.length, '건');
    }

    // 년도별 데이터 로드 함수
    function loadYearData(year) {
        const yearStorageKey = getStorageKey(year);
        sampleLogs = JSON.parse(localStorage.getItem(yearStorageKey)) || [];
        renderLogs(sampleLogs);
        receptionNumberInput.value = generateNextReceptionNumber();
        updateListViewTitle();
    }

    // 년도 선택 이벤트
    if (yearSelect) {
        yearSelect.addEventListener('change', (e) => {
            selectedYear = e.target.value;
            loadYearData(selectedYear);
        });
    }

    // ========================================
    // 뷰 전환
    // ========================================
    function switchView(viewName) {
        views.forEach(view => view.classList.remove('active'));
        navItems.forEach(nav => nav.classList.remove('active'));

        const targetView = document.getElementById(`${viewName}View`);
        const targetNav = document.querySelector(`.nav-btn[data-view="${viewName}"]`);

        if (targetView) targetView.classList.add('active');
        if (targetNav) targetNav.classList.add('active');

        if (viewName === 'list') {
            renderLogs(sampleLogs);
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const viewName = item.dataset.view;
            switchView(viewName);
        });
    });

    // 빈 상태에서 "새 시료 접수하기" 버튼
    const btnGoForm = document.querySelector('.btn-go-form');
    if (btnGoForm) {
        btnGoForm.addEventListener('click', () => switchView('form'));
    }

    // ========================================
    // 토스트 메시지
    // ========================================
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = { success: '✓', error: '✗', warning: '⚠' };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.success}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ========================================
    // 레코드 카운트 업데이트
    // ========================================
    function updateRecordCount() {
        if (recordCountEl) {
            recordCountEl.textContent = `${sampleLogs.length}건`;
        }
    }

    // ========================================
    // 전화번호 자동 하이픈
    // ========================================
    const phoneNumberInput = document.getElementById('phoneNumber');
    if (phoneNumberInput) {
        phoneNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, '');
            let formattedValue = '';

            if (value.length <= 3) {
                formattedValue = value;
            } else if (value.length <= 7) {
                formattedValue = value.slice(0, 3) + '-' + value.slice(3);
            } else if (value.length <= 11) {
                formattedValue = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
            } else {
                formattedValue = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
            }

            e.target.value = formattedValue;
        });
    }

    // ========================================
    // 통보방법 선택
    // ========================================
    const receptionMethodBtns = document.querySelectorAll('.reception-method-btn');
    const receptionMethodInput = document.getElementById('receptionMethod');

    receptionMethodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            receptionMethodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            receptionMethodInput.value = btn.dataset.method;
        });
    });

    // ========================================
    // 주소 검색
    // ========================================
    const searchAddressBtn = document.getElementById('searchAddressBtn');
    const addressPostcode = document.getElementById('addressPostcode');
    const addressRoad = document.getElementById('addressRoad');
    const addressDetail = document.getElementById('addressDetail');
    const addressHidden = document.getElementById('address');
    const addressModal = document.getElementById('addressModal');
    const closeAddressModalBtn = document.getElementById('closeAddressModal');
    const daumPostcodeContainer = document.getElementById('daumPostcodeContainer');

    function closeAddressModal() {
        addressModal.classList.add('hidden');
        setTimeout(() => {
            if (daumPostcodeContainer) {
                daumPostcodeContainer.innerHTML = '';
            }
        }, 100);
    }

    if (closeAddressModalBtn) {
        closeAddressModalBtn.addEventListener('click', closeAddressModal);
    }
    if (addressModal) {
        addressModal.querySelector('.modal-overlay').addEventListener('click', closeAddressModal);
    }

    if (searchAddressBtn) {
        searchAddressBtn.addEventListener('click', () => {
            if (typeof daum === 'undefined' || typeof daum.Postcode === 'undefined') {
                alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                return;
            }

            addressModal.classList.remove('hidden');
            daumPostcodeContainer.innerHTML = '';

            new daum.Postcode({
                oncomplete: function(data) {
                    let roadAddr = data.roadAddress;
                    let extraRoadAddr = '';

                    if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                        extraRoadAddr += data.bname;
                    }
                    if (data.buildingName !== '' && data.apartment === 'Y') {
                        extraRoadAddr += (extraRoadAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                    }
                    if (extraRoadAddr !== '') {
                        extraRoadAddr = ' (' + extraRoadAddr + ')';
                    }

                    const finalRoadAddr = roadAddr + extraRoadAddr;

                    addressPostcode.value = data.zonecode;
                    addressRoad.value = finalRoadAddr;
                    addressDetail.value = '';

                    updateFullAddress();
                    closeAddressModal();
                    addressDetail.focus();
                },
                width: '100%',
                height: '100%'
            }).embed(daumPostcodeContainer);
        });
    }

    if (addressDetail) {
        addressDetail.addEventListener('input', updateFullAddress);
    }

    function updateFullAddress() {
        const postcode = addressPostcode.value;
        const road = addressRoad.value;
        const detail = addressDetail.value;

        if (postcode && road) {
            addressHidden.value = `(${postcode}) ${road}${detail ? ' ' + detail : ''}`;
        } else {
            addressHidden.value = '';
        }
    }

    // ========================================
    // 검사항목 선택 시 상세정보 토글
    // ========================================
    const testItemRadios = document.querySelectorAll('input[name="testItems"]');
    const livingWaterItems = document.getElementById('livingWaterItems');
    const agriculturalWaterItems = document.getElementById('agriculturalWaterItems');

    testItemRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === '생활용수') {
                livingWaterItems.classList.add('active');
                agriculturalWaterItems.classList.remove('active');
            } else {
                livingWaterItems.classList.remove('active');
                agriculturalWaterItems.classList.add('active');
            }
        });
    });

    // ========================================
    // 접수번호 자동 생성
    // ========================================
    const receptionNumberInput = document.getElementById('receptionNumber');

    function generateNextReceptionNumber() {
        let maxNumber = 0;

        sampleLogs.forEach(log => {
            if (log.receptionNumber) {
                // 수질은 쉼표로 구분된 개별 번호 형식 (예: "5, 6, 7")
                // 마지막 번호를 찾아서 그 다음 번호를 반환
                const numbers = log.receptionNumber.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
                if (numbers.length > 0) {
                    const lastNum = Math.max(...numbers);
                    if (lastNum > maxNumber) {
                        maxNumber = lastNum;
                    }
                }
            }
        });

        const nextNumber = maxNumber + 1;
        return String(nextNumber);
    }

    receptionNumberInput.value = generateNextReceptionNumber();

    // 수정 모드 상태 변수 (상단에 선언)
    let editingId = null;

    // ========================================
    // 동적 채취장소 관리
    // ========================================
    const sampleCountInput = document.getElementById('sampleCount');
    const samplingLocationsList = document.getElementById('samplingLocationsList');
    const locationCountBadge = document.getElementById('locationCountBadge');

    // 채취장소 필드 생성 함수
    function createSamplingLocationItem(index) {
        const item = document.createElement('div');
        item.className = 'sampling-location-item';
        item.dataset.index = index;
        item.innerHTML = `
            <span class="location-number">${index + 1}</span>
            <div class="location-autocomplete-wrapper">
                <input type="text" class="sampling-location-input" name="samplingLocations[]" required placeholder="리+지번 입력 (예: 내성리 123)">
                <ul class="location-autocomplete-list"></ul>
            </div>
            <input type="text" class="sampling-crop-input" name="samplingCrops[]" placeholder="주작목">
        `;
        return item;
    }

    // 채취장소 필드 개수 업데이트
    function updateSamplingLocations(count) {
        const currentCount = samplingLocationsList.children.length;
        count = Math.max(1, parseInt(count) || 1);

        // 필드 추가
        if (count > currentCount) {
            for (let i = currentCount; i < count; i++) {
                const item = createSamplingLocationItem(i);
                samplingLocationsList.appendChild(item);
                // 새로 추가된 필드에 자동완성 바인딩
                bindLocationAutocomplete(item.querySelector('.sampling-location-input'), item.querySelector('.location-autocomplete-list'));
            }
        }
        // 필드 제거
        else if (count < currentCount) {
            for (let i = currentCount - 1; i >= count; i--) {
                samplingLocationsList.children[i].remove();
            }
        }

        // 배지 업데이트
        locationCountBadge.textContent = `${count}개`;
    }

    // 접수번호 범위 업데이트 (시료수에 따라) - 수질은 개별 번호 형식 (1, 2, 3)
    function updateReceptionNumberRange(count) {
        count = Math.max(1, parseInt(count) || 1);
        const baseNumber = parseInt(receptionNumberInput.dataset.baseNumber || receptionNumberInput.value.split(',')[0].trim(), 10);

        if (count === 1) {
            receptionNumberInput.value = String(baseNumber);
        } else {
            // 수질은 개별 번호로 표시 (예: "5, 6, 7")
            const numbers = [];
            for (let i = 0; i < count; i++) {
                numbers.push(baseNumber + i);
            }
            receptionNumberInput.value = numbers.join(', ');
        }
    }

    // 초기 기본 번호 저장
    receptionNumberInput.dataset.baseNumber = receptionNumberInput.value;

    // 시료수 변경 시 채취장소 필드 및 접수번호 업데이트
    if (sampleCountInput) {
        sampleCountInput.addEventListener('change', (e) => {
            updateSamplingLocations(e.target.value);
            updateReceptionNumberRange(e.target.value);
        });
        sampleCountInput.addEventListener('input', (e) => {
            updateSamplingLocations(e.target.value);
            updateReceptionNumberRange(e.target.value);
        });
    }

    // 채취장소 추가/삭제 버튼
    const btnAddLocation = document.getElementById('btnAddLocation');
    const btnRemoveLocation = document.getElementById('btnRemoveLocation');

    if (btnAddLocation) {
        btnAddLocation.addEventListener('click', () => {
            const currentCount = samplingLocationsList.children.length;
            const newCount = currentCount + 1;
            updateSamplingLocations(newCount);
            // 시료수도 동기화
            if (sampleCountInput) {
                sampleCountInput.value = newCount;
            }
            updateReceptionNumberRange(newCount);
        });
    }

    if (btnRemoveLocation) {
        btnRemoveLocation.addEventListener('click', () => {
            const currentCount = samplingLocationsList.children.length;
            if (currentCount > 1) {
                const newCount = currentCount - 1;
                updateSamplingLocations(newCount);
                // 시료수도 동기화
                if (sampleCountInput) {
                    sampleCountInput.value = newCount;
                }
                updateReceptionNumberRange(newCount);
            }
        });
    }

    // ========================================
    // 채취장소 자동완성 (경상북도 전체)
    // ========================================

    // 경상북도 전체 시/군 목록
    const GYEONGBUK_REGIONS = [
        'pohang', 'gyeongju', 'gimcheon', 'andong', 'gumi',
        'yeongcheon', 'sangju', 'mungyeong', 'gyeongsan',
        'gunwi', 'uiseong', 'cheongsong', 'yeongyang', 'yeongdeok',
        'cheongdo', 'goryeong', 'seongju', 'chilgok', 'yecheon',
        'bonghwa', 'ulleung', 'yeongju', 'uljin'
    ];

    // 경상북도 시/군 한글명 목록 (주소 시작 체크용)
    const GYEONGBUK_REGION_NAMES = [
        '포항시', '경주시', '김천시', '안동시', '구미시',
        '영천시', '상주시', '문경시', '경산시',
        '군위군', '의성군', '청송군', '영양군', '영덕군',
        '청도군', '고령군', '성주군', '칠곡군', '예천군',
        '봉화군', '울릉군', '영주시', '울진군'
    ];

    function bindLocationAutocomplete(input, autocompleteList) {
        if (!input || !autocompleteList) {
            console.warn('채취장소 자동완성: input 또는 autocompleteList가 없습니다');
            return;
        }
        if (typeof suggestRegionVillages !== 'function') {
            console.warn('채취장소 자동완성: suggestRegionVillages 함수를 찾을 수 없습니다');
            return;
        }

        // 입력 시 자동완성 목록 표시
        input.addEventListener('input', (e) => {
            const value = e.target.value.trim();

            // 이미 완전한 주소면 자동완성 비활성화 (시/군으로 시작)
            if (GYEONGBUK_REGION_NAMES.some(name => value.startsWith(name))) {
                autocompleteList.classList.remove('show');
                return;
            }

            if (value.length >= 1) {
                // 경상북도 전체에서 검색 (null을 전달하면 기본값으로 전체 검색)
                const suggestions = suggestRegionVillages(value, null);

                if (suggestions.length > 0) {
                    autocompleteList.innerHTML = suggestions.map(item => `
                        <li data-village="${item.village}" data-district="${item.district}" data-region="${item.region}">
                            ${item.displayText}
                        </li>
                    `).join('');
                    autocompleteList.classList.add('show');
                } else {
                    autocompleteList.classList.remove('show');
                }
            } else {
                autocompleteList.classList.remove('show');
            }
        });

        // Enter 키 처리 - 주소 변환
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = input.value.trim();

                // 이미 완전한 주소면 무시
                if (GYEONGBUK_REGION_NAMES.some(name => value.startsWith(name))) {
                    autocompleteList.classList.remove('show');
                    return;
                }

                if (typeof parseParcelAddress === 'function') {
                    const result = parseParcelAddress(value);
                    if (result) {
                        // 여러 지역에서 중복되는 경우 (isDuplicate: true)
                        if (result.isDuplicate && result.locations) {
                            autocompleteList.innerHTML = result.locations.map(loc => `
                                <li data-village="${result.villageName}" data-district="${loc.district}" data-region="${loc.region}" data-lot="${result.lotNumber || ''}">
                                    ${loc.fullAddress} ${result.lotNumber || ''}
                                </li>
                            `).join('');
                            autocompleteList.classList.add('show');
                        }
                        // 단일 지역 내 중복인 경우
                        else if (result.alternatives && result.alternatives.length > 1) {
                            autocompleteList.innerHTML = result.alternatives.map(district => `
                                <li data-village="${result.village}" data-district="${district}" data-lot="${result.lotNumber}" data-region="${result.region}">
                                    ${result.region} ${district} ${result.village} ${result.lotNumber || ''}
                                </li>
                            `).join('');
                            autocompleteList.classList.add('show');
                        } else {
                            // 단일 매칭 - 바로 변환
                            input.value = result.fullAddress;
                            autocompleteList.classList.remove('show');
                        }
                    }
                }
            }
        });

        // 자동완성 목록 클릭 시
        autocompleteList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const village = e.target.dataset.village;
                const district = e.target.dataset.district;
                const region = e.target.dataset.region;
                const lot = e.target.dataset.lot;

                // 지번이 있으면 포함
                const fullAddress = lot
                    ? `${region} ${district} ${village} ${lot}`
                    : `${region} ${district} ${village}`;

                input.value = fullAddress;
                autocompleteList.classList.remove('show');
            }
        });

        // 포커스 아웃 시 목록 숨김
        input.addEventListener('blur', () => {
            setTimeout(() => {
                autocompleteList.classList.remove('show');
            }, 200);
        });
    }

    // 초기 채취장소 필드에 자동완성 바인딩
    const initialLocationItems = samplingLocationsList.querySelectorAll('.sampling-location-item');
    console.log('초기 채취장소 필드 개수:', initialLocationItems.length);
    console.log('suggestRegionVillages 함수 존재:', typeof suggestRegionVillages === 'function');
    console.log('parseRegionAddress 함수 존재:', typeof parseRegionAddress === 'function');

    initialLocationItems.forEach((item, index) => {
        const input = item.querySelector('.sampling-location-input');
        const list = item.querySelector('.location-autocomplete-list');
        console.log(`채취장소 ${index + 1} 바인딩:`, { input: !!input, list: !!list });
        bindLocationAutocomplete(input, list);
    });

    // 모든 채취장소 값 가져오기
    function getAllSamplingLocations() {
        const inputs = samplingLocationsList.querySelectorAll('.sampling-location-input');
        return Array.from(inputs).map(input => input.value.trim()).filter(v => v);
    }

    // 모든 주작목 값 가져오기
    function getAllSamplingCrops() {
        const inputs = samplingLocationsList.querySelectorAll('.sampling-crop-input');
        return Array.from(inputs).map(input => input.value.trim());
    }

    // 채취장소와 주작목 값 설정 (수정 시 사용)
    function setSamplingLocations(locations, crops = []) {
        if (!Array.isArray(locations)) {
            locations = [locations];
        }
        if (!Array.isArray(crops)) {
            crops = [crops];
        }
        locations = locations.filter(l => l);

        const count = Math.max(1, locations.length);
        updateSamplingLocations(count);

        const locationInputs = samplingLocationsList.querySelectorAll('.sampling-location-input');
        const cropInputs = samplingLocationsList.querySelectorAll('.sampling-crop-input');

        locations.forEach((loc, i) => {
            if (locationInputs[i]) {
                locationInputs[i].value = loc;
            }
            if (cropInputs[i] && crops[i]) {
                cropInputs[i].value = crops[i];
            }
        });
    }

    // ========================================
    // 폼 제출
    // ========================================
    const navSubmitBtn = document.getElementById('navSubmitBtn');
    const navResetBtn = document.getElementById('navResetBtn');

    if (navSubmitBtn) {
        navSubmitBtn.addEventListener('click', () => {
            if (form.checkValidity()) {
                if (editingId) {
                    updateSample();
                } else {
                    submitForm();
                }
            } else {
                form.reportValidity();
            }
        });
    }

    if (navResetBtn) {
        navResetBtn.addEventListener('click', () => {
            if (confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
                resetForm();
            }
        });
    }

    function submitForm() {
        const formData = new FormData(form);
        const samplingLocations = getAllSamplingLocations();
        const samplingCrops = getAllSamplingCrops();

        // 접수번호 파싱 (예: "1, 2, 3" -> [1, 2, 3])
        const receptionNumberStr = formData.get('receptionNumber') || generateNextReceptionNumber();
        const receptionNumbers = receptionNumberStr.split(',').map(n => n.trim()).filter(n => n);

        // 공통 데이터 (신청자 정보)
        const commonData = {
            sampleType: SAMPLE_TYPE,
            date: formData.get('date'),
            name: formData.get('name'),
            phoneNumber: formData.get('phoneNumber'),
            address: formData.get('address'),
            addressPostcode: formData.get('addressPostcode'),
            addressRoad: formData.get('addressRoad'),
            addressDetail: formData.get('addressDetail'),
            receptionMethod: formData.get('receptionMethod'),
            sampleName: formData.get('sampleName'),
            purpose: formData.get('purpose'),
            testItems: formData.get('testItems'),
            note: formData.get('note'),
            isComplete: false,
            createdAt: new Date().toISOString()
        };

        // 채취장소별로 개별 행 생성
        const newLogs = [];
        for (let i = 0; i < samplingLocations.length; i++) {
            const data = {
                ...commonData,
                id: Date.now().toString() + '_' + i,
                receptionNumber: receptionNumbers[i] || String(parseInt(receptionNumbers[0], 10) + i),
                sampleCount: '1', // 각 행은 시료 1개
                samplingLocation: samplingLocations[i] || '',
                mainCrop: samplingCrops[i] || ''
            };
            newLogs.push(data);
            sampleLogs.push(data);
        }

        saveLogs();

        const totalCount = samplingLocations.length;
        showToast(`시료 ${totalCount}건이 등록되었습니다.`, 'success');

        // 결과 모달 표시 (첫 번째 데이터 기준, 전체 개수 표시)
        const resultData = {
            ...newLogs[0],
            receptionNumber: receptionNumbers.join(', '),
            sampleCount: String(totalCount),
            samplingLocation: samplingLocations.join(', '),
            mainCrop: samplingCrops.filter(c => c).join(', ')
        };
        showRegistrationResult(resultData);

        resetForm();
        receptionNumberInput.value = generateNextReceptionNumber();
    }

    function resetForm() {
        form.reset();
        dateInput.valueAsDate = new Date();
        receptionMethodBtns.forEach(b => b.classList.remove('active'));
        receptionMethodInput.value = '';

        // 검사항목 초기화
        const livingWaterRadio = document.querySelector('input[name="testItems"][value="생활용수"]');
        if (livingWaterRadio) {
            livingWaterRadio.checked = true;
            livingWaterItems.classList.add('active');
            agriculturalWaterItems.classList.remove('active');
        }

        // 채취장소 및 주작목 초기화 (1개로 리셋)
        updateSamplingLocations(1);
        const firstLocationInput = samplingLocationsList.querySelector('.sampling-location-input');
        const firstCropInput = samplingLocationsList.querySelector('.sampling-crop-input');
        if (firstLocationInput) {
            firstLocationInput.value = '';
        }
        if (firstCropInput) {
            firstCropInput.value = '';
        }

        // 접수번호 갱신 및 기본 번호 저장
        const nextNumber = generateNextReceptionNumber();
        receptionNumberInput.value = nextNumber;
        receptionNumberInput.dataset.baseNumber = nextNumber;

        // 수정 모드 해제
        editingId = null;

        // 제출 버튼 스타일 복원
        if (navSubmitBtn) {
            navSubmitBtn.title = '접수 등록';
            navSubmitBtn.classList.remove('btn-edit-mode');
        }
    }

    // ========================================
    // 등록 결과 모달
    // ========================================
    const registrationResultModal = document.getElementById('registrationResultModal');
    const closeRegistrationModal = document.getElementById('closeRegistrationModal');
    const closeResultBtn = document.getElementById('closeResultBtn');
    const resultTableBody = document.getElementById('resultTableBody');

    function showRegistrationResult(data) {
        if (!registrationResultModal || !resultTableBody) return;

        resultTableBody.innerHTML = `
            <tr><th>접수번호</th><td>${data.receptionNumber}</td></tr>
            <tr><th>접수일자</th><td>${data.date}</td></tr>
            <tr><th>성명</th><td>${data.name}</td></tr>
            <tr><th>연락처</th><td>${data.phoneNumber}</td></tr>
            <tr><th>시료명</th><td>${data.sampleName}</td></tr>
            <tr><th>시료수</th><td>${data.sampleCount}점</td></tr>
            <tr><th>채취장소</th><td>${data.samplingLocation}</td></tr>
            <tr><th>목적</th><td>${data.purpose}</td></tr>
            <tr><th>검사항목</th><td>${data.testItems}</td></tr>
            <tr><th>통보방법</th><td>${data.receptionMethod || '-'}</td></tr>
            <tr><th>비고</th><td>${data.note || '-'}</td></tr>
        `;

        registrationResultModal.classList.remove('hidden');
    }

    if (closeRegistrationModal) {
        closeRegistrationModal.addEventListener('click', () => {
            registrationResultModal.classList.add('hidden');
        });
    }
    if (closeResultBtn) {
        closeResultBtn.addEventListener('click', () => {
            registrationResultModal.classList.add('hidden');
        });
    }
    if (registrationResultModal) {
        registrationResultModal.querySelector('.modal-overlay').addEventListener('click', () => {
            registrationResultModal.classList.add('hidden');
        });
    }

    // ========================================
    // 데이터 저장
    // ========================================
    function saveLogs() {
        const yearStorageKey = getStorageKey(selectedYear);
        localStorage.setItem(yearStorageKey, JSON.stringify(sampleLogs));
        updateRecordCount();

        // 자동 저장 (Electron 환경)
        if (isElectron && FileAPI.autoSavePath && document.getElementById('autoSaveToggle')?.checked) {
            const autoSaveContent = JSON.stringify(sampleLogs, null, 2);
            FileAPI.autoSave(autoSaveContent);
            console.log('💾 수질 데이터 자동 저장');
        }
    }

    // ========================================
    // 목록 렌더링
    // ========================================
    function renderLogs(logs) {
        tableBody.innerHTML = '';

        if (logs.length === 0) {
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';

        logs.forEach(log => {
            const row = document.createElement('tr');
            row.dataset.id = log.id;

            // 주소에서 우편번호 분리 (예: "(12345) 서울시..." -> 우편번호: "12345", 주소: "서울시...")
            const addressFull = log.address || '';
            const zipMatch = addressFull.match(/^\((\d{5})\)\s*/);
            const zipcode = zipMatch ? zipMatch[1] : (log.addressPostcode || '');
            const addressOnly = zipMatch ? addressFull.replace(zipMatch[0], '') : addressFull;

            row.innerHTML = `
                <td class="col-checkbox">
                    <input type="checkbox" class="row-checkbox" data-id="${log.id}">
                </td>
                <td class="col-complete">
                    <button class="btn-complete ${log.isComplete ? 'completed' : ''}" data-id="${log.id}" title="${log.isComplete ? '완료됨' : '완료 표시'}">
                        ${log.isComplete ? '✅' : '⬜'}
                    </button>
                </td>
                <td>${log.receptionNumber || '-'}</td>
                <td>${log.date || '-'}</td>
                <td>${log.name || '-'}</td>
                <td class="col-zipcode hidden">${zipcode || '-'}</td>
                <td class="text-truncate" title="${addressOnly || ''}">${addressOnly || '-'}</td>
                <td>${log.sampleName || '-'}</td>
                <td>${log.sampleCount || 1}점</td>
                <td class="text-truncate" title="${log.samplingLocation || ''}">${log.samplingLocation || '-'}</td>
                <td class="text-truncate" title="${log.mainCrop || ''}">${log.mainCrop || '-'}</td>
                <td>${log.purpose || '-'}</td>
                <td>${log.testItems || '-'}</td>
                <td>${log.phoneNumber || '-'}</td>
                <td>${log.receptionMethod || '-'}</td>
                <td class="col-note text-truncate" title="${log.note || ''}">${log.note || '-'}</td>
                <td class="col-action">
                    <button class="btn-edit" data-id="${log.id}" title="수정">✏️</button>
                    <button class="btn-delete" data-id="${log.id}" title="삭제">🗑️</button>
                </td>
            `;

            if (log.isComplete) {
                row.classList.add('completed-row');
            }

            tableBody.appendChild(row);
        });

        // 이벤트 바인딩
        bindTableEvents();
        updateRecordCount();
    }

    function bindTableEvents() {
        // 완료 버튼
        document.querySelectorAll('.btn-complete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                toggleComplete(id);
            });
        });

        // 삭제 버튼
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('이 항목을 삭제하시겠습니까?')) {
                    deleteSample(id);
                }
            });
        });

        // 수정 버튼
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                editSample(id);
            });
        });
    }

    function toggleComplete(id) {
        const log = sampleLogs.find(l => l.id === id);
        if (log) {
            log.isComplete = !log.isComplete;
            saveLogs();
            renderLogs(sampleLogs);
        }
    }

    function deleteSample(id) {
        sampleLogs = sampleLogs.filter(l => l.id !== id);
        saveLogs();
        renderLogs(sampleLogs);
        showToast('삭제되었습니다.', 'success');
    }

    function editSample(id) {
        const log = sampleLogs.find(l => l.id === id);
        if (!log) return;

        editingId = id;

        try {
            // 폼에 데이터 채우기
            if (receptionNumberInput) receptionNumberInput.value = log.receptionNumber || '';
            if (dateInput) dateInput.value = log.date || '';

            const nameEl = document.getElementById('name');
            const phoneEl = document.getElementById('phoneNumber');
            const sampleNameEl = document.getElementById('sampleName');
            const sampleCountEl = document.getElementById('sampleCount');
            const noteEl = document.getElementById('note');

            if (nameEl) nameEl.value = log.name || '';
            if (phoneEl) phoneEl.value = log.phoneNumber || '';
            if (addressPostcode) addressPostcode.value = log.addressPostcode || '';
            if (addressRoad) addressRoad.value = log.addressRoad || '';
            if (addressDetail) addressDetail.value = log.addressDetail || '';
            if (addressHidden) addressHidden.value = log.address || '';
            if (sampleNameEl) sampleNameEl.value = log.sampleName || '';
            if (sampleCountEl) sampleCountEl.value = log.sampleCount || 1;
            if (noteEl) noteEl.value = log.note || '';

            // 채취장소 및 주작목 설정 (배열 또는 문자열)
            const crops = log.samplingCrops || [];
            if (log.samplingLocations && Array.isArray(log.samplingLocations)) {
                setSamplingLocations(log.samplingLocations, crops);
            } else if (log.samplingLocation) {
                // 이전 데이터 호환: 문자열을 쉼표로 분리
                const locations = log.samplingLocation.split(',').map(s => s.trim());
                setSamplingLocations(locations, crops);
            }

            // 통보방법 선택
            if (receptionMethodBtns) {
                receptionMethodBtns.forEach(b => {
                    b.classList.toggle('active', b.dataset.method === log.receptionMethod);
                });
            }
            if (receptionMethodInput) receptionMethodInput.value = log.receptionMethod || '';

            // 목적 선택
            const purposeRadio = document.querySelector(`input[name="purpose"][value="${log.purpose}"]`);
            if (purposeRadio) purposeRadio.checked = true;

            // 검사항목 선택
            const testItemsRadio = document.querySelector(`input[name="testItems"][value="${log.testItems}"]`);
            if (testItemsRadio) {
                testItemsRadio.checked = true;
                if (log.testItems === '생활용수') {
                    if (livingWaterItems) livingWaterItems.classList.add('active');
                    if (agriculturalWaterItems) agriculturalWaterItems.classList.remove('active');
                } else {
                    if (livingWaterItems) livingWaterItems.classList.remove('active');
                    if (agriculturalWaterItems) agriculturalWaterItems.classList.add('active');
                }
            }

            switchView('form');
            showToast('수정 모드입니다. 변경 후 등록 버튼을 클릭하세요.', 'warning');

            // 제출 버튼 스타일 변경 (수정 모드 표시)
            if (navSubmitBtn) {
                navSubmitBtn.title = '수정 완료';
                navSubmitBtn.classList.add('btn-edit-mode');
            }
        } catch (error) {
            console.error('editSample 에러:', error);
            showToast('수정 모드 전환 중 오류가 발생했습니다.', 'error');
        }
    }

    function updateSample() {
        const formData = new FormData(form);
        const log = sampleLogs.find(l => l.id === editingId);
        const samplingLocations = getAllSamplingLocations();
        const samplingCrops = getAllSamplingCrops();

        if (log) {
            log.receptionNumber = formData.get('receptionNumber');
            log.date = formData.get('date');
            log.name = formData.get('name');
            log.phoneNumber = formData.get('phoneNumber');
            log.address = formData.get('address');
            log.addressPostcode = formData.get('addressPostcode');
            log.addressRoad = formData.get('addressRoad');
            log.addressDetail = formData.get('addressDetail');
            log.receptionMethod = formData.get('receptionMethod');
            log.sampleName = formData.get('sampleName');
            log.sampleCount = formData.get('sampleCount');
            log.samplingLocations = samplingLocations;
            log.samplingLocation = samplingLocations.join(', '); // 호환성을 위해 문자열로도 저장
            log.samplingCrops = samplingCrops;
            log.mainCrop = samplingCrops.filter(c => c).join(', '); // 호환성을 위해 문자열로도 저장
            log.purpose = formData.get('purpose');
            log.testItems = formData.get('testItems');
            log.note = formData.get('note');
            log.updatedAt = new Date().toISOString();

            saveLogs();
            showToast('수정이 완료되었습니다.', 'success');
            resetForm();
            receptionNumberInput.value = generateNextReceptionNumber();
            editingId = null;

            // 제출 버튼 원래대로
            if (navSubmitBtn) {
                navSubmitBtn.title = '접수 등록';
                navSubmitBtn.classList.remove('btn-edit-mode');
            }

            // 목록 뷰로 전환
            switchView('list');
        }
    }

    // ========================================
    // 전체 선택 / 선택 삭제
    // ========================================
    const selectAllCheckbox = document.getElementById('selectAll');
    const btnBulkDelete = document.getElementById('btnBulkDelete');

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.row-checkbox');
            checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
        });
    }

    // ========================================
    // 라벨 인쇄 기능
    // ========================================
    const btnLabelPrint = document.getElementById('btnLabelPrint');

    if (btnLabelPrint) {
        btnLabelPrint.addEventListener('click', () => {
            const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.dataset.id);

            if (selectedIds.length === 0) {
                // 선택된 항목이 없으면 전체 데이터 사용 여부 확인
                if (sampleLogs.length === 0) {
                    alert('인쇄할 데이터가 없습니다.');
                    return;
                }

                if (!confirm(`선택된 항목이 없습니다.\n전체 ${sampleLogs.length}건을 라벨 인쇄하시겠습니까?`)) {
                    return;
                }

                // 전체 데이터로 라벨 인쇄
                openLabelPrintWithData(sampleLogs);
            } else {
                // 선택된 데이터만 라벨 인쇄
                const selectedLogs = sampleLogs.filter(log => selectedIds.includes(log.id));
                openLabelPrintWithData(selectedLogs);
            }
        });
    }

    // 라벨 인쇄 페이지로 데이터 전달
    function openLabelPrintWithData(logs) {
        // 라벨 인쇄에 필요한 데이터 형식으로 변환
        const labelData = logs.map(log => {
            // 주소 조합 (도로명주소 + 상세주소)
            const addressParts = [];
            if (log.addressRoad) addressParts.push(log.addressRoad);
            if (log.addressDetail) addressParts.push(log.addressDetail);
            const address = addressParts.join(' ');

            return {
                name: log.name || '',
                address: address,
                postalCode: log.addressPostcode || ''
            };
        });

        // 중복 제거 (성명 + 주소 기준)
        const uniqueMap = new Map();
        labelData.forEach(item => {
            const key = `${item.name}|${item.address}|${item.postalCode}`;
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, item);
            }
        });
        const uniqueLabelData = Array.from(uniqueMap.values());

        // 중복이 있었으면 알림
        const duplicateCount = labelData.length - uniqueLabelData.length;
        if (duplicateCount > 0) {
            showToast(`중복 ${duplicateCount}건 제거됨 (총 ${uniqueLabelData.length}건)`, 'info');
        }

        // localStorage에 데이터 저장
        localStorage.setItem('labelPrintData', JSON.stringify(uniqueLabelData));

        // 라벨 인쇄 페이지로 이동
        window.location.href = '../label-print/index.html';
    }

    if (btnBulkDelete) {
        btnBulkDelete.addEventListener('click', () => {
            const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.dataset.id);

            if (selectedIds.length === 0) {
                alert('삭제할 항목을 선택해주세요.');
                return;
            }

            if (confirm(`선택한 ${selectedIds.length}건을 삭제하시겠습니까?`)) {
                sampleLogs = sampleLogs.filter(log => !selectedIds.includes(log.id));
                saveLogs();
                renderLogs(sampleLogs);
                selectAllCheckbox.checked = false;
                showToast(`${selectedIds.length}건이 삭제되었습니다.`, 'success');
            }
        });
    }

    // ========================================
    // 통계 모달
    // ========================================
    const btnStatistics = document.getElementById('btnStatistics');
    const statisticsModal = document.getElementById('statisticsModal');
    const closeStatisticsModal = document.getElementById('closeStatisticsModal');
    const closeStatisticsBtn = document.getElementById('closeStatisticsBtn');

    if (btnStatistics) {
        btnStatistics.addEventListener('click', showStatistics);
    }

    if (closeStatisticsModal) {
        closeStatisticsModal.addEventListener('click', () => statisticsModal.classList.add('hidden'));
    }
    if (closeStatisticsBtn) {
        closeStatisticsBtn.addEventListener('click', () => statisticsModal.classList.add('hidden'));
    }
    if (statisticsModal) {
        statisticsModal.querySelector('.modal-overlay').addEventListener('click', () => statisticsModal.classList.add('hidden'));
    }

    function showStatistics() {
        const total = sampleLogs.length;
        const completed = sampleLogs.filter(l => l.isComplete).length;
        const pending = total - completed;

        document.getElementById('statTotalCount').textContent = total;
        document.getElementById('statCompletedCount').textContent = completed;
        document.getElementById('statPendingCount').textContent = pending;

        // 시료명별
        const byWaterType = {};
        sampleLogs.forEach(l => {
            const type = l.sampleName || '미지정';
            byWaterType[type] = (byWaterType[type] || 0) + 1;
        });
        renderStatsChart('statsByWaterType', byWaterType, total);

        // 목적별
        const byPurpose = {};
        sampleLogs.forEach(l => {
            const purpose = l.purpose || '미지정';
            byPurpose[purpose] = (byPurpose[purpose] || 0) + 1;
        });
        renderStatsChart('statsByPurpose', byPurpose, total);

        // 검사항목별
        const byTestItems = {};
        sampleLogs.forEach(l => {
            const items = l.testItems || '미지정';
            byTestItems[items] = (byTestItems[items] || 0) + 1;
        });
        renderStatsChart('statsByTestItems', byTestItems, total);

        // 월별
        const byMonth = {};
        sampleLogs.forEach(l => {
            if (l.date) {
                const month = l.date.substring(0, 7);
                byMonth[month] = (byMonth[month] || 0) + 1;
            }
        });
        renderStatsChart('statsByMonth', byMonth, total);

        statisticsModal.classList.remove('hidden');
    }

    function renderStatsChart(containerId, data, total) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);

        container.innerHTML = entries.map(([label, count]) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            return `
                <div class="stat-bar-item">
                    <div class="stat-bar-label">${label}</div>
                    <div class="stat-bar-wrapper">
                        <div class="stat-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="stat-bar-value">${count}건 (${percentage}%)</div>
                </div>
            `;
        }).join('');
    }

    // ========================================
    // 검색 모달
    // ========================================
    const openSearchModalBtn = document.getElementById('openSearchModalBtn');
    const listSearchModal = document.getElementById('listSearchModal');
    const closeSearchModal = document.getElementById('closeSearchModal');
    const applySearchBtn = document.getElementById('applySearchBtn');
    const resetSearchBtn = document.getElementById('resetSearchBtn');
    const searchDateInput = document.getElementById('searchDateInput');
    const searchTextInput = document.getElementById('searchTextInput');
    const clearSearchDate = document.getElementById('clearSearchDate');

    if (openSearchModalBtn) {
        openSearchModalBtn.addEventListener('click', () => listSearchModal.classList.remove('hidden'));
    }
    if (closeSearchModal) {
        closeSearchModal.addEventListener('click', () => listSearchModal.classList.add('hidden'));
    }
    if (listSearchModal) {
        listSearchModal.querySelector('.modal-overlay').addEventListener('click', () => listSearchModal.classList.add('hidden'));
    }
    if (clearSearchDate) {
        clearSearchDate.addEventListener('click', () => searchDateInput.value = '');
    }
    if (resetSearchBtn) {
        resetSearchBtn.addEventListener('click', () => {
            searchDateInput.value = '';
            searchTextInput.value = '';
            renderLogs(sampleLogs);
            listSearchModal.classList.add('hidden');
        });
    }
    if (applySearchBtn) {
        applySearchBtn.addEventListener('click', () => {
            const dateFilter = searchDateInput.value;
            const textFilter = searchTextInput.value.toLowerCase();

            const filtered = sampleLogs.filter(log => {
                let match = true;
                if (dateFilter && log.date !== dateFilter) match = false;
                if (textFilter) {
                    const searchTarget = `${log.name} ${log.receptionNumber}`.toLowerCase();
                    if (!searchTarget.includes(textFilter)) match = false;
                }
                return match;
            });

            renderLogs(filtered);
            listSearchModal.classList.add('hidden');
        });
    }

    // ========================================
    // JSON 저장/불러오기
    // ========================================
    const saveJsonBtn = document.getElementById('saveJsonBtn');
    const loadJsonInput = document.getElementById('loadJsonInput');

    if (saveJsonBtn) {
        saveJsonBtn.addEventListener('click', async () => {
            const content = JSON.stringify({
                sampleType: SAMPLE_TYPE,
                exportedAt: new Date().toISOString(),
                data: sampleLogs
            }, null, 2);

            const saved = await FileAPI.saveFile(content, `water-samples-${new Date().toISOString().split('T')[0]}.json`);
            if (saved) {
                showToast('파일이 저장되었습니다.', 'success');
            }
        });
    }

    if (loadJsonInput) {
        loadJsonInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    const loadedData = parsed.data || parsed;

                    if (Array.isArray(loadedData)) {
                        if (confirm(`${loadedData.length}건의 데이터를 불러오시겠습니까?\n기존 데이터는 유지됩니다.`)) {
                            sampleLogs = [...sampleLogs, ...loadedData];
                            saveLogs();
                            renderLogs(sampleLogs);
                            showToast(`${loadedData.length}건의 데이터를 불러왔습니다.`, 'success');
                        }
                    }
                } catch (error) {
                    showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // ========================================
    // 엑셀 내보내기
    // ========================================
    const exportBtn = document.getElementById('exportBtn');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (sampleLogs.length === 0) {
                alert('내보낼 데이터가 없습니다.');
                return;
            }

            const exportData = sampleLogs.map(log => ({
                '접수번호': log.receptionNumber || '-',
                '접수일자': log.date || '-',
                '성명': log.name || '-',
                '연락처': log.phoneNumber || '-',
                '우편번호': log.addressPostcode || '-',
                '도로명주소': log.addressRoad || '-',
                '상세주소': log.addressDetail || '-',
                '전체주소': log.address || '-',
                '시료명': log.sampleName || '-',
                '시료수': log.sampleCount || '-',
                '채취장소': log.samplingLocation || '-',
                '주작목': log.mainCrop || '-',
                '목적': log.purpose || '-',
                '검사항목': log.testItems || '-',
                '통보방법': log.receptionMethod || '-',
                '비고': log.note || '-',
                '완료여부': log.isComplete ? '완료' : '미완료',
                '등록일시': log.createdAt ? new Date(log.createdAt).toLocaleString('ko-KR') : '-'
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // 열 너비 설정
            ws['!cols'] = [
                { wch: 10 },  // 접수번호
                { wch: 12 },  // 접수일자
                { wch: 10 },  // 성명
                { wch: 15 },  // 연락처
                { wch: 8 },   // 우편번호
                { wch: 30 },  // 도로명주소
                { wch: 20 },  // 상세주소
                { wch: 40 },  // 전체주소
                { wch: 15 },  // 시료명
                { wch: 8 },   // 시료수
                { wch: 25 },  // 채취장소
                { wch: 15 },  // 주작목
                { wch: 15 },  // 목적
                { wch: 25 },  // 검사항목
                { wch: 10 },  // 통보방법
                { wch: 20 },  // 비고
                { wch: 8 },   // 완료여부
                { wch: 20 }   // 등록일시
            ];

            XLSX.utils.book_append_sheet(wb, ws, '수질분석 접수');
            XLSX.writeFile(wb, `수질분석접수_${new Date().toISOString().split('T')[0]}.xlsx`);
            showToast('엑셀 파일이 저장되었습니다.', 'success');
        });
    }

    // ========================================
    // 자동 저장 설정 (토양과 동일한 완전한 기능)
    // ========================================
    const autoSaveToggle = document.getElementById('autoSaveToggle');
    const autoSaveStatus = document.getElementById('autoSaveStatus');
    const selectAutoSaveFolderBtn = document.getElementById('selectAutoSaveFolderBtn');
    let autoSaveFileHandle = null;

    // 자동 저장 상태 표시 함수
    function updateAutoSaveStatus(status) {
        if (!autoSaveStatus) return;

        const statusIndicator = autoSaveStatus.querySelector('.status-indicator');
        autoSaveStatus.classList.remove('active', 'saving', 'error');

        switch (status) {
            case 'active':
                autoSaveStatus.classList.add('active');
                if (statusIndicator) statusIndicator.style.background = '#22c55e';
                break;
            case 'saving':
                autoSaveStatus.classList.add('saving');
                if (statusIndicator) statusIndicator.style.background = '#f59e0b';
                break;
            case 'saved':
                autoSaveStatus.classList.add('active');
                if (statusIndicator) statusIndicator.style.background = '#22c55e';
                break;
            case 'error':
                autoSaveStatus.classList.add('error');
                if (statusIndicator) statusIndicator.style.background = '#ef4444';
                break;
            case 'inactive':
            default:
                if (statusIndicator) statusIndicator.style.background = '#9ca3af';
                break;
        }
    }

    // 자동 저장 실행 함수
    async function autoSaveToFile() {
        if (!autoSaveToggle || !autoSaveToggle.checked) return;

        const dataToSave = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            totalRecords: sampleLogs.length,
            data: sampleLogs
        };
        const content = JSON.stringify(dataToSave, null, 2);

        if (isElectron && FileAPI.autoSavePath) {
            try {
                updateAutoSaveStatus('saving');
                const success = await FileAPI.autoSave(content);
                if (success) {
                    updateAutoSaveStatus('saved');
                    setTimeout(() => updateAutoSaveStatus('active'), 2000);
                    console.log('💾 수질 자동 저장 완료');
                } else {
                    updateAutoSaveStatus('error');
                }
            } catch (error) {
                console.error('자동 저장 오류:', error);
                updateAutoSaveStatus('error');
            }
        } else if (!isElectron && autoSaveFileHandle) {
            try {
                updateAutoSaveStatus('saving');
                const writable = await autoSaveFileHandle.createWritable();
                await writable.write(content);
                await writable.close();
                updateAutoSaveStatus('saved');
                setTimeout(() => {
                    if (autoSaveFileHandle) {
                        updateAutoSaveStatus('active');
                    }
                }, 2000);
            } catch (error) {
                console.error('자동 저장 오류:', error);
                updateAutoSaveStatus('error');
            }
        }
    }

    // 데이터 변경 시 자동 저장 트리거
    window.triggerWaterAutoSave = autoSaveToFile;

    // 자동 저장 폴더 선택 버튼 (Electron 전용)
    if (selectAutoSaveFolderBtn && isElectron) {
        selectAutoSaveFolderBtn.addEventListener('click', async () => {
            try {
                const result = await window.electronAPI.selectAutoSaveFolder();
                if (result.success) {
                    FileAPI.autoSavePath = await window.electronAPI.getAutoSavePath('water');
                    localStorage.setItem('waterAutoSaveFolderSelected', 'true');
                    showToast(`저장 폴더가 변경되었습니다:\n${result.folder}`, 'success');

                    if (autoSaveToggle && autoSaveToggle.checked) {
                        await autoSaveToFile();
                    }
                } else if (!result.canceled) {
                    showToast('폴더 선택에 실패했습니다.', 'error');
                }
            } catch (error) {
                console.error('폴더 선택 오류:', error);
                showToast('폴더 선택 중 오류가 발생했습니다.', 'error');
            }
        });

        // 현재 폴더 경로를 툴팁에 표시
        (async () => {
            try {
                const folder = await window.electronAPI.getAutoSaveFolder();
                selectAutoSaveFolderBtn.title = `저장 폴더: ${folder}`;
            } catch (error) {
                console.error('폴더 경로 조회 오류:', error);
            }
        })();
    } else if (selectAutoSaveFolderBtn && !isElectron) {
        selectAutoSaveFolderBtn.title = '자동저장 파일 선택';
        selectAutoSaveFolderBtn.addEventListener('click', async () => {
            try {
                if ('showSaveFilePicker' in window) {
                    autoSaveFileHandle = await window.showSaveFilePicker({
                        suggestedName: 'water-logs-autosave.json',
                        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
                    });
                    showToast('자동저장 파일이 설정되었습니다.', 'success');
                    if (autoSaveToggle) {
                        autoSaveToggle.checked = true;
                        localStorage.setItem('waterAutoSaveEnabled', 'true');
                    }
                    await autoSaveToFile();
                } else {
                    showToast('이 브라우저에서는 파일 선택을 지원하지 않습니다.', 'error');
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('파일 선택 오류:', error);
                    showToast('파일 선택 중 오류가 발생했습니다.', 'error');
                }
            }
        });
    }

    // 페이지 로드 시 자동 저장 상태 복원
    const autoSaveEnabled = localStorage.getItem('waterAutoSaveEnabled') === 'true';
    if (autoSaveToggle && autoSaveEnabled) {
        autoSaveToggle.checked = true;

        if (isElectron) {
            updateAutoSaveStatus('active');
            autoSaveToFile();
            showToast('자동 저장이 활성화되었습니다.', 'success');
        } else {
            updateAutoSaveStatus('inactive');
        }
    }

    if (autoSaveToggle) {
        autoSaveToggle.addEventListener('change', async () => {
            try {
                if (!autoSaveToggle.checked) {
                    autoSaveFileHandle = null;
                    localStorage.setItem('waterAutoSaveEnabled', 'false');
                    updateAutoSaveStatus('inactive');
                    return;
                }

                if (isElectron) {
                    localStorage.setItem('waterAutoSaveEnabled', 'true');
                    updateAutoSaveStatus('active');
                    await autoSaveToFile();
                    showToast('자동 저장이 활성화되었습니다.', 'success');
                } else {
                    if (!('showSaveFilePicker' in window)) {
                        alert('이 브라우저는 자동 저장 기능을 지원하지 않습니다.\nChrome, Edge 브라우저를 사용해주세요.');
                        autoSaveToggle.checked = false;
                        return;
                    }

                    const today = new Date().toISOString().slice(0, 10);
                    autoSaveFileHandle = await window.showSaveFilePicker({
                        suggestedName: `수질분석_${today}.json`,
                        types: [{
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });

                    localStorage.setItem('waterAutoSaveEnabled', 'true');
                    updateAutoSaveStatus('active');
                    await autoSaveToFile();
                    showToast('자동 저장이 활성화되었습니다.', 'success');
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    autoSaveToggle.checked = false;
                    updateAutoSaveStatus('inactive');
                } else {
                    console.error('자동 저장 설정 오류:', error);
                    alert('자동 저장 설정에 실패했습니다.');
                    autoSaveToggle.checked = false;
                    localStorage.setItem('waterAutoSaveEnabled', 'false');
                    updateAutoSaveStatus('inactive');
                }
            }
        });
    }

    // Electron 환경에서 자동 저장 파일 로드
    if (isElectron && FileAPI.autoSavePath) {
        try {
            const content = await FileAPI.loadAutoSave();
            if (content) {
                const parsed = JSON.parse(content);
                let loadedData;
                if (parsed.data && Array.isArray(parsed.data)) {
                    loadedData = parsed.data;
                } else if (Array.isArray(parsed)) {
                    loadedData = parsed;
                }
                if (loadedData && loadedData.length > 0) {
                    sampleLogs = loadedData;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleLogs));
                    console.log('📂 수질 자동 저장 파일에서 데이터 로드됨:', loadedData.length, '건');
                    renderLogs(sampleLogs);
                }
            }
        } catch (error) {
            console.error('자동 저장 파일 로드 오류:', error);
        }
    }

    // ========================================
    // 초기 렌더링
    // ========================================
    renderLogs(sampleLogs);

    console.log('✅ 수질분석 페이지 초기화 완료');
});
