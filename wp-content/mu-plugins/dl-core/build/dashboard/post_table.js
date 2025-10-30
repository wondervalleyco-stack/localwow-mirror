// =====================================================================================
// WOW2 — Element Posts (Create, Upload, Order: move up/down)
// One readable JS file with abundant comments and a tiny, stable API surface.
// =====================================================================================
//
// WHAT THIS FILE DOES
// -------------------
// 1) Renders the Posts table for an element (rows = posts of kind POST or LINK)
// 2) Opens the create/edit modal (with media upload support)
// 3) Saves posts (new/edit) — now including the "position" field
// 4) Reorders posts via Up/Down actions — DB is the source of truth:
//      - We call an API to perform the swap in the database
//      - On success we refresh/sort the local array and re-render
//
// IMPORTANT CONVENTIONS
// ---------------------
// - Data lives in window.EditElementObject (source of truth on the client)
//   EO().ElementPostArray = [ { post_id, element_id, kind, media_id, link_url, title, body_text, position, created_at, updated_at }, ... ]
// - We DO NOT mutate positions on the client first. We let the server do it atomically,
//   then we sync the client after a successful response.
// - For NEW posts we request the next "position" from the server (MAX(position)+1 per element).
//
// DEPENDENCIES (expected to exist in your app):
// ---------------------------------------------
// - buildHeaderStrip_wow2_darker(), buildRowStrip_wow2_darker()
// - renderInfoBox_wow2(), renderInfoBox2_wow2()
// - renderFlexFormInput_wow2(), renderFlexFormTextarea_wow2()
// - renderUploadButtonStrip_wow2()
// - window.openIconMenu() (global icon menu) — already wired in icon_menu.js
// - wowUploadMedia(file, meta) → Promise<{ media_id, ... }>
//
// CSS CLASSES
// -----------
// - wow2-section, wow2-container, wow2-card-rail, wow2-container--darker
// - wow2-btnstrip, wow2-btn, wow2-btn--fresh
// - wow2-modal-viewport, wow2-modal-canvas, wow2-modal-canvas--dark
//
// PUBLIC API (tiny)
// -----------------
// - renderPostsTab_wow2(ui)           → renders the posts table
// - window.WOW_Posts.{ editPostById, deletePostById, movePostUpById, movePostDownById }
//
// Server API endpoints (you will implement in PHP next):
// ------------------------------------------------------
// - GET  /wp-json/wow/v1/element-posts/next-position?element_id={id}
// - POST /wp-json/wow/v1/element-posts        (create/update)  body: { ...fields, position }
// - POST /wp-json/wow/v1/element-posts/reorder body: { post_id, direction: "UP"|"DOWN" } → returns updated rows or ok
// - DELETE /wp-json/wow/v1/element-posts/{post_id}
//
// =====================================================================================


// ------------------------------------------------------------
// Logging toggle (info only)
// ------------------------------------------------------------
var log_posts = true;
function pinfo() { if (log_posts) try { console.log.apply(console, arguments); } catch(_){} }


// ------------------------------------------------------------
// SAFE ACCESSORS (never throw, always return structures)
// ------------------------------------------------------------
function EO() {
  const root = (window.EditElementObject ||= {});
  root.element          ||= {};    // current element meta { element_id, ... }
  root.ElementPostArray ||= [];    // posts live here
  return root;
}
function getPosts() {
  return EO().ElementPostArray;
}
function setPosts(next) {
  EO().ElementPostArray = Array.isArray(next) ? next : [];
}


// ------------------------------------------------------------
// SORTING — normalize and sort posts by position asc (then by created_at)
// Call this after any server update to keep UI consistent.
// ------------------------------------------------------------
function sortPostsInPlace() {
  const arr = getPosts();
  arr.sort((a, b) => {
    const pa = (a?.position ?? 0);
    const pb = (b?.position ?? 0);
    if (pa !== pb) return pa - pb;
    const ca = new Date(a?.created_at || 0).getTime();
    const cb = new Date(b?.created_at || 0).getTime();
    return ca - cb;
  });
}


