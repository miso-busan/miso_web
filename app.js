// Navigation & UI Script
function openManagedModal(modalEl) {
    if (!modalEl) return;
    if (window.modalManager && typeof window.modalManager.showModal === 'function') {
        window.modalManager.showModal(modalEl);
        return;
    }
    modalEl.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeManagedModal(modalEl) {
    if (!modalEl) return;
    if (window.modalManager && typeof window.modalManager.hideModal === 'function') {
        window.modalManager.hideModal(modalEl);
        return;
    }
    modalEl.classList.remove('show');
    document.body.style.overflow = 'auto';
}


document.addEventListener('DOMContentLoaded', () => {
    // Header & Mobile Menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');
    const nav = document.querySelector('.nav');
    const navList = document.querySelector('.nav-list');
    const header = document.getElementById('header');
    const chatbotNavLink = document.getElementById('chatbotNavLink');
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const searchBtn = document.querySelector('.search-btn');
    const searchModal = document.getElementById('siteSearchModal');
    const searchForm = document.getElementById('siteSearchForm');
    const searchInput = document.getElementById('siteSearchInput');
    const searchResults = document.getElementById('siteSearchResults');
    const closeSearchModalBtn = document.getElementById('closeSearchModal');
    const searchKeywordBtns = document.querySelectorAll('.search-keyword-btn');
    const financeGuideBtn = document.getElementById('financeGuideBtn');
    const financeGuideModal = document.getElementById('financeGuideModal');
    const closeFinanceGuideBtn = document.getElementById('closeFinanceGuide');
    const dropdownItems = document.querySelectorAll('.nav-list .has-dropdown');
    const quickMenu = document.querySelector('.quick-menu');
    const heroSection = document.getElementById('hero');
    const heroVideo = document.querySelector('.hero-video');
    const mobileNavMq = window.matchMedia('(max-width: 960px)');
    const quickMenuMq = window.matchMedia('(max-width: 768px)');
    const reduceMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');

    // ── 사회연대금융 팝업 ──────────────────────────────────────────
    const sfPopupEl = document.getElementById('socialFinancePopup');
    const sfPopupCloseBtn = document.getElementById('sfPopupClose');
    const sfPopupNoShow = document.getElementById('sfPopupNoShowToday');

    const SF_POPUP_STORAGE_KEY = 'miso-sf-popup-hidden-date';

    const getSfPopupHiddenDate = () => {
        try { return localStorage.getItem(SF_POPUP_STORAGE_KEY); } catch (e) { return null; }
    };
    const setSfPopupHiddenDate = (dateStr) => {
        try { localStorage.setItem(SF_POPUP_STORAGE_KEY, dateStr); } catch (e) {}
    };
    const getTodayDateStr = () => {
        const d = new Date();
        return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    };

    const closeSfPopup = () => {
        if (!sfPopupEl) return;
        if (sfPopupNoShow && sfPopupNoShow.checked) {
            setSfPopupHiddenDate(getTodayDateStr());
        }
        if (window.modalManager) {
            window.modalManager.hideModal(sfPopupEl);
        } else {
            sfPopupEl.classList.remove('show');
        }
    };

    if (sfPopupEl) {
        const hiddenDate = getSfPopupHiddenDate();
        const shouldShow = hiddenDate !== getTodayDateStr();

        if (shouldShow) {
            setTimeout(() => {
                if (window.modalManager) {
                    window.modalManager.showModal(sfPopupEl);
                } else {
                    sfPopupEl.classList.add('show');
                    document.body.style.overflow = 'hidden';
                }
            }, 600);
        }

        if (sfPopupCloseBtn) {
            sfPopupCloseBtn.addEventListener('click', closeSfPopup);
        }

        // 배경 클릭 시 닫기
        sfPopupEl.addEventListener('click', (e) => {
            if (e.target === sfPopupEl) closeSfPopup();
        });

        // 자세히 보기 클릭 시 팝업 닫기
        const sfDetailBtn = document.getElementById('sfPopupDetailBtn');
        if (sfDetailBtn) {
            sfDetailBtn.addEventListener('click', () => {
                if (sfPopupNoShow && sfPopupNoShow.checked) {
                    setSfPopupHiddenDate(getTodayDateStr());
                }
                if (window.modalManager) {
                    window.modalManager.hideModal(sfPopupEl);
                } else {
                    sfPopupEl.classList.remove('show');
                }
            });
        }
    }
    // ──────────────────────────────────────────────────────────────

    const normalizeText = (value) => (value || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizePathname = (pathname = '/') => {
        let normalized = pathname || '/';
        if (!normalized.startsWith('/')) {
            normalized = `/${normalized}`;
        }
        normalized = normalized.replace(/\/{2,}/g, '/');
        normalized = normalized.replace(/\/index\.html$/i, '/');
        if (normalized.length > 1 && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }
        return normalized || '/';
    };
    const trimSnippet = (value, maxLength = 94) => {
        if (!value) return '';
        return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
    };
    const getCurrentSitePath = () => {
        const pathname = (window.location.pathname || '').replace(/\\/g, '/');
        const knownPaths = ['/about', '/services', '/process', '/notice', '/stories', '/partners'];
        const matchedPath = knownPaths.find((path) => (
            pathname.endsWith(`${path}/index.html`)
            || pathname.endsWith(`${path}/`)
            || pathname.endsWith(path)
        ));

        return matchedPath || '/';
    };
    const isMobileNavViewport = () => mobileNavMq.matches;
    const isMobileQuickMenuViewport = () => quickMenuMq.matches;
    const getHeaderOffset = () => (header ? header.offsetHeight : 0) + 20;
    const getRelativeDocumentHref = (targetPath = '/', targetHash = '') => {
        const currentPath = getCurrentSitePath();
        const normalizedTargetPath = normalizePathname(targetPath);
        const currentDirSegments = currentPath === '/' ? [] : currentPath.slice(1).split('/');
        const targetDirSegments = normalizedTargetPath === '/' ? [] : normalizedTargetPath.slice(1).split('/');
        let commonLength = 0;

        while (
            commonLength < currentDirSegments.length
            && commonLength < targetDirSegments.length
            && currentDirSegments[commonLength] === targetDirSegments[commonLength]
        ) {
            commonLength += 1;
        }

        const relativeSegments = [
            ...Array(currentDirSegments.length - commonLength).fill('..'),
            ...targetDirSegments.slice(commonLength),
            'index.html'
        ];

        return `${relativeSegments.join('/') || 'index.html'}${targetHash}`;
    };
    const closeAllDropdowns = () => {
        dropdownItems.forEach((item) => {
            item.classList.remove('open');
            const toggle = item.querySelector('.dropdown-toggle');
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    };

    const setCurrentNavigationState = () => {
        const currentPath = normalizePathname(window.location.pathname);
        const currentHash = window.location.hash || '';
        const topNavLinks = document.querySelectorAll('.nav-list > li > a[href]');
        const topUtilityLinks = document.querySelectorAll('.top-links a[href]');

        const resolveInternalLink = (link) => {
            const rawHref = link.getAttribute('href');
            if (!rawHref || rawHref === '#' || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
                return null;
            }
            let resolvedUrl = null;
            try {
                resolvedUrl = new URL(rawHref, window.location.href);
            } catch (error) {
                return null;
            }
            if (resolvedUrl.origin !== window.location.origin) return null;
            return {
                path: normalizePathname(resolvedUrl.pathname),
                hash: resolvedUrl.hash || ''
            };
        };

        const isCurrentLocation = (resolvedLink) => {
            if (!resolvedLink) return false;
            if (resolvedLink.path !== currentPath) return false;
            return !resolvedLink.hash || resolvedLink.hash === currentHash;
        };

        const markAsCurrent = (link) => {
            link.classList.add('is-current');
            link.setAttribute('aria-current', 'page');
        };

        document.querySelectorAll('.is-current').forEach((link) => {
            link.classList.remove('is-current');
            link.removeAttribute('aria-current');
        });
        dropdownItems.forEach((item) => item.classList.remove('current'));

        dropdownItems.forEach((item) => {
            const toggle = item.querySelector('.dropdown-toggle');
            const submenuLinks = Array.from(item.querySelectorAll('.dropdown-content a[href]'));
            const matchedSubmenuLinks = submenuLinks.filter((link) => isCurrentLocation(resolveInternalLink(link)));

            if (matchedSubmenuLinks.length) {
                const exactHashMatch = matchedSubmenuLinks.find((link) => {
                    const resolvedLink = resolveInternalLink(link);
                    return resolvedLink && resolvedLink.hash && resolvedLink.hash === currentHash;
                });
                const selectedSubmenuLink = exactHashMatch || matchedSubmenuLinks[0];
                markAsCurrent(selectedSubmenuLink);
                if (toggle) {
                    markAsCurrent(toggle);
                }
                item.classList.add('current');
                return;
            }

            if (toggle && isCurrentLocation(resolveInternalLink(toggle))) {
                markAsCurrent(toggle);
                item.classList.add('current');
            }
        });

        topNavLinks.forEach((link) => {
            const parentDropdown = link.closest('.has-dropdown');
            if (parentDropdown) return;
            if (isCurrentLocation(resolveInternalLink(link))) {
                markAsCurrent(link);
            }
        });

        topUtilityLinks.forEach((link) => {
            if (isCurrentLocation(resolveInternalLink(link))) {
                markAsCurrent(link);
            }
        });
    };

    const updateQuickMenuVisibility = () => {
        if (!quickMenu) return;

        if (!isMobileQuickMenuViewport()) {
            quickMenu.classList.remove('is-hidden-mobile');
            quickMenu.removeAttribute('aria-hidden');
            quickMenu.style.removeProperty('opacity');
            quickMenu.style.removeProperty('transform');
            quickMenu.style.removeProperty('pointer-events');
            quickMenu.style.removeProperty('visibility');
            return;
        }

        const heroRevealPoint = heroSection ? Math.max(heroSection.offsetHeight * 0.55, 320) : 320;
        const hasOpenModal = Boolean(document.querySelector('.modal.show'));
        const shouldShow = window.scrollY > heroRevealPoint
            && !document.body.classList.contains('menu-open')
            && !hasOpenModal;

        quickMenu.classList.toggle('is-hidden-mobile', !shouldShow);
        quickMenu.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
        quickMenu.style.opacity = shouldShow ? '' : '0';
        quickMenu.style.transform = shouldShow ? '' : 'translate3d(0, 12px, 0)';
        quickMenu.style.pointerEvents = shouldShow ? '' : 'none';
        quickMenu.style.visibility = shouldShow ? '' : 'hidden';
    };

    const setMobileMenuState = (isOpen) => {
        if (!nav || !navList || !mobileMenuBtn) return;
        nav.classList.toggle('active', isOpen);
        nav.setAttribute('aria-hidden', isMobileNavViewport() ? (isOpen ? 'false' : 'true') : 'false');
        navList.classList.toggle('active', isOpen);
        mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        mobileMenuBtn.setAttribute('aria-label', isOpen ? '모바일 메뉴 닫기' : '모바일 메뉴 열기');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars', !isOpen);
            icon.classList.toggle('fa-xmark', isOpen);
        }
        document.body.classList.toggle('menu-open', isOpen);
        if (mobileNavBackdrop) {
            mobileNavBackdrop.classList.toggle('show', isOpen);
        }
        updateQuickMenuVisibility();
    };

    const closeMobileMenu = () => {
        setMobileMenuState(false);
        closeAllDropdowns();
    };

    const openMobileMenu = () => {
        if (!nav) return;
        setMobileMenuState(true);
    };

    const flashSearchHit = (target) => {
        if (!target) return;
        target.classList.add('search-hit');
        setTimeout(() => target.classList.remove('search-hit'), 1800);
    };

    const scrollToTargetWithHeaderOffset = (target, options = {}) => {
        if (!target) return;
        const { behavior = 'smooth', highlight = true } = options;
        const targetTop = Math.max(target.offsetTop - getHeaderOffset(), 0);
        window.scrollTo({ top: targetTop, behavior });
        if (highlight) {
            flashSearchHit(target);
        }
    };

    const alignCurrentHashTarget = (options = {}) => {
        const rawHash = window.location.hash;
        if (!rawHash || rawHash === '#') return;

        let target = null;
        try {
            target = document.querySelector(decodeURIComponent(rawHash));
        } catch (error) {
            return;
        }

        if (!target) return;
        scrollToTargetWithHeaderOffset(target, {
            behavior: 'auto',
            highlight: false,
            ...options
        });
    };

    const getSearchTargets = () => {
        const currentPath = getCurrentSitePath();
        const createCatalogTarget = ({ path, hash = '', title, pathLabel, keywords, snippet }) => ({
            element: null,
            path: normalizePathname(path),
            hash,
            title,
            pathLabel,
            searchText: normalizeText(`${title} ${pathLabel} ${keywords || ''} ${snippet || ''}`),
            snippet
        });

        const catalogTargets = [
            createCatalogTarget({
                path: '/',
                title: '메인 홈',
                pathLabel: '홈',
                keywords: '메인 법인 소개 상담 연락처 관련기관',
                snippet: '법인 소개, 성공사례, 오시는 길과 주요 안내를 확인할 수 있습니다.'
            }),
            createCatalogTarget({
                path: '/',
                hash: '#contact',
                title: '오시는 길',
                pathLabel: '홈 > 오시는 길',
                keywords: '주소 전화 운영시간 지도',
                snippet: '부산광역시 중구 대청로 56, 4층 위치와 연락처를 안내합니다.'
            }),
            createCatalogTarget({
                path: '/about',
                title: '법인소개',
                pathLabel: '법인소개',
                keywords: '인사말 연혁 조직도',
                snippet: '법인 인사말, 연혁, 조직도 등 기관 소개를 확인할 수 있습니다.'
            }),
            createCatalogTarget({
                path: '/about',
                hash: '#history',
                title: '법인 연혁',
                pathLabel: '법인소개 > 연혁',
                keywords: '설립 연혁 주요 이력',
                snippet: '법인의 주요 연혁과 발자취를 정리한 페이지입니다.'
            }),
            createCatalogTarget({
                path: '/about',
                hash: '#orgchart',
                title: '조직도',
                pathLabel: '법인소개 > 조직도',
                keywords: '조직 구성 임원 현황',
                snippet: '법인의 조직 구성과 운영 체계를 확인할 수 있습니다.'
            }),
            createCatalogTarget({
                path: '/services',
                title: '지원상품',
                pathLabel: '지원상품',
                keywords: '창업자금 운영자금 시설개선자금 사회연대금융',
                snippet: '주요 지원상품과 상품별 대출한도, 금리, 상환기간을 안내합니다.'
            }),
            createCatalogTarget({
                path: '/services',
                hash: '#social_finance',
                title: '사회연대금융',
                pathLabel: '지원상품 > 사회연대금융',
                keywords: '사회적기업 사회적협동조합 사회적경제기업',
                snippet: '사회적경제기업을 위한 사회연대금융 상품 안내입니다.'
            }),
            createCatalogTarget({
                path: '/process',
                title: '대출안내',
                pathLabel: '대출안내',
                keywords: '지원대상 절차 필요서류 FAQ',
                snippet: '지원대상, 이용 절차, 필요서류, 자주 묻는 질문을 제공합니다.'
            }),
            createCatalogTarget({
                path: '/process',
                hash: '#documents',
                title: '필요서류 안내',
                pathLabel: '대출안내 > 필요서류',
                keywords: '신청서류 서류목록 준비서류',
                snippet: '상품별로 준비해야 할 기본 서류와 추가 서류를 정리했습니다.'
            }),
            createCatalogTarget({
                path: '/process',
                hash: '#faq',
                title: '자주 묻는 질문',
                pathLabel: '대출안내 > FAQ',
                keywords: 'faq 금리 한도 중도상환',
                snippet: '대출 금리, 한도, 중도상환 등 자주 묻는 질문을 모았습니다.'
            }),
            createCatalogTarget({
                path: '/notice',
                title: '공지사항 및 갤러리',
                pathLabel: '알림마당 > 공지사항',
                keywords: '공지사항 갤러리 정기총회 업무협약 행사 사진',
                snippet: '법인 공지사항과 주요 행사 사진, 최신 소식을 확인할 수 있습니다.'
            }),
            createCatalogTarget({
                path: '/stories',
                title: '성공사례',
                pathLabel: '알림마당 > 성공사례',
                keywords: '후기 사례 창업 운영 재기',
                snippet: '고객들의 실제 성공사례와 이용 후기를 소개합니다.'
            }),
            createCatalogTarget({
                path: '/partners',
                title: '관련기관',
                pathLabel: '알림마당 > 관련기관',
                keywords: '서민금융진흥원 금융위원회 금융감독원 부산광역시 중구청',
                snippet: '주요 협력기관과 연계기관 정보를 안내합니다.'
            })
        ];

        const sectionTargets = Array.from(document.querySelectorAll('section[id]')).map((section) => {
            const titleEl = section.querySelector('.section-header h2, h2, h3');
            const title = titleEl ? titleEl.textContent.trim() : section.id;
            const snippetSource = (section.textContent || '').replace(/\s+/g, ' ').trim();
            return {
                element: section,
                path: currentPath,
                hash: `#${section.id}`,
                title,
                pathLabel: `#${section.id}`,
                searchText: normalizeText(`${title} ${snippetSource}`),
                snippet: trimSnippet(snippetSource)
            };
        });

        const footer = document.querySelector('footer');
        if (footer) {
            const snippetSource = (footer.textContent || '').replace(/\s+/g, ' ').trim();
            sectionTargets.push({
                element: footer,
                path: currentPath,
                hash: '#footer',
                title: '하단 정보',
                pathLabel: 'footer',
                searchText: normalizeText(`하단 정보 footer ${snippetSource}`),
                snippet: trimSnippet(snippetSource)
            });
        }

        const quickActionTargets = [];
        const calculatorBtn = document.getElementById('loanCalculatorBtn');
        if (calculatorBtn) {
            quickActionTargets.push({
                element: null,
                title: '대출 계산기',
                pathLabel: '빠른 메뉴',
                searchText: normalizeText('대출 계산기 상환액 계산 월 납입금'),
                snippet: '월 상환액을 즉시 계산할 수 있는 계산기를 엽니다.',
                action: () => calculatorBtn.click()
            });
        }

        const consultBtn = document.getElementById('consultBtn');
        if (consultBtn) {
            quickActionTargets.push({
                element: null,
                title: 'AI 비대면 상담',
                pathLabel: '빠른 메뉴',
                searchText: normalizeText('ai 상담 비대면 상담 상담문의 챗봇'),
                snippet: 'AI 상담 모달을 열어 바로 상담을 시작합니다.',
                action: () => consultBtn.click()
            });
        }

        if (financeGuideBtn) {
            quickActionTargets.push({
                element: null,
                title: '서민금융 지원 가이드',
                pathLabel: '빠른 메뉴',
                searchText: normalizeText('서민금융 지원 가이드 지원안내 안내가이드 상품 안내'),
                snippet: '주요 지원대상과 상담 전 확인사항을 담은 가이드를 엽니다.',
                action: () => financeGuideBtn.click()
            });
        }

        const mergedTargets = catalogTargets.concat(sectionTargets, quickActionTargets);
        const seenTargets = new Set();

        return mergedTargets.filter((target) => {
            const key = `${target.path || currentPath}|${target.hash || ''}|${target.title}`;
            if (seenTargets.has(key)) {
                return false;
            }
            seenTargets.add(key);
            return true;
        });
    };

    const searchTargets = getSearchTargets();

    const renderSearchMessage = (message) => {
        if (!searchResults) return;
        searchResults.innerHTML = '';
        const emptyLi = document.createElement('li');
        emptyLi.className = 'search-result-empty';
        emptyLi.textContent = message;
        searchResults.appendChild(emptyLi);
    };

    const runSiteSearch = (rawKeyword) => {
        const keyword = normalizeText(rawKeyword);
        if (!searchResults) return [];
        if (!keyword) {
            renderSearchMessage('검색어를 입력해 주세요.');
            return [];
        }

        const results = searchTargets
            .map((target) => {
                const titleMatch = normalizeText(target.title).includes(keyword);
                const bodyMatch = target.searchText.includes(keyword);
                return { target, score: (titleMatch ? 2 : 0) + (bodyMatch ? 1 : 0) };
            })
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map((item) => item.target);

        searchResults.innerHTML = '';
        if (!results.length) {
            renderSearchMessage(`'${rawKeyword.trim()}'에 대한 검색 결과가 없습니다.`);
            return [];
        }

        results.forEach((result) => {
            const listItem = document.createElement('li');
            const resultBtn = document.createElement('button');
            resultBtn.type = 'button';
            resultBtn.className = 'search-result-btn';
            const titleEl = document.createElement('span');
            titleEl.className = 'search-result-title';
            titleEl.textContent = result.title;

            const pathEl = document.createElement('span');
            pathEl.className = 'search-result-path';
            pathEl.textContent = result.pathLabel;

            const snippetEl = document.createElement('span');
            snippetEl.className = 'search-result-snippet';
            snippetEl.textContent = result.snippet;

            resultBtn.appendChild(titleEl);
            resultBtn.appendChild(pathEl);
            resultBtn.appendChild(snippetEl);
            resultBtn.addEventListener('click', () => {
                closeManagedModal(searchModal);
                setTimeout(() => {
                    if (typeof result.action === 'function') {
                        result.action();
                        return;
                    }
                    const resultPath = normalizePathname(result.path || window.location.pathname);
                    const resultHash = result.hash || '';
                    const currentPath = getCurrentSitePath();

                    if (resultPath === currentPath) {
                        if (result.element) {
                            scrollToTargetWithHeaderOffset(result.element);
                            return;
                        }

                        if (resultHash) {
                            let target = null;
                            try {
                                target = document.querySelector(decodeURIComponent(resultHash));
                            } catch (error) {
                                target = null;
                            }

                            if (target) {
                                scrollToTargetWithHeaderOffset(target);
                                return;
                            }

                            window.location.hash = resultHash;
                            return;
                        }

                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                    }

                    window.location.href = getRelativeDocumentHref(resultPath, resultHash);
                }, 40);
            });
            listItem.appendChild(resultBtn);
            searchResults.appendChild(listItem);
        });

        return results;
    };

    const openSearchModal = () => {
        if (!searchModal) return;
        closeMobileMenu();
        openManagedModal(searchModal);
        updateQuickMenuVisibility();
        if (searchInput) {
            searchInput.value = '';
            setTimeout(() => searchInput.focus(), 0);
        }
        renderSearchMessage('원하시는 메뉴 또는 내용을 검색해 보세요.');
    };

    const closeSearchModal = () => {
        if (!searchModal) return;
        closeManagedModal(searchModal);
        updateQuickMenuVisibility();
    };

    setMobileMenuState(false);
    setCurrentNavigationState();
    updateQuickMenuVisibility();
    setTimeout(() => alignCurrentHashTarget(), 0);
    window.addEventListener('hashchange', setCurrentNavigationState);

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = nav ? nav.classList.contains('active') : false;
            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    if (mobileNavBackdrop) {
        mobileNavBackdrop.addEventListener('click', closeMobileMenu);
    }

    const closeMobileMenuOnResize = (e) => {
        if (!e.matches) {
            closeMobileMenu();
        }
        updateQuickMenuVisibility();
    };
    if (typeof mobileNavMq.addEventListener === 'function') {
        mobileNavMq.addEventListener('change', closeMobileMenuOnResize);
    } else if (typeof mobileNavMq.addListener === 'function') {
        mobileNavMq.addListener(closeMobileMenuOnResize);
    }

    window.addEventListener('scroll', () => {
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }
        updateQuickMenuVisibility();
    });

    const syncMotionSensitiveUi = () => {
        updateQuickMenuVisibility();
    };

    if (typeof quickMenuMq.addEventListener === 'function') {
        quickMenuMq.addEventListener('change', syncMotionSensitiveUi);
    } else if (typeof quickMenuMq.addListener === 'function') {
        quickMenuMq.addListener(syncMotionSensitiveUi);
    }

    document.addEventListener('modal-statechange', updateQuickMenuVisibility);
    window.addEventListener('load', () => {
        // Re-align hash anchors after images/video/poster complete layout to avoid landing above the target.
        alignCurrentHashTarget();
        setTimeout(() => alignCurrentHashTarget(), 160);
    });

    const syncHeroVideoPlayback = () => {
        if (!heroVideo) return;
        heroVideo.muted = true;
        heroVideo.defaultMuted = true;
        if (reduceMotionMq.matches) {
            heroVideo.pause();
            return;
        }
        const playPromise = heroVideo.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {
                // no-op: autoplay can still be blocked by browser policies
            });
        }
    };

    syncHeroVideoPlayback();
    if (typeof reduceMotionMq.addEventListener === 'function') {
        reduceMotionMq.addEventListener('change', syncHeroVideoPlayback);
    } else if (typeof reduceMotionMq.addListener === 'function') {
        reduceMotionMq.addListener(syncHeroVideoPlayback);
    }
    if (heroVideo) {
        heroVideo.addEventListener('canplay', syncHeroVideoPlayback, { once: true });
    }

    if (chatbotNavLink) {
        chatbotNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            if ((nav && nav.classList.contains('active')) || (navList && navList.classList.contains('active'))) {
                closeMobileMenu();
            }
            window.openChatbotModal();
        });
    }

    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', openSearchModal);
    }

    if (closeSearchModalBtn) {
        closeSearchModalBtn.addEventListener('click', closeSearchModal);
    }

    if (searchModal) {
        searchModal.addEventListener('click', (e) => {
            if (e.target === searchModal) {
                closeSearchModal();
            }
        });
    }

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            runSiteSearch(searchInput ? searchInput.value : '');
        });
    }

    if (searchKeywordBtns.length && searchInput) {
        searchKeywordBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const keyword = btn.dataset.keyword || btn.textContent || '';
                searchInput.value = keyword.trim();
                runSiteSearch(searchInput.value);
            });
        });
    }

    if (dropdownItems.length) {
        dropdownItems.forEach((item) => {
            const toggle = item.querySelector('.dropdown-toggle');
            if (!toggle) return;

            toggle.setAttribute('aria-haspopup', 'true');
            toggle.setAttribute('aria-expanded', 'false');

            toggle.addEventListener('click', (e) => {
                if (!isMobileNavViewport()) return;
                e.preventDefault();
                const isOpen = item.classList.contains('open');
                closeAllDropdowns();
                if (!isOpen) {
                    item.classList.add('open');
                    toggle.setAttribute('aria-expanded', 'true');
                }
            });

            toggle.addEventListener('keydown', (e) => {
                if (!isMobileNavViewport() && e.key === 'ArrowDown') {
                    e.preventDefault();
                    closeAllDropdowns();
                    item.classList.add('open');
                    toggle.setAttribute('aria-expanded', 'true');
                    const firstMenuLink = item.querySelector('.mega-dropdown a');
                    if (firstMenuLink) firstMenuLink.focus();
                    return;
                }

                if (!isMobileNavViewport()) return;

                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const isOpen = item.classList.contains('open');
                    closeAllDropdowns();
                    if (!isOpen) {
                        item.classList.add('open');
                        toggle.setAttribute('aria-expanded', 'true');
                        const firstMenuLink = item.querySelector('.mega-dropdown a');
                        if (firstMenuLink) firstMenuLink.focus();
                    }
                }
            });

            item.querySelectorAll('.mega-dropdown a').forEach((menuLink) => {
                menuLink.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        closeAllDropdowns();
                        toggle.focus();
                    }
                });
            });

            item.addEventListener('focusout', (e) => {
                if (isMobileNavViewport()) return;
                const next = e.relatedTarget;
                if (!next || !item.contains(next)) {
                    item.classList.remove('open');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        });

        if (navList) {
            navList.addEventListener('click', (e) => {
                const target = e.target instanceof Element ? e.target.closest('a') : null;
                if (!target || target.classList.contains('dropdown-toggle')) return;
                if (isMobileNavViewport()) {
                    closeMobileMenu();
                }
            });
        }

        document.addEventListener('click', (e) => {
            if (!(e.target instanceof Element) || !e.target.closest('.has-dropdown')) {
                closeAllDropdowns();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllDropdowns();
                if (searchModal && searchModal.classList.contains('show')) {
                    closeSearchModal();
                }
            }
        });
    }

    // Scroll Progress
    const progress = document.getElementById('scrollProgress');
    if (progress) {
        window.addEventListener('scroll', () => {
            const h = document.documentElement;
            progress.style.width = `${(h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100}%`;
        });
    }

    // Smooth Scrolling for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (e.defaultPrevented) {
                return;
            }
            const href = this.getAttribute('href');
            if (!href || href === '#') {
                e.preventDefault();
                return;
            }

            let target = null;
            try {
                target = document.querySelector(href);
            } catch (err) {
                return;
            }

            if (target) {
                e.preventDefault();
                if ((nav && nav.classList.contains('active')) || (navList && navList.classList.contains('active'))) {
                    closeMobileMenu();
                }
                scrollToTargetWithHeaderOffset(target);
            }
        });
    });

    const noticeTabBtns = document.querySelectorAll('.notice-tabs .tab-btn');
    const noticeList = document.querySelector('.notice-list');
    if (noticeTabBtns.length && noticeList) {
        const noticeItems = Array.from(noticeList.querySelectorAll('li'));
        const noticeEmpty = document.createElement('li');
        noticeEmpty.className = 'notice-empty is-hidden';
        noticeEmpty.textContent = '해당 항목이 없습니다.';
        noticeList.appendChild(noticeEmpty);

        const applyNoticeTab = (tab) => {
            let visibleCount = 0;
            noticeItems.forEach((item) => {
                const tagEl = item.querySelector('.tag');
                const matched = Boolean(tagEl && tagEl.classList.contains(tab));
                item.classList.toggle('is-hidden', !matched);
                if (matched) visibleCount += 1;
            });
            noticeEmpty.classList.toggle('is-hidden', visibleCount > 0);
        };

        noticeTabBtns.forEach((btn) => {
            btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
            btn.addEventListener('click', () => {
                noticeTabBtns.forEach((tabBtn) => {
                    tabBtn.classList.remove('active');
                    tabBtn.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
                applyNoticeTab(btn.dataset.tab || 'notice');
            });
        });

        const currentActiveTab = noticeList.closest('.notice-box')?.querySelector('.notice-tabs .tab-btn.active');
        applyNoticeTab(currentActiveTab ? currentActiveTab.dataset.tab : 'notice');
    }

    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length) {
        faqItems.forEach((item, index) => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            if (!question || !answer) return;

            const answerId = `faq-answer-${index + 1}`;
            answer.id = answerId;
            answer.style.maxHeight = '0px';
            question.setAttribute('aria-controls', answerId);
            question.setAttribute('aria-expanded', 'false');

            question.addEventListener('click', () => {
                const shouldOpen = !item.classList.contains('active');

                faqItems.forEach((faqItem) => {
                    faqItem.classList.remove('active');
                    const q = faqItem.querySelector('.faq-question');
                    const a = faqItem.querySelector('.faq-answer');
                    if (q) q.setAttribute('aria-expanded', 'false');
                    if (a) a.style.maxHeight = '0px';
                });

                if (shouldOpen) {
                    item.classList.add('active');
                    question.setAttribute('aria-expanded', 'true');
                    answer.style.maxHeight = `${answer.scrollHeight}px`;
                }
            });
        });
    }

    // Scroll Reveal Animations
    const revealEls = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right');
    if (revealEls.length) {
        if ('IntersectionObserver' in window) {
            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

            revealEls.forEach(el => revealObserver.observe(el));
        } else {
            revealEls.forEach(el => el.classList.add('active'));
        }
    }

    // Stats Counter Animation
    const counters = document.querySelectorAll('.counter');
    if (counters.length) {
        const statsObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000; // 2 seconds
                    const startTime = performance.now();

                    const updateCounter = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        // Ease-out effect
                        const ease = 1 - Math.pow(1 - progress, 3);

                        const current = Math.floor(ease * target);
                        counter.innerText = current.toLocaleString();

                        if (progress < 1) {
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.innerText = target.toLocaleString();
                        }
                    };

                    requestAnimationFrame(updateCounter);
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            statsObserver.observe(counter);
        });
    }

    // Finance Guide Modal
    const openFinanceGuide = () => {
        if (!financeGuideModal) return;
        openManagedModal(financeGuideModal);
    };

    const closeFinanceGuide = () => {
        if (!financeGuideModal) return;
        closeManagedModal(financeGuideModal);
    };

    if (financeGuideBtn && financeGuideModal) {
        financeGuideBtn.addEventListener('click', openFinanceGuide);
        if (financeGuideBtn.tagName !== 'BUTTON') {
            financeGuideBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openFinanceGuide();
                }
            });
        }
    }

    if (closeFinanceGuideBtn) {
        closeFinanceGuideBtn.addEventListener('click', closeFinanceGuide);
    }

    if (financeGuideModal) {
        financeGuideModal.addEventListener('click', (e) => {
            if (e.target === financeGuideModal) {
                closeFinanceGuide();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && financeGuideModal && financeGuideModal.classList.contains('show')) {
            closeFinanceGuide();
        }
    });

    // Move image fallback handling out of inline HTML attributes.
    document.querySelectorAll('img[data-fallback-src]').forEach((img) => {
        img.addEventListener('error', () => {
            const fallbackSrc = img.dataset.fallbackSrc;
            if (!fallbackSrc || img.dataset.fallbackApplied === 'true') return;
            img.dataset.fallbackApplied = 'true';
            img.src = fallbackSrc;
        });
    });

    document.querySelectorAll('img[data-fallback-text-id]').forEach((img) => {
        img.addEventListener('error', () => {
            const fallbackId = img.dataset.fallbackTextId;
            if (!fallbackId) return;
            const fallbackText = document.getElementById(fallbackId);
            img.classList.add('is-hidden');
            if (fallbackText) {
                fallbackText.classList.add('show');
            }
        });
    });
});

