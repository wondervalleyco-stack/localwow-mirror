<?php
/*
Plugin Name: DL Core (MU)
Description: DeeperLocal core loader
Version: 0.0.1
*/
if (!defined('ABSPATH')) exit;

define('DL_CORE_VERSION', '0.0.1');
define('DL_CORE_PATH', plugin_dir_path(__FILE__));
define('DL_CORE_URL', plugin_dir_url(__FILE__));

// NEW path after reorg:
require_once DL_CORE_PATH . 'inc/setup/loader.php';
