/**
 * @fileoverview 수질분석 결과 입력
 * 수질 접수 데이터(waterSampleLogs)를 읽어와 분석 결과를 입력하고
 * 엑셀(.xlsx)로 내보내는 페이지 스크립트
 *
 * 지하수법 시행규칙 [별표 9] 기준:
 * - 일반오염물질 5개 + 특정유해물질 14개 = 총 19개
 * - 생활용수 19항목 / 농업용수 15항목 (공통 15 + 생활용수 전용 4)
 */

// ========================================
// 상수 정의 — 지하수법 시행규칙 [별표 9]
// ========================================

const WATER_QUALITY_FIELDS = [
    // === 일반오염물질 (5개) ===
    { key: 'pH',            label: 'pH',                    unit: '',           group: '일반', living: '5.8~8.5',    agri: '6.0~8.5',    industry: '5.0~9.0' },
    { key: 'ec',            label: 'EC',                    unit: 'µS/cm',      group: '일반', living: '-',           agri: '-',           industry: '-' },
    { key: 'totalColiform', label: '총대장균군',             unit: '군수/100mL', group: '일반', living: '5,000 이하',  agri: '-',           industry: '-' },
    { key: 'nitrate',       label: '질산성질소',             unit: 'mg/L',       group: '일반', living: '20 이하',     agri: '20 이하',     industry: '40 이하' },
    { key: 'chloride',      label: '염소이온',               unit: 'mg/L',       group: '일반', living: '250 이하',    agri: '250 이하',    industry: '500 이하' },
    { key: 'cadmium',       label: '카드뮴',                 unit: 'mg/L',       group: '일반', living: '0.01 이하',   agri: '0.01 이하',   industry: '0.02 이하' },
    // === 특정유해물질 (14개) ===
    { key: 'arsenic',       label: '비소',                   unit: 'mg/L',       group: '유해', living: '0.05 이하',   agri: '0.05 이하',   industry: '0.1 이하' },
    { key: 'cyanide',       label: '시안',                   unit: 'mg/L',       group: '유해', living: '0.01 이하',   agri: '0.01 이하',   industry: '0.2 이하' },
    { key: 'mercury',       label: '수은',                   unit: 'mg/L',       group: '유해', living: '0.001 이하',  agri: '0.001 이하',  industry: '0.001 이하' },
    { key: 'organophos',    label: '유기인',                 unit: 'mg/L',       group: '유해', living: '0.0005 이하', agri: '0.0005 이하', industry: '0.0005 이하' },
    { key: 'phenol',        label: '페놀',                   unit: 'mg/L',       group: '유해', living: '0.005 이하',  agri: '0.005 이하',  industry: '0.01 이하' },
    { key: 'lead',          label: '납',                     unit: 'mg/L',       group: '유해', living: '0.1 이하',    agri: '0.1 이하',    industry: '0.2 이하' },
    { key: 'chromium6',     label: '6가크롬',                unit: 'mg/L',       group: '유해', living: '0.05 이하',   agri: '0.05 이하',   industry: '0.1 이하' },
    { key: 'tce',           label: '트리클로로에틸렌',        unit: 'mg/L',       group: '유해', living: '0.03 이하',   agri: '0.03 이하',   industry: '0.06 이하' },
    { key: 'pce',           label: '테트라클로로에틸렌',      unit: 'mg/L',       group: '유해', living: '0.01 이하',   agri: '0.01 이하',   industry: '0.02 이하' },
    { key: 'tca',           label: '1,1,1-트리클로로에탄',    unit: 'mg/L',       group: '유해', living: '0.15 이하',  agri: '0.3 이하',    industry: '0.5 이하' },
    // === 생활용수 전용 (4개) ===
    { key: 'benzene',       label: '벤젠',                   unit: 'mg/L',       group: '유해', living: '0.015 이하',  agri: '-', industry: '-', livingOnly: true },
    { key: 'toluene',       label: '톨루엔',                 unit: 'mg/L',       group: '유해', living: '1 이하',      agri: '-', industry: '-', livingOnly: true },
    { key: 'ethylbenzene',  label: '에틸벤젠',               unit: 'mg/L',       group: '유해', living: '0.45 이하',   agri: '-', industry: '-', livingOnly: true },
    { key: 'xylene',        label: '크실렌',                 unit: 'mg/L',       group: '유해', living: '0.75 이하',   agri: '-', industry: '-', livingOnly: true },
];

// ========================================
// WaterAnalysisManager 클래스
// ========================================

