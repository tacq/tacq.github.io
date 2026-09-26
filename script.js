(function () {
  'use strict';

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Theme toggle (stores only a non-sensitive UI preference)
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const ALLOWED = ['light', 'dark'];

  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) { /* storage unavailable */ }

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = ALLOWED.includes(saved) ? saved : (prefersDark ? 'dark' : 'light');
  root.setAttribute('data-theme', initial);

  if (toggle) {
    toggle.addEventListener('click', function () {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
    });
  }
})();
