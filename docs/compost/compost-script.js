// ========================================
// 퇴·액비 성분검사 위탁서 스크립트
// ========================================
const DEFAULT_SAMPLE_TYPE = '가축분퇴비';
const STORAGE_KEY = 'compostSampleLogs';
const AUTO_SAVE_FILE = 'compost-autosave.json';

// ========================================
// Electron / Web 환경 감지 및 파일 API 추상화
// ========================================
const isElectron = window.electronAPI?.isElectron === true;

const FileAPI = {
    autoSavePath: null,

    async init() {
        if (isElectron) {
            this.autoSavePath = await window.electronAPI.getAutoSavePath('compost');
            console.log('📁 Electron 가축분뇨퇴비 자동 저장 경로:', this.autoSavePath);
        }
    },

    async saveFile(content, suggestedName = 'compost-data.json') {
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
    },

    async saveExcel(buffer, suggestedName = 'data.xlsx') {
        if (isElectron) {
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
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 퇴·액비 성분검사 위탁서 페이지 로드 시작');
    console.log(isElectron ? '🖥️ Electron 환경' : '🌐 웹 브라우저 환경');

    await FileAPI.init();

    // Electron 환경: 자동 저장 기본 활성화 및 첫 실행 시 폴더 선택
    if (isElectron) {
        const autoSaveToggle = document.getElementById('autoSaveToggle');
        const hasSelectedFolder = localStorage.getItem('compostAutoSaveFolderSelected') === 'true';

        if (!hasSelectedFolder) {
            setTimeout(async () => {
                const confirmSelect = confirm('가축분뇨퇴비 자동 저장 기능을 사용하시겠습니까?\n\n저장할 폴더를 선택해주세요.');
                if (confirmSelect) {
                    try {
                        const result = await window.electronAPI.selectAutoSaveFolder();
                        if (result.success) {
                            FileAPI.autoSavePath = await window.electronAPI.getAutoSavePath('compost');
                            localStorage.setItem('compostAutoSaveFolderSelected', 'true');
                            localStorage.setItem('compostAutoSaveEnabled', 'true');
                            if (autoSaveToggle) {
                                autoSaveToggle.checked = true;
                            }
                            console.log('📁 가축분뇨퇴비 자동 저장 폴더 설정됨:', result.folder);
                        }
                    } catch (error) {
                        console.error('폴더 선택 오류:', error);
                    }
                }
            }, 500);
        } else {
            localStorage.setItem('compostAutoSaveEnabled', 'true');
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
    // 데이터 로드
    // ========================================
    let sampleLogs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

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
    // 주소 검색 (의뢰인 주소)
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
    // 축종 기타 입력 필드 처리
    // ========================================
    const animalTypeRadios = document.querySelectorAll('input[name="animalType"]');
    const animalTypeOtherInput = document.getElementById('animalTypeOther');

    animalTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.value === '기타' && radio.checked) {
                animalTypeOtherInput.classList.remove('hidden');
                animalTypeOtherInput.focus();
            } else {
                animalTypeOtherInput.classList.add('hidden');
                animalTypeOtherInput.value = '';
            }
        });
    });

    // ========================================
    // 농장 주소 (직접 입력)
    // ========================================
    const farmAddressFullInput = document.getElementById('farmAddressFull');

    // ========================================
    // 면적 천단위 콤마 포맷팅 및 단위 토글
    // ========================================
    const farmAreaInput = document.getElementById('farmArea');
    const areaUnitToggle = document.getElementById('areaUnitToggle');
    const farmAreaUnitInput = document.getElementById('farmAreaUnit');

    function formatNumberWithCommas(value) {
        // 숫자만 추출
        const num = value.replace(/[^\d]/g, '');
        if (!num) return '';
        // 천단위 콤마 적용
        return parseInt(num, 10).toLocaleString('ko-KR');
    }

    function parseFormattedNumber(value) {
        // 콤마 제거하고 숫자만 반환
        return value.replace(/,/g, '');
    }

    // 단위 라벨 반환
    function getUnitLabel(unit) {
        return unit === 'pyeong' ? '평' : '㎡';
    }

    if (farmAreaInput) {
        farmAreaInput.addEventListener('input', (e) => {
            const formatted = formatNumberWithCommas(e.target.value);
            e.target.value = formatted;
        });
    }

    // 면적 단위 토글 이벤트
    if (areaUnitToggle) {
        areaUnitToggle.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.value;

                // 버튼 활성화 상태 변경
                areaUnitToggle.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 데이터 속성 및 hidden input 업데이트
                areaUnitToggle.dataset.unit = value;
                if (farmAreaUnitInput) {
                    farmAreaUnitInput.value = value;
                }
            });
        });
    }

    // ========================================
    // 접수번호 자동 생성
    // ========================================
    const receptionNumberInput = document.getElementById('receptionNumber');

    function generateNextReceptionNumber() {
        let maxNumber = 0;

        sampleLogs.forEach(log => {
            if (log.receptionNumber) {
                const num = parseInt(log.receptionNumber, 10);
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            }
        });

        const nextNumber = maxNumber + 1;
        return String(nextNumber);
    }

    receptionNumberInput.value = generateNextReceptionNumber();

    // 수정 모드 상태 변수
    let editingId = null;

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

        // 축종 (기타 선택 시 입력값 사용)
        let animalType = formData.get('animalType');
        if (animalType === '기타') {
            animalType = animalTypeOtherInput.value || '기타';
        }

        const data = {
            id: Date.now().toString(),
            receptionNumber: formData.get('receptionNumber'),
            date: formData.get('date'),
            // 의뢰자 정보
            farmName: formData.get('farmName'),
            name: formData.get('name'),
            phoneNumber: formData.get('phoneNumber'),
            address: formData.get('address'),
            addressPostcode: formData.get('addressPostcode'),
            addressRoad: formData.get('addressRoad'),
            addressDetail: formData.get('addressDetail'),
            farmName: formData.get('farmName'),
            farmAddress: formData.get('farmAddressFull'),
            farmArea: parseFormattedNumber(formData.get('farmArea') || ''),
            farmAreaUnit: formData.get('farmAreaUnit') || 'm2',
            // 의뢰내용
            sampleType: formData.get('sampleType'),
            animalType: animalType,
            productionDate: formData.get('productionDate'),
            sampleCount: formData.get('sampleCount') || '1',
            rawMaterials: formData.get('rawMaterials'),
            purpose: formData.get('purpose'),
            receptionMethod: formData.get('receptionMethod'),
            note: formData.get('note'),
            isComplete: false,
            createdAt: new Date().toISOString()
        };

        sampleLogs.push(data);
        saveLogs();

        showToast('시료가 등록되었습니다.', 'success');
        showRegistrationResult(data);

        resetForm();
        receptionNumberInput.value = generateNextReceptionNumber();
    }

    function resetForm() {
        form.reset();
        dateInput.valueAsDate = new Date();

        // 통보방법 초기화
        receptionMethodBtns.forEach(b => b.classList.remove('active'));
        receptionMethodInput.value = '';

        // 시료종류 초기화 (첫 번째 라디오 선택)
        const sampleTypeRadios = document.querySelectorAll('input[name="sampleType"]');
        if (sampleTypeRadios.length > 0) {
            sampleTypeRadios[0].checked = true;
        }

        // 축종 초기화 (첫 번째 라디오 선택)
        if (animalTypeRadios.length > 0) {
            animalTypeRadios[0].checked = true;
        }
        animalTypeOtherInput.classList.add('hidden');
        animalTypeOtherInput.value = '';

        // 면적 단위 초기화
        if (areaUnitToggle) {
            areaUnitToggle.dataset.unit = 'm2';
            areaUnitToggle.querySelectorAll('.unit-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.value === 'm2');
            });
        }
        if (farmAreaUnitInput) {
            farmAreaUnitInput.value = 'm2';
        }

        // 접수번호 갱신
        const nextNumber = generateNextReceptionNumber();
        receptionNumberInput.value = nextNumber;

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
            <tr><th>상호(농장명)</th><td>${data.farmName || '-'}</td></tr>
            <tr><th>성명(대표자)</th><td>${data.name}</td></tr>
            <tr><th>연락처</th><td>${data.phoneNumber}</td></tr>
            <tr><th>시료종류</th><td>${data.sampleType}</td></tr>
            <tr><th>축종</th><td>${data.animalType}</td></tr>
            <tr><th>생산일자</th><td>${data.productionDate || '-'}</td></tr>
            <tr><th>시료수</th><td>${data.sampleCount || 1}점</td></tr>
            <tr><th>원료 및 투입비율</th><td>${data.rawMaterials || '-'}</td></tr>
            <tr><th>목적(용도)</th><td>${data.purpose || '-'}</td></tr>
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleLogs));
        updateRecordCount();

        // 자동 저장 (Electron 환경)
        if (isElectron && FileAPI.autoSavePath && document.getElementById('autoSaveToggle')?.checked) {
            const autoSaveContent = JSON.stringify(sampleLogs, null, 2);
            FileAPI.autoSave(autoSaveContent);
            console.log('💾 퇴·액비 데이터 자동 저장');
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

            // 시료종류 배지
            const sampleTypeBadge = getSampleTypeBadge(log.sampleType);

            // 축종 배지
            const animalTypeBadge = getAnimalTypeBadge(log.animalType);

            // 주소 조합 (도로명 주소 + 상세주소)
            const fullAddress = [log.addressRoad, log.addressDetail].filter(Boolean).join(' ') || '-';

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
                <td>${log.farmName || log.companyName || '-'}</td>
                <td>${log.name || '-'}</td>
                <td class="col-postcode col-hidden">${log.addressPostcode || '-'}</td>
                <td class="col-address text-truncate" title="${fullAddress}">${fullAddress}</td>
                <td class="col-farm-address text-truncate" title="${log.farmAddress || ''}">${log.farmAddress || '-'}</td>
                <td>${log.farmArea ? parseInt(log.farmArea).toLocaleString('ko-KR') + ' ' + getUnitLabel(log.farmAreaUnit) : '-'}</td>
                <td>${sampleTypeBadge}</td>
                <td>${animalTypeBadge}</td>
                <td>${log.productionDate || '-'}</td>
                <td>${log.purpose || '-'}</td>
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

        bindTableEvents();
        updateRecordCount();
    }

    function getSampleTypeBadge(type) {
        const typeMap = {
            '가축분퇴비': { class: 'compost', icon: '🌿' },
            '가축분뇨발효액': { class: 'liquid', icon: '💧' }
        };
        const config = typeMap[type] || { class: 'other', icon: '📦' };
        return `<span class="sample-type-badge ${config.class}">${config.icon} ${type || '기타'}</span>`;
    }

    function getAnimalTypeBadge(type) {
        const typeMap = {
            '소': { class: 'cow', icon: '🐄' },
            '돼지': { class: 'pig', icon: '🐷' },
            '닭·오리 등': { class: 'chicken', icon: '🐔' }
        };
        const config = typeMap[type] || { class: 'other', icon: '🐾' };
        return `<span class="animal-type-badge ${config.class}">${config.icon} ${type || '기타'}</span>`;
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

        // 폼에 데이터 채우기
        receptionNumberInput.value = log.receptionNumber || '';
        dateInput.value = log.date || '';

        // 의뢰자 정보
        document.getElementById('farmName').value = log.farmName || '';
        document.getElementById('name').value = log.name || '';
        document.getElementById('phoneNumber').value = log.phoneNumber || '';
        addressPostcode.value = log.addressPostcode || '';
        addressRoad.value = log.addressRoad || '';
        addressDetail.value = log.addressDetail || '';
        addressHidden.value = log.address || '';

        // 농장 정보
        if (farmAddressFullInput) {
            farmAddressFullInput.value = log.farmAddress || '';
        }
        document.getElementById('farmArea').value = log.farmArea ? formatNumberWithCommas(log.farmArea) : '';

        // 면적 단위 복원
        const savedUnit = log.farmAreaUnit || 'm2';
        if (areaUnitToggle) {
            areaUnitToggle.dataset.unit = savedUnit;
            areaUnitToggle.querySelectorAll('.unit-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.value === savedUnit);
            });
        }
        if (farmAreaUnitInput) {
            farmAreaUnitInput.value = savedUnit;
        }

        // 시료종류 설정
        const sampleTypeRadios = document.querySelectorAll('input[name="sampleType"]');
        sampleTypeRadios.forEach(radio => {
            radio.checked = radio.value === log.sampleType;
        });

        // 축종 설정
        let animalTypeFound = false;
        animalTypeRadios.forEach(radio => {
            if (radio.value === log.animalType) {
                radio.checked = true;
                animalTypeFound = true;
            } else if (radio.value === '기타' && !animalTypeFound && log.animalType && !['소', '돼지', '닭·오리 등'].includes(log.animalType)) {
                radio.checked = true;
                animalTypeOtherInput.value = log.animalType;
                animalTypeOtherInput.classList.remove('hidden');
            }
        });

        // 생산 정보
        document.getElementById('productionDate').value = log.productionDate || '';
        document.getElementById('sampleCount').value = log.sampleCount || 1;
        document.getElementById('rawMaterials').value = log.rawMaterials || '';
        document.getElementById('purpose').value = log.purpose || '';
        document.getElementById('note').value = log.note || '';

        // 통보방법 선택
        receptionMethodBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.method === log.receptionMethod);
        });
        receptionMethodInput.value = log.receptionMethod || '';

        switchView('form');
        showToast('수정 모드입니다. 변경 후 등록 버튼을 클릭하세요.', 'warning');

        // 제출 버튼 스타일 변경 (수정 모드 표시)
        if (navSubmitBtn) {
            navSubmitBtn.title = '수정 완료';
            navSubmitBtn.classList.add('btn-edit-mode');
        }
    }

    function updateSample() {
        const formData = new FormData(form);
        const log = sampleLogs.find(l => l.id === editingId);

        // 축종 (기타 선택 시 입력값 사용)
        let animalType = formData.get('animalType');
        if (animalType === '기타') {
            animalType = animalTypeOtherInput.value || '기타';
        }

        if (log) {
            log.receptionNumber = formData.get('receptionNumber');
            log.date = formData.get('date');
            // 의뢰자 정보
            log.farmName = formData.get('farmName');
            log.name = formData.get('name');
            log.phoneNumber = formData.get('phoneNumber');
            log.address = formData.get('address');
            log.addressPostcode = formData.get('addressPostcode');
            log.addressRoad = formData.get('addressRoad');
            log.addressDetail = formData.get('addressDetail');
            log.farmName = formData.get('farmName');
            log.farmAddress = formData.get('farmAddressFull');
            log.farmArea = parseFormattedNumber(formData.get('farmArea') || '');
            log.farmAreaUnit = formData.get('farmAreaUnit') || 'm2';
            // 의뢰내용
            log.sampleType = formData.get('sampleType');
            log.animalType = animalType;
            log.productionDate = formData.get('productionDate');
            log.sampleCount = formData.get('sampleCount') || '1';
            log.rawMaterials = formData.get('rawMaterials');
            log.purpose = formData.get('purpose');
            log.receptionMethod = formData.get('receptionMethod');
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
    const printLabelBtn = document.getElementById('printLabelBtn');

    if (printLabelBtn) {
        printLabelBtn.addEventListener('click', () => {
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

        // 시료종류별
        const bySampleType = {};
        sampleLogs.forEach(l => {
            const type = l.sampleType || '미지정';
            bySampleType[type] = (bySampleType[type] || 0) + 1;
        });
        renderStatsChart('statsByCompostType', bySampleType, total);

        // 축종별
        const byAnimalType = {};
        sampleLogs.forEach(l => {
            const type = l.animalType || '미지정';
            byAnimalType[type] = (byAnimalType[type] || 0) + 1;
        });
        renderStatsChart('statsByTestPurpose', byAnimalType, total);

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
                    const searchTarget = `${log.name} ${log.receptionNumber} ${log.sampleType} ${log.animalType} ${log.farmName} ${log.companyName}`.toLowerCase();
                    if (!searchTarget.includes(textFilter)) match = false;
                }
                return match;
            });

            renderLogs(filtered);
            listSearchModal.classList.add('hidden');
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

            const excelData = sampleLogs.map(log => {
                // 면적 표시 (단위 포함)
                let areaDisplay = '-';
                if (log.farmArea) {
                    const unit = log.farmAreaUnit === 'pyeong' ? '평' : 'm²';
                    areaDisplay = `${log.farmArea} ${unit}`;
                }

                return {
                    '접수번호': log.receptionNumber || '-',
                    '접수일자': log.date || '-',
                    '농장명': log.farmName || '-',
                    '대표자': log.name || '-',
                    '연락처': log.phoneNumber || '-',
                    '우편번호': log.addressPostcode || '-',
                    '도로명주소': log.addressRoad || '-',
                    '상세주소': log.addressDetail || '-',
                    '전체주소': log.address || '-',
                    '농장주소': log.farmAddress || '-',
                    '농장면적': areaDisplay,
                    '시료종류': log.sampleType || '-',
                    '축종': log.animalType || '-',
                    '원료(부재료)': log.rawMaterials || '-',
                    '생산일': log.productionDate || '-',
                    '시료수': log.sampleCount || '-',
                    '검사목적': log.purpose || '-',
                    '통보방법': log.receptionMethod || '-',
                    '비고': log.note || '-',
                    '완료여부': log.isComplete ? '완료' : '미완료',
                    '등록일시': log.createdAt ? new Date(log.createdAt).toLocaleString('ko-KR') : '-'
                };
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            // 열 너비 설정
            ws['!cols'] = [
                { wch: 10 },  // 접수번호
                { wch: 12 },  // 접수일자
                { wch: 15 },  // 농장명
                { wch: 10 },  // 대표자
                { wch: 15 },  // 연락처
                { wch: 8 },   // 우편번호
                { wch: 30 },  // 도로명주소
                { wch: 20 },  // 상세주소
                { wch: 40 },  // 전체주소
                { wch: 30 },  // 농장주소
                { wch: 12 },  // 농장면적
                { wch: 12 },  // 시료종류
                { wch: 10 },  // 축종
                { wch: 15 },  // 원료(부재료)
                { wch: 12 },  // 생산일
                { wch: 8 },   // 시료수
                { wch: 25 },  // 검사목적
                { wch: 10 },  // 통보방법
                { wch: 20 },  // 비고
                { wch: 8 },   // 완료여부
                { wch: 20 }   // 등록일시
            ];

            XLSX.utils.book_append_sheet(wb, ws, '퇴액비 접수목록');

            const fileName = `퇴액비_접수목록_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Electron 환경에서는 FileAPI 사용
            if (isElectron) {
                const xlsxData = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
                FileAPI.saveExcel(xlsxData, fileName).then(saved => {
                    if (saved) {
                        showToast('엑셀 파일로 내보내기 완료', 'success');
                    }
                });
            } else {
                XLSX.writeFile(wb, fileName);
                showToast('엑셀 파일로 내보내기 완료', 'success');
            }
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
                sampleType: '퇴·액비',
                exportedAt: new Date().toISOString(),
                data: sampleLogs
            }, null, 2);

            const saved = await FileAPI.saveFile(content, `compost-samples-${new Date().toISOString().split('T')[0]}.json`);
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
                        if (confirm(`${loadedData.length}건의 데이터를 불러옵니다. 기존 데이터에 추가하시겠습니까?\n(취소 선택 시 기존 데이터를 대체합니다)`)) {
                            sampleLogs = [...sampleLogs, ...loadedData];
                        } else {
                            sampleLogs = loadedData;
                        }
                        saveLogs();
                        renderLogs(sampleLogs);
                        showToast(`${loadedData.length}건의 데이터를 불러왔습니다.`, 'success');
                    }
                } catch (error) {
                    showToast('파일 형식이 올바르지 않습니다.', 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // ========================================
    // Electron 전용: 파일 메뉴에서 불러오기
    // ========================================
    const loadFileBtn = document.getElementById('loadFileBtn');
    if (loadFileBtn) {
        loadFileBtn.addEventListener('click', async () => {
            const content = await FileAPI.openFile();
            if (content) {
                try {
                    const parsed = JSON.parse(content);
                    const loadedData = parsed.data || parsed;

                    if (Array.isArray(loadedData)) {
                        if (confirm(`${loadedData.length}건의 데이터를 불러옵니다. 기존 데이터에 추가하시겠습니까?\n(취소 선택 시 기존 데이터를 대체합니다)`)) {
                            sampleLogs = [...sampleLogs, ...loadedData];
                        } else {
                            sampleLogs = loadedData;
                        }
                        saveLogs();
                        renderLogs(sampleLogs);
                        showToast(`${loadedData.length}건의 데이터를 불러왔습니다.`, 'success');
                    }
                } catch (error) {
                    showToast('파일 형식이 올바르지 않습니다.', 'error');
                }
            }
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
                    console.log('💾 퇴액비 자동 저장 완료');
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
    window.triggerCompostAutoSave = autoSaveToFile;

    // 자동 저장 폴더 선택 버튼 (Electron 전용)
    if (selectAutoSaveFolderBtn && isElectron) {
        selectAutoSaveFolderBtn.addEventListener('click', async () => {
            try {
                const result = await window.electronAPI.selectAutoSaveFolder();
                if (result.success) {
                    FileAPI.autoSavePath = await window.electronAPI.getAutoSavePath('compost');
                    localStorage.setItem('compostAutoSaveFolderSelected', 'true');
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
                        suggestedName: 'compost-logs-autosave.json',
                        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
                    });
                    showToast('자동저장 파일이 설정되었습니다.', 'success');
                    if (autoSaveToggle) {
                        autoSaveToggle.checked = true;
                        localStorage.setItem('compostAutoSaveEnabled', 'true');
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
    const autoSaveEnabled = localStorage.getItem('compostAutoSaveEnabled') === 'true';
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
                    localStorage.setItem('compostAutoSaveEnabled', 'false');
                    updateAutoSaveStatus('inactive');
                    return;
                }

                if (isElectron) {
                    localStorage.setItem('compostAutoSaveEnabled', 'true');
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
                        suggestedName: `퇴액비성분검사_${today}.json`,
                        types: [{
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] }
                        }]
                    });

                    localStorage.setItem('compostAutoSaveEnabled', 'true');
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
                    localStorage.setItem('compostAutoSaveEnabled', 'false');
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
                    console.log('📂 퇴액비 자동 저장 파일에서 데이터 로드됨:', loadedData.length, '건');
                    renderLogs(sampleLogs);
                }
            }
        } catch (error) {
            console.error('자동 저장 파일 로드 오류:', error);
        }
    }

    // ========================================
    // 전체 보기/기본 보기 토글 기능
    // ========================================
    const viewToggleBtn = document.getElementById('toggleColumnsBtn');
    const logTable = document.querySelector('.data-table');
    let isFullView = false;

    if (viewToggleBtn && logTable) {
        viewToggleBtn.addEventListener('click', () => {
            isFullView = !isFullView;

            const toggleText = viewToggleBtn.querySelector('.toggle-text');
            const toggleIcon = viewToggleBtn.querySelector('.toggle-icon');

            if (isFullView) {
                logTable.classList.add('full-view');
                if (toggleText) toggleText.textContent = '기본 보기';
                if (toggleIcon) toggleIcon.textContent = '👁️‍🗨️';
                viewToggleBtn.classList.add('active');
            } else {
                logTable.classList.remove('full-view');
                if (toggleText) toggleText.textContent = '전체 보기';
                if (toggleIcon) toggleIcon.textContent = '👁️';
                viewToggleBtn.classList.remove('active');
            }
        });
    }

    // ========================================
    // 농장주소 자동완성 기능
    // ========================================
    function bindFarmAddressAutocomplete() {
        const farmAddressInput = document.getElementById('farmAddressFull');
        const autocompleteList = document.getElementById('farmAddressAutocomplete');

        if (!farmAddressInput || !autocompleteList) return;

        // 입력 시 자동완성 목록 표시
        farmAddressInput.addEventListener('input', (e) => {
            const value = e.target.value.trim();

            // 이미 완전한 주소면 자동완성 비활성화 (시/군으로 시작)
            if (value.startsWith('봉화군') || value.startsWith('영주시') || value.startsWith('울진군')) {
                autocompleteList.classList.remove('show');
                return;
            }

            if (value.length > 0 && typeof suggestRegionVillages === 'function') {
                const suggestions = suggestRegionVillages(value, ['bonghwa', 'yeongju', 'uljin']);

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

        // Enter 키 입력 시 자동 변환
        farmAddressInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();

                const value = farmAddressInput.value.trim();

                // 이미 완전한 주소면 무시
                if (value.startsWith('봉화군') || value.startsWith('영주시') || value.startsWith('울진군')) {
                    autocompleteList.classList.remove('show');
                    return;
                }

                // parseParcelAddress 사용 (세 지역 통합)
                if (typeof parseParcelAddress === 'function') {
                    const result = parseParcelAddress(value);

                    if (result) {
                        // 세 지역 간 중복인 경우
                        if (result.isDuplicate) {
                            // 지역 선택 목록 표시
                            autocompleteList.innerHTML = result.alternatives.map(alt => `
                                <li data-village="${alt.village}" data-district="${alt.district}" data-region="${alt.region}" data-lot="${result.lotNumber}">
                                    ${alt.region} ${alt.district} ${alt.village} ${result.lotNumber || ''}
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
                        }
                        // 유일한 결과인 경우
                        else {
                            const fullAddress = `${result.region} ${result.district} ${result.village}${result.lotNumber ? ' ' + result.lotNumber : ''}`;
                            farmAddressInput.value = fullAddress;
                            autocompleteList.classList.remove('show');
                        }
                    }
                }
            }
        });

        // 자동완성 목록 클릭 선택
        autocompleteList.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (li) {
                const village = li.dataset.village;
                const district = li.dataset.district;
                const region = li.dataset.region;
                const lot = li.dataset.lot || '';

                const fullAddress = `${region} ${district} ${village}${lot ? ' ' + lot : ''}`;
                farmAddressInput.value = fullAddress;
                autocompleteList.classList.remove('show');
            }
        });

        // 외부 클릭 시 자동완성 목록 숨기기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.lot-address-autocomplete-wrapper')) {
                autocompleteList.classList.remove('show');
            }
        });
    }

    // 농장주소 자동완성 바인딩 실행
    bindFarmAddressAutocomplete();

    // ========================================
    // 초기화
    // ========================================
    renderLogs(sampleLogs);
    updateRecordCount();

    console.log('✅ 퇴·액비 성분검사 위탁서 페이지 로드 완료');
});