// ------------------------------------------------------------
// API HELPERS (client → server)
// GET next available position for new post
// Matches PHP: wow_rest_get_next_post_position()
// Endpoint: GET /wp-json/wow/v1/element-posts/next-position?element_id=123
// ------------------------------------------------------------
async function apiGetNextPostPosition(element_id) {
  if (!element_id) throw new Error('Missing element_id in apiGetNextPostPosition');

  // Build URL correctly whether WOW_API is localized or not
  const base = (window.WOW_API?.postNextPosURL) 
    ? window.WOW_API.postNextPosURL 
    : '/wp-json/wow/v1/element-posts/next-position';

  // Always append element_id query param
  const url = `${base}?element_id=${encodeURIComponent(element_id)}`;

  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) {
    console.error('[post_table] Failed to fetch next position', res.status);
    throw new Error('Failed to fetch next position');
  }

  const j = await res.json(); // expect { next_position: number }
  if (typeof j?.next_position !== 'number') {
    console.error('[post_table] Malformed next position response:', j);
    throw new Error('Malformed next position response');
  }

  return j.next_position;
}


async function apiSaveElementPost_wow2(payload) {
  // payload includes: { post_id (nullable), element_id, kind, media_id, link_url, title, body_text, position }
  const url = (window.WOW_API?.postSaveURL) || '/wp-json/wow/v1/element-posts';
  const nonce = window.WOW_API?.nonce;

  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(nonce ? { 'X-WP-Nonce': nonce } : {})
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let msg = 'Server error';
    try { const j = await res.json(); msg = j?.message || msg; } catch(_){}
    throw new Error(msg);
  }
  return res.json(); // expect normalized post row with post_id and position filled
}

// ================================================================
// DELETE POST (wow2 version) — fully corrected
// ================================================================
async function apiDeleteElementPost_wow2(post_id) {
  // base URL: either localized via WOW_API or fallback to REST path
  const base = (window.WOW_API?.postDeleteURL) || '/wp-json/wow/v1/element-posts';

  // clean trailing slash and always append post_id
  const baseClean = base.replace(/\/+$/, '');
  const url = `${baseClean}/${encodeURIComponent(post_id)}`;

  const nonce = window.WOW_API?.nonce;

  const res = await fetch(url, {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: {
      ...(nonce ? { 'X-WP-Nonce': nonce } : {})
    }
  });

  if (!res.ok) {
    let msg = 'Server error';
    try {
      const j = await res.json();
      msg = j?.message || msg;
    } catch (_) {}
    throw new Error(msg);
  }

  return true;
}


async function apiReorderPost_wow2(post_id, direction /* 'UP'|'DOWN' */) {
  // Server performs atomic swap, returns either updated rows or success flag.
  const url = (window.WOW_API?.postReorderURL) || '/wp-json/wow/v1/element-posts/reorder';
  const nonce = window.WOW_API?.nonce;

  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(nonce ? { 'X-WP-Nonce': nonce } : {})
    },
    body: JSON.stringify({ post_id, direction })
  });
  if (!res.ok) {
    let msg = 'Server error';
    try { const j = await res.json(); msg = j?.message || msg; } catch(_){}
    throw new Error(msg);
  }
  // If server returns updated rows, you can merge them; otherwise we will refetch or locally swap.
  return res.json().catch(() => ({}));
}


