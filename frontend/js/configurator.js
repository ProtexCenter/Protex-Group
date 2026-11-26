/**
 * ============================================================================
 * PROTEX GROUP — UNIFIED BENTO CONFIGURATOR STUDIO (`frontend/js/configurator.js`)
 * - Part 1: 1-Row Horizontal Compact Plant Model Selector Bar
 * - Part 2 (Left): Multi-Layer Structure Color Visualizer + Integrated Single-Row Color Dock
 * - Part 2 (Right): Unified Optional Equipment Checklist Rows + Single Live Price Engine Deck
 * - Zero-Drift Integer Calculation + 60fps Rolling Number Counter + Floating Delta Pop-up
 * - 100% Synced with Admin Dashboard Module 2 (`plants.json`) & Module 6 (`accessories.json`)
 * ============================================================================
 */
(function () {
  'use strict';

  const THB = new Intl.NumberFormat('th-TH');
  const parseCleanInt = (val) => {
    if (typeof val === 'number' && Number.isFinite(val)) return Math.round(val);
    const cleaned = String(val ?? '').replace(/[^0-9.-]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? Math.round(num) : 0;
  };
  const fmt = (n) => `฿${THB.format(parseCleanInt(n))}`;
  const fmtCompactMillion = (n) => {
    const val = parseCleanInt(n);
    if (val >= 1000000) {
      const m = (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 2).replace(/\.?0+$/, '');
      return `฿${m}M`;
    }
    return fmt(val);
  };

  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const FALLBACK_ICONS = {
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
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  };

  const DEFAULT_MODELS = [
    {
      id: 'ptx-160',
      category: 'fully-hot',
      name: 'MODEL PT-1510RAP',
      capacity: '110-130',
      capacityUnit: 'T/H',
      basePrice: 36900000,
      tagline: 'RAP 10-80% · Mixer 1,600 kg',
      configurator: {
        base: 'assets/images/configurator/fully-hot-base.svg',
        mask: 'assets/images/configurator/fully-hot-mask.svg',
      },
    },
    {
      id: 'ptx-2010rap',
      category: 'fully-hot',
      name: 'MODEL PT-2010RAP',
      capacity: '180-200',
      capacityUnit: 'T/H',
      basePrice: 48500000,
      tagline: 'RAP 10-80% · Mixer 2,500 kg',
      configurator: {
        base: 'assets/images/configurator/fully-hot-base.svg',
        mask: 'assets/images/configurator/fully-hot-mask.svg',
      },
    },
    {
      id: 'ptx-3015rap',
      category: 'fully-hot',
      name: 'MODEL PT-3015RAP',
      capacity: '300-320',
      capacityUnit: 'T/H',
      basePrice: 58900000,
      tagline: 'RAP 10-80% · Mixer 4,000 kg',
      configurator: {
        base: 'assets/images/configurator/fully-hot-base.svg',
        mask: 'assets/images/configurator/fully-hot-mask.svg',
      },
    },
    {
      id: 'model-rap50',
      category: 'hot-re',
      name: 'MODEL RAP50',
      capacity: '50-60',
      capacityUnit: 't/h',
      basePrice: 44500000,
      tagline: 'Recycle Asphalt 50-60 t/h · A-TECH Korea',
      configurator: {
        base: 'assets/images/configurator/hot-re-base.svg',
        mask: 'assets/images/configurator/hot-re-mask.svg',
      },
    },
    {
      id: 'model-rap80',
      category: 'hot-re',
      name: 'MODEL RAP80',
      capacity: '70-80',
      capacityUnit: 't/h',
      basePrice: 52500000,
      tagline: 'Recycle Asphalt 70-80 t/h · A-TECH Korea',
      configurator: {
        base: 'assets/images/configurator/hot-re-base.svg',
        mask: 'assets/images/configurator/hot-re-mask.svg',
      },
    },
  ];

  const DEFAULT_ACC = {
    currency: 'THB',
    vatNote: 'ราคายังไม่รวม VAT 7% ค่าขนส่ง และงานฐานราก',
    structureColors: [
      { id: 'crimson', name: 'Crimson Red', nameTh: 'แดงคริมสัน', hex: '#C8102E', code: 'RAL 3020', surcharge: 0 },
      { id: 'signal-blue', name: 'Signal Blue', nameTh: 'น้ำเงินสัญญาณ', hex: '#1F4FA0', code: 'RAL 5005', surcharge: 0 },
      { id: 'traffic-yellow', name: 'Traffic Yellow', nameTh: 'เหลืองจราจร', hex: '#F2B705', code: 'RAL 1023', surcharge: 0 },
      { id: 'pearl-white', name: 'Pearl White', nameTh: 'ขาวมุก', hex: '#F4F3EF', code: 'RAL 1013', surcharge: 0 },
      { id: 'jet-black', name: 'Jet Black', nameTh: 'ดำเจ็ท', hex: '#2A2B30', code: 'RAL 9005', surcharge: 0 },
      { id: 'metallic-silver', name: 'Metallic Silver', nameTh: 'เงินเมทัลลิก', hex: '#AEB4BC', code: 'RAL 9006', surcharge: 185000, metallic: true },
      { id: 'industrial-orange', name: 'Industrial Orange', nameTh: 'ส้มอุตสาหกรรม', hex: '#E8641B', code: 'RAL 2009', surcharge: 0 },
      { id: 'racing-green', name: 'Racing Green', nameTh: 'เขียวเรซซิ่ง', hex: '#1F6B4A', code: 'RAL 6005', surcharge: 0 },
    ],
    items: [
      { id: 'baghouse', name: 'ระบบดักฝุ่น Baghouse Filter', nameEn: 'Pulse-jet Baghouse · 99.9%', category: 'สิ่งแวดล้อม', icon: 'filter', price: 3850000, unit: 'ชุด', maxQty: 1, description: 'ถุงกรอง Nomex ทนร้อน 200 °C ปล่อยฝุ่นต่ำกว่า 20 mg/Nm³ ผ่านเกณฑ์กรมโรงงาน' },
      { id: 'bitumen-tank', name: 'ถังเก็บยางมะตอยเสริม', nameEn: 'Bitumen Tank 50,000 L', category: 'จัดเก็บ', icon: 'tank', price: 1450000, unit: 'ถัง', maxQty: 4, description: 'ถังหุ้มฉนวน 100 มม. ให้ความร้อนด้วย Hot-oil พร้อมเกจวัดระดับแบบดิจิทัล' },
      { id: 'plc', name: 'ระบบควบคุมอัตโนมัติ PLC + SCADA', nameEn: 'Siemens PLC · SCADA', category: 'ควบคุม', icon: 'cpu', price: 2250000, unit: 'ชุด', maxQty: 1, description: 'จัดเก็บสูตรส่วนผสมไม่จำกัด รายงานการผลิตรายแบตช์ และเชื่อมต่อดูสถานะผ่านมือถือ' },
      { id: 'rap', name: 'ระบบ RAP Recycling Unit', nameEn: 'Cold RAP Feed + Crusher', category: 'รีไซเคิล', icon: 'recycle', price: 6800000, unit: 'ชุด', maxQty: 1, description: 'ชุดป้อน RAP เย็นพร้อมเครื่องบดและตะแกรง เติม RAP ได้ 15–25% ในแพล้นท์มาตรฐาน' },
      { id: 'silo', name: 'ไซโลเก็บแอสฟัลต์ร้อน', nameEn: 'Hot Storage Silo 80 t', category: 'จัดเก็บ', icon: 'silo', price: 2900000, unit: 'ไซโล', maxQty: 3, description: 'เก็บส่วนผสมร้อนได้นาน 24 ชม. พร้อมประตูจ่ายแบบไฮดรอลิก' },
      { id: 'burner', name: 'หัวเผาเชื้อเพลิงคู่', nameEn: 'Dual-fuel Burner', category: 'พลังงาน', icon: 'flame', price: 1680000, unit: 'ชุด', maxQty: 1, description: 'สลับใช้น้ำมันเตาและ LPG/NG ได้ทันที ปรับอัตราส่วนอากาศอัตโนมัติ ประหยัดเชื้อเพลิง 8–12%' },
      { id: 'filler', name: 'ระบบไซโลและสกรู Filler', nameEn: 'Filler Silo & Screw', category: 'ป้อนวัตถุดิบ', icon: 'silo', price: 980000, unit: 'ชุด', maxQty: 2, description: 'ไซโล Filler 40 ตัน พร้อมสกรูลำเลียงและระบบชั่งน้ำหนักแยก' },
      { id: 'cold-bin', name: 'ถัง Cold Feed เพิ่ม', nameEn: 'Extra Cold Feed Bin', category: 'ป้อนวัตถุดิบ', icon: 'bin', price: 420000, unit: 'ช่อง', maxQty: 4, description: 'ถังป้อนหินเย็นขนาด 12 ม³ พร้อมสายพาน VFD ควบคุมอัตราป้อน' },
      { id: 'weighbridge', name: 'ตาชั่งรถบรรทุก', nameEn: 'Truck Weighbridge 80 t', category: 'ควบคุม', icon: 'scale', price: 1250000, unit: 'ชุด', maxQty: 1, description: 'ตาชั่งดิจิทัล 18 ม. เชื่อมต่อระบบออกตั๋วจ่ายของอัตโนมัติ' },
      { id: 'additive', name: 'ระบบเติม Fiber / Additive', nameEn: 'Fiber & Additive Dosing', category: 'ป้อนวัตถุดิบ', icon: 'spark', price: 760000, unit: 'ชุด', maxQty: 1, description: 'รองรับส่วนผสม SMA และ PMA ชั่งตวงแม่นยำ ±1%' },
      { id: 'cabin', name: 'ห้องควบคุมเก็บเสียง', nameEn: 'Insulated Control Cabin', category: 'ควบคุม', icon: 'cabin', price: 1100000, unit: 'ห้อง', maxQty: 1, description: 'ห้องควบคุมปรับอากาศ กระจกนิรภัยรอบทิศ เก็บเสียงต่ำกว่า 60 dB' },
      { id: 'warranty', name: 'ขยายการรับประกัน +2 ปี', nameEn: 'Extended Warranty', category: 'บริการ', icon: 'shield', price: 890000, unit: 'แพ็กเกจ', maxQty: 1, description: 'ครอบคลุมอะไหล่และค่าแรง พร้อม PM ทุกไตรมาสโดยวิศวกร Protex' },
    ],
  };

  const stage = document.getElementById('configStage');
  if (!stage) return;

  const state = {
    models: [],
    colors: [],
    items: [],
    modelId: 'ptx-160',
    colorId: 'crimson',
    selected: {}, // { [itemId]: qty }
    category: 'ทั้งหมด',
    lastTotal: 0,
    popoverOpen: false,
  };

  function getIconSvg(name) {
    const icons = (window.PTX && window.PTX.ICONS) || FALLBACK_ICONS;
    return icons[name] || FALLBACK_ICONS[name] || FALLBACK_ICONS.gear;
  }

  function notifyToast(msg) {
    if (window.PTX && typeof window.PTX.showToast === 'function') {
      window.PTX.showToast(msg);
    }
  }

  /* ------------------------------ Smooth 60fps Rolling Number Counter ------------------------------ */
  const counters = new WeakMap();
  function animateCurrency(el, targetValue, highlightChange) {
    if (!el) return;
    const to = parseCleanInt(targetValue);
    const prev = counters.get(el);
    if (prev && prev.raf) cancelAnimationFrame(prev.raf);
    const from = prev && typeof prev.val === 'number' ? prev.val : to;

    if (from === to) {
      el.textContent = fmt(to);
      counters.set(el, { val: to, raf: 0, t: 0 });
      return;
    }

    if (highlightChange) {
      el.classList.remove('is-up', 'is-down');
      el.classList.add(to > from ? 'is-up' : 'is-down');
      if (prev && prev.t) clearTimeout(prev.t);
    }

    const start = performance.now();
    const duration = 440;
    const record = { val: from, raf: 0, t: 0 };
    counters.set(el, record);

    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      const curr = Math.round(from + (to - from) * eased);
      record.val = curr;
      el.textContent = fmt(curr);
      if (p < 1) {
        record.raf = requestAnimationFrame(step);
      } else {
        record.val = to;
        el.textContent = fmt(to);
        record.t = setTimeout(() => {
          el.classList.remove('is-up', 'is-down');
        }, 320);
      }
    };
    record.raf = requestAnimationFrame(step);
  }

  /* ------------------------------ Floating Delta Pop-up (+฿... / -฿...) ------------------------------ */
  function spawnDeltaPopup(deltaAmount) {
    const diff = parseCleanInt(deltaAmount);
    if (!diff) return;
    const anchor = document.getElementById('calcDeltaAnchor');
    const totalBox = document.getElementById('calcTotalBox');
    if (!anchor) return;

    anchor.innerHTML = '';
    const tag = document.createElement('span');
    const isPlus = diff > 0;
    tag.className = `studio-delta-pop ${isPlus ? 'is-plus' : 'is-minus'}`;
    tag.textContent = `${isPlus ? '+' : '−'}${fmt(Math.abs(diff))}`;
    anchor.appendChild(tag);

    if (totalBox) {
      totalBox.classList.remove('is-pulsing');
      void totalBox.offsetWidth;
      totalBox.classList.add('is-pulsing');
    }

    setTimeout(() => {
      tag.remove();
    }, 880);
  }

  /* ------------------------------ Zero-Drift Calculation Engine ------------------------------ */
  const getModel = () => state.models.find((m) => m.id === state.modelId) || state.models[0];
  const getColor = () => state.colors.find((c) => c.id === state.colorId) || state.colors[0];

  function isLightHex(hex) {
    const h = String(hex || '').replace('#', '');
    if (h.length !== 6) return false;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 185;
  }

  function computeTotals() {
    const model = getModel();
    const color = getColor();
    const base = model ? parseCleanInt(model.basePrice) : 0;
    const colorExtra = color ? parseCleanInt(color.surcharge) : 0;
    let addon = 0;
    let count = 0;
    const chosen = [];
    for (const item of state.items) {
      const q = parseCleanInt(state.selected[item.id] || 0);
      if (q > 0) {
        const unitPrice = parseCleanInt(item.price);
        const line = unitPrice * q;
        addon += line;
        count += q;
        chosen.push({ item, qty: q, unitPrice, line });
      }
    }
    const total = base + colorExtra + addon;
    return { model, color, base, colorExtra, addon, total, count, chosen };
  }

  /* ------------------------------ Visual Stage & Color Dock Update ------------------------------ */
  let currentBaseSrc = '';
  function updateStageVisual() {
    const model = getModel();
    const color = getColor();
    if (!model || !color) return;

    stage.style.setProperty('--structure', color.hex);
    stage.classList.toggle('is-metallic', Boolean(color.metallic));

    const stageModelChip = document.getElementById('stageModelChip');
    const stageCapChip = document.getElementById('stageCapChip');
    const colorDot = document.getElementById('colorDot');
    const colorName = document.getElementById('colorName');
    const colorCode = document.getElementById('colorCode');

    if (stageModelChip) stageModelChip.textContent = model.name;
    if (stageCapChip) stageCapChip.textContent = `${model.capacity} ${model.capacityUnit || 'T/H'}`;
    if (colorDot) colorDot.style.background = color.hex;
    if (colorName) colorName.textContent = `สีโครงสร้างหลัก: ${color.nameTh}`;
    const surchargeVal = parseCleanInt(color.surcharge);
    if (colorCode) {
      colorCode.textContent = `${color.code} · ${surchargeVal ? `+${fmt(surchargeVal)}` : 'รวมในมาตรฐาน'}`;
    }

    const baseSrc = model.configurator?.base || 'assets/images/configurator/fully-hot-base.svg';
    const maskSrc = model.configurator?.mask || 'assets/images/configurator/fully-hot-mask.svg';
    if (baseSrc !== currentBaseSrc) {
      currentBaseSrc = baseSrc;
      const layers = document.getElementById('stageLayers');
      const baseImg = document.getElementById('baseLayer');
      const tint = document.getElementById('tintLayer');
      const sheen = document.getElementById('sheenLayer');
      if (layers && baseImg && tint && sheen) {
        layers.classList.add('is-swapping');
        setTimeout(() => {
          baseImg.src = baseSrc;
          const maskCss = `url('${maskSrc}')`;
          tint.style.webkitMaskImage = maskCss;
          tint.style.maskImage = maskCss;
          sheen.style.webkitMaskImage = maskCss;
          sheen.style.maskImage = maskCss;
          layers.classList.remove('is-swapping');
        }, 160);
      }
    }
  }

  /* ------------------------------ Unified Live Price Engine Update ------------------------------ */
  function updatePrices(showDelta = true) {
    const { model, color, base, colorExtra, addon, total, count, chosen } = computeTotals();
    if (!model || !color) return;

    const delta = state.lastTotal > 0 ? total - state.lastTotal : 0;
    state.lastTotal = total;

    // 1. Header Pill Badge & Clear Button
    const calcAddonBadge = document.getElementById('calcAddonBadge');
    if (calcAddonBadge) {
      calcAddonBadge.textContent = chosen.length > 0 ? `เลือกแล้ว ${chosen.length} (${count} ชิ้น)` : 'เลือกแล้ว 0';
      calcAddonBadge.classList.toggle('is-active', chosen.length > 0);
    }

    const clearBtn = document.getElementById('clearAddonsBtn');
    if (clearBtn) {
      clearBtn.disabled = chosen.length === 0;
    }

    // 2. 1-Line Summary & Ratio Bar
    const plantBaseTotal = base + colorExtra;
    const summaryLine = document.getElementById('calcSummaryLine');
    if (summaryLine) {
      summaryLine.textContent = `แพล้นท์ ${fmtCompactMillion(plantBaseTotal)} · อุปกรณ์เสริม +${addon > 0 ? fmtCompactMillion(addon) : '฿0'}`;
    }

    const drawerBtnText = document.getElementById('drawerBtnText');
    if (drawerBtnText) {
      drawerBtnText.textContent = `ดูรายการที่เลือก (${chosen.length})`;
    }

    const safeTotal = Math.max(1, total);
    const baseRatio = Math.round((plantBaseTotal / safeTotal) * 100);
    const addonRatio = Math.max(0, 100 - baseRatio);

    const barBase = document.getElementById('calcBarBase');
    const barAddon = document.getElementById('calcBarAddon');
    if (barBase) barBase.style.width = `${baseRatio}%`;
    if (barAddon) barAddon.style.width = `${addonRatio}%`;

    // 3. Smooth Rolling Total Counter & Delta Pop-up
    animateCurrency(document.getElementById('calcTotalOutput'), total, true);
    if (showDelta && delta !== 0) {
      spawnDeltaPopup(delta);
    }

    // 4. Popover Drawer Receipt List
    const receiptList = document.getElementById('calcReceiptList');
    if (receiptList) {
      const baseRow = `
        <li class="studio-receipt-item is-base">
          <div class="studio-receipt-item__main">
            <strong>${esc(model.name)}</strong>
            <span>สี${esc(color.nameTh)} (${esc(color.code)})</span>
          </div>
          <span class="studio-receipt-item__price tnum">${fmt(plantBaseTotal)}</span>
        </li>
      `;
      const addonRows = chosen.length
        ? chosen
            .map(
              ({ item, qty, line }) => `
              <li class="studio-receipt-item">
                <div class="studio-receipt-item__main">
                  <strong>${esc(item.name)}</strong>
                  <span>× ${qty} ${esc(item.unit || 'ชุด')}</span>
                </div>
                <div class="studio-receipt-item__right">
                  <span class="studio-receipt-item__price tnum">+${fmt(line)}</span>
                  <button type="button" class="studio-receipt-item__rm" data-remove-addon="${esc(item.id)}" aria-label="ลบ ${esc(item.name)}" title="นำออก">✕</button>
                </div>
              </li>`
            )
            .join('')
        : `<li class="studio-receipt-empty">ยังไม่ได้เลือกอุปกรณ์เสริมเพิ่มเติม</li>`;

      receiptList.innerHTML = baseRow + addonRows;
    }
  }

  /* ------------------------------ Part 1: Render 1-Row Horizontal Model Bar ------------------------------ */
  function renderModels() {
    const wrap = document.getElementById('modelOptions');
    if (!wrap) return;
    wrap.innerHTML = state.models
      .map((m) => {
        const checked = m.id === state.modelId;
        const catLabel = m.category === 'hot-re' ? 'HOT RE' : 'FULLY HOT';
        const shortName = String(m.name || '').replace(/^MODEL\s+/i, '');
        return `
        <button type="button" class="studio-model-pill glass" role="radio" data-model="${esc(m.id)}" aria-checked="${checked}">
          <div class="studio-model-pill__top">
            <span class="studio-model-pill__dot" aria-hidden="true"></span>
            <strong class="studio-model-pill__name">${esc(shortName)}</strong>
            <span class="studio-model-pill__tag">${catLabel}</span>
          </div>
          <div class="studio-model-pill__bottom">
            <span class="studio-model-pill__cap">${esc(m.capacity)} ${esc(m.capacityUnit || 'T/H')}</span>
            <span class="studio-model-pill__price tnum">${fmtCompactMillion(m.basePrice)}</span>
          </div>
        </button>`;
      })
      .join('');
  }

  /* ------------------------------ Part 2 (Left): Render Single-Row Color Dock Swatches ------------------------------ */
  function renderColors() {
    const wrap = document.getElementById('colorSwatches');
    if (!wrap) return;
    wrap.innerHTML = state.colors
      .map((c) => {
        const checked = c.id === state.colorId;
        const light = isLightHex(c.hex);
        return `
        <button
          type="button"
          class="studio-swatch"
          role="radio"
          data-color="${esc(c.id)}"
          aria-checked="${checked}"
          aria-label="${esc(c.nameTh)} (${esc(c.code)})"
          title="${esc(c.nameTh)} · ${esc(c.code)}"
        >
          <span class="studio-swatch__orb ${c.metallic ? 'is-metallic' : ''} ${light ? 'is-light' : ''}" style="--c:${esc(c.hex)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </span>
        </button>`;
      })
      .join('');
  }

  /* ------------------------------ Part 2 (Right): Render Single-Line Category Filters ------------------------------ */
  function renderCategoryFilters() {
    const bar = document.getElementById('accFilters');
    if (!bar) return;
    const cats = ['ทั้งหมด', ...new Set(state.items.map((i) => i.category).filter(Boolean))];
    bar.innerHTML = cats
      .map((c) => {
        const countInCat =
          c === 'ทั้งหมด'
            ? state.items.filter((i) => state.selected[i.id] > 0).length
            : state.items.filter((i) => i.category === c && state.selected[i.id] > 0).length;
        return `
          <button type="button" class="studio-filter-pill" data-cat="${esc(c)}" aria-pressed="${c === state.category}">
            <span>${esc(c)}</span>
            ${countInCat > 0 ? `<span class="studio-filter-pill__num">${countInCat}</span>` : ''}
          </button>`;
      })
      .join('');
  }

  /* ------------------------------ Part 2 (Right): Render Sleek Compact Checklist Rows ------------------------------ */
  function renderAccessories() {
    const grid = document.getElementById('accGrid');
    if (!grid) return;

    const visible =
      state.category === 'ทั้งหมด' ? state.items : state.items.filter((i) => i.category === state.category);

    if (!visible.length) {
      grid.innerHTML = `<div class="empty-state glass" style="padding:28px 16px;"><p>ไม่มีอุปกรณ์เสริมในหมวดหมู่นี้</p></div>`;
      return;
    }

    grid.innerHTML = visible
      .map((item) => {
        const qty = parseCleanInt(state.selected[item.id] || 0);
        const selected = qty > 0;
        const maxQty = Math.max(1, parseCleanInt(item.maxQty || 1));
        const hasStepper = maxQty > 1;
        const unitPrice = parseCleanInt(item.price);
        const iconSvg = getIconSvg(item.icon);

        return `
        <article
          class="studio-acc-row ${selected ? 'is-selected' : ''}"
          id="acc-${esc(item.id)}"
          data-acc="${esc(item.id)}"
          role="checkbox"
          aria-checked="${selected}"
          tabindex="0"
        >
          <!-- Left: iOS Spring Checkbox + Category Icon -->
          <div class="studio-acc-row__left">
            <span class="acc-check studio-acc-row__check ${selected ? 'is-checked' : ''}" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </span>
            <span class="studio-acc-row__icon" aria-hidden="true">${iconSvg}</span>
          </div>

          <!-- Center: Name + 1-Line Ellipsis Description -->
          <div class="studio-acc-row__mid">
            <div class="studio-acc-row__title-line">
              <h3 class="studio-acc-row__name">${esc(item.name)}</h3>
              <span class="studio-acc-row__cat">${esc(item.category || 'อุปกรณ์เสริม')}</span>
            </div>
            <p class="studio-acc-row__desc" title="${esc(item.description || '')}">${esc(item.description || item.nameEn || '')}</p>
          </div>

          <!-- Right: Price + Compact Stepper when selected & maxQty > 1 -->
          <div class="studio-acc-row__right">
            <span class="studio-acc-row__price tnum">+${fmt(unitPrice)}</span>
            ${
              hasStepper && selected
                ? `<div class="studio-stepper" role="group" aria-label="ปรับจำนวน ${esc(item.name)}">
                    <button type="button" data-step="-1" data-id="${esc(item.id)}" aria-label="ลดจำนวน">−</button>
                    <output class="tnum">${qty}</output>
                    <button type="button" data-step="1" data-id="${esc(item.id)}" aria-label="เพิ่มจำนวน" ${qty >= maxQty ? 'disabled' : ''}>+</button>
                  </div>`
                : `<span class="studio-acc-row__unit">ต่อ 1 ${esc(item.unit || 'ชุด')}${hasStepper ? ` (สูงสุด ${maxQty})` : ''}</span>`
            }
          </div>
        </article>`;
      })
      .join('');
  }

  function setItemQty(id, nextQty) {
    const item = state.items.find((x) => x.id === id);
    if (!item) return;
    const maxQty = Math.max(1, parseCleanInt(item.maxQty || 1));
    const clamped = Math.max(0, Math.min(maxQty, parseCleanInt(nextQty)));
    if (clamped === 0) delete state.selected[id];
    else state.selected[id] = clamped;
    renderCategoryFilters();
    renderAccessories();
    updatePrices(true);
  }

  /* ------------------------------ Event Wiring ------------------------------ */
  document.getElementById('modelOptions')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-model]');
    if (!btn) return;
    state.modelId = btn.dataset.model;
    renderModels();
    updateStageVisual();
    updatePrices(true);
  });

  document.getElementById('colorSwatches')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-color]');
    if (!btn) return;
    state.colorId = btn.dataset.color;
    renderColors();
    updateStageVisual();
    updatePrices(true);
  });

  document.getElementById('accFilters')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    state.category = btn.dataset.cat;
    renderCategoryFilters();
    renderAccessories();
  });

  const accGridEl = document.getElementById('accGrid');
  if (accGridEl) {
    accGridEl.addEventListener('click', (e) => {
      const stepBtn = e.target.closest('[data-step]');
      if (stepBtn) {
        e.stopPropagation();
        const id = stepBtn.dataset.id;
        const delta = Number(stepBtn.dataset.step);
        const current = parseCleanInt(state.selected[id] || 0);
        setItemQty(id, current === 0 && delta > 0 ? 1 : current + delta);
        return;
      }
      if (e.target.closest('.studio-stepper')) {
        e.stopPropagation();
        return;
      }
      const row = e.target.closest('[data-acc]');
      if (row) {
        const id = row.dataset.acc;
        setItemQty(id, state.selected[id] ? 0 : 1);
      }
    });

    accGridEl.addEventListener('keydown', (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      const row = e.target.closest('[data-acc]');
      if (!row || e.target.closest('.studio-stepper')) return;
      e.preventDefault();
      const id = row.dataset.acc;
      setItemQty(id, state.selected[id] ? 0 : 1);
    });
  }

  // Popover Drawer Toggle for Selected Items
  const popoverEl = document.getElementById('studioReceiptPopover');
  const togglePopoverBtn = document.getElementById('toggleReceiptPopoverBtn');
  const closePopoverBtn = document.getElementById('closeReceiptPopoverBtn');

  function setPopoverState(open) {
    state.popoverOpen = Boolean(open);
    if (popoverEl) popoverEl.hidden = !state.popoverOpen;
    if (togglePopoverBtn) togglePopoverBtn.setAttribute('aria-expanded', String(state.popoverOpen));
  }

  togglePopoverBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    setPopoverState(!state.popoverOpen);
  });

  closePopoverBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    setPopoverState(false);
  });

  document.addEventListener('click', (e) => {
    if (!state.popoverOpen) return;
    if (popoverEl && !popoverEl.contains(e.target) && togglePopoverBtn && !togglePopoverBtn.contains(e.target)) {
      setPopoverState(false);
    }
  });

  // Remove individual item from Popover Receipt
  document.getElementById('calcReceiptList')?.addEventListener('click', (e) => {
    const rmBtn = e.target.closest('[data-remove-addon]');
    if (!rmBtn) return;
    e.stopPropagation();
    const id = rmBtn.getAttribute('data-remove-addon');
    setItemQty(id, 0);
  });

  document.getElementById('clearAddonsBtn')?.addEventListener('click', () => {
    if (Object.keys(state.selected).length === 0) return;
    state.selected = {};
    renderCategoryFilters();
    renderAccessories();
    updatePrices(true);
    notifyToast('ล้างรายการอุปกรณ์เสริมทั้งหมดแล้ว');
  });

  document.getElementById('resetConfigBtn')?.addEventListener('click', () => {
    state.modelId = state.models[0]?.id || 'ptx-160';
    state.colorId = state.colors[0]?.id || 'crimson';
    state.selected = {};
    renderModels();
    renderColors();
    renderCategoryFilters();
    renderAccessories();
    updateStageVisual();
    updatePrices(true);
    notifyToast('รีเซ็ตสเปกเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
  });

  /* Hold-to-compare raw neutral base structure */
  const compareBtn = document.getElementById('compareBtn');
  if (compareBtn) {
    const startCompare = () => stage.classList.add('is-comparing');
    const endCompare = () => stage.classList.remove('is-comparing');
    compareBtn.addEventListener('pointerdown', startCompare);
    window.addEventListener('pointerup', endCompare);
    compareBtn.addEventListener('pointerleave', endCompare);
    compareBtn.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key !== 'Enter') startCompare();
    });
    compareBtn.addEventListener('keyup', endCompare);
  }

  /* ------------------------------ Split-View Official Quotation Studio & Live A4 Preview ------------------------------ */
  const quoteModal = document.getElementById('quoteModal');
  const quoteForm = document.getElementById('quoteForm');
  const quoteFormWrap = document.getElementById('quoteFormWrap');
  const quoteSuccessBox = document.getElementById('quoteSuccessBox');
  const qtLiveA4Doc = document.getElementById('qtLiveA4Doc');
  const qtStudioDialog = quoteModal?.querySelector('.qt-studio-dialog');
  const qtFullPreviewBtn = document.getElementById('qtFullPreviewBtn');
  const qtFullPreviewBtnText = document.getElementById('qtFullPreviewBtnText');

  let currentDraftRef = '';
  let currentDraftCreatedISO = '';
  let isFullPreviewOpen = false;

  function setFullPreviewMode(active) {
    isFullPreviewOpen = Boolean(active);
    if (qtStudioDialog) {
      qtStudioDialog.classList.toggle('is-full-preview', isFullPreviewOpen);
    }
    if (qtFullPreviewBtnText) {
      qtFullPreviewBtnText.textContent = isFullPreviewOpen
        ? 'กลับมุมมอง 2 ฝั่ง (Split View)'
        : 'ขยายดูเต็มหน้าจอ (Full A4)';
    }
    if (qtLiveA4Doc && window.ProtexQuotationTemplate?.syncA4PreviewScale) {
      requestAnimationFrame(() => window.ProtexQuotationTemplate.syncA4PreviewScale(qtLiveA4Doc));
    }
  }

  function generateDraftMeta() {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = String(Math.floor(100 + Math.random() * 900));
    currentDraftRef = `QT-${ymd}-${rand}`;
    currentDraftCreatedISO = now.toISOString();
    const badge = document.getElementById('qtDraftRefBadge');
    if (badge) badge.textContent = currentDraftRef;
  }

  function buildCurrentDraftQuotationObject() {
    const { model, color, base, colorExtra, chosen, total } = computeTotals();
    if (!model || !color) return null;

    const subtotal = total;
    const vatAmount = Math.round(subtotal * 0.07 * 100) / 100;
    const grandTotal = Math.round((subtotal + vatAmount) * 100) / 100;

    const cName = quoteForm?.elements?.name?.value?.trim() || '';
    const cPhone = quoteForm?.elements?.phone?.value?.trim() || '';
    const cComp = quoteForm?.elements?.company?.value?.trim() || '';
    const cAttn = quoteForm?.elements?.attn?.value?.trim() || '';
    const cFax = quoteForm?.elements?.fax?.value?.trim() || '';
    const cEmail = quoteForm?.elements?.email?.value?.trim() || '';
    const cNote = quoteForm?.elements?.note?.value?.trim() || '';

    return {
      ref: currentDraftRef || 'QT-DRAFT',
      docType: 'preliminary',
      status: 'pending_review',
      revision: state.siteSettings?.defaultRevision || 'RE.1',
      attn: cAttn || state.siteSettings?.defaultAttn || 'กรรมการผู้จัดการ',
      fax: cFax,
      proposerName: '',
      proposerTitle: '',
      proposerTel: '',
      approverName: '',
      approverTitle: '',
      createdAt: currentDraftCreatedISO || new Date().toISOString(),
      contact: {
        name: cName || 'ระบุชื่อผู้ติดต่อ...',
        phone: cPhone || '-',
        company: cComp,
        fax: cFax,
        email: cEmail || '-',
        note: cNote,
      },
      model: {
        id: model.id,
        name: model.name,
        capacity: model.capacity,
        capacityUnit: model.capacityUnit || 'T/H',
        basePrice: base,
      },
      color: {
        id: color.id,
        name: color.name,
        nameTh: color.nameTh,
        code: color.code,
        hex: color.hex,
        surcharge: colorExtra,
      },
      lines: chosen.map(({ item, qty, unitPrice, line }) => ({
        id: item.id,
        name: item.name,
        subtitle: item.nameEn || item.category || '',
        qty,
        unit: item.unit || 'ชุด',
        unitPrice,
        discount: 0,
        total: line,
      })),
      specialDiscount: 0,
      subtotal,
      vatRate: 7,
      vatAmount,
      grandTotal,
    };
  }

  function renderLiveA4QuotationPreview() {
    if (!qtLiveA4Doc || !window.ProtexQuotationTemplate) return;
    const draftObj = buildCurrentDraftQuotationObject();
    if (!draftObj) return;
    if (typeof window.ProtexQuotationTemplate.mountOfficialQuotationPreview === 'function') {
      window.ProtexQuotationTemplate.mountOfficialQuotationPreview(
        qtLiveA4Doc,
        draftObj,
        state.siteSettings || {}
      );
    } else {
      qtLiveA4Doc.innerHTML = window.ProtexQuotationTemplate.renderOfficialQuotationHTML(
        draftObj,
        state.siteSettings || {}
      );
    }
  }

  function printCurrentQuotationA4() {
    if (!window.ProtexQuotationTemplate) return;
    const draftObj = buildCurrentDraftQuotationObject();
    if (!draftObj) return;
    window.ProtexQuotationTemplate.printOfficialQuotation(draftObj, state.siteSettings || {});
  }

  document.getElementById('qtPrintPreviewBtn')?.addEventListener('click', printCurrentQuotationA4);
  document.getElementById('qtToolbarPrintBtn')?.addEventListener('click', printCurrentQuotationA4);
  document.getElementById('qtSuccessPrintBtn')?.addEventListener('click', printCurrentQuotationA4);
  qtFullPreviewBtn?.addEventListener('click', () => setFullPreviewMode(!isFullPreviewOpen));

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-quote]');
    if (!btn || !quoteModal) return;
    setPopoverState(false);
    setFullPreviewMode(false);
    generateDraftMeta();
    if (quoteFormWrap) quoteFormWrap.hidden = false;
    if (quoteSuccessBox) quoteSuccessBox.hidden = true;
    if (window.PTX && typeof window.PTX.openModal === 'function') {
      window.PTX.openModal(quoteModal, btn);
    } else {
      quoteModal.hidden = false;
      quoteModal.classList.add('is-open');
    }
    renderLiveA4QuotationPreview();
    if (qtLiveA4Doc) {
      qtLiveA4Doc.scrollTop = 0;
      if (window.ProtexQuotationTemplate?.syncA4PreviewScale) {
        requestAnimationFrame(() => window.ProtexQuotationTemplate.syncA4PreviewScale(qtLiveA4Doc));
        setTimeout(() => window.ProtexQuotationTemplate.syncA4PreviewScale(qtLiveA4Doc), 160);
      }
    }
  });

  if (quoteForm) {
    // Real-time live binding from form inputs to A4 preview on the right
    quoteForm.querySelectorAll('input, textarea').forEach((inp) => {
      inp.addEventListener('input', () => {
        renderLiveA4QuotationPreview();
      });
    });

    quoteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      quoteForm.querySelectorAll('[data-qerr]').forEach((el) => (el.textContent = ''));
      quoteForm.querySelectorAll('.has-error').forEach((el) => el.classList.remove('has-error'));

      const contact = {
        name: quoteForm.elements.name.value.trim(),
        phone: quoteForm.elements.phone.value.trim(),
        company: quoteForm.elements.company.value.trim(),
        attn: quoteForm.elements.attn?.value?.trim() || 'กรรมการผู้จัดการ',
        fax: quoteForm.elements.fax?.value?.trim() || '',
        email: quoteForm.elements.email.value.trim(),
        note: quoteForm.elements.note.value.trim(),
      };

      const flag = (f, msg) => {
        const el = quoteForm.querySelector(`[data-qerr="${f}"]`);
        if (el) {
          el.textContent = msg;
          el.closest('.qt-clean-field, .field')?.classList.add('has-error');
        }
      };

      if (contact.name.length < 2) return flag('name', 'กรุณากรอกชื่อผู้ติดต่อ');
      if (!/^[0-9+\-\s]{9,15}$/.test(contact.phone)) return flag('phone', 'กรุณากรอกเบอร์โทร 9–15 หลัก');
      if (!contact.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        return flag('email', 'กรุณากรอกอีเมลสำหรับรับใบเสนอราคา');
      }

      const submitBtn = document.getElementById('quoteSubmitBtn');
      const prevLabel = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>กำลังส่งคำขอให้บริษัทตรวจสอบใบเสนอราคา…</span>';

      const saveLocalFallbackQuotation = (qObj) => {
        try {
          const raw = localStorage.getItem('ptx_cms_override_quotations');
          const parsed = raw ? JSON.parse(raw) : { items: [] };
          const list = Array.isArray(parsed.items) ? parsed.items : [];
          list.unshift(qObj);
          localStorage.setItem('ptx_cms_override_quotations', JSON.stringify({ items: list }));
        } catch (err) {}
      };

      try {
        const res = await fetch('/api/quotations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customRef: currentDraftRef,
            config: { modelId: state.modelId, colorId: state.colorId, items: state.selected },
            contact,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          if (data.errors) Object.entries(data.errors).forEach(([k, v]) => flag(k, v));
          else notifyToast(data.message || 'กรุณาตรวจสอบข้อมูลอีกครั้ง');
          return;
        }
        currentDraftRef = data.ref || currentDraftRef;
        const badge = document.getElementById('qtDraftRefBadge');
        if (badge) badge.textContent = currentDraftRef;
        renderLiveA4QuotationPreview();

        if (data.quotation) saveLocalFallbackQuotation(data.quotation);

        document.getElementById('quoteRefCode').textContent = currentDraftRef;
        const mailMsgEl = document.getElementById('quoteEmailStatusMsg');
        if (mailMsgEl) {
          mailMsgEl.textContent = `ส่งคำขอเรียบร้อยแล้ว อยู่ระหว่างรอทีมงานตรวจสอบและจะส่งใบเสนอราคาฉบับทางการกลับไปยังอีเมล (${contact.email}) ที่ท่านแจ้งไว้ หากต้องการติดต่อด่วน โทร. 085-392-4448 หรือ LINE: protex000`;
        }
        document.getElementById('quoteConfirmTotal').textContent = `ยอดประเมินเบื้องต้นสุทธิ (รวม VAT 7%): ${fmt(data.grandTotal || Math.round(data.total * 1.07))} (THB)`;
        quoteFormWrap.hidden = true;
        quoteSuccessBox.hidden = false;
      } catch (err) {
        const { model, color, base, colorExtra, chosen, total } = computeTotals();
        const subtotal = total;
        const vatAmount = Math.round(subtotal * 0.07);
        const grandTotal = subtotal + vatAmount;
        const fallbackRecord = {
          id: `qt-${Date.now().toString(36)}`,
          ref: currentDraftRef,
          docType: 'preliminary',
          status: 'pending_review',
          proposerName: '',
          proposerTitle: '',
          proposerTel: '',
          approverName: '',
          approverTitle: '',
          createdAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          salesNote: '',
          contact,
          model: { id: model.id, name: model.name, capacity: model.capacity, capacityUnit: model.capacityUnit || 'T/H', basePrice: base },
          color: { id: color.id, name: color.name, nameTh: color.nameTh, code: color.code, hex: color.hex, surcharge: colorExtra },
          lines: chosen.map(({ item, qty, unitPrice, line }) => ({
            id: item.id,
            name: item.name,
            qty,
            unit: item.unit || 'ชุด',
            unitPrice,
            total: line,
          })),
          subtotal,
          vatRate: 7,
          vatAmount,
          grandTotal,
          currency: 'THB',
          emailStatus: 'pending_review',
          emailSender: 'protexgroupa@gmail.com',
          emailRecipients: [contact.email],
          emailStatusNote: 'รอแอดมินตรวจสอบและกดส่งใบเสนอราคาฉบับทางการกลับไปยังอีเมลลูกค้า',
        };
        saveLocalFallbackQuotation(fallbackRecord);
        document.getElementById('quoteRefCode').textContent = currentDraftRef;
        const mailMsgEl = document.getElementById('quoteEmailStatusMsg');
        if (mailMsgEl) {
          mailMsgEl.textContent = `ส่งคำขอเรียบร้อยแล้ว อยู่ระหว่างรอทีมงานตรวจสอบและจะส่งใบเสนอราคาฉบับทางการกลับไปยังอีเมล (${contact.email}) ที่ท่านแจ้งไว้ หากต้องการติดต่อด่วน โทร. 085-392-4448 หรือ LINE: protex000`;
        }
        document.getElementById('quoteConfirmTotal').textContent = `ยอดประเมินเบื้องต้นสุทธิ (รวม VAT 7%): ${fmt(grandTotal)} (THB)`;
        quoteFormWrap.hidden = true;
        quoteSuccessBox.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = prevLabel;
      }
    });
  }

  /* ------------------------------ Multi-Source Data Loader (100% Resilient + Admin Sync) ------------------------------ */
  async function loadCollectionWithFallback(apiPath, jsonPath, storageKey, defaultData) {
    let data = null;
    try {
      const res = await fetch(`${apiPath}?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) data = await res.json();
    } catch (e) {}

    if (!data) {
      try {
        const localRes = await fetch(`${jsonPath}?_t=${Date.now()}`, { cache: 'no-store' });
        if (localRes.ok) data = await localRes.json();
      } catch (e2) {}
    }

    try {
      const overrideRaw = localStorage.getItem(storageKey);
      if (overrideRaw) {
        const parsed = JSON.parse(overrideRaw);
        if (parsed && typeof parsed === 'object') data = parsed;
      }
    } catch (e3) {}

    return data || defaultData;
  }

  async function init() {
    const [plantsData, accData, siteSettingsData] = await Promise.all([
      loadCollectionWithFallback('/api/plants', '../backend/data/plants.json', 'ptx_cms_override_plants', { models: DEFAULT_MODELS }),
      loadCollectionWithFallback('/api/accessories', '../backend/data/accessories.json', 'ptx_cms_override_accessories', DEFAULT_ACC),
      loadCollectionWithFallback('/api/site-settings', '../backend/data/site-settings.json', 'ptx_cms_override_site-settings', {}),
    ]);

    state.siteSettings = siteSettingsData && typeof siteSettingsData === 'object' ? siteSettingsData : {};

    const rawModels = Array.isArray(plantsData) ? plantsData : plantsData?.models;
    state.models = Array.isArray(rawModels) && rawModels.length ? rawModels : DEFAULT_MODELS;

    const rawColors = accData?.structureColors;
    state.colors = Array.isArray(rawColors) && rawColors.length ? rawColors : DEFAULT_ACC.structureColors;

    const rawItems = Array.isArray(accData) ? accData : accData?.items;
    state.items = Array.isArray(rawItems) && rawItems.length ? rawItems : DEFAULT_ACC.items;

    if (accData?.vatNote) {
      const calcVatEl = document.getElementById('calcVatNote');
      if (calcVatEl) calcVatEl.textContent = accData.vatNote;
    }

    if (!state.models.some((m) => m.id === state.modelId)) {
      state.modelId = state.models[0].id;
    }
    if (!state.colors.some((c) => c.id === state.colorId)) {
      state.colorId = state.colors[0].id;
    }

    const params = new URLSearchParams(window.location.search);
    const qModel = params.get('model');
    if (qModel && state.models.some((m) => m.id === qModel)) {
      state.modelId = qModel;
    }

    const initialTotals = computeTotals();
    state.lastTotal = initialTotals.total;

    renderModels();
    renderColors();
    renderCategoryFilters();
    renderAccessories();
    updateStageVisual();
    updatePrices(false);

    if (window.location.hash.startsWith('#acc-')) {
      const target = document.querySelector(window.location.hash);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          target.classList.add('is-flash');
        }, 300);
      }
    }
  }

  init();
})();
