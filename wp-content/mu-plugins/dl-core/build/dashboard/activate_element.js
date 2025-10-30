// ============================================================================
// ==================  ACTIVATE ELEMENT =======================================
// ============================================================================

async function activateElement(elementId) {
  console.log('[WOW2][activate] start, elementId=', elementId);

  // 1) Load all data into window.EditElementObject
  try {
    console.log('[WOW2][activate] loading element data…', elementId);
    await loadEditElementObject(elementId);
  } catch (err) {
    console.error('[WOW2][activate] Failed to load element data', err);
    alert('שגיאה בטעינת הנתונים של האלמנט. נסה שוב מאוחר יותר.');
    try { document.body.style.overflow = ''; } catch (_) {}
    return;
  }

  const elementIndex = findElementIndexById(elementId);
  window.EditElementObject.ElementIndex = elementIndex;
  console.log('[WOW2][activate] EditElementObject →', window.EditElementObject);

  
  // 2) Summary modal - if succesfull will call 
  
  try {
    await openElementActivationSummaryModal();
  } catch (_) {}

}

// ============================================================================
// ==================  TERMS MODAL     ========================================
// ============================================================================

// this function is called from the on click of the activate button in summary modal 
async function ElementVerifiedForActivation()
{
  // open  Terms modal
  let terms = false;
  try {
    terms = await openElementActivationTermsModal(); // should resolve to true when all toggles ON
  } catch (_) {}

  if (!terms) return;

  // 4) Actual activation (server call)
  let success = false;
  try {
    success = await runElementActivation(); // <-- your real activation call
  } catch (err) {
    console.error('[WOW2][activate] activation failed', err);
  }

  if (success) {
    alert('Element Activated');
  } else {
    alert('Element Activation failed');
  }
}

// Expose as a global hook for icon_menu.js
window.activateElement = activateElement;

// ============================================================================
// ==================  SUMMARY AND VERIFICATION MODAL =========================
// ============================================================================

