/* ============================================================================
 * VOUCHERS TABLE (wow2)
 * Mirrors the Tickets module, but for voucher types.
 * DB columns (wow_voucher_types):
 *  voucher_type_id, element_id, category(INCLUDED|SELECTIVE), usage_type(ONE|MULTI),
 *  name, price_per_person, included_qty, per_participant_max, per_time_slot_cap, voucher_text
 * ==========================================================================*/

/* -------------------
 * SAFE ACCESSORS
 * -------------------*/
function EO() {
  const root = (window.EditElementObject ||= {});
  root.ElementTicketArray  ||= [];
  root.ElementVoucherArray ||= [];
  root.ElementPostArray    ||= [];
  root.element             ||= {};
  return root;
}
function getVouchers() { return EO().ElementVoucherArray; }
function setVouchers(next) { EO().ElementVoucherArray = Array.isArray(next) ? next : []; }

/* ============================================================================
 * MAIN RENDER — Voucher tab
 * Left labels: סוג | מחיר | כמות  (3 data cols; action is auto-added by row builder)
 * ==========================================================================*/
function renderVoucherTabForService_wow2(ui) {
  // keep a ref so modals can re-render this tab
  window.__vouchers_ui_ref = ui;

  const rows = getVouchers();

  ui.panel.innerHTML =
    '<section class="wow2-section">' +
      '<div class="wow2-sub-h">טבלת וואוצ׳רים</div>' +

      renderInfoBox2_wow2(
        'וואוצ׳רים מאפשרים להציע מוצרים, שירותים והטבות באירוע. יש שני סוגים: "כלולים" שניתנים לכל משתתף, ו"בחירה" שהמשתתף בוחר מהם בעת הרכישה.'
      ) +

      '<div class="wow2-container wow2-card-rail wow2-mt-s" id="wow2_vouchers_table">' +

        // header: right label + 3 left labels (actions column is implicit)
        buildHeaderStrip_wow2_darker("שם וואוצ׳ר", 3, "סוג", "מחיר", "כמות") +


// rows
rows.map((v, i) => {
  const rightTitle = (v?.name || '—').toString();

  // Map English category to Hebrew label
  let kind = '—';
  if (v?.category) {
    const cat = v.category.toString().toUpperCase();
    if (cat === 'INCLUDED') kind = 'כלול';
    else if (cat === 'SELECTIVE') kind = 'בחירה';
  }

  const price  = (v?.price_per_person ?? '—');
  const amount = v?.category === 'INCLUDED'
    ? (v?.included_qty ?? '—')
    : (v?.per_participant_max ?? '—');

  const voucherId = v?.voucher_type_id ?? i;

  const iconData = {
    entityType: 'voucher_type',
    entityId:   voucherId,
    tab:        'IN_CREATION'
  };

  return buildRowStrip_wow2_darker('fresh', rightTitle, 3, iconData, kind, price, amount);
}).join('') +

        // TWO ADD BUTTONS (no chooser modal)
        '<div class="wow2-btnstrip wow2-btnstrip--right wow2-mt-s" id="wow2_vouchers_add_strip">' +
          '<button id="wow2_add_voucher_included" class="wow2-btn wow2-btn--fresh">+ הוסף ואוצ׳ר כלול</button>' +
          '<button id="wow2_add_voucher_selective" class="wow2-btn wow2-btn--fresh">+ הוסף ואוצ׳ר בחירה</button>' +
        '</div>' +

      '</div>' +
    '</section>';

  // --- EVENTS --------------------------------------------------

  // Add: INCLUDED
  const addIncluded = document.getElementById('wow2_add_voucher_included');
  if (addIncluded) {
    addIncluded.onclick = () => openIncludedVoucherModal_wow2();
  }

  // Add: SELECTIVE
  const addSelective = document.getElementById('wow2_add_voucher_selective');
  if (addSelective) {
    addSelective.onclick = () => openSelectiveVoucherModal_wow2();
  }

  // Row action (play icon) → use the global icon menu (this table is on the main page)
  ui.panel.querySelectorAll('.wow2-row-menu, .wow2-action-icon--play').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const entityType = btn.getAttribute('data-entity-type'); // 'voucher_type'
      const entityId   = btn.getAttribute('data-entity-id');
      const tab        = btn.getAttribute('data-entity-tab');  // 'IN_CREATION'

      if (typeof window.openIconMenu === 'function' && entityType && entityId && tab) {
        window.openIconMenu({ anchorEl: btn, entityType, entityId, tab });
        return;
      }

      // fallback: open edit modal based on category
      const v = getVouchers().find(x => (x.voucher_type_id ?? '') == entityId);
      const idx = getVouchers().findIndex(x => (x.voucher_type_id ?? '') == entityId);
      if (v?.category === 'INCLUDED') openIncludedVoucherModal_wow2(v, idx);
      else openSelectiveVoucherModal_wow2(v, idx);
    });
  });
}

