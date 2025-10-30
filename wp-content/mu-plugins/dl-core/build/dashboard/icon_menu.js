/* =======================================================================
   ICON MENU — global, reusable popup for action icons
   File: icon_menu.js
   Owner: WOW Dashboard
   Purpose:
     - One DOM menu in <body> for all entities (elements, events, …)
     - API: openIconMenu({ anchorEl, entityType, entityId, tab }), closeIconMenu()
     - Registry-driven actions by (entityType, tab)
     - Inline SVG catalog by iconKey
   Style:
     - No frameworks, no dependencies
     - Abundant comments, readable spacing
     - Top-level log toggle
   ======================================================================= */

   // ======================================================================
// ICON CATALOG  (reusable across all modules)
// ======================================================================
const WowIconSet = {
  
  edit: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  `,

  copy: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="8" width="13" height="13" rx="2" ry="2"/>
      <path d="M3 13V5a2 2 0 0 1 2-2h8"/>
    </svg>
  `,

  activate: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.5 16.5l-1.5 4 4-1.5 9-9"/>
      <path d="M15 9l6-6"/>
      <path d="M9 15l6-6"/>
    </svg>
  `,

  delete: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  `,

  move_up: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  `,

  move_down: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  `,
};





(function () {

  // ------------------------------------------------------------
  // Logging (info only). Flip to false to silence.
  // ------------------------------------------------------------
  var log = false;
  function info() {
    if (!log) return;
    try { console.log.apply(console, arguments); } catch (e) {}
  }

  // ------------------------------------------------------------
  // Globals (kept inside IIFE, tiny public surface exported later)
  // ------------------------------------------------------------
  var menuEl = null;
  var currentAnchor = null;

  // ------------------------------------------------------------
  // SVG ICON CATALOG (inline SVGs keyed by iconKey)
  // ------------------------------------------------------------
  var iconCatalog = {
    edit: '<svg viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" fill="none" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.004 1.004 0 000-1.42l-2.34-2.34a1.004 1.004 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" fill="none" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16h14c1.1 0 2-.9 2-2V5z"/></svg>',
    activate: '<svg viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" fill="none" d="M5 13l4 4L19 7"/></svg>',
    delete: '<svg viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" fill="none" d="M3 6h18M9 6v12m6-12v12M5 6l1 14h12l1-14"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" fill="none" d="M3 12l18-9-5 9 5 9z"/></svg>',
    archive: '<svg viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" fill="none" d="M3 3h18v4H3V3zm2 6h14v12H5V9z"/></svg>',
    view: '<svg viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" fill="none" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zm11 3a3 3 0 100-6 3 3 0 000 6z"/></svg>',
    remove: '<svg viewBox="0 0 24 24"><path stroke="currentColor" stroke-width="2" fill="none" d="M6 6l12 12M6 18L18 6"/></svg>',
    move_up: '<svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    move_down: '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  // ------------------------------------------------------------
  // ACTION REGISTRY (Elements only for now)
  // ------------------------------------------------------------
  var registry = {
    element: {
      IN_CREATION: [   
        { id: 'delete', label: 'מחיקה', iconKey: 'delete', run: function(id){ DeleteElement(id); } },
        { id: 'activate', label: 'הפעלה', iconKey: 'activate',   run: (id) => window.activateElement?.(id) },
        { id: 'copy', label: 'שכפול', iconKey: 'copy', run: function(id){ CopyElement(id); } },
        { id: 'edit',     label: 'עריכה',   iconKey: 'edit',     run: (id) => window.openElementEdit?.(id) },
      ],
      ACTIVATED: [
        { id: 'edit', label: 'עריכה', iconKey: 'edit', run: function(id){ EditElement(id); } },
        { id: 'copy', label: 'שכפול', iconKey: 'copy', run: function(id){ CopyElement(id); } },
        { id: 'send', label: 'שליחה', iconKey: 'send', run: function(id){ SendElement(id); } },
        { id: 'archive', label: 'ארכיון', iconKey: 'archive', run: function(id){ ArchiveElement(id); } },
      ],
      IMPORTED: [
        { id: 'view', label: 'תצוגה', iconKey: 'view', run: function(id){ ViewElement(id); } },
        { id: 'remove', label: 'הסרה', iconKey: 'remove', run: function(id){ RemoveElement(id); } },
      ],
      ARCHIVE: [
        { id: 'view', label: 'תצוגה', iconKey: 'view', run: function(id){ ViewElement(id); } },
        { id: 'copy', label: 'שכפול', iconKey: 'copy', run: function(id){ CopyElement(id); } },
        { id: 'activate', label: 'הפעלה', iconKey: 'activate', run: function(id){ activateElement(id); } },
        { id: 'delete', label: 'מחיקה', iconKey: 'delete', run: function(id){ DeleteElement(id); } },
      ]
    }

    // ✅ NEW: ticket types
  ,ticket_type: {
    IN_CREATION: [
      { id: 'edit',     label: 'עריכה',   iconKey: 'edit',     run: (id) => window.WOW_Vouchers?.editTicketTypeById(id) },
      { id: 'copy',     label: 'שכפול',   iconKey: 'copy',     run: (id) => window.WOW_Vouchers?.copyTicketTypeById(id) },
      { id: 'delete',   label: 'מחיקה',   iconKey: 'delete',   run: (id) => window.WOW_Vouchers?.deleteTicketTypeById(id) },

    ],
    ACTIVATED: [
      { id: 'delete',   label: 'מחיקה',   iconKey: 'delete',   run: (id) => window.WOW_Vouchers?.deleteTicketTypeById(id) },
      { id: 'copy',     label: 'שכפול',   iconKey: 'copy',     run: (id) => window.WOW_Vouchers?.copyTicketTypeById(id) },
      { id: 'edit',     label: 'עריכה',   iconKey: 'edit',     run: (id) => window.WOW_Vouchers?.editTicketTypeById(id) },
    ]
  }

  ,voucher_type: {
  IN_CREATION: [
    { id: 'edit',   label: 'עריכה',   iconKey: 'edit',   run: (id) => window.WOW_Vouchers?.editTypeById(id) },
    { id: 'copy',   label: 'שכפול',   iconKey: 'copy',   run: (id) => window.WOW_Vouchers?.copyTypeById(id) },
    { id: 'delete', label: 'מחיקה',   iconKey: 'delete', run: (id) => window.WOW_Vouchers?.deleteTypeById(id) },
  ],
  ACTIVATED: [
    { id: 'edit',   label: 'עריכה',   iconKey: 'edit',   run: (id) => window.WOW_Vouchers?.editTypeById(id) },
    { id: 'copy',   label: 'שכפול',   iconKey: 'copy',   run: (id) => window.WOW_Vouchers?.copyTypeById(id) },
    { id: 'delete', label: 'מחיקה',   iconKey: 'delete', run: (id) => window.WOW_Vouchers?.deleteTypeById(id) },
  ]
}


  ,post: {
    IN_CREATION: [
      { id: 'move_up',   label: 'הזז למעלה', iconKey: 'move_up',
        run: (id) => window.WOW_Posts?.movePostUpById(id) },

      { id: 'move_down', label: 'הזז למטה', iconKey: 'move_down',
        run: (id) => window.WOW_Posts?.movePostDownById(id) },

      { id: 'edit',   label: 'עריכה', iconKey: 'edit',
        run: (id) => window.WOW_Posts?.editPostById(id) },

      { id: 'delete', label: 'מחיקה', iconKey: 'delete',
        run: (id) => window.WOW_Posts?.deletePostById(id) },
    ],

    // Same actions for ACTIVATED tab if needed
    ACTIVATED: [
      { id: 'move_up',   label: 'הזז למעלה', iconKey: 'move_up',
        run: (id) => window.WOW_Posts?.movePostUpById(id) },

      { id: 'move_down', label: 'הזז למטה', iconKey: 'move_down',
        run: (id) => window.WOW_Posts?.movePostDownById(id) },

      { id: 'edit',   label: 'עריכה', iconKey: 'edit',
        run: (id) => window.WOW_Posts?.editPostById(id) },

      { id: 'delete', label: 'מחיקה', iconKey: 'delete',
        run: (id) => window.WOW_Posts?.deletePostById(id) },
    ],
  }
  
};



/* =======================================================================
   ICON MENU — Global Version (no modal logic)
   Purpose:
     - Creates a single reusable icon action menu attached to <body>.
     - Used by all dashboard tables (elements, offers, etc.).
     - Opens next to an anchor button and provides actions by registry.
   ======================================================================= */


// ------------------------------------------------------------
// 1. CREATE MENU (Singleton in <body>)
// ------------------------------------------------------------
function createMenu() {

  // Reuse if already exists
  if (menuEl) return menuEl;

  // Create global container
  menuEl = document.createElement('div');
  menuEl.id = 'wow_icon_menu';

  // Core styles (body-level, fixed)
  menuEl.style.position       = 'fixed';           // always relative to viewport
  menuEl.style.zIndex         = '2147483647';      // topmost layer
  menuEl.style.display        = 'none';            // hidden by default
  menuEl.style.background     = '#1f1f1f';
  menuEl.style.border         = '1px solid #737373';
  menuEl.style.borderRadius   = '8px';
  menuEl.style.padding        = '4px';
  menuEl.style.boxShadow      = '0 4px 12px rgba(0,0,0,0.3)';
  menuEl.style.flexDirection  = 'row';
  menuEl.style.gap            = '6px';
  menuEl.style.pointerEvents  = 'auto';

  // Mount to <body> once
  document.body.appendChild(menuEl);
  return menuEl;
}


// ------------------------------------------------------------
// 2. OPEN MENU (Global Only)
// ------------------------------------------------------------
function openIconMenu(opts) {

  var anchorEl   = opts.anchorEl;
  var entityType = opts.entityType;
  var entityId   = opts.entityId;
  var tab        = opts.tab;

  // Safety guard
  if (!anchorEl || !entityType || !entityId || !tab) return;

  // Find available actions from registry
  var actions = (registry[entityType] && registry[entityType][tab])
              ? registry[entityType][tab] : [];
  if (!actions.length) return;

  // Ensure the singleton menu exists
  createMenu();
  menuEl.innerHTML = '';  // clear previous content

  // ------------------------------------------------------------
  // Build buttons dynamically from registry
  // ------------------------------------------------------------
  actions.forEach(function (act) {
    var btn = document.createElement('button');
    btn.innerHTML = WowIconSet[act.iconKey] || '';
    btn.title = act.label;
    btn.style.width = '36px';
    btn.style.height = '36px';
    btn.style.background = 'transparent';
    btn.style.border = '1px solid #737373';
    btn.style.borderRadius = '6px';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';

    // Action click handler
    btn.addEventListener('click', function (e) {
      e.stopPropagation();  // prevent click from bubbling
      closeIconMenu();      // hide the menu
      act.run(entityId);    // run linked action
    });

    menuEl.appendChild(btn);
  });

  // ------------------------------------------------------------
  // Position menu next to the clicked icon (viewport fixed)
  // ------------------------------------------------------------
  var r = anchorEl.getBoundingClientRect();
  var pad = 8;

  menuEl.style.position = 'fixed';
  menuEl.style.left  = Math.round(r.left + r.width + pad) + 'px';
  menuEl.style.top   = Math.round(r.top) + 'px';
  menuEl.style.display = 'flex';
  menuEl.style.zIndex = '2147483647';

  // ------------------------------------------------------------
  // Register global close listeners
  // ------------------------------------------------------------
  setTimeout(function () {
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', closeIconMenu, true);
  }, 0);

  currentAnchor = anchorEl;
}


// ------------------------------------------------------------
// 3. CLOSE MENU (Global Only)
// ------------------------------------------------------------
function closeIconMenu() {
  if (!menuEl) return;

  menuEl.style.display = 'none';
  menuEl.innerHTML = '';
  currentAnchor = null;

  // Remove attached listeners
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('scroll', closeIconMenu, true);
}


// ------------------------------------------------------------
// 4. SUPPORT FUNCTIONS (Outside click, ESC key)
// ------------------------------------------------------------
function handleOutsideClick(e) {
  if (menuEl && !menuEl.contains(e.target)) closeIconMenu();
}

function handleKeyDown(e) {
  if (e.key === 'Escape') closeIconMenu();
}


// ------------------------------------------------------------
// 5. EXPORT PUBLIC METHODS
// ------------------------------------------------------------
window.openIconMenu  = openIconMenu;
window.closeIconMenu = closeIconMenu;




/* =======================================================================
   ICON MENU (MODAL VERSION)
   Purpose:
     - Used only inside ticket modals.
     - Creates a fresh icon menu each time you click an action icon.
     - Cleans up automatically when the modal closes or on outside click.
   Notes:
     - Independent from the global dashboard icon menu.
     - Lives and dies inside `.wow2-modal-viewport`.
   ======================================================================= */


// ------------------------------------------------------------
// Create and render a new modal-scoped menu
// ------------------------------------------------------------
function createMenu_modal(anchorEl, entityId) {

  // Guards: ensure we have a button and an active modal
  if (!anchorEl || !entityId) return;
  const modal = anchorEl.closest('.wow2-modal-viewport');
  if (!modal) return;

  // Remove any existing modal menu (clean state per open)
  const old = modal.querySelector('#wow_icon_menu_modal');
  if (old) old.remove();

  // ------------------------------------------------------------
  // Build container
  // ------------------------------------------------------------

  const menu = document.createElement('div');
  menu.id = 'wow_icon_menu';
  menu.style.position       = 'absolute';
  menu.style.zIndex         = '2147483647';
  menu.style.display        = 'flex';
  menu.style.background     = '#1f1f1f';
  menu.style.border         = '1px solid #737373';
  menu.style.borderRadius   = '8px';
  menu.style.padding        = '4px';
  menu.style.boxShadow      = '0 4px 12px rgba(0,0,0,0.3)';
  menu.style.gap            = '6px';
  menu.style.flexDirection  = 'row';
  menu.style.pointerEvents  = 'auto';

  // ------------------------------------------------------------
  // Define actions (Ticket Type only)
  // ------------------------------------------------------------
  const actions = [
    { id: 'edit',   label: 'עריכה',   icon: WowIconSet.edit,   run: () => WOW_TicketTypes.editTypeById(entityId) },
    { id: 'copy',   label: 'שכפול',   icon: WowIconSet.copy,   run: () => WOW_TicketTypes.copyTypeById(entityId) },
    { id: 'delete', label: 'מחיקה',   icon: WowIconSet.delete, run: () => WOW_TicketTypes.deleteTypeById(entityId) },
  ];

  // ------------------------------------------------------------
  // Build each button
  // ------------------------------------------------------------
  actions.forEach(act => {
    const btn = document.createElement('button');
    btn.innerHTML = act.icon;
    btn.title = act.label;
    btn.style.width = '36px';
    btn.style.height = '36px';
    btn.style.border = '1px solid #737373';
    btn.style.borderRadius = '6px';
    btn.style.background = 'transparent';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';

    // Click → close menu → execute action
    btn.addEventListener('click', e => {
      e.stopPropagation();
      menu.remove();
      act.run();
    });

    menu.appendChild(btn);
  });

  // ------------------------------------------------------------
  // Position relative to clicked icon
  // ------------------------------------------------------------
  const rect = anchorEl.getBoundingClientRect();
  const modalRect = modal.getBoundingClientRect();
  const left = rect.left - modalRect.left + rect.width + 8;
  const top  = rect.top  - modalRect.top;

  menu.style.left = `${Math.round(left)}px`;
  menu.style.top  = `${Math.round(top)}px`;

  // Mount inside modal
  modal.appendChild(menu);

  // ------------------------------------------------------------
  // Outside click → close
  // ------------------------------------------------------------
  setTimeout(() => {
    const closeOnClickOutside = e => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeOnClickOutside);
      }
    };
    document.addEventListener('click', closeOnClickOutside);
  }, 0);
}