async function openElementActivationSummaryModal() {
  // --------------------------------------------
  // setup
  // --------------------------------------------
  const activateBtn = createAwareButton('left', 'הפעל אלמנט', ElementVerifiedForActivation, { styleOn: 'fresh' });
  window.allElementValidatedForActivation = true;

  // --------------------------------------------
  // build
  // --------------------------------------------
  const modal = document.createElement('div');
  modal.className = 'wow2-modal-viewport wow2-z-modal';

  modal.innerHTML =
    '<div class="wow2-modal-canvas">' +
      renderTitleWithCloseButton('סיכום אלמנט להפעלה ', closeElementActivationSummaryModal) +
      renderInfoBox_wow2('עברו על כל פרטי האלמנט ואם הכל תקין לחצו על הפעל אלמנט. ****  שימו לב  *****:  פעולה זו הינה פעולה בלתי הפיכה - את רוב השדות של האלמנט לא ניתן לשנות אחרי הפעלתו, בנוסף לאחר ההפעלה הוא יועבר מטאב: ׳בבנייה׳ לטאב: ׳אקטיבי׳. אלמנט אקטיבי ניתן לצרף להצעות וניתן לשלוח ליוצרים אחרים') +
      renderAwareBtn(false, activateBtn) +
      RenderElementSummaryBody() +
    '</div>';

  document.body.appendChild(modal);
  lockScroll();

  // --------------------------------------------
  // wire: header X, ESC, backdrop
  // (listeners must be attached AFTER we insert innerHTML)
  // --------------------------------------------
  const headerCloseBtn = modal.querySelector('.wow2-btnstrip .wow2-btn');
  if (headerCloseBtn) {
    headerCloseBtn.addEventListener('click', handleClose);
  }

  window.addEventListener('keydown', onEsc);
  modal.addEventListener('mousedown', onBackdrop);

  // enable aware button if validation passed
  if (window.allElementValidatedForActivation) {
    switchAwareButton(true, activateBtn, 'fresh');
  } else {
    switchAwareButton(false, activateBtn);
  }

  // --------------------------------------------
  // helpers
  // --------------------------------------------
  function onEsc(e) {
    if (e.key === 'Escape') handleClose(e);
  }

  function onBackdrop(e) {
    // close only when clicking the dark backdrop, not inside the canvas
    if (e.target === modal) handleClose(e);
  }

  function handleClose(e) {
    try { e && e.preventDefault && e.preventDefault(); } catch(_) {}
    cleanup();
    // your existing remover restores scroll too
    closeElementActivationSummaryModal();
  }

  function cleanup() {
    try {
      window.removeEventListener('keydown', onEsc);
      modal.removeEventListener('mousedown', onBackdrop);
      if (headerCloseBtn) headerCloseBtn.removeEventListener('click', handleClose);
    } catch(_) {}
    unlockScroll();
  }

  function lockScroll(){ try { document.body.style.overflow = 'hidden'; } catch(_){} }
  function unlockScroll(){ try { document.body.style.overflow = ''; } catch(_){} }
}
/*
async function openElementActivationSummaryModal()
{

    // ----------------------------------------------------------------------------
    // ------------------------         setup          ----------------------------
    // ----------------------------------------------------------------------------

    // Aware button: pass side as a STRING ('left'), and style key as 'fresh'
    const activateBtn = createAwareButton('left', 'הפעל אלמנט', ElementVerifiedForActivation, { styleOn: 'fresh' });
    window.allElementValidatedForActivation = true;
   
    // ----------------------------------------------------------------------------
    // ------------------------    build the modal      ----------------------------
    // ----------------------------------------------------------------------------

    var modal = document.createElement('div');
    modal.className = 'wow2-modal-viewport wow2-z-modal';

    modal.innerHTML =
    '<div class="wow2-modal-canvas">' +

      // ------------------------         HEADER         ----------------------------
    
      renderTitleWithCloseButton("סיכום אלמנט להפעלה ", closeElementActivationSummaryModal) +

      renderInfoBox_wow2("עברו על כל פרטי האלמנט ואם הכל תקין לחצו על הפעל אלמנט. ****  שימו לב  *****:  פעולה זו הינה פעולה בלתי הפיכה - את רוב השדות של האלמנט לא ניתן לשנות אחרי הפעלתו, בנוסף לאחר ההפעלה הוא יועבר מטאב: ׳בבנייה׳ לטאב: ׳אקטיבי׳. אלמנט אקטיבי ניתן לצרף להצעות וניתן לשלוח ליוצרים אחרים") +

      // Render the aware button strip INERT (disabled/grey) at first
      renderAwareBtn(false, activateBtn) +

    // ------------------------      RENDER BODY       ------------------------------

    RenderElementSummaryBody() +  

    '</div>';

    document.body.appendChild(modal);
    
    // After the DOM is mounted, if validation passed → enable button:
    if (window.allElementValidatedForActivation) {
      // Explicitly pass the style key as a STRING ('fresh')
      switchAwareButton(true, activateBtn, 'fresh');
    } else {
      // Ensure it stays inert if validation failed (defensive)
      switchAwareButton(false, activateBtn);
    }
}
    */
// ============================================================================
// WOW2 — Close the Element Activation Summary Modal
// Safely removes the summary modal viewport and restores page scroll.
// Can be called multiple times without error.
// ============================================================================

function closeElementActivationSummaryModal() {
  try {
    // Find all modals; close the last one (top-most)
    const modals = document.querySelectorAll('.wow2-modal-viewport');
    if (modals && modals.length > 0) {
      const modal = modals[modals.length - 1];
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }
  } catch (err) {
    console.error('[WOW2][activate] close summary modal error:', err);
  } finally {
    // Always restore body scroll
    try { document.body.style.overflow = ''; } catch (_) {}
  }
}



