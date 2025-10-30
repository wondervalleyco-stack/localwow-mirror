// =====================================================================================
// WOW2 — Element Edit Modal (Dark UI)
// One file, readable, instrumented. No legacy wow* classes remain.
// =====================================================================================
var log_openElementEdit = true;



// ================================================================
// ================================================================
// =================== ENTRY: EDIT ELEMENT FORM ===================
// ================================================================
// ================================================================
async function openElementEdit(elementId) 
{


   // ----------------------------------------------------------------------------
   // 0) SET-UP
   // ----------------------------------------------------------------------------
   if (window.closeElementEdit) window.closeElementEdit();  // If another modal is open, close it first
   var __prevOverflow = document.body.style.overflow; // Lock page scroll while modal is open
   document.body.style.overflow = 'hidden';

   // ----------------------------------------------------------------------------
   // 1) LOAD ALL DATA OF elementId in window.EditElementObject
   // ----------------------------------------------------------------------------
   try 
   {
      if (log_openElementEdit) console.log('[WOW2][edit] loading element', elementId);
      await loadEditElementObject(elementId);
   } catch (err) 
     {
        console.error('[WOW2][edit] Failed to load element data', err);
        alert('שגיאה בטעינת הנתונים של האלמנט. נסה שוב מאוחר יותר.');
        document.body.style.overflow = __prevOverflow;
        return;
     }

   // save element index (in window.MyElementLibaray)
   const elementIndex = findElementIndexById(elementId);
   window.EditElementObject.ElementIndex = elementIndex;

   if (log_openElementEdit) console.log('[WOW2][edit] EditElementObject', window.EditElementObject);

   // ----------------------------------------------------------------------------
   // 2) BUILD MODAL SHELL (wow2) - viewport (backdrop & centering) → canvas (panel)
   // ----------------------------------------------------------------------------
   var modal = document.createElement('div');
   modal.className = 'wow2-modal-viewport wow2-z-modal';

   modal.innerHTML =
     '<div class="wow2-modal-canvas">' +
       // 2a) HEADER (wow2 title + guidance + first fields)
       renderEditFormHeader_wow2() +

       // 2b) ACTIONS (aligned to the right)
       '  <div class="wow2-btnstrip wow2-btnstrip--left">' +
       '    <button id="wow_elem_save_btn" class="wow2-btn wow2-btn--warm">שמור</button>' +
       '  </div>' +

       // 2c) TABS (wow2)
       // Tablist uses .wow2-tabs and .wow2-tab-btn; panel uses .wow2-tabpanel
       ' <div class="wow2-mt-l">' +
         ' <div class="wow2-tabs" role="tablist" aria-label="Element edit tabs">' +
           ' <button class="wow2-tab-btn is-active" data-tab="MAIN" type="button">ראשי</button>' +
           ' <button class="wow2-tab-btn" data-tab="TICKETS" type="button">כרטיסים</button>' +
           ' <button class="wow2-tab-btn" data-tab="VOUCHERS" type="button">שוברים</button>' +
           ' <button class="wow2-tab-btn" data-tab="CONTENT" type="button">תוכן</button>' +
         ' </div>' +
       ' <div class="wow2-tabpanel" id="wow_elem_tabpanel"></div>' +
     '</div>' +

       // 2d) ERROR STRIP (hidden by default)
       '  <div id="wow_elem_error" class="wow2-mt-m wow2-body-s wow2-hidden"></div>' +

   '</div>';
   document.body.appendChild(modal);

   // ----------------------------------------------------------------------------
   // 3) UI HOOKS
   // ----------------------------------------------------------------------------
   var ui = 
   {
      root: modal,
      canvas: modal.querySelector('.wow2-modal-canvas'),
      panel: document.getElementById('wow_elem_tabpanel'),
      btnSave: document.getElementById('wow_elem_save_btn'),
      tabButtons: Array.prototype.slice.call(modal.querySelectorAll('.wow2-tab-btn')),
      errorStrip: document.getElementById('wow_elem_error')
   };

   // ----------------------------------------------------------------------------
   // 4) CLOSE HANDLERS (ESC, backdrop click, page scroll once)
   // ----------------------------------------------------------------------------
   function __close() 
   {
      if (log_openElementEdit) console.log('[WOW2][edit] closing modal');
      if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
      document.body.style.overflow = __prevOverflow || '';
      window.removeEventListener('keydown', escHandler);
      window.removeEventListener('scroll', scrollHandler);
   } 
   window.closeElementEdit = __close;

   // escape button
   function escHandler(e){ if (e.key === 'Escape') __close(); }
   window.addEventListener('keydown', escHandler);

   // Backdrop: click outside the panel closes. (viewport is backdrop)
   modal.addEventListener('click', function(e)
   {
      if (e.target === modal) __close();
   });

   // Optional: close on first page scroll (same as before)
   function scrollHandler(){ __close(); }
   window.addEventListener('scroll', scrollHandler, { once: true });

   // ----------------------------------------------------------------------------
   // 5) INITIAL RENDER + TAB BUTTONS LISTENERS(on tab change)
   // ----------------------------------------------------------------------------
   var activeTab = 'MAIN';
   renderActiveTab_wow2(ui, activeTab);

   ui.tabButtons.forEach(function(btn)
   {
      btn.addEventListener('click', function()
      {
         ui.tabButtons.forEach(function(b){ b.classList.remove('is-active'); });
         btn.classList.add('is-active');
         activeTab = btn.getAttribute('data-tab');
         renderActiveTab_wow2(ui, activeTab);
      });
   });

   // ----------------------------------------------------------------------------
   // 6) SAVE HANDLER 
   // ----------------------------------------------------------------------------
  
   ui.btnSave.addEventListener('click', function()
   {
      if (log_openElementEdit) console.log('[WOW2][edit] save clicked');
      wow2SaveElement(ui, activeTab);

   });
}

