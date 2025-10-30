<?php
/**
 * LocalWow — Assets Enqueue (with wow2 shared UI helpers)
 *
 * Purpose:
 * - Load Tailwind (via CDN)
 * - Load base CSS v5.css and the new wow2 CSS (v5_new.css)
 * - Load page-specific JS for creator-login and creator-dashboard
 * - NEW: Load one shared JS file build/shared/wow_UI_elements.js
 *        and make all dashboard scripts depend on it.
 *
 * Notes:
 * - Heavy inline logging for debug.log
 * - Defensive file_exists checks (no fatal errors if missing)
 * - Uses dependency handles to ensure correct load order
 */

if (!defined('ABSPATH')) exit;


/* ============================================================
   0) Logging helper
   ------------------------------------------------------------ */
$log = true;  // Flip to false to disable log messages

function wow_assets_log($msg)
{
    global $log;
    if ($log) {
        error_log('[WOW][assets] ' . $msg);
    }
}


/* ============================================================
   1) Fallback constants for paths and URLs
   ------------------------------------------------------------ */
if (!defined('DL_CORE_PATH')) {
    // Physical path to mu-plugin folder (/wp-content/mu-plugins/dl-core/)
    define('DL_CORE_PATH', plugin_dir_path(__DIR__));
}
if (!defined('DL_CORE_URL')) {
    // Public URL to same folder, used for building asset URLs
    $mu_rel = '/mu-plugins/dl-core/';
    define('DL_CORE_URL', trailingslashit(content_url()) . ltrim($mu_rel, '/'));
}


/* ============================================================
   2) Page detection helpers
   ------------------------------------------------------------ */
function wow_is_creator_login_page()
{
    $is_it = is_page('creator-login');
    wow_assets_log('wow_is_creator_login_page() → ' . ($is_it ? 'true' : 'false'));
    return $is_it;
}

function wow_is_creator_dashboard_page()
{
    $is_it = is_page('creator-dashboard');
    wow_assets_log('wow_is_creator_dashboard_page() → ' . ($is_it ? 'true' : 'false'));
    return $is_it;
}


/* ============================================================
   3) Main enqueue function
   ------------------------------------------------------------ */
