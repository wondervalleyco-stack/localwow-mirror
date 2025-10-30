<?php
// Block direct access if WordPress didn't bootstrap
if (!defined('ABSPATH')) exit;

/**
 * Simple environment label we'll show on the Diagnostics page later.
 * You can change this string anytime.
 */
add_filter('dl_core_env_label', function () {
    return 'PRODUCTION';
});
// ------------------------------------------------------------
//  LOADER — boot sequence for dl-core
// ------------------------------------------------------------

// 1. shared
require_once __DIR__ . '/../shared/security.php';
require_once __DIR__ . '/../shared/db-creator.php';
require_once __DIR__ . '/../shared/assets-enqueue.php';
require_once __DIR__ . '/../shared/rest-creator-me.php';
require_once __DIR__ . '/../shared/rest-media-upload.php';


// 2. creator modules
require_once __DIR__ . '/../creator-auth/rest-creator-auth.php';
require_once __DIR__ . '/../creator-dashboard/rest-creator-dashboard.php';

// 3. diagnostics & health
require_once __DIR__ . '/admin-diagnostics.php';
require_once __DIR__ . '/rest-healthcheck.php';

// 4. elements
require_once __DIR__ . '/../elements/elements.php';
require_once __DIR__ . '/../elements/element-posts.php';







