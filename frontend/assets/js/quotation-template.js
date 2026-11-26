/**
 * ============================================================================
 * PROTEX OFFICIAL QUOTATION TEMPLATE ENGINE (`quotation-template.js`)
 * Single Shared Official A4 Quotation Renderer (Browser + Node.js CommonJS)
 * - Based on official letterhead of PROTEX ACCESSORY INDUSTRIAL LTD., PART.
 * - Strict Original Layout: NO email on document (TEL. / FAX. / DATE only)
 * - Uses website transparent PNG logo (`assets/logo/protex-logo.png`)
 * - 7-Column Itemized Table (7% / 38% / 7% / 8% / 15% / 9% / 16%) with 2-decimal tabular-nums
 * - Accurate Thai Baht Text (`ตัวอักษร`) up to trillions
 * - Dedicated A4 Portrait Print / Save PDF engine (`printOfficialQuotation`)
 * - Inline-styled HTML Email generator (`buildOfficialQuotationEmailHTML`)
 * ============================================================================
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ProtexQuotationTemplate = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const DEFAULT_QUOTATION_SETTINGS = {
    legalCompanyEn: 'PROTEX ACCESSORY INDUSTRIAL LTD., PART.',
    legalAddressEn:
      '56/360 M.1, Soi Wattrisamakkhi 3, Sukhumvit Rd., T. Bangmuangmai, A. Muangsamutprakarn, Samutprakarn 10270, Thailand',
    legalTel: '085-392-4448',
    legalFax: '02-121-7845',
    legalWeb: 'www.protexgroup2002.com',
    taxId: '0113545005517',
    logoUrl: 'assets/logo/protex-logo.png',
    bankAccountName: 'หจก. โพรเทคส์ แอคเซซโซรี อินดัสเตรียล',
    bankDetails: 'ธนาคารกรุงศรีอยุธยา เลขที่บัญชี 063-0-03989-5 ประเภทกระแสรายวัน สาขาสำโรง',
    defaultRevision: 'RE.1',
    defaultAttn: 'กรรมการผู้จัดการ',
    defaultDeliveryTerm: 'ตามกำหนดการที่ตกลงร่วมกัน',
    defaultPriceValidFor: '30 วัน นับจากวันที่ออกเอกสาร',
    defaultPaymentTerms: [
      'งวดที่ 1 ชำระเงินมัดจำ 30% พร้อมใบสั่งซื้อ เพื่อเริ่มดำเนินการผลิตและจัดเตรียมอุปกรณ์',
      'งวดที่ 2 ชำระเงิน 50% ก่อนจัดส่งเครื่องจักรและอุปกรณ์เข้าพื้นที่ติดตั้งหน้างาน',
      'งวดที่ 3 ชำระส่วนที่เหลือ 20% หลังติดตั้งและทดสอบเดินเครื่อง (Commissioning) เรียบร้อยแล้ว',
    ],
    defaultProposerName: 'นายบุญรุ่ง หินดี',
    defaultProposerTitle: 'Sale Engineer',
    defaultProposerTel: 'Tel. 065-241-5250',
    defaultApproverName: 'คุณสมศักดิ์ ประคองศรี',
    defaultApproverTitle: 'Managing Director',
  };

  const DEC2_FMT = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const QTY_FMT = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  });

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMoney(n) {
    const val = Number(n);
    if (!Number.isFinite(val)) return '0.00';
    return DEC2_FMT.format(Math.round(val * 100) / 100);
  }

  function formatDateBuddhistDMY(input) {
    if (!input) {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear() + 543;
      return `${dd}/${mm}/${yyyy}`;
    }
    const raw = String(input).trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    const buddhistYear = yr < 2400 ? yr + 543 : yr;
    return `${dd}/${mm}/${buddhistYear}`;
  }

  /**
   * Accurate Thai Baht Text converter (supports up to trillions + satang)
   */
  function numberToThaiBahtText(amount) {
    const num = Math.round(Math.max(0, Number(amount) || 0) * 100) / 100;
    if (num === 0) return 'ศูนย์บาทถ้วน';

    const DIGIT_WORDS = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const POS_WORDS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

    function convertSixDigitChunk(chunkStr) {
      let res = '';
      const len = chunkStr.length;
      for (let i = 0; i < len; i++) {
        const digit = parseInt(chunkStr[i], 10);
        const pos = len - 1 - i;
        if (digit === 0) continue;
        if (pos === 1 && digit === 1) {
          res += 'สิบ';
        } else if (pos === 1 && digit === 2) {
          res += 'ยี่สิบ';
        } else if (pos === 0 && digit === 1 && len > 1 && chunkStr.slice(0, -1).replace(/0/g, '').length > 0) {
          res += 'เอ็ด';
        } else {
          res += DIGIT_WORDS[digit] + POS_WORDS[pos];
        }
      }
      return res;
    }

    function convertIntegerStr(intStr) {
      const clean = intStr.replace(/^0+/, '');
      if (!clean) return '';
      const groups = [];
      for (let end = clean.length; end > 0; end -= 6) {
        const start = Math.max(0, end - 6);
        groups.unshift(clean.slice(start, end));
      }
      return groups
        .map((grp, idx) => {
          const text = convertSixDigitChunk(grp);
          const millionsLeft = groups.length - 1 - idx;
          if (!text) return millionsLeft > 0 ? 'ล้าน' : '';
          return text + (millionsLeft > 0 ? 'ล้าน' : '');
        })
        .join('');
    }

    const fixed = num.toFixed(2);
    const [bahtPart, satangPart] = fixed.split('.');
    const bahtWords = convertIntegerStr(bahtPart);
    const satangNum = parseInt(satangPart, 10);

    if (satangNum === 0) {
      return `${bahtWords || 'ศูนย์'}บาทถ้วน`;
    }
    const satangWords = convertSixDigitChunk(String(satangNum));
    if (!bahtWords) {
      return `${satangWords}สตางค์`;
    }
    return `${bahtWords}บาท${satangWords}สตางค์`;
  }

  /**
   * Normalizes any quotation record into a unified 7-column official model.
   * Strictly excludes email addresses from rendered document fields (`clientFax` is FAX only).
   */
  function normalizeQuotationData(raw = {}, siteSettings = {}) {
    const cfg = { ...DEFAULT_QUOTATION_SETTINGS, ...(siteSettings || {}) };
    const q = raw || {};
    const contact = q.contact || {};
    const model = q.model || null;
    const color = q.color || null;

    let items = [];
    if (Array.isArray(q.officialItems) && q.officialItems.length > 0) {
      items = q.officialItems.map((it, idx) => {
        const qty = Math.max(0, Number(it.qty ?? 1));
        const unitPrice = Math.max(0, Number(it.unitPrice ?? 0));
        const discount = Math.max(0, Number(it.discount ?? 0));
        const gross = qty * unitPrice;
        const amount = Math.max(0, gross - discount);
        const bullets = Array.isArray(it.bullets)
          ? it.bullets.map((b) => String(b || '').trim()).filter(Boolean)
          : String(it.subtext || '')
              .split('\n')
              .map((b) => b.trim())
              .filter(Boolean);
        return {
          no: idx + 1,
          title: String(it.title || it.name || 'รายการสินค้า').trim(),
          bullets,
          qty,
          unit: String(it.unit || 'ชุด').trim(),
          unitPrice,
          discount,
          amount,
        };
      });
    } else {
      if (model && model.name) {
        const basePrice = Number(model.basePrice || 0);
        const colorExtra = Number(color?.surcharge || 0);
        const plantUnitPrice = basePrice + colorExtra;
        const plantBullets = [];
        if (model.capacity) {
          plantBullets.push(`กำลังการผลิตมาตรฐาน ${model.capacity} ${model.capacityUnit || 'T/H'}`);
        }
        if (color && (color.nameTh || color.name)) {
          plantBullets.push(
            `สีโครงสร้างหลัก: ${color.nameTh || color.name}${color.code ? ` (${color.code})` : ''}${
              colorExtra > 0 ? ` [+${formatMoney(colorExtra)} บาท]` : ' (สีมาตรฐานโรงงาน)'
            }`
          );
        }
        if (contact.note && String(contact.note).trim()) {
          plantBullets.push(`สถานที่ติดตั้ง / ความต้องการเพิ่มเติม: ${String(contact.note).trim()}`);
        } else {
          plantBullets.push('รวมงานออกแบบวิศวกรรม ประกอบติดตั้ง และทดสอบเดินเครื่อง (Commissioning)');
        }
        items.push({
          no: 1,
          title: `แพล้นท์ผสมยางมะตอย ${model.name}`,
          bullets: plantBullets,
          qty: 1,
          unit: 'ระบบ',
          unitPrice: plantUnitPrice,
          discount: 0,
          amount: plantUnitPrice,
        });
      }

      const rawLines = Array.isArray(q.lines) ? q.lines : [];
      rawLines.forEach((l) => {
        const qty = Math.max(1, Number(l.qty || 1));
        const unitPrice = Math.max(0, Number(l.unitPrice || 0));
        const discount = Math.max(0, Number(l.discount || 0));
        const amount = Math.max(0, qty * unitPrice - discount);
        const bullets = Array.isArray(l.bullets)
          ? l.bullets.filter(Boolean)
          : l.subtitle || l.spec
          ? [String(l.subtitle || l.spec).trim()]
          : [];
        items.push({
          no: items.length + 1,
          title: String(l.name || l.title || 'อุปกรณ์เสริม').trim(),
          bullets,
          qty,
          unit: String(l.unit || 'ชุด').trim(),
          unitPrice,
          discount,
          amount,
        });
      });
    }

    const itemsSubtotal = items.reduce((sum, r) => sum + r.amount, 0);
    const specialDiscount = Math.max(0, Number(q.specialDiscount || 0));
    const netBeforeVat = Math.max(0, itemsSubtotal - specialDiscount);
    const vatRate = Number(q.vatRate ?? 7);
    const vatAmount = Math.round(netBeforeVat * (vatRate / 100) * 100) / 100;
    const grandTotal = Math.round((netBeforeVat + vatAmount) * 100) / 100;

    const clientCompany = String(contact.company || '').trim();
    const clientPerson = String(contact.name || '').trim();
    let clientDisplay = '';
    if (clientCompany && clientPerson && clientPerson !== 'ระบุชื่อผู้ติดต่อ...') {
      clientDisplay = `${clientCompany} (${clientPerson})`;
    } else {
      clientDisplay = clientCompany || clientPerson || '-';
    }

    const attnDisplay = String(q.attn || contact.attn || cfg.defaultAttn || 'กรรมการผู้จัดการ').trim();
    const paymentTerms = Array.isArray(q.paymentTerms) && q.paymentTerms.length
      ? q.paymentTerms.map((t) => String(t || '').trim()).filter(Boolean)
      : Array.isArray(cfg.defaultPaymentTerms) && cfg.defaultPaymentTerms.length
      ? cfg.defaultPaymentTerms
      : DEFAULT_QUOTATION_SETTINGS.defaultPaymentTerms;

    const rawRef = String(q.ref || 'QT-DRAFT').trim();
    const displayNo = rawRef.replace(/^NO\.?\s*/i, '');

    // Strictly FAX only (never fall back to email!)
    const clientFax = String(q.fax ?? contact.fax ?? '').trim();

    // Determine Preliminary vs Official Verified Document State
    const rawStatus = String(q.status || '').trim();
    let docType = String(q.docType || '').trim().toLowerCase();
    if (docType !== 'preliminary' && docType !== 'official') {
      if (rawStatus === 'pending_review') {
        docType = 'preliminary';
      } else if (
        q.proposerName === '' &&
        q.approverName === '' &&
        rawStatus !== 'verified_sent' &&
        rawStatus !== 'closed'
      ) {
        docType = 'preliminary';
      } else {
        docType = 'official';
      }
    }
    const isPreliminary = docType === 'preliminary';

    const proposerName = isPreliminary
      ? ''
      : q.proposerName !== undefined
      ? String(q.proposerName).trim()
      : String(cfg.defaultProposerName || DEFAULT_QUOTATION_SETTINGS.defaultProposerName).trim();
    const proposerTitle = isPreliminary
      ? ''
      : q.proposerTitle !== undefined
      ? String(q.proposerTitle).trim()
      : String(cfg.defaultProposerTitle || DEFAULT_QUOTATION_SETTINGS.defaultProposerTitle).trim();
    const proposerTel = isPreliminary
      ? ''
      : q.proposerTel !== undefined
      ? String(q.proposerTel).trim()
      : String(cfg.defaultProposerTel || DEFAULT_QUOTATION_SETTINGS.defaultProposerTel).trim();
    const approverName = isPreliminary
      ? ''
      : q.approverName !== undefined
      ? String(q.approverName).trim()
      : String(cfg.defaultApproverName || DEFAULT_QUOTATION_SETTINGS.defaultApproverName).trim();
    const approverTitle = isPreliminary
      ? ''
      : q.approverTitle !== undefined
      ? String(q.approverTitle).trim()
      : String(cfg.defaultApproverTitle || DEFAULT_QUOTATION_SETTINGS.defaultApproverTitle).trim();

    return {
      ref: rawRef,
      displayNo,
      docType,
      isPreliminary,
      status: rawStatus || (isPreliminary ? 'pending_review' : 'verified_sent'),
      revision: String(q.revision || cfg.defaultRevision || 'RE.1').trim(),
      dateDisplay: q.issueDateDisplay || formatDateBuddhistDMY(q.createdAt),
      clientDisplay,
      clientCompany,
      clientPerson,
      attnDisplay,
      clientTel: String(contact.phone || '-').trim() || '-',
      clientFax,
      clientNote: String(contact.note || '').trim(),
      items,
      itemsSubtotal,
      specialDiscount,
      netBeforeVat,
      vatRate,
      vatAmount,
      grandTotal,
      bahtText: numberToThaiBahtText(grandTotal),
      deliveryTerm: String(q.deliveryTerm || cfg.defaultDeliveryTerm || DEFAULT_QUOTATION_SETTINGS.defaultDeliveryTerm).trim(),
      priceValidFor: String(q.priceValidFor || cfg.defaultPriceValidFor || DEFAULT_QUOTATION_SETTINGS.defaultPriceValidFor).trim(),
      remarkNote: String(q.remarkNote || '').trim(),
      preliminaryNotice:
        'เอกสารนี้คำนวณจากรายการสินค้าหน้าเว็บ เป็นการเสนอรายการสินค้าราคาเบื้องต้นเท่านั้น ยังไม่มีการตรวจสอบจากบริษัท หากต้องการข้อมูลหรือเงื่อนไขเพิ่มเติม กรุณาติดต่อ LINE: protex000 หรือ โทร. 085-392-4448',
      paymentTerms,
      bankAccountName: String(q.bankAccountName || cfg.bankAccountName || DEFAULT_QUOTATION_SETTINGS.bankAccountName).trim(),
      bankDetails: String(q.bankDetails || cfg.bankDetails || DEFAULT_QUOTATION_SETTINGS.bankDetails).trim(),
      proposerName,
      proposerTitle,
      proposerTel,
      approverName,
      approverTitle,
      letterhead: {
        companyEn: cfg.legalCompanyEn || DEFAULT_QUOTATION_SETTINGS.legalCompanyEn,
        addressEn: cfg.legalAddressEn || DEFAULT_QUOTATION_SETTINGS.legalAddressEn,
        tel: cfg.legalTel || DEFAULT_QUOTATION_SETTINGS.legalTel,
        fax: cfg.legalFax || DEFAULT_QUOTATION_SETTINGS.legalFax,
        web: cfg.legalWeb || DEFAULT_QUOTATION_SETTINGS.legalWeb,
        taxId: cfg.taxId || DEFAULT_QUOTATION_SETTINGS.taxId,
        logoUrl: cfg.logoUrl || DEFAULT_QUOTATION_SETTINGS.logoUrl,
      },
    };
  }

  /**
   * Self-contained Official ISO A4 Portrait (210mm x 297mm) Stylesheet
   * Strictly locked to A4 Portrait — NO height:auto stretching, NO mobile reflow, NO other paper sizes.
   */
  function getOfficialQuotationStyles() {
    return `
      .a4-sheets-stack {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 28px;
      }
      .a4-quotation-sheet,
      .ptx-oq-sheet {
        flex: 0 0 auto;
        width: 210mm;
        min-width: 210mm;
        max-width: 210mm;
        height: 297mm;
        min-height: 297mm;
        max-height: 297mm;
        aspect-ratio: 210 / 297;
        padding: 11mm 12mm;
        box-sizing: border-box;
        background: #FFFFFF;
        color: #0F172A;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        overflow: hidden;
        margin: 0 auto;
        font-family: 'Sarabun', 'IBM Plex Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 11.8px;
        line-height: 1.38;
        border: 1px solid #CBD5E1;
        border-radius: 3px;
        box-shadow: 0 16px 38px -10px rgba(15, 23, 42, 0.24), 0 4px 12px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(15, 23, 42, 0.06);
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .a4-quotation-sheet *, .a4-quotation-sheet *::before, .a4-quotation-sheet *::after {
        box-sizing: border-box;
      }

      /* Live Preview Proportional Auto-Fit Stage (Never clips height; exact post-scale height reserved on slot) */
      .a4-preview-stage {
        flex: 0 0 auto;
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        overflow: visible !important;
        padding: 4px 0 28px;
      }
      .a4-sheet-scale-slot {
        flex: 0 0 auto;
        position: relative;
        margin: 0 auto;
        overflow: visible;
      }
      .a4-sheet-scale-inner {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: top left;
        will-change: transform;
      }

      .ptx-oq-header-stack {
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        gap: 7px;
      }
      /* 1. Corporate Letterhead (Strictly matches original — NO email line) */
      .ptx-oq-letterhead {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding-bottom: 7px;
        border-bottom: 2px solid #B91C1C;
      }
      .ptx-oq-lh-left {
        flex: 1;
        min-width: 0;
      }
      .ptx-oq-company-en {
        font-size: 14.5px;
        font-weight: 800;
        letter-spacing: 0.02em;
        color: #0F172A;
        margin: 0 0 2px 0;
        line-height: 1.25;
      }
      .ptx-oq-lh-line {
        font-size: 11px;
        color: #334155;
        line-height: 1.4;
        margin: 0;
      }
      .ptx-oq-lh-line--contact {
        display: flex;
        flex-wrap: nowrap;
        column-gap: 16px;
        margin-top: 2px;
        white-space: nowrap;
      }
      .ptx-oq-tax {
        margin-top: 2px;
        font-size: 11.2px;
        font-weight: 700;
        color: #0F172A;
      }
      .ptx-oq-lh-right {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: center;
      }
      .ptx-oq-logo {
        height: 48px;
        width: auto;
        max-width: 172px;
        object-fit: contain;
        display: block;
      }

      /* 2. Quotation Title Bar */
      .ptx-oq-titlebar {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        padding: 5px 12px;
        background: linear-gradient(90deg, #FEF2F2 0%, #FFF5F5 50%, #FEF2F2 100%);
        border: 1px solid #CBD5E1;
        border-left: 4px solid #B91C1C;
      }
      .ptx-oq-titlebar__left {
        grid-column: 1;
        font-size: 10.8px;
        font-weight: 700;
        color: #64748B;
      }
      .ptx-oq-titlebar__center {
        grid-column: 2;
        text-align: center;
        font-size: 14.8px;
        font-weight: 800;
        letter-spacing: 0.03em;
        color: #0F172A;
        white-space: nowrap;
      }
      .ptx-oq-titlebar__center span {
        color: #B91C1C;
        margin-right: 6px;
      }
      .ptx-oq-titlebar--prelim {
        background: linear-gradient(90deg, #FFFBEB 0%, #FEF3C7 50%, #FFFBEB 100%);
        border-left: 4px solid #D97706;
      }
      .ptx-oq-titlebar__center--prelim {
        font-size: 13.2px;
        letter-spacing: 0.01em;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        line-height: 1.22;
      }
      .ptx-oq-titlebar__center--prelim small {
        font-size: 11px;
        font-weight: 700;
        color: #475569;
      }
      .ptx-oq-unverified-badge {
        display: inline-block;
        margin-top: 1px;
        padding: 1px 8px;
        border-radius: 999px;
        background: #FEF2F2;
        border: 1px solid #FCA5A5;
        color: #B91C1C !important;
        font-size: 10px;
        font-weight: 800;
        margin-right: 0 !important;
      }
      .ptx-oq-titlebar__right {
        grid-column: 3;
        justify-self: end;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 11.6px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .ptx-oq-rev {
        color: #B91C1C;
        font-weight: 800;
      }
      .ptx-oq-docno {
        color: #0F172A;
        font-weight: 800;
      }

      /* 3. Client Information Grid (2 Clean Rows: CLIENT + ATTN / TEL. + FAX. + DATE) */
      .ptx-oq-client-table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        border: 1px solid #CBD5E1;
        font-size: 11.6px;
      }
      .ptx-oq-client-table td {
        border: 1px solid #CBD5E1;
        padding: 5px 8px;
        vertical-align: middle;
      }
      .ptx-oq-client-row2 td {
        height: 32px;
        padding-top: 4px;
        padding-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ptx-oq-cl-lbl {
        background: #F8FAFC;
        color: #334155;
        font-weight: 700;
        white-space: nowrap;
        font-size: 10.8px;
        line-height: 1.2;
      }
      .ptx-oq-cl-val {
        color: #0F172A;
        font-weight: 700;
      }

      /* 4. Elastic Official 7-Column Itemized Zone (Fills exact middle of A4 297mm sheet) */
      .ptx-oq-items-zone {
        flex: 1 1 auto;
        min-height: 0;
        margin: 7px 0;
        border: 1px solid #CBD5E1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .ptx-oq-items-table {
        width: 100%;
        height: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        font-size: 11.5px;
      }
      .ptx-oq-items-table th {
        background: #0F172A;
        color: #FFFFFF;
        border-right: 1px solid #334155;
        border-bottom: 1px solid #334155;
        padding: 6px 5px;
        font-weight: 700;
        text-align: center;
        line-height: 1.22;
        font-size: 10.8px;
        white-space: nowrap;
      }
      .ptx-oq-items-table th:last-child {
        border-right: none;
      }
      .ptx-oq-items-table th small {
        display: block;
        font-weight: 500;
        font-size: 9.6px;
        opacity: 0.86;
      }
      .ptx-oq-items-table td {
        border-right: 1px solid #CBD5E1;
        border-bottom: 1px solid #E2E8F0;
        padding: 6px 7px;
        vertical-align: top;
      }
      .ptx-oq-items-table td:last-child {
        border-right: none;
      }
      .ptx-oq-items-table tr.ptx-oq-filler-row {
        height: 100%;
      }
      .ptx-oq-items-table tr.ptx-oq-filler-row td {
        border-bottom: none;
        padding-top: 0;
        padding-bottom: 0;
      }
      .ptx-oq-col-item {
        width: 7%;
        text-align: center;
        white-space: nowrap;
      }
      .ptx-oq-col-desc {
        width: 38%;
        text-align: left;
        word-break: break-word;
      }
      .ptx-oq-col-qty {
        width: 7%;
        text-align: center;
        white-space: nowrap;
      }
      .ptx-oq-col-unit {
        width: 8%;
        text-align: center;
        white-space: nowrap;
      }
      .ptx-oq-col-unitprice {
        width: 15%;
        text-align: right;
        white-space: nowrap;
        padding-right: 10px !important;
        font-size: 11.4px;
      }
      .ptx-oq-col-disc {
        width: 9%;
        text-align: right;
        white-space: nowrap;
        padding-right: 8px !important;
        font-size: 11.4px;
      }
      .ptx-oq-col-amt {
        width: 16%;
        text-align: right;
        white-space: nowrap;
        padding-right: 10px !important;
        font-size: 11.4px;
      }

      .ptx-oq-num {
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .ptx-oq-item-title {
        font-weight: 700;
        color: #0F172A;
        font-size: 11.8px;
      }
      .ptx-oq-bullets {
        margin: 2px 0 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .ptx-oq-bullets li {
        font-size: 10.8px;
        color: #334155;
        padding-left: 10px;
        position: relative;
        line-height: 1.34;
      }
      .ptx-oq-bullets li::before {
        content: "-";
        position: absolute;
        left: 0;
        color: #B91C1C;
        font-weight: 700;
      }

      /* 5. Bottom Docked Summary + Signatures Stack */
      .ptx-oq-bottom-stack {
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .ptx-oq-cont-bar {
        padding: 8px 12px;
        background: #F8FAFC;
        border: 1px solid #CBD5E1;
        text-align: right;
        font-size: 11.4px;
        font-weight: 700;
        color: #475569;
      }
      .ptx-oq-bank-bar {
        padding: 5px 10px;
        background: #F8FAFC;
        border: 1px solid #CBD5E1;
        border-left: 3.5px solid #0F172A;
        font-size: 11.2px;
        color: #0F172A;
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        gap: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ptx-oq-bank-bar strong {
        color: #B91C1C;
      }
      .ptx-oq-summary-grid {
        display: grid;
        grid-template-columns: 1.18fr 0.82fr;
        gap: 12px;
        align-items: start;
      }
      .ptx-oq-remarks {
        font-size: 10.9px;
        color: #1E293B;
        line-height: 1.42;
      }
      .ptx-oq-remarks__head {
        font-weight: 800;
        color: #0F172A;
        font-size: 11.4px;
        margin-bottom: 2px;
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .ptx-oq-remarks__row {
        margin-bottom: 1.5px;
      }
      .ptx-oq-remarks__row strong {
        color: #0F172A;
      }
      .ptx-oq-paylist {
        margin: 1.5px 0 0;
        padding-left: 15px;
      }
      .ptx-oq-paylist li {
        margin-bottom: 1px;
      }

      .ptx-oq-totals-box {
        width: 100%;
        border: 1px solid #CBD5E1;
        border-collapse: collapse;
        font-size: 11.4px;
      }
      .ptx-oq-totals-box td {
        border: 1px solid #CBD5E1;
        padding: 4px 10px;
      }
      .ptx-oq-totals-box td:first-child {
        background: #F8FAFC;
        font-weight: 700;
        color: #334155;
      }
      .ptx-oq-totals-box td:last-child {
        text-align: right;
        font-weight: 700;
        color: #0F172A;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
        font-size: 11.6px;
      }
      .ptx-oq-totals-box tr.is-discount td:last-child {
        color: #B91C1C;
      }
      .ptx-oq-totals-box tr.is-grand td {
        background: #FEF2F2;
        border-top: 1.5px solid #B91C1C;
        border-bottom: 1.5px solid #B91C1C;
        color: #991B1B;
        font-weight: 800;
        font-size: 12px;
      }
      .ptx-oq-totals-box tr.is-grand td:last-child {
        color: #B91C1C;
        font-size: 12.6px;
        font-weight: 900;
      }
      .ptx-oq-baht-text {
        margin-top: 3px;
        padding: 4px 8px;
        background: #F8FAFC;
        border: 1px solid #CBD5E1;
        text-align: center;
        font-size: 10.8px;
        font-weight: 700;
        color: #0F172A;
      }

      /* 6. Official Signature Footer (Strictly NO Circle/Oval under Company Stamp) */
      .ptx-oq-signatures {
        display: grid;
        grid-template-columns: 1fr 1.15fr;
        gap: 16px;
        padding-top: 9px;
        margin-top: 2px;
        border-top: 1px solid #CBD5E1;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .ptx-oq-sig-customer {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        font-size: 11.2px;
        color: #0F172A;
      }
      .ptx-oq-sig-line {
        margin-top: 18px;
        white-space: nowrap;
      }
      .ptx-oq-sig-date {
        margin-top: 5px;
      }
      .ptx-oq-sig-stamp-label {
        margin-top: 4px;
        font-weight: 700;
        color: #334155;
        padding-bottom: 22px;
      }
      .ptx-oq-sig-protex {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        align-items: start;
        text-align: center;
        font-size: 11.2px;
      }
      .ptx-oq-sig-person {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5px;
      }
      .ptx-oq-sig-role-head {
        font-weight: 700;
        color: #334155;
        margin-bottom: 18px;
      }
      .ptx-oq-prelim-disclaimer {
        margin-bottom: 5px;
        padding: 5px 8px;
        border-radius: 4px;
        background: #FFFBEB;
        border: 1px solid #FCD34D;
        border-left: 3px solid #D97706;
        color: #92400E;
        font-size: 10.4px;
        font-weight: 700;
        line-height: 1.38;
      }
      .ptx-oq-sig-blank-dots {
        margin-top: 2px;
        color: #475569;
        letter-spacing: 0.02em;
        white-space: nowrap;
      }
      .ptx-oq-sig-blank-paren {
        margin-top: 4px;
        color: #475569;
        font-size: 10.6px;
        white-space: nowrap;
      }
      .ptx-oq-sig-blank-note {
        margin-top: 3px;
        font-size: 10px;
        font-weight: 600;
        color: #94A3B8;
      }
      .ptx-oq-sig-person strong {
        font-size: 11.8px;
        color: #0F172A;
      }
      .ptx-oq-sig-person span {
        font-size: 10.8px;
        color: #475569;
      }

      /* Strict ISO A4 Portrait Print Lock (210mm x 297mm ONLY) */
      @media print {
        @page {
          size: A4 portrait;
          margin: 0;
        }
        html, body {
          width: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #FFFFFF !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .a4-preview-stage,
        .a4-sheet-scale-slot,
        .a4-sheet-scale-inner {
          position: static !important;
          width: 210mm !important;
          height: auto !important;
          transform: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .a4-sheets-stack {
          display: block !important;
          gap: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          line-height: 0;
        }
        .a4-quotation-sheet,
        .ptx-oq-sheet {
          width: 210mm !important;
          min-width: 210mm !important;
          max-width: 210mm !important;
          height: 297mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          padding: 11mm 12mm !important;
          margin: 0 !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          overflow: hidden !important;
          line-height: 1.38;
          page-break-inside: avoid;
          break-inside: avoid;
          page-break-after: always;
          break-after: page;
        }
        .a4-quotation-sheet:last-child,
        .ptx-oq-sheet:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
      }
    `;
  }

  /**
   * Splits item rows across exact 210x297mm A4 pages only if items exceed single-page A4 capacity
   */
  function paginateQuotationItems(items) {
    const list = Array.isArray(items) && items.length ? items : [];
    if (!list.length) return [[]];

    const estimateRowHeight = (row) => {
      const titleLines = Math.max(1, Math.ceil(String(row.title || '').length / 40));
      const bulletLines = (row.bullets || []).reduce(
        (sum, b) => sum + Math.max(1, Math.ceil(String(b || '').length / 44)),
        0
      );
      return 14 + titleLines * 17 + bulletLines * 15;
    };

    const SINGLE_PAGE_MAX_PX = 485;
    const CONT_PAGE_MAX_PX = 740;
    const totalHeight = list.reduce((sum, r) => sum + estimateRowHeight(r), 0);
    if (totalHeight <= SINGLE_PAGE_MAX_PX) {
      return [list];
    }

    const pages = [];
    let current = [];
    let curH = 0;
    for (let i = 0; i < list.length; i++) {
      const row = list[i];
      const h = estimateRowHeight(row);
      const isLastItem = i === list.length - 1;
      const budget = isLastItem ? SINGLE_PAGE_MAX_PX : CONT_PAGE_MAX_PX;
      if (current.length > 0 && curH + h > budget) {
        pages.push(current);
        current = [row];
        curH = h;
      } else {
        current.push(row);
        curH += h;
      }
    }
    if (current.length) {
      if (curH > SINGLE_PAGE_MAX_PX && current.length > 1) {
        const lastRow = current.pop();
        pages.push(current);
        pages.push([lastRow]);
      } else {
        pages.push(current);
      }
    }
    return pages;
  }

  /**
   * Renders the Official ISO A4 Portrait Quotation Document HTML (`.a4-quotation-sheet`, 210mm x 297mm)
   */
  function renderOfficialQuotationHTML(rawQuote, siteSettings = {}, options = {}) {
    const d = normalizeQuotationData(rawQuote, siteSettings);
    const includeStyleTag = options.includeStyleTag !== false;
    const logoSrc = options.logoUrlOverride || d.letterhead.logoUrl;
    const pages = paginateQuotationItems(d.items);
    const totalPages = pages.length;
    const paymentTermsHTML = d.paymentTerms.map((term) => `<li>${esc(term)}</li>`).join('');

    const sheetsHTML = pages
      .map((pageItems, pageIdx) => {
        const isLastPage = pageIdx === totalPages - 1;
        const pageBadgeHTML =
          totalPages > 1 ? `<div class="ptx-oq-titlebar__left">แผ่นที่ ${pageIdx + 1} / ${totalPages}</div>` : '';

        const itemRowsHTML = pageItems
          .map((row) => {
            const bulletsHTML =
              row.bullets && row.bullets.length
                ? `<ul class="ptx-oq-bullets">${row.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`
                : '';
            return `
              <tr class="ptx-oq-item-row">
                <td class="ptx-oq-col-item ptx-oq-num">${row.no}</td>
                <td class="ptx-oq-col-desc">
                  <div class="ptx-oq-item-title">${esc(row.title)}</div>
                  ${bulletsHTML}
                </td>
                <td class="ptx-oq-col-qty ptx-oq-num">${QTY_FMT.format(row.qty)}</td>
                <td class="ptx-oq-col-unit">${esc(row.unit)}</td>
                <td class="ptx-oq-col-unitprice ptx-oq-num">${formatMoney(row.unitPrice)}</td>
                <td class="ptx-oq-col-disc ptx-oq-num">${row.discount > 0 ? formatMoney(row.discount) : '-'}</td>
                <td class="ptx-oq-col-amt ptx-oq-num"><strong>${formatMoney(row.amount)}</strong></td>
              </tr>`;
          })
          .join('');

        const titleCenterHTML = d.isPreliminary
          ? `<div class="ptx-oq-titlebar__center ptx-oq-titlebar__center--prelim">
              <div>ใบเสนอราคาเบื้องต้น <small>(คำนวณจากสินค้าหน้าเว็บ)</small></div>
              <span class="ptx-oq-unverified-badge">ยังไม่มีการตรวจสอบจากบริษัท</span>
            </div>`
          : `<div class="ptx-oq-titlebar__center"><span>QUOTATION</span>ใบเสนอราคา</div>`;

        const proposerSigHTML =
          !d.isPreliminary && d.proposerName
            ? `
                <div class="ptx-oq-sig-person">
                  <div class="ptx-oq-sig-role-head">ผู้เสนอราคา</div>
                  <strong>${esc(d.proposerName)}</strong>
                  ${d.proposerTitle ? `<span>${esc(d.proposerTitle)}</span>` : ''}
                  ${d.proposerTel ? `<span>${esc(d.proposerTel)}</span>` : ''}
                </div>`
            : `
                <div class="ptx-oq-sig-person">
                  <div class="ptx-oq-sig-role-head">ผู้เสนอราคา</div>
                  <div class="ptx-oq-sig-blank-dots">............................................</div>
                  <div class="ptx-oq-sig-blank-paren">( ............................................ )</div>
                  <div class="ptx-oq-sig-blank-note">รอการตรวจสอบจากบริษัท</div>
                </div>`;

        const approverSigHTML =
          !d.isPreliminary && d.approverName
            ? `
                <div class="ptx-oq-sig-person">
                  <div class="ptx-oq-sig-role-head">ผู้อนุมัติ</div>
                  <strong>${esc(d.approverName)}</strong>
                  ${d.approverTitle ? `<span>${esc(d.approverTitle)}</span>` : ''}
                </div>`
            : `
                <div class="ptx-oq-sig-person">
                  <div class="ptx-oq-sig-role-head">ผู้อนุมัติ</div>
                  <div class="ptx-oq-sig-blank-dots">............................................</div>
                  <div class="ptx-oq-sig-blank-paren">( ............................................ )</div>
                  <div class="ptx-oq-sig-blank-note">รอการอนุมัติจากบริษัท</div>
                </div>`;

        const bottomSectionHTML = isLastPage
          ? `
          <div class="ptx-oq-bottom-stack">
            <!-- 5. Bank Transfer Bar + Remarks/Terms & Financial Summary -->
            <div class="ptx-oq-bank-bar">
              <span><strong>บัญชีในการโอนเงิน:</strong> ${esc(d.bankAccountName)}</span>
              <span><strong>${esc(d.bankDetails)}</strong></span>
            </div>

            <div class="ptx-oq-summary-grid">
              <div class="ptx-oq-remarks">
                <div class="ptx-oq-remarks__head">หมายเหตุ / REMARK</div>
                ${
                  d.isPreliminary
                    ? `<div class="ptx-oq-prelim-disclaimer">${esc(d.preliminaryNotice)}</div>`
                    : ''
                }
                <div class="ptx-oq-remarks__row"><strong>กำหนดส่งมอบ (DELIVERY):</strong> ${esc(d.deliveryTerm)}</div>
                <div class="ptx-oq-remarks__row"><strong>กำหนดยืนราคา (PRICE VALID FOR):</strong> ${esc(d.priceValidFor)}</div>
                ${d.remarkNote ? `<div class="ptx-oq-remarks__row"><strong>หมายเหตุเพิ่มเติม:</strong> ${esc(d.remarkNote)}</div>` : ''}
                <div class="ptx-oq-remarks__row" style="margin-top:2px;">
                  <strong>เงื่อนไขการชำระเงิน (PAYMENT TERM):</strong>
                  <ol class="ptx-oq-paylist">
                    ${paymentTermsHTML}
                  </ol>
                </div>
              </div>

              <div>
                <table class="ptx-oq-totals-box">
                  <tbody>
                    <tr>
                      <td>รวมเป็นเงิน (Subtotal)</td>
                      <td>${formatMoney(d.itemsSubtotal)}</td>
                    </tr>
                    <tr class="${d.specialDiscount > 0 ? 'is-discount' : ''}">
                      <td>ส่วนลดพิเศษ (Special Discount)</td>
                      <td>${d.specialDiscount > 0 ? `-${formatMoney(d.specialDiscount)}` : '0.00'}</td>
                    </tr>
                    <tr>
                      <td>ภาษีมูลค่าเพิ่ม VAT ${esc(d.vatRate)}%</td>
                      <td>${formatMoney(d.vatAmount)}</td>
                    </tr>
                    <tr class="is-grand">
                      <td>รวมเงินสุทธิ (Price Amount)</td>
                      <td>${formatMoney(d.grandTotal)}</td>
                    </tr>
                  </tbody>
                </table>
                <div class="ptx-oq-baht-text">(${esc(d.bahtText)})</div>
              </div>
            </div>

            <!-- 6. Official Signature Footer (No circle/oval around stamp; blank dotted lines when Preliminary) -->
            <footer class="ptx-oq-signatures">
              <div class="ptx-oq-sig-customer">
                <div class="ptx-oq-sig-line">ผู้อนุมัติสั่งซื้อ .................................................... ( ชื่อตัวบรรจง )</div>
                <div class="ptx-oq-sig-date">วันที่ ............... / ............... / ...............</div>
                <div class="ptx-oq-sig-stamp-label">พร้อมตราประทับบริษัท</div>
              </div>

              <div class="ptx-oq-sig-protex">
                ${proposerSigHTML}
                ${approverSigHTML}
              </div>
            </footer>
          </div>`
          : `<div class="ptx-oq-bottom-stack"><div class="ptx-oq-cont-bar">มีรายการต่อเนื่องในแผ่นที่ ${pageIdx + 2} / ${totalPages} &rarr;</div></div>`;

        return `
        <div class="a4-quotation-sheet ptx-oq-sheet" data-paper="A4-portrait" data-doc-type="${esc(d.docType)}" data-page="${pageIdx + 1}">
          <div class="ptx-oq-header-stack">
            <!-- 1. Corporate Letterhead (Strictly matches original — NO Email line) -->
            <header class="ptx-oq-letterhead">
              <div class="ptx-oq-lh-left">
                <div class="ptx-oq-company-en">${esc(d.letterhead.companyEn)}</div>
                <p class="ptx-oq-lh-line">${esc(d.letterhead.addressEn)}</p>
                <p class="ptx-oq-lh-line ptx-oq-lh-line--contact">
                  <span>TEL. ${esc(d.letterhead.tel)}</span>
                  <span>FAX. ${esc(d.letterhead.fax)}</span>
                  <span>${esc(d.letterhead.web)}</span>
                </p>
                <div class="ptx-oq-tax">TAX ID No. ${esc(d.letterhead.taxId)}</div>
              </div>
              <div class="ptx-oq-lh-right">
                <img src="${esc(logoSrc)}" alt="PROTEX GROUP" class="ptx-oq-logo">
              </div>
            </header>

            <!-- 2. Quotation Title Bar -->
            <div class="ptx-oq-titlebar ${d.isPreliminary ? 'ptx-oq-titlebar--prelim' : ''}">
              ${pageBadgeHTML}
              ${titleCenterHTML}
              <div class="ptx-oq-titlebar__right">
                <span class="ptx-oq-rev">${esc(d.revision)}</span>
                <span class="ptx-oq-docno">NO. ${esc(d.displayNo)}</span>
              </div>
            </div>

            <!-- 3. Client Information Grid (6-Column Fixed Grid: CLIENT + ATTN / TEL. + FAX. + DATE) -->
            <table class="ptx-oq-client-table">
              <colgroup>
                <col style="width:11%;">
                <col style="width:33%;">
                <col style="width:10%;">
                <col style="width:20%;">
                <col style="width:9%;">
                <col style="width:17%;">
              </colgroup>
              <tbody>
                <tr>
                  <td class="ptx-oq-cl-lbl">เสนอให้<br><small>CLIENT</small></td>
                  <td class="ptx-oq-cl-val">${esc(d.clientDisplay)}</td>
                  <td class="ptx-oq-cl-lbl">เรียน<br><small>ATTN.</small></td>
                  <td class="ptx-oq-cl-val" colspan="3">${esc(d.attnDisplay)}</td>
                </tr>
                <tr class="ptx-oq-client-row2">
                  <td class="ptx-oq-cl-lbl">TEL.</td>
                  <td class="ptx-oq-cl-val ptx-oq-num">${esc(d.clientTel)}</td>
                  <td class="ptx-oq-cl-lbl">FAX.</td>
                  <td class="ptx-oq-cl-val ptx-oq-num">${d.clientFax ? esc(d.clientFax) : ''}</td>
                  <td class="ptx-oq-cl-lbl" style="text-align:center;">DATE</td>
                  <td class="ptx-oq-cl-val ptx-oq-num" style="text-align:center;">${esc(d.dateDisplay)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 4. Official 7-Column Itemized Zone (7% / 38% / 7% / 8% / 15% / 9% / 16%) -->
          <div class="ptx-oq-items-zone">
            <table class="ptx-oq-items-table">
              <colgroup>
                <col style="width:7%;">
                <col style="width:38%;">
                <col style="width:7%;">
                <col style="width:8%;">
                <col style="width:15%;">
                <col style="width:9%;">
                <col style="width:16%;">
              </colgroup>
              <thead>
                <tr>
                  <th class="ptx-oq-col-item">ลำดับ<small>Item</small></th>
                  <th class="ptx-oq-col-desc">รายการ<small>Description</small></th>
                  <th class="ptx-oq-col-qty">จำนวน<small>Qty.</small></th>
                  <th class="ptx-oq-col-unit">หน่วย<small>Unit</small></th>
                  <th class="ptx-oq-col-unitprice">บาท/หน่วย<small>Unit Price</small></th>
                  <th class="ptx-oq-col-disc">ส่วนลด<small>Discount</small></th>
                  <th class="ptx-oq-col-amt">รวม<small>Amount</small></th>
                </tr>
              </thead>
              <tbody>
                ${itemRowsHTML}
                <tr class="ptx-oq-filler-row" aria-hidden="true">
                  <td class="ptx-oq-col-item"></td>
                  <td class="ptx-oq-col-desc"></td>
                  <td class="ptx-oq-col-qty"></td>
                  <td class="ptx-oq-col-unit"></td>
                  <td class="ptx-oq-col-unitprice"></td>
                  <td class="ptx-oq-col-disc"></td>
                  <td class="ptx-oq-col-amt"></td>
                </tr>
              </tbody>
            </table>
          </div>

          ${bottomSectionHTML}
        </div>`;
      })
      .join('');

    return `
      ${includeStyleTag ? `<style>${getOfficialQuotationStyles()}</style>` : ''}
      <div class="a4-sheets-stack">${sheetsHTML}</div>
    `;
  }

  /**
   * Proportional Auto-Fit Scaling for Live A4 Preview Containers (Browser only)
   * Keeps `.a4-quotation-sheet` at exact 210mm x 297mm and reserves exact total scaled height across all pages.
   */
  function syncA4PreviewScale(containerEl) {
    if (!containerEl || typeof window === 'undefined') return;
    const stage = containerEl.querySelector('.a4-preview-stage');
    const slot = containerEl.querySelector('.a4-sheet-scale-slot');
    const inner = containerEl.querySelector('.a4-sheet-scale-inner');
    const sheets = inner ? inner.querySelectorAll('.a4-quotation-sheet') : [];
    if (!stage || !slot || !inner || !sheets.length) return;

    const pageCount = sheets.length;
    containerEl.dataset.pageCount = String(pageCount);

    // Update any nearby page-count indicator badge in modal/admin toolbar
    const rootScope = containerEl.closest('.qt-studio-right, .adm-qt-studio-preview') || containerEl.parentElement;
    const pageCountEl = rootScope?.querySelector('[data-a4-page-count]');
    if (pageCountEl) {
      pageCountEl.textContent = pageCount > 1 ? `· ทั้งหมด ${pageCount} แผ่น (เลื่อนดูด้านล่าง)` : '· 1 แผ่น';
    }

    const rawAvailW = stage.clientWidth || containerEl.clientWidth || 0;
    if (rawAvailW <= 0) return;

    const firstSheet = sheets[0];
    const singleW = firstSheet.offsetWidth || 793.7;
    const singleH = firstSheet.offsetHeight || 1122.52;
    const GAP_PX = 28;

    const naturalW = singleW;
    const naturalH = pageCount * singleH + Math.max(0, pageCount - 1) * GAP_PX;

    const usableW = Math.max(220, rawAvailW - 8);
    const scale = Math.min(1, usableW / naturalW);

    inner.style.width = `${naturalW}px`;
    inner.style.transform = `scale(${scale})`;
    slot.style.width = `${Math.round(naturalW * scale)}px`;
    slot.style.height = `${Math.ceil(naturalH * scale) + 8}px`;
  }

  /**
   * Mounts / updates a Live A4 Portrait Preview inside `containerEl` with zero flicker and ResizeObserver auto-fit
   */
  function mountOfficialQuotationPreview(containerEl, rawQuote, siteSettings = {}, options = {}) {
    if (!containerEl) return;
    let stage = containerEl.querySelector('.a4-preview-stage');
    let inner = containerEl.querySelector('.a4-sheet-scale-inner');

    if (!stage || !inner) {
      containerEl.innerHTML = `
        <style data-ptx-a4-style>${getOfficialQuotationStyles()}</style>
        <div class="a4-preview-stage">
          <div class="a4-sheet-scale-slot">
            <div class="a4-sheet-scale-inner"></div>
          </div>
        </div>
      `;
      stage = containerEl.querySelector('.a4-preview-stage');
      inner = containerEl.querySelector('.a4-sheet-scale-inner');

      if (typeof ResizeObserver === 'function' && !containerEl.__ptxA4ResizeObs) {
        const ro = new ResizeObserver(() => syncA4PreviewScale(containerEl));
        ro.observe(containerEl);
        containerEl.__ptxA4ResizeObs = ro;
      }
    }

    inner.innerHTML = renderOfficialQuotationHTML(rawQuote, siteSettings, {
      ...options,
      includeStyleTag: false,
    });
    syncA4PreviewScale(containerEl);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => syncA4PreviewScale(containerEl));
    }
  }

  /**
   * Opens a dedicated ISO A4 Portrait (210mm x 297mm ONLY) Print / Save PDF Window (Browser only)
   */
  function printOfficialQuotation(rawQuote, siteSettings = {}) {
    if (typeof window === 'undefined') return;
    const d = normalizeQuotationData(rawQuote, siteSettings);
    const origin = window.location.origin || '';
    const absLogo =
      d.letterhead.logoUrl.startsWith('http') || d.letterhead.logoUrl.startsWith('data:')
        ? d.letterhead.logoUrl
        : `${origin}/${d.letterhead.logoUrl.replace(/^\//, '')}`;

    const sheetHTML = renderOfficialQuotationHTML(rawQuote, siteSettings, {
      includeStyleTag: false,
      logoUrlOverride: absLogo,
    });

    const win = window.open('', '_blank', 'width=980,height=920');
    if (!win) {
      window.print();
      return;
    }

    win.document.write(`<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>ใบเสนอราคา A4 ${esc(d.displayNo)} — PROTEX ACCESSORY INDUSTRIAL LTD., PART.</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    html, body {
      margin: 0;
      padding: 18px 0 28px;
      background: #CBD5E1;
      font-family: 'Sarabun', 'IBM Plex Sans Thai', sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-toolbar {
      width: 210mm;
      box-sizing: border-box;
      margin: 0 auto 14px;
      padding: 10px 16px;
      background: #0F172A;
      color: #FFFFFF;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 13px;
      box-shadow: 0 10px 24px -8px rgba(15, 23, 42, 0.35);
    }
    .print-toolbar__meta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .print-toolbar__badge {
      padding: 2px 8px;
      border-radius: 6px;
      background: rgba(220, 38, 38, 0.25);
      border: 1px solid rgba(248, 113, 113, 0.5);
      color: #FCA5A5;
      font-size: 11.5px;
      font-weight: 700;
    }
    .print-toolbar button {
      background: #DC2626;
      color: #FFFFFF;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    ${getOfficialQuotationStyles()}
    @media print {
      html, body {
        width: 210mm !important;
        background: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .print-toolbar { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="print-toolbar">
    <div class="print-toolbar__meta">
      <span class="print-toolbar__badge">ISO A4 แนวตั้ง (210 × 297 mm) เท่านั้น</span>
      <span>${d.isPreliminary ? 'ใบเสนอราคาเบื้องต้น (ยังไม่มีการตรวจสอบจากบริษัท)' : 'ใบเสนอราคาฉบับทางการ'} <strong>NO. ${esc(d.displayNo)} (${esc(d.revision)})</strong></span>
    </div>
    <button type="button" onclick="window.print()">สั่งพิมพ์ A4 / บันทึก PDF</button>
  </div>
  ${sheetHTML}
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 350);
    });
  <\/script>
</body>
</html>`);
    win.document.close();
  }

  /**
   * Builds inline-CSS HTML Email matching the Official Quotation Layout (NO email shown on document paper)
   */
  function buildOfficialQuotationEmailHTML(rawQuote, siteSettings = {}, isInternalAlert = false) {
    const d = normalizeQuotationData(rawQuote, siteSettings);
    const itemRows = d.items
      .map((row) => {
        const bullets = (row.bullets || [])
          .map((b) => `<div style="font-size:11.5px;color:#475569;margin-top:2px;">- ${esc(b)}</div>`)
          .join('');
        return `
          <tr>
            <td style="border:1px solid #CBD5E1;padding:7px 5px;text-align:center;vertical-align:top;white-space:nowrap;">${row.no}</td>
            <td style="border:1px solid #CBD5E1;padding:7px 8px;vertical-align:top;">
              <div style="font-weight:700;color:#0F172A;">${esc(row.title)}</div>
              ${bullets}
            </td>
            <td style="border:1px solid #CBD5E1;padding:7px 5px;text-align:center;vertical-align:top;white-space:nowrap;">${QTY_FMT.format(row.qty)}</td>
            <td style="border:1px solid #CBD5E1;padding:7px 5px;text-align:center;vertical-align:top;white-space:nowrap;">${esc(row.unit)}</td>
            <td style="border:1px solid #CBD5E1;padding:7px 10px 7px 6px;text-align:right;vertical-align:top;white-space:nowrap;font-size:11.5px;">${formatMoney(row.unitPrice)}</td>
            <td style="border:1px solid #CBD5E1;padding:7px 8px 7px 6px;text-align:right;vertical-align:top;white-space:nowrap;font-size:11.5px;">${row.discount > 0 ? formatMoney(row.discount) : '-'}</td>
            <td style="border:1px solid #CBD5E1;padding:7px 10px 7px 6px;text-align:right;vertical-align:top;font-weight:700;white-space:nowrap;font-size:11.5px;">${formatMoney(row.amount)}</td>
          </tr>`;
      })
      .join('');

    const payTerms = d.paymentTerms
      .map((t, idx) => `<div style="margin-top:2px;">${idx + 1}. ${esc(t)}</div>`)
      .join('');

    const emailTitleHTML = d.isPreliminary
      ? `ใบเสนอราคาเบื้องต้น (คำนวณจากสินค้าหน้าเว็บ) <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:#FEF2F2;border:1px solid #FCA5A5;color:#B91C1C;font-size:11px;">รอการตรวจสอบจากบริษัท</span>`
      : `<span style="color:#B91C1C;">QUOTATION</span> ใบเสนอราคา`;

    const proposerEmailHTML =
      !d.isPreliminary && d.proposerName
        ? `<div style="font-weight:700;">${esc(d.proposerName)}</div>
           <div style="color:#475569;">${esc(d.proposerTitle)}</div>
           <div style="color:#475569;">${esc(d.proposerTel)}</div>`
        : `<div style="color:#64748B;">........................................</div>
           <div style="color:#64748B;font-size:10.5px;margin-top:3px;">( ........................................ )</div>`;

    const approverEmailHTML =
      !d.isPreliminary && d.approverName
        ? `<div style="font-weight:700;">${esc(d.approverName)}</div>
           <div style="color:#475569;">${esc(d.approverTitle)}</div>`
        : `<div style="color:#64748B;">........................................</div>
           <div style="color:#64748B;font-size:10.5px;margin-top:3px;">( ........................................ )</div>`;

    return `<!DOCTYPE html>
<html lang="th">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#F1F5F9;font-family:'Sarabun','IBM Plex Sans Thai',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0F172A;">
  <div style="max-width:780px;margin:0 auto;background:#FFFFFF;border:1px solid #CBD5E1;border-radius:12px;padding:26px 28px;">
    ${
      isInternalAlert
        ? `<div style="margin-bottom:14px;padding:10px 14px;border-radius:8px;background:#FFFBEB;border:1px solid #FCD34D;color:#92400E;font-size:12.5px;line-height:1.5;">
            <strong>แจ้งเตือนทีมงาน PROTEX — มีคำขอใบเสนอราคาเบื้องต้นรอตรวจสอบ (NO. ${esc(d.displayNo)})</strong><br>
            อีเมลติดต่อกลับลูกค้า: <strong>${esc(rawQuote?.contact?.email || '-')}</strong> · กรุณาเข้าสู่หน้า Admin Dashboard เพื่อตรวจสอบราคา/เงื่อนไข ใส่ชื่อผู้ลงนาม และกดส่งใบเสนอราคาฉบับทางการกลับไปยังลูกค้า
          </div>`
        : `<div style="margin-bottom:14px;padding:10px 14px;border-radius:8px;background:#ECFDF5;border:1px solid #A7F3D0;color:#065F46;font-size:12.5px;line-height:1.5;">
            <strong>ใบเสนอราคาฉบับทางการจาก PROTEX GROUP (ผ่านการตรวจสอบและอนุมัติแล้ว)</strong><br>
            เลขที่เอกสาร NO. ${esc(d.displayNo)} (${esc(d.revision)}) · หากต้องการสอบถามเพิ่มเติม ติดต่อ โทร. 085-392-4448 หรือ LINE: protex000
          </div>`
    }
    <table style="width:100%;border-collapse:collapse;border-bottom:2px solid #B91C1C;padding-bottom:10px;margin-bottom:12px;">
      <tr>
        <td style="vertical-align:top;padding-bottom:10px;">
          <div style="font-size:16px;font-weight:800;color:#0F172A;">${esc(d.letterhead.companyEn)}</div>
          <div style="font-size:11.5px;color:#334155;margin-top:3px;">${esc(d.letterhead.addressEn)}</div>
          <div style="font-size:11.5px;color:#334155;margin-top:2px;">TEL. ${esc(d.letterhead.tel)} &nbsp;&nbsp; FAX. ${esc(d.letterhead.fax)} &nbsp;&nbsp; ${esc(d.letterhead.web)}</div>
          <div style="font-size:11.5px;font-weight:700;color:#0F172A;margin-top:3px;">TAX ID No. ${esc(d.letterhead.taxId)}</div>
        </td>
        <td style="vertical-align:middle;text-align:right;width:160px;padding-bottom:10px;">
          <div style="display:inline-block;font-size:20px;font-weight:900;color:#0F172A;letter-spacing:0.02em;">PROTEX <span style="color:#DC2626;">GROUP</span></div>
        </td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;background:${d.isPreliminary ? '#FFFBEB' : '#FEF2F2'};border:1px solid #CBD5E1;border-left:4px solid ${d.isPreliminary ? '#D97706' : '#B91C1C'};margin-bottom:10px;">
      <tr>
        <td style="padding:8px 12px;font-size:14.5px;font-weight:800;color:#0F172A;">
          ${emailTitleHTML}
        </td>
        <td style="padding:8px 12px;text-align:right;font-size:12.5px;font-weight:800;white-space:nowrap;">
          <span style="color:#B91C1C;margin-right:10px;">${esc(d.revision)}</span>
          <span>NO. ${esc(d.displayNo)}</span>
        </td>
      </tr>
    </table>

    <table style="width:100%;table-layout:fixed;border-collapse:collapse;border:1px solid #CBD5E1;font-size:12px;margin-bottom:10px;">
      <colgroup>
        <col style="width:11%;"><col style="width:33%;"><col style="width:10%;"><col style="width:20%;"><col style="width:9%;"><col style="width:17%;">
      </colgroup>
      <tr>
        <td style="border:1px solid #CBD5E1;background:#F8FAFC;padding:6px 8px;font-weight:700;white-space:nowrap;">เสนอให้ / CLIENT</td>
        <td style="border:1px solid #CBD5E1;padding:6px 8px;font-weight:700;">${esc(d.clientDisplay)}</td>
        <td style="border:1px solid #CBD5E1;background:#F8FAFC;padding:6px 8px;font-weight:700;white-space:nowrap;">เรียน / ATTN.</td>
        <td style="border:1px solid #CBD5E1;padding:6px 8px;font-weight:700;" colspan="3">${esc(d.attnDisplay)}</td>
      </tr>
      <tr>
        <td style="border:1px solid #CBD5E1;background:#F8FAFC;padding:6px 8px;font-weight:700;white-space:nowrap;">TEL.</td>
        <td style="border:1px solid #CBD5E1;padding:6px 8px;font-weight:700;white-space:nowrap;">${esc(d.clientTel)}</td>
        <td style="border:1px solid #CBD5E1;background:#F8FAFC;padding:6px 8px;font-weight:700;white-space:nowrap;">FAX.</td>
        <td style="border:1px solid #CBD5E1;padding:6px 8px;font-weight:700;white-space:nowrap;">${d.clientFax ? esc(d.clientFax) : ''}</td>
        <td style="border:1px solid #CBD5E1;background:#F8FAFC;padding:6px 8px;font-weight:700;text-align:center;white-space:nowrap;">DATE</td>
        <td style="border:1px solid #CBD5E1;padding:6px 8px;font-weight:700;text-align:center;white-space:nowrap;">${esc(d.dateDisplay)}</td>
      </tr>
    </table>

    <table style="width:100%;table-layout:fixed;border-collapse:collapse;border:1px solid #CBD5E1;font-size:12px;margin-bottom:10px;">
      <colgroup>
        <col style="width:7%;"><col style="width:38%;"><col style="width:7%;"><col style="width:8%;"><col style="width:15%;"><col style="width:9%;"><col style="width:16%;">
      </colgroup>
      <thead>
        <tr style="background:#0F172A;color:#FFFFFF;">
          <th style="border:1px solid #334155;padding:7px 4px;white-space:nowrap;">ลำดับ</th>
          <th style="border:1px solid #334155;padding:7px 8px;text-align:left;">รายการ (Description)</th>
          <th style="border:1px solid #334155;padding:7px 4px;white-space:nowrap;">จำนวน</th>
          <th style="border:1px solid #334155;padding:7px 4px;white-space:nowrap;">หน่วย</th>
          <th style="border:1px solid #334155;padding:7px 10px 7px 4px;text-align:right;white-space:nowrap;">บาท/หน่วย</th>
          <th style="border:1px solid #334155;padding:7px 8px 7px 4px;text-align:right;white-space:nowrap;">ส่วนลด</th>
          <th style="border:1px solid #334155;padding:7px 10px 7px 4px;text-align:right;white-space:nowrap;">รวม (Amount)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div style="padding:8px 12px;background:#F8FAFC;border:1px solid #CBD5E1;border-left:3.5px solid #0F172A;font-size:12px;margin-bottom:12px;">
      <strong style="color:#B91C1C;">บัญชีในการโอนเงิน:</strong> ${esc(d.bankAccountName)} &nbsp;|&nbsp; <strong>${esc(d.bankDetails)}</strong>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <tr>
        <td style="vertical-align:top;padding-right:14px;width:58%;line-height:1.55;color:#1E293B;">
          <div style="font-weight:800;text-decoration:underline;margin-bottom:4px;">หมายเหตุ / REMARK</div>
          ${
            d.isPreliminary
              ? `<div style="margin-bottom:6px;padding:6px 9px;border-radius:5px;background:#FFFBEB;border:1px solid #FCD34D;color:#92400E;font-size:11px;font-weight:700;">${esc(d.preliminaryNotice)}</div>`
              : ''
          }
          <div><strong>กำหนดส่งมอบ (DELIVERY):</strong> ${esc(d.deliveryTerm)}</div>
          <div><strong>กำหนดยืนราคา (PRICE VALID FOR):</strong> ${esc(d.priceValidFor)}</div>
          ${d.remarkNote ? `<div><strong>หมายเหตุเพิ่มเติม:</strong> ${esc(d.remarkNote)}</div>` : ''}
          <div style="margin-top:4px;"><strong>เงื่อนไขการชำระเงิน (PAYMENT TERM):</strong>${payTerms}</div>
        </td>
        <td style="vertical-align:top;width:42%;">
          <table style="width:100%;border-collapse:collapse;border:1px solid #CBD5E1;">
            <tr>
              <td style="border:1px solid #CBD5E1;background:#F8FAFC;padding:6px 8px;font-weight:700;">รวมเป็นเงิน (Subtotal)</td>
              <td style="border:1px solid #CBD5E1;padding:6px 10px;text-align:right;font-weight:700;white-space:nowrap;">${formatMoney(d.itemsSubtotal)}</td>
            </tr>
            <tr>
              <td style="border:1px solid #CBD5E1;background:#F8FAFC;padding:6px 8px;font-weight:700;">ส่วนลดพิเศษ (Special Discount)</td>
              <td style="border:1px solid #CBD5E1;padding:6px 10px;text-align:right;font-weight:700;color:#B91C1C;white-space:nowrap;">${d.specialDiscount > 0 ? `-${formatMoney(d.specialDiscount)}` : '0.00'}</td>
            </tr>
            <tr>
              <td style="border:1px solid #CBD5E1;background:#F8FAFC;padding:6px 8px;font-weight:700;">ภาษีมูลค่าเพิ่ม VAT ${esc(d.vatRate)}%</td>
              <td style="border:1px solid #CBD5E1;padding:6px 10px;text-align:right;font-weight:700;white-space:nowrap;">${formatMoney(d.vatAmount)}</td>
            </tr>
            <tr style="background:#FEF2F2;">
              <td style="border:1px solid #B91C1C;padding:8px;font-weight:800;color:#991B1B;">รวมเงินสุทธิ (Price Amount)</td>
              <td style="border:1px solid #B91C1C;padding:8px 10px;text-align:right;font-size:14px;font-weight:900;color:#B91C1C;white-space:nowrap;">${formatMoney(d.grandTotal)}</td>
            </tr>
          </table>
          <div style="margin-top:4px;padding:5px 8px;background:#F8FAFC;border:1px solid #CBD5E1;text-align:center;font-size:11px;font-weight:700;">(${esc(d.bahtText)})</div>
        </td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;margin-top:18px;padding-top:12px;border-top:1px solid #CBD5E1;font-size:11.5px;text-align:center;">
      <tr>
        <td style="width:46%;vertical-align:top;padding:8px;">
          <div style="margin-top:16px;">ผู้อนุมัติสั่งซื้อ ........................................ ( ชื่อตัวบรรจง )</div>
          <div style="margin-top:6px;">วันที่ ........ / ........ / ........</div>
          <div style="margin-top:6px;font-weight:700;padding-bottom:20px;">พร้อมตราประทับบริษัท</div>
        </td>
        <td style="width:27%;vertical-align:top;padding:8px;">
          <div style="font-weight:700;margin-bottom:18px;">ผู้เสนอราคา</div>
          ${proposerEmailHTML}
        </td>
        <td style="width:27%;vertical-align:top;padding:8px;">
          <div style="font-weight:700;margin-bottom:18px;">ผู้อนุมัติ</div>
          ${approverEmailHTML}
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  return {
    DEFAULT_QUOTATION_SETTINGS,
    formatMoney,
    formatDateBuddhistDMY,
    numberToThaiBahtText,
    normalizeQuotationData,
    getOfficialQuotationStyles,
    renderOfficialQuotationHTML,
    mountOfficialQuotationPreview,
    syncA4PreviewScale,
    printOfficialQuotation,
    buildOfficialQuotationEmailHTML,
  };
});
