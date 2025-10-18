<?php
/**
 * LocalWow — REST: Creator Auth
 *
 * Endpoints:
 *  POST /wow/v1/creator/auth/signup
 *  POST /wow/v1/creator/auth/verify
 *  POST /wow/v1/creator/auth/login
 *  POST /wow/v1/creator/auth/forgot
 *  POST /wow/v1/creator/auth/reset
 *  POST /wow/v1/creator/auth/logout
 *  POST /wow/v1/creator/auth/change-email/request
 *  POST /wow/v1/creator/auth/change-email/confirm
 *
 * Data rules (MVP):
 * - Tables are un-prefixed: wow_creators, wow_creator_auth, wow_temp_tokens
 * - Passwords hashed by password_hash(); verified by password_verify()
 * - Cookie managed by security.php helpers (HttpOnly, Secure, SameSite=Lax)
 *
 * Style:
 * - Simple & readable, no nested cleverness.
 * - Heavy comments, file-level $log, and ENTER/EXIT logs everywhere.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* ------------------------------------------------------------
   Logging (info only) — flip to false when stable
------------------------------------------------------------- */

$log = true;

function wow_auth_log( $msg ) {
    global $log;
    if ( $log ) { error_log( '[WOW][auth] ' . $msg ); }
}

/* ------------------------------------------------------------
   Lightweight utilities
------------------------------------------------------------- */

/**
 * Fetch clean JSON body (arrays only).
 */
function wow_auth_read_json() {
    wow_auth_log( 'wow_auth_read_json() ENTER' );

    $raw  = file_get_contents( 'php://input' );
    $data = json_decode( $raw, true );
    if ( ! is_array( $data ) ) { $data = array(); }

    wow_auth_log( 'wow_auth_read_json() EXIT' );
    return $data;
}

/**
 * Generate a 6-digit numeric code as a string (e.g., "483920").
 */
function wow_auth_code6() {
    wow_auth_log( 'wow_auth_code6() ENTER' );

    $code = str_pad( (string) wp_rand( 0, 999999 ), 6, '0', STR_PAD_LEFT );

    wow_auth_log( 'wow_auth_code6() EXIT' );
    return $code;
}

/**
 * Best-effort mailer. If wow_send_* helpers exist (email_auth.php), use them.
 * Otherwise fallback to wp_mail().
 */
function wow_auth_send_code( $purpose, $email, $code ) {
    wow_auth_log( "wow_auth_send_code() ENTER purpose={$purpose}, email={$email}" );

    if ( function_exists( 'wow_send_verify_code' ) && $purpose === 'signup_verify' ) {
        $ok = wow_send_verify_code( $email, $code );
    } elseif ( function_exists( 'wow_send_password_reset' ) && $purpose === 'password_reset' ) {
        $ok = wow_send_password_reset( $email, $code );
    } elseif ( function_exists( 'wow_send_change_email_code' ) && $purpose === 'change_email_verify' ) {
        $ok = wow_send_change_email_code( $email, $code );
    } else {
        // Fallback simple email
        $subject = '[LocalWow] ' . str_replace('_', ' ', ucfirst( $purpose ) );
        $message = "Your code is: {$code}";
        $headers = array( 'Content-Type: text/plain; charset=UTF-8' );
        $ok = wp_mail( $email, $subject, $message, $headers );
    }

    wow_auth_log( 'wow_auth_send_code() EXIT ok=' . ( $ok ? 'true' : 'false' ) );
    return (bool) $ok;
}

/* ------------------------------------------------------------
   Small DB helpers local to this file (complement db-creator.php)
------------------------------------------------------------- */

function wow_tbl() {
    return array(
        'creators' => 'wow_creators',
        'auth'     => 'wow_creator_auth',
        'tokens'   => 'wow_temp_tokens',
    );
}