// ============================================================================
// ==========  SUMMARY BODY (returns HTML string to inject into modal)  =======
// ============================================================================
//
// Assumptions:
// - window.EditElementObject.element holds the base data
// - window.EditElementObject.ElementTicketArray / ElementVoucherArray / ElementPostArray are arrays
// - renderSummaryStrip(label, isOk, valueText?) → returns HTML string for one row
// - renderErrorNote(text) → returns HTML string
// - renderTicketCard(t) / renderVoucherCard(v) / renderPostCard(p) → return HTML strings
//
// This file only composes strings. The caller inserts the returned HTML into the modal.
//

function RenderElementSummaryBody() {
  // reset validation flag for this run
  window.allElementValidatedForActivation = true;

  const elementType = (window.EditElementObject && window.EditElementObject.element && window.EditElementObject.element.element_type) || '';
  if (elementType === 'HOST') {
    return RenderElementSummaryBodyForHost();
  }
  if (elementType === 'SERVICE') {
    return RenderElementSummaryBodyForService();
  }
  if (elementType === 'PRODUCTION') {
    return RenderElementSummaryBodyForProduction();
  }

  // Unknown type fallback
  window.allElementValidatedForActivation = false;
  return renderErrorNote('סוג אלמנט לא מוכר','warm');
}


// ============================================================================
// =======================  HOST  =============================================
// ============================================================================

function RenderElementSummaryBodyForHost() {
  const elementData = (window.EditElementObject && window.EditElementObject.element) || {};
  const ticketArray = Array.isArray(window.EditElementObject?.ElementTicketArray) ? window.EditElementObject.ElementTicketArray : [];
  const postArray   = Array.isArray(window.EditElementObject?.ElementPostArray)   ? window.EditElementObject.ElementPostArray   : [];

  let htmlBody = '';

  // Helper to add a required field row (sets global flag if missing)
  function addRequired(label, value) {
    if (hasValue(value)) {
      htmlBody += renderSummaryStrip(label, true, value);
    } else {
      htmlBody += renderSummaryStrip(label, false);
      window.allElementValidatedForActivation = false;
    }
  }

  htmlBody += renderLabel(' ראשי','fresh');

  addRequired('שם אלמנט', elementData.element_name);
  addRequired('סוג אלמנט', elementData.element_type);
  addRequired('מינימום משתתפים', elementData.min_participants);
  addRequired('אחוז מעל מינימום', elementData.over_min_percent);
  addRequired('מינימום משבצות זמן', elementData.min_time_slots);
  addRequired('משך (בדקות)', elementData.duration_minutes);
  addRequired('מיקום', elementData.location_text);

  htmlBody += renderLabel(' כרטיסים','fresh');


  // Tickets (≥1 required)
  if (!ticketArray.length) {
    htmlBody += renderErrorNote('יש להוסיף לפחות סוג כרטיס אחד','warm');
    window.allElementValidatedForActivation = false;
  } else {
    for (let i = 0; i < ticketArray.length; i++) {
      htmlBody += renderTicketCard(ticketArray[i]);
    }
  }

   htmlBody += renderLabel(' פוסטים','fresh');
 
  // Posts (≥1 required)
  if (!postArray.length) {
     htmlBody += renderErrorNote('יש להוסיף לפחות סוג פוסט אחד','warm');
    window.allElementValidatedForActivation = false;
  } else {
    for (let i = 0; i < postArray.length; i++) {
      htmlBody += renderPostCard(postArray[i]);
    }
  }

  return htmlBody;
}


// ============================================================================
// =======================  SERVICE  ==========================================
// ============================================================================

