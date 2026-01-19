/**
 * @fileoverview 네트워크 기반 Firebase 접근 제어 모듈
 * @description 관리자 IP 및 허용된 네트워크에서만 Firebase 접근 허용
 */

const NetworkAccess = {
    // localStorage 키
    STORAGE_KEY: 'networkAccessConfig',

    // 기본 설정
    defaultConfig: {
        // 관리자 IP (항상 허용)
        adminIPs: [],
        // 허용된 IP 대역 (예: '192.168.1.')
        allowedIPRanges: [],
        // 허용된 정확한 IP
        allowedExactIPs: [],
        // 네트워크 체크 활성화 여부
        enabled: false,
        // IP 조회 타임아웃 (ms)
        timeout: 5000
    },

    // 현재 IP 캐시
    _currentIP: null,
    _lastCheck: null,
    _cacheTimeout: 60000, // 1분간 캐시

    /**
     * 설정 로드
     * @returns {Object}
     */
    loadConfig() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return { ...this.defaultConfig, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('[NetworkAccess] 설정 로드 실패:', e);
        }
        return { ...this.defaultConfig };
    },

    /**
     * 설정 저장
     * @param {Object} config
     */
    saveConfig(config) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
            console.log('[NetworkAccess] 설정 저장됨:', config);
        } catch (e) {
            console.error('[NetworkAccess] 설정 저장 실패:', e);
        }
    },

    /**
     * 현재 공인 IP 조회
     * @returns {Promise<string|null>}
     */
    async getCurrentIP() {
        // 캐시된 IP가 있고 유효하면 반환
        if (this._currentIP && this._lastCheck) {
            const elapsed = Date.now() - this._lastCheck;
            if (elapsed < this._cacheTimeout) {
                return this._currentIP;
            }
        }

        const config = this.loadConfig();

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch('https://api.ipify.org?format=json', {
                signal: controller.signal
            });
            clearTimeout(timeout);

            const data = await response.json();
            this._currentIP = data.ip;
            this._lastCheck = Date.now();

            console.log('[NetworkAccess] 현재 IP:', this._currentIP);
            return this._currentIP;

        } catch (error) {
            console.warn('[NetworkAccess] IP 조회 실패:', error.message);
            return null;
        }
    },

    /**
     * 현재 IP가 허용된 네트워크인지 확인
     * @returns {Promise<{allowed: boolean, reason: string, ip: string|null}>}
     */
    async checkAccess() {
        const config = this.loadConfig();

        // 네트워크 체크가 비활성화된 경우 항상 허용
        if (!config.enabled) {
            return { allowed: true, reason: '네트워크 체크 비활성화', ip: null };
        }

        // Electron 앱에서 file:// 프로토콜인 경우 (로컬 실행)
        if (window.location.protocol === 'file:') {
            return { allowed: true, reason: 'Electron 로컬 실행', ip: null };
        }

        const currentIP = await this.getCurrentIP();

        if (!currentIP) {
            return { allowed: false, reason: 'IP 확인 불가', ip: null };
        }

        // 관리자 IP 체크
        if (config.adminIPs.includes(currentIP)) {
            return { allowed: true, reason: '관리자 IP', ip: currentIP };
        }

        // 정확한 IP 매칭
        if (config.allowedExactIPs.includes(currentIP)) {
            return { allowed: true, reason: '허용된 IP', ip: currentIP };
        }

        // IP 대역 매칭
        for (const range of config.allowedIPRanges) {
            if (currentIP.startsWith(range)) {
                return { allowed: true, reason: `허용된 대역 (${range})`, ip: currentIP };
            }
        }

        return { allowed: false, reason: '허용되지 않은 네트워크', ip: currentIP };
    },

    /**
     * Firebase 접근 허용 여부 (간단 버전)
     * @returns {Promise<boolean>}
     */
    async isAllowed() {
        const result = await this.checkAccess();
        return result.allowed;
    },

    // ========================================
    // 관리자 설정 함수들
    // ========================================

    /**
     * 네트워크 체크 활성화/비활성화
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        const config = this.loadConfig();
        config.enabled = enabled;
        this.saveConfig(config);
    },

    /**
     * 관리자 IP 추가
     * @param {string} ip
     */
    addAdminIP(ip) {
        const config = this.loadConfig();
        if (!config.adminIPs.includes(ip)) {
            config.adminIPs.push(ip);
            this.saveConfig(config);
        }
    },

    /**
     * 관리자 IP 제거
     * @param {string} ip
     */
    removeAdminIP(ip) {
        const config = this.loadConfig();
        config.adminIPs = config.adminIPs.filter(i => i !== ip);
        this.saveConfig(config);
    },

    /**
     * 허용된 IP 추가
     * @param {string} ip
     */
    addAllowedIP(ip) {
        const config = this.loadConfig();
        if (!config.allowedExactIPs.includes(ip)) {
            config.allowedExactIPs.push(ip);
            this.saveConfig(config);
        }
    },

    /**
     * 허용된 IP 제거
     * @param {string} ip
     */
    removeAllowedIP(ip) {
        const config = this.loadConfig();
        config.allowedExactIPs = config.allowedExactIPs.filter(i => i !== ip);
        this.saveConfig(config);
    },

    /**
     * 허용된 IP 대역 추가
     * @param {string} range (예: '192.168.1.')
     */
    addAllowedRange(range) {
        const config = this.loadConfig();
        if (!config.allowedIPRanges.includes(range)) {
            config.allowedIPRanges.push(range);
            this.saveConfig(config);
        }
    },

    /**
     * 허용된 IP 대역 제거
     * @param {string} range
     */
    removeAllowedRange(range) {
        const config = this.loadConfig();
        config.allowedIPRanges = config.allowedIPRanges.filter(r => r !== range);
        this.saveConfig(config);
    },

    /**
     * 현재 IP를 관리자로 등록
     * @returns {Promise<string|null>} 등록된 IP
     */
    async registerCurrentAsAdmin() {
        const ip = await this.getCurrentIP();
        if (ip) {
            this.addAdminIP(ip);
            return ip;
        }
        return null;
    },

    /**
     * 현재 IP를 허용 목록에 추가
     * @returns {Promise<string|null>} 등록된 IP
     */
    async registerCurrentAsAllowed() {
        const ip = await this.getCurrentIP();
        if (ip) {
            this.addAllowedIP(ip);
            return ip;
        }
        return null;
    },

    /**
     * 설정 초기화
     */
    resetConfig() {
        localStorage.removeItem(this.STORAGE_KEY);
        this._currentIP = null;
        this._lastCheck = null;
        console.log('[NetworkAccess] 설정 초기화됨');
    },

    /**
     * 현재 설정 상태 출력 (디버그용)
     */
    async printStatus() {
        const config = this.loadConfig();
        const currentIP = await this.getCurrentIP();
        const access = await this.checkAccess();

        console.log('========================================');
        console.log('[NetworkAccess] 현재 상태');
        console.log('========================================');
        console.log('네트워크 체크 활성화:', config.enabled);
        console.log('현재 IP:', currentIP);
        console.log('접근 허용:', access.allowed, `(${access.reason})`);
        console.log('관리자 IP 목록:', config.adminIPs);
        console.log('허용된 IP 목록:', config.allowedExactIPs);
        console.log('허용된 IP 대역:', config.allowedIPRanges);
        console.log('========================================');

        return { config, currentIP, access };
    }
};

// 전역으로 내보내기
window.NetworkAccess = NetworkAccess;

// 콘솔에서 쉽게 사용할 수 있도록 단축 명령어 제공
console.log('[NetworkAccess] 모듈 로드됨. 콘솔에서 다음 명령어 사용 가능:');
console.log('  NetworkAccess.printStatus() - 현재 상태 확인');
console.log('  NetworkAccess.registerCurrentAsAdmin() - 현재 IP를 관리자로 등록');
console.log('  NetworkAccess.setEnabled(true) - 네트워크 체크 활성화');
