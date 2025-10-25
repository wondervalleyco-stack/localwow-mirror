// =====================================================================================
// WOW2 — Element Edit Modal (Dark UI)
// One file, readable, instrumented. No legacy wow* classes remain.
// =====================================================================================

var log_openElementEdit = true;

// ===============================================================
// =================== ENTRY: EDIT ELEMENT FORM ===================
// ===============================================================
async function openElementEdit(elementId) {

// If another modal is open, close it first
if (window.closeElementEdit) window.closeElementEdit();

// Lock page scroll while modal is open
var __prevOverflow = document.body.style.overflow;
document.body.style.overflow = 'hidden';

// ----------------------------------------------------------------------------
// 1) LOAD DATA NEEDED FOR RENDER
// ----------------------------------------------------------------------------
try {
if (log_openElementEdit) console.log('[WOW2][edit] loading element', elementId);
await loadEditElementObject(elementId);
} catch (err) {
console.error('[WOW2][edit] Failed to load element data', err);
alert('שגיאה בטעינת הנתונים של האלמנט. נסה שוב מאוחר יותר.');
document.body.style.overflow = __prevOverflow;
return;
}

// Add element index (for quick lookups in the header renderer)
const elementIndex = findElementIndexById(elementId);
window.EditElementObject.ElementIndex = elementIndex;

if (log_openElementEdit) console.log('[WOW2][edit] EditElementObject', window.EditElementObject);

// ----------------------------------------------------------------------------
// 2) BUILD MODAL SHELL (wow2)
// Structure: viewport (backdrop & centering) → canvas (panel)
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
' </div>' +
  // 2d) ERROR STRIP (hidden by default)
  '  <div id="wow_elem_error" class="wow2-mt-m wow2-body-s wow2-hidden"></div>' +

'</div>';
document.body.appendChild(modal);

// ----------------------------------------------------------------------------
// 3) UI HOOKS
// ----------------------------------------------------------------------------
var ui = {
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
function __close() {
if (log_openElementEdit) console.log('[WOW2][edit] closing modal');
if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
document.body.style.overflow = __prevOverflow || '';
window.removeEventListener('keydown', escHandler);
window.removeEventListener('scroll', scrollHandler);
}
window.closeElementEdit = __close;

function escHandler(e){ if (e.key === 'Escape') __close(); }
window.addEventListener('keydown', escHandler);

// Backdrop: click outside the panel closes. (viewport is backdrop)
modal.addEventListener('click', function(e){
if (e.target === modal) __close();
});

// Optional: close on first page scroll (same as before)
function scrollHandler(){ __close(); }
window.addEventListener('scroll', scrollHandler, { once: true });

// ----------------------------------------------------------------------------
// 5) INITIAL RENDER + TAB ROUTING
// ----------------------------------------------------------------------------
var activeTab = 'MAIN';
renderActiveTab_wow2(ui, activeTab);

ui.tabButtons.forEach(function(btn){
btn.addEventListener('click', function(){
ui.tabButtons.forEach(function(b){ b.classList.remove('is-active'); });
btn.classList.add('is-active');
activeTab = btn.getAttribute('data-tab');
renderActiveTab_wow2(ui, activeTab);
});
});

// ----------------------------------------------------------------------------
// 6) SAVE HANDLER (stub)
// ----------------------------------------------------------------------------
ui.btnSave.addEventListener('click', function(){
if (log_openElementEdit) console.log('[WOW2][edit] save clicked');
// TODO: implement save flow
});
}

// =====================================================================================
// ============================== PURE RENDERERS (WOW2) ================================
// =====================================================================================

// ------------------------------------------------------------------
// Header block: title, infobox, name field, type radios, note
// ------------------------------------------------------------------
function renderEditFormHeader_wow2() {

// Read element context for prefill
let elementName = '';
let elementIndex = '';
try {
elementIndex = window.EditElementObject.ElementIndex;
elementName = window.MyElementLibrary[elementIndex].element_name || '';
} catch (err) {
console.warn('[WOW2][renderEditFormHeader] name lookup failed', err);
}

let elementType = '';
try {
elementType = window.MyElementLibrary[elementIndex].element_type || '';
} catch (err) {
console.warn('[WOW2][renderEditFormHeader] type lookup failed', err);
}

// Title + guidance + primary fields
return (
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

    renderFlexFormRadio_wow2({
      id: 'element_type',
      label: 'סוג אלמנט',
      required: true,
      value: elementType,                 // 'HOST' | 'SERVICE' | 'PRODUCTION'
      options: [
        { value: 'HOST',       label: 'מארח' },
        { value: 'SERVICE',    label: 'שירות' },
        { value: 'PRODUCTION', label: 'הפקה' }
      ]
    }) +

     // Guidance
    renderInfoBox2_wow2('אלמנט מארח הוא הבסיס לכל מערכת: מסגרת אירוח, לוקיישן ברור ומשך. האלמנט הזה כולל כרטיס כניסה לכל המשתתפים.') +

    // Context note (secondary help style)
    //'<div class="wow2-help">אלמנט מארח הוא הבסיס לכל מערכת: מסגרת אירוח, לוקיישן ברור ומשך. האלמנט הזה כולל כרטיס כניסה לכל המשתתפים.</div>' +

    // Locking note
    '<div class="wow2-note wow2-mt-s">• לא ניתן לשינוי אחרי האקטיבציה</div>' +

  '</div>' +

'</section>'
);
}

// ------------------------------------------------------------------
// TABS — each renders into ui.panel with wow2 classes
// ------------------------------------------------------------------



// ==================================================================
// ==================================================================
// RENDER THE MAIN TAB (ראשי) — WOW2
// ==================================================================
// ==================================================================
function renderMainTab_wow2(ui) {
  const idx  = (window.EditElementObject && window.EditElementObject.ElementIndex) ?? -1;
  const row  = (idx >= 0 && window.MyElementLibrary && window.MyElementLibrary[idx]) ? window.MyElementLibrary[idx] : {};

  // values from the element row (null/undefined → "")
  const max_participants   = nz(row.max_participants);
  const min_participants   = nz(row.min_participants);
  const over_min_percent   = nz(row.over_min_percent);
  const min_time_slots     = nz(row.min_time_slots);
  const duration_minutes   = row.duration_minutes ?? null;     // number or null
  const location_text      = nz(row.location_text);

  const hhmm = minutesToHHMM(duration_minutes); // "H:MM" or ""

  ui.panel.innerHTML =
    '<section class="wow2-section">' +
      '<div class="wow2-sub-h">ראשי</div>' +

      // 1) MAX PARTICIPANTS
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id:'max_participants', label:'מקסימום משתתפים בחלון זמן אחד:', required:true, value:max_participants, min:0, step:1 }) +
        renderInfoBox_wow2('המספר קובע את מספר המשתתפים שאפשר לשלוח בחלון זמן אחד. המספר קשור למקסימום הקיבולת הפיזית של הלוקיישן או המארח. המספר קובע כמות משתתפים בפועל בלי קשר האם הפריטים זוג או קבוצה.') +
        '<div class="wow2-note">• לא ניתן לשינוי אחרי האקטיבציה</div>' +
      '</div>' +

      // 2) MIN PARTICIPANTS
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id:'min_participants', label:'מינימום משתתפים בחלון זמן אחד:', required:true, value:min_participants, min:0, step:1 }) +
        renderInfoBox_wow2('המספר קובע כמה מינימום משתתפים חייבים להירשם לכל חלון זמן כדי שאפשר יהיה לקיים את האירוע. שימו לב: מספר זה יקבע מתי חלון זמן הופך ל״סליקה״ ואפשר להצעות לעבור ממצב מוקפא/טיוטה למצב הצלחה.') +
        '<div class="wow2-note">• ניתן לשינוי אחרי האקטיבציה</div>' +
      '</div>' +

      // 3) OVER MIN PERCENT
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id:'over_min_percent', label:'אחוז הרשמה מעבר למינימום:', required:false, value:over_min_percent, min:0, max:100, step:1, suffix:"%" }) +
        renderInfoBox_wow2('אחוז זה מגבה מרווח תפעולי על חלון זמן שהגיע לסליקה — ההמלצה היא לפחות 10%.') +
      '</div>' +

      // 4) MIN TIME SLOTS
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderNumberInput_wow2({ id:'min_time_slots', label:'מינימום חלונות הזמן בהצעה:', required:false, value:min_time_slots, min:0, step:1 }) +
        renderInfoBox_wow2('המספר מאפשר ליוצר האלמנט לקבוע כמה חלונות זמן מינימליים שהצעה שמכילה אותו צריכה למכור על מנת שאירוע יצא לפועל.') +
      '</div>' +

      // 5) DURATION (HH:MM)
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderDurationInput_wow2({ id:'duration_hhmm', label:'משך חלון זמן אחד:', required:false, valueHHMM: hhmm }) +
        renderInfoBox_wow2('זמן זה קובע את משך החלון מפתיחת הדלתות ועד סיום החוויה. שימו לב — האלמנט האחראי קובע את המשך של חלון הזמן/אורך האירוע עבור כל המשתתפים הנופלים באותו חלון תאריך/שעה.') +
      '</div>' +

      // 6) LOCATION TEXT
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderFlexFormInput_wow2({ id:'location_text', label:'מיקום ההפקה:', required:false, value:location_text, placeholder:"רחוב הפרדס 3 - פרדס חנה - כרכור" }) +
        renderInfoBox_wow2('טקסט חופשי של כתובת/מיקום. טיפ: השדה הזה מוצג למשתתפים בשלב מאוחר יותר או רק למי שנרשם — לפי הגדרות האלמנט.') +
      '</div>' +

    '</section>';
}

