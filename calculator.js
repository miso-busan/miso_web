/**
 * 대출 계산기 JavaScript
 * Loan Calculator Functionality
 */

(function() {
    'use strict';

    // DOM 요소
    const modal = document.getElementById('loanCalculatorModal');
    const openBtn = document.getElementById('loanCalculatorBtn');
    const closeBtn = document.getElementById('closeCalculator');
    const calculateBtn = document.getElementById('calculateBtn');

    // Input 요소
    const loanAmountInput = document.getElementById('loanAmount');
    const loanAmountRange = document.getElementById('loanAmountRange');
    const interestRateInput = document.getElementById('interestRate');
    const interestRateRange = document.getElementById('interestRateRange');
    const loanPeriodInput = document.getElementById('loanPeriod');
    const loanPeriodRange = document.getElementById('loanPeriodRange');
    const repaymentMethod = document.getElementById('repaymentMethod');

    // Result 요소
    const resultDiv = document.getElementById('calculatorResult');
    const monthlyPaymentSpan = document.getElementById('monthlyPayment');
    const totalPaymentSpan = document.getElementById('totalPayment');
    const totalInterestSpan = document.getElementById('totalInterest');

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

    // 모달 열기
    function openModal() {
        showModal(modal);
    }

    // 모달 닫기
    function closeModal() {
        hideModal(modal);
    }

    // 이벤트 리스너
    if (openBtn) {
        openBtn.addEventListener('click', openModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // 모달 외부 클릭 시 닫기
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // ── 대출금액: text input 콤마 포맷 ──────────────────────────
    function formatAmount(val) {
        const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10);
        return Number.isFinite(num) ? num.toLocaleString('ko-KR') : '';
    }

    function parseAmount(str) {
        return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0;
    }

    if (loanAmountInput && loanAmountRange) {
        // text input → range
        loanAmountInput.addEventListener('input', function () {
            const pos = this.selectionStart;
            const raw = parseAmount(this.value);
            const formatted = formatAmount(raw);
            this.value = formatted;
            // 커서를 끝으로 (간단 처리)
            try { this.setSelectionRange(formatted.length, formatted.length); } catch(e) {}
            loanAmountRange.value = raw;
        });

        // range → text input
        loanAmountRange.addEventListener('input', function () {
            loanAmountInput.value = formatAmount(this.value);
        });

        // 초기값 포맷 적용
        loanAmountInput.value = formatAmount(loanAmountInput.value);
    }

    // ── 금리 / 기간 range ↔ input 동기화 ────────────────────────
    function syncNumericInputs(input, range) {
        if (!input || !range) return;
        input.addEventListener('input', function () { range.value = this.value; });
        range.addEventListener('input', function () { input.value = this.value; });
    }

    syncNumericInputs(interestRateInput, interestRateRange);

    if (loanPeriodInput && loanPeriodRange) {
        // 기본값 60개월
        loanPeriodInput.value = 60;
        loanPeriodRange.value = 60;
        syncNumericInputs(loanPeriodInput, loanPeriodRange);
    }

    // 호환용 빈 함수
    function updateInputDisplay() {}


    // 숫자 포맷팅 (천 단위 구분 쉼표)
    function formatNumber(num) {
        return Math.round(num).toLocaleString('ko-KR');
    }

    // 대출 계산 함수
    function calculateLoan() {
        // 입력값 가져오기 (대출금액은 콤마 포함 text이므로 파싱)
        const principal = parseAmount(loanAmountInput.value);
        const annualRate = parseFloat(interestRateInput.value);
        const months = parseInt(loanPeriodInput.value, 10);
        const method = repaymentMethod.value;

        if (!Number.isFinite(principal) || !Number.isFinite(annualRate) || !Number.isFinite(months) || months <= 0) {
            return;
        }

        // 월 이자율
        const monthlyRate = annualRate / 100 / 12;

        let monthlyPayment = 0;
        let totalPayment = 0;
        let totalInterest = 0;

        if (method === 'equal-principal-interest') {
            // 원리금균등상환
            if (monthlyRate === 0) {
                monthlyPayment = principal / months;
            } else {
                monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                                (Math.pow(1 + monthlyRate, months) - 1);
            }
            totalPayment = monthlyPayment * months;
            totalInterest = totalPayment - principal;

        } else if (method === 'equal-principal') {
            // 원금균등상환
            const principalPayment = principal / months;
            totalInterest = 0;
            
            for (let i = 1; i <= months; i++) {
                const remainingPrincipal = principal - (principalPayment * (i - 1));
                const interestPayment = remainingPrincipal * monthlyRate;
                totalInterest += interestPayment;
            }
            
            // 첫 달 상환금액 (가장 큼)
            monthlyPayment = principalPayment + (principal * monthlyRate);
            totalPayment = principal + totalInterest;

        } else if (method === 'maturity') {
            // 만기일시상환
            const monthlyInterest = principal * monthlyRate;
            monthlyPayment = monthlyInterest;
            totalInterest = monthlyInterest * months;
            totalPayment = principal + totalInterest;
        }

        // 결과 표시
        displayResults(monthlyPayment, totalPayment, totalInterest, method);
    }

    // 결과 표시 함수
    function displayResults(monthly, total, interest, method) {
        // 원금균등상환의 경우 월 상환금액이 변동됨을 표시
        let monthlyText = formatNumber(monthly) + ' 원';
        if (method === 'equal-principal') {
            monthlyText = formatNumber(monthly) + ' 원 (첫 달, 매월 감소)';
        } else if (method === 'maturity') {
            monthlyText = formatNumber(monthly) + ' 원 (이자만, 만기 시 원금 상환)';
        }

        monthlyPaymentSpan.textContent = monthlyText;
        totalPaymentSpan.textContent = formatNumber(total) + ' 원';
        totalInterestSpan.textContent = formatNumber(interest) + ' 원';

        // 결과 영역 표시
        resultDiv.classList.remove('is-hidden');

        // 부드러운 스크롤
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // 계산 버튼 클릭
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            calculateLoan();
        });
    }

    // 엔터 키로 계산
    const inputs = [loanAmountInput, interestRateInput, loanPeriodInput].filter(Boolean);
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                calculateLoan();
            }
        });
    });

    // 페이지 로드 시 초기 계산 (선택사항)
    // calculateLoan();

})();
