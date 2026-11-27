/**
 * ============================================================================
 * PROTEX AI CHATBOT & 3D AERO-AI DRONE — Modular Intelligence Component
 * - Real-Time 3D WebGL (Three.js) Procedural Model + 3D-Shaded SVG Fallback
 * - 100% PROTEX Pearl White & Ruby Crimson Red (#DC2626 / #FF2A4B) Palette
 * - Zero Hover Tooltip Text — Pure 60fps 3D Interactive Motion:
 *   - 'greeting' (Idle): 3D Sine-Wave Levitation + Delayed Side Pods + 3D Orbit Ring
 *   - Hover: Interactive 3D Head Tilt/Nod + Scale Up + Bright Crimson Core Glow
 *   - 'happy' (Click/Open): 360° 3D Spin Hop + Glowing Ruby Curved Happy Eyes (^ ^)
 *   - 'thinking' (Processing): High-Speed 3D Orbit Ring + Rhythmic Crimson Core Pulse
 * - Self-contained iOS 27 Liquid Glass Chat Widget for all PROTEX GROUP pages
 * - Modular `async getBotReply(userMessage)` ready for future LLM / Gemini API
 * ============================================================================
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'ptx_ai_chat_history_v1';
  const THREE_CDN_URLS = [
    'https://unpkg.com/three@0.160.0/build/three.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  ];

  /* -------------------- Built-in Fallback Knowledge Base -------------------- */
  const FALLBACK_KNOWLEDGE = {
    botProfile: {
      name: 'PROTEX AI',
      badge: 'AI BOT',
      status: 'ผู้ช่วยอัจฉริยะ · ตอบทันที 24 ชม.',
      version: '4.0.0',
      greeting:
        'สวัสดีครับ! ผม **PROTEX AI** ผู้ช่วยวิศวกรรมอัจฉริยะประจำ **PROTEX GROUP** พร้อมให้ข้อมูลสเปกแพล้นท์ยางมะตอย ระบบรีไซเคิล RAP ผลงานติดตั้งจริง อะไหล่แท้ และช่องทางติดต่อทีมวิศวกรครับ เลือกหัวข้อด้านบนหรือพิมพ์ถามผมได้เลยครับ',
    },
    quickChips: [
      { id: 'chip-plants', label: 'รุ่นแพล้นท์ยางมะตอย', query: 'รุ่นแพล้นท์ยางมะตอย' },
      { id: 'chip-rap', label: 'แพล้นท์รีไซเคิล RAP', query: 'แพล้นท์รีไซเคิล RAP' },
      { id: 'chip-installations', label: 'ผลงานติดตั้งจริง', query: 'ดูผลงานติดตั้งจริง' },
      { id: 'chip-contact', label: 'ติดต่อฝ่ายขาย / Service', query: 'ติดต่อฝ่ายขาย / Service' },
    ],
    fullHotPlants: [
      {
        model: 'MODEL PT-1510RAP',
        category: 'Fully Hot In Plant',
        capacity: '110-130 T/H',
        mixerSize: '1,650 kg',
        totalPower: '369 kW',
        rapCapability: 'รองรับ RAP สูงสุด 40%',
        highlight: 'รุ่นยอดนิยมสำหรับโครงการทางหลวงมาตรฐาน ประหยัดเชื้อเพลิง คืนทุนไว',
        url: 'index.html#fully-hot',
      },
      {
        model: 'MODEL PT-2010RAP',
        category: 'Fully Hot In Plant',
        capacity: '180-200 T/H',
        mixerSize: '2,500 kg',
        totalPower: '485 kW',
        rapCapability: 'รองรับ RAP สูงสุด 40%',
        highlight: 'กำลังการผลิตสูงสำหรับงานโครงสร้างพื้นฐานระดับภูมิภาคและมอเตอร์เวย์',
        url: 'index.html#fully-hot',
      },
      {
        model: 'MODEL PT-3015RAP',
        category: 'Fully Hot In Plant (Flagship Heavy Duty)',
        capacity: '300-320 T/H',
        mixerSize: '4,000 kg',
        totalPower: '980 kW',
        rapCapability: 'รองรับ RAP สูงสุด 50%',
        highlight: 'รุ่นเรือธงขนาดใหญ่พิเศษ Mixer 4,000 kg สำหรับเมกะโปรเจกต์ที่ต้องการกำลังผลิตสูงสุด',
        url: 'index.html#fully-hot',
      },
    ],
    recyclePlants: [
      {
        model: 'MODEL RAP50',
        category: 'Hot Re In Plant',
        capacity: '50-60 t/h',
        totalPower: '185 kW',
        rapRatio: 'สัดส่วนรีไซเคิล 50-80%',
        highlight: 'ชุดแพล้นท์รีไซเคิลยางมะตอยร้อนขนาดกลาง ลดต้นทุนวัตถุดิบใหม่ได้สูงสุด',
        url: 'index.html#hot-re',
      },
      {
        model: 'MODEL RAP80',
        category: 'Hot Re In Plant',
        capacity: '70-80 t/h',
        totalPower: '215 kW',
        rapRatio: 'สัดส่วนรีไซเคิล 50-80%',
        highlight: 'ชุดแพล้นท์รีไซเคิลกำลังผลิตสูง เหมาะสำหรับอัปเกรดควบคู่แพล้นท์หลักขนาดใหญ่',
        url: 'index.html#hot-re',
      },
    ],
    installations: [
      {
        company: 'บจก.มรกตชุมพรก่อสร้าง',
        province: 'จ.ชุมพร',
        region: 'ภาคใต้',
        model: 'PT-2010RAP',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=บจก.มรกตชุมพรก่อสร้าง+จ.ชุมพร',
      },
      {
        company: 'หจก.ช.ธานีพัฒนา',
        province: 'จ.อุทัยธานี',
        region: 'ภาคกลาง',
        model: 'PT-2000',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=หจก.ช.ธานีพัฒนา+จ.อุทัยธานี',
      },
      {
        company: 'หจก.ส.ศิระก่อสร้าง',
        province: 'จ.กำแพงเพชร',
        region: 'ภาคเหนือ',
        model: 'PT-1500',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=หจก.ส.ศิระก่อสร้าง+จ.กำแพงเพชร',
      },
      {
        company: 'หจก.สุรินทร์อมรวัฒน์ก่อสร้าง',
        province: 'จ.สุรินทร์',
        region: 'ภาคตะวันออกเฉียงเหนือ',
        model: 'PT-2000',
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=หจก.สุรินทร์อมรวัฒน์ก่อสร้าง+จ.สุรินทร์',
      },
    ],
    contact: {
      companyName: 'บริษัท โปรเท็กซ์ กรุ๊ป จำกัด (PROTEX GROUP)',
      phone: '085-392-4448',
      phoneClean: '0853924448',
      servicePhone: '085-392-4448',
      lineId: 'protex000',
      lineUrl: 'https://line.me/ti/p/~protex000',
      email: 'protexgroupa@gmail.com',
      address: '88/9 หมู่ 12 ถนนบางนา-ตราด กม.15 ตำบลบางพลีใหญ่ อำเภอบางพลี จังหวัดสมุทรปราการ 10540',
      hours: 'จันทร์ – เสาร์ 08:00 – 17:30 น. (Service หลังการขายพร้อมดูแล 24/7)',
      contactPageUrl: 'contact.html',
    },
    customIntents: [
      {
        id: 'design-configurator',
        keywords: ['ออกแบบ', 'จำลองสี', 'สีแพล้นท์', 'คำนวณราคา', 'ใบเสนอราคา', 'ราคา', 'configurator', 'อุปกรณ์เสริม', 'งบประมาณ'],
        reply:
          'คุณสามารถทดลองจำลองสีโครงสร้างแพล้นท์ตามสีประจำองค์กร เลือกอุปกรณ์เสริม และคำนวณงบประมาณเบื้องต้นได้ทันทีที่หน้า **[ออกแบบแพล้นท์ (3D Color & Quote)](design-plant.html)** หรือโทรปรึกษาฝ่ายขายโดยตรงที่ **085-392-4448** ครับ',
      },
      {
        id: 'spare-parts',
        keywords: ['อะไหล่', 'พาร์ท', 'หัวเผา', 'ถุงกรอง', 'โหลดเซลล์', 'ใบกวน', 'spare', 'parts', 'ซ่อม'],
        reply:
          'PROTEX GROUP มีคลังอะไหล่แท้พร้อมจัดส่งด่วนทั่วประเทศ (ชุดใบกวน Mixer, ถุงกรอง Baghouse Nomex, หัวเผา Burner, Load Cell และชุด PLC) ดูรายการอะไหล่ได้ที่หน้า **[อะไหล่แท้ PROTEX](spare-parts.html)** หรือติดต่อฝ่าย Service โทร **085-392-4448** ครับ',
      },
      {
        id: 'after-sales',
        keywords: ['หลังการขาย', 'ประกัน', 'รับประกัน', 'pm', 'ซ่อมบำรุง', 'วิศวกร', 'ตั้งค่า', 'สอบเทียบ', 'calibration'],
        reply:
          'ทีมวิศวกร **Service หลังการขาย** ของ PROTEX GROUP พร้อมดูแลตรวจเช็ก PM, สอบเทียบระบบชั่งน้ำหนัก, อัปเกรดระบบควบคุม PLC/SCADA และแก้ไขปัญหาหน้างานทั่วประเทศ ดูรายละเอียดที่หน้า **[บริการหลังการขาย](after-sales.html)** หรือโทร **085-392-4448** ได้เลยครับ',
      },
      {
        id: 'promotions',
        keywords: ['โปรโมชั่น', 'ส่วนลด', 'แคมเปญ', 'ผ่อน', 'สิทธิพิเศษ', 'promotion'],
        reply:
          'ติดตามแคมเปญพิเศษ โปรโมชั่นอัปเกรดแพล้นท์รีไซเคิล RAP และส่วนลดอะไหล่ประจำเดือนได้ที่หน้า **[โปรโมชั่น & แคมเปญ](promotions.html)** ครับ',
      },
    ],
  };

  let knowledgeData = FALLBACK_KNOWLEDGE;
  let customAiProvider = null;
  let externalMoodSetter = null;

  /* -------------------- Escape & Markdown Lite Helper -------------------- */
  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatLiteMarkdown(text) {
    return esc(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br>');
  }

  /* ============================================================================
   * 1. 3D-SHADED WHITE & CRIMSON RED SVG FALLBACK (100% White-Red Theme)
   * - Displayed immediately and used if WebGL is unavailable
   * ============================================================================ */
  function getWhiteCrimsonAeroSVG(uid) {
    const id = uid || 'drone';
    return `
      <svg class="ptx-aero-svg" viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="ptxCeramicHead-${id}" cx="36%" cy="22%" r="74%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="48%" stop-color="#F8FAFC"/>
            <stop offset="82%" stop-color="#E2E8F0"/>
            <stop offset="100%" stop-color="#94A3B8"/>
          </radialGradient>
          <radialGradient id="ptxCeramicBody-${id}" cx="38%" cy="26%" r="76%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="52%" stop-color="#F1F5F9"/>
            <stop offset="85%" stop-color="#CBD5E1"/>
            <stop offset="100%" stop-color="#94A3B8"/>
          </radialGradient>
          <linearGradient id="ptxObsidianGlass-${id}" x1="20" y1="14" x2="60" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#18181B"/>
            <stop offset="40%" stop-color="#09090B"/>
            <stop offset="100%" stop-color="#000000"/>
          </linearGradient>
          <linearGradient id="ptxGlassSheen-${id}" x1="24" y1="14" x2="56" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="rgba(255,255,255,0.68)"/>
            <stop offset="50%" stop-color="rgba(255,255,255,0.12)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
          </linearGradient>
          <linearGradient id="ptxRubyEye-${id}" x1="24" y1="20" x2="56" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFE4E6"/>
            <stop offset="30%" stop-color="#FF2A4B"/>
            <stop offset="100%" stop-color="#DC2626"/>
          </linearGradient>
          <linearGradient id="ptxRubyCore-${id}" x1="34" y1="44" x2="46" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FECDD3"/>
            <stop offset="35%" stop-color="#FF2A4B"/>
            <stop offset="100%" stop-color="#DC2626"/>
          </linearGradient>
          <linearGradient id="ptxOrbitGrad-${id}" x1="6" y1="48" x2="74" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#DC2626" stop-opacity="0.95"/>
            <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#FF2A4B" stop-opacity="0.95"/>
          </linearGradient>
          <radialGradient id="ptxThruster-${id}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FF2A4B" stop-opacity="0.82"/>
            <stop offset="52%" stop-color="#DC2626" stop-opacity="0.32"/>
            <stop offset="100%" stop-color="#DC2626" stop-opacity="0"/>
          </radialGradient>
          <filter id="ptxRubyGlow-${id}" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.6" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Soft Crimson Hover Thruster Glow -->
        <g class="ptx-aero-thruster">
          <ellipse cx="40" cy="79" rx="22" ry="5.5" fill="url(#ptxThruster-${id})"/>
          <ellipse cx="40" cy="78.5" rx="10" ry="2.2" fill="#FFE4E6" opacity="0.88"/>
        </g>

        <g class="ptx-aero-levitate">
          <!-- Back 3D Orbiting Crimson-White Ring -->
          <g class="ptx-aero-orbit">
            <path d="M9 49C9 43.2 22.9 38.5 40 38.5C57.1 38.5 71 43.2 71 49"
                  stroke="url(#ptxOrbitGrad-${id})" stroke-width="1.2" stroke-dasharray="3 3" opacity="0.45"/>
          </g>

          <!-- Floating Magnetic Side Pods (Pearl White & Ruby Crimson) -->
          <g class="ptx-aero-fin-l">
            <path d="M16.5 39C12.8 40.5 10.5 46.5 12.2 54.5C13.3 59.5 16.5 61 18.5 58.2C20.2 55.8 20.4 44.5 18.8 40.2C18.2 38.8 17.4 38.6 16.5 39Z"
                  fill="url(#ptxCeramicBody-${id})"/>
            <path d="M13.4 44.5C12.6 48 12.9 52.5 14.2 56" stroke="#DC2626" stroke-width="1.6" stroke-linecap="round"/>
          </g>

          <g class="ptx-aero-fin-r">
            <path d="M63.5 39C67.2 40.5 69.5 46.5 67.8 54.5C66.7 59.5 63.5 61 61.5 58.2C59.8 55.8 59.6 44.5 61.2 40.2C61.8 38.8 62.6 38.6 63.5 39Z"
                  fill="url(#ptxCeramicBody-${id})"/>
            <path d="M66.6 44.5C67.4 48 67.1 52.5 65.8 56" stroke="#DC2626" stroke-width="1.6" stroke-linecap="round"/>
          </g>

          <!-- Tapered 3D Pearl White Ceramic Torso -->
          <g class="ptx-aero-pod-body">
            <ellipse cx="40" cy="70.5" rx="7.5" ry="2.8" fill="#09090B"/>
            <ellipse cx="40" cy="71" rx="4.8" ry="1.5" fill="#FF2A4B" filter="url(#ptxRubyGlow-${id})"/>
            <path d="M23.5 39.5C23.5 37.2 30.8 36 40 36C49.2 36 56.5 37.2 56.5 39.5C56.5 52.5 49.5 68.5 40 70.5C30.5 68.5 23.5 52.5 23.5 39.5Z"
                  fill="url(#ptxCeramicBody-${id})"/>
            <path d="M26.5 41C26.8 50 31.2 61.5 37.5 66.8"
                  stroke="rgba(255,255,255,0.88)" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M25.2 44.5C25.8 49.5 27.5 55.2 30.2 59.8" stroke="#DC2626" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M54.8 44.5C54.2 49.5 52.5 55.2 49.8 59.8" stroke="#DC2626" stroke-width="1.4" stroke-linecap="round"/>

            <!-- Glowing Ruby "X" Chest Core -->
            <g class="ptx-aero-x-core" filter="url(#ptxRubyGlow-${id})">
              <circle cx="40" cy="51.5" r="6.2" fill="#09090B"/>
              <circle cx="40" cy="51.5" r="5.8" stroke="rgba(255,255,255,0.22)" stroke-width="0.7"/>
              <path d="M36.8 48.5L43.2 54.5M43.2 48.5L36.8 54.5"
                    stroke="url(#ptxRubyCore-${id})" stroke-width="2.2" stroke-linecap="round"/>
              <circle cx="40" cy="51.5" r="1.1" fill="#FFFFFF"/>
            </g>
          </g>

          <!-- 3D Domed Head & Curved Obsidian Glass Visor -->
          <g class="ptx-aero-head">
            <ellipse cx="40" cy="36" rx="13.5" ry="2.2" fill="#09090B" opacity="0.28"/>
            <path d="M17.5 24.5C17.5 13.8 26.8 7.5 40 7.5C53.2 7.5 62.5 13.8 62.5 24.5C62.5 32.6 54.2 36.2 40 36.2C25.8 36.2 17.5 32.6 17.5 24.5Z"
                  fill="url(#ptxCeramicHead-${id})"/>
            <path d="M25.5 13.2C32 9.6 48 9.6 54.5 13.2"
                  stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="0.92"/>
            <rect x="36.5" y="9.2" width="7" height="2" rx="1" fill="#DC2626"/>
            <rect x="16.5" y="21.5" width="2" height="7" rx="1" fill="#DC2626" opacity="0.9"/>
            <rect x="61.5" y="21.5" width="2" height="7" rx="1" fill="#DC2626" opacity="0.9"/>

            <rect x="20.5" y="15.5" width="39" height="19.5" rx="9.75" fill="url(#ptxObsidianGlass-${id})"/>
            <rect x="20.5" y="15.5" width="39" height="19.5" rx="9.75" stroke="rgba(255,255,255,0.22)" stroke-width="0.9"/>
            <path d="M23.5 19.5C30 16.8 50 16.8 56.5 19.5"
                  stroke="url(#ptxGlassSheen-${id})" stroke-width="2" stroke-linecap="round"/>

            <!-- IDLE RUBY RED LED EYES -->
            <g class="ptx-visor-face ptx-visor--idle" filter="url(#ptxRubyGlow-${id})">
              <g class="ptx-aero-eyes-blink">
                <rect x="27" y="22" width="9.5" height="5.6" rx="2.8" fill="url(#ptxRubyEye-${id})" transform="rotate(-4 31.7 24.8)"/>
                <ellipse cx="30.5" cy="23.8" rx="2.2" ry="0.9" fill="#FFFFFF" opacity="0.92"/>
                <rect x="43.5" y="22" width="9.5" height="5.6" rx="2.8" fill="url(#ptxRubyEye-${id})" transform="rotate(4 48.2 24.8)"/>
                <ellipse cx="47" cy="23.8" rx="2.2" ry="0.9" fill="#FFFFFF" opacity="0.92"/>
              </g>
              <rect x="37" y="30.2" width="6" height="1.5" rx="0.75" fill="#FF2A4B" opacity="0.8"/>
            </g>

            <!-- HAPPY RUBY RED CURVED EYES (^ ^) -->
            <g class="ptx-visor-face ptx-visor--happy" filter="url(#ptxRubyGlow-${id})">
              <path d="M27.2 26.5C29.2 21.8 34.8 21.8 36.8 26.5" stroke="#FF2A4B" stroke-width="2.6" stroke-linecap="round"/>
              <path d="M43.2 26.5C45.2 21.8 50.8 21.8 52.8 26.5" stroke="#FF2A4B" stroke-width="2.6" stroke-linecap="round"/>
              <path d="M36.5 30C38.2 32.4 41.8 32.4 43.5 30" stroke="#FECDD3" stroke-width="1.8" stroke-linecap="round"/>
            </g>

            <!-- THINKING RUBY RED WAVEFORM -->
            <g class="ptx-visor-face ptx-visor--thinking" filter="url(#ptxRubyGlow-${id})">
              <rect class="ptx-wave-bar-1" x="29" y="21.5" width="2.4" height="7" rx="1.2" fill="#DC2626"/>
              <rect class="ptx-wave-bar-2" x="34" y="19.5" width="2.4" height="11" rx="1.2" fill="#FF2A4B"/>
              <rect class="ptx-wave-bar-3" x="39" y="18.5" width="2.4" height="13" rx="1.2" fill="#FFFFFF"/>
              <rect class="ptx-wave-bar-4" x="44" y="19.5" width="2.4" height="11" rx="1.2" fill="#FF2A4B"/>
              <rect class="ptx-wave-bar-5" x="49" y="21.5" width="2.4" height="7" rx="1.2" fill="#DC2626"/>
            </g>
          </g>

          <!-- Front 3D Orbiting Crimson-White Ring -->
          <g class="ptx-aero-orbit" filter="url(#ptxRubyGlow-${id})">
            <path d="M9 49C9 54.8 22.9 59.5 40 59.5C57.1 59.5 71 54.8 71 49"
                  stroke="url(#ptxOrbitGrad-${id})" stroke-width="1.6" stroke-linecap="round"/>
            <circle class="ptx-aero-orbit-node" cx="40" cy="59.5" r="2.1" fill="#FFFFFF"/>
          </g>
        </g>
      </svg>
    `;
  }

  /* ============================================================================
   * 2. 100% WHITE-RED 3D HEAD AVATAR SVG (For Chat Header & In-Chat Bot Messages)
   * ============================================================================ */
  function getAeroAvatarSVG(uid) {
    const id = uid || 'av';
    return `
      <svg class="ptx-avatar-head-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <radialGradient id="ptxAvCeramic-${id}" cx="35%" cy="22%" r="75%">
            <stop offset="0%" stop-color="#FFFFFF"/>
            <stop offset="52%" stop-color="#F8FAFC"/>
            <stop offset="85%" stop-color="#E2E8F0"/>
            <stop offset="100%" stop-color="#94A3B8"/>
          </radialGradient>
          <linearGradient id="ptxAvGlass-${id}" x1="12" y1="18" x2="52" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#18181B"/>
            <stop offset="45%" stop-color="#09090B"/>
            <stop offset="100%" stop-color="#000000"/>
          </linearGradient>
        </defs>

        <!-- 3D Pearl White Ceramic Head Pod -->
        <path d="M8 33C8 18.5 19.8 10 32 10C44.2 10 56 18.5 56 33C56 44.5 46.2 50 32 50C17.8 50 8 44.5 8 33Z"
              fill="url(#ptxAvCeramic-${id})"/>

        <!-- Top Specular Highlight & Ruby Crown Crest -->
        <path d="M18 17.5C25 13 39 13 46 17.5" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity="0.92"/>
        <rect x="27.5" y="12.2" width="9" height="2.4" rx="1.2" fill="#DC2626"/>

        <!-- Side Ruby Crimson Acoustic Pods -->
        <rect x="6.5" y="29" width="2.2" height="8" rx="1.1" fill="#DC2626"/>
        <rect x="55.3" y="29" width="2.2" height="8" rx="1.1" fill="#DC2626"/>

        <!-- Curved Obsidian Gloss Visor -->
        <rect x="12.5" y="21" width="39" height="22" rx="11" fill="url(#ptxAvGlass-${id})" stroke="rgba(255,255,255,0.24)" stroke-width="1"/>
        <path d="M17 25.5C24 22.5 40 22.5 47 25.5" stroke="rgba(255,255,255,0.38)" stroke-width="1.6" stroke-linecap="round"/>

        <!-- Glowing Ruby Red LED Eyes -->
        <rect x="19" y="28.5" width="10" height="6" rx="3" fill="#FF2A4B" transform="rotate(-4 24 31.5)"/>
        <ellipse cx="22.8" cy="30.5" rx="2.3" ry="0.95" fill="#FFFFFF"/>
        <rect x="35" y="28.5" width="10" height="6" rx="3" fill="#FF2A4B" transform="rotate(4 40 31.5)"/>
        <ellipse cx="38.8" cy="30.5" rx="2.3" ry="0.95" fill="#FFFFFF"/>

        <!-- Subtle Ruby Voice Indicator -->
        <rect x="28.5" y="37.8" width="7" height="1.7" rx="0.85" fill="#EF4444"/>
      </svg>
    `;
  }

  /* ============================================================================
   * 3. REAL-TIME 3D WEBGL (THREE.JS) PROCEDURAL AERO-AI DRONE ENGINE
   * - Glossy Pearl White Ceramic (`MeshPhysicalMaterial`, clearcoat: 1.0)
   * - Curved Obsidian Glass Visor + Emissive Glowing Ruby Red Eyes (`#FF2A4B`)
   * - 3D Glowing Ruby "X" Chest Core + 3D Orbiting Crimson Ring + Side Pods
   * ============================================================================ */
  function loadThreeJsScript() {
    if (window.THREE) return Promise.resolve(window.THREE);
    return new Promise((resolve, reject) => {
      let idx = 0;
      function tryNext() {
        if (idx >= THREE_CDN_URLS.length) {
          reject(new Error('Three.js CDN unreachable'));
          return;
        }
        const s = document.createElement('script');
        s.src = THREE_CDN_URLS[idx++];
        s.async = true;
        s.onload = () => (window.THREE ? resolve(window.THREE) : tryNext());
        s.onerror = tryNext;
        document.head.appendChild(s);
      }
      tryNext();
    });
  }

  function initThreeJsAeroDrone(stageEl, rootEl, launcherBtn) {
    loadThreeJsScript()
      .then((THREE) => {
        if (!stageEl || !THREE) return;

        let renderer;
        try {
          renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
          });
        } catch (err) {
          return; // Keep 3D-shaded SVG fallback if WebGL context cannot be created
        }

        const width = 96;
        const height = 96;
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, 0);
        if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
          renderer.outputColorSpace = THREE.SRGBColorSpace;
        }

        const canvas = renderer.domElement;
        canvas.className = 'ptx-3d-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        stageEl.appendChild(canvas);
        rootEl.classList.add('has-webgl');

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
        camera.position.set(0, 0.15, 5.4);
        camera.lookAt(0, 0.05, 0);

        /* ---------- 3-Point Studio Lighting (White + Crimson Rim) ---------- */
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffe4e6, 1.35);
        scene.add(hemiLight);

        const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
        keyLight.position.set(3.2, 4.5, 4.2);
        scene.add(keyLight);

        const crimsonRimLight = new THREE.PointLight(0xff2a4b, 2.8, 12);
        crimsonRimLight.position.set(-3.0, 1.4, -2.2);
        scene.add(crimsonRimLight);

        const frontFillLight = new THREE.DirectionalLight(0xfff1f2, 0.95);
        frontFillLight.position.set(-2.0, -1.5, 3.5);
        scene.add(frontFillLight);

        /* ---------- PBR Materials (100% Pearl White & Crimson Red) ---------- */
        const MatClass = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial;

        const pearlCeramicMat = new MatClass({
          color: 0xffffff,
          roughness: 0.14,
          metalness: 0.08,
          clearcoat: 1.0,
          clearcoatRoughness: 0.07,
        });

        const darkObsidianGlassMat = new MatClass({
          color: 0x09090b,
          roughness: 0.07,
          metalness: 0.18,
          clearcoat: 1.0,
          clearcoatRoughness: 0.04,
        });

        const crimsonArmorMat = new MatClass({
          color: 0xdc2626,
          roughness: 0.2,
          metalness: 0.15,
          clearcoat: 0.9,
          clearcoatRoughness: 0.1,
        });

        const rubyGlowMat = new THREE.MeshStandardMaterial({
          color: 0xff2a4b,
          emissive: 0xdc2626,
          emissiveIntensity: 2.1,
          roughness: 0.18,
          metalness: 0.05,
        });

        const whiteSparkMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
        });

        /* ---------- Build 3D Aero-AI Drone Hierarchy ---------- */
        const droneRoot = new THREE.Group();
        scene.add(droneRoot);

        // 1. HEAD GROUP (Aerodynamic Pearl White Dome + Curved Obsidian Visor + Ruby Eyes)
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.62, 0);
        droneRoot.add(headGroup);

        const headDome = new THREE.Mesh(new THREE.SphereGeometry(0.76, 36, 28), pearlCeramicMat);
        headDome.scale.set(1.06, 0.84, 0.95);
        headGroup.add(headDome);

        // Ruby Crimson Crown Crest on Top of Helmet
        const crownCrest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.34), crimsonArmorMat);
        crownCrest.position.set(0, 0.61, 0.12);
        crownCrest.rotation.x = 0.22;
        headGroup.add(crownCrest);

        // Side Acoustic Ear Pods (White Ceramic + Ruby Red Accents)
        const earGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.14, 24);
        earGeo.rotateZ(Math.PI / 2);
        const leftEar = new THREE.Mesh(earGeo, crimsonArmorMat);
        leftEar.position.set(-0.78, -0.02, 0.02);
        headGroup.add(leftEar);

        const rightEar = new THREE.Mesh(earGeo, crimsonArmorMat);
        rightEar.position.set(0.78, -0.02, 0.02);
        headGroup.add(rightEar);

        // Curved Obsidian Glass Visor
        const visorMesh = new THREE.Mesh(new THREE.SphereGeometry(0.69, 32, 24), darkObsidianGlassMat);
        visorMesh.scale.set(0.96, 0.56, 0.65);
        visorMesh.position.set(0, -0.03, 0.33);
        headGroup.add(visorMesh);

        // 1A. IDLE RUBY RED LED EYES (Blinkable)
        const idleEyesGroup = new THREE.Group();
        idleEyesGroup.position.set(0, -0.01, 0.77);
        headGroup.add(idleEyesGroup);

        const eyeGeo = new THREE.SphereGeometry(0.12, 20, 16);
        const leftEye = new THREE.Mesh(eyeGeo, rubyGlowMat);
        leftEye.scale.set(1.25, 0.82, 0.35);
        leftEye.position.set(-0.23, 0.02, 0);
        leftEye.rotation.z = 0.08;
        idleEyesGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, rubyGlowMat);
        rightEye.scale.set(1.25, 0.82, 0.35);
        rightEye.position.set(0.23, 0.02, 0);
        rightEye.rotation.z = -0.08;
        idleEyesGroup.add(rightEye);

        // Specular White Eye Highlights
        const sparkGeo = new THREE.SphereGeometry(0.036, 12, 12);
        const leftSpark = new THREE.Mesh(sparkGeo, whiteSparkMat);
        leftSpark.position.set(-0.26, 0.05, 0.045);
        idleEyesGroup.add(leftSpark);

        const rightSpark = new THREE.Mesh(sparkGeo, whiteSparkMat);
        rightSpark.position.set(0.2, 0.05, 0.045);
        idleEyesGroup.add(rightSpark);

        // 1B. HAPPY CURVED RUBY EYES (^ ^) — Visible when Chat is Open
        const happyEyesGroup = new THREE.Group();
        happyEyesGroup.position.set(0, -0.03, 0.77);
        happyEyesGroup.visible = false;
        headGroup.add(happyEyesGroup);

        const happyArcGeo = new THREE.TorusGeometry(0.125, 0.036, 14, 24, Math.PI * 0.85);
        const leftHappyArc = new THREE.Mesh(happyArcGeo, rubyGlowMat);
        leftHappyArc.position.set(-0.23, -0.02, 0);
        leftHappyArc.rotation.z = Math.PI * 0.075;
        happyEyesGroup.add(leftHappyArc);

        const rightHappyArc = new THREE.Mesh(happyArcGeo, rubyGlowMat);
        rightHappyArc.position.set(0.23, -0.02, 0);
        rightHappyArc.rotation.z = Math.PI * 0.075;
        happyEyesGroup.add(rightHappyArc);

        // 2. TORSO POD GROUP (Tapered Aerodynamic Pearl White Pod + Ruby "X" Chest Core)
        const bodyGroup = new THREE.Group();
        bodyGroup.position.set(0, -0.36, 0);
        droneRoot.add(bodyGroup);

        const torsoMesh = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 28), pearlCeramicMat);
        torsoMesh.scale.set(0.92, 1.18, 0.84);
        bodyGroup.add(torsoMesh);

        // Dark Obsidian Chest Core Bezel
        const coreBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 24), darkObsidianGlassMat);
        coreBezel.rotation.x = Math.PI / 2;
        coreBezel.position.set(0, 0.08, 0.49);
        bodyGroup.add(coreBezel);

        // PROTEX Signature 3D Glowing Ruby "X" Core on Chest
        const xCoreGroup = new THREE.Group();
        xCoreGroup.position.set(0, 0.08, 0.535);
        bodyGroup.add(xCoreGroup);

        const xBarGeo = new THREE.BoxGeometry(0.28, 0.055, 0.04);
        const xBar1 = new THREE.Mesh(xBarGeo, rubyGlowMat);
        xBar1.rotation.z = Math.PI / 4;
        xCoreGroup.add(xBar1);

        const xBar2 = new THREE.Mesh(xBarGeo, rubyGlowMat);
        xBar2.rotation.z = -Math.PI / 4;
        xCoreGroup.add(xBar2);

        const xCenterDot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), whiteSparkMat);
        xCenterDot.position.set(0, 0, 0.025);
        xCoreGroup.add(xCenterDot);

        // Bottom Hover Thruster Emitter Ring (Soft Crimson Glow)
        const thrusterMesh = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 12, 24), rubyGlowMat);
        thrusterMesh.rotation.x = Math.PI / 2;
        thrusterMesh.position.set(0, -0.76, 0);
        bodyGroup.add(thrusterMesh);

        // 3. FLOATING MAGNETIC SIDE PODS (Pearl White + Crimson Red Trim)
        const leftFinGroup = new THREE.Group();
        leftFinGroup.position.set(-0.78, -0.32, 0);
        droneRoot.add(leftFinGroup);

        const finGeo = new THREE.SphereGeometry(0.22, 20, 18);
        const leftFinMesh = new THREE.Mesh(finGeo, pearlCeramicMat);
        leftFinMesh.scale.set(0.45, 1.55, 0.72);
        leftFinMesh.rotation.z = 0.16;
        leftFinGroup.add(leftFinMesh);

        const leftFinStripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.12), rubyGlowMat);
        leftFinStripe.position.set(-0.07, 0, 0.08);
        leftFinStripe.rotation.z = 0.16;
        leftFinGroup.add(leftFinStripe);

        const rightFinGroup = new THREE.Group();
        rightFinGroup.position.set(0.78, -0.32, 0);
        droneRoot.add(rightFinGroup);

        const rightFinMesh = new THREE.Mesh(finGeo, pearlCeramicMat);
        rightFinMesh.scale.set(0.45, 1.55, 0.72);
        rightFinMesh.rotation.z = -0.16;
        rightFinGroup.add(rightFinMesh);

        const rightFinStripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.36, 0.12), rubyGlowMat);
        rightFinStripe.position.set(0.07, 0, 0.08);
        rightFinStripe.rotation.z = -0.16;
        rightFinGroup.add(rightFinStripe);

        // 4. 3D ORBITING CRIMSON & PEARL HOLOGRAM RING
        const orbitPivot = new THREE.Group();
        orbitPivot.position.set(0, -0.34, 0);
        orbitPivot.rotation.x = 1.22;
        orbitPivot.rotation.y = -0.22;
        droneRoot.add(orbitPivot);

        const orbitRingMesh = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.024, 14, 64), rubyGlowMat);
        orbitPivot.add(orbitRingMesh);

        const photon1 = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14), whiteSparkMat);
        photon1.position.set(1.06, 0, 0);
        orbitPivot.add(photon1);

        const photon2 = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 14), crimsonArmorMat);
        photon2.position.set(-1.06, 0, 0);
        orbitPivot.add(photon2);

        /* ---------- Interactive Hover & Click Spin State ---------- */
        let isHovered = false;
        let pointerX = 0;
        let pointerY = 0;
        let spinProgress = 1; // 1 = not spinning, 0..1 = 360° spin

        launcherBtn.addEventListener('pointerenter', () => {
          isHovered = true;
        });

        launcherBtn.addEventListener('pointermove', (e) => {
          const rect = launcherBtn.getBoundingClientRect();
          pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        });

        launcherBtn.addEventListener('pointerleave', () => {
          isHovered = false;
          pointerX = 0;
          pointerY = 0;
        });

        launcherBtn.addEventListener('click', () => {
          spinProgress = 0;
        });

        /* ---------- 60fps requestAnimationFrame Loop ---------- */
        let lastTime = performance.now();
        let elapsed = 0;
        let currentScale = 1;
        let currentHeadRotX = 0;
        let currentHeadRotY = 0;

        function animate(now) {
          requestAnimationFrame(animate);
          if (document.hidden) {
            lastTime = now;
            return;
          }

          const dt = Math.min((now - lastTime) / 1000, 0.1);
          lastTime = now;
          elapsed += dt;

          const mood = rootEl.getAttribute('data-robot-mood') || 'greeting';
          const isHappy = mood === 'happy';
          const isThinking = mood === 'thinking';

          // Toggle 3D Visor Eyes: Happy Curved Arcs (^ ^) vs Idle Blinking Eyes
          idleEyesGroup.visible = !isHappy;
          happyEyesGroup.visible = isHappy;

          // Natural Eye Blinking in Idle/Thinking Mode
          const blinkCycle = elapsed % 4.2;
          let blinkScaleY = 1;
          if (!isHappy && blinkCycle > 3.95 && blinkCycle < 4.12) {
            blinkScaleY = 0.12;
          } else if (isThinking) {
            blinkScaleY = 0.65 + Math.sin(elapsed * 14) * 0.35;
          }
          idleEyesGroup.scale.y = blinkScaleY;

          // 3D Sine-Wave Levitation
          const floatOffset = Math.sin(elapsed * 2.2) * 0.11;
          let hopOffset = 0;
          let spinAngle = 0;

          if (spinProgress < 1) {
            spinProgress = Math.min(1, spinProgress + dt * 1.65);
            const easeOut = 1 - Math.pow(1 - spinProgress, 3);
            spinAngle = easeOut * Math.PI * 2;
            hopOffset = Math.sin(spinProgress * Math.PI) * 0.24;
          }

          droneRoot.position.y = floatOffset + hopOffset + (isHovered ? 0.08 : 0);

          // Smooth Hover Scale
          const targetScale = isHovered ? 1.09 : 1.0;
          currentScale += (targetScale - currentScale) * Math.min(1, dt * 10);
          droneRoot.scale.setScalar(currentScale);

          // 3D Body Yaw & Interactive Head Tilt/Nod on Hover
          const baseYaw = Math.sin(elapsed * 1.15) * 0.22;
          droneRoot.rotation.y = baseYaw + spinAngle + (isHovered ? pointerX * 0.25 : 0);

          const targetHeadY = isHovered ? pointerX * 0.35 : Math.sin(elapsed * 1.4) * 0.12;
          const targetHeadX = isHovered ? pointerY * 0.25 - 0.08 : Math.sin(elapsed * 2.2) * 0.06;
          currentHeadRotY += (targetHeadY - currentHeadRotY) * Math.min(1, dt * 10);
          currentHeadRotX += (targetHeadX - currentHeadRotX) * Math.min(1, dt * 10);
          headGroup.rotation.y = currentHeadRotY;
          headGroup.rotation.x = currentHeadRotX;
          headGroup.rotation.z = Math.sin(elapsed * 1.8) * 0.045;

          // Delayed Zero-Gravity Side Pods
          const finWave = Math.sin(elapsed * 2.2 - 0.65) * 0.07;
          leftFinGroup.position.y = -0.32 + finWave;
          rightFinGroup.position.y = -0.32 + finWave;

          // 3D Orbiting Crimson Ring Rotation
          const orbitSpeed = isThinking ? 5.8 : isHovered ? 3.4 : 1.6;
          orbitPivot.rotation.z += dt * orbitSpeed;
          orbitPivot.rotation.y = -0.22 + Math.sin(elapsed * 1.5) * 0.14;

          // Emissive Glow Pulse on Ruby Eyes & Chest "X" Core
          if (isThinking) {
            rubyGlowMat.emissiveIntensity = 1.8 + Math.sin(elapsed * 12) * 0.9;
          } else if (isHovered) {
            rubyGlowMat.emissiveIntensity = 2.7;
          } else {
            rubyGlowMat.emissiveIntensity = 1.9 + Math.sin(elapsed * 2.5) * 0.35;
          }

          // Bottom Thruster Breathing
          const thrusterScale = 0.88 + Math.sin(elapsed * 2.2) * 0.14;
          thrusterMesh.scale.set(thrusterScale, thrusterScale, 1);

          renderer.render(scene, camera);
        }

        requestAnimationFrame(animate);
      })
      .catch(() => {
        // Keep 3D-shaded White-Crimson SVG fallback active
      });
  }

  /* -------------------- Load Knowledge Base JSON -------------------- */
  async function loadKnowledgeBase() {
    try {
      const stored = localStorage.getItem('ptx_cms_collection_chatbot-knowledge');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          knowledgeData = parsed;
          return knowledgeData;
        }
      }
    } catch (e) {}

    try {
      const apiRes = await fetch(`/api/chatbot-knowledge?_t=${Date.now()}`, { cache: 'no-store' });
      if (apiRes.ok) {
        knowledgeData = await apiRes.json();
        return knowledgeData;
      }
    } catch (e) {}

    try {
      const localRes = await fetch(`../backend/data/chatbot-knowledge.json?_t=${Date.now()}`, { cache: 'no-store' });
      if (localRes.ok) {
        knowledgeData = await localRes.json();
        return knowledgeData;
      }
    } catch (err) {}

    knowledgeData = FALLBACK_KNOWLEDGE;
    return knowledgeData;
  }

  /* -------------------- Rich Reply Builders -------------------- */
  function buildFullHotPlantsReply(kb, filterModel) {
    const list = kb.fullHotPlants || FALLBACK_KNOWLEDGE.fullHotPlants;
    const items = filterModel ? list.filter((p) => p.model.toLowerCase().includes(filterModel)) : list;
    const cardsHtml = items
      .map(
        (p) => `
        <div class="ptx-chat-spec-card">
          <div class="ptx-chat-spec-card__head">
            <span class="ptx-chat-spec-card__model">${esc(p.model)}</span>
            <span class="ptx-chat-spec-card__badge">${esc(p.capacity)}</span>
          </div>
          <div class="ptx-chat-spec-card__meta">
            Mixer: <strong>${esc(p.mixerSize)}</strong> · กำลังไฟรวม: <strong>${esc(p.totalPower)}</strong> · ${esc(p.rapCapability)}
          </div>
          <div class="ptx-chat-spec-card__meta">${esc(p.highlight)}</div>
        </div>`
      )
      .join('');

    return `
      <p><strong>แพล้นท์ยางมะตอยเต็มระบบ (Fully Hot In Plant)</strong> ของ PROTEX GROUP ออกแบบตามมาตรฐานกรมทางหลวงและ ทช. มี 3 รุ่นหลักดังนี้ครับ:</p>
      <div class="ptx-chat-cards">${cardsHtml}</div>
      <div class="ptx-chat-action-links">
        <a href="index.html#fully-hot" class="ptx-chat-action-btn">ดูสเปกเต็มหน้าหลัก</a>
        <a href="design-plant.html" class="ptx-chat-action-btn ptx-chat-action-btn--ghost">จำลองสี &amp; ขอใบเสนอราคา</a>
      </div>
    `;
  }

  function buildRecyclePlantsReply(kb) {
    const list = kb.recyclePlants || FALLBACK_KNOWLEDGE.recyclePlants;
    const cardsHtml = list
      .map(
        (p) => `
        <div class="ptx-chat-spec-card">
          <div class="ptx-chat-spec-card__head">
            <span class="ptx-chat-spec-card__model">${esc(p.model)}</span>
            <span class="ptx-chat-spec-card__badge">${esc(p.capacity)}</span>
          </div>
          <div class="ptx-chat-spec-card__meta">
            กำลังไฟรวม: <strong>${esc(p.totalPower)}</strong> · ${esc(p.rapRatio)}
          </div>
          <div class="ptx-chat-spec-card__meta">${esc(p.highlight)}</div>
        </div>`
      )
      .join('');

    return `
      <p><strong>แพล้นท์รีไซเคิลยางมะตอยร้อน (Hot Re In Plant)</strong> ช่วยลดต้นทุนวัตถุดิบใหม่และเป็นมิตรต่อสิ่งแวดล้อม มี 2 รุ่นหลักครับ:</p>
      <div class="ptx-chat-cards">${cardsHtml}</div>
      <div class="ptx-chat-action-links">
        <a href="index.html#hot-re" class="ptx-chat-action-btn">ดูระบบรีไซเคิล RAP</a>
        <a href="tel:0853924448" class="ptx-chat-action-btn ptx-chat-action-btn--ghost">โทรปรึกษาวิศวกร</a>
      </div>
    `;
  }

  function buildInstallationsReply(kb) {
    const list = kb.installations || FALLBACK_KNOWLEDGE.installations;
    const cardsHtml = list
      .map(
        (inst) => `
        <div class="ptx-chat-spec-card">
          <div class="ptx-chat-spec-card__head">
            <span class="ptx-chat-spec-card__model">${esc(inst.company)}</span>
            <span class="ptx-chat-spec-card__badge">${esc(inst.model)}</span>
          </div>
          <div class="ptx-chat-spec-card__meta">
            พื้นที่ติดตั้ง: <strong>${esc(inst.province)}</strong> (${esc(inst.region)}) · <a href="${esc(inst.googleMapsUrl)}" target="_blank" rel="noopener noreferrer">แผนที่ Google Maps ↗</a>
          </div>
        </div>`
      )
      .join('');

    return `
      <p><strong>ผลงานติดตั้งจริงที่ได้รับความไว้วางใจ</strong> จากลูกค้ารายใหญ่ทั่วประเทศของ PROTEX GROUP ได้แก่:</p>
      <div class="ptx-chat-cards">${cardsHtml}</div>
      <div class="ptx-chat-action-links">
        <a href="service-plants.html" class="ptx-chat-action-btn">ดูแผนที่ผลงานติดตั้งจริงทั้งหมด</a>
      </div>
    `;
  }

  function buildContactReply(kb) {
    const c = kb.contact || FALLBACK_KNOWLEDGE.contact;
    return `
      <p>ติดต่อทีมวิศวกรฝ่ายขายและ <strong>Service หลังการขาย PROTEX GROUP</strong> ได้โดยตรงทุกช่องทางครับ:</p>
      <div class="ptx-chat-cards">
        <div class="ptx-chat-spec-card">
          <div class="ptx-chat-spec-card__head">
            <span class="ptx-chat-spec-card__model">ฝ่ายขาย &amp; Service หลังการขาย</span>
            <span class="ptx-chat-spec-card__badge">24/7 Support</span>
          </div>
          <div class="ptx-chat-spec-card__meta">โทรศัพท์: <a href="tel:${esc(c.phoneClean)}"><strong>${esc(c.phone)}</strong></a></div>
          <div class="ptx-chat-spec-card__meta">LINE Official: <a href="${esc(c.lineUrl)}" target="_blank" rel="noopener noreferrer"><strong>${esc(c.lineId)}</strong></a></div>
          <div class="ptx-chat-spec-card__meta">อีเมล: <a href="mailto:${esc(c.email)}"><strong>${esc(c.email)}</strong></a></div>
        </div>
      </div>
      <div class="ptx-chat-action-links">
        <a href="tel:${esc(c.phoneClean)}" class="ptx-chat-action-btn">โทร ${esc(c.phone)}</a>
        <a href="${esc(c.lineUrl)}" target="_blank" rel="noopener noreferrer" class="ptx-chat-action-btn ptx-chat-action-btn--ghost">แอดไลน์ ${esc(c.lineId)}</a>
        <a href="contact.html" class="ptx-chat-action-btn ptx-chat-action-btn--ghost">หน้าติดต่อสอบถาม</a>
      </div>
    `;
  }

  /* ============================================================================
   * CORE AI ENGINE: `async getBotReply(userMessage)`
   * - Cleanly isolated so you can plug in Gemini API / OpenAI API / Backend LLM
   *   in the future without changing any UI code.
   * ============================================================================ */
  async function getBotReply(userMessage) {
    const raw = String(userMessage || '').trim();
    const q = raw.toLowerCase();
    const kb = knowledgeData || FALLBACK_KNOWLEDGE;

    if (typeof customAiProvider === 'function') {
      try {
        const externalReply = await customAiProvider(raw, kb);
        if (externalReply) return externalReply;
      } catch (err) {
        console.warn('Custom AI provider fallback to local knowledge:', err);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 420));

    if (q.includes('3015')) return buildFullHotPlantsReply(kb, '3015');
    if (q.includes('2010')) return buildFullHotPlantsReply(kb, '2010');
    if (q.includes('1510')) return buildFullHotPlantsReply(kb, '1510');
    if (q.includes('rap50') || q.includes('rap 50') || q.includes('rap80') || q.includes('rap 80')) {
      return buildRecyclePlantsReply(kb);
    }

    if (
      q.includes('รีไซเคิล') ||
      q.includes('recycle') ||
      q.includes('hot re') ||
      (q.includes('rap') && !q.includes('รุ่นแพล้นท์ยางมะตอย'))
    ) {
      return buildRecyclePlantsReply(kb);
    }

    if (
      q.includes('รุ่นแพล้นท์') ||
      q.includes('แพล้นท์ยางมะตอย') ||
      q.includes('fully hot') ||
      q.includes('สเปก') ||
      q.includes('กำลังการผลิต') ||
      q.includes('มีรุ่นอะไร')
    ) {
      return buildFullHotPlantsReply(kb);
    }

    if (
      q.includes('ผลงาน') ||
      q.includes('ติดตั้งจริง') ||
      q.includes('ลูกค้า') ||
      q.includes('ชุมพร') ||
      q.includes('อุทัยธานี') ||
      q.includes('กำแพงเพชร') ||
      q.includes('สุรินทร์') ||
      q.includes('มรกต') ||
      q.includes('ธานีพัฒนา') ||
      q.includes('ศิระ') ||
      q.includes('อมรวัฒน์')
    ) {
      return buildInstallationsReply(kb);
    }

    if (
      q.includes('ติดต่อ') ||
      q.includes('เบอร์') ||
      q.includes('โทร') ||
      q.includes('ไลน์') ||
      q.includes('line') ||
      q.includes('อีเมล') ||
      q.includes('email') ||
      q.includes('ที่อยู่') ||
      q.includes('สำนักงาน') ||
      q.includes('ฝ่ายขาย') ||
      q.includes('service')
    ) {
      return buildContactReply(kb);
    }

    const intents = kb.customIntents || FALLBACK_KNOWLEDGE.customIntents || [];
    for (const intent of intents) {
      if ((intent.keywords || []).some((kw) => q.includes(kw.toLowerCase()))) {
        return `<p>${formatLiteMarkdown(intent.reply)}</p>`;
      }
    }

    if (q.includes('สวัสดี') || q.includes('hello') || q.includes('hi') || q.includes('หวัดดี')) {
      return `<p>${formatLiteMarkdown(kb.botProfile?.greeting || FALLBACK_KNOWLEDGE.botProfile.greeting)}</p>`;
    }

    const c = kb.contact || FALLBACK_KNOWLEDGE.contact;
    return `
      <p>ขอบคุณสำหรับคำถามครับ! ผมสามารถให้ข้อมูลเชิงลึกเกี่ยวกับ:</p>
      <ul>
        <li><strong>แพล้นท์ยางมะตอยเต็มระบบ:</strong> MODEL PT-1510RAP (110-130 T/H), PT-2010RAP (180-200 T/H), PT-3015RAP (300-320 T/H)</li>
        <li><strong>แพล้นท์รีไซเคิล RAP:</strong> MODEL RAP50 (50-60 t/h) และ MODEL RAP80 (70-80 t/h)</li>
        <li><strong>ผลงานติดตั้งจริง 4 จังหวัด:</strong> ชุมพร, อุทัยธานี, กำแพงเพชร และสุรินทร์</li>
      </ul>
      <p>หรือติดต่อวิศวกรโดยตรงได้ที่โทร <a href="tel:${esc(c.phoneClean)}"><strong>${esc(c.phone)}</strong></a> และ LINE <a href="${esc(c.lineUrl)}" target="_blank" rel="noopener noreferrer"><strong>${esc(c.lineId)}</strong></a> ครับ</p>
    `;
  }

  /* -------------------- Session History Helpers -------------------- */
  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(-30) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(messages) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch (e) {}
  }

  /* -------------------- UI Construction & Lifecycle -------------------- */
  async function initProtexChatbot() {
    if (document.getElementById('protexAiChatbot')) return;

    await loadKnowledgeBase();
    const kb = knowledgeData || FALLBACK_KNOWLEDGE;
    const chips = kb.quickChips || FALLBACK_KNOWLEDGE.quickChips;

    const root = document.createElement('aside');
    root.className = 'ptx-chatbot';
    root.id = 'protexAiChatbot';
    root.setAttribute('data-robot-mood', 'greeting');
    root.setAttribute('aria-label', 'ผู้ช่วยอัจฉริยะ PROTEX AI');

    root.innerHTML = `
      <!-- iOS 27 Liquid Glass Chat Window -->
      <section class="ptx-chatbot__window" id="ptxChatWindow" role="dialog" aria-modal="false" aria-labelledby="ptxChatTitle" aria-hidden="true">
        <header class="ptx-chatbot__header">
          <div class="ptx-chatbot__brand">
            <div class="ptx-chatbot__avatar">
              ${getAeroAvatarSVG('header')}
              <span class="ptx-chatbot__avatar-dot" aria-hidden="true"></span>
            </div>
            <div class="ptx-chatbot__title-group">
              <div class="ptx-chatbot__title-row">
                <h2 class="ptx-chatbot__title" id="ptxChatTitle">PROTEX AI</h2>
                <span class="ptx-chatbot__badge-ai">AI BOT</span>
              </div>
              <div class="ptx-chatbot__status">
                <span>ผู้ช่วยอัจฉริยะ · ตอบทันที 24 ชม.</span>
              </div>
            </div>
          </div>
          <div class="ptx-chatbot__header-actions">
            <button type="button" class="ptx-chatbot__icon-btn" id="ptxChatResetBtn" title="ล้างประวัติการสนทนา" aria-label="ล้างประวัติการสนทนา">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            </button>
            <button type="button" class="ptx-chatbot__icon-btn" id="ptxChatCloseBtn" title="ย่อหน้าต่างแชท" aria-label="ย่อหน้าต่างแชท">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </header>

        <div class="ptx-chatbot__feed" id="ptxChatFeed" role="log" aria-live="polite"></div>

        <div class="ptx-chatbot__chips" id="ptxChatChips" role="toolbar" aria-label="คำถามด่วน">
          ${chips
            .map(
              (c) =>
                `<button type="button" class="ptx-chatbot__chip" data-chip-query="${esc(c.query)}">${esc(c.label)}</button>`
            )
            .join('')}
        </div>

        <div class="ptx-chatbot__composer">
          <form class="ptx-chatbot__form" id="ptxChatForm" autocomplete="off">
            <input
              type="text"
              class="ptx-chatbot__input"
              id="ptxChatInput"
              placeholder="พิมพ์สอบถามรุ่นแพล้นท์, RAP, หรือบริการ…"
              aria-label="พิมพ์ข้อความสอบถาม PROTEX AI"
              maxlength="300"
            >
            <button type="submit" class="ptx-chatbot__send" aria-label="ส่งข้อความ">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m22 2-7 20-4-9-9-4Z"/>
                <path d="M22 2 11 13"/>
              </svg>
            </button>
          </form>
        </div>
      </section>

      <!-- Frameless 3D PROTEX Aero-AI Drone Launcher (Zero Hover Text) -->
      <div class="ptx-chatbot__launcher-wrap">
        <button type="button" class="ptx-chatbot__launcher" id="ptxChatLauncher" aria-expanded="false" aria-controls="ptxChatWindow" aria-label="เปิดผู้ช่วยอัจฉริยะ PROTEX AI">
          <div class="ptx-robot-stage" id="ptxRobot3DStage">
            <span class="ptx-robot-burst-ring" aria-hidden="true"></span>
            <div class="ptx-aero-fallback" aria-hidden="true">
              ${getWhiteCrimsonAeroSVG('launcher')}
            </div>
          </div>
        </button>
      </div>
    `;

    document.body.appendChild(root);

    const windowEl = document.getElementById('ptxChatWindow');
    const launcherBtn = document.getElementById('ptxChatLauncher');
    const stage3DEl = document.getElementById('ptxRobot3DStage');
    const closeBtn = document.getElementById('ptxChatCloseBtn');
    const resetBtn = document.getElementById('ptxChatResetBtn');
    const feedEl = document.getElementById('ptxChatFeed');
    const formEl = document.getElementById('ptxChatForm');
    const inputEl = document.getElementById('ptxChatInput');

    // Boot Real-Time 3D WebGL (Three.js) Drone
    initThreeJsAeroDrone(stage3DEl, root, launcherBtn);

    let history = loadHistory();
    let isBusy = false;
    let bounceTimer = null;

    function setRobotMood(mood, withBounce = false) {
      const validMood = ['greeting', 'happy', 'thinking'].includes(mood) ? mood : 'greeting';
      root.setAttribute('data-robot-mood', validMood);

      if (withBounce) {
        if (bounceTimer) clearTimeout(bounceTimer);
        root.classList.remove('is-bouncing');
        void root.offsetWidth;
        root.classList.add('is-bouncing');
        bounceTimer = setTimeout(() => {
          root.classList.remove('is-bouncing');
        }, 620);
      }
    }

    externalMoodSetter = setRobotMood;

    function scrollToBottom() {
      requestAnimationFrame(() => {
        feedEl.scrollTop = feedEl.scrollHeight;
      });
    }

    function buildWelcomeCardHTML() {
      return `
        <div class="ptx-welcome-card">
          <div class="ptx-welcome-card__head">
            <span class="ptx-welcome-card__sparkle" aria-hidden="true">✨</span>
            <span>PROTEX AI Engineering Assistant</span>
          </div>
          <p class="ptx-welcome-card__desc">เลือกหัวข้อที่คุณสนใจด้านล่าง หรือพิมพ์คำถามเพื่อให้ AI ช่วยค้นหาสเปกแพล้นท์และบริการได้ทันทีครับ</p>
          <div class="ptx-welcome-card__chips">
            ${chips
              .map(
                (c) =>
                  `<button type="button" class="ptx-welcome-chip" data-chip-query="${esc(c.query)}">${esc(c.label)}</button>`
              )
              .join('')}
          </div>
        </div>
      `;
    }

    function appendMessageDOM(role, htmlContent) {
      const row = document.createElement('div');
      row.className = `ptx-chat-msg ptx-chat-msg--${role}`;
      if (role === 'bot') {
        row.innerHTML = `
          <div class="ptx-chat-msg__avatar" aria-hidden="true">${getAeroAvatarSVG('msg')}</div>
          <div class="ptx-chat-msg__bubble">${htmlContent}</div>
        `;
      } else {
        row.innerHTML = `<div class="ptx-chat-msg__bubble">${htmlContent}</div>`;
      }
      feedEl.appendChild(row);
      scrollToBottom();
      return row;
    }

    function renderInitialFeed() {
      feedEl.innerHTML = buildWelcomeCardHTML();
      if (!history.length) {
        const greetingHtml = `<p>${formatLiteMarkdown(
          kb.botProfile?.greeting || FALLBACK_KNOWLEDGE.botProfile.greeting
        )}</p>`;
        history.push({ role: 'bot', html: greetingHtml });
        saveHistory(history);
      }
      history.forEach((m) => appendMessageDOM(m.role, m.html));
    }

    renderInitialFeed();

    function toggleChat(forceState) {
      const currentlyOpen = root.classList.contains('is-open');
      const nextOpen = typeof forceState === 'boolean' ? forceState : !currentlyOpen;
      if (nextOpen === currentlyOpen) return;

      root.classList.toggle('is-open', nextOpen);
      launcherBtn.setAttribute('aria-expanded', String(nextOpen));
      windowEl.setAttribute('aria-hidden', String(!nextOpen));

      if (nextOpen) {
        setRobotMood(isBusy ? 'thinking' : 'happy', true);
        scrollToBottom();
        setTimeout(() => inputEl?.focus(), 200);
      } else {
        setRobotMood('greeting', false);
      }
    }

    async function handleUserMessage(rawText) {
      const text = String(rawText || '').trim();
      if (!text || isBusy) return;

      isBusy = true;
      const userHtml = esc(text);
      appendMessageDOM('user', userHtml);
      history.push({ role: 'user', html: userHtml });
      saveHistory(history);

      setRobotMood('thinking', false);

      const typingRow = appendMessageDOM(
        'bot',
        `<div class="ptx-typing" aria-label="กำลังพิมพ์คำตอบ"><span class="ptx-typing__dot"></span><span class="ptx-typing__dot"></span><span class="ptx-typing__dot"></span></div>`
      );

      try {
        const replyHtml = await getBotReply(text);
        typingRow.remove();
        appendMessageDOM('bot', replyHtml);
        history.push({ role: 'bot', html: replyHtml });
        saveHistory(history);
      } catch (err) {
        typingRow.remove();
        const fallbackHtml = `<p>ขออภัยครับ ระบบขัดข้องชั่วคราว สามารถติดต่อทีมวิศวกรโดยตรงได้ที่โทร <a href="tel:0853924448"><strong>085-392-4448</strong></a> ครับ</p>`;
        appendMessageDOM('bot', fallbackHtml);
      } finally {
        isBusy = false;
        setRobotMood(root.classList.contains('is-open') ? 'happy' : 'greeting', false);
      }
    }

    launcherBtn.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));

    resetBtn.addEventListener('click', () => {
      history = [];
      saveHistory(history);
      renderInitialFeed();
    });

    root.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-chip-query]');
      if (!chip) return;
      handleUserMessage(chip.getAttribute('data-chip-query'));
    });

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = inputEl.value;
      inputEl.value = '';
      handleUserMessage(val);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('is-open')) {
        toggleChat(false);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProtexChatbot);
  } else {
    initProtexChatbot();
  }

  window.ProtexChatbot = {
    getBotReply,
    setRobotMood(mood, withBounce = false) {
      if (typeof externalMoodSetter === 'function') {
        externalMoodSetter(mood, withBounce);
      }
    },
    setCustomProvider(fn) {
      customAiProvider = fn;
    },
    getKnowledge() {
      return knowledgeData;
    },
  };
})();