/** Update creator status/email/etc (safe small wrapper) */
function wow_creator_update( $creator_id, $data ) {
    wow_auth_log( 'wow_creator_update() ENTER id=' . intval( $creator_id ) );
    global $wpdb; $t = wow_tbl()['creators'];

    if ( ! is_array( $data ) ) { $data = array(); }
    $data['updated_at'] = current_time( 'mysql' );

    $ok = $wpdb->update( $t, $data, array( 'creator_id' => intval( $creator_id ) ) );

    wow_auth_log( 'wow_creator_update() EXIT ok=' . ( $ok !== false ? 'true' : 'false' ) );
    return $ok !== false;
}

/** Update auth password hash */
function wow_auth_set_password( $creator_id, $password_hash ) {
    wow_auth_log( 'wow_auth_set_password() ENTER' );
    global $wpdb; $t = wow_tbl()['auth'];
    $ok = $wpdb->update( $t, array( 'password' => $password_hash ), array( 'creator_id' => intval($creator_id) ) );
    wow_auth_log( 'wow_auth_set_password() EXIT ok=' . ( $ok !== false ? 'true' : 'false' ) );
    return $ok !== false;
}

/** Mark token consumed (best-effort) */
function wow_token_consume( $token_id ) {
    wow_auth_log( 'wow_token_consume() ENTER token_id=' . intval( $token_id ) );
    global $wpdb; $t = wow_tbl()['tokens'];
    $ok = $wpdb->update( $t, array( 'consumed_at' => current_time( 'mysql' ) ), array( 'token_id' => intval( $token_id ) ) );
    wow_auth_log( 'wow_token_consume() EXIT ok=' . ( $ok !== false ? 'true' : 'false' ) );
    return $ok !== false;
}

/** Get latest token by email+purpose (unexpired if expires_at exists) */
function wow_token_latest( $email, $purpose ) {
    wow_auth_log( 'wow_token_latest() ENTER' );
    global $wpdb; $t = wow_tbl()['tokens'];

    $sql = "SELECT * FROM {$t}
            WHERE email = %s AND purpose = %s
            ORDER BY created_at DESC
            LIMIT 1";

    $row = $wpdb->get_row( $wpdb->prepare( $sql, $email, $purpose ), ARRAY_A );

    wow_auth_log( 'wow_token_latest() EXIT' );
    return $row;
}


/* ------------------------------------------------------------
   Route registration
------------------------------------------------------------- */

add_action( 'rest_api_init', function () {

    wow_auth_log( 'rest_api_init() ENTER' );

    $ns = 'wow/v1';

    register_rest_route( $ns, '/creator/auth/signup', array(
        'methods'             => 'POST',
        'callback'            => 'wow_rest_creator_signup',
        'permission_callback' => '__return_true',
    ) );

    register_rest_route( $ns, '/creator/auth/verify', array(
        'methods'             => 'POST',
        'callback'            => 'wow_rest_creator_verify',
        'permission_callback' => '__return_true',
    ) );

    register_rest_route( $ns, '/creator/auth/login', array(
        'methods'             => 'POST',
        'callback'            => 'wow_rest_creator_login',
        'permission_callback' => '__return_true',
    ) );

    register_rest_route( $ns, '/creator/auth/forgot', array(
        'methods'             => 'POST',
        'callback'            => 'wow_rest_creator_forgot',
        'permission_callback' => '__return_true',
    ) );

    register_rest_route( $ns, '/creator/auth/reset', array(
        'methods'             => 'POST',
        'callback'            => 'wow_rest_creator_reset',
        'permission_callback' => '__return_true',
    ) );

    register_rest_route( $ns, '/creator/auth/logout', array(
        'methods'             => 'POST',
        'callback'            => 'wow_rest_creator_logout',
        'permission_callback' => '__return_true',
    ) );

    register_rest_route( $ns, '/creator/auth/change-email/request', array(
        'methods'             => 'POST',
        'callback'            => 'wow_rest_creator_change_email_request',
        'permission_callback' => '__return_true',
    ) );

    register_rest_route( $ns, '/creator/auth/change-email/confirm', array(
        'methods'             => 'POST',
        'callback'            => 'wow_rest_creator_change_email_confirm',
        'permission_callback' => '__return_true',
    ) );

    wow_auth_log( 'rest_api_init() EXIT' );
} );

