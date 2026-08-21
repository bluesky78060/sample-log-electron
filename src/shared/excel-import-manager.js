/**
 * ExcelImportManager - 엑셀 가져오기 공통 모듈
 *
 * 모든 시료 타입(토양, 수질, 퇴액비, 중금속, 잔류농약)의
 * 엑셀 가져오기 3단계 위자드를 공통화합니다.
 *
 * 사용법:
 *   const importer = new ExcelImportManager({ ...config });
 *   importer.init();
 *
 * @global window.ExcelImportManager
 */
class ExcelImportManager {
    /**
     * @param {Object} config
     * @param {Array<{key:string, label:string}>} config.appFields - 앱 필드 정의
     * @param {Object<string, string>} config.autoMapRules - 자동매핑 규칙 (엑셀헤더 → 앱필드키)
     * @param {Object} config.templateConfig - 서식 다운로드 설정
     * @param {string[]} config.templateConfig.headers - 서식 헤더
     * @param {Array} config.templateConfig.sampleRow - 예시 행
     * @param {Array<{wch:number}>} config.templateConfig.colWidths - 컬럼 너비
     * @param {string} config.templateConfig.sheetName - 시트명
     * @param {string} config.templateConfig.fileName - 파일명 (확장자 제외)
     * @param {Array<{key:string, label:string}>} config.previewColumns - 미리보기 테이블 컬럼
     * @param {Function} config.buildRecord - (getVal, parseExcelDate, commonData, rowIdx) => object
     * @param {Function} [config.skipRowCheck] - (record, rowIdx) => string|null (경고 메시지 또는 null)
     * @param {Function} [config.renderPreviewCell] - (record, columnKey) => string (커스텀 셀 렌더링)
     * @param {Function} config.onImportComplete - (records) => void
     * @param {Function} config.getCommonData - () => object
     * @param {Function} [config.validateStep1] - () => {valid:boolean, message?:string}
     * @param {Function} [config.autoNumberFilter] - (log) => boolean (접수번호 채번 시 필터)
     * @param {Function} [config.autoNumberExtract] - (log) => number|NaN (접수번호에서 숫자 추출)
     * @param {boolean} [config.setDefaultDate=true] - importDate 기본값을 오늘로 설정할지 여부
     * @param {Function} [config.postBuildRecords] - (records) => void (레코드 빌드 후 추가 처리)
     */
    constructor(config) {
        this.config = config;

        // 상태
        this._currentStep = 1;
        this._excelHeaders = [];
        this._excelData = [];
        this._columnMapping = {};
        this._parsedLogs = [];

        // 접수번호 중복 검사 상태 (SAMPL-1-170).
        // 토양(soil-result-importer.js)에서 검증된 것과 같은 구조다 —
        // 연도 도장을 찍어 두고, 도장이 어긋난 캐시는 쓰지 않는다.
        this._cloudRecords = null;
        this._cloudUnavailable = false;
        this._cloudChecked = false;
        this._cloudYear = null;
        this._cloudGen = 0;
        /** @type {Array<string>} 이번 배치에서 겹친 접수번호 */
        this._dupNumbers = [];
        /** 부여할 수 있는 번호가 바닥났다 (안전 정수 경계) */
        this._numberingExhausted = false;

        // DOM 요소 (init에서 캐싱)
        this._els = {};
    }

