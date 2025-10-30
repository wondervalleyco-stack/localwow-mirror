<?php
if (!defined('ABSPATH')) exit;

/**
 * Limits (bytes)
 */
const WOW_IMG_MAX = 4 * 1024 * 1024;   // 4 MB
const WOW_VID_MAX = 25 * 1024 * 1024;  // 25 MB

/**
 * Allowed mimes
 */
function wow_media_allowed_mimes() {
  return [
    // images
    'jpg|jpeg|jpe' => 'image/jpeg',
    'png'          => 'image/png',
    'webp'         => 'image/webp',
    'gif'          => 'image/gif',
    // videos
    'mp4'          => 'video/mp4',
    'mov|qt'       => 'video/quicktime',
    'webm'         => 'video/webm',
  ];
}

/**
 * Helper: current creator id
 */
function wow_media_current_creator_id() {
  return wow_current_creator_id();
}

/* --------------------------------------------------------------------------
   REST ROUTES
   -------------------------------------------------------------------------- */
add_action('rest_api_init', function () {
  register_rest_route('wow/v1', '/media', [
    'methods'             => 'POST',
    'callback'            => 'wow_media_upload',
    'permission_callback' => 'wow_rest_creator_only',
    'args'                => [
      'creator_name' => [],
      'element_name' => [],
      'basename'     => [],
    ],
  ]);

  register_rest_route('wow/v1', '/media/(?P<id>\d+)', [
    'methods'             => 'DELETE',
    'callback'            => 'wow_media_delete',
    'permission_callback' => 'wow_rest_creator_only',
    'args'                => [ 'id' => [ 'validate_callback' => fn($v)=>ctype_digit((string)$v) ] ],
  ]);
});

/* --------------------------------------------------------------------------
   POST /wow/v1/media
   Upload file → WP Media Library + wow_uploaded_media row
   -------------------------------------------------------------------------- */