// =====================================================================
// EMPTY VOUCHER TAB (wow2)
// Called when element_type is not HOST
// =====================================================================

function renderEmptyVoucherTab_wow2(ui) {

  if (!ui || !ui.panel) return;

  ui.panel.innerHTML =
    '<section class="wow2-section" style="margin-top:40px; margin-bottom:40px;">' +
      '<div class="wow2-container wow2-card-rail" style="text-align:center;">' +
        '<div class="wow2-label" style="font-size:12px; color:#ffffff; font-weight:800;">' +
          '------------  יש ואוצ׳רים רק לאלמנט שירות  ------------' +
        '</div>' +
      '</div>' +
    '</section>';
}

/* ============================================================================
 * INCLUDED VOUCHER MODAL
 * ==========================================================================*/
function openIncludedVoucherModal_wow2(voucher = null, index = -1) {
  const isEdit = index >= 0;

  const init = {
    name:               voucher?.name || '',
    price_per_person:   voucher?.price_per_person ?? '',
    usage_type:        (voucher?.usage_type || 'ONE').toUpperCase(), // ONE | MULTI
    included_qty:       Number(voucher?.included_qty ?? 1),
    voucher_text:       voucher?.voucher_text ?? ''
  };

  const modal = document.createElement('div');
  modal.className = 'wow2-modal-viewport';
  modal.innerHTML =
    '<div class="wow2-modal-canvas wow2-modal-canvas--dark">' +
      '<div class="wow2-title-l">' + (isEdit ? 'עריכת וואוצ׳ר כלול' : 'יצירת וואוצ׳ר כלול חדש') + '</div>' +
      buildIncludedVoucherTypeForm_wow2(init) +
      '<div id="v_err" class="wow2-note wow2-mt-s" style="display:none;color:#ff8080"></div>' +
      '<div class="wow2-btnstrip wow2-btnstrip--right wow2-mt-s">' +
        '<button id="v_save" class="wow2-btn wow2-btn--fresh">שמור וואוצ׳ר</button>' +
        '<button id="v_cancel" class="wow2-btn">בטל</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelector('#v_cancel').onclick = close;

  const errEl  = modal.querySelector('#v_err');
  const saveEl = modal.querySelector('#v_save');

  const setSaving = (on) => { saveEl.disabled = on; saveEl.textContent = on ? 'שומר…' : 'שמור וואוצ׳ר'; };
  const showError = (msg) => { errEl.textContent = msg || 'שמירה נכשלה'; errEl.style.display = 'block'; };

  saveEl.onclick = async () => {
    const payload = {
      element_id:        EO().element?.element_id ?? 0,
      voucher_type_id:   voucher?.voucher_type_id ?? null,
      category:         'INCLUDED',
      name:             (document.getElementById('v_name')?.value || '').trim(),
      price_per_person: Number(document.getElementById('v_price')?.value || 0),
      usage_type:       (document.querySelector('input[name="v_usage"]:checked')?.value || 'ONE').toUpperCase(),
      included_qty:     Number(document.getElementById('v_included_qty')?.value || 1),
      voucher_text:     (document.getElementById('v_text')?.value || '').trim()
    };

    if (!payload.name) { showError('יש להזין שם.'); return; }

    errEl.style.display = 'none';
    setSaving(true);

    try {
      const saved = await apiSaveVoucherType_wow2(payload);
      if (!saved || !saved.voucher_type_id) throw new Error('Malformed server response');

      const next = {
        voucher_type_id:   saved.voucher_type_id,
        element_id:        saved.element_id ?? payload.element_id,
        category:          saved.category ?? payload.category,
        usage_type:        saved.usage_type ?? payload.usage_type,
        name:              saved.name ?? payload.name,
        price_per_person:  saved.price_per_person ?? payload.price_per_person,
        included_qty:      saved.included_qty ?? payload.included_qty,
        voucher_text:      saved.voucher_text ?? payload.voucher_text
      };

      const list = getVouchers().slice();
      if (isEdit) list[index] = next; else list.push(next);
      setVouchers(list);

      close();
      if (window.__vouchers_ui_ref) renderVoucherTabForService_wow2(window.__vouchers_ui_ref);
    } catch (e) {
      console.warn('save included voucher failed', e);
      showError(e?.message);
    } finally {
      setSaving(false);
    }
  };
}

