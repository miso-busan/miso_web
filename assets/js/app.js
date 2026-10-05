'use strict';
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const base = document.body.dataset.base || '';
  if (document.body.classList.contains('immersive-home')) {
    const header = $('.header');
    const updateOffsets = () => {
      document.documentElement.style.scrollPaddingTop = `${Math.ceil(header.getBoundingClientRect().height) + 18}px`;
    };
    new ResizeObserver(updateOffsets).observe(header);
    updateOffsets();
  }

  // Accessible mobile navigation: close on Escape, outside click, link, or resize.
  const menu = $('.menu-toggle');
  const nav = $('#navigation');
  const siteHeader = $('.header');
  function fitMenu() {
    if (menu.getAttribute('aria-expanded') !== 'true') return;
    const height = window.visualViewport ? window.visualViewport.height : innerHeight;
    nav.style.setProperty('--menu-available-height', `${Math.max(0, height - nav.getBoundingClientRect().top - 12)}px`);
  }
  function setMenu(open, moveFocus = false) {
    nav.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    if (open) {
      fitMenu();
      nav.scrollTop = 0;
      if (moveFocus) nav.querySelector('a').focus({preventScroll:true});
    } else nav.style.removeProperty('--menu-available-height');
  }
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true', true));
  nav.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.header')) setMenu(false); });
  document.addEventListener('focusin', (event) => { if (!siteHeader.contains(event.target)) setMenu(false); });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || menu.getAttribute('aria-expanded') !== 'true') return;
    const restore = nav.contains(document.activeElement) || document.activeElement === menu;
    setMenu(false);
    if (restore) menu.focus({preventScroll:true});
  });
  addEventListener('resize', fitMenu);
  addEventListener('scroll', fitMenu, {passive:true});
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitMenu);
  matchMedia('(min-width:761px)').addEventListener('change', (event) => { if (event.matches) setMenu(false); });

  // Homepage product explorer. Social enterprise has its own featured section.
  const productCards = $$('[data-product-category]');
  function filterProducts(category) {
    $('.product-grid').dataset.filter = category;
    let count = 0;
    productCards.forEach((card) => {
      const show = category === 'all' ? card.dataset.productCategory !== 'social' : card.dataset.productCategory === category;
      card.hidden = !show;
      if (show) count++;
    });
    $$('[data-product-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.productFilter === category)));
    $('#product-status').textContent = `${count}개 상품이 표시됩니다. 상품 선택 시 자세한 안내로 이동합니다.`;
  }
  if (productCards.length) {
    filterProducts('all');
    $$('[data-product-filter]').forEach((button) => button.addEventListener('click', () => filterProducts(button.dataset.productFilter)));
  }

  // Search is local to the public site. No personal information is requested.
  const dialog = $('#search-dialog');
  const searchInput = $('#site-search');
  const results = $('#search-results');
  function renderSearch() {
    const words = searchInput.value.trim().toLocaleLowerCase('ko').split(/\s+/).filter(Boolean);
    const entries = window.MISO_SEARCH || [];
    const found = entries.filter((item) => words.every((word) => (item.title + ' ' + item.text).toLocaleLowerCase('ko').includes(word)));
    results.replaceChildren();
    const message = document.createElement('p');
    message.className = 'fineprint';
    message.textContent = words.length ? `${found.length}개의 안내를 찾았습니다.` : '자주 찾는 안내';
    results.append(message);
    (words.length ? found.slice(0, 20) : entries.slice(0, 4)).forEach((item) => {
      const a = document.createElement('a');
      a.href = base + item.url;
      const title = document.createElement('strong');
      title.textContent = item.title;
      const text = document.createElement('p');
      text.textContent = item.text.length > 90 ? item.text.slice(0, 90) + '…' : item.text;
      a.append(title, text);
      results.append(a);
    });
    if (words.length && !found.length) {
      const empty = document.createElement('p');
      empty.className = 'fineprint';
      empty.textContent = '다른 검색어를 입력하거나 전화로 문의해 주세요.';
      results.append(empty);
    }
  }
  $$('[data-search-open]').forEach((button) => button.addEventListener('click', () => {
    setMenu(false);
    searchInput.value = '';
    renderSearch();
    dialog.showModal();
    document.body.classList.add('modal-open');
    searchInput.focus();
  }));
  $('[data-search-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
    }
  });
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  results.addEventListener('click', (event) => { if (event.target.closest('a')) dialog.close(); });
  searchInput.addEventListener('input', renderSearch);
  $$('[data-keyword]').forEach((button) => button.addEventListener('click', () => { searchInput.value = button.dataset.keyword; renderSearch(); searchInput.focus(); }));

  // News filters and keyword search work together.
  const rows = $$('[data-news-category]');
  const noticeSearch = $('#notice-search');
  let newsCategory = 'all';
  function filterNews() {
    const query = noticeSearch.value.trim().toLocaleLowerCase('ko');
    let count = 0;
    rows.forEach((row) => {
      const matchesCategory = newsCategory === 'all' || row.dataset.newsCategory === newsCategory;
      const matchesText = row.dataset.newsText.toLocaleLowerCase('ko').includes(query);
      row.hidden = !(matchesCategory && matchesText);
      if (!row.hidden) count++;
    });
    $('#news-status').textContent = `${count}개의 소식`;
    $('#news-empty').hidden = count !== 0;
    $$('[data-news-filter]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.newsFilter === newsCategory)));
  }
  if (rows.length) {
    noticeSearch.addEventListener('input', filterNews);
    $$('[data-news-filter]').forEach((button) => button.addEventListener('click', () => { newsCategory = button.dataset.newsFilter; filterNews(); }));
    filterNews();
  }

  const storyRail = $('#story-rail');
  if (storyRail) {
    const buttons = $$('[data-story-direction]');
    const cards = [...storyRail.querySelectorAll('.case-card')];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const stride = () => cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(storyRail).columnGap);
    function updateStories() {
      const max = storyRail.scrollWidth - storyRail.clientWidth;
      buttons[0].disabled = storyRail.scrollLeft < 2;
      buttons[1].disabled = storyRail.scrollLeft >= max - 2;
      const first = Math.round(storyRail.scrollLeft / stride()) + 1;
      $('#story-position').textContent = `${first} / ${cards.length}`;
    }
    function moveStories(direction) {
      storyRail.scrollBy({left: direction * stride(), behavior: reduced.matches ? 'auto' : 'smooth'});
    }
    buttons.forEach(button => button.addEventListener('click', () => moveStories(Number(button.dataset.storyDirection))));
    storyRail.addEventListener('keydown', event => {
      if (event.target === storyRail && ['ArrowLeft','ArrowRight'].includes(event.key)) {
        event.preventDefault();
        moveStories(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    storyRail.addEventListener('scroll', updateStories, {passive:true});
    new ResizeObserver(updateStories).observe(storyRail);
    updateStories();
  }

  const form = $('#loan-calculator');
  if (form) {
    const money = (value) => `${Math.round(value).toLocaleString('ko-KR')}원`;
    function updateCalculator(event) {
      if (event) event.preventDefault();
      if (!form.reportValidity()) return;
      try {
        const result = window.MisoCalculator.calculateLoan(Number(form.elements.amount.value) * 10000, Number(form.elements.rate.value), Number(form.elements.months.value));
        $('#monthly-payment').textContent = money(result.monthly);
        $('#principal-result').textContent = money(result.principal);
        $('#interest-result').textContent = money(result.interest);
        $('#total-result').textContent = money(result.total);
      } catch (error) {
        $('#monthly-payment').textContent = error.message;
        ['principal-result','interest-result','total-result'].forEach((id) => document.getElementById(id).textContent = '—');
      }
    }
    form.addEventListener('submit', updateCalculator);
    updateCalculator();
  }
})();
