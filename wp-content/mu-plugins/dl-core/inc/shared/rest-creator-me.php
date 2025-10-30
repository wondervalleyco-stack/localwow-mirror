<?php
/**
 * LocalWow — REST: Me
 *
 * Endpoint:
 *   GET /wow/v1/me
 *
 * Response (200):
 *   {
 *     "creator_id": 123,
 *     "email": "owner@example.com",
 *     "account_name": "Studio Name",
 *     "owner_name": "Owner",
 *     "status": "active"
 *   }
 *
 * Response (401):
 *   { "ok": false, "message": "Unauthorized" }
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* ------------------------------------------------------------
   Logging (info only). Flip to false when stable.
------------------------------------------------------------- */

$log = true;

function wow_me_log( $msg ) {
    global $log;
    if ( $log ) { error_log( '[WOW][me] ' . $msg ); }
}

/* ------------------------------------------------------------
   Route registration
------------------------------------------------------------- */

add_action( 'rest_api_init', function () {

    wow_me_log( 'rest_api_init() ENTER (/me)' );

    register_rest_route(
        'wow/v1',
        '/me',
        array(
            'methods'             => 'GET',
            'callback'            => 'wow_rest_me',
            'permission_callback' => '__return_true', // cookie check is inside
        )
    );

    wow_me_log( 'rest_api_init() EXIT (/me)' );
} );

/* ------------------------------------------------------------
   Handler
------------------------------------------------------------- */

/**
 * GET /wow/v1/me
 * Uses wow_current_creator_id() from security.php
 * Reads minimal fields from wow_creators.
 */
function wow_rest_me( WP_REST_Request $req ) {

    wow_me_log( 'wow_rest_me() ENTER' );

    $creator_id = wow_current_creator_id();

    if ( $creator_id <= 0 ) {
        wow_me_log( 'Unauthorized (no valid session)' );
        wow_me_log( 'wow_rest_me() EXIT 401' );
        return new WP_REST_Response(
            array( 'ok' => false, 'message' => 'Unauthorized' ),
            401
        );
    }

    global $wpdb;
    $table = 'wow_creators';

    $sql = "
        SELECT
            creator_id,
            account_email        AS email,
            account_name,
            account_owner_name   AS owner_name,
            CASE
                WHEN account_valid = 1 THEN 'active'
                ELSE 'pending'
            END AS status
        FROM {$table}
        WHERE creator_id = %d
        LIMIT 1
    ";

    $row = $wpdb->get_row( $wpdb->prepare( $sql, $creator_id ), ARRAY_A );

    if ( ! $row ) {
        wow_me_log( 'Record not found for creator_id=' . intval( $creator_id ) );
        wow_me_log( 'wow_rest_me() EXIT 401' );
        return new WP_REST_Response(
            array( 'ok' => false, 'message' => 'Unauthorized' ),
            401
        );
    }

    $resp = array(
        'creator_id'   => intval( $row['creator_id'] ),
        'email'        => (string) $row['email'],
        'account_name' => (string) $row['account_name'],
        'owner_name'   => (string) $row['owner_name'],
        'status'       => (string) $row['status'],
    );

    wow_me_log( 'wow_rest_me() EXIT 200' );
    return $resp;
}
