// ----------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------
// -----------------          CREATOR DASHBOARD ON DOM LOADED     -------------------------
// ----------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------
// --------                                                                        --------
// --------  1. is this /creator-dashboard? (CSSID = CREATOR_DASHBOARD)   -----------------
// --------                                                                        --------
// --------  2. who opened it?   is it a loged-in creator? (by COOKIE)             --------
// --------                                                                        --------
// --------  3. LOAD: CREATOR | ELEMENTS | EVENTS | COLLECTIONS into front end     --------
// --------                                                                        --------
// --------  4. RENDER: SHELL + [ELEMENTS,EVENTS,COLLECTIONS,ACCOUNTS]             --------
// --------                                                                        --------
// --------  5. WAIT FOR USER ACTIONS                                              --------
// --------                                                                        --------
// ----------------------------------------------------------------------------------------
//
//
// ------------------------------------------------------------
// Logging (info only). Flip to false when stable.
// ------------------------------------------------------------ 

const LOG = true;

function logsInDash(msg, obj) 
{
  if (!LOG) return;

  if (obj !== undefined) 
    {
      console.log(`[WOW][dashboard] ${msg}`, obj);
    } else 
        {
          console.log(`[WOW][dashboard] ${msg}`);
        }
}

// ------------------------------------------------------------
// ------------------------------------------------------------
// ON DOM LOADED 
// ------------------------------------------------------------ 
// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async function () 
{
  logsInDash('DOMContentLoaded ENTER');
  
    // ------------------------------------------------------------
    //                is this '/creator-dashboard'?
    // ------------------------------------------------------------ 
    const cssidCheck = document.getElementById('CREATOR_DASHBOARD');
    if (!cssidCheck) 
      {
        logsInDash(`OnDomLoaded EXIT — container CREATOR_DASHBOARD not found`);
        return;
      }

    // ------------------------------------------------------------
    //           CHECK FOR COOKIE:
    //           if no cookie - redirect to creator login
    //           if yes cookie - save the creator details
    // ------------------------------------------------------------ 
    window.WowCreator = {};
    let creatorData = null;

    try 
      {
        const creatorDataResult = await fetch(`/wp-json/wow/v1/me`, 
          {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
          });

        if (!creatorDataResult.ok) 
          {
            logsInDash('creator not authorized, redirecting', { status: creatorDataResult.status });
            window.location.replace('/creator-login');
            return null;
          }

        creatorData = await creatorDataResult.json();
        window.WowCreator.creator_id   = creatorData.creator_id;
        window.WowCreator.email        = creatorData.email;
        window.WowCreator.account_name = creatorData.account_name;
        window.WowCreator.owner_name   = creatorData.owner_name;
      } 
    catch (err) 
      {
        console.error('⚠️ Network or JSON error', err);
        logsInDash('fetch(/me) failed, likely network issue');
        return;
      }

      console.log('[WOW][me] creator payload', window.WowCreator);   
  

    // ---------------------------------------------------------------
    // LOAD ALL ELEMENT CREATED BY LOGGEN IN CREATOR(NO IMPORTS)
    // ---------------------------------------------------------------
    window.MyElementLibrary = [];
    console.log('[WOW][load] fetching creator elements...');
    window.MyElementLibrary = await fetch('/wp-json/wow/v1/elements')
          .then(r => r.json())
          .then(data => 
            {
               console.log('[WOW][load] loaded', data.length, 'elements');
               return data;
            })
          .catch(err => 
            {
               console.error('[WOW][load] failed to load elements:', err);
               return [];
            });

    console.log('window.MyElementLibrary', window.MyElementLibrary);
    // ---------------------------------------------------------------
    //  RENDER CREATOR DASHBOARD PAGE
    // ---------------------------------------------------------------

    const canvas = renderPageChrome();
    if (!canvas) return;

    renderTopbar(canvas, window.WowCreator);
    renderHero(canvas, window.WowCreator);
    renderDashboardGrid(canvas);

    // ---------------------------------------------------------------
    //  RENDER DASHBOARD TABLES
    // --------------------------------------------------------------- 



    const eventsMount = byId('wow_mount_events');
    if (eventsMount) 
      {
        renderElementsTable(eventsMount, 'building');
      }



    const elemsMount = byId('wow_mount_elements');
    if (elemsMount) 
      {
        renderElementsTable(elemsMount, 'building');
      }

   // ---------------------------------------------------------------
    //  SETUP DASH LISTENERS
    // ---------------------------------------------------------------
    wireDashboardActions()

    logsInDash('DOMContentLoaded EXIT');
});


/* ---------- simple DOM helpers ---------- */
function byId(id){ return document.getElementById(id); }
function append(node, html){ node.insertAdjacentHTML('beforeend', html); }

