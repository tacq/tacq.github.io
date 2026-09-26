(function () {
  'use strict';

  // Footer year
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Project filter (projects.html). Categories come from hardcoded data attributes only.
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.card[data-category]');
  const counter = document.getElementById('project-count');

  function applyFilter(category) {
    let shown = 0;
    cards.forEach(function (card) {
      const cats = (card.getAttribute('data-category') || '').split(' ');
      const match = category === 'all' || cats.includes(category);
      card.hidden = !match;
      if (match) shown++;
    });
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === category));
    });
    if (counter) counter.textContent = String(shown).padStart(2, '0');
  }

  if (buttons.length && cards.length) {
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyFilter(btn.getAttribute('data-filter') || 'all');
      });
    });
    applyFilter('all');
  }

  // Resume print button
  const printBtn = document.getElementById('print-resume');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });
})();