// -----------------------
// HELPER FUNCTIONS (tiny)
// -----------------------
function nz(v, def='') { return (v === null || v === undefined) ? def : String(v); }

// Minutes → "H:MM" (e.g., 120 → "2:00"), null/"" → ""
function minutesToHHMM(mins) {
  if (mins === null || mins === undefined || mins === '') return '';
  const m = Math.max(0, parseInt(mins, 10));
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  return `${h}:${mm}`;
}

// "H:MM" → total minutes (e.g., "1:30" → 90), invalid → null
function hhmmToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return null;
  const m = hhmm.trim().match(/^(\d{1,3}):([0-5]\d)$/);
  if (!m) return null;
  return parseInt(m[1],10) * 60 + parseInt(m[2],10);
}

// Number strip (same visual as text, just type=number + min/max/step)
function renderNumberInput_wow2({ id, label, required=false, value='', min=null, max=null, step=1, suffix='' }) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  const minAttr  = (min !== null && min !== undefined) ? ` min="${min}"` : '';
  const maxAttr  = (max !== null && max !== undefined) ? ` max="${max}"` : '';
  const stepAttr = (step !== null && step !== undefined) ? ` step="${step}"` : '';
  const suffixHTML = suffix ? `<span class="wow2-note" style="margin-inline-start:6px">${suffix}</span>` : '';

  return (
    '<div class="wow2-flexrow">' +
      `<label class="wow2-formlabel" for="${id}">${req}<span>${label}</span></label>` +
      '<div class="wow2-formcontrol">' +
        `<div class="wow2-input" style="display:flex;align-items:center;">` +
          `<input id="${id}" type="number" class="wow2-input" style="background:transparent;border:0;flex:1" value="${value}"${minAttr}${maxAttr}${stepAttr}>` +
          suffixHTML +
        `</div>` +
      '</div>' +
    '</div>'
  );
}