// ------------------------------------------------------------
// RENDER — Posts Tab (table)
// Right column = title; left columns = kind; index; actions icon
// ------------------------------------------------------------
function renderPostsTab_wow2(ui) {
  if (!ui || !ui.panel) return;

  // Keep a ref so other actions can re-render this tab
  window.__posts_ui_ref = ui;

  // Ensure deterministic order
  sortPostsInPlace();
  const rows = getPosts();

  ui.panel.innerHTML =
    '<section class="wow2-section">' +
      '<div class="wow2-sub-h">תוכן</div>' +

      renderInfoBox2_wow2(
        'כאן ניתן להוסיף מידע, תוכן ופריטים על האלמנט. חובה למלא פוסט אחד לפחות. הפוסט הראשון ישמש ככותרת מידע על האלמנט.'
      ) +

      '<div class="wow2-container wow2-card-rail wow2-mt-s" id="wow2_posts_table">' +

        // Header: right title, 2 left cols (kind, index)
        buildHeaderStrip_wow2_darker('כותרת', 2, 'סוג', '#') +

        // Rows
        rows.map((p, i) => {
          const rightTitle = (p?.title || p?.headline || '—').toString();

          // Kind label (POST vs LINK)
          let kindLabel = '—';
          const k = (p?.kind || '').toString().toUpperCase();
          if (k === 'POST') kindLabel = 'פוסט';
          else if (k === 'LINK') kindLabel = 'לינק';

          const indexNum = (p?.position ?? (i + 1)); // show DB position if exists, else fallback

          const postId = p?.post_id ?? p?.id ?? i;

          const iconData = {
            entityType: 'post',
            entityId:   postId,
            tab:        'IN_CREATION'
          };

          // tone, title, numLeft=2, iconData, left1..leftN
          return buildRowStrip_wow2_darker('warm', rightTitle, 2, iconData, kindLabel, indexNum);
        }).join('') +

        // Footer add buttons
        '<div class="wow2-btnstrip wow2-btnstrip--right wow2-mt-s">' +
          '<button id="wow2_add_post" class="wow2-btn wow2-btn--fresh">+ הוסף פוסט</button>' +
          '<button id="wow2_add_link" class="wow2-btn wow2-btn--fresh">+ הוסף לינק</button>' +
        '</div>' +

      '</div>' +
    '</section>';

  // Add: POST
  const addPostBtn = document.getElementById('wow2_add_post');
  if (addPostBtn) addPostBtn.onclick = () => openCreatePostModal_wow2({ kind: 'POST' }, -1);

  // Add: LINK (same modal, but emphasizes link field)
  const addLinkBtn = document.getElementById('wow2_add_link');
  if (addLinkBtn) addLinkBtn.onclick = () => openCreatePostModal_wow2({ kind: 'LINK' }, -1);

  // Action menu on each row (play icon)
  ui.panel.querySelectorAll('.wow2-row-menu, .wow2-action-icon--play').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const entityType = btn.getAttribute('data-entity-type'); // 'post'
      const entityId   = btn.getAttribute('data-entity-id');   // post_id
      const tab        = btn.getAttribute('data-entity-tab');  // 'IN_CREATION'
      if (typeof window.openIconMenu === 'function' && entityType && entityId && tab) {
        window.openIconMenu({ anchorEl: btn, entityType, entityId, tab });
        return;
      }

      // Fallback: default edit
      window.WOW_Posts?.editPostById(entityId);
    });
  });
}


