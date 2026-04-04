/**
 * @fileoverview 잔류농약 분석결과 조회 페이지
 * 접수 데이터 + 분석 결과(pesticideTestResults)를 합쳐서
 * 시료별 검출 농약 목록을 테이블로 표시
 */

class PesticideAnalysisViewer {
    constructor() {
        this.selectedYear = new Date().getFullYear().toString();
        this.sampleLogs = [];
        this.testResults = {};
        this.filterStatus = 'all';

        this.init();
    }

    init() {
        this.cacheElements();
        this.setDefaultYear();
        this.restoreFromPesticidePage();
        this.bindEvents();
        this.loadData();
        this.render();

        if (typeof ThemeManager !== 'undefined') {
            ThemeManager.init();
            this.setupThemeToggle();
        }

        this.syncFromFirestore();
    }

    cacheElements() {
        this.yearSelect = document.getElementById('yearSelect');
        this.filterSelect = document.getElementById('filterStatus');
        this.exportBtn = document.getElementById('exportBtn');
        this.tableBody = document.getElementById('tableBody');
        this.emptyState = document.getElementById('emptyState');
        this.recordCount = document.getElementById('recordCount');
    }

    setDefaultYear() {
        const year = new Date().getFullYear().toString();
        this.selectedYear = year;
        if (this.yearSelect) this.yearSelect.value = year;
    }

