/**
 * ============================================================================
 * PROTEX GROUP — ENTRANCE AD POPUP (IMAGE-ONLY SWIPEABLE CAROUSEL)
 * & LIVE SITE-SETTINGS SYNC (`promo-popup.js`)
 * - Renders Ultra-Clear iOS 27 Liquid Glass Image-Only Swipeable Carousel Popup
 *   on `index.html` when enabled in `backend/data/popup.json` (Module 7 CMS)
 * - Supports Touch Swipe, Mouse Drag, Liquid Glass ‹ / › Arrows, Glass Dots,
 *   Auto-Slide (pauses on hover/touch), and Smooth Apple Spring Entry/Exit
 * - Syncs live contact info (`site-settings.json`) across all pages with no cache
 * ============================================================================
 */
(function () {
  'use strict';

  const POPUP_SESSION_KEY = 'ptx_ad_popup_seen_v2';

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizePopupSlides(popup) {
    if (!popup || typeof popup !== 'object') return [];
    let slides = Array.isArray(popup.slides) ? popup.slides.filter((s) => s && String(s.image || '').trim()) : [];
    if (!slides.length && popup.image && String(popup.image).trim()) {
      slides = [
        {
          id: 'slide-legacy-1',
          image: String(popup.image).trim(),
          link: String(popup.ctaLink || '').trim(),
        },
      ];
    }
    return slides.map((s, idx) => ({
      id: s.id || `slide-${idx + 1}`,
      image: String(s.image || '').trim(),
      link: String(s.link || '').trim(),
    }));
  }

  /* -------------------- 1. Entrance Ad Popup (Home Page) -------------------- */
  async function initEntrancePopup() {
    const isHome =
      document.documentElement.dataset.page === 'home' ||
      document.body.classList.contains('page--home') ||
      /(?:\/|index\.html)$/.test(window.location.pathname);

    if (!isHome) return;

    let popup = null;
    try {
      const res = await fetch(`/api/popup?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) popup = await res.json();
    } catch (e) {
      try {
        const localRes = await fetch(`../backend/data/popup.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (localRes.ok) popup = await localRes.json();
      } catch (e2) {}
    }

    // Check localStorage override if admin tested in static mode
    try {
      const localOverride = localStorage.getItem('ptx_cms_override_popup');
      if (localOverride) popup = JSON.parse(localOverride);
    } catch (e) {}

    if (!popup || !popup.enabled) return;

    const slides = normalizePopupSlides(popup);
    if (!slides.length) return;

    const freq = popup.frequency || 'once_per_session';
    if (freq === 'once_per_session' || freq === 'session') {
      try {
        if (sessionStorage.getItem(POPUP_SESSION_KEY) === String(popup.updatedAt || '1')) {
          return;
        }
      } catch (e) {}
    }

    const injectStyles = () => {
      if (document.getElementById('ptxPromoPopupStyles')) return;
      const st = document.createElement('style');
      st.id = 'ptxPromoPopupStyles';
      st.textContent = `
        /* Ultra-Clear iOS 27 Liquid Glass Image-Only Carousel Popup */
        .ptx-ad-modal {
          position: fixed;
          inset: 0;
          z-index: 10020;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition:
            opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            visibility 0.42s cubic-bezier(0.22, 1, 0.36, 1);
          font-family: 'IBM Plex Sans Thai', 'Plus Jakarta Sans', -apple-system, sans-serif;
        }

        .ptx-ad-modal.is-open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .ptx-ad-modal.is-closing {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition:
            opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1),
            visibility 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .ptx-ad-modal__backdrop {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.28);
          backdrop-filter: blur(18px) saturate(160%);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          opacity: 0;
          transition: opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .ptx-ad-modal.is-open .ptx-ad-modal__backdrop {
          opacity: 1;
        }

        .ptx-ad-modal.is-closing .ptx-ad-modal__backdrop {
          opacity: 0;
          transition: opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* Floating Liquid Glass Frame */
        .ptx-ad-modal__frame {
          position: relative;
          z-index: 2;
          width: min(640px, calc(100vw - 28px));
          max-height: 82dvh;
          padding: 10px;
          border-radius: 30px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.44) 0%, rgba(255, 255, 255, 0.16) 100%);
          backdrop-filter: blur(28px) saturate(200%);
          -webkit-backdrop-filter: blur(28px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.78);
          box-shadow:
            inset 0 1.5px 1px rgba(255, 255, 255, 0.95),
            inset 0 -1px 1px rgba(255, 255, 255, 0.28),
            0 30px 70px -15px rgba(15, 23, 42, 0.28);
          transform: scale(0.92) translate3d(0, 16px, 0);
          opacity: 0;
          transition:
            transform 0.42s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1);
          user-select: none;
          -webkit-user-select: none;
        }

        .ptx-ad-modal.is-open .ptx-ad-modal__frame {
          transform: scale(1) translate3d(0, 0, 0);
          opacity: 1;
        }

        .ptx-ad-modal.is-closing .ptx-ad-modal__frame {
          transform: scale(0.92) translate3d(0, 12px, 0);
          opacity: 0;
          transition:
            transform 0.32s cubic-bezier(0.22, 1, 0.36, 1),
            opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* Inner Viewport (border-radius: 22px) */
        .ptx-ad-modal__viewport {
          position: relative;
          width: 100%;
          border-radius: 22px;
          overflow: hidden;
          background: radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.22), rgba(15, 23, 42, 0.14));
          touch-action: pan-y;
          cursor: grab;
        }

        .ptx-ad-modal__viewport.is-dragging {
          cursor: grabbing;
        }

        .ptx-ad-modal__track {
          display: flex;
          width: 100%;
          will-change: transform;
          transition: transform 0.52s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .ptx-ad-modal__track.is-dragging {
          transition: none;
        }

        .ptx-ad-modal__slide {
          flex: 0 0 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .ptx-ad-modal__link {
          display: block;
          width: 100%;
          text-decoration: none;
          color: inherit;
          cursor: pointer;
        }

        .ptx-ad-modal__img {
          display: block;
          width: 100%;
          max-height: calc(82dvh - 22px);
          height: auto;
          aspect-ratio: 16 / 10;
          object-fit: cover;
          pointer-events: none;
        }

        /* Liquid Glass Close Button (40x40px, rotates 90deg on hover) */
        .ptx-ad-modal__close {
          position: absolute;
          top: 18px;
          right: 18px;
          z-index: 6;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.85);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.58) 0%, rgba(255, 255, 255, 0.24) 100%);
          backdrop-filter: blur(20px) saturate(200%);
          -webkit-backdrop-filter: blur(20px) saturate(200%);
          color: #0F172A;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow:
            inset 0 1.5px 1px rgba(255, 255, 255, 0.96),
            0 8px 22px rgba(15, 23, 42, 0.22);
          transition:
            transform 0.34s cubic-bezier(0.22, 1, 0.36, 1),
            background 0.26s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.26s cubic-bezier(0.22, 1, 0.36, 1),
            color 0.26s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.26s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .ptx-ad-modal__close svg {
          transition: transform 0.34s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .ptx-ad-modal__close:hover {
          background: linear-gradient(145deg, rgba(220, 38, 38, 0.92), rgba(185, 28, 28, 0.86));
          color: #FFFFFF;
          border-color: rgba(255, 255, 255, 0.96);
          box-shadow:
            inset 0 1.5px 1px rgba(255, 255, 255, 0.75),
            0 10px 26px rgba(220, 38, 38, 0.38);
          transform: scale(1.06);
        }

        .ptx-ad-modal__close:hover svg {
          transform: rotate(90deg);
        }

        /* Liquid Glass Prev / Next Arrows */
        .ptx-ad-modal__nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 5;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.84);
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.56) 0%, rgba(255, 255, 255, 0.22) 100%);
          backdrop-filter: blur(20px) saturate(200%);
          -webkit-backdrop-filter: blur(20px) saturate(200%);
          color: #0F172A;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow:
            inset 0 1.5px 1px rgba(255, 255, 255, 0.95),
            0 8px 22px rgba(15, 23, 42, 0.2);
          transition:
            transform 0.26s cubic-bezier(0.22, 1, 0.36, 1),
            background 0.26s cubic-bezier(0.22, 1, 0.36, 1),
            color 0.26s cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.26s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .ptx-ad-modal__nav--prev {
          left: 20px;
        }

        .ptx-ad-modal__nav--next {
          right: 20px;
        }

        .ptx-ad-modal__nav:hover {
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.86) 0%, rgba(255, 255, 255, 0.52) 100%);
          color: #DC2626;
          border-color: #FFFFFF;
          transform: translateY(-50%) scale(1.07);
        }

        .ptx-ad-modal__nav:active {
          transform: translateY(-50%) scale(0.95);
        }

        /* Floating Glass Pagination Dots Capsule */
        .ptx-ad-modal__dots {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 5;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          border-radius: 999px;
          background: linear-gradient(145deg, rgba(255, 255, 255, 0.48) 0%, rgba(255, 255, 255, 0.18) 100%);
          backdrop-filter: blur(18px) saturate(200%);
          -webkit-backdrop-filter: blur(18px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.78);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.92),
            0 8px 20px rgba(15, 23, 42, 0.2);
        }

        .ptx-ad-modal__dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          border: none;
          padding: 0;
          background: rgba(15, 23, 42, 0.35);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
          cursor: pointer;
          transition:
            width 0.34s cubic-bezier(0.22, 1, 0.36, 1),
            background 0.34s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.34s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .ptx-ad-modal__dot.is-active {
          width: 26px;
          background: linear-gradient(135deg, #DC2626, #EF4444);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.7),
            0 2px 8px rgba(220, 38, 38, 0.45);
        }

        @media (max-width: 639px) {
          .ptx-ad-modal {
            padding: 14px;
          }
          .ptx-ad-modal__frame {
            width: calc(100vw - 28px);
            padding: 8px;
            border-radius: 26px;
          }
          .ptx-ad-modal__viewport {
            border-radius: 19px;
          }
          .ptx-ad-modal__close {
            top: 14px;
            right: 14px;
            width: 36px;
            height: 36px;
          }
          .ptx-ad-modal__nav {
            width: 36px;
            height: 36px;
          }
          .ptx-ad-modal__nav--prev {
            left: 14px;
          }
          .ptx-ad-modal__nav--next {
            right: 14px;
          }
          .ptx-ad-modal__dots {
            bottom: 14px;
            padding: 5px 10px;
          }
        }
      `;
      document.head.appendChild(st);
    };

    const showPopup = () => {
      if (document.getElementById('ptxEntranceAdModal')) return;
      injectStyles();

      const hasMulti = slides.length > 1;
      const autoPlayMs = Math.max(2000, Number(popup.autoPlayMs) || 4500);

      const modal = document.createElement('div');
      modal.className = 'ptx-ad-modal';
      modal.id = 'ptxEntranceAdModal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'โฆษณาและโปรโมชั่น PROTEX GROUP');

      const slidesHTML = slides
        .map((s, idx) => {
          const imgTag = `<img src="${esc(s.image)}" alt="PROTEX GROUP PROMOTION ${idx + 1}" class="ptx-ad-modal__img" draggable="false">`;
          const inner = s.link
            ? `<a href="${esc(s.link)}" class="ptx-ad-modal__link" data-slide-link>${imgTag}</a>`
            : imgTag;
          return `<div class="ptx-ad-modal__slide" data-slide-idx="${idx}">${inner}</div>`;
        })
        .join('');

      const navHTML = hasMulti
        ? `
          <button type="button" class="ptx-ad-modal__nav ptx-ad-modal__nav--prev" data-ad-prev aria-label="ภาพก่อนหน้า">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button type="button" class="ptx-ad-modal__nav ptx-ad-modal__nav--next" data-ad-next aria-label="ภาพถัดไป">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <div class="ptx-ad-modal__dots" role="tablist" aria-label="เลือกสไลด์โฆษณา">
            ${slides
              .map(
                (_, idx) =>
                  `<button type="button" class="ptx-ad-modal__dot${idx === 0 ? ' is-active' : ''}" data-ad-dot="${idx}" aria-label="สไลด์ที่ ${idx + 1}"></button>`
              )
              .join('')}
          </div>
        `
        : '';

      modal.innerHTML = `
        <div class="ptx-ad-modal__backdrop" data-ad-close></div>
        <div class="ptx-ad-modal__frame">
          <button type="button" class="ptx-ad-modal__close" data-ad-close aria-label="ปิดโฆษณา">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <div class="ptx-ad-modal__viewport" id="ptxAdViewport">
            <div class="ptx-ad-modal__track" id="ptxAdTrack">
              ${slidesHTML}
            </div>
          </div>
          ${navHTML}
        </div>
      `;

      document.body.appendChild(modal);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          modal.classList.add('is-open');
        });
      });

      let currentIndex = 0;
      let autoTimer = null;
      let isClosing = false;
      const track = modal.querySelector('#ptxAdTrack');
      const viewport = modal.querySelector('#ptxAdViewport');
      const dots = Array.from(modal.querySelectorAll('[data-ad-dot]'));

      const goToSlide = (index) => {
        if (!slides.length) return;
        currentIndex = ((index % slides.length) + slides.length) % slides.length;
        if (track) {
          track.style.transform = `translate3d(-${currentIndex * 100}%, 0, 0)`;
        }
        dots.forEach((d, idx) => d.classList.toggle('is-active', idx === currentIndex));
      };

      const startAutoPlay = () => {
        stopAutoPlay();
        if (!hasMulti) return;
        autoTimer = setInterval(() => {
          goToSlide(currentIndex + 1);
        }, autoPlayMs);
      };

      const stopAutoPlay = () => {
        if (autoTimer) {
          clearInterval(autoTimer);
          autoTimer = null;
        }
      };

      startAutoPlay();

      // Pause auto-slide on hover / touch
      const frameEl = modal.querySelector('.ptx-ad-modal__frame');
      frameEl?.addEventListener('mouseenter', stopAutoPlay);
      frameEl?.addEventListener('mouseleave', startAutoPlay);

      // Prev / Next / Dots controls
      modal.querySelector('[data-ad-prev]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(currentIndex - 1);
        startAutoPlay();
      });

      modal.querySelector('[data-ad-next]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(currentIndex + 1);
        startAutoPlay();
      });

      dots.forEach((dot) => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          goToSlide(Number(dot.getAttribute('data-ad-dot')) || 0);
          startAutoPlay();
        });
      });

      // Touch Swipe & Mouse Drag Support (60fps)
      let startX = 0;
      let deltaX = 0;
      let isDragging = false;
      let draggedMoved = false;

      const onPointerDown = (clientX) => {
        if (!hasMulti) return;
        stopAutoPlay();
        isDragging = true;
        draggedMoved = false;
        startX = clientX;
        deltaX = 0;
        track?.classList.add('is-dragging');
        viewport?.classList.add('is-dragging');
      };

      const onPointerMove = (clientX) => {
        if (!isDragging || !viewport || !track) return;
        deltaX = clientX - startX;
        if (Math.abs(deltaX) > 6) draggedMoved = true;
        const width = viewport.offsetWidth || 1;
        const percentOffset = -currentIndex * 100 + (deltaX / width) * 100;
        track.style.transform = `translate3d(${percentOffset}%, 0, 0)`;
      };

      const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        track?.classList.remove('is-dragging');
        viewport?.classList.remove('is-dragging');
        const width = viewport?.offsetWidth || 300;
        const threshold = Math.min(70, width * 0.16);
        if (deltaX < -threshold) {
          goToSlide(currentIndex + 1);
        } else if (deltaX > threshold) {
          goToSlide(currentIndex - 1);
        } else {
          goToSlide(currentIndex);
        }
        startAutoPlay();
      };

      viewport?.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        onPointerDown(e.clientX);
      });
      window.addEventListener('mousemove', (e) => {
        if (isDragging) onPointerMove(e.clientX);
      });
      window.addEventListener('mouseup', () => {
        if (isDragging) onPointerUp();
      });

      viewport?.addEventListener(
        'touchstart',
        (e) => {
          if (e.touches.length === 1) onPointerDown(e.touches[0].clientX);
        },
        { passive: true }
      );
      viewport?.addEventListener(
        'touchmove',
        (e) => {
          if (isDragging && e.touches.length === 1) onPointerMove(e.touches[0].clientX);
        },
        { passive: true }
      );
      viewport?.addEventListener('touchend', () => {
        if (isDragging) onPointerUp();
      });

      // Prevent accidental link click when user dragged the slide
      modal.querySelectorAll('[data-slide-link]').forEach((link) => {
        link.addEventListener('click', (e) => {
          if (draggedMoved) {
            e.preventDefault();
            draggedMoved = false;
          }
        });
      });

      // Smooth Apple Spring Close Animation (.is-closing)
      const closePopup = () => {
        if (isClosing) return;
        isClosing = true;
        stopAutoPlay();
        modal.classList.remove('is-open');
        modal.classList.add('is-closing');
        try {
          sessionStorage.setItem(POPUP_SESSION_KEY, String(popup.updatedAt || '1'));
        } catch (e) {}
        setTimeout(() => {
          modal.remove();
        }, 340);
      };

      modal.addEventListener('click', (e) => {
        if (e.target.closest('[data-ad-close]')) {
          closePopup();
        }
      });

      document.addEventListener('keydown', function onKey(e) {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', onKey);
          closePopup();
        } else if (hasMulti && e.key === 'ArrowLeft') {
          goToSlide(currentIndex - 1);
          startAutoPlay();
        } else if (hasMulti && e.key === 'ArrowRight') {
          goToSlide(currentIndex + 1);
          startAutoPlay();
        }
      });
    };

    // Wait until intro animation finishes so popup never overlaps loading veil
    const triggerAfterIntro = () => {
      if (!document.documentElement.classList.contains('intro-active')) {
        setTimeout(showPopup, 380);
        return;
      }
      let checks = 0;
      const poll = setInterval(() => {
        checks += 1;
        if (!document.documentElement.classList.contains('intro-active') || checks > 25) {
          clearInterval(poll);
          setTimeout(showPopup, 320);
        }
      }, 120);
    };

    triggerAfterIntro();
  }

  /* -------------------- 2. Live Site-Settings Sync Across All Pages -------------------- */
  async function syncSiteSettings() {
    let settings = null;
    try {
      const res = await fetch(`/api/site-settings?_t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) settings = await res.json();
    } catch (e) {
      try {
        const localRes = await fetch(`../backend/data/site-settings.json?_t=${Date.now()}`, { cache: 'no-store' });
        if (localRes.ok) settings = await localRes.json();
      } catch (e2) {}
    }

    if (!settings) return;

    const cleanPhone = String(settings.phone || '085-392-4448').replace(/[^0-9+]/g, '');
    const cleanService = String(settings.servicePhone || settings.phone || '085-392-4448').replace(/[^0-9+]/g, '');

    const hqAddr = document.getElementById('hqAddressText');
    if (hqAddr && settings.address) hqAddr.textContent = settings.address;
    const hqHours = document.getElementById('hqHoursText');
    if (hqHours && settings.hours) hqHours.textContent = settings.hours;

    const cards = document.querySelectorAll('.contact-card');
    if (cards.length >= 4) {
      const c1Val = cards[0].querySelector('.contact-card__value');
      const c1Link = cards[0].querySelector('a.btn--red');
      const c1Copy = cards[0].querySelector('[data-copy]');
      if (c1Val && settings.phone) c1Val.textContent = settings.phone;
      if (c1Link) c1Link.href = `tel:${cleanPhone}`;
      if (c1Copy) c1Copy.setAttribute('data-copy', cleanPhone);

      const c2Val = cards[1].querySelector('.contact-card__value');
      const c2Link = cards[1].querySelector('a.btn--red');
      const c2Copy = cards[1].querySelector('[data-copy]');
      if (c2Val && (settings.servicePhone || settings.phone)) c2Val.textContent = settings.servicePhone || settings.phone;
      if (c2Link) c2Link.href = `tel:${cleanService}`;
      if (c2Copy) c2Copy.setAttribute('data-copy', cleanService);

      const c3Val = cards[2].querySelector('.contact-card__value');
      const c3Link = cards[2].querySelector('a.btn--red');
      const c3Copy = cards[2].querySelector('[data-copy]');
      if (c3Val && settings.lineId) c3Val.textContent = settings.lineId;
      if (c3Link && settings.lineUrl) c3Link.href = settings.lineUrl;
      if (c3Copy && settings.lineId) c3Copy.setAttribute('data-copy', settings.lineId);

      const c4Val = cards[3].querySelector('.contact-card__value');
      const c4Link = cards[3].querySelector('a.btn--red');
      const c4Copy = cards[3].querySelector('[data-copy]');
      if (c4Val && settings.email) c4Val.textContent = settings.email;
      if (c4Link && settings.email) c4Link.href = `mailto:${settings.email}`;
      if (c4Copy && settings.email) c4Copy.setAttribute('data-copy', settings.email);
    }

    document.querySelectorAll('.site-footer a[href^="tel:"]').forEach((a) => {
      a.href = `tel:${cleanPhone}`;
      a.textContent = `โทร ${settings.phone || '085-392-4448'}`;
    });
    document.querySelectorAll('.site-footer a[href^="mailto:"]').forEach((a) => {
      if (settings.email) {
        a.href = `mailto:${settings.email}`;
        a.textContent = settings.email;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initEntrancePopup();
      syncSiteSettings();
    });
  } else {
    initEntrancePopup();
    syncSiteSettings();
  }
})();
