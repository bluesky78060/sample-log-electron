/**
 * @fileoverview 토양 중금속 분석결과 조회 페이지
 */

class HeavyMetalAnalysisViewer {
    constructor() {
        this.selectedYear = new Date().getFullYear().toString();
        this.sampleLogs = [];
        this.testResults = {};
        this.init();
    }

    static METAL_KEYS = ['cadmium', 'copper', 'arsenic', 'mercury', 'lead', 'chromium6', 'zinc', 'nickel'];
    static METAL_LABELS = ['Cd', 'Cu', 'As', 'Hg', 'Pb', 'Cr6+', 'Zn', 'Ni'];
    static METAL_FULL_LABELS = ['카드뮴(Cd)', '구리(Cu)', '비소(As)', '수은(Hg)', '납(Pb)', '6가크롬(Cr6+)', '아연(Zn)', '니켈(Ni)'];

    init() {
        this.cacheElements();
        this.setDefaultYear();
        this.restoreFromHeavyMetalPage();
        this.bindEvents();
        this.loadData();
        this.render();

        if (typeof ThemeManager !== 'undefined') {
            ThemeManager.init();
            const btn = document.getElementById('themeToggleBtn');
            if (btn) {
                const current = document.documentElement.getAttribute('data-theme');
                if (current === 'dark') btn.classList.add('dark');
                btn.addEventListener('click', () => {
                    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                    ThemeManager.setTheme(isDark ? 'light' : 'dark');
                    btn.classList.toggle('dark', !isDark);
                });
            }
        }

        this.syncFromFirestore();
    }

    cacheElements() {
        this.yearSelect = document.getElementById('yearSelect');
        this.exportBtn = document.getElementById('exportBtn');
        this.tableBody = document.getElementById('tableBody');
        this.emptyState = document.getElementById('emptyState');
        this.recordCount = document.getElementById('recordCount');
    }

    setDefaultYear() {
        this.selectedYear = new Date().getFullYear().toString();
        if (this.yearSelect) this.yearSelect.value = this.selectedYear;
    }

    restoreFromHeavyMetalPage() {
        const year = localStorage.getItem('heavyMetalAnalysis_year');
        if (year) {
            this.selectedYear = year;
            if (this.yearSelect) this.yearSelect.value = year;
            localStorage.removeItem('heavyMetalAnalysis_year');
        }

        const selectedIdsJson = localStorage.getItem('heavyMetalAnalysis_selected_ids');
        if (selectedIdsJson) {
            try {
                const ids = JSON.parse(selectedIdsJson);
                this.preSelectedLogIds = Array.isArray(ids) && ids.length > 0 ? new Set(ids) : null;
            } catch (e) { this.preSelectedLogIds = null; }
            localStorage.removeItem('heavyMetalAnalysis_selected_ids');
        }

        document.getElementById('backBtn')?.addEventListener('click', () => window.close());
    }

    bindEvents() {
        this.yearSelect?.addEventListener('change', () => {
            this.selectedYear = this.yearSelect.value;
            this.loadData();
            this.render();
        });
        this.exportBtn?.addEventListener('click', () => this.exportToExcel());
    }

    loadData() {
        this.sampleLogs = this.loadSampleLogs();
        this.testResults = this.loadTestResults();
    }

