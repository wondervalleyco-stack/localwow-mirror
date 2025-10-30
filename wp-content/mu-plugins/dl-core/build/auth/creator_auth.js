/**
 * LocalWow — Creator Auth Entry (creator_auth.js)
 *
 * Responsibilities
 * ----------------
 * - Render simple auth views inside #CREATOR_LOGIN.
 * - Handle modes: login | signup | verify | forgot | reset.
 * - Call our REST endpoints and redirect on success.
 *
 * Style
 * -----
 * - Simple, readable code. No clever one-liners.
 * - Heavy comments.
 * - Per-file LOG toggle.
 * - Every function logs ENTER / EXIT and key values.
 */

/* ------------------------------------------------------------
   Logging (info only). Flip to false when stable.
------------------------------------------------------------- */

const LOG = true;

function logAuth(msg, obj) {
  if (!LOG) return;
  if (obj !== undefined) {
    console.log(`[WOW][auth] ${msg}`, obj);
  } else {
    console.log(`[WOW][auth] ${msg}`);
  }
}

/* ------------------------------------------------------------
   Constants
------------------------------------------------------------- */

const API_BASE = '/wp-json/wow/v1';
const REDIRECT_DASHBOARD = '/creator-dashboard';
const CONTAINER_ID = 'CREATOR_LOGIN';   // page container id

/* ------------------------------------------------------------
   Utilities
------------------------------------------------------------- */

/** Safely get DOM element by id */
function el(id) {
  logAuth(`el("${id}") ENTER`);
  const node = document.getElementById(id);
  logAuth(`el("${id}") EXIT`);
  return node;
}

/** Set innerHTML (clears first) */
function setHTML(node, html) {
  logAuth(`setHTML() ENTER`);
  if (!node) {
    logAuth('setHTML() EXIT (no node)');
    return;
  }
  node.innerHTML = '';
  node.insertAdjacentHTML('afterbegin', html);
  logAuth(`setHTML() EXIT`);
}

/** Add submit handler that prevents default */
function onSubmit(form, handler) {
  logAuth('onSubmit() ENTER');
  if (!form) {
    logAuth('onSubmit() EXIT (no form)');
    return;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    handler(e);
  });
  logAuth('onSubmit() EXIT');
}

/** Try to grab WP REST nonce if present (belt + suspenders) */
function wpNonce() {
  logAuth('wpNonce() ENTER');
  const nonce = (window.wpApiSettings && window.wpApiSettings.nonce) ? window.wpApiSettings.nonce : null;
  logAuth(`wpNonce() EXIT (nonce=${nonce ? 'present' : 'none'})`);
  return nonce;
}

/** POST JSON helper */
async function postJSON(path, body) {
  logAuth(`postJSON("${path}") ENTER`, body);

  const headers = { 'Content-Type': 'application/json' };
  const nonce = wpNonce();
  if (nonce) {
    headers['X-WP-Nonce'] = nonce;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    credentials: 'same-origin',
    body: JSON.stringify(body || {})
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  logAuth(`postJSON("${path}") EXIT`, { status: res.status, data });
  return { ok: res.ok, status: res.status, data };
}

/* ------------------------------------------------------------
   Router state
------------------------------------------------------------- */

const Modes = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  VERIFY: 'verify',
  FORGOT: 'forgot',
  RESET: 'reset'
};

let state = {
  mode: Modes.LOGIN,
  pendingEmail: ''   // store email between signup -> verify, or forgot -> reset
};

/* ------------------------------------------------------------
   View templates (very minimal markup)
------------------------------------------------------------- */

function viewLogin() {
  logAuth('viewLogin() ENTER');
  const html = `
    <div class="wow-auth">
      <h1 class="wow-title">Welcome back</h1>

      <form id="wow-login-form" class="wow-form">
        <label>Email</label>
        <input id="wow-login-email" type="email" autocomplete="email" required />

        <label>Password</label>
        <input id="wow-login-pass" type="password" autocomplete="current-password" required />

        <button type="submit" class="wow-btn">Log in</button>
      </form>

      <div class="wow-links">
        <a href="#forgot" id="wow-link-forgot">Forgot password?</a>
        <span> · </span>
        <a href="#signup" id="wow-link-signup">Create an account</a>
      </div>
    </div>
  `;
  logAuth('viewLogin() EXIT');
  return html;
}