    restoreFromPesticidePage() {
        const year = localStorage.getItem('pesticideAnalysis_year');
        if (year) {
            this.selectedYear = year;
            if (this.yearSelect) this.yearSelect.value = year;
            localStorage.removeItem('pesticideAnalysis_year');
        }

        const selectedIdsJson = localStorage.getItem('pesticideAnalysis_selected_ids');
        if (selectedIdsJson) {
            try {
                const ids = JSON.parse(selectedIdsJson);
                this.preSelectedLogIds = Array.isArray(ids) && ids.length > 0 ? new Set(ids) : null;
            } catch (e) {
                this.preSelectedLogIds = null;
            }
            localStorage.removeItem('pesticideAnalysis_selected_ids');
        }

        document.getElementById('backBtn')?.addEventListener('click', () => window.close());
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
            this.loadData();
            this.render();
        });

        this.filterSelect?.addEventListener('change', () => {
            this.filterStatus = this.filterSelect.value;
            this.render();
        });

        this.exportBtn?.addEventListener('click', () => this.exportToExcel());
    }

    // ========================================
    // 데이터 로드
    // ========================================

    loadData() {
        this.sampleLogs = this.loadSampleLogs();
        this.testResults = this.loadTestResults();
    }

    loadSampleLogs() {
        const key = `pesticideSampleLogs_${this.selectedYear}`;
        try {
            const data = localStorage.getItem(key);
            if (!data) return [];
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) return [];
            return parsed.sort((a, b) => {
                const toNum = s => { if (!s) return Infinity; const n = parseFloat(String(s)); return isNaN(n) ? Infinity : n; };
                return toNum(a.receptionNumber) - toNum(b.receptionNumber);
            });
        } catch (e) {
            return [];
        }
    }

    loadTestResults() {
        const key = `pesticideTestResults_${this.selectedYear}`;
        try {
            const data = localStorage.getItem(key);
            if (!data) return {};
            return JSON.parse(data) || {};
        } catch (e) {
            return {};
        }
    }

    async syncFromFirestore() {
        if (!window.firestoreDb?.isEnabled()) return;
        try {
            const year = parseInt(this.selectedYear);
            const cloudData = await window.firestoreDb.getAll('pesticideTestResults', year);
            if (!cloudData || cloudData.length === 0) return;

            const cloudMap = {};
            for (const doc of cloudData) {
                const key = doc._resultKey || doc.id;
                if (key) {
                    const { _resultKey, syncedAt, updatedAt: _, ...rest } = doc;
                    cloudMap[key] = rest;
                }
            }

            // updatedAt 기준 병합 (최신 데이터 우선)
            for (const [key, cloudVal] of Object.entries(cloudMap)) {
                const localVal = this.testResults[key];
                if (!localVal || !localVal.updatedAt || new Date(cloudVal.updatedAt) >= new Date(localVal.updatedAt)) {
                    this.testResults[key] = cloudVal;
                }
            }
            localStorage.setItem(`pesticideTestResults_${this.selectedYear}`, JSON.stringify(this.testResults));
            this.render();
        } catch (e) {
            (window.logger?.error || console.error)('Firestore 동기화 실패:', e);
        }
    }

    // ========================================
    // 렌더링
    // ========================================

    render() {
        if (!this.tableBody) return;

        const rows = this.getFilteredRows();

        if (rows.length === 0) {
            this.tableBody.innerHTML = '';
            if (this.emptyState) this.emptyState.style.display = 'flex';
            if (this.recordCount) this.recordCount.textContent = '0건';
            return;
        }

        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.recordCount) this.recordCount.textContent = `${rows.length}건`;

        const fragment = document.createDocumentFragment();
        for (const { log, result } of rows) {
            fragment.appendChild(this.createTableRow(log, result));
        }

        this.tableBody.innerHTML = '';
        this.tableBody.appendChild(fragment);
    }

    getFilteredRows() {
        const logsToShow = (this.preSelectedLogIds && this.preSelectedLogIds.size > 0)
            ? this.sampleLogs.filter(log => this.preSelectedLogIds.has(log.id))
            : this.sampleLogs;

        return logsToShow
            .map(log => ({
                log,
                result: this.testResults[log.id] || null
            }))
            .filter(({ result }) => {
                if (this.filterStatus === 'all') return true;
                if (this.filterStatus === 'detected') return result?.detections?.length > 0;
                if (this.filterStatus === 'clean') return result?.allNd === true;
                if (this.filterStatus === 'noResult') return !result || (!result.allNd && (!result.detections || result.detections.length === 0));
                return true;
            });
    }

    createTableRow(log, result) {
        const tr = document.createElement('tr');
        if (log.isComplete) tr.classList.add('row-completed');

        const detections = result?.detections || [];
        const isAllNd = result?.allNd || false;

        // 접수번호
        this.addCell(tr, 'col-num sticky-col', log.receptionNumber || '-');

        // 접수일자
        this.addCell(tr, 'col-date sticky-col', log.date || '-');

        // 성명
        const tdName = document.createElement('td');
        tdName.className = 'col-name sticky-col';
        tdName.textContent = log.name || '-';
        tr.appendChild(tdName);

        // 의뢰물품
        this.addCell(tr, 'col-crop sticky-col', log.requestContent || log.cropName || '-');

        // 목적
        this.addCell(tr, 'col-purpose sticky-col', log.purpose || '-');

        // 검사일자
        this.addCell(tr, 'col-test-date', result?.testDate || '-');

        // 검출수
        const detectedCount = detections.length;
        const tdCount = document.createElement('td');
        tdCount.className = 'col-detection-count';
        if (isAllNd) {
            tdCount.textContent = '불검출';
            tdCount.classList.add('all-clean');
        } else if (detections.length === 0) {
            tdCount.textContent = '-';
            tdCount.classList.add('no-result');
        } else {
            tdCount.textContent = `${detectedCount}종`;
            tdCount.classList.add('has-detected');
        }
        tr.appendChild(tdCount);

        // 검출 농약 목록
        const tdDetections = document.createElement('td');
        tdDetections.className = 'col-detections';

        if (isAllNd) {
            tdDetections.innerHTML = '<span class="det-clean">전체 불검출</span>';
        } else if (detections.length === 0) {
            tdDetections.innerHTML = '<span class="det-empty">미입력</span>';
        } else {
            // 서브테이블로 성분명 / 검출량 / 분석법 표시
            const subTable = document.createElement('table');
            subTable.className = 'det-sub-table';

            for (const det of detections) {
                const subTr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.className = 'det-sub-name';
                tdName.textContent = det.name || '';
                subTr.appendChild(tdName);

                const tdVal = document.createElement('td');
                tdVal.className = 'det-sub-value';
                tdVal.textContent = det.value ? `${det.value} mg/kg` : '';
                subTr.appendChild(tdVal);

                const tdMeth = document.createElement('td');
                tdMeth.className = 'det-sub-method';
                tdMeth.textContent = det.method || '';
                subTr.appendChild(tdMeth);

                subTable.appendChild(subTr);
            }

            tdDetections.appendChild(subTable);
        }
        tr.appendChild(tdDetections);

        // 판정
        const tdJudgment = document.createElement('td');
        tdJudgment.className = 'col-judgment';
        if (isAllNd) {
            tdJudgment.textContent = '불검출';
            tdJudgment.classList.add('judgment-pass');
        } else if (detections.length > 0) {
            tdJudgment.textContent = '검출';
            tdJudgment.classList.add('judgment-fail');
        } else {
            tdJudgment.textContent = '-';
        }
        tr.appendChild(tdJudgment);

        return tr;
    }

    addCell(tr, className, text) {
        const td = document.createElement('td');
        td.className = className;
        td.textContent = text;
        tr.appendChild(td);
    }

    // ========================================
    // 내보내기
    // ========================================

    exportToExcel() {
        const rows = this.getFilteredRows();
        if (rows.length === 0) {
            if (window.showToast) window.showToast('내보낼 데이터가 없습니다.', 'warning');
            return;
        }

        try {
            const wb = XLSX.utils.book_new();
            const data = [];

            // 헤더
            data.push(['접수번호', '접수일자', '성명', '의뢰물품', '목적', '검사일자', '검출수', '검출농약', '검출량(mg/kg)', '분석법', '판정']);

            // 데이터 행: 시료당 검출 농약 수만큼 행 생성
            for (const { log, result } of rows) {
                const detections = result?.detections || [];
                const isAllNd = result?.allNd || false;
                const judgment = isAllNd ? '불검출' : (detections.length > 0 ? '검출' : '');
                const countStr = detections.length > 0 ? `${detections.length}종` : (isAllNd ? '불검출' : '');

                const baseRow = [
                    log.receptionNumber || '',
                    log.date || '',
                    log.name || '',
                    log.requestContent || log.cropName || '',
                    log.purpose || '',
                    result?.testDate || '',
                    countStr,
                ];

                if (detections.length === 0) {
                    // 검출 없음: 1행
                    data.push([...baseRow, isAllNd ? '전체 불검출' : '', '', '', judgment]);
                } else {
                    // 첫 번째 검출 농약: 접수 정보 포함
                    data.push([...baseRow, detections[0].name || '', detections[0].value || '', detections[0].method || '', judgment]);

                    // 2번째 이후: 접수 정보 빈칸, 검출 농약만
                    for (let i = 1; i < detections.length; i++) {
                        data.push(['', '', '', '', '', '', '', detections[i].name || '', detections[i].value || '', detections[i].method || '', '']);
                    }
                }
            }

            const ws = XLSX.utils.aoa_to_sheet(typeof sanitizeExcelAoa === 'function' ? sanitizeExcelAoa(data) : data);

            const totalCols = data[0]?.length || 11;
            // 병합할 컬럼: 접수번호(0), 접수일자(1), 성명(2), 의뢰물품(3), 목적(4), 검사일자(5), 검출수(6), 판정(10)
            const mergeCols = [0, 1, 2, 3, 4, 5, 6, 10];
            const merges = [];

            // 각 시료의 시작행과 검출 수를 추적하여 셀 병합
            let currentRow = 1; // 0은 헤더
            for (const { result } of rows) {
                const detections = result?.detections || [];
                const rowSpan = Math.max(detections.length, 1);

                if (rowSpan > 1) {
                    for (const col of mergeCols) {
                        merges.push({
                            s: { r: currentRow, c: col },
                            e: { r: currentRow + rowSpan - 1, c: col }
                        });
                    }
                }
                currentRow += rowSpan;
            }

            ws['!merges'] = merges;

            // 스타일
            const headerStyle = {
                fill: { fgColor: { rgb: 'B4C6E7' } },
                font: { bold: true, sz: 10 },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: { top: { style: 'thin', color: { rgb: '808080' } }, bottom: { style: 'thin', color: { rgb: '808080' } }, left: { style: 'thin', color: { rgb: '808080' } }, right: { style: 'thin', color: { rgb: '808080' } } }
            };

            const dataStyle = {
                alignment: { horizontal: 'center', vertical: 'center' },
                border: { top: { style: 'thin', color: { rgb: '808080' } }, bottom: { style: 'thin', color: { rgb: '808080' } }, left: { style: 'thin', color: { rgb: '808080' } }, right: { style: 'thin', color: { rgb: '808080' } } }
            };

            const nameStyle = {
                alignment: { horizontal: 'left', vertical: 'center' },
                border: { top: { style: 'thin', color: { rgb: '808080' } }, bottom: { style: 'thin', color: { rgb: '808080' } }, left: { style: 'thin', color: { rgb: '808080' } }, right: { style: 'thin', color: { rgb: '808080' } } }
            };

            for (let c = 0; c < totalCols; c++) {
                const col = XLSX.utils.encode_col(c);
                // 헤더
                const h = col + '1';
                if (!ws[h]) ws[h] = { v: '', t: 's' };
                ws[h].s = headerStyle;

                // 데이터 행
                for (let r = 1; r < data.length; r++) {
                    const addr = col + (r + 1);
                    if (!ws[addr]) ws[addr] = { v: '', t: 's' };
                    ws[addr].s = (c === 7) ? nameStyle : dataStyle; // 검출농약 컬럼은 왼쪽 정렬
                }
            }

            ws['!cols'] = [
                { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 15 },
                { wch: 10 }, { wch: 12 }, { wch: 8 },
                { wch: 25 }, { wch: 14 }, { wch: 8 }, { wch: 8 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, '잔류농약분석결과');
            XLSX.writeFile(wb, `잔류농약분석결과_${this.selectedYear}_${new Date().toISOString().slice(0, 10)}.xlsx`);

            if (window.showToast) window.showToast(`${rows.length}건 내보냈습니다.`, 'success');
        } catch (e) {
            (window.logger?.error || console.error)('내보내기 실패:', e);
            if (window.showToast) window.showToast('내보내기에 실패했습니다.', 'error');
        }
    }
}

// 초기화
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

    window.pesticideAnalysisViewer = new PesticideAnalysisViewer();
});