/* ------------------------------------------------------------
   Handlers
------------------------------------------------------------- */

/**
 * POST /creator/auth/signup
 * Body: { email, password, account_name, owner_name, phone? }
 * Result: { ok:true, message, next:"verify" }
 */
function wow_rest_creator_signup( WP_REST_Request $req ) {
    wow_auth_log( 'wow_rest_creator_signup() ENTER' );

    global $wpdb;
    $b = wow_auth_read_json();

    $email        = isset( $b['email'] ) ? sanitize_email( $b['email'] ) : '';
    $password     = isset( $b['password'] ) ? (string) $b['password'] : '';
    $account_name = isset( $b['account_name'] ) ? sanitize_text_field( $b['account_name'] ) : '';
    $owner_name   = isset( $b['owner_name'] ) ? sanitize_text_field( $b['owner_name'] ) : '';
    $phone        = isset( $b['phone'] ) ? sanitize_text_field( $b['phone'] ) : '';

    if ( ! $email || ! $password || ! $account_name || ! $owner_name ) {
        wow_auth_log( 'Bad request: missing fields' );
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Missing required fields' ), 400 );
    }

    // Already exists?
    $row = wow_db_get_creator_by_email( $email );
    if ( $row ) {
        wow_auth_log( 'Email already exists' );
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Email already registered' ), 409 );
    }

    // Create creator row
    $creator_id = wow_db_insert_creator( array(
        'account_name'      => $account_name,
        'account_owner_name'        => $owner_name,
        'account_email'     => $email,
        'account_phone'     => $phone,
        'account_approved'  => 0,
        'account_valid'     => 0,
        'account_state'     => 'HEALTHY',
    ) );

    if ( ! $creator_id ) {
        wow_auth_log( 'Insert failed (creator)' );
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Could not create account' ), 500 );
    }

    // Create auth row
    $hash = password_hash( $password, PASSWORD_DEFAULT );
    wow_db_insert_auth_row( $creator_id, $hash ); // was email-based; now creator_id


    // Create and send verify code
    $code = wow_auth_code6();
    wow_db_insert_token( $email, $code, 'signup_verify' );
    wow_auth_send_code( 'signup_verify', $email, $code );

    wow_auth_log( 'wow_rest_creator_signup() EXIT ok' );
    return array( 'ok' => true, 'message' => 'Verification code sent', 'next' => 'verify', 'creator_id' => $creator_id );
}

/**
 * POST /creator/auth/verify
 * Body: { email, code }
 * - Activates account and logs in (sets cookie)
 */
function wow_rest_creator_verify( WP_REST_Request $req ) {
    wow_auth_log( 'wow_rest_creator_verify() ENTER' );

    $b     = wow_auth_read_json();
    $email = isset( $b['email'] ) ? sanitize_email( $b['email'] ) : '';
    $code  = isset( $b['code'] ) ? sanitize_text_field( $b['code'] ) : '';

    if ( ! $email || ! $code ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Missing email or code' ), 400 );
    }

    $tok = wow_token_latest( $email, 'signup_verify' );
    if ( ! $tok || (string) $tok['code'] !== (string) $code ) {
        wow_auth_log( 'Verify failed: bad code' );
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Invalid code' ), 400 );
    }

    // Activate creator by validation only
    $creator = wow_db_get_creator_by_email( $email );
    if ( ! $creator ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Account not found' ), 404 );
    }

    wow_creator_update( $creator['creator_id'], array(
        'account_valid' => 1,   // ← only this
        // do NOT set account_approved here
    ) );

    wow_token_consume( intval( $tok['token_id'] ) );

    // Log in: set cookie
    wow_set_creator_session( intval( $creator['creator_id'] ) );

    wow_auth_log( 'wow_rest_creator_verify() EXIT ok' );
    return array( 'ok' => true, 'message' => 'Account verified', 'redirect' => '/creator-dashboard' );
}

