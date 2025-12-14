// ========================================
// 토양 중금속 시료 전용 스크립트
// ========================================
const SAMPLE_TYPE = '중금속';
const STORAGE_KEY = 'heavyMetalSampleLogs';
const AUTO_SAVE_FILE = 'heavy-metal-autosave.json';

// 중금속 분석 항목 목록
const ANALYSIS_ITEMS = ['구리', '납', '니켈', '비소', '수은', '아연', '카드뮴', '6가크롬'];

// 년도 선택 관련 변수
let selectedYear = new Date().getFullYear().toString();

// 년도별 스토리지 키 생성
function getStorageKey(year) {
    return `${STORAGE_KEY}_${year}`;
}

// ========================================
// Electron / Web 환경 감지 및 파일 API 추상화
// ========================================
const isElectron = window.electronAPI?.isElectron === true;

// Electron 환경에서의 파일 시스템 API
const FileAPI = {
    autoSavePath: null,
    autoSaveFolderHandle: null,

    async init() {
        if (isElectron) {
            this.autoSavePath = await window.electronAPI.getAutoSavePath('heavy-metal');
            console.log('📁 Electron 중금속 자동 저장 경로:', this.autoSavePath);
        }
    },

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
        } else if (!isElectron && this.autoSaveFolderHandle) {
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
    console.log('🚀 중금속 페이지 로드 시작');
    console.log(isElectron ? '🖥️ Electron 환경' : '🌐 웹 브라우저 환경');

    await FileAPI.init();

    // Electron 환경: 자동 저장 기본 활성화 및 첫 실행 시 폴더 선택
    if (isElectron) {
        const autoSaveToggle = document.getElementById('autoSaveToggle');
        const hasSelectedFolder = localStorage.getItem('heavyMetalAutoSaveFolderSelected') === 'true';

        // 처음 실행이거나 폴더가 선택되지 않은 경우
        if (!hasSelectedFolder) {
            // 잠시 후 폴더 선택 다이얼로그 표시 (UI 로드 후)
            setTimeout(async () => {
                const confirmSelect = confirm('자동 저장 기능을 사용하시겠습니까?\n\n저장할 폴더를 선택해주세요.');
                if (confirmSelect) {
                    try {
                        const result = await window.electronAPI.selectAutoSaveFolder();
                        if (result.success) {
                            FileAPI.autoSavePath = await window.electronAPI.getAutoSavePath('heavy-metal');
                            localStorage.setItem('heavyMetalAutoSaveFolderSelected', 'true');
                            localStorage.setItem('heavyMetalAutoSaveEnabled', 'true');
                            if (autoSaveToggle) {
                                autoSaveToggle.checked = true;
                            }
                            updateAutoSaveStatus('active');
                            autoSaveToFile();
                            showToast('자동 저장이 활성화되었습니다.', 'success');
                            console.log('📁 중금속 자동 저장 폴더 설정됨:', result.folder);
                        }
                    } catch (error) {
                        console.error('폴더 선택 오류:', error);
                    }
                }
            }, 500);
        } else {
            // 이전에 폴더를 선택한 경우, 자동 저장 기본 활성화
            localStorage.setItem('heavyMetalAutoSaveEnabled', 'true');
            if (autoSaveToggle) {
                autoSaveToggle.checked = true;
            }
            // 자동 저장 경로 설정 및 활성화
            (async () => {
                try {
                    FileAPI.autoSavePath = await window.electronAPI.getAutoSavePath('heavy-metal');
                    updateAutoSaveStatus('active');
                    autoSaveToFile();
                    showToast('자동 저장이 활성화되었습니다.', 'success');
                } catch (error) {
                    console.error('자동 저장 경로 설정 오류:', error);
                }
            })();
        }
    }

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
            console.log('📦 기존 중금속 데이터를 현재 년도로 마이그레이션 완료');
        }
    }

    let sampleLogs = JSON.parse(localStorage.getItem(getStorageKey(selectedYear))) || [];
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
    const listViewTitle = document.getElementById('listViewTitle');

    // 현재 년도 선택
    if (yearSelect) {
        yearSelect.value = selectedYear;
    }

    // 목록 뷰 타이틀 업데이트
    function updateListViewTitle() {
        if (listViewTitle) {
            listViewTitle.textContent = `${selectedYear}년 토양 중금속 접수 목록`;
        }
    }

    // 년도별 데이터 로드 함수
    function loadYearData(year) {
        const yearStorageKey = getStorageKey(year);
        sampleLogs = JSON.parse(localStorage.getItem(yearStorageKey)) || [];
        renderLogs(sampleLogs);
        receptionNumberInput.value = generateNextReceptionNumber();
        updateListViewTitle();
    }

    // 년도 선택 변경 이벤트
    if (yearSelect) {
        yearSelect.addEventListener('change', (e) => {
            selectedYear = e.target.value;
            loadYearData(selectedYear);
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
    // 전화번호 자동 하이픈
    // ========================================
    const phoneNumberInput = document.getElementById('phoneNumber');
    if (phoneNumberInput) {
        phoneNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^0-9]/g, '');
            let formatted = '';
            if (value.length <= 3) {
                formatted = value;
            } else if (value.length <= 7) {
                formatted = value.slice(0, 3) + '-' + value.slice(3);
            } else {
                formatted = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
            }
            e.target.value = formatted;
        });
    }

    // ========================================
    // 주소 검색 (다음 우편번호)
    // ========================================
    function updateFullAddress() {
        if (addressHidden) {
            const parts = [addressRoad?.value, addressDetail?.value].filter(Boolean);
            addressHidden.value = parts.join(' ');
        }
    }

    function closeAddressModal() {
        if (addressModal) addressModal.classList.add('hidden');
        setTimeout(() => {
            if (daumPostcodeContainer) daumPostcodeContainer.innerHTML = '';
        }, 100);
    }

    if (closeAddressModalBtn) {
        closeAddressModalBtn.addEventListener('click', closeAddressModal);
    }
    if (addressModal) {
        addressModal.querySelector('.modal-overlay')?.addEventListener('click', closeAddressModal);
    }

    if (searchAddressBtn) {
        searchAddressBtn.addEventListener('click', () => {
            if (typeof daum === 'undefined' || typeof daum.Postcode === 'undefined') {
                alert('주소 검색 서비스를 불러오는 중입니다.');
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
                        extraRoadAddr += (extraRoadAddr ? ', ' + data.buildingName : data.buildingName);
                    }
                    if (extraRoadAddr) {
                        extraRoadAddr = ' (' + extraRoadAddr + ')';
                    }

                    addressPostcode.value = data.zonecode;
                    addressRoad.value = roadAddr + extraRoadAddr;
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
        console.log(`📋 다음 접수번호 생성: ${nextNumber} (기존 최대: ${maxNumber})`);
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

        // 데이터 수집
        const data = {
            id: editingIndex >= 0 ? sampleLogs[editingIndex].id : Date.now(),
            receptionNumber: document.getElementById('receptionNumber')?.value || generateNextReceptionNumber(),
            date: document.getElementById('date')?.value || today,
            name: name,
            phoneNumber: phoneNumber,
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
        localStorage.setItem(yearStorageKey, JSON.stringify(sampleLogs));
        autoSaveToFile();
    }

    async function autoSaveToFile() {
        const dataToSave = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            sampleType: SAMPLE_TYPE,
            totalRecords: sampleLogs.length,
            data: sampleLogs
        };

        const content = JSON.stringify(dataToSave, null, 2);

        if (isElectron) {
            // Electron: FileAPI 사용
            try {
                updateAutoSaveStatus('saving');
                const success = await FileAPI.autoSave(content);
                if (success) {
                    updateAutoSaveStatus('saved');
                    setTimeout(() => updateAutoSaveStatus('active'), 2000);
                } else {
                    updateAutoSaveStatus('error');
                }
            } catch (error) {
                console.error('자동 저장 오류:', error);
                updateAutoSaveStatus('error');
            }
        } else {
            // Web: 기존 File System Access API
            if (!autoSaveFileHandle) return;

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

    function updateAutoSaveStatus(status) {
        const autoSaveStatus = document.getElementById('autoSaveStatus');
        if (!autoSaveStatus) return;

        const statusIndicator = autoSaveStatus.querySelector('.status-indicator');

        autoSaveStatus.classList.remove('hidden', 'active', 'saving', 'error');

        switch (status) {
            case 'active':
                autoSaveStatus.classList.add('active');
                if (statusIndicator) statusIndicator.style.background = '#22c55e';
                autoSaveStatus.classList.remove('hidden');
                break;
            case 'saving':
                autoSaveStatus.classList.add('saving');
                if (statusIndicator) statusIndicator.style.background = '#f59e0b';
                autoSaveStatus.classList.remove('hidden');
                break;
            case 'saved':
                autoSaveStatus.classList.add('active');
                if (statusIndicator) statusIndicator.style.background = '#22c55e';
                autoSaveStatus.classList.remove('hidden');
                break;
            case 'error':
                autoSaveStatus.classList.add('error');
                if (statusIndicator) statusIndicator.style.background = '#ef4444';
                autoSaveStatus.classList.remove('hidden');
                break;
            case 'pending':
                autoSaveStatus.classList.add('saving');
                if (statusIndicator) statusIndicator.style.background = '#3b82f6';
                autoSaveStatus.classList.remove('hidden');
                break;
            case 'inactive':
            default:
                autoSaveStatus.classList.add('hidden');
                if (statusIndicator) statusIndicator.style.background = '#94a3b8';
        }
    }

    // ========================================
    // 목록 렌더링
    // ========================================
    function renderLogs(logsToRender = sampleLogs) {
        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (logsToRender.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            if (recordCountEl) recordCountEl.textContent = '0건';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (recordCountEl) recordCountEl.textContent = `${logsToRender.length}건`;

        logsToRender.forEach((log, idx) => {
            const tr = document.createElement('tr');
            tr.dataset.index = sampleLogs.indexOf(log);

            // 분석항목 표시: 전체 선택시 "전체 항목", 아니면 선택된 항목 모두 표시
            const analysisItemsStr = log.analysisItems ? log.analysisItems.join(', ') : '';
            const isAllItems = log.analysisItems && log.analysisItems.length === ANALYSIS_ITEMS.length;
            const analysisItemsDisplay = !log.analysisItems || log.analysisItems.length === 0
                ? '-'
                : isAllItems
                    ? '전체 항목'
                    : analysisItemsStr;

            const receptionMethodIcons = {
                '우편': '📮', '이메일': '📧', '팩스': '📠', '직접방문': '🚶'
            };
            const methodIcon = receptionMethodIcons[log.receptionMethod] || '-';

            tr.innerHTML = `
                <td><input type="checkbox" class="row-checkbox" data-index="${tr.dataset.index}"></td>
                <td>
                    <button class="btn-complete ${log.isCompleted ? 'completed' : ''}" title="${log.isCompleted ? '완료됨' : '미완료'}">
                        ${log.isCompleted ? '✓' : '○'}
                    </button>
                </td>
                <td>${log.receptionNumber || '-'}</td>
                <td>${log.date || '-'}</td>
                <td>${log.name || '-'}</td>
                <td title="${log.address || ''}">${(log.addressRoad || '-').substring(0, 20)}${(log.addressRoad || '').length > 20 ? '...' : ''}</td>
                <td>${log.phoneNumber || '-'}</td>
                <td title="${log.samplingLocation || ''}">${(log.samplingLocation || '-').substring(0, 15)}${(log.samplingLocation || '').length > 15 ? '...' : ''}</td>
                <td>${log.cropName || '-'}${log.treeAge ? ' (' + log.treeAge + '년생)' : ''}</td>
                <td>${log.samplingDate || '-'}</td>
                <td title="${analysisItemsStr}">${analysisItemsDisplay}</td>
                <td>${log.purpose || '-'}</td>
                <td title="${log.receptionMethod || ''}">${methodIcon}</td>
                <td title="${log.note || ''}">${(log.note || '-').substring(0, 10)}${(log.note || '').length > 10 ? '...' : ''}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-edit" title="수정">✏️</button>
                        <button class="btn-delete" title="삭제">🗑️</button>
                    </div>
                </td>
            `;

            // 완료 토글
            tr.querySelector('.btn-complete')?.addEventListener('click', () => {
                const realIdx = parseInt(tr.dataset.index);
                sampleLogs[realIdx].isCompleted = !sampleLogs[realIdx].isCompleted;
                saveData();
                renderLogs();
            });

            // 수정 버튼
            tr.querySelector('.btn-edit')?.addEventListener('click', () => {
                editLog(parseInt(tr.dataset.index));
            });

            // 삭제 버튼
            tr.querySelector('.btn-delete')?.addEventListener('click', () => {
                if (confirm('정말 삭제하시겠습니까?')) {
                    sampleLogs.splice(parseInt(tr.dataset.index), 1);
                    saveData();
                    renderLogs();
                    showToast('삭제되었습니다.', 'success');
                }
            });

            tableBody.appendChild(tr);
        });
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

                return {
                    '접수번호': log.receptionNumber || '-',
                    '접수일자': log.date || '-',
                    '성명': log.name || '-',
                    '연락처': log.phoneNumber || '-',
                    '우편번호': log.addressPostcode || '-',
                    '도로명주소': log.addressRoad || '-',
                    '상세주소': log.addressDetail || '-',
                    '전체주소': log.address || '-',
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
                { wch: 15 },  // 연락처
                { wch: 8 },   // 우편번호
                { wch: 30 },  // 도로명주소
                { wch: 20 },  // 상세주소
                { wch: 40 },  // 전체주소
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
    // JSON 저장/불러오기
    // ========================================
    const saveJsonBtn = document.getElementById('saveJsonBtn');
    const loadJsonInput = document.getElementById('loadJsonInput');

    if (saveJsonBtn) {
        saveJsonBtn.addEventListener('click', async () => {
            if (sampleLogs.length === 0) {
                showToast('저장할 데이터가 없습니다.', 'error');
                return;
            }

            const dataToSave = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                sampleType: SAMPLE_TYPE,
                totalRecords: sampleLogs.length,
                data: sampleLogs
            };

            const content = JSON.stringify(dataToSave, null, 2);
            const fileName = `토양중금속_${new Date().toISOString().split('T')[0]}.json`;
            const success = await FileAPI.saveFile(content, fileName);

            if (success) {
                showToast('JSON 파일이 저장되었습니다.', 'success');
            }
        });
    }

    if (loadJsonInput) {
        loadJsonInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const parsed = JSON.parse(text);
                const loadedData = parsed.data || parsed;

                if (Array.isArray(loadedData)) {
                    if (confirm(`${loadedData.length}건의 데이터를 불러옵니다. 기존 데이터에 추가할까요?\n\n(취소 선택 시 기존 데이터를 대체합니다)`)) {
                        sampleLogs.push(...loadedData);
                    } else {
                        sampleLogs = loadedData;
                    }
                    saveData();
                    renderLogs();
                    showToast(`${loadedData.length}건의 데이터를 불러왔습니다.`, 'success');
                }
            } catch (error) {
                showToast('파일을 읽는 중 오류가 발생했습니다.', 'error');
                console.error(error);
            }

            loadJsonInput.value = '';
        });
    }

    // ========================================
    // 자동저장 토글
    // ========================================
    const autoSaveToggle = document.getElementById('autoSaveToggle');
    const autoSaveStatus = document.getElementById('autoSaveStatus');
    const selectAutoSaveFolderBtn = document.getElementById('selectAutoSaveFolderBtn');

    // 자동 저장 폴더 선택 버튼 (Electron 전용)
    if (selectAutoSaveFolderBtn && isElectron) {
        selectAutoSaveFolderBtn.addEventListener('click', async () => {
            try {
                const result = await window.electronAPI.selectAutoSaveFolder();
                if (result.success) {
                    // 폴더 선택 후 heavy-metal 타입으로 새 경로 가져오기
                    FileAPI.autoSavePath = await window.electronAPI.getAutoSavePath('heavy-metal');
                    showToast(`저장 폴더가 변경되었습니다:\n${result.folder}`, 'success');

                    // 자동 저장이 활성화되어 있으면 바로 저장
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
        // 웹 환경에서는 파일 선택 다이얼로그 사용
        selectAutoSaveFolderBtn.title = '자동저장 파일 선택';
        selectAutoSaveFolderBtn.addEventListener('click', async () => {
            try {
                if ('showSaveFilePicker' in window) {
                    autoSaveFileHandle = await window.showSaveFilePicker({
                        suggestedName: 'heavy-metal-logs-autosave.json',
                        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
                    });
                    showToast('자동저장 파일이 설정되었습니다.', 'success');
                    if (autoSaveToggle) {
                        autoSaveToggle.checked = true;
                        localStorage.setItem('heavyMetalAutoSaveEnabled', 'true');
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

    // ========================================
    // 자동 저장 기능 (Web 환경 전용)
    // ========================================
    // Electron 환경은 DOMContentLoaded 시작 부분에서 처리됨

    // 페이지 로드 시 Web 환경 자동 저장 상태 복원
    if (!isElectron) {
        const autoSaveEnabled = localStorage.getItem('heavyMetalAutoSaveEnabled') === 'true';
        if (autoSaveToggle && autoSaveEnabled) {
            autoSaveToggle.checked = true;
            updateAutoSaveStatus('pending');
            if ('showSaveFilePicker' in window) {
                (async () => {
                    try {
                        const today = new Date().toISOString().slice(0, 10);
                        autoSaveFileHandle = await window.showSaveFilePicker({
                            suggestedName: `중금속시료접수대장_${today}.json`,
                            types: [{
                                description: 'JSON Files',
                                accept: { 'application/json': ['.json'] }
                            }]
                        });
                        updateAutoSaveStatus('active');
                        await autoSaveToFile();
                        showToast('자동 저장이 복원되었습니다.', 'success');
                    } catch (error) {
                        if (error.name === 'AbortError') {
                            updateAutoSaveStatus('inactive');
                            autoSaveToggle.checked = false;
                            localStorage.setItem('heavyMetalAutoSaveEnabled', 'false');
                        }
                    }
                })();
            }
        }
    }

    if (autoSaveToggle) {
        autoSaveToggle.addEventListener('change', async () => {
            try {
                // 토글 OFF - 자동저장 비활성화
                if (!autoSaveToggle.checked) {
                    autoSaveFileHandle = null;
                    localStorage.setItem('heavyMetalAutoSaveEnabled', 'false');
                    updateAutoSaveStatus('inactive');
                    return;
                }

                // 토글 ON - 자동저장 활성화
                if (isElectron) {
                    // Electron: 자동 저장 경로 사용
                    localStorage.setItem('heavyMetalAutoSaveEnabled', 'true');
                    updateAutoSaveStatus('active');
                    await autoSaveToFile();
                    showToast('자동 저장이 활성화되었습니다.', 'success');
                } else {
                    // Web: 파일 선택 다이얼로그
                    if (!('showSaveFilePicker' in window)) {
                        alert('이 브라우저는 자동 저장 기능을 지원하지 않습니다.\nChrome, Edge 브라우저를 사용해주세요.');
                        autoSaveToggle.checked = false;
                        return;
                    }

                    const today = new Date().toISOString().slice(0, 10);
                    autoSaveFileHandle = await window.showSaveFilePicker({
                        suggestedName: `중금속시료접수대장_${today}.json`,
                        types: [{
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });

                    localStorage.setItem('heavyMetalAutoSaveEnabled', 'true');
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
                    localStorage.setItem('heavyMetalAutoSaveEnabled', 'false');
                    updateAutoSaveStatus('inactive');
                }
            }
        });
    }

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
                const indices = Array.from(checked).map(cb => parseInt(cb.dataset.index)).sort((a, b) => b - a);
                indices.forEach(idx => sampleLogs.splice(idx, 1));
                saveData();
                renderLogs();
                showToast(`${checked.length}건이 삭제되었습니다.`, 'success');
            }
        });
    }

    // ========================================
    // 검색 모달
    // ========================================
    const listSearchModal = document.getElementById('listSearchModal');
    const openSearchModalBtn = document.getElementById('openSearchModalBtn');
    const closeSearchModal = document.getElementById('closeSearchModal');
    const searchDateInput = document.getElementById('searchDateInput');
    const searchTextInput = document.getElementById('searchTextInput');
    const applySearchBtn = document.getElementById('applySearchBtn');
    const resetSearchBtn = document.getElementById('resetSearchBtn');

    if (openSearchModalBtn && listSearchModal) {
        openSearchModalBtn.addEventListener('click', () => {
            listSearchModal.classList.remove('hidden');
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

    if (applySearchBtn) {
        applySearchBtn.addEventListener('click', () => {
            const dateFilter = searchDateInput?.value;
            const textFilter = searchTextInput?.value.toLowerCase();

            let filtered = sampleLogs;

            if (dateFilter) {
                filtered = filtered.filter(log => log.date === dateFilter);
            }

            if (textFilter) {
                filtered = filtered.filter(log =>
                    (log.name || '').toLowerCase().includes(textFilter) ||
                    (log.receptionNumber || '').toLowerCase().includes(textFilter)
                );
            }

            renderLogs(filtered);
            listSearchModal.classList.add('hidden');
            showToast(`${filtered.length}건의 검색 결과`, 'success');
        });
    }

    if (resetSearchBtn) {
        resetSearchBtn.addEventListener('click', () => {
            if (searchDateInput) searchDateInput.value = '';
            if (searchTextInput) searchTextInput.value = '';
            renderLogs();
            listSearchModal.classList.add('hidden');
        });
    }

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

        // 월별 통계
        const byMonth = {};
        sampleLogs.forEach(log => {
            if (log.date) {
                const month = log.date.substring(0, 7);
                byMonth[month] = (byMonth[month] || 0) + 1;
            }
        });
        renderBarChart('statsByMonth', byMonth);

        // 수령방법별 통계
        const byMethod = {};
        sampleLogs.forEach(log => {
            const m = log.receptionMethod || '미지정';
            byMethod[m] = (byMethod[m] || 0) + 1;
        });
        renderBarChart('statsByReceptionMethod', byMethod);
    }

    function renderBarChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = Object.entries(data);
        const maxVal = Math.max(...entries.map(([, v]) => v), 1);

        container.innerHTML = entries.map(([label, value]) => `
            <div class="stat-bar-row">
                <span class="stat-bar-label">${label}</span>
                <div class="stat-bar-track">
                    <div class="stat-bar-fill" style="width: ${(value / maxVal) * 100}%"></div>
                </div>
                <span class="stat-bar-value">${value}</span>
            </div>
        `).join('');
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
                const idx = parseInt(cb.dataset.index);
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
    renderLogs();
    updateSelectedItemsCount();

    console.log('✅ 중금속 페이지 초기화 완료');
});
