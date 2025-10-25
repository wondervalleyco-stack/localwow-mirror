<?php
/**
 * LocalWow — REST: Creator Dashboard Summary
 *
 * Endpoint:
 *   GET /wow/v1/dashboard/summary
 *
 * Auth:
 *   Requires a valid creator cookie (checked via wow_current_creator_id()).
 *
 * Response (200):
 *   {
 *     "creator": {
 *       "creator_id": 123,
 *       "email": "owner@example.com",
 *       "account_name": "Studio Name",
 *       "owner_name": "Owner",
 *       "status": "active"
 *     },
 *     "counts": {
 *       "elements": 0,
 *       "offers": 0,
 *       "collections": 0
 *     }
 *   }
 *
 * Response (401):
 *   { "ok": false, "message": "Unauthorized" }
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }   // Safety: only within WordPress

/* ------------------------------------------------------------
   Logging (info only). Flip to false when stable.
------------------------------------------------------------- */

$log = true;

function wow_dash_log( $msg ) {
    global $log;
    if ( $log ) { error_log( '[WOW][dashboard] ' . $msg ); }
}

/* ------------------------------------------------------------
   Route registration
------------------------------------------------------------- */

add_action( 'rest_api_init', function () {

    wow_dash_log( 'rest_api_init() ENTER (/dashboard/summary)' );

    register_rest_route(
        'wow/v1',
        '/dashboard/summary',
        array(
            'methods'             => 'GET',
            'callback'            => 'wow_rest_dashboard_summary',
            'permission_callback' => '__return_true',   // We auth inside handler
        )
    );

    wow_dash_log( 'rest_api_init() EXIT (/dashboard/summary)' );
} );

/* ------------------------------------------------------------
   Handler
------------------------------------------------------------- */

/**
 * GET /wow/v1/dashboard/summary
 * - Requires a valid creator session (cookie).
 * - Loads minimal creator info from wow_creators.
 * - Returns zeroed counts for now.
 */
function wow_rest_dashboard_summary( WP_REST_Request $req ) {

    wow_dash_log( 'wow_rest_dashboard_summary() ENTER' );

    $creator_id = wow_current_creator_id();

    if ( $creator_id <= 0 ) {
        wow_dash_log( 'Unauthorized (no valid session)' );
        wow_dash_log( 'wow_rest_dashboard_summary() EXIT 401' );
        return new WP_REST_Response(
            array( 'ok' => false, 'message' => 'Unauthorized' ),
            401
        );
    }

    global $wpdb;

    // Exact table names (no prefix)
    $table_creators = 'wow_creators';

    // Load minimal visible creator details.
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
        FROM {$table_creators}
        WHERE creator_id = %d
        LIMIT 1
    ";

    $creator = $wpdb->get_row( $wpdb->prepare( $sql, $creator_id ), ARRAY_A );

    if ( ! $creator ) {
        wow_dash_log( 'Creator record missing for id=' . intval( $creator_id ) );
        wow_dash_log( 'wow_rest_dashboard_summary() EXIT 401' );
        return new WP_REST_Response(
            array( 'ok' => false, 'message' => 'Unauthorized' ),
            401
        );
    }

    // Placeholder counts (zeros for MVP).
    $counts = array(
        'elements'    => 0,
        'offers'      => 0,
        'collections' => 0,
    );

    $resp = array(
        'creator' => array(
            'creator_id'   => intval( $creator['creator_id'] ),
            'email'        => (string) $creator['email'],
            'account_name' => (string) $creator['account_name'],
            'owner_name'   => (string) $creator['owner_name'],
            'status'       => (string) $creator['status'],
        ),
        'counts' => $counts,
    );

    wow_dash_log( 'wow_rest_dashboard_summary() EXIT 200' );
    return $resp;
}