function wow_media_upload( WP_REST_Request $req ) {
  if (empty($_FILES['file'])) {
    return new WP_Error('bad_request', 'Missing file field "file"', ['status' => 400]);
  }

  $creator_id = wow_media_current_creator_id();
  if (!$creator_id) {
    return new WP_Error('forbidden', 'Not authorized', ['status' => 401]);
  }

  $creator_name = trim((string)$req->get_param('creator_name'));
  $element_name = trim((string)$req->get_param('element_name'));
  $basename     = trim((string)$req->get_param('basename'));
  $file = $_FILES['file'];

  // MIME & size validation
  $wp_filetype = wp_check_filetype_and_ext($file['tmp_name'], $file['name'], wow_media_allowed_mimes());
  if (empty($wp_filetype['ext']) || empty($wp_filetype['type'])) {
    return new WP_Error('bad_mime', 'Unsupported file type', ['status' => 400]);
  }

  $mime = $wp_filetype['type'];
  $is_image = strpos($mime, 'image/') === 0;
  $is_video = strpos($mime, 'video/') === 0;

  if (!$is_image && !$is_video) {
    return new WP_Error('bad_mime', 'Only images and videos are allowed', ['status' => 400]);
  }

  $max = $is_image ? WOW_IMG_MAX : WOW_VID_MAX;
  if ((int)$file['size'] > $max) {
    return new WP_Error('too_large', $is_image ? 'Image exceeds 4MB' : 'Video exceeds 25MB', ['status' => 413]);
  }

  // Build filename: creator_element_original.ext
  $parts = [];
  if ($creator_name !== '') $parts[] = $creator_name;
  if ($element_name !== '') $parts[] = $element_name;

  $orig_no_ext = pathinfo($file['name'], PATHINFO_FILENAME);
  $final_base  = $basename !== '' ? $basename : $orig_no_ext;
  $parts[]     = $final_base;

  $joined      = implode('_', array_filter($parts));
  $ext         = pathinfo($file['name'], PATHINFO_EXTENSION);
  $target_name = sanitize_file_name($joined . ($ext ? ('.' . $ext) : ''));

  // Upload to WP
  require_once ABSPATH . 'wp-admin/includes/file.php';
  $override = [
    'test_form' => false,
    'mimes'     => wow_media_allowed_mimes(),
  ];

  $original_name = $file['name'];
  $_FILES['file']['name'] = $target_name;

  $uploaded = wp_handle_upload($_FILES['file'], $override);
  $_FILES['file']['name'] = $original_name;

  if (!empty($uploaded['error'])) {
    return new WP_Error('upload_error', $uploaded['error'], ['status' => 500]);
  }

  $file_url  = $uploaded['url'];
  $file_path = $uploaded['file'];

  // Create attachment
  require_once ABSPATH . 'wp-admin/includes/image.php';
  require_once ABSPATH . 'wp-admin/includes/media.php';

  $attachment = [
    'post_mime_type' => $mime,
    'post_title'     => preg_replace('/\.[^.]+$/', '', basename($file_path)),
    'post_content'   => '',
    'post_status'    => 'inherit'
  ];

  $attach_id = wp_insert_attachment($attachment, $file_path);
  if (is_wp_error($attach_id)) {
    @unlink($file_path);
    return new WP_Error('attach_error', $attach_id->get_error_message(), ['status' => 500]);
  }

  $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
  wp_update_attachment_metadata($attach_id, $attach_data);

  // Save to DB
  global $wpdb;
  $ok = $wpdb->insert(
    'wow_uploaded_media',
    [
      'creator_id'    => (int)$creator_id,
      'attachment_id' => (int)$attach_id,
      'link_in_wp_lib'=> $file_url,
      'type'          => $is_image ? 'image' : 'video',
      'size_bytes'    => (int)filesize($file_path),
      'created_at'    => current_time('mysql'),
    ],
    ['%d','%d','%s','%s','%d','%s']
  );
  if (!$ok) {
    wp_delete_attachment($attach_id, true);
    return new WP_Error('db_error', 'Failed saving media record', ['status' => 500]);
  }

  $media_id = (int)$wpdb->insert_id;

  return new WP_REST_Response([
    'media_id'      => $media_id,
    'attachment_id' => (int)$attach_id,
    'url'           => $file_url,
    'type'          => $is_image ? 'image' : 'video',
    'size_bytes'    => (int)filesize($file_path),
    'created_at'    => current_time('mysql'),
  ], 201);
}

/* --------------------------------------------------------------------------
   DELETE /wow/v1/media/{id}
   Also reusable via wow_delete_uploaded_media_hard()
   -------------------------------------------------------------------------- */
function wow_media_delete( WP_REST_Request $req ) {
  $creator_id = wow_media_current_creator_id();
  $id = (int)$req['id'];

  $result = wow_delete_uploaded_media_hard($id, $creator_id);
  if (is_wp_error($result)) return $result;

  return new WP_REST_Response(['ok' => true, 'deleted_media_id' => $id], 200);
}

/* --------------------------------------------------------------------------
   Helper: delete a media row + attachment (used by element-post delete too)
   -------------------------------------------------------------------------- */
function wow_delete_uploaded_media_hard($media_id, $creator_id) {
  global $wpdb;

  $row = $wpdb->get_row(
    $wpdb->prepare('SELECT media_id, creator_id, attachment_id FROM wow_uploaded_media WHERE media_id=%d', $media_id),
    ARRAY_A
  );
  if (!$row) return new WP_Error('not_found', 'Media not found', ['status' => 404]);
  if ((int)$row['creator_id'] !== (int)$creator_id) {
    return new WP_Error('forbidden', 'Media does not belong to this creator', ['status' => 403]);
  }

  // Delete attachment (physical file)
  if (!empty($row['attachment_id'])) {
    wp_delete_attachment((int)$row['attachment_id'], true);
  }

  // Remove DB row
  $wpdb->delete('wow_uploaded_media', ['media_id' => $media_id], ['%d']);

  return true;
}