/* ============================================================================
 * SELECTIVE VOUCHER MODAL
 * ==========================================================================*/
function openSelectiveVoucherModal_wow2(voucher = null, index = -1) {
  const isEdit = index >= 0;

  const init = {
    name:                 voucher?.name || '',
    price_per_person:     voucher?.price_per_person ?? '',
    usage_type:          (voucher?.usage_type || 'ONE').toUpperCase(),
    per_participant_max:  Number(voucher?.per_participant_max ?? 1),
    per_time_slot_cap:    Number(voucher?.per_time_slot_cap ?? 0),
    voucher_text:         voucher?.voucher_text ?? ''
  };

  const modal = document.createElement('div');
  modal.className = 'wow2-modal-viewport';
  modal.innerHTML =
    '<div class="wow2-modal-canvas wow2-modal-canvas--dark">' +
      '<div class="wow2-title-l">' + (isEdit ? 'עריכת וואוצ׳ר בחירה' : 'יצירת וואוצ׳ר בחירה חדש') + '</div>' +
      buildSelectiveVoucherTypeForm_wow2(init) +
      '<div id="v_err" class="wow2-note wow2-mt-s" style="display:none;color:#ff8080"></div>' +
      '<div class="wow2-btnstrip wow2-btnstrip--right wow2-mt-s">' +
        '<button id="v_save" class="wow2-btn wow2-btn--fresh">שמור וואוצ׳ר</button>' +
        '<button id="v_cancel" class="wow2-btn">בטל</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelector('#v_cancel').onclick = close;

  const errEl  = modal.querySelector('#v_err');
  const saveEl = modal.querySelector('#v_save');

  const setSaving = (on) => { saveEl.disabled = on; saveEl.textContent = on ? 'שומר…' : 'שמור וואוצ׳ר'; };
  const showError = (msg) => { errEl.textContent = msg || 'שמירה נכשלה'; errEl.style.display = 'block'; };

  saveEl.onclick = async () => {
    const payload = {
      element_id:         EO().element?.element_id ?? 0,
      voucher_type_id:    voucher?.voucher_type_id ?? null,
      category:          'SELECTIVE',
      name:              (document.getElementById('v_name')?.value || '').trim(),
      price_per_person:  Number(document.getElementById('v_price')?.value || 0),
      usage_type:        (document.querySelector('input[name="v_usage"]:checked')?.value || 'ONE').toUpperCase(),
      per_participant_max: Number(document.getElementById('v_pp_max')?.value || 1),
      per_time_slot_cap:   Number(document.getElementById('v_slot_cap')?.value || 0),
      voucher_text:        (document.getElementById('v_text')?.value || '').trim()
    };

    if (!payload.name) { showError('יש להזין שם.'); return; }

    errEl.style.display = 'none';
    setSaving(true);

    try {
      const saved = await apiSaveVoucherType_wow2(payload);
      if (!saved || !saved.voucher_type_id) throw new Error('Malformed server response');

      const next = {
        voucher_type_id:     saved.voucher_type_id,
        element_id:          saved.element_id ?? payload.element_id,
        category:            saved.category ?? payload.category,
        usage_type:          saved.usage_type ?? payload.usage_type,
        name:                saved.name ?? payload.name,
        price_per_person:    saved.price_per_person ?? payload.price_per_person,
        per_participant_max: saved.per_participant_max ?? payload.per_participant_max,
        per_time_slot_cap:   saved.per_time_slot_cap ?? payload.per_time_slot_cap,
        voucher_text:        saved.voucher_text ?? payload.voucher_text
      };

      const list = getVouchers().slice();
      if (isEdit) list[index] = next; else list.push(next);
      setVouchers(list);

      close();
      if (window.__vouchers_ui_ref) renderVoucherTabForService_wow2(window.__vouchers_ui_ref);
    } catch (e) {
      console.warn('save selective voucher failed', e);
      showError(e?.message);
    } finally {
      setSaving(false);
    }
  };
}