// HH:MM strip (duration)
function renderDurationInput_wow2({ id, label, required=false, valueHHMM='' }) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  // We keep a single text input with pattern "H:MM" to stay on our styled wow2-input.
  return (
    '<div class="wow2-flexrow">' +
      `<label class="wow2-formlabel" for="${id}">${req}<span>${label}</span></label>` +
      '<div class="wow2-formcontrol">' +
        `<input id="${id}" class="wow2-input" type="text" inputmode="numeric" placeholder="שעות:דקות" value="${valueHHMM}" pattern="^\\d{1,3}:[0-5]\\d$" title="הקלד שעות:דקות (לדוגמה 2:00)">` +
      '</div>' +
    '</div>'
  );
}



// ==================================================================
// ==================================================================
// RENDER THE TICKETS TAB (כרטיסים) — WOW2
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
    }
    else
        {
           // renderEmptyTicketsTab_wow2(ui);
        }


}


// ----------------------------------------
// helpers
// ----------------------------------------
function getTicketsArray_wow2() {
  // Try a few common shapes; normalize to []
  try {
    if (window.EditElementObject && Array.isArray(window.EditElementObject.tickets)) {
      return window.EditElementObject.tickets;
    }
    if (window.EditElementObject && Array.isArray(window.EditElementObject.TICKETS)) {
      return window.EditElementObject.TICKETS;
    }
    if (window.EditElementObject && Array.isArray(window.EditElementObject.ticket_types)) {
      return window.EditElementObject.ticket_types;
    }
  } catch (e) { /* no-op */ }
  return [];
}

