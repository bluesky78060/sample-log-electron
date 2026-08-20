/**
 * @fileoverview 토양 중금속 시료 전용 스크립트 (BaseSampleManager 확장)
 * @description 중금속 분석용 토양 시료 접수/관리 기능
 */

class HeavyMetalSampleManager extends window.BaseSampleManager {
    constructor() {
        super({
            moduleKey: 'heavyMetal',
            moduleName: '토양 중금속',
            storageKey: 'heavyMetalSampleLogs',
            sampleType: '중금속',
            autoSaveFile: 'heavy-metal-autosave.json',
            debug: !!window.DEBUG
        });

        this.ANALYSIS_ITEMS = ['구리', '납', '니켈', '비소', '수은', '아연', '카드뮴', '6가크롬'];
        this.isAllSelected = false;
        this.autoSaveFileHandle = null;
        this.listViewStale = true;
        this.currentSearchFilter = {
            dateFrom: '', dateTo: '', name: '',
            receptionFrom: '', receptionTo: '', completed: 'incomplete'
        };
        this.currentRegistrationData = null;
        this.pendingMailDateIndices = [];

        // 경상북도 지역명
        this.GYEONGBUK_REGION_NAMES = [
            '포항시', '경주시', '김천시', '안동시', '구미시',
            '영천시', '상주시', '문경시', '경산시',
            '군위군', '의성군', '청송군', '영양군', '영덕군',
            '청도군', '고령군', '성주군', '칠곡군', '예천군',
            '봉화군', '울릉군', '영주시', '울진군'
        ];
    }

    // ========================================
    // 오버라이드: DOM 요소 캐싱
    // ========================================
    cacheElements() {
        super.cacheElements();
        this.form = document.getElementById('sampleForm');
        this.tableBody = document.getElementById('logTableBody');
        this.emptyState = document.getElementById('emptyState');
        this.recordCountEl = document.getElementById('recordCount');
    }

    // ========================================
    // 오버라이드: 연락처 자동 하이픈 포맷팅
    // (base의 window.formatPhoneNumber 의존을 SampleUtils 경로로 대체)
    // ========================================
    setupPhoneFormatting() {
        const phoneInput = document.getElementById('phoneNumber');
        if (phoneInput && window.SampleUtils?.setupPhoneNumberInput) {
            window.SampleUtils.setupPhoneNumberInput(phoneInput);
        }
    }

    // ========================================
    // 오버라이드: 뷰 전환 (listViewStale 지원)
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
    // 오버라이드: 테이블 행 빌드
    // ========================================
    buildTableRow(item, index) {
        const tr = document.createElement('tr');
        tr.dataset.id = item.id;

        const analysisItemsStr = item.analysisItems ? item.analysisItems.join(', ') : '';
        const isAllItems = item.analysisItems && item.analysisItems.length === this.ANALYSIS_ITEMS.length;
        const analysisItemsDisplay = !item.analysisItems || item.analysisItems.length === 0
            ? '-'
            : isAllItems ? '전체 항목' : analysisItemsStr;

        const methodText = item.receptionMethod || '-';

        // 뷰용 주소: 시도 패턴이 있을 때만 제거
        const addressRoadVal = [item.addressRoad, item.addressDetail].filter(Boolean).join(' ') || '-';
        const displayAddress = addressRoadVal !== '-' && SIDO_PATTERN.test(addressRoadVal)
            ? addressRoadVal.replace(SIDO_PATTERN, '')
            : addressRoadVal;

        // 채취장소: 시도 패턴이 있을 때만 제거 (주소 컬럼과 동일 규칙)
        const samplingLocationRaw = item.samplingLocation || '-';
        const displaySamplingLocation = samplingLocationRaw !== '-' && SIDO_PATTERN.test(samplingLocationRaw)
            ? samplingLocationRaw.replace(SIDO_PATTERN, '')
            : samplingLocationRaw;

        // XSS 방지
        const safeName = escapeHTML(item.name || '-');
        const safeDisplayAddress = escapeHTML(displayAddress);
        const displayPhone = item.phoneNumber && window.SampleUtils?.formatPhoneNumber
            ? (window.SampleUtils.formatPhoneNumber(item.phoneNumber) || item.phoneNumber)
            : (item.phoneNumber || '-');
        const safePhone = escapeHTML(displayPhone);
        const safeSamplingLocation = escapeHTML(displaySamplingLocation);
        const safeCropName = escapeHTML(item.cropName || '-');
        const safeNote = escapeHTML(item.note || '-');

        const applicantType = item.applicantType || '개인';
        const birthOrCorp = applicantType === '법인' ? (item.corpNumber || '-') : (item.birthDate || '-');

        // 1. Checkbox
        const tdCheckbox = document.createElement('td');
        tdCheckbox.className = 'sticky-col col-checkbox';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'row-checkbox';
        checkbox.dataset.id = item.id;
        tdCheckbox.appendChild(checkbox);
        tr.appendChild(tdCheckbox);

        // 2. Complete button
        const tdComplete = document.createElement('td');
        tdComplete.className = 'sticky-col col-complete';
        const btnComplete = document.createElement('button');
        btnComplete.className = item.isComplete ? 'btn-complete completed' : 'btn-complete';
        btnComplete.dataset.id = item.id;
        btnComplete.title = item.isComplete ? '완료됨' : '미완료';
        btnComplete.textContent = item.isComplete ? '✓' : '○';
        tdComplete.appendChild(btnComplete);
        tr.appendChild(tdComplete);

        // 3. Result button
        const tdResult = document.createElement('td');
        tdResult.className = 'sticky-col col-result';
        const btnResult = document.createElement('button');
        btnResult.className = 'btn-result' +
            (item.testResult === 'pass' ? ' pass' :
             item.testResult === 'fail' ? ' fail' : '');
        btnResult.dataset.id = item.id;
        btnResult.title = item.testResult === 'pass' ? '적합' :
                         item.testResult === 'fail' ? '부적합' : '미판정 (클릭하여 변경)';
        btnResult.textContent = item.testResult === 'pass' ? '적합' :
                               item.testResult === 'fail' ? '부적합' : '-';
        tdResult.appendChild(btnResult);
        tr.appendChild(tdResult);

        // 4. Reception number
        const tdReceptionNumber = document.createElement('td');
        tdReceptionNumber.className = 'sticky-col col-num';
        tdReceptionNumber.textContent = item.receptionNumber || '-';
        tr.appendChild(tdReceptionNumber);

        // 5. Date
        const tdDate = document.createElement('td');
        tdDate.className = 'sticky-col col-date';
        tdDate.textContent = item.date || '-';
        tr.appendChild(tdDate);

        // 6. Name (클릭 시 같은 이름 일괄 선택)
        const tdName = document.createElement('td');
        tdName.className = 'sticky-col col-name';
        tdName.dataset.name = item.name || '';
        tdName.textContent = safeName;
        tdName.title = `"${safeName}" 클릭하면 같은 이름 일괄 선택`;
        tr.appendChild(tdName);

        // 7. Applicant type (hidden)
        const tdApplicantType = document.createElement('td');
        tdApplicantType.className = 'col-applicant-type col-hidden';
        tdApplicantType.textContent = applicantType;
        tr.appendChild(tdApplicantType);

        // 8. Birth/Corp number (hidden)
        const tdBirthCorp = document.createElement('td');
        tdBirthCorp.className = 'col-birth-corp col-hidden';
        tdBirthCorp.textContent = birthOrCorp;
        tr.appendChild(tdBirthCorp);

        // 9. Address
        const tdAddress = document.createElement('td');
        tdAddress.className = 'col-address';
        tdAddress.textContent = safeDisplayAddress;
        tr.appendChild(tdAddress);

        // 10. Phone
        const tdPhone = document.createElement('td');
        tdPhone.textContent = safePhone;
        tr.appendChild(tdPhone);

        // 11. Sampling location
        const tdSamplingLocation = document.createElement('td');
        tdSamplingLocation.textContent = safeSamplingLocation;
        tr.appendChild(tdSamplingLocation);

        // 12. Crop name (with tree age if present)
        const tdCropName = document.createElement('td');
        tdCropName.textContent = safeCropName + (item.treeAge ? ' (' + item.treeAge + '년생)' : '');
        tr.appendChild(tdCropName);

        // 13. Sampling date
        const tdSamplingDate = document.createElement('td');
        tdSamplingDate.textContent = item.samplingDate || '-';
        tr.appendChild(tdSamplingDate);

        // 14. Analysis items (with tooltip)
        const tdAnalysisItems = document.createElement('td');
        tdAnalysisItems.className = 'text-truncate';
        tdAnalysisItems.setAttribute('data-tooltip', analysisItemsStr);
        tdAnalysisItems.textContent = analysisItemsDisplay;
        tr.appendChild(tdAnalysisItems);

        // 15. Purpose
        const tdPurpose = document.createElement('td');
        tdPurpose.textContent = item.purpose || '-';
        tr.appendChild(tdPurpose);

        // 16. Reception method
        const tdMethod = document.createElement('td');
        tdMethod.textContent = methodText;
        tr.appendChild(tdMethod);

        // 17. Note (with tooltip)
        const tdNote = document.createElement('td');
        tdNote.className = 'text-truncate';
        tdNote.setAttribute('data-tooltip', safeNote);
        tdNote.textContent = safeNote;
        tr.appendChild(tdNote);

        // 18. Mail date
        const tdMailDate = document.createElement('td');
        tdMailDate.className = 'col-mail-date';
        tdMailDate.textContent = item.mailDate || '-';
        tr.appendChild(tdMailDate);

        // 19. Analysis result button
        const tdAnalysis = document.createElement('td');
        tdAnalysis.className = 'col-analysis';
        const btnAnalysis = document.createElement('button');
        btnAnalysis.className = 'btn-analysis-open';
        btnAnalysis.dataset.id = item.id;
        btnAnalysis.title = '분석결과 입력/수정';
        const existingResult = this.loadHeavyMetalTestResult(item.id);
        if (existingResult && Object.keys(existingResult).some(k => !['id','testDate','judgment','updatedAt','_resultKey'].includes(k) && existingResult[k])) {
            btnAnalysis.classList.add('has-result');
            btnAnalysis.textContent = '결과확인';
        } else {
            btnAnalysis.textContent = '결과입력';
        }
        tdAnalysis.appendChild(btnAnalysis);
        tr.appendChild(tdAnalysis);

        // 20. Action buttons
        const tdActions = document.createElement('td');
        tdActions.className = 'col-action';   // sticky 고정 (SAMPL-2-35)
        const actionDiv = document.createElement('div');
        actionDiv.className = 'action-btns';

        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-edit';
        btnEdit.dataset.id = item.id;
        btnEdit.title = '수정';
        btnEdit.textContent = '✏️';

        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-delete';
        btnDelete.dataset.id = item.id;
        btnDelete.title = '삭제';
        btnDelete.textContent = '🗑️';

        actionDiv.appendChild(btnEdit);
        actionDiv.appendChild(btnDelete);
        tdActions.appendChild(actionDiv);
        tr.appendChild(tdActions);

        return tr;
    }

