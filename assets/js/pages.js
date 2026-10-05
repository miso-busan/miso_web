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
