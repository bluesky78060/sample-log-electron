/**
 * @fileoverview 퇴·액비 검정결과 조회 페이지
 */

class CompostAnalysisViewer {
    constructor() {
        this.selectedYear = new Date().getFullYear().toString();
        this.sampleLogs = [];
        this.testResults = {};
        this.init();
    }

    init() {
        this.cacheElements();
        this.setDefaultYear();
        this.restoreFromCompostPage();
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

    restoreFromCompostPage() {
        const year = localStorage.getItem('compostAnalysis_year');
        if (year) {
            this.selectedYear = year;
            if (this.yearSelect) this.yearSelect.value = year;
            localStorage.removeItem('compostAnalysis_year');
        }

        const selectedIdsJson = localStorage.getItem('compostAnalysis_selected_ids');
        if (selectedIdsJson) {
            try {
                const ids = JSON.parse(selectedIdsJson);
                this.preSelectedLogIds = Array.isArray(ids) && ids.length > 0 ? new Set(ids) : null;
            } catch (e) { this.preSelectedLogIds = null; }
            localStorage.removeItem('compostAnalysis_selected_ids');
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
        const key = `compostSampleLogs_${this.selectedYear}`;
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
        const key = `compostTestResults_${this.selectedYear}`;
        try {
            const data = localStorage.getItem(key);
            if (!data) return {};
            return JSON.parse(data) || {};
        } catch (e) { return {}; }
    }

    async syncFromFirestore() {
        if (!window.firestoreDb?.isEnabled()) return;
        try {
            const year = parseInt(this.selectedYear);
            const cloudData = await window.firestoreDb.getAll('compostTestResults', year);
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
            localStorage.setItem(`compostTestResults_${this.selectedYear}`, JSON.stringify(this.testResults));
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

        const animalType = log.animalType || '-';

        this.addCell(tr, 'col-num sticky-col', log.receptionNumber || '-');
        this.addCell(tr, 'col-date sticky-col', log.date || '-');
        this.addCell(tr, 'col-name sticky-col', log.name || '-');

        const tdAnimal = document.createElement('td');
        tdAnimal.className = 'col-animal';
        tdAnimal.textContent = animalType;
        tr.appendChild(tdAnimal);

        this.addCell(tr, 'col-sample-type', log.sampleType || log.subCategory || '-');
        this.addCell(tr, 'col-purpose', log.purpose || '-');
        this.addCell(tr, 'col-test-date', result?.testDate || '-');

        // 함수율
        const moisture = result?.moisture || log.moisture || '-';
        const tdMoisture = document.createElement('td');
        tdMoisture.className = 'col-moisture';
        tdMoisture.textContent = moisture !== '-' ? `${moisture}%` : '-';
        tr.appendChild(tdMoisture);

        // 부숙도
        const maturity = result?.maturity || log.maturity || '-';
        this.addCell(tr, 'col-maturity', maturity);

        // 축종별 추가 항목
        const tdExtra = document.createElement('td');
        tdExtra.className = 'col-extra';
        if (animalType === '소' && result?.salinity) {
            tdExtra.textContent = `염분: ${result.salinity}%`;
        } else if (animalType === '돼지') {
            const parts = [];
            if (result?.copper) parts.push(`Cu: ${result.copper}`);
            if (result?.zinc) parts.push(`Zn: ${result.zinc}`);
            tdExtra.textContent = parts.length > 0 ? parts.join(', ') : '-';
        } else {
            tdExtra.textContent = '-';
        }
        tr.appendChild(tdExtra);

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
            const data = [['접수번호', '접수일자', '성명', '축종', '시료종류', '목적', '검사일자', '함수율(%)', '부숙도', '염분(%)', '구리(mg/kg)', '아연(mg/kg)', '판정']];

            for (const log of logsToShow) {
                const r = this.testResults[log.id] || {};
                data.push([
                    log.receptionNumber || '', log.date || '', log.name || '',
                    log.animalType || '', log.sampleType || log.subCategory || '', log.purpose || '',
                    r.testDate || '', r.moisture || log.moisture || '', r.maturity || log.maturity || '',
                    r.salinity || '', r.copper || '', r.zinc || '',
                    r.judgment === 'pass' ? '적합' : r.judgment === 'fail' ? '부적합' : ''
                ]);
            }

            const ws = XLSX.utils.aoa_to_sheet(typeof sanitizeExcelAoa === 'function' ? sanitizeExcelAoa(data) : data);

            const headerStyle = { fill: { fgColor: { rgb: 'B4C6E7' } }, font: { bold: true, sz: 10 }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
            for (let c = 0; c < 13; c++) {
                const addr = XLSX.utils.encode_col(c) + '1';
                if (!ws[addr]) ws[addr] = { v: '', t: 's' };
                ws[addr].s = headerStyle;
            }

            ws['!cols'] = [
                { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
                { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
                { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 8 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, '퇴액비검정결과');
            XLSX.writeFile(wb, `퇴액비검정결과_${this.selectedYear}_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    window.compostAnalysisViewer = new CompostAnalysisViewer();
});