function wow_enqueue_public_assets()
{
    wow_assets_log('wow_enqueue_public_assets() ENTER');

    // Stop if in admin panel
    if (is_admin()) {
        wow_assets_log('Abort: is_admin() true');
        return;
    }

    // Detect target pages
    $on_login     = wow_is_creator_login_page();
    $on_dashboard = wow_is_creator_dashboard_page();

    if (!$on_login && !$on_dashboard) {
        wow_assets_log('Abort: not a creator page');
        return;
    }

    /* ------------------------------------------------------------
       A) Tailwind (CDN)
    ------------------------------------------------------------ */
    wp_enqueue_script('tailwindcdn', 'https://cdn.tailwindcss.com', [], null, false);
    wow_assets_log('Enqueue Tailwind CDN');

    /* ------------------------------------------------------------
       B) CSS files
    ------------------------------------------------------------ */
    // Base CSS (v5.css)
    $v5_handle = 'wow-v5';
    $v5_rel    = 'css/v5.css';
    $v5_path   = DL_CORE_PATH . $v5_rel;
    $v5_url    = DL_CORE_URL  . $v5_rel;
    $v5_ver    = file_exists($v5_path) ? filemtime($v5_path) : null;

    wp_enqueue_style($v5_handle, $v5_url, ['elementor-frontend'], $v5_ver);
    wow_assets_log('Enqueue CSS: ' . $v5_url);

    // wow2 CSS (v5_new.css) — loaded AFTER v5.css
    $wow2_handle = 'wow2-style';
    $wow2_rel    = 'css/v5_new.css';
    $wow2_path   = DL_CORE_PATH . $wow2_rel;
    $wow2_url    = DL_CORE_URL  . $wow2_rel;

    if (file_exists($wow2_path)) {
        $wow2_ver = filemtime($wow2_path);
        wp_enqueue_style($wow2_handle, $wow2_url, [$v5_handle], $wow2_ver, 'all');
        wow_assets_log('Enqueue CSS (wow2): ' . $wow2_url);
    } else {
        wow_assets_log('Skip CSS (wow2) — file not found: ' . $wow2_rel);
    }

    /* ------------------------------------------------------------
       C) JS — Per page logic
    ------------------------------------------------------------ */
    if ($on_login) {
        // ----------------------------------
        // Creator Login Page JS
        // ----------------------------------
        $js_login_rel  = 'build/auth/creator_auth.js';
        $js_login_path = DL_CORE_PATH . $js_login_rel;
        $js_login_url  = DL_CORE_URL  . $js_login_rel;

        if (file_exists($js_login_path)) {
            wp_enqueue_script(
                'wow-creator-auth',
                $js_login_url,
                [],
                filemtime($js_login_path),
                true
            );
            wow_assets_log('Enqueue JS (login): ' . $js_login_url);
        } else {
            wow_assets_log('Skip JS (login) — file not found: ' . $js_login_rel);
        }
    }

    if ($on_dashboard) {
        // ----------------------------------
        // Creator Dashboard JS
        // ----------------------------------

        /* ---------- 0) Shared wow2 UI Helpers ---------- */
        $js_ui_rel  = 'build/shared/wow_UI_elements.js';
        $js_ui_path = DL_CORE_PATH . $js_ui_rel;
        $js_ui_url  = DL_CORE_URL  . $js_ui_rel;

        if (file_exists($js_ui_path)) {
            wp_enqueue_script(
                'wow2-ui-elements',
                $js_ui_url,
                [],
                filemtime($js_ui_path),
                true
            );
            wow_assets_log('Enqueue JS (wow2 ui): ' . $js_ui_rel);
        } else {
            wow_assets_log('Skip JS (wow2 ui) — file not found: ' . $js_ui_rel);
        }

       // --------------------------------------------------------------
       // Expose REST URLs + nonce to JS (available before all dependents)
       // We attach it to the same handle 'wow2-ui-elements' so every
       // downstream script that depends on it gets WOW_API defined.
       // --------------------------------------------------------------
       if (wp_script_is('wow2-ui-elements', 'enqueued')) 
        {
          $wow_api = [
          'ticketTypeSaveURL' => rest_url('wow/v1/ticket-type'),
          'voucherTypeSaveURL' => rest_url('wow/v1/voucher-type'),
          'mediaUploadURL'     => rest_url('wow/v1/media'),
          'postSaveURL'        => rest_url('wow/v1/element-posts'),
          'postDeleteURL'      => rest_url('wow/v1/element-posts'),
          'postReorderURL'    => rest_url('wow/v1/element-posts/reorder'),
          'postNextPosURL'    => rest_url('wow/v1/element-posts/next-position'),
          'nonce'             => wp_create_nonce('wp_rest'),
          ];

          wp_localize_script('wow2-ui-elements', 'WOW_API', $wow_api);
          wow_assets_log('Expose WOW_API to JS via wp_localize_script');
       }

        /* ---------- 1) Dashboard Core ---------- */
        $js_dash_rel  = 'build/dashboard/creator_dashboard.js';
        $js_dash_path = DL_CORE_PATH . $js_dash_rel;
        $js_dash_url  = DL_CORE_URL  . $js_dash_rel;

        if (file_exists($js_dash_path)) {
            wp_enqueue_script(
                'wow-creator-dashboard',
                $js_dash_url,
                ['wow2-ui-elements'],
                filemtime($js_dash_path),
                true
            );
            wow_assets_log('Enqueue JS (dashboard): ' . $js_dash_url);
        } else {
            wow_assets_log('Skip JS (dashboard) — file not found: ' . $js_dash_rel);
        }

        /* ---------- 2) Icon Menu ---------- */
        $js_icon_menu = 'build/dashboard/icon_menu.js';
        if (file_exists(DL_CORE_PATH . $js_icon_menu)) {
            wp_enqueue_script(
                'wow-icon-menu',
                DL_CORE_URL . $js_icon_menu,
                ['wow2-ui-elements', 'wow-creator-dashboard'],
                filemtime(DL_CORE_PATH . $js_icon_menu),
                true
            );
            wow_assets_log('Enqueue JS (icon menu): ' . $js_icon_menu);
        } else {
            wow_assets_log('Skip JS (icon menu) — file not found: ' . $js_icon_menu);
        }

        /* ---------- 3) Element Edit Form ---------- */
        $js_elem_edit = 'build/dashboard/element_edit_form.js';
        if (file_exists(DL_CORE_PATH . $js_elem_edit)) {
            wp_enqueue_script(
                'wow-element-edit',
                DL_CORE_URL . $js_elem_edit,
                ['wow2-ui-elements', 'wow-creator-dashboard', 'wow-icon-menu'],
                filemtime(DL_CORE_PATH . $js_elem_edit),
                true
            );
            wow_assets_log('Enqueue JS (element edit): ' . $js_elem_edit);
        } else {
            wow_assets_log('Skip JS (element edit) — file not found: ' . $js_elem_edit);
        }

        /* ---------- 4) Element Table ---------- */
        $js_elem_table = 'build/dashboard/element_table.js';
        if (file_exists(DL_CORE_PATH . $js_elem_table)) {
            wp_enqueue_script(
                'wow-element-table',
                DL_CORE_URL . $js_elem_table,
                ['wow2-ui-elements', 'wow-creator-dashboard', 'wow-icon-menu', 'wow-element-edit'],
                filemtime(DL_CORE_PATH . $js_elem_table),
                true
            );
            wow_assets_log('Enqueue JS (element table): ' . $js_elem_table);
        } else {
            wow_assets_log('Skip JS (element table) — file not found: ' . $js_elem_table);
        }

        /* ---------- 5) Ticket Table ---------- */
        $js_ticket_table = 'build/dashboard/ticket_table.js';
        if (file_exists(DL_CORE_PATH . $js_ticket_table)) {
            wp_enqueue_script(
                'wow-ticket-table',
                DL_CORE_URL . $js_ticket_table,
                ['wow2-ui-elements', 'wow-creator-dashboard', 'wow-element-edit'],
                filemtime(DL_CORE_PATH . $js_ticket_table),
                true
            );
            wow_assets_log('Enqueue JS (ticket table): ' . $js_ticket_table);
        } else {
            wow_assets_log('Skip JS (ticket table) — file not found: ' . $js_ticket_table);
        }

        /* ---------- 6) Voucher Table ---------- */
        $js_voucher_table = 'build/dashboard/voucher_table.js';
        if (file_exists(DL_CORE_PATH . $js_voucher_table)) {
            wp_enqueue_script(
               'wow-voucher-table',
               DL_CORE_URL . $js_voucher_table,
               // deps: needs UI helpers, dashboard shell, icon menu (and element-edit if you call into it)
               ['wow2-ui-elements', 'wow-creator-dashboard', 'wow-icon-menu', 'wow-element-edit'],
               filemtime(DL_CORE_PATH . $js_voucher_table),
               true
            );
            wow_assets_log('Enqueue JS (voucher table): ' . $js_voucher_table);
        } else {
            wow_assets_log('Skip JS (voucher table) — file not found: ' . $js_voucher_table);
        }

        /* ---------- 7) Post Table ---------- */
        $js_post_table = 'build/dashboard/post_table.js';
        if (file_exists(DL_CORE_PATH . $js_post_table)) {
            wp_enqueue_script(
                'wow-post-table',
                DL_CORE_URL . $js_post_table,
                // needs UI helpers + dashboard shell + icon menu (+ edit form if you call into it)
                ['wow2-ui-elements', 'wow-creator-dashboard', 'wow-icon-menu', 'wow-element-edit'],
                filemtime(DL_CORE_PATH . $js_post_table),
                true
            );
            wow_assets_log('Enqueue JS (post table): ' . $js_post_table);
        } else {
            wow_assets_log('Skip JS (post table) — file not found: ' . $js_post_table);
        }

        /* ---------- 8) Main Tab ---------- */
        $js_main_tab = 'build/dashboard/main_tab.js';
        if (file_exists(DL_CORE_PATH . $js_main_tab)) {
            wp_enqueue_script(
                'wow-main-tab',
                DL_CORE_URL . $js_main_tab,
                // needs UI helpers + dashboard shell + icon menu (+ edit form if you call into it)
                ['wow2-ui-elements', 'wow-creator-dashboard', 'wow-icon-menu', 'wow-element-edit'],
                filemtime(DL_CORE_PATH . $js_main_tab),
                true
            );
            wow_assets_log('Enqueue JS (post table): ' . $js_main_tab);
        } else {
            wow_assets_log('Skip JS (post table) — file not found: ' . $js_main_tab);
        }
        
        /* ---------- 9) activate_element ---------- */
        $js_activate_element = 'build/dashboard/activate_element.js';
        if (file_exists(DL_CORE_PATH . $js_activate_element)) {
            wp_enqueue_script(
                'wow-activate-element',
                DL_CORE_URL . $js_activate_element,
                // needs UI helpers + dashboard shell + icon menu (+ edit form if you call into it)
                ['wow2-ui-elements', 'wow-creator-dashboard', 'wow-icon-menu', 'wow-element-edit'],
                filemtime(DL_CORE_PATH . $js_activate_element),
                true
            );
            wow_assets_log('Enqueue JS (post table): ' . $js_activate_element);
        } else {
            wow_assets_log('Skip JS (post table) — file not found: ' . $js_activate_element);
        }

    }

    wow_assets_log('wow_enqueue_public_assets() EXIT');
   }



   
   add_action('wp_enqueue_scripts', 'wow_enqueue_public_assets');
