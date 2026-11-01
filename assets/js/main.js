// Shared behavior for every page: theme, nav, reveal, filters, copy, results chart.
(function () {
  const root = document.documentElement;

  // ---- Theme toggle (remembers the viewer's choice) ----
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  };
  const saved = store.get('theme');
  if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);

  document.querySelectorAll('.theme-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark' ||
        (!root.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
      const next = isDark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set('theme', next);
    });
  });

  // ---- Header shadow + mobile menu ----
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = document.querySelector('.menu-btn');
  const links = document.querySelector('.nav-links');
  if (menuBtn && links) {
    menuBtn.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', (e) => {
      if (e.target.closest('a')) { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    });
  }

  // ---- Active section highlight in nav ----
  const navAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = navAnchors.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navAnchors.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  // ---- Reveal on scroll ----
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  // ---- Project filters ----
  const filterBtns = document.querySelectorAll('.filter');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      document.querySelectorAll('.cards .card').forEach((card) => {
        card.hidden = f !== 'all' && !card.dataset.tags.split(' ').includes(f);
      });
    });
  });

  // ---- Copy BibTeX ----
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const src = document.getElementById(btn.dataset.copy);
      if (!src) return;
      const label = btn.textContent;
      try {
        await navigator.clipboard.writeText(src.textContent.trim());
        btn.textContent = 'Copied ✓';
      } catch (e) {
        btn.textContent = 'Select & copy';
      }
      setTimeout(() => { btn.textContent = label; }, 1600);
    });
  });

  // ---- Footer year ----
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // ---- Sci-ZSEL results chart ----
  const viz = document.getElementById('results-viz');
  if (viz) initResults(viz);

  function initResults(el) {
    // Numbers from the EMNLP 2026 paper / poster. [baseline, Sci-ZSEL + Synonym]
    const DATA = {
      all: {
        'blink-r1': { NCBI: [64.4, 77.4], BC5CDR: [74.4, 81.2], CMO: [50.1, 58.9], VT: [43.1, 71.3], LPT: [57.3, 80.7] },
        'res-r1':   { NCBI: [45.9, 70.5], BC5CDR: [32.6, 77.9], CMO: [48.9, 57.4], VT: [38.3, 65.6], LPT: [59.7, 81.2] },
        'ret-r64':  { NCBI: [88.1, 90.8], BC5CDR: [88.8, 89.1], CMO: [75.7, 89.1], VT: [72.6, 88.0], LPT: [68.7, 92.7] },
      },
      none: {
        'blink-r1': { NCBI: [23.6, 61.7], BC5CDR: [22.4, 46.9], CMO: [29.7, 36.9], VT: [31.4, 64.0], LPT: [20.6, 69.7] },
        'res-r1':   { NCBI: [18.6, 63.8], BC5CDR: [12.4, 41.7], CMO: [31.4, 32.3], VT: [19.7, 55.5], LPT: [27.7, 70.3] },
        'ret-r64':  { NCBI: [62.7, 76.4], BC5CDR: [57.2, 59.4], CMO: [55.0, 76.5], VT: [60.0, 83.4], LPT: [35.4, 87.4] },
      },
    };
    const METRIC = {
      'blink-r1': { base: 'BLINK (no fine-tuning)', label: 'BLINK reranker · Recall@1' },
      'res-r1': { base: 'ReS (no fine-tuning)', label: 'ReS reranker · Recall@1' },
      'ret-r64': { base: 'BLINK bi-encoder (no fine-tuning)', label: 'BLINK bi-encoder retriever · Recall@64' },
    };
    const state = { subset: 'none', metric: 'blink-r1' };
    const barsEl = el.querySelector('.bars');
    const baseLegend = el.querySelector('[data-legend-base]');
    const note = el.querySelector('.viz-note');
    const tbody = el.querySelector('tbody');
    const tip = document.createElement('div');
    tip.className = 'tip';
    tip.setAttribute('role', 'status');
    document.body.appendChild(tip);

    el.querySelectorAll('.seg button').forEach((b) => {
      b.addEventListener('click', () => {
        state[b.dataset.key] = b.dataset.val;
        b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        render();
      });
    });

    function render() {
      const rows = DATA[state.subset][state.metric];
      const m = METRIC[state.metric];
      baseLegend.textContent = m.base;
      barsEl.innerHTML = '';
      tbody.innerHTML = '';
      let best = { ds: '', gain: -1 };
      Object.entries(rows).forEach(([ds, [b, o]]) => {
        const gain = +(o - b).toFixed(1);
        if (gain > best.gain) best = { ds, gain, b, o };
        const g = document.createElement('div');
        g.className = 'bar-group';
        g.innerHTML =
          `<div class="ds">${ds}</div><div class="bar-pair">` +
          row('base', b, `${ds} · ${m.base}: ${b.toFixed(1)}`) +
          row('ours', o, `${ds} · Sci-ZSEL + Synonym: ${o.toFixed(1)} (+${gain.toFixed(1)})`) +
          `</div>`;
        barsEl.appendChild(g);
        tbody.insertAdjacentHTML('beforeend',
          `<tr><td>${ds}</td><td>${b.toFixed(1)}</td><td>${o.toFixed(1)}</td><td>+${gain.toFixed(1)}</td></tr>`);
      });
      requestAnimationFrame(() => {
        barsEl.querySelectorAll('.bar').forEach((bar) => { bar.style.width = bar.dataset.w + '%'; });
      });
      const subsetText = state.subset === 'none' ? 'mentions that share no words with the entity name' : 'all test mentions';
      note.innerHTML = `${m.label} on ${subsetText}. Largest gain: <b>${best.ds}</b>, ${best.b.toFixed(1)} → ${best.o.toFixed(1)} (<b>+${best.gain.toFixed(1)} pts</b>).`;
      bindTips();
    }

    function row(kind, v, tipText) {
      return `<div class="bar-row" data-tip="${tipText}" tabindex="0" aria-label="${tipText}">` +
        `<div class="bar-track"><div class="bar ${kind}" data-w="${v}"></div></div>` +
        `<span class="val">${v.toFixed(1)}</span></div>`;
    }

    function bindTips() {
      barsEl.querySelectorAll('.bar-row').forEach((r) => {
        r.addEventListener('mousemove', (e) => {
          tip.textContent = r.dataset.tip;
          tip.style.left = Math.min(e.clientX + 14, innerWidth - 250) + 'px';
          tip.style.top = (e.clientY + 14) + 'px';
          tip.classList.add('show');
        });
        r.addEventListener('mouseleave', () => tip.classList.remove('show'));
      });
    }

    render();
  }
})();