/* ============================================================================
 * API helper — save (create/update) voucher type
 * Expect { voucher_type_id, element_id, ...fields } on success
 * ==========================================================================*/
async function apiSaveVoucherType_wow2(payload) {
  const url = (window.WOW_API && window.WOW_API.voucherTypeSaveURL)
              || '/wp-json/wow/v1/voucher-type';
  const nonce = window.WOW_API?.nonce;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(nonce ? { 'X-WP-Nonce': nonce } : {})
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let msg = 'Server error';
    try { const j = await res.json(); msg = j?.message || msg; } catch(_) {}
    throw new Error(msg);
  }
  return await res.json();
}

/* ============================================================================
 * FORM BUILDERS (wow2 containers)
 * ==========================================================================*/
function buildIncludedVoucherTypeForm_wow2({
  name = '',
  price_per_person = '',
  usage_type = 'ONE',
  included_qty = 1,
  voucher_text = ''
} = {}) {
  const sec_name =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderFlexFormInput_wow2({ id:'v_name', label:'שם וואוצ׳ר:', required:true, value:name }) +
      renderInfoBox_wow2('שם הוואוצ׳ר — ייחודי לפריט זה.') +
    '</div>';

  const sec_price_usage =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderNumberInput_wow2({ id:'v_price', label:'מחיר לאדם(₪):', required:true, value:price_per_person, min:0, step:1 }) +
      renderFlexFormRadio_wow2_dark({
        id:'v_usage', name:'v_usage', label:'סוג וואוצ׳ר:',
        value:(usage_type||'ONE').toUpperCase(),
        options:[ {value:'ONE',label:'חד-פעמי'}, {value:'MULTI',label:'רב-פעמי'} ]
      }) +
      renderInfoBox_wow2('חד-פעמי = פעם אחת לאדם, רב-פעמי = שימוש חוזר (לפי הגבלות).') +
    '</div>';

  const sec_qty =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderNumberInput_wow2({ id:'v_included_qty', label:'כמות כלולה לכל משתתף:', required:true, value:included_qty, min:1, step:1 }) +
      renderInfoBox_wow2('כמה פריטים כלולים אוטומטית לכל משתתף.') +
    '</div>';

  const sec_text =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderFlexFormInput_wow2({ id:'v_text', label:'טקסט על הוואוצ׳ר:', required:false, value:voucher_text }) +
    '</div>';

  return sec_name + sec_price_usage + sec_qty + sec_text;
}