/**
 * Render a single ticket strip row.
 * Expected ticket fields (best-effort): name, type, price_per_person, group_size, max_groups
 */
function renderTicketRow_wow2(t, idx) {
  var name         = safe(t && (t.name || t.ticket_name));
  var type         = safe(t && (t.type || t.ticket_type));
  var price        = numberOrDash(t && (t.price_per_person || t.price));
  var groupSize    = numberOrDash(t && (t.group_size || t.size || t.people));
  var maxGroups    = numberOrDash(t && (t.max_groups || t.max_group_count));

  return (
    '<div class="wow2-strip">' +
      '<div class="wow2-strip-title">' + name + '</div>' +
      '<div class="wow2-strip-left" style="grid-template-columns: repeat(6, 90px);">' +
        '<div class="wow2-cell">' +
          '<button type="button" class="wow2-btn wow2-btn--micro" data-edit-ticket="' + idx + '">ערוך</button>' +
          '<button type="button" class="wow2-btn wow2-btn--micro" style="margin-inline-start:6px" data-del-ticket="' + idx + '">מחק</button>' +
        '</div>' +
        '<div class="wow2-cell">' + maxGroups + '</div>' +
        '<div class="wow2-cell">' + groupSize + '</div>' +
        '<div class="wow2-cell">' + price + '</div>' +
        '<div class="wow2-cell">' + type + '</div>' +
        '<div class="wow2-cell">' + name + '</div>' +
      '</div>' +
    '</div>'
  );
}

function safe(v){ return (v === null || v === undefined) ? '' : String(v); }
function numberOrDash(v){
  if (v === null || v === undefined || v === '') return '—';
  var n = Number(v);
  return Number.isFinite(n) ? String(n) : String(v);
}


function renderVouchersTab_wow2(ui) {
ui.panel.innerHTML =
'<section class="wow2-section">' +
'<div class="wow2-sub-h">שוברים</div>' +
'<div class="wow2-mt-s wow2-body">I am in vouchers tab</div>' +
'</section>';
}

function renderContentTab_wow2(ui) {
ui.panel.innerHTML =
'<section class="wow2-section">' +
'<div class="wow2-sub-h">תוכן</div>' +
'<div class="wow2-mt-s wow2-body">I am in content tab</div>' +
'</section>';
}

// Central router
function renderActiveTab_wow2(ui, activeTab) {
if (activeTab === 'MAIN') return renderMainTab_wow2(ui);
if (activeTab === 'TICKETS') return renderTicketsTab_wow2(ui);
if (activeTab === 'VOUCHERS') return renderVouchersTab_wow2(ui);
if (activeTab === 'CONTENT') return renderContentTab_wow2(ui);
}

// =====================================================================================
// =================== WOW2 COMPONENT RENDERERS (Inputs/Radio/Info) ====================
// =====================================================================================

// Info box dark(compact helper chip)
function renderInfoBox_wow2(text) {
return '<div class="wow2-infobox wow2-card-rail">' + text + '</div>';
}

// Info box darker(compact helper chip)
function renderInfoBox2_wow2(text) {
return '<div class="wow2-infobox2 wow2-card-rail">' + text + '</div>';
}




// Value getters (unchanged semantics)
function getFlexFormValue(id) {
const el = document.getElementById(id);
return el ? el.value : '';
}

function getFlexFormRadio(nameOrId) {
var el = document.querySelector('input[type="radio"][name="' + nameOrId + '"]:checked');
if (el) return el.value;

const box = document.getElementById(nameOrId);
if (box) {
el = box.querySelector('input[type="radio"]:checked');
if (el) return el.value;
}
return '';
}



