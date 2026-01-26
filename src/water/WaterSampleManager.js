// ========================================
// Water Sample Manager
// 수질분석 시료 관리 클래스
// ========================================

/**
 * 수질분석 시료 관리 매니저
 * BaseSampleManager를 확장하여 수질분석 특화 기능 구현
 */
class WaterSampleManager extends BaseSampleManager {
    constructor() {
        super({
            moduleKey: 'water',
            moduleName: '수질분석',
            storageKey: 'waterSampleLogs',
            debug: false
        });

        // 수질분석 전용 상태
        this.samplingLocationCount = 1;
        this.cropItemCount = 1;
    }

    /**
     * 초기화 - 부모 클래스 초기화 + 수질분석 특화 초기화
     */
    async init() {
        await super.init();

        // 수질분석 전용 초기화
        this.initSamplingLocations();
        this.initSamplingCrops();
        this.initWaterSpecificElements();
    }

    /**
     * 채취장소 초기화
     */
    initSamplingLocations() {
        const locationsWrapper = document.getElementById('samplingLocationsWrapper');
        const addLocationBtn = document.getElementById('addSamplingLocation');

        if (addLocationBtn) {
            addLocationBtn.addEventListener('click', () => this.addSamplingLocation());
        }

        // 초기 채취장소 필드가 없으면 추가
        if (locationsWrapper && locationsWrapper.children.length === 0) {
            this.addSamplingLocation();
        }
    }

    /**
     * 채취작물 초기화
     */
    initSamplingCrops() {
        const cropsWrapper = document.getElementById('samplingCropsWrapper');
        const addCropBtn = document.getElementById('addSamplingCrop');

        if (addCropBtn) {
            addCropBtn.addEventListener('click', () => this.addSamplingCrop());
        }

        // 초기 채취작물 필드가 없으면 추가
        if (cropsWrapper && cropsWrapper.children.length === 0) {
            this.addSamplingCrop();
        }
    }

    /**
     * 수질분석 전용 요소 초기화
     */
    initWaterSpecificElements() {
        // 주소 입력 필드 처리
        if (window.setupAddressAutocomplete) {
            window.setupAddressAutocomplete();
        }
    }

    /**
     * 채취장소 추가
     */
    addSamplingLocation() {
        const wrapper = document.getElementById('samplingLocationsWrapper');
        if (!wrapper) return;

        const div = document.createElement('div');
        div.className = 'sampling-location-item';
        div.innerHTML = `
            <input type="text"
                name="samplingLocation[]"
                placeholder="채취장소 ${this.samplingLocationCount}"
                class="form-control">
            <button type="button" class="btn btn-danger btn-sm" onclick="waterManager.removeSamplingLocation(this)">삭제</button>
        `;

        wrapper.appendChild(div);
        this.samplingLocationCount++;
    }

    /**
     * 채취장소 삭제
     */
    removeSamplingLocation(button) {
        const wrapper = document.getElementById('samplingLocationsWrapper');
        const items = wrapper.querySelectorAll('.sampling-location-item');

        // 최소 1개는 유지
        if (items.length > 1) {
            button.parentElement.remove();
        }
    }

    /**
     * 채취작물 추가
     */
    addSamplingCrop() {
        const wrapper = document.getElementById('samplingCropsWrapper');
        if (!wrapper) return;

        const div = document.createElement('div');
        div.className = 'crop-item';

        const cropList = window.cropData ? Object.keys(window.cropData).sort() : [];
        const options = cropList.map(crop => `<option value="${crop}">${crop}</option>`).join('');

        div.innerHTML = `
            <select name="samplingCrop[]" class="form-control">
                <option value="">작물 선택</option>
                ${options}
            </select>
            <button type="button" class="btn btn-danger btn-sm" onclick="waterManager.removeSamplingCrop(this)">삭제</button>
        `;

        wrapper.appendChild(div);
        this.cropItemCount++;
    }

    /**
     * 채취작물 삭제
     */
    removeSamplingCrop(button) {
        const wrapper = document.getElementById('samplingCropsWrapper');
        const items = wrapper.querySelectorAll('.crop-item');

        // 최소 1개는 유지
        if (items.length > 1) {
            button.parentElement.remove();
        }
    }

    /**
     * 모든 채취장소 가져오기
     */
    getAllSamplingLocations() {
        const inputs = document.querySelectorAll('input[name="samplingLocation[]"]');
        return Array.from(inputs)
            .map(input => input.value.trim())
            .filter(value => value);
    }

