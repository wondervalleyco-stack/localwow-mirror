// ------------------------   left overs from before this file   ----------------------------
// Info box dark(compact helper chip)
function renderInfoBox_wow2(text) {
    console.log("PPPPPPPPPPPPPPPPPPPPPPPPPP");

return '<div class="wow2-infobox wow2-card-rail">' + text + '</div>';
}

// Info box darker(compact helper chip)
function renderInfoBox2_wow2(text) {
        console.log("PPPPPPPPPPPPPPPPPPPPPPPPPP2");

return '<div class="wow2-infobox2 wow2-card-rail">' + text + '</div>';
}


function getFlexFormRadio(nameOrId) {
        console.log("PPPPPPPPPPPPPPPPPPPPPPPPPP4");

var el = document.querySelector('input[type="radio"][name="' + nameOrId + '"]:checked');
if (el) return el.value;

const box = document.getElementById(nameOrId);
if (box) {
el = box.querySelector('input[type="radio"]:checked');
if (el) return el.value;
}
return '';
}










// ===========================================================================
// ===========================    STRIP TABLE    =============================
// ===========================================================================

// ---------------------------------------------------------------------------
// Header strip — standard (dark background)
// ---------------------------------------------------------------------------
function buildHeaderStrip_wow2(
  rightLabel, numOfLeft,
  left1, left2 = null, left3 = null, left4 = null, left5 = null
) {
  // +1 to include the Actions column
  const cols = (Number(numOfLeft) || 0) + 1;
  const leftCls = `wow2-strip-left wow2-strip-left-${cols}`;

  let leftHTML = '';
  // Actions first
  if (left1) leftHTML += `<div class="wow2-hcell">${left1}</div>`;
  if (left2) leftHTML += `<div class="wow2-hcell">${left2}</div>`;
  if (left3) leftHTML += `<div class="wow2-hcell">${left3}</div>`;
  if (left4) leftHTML += `<div class="wow2-hcell">${left4}</div>`;
  if (left5) leftHTML += `<div class="wow2-hcell">${left5}</div>`;
  leftHTML += `<div class="wow2-hcell wow2-hcell--action">פעולות</div>`;


  return `
    <div class="wow2-strip wow2-strip--header">
      <div class="wow2-strip-right">
        <div class="wow2-hcell">${rightLabel}</div>
      </div>
      <div class="${leftCls}">
        ${leftHTML}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Header strip — darker version (wow2-strip--header-darker)
// ---------------------------------------------------------------------------
function buildHeaderStrip_wow2_darker(
  rightLabel, numOfLeft,
  left1, left2 = null, left3 = null, left4 = null, left5 = null
) {
  // +1 to include the Actions column
  const cols = (Number(numOfLeft) || 0) + 1;
  const leftCls = `wow2-strip-left wow2-strip-left-${cols}`;

  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
 
  let leftHTML = '';
  // Actions first
  
  if (left1) leftHTML += `<div class="wow2-hcell">${left1}</div>`;
  if (left2) leftHTML += `<div class="wow2-hcell">${left2}</div>`;
  if (left3) leftHTML += `<div class="wow2-hcell">${left3}</div>`;
  if (left4) leftHTML += `<div class="wow2-hcell">${left4}</div>`;
  if (left5) leftHTML += `<div class="wow2-hcell">${left5}</div>`;
  leftHTML += `<div class="wow2-hcell wow2-hcell--action">פעולות</div>`;

  return `
    <div class="wow2-strip wow2-strip--header wow2-strip--darker">
      <div class="wow2-strip-right">
        <div class="wow2-hcell">${rightLabel}</div>
      </div>
      <div class="${leftCls}">
        ${leftHTML}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Header strip — standard (dark background)
// ---------------------------------------------------------------------------
function buildRowStrip_wow2(
  tone = 'warm',
  rightText,
  numOfLeft,
  iconData = {},               // { entityType, entityId, tab }
  left1, left2 = null, left3 = null, left4 = null, left5 = null
) {
  console.log("3-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

  // ---------------------------------------------------------------------------
  // 1) Compute total column count for left grid
  //    We add +1 because the action column (play icon) is always appended.
  // ---------------------------------------------------------------------------
  const totalLeft = numOfLeft + 1;
  const leftCls = `wow2-strip-left wow2-strip-left-${totalLeft}`;

  // ---------------------------------------------------------------------------
  // 2) Build the left-side cells (data columns)
  // ---------------------------------------------------------------------------
  let leftHTML = '';
  if (left1 != null) leftHTML += `<div class="wow2-hcell">${left1}</div>`;
  if (left2 != null) leftHTML += `<div class="wow2-hcell">${left2}</div>`;
  if (left3 != null) leftHTML += `<div class="wow2-hcell">${left3}</div>`;
  if (left4 != null) leftHTML += `<div class="wow2-hcell">${left4}</div>`;
  if (left5 != null) leftHTML += `<div class="wow2-hcell">${left5}</div>`;

  // ---------------------------------------------------------------------------
  // 3) Always append the ACTION cell
  //    - Renders a round play icon
  //    - Includes data-entity-* attributes for openIconMenu()
  // ---------------------------------------------------------------------------
  const et  = (iconData.entityType ?? '').toString();
  const eid = (iconData.entityId   ?? '').toString();
  const tab = (iconData.tab        ?? '').toString();

  const actionCell = `
    <div class="wow2-hcell wow2-hcell--action">
      <button
        class="wow2-action-icon wow2-action-icon--play wow2-row-menu"
        aria-label="פעולות"
        data-entity-type="${et}"
        data-entity-id="${eid}"
        data-entity-tab="${tab}">
        <!-- inline SVG: round play icon -->
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M10 8l6 4-6 4z"></path>
        </svg>
      </button>
    </div>
  `;

  leftHTML += actionCell;

  // ---------------------------------------------------------------------------
  // 4) Combine all pieces into the full row
  // ---------------------------------------------------------------------------
  return `
    <div class="wow2-strip" data-tone="${tone}">
      <!-- Right side: main title -->
      <div class="wow2-strip-right">
        <div class="wow2-name">${rightText}</div>
      </div>

      <!-- Left side: data cells + action button -->
      <div class="${leftCls}">
        ${leftHTML}
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Header strip — standard (darker background)
// ---------------------------------------------------------------------------

function buildRowStrip_wow2_darker(
  tone = 'dark',
  rightText,
  numOfLeft,
  iconData = {},               // { entityType, entityId, tab }
  left1, left2 = null, left3 = null, left4 = null, left5 = null
) {
  // ---------------------------------------------------------------------------
  // 1) Compute total column count for left grid (+1 for actions)
  // ---------------------------------------------------------------------------
  const totalLeft = numOfLeft + 1;
  const leftCls = `wow2-strip-left wow2-strip-left-${totalLeft}`;
  console.log("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");

  // ---------------------------------------------------------------------------
  // 2) Build left-side cells (data columns)
  // ---------------------------------------------------------------------------
  let leftHTML = '';
  if (left1 != null) leftHTML += `<div class="wow2-hcell">${left1}</div>`;
  if (left2 != null) leftHTML += `<div class="wow2-hcell">${left2}</div>`;
  if (left3 != null) leftHTML += `<div class="wow2-hcell">${left3}</div>`;
  if (left4 != null) leftHTML += `<div class="wow2-hcell">${left4}</div>`;
  if (left5 != null) leftHTML += `<div class="wow2-hcell">${left5}</div>`;

  // ---------------------------------------------------------------------------
  // 3) Append ACTION cell (play icon)
  // ---------------------------------------------------------------------------
  const et  = (iconData.entityType ?? '').toString();
  const eid = (iconData.entityId   ?? '').toString();
  const tab = (iconData.tab        ?? '').toString();

  const actionCell = `
    <div class="wow2-hcell wow2-hcell--action">
      <button
        class="wow2-action-icon wow2-action-icon--play wow2-row-menu"
        aria-label="פעולות"
        data-entity-type="${et}"
        data-entity-id="${eid}"
        data-entity-tab="${tab}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M10 8l6 4-6 4z"></path>
        </svg>
      </button>
    </div>
  `;

  leftHTML += actionCell;

  // ---------------------------------------------------------------------------
  // 4) Combine all pieces into full row (darker tone)
  // ---------------------------------------------------------------------------
  return `
    <div class="wow2-strip wow2-strip--darker" data-tone="${tone}">
      <div class="wow2-strip-right">
        <div class="wow2-name">${rightText}</div>
      </div>

      <div class="${leftCls}">
        ${leftHTML}
      </div>
    </div>
  `;
}




















// ============================================================================
// ==================  INPUT STRIP ============================================
// ============================================================================
//
// PARAMETERS:
// ----------
// id          : string   → unique HTML ID for the input element
// label       : string   → text label to show to the left of the input
// required    : boolean  → whether to mark the field as required (adds a ★ symbol)
// placeholder : string   → placeholder text inside the input field
// value       : string   → prefilled value for the input field
//
// STYLE NOTES:
// ------------
// • .wow2-flexrow → flex container, aligns label and control side by side
// • .wow2-card-rail → gives horizontal padding and structure
// • .wow2-formlabel → styles label text
// • .wow2-formcontrol → wraps the <input>
// • .wow2-input → the actual text field style
// • .wow2-req → small star (★) used to mark required fields visually
//
// ============================================================================

// ---------------------------------------------------------------------------
// NORMAL INPUT — wow2 standard background
// ---------------------------------------------------------------------------
function renderFlexFormInput_wow2({ id, label, required = false, placeholder = '', value = '' }) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  return (
    '<div class="wow2-flexrow wow2-card-rail">' +
      '<label class="wow2-formlabel" for="' + id + '">' +
        req + '<span>' + label + '</span>' +
      '</label>' +
      '<div class="wow2-formcontrol">' +
        '<input id="' + id + '" class="wow2-input" type="text" placeholder="' + placeholder + '" value="' + value + '">' +
      '</div>' +
    '</div>'
  );
}

// ---------------------------------------------------------------------------
// DARKER INPUT — identical layout, different background (wow2-bg-darker)
// ---------------------------------------------------------------------------
function renderFlexFormInput_wow2_darker({ id, label, required = false, placeholder = '', value = '' }) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  return (
    '<div class="wow2-flexrow wow2-card-rail">' +
      '<label class="wow2-formlabel" for="' + id + '">' +
        req + '<span>' + label + '</span>' +
      '</label>' +
      '<div class="wow2-formcontrol">' +
        '<input id="' + id + '" class="wow2-input wow2-input--darker" type="text" placeholder="' + placeholder + '" value="' + value + '">' +
      '</div>' +
    '</div>'
  );
}



// ---------------------------------------------------------------------------
// ROW STRIP — reusable table row generator (mirrors header strip structure)
// ---------------------------------------------------------------------------

function buildRowStrip_wow2(
  tone = 'warm',
  rightText, numOfLeft,
  left1, left2 = null, left3 = null, left4 = null, left5 = null, left6 = null
) {
  const leftCls = `wow2-strip-left wow2-strip-left-${numOfLeft}`;

  console.log("2-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");




  let leftHTML = '';
  if (left1) leftHTML += `<div class="wow2-hcell">${left1}</div>`;
  if (left2) leftHTML += `<div class="wow2-hcell">${left2}</div>`;
  if (left3) leftHTML += `<div class="wow2-hcell">${left3}</div>`;
  if (left4) leftHTML += `<div class="wow2-hcell">${left4}</div>`;
  if (left5) leftHTML += `<div class="wow2-hcell">${left5}</div>`;
  if (left6) leftHTML += `<div class="wow2-hcell wow2-hcell--action">${left6}</div>`;

  return `
    <div class="wow2-strip" data-tone="${tone}">
      <div class="wow2-strip-right">
        <div class="wow2-name">${rightText}</div>   <!-- CHANGED -->
      </div>
      <div class="${leftCls}">
        ${leftHTML}
      </div>
    </div>
  `;
}








// ============================================================================
// ============================================================================
// =======================      RADIO INPUT STRIP     =========================
// ============================================================================
// ============================================================================



// ------------------- DARK VERSION + ON CHANGE CALLBACK ----------------------

function renderFlexFormRadio_wow2({
  id,
  label,
  required = false,
  options = [],
  value = '',
  name,
  onChange = null            // ✅ NEW (string: global function name)
}) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  const groupName = name || id;

  const optsHTML = options.map(o => {
    const checked = (o.value === value) ? 'checked' : '';
    return (
      '<label class="wow2-radio-label">' +
        '<input type="radio" name="' + groupName + '" value="' + o.value + '" ' + checked + '>' +
        '<span>' + o.label + '</span>' +
      '</label>'
    );
  }).join('');

  // data-onchange lets us find and call a global handler
  const hookAttr = onChange ? (' data-onchange="' + onChange + '"') : '';

  return (
    '<div class="wow2-flexrow wow2-card-rail">' +
      '<label class="wow2-formlabel" for="' + id + '">' +
        req + '<span>' + label + '</span>' +
      '</label>' +
      '<div class="wow2-formcontrol">' +
        '<div id="' + id + '" class="wow2-radio-group"' + hookAttr + '>' +
          optsHTML +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

// ----------------------- RADIO STRIP ON CHANGE CALLBACK -----------------------
(function initWow2RadioDelegation(){
  if (window.__wow2_radio_hooked) return;
  window.__wow2_radio_hooked = true;

  document.addEventListener('change', function(e){
    console.log("HHHHHHHHHHHHHHHHHHHHHHHHHHHHH");
    const input = e.target;
    if (!input || input.type !== 'radio') return;

    const wrapper = input.closest('.wow2-radio-group[data-onchange]');
    if (!wrapper) return;

    const fnName = wrapper.dataset.onchange;
    const fn     = fnName && window[fnName];
    if (typeof fn === 'function') {
      fn(input.value, { name: input.name, groupId: wrapper.id, input });
    }
  }, true);
})();




// ---------------------------- DARK VERSION + NO CHANGE CALLBACK -------------------------------
/*
function renderFlexFormRadio_wow2({ id, label, required = false, options = [], value = '', name }) {
  
  // Add required star (★) only when requested
  const req = required ? '<span class="wow2-req">★</span>' : '';
  
  // Group name for all radio inputs (shared "name" attribute)
  // If "name" not passed, fallback to ID so group still works
  const groupName = name || id;

  // Build each radio option element dynamically
  // If the option's value matches current value → mark as checked
  const optsHTML = options.map(function(o){
    const checked = (o.value === value) ? 'checked' : '';
    return (
      '<label class="wow2-radio-label">' +
        '<input type="radio" name="' + groupName + '" value="' + o.value + '" ' + checked + '>' +
        '<span>' + o.label + '</span>' +
      '</label>'
    );
  }).join('');

  // Return the full HTML structure for the radio row
  // This variant uses the base .wow2-radio-group (darker background)
  return (
    '<div class="wow2-flexrow wow2-card-rail">' +
      // Left-side label cell
      '<label class="wow2-formlabel" for="' + id + '">' +
        req + '<span>' + label + '</span>' +
      '</label>' +

      // Right-side form control cell
      '<div class="wow2-formcontrol">' +
        // Radio group container (default darker tone)
        '<div id="' + id + '" class="wow2-radio-group">' + optsHTML + '</div>' +
      '</div>' +
    '</div>'
  );
}
*/


// ---------------------------- DARK VERSION + NO CHANGE CALLBACK -------------------------------
function renderFlexFormRadio_wow2_dark({ id, label, required = false, options = [], value = '', name }) {
  
  // Required star marker
  const req = required ? '<span class="wow2-req">★</span>' : '';

  // Shared name group logic
  const groupName = name || id;

  // Build radio buttons with checked state
  const optsHTML = options.map(function(o){
    const checked = (o.value === value) ? 'checked' : '';
    return (
      '<label class="wow2-radio-label">' +
        '<input type="radio" name="' + groupName + '" value="' + o.value + '" ' + checked + '>' +
        '<span>' + o.label + '</span>' +
      '</label>'
    );
  }).join('');

  // Return full structure with the dark modifier class
  // The modifier changes only the background style of the group
  return (
    '<div class="wow2-flexrow wow2-card-rail">' +
      '<label class="wow2-formlabel" for="' + id + '">' +
        req + '<span>' + label + '</span>' +
      '</label>' +
      '<div class="wow2-formcontrol">' +
        // Modifier adds .wow2-radio-group--dark
        '<div id="' + id + '" class="wow2-radio-group wow2-radio-group--dark">' + optsHTML + '</div>' +
      '</div>' +
    '</div>'
  );
}



// ============================================================================
// ============================================================================
// =====================      TEXTAREA INPUT STRIP     ========================
// ============================================================================
// ============================================================================


// ---------------------------------------------------------------------------
// TEXTAREA — normal (wow2 standard background)
// ---------------------------------------------------------------------------
function renderFlexFormTextarea_wow2({
  id,
  label,
  required = false,
  placeholder = '',
  value = '',
  rows = 4
}) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  const safeVal = (value ?? '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return (
    '<div class="wow2-flexrow wow2-card-rail">' +
      '<label class="wow2-formlabel" for="' + id + '">' +
        req + '<span>' + label + '</span>' +
      '</label>' +
      '<div class="wow2-formcontrol">' +
        '<textarea id="' + id + '" class="wow2-input" ' +
          'placeholder="' + placeholder + '" rows="' + rows + '">' +
            safeVal +
        '</textarea>' +
      '</div>' +
    '</div>'
  );
}

// ---------------------------------------------------------------------------
// TEXTAREA — darker (wow2-bg-darker background)
// ---------------------------------------------------------------------------
function renderFlexFormTextarea_wow2_darker({
  id,
  label,
  required = false,
  placeholder = '',
  value = '',
  rows = 4
}) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  const safeVal = (value ?? '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return (
    '<div class="wow2-flexrow wow2-card-rail">' +
      '<label class="wow2-formlabel" for="' + id + '">' +
        req + '<span>' + label + '</span>' +
      '</label>' +
      '<div class="wow2-formcontrol">' +
        '<textarea id="' + id + '" class="wow2-input wow2-input--darker" ' +
          'placeholder="' + placeholder + '" rows="' + rows + '">' +
            safeVal +
        '</textarea>' +
      '</div>' +
    '</div>'
  );
}



// ============================================================================
// WOW2 — Upload Button Strip (DIV instead of <button> to avoid Elementor styles)
// ============================================================================

function renderUploadButtonStrip_wow2({ id, label = 'העלאת קובץ', buttonLabel = 'בחר קובץ', required = false }) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  return (
    // Same strip layout as inputs: label on the right, control on the left
    '<div class="wow2-flexrow wow2-card-rail">' +

      // Label cell
      '<label class="wow2-formlabel" for="' + id + '">' +
        req + '<span>' + label + '</span>' +
      '</label>' +

      // Control cell: use a DIV styled like a button (no <button>, no type=button)
      '<div class="wow2-formcontrol">' +
        '<div id="' + id + '" class="wow2-btn wow2-btn--warm" role="button" tabindex="0">' +
          buttonLabel +
        '</div>' +
      '</div>' +

    '</div>'
  );
}

// ---------------------------------------------------------------------------
// UPLOAD BUTTON STRIP — normal background
// ---------------------------------------------------------------------------
function renderUploadButtonStrip3_wow2({ id, label = 'העלאת קובץ', buttonLabel = 'בחר קובץ', required = false }) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  return (
    '<div class="wow2-flexrow wow2-card-rail">' +
      '<label class="wow2-formlabel" for="' + id + '">' +
        req + '<span>' + label + '</span>' +
      '</label>' +
      '<div class="wow2-formcontrol">' +
        '<button id="' + id + '"  class="wow2-btn wow2-btn--warm">' +
          buttonLabel +
        '</button>' +
      '</div>' +
    '</div>'
  );
}


// ---------------------------------------------------------------------------
// UPLOAD BUTTON STRIP — darker background
// ---------------------------------------------------------------------------
function renderUploadButtonStrip_wow2_darker({ id, label = 'העלאת קובץ', buttonLabel = 'בחר קובץ', required = false }) {
  const req = required ? '<span class="wow2-req">★</span>' : '';
  return (
    '<div class="wow2-flexrow wow2-card-rail">' +
      '<label class="wow2-formlabel" for="' + id + '">' +
        req + '<span>' + label + '</span>' +
      '</label>' +
      '<div class="wow2-formcontrol">' +
        '<button id="' + id + '"  class="wow2-btn wow2-btn--fresh">' +
          buttonLabel +
        '</button>' +
      '</div>' +
    '</div>'
  );
}





// ============================================================================
// ============================================================================
// =======================      THE AWARE BUTTON     ==========================
// ============================================================================
// ============================================================================
// ============================================================================
// WOW2 — Aware Button helpers
// Create once (config), render as inert HTML, then switch on/off after mount.
// Usage:
//   const activateBtn = createAwareButton('left', 'הפעל אלמנט', ElementVerifiedForActivation, {styleOn:'fresh'});
//   modal.innerHTML += renderAwareBtn(false, activateBtn); // inert (disabled, grey border)
//   // after modal is in DOM:
//   switchAwareButton(true, activateBtn);  // enable + attach listener + fresh/warm style
// ============================================================================

(function(){
  var __awareCounter = 0;

  function uid(prefix) {
    __awareCounter += 1;
    return (prefix || 'aware') + '_' + Date.now() + '_' + __awareCounter;
  }

  // side: 'left' | 'right'
  // label: string
  // onClick: function(e)
  // opts: { styleOn: 'fresh' | 'warm' | 'ghost' }
  window.createAwareButton = function(side, label, onClick, opts) {
    var id     = uid('btn');
    var strip  = uid('strip');
    var styleOn = (opts && opts.styleOn) ? String(opts.styleOn) : 'fresh';

    return {
      id: id,
      stripId: strip,
      side: (side === 'right' ? 'right' : 'left'),
      label: label || '',
      onClick: onClick,
      styleOn: styleOn // 'fresh' or 'warm' etc.
    };
  };

  // Returns inert HTML (disabled, grey border). You can inject this into modal.innerHTML.
  window.renderAwareBtn = function(enabled, aware) {
    var sideClass = 'wow2-btnstrip--' + (aware.side || 'left');
    var btnClass  = 'wow2-btn ' + (enabled ? ('wow2-btn--' + aware.styleOn) : 'wow2-btn--ghost');
    var extraDisabled = enabled ? '' : 'disabled';
    var greyStyle = enabled ? '' : ' style="border-color:#6b7280;"'; // Tailwind gray-500-ish

    return ''
      + '<div id="' + aware.stripId + '" class="wow2-btnstrip ' + sideClass + '">'
      + '  <button id="' + aware.id + '" class="' + btnClass + '" ' + extraDisabled + greyStyle + '>'
      +        escapeHtml(aware.label)
      + '  </button>'
      + '</div>';
  };

  // Toggle listener + visual style (fresh/warm when ON; ghost + grey border when OFF)
  // isOn: boolean
  // aware: object from createAwareButton
  // styleOnOverride: optional 'fresh' | 'warm' | 'ghost'
  window.switchAwareButton = function(isOn, aware, styleOnOverride) {
    var btn = document.getElementById(aware.id);
    if (!btn) return;

    // Remove any previous listener
    if (btn.__awareHandler) {
      btn.removeEventListener('click', btn.__awareHandler);
      btn.__awareHandler = null;
    }

    // Classes base
    btn.className = 'wow2-btn';

    if (isOn) {
      var styleOn = styleOnOverride || aware.styleOn || 'fresh';
      btn.className += ' wow2-btn--' + styleOn;
      btn.disabled = false;
      btn.style.borderColor = '';

      // Attach listener
      var handler = function(e){
        try {
          if (typeof aware.onClick === 'function') {
            aware.onClick(e);
          }
        } catch (err) {
          console.error('[aware-btn] onClick error:', err);
        }
      };
      btn.addEventListener('click', handler);
      btn.__awareHandler = handler;
    } else {
      btn.className += ' wow2-btn--ghost';
      btn.disabled = true;
      btn.style.borderColor = '#6b7280'; // grey
    }
  };

  // Safe text helper
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
})();






// ============================================================================
// ============================================================================
// ============      THE TITLE WITH BUTTON STRIP     ==========================
// ============================================================================
// ============================================================================
// ============================================================================
// WOW2 — Render Title with Close Button
// Creates a header strip with:
// - Large page title aligned to the RIGHT
// - Small X button (warm border) aligned to the LEFT
// - Click on the button runs the provided callback
// ============================================================================

// ============================================================================
// WOW2 — Render Title with Close Button (Updated for 24×24 button)
// ============================================================================
function renderTitleWithCloseButton(titleText, onCloseCallback) {
  // Create the container strip
  const strip = document.createElement('div');
  strip.className = 'wow2-btnstrip wow2-btnstrip--right wow2-mb-m';
  strip.style.alignItems = 'center';
  strip.style.justifyContent = 'space-between';

  // Title (right side)
  const title = document.createElement('div');
  title.className = 'wow2-title-l';
  title.textContent = titleText || '';

  // Close button (left side, 24×24px)
  const btn = document.createElement('button');
  btn.className = 'wow2-btn wow2-btn--ghost';
  btn.style.borderColor = 'var(--wow2-warm-border, #d97706)';
  btn.style.width = '24px';
  btn.style.height = '24px';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.padding = '0';
  btn.style.lineHeight = '1';
  btn.style.fontSize = '16px';
  btn.style.marginLeft = '10px';
  btn.style.borderRadius = '2px';

  // Close icon
  btn.textContent = '×';

  // Connect callback
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    if (typeof onCloseCallback === 'function') {
      onCloseCallback();
    }
  });

  // Append both to strip (title on right, button on left)
  strip.appendChild(title);
  strip.appendChild(btn);

  // Return HTML string for modal template
  return strip.outerHTML;
}


/*
function renderTitleWithCloseButton(titleText, onCloseCallback) {
  // Create the container strip
  const strip = document.createElement('div');
  strip.className = 'wow2-btnstrip wow2-btnstrip--right wow2-mb-m';
  strip.style.alignItems = 'center';
  strip.style.justifyContent = 'space-between';

  // Title (right side)
  const title = document.createElement('div');
  title.className = 'wow2-title-l';
  title.textContent = titleText || '';

  // Close button (left side, warm border)
  const btn = document.createElement('button');
  btn.className = 'wow2-btn wow2-btn--ghost';
  btn.style.borderColor = 'var(--wow2-warm-border, #d97706)'; // fallback warm tone
  btn.textContent = '×'; // small X
  btn.style.fontSize = '18px';
  btn.style.padding = '2px 8px';
  btn.style.lineHeight = '1';
  btn.style.marginLeft = '10px';

  // Connect callback
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    if (typeof onCloseCallback === 'function') {
      onCloseCallback();
    }
  });

  // Append both to strip (title on right, button on left)
  strip.appendChild(title);
  strip.appendChild(btn);

  // Return the full HTML string (for your modal template)
  return strip.outerHTML;
}

*/




// ============================================================================
// ============================================================================
// ============      SUMMARY STRIP     ==========================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// ============================================================================
// WOW2 — Summary Strip (warm ring, RTL, star on the RIGHT)
// • Star on the right (tiny), label: white / bold / 14px
// • Value on the left in light gray, or red error message
// • Uses the warm gradient ring from .wow2-strip
// ============================================================================

function renderSummaryStrip(label, isOk, value) {
  const starOk   = 'var(--wow2-success, #89d957)';
  const starErr  = 'var(--wow2-error,   #ff3131)';
  const starClr  = isOk ? starOk : starErr;

  // Right column: STAR (first → appears on the RIGHT in RTL) + LABEL
  const right =
    '<div class="wow2-strip-right" ' +
        'style="display:flex;align-items:center;justify-content:flex-start;gap:6px;text-align:right;">' +
      '<span class="wow2-req" style="color:' + starClr + ';font-size:8px;line-height:1;">★</span>' +
      '<span class="wow2-label" style="color:var(--wow2-text-white);font-size:14px;font-weight:800;">' +
        escapeHtml(label) +
      '</span>' +
    '</div>';

  // Left column: value (light) or error (red)
  let leftInner;
  if (isOk) {
    leftInner =
      '<span style="display:block;width:100%;' +
                   'color:var(--wow2-text-light);font-size:14px;">' +
        escapeHtml(value == null ? '' : String(value)) +
      '</span>';
  } else {
    const dot = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;' +
                'background:var(--wow2-error,#ff3131);margin:0 6px;vertical-align:middle;"></span>';
    leftInner =
      '<span style="display:block;width:100%;text-align:left;' +
                   'color:var(--wow2-error,#ff3131);font-size:14px;">' +
        'יש למלא שדה זה ' + dot +
      '</span>';
  }

  // Flexible left column (no fixed 50px cells → supports long values)
  const left =
    '<div class="wow2-strip-left" ' +
         'style="display:flex;align-items:center;justify-content:flex-end;min-width:0;">' +
      leftInner +
    '</div>';


  // Warm ring + RTL layout from .wow2-strip
  return (
    '<div class="wow2-strip wow2-strip--summary wow2-card-rail" style="direction:rtl;">' +
      right +
      left +
    '</div>'
  );
}


/*
function renderSummaryStrip(label, isOk, value) {
  var starColorOk   = 'var(--wow2-fresh, #22c55e)';  // green fallback
  var starColorErr  = 'var(--wow2-alert, #ef4444)';  // red fallback
  var starStyle     = 'display:inline-block;margin-inline-start:8px;font-size:14px;';
  var starHtml      = '<span class="wow2-req" style="' + starStyle + 'color:' + (isOk ? starColorOk : starColorErr) + '">★</span>';

  // Right side: label + colored star
  var titleHtml =
    '<div class="wow2-strip-title">' +
      '<span class="wow2-title-strong">' + escapeHtml(label) + '</span>' +
      starHtml +
    '</div>';

  // Left side: value (ok) OR error note (missing)
  var cellsHtml;
  if (isOk) {
    cellsHtml =
      '<div class="wow2-strip-cells">' +
        '<div class="wow2-chip">' + escapeHtml(value == null ? '' : String(value)) + '</div>' +
      '</div>';
  } else {
    // red dot inline (no extra CSS required)
    var dot = '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--wow2-alert,#ef4444);margin:0 6px;vertical-align:middle;"></span>';
    cellsHtml =
      '<div class="wow2-strip-cells">' +
        '<div class="wow2-chip wow2-chip--alert" style="background:transparent;border-color:var(--wow2-alert,#ef4444);color:var(--wow2-alert,#ef4444)">' +
          'יש למלא שדה זה ' + dot +
        '</div>' +
      '</div>';
  }

  // Wrapper
  return (
    '<div class="wow2-strip">' +
      titleHtml +
      cellsHtml +
    '</div>'
  );
}

// Small helper (already used elsewhere in your code)
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}


*/




// ============================================================================
// ============================================================================
// =========      TICKET | VOUCHER | POST summary cards     ===================
// ============================================================================
// ============================================================================
// ============================================================================
// WOW2 — renderTicketCard(ticket)
// Creates a single ticket summary card for the activation modal.
// ============================================================================

function renderTicketCard(ticket) {
  if (!ticket) return '';

  return (
    '<div class="wow2-card wow2-card-rail wow2-mb-m" ' +
      'style="border:1px solid var(--wow2-fresh-1); border-radius:var(--wow2-radius-sm); padding:10px 12px;">' +

      '<div class="wow2-flexcol" style="gap:6px;">' +
        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px; font-weight:800; color:var(--wow2-text-white);">שם סוג הכרטיס:</span>' +
          '<span style="font-size:12px; color:var(--wow2-text-light);">' + escapeHtml(ticket.name) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px; font-weight:800; color:var(--wow2-text-white);">סוג הכרטיס:</span>' +
          '<span style="font-size:12px; color:var(--wow2-text-light);">' + escapeHtml(ticket.kind) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px; font-weight:800; color:var(--wow2-text-white);">מינימום גודל קבוצה:</span>' +
          '<span style="font-size:12px; color:var(--wow2-text-light);">' + escapeHtml(ticket.group_min) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px; font-weight:800; color:var(--wow2-text-white);">מקסימום גודל קבוצה:</span>' +
          '<span style="font-size:12px; color:var(--wow2-text-light);">' + escapeHtml(ticket.group_max) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px; font-weight:800; color:var(--wow2-text-white);">מקסימום למכירה מסוג זה:</span>' +
          '<span style="font-size:12px; color:var(--wow2-text-light);">' + escapeHtml(ticket.max_for_sale) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px; font-weight:800; color:var(--wow2-text-white);">מחיר לאדם (ש"ח):</span>' +
          '<span style="font-size:12px; color:var(--wow2-text-light);">' + escapeHtml(ticket.price_per_person) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px; font-weight:800; color:var(--wow2-text-white);">טקסט על הכרטיס:</span>' +
          '<span style="font-size:12px; color:var(--wow2-text-light);">' + escapeHtml(ticket.ticket_text) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}


/*

function renderTicketCard(ticket) {
  if (!ticket) return '';

  return (
    '<div class="wow2-card wow2-card-rail wow2-mb-m">' +
      '<div class="wow2-flexcol">' +

        '<div class="wow2-flexrow"><span class="wow2-title-strong">שם סוג הכרטיס:</span><span class="wow2-req">★</span><span>' + escapeHtml(ticket.name) + '</span></div>' +
        '<div class="wow2-flexrow"><span class="wow2-title-strong">סוג הכרטיס:</span><span class="wow2-req">★</span><span>' + escapeHtml(ticket.kind) + '</span></div>' +
        '<div class="wow2-flexrow"><span class="wow2-title-strong">מינימום גודל קבוצה:</span><span class="wow2-req">★</span><span>' + escapeHtml(ticket.group_min) + '</span></div>' +
        '<div class="wow2-flexrow"><span class="wow2-title-strong">מקסימום גודל קבוצה:</span><span class="wow2-req">★</span><span>' + escapeHtml(ticket.group_max) + '</span></div>' +
        '<div class="wow2-flexrow"><span class="wow2-title-strong">מקסימום למכירה מסוג זה:</span><span class="wow2-req">★</span><span>' + escapeHtml(ticket.max_for_sale) + '</span></div>' +
        '<div class="wow2-flexrow"><span class="wow2-title-strong">מחיר לאדם (ש"ח):</span><span class="wow2-req">★</span><span>' + escapeHtml(ticket.price_per_person) + '</span></div>' +
        '<div class="wow2-flexrow"><span class="wow2-title-strong">טקסט על הכרטיס:</span><span>' + escapeHtml(ticket.ticket_text) + '</span></div>' +

      '</div>' +
    '</div>'
  );
}
*/
// ============================================================================
// WOW2 — renderPostCard(post)
// Creates a single post summary card for the activation modal.
// ============================================================================


// ============================================================================
// WOW2 — renderVoucherCard(voucher)
// Creates a voucher summary card for activation modal (dark WOW2 UI)
// ============================================================================
function renderVoucherCard(voucher) {
  if (!voucher) return '';

  return (
    '<div class="wow2-card wow2-card-rail wow2-mb-m" ' +
      'style="border:1px solid var(--wow2-fresh-1); border-radius:var(--wow2-radius-sm); padding:10px 12px;">' +

      '<div class="wow2-flexcol" style="gap:6px;">' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">שם הוואוצ׳ר:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + escapeHtml(voucher.name) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">קטגוריה:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + escapeHtml(voucher.category) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">סוג שימוש:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + escapeHtml(voucher.usage_type) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">כמות כלולה:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + escapeHtml(voucher.included_qty) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">מחיר לאדם (ש"ח):</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + escapeHtml(voucher.price_per_person) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">מגבלת משתתף:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + (voucher.per_participant_max ? escapeHtml(voucher.per_participant_max) : '-') + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">מגבלת משבצת זמן:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + (voucher.per_time_slot_cap ? escapeHtml(voucher.per_time_slot_cap) : '-') + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">טקסט הוואוצ׳ר:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + (voucher.voucher_text ? escapeHtml(voucher.voucher_text) : '-') + '</span>' +
        '</div>' +

      '</div>' +
    '</div>'
  );
}

function renderPostCard(post) {
  if (!post) return '';

  return (
    '<div class="wow2-card wow2-card-rail wow2-mb-m" ' +
      'style="border:1px solid var(--wow2-fresh-1); border-radius:var(--wow2-radius-sm); padding:10px 12px;">' +

      '<div class="wow2-flexcol" style="gap:6px;">' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">כותרת:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + escapeHtml(post.title) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">סוג:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + escapeHtml(post.kind) + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">קובץ מצורף:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + (post.media_id ? 'תמונה / וידאו' : '-') + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">טקסט:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + (post.body_text ? escapeHtml(post.body_text) : '-') + '</span>' +
        '</div>' +

        '<div class="wow2-flexrow" style="justify-content:space-between;">' +
          '<span style="font-size:14px;font-weight:800;color:var(--wow2-text-white);">לינק:</span>' +
          '<span style="font-size:12px;color:var(--wow2-text-light);">' + (post.link_url ? escapeHtml(post.link_url) : '-') + '</span>' +
        '</div>' +

      '</div>' +
    '</div>'
  );
}


// ============================================================================
// Simple escape helper (used across all renderers)
// ============================================================================
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}




// ============================================================================
// ============================================================================
// ===================      RENDER ERROR NOTE     =============================
// ============================================================================
// ============================================================================
function renderErrorNote(text, tone = 'warm') {
  const colorMap = {
    warm:  'var(--wow2-warm, #d97706)',   // amber/orange tone
    fresh: 'var(--wow2-fresh, #22c55e)',  // green tone
    ghost: 'var(--wow2-border, #6b7280)'  // neutral gray
  };

  const color = colorMap[tone] || colorMap.warm;

  return (
    '<div class="wow2-note wow2-mt-s" ' +
    'style="color:' + color + '; border-color:' + color + ';">' +
      escapeHtml(text || '') +
    '</div>'
  );
}

// ============================================================================
// ============================================================================
// ===================      RENDER LABEL   =============================
// ============================================================================
// ============================================================================
// ============================================================================
// WOW2 — Render Label (12px variant)
// Creates a simple right-aligned label line with tone color
// tone = 'warm' | 'fresh' | 'ghost'
// ============================================================================
function renderLabel(text, tone = 'warm') {
  const colorMap = {
    warm:  'var(--wow2-warm, #d97706)',   // amber/orange tone
    fresh: 'var(--wow2-fresh, #22c55e)',  // green tone
    ghost: 'var(--wow2-border, #6b7280)'  // neutral gray
  };

  const color = colorMap[tone] || colorMap.warm;

  return (
    '<div class="wow2-label wow2-font-m" ' +
      'style="font-size:14px; color:' + color + '; margin-bottom:0px; text-align:right;">' +
      escapeHtml(text || '') +
    '</div>'
  );
}

// ============================================================================
// ============================================================================
// =======================      THE TERM STRIP    =============================
// ============================================================================
// ============================================================================

// ============================================================================
// UI ELEMENTS FILE — renderTermStrip (FINAL)
// One card: right-aligned title, paragraph, red/green pill + toggle
// index: 1..N (for unique ids), defaultChecked: boolean
// ============================================================================

function renderTermStrip(index, title, text, defaultChecked) {
  const id = Number(index);
  const on  = !!defaultChecked;
  const clr = on ? 'var(--wow2-fresh,#22c55e)' : 'var(--wow2-alert,#ef4444)';
  const lbl = on ? 'מאשר/ת' : 'לא מאשר/ת';

  return (
    '<div class="wow2-card wow2-card-rail wow2-mb-m">' +
      '<div class="wow2-flexcol">' +

        // Title (right)
        '<div class="wow2-flexrow wow2-mb-s" style="justify-content:flex-start;">' +
       '<span class="--wow2-size-label" style="color:var(--wow2-text-white);">' +
       escapeHtml(title) + ':</span>' +
       '</div>' +


        // Paragraph
        '<div class="wow2-flexrow wow2-mb-s">' +
          '<div class="wow2-body-s" style="opacity:.9;line-height:1.6;">' + escapeHtml(text) + '</div>' +
        '</div>' +

        // Toggle row (left): label • pill • dot • switch
        '<div class="wow2-flexrow" style="align-items:center;justify-content:flex-start;gap:10px;">' +
          '<span class="wow2-body-s">האם לאשר סעיף זה</span>' +

          '<span id="wow2_term_pill_' + id + '" class="wow2-chip" ' +
                'style="background:transparent;border-color:' + clr + ';color:' + clr + ';">' +
              lbl +
          '</span>' +

          '<span id="wow2_term_dot_' + id + '" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + clr + ';margin-inline-start:2px;"></span>' +
/*
          '<label class="wow2-switch" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;">' +
            '<input id="wow2_term_cb_' + id + '" type="checkbox" ' + (on ? 'checked ' : '') + 'style="display:none;">' +
            '<span class="wow2-toggle" ' +
                  'style="width:34px;height:18px;border-radius:999px;display:inline-block;position:relative;border:1px solid #666;background:rgba(255,255,255,.06);">' +
              '<span style="position:absolute;top:1px;left:' + (on ? '18px' : '2px') + ';width:14px;height:14px;border-radius:999px;background:' + clr + ';transition:left .15s ease;"></span>' +
            '</span>' +
          '</label>' +
*/
// inside renderTermStrip, in the toggle HTML:
'<label class="wow2-switch" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;">' +
  '<input id="wow2_term_cb_' + id + '" type="checkbox" ' + (on ? 'checked ' : '') + 'style="display:none;">' +
  '<span id="wow2_term_track_' + id + '" class="wow2-toggle" ' +
        'style="width:34px;height:18px;border-radius:999px;display:inline-block;position:relative;' +
               'border:1px solid #666;background:rgba(255,255,255,.06);">' +
    '<span id="wow2_term_knob_' + id + '" ' +
          'style="position:absolute;top:1px;left:' + (on ? '18px' : '2px') + ';width:14px;height:14px;border-radius:999px;' +
                 'background:' + clr + ';transition:left .15s ease, background .15s ease;"></span>' +
  '</span>' +
'</label>' +





        '</div>' +
      '</div>' +
    '</div>'
  );
}







