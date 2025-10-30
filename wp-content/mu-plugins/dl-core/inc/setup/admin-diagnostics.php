<?php
if (!defined('ABSPATH')) exit;

// ------------------------------------------------------------
// 🧩 Admin Diagnostics Screen for DL Core
// ------------------------------------------------------------
// Adds a small page in the WordPress admin under “DL Core”
// showing the plugin version, environment, and healthcheck link.
// ------------------------------------------------------------

add_action('admin_menu', function () {
    add_menu_page(
        'DL Core Diagnostics',   // Page title
        'DL Core',               // Menu title
        'manage_options',        // Capability (admins only)
        'dl-core-diagnostics',   // Slug
        'dl_core_render_diagnostics', // Callback function
        'dashicons-admin-tools', // Icon
        3                        // Position
    );
});

function dl_core_render_diagnostics() {
    $env = apply_filters('dl_core_env_label', 'UNKNOWN');

    echo '<div class="wrap">';
    echo '<h1>DL Core Diagnostics</h1>';
    echo '<table class="widefat striped" style="max-width:700px;margin-top:16px;">';
    echo '<tbody>';
    echo '<tr><td>Loaded</td><td>Yes ✅</td></tr>';
    echo '<tr><td>Version</td><td>' . esc_html(DL_CORE_VERSION) . '</td></tr>';
    echo '<tr><td>Environment</td><td>' . esc_html($env) . '</td></tr>';
    echo '<tr><td>Plugin Path</td><td>' . esc_html(DL_CORE_PATH) . '</td></tr>';
    echo '<tr><td>Plugin URL</td><td>' . esc_html(DL_CORE_URL) . '</td></tr>';
    echo '<tr><td>Healthcheck</td><td><a href="' . esc_url(site_url('/wp-json/dl-core/v1/health')) . '" target="_blank">Check Health</a></td></tr>';
    echo '</tbody>';
    echo '</table>';
    echo '</div>';
}