function viewSignup() {
  logAuth('viewSignup() ENTER');
  const html = `
    <div class="wow-auth">
      <h1 class="wow-title">Create your creator account</h1>

      <form id="wow-signup-form" class="wow-form">
        <label>Email</label>
        <input id="wow-signup-email" type="email" autocomplete="email" required />

        <label>Password</label>
        <input id="wow-signup-pass" type="password" autocomplete="new-password" required />

        <label>Account name</label>
        <input id="wow-signup-account" type="text" required />

        <label>Owner name</label>
        <input id="wow-signup-owner" type="text" required />

        <label>Phone (optional)</label>
        <input id="wow-signup-phone" type="tel" />

        <button type="submit" class="wow-btn">Sign up</button>
      </form>

      <div class="wow-links">
        <a href="#login" id="wow-link-login">Already have an account? Log in</a>
      </div>
    </div>
  `;
  logAuth('viewSignup() EXIT');
  return html;
}

function viewVerify() {
  logAuth('viewVerify() ENTER');
  const email = state.pendingEmail || '';
  const html = `
    <div class="wow-auth">
      <h1 class="wow-title">Verify your email</h1>
      <p class="wow-sub">We sent a 6-digit code to <strong>${email}</strong></p>

      <form id="wow-verify-form" class="wow-form">
        <label>6-digit code</label>
        <input id="wow-verify-code" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" required />
        <button type="submit" class="wow-btn">Verify</button>
      </form>

      <div class="wow-links">
        <a href="#signup" id="wow-link-back-signup">Back</a>
      </div>
    </div>
  `;
  logAuth('viewVerify() EXIT');
  return html;
}

function viewForgot() {
  logAuth('viewForgot() ENTER');
  const html = `
    <div class="wow-auth">
      <h1 class="wow-title">Reset your password</h1>

      <form id="wow-forgot-form" class="wow-form">
        <label>Email</label>
        <input id="wow-forgot-email" type="email" autocomplete="email" required />
        <button type="submit" class="wow-btn">Send reset code</button>
      </form>

      <div class="wow-links">
        <a href="#login" id="wow-link-back-login">Back to login</a>
      </div>
    </div>
  `;
  logAuth('viewForgot() EXIT');
  return html;
}

function viewReset() {
  logAuth('viewReset() ENTER');
  const email = state.pendingEmail || '';
  const html = `
    <div class="wow-auth">
      <h1 class="wow-title">Set a new password</h1>
      <p class="wow-sub">Enter the code sent to <strong>${email}</strong></p>

      <form id="wow-reset-form" class="wow-form">
        <label>6-digit code</label>
        <input id="wow-reset-code" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" required />

        <label>New password</label>
        <input id="wow-reset-pass" type="password" autocomplete="new-password" required />

        <button type="submit" class="wow-btn">Save and log in</button>
      </form>

      <div class="wow-links">
        <a href="#login" id="wow-link-back-login2">Back to login</a>
      </div>
    </div>
  `;
  logAuth('viewReset() EXIT');
  return html;
}

/* ------------------------------------------------------------
   Mode renderers
------------------------------------------------------------- */

function renderLogin(container) {
  logAuth('renderLogin() ENTER');
  setHTML(container, viewLogin());

  const form = el('wow-login-form');
  const email = el('wow-login-email');
  const pass = el('wow-login-pass');

  onSubmit(form, async function () {
    logAuth('login submit ENTER', { email: email.value });

    const { ok, data, status } = await postJSON('/creator/auth/login', {
      email: (email.value || '').trim(),
      password: pass.value || ''
    });

    if (ok && data && data.ok) {
      logAuth('login submit ok — redirecting');
      window.location.href = REDIRECT_DASHBOARD;
    } else {
      const msg = (data && data.message) ? data.message : `Login failed (${status})`;
      alert(msg);
      logAuth('login submit failed', { status, data });
    }

    logAuth('login submit EXIT');
  });

  logAuth('renderLogin() EXIT');
}