// =====================================================================================
// =====================================================================================
// =================================    SAVE FORM   ====================================
// =====================================================================================
// =====================================================================================
async function wow2SaveElement(ui, activeTab) {
  try {
    if (window.log_openElementEdit) console.log('[WOW2][edit] save clicked');

    // 1) base context
    const idx = window.EditElementObject?.ElementIndex ?? -1;
    if (idx < 0 || !Array.isArray(window.MyElementLibrary)) {
      alert('אין הקשר אלמנט לעריכה.');
      return;
    }
    const original = window.MyElementLibrary[idx];
    const elementId = original?.element_id;

    // 2) read header fields (be tolerant to ids)
    const nameEl = _byIdOneOf(['wow_elem_name', 'element_name', 'wow2_element_name']);
    const typeEl = _byIdOneOf(['wow_elem_type', 'element_type', 'wow2_element_type']);

    const newName = (nameEl ? nameEl.value : original.element_name || '').trim();
    const newType = (typeEl ? (typeEl.value || '').trim().toUpperCase() : (original.element_type || '')).toUpperCase();

    // 3) name-dup guard (only if changed)
    const nameChanged = (newName || '') !== (original.element_name || '');
    if (nameChanged) {
      const exists = (window.MyElementLibrary || []).some(r =>
        r &&
        r.creator_id === original.creator_id &&
        r.element_id !== elementId &&
        (r.element_name || '').toLowerCase() === newName.toLowerCase()
      );
      if (exists) {
        alert('יש לך כבר אלמנט בשם הזה — בחר שם אחר.');
        return;
      }
    }

    // 4) build payload by active tab + type
    const payload = {};
    if (nameChanged) payload.element_name = newName;
    if (newType && newType !== (original.element_type || '')) payload.element_type = newType;

    // MAIN tab fields (only from the active MAIN tab)
    if (activeTab === 'MAIN') {
      if (newType === 'HOST') {
        payload.max_participants    = _intOrNull(document.getElementById('max_participants'));
        payload.min_participants    = _intOrNull(document.getElementById('min_participants'));
        payload.over_min_percent    = _intOrNull(document.getElementById('over_min_percent'));
        payload.min_time_slots      = _intOrNull(document.getElementById('min_time_slots'));
        payload.duration_minutes    = _hhmmToMinutes((_byIdOneOf(['duration_hhmm']) || {}).value || '');
        payload.location_text       = _textOrNull(document.getElementById('location_text'));
      } else if (newType === 'SERVICE') {
        payload.max_per_hour               = _intOrNull(document.getElementById('max_per_hour'));
        payload.min_participants_threshold = _intOrNull(document.getElementById('min_participants_threshold'));
      } else if (newType === 'PRODUCTION') {
        payload.price_per_time_slot = _numOrNull(document.getElementById('price_per_time_slot'));
        payload.max_participants    = _intOrNull(document.getElementById('max_participants'));
        payload.min_time_slots      = _intOrNull(document.getElementById('min_time_slots'));
      }
    }

    // prune undefined keys (leave nulls — server expects them)
    for (const k of Object.keys(payload)) {
      if (typeof payload[k] === 'undefined') delete payload[k];
    }

    // 5) minimal client validation (requireds)
    if (newType === 'HOST') {
      if (payload.max_participants === null || payload.min_participants === null) {
        alert('חסר ערך נדרש בטופס (מקס׳/מינ׳ משתתפים).');
        return;
      }
    } else if (newType === 'SERVICE') {
      if (payload.max_per_hour === null || payload.min_participants_threshold === null) {
        alert('חסר ערך נדרש בטופס (מקס׳ לשעה / מינ׳ משתתפים).');
        return;
      }
    } else if (newType === 'PRODUCTION') {
      if (payload.price_per_time_slot === null || payload.max_participants === null) {
        alert('חסר ערך נדרש בטופס (מחיר לחלון זמן / מקס׳ משתתפים).');
        return;
      }
    }

    // 6) send PUT
    const url   = (window.WOW_API?.elementsPutBaseURL)
      ? `${window.WOW_API.elementsPutBaseURL}/${encodeURIComponent(elementId)}`
      : `/wp-json/wow/v1/elements-edit/${encodeURIComponent(elementId)}`;
    const nonce = window.WOW_API?.nonce;

    const res = await fetch(url, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...(nonce ? { 'X-WP-Nonce': nonce } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      let msg = 'שגיאת שרת';
      try { const j = await res.json(); msg = j?.message || msg; } catch(_){}
      throw new Error(msg);
    }

    // 7) merge fresh model into library and toast
    const fresh = await res.json();
    window.MyElementLibrary[idx] = fresh;
    if (window.log_openElementEdit) console.log('[WOW2][edit] saved', fresh);
    alert('נשמר');
if (typeof window.closeElementEdit === 'function') {
  window.closeElementEdit();
}


  } catch (err) {
    console.error('[WOW2][edit] save failed', err);
    const strip = ui?.errorStrip;
    if (strip) {
      strip.textContent = (err && err.message) ? err.message : 'שמירה נכשלה';
      strip.classList.remove('wow2-hidden');
    } else {
      alert(err?.message || 'שמירה נכשלה');
    }
  }
}

// ----------------------------------------------------------------------------
//     HELPER FUNCTIONS FOR SAVE FORM:
// ----------------------------------------------------------------------------

// Helper: try multiple ids safely
function _byIdOneOf(ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

// Helper: parse HH:MM → minutes (or null)
function _hhmmToMinutes(v) {
  if (!v || typeof v !== 'string') return null;
  const m = v.trim().match(/^(\d+):([0-5]\d)$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(h) || Number.isNaN(mm)) return null;
  return h * 60 + mm;
}

// Helper: coerce numeric field from input
function _numOrNull(el) {
  if (!el) return null;
  const raw = (el.value ?? '').toString().trim();
  if (raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// Helper: coerce int (round down) from input
function _intOrNull(el) {
  const n = _numOrNull(el);
  return n === null ? null : Math.trunc(n);
}

// Helper: text or null (trimmed)
function _textOrNull(el) {
  if (!el) return null;
  const t = (el.value ?? '').toString().trim();
  return t === '' ? null : t;
}




// =====================================================================================
// =====================================================================================
// ==============================    EDIT FORM HEADER   ================================
// =====================================================================================
// =====================================================================================

function renderEditFormHeader_wow2() 
{

   // ----------------------------------------------------------------------------
   // 1) GET DATA
   // ----------------------------------------------------------------------------
   let elementName = '';
   let elementIndex = '';
   try 
   {
      elementIndex = window.EditElementObject.ElementIndex;
      elementName = window.MyElementLibrary[elementIndex].element_name || '';
   } catch (err) 
     {
        console.warn('[WOW2][renderEditFormHeader] name lookup failed', err);
     }

   let elementType = '';
   try 
   {
      elementType = window.MyElementLibrary[elementIndex].element_type || '';
   } catch (err) 
      {
         console.warn('[WOW2][renderEditFormHeader] type lookup failed', err);
      }

   // ----------------------------------------------------------------------------
   // 2) BUILD HTML AND RETURN IT
   // ----------------------------------------------------------------------------
   return(
      // Section grouping (outer spacing comes from modal stack rhythm)
    '<section class="wow2-section">' +
      // Page title (scales on mobile via media query)
      '<div class="wow2-title-l">עריכת אלמנט</div>' +

      // Guidance
      renderInfoBox_wow2('לאחר מילוי שם האלמנט ניתן ללחוץ שמור והאלמנט יתווסף לספריה. רק לאחר מילוי כל שדות החובה (המסומנים בכוכב) ניתן יהיה להפעיל את האלמנט ולהפוך אותו זמין לשימוש בהצעות ולשיתוף עם יוצרים אחרים. שינוי סוג האלמנט אחרי תחילת התהליך עלול למחוק שדות שהיו רלוונטיים בסוג הקודם.') +

      // Name input
      renderFlexFormInput_wow2({ id: 'element_name', label: 'שם אלמנט', required: true, value: elementName }) +

       // Type container (visual group)
       '<div class="wow2-container wow2-card-rail">' +

        renderFlexFormRadio_wow2(
        {
           id: 'element_type',
           label: 'סוג אלמנט',
           required: true,
           value: elementType,                 // 'HOST' | 'SERVICE' | 'PRODUCTION'
           options: 
           [
              { value: 'HOST',       label: 'מארח' },
              { value: 'SERVICE',    label: 'שירות'},
              { value: 'PRODUCTION', label: 'הפקה' }
           ]
           , onChange: 'onElementTypeChanged_wow2'
        }) +

        // Guidance
        renderInfoBox2_wow2('אלמנט מארח הוא הבסיס לכל מערכת: מסגרת אירוח, לוקיישן ברור ומשך. האלמנט הזה כולל כרטיס כניסה לכל המשתתפים.') +

        // Locking note
        '<div class="wow2-note wow2-mt-s">• לא ניתן לשינוי אחרי האקטיבציה</div>' +

      '</div>' +

    '</section>'
   );
}

// =====================================================================================
// =====================================================================================
// ===============================    EDIT FORM TABS   =================================
// =====================================================================================
// =====================================================================================


// ---------------------------------------------------------------------------
// Central router — call active tab render function
// --------------------------------------------------------------------------- 
function renderActiveTab_wow2(ui, activeTab) {
    console.log("activeTab",activeTab);

    window.__active_edit_tab = activeTab;

if (activeTab === 'MAIN') return renderMainTab_wow2(ui);
if (activeTab === 'TICKETS') return renderTicketsTab_wow2(ui);
if (activeTab === 'VOUCHERS') return renderVouchersTab_wow2(ui);
if (activeTab === 'CONTENT') return renderContentTab_wow2(ui);
}

// ---------------------------------------------------------------------------
// Helper — get correct UI ref for current tab
// ---------------------------------------------------------------------------
function getActiveUiRef_wow2(tabKey) {
  const key = tabKey || window.__active_edit_tab || 'MAIN';
  if (key === 'TICKETS')  return window.__tickets_ui_ref || null;
  if (key === 'VOUCHERS') return window.__vouchers_ui_ref || null;
  if (key === 'CONTENT')  return window.__content_ui_ref || null;
  return  window.__main_ui_ref || null;
}

// ---------------------------------------------------------------------------
// On element_type radio input change(trigger rerender)
// ---------------------------------------------------------------------------
function onElementTypeChanged_wow2(newVal) {
  console.log('[wow2] element_type changed to', newVal);

  // 1) Persist to model
  try {
    const idx = window.EditElementObject?.ElementIndex;
    if (idx != null && window.MyElementLibrary?.[idx]) {
      window.MyElementLibrary[idx].element_type = newVal;
    }
  } catch (e) {
    console.warn('[wow2] element_type update failed', e);
  }

  // 2) Re-render the current tab
  const tab = window.__active_edit_tab || 'MAIN';
  const ui  = getActiveUiRef_wow2(tab);

  console.log('[wow2] re-render tab', tab, 'ui=', ui);
  if (ui && typeof renderActiveTab_wow2 === 'function') {
    renderActiveTab_wow2(ui, tab);
  } else {
    console.warn('[wow2] re-render skipped: ui not found for tab', tab);
  }
}




// ==================================================================
// ==================================================================
// =============   RENDER THE MAIN TAB (ראשי) — WOW2   ==============
// ==================================================================
// ==================================================================

function renderMainTab_wow2(ui) 
{

    // if first time save. global handle to the tabs panel
    if(!window.__main_ui_first_time)
    {
        window.__main_ui_first_time = true;
        window.__main_ui_ref = ui;
    }

    // send to the right render function(HOST | SERVICE | PRODUCTION) 
    console.log("renderMainTab_wow2");
   
    const ElementType = getFlexFormRadio('element_type');

    console.log("ElementType is",ElementType);


    if (ElementType === 'HOST')
    {
        renderMainTabForHost_wow2(ui);
        return; 
    }
    
    if (ElementType === 'SERVICE')
    {
       renderMainTabForService_wow2(ui); 
       return; 
    }
       
    if (ElementType === 'PRODUCTION')
    {
       renderMainTabForProduction_wow2(ui); 
       return; 
    }

        console.log("no rendering at all");

    console.warn("ElementType UNKNOWN");
}


// ==================================================================
// ==================================================================
// ============  RENDER THE TICKETS TAB (כרטיסים) — WOW2  ===========
// ==================================================================
// ==================================================================

function renderTicketsTab_wow2(ui) 
{

    // if first time save. global handle to the tabs panel
    if(!window.__tickets_ui_first_time)
    {
        window.__tickets_ui_first_time = true;
        window.__tickets_ui_ref = ui;
    }

    // send to the right render function(HOST | SERVICE | PRODUCTION) 
    const ElementType = getFlexFormRadio('element_type');
    
    if (ElementType === 'HOST')
    {
        renderTicketsTabForHost_wow2(ui);
        return; 
    }
      
     renderEmptyTicketsTab_wow2(ui);
        


}


// ==================================================================
// ==================================================================
// ===========   RENDER THE VOUCHERS TAB (ואוצ׳רים) — WOW2  =========
// ==================================================================
// ==================================================================

function renderVouchersTab_wow2(ui) 
{

    // if first time save. global handle to the tabs panel
    if(!window.__vouchers_ui_first_time)
    {
        window.__vouchers_ui_first_time = true;
        window.__vouchers_ui_ref = ui;
    }

    // send to the right render function(HOST | SERVICE | PRODUCTION) 
    
    const ElementType = getFlexFormRadio('element_type');

    if (ElementType === 'SERVICE')
    {
        renderVoucherTabForService_wow2(ui);
        return; 
    }
          
    renderEmptyVoucherTab_wow2(ui);
        
}

// ==================================================================
// ==================================================================
// ===========    RENDER THE CONTENT TAB (תוכן) — WOW2   ============
// ==================================================================
// ==================================================================

function renderContentTab_wow2(ui)  
{

    // if first time save. global handle to the tabs panel
    if(!window.__content_ui_first_time)
    {
        window.__content_ui_first_time = true;
        window.__content_ui_ref = ui;
    }

    // all element types have content(HOST | SERVICE | PRODUCTION) 
    
    renderPostsTab_wow2(ui);
    
}