class WaterAnalysisManager {
    constructor() {
        this.selectedYear = new Date().getFullYear().toString();
        this.sampleLogs = [];
        this.testResults = {};
        this.flatRows = [];
        this.selectedKeys = new Set();
        this.focusedCell = null;
        this.testItemFilter = 'all';

        // 모든 결과 필드 (순서 중요: testDate + 19항목 + judgment)
        this.resultFields = [
            'testDate',
            ...WATER_QUALITY_FIELDS.map(f => f.key),
            'judgment'
        ];

        // 필드 정보 맵
        this.fieldInfoMap = {};
        for (const f of WATER_QUALITY_FIELDS) {
            this.fieldInfoMap[f.key] = { ...f };
        }

        // 생활용수 전용 필드는 기본 숨김 (농업용수 행에서)
        this.hiddenFields = new Set();
        this.showAllColumns = false;

        this.init();
    }

    // ========================================
    // 초기화
    // ========================================

    init() {
        this.cacheElements();
        this.setDefaultYear();
        this.restoreFromWaterPage();
        this.bindEvents();
        this.loadData();
        this.render();

        // Firestore에서 분석 결과 동기화 (비동기)
        this.syncTestResultsFromFirestore();

        if (typeof ThemeManager !== 'undefined') {
            ThemeManager.init();
            this.setupThemeToggle();
        }
    }

