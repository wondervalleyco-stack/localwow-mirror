/**
 * renderTicketsTabForHost_wow2
 * -----------------------------------------------------------------------------
 * PURPOSE:
 *  Renders the full “Ticket Types” management tab in the Creator Dashboard.
 *  Includes header, info box, all ticket rows, and an “Add Ticket” button.
 *
 * STRUCTURE:
 *  1. Header strip with column titles
 *  2. A list of ticket rows (built via buildRowStrip_wow2)
 *  3. A bottom “+ Add Ticket” button
 *
 * BEHAVIOR:
 *  - Each row’s action button (round play icon) opens the global icon menu
 *    via openIconMenu(), with entity metadata embedded in data-* attributes.
 *  - The Add Ticket button opens the ticket creation modal.
 *  - The UI re-renders after save or delete.
 *
 * DEPENDENCIES:
 *  - buildHeaderStrip_wow2_darker()
 *  - buildRowStrip_wow2()
 *  - renderInfoBox2_wow2()
 *  - openTicketModal_wow2()
 *  - openIconMenu()  (from icon_menu.js)
 *  - getTickets(), setTickets(), persistTickets() helpers
 * -----------------------------------------------------------------------------
 */
function renderTicketsTabForHost_wow2(ui) {

  // Keep reference to current UI — used after modal save to refresh table
  window.__tickets_ui_ref = ui;

  // Retrieve current tickets array from EditElementObject
  const rows = getTickets();

  // ---------------------------------------------------------------------------
  // 1) BUILD THE STATIC STRUCTURE
  // ---------------------------------------------------------------------------
  ui.panel.innerHTML =
    '<section class="wow2-section">' +
      '<div class="wow2-sub-h">טבלת סוגי כרטיסים</div>' +

      // Contextual info for creators
      renderInfoBox2_wow2(
        'הכנס את כל סוגי הכרטיסים שיהיו זמינים למשתתפים בדף הרכישה - שימו -לב - כל משתתף חייב לרכוש כרטיס, כרטיסים קבוצתיים הם כרטיסים שמחייבים קנייה של מספר כרטיסים בהזמנה אחת (לדוגמא - שולחן ל- 6 אנשים)'
      ) +

      // Container (card)
      '<div class="wow2-container wow2-card-rail wow2-mt-s" id="wow2_tickets_table">' +

        // ---------------------------------------------------------------------
        // 2) HEADER STRIP — defines column names
        // ---------------------------------------------------------------------
        buildHeaderStrip_wow2_darker('שם כרטיס', 5, 'סוג', 'מחיר', 'גודל', 'מקס', 'פעולות') +

        // ---------------------------------------------------------------------
        // 3) DATA ROWS — each ticket row (built dynamically)
        // ---------------------------------------------------------------------
        rows.map((t, i) => {

          // Extract readable values (fallbacks avoid showing “undefined”)
          const rightTitle = (t?.name || t?.ticket_name || '—').toString();
          const kind       = (t?.kind || t?.type || t?.ticket_type || '—').toString();
          const price      = t?.price_per_person ?? t?.price ?? '—';
          const groupMin   = t?.group_min ?? t?.group_size ?? '—';
          const groupMax   = t?.group_max ?? t?.max_group_count ?? '—';

          // Each ticket row is identified by its backend ID or fallback index
          const ticketId = t?.ticket_id ?? t?.ticket_type_id ?? i;

          // Prepare metadata for the play-icon menu button
          // The menu system uses entityType + entityId + tab (state)
          const iconData = {
            entityType: 'ticket_type',
            entityId:   ticketId,
            tab:        'IN_CREATION'
          };

          // Build row HTML: “warm” gradient ring + cells
          // Args: tone, rightText, numOfLeft, iconData, left1..left5
          return buildRowStrip_wow2(
            'warm',
            rightTitle,
            4,
            iconData,
            kind, price, groupMin, groupMax
          );

        }).join('') +

        // ---------------------------------------------------------------------
        // 4) ADD BUTTON — appears under the table
        // ---------------------------------------------------------------------
        '<div class="wow2-btnstrip wow2-btnstrip--right wow2-mt-s">' +
          '<button id="wow2_add_ticket" class="wow2-btn wow2-btn--fresh">+ הוסף סוג כרטיס</button>' +
        '</div>' +

      '</div>' + // end wow2-container
    '</section>';

  // ---------------------------------------------------------------------------
  // 5) EVENT BINDINGS
  // ---------------------------------------------------------------------------

  // (a) Add Ticket → opens ticket creation modal
  const addBtn = document.getElementById('wow2_add_ticket');
  if (addBtn) {
    addBtn.onclick = () => openTicketModal_wow2();
  }

  // (b) Each row’s play-icon → opens the icon menu (global registry-driven popup)
  // buildRowStrip_wow2 embeds data-entity-* attributes on each play icon button
  ui.panel.querySelectorAll('.wow2-row-menu, .wow2-action-icon--play').forEach(btn => {

    btn.addEventListener('click', () => {
      const entityType = btn.getAttribute('data-entity-type');
      const entityId   = btn.getAttribute('data-entity-id');
      const tab        = btn.getAttribute('data-entity-tab');

      // If the icon menu engine is available → open it
      if (typeof window.openIconMenu === 'function' && entityType && tab) {
        window.openIconMenu({
          anchorEl: btn,
          entityType,
          entityId,
          tab
        });
      } 
      // Fallback (if menu engine not loaded): directly open ticket modal
      else {
        const idx = Number(entityId);
        if (!Number.isNaN(idx)) {
          openTicketModal_wow2(getTickets()[idx], idx);
        }
      }
    });
  });
}