function RenderElementSummaryBodyForService() {
  const elementData  = (window.EditElementObject && window.EditElementObject.element) || {};
  const voucherArray = Array.isArray(window.EditElementObject?.ElementVoucherArray) ? window.EditElementObject.ElementVoucherArray : [];
  const postArray    = Array.isArray(window.EditElementObject?.ElementPostArray)    ? window.EditElementObject.ElementPostArray    : [];

  let htmlBody = '';

  function addRequired(label, value) {
    if (hasValue(value)) {
      htmlBody += renderSummaryStrip(label, true, value);
    } else {
      htmlBody += renderSummaryStrip(label, false);
      window.allElementValidatedForActivation = false;
    }
  }

  htmlBody += renderLabel(' ראשי','fresh');


  addRequired('שם אלמנט', elementData.element_name);
  addRequired('סוג אלמנט', elementData.element_type);
  addRequired('מקסימום לשעה', elementData.max_per_hour);
  addRequired('סף מינימום משתתפים', elementData.min_participants_threshold);

   htmlBody += renderLabel(' ואוצ׳רים','fresh');


  // Vouchers (≥1 required)
  if (!voucherArray.length) {
    htmlBody += renderErrorNote('יש להוסיף לפחות שובר אחד','warm');
    window.allElementValidatedForActivation = false;
  } else {
    for (let i = 0; i < voucherArray.length; i++) {
      htmlBody += renderVoucherCard(voucherArray[i]);
    }
  }

   htmlBody += renderLabel(' פוסטים','fresh');

  // Posts (≥1 required)
  if (!postArray.length) {
    htmlBody += renderErrorNote('יש להוסיף לפחות פוסט אחד','warm');
    window.allElementValidatedForActivation = false;
  } else {
    for (let i = 0; i < postArray.length; i++) {
      htmlBody += renderPostCard(postArray[i]);
    }
  }

  return htmlBody;
}


// ============================================================================
// =======================  PRODUCTION  =======================================
// ============================================================================

function RenderElementSummaryBodyForProduction() {
  const elementData = (window.EditElementObject && window.EditElementObject.element) || {};
  const postArray   = Array.isArray(window.EditElementObject?.ElementPostArray) ? window.EditElementObject.ElementPostArray : [];

  let htmlBody = '';

  function addRequired(label, value) {
    if (hasValue(value)) {
      htmlBody += renderSummaryStrip(label, true, value);
    } else {
      htmlBody += renderSummaryStrip(label, false);
      window.allElementValidatedForActivation = false;
    }
  }

  htmlBody += renderLabel(' ראשי','fresh');

  addRequired('שם אלמנט', elementData.element_name);
  addRequired('סוג אלמנט', elementData.element_type);
  addRequired('מחיר למשבצת זמן', elementData.price_per_time_slot);
  addRequired('מקסימום משתתפים', elementData.max_participants);
  addRequired('מינימום משבצות זמן', elementData.min_time_slots);

   htmlBody += renderLabel(' פוסטים','fresh');

  // Posts (≥1 required)
  if (!postArray.length) {
    htmlBody += renderErrorNote('יש להוסיף לפחות פוסט אחד','warm');
    window.allElementValidatedForActivation = false;
  } else {
    for (let i = 0; i < postArray.length; i++) {
      htmlBody += renderPostCard(postArray[i]);
    }
  }

  return htmlBody;
}


// ============================================================================
// =======================  small util  =======================================
// ============================================================================

function hasValue(v) {
  // allow 0 as valid number; treat null/undefined/empty-string as missing
  return v !== null && v !== undefined && (typeof v === 'number' || String(v).trim() !== '');
}


// ============================================================================
// =============================  TERM MODAL  =================================
// ============================================================================

// ============================================================================
// WOW2 — Terms Modal for Element Activation (FINAL)
// Resolves TRUE only if all 5 toggles are ON and the user clicks the green button.
// X / ESC / backdrop => resolves FALSE.
// Uses: renderTitleWithCloseButton, renderInfoBox_wow2, createAwareButton,
//       renderAwareBtn, switchAwareButton, renderTermStrip (defined below)
// ============================================================================

