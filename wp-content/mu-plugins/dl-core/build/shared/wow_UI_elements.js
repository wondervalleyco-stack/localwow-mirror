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
// Header strip — standard (dark background)
// ---------------------------------------------------------------------------
function buildHeaderStrip_wow2(
  rightLabel, numOfLeft,
  left1, left2 = null, left3 = null, left4 = null, left5 = null, left6 = null
) {
  const leftCls = `wow2-strip-left wow2-strip-left-${numOfLeft}`;
  let leftHTML = '';
  if (left1) leftHTML += `<div class="wow2-hcell">${left1}</div>`;
  if (left2) leftHTML += `<div class="wow2-hcell">${left2}</div>`;
  if (left3) leftHTML += `<div class="wow2-hcell">${left3}</div>`;
  if (left4) leftHTML += `<div class="wow2-hcell">${left4}</div>`;
  if (left5) leftHTML += `<div class="wow2-hcell">${left5}</div>`;
  if (left6) leftHTML += `<div class="wow2-hcell wow2-hcell--action">${left6}</div>`;

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
  left1, left2 = null, left3 = null, left4 = null, left5 = null, left6 = null
) {
  const leftCls = `wow2-strip-left wow2-strip-left-${numOfLeft}`;
  let leftHTML = '';
  if (left1) leftHTML += `<div class="wow2-hcell">${left1}</div>`;
  if (left2) leftHTML += `<div class="wow2-hcell">${left2}</div>`;
  if (left3) leftHTML += `<div class="wow2-hcell">${left3}</div>`;
  if (left4) leftHTML += `<div class="wow2-hcell">${left4}</div>`;
  if (left5) leftHTML += `<div class="wow2-hcell">${left5}</div>`;
  if (left6) leftHTML += `<div class="wow2-hcell wow2-hcell--action">${left6}</div>`;

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
// ROW STRIP — reusable table row generator (mirrors header strip structure)
// ---------------------------------------------------------------------------

function buildRowStrip_wow2(
  tone = 'warm',
  rightText, numOfLeft,
  left1, left2 = null, left3 = null, left4 = null, left5 = null, left6 = null
) {
  const leftCls = `wow2-strip-left wow2-strip-left-${numOfLeft}`;

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
// RADIO INPUT RENDERERS — WOW2 STYLE SYSTEM
// Two variants for background tone:
// 1. renderFlexFormRadio_wow2()          → darker background  (default)
// 2. renderFlexFormRadio_wow2_dark()     → dark background    (lighter variant)
//
// Both return identical HTML structure except for the modifier class
// applied to the inner .wow2-radio-group container.
// ============================================================================


/* ============================================================================
   1) DARKER VARIANT  (default)
   ----------------------------------------------------------------------------
   • Background color: var(--wow2-bg-darker)
   • Used in most modals and container blocks to keep strong contrast
   • Class: .wow2-radio-group   (base style → darker background)
   ============================================================================ */
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



/* ============================================================================
   2) DARK VARIANT  (lighter background)
   ----------------------------------------------------------------------------
   • Background color: var(--wow2-bg-dark)
   • Same structure and parameters as above
   • Difference: adds modifier class .wow2-radio-group--dark
     which overrides the background variable in CSS
   ============================================================================ */
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




// =====================================================================================
// =================== STRIP TABLE FUNCTIONS ===========================================
// =====================================================================================


// ---------------------------------------------------------------------------
// ROW STRIP — reusable table row generator (mirrors header strip structure)
// ---------------------------------------------------------------------------


/**
 * buildRowStrip_wow2
 * -----------------------------------------------------------------------------
 * PURPOSE:
 *  Creates one full “row” inside a wow2-strip table.
 *  The row includes:
 *   - A right-side title (usually the ticket name)
 *   - N left-side data cells
 *   - 1 automatic “action” cell (round play icon with metadata)
 *
 * DESIGN CHOICE:
 *  The caller only specifies the **number of data cells** (`numOfLeft`),
 *  not counting the action column — the function adds it automatically.
 *
 * PARAMETERS:
 *  tone        → 'warm' | 'fresh' | etc. (defines gradient tone ring)
 *  rightText   → string for the right-side name/title
 *  numOfLeft   → number of data columns (excluding the action icon)
 *  iconData    → { entityType, entityId, tab } for openIconMenu()
 *  left1..left5→ optional data cell values (string or number)
 *
 * RETURNS:
 *  A complete HTML string representing one strip row.
 * -----------------------------------------------------------------------------
 */
function buildRowStrip_wow2(
  tone = 'warm',
  rightText,
  numOfLeft,
  iconData = {},               // { entityType, entityId, tab }
  left1, left2 = null, left3 = null, left4 = null, left5 = null
) {
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
        type="button"
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

/**
 * buildHeaderStrip
 * -----------------------------------------------------------------------------
 * Legacy WOW v1 header row (kept for backward compatibility)
 * Generates a table header with one right label and several left columns.
 * Automatically adds an “פעולות” (Actions) column as the last header cell.
 * -----------------------------------------------------------------------------
 */
function buildHeaderStrip(
  rightLabel,
  leftLabel1,
  leftLabel2 = null,
  leftLabel3 = null,
  leftLabel4 = null,
  leftLabel5 = null
) {
  let leftHTML = '';

  if (leftLabel1) leftHTML += `<div class="wow_hcell">${leftLabel1}</div>`;
  if (leftLabel2) leftHTML += `<div class="wow_hcell">${leftLabel2}</div>`;
  if (leftLabel3) leftHTML += `<div class="wow_hcell">${leftLabel3}</div>`;
  if (leftLabel4) leftHTML += `<div class="wow_hcell">${leftLabel4}</div>`;
  if (leftLabel5) leftHTML += `<div class="wow_hcell">${leftLabel5}</div>`;

  // Always add leftmost “Actions” label
  leftHTML += `<div class="wow_hcell wow_hcell--action">פעולות</div>`;

  return `
    <div class="wow_strip wow_strip--header">
      <div class="wow_strip_right">
        <div class="wow_hcell">${rightLabel}</div>
      </div>
      <div class="wow_strip_left">
        ${leftHTML}
      </div>
    </div>
  `;
}


/**
 * buildHeaderStrip_wow2
 * -----------------------------------------------------------------------------
 * Modern WOW2 version — uses wow2-strip styling and naming conventions.
 * Creates a header row with right + left cells.
 * Automatically appends an “פעולות” (Actions) column as the last left cell.
 * -----------------------------------------------------------------------------
 */
function buildHeaderStrip_wow2(
  rightLabel,
  leftLabel1,
  leftLabel2 = null,
  leftLabel3 = null,
  leftLabel4 = null,
  leftLabel5 = null
) {
  let leftHTML = '';

  if (leftLabel1) leftHTML += `<div class="wow2-hcell">${leftLabel1}</div>`;
  if (leftLabel2) leftHTML += `<div class="wow2-hcell">${leftLabel2}</div>`;
  if (leftLabel3) leftHTML += `<div class="wow2-hcell">${leftLabel3}</div>`;
  if (leftLabel4) leftHTML += `<div class="wow2-hcell">${leftLabel4}</div>`;
  if (leftLabel5) leftHTML += `<div class="wow2-hcell">${leftLabel5}</div>`;

  // Always append the “Actions” header cell
  leftHTML += `<div class="wow2-hcell wow2-hcell--action">פעולות</div>`;

  return `
    <div class="wow2-strip wow2-strip--header">
      <div class="wow2-strip-right">
        <div class="wow2-hcell">${rightLabel}</div>
      </div>
      <div class="wow2-strip-left">
        ${leftHTML}
      </div>
    </div>
  `;
}





/*





// ------------------- HEADER STRIP   --------------------------------------------------
function buildHeaderStrip(rightLabel, leftLabel1, leftLabel2 = null, leftLabel3 = null, leftLabel4 = null, leftLabel5 = null, leftLabel6 = null) {

  let leftHTML = '';

  if (leftLabel1) leftHTML += `<div class="wow_hcell">${leftLabel1}</div>`;
  if (leftLabel2) leftHTML += `<div class="wow_hcell">${leftLabel2}</div>`;
  if (leftLabel3) leftHTML += `<div class="wow_hcell">${leftLabel3}</div>`;
  if (leftLabel4) leftHTML += `<div class="wow_hcell">${leftLabel4}</div>`;
  if (leftLabel5) leftHTML += `<div class="wow_hcell">${leftLabel5}</div>`;
  if (leftLabel6) leftHTML += `<div class="wow_hcell wow_hcell--action">${leftLabel6}</div>`;

  return `
    <div class="wow_strip wow_strip--header">
      <div class="wow_strip_right">
        <div class="wow_hcell">${rightLabel}</div>
      </div>
      <div class="wow_strip_left">
        ${leftHTML}
      </div>
    </div>
  `;
}

function buildHeaderStrip_wow2(rightLabel, leftLabel1, leftLabel2 = null, leftLabel3 = null, leftLabel4 = null, leftLabel5 = null, leftLabel6 = null) {

  let leftHTML = '';

  if (leftLabel1) leftHTML += `<div class="wow2-hcell">${leftLabel1}</div>`;
  if (leftLabel2) leftHTML += `<div class="wow2-hcell">${leftLabel2}</div>`;
  if (leftLabel3) leftHTML += `<div class="wow2-hcell">${leftLabel3}</div>`;
  if (leftLabel4) leftHTML += `<div class="wow2-hcell">${leftLabel4}</div>`;
  if (leftLabel5) leftHTML += `<div class="wow2-hcell">${leftLabel5}</div>`;
  if (leftLabel6) leftHTML += `<div class="wow2-hcell wow2-hcell--action">${leftLabel6}</div>`;

  return `
    <div class="wow2-strip wow2-strip--header">
      <div class="wow2-strip-right">
        <div class="wow2-hcell">${rightLabel}</div>
      </div>
      <div class="wow2-strip-left">
        ${leftHTML}
      </div>
    </div>
  `;
}

*/

