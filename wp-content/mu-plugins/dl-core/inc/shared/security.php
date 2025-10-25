<?php
/**
 * LocalWow — Security (creator session cookie + helpers)
 *
 * Responsibilities
 * ----------------
 * - Create / clear an HttpOnly session cookie for creators.
 * - Verify cookie integrity with HMAC (no DB reads required).
 * - Expose wow_current_creator_id() for the rest of the app.
 *
 * Notes
 * -----
 * - We do NOT hit the DB here (keeps it simple and fast).
 * - Later, if you enable server-side sessions (wow_creator_sessions),
 *   we can plug a validator in the verify step without changing callers.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }   // WP bootstrap guard

/* ------------------------------------------------------------
   Logging (info only). Flip to false when stable.
------------------------------------------------------------- */

$log = true;

function wow_sec_log( $msg ) {
    // Info-level logs only; not warnings/errors.
    global $log;
    if ( $log ) {
        error_log( '[WOW][security] ' . $msg );
    }
}

/* ------------------------------------------------------------
   Constants / config
------------------------------------------------------------- */

if ( ! defined( 'DL_CORE_PATH' ) ) {
    define( 'DL_CORE_PATH', plugin_dir_path( __DIR__ ) ); // /.../mu-plugins/dl-core/
}
if ( ! defined( 'DL_CORE_URL' ) ) {
    $mu_rel = '/mu-plugins/dl-core/';
    define( 'DL_CORE_URL', trailingslashit( content_url() ) . ltrim( $mu_rel, '/' ) );
}

/**
 * Cookie parameters
 * - short TTL for the "session" cookie. We'll add refresh later if needed.
 */
define( 'WOW_CREATOR_COOKIE', 'creator_session' );
define( 'WOW_CREATOR_COOKIE_TTL', 60 * 60 * 6 ); // 6 hours
define( 'WOW_CREATOR_COOKIE_PATH', '/' );

/* ------------------------------------------------------------
   Small signing helper (HMAC) so cookies can't be forged
------------------------------------------------------------- */

/**
 * Returns the secret key used for HMAC.
 * We prefer AUTH_SALT if defined; fallback to wp_salt('auth').
 */
function wow_hmac_key() {
    $entered = 'wow_hmac_key() ENTER';
    wow_sec_log( $entered );

    if ( defined( 'AUTH_SALT' ) && AUTH_SALT ) {
        $key = AUTH_SALT;
    } else {
        $key = wp_salt( 'auth' );
    }

    wow_sec_log( 'wow_hmac_key() EXIT' );
    return $key;
}

/**
 * Build an HMAC for the payload using SHA256.
 */
function wow_hmac_sign( $payload ) {
    $entered = 'wow_hmac_sign() ENTER';
    wow_sec_log( $entered );

    $sig = hash_hmac( 'sha256', $payload, wow_hmac_key() );

    wow_sec_log( 'wow_hmac_sign() EXIT' );
    return $sig;
}

/* ------------------------------------------------------------
   Cookie encode/decode
   Format: creator_id|issued_ts|nonce|sig
   sig = HMAC( creator_id|issued_ts|nonce )
------------------------------------------------------------- */

/**
 * Issue the session cookie for a given creator_id.
 * - HttpOnly, Secure (if site is HTTPS), SameSite=Lax.
 */
function wow_set_creator_session( $creator_id ) {

    wow_sec_log( 'wow_set_creator_session() ENTER; creator_id=' . intval( $creator_id ) );

    $creator_id = intval( $creator_id );
    if ( $creator_id <= 0 ) {
        wow_sec_log( 'wow_set_creator_session() EXIT (invalid creator_id)' );
        return false;
    }

    $issued = time();
    $nonce  = wp_generate_password( 12, false ); // short random string

    $base   = $creator_id . '|' . $issued . '|' . $nonce;
    $sig    = wow_hmac_sign( $base );
    $value  = $base . '|' . $sig;

    $expire = $issued + WOW_CREATOR_COOKIE_TTL;

    $secure   = is_ssl();
    $httponly = true;
    $samesite = 'Lax';

    // Use WP core wrapper for consistent behavior across PHP versions.
    $ok = setcookie(
        WOW_CREATOR_COOKIE,
        $value,
        array(
            'expires'  => $expire,
            'path'     => WOW_CREATOR_COOKIE_PATH,
            'secure'   => $secure,
            'httponly' => $httponly,
            'samesite' => $samesite,
        )
    );

    if ( $ok ) {
        // Also reflect into $_COOKIE immediately for this request lifecycle.
        $_COOKIE[ WOW_CREATOR_COOKIE ] = $value;
        wow_sec_log( 'Session cookie set; expires=' . gmdate( 'c', $expire ) );
    } else {
        wow_sec_log( 'Failed to set session cookie' );
    }

    wow_sec_log( 'wow_set_creator_session() EXIT' );
    return $ok;
}