async function openElementActivationTermsModal() {
  return new Promise(function(resolve) {
    // Exact copy from the spec PDF (titles + paragraphs)
    const TERMS = [
      {
        title: 'תשלום',
        text:  'לוקל וואו מעבירה את כל התשלומים של האירועים ישירות אל יוצר ההצעה - אתם כיוצרי אלמנטים אמורים לייצר הסכם תשלומים עם יוצר ההצעה, לפלטפורמה אין שום מחוייבות כספית מלבד העברת כספי המשתתפים ליוצר ההצעה על פי תנאי התשלום.'
      },
      {
        title: 'תנאי תשלום',
        text:  'לוקל וואו מעבירה ליוצר ההצעה את כל הכספים שנסלקו בפועל בין ה-1 לחודש ועד ה-15 לחודש ב-5 לחודש העוקב וכל כסף שנסלק בין ה-16 לחודש ועד ל-31 לחודש ב-11 לחודש העוקב וזאת על פי תנאי התשלום של חברות כרטיסי האשראי.'
      },
      {
        title: 'דוח תשלומים',
        text:  'לוקל וואו מייצרת עבור כל יוצר אלמנט דוח תשלומים חי שמפרט בזמן אמת את כל מה שנסלק עבור אירועים בהם האלמנט הוא חלק ואת כל הכספים שהועברו בפועל ליזם האירוע עבורם. שימו לב האחריות להעברת הכספים מהיזם ליוצרי האלמנטים אינה חלק מהאחריות של לוקל וואו ועל יוצרי האלמנטים לחתום הסכמי תשלום ושירות ברורים עם יזמי ההצעה.'
      },
      {
        title: 'עמלות',
        text:  'לוקל גובה 5% מכל הסכומים שנסלקים דרך המערכת, בנוסף חברות כרטיסי האשראי גובות 1.2% מכל הסכומים שנסלקים דרך המערכת לכן יש לצפות להפחתה של 6.2% מהסכום הכולל שמגיע לכם על שילוב האלמנט שלכם בהצעה.'
      },
      {
        title: 'אחריות',
        text:  'האחריות לביצוע האלמנט ברמה המספקת את המשתתפים ועולה בקנה אחד עם התיאור של האלמנט על ידי היוצר הינה על היוצרי האלמנט ועל יוצרי ההצעה כמפיקי ומארחי האירועים. ללוקל וואו אין אחריות על איכות החוויות, לוקל וואו הינה פלטפורה המקשרת בין יוצרים מקומיים, יזמים מקומיים וקהל מקומי ואין היא חלק ההפקות עצמם.'
      }
    ];

    // Modal shell
    const modal = document.createElement('div');
    modal.className = 'wow2-modal-viewport wow2-z-modal';

    // Aware button (disabled until all toggles ON)
    const activateBtn = createAwareButton('left', 'הפעל אלמנט', () => cleanup(true), { styleOn: 'fresh' });

    // Build terms list
    let termsHtml = '';
    for (let i = 0; i < TERMS.length; i++) {
      termsHtml += renderTermStrip(i + 1, TERMS[i].title, TERMS[i].text, false);
    }

    modal.innerHTML =
      '<div class="wow2-modal-canvas">' +
        renderTitleWithCloseButton('אישור תנאי שימוש', close) +
        renderInfoBox_wow2('כדי להמשיך להפעלת האלמנט יש לאשר כל אחד מהתנאים בנפרד (אין כפתור מאשר-הכול). רק לאחר שכל המחוונים בירוק תופיע אפשרות “הפעל אלמנט”.') +
        renderAwareBtn(false, activateBtn) +
        termsHtml +
      '</div>';

    document.body.appendChild(modal);
    lockScroll();

    const state = new Array(TERMS.length).fill(false);
    wireEscAndBackdrop();
    wireToggles();
    switchAwareButton(false, activateBtn); // start disabled

    // ---- helpers ----
    function lockScroll(){ try { document.body.style.overflow = 'hidden'; } catch(_){} }
    function unlockScroll(){ try { document.body.style.overflow = ''; } catch(_){} }
    function close(){ cleanup(false); }

    function cleanup(success){
      try {
        window.removeEventListener('keydown', onEsc);
        modal.removeEventListener('click', onBackdrop);
        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
      } catch(_) {}
      unlockScroll();
      resolve(!!success);
    }

    function onEsc(e){ if (e.key === 'Escape') close(); }
    function onBackdrop(e){ if (e.target === modal) close(); }
    function wireEscAndBackdrop(){
      window.addEventListener('keydown', onEsc);
      modal.addEventListener('click', onBackdrop);
    }

function wireToggles(){
  for (let i = 0; i < TERMS.length; i++) {
    const idx  = i + 1;
    const cb   = modal.querySelector('#wow2_term_cb_' + idx);
    const pill = modal.querySelector('#wow2_term_pill_' + idx);
    const dot  = modal.querySelector('#wow2_term_dot_' + idx);

    // NEW: get track + knob
    const track = modal.querySelector('#wow2_term_track_' + idx);
    const knob  = modal.querySelector('#wow2_term_knob_' + idx);

    if (!cb) continue;

    cb.addEventListener('change', function(){
      state[i] = !!cb.checked;
      const on  = state[i];
      const clr = on ? 'var(--wow2-fresh,#22c55e)' : 'var(--wow2-alert,#ef4444)';

      // existing visual updates
      if (pill){ pill.style.borderColor = clr; pill.style.color = clr; pill.textContent = on ? 'מאשר/ת' : 'לא מאשר/ת'; }
      if (dot){  dot.style.background = clr; }

      // NEW: move + recolor the knob, and (optionally) tint the track border
      if (knob){  knob.style.left = on ? '18px' : '2px'; knob.style.background = clr; }
      if (track){ track.style.borderColor = on ? 'var(--wow2-fresh,#22c55e)' : '#666'; }

      const allOn = state.every(Boolean);
      switchAwareButton(allOn, activateBtn, allOn ? 'fresh' : 'ghost');
    });
  }
}





/*

    function wireToggles(){
      for (let i = 0; i < TERMS.length; i++) {
        const cb   = modal.querySelector('#wow2_term_cb_' + (i+1));
        const pill = modal.querySelector('#wow2_term_pill_' + (i+1));
        const dot  = modal.querySelector('#wow2_term_dot_' + (i+1));
        if (!cb || !pill) continue;

        cb.addEventListener('change', function(){
          state[i] = !!cb.checked;

          // visual: red ↔ green
          const on  = state[i];
          const clr = on ? 'var(--wow2-fresh,#22c55e)' : 'var(--wow2-alert,#ef4444)';
          pill.style.borderColor = clr;
          pill.style.color = clr;
          pill.textContent = on ? 'מאשר/ת' : 'לא מאשר/ת';
          if (dot) dot.style.background = clr;

          const allOn = state.every(Boolean);
          switchAwareButton(allOn, activateBtn, allOn ? 'fresh' : 'ghost');
        });
      }
    }
*/




  });
}


