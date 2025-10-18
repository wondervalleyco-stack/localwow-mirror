<?php
if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
    register_rest_route('dl-core/v1', '/health', [
        'methods'  => 'GET',
        'permission_callback' => '__return_true', // public endpoint
        'callback' => function (WP_REST_Request $req) {
            return [
                'ok'      => true,
                'version' => defined('DL_CORE_VERSION') ? DL_CORE_VERSION : 'unknown',
                'env'     => apply_filters('dl_core_env_label', 'UNKNOWN'),
                'time'    => gmdate('c'),
                'php'     => PHP_VERSION,
                'wp'      => get_bloginfo('version'),
            ];
        },
    ]);
});