function buildSelectiveVoucherTypeForm_wow2({
  name = '',
  price_per_person = '',
  usage_type = 'ONE',
  per_participant_max = 1,
  per_time_slot_cap = 0,
  voucher_text = ''
} = {}) {
  const sec_name =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderFlexFormInput_wow2({ id:'v_name', label:'שם וואוצ׳ר:', required:true, value:name }) +
      renderInfoBox_wow2('שם הוואוצ׳ר — ייחודי לפריט זה.') +
    '</div>';

  const sec_price_usage =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderNumberInput_wow2({ id:'v_price', label:'מחיר לאדם(₪):', required:true, value:price_per_person, min:0, step:1 }) +
      renderFlexFormRadio_wow2_dark({
        id:'v_usage', name:'v_usage', label:'סוג וואוצ׳ר:',
        value:(usage_type||'ONE').toUpperCase(),
        options:[ {value:'ONE',label:'חד-פעמי'}, {value:'MULTI',label:'רב-פעמי'} ]
      }) +
      renderInfoBox_wow2('בחרו אם הוואוצ׳ר לשימוש חד-פעמי או רב-פעמי.') +
    '</div>';

  const sec_limits =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderNumberInput_wow2({ id:'v_pp_max',  label:'מקסימום למשתתף:', required:true, value:per_participant_max, min:1, step:1 }) +
      renderNumberInput_wow2({ id:'v_slot_cap',label:'מקסימום לחלון זמן:', required:false, value:per_time_slot_cap, min:0, step:1 }) +
      renderInfoBox_wow2('הגבלת כמות למשתתף, ולפי חלון זמן (אופציונלי).') +
    '</div>';

  const sec_text =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderFlexFormInput_wow2({ id:'v_text', label:'טקסט על הוואוצ׳ר:', required:false, value:voucher_text }) +
    '</div>';

  return sec_name + sec_price_usage + sec_limits + sec_text;
}

/* ============================================================================
 * VOUCHER ACTIONS REGISTRY (used by icon menu)
 * ==========================================================================*/
window.WOW_Vouchers = {
  editTypeById(id) {
    const list = getVouchers();
    const idx  = list.findIndex(x => (x.voucher_type_id ?? x.voucher_id) == id);
    const v    = idx >= 0 ? list[idx] : null;
    if (!v) return;
    if (v.category === 'INCLUDED') openIncludedVoucherModal_wow2(v, idx);
    else                            openSelectiveVoucherModal_wow2(v, idx);
  },

  async copyTypeById(id) {
    const src = getVouchers().find(x => (x.voucher_type_id ?? x.voucher_id) == id);
    if (!src) return;

    const clone = {
      element_id:          EO().element?.element_id ?? 0,
      category:           (src.category || 'INCLUDED').toUpperCase(),
      usage_type:         (src.usage_type || 'ONE').toUpperCase(),
      name:               (src.name || 'וואוצ׳ר') + ' (עותק)',
      price_per_person:    src.price_per_person ?? 0,
      included_qty:        src.included_qty ?? null,
      per_participant_max: src.per_participant_max ?? null,
      per_time_slot_cap:   src.per_time_slot_cap ?? null,
      voucher_text:        src.voucher_text ?? ''
    };

    try {
      const saved = await apiSaveVoucherType_wow2(clone);
      const next  = getVouchers().slice();
      next.push(saved);
      setVouchers(next);
      if (window.__vouchers_ui_ref) renderVoucherTabForService_wow2(window.__vouchers_ui_ref);
    } catch (e) {
      console.warn('Copy voucher type failed:', e);
      alert('שכפול נכשל');
    }
  },

  async deleteTypeById(id) {
    if (!confirm('למחוק את הוואוצ׳ר? פעולה זו אינה הפיכה.')) return;
    try {
      if (typeof apiDeleteVoucherType_wow2 === 'function') {
        await apiDeleteVoucherType_wow2(id); // optional; add PHP later
      }
      const next = getVouchers().filter(x => (x.voucher_type_id ?? x.voucher_id) != id);
      setVouchers(next);
      if (window.__vouchers_ui_ref) renderVoucherTabForService_wow2(window.__vouchers_ui_ref);
    } catch (e) {
      console.warn('Delete voucher type failed:', e);
      alert('מחיקה נכשלה');
    }
  }
};