// ============================================================================
// =======================  ACTIVATE ELEMENT FUNCTION  ========================
// ============================================================================


// ============================================================================
// WOW2 — runElementActivation (FINAL)
// Purpose:
//  - Ask server to activate the element and perform type-based cleanup
//    (delete tickets/vouchers according to element_type, atomically).
//  - On success, update in-memory library + re-render the Elements table
//    so the item moves from "בבנייה" to "אקטיבי".
// Contract (server):
//  POST /wp-json/wow/v1/elements/{id}/activate
//  Body: { element_id, element_type }
//  Server responsibilities:
//    * If type === HOST      → delete ALL vouchers for this element_id
//    * If type === SERVICE   → delete ALL tickets  for this element_id
//    * If type === PRODUCTION→ delete ALL tickets + vouchers for this element_id
//    * Update element_state from IN_CREATION → ACTIVATED
//    * Return updated element row (JSON)
// Notes:
//  - Uses WordPress nonce if available: window.wpApiSettings?.nonce or window.wowNonce
//  - Gracefully handles UI refresh depending on available functions.
// ============================================================================

async function runElementActivation() {
  // -------- source of truth --------
  const E     = window.EditElementObject || {};
  const base  = E.element || {};
  const id    = Number(base.element_id || base.id);
  const type  = base.element_type;

  if (!id || !type) {
    console.error('[WOW2][activate] missing element id/type', { id, type });
    throw new Error('Missing element id/type');
  }

  // -------- endpoint + headers --------
  const endpoint = '/wp-json/wow/v1/elements/' + encodeURIComponent(id) + '/activate';

  // WordPress nonce (if present)
  const nonce =
    (window.wpApiSettings && window.wpApiSettings.nonce) ||
    window.wowNonce ||
    null;

  const headers = {
    'Content-Type': 'application/json'
  };
  if (nonce) headers['X-WP-Nonce'] = nonce;

  // -------- request payload --------
  const payload = {
    element_id: id,
    element_type: type
  };

  // -------- call server --------
  let data;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.error('[WOW2][activate] server error', res.status, txt);
      throw new Error('Server responded ' + res.status);
    }

    data = await res.json().catch(() => ({}));
  } catch (err) {
    console.error('[WOW2][activate] fetch failed', err);
    throw err;
  }

  // -------- expect updated element row --------
  const updated = (data && (data.element || data.updated || data)) || {};
  const newState = updated.element_state || 'ACTIVATED';

  // -------- update local caches --------
  try {
    // 1) window.MyElementLibrary (table source)
    const idx =
      (typeof window.findElementIndexById === 'function')
        ? window.findElementIndexById(id)
        : (Array.isArray(window.MyElementLibrary)
            ? window.MyElementLibrary.findIndex(r => Number(r.element_id) === id)
            : -1);

    if (idx >= 0 && Array.isArray(window.MyElementLibrary)) {
      // merge what we got from server while forcing element_state
      window.MyElementLibrary[idx] = {
        ...window.MyElementLibrary[idx],
        ...updated,
        element_state: newState
      };
    }

    // 2) window.EditElementObject (open context)
    if (window.EditElementObject && window.EditElementObject.element) {
      window.EditElementObject.element = {
        ...window.EditElementObject.element,
        ...updated,
        element_state: newState
      };

      // Clear client-side arrays that server removed, so UI stays consistent
      if (type === 'HOST') {
        window.EditElementObject.ElementVoucherArray = [];
      } else if (type === 'SERVICE') {
        window.EditElementObject.ElementTicketArray = [];
      } else if (type === 'PRODUCTION') {
        window.EditElementObject.ElementTicketArray  = [];
        window.EditElementObject.ElementVoucherArray = [];
      }
    }
  } catch (err) {
    console.warn('[WOW2][activate] local cache update warning', err);
  }

  