// ------------------------------------------------------------
// MODAL — Create/Edit Post (supports upload + link)
// For NEW posts, we fetch next position from server and include it in save.
// ------------------------------------------------------------
function openCreatePostModal_wow2(post = null, index = -1) {
  const isEdit = index >= 0;

  const init = {
    kind:       (post?.kind || 'POST').toUpperCase(), // POST | LINK
    headline:   post?.headline || post?.title || '',
    text_body:  post?.text_body || post?.body_text || post?.body || '',
    external_url: post?.external_url || post?.link_url || '',
    media_id:   post?.media_id || null,
    position:   post?.position ?? null
  };

  const m = document.createElement('div');
  m.className = 'wow2-modal-viewport';
  m.innerHTML =
    '<div class="wow2-modal-canvas wow2-modal-canvas--dark">' +
      `<div class="wow2-title-l">${isEdit ? 'עריכת פוסט' : 'פוסט חדש'}</div>` +

      // Media uploader strip (div-styled button + hidden file input + filename box)
      '<div class="wow2-container wow2-card-rail">' +
        renderUploadButtonStrip_wow2({
          id: 'post_media_btn',
          label: 'העלאת קובץ',
          buttonLabel: 'בחר קובץ',
          required: false
        }) +
        '<input id="post_media_input" type="file" accept="image/*,video/*" style="display:none" />' +
        '<div id="post_media_filename_box">' + renderInfoBox_wow2('לא נבחר קובץ') + '</div>' +
        '<div id="post_media_note" class="wow2-note">• תמונות עד 4MB • וידאו עד 25MB</div>' +
      '</div>' +

      // Headline + Text
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderFlexFormInput_wow2({ id: 'post_headline', label:'כותרת', value: init.headline }) +
        renderFlexFormTextarea_wow2({ id: 'post_text', label:'טקסט', value: init.text_body }) +
      '</div>' +

      // Optional link (CTA / source)
      '<div class="wow2-container wow2-container--darker wow2-card-rail">' +
        renderFlexFormInput_wow2({ id: 'post_link', label:'קישור (לא חובה)', value: init.external_url }) +
      '</div>' +

      '<div id="post_err" style="display:none;color:#ff8484" class="wow2-note wow2-mt-s"></div>' +

      '<div class="wow2-btnstrip wow2-btnstrip--right wow2-mt-s">' +
        `<div id="post_save" class="wow2-btn wow2-btn--fresh" role="button" tabindex="0">${isEdit ? 'שמור' : 'צור'}</div>` +
        '<div id="post_cancel" class="wow2-btn" role="button" tabindex="0">בטל</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(m);

  // Close handlers
  const close = () => m.remove();
  m.addEventListener('click', e => { if (e.target === m) close(); });
  m.querySelector('#post_cancel').onclick = close;

  // DOM refs
  const errEl   = m.querySelector('#post_err');
  const saveEl  = m.querySelector('#post_save');
  const btnEl   = m.querySelector('#post_media_btn');
  const fileEl  = m.querySelector('#post_media_input');
  const nameBox = m.querySelector('#post_media_filename_box');

  let uploadedInfo = null;

  // Helper to render filename info box
  const updateFileName = (txt) => {
    nameBox.innerHTML = renderInfoBox_wow2(txt || 'לא נבחר קובץ');
  };

  // Open native picker
  const openPicker = () => fileEl && fileEl.click();
  btnEl?.addEventListener('click', openPicker);
  btnEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
  });

  // Validate + upload on select
  fileEl?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    updateFileName(file ? (file.name || 'קובץ אחד נבחר') : 'לא נבחר קובץ');
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const max = isImage ? 4 * 1024 * 1024 : (isVideo ? 25 * 1024 * 1024 : 0);
    if (!max) { alert('סוג קובץ לא נתמך'); e.target.value = ''; updateFileName('לא נבחר קובץ'); return; }
    if (file.size > max) { alert('קובץ גדול מדי'); e.target.value = ''; updateFileName('לא נבחר קובץ'); return; }

    try {
      const info = await wowUploadMedia(file, {
        creatorName: window.Creator?.account_name || '',
        elementName: EO().element?.element_name || ''
      });
      uploadedInfo = info;
      errEl.style.display = 'none';
    } catch (err) {
      alert(err?.message || 'העלאה נכשלה');
      uploadedInfo = null;
      e.target.value = '';
      updateFileName('לא נבחר קובץ');
    }
  });

  // UX helpers
  const setSaving = (on) => {
    if (on) { saveEl.setAttribute('aria-disabled', 'true'); saveEl.textContent = 'שומר…'; }
    else { saveEl.removeAttribute('aria-disabled'); saveEl.textContent = isEdit ? 'שמור' : 'צור'; }
  };
  const showError = (msg) => { errEl.textContent = msg || 'שמירה נכשלה.'; errEl.style.display = 'block'; };

  // Save flow: For NEW post, request next position; for EDIT, keep position as-is.
  const doSave = async () => {
    const element_id = EO().element?.element_id ?? 0;

    const payload = {
      element_id,
      post_id: post?.post_id ?? post?.id ?? null,
      kind: (init.kind || 'POST').toUpperCase(),                   // POST | LINK
      title: (document.getElementById('post_headline')?.value || '').trim(),
      body_text: (document.getElementById('post_text')?.value || '').trim(),
      link_url: (document.getElementById('post_link')?.value || '').trim() || null,
      media_id: uploadedInfo?.media_id ?? init.media_id ?? null,
      position: init.position // may be null for new; we fill it below
    };

    // Minimal validation: at least one of title/body/media/link
    if (!payload.title && !payload.body_text && !payload.media_id && !payload.link_url) {
      showError('נדרש לפחות אחד: כותרת / טקסט / מדיה / קישור.');
      return;
    }

    errEl.style.display = 'none';
    setSaving(true);

    try {
      // For new post — fetch next position from server
      if (!payload.post_id) {
        payload.position = await apiGetNextPostPosition(element_id);
      }

      const saved = await apiSaveElementPost_wow2(payload);

      // Merge into local array (by id if edit, else push)
      const list = getPosts().slice();
      const idx  = list.findIndex(x => (x.post_id ?? x.id) == (saved.post_id ?? saved.id));
      if (idx >= 0) list[idx] = saved; else list.push(saved);
      setPosts(list);
      sortPostsInPlace();

      close();
      if (window.__posts_ui_ref) renderPostsTab_wow2(window.__posts_ui_ref);

    } catch (e) {
      pinfo('Save post failed', e);
      showError(e?.message || 'שמירה נכשלה.');
    } finally {
      setSaving(false);
    }
  };

  // Bind save
  saveEl.addEventListener('click', doSave);
  saveEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSave(); } });
}