// --- ADD/EDIT TICKET MODAL -----------------------------------------
// Saves through a backend API first; only on success do we update the local
// ElementTicketArray (so we always keep the real ticket_type_id from DB).
function openTicketModal_wow2(ticket = null, index = -1) {
  const isEdit = index >= 0;

  // Normalize incoming ticket fields to our builder inputs
  const init = {
    name:             ticket?.name || ticket?.ticket_name || '',
    kind:             (ticket?.kind || ticket?.type || ticket?.ticket_type || 'SINGLE').toUpperCase(),
    group_min:        Number(ticket?.group_min ?? ticket?.min ?? 1),
    group_max:        Number(ticket?.group_max ?? ticket?.max ?? 1),
    max_for_sale:     ticket?.max_for_sale ?? '',
    price_per_person: ticket?.price_per_person ?? ticket?.price ?? '',
    ticket_text:      ticket?.ticket_text ?? ''
  };

  const modal = document.createElement('div');
  modal.className = 'wow2-modal-viewport';
  modal.innerHTML =
    '<div class="wow2-modal-canvas wow2-modal-canvas--dark">' +
      '<div class="wow2-title-l">' + (isEdit ? 'עריכת סוג כרטיס' : 'יצירת סוג כרטיס חדש') + '</div>' +

      // Use the builder to render the full form body
      buildTicketTypeForm_wow2(init) +

      // Error slot (filled on failed save)
      '<div id="t_err" class="wow2-note wow2-mt-s" style="display:none;color:#ff8080"></div>' +

      // Footer buttons
      '<div class="wow2-btnstrip wow2-btnstrip--right wow2-mt-s">' +
        '<button id="t_save" class="wow2-btn wow2-btn--fresh">שמור כרטיס</button>' +
        '<button id="t_cancel" class="wow2-btn">בטל</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelector('#t_cancel').onclick = close;

  const errEl  = modal.querySelector('#t_err');
  const saveEl = modal.querySelector('#t_save');

  // Small helpers for UX
  const setSaving = (on) => {
    saveEl.disabled = on;
    saveEl.textContent = on ? 'שומר…' : 'שמור כרטיס';
  };
  const showError = (msg) => {
    if (!errEl) return;
    errEl.textContent = msg || 'שמירה נכשלה. נסו שוב.';
    errEl.style.display = 'block';
  };

  // Save: read values from the builder’s field IDs, call API, then update UI
  saveEl.onclick = async () => {
    // Gather payload from form fields
    const payload = {
      // Required for the backend:
      element_id: EO().element?.element_id ?? 0, // host element id
      // For edit flow, send the existing ticket_type_id if present
      ticket_type_id: ticket?.ticket_type_id ?? ticket?.ticket_id ?? null,

      // Fields
      name:             (document.getElementById('name')?.value || '').trim(),
      kind:             (document.querySelector('input[name="kind"]:checked')?.value || 'SINGLE').toUpperCase(),
      group_min:        Number(document.getElementById('group_min')?.value || 1),
      group_max:        Number(document.getElementById('group_max')?.value || 1),
      // null when blank (so backend can treat as "no limit")
      max_for_sale:     (document.getElementById('max_for_sale')?.value ?? '').toString().trim() === '' 
                          ? null 
                          : Number(document.getElementById('max_for_sale').value),
      price_per_person: Number(document.getElementById('price_per_person')?.value || 0),
      ticket_text:      (document.getElementById('ticket_text')?.value || '').trim()
    };

    // Basic client validation (keep minimal; backend is source of truth)
    if (!payload.name) { showError('חסר שם סוג כרטיס.'); return; }
    if (payload.group_min > payload.group_max) { showError('מינימום קבוצה לא יכול להיות גדול מהמקסימום.'); return; }

    errEl.style.display = 'none';
    setSaving(true);

    try {
      // 1) Save to server (create or update)
      // NOTE: implement the endpoint in PHP later. The URL & headers are placeholders.
      const saved = await apiSaveTicketType_wow2(payload);

      // Expect the backend to return normalized ticket type with its real id:
      // {
      //   ticket_type_id: 123,
      //   element_id: 456,
      //   name, kind, group_min, group_max, max_for_sale, price_per_person, ticket_text
      // }
      if (!saved || !saved.ticket_type_id) {
        throw new Error('Malformed server response (missing ticket_type_id).');
      }

      // 2) Update local array ONLY AFTER SUCCESS
      const nextRow = {
        ticket_type_id:  saved.ticket_type_id,
        element_id:      saved.element_id ?? payload.element_id,
        name:            saved.name ?? payload.name,
        kind:            saved.kind ?? payload.kind,
        group_min:       saved.group_min ?? payload.group_min,
        group_max:       saved.group_max ?? payload.group_max,
        max_for_sale:    saved.max_for_sale ?? payload.max_for_sale,
        price_per_person:saved.price_per_person ?? payload.price_per_person,
        ticket_text:     saved.ticket_text ?? payload.ticket_text
      };

      const arr = getTickets().slice();
      if (isEdit) {
        arr[index] = nextRow;
      } else {
        arr.push(nextRow);
      }
      setTickets(arr);

      // Optionally persist the full element (if you also store tickets there)
      //try { await persistTickets(); } catch (e) { /* non-fatal */ }

      close();
      if (window.__tickets_ui_ref) renderTicketsTabForHost_wow2(window.__tickets_ui_ref);
    } catch (e) {
      console.warn('Ticket type save failed:', e);
      showError(e?.message || 'שמירה נכשלה. נסו שוב.');
    } finally {
      setSaving(false);
    }
  };
}

