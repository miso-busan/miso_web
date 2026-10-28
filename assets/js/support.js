'use strict';
(() => {
  const data = window.MISO_SUPPORT;
  if (!data) return;
  const productById = id => data.products.find(p => p.id === id);
  const minimumRateText = product => Number.isFinite(product.minimumRate) ? `최저 연 ${product.minimumRate.toFixed(1)}% (${product.minimumRateCondition})` : '';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const money = value => `${Math.round(value).toLocaleString('ko-KR')}원`;
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const linkedPlan = new URLSearchParams(location.search);
  if (productById(linkedPlan.get('product'))) {
    document.querySelectorAll('[data-prepare-link]').forEach(link => {
      const url = new URL(link.href); url.searchParams.set('product', linkedPlan.get('product'));
      if (linkedPlan.get('product') === 'miso_vulnerable' && linkedPlan.get('documents') === 'victims') url.searchParams.set('documents', 'victims');
      link.href = url.href;
    });
  }
  const plan = document.querySelector('.consultation-plan');
  let selectPlan = null;
  if (plan) {
    const $ = selector => plan.querySelector(selector);
    const base = plan.dataset.base;
    const productSelect = $('.planning-product');
    const amount = $('.planning-amount'), range = $('.planning-range');
    const months = $('.planning-months'), grace = $('.planning-grace'), rate = $('.planning-rate');
    const victim = $('.include-victim-docs'), checklist = $('.planning-checklist');
    let product, saved = {}, savedPlans = {}, lastProduct = '', storageAvailable = true;
    const storageKey = `miso-documents-${data.productDate}`;
    const estimateKey = `miso-plan-${data.productDate}`;
    const storageNote = () => { $('.planning-storage-note').textContent = '이 브라우저에서는 자동 저장이 되지 않습니다. 화면을 닫기 전에 준비표를 인쇄해 주세요.'; };
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = parsed;
      const estimate = JSON.parse(localStorage.getItem(estimateKey) || '{}');
      if (estimate && estimate.version === 1 && estimate.products && typeof estimate.products === 'object' && !Array.isArray(estimate.products)) {
        savedPlans = estimate.products;
        if (productById(estimate.lastProduct)) lastProduct = estimate.lastProduct;
      }
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch (_) { storageAvailable = false; }
    if (!storageAvailable) storageNote();
    function saveChecks() {
      if (storageAvailable) try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (_) {
        storageAvailable = false;
        storageNote();
      }
    }
    function saveEstimate() {
      if (!storageAvailable || !product) return;
      savedPlans[product.id] = { amount: Number(amount.value), months: Number(months.value), grace: Number(grace.value), rate: Number(rate.value), victims: victim.checked };
      try { localStorage.setItem(estimateKey, JSON.stringify({ version: 1, lastProduct: product.id, products: savedPlans })); }
      catch (_) { storageAvailable = false; storageNote(); }
    }
    function updatePlanUrl(nextHash) {
      const url = new URL(location.href); url.searchParams.set('product', product.id);
      if (product.id === 'miso_vulnerable' && victim.checked) url.searchParams.set('documents', 'victims');
      else url.searchParams.delete('documents');
      if (nextHash) url.hash = nextHash;
      try { history.replaceState(null, '', url); } catch (_) { /* File preview may restrict history. */ }
    }
    function option(select, value, label) {
      const node = el('option', '', label); node.value = value; select.append(node);
    }
    function setPeriods() {
      const previous = Number(months.value) || 60;
      const max = Math.min(product.planning.maxRepaymentMonths, product.planning.maxTotalMonths - Number(grace.value));
      months.replaceChildren();
      for (let m = 12; m <= max; m += 12) option(months, m, `${m / 12}년 (${m}개월)`);
      if (max % 12) option(months, max, `${max}개월`);
      months.value = String(Math.min(previous, max));
      if (!months.value) months.value = months.options[months.options.length - 1].value;
    }
    function countChecks() {
      const inputs = [...checklist.querySelectorAll('input')];
      const checked = inputs.filter(input => input.checked).length;
      $('.document-count').textContent = `${inputs.length}개 중 ${checked}개 준비`;
      $('.document-progress-track i').style.width = `${inputs.length ? checked / inputs.length * 100 : 0}%`;
      $('.ready-documents').textContent = `${inputs.length}개 중 ${checked}개 준비`;
    }
    function renderDocuments() {
      checklist.replaceChildren();
      const ids = [...product.planning.documentGroups];
      if (product.id === 'miso_vulnerable' && victim.checked) ids.push('documents-victims');
      for (const id of ids) {
        const group = data.documents.find(d => d.id === id);
        const section = el('div', 'planning-document-group');
        section.append(el('h4', '', group.title));
        for (const item of group.items) {
          const key = `${product.id}|${id}|${item}`;
          const label = el('label', 'document-check');
          const input = el('input'); input.type = 'checkbox'; input.checked = saved[key] === true;
          input.addEventListener('change', () => { saved[key] = input.checked; saveChecks(); countChecks(); });
          label.append(input, el('span', '', item)); section.append(label);
        }
        if (group.note) section.append(el('p', 'document-group-note', group.note));
        checklist.append(section);
      }
      countChecks();
    }
    function renderCalculation() {
      const principal = Number(amount.value) * 10000;
      const valid = amount.value !== '' && Number.isFinite(principal) && principal >= 10000 &&
        principal <= product.planning.limitWon && Number.isInteger(Number(amount.value));
      const error = $('.planning-error');
      error.hidden = valid;
      $('.planning-results').hidden = !valid;
      if (!valid) {
        error.textContent = `1만원부터 ${(product.planning.limitWon / 10000).toLocaleString('ko-KR')}만원까지 입력해 주세요.`;
        $('.ready-amount').textContent = '금액을 확인해 주세요'; $('.ready-payment').textContent = '—';
        return;
      }
      range.value = amount.value;
      const graceRate = product.id === 'social_finance' ? Number(rate.value) : product.planning.graceAnnualRate;
      const result = window.MisoCalculator.calculatePlan(principal, Number(rate.value), Number(months.value), Number(grace.value), graceRate);
      $('.planning-payment').textContent = money(result.monthly);
      $('.planning-grace-payment').textContent = Number(grace.value) ? `거치 ${grace.value}개월 동안 예상 월 이자 ${money(result.graceMonthly)} · 연 ${graceRate}%` : '거치기간 없이 첫 달부터 원금과 이자를 함께 상환합니다.';
      $('.planning-principal').textContent = money(result.principal);
      $('.planning-interest').textContent = money(result.interest);
      $('.planning-total').textContent = money(result.total);
      const share = result.interest / result.total * 100;
      const circumference = 2 * Math.PI * 45;
      $('.interest-ring').setAttribute('stroke-dasharray', `${circumference * share / 100} ${circumference}`);
      $('.interest-percent').textContent = `${share.toFixed(1)}%`;
      $('.principal-share').textContent = `${(100 - share).toFixed(1)}%`;
      $('.interest-share').textContent = `${share.toFixed(1)}%`;
      $('.planning-donut').setAttribute('aria-label', `총 상환금 중 원금 ${(100 - share).toFixed(1)}%, 이자 ${share.toFixed(1)}%`);
      const points = result.balances.map((balance, i) => `${(12 + i / result.totalMonths * 416).toFixed(2)},${(12 + (1 - balance / principal) * 122).toFixed(2)}`).join(' ');
      $('.planning-balance').innerHTML = `<path d="M12 12H428M12 73H428M12 134H428" stroke="#e0e7ec" fill="none"/><polygon points="12,134 ${points} 428,134" fill="#edf3f6"/><polyline points="${points}" fill="none" stroke="#31576e" stroke-width="3" stroke-linejoin="round"/>`;
      $('.planning-balance').setAttribute('aria-label', `${result.totalMonths}개월 동안 남은 원금이 ${money(principal)}에서 0원으로 감소. 거치 ${grace.value}개월 포함.`);
      $('.planning-duration').textContent = `${result.totalMonths}개월 후 상환 완료`;
      $('.ready-product').textContent = product.name;
      $('.ready-amount').textContent = `${Number(amount.value).toLocaleString('ko-KR')}만원`;
      $('.ready-period').textContent = `거치 ${grace.value}개월 · 상환 ${months.value}개월`;
      $('.ready-payment').textContent = money(result.monthly);
      saveEstimate();
    }
    selectPlan = (id, includeVictims = null, moveToPlan = false) => {
      product = productById(id) || productById('miso_operation');
      const previous = savedPlans[product.id] || {};
      productSelect.value = product.id;
      $('.planning-name').textContent = product.name;
      $('.planning-terms').textContent = `최대 ${product.limit} · ${product.rate} · ${product.period}`;
      for (const selector of ['.planning-minimum', '.planning-rate-minimum']) {
        const node = $(selector);
        node.textContent = minimumRateText(product); node.hidden = !node.textContent;
      }
      $('.planning-target').textContent = product.target;
      $('.planning-detail').href = `${base}services/index.html#${product.id}`;
      amount.max = range.max = product.planning.limitWon / 10000;
      amount.value = range.value = Number.isInteger(previous.amount) && previous.amount >= 1 && previous.amount <= Number(amount.max) ? previous.amount : Math.min(1000, Number(amount.max));
      $('.planning-limit').textContent = `최대 ${product.limit}`;
      grace.replaceChildren(); option(grace, 0, '거치 없음');
      for (let m = 6; m <= product.planning.maxGraceMonths; m += 6) option(grace, m, `${m}개월`);
      if ([...grace.options].some(o => Number(o.value) === previous.grace)) grace.value = String(previous.grace);
      months.value = '60'; setPeriods();
      if ([...months.options].some(o => Number(o.value) === previous.months)) months.value = String(previous.months);
      rate.replaceChildren(); option(rate, product.planning.annualRate, `기본 연 ${product.planning.annualRate}%`);
      if (product.planning.preferentialRate) option(rate, product.planning.preferentialRate, `우대요건 충족 시 연 ${product.planning.preferentialRate}%`);
      if ([...rate.options].some(o => Number(o.value) === previous.rate)) rate.value = String(previous.rate);
      $('.victim-option').hidden = product.id !== 'miso_vulnerable'; victim.checked = includeVictims === null ? previous.victims === true : includeVictims;
      const phone = product.category === 'social' ? data.socialPhone : data.phone;
      $('.planning-call').href = `tel:${phone}`; $('.planning-call span').textContent = phone;
      renderDocuments(); renderCalculation();
      updatePlanUrl(moveToPlan ? 'plan' : null);
    };
    productSelect.addEventListener('change', () => selectPlan(productSelect.value));
    amount.addEventListener('input', renderCalculation);
    range.addEventListener('input', () => { amount.value = range.value; renderCalculation(); });
    months.addEventListener('change', renderCalculation);
    grace.addEventListener('change', () => { setPeriods(); renderCalculation(); });
    rate.addEventListener('change', renderCalculation);
    $('.planning-form').addEventListener('submit', event => { event.preventDefault(); renderCalculation(); });
    victim.addEventListener('change', () => { renderDocuments(); saveEstimate(); updatePlanUrl(); });
    $('.planning-reset-checks').addEventListener('click', () => {
      Object.keys(saved).filter(key => key.startsWith(`${product.id}|`)).forEach(key => delete saved[key]);
      saveChecks(); renderDocuments();
    });
    $('.planning-reset-estimate').addEventListener('click', () => {
      delete savedPlans[product.id]; selectPlan(product.id, victim.checked); amount.focus({ preventScroll: true });
    });
    const printPlan = () => {
      if (!$('.planning-error').hidden) { amount.focus(); return; }
      document.body.classList.add('printing-plan');
      window.print();
    };
    $('.planning-print').addEventListener('click', printPlan);
    $('.planning-print-copy').addEventListener('click', printPlan);
    addEventListener('afterprint', () => document.body.classList.remove('printing-plan'));
    const params = new URLSearchParams(location.search);
    selectPlan(params.get('product') || lastProduct, params.has('documents') ? params.get('documents') === 'victims' : null);
  }

  const productGuide = document.querySelector('.product-discovery');
  if (productGuide) {
    const sections = [...document.querySelectorAll('.product-detail')];
    const allButton = document.querySelector('.show-all-products');
    let selected = 'miso_operation', showAll = false;
    const fragmentTarget = () => {
      try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); }
      catch (_) { return null; }
    };
    function showProduct(target) {
      const section = target && target.closest('.product-detail');
      if (section) selected = section.id;
      sections.forEach(node => { node.hidden = !showAll && node.id !== selected; });
      document.querySelectorAll('[data-product-overview]').forEach(node => node.classList.toggle('is-selected', node.dataset.productOverview === selected));
      document.querySelectorAll('.product-selector a').forEach(link => {
        if (link.hash === `#${selected}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      // Deep links into a folded social-finance condition still open correctly.
      for (let parent = target && target.parentElement; parent; parent = parent.parentElement) {
        if (parent.tagName === 'DETAILS') parent.open = true;
      }
    }
    allButton.hidden = false;
    allButton.addEventListener('click', () => {
      showAll = !showAll; allButton.setAttribute('aria-expanded', String(showAll));
      allButton.textContent = showAll ? '상품별로 보기' : '전체 상품 펼쳐보기';
      showProduct(fragmentTarget());
    });
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link) return;
      let target;
      try { target = document.getElementById(decodeURIComponent(link.hash.slice(1))); }
      catch (_) { return; }
      if (target) showProduct(target);
    });
    addEventListener('hashchange', () => showProduct(fragmentTarget()));
    showProduct(fragmentTarget());
    if (location.hash) requestAnimationFrame(() => {
      const target = fragmentTarget();
      if (target) target.scrollIntoView({ block: 'start' });
    });

    const checks = [...productGuide.querySelectorAll('.product-compare-choice input')];
    const tray = document.querySelector('.compare-tray');
    const compareOpen = tray.querySelector('.compare-open');
    const feedback = productGuide.querySelector('.compare-feedback');
    const dialog = document.querySelector('.product-comparison');
    function updateComparison() {
      const count = checks.filter(input => input.checked).length;
      tray.hidden = count === 0;
      tray.querySelector('.compare-count').textContent = `${count}개 선택 · 최대 3개`;
      compareOpen.disabled = count < 2;
      compareOpen.textContent = count < 2 ? '하나 더 선택해 주세요' : '선택한 상품 비교하기';
    }
    checks.forEach(input => {
      input.closest('label').hidden = false;
      input.addEventListener('change', () => {
        if (checks.filter(node => node.checked).length > 3) {
          input.checked = false; feedback.hidden = false;
          feedback.textContent = '한 번에 3개까지 비교할 수 있습니다. 다른 상품의 선택을 해제해 주세요.';
        } else { feedback.hidden = true; feedback.textContent = ''; }
        updateComparison();
      });
    });
    tray.querySelector('.compare-clear').addEventListener('click', () => {
      checks.forEach(input => { input.checked = false; }); feedback.hidden = true;
      updateComparison(); checks[0].focus();
    });
    compareOpen.addEventListener('click', () => {
      const columns = dialog.querySelector('.comparison-columns'); columns.replaceChildren();
      for (const input of checks.filter(node => node.checked)) {
        const product = productById(input.value), article = el('article', 'comparison-product');
        article.append(el('span', 'overview-label', product.label), el('h3', '', product.name));
        const list = el('dl');
        const rows = [
          ['최대 한도', product.limit], ['기본 금리', product.rate],
          ['최저 금리', `연 ${product.minimumRate.toFixed(1)}% · ${product.minimumRateCondition}`],
          ['거치·추가 조건', product.graceRate], ['대출기간', product.period],
          ['지원대상', product.target], ['자금용도', product.purpose]
        ];
        for (const [title, text] of rows) {
          const row = el('div'); row.append(el('dt', '', title), el('dd', '', text)); list.append(row);
        }
        const link = el('a', 'comparison-prepare', '상환 계산·서류 준비 →');
        link.href = `../prepare/index.html?product=${product.id}#plan`;
        article.append(list, link); columns.append(article);
      }
      dialog.showModal(); document.body.classList.add('modal-open');
    });
    dialog.querySelector('.comparison-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  }

  for (const finder of document.querySelectorAll('.support-finder')) {
    const $ = selector => finder.querySelector(selector);
    const screen = $('.finder-screen'), result = $('.finder-result');
    const steps = [...finder.querySelectorAll('.finder-progress li')];
    const choices = $('.finder-choices');
    let answers = [];
    const profiles = [
      ['business','가게·사업을 운영하고 있어요','소상공인·자영업자'],
      ['youth','취업·창업을 준비하는 청년이에요','만 19–34세 청년'],
      ['life','생활 안정 자금이 필요해요','금융취약계층 생계 지원'],
      ['social','사회적경제기업을 운영해요','사회적기업·예비사회적기업·사회적협동조합']
    ];
    const purposes = {
      business: [['operation','제품·원재료 등 운영자금'],['startup','새 사업의 창업자금'],['facility','시설·설비 개선자금']],
      youth: [['entry','취업·사회 진입 준비'],['operation','청년 사업자의 운영자금'],['startup','창업 준비·초기 정착']],
      life: [['living','생활비·생계 안정'],['disaster','재난으로 인한 생활 어려움'],['victim','전세사기·불법사금융·보이스피싱 피해']],
      social: [['operation','기업 운영자금'],['facility','시설자금'],['rental','사업장 임차자금']]
    };
    function question() {
      if (!answers.length) return ['현재 어떤 상황이신가요?','해당하는 항목을 선택해 주세요.',profiles];
      if (answers.length === 1) return ['어떤 자금이 필요하신가요?','필요한 자금의 용도를 선택해 주세요.',purposes[answers[0]]];
      if (answers[0] === 'business') return ['연령대가 어떻게 되시나요?','청년 자영업자는 청년운영자금 조건을 함께 확인합니다.',[['young','만 19–34세'],['adult','만 35세 이상'],['unknown','연령 기준을 확인하고 싶어요']]];
      if (answers[0] === 'youth' && answers[1] === 'operation') return ['사업 운영기간을 확인해 주세요.','사업자등록 후 운영기간과 소득·신용 요건을 상담에서 확인합니다.',[['ready','3개월 이상 운영 중'],['early','사업 초기 또는 3개월 미만'],['unknown','정확히 모르겠어요']]];
      if (answers[0] === 'youth') return ['현재 취업·창업 상황을 확인해 주세요.','청년 미래이음 대출은 미취업 또는 취업·창업 1년 이내 등의 요건을 확인합니다.',[['not-working','아직 취업·창업 전'],['within-year','취업·창업한 지 1년 이내'],['over-year','취업·창업한 지 1년 초과'],['unknown','정확히 모르겠어요']]];
      if (answers[0] === 'social') return ['어떤 유형의 기업인가요?','기업 유형과 최근 3개년 평균 매출 등 별도 요건을 확인합니다.',[['certified','인증 사회적기업'],['pre','예비사회적기업'],['cooperative','사회적협동조합'],['other','그 밖의 기업·조합']]];
      return ['해당하는 지원대상 유형을 선택해 주세요.','생활 안정 지원은 대상 유형과 신용·소득 요건을 함께 확인합니다.',[['care','사회적 배려대상·재난·피해 유형'],['income','신용평점 하위 50%·연소득 3,500만원 이하'],['borrower','미소금융 성실상환자'],['unknown','대상 여부를 상담하고 싶어요']]];
    }
    function renderQuestion(focus = true) {
      result.hidden = true; screen.hidden = false;
      const [title,note,items] = question();
      $('h4').textContent = title; $('.finder-question-note').textContent = note;
      choices.replaceChildren(); choices.setAttribute('aria-label', title);
      for (const [id,label,detail] of items) {
        const button = el('button','finder-choice'); button.type = 'button'; button.dataset.choice = id;
        button.append(el('strong','',label));
        if (detail) {
          const caption = el('span', '');
          const terms = detail.split('·');
          terms.forEach((term, index) => {
            caption.append(document.createTextNode(term));
            if (index < terms.length - 1) caption.append(document.createTextNode('·'), el('wbr'));
          });
          button.append(caption);
        }
        button.addEventListener('click', () => { answers.push(id); if (answers.length === 3) renderResult(); else renderQuestion(); });
        choices.append(button);
      }
      steps.forEach((step,i) => { if (i === answers.length) step.setAttribute('aria-current','step'); else step.removeAttribute('aria-current'); step.classList.toggle('is-complete', i < answers.length); });
      $('.finder-back').hidden = answers.length === 0;
      $('.finder-step-count').textContent = `${answers.length + 1} / 3`;
      if (focus) $('h4').focus({ preventScroll: true });
    }
    function renderResult() {
      const [profile,purpose,detail] = answers;
      let ids=[], note='';
      if (profile === 'business' && purpose === 'operation') ids = detail === 'young' ? ['miso_youth_operation'] : detail === 'adult' ? ['miso_operation'] : ['miso_operation','miso_youth_operation'];
      if (profile === 'youth' && purpose === 'operation') ids = detail === 'early' ? ['miso_youth_future'] : ['miso_youth_operation'];
      if (profile === 'youth' && purpose !== 'operation' && detail !== 'over-year') ids = ['miso_youth_future'];
      if (profile === 'life') ids = ['miso_vulnerable'];
      if (profile === 'social' && detail !== 'other') ids = ['social_finance'];
      if (profile === 'business' && purpose !== 'operation') note = '일반 미소금융 창업자금·시설개선자금의 신규 신청·실행은 2026년 7월 1일부터 중단되었습니다. 현재 상황에 맞는 다른 지원은 전화로 상담해 주세요.';
      else if (!ids.length) note = '선택하신 내용만으로는 상품을 안내하기 어렵습니다. 전화로 현재 상황을 말씀해 주시면 지원요건과 이용 가능한 상담 경로를 안내해 드립니다.';
      else note = '선택한 상황과 관련된 상품입니다. 아래 지원요건을 확인해 주세요. 이 결과는 대출 승인이나 한도 확정을 의미하지 않습니다.';
      screen.hidden = true; result.hidden = false;
      result.querySelector('h4').textContent = ids.length ? '관련 지원상품' : '추가 상담이 필요합니다.';
      $('.finder-result-note').textContent = note;
      const cards = $('.finder-result-cards'); cards.replaceChildren();
      for (const id of ids) {
        const product = productById(id), card = el('article','finder-product');
        card.append(el('span','',product.label),el('h5','',product.name),el('p','finder-product-terms',`최대 ${product.limit} · ${product.rate}`));
        if (minimumRateText(product)) card.append(el('span','rate-minimum',minimumRateText(product)));
        card.append(el('p','',product.target));
        const action = el('a','finder-prepare','상품·준비서류 확인 →');
        const victims = profile === 'life' && purpose === 'victim';
        action.href = `${finder.dataset.base}prepare/index.html?product=${id}${victims ? '&documents=victims' : ''}#plan`;
        if (plan && location.pathname.endsWith('/prepare/index.html')) action.addEventListener('click', event => {
          event.preventDefault(); selectPlan(id,victims,true); document.querySelector('.plan-section').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
          productSelectFocus();
        });
        card.append(action); cards.append(card);
      }
      if (!ids.length) { const call = el('a','finder-prepare',`전화 상담 ${profile === 'social' ? data.socialPhone : data.phone} ↗`); call.href = `tel:${profile === 'social' ? data.socialPhone : data.phone}`; cards.append(call); }
      steps.forEach(step => { step.removeAttribute('aria-current'); step.classList.add('is-complete'); });
      result.querySelector('h4').focus({ preventScroll: true });
    }
    function productSelectFocus() { plan.querySelector('.planning-product').focus({ preventScroll: true }); }
    $('.finder-back').addEventListener('click', () => { answers.pop(); renderQuestion(); });
    $('.finder-reset').addEventListener('click', () => { answers=[]; renderQuestion(); });
    $('.finder-fallback').hidden = true; renderQuestion(false);
  }

  const photoDialog = document.querySelector('.story-image-dialog');
  if (photoDialog) {
    document.querySelector('.story-zoom').addEventListener('click', () => { photoDialog.showModal(); document.body.classList.add('modal-open'); });
    document.querySelector('.story-image-close').addEventListener('click', () => photoDialog.close());
    photoDialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
    photoDialog.addEventListener('click', event => { if (event.target === photoDialog) photoDialog.close(); });
  }
})();