/* ------------------------------------------------------------
   renderPageChrome()
------------------------------------------------------------- */
function renderPageChrome() {
  logsInDash('renderPageChrome() ENTER');

  document.body.classList.add('wow_page');

  const root = byId('CREATOR_DASHBOARD');
  if (!root) {
    logsInDash('renderPageChrome() EXIT — mount missing');
    return null;
  }

  root.setAttribute('dir', 'rtl');

  let canvas = byId('wow_canvas');
  if (!canvas) {
    canvas = document.createElement('div');
    canvas.id = 'wow_canvas';
    canvas.className = 'wow_canvas';
    root.appendChild(canvas);
  }

  canvas.innerHTML = '';
  logsInDash('renderPageChrome() EXIT');
  return canvas;
}

/* ------------------------------------------------------------
   renderTopbar()
------------------------------------------------------------- */
function renderTopbar(mount, creator) {
  if (!mount) return;


  append(mount, `
    <div id="wow_topbar">
      <div class="wow_logo">
        <span class="wow_brand_font_white">local</span>
        <span class="wow_brand_font_green">WOW</span>
      </div>

      <div class="wow_account">
        <span class="wow_account_name_font">@${creator?.account_name || ''}</span>
        <span class="wow_logout_icon" role="button" aria-label="Log out" tabindex="0" onclick="handleLogout()">
          <!-- Lucide 'log-out' icon, stroke follows CSS color -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </span>
      </div>
    </div>
  `);
}




/* ------------------------------------------------------------
   renderHero()
------------------------------------------------------------- */
function renderHero(mount, creator) {
  logsInDash('renderHero() ENTER', creator);
  if (!mount) { logsInDash('renderHero() EXIT — mount missing'); return; }

  append(mount, `
    <div class="wow_dash_hero wow_section text-right">
      <div class="wow_page_header_h">שלום</div>
      <div class="wow_page_sub_header_h">מה ניצור היום?</div>
    </div>
  `);

  logsInDash('renderHero() EXIT');
}

/* ------------------------------------------------------------
   renderDashboardGrid()
------------------------------------------------------------- */
function renderDashboardGrid(mount) {
  logsInDash('renderDashboardGrid() ENTER');
  if (!mount) { logsInDash('renderDashboardGrid() EXIT — mount missing'); return; }

  append(mount, `
    <div class="wow_grid wow_section">

      <!-- אירועים -->
      <div class="wow_dash_container min-h-[220px]">
        <div class="wow_fat_h">אירועים</div>
        <button class="wow_btn_dash" data-wow="new-event">
          <span class="wow_btn_dash_txt_h">+ אירוע חדש</span>
        </button>
        <!-- Table / content mount -->
        <div id="wow_mount_events"></div>
      </div>

      <!-- אלמנטים -->
      <div class="wow_dash_container min-h-[220px]">
        <div class="wow_fat_h">אלמנטים</div>
        <button class="wow_btn_dash" data-wow="new-element">
          <span class="wow_btn_dash_txt_h">+ אלמנט חדש</span>
        </button>
        <!-- Table / content mount -->
        <div id="wow_mount_elements"></div>
      </div>

      <!-- פרטי החשבון -->
      <div class="wow_dash_container min-h-[220px]">
        <div class="wow_fat_h">פרטי החשבון</div>
        <button class="wow_btn_dash" data-wow="edit-account">
          <span class="wow_btn_dash_txt_h">ערוך פרטי חשבון</span>
        </button>
        <!-- Table / content mount -->
        <div id="wow_mount_account"></div>
      </div>

      <!-- קולקציות -->
      <div class="wow_dash_container min-h-[220px]">
        <div class="wow_fat_h">קולקציות</div>
        <button class="wow_btn_dash" data-wow="new-collection">
          <span class="wow_btn_dash_txt_h">+ קולקציה חדשה</span>
        </button>
        <!-- Table / content mount -->
        <div id="wow_mount_collections"></div>
      </div>

    </div>
  `);

  logsInDash('renderDashboardGrid() EXIT');
}

// Ensure a node has only one listener for a given event/key
function onOnce(el, event, key, handler) 
{
  if (!el) return;
  const mark = `__on_${event}_${key}`;
  if (el[mark]) return;       // already wired
  el.addEventListener(event, handler);
  el[mark] = true;
}

function wireDashboardActions() 
{
  // New Element (אלמנט חדש)
  onOnce(document, 'click', 'new-element', (e) => 
    {
        const btn = e.target.closest('[data-wow="new-element"]');
        if (!btn) return;
        openCreateElementModal();
    });

  // Wire the other three cards’ buttons now too (stubs for later)
  onOnce(document, 'click', 'new-event', (e) => {
    const btn = e.target.closest('[data-wow="new-event"]');
    if (!btn) return;
    //openCreateEventModal();
  });

  onOnce(document, 'click', 'edit-account', (e) => {
    const btn = e.target.closest('[data-wow="edit-account"]');
    if (!btn) return;
    console.log('TODO: open account edit');
  });

  onOnce(document, 'click', 'new-collection', (e) => {
    const btn = e.target.closest('[data-wow="new-collection"]');
    if (!btn) return;
    console.log('TODO: open new collection');
  });
}