/* -----------------------------------------------------------------------------
 * API helper — calls the backend endpoint that creates/updates a ticket type.
 * Do NOT build the PHP yet; this JS assumes a JSON REST endpoint and a WP nonce.
 * Adjust URL/headers to your final implementation (REST or admin-ajax).
 * ---------------------------------------------------------------------------*/
async function apiSaveTicketType_wow2(payload) {
  // Choose one style; keep both placeholders for now:

  // A) WP REST route (recommended)
  const url = (window.WOW_API && window.WOW_API.ticketTypeSaveURL)
              || '/wp-json/wow/v1/ticket-type';

  // Optional nonce for auth (to be printed by PHP into the page)
  const nonce = window.WOW_API?.nonce;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(nonce ? { 'X-WP-Nonce': nonce } : {})
    },
    body: JSON.stringify(payload),
    credentials: 'same-origin'
  });

  if (!res.ok) {
    // Try to surface backend message if available
    let msg = 'Server error';
    try {
      const err = await res.json();
      msg = err?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  const data = await res.json();
  // Expecting: { ticket_type_id, element_id, ...fields }
  return data;
}



















// --- ADD/EDIT TICKET MODAL (writes back to ElementTicketArray) ---
// -----------------------------------------------------------------------------
// buildTicketTypeForm_wow2
// Renders the full "Create Ticket Type" form sections (name, kind + group size,
// max_for_sale, price_per_person, ticket_text) using wow2 containers.
// Each section uses consistent wow2-container--darker styling.
// -----------------------------------------------------------------------------
function buildTicketTypeForm_wow2({
  name = 'הכנס שם',
  kind = 'SINGLE',
  group_min = 2,
  group_max = 2,
  max_for_sale = '10',
  price_per_person = '100',
  ticket_text = '--------'
} = {}) {

  // 1) NAME
  const section_name =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderFlexFormInput_wow2({
        id: 'name',
        label: 'שם סוג הכרטיס:',
        required: true,
        placeholder: '',
        value: name
      }) +
      renderInfoBox_wow2('שם סוג הכרטיס — צריך להיות ייחודי עבור כל אלמנט. לא ניתן לשינוי לאחר האקטיבציה.') +
      '<div class="wow2-note">• לא ניתן לשינוי אחרי האקטיבציה</div>' +
    '</div>';

 // Replace your manual radio+numbers block with this version that uses
 // renderFlexFormRadio_wow2 for the kind selector (SINGLE | GROUP).

 // 2) KIND (radio) + GROUP MIN/MAX
 const section_kind_group =
  '<div class="wow2-container wow2-container--darker wow2-card-rail">' +

    // KIND radio strip (uses your shared renderer)
    renderFlexFormRadio_wow2_dark({
      id: 'kind',                 // element id for the group container
      name: 'kind',               // radio "name" so we can read it via document.querySelector('input[name="kind"]:checked')
      label: 'סוג הכרטיס:',
      required: true,
      value: (kind || 'SINGLE').toUpperCase(),
      options: [
        { value: 'SINGLE', label: 'יחיד' },
        { value: 'GROUP',  label: 'קבוצתי' }
      ]
    }) +

    // GROUP SIZE (min/max)
    renderNumberInput_wow2({
      id: 'group_min',
      label: 'מינימום גודל קבוצה:',
      required: true,
      value: group_min,
      min: 1,
      step: 1
    }) +
    renderNumberInput_wow2({
      id: 'group_max',
      label: 'מקסימום גודל קבוצה:',
      required: true,
      value: group_max,
      min: 1,
      step: 1
    }) +

    renderInfoBox_wow2('כרטיס קבוצתי מחייב הגדרה של מספר מינימלי ומקסימלי להרכב המשתתפים בהזמנה אחת (למשל שולחן 4–7). אם הכרטיס הוא יחיד — אפשר להשאיר 1–1.') +
    '<div class="wow2-note">• לא ניתן לשינוי אחרי האקטיבציה</div>' +
  '</div>';


  // 3) MAX FOR SALE
  const section_max_for_sale =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderNumberInput_wow2({
        id: 'max_for_sale',
        label: 'מקסימום למכירה מסוג זה:',
        required: false,
        value: max_for_sale,
        min: 0,
        step: 1
      }) +
      renderInfoBox_wow2('אפשר להגביל את סוג הכרטיס לפי תנאי האירוע. אם אין הגבלה — השאר ריק.') +
      '<div class="wow2-note">• אפשר לערוך לפני אקטיבציה בלבד</div>' +
    '</div>';

  // 4) PRICE PER PERSON
  const section_price_per_person =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderNumberInput_wow2({
        id: 'price_per_person',
        label: 'מחיר לאדם(₪):',
        required: true,
        value: price_per_person,
        min: 0,
        step: 1
      }) +
      renderInfoBox_wow2('המחיר מחושב לכל משתתף ללא תלות בגודל הקבוצה.') +
      '<div class="wow2-note">• ניתן לעדכן לפני אקטיבציה בלבד</div>' +
    '</div>';

  // 5) TICKET TEXT
  const section_ticket_text =
    '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
      renderFlexFormInput_wow2({
        id: 'ticket_text',
        label: 'טקסט על הכרטיסים:',
        required: false,
        placeholder: '',
        value: ticket_text
      }) +
      renderInfoBox_wow2('טקסט חופשי שיופיע על הכרטיסים שישלחו למשתתפים לאחר שההצעה הגיעה ליעד.') +
      '<div class="wow2-note">• טקסט מוצג למשתתפים על גבי הכרטיס</div>' +
    '</div>';

  // Concatenate all sections
  return (
    section_name +
    section_kind_group +
    section_max_for_sale +
    section_price_per_person +
    section_ticket_text
  );
}






// --- SAFE ACCESSORS FOR YOUR DATA SHAPE -----------------------

function EO() {
  // guarantee the object + arrays exist so later code can always use them
  const root = (window.EditElementObject ||= {});
  root.ElementTicketArray  ||= [];   // tickets live here
  root.ElementVoucherArray ||= [];   // vouchers live here
  root.ElementPostArray    ||= [];   // keeping parity with your console screenshot
  root.element             ||= {};   // the element itself
  return root;
}

function getTickets() {
  // always return the live array on EditElementObject
  return EO().ElementTicketArray;
}

function setTickets(next) {
  EO().ElementTicketArray = Array.isArray(next) ? next : [];
  // if you keep any derived views, update them here too
}

function getVouchers() {
  return EO().ElementVoucherArray;
}

function setVouchers(next) {
  EO().ElementVoucherArray = Array.isArray(next) ? next : [];
}

// optional: a single persist point you can hook to your existing save pipeline
//async function persistTickets() {
  // example – call whatever you already use to persist the element
  // await saveElementToDB(EO().element.element_id, { tickets: EO().ElementTicketArray });
  // (left as a stub because the existing save fn lives elsewhere)
//}

// Keep this AFTER getTickets/setTickets/apiSaveTicketType_wow2 are defined.
window.WOW_TicketTypes = {
  // Open modal for editing a ticket TYPE
  editTypeById(id) {
    const list = getTickets();
    const idx = list.findIndex(x => (x.ticket_type_id ?? x.ticket_id) == id);
    const t   = idx >= 0 ? list[idx] : null;
    openTicketModal_wow2(t, idx); // idx = -1 will be treated as "new" by your modal
  },

  // Duplicate a ticket TYPE (create a new config row via backend)
  async copyTypeById(id) {
    const src = getTickets().find(x => (x.ticket_type_id ?? x.ticket_id) == id);
    if (!src) return;

    const clone = {
      element_id:        EO().element?.element_id ?? 0,
      name:              (src.name || src.ticket_name || 'כרטיס') + ' (עותק)',
      kind:              (src.kind || src.type || src.ticket_type || 'SINGLE'),
      group_min:         src.group_min ?? src.min ?? 1,
      group_max:         src.group_max ?? src.max ?? 1,
      max_for_sale:      src.max_for_sale ?? null,
      price_per_person:  src.price_per_person ?? src.price ?? 0,
      ticket_text:       src.ticket_text ?? ''
    };

    try {
      const saved = await apiSaveTicketType_wow2(clone); // returns new ticket_type_id
      const next = getTickets().slice();
      next.push(saved);
      setTickets(next);
      //try { await persistTickets(); } catch(_) {}
      if (window.__tickets_ui_ref) renderTicketsTabForHost_wow2(window.__tickets_ui_ref);
    } catch (e) {
      console.warn('Copy ticket type failed:', e);
      alert('שכפול נכשל');
    }
  },

  // Remove a ticket TYPE (config row)
  async deleteTypeById(id) {
    if (!confirm('למחוק את סוג הכרטיס? פעולה זו אינה הפיכה.')) return;

    try {
      if (typeof apiDeleteTicketType_wow2 === 'function') {
        await apiDeleteTicketType_wow2(id); // optional; implement later in PHP
      }
      const next = getTickets().filter(x => (x.ticket_type_id ?? x.ticket_id) != id);
      setTickets(next);
      //try { await persistTickets(); } catch(_) {}
      if (window.__tickets_ui_ref) renderTicketsTabForHost_wow2(window.__tickets_ui_ref);
    } catch (e) {
      console.warn('Delete ticket type failed:', e);
      alert('מחיקה נכשלה');
    }
  }
};






/*
// --- RENDER: TICKETS TAB USING THE ARRAYS ON EditElementObject -----
function renderTicketsTabForHost_wow2(ui) 
{
  // keep a ref so the modal can re-render on save
  window.__tickets_ui_ref = ui;

  const rows = getTickets();

  ui.panel.innerHTML =
  '<section class="wow2-section">' +
    '<div class="wow2-sub-h">טבלת סוגי כרטיסים</div>' +

    renderInfoBox2_wow2(
      'הכנס את כל סוגי הכרטיסים שיהיו זמינים למשתתפים בדף הרכישה - שימו -לב - כל משתתף חייב לרכוש כרטיס, כרטיסים קבוצתיים הם כרטיסים שמחייבים קנייה של מספר כרטיסים בהזמנה אחת (לדוגמא - שולחן ל- 6 אנשים)'
    ) +

    '<div class="wow2-container wow2-card-rail wow2-mt-s" id="wow2_tickets_table">' +

      // HEADER
      buildHeaderStrip_wow2_darker("שם כרטיס", 5, "סוג", "מחיר", "גודל", "מקס", "פעולות") +

      // ROWS
      rows.map((t, i) => 
        {
           const rightTitle = (t?.name || t?.ticket_name || '—').toString();
           const kind       = (t?.kind || t?.type || t?.ticket_type || '—').toString();
           const price      = t?.price_per_person ?? t?.price ?? '—';
           const groupMin   = t?.group_min ?? t?.group_size ?? '—';
           const groupMax   = t?.group_max ?? t?.max_group_count ?? '—';

           const actions =
           '<button class="wow2-action-icon wow2-action-icon--menu" ' +
           'data-ticket-menu="' + i + '" aria-label="פעולות">⋯</button>';

           // right, count=5, then 5 left cells (kind, price, min, max, actions)
           return buildRowStrip_wow2('warm',rightTitle, 5, kind, price, groupMin, groupMax, actions);

        }).join('') +

      // ADD BUTTON
      '<div class="wow2-btnstrip wow2-btnstrip--right wow2-mt-s">' +
        '<button id="wow2_add_ticket" class="wow2-btn wow2-btn--fresh">+ הוסף סוג כרטיס</button>' +
      '</div>' +

    '</div>' +
  '</section>';

  // Wire "add" → OPEN MODAL (not the builder)
  const addBtn = document.getElementById('wow2_add_ticket');
  if (addBtn) addBtn.onclick = () => openTicketModal_wow2();

  // Wire per-row actions → OPEN MODAL with data
  ui.panel.querySelectorAll('[data-edit-ticket]').forEach(btn=>{
    btn.onclick = () => openTicketModal_wow2(getTickets()[+btn.dataset.editTicket], +btn.dataset.editTicket);
  });

  // Wire delete and re-render THIS tab
  ui.panel.querySelectorAll('[data-del-ticket]').forEach(btn=>{
    btn.onclick = () => {
      const idx = +btn.dataset.delTicket;
      const next = getTickets().slice();
      next.splice(idx,1);
      setTickets(next);
      persistTickets().catch(console.warn);
      renderTicketsTabForHost_wow2(ui); // ← was calling a different name
    };
  });
}


// --- ADD/EDIT TICKET MODAL -----------------------------------------
function openTicketModal_wow2(ticket = null, index = -1) {
  const isEdit = index >= 0;

  // Normalize incoming ticket fields to our builder inputs
  const init = {
    name:             ticket?.name || ticket?.ticket_name || '',
    kind:             (ticket?.kind || ticket?.type || ticket?.ticket_type || 'SINGLE').toUpperCase(),
    group_min:        Number(ticket?.group_min ?? ticket?.min ?? 1),
    group_max:        Number(ticket?.group_max ?? ticket?.max ?? 1),
    max_for_sale:     ticket?.max_for_sale ?? '',
    price_per_person: ticket?.price_per_person ?? ticket?.price ?? '',
    ticket_text:      ticket?.ticket_text ?? ''
  };

  const modal = document.createElement('div');
  modal.className = 'wow2-modal-viewport';
  modal.innerHTML =
    '<div class="wow2-modal-canvas wow2-modal-canvas--dark">' +
      '<div class="wow2-title-l">' + (isEdit ? 'עריכת סוג כרטיס' : 'יצירת סוג כרטיס חדש') + '</div>' +

      // Use the builder to render the full form body
      buildTicketTypeForm_wow2(init) +

      // Footer buttons
      '<div class="wow2-btnstrip wow2-btnstrip--right wow2-mt-s">' +
        '<button id="t_save" class="wow2-btn wow2-btn--fresh">שמור כרטיס</button>' +
        '<button id="t_cancel" class="wow2-btn">בטל</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelector('#t_cancel').onclick = close;

  // Save: read values from the builder’s field IDs
  modal.querySelector('#t_save').onclick = async () => {
    const next = {
      name:             (document.getElementById('name')?.value || '-').trim(),
      kind:             (document.querySelector('input[name="kind"]:checked')?.value || 'SINGLE').toUpperCase(),
      group_min:        Number(document.getElementById('group_min')?.value || 1),
      group_max:        Number(document.getElementById('group_max')?.value || 1),
      max_for_sale:     (document.getElementById('max_for_sale')?.value || '1') === '' ? null : Number(document.getElementById('max_for_sale').value),
      price_per_person: Number(document.getElementById('price_per_person')?.value || 0),
      ticket_text:      (document.getElementById('ticket_text')?.value || '--').trim()
    };

    const arr = getTickets().slice();
    if (isEdit) arr[index] = next; else arr.push(next);
    setTickets(arr);

    try { await persistTickets(); } catch(e){ console.warn('persistTickets failed', e); }

    close();

    if (window.__tickets_ui_ref) renderTicketsTabForHost_wow2(window.__tickets_ui_ref);
  };
}




  */