// --- Global Functions (Accessible from HTML) ---
// Moved window.openChatbotModal inside the DOMContentLoaded block below
// --- High-End AI Consultation Chatbot System ---
document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    // --- Knowledge Base (Brain) ---
    const botBrain = {
        'start': {
            text: "안녕하세요! (사)미소금융부산중구법인 <b>AI 전문상담위원</b>입니다. 👋<br><br>💡 <b>3분 안에</b> 대출 가능 여부를 판단하고, 맞춤 상품을 제안해 드립니다!",
            options: [
                { label: "🤝 사회연대금융 자격 진단", value: "social_step1" },
                { label: "🎯 3분 완성! 맞춤 상담", value: "quick_consult" },
                { label: "🆘 생계자금·청년대출 진단", value: "diag_vuln_step1" },
                { label: "💰 상품별 상세 안내", value: "find_product" },
                { label: "🔢 대출금 계산기", value: "calc_start" },
                { label: "📞 전화 번호 안내", value: "phone_info" }
            ]
        },
        // === VULNERABLE CLASS & YOUTH DIAGNOSTIC ===
        'diag_vuln_step1': {
            text: "<b>🆘 특화상품(생계/청년) 진단</b><br><br>먼저 고객님에게 해당하는 항목을 선택해 주세요.",
            options: [
                { label: "의료비, 전세사기 피해 등 생계 어려움", value: "diag_vuln_step2" },
                { label: "만 19~34세 청년 (미취업/재직/창업)", value: "diag_youth_success" },
                { label: "해당사항 없음", value: "quick_consult" }
            ]
        },
        'diag_vuln_step2': {
            text: "<b>[생계자금 요건 확인]</b><br><br>고객님의 신용평점과 소득 수준은 어떻게 되시나요?",
            options: [
                { label: "신용 하위 50% & 연소득 3.5천만 이하", value: "diag_vuln_success" },
                { label: "그 외 (소득 높음/신용 좋음)", value: "qc_fail_income" }
            ]
        },
        'diag_vuln_success': {
            text: `<div style='background:#00305b;color:white;padding:15px;border-radius:12px;margin:15px 0;text-align:center;'><h3 style='margin:0;color:white;'>🎉 생계자금 신청 가능!</h3></div>
            <br><b>📋 금융취약계층 생계자금</b><br><hr>
            어려운 시기, 미소금융이 함께합니다.<br>
            • <b>용도</b>: 긴급 의료비, 주거비, 상조 등<br>
            • <b>금리</b>: 연 4.5%<br>
            • <b>필요 서류</b>: 해당 용도별 증빙 (진단서 등)<br><br>자세한 한도는 상담을 통해 결정됩니다.`,
            options: [{ label: "📞 직통 전화 상담", value: "call" }, { label: "🏠 처음으로", value: "start" }]
        },
        'diag_youth_success': {
            text: `<div style='background:#00305b;color:white;padding:15px;border-radius:12px;margin:15px 0;text-align:center;'><h3 style='margin:0;color:white;'>✨ 청년 미래이음 대출 안내</h3></div>
            <br><b>📋 만 19~34세 맞춤 지원</b><br><hr>
            청년들의 든든한 출발을 응원합니다!<br>
            • <b>조건</b>: '청년 모두를 위한 재무상담' 이수 필수<br>
            • <b>한도</b>: 최대 500만원 내외<br><br>
            ※ 만약 청년 창업/운영자금인 경우 한도가 <b>최대 3,000만원</b>까지 상향될 수 있습니다!`,
            options: [{ label: "📞 맞춤 전화 상담", value: "call" }, { label: "🏠 처음으로", value: "start" }]
        },

        // === SOCIAL SOLIDARITY FINANCE DIAGNOSTIC ===
        'social_step1': {
            text: "<b>🤝 사회연대금융 자격진단 시작</b><br><br><div class='progress-bar-container'><div class='progress-bar-fill' style='width:33%'></div></div><div style='font-size:0.85em;color:#666;margin-bottom:10px;'>단계: 1/3</div>먼저, 고객님의 <b>기업 형태</b>를 선택해 주세요.",
            options: [
                { label: "사회적(예비)기업", value: "social_step2" },
                { label: "사회적협동조합", value: "social_step2" },
                { label: "기타 (일반 법인/개인)", value: "social_fail_type" }
            ]
        },
        'social_fail_type': {
            text: "<div style='background:#ff9800;color:white;padding:15px;border-radius:12px;margin:15px 0;text-align:center;'><b style='color:white;'>⚠️ 지원 대상 아님</b></div><br>사회연대금융은 <b>사회적기업 및 사회적협동조합</b> 전용 상품입니다.<br><br>일반 사업자이실 경우 <b>창업/운영자금</b>을 알아보시겠어요?",
            options: [
                { label: "💰 일반 상품 보기", value: "find_product" },
                { label: "🏠 처음으로", value: "start" }
            ]
        },
        'social_step2': {
            text: "<div class='progress-bar-container'><div class='progress-bar-fill' style='width:66%'></div></div><div style='font-size:0.85em;color:#666;margin-bottom:10px;'>단계: 2/3</div><b>[기업 형태 충족]</b> ✅<br><br>최근 3개년 <b>연평균 매출액</b>이 어떻게 되시나요?",
            options: [
                { label: "10억원 이하", value: "social_step3" },
                { label: "10억원 초과", value: "social_fail_revenue" }
            ]
        },
        'social_fail_revenue': {
            text: "<div style='background:#ff5252;color:white;padding:15px;border-radius:12px;margin:15px 0;text-align:center;'><b style='color:white;'>⚠️ 매출 한도 초과</b></div><br>죄송합니다. 사회연대금융은 한정된 재원을 영세 기업에 집중하기 위해 <b>연평균 매출액 10억원 이하</b>인 경우에만 지원 가능합니다.",
            options: [
                { label: "📞 예외 상담 문의", value: "phone_info" },
                { label: "🏠 처음으로", value: "start" }
            ]
        },
        'social_step3': {
            text: "<div class='progress-bar-container'><div class='progress-bar-fill' style='width:100%'></div></div><div style='font-size:0.85em;color:#666;margin-bottom:10px;'>단계: 3/3</div><b>[매출 기준 충족]</b> ✅<br><br>필요하신 <b>자금의 용도</b>는 무엇인가요?",
            options: [
                { label: "사업장 임차보증금", value: "diag_social_success" },
                { label: "시설개선 (인테리어/장비)", value: "diag_social_success" },
                { label: "운영자금 (물품구입 등)", value: "diag_social_success" }
            ]
        },
        'diag_social_success': {
            text: `<div style='background:#00305b;color:white;padding:15px;border-radius:12px;margin:15px 0;text-align:center;'><h3 style='margin:0;color:white;'>🎉 자격 요건 충족!</h3></div>
            <br><b>📋 사회연대금융 상담 결과</b><br><hr>
            • <b>추천 상품</b>: 사회연대금융<br>
            • <b>예상 한도</b>: 최대 1억원<br>
            • <b>금리</b>: 연 4.5% (우수기업 연 4.0%)<br>
            • <b>상환 기간</b>: 최대 6년 (거치 2년)<br><br>
            ※ 지점 심사 과정에서 최종 한도 및 금리가 확정됩니다.`,
            options: [
                { label: "📄 필수 서류 보기", value: "doc_social" },
                { label: "🔢 상환액 계산", value: "calc_start" },
                { label: "📞 전화 상담 예약", value: "phone_info" },
                { label: "🏠 처음으로", value: "start" }
            ]
        },

        // === QUICK CONSULTATION (3-MINUTE) ===
        'quick_consult': {
            text: "<b>✨ 3분 맞춤 상담 시작</b><br><br><div class='progress-bar-container'><div class='progress-bar-fill' style='width:25%'></div></div><div style='font-size:0.85em;color:#666;margin-bottom:10px;'>단계: 1/4</div>고객님의 <b>신용평점(NICE 기준)</b>은 어느 수준이신가요?",
            options: [
                { label: "749점 이하", value: "qc_step2_low" },
                { label: "750점 이상", value: "qc_step2_high" },
                { label: "모르겠음 (자동 판단)", value: "qc_step2_low" }
            ]
        },
        'qc_step2_low': {
            text: "<div class='progress-bar-container'><div class='progress-bar-fill' style='width:50%'></div></div><div style='font-size:0.85em;color:#666;margin-bottom:10px;'>단계: 2/4</div><b>[신용 요건 충족]</b> ✅<br><br>현재 <b>세금 체납</b>이나 <b>대출 연체</b>가 있으신가요?",
            options: [
                { label: "없습니다 (정상)", value: "qc_step3" },
                { label: "있습니다", value: "qc_fail_overdue" }
            ]
        },
        'qc_step2_high': {
            text: "<div class='progress-bar-container'><div class='progress-bar-fill' style='width:50%'></div></div><div style='font-size:0.85em;color:#666;margin-bottom:10px;'>단계: 2/4</div>신용점이 높으시네요! <b>저소득층</b>에 해당하시나요?<br><br>• 기초수급자/차상위<br>• 근로장려금 대상",
            options: [
                { label: "예, 해당됩니다", value: "qc_step3" },
                { label: "아니요", value: "qc_fail_income" }
            ]
        },
        'qc_step3': {
            text: "<div class='progress-bar-container'><div class='progress-bar-fill' style='width:75%'></div></div><div style='font-size:0.85em;color:#666;margin-bottom:10px;'>단계: 3/4</div><b>[연체 이력 없음]</b> ✅<br><br>고객님의 <b>사업 상황</b>은 무엇인가요?",
            options: [
                { label: "🏢 창업 예정 (6개월 미만)", value: "qc_step4_startup" },
                { label: "🏪 운영 중 (6개월 이상)", value: "qc_step4_operation" }
            ]
        },
        'qc_step4_startup': {
            text: "<div class='progress-bar-container'><div class='progress-bar-fill' style='width:100%'></div></div><div style='font-size:0.85em;color:#666;margin-bottom:10px;'>단계: 4/4</div><b>[창업자금]</b> 선택됨<br><br>업종을 선택해 주세요:",
            options: [
                { label: "일반 소매/음식점", value: "qc_result_startup_general" },
                { label: "전통시장 상인", value: "qc_result_startup_market" },
                { label: "배달/운송업", value: "qc_result_startup_delivery" }
            ]
        },
        'qc_step4_operation': {
            text: "<div class='progress-bar-container'><div class='progress-bar-fill' style='width:100%'></div></div><div style='font-size:0.85em;color:#666;margin-bottom:10px;'>단계: 4/4</div><b>[운영자금]</b> 선택됨<br><br>필요한 자금 용도는?",
            options: [
                { label: "식자재/물품 구입", value: "qc_result_operation_goods" },
                { label: "시설 개선/인테리어", value: "qc_result_operation_facility" },
                { label: "차량 구매 (1톤 트럭 등)", value: "qc_result_operation_vehicle" }
            ]
        },

        // === RESULTS ===
        'qc_result_startup_general': {
            text: `<div style='background:#00305b;color:white;padding:15px;border-radius:12px;margin:15px 0;text-align:center;'><h3 style='margin:0;color:white;'>✅ 대출 승인 가능성: <b>매우 높음</b></h3></div>
            <br><b>📋 상담 결과 요약</b><br><hr>
            • <b>추천 상품</b>: 창업자금 대출<br>
            • <b>예상 한도</b>: 최대 7,000만원<br>
            • <b>금리</b>: 연 4.5% (고정)<br>
            • <b>상환 기간</b>: 5년 이내<br><br>
            <b>⚠️ 주의사항</b><br>
            점포 계약 전 반드시 사전 상담이 필요합니다!<br><br>
            <b>다음 단계</b><br>
            1. 필수 서류 준비<br>
            2. 전화 문의 후 방문<br>
            3. 심사 (약 3-5일)`,
            options: [
                { label: "📄 필수 서류 보기", value: "doc_startup" },
                { label: "📞 전화 번호 안내", value: "phone_info" },
                { label: "💬 카톡 공유", value: "share_result" },
                { label: "🔄 처음부터 다시", value: "start" }
            ]
        },
        'qc_result_startup_market': {
            text: `<div style='background:#00305b;color:white;padding:15px;border-radius:12px;margin:15px 0;text-align:center;'><h3 style='margin:0;color:white;'>✅ 대출 승인 가능성: <b>매우 높음</b></h3></div>
            <br><b>📋 전통시장 특화 지원</b><br><hr>
            • <b>추천 상품</b>: 창업자금 대출<br>
            • <b>예상 한도</b>: 최대 7,000만원<br>
            • <b>금리</b>: 연 4.5% (전통시장 우대)<br><br>
            <b>💡 혜택</b><br>
            전통시장 상인회 가입 시 네트워킹 및 판로 확대 지원!`,
            options: [
                { label: "📄 필수 서류 보기", value: "doc_startup" },
                { label: "📞 전화 번호 안내", value: "phone_info" },
                { label: "🔄 처음으로", value: "start" }
            ]
        },
        'qc_result_startup_delivery': {
            text: `<div style='background:#00305b;color:white;padding:15px;border-radius:12px;margin:15px 0;text-align:center;'><h3 style='margin:0;color:white;'>✅ 승인 가능: 배달/운송업</h3></div>
            <br><b>📋 특화 상담 결과</b><br><hr>
            • <b>추천 상품</b>: 창업자금 + 시설개선(차량)<br>
            • <b>예상 한도</b>: 최대 7,000만원<br>
            • <b>차량 구매</b>: 1톤 트럭, 라보 등 가능<br><br>
            ※ 차량 구매비용은 시설개선자금으로 신청 가능합니다.`,
            options: [
                { label: "🚛 차량 구매 상세", value: "prod_facility_pro" },
                { label: "📞 전화 번호 안내", value: "phone_info" },
                { label: "🔄 처음으로", value: "start" }
            ]
        },
        'qc_result_operation_goods': {
            text: `<div style='background:#00305b;color:white;padding:15px;border-radius:12px;margin:15px 0;text-align:center;'><h3 style='margin:0;color:white;'>✅ 대출 승인 가능성: <b>높음</b></h3></div>
            <br><b>📋 상담 결과 요약</b><br><hr>
            • <b>추천 상품</b>: 운영자금 대출<br>
            • <b>예상 한도</b>: 최대 2,000만원 <span style='font-size:0.9em;color:var(--primary-color)'>(※ 청년 3,000만원)</span><br>
            • <b>금리</b>: 연 4.5%<br>
            • <b>인센티브</b>: 성실상환 시 금리 1%p 추가 인하<br><br>
            <b>⚠️ 필수 제출 서류</b><br>
            • 최근 3개월 부가세 신고 내역<br>
            • 거래처 증빙 (세금계산서 등)`,
            options: [
                { label: "🔢 월 상환액 계산", value: "calc_start" },
                { label: "📞 전화 번호 안내", value: "phone_info" },
                { label: "🔄 처음으로", value: "start" }
            ]
        },
        'qc_result_operation_facility': {
            text: `<div style='background:#00305b;color:white;padding:15px;border-radius:12px;margin:15px 0;text-align:center;'><h3 style='margin:0;color:white;'>✅ 승인 가능: 시설개선</h3></div>
            <br><b>📋 시설개선 자금 상담</b><br><hr>
            • <b>추천 상품</b>: 시설개선자금<br>
            • <b>예상 한도</b>: 최대 2,000만원<br>
            • <b>금리</b>: 연 4.5%<br>
            • <b>용도</b>: 인테리어, 설비, 간판 등<br><br>
            <b>필수 서류</b><br>
            시설 견적서 + 사업자등록증`,
            options: [
                { label: "🔢 상환액 계산", value: "calc_start" },
                { label: "📞 전화 번호 안내", value: "phone_info" }
            ]
        },
        'qc_result_operation_vehicle': {
            text: `<div style='background:#00305b;color:white;padding:15px;border-radius:12px;margin:15px 0;text-align:center;'><h3 style='margin:0;color:white;'>✅ 승인 가능: 차량 지원</h3></div>
            <br><b>📋 사업용 차량 구매</b><br><hr>
            • <b>추천 상품</b>: 시설개선자금<br>
            • <b>예상 한도</b>: 최대 2,000만원<br>
            • <b>가능 차종</b>: 1톤 트럭, 다마스, 라보 등 (생계형)<br><br>
            ※ 자가용 번호판도 사업용도로 증빙 시 가능할 수 있습니다.`,
            options: [
                { label: "📄 필수 서류", value: "doc_operation" },
                { label: "📞 전화 번호 안내", value: "phone_info" }
            ]
        },
        'qc_fail_overdue': {
            text: "<div style='background:#ff5252;color:white;padding:15px;border-radius:12px;text-align:center;'><b style='color:white;'>⚠️ 연체/체납 확인</b></div><br>현재 연체 기록이 있으시면 대출이 불가능합니다. <br><br>체납액을 완납하시고 '완납증명서'를 발급받으신 후 다시 상담해 주세요!",
            options: [{ label: "📞 상담원 문의", value: "call" }, { label: "🏠 처음으로", value: "start" }]
        },
        'qc_fail_income': {
            text: "<div style='background:#ff9800;color:white;padding:15px;border-radius:12px;text-align:center;'><b style='color:white;'>💡 대안 상품 안내</b></div><br>미소금융은 저신용·저소득 고객을 위한 상품입니다.<br><br>고객님께는 시중은행의 <b>'새희망홀씨'</b>나 <b>'햇살론'</b> 상품이 더 적합할 수 있습니다.",
            options: [{ label: "🏠 처음으로", value: "start" }]
        },

        // === PHONE INFO ===
        'phone_info': {
            text: "<b>📞 전화 번호 안내</b><br><br>" +
                "<div style='background:#f0f7ff;padding:16px;border-radius:12px;margin:10px 0;border:1px solid #d0e3f7;'>" +
                "☎️ <b style='font-size:1.15em;'><a href='tel:051-255-0005' style='color:#00305b;'>051-255-0005</a>, <a href='tel:051-255-7392' style='color:#00305b;'>7392</a></b></div><br>" +
                "<b>🕘 상담 가능 시간</b><br>" +
                "• 평일 <b>09:00 ~ 18:00</b><br>" +
                "• 주말 및 공휴일 휴무<br><br>" +
                "<div style='background:#fff3e0;padding:12px 14px;border-radius:10px;border-left:4px solid #ff9800;'>" +
                "🍽️ <b>점심시간 안내</b><br>" +
                "<b>12:00 ~ 13:00</b>은 식사 시간으로<br>전화 연결이 어려울 수 있습니다.</div>",
            options: [
                { label: "📞 바로 전화하기", value: "call" },
                { label: "🏠 처음으로", value: "start" }
            ]
        },

        // === CALCULATOR ===
        'calc_start': {
            text: "<b>🔢 대출금 상환 계산기</b><br><br>대출 희망 금액을 선택해 주세요.",
            options: [
                { label: "1,000만원", value: "calc_1000" },
                { label: "2,000만원", value: "calc_2000" },
                { label: "3,000만원", value: "calc_3000" },
                { label: "5,000만원", value: "calc_5000" },
                { label: "7,000만원", value: "calc_7000" }
            ]
        },

        // === PRODUCTS & DOCS ===
        'find_product': {
            text: "상품별 <b>상세 정보</b>를 확인하세요.",
            options: [
                { label: "🤝 사회연대금융 (1억)", value: "diag_social" },
                { label: "🏢 창업자금 (7천만)", value: "diag_startup" },
                { label: "🏪 운영자금 (2/3천만)", value: "diag_operation" },
                { label: "🛠 시설개선 (2천만)", value: "prod_facility_pro" },
                { label: "🌟 특화상품 (생계/청년)", value: "diag_special" },
                { label: "↩ 뒤로가기", value: "start" }
            ]
        },
        'diag_social': { text: "<b>🤝 사회연대금융 (사회적경제기업)</b><br>사회적기업, 협동조합 등을 위한 전용 대출.<br>한도 1억원, 금리 연 4.5% (우수기업 4.0%).<br>※ 연평균 매출액 10억원 이하 대상", options: [{ label: "📄 서류 보기", value: "doc_social" }, { label: "📞 전화 번호 안내", value: "phone_info" }, { label: "↩ 뒤로", value: "find_product" }] },
        'diag_startup': { text: "<b>🏢 창업자금</b><br>임차보증금(5천)+운영자금(2천) 지원.<br>사업자등록 6개월 미만 대상.", options: [{ label: "📄 서류 보기", value: "doc_startup" }, { label: "📞 전화 번호 안내", value: "phone_info" }, { label: "↩ 뒤로", value: "find_product" }] },
        'diag_operation': { text: "<b>🏪 운영자금</b><br>제품/원재료 구매 자금 지원.<br>청년(만19~34세)은 최대 3,000만원까지 한도 부여.", options: [{ label: "📄 서류 보기", value: "doc_operation" }, { label: "📞 전화 번호 안내", value: "phone_info" }, { label: "↩ 뒤로", value: "find_product" }] },
        'prod_facility_pro': { text: "<b>🛠 시설개선자금</b><br>인테리어, 차량 구매 등 지원.<br>사업자등록 6개월 이상 대상.", options: [{ label: "📄 서류 보기", value: "doc_operation" }, { label: "📞 전화 번호 안내", value: "phone_info" }, { label: "↩ 뒤로", value: "find_product" }] },
        'diag_special': { text: "<b>🌟 금융취약계층 생계자금 및 청년 미래이음 대출</b><br>취약계층 의료비, 주거비 등 긴급자금 지원 및<br>청년(미취업, 1년 미만 이내) 미래 설계 자금 지원", options: [{ label: "📄 서류 보기", value: "doc_special" }, { label: "📞 전화 번호 안내", value: "phone_info" }, { label: "↩ 뒤로", value: "find_product" }] },

        'doc_pro': {
            text: "<b>📜 필요 서류 안내</b><br><br>어떤 자금을 신청하시나요?",
            options: [
                { label: "🤝 사회연대금융 서류", value: "doc_social" },
                { label: "🏢 창업자금 서류", value: "doc_startup" },
                { label: "🏪 운영/시설자금 서류", value: "doc_operation" },
                { label: "🌟 특화상품(생계/청년)", value: "doc_special" },
                { label: "🏠 처음으로", value: "start" }
            ]
        },
        'doc_startup': {
            text: "<b>🏢 창업자금 서류</b><div class='doc-checklist'><ol><li>신분증, 등/초본</li><li>사업계획서</li><li>임대차계약서 (예정지)</li><li>시설 견적서 (필요시)</li></ol><div class='doc-note'>※ 방문 시 서식 제공</div></div>",
            options: [{ label: "📞 전화 번호 안내", value: "phone_info" }, { label: "↩ 뒤로", value: "doc_pro" }]
        },
        'doc_social': {
            text: "<b>🤝 사회연대금융 서류</b><div class='doc-checklist'><ol><li>사회적기업(인증·지정)/협동조합(인가) 증명서</li><li>사업계획서 (서식 제공)</li><li>법인등기사항전부증명서 (3개월 이내)</li><li>최근 2개년 재무제표증명원</li><li>정관 및 주주(사원)명부 사본</li><li>이사회 및 총회 의사록</li></ol></div>",
            options: [{ label: "📞 전화 번호 안내", value: "phone_info" }, { label: "↩ 뒤로", value: "doc_pro" }]
        },
        'doc_operation': {
            text: "<b>🏪 운영/시설자금 서류</b><div class='doc-checklist'><ol><li>신분증, 등/초본</li><li>사업자등록증명원</li><li>부가세과세표준증명 (최근 3개월)</li><li>사업장 임대차계약서</li></ol></div>",
            options: [{ label: "📞 전화 번호 안내", value: "phone_info" }, { label: "↩ 뒤로", value: "doc_pro" }]
        },
        'doc_special': {
            text: "<b>🌟 특화상품(생계/청년) 서류</b><div class='doc-checklist'><ol><li>의료비 등 증빙 (생계자금)</li><li>'청년 모두를위한 재무상담' 이수증</li><li>연령(만19~34세) 확인 신분증</li><li>기초/차상위 등 증빙서류</li></ol></div>",
            options: [{ label: "📞 전화 번호 안내", value: "phone_info" }, { label: "↩ 뒤로", value: "doc_pro" }]
        },
        'rejection_pro': {
            text: "<b>🚫 부적격 사유 긴급 체크</b><br><br>다음 해당 시 대출 불가:<br>❌ 재산 과다 보유<br>❌ 금융 연체 기록<br>❌ 도박/유흥업 등",
            options: [{ label: "자가진단 하기", value: "quick_consult" }, { label: "처음으로", value: "start" }]
        },
        'call': {
            text: "<b>📞 상담 위원 직통</b><br><br>☎️ <b><a href='tel:051-255-0005' style='color:#00305b; font-weight:700; font-size:1.2em;'>051-255-0005</a>, <a href='tel:051-255-7392' style='color:#00305b; font-weight:700; font-size:1.2em;'>7392</a></b><br><br>평일 09:00 ~ 18:00<br><span style='color:#e65100;font-size:0.92em;'>🍽️ 점심시간(12:00~13:00)은 전화 연결이 어려울 수 있습니다.</span>",
            options: [{ label: "🏠 처음으로", value: "start" }]
        },
        'share_result': {
            text: "<b>💬 공유 기능</b><br><br>현재 시스템 연동 작업 중입니다.<br>화면을 캡쳐해서 보내주세요! 📸",
            options: [{ label: "🏠 처음으로", value: "start" }]
        }
    };

    // --- Core Chat Engine ---
    function addMessage(text, side = 'received') {
        const msg = document.createElement('div');
        const isRichReceivedMessage = side === 'received'
            && /<br\s*\/?>|<hr|<ul|<ol|<table|<div/i.test(text);
        msg.className = `message ${side}${isRichReceivedMessage ? ' message-rich' : ''}`;
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Use Image for Bot, Icon for User
        const avatarPath = (window.location.pathname.includes('/about/') || window.location.pathname.includes('/services/') || window.location.pathname.includes('/process/') || window.location.pathname.includes('/notice/')) ? '../assets/mascot_consulting.png' : 'assets/mascot_consulting.png';
        const avatar = side === 'received'
            ? `<img src="${avatarPath}" class="msg-avatar-img" alt="상담사" style="object-fit: cover;">`
            : '<div style="display:none;"></div>'; // Hide user avatar to keep it clean or use icon

        msg.innerHTML = `${avatar}<div class="message-bubble">${text}</div><span class="message-time">${timeStr}</span>`;
        chatMessages.appendChild(msg);
        
        // Update smartphone clock
        const timeEl = document.querySelector('.status-bar .time');
        if (timeEl) timeEl.textContent = timeStr;
        
        // Smooth scroll
        setTimeout(() => {
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
        }, 10);
    }

    function addOptions(opts) {
        const div = document.createElement('div');
        div.className = 'quick-replies';
        opts.forEach(o => {
            const b = document.createElement('button');
            b.className = 'quick-reply-btn';
            b.innerHTML = o.label;
            b.onclick = () => {
                addMessage(o.label.replace(/<[^>]*>/g, ''), 'sent');
                handleLogic(o.value);
            };
            div.appendChild(b);
        });
        chatMessages.appendChild(div);
        
        setTimeout(() => {
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
        }, 10);
    }

    function showTyping(callback) {
        const typing = document.createElement('div');
        typing.className = 'message received typing-msg';
        typing.innerHTML = `<div class="message-bubble typing"><span></span><span></span><span></span></div>`;
        chatMessages.appendChild(typing);
        
        setTimeout(() => {
            chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
        }, 10);
        
        // Dynamic delay based on a rough estimation if we had text, but for now fixed to a slightly more realistic random timeframe (800-1200ms)
        const delay = Math.floor(Math.random() * 400) + 800;
        setTimeout(() => {
            if (typing.parentNode) chatMessages.removeChild(typing);
            callback();
        }, delay);
    }

    function handleLogic(key) {
        showTyping(() => {
            const calcMatch = /^calc_(\d+)$/.exec(key);
            if (calcMatch) {
                performCalculation(parseInt(calcMatch[1], 10));
                return;
            }

            const data = botBrain[key] || { text: "죄송합니다. 처리할 수 없는 요청입니다.", options: [{ label: "처음으로", value: "start" }] };
            addMessage(data.text, 'received');
            if (data.options) addOptions(data.options);
        });
    }

    function performCalculation(amt) {
        const rate = 0.045; // 4.5%
        const months = 60; // 5 years
        const monthlyRate = rate / 12;
        const monthlyPayment = (amt * 10000 * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);

        const resultText = `
            <b>🔢 상환 시뮬레이션</b><br><br>
            • <b>대출금</b>: ${amt.toLocaleString()}만원<br>
            • <b>금리</b>: 연 4.5%<br>
            • <b>기간</b>: 5년 (60개월)<br>
            <hr>
            월 납입금: 약 <b style='color:#00305b;font-size:1.1em;'>${Math.round(monthlyPayment).toLocaleString()}원</b>
        `;
        addMessage(resultText, 'received');
        addOptions([{ label: "다른 금액 계산", value: "calc_start" }, { label: "메인으로", value: "start" }]);
    }

    // --- Init ---
    // Initialize buttons that are present in HTML
    const initBtns = document.querySelectorAll('#chatQuickReplies .quick-reply-btn');
    initBtns.forEach(b => {
        b.onclick = () => {
            const r = b.getAttribute('data-reply');
            addMessage(b.innerText.trim(), 'sent');
            handleLogic(r);
        };
    });

    window.openChatbotModal = function () {
        const consultModal = document.getElementById('consultModal');
        if (consultModal) {
            openManagedModal(consultModal);
        }

        // 매번 모달을 열 때마다 채팅 내역을 초기화하여 새로운 상담 시작
        if (chatMessages) {
            chatMessages.innerHTML = '';
            
            // Set initial clock
            const timeEl = document.querySelector('.status-bar .time');
            if (timeEl) timeEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            handleLogic('start');
            // Reset scroll instantly
            chatMessages.scrollTo({ top: 0, behavior: 'instant' });
        }
    };
});
