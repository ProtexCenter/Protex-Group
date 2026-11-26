/**
 * ============================================================================
 * PROTEX ADMIN DASHBOARD (FULL CMS) — `admin-dashboard.js`
 * - Complete 8-Module Content Management System in iOS 27 Liquid Glass style
 * - Protected by Admin Security Gateway (`Protex@2026` default, changeable)
 * - Real Drag & Drop Image Upload (`POST /api/admin/upload`) + Instant Live Save
 * ============================================================================
 */
(function () {
  'use strict';

  const ADMIN_SESSION_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds (18,000,000 ms)

  const state = {
    token: sessionStorage.getItem('ptx_admin_token') || '',
    expiresAt: Number(sessionStorage.getItem('ptx_admin_expires_at') || 0),
    sessionTimerId: null,
    hasWarned5Min: false,
    notifications: {
      filter: 'all',
      pollIntervalId: null,
    },
    activeTab: 'overview',
    plantsSubTab: 'fully-hot',
    partsSubTab: 'catalog',
    promosSubTab: 'banners',
    accSubTab: 'items',
    ordersFilter: 'all',
    ordersQuery: '',
    quotesFilter: 'all',
    quotesQuery: '',
    searchQuery: '',
    data: {
      plants: { categories: {}, models: [] },
      spareParts: { catalog: [], partsMarquee: [] },
      reviews: [],
      promotions: { banners: [], campaigns: [], videos: [], partsMarquee: [], social: [] },
      locations: { headquarters: {}, regions: [], serviceCenters: [], installations: [] },
      accessories: { currency: 'THB', vatNote: '', structureColors: [], items: [] },
      popup: { enabled: false, badge: '', title: '', subtitle: '', image: '', ctaText: '', ctaLink: '', secondaryText: '', secondaryLink: '', frequency: 'once_per_session' },
      quotations: { items: [] },
      orders: { items: [] },
      siteSettings: {},
      chatbotKnowledge: { botProfile: {}, quickChips: [], customIntents: [] },
    },
  };

  const THB = new Intl.NumberFormat('th-TH');
  const fmtTHB = (n) => `฿${THB.format(Math.round(Number(n) || 0))}`;

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* -------------------- 5-Hour Session Timer & Auto-Logout -------------------- */
  function formatRemainingTime(ms) {
    const totalSec = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function triggerSessionExpired(customMessage) {
    if (state.sessionTimerId) {
      clearInterval(state.sessionTimerId);
      state.sessionTimerId = null;
    }
    if (state.notifications?.pollIntervalId) {
      clearInterval(state.notifications.pollIntervalId);
      state.notifications.pollIntervalId = null;
    }
    const notifPopover = document.getElementById('admNotificationPopover');
    if (notifPopover) notifPopover.hidden = true;

    state.token = '';
    state.expiresAt = 0;
    state.hasWarned5Min = false;
    try {
      sessionStorage.removeItem('ptx_admin_token');
      sessionStorage.removeItem('ptx_admin_expires_at');
      sessionStorage.removeItem('ptx_admin_auth');
    } catch (e) {}

    // Close any open modals
    const editorModal = document.getElementById('admEditorModal');
    if (editorModal) editorModal.hidden = true;
    const confirmModal = document.getElementById('admConfirmModal');
    if (confirmModal) confirmModal.hidden = true;

    // Hide app shell & show Auth Gate
    const appShell = document.getElementById('admAppShell');
    if (appShell) appShell.hidden = true;
    const authGate = document.getElementById('admAuthGate');
    if (authGate) authGate.hidden = false;

    // Show explicit expiration notice in Auth Gate
    const msg = customMessage || 'ครบกำหนดเวลาใช้งาน 5 ชั่วโมงแล้ว ระบบได้ทำการออกจากระบบอัตโนมัติเพื่อความปลอดภัย กรุณาพิมพ์ adminprotex ที่ช่องค้นหาเพื่อเข้าสู่ระบบใหม่อีกครั้ง';
    const noticeEl = document.getElementById('admSessionExpiredNotice');
    if (noticeEl) {
      const textEl = document.getElementById('admSessionExpiredText');
      if (textEl) textEl.innerHTML = msg.replace('adminprotex', '<strong>adminprotex</strong>');
      noticeEl.style.display = 'flex';
    }
    const gateErr = document.getElementById('admGateError');
    if (gateErr) gateErr.textContent = '';

    showToast(msg, true);
    document.getElementById('admGatePass')?.focus();
  }

  function startSessionWatcher() {
    if (state.sessionTimerId) {
      clearInterval(state.sessionTimerId);
      state.sessionTimerId = null;
    }

    const timerEl = document.getElementById('admSessionTimer');
    const countEl = document.getElementById('admSessionCountdown');

    function tick() {
      const now = Date.now();
      let exp = Number(state.expiresAt || sessionStorage.getItem('ptx_admin_expires_at') || 0);

      // Initialize if active session exists in tab but expiresAt not yet set
      if (!exp && (state.token || sessionStorage.getItem('ptx_admin_auth') === '1')) {
        exp = now + ADMIN_SESSION_MS;
        state.expiresAt = exp;
        try { sessionStorage.setItem('ptx_admin_expires_at', String(exp)); } catch (e) {}
      }

      // ONLY Condition 2: 5 hours fully elapsed
      if (exp > 0 && now >= exp) {
        triggerSessionExpired('ครบกำหนดเวลาใช้งาน 5 ชั่วโมงแล้ว ระบบได้ทำการออกจากระบบอัตโนมัติเพื่อความปลอดภัย กรุณาพิมพ์ adminprotex ที่ช่องค้นหาเพื่อเข้าสู่ระบบใหม่อีกครั้ง');
        return;
      }

      const remaining = Math.max(0, exp - now);
      if (countEl) {
        countEl.textContent = formatRemainingTime(remaining);
      }

      if (timerEl) {
        if (remaining <= 5 * 60 * 1000) {
          timerEl.classList.add('is-critical');
          timerEl.classList.remove('is-warning');
          if (!state.hasWarned5Min) {
            state.hasWarned5Min = true;
            showToast('⚠️ เซสชันผู้ดูแลระบบจะหมดอายุในอีก 5 นาที กรุณาบันทึกข้อมูล', true);
          }
        } else if (remaining <= 15 * 60 * 1000) {
          timerEl.classList.add('is-warning');
          timerEl.classList.remove('is-critical');
        } else {
          timerEl.classList.remove('is-warning', 'is-critical');
        }
      }
    }

    tick();
    state.sessionTimerId = setInterval(tick, 1000);
  }

  /* -------------------- Glass Toast Notification -------------------- */
  function showToast(message, isError = false) {
    const stack = document.getElementById('admToastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = `adm-toast${isError ? ' adm-toast--error' : ''}`;
    el.innerHTML = `<span class="adm-toast__dot"></span><span>${esc(message)}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translate3d(20px,0,0)';
      el.style.transition = 'opacity 0.25s, transform 0.25s';
      setTimeout(() => el.remove(), 260);
    }, 3200);
  }

  /* -------------------- API Helpers -------------------- */
  function authHeaders() {
    const h = { 'Content-Type': 'application/json' };
    if (state.token) h.Authorization = `Bearer ${state.token}`;
    return h;
  }

  async function fetchCollection(name, fallbackKey) {
    try {
      const res = await fetch(`/api/${name}?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) return await res.json();
    } catch (e) {}
    try {
      const localRes = await fetch(`../backend/data/${name}.json?_t=${Date.now()}`, { cache: 'no-store' });
      if (localRes.ok) return await localRes.json();
    } catch (e2) {}
    return state.data[fallbackKey] || {};
  }

  async function saveCollection(name, payload) {
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      payload._updatedAt = Date.now();
    }
    try {
      localStorage.setItem(`ptx_cms_override_${name}`, JSON.stringify(payload));
    } catch (e) {}
    try {
      const res = await fetch(`/api/admin/collection/${name}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) {
        // Only trigger session expired if server explicitly reports SESSION_EXPIRED or wall-clock is past 5 hours
        if (res.status === 401 && (out.code === 'SESSION_EXPIRED' || (state.expiresAt > 0 && Date.now() >= state.expiresAt))) {
          triggerSessionExpired('ครบกำหนดเวลาใช้งาน 5 ชั่วโมงแล้ว ระบบได้ทำการออกจากระบบอัตโนมัติเพื่อความปลอดภัย กรุณาพิมพ์ adminprotex ที่ช่องค้นหาเพื่อเข้าสู่ระบบใหม่อีกครั้ง');
          throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
        }
        throw new Error(out.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }
      showToast(out.message || 'บันทึกข้อมูลสำเร็จ');
      updateSidebarBadges();
      return true;
    } catch (err) {
      showToast(err.message || 'บันทึกข้อมูลเรียบร้อยแล้ว');
      updateSidebarBadges();
      return true;
    }
  }

  async function uploadImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('กรุณาเลือกไฟล์รูปภาพ (.png, .jpg, .webp)'));
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result;
        try {
          const res = await fetch('/api/admin/upload', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ filename: file.name, dataUrl }),
          });
          if (res.status === 401) {
            const errData = await res.json().catch(() => ({}));
            if (errData.code === 'SESSION_EXPIRED' || (state.expiresAt > 0 && Date.now() >= state.expiresAt)) {
              triggerSessionExpired('ครบกำหนดเวลาใช้งาน 5 ชั่วโมงแล้ว ระบบได้ทำการออกจากระบบอัตโนมัติเพื่อความปลอดภัย กรุณาพิมพ์ adminprotex ที่ช่องค้นหาเพื่อเข้าสู่ระบบใหม่อีกครั้ง');
              reject(new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่'));
              return;
            }
            // Offline fallback / local token fallback: keep session alive!
            showToast('โหลดรูปภาพพร้อมใช้งานแล้ว');
            resolve(dataUrl);
            return;
          }
          const out = await res.json();
          if (res.ok && out.ok && out.url) {
            showToast(`อัปโหลดรูปภาพ ${out.filename} สำเร็จ`);
            resolve(out.url);
            return;
          }
          throw new Error(out.message || 'Upload failed');
        } catch (err) {
          // Fallback to DataURL if running without Node write endpoint
          showToast('โหลดรูปภาพพร้อมใช้งานแล้ว');
          resolve(dataUrl);
        }
      };
      reader.onerror = () => reject(new Error('อ่านไฟล์รูปภาพไม่สำเร็จ'));
      reader.readAsDataURL(file);
    });
  }

  /* -------------------- Load All Collections -------------------- */
  async function loadAllData() {
    const [plants, spareParts, reviews, promotions, locations, accessories, popup, quotations, orders, siteSettings, chatbotKnowledge] =
      await Promise.all([
        fetchCollection('plants', 'plants'),
        fetchCollection('spare-parts', 'spareParts'),
        fetchCollection('reviews', 'reviews'),
        fetchCollection('promotions', 'promotions'),
        fetchCollection('locations', 'locations'),
        fetchCollection('accessories', 'accessories'),
        fetchCollection('popup', 'popup'),
        fetchCollection('quotations', 'quotations'),
        fetchCollection('orders', 'orders'),
        fetchCollection('site-settings', 'siteSettings'),
        fetchCollection('chatbot-knowledge', 'chatbotKnowledge'),
      ]);

    state.data.plants = plants && plants.models ? plants : { categories: {}, models: [] };
    state.data.spareParts = spareParts && spareParts.catalog ? spareParts : { catalog: [], partsMarquee: promotions.partsMarquee || [] };
    state.data.reviews = Array.isArray(reviews) ? reviews : [];
    state.data.promotions = promotions && promotions.banners ? promotions : { banners: [], campaigns: [], videos: [], partsMarquee: [], social: [] };
    state.data.locations = locations && locations.installations ? locations : { headquarters: {}, regions: [], serviceCenters: [], installations: [] };
    state.data.accessories = accessories && accessories.items ? accessories : { currency: 'THB', vatNote: '', structureColors: [], items: [] };
    state.data.popup = popup && typeof popup === 'object' ? popup : { enabled: false };

    let quoteItems = Array.isArray(quotations?.items) ? quotations.items : [];
    try {
      const localQ = localStorage.getItem('ptx_cms_override_quotations');
      if (localQ) {
        const parsedQ = JSON.parse(localQ);
        if (Array.isArray(parsedQ?.items)) {
          const existingRefs = new Set(quoteItems.map((q) => q.ref));
          parsedQ.items.forEach((lq) => {
            if (!existingRefs.has(lq.ref)) quoteItems.unshift(lq);
          });
        }
      }
    } catch (e) {}
    state.data.quotations = { items: quoteItems };

    let orderItems = Array.isArray(orders?.items) ? orders.items : [];
    try {
      const localOrd = localStorage.getItem('ptx_cms_override_orders');
      if (localOrd) {
        const parsedOrd = JSON.parse(localOrd);
        if (Array.isArray(parsedOrd?.items)) {
          const existingOrdRefs = new Set(orderItems.map((o) => o.ref));
          parsedOrd.items.forEach((lo) => {
            if (!existingOrdRefs.has(lo.ref)) orderItems.unshift(lo);
          });
        }
      }
    } catch (e) {}
    state.data.orders = { items: orderItems };

    state.data.siteSettings = siteSettings && typeof siteSettings === 'object' ? siteSettings : {};
    state.data.chatbotKnowledge = chatbotKnowledge && typeof chatbotKnowledge === 'object' ? chatbotKnowledge : {};

    updateSidebarBadges();
    renderActiveTab();
  }

  /* -------------------- Backend Real-time Notifications & Polling -------------------- */
  const READ_NOTIF_STORAGE_KEY = 'ptx_read_notification_ids';

  function getReadNotifSet() {
    try {
      const raw = localStorage.getItem(READ_NOTIF_STORAGE_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) {
      return new Set();
    }
  }

  function saveReadNotifSet(set) {
    try {
      localStorage.setItem(READ_NOTIF_STORAGE_KEY, JSON.stringify([...set]));
    } catch (e) {}
  }

  function formatRelativeTime(isoStr) {
    if (!isoStr) return 'เมื่อสักครู่';
    const date = new Date(isoStr);
    if (Number.isNaN(date.getTime())) return String(isoStr).slice(0, 10);
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'เมื่อสักครู่';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} ชม. ที่แล้ว`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'เมื่อวานนี้';
    if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear() + 543}`;
  }

  function buildNotificationsFeed() {
    const feed = [];
    const qList = state.data.quotations?.items || [];
    qList.forEach((q) => {
      const id = `quote-${q.ref || q.id || ''}`;
      const total = Number(q.finalTotal ?? q.total ?? 0);
      const isNewStatus = ['pending_review', 'new'].includes(q.status || 'pending_review') || q.docType === 'preliminary';
      feed.push({
        id,
        type: 'quotation',
        ref: q.ref || q.id || '',
        customerName: q.customerName || q.customer?.name || q.company || 'ลูกค้าสนใจแพล้นท์',
        company: q.company || q.customer?.company || '',
        model: q.plantModel || q.model || 'แพล้นท์คอนกรีต',
        total,
        createdAt: q.createdAt || q.date || '',
        isNewStatus,
        timeAgo: formatRelativeTime(q.createdAt || q.date),
      });
    });

    const ordList = state.data.orders?.items || [];
    ordList.forEach((o) => {
      const id = `order-${o.ref || o.id || ''}`;
      const total = Number(o.total || o.summary?.total || 0);
      const itemCount = (o.items || []).reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
      const isNewStatus = (o.status || 'pending') === 'pending';
      feed.push({
        id,
        type: 'order',
        ref: o.ref || o.id || '',
        customerName: o.customerName || o.customer?.name || 'ลูกค้าสั่งซื้ออะไหล่',
        itemCount,
        total,
        createdAt: o.createdAt || '',
        isNewStatus,
        timeAgo: formatRelativeTime(o.createdAt),
      });
    });

    // Sort newest first
    feed.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });

    return feed;
  }

  function updateNotificationsUI() {
    const feed = buildNotificationsFeed();
    const readSet = getReadNotifSet();

    const unreadItems = feed.filter((item) => !readSet.has(item.id));
    const unreadCount = unreadItems.length;

    // Update bell badges
    const bellBadges = [document.getElementById('admBellBadge'), document.getElementById('admTopBellBadge')];
    const bellBtns = [document.getElementById('admNotificationBellBtn'), document.getElementById('admTopBellBtn')];

    bellBadges.forEach((badge) => {
      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
    });

    bellBtns.forEach((btn) => {
      if (btn) {
        btn.classList.toggle('has-new', unreadCount > 0);
      }
    });

    // Update Popover header unread count
    const unreadTxt = document.getElementById('admNotifUnreadCount');
    if (unreadTxt) {
      unreadTxt.textContent = unreadCount > 0 ? `${unreadCount} รายการใหม่` : 'อ่านครบทั้งหมดแล้ว';
    }

    // Update filter counts
    const quoteCount = feed.filter((n) => n.type === 'quotation').length;
    const orderCount = feed.filter((n) => n.type === 'order').length;
    const elAll = document.getElementById('admNotifFilterAllCount');
    const elQuote = document.getElementById('admNotifFilterQuoteCount');
    const elOrder = document.getElementById('admNotifFilterOrderCount');
    if (elAll) elAll.textContent = String(feed.length);
    if (elQuote) elQuote.textContent = String(quoteCount);
    if (elOrder) elOrder.textContent = String(orderCount);

    // Filter feed according to active filter
    const activeFilter = state.notifications?.filter || 'all';
    let filteredFeed = feed;
    if (activeFilter === 'quotations') {
      filteredFeed = feed.filter((n) => n.type === 'quotation');
    } else if (activeFilter === 'orders') {
      filteredFeed = feed.filter((n) => n.type === 'order');
    }

    // Render list
    const listEl = document.getElementById('admNotifList');
    if (!listEl) return;

    if (filteredFeed.length === 0) {
      listEl.innerHTML = `
        <div class="adm-notif-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <p>ไม่มีการแจ้งเตือนในหมวดหมู่นี้</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filteredFeed
      .map((n) => {
        const isUnread = !readSet.has(n.id);
        if (n.type === 'quotation') {
          return `
            <div class="adm-notif-item ${isUnread ? 'is-unread' : ''}" data-notif-id="${n.id}" data-notif-type="quotation" data-target-ref="${esc(n.ref)}">
              <div class="adm-notif-item__icon adm-notif-item__icon--quote">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
              </div>
              <div class="adm-notif-item__content">
                <div class="adm-notif-item__top">
                  <span class="adm-notif-item__badge adm-notif-item__badge--quote">คำขอใบเสนอราคา</span>
                  <span class="adm-notif-item__time">${esc(n.timeAgo)}</span>
                </div>
                <div class="adm-notif-item__title">${esc(n.customerName || n.company || 'ลูกค้าสนใจแพล้นท์')}</div>
                <div class="adm-notif-item__sub">รุ่น: <strong>${esc(n.model)}</strong> • ยอด: <strong>${fmtTHB(n.total)}</strong></div>
                <div class="adm-notif-item__ref">เลขที่: ${esc(n.ref)}</div>
              </div>
              ${isUnread ? '<span class="adm-notif-item__dot" title="ยังไม่ได้อ่าน"></span>' : ''}
            </div>
          `;
        } else {
          return `
            <div class="adm-notif-item ${isUnread ? 'is-unread' : ''}" data-notif-id="${n.id}" data-notif-type="order" data-target-ref="${esc(n.ref)}">
              <div class="adm-notif-item__icon adm-notif-item__icon--order">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M2.5 3h2.8l2.4 11.4a2 2 0 0 0 2 1.6h9.5a2 2 0 0 0 1.9-1.4L23 6H6.2"/></svg>
              </div>
              <div class="adm-notif-item__content">
                <div class="adm-notif-item__top">
                  <span class="adm-notif-item__badge adm-notif-item__badge--order">คำสั่งซื้ออะไหล่</span>
                  <span class="adm-notif-item__time">${esc(n.timeAgo)}</span>
                </div>
                <div class="adm-notif-item__title">${esc(n.customerName || 'ลูกค้าสั่งซื้ออะไหล่')}</div>
                <div class="adm-notif-item__sub">${n.itemCount ? `${n.itemCount} ชิ้น • ` : ''}ยอดสุทธิ: <strong>${fmtTHB(n.total)}</strong></div>
                <div class="adm-notif-item__ref">เลขที่: ${esc(n.ref)}</div>
              </div>
              ${isUnread ? '<span class="adm-notif-item__dot" title="ยังไม่ได้อ่าน"></span>' : ''}
            </div>
          `;
        }
      })
      .join('');
  }

  function markNotificationRead(id) {
    const readSet = getReadNotifSet();
    readSet.add(id);
    saveReadNotifSet(readSet);
    updateNotificationsUI();
  }

  function markAllNotificationsRead() {
    const feed = buildNotificationsFeed();
    const readSet = getReadNotifSet();
    feed.forEach((n) => readSet.add(n.id));
    saveReadNotifSet(readSet);
    updateNotificationsUI();
    showToast('ทำเครื่องหมายว่าอ่านแล้วทั้งหมดเรียบร้อยแล้ว');
  }

  function toggleNotificationPopover(forceState) {
    const popover = document.getElementById('admNotificationPopover');
    if (!popover) return;
    const isVisible = !popover.hidden;
    const nextState = typeof forceState === 'boolean' ? forceState : !isVisible;

    popover.hidden = !nextState;
    const bellBtns = [document.getElementById('admNotificationBellBtn'), document.getElementById('admTopBellBtn')];
    bellBtns.forEach((btn) => btn?.classList.toggle('is-active', nextState));

    if (nextState) {
      updateNotificationsUI();
    }
  }

  function startLivePolling() {
    if (state.notifications.pollIntervalId) {
      clearInterval(state.notifications.pollIntervalId);
      state.notifications.pollIntervalId = null;
    }

    state.notifications.pollIntervalId = setInterval(async () => {
      if (!state.token && sessionStorage.getItem('ptx_admin_auth') !== '1') return;
      const exp = Number(state.expiresAt || sessionStorage.getItem('ptx_admin_expires_at') || 0);
      if (exp > 0 && Date.now() >= exp) {
        triggerSessionExpired('ครบกำหนดเวลาใช้งาน 5 ชั่วโมงแล้ว ระบบได้ทำการออกจากระบบอัตโนมัติเพื่อความปลอดภัย กรุณาพิมพ์ adminprotex ที่ช่องค้นหาเพื่อเข้าสู่ระบบใหม่อีกครั้ง');
        return;
      }

      try {
        const [qRes, ordRes] = await Promise.all([
          fetchCollection('quotations', 'quotations'),
          fetchCollection('orders', 'orders'),
        ]);

        let hasChange = false;
        if (qRes && Array.isArray(qRes.items)) {
          state.data.quotations = { items: qRes.items };
          hasChange = true;
        }
        if (ordRes && Array.isArray(ordRes.items)) {
          state.data.orders = { items: ordRes.items };
          hasChange = true;
        }

        if (hasChange) {
          updateSidebarBadges();
          updateNotificationsUI();
        }
      } catch (err) {}
    }, 20000); // 20 seconds live polling
  }

  function updateSidebarBadges() {
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(val);
    };
    setTxt('navCountPlants', (state.data.plants.models || []).length);
    setTxt('navCountParts', (state.data.spareParts.catalog || []).length);
    setTxt('navCountPromos', (state.data.promotions.banners || []).length + (state.data.promotions.campaigns || []).length);
    setTxt('navCountInstalls', (state.data.locations.installations || []).length);
    setTxt('navCountAcc', (state.data.accessories.items || []).length);
    setTxt('navCountPopup', state.data.popup.enabled ? 'ON' : 'OFF');

    const ordList = state.data.orders?.items || [];
    const pendingOrdCount = ordList.filter((o) => (o.status || 'pending') === 'pending').length;
    const ordBadge = document.getElementById('navCountOrders');
    if (ordBadge) {
      ordBadge.textContent = pendingOrdCount > 0 ? `NEW ${pendingOrdCount}` : String(ordList.length);
      ordBadge.classList.toggle('adm-nav__count--alert', pendingOrdCount > 0);
    }

    const qList = state.data.quotations?.items || [];
    const newCount = qList.filter((q) => ['pending_review', 'new'].includes(q.status || 'pending_review') || q.docType === 'preliminary').length;
    const qBadge = document.getElementById('navCountQuotes');
    if (qBadge) {
      qBadge.textContent = newCount > 0 ? `NEW ${newCount}` : String(qList.length);
      qBadge.classList.toggle('adm-nav__count--alert', newCount > 0);
    }

    updateNotificationsUI();
  }

  /* -------------------- Glass Confirm Dialog & Editor Modal -------------------- */
  let confirmCallback = null;
  function askConfirm(title, message, onConfirm) {
    const modal = document.getElementById('admConfirmModal');
    document.getElementById('admConfirmTitle').textContent = title || 'ยืนยันการลบรายการ?';
    document.getElementById('admConfirmMessage').textContent = message || 'เมื่อลบแล้วข้อมูลจะถูกนำออกจากหน้าเว็บไซต์ทันที';
    confirmCallback = onConfirm;
    modal.hidden = false;
  }

  let editorSubmitCallback = null;

  const MODAL_THEME_CONFIG = {
    overview: {
      tone: 'crimson',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>`,
    },
    plants: {
      tone: 'crimson',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/><path d="M9 20v-5h6v5"/></svg>`,
    },
    'spare-parts': {
      tone: 'sapphire',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3m-2.9-7.1-2.1 2.1M9 15l-2.1 2.1m0-10.2L9 9m6 6 2.1 2.1"/></svg>`,
    },
    orders: {
      tone: 'crimson',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M2.5 3h2.8l2.4 11.4a2 2 0 0 0 2 1.6h9.5a2 2 0 0 0 1.9-1.4L23 6H6.2"/></svg>`,
    },
    promotions: {
      tone: 'amber',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`,
    },
    installations: {
      tone: 'emerald',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    },
    accessories: {
      tone: 'sapphire',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>`,
    },
    popup: {
      tone: 'violet',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10"/><path d="M7 12h6"/></svg>`,
    },
    quotations: {
      tone: 'crimson',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>`,
    },
    settings: {
      tone: 'emerald',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    },
  };

  function buildSectionHeader(tone, title, subtitle, tag, iconSvg) {
    const defaultIcons = {
      crimson: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/></svg>`,
      amber: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`,
      sapphire: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
      emerald: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>`,
      violet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4"/></svg>`,
    };
    const svg = iconSvg || defaultIcons[tone] || defaultIcons.crimson;
    return `
      <div class="glass-section-header glass-section-header--${esc(tone)}">
        <div class="glass-section-header__left">
          <span class="glass-section-header__icon">${svg}</span>
          <div>
            <h3 class="glass-section-header__title">${esc(title)}</h3>
            ${subtitle ? `<p class="glass-section-header__sub">${esc(subtitle)}</p>` : ''}
          </div>
        </div>
        ${tag ? `<span class="glass-section-header__tag">${esc(tag)}</span>` : ''}
      </div>
    `;
  }

  function enhanceFormFieldLabels(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll('.adm-field label:not(.ios-switch)').forEach((lbl) => {
      if (lbl.dataset.enhanced === '1') return;
      lbl.dataset.enhanced = '1';
      const raw = lbl.textContent || '';
      if (raw.includes('*')) {
        const clean = raw.replace(/\s*\*\s*/g, '').trim();
        lbl.innerHTML = `<span>${esc(clean)}</span><span class="adm-req-badge">จำเป็น *</span>`;
      }
    });
  }

  function openEditorModal(title, bodyHTML, onSubmit, onMount) {
    const modal = document.getElementById('admEditorModal');
    const titleWrap = document.getElementById('admEditorModalTitleWrap');
    const cfg = MODAL_THEME_CONFIG[state.activeTab] || MODAL_THEME_CONFIG.plants;

    // Split action vs item name if ':' exists (e.g. "แก้ไขรุ่นแพล้นท์: MODEL PT-1510RAP")
    const colonIdx = String(title || '').indexOf(':');
    let headingInnerHTML = '';
    if (colonIdx > 0) {
      const actionText = title.slice(0, colonIdx).trim();
      const pillText = title.slice(colonIdx + 1).trim();
      headingInnerHTML = `<span>${esc(actionText)}</span><span class="adm-modal__pill">${esc(pillText)}</span>`;
    } else {
      headingInnerHTML = `<span>${esc(title)}</span>`;
    }

    if (titleWrap) {
      titleWrap.innerHTML = `
        <span class="adm-modal__squircle adm-modal__squircle--${esc(cfg.tone)}">${cfg.icon}</span>
        <h2 id="admEditorModalTitle">${headingInnerHTML}</h2>
      `;
    } else {
      const titleEl = document.getElementById('admEditorModalTitle');
      if (titleEl) titleEl.innerHTML = headingInnerHTML;
    }

    const bodyEl = document.getElementById('admEditorBody');
    bodyEl.innerHTML = bodyHTML;
    enhanceFormFieldLabels(bodyEl);
    editorSubmitCallback = onSubmit;
    modal.hidden = false;
    bindImageDropzones(bodyEl);
    if (typeof onMount === 'function') onMount(bodyEl);
  }

  function closeEditorModal() {
    const modal = document.getElementById('admEditorModal');
    if (modal) {
      modal.hidden = true;
      modal.querySelector('.adm-modal__dialog')?.classList.remove('adm-modal__dialog--wide');
    }
    const saveBtn = document.getElementById('admEditorSaveBtn');
    if (saveBtn) saveBtn.textContent = 'บันทึกข้อมูล';
    editorSubmitCallback = null;
  }

  function bindImageDropzones(container) {
    container.querySelectorAll('[data-img-uploader]').forEach((zone) => {
      const targetInputId = zone.getAttribute('data-img-uploader');
      const urlInput = container.querySelector(`#${targetInputId}`);
      const fileInput = zone.querySelector('input[type="file"]');
      const previewImg = zone.querySelector('.adm-dropzone__preview');

      const updatePreview = (url) => {
        if (urlInput) urlInput.value = url;
        if (previewImg) {
          if (url) {
            previewImg.src = url;
            previewImg.hidden = false;
          } else {
            previewImg.hidden = true;
          }
        }
      };

      zone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') fileInput?.click();
      });

      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('is-dragover');
      });

      zone.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));

      zone.addEventListener('drop', async (e) => {
        e.preventDefault();
        zone.classList.remove('is-dragover');
        const file = e.dataTransfer?.files?.[0];
        if (file) {
          try {
            const url = await uploadImageFile(file);
            updatePreview(url);
          } catch (err) {
            showToast(err.message, true);
          }
        }
      });

      fileInput?.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (file) {
          try {
            const url = await uploadImageFile(file);
            updatePreview(url);
          } catch (err) {
            showToast(err.message, true);
          }
        }
      });

      urlInput?.addEventListener('input', () => {
        if (previewImg) {
          if (urlInput.value.trim()) {
            previewImg.src = urlInput.value.trim();
            previewImg.hidden = false;
          } else {
            previewImg.hidden = true;
          }
        }
      });
    });
  }

  function buildImageUploaderField(fieldId, label, currentUrl = '') {
    return `
      <div class="adm-field adm-field--full adm-field--amber">
        <label for="${fieldId}">${esc(label)}</label>
        <div class="adm-dropzone" data-img-uploader="${fieldId}">
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden>
          <img src="${esc(currentUrl)}" alt="Preview" class="adm-dropzone__preview" ${currentUrl ? '' : 'hidden'}>
          <div style="font-size:0.82rem;font-weight:700;color:#DC2626;">+ คลิกเลือกไฟล์ภาพ หรือลากรูปภาพมาวางที่นี่</div>
          <small>รองรับไฟล์ PNG, JPG, WEBP (บันทึกลงเซิร์ฟเวอร์อัตโนมัติ) หรือวางลิงก์รูปภาพในช่องด้านล่าง</small>
        </div>
        <input type="text" id="${fieldId}" class="adm-input" value="${esc(currentUrl)}" placeholder="assets/images/uploads/... หรือ https://...">
      </div>
    `;
  }

  /* ============================================================================
   * MODULE 1: DASHBOARD OVERVIEW
   * ============================================================================ */
  function renderOverviewModule(container) {
    const plantsCount = (state.data.plants.models || []).length;
    const partsCount = (state.data.spareParts.catalog || []).length;
    const installsCount = (state.data.locations.installations || []).length;
    const promosCount = (state.data.promotions.banners || []).length + (state.data.promotions.campaigns || []).length;
    const accCount = (state.data.accessories.items || []).length;
    const popupOn = Boolean(state.data.popup.enabled);
    const quotesList = state.data.quotations?.items || [];
    const newQuotesCount = quotesList.filter((q) => (q.status || 'new') === 'new').length;
    const ordersList = state.data.orders?.items || [];
    const newOrdersCount = ordersList.filter((o) => (o.status || 'pending') === 'pending').length;

    container.innerHTML = `
      <div class="adm-stats-grid">
        <article class="adm-stat-card adm-glass adm-glass--strong">
          <div class="adm-stat-card__top">
            <span class="adm-stat-card__label">คำสั่งซื้ออะไหล่แท้ (Orders)</span>
            <span class="adm-stat-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1.5"/><circle cx="19" cy="21" r="1.5"/><path d="M2.5 3h2.8l2.4 11.4a2 2 0 0 0 2 1.6h9.5a2 2 0 0 0 1.9-1.4L23 6H6.2"/></svg>
            </span>
          </div>
          <div class="adm-stat-card__num" style="color:${newOrdersCount > 0 ? '#DC2626' : '#0F172A'};">${ordersList.length} ออเดอร์ ${newOrdersCount > 0 ? `<small style="font-size:0.85rem;color:#DC2626;">(รอตรวจ ${newOrdersCount})</small>` : ''}</div>
          <button type="button" class="adm-btn adm-btn--red adm-btn--sm" data-jump-tab="orders">จัดการ / คีย์คำสั่งซื้อ →</button>
        </article>

        <article class="adm-stat-card adm-glass adm-glass--strong">
          <div class="adm-stat-card__top">
            <span class="adm-stat-card__label">รายการขอใบเสนอราคา</span>
            <span class="adm-stat-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
            </span>
          </div>
          <div class="adm-stat-card__num" style="color:${newQuotesCount > 0 ? '#DC2626' : '#0F172A'};">${quotesList.length} ใบ ${newQuotesCount > 0 ? `<small style="font-size:0.85rem;color:#DC2626;">(ใหม่ ${newQuotesCount})</small>` : ''}</div>
          <button type="button" class="adm-btn adm-btn--red adm-btn--sm" data-jump-tab="quotations">เปิดดูใบเสนอราคา →</button>
        </article>

        <article class="adm-stat-card adm-glass adm-glass--strong">
          <div class="adm-stat-card__top">
            <span class="adm-stat-card__label">แพล้นท์ทั้งหมด (หน้าหลัก)</span>
            <span class="adm-stat-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/></svg>
            </span>
          </div>
          <div class="adm-stat-card__num">${plantsCount} รุ่น</div>
          <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-jump-tab="plants">จัดการแพล้นท์ →</button>
        </article>

        <article class="adm-stat-card adm-glass adm-glass--strong">
          <div class="adm-stat-card__top">
            <span class="adm-stat-card__label">สินค้าอะไหล่ &amp; รีวิว</span>
            <span class="adm-stat-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>
            </span>
          </div>
          <div class="adm-stat-card__num">${partsCount} รายการ</div>
          <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-jump-tab="spare-parts">จัดการอะไหล่ →</button>
        </article>

        <article class="adm-stat-card adm-glass adm-glass--strong">
          <div class="adm-stat-card__top">
            <span class="adm-stat-card__label">ผลงานติดตั้งจริงทั่วประเทศ</span>
            <span class="adm-stat-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </span>
          </div>
          <div class="adm-stat-card__num">${installsCount} แห่ง</div>
          <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-jump-tab="installations">จัดการพิกัดผลงาน →</button>
        </article>

        <article class="adm-stat-card adm-glass adm-glass--strong">
          <div class="adm-stat-card__top">
            <span class="adm-stat-card__label">แบนเนอร์ &amp; แคมเปญโปรโมชั่น</span>
            <span class="adm-stat-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 18-5v12L3 14v-3z"/></svg>
            </span>
          </div>
          <div class="adm-stat-card__num">${promosCount} แคมเปญ</div>
          <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-jump-tab="promotions">จัดการโปรโมชั่น →</button>
        </article>

        <article class="adm-stat-card adm-glass adm-glass--strong">
          <div class="adm-stat-card__top">
            <span class="adm-stat-card__label">อุปกรณ์เสริมหน้าออกแบบ 3D</span>
            <span class="adm-stat-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/></svg>
            </span>
          </div>
          <div class="adm-stat-card__num">${accCount} ชิ้น</div>
          <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-jump-tab="accessories">จัดการราคาอุปกรณ์ →</button>
        </article>

        <article class="adm-stat-card adm-glass adm-glass--strong">
          <div class="adm-stat-card__top">
            <span class="adm-stat-card__label">โฆษณา Popup หน้าแรก</span>
            <span class="adm-stat-card__icon" style="background:${popupOn ? 'rgba(16,185,129,0.14)' : 'rgba(100,116,139,0.12)'};color:${popupOn ? '#059669' : '#64748B'};">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10"/></svg>
            </span>
          </div>
          <div class="adm-stat-card__num" style="color:${popupOn ? '#059669' : '#64748B'};">${popupOn ? 'เปิดแสดงผล' : 'ปิดอยู่'}</div>
          <button type="button" class="adm-btn adm-btn--red adm-btn--sm" data-jump-tab="popup">ตั้งค่า Popup โฆษณา →</button>
        </article>
      </div>

      <section class="adm-panel adm-glass adm-glass--strong" style="margin-top:20px;">
        <div class="adm-panel__head">
          <div class="adm-panel__title-group">
            <h2>ทางลัดจัดการข้อมูลด่วน (Quick CMS Actions)</h2>
            <p>คลิกปุ่มด้านล่างเพื่อเพิ่มหรือแก้ไขข้อมูลสำคัญบนหน้าเว็บไซต์ได้ทันทีโดยไม่ต้องแก้โค้ด</p>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;">
          <button type="button" class="adm-btn adm-btn--red" data-jump-tab="orders">🛒 จัดการ / คีย์คำสั่งซื้ออะไหล่</button>
          <button type="button" class="adm-btn adm-btn--red" data-jump-tab="quotations">📄 ดูรายการขอใบเสนอราคาล่าสุด</button>
          <button type="button" class="adm-btn adm-btn--glass" data-jump-tab="plants">+ เพิ่ม / แก้ไขรุ่นแพล้นท์หน้าหลัก</button>
          <button type="button" class="adm-btn adm-btn--glass" data-jump-tab="installations">+ เพิ่มผลงานติดตั้งลูกค้าใหม่</button>
          <button type="button" class="adm-btn adm-btn--glass" data-jump-tab="spare-parts">+ เพิ่มสินค้าอะไหล่แท้</button>
          <button type="button" class="adm-btn adm-btn--glass" data-jump-tab="promotions">+ เพิ่มแบนเนอร์โปรโมชั่น</button>
          <button type="button" class="adm-btn adm-btn--glass" data-jump-tab="popup">เปิด/ปิด โฆษณา Popup หน้าแรก</button>
          <button type="button" class="adm-btn adm-btn--glass" data-jump-tab="settings">ตั้งค่า Gmail SMTP / รหัสผ่านแอดมิน</button>
        </div>
      </section>
    `;

    container.querySelectorAll('[data-jump-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-jump-tab')));
    });
  }

  /* ============================================================================
   * MODULE 2: HOME PLANTS & RECYCLE (`plants.json`)
   * ============================================================================ */
  function renderPlantsModule(container) {
    const models = state.data.plants.models || [];
    const filtered = models.filter((m) => m.category === state.plantsSubTab);

    container.innerHTML = `
      <section class="adm-panel adm-glass adm-glass--strong">
        <div class="adm-panel__head">
          <div class="adm-panel__title-group">
            <h2>จัดการแพล้นท์หน้าหลัก (Section 1: Fully Hot &amp; Section 2: Hot Re)</h2>
            <p>เพิ่ม แก้ไขสเปก อัปโหลดรูปภาพแพล้นท์ แก้ไขขั้นตอน 5 Step Process Timeline หรือจัดลำดับการแสดงผล</p>
          </div>
          <div class="adm-panel__toolbar">
            <div class="adm-subtabs">
              <button type="button" class="adm-subtab ${state.plantsSubTab === 'fully-hot' ? 'is-active' : ''}" data-p-sub="fully-hot">Section 1: FULLY HOT IN PLANT</button>
              <button type="button" class="adm-subtab ${state.plantsSubTab === 'hot-re' ? 'is-active' : ''}" data-p-sub="hot-re">Section 2: HOT RE IN PLANT (รีไซเคิล)</button>
            </div>
            <button type="button" class="adm-btn adm-btn--red" id="admAddPlantBtn">+ เพิ่มรุ่นแพล้นท์ใหม่</button>
          </div>
        </div>

        <div class="adm-cards-grid">
          ${filtered
            .map(
              (m, idx) => `
            <article class="adm-item-card">
              <div class="adm-item-card__media">
                ${m.image ? `<img src="${esc(m.image)}" alt="${esc(m.name)}">` : ''}
                <span class="adm-item-card__badge">${esc(m.capacity)} ${esc(m.capacityUnit || 'T/H')}</span>
              </div>
              <div class="adm-item-card__body">
                <span class="adm-item-card__meta">${esc(m.series || m.category)} · เริ่มต้น ${fmtTHB(m.basePrice)}</span>
                <h3 class="adm-item-card__title">${esc(m.name)}</h3>
                <p class="adm-item-card__desc">${esc(m.description)}</p>
                <small style="color:#64748B;">สเปก ${(m.specs || []).length} ช่อง ${m.category === 'fully-hot' ? `· Process ${(m.process || []).length} ขั้นตอน` : ''}</small>
              </div>
              <div class="adm-item-card__foot">
                <div style="display:flex;gap:6px;">
                  <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-plant-move="${esc(m.id)}" data-dir="-1" ${idx === 0 ? 'disabled' : ''} title="เลื่อนขึ้น">↑</button>
                  <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-plant-move="${esc(m.id)}" data-dir="1" ${idx === filtered.length - 1 ? 'disabled' : ''} title="เลื่อนลง">↓</button>
                </div>
                <div style="display:flex;gap:6px;">
                  <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-plant-edit="${esc(m.id)}">แก้ไขสเปก / รูป</button>
                  <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-plant-del="${esc(m.id)}">ลบ</button>
                </div>
              </div>
            </article>`
            )
            .join('')}
        </div>
      </section>
    `;

    container.querySelectorAll('[data-p-sub]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.plantsSubTab = btn.getAttribute('data-p-sub');
        renderPlantsModule(container);
      });
    });

    container.querySelector('#admAddPlantBtn')?.addEventListener('click', () => openPlantEditor(null));

    container.querySelectorAll('[data-plant-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const found = (state.data.plants.models || []).find((x) => x.id === btn.getAttribute('data-plant-edit'));
        if (found) openPlantEditor(found);
      });
    });

    container.querySelectorAll('[data-plant-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-plant-del');
        const found = (state.data.plants.models || []).find((x) => x.id === id);
        if (!found) return;
        askConfirm(`ลบรุ่นแพล้นท์ "${found.name}"?`, 'ข้อมูลรุ่นนี้จะถูกลบออกจากหน้าหลักและหน้าออกแบบแพล้นท์ทันที', async () => {
          state.data.plants.models = state.data.plants.models.filter((x) => x.id !== id);
          await saveCollection('plants', state.data.plants);
          renderPlantsModule(container);
        });
      });
    });

    container.querySelectorAll('[data-plant-move]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-plant-move');
        const dir = Number(btn.getAttribute('data-dir'));
        const list = state.data.plants.models;
        const catIndices = list
          .map((item, i) => (item.category === state.plantsSubTab ? i : -1))
          .filter((i) => i !== -1);
        const posInCat = catIndices.findIndex((i) => list[i].id === id);
        const swapPos = posInCat + dir;
        if (posInCat < 0 || swapPos < 0 || swapPos >= catIndices.length) return;
        const idxA = catIndices[posInCat];
        const idxB = catIndices[swapPos];
        const temp = list[idxA];
        list[idxA] = list[idxB];
        list[idxB] = temp;
        await saveCollection('plants', state.data.plants);
        renderPlantsModule(container);
      });
    });
  }

  function openPlantEditor(existing) {
    const isNew = !existing;
    const item = existing
      ? JSON.parse(JSON.stringify(existing))
      : {
          id: `ptx-${Date.now().toString(36)}`,
          category: state.plantsSubTab,
          series: state.plantsSubTab === 'hot-re' ? 'RAP RECYCLE SERIES' : 'INDUSTRIAL BATCH MIX SERIES',
          badge: 'NEW MODEL',
          name: 'MODEL PT-NEW',
          capacity: '150-180',
          capacityUnit: state.plantsSubTab === 'hot-re' ? 't/h' : 'T/H',
          basePrice: 42000000,
          tagline: 'RAP 10-80% · High Efficiency',
          description: 'แพล้นท์ผสมยางมะตอยประสิทธิภาพสูง ควบคุมความแม่นยำด้วยระบบ PLC & SCADA',
          image: 'assets/images/image_plant1.jpg',
          specs:
            state.plantsSubTab === 'hot-re'
              ? [
                  { icon: 'capacity', label: 'Recycle Asphalt Output', value: '50-60 t/h' },
                  { icon: 'fuel', label: 'Fuel Type', value: 'Diesel / Heavy oil' },
                  { icon: 'power', label: 'Total Power', value: '185 kW' },
                  { icon: 'hopper', label: 'Cold Aggregates', value: '8 m³' },
                  { icon: 'drum', label: 'Drying Drum', value: 'Φ1.5x8.0 m.' },
                  { icon: 'burner', label: 'Burner RAP', value: 'A-TECH South Korea' },
                  { icon: 'silo', label: 'Storage Silo', value: '6 m³' },
                ]
              : [
                  { icon: 'capacity', label: 'Total Capacity', value: '150-180 T/H' },
                  { icon: 'virgin', label: 'Capacity of Virgin (Maximum)', value: '130-150 T/H' },
                  { icon: 'rap', label: 'Capacity of RAP', value: '60-70 T/H' },
                  { icon: 'mixer', label: 'Capacity of Mixer', value: '2000 kg' },
                  { icon: 'ratio', label: 'RAP Ratio', value: '10-80%' },
                  { icon: 'power', label: 'Total power', value: '550 kW' },
                ],
          process: [
            { step: 'Cold Feed', th: 'ป้อนหินเย็น 4–6 ช่อง ชั่งตวงสายพานต่อเนื่อง' },
            { step: 'Dryer Drum', th: 'อบแห้งที่ 160–180 °C เตาเผา High-Efficiency' },
            { step: 'Screening', th: 'คัดขนาด 4–5 ชั้น ตะแกรงสั่นสะเทือนแบบเฉียง' },
            { step: 'Weigh & Mix', th: 'ชั่งตวงแยกอิสระ ผสม Twin-shaft แม่นยำสูง' },
            { step: 'Hot Storage', th: 'ไซโลเก็บร้อนพร้อมฉนวนกันความร้อน' },
          ],
          configurator: {
            base: state.plantsSubTab === 'hot-re' ? 'assets/images/configurator/hot-re-base.svg' : 'assets/images/configurator/fully-hot-base.svg',
            mask: state.plantsSubTab === 'hot-re' ? 'assets/images/configurator/hot-re-mask.svg' : 'assets/images/configurator/fully-hot-mask.svg',
          },
        };

    const specsRowsHTML = (item.specs || [])
      .map(
        (s, i) => `
        <div class="adm-step-row" data-spec-row="${i}">
          <span class="adm-step-num">${String(i + 1).padStart(2, '0')}</span>
          <input type="text" class="adm-input" data-spec-label value="${esc(s.label)}" placeholder="หัวข้อสเปก (เช่น Total Capacity)">
          <input type="text" class="adm-input" data-spec-val value="${esc(s.value)}" placeholder="ค่าสเปก (เช่น 180-200 T/H)">
        </div>`
      )
      .join('');

    const processRowsHTML = (item.process || [])
      .map(
        (p, i) => `
        <div class="adm-step-row adm-step-row--proc" data-proc-row="${i}">
          <span class="adm-step-num adm-step-num--emerald">0${i + 1}</span>
          <input type="text" class="adm-input" data-proc-step value="${esc(p.step)}" placeholder="Step ${i + 1}">
          <input type="text" class="adm-input" data-proc-th value="${esc(p.th)}" placeholder="คำอธิบายขั้นตอนภาษาไทย">
        </div>`
      )
      .join('');

    const html = `
      <div class="adm-form-grid">
        ${buildSectionHeader('crimson', 'ข้อมูลพื้นฐานรุ่นแพล้นท์ (Core Plant Identity)', 'กำหนดชื่อรุ่น ซีรีส์ กำลังการผลิต และราคาเริ่มต้นสำหรับใบเสนอราคา', 'CORE INFO')}
        <div class="adm-field">
          <label for="fPlantName">ชื่อรุ่นแพล้นท์ *</label>
          <input type="text" id="fPlantName" class="adm-input" value="${esc(item.name)}" required>
        </div>
        <div class="adm-field">
          <label for="fPlantSeries">ชื่อซีรีส์ (Series Header)</label>
          <input type="text" id="fPlantSeries" class="adm-input" value="${esc(item.series)}">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fPlantCap">ตัวเลขกำลังการผลิต (เช่น 180-200)</label>
          <input type="text" id="fPlantCap" class="adm-input" value="${esc(item.capacity)}">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fPlantUnit">หน่วยกำลังการผลิต (T/H หรือ t/h)</label>
          <input type="text" id="fPlantUnit" class="adm-input" value="${esc(item.capacityUnit || 'T/H')}">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fPlantPrice">ราคาเริ่มต้นสำหรับคำนวณใบเสนอราคา (บาท)</label>
          <input type="number" id="fPlantPrice" class="adm-input" value="${Number(item.basePrice || 0)}">
        </div>
        <div class="adm-field">
          <label for="fPlantTagline">ข้อความไฮไลต์สั้น (Tagline)</label>
          <input type="text" id="fPlantTagline" class="adm-input" value="${esc(item.tagline)}">
        </div>
        <div class="adm-field adm-field--full">
          <label for="fPlantDesc">คำอธิบายรุ่นแพล้นท์</label>
          <textarea id="fPlantDesc" class="adm-textarea">${esc(item.description)}</textarea>
        </div>

        ${buildSectionHeader('amber', 'รูปภาพแพล้นท์ & สื่อแสดงผล (Plant Media)', 'อัปโหลดภาพถ่ายแพล้นท์ความละเอียดสูงหรือระบุลิงก์รูปภาพ', 'MEDIA ASSET')}
        ${buildImageUploaderField('fPlantImg', 'รูปภาพแพล้นท์ (ลากวางไฟล์ภาพหรือใส่ URL)', item.image)}

        ${buildSectionHeader('sapphire', 'ตารางข้อมูลสเปกทางวิศวกรรม (Engineering Specs Grid)', 'แสดงในตารางสเปกบนการ์ดหน้าหลักและหน้าเปรียบเทียบรุ่น', `${(item.specs || []).length} SPECS`)}
        <div class="adm-field adm-field--full adm-field--sapphire">
          <div id="fPlantSpecsList" style="display:grid;gap:8px;">${specsRowsHTML}</div>
        </div>
        ${
          item.category === 'fully-hot'
            ? `
              ${buildSectionHeader('emerald', 'ขั้นตอนการทำงาน 5 ขั้นตอน (5-Step Process Timeline)', 'แสดงในไทม์ไลน์การทำงานด้านล่างของสไลด์ Section 1', '5 STEPS')}
              <div class="adm-field adm-field--full adm-field--emerald">
                <div id="fPlantProcList" style="display:grid;gap:8px;">${processRowsHTML}</div>
              </div>`
            : ''
        }
      </div>
    `;

    openEditorModal(isNew ? 'เพิ่มรุ่นแพล้นท์ใหม่' : `แก้ไขรุ่นแพล้นท์: ${item.name}`, html, async (bodyEl) => {
      item.name = bodyEl.querySelector('#fPlantName').value.trim() || item.name;
      item.badge = item.name.replace(/^MODEL\s+/i, '');
      item.series = bodyEl.querySelector('#fPlantSeries').value.trim();
      item.capacity = bodyEl.querySelector('#fPlantCap').value.trim();
      item.capacityUnit = bodyEl.querySelector('#fPlantUnit').value.trim() || 'T/H';
      item.basePrice = Number(bodyEl.querySelector('#fPlantPrice').value) || 0;
      item.tagline = bodyEl.querySelector('#fPlantTagline').value.trim();
      item.description = bodyEl.querySelector('#fPlantDesc').value.trim();
      item.image = bodyEl.querySelector('#fPlantImg').value.trim() || item.image;
      item.imageAlt = item.name;

      const specRows = bodyEl.querySelectorAll('[data-spec-row]');
      item.specs = Array.from(specRows).map((r, i) => ({
        icon: item.specs?.[i]?.icon || 'capacity',
        label: r.querySelector('[data-spec-label]').value.trim(),
        value: r.querySelector('[data-spec-val]').value.trim(),
      })).filter((s) => s.label || s.value);

      const procRows = bodyEl.querySelectorAll('[data-proc-row]');
      if (procRows.length) {
        item.process = Array.from(procRows).map((r) => ({
          step: r.querySelector('[data-proc-step]').value.trim(),
          th: r.querySelector('[data-proc-th]').value.trim(),
        }));
      }

      if (isNew) {
        state.data.plants.models.push(item);
      } else {
        const idx = state.data.plants.models.findIndex((x) => x.id === item.id);
        if (idx !== -1) state.data.plants.models[idx] = item;
      }

      await saveCollection('plants', state.data.plants);
      closeEditorModal();
      renderActiveTab();
    });
  }

  /* ============================================================================
   * MODULE 3: SPARE PARTS (ORDERABLE CATALOG), ORDERS, MARQUEE & CUSTOMER REVIEWS
   * ============================================================================ */
  function renderSparePartsModule(container) {
    const sub = state.partsSubTab;
    const catalog = state.data.spareParts.catalog || [];
    const orders = state.data.orders?.items || [];
    const marquee = state.data.spareParts.partsMarquee || [];
    const reviews = state.data.reviews || [];

    const orderableCount = catalog.filter((i) => i.orderable !== false && i.inStock !== false && Number(i.price) > 0).length;
    const pendingOrdersCount = orders.filter((o) => (o.status || 'pending') === 'pending').length;

    let listHTML = '';
    if (sub === 'catalog') {
      listHTML = catalog
        .map((item) => {
          const isReady = item.orderable !== false && item.inStock !== false && Number(item.price) > 0;
          return `
          <article class="adm-item-card">
            ${
              item.image
                ? `<div class="adm-item-card__media" style="aspect-ratio:4/3;height:180px;"><img src="${esc(item.image)}" alt="${esc(item.name)}" style="width:100%;height:100%;object-fit:cover;"></div>`
                : `<div class="adm-item-card__media" style="aspect-ratio:4/3;height:140px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,rgba(255,255,255,0.6),rgba(241,245,249,0.5));border-radius:14px;">
                    <span style="font-size:0.78rem;font-weight:800;color:#DC2626;padding:6px 12px;border-radius:999px;background:rgba(254,226,226,0.65);border:1px solid rgba(220,38,38,0.25);">PROTEX OEM · ${esc(item.sku || item.category)}</span>
                  </div>`
            }
            <div class="adm-item-card__body">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
                <span class="adm-item-card__meta">${esc(item.category)} ${item.sku ? `· SKU: ${esc(item.sku)}` : ''}</span>
                <span style="padding:2px 9px;border-radius:999px;font-size:0.7rem;font-weight:800;${
                  isReady
                    ? 'background:rgba(16,185,129,0.14);color:#065F46;border:1px solid rgba(16,185,129,0.3);'
                    : 'background:rgba(100,116,139,0.14);color:#475569;border:1px solid rgba(100,116,139,0.25);'
                }">${isReady ? '🟢 พร้อมสั่งซื้อบนเว็บ' : '⚪ ปิดการสั่งซื้อชั่วคราว'}</span>
              </div>
              <h3 class="adm-item-card__title">${esc(item.name)}</h3>
              <p class="adm-item-card__desc">${esc(item.spec)}</p>
              <div style="display:flex;align-items:baseline;gap:8px;margin-top:4px;">
                <strong style="font-size:1.05rem;color:#DC2626;font-variant-numeric:tabular-nums;">${fmtTHB(item.price)} / ${esc(item.unit || 'ชิ้น')}</strong>
                ${Number(item.originalPrice) > Number(item.price) ? `<del style="font-size:0.78rem;color:#94A3B8;">${fmtTHB(item.originalPrice)}</del>` : ''}
                ${item.discount ? `<span style="font-size:0.72rem;font-weight:800;color:#B91C1C;background:rgba(220,38,38,0.1);padding:1px 7px;border-radius:999px;">${esc(item.discount)}</span>` : ''}
              </div>
            </div>
            <div class="adm-item-card__foot" style="display:flex;flex-wrap:wrap;gap:6px;">
              <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-sp-toggle="${esc(item.id)}">${isReady ? 'ปิดการขายชั่วคราว' : 'เปิดให้สั่งซื้อ'}</button>
              <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-sp-edit="${esc(item.id)}">แก้ไข</button>
              <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-sp-del="${esc(item.id)}">ลบ</button>
            </div>
          </article>`;
        })
        .join('');
    } else if (sub === 'orders') {
      const ORD_STATUS_MAP = {
        pending: { label: 'รอดำเนินการจัดส่ง', cls: 'adm-qt-status--new' },
        shipping: { label: 'กำลังจัดส่งอะไหล่', cls: 'adm-qt-status--contacted' },
        completed: { label: 'จัดส่งสำเร็จแล้ว', cls: 'adm-qt-status--closed' },
        cancelled: { label: 'ยกเลิกคำสั่งซื้อ', cls: 'adm-qt-status--cancelled' },
      };

      listHTML = orders.length
        ? orders
            .map((ord) => {
              const st = ORD_STATUS_MAP[ord.status || 'pending'] || ORD_STATUS_MAP.pending;
              const emailSent = ord.emailStatus === 'sent';
              const linesRows = (ord.lines || [])
                .map(
                  (l) => `
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:0.8rem;padding:4px 0;border-bottom:1px dashed rgba(15,23,42,0.08);">
                    <span><strong>${esc(l.name)}</strong> ${l.sku ? `<small style="color:#64748B;">(${esc(l.sku)})</small>` : ''} × ${l.qty} ${esc(l.unit || 'ชิ้น')}</span>
                    <strong style="font-variant-numeric:tabular-nums;">${fmtTHB(l.total)}</strong>
                  </div>`
                )
                .join('');

              return `
              <article class="adm-quote-card adm-glass" style="grid-column: 1 / -1;">
                <div class="adm-quote-card__top">
                  <div class="adm-quote-card__id-group">
                    <span class="adm-quote-card__ref">${esc(ord.ref)}</span>
                    <span class="adm-qt-status ${st.cls}">${st.label}</span>
                    <span class="adm-qt-mail-badge ${emailSent ? 'is-sent' : 'is-pending'}">
                      ${emailSent ? '📧 ส่งแจ้งเตือนผ่าน protexgroupa@gmail.com สำเร็จ' : '📧 บันทึกในระบบแล้ว (พร้อมส่งผ่าน protexgroupa@gmail.com)'}
                    </span>
                  </div>
                  <div class="adm-quote-card__date">สั่งซื้อเมื่อ: ${esc((ord.createdAt || '').replace('T', ' ').slice(0, 16))}</div>
                </div>

                <div class="adm-quote-card__grid">
                  <div class="adm-quote-card__client">
                    <div class="adm-quote-card__sec-label">ข้อมูลผู้สั่งซื้อ &amp; ที่อยู่จัดส่งด่วน (24–48 ชม.)</div>
                    <h3 class="adm-quote-card__name">${esc(ord.customer?.name || '-')}</h3>
                    <div class="adm-quote-card__meta-list">
                      <div><strong>บริษัท/หน่วยงาน:</strong> ${esc(ord.customer?.company || '-')}</div>
                      <div><strong>เบอร์โทรศัพท์:</strong> <a href="tel:${esc(ord.customer?.phone || '')}" class="adm-quote-link">${esc(ord.customer?.phone || '-')}</a></div>
                      <div><strong>อีเมลผู้รับ:</strong> <span class="adm-quote-email">${esc(ord.customer?.email || '-')}</span></div>
                      <div><strong>สถานที่จัดส่ง:</strong> ${esc(ord.customer?.address || '-')}</div>
                    </div>
                  </div>

                  <div class="adm-quote-card__spec">
                    <div class="adm-quote-card__sec-label">รายการอะไหล่ที่สั่งซื้อ (${ord.totalQty || (ord.lines || []).length} ชิ้น)</div>
                    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:8px;">
                      ${linesRows}
                    </div>
                    <div class="adm-quote-card__totals">
                      <div><span>ก่อน VAT:</span> <strong>${fmtTHB(ord.subtotal)}</strong></div>
                      <div><span>VAT 7%:</span> <strong>${fmtTHB(ord.vatAmount)}</strong></div>
                      <div class="is-grand"><span>ยอดสุทธิรวม VAT:</span> <strong>${fmtTHB(ord.grandTotal)}</strong></div>
                    </div>
                  </div>
                </div>

                <div class="adm-quote-card__actions">
                  <div class="adm-quote-card__status-ctrl">
                    <label>สถานะจัดส่ง:</label>
                    <select class="adm-select adm-select--sm" data-ord-status="${esc(ord.id || ord.ref)}">
                      <option value="pending" ${(ord.status || 'pending') === 'pending' ? 'selected' : ''}>🔴 รอดำเนินการจัดส่ง</option>
                      <option value="shipping" ${ord.status === 'shipping' ? 'selected' : ''}>🟡 กำลังจัดส่งอะไหล่</option>
                      <option value="completed" ${ord.status === 'completed' ? 'selected' : ''}>🟢 จัดส่งสำเร็จแล้ว</option>
                      <option value="cancelled" ${ord.status === 'cancelled' ? 'selected' : ''}>⚪ ยกเลิกคำสั่งซื้อ</option>
                    </select>
                  </div>
                  <div class="adm-quote-card__btns">
                    <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-ord-resend="${esc(ord.id || ord.ref)}">📧 ส่งอีเมลซ้ำ (protexgroupa@gmail.com)</button>
                    <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-ord-del="${esc(ord.id || ord.ref)}">ลบ</button>
                  </div>
                </div>
              </article>`;
            })
            .join('')
        : `<div class="adm-empty-state adm-glass" style="grid-column:1/-1;padding:32px;text-align:center;"><p>ยังไม่มีรายการคำสั่งซื้ออะไหล่เข้ามา</p></div>`;
    } else if (sub === 'marquee') {
      listHTML = marquee
        .map(
          (m) => `
          <article class="adm-item-card">
            ${m.image ? `<div class="adm-item-card__media"><img src="${esc(m.image)}" alt="${esc(m.title)}"></div>` : ''}
            <div class="adm-item-card__body">
              <span class="adm-item-card__meta">ส่วนลด: ${esc(m.discount)} · โทนสี: ${esc(m.tone || 'crimson')}</span>
              <h3 class="adm-item-card__title">${esc(m.title)}</h3>
              <p class="adm-item-card__desc">${esc(m.detail)}</p>
            </div>
            <div class="adm-item-card__foot">
              <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-mq-edit="${esc(m.id)}">แก้ไข</button>
              <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-mq-del="${esc(m.id)}">ลบ</button>
            </div>
          </article>`
        )
        .join('');
    } else {
      listHTML = reviews
        .map(
          (r) => `
          <article class="adm-item-card">
            <div class="adm-item-card__body">
              <span class="adm-item-card__meta">★ ${esc(r.rating)} / 5.0 · ${esc(r.project)}</span>
              <h3 class="adm-item-card__title">${esc(r.name)} (${esc(r.company)})</h3>
              <p class="adm-item-card__desc">“${esc(r.text)}”</p>
            </div>
            <div class="adm-item-card__foot">
              <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-rev-edit="${esc(r.id)}">แก้ไข</button>
              <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-rev-del="${esc(r.id)}">ลบ</button>
            </div>
          </article>`
        )
        .join('');
    }

    container.innerHTML = `
      <section class="adm-panel adm-glass adm-glass--strong">
        <div class="adm-panel__head">
          <div class="adm-panel__title-group">
            <h2>จัดการสินค้าอะไหล่พร้อมสั่งซื้อ และรีวิวลูกค้า</h2>
            <p>เฉพาะสินค้าที่เปิดสถานะ “พร้อมสั่งซื้อ” และมีราคาจำหน่าย &gt; 0 บาท เท่านั้นที่จะแสดงในตารางสั่งซื้อบนหน้า spare-parts.html (ปัจจุบันพร้อมขาย ${orderableCount} รายการ)</p>
          </div>
          <div class="adm-panel__toolbar">
            <div class="adm-subtabs">
              <button type="button" class="adm-subtab ${sub === 'catalog' ? 'is-active' : ''}" data-sp-sub="catalog">สินค้าอะไหล่พร้อมขาย (${catalog.length})</button>
              <button type="button" class="adm-subtab ${sub === 'reviews' ? 'is-active' : ''}" data-sp-sub="reviews">รีวิวลูกค้า (${reviews.length})</button>
              <button type="button" class="adm-subtab" data-sp-jump-orders="1">
                🛒 จัดการคำสั่งซื้ออะไหล่ (${orders.length})
                ${pendingOrdersCount > 0 ? `<span style="margin-left:4px;padding:1px 6px;border-radius:999px;background:#DC2626;color:#FFF;font-size:0.68rem;font-weight:800;">NEW ${pendingOrdersCount}</span>` : ''}
              </button>
            </div>
            <button type="button" class="adm-btn adm-btn--red" id="admAddPartsItemBtn">+ เพิ่มรายการใหม่</button>
          </div>
        </div>
        <div class="adm-cards-grid">${listHTML}</div>
      </section>
    `;

    container.querySelector('[data-sp-jump-orders]')?.addEventListener('click', () => {
      switchTab('orders');
    });

    container.querySelectorAll('[data-sp-sub]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.partsSubTab = btn.getAttribute('data-sp-sub');
        renderSparePartsModule(container);
      });
    });

    container.querySelector('#admAddPartsItemBtn')?.addEventListener('click', () => {
      if (sub === 'catalog') openSparePartCatalogEditor(null);
      else if (sub === 'marquee') openMarqueeItemEditor(null);
      else if (sub === 'reviews') openReviewEditor(null);
    });

    container.querySelectorAll('[data-sp-toggle]').forEach((b) =>
      b.addEventListener('click', async () => {
        const item = catalog.find((x) => x.id === b.getAttribute('data-sp-toggle'));
        if (!item) return;
        const currentlyReady = item.orderable !== false && item.inStock !== false;
        item.orderable = !currentlyReady;
        item.inStock = !currentlyReady;
        await saveCollection('spare-parts', state.data.spareParts);
        renderSparePartsModule(container);
      })
    );

    container.querySelectorAll('[data-sp-edit]').forEach((b) =>
      b.addEventListener('click', () => {
        const item = catalog.find((x) => x.id === b.getAttribute('data-sp-edit'));
        if (item) openSparePartCatalogEditor(item);
      })
    );
    container.querySelectorAll('[data-sp-del]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-sp-del');
        askConfirm('ลบสินค้าอะไหล่นี้?', 'รายการอะไหล่จะถูกนำออกจากหน้าเว็บทันที', async () => {
          state.data.spareParts.catalog = catalog.filter((x) => x.id !== id);
          await saveCollection('spare-parts', state.data.spareParts);
          renderSparePartsModule(container);
        });
      })
    );

    // Orders management bindings
    container.querySelectorAll('[data-ord-status]').forEach((sel) =>
      sel.addEventListener('change', async () => {
        const id = sel.getAttribute('data-ord-status');
        const nextStatus = sel.value;
        const found = orders.find((x) => (x.id || x.ref) === id);
        if (found) found.status = nextStatus;
        try {
          await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify({ status: nextStatus }),
          });
        } catch (e) {}
        try {
          localStorage.setItem('ptx_cms_override_orders', JSON.stringify({ items: orders }));
        } catch (e) {}
        showToast('อัปเดตสถานะการจัดส่งอะไหล่เรียบร้อยแล้ว');
        renderSparePartsModule(container);
      })
    );

    container.querySelectorAll('[data-ord-resend]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-ord-resend');
        const found = orders.find((x) => (x.id || x.ref) === id);
        if (!found) return;
        const prev = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'กำลังส่ง...';
        try {
          const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}/resend-email`, {
            method: 'POST',
            headers: authHeaders(),
          });
          const out = await res.json();
          if (out.item) Object.assign(found, out.item);
          showToast(out.message || 'ส่งอีเมลคำสั่งซื้อซ้ำเรียบร้อยแล้ว', out.emailStatus === 'failed');
          renderSparePartsModule(container);
        } catch (e) {
          showToast('ไม่สามารถส่งอีเมลได้ กรุณาตรวจสอบการตั้งค่า Gmail App Password ในเมนู 9', true);
        } finally {
          btn.disabled = false;
          btn.textContent = prev;
        }
      })
    );

    container.querySelectorAll('[data-ord-del]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-ord-del');
        askConfirm('ลบคำสั่งซื้ออะไหล่นี้?', 'รายการคำสั่งซื้อจะถูกลบออกจากระบบอย่างถาวร', async () => {
          state.data.orders.items = orders.filter((x) => x.id !== id && x.ref !== id);
          try {
            await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
              method: 'DELETE',
              headers: authHeaders(),
            });
          } catch (e) {}
          try {
            localStorage.setItem('ptx_cms_override_orders', JSON.stringify(state.data.orders));
          } catch (e) {}
          showToast('ลบรายการคำสั่งซื้ออะไหล่เรียบร้อยแล้ว');
          renderSparePartsModule(container);
        });
      })
    );

    container.querySelectorAll('[data-mq-edit]').forEach((b) =>
      b.addEventListener('click', () => {
        const item = marquee.find((x) => x.id === b.getAttribute('data-mq-edit'));
        if (item) openMarqueeItemEditor(item);
      })
    );
    container.querySelectorAll('[data-mq-del]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-mq-del');
        askConfirm('ลบการ์ดสไลด์อะไหล่นี้?', 'รายการจะถูกนำออกจากแถบเลื่อนอัตโนมัติทันที', async () => {
          state.data.spareParts.partsMarquee = marquee.filter((x) => x.id !== id);
          state.data.promotions.partsMarquee = state.data.spareParts.partsMarquee;
          await saveCollection('spare-parts', state.data.spareParts);
          renderSparePartsModule(container);
        });
      })
    );

    container.querySelectorAll('[data-rev-edit]').forEach((b) =>
      b.addEventListener('click', () => {
        const item = reviews.find((x) => x.id === b.getAttribute('data-rev-edit'));
        if (item) openReviewEditor(item);
      })
    );
    container.querySelectorAll('[data-rev-del]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-rev-del');
        askConfirm('ลบรีวิวลูกค้านี้?', 'รีวิวจะถูกนำออกจากหน้าอะไหล่ทันที', async () => {
          state.data.reviews = reviews.filter((x) => x.id !== id);
          await saveCollection('reviews', state.data.reviews);
          renderSparePartsModule(container);
        });
      })
    );
  }

  function openSparePartCatalogEditor(existing) {
    const isNew = !existing;
    const item = existing
      ? { ...existing }
      : {
          id: `sp-${Date.now().toString(36)}`,
          sku: `PTX-OEM-${String(Math.floor(100 + Math.random() * 900))}`,
          name: '',
          category: 'ระบบดักฝุ่น',
          spec: '',
          price: 1500,
          originalPrice: 0,
          unit: 'ชิ้น',
          discount: '-15%',
          status: 'พร้อมส่ง 24 ชม.',
          orderable: true,
          inStock: true,
          image: '',
          icon: 'gear',
        };

    const isReady = item.orderable !== false && item.inStock !== false;

    const html = `
      <div class="adm-form-grid">
        ${buildSectionHeader('crimson', 'ข้อมูลสินค้าอะไหล่ที่พร้อมสั่งซื้อ (Orderable Spare Part Identity)', 'ระบุชื่ออะไหล่ รหัสพาร์ท (SKU) หมวดหมู่ และสถานะเปิดให้ลูกค้ากดสั่งซื้อบนหน้าเว็บ', 'ORDERABLE PART')}
        <div class="adm-field adm-field--full">
          <label for="fSpName">ชื่อสินค้าอะไหล่ *</label>
          <input type="text" id="fSpName" class="adm-input" value="${esc(item.name)}" placeholder="เช่น ชุดหัวฉีดและระบบจุดระเบิดหัวเผา A-TECH / Dual-Fuel" required>
        </div>
        <div class="adm-field">
          <label for="fSpSku">รหัสสินค้า / พาร์ท (SKU)</label>
          <input type="text" id="fSpSku" class="adm-input" value="${esc(item.sku || '')}" placeholder="เช่น PTX-BRN-AT285">
        </div>
        <div class="adm-field">
          <label for="fSpCat">หมวดหมู่ *</label>
          <input type="text" id="fSpCat" class="adm-input" value="${esc(item.category)}" placeholder="เช่น ระบบหัวเผา, ระบบดักฝุ่น, ชุดผสม Mixer">
        </div>
        <div class="adm-field adm-field--emerald">
          <label for="fSpOrderable">สถานะการสั่งซื้อบนหน้าเว็บ *</label>
          <select id="fSpOrderable" class="adm-select">
            <option value="true" ${isReady ? 'selected' : ''}>🟢 พร้อมสั่งซื้อ (แสดงในแคตตาล็อกหน้าอะไหล่)</option>
            <option value="false" ${!isReady ? 'selected' : ''}>⚪ ปิดการสั่งซื้อชั่วคราว (ซ่อนจากหน้าเว็บ)</option>
          </select>
        </div>
        <div class="adm-field adm-field--emerald">
          <label for="fSpStatus">ป้ายระยะเวลาจัดส่ง</label>
          <input type="text" id="fSpStatus" class="adm-input" value="${esc(item.status || 'พร้อมส่ง 24 ชม.')}">
        </div>

        ${buildSectionHeader('sapphire', 'ราคาจำหน่ายจริง & สเปกทางเทคนิค (E-Commerce Pricing & Spec)', 'สินค้าที่แสดงในหน้าอะไหล่ต้องมีราคาจำหน่ายจริงมากกว่า 0 บาทเพื่อให้ระบบคำนวณตะกร้าและ VAT 7% ได้แม่นยำ', 'PRICING & VAT')}
        <div class="adm-field adm-field--sapphire">
          <label for="fSpPrice">ราคาจำหน่ายจริง (บาท) * (ต้อง &gt; 0)</label>
          <input type="number" min="1" step="1" id="fSpPrice" class="adm-input" value="${Number(item.price || 1500)}" required>
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fSpOrigPrice">ราคาเต็มก่อนลด (บาท — ไม่บังคับ)</label>
          <input type="number" min="0" step="1" id="fSpOrigPrice" class="adm-input" value="${Number(item.originalPrice || 0)}" placeholder="เช่น 34800 (แสดงขีดฆ่า)">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fSpUnit">หน่วยขาย * (เช่น ชุด / ชิ้น / ใบ / แผ่น / ถัง)</label>
          <input type="text" id="fSpUnit" class="adm-input" value="${esc(item.unit || 'ชิ้น')}" required>
        </div>
        <div class="adm-field adm-field--violet">
          <label for="fSpDiscount">ป้ายส่วนลดมุมการ์ด (เช่น -18% หรือเว้นว่าง)</label>
          <input type="text" id="fSpDiscount" class="adm-input" value="${esc(item.discount || '')}">
        </div>
        <div class="adm-field adm-field--full adm-field--sapphire">
          <label for="fSpSpec">คำอธิบายสเปกทางเทคนิค (แสดง 1–2 บรรทัดบนการ์ดสินค้า)</label>
          <textarea id="fSpSpec" class="adm-textarea">${esc(item.spec)}</textarea>
        </div>

        ${buildSectionHeader('amber', 'รูปภาพสินค้าอะไหล่จริง (4:3 Product Media)', 'อัปโหลดรูปถ่ายอะไหล่จริง (Drag & Drop) หรือเว้นว่างเพื่อแสดงไอคอนวงกลมกระจกใสขนาดมาตรฐาน 52px', 'PRODUCT PHOTO')}
        ${buildImageUploaderField('fSpImg', 'รูปภาพสินค้าอะไหล่ (สัดส่วน 4:3 คมชัดเต็มกรอบ)', item.image)}
      </div>
    `;

    openEditorModal(isNew ? 'เพิ่มสินค้าอะไหล่พร้อมสั่งซื้อ' : `แก้ไขสินค้าอะไหล่: ${item.name}`, html, async (bodyEl) => {
      const priceVal = Math.round(Number(bodyEl.querySelector('#fSpPrice').value) || 0);
      if (priceVal <= 0) {
        showToast('กรุณาระบุราคาจำหน่ายจริงมากกว่า 0 บาท เพื่อให้ลูกค้ากดสั่งซื้อได้', true);
        return;
      }

      const orderableVal = bodyEl.querySelector('#fSpOrderable').value === 'true';
      item.name = bodyEl.querySelector('#fSpName').value.trim() || 'อะไหล่แท้ PROTEX';
      item.sku = bodyEl.querySelector('#fSpSku').value.trim() || item.sku || `PTX-OEM-${Date.now().toString().slice(-3)}`;
      item.category = bodyEl.querySelector('#fSpCat').value.trim() || 'อะไหล่แท้';
      item.orderable = orderableVal;
      item.inStock = orderableVal;
      item.status = bodyEl.querySelector('#fSpStatus').value.trim() || 'พร้อมส่ง 24 ชม.';
      item.price = priceVal;
      item.originalPrice = Math.round(Number(bodyEl.querySelector('#fSpOrigPrice').value) || 0);
      item.unit = bodyEl.querySelector('#fSpUnit').value.trim() || 'ชิ้น';
      item.discount = bodyEl.querySelector('#fSpDiscount').value.trim();
      item.spec = bodyEl.querySelector('#fSpSpec').value.trim();
      item.image = bodyEl.querySelector('#fSpImg').value.trim();

      if (isNew) state.data.spareParts.catalog.push(item);
      else {
        const idx = state.data.spareParts.catalog.findIndex((x) => x.id === item.id);
        if (idx !== -1) state.data.spareParts.catalog[idx] = item;
      }
      await saveCollection('spare-parts', state.data.spareParts);
      closeEditorModal();
      renderActiveTab();
    });
  }

  function openMarqueeItemEditor(existing) {
    const isNew = !existing;
    const item = existing
      ? { ...existing }
      : { id: `p-${Date.now().toString(36)}`, title: '', detail: '', discount: '−20%', icon: 'gear', image: '', tone: 'crimson' };

    const html = `
      <div class="adm-form-grid">
        ${buildSectionHeader('crimson', 'ข้อมูลการ์ดสไลด์อะไหล่ (Marquee Card Info)', 'แสดงในแถบสไลด์เลื่อนอัตโนมัติบนหน้าอะไหล่', 'MARQUEE')}
        <div class="adm-field">
          <label for="fMqTitle">ชื่ออะไหล่ในแถบสไลด์ *</label>
          <input type="text" id="fMqTitle" class="adm-input" value="${esc(item.title)}" required>
        </div>
        <div class="adm-field adm-field--violet">
          <label for="fMqDiscount">ป้ายส่วนลด (เช่น −25%)</label>
          <input type="text" id="fMqDiscount" class="adm-input" value="${esc(item.discount)}">
        </div>
        <div class="adm-field adm-field--full">
          <label for="fMqDetail">คำอธิบายสั้น</label>
          <input type="text" id="fMqDetail" class="adm-input" value="${esc(item.detail)}">
        </div>
        ${buildSectionHeader('amber', 'รูปภาพประกอบการ์ดสไลด์ (Banner Media)', 'อัปโหลดรูปภาพหรือเว้นว่างเพื่อใช้กราฟิกมาตรฐาน', 'MEDIA')}
        ${buildImageUploaderField('fMqImg', 'รูปภาพแบนเนอร์อะไหล่ (อัปโหลดหรือเว้นว่างเพื่อใช้ไอคอน)', item.image)}
      </div>
    `;

    openEditorModal(isNew ? 'เพิ่มการ์ดสไลด์อะไหล่' : `แก้ไขการ์ดสไลด์อะไหล่: ${item.title}`, html, async (bodyEl) => {
      item.title = bodyEl.querySelector('#fMqTitle').value.trim() || 'อะไหล่โปรโมชั่น';
      item.discount = bodyEl.querySelector('#fMqDiscount').value.trim() || 'PROMO';
      item.detail = bodyEl.querySelector('#fMqDetail').value.trim();
      item.image = bodyEl.querySelector('#fMqImg').value.trim();

      if (isNew) state.data.spareParts.partsMarquee.push(item);
      else {
        const idx = state.data.spareParts.partsMarquee.findIndex((x) => x.id === item.id);
        if (idx !== -1) state.data.spareParts.partsMarquee[idx] = item;
      }
      state.data.promotions.partsMarquee = state.data.spareParts.partsMarquee;
      await saveCollection('spare-parts', state.data.spareParts);
      closeEditorModal();
      renderActiveTab();
    });
  }

  function openReviewEditor(existing) {
    const isNew = !existing;
    const item = existing
      ? { ...existing }
      : {
          id: `r-${Date.now().toString(36)}`,
          name: '',
          role: 'ผู้จัดการโครงการ',
          company: '',
          project: '',
          rating: 5,
          date: new Date().toISOString().slice(0, 10),
          text: '',
          tags: ['อะไหล่แท้', 'บริการ 24/7'],
        };

    const html = `
      <div class="adm-form-grid">
        ${buildSectionHeader('crimson', 'ข้อมูลผู้รีวิว & บริษัท (Reviewer Profile)', 'ระบุชื่อลูกค้า ตำแหน่ง บริษัท และโครงการที่ติดตั้ง', 'CLIENT REVIEW')}
        <div class="adm-field">
          <label for="fRevName">ชื่อลูกค้า *</label>
          <input type="text" id="fRevName" class="adm-input" value="${esc(item.name)}" required>
        </div>
        <div class="adm-field">
          <label for="fRevRole">ตำแหน่ง</label>
          <input type="text" id="fRevRole" class="adm-input" value="${esc(item.role)}">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fRevComp">บริษัท</label>
          <input type="text" id="fRevComp" class="adm-input" value="${esc(item.company)}">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fRevProj">โครงการ / จังหวัด</label>
          <input type="text" id="fRevProj" class="adm-input" value="${esc(item.project)}">
        </div>
        ${buildSectionHeader('emerald', 'คะแนนดาว & ความคิดเห็น (Rating & Testimonial)', 'กำหนดคะแนนความพึงพอใจ 1-5 ดาว และข้อความรีวิว', '5-STAR RATING')}
        <div class="adm-field adm-field--amber">
          <label for="fRevRate">คะแนนดาว (1 - 5)</label>
          <input type="number" step="0.5" min="1" max="5" id="fRevRate" class="adm-input" value="${Number(item.rating || 5)}">
        </div>
        <div class="adm-field adm-field--emerald">
          <label for="fRevTags">ป้ายกำกับ (คั่นด้วยลูกน้ำ ,)</label>
          <input type="text" id="fRevTags" class="adm-input" value="${esc((item.tags || []).join(', '))}">
        </div>
        <div class="adm-field adm-field--full adm-field--emerald">
          <label for="fRevText">ข้อความรีวิวจากลูกค้า *</label>
          <textarea id="fRevText" class="adm-textarea">${esc(item.text)}</textarea>
        </div>
      </div>
    `;

    openEditorModal(isNew ? 'เพิ่มรีวิวลูกค้าใหม่' : `แก้ไขรีวิวลูกค้า: ${item.name}`, html, async (bodyEl) => {
      item.name = bodyEl.querySelector('#fRevName').value.trim() || 'ลูกค้า PROTEX';
      item.role = bodyEl.querySelector('#fRevRole').value.trim();
      item.company = bodyEl.querySelector('#fRevComp').value.trim();
      item.project = bodyEl.querySelector('#fRevProj').value.trim();
      item.rating = Math.min(5, Math.max(1, Number(bodyEl.querySelector('#fRevRate').value) || 5));
      item.tags = bodyEl
        .querySelector('#fRevTags')
        .value.split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      item.text = bodyEl.querySelector('#fRevText').value.trim();

      if (isNew) state.data.reviews.unshift(item);
      else {
        const idx = state.data.reviews.findIndex((x) => x.id === item.id);
        if (idx !== -1) state.data.reviews[idx] = item;
      }
      await saveCollection('reviews', state.data.reviews);
      closeEditorModal();
      renderActiveTab();
    });
  }

  /* ============================================================================
   * MODULE 4: SPARE PARTS ORDERS & ADMIN KEY-IN (`orders.json`)
   * ============================================================================ */
  const ORDER_STATUS_META = {
    pending: { label: 'รอตรวจสอบ', dotCls: 'adm-ord-dot--pending', pillCls: 'adm-ord-status-pill--pending' },
    confirmed: { label: 'ยืนยันออเดอร์', dotCls: 'adm-ord-dot--confirmed', pillCls: 'adm-ord-status-pill--confirmed' },
    preparing: { label: 'กำลังจัดเตรียม', dotCls: 'adm-ord-dot--preparing', pillCls: 'adm-ord-status-pill--preparing' },
    shipping: { label: 'กำลังจัดส่ง', dotCls: 'adm-ord-dot--shipping', pillCls: 'adm-ord-status-pill--shipping' },
    completed: { label: 'จัดส่งสำเร็จ', dotCls: 'adm-ord-dot--completed', pillCls: 'adm-ord-status-pill--completed' },
    cancelled: { label: 'ยกเลิก', dotCls: 'adm-ord-dot--cancelled', pillCls: 'adm-ord-status-pill--cancelled' },
  };

  const PAYMENT_STATUS_META = {
    unpaid: {
      label: 'รอชำระเงิน',
      pillCls: 'adm-ord-pay-pill--unpaid',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    },
    paid: {
      label: 'โอนชำระแล้ว',
      pillCls: 'adm-ord-pay-pill--paid',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    },
    credit: {
      label: 'เครดิตองค์กร',
      pillCls: 'adm-ord-pay-pill--credit',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6"/></svg>',
    },
  };

  function formatThaiOrderDateTime(isoStr) {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    if (Number.isNaN(d.getTime())) {
      return String(isoStr).replace('T', ' ').slice(0, 16);
    }
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const day = d.getDate();
    const mon = months[d.getMonth()];
    const by = d.getFullYear() + 543;
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${mon} ${by} · ${hh}:${mm} น.`;
  }

  function printOrderPackingSlipA4(ord) {
    const win = window.open('', '_blank', 'width=940,height=840');
    if (!win) {
      window.print();
      return;
    }
    const st = ORDER_STATUS_META[ord.status || 'pending'] || ORDER_STATUS_META.pending;
    const pay = PAYMENT_STATUS_META[ord.paymentStatus || 'unpaid'] || PAYMENT_STATUS_META.unpaid;
    const linesHTML = (ord.lines || [])
      .map(
        (l, idx) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;text-align:center;color:#64748B;">${idx + 1}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;font-weight:700;color:#0F172A;">
            ${esc(l.name)}
            ${l.sku ? `<div style="font-size:11px;color:#64748B;font-weight:600;">รหัสพาร์ท (SKU): ${esc(l.sku)}</div>` : ''}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;text-align:center;font-weight:700;">${l.qty} ${esc(l.unit || 'ชิ้น')}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;text-align:right;">${fmtTHB(l.unitPrice)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;text-align:right;font-weight:800;">${fmtTHB(l.total)}</td>
        </tr>`
      )
      .join('');

    win.document.write(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>ใบสรุปคำสั่งซื้อ / ใบจัดของ ${esc(ord.ref)} — PROTEX GROUP</title>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'IBM Plex Sans Thai', sans-serif; margin: 24px; background: #FFF; color: #0F172A; font-size: 13px; }
          .sheet { max-width: 820px; margin: 0 auto; border: 1px solid #CBD5E1; border-radius: 16px; padding: 26px 28px; }
          .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #DC2626; padding-bottom: 16px; margin-bottom: 18px; }
          .grid2 { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0F172A; color: #FFF; padding: 9px 12px; text-align: left; font-size: 12px; }
          .totals { width: 320px; margin-left: auto; margin-top: 16px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 12px 14px; }
          .t-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .t-row.grand { border-top: 1.5px solid #CBD5E1; margin-top: 6px; padding-top: 8px; font-size: 16px; font-weight: 800; color: #DC2626; }
          .signs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 32px; text-align: center; }
          .sign-box { border-top: 1px dashed #94A3B8; padding-top: 8px; margin-top: 36px; font-size: 12px; color: #475569; }
          @page { size: A4 portrait; margin: 10mm 12mm; }
          @media print { body { margin: 0; } .sheet { border: none; padding: 6px; max-width: none; } }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="head">
            <div>
              <div style="font-size:18px;font-weight:800;color:#DC2626;">บริษัท โปรเท็กซ์ กรุ๊ป จำกัด (PROTEX GROUP CO., LTD.)</div>
              <div style="color:#475569;margin-top:3px;">88/9 หมู่ 12 ถนนบางนา-ตราด กม.15 ต.บางพลีใหญ่ อ.บางพลี จ.สมุทรปราการ 10540</div>
              <div style="color:#475569;">สายด่วนคลังอะไหล่: 085-392-4448 · LINE: protex000 · protexgroupa@gmail.com</div>
            </div>
            <div style="text-align:right;">
              <div style="display:inline-block;padding:4px 10px;border-radius:6px;background:#FEF2F2;color:#DC2626;font-weight:800;font-size:11px;">ใบสรุปคำสั่งซื้อ / ใบจัดของ (ORDER &amp; PACKING SLIP)</div>
              <div style="font-size:18px;font-weight:900;margin-top:4px;">${esc(ord.ref)}</div>
              <div style="color:#475569;font-size:12px;">วันที่สั่งซื้อ: ${esc((ord.createdAt || '').replace('T', ' ').slice(0, 16))}</div>
            </div>
          </div>

          <div class="grid2">
            <div>
              <div style="font-size:11px;font-weight:800;color:#DC2626;text-transform:uppercase;">ข้อมูลผู้สั่งซื้อและสถานที่จัดส่ง</div>
              <div style="font-size:15px;font-weight:800;margin-top:4px;">${esc(ord.customer?.name || '-')}</div>
              <div><strong>บริษัท/หน่วยงาน:</strong> ${esc(ord.customer?.company || '-')}</div>
              <div><strong>เบอร์โทรศัพท์:</strong> ${esc(ord.customer?.phone || '-')} ${ord.customer?.email ? `· <strong>อีเมล:</strong> ${esc(ord.customer.email)}` : ''}</div>
              <div style="margin-top:4px;"><strong>ที่อยู่จัดส่ง:</strong> ${esc(ord.customer?.address || '-')}</div>
              ${ord.customer?.note ? `<div style="margin-top:4px;color:#475569;"><strong>ข้อมูลใบกำกับภาษี/หมายเหตุ:</strong> ${esc(ord.customer.note)}</div>` : ''}
            </div>
            <div>
              <div style="font-size:11px;font-weight:800;color:#2563EB;text-transform:uppercase;">ข้อมูลการจัดส่งและชำระเงิน</div>
              <div style="margin-top:4px;"><strong>สถานะออเดอร์:</strong> ${esc(st.label)}</div>
              <div><strong>สถานะชำระเงิน:</strong> ${esc(pay.label)}</div>
              <div><strong>ขนส่ง/วิธีจัดส่ง:</strong> ${esc(ord.carrier || '-')}</div>
              <div><strong>เลขพัสดุ (Tracking):</strong> ${esc(ord.trackingNo || '-')}</div>
              <div><strong>เลขใบกำกับภาษี/บิล:</strong> ${esc(ord.taxInvoiceNo || '-')}</div>
              <div><strong>ผู้รับผิดชอบ:</strong> ${esc(ord.salesOwner || '-')}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:40px;text-align:center;border-radius:8px 0 0 0;">#</th>
                <th>รายการสินค้าอะไหล่แท้ PROTEX</th>
                <th style="width:100px;text-align:center;">จำนวน</th>
                <th style="width:120px;text-align:right;">ราคา/หน่วย</th>
                <th style="width:130px;text-align:right;border-radius:0 8px 0 0;">รวมเงิน (THB)</th>
              </tr>
            </thead>
            <tbody>${linesHTML}</tbody>
          </table>

          <div class="totals">
            ${ord.discountAmount > 0 ? `<div class="t-row"><span>ส่วนลดพิเศษ:</span><strong>-${fmtTHB(ord.discountAmount)}</strong></div>` : ''}
            ${ord.shippingFee > 0 ? `<div class="t-row"><span>ค่าจัดส่ง:</span><strong>+${fmtTHB(ord.shippingFee)}</strong></div>` : ''}
            <div class="t-row"><span>ยอดรวมก่อนภาษี (Subtotal):</span><strong>${fmtTHB(ord.subtotal)}</strong></div>
            <div class="t-row"><span>ภาษีมูลค่าเพิ่ม VAT 7%:</span><strong>${fmtTHB(ord.vatAmount)}</strong></div>
            <div class="t-row grand"><span>ยอดสุทธิทั้งสิ้น:</span><strong>${fmtTHB(ord.grandTotal)}</strong></div>
          </div>

          ${ord.internalNote ? `<div style="margin-top:14px;padding:10px 14px;border-radius:10px;background:#FFFBEB;border:1px solid #FDE68A;font-size:12px;"><strong>บันทึกภายในสำหรับทีมจัดของ:</strong> ${esc(ord.internalNote)}</div>` : ''}

          <div class="signs">
            <div class="sign-box">ผู้จัดเตรียมอะไหล่ / คลังสินค้า</div>
            <div class="sign-box">ผู้ตรวจสอบ / ฝ่ายขาย (${esc(ord.salesOwner || 'PROTEX')})</div>
            <div class="sign-box">ผู้รับสินค้า / ลูกค้า</div>
          </div>
        </div>
        <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };<\/script>
      </body>
      </html>
    `);
    win.document.close();
  }

  function openOrderKeyInModal(existingOrder, container) {
    const isNew = !existingOrder;
    const catalog = state.data.spareParts?.catalog || [];
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const draftOrd = existingOrder
      ? JSON.parse(JSON.stringify(existingOrder))
      : {
          id: `ord-${Date.now().toString(36)}`,
          ref: `ORD-${ymd}-${String((state.data.orders?.items?.length || 0) + 1).padStart(3, '0')}`,
          createdAt: new Date().toISOString(),
          source: 'admin_keyin',
          status: 'confirmed',
          paymentStatus: 'unpaid',
          carrier: 'รถขนส่งบริษัท PROTEX',
          trackingNo: '',
          taxInvoiceNo: '',
          salesOwner: '',
          internalNote: '',
          discountAmount: 0,
          shippingFee: 0,
          customer: { name: '', phone: '', company: '', email: '', address: '', note: '' },
          lines: catalog.length
            ? [
                {
                  id: catalog[0].id,
                  sku: catalog[0].sku || '',
                  name: catalog[0].name,
                  unit: catalog[0].unit || 'ชิ้น',
                  qty: 1,
                  unitPrice: Number(catalog[0].price) || 1500,
                  total: Number(catalog[0].price) || 1500,
                },
              ]
            : [],
        };

    if (!Array.isArray(draftOrd.lines)) draftOrd.lines = [];

    const catalogOptionsHTML = catalog
      .map((c) => `<option value="${esc(c.id)}">${esc(c.name)} (${esc(c.sku || c.category)}) — ${fmtTHB(c.price)}/${esc(c.unit || 'ชิ้น')}</option>`)
      .join('');

    const html = `
      <div class="adm-form-grid">
        <!-- SECTION 1: Crimson — Customer & Shipping Details -->
        ${buildSectionHeader('crimson', 'หมวด 1 — ข้อมูลผู้สั่งซื้อและที่อยู่จัดส่ง (Customer & Shipping)', 'แก้ไขหรือคีย์ข้อมูลผู้สั่งซื้อ ที่อยู่จัดส่งหน้างาน และรายละเอียดออกใบกำกับภาษี', 'CUSTOMER INFO')}
        <div class="adm-field">
          <label for="fOrdCustName">ชื่อผู้สั่งซื้อ *</label>
          <input type="text" id="fOrdCustName" class="adm-input" value="${esc(draftOrd.customer?.name || '')}" placeholder="เช่น คุณวิชัย พัฒนกิจการทาง" required>
        </div>
        <div class="adm-field">
          <label for="fOrdCustPhone">เบอร์โทรศัพท์ *</label>
          <input type="tel" id="fOrdCustPhone" class="adm-input" value="${esc(draftOrd.customer?.phone || '')}" placeholder="เช่น 089-456-7890" required>
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fOrdCustComp">บริษัท / หน่วยงาน</label>
          <input type="text" id="fOrdCustComp" class="adm-input" value="${esc(draftOrd.customer?.company || '')}" placeholder="เช่น บจก. สยามแอสฟัลท์ คอนสตรัคชั่น">
        </div>
        <div class="adm-field adm-field--emerald">
          <label for="fOrdCustEmail">อีเมลลูกค้า</label>
          <input type="email" id="fOrdCustEmail" class="adm-input" value="${esc(draftOrd.customer?.email || '')}" placeholder="purchasing@company.co.th">
        </div>
        <div class="adm-field adm-field--full adm-field--amber">
          <label for="fOrdCustAddr">ที่อยู่จัดส่ง / พิกัดไซต์งาน *</label>
          <textarea id="fOrdCustAddr" class="adm-textarea" rows="2" placeholder="ระบุที่อยู่จัดส่งอะไหล่หรือพิกัดหน้างานแพล้นท์">${esc(draftOrd.customer?.address || '')}</textarea>
        </div>
        <div class="adm-field adm-field--full adm-field--violet">
          <label for="fOrdCustNote">ข้อมูลออกใบกำกับภาษี / หมายเหตุจากลูกค้า</label>
          <input type="text" id="fOrdCustNote" class="adm-input" value="${esc(draftOrd.customer?.note || '')}" placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก หรือหมายเหตุพิเศษ">
        </div>

        <!-- SECTION 2: Sapphire — Editable Order Items & Live VAT 7% Engine -->
        ${buildSectionHeader('sapphire', 'หมวด 2 — รายการสินค้าในคำสั่งซื้อ (Editable Order Items)', 'เพิ่มอะไหล่จากแคตตาล็อก ปรับจำนวน แก้ไขราคาต่อหน่วย หรือใส่ส่วนลดพิเศษและค่าจัดส่ง', 'ORDER ITEMS')}
        <div class="adm-field adm-field--full">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <select id="fOrdCatalogPicker" class="adm-select" style="flex:1;min-width:220px;">
              ${catalogOptionsHTML}
            </select>
            <button type="button" class="adm-btn adm-btn--red adm-btn--sm" id="btnOrdAddFromCatalog">+ เพิ่มอะไหล่จากแคตตาล็อก</button>
            <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" id="btnOrdAddCustomLine">+ เพิ่มรายการกำหนดเอง</button>
          </div>
        </div>

        <div class="adm-field adm-field--full">
          <div id="fOrdLinesWrap" style="display:flex;flex-direction:column;gap:8px;"></div>
        </div>

        <div class="adm-field adm-field--sapphire">
          <label for="fOrdDiscount">ส่วนลดพิเศษท้ายบิล (บาท)</label>
          <input type="number" min="0" step="1" id="fOrdDiscount" class="adm-input" value="${Number(draftOrd.discountAmount || 0)}">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fOrdShipping">ค่าขนส่ง / ค่าจัดส่งด่วน (บาท)</label>
          <input type="number" min="0" step="1" id="fOrdShipping" class="adm-input" value="${Number(draftOrd.shippingFee || 0)}">
        </div>

        <div class="adm-field adm-field--full">
          <div id="fOrdLiveTotalsBox" style="padding:14px 16px;border-radius:16px;background:rgba(255,255,255,0.82);border:1px solid rgba(37,99,235,0.25);display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;"></div>
        </div>

        <!-- SECTION 3: Emerald — Admin Fulfillment & Shipping Key-in -->
        ${buildSectionHeader('emerald', 'หมวด 3 — คีย์ข้อมูลการดำเนินการ & การจัดส่ง (Admin Fulfillment Key-in)', 'บันทึกสถานะออเดอร์ การชำระเงิน ขนส่ง เลขพัสดุ เลขใบกำกับภาษี และผู้รับผิดชอบ', 'FULFILLMENT KEY-IN')}
        <div class="adm-field adm-field--emerald">
          <label for="fOrdStatus">สถานะคำสั่งซื้อ *</label>
          <select id="fOrdStatus" class="adm-select">
            <option value="pending" ${draftOrd.status === 'pending' ? 'selected' : ''}>รอตรวจสอบ</option>
            <option value="confirmed" ${draftOrd.status === 'confirmed' ? 'selected' : ''}>ยืนยันออเดอร์</option>
            <option value="preparing" ${draftOrd.status === 'preparing' ? 'selected' : ''}>กำลังจัดเตรียม</option>
            <option value="shipping" ${draftOrd.status === 'shipping' ? 'selected' : ''}>กำลังจัดส่ง</option>
            <option value="completed" ${draftOrd.status === 'completed' ? 'selected' : ''}>จัดส่งสำเร็จ</option>
            <option value="cancelled" ${draftOrd.status === 'cancelled' ? 'selected' : ''}>ยกเลิก</option>
          </select>
        </div>
        <div class="adm-field adm-field--emerald">
          <label for="fOrdPayStatus">สถานะการชำระเงิน *</label>
          <select id="fOrdPayStatus" class="adm-select">
            <option value="unpaid" ${(draftOrd.paymentStatus || 'unpaid') === 'unpaid' ? 'selected' : ''}>รอชำระเงิน</option>
            <option value="paid" ${draftOrd.paymentStatus === 'paid' ? 'selected' : ''}>โอนชำระแล้ว</option>
            <option value="credit" ${draftOrd.paymentStatus === 'credit' ? 'selected' : ''}>เครดิตองค์กร</option>
          </select>
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fOrdCarrier">บริษัทขนส่ง / วิธีจัดส่ง</label>
          <input type="text" id="fOrdCarrier" class="adm-input" value="${esc(draftOrd.carrier || '')}" placeholder="เช่น รถขนส่งบริษัท PROTEX, Flash, Kerry, นิ่มซี่เส็ง">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fOrdTracking">เลขพัสดุ / หมายเลขติดตาม (Tracking No.)</label>
          <input type="text" id="fOrdTracking" class="adm-input" value="${esc(draftOrd.trackingNo || '')}" placeholder="เช่น TH0123456789A หรือทะเบียนรถขนส่ง">
        </div>
        <div class="adm-field adm-field--amber">
          <label for="fOrdTaxInv">เลขที่ใบกำกับภาษี / เลขที่บิลอ้างอิง</label>
          <input type="text" id="fOrdTaxInv" class="adm-input" value="${esc(draftOrd.taxInvoiceNo || '')}" placeholder="เช่น INV-202611-0042">
        </div>
        <div class="adm-field adm-field--violet">
          <label for="fOrdSalesOwner">ชื่อผู้รับผิดชอบ / พนักงานขาย</label>
          <input type="text" id="fOrdSalesOwner" class="adm-input" value="${esc(draftOrd.salesOwner || '')}" placeholder="เช่น คุณสมศักดิ์ (ฝ่ายอะไหล่)">
        </div>
        <div class="adm-field adm-field--full adm-field--emerald">
          <label for="fOrdInternalNote">บันทึกภายในสำหรับทีมงาน (Internal Notes)</label>
          <textarea id="fOrdInternalNote" class="adm-textarea" rows="2" placeholder="บันทึกการตรวจสอบสต็อก วันนัดส่ง หรือเงื่อนไขพิเศษสำหรับทีมงาน">${esc(draftOrd.internalNote || '')}</textarea>
        </div>

        <div class="adm-field adm-field--full" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding-top:6px;">
          <button type="button" class="adm-btn adm-btn--glass" id="btnOrdPrintSlipModal">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            <span>พิมพ์ใบสรุปคำสั่งซื้อ / ใบจัดของ (A4)</span>
          </button>
          <span style="font-size:0.78rem;color:#64748B;">คลิกปุ่ม “บันทึกข้อมูลคำสั่งซื้อ” ด้านล่างเพื่อบันทึกลง orders.json ทันที</span>
        </div>
      </div>
    `;

    let computeCurrentSnapshot = () => draftOrd;

    openEditorModal(
      isNew ? `คีย์คำสั่งซื้ออะไหล่ใหม่: ${draftOrd.ref}` : `จัดการ & คีย์ข้อมูลคำสั่งซื้อ: ${draftOrd.ref}`,
      html,
      async () => {
        const snap = computeCurrentSnapshot();
        if (!snap.customer.name || !snap.customer.phone) {
          showToast('กรุณากรอกชื่อผู้สั่งซื้อและเบอร์โทรศัพท์', true);
          return;
        }
        if (!snap.lines.length) {
          showToast('กรุณาเพิ่มรายการสินค้าอะไหล่อย่างน้อย 1 รายการ', true);
          return;
        }

        const list = state.data.orders.items || [];
        try {
          const url = isNew ? '/api/admin/orders' : `/api/admin/orders/${encodeURIComponent(snap.id || snap.ref)}`;
          const method = isNew ? 'POST' : 'PUT';
          const res = await fetch(url, {
            method,
            headers: authHeaders(),
            body: JSON.stringify(snap),
          });
          const out = await res.json();
          if (res.ok && out.ok && out.item) {
            Object.assign(snap, out.item);
          }
        } catch (err) {}

        if (isNew) {
          list.unshift(snap);
        } else {
          const idx = list.findIndex((x) => (x.id || x.ref) === (snap.id || snap.ref));
          if (idx !== -1) list[idx] = snap;
        }

        try {
          localStorage.setItem('ptx_cms_override_orders', JSON.stringify({ items: list }));
        } catch (e) {}

        updateSidebarBadges();
        closeEditorModal();
        showToast(`บันทึกข้อมูลคำสั่งซื้อ ${snap.ref} เรียบร้อยแล้ว`);
        renderOrdersModule(container);
      },
      (bodyEl) => {
        const saveBtn = document.getElementById('admEditorSaveBtn');
        if (saveBtn) saveBtn.textContent = 'บันทึกข้อมูลคำสั่งซื้อ';

        const linesWrap = bodyEl.querySelector('#fOrdLinesWrap');
        const totalsBox = bodyEl.querySelector('#fOrdLiveTotalsBox');
        const discountInput = bodyEl.querySelector('#fOrdDiscount');
        const shippingInput = bodyEl.querySelector('#fOrdShipping');

        const recalcAndRenderTotals = () => {
          let totalQty = 0;
          let itemsSubtotal = 0;
          draftOrd.lines.forEach((l) => {
            l.qty = Math.max(1, Math.floor(Number(l.qty) || 1));
            l.unitPrice = Math.max(0, Math.round(Number(l.unitPrice) || 0));
            l.total = l.qty * l.unitPrice;
            totalQty += l.qty;
            itemsSubtotal += l.total;
          });
          const disc = Math.max(0, Math.round(Number(discountInput?.value) || 0));
          const ship = Math.max(0, Math.round(Number(shippingInput?.value) || 0));
          const subtotal = Math.max(0, itemsSubtotal - disc + ship);
          const vatAmount = Math.round(subtotal * 0.07);
          const grandTotal = subtotal + vatAmount;

          draftOrd.totalQty = totalQty;
          draftOrd.itemsSubtotal = itemsSubtotal;
          draftOrd.discountAmount = disc;
          draftOrd.shippingFee = ship;
          draftOrd.subtotal = subtotal;
          draftOrd.vatRate = 7;
          draftOrd.vatAmount = vatAmount;
          draftOrd.grandTotal = grandTotal;

          if (totalsBox) {
            totalsBox.innerHTML = `
              <div style="font-size:0.82rem;color:#334155;">
                จำนวนรวม: <strong>${totalQty} ชิ้น</strong> · รวมค่าอะไหล่: <strong>${fmtTHB(itemsSubtotal)}</strong>
                ${disc > 0 ? ` · ส่วนลด: <strong style="color:#059669;">-${fmtTHB(disc)}</strong>` : ''}
                ${ship > 0 ? ` · ค่าขนส่ง: <strong>+${fmtTHB(ship)}</strong>` : ''}
              </div>
              <div style="font-size:0.86rem;color:#0F172A;display:flex;gap:14px;align-items:baseline;flex-wrap:wrap;">
                <span>ก่อน VAT: <strong>${fmtTHB(subtotal)}</strong></span>
                <span>VAT 7%: <strong>${fmtTHB(vatAmount)}</strong></span>
                <span style="font-size:1.05rem;font-weight:900;color:#DC2626;">ยอดสุทธิ: ${fmtTHB(grandTotal)}</span>
              </div>
            `;
          }
        };

        const renderEditableLines = () => {
          if (!linesWrap) return;
          if (!draftOrd.lines.length) {
            linesWrap.innerHTML = `<div style="padding:14px;text-align:center;border-radius:12px;background:rgba(255,255,255,0.6);color:#64748B;font-size:0.82rem;">ยังไม่มีรายการสินค้า กดปุ่ม “+ เพิ่มอะไหล่จากแคตตาล็อก” ด้านบน</div>`;
            recalcAndRenderTotals();
            return;
          }

          linesWrap.innerHTML = draftOrd.lines
            .map(
              (l, idx) => `
              <div style="display:grid;grid-template-columns:minmax(160px,1.6fr) minmax(90px,0.7fr) 84px 74px 115px 36px;gap:8px;align-items:center;padding:8px 10px;border-radius:14px;background:rgba(255,255,255,0.82);border:1px solid rgba(255,255,255,0.95);">
                <input type="text" class="adm-input" data-ol-name="${idx}" value="${esc(l.name)}" placeholder="ชื่อรายการอะไหล่">
                <input type="text" class="adm-input" data-ol-sku="${idx}" value="${esc(l.sku || '')}" placeholder="รหัส SKU">
                <input type="number" min="1" class="adm-input" data-ol-qty="${idx}" value="${Number(l.qty || 1)}" title="จำนวน">
                <input type="text" class="adm-input" data-ol-unit="${idx}" value="${esc(l.unit || 'ชิ้น')}" placeholder="หน่วย">
                <input type="number" min="0" class="adm-input" data-ol-price="${idx}" value="${Number(l.unitPrice || 0)}" title="ราคาต่อหน่วย">
                <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-ol-rm="${idx}" style="padding:0;height:32px;justify-content:center;">✕</button>
              </div>`
            )
            .join('');

          recalcAndRenderTotals();
        };

        linesWrap?.addEventListener('input', (e) => {
          const t = e.target;
          if (t.hasAttribute('data-ol-name')) {
            const idx = Number(t.getAttribute('data-ol-name'));
            if (draftOrd.lines[idx]) draftOrd.lines[idx].name = t.value;
          } else if (t.hasAttribute('data-ol-sku')) {
            const idx = Number(t.getAttribute('data-ol-sku'));
            if (draftOrd.lines[idx]) draftOrd.lines[idx].sku = t.value;
          } else if (t.hasAttribute('data-ol-qty')) {
            const idx = Number(t.getAttribute('data-ol-qty'));
            if (draftOrd.lines[idx]) draftOrd.lines[idx].qty = Math.max(1, Number(t.value) || 1);
            recalcAndRenderTotals();
          } else if (t.hasAttribute('data-ol-unit')) {
            const idx = Number(t.getAttribute('data-ol-unit'));
            if (draftOrd.lines[idx]) draftOrd.lines[idx].unit = t.value;
          } else if (t.hasAttribute('data-ol-price')) {
            const idx = Number(t.getAttribute('data-ol-price'));
            if (draftOrd.lines[idx]) draftOrd.lines[idx].unitPrice = Math.max(0, Number(t.value) || 0);
            recalcAndRenderTotals();
          }
        });

        linesWrap?.addEventListener('click', (e) => {
          const rm = e.target.closest('[data-ol-rm]');
          if (!rm) return;
          const idx = Number(rm.getAttribute('data-ol-rm'));
          draftOrd.lines.splice(idx, 1);
          renderEditableLines();
        });

        discountInput?.addEventListener('input', recalcAndRenderTotals);
        shippingInput?.addEventListener('input', recalcAndRenderTotals);

        bodyEl.querySelector('#btnOrdAddFromCatalog')?.addEventListener('click', () => {
          const sel = bodyEl.querySelector('#fOrdCatalogPicker');
          const found = catalog.find((c) => c.id === sel?.value) || catalog[0];
          if (!found) return;
          const existingLine = draftOrd.lines.find((l) => l.id === found.id);
          if (existingLine) {
            existingLine.qty += 1;
          } else {
            draftOrd.lines.push({
              id: found.id,
              sku: found.sku || '',
              name: found.name,
              unit: found.unit || 'ชิ้น',
              qty: 1,
              unitPrice: Number(found.price) || 0,
              total: Number(found.price) || 0,
            });
          }
          renderEditableLines();
        });

        bodyEl.querySelector('#btnOrdAddCustomLine')?.addEventListener('click', () => {
          draftOrd.lines.push({
            id: `sp-custom-${Date.now().toString(36)}`,
            sku: 'PTX-CUSTOM',
            name: 'อะไหล่สั่งทำพิเศษ / บริการจัดส่ง',
            unit: 'ชุด',
            qty: 1,
            unitPrice: 1000,
            total: 1000,
          });
          renderEditableLines();
        });

        computeCurrentSnapshot = () => {
          recalcAndRenderTotals();
          draftOrd.customer = {
            name: bodyEl.querySelector('#fOrdCustName')?.value.trim() || '',
            phone: bodyEl.querySelector('#fOrdCustPhone')?.value.trim() || '',
            company: bodyEl.querySelector('#fOrdCustComp')?.value.trim() || '',
            email: bodyEl.querySelector('#fOrdCustEmail')?.value.trim() || '',
            address: bodyEl.querySelector('#fOrdCustAddr')?.value.trim() || '',
            note: bodyEl.querySelector('#fOrdCustNote')?.value.trim() || '',
          };
          draftOrd.status = bodyEl.querySelector('#fOrdStatus')?.value || 'pending';
          draftOrd.paymentStatus = bodyEl.querySelector('#fOrdPayStatus')?.value || 'unpaid';
          draftOrd.carrier = bodyEl.querySelector('#fOrdCarrier')?.value.trim() || '';
          draftOrd.trackingNo = bodyEl.querySelector('#fOrdTracking')?.value.trim() || '';
          draftOrd.taxInvoiceNo = bodyEl.querySelector('#fOrdTaxInv')?.value.trim() || '';
          draftOrd.salesOwner = bodyEl.querySelector('#fOrdSalesOwner')?.value.trim() || '';
          draftOrd.internalNote = bodyEl.querySelector('#fOrdInternalNote')?.value.trim() || '';
          return draftOrd;
        };

        bodyEl.querySelector('#btnOrdPrintSlipModal')?.addEventListener('click', () => {
          printOrderPackingSlipA4(computeCurrentSnapshot());
        });

        renderEditableLines();
      }
    );
  }

  function renderOrdersModule(container) {
    const saveBtn = document.getElementById('admEditorSaveBtn');
    if (saveBtn) saveBtn.textContent = 'บันทึกข้อมูล';

    const orders = state.data.orders?.items || [];
    const filter = state.ordersFilter || 'all';

    const countByStatus = {
      pending: orders.filter((o) => (o.status || 'pending') === 'pending').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      shipping: orders.filter((o) => o.status === 'shipping').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };

    const waitingCount = countByStatus.pending;
    const shippingDoneCount = countByStatus.shipping + countByStatus.completed;
    const totalRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);

    const buildFilteredCardsHTML = (queryRaw) => {
      const q = (queryRaw || '').trim().toLowerCase();
      const filtered = orders.filter((ord) => {
        const st = ord.status || 'pending';
        if (filter !== 'all' && st !== filter) return false;
        if (!q) return true;
        const hay = [
          ord.ref,
          ord.customer?.name,
          ord.customer?.company,
          ord.customer?.phone,
          ord.customer?.email,
          ord.customer?.address,
          ord.trackingNo,
          ord.taxInvoiceNo,
          ord.carrier,
          ord.salesOwner,
          ...(ord.lines || []).map((l) => `${l.name} ${l.sku}`),
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });

      if (!filtered.length) {
        return `<div class="adm-ord-empty adm-glass">ไม่พบรายการคำสั่งซื้ออะไหล่ตามเงื่อนไขที่เลือก</div>`;
      }

      return filtered
        .map((ord) => {
          const stKey = ord.status || 'pending';
          const st = ORDER_STATUS_META[stKey] || ORDER_STATUS_META.pending;
          const pay = PAYMENT_STATUS_META[ord.paymentStatus || 'unpaid'] || PAYMENT_STATUS_META.unpaid;
          const lineList = Array.isArray(ord.lines) ? ord.lines : [];
          const totalUnits = ord.totalQty || lineList.reduce((sum, l) => sum + (Number(l.qty) || 0), 0);
          const ordId = esc(ord.id || ord.ref);
          const phoneRaw = String(ord.customer?.phone || '').trim();

          const linesRowsHTML = lineList
            .map(
              (l) => `
              <div class="adm-ord-line-row">
                <div class="adm-ord-line-main">
                  <span class="adm-ord-line-name">${esc(l.name)}</span>
                  ${l.sku ? `<span class="adm-ord-line-sku">${esc(l.sku)}</span>` : ''}
                </div>
                <span class="adm-ord-line-qty">&times; ${Number(l.qty || 1)} ${esc(l.unit || 'ชิ้น')}</span>
                <span class="adm-ord-line-amt">${fmtTHB(l.total)}</span>
              </div>`
            )
            .join('');

          return `
          <article class="adm-ord-card" data-ord-card="${ordId}">
            <!-- Tier 1: Order Card Top Bar -->
            <div class="adm-ord-card__top">
              <div class="adm-ord-card__top-left">
                <span class="adm-ord-ref">${esc(ord.ref)}</span>
                <span class="adm-ord-time">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                  <span>${esc(formatThaiOrderDateTime(ord.createdAt))}</span>
                </span>
                ${
                  ord.trackingNo
                    ? `<span class="adm-ord-ref-chip">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                        <span>พัสดุ: ${esc(ord.trackingNo)}</span>
                      </span>`
                    : ''
                }
                ${
                  ord.taxInvoiceNo
                    ? `<span class="adm-ord-ref-chip adm-ord-ref-chip--violet">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>
                        <span>บิล: ${esc(ord.taxInvoiceNo)}</span>
                      </span>`
                    : ''
                }
              </div>

              <div class="adm-ord-card__badges">
                <span class="adm-ord-status-pill ${st.pillCls}">
                  <span class="adm-ord-dot ${st.dotCls}"></span>
                  <span>${esc(st.label)}</span>
                </span>
                <span class="adm-ord-pay-pill ${pay.pillCls}">
                  ${pay.icon}
                  <span>${esc(pay.label)}</span>
                </span>
              </div>
            </div>

            <!-- Tier 2: Symmetrical 2-Column Bento Body -->
            <div class="adm-ord-card__body">
              <!-- Left Column: Customer & Shipping Frosted Inset -->
              <div class="adm-ord-inset">
                <div class="adm-ord-cust-head">
                  <div class="adm-ord-cust-titles">
                    <h3 class="adm-ord-cust-name">${esc(ord.customer?.name || '-')}</h3>
                    ${ord.customer?.company ? `<p class="adm-ord-cust-comp">${esc(ord.customer.company)}</p>` : ''}
                  </div>
                  ${
                    phoneRaw
                      ? `<a href="tel:${esc(phoneRaw)}" class="adm-ord-phone-pill" title="คลิกเพื่อโทรติดต่อลูกค้า">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          <span>${esc(phoneRaw)}</span>
                        </a>`
                      : ''
                  }
                </div>

                <div class="adm-ord-info-list">
                  <div class="adm-ord-info-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span>${esc(ord.customer?.address || 'ยังไม่ระบุที่อยู่จัดส่ง')}</span>
                  </div>
                  ${
                    ord.customer?.note
                      ? `<div class="adm-ord-info-row">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                          <span>${esc(ord.customer.note)}</span>
                        </div>`
                      : ''
                  }
                </div>

                ${
                  ord.carrier || ord.salesOwner
                    ? `<div class="adm-ord-meta-tags">
                        ${ord.carrier ? `<span class="adm-ord-meta-tag">ขนส่ง: <strong>${esc(ord.carrier)}</strong></span>` : ''}
                        ${ord.salesOwner ? `<span class="adm-ord-meta-tag">ผู้ดูแล: <strong>${esc(ord.salesOwner)}</strong></span>` : ''}
                      </div>`
                    : ''
                }

                ${
                  ord.internalNote
                    ? `<div class="adm-ord-team-note">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        <span><strong>บันทึกทีมงาน:</strong> ${esc(ord.internalNote)}</span>
                      </div>`
                    : ''
                }
              </div>

              <!-- Right Column: Parts Table & Clean Financial Footer Frosted Inset -->
              <div class="adm-ord-inset adm-ord-inset--items">
                <div class="adm-ord-items-top">
                  <div class="adm-ord-items-head">
                    <span class="adm-ord-items-title">รายการอะไหล่ที่สั่งซื้อ</span>
                    <span class="adm-ord-items-count">${lineList.length} รายการ · ${totalUnits} ชิ้น</span>
                  </div>
                  <div class="adm-ord-lines">
                    ${linesRowsHTML}
                  </div>
                </div>

                <div class="adm-ord-fin-foot">
                  <div class="adm-ord-fin-sub">
                    ${ord.discountAmount > 0 ? `<span>ส่วนลด <strong>-${fmtTHB(ord.discountAmount)}</strong></span>` : ''}
                    ${ord.shippingFee > 0 ? `<span>ค่าขนส่ง <strong>+${fmtTHB(ord.shippingFee)}</strong></span>` : ''}
                    <span>ก่อน VAT <strong>${fmtTHB(ord.subtotal)}</strong> · VAT 7% <strong>${fmtTHB(ord.vatAmount)}</strong></span>
                  </div>
                  <div class="adm-ord-fin-grand">
                    <span class="adm-ord-fin-grand-lbl">ยอดสุทธิรวม VAT</span>
                    <strong class="adm-ord-fin-grand-val">${fmtTHB(ord.grandTotal)}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tier 3: Clean Action Footer Bar -->
            <div class="adm-ord-card__foot">
              <div class="adm-ord-status-ctrl">
                <label class="adm-ord-status-lbl" for="ordQuickSel-${ordId}">สถานะ:</label>
                <select id="ordQuickSel-${ordId}" class="adm-ord-status-select" data-ord-quick-status="${ordId}">
                  <option value="pending" ${stKey === 'pending' ? 'selected' : ''}>รอตรวจสอบ</option>
                  <option value="confirmed" ${stKey === 'confirmed' ? 'selected' : ''}>ยืนยันออเดอร์</option>
                  <option value="preparing" ${stKey === 'preparing' ? 'selected' : ''}>กำลังจัดเตรียม</option>
                  <option value="shipping" ${stKey === 'shipping' ? 'selected' : ''}>กำลังจัดส่ง</option>
                  <option value="completed" ${stKey === 'completed' ? 'selected' : ''}>จัดส่งสำเร็จ</option>
                  <option value="cancelled" ${stKey === 'cancelled' ? 'selected' : ''}>ยกเลิก</option>
                </select>
              </div>

              <div class="adm-ord-actions">
                <button type="button" class="adm-btn adm-btn--red adm-ord-btn" data-ord-keyin="${ordId}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>เปิดดู / คีย์ข้อมูลออเดอร์</span>
                </button>
                <button type="button" class="adm-btn adm-btn--glass adm-ord-btn" data-ord-print="${ordId}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  <span>พิมพ์ใบจัดของ A4</span>
                </button>
                <button type="button" class="adm-btn adm-btn--danger adm-ord-btn" data-ord-delete="${ordId}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  <span>ลบ</span>
                </button>
              </div>
            </div>
          </article>`;
        })
        .join('');
    };

    container.innerHTML = `
      <div class="adm-ord-shell">
        <section class="adm-ord-command adm-glass adm-glass--strong">
          <!-- Row 1: Header & Primary Actions -->
          <div class="adm-ord-head">
            <div class="adm-ord-head__titles">
              <h2 class="adm-ord-head__title">จัดการคำสั่งซื้ออะไหล่</h2>
              <p class="adm-ord-head__sub">ตรวจสอบรายการสั่งซื้อจากหน้าเว็บ คีย์คำสั่งซื้อใหม่จากโทรศัพท์หรือ LINE บันทึกเลขพัสดุ ใบกำกับภาษี และพิมพ์ใบจัดของ A4</p>
            </div>
            <div class="adm-ord-head__actions">
              <div class="adm-ord-search">
                <svg class="adm-ord-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <input type="search" id="admOrdSearchInput" class="adm-ord-search__input" placeholder="ค้นหา ORD-..., ชื่อลูกค้า, เลขพัสดุ..." value="${esc(state.ordersQuery || '')}" aria-label="ค้นหาคำสั่งซื้ออะไหล่">
              </div>
              <button type="button" class="adm-btn adm-btn--red adm-ord-new-btn" id="admBtnKeyInNewOrder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                <span>คีย์คำสั่งซื้อใหม่เอง</span>
              </button>
            </div>
          </div>

          <!-- Row 2: Compact 4-Column KPI Stat Strip -->
          <div class="adm-ord-kpis">
            <article class="adm-ord-kpi">
              <div class="adm-ord-kpi__meta">
                <span class="adm-ord-kpi__label">คำสั่งซื้อทั้งหมด</span>
                <div class="adm-ord-kpi__val">${orders.length}</div>
              </div>
              <span class="adm-ord-kpi__icon adm-ord-kpi__icon--sapphire" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </span>
            </article>

            <article class="adm-ord-kpi">
              <div class="adm-ord-kpi__meta">
                <span class="adm-ord-kpi__label">รอตรวจสอบ</span>
                <div class="adm-ord-kpi__val adm-ord-kpi__val--crimson">${waitingCount}</div>
              </div>
              <span class="adm-ord-kpi__icon adm-ord-kpi__icon--crimson" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              </span>
            </article>

            <article class="adm-ord-kpi">
              <div class="adm-ord-kpi__meta">
                <span class="adm-ord-kpi__label">กำลังจัดส่ง / สำเร็จ</span>
                <div class="adm-ord-kpi__val adm-ord-kpi__val--emerald">${shippingDoneCount}</div>
              </div>
              <span class="adm-ord-kpi__icon adm-ord-kpi__icon--emerald" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </span>
            </article>

            <article class="adm-ord-kpi">
              <div class="adm-ord-kpi__meta">
                <span class="adm-ord-kpi__label">ยอดขายรวมสุทธิ (฿)</span>
                <div class="adm-ord-kpi__val">${fmtTHB(totalRevenue)}</div>
              </div>
              <span class="adm-ord-kpi__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </span>
            </article>
          </div>

          <!-- Row 3: Sleek Status Filter Bar (Zero Emojis — Glowing CSS Dots) -->
          <div class="adm-ord-filters" role="tablist" aria-label="กรองสถานะคำสั่งซื้อ">
            <button type="button" class="adm-ord-filter-btn ${filter === 'all' ? 'is-active' : ''}" data-ord-filter="all">
              <span>ทั้งหมด</span>
              <span class="adm-ord-filter-count">(${orders.length})</span>
            </button>
            <button type="button" class="adm-ord-filter-btn ${filter === 'pending' ? 'is-active' : ''}" data-ord-filter="pending">
              <span class="adm-ord-dot adm-ord-dot--pending"></span>
              <span>รอตรวจสอบ</span>
              <span class="adm-ord-filter-count">(${countByStatus.pending})</span>
            </button>
            <button type="button" class="adm-ord-filter-btn ${filter === 'confirmed' ? 'is-active' : ''}" data-ord-filter="confirmed">
              <span class="adm-ord-dot adm-ord-dot--confirmed"></span>
              <span>ยืนยันออเดอร์</span>
              <span class="adm-ord-filter-count">(${countByStatus.confirmed})</span>
            </button>
            <button type="button" class="adm-ord-filter-btn ${filter === 'preparing' ? 'is-active' : ''}" data-ord-filter="preparing">
              <span class="adm-ord-dot adm-ord-dot--preparing"></span>
              <span>กำลังจัดเตรียม</span>
              <span class="adm-ord-filter-count">(${countByStatus.preparing})</span>
            </button>
            <button type="button" class="adm-ord-filter-btn ${filter === 'shipping' ? 'is-active' : ''}" data-ord-filter="shipping">
              <span class="adm-ord-dot adm-ord-dot--shipping"></span>
              <span>กำลังจัดส่ง</span>
              <span class="adm-ord-filter-count">(${countByStatus.shipping})</span>
            </button>
            <button type="button" class="adm-ord-filter-btn ${filter === 'completed' ? 'is-active' : ''}" data-ord-filter="completed">
              <span class="adm-ord-dot adm-ord-dot--completed"></span>
              <span>จัดส่งสำเร็จ</span>
              <span class="adm-ord-filter-count">(${countByStatus.completed})</span>
            </button>
            <button type="button" class="adm-ord-filter-btn ${filter === 'cancelled' ? 'is-active' : ''}" data-ord-filter="cancelled">
              <span class="adm-ord-dot adm-ord-dot--cancelled"></span>
              <span>ยกเลิก</span>
              <span class="adm-ord-filter-count">(${countByStatus.cancelled})</span>
            </button>
          </div>
        </section>

        <!-- Bento Order Cards List -->
        <div class="adm-ord-list" id="admOrdCardsList">${buildFilteredCardsHTML(state.ordersQuery)}</div>
      </div>
    `;

    const cardsListEl = container.querySelector('#admOrdCardsList');

    const bindOrderCardActions = (rootEl) => {
      if (!rootEl) return;

      rootEl.querySelectorAll('[data-ord-keyin]').forEach((btn) =>
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-ord-keyin');
          const found = orders.find((x) => (x.id || x.ref) === id);
          if (found) openOrderKeyInModal(found, container);
        })
      );

      rootEl.querySelectorAll('[data-ord-print]').forEach((btn) =>
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-ord-print');
          const found = orders.find((x) => (x.id || x.ref) === id);
          if (found) printOrderPackingSlipA4(found);
        })
      );

      rootEl.querySelectorAll('[data-ord-quick-status]').forEach((sel) =>
        sel.addEventListener('change', async () => {
          const id = sel.getAttribute('data-ord-quick-status');
          const nextStatus = sel.value;
          const found = orders.find((x) => (x.id || x.ref) === id);
          if (found) found.status = nextStatus;
          try {
            await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
              method: 'PUT',
              headers: authHeaders(),
              body: JSON.stringify({ status: nextStatus }),
            });
          } catch (e) {}
          try {
            localStorage.setItem('ptx_cms_override_orders', JSON.stringify({ items: orders }));
          } catch (e) {}
          updateSidebarBadges();
          showToast('อัปเดตสถานะคำสั่งซื้อเรียบร้อยแล้ว');
          renderOrdersModule(container);
        })
      );

      rootEl.querySelectorAll('[data-ord-delete]').forEach((btn) =>
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-ord-delete');
          askConfirm('ลบคำสั่งซื้ออะไหล่นี้?', 'รายการคำสั่งซื้อจะถูกลบออกจากระบบอย่างถาวร', async () => {
            state.data.orders.items = orders.filter((x) => x.id !== id && x.ref !== id);
            try {
              await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers: authHeaders(),
              });
            } catch (e) {}
            try {
              localStorage.setItem('ptx_cms_override_orders', JSON.stringify(state.data.orders));
            } catch (e) {}
            updateSidebarBadges();
            showToast('ลบรายการคำสั่งซื้ออะไหล่เรียบร้อยแล้ว');
            renderOrdersModule(container);
          });
        })
      );
    };

    bindOrderCardActions(cardsListEl);

    container.querySelectorAll('[data-ord-filter]').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.ordersFilter = btn.getAttribute('data-ord-filter');
        renderOrdersModule(container);
      })
    );

    const searchEl = container.querySelector('#admOrdSearchInput');
    searchEl?.addEventListener('input', () => {
      state.ordersQuery = searchEl.value;
      if (cardsListEl) {
        cardsListEl.innerHTML = buildFilteredCardsHTML(state.ordersQuery);
        bindOrderCardActions(cardsListEl);
      }
    });

    container.querySelector('#admBtnKeyInNewOrder')?.addEventListener('click', () => {
      openOrderKeyInModal(null, container);
    });
  }

  /* ============================================================================
   * MODULE 5: PROMOTIONS, CAMPAIGNS, VIDEOS & SOCIAL (`promotions.json`)
   * ============================================================================ */
  const PROMO_BENTO_SLOTS = {
    featured_top_left: {
      key: 'featured_top_left',
      order: 1,
      positionName: 'การ์ดใหญ่ซ้ายบน (Featured Card — 2×2)',
      shortPos: 'ช่องที่ 1 · การ์ดใหญ่ซ้ายบน (Featured 2×2)',
      sizeBadge: 'ขนาดภาพแนะนำ: 1200 × 800 px (อัตราส่วน 3:2)',
      sizeGuide: 'ขนาดภาพแนะนำ: 1200 × 800 px (อัตราส่วน 3:2) · รองรับ PNG/JPG/WEBP ไม่เกิน 5MB',
      recWidth: 1200,
      recHeight: 800,
      aspectRatio: '3 / 2',
      ratioClass: 'adm-bento-ratio--3x2',
    },
    compact_top_right: {
      key: 'compact_top_right',
      order: 2,
      positionName: 'การ์ดขวาบน (Compact Card)',
      shortPos: 'ช่องที่ 2 · การ์ดขวาบน (Compact)',
      sizeBadge: 'ขนาดภาพแนะนำ: 800 × 500 px (อัตราส่วน 16:10)',
      sizeGuide: 'ขนาดภาพแนะนำ: 800 × 500 px (อัตราส่วน 16:10) · รองรับ PNG/JPG/WEBP ไม่เกิน 5MB',
      recWidth: 800,
      recHeight: 500,
      aspectRatio: '16 / 10',
      ratioClass: 'adm-bento-ratio--16x10',
    },
    compact_mid_right: {
      key: 'compact_mid_right',
      order: 3,
      positionName: 'การ์ดขวากลาง (Compact Card)',
      shortPos: 'ช่องที่ 3 · การ์ดขวากลาง (Compact)',
      sizeBadge: 'ขนาดภาพแนะนำ: 800 × 500 px (อัตราส่วน 16:10)',
      sizeGuide: 'ขนาดภาพแนะนำ: 800 × 500 px (อัตราส่วน 16:10) · รองรับ PNG/JPG/WEBP ไม่เกิน 5MB',
      recWidth: 800,
      recHeight: 500,
      aspectRatio: '16 / 10',
      ratioClass: 'adm-bento-ratio--16x10',
    },
    wide_bottom_left: {
      key: 'wide_bottom_left',
      order: 4,
      positionName: 'การ์ดล่างซ้าย (Wide Card)',
      shortPos: 'ช่องที่ 4 · การ์ดล่างซ้าย (Wide)',
      sizeBadge: 'ขนาดภาพแนะนำ: 1200 × 500 px (อัตราส่วน 12:5)',
      sizeGuide: 'ขนาดภาพแนะนำ: 1200 × 500 px (อัตราส่วน 12:5) · รองรับ PNG/JPG/WEBP ไม่เกิน 5MB',
      recWidth: 1200,
      recHeight: 500,
      aspectRatio: '12 / 5',
      ratioClass: 'adm-bento-ratio--12x5',
    },
    wide_bottom_right: {
      key: 'wide_bottom_right',
      order: 5,
      positionName: 'การ์ดล่างขวา (Wide Card)',
      shortPos: 'ช่องที่ 5 · การ์ดล่างขวา (Wide)',
      sizeBadge: 'ขนาดภาพแนะนำ: 1200 × 500 px (อัตราส่วน 12:5)',
      sizeGuide: 'ขนาดภาพแนะนำ: 1200 × 500 px (อัตราส่วน 12:5) · รองรับ PNG/JPG/WEBP ไม่เกิน 5MB',
      recWidth: 1200,
      recHeight: 500,
      aspectRatio: '12 / 5',
      ratioClass: 'adm-bento-ratio--12x5',
    },
  };

  const PROMO_BENTO_SLOT_ORDER = [
    'featured_top_left',
    'compact_top_right',
    'compact_mid_right',
    'wide_bottom_left',
    'wide_bottom_right',
  ];

  function getPromoSlotMeta(item, idx = 0) {
    const fallbackSlot = PROMO_BENTO_SLOT_ORDER[idx] || 'compact_top_right';
    const key = item && item.slot && PROMO_BENTO_SLOTS[item.slot] ? item.slot : fallbackSlot;
    return PROMO_BENTO_SLOTS[key] || PROMO_BENTO_SLOTS.featured_top_left;
  }

  function resolveAdminPreviewImgUrl(src) {
    const clean = String(src || '').trim();
    if (!clean) return '';
    return clean;
  }

  function buildPromoCardVisualPreviewHTML(item, slotMeta) {
    const tone = item.tone || 'crimson';
    const imgSrc = resolveAdminPreviewImgUrl(item.image);
    const hasImage = Boolean(imgSrc);
    const isFeatured = slotMeta.key === 'featured_top_left';

    return `
      <div class="adm-bento-preview-stage ${esc(slotMeta.ratioClass)}" style="aspect-ratio: ${slotMeta.aspectRatio};">
        <div class="adm-bento-mock adm-bento-mock--${esc(tone)} ${hasImage ? 'has-bg-image' : ''} is-image-only ${isFeatured ? 'is-featured' : ''}">
          ${
            hasImage
              ? `<img class="adm-bento-mock__img" src="${esc(imgSrc)}" alt="${esc(item.title || 'Promo Banner')}">`
              : `<div class="adm-bento-mock__svg" aria-hidden="true">
                  <svg viewBox="0 0 360 150" fill="none">
                    <g fill="currentColor" opacity="0.22">
                      <polygon points="18,86 42,86 38,112 22,112"/>
                      <polygon points="46,86 70,86 66,112 50,112"/>
                      <polygon points="74,86 98,86 94,112 78,112"/>
                      <rect x="115" y="72" width="64" height="22" rx="4" transform="rotate(-6 115 72)"/>
                      <rect x="192" y="28" width="52" height="86" rx="3"/>
                      <rect x="256" y="42" width="38" height="72" rx="3"/>
                    </g>
                  </svg>
                </div>`
          }
          <div class="adm-bento-mock__only-foot">
            <span class="adm-bento-mock__go">→</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderPromotionsModule(container) {
    const sub = state.promosSubTab;
    const banners = state.data.promotions.banners || [];
    const campaigns = state.data.promotions.campaigns || [];
    const videos = state.data.promotions.videos || [];
    const social = state.data.promotions.social || [];

    let listHTML = '';
    if (sub === 'banners') {
      listHTML = banners
        .map((b, idx) => {
          const slotMeta = getPromoSlotMeta(b, idx);
          const imgStatusLabel = b.image ? '✓ อัปโหลดรูปภาพแล้ว' : 'ใช้ลายมาตรฐาน';
          const linkLabel = b.link ? b.link : 'ไม่ได้ระบุลิงก์';
          return `
          <article class="adm-item-card adm-bento-admin-card">
            <div class="adm-bento-admin-card__head">
              <span class="adm-bento-slot-pill">${esc(slotMeta.shortPos)}</span>
              <span class="adm-bento-mode-pill ${b.image ? 'is-custom-img' : ''}">${esc(imgStatusLabel)} · รูปภาพล้วน</span>
            </div>
            <div class="adm-bento-admin-card__preview" data-bn-edit="${esc(b.id)}" title="คลิกเพื่อเปลี่ยนรูปภาพหรือตั้งค่า">
              ${buildPromoCardVisualPreviewHTML(b, slotMeta)}
            </div>
            <div class="adm-item-card__body adm-bento-admin-card__body">
              <div class="adm-bento-size-pill">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                <span>${esc(slotMeta.sizeBadge)}</span>
              </div>
              <h3 class="adm-item-card__title" style="margin-top: 6px;">${esc(b.title || 'การ์ดโปรโมชั่น')}</h3>
              <span class="adm-item-card__meta">ลิงก์ปลายทาง: <strong>${esc(linkLabel)}</strong></span>
            </div>
            <div class="adm-item-card__foot adm-bento-admin-card__foot">
              <button type="button" class="adm-btn adm-btn--red adm-btn--sm adm-bento-edit-btn" data-bn-edit="${esc(b.id)}">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>เปลี่ยนรูปภาพ / ตั้งค่า</span>
              </button>
              <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-bn-del="${esc(b.id)}">ลบ</button>
            </div>
          </article>`;
        })
        .join('');
    } else if (sub === 'campaigns') {
      listHTML = campaigns
        .map(
          (c) => `
          <article class="adm-item-card">
            ${c.image ? `<div class="adm-item-card__media"><img src="${esc(c.image)}" alt="${esc(c.title)}"></div>` : ''}
            <div class="adm-item-card__body">
              <span class="adm-item-card__meta">${esc(c.tag)} (${esc(c.type)}) ${c.featured ? '· ★ แคมเปญหลัก' : ''}</span>
              <h3 class="adm-item-card__title">${esc(c.title)}</h3>
              <p class="adm-item-card__desc">${esc(c.excerpt)}</p>
              ${c.dealPrice ? `<strong>${fmtTHB(c.dealPrice)}</strong>` : ''}
            </div>
            <div class="adm-item-card__foot">
              <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-cp-edit="${esc(c.id)}">แก้ไข</button>
              <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-cp-del="${esc(c.id)}">ลบ</button>
            </div>
          </article>`
        )
        .join('');
    } else if (sub === 'videos') {
      listHTML = videos
        .map(
          (v) => `
          <article class="adm-item-card">
            ${v.thumbnail ? `<div class="adm-item-card__media"><img src="${esc(v.thumbnail)}" alt="${esc(v.title)}"></div>` : ''}
            <div class="adm-item-card__body">
              <span class="adm-item-card__meta">${esc(v.platform.toUpperCase())} · ความยาว ${esc(v.duration)}</span>
              <h3 class="adm-item-card__title">${esc(v.title)}</h3>
              <p class="adm-item-card__desc">${esc(v.url || v.embedId || 'คลิปวิดีโอโปรโมท')}</p>
            </div>
            <div class="adm-item-card__foot">
              <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-vd-edit="${esc(v.id)}">แก้ไข</button>
              <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-vd-del="${esc(v.id)}">ลบ</button>
            </div>
          </article>`
        )
        .join('');
    } else {
      listHTML = social
        .map(
          (s, idx) => `
          <article class="adm-item-card">
            <div class="adm-item-card__body">
              <span class="adm-item-card__meta">${esc(s.platform.toUpperCase())}</span>
              <h3 class="adm-item-card__title">${esc(s.label)} — ${esc(s.handle)}</h3>
              <p class="adm-item-card__desc">${esc(s.url)}</p>
            </div>
            <div class="adm-item-card__foot">
              <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-soc-edit="${idx}">แก้ไขลิงก์โซเชียล</button>
            </div>
          </article>`
        )
        .join('');
    }

    const bentoSummaryNote =
      sub === 'banners'
        ? `<div class="adm-bento-overview-bar">
            <div class="adm-bento-overview-bar__info">
              <strong>ผังการ์ดโปรโมชั่น Bento Grid 5 ช่อง (ซิงก์หน้าหลัก index.html และ promotions.html 100%)</strong>
              <span>คลิกปุ่ม <b>"แก้ไขชื่อและรูปภาพ"</b> บนการ์ดแต่ละใบเพื่ออัปโหลดรูปพื้นหลังใหม่ แก้ไขชื่อโปรโมชั่น ข้อความไฮไลต์ และดูตัวอย่างการ์ดจริงพร้อมขนาดภาพแนะนำ</span>
            </div>
          </div>`
        : '';

    container.innerHTML = `
      <section class="adm-panel adm-glass adm-glass--strong">
        <div class="adm-panel__head">
          <div class="adm-panel__title-group">
            <h2>จัดการโปรโมชั่น แคมเปญ วิดีโอ และโซเชียลมีเดีย</h2>
            <p>เชื่อมโยงทั้งส่วนโปรโมชั่นหน้าหลัก (index.html) และหน้าโปรโมชั่น (promotions.html)</p>
          </div>
          <div class="adm-panel__toolbar">
            <div class="adm-subtabs">
              <button type="button" class="adm-subtab ${sub === 'banners' ? 'is-active' : ''}" data-pr-sub="banners">การ์ดโปรโมชั่น Bento 5 ช่อง (${banners.length})</button>
              <button type="button" class="adm-subtab ${sub === 'campaigns' ? 'is-active' : ''}" data-pr-sub="campaigns">แคมเปญ &amp; ดีล (${campaigns.length})</button>
              <button type="button" class="adm-subtab ${sub === 'videos' ? 'is-active' : ''}" data-pr-sub="videos">คลิปวิดีโอ (${videos.length})</button>
              <button type="button" class="adm-subtab ${sub === 'social' ? 'is-active' : ''}" data-pr-sub="social">โซเชียลมีเดีย (${social.length})</button>
            </div>
            ${sub !== 'social' ? `<button type="button" class="adm-btn adm-btn--red" id="admAddPromoBtn">+ เพิ่มรายการใหม่</button>` : ''}
          </div>
        </div>
        ${bentoSummaryNote}
        <div class="adm-cards-grid ${sub === 'banners' ? 'adm-bento-cards-grid' : ''}">${listHTML}</div>
      </section>
    `;

    container.querySelectorAll('[data-pr-sub]').forEach((b) =>
      b.addEventListener('click', () => {
        state.promosSubTab = b.getAttribute('data-pr-sub');
        renderPromotionsModule(container);
      })
    );

    container.querySelector('#admAddPromoBtn')?.addEventListener('click', () => {
      if (sub === 'banners') openBannerEditor(null, banners.length);
      else if (sub === 'campaigns') openCampaignEditor(null);
      else if (sub === 'videos') openVideoEditor(null);
    });

    container.querySelectorAll('[data-bn-edit]').forEach((b) =>
      b.addEventListener('click', () => {
        const targetId = b.getAttribute('data-bn-edit');
        const idx = banners.findIndex((x) => x.id === targetId);
        if (idx !== -1) openBannerEditor(banners[idx], idx);
      })
    );
    container.querySelectorAll('[data-bn-del]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-bn-del');
        askConfirm('ลบแบนเนอร์โปรโมชั่นนี้?', 'แบนเนอร์จะถูกลบออกจากหน้าหลักทันที', async () => {
          state.data.promotions.banners = banners.filter((x) => x.id !== id);
          await saveCollection('promotions', state.data.promotions);
          renderPromotionsModule(container);
        });
      })
    );

    container.querySelectorAll('[data-cp-edit]').forEach((b) =>
      b.addEventListener('click', () => openCampaignEditor(campaigns.find((x) => x.id === b.getAttribute('data-cp-edit'))))
    );
    container.querySelectorAll('[data-cp-del]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-cp-del');
        askConfirm('ลบแคมเปญนี้?', 'แคมเปญจะถูกลบออกจากหน้าโปรโมชั่นทันที', async () => {
          state.data.promotions.campaigns = campaigns.filter((x) => x.id !== id);
          await saveCollection('promotions', state.data.promotions);
          renderPromotionsModule(container);
        });
      })
    );

    container.querySelectorAll('[data-vd-edit]').forEach((b) =>
      b.addEventListener('click', () => openVideoEditor(videos.find((x) => x.id === b.getAttribute('data-vd-edit'))))
    );
    container.querySelectorAll('[data-vd-del]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-vd-del');
        askConfirm('ลบคลิปวิดีโอนี้?', 'คลิปจะถูกลบออกจากหน้าโปรโมชั่นทันที', async () => {
          state.data.promotions.videos = videos.filter((x) => x.id !== id);
          await saveCollection('promotions', state.data.promotions);
          renderPromotionsModule(container);
        });
      })
    );

    container.querySelectorAll('[data-soc-edit]').forEach((b) =>
      b.addEventListener('click', () => {
        const idx = Number(b.getAttribute('data-soc-edit'));
        const item = social[idx];
        if (!item) return;
        const html = `
          <div class="adm-form-grid">
            <div class="adm-field">
              <label for="fSocLabel">ชื่อแพลตฟอร์ม</label>
              <input type="text" id="fSocLabel" class="adm-input" value="${esc(item.label)}">
            </div>
            <div class="adm-field">
              <label for="fSocHandle">ชื่อบัญชี / ไอดีที่แสดง</label>
              <input type="text" id="fSocHandle" class="adm-input" value="${esc(item.handle)}">
            </div>
            <div class="adm-field adm-field--full">
              <label for="fSocUrl">ลิงก์ปลายทาง (URL)</label>
              <input type="url" id="fSocUrl" class="adm-input" value="${esc(item.url)}">
            </div>
            <div class="adm-field adm-field--full">
              <label for="fSocAct">ข้อความบนปุ่ม (เช่น ติดตามเพจ, ทักแชตปรึกษา)</label>
              <input type="text" id="fSocAct" class="adm-input" value="${esc(item.action)}">
            </div>
          </div>
        `;
        openEditorModal(`แก้ไขโซเชียล: ${item.label}`, html, async (bodyEl) => {
          item.label = bodyEl.querySelector('#fSocLabel').value.trim();
          item.handle = bodyEl.querySelector('#fSocHandle').value.trim();
          item.url = bodyEl.querySelector('#fSocUrl').value.trim();
          item.action = bodyEl.querySelector('#fSocAct').value.trim();
          await saveCollection('promotions', state.data.promotions);
          closeEditorModal();
          renderActiveTab();
        });
      })
    );
  }

  function openBannerEditor(existing, slotIdx = 0) {
    const isNew = !existing;
    const defaultSlotKey = PROMO_BENTO_SLOT_ORDER[slotIdx] || 'compact_top_right';
    const item = existing
      ? {
          ...existing,
          slot: existing.slot && PROMO_BENTO_SLOTS[existing.slot] ? existing.slot : defaultSlotKey,
          title: existing.title || '',
          link: existing.link || '',
          image: existing.image || '',
          displayMode: 'image_only',
        }
      : {
          id: `bn-${Date.now().toString(36)}`,
          slot: defaultSlotKey,
          title: '',
          link: 'design-plant.html',
          image: '',
          displayMode: 'image_only',
        };

    const initialSlotMeta = getPromoSlotMeta(item, slotIdx);

    const slotOptionsHTML = PROMO_BENTO_SLOT_ORDER.map((key) => {
      const m = PROMO_BENTO_SLOTS[key];
      return `<option value="${esc(key)}" ${item.slot === key ? 'selected' : ''}>${esc(m.shortPos)} — ${esc(m.recWidth)}×${esc(m.recHeight)} px</option>`;
    }).join('');

    const html = `
      <div class="bento-clean-modal-layout">
        <!-- คอลัมน์ซ้าย (~54%): กล่องฟอร์มขาวสะอาดตา เลื่อนขึ้น-ลงอิสระ -->
        <div class="bento-clean-col-form">
          <div class="bento-clean-card">
            <div class="bento-clean-card__head">
              <div class="bento-clean-card__title-wrap">
                <span class="bento-clean-card__icon bento-clean-card__icon--amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                </span>
                <div>
                  <h3 class="bento-clean-card__title">อัปโหลดรูปภาพการ์ดโปรโมชั่น (Pure Image-Only)</h3>
                  <p class="bento-clean-card__desc">ภาพแบนเนอร์จะแสดงเต็มใบแบบคมชัด 100% ไม่มีตัวหนังสือและแผ่นกรองแสงสีดำมาบดบัง</p>
                </div>
              </div>
            </div>

            <!-- เลือกตำแหน่งการ์ด -->
            <div class="bento-clean-fields-grid" style="margin-bottom: 14px;">
              <div class="bento-clean-field bento-clean-field--full">
                <label for="fBnSlot">ตำแหน่งการ์ดใน Bento Grid</label>
                <select id="fBnSlot" class="bento-clean-select">
                  ${slotOptionsHTML}
                </select>
              </div>
            </div>

            <!-- กล่องอัปโหลดรูปภาพ ล็อกความสูง 168px ขอบไม่ล้นเด็ดขาด -->
            <div class="bento-uploader-frame" id="fBnDropzone">
              <div class="bento-uploader-preview" id="fBnDropPreview">
                ${
                  item.image
                    ? `<img src="${esc(item.image)}" alt="Preview">`
                    : `<div class="bento-uploader-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                        <span>ใช้ลายกราฟิกมาตรฐาน (ยังไม่ได้อัปโหลดรูปภาพ)</span>
                        <small>ลากไฟล์รูปภาพมาวางที่นี่ หรือคลิกปุ่มเปลี่ยนรูปภาพด้านล่าง</small>
                      </div>`
                }
              </div>
            </div>

            <!-- ปุ่มควบคุมรูปภาพในแถวเดียว (เปลี่ยนรูปภาพ / ลบรูป) -->
            <div class="bento-uploader-actions">
              <label class="bento-btn bento-btn--primary">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>เปลี่ยนรูปภาพ</span>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" id="fBnFileInput" hidden>
              </label>
              <button type="button" class="bento-btn bento-btn--danger-outline" id="fBnClearImgBtn">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>ลบรูป (ใช้ลายมาตรฐาน)</span>
              </button>
            </div>

            <!-- แถบข้อมูลสั้น 1 บรรทัด บอกขนาดภาพแนะนำและขนาดจริง (ห้ามโชว์โค้ด base64) -->
            <div class="bento-img-status-bar" id="fBnActualDimBadge" aria-live="polite">
              กำลังตรวจสอบขนาดไฟล์รูปภาพ...
            </div>

            <!-- Hidden input เก็บพาธ/ข้อมูลภาพสำหรับบันทึกหลังบ้าน -->
            <input type="hidden" id="fBnImg" value="${esc(item.image || '')}">

            <div class="bento-clean-fields-grid" style="margin-top: 14px;">
              <div class="bento-clean-field bento-clean-field--full">
                <label for="fBnTitle">ชื่ออ้างอิงโปรโมชั่น (สำหรับ Admin) <span class="bento-req-star">*</span></label>
                <input type="text" id="fBnTitle" class="bento-clean-input" value="${esc(item.title)}" placeholder="เช่น การ์ดซ้ายบน: แคมเปญ PTX-160 ส่งท้ายปี" required>
                <small style="display:block; margin-top:5px; color:#64748B; font-size:12px;">ℹ️ ใช้สำหรับเรียกชื่อและค้นหาในหน้า Admin เท่านั้น ไม่นำไปแสดงทับบนรูปภาพหน้าเว็บ</small>
              </div>

              <div class="bento-clean-field bento-clean-field--full">
                <label for="fBnLink">ลิงก์ปลายทางเมื่อคลิกการ์ด (Destination URL)</label>
                <input type="text" id="fBnLink" class="bento-clean-input" value="${esc(item.link || '')}" placeholder="เช่น design-plant.html, spare-parts.html หรือ promotions.html (เว้นว่างได้)">
                <div class="bento-url-shortcuts">
                  <span class="bento-url-shortcuts__label">ทางลัดหน้าเว็บยอดนิยม:</span>
                  <button type="button" class="bento-url-chip" data-fill-url="design-plant.html">design-plant.html</button>
                  <button type="button" class="bento-url-chip" data-fill-url="spare-parts.html">spare-parts.html</button>
                  <button type="button" class="bento-url-chip" data-fill-url="promotions.html">promotions.html</button>
                  <button type="button" class="bento-url-chip" data-fill-url="service-plants.html">service-plants.html</button>
                </div>
                <small style="display:block; margin-top:5px; color:#64748B; font-size:12px;">เมื่อลูกค้าคลิกที่การ์ดโปรโมชั่น จะเปิดไปยังหน้าเว็บนี้ทันที</small>
              </div>
            </div>
          </div>
        </div>

        <!-- คอลัมน์ขวา (~46%): ยึดติดนิ่งกับที่สำหรับดูตัวอย่างสด (Live Card Preview) -->
        <aside class="bento-clean-col-preview">
          <div class="bento-preview-card">
            <div class="bento-preview-card__head">
              <div>
                <span class="bento-preview-card__eyebrow">LIVE CARD PREVIEW</span>
                <h4 class="bento-preview-card__title">ตัวอย่างการ์ดจริงบนหน้าเว็บ</h4>
              </div>
              <span class="bento-preview-card__ratio" id="fBnLiveRatioBadge">อัตราส่วน ${esc(initialSlotMeta.aspectRatio.replace(/\s+/g, ''))}</span>
            </div>

            <div id="fBnLiveCardMount" class="bento-preview-stage-wrap">
              ${buildPromoCardVisualPreviewHTML(item, initialSlotMeta)}
            </div>

            <div class="bento-preview-notes">
              <p>• <strong>แสดงเฉพาะรูปภาพล้วน 100%</strong>: ปราศจากตัวหนังสือและแผ่นกรองแสงสีดำทึบ</p>
              <p>• ภาพที่อัปโหลดจะถูกจัดกึ่งกลางพอดีกรอบ (<code>object-fit: cover</code>) สวยงาม คมชัด ไม่บี้ ไม่เบี้ยว</p>
              <p>• แสดงปุ่มลูกศรแก้วมุมขวาล่างเพื่อให้ผู้เยี่ยมชมทราบว่าสามารถคลิกไปยังลิงก์ปลายทางได้</p>
            </div>
          </div>
        </aside>
      </div>
    `;

    openEditorModal(
      isNew ? 'เพิ่มการ์ดโปรโมชั่น Bento Grid' : `แก้ไขการ์ดโปรโมชั่น: ${item.title || initialSlotMeta.shortPos}`,
      html,
      async (bodyEl) => {
        item.slot = bodyEl.querySelector('#fBnSlot').value.trim() || defaultSlotKey;
        item.title = bodyEl.querySelector('#fBnTitle').value.trim() || 'โปรโมชั่นพิเศษ';
        item.link = bodyEl.querySelector('#fBnLink').value.trim() || 'promotions.html';
        item.image = bodyEl.querySelector('#fBnImg').value.trim();
        item.displayMode = 'image_only';

        if (isNew) state.data.promotions.banners.push(item);
        else {
          const idx = state.data.promotions.banners.findIndex((x) => x.id === item.id);
          if (idx !== -1) state.data.promotions.banners[idx] = item;
        }
        await saveCollection('promotions', state.data.promotions);
        closeEditorModal();
        renderActiveTab();
      },
      (bodyEl) => {
        const modalDialog = document.querySelector('#admEditorModal .adm-modal__dialog');
        if (modalDialog) modalDialog.classList.add('adm-modal__dialog--wide');
        const saveBtn = document.getElementById('admEditorSaveBtn');
        if (saveBtn) saveBtn.textContent = 'บันทึกรูปภาพโปรโมชั่น';

        const slotEl = bodyEl.querySelector('#fBnSlot');
        const titleEl = bodyEl.querySelector('#fBnTitle');
        const linkEl = bodyEl.querySelector('#fBnLink');
        const imgInput = bodyEl.querySelector('#fBnImg');
        const fileInput = bodyEl.querySelector('#fBnFileInput');
        const clearBtn = bodyEl.querySelector('#fBnClearImgBtn');
        const dropzone = bodyEl.querySelector('#fBnDropzone');
        const dropPreview = bodyEl.querySelector('#fBnDropPreview');
        const dimBadge = bodyEl.querySelector('#fBnActualDimBadge');
        const liveRatioEl = bodyEl.querySelector('#fBnLiveRatioBadge');
        const liveMount = bodyEl.querySelector('#fBnLiveCardMount');

        let friendlyFileName = '';
        if (item.image) {
          if (!item.image.startsWith('data:image/')) {
            friendlyFileName = item.image.split('/').pop() || '';
          } else {
            friendlyFileName = 'รูปภาพที่เลือกไว้';
          }
        }

        function getDraftItem() {
          return {
            ...item,
            slot: slotEl.value || defaultSlotKey,
            title: titleEl.value.trim() || 'โปรโมชั่นพิเศษ',
            link: linkEl.value.trim() || 'promotions.html',
            image: imgInput.value.trim(),
            displayMode: 'image_only',
          };
        }

        function measureImageDimensions(srcUrl, slotMeta, userLabel = '') {
          const clean = String(srcUrl || '').trim();
          if (!clean) {
            dimBadge.className = 'bento-img-status-bar';
            dimBadge.innerHTML = `<span>สถานะรูปภาพ: <strong>ใช้ลายกราฟิกมาตรฐาน</strong></span> · <span>ขนาดแนะนำ: <strong>${slotMeta.recWidth} × ${slotMeta.recHeight} px (${slotMeta.aspectRatio.replace(/\\s+/g, '')})</strong></span>`;
            return;
          }

          let displayName = userLabel || friendlyFileName;
          if (!displayName) {
            if (clean.startsWith('data:image/')) displayName = 'รูปภาพที่เลือกไว้';
            else displayName = clean.split('/').pop() || 'ไฟล์รูปภาพ';
          }

          dimBadge.className = 'bento-img-status-bar';
          dimBadge.textContent = 'กำลังวัดขนาดพิกเซลจริงของรูปภาพ...';

          const probe = new Image();
          probe.onload = () => {
            const w = probe.naturalWidth || 0;
            const h = probe.naturalHeight || 0;
            if (w < 600) {
              dimBadge.className = 'bento-img-status-bar is-warn';
              dimBadge.innerHTML = `<span>สถานะรูปภาพ: ⚠️ <strong>${esc(displayName)} (${w} × ${h} px)</strong></span> · <span>คำเตือน: ความกว้างน้อยกว่า 600 px (แนะนำ ${slotMeta.recWidth} × ${slotMeta.recHeight} px)</span>`;
            } else {
              dimBadge.className = 'bento-img-status-bar is-ok';
              dimBadge.innerHTML = `<span>สถานะรูปภาพ: ✓ <strong>${esc(displayName)} (${w} × ${h} px)</strong></span> · <span>แนะนำ ${slotMeta.recWidth} × ${slotMeta.recHeight} px (${slotMeta.aspectRatio.replace(/\\s+/g, '')})</span>`;
            }
          };
          probe.onerror = () => {
            dimBadge.className = 'bento-img-status-bar is-warn';
            dimBadge.innerHTML = `<span>สถานะรูปภาพ: ⚠️ ไม่สามารถโหลดตัวอย่างภาพจากที่ระบุได้ กรุณาอัปโหลดไฟล์ใหม่</span>`;
          };
          probe.src = clean;
        }

        function syncLivePreview(recheckImage = false, customLabel = '') {
          const draft = getDraftItem();
          const meta = getPromoSlotMeta(draft, slotIdx);

          if (liveRatioEl) liveRatioEl.textContent = `อัตราส่วน ${meta.aspectRatio.replace(/\\s+/g, '')} (${meta.recWidth}×${meta.recHeight} px)`;
          if (liveMount) liveMount.innerHTML = buildPromoCardVisualPreviewHTML(draft, meta);

          if (dropPreview) {
            dropPreview.innerHTML = draft.image
              ? `<img src="${esc(draft.image)}" alt="Preview">`
              : `<div class="bento-uploader-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  <span>ใช้ลายกราฟิกมาตรฐาน (ยังไม่ได้อัปโหลดรูปภาพ)</span>
                  <small>ลากไฟล์รูปภาพมาวางที่นี่ หรือคลิกปุ่มเปลี่ยนรูปภาพด้านล่าง</small>
                </div>`;
          }

          if (recheckImage) {
            measureImageDimensions(draft.image, meta, customLabel);
          }
        }

        async function handleUploadFile(file) {
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) {
            showToast('ไฟล์ภาพมีขนาดเกิน 5MB กรุณาเลือกไฟล์ขนาดไม่เกิน 5MB', true);
            return;
          }
          try {
            dimBadge.className = 'bento-img-status-bar';
            dimBadge.textContent = 'กำลังอัปโหลดไฟล์ภาพ...';
            friendlyFileName = file.name;
            const uploadedUrl = await uploadImageFile(file);
            imgInput.value = uploadedUrl;
            syncLivePreview(true, file.name);
          } catch (err) {
            showToast(err.message || 'อัปโหลดรูปภาพไม่สำเร็จ', true);
          }
        }

        [titleEl, linkEl].forEach((el) => {
          el?.addEventListener('input', () => syncLivePreview(false));
        });
        slotEl?.addEventListener('change', () => syncLivePreview(true));

        fileInput?.addEventListener('change', () => {
          const f = fileInput.files?.[0];
          if (f) handleUploadFile(f);
        });

        clearBtn?.addEventListener('click', () => {
          imgInput.value = '';
          friendlyFileName = '';
          if (fileInput) fileInput.value = '';
          syncLivePreview(true);
          showToast('รีเซ็ตเป็นลายกราฟิกมาตรฐานแล้ว');
        });

        if (dropzone) {
          dropzone.addEventListener('click', (e) => {
            if (e.target.closest('button') || e.target.closest('label') || e.target.closest('input')) return;
            fileInput?.click();
          });
          ['dragenter', 'dragover'].forEach((evName) =>
            dropzone.addEventListener(evName, (e) => {
              e.preventDefault();
              dropzone.classList.add('is-dragover');
            })
          );
          ['dragleave', 'drop'].forEach((evName) =>
            dropzone.addEventListener(evName, (e) => {
              e.preventDefault();
              dropzone.classList.remove('is-dragover');
            })
          );
          dropzone.addEventListener('drop', (e) => {
            const f = e.dataTransfer?.files?.[0];
            if (f) handleUploadFile(f);
          });
        }

        bodyEl.querySelectorAll('.bento-url-chip').forEach((chip) => {
          chip.addEventListener('click', () => {
            const url = chip.getAttribute('data-fill-url');
            if (url && linkEl) {
              linkEl.value = url;
              linkEl.dispatchEvent(new Event('input', { bubbles: true }));
              showToast(`เลือกปลายทาง: ${url}`);
            }
          });
        });

        syncLivePreview(true);
      }
    );
  }

  function openCampaignEditor(existing) {
    const isNew = !existing;
    const item = existing
      ? { ...existing }
      : { id: `cp-${Date.now().toString(36)}`, type: 'campaign', featured: false, tag: 'แคมเปญพิเศษ', title: '', excerpt: '', date: new Date().toISOString().slice(0, 10), readTime: '4 นาที', price: 0, dealPrice: 0, image: '', tone: 'crimson', link: 'design-plant.html' };

    const html = `
      <div class="adm-form-grid">
        ${buildSectionHeader('crimson', 'รายละเอียดแคมเปญ & บทความ (Campaign Details)', 'กำหนดรูปแบบ หัวข้อ และคำโปรยของแคมเปญ', 'CAMPAIGN')}
        <div class="adm-field adm-field--violet">
          <label for="fCpType">รูปแบบรายการ</label>
          <select id="fCpType" class="adm-select">
            <option value="campaign" ${item.type === 'campaign' ? 'selected' : ''}>แคมเปญหลัก (Campaign)</option>
            <option value="article" ${item.type === 'article' ? 'selected' : ''}>บทความวิศวกรรม (Article)</option>
            <option value="deal" ${item.type === 'deal' ? 'selected' : ''}>ดีลลดราคาพิเศษ (Special Deal)</option>
          </select>
        </div>
        <div class="adm-field adm-field--violet">
          <label for="fCpTag">ป้ายหมวดหมู่ (Tag)</label>
          <input type="text" id="fCpTag" class="adm-input" value="${esc(item.tag)}">
        </div>
        <div class="adm-field adm-field--full">
          <label for="fCpTitle">หัวข้อแคมเปญ / ดีล *</label>
          <input type="text" id="fCpTitle" class="adm-input" value="${esc(item.title)}" required>
        </div>
        <div class="adm-field adm-field--full">
          <label for="fCpExcerpt">รายละเอียด</label>
          <textarea id="fCpExcerpt" class="adm-textarea">${esc(item.excerpt)}</textarea>
        </div>
        ${buildSectionHeader('sapphire', 'ราคาข้อเสนอ & ลิงก์ปลายทาง (Deal Pricing & Link)', 'กำหนดราคาโปรโมชั่นและตั้งเป็นแคมเปญเด่น', 'PRICING')}
        <div class="adm-field adm-field--sapphire">
          <label for="fCpPrice">ราคาปกติ (เฉพาะดีลลดราคา)</label>
          <input type="number" id="fCpPrice" class="adm-input" value="${Number(item.price || 0)}">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fCpDealPrice">ราคาโปรโมชั่น (เฉพาะดีลลดราคา)</label>
          <input type="number" id="fCpDealPrice" class="adm-input" value="${Number(item.dealPrice || 0)}">
        </div>
        <div class="adm-field adm-field--emerald">
          <label for="fCpLink">ลิงก์ปลายทาง</label>
          <input type="text" id="fCpLink" class="adm-input" value="${esc(item.link || 'design-plant.html')}">
        </div>
        <div class="adm-field" style="justify-content:center;">
          <label class="ios-switch" style="margin-top:18px;">
            <input type="checkbox" id="fCpFeatured" ${item.featured ? 'checked' : ''}>
            <span class="ios-switch__track"><span class="ios-switch__thumb"></span></span>
            <span style="font-weight:700;font-size:0.84rem;">ตั้งเป็นแคมเปญเด่น (Featured)</span>
          </label>
        </div>
        ${buildSectionHeader('amber', 'รูปภาพประกอบแคมเปญ (Campaign Visual)', 'อัปโหลดภาพปกแคมเปญหรือบทความ', 'VISUAL')}
        ${buildImageUploaderField('fCpImg', 'รูปภาพประกอบแคมเปญ', item.image)}
      </div>
    `;

    openEditorModal(isNew ? 'เพิ่มแคมเปญ / ดีลใหม่' : `แก้ไขแคมเปญ: ${item.title}`, html, async (bodyEl) => {
      item.type = bodyEl.querySelector('#fCpType').value;
      item.tag = bodyEl.querySelector('#fCpTag').value.trim();
      item.title = bodyEl.querySelector('#fCpTitle').value.trim() || 'แคมเปญใหม่';
      item.excerpt = bodyEl.querySelector('#fCpExcerpt').value.trim();
      item.price = Number(bodyEl.querySelector('#fCpPrice').value) || 0;
      item.dealPrice = Number(bodyEl.querySelector('#fCpDealPrice').value) || 0;
      item.link = bodyEl.querySelector('#fCpLink').value.trim();
      item.featured = bodyEl.querySelector('#fCpFeatured').checked;
      item.image = bodyEl.querySelector('#fCpImg').value.trim();

      if (item.featured) {
        state.data.promotions.campaigns.forEach((c) => {
          c.featured = false;
        });
      }

      if (isNew) state.data.promotions.campaigns.unshift(item);
      else {
        const idx = state.data.promotions.campaigns.findIndex((x) => x.id === item.id);
        if (idx !== -1) state.data.promotions.campaigns[idx] = item;
      }
      await saveCollection('promotions', state.data.promotions);
      closeEditorModal();
      renderActiveTab();
    });
  }

  function openVideoEditor(existing) {
    const isNew = !existing;
    const item = existing
      ? { ...existing }
      : { id: `v-${Date.now().toString(36)}`, platform: 'youtube', title: '', duration: '2:30', embedId: '', url: '', thumbnail: '', tone: 'crimson' };

    const html = `
      <div class="adm-form-grid">
        ${buildSectionHeader('crimson', 'ข้อมูลคลิปวิดีโอโปรโมท (Video Information)', 'ตั้งค่าแพลตฟอร์ม ชื่อคลิป และรหัสวิดีโอ', 'VIDEO')}
        <div class="adm-field adm-field--violet">
          <label for="fVdPlat">แพลตฟอร์มวิดีโอ</label>
          <select id="fVdPlat" class="adm-select">
            <option value="youtube" ${item.platform === 'youtube' ? 'selected' : ''}>YouTube</option>
            <option value="tiktok" ${item.platform === 'tiktok' ? 'selected' : ''}>TikTok</option>
            <option value="reels" ${item.platform === 'reels' ? 'selected' : ''}>Instagram Reels</option>
            <option value="mp4" ${item.platform === 'mp4' ? 'selected' : ''}>ไฟล์วิดีโอ MP4</option>
          </select>
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fVdDur">ความยาวคลิป (เช่น 3:42)</label>
          <input type="text" id="fVdDur" class="adm-input" value="${esc(item.duration)}">
        </div>
        <div class="adm-field adm-field--full">
          <label for="fVdTitle">ชื่อคลิปวิดีโอ *</label>
          <input type="text" id="fVdTitle" class="adm-input" value="${esc(item.title)}" required>
        </div>
        <div class="adm-field adm-field--emerald">
          <label for="fVdEmbed">รหัส Embed ID (YouTube / TikTok ID)</label>
          <input type="text" id="fVdEmbed" class="adm-input" value="${esc(item.embedId)}">
        </div>
        <div class="adm-field adm-field--emerald">
          <label for="fVdUrl">หรือลิงก์ไฟล์ MP4</label>
          <input type="text" id="fVdUrl" class="adm-input" value="${esc(item.url)}">
        </div>
        ${buildSectionHeader('amber', 'ภาพปกคลิปวิดีโอ (Video Thumbnail)', 'อัปโหลดภาพปกคลิปความคมชัดสูง', 'THUMBNAIL')}
        ${buildImageUploaderField('fVdThumb', 'ภาพปกคลิปวิดีโอ (Thumbnail)', item.thumbnail)}
      </div>
    `;

    openEditorModal(isNew ? 'เพิ่มคลิปวิดีโอโปรโมท' : `แก้ไขคลิปวิดีโอ: ${item.title}`, html, async (bodyEl) => {
      item.platform = bodyEl.querySelector('#fVdPlat').value;
      item.duration = bodyEl.querySelector('#fVdDur').value.trim();
      item.title = bodyEl.querySelector('#fVdTitle').value.trim() || 'วิดีโอ PROTEX GROUP';
      item.embedId = bodyEl.querySelector('#fVdEmbed').value.trim();
      item.url = bodyEl.querySelector('#fVdUrl').value.trim();
      item.thumbnail = bodyEl.querySelector('#fVdThumb').value.trim();

      if (isNew) state.data.promotions.videos.push(item);
      else {
        const idx = state.data.promotions.videos.findIndex((x) => x.id === item.id);
        if (idx !== -1) state.data.promotions.videos[idx] = item;
      }
      await saveCollection('promotions', state.data.promotions);
      closeEditorModal();
      renderActiveTab();
    });
  }

  /* ============================================================================
   * MODULE 5: CLIENT INSTALLATIONS (`locations.json`) + AUTO-GEOCODE LAT/LNG
   * ============================================================================ */
  const THAI_PROVINCE_COORDS = {
    ชุมพร: [10.493, 99.18],
    อุทัยธานี: [15.3835, 100.0245],
    กำแพงเพชร: [16.4827, 99.5226],
    สุรินทร์: [14.8829, 103.4937],
    กรุงเทพ: [13.7563, 100.5018],
    สมุทรปราการ: [13.5991, 100.6968],
    ชลบุรี: [13.3611, 100.9847],
    ระยอง: [12.6814, 101.2816],
    สระบุรี: [14.5289, 100.9101],
    นครราชสีมา: [14.9799, 102.0978],
    ขอนแก่น: [16.4419, 102.836],
    อุดรธานี: [17.4138, 102.7872],
    อุบลราชธานี: [15.2287, 104.8564],
    เชียงใหม่: [18.7883, 98.9853],
    เชียงราย: [19.9105, 99.8406],
    ลำปาง: [18.2888, 99.4909],
    พิษณุโลก: [16.8211, 100.2659],
    นครสวรรค์: [15.703, 100.1371],
    กาญจนบุรี: [14.0228, 99.5328],
    ราชบุรี: [13.5283, 99.8134],
    ประจวบคีรีขันธ์: [11.8124, 99.7973],
    สุราษฎร์ธานี: [9.1382, 99.3217],
    นครศรีธรรมราช: [8.4304, 99.9631],
    สงขลา: [7.1756, 100.6143],
    ภูเก็ต: [7.8804, 98.3923],
  };

  function renderInstallationsModule(container) {
    const installs = state.data.locations.installations || [];

    container.innerHTML = `
      <section class="adm-panel adm-glass adm-glass--strong">
        <div class="adm-panel__head">
          <div class="adm-panel__title-group">
            <h2>จัดการผลงานติดตั้งจริง &amp; พิกัดหมุดแผนที่ (service-plants.html)</h2>
            <p>เพิ่ม แก้ไข หรือลบผลงานติดตั้งของลูกค้า พร้อมระบบค้นหาพิกัด Lat / Lng อัตโนมัติสำหรับปักหมุดบนแผนที่ OpenStreetMap</p>
          </div>
          <div class="adm-panel__toolbar">
            <button type="button" class="adm-btn adm-btn--red" id="admAddInstallBtn">+ เพิ่มผลงานติดตั้งใหม่</button>
          </div>
        </div>

        <div class="adm-cards-grid">
          ${installs
            .map(
              (inst) => `
            <article class="adm-item-card">
              <div class="adm-item-card__media">
                ${inst.image ? `<img src="${esc(inst.image)}" alt="${esc(inst.company)}">` : ''}
                <span class="adm-item-card__badge">${esc(inst.model)}</span>
              </div>
              <div class="adm-item-card__body">
                <span class="adm-item-card__meta">${esc(inst.province)} · ${esc(inst.regionLabel || inst.region)}</span>
                <h3 class="adm-item-card__title">${esc(inst.company)}</h3>
                <p class="adm-item-card__desc">${esc(inst.address || '')}</p>
                <small style="color:#64748B;">พิกัด GPS: ${Number(inst.lat).toFixed(4)}, ${Number(inst.lng).toFixed(4)}</small>
              </div>
              <div class="adm-item-card__foot">
                <a href="${esc(inst.googleMapsUrl)}" target="_blank" rel="noopener noreferrer" class="adm-btn adm-btn--glass adm-btn--sm">ดู Google Maps ↗</a>
                <div style="display:flex;gap:6px;">
                  <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-inst-edit="${esc(inst.id)}">แก้ไข</button>
                  <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-inst-del="${esc(inst.id)}">ลบ</button>
                </div>
              </div>
            </article>`
            )
            .join('')}
        </div>
      </section>
    `;

    container.querySelector('#admAddInstallBtn')?.addEventListener('click', () => openInstallationEditor(null));

    container.querySelectorAll('[data-inst-edit]').forEach((b) =>
      b.addEventListener('click', () => {
        const found = installs.find((x) => x.id === b.getAttribute('data-inst-edit'));
        if (found) openInstallationEditor(found);
      })
    );

    container.querySelectorAll('[data-inst-del]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-inst-del');
        const found = installs.find((x) => x.id === id);
        if (!found) return;
        askConfirm(`ลบผลงานติดตั้ง "${found.company}"?`, 'การ์ดผลงานและหมุดบนแผนที่จะถูกนำออกทันที', async () => {
          state.data.locations.installations = installs.filter((x) => x.id !== id);
          await saveCollection('locations', state.data.locations);
          renderInstallationsModule(container);
        });
      })
    );
  }

  function openInstallationEditor(existing) {
    const isNew = !existing;
    const item = existing
      ? { ...existing }
      : {
          id: `inst-${Date.now().toString(36)}`,
          company: '',
          model: 'PT-2010RAP',
          province: 'จ.',
          region: 'central',
          regionLabel: 'ภาคกลาง',
          address: '',
          lat: 13.7563,
          lng: 100.5018,
          image: 'assets/images/install-chumphon.jpg',
          googleMapsUrl: '',
          statusLabel: 'ติดตั้งแล้วเสร็จ · ส่งมอบงานเรียบร้อย',
        };

    const REGION_MAP = {
      central: 'ภาคกลาง',
      north: 'ภาคเหนือ',
      northeast: 'ภาคตะวันออกเฉียงเหนือ',
      south: 'ภาคใต้',
      east: 'ภาคตะวันออก',
    };

    const html = `
      <div class="adm-form-grid">
        ${buildSectionHeader('crimson', 'ข้อมูลลูกค้า & โครงการ (Client Profile)', 'ชื่อบริษัทลูกค้าและรุ่นแพล้นท์ที่ส่งมอบ', 'CLIENT')}
        <div class="adm-field">
          <label for="fInstComp">ชื่อบริษัทลูกค้า *</label>
          <input type="text" id="fInstComp" class="adm-input" value="${esc(item.company)}" placeholder="เช่น บจก.มรกตชุมพรก่อสร้าง" required>
        </div>
        <div class="adm-field">
          <label for="fInstModel">รุ่นแพล้นท์ที่ติดตั้ง *</label>
          <input type="text" id="fInstModel" class="adm-input" value="${esc(item.model)}" placeholder="เช่น PT-2010RAP, PT-2000, PT-1500">
        </div>
        ${buildSectionHeader('sapphire', 'ที่ตั้ง & พิกัดแผนที่ดาวเทียม (GPS & OpenStreetMap)', 'ระบุจังหวัดและกดปุ่มค้นหาพิกัด Lat / Lng อัตโนมัติ', 'GEO LOCATION')}
        <div class="adm-field adm-field--sapphire">
          <label for="fInstProv">จังหวัด *</label>
          <input type="text" id="fInstProv" class="adm-input" value="${esc(item.province)}" placeholder="เช่น จ.ชุมพร">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fInstReg">ภูมิภาค</label>
          <select id="fInstReg" class="adm-select">
            <option value="central" ${item.region === 'central' ? 'selected' : ''}>ภาคกลาง</option>
            <option value="north" ${item.region === 'north' ? 'selected' : ''}>ภาคเหนือ</option>
            <option value="northeast" ${item.region === 'northeast' ? 'selected' : ''}>ภาคตะวันออกเฉียงเหนือ</option>
            <option value="east" ${item.region === 'east' ? 'selected' : ''}>ภาคตะวันออก</option>
            <option value="south" ${item.region === 'south' ? 'selected' : ''}>ภาคใต้</option>
          </select>
        </div>
        <div class="adm-field adm-field--full adm-field--sapphire">
          <label for="fInstAddr">ที่ตั้ง / อำเภอ / จังหวัด</label>
          <input type="text" id="fInstAddr" class="adm-input" value="${esc(item.address)}" placeholder="เช่น ตำบลวังใหม่ อำเภอเมืองชุมพร จังหวัดชุมพร">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fInstLat">พิกัด Latitude (ละติจูด)</label>
          <input type="number" step="0.0001" id="fInstLat" class="adm-input" value="${Number(item.lat || 13.7563)}">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fInstLng">พิกัด Longitude (ลองจิจูด)</label>
          <input type="number" step="0.0001" id="fInstLng" class="adm-input" value="${Number(item.lng || 100.5018)}">
        </div>
        <div class="adm-field adm-field--full">
          <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" id="fInstAutoCoordBtn" style="align-self:flex-start;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <span>ค้นหาพิกัด Lat / Lng และสร้างลิงก์ Google Maps อัตโนมัติจากชื่อจังหวัด/สถานที่</span>
          </button>
        </div>
        <div class="adm-field adm-field--full adm-field--emerald">
          <label for="fInstGmap">ลิงก์นำทาง Google Maps</label>
          <input type="url" id="fInstGmap" class="adm-input" value="${esc(item.googleMapsUrl)}" placeholder="https://www.google.com/maps/search/?api=1&query=...">
        </div>
        ${buildSectionHeader('amber', 'รูปถ่ายผลงานติดตั้งจริง (Site Installation Photo)', 'แสดงบนการ์ดผลงานติดตั้งและใน Popup บนแผนที่', 'PHOTO')}
        ${buildImageUploaderField('fInstImg', 'รูปถ่ายผลงานติดตั้งจริง (ลากวางไฟล์ภาพหรือใส่ URL)', item.image)}
      </div>
    `;

    openEditorModal(
      isNew ? 'เพิ่มผลงานติดตั้งลูกค้าใหม่' : `แก้ไขผลงานติดตั้ง: ${item.company}`,
      html,
      async (bodyEl) => {
        item.company = bodyEl.querySelector('#fInstComp').value.trim() || 'ลูกค้า PROTEX GROUP';
        item.model = bodyEl.querySelector('#fInstModel').value.trim() || 'PT-2010RAP';
        item.province = bodyEl.querySelector('#fInstProv').value.trim() || 'จ.สมุทรปราการ';
        item.region = bodyEl.querySelector('#fInstReg').value;
        item.regionLabel = REGION_MAP[item.region] || 'ภาคกลาง';
        item.address = bodyEl.querySelector('#fInstAddr').value.trim() || item.province;
        item.lat = Number(bodyEl.querySelector('#fInstLat').value) || 13.7563;
        item.lng = Number(bodyEl.querySelector('#fInstLng').value) || 100.5018;
        item.googleMapsUrl =
          bodyEl.querySelector('#fInstGmap').value.trim() ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.company} ${item.province}`)}`;
        item.image = bodyEl.querySelector('#fInstImg').value.trim() || 'assets/images/install-chumphon.jpg';

        if (isNew) state.data.locations.installations.push(item);
        else {
          const idx = state.data.locations.installations.findIndex((x) => x.id === item.id);
          if (idx !== -1) state.data.locations.installations[idx] = item;
        }
        await saveCollection('locations', state.data.locations);
        closeEditorModal();
        renderActiveTab();
      },
      (bodyEl) => {
        const autoBtn = bodyEl.querySelector('#fInstAutoCoordBtn');
        autoBtn?.addEventListener('click', async () => {
          const comp = bodyEl.querySelector('#fInstComp').value.trim();
          const prov = bodyEl.querySelector('#fInstProv').value.trim().replace(/^จ\./, '').trim();
          const addr = bodyEl.querySelector('#fInstAddr').value.trim();
          const gmapInput = bodyEl.querySelector('#fInstGmap');
          const latInput = bodyEl.querySelector('#fInstLat');
          const lngInput = bodyEl.querySelector('#fInstLng');

          if (comp || prov) {
            gmapInput.value = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${comp} จ.${prov}`.trim())}`;
          }

          // 1. Check built-in Thai province coordinates table first
          for (const [k, coords] of Object.entries(THAI_PROVINCE_COORDS)) {
            if (prov.includes(k) || addr.includes(k)) {
              latInput.value = coords[0];
              lngInput.value = coords[1];
              showToast(`ดึงพิกัดจังหวัด${k} (${coords[0]}, ${coords[1]}) เรียบร้อยแล้ว`);
              return;
            }
          }

          // 2. Try OpenStreetMap Nominatim Geocoding API
          const q = `${addr || prov} Thailand`.trim();
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
            const list = await res.json();
            if (Array.isArray(list) && list[0]) {
              latInput.value = Number(list[0].lat).toFixed(4);
              lngInput.value = Number(list[0].lon).toFixed(4);
              showToast(`ค้นพบพิกัด (${latInput.value}, ${lngInput.value}) สำเร็จ`);
              return;
            }
          } catch (e) {}
          showToast('สร้างลิงก์ Google Maps เรียบร้อยแล้ว');
        });
      }
    );
  }

  /* ============================================================================
   * MODULE 6: PLANT CONFIGURATOR ADD-ONS & COLORS (`accessories.json`)
   * ============================================================================ */
  function renderAccessoriesModule(container) {
    const items = state.data.accessories.items || [];
    const colors = state.data.accessories.structureColors || [];
    const sub = state.accSubTab;

    container.innerHTML = `
      <section class="adm-panel adm-glass adm-glass--strong">
        <div class="adm-panel__head">
          <div class="adm-panel__title-group">
            <h2>จัดการอุปกรณ์เสริมและสีโครงสร้างหน้าออกแบบแพล้นท์ (design-plant.html)</h2>
            <p>รายการอุปกรณ์เสริมและราคาที่แก้ไขที่นี่จะไปแสดงในระบบคำนวณใบเสนอราคาอัตโนมัติทันที</p>
          </div>
          <div class="adm-panel__toolbar">
            <div class="adm-subtabs">
              <button type="button" class="adm-subtab ${sub === 'items' ? 'is-active' : ''}" data-ac-sub="items">อุปกรณ์เสริม (${items.length})</button>
              <button type="button" class="adm-subtab ${sub === 'colors' ? 'is-active' : ''}" data-ac-sub="colors">สีโครงสร้างหลัก (${colors.length})</button>
            </div>
            <button type="button" class="adm-btn adm-btn--red" id="admAddAccBtn">${sub === 'items' ? '+ เพิ่มอุปกรณ์เสริมใหม่' : '+ เพิ่มสีโครงสร้าง'}</button>
          </div>
        </div>

        <div class="adm-cards-grid">
          ${
            sub === 'items'
              ? items
                  .map(
                    (item) => `
                  <article class="adm-item-card">
                    <div class="adm-item-card__body">
                      <span class="adm-item-card__meta">หมวด: ${esc(item.category)} · สูงสุด ${esc(item.maxQty)} ${esc(item.unit)}</span>
                      <h3 class="adm-item-card__title">${esc(item.name)}</h3>
                      <small style="color:#64748B;">${esc(item.nameEn || '')}</small>
                      <p class="adm-item-card__desc">${esc(item.description)}</p>
                      <strong style="font-size:1rem;color:#DC2626;">+${fmtTHB(item.price)} / ${esc(item.unit)}</strong>
                    </div>
                    <div class="adm-item-card__foot">
                      <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-acc-edit="${esc(item.id)}">แก้ไขราคา / ข้อมูล</button>
                      <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-acc-del="${esc(item.id)}">ลบ</button>
                    </div>
                  </article>`
                  )
                  .join('')
              : colors
                  .map(
                    (c) => `
                  <article class="adm-item-card">
                    <div class="adm-item-card__body">
                      <div style="display:flex;align-items:center;gap:10px;">
                        <span style="width:32px;height:32px;border-radius:50%;background:${esc(c.hex)};border:2px solid #FFF;box-shadow:0 2px 8px rgba(15,23,42,0.18);"></span>
                        <div>
                          <h3 class="adm-item-card__title">${esc(c.nameTh)} (${esc(c.name)})</h3>
                          <span class="adm-item-card__meta">${esc(c.code)} · ${c.surcharge ? `+${fmtTHB(c.surcharge)}` : 'รวมในมาตรฐาน'}</span>
                        </div>
                      </div>
                    </div>
                    <div class="adm-item-card__foot">
                      <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-col-edit="${esc(c.id)}">แก้ไขสี</button>
                      <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-col-del="${esc(c.id)}">ลบ</button>
                    </div>
                  </article>`
                  )
                  .join('')
          }
        </div>
      </section>
    `;

    container.querySelectorAll('[data-ac-sub]').forEach((b) =>
      b.addEventListener('click', () => {
        state.accSubTab = b.getAttribute('data-ac-sub');
        renderAccessoriesModule(container);
      })
    );

    container.querySelector('#admAddAccBtn')?.addEventListener('click', () => {
      if (sub === 'items') openAccessoryItemEditor(null);
      else openColorEditor(null);
    });

    container.querySelectorAll('[data-acc-edit]').forEach((b) =>
      b.addEventListener('click', () => openAccessoryItemEditor(items.find((x) => x.id === b.getAttribute('data-acc-edit'))))
    );
    container.querySelectorAll('[data-acc-del]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-acc-del');
        askConfirm('ลบอุปกรณ์เสริมนี้?', 'อุปกรณ์เสริมจะถูกนำออกจากหน้าออกแบบแพล้นท์ทันที', async () => {
          state.data.accessories.items = items.filter((x) => x.id !== id);
          await saveCollection('accessories', state.data.accessories);
          renderAccessoriesModule(container);
        });
      })
    );

    container.querySelectorAll('[data-col-edit]').forEach((b) =>
      b.addEventListener('click', () => openColorEditor(colors.find((x) => x.id === b.getAttribute('data-col-edit'))))
    );
    container.querySelectorAll('[data-col-del]').forEach((b) =>
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-col-del');
        askConfirm('ลบสีโครงสร้างนี้?', 'สีนี้จะถูกนำออกจากหน้าออกแบบแพล้นท์ทันที', async () => {
          state.data.accessories.structureColors = colors.filter((x) => x.id !== id);
          await saveCollection('accessories', state.data.accessories);
          renderAccessoriesModule(container);
        });
      })
    );
  }

  function openAccessoryItemEditor(existing) {
    const isNew = !existing;
    const item = existing
      ? { ...existing }
      : { id: `acc-${Date.now().toString(36)}`, name: '', nameEn: '', category: 'ควบคุม', icon: 'gear', price: 950000, unit: 'ชุด', maxQty: 1, description: '' };

    const html = `
      <div class="adm-form-grid">
        ${buildSectionHeader('crimson', 'ข้อมูลอุปกรณ์เสริมแพล้นท์ (Add-On Identity)', 'ชื่ออุปกรณ์เสริมภาษาไทย/อังกฤษ และหมวดหมู่ในหน้าออกแบบ 3D', 'ADD-ON')}
        <div class="adm-field">
          <label for="fAccName">ชื่ออุปกรณ์เสริม (ภาษาไทย) *</label>
          <input type="text" id="fAccName" class="adm-input" value="${esc(item.name)}" required>
        </div>
        <div class="adm-field">
          <label for="fAccEn">ชื่อภาษาอังกฤษ / รุ่นย่อย</label>
          <input type="text" id="fAccEn" class="adm-input" value="${esc(item.nameEn)}">
        </div>
        <div class="adm-field adm-field--violet">
          <label for="fAccCat">หมวดหมู่ (เช่น สิ่งแวดล้อม, จัดเก็บ, ควบคุม, พลังงาน)</label>
          <input type="text" id="fAccCat" class="adm-input" value="${esc(item.category)}">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fAccPrice">ราคาต่อหน่วย (บาท) *</label>
          <input type="number" id="fAccPrice" class="adm-input" value="${Number(item.price || 0)}">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fAccUnit">หน่วยนับ (เช่น ชุด, ถัง, ไซโล)</label>
          <input type="text" id="fAccUnit" class="adm-input" value="${esc(item.unit)}">
        </div>
        <div class="adm-field adm-field--sapphire">
          <label for="fAccMax">จำนวนสูงสุดที่ลูกค้าเลือกได้</label>
          <input type="number" min="1" max="10" id="fAccMax" class="adm-input" value="${Number(item.maxQty || 1)}">
        </div>
        <div class="adm-field adm-field--full adm-field--emerald">
          <label for="fAccDesc">คำอธิบายรายละเอียดทางเทคนิค</label>
          <textarea id="fAccDesc" class="adm-textarea">${esc(item.description)}</textarea>
        </div>
      </div>
    `;

    openEditorModal(isNew ? 'เพิ่มอุปกรณ์เสริมหน้าออกแบบแพล้นท์' : `แก้ไขอุปกรณ์เสริม: ${item.name}`, html, async (bodyEl) => {
      item.name = bodyEl.querySelector('#fAccName').value.trim() || 'อุปกรณ์เสริมใหม่';
      item.nameEn = bodyEl.querySelector('#fAccEn').value.trim();
      item.category = bodyEl.querySelector('#fAccCat').value.trim() || 'อุปกรณ์เสริม';
      item.price = Number(bodyEl.querySelector('#fAccPrice').value) || 0;
      item.unit = bodyEl.querySelector('#fAccUnit').value.trim() || 'ชุด';
      item.maxQty = Math.max(1, Number(bodyEl.querySelector('#fAccMax').value) || 1);
      item.description = bodyEl.querySelector('#fAccDesc').value.trim();

      if (isNew) state.data.accessories.items.push(item);
      else {
        const idx = state.data.accessories.items.findIndex((x) => x.id === item.id);
        if (idx !== -1) state.data.accessories.items[idx] = item;
      }
      await saveCollection('accessories', state.data.accessories);
      closeEditorModal();
      renderActiveTab();
    });
  }

  function openColorEditor(existing) {
    const isNew = !existing;
    const item = existing
      ? { ...existing }
      : { id: `col-${Date.now().toString(36)}`, name: 'Custom Red', nameTh: 'สีแดงพิเศษ', hex: '#C8102E', code: 'RAL 3020', surcharge: 0 };

    const html = `
      <div class="adm-form-grid">
        ${buildSectionHeader('violet', 'ตั้งค่าเฉดสีโครงสร้างหลัก (3D Structure Color Swatch)', 'กำหนดชื่อสี รหัสสี HEX และมาตรฐาน RAL', 'RAL COLOR')}
        <div class="adm-field">
          <label for="fColTh">ชื่อสีภาษาไทย *</label>
          <input type="text" id="fColTh" class="adm-input" value="${esc(item.nameTh)}" required>
        </div>
        <div class="adm-field">
          <label for="fColEn">ชื่อสีภาษาอังกฤษ</label>
          <input type="text" id="fColEn" class="adm-input" value="${esc(item.name)}">
        </div>
        <div class="adm-field adm-field--violet">
          <label for="fColHex">รหัสสี HEX (เช่น #C8102E)</label>
          <input type="color" id="fColHex" class="adm-input" value="${esc(item.hex || '#C8102E')}" style="height:44px;padding:4px;">
        </div>
        <div class="adm-field adm-field--violet">
          <label for="fColCode">รหัสมาตรฐาน RAL</label>
          <input type="text" id="fColCode" class="adm-input" value="${esc(item.code)}">
        </div>
        <div class="adm-field adm-field--full adm-field--sapphire">
          <label for="fColSur">ค่าใช้จ่ายเพิ่มเติม (บาท · ใส่ 0 หากรวมในมาตรฐาน)</label>
          <input type="number" id="fColSur" class="adm-input" value="${Number(item.surcharge || 0)}">
        </div>
      </div>
    `;

    openEditorModal(isNew ? 'เพิ่มสีโครงสร้างแพล้นท์' : `แก้ไขสี: ${item.nameTh}`, html, async (bodyEl) => {
      item.nameTh = bodyEl.querySelector('#fColTh').value.trim() || 'สีมาตรฐาน';
      item.name = bodyEl.querySelector('#fColEn').value.trim() || 'Standard';
      item.hex = bodyEl.querySelector('#fColHex').value || '#C8102E';
      item.code = bodyEl.querySelector('#fColCode').value.trim() || 'RAL';
      item.surcharge = Number(bodyEl.querySelector('#fColSur').value) || 0;

      if (isNew) state.data.accessories.structureColors.push(item);
      else {
        const idx = state.data.accessories.structureColors.findIndex((x) => x.id === item.id);
        if (idx !== -1) state.data.accessories.structureColors[idx] = item;
      }
      await saveCollection('accessories', state.data.accessories);
      closeEditorModal();
      renderActiveTab();
    });
  }

  /* ============================================================================
   * MODULE 7: ENTRANCE AD POPUP (`popup.json`) — IMAGE-ONLY SWIPEABLE CAROUSEL
   * ============================================================================ */
  function normalizePopupSlides(p) {
    if (!p || typeof p !== 'object') return [];
    let slides = Array.isArray(p.slides) ? p.slides.filter((s) => s && String(s.image || '').trim()) : [];
    if (!slides.length && p.image && String(p.image).trim()) {
      slides = [
        {
          id: 'slide-1',
          image: String(p.image).trim(),
          link: String(p.ctaLink || '').trim(),
        },
      ];
    }
    return slides.map((s, idx) => ({
      id: s.id || `slide-${idx + 1}`,
      image: String(s.image || '').trim(),
      link: String(s.link || '').trim(),
    }));
  }

  function renderPopupModule(container) {
    const p = state.data.popup || {};
    p.slides = normalizePopupSlides(p);
    const slides = p.slides;
    let previewIndex = 0;

    container.innerHTML = `
      <section class="adm-panel adm-glass adm-glass--strong">
        <div class="adm-panel__head">
          <div class="adm-panel__title-group">
            <h2>จัดการโฆษณา Popup หน้าแรก (Image-Only Swipeable Carousel)</h2>
            <p>แสดงเฉพาะแบนเนอร์รูปภาพโฆษณาคมชัดในกรอบกระจกใส Ultra-Clear iOS 27 Liquid Glass เลื่อนซ้าย-ขวาได้หลายภาพ</p>
          </div>
          <div class="adm-panel__toolbar">
            <label class="ios-switch">
              <input type="checkbox" id="fPopEnabled" ${p.enabled ? 'checked' : ''}>
              <span class="ios-switch__track"><span class="ios-switch__thumb"></span></span>
              <span style="font-weight:800;font-size:0.92rem;" id="fPopStatusText">${p.enabled ? 'เปิดแสดง Popup โฆษณา' : 'ปิดการแสดง Popup'}</span>
            </label>
            <button type="button" class="adm-btn adm-btn--red" id="btnAddPopupSlide">+ เพิ่มรูปภาพโฆษณา</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:24px;align-items:start;">
          <!-- Left: Settings & Multi-Image Slide Manager -->
          <div style="display:grid;gap:18px;">
            <form id="admPopupSettingsForm" class="adm-item-card" style="gap:14px;">
              <div class="adm-form-grid">
                <div class="adm-field">
                  <label for="fPopFreq">ความถี่ในการแสดงผลเมื่อเข้าเว็บ</label>
                  <select id="fPopFreq" class="adm-select">
                    <option value="once_per_session" ${p.frequency !== 'every_time' ? 'selected' : ''}>แสดง 1 ครั้งต่อเซสชัน (แนะนำ)</option>
                    <option value="every_time" ${p.frequency === 'every_time' ? 'selected' : ''}>แสดงทุกครั้งที่เปิดหน้าหลัก</option>
                  </select>
                </div>
                <div class="adm-field">
                  <label for="fPopAutoMs">เวลาเลื่อนสไลด์อัตโนมัติ (มิลลิวินาที)</label>
                  <input type="number" min="2000" max="15000" step="500" id="fPopAutoMs" class="adm-input" value="${Number(p.autoPlayMs || 4500)}">
                </div>
              </div>
              <button type="submit" class="adm-btn adm-btn--red" style="justify-self:start;">
                <span>บันทึกการตั้งค่าความถี่ &amp; เวลาเลื่อน</span>
              </button>
            </form>

            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
              <span style="font-size:0.86rem;font-weight:800;color:#0F172A;">รายการภาพสไลด์โฆษณาทั้งหมด (${slides.length} ภาพ)</span>
              <small style="color:#475569;font-size:0.78rem;">เรียงลำดับซ้าย-ขวา หรือตั้งลิงก์เมื่อคลิกที่ภาพได้</small>
            </div>

            <div style="display:grid;gap:12px;" id="admPopupSlidesList">
              ${
                slides.length
                  ? slides
                      .map(
                        (s, idx) => `
                  <article class="adm-item-card" style="flex-direction:row;align-items:center;gap:14px;padding:14px;">
                    <div style="width:128px;height:82px;border-radius:14px;overflow:hidden;background:#0F172A;flex-shrink:0;position:relative;">
                      <img src="${esc(s.image)}" alt="Slide ${idx + 1}" style="width:100%;height:100%;object-fit:cover;display:block;">
                      <span class="adm-item-card__badge" style="top:6px;left:6px;padding:2px 8px;font-size:0.68rem;">#${idx + 1}</span>
                    </div>
                    <div style="flex:1;min-width:0;display:grid;gap:4px;">
                      <div style="font-weight:800;font-size:0.9rem;color:#0F172A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">สไลด์โฆษณาที่ ${idx + 1}</div>
                      <div style="font-size:0.78rem;color:#DC2626;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${s.link ? `คลิกลิงก์ไปที่: ${esc(s.link)}` : 'แสดงภาพอย่างเดียว (ไม่มีลิงก์คลิก)'}
                      </div>
                      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
                        <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-pop-move="${s.id}" data-dir="-1" ${idx === 0 ? 'disabled' : ''} title="เลื่อนลำดับขึ้น">← ซ้าย</button>
                        <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-pop-move="${s.id}" data-dir="1" ${idx === slides.length - 1 ? 'disabled' : ''} title="เลื่อนลำดับลง">ขวา →</button>
                        <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-pop-edit="${s.id}">แก้ไขรูป / ลิงก์</button>
                        <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-pop-del="${s.id}">ลบภาพ</button>
                      </div>
                    </div>
                  </article>
                `
                      )
                      .join('')
                  : `<div class="adm-item-card" style="text-align:center;padding:28px;color:#475569;">ยังไม่มีรูปภาพโฆษณา คลิกปุ่ม <strong>+ เพิ่มรูปภาพโฆษณา</strong> ด้านบนเพื่อเพิ่มสไลด์แรก</div>`
              }
            </div>
          </div>

          <!-- Right: Interactive Live iOS 27 Liquid Glass Preview -->
          <div style="display:grid;gap:10px;position:sticky;top:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <span style="font-size:0.8rem;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:0.06em;">ตัวอย่างการแสดงผลจริง (Interactive Live Glass Preview)</span>
              <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" id="btnResetPopupPreview" hidden>เปิดตัวอย่าง Popup อีกครั้ง</button>
            </div>
            <div id="admPopupLivePreview" style="position:relative;padding:24px 16px;border-radius:28px;background:rgba(15,23,42,0.24);backdrop-filter:blur(16px) saturate(160%);-webkit-backdrop-filter:blur(16px) saturate(160%);border:1px solid rgba(255,255,255,0.65);display:flex;align-items:center;justify-content:center;min-height:320px;"></div>
          </div>
        </div>
      </section>
    `;

    const enabledCheck = container.querySelector('#fPopEnabled');
    const statusText = container.querySelector('#fPopStatusText');
    const previewBox = container.querySelector('#admPopupLivePreview');
    const resetPreviewBtn = container.querySelector('#btnResetPopupPreview');

    const renderLiveCarouselPreview = () => {
      if (resetPreviewBtn) resetPreviewBtn.hidden = true;
      if (!slides.length) {
        previewBox.innerHTML = `<div style="color:#FFFFFF;font-weight:700;font-size:0.9rem;text-align:center;">กรุณาเพิ่มรูปภาพโฆษณาอย่างน้อย 1 ภาพ</div>`;
        return;
      }
      previewIndex = ((previewIndex % slides.length) + slides.length) % slides.length;
      const current = slides[previewIndex];
      const hasMulti = slides.length > 1;

      previewBox.innerHTML = `
        <div id="admPreviewFrame" style="position:relative;width:100%;max-width:520px;padding:10px;border-radius:30px;background:linear-gradient(145deg,rgba(255,255,255,0.44) 0%,rgba(255,255,255,0.16) 100%);backdrop-filter:blur(28px) saturate(200%);-webkit-backdrop-filter:blur(28px) saturate(200%);border:1px solid rgba(255,255,255,0.78);box-shadow:inset 0 1.5px 1px rgba(255,255,255,0.95),0 30px 70px -15px rgba(15,23,42,0.28);transition:transform 0.32s cubic-bezier(0.22,1,0.36,1),opacity 0.32s cubic-bezier(0.22,1,0.36,1);">
          <!-- Close Button -->
          <button type="button" id="admPreviewCloseBtn" title="ทดลองกดปุ่มปิดแอนิเมชันสมูต" style="position:absolute;top:18px;right:18px;z-index:5;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,0.85);background:linear-gradient(145deg,rgba(255,255,255,0.58),rgba(255,255,255,0.24));backdrop-filter:blur(20px);color:#0F172A;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:inset 0 1.5px 1px rgba(255,255,255,0.96),0 8px 22px rgba(15,23,42,0.22);">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>

          <!-- Inner Rounded Image Viewport -->
          <div style="position:relative;width:100%;border-radius:22px;overflow:hidden;background:#0F172A;">
            <img src="${esc(current.image)}" alt="Slide Preview" style="width:100%;aspect-ratio:16/10;object-fit:cover;display:block;">
          </div>

          ${
            hasMulti
              ? `
            <button type="button" id="admPreviewPrev" aria-label="ภาพก่อนหน้า" style="position:absolute;top:50%;left:18px;transform:translateY(-50%);z-index:5;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,0.84);background:linear-gradient(145deg,rgba(255,255,255,0.56),rgba(255,255,255,0.22));backdrop-filter:blur(20px);color:#0F172A;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:inset 0 1.5px 1px rgba(255,255,255,0.95),0 8px 22px rgba(15,23,42,0.2);">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button type="button" id="admPreviewNext" aria-label="ภาพถัดไป" style="position:absolute;top:50%;right:18px;transform:translateY(-50%);z-index:5;width:38px;height:38px;border-radius:50%;border:1px solid rgba(255,255,255,0.84);background:linear-gradient(145deg,rgba(255,255,255,0.56),rgba(255,255,255,0.22));backdrop-filter:blur(20px);color:#0F172A;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:inset 0 1.5px 1px rgba(255,255,255,0.95),0 8px 22px rgba(15,23,42,0.2);">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <div style="position:absolute;bottom:18px;left:50%;transform:translateX(-50%);z-index:5;display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;background:linear-gradient(145deg,rgba(255,255,255,0.48),rgba(255,255,255,0.18));backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.78);">
              ${slides
                .map(
                  (_, i) =>
                    `<button type="button" data-prev-dot="${i}" style="width:${i === previewIndex ? '24px' : '8px'};height:8px;border-radius:999px;border:none;padding:0;cursor:pointer;background:${i === previewIndex ? 'linear-gradient(135deg,#DC2626,#EF4444)' : 'rgba(15,23,42,0.35)'};transition:width 0.3s;"></button>`
                )
                .join('')}
            </div>
          `
              : ''
          }
        </div>
      `;

      previewBox.querySelector('#admPreviewPrev')?.addEventListener('click', () => {
        previewIndex -= 1;
        renderLiveCarouselPreview();
      });
      previewBox.querySelector('#admPreviewNext')?.addEventListener('click', () => {
        previewIndex += 1;
        renderLiveCarouselPreview();
      });
      previewBox.querySelectorAll('[data-prev-dot]').forEach((dot) => {
        dot.addEventListener('click', () => {
          previewIndex = Number(dot.getAttribute('data-prev-dot')) || 0;
          renderLiveCarouselPreview();
        });
      });
      previewBox.querySelector('#admPreviewCloseBtn')?.addEventListener('click', () => {
        const frame = previewBox.querySelector('#admPreviewFrame');
        if (frame) {
          frame.style.transform = 'scale(0.92) translate3d(0, 12px, 0)';
          frame.style.opacity = '0';
          setTimeout(() => {
            previewBox.innerHTML = `<div style="color:#FFFFFF;font-weight:700;font-size:0.88rem;text-align:center;">ปิด Popup ด้วยแอนิเมชันสมูตแล้ว คลิก "เปิดตัวอย่าง Popup อีกครั้ง" ด้านบนเพื่อแสดงใหม่</div>`;
            if (resetPreviewBtn) resetPreviewBtn.hidden = false;
          }, 320);
        }
      });
    };

    renderLiveCarouselPreview();

    resetPreviewBtn?.addEventListener('click', renderLiveCarouselPreview);

    const persistPopup = async () => {
      state.data.popup.updatedAt = new Date().toISOString();
      await saveCollection('popup', state.data.popup);
      updateSidebarBadges();
    };

    enabledCheck.addEventListener('change', async () => {
      statusText.textContent = enabledCheck.checked ? 'เปิดแสดง Popup โฆษณา' : 'ปิดการแสดง Popup';
      state.data.popup.enabled = enabledCheck.checked;
      await persistPopup();
    });

    container.querySelector('#admPopupSettingsForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      state.data.popup.enabled = enabledCheck.checked;
      state.data.popup.frequency = container.querySelector('#fPopFreq').value;
      state.data.popup.autoPlayMs = Math.max(2000, Number(container.querySelector('#fPopAutoMs').value) || 4500);
      await persistPopup();
    });

    // Add Slide
    container.querySelector('#btnAddPopupSlide')?.addEventListener('click', () => openPopupSlideEditor(null, container));

    // Edit Slide
    container.querySelectorAll('[data-pop-edit]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const slide = slides.find((x) => x.id === btn.getAttribute('data-pop-edit'));
        if (slide) openPopupSlideEditor(slide, container);
      })
    );

    // Move Slide Order (Left / Right)
    container.querySelectorAll('[data-pop-move]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-pop-move');
        const dir = Number(btn.getAttribute('data-dir')) || 0;
        const idx = slides.findIndex((x) => x.id === id);
        const targetIdx = idx + dir;
        if (idx < 0 || targetIdx < 0 || targetIdx >= slides.length) return;
        const temp = slides[idx];
        slides[idx] = slides[targetIdx];
        slides[targetIdx] = temp;
        previewIndex = targetIdx;
        await persistPopup();
        renderPopupModule(container);
      })
    );

    // Delete Slide
    container.querySelectorAll('[data-pop-del]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-pop-del');
        askConfirm('ลบรูปภาพสไลด์โฆษณานี้?', 'รูปภาพจะถูกนำออกจาก Popup หน้าแรกทันที', async () => {
          state.data.popup.slides = slides.filter((x) => x.id !== id);
          await persistPopup();
          renderPopupModule(container);
        });
      })
    );
  }

  function openPopupSlideEditor(existing, container) {
    const isNew = !existing;
    const item = existing
      ? { ...existing }
      : { id: `slide-${Date.now().toString(36)}`, image: '', link: 'promotions.html' };

    const html = `
      <div class="adm-form-grid">
        ${buildSectionHeader('amber', 'รูปภาพแบนเนอร์สไลด์โฆษณา (Popup Slide Banner)', 'แสดงเฉพาะรูปภาพในกรอบกระจกใส Ultra-Clear iOS 27 Liquid Glass', 'SLIDE IMAGE')}
        ${buildImageUploaderField('fSlideImg', 'รูปภาพแบนเนอร์โฆษณา (แสดงเฉพาะรูปภาพในกรอบกระจกใส) *', item.image)}
        ${buildSectionHeader('violet', 'ลิงก์เมื่อคลิกที่รูปภาพ (Target URL)', 'หากระบุลิงก์ ลูกค้าสามารถคลิกที่ตัวรูปภาพเพื่อเปิดหน้าปลายทางได้ทันที', 'OPTIONAL LINK')}
        <div class="adm-field adm-field--full adm-field--violet">
          <label for="fSlideLink">ลิงก์ปลายทางเมื่อลูกค้าคลิกที่รูปภาพ (เว้นว่างได้หากไม่ต้องการลิงก์)</label>
          <input type="text" id="fSlideLink" class="adm-input" value="${esc(item.link || '')}" placeholder="เช่น promotions.html, design-plant.html หรือ https://...">
        </div>
      </div>
    `;

    openEditorModal(isNew ? 'เพิ่มรูปภาพสไลด์โฆษณา Popup' : 'แก้ไขรูปภาพสไลด์โฆษณา Popup', html, async (bodyEl) => {
      const imgUrl = bodyEl.querySelector('#fSlideImg').value.trim();
      if (!imgUrl) {
        showToast('กรุณาอัปโหลดหรือระบุลิงก์รูปภาพโฆษณา', true);
        return;
      }
      item.image = imgUrl;
      item.link = bodyEl.querySelector('#fSlideLink').value.trim();

      if (!Array.isArray(state.data.popup.slides)) {
        state.data.popup.slides = normalizePopupSlides(state.data.popup);
      }

      if (isNew) {
        state.data.popup.slides.push(item);
      } else {
        const idx = state.data.popup.slides.findIndex((x) => x.id === item.id);
        if (idx !== -1) state.data.popup.slides[idx] = item;
      }

      state.data.popup.updatedAt = new Date().toISOString();
      await saveCollection('popup', state.data.popup);
      updateSidebarBadges();
      closeEditorModal();
      renderPopupModule(container);
    });
  }

  /* ============================================================================
   * MODULE 8: QUOTATIONS MANAGEMENT (`quotations.json`) + OFFICIAL A4 EDITOR & LIVE PREVIEW
   * ============================================================================ */
  function isQuotePreliminary(q) {
    if (!q) return false;
    if (q.docType === 'preliminary') return true;
    if (q.docType === 'official') return false;
    if (q.status === 'pending_review') return true;
    if (q.status === 'verified_sent' || q.status === 'closed') return false;
    return !String(q.proposerName || '').trim() && !String(q.approverName || '').trim();
  }

  function openAdminQuotationPreviewModal(existingQuote, container) {
    const isNew = !existingQuote;
    const s = state.data.siteSettings || {};
    const QT = window.ProtexQuotationTemplate;
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String((state.data.quotations?.items?.length || 0) + 1).padStart(3, '0');

    const defPropName = s.defaultProposerName || 'นายบุญรุ่ง หินดี';
    const defPropTitle = s.defaultProposerTitle || 'Sale Engineer';
    const defPropTel = s.defaultProposerTel || 'Tel. 065-241-5250';
    const defAppName = s.defaultApproverName || 'คุณสมศักดิ์ ประคองศรี';
    const defAppTitle = s.defaultApproverTitle || 'Managing Director';

    const baseDraft = existingQuote
      ? JSON.parse(JSON.stringify(existingQuote))
      : {
          id: `qt-${Date.now().toString(36)}`,
          ref: `QT-${ymd}-${seq}`,
          docType: 'official',
          revision: s.defaultRevision || 'RE.1',
          attn: s.defaultAttn || 'กรรมการผู้จัดการ',
          createdAt: new Date().toISOString(),
          status: 'verified_sent',
          contact: { name: '', phone: '', company: '', email: '', note: '' },
          officialItems: [
            {
              title: 'แพล้นท์ผสมยางมะตอย MODEL PT-1510RAP',
              bullets: [
                'กำลังการผลิตมาตรฐาน 110-130 T/H',
                'รวมงานออกแบบวิศวกรรม ประกอบติดตั้ง และทดสอบเดินเครื่อง (Commissioning)',
              ],
              qty: 1,
              unit: 'ระบบ',
              unitPrice: 36900000,
              discount: 0,
            },
          ],
          specialDiscount: 0,
          vatRate: 7,
          deliveryTerm: s.defaultDeliveryTerm || 'ตามกำหนดการที่ตกลงร่วมกัน',
          priceValidFor: s.defaultPriceValidFor || '30 วัน นับจากวันที่ออกเอกสาร',
          paymentTerms: Array.isArray(s.defaultPaymentTerms) && s.defaultPaymentTerms.length
            ? [...s.defaultPaymentTerms]
            : [
                'งวดที่ 1 ชำระเงินมัดจำ 30% พร้อมใบสั่งซื้อ เพื่อเริ่มดำเนินการผลิตและจัดเตรียมอุปกรณ์',
                'งวดที่ 2 ชำระเงิน 50% ก่อนจัดส่งเครื่องจักรและอุปกรณ์เข้าพื้นที่ติดตั้งหน้างาน',
                'งวดที่ 3 ชำระส่วนที่เหลือ 20% หลังติดตั้งและทดสอบเดินเครื่อง (Commissioning) เรียบร้อยแล้ว',
              ],
          proposerName: defPropName,
          proposerTitle: defPropTitle,
          proposerTel: defPropTel,
          approverName: defAppName,
          approverTitle: defAppTitle,
        };

    // Keep preliminary status & blank signers intact when opening an unverified customer request
    const initPrelim = isQuotePreliminary(baseDraft);
    baseDraft.docType = initPrelim ? 'preliminary' : 'official';
    if (initPrelim) {
      baseDraft.proposerName = '';
      baseDraft.proposerTitle = '';
      baseDraft.proposerTel = '';
      baseDraft.approverName = '';
      baseDraft.approverTitle = '';
    }

    // Normalize initial items into editable `officialItems` array so Admin can edit every row & sub-bullet freely
    const normInit = QT ? QT.normalizeQuotationData(baseDraft, s) : null;
    if (!Array.isArray(baseDraft.officialItems) || !baseDraft.officialItems.length) {
      baseDraft.officialItems = normInit
        ? normInit.items.map((it) => ({
            title: it.title,
            bullets: [...(it.bullets || [])],
            qty: it.qty,
            unit: it.unit,
            unitPrice: it.unitPrice,
            discount: it.discount || 0,
          }))
        : [];
    }
    if (!baseDraft.issueDateDisplay && normInit) {
      baseDraft.issueDateDisplay = normInit.dateDisplay;
    }

    const html = `
      <div class="adm-qt-verify-banner">
        <div class="adm-qt-verify-banner__left">
          <span id="admQtModalStateBadge" class="adm-qt-state-pill ${initPrelim ? 'adm-qt-state-pill--pending' : 'adm-qt-state-pill--verified'}">
            <span class="adm-ord-dot ${initPrelim ? 'adm-ord-dot--shipping' : 'adm-ord-dot--completed'}"></span>
            <span>${initPrelim ? 'รอตรวจสอบ (ฉบับเบื้องต้น — เส้นลงนามว่าง)' : 'ฉบับทางการ (ผ่านการตรวจสอบแล้ว)'}</span>
          </span>
          <span style="font-size:12.5px;color:#334155;">
            ส่งอีเมลผ่าน <code>${esc(baseDraft.emailSender || s.smtpUser || 'protexgroupa@gmail.com')}</code>
            ${baseDraft.contact?.email ? ` &rarr; <strong>${esc(baseDraft.contact.email)}</strong>` : ''}
            ${baseDraft.lastEmailedAt ? ` <span style="color:#059669;font-weight:700;">(ส่งล่าสุด: ${esc(formatThaiOrderDateTime(baseDraft.lastEmailedAt))})</span>` : ''}
          </span>
        </div>
        <div class="adm-qt-verify-banner__actions">
          <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" id="admBtnPrintQuoteA4">พิมพ์ / PDF (A4 แนวตั้ง)</button>
          <button type="button" class="adm-btn adm-btn--red adm-btn--sm" id="admBtnVerifyAndSendMail">ยืนยันตรวจสอบและส่งใบเสนอราคาไปที่อีเมลลูกค้า</button>
        </div>
      </div>

      <div class="adm-qt-studio-split">
        <!-- LEFT COLUMN: Clean Minimal Apple-Style Frosted Form -->
        <div class="qt-clean-form-stack">
          <!-- Group 1 -->
          <section class="qt-clean-group">
            <div class="qt-clean-group__head">
              <span class="qt-clean-group__num">1</span>
              <h3 class="qt-clean-group__title">ข้อมูลเอกสารและลูกค้า</h3>
            </div>
            <div class="qt-clean-grid">
              <div class="qt-clean-field">
                <label for="fQtRef">เลขที่ใบเสนอราคา (NO.) <span class="qt-clean-req">*</span></label>
                <input type="text" id="fQtRef" class="qt-clean-input" value="${esc(baseDraft.ref)}" required>
              </div>
              <div class="qt-clean-field">
                <label for="fQtRev">ครั้งที่แก้ไข (RE.)</label>
                <input type="text" id="fQtRev" class="qt-clean-input" value="${esc(baseDraft.revision || 'RE.1')}" placeholder="RE.1">
              </div>
              <div class="qt-clean-field">
                <label for="fQtDate">วันที่ออกเอกสาร (DD/MM/YYYY พ.ศ.)</label>
                <input type="text" id="fQtDate" class="qt-clean-input" value="${esc(baseDraft.issueDateDisplay || '')}" placeholder="25/11/2569">
              </div>
              <div class="qt-clean-field">
                <label for="fQtAttn">เรียน (ATTN.)</label>
                <input type="text" id="fQtAttn" class="qt-clean-input" value="${esc(baseDraft.attn || s.defaultAttn || 'กรรมการผู้จัดการ')}">
              </div>
              <div class="qt-clean-field">
                <label for="fQtComp">เสนอให้ (บริษัท / หน่วยงาน)</label>
                <input type="text" id="fQtComp" class="qt-clean-input" value="${esc(baseDraft.contact?.company || '')}">
              </div>
              <div class="qt-clean-field">
                <label for="fQtName">ชื่อผู้ติดต่อลูกค้า <span class="qt-clean-req">*</span></label>
                <input type="text" id="fQtName" class="qt-clean-input" value="${esc(baseDraft.contact?.name || '')}" required>
              </div>
              <div class="qt-clean-field">
                <label for="fQtPhone">เบอร์โทรศัพท์ (TEL.)</label>
                <input type="text" id="fQtPhone" class="qt-clean-input" value="${esc(baseDraft.contact?.phone || '')}" placeholder="081-234-5678">
              </div>
              <div class="qt-clean-field">
                <label for="fQtFax">แฟกซ์ (FAX.)</label>
                <input type="text" id="fQtFax" class="qt-clean-input" value="${esc(baseDraft.fax || baseDraft.contact?.fax || '')}" placeholder="เว้นว่างได้หากไม่มี">
              </div>
              <div class="qt-clean-field qt-clean-field--full">
                <label for="fQtEmail">อีเมลลูกค้า (สำหรับส่งเมลเท่านั้น — ไม่โชว์บนใบเสนอราคา)</label>
                <input type="email" id="fQtEmail" class="qt-clean-input" value="${esc(baseDraft.contact?.email || '')}" placeholder="purchasing@company.co.th">
                <span class="qt-clean-hint">ใช้สำหรับส่งสำเนาใบเสนอราคาผ่าน protexgroupa@gmail.com เท่านั้น จะไม่ปรากฏบนหน้าเอกสาร A4</span>
              </div>
            </div>
          </section>

          <!-- Group 2 -->
          <section class="qt-clean-group">
            <div class="qt-clean-group__head">
              <span class="qt-clean-group__num">2</span>
              <h3 class="qt-clean-group__title">รายการสินค้าและส่วนลด</h3>
            </div>
            <div id="admQtItemsEditorList" style="display:flex;flex-direction:column;gap:10px;"></div>
            <button type="button" class="qt-clean-add-btn" id="admBtnAddQtLine">+ เพิ่มแถวรายการสินค้า</button>

            <div class="qt-clean-grid" style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(15,23,42,0.07);">
              <div class="qt-clean-field">
                <label for="fQtSpecDisc">ส่วนลดพิเศษท้ายบิล (บาท)</label>
                <input type="number" min="0" step="0.01" id="fQtSpecDisc" class="qt-clean-input" value="${Number(baseDraft.specialDiscount || 0)}">
              </div>
              <div class="qt-clean-field">
                <label for="fQtRemark">หมายเหตุเพิ่มเติม</label>
                <input type="text" id="fQtRemark" class="qt-clean-input" value="${esc(baseDraft.remarkNote || '')}" placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)">
              </div>
            </div>
          </section>

          <!-- Group 3 -->
          <section class="qt-clean-group">
            <div class="qt-clean-group__head" style="justify-content:space-between;flex-wrap:wrap;">
              <div style="display:flex;align-items:center;gap:9px;">
                <span class="qt-clean-group__num">3</span>
                <h3 class="qt-clean-group__title">เงื่อนไข การตรวจสอบ และการลงนาม</h3>
              </div>
              <button type="button" class="qt-clean-autofill-btn" id="admBtnFillDefaultSigners">
                + ใส่รายชื่อผู้เสนอราคา/ผู้อนุมัติมาตรฐานบริษัท
              </button>
            </div>
            <div class="qt-clean-grid">
              <div class="qt-clean-field qt-clean-field--full">
                <label for="fQtDocType">สถานะและรูปแบบเอกสาร A4</label>
                <select id="fQtDocType" class="qt-clean-input">
                  <option value="preliminary" ${baseDraft.docType === 'preliminary' ? 'selected' : ''}>ฉบับเบื้องต้น (รอตรวจสอบ — เว้นเส้นประลงนามว่าง)</option>
                  <option value="official" ${baseDraft.docType === 'official' ? 'selected' : ''}>ฉบับทางการ (ผ่านการตรวจสอบแล้ว — แสดงชื่อผู้เสนอราคาและผู้อนุมัติ)</option>
                </select>
              </div>
              <div class="qt-clean-field">
                <label for="fQtDelivery">กำหนดส่งมอบ (DELIVERY)</label>
                <input type="text" id="fQtDelivery" class="qt-clean-input" value="${esc(baseDraft.deliveryTerm || s.defaultDeliveryTerm || 'ตามกำหนดการที่ตกลงร่วมกัน')}">
              </div>
              <div class="qt-clean-field">
                <label for="fQtValid">กำหนดยืนราคา (PRICE VALID FOR)</label>
                <input type="text" id="fQtValid" class="qt-clean-input" value="${esc(baseDraft.priceValidFor || s.defaultPriceValidFor || '30 วัน นับจากวันที่ออกเอกสาร')}">
              </div>
              <div class="qt-clean-field qt-clean-field--full">
                <label for="fQtPayTerms">เงื่อนไขการชำระเงิน (บรรทัดละ 1 ข้อ)</label>
                <textarea id="fQtPayTerms" class="qt-clean-textarea" rows="3">${esc((baseDraft.paymentTerms || []).join('\n'))}</textarea>
              </div>
              <div class="qt-clean-field">
                <label for="fQtPropName">ชื่อผู้เสนอราคา</label>
                <input type="text" id="fQtPropName" class="qt-clean-input" value="${esc(baseDraft.proposerName || '')}" placeholder="เช่น ${esc(defPropName)}">
              </div>
              <div class="qt-clean-field">
                <label for="fQtPropTitle">ตำแหน่ง / เบอร์ผู้เสนอราคา</label>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                  <input type="text" id="fQtPropTitle" class="qt-clean-input" value="${esc(baseDraft.proposerTitle || '')}" placeholder="${esc(defPropTitle)}">
                  <input type="text" id="fQtPropTel" class="qt-clean-input" value="${esc(baseDraft.proposerTel || '')}" placeholder="${esc(defPropTel)}">
                </div>
              </div>
              <div class="qt-clean-field">
                <label for="fQtAppName">ชื่อผู้อนุมัติ</label>
                <input type="text" id="fQtAppName" class="qt-clean-input" value="${esc(baseDraft.approverName || '')}" placeholder="เช่น ${esc(defAppName)}">
              </div>
              <div class="qt-clean-field">
                <label for="fQtAppTitle">ตำแหน่งผู้อนุมัติ</label>
                <input type="text" id="fQtAppTitle" class="qt-clean-input" value="${esc(baseDraft.approverTitle || '')}" placeholder="${esc(defAppTitle)}">
              </div>
            </div>
          </section>
        </div>

        <!-- RIGHT COLUMN: Live Official ISO A4 Portrait (210 x 297 mm) Preview -->
        <div class="adm-qt-studio-preview">
          <div class="adm-qt-preview-bar">
            <div style="font-size:12.5px;font-weight:700;color:#0F172A;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span>ตัวอย่างเอกสารจริง — A4 แนวตั้ง (210 × 297 mm)</span>
              <span data-a4-page-count style="color:#DC2626;font-size:12px;"></span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" id="admBtnToggleFullA4" style="height:30px;padding:0 11px;font-size:12px;">ขยายดูเต็มจอ (Full A4)</button>
            </div>
          </div>
          <div id="admLiveOfficialQuotationMount"></div>
        </div>
      </div>
    `;

    let collectSnapshot = () => baseDraft;

    const persistQuotationChanges = async (snap) => {
      const list = state.data.quotations?.items || [];
      try {
        const url = isNew
          ? '/api/admin/quotations'
          : `/api/admin/quotations/${encodeURIComponent(existingQuote.id || existingQuote.ref)}`;
        const method = isNew ? 'POST' : 'PUT';
        const res = await fetch(url, {
          method,
          headers: authHeaders(),
          body: JSON.stringify(snap),
        });
        const out = await res.json();
        if (res.ok && out.ok && out.item) {
          Object.assign(snap, out.item);
        }
      } catch (e) {}

      if (isNew) {
        list.unshift(snap);
      } else {
        const idx = list.findIndex((x) => (x.id || x.ref) === (existingQuote.id || existingQuote.ref));
        if (idx !== -1) list[idx] = snap;
      }
      try {
        localStorage.setItem('ptx_cms_override_quotations', JSON.stringify({ items: list }));
      } catch (e) {}
      updateSidebarBadges();
    };

    openEditorModal(
      isNew ? `ออกใบเสนอราคาทางการใหม่: ${baseDraft.ref}` : `ดูตัวอย่าง & แก้ไขใบเสนอราคา: ${baseDraft.ref}`,
      html,
      async () => {
        const snap = collectSnapshot();
        await persistQuotationChanges(snap);
        showToast(`บันทึกใบเสนอราคา ${snap.ref} เรียบร้อยแล้ว`);
        closeEditorModal();
        renderQuotationsModule(container);
      },
      (bodyEl) => {
        document.querySelector('#admEditorModal .adm-modal__dialog')?.classList.add('adm-modal__dialog--wide');
        const saveBtn = document.getElementById('admEditorSaveBtn');
        if (saveBtn) saveBtn.textContent = 'บันทึกการแก้ไขใบเสนอราคา';

        const itemsListEl = bodyEl.querySelector('#admQtItemsEditorList');
        const previewMount = bodyEl.querySelector('#admLiveOfficialQuotationMount');
        const docTypeSel = bodyEl.querySelector('#fQtDocType');
        const modalStateBadge = bodyEl.querySelector('#admQtModalStateBadge');

        const syncBannerStateBadge = (docType) => {
          if (!modalStateBadge) return;
          const prelim = docType === 'preliminary';
          modalStateBadge.className = `adm-qt-state-pill ${prelim ? 'adm-qt-state-pill--pending' : 'adm-qt-state-pill--verified'}`;
          modalStateBadge.innerHTML = `
            <span class="adm-ord-dot ${prelim ? 'adm-ord-dot--shipping' : 'adm-ord-dot--completed'}"></span>
            <span>${prelim ? 'รอตรวจสอบ (ฉบับเบื้องต้น — เส้นลงนามว่าง)' : 'ฉบับทางการ (ผ่านการตรวจสอบแล้ว)'}</span>
          `;
        };

        collectSnapshot = () => {
          const faxVal = bodyEl.querySelector('#fQtFax')?.value.trim() || '';
          const selectedDocType = docTypeSel?.value === 'preliminary' ? 'preliminary' : 'official';
          baseDraft.docType = selectedDocType;
          if (selectedDocType === 'official' && (baseDraft.status === 'pending_review' || baseDraft.status === 'new')) {
            baseDraft.status = 'verified_sent';
          } else if (selectedDocType === 'preliminary' && !baseDraft.status) {
            baseDraft.status = 'pending_review';
          }
          baseDraft.ref = bodyEl.querySelector('#fQtRef')?.value.trim() || baseDraft.ref;
          baseDraft.revision = bodyEl.querySelector('#fQtRev')?.value.trim() || 'RE.1';
          baseDraft.issueDateDisplay = bodyEl.querySelector('#fQtDate')?.value.trim() || '';
          baseDraft.attn = bodyEl.querySelector('#fQtAttn')?.value.trim() || 'กรรมการผู้จัดการ';
          baseDraft.fax = faxVal;
          baseDraft.contact = {
            ...(baseDraft.contact || {}),
            company: bodyEl.querySelector('#fQtComp')?.value.trim() || '',
            name: bodyEl.querySelector('#fQtName')?.value.trim() || '',
            phone: bodyEl.querySelector('#fQtPhone')?.value.trim() || '',
            fax: faxVal,
            email: bodyEl.querySelector('#fQtEmail')?.value.trim() || '',
          };
          baseDraft.specialDiscount = Math.max(0, Number(bodyEl.querySelector('#fQtSpecDisc')?.value || 0));
          baseDraft.remarkNote = bodyEl.querySelector('#fQtRemark')?.value.trim() || '';
          baseDraft.deliveryTerm = bodyEl.querySelector('#fQtDelivery')?.value.trim() || '';
          baseDraft.priceValidFor = bodyEl.querySelector('#fQtValid')?.value.trim() || '';
          baseDraft.paymentTerms = (bodyEl.querySelector('#fQtPayTerms')?.value || '')
            .split('\n')
            .map((t) => t.trim())
            .filter(Boolean);
          baseDraft.proposerName = bodyEl.querySelector('#fQtPropName')?.value.trim() || '';
          baseDraft.proposerTitle = bodyEl.querySelector('#fQtPropTitle')?.value.trim() || '';
          baseDraft.proposerTel = bodyEl.querySelector('#fQtPropTel')?.value.trim() || '';
          baseDraft.approverName = bodyEl.querySelector('#fQtAppName')?.value.trim() || '';
          baseDraft.approverTitle = bodyEl.querySelector('#fQtAppTitle')?.value.trim() || '';

          if (QT) {
            const norm = QT.normalizeQuotationData(baseDraft, s);
            baseDraft.subtotal = norm.netBeforeVat;
            baseDraft.vatAmount = norm.vatAmount;
            baseDraft.grandTotal = norm.grandTotal;
          }
          syncBannerStateBadge(selectedDocType);
          return baseDraft;
        };

        const refreshPreview = () => {
          const snap = collectSnapshot();
          if (previewMount && QT) {
            if (typeof QT.mountOfficialQuotationPreview === 'function') {
              QT.mountOfficialQuotationPreview(previewMount, snap, s);
            } else {
              previewMount.innerHTML = QT.renderOfficialQuotationHTML(snap, s);
            }
          }
        };

        const renderItemsEditor = () => {
          if (!itemsListEl) return;
          itemsListEl.innerHTML = baseDraft.officialItems
            .map(
              (row, idx) => `
              <div class="qt-clean-item-card">
                <div class="qt-clean-item-card__bar">
                  <span class="qt-clean-item-card__title">รายการที่ ${idx + 1}</span>
                  ${
                    baseDraft.officialItems.length > 1
                      ? `<button type="button" class="qt-clean-item-card__rm" data-qti-rm="${idx}">ลบ</button>`
                      : ''
                  }
                </div>
                <div class="qt-clean-field">
                  <label>ชื่อรายการสินค้า / รุ่นแพล้นท์</label>
                  <input type="text" class="qt-clean-input" data-qti-title="${idx}" value="${esc(row.title)}" placeholder="ชื่อรายการสินค้า / รุ่นแพล้นท์">
                </div>
                <div class="qt-clean-field">
                  <label>รายละเอียดสเปกย่อย (บรรทัดละ 1 ข้อ)</label>
                  <textarea class="qt-clean-textarea" rows="2" data-qti-bullets="${idx}" placeholder="ระบุสเปกย่อย บรรทัดละ 1 ข้อ">${esc((row.bullets || []).join('\n'))}</textarea>
                </div>
                <div class="qt-clean-item-nums">
                  <div class="qt-clean-field">
                    <label>จำนวน</label>
                    <input type="number" min="0.01" step="any" class="qt-clean-input" data-qti-qty="${idx}" value="${Number(row.qty ?? 1)}">
                  </div>
                  <div class="qt-clean-field">
                    <label>หน่วย</label>
                    <input type="text" class="qt-clean-input" data-qti-unit="${idx}" value="${esc(row.unit || 'ชุด')}">
                  </div>
                  <div class="qt-clean-field">
                    <label>บาท/หน่วย</label>
                    <input type="number" min="0" step="0.01" class="qt-clean-input" data-qti-price="${idx}" value="${Number(row.unitPrice ?? 0)}">
                  </div>
                  <div class="qt-clean-field">
                    <label>ส่วนลด</label>
                    <input type="number" min="0" step="0.01" class="qt-clean-input" data-qti-disc="${idx}" value="${Number(row.discount ?? 0)}">
                  </div>
                </div>
              </div>`
            )
            .join('');
          refreshPreview();
        };

        itemsListEl?.addEventListener('input', (e) => {
          const t = e.target;
          if (t.hasAttribute('data-qti-title')) {
            baseDraft.officialItems[Number(t.getAttribute('data-qti-title'))].title = t.value;
          } else if (t.hasAttribute('data-qti-bullets')) {
            baseDraft.officialItems[Number(t.getAttribute('data-qti-bullets'))].bullets = t.value
              .split('\n')
              .map((b) => b.trim())
              .filter(Boolean);
          } else if (t.hasAttribute('data-qti-qty')) {
            baseDraft.officialItems[Number(t.getAttribute('data-qti-qty'))].qty = Number(t.value) || 0;
          } else if (t.hasAttribute('data-qti-unit')) {
            baseDraft.officialItems[Number(t.getAttribute('data-qti-unit'))].unit = t.value;
          } else if (t.hasAttribute('data-qti-price')) {
            baseDraft.officialItems[Number(t.getAttribute('data-qti-price'))].unitPrice = Number(t.value) || 0;
          } else if (t.hasAttribute('data-qti-disc')) {
            baseDraft.officialItems[Number(t.getAttribute('data-qti-disc'))].discount = Number(t.value) || 0;
          }
          refreshPreview();
        });

        itemsListEl?.addEventListener('click', (e) => {
          const rm = e.target.closest('[data-qti-rm]');
          if (!rm) return;
          baseDraft.officialItems.splice(Number(rm.getAttribute('data-qti-rm')), 1);
          renderItemsEditor();
        });

        bodyEl.querySelector('#admBtnAddQtLine')?.addEventListener('click', () => {
          baseDraft.officialItems.push({
            title: 'รายการอุปกรณ์เสริม / งานบริการติดตั้ง',
            bullets: [],
            qty: 1,
            unit: 'ชุด',
            unitPrice: 0,
            discount: 0,
          });
          renderItemsEditor();
        });

        const fillDefaultCompanySigners = () => {
          const pNameEl = bodyEl.querySelector('#fQtPropName');
          const pTitleEl = bodyEl.querySelector('#fQtPropTitle');
          const pTelEl = bodyEl.querySelector('#fQtPropTel');
          const aNameEl = bodyEl.querySelector('#fQtAppName');
          const aTitleEl = bodyEl.querySelector('#fQtAppTitle');
          if (pNameEl) pNameEl.value = defPropName;
          if (pTitleEl) pTitleEl.value = defPropTitle;
          if (pTelEl) pTelEl.value = defPropTel;
          if (aNameEl) aNameEl.value = defAppName;
          if (aTitleEl) aTitleEl.value = defAppTitle;
          if (docTypeSel) docTypeSel.value = 'official';
          refreshPreview();
        };

        bodyEl.querySelector('#admBtnFillDefaultSigners')?.addEventListener('click', () => {
          fillDefaultCompanySigners();
          showToast('เติมรายชื่อผู้เสนอราคา/ผู้อนุมัติมาตรฐานและสลับเป็นฉบับทางการแล้ว');
        });

        docTypeSel?.addEventListener('change', () => {
          if (docTypeSel.value === 'official') {
            const pNameEl = bodyEl.querySelector('#fQtPropName');
            const aNameEl = bodyEl.querySelector('#fQtAppName');
            if (pNameEl && !pNameEl.value.trim() && aNameEl && !aNameEl.value.trim()) {
              fillDefaultCompanySigners();
              return;
            }
          }
          refreshPreview();
        });

        bodyEl.addEventListener('input', (e) => {
          if (!e.target.closest('#admQtItemsEditorList')) {
            // Auto-promote from preliminary to official when Admin types signer names
            if (
              (e.target.id === 'fQtPropName' || e.target.id === 'fQtAppName') &&
              e.target.value.trim() &&
              docTypeSel &&
              docTypeSel.value === 'preliminary'
            ) {
              docTypeSel.value = 'official';
            }
            refreshPreview();
          }
        });

        bodyEl.querySelector('#admBtnPrintQuoteA4')?.addEventListener('click', () => {
          if (QT) QT.printOfficialQuotation(collectSnapshot(), s);
        });

        const splitGridEl = bodyEl.querySelector('.adm-qt-studio-split');
        const fullA4Btn = bodyEl.querySelector('#admBtnToggleFullA4');
        fullA4Btn?.addEventListener('click', () => {
          if (!splitGridEl) return;
          const active = splitGridEl.classList.toggle('is-full-a4');
          fullA4Btn.textContent = active ? 'กลับมุมมอง 2 ฝั่ง (Split View)' : 'ขยายดูเต็มจอ (Full A4)';
          if (previewMount && QT?.syncA4PreviewScale) {
            requestAnimationFrame(() => QT.syncA4PreviewScale(previewMount));
          }
        });

        bodyEl.querySelector('#admBtnVerifyAndSendMail')?.addEventListener('click', async (e) => {
          const btn = e.currentTarget;
          const emailField = bodyEl.querySelector('#fQtEmail');
          const custEmail = emailField?.value.trim() || '';
          if (!custEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(custEmail)) {
            showToast('กรุณาระบุอีเมลลูกค้าที่ถูกต้องก่อนกดส่งใบเสนอราคาฉบับทางการ', true);
            emailField?.focus();
            return;
          }

          // Ensure signers are filled & document mode is set to Official before sending to customer
          const pNameEl = bodyEl.querySelector('#fQtPropName');
          const aNameEl = bodyEl.querySelector('#fQtAppName');
          if (!pNameEl?.value.trim() && !aNameEl?.value.trim()) {
            fillDefaultCompanySigners();
          } else if (docTypeSel) {
            docTypeSel.value = 'official';
          }

          const prev = btn.textContent;
          btn.disabled = true;
          btn.textContent = 'กำลังบันทึกฉบับทางการและส่งเข้าอีเมลลูกค้า...';
          try {
            const snap = collectSnapshot();
            snap.docType = 'official';
            snap.status = 'verified_sent';
            snap.verifiedAt = snap.verifiedAt || new Date().toISOString();

            if (isNew) {
              await persistQuotationChanges(snap);
            }

            const targetId = existingQuote?.id || existingQuote?.ref || snap.id || snap.ref;
            const res = await fetch(`/api/admin/quotations/${encodeURIComponent(targetId)}/verify-and-send`, {
              method: 'POST',
              headers: authHeaders(),
              body: JSON.stringify(snap),
            });
            const out = await res.json();
            if (out.item) {
              Object.assign(snap, out.item);
              const list = state.data.quotations?.items || [];
              const idx = list.findIndex((x) => (x.id || x.ref) === (snap.id || snap.ref));
              if (idx !== -1) list[idx] = snap;
              try {
                localStorage.setItem('ptx_cms_override_quotations', JSON.stringify({ items: list }));
              } catch (err) {}
            }
            refreshPreview();
            updateSidebarBadges();
            showToast(out.message || `ยืนยันและส่งใบเสนอราคาฉบับทางการไปยัง ${custEmail} เรียบร้อยแล้ว`, out.emailStatus === 'failed');
            closeEditorModal();
            renderQuotationsModule(container);
          } catch (err) {
            const snap = collectSnapshot();
            snap.docType = 'official';
            snap.status = 'verified_sent';
            snap.verifiedAt = new Date().toISOString();
            snap.lastEmailedAt = new Date().toISOString();
            await persistQuotationChanges(snap);
            showToast('บันทึกเป็นฉบับทางการแล้ว แต่ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ส่งอีเมลได้', true);
            renderQuotationsModule(container);
          } finally {
            btn.disabled = false;
            btn.textContent = prev;
          }
        });

        renderItemsEditor();
      }
    );
  }

  function renderQuotationsModule(container) {
    const saveBtn = document.getElementById('admEditorSaveBtn');
    if (saveBtn) saveBtn.textContent = 'บันทึกข้อมูล';

    const list = state.data.quotations?.items || [];
    const totalCount = list.length;
    const pendingReviewCount = list.filter((q) => isQuotePreliminary(q)).length;
    const verifiedCount = list.filter((q) => !isQuotePreliminary(q)).length;
    const closedCount = list.filter((q) => q.status === 'closed').length;
    const totalValue = list.reduce((sum, q) => sum + Number(q.grandTotal || q.subtotal || 0), 0);

    const qSearch = (state.quotesQuery || '').trim().toLowerCase();
    const curFilter = state.quotesFilter || 'all';
    const filtered = list.filter((q) => {
      const prelim = isQuotePreliminary(q);
      if (curFilter === 'pending_review' && !prelim) return false;
      if (curFilter === 'verified_sent' && prelim) return false;
      if (curFilter === 'closed' && q.status !== 'closed') return false;
      if (!qSearch) return true;
      const hay = `${q.ref} ${q.contact?.name || ''} ${q.contact?.company || ''} ${q.contact?.phone || ''} ${q.contact?.email || ''} ${q.model?.name || ''}`.toLowerCase();
      return hay.includes(qSearch);
    });

    const renderDocStateBadge = (q) => {
      if (isQuotePreliminary(q)) {
        return `
          <span class="adm-qt-state-pill adm-qt-state-pill--pending">
            <span class="adm-ord-dot adm-ord-dot--shipping"></span>
            <span>รอตรวจสอบ (เบื้องต้น)</span>
          </span>`;
      }
      if (q.emailStatus === 'sent') {
        return `
          <span class="adm-qt-state-pill adm-qt-state-pill--verified">
            <span class="adm-ord-dot adm-ord-dot--completed"></span>
            <span>ตรวจสอบและส่งอีเมลแล้ว (ทางการ)</span>
          </span>`;
      }
      return `
        <span class="adm-qt-state-pill adm-qt-state-pill--verified">
          <span class="adm-ord-dot adm-ord-dot--confirmed"></span>
          <span>ตรวจสอบแล้ว (ฉบับทางการ)</span>
        </span>`;
    };

    container.innerHTML = `
      <div style="display:grid;gap:20px;">
        <!-- 4 Summary Stat Cards -->
        <div class="adm-stats-grid">
          <article class="adm-stat-card adm-glass adm-glass--strong">
            <span class="adm-stat-card__label">ใบเสนอราคาทั้งหมด</span>
            <div class="adm-stat-card__num">${totalCount} รายการ</div>
          </article>
          <article class="adm-stat-card adm-glass adm-glass--strong">
            <span class="adm-stat-card__label">รอตรวจสอบ (ฉบับเบื้องต้น)</span>
            <div class="adm-stat-card__num" style="color:#D97706;">${pendingReviewCount} รายการ</div>
          </article>
          <article class="adm-stat-card adm-glass adm-glass--strong">
            <span class="adm-stat-card__label">ตรวจสอบแล้ว / ส่งฉบับทางการ</span>
            <div class="adm-stat-card__num" style="color:#059669;">${verifiedCount} รายการ</div>
          </article>
          <article class="adm-stat-card adm-glass adm-glass--strong">
            <span class="adm-stat-card__label">มูลค่าใบเสนอราคารวมสุทธิ</span>
            <div class="adm-stat-card__num" style="font-size:1.38rem;">${fmtTHB(totalValue)}</div>
          </article>
        </div>

        <section class="adm-panel adm-glass adm-glass--strong">
          <div class="adm-panel__head">
            <div class="adm-panel__title-group">
              <h2>รายการคำขอและใบเสนอราคา (Quotation Verification &amp; Dispatch)</h2>
              <p>ตรวจสอบคำขอใบเสนอราคาเบื้องต้นจากลูกค้า เติมชื่อผู้เสนอราคา/ผู้อนุมัติ และกดส่งฉบับทางการกลับไปยังอีเมล (Gmail) ลูกค้าผ่าน protexgroupa@gmail.com</p>
            </div>
            <div class="adm-panel__toolbar">
              <div class="adm-subtabs">
                <button type="button" class="adm-subtab ${curFilter === 'all' ? 'is-active' : ''}" data-qf="all">ทั้งหมด (${totalCount})</button>
                <button type="button" class="adm-subtab ${curFilter === 'pending_review' ? 'is-active' : ''}" data-qf="pending_review">รอตรวจสอบ (${pendingReviewCount})</button>
                <button type="button" class="adm-subtab ${curFilter === 'verified_sent' ? 'is-active' : ''}" data-qf="verified_sent">ฉบับทางการ (${verifiedCount})</button>
                <button type="button" class="adm-subtab ${curFilter === 'closed' ? 'is-active' : ''}" data-qf="closed">ปิดการขาย (${closedCount})</button>
              </div>
              <input type="search" id="admQuoteSearchInput" class="adm-input" style="width:220px;" placeholder="ค้นหาชื่อลูกค้า, บริษัท, QT-..." value="${esc(state.quotesQuery)}">
              <button type="button" class="adm-btn adm-btn--red" id="admBtnNewOfficialQuote">+ ออกใบเสนอราคาทางการใหม่</button>
            </div>
          </div>

          <div class="adm-qt-list">
            ${
              filtered.length
                ? filtered
                    .map((q) => {
                      const c = q.contact || {};
                      const m = q.model || {};
                      const col = q.color || {};
                      const lines = Array.isArray(q.lines) ? q.lines : [];
                      const prelim = isQuotePreliminary(q);
                      const dt = formatThaiOrderDateTime(q.createdAt);
                      const sentDt = q.lastEmailedAt ? formatThaiOrderDateTime(q.lastEmailedAt) : '';
                      const custEmail = c.email || '-';
                      return `
                      <article class="adm-qt-card" data-qt-id="${esc(q.id || q.ref)}">
                        <div class="adm-qt-card__top">
                          <div class="adm-qt-card__ref-group">
                            <span class="adm-qt-ref-pill">${esc(q.ref)}</span>
                            <span class="adm-qt-date">รับคำขอเมื่อ: ${esc(dt)}</span>
                            ${sentDt ? `<span class="adm-qt-date" style="color:#059669;font-weight:700;">· ส่งอีเมลลูกค้าเมื่อ: ${esc(sentDt)}</span>` : ''}
                          </div>
                          ${renderDocStateBadge(q)}
                        </div>

                        <div class="adm-qt-card__grid">
                          <!-- Col 1: Who Sent It & Recipient Info -->
                          <div class="adm-qt-col">
                            <span class="adm-qt-col__label">ผู้ขอใบเสนอราคา (CLIENT)</span>
                            <strong class="adm-qt-col__title">${esc(c.name || '-')}</strong>
                            <div class="adm-qt-col__sub">บริษัท/หน่วยงาน: <strong>${esc(c.company || '-')}</strong></div>
                            <div class="adm-qt-col__sub">โทร: <a href="tel:${esc(String(c.phone || '').replace(/[^0-9+]/g, ''))}" style="color:#DC2626;font-weight:800;text-decoration:none;">${esc(c.phone || '-')}</a></div>
                            <div class="adm-qt-col__sub">อีเมลรับฉบับทางการ: <strong>${esc(custEmail)}</strong></div>
                            ${c.note ? `<div class="adm-qt-col__sub" style="color:#475569;margin-top:2px;">หมายเหตุ/หน้างาน: ${esc(c.note)}</div>` : ''}
                          </div>

                          <!-- Col 2: Plant Spec & Verification Signers -->
                          <div class="adm-qt-col">
                            <span class="adm-qt-col__label">สเปกสินค้า &amp; ผู้ลงนามเอกสาร</span>
                            <strong class="adm-qt-col__title">${esc(m.name || q.officialItems?.[0]?.title || '-')} ${m.capacity ? `(${esc(m.capacity)} ${esc(m.capacityUnit || 'T/H')})` : ''}</strong>
                            ${
                              col.nameTh
                                ? `<div class="adm-qt-col__sub" style="display:flex;align-items:center;gap:6px;">
                                    <span style="width:11px;height:11px;border-radius:50%;background:${esc(col.hex || '#C8102E')};display:inline-block;"></span>
                                    <span>สีโครงสร้าง: <strong>${esc(col.nameTh)} (${esc(col.code || '')})</strong></span>
                                  </div>`
                                : ''
                            }
                            <div class="adm-qt-col__sub">อุปกรณ์เสริม: <strong>${lines.length} รายการ</strong></div>
                            <div class="adm-qt-col__sub" style="margin-top:4px;font-size:0.78rem;color:${prelim ? '#B45309' : '#047857'};font-weight:700;">
                              ${
                                prelim
                                  ? 'ผู้เสนอราคา / ผู้อนุมัติ: เว้นว่าง (รอแอดมินตรวจสอบ)'
                                  : `ผู้เสนอราคา: ${esc(q.proposerName || '-')} · ผู้อนุมัติ: ${esc(q.approverName || '-')}`
                              }
                            </div>
                          </div>

                          <!-- Col 3: Financial Breakdown & Status Select -->
                          <div class="adm-qt-col">
                            <span class="adm-qt-col__label">ยอดสุทธิรวม VAT 7%</span>
                            <div class="adm-qt-col__total">${fmtTHB(q.grandTotal || q.subtotal)}</div>
                            <div class="adm-qt-col__sub">ก่อน VAT: ${fmtTHB(q.subtotal)} · VAT 7%: ${fmtTHB(q.vatAmount)}</div>
                            <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
                              <label style="font-size:0.76rem;font-weight:800;color:#334155;">สถานะ:</label>
                              <select class="adm-ord-status-select" data-qt-status="${esc(q.id || q.ref)}">
                                <option value="pending_review" ${prelim ? 'selected' : ''}>รอตรวจสอบ (เบื้องต้น)</option>
                                <option value="verified_sent" ${!prelim && q.status !== 'contacted' && q.status !== 'closed' ? 'selected' : ''}>ตรวจสอบและส่งอีเมลแล้ว</option>
                                <option value="contacted" ${q.status === 'contacted' ? 'selected' : ''}>ติดต่อลูกค้าแล้ว</option>
                                <option value="closed" ${q.status === 'closed' ? 'selected' : ''}>ปิดการขายสำเร็จ</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div class="adm-qt-card__foot">
                          <span style="font-size:0.78rem;color:#64748B;">${esc(q.emailStatusNote || '')}</span>
                          <div style="display:flex;flex-wrap:wrap;gap:8px;">
                            <button type="button" class="adm-btn adm-btn--red adm-btn--sm" data-qt-preview="${esc(q.id || q.ref)}">
                              ${prelim ? 'ตรวจสอบ &amp; ออกใบเสนอราคาทางการ' : 'ดู / แก้ไขใบเสนอราคาทางการ'}
                            </button>
                            <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-qt-print="${esc(q.id || q.ref)}">พิมพ์ A4 / PDF</button>
                            <button type="button" class="adm-btn adm-btn--glass adm-btn--sm" data-qt-resend="${esc(q.id || q.ref)}">ยืนยันและส่งเข้าอีเมลลูกค้า</button>
                            <button type="button" class="adm-btn adm-btn--danger adm-btn--sm" data-qt-del="${esc(q.id || q.ref)}">ลบ</button>
                          </div>
                        </div>
                      </article>`;
                    })
                    .join('')
                : `<div class="adm-item-card" style="text-align:center;padding:34px;color:#475569;">ไม่พบรายการใบเสนอราคาในหมวดหมู่นี้</div>`
            }
          </div>
        </section>
      </div>
    `;

    container.querySelectorAll('[data-qf]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.quotesFilter = btn.getAttribute('data-qf');
        renderQuotationsModule(container);
      });
    });

    const searchInput = container.querySelector('#admQuoteSearchInput');
    searchInput?.addEventListener('input', () => {
      state.quotesQuery = searchInput.value;
      renderQuotationsModule(container);
      const nextInput = container.querySelector('#admQuoteSearchInput');
      if (nextInput) {
        nextInput.focus();
        nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
      }
    });

    container.querySelectorAll('[data-qt-status]').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const id = sel.getAttribute('data-qt-status');
        const nextStatus = sel.value;
        const found = list.find((x) => (x.id || x.ref) === id);
        const s = state.data.siteSettings || {};
        const patchBody = { status: nextStatus };
        if (found) {
          found.status = nextStatus;
          if (nextStatus === 'pending_review') {
            found.docType = 'preliminary';
            patchBody.docType = 'preliminary';
          } else {
            found.docType = 'official';
            patchBody.docType = 'official';
            if (!found.proposerName) {
              found.proposerName = s.defaultProposerName || 'นายบุญรุ่ง หินดี';
              found.proposerTitle = s.defaultProposerTitle || 'Sale Engineer';
              found.proposerTel = s.defaultProposerTel || 'Tel. 065-241-5250';
              patchBody.proposerName = found.proposerName;
              patchBody.proposerTitle = found.proposerTitle;
              patchBody.proposerTel = found.proposerTel;
            }
            if (!found.approverName) {
              found.approverName = s.defaultApproverName || 'คุณสมศักดิ์ ประคองศรี';
              found.approverTitle = s.defaultApproverTitle || 'Managing Director';
              patchBody.approverName = found.approverName;
              patchBody.approverTitle = found.approverTitle;
            }
          }
        }
        try {
          await fetch(`/api/admin/quotations/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: authHeaders(),
            body: JSON.stringify(patchBody),
          });
        } catch (e) {}
        try {
          localStorage.setItem('ptx_cms_override_quotations', JSON.stringify(state.data.quotations));
        } catch (e) {}
        updateSidebarBadges();
        showToast('อัปเดตสถานะใบเสนอราคาแล้ว');
        renderQuotationsModule(container);
      });
    });

    container.querySelector('#admBtnNewOfficialQuote')?.addEventListener('click', () => {
      openAdminQuotationPreviewModal(null, container);
    });

    container.querySelectorAll('[data-qt-preview]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-qt-preview');
        const found = list.find((x) => (x.id || x.ref) === id);
        if (found) openAdminQuotationPreviewModal(found, container);
      });
    });

    container.querySelectorAll('[data-qt-print]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-qt-print');
        const found = list.find((x) => (x.id || x.ref) === id);
        if (found && window.ProtexQuotationTemplate) {
          window.ProtexQuotationTemplate.printOfficialQuotation(found, state.data.siteSettings || {});
        }
      });
    });

    container.querySelectorAll('[data-qt-resend]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-qt-resend');
        const found = list.find((x) => (x.id || x.ref) === id);
        if (!found) return;
        const prev = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'กำลังยืนยันและส่งอีเมล...';
        try {
          const res = await fetch(`/api/admin/quotations/${encodeURIComponent(id)}/verify-and-send`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({}),
          });
          const out = await res.json();
          if (out.item) Object.assign(found, out.item);
          try {
            localStorage.setItem('ptx_cms_override_quotations', JSON.stringify(state.data.quotations));
          } catch (err) {}
          updateSidebarBadges();
          showToast(out.message || 'ยืนยันและส่งใบเสนอราคาฉบับทางการเข้าอีเมลลูกค้าแล้ว', out.emailStatus === 'failed');
          renderQuotationsModule(container);
        } catch (e) {
          showToast('ไม่สามารถส่งอีเมลได้ กรุณาตรวจสอบการตั้งค่า Gmail App Password ในเมนู 9', true);
        } finally {
          btn.disabled = false;
          btn.textContent = prev;
        }
      });
    });

    container.querySelectorAll('[data-qt-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-qt-del');
        const found = list.find((x) => (x.id || x.ref) === id);
        if (!found) return;
        askConfirm(`ลบใบเสนอราคา ${found.ref}?`, `รายการของ ${found.contact?.name || ''} จะถูกลบออกจากระบบ`, async () => {
          state.data.quotations.items = list.filter((x) => (x.id || x.ref) !== id);
          try {
            await fetch(`/api/admin/quotations/${encodeURIComponent(id)}`, {
              method: 'DELETE',
              headers: authHeaders(),
            });
          } catch (e) {}
          try {
            localStorage.setItem('ptx_cms_override_quotations', JSON.stringify(state.data.quotations));
          } catch (e) {}
          updateSidebarBadges();
          showToast('ลบรายการใบเสนอราคาเรียบร้อยแล้ว');
          renderQuotationsModule(container);
        });
      });
    });
  }

  /* ============================================================================
   * MODULE 9: SITE SETTINGS, GMAIL SMTP, AI CHATBOT & ADMIN PASSWORD
   * ============================================================================ */
  function renderSettingsModule(container) {
    const s = state.data.siteSettings || {};
    const kb = state.data.chatbotKnowledge || {};

    container.innerHTML = `
      <div style="display:grid;gap:20px;">
        <!-- 1. Contact & Company Settings -->
        <section class="adm-panel adm-glass adm-glass--strong">
          <div class="adm-panel__head">
            <div class="adm-panel__title-group">
              <h2>ข้อมูลติดต่อหลัก &amp; สำนักงานใหญ่ (ซิงก์อัตโนมัติทุกหน้าและ AI Chatbot)</h2>
              <p>เมื่อบันทึก ระบบจะอัปเดตเบอร์โทร, LINE, อีเมล และที่อยู่ในหน้าติดต่อสอบถาม ฟุตเตอร์ และฐานความรู้ AI ทันที</p>
            </div>
          </div>
          <form id="admSiteSettingsForm" class="adm-form-grid">
            ${buildSectionHeader('crimson', 'ข้อมูลบริษัท & เวลาทำการ (Company Identity)', 'แสดงในหน้าติดต่อสอบถามและฟุตเตอร์ทุกหน้า', 'COMPANY')}
            <div class="adm-field">
              <label for="fSetComp">ชื่อบริษัท (ภาษาไทย)</label>
              <input type="text" id="fSetComp" class="adm-input" value="${esc(s.companyName || 'บริษัท โปรเท็กซ์ กรุ๊ป จำกัด (PROTEX GROUP)')}">
            </div>
            <div class="adm-field adm-field--emerald">
              <label for="fSetHours">เวลาทำการ</label>
              <input type="text" id="fSetHours" class="adm-input" value="${esc(s.hours || 'จันทร์ – เสาร์ 08:00 – 17:30 น. (Service หลังการขายพร้อมดูแล 24/7)')}">
            </div>
            ${buildSectionHeader('sapphire', 'ช่องทางติดต่อหลัก 4 ช่องทาง (Direct Contact Channels)', 'ซิงก์กับการ์ดติดต่อทั้ง 4 ใบและปุ่มคัดลอกอัตโนมัติ', '4 CHANNELS')}
            <div class="adm-field adm-field--sapphire">
              <label for="fSetPhone">เบอร์โทรศัพท์สำนักงานใหญ่ &amp; ฝ่ายขาย</label>
              <input type="text" id="fSetPhone" class="adm-input" value="${esc(s.phone || '085-392-4448')}">
            </div>
            <div class="adm-field adm-field--sapphire">
              <label for="fSetServicePhone">เบอร์โทรศัพท์ Service หลังการขาย</label>
              <input type="text" id="fSetServicePhone" class="adm-input" value="${esc(s.servicePhone || '085-392-4448')}">
            </div>
            <div class="adm-field adm-field--emerald">
              <label for="fSetLineId">LINE Official ID</label>
              <input type="text" id="fSetLineId" class="adm-input" value="${esc(s.lineId || 'protex000')}">
            </div>
            <div class="adm-field adm-field--emerald">
              <label for="fSetLineUrl">ลิงก์แอดไลน์ (LINE URL)</label>
              <input type="url" id="fSetLineUrl" class="adm-input" value="${esc(s.lineUrl || 'https://line.me/ti/p/~protex000')}">
            </div>
            <div class="adm-field adm-field--full adm-field--violet">
              <label for="fSetEmail">อีเมลฝ่ายขายและวิศวกรรม</label>
              <input type="email" id="fSetEmail" class="adm-input" value="${esc(s.email || 'protexgroupa@gmail.com')}">
            </div>
            <div class="adm-field adm-field--full">
              <label for="fSetAddr">ที่อยู่สำนักงานใหญ่ &amp; โรงงานประกอบหลัก</label>
              <textarea id="fSetAddr" class="adm-textarea">${esc(s.address || '88/9 หมู่ 12 ถนนบางนา-ตราด กม.15 ตำบลบางพลีใหญ่ อำเภอบางพลี จังหวัดสมุทรปราการ 10540')}</textarea>
            </div>
            <div class="adm-field adm-field--full">
              <button type="submit" class="adm-btn adm-btn--red" style="align-self:start;">บันทึกข้อมูลติดต่อเว็บไซต์</button>
            </div>
          </form>
        </section>

        <!-- 2. Official Quotation Letterhead, Bank & Signatory Defaults -->
        <section class="adm-panel adm-glass adm-glass--strong">
          <div class="adm-panel__head">
            <div class="adm-panel__title-group">
              <h2>ตั้งค่าหัวเอกสารและข้อมูลเริ่มต้นใบเสนอราคาทางการ (Official Quotation Defaults)</h2>
              <p>ข้อมูลชุดนี้ใช้เป็นค่าเริ่มต้นให้กับใบเสนอราคาใหม่ทุกใบทั้งหน้าออกแบบแพล้นท์, หน้าสั่งพิมพ์ A4/PDF และอีเมลอัตโนมัติ</p>
            </div>
          </div>
          <form id="admQuoteDefaultsForm" class="adm-form-grid">
            ${buildSectionHeader('crimson', 'หัวเอกสารนิติบุคคล & บัญชีธนาคารรับโอน', 'PROTEX ACCESSORY INDUSTRIAL LTD., PART. และเลขที่บัญชีธนาคาร', 'LETTERHEAD & BANK')}
            <div class="adm-field">
              <label for="fQdLegalComp">ชื่อนิติบุคคลหัวเอกสาร</label>
              <input type="text" id="fQdLegalComp" class="adm-input" value="${esc(s.legalCompanyEn || 'PROTEX ACCESSORY INDUSTRIAL LTD., PART.')}">
            </div>
            <div class="adm-field">
              <label for="fQdTaxId">เลขประจำตัวผู้เสียภาษี (TAX ID No.)</label>
              <input type="text" id="fQdTaxId" class="adm-input" value="${esc(s.taxId || '0113545005517')}">
            </div>
            <div class="adm-field adm-field--full">
              <label for="fQdLegalAddr">ที่อยู่หัวเอกสาร (ภาษาอังกฤษ/ทางการ)</label>
              <input type="text" id="fQdLegalAddr" class="adm-input" value="${esc(s.legalAddressEn || '56/360 M.1, Soi Wattrisamakkhi 3, Sukhumvit Rd., T. Bangmuangmai, A. Muangsamutprakarn, Samutprakarn 10270, Thailand')}">
            </div>
            <div class="adm-field adm-field--sapphire">
              <label for="fQdBankName">ชื่อบัญชีรับโอนเงิน</label>
              <input type="text" id="fQdBankName" class="adm-input" value="${esc(s.bankAccountName || 'หจก. โพรเทคส์ แอคเซซโซรี อินดัสเตรียล')}">
            </div>
            <div class="adm-field adm-field--sapphire">
              <label for="fQdBankDet">ธนาคารและเลขที่บัญชี</label>
              <input type="text" id="fQdBankDet" class="adm-input" value="${esc(s.bankDetails || 'ธนาคารกรุงศรีอยุธยา เลขที่บัญชี 063-0-03989-5 ประเภทกระแสรายวัน สาขาสำโรง')}">
            </div>

            ${buildSectionHeader('emerald', 'ผู้เสนอราคา, ผู้อนุมัติ & เงื่อนไขการชำระเงินเริ่มต้น', 'แสดงด้านล่างของเอกสารใบเสนอราคา A4 ทุกฉบับ', 'SIGNATORIES & TERMS')}
            <div class="adm-field adm-field--violet">
              <label for="fQdPropName">ชื่อผู้เสนอราคาเริ่มต้น</label>
              <input type="text" id="fQdPropName" class="adm-input" value="${esc(s.defaultProposerName || 'นายบุญรุ่ง หินดี')}">
            </div>
            <div class="adm-field adm-field--violet">
              <label for="fQdPropTitle">ตำแหน่ง / เบอร์ผู้เสนอราคาเริ่มต้น</label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <input type="text" id="fQdPropTitle" class="adm-input" value="${esc(s.defaultProposerTitle || 'Sale Engineer')}">
                <input type="text" id="fQdPropTel" class="adm-input" value="${esc(s.defaultProposerTel || 'Tel. 065-241-5250')}">
              </div>
            </div>
            <div class="adm-field adm-field--violet">
              <label for="fQdAppName">ชื่อผู้อนุมัติเริ่มต้น</label>
              <input type="text" id="fQdAppName" class="adm-input" value="${esc(s.defaultApproverName || 'คุณสมศักดิ์ ประคองศรี')}">
            </div>
            <div class="adm-field adm-field--violet">
              <label for="fQdAppTitle">ตำแหน่งผู้อนุมัติเริ่มต้น</label>
              <input type="text" id="fQdAppTitle" class="adm-input" value="${esc(s.defaultApproverTitle || 'Managing Director')}">
            </div>
            <div class="adm-field adm-field--emerald">
              <label for="fQdDelivery">กำหนดส่งมอบเริ่มต้น (DELIVERY)</label>
              <input type="text" id="fQdDelivery" class="adm-input" value="${esc(s.defaultDeliveryTerm || 'ตามกำหนดการที่ตกลงร่วมกัน')}">
            </div>
            <div class="adm-field adm-field--emerald">
              <label for="fQdValid">กำหนดยืนราคาเริ่มต้น (PRICE VALID FOR)</label>
              <input type="text" id="fQdValid" class="adm-input" value="${esc(s.defaultPriceValidFor || '30 วัน นับจากวันที่ออกเอกสาร')}">
            </div>
            <div class="adm-field adm-field--full adm-field--emerald">
              <label for="fQdPayTerms">เงื่อนไขการชำระเงินเริ่มต้น (บรรทัดละ 1 ข้อ)</label>
              <textarea id="fQdPayTerms" class="adm-textarea" rows="3">${esc(
                (Array.isArray(s.defaultPaymentTerms) && s.defaultPaymentTerms.length
                  ? s.defaultPaymentTerms
                  : [
                      'งวดที่ 1 ชำระเงินมัดจำ 30% พร้อมใบสั่งซื้อ เพื่อเริ่มดำเนินการผลิตและจัดเตรียมอุปกรณ์',
                      'งวดที่ 2 ชำระเงิน 50% ก่อนจัดส่งเครื่องจักรและอุปกรณ์เข้าพื้นที่ติดตั้งหน้างาน',
                      'งวดที่ 3 ชำระส่วนที่เหลือ 20% หลังติดตั้งและทดสอบเดินเครื่อง (Commissioning) เรียบร้อยแล้ว',
                    ]
                ).join('\n')
              )}</textarea>
            </div>
            <div class="adm-field adm-field--full">
              <button type="submit" class="adm-btn adm-btn--red" style="align-self:start;">บันทึกค่าเริ่มต้นใบเสนอราคาทางการ</button>
            </div>
          </form>
        </section>

        <!-- 3. Gmail SMTP (protexgroupa@gmail.com) Configuration for Official Quotations -->
        <section class="adm-panel adm-glass adm-glass--strong">
          <div class="adm-panel__head">
            <div class="adm-panel__title-group">
              <h2>ตั้งค่าระบบส่งอีเมลใบเสนอราคาอัตโนมัติ (Gmail SMTP — protexgroupa@gmail.com)</h2>
              <p>ใช้ส่งแจ้งเตือนคำขอใบเสนอราคาใหม่เข้ากล่องจดหมายทีมขายและส่งสำเนาใบเสนอราคาให้ลูกค้าอัตโนมัติ</p>
            </div>
          </div>
          <form id="admSmtpForm" class="adm-form-grid">
            ${buildSectionHeader('amber', 'บัญชีผู้ส่ง Gmail SMTP (smtp.gmail.com · Port 465 SSL)', 'ใส่รหัสผ่านแอป 16 หลัก (Gmail App Password) ของบัญชี protexgroupa@gmail.com', 'GMAIL SMTP')}
            <div class="adm-field adm-field--amber">
              <label for="fSmtpUser">อีเมลผู้ส่งใบเสนอราคาหลัก</label>
              <input type="email" id="fSmtpUser" class="adm-input" value="${esc(s.smtpUser || 'protexgroupa@gmail.com')}">
            </div>
            <div class="adm-field adm-field--amber">
              <label for="fSmtpPass">รหัสผ่านแอป Gmail 16 หลัก (Gmail App Password)</label>
              <input type="password" id="fSmtpPass" class="adm-input" placeholder="${s.hasSmtpPassword ? '•••••••••••••••• (ตั้งค่าไว้แล้ว กรอกใหม่เพื่อเปลี่ยน)' : 'กรอกรหัส App Password 16 หลัก เช่น xxxx xxxx xxxx xxxx'}">
            </div>
            <div class="adm-field adm-field--full" style="display:flex;flex-direction:row;flex-wrap:wrap;gap:10px;">
              <button type="submit" class="adm-btn adm-btn--red">บันทึกการตั้งค่า Gmail SMTP</button>
              <button type="button" class="adm-btn adm-btn--glass" id="btnTestSmtpMail">📧 ทดสอบส่งอีเมลเข้า protexgroupa@gmail.com</button>
            </div>
          </form>
        </section>

        <!-- 3. PROTEX AI Chatbot Greeting & Knowledge -->
        <section class="adm-panel adm-glass adm-glass--strong">
          <div class="adm-panel__head">
            <div class="adm-panel__title-group">
              <h2>ตั้งค่าข้อความต้อนรับของ PROTEX AI Chatbot (3D White-Red Drone)</h2>
              <p>ปรับแต่งข้อความทักทายเริ่มต้นเมื่อลูกค้าเปิดหน้าต่างแชท AI</p>
            </div>
          </div>
          <form id="admAiKnowledgeForm" style="display:grid;gap:14px;">
            ${buildSectionHeader('emerald', 'ข้อความทักทาย PROTEX AI (Greeting Message)', 'ข้อความแรกที่หุ่นยนต์ 3D โทนขาว-แดงจะส่งหาลูกค้า', 'AI BOT')}
            <div class="adm-field adm-field--emerald">
              <label for="fAiGreeting">ข้อความทักทายเริ่มต้นของ AI</label>
              <textarea id="fAiGreeting" class="adm-textarea">${esc(kb.botProfile?.greeting || '')}</textarea>
            </div>
            <button type="submit" class="adm-btn adm-btn--red" style="justify-self:start;">บันทึกข้อความ PROTEX AI</button>
          </form>
        </section>

        <!-- 3. Change Admin Password -->
        <section class="adm-panel adm-glass adm-glass--strong">
          <div class="adm-panel__head">
            <div class="adm-panel__title-group">
              <h2>เปลี่ยนรหัสผ่านผู้ดูแลระบบ (Admin Security Password)</h2>
              <p>รหัสผ่านสำหรับเข้าใช้งานผ่านทางเข้าลับช่องแว่นขยาย (พิมพ์ <code>adminprotex</code>)</p>
            </div>
          </div>
          <form id="admPasswordForm" class="adm-form-grid">
            ${buildSectionHeader('violet', 'ความปลอดภัย & รหัสผ่านแอดมิน (Security Gateway)', 'กรอกรหัสผ่านปัจจุบันและกำหนดรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)', 'SECURITY')}
            <div class="adm-field adm-field--violet">
              <label for="fOldPass">รหัสผ่านปัจจุบัน</label>
              <input type="password" id="fOldPass" class="adm-input" placeholder="กรอกรหัสผ่านปัจจุบัน" required>
            </div>
            <div class="adm-field adm-field--violet">
              <label for="fNewPass">รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)</label>
              <input type="password" id="fNewPass" class="adm-input" placeholder="กรอกรหัสผ่านใหม่" required>
            </div>
            <div class="adm-field adm-field--full">
              <button type="submit" class="adm-btn adm-btn--red" style="align-self:start;">อัปเดตรหัสผ่านแอดมิน</button>
            </div>
          </form>
        </section>
      </div>
    `;

    container.querySelector('#admSiteSettingsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      state.data.siteSettings = {
        ...state.data.siteSettings,
        companyName: container.querySelector('#fSetComp').value.trim(),
        hours: container.querySelector('#fSetHours').value.trim(),
        phone: container.querySelector('#fSetPhone').value.trim(),
        servicePhone: container.querySelector('#fSetServicePhone').value.trim(),
        lineId: container.querySelector('#fSetLineId').value.trim(),
        lineUrl: container.querySelector('#fSetLineUrl').value.trim(),
        email: container.querySelector('#fSetEmail').value.trim(),
        address: container.querySelector('#fSetAddr').value.trim(),
      };
      await saveCollection('site-settings', state.data.siteSettings);
    });

    container.querySelector('#admQuoteDefaultsForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      state.data.siteSettings = {
        ...state.data.siteSettings,
        legalCompanyEn: container.querySelector('#fQdLegalComp').value.trim(),
        taxId: container.querySelector('#fQdTaxId').value.trim(),
        legalAddressEn: container.querySelector('#fQdLegalAddr').value.trim(),
        bankAccountName: container.querySelector('#fQdBankName').value.trim(),
        bankDetails: container.querySelector('#fQdBankDet').value.trim(),
        defaultProposerName: container.querySelector('#fQdPropName').value.trim(),
        defaultProposerTitle: container.querySelector('#fQdPropTitle').value.trim(),
        defaultProposerTel: container.querySelector('#fQdPropTel').value.trim(),
        defaultApproverName: container.querySelector('#fQdAppName').value.trim(),
        defaultApproverTitle: container.querySelector('#fQdAppTitle').value.trim(),
        defaultDeliveryTerm: container.querySelector('#fQdDelivery').value.trim(),
        defaultPriceValidFor: container.querySelector('#fQdValid').value.trim(),
        defaultPaymentTerms: container
          .querySelector('#fQdPayTerms')
          .value.split('\n')
          .map((t) => t.trim())
          .filter(Boolean),
      };
      await saveCollection('site-settings', state.data.siteSettings);
    });

    container.querySelector('#admSmtpForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const smtpUser = container.querySelector('#fSmtpUser').value.trim() || 'protexgroupa@gmail.com';
      const rawPass = container.querySelector('#fSmtpPass').value.replace(/\s+/g, '');
      state.data.siteSettings.smtpUser = smtpUser;
      if (rawPass) {
        state.data.siteSettings.gmailAppPassword = rawPass;
        state.data.siteSettings.hasSmtpPassword = true;
      }
      await saveCollection('site-settings', state.data.siteSettings);
      container.querySelector('#fSmtpPass').value = '';
    });

    container.querySelector('#btnTestSmtpMail')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const prev = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'กำลังทดสอบส่งเมล...';
      try {
        const smtpUser = container.querySelector('#fSmtpUser').value.trim() || 'protexgroupa@gmail.com';
        const rawPass = container.querySelector('#fSmtpPass').value.replace(/\s+/g, '');
        const res = await fetch('/api/admin/test-smtp', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ smtpUser, gmailAppPassword: rawPass }),
        });
        const out = await res.json();
        showToast(out.message || 'ทดสอบระบบอีเมลเรียบร้อยแล้ว', !out.ok);
      } catch (err) {
        showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ทดสอบ SMTP ได้', true);
      } finally {
        btn.disabled = false;
        btn.textContent = prev;
      }
    });

    container.querySelector('#admAiKnowledgeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.data.chatbotKnowledge.botProfile) state.data.chatbotKnowledge.botProfile = {};
      state.data.chatbotKnowledge.botProfile.greeting = container.querySelector('#fAiGreeting').value.trim();
      await saveCollection('chatbot-knowledge', state.data.chatbotKnowledge);
    });

    container.querySelector('#admPasswordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = container.querySelector('#fOldPass').value.trim();
      const newPassword = container.querySelector('#fNewPass').value.trim();
      if (newPassword.length < 6) {
        showToast('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', true);
        return;
      }
      try {
        const res = await fetch('/api/admin/password', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const out = await res.json();
        if (!res.ok || !out.ok) {
          if (res.status === 401 && (out.code === 'SESSION_EXPIRED' || (state.expiresAt > 0 && Date.now() >= state.expiresAt))) {
            triggerSessionExpired('ครบกำหนดเวลาใช้งาน 5 ชั่วโมงแล้ว ระบบได้ทำการออกจากระบบอัตโนมัติเพื่อความปลอดภัย กรุณาพิมพ์ adminprotex ที่ช่องค้นหาเพื่อเข้าสู่ระบบใหม่อีกครั้ง');
            return;
          }
          showToast(out.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ', true);
          return;
        }
        state.token = out.token;
        if (out.expiresAt) {
          state.expiresAt = Number(out.expiresAt);
        }
        try {
          sessionStorage.setItem('ptx_admin_token', out.token);
          if (state.expiresAt) {
            sessionStorage.setItem('ptx_admin_expires_at', String(state.expiresAt));
          }
          localStorage.setItem('ptx_cms_custom_pass', newPassword);
        } catch (err) {}
        container.querySelector('#admPasswordForm').reset();
        showToast('เปลี่ยนรหัสผ่านผู้ดูแลระบบเรียบร้อยแล้ว');
      } catch (err) {
        localStorage.setItem('ptx_cms_custom_pass', newPassword);
        container.querySelector('#admPasswordForm').reset();
        showToast('บันทึกรหัสผ่านใหม่เรียบร้อยแล้ว');
      }
    });
  }

  /* -------------------- View Router -------------------- */
  const SECTION_HEADERS = {
    overview: ['ภาพรวมระบบ (Dashboard Overview)', 'สรุปสถิติข้อมูลทั้งหมดในเว็บไซต์และทางลัดจัดการด่วน'],
    plants: ['จัดการแพล้นท์หน้าหลัก (Fully Hot & Hot Re)', 'เพิ่ม แก้ไขสเปก อัปโหลดรูปภาพ และปรับขั้นตอน Process Timeline'],
    'spare-parts': ['จัดการสินค้าอะไหล่ & รีวิวลูกค้า', 'จัดการแคตตาล็อกอะไหล่แท้พร้อมสั่งซื้อ และรีวิวจากผู้ใช้งานจริง'],
    orders: ['จัดการและคีย์ข้อมูลคำสั่งซื้ออะไหล่ (Orders & Key-in)', 'ตรวจสอบออเดอร์จากตะกร้าหน้าเว็บ คีย์ออเดอร์ใหม่ บันทึกเลขพัสดุ และพิมพ์ใบจัดของ A4'],
    promotions: ['จัดการโปรโมชั่น แคมเปญ วิดีโอ & โซเชียล', 'อัปเดตแบนเนอร์โปรโมชั่น แคมเปญการตลาด คลิปวิดีโอ และลิงก์โซเชียลมีเดีย'],
    installations: ['จัดการผลงานติดตั้งจริง & พิกัดแผนที่', 'เพิ่มรายชื่อลูกค้า รูปถ่ายหน้างาน ลิงก์ Google Maps และพิกัดหมุด OpenStreetMap'],
    accessories: ['จัดการอุปกรณ์เสริมหน้าออกแบบแพล้นท์ 3D', 'ตั้งค่ารายการอุปกรณ์เสริม ราคา และสีโครงสร้างหลักสำหรับคำนวณใบเสนอราคา'],
    popup: ['จัดการโฆษณา Popup หน้าเว็บ (Entrance Ad)', 'สวิตช์เปิด-ปิดโฆษณาป๊อปอัปหน้าแรกพร้อมอัปโหลดแบนเนอร์และดูตัวอย่าง Live Preview'],
    quotations: ['รายการขอใบเสนอราคา (Official Quotations)', 'ตรวจสอบคำขอใบเสนอราคาจากลูกค้า สถานะการส่งเมลผ่าน protexgroupa@gmail.com และพิมพ์เอกสาร A4'],
    settings: ['ข้อมูลติดต่อเว็บไซต์, Gmail SMTP, AI Chatbot & ความปลอดภัย', 'ซิงก์เบอร์ติดต่อทุกหน้า ตั้งค่ารหัส Gmail App Password และเปลี่ยนรหัสผ่านแอดมิน'],
  };

  function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('[data-adm-tab]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-adm-tab') === tabId);
    });
    const [title, sub] = SECTION_HEADERS[tabId] || SECTION_HEADERS.overview;
    document.getElementById('admCurrentSectionTitle').textContent = title;
    document.getElementById('admCurrentSectionSub').textContent = sub;
    document.getElementById('admSidebar')?.classList.remove('is-open');
    renderActiveTab();
    const viewContainer = document.getElementById('admViewContainer');
    if (viewContainer) {
      viewContainer.scrollTop = 0;
    }
  }

  function renderActiveTab() {
    const container = document.getElementById('admViewContainer');
    if (!container) return;
    if (state.activeTab === 'overview') renderOverviewModule(container);
    else if (state.activeTab === 'plants') renderPlantsModule(container);
    else if (state.activeTab === 'spare-parts') renderSparePartsModule(container);
    else if (state.activeTab === 'orders') renderOrdersModule(container);
    else if (state.activeTab === 'promotions') renderPromotionsModule(container);
    else if (state.activeTab === 'installations') renderInstallationsModule(container);
    else if (state.activeTab === 'accessories') renderAccessoriesModule(container);
    else if (state.activeTab === 'popup') renderPopupModule(container);
    else if (state.activeTab === 'quotations') renderQuotationsModule(container);
    else if (state.activeTab === 'settings') renderSettingsModule(container);
    enhanceFormFieldLabels(container);
  }

  /* -------------------- Auth Gate & Boot Lifecycle -------------------- */
  function unlockDashboard() {
    const noticeEl = document.getElementById('admSessionExpiredNotice');
    if (noticeEl) noticeEl.style.display = 'none';
    document.getElementById('admAuthGate').hidden = true;
    document.getElementById('admAppShell').hidden = false;
    startSessionWatcher();
    startLivePolling();
    loadAllData();
  }

  function lockDashboard() {
    if (state.sessionTimerId) {
      clearInterval(state.sessionTimerId);
      state.sessionTimerId = null;
    }
    if (state.notifications?.pollIntervalId) {
      clearInterval(state.notifications.pollIntervalId);
      state.notifications.pollIntervalId = null;
    }
    const notifPopover = document.getElementById('admNotificationPopover');
    if (notifPopover) notifPopover.hidden = true;

    state.token = '';
    state.expiresAt = 0;
    state.hasWarned5Min = false;
    try {
      sessionStorage.removeItem('ptx_admin_token');
      sessionStorage.removeItem('ptx_admin_expires_at');
      sessionStorage.removeItem('ptx_admin_auth');
    } catch (e) {}
    document.getElementById('admAppShell').hidden = true;
    document.getElementById('admAuthGate').hidden = false;
    document.getElementById('admGatePass').focus();
  }

  async function verifySessionAndBoot() {
    const savedExp = Number(sessionStorage.getItem('ptx_admin_expires_at') || 0);
    const hasTabSession = sessionStorage.getItem('ptx_admin_auth') === '1' || Boolean(sessionStorage.getItem('ptx_admin_token'));

    // Condition 3: No active session in this tab (e.g. brand new tab opened, or tab reopened after close)
    if (!hasTabSession) {
      lockDashboard();
      return;
    }

    // Condition 2: 5 hours fully elapsed check
    if (savedExp > 0 && Date.now() >= savedExp) {
      triggerSessionExpired('ครบกำหนดเวลาใช้งาน 5 ชั่วโมงแล้ว ระบบได้ทำการออกจากระบบอัตโนมัติเพื่อความปลอดภัย กรุณาพิมพ์ adminprotex ที่ช่องค้นหาเพื่อเข้าสู่ระบบใหม่อีกครั้ง');
      return;
    }

    // Tab session is valid within 5 hours! Maintain remaining elapsed time from savedExp
    state.expiresAt = savedExp > 0 ? savedExp : (Date.now() + ADMIN_SESSION_MS);
    try {
      sessionStorage.setItem('ptx_admin_expires_at', String(state.expiresAt));
      sessionStorage.setItem('ptx_admin_auth', '1');
    } catch (e) {}

    // Verify token with backend if live token exists
    if (state.token && state.token !== 'local-admin-token') {
      try {
        const res = await fetch('/api/admin/verify', { headers: authHeaders() });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.ok) {
          if (out.expiresAt) {
            state.expiresAt = Number(out.expiresAt);
            sessionStorage.setItem('ptx_admin_expires_at', String(state.expiresAt));
          }
          unlockDashboard();
          return;
        }
        if (res.status === 401 && out.code === 'SESSION_EXPIRED') {
          triggerSessionExpired('ครบกำหนดเวลาใช้งาน 5 ชั่วโมงแล้ว ระบบได้ทำการออกจากระบบอัตโนมัติเพื่อความปลอดภัย กรุณาพิมพ์ adminprotex ที่ช่องค้นหาเพื่อเข้าสู่ระบบใหม่อีกครั้ง');
          return;
        }
        // Server returned another code or temporary issue: keep tab session alive without logout!
        unlockDashboard();
        return;
      } catch (e) {
        // Offline / network failure: keep valid tab session
        unlockDashboard();
        return;
      }
    }

    unlockDashboard();
  }

  function initEvents() {
    // Auth Gate Password Toggle & Submit
    const gatePass = document.getElementById('admGatePass');
    const gateToggle = document.getElementById('admGatePassToggle');
    const eyeOpen = document.getElementById('admGateEyeOpen');
    const eyeClosed = document.getElementById('admGateEyeClosed');
    const gateForm = document.getElementById('admGateForm');
    const gateErr = document.getElementById('admGateError');

    gateToggle?.addEventListener('click', () => {
      const isPass = gatePass.type === 'password';
      gatePass.type = isPass ? 'text' : 'password';
      if (isPass) {
        eyeOpen.setAttribute('hidden', '');
        eyeClosed.removeAttribute('hidden');
      } else {
        eyeOpen.removeAttribute('hidden');
        eyeClosed.setAttribute('hidden', '');
      }
      gatePass.focus();
    });

    gateForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      gateErr.textContent = '';
      const pwd = gatePass.value.trim();
      if (!pwd) {
        gateErr.textContent = 'กรุณากรอกรหัสผ่านแอดมิน';
        return;
      }
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pwd }),
        });
        const out = await res.json();
        if (!res.ok || !out.ok) {
          gateErr.textContent = out.message || 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง';
          return;
        }
        const expiresAt = Number(out.expiresAt) || (Date.now() + ADMIN_SESSION_MS);
        state.token = out.token;
        state.expiresAt = expiresAt;
        state.hasWarned5Min = false;
        try {
          sessionStorage.setItem('ptx_admin_token', out.token);
          sessionStorage.setItem('ptx_admin_expires_at', String(expiresAt));
          sessionStorage.setItem('ptx_admin_auth', '1');
        } catch (err) {}
        gatePass.value = '';
        showToast('ยินดีต้อนรับสู่ PROTEX Admin Dashboard (เซสชัน 5 ชั่วโมง)');
        unlockDashboard();
      } catch (netErr) {
        const savedPass = localStorage.getItem('ptx_cms_custom_pass') || 'Protex@2026';
        if (pwd === savedPass) {
          const expiresAt = Date.now() + ADMIN_SESSION_MS;
          state.token = 'local-admin-token';
          state.expiresAt = expiresAt;
          state.hasWarned5Min = false;
          try {
            sessionStorage.setItem('ptx_admin_token', state.token);
            sessionStorage.setItem('ptx_admin_expires_at', String(expiresAt));
            sessionStorage.setItem('ptx_admin_auth', '1');
          } catch (err) {}
          gatePass.value = '';
          showToast('ยินดีต้อนรับสู่ PROTEX Admin Dashboard (เซสชัน 5 ชั่วโมง)');
          unlockDashboard();
        } else {
          gateErr.textContent = 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง';
        }
      }
    });

    // Sidebar Navigation
    document.querySelectorAll('[data-adm-tab]').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-adm-tab')));
    });

    // Mobile Menu Toggle
    document.getElementById('admMobileMenuBtn')?.addEventListener('click', () => {
      document.getElementById('admSidebar')?.classList.toggle('is-open');
    });

    // Reload Data
    document.getElementById('admReloadAllBtn')?.addEventListener('click', () => {
      loadAllData();
      showToast('ดึงข้อมูลล่าสุดเรียบร้อยแล้ว');
    });

    // Logout Buttons
    const handleLogout = async () => {
      try {
        await fetch('/api/admin/logout', { method: 'POST', headers: authHeaders() });
      } catch (e) {}
      lockDashboard();
      showToast('ออกจากระบบผู้ดูแลเรียบร้อยแล้ว');
    };
    document.getElementById('admTopLogoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('admSidebarLogoutBtn')?.addEventListener('click', handleLogout);

    // Editor Modal Events
    document.getElementById('admEditorCloseBtn')?.addEventListener('click', closeEditorModal);
    document.getElementById('admEditorCancelBtn')?.addEventListener('click', closeEditorModal);
    document.getElementById('admEditorForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (typeof editorSubmitCallback === 'function') {
        editorSubmitCallback(document.getElementById('admEditorBody'));
      }
    });

    // Confirm Modal Events
    document.getElementById('admConfirmCancelBtn')?.addEventListener('click', () => {
      document.getElementById('admConfirmModal').hidden = true;
      confirmCallback = null;
    });
    document.getElementById('admConfirmOkBtn')?.addEventListener('click', () => {
      document.getElementById('admConfirmModal').hidden = true;
      if (typeof confirmCallback === 'function') confirmCallback();
      confirmCallback = null;
    });

    // Notification Bell & Popover Events
    const bellBtn = document.getElementById('admNotificationBellBtn');
    const topBellBtn = document.getElementById('admTopBellBtn');
    const notifPopover = document.getElementById('admNotificationPopover');

    const handleBellClick = (e) => {
      e.stopPropagation();
      toggleNotificationPopover();
    };

    bellBtn?.addEventListener('click', handleBellClick);
    topBellBtn?.addEventListener('click', handleBellClick);

    // Mark All Notifications As Read
    document.getElementById('admNotifMarkAllBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      markAllNotificationsRead();
    });

    // Notification Filter Tabs
    document.querySelectorAll('[data-notif-filter]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const filter = btn.getAttribute('data-notif-filter') || 'all';
        state.notifications.filter = filter;
        document.querySelectorAll('[data-notif-filter]').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
        });
        updateNotificationsUI();
      });
    });

    // Notification Feed Item Clicks (Event Delegation)
    document.getElementById('admNotifList')?.addEventListener('click', (e) => {
      const item = e.target.closest('.adm-notif-item');
      if (!item) return;
      const notifId = item.getAttribute('data-notif-id');
      const type = item.getAttribute('data-notif-type');
      const targetRef = item.getAttribute('data-target-ref');

      if (notifId) markNotificationRead(notifId);
      toggleNotificationPopover(false);

      if (type === 'quotation') {
        switchTab('quotations');
        state.quotesQuery = targetRef || '';
        renderActiveTab();
        showToast(`กำลังเปิดใบเสนอราคา ${targetRef || ''}`);
      } else if (type === 'order') {
        switchTab('orders');
        state.ordersQuery = targetRef || '';
        renderActiveTab();
        showToast(`กำลังเปิดคำสั่งซื้อ ${targetRef || ''}`);
      }
    });

    // Close Popover when clicking outside
    document.addEventListener('click', (e) => {
      if (!notifPopover || notifPopover.hidden) return;
      if (
        !notifPopover.contains(e.target) &&
        !bellBtn?.contains(e.target) &&
        !topBellBtn?.contains(e.target)
      ) {
        toggleNotificationPopover(false);
      }
    });

    // Close Popover on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && notifPopover && !notifPopover.hidden) {
        toggleNotificationPopover(false);
      }
    });
  }

  initEvents();
  verifySessionAndBoot();
})();
