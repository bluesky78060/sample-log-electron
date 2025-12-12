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
            this.autoSavePath = await window.electronAPI.getAutoSavePath();
            console.log('📁 Electron 자동 저장 경로:', this.autoSavePath);
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
                const baseNumber = log.receptionNumber.split('-')[0];
                const num = parseInt(baseNumber, 10);
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            }
        });

        const nextNumber = maxNumber + 1;
        return String(nextNumber);
    }

    receptionNumberInput.value = generateNextReceptionNumber();

    // ========================================
    // 폼 제출
    // ========================================
    const navSubmitBtn = document.getElementById('navSubmitBtn');
    const navResetBtn = document.getElementById('navResetBtn');

    if (navSubmitBtn) {
        navSubmitBtn.addEventListener('click', () => {
            if (form.checkValidity()) {
                submitForm();
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
        const data = {
            id: Date.now().toString(),
            sampleType: SAMPLE_TYPE,
            receptionNumber: formData.get('receptionNumber') || generateNextReceptionNumber(),
            date: formData.get('date'),
            name: formData.get('name'),
            birthDate: formData.get('birthDate'),
            phoneNumber: formData.get('phoneNumber'),
            address: formData.get('address'),
            addressPostcode: formData.get('addressPostcode'),
            addressRoad: formData.get('addressRoad'),
            addressDetail: formData.get('addressDetail'),
            receptionMethod: formData.get('receptionMethod'),
            sampleName: formData.get('sampleName'),
            waterType: formData.get('waterType'),
            sampleCount: formData.get('sampleCount'),
            mainCrop: formData.get('mainCrop'),
            samplingLocation: formData.get('samplingLocation'),
            purpose: formData.get('purpose'),
            testItems: formData.get('testItems'),
            note: formData.get('note'),
            isComplete: false,
            createdAt: new Date().toISOString()
        };

        sampleLogs.push(data);
        saveLogs();
        showToast('시료가 등록되었습니다.', 'success');

        // 결과 모달 표시
        showRegistrationResult(data);

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
            <tr><th>수질종류</th><td>${data.waterType}</td></tr>
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleLogs));
        updateRecordCount();

        // 자동 저장
        if (isElectron && document.getElementById('autoSaveToggle')?.checked) {
            const autoSaveContent = JSON.stringify({
                sampleType: SAMPLE_TYPE,
                savedAt: new Date().toISOString(),
                data: sampleLogs
            }, null, 2);
            FileAPI.autoSave(autoSaveContent);
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
                <td>${log.sampleName || '-'}</td>
                <td>${log.waterType || '-'}</td>
                <td>${log.sampleCount || 1}점</td>
                <td class="text-truncate" title="${log.samplingLocation || ''}">${log.samplingLocation || '-'}</td>
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

    let editingId = null;

    function editSample(id) {
        const log = sampleLogs.find(l => l.id === id);
        if (!log) return;

        editingId = id;

        // 폼에 데이터 채우기
        receptionNumberInput.value = log.receptionNumber || '';
        dateInput.value = log.date || '';
        document.getElementById('name').value = log.name || '';
        document.getElementById('birthDate').value = log.birthDate || '';
        document.getElementById('phoneNumber').value = log.phoneNumber || '';
        addressPostcode.value = log.addressPostcode || '';
        addressRoad.value = log.addressRoad || '';
        addressDetail.value = log.addressDetail || '';
        addressHidden.value = log.address || '';
        document.getElementById('sampleName').value = log.sampleName || '';
        document.getElementById('waterType').value = log.waterType || '';
        document.getElementById('sampleCount').value = log.sampleCount || 1;
        document.getElementById('mainCrop').value = log.mainCrop || '';
        document.getElementById('samplingLocation').value = log.samplingLocation || '';
        document.getElementById('note').value = log.note || '';

        // 통보방법 선택
        receptionMethodBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.method === log.receptionMethod);
        });
        receptionMethodInput.value = log.receptionMethod || '';

        // 목적 선택
        const purposeRadio = document.querySelector(`input[name="purpose"][value="${log.purpose}"]`);
        if (purposeRadio) purposeRadio.checked = true;

        // 검사항목 선택
        const testItemsRadio = document.querySelector(`input[name="testItems"][value="${log.testItems}"]`);
        if (testItemsRadio) {
            testItemsRadio.checked = true;
            if (log.testItems === '생활용수') {
                livingWaterItems.classList.add('active');
                agriculturalWaterItems.classList.remove('active');
            } else {
                livingWaterItems.classList.remove('active');
                agriculturalWaterItems.classList.add('active');
            }
        }

        switchView('form');
        showToast('수정 모드입니다. 변경 후 등록 버튼을 클릭하세요.', 'warning');

        // 제출 버튼을 수정 모드로 변경
        navSubmitBtn.onclick = () => {
            if (form.checkValidity()) {
                updateSample();
            } else {
                form.reportValidity();
            }
        };
    }

    function updateSample() {
        const formData = new FormData(form);
        const log = sampleLogs.find(l => l.id === editingId);

        if (log) {
            log.receptionNumber = formData.get('receptionNumber');
            log.date = formData.get('date');
            log.name = formData.get('name');
            log.birthDate = formData.get('birthDate');
            log.phoneNumber = formData.get('phoneNumber');
            log.address = formData.get('address');
            log.addressPostcode = formData.get('addressPostcode');
            log.addressRoad = formData.get('addressRoad');
            log.addressDetail = formData.get('addressDetail');
            log.receptionMethod = formData.get('receptionMethod');
            log.sampleName = formData.get('sampleName');
            log.waterType = formData.get('waterType');
            log.sampleCount = formData.get('sampleCount');
            log.mainCrop = formData.get('mainCrop');
            log.samplingLocation = formData.get('samplingLocation');
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
            navSubmitBtn.onclick = () => {
                if (form.checkValidity()) {
                    submitForm();
                } else {
                    form.reportValidity();
                }
            };
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

        // 수질 종류별
        const byWaterType = {};
        sampleLogs.forEach(l => {
            const type = l.waterType || '미지정';
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
                '접수번호': log.receptionNumber,
                '접수일자': log.date,
                '성명': log.name,
                '연락처': log.phoneNumber,
                '주소': log.address,
                '시료명': log.sampleName,
                '수질종류': log.waterType,
                '시료수': log.sampleCount,
                '채취장소': log.samplingLocation,
                '주작목': log.mainCrop,
                '목적': log.purpose,
                '검사항목': log.testItems,
                '통보방법': log.receptionMethod,
                '비고': log.note,
                '완료여부': log.isComplete ? '완료' : '미완료'
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, '수질분석 접수');
            XLSX.writeFile(wb, `수질분석접수_${new Date().toISOString().split('T')[0]}.xlsx`);
            showToast('엑셀 파일이 저장되었습니다.', 'success');
        });
    }

    // ========================================
    // 자동 저장 설정
    // ========================================
    const autoSaveToggle = document.getElementById('autoSaveToggle');
    const selectAutoSaveFolderBtn = document.getElementById('selectAutoSaveFolderBtn');

    if (autoSaveToggle) {
        autoSaveToggle.checked = localStorage.getItem('waterAutoSaveEnabled') === 'true';
        autoSaveToggle.addEventListener('change', () => {
            localStorage.setItem('waterAutoSaveEnabled', autoSaveToggle.checked);
        });
    }

    if (selectAutoSaveFolderBtn && isElectron) {
        selectAutoSaveFolderBtn.addEventListener('click', async () => {
            try {
                const result = await window.electronAPI.selectAutoSaveFolder();
                if (result.success) {
                    FileAPI.autoSavePath = result.path;
                    showToast('자동 저장 폴더가 설정되었습니다.', 'success');
                }
            } catch (error) {
                console.error('폴더 선택 오류:', error);
            }
        });
    }

    // ========================================
    // 초기 렌더링
    // ========================================
    renderLogs(sampleLogs);

    console.log('✅ 수질분석 페이지 초기화 완료');
});