function renderSignup(container) {
  logAuth('renderSignup() ENTER');
  setHTML(container, viewSignup());

  const form = el('wow-signup-form');
  const email = el('wow-signup-email');
  const pass = el('wow-signup-pass');
  const account = el('wow-signup-account');
  const owner = el('wow-signup-owner');
  const phone = el('wow-signup-phone');

  onSubmit(form, async function () {
    logAuth('signup submit ENTER', { email: email.value });

    const { ok, data, status } = await postJSON('/creator/auth/signup', {
      email: (email.value || '').trim(),
      password: pass.value || '',
      account_name: (account.value || '').trim(),
      owner_name: (owner.value || '').trim(),
      phone: (phone.value || '').trim()
    });

    if (ok && data && data.ok) {
      state.pendingEmail = (email.value || '').trim();
      logAuth('signup ok — go to verify', { pendingEmail: state.pendingEmail });
      navigate(Modes.VERIFY);
    } else {
      const msg = (data && data.message) ? data.message : `Signup failed (${status})`;
      alert(msg);
      logAuth('signup failed', { status, data });
    }

    logAuth('signup submit EXIT');
  });

  logAuth('renderSignup() EXIT');
}

function renderVerify(container) {
  logAuth('renderVerify() ENTER');
  if (!state.pendingEmail) {
    logAuth('renderVerify() no pendingEmail → back to signup');
    navigate(Modes.SIGNUP);
    logAuth('renderVerify() EXIT (redirected)');
    return;
  }

  setHTML(container, viewVerify());

  const form = el('wow-verify-form');
  const code = el('wow-verify-code');

  onSubmit(form, async function () {
    logAuth('verify submit ENTER', { email: state.pendingEmail, code: code.value });

    const { ok, data, status } = await postJSON('/creator/auth/verify', {
      email: state.pendingEmail,
      code: (code.value || '').trim()
    });

    if (ok && data && data.ok) {
      logAuth('verify ok — redirecting');
      window.location.href = REDIRECT_DASHBOARD;
    } else {
      const msg = (data && data.message) ? data.message : `Verify failed (${status})`;
      alert(msg);
      logAuth('verify failed', { status, data });
    }

    logAuth('verify submit EXIT');
  });

  logAuth('renderVerify() EXIT');
}

function renderForgot(container) {
  logAuth('renderForgot() ENTER');
  setHTML(container, viewForgot());

  const form = el('wow-forgot-form');
  const email = el('wow-forgot-email');

  onSubmit(form, async function () {
    logAuth('forgot submit ENTER', { email: email.value });

    const cleanEmail = (email.value || '').trim();
    state.pendingEmail = cleanEmail;

    const { ok, data, status } = await postJSON('/creator/auth/forgot', {
      email: cleanEmail
    });

    // Always show generic OK to avoid user enumeration.
    if (ok) {
      logAuth('forgot ok — go to reset', { pendingEmail: state.pendingEmail });
      navigate(Modes.RESET);
    } else {
      const msg = (data && data.message) ? data.message : `Request failed (${status})`;
      alert(msg);
      logAuth('forgot failed', { status, data });
    }

    logAuth('forgot submit EXIT');
  });

  logAuth('renderForgot() EXIT');
}

