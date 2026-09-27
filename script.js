/*
 * Site interactions. Progressive enhancement: every page is fully readable without JS.
 * Security: no innerHTML / eval; DOM is built with createElement + textContent only.
 */
(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Scroll progress bar + header state + back-to-top ---------- */
  const header = document.querySelector('.site-header');
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  const toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'to-top';
  toTop.setAttribute('aria-label', 'Back to top');
  toTop.textContent = '↑';
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  document.body.appendChild(toTop);

  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    if (header) header.classList.toggle('scrolled', y > 8);
    toTop.classList.toggle('show', y > 600);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  const nav = document.querySelector('.nav');
  const links = document.querySelector('.nav-links');
  if (nav && links) {
    if (!links.id) links.id = 'nav-links';
    const burger = document.createElement('button');
    burger.type = 'button';
    burger.className = 'nav-toggle';
    burger.setAttribute('aria-controls', links.id);
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    for (let i = 0; i < 3; i++) burger.appendChild(document.createElement('span'));
    nav.appendChild(burger);

    const setOpen = function (open) {
      nav.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    burger.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); burger.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 720) setOpen(false); });
  }

  /* ---------- Reveal on scroll ---------- */
  // Auto-tag common blocks so every page animates without editing its HTML.
  document.querySelectorAll(
    '.page-head > *, .panel, .card, .entry, .gallery figure, .photo-trio figure, .schematic-figure, .filters, .project-hero, .project-content > h2, .breadcrumb'
  ).forEach(function (el) { el.classList.add('reveal'); });

  const revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    // Stagger siblings that enter together.
    const io = new IntersectionObserver(function (entries) {
      let i = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty('--delay', (i++ * 70) + 'ms');
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Typing roles ---------- */
  const typer = document.querySelector('.typer[data-roles]');
  if (typer) {
    const roles = (typer.getAttribute('data-roles') || '').split('|').filter(Boolean);
    typer.setAttribute('aria-label', roles.join(', '));
    if (!reduceMotion && roles.length > 1) {
      let r = 0, c = roles[0].length, deleting = true, pause = 1800;
      const tick = function () {
        const word = roles[r];
        if (deleting) {
          c--;
          if (c <= 0) { deleting = false; r = (r + 1) % roles.length; pause = 250; }
        } else {
          c++;
          if (c >= roles[r].length) { deleting = true; pause = 1800; }
        }
        typer.textContent = (deleting ? word : roles[r]).slice(0, Math.max(c, 0));
        const delay = pause || (deleting ? 28 : 55);
        pause = 0;
        window.setTimeout(tick, delay);
      };
      window.setTimeout(tick, 1800);
    }
  }

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  function renderCount(el, v) {
    el.textContent = (el.getAttribute('data-prefix') || '') + v + (el.getAttribute('data-suffix') || '');
  }
  if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
    const cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10) || 0;
        const start = performance.now(), dur = 1200;
        let done = false;
        const step = function (now) {
          if (done) return;
          const t = Math.min(Math.max((now - start) / dur, 0), 1);
          renderCount(el, Math.round(target * (1 - Math.pow(1 - t, 3))));
          if (t < 1) window.requestAnimationFrame(step);
          else done = true;
        };
        window.requestAnimationFrame(step);
        // Safety net: always land on the real number even if rAF is throttled.
        window.setTimeout(function () { done = true; renderCount(el, target); }, dur + 150);
        cio.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { renderCount(el, 0); cio.observe(el); });
  }

  /* ---------- Card tilt + cursor spotlight ---------- */
  if (canHover && !reduceMotion) {
    document.querySelectorAll('.card, .cap').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (x * 100) + '%');
        card.style.setProperty('--my', (y * 100) + '%');
        card.style.setProperty('--rx', ((0.5 - y) * 6) + 'deg');
        card.style.setProperty('--ry', ((x - 0.5) * 8) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Hero particle network ---------- */
  const canvas = document.querySelector('.hero-canvas');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, pts = [], running = true, rafId = 0;
    const mouse = { x: -9999, y: -9999 };

    const resize = function () {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (w * h) / 16000));
      pts = [];
      for (let i = 0; i < n; i++) {
        pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 });
      }
    };

    const draw = function () {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!reduceMotion) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d2 = dx * dx + dy * dy;
          if (d2 < 14000) {
            ctx.strokeStyle = 'rgba(77,225,255,' + (0.14 * (1 - d2 / 14000)) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        ctx.fillStyle = md < 140 ? 'rgba(77,225,255,0.9)' : 'rgba(77,225,255,0.45)';
        ctx.beginPath(); ctx.arc(p.x, p.y, md < 140 ? 2 : 1.3, 0, Math.PI * 2); ctx.fill();
      }
      if (running && !reduceMotion) rafId = window.requestAnimationFrame(draw);
    };

    resize(); draw();
    window.addEventListener('resize', function () { resize(); if (reduceMotion) draw(); });
    canvas.parentElement.addEventListener('pointermove', function (e) {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });

    // Pause when off-screen or tab hidden to save battery.
    const setRunning = function (on) {
      if (on === running) return;
      running = on;
      window.cancelAnimationFrame(rafId);
      if (running && !reduceMotion) rafId = window.requestAnimationFrame(draw);
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { setRunning(en[0].isIntersecting && !document.hidden); }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () { setRunning(!document.hidden); });
  }

  /* ---------- Project filter (projects.html) ---------- */
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.card[data-category]');
  const counter = document.getElementById('project-count');
  function applyFilter(category) {
    let shown = 0;
    cards.forEach(function (card) {
      const cats = (card.getAttribute('data-category') || '').split(' ');
      const match = category === 'all' || cats.includes(category);
      card.hidden = !match;
      if (match) {
        shown++;
        card.classList.remove('pop');
        void card.offsetWidth; // restart animation
        card.classList.add('pop');
      }
    });
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === category));
    });
    if (counter) counter.textContent = String(shown).padStart(2, '0');
  }
  if (buttons.length && cards.length) {
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () { applyFilter(btn.getAttribute('data-filter') || 'all'); });
    });
  }

  /* ---------- Resume print button ---------- */
  const printBtn = document.getElementById('print-resume');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  /* ---------- Project page: auto table of contents with scrollspy ---------- */
  const content = document.querySelector('.project-content');
  const meta = document.querySelector('.project-meta');
  if (content && meta) {
    const heads = content.querySelectorAll('h2');
    if (heads.length > 1) {
      const toc = document.createElement('nav');
      toc.className = 'toc';
      toc.setAttribute('aria-label', 'On this page');
      const title = document.createElement('p');
      title.className = 'label';
      title.textContent = 'On this page';
      const list = document.createElement('ol');
      const map = new Map();
      heads.forEach(function (h, i) {
        if (!h.id) h.id = 'sec-' + (h.textContent || String(i)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#' + h.id;
        a.textContent = h.textContent;
        li.appendChild(a); list.appendChild(li);
        map.set(h, a);
      });
      toc.appendChild(title); toc.appendChild(list);
      meta.appendChild(toc);

      if ('IntersectionObserver' in window) {
        const sio = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            map.forEach(function (a) { a.classList.remove('active'); });
            const a = map.get(entry.target);
            if (a) a.classList.add('active');
          });
        }, { rootMargin: '-20% 0px -70% 0px' });
        heads.forEach(function (h) { sio.observe(h); });
      }
    }
  }

  /* ---------- Gallery lightbox (photos) ---------- */
  const galleryImgs = document.querySelectorAll(
    '.gallery img, .project-hero img, .photo-trio figure:not(.video-tile) img, .schematic-figure img'
  );
  if (galleryImgs.length && typeof HTMLDialogElement === 'function') {
    const dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    const big = document.createElement('img');
    const cap = document.createElement('p');
    const close = document.createElement('button');
    close.type = 'button'; close.className = 'lightbox-close';
    close.setAttribute('aria-label', 'Close image'); close.textContent = '×';
    dlg.appendChild(close); dlg.appendChild(big); dlg.appendChild(cap);
    document.body.appendChild(dlg);
    close.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

    galleryImgs.forEach(function (img) {
      img.classList.add('zoomable');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      const open = function () {
        big.src = img.currentSrc || img.src;   // same-origin only (CSP img-src 'self')
        big.alt = img.alt;
        const fc = img.closest('figure') && img.closest('figure').querySelector('figcaption');
        cap.textContent = fc ? fc.textContent : img.alt;
        dlg.showModal();
      };
      img.addEventListener('click', open);
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  }

  /* ---------- On-page video player (modal + inline, strict embed allow-list) ---------- */
  function isAllowedEmbed(url) {
    return typeof url === 'string' && (
      url.indexOf('https://www.instagram.com/reel/') === 0 ||
      url.indexOf('https://www.instagram.com/p/') === 0 ||
      url.indexOf('https://www.youtube-nocookie.com/embed/') === 0
    );
  }

  function buildEmbedIframe(url, title) {
    const frame = document.createElement('iframe');
    frame.src = url;
    frame.title = title || 'Embedded video player';
    frame.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
    frame.setAttribute('allowfullscreen', '');
    return frame;
  }

  const videoTiles = document.querySelectorAll('.video-tile[data-video-embed]');
  if (videoTiles.length) {
    let vDlg = null, vMount = null, vCap = null;
    if (typeof HTMLDialogElement === 'function') {
      vDlg = document.createElement('dialog');
      vDlg.className = 'lightbox video-lightbox';
      const vClose = document.createElement('button');
      vClose.type = 'button'; vClose.className = 'lightbox-close';
      vClose.setAttribute('aria-label', 'Close video'); vClose.textContent = '×';
      vMount = document.createElement('div');
      vMount.className = 'video-lightbox-mount';
      vCap = document.createElement('p');
      vDlg.appendChild(vClose); vDlg.appendChild(vMount); vDlg.appendChild(vCap);
      document.body.appendChild(vDlg);
      vClose.addEventListener('click', function () { vDlg.close(); });
      vDlg.addEventListener('click', function (e) { if (e.target === vDlg) vDlg.close(); });
      vDlg.addEventListener('close', function () { vMount.replaceChildren(); });
    }

    videoTiles.forEach(function (tile) {
      const play = function () {
        const url = tile.getAttribute('data-video-embed') || '';
        if (!isAllowedEmbed(url)) return;
        const title = tile.getAttribute('data-video-title') || 'EO-01 Demo Video';
        const mode = tile.getAttribute('data-play-mode');
        const media = tile.querySelector('.video-tile-media');

        if (mode === 'inline' && media) {
          if (tile.classList.contains('is-playing')) return;
          tile.classList.add('is-playing');
          tile.removeAttribute('role');
          tile.removeAttribute('tabindex');
          media.replaceChildren(buildEmbedIframe(url, title));
          return;
        }
        if (vDlg && vMount) {
          vMount.replaceChildren(buildEmbedIframe(url, title));
          if (vCap) vCap.textContent = title;
          vDlg.showModal();
        }
      };
      tile.addEventListener('click', play);
      tile.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
      });
    });
  }
})();