    /**
     * DOM 요소 캐싱 및 이벤트 리스너 설정
     */
    init() {
        // DOM 요소 캐싱
        this._els = {
            input: document.getElementById('excelImportInput'),
            modal: document.getElementById('excelImportModal'),
            closeBtn: document.getElementById('closeExcelImportModal'),
            cancelBtn: document.getElementById('cancelExcelImportBtn'),
            nextBtn: document.getElementById('excelImportNextBtn'),
            prevBtn: document.getElementById('excelImportPrevBtn'),
            step1: document.getElementById('excelImportStep1'),
            step2: document.getElementById('excelImportStep2'),
            step3: document.getElementById('excelImportStep3'),
            mappingArea: document.getElementById('columnMappingArea'),
            previewHead: document.getElementById('previewTableHead'),
            previewBody: document.getElementById('previewTableBody'),
            previewSummary: document.getElementById('previewSummary'),
            warnings: document.getElementById('importWarnings'),
        };

        // 기본값: 오늘 날짜
        if (this.config.setDefaultDate !== false) {
            const importDateEl = document.getElementById('importDate');
            if (importDateEl) {
                importDateEl.valueAsDate = new Date();
            }
        }

        // 서식 다운로드 버튼
        this._bindDownloadButtons();

        // 파일 선택
        if (this._els.input) {
            this._els.input.addEventListener('change', (e) => this._handleFileSelect(e));
        }

        // 다음/가져오기 버튼
        if (this._els.nextBtn) {
            this._els.nextBtn.addEventListener('click', () => this._handleNext());
        }

        // 이전 버튼
        if (this._els.prevBtn) {
            this._els.prevBtn.addEventListener('click', () => this._handlePrev());
        }

        // 닫기/취소
        const closeHandler = () => this._closeModal();
        if (this._els.closeBtn) {
            this._els.closeBtn.addEventListener('click', closeHandler);
        }
        if (this._els.cancelBtn) {
            this._els.cancelBtn.addEventListener('click', closeHandler);
        }
        // 오버레이 클릭 닫기
        const overlay = this._els.modal?.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeHandler);
        }
    }

    // ========================================
    // 서식 다운로드
    // ========================================

    _bindDownloadButtons() {
        const handler = () => this._downloadTemplate();
        const navBtn = document.getElementById('downloadTemplateNavBtn');
        if (navBtn) navBtn.addEventListener('click', handler);
        const modalBtn = document.getElementById('downloadTemplateBtn');
        if (modalBtn) modalBtn.addEventListener('click', handler);
    }

    _downloadTemplate() {
        const tc = this.config.templateConfig;
        const wb = XLSX.utils.book_new();
        const wsData = [tc.headers, tc.sampleRow];
        const ws = XLSX.utils.aoa_to_sheet(sanitizeExcelAoa(wsData));
        ws['!cols'] = tc.colWidths;
        XLSX.utils.book_append_sheet(wb, ws, tc.sheetName);
        XLSX.writeFile(wb, tc.fileName + '.xlsx');
        showToast('서식 파일을 다운로드했습니다.', 'success');
    }

    // ========================================
    // 파일 선택 및 파싱
    // ========================================

    _handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                if (jsonData.length < 2) {
                    showToast('데이터가 없거나 헤더만 있습니다.', 'error');
                    return;
                }

                this._excelHeaders = jsonData[0].map(h => String(h).trim());
                this._excelData = jsonData.slice(1).filter(row =>
                    row.some(cell => cell !== '' && cell !== null && cell !== undefined)
                );

                if (this._excelData.length === 0) {
                    showToast('데이터 행이 없습니다.', 'error');
                    return;
                }

                // 대량 행 UI 프리즈 방지: 상한 초과 시 잘라내고 경고
                const MAX_IMPORT_ROWS = 5000;
                if (this._excelData.length > MAX_IMPORT_ROWS) {
                    showToast(`행이 너무 많습니다(${this._excelData.length}건). 처음 ${MAX_IMPORT_ROWS}건만 처리합니다.`, 'warning');
                    this._excelData = this._excelData.slice(0, MAX_IMPORT_ROWS);
                }

                // 자동 매핑 수행
                this._autoMap();

                // 모달 열기 (1단계)
                this._currentStep = 1;
                this._showStep(1);
                this._els.modal.classList.remove('hidden');
                // 클라우드는 **여는 순간 한 번만** 읽는다. 기다리지 않는다 —
                // 담당자가 컬럼을 맞추는 동안 도착하면 그때 판정에 반영된다.
                // ⚠️ **이전 세션의 확인 결과를 물려받지 않는다** (독립 리뷰 MAJOR).
                //    `_cloudChecked`가 true인 채로 남으면, 연도를 바꾸고 새 파일을 연 뒤
                //    조회가 끝나기 전에 눌러도 저장이 통과한다 — 새 연도의 클라우드를
                //    확인하지 않은 채로.
                this._cloudChecked = false;
                this._cloudUnavailable = false;
                this._cloudGen++;
                this._loadCloudRecords(this._cloudGen);

            } catch (err) {
                console.error('엑셀 파싱 오류:', err);
                showToast('엑셀 파일을 읽을 수 없습니다.', 'error');
            }
        };
        reader.readAsArrayBuffer(file);

        // input 초기화 (같은 파일 다시 선택 가능)
        this._els.input.value = '';
    }

    // ========================================
    // 자동 매핑
    // ========================================

    _autoMap() {
        this._columnMapping = {};
        const rules = this.config.autoMapRules;

        this._excelHeaders.forEach((header, idx) => {
            const normalizedHeader = header.replace(/\s+/g, '').toLowerCase();
            for (const [pattern, field] of Object.entries(rules)) {
                if (normalizedHeader === pattern.replace(/\s+/g, '').toLowerCase() ||
                    header === pattern) {
                    const alreadyMapped = Object.values(this._columnMapping).includes(field);
                    if (!alreadyMapped) {
                        this._columnMapping[idx] = field;
                    }
                    break;
                }
            }
        });
    }

    // ========================================
    // 단계 UI 전환
    // ========================================

    _showStep(step) {
        this._els.step1.classList.toggle('hidden', step !== 1);
        this._els.step2.classList.toggle('hidden', step !== 2);
        this._els.step3.classList.toggle('hidden', step !== 3);
        this._els.prevBtn.classList.toggle('hidden', step === 1);
        this._els.nextBtn.textContent = step === 3 ? '가져오기' : '다음';
    }

    // ========================================
    // 컬럼 매핑 UI
    // ========================================

    _renderColumnMapping() {
        const area = this._els.mappingArea;
        area.innerHTML = '';

        this._excelHeaders.forEach((header, idx) => {
            if (!header) return;

            const row = document.createElement('div');
            row.className = 'mapping-row' + (this._columnMapping[idx] ? ' mapped' : '');

            const sampleValue = this._excelData[0]?.[idx] ?? '';

            const safeHeader = window.escapeHTML(header);
            // ⚠️ `||`는 숫자 0을 빈 문자열로 바꿔 미리보기에서 값이 사라진다 (독립 리뷰 지적)
            const safeSampleValue = window.escapeHTML(String(sampleValue ?? ''));
            row.innerHTML = `
                <span class="mapping-excel-col" title="${window.escapeAttr(header)}">${safeHeader}</span>
                <span class="mapping-arrow">\u2192</span>
                <select class="mapping-select" data-col-idx="${idx}">
                    <option value="">-- 건너뛰기 --</option>
                    ${this.config.appFields.map(f =>
                        `<option value="${window.escapeAttr(f.key)}" ${this._columnMapping[idx] === f.key ? 'selected' : ''}>${window.escapeHTML(f.label)}</option>`
                    ).join('')}
                </select>
                <span class="mapping-sample" title="${window.escapeAttr(String(sampleValue ?? ''))}">예: ${safeSampleValue}</span>
            `;

            const select = row.querySelector('.mapping-select');
            select.addEventListener('change', (e) => {
                const colIdx = parseInt(e.target.dataset.colIdx, 10);
                const value = e.target.value;

                if (value) {
                    // 기존 매핑에서 같은 필드 제거 (중복 방지)
                    for (const [k, v] of Object.entries(this._columnMapping)) {
                        if (v === value && parseInt(k, 10) !== colIdx) {
                            delete this._columnMapping[k];
                            const otherSelect = area.querySelector(`select[data-col-idx="${k}"]`);
                            if (otherSelect) {
                                otherSelect.value = '';
                                otherSelect.closest('.mapping-row').classList.remove('mapped');
                            }
                        }
                    }
                    this._columnMapping[colIdx] = value;
                } else {
                    delete this._columnMapping[colIdx];
                }

                row.classList.toggle('mapped', !!value);
            });

            area.appendChild(row);
        });
    }

    // ========================================
    // 엑셀 날짜 파싱 (공통 유틸)
    // ========================================

    static parseExcelDate(val) {
        if (!val) return '';
        // 이미 문자열 날짜 형식
        if (typeof val === 'string' && val.match(/^\d{4}[-./]\d{1,2}[-./]\d{1,2}$/)) {
            return val.replace(/[./]/g, '-');
        }
        // 엑셀 시리얼 날짜 (숫자)
        if (typeof val === 'number' && val > 30000 && val < 100000) {
            const date = new Date((val - 25569) * 86400 * 1000);
            return date.toISOString().slice(0, 10);
        }
        return String(val);
    }

    // ========================================
    // 미리보기 빌드
    // ========================================

    _buildPreview() {
        const commonData = this.config.getCommonData();

        // 역매핑: 앱 필드 → 엑셀 컬럼 인덱스
        const fieldToCol = {};
        for (const [colIdx, field] of Object.entries(this._columnMapping)) {
            fieldToCol[field] = parseInt(colIdx, 10);
        }

        const warnings = [];
        this._parsedLogs = [];

        // getVal 유틸 함수
        const getVal = (row, field) => {
            if (fieldToCol[field] !== undefined) {
                const val = row[fieldToCol[field]];
                return val !== undefined && val !== null ? String(val).trim() : '';
            }
            return '';
        };

        // 각 행 처리
        this._excelData.forEach((row, rowIdx) => {
            const record = this.config.buildRecord(
                (field) => getVal(row, field),
                ExcelImportManager.parseExcelDate,
                commonData,
                rowIdx
            );

            // null 반환 시 건너뛰기 (buildRecord 내부에서 skip 결정)
            if (record === null) return;

            // skipRowCheck 콜백으로 경고/건너뛰기 처리
            if (this.config.skipRowCheck) {
                const warning = this.config.skipRowCheck(record, rowIdx);
                if (warning) {
                    warnings.push(warning);
                    return;
                }
            }

            this._parsedLogs.push(record);
        });

        // 레코드 빌드 후 추가 처리 (예: totalParcels 설정)
        if (this.config.postBuildRecords) {
            this.config.postBuildRecords(this._parsedLogs);
        }

        // 접수번호 자동 채번
        this._numberingExhausted = false;
        this._autoAssignReceptionNumbers();

        // 시트가 들고 온 번호가 이미 쓰이고 있는지 본다 (SAMPL-1-170)
        this._detectDuplicateNumbers();

        // 미리보기 테이블 렌더링
        this._renderPreview(warnings);
    }

    // ========================================
    // 접수번호 자동 채번
    // ========================================

    /** 이 가져오기가 붙어 있는 시료 매니저 (없으면 클라우드 확인을 건너뛴다) */
    _manager() {
        return this.config.manager || null;
    }

    /**
     * 클라우드 접수번호를 한 번 읽어 둔다 (SAMPL-1-170).
     * `fetchCloudReceptionRecords`는 `BaseSampleManager`에 있고 실패와 "0건"을
     * 구별해 돌려준다 — 그 구별이 이 검사의 전부다.
     */
    async _loadCloudRecords(gen) {
        const mgr = this._manager();
        if (!mgr || typeof mgr.fetchCloudReceptionRecords !== 'function') {
            if (gen === this._cloudGen) this._cloudChecked = true;
            return;
        }
        const year = mgr.selectedYear;
        let records = null;
        let unavailable = false;
        try {
            const res = await mgr.fetchCloudReceptionRecords(year);
            records = res.records || null;
            unavailable = !!res.unavailable;
        } catch (_) {
            unavailable = true;
        }
        // 낡은 응답을 버린다 — 다시 열었거나 연도가 바뀌었으면 이 응답은 남의 것이다
        if (gen !== this._cloudGen) return;
        if (String(mgr.selectedYear) !== String(year)) {
            this._cloudGen++;
            return this._loadCloudRecords(this._cloudGen);
        }
        this._cloudRecords = records;
        this._cloudUnavailable = unavailable;
        this._cloudChecked = true;
        this._cloudYear = year;
        // 3단계를 이미 보고 있으면 판정을 다시 해서 보여준다
        if (this._currentStep === 3) this._buildPreview();
    }

    /** 캐시가 현재 연도 것일 때만 쓴다 */
    _freshCloudRecords() {
        const mgr = this._manager();
        if (!Array.isArray(this._cloudRecords)) return [];
        if (!mgr || String(this._cloudYear) !== String(mgr.selectedYear)) return [];
        return this._cloudRecords;
    }

    /**
     * 접수번호 문자열을 **낱개 번호로 분해**한다 (SAMPL-1-170 독립 리뷰 MAJOR).
     *
     * ⚠️ 수질은 그룹 접수를 `"100, 101"`처럼 **쉼표로 이어 붙여** 저장한다
     *    (`water-script.js`의 `receptionNumbers.join(', ')`).
     *    통째로 비교하면 `101`이 이미 쓰이고 있는데도 겹침을 못 보고,
     *    `parseInt('100, 101')`은 100이 나와 최대값 계산도 틀린다.
     */
    _splitNumbers(value) {
        return String(value ?? '')
            .split(',')
            .map(v => v.trim())
            .filter(v => v !== '');
    }

    /**
     * 이미 쓰이고 있는 접수번호 집합 (로컬 + 클라우드).
     *
     * ⚠️ **표기 그대로 비교한다.** 본번으로 접으면 `5-1`이 `5`를 점유해
     *    뒤따르는 `5-2`가 중복으로 버려진다 (토양에서 SAMPL-1-154로 겪은 것).
     */
    _existingNumberSet() {
        const local = this.config.getExistingLogs ? (this.config.getExistingLogs() || []) : [];
        const set = new Set();
        for (const log of [...local, ...this._freshCloudRecords()]) {
            for (const n of this._splitNumbers(log?.receptionNumber)) set.add(n);
        }
        return set;
    }

    /**
     * 시트가 들고 온 접수번호가 이미 쓰이고 있는지 본다 (SAMPL-1-170).
     *
     * 예전에는 **아무 검사도 없었다** — 시트에 번호가 있으면 그대로 저장했고,
     * 이미 있는 번호와 겹쳐도 경고가 없었다. 접수번호는 분석결과 매칭 키라
     * 겹치면 어느 시료의 결과인지 확정할 수 없다.
     */
    _detectDuplicateNumbers() {
        const pool = this._existingNumberSet();
        const seen = new Set();
        const dups = [];
        for (const log of this._parsedLogs) {
            for (const n of this._splitNumbers(log?.receptionNumber)) {
                // 배치 안에서 같은 번호가 두 번 나오는 것도 중복이다
                if ((pool.has(n) || seen.has(n)) && !dups.includes(n)) dups.push(n);
                seen.add(n);
            }
        }
        this._dupNumbers = dups;
    }

    _autoAssignReceptionNumbers() {
        // ⚠️ **일부 행만 번호가 있는 시트를 그냥 두지 않는다** (독립 리뷰 MAJOR).
        //    예전에는 한 행이라도 번호가 있으면 곧바로 돌아가, 빈 행이 **접수번호 없이**
        //    저장됐다. 접수번호는 분석결과 매칭 키라 비어 있으면 그 시료의 결과를
        //    붙일 수 없다. 빈 행만 골라 겹치지 않는 번호를 준다.
        const blanks = this._parsedLogs.filter(l => String(l.receptionNumber ?? '').trim() === '');
        const hasReceptionNumbers = this._parsedLogs.some(l => String(l.receptionNumber ?? '').trim() !== '');
        if (hasReceptionNumbers) {
            if (blanks.length > 0) this._fillBlankReceptionNumbers(blanks);
            return;
        }

        // 기존 데이터에서 최대 번호 구하기
        const existingLogs = this.config.getExistingLogs ? this.config.getExistingLogs() : [];
        let maxNum = 0;

        const extractFn = this.config.autoNumberExtract;
        const filterFn = this.config.autoNumberFilter;

        existingLogs.forEach(log => {
            if (!log.receptionNumber) return;
            if (filterFn && !filterFn(log)) return;

            if (extractFn) {
                const n = extractFn(log);
                if (!isNaN(n) && n > maxNum) maxNum = n;
                return;
            }
            // 쉼표로 이어 붙인 그룹 접수(`"100, 101"`)를 통째로 parseInt하면 100이 나온다.
            // 아래 `_assignFrom`이 점유 번호를 다시 건너뛰므로 중복은 나지 않지만,
            // 한쪽만 통째로 보는 채로 두면 다음에 고치는 사람이 그 차이에 걸린다.
            for (const part of this._splitNumbers(log.receptionNumber)) {
                const n = parseInt(part, 10);
                if (!isNaN(n) && n > maxNum) maxNum = n;
            }
        });

        // ⚠️ **`max + 1`만으로는 부족하다.** `maxNum`은 로컬만 보므로 클라우드에
        //    더 큰 번호가 있으면 그대로 충돌한다 (SAMPL-1-170).
        //    이미 쓰인 번호를 실제로 건너뛰며 올린다.
        this._assignFrom(this._parsedLogs, maxNum + 1);
    }

    /** 번호가 비어 있는 행만 채운다 (일부 행만 번호가 있는 시트) */
    _fillBlankReceptionNumbers(blanks) {
        const local = this.config.getExistingLogs ? (this.config.getExistingLogs() || []) : [];
        const nums = [];
        for (const log of [...this._parsedLogs, ...local, ...this._freshCloudRecords()]) {
            for (const part of this._splitNumbers(log?.receptionNumber)) {
                const n = parseInt(part, 10);
                if (Number.isFinite(n)) nums.push(n);
            }
        }
        this._assignFrom(blanks, (nums.length ? Math.max(...nums) : 0) + 1);
    }

    /**
     * `start`부터 **이미 쓰인 번호를 건너뛰며** 차례로 부여한다.
     *
     * ⚠️ `max + 1`만으로는 부족하다. `maxNum`은 로컬만 보므로 클라우드에 더 큰 번호가
     *    있으면 그대로 충돌한다 (SAMPL-1-170).
     */
    _assignFrom(targets, start) {
        const pool = this._existingNumberSet();
        let candidate = start;
        for (const l of targets) {
            // 안전 정수 범위를 벗어나면 `candidate++`가 제자리에 머물러 무한히 돈다.
            while (pool.has(String(candidate))) {
                if (!Number.isSafeInteger(candidate + 1)) { candidate = null; break; }
                candidate++;
            }
            // ⚠️ **쓸 수 있는 번호가 없으면 아무것도 부여하지 않고 멈춘다.**
            //    경계에서 그냥 빠져나가면 **이미 쓰이고 있는 번호를 그대로 부여**한다 —
            //    무한 루프는 막았지만 중복을 만드는 셈이다 (독립 리뷰 🟡).
            //    커밋 쪽이 이 표시를 보고 저장을 막는다.
            if (candidate === null || !Number.isSafeInteger(candidate)) {
                this._numberingExhausted = true;
                return;
            }
            l.receptionNumber = String(candidate);
            pool.add(String(candidate));
            candidate++;
        }
    }

    // ========================================
    // 미리보기 테이블 렌더링
    // ========================================

    _renderPreview(warnings) {
        // ⚠️ 확인하지 못했다는 사실을 조용히 넘기지 않는다 — 그러면 담당자는
        //    "겹침 없음"과 "확인 못 함"을 구별할 수 없다 (SAMPL-1-170).
        let summary = `총 ${this._parsedLogs.length}건의 데이터를 가져옵니다.`;
        if (this._dupNumbers.length > 0) {
            const shown = this._dupNumbers.slice(0, 5).join(', ');
            const more = this._dupNumbers.length > 5 ? ` 외 ${this._dupNumbers.length - 5}종` : '';
            summary += `  ⚠️ 접수번호 ${shown}${more}이(가) 이미 쓰이고 있습니다.`;
        } else if (this._cloudUnavailable) {
            summary += '  ☁️ 클라우드를 확인하지 못했습니다 — 이 컴퓨터의 기록만 검사했습니다.';
        }
        this._els.previewSummary.textContent = summary;

        // 헤더
        const cols = this.config.previewColumns;
        this._els.previewHead.innerHTML = '<tr>' +
            cols.map(c => `<th>${window.escapeHTML(c.label)}</th>`).join('') +
            '</tr>';

        // 본문
        const renderCell = this.config.renderPreviewCell;
        this._els.previewBody.innerHTML = this._parsedLogs.map(l => {
            const cells = cols.map(c => {
                if (renderCell) {
                    const custom = renderCell(l, c.key);
                    if (custom !== undefined) return '<td>' + window.escapeHTML(String(custom)) + '</td>';
                }
                const val = l[c.key];
                return `<td>${window.escapeHTML(val !== undefined && val !== null ? String(val) : '')}</td>`;
            }).join('');
            return `<tr>${cells}</tr>`;
        }).join('');

        // 경고
        if (warnings.length > 0) {
            this._els.warnings.textContent = warnings.join('\n');
            this._els.warnings.classList.remove('hidden');
        } else {
            this._els.warnings.classList.add('hidden');
        }
    }

    // ========================================
    // 다음/가져오기 버튼 핸들러
    // ========================================

    _handleNext() {
        if (this._currentStep === 1) {
            // Step1 유효성 검증
            if (this.config.validateStep1) {
                const result = this.config.validateStep1();
                if (!result.valid) {
                    showToast(result.message || '입력값을 확인하세요.', 'error');
                    return;
                }
            } else {
                // 기본 검증: 접수일자
                const importDate = document.getElementById('importDate')?.value;
                if (!importDate) {
                    showToast('접수일자를 입력하세요.', 'error');
                    return;
                }
            }

            this._currentStep = 2;
            this._renderColumnMapping();
            this._showStep(2);

        } else if (this._currentStep === 2) {
            if (Object.keys(this._columnMapping).length === 0) {
                showToast('최소 1개의 컬럼을 매핑하세요.', 'error');
                return;
            }

            this._currentStep = 3;
            this._buildPreview();
            this._showStep(3);

        } else if (this._currentStep === 3) {
            if (this._parsedLogs.length === 0) {
                showToast('가져올 데이터가 없습니다.', 'error');
                return;
            }

            // ⚠️ **겹치는 번호를 저장하지 않는다** (SAMPL-1-170).
            //    이 가져오기에는 토양 같은 "건너뛰기/덮어쓰기" 선택이 없다.
            //    여기서 통과시키면 담당자가 아무것도 모른 채 중복이 들어간다.
            //    접수번호를 비워 두면 자동부여가 겹치지 않는 번호를 준다.
            if (this._numberingExhausted) {
                showToast('부여할 수 있는 접수번호가 없습니다. 시트의 접수번호를 확인해 주세요.', 'error');
                return;
            }

            if (this._dupNumbers.length > 0) {
                showToast(
                    `접수번호 ${this._dupNumbers.slice(0, 5).join(', ')}이(가) 이미 쓰이고 있습니다. ` +
                    '시트의 번호를 고치거나 접수번호 열을 비워 자동부여로 가져오세요.',
                    'error'
                );
                return;
            }

            // 클라우드를 아직 읽는 중이면 판정이 끝나지 않았다. Firebase를 쓰지 않거나
            // 확인에 실패한 경우는 `_cloudChecked`가 true로 끝나므로 여기 걸리지 않는다
            // (오프라인 우선 — 확인 실패가 가져오기를 막지는 않는다).
            if (!this._cloudChecked) {
                showToast('클라우드 접수번호를 확인하는 중입니다. 잠시 후 다시 눌러 주세요.', 'warning');
                return;
            }

            // 가져오기 완료 콜백
            this.config.onImportComplete(this._parsedLogs);

            // 모달 닫기
            this._els.modal.classList.add('hidden');

            showToast(`${this._parsedLogs.length}건의 데이터를 가져왔습니다.`, 'success');

            // 상태 초기화
            this._reset();
        }
    }

    // ========================================
    // 이전 버튼 핸들러
    // ========================================

    _handlePrev() {
        if (this._currentStep === 2) {
            this._currentStep = 1;
            this._showStep(1);
        } else if (this._currentStep === 3) {
            this._currentStep = 2;
            this._showStep(2);
        }
    }

    // ========================================
    // 모달 닫기
    // ========================================

    _closeModal() {
        this._els.modal.classList.add('hidden');
        this._currentStep = 1;
        this._showStep(1);
    }

    // ========================================
    // 상태 초기화
    // ========================================

    _reset() {
        this._parsedLogs = [];
        this._dupNumbers = [];
        this._excelData = [];
        this._excelHeaders = [];
        this._columnMapping = {};
    }
}

window.ExcelImportManager = ExcelImportManager;
