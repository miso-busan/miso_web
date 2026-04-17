/**
 * Consult Modal & Location Functions
 * 상담문의 모달 및 지점찾기 기능
 */

(function () {
    'use strict';

    // DOM 요소
    const consultModal = document.getElementById('consultModal');
    const consultBtn = document.getElementById('consultBtn');
    const locationBtn = document.getElementById('locationBtn');
    const closeConsultBtns = document.querySelectorAll('[data-consult-close], #closeConsultModal');

    function showModal(targetModal) {
        if (!targetModal) return;
        if (window.modalManager && typeof window.modalManager.showModal === 'function') {
            window.modalManager.showModal(targetModal);
            return;
        }
        targetModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function hideModal(targetModal) {
        if (!targetModal) return;
        if (window.modalManager && typeof window.modalManager.hideModal === 'function') {
            window.modalManager.hideModal(targetModal);
            return;
        }
        targetModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }

    // 상담문의 모달 열기
    function openConsultModal() {
        if (typeof window.openChatbotModal === 'function') {
            window.openChatbotModal();
        } else {
            showModal(consultModal);
        }
    }

    // 상담문의 모달 닫기
    function closeConsultModal() {
        hideModal(consultModal);
    }

    // 지점찾기 - 네이버 지도로 이동
    function openNaverMap() {
        // 사단법인 미소금융부산중구법인 주소: 부산 중구 대청로 56
        const address = encodeURIComponent('부산 중구 대청로 56');

        // 네이버 지도 검색 URL
        const naverMapUrl = `https://map.naver.com/v5/search/${address}`;

        // 새 창으로 열기
        window.open(naverMapUrl, '_blank');
    }

    // 이벤트 리스너
    if (consultBtn) {
        consultBtn.addEventListener('click', openConsultModal);
    }

    if (closeConsultBtns.length) {
        closeConsultBtns.forEach(function (closeBtn) {
            closeBtn.addEventListener('click', closeConsultModal);
            if (closeBtn.tagName !== 'BUTTON') {
                closeBtn.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        closeConsultModal();
                    }
                });
            }
        });
    }

    if (locationBtn) {
        locationBtn.addEventListener('click', openNaverMap);
    }

    // 모달 외부 클릭 시 닫기
    if (consultModal) {
        consultModal.addEventListener('click', function (e) {
            if (e.target === consultModal) {
                closeConsultModal();
            }
        });
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && consultModal && consultModal.classList.contains('show')) {
            closeConsultModal();
        }
    });

})();