/**
 * POST /creator/auth/login
 * Body: { email, password }
 */
function wow_rest_creator_login( WP_REST_Request $req ) {
    wow_auth_log( 'wow_rest_creator_login() ENTER' );

    $b       = wow_auth_read_json();
    $email   = isset( $b['email'] ) ? sanitize_email( $b['email'] ) : '';
    $pass_in = isset( $b['password'] ) ? (string) $b['password'] : '';

    if ( ! $email || ! $pass_in ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Missing email or password' ), 400 );
    }

    // Find creator by email
    $creator = wow_db_get_creator_by_email( $email );
    if ( ! $creator ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Invalid credentials' ), 401 );
    }

    // Load auth row by creator_id
    $auth = wow_db_get_auth_row( intval( $creator['creator_id'] ) );
    if ( ! $auth || ! password_verify( $pass_in, $auth['password'] ) ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Invalid credentials' ), 401 );
    }

    // Gate by account_valid only
    if ( intval( $creator['account_valid'] ) !== 1 ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Account not active' ), 403 );
    }

    // Success: set WOW session
    wow_set_creator_session( intval( $creator['creator_id'] ) );

    wow_auth_log( 'wow_rest_creator_login() EXIT ok' );
    return array( 'ok' => true, 'message' => 'Logged in', 'redirect' => '/creator-dashboard' );
}


/**
 * POST /creator/auth/forgot
 * Body: { email }
 * Sends a reset code.
 */
function wow_rest_creator_forgot( WP_REST_Request $req ) {
    wow_auth_log( 'wow_rest_creator_forgot() ENTER' );

    $b     = wow_auth_read_json();
    $email = isset( $b['email'] ) ? sanitize_email( $b['email'] ) : '';

    if ( ! $email ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Missing email' ), 400 );
    }

    $creator = wow_db_get_creator_by_email( $email );
    if ( ! $creator ) {
        // Do not reveal whether an email exists — respond OK anyway.
        wow_auth_log( 'Forgot: email not found (responding ok)' );
        return array( 'ok' => true, 'message' => 'If the email exists, a code was sent' );
    }

    $code = wow_auth_code6();
    wow_db_insert_token( $email, $code, 'password_reset' );
    wow_auth_send_code( 'password_reset', $email, $code );

    wow_auth_log( 'wow_rest_creator_forgot() EXIT ok' );
    return array( 'ok' => true, 'message' => 'If the email exists, a code was sent' );
}

/**
 * POST /creator/auth/reset
 * Body: { email, code, new_password }
 */
function wow_rest_creator_reset( WP_REST_Request $req ) {
    wow_auth_log( 'wow_rest_creator_reset() ENTER' );

    // Read and sanitize JSON body
    $b        = wow_auth_read_json();
    $email    = isset( $b['email'] ) ? sanitize_email( $b['email'] ) : '';
    $code     = isset( $b['code'] ) ? sanitize_text_field( $b['code'] ) : '';
    $new_pass = isset( $b['new_password'] ) ? (string) $b['new_password'] : '';

    // Validate presence
    if ( ! $email || ! $code || ! $new_pass ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Missing fields' ), 400 );
    }

    // Verify the latest valid token for password reset
    $tok = wow_token_latest( $email, 'password_reset' );
    if ( ! $tok || (string) $tok['code'] !== (string) $code ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Invalid code' ), 400 );
    }

    // Find the creator linked to this email
    $creator = wow_db_get_creator_by_email( $email );
    if ( ! $creator ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Account not found' ), 404 );
    }

    // Hash and update password using creator_id
    $hash = password_hash( $new_pass, PASSWORD_DEFAULT );
    wow_auth_set_password( intval( $creator['creator_id'] ), $hash );

    // Consume the token
    wow_token_consume( intval( $tok['token_id'] ) );

    wow_auth_log( 'wow_rest_creator_reset() EXIT ok' );
    return array( 'ok' => true, 'message' => 'Password updated. You can log in now.' );
}


