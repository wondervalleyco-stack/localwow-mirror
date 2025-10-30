// ----------------------------------------------------------------------
// openCreateElementModal()
// ----------------------------------------------------------------------
// PURPOSE:
// 1. Open a simple POPUP
// 2. new element name + submit
// 3. On success opens a new element in the DB
// ----------------------------------------------------------------------
function openCreateElementModal() {
  closeCreateElementModal(); // ensure clean

  const modal = document.createElement('div');
  modal.id = 'wow_modal';
  modal.innerHTML = `
    <div class="wow_modal_backdrop"></div>
    <div class="wow_modal_panel wow_dash_container">
      <div class="wow_fat_h" style="margin-bottom:16px;">יצירת אלמנט חדש</div>

      <label class="wow_page_sub_header_h" style="display:block;margin-bottom:8px;">
        <span>שם האלמנט</span>
        <span style="color:#ff7a59;"> *</span>
      </label>

      <input id="wow_new_element_name" class="wow_input"
             placeholder="הכנס שם של האלמנט החדש" />

      <div class="wow_help_text">בחרו שם ייחודי. אם השם כבר קיים אצלכם — תצטרו לבחור מחדש.</div>

      <div style="margin-top:16px;">
        <button class="wow_btn_dash" id="wow_create_element_btn">
          <span class="wow_btn_dash_txt_h">צור אלמנט</span>
        </button>
        <button class="wow_btn_dash" id="wow_cancel_element_btn" style="margin-inline-start:8px;">
          <span class="wow_btn_dash_txt_h">בטל</span>
        </button>
      </div>

      <div id="wow_create_error" class="wow_error_text" style="display:none;margin-top:12px;"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const input = byId('wow_new_element_name');
  const btnCreate = byId('wow_create_element_btn');
  const btnCancel = byId('wow_cancel_element_btn');

  btnCancel.addEventListener('click', closeCreateElementModal);
  btnCreate.addEventListener('click', submitCreateElement);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitCreateElement(); });

  input.focus();
}

// ----------------------------------------------------------------------
// Close without Saving
// ----------------------------------------------------------------------
function closeCreateElementModal() {
  const m = byId('wow_modal');
  if (m) m.remove();
}

// ----------------------------------------------------------------------
// Close with Saving
// 1. check if name already exist in MyElementLibrary
// 2. if not save to DB and Refresh ELEMENTS TABLE
// ----------------------------------------------------------------------
async function submitCreateElement() 
{
  const name = (byId('wow_new_element_name')?.value || '').trim();
  const err = byId('wow_create_error');

  if (!name) 
    {
       err.style.display = 'block';
       err.textContent = 'נא להזין שם אלמנט.';
       return;
    }

  err.style.display = 'none';

  // --------    check uniqueness in MyElementLibrary   ----------
  if (window.MyElementLibrary && window.MyElementLibrary.length > 0) 
    {
       const duplicate = window.MyElementLibrary.some(el => el.elementName?.trim().toLowerCase() === name.toLowerCase());
       if (duplicate) 
        {
           err.style.display = 'block';
           err.textContent = 'כבר קיים אלמנט בשם זה אצלך. בחר/י שם אחר.';
           return;
        }
    }

  // -------     name is unique → call DB insert       ----------
  try 
    {
       await SaveNewElementInDB(name);
       closeCreateElementModal();

       // ----- REFRESH ELEMENT TABLE ------------
       const elemsMount = byId('wow_mount_elements');
       if (elemsMount) 
         {
            renderElementsTable(elemsMount, 'building');
         }

    } catch (e) 
      {
         err.style.display = 'block';
         err.textContent = 'שגיאה ביצירת אלמנט. נסה/י שוב.';
      }
}

// ----------------------------------------------------------------------
// SaveNewElementInDB(name)
// ----------------------------------------------------------------------
// PURPOSE:
// 1. Sends a POST request to /wp-json/wow/v1/elements
// 2. On success, adds the new element row to window.MyElementLibrary[]
// 3. Returns the created row for optional chaining
// ----------------------------------------------------------------------
async function SaveNewElementInDB(name) {

  // --------- 1. Prepare payload  ---------
  const payload = { element_name: name };

  // --------- 2. Send POST request to REST endpoint  ---------
  const response = await fetch('/wp-json/wow/v1/elements', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  // --------- 3. Basic error handling ---------
  if (response.status === 409) throw new Error('duplicate');
  if (!response.ok) throw new Error('server');

  // --------- 4. Parse returned JSON ---------
  const newElement = await response.json(); 
  // expected: { element_id, creator_id, element_name }

  // --------- 5. Ensure global array exists ---------
  if (!window.MyElementLibrary || !Array.isArray(window.MyElementLibrary)) {
    window.MyElementLibrary = [];
  }

  // --------- 6. Add the new element to the array ---------
  window.MyElementLibrary.push({
    element_id: newElement.element_id,
    creator_id: newElement.creator_id,
    element_name: newElement.element_name
  });

  // --------- 7. Optional logging for debugging ---------
  if (LOG) {
    console.log('✅ Added new element to MyElementLibrary:', newElement);
    console.log('📦 Total elements now:', window.MyElementLibrary.length);
  }

  // --------- 8. Return for chaining (optional) ---------
  return newElement;
}





/* =========================================================================
   WOW — Reusable Tab-Table (Elements)
   Requires:
   - window.WowCreator.creator_id
   - window.MyElementLibrary (array of element rows)
   Tokens/colors come from v5.css variables already in your system.
   ======================================================================= */

/* Public entry: render the Elements tab-table into a given mount */
function renderElementsTable(mount, activeTab = 'building') {
  logsInDash('renderElementsTable() ENTER', { mount, activeTab });
  if (!mount) { logsInDash('renderElementsTable() EXIT — missing mount'); return; }

  // ---------- 0) Data prep ----------
  const lib = Array.isArray(window.MyElementLibrary) ? window.MyElementLibrary : [];
  const me  = (window.WowCreator && window.WowCreator.creator_id) || null;

  const buckets = {
    building: lib.filter(r => r.creator_id === me && (r.element_state || 'IN_CREATION') === 'IN_CREATION'),
    active:   lib.filter(r => r.creator_id === me && (r.element_state || '') === 'ACTIVE'),
    archived: lib.filter(r => r.creator_id === me && (r.element_state || '') === 'ARCHIVED'),
    imported: lib.filter(r => r.creator_id !== me),
  };

  const counts = {
    building: buckets.building.length,
    active:   buckets.active.length,
    imported: buckets.imported.length,
    archived: buckets.archived.length,
  };

  // Safety: normalize activeTab
  const allowed = ['building','active','imported','archived'];
  if (!allowed.includes(activeTab)) activeTab = 'building';

  // ---------- 1) Shell ----------
  mount.innerHTML = '';
  append(mount, `
    <section class="wow_tabtable">
      <!-- Tabs -->
      <div class="wow_tablist" role="tablist" aria-label="Elements tabs">
        ${tabBtn('building','בבנייה', counts.building, activeTab)}
        ${tabBtn('active','אקטיבי', counts.active, activeTab)}
        ${tabBtn('imported','מיובא', counts.imported, activeTab)}
        ${tabBtn('archived','ארכיון', counts.archived, activeTab)}
      </div>

      <!-- Container (flat top, rounded bottom) -->
      <div class="wow_tabpanel" role="tabpanel" data-active="${activeTab}">
        <!-- Tools slot (optional) -->
        <div class="wow_toolsbar"></div>

        <!-- Header strip -->
        ${headerStrip()}

        <!-- Rows -->
        <div class="wow_rows" id="wow_rows"></div>
      </div>
    </section>
  `);

  // ---------- 2) Rows ----------
  const rowsMount = mount.querySelector('#wow_rows');
  const rows = buckets[activeTab];
  if (!rows || rows.length === 0) {
    append(rowsMount, emptyStrip('אין אלמנטים להצגה'));
  } else {
    rows.forEach(r => append(rowsMount, elementRow(r)));
  }

// ---------- 3.1) Wire up action icons ----------
  const stateMap = { building:'IN_CREATION', active:'ACTIVE', imported:'IMPORTED', archived:'ARCHIVED' };
  const tabState = stateMap[activeTab];

  rowsMount.querySelectorAll('.wow_action_icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      openIconMenu({
        anchorEl: icon,
        entityType: 'element',
        entityId: icon.dataset.entityId,
        tab: tabState,
      });
    });
  });




  // ---------- 3) Wiring ----------
  mount.querySelectorAll('.wow_tablist .wow_tab_btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      renderElementsTable(mount, key);
    });
    btn.addEventListener('keydown', (e) => {
      // simple ← → keyboard switch
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const keys = ['building','active','imported','archived'];
      const idx  = keys.indexOf(activeTab);
      const nxt  = e.key === 'ArrowLeft' ? Math.max(0, idx-1) : Math.min(keys.length-1, idx+1);
      renderElementsTable(mount, keys[nxt]);
    });
  });

  logsInDash('renderElementsTable() EXIT');
}

/* ---------------- Helpers ---------------- */

function tabBtn(key, label, count, active) {
  const isActive = key === active ? ' is-active' : '';
  return `
    <button type="button" role="tab" aria-selected="${key===active}" data-key="${key}"
            class="wow_tab_btn${isActive}">
      <span>${label}</span>
      <span class="wow_tab_count">[${count || 0}]</span>   
    </button>
  `;
}

function headerStrip() {
  return `
    <div class="wow_strip wow_strip--header">
      <div class="wow_strip_right">
        <div class="wow_hcell">שם אלמנט</div>
      </div>
      <div class="wow_strip_left">
        <div class="wow_hcell">סוג</div>
        <div class="wow_hcell">משך</div>
        <div class="wow_hcell">קיבולת</div>
        <div class="wow_hcell wow_hcell--action">פעולה</div>
      </div>
    </div>
  `;
}

function emptyStrip(text) {
  return `
    <div class="wow_strip wow_strip--empty" data-tone="fresh">
      <div class="wow_strip_right">
        <div class="wow_name">${text}</div>
      </div>
      <div class="wow_strip_left"></div>
    </div>
  `;
}

function elementRow(r) {
  const name  = r.element_name || '—';
  const type  = r.element_type || '—';
  const dur   = formatDuration(r.duration);
  const cap   = (r.max_participants != null) ? r.max_participants : '—';
  const price = CalculatePrice(r); // you already stubbed this

  // default tone = warm; set data-tone="fresh" to switch to green border
  const tone  = r.tone || 'warm';

  return `
    <div class="wow_strip" data-tone="${tone}">
      <div class="wow_strip_right">
        <div class="wow_name" title="${escapeHTML(name)}">${escapeHTML(name)}</div>
      </div>

      <div class="wow_strip_left">
        <div class="wow_cell">${escapeHTML(type)}</div>
        <div class="wow_cell">${escapeHTML(dur)}</div>
        <div class="wow_cell">${escapeHTML(String(cap))}</div>

        <div class="wow_cell wow_cell--action">
          <button
          class="wow_action_icon"
          data-entity-type="element"
          data-entity-id="${r.element_id}"
          aria-label="פעולות"
          >
          <!-- play icon -->
           <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M10 8l6 4-6 4z"></path>
           </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

/* small utils (safe, no external deps) */
function formatDuration(v) {
  if (!v) return '—';
  // accept "60-80", "01:30", minutes etc. Keep simple for now:
  return String(v);
}
function CalculatePrice(_row) {
  return '₪ 175–215'; // placeholder per your instruction
}
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

/* ============================================================================
   WOW — LOAD ALL DATA FOR ONE ELEMENT
   Used when user clicks "Edit Element" inside Elements table
   ============================================================================ */

async function loadEditElementObject(elementId) 
{
  // ------------------------------------------------------------
  //  STEP 1: Find index of element in global MyElementLibrary
  // ------------------------------------------------------------
  const idx = (window.MyElementLibrary || []).findIndex(e => e.element_id === elementId);

  // ------------------------------------------------------------
  //  STEP 2: Fetch full element bundle from server
  // ------------------------------------------------------------
  const res = await fetch(`/wp-json/wow/v1/elements/${elementId}/all`, {
    method: 'GET',
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) 
  {
    console.error('[WOW][edit] Failed to load element data', res.status);
    throw new Error(`Failed to load element bundle (${res.status})`);
  }

  const data = await res.json();

  // ------------------------------------------------------------
  //  STEP 3: Build global object for current edit session
  // ------------------------------------------------------------
  window.EditElementObject = {
    ElementIndex:          idx,                                 // position in MyElementLibrary
    ElementPostArray:      data.ElementPostArray    || [],       // posts connected to element
    ElementTicketArray:    data.ElementTicketArray  || [],       // ticket types connected
    ElementVoucherArray:   data.ElementVoucherArray || [],       // voucher types connected
    element:               data.element || null                  // base element itself
  };

  // ------------------------------------------------------------
  //  STEP 4: Optional log for debugging
  // ------------------------------------------------------------
  console.log('[WOW][edit] Loaded element object:', window.EditElementObject);
}

// ======================================================================
// HELPER: findElementIndexById
// ----------------------------------------------------------------------
// • Purpose: find the index of an element (row) in window.MyElementLibrary
// • Input  : element_id (number)
// • Output : integer index (0,1,2...) or -1 if not found
// ----------------------------------------------------------------------
// • Safe even if MyElementLibrary is undefined or empty
// • Used before building window.EditElementObject
// ======================================================================
function findElementIndexById(element_id) 
{
  // --- Check that the global library exists and is an array ---
  if (!window.MyElementLibrary || !Array.isArray(window.MyElementLibrary)) 
    {
      console.warn('[WOW][findElementIndexById] MyElementLibrary not ready');
      return -1;
    }

  // --- Try to find index by element_id ---
  const idx = window.MyElementLibrary.findIndex(function (el) 
    {
      return Number(el.element_id) === Number(element_id);
    });

  // --- Log result for debugging ---
  if (idx === -1) 
    {
      console.warn('[WOW][findElementIndexById] element_id not found:', element_id);
    } 
  else 
    {
      if (LOG) console.log('[WOW][findElementIndexById] found index:', idx, 'for id:', element_id);
    }

  // --- Return the index (or -1 if not found) ---
  return idx;
}


