'use strict';
// Native links remain the navigation. Supporting browsers carry the selected
// photograph and its title into the feature page; other browsers open it normally.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selectedLink = null;
  let named = [];
  function clearNames() {
    named.forEach(node => node.style.removeProperty('view-transition-name'));
    named = [];
  }
  function namePhoto(link) {
    clearNames();
    const surface = link.closest('.case-card') || link.closest('.story-documentary');
    if (!surface) return;
    const photo = surface.querySelector('img');
    const title = surface.querySelector('.case-role, .story-hero-title');
    for (const [node, name] of [[photo, 'story-picture'], [title, 'story-heading']]) {
      if (node) { node.style.viewTransitionName = name; named.push(node); }
    }
  }
  function storyId(url) {
    try {
      const parsed = new URL(url, location.href);
      if (parsed.origin !== location.origin) return null;
      const match = parsed.pathname.match(/\/stories\/([a-z0-9-]+)\.html$/);
      return match && match[1] !== 'index' ? match[1] : null;
    } catch (_) { return null; }
  }
  document.addEventListener('click', event => {
    selectedLink = null;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[data-story-link]');
    if (link && !link.target && storyId(link.href)) selectedLink = link;
  }, true);
  addEventListener('pageswap', event => {
    if (!event.viewTransition || reduced.matches) return;
    const destination = event.activation && event.activation.entry;
    if (selectedLink && destination && storyId(destination.url) === selectedLink.dataset.storyLink) namePhoto(selectedLink);
    event.viewTransition.finished.finally(clearNames).catch(() => {});
  });
  // Register synchronously in the head, before the first paint. Restore names
  // after each transition so returning from the browser's back cache is safe.
  addEventListener('pagereveal', event => {
    if (!event.viewTransition || reduced.matches) return;
    const from = window.navigation && navigation.activation && navigation.activation.from;
    const id = from && storyId(from.url);
    if (id && !document.querySelector('.story-feature-image')) {
      const link = [...document.querySelectorAll('a.case-photo[data-story-link]')].find(a => a.dataset.storyLink === id);
      if (link) namePhoto(link);
    }
    event.viewTransition.finished.finally(clearNames).catch(() => {});
  });
})();