// ------------------------------------------------------------
// GLOBAL ACTIONS — used by icon_menu.js registry for entityType "post"
// ------------------------------------------------------------
window.WOW_Posts = {
  editPostById(id) {
    const list = getPosts();
    const idx  = list.findIndex(x => (x.post_id ?? x.id) == id);
    const p    = idx >= 0 ? list[idx] : null;
    openCreatePostModal_wow2(p, idx);
  },

  async deletePostById(id) {
    if (!confirm('למחוק את הפוסט? פעולה זו אינה הפיכה.')) return;
    try {
      await apiDeleteElementPost_wow2(id);
      const next = getPosts().filter(x => (x.post_id ?? x.id) != id);
      setPosts(next);
      sortPostsInPlace();
      if (window.__posts_ui_ref) renderPostsTab_wow2(window.__posts_ui_ref);
    } catch (e) {
      alert(e?.message || 'מחיקה נכשלה');
    }
  },

  // Move Up: ask server to swap; on success, refresh local order
  async movePostUpById(id) {
    try {
      await apiReorderPost_wow2(id, 'UP');
      // After a successful swap, the safest is to re-sort local by position.
      // If your server returns updated rows with positions, you can merge them here.
      // For now: just adjust local positions optimistically by sorting existing data.
      // (If you need exact server state, fetch posts again.)
      // Best effort: bump the target one slot up locally so UI feels instant.
      const list = getPosts().slice();
      const idx  = list.findIndex(x => (x.post_id ?? x.id) == id);
      if (idx > 0) {
        // swap
        const tmp = list[idx - 1];
        list[idx - 1] = list[idx];
        list[idx] = tmp;

        // swap positions if present
        const pa = list[idx - 1].position;
        list[idx - 1].position = list[idx].position;
        list[idx].position = pa;

        setPosts(list);
        sortPostsInPlace();
      }
      if (window.__posts_ui_ref) renderPostsTab_wow2(window.__posts_ui_ref);
    } catch (e) {
      alert(e?.message || 'הזזה למעלה נכשלה');
    }
  },

  // Move Down: same as up, reversed
  async movePostDownById(id) {
    try {
      await apiReorderPost_wow2(id, 'DOWN');

      const list = getPosts().slice();
      const idx  = list.findIndex(x => (x.post_id ?? x.id) == id);
      if (idx >= 0 && idx < list.length - 1) {
        // swap
        const tmp = list[idx + 1];
        list[idx + 1] = list[idx];
        list[idx] = tmp;

        // swap positions if present
        const pa = list[idx + 1].position;
        list[idx + 1].position = list[idx].position;
        list[idx].position = pa;

        setPosts(list);
        sortPostsInPlace();
      }
      if (window.__posts_ui_ref) renderPostsTab_wow2(window.__posts_ui_ref);
    } catch (e) {
      alert(e?.message || 'הזזה למטה נכשלה');
    }
  }
};


// ------------------------------------------------------------
// OPTIONAL: initial backfill sorter (call once after load if needed)
// Ensures every post has a numeric position; keeps created_at order otherwise.
// ------------------------------------------------------------
function backfillPositionsIfMissing() {
  const arr = getPosts();
  const hasAnyMissing = arr.some(p => typeof p.position !== 'number' || Number.isNaN(p.position));
  if (!hasAnyMissing) return;

  // Assign positions in current order (1..N) — purely client-side visual fallback.
  // Real source of truth should be persisted server-side with an admin tool if needed.
  arr.forEach((p, i) => { if (typeof p.position !== 'number') p.position = i + 1; });
  sortPostsInPlace();
}


// ------------------------------------------------------------
// Export (optional) for other modules that want to force a refresh
// ------------------------------------------------------------
window.renderPostsTab_wow2 = renderPostsTab_wow2;
window.sortPostsInPlace = sortPostsInPlace;
window.backfillPositionsIfMissing = backfillPositionsIfMissing;












