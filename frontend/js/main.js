(function () {
  'use strict';

  const root = document.documentElement;
  const page = root.dataset.page || 'home';
  const THB = new Intl.NumberFormat('th-TH');
  const formatTHB = (n) => `฿${THB.format(Math.round(Number(n) || 0))}`;

  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  /* ------------------------------ SVG Icon Set ------------------------------ */
  const ICONS = {
    filter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16l-6.2 7.4v5.8l-3.6 1.8v-7.6L4 5Z"/></svg>',
    tank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="10" rx="5"/><path d="M7 7v10m10-10v10M6 17v3m12-3v3"/></svg>',
    cpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/></svg>',
    recycle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H4.8a2 2 0 0 1-1.7-3l2.6-4.5m11.3 7.5h2.2a2 2 0 0 0 1.7-3L17 9.5M14 4.5l-2-3-3.7 6.4"/><path d="m14 4.5-3 1.7m6 3.3-1 3.4m-9 6.1 2-2.6"/></svg>',
    silo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5a5 2 0 0 1 10 0v11l-3 4h-4l-3-4V5Z"/><path d="M7 9h10M7 13h10M9 20v2m6-2v2"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 4.5 6 6.5 6 12a6 6 0 1 1-12 0c0-3 2-5.5 3.5-7 0 2.2 1.5 3 2.5 3 0-3-.5-5.5 0-8Z"/></svg>',
    bin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v6l-5 6h-6L4 11V5Z"/><path d="M9 17v4m6-4v4M12 5v6"/></svg>',
    scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M5 7h14M5 7 2 14h6L5 7Zm14 0-3 7h6l-3-7ZM8 21h8"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2Z"/></svg>',
    cabin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 13h18M9 6v7m6-7v7"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
    bearing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="5.5" r="1" fill="currentColor"/><circle cx="12" cy="18.5" r="1" fill="currentColor"/><circle cx="5.5" cy="12" r="1" fill="currentColor"/><circle cx="18.5" cy="12" r="1" fill="currentColor"/></svg>',
    belt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><rect x="2" y="8" width="20" height="8" rx="4"/><circle cx="6.5" cy="12" r="1.8"/><circle cx="17.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.4"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    pump: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="13" r="6"/><circle cx="11" cy="13" r="2.2"/><path d="M11 7h9v4h-3M5 13H2m9 6v3"/></svg>',
  };

  /* ------------------------------ Toast ------------------------------ */
  let activeToast = null;
  function showToast(message) {
    if (activeToast) activeToast.remove();
    const el = document.createElement('div');
    el.className = 'toast glass glass--strong';
    el.setAttribute('role', 'status');
    el.innerHTML = `<span class="toast__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span><span>${esc(message)}</span>`;
    document.body.appendChild(el);
    activeToast = el;
    setTimeout(() => {
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 420);
    }, 3600);
  }

  /* =========================================================================
     1. INTRO PRELOADER & SEAMLESS FLIP LOGO-TO-HEADER MORPH (ZERO FLICKER)
     ========================================================================= */
  function runIntro(forceReplay) {
    const intro = document.getElementById('intro');
    const brand = document.getElementById('headerBrand');
    if (!intro || !brand) return;

    if (forceReplay) {
      try { sessionStorage.removeItem('ptx_intro_seen'); } catch (e) { }
      root.classList.remove('intro-leaving');
      root.classList.add('intro-active');
    }
    if (!root.classList.contains('intro-active')) return;

    const img = brand.querySelector('img');
    if (img && !img.complete) {
      img.addEventListener('load', () => runIntro(forceReplay), { once: true });
      return;
    }

    const oldClone = intro.querySelector('.brand--intro');
    if (oldClone) oldClone.remove();
    intro.classList.remove('is-ready');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      try { sessionStorage.setItem('ptx_intro_seen', '1'); } catch (e) { }
      root.classList.remove('intro-active', 'intro-leaving');
      return;
    }

    const clone = brand.cloneNode(true);
    clone.removeAttribute('id');
    clone.removeAttribute('href');
    clone.classList.add('brand--intro');
    clone.style.visibility = 'visible';
    intro.appendChild(clone);

    const getCenterMetrics = (scaleFactor) => {
      const vw = window.innerWidth;
      const vh = intro.clientHeight || window.innerHeight;
      const startW = clone.offsetWidth || Math.min(440, Math.max(160, vw * 0.45));
      const startH = clone.offsetHeight || startW * (177 / 497);
      const s = scaleFactor || 1;
      const cx = (vw - startW * s) / 2;
      const cy = (vh - startH * s) / 2;
      return { startW, startH, cx, cy, s };
    };

    // Phase 1 (0.0s -> 0.8s): Gentle entrance zoom (opacity 0 -> 1, scale 0.92 -> 1)
    const m0 = getCenterMetrics(0.92);
    const m1 = getCenterMetrics(1);
    clone.style.opacity = '0';
    clone.style.transform = `translate3d(${m0.cx.toFixed(2)}px, ${m0.cy.toFixed(2)}px, 0) scale(0.92)`;

    const enterAnim = clone.animate(
      [
        {
          opacity: 0,
          transform: `translate3d(${m0.cx.toFixed(2)}px, ${m0.cy.toFixed(2)}px, 0) scale(0.92)`,
        },
        {
          opacity: 1,
          transform: `translate3d(${m1.cx.toFixed(2)}px, ${m1.cy.toFixed(2)}px, 0) scale(1)`,
        },
      ],
      {
        duration: 800,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      }
    );

    enterAnim.onfinish = () => {
      clone.style.opacity = '1';
      clone.style.transform = `translate3d(${m1.cx.toFixed(2)}px, ${m1.cy.toFixed(2)}px, 0) scale(1)`;
    };

    setTimeout(() => {
      const hold = getCenterMetrics(1);
      const dest = brand.getBoundingClientRect();
      const endScale = dest.width > 0 ? dest.width / hold.startW : 96 / hold.startW;

      root.classList.add('intro-leaving');

      const morphAnim = clone.animate(
        [
          {
            opacity: 1,
            transform: `translate3d(${hold.cx.toFixed(2)}px, ${hold.cy.toFixed(2)}px, 0) scale(1)`,
          },
          {
            opacity: 1,
            transform: `translate3d(${dest.left.toFixed(2)}px, ${dest.top.toFixed(2)}px, 0) scale(${endScale.toFixed(5)})`,
          },
        ],
        {
          duration: 600,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        }
      );

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        // Atomic hand-off in a single compositor frame => zero flicker
        requestAnimationFrame(() => {
          try { sessionStorage.setItem('ptx_intro_seen', '1'); } catch (e) { }
          root.classList.remove('intro-active', 'intro-leaving');
          intro.classList.remove('is-ready');
          document.body.style.overflow = '';
          clone.remove();
        });
      };

      morphAnim.onfinish = finish;
      morphAnim.oncancel = finish;
    }, 1800);
  }

  runIntro(false);

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-replay-intro]');
    if (!btn) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => runIntro(true), 220);
  });

  /* =========================================================================
     2. FLOATING HEADER — SLIDING ACTIVE PILL & MOBILE SHEET
     ========================================================================= */
  function initHeaderNav() {
    const nav = document.getElementById('mainNav');
    const indicator =
      document.getElementById('navIndicator') ||
      document.getElementById('nav-notch') ||
      (nav && nav.querySelector('.nav-indicator, .nav-notch'));
    if (nav && indicator) {
      if (!indicator.querySelector('.nav-notch__bar')) {
        const bar = document.createElement('span');
        bar.className = 'nav-notch__bar';
        indicator.appendChild(bar);
      }
      const links = Array.from(nav.querySelectorAll('a[data-nav]'));
      const activeLink = nav.querySelector('a[aria-current="page"]') || links[0];
      let currentTarget = activeLink;

      const measure = (target) => {
        const navRect = nav.getBoundingClientRect();
        const r = target.getBoundingClientRect();
        return {
          x: r.left - navRect.left,
          w: r.width,
        };
      };

      const setCoords = (x, w) => {
        const xStr = `${x.toFixed(2)}px`;
        const wStr = `${w.toFixed(2)}px`;
        indicator.style.setProperty('--x', xStr);
        indicator.style.setProperty('--w', wStr);
        indicator.style.transform = `translate3d(${xStr}, 0, 0)`;
        indicator.style.width = wStr;
      };

      const setLit = (target) => {
        links.forEach((a) => a.classList.toggle('is-lit', a === target));
      };

      const snapTo = (target) => {
        if (!target) return;
        currentTarget = target;
        const { x, w } = measure(target);
        if (w === 0) return;
        indicator.classList.remove('is-ready');
        setCoords(x, w);
        setLit(target);
        indicator.classList.add('is-visible');
        void indicator.offsetWidth;
        indicator.classList.add('is-ready');
      };

      const slideTo = (target) => {
        if (!target) return;
        currentTarget = target;
        const { x, w } = measure(target);
        if (w === 0) return;
        indicator.classList.add('is-visible', 'is-ready');
        setCoords(x, w);
        setLit(target);
      };

      let prevNavKey = null;
      try {
        const raw = sessionStorage.getItem('ptx_nav_prev');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Date.now() - parsed.ts < 3000) {
            prevNavKey = parsed.nav;
          }
        }
      } catch (e) { }

      const prevLink = prevNavKey
        ? links.find((a) => a.dataset.nav === prevNavKey)
        : null;

      if (prevLink && prevLink !== activeLink) {
        snapTo(prevLink);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            slideTo(activeLink);
          });
        });
      } else {
        snapTo(activeLink);
      }

      links.forEach((link) => {
        link.addEventListener('mouseenter', () => slideTo(link));
        link.addEventListener('focus', () => slideTo(link));
        link.addEventListener('click', () => {
          try {
            sessionStorage.setItem(
              'ptx_nav_prev',
              JSON.stringify({
                nav: activeLink ? activeLink.dataset.nav : '',
                ts: Date.now(),
              })
            );
          } catch (e) { }
        });
      });

      nav.addEventListener('mouseleave', () => slideTo(activeLink));

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          slideTo(currentTarget);
        });
      }

      window.addEventListener('resize', () => {
        const { x, w } = measure(currentTarget);
        if (w > 0) setCoords(x, w);
      });
    }

    const menuBtn = document.getElementById('menuBtn');
    const sheet = document.getElementById('mobileSheet');
    if (menuBtn && sheet) {
      if (!sheet.querySelector('.mobile-sheet__search')) {
        const searchWrap = document.createElement('div');
        searchWrap.className = 'mobile-sheet__search';
        searchWrap.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input type="search" class="mobile-sheet__search-input" placeholder="ค้นหาแพล้นท์, อะไหล่, โปรโมชั่น…" autocomplete="off" aria-label="ค้นหาในเมนูมือถือ">
        `;
        sheet.insertBefore(searchWrap, sheet.firstChild);
        const mInput = searchWrap.querySelector('input');
        const mainInput = document.getElementById('searchInput');
        if (mInput && mainInput) {
          mInput.addEventListener('input', () => {
            mainInput.value = mInput.value;
            mainInput.dispatchEvent(new Event('input', { bubbles: true }));
          });
          mInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              mainInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            }
          });
        }
      }
      const setSheet = (open) => {
        sheet.classList.toggle('is-open', open);
        menuBtn.setAttribute('aria-expanded', String(open));
      };
      menuBtn.addEventListener('click', () => setSheet(!sheet.classList.contains('is-open')));
      document.addEventListener('click', (e) => {
        if (!sheet.classList.contains('is-open')) return;
        if (!sheet.contains(e.target) && !menuBtn.contains(e.target)) setSheet(false);
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sheet.classList.contains('is-open')) setSheet(false);
      });
    }
  }

  /* =========================================================================
     3. INTERACTIVE EXPANDING SEARCH BAR
     ========================================================================= */
  function initSearch() {
    const box = document.getElementById('searchBox');
    const btn = document.getElementById('searchBtn');
    const input = document.getElementById('searchInput');
    const clear = document.getElementById('searchClear');
    const panel = document.getElementById('searchPanel');
    if (!box || !btn || !input || !panel) return;

    const FALLBACK_INDEX = [
      { type: 'หน้า', title: 'หน้าหลัก', subtitle: 'ภาพรวมแพล้นท์และบริการ Protex Group', url: 'index.html' },
      { type: 'หน้า', title: 'ออกแบบแพล้นท์', subtitle: 'เปลี่ยนสีโครงหลัก เลือกอุปกรณ์เสริม คำนวณราคา', url: 'design-plant.html' },
      { type: 'หน้า', title: 'อะไหล่แท้และรีวิว', subtitle: 'ถุงกรอง Nomex หัวเผา ลูกปืน และรีวิวลูกค้า', url: 'spare-parts.html' },
      { type: 'หน้า', title: 'โปรโมชั่นและโซเชียล', subtitle: 'แคมเปญ วิดีโอ และช่องทางติดต่อ', url: 'promotions.html' },
      { type: 'หน้า', title: 'ติดต่อสอบถาม', subtitle: 'สำนักงานใหญ่ สายด่วนวิศวกร 24/7 และแผนที่นำทาง', url: 'contact.html' },
      { type: 'หน้า', title: 'ผลงานติดตั้ง', subtitle: 'แผนที่จุดปักหมุดผลงานติดตั้งแพล้นท์ทั่วประเทศ', url: 'service-plants.html' },
      { type: 'หน้า', title: 'บริการหลังการขาย', subtitle: 'ทีมวิศวกร 24/7, PM, ซ่อมฉุกเฉิน และศูนย์บริการทั่วประเทศ', url: 'after-sales.html' },
      { type: 'แพล้นท์', title: 'MODEL PT-1510RAP', subtitle: '110-130 T/H · Industrial Batch Mix Series', url: 'index.html#fully-hot' },
      { type: 'แพล้นท์', title: 'PTX-120 Classic', subtitle: '120 ตัน/ชม. · Fully Hot In Plant', url: 'index.html#fully-hot' },
      { type: 'แพล้นท์', title: 'PTX-240 Titan', subtitle: '240 ตัน/ชม. · Fully Hot In Plant', url: 'index.html#fully-hot' },
      { type: 'แพล้นท์', title: 'MODEL RAP50 / MODEL RAP80', subtitle: 'RAP Recycle 50-80 t/h · Hot Re In Plant', url: 'index.html#hot-re' },
      { type: 'อุปกรณ์เสริม', title: 'ระบบดักฝุ่น Baghouse Filter', subtitle: 'Pulse-jet Baghouse · Nomex', url: 'design-plant.html#acc-baghouse' },
      { type: 'อุปกรณ์เสริม', title: 'ระบบควบคุมอัตโนมัติ PLC + SCADA', subtitle: 'Siemens PLC · SCADA', url: 'design-plant.html#acc-plc' },
    ];

    let activeIdx = -1;
    let timer = null;

    const openSearch = (focusInput) => {
      box.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      if (focusInput) input.focus();
    };

    const closeSearch = () => {
      panel.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (!input.value.trim()) box.classList.remove('is-open');
    };

    const renderResults = (query, results) => {
      activeIdx = -1;
      if (!query) {
        panel.classList.remove('is-open');
        panel.innerHTML = '';
        return;
      }
      if (!results.length) {
        panel.innerHTML = `<div class="search-empty">ไม่พบผลลัพธ์สำหรับ <strong>“${esc(query)}”</strong></div>`;
        panel.classList.add('is-open');
        return;
      }
      panel.innerHTML = results
        .map(
          (r, i) => `
          <a class="search-result" role="option" href="${esc(r.url)}" data-idx="${i}">
            <span class="search-result__type">${esc(r.type)}</span>
            <div>
              <div class="search-result__title">${esc(r.title)}</div>
              <div class="search-result__sub">${esc(r.subtitle)}</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>
          </a>`
        )
        .join('');
      panel.classList.add('is-open');
    };

    const isSecretAdminCode = (val) => String(val || '').trim().toLowerCase() === 'adminprotex';

    const triggerSecretAdminGateway = () => {
      input.value = '';
      box.classList.remove('has-value', 'is-open');
      closeSearch();
      input.blur();
      openSecretAdminModal();
    };

    const runQuery = async (q) => {
      const clean = q.trim();
      if (!clean) {
        renderResults('', []);
        return;
      }
      if (isSecretAdminCode(clean)) {
        panel.innerHTML = `<div class="search-empty" style="color:var(--brand-red);font-weight:700;">กดปุ่ม Enter เพื่อเข้าสู่เกตเวย์ผู้ดูแลระบบ PROTEX CMS</div>`;
        panel.classList.add('is-open');
        return;
      }
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(clean)}&_t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('search api');
        const data = await res.json();
        renderResults(clean, data.results || []);
      } catch (e) {
        const low = clean.toLowerCase();
        const local = FALLBACK_INDEX.filter((item) =>
          `${item.title} ${item.subtitle} ${item.type}`.toLowerCase().includes(low)
        );
        renderResults(clean, local);
      }
    };

    btn.addEventListener('click', () => {
      if (!box.classList.contains('is-open')) openSearch(true);
      else if (isSecretAdminCode(input.value)) triggerSecretAdminGateway();
      else if (input.value.trim()) runQuery(input.value);
      else input.focus();
    });

    input.addEventListener('focus', () => openSearch(false));

    input.addEventListener('input', () => {
      const v = input.value;
      box.classList.toggle('has-value', v.length > 0);
      clearTimeout(timer);
      timer = setTimeout(() => runQuery(v), 120);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && isSecretAdminCode(input.value)) {
        e.preventDefault();
        triggerSecretAdminGateway();
        return;
      }
      const items = Array.from(panel.querySelectorAll('.search-result'));
      if (e.key === 'Escape') {
        input.value = '';
        box.classList.remove('has-value', 'is-open');
        closeSearch();
        input.blur();
      } else if (e.key === 'ArrowDown' && items.length) {
        e.preventDefault();
        activeIdx = (activeIdx + 1) % items.length;
        items.forEach((el, i) => el.classList.toggle('is-active', i === activeIdx));
      } else if (e.key === 'ArrowUp' && items.length) {
        e.preventDefault();
        activeIdx = (activeIdx - 1 + items.length) % items.length;
        items.forEach((el, i) => el.classList.toggle('is-active', i === activeIdx));
      } else if (e.key === 'Enter' && items.length) {
        e.preventDefault();
        const pick = items[Math.max(0, activeIdx)] || items[0];
        if (pick) window.location.href = pick.getAttribute('href');
      }
    });

    if (clear) {
      clear.addEventListener('click', () => {
        input.value = '';
        box.classList.remove('has-value');
        renderResults('', []);
        input.focus();
      });
    }

    document.addEventListener('click', (e) => {
      if (!box.contains(e.target) && !panel.contains(e.target)) closeSearch();
    });
  }

  /* =========================================================================
     4. MODAL MANAGER & AUTH CONTROLS
     ========================================================================= */
  let openModalEl = null;
  let lastTrigger = null;

  function openModal(modal, trigger) {
    if (!modal) return;
    if (openModalEl && openModalEl !== modal) closeModal(openModalEl);
    lastTrigger = trigger || document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
      const focusable = modal.querySelector('input:not([type="hidden"]), button:not(.modal__close), [href], textarea');
      if (focusable) focusable.focus();
    });
    openModalEl = modal;
  }

  function closeModal(modal) {
    const m = modal || openModalEl;
    if (!m) return;
    m.classList.remove('is-open');
    document.body.style.overflow = '';
    const vFrame = m.querySelector('#videoFrame');
    if (vFrame) vFrame.innerHTML = '';
    setTimeout(() => {
      m.hidden = true;
      if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    }, 380);
    if (openModalEl === m) openModalEl = null;
  }

  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('[data-modal-close]');
    if (closeBtn) closeModal(closeBtn.closest('.modal'));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openModalEl) closeModal(openModalEl);
  });

  function openSecretAdminModal() {
    let modal = document.getElementById('ptxSecretAdminModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal';
      modal.id = 'ptxSecretAdminModal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'ptxSecretAdminTitle');
      modal.hidden = true;
      modal.innerHTML = `
        <div class="modal__backdrop" data-modal-close></div>
        <div class="modal__dialog glass" style="max-width:430px;width:calc(100vw - 28px);padding:28px 26px 24px;border-radius:28px;background:linear-gradient(160deg,rgba(255,255,255,0.95),rgba(255,255,255,0.82));backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);border:1px solid rgba(255,255,255,0.95);box-shadow:0 28px 64px -12px rgba(15,23,42,0.24),inset 0 1px 0 #FFFFFF;position:relative;">
          <button type="button" class="icon-btn" data-modal-close aria-label="ปิดหน้าต่าง" style="position:absolute;top:16px;right:16px;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;margin-bottom:20px;">
            <img src="assets/logo/protex-logo.png" alt="PROTEX GROUP" width="112" height="38" style="object-fit:contain;">
            <span class="chip chip--red" style="font-size:0.7rem;letter-spacing:0.06em;">PROTEX ADMIN SECURITY GATEWAY</span>
            <h2 id="ptxSecretAdminTitle" style="margin:4px 0 0;font-size:1.28rem;font-weight:800;color:#0F172A;">ยืนยันสิทธิ์ผู้ดูแลระบบ</h2>
            <p style="margin:0;font-size:0.84rem;color:#475569;">กรุณากรอกรหัสผ่านแอดมินเพื่อเข้าสู่ระบบจัดการเว็บไซต์ (Full CMS)</p>
          </div>
          <form id="ptxSecretAdminForm" novalidate style="display:grid;gap:14px;">
            <div style="position:relative;">
              <input
                type="password"
                id="ptxSecretAdminPass"
                class="input"
                placeholder="กรอกรหัสผ่านผู้ดูแลระบบ…"
                autocomplete="current-password"
                required
                style="width:100%;padding:12px 44px 12px 16px;border-radius:16px;border:1px solid rgba(15,23,42,0.14);background:#FFFFFF;font-size:0.94rem;font-weight:600;"
              >
              <button
                type="button"
                id="ptxSecretPassToggle"
                aria-label="แสดงหรือซ่อนรหัสผ่าน"
                style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:32px;height:32px;border:none;background:transparent;color:#64748B;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;"
              >
                <svg id="ptxPassEyeOpen" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <svg id="ptxPassEyeClosed" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" hidden>
                  <path d="M3 3l18 18M10.5 10.7a2.5 2.5 0 0 0 3.4 3.4M2 12s3.5-6.5 10-6.5c2 0 3.8.5 5.3 1.4M22 12s-3.5 6.5-10 6.5c-2.2 0-4.2-.6-5.8-1.6"/>
                </svg>
              </button>
            </div>
            <div id="ptxSecretAdminErr" style="color:#DC2626;font-size:0.8rem;font-weight:700;min-height:18px;text-align:center;"></div>
            <button type="submit" class="btn btn--red" id="ptxSecretAdminSubmit" style="width:100%;justify-content:center;padding:12px 18px;border-radius:999px;font-weight:800;font-size:0.94rem;">
              <span>เข้าสู่ระบบผู้ดูแล</span>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
            </button>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      const passInput = modal.querySelector('#ptxSecretAdminPass');
      const toggleBtn = modal.querySelector('#ptxSecretPassToggle');
      const eyeOpen = modal.querySelector('#ptxPassEyeOpen');
      const eyeClosed = modal.querySelector('#ptxPassEyeClosed');
      const form = modal.querySelector('#ptxSecretAdminForm');
      const errEl = modal.querySelector('#ptxSecretAdminErr');

      toggleBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        if (isPass) {
          eyeOpen.setAttribute('hidden', '');
          eyeClosed.removeAttribute('hidden');
        } else {
          eyeOpen.removeAttribute('hidden');
          eyeClosed.setAttribute('hidden', '');
        }
        passInput.focus();
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errEl.textContent = '';
        const pwd = passInput.value.trim();
        if (!pwd) {
          errEl.textContent = 'กรุณากรอกรหัสผ่านผู้ดูแลระบบ';
          return;
        }
        try {
          const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            errEl.textContent = data.message || 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง';
            return;
          }
          try {
            sessionStorage.setItem('ptx_admin_token', data.token);
            sessionStorage.setItem('ptx_admin_auth', '1');
          } catch (err) {}
          closeModal(modal);
          showToast('ยืนยันสิทธิ์สำเร็จ กำลังเข้าสู่ PROTEX Admin Dashboard…');
          setTimeout(() => {
            window.location.href = 'admin.html';
          }, 320);
        } catch (netErr) {
          // Offline / Static preview fallback
          const savedCustomPass = localStorage.getItem('ptx_cms_custom_pass') || 'Protex@2026';
          if (pwd === savedCustomPass) {
            try {
              sessionStorage.setItem('ptx_admin_token', 'local-admin-token');
              sessionStorage.setItem('ptx_admin_auth', '1');
            } catch (err) {}
            closeModal(modal);
            window.location.href = 'admin.html';
          } else {
            errEl.textContent = 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง';
          }
        }
      });
    }

    const passEl = modal.querySelector('#ptxSecretAdminPass');
    const errEl = modal.querySelector('#ptxSecretAdminErr');
    if (passEl) passEl.value = '';
    if (errEl) errEl.textContent = '';
    openModal(modal);
  }

  function initAuth() {
    // Public customer Sign In / Sign Up removed; replaced by secret 'adminprotex' search trigger
  }

  /* =========================================================================
     5. SCROLL REVEAL, STAT COUNTERS, SPECULAR TRACKING & 3D TILT
     ========================================================================= */
  function observeReveals(scope) {
    const els = (scope || document).querySelectorAll('.reveal:not(.is-in), .reveal-mask:not(.is-in)');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
  }

  function initStatCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          io.unobserve(el);
          const target = parseFloat(el.dataset.count || '0');
          const decimals = parseInt(el.dataset.decimals || '0', 10);
          const start = performance.now();
          const dur = 1200;
          const tick = (now) => {
            const p = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - p, 4);
            el.textContent = (target * eased).toFixed(decimals);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.5 }
    );
    nums.forEach((el) => io.observe(el));
  }

  function initSurfacePhysics() {
    if (!window.matchMedia('(hover: hover)').matches) return;
    document.addEventListener(
      'pointermove',
      (e) => {
        if (e.target.closest('#fhSliderTrack, .showcase-track, .is-sliding, .is-dragging')) return;
        const card = e.target.closest('.glass-interactive');
        if (card) {
          const r = card.getBoundingClientRect();
          card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
          card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        }
        const tilt = e.target.closest('[data-tilt]');
        if (tilt) {
          if (tilt.closest('#fhSliderTrack, .showcase-track, .is-sliding, .is-dragging')) return;
          const r = tilt.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          tilt.style.setProperty('--rx', `${(nx * 6).toFixed(2)}deg`);
          tilt.style.setProperty('--ry', `${(-ny * 4.5).toFixed(2)}deg`);
        }
      },
      { passive: true }
    );
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* =========================================================================
     6. HOME PAGE (Hero Video HUD + Plant Showcases + Promotions Grid)
     ========================================================================= */
  function initHeroVideo() {
    const frame = document.getElementById('heroFrame');
    const video = document.getElementById('heroVideo');
    if (!frame || !video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    frame.classList.add('has-video');

    const tryPlay = () => {
      const p = video.play();
      if (p && typeof p.catch === 'function') p.catch(() => { });
    };

    tryPlay();
    video.addEventListener('loadeddata', tryPlay, { once: true });
    video.addEventListener('canplay', tryPlay, { once: true });
  }

  function renderPromotionsGrid(container, banners) {
    if (!container) return;
    if (!banners || !banners.length) {
      container.innerHTML = '<div class="empty-state glass"><p>ยังไม่มีรายการโปรโมชั่น</p></div>';
      return;
    }

    // Auto-balancing spans on a 6-column grid so any count (1, 2, 3, 4, 5, 6+) fills cleanly
    const count = banners.length;
    const spanFor = (b, idx) => {
      if (count === 1) return 6;
      if (count === 2) return 3;
      if (b && b.slot === 'featured_top_left') return 4;
      if (b && (b.slot === 'compact_top_right' || b.slot === 'compact_mid_right')) return 2;
      if (b && (b.slot === 'wide_bottom_left' || b.slot === 'wide_bottom_right')) return 3;
      if (idx === 0) return 4;
      if (idx === 1 || idx === 2) return 2;
      const rem = count - 3;
      const pos = idx - 3;
      if (rem % 3 === 1 && pos === rem - 1) return 6;
      if (rem % 3 === 2 && pos >= rem - 2) return 3;
      return 2;
    };

    container.innerHTML = banners
      .map((b, idx) => {
        const span = spanFor(b, idx);
        const hero = (b.slot === 'featured_top_left' || idx === 0) && count >= 3;
        const tone = b.tone ? `ph--${esc(b.tone)}` : '';
        const hasImg = Boolean(b.image && String(b.image).trim());
        const plantArt = idx % 2 === 0 ? 'assets/images/renders/plant-fully-hot.svg' : 'assets/images/renders/plant-hot-re.svg';

        return `
        <article class="promo-card ${hero ? 'promo-card--hero' : ''} ${span === 6 ? 'is-full' : ''} glass glass-interactive" style="--span:${span}" data-promo-slot="${esc(b.slot || '')}">
          <a class="promo-art ph ${tone} ${hasImg ? 'has-bg-image' : ''} is-image-only" href="${esc(b.link || 'promotions.html')}" aria-label="${esc(b.title || 'โปรโมชั่น PROTEX')}">
            ${
              hasImg
                ? `<img class="promo-art__img" src="${esc(b.image)}" alt="${esc(b.title || 'โปรโมชั่น PROTEX')}" loading="lazy">`
                : `<img class="promo-art__plant" src="${plantArt}" alt="" loading="lazy">`
            }
            <div class="promo-art__foot">
              <span class="promo-art__go" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
              </span>
            </div>
          </a>
        </article>`;
      })
      .join('');
  }

  /* ---------------------- Home Page Fallback Data ---------------------- */
  const FALLBACK_PLANTS = {"categories":{"fully-hot":{"title":"FULLY HOT IN PLANT","titleTh":"แพล้นท์ยางมะตอยเต็มระบบ","summary":"ระบบผลิตแอสฟัลต์คอนกรีตแบบ Batch Mix ครบวงจร ตั้งแต่ป้อนหินเย็น อบแห้ง คัดขนาด ชั่งตวง ผสม จนถึงไซโลจัดเก็บ ควบคุมทุกขั้นตอนด้วย PLC แม่นยำระดับ ±0.5%","process":[{"step":"Cold Feed","th":"ป้อนหินเย็น 4–6 ช่อง"},{"step":"Dryer Drum","th":"อบแห้งที่ 160–180 °C"},{"step":"Screening","th":"คัดขนาด 4–5 ชั้น"},{"step":"Weigh & Mix","th":"ชั่งตวงและผสม Twin-shaft"},{"step":"Hot Storage","th":"ไซโลเก็บร้อนพร้อมจ่าย"}]},"hot-re":{"title":"HOT RE IN PLANT","titleTh":"แพล้นท์รีไซเคิล","summary":"แพล้นท์ที่ออกแบบมาเพื่อนำผิวทางเก่า (RAP) กลับมาใช้ใหม่ ด้วย Parallel Drum ที่อุ่น RAP แยกจากหินใหม่ ลดการใช้ยางมะตอยและหินใหม่ได้อย่างมีนัยสำคัญ โดยไม่ลดคุณภาพส่วนผสม","highlights":[{"value":"50%","label":"สัดส่วน RAP สูงสุดต่อแบตช์"},{"value":"30%","label":"ลดต้นทุนวัตถุดิบโดยเฉลี่ย"},{"value":"25%","label":"ลดการปล่อย CO₂ ต่อตันส่วนผสม"}],"gallery":[{"image":"assets/images/image_877e29.jpg","caption":"ภาพถ่ายจริงแพล้นท์รีไซเคิล MODEL RAP50","zoom":1,"focusX":50,"focusY":50},{"image":"assets/images/image_877e29.jpg","caption":"Parallel RAP Drum & Tower","zoom":2.2,"focusX":35,"focusY":40},{"image":"assets/images/image_877e29.jpg","caption":"Cold Aggregates & Feeding Bins","zoom":2.2,"focusX":75,"focusY":65},{"image":"assets/images/image_877e29.jpg","caption":"Burner RAP & Storage Silo","zoom":2.4,"focusX":50,"focusY":30}]}},"models":[{"id":"ptx-160","category":"fully-hot","series":"INDUSTRIAL BATCH MIX SERIES","badge":"PT-1510RAP","name":"MODEL PT-1510RAP","capacity":"110-130","capacityUnit":"T/H","basePrice":36900000,"tagline":"RAP 10-80% · Mixer 1,600 kg","description":"แพล้นท์ผสมยางมะตอยแบบ Batch Mix ประสิทธิภาพสูง รองรับการผสม RAP สูงสุดถึง 80% พร้อมมิกเซอร์ Twin-shaft 1,600 กก. และระบบควบคุมอัตโนมัติแม่นยำสูง","image":"assets/images/image_plant1.jpg","imageAlt":"ภาพถ่ายจริงแพล้นท์ยางมะตอยเต็มระบบ MODEL PT-1510RAP","specs":[{"icon":"capacity","label":"Total Capacity","value":"110-130 T/H"},{"icon":"virgin","label":"Capacity of Virgin (Maximum)","value":"110-120 T/H"},{"icon":"rap","label":"Capacity of RAP","value":"50-60 T/H"},{"icon":"mixer","label":"Capacity of Mixer","value":"1600 kg"},{"icon":"ratio","label":"RAP Ratio","value":"10-80%"},{"icon":"power","label":"Total power","value":"490 kW"}],"configurator":{"base":"assets/images/configurator/fully-hot-base.svg","mask":"assets/images/configurator/fully-hot-mask.svg"},"process":[{"step":"Cold Feed","th":"ป้อนหินเย็น 4–6 ช่อง ชั่งตวงสายพานต่อเนื่อง"},{"step":"Dryer Drum","th":"อบแห้งที่ 160–180 °C เตาเผา High-Efficiency"},{"step":"Screening","th":"คัดขนาด 4–5 ชั้น ตะแกรงสั่นสะเทือนแบบเฉียง"},{"step":"Weigh & Mix","th":"ชั่งตวงแยกอิสระ ผสม Twin-shaft 1,600 กก."},{"step":"Hot Storage","th":"ไซโลเก็บร้อน 60–100 T พร้อมฉนวนกันความร้อน"}]},{"id":"ptx-2010rap","category":"fully-hot","series":"ADVANCED HIGH-OUTPUT SERIES","badge":"PT-2010RAP","name":"MODEL PT-2010RAP","capacity":"180-200","capacityUnit":"T/H","basePrice":48500000,"tagline":"RAP 10-80% · Mixer 2,500 kg","description":"แพล้นท์ผสมยางมะตอย Batch Mix กำลังผลิตสูง 180-200 ตัน/ชม. มิกเซอร์ 2,500 กก. ควบคุมความแม่นยำด้วยระบบ SCADA Real-time พร้อมชุดรีไซเคิล RAP ประสิทธิภาพสูง","image":"assets/images/image_79d043.jpg","imageAlt":"ภาพถ่ายจริงแพล้นท์ยางมะตอยเต็มระบบ MODEL PT-2010RAP","specs":[{"icon":"capacity","label":"Total Capacity","value":"180-200 T/H"},{"icon":"virgin","label":"Capacity of Virgin (Maximum)","value":"140-160 T/H"},{"icon":"rap","label":"Capacity of RAP","value":"70-80 T/H"},{"icon":"mixer","label":"Capacity of Mixer","value":"2500 kg"},{"icon":"ratio","label":"RAP Ratio","value":"10-80%"},{"icon":"power","label":"Total power","value":"780 kW"}],"process":[{"step":"Cold Feed","th":"ป้อนหินเย็น 5–6 ช่อง ควบคุมความเร็วอินเวอร์เตอร์"},{"step":"Dryer Drum","th":"อบแห้งที่ 165–185 °C พร้อมระบบ Eco-Burner"},{"step":"Screening","th":"คัดขนาด 5 ชั้น แม่นยำสูง ดักฝุ่น Baghouse 99.9%"},{"step":"Weigh & Mix","th":"ชั่งตวงดิจิทัล 3 จุด ผสม Twin-shaft 2,500 กก."},{"step":"Hot Storage","th":"ไซโลเก็บร้อน 120 T รักษาอุณหภูมิ 72 ชั่วโมง"}],"configurator":{"base":"assets/images/configurator/fully-hot-base.svg","mask":"assets/images/configurator/fully-hot-mask.svg"}},{"id":"ptx-3015rap","category":"fully-hot","series":"FLAGSHIP HEAVY INDUSTRIAL SERIES","badge":"PT-3015RAP","name":"MODEL PT-3015RAP","capacity":"300-320","capacityUnit":"T/H","basePrice":58900000,"tagline":"RAP 10-80% · Mixer 4,000 kg","description":"แพล้นท์ระดับเรือธง สำหรับโครงการโครงสร้างพื้นฐานระดับชาติและสนามบิน กำลังการผลิตสูง 300-320 ตัน/ชม. มิกเซอร์ Heavy-Duty 4,000 กก. รองรับสูตรพิเศษ PMA & SMA ควบคุมด้วย SCADA อุตสาหกรรม","image":"assets/images/โรงงาน PROTEX ยามอาทิตย์อัสดง.png","imageAlt":"ภาพถ่ายจริงแพล้นท์ยางมะตอยเต็มระบบ MODEL PT-3015RAP","specs":[{"icon":"capacity","label":"Total Capacity","value":"300-320 T/H"},{"icon":"virgin","label":"Capacity of Virgin (Maximum)","value":"230-240 T/H"},{"icon":"rap","label":"Capacity of RAP","value":"100-120 T/H"},{"icon":"mixer","label":"Capacity of Mixer","value":"4000 kg"},{"icon":"ratio","label":"RAP Ratio","value":"10-80%"},{"icon":"power","label":"Total power","value":"980 kW"}],"process":[{"step":"Cold Feed","th":"ป้อนหินเย็น 6 ช่อง ชั่งตวงน้ำหนักแบบไฮดรอลิก"},{"step":"Dryer Drum","th":"อบแห้ง Ultra-Dry 170–190 °C ฉนวน Rockwool หนาพิเศษ"},{"step":"Screening","th":"คัดแยกอนุภาค 6 ชั้น รองรับส่วนผสมหินเกรดพิเศษ"},{"step":"Weigh & Mix","th":"ชั่งตวงความเร็วสูง ผสม Heavy-Duty 3,000 กก."},{"step":"Hot Storage","th":"ไซโลเก็บร้อนสุญญากาศ 160–200 T ระบบโหลดตรง"}],"configurator":{"base":"assets/images/configurator/fully-hot-base.svg","mask":"assets/images/configurator/fully-hot-mask.svg"}},{"id":"model-rap50","category":"hot-re","series":"RAP RECYCLE SERIES","badge":"RAP50","name":"MODEL RAP50","capacity":"50-60","capacityUnit":"t/h","basePrice":44500000,"tagline":"Recycle Asphalt 50-60 t/h · A-TECH Korea","description":"แพล้นท์รีไซเคิลแอสฟัลต์ประสิทธิภาพสูง Parallel Drum อุ่น RAP แยกอิสระ รักษาคุณภาพยางมะตอยเก่า พร้อมหัวเผา A-TECH South Korea ควบคุมอุณหภูมิ RAP แบบ Closed-loop","image":"assets/images/image_877e29.jpg","imageAlt":"ภาพถ่ายจริงแพล้นท์รีไซเคิล MODEL RAP50","specs":[{"icon":"capacity","label":"Recycle Asphalt Output","value":"50-60 t/h"},{"icon":"fuel","label":"Fuel Type","value":"Diesel / Heavy oil"},{"icon":"power","label":"Total Power","value":"185 kW"},{"icon":"hopper","label":"Cold Aggregates","value":"8 m³"},{"icon":"drum","label":"Drying Drum","value":"Φ1.5x8.0 m."},{"icon":"burner","label":"Burner RAP","value":"A-TECH South Korea"},{"icon":"silo","label":"Storage Silo","value":"6 m³"}],"configurator":{"base":"assets/images/configurator/hot-re-base.svg","mask":"assets/images/configurator/hot-re-mask.svg"}},{"id":"model-rap80","category":"hot-re","series":"RAP RECYCLE SERIES","badge":"RAP80","name":"MODEL RAP80","capacity":"70-80","capacityUnit":"t/h","basePrice":52500000,"tagline":"Recycle Asphalt 70-80 t/h · A-TECH Korea","description":"แพล้นท์รีไซเคิลแอสฟัลต์ประสิทธิภาพสูง Parallel Drum อุ่น RAP แยกอิสระ รักษาคุณภาพยางมะตอยเก่า พร้อมหัวเผา A-TECH South Korea ควบคุมอุณหภูมิ RAP แบบ Closed-loop","image":"assets/images/image_893d02.jpg","imageAlt":"ภาพถ่ายจริงแพล้นท์รีไซเคิล MODEL RAP80","specs":[{"icon":"capacity","label":"Recycle Asphalt Output","value":"70-80 t/h"},{"icon":"fuel","label":"Fuel Type","value":"Diesel / Heavy oil"},{"icon":"power","label":"Total Power","value":"215 kW"},{"icon":"hopper","label":"Cold Aggregates","value":"8 m³"},{"icon":"drum","label":"Drying Drum","value":"Φ1.8x8.5 m."},{"icon":"burner","label":"Burner RAP","value":"A-TECH South Korea"},{"icon":"silo","label":"Storage Silo","value":"10 m³"}],"configurator":{"base":"assets/images/configurator/hot-re-base.svg","mask":"assets/images/configurator/hot-re-mask.svg"}}]};
  const FALLBACK_HOME_PROMOS = {"banners":[{"id":"year-end","slot":"featured_top_left","badge":"ส่งท้ายปี","title":"จองแพล้นท์ PTX-160 รับส่วนลด 1.2 ล้านบาท","subtitle":"พร้อมติดตั้งและทดสอบเดินเครื่องฟรี","offer":"−1.2M","highlight":"−1.2M","validUntil":"2026-12-31","image":"","displayMode":"image_only","tone":"crimson","link":"design-plant.html"},{"id":"rap-upgrade","slot":"compact_top_right","badge":"อัปเกรด","title":"เปลี่ยนแพล้นท์เดิมเป็นระบบรีไซเคิล","subtitle":"ผ่อน 0% นาน 24 เดือน สำหรับชุด RAP","offer":"0%","highlight":"0%","validUntil":"2027-03-31","image":"","displayMode":"image_only","tone":"pearl","link":"index.html#hot-re"},{"id":"pm-package","slot":"compact_mid_right","badge":"บริการ","title":"แพ็กเกจ PM รายปี","subtitle":"ตรวจเช็ก 4 ครั้ง/ปี พร้อมรายงานสุขภาพเครื่อง","offer":"−20%","highlight":"−20%","validUntil":"2027-01-31","image":"","displayMode":"image_only","tone":"silver","link":"spare-parts.html"},{"id":"baghouse","slot":"wide_bottom_left","badge":"สิ่งแวดล้อม","title":"ถุงกรอง Baghouse ชุดใหม่","subtitle":"ซื้อครบชุด แถมค่าติดตั้ง","offer":"FREE","highlight":"FREE","validUntil":"2027-02-28","image":"","displayMode":"image_only","tone":"deep","link":"spare-parts.html"},{"id":"trade-in","slot":"wide_bottom_right","badge":"เทิร์นแพล้นท์","title":"นำแพล้นท์เก่ามาแลกรุ่นใหม่","subtitle":"ประเมินราคาโดยวิศวกรถึงหน้างาน","offer":"TRADE","highlight":"TRADE","validUntil":"2027-06-30","image":"","displayMode":"image_only","tone":"pearl","link":"promotions.html"}],"campaigns":[{"id":"road-ahead","type":"campaign","featured":true,"tag":"แคมเปญหลัก","title":"The Road Ahead 2027","excerpt":"เปิดตัวแพล้นท์ PTX Titan รุ่นใหม่ ประหยัดเชื้อเพลิงขึ้น 12% พร้อมสิทธิพิเศษสำหรับลูกค้า 50 รายแรก","date":"2026-11-15","readTime":"4 นาที","image":"","tone":"crimson","link":"design-plant.html"},{"id":"rap-guide","type":"article","tag":"บทความ","title":"RAP 50% ทำได้จริงไหม? คู่มือแพล้นท์รีไซเคิลฉบับวิศวกร","excerpt":"ไขข้อสงสัยเรื่องคุณภาพส่วนผสม การควบคุมอุณหภูมิ และจุดคุ้มทุน","date":"2026-11-02","readTime":"7 นาที","image":"","tone":"pearl","link":"index.html#hot-re"},{"id":"fuel-save","type":"article","tag":"บทความ","title":"5 วิธีลดต้นทุนเชื้อเพลิงในแพล้นท์ยางมะตอย","excerpt":"ตั้งค่าหัวเผา ความชื้นหิน และการบำรุงรักษาที่ส่งผลต่อบิลพลังงาน","date":"2026-10-21","readTime":"5 นาที","image":"","tone":"silver","link":"spare-parts.html"},{"id":"deal-silo","type":"deal","tag":"ดีลพิเศษ","title":"ไซโลเก็บร้อน 80 ตัน","excerpt":"เมื่อสั่งพร้อมแพล้นท์ใหม่ทุกรุ่น","price":2900000,"dealPrice":2390000,"date":"2026-11-10","image":"","tone":"deep","link":"design-plant.html"},{"id":"deal-plc","type":"deal","tag":"ดีลพิเศษ","title":"อัปเกรด PLC + SCADA","excerpt":"สำหรับแพล้นท์ที่ใช้งานมากกว่า 5 ปี","price":2250000,"dealPrice":1790000,"date":"2026-11-10","image":"","tone":"crimson","link":"design-plant.html"},{"id":"deal-burner","type":"deal","tag":"ดีลพิเศษ","title":"หัวเผาเชื้อเพลิงคู่","excerpt":"รวมค่าติดตั้งและจูนนิ่งหน้างาน","price":1680000,"dealPrice":1450000,"date":"2026-11-10","image":"","tone":"silver","link":"design-plant.html"}],"videos":[{"id":"v1","platform":"youtube","title":"PTX-240 Titan — Factory Acceptance Test","duration":"3:42","embedId":"","url":"","thumbnail":"","tone":"crimson"},{"id":"v2","platform":"tiktok","title":"60 วินาที ติดตั้งไซโลสูง 22 เมตร","duration":"0:58","embedId":"","url":"","thumbnail":"","tone":"deep"},{"id":"v3","platform":"reels","title":"เบื้องหลังทีมช่าง 24/7 ที่ไซต์งานลำปาง","duration":"0:45","embedId":"","url":"","thumbnail":"","tone":"pearl"},{"id":"v4","platform":"mp4","title":"Hot RE In Plant — ระบบรีไซเคิลทำงานอย่างไร","duration":"2:15","embedId":"","url":"assets/videos/hot-re-explainer.mp4","thumbnail":"","tone":"silver"},{"id":"v5","platform":"youtube","title":"รีวิวจากลูกค้า: กรมทางหลวงชนบท","duration":"5:10","embedId":"","url":"","thumbnail":"","tone":"pearl"},{"id":"v6","platform":"tiktok","title":"เปลี่ยนสีโครงแพล้นท์ได้ตามแบรนด์คุณ","duration":"0:32","embedId":"","url":"","thumbnail":"","tone":"crimson"}],"partsMarquee":[{"id":"p1","title":"ถุงกรอง Nomex","detail":"ชุด 300 ใบ ทนร้อน 200 °C","discount":"−25%","icon":"filter","image":"","tone":"crimson"},{"id":"p2","title":"หัวฉีดหัวเผา","detail":"รองรับน้ำมันเตา / LPG","discount":"−18%","icon":"flame","image":"","tone":"pearl"},{"id":"p3","title":"ลูกปืนเพลาดรัม","detail":"SKF / FAG ของแท้","discount":"−15%","icon":"bearing","image":"","tone":"silver"},{"id":"p4","title":"สายพานลำเลียง EP400","detail":"ตัดตามขนาด ส่งใน 48 ชม.","discount":"−20%","icon":"belt","image":"","tone":"deep"},{"id":"p5","title":"ตะแกรงคัดขนาด","detail":"เหล็กแมงกานีสสูง","discount":"−12%","icon":"grid","image":"","tone":"pearl"},{"id":"p6","title":"ใบพายมิกเซอร์","detail":"Ni-hard ทนการสึกกร่อน","discount":"−22%","icon":"gear","image":"","tone":"crimson"},{"id":"p7","title":"ปั๊มยางมะตอย","detail":"Gear pump หุ้มแจ็คเก็ตร้อน","discount":"−10%","icon":"pump","image":"","tone":"silver"},{"id":"p8","title":"Load Cell ชั่งตวง","detail":"Class C3 พร้อมสอบเทียบ","discount":"−15%","icon":"scale","image":"","tone":"deep"}],"social":[{"platform":"facebook","label":"Facebook","handle":"PROTEXGroup2002","url":"https://www.facebook.com/PROTEXGroup2002","icon":"assets/images/image_bc7cf8.png","action":"ติดตามเพจ"},{"platform":"line","label":"LINE Official","handle":"ID: protex00","url":"https://line.me/ti/p/~protex00","icon":"assets/images/image_bc7cd8.png","action":"ทักแชตปรึกษา"},{"platform":"tiktok","label":"TikTok","handle":"@protexgroup","url":"https://www.tiktok.com/@protexgroup","icon":"assets/images/image-Photoroom.png","action":"ชมคลิปผลงาน"},{"platform":"instagram","label":"Instagram","handle":"@protex.group","url":"https://www.instagram.com/protex.group/","icon":"assets/images/image_bc7cb5.png","action":"ดูแกลเลอรี"}]};

  async function loadHomePageData() {
    let plants = FALLBACK_PLANTS;
    let promos = FALLBACK_HOME_PROMOS;
    try {
      const pRes = await fetch(`/api/plants?_t=${Date.now()}`, { cache: 'no-store' });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData && pData.models && pData.models.length) plants = pData;
      }
    } catch (e) {
      try {
        const localRes = await fetch(`../backend/data/plants.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (localRes.ok) plants = await localRes.json();
      } catch (e2) {}
    }
    try {
      const prRes = await fetch(`/api/promotions?_t=${Date.now()}`, { cache: 'no-store' });
      if (prRes.ok) {
        const prData = await prRes.json();
        if (prData && prData.banners && prData.banners.length) promos = prData;
      }
    } catch (e) {
      try {
        const localPr = await fetch(`../backend/data/promotions.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (localPr.ok) promos = await localPr.json();
      } catch (e2) {}
    }
    try {
      const rawOverride = localStorage.getItem('ptx_cms_override_promotions');
      if (rawOverride) {
        const parsedOverride = JSON.parse(rawOverride);
        if (
          parsedOverride &&
          Array.isArray(parsedOverride.banners) &&
          parsedOverride.banners.length &&
          Number(parsedOverride._updatedAt || 0) >= Number(promos._updatedAt || 0)
        ) {
          promos = parsedOverride;
        }
      }
    } catch (e3) {}
    return { plants, promos };
  }

  async function initHomePage() {
    initHeroVideo();

    try {
      const { plants, promos } = await loadHomePageData();

      const modal = document.getElementById('plantModal');
      const openPlantLightbox = (model, zoomOpts) => {
        if (!modal || !model) return;
        const img = document.getElementById('plantModalImg');
        img.src = (zoomOpts && zoomOpts.image) || model.image;
        img.alt = model.imageAlt || model.name;
        img.style.transform = zoomOpts && zoomOpts.zoom > 1 ? `scale(${zoomOpts.zoom})` : '';
        img.style.transformOrigin = zoomOpts ? `${zoomOpts.focusX || 50}% ${zoomOpts.focusY || 50}%` : '50% 50%';
        document.getElementById('plantModalSeries').textContent = (zoomOpts && zoomOpts.caption) || model.series;
        document.getElementById('plantModalTitle').textContent = model.name;
        document.getElementById('plantModalDesc').textContent = model.description;
        document.getElementById('plantModalSpecs').innerHTML = (model.specs || [])
          .map((s) => `<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd></div>`)
          .join('');
        document.getElementById('plantModalConfig').href = `design-plant.html?model=${encodeURIComponent(model.id)}`;
        openModal(modal);
      };

      /* Section 1 — Fully Hot In Plant (3-Slide Carousel & Morphing Process Timeline) */
      const SPEC_ICONS = {
        capacity:
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14 16 10"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/><circle cx="12" cy="14" r="1.5"/></svg>',
        virgin:
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 16.5 9 4.5 9-4.5"/></svg>',
        rap:
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>',
        mixer:
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5h14v9a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V5Z"/><path d="M9 5v10m6-10v10"/><path d="M7 10h10"/></svg>',
        ratio:
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
        power:
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
      };
      const iconForSpec = (s, idx) => {
        if (s.icon && SPEC_ICONS[s.icon]) return SPEC_ICONS[s.icon];
        const lbl = String(s.label || '').toLowerCase();
        if (lbl.includes('virgin')) return SPEC_ICONS.virgin;
        if (lbl.includes('ratio') || lbl.includes('แม่นยำ')) return SPEC_ICONS.ratio;
        if (lbl.includes('rap')) return SPEC_ICONS.rap;
        if (lbl.includes('mixer') || lbl.includes('มิกเซอร์') || lbl.includes('ไซโล')) return SPEC_ICONS.mixer;
        if (lbl.includes('power') || lbl.includes('ไฟ')) return SPEC_ICONS.power;
        const keys = Object.keys(SPEC_ICONS);
        return SPEC_ICONS[keys[idx % keys.length]];
      };

      const fhModels = (plants.models || []).filter((m) => m.category === 'fully-hot');
      let currentFh = fhModels[0] || {};
      let fhCurrentIndex = 0;

      const fhSliderViewport = document.getElementById('fhSliderViewport');
      const fhSliderTrack = document.getElementById('fhSliderTrack');
      const fhPrevBtn = document.getElementById('fhPrevBtn');
      const fhNextBtn = document.getElementById('fhNextBtn');
      const fhSliderDots = document.getElementById('fhSliderDots');
      const fhRail = document.getElementById('fhModelRail');
      const fhProcess = document.getElementById('fhProcess');
      const fhProcessPulseLine = document.getElementById('fhProcessPulseLine');
      const fhSummaryEl = document.getElementById('fullyHotSummary');
      if (fhSummaryEl && plants.categories?.['fully-hot']?.summary) {
        fhSummaryEl.textContent = plants.categories['fully-hot'].summary;
      }

      // Dynamically render Fully Hot slides & dots from fhModels so Admin CMS changes appear immediately
      if (fhSliderTrack && fhModels.length) {
        const GEARS_SVG = `
          <div class="plant-panel__gears" aria-hidden="true">
            <svg class="gear gear--lg" viewBox="0 0 200 200">
              <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M90 12 H110 L117 44.6 A58 58 0 0 1 133.4 51.4 L161.2 33.2 L175.3 47.3 L157.1 75.1 A58 58 0 0 1 163.9 91.5 L196.5 98.5 V118.5 L163.9 125.5 A58 58 0 0 1 157.1 141.9 L175.3 169.7 L161.2 183.8 L133.4 165.6 A58 58 0 0 1 117 172.4 L110 205 H90 L83 172.4 A58 58 0 0 1 66.6 165.6 L38.8 183.8 L24.7 169.7 L42.9 141.9 A58 58 0 0 1 36.1 125.5 L3.5 118.5 V98.5 L36.1 91.5 A58 58 0 0 1 42.9 75.1 L24.7 47.3 L38.8 33.2 L66.6 51.4 A58 58 0 0 1 83 44.6 Z M100 135 A26.5 26.5 0 1 0 100 82 A26.5 26.5 0 1 0 100 135 Z" transform="translate(0 -8.5)"/>
            </svg>
            <svg class="gear gear--sm" viewBox="0 0 200 200">
              <g transform="rotate(22.5 100 100)">
                <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M90 12 H110 L117 44.6 A58 58 0 0 1 133.4 51.4 L161.2 33.2 L175.3 47.3 L157.1 75.1 A58 58 0 0 1 163.9 91.5 L196.5 98.5 V118.5 L163.9 125.5 A58 58 0 0 1 157.1 141.9 L175.3 169.7 L161.2 183.8 L133.4 165.6 A58 58 0 0 1 117 172.4 L110 205 H90 L83 172.4 A58 58 0 0 1 66.6 165.6 L38.8 183.8 L24.7 169.7 L42.9 141.9 A58 58 0 0 1 36.1 125.5 L3.5 118.5 V98.5 L36.1 91.5 A58 58 0 0 1 42.9 75.1 L24.7 47.3 L38.8 33.2 L66.6 51.4 A58 58 0 0 1 83 44.6 Z M100 135 A26.5 26.5 0 1 0 100 82 A26.5 26.5 0 1 0 100 135 Z" transform="translate(0 -8.5)"/>
              </g>
            </svg>
          </div>`;

        fhSliderTrack.innerHTML = fhModels
          .map(
            (m, sIdx) => `
            <div class="showcase showcase-slide" id="fhSlide-${sIdx}" data-index="${sIdx}" data-model="${esc(m.id)}">
              <div class="stage-card glass">
                <div class="stage-view stage-view--photo" data-tilt>
                  <img src="assets/logo/protex-logo.png" alt="PROTEX GROUP" class="plant-corner-logo" width="130" height="34" loading="lazy" decoding="async">
                  <img ${sIdx === 0 ? 'id="fhImage"' : ''} src="${esc(m.image)}" alt="${esc(m.imageAlt || m.name)}" width="2048" height="1536" loading="${sIdx === 0 ? 'eager' : 'lazy'}" decoding="async">
                </div>
              </div>
              <article class="plant-panel plant-panel--industrial glass" aria-live="polite">
                ${GEARS_SVG}
                <div class="plant-panel__head">
                  <div class="plant-panel__brand-bar">
                    <img src="assets/logo/protex-logo.png" alt="PROTEX GROUP" class="plant-panel__logo" width="92" height="33" loading="lazy" decoding="async">
                    <span class="plant-panel__series">${esc(m.series || 'INDUSTRIAL BATCH MIX SERIES')}</span>
                  </div>
                  <h3>${esc(m.name)}</h3>
                  <p class="plant-panel__desc">${esc(m.description || '')}</p>
                </div>
                <div class="capacity capacity--hero">
                  <div class="capacity__meta">
                    <span class="capacity__eyebrow">TOTAL CAPACITY</span>
                    <div class="capacity__row">
                      <span class="capacity__num">${esc(m.capacity)}</span>
                      <span class="capacity__unit">${esc(m.capacityUnit || 'T/H')}</span>
                    </div>
                  </div>
                  <div class="capacity__bar" aria-hidden="true"><span></span></div>
                </div>
                <dl class="spec-list spec-bento">
                  ${(m.specs || [])
                    .map(
                      (sp, spIdx) => `
                    <div class="spec-tile">
                      <span class="spec-tile__icon" aria-hidden="true">${iconForSpec(sp, spIdx)}</span>
                      <div class="spec-tile__body">
                        <dt>${esc(sp.label)}</dt>
                        <dd>${esc(sp.value)}</dd>
                      </div>
                    </div>`
                    )
                    .join('')}
                </dl>
                <div class="plant-panel__actions">
                  <a href="design-plant.html?model=${encodeURIComponent(m.id)}" class="btn btn--red">
                    <span>ออกแบบรุ่นนี้</span>
                    <svg class="btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
                  </a>
                </div>
              </article>
            </div>`
          )
          .join('');

        if (fhSliderDots) {
          fhSliderDots.innerHTML = fhModels
            .map(
              (m, dIdx) =>
                `<button type="button" class="slider-dot${dIdx === 0 ? ' is-active' : ''}" data-index="${dIdx}" aria-label="${esc(m.name)}"></button>`
            )
            .join('');
        }
      }

      const updateFhProcess = (m) => {
        if (!m || !m.process || !fhProcess) return;

        // Radiant red light pulse across connecting line (Zero Reflow rAF restart)
        if (fhProcessPulseLine) {
          fhProcessPulseLine.classList.remove('is-pulsing');
          requestAnimationFrame(() => {
            fhProcessPulseLine.classList.add('is-pulsing');
          });
        }

        const items = fhProcess.querySelectorAll('li');
        items.forEach((li) => {
          const content = li.querySelector('.step-content');
          if (content) content.classList.add('is-fading-out');
        });

        setTimeout(() => {
          items.forEach((li, idx) => {
            const stepData = m.process[idx];
            if (!stepData) return;
            const content = li.querySelector('.step-content');
            if (!content) return;
            const strong = content.querySelector('strong');
            const span = content.querySelector('span');
            if (strong) strong.textContent = stepData.step;
            if (span) span.textContent = stepData.th;

            content.classList.remove('is-fading-out');
            content.classList.add('is-fading-in');
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                content.classList.remove('is-fading-in');
              });
            });
          });
        }, 360);
      };

      let slidingTimer = null;
      const markSliding = () => {
        const sliderWrap = document.getElementById('fhSliderWrap');
        if (fhSliderTrack) fhSliderTrack.classList.add('is-sliding');
        if (sliderWrap) sliderWrap.classList.add('is-sliding');
        clearTimeout(slidingTimer);
        slidingTimer = setTimeout(() => {
          if (fhSliderTrack) fhSliderTrack.classList.remove('is-sliding');
          if (sliderWrap) sliderWrap.classList.remove('is-sliding');
        }, 520);
      };

      const goToFhSlide = (index, animated = true) => {
        if (index < 0) index = fhModels.length - 1;
        if (index >= fhModels.length) index = 0;

        const previousIndex = fhCurrentIndex;
        fhCurrentIndex = index;
        currentFh = fhModels[index] || currentFh;

        if (fhSliderTrack) {
          if (animated) {
            markSliding();
            fhSliderTrack.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
          } else {
            fhSliderTrack.style.transition = 'none';
          }
          fhSliderTrack.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
        }

        if (fhPrevBtn) {
          fhPrevBtn.disabled = false;
          fhPrevBtn.classList.remove('is-disabled');
        }
        if (fhNextBtn) {
          fhNextBtn.disabled = false;
          fhNextBtn.classList.remove('is-disabled');
        }

        // Update dots
        if (fhSliderDots) {
          fhSliderDots.querySelectorAll('.slider-dot').forEach((dot, dotIdx) => {
            const isActive = dotIdx === index;
            dot.classList.toggle('is-active', isActive);
            dot.setAttribute('aria-selected', String(isActive));
          });
        }

        // Update rail tabs
        if (fhRail) {
          fhRail.querySelectorAll('.model-tab').forEach((btn) => {
            btn.setAttribute('aria-selected', String(btn.dataset.id === currentFh.id));
          });
        }

        // Only morph timeline if slide actually changed or upon initial call
        if (previousIndex !== index || animated === false) {
          updateFhProcess(currentFh);
        }
      };

      // Prev & Next buttons (Click & Keyboard)
      fhPrevBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goToFhSlide(fhCurrentIndex - 1);
      });
      fhNextBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goToFhSlide(fhCurrentIndex + 1);
      });

      // Dots clicks
      fhSliderDots?.addEventListener('click', (e) => {
        const dot = e.target.closest('.slider-dot');
        if (!dot) return;
        const idx = parseInt(dot.dataset.index, 10);
        if (!isNaN(idx)) goToFhSlide(idx);
      });

      // Model Rail tabs initialization & clicks
      if (fhRail && fhModels.length) {
        fhRail.innerHTML = fhModels
          .map(
            (m) => `
            <button type="button" class="model-tab glass glass-interactive" role="tab" data-id="${esc(m.id)}" aria-selected="${m.id === currentFh.id}">
              <span class="model-tab__thumb"><img src="${esc(m.image)}" alt="${esc(m.name)}" loading="lazy"></span>
              <span class="model-tab__body">
                <span class="model-tab__top">
                  <span class="model-tab__name">${esc(m.name)}</span>
                  <img src="assets/logo/protex-logo.png" alt="PROTEX GROUP" class="model-tab__brand-logo" width="70" height="18" loading="lazy" decoding="async">
                </span>
                <span class="model-tab__meta">${esc(m.capacity)} ${esc(m.capacityUnit || 'T/H')} · ${esc(m.tagline || '')}</span>
              </span>
            </button>`
          )
          .join('');
        fhRail.addEventListener('click', (e) => {
          const btn = e.target.closest('.model-tab');
          if (!btn) return;
          const foundIdx = fhModels.findIndex((x) => x.id === btn.dataset.id);
          if (foundIdx !== -1) goToFhSlide(foundIdx);
        });
      }

      // Touch & Mouse Drag Physics (Apple-like feel, 60fps/120fps GPU rAF)
      if (fhSliderViewport && fhSliderTrack) {
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        let startTranslate = 0;
        let cachedSlideWidth = fhSliderViewport.offsetWidth || 1200;
        let dragRafId = null;

        const updateCachedWidth = () => {
          if (fhSliderViewport) {
            cachedSlideWidth = fhSliderViewport.offsetWidth || cachedSlideWidth;
          }
        };
        window.addEventListener('resize', updateCachedWidth, { passive: true });
        if (window.ResizeObserver) {
          new ResizeObserver(updateCachedWidth).observe(fhSliderViewport);
        }

        const getTouchX = (e) => (e.touches && e.touches.length ? e.touches[0].clientX : e.clientX);

        const onDragStart = (e) => {
          if (e.target.closest('button, a, input, select, .slider-btn')) return;
          isDragging = true;
          startX = getTouchX(e);
          currentX = startX;
          startTranslate = -fhCurrentIndex * cachedSlideWidth;
          fhSliderTrack.classList.add('is-dragging');
        };

        const onDragMove = (e) => {
          if (!isDragging) return;
          currentX = getTouchX(e);
          if (!dragRafId) {
            dragRafId = requestAnimationFrame(() => {
              dragRafId = null;
              if (!isDragging) return;
              const deltaX = currentX - startX;
              let effectiveDelta = deltaX;
              if ((fhCurrentIndex === 0 && deltaX > 0) || (fhCurrentIndex === fhModels.length - 1 && deltaX < 0)) {
                effectiveDelta = deltaX * 0.32;
              }
              fhSliderTrack.style.transform = `translate3d(${startTranslate + effectiveDelta}px, 0, 0)`;
            });
          }
        };

        const onDragEnd = () => {
          if (!isDragging) return;
          isDragging = false;
          if (dragRafId) {
            cancelAnimationFrame(dragRafId);
            dragRafId = null;
          }
          fhSliderTrack.classList.remove('is-dragging');
          const deltaX = currentX - startX;
          const threshold = Math.min(cachedSlideWidth * 0.16, 120);
          if (deltaX < -threshold) {
            goToFhSlide(fhCurrentIndex + 1);
          } else if (deltaX > threshold) {
            goToFhSlide(fhCurrentIndex - 1);
          } else {
            goToFhSlide(fhCurrentIndex);
          }
        };

        fhSliderViewport.addEventListener('mousedown', onDragStart, { passive: true });
        window.addEventListener('mousemove', onDragMove, { passive: true });
        window.addEventListener('mouseup', onDragEnd, { passive: true });

        fhSliderViewport.addEventListener('touchstart', onDragStart, { passive: true });
        fhSliderViewport.addEventListener('touchmove', onDragMove, { passive: true });
        fhSliderViewport.addEventListener('touchend', onDragEnd, { passive: true });
        fhSliderViewport.addEventListener('touchcancel', onDragEnd, { passive: true });
      }

      document.getElementById('fhZoomBtn')?.addEventListener('click', () => openPlantLightbox(currentFh));

      // Initial slide position
      goToFhSlide(0, false);

      /* Section 2 — Hot Re In Plant */
      const reModels = (plants.models || []).filter((m) => m.category === 'hot-re');
      let currentRe = reModels[0];
      const reList = document.getElementById('reModelList');

      const RE_SPEC_ICONS = {
        capacity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14 16 10"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>`,
        fuel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c-4 4-6 7.5-6 11a6 6 0 0 0 12 0c0-3.5-2-7-6-11Z"/><path d="M12 18a3 3 0 0 0 3-3c0-1.5-1-3-3-4.5-2 1.5-3 3-3 4.5a3 3 0 0 0 3 3Z"/></svg>`,
        power: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
        hopper: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m2 5 4 14h12l4-14Z"/><path d="M6 10h12"/><path d="M9 19v3h6v-3"/></svg>`,
        drum: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="6" rx="9" ry="3"/><path d="M3 6v12c0 1.66 4 3 9 3s9-1.34 9-3V6"/></svg>`,
        burner: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3Z"/></svg>`,
        silo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V7a6 6 0 0 1 12 0v15"/><path d="M4 22h16"/><line x1="6" y1="12" x2="18" y2="12"/></svg>`,
        default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
      };

      const setReModel = (m) => {
        if (!m) return;
        currentRe = m;
        const img = document.getElementById('reImage');
        if (img) {
          img.src = m.image;
          img.alt = m.imageAlt || m.name;
        }
        const stageEl = document.getElementById('reStage');
        if (stageEl) {
          const isPhoto = m.image && !m.image.endsWith('.svg');
          stageEl.classList.toggle('stage-view--photo', isPhoto);
        }
        const reBadge = document.getElementById('reBadge');
        if (reBadge) reBadge.textContent = m.name;
        const reName = document.getElementById('reName');
        if (reName) reName.textContent = m.name;
        const reDesc = document.getElementById('reDesc');
        if (reDesc) reDesc.textContent = m.description;
        const reSpecs = document.getElementById('reSpecs');
        if (reSpecs) {
          reSpecs.className = 'spec-list spec-bento';
          reSpecs.innerHTML = (m.specs || [])
            .map((s, idx) => {
              const iconSvg = RE_SPEC_ICONS[s.icon] || RE_SPEC_ICONS.default;
              const isHighlight = idx === 0 && (m.specs.length % 2 !== 0);
              return `
              <div class="spec-tile${isHighlight ? ' spec-tile--featured' : ''}">
                <span class="spec-tile__icon" aria-hidden="true">${iconSvg}</span>
                <div class="spec-tile__body">
                  <dt>${esc(s.label)}</dt>
                  <dd>${esc(s.value)}</dd>
                </div>
              </div>`;
            })
            .join('');
        }
        const reConfigLink = document.getElementById('reConfigLink');
        if (reConfigLink) reConfigLink.href = `design-plant.html?model=${encodeURIComponent(m.id)}`;
        if (reList) {
          reList.querySelectorAll('.re-model').forEach((btn) => {
            btn.setAttribute('aria-selected', String(btn.dataset.id === m.id));
          });
        }
      };

      if (reList && reModels.length) {
        reList.innerHTML = reModels
          .map((m) => {
            const capText = m.capacityUnit ? `${m.capacity} ${m.capacityUnit}` : `${m.capacity} ตัน/ชม.`;
            return `
            <button type="button" class="re-model" role="tab" data-id="${esc(m.id)}" aria-selected="${m.id === currentRe.id}">
              <div>
                <strong>${esc(m.name)} (${esc(capText)})</strong>
                <span>${esc(m.tagline)} · เริ่มต้น ${formatTHB(m.basePrice)}</span>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m9 6 6 6-6 6"/></svg>
            </button>`;
          })
          .join('');
        reList.addEventListener('click', (e) => {
          const btn = e.target.closest('.re-model');
          if (!btn) return;
          const found = reModels.find((x) => x.id === btn.dataset.id);
          if (found) setReModel(found);
        });
      }
      setReModel(currentRe);

      document.getElementById('reZoomBtn')?.addEventListener('click', () => openPlantLightbox(currentRe));

      const reGallery = document.getElementById('reGallery');
      const galleryItems = plants.categories?.['hot-re']?.gallery || [];
      if (reGallery && galleryItems.length) {
        reGallery.innerHTML = galleryItems
          .map(
            (g, i) => `
            <button type="button" class="gallery-tile glass glass-interactive" data-gidx="${i}">
              <div class="gallery-tile__crop">
                <!-- REPLACE WITH YOUR 4K HOT RE DETAIL IMAGE IN plants.json -->
                <img src="${esc(g.image)}" alt="${esc(g.caption)}" style="--z:${g.zoom || 1};transform:scale(${g.zoom || 1});transform-origin:${g.focusX || 50}% ${g.focusY || 50}%" loading="lazy">
                <span class="chip glass gallery-tile__cap">${esc(g.caption)}</span>
              </div>
            </button>`
          )
          .join('');
        reGallery.addEventListener('click', (e) => {
          const tile = e.target.closest('.gallery-tile');
          if (!tile) return;
          const g = galleryItems[Number(tile.dataset.gidx)];
          if (g) openPlantLightbox(currentRe, g);
        });
      }

      /* Section 3 — Promotions Showcase */
      renderPromotionsGrid(document.getElementById('homePromoGrid'), promos.banners || []);
    } catch (err) {
      console.error('Home data load error:', err);
    }
  }

  /* =========================================================================
     7. PROMOTIONS PAGE (Editorial Campaigns + Video Modal + Social Hub)
     ========================================================================= */
  async function initPromotionsPage() {
    try {
      let data = FALLBACK_HOME_PROMOS;
      try {
        const res = await fetch(`/api/promotions?_t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) data = await res.json();
      } catch (e) {
        try {
          const localRes = await fetch(`../backend/data/promotions.json?_t=${Date.now()}`, { cache: 'no-store' });
          if (localRes.ok) data = await localRes.json();
        } catch (e2) {}
      }
      try {
        const rawOverride = localStorage.getItem('ptx_cms_override_promotions');
        if (rawOverride) {
          const parsedOverride = JSON.parse(rawOverride);
          if (
            parsedOverride &&
            Array.isArray(parsedOverride.banners) &&
            parsedOverride.banners.length &&
            Number(parsedOverride._updatedAt || 0) >= Number(data._updatedAt || 0)
          ) {
            data = parsedOverride;
          }
        }
      } catch (e3) {}

      /* Render 5-Card Bento Promotions Grid on promotions.html if mount exists */
      const pagePromoBento = document.getElementById('pagePromoBentoGrid');
      if (pagePromoBento && Array.isArray(data.banners)) {
        renderPromotionsGrid(pagePromoBento, data.banners);
      }

      /* Section 1 — Campaigns, Content & Marketing */
      const editorial = document.getElementById('editorialGrid');
      if (editorial && data.campaigns) {
        const featured = data.campaigns.find((c) => c.featured) || data.campaigns[0];
        const articles = data.campaigns.filter((c) => c !== featured && c.type !== 'deal');
        const deals = data.campaigns.filter((c) => c.type === 'deal');

        let html = '';
        if (featured) {
          html += `
          <article class="feature-card glass glass-interactive">
            <div class="feature-card__art ph ph--${esc(featured.tone || 'crimson')}">
              ${featured.image ? `<img class="cover" src="${esc(featured.image)}" alt="${esc(featured.title)}">` : `<img class="feature-card__plant" src="assets/images/renders/plant-fully-hot.svg" alt="">`}
              <div class="feature-card__content glass glass--strong">
                <div class="feature-card__meta">
                  <span class="chip chip--red">${esc(featured.tag || 'Campaign')}</span>
                  <span>${esc(featured.date || '')}</span>
                  <span>อ่าน ${esc(featured.readTime || '4 นาที')}</span>
                </div>
                <h3>${esc(featured.title)}</h3>
                <p>${esc(featured.excerpt)}</p>
                <div>
                  <a href="${esc(featured.link || 'design-plant.html')}" class="btn btn--red">
                    <span>ดูรายละเอียดและจำลองสเปก</span>
                    <svg class="btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </article>`;
        }

        articles.forEach((a, i) => {
          const artSvg = i % 2 === 0 ? 'assets/images/renders/plant-hot-re.svg' : 'assets/images/renders/plant-fully-hot.svg';
          html += `
          <article class="article-card glass glass-interactive">
            <div class="article-card__media ph ph--${esc(a.tone || 'silver')}">
              ${a.image ? `<img src="${esc(a.image)}" alt="${esc(a.title)}" loading="lazy">` : `<img src="${artSvg}" alt="" style="padding:14px;object-fit:contain" loading="lazy">`}
            </div>
            <div class="article-card__body">
              <span class="chip chip--soft" style="align-self:start">${esc(a.tag || 'บทความ')}</span>
              <h3><a href="${esc(a.link || 'index.html')}">${esc(a.title)}</a></h3>
              <p>${esc(a.excerpt)}</p>
              <div class="article-card__meta">
                <span>${esc(a.date || '')}</span>
                <span>·</span>
                <span>อ่าน ${esc(a.readTime || '5 นาที')}</span>
              </div>
            </div>
          </article>`;
        });

        if (deals.length) {
          html += `<div class="deals">${deals
            .map((d) => {
              const save = d.price && d.dealPrice ? Math.round(((d.price - d.dealPrice) / d.price) * 100) : 0;
              return `
              <article class="deal-card glass glass-interactive">
                <div class="deal-card__top">
                  <span class="chip chip--soft">${esc(d.tag || 'ดีลพิเศษ')}</span>
                  ${save > 0 ? `<span class="chip chip--red">ประหยัด ${save}%</span>` : ''}
                </div>
                <h3>${esc(d.title)}</h3>
                <p>${esc(d.excerpt)}</p>
                <div class="deal-card__price">
                  <strong>${formatTHB(d.dealPrice || d.price)}</strong>
                  ${d.price && d.dealPrice ? `<s>${formatTHB(d.price)}</s>` : ''}
                </div>
                <a href="${esc(d.link || 'design-plant.html')}" class="btn btn--sm btn--glass" style="align-self:start">เลือกในหน้าออกแบบแพล้นท์</a>
              </article>`;
            })
            .join('')}</div>`;
        }

        editorial.innerHTML = html;
      }

      /* Section 2 — Video Grid & Lightbox Player */
      const videoGrid = document.getElementById('videoGrid');
      const videoModal = document.getElementById('videoModal');
      const videoFrame = document.getElementById('videoFrame');
      const videoTitle = document.getElementById('videoModalTitle');
      const videos = data.videos || [];

      const PLATFORM_LABELS = { youtube: 'YouTube', tiktok: 'TikTok', reels: 'Reels', mp4: '4K MP4' };

      if (videoGrid) {
        videoGrid.innerHTML = videos
          .map((v, i) => {
            const art = i % 2 === 0 ? 'assets/images/renders/plant-fully-hot.svg' : 'assets/images/renders/plant-hot-re.svg';
            return `
            <button type="button" class="video-card glass glass-interactive" data-vid="${esc(v.id)}" data-platform="${esc(v.platform)}">
              <div class="video-card__thumb ph ph--${esc(v.tone || 'crimson')}">
                ${v.thumbnail ? `<img class="cover" src="${esc(v.thumbnail)}" alt="${esc(v.title)}" loading="lazy">` : `<img class="tile__plant" src="${art}" alt="" loading="lazy">`}
                <span class="chip glass video-card__platform">${esc(PLATFORM_LABELS[v.platform] || v.platform)}</span>
                <span class="play-btn" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5v13l11-6.5-11-6.5Z"/></svg>
                </span>
                <span class="chip glass video-card__duration">${esc(v.duration || '1:00')}</span>
              </div>
              <div class="video-card__body">
                <h3>${esc(v.title)}</h3>
              </div>
            </button>`;
          })
          .join('');

        videoGrid.addEventListener('click', (e) => {
          const card = e.target.closest('.video-card');
          if (!card || !videoModal || !videoFrame) return;
          const v = videos.find((x) => x.id === card.dataset.vid);
          if (!v) return;

          const vertical = v.platform === 'tiktok' || v.platform === 'reels';
          videoFrame.classList.toggle('video-frame--vertical', vertical);
          videoTitle.textContent = v.title;

          if (v.platform === 'youtube' && v.embedId) {
            videoFrame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.embedId)}?autoplay=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="${esc(v.title)}"></iframe>`;
          } else if (v.platform === 'tiktok' && v.embedId) {
            videoFrame.innerHTML = `<iframe src="https://www.tiktok.com/embed/v2/${encodeURIComponent(v.embedId)}" allowfullscreen title="${esc(v.title)}"></iframe>`;
          } else if (v.platform === 'mp4' && v.url) {
            videoFrame.innerHTML = `
              <video controls autoplay playsinline poster="assets/images/renders/plant-hot-re.svg">
                <source src="${esc(v.url)}" type="video/mp4">
              </video>`;
            const vidEl = videoFrame.querySelector('video');
            vidEl.addEventListener(
              'error',
              () => {
                videoFrame.innerHTML = `
                  <div class="video-missing ph ph--deep">
                    <div>
                      <span class="chip chip--red">${esc(PLATFORM_LABELS[v.platform] || v.platform)}</span>
                      <h3>${esc(v.title)}</h3>
                      <p>ขออภัย วิดีโอนี้อยู่ในระหว่างการปรับปรุงระบบ กรุณาติดต่อฝ่ายบริการเพื่อรับชมข้อมูลเพิ่มเติม</p>
                    </div>
                  </div>`;
              },
              { once: true }
            );
          } else {
            videoFrame.innerHTML = `
              <div class="video-missing ph ph--deep">
                <div>
                  <span class="chip chip--red">${esc(PLATFORM_LABELS[v.platform] || v.platform)} · ${esc(v.duration || '')}</span>
                  <h3>${esc(v.title)}</h3>
                  <p>ขออภัย วิดีโอนี้อยู่ในระหว่างการปรับปรุงระบบ กรุณาติดต่อฝ่ายบริการเพื่อรับชมข้อมูลเพิ่มเติม</p>
                </div>
              </div>`;
          }

          openModal(videoModal, card);
        });

        const filterBar = document.getElementById('videoFilters');
        if (filterBar) {
          filterBar.addEventListener('click', (e) => {
            const chip = e.target.closest('[data-vfilter]');
            if (!chip) return;
            const f = chip.dataset.vfilter;
            filterBar.querySelectorAll('[data-vfilter]').forEach((b) => {
              b.setAttribute('aria-pressed', String(b === chip));
            });
            videoGrid.querySelectorAll('.video-card').forEach((card) => {
              card.classList.toggle('is-hidden', f !== 'all' && card.dataset.platform !== f);
            });
          });
        }
      }

      /* Section 3 — Social Media Hub */
      const socialGrid = document.getElementById('socialGrid');
      if (socialGrid && data.social && data.social.length) {
        const BADGE_TEXTS = {
          facebook: 'OFFICIAL',
          line: 'VERIFIED',
          tiktok: 'CREATOR',
          instagram: 'GALLERY'
        };
        socialGrid.innerHTML = data.social.map((s) => `
          <a class="social-btn social-btn--${esc(s.platform)} glass" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.label)} ${esc(s.handle)}">
            <span class="social-btn__glow" aria-hidden="true"></span>
            <img src="${esc(s.icon)}" alt="" class="social-btn__watermark" aria-hidden="true" loading="lazy">
            <div class="social-btn__top">
              <div class="social-btn__icon-box">
                <img src="${esc(s.icon)}" alt="${esc(s.label)}" class="social-btn__icon-img" width="56" height="56" loading="eager">
              </div>
              <div class="social-btn__badge">
                <span class="social-btn__status-dot" aria-hidden="true"></span>
                <span>${esc(BADGE_TEXTS[s.platform] || 'OFFICIAL')}</span>
              </div>
            </div>
            <div class="social-btn__meta">
              <h3 class="social-btn__label">${esc(s.label)}</h3>
              <div class="social-btn__handle">${esc(s.handle)}</div>
            </div>
            <div class="social-btn__pill">
              <span class="social-btn__pill-text">${esc(s.action || 'เชื่อมต่อ')}</span>
              <span class="social-btn__pill-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14m-6-6 6 6-6 6"/>
                </svg>
              </span>
            </div>
          </a>
        `).join('');
      }
    } catch (err) {
      console.error('Promotions load error:', err);
    }
  }

  /* =========================================================================
     8. CONTACT, AFTER-SALES & SERVICE PLANTS (Interactive Maps & Directory)
     ========================================================================= */
  const FALLBACK_LOCATIONS = {
    headquarters: {
      id: 'hq-samutprakan',
      name: 'บริษัท โปรเท็กซ์ กรุ๊ป จำกัด (สำนักงานใหญ่ & โรงงานประกอบหลัก)',
      province: 'สมุทรปราการ',
      lat: 13.5991,
      lng: 100.6968,
      address: '88/9 หมู่ 12 ถนนบางนา-ตราด กม.15 ตำบลบางพลีใหญ่ อำเภอบางพลี จังหวัดสมุทรปราการ 10540',
      phone: '085-392-4448',
      hotline: '085-392-4448',
      hours: 'จันทร์ – เสาร์ 08:00 – 17:30 น. (สายด่วนวิศวกร 24/7)',
      statusLabel: 'เปิดทำการ · ทีมวิศวกรพร้อมดูแล 24/7',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=13.5991,100.6968',
    },
    regions: [
      { id: 'all', label: 'ทั้งหมด (6 แห่ง)' },
      { id: 'central', label: 'ภาคกลาง & ปริมณฑล' },
      { id: 'east', label: 'ภาคตะวันออก (EEC)' },
      { id: 'northeast', label: 'ภาคตะวันออกเฉียงเหนือ' },
      { id: 'north', label: 'ภาคเหนือ' },
      { id: 'south', label: 'ภาคใต้' },
    ],
    serviceCenters: [],
    servicePlants: [],
    installations: [
      {
        id: "inst-chumphon",
        company: "บจก.มรกตชุมพรก่อสร้าง",
        model: "PT-2010RAP",
        province: "จ.ชุมพร",
        image: "assets/images/install-chumphon.jpg",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=บจก.มรกตชุมพรก่อสร้าง+จ.ชุมพร",
        lat: 10.4930,
        lng: 99.1800,
        region: "south",
        regionLabel: "ภาคใต้",
        address: "ตำบลวังใหม่ อำเภอเมืองชุมพร จังหวัดชุมพร",
        statusLabel: "ติดตั้งแล้วเสร็จ · ส่งมอบงานเรียบร้อย"
      },
      {
        id: "inst-uthaithani",
        company: "หจก.ช.ธานีพัฒนา",
        model: "PT-2000",
        province: "จ.อุทัยธานี",
        image: "assets/images/install-uthaithani.jpg",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=หจก.ช.ธานีพัฒนา+จ.อุทัยธานี",
        lat: 15.3835,
        lng: 100.0245,
        region: "central",
        regionLabel: "ภาคกลาง",
        address: "ตำบลหนองไผ่แบน อำเภอเมืองอุทัยธานี จังหวัดอุทัยธานี",
        statusLabel: "ติดตั้งแล้วเสร็จ · ส่งมอบงานเรียบร้อย"
      },
      {
        id: "inst-kamphaengphet",
        company: "หจก.ส.ศิระก่อสร้าง",
        model: "PT-1500",
        province: "จ.กำแพงเพชร",
        image: "assets/images/install-kamphaengphet.jpg",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=หจก.ส.ศิระก่อสร้าง+จ.กำแพงเพชร",
        lat: 16.4827,
        lng: 99.5226,
        region: "north",
        regionLabel: "ภาคเหนือ",
        address: "ตำบลในเมือง อำเภอเมืองกำแพงเพชร จังหวัดกำแพงเพชร",
        statusLabel: "ติดตั้งแล้วเสร็จ · ส่งมอบงานเรียบร้อย"
      },
      {
        id: "inst-surin",
        company: "หจก.สุรินทร์อมรวัฒน์ก่อสร้าง",
        model: "PT-2000",
        province: "จ.สุรินทร์",
        image: "assets/images/install-surin.jpg",
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=หจก.สุรินทร์อมรวัฒน์ก่อสร้าง+จ.สุรินทร์",
        lat: 14.8829,
        lng: 103.4937,
        region: "northeast",
        regionLabel: "ภาคตะวันออกเฉียงเหนือ",
        address: "ตำบลนอกเมือง อำเภอเมืองสุรินทร์ จังหวัดสุรินทร์",
        statusLabel: "ติดตั้งแล้วเสร็จ · ส่งมอบงานเรียบร้อย"
      }
    ],
  };

  async function loadLocationsData() {
    try {
      const res = await fetch(`/api/locations?_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('api locations');
      return await res.json();
    } catch (e) {
      try {
        const localRes = await fetch(`../backend/data/locations.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (localRes.ok) return await localRes.json();
      } catch (err) { }
      return FALLBACK_LOCATIONS;
    }
  }

  function createInteractiveMap(containerId, items, opts = {}) {
    const container = document.getElementById(containerId);
    if (!container || !items || !items.length) return null;

    const onSelect = opts.onSelect || (() => { });
    const initialZoom = opts.initialZoom || 6;
    const center = opts.center || [13.75, 100.85];

    if (window.L) {
      const map = window.L.map(container, {
        center,
        zoom: initialZoom,
        scrollWheelZoom: false,
      });

      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      const markers = new Map();

      const buildPinIcon = (active) =>
        window.L.divIcon({
          className: 'ptx-pin-icon',
          html: `<div class="ptx-pin ${active ? 'is-active' : ''}"><span class="ptx-pin__pulse"></span><span class="ptx-pin__core"></span></div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 34],
          popupAnchor: [0, -32],
        });

      const buildPopupHtml = (item) => {
        const sub = item.model
          ? `<div class="ptx-popup__meta"><span>${esc(item.model)}</span><span>·</span><span>${esc(item.capacity || item.province)}</span></div>`
          : item.responseTime
            ? `<div class="ptx-popup__meta"><span>ตอบสนอง ${esc(item.responseTime)}</span><span>·</span><span>ฉุกเฉิน ${esc(item.emergencyPhone || item.phone)}</span></div>`
            : '';
        const telClean = item.phone ? String(item.phone).replace(/[^0-9+]/g, '') : '';
        const phoneBtn = item.phone ? `<a class="ptx-popup__btn-ghost" href="tel:${esc(telClean)}">โทร ${esc(item.phone)}</a>` : '';
        const tag = item.isInstallation ? 'ผลงานติดตั้งจริง' : (item.code || item.province || 'PROTEX GROUP');
        return `
          <div class="ptx-popup">
            <span class="ptx-popup__tag">${esc(tag)}</span>
            <h4>${esc(item.company || item.name)}</h4>
            ${sub}
            <p>${esc(item.address || item.province)}</p>
            <div class="ptx-popup__actions">
              <a class="ptx-popup__btn-red" href="${esc(item.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">เปิดใน Google Maps ↗</a>
              ${phoneBtn}
            </div>
          </div>`;
      };

      items.forEach((item, idx) => {
        const marker = window.L.marker([item.lat, item.lng], {
          icon: buildPinIcon(idx === 0),
        }).addTo(map);
        marker.bindPopup(buildPopupHtml(item), { maxWidth: 300 });
        marker.on('click', () => {
          focusItem(item.id, false);
          onSelect(item);
        });
        markers.set(item.id, { marker, item });
      });

      const focusItem = (id, fly = true) => {
        const entry = markers.get(id);
        if (!entry) return;
        markers.forEach((v, k) => {
          v.marker.setIcon(buildPinIcon(k === id));
        });
        if (fly) {
          map.flyTo([entry.item.lat, entry.item.lng], opts.focusZoom || 11, {
            duration: 0.85,
          });
        }
        entry.marker.openPopup();
      };

      const fitAll = () => {
        const bounds = window.L.latLngBounds(items.map((x) => [x.lat, x.lng]));
        if (bounds.isValid()) map.fitBounds(bounds.pad(0.22));
      };

      setTimeout(() => map.invalidateSize(), 180);
      return { focusItem, fitAll };
    }

    // Fallback interactive vector map if Leaflet CDN is offline
    container.innerHTML = `
      <div class="ptx-vector-map">
        <div class="ptx-vector-map__grid"></div>
        ${items
        .map((item, idx) => {
          const x = Math.min(88, Math.max(12, ((item.lng - 97.5) / 8.0) * 76 + 12));
          const y = Math.min(88, Math.max(14, ((20.5 - item.lat) / 14.5) * 74 + 14));
          return `
              <button type="button" class="ptx-vector-map__pin" data-pin-id="${esc(item.id)}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%">
                <span class="ptx-vector-map__label">${esc(item.province || item.name)}</span>
                <span class="ptx-pin ${idx === 0 ? 'is-active' : ''}"><span class="ptx-pin__pulse"></span><span class="ptx-pin__core"></span></span>
              </button>`;
        })
        .join('')}
      </div>`;

    const focusItem = (id) => {
      container.querySelectorAll('.ptx-vector-map__pin').forEach((btn) => {
        const pin = btn.querySelector('.ptx-pin');
        if (pin) pin.classList.toggle('is-active', btn.dataset.pinId === id);
      });
    };

    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.ptx-vector-map__pin');
      if (!btn) return;
      const found = items.find((x) => x.id === btn.dataset.pinId);
      if (found) {
        focusItem(found.id);
        onSelect(found);
      }
    });

    return { focusItem, fitAll: () => { } };
  }

  function initCopyButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;
      const text = btn.getAttribute('data-copy') || '';
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast(`คัดลอก “${text}” เรียบร้อยแล้ว`);
        });
      } else {
        showToast(`ข้อมูล: ${text}`);
      }
    });
  }

  async function initContactPage() {
    initCopyButtons();
    const data = await loadLocationsData();
    const hq = data.headquarters || FALLBACK_LOCATIONS.headquarters;
    const allPoints = [hq, ...(data.serviceCenters || []).filter((c) => c.id !== 'sc-samutprakan')];

    const updateCard = (loc) => {
      const tagEl = document.getElementById('contactMapCardTag');
      const titleEl = document.getElementById('contactMapCardTitle');
      const addrEl = document.getElementById('contactMapCardAddress');
      const navEl = document.getElementById('contactMapCardNav');
      const telEl = document.getElementById('contactMapCardTel');
      if (tagEl) tagEl.textContent = loc.code || loc.province || 'HEADQUARTERS';
      if (titleEl) titleEl.textContent = loc.name;
      if (addrEl) addrEl.textContent = loc.address;
      if (navEl) navEl.href = loc.googleMapsUrl;
      if (telEl) {
        const clean = String(loc.phone || '085-392-4448').replace(/[^0-9+]/g, '');
        telEl.href = `tel:${clean}`;
        telEl.textContent = `โทร ${loc.phone || '085-392-4448'}`;
      }
    };

    const mapCtrl = createInteractiveMap('contactMapCanvas', allPoints, {
      center: [hq.lat, hq.lng],
      initialZoom: 11,
      focusZoom: 13,
      onSelect: updateCard,
    });

    const form = document.getElementById('inquiryForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        form.querySelectorAll('.field__error').forEach((el) => {
          el.textContent = '';
        });
        const fd = new FormData(form);
        const payload = Object.fromEntries(fd.entries());
        try {
          const res = await fetch('/api/inquiry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const out = await res.json();
          if (!res.ok) {
            if (out.errors) {
              Object.entries(out.errors).forEach(([k, msg]) => {
                const errEl = form.querySelector(`[data-err="${k}"]`);
                if (errEl) errEl.textContent = msg;
              });
            }
            return;
          }
          form.reset();
          showToast(`ส่งข้อความสำเร็จ (${out.ref}) · ทีมวิศวกรจะติดต่อกลับโดยเร็วที่สุด`);
        } catch (err) {
          form.reset();
          showToast('ส่งข้อความสอบถามเรียบร้อยแล้ว · ทีมวิศวกรจะติดต่อกลับโดยเร็วที่สุด');
        }
      });
    }
  }

  async function initAfterSalesPage() {
    // Service centers map section removed from after-sales.html
    const listEl = document.getElementById('serviceCentersList');
    if (!listEl) return;
  }

  async function initServicePlantsPage() {
    const data = await loadLocationsData();
    const installations = data.installations || FALLBACK_LOCATIONS.installations || [];
    const listEl = document.getElementById('servicePlantsList');
    const filterEl = document.getElementById('plantRegionFilters');
    const searchEl = document.getElementById('plantLocationSearch');
    const countBadge = document.getElementById('plantCountBadge');
    const installGrid = document.getElementById('installationsGrid');

    // 1. Render Verified Client Installation Cards (Top Showcase Grid)
    if (installGrid && installations.length) {
      installGrid.innerHTML = installations.map((inst) => `
        <article class="install-card" data-inst-id="${esc(inst.id)}">
          <div class="install-card__media">
            <span class="install-card__badge">
              <span class="install-card__badge-dot" aria-hidden="true"></span>
              <span>${esc(inst.model)}</span>
            </span>
            <div class="install-card__scrim" aria-hidden="true"></div>
            <img src="${esc(inst.image)}" alt="${esc(inst.company)} ${esc(inst.model)}" class="install-card__img" loading="lazy" width="800" height="500">
          </div>
          <div class="install-card__body">
            <h3 class="install-card__title" title="${esc(inst.company)}">${esc(inst.company)}</h3>
            <div class="install-card__location">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>${esc(inst.province)} · ติดตั้งแล้วเสร็จ</span>
            </div>
            <div class="install-card__actions">
              <a href="${esc(inst.googleMapsUrl)}" target="_blank" rel="noopener noreferrer" class="install-card__btn-maps">
                <span>Google Maps ↗</span>
              </a>
              <button type="button" class="install-card__btn-map" data-focus-inst="${esc(inst.id)}" aria-label="ดูพิกัด ${esc(inst.company)} บนแผนที่">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                  <line x1="8" y1="2" x2="8" y2="18"/>
                  <line x1="16" y1="6" x2="16" y2="22"/>
                </svg>
                <span>ดูพิกัด</span>
              </button>
            </div>
          </div>
        </article>
      `).join('');
    }

    if (!listEl || !installations.length) return;

    let currentRegion = 'all';
    let currentQuery = '';
    let activeId = installations[0].id;

    // Map items for Leaflet: driven directly by client installations
    const mapItems = installations.map((inst) => ({
      ...inst,
      name: inst.company,
      code: inst.model,
      capacity: 'ผลงานติดตั้งจริง',
      isInstallation: true,
    }));

    const mapCtrl = createInteractiveMap('servicePlantsMapCanvas', mapItems, {
      center: [13.7367, 100.5231],
      initialZoom: 6,
      focusZoom: 12,
      onSelect: (item) => {
        activeId = item.id;
        listEl.querySelectorAll('.sp-card').forEach((card) => {
          const isMatch = card.dataset.spId === activeId;
          card.classList.toggle('is-active', isMatch);
          card.setAttribute('aria-selected', String(isMatch));
          if (isMatch) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      },
    });

    // Synchronize top showcase card button -> directory card + map marker
    if (installGrid) {
      installGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-focus-inst]');
        if (!btn) return;
        const instId = btn.dataset.focusInst;
        const mapSection = document.getElementById('plantMapSection') || document.getElementById('servicePlantsMapCanvas');
        if (mapSection) {
          mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        activeId = instId;
        listEl.querySelectorAll('.sp-card').forEach((card) => {
          const isMatch = card.dataset.spId === activeId;
          card.classList.toggle('is-active', isMatch);
          card.setAttribute('aria-selected', String(isMatch));
          if (isMatch) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        setTimeout(() => {
          mapCtrl?.focusItem(instId, true);
        }, 400);
      });
    }

    // Dynamic region filter chips for installations
    if (filterEl) {
      const regionNamesMap = {
        central: 'ภาคกลาง',
        north: 'ภาคเหนือ',
        northeast: 'ภาคตะวันออกเฉียงเหนือ',
        south: 'ภาคใต้',
        east: 'ภาคตะวันออก',
      };
      const uniqueRegions = Array.from(new Set(installations.map((i) => i.region).filter(Boolean)));
      const regionsList = [
        { id: 'all', label: `ทั้งหมด (${installations.length} แห่ง)` },
        ...uniqueRegions.map((rid) => {
          const matched = installations.find((i) => i.region === rid);
          return { id: rid, label: matched?.regionLabel || regionNamesMap[rid] || rid };
        }),
      ];

      filterEl.innerHTML = regionsList
        .map(
          (r) => `
          <button type="button" class="chip" data-region="${esc(r.id)}" aria-pressed="${r.id === currentRegion}">
            ${esc(r.label)}
          </button>`
        )
        .join('');

      filterEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-region]');
        if (!btn) return;
        currentRegion = btn.dataset.region;
        filterEl.querySelectorAll('[data-region]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        renderDirectory();
      });
    }

    const renderDirectory = () => {
      const q = currentQuery.trim().toLowerCase();
      const filtered = installations.filter((inst) => {
        const regionMatch = currentRegion === 'all' || inst.region === currentRegion;
        if (!regionMatch) return false;
        if (!q) return true;
        const hay = `${inst.company} ${inst.province} ${inst.model} ${inst.address} ${inst.regionLabel || ''}`.toLowerCase();
        return hay.includes(q);
      });

      if (countBadge) countBadge.textContent = `${filtered.length} แห่ง`;

      if (!filtered.length) {
        listEl.innerHTML = `<div class="empty-state glass"><p>ไม่พบผลงานติดตั้งจริงที่ตรงกับคำค้นหา</p></div>`;
        return;
      }

      if (!filtered.some((x) => x.id === activeId)) {
        activeId = filtered[0].id;
      }

      listEl.innerHTML = filtered
        .map((inst) => {
          const isSel = inst.id === activeId;
          return `
          <article class="sp-card ${isSel ? 'is-active' : ''}" role="tab" tabindex="0" data-sp-id="${esc(inst.id)}" aria-selected="${isSel}">
            <div class="sp-card__top">
              <span class="chip chip--red">${esc(inst.model)} · ${esc(inst.province)}</span>
              <span class="chip chip--soft">ติดตั้งแล้วเสร็จ · ส่งมอบเรียบร้อย</span>
            </div>
            <h3>${esc(inst.company)}</h3>
            <div class="sp-card__specs">
              <div><span>รุ่นแพล้นท์</span><strong>${esc(inst.model)}</strong></div>
              <div><span>ที่ตั้ง</span><strong>${esc(inst.province)}</strong></div>
              <div><span>ภูมิภาค</span><strong>${esc(inst.regionLabel || 'ทั่วประเทศ')}</strong></div>
            </div>
            <p class="sp-card__addr">${esc(inst.address)}</p>
            <div class="sp-card__foot">
              <span class="muted" style="display:inline-flex; align-items:center; gap:6px; font-size:0.82rem;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" aria-hidden="true" style="color:var(--brand-red);">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                พิกัดจริงบนแผนที่
              </span>
              <div class="sp-card__actions">
                <a href="${esc(inst.googleMapsUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn--sm btn--red" data-stop-prop>เปิดใน Google Maps ↗</a>
              </div>
            </div>
          </article>`;
        })
        .join('');
    };

    renderDirectory();

    listEl.addEventListener('click', (e) => {
      if (e.target.closest('[data-stop-prop]')) return;
      const card = e.target.closest('.sp-card');
      if (!card) return;
      activeId = card.dataset.spId;
      listEl.querySelectorAll('.sp-card').forEach((c) => {
        const isMatch = c.dataset.spId === activeId;
        c.classList.toggle('is-active', isMatch);
        c.setAttribute('aria-selected', String(isMatch));
      });
      mapCtrl?.focusItem(activeId, true);
    });

    if (searchEl) {
      searchEl.addEventListener('input', () => {
        currentQuery = searchEl.value || '';
        renderDirectory();
      });
    }

    document.getElementById('fitAllPlantsBtn')?.addEventListener('click', () => {
      mapCtrl?.fitAll();
    });
  }

  /* ------------------------------ Boot ------------------------------ */
  initHeaderNav();
  initSearch();
  initAuth();
  observeReveals();
  initStatCounters();
  initSurfacePhysics();

  if (page === 'home') initHomePage();
  if (page === 'promotions') initPromotionsPage();
  if (page === 'contact') initContactPage();
  if (page === 'after-sales') initAfterSalesPage();
  if (page === 'service-plants') initServicePlantsPage();

  window.PTX = { ICONS, esc, formatTHB, showToast, openModal, closeModal, observeReveals };
})();