    loadSampleLogs() {
        const key = `heavyMetalSampleLogs_${this.selectedYear}`;
        try {
            const data = localStorage.getItem(key);
            if (!data) return [];
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) return [];
            return parsed.sort((a, b) => {
                const toNum = s => { if (!s) return Infinity; return parseFloat(String(s)) || Infinity; };
                return toNum(a.receptionNumber) - toNum(b.receptionNumber);
            });
        } catch (e) { return []; }
    }

    loadTestResults() {
        const key = `heavyMetalTestResults_${this.selectedYear}`;
        try {
            const data = localStorage.getItem(key);
            if (!data) return {};
            return JSON.parse(data) || {};
        } catch (e) { return {}; }
    }

    async syncFromFirestore() {
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

            for (const [key, cloudVal] of Object.entries(cloudMap)) {
                const localVal = this.testResults[key];
                if (!localVal || !localVal.updatedAt || new Date(cloudVal.updatedAt) >= new Date(localVal.updatedAt)) {
                    this.testResults[key] = cloudVal;
                }
            }
            localStorage.setItem(`heavyMetalTestResults_${this.selectedYear}`, JSON.stringify(this.testResults));
            this.render();
        } catch (e) {
            (window.logger?.error || console.error)('Firestore 동기화 실패:', e);
        }
    }

    render() {
        if (!this.tableBody) return;

        const logsToShow = (this.preSelectedLogIds && this.preSelectedLogIds.size > 0)
            ? this.sampleLogs.filter(log => this.preSelectedLogIds.has(log.id))
            : this.sampleLogs;

        if (logsToShow.length === 0) {
            this.tableBody.innerHTML = '';
            if (this.emptyState) this.emptyState.style.display = 'flex';
            if (this.recordCount) this.recordCount.textContent = '0건';
            return;
        }

        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.recordCount) this.recordCount.textContent = `${logsToShow.length}건`;

        const fragment = document.createDocumentFragment();
        for (const log of logsToShow) {
            const result = this.testResults[log.id] || null;
            fragment.appendChild(this.createRow(log, result));
        }
        this.tableBody.innerHTML = '';
        this.tableBody.appendChild(fragment);
    }

    createRow(log, result) {
        const tr = document.createElement('tr');
        if (log.isComplete) tr.classList.add('row-completed');

        this.addCell(tr, 'col-num sticky-col', log.receptionNumber || '-');
        this.addCell(tr, 'col-date sticky-col', log.date || '-');
        this.addCell(tr, 'col-name sticky-col', log.name || '-');
        this.addCell(tr, 'col-location', log.samplingLocation || '-');
        this.addCell(tr, 'col-purpose', log.purpose || '-');
        this.addCell(tr, 'col-test-date', result?.testDate || '-');

        // 8 metal columns
        for (const key of HeavyMetalAnalysisViewer.METAL_KEYS) {
            const val = result?.[key] || '-';
            const td = document.createElement('td');
            td.className = 'col-metal';
            td.textContent = val;
            tr.appendChild(td);
        }

        // 판정
        const tdJudgment = document.createElement('td');
        tdJudgment.className = 'col-judgment';
        const j = result?.judgment || '';
        if (j === 'pass') { tdJudgment.textContent = '적합'; tdJudgment.classList.add('judgment-pass'); }
        else if (j === 'fail') { tdJudgment.textContent = '부적합'; tdJudgment.classList.add('judgment-fail'); }
        else { tdJudgment.textContent = '-'; }
        tr.appendChild(tdJudgment);

        return tr;
    }

    addCell(tr, className, text) {
        const td = document.createElement('td');
        td.className = className;
        td.textContent = text;
        tr.appendChild(td);
    }

    exportToExcel() {
        const logsToShow = (this.preSelectedLogIds && this.preSelectedLogIds.size > 0)
            ? this.sampleLogs.filter(log => this.preSelectedLogIds.has(log.id))
            : this.sampleLogs;

        if (logsToShow.length === 0) {
            if (window.showToast) window.showToast('내보낼 데이터가 없습니다.', 'warning');
            return;
        }

        try {
            const wb = XLSX.utils.book_new();
            const headers = ['접수번호', '접수일자', '성명', '채취장소', '용도', '검사일자',
                ...HeavyMetalAnalysisViewer.METAL_FULL_LABELS, '판정'];
            const data = [headers];

            for (const log of logsToShow) {
                const r = this.testResults[log.id] || {};
                const row = [
                    log.receptionNumber || '', log.date || '', log.name || '',
                    log.samplingLocation || '', log.purpose || '',
                    r.testDate || ''
                ];
                for (const key of HeavyMetalAnalysisViewer.METAL_KEYS) {
                    row.push(r[key] || '');
                }
                row.push(r.judgment === 'pass' ? '적합' : r.judgment === 'fail' ? '부적합' : '');
                data.push(row);
            }

            const ws = XLSX.utils.aoa_to_sheet(typeof sanitizeExcelAoa === 'function' ? sanitizeExcelAoa(data) : data);

            const colCount = headers.length;
            const headerStyle = { fill: { fgColor: { rgb: 'FDE68A' } }, font: { bold: true, sz: 10 }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
            for (let c = 0; c < colCount; c++) {
                const addr = XLSX.utils.encode_col(c) + '1';
                if (!ws[addr]) ws[addr] = { v: '', t: 's' };
                ws[addr].s = headerStyle;
            }

            ws['!cols'] = [
                { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 18 }, { wch: 10 }, { wch: 12 },
                { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
                { wch: 8 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, '중금속분석결과');
            XLSX.writeFile(wb, `중금속분석결과_${this.selectedYear}_${new Date().toISOString().slice(0, 10)}.xlsx`);
            if (window.showToast) window.showToast(`${logsToShow.length}건 내보냈습니다.`, 'success');
        } catch (e) {
            (window.logger?.error || console.error)('내보내기 실패:', e);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        for (let y = currentYear - 2; y <= currentYear + 5; y++) {
            const opt = document.createElement('option');
            opt.value = String(y); opt.textContent = String(y);
            yearSelect.appendChild(opt);
        }
    }
    window.heavyMetalAnalysisViewer = new HeavyMetalAnalysisViewer();
});