/**
 * Clear the session cookie.
 */
function wow_clear_creator_session() {

    wow_sec_log( 'wow_clear_creator_session() ENTER' );

    $secure   = is_ssl();
    $httponly = true;
    $samesite = 'Lax';

    // Expire in the past; ensure browser removes it.
    setcookie(
        WOW_CREATOR_COOKIE,
        '',
        array(
            'expires'  => time() - 3600,
            'path'     => WOW_CREATOR_COOKIE_PATH,
            'secure'   => $secure,
            'httponly' => $httponly,
            'samesite' => $samesite,
        )
    );

    unset( $_COOKIE[ WOW_CREATOR_COOKIE ] );

    wow_sec_log( 'wow_clear_creator_session() EXIT' );
}

/**
 * Verify cookie integrity + TTL.
 * If valid, returns integer creator_id; otherwise 0.
 *
 * Note: No DB reads here. Later we can add a callback to check
 *       server-side session revocation if you enable that table.
 */
function wow_verify_creator_cookie() {

    wow_sec_log( 'wow_verify_creator_cookie() ENTER' );

    if ( empty( $_COOKIE[ WOW_CREATOR_COOKIE ] ) ) {
        wow_sec_log( 'No cookie present' );
        wow_sec_log( 'wow_verify_creator_cookie() EXIT' );
        return 0;
    }

    $raw = (string) $_COOKIE[ WOW_CREATOR_COOKIE ];
    $parts = explode( '|', $raw );

    if ( count( $parts ) !== 4 ) {
        wow_sec_log( 'Malformed cookie' );
        wow_sec_log( 'wow_verify_creator_cookie() EXIT' );
        return 0;
    }

    list( $creator_id, $issued, $nonce, $sig ) = $parts;

    $creator_id = intval( $creator_id );
    $issued     = intval( $issued );
    $nonce      = sanitize_text_field( $nonce );
    $sig        = sanitize_text_field( $sig );

    // Recompute signature.
    $base = $creator_id . '|' . $issued . '|' . $nonce;
    $want = wow_hmac_sign( $base );

    if ( ! hash_equals( $want, $sig ) ) {
        wow_sec_log( 'Invalid signature' );
        wow_sec_log( 'wow_verify_creator_cookie() EXIT' );
        return 0;
    }

    // TTL check.
    if ( $issued + WOW_CREATOR_COOKIE_TTL < time() ) {
        wow_sec_log( 'Cookie expired' );
        wow_sec_log( 'wow_verify_creator_cookie() EXIT' );
        return 0;
    }

    // (Optional) place to add server revocation check later.
    // e.g., wow_session_is_revoked( $creator_id, $nonce ) -> then return 0.

    wow_sec_log( 'Cookie valid for creator_id=' . $creator_id );
    wow_sec_log( 'wow_verify_creator_cookie() EXIT' );
    return $creator_id;
}

/* ------------------------------------------------------------
   Public helper: current creator id
------------------------------------------------------------- */

/**
 * Returns the logged-in creator_id (int) or 0 if not logged in.
 * Cached per request for performance.
 */
function wow_current_creator_id() {

    wow_sec_log( 'wow_current_creator_id() ENTER' );

    static $cached = null;

    if ( $cached !== null ) {
        wow_sec_log( 'wow_current_creator_id() EXIT (cached=' . intval( $cached ) . ')' );
        return intval( $cached );
    }

    $cached = wow_verify_creator_cookie();

    wow_sec_log( 'wow_current_creator_id() EXIT (found=' . intval( $cached ) . ')' );
    return intval( $cached );
}

/* ------------------------------------------------------------
   Convenience hooks (optional)
------------------------------------------------------------- */

/**
 * Helper to expose a simple REST probe later if we want:
 * GET /wp-json/wow/v1/me will call wow_current_creator_id().
 * (Implemented in rest-creator-me.php next.)
 */
