'use strict';
(() => {
  if (!document.body.classList.contains('interior-page')) return;
  // Larger type can change the sticky menu height. Measure it so anchor titles
  // remain visible, including on tablets and when the browser text is enlarged.
  const header = document.querySelector('.header');
  const anchorNav = document.querySelector('.anchor-nav');
  function updateReadingOffsets() {
    const headerHeight = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    const anchorHeight = anchorNav ? Math.ceil(anchorNav.getBoundingClientRect().height) : 0;
    document.body.style.setProperty('--reading-header-height',headerHeight+'px');
    document.documentElement.style.scrollPaddingTop=(headerHeight+anchorHeight+18)+'px';
  }
  const menuResize = new ResizeObserver(updateReadingOffsets);
  if (header) menuResize.observe(header);
  if (anchorNav) menuResize.observe(anchorNav);
  updateReadingOffsets();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const storyFilters = [...document.querySelectorAll('[data-story-filter]')];
  if (storyFilters.length) {
    const cards = [...document.querySelectorAll('[data-story-category]')];
    const count = document.querySelector('.stories-count');
    function filterStories(category, updateUrl = false) {
      const current = storyFilters.some(button => button.dataset.storyFilter === category) ? category : 'all';
      cards.forEach(card => {
        card.hidden = current !== 'all' && card.dataset.storyCategory !== current;
        if (!card.hidden) card.classList.remove('is-pending');
      });
      storyFilters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.storyFilter === current)));
      const active = storyFilters.find(button => button.dataset.storyFilter === current);
      const label = active.firstChild.textContent.trim();
      count.textContent = `${label} ${cards.filter(card => !card.hidden).length}개의 이야기`;
      document.querySelector('.case-grid').classList.toggle('is-filtered', current !== 'all');
      if (updateUrl) {
        const url = new URL(location.href);
        if (current === 'all') url.searchParams.delete('category'); else url.searchParams.set('category', current);
        try { history.replaceState(null, '', url); } catch (_) { /* Navigation remains usable in file previews. */ }
      }
    }
    storyFilters.forEach(button => button.addEventListener('click', () => filterStories(button.dataset.storyFilter, true)));
    filterStories(new URLSearchParams(location.search).get('category'));
  }

  const bookingTabs = [...document.querySelectorAll('.booking-step-tab')];
  if (bookingTabs.length) {
    const panels = [...document.querySelectorAll('.booking-panel')];
    document.querySelector('.booking-navigation').setAttribute('role', 'tablist');
    document.querySelector('.booking-navigation').setAttribute('aria-orientation', 'vertical');
    function selectStep(index, focus = false) {
      bookingTabs.forEach((tab, i) => {
        tab.setAttribute('role', 'tab'); tab.setAttribute('aria-selected', String(i === index));
        tab.setAttribute('aria-controls', panels[i].id); tab.tabIndex = i === index ? 0 : -1;
        panels[i].hidden = i !== index; panels[i].setAttribute('role', 'tabpanel');
        panels[i].setAttribute('aria-labelledby', tab.id); panels[i].tabIndex = 0;
      });
      if (focus) bookingTabs[index].focus({ preventScroll: true });
    }
    bookingTabs.forEach((tab, index) => {
      tab.addEventListener('click', event => { event.preventDefault(); selectStep(index); });
      tab.addEventListener('keydown', event => {
        let next = index;
        if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % bookingTabs.length;
        else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + bookingTabs.length) % bookingTabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = bookingTabs.length - 1;
        else return;
        event.preventDefault(); selectStep(next, true);
      });
      const next = panels[index].querySelector('button.booking-next');
      if (next) {
        next.hidden = false;
        next.addEventListener('click', () => {
          selectStep(index + 1); panels[index + 1].focus({ preventScroll: true });
          panels[index + 1].scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
        });
      }
    });
    function selectLinkedStep() {
      const linked = panels.findIndex(panel => `#${panel.id}` === location.hash);
      selectStep(linked < 0 ? 0 : linked);
    }
    selectLinkedStep(); addEventListener('hashchange', selectLinkedStep);
  }

  function openLinkedDetails() {
    let target;
    try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch (_) { return; }
    for (let node = target; node; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
  }
  openLinkedDetails(); addEventListener('hashchange', openLinkedDetails);
  let printDetails = [];
  addEventListener('beforeprint', () => {
    printDetails = [...document.querySelectorAll('main details')].filter(node => !node.open);
    printDetails.forEach(node => { node.open = true; });
  });
  addEventListener('afterprint', () => {
    printDetails.forEach(node => { node.open = false; }); printDetails = [];
  });
  const hero = document.querySelector('.interior-hero');
  const pointer = matchMedia('(hover:hover) and (pointer:fine)');
  if (hero) {
    hero.addEventListener('pointermove', event => {
      if (reduced.matches || !pointer.matches) return;
      const box = hero.getBoundingClientRect();
      hero.style.setProperty('--art-x', ((event.clientX-box.left)/box.width-.5).toFixed(3));
      hero.style.setProperty('--art-y', ((event.clientY-box.top)/box.height-.5).toFixed(3));
    }, {passive:true});
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--art-x','0');hero.style.setProperty('--art-y','0');
    });
  }
  const targets = [...document.querySelectorAll('main .section-heading, main .detail-grid, main .about-lead, main .greeting-grid, main .history-grid, main .orgchart, main .case-card, main .partner-card, main .document-block, main .calculator-grid, main .steps>li, main .article-header')];
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.remove('is-pending');
      entry.target.classList.add('is-revealed');
      revealObserver.unobserve(entry.target);
    }
  }, {threshold:.05,rootMargin:'0px 0px -30px 0px'});
  targets.forEach(target => {
    target.classList.add('reveal-target');
    if (!reduced.matches && target.getBoundingClientRect().top > innerHeight) {
      target.classList.add('is-pending');revealObserver.observe(target);
    }
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) targets.forEach(target => target.classList.remove('is-pending'));
  });
  const progress = document.createElement('div');
  progress.className = 'interior-reading-progress';
  progress.setAttribute('aria-hidden','true');progress.append(document.createElement('span'));
  document.body.append(progress);
  let queued = false;
  function updateProgress() {
    queued = false;
    const max = document.documentElement.scrollHeight-innerHeight;
    progress.style.setProperty('--reading-progress', max>0 ? Math.min(1,Math.max(0,scrollY/max)).toFixed(4) : '0');
  }
  addEventListener('scroll', () => {if (!queued) {queued=true;requestAnimationFrame(updateProgress);}}, {passive:true});
  addEventListener('resize',updateProgress,{passive:true});updateProgress();
  const anchors = [...document.querySelectorAll('.anchor-nav a[href^="#"]')];
  if (anchors.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        anchors.forEach(a => {
          if (a.hash === '#'+entry.target.id) a.setAttribute('aria-current','true');
          else a.removeAttribute('aria-current');
        });
      }
    }, {rootMargin:'-160px 0px -55% 0px',threshold:0});
    anchors.forEach(a => {const section=document.getElementById(a.hash.slice(1));if(section)sectionObserver.observe(section);});
  }
})();
