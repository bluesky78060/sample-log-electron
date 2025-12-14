// ========================================
// 공통 Toast 알림 모듈
// ========================================
(function() {
    'use strict';

    /**
     * Toast 알림 표시
     * @param {string} message - 표시할 메시지
     * @param {string} type - 타입 (success, error, warning, info)
     * @param {number} duration - 표시 시간 (ms), 기본값 3000
     */
    function showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.warn('Toast container not found');
            return;
        }

        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.success}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // 지정된 시간 후 자동 제거
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // 전역으로 내보내기
    window.showToast = showToast;
})();
