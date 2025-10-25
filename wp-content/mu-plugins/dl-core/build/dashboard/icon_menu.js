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
  };

  // ------------------------------------------------------------
  // ACTION REGISTRY (Elements only for now)
  // ------------------------------------------------------------
  var registry = {
    element: {
      IN_CREATION: [
        { id: 'delete', label: 'מחיקה', iconKey: 'delete', run: function(id){ DeleteElement(id); } },
        { id: 'activate', label: 'הפעלה', iconKey: 'activate', run: function(id){ ActivateElement(id); } },
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
        { id: 'activate', label: 'הפעלה', iconKey: 'activate', run: function(id){ ActivateElement(id); } },
        { id: 'delete', label: 'מחיקה', iconKey: 'delete', run: function(id){ DeleteElement(id); } },
      ]
    }

    // ✅ NEW: ticket types
  ,ticket_type: {
    IN_CREATION: [
      { id: 'edit',     label: 'עריכה',   iconKey: 'edit',     run: (id) => window.WOW_Tickets?.editTicketTypeById(id) },
      { id: 'copy',     label: 'שכפול',   iconKey: 'copy',     run: (id) => window.WOW_Tickets?.copyTicketTypeById(id) },
      { id: 'delete',   label: 'מחיקה',   iconKey: 'delete',   run: (id) => window.WOW_Tickets?.deleteTicketTypeById(id) },
    ],
    ACTIVATED: [
      { id: 'edit',     label: 'עריכה',   iconKey: 'edit',     run: (id) => window.WOW_Tickets?.editTicketTypeById(id) },
      { id: 'copy',     label: 'שכפול',   iconKey: 'copy',     run: (id) => window.WOW_Tickets?.copyTicketTypeById(id) },
      { id: 'delete',   label: 'מחיקה',   iconKey: 'delete',   run: (id) => window.WOW_Tickets?.deleteTicketTypeById(id) },
    ]
  }
};



  

  // ------------------------------------------------------------
  // Create menu DOM (once)
  // ------------------------------------------------------------
  function createMenu() {
    if (menuEl) return menuEl;

    menuEl = document.createElement('div');
    menuEl.id = 'wow_icon_menu';
    menuEl.style.position = 'absolute';
    menuEl.style.zIndex = 9999;
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

    if (!anchorEl || !entityType || !entityId || !tab) return;

    var actions = (registry[entityType] && registry[entityType][tab]) ? registry[entityType][tab] : [];
    if (!actions.length) return;

    createMenu();
    menuEl.innerHTML = '';

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
    var rect = anchorEl.getBoundingClientRect();
    menuEl.style.left = (rect.left + window.scrollX + 8) + 'px';
    menuEl.style.top = (rect.top + window.scrollY + 8) + 'px';
    menuEl.style.display = 'flex';

    // Close listeners
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', closeIconMenu, true);
    currentAnchor = anchorEl;
  }

  // ------------------------------------------------------------
  // Expose global methods
  // ------------------------------------------------------------
  window.openIconMenu = openIconMenu;
  window.closeIconMenu = closeIconMenu;

})();
