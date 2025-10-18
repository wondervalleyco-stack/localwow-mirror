<?php
/**
 * LocalWow — Assets Enqueue
 *
 * Purpose:
 * - Load our Tailwind, CSS, and page-specific JS files.
 * - Only enqueue on the two Creator pages:
 *     /creator-login         (slug: creator-login)
 *     /creator-dashboard     (slug: creator-dashboard)
 *
 * Conventions:
 * - Readable, no one-liners that hide logic.
 * - All logic logged to error_log() when $log = true.
 */

if (!defined('ABSPATH')) exit; // Safety check.

/* ------------------------------------------------------------
   Logging toggle (info logs only)
------------------------------------------------------------- */
$log = true;

function wow_assets_log($msg)
{
    global $log;
    if ($log) error_log('[WOW][assets] ' . $msg);
}

/* ------------------------------------------------------------
   Fallback constants
------------------------------------------------------------- */
if (!defined('DL_CORE_PATH')) {
    define('DL_CORE_PATH', plugin_dir_path(__DIR__)); // /.../mu-plugins/dl-core/
}
if (!defined('DL_CORE_URL')) {
    $mu_rel = '/mu-plugins/dl-core/';
    define('DL_CORE_URL', trailingslashit(content_url()) . ltrim($mu_rel, '/'));
}

/* ------------------------------------------------------------
   Page detection helpers
------------------------------------------------------------- */
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

/* ------------------------------------------------------------
   Main enqueue logic
------------------------------------------------------------- */
function wow_enqueue_public_assets()
{
    wow_assets_log('wow_enqueue_public_assets() ENTER');

    if (is_admin()) {
        wow_assets_log('Abort: is_admin() true');
        return;
    }

    $on_login     = wow_is_creator_login_page();
    $on_dashboard = wow_is_creator_dashboard_page();

    if (!$on_login && !$on_dashboard) {
        wow_assets_log('Abort: not a creator page');
        return;
    }

    /* ---------- Tailwind (global) ---------- */
    wp_enqueue_script('tailwindcdn', 'https://cdn.tailwindcss.com', [], null, false);
    wow_assets_log('Enqueue Tailwind CDN');

    /* ---------- CSS (optional shared styles) ---------- */
    $v5_handle = 'wow-v5';
    $v5_url    = DL_CORE_URL . 'css/v5.css';
    $v5_ver    = file_exists(DL_CORE_PATH . 'css/v5.css') ? filemtime(DL_CORE_PATH . 'css/v5.css') : null;
    wp_enqueue_style($v5_handle, $v5_url, [], $v5_ver);
    wow_assets_log('Enqueue CSS: ' . $v5_url);

    /* ---------- JS: per-page ---------- */
    if ($on_login) {
        $js_login_handle = 'wow-creator-auth';
        $js_login_rel    = 'build/auth/creator_auth.js';
        $js_login_path   = DL_CORE_PATH . $js_login_rel;
        $js_login_url    = DL_CORE_URL . $js_login_rel;
        $js_login_ver    = file_exists($js_login_path) ? filemtime($js_login_path) : null;

        if (file_exists($js_login_path)) {
            wp_enqueue_script($js_login_handle, $js_login_url, [], $js_login_ver, true);
            wow_assets_log('Enqueue JS (login): ' . $js_login_url);
        } else {
            wow_assets_log('Skip JS (login) — file not found: ' . $js_login_rel);
        }
    }

    if ($on_dashboard) {
        $js_dash_handle = 'wow-creator-dashboard';
        $js_dash_rel    = 'build/dashboard/creator_dashboard.js';
        $js_dash_path   = DL_CORE_PATH . $js_dash_rel;
        $js_dash_url    = DL_CORE_URL . $js_dash_rel;
        $js_dash_ver    = file_exists($js_dash_path) ? filemtime($js_dash_path) : null;

        if (file_exists($js_dash_path)) {
            wp_enqueue_script($js_dash_handle, $js_dash_url, [], $js_dash_ver, true);
            wow_assets_log('Enqueue JS (dashboard): ' . $js_dash_url);
        } else {
            wow_assets_log('Skip JS (dashboard) — file not found: ' . $js_dash_rel);
        }
    }

    wow_assets_log('wow_enqueue_public_assets() EXIT');
}
add_action('wp_enqueue_scripts', 'wow_enqueue_public_assets');
