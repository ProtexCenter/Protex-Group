/* =========================================================================
   PROTEX GROUP — SPARE PARTS E-COMMERCE & CUSTOMER REVIEWS (`marquee.js`)
   - Strict Orderable-Only Spare Parts Storefront (`spare-parts.json`)
   - Single-Row Sleek Category Filter + Live Search (Name / SKU)
   - Persistent Cart (`localStorage: protex_cart_v1`) + 60fps Slide-Over Glass Drawer
   - 2-Step Checkout Flow -> `POST /api/orders` (`backend/data/orders.json`)
   - Customer Reviews Section (`reviews.json`)
   ========================================================================= */

(function () {
  'use strict';

  const { ICONS, esc: rawEsc, formatTHB, observeReveals } = window.PTX || {};
  const THB = new Intl.NumberFormat('th-TH');
  const fmt = formatTHB || ((n) => `฿${THB.format(Math.round(Number(n) || 0))}`);
  const esc =
    rawEsc ||
    ((s) =>
      String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;'));

  const CART_STORAGE_KEY = 'protex_cart_v1';

  const FALLBACK_SPARE_PARTS = [
    {
      id: 'sp-nomex-300',
      sku: 'PTX-FLT-NMX300',
      name: 'ถุงกรองฝุ่น Baghouse Nomex เกรดทนความร้อนสูง',
      category: 'ระบบดักฝุ่น',
      spec: 'ทนอุณหภูมิต่อเนื่อง 200–220 °C · เคลือบ PTFE กันชื้นและกรดกำมะถัน อายุใช้งานยาวนาน',
      price: 1450,
      originalPrice: 1950,
      unit: 'ใบ',
      discount: '-25%',
      status: 'พร้อมส่ง 24 ชม.',
      orderable: true,
      inStock: true,
      image: '',
      icon: 'filter',
    },
    {
      id: 'sp-burner-nozzle',
      sku: 'PTX-BRN-AT285',
      name: 'ชุดหัวฉีดและระบบจุดระเบิดหัวเผา A-TECH / Dual-Fuel',
      category: 'ระบบหัวเผา',
      spec: 'รองรับน้ำมันเตา, ดีเซล และ LPG/NG · หัวฉีดสแตนเลสทนความร้อนสูง อะไหล่แท้ OEM',
      price: 28500,
      originalPrice: 34800,
      unit: 'ชุด',
      discount: '-18%',
      status: 'พร้อมส่ง 24 ชม.',
      orderable: true,
      inStock: true,
      image: '',
      icon: 'flame',
    },
    {
      id: 'sp-mixer-paddle',
      sku: 'PTX-MIX-NIH42',
      name: 'ใบพายและแผ่นซับในมิกเซอร์ Ni-Hard เหล็กหล่อเหนียวพิเศษ',
      category: 'ชุดผสม Mixer',
      spec: 'ทนการสึกกร่อนสูงระดับ 58–62 HRC สำหรับมิกเซอร์ Twin-Shaft 1,600 – 4,000 กก.',
      price: 4200,
      originalPrice: 5400,
      unit: 'ชิ้น',
      discount: '-22%',
      status: 'มีสต็อกครบทุกรุ่น',
      orderable: true,
      inStock: true,
      image: '',
      icon: 'gear',
    },
    {
      id: 'sp-drum-bearing',
      sku: 'PTX-DRY-SKF360',
      name: 'ชุดลูกปืนเพลาดรัมและล้อประคอง SKF / FAG Heavy-Duty',
      category: 'ชุดอบแห้ง Dryer',
      spec: 'รองรับโหลดหนักและอุณหภูมิสูงต่อเนื่อง พร้อมเสื้อลูกปืนและซีลกันฝุ่นสองชั้น',
      price: 36000,
      originalPrice: 42500,
      unit: 'ชุด',
      discount: '-15%',
      status: 'พร้อมส่ง 24 ชม.',
      orderable: true,
      inStock: true,
      image: '',
      icon: 'bearing',
    },
    {
      id: 'sp-screen-mesh',
      sku: 'PTX-SCR-MN89',
      name: 'ตะแกรงคัดขนาดหินเหล็กแมงกานีสสูง (High-Mn Screen)',
      category: 'ชุดคัดขนาด',
      spec: 'เหล็กสปริงทอพิเศษทนแรงกระแทกสูง สั่งตัดตามขนาดชั้นตะแกรง 4–6 ชั้น',
      price: 8900,
      originalPrice: 10200,
      unit: 'แผ่น',
      discount: '-12%',
      status: 'สั่งตัดส่งใน 48 ชม.',
      orderable: true,
      inStock: true,
      image: '',
      icon: 'grid',
    },
    {
      id: 'sp-load-cell',
      sku: 'PTX-PLC-LC195',
      name: 'Load Cell ชั่งตวงดิจิทัล Class C3 พร้อมใบรับรองสอบเทียบ',
      category: 'ระบบชั่ง & PLC',
      spec: 'ความแม่นยำ ±0.1% กันน้ำและฝุ่นมาตรฐาน IP68 สำหรับชั่งหินร้อน ยางมะตอย และฟิลเลอร์',
      price: 19500,
      originalPrice: 22900,
      unit: 'ตัว',
      discount: '-15%',
      status: 'พร้อมส่ง 24 ชม.',
      orderable: true,
      inStock: true,
      image: '',
      icon: 'scale',
    },
    {
      id: 'sp-pulse-valve',
      sku: 'PTX-FLT-PV38',
      name: 'โซลินอยด์วาล์วเป่าถุงกรองฝุ่น Pulse Jet Diaphragm Valve 1.5"',
      category: 'ระบบดักฝุ่น',
      spec: 'คอยล์ทนความร้อน Class H ยิงลมเป่าฝุ่นแรงดันสูง 0.4–0.8 MPa ตอบสนองไว',
      price: 3850,
      originalPrice: 4500,
      unit: 'ตัว',
      discount: '-14%',
      status: 'พร้อมส่ง 24 ชม.',
      orderable: true,
      inStock: true,
      image: '',
      icon: 'filter',
    },
    {
      id: 'sp-bitumen-pump',
      sku: 'PTX-MIX-BMP48',
      name: 'ปั๊มเกียร์สูบจ่ายยางมะตอยหุ้มแจ็คเก็ตน้ำมันร้อน (Thermal Jacket Pump)',
      category: 'ชุดผสม Mixer',
      spec: 'อัตราสูบจ่าย 450–600 ลิตร/นาที พร้อมชุดซีลทนความร้อน 250 °C สำหรับแพล้นท์ทุกรุ่น',
      price: 48000,
      originalPrice: 53500,
      unit: 'ชุด',
      discount: '-10%',
      status: 'พร้อมส่ง 24 ชม.',
      orderable: true,
      inStock: true,
      image: '',
      icon: 'pump',
    },
  ];

  function isOrderablePart(item) {
    return (
      Boolean(item) &&
      item.orderable !== false &&
      item.inStock !== false &&
      Number(item.price) > 0 &&
      String(item.name || '').trim().length > 0
    );
  }

  /* =========================================================================
     1. SPARE PARTS CATALOG + SLIDE-OVER LIQUID GLASS CART DRAWER
     ========================================================================= */
  async function initSparePartsCatalog() {
    const grid = document.getElementById('sparePartsCatalogGrid');
    const filterBar = document.getElementById('partsCatalogFilters');
    const searchInput = document.getElementById('spCatalogSearchInput');
    const countBadge = document.getElementById('partsCatalogCountBadge');
    const cartOpenBtn = document.getElementById('spCartOpenBtn');
    const cartCountBadge = document.getElementById('spCartCountBadge');
    const cartTotalText = document.getElementById('spCartTotalText');

    // Slide-Over Drawer Elements
    const cartDrawer = document.getElementById('spCartDrawer');
    const drawerHeaderCount = document.getElementById('spDrawerHeaderCount');
    const drawerClearBtn = document.getElementById('spDrawerClearBtn');
    const stepsBar = document.getElementById('spDrawerStepsBar');
    const stepInd1 = document.getElementById('spStepIndicator1');
    const stepInd2 = document.getElementById('spStepIndicator2');
    const viewStep1 = document.getElementById('spDrawerStep1');
    const viewStep1Foot = document.getElementById('spDrawerStep1Foot');
    const viewStep2 = document.getElementById('spDrawerStep2');
    const viewSuccess = document.getElementById('spDrawerSuccess');
    const cartItemsList = document.getElementById('spCartItemsList');
    const proceedBtn = document.getElementById('spProceedToStep2Btn');
    const backToStep1Btn = document.getElementById('spBackToStep1Btn');
    const orderForm = document.getElementById('spOrderForm');

    if (!grid) return;

    let rawCatalog = FALLBACK_SPARE_PARTS;
    try {
      const res = await fetch(`/api/spare-parts?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.catalog)) rawCatalog = data.catalog;
      }
    } catch (e) {
      try {
        const localRes = await fetch(`../backend/data/spare-parts.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (localRes.ok) {
          const data = await localRes.json();
          if (Array.isArray(data.catalog)) rawCatalog = data.catalog;
        }
      } catch (e2) {}
    }

    try {
      const localOverride = localStorage.getItem('ptx_cms_override_spare-parts');
      if (localOverride) {
        const parsed = JSON.parse(localOverride);
        if (Array.isArray(parsed?.catalog) && parsed.catalog.length) {
          rawCatalog = parsed.catalog;
        }
      }
    } catch (e) {}

    const catalog = rawCatalog.filter(isOrderablePart);
    if (!catalog.length) {
      grid.innerHTML = '<div class="empty-state glass"><p>ขณะนี้ยังไม่มีรายการสินค้าอะไหล่ที่เปิดให้สั่งซื้อออนไลน์</p></div>';
      return;
    }

    const cardDraftQty = {};
    catalog.forEach((item) => {
      cardDraftQty[item.id] = 1;
    });

    // Load Persistent Cart from localStorage (`protex_cart_v1`), migrating from legacy session key if present
    const cart = {};
    try {
      const rawSaved = localStorage.getItem(CART_STORAGE_KEY) || sessionStorage.getItem('ptx_sp_cart') || '{}';
      const parsed = JSON.parse(rawSaved);
      if (parsed && typeof parsed === 'object') {
        Object.entries(parsed).forEach(([id, q]) => {
          if (catalog.some((c) => c.id === id) && Number(q) > 0) {
            cart[id] = Math.min(999, Math.max(1, Math.floor(Number(q))));
          }
        });
      }
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {}

    const persistCart = () => {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        sessionStorage.setItem('ptx_sp_cart', JSON.stringify(cart));
      } catch (e) {}
    };

    const getCartMetrics = () => {
      const lines = [];
      let totalQty = 0;
      let subtotal = 0;
      Object.entries(cart).forEach(([id, qty]) => {
        const item = catalog.find((c) => c.id === id);
        if (item && qty > 0) {
          const unitPrice = Math.round(Number(item.price) || 0);
          const total = unitPrice * qty;
          totalQty += qty;
          subtotal += total;
          lines.push({
            id: item.id,
            sku: item.sku || '',
            name: item.name,
            category: item.category || 'อะไหล่แท้',
            unit: item.unit || 'ชิ้น',
            image: item.image || '',
            icon: item.icon || 'gear',
            qty,
            unitPrice,
            total,
          });
        }
      });
      const vatAmount = Math.round(subtotal * 0.07);
      const grandTotal = subtotal + vatAmount;
      return { lines, totalQty, subtotal, vatAmount, grandTotal };
    };

    const updateCartPillUI = () => {
      const { totalQty, subtotal } = getCartMetrics();
      if (cartCountBadge) cartCountBadge.textContent = String(totalQty);
      if (cartTotalText) cartTotalText.textContent = fmt(subtotal);
      if (drawerHeaderCount) drawerHeaderCount.textContent = `${totalQty} ชิ้น`;
      if (cartOpenBtn) {
        cartOpenBtn.classList.toggle('has-items', totalQty > 0);
      }
      if (drawerClearBtn) {
        drawerClearBtn.hidden = totalQty === 0;
      }
    };

    let activeDrawerStep = 1;

    const setDrawerStep = (step) => {
      activeDrawerStep = step;
      if (stepsBar) stepsBar.hidden = step === 3;
      if (viewStep1) viewStep1.hidden = step !== 1;
      if (viewStep2) viewStep2.hidden = step !== 2;
      if (viewSuccess) viewSuccess.hidden = step !== 3;
      if (stepInd1) stepInd1.classList.toggle('is-active', step === 1);
      if (stepInd2) stepInd2.classList.toggle('is-active', step === 2);

      const { totalQty, grandTotal } = getCartMetrics();
      const s2Qty = document.getElementById('spStep2Qty');
      const s2Total = document.getElementById('spStep2GrandTotal');
      if (s2Qty) s2Qty.textContent = `${totalQty} ชิ้น`;
      if (s2Total) s2Total.textContent = `${fmt(grandTotal)} (รวม VAT 7%)`;
    };

    const renderDrawerCartList = () => {
      if (!cartItemsList) return;
      const { lines, totalQty, subtotal, vatAmount, grandTotal } = getCartMetrics();
      const setTxt = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      setTxt('spSumSubtotal', fmt(subtotal));
      setTxt('spSumVat', fmt(vatAmount));
      setTxt('spSumGrandTotal', fmt(grandTotal));
      setTxt('spStep2Qty', `${totalQty} ชิ้น`);
      setTxt('spStep2GrandTotal', `${fmt(grandTotal)} (รวม VAT 7%)`);

      if (viewStep1Foot) {
        viewStep1Foot.hidden = lines.length === 0;
      }
      if (proceedBtn) {
        proceedBtn.disabled = lines.length === 0;
      }

      if (!lines.length) {
        cartItemsList.innerHTML = `
          <div class="sp-cart-empty">
            <div class="sp-cart-empty__orb" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M2.5 3h2.8l2.4 11.4a2 2 0 0 0 2 1.6h9.5a2 2 0 0 0 1.9-1.4L23 6H6.2"/></svg>
            </div>
            <strong>ยังไม่มีสินค้าอะไหล่ในตะกร้า</strong>
            <p>เลือกสินค้าอะไหล่แท้ PROTEX ที่ต้องการสั่งซื้อจากรายการหน้าเว็บ</p>
            <button type="button" class="sp-cart-empty__btn" data-sp-drawer-close>เลือกดูอะไหล่</button>
          </div>`;
        return;
      }

      cartItemsList.innerHTML = lines
        .map((l) => {
          const rawSvg = (ICONS && ICONS[l.icon]) || ICONS?.gear || '';
          const thumbSvg = rawSvg.replace('<svg ', '<svg width="26" height="26" ');
          return `
          <article class="sp-cart-item" data-cart-row="${esc(l.id)}">
            <div class="sp-cart-item__thumb">
              ${
                l.image
                  ? `<img src="${esc(l.image)}" alt="${esc(l.name)}" loading="lazy">`
                  : `<span class="sp-cart-item__icon" aria-hidden="true">${thumbSvg}</span>`
              }
            </div>
            <div class="sp-cart-item__main">
              <div class="sp-cart-item__meta">
                <span class="sp-cart-item__cat">${esc(l.category)}</span>
                ${l.sku ? `<span class="sp-cart-item__sku">${esc(l.sku)}</span>` : ''}
              </div>
              <h4 class="sp-cart-item__name">${esc(l.name)}</h4>
              <div class="sp-cart-item__unit-price">${fmt(l.unitPrice)} / 1 ${esc(l.unit)}</div>
              <div class="sp-cart-item__bottom">
                <div class="sp-qty-stepper sp-qty-stepper--sm">
                  <button type="button" data-cart-dec="${esc(l.id)}" aria-label="ลดจำนวน">−</button>
                  <output>${l.qty}</output>
                  <button type="button" data-cart-inc="${esc(l.id)}" aria-label="เพิ่มจำนวน">+</button>
                </div>
                <strong class="sp-cart-item__line-total">${fmt(l.total)}</strong>
              </div>
            </div>
            <button type="button" class="sp-cart-item__trash" data-cart-rm="${esc(l.id)}" title="ลบรายการนี้ออกจากตะกร้า" aria-label="ลบรายการ">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </article>`;
        })
        .join('');
    };

    const openCartDrawer = (step = 1) => {
      if (!cartDrawer) return;
      renderDrawerCartList();
      setDrawerStep(step);
      cartDrawer.classList.add('is-open');
      cartDrawer.setAttribute('aria-hidden', 'false');
      if (cartOpenBtn) cartOpenBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    const closeCartDrawer = () => {
      if (!cartDrawer) return;
      cartDrawer.classList.remove('is-open');
      cartDrawer.setAttribute('aria-hidden', 'true');
      if (cartOpenBtn) cartOpenBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    let currentCat = 'ทั้งหมด';
    let searchQuery = '';
    const categories = ['ทั้งหมด', ...new Set(catalog.map((i) => i.category).filter(Boolean))];

    const renderGrid = () => {
      const q = searchQuery.trim().toLowerCase();
      const visible = catalog.filter((item) => {
        const matchCat = currentCat === 'ทั้งหมด' || item.category === currentCat;
        if (!matchCat) return false;
        if (!q) return true;
        const hay = `${item.name || ''} ${item.sku || ''} ${item.category || ''} ${item.spec || ''}`.toLowerCase();
        return hay.includes(q);
      });

      if (countBadge) {
        countBadge.textContent = `พร้อมสั่งซื้อ ${visible.length} รายการ`;
      }

      if (!visible.length) {
        grid.innerHTML = `
          <div class="empty-state glass" style="grid-column: 1 / -1; padding: 36px; text-align: center;">
            <p>ไม่พบสินค้าอะไหล่ที่ตรงกับคำค้นหา</p>
          </div>`;
        return;
      }

      grid.innerHTML = visible
        .map((item) => {
          const rawSvg = (ICONS && ICONS[item.icon]) || ICONS?.gear || '';
          const safeSvg = rawSvg.replace('<svg ', '<svg width="52" height="52" ');
          const draftQ = cardDraftQty[item.id] || 1;
          const inCartQ = cart[item.id] || 0;
          const hasOrig = Number(item.originalPrice) > Number(item.price);

          return `
          <article class="sp-order-card glass glass-interactive" data-sp-card="${esc(item.id)}">
            <div class="part-card-media">
              ${
                item.discount
                  ? `<span class="sp-badge sp-badge--discount">${esc(item.discount)}</span>`
                  : ''
              }
              <span class="sp-badge sp-badge--ready">
                <span class="sp-badge__dot"></span>พร้อมสั่งซื้อ
              </span>
              ${
                item.image
                  ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" loading="lazy" decoding="async">`
                  : `<div class="part-card-media__fallback" aria-hidden="true">
                      <div class="part-card-media__orb">${safeSvg}</div>
                      <span class="part-card-media__watermark">PROTEX OEM · ${esc(item.sku || item.category)}</span>
                    </div>`
              }
            </div>

            <div class="sp-order-card__body">
              <div class="sp-order-card__meta">
                <span class="sp-order-card__cat">${esc(item.category || 'อะไหล่แท้')}</span>
                ${item.sku ? `<span class="sp-order-card__sku">${esc(item.sku)}</span>` : ''}
                ${inCartQ > 0 ? `<span class="sp-order-card__in-cart">ในตะกร้า ${inCartQ}</span>` : ''}
              </div>
              <h3 class="sp-order-card__title">${esc(item.name)}</h3>
              <p class="sp-order-card__desc">${esc(item.spec || '')}</p>
            </div>

            <div class="sp-order-card__foot">
              <div class="sp-order-card__price-row">
                <div class="sp-order-card__price-main">
                  <strong class="sp-order-card__price">${fmt(item.price)}</strong>
                  ${hasOrig ? `<del class="sp-order-card__orig">${fmt(item.originalPrice)}</del>` : ''}
                </div>
                <span class="sp-order-card__unit">/ 1 ${esc(item.unit || 'ชิ้น')}</span>
              </div>

              <div class="sp-order-card__actions">
                <div class="sp-qty-stepper" aria-label="เลือกจำนวนสั่งซื้อ">
                  <button type="button" data-sp-qdec="${esc(item.id)}" aria-label="ลดจำนวน">−</button>
                  <output data-sp-qout="${esc(item.id)}">${draftQ}</output>
                  <button type="button" data-sp-qinc="${esc(item.id)}" aria-label="เพิ่มจำนวน">+</button>
                </div>
                <button type="button" class="sp-buy-btn" data-sp-buy="${esc(item.id)}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M2.5 3h2.8l2.4 11.4a2 2 0 0 0 2 1.6h9.5a2 2 0 0 0 1.9-1.4L23 6H6.2"/></svg>
                  <span>สั่งซื้อสินค้า</span>
                </button>
              </div>
            </div>
          </article>`;
        })
        .join('');
    };

    if (filterBar) {
      filterBar.innerHTML = categories
        .map((c) => `<button type="button" class="sp-filter-pill" data-spcat="${esc(c)}" aria-pressed="${c === currentCat}">${esc(c)}</button>`)
        .join('');
      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-spcat]');
        if (!btn) return;
        currentCat = btn.dataset.spcat;
        filterBar.querySelectorAll('[data-spcat]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        renderGrid();
      });
    }

    searchInput?.addEventListener('input', () => {
      searchQuery = searchInput.value || '';
      renderGrid();
    });

    grid.addEventListener('click', (e) => {
      const decBtn = e.target.closest('[data-sp-qdec]');
      if (decBtn) {
        const id = decBtn.getAttribute('data-sp-qdec');
        cardDraftQty[id] = Math.max(1, (cardDraftQty[id] || 1) - 1);
        const out = grid.querySelector(`[data-sp-qout="${id}"]`);
        if (out) out.textContent = String(cardDraftQty[id]);
        return;
      }

      const incBtn = e.target.closest('[data-sp-qinc]');
      if (incBtn) {
        const id = incBtn.getAttribute('data-sp-qinc');
        cardDraftQty[id] = Math.min(99, (cardDraftQty[id] || 1) + 1);
        const out = grid.querySelector(`[data-sp-qout="${id}"]`);
        if (out) out.textContent = String(cardDraftQty[id]);
        return;
      }

      const buyBtn = e.target.closest('[data-sp-buy]');
      if (buyBtn) {
        const id = buyBtn.getAttribute('data-sp-buy');
        const addQty = cardDraftQty[id] || 1;
        cart[id] = Math.min(999, (cart[id] || 0) + addQty);
        cardDraftQty[id] = 1;
        persistCart();
        updateCartPillUI();
        renderGrid();
        openCartDrawer(1);
      }
    });

    cartOpenBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer(1);
    });

    drawerClearBtn?.addEventListener('click', () => {
      Object.keys(cart).forEach((k) => delete cart[k]);
      persistCart();
      updateCartPillUI();
      renderDrawerCartList();
      renderGrid();
    });

    proceedBtn?.addEventListener('click', () => {
      const { lines } = getCartMetrics();
      if (!lines.length) return;
      setDrawerStep(2);
    });

    backToStep1Btn?.addEventListener('click', () => {
      setDrawerStep(1);
    });

    stepInd1?.addEventListener('click', () => {
      if (activeDrawerStep !== 3) setDrawerStep(1);
    });

    stepInd2?.addEventListener('click', () => {
      const { lines } = getCartMetrics();
      if (lines.length && activeDrawerStep !== 3) setDrawerStep(2);
    });

    cartDrawer?.addEventListener('click', (e) => {
      if (e.target.closest('[data-sp-drawer-close]')) {
        closeCartDrawer();
        return;
      }

      const dec = e.target.closest('[data-cart-dec]');
      if (dec) {
        const id = dec.getAttribute('data-cart-dec');
        if (cart[id] > 1) cart[id] -= 1;
        else delete cart[id];
        persistCart();
        updateCartPillUI();
        renderDrawerCartList();
        renderGrid();
        return;
      }

      const inc = e.target.closest('[data-cart-inc]');
      if (inc) {
        const id = inc.getAttribute('data-cart-inc');
        cart[id] = Math.min(999, (cart[id] || 1) + 1);
        persistCart();
        updateCartPillUI();
        renderDrawerCartList();
        renderGrid();
        return;
      }

      const rm = e.target.closest('[data-cart-rm]');
      if (rm) {
        const id = rm.getAttribute('data-cart-rm');
        delete cart[id];
        persistCart();
        updateCartPillUI();
        renderDrawerCartList();
        renderGrid();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && cartDrawer?.classList.contains('is-open')) {
        closeCartDrawer();
      }
    });

    orderForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      orderForm.querySelectorAll('[data-sp-err]').forEach((el) => (el.textContent = ''));

      const { lines, totalQty, subtotal, vatAmount, grandTotal } = getCartMetrics();
      if (!lines.length) return;

      const customer = {
        name: document.getElementById('spOrdName')?.value.trim() || '',
        phone: document.getElementById('spOrdPhone')?.value.trim() || '',
        company: document.getElementById('spOrdCompany')?.value.trim() || '',
        email: document.getElementById('spOrdEmail')?.value.trim() || '',
        address: document.getElementById('spOrdAddress')?.value.trim() || '',
        note: document.getElementById('spOrdNote')?.value.trim() || '',
      };

      const errs = {};
      if (customer.name.length < 2) errs.name = 'กรุณากรอกชื่อผู้สั่งซื้อ';
      if (!/^[0-9+\-\s]{9,15}$/.test(customer.phone)) errs.phone = 'กรุณากรอกเบอร์โทรศัพท์ 9–15 หลัก';
      if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) errs.email = 'รูปแบบอีเมลไม่ถูกต้อง';
      if (customer.address.length < 5) errs.address = 'กรุณากรอกที่อยู่จัดส่ง / ไซต์งาน';

      if (Object.keys(errs).length) {
        Object.entries(errs).forEach(([k, msg]) => {
          const errEl = orderForm.querySelector(`[data-sp-err="${k}"]`);
          if (errEl) errEl.textContent = msg;
        });
        return;
      }

      const submitBtn = document.getElementById('spOrderSubmitBtn');
      const spinner = submitBtn?.querySelector('.spinner');
      if (submitBtn) submitBtn.disabled = true;
      if (spinner) spinner.hidden = false;

      let orderRecord = null;
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer, items: lines }),
        });
        const out = await res.json();
        if (res.ok && out.ok && out.order) {
          orderRecord = out.order;
        }
      } catch (err) {}

      if (!orderRecord) {
        const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const fallbackRef = `ORD-${ymd}-${String(Math.floor(100 + Math.random() * 900))}`;
        orderRecord = {
          id: `ord-${Date.now().toString(36)}`,
          ref: fallbackRef,
          createdAt: new Date().toISOString(),
          status: 'pending',
          paymentStatus: 'unpaid',
          carrier: '',
          trackingNo: '',
          taxInvoiceNo: '',
          salesOwner: '',
          internalNote: '',
          customer,
          lines,
          totalQty,
          shippingFee: 0,
          discountAmount: 0,
          subtotal,
          vatRate: 7,
          vatAmount,
          grandTotal,
          currency: 'THB',
          emailStatus: 'pending_smtp',
          emailSender: 'protexgroupa@gmail.com',
          emailRecipients: ['protexgroupa@gmail.com', customer.email].filter(Boolean),
          emailStatusNote: 'บันทึกคำสั่งซื้ออะไหล่เรียบร้อยแล้ว',
        };
      }

      // Mirror to localStorage for Admin Dashboard offline/static preview sync (strictly read only inside admin.html)
      try {
        const rawLocal = localStorage.getItem('ptx_cms_override_orders');
        const parsedLocal = rawLocal ? JSON.parse(rawLocal) : { items: [] };
        const arr = Array.isArray(parsedLocal.items) ? parsedLocal.items : [];
        if (!arr.some((x) => x.ref === orderRecord.ref)) {
          arr.unshift(orderRecord);
          localStorage.setItem('ptx_cms_override_orders', JSON.stringify({ items: arr }));
        }
      } catch (err) {}

      // Clear Cart
      Object.keys(cart).forEach((k) => delete cart[k]);
      persistCart();
      updateCartPillUI();
      renderDrawerCartList();
      renderGrid();

      if (submitBtn) submitBtn.disabled = false;
      if (spinner) spinner.hidden = true;

      const refEl = document.getElementById('spOrderSuccessRef');
      const totalEl = document.getElementById('spOrderSuccessTotal');
      const noteEl = document.getElementById('spOrderSuccessMailNote');
      if (refEl) refEl.textContent = orderRecord.ref;
      if (totalEl) totalEl.textContent = fmt(orderRecord.grandTotal || grandTotal);
      if (noteEl) {
        noteEl.textContent =
          orderRecord.emailStatus === 'sent'
            ? `บันทึกคำสั่งซื้อและส่งอีเมลแจ้งเตือนผ่าน protexgroupa@gmail.com เรียบร้อยแล้ว ฝ่ายจัดส่งจะติดต่อยืนยันภายใน 24 ชั่วโมง`
            : 'ข้อมูลคำสั่งซื้อถูกบันทึกเข้าสู่ระบบจัดการคลังอะไหล่หลังบ้าน PROTEX เรียบร้อยแล้ว ฝ่ายจัดส่งจะติดต่อยืนยันภายใน 24 ชั่วโมง';
      }

      orderForm.reset();
      setDrawerStep(3);
    });

    updateCartPillUI();
    renderGrid();
  }

  /* =========================================================================
     2. CUSTOMER REVIEWS (iOS 27 Glass Cards + Star Summary + Tag Filter)
     ========================================================================= */
  const STAR_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9L12 2.5Z"/></svg>';
  const FIVE_STARS = STAR_SVG.repeat(5);

  function starsHTML(rating) {
    const pct = Math.max(0, Math.min(100, (Number(rating) / 5) * 100));
    return `
      <div class="stars" aria-label="คะแนน ${esc(rating)} จาก 5 ดาว">
        ${FIVE_STARS}
        <div class="stars__fill" style="width:${pct}%">${FIVE_STARS}</div>
      </div>`;
  }

  function initials(name) {
    const clean = String(name || '').replace(/^คุณ/, '').trim();
    return clean.slice(0, 2) || 'PT';
  }

  async function initReviews() {
    const grid = document.getElementById('reviewGrid');
    const filterBar = document.getElementById('reviewFilters');
    if (!grid) return;

    let reviews = [];
    try {
      const res = await fetch(`/api/reviews?_t=${Date.now()}`, { cache: 'no-store' });
      reviews = await res.json();
    } catch (e) {
      console.error('Reviews load error:', e);
    }

    if (!reviews.length) {
      grid.innerHTML = '<div class="empty-state glass"><p>ยังไม่มีข้อมูลรีวิว</p></div>';
      return;
    }

    const avg = reviews.reduce((s, r) => s + Number(r.rating || 5), 0) / reviews.length;
    const avgEl = document.getElementById('avgRating');
    const avgStarsEl = document.getElementById('avgStars');
    const totalEl = document.getElementById('totalReviewsText');
    const barsEl = document.getElementById('ratingBars');

    if (avgEl) avgEl.textContent = avg.toFixed(1);
    if (avgStarsEl) {
      avgStarsEl.innerHTML = `${FIVE_STARS}<div class="stars__fill" style="width:${(avg / 5) * 100}%">${FIVE_STARS}</div>`;
    }
    if (totalEl) totalEl.textContent = `จากลูกค้า ${reviews.length} โครงการทั่วประเทศ`;

    if (barsEl) {
      const buckets = [5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((r) => Math.round(Number(r.rating)) === star).length;
        const pct = Math.round((count / reviews.length) * 100);
        return `
          <div class="rating-bar">
            <span>${star} ★</span>
            <div class="rating-bar__track"><div class="rating-bar__fill" style="--w:${pct}%"></div></div>
            <span>${count}</span>
          </div>`;
      });
      barsEl.innerHTML = buckets.join('');
    }

    const allTags = ['ทั้งหมด', ...new Set(reviews.flatMap((r) => r.tags || []))];
    if (filterBar) {
      filterBar.innerHTML = allTags
        .map(
          (t, i) =>
            `<button type="button" class="filter-chip" data-rtag="${esc(t)}" aria-pressed="${i === 0}">${esc(t)}</button>`
        )
        .join('');

      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-rtag]');
        if (!btn) return;
        const tag = btn.dataset.rtag;
        filterBar.querySelectorAll('[data-rtag]').forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        grid.querySelectorAll('.review-card').forEach((card) => {
          const tags = (card.dataset.tags || '').split('|');
          card.classList.toggle('is-hidden', tag !== 'ทั้งหมด' && !tags.includes(tag));
        });
      });
    }

    grid.innerHTML = reviews
      .map(
        (r) => `
        <article class="review-card glass glass-interactive reveal" data-tags="${esc((r.tags || []).join('|'))}">
          <div class="review-card__head">
            ${starsHTML(r.rating)}
            <svg class="review-card__quote" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M10 7H6a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h1v2a1 1 0 0 0 1.6.8L11 16V8a1 1 0 0 0-1-1Zm10 0h-4a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3h1v2a1 1 0 0 0 1.6.8L21 16V8a1 1 0 0 0-1-1Z"/>
            </svg>
          </div>
          <blockquote class="review-card__text">“${esc(r.text)}”</blockquote>
          <div class="review-card__project">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${esc(r.project || '')} · ${esc(r.date || '')}</span>
          </div>
          <div class="review-card__tags">
            ${(r.tags || []).map((t) => `<span class="chip chip--soft">${esc(t)}</span>`).join('')}
          </div>
          <div class="review-card__person">
            <div class="avatar" aria-hidden="true">
              ${r.avatar ? `<img src="${esc(r.avatar)}" alt="">` : `<span>${esc(initials(r.name))}</span>`}
            </div>
            <div>
              <div class="review-card__name">${esc(r.name)}</div>
              <div class="review-card__company">${esc(r.role)} · ${esc(r.company)}</div>
            </div>
          </div>
        </article>`
      )
      .join('');

    if (observeReveals) observeReveals(grid);
  }

  initSparePartsCatalog();
  initReviews();
})();
