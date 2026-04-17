/**
 * Shared modal state manager.
 * Prevents body scroll lock conflicts when multiple modals are opened/closed.
 */
(function () {
    'use strict';

    const openModals = new Set();
    const modalStack = [];
    const previousFocusMap = new WeakMap();
    const focusableSelector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function syncBodyScroll() {
        document.body.style.overflow = openModals.size > 0 ? 'hidden' : 'auto';
    }

    function notifyModalStateChange() {
        document.dispatchEvent(new CustomEvent('modal-statechange', {
            detail: { openCount: openModals.size }
        }));
    }

    function getTopModal() {
        return modalStack.length ? modalStack[modalStack.length - 1] : null;
    }

    function getFocusableElements(modalEl) {
        if (!modalEl) return [];
        return Array.from(modalEl.querySelectorAll(focusableSelector)).filter((el) => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });
    }

    function focusInsideModal(modalEl) {
        const focusable = getFocusableElements(modalEl);
        if (focusable.length > 0) {
            focusable[0].focus();
            return;
        }
        modalEl.setAttribute('tabindex', '-1');
        modalEl.focus();
    }

    function setModalA11yState(modalEl, isOpen) {
        modalEl.setAttribute('role', 'dialog');
        modalEl.setAttribute('aria-modal', 'true');
        modalEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    }

    function onDocumentKeydown(e) {
        if (e.key !== 'Tab') return;
        const modalEl = getTopModal();
        if (!modalEl) return;

        const focusable = getFocusableElements(modalEl);
        if (focusable.length === 0) {
            e.preventDefault();
            modalEl.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
            return;
        }

        if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function showModal(modalEl) {
        if (!modalEl) return;
        previousFocusMap.set(modalEl, document.activeElement instanceof HTMLElement ? document.activeElement : null);
        modalEl.classList.add('show');
        openModals.add(modalEl);
        setModalA11yState(modalEl, true);
        const currentIdx = modalStack.indexOf(modalEl);
        if (currentIdx !== -1) modalStack.splice(currentIdx, 1);
        modalStack.push(modalEl);
        syncBodyScroll();
        notifyModalStateChange();
        setTimeout(() => focusInsideModal(modalEl), 0);
    }

    function hideModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.remove('show');
        openModals.delete(modalEl);
        setModalA11yState(modalEl, false);
        const currentIdx = modalStack.indexOf(modalEl);
        if (currentIdx !== -1) modalStack.splice(currentIdx, 1);
        syncBodyScroll();
        notifyModalStateChange();

        const previousFocus = previousFocusMap.get(modalEl);
        if (previousFocus && document.contains(previousFocus)) {
            previousFocus.focus();
        }
    }

    function resync() {
        openModals.clear();
        modalStack.length = 0;
        document.querySelectorAll('.modal').forEach((modalEl) => {
            setModalA11yState(modalEl, modalEl.classList.contains('show'));
        });
        document.querySelectorAll('.modal.show').forEach((modalEl) => {
            openModals.add(modalEl);
            modalStack.push(modalEl);
        });
        syncBodyScroll();
        notifyModalStateChange();
    }

    document.addEventListener('keydown', onDocumentKeydown);
    resync();

    window.modalManager = {
        showModal,
        hideModal,
        resync
    };
})();