    /**
     * 모든 채취작물 가져오기
     */
    getAllSamplingCrops() {
        const selects = document.querySelectorAll('select[name="samplingCrop[]"]');
        return Array.from(selects)
            .map(select => select.value.trim())
            .filter(value => value);
    }

    /**
     * 로그 렌더링 (수질분석 테이블)
     */
    renderLogs(logs) {
        if (!this.tableBody) return;

        this.tableBody.innerHTML = '';

        if (logs.length === 0) {
            if (this.emptyState) {
                this.emptyState.style.display = 'flex';
            }
            return;
        }

        if (this.emptyState) {
            this.emptyState.style.display = 'none';
        }

        // 페이지네이션 적용
        const pageRange = this.paginationManager?.getPageRange() || { start: 0, end: logs.length };
        const paginatedLogs = logs.slice(pageRange.start, pageRange.end);

        paginatedLogs.forEach(log => {
            const row = this.createTableRow(log);
            this.tableBody.appendChild(row);
        });

        // 페이지네이션 UI 업데이트
        if (this.paginationManager) {
            this.paginationManager.updatePagination();
        }
    }

    /**
     * 테이블 행 생성
     */
    createTableRow(log) {
        const tr = document.createElement('tr');

        // 채취장소 표시
        const samplingLocation = Array.isArray(log.samplingLocation)
            ? log.samplingLocation.join(', ')
            : log.samplingLocation || '';

        // 채취작물 표시
        const samplingCrops = Array.isArray(log.samplingCrops)
            ? log.samplingCrops.join(', ')
            : log.samplingCrops || '';

        // 완료 여부에 따른 스타일
        if (log.completed) {
            tr.classList.add('completed');
        }

        tr.innerHTML = `
            <td>
                <input type="checkbox" class="select-sample" value="${log.id}">
            </td>
            <td>
                <button class="btn-link edit-btn" onclick="waterManager.editSample('${log.id}')">
                    ${log.receptionNumber || '-'}
                </button>
            </td>
            <td>${log.date || '-'}</td>
            <td>${log.sampleName || '-'}</td>
            <td>${log.applicantName || '-'}</td>
            <td>${log.phoneNumber || '-'}</td>
            <td class="address-cell">${log.address || '-'}</td>
            <td>${samplingLocation}</td>
            <td>${samplingCrops}</td>
            <td>${log.receptionMethod || '-'}</td>
            <td>
                ${log.completed
                    ? '<span class="badge badge-success">완료</span>'
                    : '<span class="badge badge-secondary">미완료</span>'}
            </td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="waterManager.confirmDelete('${log.id}')">
                    <i class="fas fa-trash"></i> 삭제
                </button>
            </td>
        `;

        return tr;
    }

    /**
     * 폼 제출
     */
    submitForm() {
        const formData = new FormData(this.form);
        const samplingLocations = this.getAllSamplingLocations();
        const samplingCrops = this.getAllSamplingCrops();

        // 접수번호 파싱
        const receptionNumbers = this.parseReceptionNumbers(formData.get('receptionNumber'));

        // 유효성 검사
        if (receptionNumbers.length === 0) {
            this.showToast('접수번호를 입력하세요.', 'error');
            return;
        }

        const baseData = {
            date: formData.get('date'),
            sampleName: formData.get('sampleName'),
            applicantName: formData.get('applicantName'),
            phoneNumber: formData.get('phoneNumber'),
            address: formData.get('address'),
            detailAddress: formData.get('detailAddress'),
            samplingLocation: samplingLocations,
            samplingCrops: samplingCrops,
            receptionMethod: formData.get('receptionMethod'),
            completed: formData.get('completed') === 'on'
        };

        // 편집 모드
        if (this.editingId) {
            const existingLog = this.sampleLogs.find(l => String(l.id) === this.editingId);
            if (existingLog) {
                Object.assign(existingLog, baseData, {
                    receptionNumber: receptionNumbers[0],
                    id: existingLog.id
                });
                this.saveLogs();
                this.showToast('수정되었습니다.', 'success');
                this.resetForm();
                this.switchView('list');
            }
            return;
        }

        // 새로 추가
        const newLogs = receptionNumbers.map(num => ({
            ...baseData,
            receptionNumber: num,
            id: this.generateId()
        }));

        this.sampleLogs.push(...newLogs);
        this.saveLogs();

        this.showToast(`${newLogs.length}건이 등록되었습니다.`, 'success');
        this.resetForm();

        // 연속 입력 모드
        const continuousInput = document.getElementById('continuousInput');
        if (!continuousInput || !continuousInput.checked) {
            this.switchView('list');
        }
    }