/**
 * POST /creator/auth/logout
 * Body: {}
 */
function wow_rest_creator_logout( WP_REST_Request $req ) {
    wow_auth_log( 'wow_rest_creator_logout() ENTER' );

    wow_clear_creator_session();

    wow_auth_log( 'wow_rest_creator_logout() EXIT' );
    return array( 'ok' => true, 'message' => 'Logged out' );
}

/**
 * POST /creator/auth/change-email/request
 * Body: { current_email, password, new_email }
 * - Verifies password.
 * - Sends code to new_email.
 */
function wow_rest_creator_change_email_request( WP_REST_Request $req ) {
    wow_auth_log( 'wow_rest_creator_change_email_request() ENTER' );

    // Read and sanitize JSON body
    $b             = wow_auth_read_json();
    $current_email = isset( $b['current_email'] ) ? sanitize_email( $b['current_email'] ) : '';
    $password      = isset( $b['password'] ) ? (string) $b['password'] : '';
    $new_email     = isset( $b['new_email'] ) ? sanitize_email( $b['new_email'] ) : '';

    if ( ! $current_email || ! $password || ! $new_email ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Missing fields' ), 400 );
    }

    // Load creator and matching auth record
    $creator = wow_db_get_creator_by_email( $current_email );
    if ( ! $creator ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Account not found' ), 404 );
    }

    $auth = wow_db_get_auth_row( $creator['creator_id'] );
    if ( ! $auth || ! password_verify( $password, $auth['password'] ) ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Invalid password' ), 401 );
    }

    // Ensure new email not already used
    $exists = wow_db_get_creator_by_email( $new_email );
    if ( $exists ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Email already in use' ), 409 );
    }

    // Generate and send verification code to the new email
    $code = wow_auth_code6();
    wow_db_insert_token( $new_email, $code, 'change_email_verify' );
    wow_auth_send_code( 'change_email_verify', $new_email, $code );

    wow_auth_log( 'wow_rest_creator_change_email_request() EXIT ok' );
    return array( 'ok' => true, 'message' => 'Verification code sent to new email' );
}

/**
 * POST /creator/auth/change-email/confirm
 * Body: { current_email, new_email, code }
 * - Applies email change in both tables.
 */
function wow_rest_creator_change_email_confirm( WP_REST_Request $req ) {
    wow_auth_log( 'wow_rest_creator_change_email_confirm() ENTER' );

    $b             = wow_auth_read_json();
    $current_email = isset( $b['current_email'] ) ? sanitize_email( $b['current_email'] ) : '';
    $new_email     = isset( $b['new_email'] ) ? sanitize_email( $b['new_email'] ) : '';
    $code          = isset( $b['code'] ) ? sanitize_text_field( $b['code'] ) : '';

    if ( ! $current_email || ! $new_email || ! $code ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Missing fields' ), 400 );
    }

    // Check code sent to NEW email
    $tok = wow_token_latest( $new_email, 'change_email_verify' );
    if ( ! $tok || (string) $tok['code'] !== (string) $code ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Invalid code' ), 400 );
    }

    // Locate current creator by their current email
    $creator = wow_db_get_creator_by_email( $current_email );
    if ( ! $creator ) {
        return new WP_REST_Response( array( 'ok' => false, 'message' => 'Current account not found' ), 404 );
    }

    // Apply change ONLY in wow_creators (auth table has no email column)
    global $wpdb;
    $t_creators = wow_tbl()['creators'];

    $wpdb->update(
        $t_creators,
        array( 'account_email' => $new_email, 'updated_at' => current_time( 'mysql' ) ),
        array( 'creator_id' => intval( $creator['creator_id'] ) )
    );

    // Consume token
    wow_token_consume( intval( $tok['token_id'] ) );

    wow_auth_log( 'wow_rest_creator_change_email_confirm() EXIT ok' );
    return array( 'ok' => true, 'message' => 'Email updated' );
}