    cacheElements() {
        this.yearSelect = document.getElementById('yearSelect');
        this.bulkTestDateInput = document.getElementById('bulkTestDate');
        this.testItemFilterSelect = document.getElementById('testItemFilter');
        this.bulkResultSelect = document.getElementById('bulkResult');
        this.selectAllCheckbox = document.getElementById('selectAll');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.applyBulkBtn = document.getElementById('applyBulkBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.toggleColumnsBtn = document.getElementById('toggleColumnsBtn');
        this.tableBody = document.getElementById('tableBody');
        this.emptyState = document.getElementById('emptyState');
        this.recordCount = document.getElementById('recordCount');
    }

    restoreFromWaterPage() {
        const year = localStorage.getItem('waterAnalysis_year');
        const selectedIdsJson = localStorage.getItem('waterAnalysis_selected_ids');

        if (year) {
            this.selectedYear = year;
            if (this.yearSelect) this.yearSelect.value = year;
            localStorage.removeItem('waterAnalysis_year');
        }

        if (selectedIdsJson) {
            try {
                const ids = JSON.parse(selectedIdsJson);
                this.preSelectedLogIds = Array.isArray(ids) && ids.length > 0 ? new Set(ids) : null;
            } catch (e) {
                this.preSelectedLogIds = null;
            }
            localStorage.removeItem('waterAnalysis_selected_ids');
        }

        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.close();
            });
        }
    }

    setDefaultYear() {
        const year = new Date().getFullYear().toString();
        this.selectedYear = year;
        if (this.yearSelect) this.yearSelect.value = year;
    }

    setupThemeToggle() {
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;
        const current = document.documentElement.getAttribute('data-theme');
        if (current === 'dark') btn.classList.add('dark');

        btn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            ThemeManager.setTheme(isDark ? 'light' : 'dark');
            btn.classList.toggle('dark', !isDark);
        });
    }

    bindEvents() {
        this.yearSelect?.addEventListener('change', () => {
            this.selectedYear = this.yearSelect.value;
            this.preSelectedLogIds = null;
            this.loadData();
            this.render();
        });

        this.selectAllCheckbox?.addEventListener('change', () => {
            this.toggleSelectAll(this.selectAllCheckbox.checked);
        });

        this.selectAllBtn?.addEventListener('click', () => {
            const allSelected = this.selectedKeys.size === this.flatRows.length;
            this.toggleSelectAll(!allSelected);
            if (this.selectAllCheckbox) this.selectAllCheckbox.checked = !allSelected;
        });

        // 검사일자 선택 시 전체 적용
        this.bulkTestDateInput?.addEventListener('change', () => {
            const testDate = this.bulkTestDateInput.value;
            if (!testDate) return;
            for (const row of this.flatRows) {
                if (!this.testResults[row.key]) this.testResults[row.key] = {};
                this.testResults[row.key].testDate = testDate;
            }
            this.saveTestResults();
            this.render();
            if (window.showToast) window.showToast(`검사일자가 전체 ${this.flatRows.length}건에 적용되었습니다.`, 'info');
        });

        document.getElementById('clearTestDateBtn')?.addEventListener('click', () => {
            if (!confirm('모든 행의 검사일자를 삭제하시겠습니까?')) return;
            for (const row of this.flatRows) {
                if (this.testResults[row.key]) this.testResults[row.key].testDate = '';
            }
            if (this.bulkTestDateInput) this.bulkTestDateInput.value = '';
            this.saveTestResults();
            this.render();
            if (window.showToast) window.showToast('검사일자가 삭제되었습니다.', 'info');
        });

        // 검사항목 필터
        this.testItemFilterSelect?.addEventListener('change', () => {
            this.testItemFilter = this.testItemFilterSelect.value;
            this.applyColumnVisibility();
        });

        this.applyBulkBtn?.addEventListener('click', () => this.applyBulkValues());
        this.exportBtn?.addEventListener('click', () => this.exportToExcel());
        this.toggleColumnsBtn?.addEventListener('click', () => this.toggleHiddenColumns());
        this.applyColumnVisibility();

        document.addEventListener('paste', (e) => this.handlePaste(e));
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    // ========================================
    // 데이터 로드/저장
    // ========================================

    loadData() {
        this.sampleLogs = this.loadSampleLogs();
        this.testResults = this.loadTestResults();
        this.buildFlatRows();
    }

    loadSampleLogs() {
        const key = `waterSampleLogs_${this.selectedYear}`;
        try {
            const data = localStorage.getItem(key);
            if (!data) return [];
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) return [];
            return parsed.sort((a, b) => {
                const toNum = s => {
                    if (!s) return Infinity;
                    const n = parseFloat(String(s));
                    return isNaN(n) ? Infinity : n;
                };
                return toNum(a.receptionNumber) - toNum(b.receptionNumber);
            });
        } catch (e) {
            (window.logger?.error || console.error)('수질 접수 데이터 로드 실패:', e);
            return [];
        }
    }

    loadTestResults() {
        const key = `waterTestResults_${this.selectedYear}`;
        try {
            const data = localStorage.getItem(key);
            if (!data) return {};
            return JSON.parse(data) || {};
        } catch (e) {
            (window.logger?.error || console.error)('수질 검사 결과 로드 실패:', e);
            return {};
        }
    }

    saveTestResults() {
        const key = `waterTestResults_${this.selectedYear}`;
        try {
            localStorage.setItem(key, JSON.stringify(this.testResults));

            // Firestore 동기화
            this.syncTestResultsToFirestore();
        } catch (e) {
            (window.logger?.error || console.error)('수질 검사 결과 저장 실패:', e);
        }
    }

    async syncTestResultsToFirestore() {
        if (!window.firestoreDb?.isEnabled()) return;
        try {
            const year = parseInt(this.selectedYear);
            const entries = Object.entries(this.testResults);
            if (entries.length === 0) return;

            const documents = entries.map(([docKey, data]) => ({
                ...data,
                id: docKey,
                _resultKey: docKey,
            }));

            await window.firestoreDb.batchSave('waterTestResults', year, documents);
            (window.logger?.info || console.log)(`[수질분석] Firestore 동기화 완료: ${documents.length}건`);
        } catch (e) {
            (window.logger?.error || console.error)('[수질분석] Firestore 동기화 실패:', e);
        }
    }

    async syncTestResultsFromFirestore() {
        if (!window.firestoreDb?.isEnabled()) return;
        try {
            const year = parseInt(this.selectedYear);
            const cloudData = await window.firestoreDb.getAll('waterTestResults', year);
            if (!cloudData || cloudData.length === 0) return;

            const cloudMap = {};
            for (const doc of cloudData) {
                const key = doc._resultKey || doc.id;
                if (key) {
                    const { _resultKey, syncedAt, updatedAt, ...rest } = doc;
                    cloudMap[key] = rest;
                }
            }

            // 로컬과 병합 (클라우드 우선)
            this.testResults = { ...this.testResults, ...cloudMap };
            const lsKey = `waterTestResults_${this.selectedYear}`;
            localStorage.setItem(lsKey, JSON.stringify(this.testResults));
            this.render();
            (window.logger?.info || console.log)('[수질분석] Firestore → localStorage 동기화 완료');
        } catch (e) {
            (window.logger?.error || console.error)('[수질분석] Firestore 로드 실패:', e);
        }
    }

    /**
     * 접수 데이터를 채취장소별 flat 행으로 변환
     * 수질은 채취장소 배열이 있으면 장소별 1행, 없으면 접수당 1행
     */
    buildFlatRows() {
        this.flatRows = [];

        const logsToProcess = (this.preSelectedLogIds && this.preSelectedLogIds.size > 0)
            ? this.sampleLogs.filter(log => this.preSelectedLogIds.has(log.id))
            : this.sampleLogs;

        for (const log of logsToProcess) {
            const locations = log.samplingLocations || [];
            if (locations.length <= 1) {
                // 채취장소 0~1개: 1행
                this.flatRows.push({
                    key: `${log.id}_0`,
                    log: log,
                    locationIdx: 0,
                    location: locations[0] || log.samplingLocation || '',
                    sampleName: (log.sampleNamesPerRow && log.sampleNamesPerRow[0]) || log.sampleName || '',
                });
            } else {
                // 채취장소 여러 개: 장소별 행
                for (let i = 0; i < locations.length; i++) {
                    this.flatRows.push({
                        key: `${log.id}_${i}`,
                        log: log,
                        locationIdx: i,
                        location: locations[i] || '',
                        sampleName: (log.sampleNamesPerRow && log.sampleNamesPerRow[i]) || log.sampleName || '',
                        isSubRow: i > 0,
                    });
                }
            }
        }

        this.preSelectedLogIds = null;
    }

    // ========================================
    // 렌더링
    // ========================================

    render() {
        if (!this.tableBody) return;

        if (this.flatRows.length === 0) {
            this.tableBody.innerHTML = '';
            if (this.emptyState) this.emptyState.style.display = 'flex';
            if (this.recordCount) this.recordCount.textContent = '0건';
            return;
        }

        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.recordCount) this.recordCount.textContent = `${this.flatRows.length}건`;

        const fragment = document.createDocumentFragment();
        for (let ri = 0; ri < this.flatRows.length; ri++) {
            fragment.appendChild(this.createTableRow(this.flatRows[ri], ri));
        }

        this.tableBody.innerHTML = '';
        this.tableBody.appendChild(fragment);
        this.validateAllRanges();
    }

    createTableRow(row, rowIdx) {
        const tr = document.createElement('tr');
        const result = this.testResults[row.key] || {};

        tr.setAttribute('data-log-id', row.log.id);
        if (row.isSubRow) tr.classList.add('sublot-row');
        if (row.log.isComplete) tr.classList.add('row-completed');

        const isChecked = this.selectedKeys.has(row.key);
        const testItems = row.log.testItems || '';

        // 체크박스
        const tdCheck = document.createElement('td');
        tdCheck.className = 'col-checkbox sticky-col';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = isChecked;
        cb.addEventListener('change', () => {
            if (cb.checked) this.selectedKeys.add(row.key);
            else this.selectedKeys.delete(row.key);
            this.updateSelectAllState();
        });
        tdCheck.appendChild(cb);
        tr.appendChild(tdCheck);

        // 접수번호
        this.addStaticCell(tr, 'col-num sticky-col', row.log.receptionNumber || '');

        // 성명
        this.addStaticCell(tr, 'col-name sticky-col', row.log.name || '');

        // 채취장소
        const tdLoc = document.createElement('td');
        tdLoc.className = 'col-location sticky-col';
        tdLoc.textContent = row.location || '';
        if (row.isSubRow) tdLoc.classList.add('sublot-indent');
        tr.appendChild(tdLoc);

        // 시료명
        this.addStaticCell(tr, 'col-sample-name sticky-col', row.sampleName || '');

        // 검사항목
        this.addStaticCell(tr, 'col-test-items sticky-col', testItems);

        // 목적
        this.addStaticCell(tr, 'col-purpose sticky-col', row.log.purpose || '');

        // 접수일자
        this.addStaticCell(tr, 'col-date sticky-col', row.log.date || '');

        // 편집 가능한 결과 필드들
        for (let ci = 0; ci < this.resultFields.length; ci++) {
            const field = this.resultFields[ci];
            const td = document.createElement('td');

            const fieldInfo = this.fieldInfoMap[field];
            const isHidden = this.hiddenFields.has(field) && !this.showAllColumns;
            const isLivingOnly = fieldInfo?.livingOnly;

            let cssClass = 'col-result editable-cell';
            if (field === 'testDate') cssClass += ' col-testdate';
            else if (field === 'judgment') cssClass += ' col-judgment';
            else if (fieldInfo?.group === '일반') cssClass += ' col-general';
            else if (fieldInfo?.group === '유해') cssClass += isLivingOnly ? ' col-living-only' : ' col-hazardous';

            if (isHidden) cssClass += ' hideable-col hidden';
            else if (this.hiddenFields.has(field)) cssClass += ' hideable-col';

            // 농업용수 행에서 생활용수 전용 항목은 비관련 처리
            const isIrrelevant = testItems === '농업용수' && isLivingOnly;
            if (isIrrelevant) cssClass += ' irrelevant-field';

            td.className = cssClass;
            td.setAttribute('data-row', rowIdx);
            td.setAttribute('data-col', ci);
            td.setAttribute('data-field', field);
            td.contentEditable = !isIrrelevant;

            // 판정 필드는 적합/부적합 표시
            if (field === 'judgment') {
                const val = result[field] || '';
                td.textContent = val === 'pass' ? '적합' : val === 'fail' ? '부적합' : val;
                td.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.cycleJudgment(row.key, td);
                });
                td.contentEditable = false;
            } else {
                td.textContent = result[field] || '';
            }

            // 포커스/블러 이벤트
            if (field !== 'judgment') {
                td.addEventListener('focus', () => {
                    this.focusedCell = { rowIdx, colIdx: ci };
                    td.classList.add('focused');
                });
                td.addEventListener('blur', () => {
                    td.classList.remove('focused');
                    this.focusedCell = null;
                    this.handleCellEdit(row.key, field, td.textContent.trim());
                });
                td.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        td.blur();
                        this.moveFocus(rowIdx + 1, ci);
                    } else if (e.key === 'Tab') {
                        e.preventDefault();
                        td.blur();
                        this.moveFocus(rowIdx, ci + (e.shiftKey ? -1 : 1), e.shiftKey ? -1 : 1);
                    }
                });
            }

            tr.appendChild(td);
        }

        return tr;
    }

    addStaticCell(tr, className, text) {
        const td = document.createElement('td');
        td.className = className;
        td.textContent = text;
        tr.appendChild(td);
    }

    cycleJudgment(key, td) {
        if (!this.testResults[key]) this.testResults[key] = {};
        const current = this.testResults[key].judgment || '';
        let next = '';
        if (current === '') next = 'pass';
        else if (current === 'pass') next = 'fail';
        else next = '';

        this.testResults[key].judgment = next;
        td.textContent = next === 'pass' ? '적합' : next === 'fail' ? '부적합' : '';
        td.classList.remove('judgment-pass', 'judgment-fail');
        if (next === 'pass') td.classList.add('judgment-pass');
        else if (next === 'fail') td.classList.add('judgment-fail');

        this.saveTestResults();
    }

    // ========================================
    // 셀 편집 / 포커스 이동
    // ========================================

    handleCellEdit(key, field, value) {
        if (!this.testResults[key]) this.testResults[key] = {};
        const sanitized = value.slice(0, window.SampleConstants?.VALIDATION?.MAX_CELL_INPUT_LENGTH ?? 200);
        this.testResults[key][field] = sanitized;
        this.saveTestResults();
        this.validateFieldRange(key, field, sanitized);
    }

    moveFocus(rowIdx, colIdx, direction = 1) {
        if (colIdx >= this.resultFields.length) { colIdx = 0; rowIdx++; }
        if (colIdx < 0) { colIdx = this.resultFields.length - 1; rowIdx--; }
        if (rowIdx < 0 || rowIdx >= this.flatRows.length) return;

        // 숨김/비관련 컬럼 건너뛰기
        const maxIter = this.resultFields.length * 2;
        let iter = 0;
        while (iter++ < maxIter) {
            const field = this.resultFields[colIdx];
            if (field === 'judgment') { colIdx += direction; }
            else if (!this.showAllColumns && this.hiddenFields.has(field)) { colIdx += direction; }
            else if (this.isFieldIrrelevant(rowIdx, field)) { colIdx += direction; }
            else break;

            if (colIdx >= this.resultFields.length) { colIdx = 0; rowIdx++; }
            if (colIdx < 0) { colIdx = this.resultFields.length - 1; rowIdx--; }
            if (rowIdx < 0 || rowIdx >= this.flatRows.length) return;
        }

        const cell = this.tableBody?.querySelector(`td[data-row="${rowIdx}"][data-col="${colIdx}"]`);
        if (cell) {
            cell.focus();
            const range = document.createRange();
            range.selectNodeContents(cell);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    isFieldIrrelevant(rowIdx, field) {
        const row = this.flatRows[rowIdx];
        if (!row) return false;
        const testItems = row.log.testItems || '';
        const info = this.fieldInfoMap[field];
        if (!info) return false;
        // 농업용수 행에서 생활용수 전용 항목(벤젠, 톨루엔, 에틸벤젠, 크실렌)은 비관련
        if (testItems === '농업용수' && info.livingOnly) return true;
        return false;
    }

    // ========================================
    // 유효성 검증
    // ========================================

    validateFieldRange(key, field, value) {
        const info = this.fieldInfoMap[field];
        if (!info) return;

        const rowIdx = this.flatRows.findIndex(r => r.key === key);
        const colIdx = this.resultFields.indexOf(field);
        const cell = this.tableBody?.querySelector(`td[data-row="${rowIdx}"][data-col="${colIdx}"]`);
        const row = this.flatRows[rowIdx];
        const testItems = row?.log?.testItems || '생활용수';
        const standard = testItems === '농업용수' ? info.agri : info.living;

        if (!value || value.trim() === '' || !standard || standard === '-') {
            if (cell) cell.classList.remove('out-of-range');
            return;
        }

        const num = parseFloat(value.replace(/,/g, ''));
        if (isNaN(num)) {
            if (cell) cell.classList.remove('out-of-range');
            return;
        }

        const cleanStd = standard.replace(/,/g, '');
        const rangeMatch = cleanStd.match(/^([\d.]+)\s*~\s*([\d.]+)$/);
        const maxMatch = cleanStd.match(/^([\d.]+)\s*이하$/);
        const minMatch = cleanStd.match(/^([\d.]+)\s*이상$/);

        let isOk = true;
        if (rangeMatch) {
            isOk = num >= parseFloat(rangeMatch[1]) && num <= parseFloat(rangeMatch[2]);
        } else if (maxMatch) {
            isOk = num <= parseFloat(maxMatch[1]);
        } else if (minMatch) {
            isOk = num >= parseFloat(minMatch[1]);
        } else {
            if (cell) cell.classList.remove('out-of-range');
            return;
        }

        if (!isOk) {
            if (cell) cell.classList.add('out-of-range');
            const unitText = info.unit ? ` ${info.unit}` : '';
            if (window.showToast) window.showToast(`⚠️ ${info.label}: ${num}${unitText} → 기준 ${standard}`, 'warning');
        } else {
            if (cell) cell.classList.remove('out-of-range');
        }
    }

    validateAllRanges() {
        for (const [key, result] of Object.entries(this.testResults)) {
            for (const field of Object.keys(result)) {
                if (this.fieldInfoMap[field]) {
                    this.validateFieldRange(key, field, result[field]);
                }
            }
        }
    }

    // ========================================
    // 붙여넣기
    // ========================================

    handlePaste(event) {
        if (!this.focusedCell) return;
        const activeEl = document.activeElement;
        if (!activeEl || !activeEl.classList.contains('editable-cell')) return;

        event.preventDefault();
        const clipData = event.clipboardData || window.clipboardData;
        const text = clipData.getData('text/plain');
        if (!text) return;

        const rows = text.split(/\r?\n/).filter(r => r.length > 0);
        let startRow = this.focusedCell.rowIdx;
        let startCol = this.focusedCell.colIdx;
        let pastedCount = 0;

        for (let ri = 0; ri < rows.length; ri++) {
            const targetRow = startRow + ri;
            if (targetRow >= this.flatRows.length) break;

            const cols = rows[ri].split('\t');
            for (let ci = 0; ci < cols.length; ci++) {
                const targetCol = startCol + ci;
                if (targetCol >= this.resultFields.length) break;

                const field = this.resultFields[targetCol];
                if (field === 'judgment') continue;
                if (this.isFieldIrrelevant(targetRow, field)) continue;

                const value = cols[ci].trim().slice(0, window.SampleConstants?.VALIDATION?.MAX_CELL_INPUT_LENGTH ?? 200);
                const rowKey = this.flatRows[targetRow].key;

                if (!this.testResults[rowKey]) this.testResults[rowKey] = {};
                this.testResults[rowKey][field] = value;

                const cell = this.tableBody?.querySelector(`td[data-row="${targetRow}"][data-col="${targetCol}"]`);
                if (cell) {
                    cell.textContent = value;
                    cell.classList.add('paste-highlight');
                    setTimeout(() => cell.classList.remove('paste-highlight'), 1500);
                }
                pastedCount++;
            }
        }

        this.saveTestResults();
        if (window.showToast && pastedCount > 0) {
            window.showToast(`${pastedCount}개 셀에 데이터를 붙여넣었습니다.`, 'success');
        }
    }

    handleKeydown(e) {
        const activeEl = document.activeElement;
        if (!activeEl || !activeEl.classList.contains('editable-cell')) return;
        if (!this.focusedCell) return;

        const { rowIdx, colIdx } = this.focusedCell;
        if (e.key === 'ArrowDown') {
            e.preventDefault(); activeEl.blur(); this.moveFocus(rowIdx + 1, colIdx);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault(); activeEl.blur(); this.moveFocus(rowIdx - 1, colIdx);
        }
    }

    // ========================================
    // 전체 선택 / 일괄 적용
    // ========================================

    toggleSelectAll(checked) {
        this.selectedKeys.clear();
        if (checked) {
            for (const row of this.flatRows) this.selectedKeys.add(row.key);
        }
        const checkboxes = this.tableBody?.querySelectorAll('input[type="checkbox"]');
        checkboxes?.forEach(cb => { cb.checked = checked; });
        this.updateSelectAllState();
    }

    updateSelectAllState() {
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.checked = this.flatRows.length > 0 && this.selectedKeys.size === this.flatRows.length;
            this.selectAllCheckbox.indeterminate = this.selectedKeys.size > 0 && this.selectedKeys.size < this.flatRows.length;
        }
    }

    applyBulkValues() {
        if (this.selectedKeys.size === 0) {
            if (window.showToast) window.showToast('선택된 항목이 없습니다.', 'warning');
            return;
        }

        const testDate = this.bulkTestDateInput?.value || '';
        const judgment = this.bulkResultSelect?.value || '';
        let applied = 0;

        for (const key of this.selectedKeys) {
            if (!this.testResults[key]) this.testResults[key] = {};
            if (testDate) this.testResults[key].testDate = testDate;
            if (judgment) this.testResults[key].judgment = judgment;
            applied++;
        }

        this.saveTestResults();
        this.render();
        if (window.showToast) window.showToast(`${applied}건에 일괄 적용했습니다.`, 'success');
    }

    // ========================================
    // 컬럼 표시/숨김
    // ========================================

    toggleHiddenColumns() {
        this.showAllColumns = !this.showAllColumns;
        this.applyColumnVisibility();

        const btn = this.toggleColumnsBtn;
        if (btn) {
            const icon = btn.querySelector('.material-icons-outlined');
            const label = btn.querySelector('.util-btn-label');
            if (icon) icon.textContent = this.showAllColumns ? 'visibility_off' : 'visibility';
            if (label) label.textContent = this.showAllColumns ? '간략보기' : '전체보기';
        }
    }

    applyColumnVisibility() {
        const filter = this.testItemFilter;

        // 생활용수 전용 컬럼: 농업용수 필터 시 숨김
        document.querySelectorAll('.col-living-only').forEach(el => {
            if (filter === '농업용수') el.classList.add('filter-hidden');
            else el.classList.remove('filter-hidden');
        });

        // hideable 컬럼
        document.querySelectorAll('.hideable-col').forEach(el => {
            if (this.showAllColumns) el.classList.remove('hidden');
            else el.classList.add('hidden');
        });
    }

    // ========================================
    // 내보내기
    // ========================================

    exportToExcel() {
        let targetRows = this.flatRows;
        if (this.selectedKeys.size > 0) {
            targetRows = this.flatRows.filter(r => this.selectedKeys.has(r.key));
        }

        if (targetRows.length === 0) {
            if (window.showToast) window.showToast('내보낼 데이터가 없습니다.', 'warning');
            return;
        }

        try {
            const wb = XLSX.utils.book_new();

            // 생활용수 시트 (19항목)
            const livingRows = targetRows.filter(r => r.log.testItems === '생활용수' || r.log.testItems === '');
            if (livingRows.length > 0) {
                const livingFields = WATER_QUALITY_FIELDS; // 전체 19항목
                const wsData = this.buildWaterSheet(livingRows, livingFields, '생활용수');
                const ws = XLSX.utils.aoa_to_sheet(sanitizeExcelAoa(wsData));
                this.applyExportStyles(ws, wsData.length, livingFields.length + 7);
                XLSX.utils.book_append_sheet(wb, ws, '생활용수');
            }

            // 농업용수 시트 (15항목, livingOnly 제외)
            const agriRows = targetRows.filter(r => r.log.testItems === '농업용수');
            if (agriRows.length > 0) {
                const agriFields = WATER_QUALITY_FIELDS.filter(f => !f.livingOnly);
                const wsData = this.buildWaterSheet(agriRows, agriFields, '농업용수');
                const ws = XLSX.utils.aoa_to_sheet(sanitizeExcelAoa(wsData));
                this.applyExportStyles(ws, wsData.length, agriFields.length + 7);
                XLSX.utils.book_append_sheet(wb, ws, '농업용수');
            }

            const fileName = `수질분석결과_${this.selectedYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);

            if (window.showToast) {
                window.showToast(`${targetRows.length}건 수질분석 결과를 내보냈습니다.`, 'success');
            }
        } catch (e) {
            (window.logger?.error || console.error)('수질분석 내보내기 실패:', e);
            if (window.showToast) window.showToast('내보내기에 실패했습니다.', 'error');
        }
    }

    buildWaterSheet(rows, fields, testItems) {
        const data = [];
        const stdKey = testItems === '농업용수' ? 'agri' : 'living';

        // 1행: 헤더
        const header = [
            '접수번호', '성명', '채취장소', '시료명', '접수일자', '검사일자',
            ...fields.map(f => `${f.label}${f.unit ? '\n(' + f.unit + ')' : ''}`),
            '판정'
        ];
        data.push(header);

        // 2행: 기준값
        const standards = [
            '', '', '', '', '', '',
            ...fields.map(f => f[stdKey] || '-'),
            ''
        ];
        data.push(standards);

        // 데이터 행
        for (const row of rows) {
            const result = this.testResults[row.key] || {};
            const dataRow = [
                row.log.receptionNumber || '',
                row.log.name || '',
                row.location || '',
                row.sampleName || '',
                row.log.date || '',
                result.testDate || '',
                ...fields.map(f => result[f.key] || ''),
                result.judgment === 'pass' ? '적합' : result.judgment === 'fail' ? '부적합' : ''
            ];
            data.push(dataRow);
        }

        return data;
    }

    applyExportStyles(ws, rowCount, colCount) {
        const headerStyle = {
            fill: { fgColor: { rgb: 'B4C6E7' } },
            font: { bold: true, sz: 10 },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
                top: { style: 'thin', color: { rgb: '808080' } },
                bottom: { style: 'thin', color: { rgb: '808080' } },
                left: { style: 'thin', color: { rgb: '808080' } },
                right: { style: 'thin', color: { rgb: '808080' } }
            }
        };

        const standardStyle = {
            fill: { fgColor: { rgb: 'FCE4B5' } },
            font: { sz: 9, color: { rgb: '666666' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: '808080' } },
                bottom: { style: 'thin', color: { rgb: '808080' } },
                left: { style: 'thin', color: { rgb: '808080' } },
                right: { style: 'thin', color: { rgb: '808080' } }
            }
        };

        const dataStyle = {
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: '808080' } },
                bottom: { style: 'thin', color: { rgb: '808080' } },
                left: { style: 'thin', color: { rgb: '808080' } },
                right: { style: 'thin', color: { rgb: '808080' } }
            }
        };

        for (let c = 0; c < colCount; c++) {
            const col = XLSX.utils.encode_col(c);

            // 1행 헤더
            const cell1 = col + '1';
            if (!ws[cell1]) ws[cell1] = { v: '', t: 's' };
            ws[cell1].s = headerStyle;

            // 2행 기준
            const cell2 = col + '2';
            if (!ws[cell2]) ws[cell2] = { v: '', t: 's' };
            ws[cell2].s = standardStyle;

            // 데이터 행
            for (let r = 2; r < rowCount; r++) {
                const addr = col + (r + 1);
                if (!ws[addr]) ws[addr] = { v: '', t: 's' };
                ws[addr].s = dataStyle;
            }
        }

        // 열 너비
        const cols = [];
        for (let c = 0; c < colCount; c++) {
            if (c < 6) cols.push({ wch: c === 2 ? 20 : c === 3 ? 12 : 10 });
            else cols.push({ wch: 12 });
        }
        ws['!cols'] = cols;
    }
}

// ========================================
// 페이지 초기화
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        for (let y = currentYear - 2; y <= currentYear + 5; y++) {
            const opt = document.createElement('option');
            opt.value = String(y);
            opt.textContent = String(y);
            yearSelect.appendChild(opt);
        }
    }

    window.waterAnalysisManager = new WaterAnalysisManager();
});