    /**
     * 샘플 편집
     */
    editSample(id) {
        const log = this.sampleLogs.find(l => String(l.id) === id);
        if (!log) return;

        // 폼 필드에 데이터 채우기
        document.getElementById('receptionNumber').value = log.receptionNumber || '';
        document.getElementById('date').value = log.date || '';
        document.getElementById('sampleName').value = log.sampleName || '';
        document.getElementById('applicantName').value = log.applicantName || '';
        document.getElementById('phoneNumber').value = log.phoneNumber || '';
        document.getElementById('address').value = log.address || '';
        document.getElementById('detailAddress').value = log.detailAddress || '';
        document.getElementById('receptionMethod').value = log.receptionMethod || '직접수령';
        document.getElementById('completed').checked = log.completed || false;

        // 채취장소 설정
        this.setSamplingLocations(log.samplingLocation);

        // 채취작물 설정
        this.setSamplingCrops(log.samplingCrops);

        // 수령방법 버튼 활성화
        const methodBtns = document.querySelectorAll('.method-btn');
        methodBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === log.receptionMethod);
        });

        this.editingId = String(id);
        this.switchView('register');
    }

    /**
     * 채취장소 설정 (편집 시)
     */
    setSamplingLocations(locations) {
        const wrapper = document.getElementById('samplingLocationsWrapper');
        if (!wrapper) return;

        // 기존 필드 모두 제거
        wrapper.innerHTML = '';
        this.samplingLocationCount = 1;

        // 배열 처리
        const locationArray = Array.isArray(locations) ? locations : [locations || ''];

        locationArray.forEach(location => {
            this.addSamplingLocation();
            const inputs = wrapper.querySelectorAll('input[name="samplingLocation[]"]');
            const lastInput = inputs[inputs.length - 1];
            if (lastInput) {
                lastInput.value = location;
            }
        });
    }

    /**
     * 채취작물 설정 (편집 시)
     */
    setSamplingCrops(crops) {
        const wrapper = document.getElementById('samplingCropsWrapper');
        if (!wrapper) return;

        // 기존 필드 모두 제거
        wrapper.innerHTML = '';
        this.cropItemCount = 1;

        // 배열 처리
        const cropArray = Array.isArray(crops) ? crops : [crops || ''];

        cropArray.forEach(crop => {
            this.addSamplingCrop();
            const selects = wrapper.querySelectorAll('select[name="samplingCrop[]"]');
            const lastSelect = selects[selects.length - 1];
            if (lastSelect) {
                lastSelect.value = crop;
            }
        });
    }

    /**
     * 폼 초기화
     */
    resetForm() {
        if (this.form) {
            this.form.reset();
        }

        // 채취장소 초기화
        const locWrapper = document.getElementById('samplingLocationsWrapper');
        if (locWrapper) {
            locWrapper.innerHTML = '';
            this.samplingLocationCount = 1;
            this.addSamplingLocation();
        }

        // 채취작물 초기화
        const cropWrapper = document.getElementById('samplingCropsWrapper');
        if (cropWrapper) {
            cropWrapper.innerHTML = '';
            this.cropItemCount = 1;
            this.addSamplingCrop();
        }

        // 수령방법 초기화
        const methodBtns = document.querySelectorAll('.method-btn');
        methodBtns.forEach((btn, index) => {
            btn.classList.toggle('active', index === 0);
        });

        document.getElementById('receptionMethod').value = '직접수령';

        this.editingId = null;
    }

    /**
     * 삭제 확인
     */
    confirmDelete(id) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.deleteSample(id);
        }
    }

    /**
     * 접수번호 파싱
     */
    parseReceptionNumbers(input) {
        if (!input) return [];

        return input.split(',')
            .map(num => num.trim())
            .filter(num => num)
            .map(num => parseInt(num))
            .filter(num => !isNaN(num));
    }

    /**
     * 페이지네이션 초기화 오버라이드
     */
    initPagination() {
        if (window.PaginationManager) {
            this.paginationManager = new PaginationManager({
                onPageChange: () => this.renderLogs(this.sampleLogs),
                getFilteredData: () => this.sampleLogs
            });
        }
    }
}

// 전역 인스턴스 생성
let waterManager = null;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    waterManager = new WaterSampleManager();
    await waterManager.init();

    // 전역으로 노출 (기존 호환성)
    window.waterManager = waterManager;
});