/*
function renderVoucherTabForService_wow2(ui) {
  // keep a ref so modals can re-render this tab
  window.__vouchers_ui_ref = ui;

  const rows = getVouchers();

  ui.panel.innerHTML =
    '<section class="wow2-section">' +
      '<div class="wow2-sub-h">טבלת וואוצ׳רים</div>' +

      renderInfoBox2_wow2(
        'וואוצ׳רים מאפשרים להציע מוצרים, שירותים והטבות באירוע. יש שני סוגים: "כלולים" שניתנים לכל משתתף, ו"בחירה" שהמשתתף בוחר מהם בעת הרכישה.' // short helper
      ) +

      '<div class="wow2-container wow2-card-rail wow2-mt-s" id="wow2_vouchers_table">' +

        // header: right label + 3 left labels (actions column is implicit)
        buildHeaderStrip_wow2_darker('שם וואוצ׳ר', 3, 'סוג', 'מחיר', 'כמות') +

        // rows
        rows.map((v, i) => {
          const rightTitle = (v?.name || '—').toString();

          // what to show per column:
          const kind    = (v?.category || '—').toString();                 // INCLUDED | SELECTIVE
          const price   = (v?.price_per_person ?? '—');                    // number/—
          const amount  = (v?.category === 'INCLUDED')
                          ? (v?.included_qty ?? '—')
                          : (v?.per_participant_max ?? '—');

          // prefer real DB id, fallback to index
          const voucherId = v?.voucher_type_id ?? i;

          // play-icon metadata
          const iconData = {
            entityType: 'voucher_type',
            entityId:   voucherId,
            tab:        'IN_CREATION'
          };

          // tone, rightText, numOfLeft(=3), iconData, left1..left3
          return buildRowStrip_wow2(
            'fresh',
            rightTitle,
            3,
            iconData,
            kind, price, amount
          );
        }).join('') +

        // add button – opens a small chooser modal (included / selective)
        '<div class="wow2-btnstrip wow2-btnstrip--right wow2-mt-s">' +
          '<button id="wow2_add_voucher" class="wow2-btn wow2-btn--fresh">+ הוסף וואוצ׳ר</button>' +
        '</div>' +

      '</div>' +
    '</section>';

  // events
  const addBtn = document.getElementById('wow2_add_voucher');
  if (addBtn) {
    addBtn.onclick = () => {
      // tiny chooser modal
      const m = document.createElement('div');
      m.className = 'wow2-modal-viewport';
      m.innerHTML =
        '<div class="wow2-modal-canvas wow2-modal-canvas--dark">' +
          '<div class="wow2-title-l">צור וואוצ׳ר חדש</div>' +
          '<div class="wow2-btnstrip wow2-btnstrip--right wow2-mt-s">' +
            '<button id="v_new_included" class="wow2-btn wow2-btn--fresh">וואוצ׳ר כלול</button>' +
            '<button id="v_new_selective" class="wow2-btn wow2-btn--fresh">וואוצ׳ר בחירה</button>' +
            '<button id="v_new_cancel" class="wow2-btn">בטל</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(m);
      const close = () => m.remove();
      m.addEventListener('click', (e)=>{ if(e.target===m) close(); });
      m.querySelector('#v_new_cancel').onclick = close;
      m.querySelector('#v_new_included').onclick = () => { close(); openIncludedVoucherModal_wow2(); };
      m.querySelector('#v_new_selective').onclick = () => { close(); openSelectiveVoucherModal_wow2(); };
    };
  }

  // row play-icon → open the correct icon menu system
  ui.panel.querySelectorAll('.wow2-row-menu, .wow2-action-icon--play').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const entityType = btn.getAttribute('data-entity-type'); // 'voucher_type'
      const entityId   = btn.getAttribute('data-entity-id');
      const tab        = btn.getAttribute('data-entity-tab');

      // open modal-scoped menu if present; otherwise global menu
      const inModal = !!btn.closest('.wow2-modal-viewport, .wow2-modal-canvas');

      if (inModal && typeof window.openIconMenu_modal === 'function' && entityId) {
        window.openIconMenu_modal(btn, entityId);
        return;
      }
      if (typeof window.openIconMenu === 'function' && entityType && entityId && tab) {
        window.openIconMenu({ anchorEl: btn, entityType, entityId, tab });
        return;
      }

      // fallback: just open edit
      const idNum = Number(entityId);
      if (!Number.isNaN(idNum)) {
        const list = getVouchers();
        const idx  = list.findIndex(x => (x.voucher_type_id ?? -1) == idNum);
        const row  = idx >= 0 ? list[idx] : null;
        if (row?.category === 'INCLUDED') openIncludedVoucherModal_wow2(row, idx);
        else openSelectiveVoucherModal_wow2(row, idx);
      }
    });
  });
}
*/