// -------- POST-refresh housekeeping (new) --------
  try {
    // 1) Broadcast an activation event for any external listeners
    document.dispatchEvent(new CustomEvent('wow2:elementActivated', {
      detail: { element_id: id, element_type: type, updated }
    }));

    // 2) Close the summary modal (preferred), or remove topmost modal as fallback
    if (typeof window.closeElementActivationSummaryModal === 'function') {
      window.closeElementActivationSummaryModal();
    } else {
      const modals = document.querySelectorAll('.wow2-modal-viewport');
      if (modals.length) modals[modals.length - 1].remove();
    }

    // 3) Always restore page scroll (defensive)
    try { document.body.style.overflow = ''; } catch (_) {}
  } catch (err) {
    console.warn('[WOW2][activate] post-refresh cleanup warning', err);
  }

// -------- re-render UI (move from בבנייה → אקטיבי) --------
  try {
    // Preferred: full elements-table re-render
    if (typeof window.renderElementsTable === 'function') {
        console.log("LOL1");
      window.renderElementsTable();
    }
    // Alternative dashboards (fallbacks)
    else if (typeof window.renderDashboardGrid === 'function') {
                console.log("LOL2");

      window.renderDashboardGrid();
    }
    else if (typeof window.refreshElementRow === 'function') {
                console.log("LOL3");

      window.refreshElementRow(id);
    }
  } catch (err) {
    console.warn('[WOW2][activate] UI refresh warning', err);
  }


  // Success boolean for caller flow
  return true;
}