    // ========================================
    // 오버라이드: 폼 제출
    // ========================================
    submitForm() {
        const showToast = window.showToast;

        // 필수 필드 검증
        const name = document.getElementById('name')?.value.trim();
        const phoneNumber = document.getElementById('phoneNumber')?.value.trim();
        const samplingLocation = document.getElementById('samplingLocation')?.value.trim();
        const cropName = document.getElementById('cropName')?.value.trim();
        const samplingDate = document.getElementById('samplingDate')?.value;
        const selectedPurpose = document.querySelector('input[name="purpose"]:checked')?.value;
        const selectedItems = Array.from(document.querySelectorAll('input[name="analysisItems"]:checked')).map(cb => cb.value);

        if (!name) { showToast('성명을 입력해주세요.', 'error'); document.getElementById('name')?.focus(); return; }
        if (!phoneNumber) { showToast('연락처를 입력해주세요.', 'error'); document.getElementById('phoneNumber')?.focus(); return; }
        if (!samplingLocation) { showToast('시료채취 장소를 입력해주세요.', 'error'); document.getElementById('samplingLocation')?.focus(); return; }
        if (!cropName) { showToast('재배 작물을 입력해주세요.', 'error'); document.getElementById('cropName')?.focus(); return; }
        if (!samplingDate) { showToast('시료 채취일을 선택해주세요.', 'error'); document.getElementById('samplingDate')?.focus(); return; }
        if (selectedItems.length === 0) { showToast('분석의뢰 항목을 1개 이상 선택해주세요.', 'error'); return; }
        if (!selectedPurpose) { showToast('목적(용도)을 선택해주세요.', 'error'); return; }

        const today = new Date().toISOString().split('T')[0];

        // 공통 입력 필드는 Base collectCommonFormData로 수집 (L1 Phase 3 P3-A)
        // date/name/phoneNumber는 heavy-metal 고유 동작(기본값 today, trim)을 보존하기 위해 오버라이드
        const formData = new FormData(this.form);
        // 편집 중이면 기존 레코드를 한 번만 조회해 인덱스·원본 모두 재사용 (String 정규화 — SAMPL-1-147)
        const editIdx = this.editingId
            ? this.sampleLogs.findIndex(l => String(l.id) === String(this.editingId))
            : -1;
        if (this.editingId && editIdx < 0) {
            // 가짜 성공 금지 — 대상을 못 찾으면 저장/초기화를 진행하지 않고 알린다 (SAMPL-1-147)
            this.notifyEditTargetMissing('submitForm');
            return;
        }
        const existing = editIdx >= 0 ? this.sampleLogs[editIdx] : null;

        const data = {
            // 기존 레코드를 먼저 펼쳐 폼 밖 필드(mailDate/testResult 등 후발 추가 필드 포함)를 보존한다.
            // 이 레코드는 sampleLogs[editIdx]를 전체 교체하므로, 나열 누락 = 조용한 데이터 유실 (SAMPL-1-147)
            ...(existing || {}),
            id: this.editingId || this.generateId(),
            ...this.collectCommonFormData(formData),
            receptionNumber: document.getElementById('receptionNumber')?.value || this.generateNextReceptionNumber(),
            date: document.getElementById('date')?.value || today,
            name: name,
            phoneNumber: phoneNumber,
            samplingLocation: samplingLocation,
            cropName: cropName,
            treeAge: document.getElementById('treeAge')?.value || '',
            samplingDate: samplingDate,
            sampleCount: document.getElementById('sampleCount')?.value || 1,
            analysisItems: selectedItems,
            isComplete: existing?.isComplete || false,
            // 폼 밖에서 설정되는 필드는 명시 보존 — 레코드를 전체 교체하므로
            // 누락 시 수정만으로 우편발송일자·판정이 조용히 사라진다 (SAMPL-1-147)
            mailDate: existing?.mailDate || '',
            testResult: existing?.testResult || '',
            createdAt: existing?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.editingId) {
            this.sampleLogs[editIdx] = data;
            showToast('접수 정보가 수정되었습니다.', 'success');
            this.editingId = null;
        } else {
            this.sampleLogs.push(data);
            showToast('접수가 등록되었습니다.', 'success');
            this.showRegistrationResult(data);
        }

        this.listViewStale = true;
        this.saveLogs();
        this.resetForm();
        this.filterAndRenderLogs();
    }

