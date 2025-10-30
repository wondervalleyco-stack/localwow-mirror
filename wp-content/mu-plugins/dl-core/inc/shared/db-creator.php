<?php
/**
 * LocalWow — DB helpers for creators/auth/tokens
 *
 * Tables covered
 * --------------
 * - wow_creators
 * - wow_creator_auth
 * - wow_temp_tokens
 *
 * Design
 * ------
 * - Simple CRUD wrappers, clean readable code.
 * - All queries use $wpdb->prepare().
 * - All timestamps use current_time('mysql').
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* ------------------------------------------------------------
   Logging toggle
------------------------------------------------------------- */

$log = true;

function wow_db_log( $msg ) {
    global $log;
    if ( $log ) { error_log( '[WOW][db] ' . $msg ); }
}

/* ------------------------------------------------------------
   Table names
------------------------------------------------------------- */

function wow_db_tables() {
    wow_db_log( 'wow_db_tables() ENTER' );

    $tables = array(
        'creators' => 'wow_creators',
        'auth'     => 'wow_creator_auth',
        'tokens'   => 'wow_temp_tokens',
    );

    wow_db_log( 'wow_db_tables() EXIT' );
    return $tables;
}

/* ------------------------------------------------------------
   1) INSERT NEW CREATOR
------------------------------------------------------------- */

function wow_db_insert_creator( $data ) {
    wow_db_log( 'wow_db_insert_creator() ENTER' );

    global $wpdb;
    $tables = wow_db_tables();
    $table  = $tables['creators'];

    $defaults = array(
        'account_name'         => '',
        'account_email'        => '',
        'account_phone'        => '',
        'account_owner_name'           => '',
        'bank_name'            => '',
        'bank_branch_number'   => '',
        'bank_account_number'  => '',
        'meta_json'            => '{}',
        'created_at'           => current_time( 'mysql' ),
        'updated_at'           => current_time( 'mysql' ),
    );

    $insert = array_merge( $defaults, $data );

    $ok = $wpdb->insert( $table, $insert );

    if ( $ok ) {
        $id = $wpdb->insert_id;
        wow_db_log( "Creator inserted id={$id}" );
    } else {
        wow_db_log( "Creator insert failed: " . $wpdb->last_error );
        $id = 0;
    }

    wow_db_log( 'wow_db_insert_creator() EXIT' );
    return intval( $id );
}

/* ------------------------------------------------------------
   2) GET CREATOR BY ID OR EMAIL
------------------------------------------------------------- */

function wow_db_get_creator_by_id( $creator_id ) {
    wow_db_log( 'wow_db_get_creator_by_id() ENTER' );

    global $wpdb;
    $tables = wow_db_tables();
    $table  = $tables['creators'];

    $sql = "SELECT * FROM {$table} WHERE creator_id = %d LIMIT 1";
    $row = $wpdb->get_row( $wpdb->prepare( $sql, $creator_id ), ARRAY_A );

    wow_db_log( 'wow_db_get_creator_by_id() EXIT' );
    return $row;
}

function wow_db_get_creator_by_email( $account_email ) {
    wow_db_log( 'wow_db_get_creator_by_email() ENTER' );

    global $wpdb;
    $tables = wow_db_tables();
    $table  = $tables['creators'];

    $sql = "SELECT * FROM {$table} WHERE account_email = %s LIMIT 1";
    $row = $wpdb->get_row( $wpdb->prepare( $sql, $account_email ), ARRAY_A );

    wow_db_log( 'wow_db_get_creator_by_email() EXIT' );
    return $row;
}

/* ------------------------------------------------------------
   3) UPDATE CREATOR
------------------------------------------------------------- */

function wow_db_update_creator( $creator_id, $data ) {
    wow_db_log( 'wow_db_update_creator() ENTER' );

    global $wpdb;
    $tables = wow_db_tables();
    $table  = $tables['creators'];

    $data['updated_at'] = current_time( 'mysql' );

    $ok = $wpdb->update( $table, $data, array( 'creator_id' => $creator_id ) );

    if ( $ok !== false ) {
        wow_db_log( "Creator {$creator_id} updated." );
    } else {
        wow_db_log( "Update failed: " . $wpdb->last_error );
    }

    wow_db_log( 'wow_db_update_creator() EXIT' );
    return $ok !== false;
}

/* ------------------------------------------------------------
   4) AUTHENTICATION TABLE HELPERS
------------------------------------------------------------- */

// Replace the old version (which queried by email) with this:
function wow_db_get_auth_row( $creator_id ) {
    wow_db_log( 'wow_db_get_auth_row() ENTER' );

    global $wpdb;
    $tables = wow_db_tables();
    $table  = $tables['auth'];

    $sql = "SELECT * FROM {$table} WHERE creator_id = %d LIMIT 1";
    $row = $wpdb->get_row( $wpdb->prepare( $sql, intval( $creator_id ) ), ARRAY_A );

    wow_db_log( 'wow_db_get_auth_row() EXIT' );
    return $row;
}

function wow_db_insert_auth_row( $creator_id, $password ) {
    wow_db_log( 'wow_db_insert_auth_row() ENTER' );

    global $wpdb;
    $tables = wow_db_tables();
    $table  = $tables['auth'];

    $data = array(
        'creator_id' => intval($creator_id),
        'password'   => $password,           // hashed string
        'created_at' => current_time( 'mysql' ),
    );

    $ok = $wpdb->insert( $table, $data );

    if ( $ok ) {
        wow_db_log( "Auth row inserted for creator_id={$creator_id}" );
    } else {
        wow_db_log( "Auth insert failed: " . $wpdb->last_error );
    }

    wow_db_log( 'wow_db_insert_auth_row() EXIT' );
    return $ok;
}

/* ------------------------------------------------------------
   5) TEMP TOKEN HELPERS
------------------------------------------------------------- */

function wow_db_insert_token( $email, $code, $purpose ) {
    wow_db_log( 'wow_db_insert_token() ENTER' );

    global $wpdb;
    $tables = wow_db_tables();
    $table  = $tables['tokens'];

    $data = array(
        'email'      => $email,
        'purpose'    => $purpose,
        'code'       => $code,
        'created_at' => current_time( 'mysql' ),
    );

    $ok = $wpdb->insert( $table, $data );

    if ( $ok ) {
        wow_db_log( "Token inserted for {$email} ({$purpose})" );
    } else {
        wow_db_log( "Token insert failed: " . $wpdb->last_error );
    }

    wow_db_log( 'wow_db_insert_token() EXIT' );
    return $ok;
}

function wow_db_get_token( $email, $purpose ) {
    wow_db_log( 'wow_db_get_token() ENTER' );

    global $wpdb;
    $tables = wow_db_tables();
    $table  = $tables['tokens'];

    $sql = "SELECT * FROM {$table} WHERE email = %s AND purpose = %s ORDER BY created_at DESC LIMIT 1";
    $row = $wpdb->get_row( $wpdb->prepare( $sql, $email, $purpose ), ARRAY_A );

    wow_db_log( 'wow_db_get_token() EXIT' );
    return $row;
}


/* ------------------------------------------------------------
   End of file
------------------------------------------------------------- */
