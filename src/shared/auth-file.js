/**
 * @fileoverview Firebase 인증 파일 관리 모듈
 * @description 인증 파일(.key)을 통한 Firebase 접근 제어
 */

const AuthFile = {
    // 인증 키 (이 값과 파일 내용이 일치해야 함)
    VALID_AUTH_KEY: 'BONGHWA-SAMPLE-LOG-2024-FIREBASE-AUTH',

    // 인증 파일명
    AUTH_FILE_NAME: 'firebase-auth.key',

    // 캐시
    _isAuthenticated: null,
    _authChecked: false,

    /**
     * Electron 환경인지 확인
     * @returns {boolean}
     */
    isElectron() {
        return window.electronAPI?.isElectron === true;
    },

    /**
     * 인증 파일 존재 및 유효성 확인
     * @returns {Promise<{valid: boolean, reason: string}>}
     */
    async checkAuthFile() {
        // 이미 체크한 경우 캐시 반환
        if (this._authChecked) {
            return {
                valid: this._isAuthenticated,
                reason: this._isAuthenticated ? '인증됨 (캐시)' : '미인증 (캐시)'
            };
        }

        // 웹 환경에서는 인증 파일 체크 불가 - 네트워크 체크로 대체
        if (!this.isElectron()) {
            console.log('[AuthFile] 웹 환경 - 인증 파일 체크 건너뜀');
            return { valid: true, reason: '웹 환경 (네트워크 체크 사용)' };
        }

        try {
            // Electron API를 통해 인증 파일 읽기
            if (!window.electronAPI?.readAuthFile) {
                console.warn('[AuthFile] readAuthFile API 없음');
                return { valid: false, reason: 'API 미지원' };
            }

            const result = await window.electronAPI.readAuthFile();

            if (!result.exists) {
                console.log('[AuthFile] 인증 파일 없음');
                this._isAuthenticated = false;
                this._authChecked = true;
                return { valid: false, reason: '인증 파일 없음' };
            }

            // 파일 내용 검증
            const content = result.content?.trim();
            if (content === this.VALID_AUTH_KEY) {
                console.log('[AuthFile] 인증 성공');
                this._isAuthenticated = true;
                this._authChecked = true;
                return { valid: true, reason: '인증 파일 유효' };
            } else {
                console.warn('[AuthFile] 인증 파일 내용 불일치');
                this._isAuthenticated = false;
                this._authChecked = true;
                return { valid: false, reason: '인증 파일 내용 불일치' };
            }

        } catch (error) {
            console.error('[AuthFile] 인증 파일 확인 실패:', error);
            this._isAuthenticated = false;
            this._authChecked = true;
            return { valid: false, reason: '파일 읽기 오류: ' + error.message };
        }
    },

    /**
     * 인증 파일 저장 (설정 페이지에서 업로드 시)
     * @param {string} content - 파일 내용
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async saveAuthFile(content) {
        if (!this.isElectron()) {
            return { success: false, message: '웹 환경에서는 저장할 수 없습니다' };
        }

        try {
            if (!window.electronAPI?.saveAuthFile) {
                return { success: false, message: 'API 미지원' };
            }

            // 파일 내용 검증
            const trimmedContent = content?.trim();
            if (trimmedContent !== this.VALID_AUTH_KEY) {
                return { success: false, message: '유효하지 않은 인증 파일입니다' };
            }

            const result = await window.electronAPI.saveAuthFile(trimmedContent);

            if (result.success) {
                // 캐시 업데이트
                this._isAuthenticated = true;
                this._authChecked = true;
                return { success: true, message: '인증 파일이 저장되었습니다' };
            } else {
                return { success: false, message: result.error || '저장 실패' };
            }

        } catch (error) {
            console.error('[AuthFile] 인증 파일 저장 실패:', error);
            return { success: false, message: '저장 오류: ' + error.message };
        }
    },

    /**
     * 인증 파일 삭제
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async deleteAuthFile() {
        if (!this.isElectron()) {
            return { success: false, message: '웹 환경에서는 삭제할 수 없습니다' };
        }

        try {
            if (!window.electronAPI?.deleteAuthFile) {
                return { success: false, message: 'API 미지원' };
            }

            const result = await window.electronAPI.deleteAuthFile();

            if (result.success) {
                // 캐시 초기화
                this._isAuthenticated = false;
                this._authChecked = true;
                return { success: true, message: '인증 파일이 삭제되었습니다' };
            } else {
                return { success: false, message: result.error || '삭제 실패' };
            }

        } catch (error) {
            console.error('[AuthFile] 인증 파일 삭제 실패:', error);
            return { success: false, message: '삭제 오류: ' + error.message };
        }
    },

    /**
     * 인증 상태 확인 (간단 버전)
     * @returns {Promise<boolean>}
     */
    async isAuthenticated() {
        const result = await this.checkAuthFile();
        return result.valid;
    },

    /**
     * 캐시 초기화 (재검증 필요 시)
     */
    resetCache() {
        this._isAuthenticated = null;
        this._authChecked = false;
    },

    /**
     * 인증 파일 생성 (관리자용)
     * 이 함수를 콘솔에서 실행하면 인증 파일 내용을 얻을 수 있음
     */
    generateAuthFileContent() {
        console.log('='.repeat(50));
        console.log('Firebase 인증 파일 내용');
        console.log('='.repeat(50));
        console.log(this.VALID_AUTH_KEY);
        console.log('='.repeat(50));
        console.log('위 내용을 firebase-auth.key 파일로 저장하세요.');
        return this.VALID_AUTH_KEY;
    }
};

// 전역으로 내보내기
window.AuthFile = AuthFile;

console.log('[AuthFile] 모듈 로드됨');
console.log('  AuthFile.generateAuthFileContent() - 인증 파일 내용 생성');