function renderReset(container) {
  logAuth('renderReset() ENTER');
  if (!state.pendingEmail) {
    logAuth('renderReset() no pendingEmail → back to forgot');
    navigate(Modes.FORGOT);
    logAuth('renderReset() EXIT (redirected)');
    return;
  }

  setHTML(container, viewReset());

  const form = el('wow-reset-form');
  const code = el('wow-reset-code');
  const pass = el('wow-reset-pass');

  onSubmit(form, async function () {
    logAuth('reset submit ENTER', { email: state.pendingEmail, code: code.value });

    const { ok, data, status } = await postJSON('/creator/auth/reset', {
      email: state.pendingEmail,
      code: (code.value || '').trim(),
      new_password: pass.value || ''
    });

    if (ok && data && data.ok) {
      logAuth('reset ok — go to login');
      navigate(Modes.LOGIN);
      // Optional: auto-fill email on login view
      const emailInput = document.getElementById('wow-login-email');
      if (emailInput && state.pendingEmail) {
        emailInput.value = state.pendingEmail;
      }
    } else {
      const msg = (data && data.message) ? data.message : `Reset failed (${status})`;
      alert(msg);
      logAuth('reset failed', { status, data });
    }

    logAuth('reset submit EXIT');
  });

  logAuth('renderReset() EXIT');
}

/* ------------------------------------------------------------
   Router
------------------------------------------------------------- */

function navigate(nextMode) {
  logAuth('navigate() ENTER', { nextMode });

  state.mode = nextMode || Modes.LOGIN;

  if (window.location.hash !== `#${state.mode}`) {
    // keep URL hash in sync; harmless
    window.location.hash = `#${state.mode}`;
  }

  const root = el(CONTAINER_ID);
  if (!root) {
    logAuth(`navigate() EXIT — container #${CONTAINER_ID} not found`);
    return;
  }

  if (state.mode === Modes.LOGIN) {
    renderLogin(root);
  } else if (state.mode === Modes.SIGNUP) {
    renderSignup(root);
  } else if (state.mode === Modes.VERIFY) {
    renderVerify(root);
  } else if (state.mode === Modes.FORGOT) {
    renderForgot(root);
  } else if (state.mode === Modes.RESET) {
    renderReset(root);
  } else {
    renderLogin(root);
  }

  logAuth('navigate() EXIT');
}

function hashToMode() {
  logAuth('hashToMode() ENTER');
  const h = (window.location.hash || '').replace('#', '').trim().toLowerCase();

  if (h === Modes.LOGIN) { logAuth('hashToMode() EXIT'); return Modes.LOGIN; }
  if (h === Modes.SIGNUP) { logAuth('hashToMode() EXIT'); return Modes.SIGNUP; }
  if (h === Modes.VERIFY) { logAuth('hashToMode() EXIT'); return Modes.VERIFY; }
  if (h === Modes.FORGOT) { logAuth('hashToMode() EXIT'); return Modes.FORGOT; }
  if (h === Modes.RESET)  { logAuth('hashToMode() EXIT'); return Modes.RESET;  }

  logAuth('hashToMode() EXIT');
  return Modes.LOGIN;
}
/* ------------------------------------------------------------
   get JSON
------------------------------------------------------------- */
async function getJSON(path) {
  logAuth(`getJSON("${path}") ENTER`);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    credentials: 'same-origin',
    headers: { 'Accept': 'application/json' }
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  logAuth(`getJSON("${path}") EXIT`, { status: res.status, data });
  return { ok: res.ok, status: res.status, data };
}

/* ------------------------------------------------------------
   Boot
------------------------------------------------------------- */
async function boot() {
  logAuth('boot() ENTER');

  const root = el(CONTAINER_ID);
  if (!root) {
    logAuth(`boot() EXIT — container #${CONTAINER_ID} not found`);
    return;
  }

  // 🔐 Check session before rendering login/signup
  const me = await getJSON('/me');
  if (me.status === 200 && me.data && me.data.creator_id) {
    logAuth('boot(): session detected — redirecting to dashboard', me.data);
    window.location.href = REDIRECT_DASHBOARD;
    return;
  }

  // Minimal client router via hash
  window.addEventListener('hashchange', function () {
    logAuth('hashchange ENTER');
    const m = hashToMode();
    navigate(m);
    logAuth('hashchange EXIT');
  });

  // Start at hash mode or default login
  const startMode = hashToMode();
  navigate(startMode);

  logAuth('boot() EXIT');
}

document.addEventListener('DOMContentLoaded', function () {
  logAuth('DOMContentLoaded ENTER');
  boot();
  logAuth('DOMContentLoaded EXIT');
});