    // ========================================
    // 오버라이드: 편집 (ID 기반)
    // ========================================
    // Override: 타입 고유 편집 필드 (채취정보/분석항목/목적/수령방법 selected)
    populateTypeSpecificFields(log) {
        document.getElementById('samplingLocation').value = log.samplingLocation || '';
        document.getElementById('cropName').value = log.cropName || '';
        document.getElementById('treeAge').value = log.treeAge || '';
        document.getElementById('samplingDate').value = log.samplingDate || '';
        document.getElementById('sampleCount').value = log.sampleCount || 1;

        // 분석항목 체크
        document.querySelectorAll('input[name="analysisItems"]').forEach(cb => {
            cb.checked = log.analysisItems?.includes(cb.value) || false;
        });
        this.updateSelectedItemsCount();

        // 목적 선택
        document.querySelectorAll('input[name="purpose"]').forEach(radio => {
            radio.checked = radio.value === log.purpose;
        });

        // 수령방법 'selected' 클래스 (Base populateReceptionMethod가 'active'·input 처리)
        document.querySelectorAll('.reception-method-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.method === log.receptionMethod);
        });
    }

    // ========================================
    // 오버라이드: 폼 초기화
    // ========================================
    // Override: 리셋 후 타입 고유 초기화 (채취일/수령방법/법인/분석항목/인증안내)
    // 공통 골격(form.reset/yearSelect/편집해제/navSubmitBtn/날짜/접수번호)은 Base.resetForm
    onAfterFormReset() {
        // 채취일자도 오늘로
        const samplingDateInput = document.getElementById('samplingDate');
        if (samplingDateInput) samplingDateInput.value = new Date().toISOString().split('T')[0];

        // 수령 방법 선택 초기화
        document.querySelectorAll('.reception-method-btn').forEach(btn => btn.classList.remove('active', 'selected'));
        const receptionMethodInput = document.getElementById('receptionMethod');
        if (receptionMethodInput) receptionMethodInput.value = '';

        // 법인여부 초기화
        const applicantTypeSelect = document.getElementById('applicantType');
        const birthDateField = document.getElementById('birthDateField');
        const corpNumberField = document.getElementById('corpNumberField');
        const birthDateInput = document.getElementById('birthDate');
        const corpNumberInput = document.getElementById('corpNumber');
        if (applicantTypeSelect) applicantTypeSelect.value = '개인';
        if (birthDateField) birthDateField.classList.remove('hidden');
        if (corpNumberField) corpNumberField.classList.add('hidden');
        if (birthDateInput) birthDateInput.value = '';
        if (corpNumberInput) corpNumberInput.value = '';

        // 분석항목 초기화
        document.querySelectorAll('input[name="analysisItems"]').forEach(cb => cb.checked = false);
        this.isAllSelected = false;
        const selectAllItemsBtn = document.getElementById('selectAllItemsBtn');
        if (selectAllItemsBtn) selectAllItemsBtn.textContent = '전체 선택';
        this.updateSelectedItemsCount();

        // 인증용 안내 숨기기
        const certificationNotice = document.getElementById('certificationNotice');
        if (certificationNotice) certificationNotice.classList.add('hidden');
    }

    // ========================================
    // 오버라이드: 레코드 수 업데이트
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
    // 오버라이드: 데이터 저장 후 hook
    // ========================================
    onAfterSave() {
        this.listViewStale = true;
        this.autoSaveToFile();
    }

    // ========================================
    // 오버라이드: 연도 변경 hook
    // ========================================
    onYearChange(newYear) {
        this.updateListViewTitle();
        this._cachedHeavyMetalResults = null;
        this.syncHeavyMetalTestResultsFromFirestore();
    }

    // ========================================
    // 오버라이드: 테이블 이벤트 위임 (ID 기반)
    // ========================================
    setupTableEventDelegation() {
        if (!this.tableBody) return;

        this.tableBody.addEventListener('click', (e) => {
            const tr = e.target.closest('tr[data-id]');
            if (!tr) return;
            const id = tr.dataset.id;

            // 완료 토글
            if (e.target.closest('.btn-complete')) {
                this.toggleComplete(id);
                return;
            }

            // 판정 토글
            if (e.target.closest('.btn-result')) {
                this.toggleResult(id);
                return;
            }

            // 수정 버튼
            if (e.target.closest('.btn-edit')) {
                this.editSample(id);
                return;
            }

            // 분석결과 버튼
            if (e.target.closest('.btn-analysis-open')) {
                this.openHeavyMetalAnalysisModal(id);
                return;
            }

            // 삭제 버튼
            if (e.target.closest('.btn-delete')) {
                if (confirm('정말 삭제하시겠습니까?')) {
                    this.deleteSample(String(id));
                }
                return;
            }
        });
    }

    // ========================================
    // 완료 토글
    // ========================================
    toggleComplete(id) {
        const log = this.sampleLogs.find(l => String(l.id) === String(id));
        if (!log) {
            // 배지를 눌렀는데 아무 일도 안 일어나는 조용한 실패 방지 (SAMPL-1-148)
            this.notifyEditTargetMissing('toggleComplete', { requestedId: id });
            return;
        }
        log.isComplete = !log.isComplete;
        log.updatedAt = new Date().toISOString();
        this.listViewStale = true;
        this.saveLogs();
        this.filterAndRenderLogs();
    }

    // ========================================
    // 판정 토글 (미판정 -> 적합 -> 부적합 -> 미판정)
    // ========================================
    toggleResult(id) {
        const log = this.sampleLogs.find(l => String(l.id) === String(id));
        if (!log) {
            this.notifyEditTargetMissing('toggleResult', { requestedId: id });
            return;
        }
        if (!log.testResult || log.testResult === '') {
            log.testResult = 'pass';
        } else if (log.testResult === 'pass') {
            log.testResult = 'fail';
        } else {
            log.testResult = '';
        }
        log.updatedAt = new Date().toISOString();
        this.listViewStale = true;
        this.saveLogs();
        this.filterAndRenderLogs();
    }

    // ========================================
    // 접수번호 생성
    // ========================================
    generateNextReceptionNumber() {
        let maxNumber = 0;
        this.sampleLogs.forEach(log => {
            if (log.receptionNumber) {
                const num = parseInt(log.receptionNumber, 10);
                if (!isNaN(num) && num > maxNumber) {
                    maxNumber = num;
                }
            }
        });
        const nextNumber = maxNumber + 1;
        this.log(`다음 접수번호 생성: ${nextNumber} (기존 최대: ${maxNumber})`);
        return String(nextNumber);
    }

    // ========================================
    // 분석항목 카운트 업데이트
    // ========================================
    updateSelectedItemsCount() {
        const checked = document.querySelectorAll('input[name="analysisItems"]:checked');
        const selectedItemsCount = document.getElementById('selectedItemsCount');
        if (selectedItemsCount) {
            selectedItemsCount.textContent = checked.length;
        }
    }

    // ========================================
    // 목록 타이틀 업데이트
    // ========================================
    updateListViewTitle() {
        const listViewTitle = document.getElementById('listViewTitle');
        if (listViewTitle) {
            listViewTitle.textContent = `${this.selectedYear}년 토양 중금속 접수 목록`;
        }
    }

    // ========================================
    // 자동 저장 수행 (공통 모듈 사용)
    // ========================================
    async autoSaveToFile() {
        return await SampleUtils.performAutoSave({
            FileAPI: this.FileAPI,
            moduleKey: 'heavyMetal',
            data: this.sampleLogs,
            webFileHandle: this.autoSaveFileHandle,
            log: (...args) => this.log(...args)
        });
    }

    // ========================================
    // 등록 결과 모달
    // ========================================
    showRegistrationResult(logData) {
        this.currentRegistrationData = logData;
        const resultTableBody = document.getElementById('resultTableBody');

        const rows = [
            { label: '접수번호', value: logData.receptionNumber },
            { label: '접수일자', value: logData.date },
            { label: '성명', value: logData.name },
            { label: '전화번호', value: logData.phoneNumber },
            { label: '주소', value: [logData.addressRoad || logData.address, logData.addressDetail].filter(Boolean).join(' ') || '-' },
            { label: '채취장소', value: logData.samplingLocation || '-' },
            { label: '재배작물', value: logData.cropName || '-' },
            { label: '수령', value: logData.treeAge ? `${logData.treeAge}년` : '-' },
            { label: '시료채취일', value: logData.samplingDate || '-' },
            { label: '시료수', value: `${logData.sampleCount || 1}점` },
            { label: '분석항목', value: (logData.analysisItems || []).join(', ') || '-' },
            { label: '목적(용도)', value: logData.purpose || '-' },
            { label: '수령방법', value: logData.receptionMethod || '-' },
            { label: '비고', value: logData.note || '-' }
        ];

        BaseSampleManager.buildResultTable(resultTableBody, rows);

        const registrationResultModal = document.getElementById('registrationResultModal');
        if (registrationResultModal) {
            registrationResultModal.classList.remove('hidden');
        }
    }

    closeRegistrationResultModal() {
        const registrationResultModal = document.getElementById('registrationResultModal');
        if (registrationResultModal) {
            registrationResultModal.classList.add('hidden');
        }
        this.currentRegistrationData = null;
    }

    // ========================================
    // 통계
    // ========================================
    updateStatistics() {
        const total = this.sampleLogs.length;
        document.getElementById('statTotalCount').textContent = total;

        const completed = this.sampleLogs.filter(l => l.isComplete).length;
        const pending = total - completed;
        document.getElementById('statCompletedCount').textContent = completed;
        document.getElementById('statPendingCount').textContent = pending;

        const completedRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
        const pendingRate = total > 0 ? ((pending / total) * 100).toFixed(1) : 0;
        const totalBadge = document.getElementById('statTotalBadge');
        const completedRateEl = document.getElementById('statCompletedRate');
        const pendingRateEl = document.getElementById('statPendingRate');
        if (totalBadge) totalBadge.textContent = `${total}건`;
        if (completedRateEl) completedRateEl.textContent = `${completedRate}%`;
        if (pendingRateEl) pendingRateEl.textContent = `${pendingRate}%`;
        const monthRange = document.getElementById('statsMonthRange');
        if (monthRange) monthRange.textContent = `${new Date().getFullYear()}년 1월 ~ 12월`;

        // 분석항목별 통계
        const byAnalysisItem = {};
        this.ANALYSIS_ITEMS.forEach(item => byAnalysisItem[item] = 0);
        this.sampleLogs.forEach(log => {
            (log.analysisItems || []).forEach(item => {
                if (byAnalysisItem[item] !== undefined) byAnalysisItem[item]++;
            });
        });
        this.renderBarChart('statsByAnalysisItem', byAnalysisItem);

        // 목적별 통계 (모든 항목 미리 초기화)
        const byPurpose = {
            '일반재배': 0,
            '무농약': 0,
            '유기농': 0,
            'GAP': 0,
            '저탄소': 0
        };
        this.sampleLogs.forEach(log => {
            const p = log.purpose || '';
            if (p) byPurpose[p] = (byPurpose[p] || 0) + 1;
        });
        this.renderBarChart('statsByPurpose', byPurpose);

        // 월별 집계
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

        this.renderMonthlyChart('statsByMonth', byMonth);
        this.renderQuarterlySummary('statsQuarterly', byQuarter);

        // 수령방법별 통계 (모든 항목 미리 초기화, 순서 고정)
        const methodMapping = {
            '우편': { label: '📮 우편', count: 0 },
            '이메일': { label: '📧 이메일', count: 0 },
            '팩스': { label: '📠 팩스', count: 0 },
            '직접방문': { label: '🚶 직접방문', count: 0 }
        };
        const byMethod = {};
        Object.entries(methodMapping).forEach(([key, val]) => {
            byMethod[key] = { ...val };
        });
        this.sampleLogs.forEach(log => {
            const m = log.receptionMethod || '';
            if (m && byMethod[m]) {
                byMethod[m].count++;
            }
        });
        this.renderMethodCards('statsByReceptionMethod', byMethod);
    }

    renderMonthlyChart(containerId, byMonth) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
        const maxCount = Math.max(...entries.map(([, v]) => v.count), 1);
        const totalCount = entries.reduce((sum, [, v]) => sum + v.count, 0);

        if (totalCount === 0) {
            container.innerHTML = sanitizeHTML('<div class="stats-empty">데이터가 없습니다</div>');
            return;
        }

        container.innerHTML = '';
        const chart = document.createElement('div');
        chart.className = 'monthly-chart';

        const barsWrap = document.createElement('div');
        barsWrap.className = 'monthly-bars';

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
                const valSpan = document.createElement('span');
                valSpan.className = 'monthly-bar-value';
                valSpan.textContent = value.count;
                barContainer.appendChild(valSpan);
            }

            const label = document.createElement('span');
            label.className = 'monthly-bar-label';
            label.textContent = value.label;

            group.appendChild(barContainer);
            group.appendChild(label);
            barsWrap.appendChild(group);
        });

        chart.appendChild(barsWrap);

        const legend = document.createElement('div');
        legend.className = 'monthly-legend';
        legend.innerHTML = sanitizeHTML('<span class="legend-item"><span class="legend-color completed"></span> 완료</span><span class="legend-item"><span class="legend-color pending"></span> 미완료</span>');
        chart.appendChild(legend);

        container.appendChild(chart);
    }

    renderQuarterlySummary(containerId, byQuarter) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = Object.entries(byQuarter).sort((a, b) => a[0].localeCompare(b[0]));
        const totalCount = entries.reduce((sum, [, v]) => sum + v.count, 0);

        if (totalCount === 0) {
            container.innerHTML = sanitizeHTML('<div class="stats-empty">데이터가 없습니다</div>');
            return;
        }

        container.innerHTML = sanitizeHTML(`
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
        `);
    }

    renderBarChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const entries = Object.entries(data);
        const maxVal = Math.max(...entries.map(([, v]) => v), 1);

        const analysisClassMap = {
            '구리': 'analysis-cu', '납': 'analysis-pb',
            '니켈': 'analysis-ni', '비소': 'analysis-as',
            '수은': 'analysis-hg', '아연': 'analysis-zn',
            '카드뮴': 'analysis-cd', '6가크롬': 'analysis-cr'
        };
        const purposeClassMap = {
            '일반재배': 'purpose-general', '무농약': 'purpose-nopesticide',
            '유기농': 'purpose-organic', 'GAP': 'purpose-gap',
            '저탄소': 'purpose-lowcarbon'
        };

        container.innerHTML = '';
        entries.forEach(([label, value]) => {
            const barClass = analysisClassMap[label] || purposeClassMap[label] || '';
            const percent = maxVal > 0 ? (value / maxVal) * 100 : 0;

            const item = document.createElement('div');
            item.className = 'stat-bar-item';

            const labelSpan = document.createElement('span');
            labelSpan.className = 'stat-bar-label';
            labelSpan.textContent = label;

            const wrapper = document.createElement('div');
            wrapper.className = 'stat-bar-wrapper';

            const bar = document.createElement('div');
            bar.className = `stat-bar-fill ${barClass}`.trim();
            bar.style.width = `${percent}%`;
            wrapper.appendChild(bar);

            const val = document.createElement('span');
            val.className = 'stat-bar-value-outside';
            val.textContent = value;

            item.appendChild(labelSpan);
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

    // ========================================
    // 검색/필터
    // ========================================
    // ========================================
    // 우편발송일자 모달
    // ========================================
    openMailDateModal(indices) {
        this.pendingMailDateIndices = indices;
        const today = new Date().toISOString().split('T')[0];
        const mailDateInput = document.getElementById('mailDateInput');
        const mailDateInfo = document.getElementById('mailDateInfo');
        const mailDateModal = document.getElementById('mailDateModal');
        if (mailDateInput) mailDateInput.value = today;
        if (mailDateInfo) mailDateInfo.textContent = `선택한 ${indices.length}건의 우편발송일자를 입력하세요.`;
        if (mailDateModal) mailDateModal.classList.remove('hidden');
    }

    closeMailDateModalFn() {
        const mailDateModal = document.getElementById('mailDateModal');
        if (mailDateModal) mailDateModal.classList.add('hidden');
        this.pendingMailDateIndices = [];
    }

    // ========================================
    // 오버라이드: 수령 방법 버튼 설정
    // ========================================
    setupReceptionMethod() {
        const methodBtns = document.querySelectorAll('.reception-method-btn');
        const methodInput = document.getElementById('receptionMethod');

        methodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                methodBtns.forEach(b => b.classList.remove('active', 'selected'));
                btn.classList.add('active', 'selected');
                if (methodInput) {
                    methodInput.value = btn.dataset.method;
                }
            });
        });
    }

    // ========================================
    // 타입별 이벤트 설정 (모든 중금속 전용 이벤트)
    // ========================================
    setupTypeSpecificEvents() {
        const showToast = window.showToast;

        // 오늘 날짜 설정
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('date');
        const samplingDateInput = document.getElementById('samplingDate');
        if (dateInput && !dateInput.value) dateInput.value = today;
        if (samplingDateInput && !samplingDateInput.value) samplingDateInput.value = today;

        // 기존 데이터 마이그레이션 (연도 없는 데이터 -> 현재 연도로)
        const oldData = localStorage.getItem('heavyMetalSampleLogs');
        if (oldData) {
            const currentYearKey = this.getStorageKey(this.selectedYear);
            if (!localStorage.getItem(currentYearKey)) {
                localStorage.setItem(currentYearKey, oldData);
                this.log('기존 중금속 데이터를 현재 연도로 마이그레이션 완료');
            }
        }

        // 빈 상태에서 폼으로 이동
        const btnGoForm = document.querySelector('.btn-go-form');
        if (btnGoForm) {
            btnGoForm.addEventListener('click', () => this.switchView('form'));
        }

        // 네비게이션 바 제출/취소 버튼
        const navSubmitBtn = document.getElementById('navSubmitBtn');
        const navResetBtn = document.getElementById('navResetBtn');
        if (navSubmitBtn) navSubmitBtn.addEventListener('click', () => this.submitForm());
        if (navResetBtn) navResetBtn.addEventListener('click', () => this.resetForm());

        // ========================================
        // 분석항목 선택 관리
        // ========================================
        const analysisCheckboxes = document.querySelectorAll('input[name="analysisItems"]');
        const selectAllItemsBtn = document.getElementById('selectAllItemsBtn');

        analysisCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => this.updateSelectedItemsCount());
        });

        if (selectAllItemsBtn) {
            selectAllItemsBtn.addEventListener('click', () => {
                this.isAllSelected = !this.isAllSelected;
                analysisCheckboxes.forEach(cb => cb.checked = this.isAllSelected);
                selectAllItemsBtn.textContent = this.isAllSelected ? '전체 해제' : '전체 선택';
                this.updateSelectedItemsCount();
            });
        }

        // ========================================
        // 목적 선택 - 인증용 안내
        // ========================================
        const purposeRadios = document.querySelectorAll('input[name="purpose"]');
        const certificationNotice = document.getElementById('certificationNotice');

        purposeRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const isCertification = ['무농약', '유기농', 'GAP', '저탄소'].includes(radio.value);
                if (certificationNotice) {
                    certificationNotice.classList.toggle('hidden', !isCertification);
                }
                if (isCertification) {
                    analysisCheckboxes.forEach(cb => cb.checked = true);
                    this.isAllSelected = true;
                    if (selectAllItemsBtn) selectAllItemsBtn.textContent = '전체 해제';
                    this.updateSelectedItemsCount();
                }
            });
        });

        // ========================================
        // 법인여부 선택
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
                    if (birthDateField) birthDateField.classList.add('hidden');
                    if (corpNumberField) corpNumberField.classList.remove('hidden');
                    if (birthDateInput) birthDateInput.value = '';
                } else {
                    if (birthDateField) birthDateField.classList.remove('hidden');
                    if (corpNumberField) corpNumberField.classList.add('hidden');
                    if (corpNumberInput) corpNumberInput.value = '';
                }
            });
        }

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

        if (window.AddressManager) {
            new window.AddressManager({
                searchBtn: searchAddressBtn,
                postcodeInput: addressPostcode,
                roadInput: addressRoad,
                detailInput: addressDetail,
                hiddenInput: addressHidden,
                modal: addressModal,
                closeBtn: closeAddressModalBtn,
                container: daumPostcodeContainer
            });
        }

        // ========================================
        // 채취장소 자동완성
        // ========================================
        this.bindLocationAutocomplete();

        // ========================================
        // 작물 검색 모달
        // ========================================
        this.setupCropSearch();

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

        // 성명 클릭 시 같은 이름 일괄 선택
        const tableBody = document.getElementById('tableBody') || document.querySelector('tbody');
        if (tableBody) {
            tableBody.addEventListener('click', (e) => {
                const nameCell = e.target.closest('.col-name');
                if (nameCell && nameCell.dataset.name) {
                    const targetName = nameCell.dataset.name;
                    const rowCheckboxes = tableBody.querySelectorAll('.row-checkbox');
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

                    if (selectAllCheckbox) {
                        const allBoxes = tableBody.querySelectorAll('.row-checkbox');
                        const checkedBoxes = tableBody.querySelectorAll('.row-checkbox:checked');
                        selectAllCheckbox.checked = allBoxes.length > 0 && checkedBoxes.length === allBoxes.length;
                        selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < allBoxes.length;
                    }
                }
            });

            // 개별 체크박스 변경 시 전체 선택 상태 갱신
            tableBody.addEventListener('change', (e) => {
                if (e.target.classList.contains('row-checkbox')) {
                    const allBoxes = tableBody.querySelectorAll('.row-checkbox');
                    const checkedBoxes = tableBody.querySelectorAll('.row-checkbox:checked');
                    if (selectAllCheckbox) {
                        selectAllCheckbox.checked = allBoxes.length > 0 && checkedBoxes.length === allBoxes.length;
                        selectAllCheckbox.indeterminate = checkedBoxes.length > 0 && checkedBoxes.length < allBoxes.length;
                    }
                }
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
                    const selectedIds = Array.from(checked).map(cb => cb.dataset.id).filter(id => id);

                    this.sampleLogs = this.sampleLogs.filter(l => !selectedIds.includes(String(l.id)));
                    this.listViewStale = true;
                    this.saveLogs();
                    this.filterAndRenderLogs();
                    showToast(`${checked.length}건이 삭제되었습니다.`, 'success');

                    // Firebase에서도 삭제
                    if (selectedIds.length > 0 && window.firestoreDb?.isEnabled()) {
                        Promise.all(selectedIds.map(id =>
                            window.firestoreDb.delete('heavyMetal', parseInt(this.selectedYear, 10), id)
                        ))
                            .then(() => this.log('Firebase 일괄 삭제 완료:', selectedIds.length, '건'))
                            .catch(err => (window.logger?.error || console.error)('Firebase 일괄 삭제 실패:', err));
                    }
                }
            });
        }

        // ========================================
        // 우편발송일자 일괄 입력
        // ========================================
        const btnBulkMailDate = document.getElementById('btnBulkMailDate');
        const mailDateModal = document.getElementById('mailDateModal');
        const closeMailDateModal = document.getElementById('closeMailDateModal');
        const cancelMailDateBtn = document.getElementById('cancelMailDateBtn');
        const confirmMailDateBtn = document.getElementById('confirmMailDateBtn');

        if (closeMailDateModal) closeMailDateModal.addEventListener('click', () => this.closeMailDateModalFn());
        if (cancelMailDateBtn) cancelMailDateBtn.addEventListener('click', () => this.closeMailDateModalFn());
        if (mailDateModal) {
            mailDateModal.querySelector('.modal-overlay')?.addEventListener('click', () => this.closeMailDateModalFn());
        }

        if (confirmMailDateBtn) {
            confirmMailDateBtn.addEventListener('click', () => {
                const mailDateInput = document.getElementById('mailDateInput');
                const inputDate = mailDateInput?.value;

                if (!inputDate) {
                    showToast('날짜를 선택해주세요.', 'warning');
                    return;
                }

                this.pendingMailDateIndices.forEach(id => {
                    const log = this.sampleLogs.find(l => String(l.id) === String(id));
                    if (log) {
                        log.mailDate = inputDate;
                        log.updatedAt = new Date().toISOString();
                    }
                });

                this.listViewStale = true;
                this.saveLogs();
                this.filterAndRenderLogs();

                if (selectAllCheckbox) {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = false;
                }

                this.closeMailDateModalFn();
                showToast(`${this.pendingMailDateIndices.length}건의 발송일자가 입력되었습니다.`, 'success');
            });
        }

        if (btnBulkMailDate) {
            btnBulkMailDate.addEventListener('click', () => {
                const checked = document.querySelectorAll('.row-checkbox:checked');
                if (checked.length === 0) {
                    showToast('발송일자를 입력할 항목을 선택해주세요.', 'warning');
                    return;
                }
                const ids = Array.from(checked).map(cb => cb.dataset.id).filter(id => id);
                this.openMailDateModal(ids);
            });
        }

        // ========================================
        // 검색 모달
        // ========================================
        this.setupSearchModal();

        // ========================================
        // 통계 모달
        // ========================================
        const statisticsModal = document.getElementById('statisticsModal');
        const btnStatistics = document.getElementById('btnStatistics');
        const closeStatisticsModal = document.getElementById('closeStatisticsModal');
        const closeStatisticsBtn = document.getElementById('closeStatisticsBtn');

        if (btnStatistics && statisticsModal) {
            btnStatistics.addEventListener('click', () => {
                this.updateStatistics();
                statisticsModal.classList.remove('hidden');
            });
        }

        [closeStatisticsModal, closeStatisticsBtn].forEach(btn => {
            btn?.addEventListener('click', () => statisticsModal.classList.add('hidden'));
        });
        statisticsModal?.querySelector('.modal-overlay')?.addEventListener('click', () => {
            statisticsModal.classList.add('hidden');
        });

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
                    const id = cb.dataset.id;
                    return this.sampleLogs.find(l => String(l.id) === String(id));
                }).filter(Boolean);

                // Base openLabelPrintWithData로 통일 — label-print이 배열만 수용하므로
                // 기존 {type,data} 객체 포맷은 무시되던 버그를 수정 (L1 Phase 3 P3-B)
                this.openLabelPrintWithData(selectedData);
            });
        }

        // ========================================
        // 등록 결과 모달 이벤트
        // ========================================
        const closeRegistrationModal = document.getElementById('closeRegistrationModal');
        const closeResultBtn = document.getElementById('closeResultBtn');
        const editResultBtn = document.getElementById('editResultBtn');
        const exportResultBtn = document.getElementById('exportResultBtn');
        const registrationResultModal = document.getElementById('registrationResultModal');

        if (closeRegistrationModal) {
            closeRegistrationModal.addEventListener('click', () => this.closeRegistrationResultModal());
        }
        if (closeResultBtn) {
            closeResultBtn.addEventListener('click', () => this.closeRegistrationResultModal());
        }

        if (editResultBtn) {
            editResultBtn.addEventListener('click', () => {
                if (this.currentRegistrationData) {
                    const dataToEdit = this.currentRegistrationData;
                    this.closeRegistrationResultModal();
                    this.editSample(dataToEdit.id);
                }
            });
        }

        if (registrationResultModal) {
            const overlay = registrationResultModal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.addEventListener('click', () => this.closeRegistrationResultModal());
            }
        }

        if (exportResultBtn) {
            exportResultBtn.addEventListener('click', () => {
                if (!this.currentRegistrationData) return;

                const d = this.currentRegistrationData;
                const excelData = [{
                    '접수번호': d.receptionNumber,
                    '접수일자': d.date,
                    '성명': d.name,
                    '전화번호': d.phoneNumber,
                    '주소': d.address || '-',
                    '채취장소': d.samplingLocation || '-',
                    '재배작물': d.cropName || '-',
                    '수령': d.treeAge ? `${d.treeAge}년` : '-',
                    '시료채취일': d.samplingDate || '-',
                    '시료수': `${d.sampleCount || 1}점`,
                    '분석항목': (d.analysisItems || []).join(', ') || '-',
                    '목적(용도)': d.purpose || '-',
                    '수령방법': d.receptionMethod || '-',
                    '비고': d.note || '-'
                }];

                const ws = XLSX.utils.json_to_sheet(sanitizeExcelData(excelData));
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, '등록결과');

                const fileName = `중금속_등록결과_${d.receptionNumber}.xlsx`;
                XLSX.writeFile(wb, fileName);
                showToast('엑셀 파일이 다운로드되었습니다.', 'success');
            });
        }

        // ========================================
        // 엑셀 내보내기
        // ========================================
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToExcel());
        }

        // ========================================
        // JSON 저장/불러오기
        // ========================================
        SampleUtils.setupJSONSaveHandler({
            buttonElement: document.getElementById('saveJsonBtn'),
            sampleType: '중금속',
            getData: () => this.sampleLogs,
            FileAPI: this.FileAPI,
            filePrefix: '토양중금속',
            showToast: showToast
        });

        SampleUtils.setupJSONLoadHandler({
            inputElement: document.getElementById('loadJsonInput'),
            getData: () => this.sampleLogs,
            setData: (data) => { this.sampleLogs = data; },
            saveData: () => this.saveLogs(),
            renderData: () => this.filterAndRenderLogs(),
            showToast: showToast
        });

        // ========================================
        // 자동저장 설정
        // ========================================
        SampleUtils.setupAutoSaveFolderButton({
            moduleKey: 'heavyMetal',
            FileAPI: this.FileAPI,
            selectedYear: this.selectedYear,
            getWebFileHandle: () => this.autoSaveFileHandle,
            setWebFileHandle: (handle) => { this.autoSaveFileHandle = handle; },
            autoSaveCallback: () => this.autoSaveToFile(),
            showToast: showToast
        });

        SampleUtils.setupAutoSaveToggle({
            moduleKey: 'heavyMetal',
            FileAPI: this.FileAPI,
            getWebFileHandle: () => this.autoSaveFileHandle,
            setWebFileHandle: (handle) => { this.autoSaveFileHandle = handle; },
            autoSaveCallback: () => this.autoSaveToFile(),
            showToast: showToast,
            log: (...args) => this.log(...args)
        });

        // ========================================
        // 엑셀 가져오기 (ExcelImportManager)
        // ========================================
        this.setupExcelImport();

        // 초기 타이틀 설정
        this.updateListViewTitle();
        this.updateSelectedItemsCount();
    }

    // ========================================
    // 채취장소 자동완성
    // ========================================
    bindLocationAutocomplete() {
        const samplingLocationInput = document.getElementById('samplingLocation');
        const samplingLocationAutocomplete = document.getElementById('samplingLocationAutocomplete');
        window.AddressAutocomplete.bind(samplingLocationInput, samplingLocationAutocomplete, {
            regionKeys: ['bonghwa', 'yeongju', 'uljin'],
            regionNames: this.GYEONGBUK_REGION_NAMES || null,
        });
    }

    // ========================================
    // 작물 검색 모달
    // ========================================
    setupCropSearch() {
        const cropNameInput = document.getElementById('cropName');
        const searchCropBtn = document.getElementById('searchCropBtn');
        const cropModal = document.getElementById('cropModal');

        if (!searchCropBtn || !cropModal) return;

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

            if (cropCategoryFilter && cropCategoryFilter.options.length === 1) {
                Object.keys(CROP_DATA).forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    cropCategoryFilter.appendChild(option);
                });
            }

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

        if (cropSearchInput) cropSearchInput.addEventListener('input', renderCropList);
        if (cropCategoryFilter) cropCategoryFilter.addEventListener('change', renderCropList);

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
    // 검색 모달
    // ========================================
    setupSearchModal() {
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
        const completedFilter = document.getElementById('completedFilter');

        if (completedFilter) {
            completedFilter.addEventListener('change', (e) => {
                this.currentSearchFilter.completed = e.target.value;
                this.filterAndRenderLogs();
            });
        }

        if (openSearchModalBtn && listSearchModal) {
            openSearchModalBtn.addEventListener('click', () => {
                if (searchDateFromInput) searchDateFromInput.value = this.currentSearchFilter.dateFrom;
                if (searchDateToInput) searchDateToInput.value = this.currentSearchFilter.dateTo;
                if (searchNameInput) searchNameInput.value = this.currentSearchFilter.name;
                if (searchReceptionFromInput) searchReceptionFromInput.value = this.currentSearchFilter.receptionFrom;
                if (searchReceptionToInput) searchReceptionToInput.value = this.currentSearchFilter.receptionTo;
                listSearchModal.classList.remove('hidden');
                if (searchNameInput) searchNameInput.focus();
            });
        }

        if (closeSearchModal) {
            closeSearchModal.addEventListener('click', () => listSearchModal.classList.add('hidden'));
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
                this.currentSearchFilter.dateFrom = searchDateFromInput ? searchDateFromInput.value : '';
                this.currentSearchFilter.dateTo = searchDateToInput ? searchDateToInput.value : '';
                this.currentSearchFilter.name = searchNameInput ? searchNameInput.value.toLowerCase() : '';
                this.currentSearchFilter.receptionFrom = searchReceptionFromInput ? searchReceptionFromInput.value : '';
                this.currentSearchFilter.receptionTo = searchReceptionToInput ? searchReceptionToInput.value : '';
                this.filterAndRenderLogs();
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
                if (completedFilter) completedFilter.value = 'incomplete';
                this.currentSearchFilter = { dateFrom: '', dateTo: '', name: '', receptionFrom: '', receptionTo: '', completed: 'incomplete' };
                this.filterAndRenderLogs();
                this.updateSearchButtonState();
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
    }

    // ========================================
    // 엑셀 내보내기
    // ========================================
    exportToExcel() {
        const showToast = window.showToast;

        if (this.sampleLogs.length === 0) {
            showToast('내보낼 데이터가 없습니다.', 'error');
            return;
        }

        const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.dataset.id);
        const logsToExport = selectedIds.length > 0
            ? this.sampleLogs.filter(log => selectedIds.includes(String(log.id)))
            : this.sampleLogs;

        if (selectedIds.length > 0) {
            showToast(`선택한 ${logsToExport.length}건을 내보냅니다.`, 'info');
        }

        const sortedLogs = [...logsToExport].sort((a, b) => {
            const numA = parseInt(String(a.receptionNumber).replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(String(b.receptionNumber).replace(/\D/g, ''), 10) || 0;
            return numA - numB;
        });
        const exportData = sortedLogs.map(log => {
            const isAllItems = log.analysisItems && log.analysisItems.length === this.ANALYSIS_ITEMS.length;
            const analysisDisplay = !log.analysisItems || log.analysisItems.length === 0
                ? '-'
                : isAllItems ? '전체 항목' : log.analysisItems.join(', ');

            const addressParts = parseAddressParts(log.addressRoad || log.address || '');
            const fullAddress = [log.addressRoad, log.addressDetail].filter(Boolean).join(' ') || '-';

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
                '전체주소': fullAddress,
                '시료채취장소': log.samplingLocation || '-',
                '재배작물': log.cropName || '-',
                '과수년생': log.treeAge || '-',
                '채취일': log.samplingDate || '-',
                '시료수': log.sampleCount || '-',
                '분석항목': analysisDisplay,
                '목적': log.purpose || '-',
                '수령방법': log.receptionMethod || '-',
                '비고': log.note || '-',
                '완료여부': log.isComplete ? '완료' : '미완료',
                '등록일시': log.createdAt ? new Date(log.createdAt).toLocaleString('ko-KR') : '-'
            };
        });

        const ws = XLSX.utils.json_to_sheet(sanitizeExcelData(exportData));
        const wb = XLSX.utils.book_new();

        ws['!cols'] = [
            { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 8 }, { wch: 15 },
            { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
            { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
            { wch: 8 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 20 },
            { wch: 8 }, { wch: 20 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, '토양중금속접수');

        const fileName = `토양중금속_접수대장_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showToast('엑셀 파일이 다운로드되었습니다.', 'success');
    }

    // ========================================
    // 엑셀 가져오기 (ExcelImportManager)
    // ========================================
    setupExcelImport() {
        const ANALYSIS_ITEMS = this.ANALYSIS_ITEMS;

        const parseAnalysisItems = (val) => {
            if (!val) return ANALYSIS_ITEMS.slice();
            const str = String(val).trim();
            if (str === '전항목' || str === '전체' || str === 'all') return ANALYSIS_ITEMS.slice();
            return str.split(/[,\s]+/).filter(item => ANALYSIS_ITEMS.includes(item.trim())).map(item => item.trim());
        };

        const excelImporter = new ExcelImportManager({
            appFields: [
                { key: 'receptionNumber', label: '접수번호' },
                { key: 'date', label: '접수일자' },
                { key: 'name', label: '성명' },
                { key: 'phoneNumber', label: '전화번호' },
                { key: 'address', label: '주소' },
                { key: 'samplingLocation', label: '채취지(주소)' },
                { key: 'cropName', label: '작물명' },
                { key: 'samplingDate', label: '채취일' },
                { key: 'analysisItems', label: '분석항목' },
                { key: 'purpose', label: '목적(용도)' },
                { key: 'receptionMethod', label: '수령방법' },
                { key: 'note', label: '비고' }
            ],
            autoMapRules: {
                '접수번호': 'receptionNumber', '번호': 'receptionNumber', 'no': 'receptionNumber',
                '접수일자': 'date', '날짜': 'date', '일자': 'date',
                '성명': 'name', '이름': 'name', '의뢰인': 'name',
                '전화번호': 'phoneNumber', '연락처': 'phoneNumber', '전화': 'phoneNumber',
                '주소': 'address', '의뢰인주소': 'address',
                '채취지': 'samplingLocation', '채취장소': 'samplingLocation', '소재지': 'samplingLocation', '필지': 'samplingLocation',
                '작물': 'cropName', '작물명': 'cropName', '재배작물': 'cropName',
                '채취일': 'samplingDate', '채취일자': 'samplingDate',
                '분석항목': 'analysisItems', '검사항목': 'analysisItems',
                '목적': 'purpose', '용도': 'purpose', '목적(용도)': 'purpose',
                '수령방법': 'receptionMethod', '수령 방법': 'receptionMethod', '통보방법': 'receptionMethod',
                '비고': 'note', '메모': 'note'
            },
            templateConfig: {
                headers: ['접수번호', '채취지(주소)', '작물명', '채취일', '분석항목', '목적(용도)', '비고'],
                sampleRow: ['1', '봉화군 봉화읍 내성리 224', '사과', '2026-03-15', '전항목', '일반재배', ''],
                colWidths: [
                    { wch: 10 }, { wch: 30 }, { wch: 12 }, { wch: 12 },
                    { wch: 12 }, { wch: 12 }, { wch: 20 }
                ],
                sheetName: '중금속시료',
                fileName: '중금속_가져오기_서식'
            },
            previewColumns: [
                { key: 'receptionNumber', label: '접수번호' },
                { key: 'date', label: '접수일자' },
                { key: 'name', label: '성명' },
                { key: 'samplingLocation', label: '채취지' },
                { key: 'cropName', label: '작물명' },
                { key: 'analysisItems', label: '분석항목' },
                { key: 'purpose', label: '목적' },
                { key: 'note', label: '비고' }
            ],
            renderPreviewCell: (record, key) => {
                if (key === 'analysisItems') {
                    const items = record.analysisItems;
                    return items.length === ANALYSIS_ITEMS.length ? '전항목' : items.join(', ');
                }
                return undefined;
            },
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
                const name = getVal('name') || common.name;
                const phoneNumber = getVal('phoneNumber') || common.phone;
                const address = getVal('address') || common.address;
                const samplingLocation = getVal('samplingLocation') || '';
                const cropName = getVal('cropName') || '';
                const samplingDateVal = getVal('samplingDate');
                const samplingDate = parseExcelDate(samplingDateVal) || common.date;
                const analysisItemsStr = getVal('analysisItems');
                const analysisItems = parseAnalysisItems(analysisItemsStr);
                const purpose = getVal('purpose') || common.purpose;
                const receptionMethod = getVal('receptionMethod') || common.method;
                const note = getVal('note') || '';

                return {
                    receptionNumber, date, name, phoneNumber,
                    applicantType: '개인', birthDate: '', corpNumber: '',
                    addressPostcode: '', addressRoad: address, addressDetail: '', address,
                    samplingLocation, cropName, treeAge: 0, samplingDate,
                    sampleCount: 1, analysisItems, purpose, receptionMethod, note,
                    isComplete: false, createdAt: common.now
                };
            },
            skipRowCheck: (record, rowIdx) => {
                if (!record.samplingLocation && !record.cropName && !record.name) {
                    return `행 ${rowIdx + 2}: 채취지, 작물명, 성명이 모두 비어 있어 건너뜁니다.`;
                }
                return null;
            },
            getExistingLogs: () => this.sampleLogs,
            onImportComplete: (records) => {
                records.forEach(logEntry => {
                    logEntry.id = this.generateId();
                    this.sampleLogs.push(logEntry);
                });
                this.sampleLogs.sort((a, b) => {
                    const numA = parseInt(a.receptionNumber, 10) || 0;
                    const numB = parseInt(b.receptionNumber, 10) || 0;
                    if (numA !== numB) return numA - numB;
                    return (a.receptionNumber || '').localeCompare(b.receptionNumber || '');
                });
                this.listViewStale = true;
                this.saveLogs();
                this.filterAndRenderLogs();
            }
        });
        excelImporter.init();

        // 분석결과 모달 초기화
        this.initHeavyMetalAnalysisModal();
        // Firestore 동기화
        this.syncHeavyMetalTestResultsFromFirestore();

        // 분석결과 조회 버튼
        const heavyMetalAnalysisViewBtn = document.getElementById('heavyMetalAnalysisViewBtn');
        if (heavyMetalAnalysisViewBtn) heavyMetalAnalysisViewBtn.addEventListener('click', () => {
            localStorage.setItem('heavyMetalAnalysis_year', this.selectedYear);
            const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.dataset.id).filter(Boolean);
            localStorage.setItem('heavyMetalAnalysis_selected_ids', JSON.stringify(selectedIds));

            const isElectron = window.electronAPI?.isElectron === true;
            if (isElectron) {
                window.electronAPI.openHeavyMetalAnalysis();
            } else {
                const popup = window.open('../heavy-metal-analysis/index.html', '_blank');
                if (!popup) window.location.href = '../heavy-metal-analysis/index.html';
            }
        });
    }

    // ========================================
    // 토양 중금속 분석결과 모달
    // ========================================

    /**
     * 분석 항목 정의 (토양오염우려기준, mg/kg)
     * 1지역: 전/답/과수원
     * 2지역: 임야/학교/공원/주거
     * 3지역: 공장/도로 등
     */
    static HEAVY_METAL_FIELDS = [
        { key: 'cadmium', label: '카드뮴(Cd)', unit: 'mg/kg', standard1: 4, standard2: 10, standard3: 60 },
        { key: 'copper', label: '구리(Cu)', unit: 'mg/kg', standard1: 150, standard2: 500, standard3: 2000 },
        { key: 'arsenic', label: '비소(As)', unit: 'mg/kg', standard1: 25, standard2: 50, standard3: 200 },
        { key: 'mercury', label: '수은(Hg)', unit: 'mg/kg', standard1: 4, standard2: 10, standard3: 20 },
        { key: 'lead', label: '납(Pb)', unit: 'mg/kg', standard1: 200, standard2: 400, standard3: 700 },
        { key: 'chromium6', label: '6가크롬(Cr6+)', unit: 'mg/kg', standard1: 5, standard2: 15, standard3: 40 },
        { key: 'zinc', label: '아연(Zn)', unit: 'mg/kg', standard1: 300, standard2: 600, standard3: 2000 },
        { key: 'nickel', label: '니켈(Ni)', unit: 'mg/kg', standard1: 100, standard2: 200, standard3: 500 },
    ];

    /**
     * 용도(목적)에 따라 적용할 기준 지역 결정
     * 1지역: 전, 답, 과수원, 일반재배, 무농약, 유기농, GAP, 저탄소
     * 기본값: 1지역
     */
    getStandardRegion(purpose) {
        // 기본적으로 1지역 적용 (전/답/과수원 등 농업 용도)
        return 1;
    }

    getStandardValue(field, region) {
        if (region === 3) return field.standard3;
        if (region === 2) return field.standard2;
        return field.standard1;
    }

    getStandardLabel(field, region) {
        const val = this.getStandardValue(field, region);
        return `${val.toLocaleString()} 이하`;
    }

    initHeavyMetalAnalysisModal() {
        const modal = document.getElementById('heavyMetalAnalysisModal');
        if (!modal) return;

        const closeModal = () => { modal.classList.add('hidden'); this._hmLogId = null; };
        document.getElementById('closeHeavyMetalAnalysisModal')?.addEventListener('click', closeModal);
        document.getElementById('cancelHeavyMetalAnalysisBtn')?.addEventListener('click', closeModal);
        modal.querySelector('.modal-overlay')?.addEventListener('click', closeModal);
        modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        document.getElementById('saveHeavyMetalAnalysisBtn')?.addEventListener('click', () => this.saveHeavyMetalAnalysis());
    }

    openHeavyMetalAnalysisModal(logId) {
        const log = this.sampleLogs.find(l => String(l.id) === String(logId));
        if (!log) {
            this.notifyEditTargetMissing('openHeavyMetalAnalysisModal', { requestedId: logId },
                window.BaseSampleManager.ANALYSIS_TARGET_MISSING_MESSAGE);
            return;
        }

        const modal = document.getElementById('heavyMetalAnalysisModal');
        if (!modal) return;

        this._hmLogId = logId;

        // 시료 정보
        document.getElementById('hmReceptionNumber').textContent = log.receptionNumber || '-';
        document.getElementById('hmDate').textContent = log.date || '-';
        document.getElementById('hmName').textContent = log.name || '-';
        document.getElementById('hmLocation').textContent = log.samplingLocation || '-';
        document.getElementById('hmPurpose').textContent = log.purpose || '-';

        // 용도 기반 기준지역 결정
        const region = this.getStandardRegion(log.purpose);
        this._hmRegion = region;

        const fields = HeavyMetalSampleManager.HEAVY_METAL_FIELDS;
        this.renderHeavyMetalFields(fields, region);

        // 기존 결과 로드
        const existing = this.loadHeavyMetalTestResult(logId);
        if (existing) {
            document.getElementById('hmTestDate').value = existing.testDate || '';
            for (const field of fields) {
                const input = document.getElementById(`hm_${field.key}`);
                if (input) input.value = existing[field.key] || '';
                // 상태 업데이트
                const statusEl = document.getElementById(`hm_status_${field.key}`);
                if (input && statusEl) this.checkHeavyMetalFieldStatus(field, input.value, statusEl, region);
            }
            const judgment = existing.judgment || '';
            if (['', 'pass', 'fail'].includes(judgment)) {
                const radio = document.querySelector(`input[name="hmJudgment"][value="${judgment}"]`);
                if (radio) radio.checked = true;
            }
        } else {
            document.getElementById('hmTestDate').value = '';
            for (const field of fields) {
                const input = document.getElementById(`hm_${field.key}`);
                if (input) input.value = '';
            }
            const defaultRadio = document.querySelector('input[name="hmJudgment"][value=""]');
            if (defaultRadio) defaultRadio.checked = true;
        }

        modal.classList.remove('hidden');
        setTimeout(() => {
            const firstInput = modal.querySelector('.hm-result-input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    renderHeavyMetalFields(fields, region) {
        const tbody = document.getElementById('hmFieldsBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        fields.forEach(field => {
            const tr = document.createElement('tr');

            const tdName = document.createElement('td');
            tdName.className = 'hm-col-name';
            tdName.textContent = field.label;
            tr.appendChild(tdName);

            const tdUnit = document.createElement('td');
            tdUnit.className = 'hm-col-unit';
            tdUnit.textContent = field.unit || '-';
            tr.appendChild(tdUnit);

            // 기준값 (지역별)
            const tdStandard = document.createElement('td');
            tdStandard.className = 'hm-col-standard';
            tdStandard.textContent = this.getStandardLabel(field, region);
            tr.appendChild(tdStandard);

            const tdValue = document.createElement('td');
            tdValue.className = 'hm-col-value';

            const tdStatus = document.createElement('td');
            tdStatus.className = 'hm-col-status';
            tdStatus.id = `hm_status_${field.key}`;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'hm-result-input';
            input.id = `hm_${field.key}`;
            input.placeholder = field.unit || '-';
            input.autocomplete = 'off';
            input.addEventListener('input', () => {
                this.checkHeavyMetalFieldStatus(field, input.value, tdStatus, region);
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const nextRow = tr.nextElementSibling;
                    if (nextRow) {
                        const nextInput = nextRow.querySelector('.hm-result-input');
                        if (nextInput) nextInput.focus();
                    }
                }
            });
            tdValue.appendChild(input);

            tr.appendChild(tdValue);
            tr.appendChild(tdStatus);

            tbody.appendChild(tr);
        });
    }

    checkHeavyMetalFieldStatus(field, value, statusEl, region) {
        if (!value || !statusEl) {
            if (statusEl) statusEl.textContent = '';
            return;
        }

        const num = parseFloat(value.replace(/,/g, ''));
        if (isNaN(num)) { statusEl.textContent = ''; return; }

        const standardVal = this.getStandardValue(field, region);
        const isOk = num <= standardVal;

        // Use DOM API, not innerHTML
        statusEl.textContent = '';
        const span = document.createElement('span');
        span.style.color = isOk ? '#16a34a' : '#dc2626';
        span.textContent = isOk ? '\u2713' : '\u2715';
        statusEl.appendChild(span);
    }

    autoJudgeHeavyMetal(result, region) {
        const fields = HeavyMetalSampleManager.HEAVY_METAL_FIELDS;
        const hasData = fields.some(f => result[f.key]);
        if (!hasData) return '';

        for (const field of fields) {
            const val = result[field.key];
            if (val) {
                const num = parseFloat(String(val).replace(/,/g, ''));
                if (!isNaN(num) && num > this.getStandardValue(field, region)) {
                    return 'fail';
                }
            }
        }
        return 'pass';
    }

    saveHeavyMetalAnalysis() {
        const logId = this._hmLogId;
        if (!logId) return;

        const log = this.sampleLogs.find(l => String(l.id) === String(logId));
        if (!log) {
            this.notifyEditTargetMissing('saveHeavyMetalAnalysis', { requestedId: logId },
                window.BaseSampleManager.ANALYSIS_TARGET_MISSING_MESSAGE);
            return;
        }

        const fields = HeavyMetalSampleManager.HEAVY_METAL_FIELDS;
        const allResults = this.loadAllHeavyMetalTestResults();
        const region = this._hmRegion || 1;

        const result = {
            id: logId,
            testDate: document.getElementById('hmTestDate')?.value || '',
            judgment: document.querySelector('input[name="hmJudgment"]:checked')?.value || '',
            updatedAt: new Date().toISOString()
        };

        for (const field of fields) {
            const input = document.getElementById(`hm_${field.key}`);
            if (input) result[field.key] = input.value.trim();
        }

        // 자동 판정: 모든 항목이 기준 이내이면 적합, 하나라도 초과면 부적합
        const autoJudgment = this.autoJudgeHeavyMetal(result, region);
        if (!result.judgment) result.judgment = autoJudgment;

        allResults[logId] = result;
        this.saveAllHeavyMetalTestResults(allResults);

        // 접수 데이터에 판정 동기화
        log.testResult = result.judgment || '';
        this.saveLogs();

        document.getElementById('heavyMetalAnalysisModal')?.classList.add('hidden');
        this._hmLogId = null;
        this.filterAndRenderLogs();
        this.showToast('분석결과가 저장되었습니다.', 'success');
    }

    // === 데이터 저장/로드 ===

    loadHeavyMetalTestResult(logId) {
        if (!this._cachedHeavyMetalResults) {
            this._cachedHeavyMetalResults = this.loadAllHeavyMetalTestResults();
        }
        return this._cachedHeavyMetalResults[logId] || null;
    }

    loadAllHeavyMetalTestResults() {
        const key = `heavyMetalTestResults_${this.selectedYear}`;
        try {
            const data = localStorage.getItem(key);
            if (!data) return {};
            return JSON.parse(data) || {};
        } catch (e) {
            (window.logger?.error || console.error)('중금속 검사 결과 로드 실패:', e);
            return {};
        }
    }

    saveAllHeavyMetalTestResults(results) {
        const key = `heavyMetalTestResults_${this.selectedYear}`;
        try {
            localStorage.setItem(key, JSON.stringify(results));
            this._cachedHeavyMetalResults = results;
            this.syncHeavyMetalTestResultsToFirestore(results);
        } catch (e) {
            (window.logger?.error || console.error)('중금속 검사 결과 저장 실패:', e);
        }
    }

    async syncHeavyMetalTestResultsToFirestore(results) {
        if (!window.firestoreDb?.isEnabled()) return;
        try {
            const year = parseInt(this.selectedYear, 10);
            const entries = Object.entries(results);
            if (entries.length === 0) return;
            const documents = entries.map(([docKey, data]) => ({ ...data, id: docKey, _resultKey: docKey }));
            await window.firestoreDb.batchSave('heavyMetalTestResults', year, documents);
        } catch (e) {
            (window.logger?.error || console.error)('중금속 Firestore 동기화 실패:', e);
        }
    }

    async syncHeavyMetalTestResultsFromFirestore() {
        if (!window.firestoreDb?.isEnabled()) return;
        try {
            const year = parseInt(this.selectedYear, 10);
            const cloudData = await window.firestoreDb.getAll('heavyMetalTestResults', year);
            if (!cloudData || cloudData.length === 0) return;

            const cloudMap = {};
            for (const doc of cloudData) {
                const key = doc._resultKey || doc.id;
                if (key) {
                    const { _resultKey, syncedAt, ...rest } = doc;
                    cloudMap[key] = rest;
                }
            }

            const localResults = this.loadAllHeavyMetalTestResults();
            const merged = { ...localResults };
            for (const [key, cloudVal] of Object.entries(cloudMap)) {
                const localVal = merged[key];
                if (!localVal || !localVal.updatedAt || new Date(cloudVal.updatedAt) >= new Date(localVal.updatedAt)) {
                    merged[key] = cloudVal;
                }
            }

            const lsKey = `heavyMetalTestResults_${this.selectedYear}`;
            localStorage.setItem(lsKey, JSON.stringify(merged));
            this._cachedHeavyMetalResults = merged;

            // 접수 데이터 판정 동기화
            let syncCount = 0;
            for (const [resultId, resultData] of Object.entries(merged)) {
                const log = this.sampleLogs.find(l => String(l.id) === String(resultId));
                if (log) {
                    if (resultData.judgment) log.testResult = resultData.judgment;
                    syncCount++;
                }
            }
            if (syncCount > 0) this.saveLogs();
            this.filterAndRenderLogs();
        } catch (e) {
            (window.logger?.error || console.error)('중금속 Firestore 로드 실패:', e);
        }
    }
}

// ========================================
// 인스턴스 생성 및 초기화
// ========================================
const heavyMetalManager = new HeavyMetalSampleManager();
window.heavyMetalManager = heavyMetalManager;

document.addEventListener('DOMContentLoaded', () => {
    heavyMetalManager.init();
});