// ------------------------------------------------------------
// Public modal API wrappers
// ------------------------------------------------------------
function openIconMenu_modal(anchorEl, entityId) {
  try { createMenu_modal(anchorEl, entityId); }
  catch (e) { console.warn('openIconMenu_modal error:', e); }
}

function closeIconMenu_modal(ctxEl) {
  let root = null;

  // Scope to nearest modal if context provided
  if (ctxEl && typeof ctxEl.closest === 'function') {
    root = ctxEl.closest('.wow2-modal-viewport');
  }
  // Fallback: any open modal
  if (!root) root = document.querySelector('.wow2-modal-viewport');

  // Remove menu if found
  const menu = (root ? root.querySelector('#wow_icon_menu_modal') : null)
            || document.getElementById('wow_icon_menu_modal');
  if (menu) menu.remove();
}


// ------------------------------------------------------------
// Export modal-only API
// ------------------------------------------------------------
window.openIconMenu_modal  = openIconMenu_modal;
window.closeIconMenu_modal = closeIconMenu_modal;

})();




/*

// ===================================================================
// createMenu_modal() — icon menu used ONLY inside ticket modals
// - Creates a brand-new menu per modal open
// - Cleans any previous modal menu instance
// - Positions relative to the clicked action button
// - Wires Edit / Copy / Delete actions for Ticket Types
// ===================================================================
function createMenu_modal(anchorEl, entityId) {
  // Guards
  if (!anchorEl || !entityId) return;

  // Locate the modal root (viewport)
  const modal = anchorEl.closest('.wow2-modal-viewport');
  if (!modal) return;

  // Clean any existing modal-scoped menu (idempotent)
  const old = modal.querySelector('#wow_icon_menu_modal');
  if (old) old.remove();

  // Build container
  const menu = document.createElement('div');
  menu.id = 'wow_icon_menu_modal';
  menu.style.position = 'absolute';
  menu.style.zIndex = '2147483647';
  menu.style.display = 'flex';
  menu.style.background = '#1f1f1f';
  menu.style.border = '1px solid #737373';
  menu.style.borderRadius = '8px';
  menu.style.padding = '4px';
  menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  menu.style.gap = '6px';
  menu.style.flexDirection = 'row';
  menu.style.pointerEvents = 'auto';

  // Actions for ticket types inside modal (edit/copy/delete)
  const actions = [
    { id: 'edit',   label: 'עריכה',   icon: WowIconSet.edit,   run: () => WOW_TicketTypes.editTypeById(entityId) },
    { id: 'copy',   label: 'שכפול',   icon: WowIconSet.copy,   run: () => WOW_TicketTypes.copyTypeById(entityId) },
    { id: 'delete', label: 'מחיקה',   icon: WowIconSet.delete, run: () => WOW_TicketTypes.deleteTypeById(entityId) },
  ];

  // Build buttons
  actions.forEach(act => {
    const btn = document.createElement('button');
    btn.innerHTML = act.icon;
    btn.title = act.label;
    btn.style.width = '36px';
    btn.style.height = '36px';
    btn.style.border = '1px solid #737373';
    btn.style.borderRadius = '6px';
    btn.style.background = 'transparent';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';

    btn.addEventListener('click', e => {
      e.stopPropagation();
      menu.remove();
      act.run();
    });

    menu.appendChild(btn);
  });

  // Position relative to the anchor inside the modal
  const rect = anchorEl.getBoundingClientRect();
  const modalRect = modal.getBoundingClientRect();
  const left = rect.left - modalRect.left + rect.width + 8;
  const top  = rect.top  - modalRect.top;

  menu.style.left = `${Math.round(left)}px`;
  menu.style.top  = `${Math.round(top)}px`;

  // Mount into the modal
  modal.appendChild(menu);

  // Close when clicking outside (scoped to document)
  setTimeout(() => {
    const closeOnClickOutside = e => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeOnClickOutside);
      }
    };
    document.addEventListener('click', closeOnClickOutside);
  }, 0);
}


function openIconMenu_modal(anchorEl, entityId) {
  try { createMenu_modal(anchorEl, entityId); }
  catch (e) { console.warn('openIconMenu_modal error:', e); }
}

function closeIconMenu_modal(ctxEl) {
  let root = null;
  if (ctxEl && typeof ctxEl.closest === 'function') {
    root = ctxEl.closest('.wow2-modal-viewport');
  }
  if (!root) {
    root = document.querySelector('.wow2-modal-viewport');
  }

  const menu = (root ? root.querySelector('#wow_icon_menu_modal') : null)
            || document.getElementById('wow_icon_menu_modal');
  if (menu) menu.remove();
}

// Expose modal API
window.openIconMenu_modal = openIconMenu_modal;
window.closeIconMenu_modal = closeIconMenu_modal;












  

  // ------------------------------------------------------------
  // Create menu DOM (once)
  // ------------------------------------------------------------
  function createMenu() {
    if (menuEl) return menuEl;
    console.log("inside createMenu()",menuEl);


    menuEl = document.createElement('div');
    menuEl.id = 'wow_icon_menu';

menuEl.style.position = 'fixed';              // <— pin to viewport so modals/scroll don't matter
menuEl.style.zIndex   = 2147483647;           // <— top of the world
menuEl.style.pointerEvents = 'auto';          // safety

    // menuEl.style.position = 'absolute';
    // menuEl.style.zIndex = 2147483647;
    menuEl.style.display = 'none';
    menuEl.style.background = '#1f1f1f';
    menuEl.style.border = '1px solid #737373';
    menuEl.style.borderRadius = '8px';
    menuEl.style.padding = '4px';
    menuEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    menuEl.style.flexDirection = 'row';
    menuEl.style.gap = '6px';

    document.body.appendChild(menuEl);
    return menuEl;
  }

  // ------------------------------------------------------------
  // Close menu
  // ------------------------------------------------------------
  function closeIconMenu() {
    if (!menuEl) return;
    menuEl.style.display = 'none';
    menuEl.innerHTML = '';
    currentAnchor = null;
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('scroll', closeIconMenu, true);
  }

  function handleOutsideClick(e) {
    if (menuEl && !menuEl.contains(e.target)) closeIconMenu();
  }
  function handleKeyDown(e) {
    if (e.key === 'Escape') closeIconMenu();
  }

  // ------------------------------------------------------------
  // Open menu
  // ------------------------------------------------------------
  function openIconMenu(opts) {
    var anchorEl = opts.anchorEl;
    var entityType = opts.entityType;
    var entityId = opts.entityId;
    var tab = opts.tab;
    
    console.log("entered openIconMenu");

    if (!anchorEl || !entityType || !entityId || !tab) return;

    var actions = (registry[entityType] && registry[entityType][tab]) ? registry[entityType][tab] : [];
    if (!actions.length) return;

    console.log("calling createMenu()");

    createMenu();
    menuEl.innerHTML = '';
    console.log("just before actions.forEach(function (act)",actions);

    actions.forEach(function (act) {
      var btn = document.createElement('button');
      btn.innerHTML = WowIconSet[act.iconKey] || '';
      btn.title = act.label;
      btn.style.width = '36px';
      btn.style.height = '36px';
      btn.style.background = 'transparent';
      btn.style.border = '1px solid #737373';
      btn.style.borderRadius = '6px';
      btn.style.color = '#fff';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        closeIconMenu();
        act.run(entityId);
      });
      menuEl.appendChild(btn);
    });

    // Positioning
    //var rect = anchorEl.getBoundingClientRect();
    //menuEl.style.left = (rect.left + window.scrollX + 8) + 'px';
    //menuEl.style.top = (rect.top + window.scrollY + 8) + 'px';
    //menuEl.style.display = 'flex';
 
const rect = anchorEl.getBoundingClientRect();     // viewport coords
const pad  = 8;
// place it just to the right of the button, aligned vertically
menuEl.style.left    = Math.round(rect.left + rect.width + pad) + 'px';
menuEl.style.top     = Math.round(rect.top) + 'px';
menuEl.style.display = 'flex';
 
 
 
    console.log("var rect = anchorEl.getBoundingClientRect(); - anchorEl",anchorEl);
    console.log("var rect = anchorEl.getBoundingClientRect(); - rect",rect);







    // Close listeners
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', closeIconMenu, true);
    currentAnchor = anchorEl;
  }


function createMenu() {
  if (menuEl) return menuEl;

  menuEl = document.createElement('div');
  menuEl.id = 'wow_icon_menu';
  // default: fixed (for body portal). We'll switch to absolute if we mount in a modal.
  menuEl.style.position = 'absolute';
  menuEl.style.zIndex   = '2147483647';     // way above overlays
  menuEl.style.display  = 'none';
  menuEl.style.background = '#1f1f1f';
  menuEl.style.border     = '1px solid #737373';
  menuEl.style.borderRadius = '8px';
  menuEl.style.padding    = '4px';
  menuEl.style.boxShadow  = '0 4px 12px rgba(0,0,0,0.3)';
  menuEl.style.flexDirection = 'row';
  menuEl.style.gap        = '6px';
  menuEl.style.pointerEvents = 'auto';

  document.body.appendChild(menuEl);
  return menuEl;
}


function openIconMenu(opts) {
  var anchorEl   = opts.anchorEl;
  var entityType = opts.entityType;
  var entityId   = opts.entityId;
  var tab        = opts.tab;

  if (!anchorEl || !entityType || !entityId || !tab) return;

  var actions = (registry[entityType] && registry[entityType][tab]) ? registry[entityType][tab] : [];
  if (!actions.length) return;

  createMenu();
  menuEl.innerHTML = '';

  // build buttons
  actions.forEach(function (act) {
    var btn = document.createElement('button');
    btn.innerHTML = WowIconSet[act.iconKey] || '';
    btn.title = act.label;
    btn.style.width = '36px';
    btn.style.height = '36px';
    btn.style.background = 'transparent';
    btn.style.border = '1px solid #737373';
    btn.style.borderRadius = '6px';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeIconMenu();
      act.run(entityId);
    });
    menuEl.appendChild(btn);
  });

  // ---------- placement ----------
  // if opened from inside a modal, mount inside the modal and position relative to it
  var modalRoot = anchorEl.closest('.wow2-modal-viewport, .wow2-modal-canvas');
  if (modalRoot) {
    // ensure menu is a child of the modal
    if (menuEl.parentNode !== modalRoot) modalRoot.appendChild(menuEl);

    // position relative to the modal
    var a = anchorEl.getBoundingClientRect();
    var m = modalRoot.getBoundingClientRect();
    var pad = 8;
    console.log(" anchorEl.getBoundingClientRect() ", a);
    console.log(" modalRoot.getBoundingClientRect() ",m);
 

    menuEl.style.position = 'absolute';           // relative to modalRoot
    menuEl.style.left  = Math.round(a.left - m.left + a.width + pad) + 'px';
    menuEl.style.top   = Math.round(a.top  - m.top) + 'px';
    menuEl.style.zIndex = '10000';                // above modal canvas

    console.log(" menuEl.style.position ", menuEl.style.position);
    console.log(" menuEl.style.left ", menuEl.style.left);
    console.log(" menuEl.style.top ", menuEl.style.top);



  } else {
    // default: body portal, fixed to viewport
    var r = anchorEl.getBoundingClientRect();
    var pad = 8;
    menuEl.style.position = 'fixed';
    menuEl.style.left  = Math.round(r.left + r.width + pad) + 'px';
    menuEl.style.top   = Math.round(r.top) + 'px';
    menuEl.style.zIndex = '2147483647';
  }

  menuEl.style.display = 'flex';

  // defer outside listeners to avoid closing on the same click that opened the menu
  setTimeout(function () {
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', closeIconMenu, true);
  }, 0);

  currentAnchor = anchorEl;
}















*/
  // ------------------------------------------------------------
  // Expose global methods
  // ------------------------------------------------------------
 