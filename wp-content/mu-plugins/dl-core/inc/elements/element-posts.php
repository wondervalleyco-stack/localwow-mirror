<?php
/**
 * =============================================================================
 *  FILE: inc/elements/element_posts.php
 *  PURPOSE:
 *    REST + DB logic for Element Posts (POST/LINK):
 *      - next-position helper
 *      - create/update (with position)
 *      - delete
 *      - reorder (move UP/DOWN by swapping)
 *      - list (sorted)
 * -----------------------------------------------------------------------------
 *  TABLE: wow_element_posts
 *    post_id (PK, AUTO_INCREMENT)
 *    element_id (INT NOT NULL)
 *    kind (VARCHAR 20)   -- 'POST' | 'LINK'
 *    title (TEXT)
 *    body_text (LONGTEXT)
 *    link_url (TEXT NULL)
 *    media_id (BIGINT NULL)
 *    position (INT)      -- 1..N within element
 *    created_at (DATETIME)
 *    updated_at (DATETIME)
 * =============================================================================
 */

if (!defined('ABSPATH')) exit;

/* ============================================================================
 * 1) REGISTER ROUTES
 * ==========================================================================*/
add_action('rest_api_init', 'wow_register_element_posts_routes');

function wow_register_element_posts_routes() {
  $ns = 'wow/v1';

  // Create/Update + Load list (sorted)
  register_rest_route($ns, '/element-posts', [
    [
      'methods'             => 'POST',
      'callback'            => 'wow_rest_save_element_post',
      'permission_callback' => '__return_true',
    ],
    [
      'methods'             => 'GET',
      'callback'            => 'wow_rest_get_element_posts',
      'permission_callback' => '__return_true',
    ],
  ]);

  // Delete one
  register_rest_route($ns, '/element-posts/(?P<post_id>\d+)', [
    'methods'             => 'DELETE',
    'callback'            => 'wow_rest_delete_element_post',
    'permission_callback' => '__return_true',
  ]);

  // Next position
  register_rest_route($ns, '/element-posts/next-position', [
    'methods'             => 'GET',
    'callback'            => 'wow_rest_get_next_post_position',
    'permission_callback' => '__return_true',
  ]);

  // Reorder (UP/DOWN)
  register_rest_route($ns, '/element-posts/reorder', [
    'methods'             => 'POST',
    'callback'            => 'wow_rest_reorder_element_post',
    'permission_callback' => '__return_true',
  ]);
}


/* ============================================================================
 * 2) GET NEXT POSITION FOR A GIVEN ELEMENT
 *    Response: { next_position: int }
 * ==========================================================================*/
function wow_rest_get_next_post_position(WP_REST_Request $req) {
  global $wpdb;
  $table = 'wow_element_posts';

  $element_id = intval($req->get_param('element_id'));
  if (!$element_id) {
    return new WP_Error('missing_param', 'element_id is required', ['status' => 400]);
  }

  $max  = $wpdb->get_var($wpdb->prepare("SELECT MAX(position) FROM {$table} WHERE element_id=%d", $element_id));
  $next = $max ? ($max + 1) : 1;

  return ['next_position' => intval($next)];
}


/* ============================================================================
 * 3) SAVE (CREATE OR UPDATE) POST
 *    Request JSON (exactly as JS sends):
 *      {
 *        "post_id": nullable int,
 *        "element_id": int,
 *        "kind": "POST"|"LINK",
 *        "title": string,
 *        "body_text": string,
 *        "link_url": string|null,
 *        "media_id": int|null,
 *        "position": int (optional on create; computed if missing)
 *      }
 *    Response: normalized row (same keys)
 * ==========================================================================*/
function wow_rest_save_element_post(WP_REST_Request $req) {
  global $wpdb;
  $table = 'wow_element_posts';

  $j = $req->get_json_params();
  if (!is_array($j)) $j = [];

  // Required
  $element_id = intval($j['element_id'] ?? 0);
  if ($element_id <= 0) {
    return new WP_Error('missing_param', 'element_id is required', ['status' => 400]);
  }

  // Normalize inputs (align with JS)
  $post_id   = intval($j['post_id'] ?? 0);
  $kind      = strtoupper(sanitize_text_field($j['kind'] ?? 'POST'));
  if ($kind !== 'POST' && $kind !== 'LINK') $kind = 'POST';

  $title     = sanitize_text_field($j['title'] ?? '');
  $body_text = isset($j['body_text']) ? wp_kses_post($j['body_text']) : '';
  $link_url  = array_key_exists('link_url', $j) ? esc_url_raw($j['link_url']) : null;
  if ($link_url === '') $link_url = null;

  $media_id  = array_key_exists('media_id', $j) ? intval($j['media_id']) : null;
  if ($media_id === 0) $media_id = null;

  $position  = isset($j['position']) ? intval($j['position']) : 0;
  $now       = current_time('mysql');

  if ($post_id <= 0) {
    // CREATE
    if ($position <= 0) {
      $max = $wpdb->get_var($wpdb->prepare("SELECT MAX(position) FROM {$table} WHERE element_id=%d", $element_id));
      $position = $max ? ($max + 1) : 1;
    }

    $ins = [
      'element_id' => $element_id,
      'kind'       => $kind,
      'title'      => $title,
      'body_text'  => $body_text,
      'link_url'   => $link_url,
      'media_id'   => $media_id,
      'position'   => $position,
      'created_at' => $now,
      'updated_at' => $now,
    ];
    $ok = $wpdb->insert($table, $ins);
    if ($ok === false) {
      return new WP_Error('db_insert_failed', 'Failed to create post', ['status' => 500]);
    }
    $post_id = intval($wpdb->insert_id);

    return [
      'post_id'    => $post_id,
      'element_id' => $element_id,
      'kind'       => $kind,
      'title'      => $title,
      'body_text'  => $body_text,
      'link_url'   => $link_url,
      'media_id'   => $media_id,
      'position'   => $position,
      'created_at' => $now,
      'updated_at' => $now,
    ];

  } else {
    // UPDATE (position changes are handled via reorder endpoint)
    $upd = [
      'kind'       => $kind,
      'title'      => $title,
      'body_text'  => $body_text,
      'link_url'   => $link_url,
      'media_id'   => $media_id,
      'updated_at' => $now,
    ];
    $ok = $wpdb->update($table, $upd, ['post_id' => $post_id]);
    if ($ok === false) {
      return new WP_Error('db_update_failed', 'Failed to update post', ['status' => 500]);
    }

    $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE post_id=%d", $post_id));
    if (!$row) {
      return new WP_Error('not_found', 'Post not found after update', ['status' => 404]);
    }

    return [
      'post_id'    => intval($row->post_id),
      'element_id' => intval($row->element_id),
      'kind'       => (string)$row->kind,
      'title'      => (string)$row->title,
      'body_text'  => (string)$row->body_text,
      'link_url'   => ($row->link_url !== null && $row->link_url !== '') ? (string)$row->link_url : null,
      'media_id'   => ($row->media_id !== null) ? intval($row->media_id) : null,
      'position'   => intval($row->position),
      'created_at' => (string)$row->created_at,
      'updated_at' => (string)$row->updated_at,
    ];
  }
}


/* ============================================================================
 * 4) DELETE POST
 *    Path param: post_id
 *    Response: { deleted: true, post_id: X }
 * ==========================================================================*/
function wow_rest_delete_element_post(WP_REST_Request $req) {
  global $wpdb;
  $table = 'wow_element_posts';

  $post_id = intval($req->get_param('post_id'));
  if ($post_id <= 0) {
    return new WP_Error('missing_post_id', 'post_id required', ['status' => 400]);
  }

  $ok = $wpdb->delete($table, ['post_id' => $post_id]);
  if ($ok === false) {
    return new WP_Error('db_delete_failed', 'Failed to delete post', ['status' => 500]);
  }

  return ['deleted' => true, 'post_id' => $post_id];
}


/* ============================================================================
 * 5) REORDER POSTS (MOVE UP / DOWN)
 *    Request JSON: { post_id: int, direction: "UP" | "DOWN" }
 *    Response: { moved: bool, direction: "UP"|"DOWN", reason?: string }
 * ==========================================================================*/
function wow_rest_reorder_element_post(WP_REST_Request $req) {
  global $wpdb;
  $table = 'wow_element_posts';

  $j = $req->get_json_params();
  if (!is_array($j)) $j = [];

  $post_id   = intval($j['post_id'] ?? 0);
  $direction = strtoupper(sanitize_text_field($j['direction'] ?? ''));

  if ($post_id <= 0 || !in_array($direction, ['UP','DOWN'], true)) {
    return new WP_Error('invalid_params', 'Invalid post_id or direction', ['status' => 400]);
  }

  // Current row
  $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table} WHERE post_id=%d", $post_id));
  if (!$row) return new WP_Error('not_found', 'Post not found', ['status' => 404]);

  $op   = ($direction === 'UP') ? '<' : '>';
  $sort = ($direction === 'UP') ? 'DESC' : 'ASC';

  // Neighbor within same element
  $neighbor = $wpdb->get_row($wpdb->prepare("
    SELECT * FROM {$table}
    WHERE element_id=%d AND position {$op} %d
    ORDER BY position {$sort}
    LIMIT 1
  ", intval($row->element_id), intval($row->position)));

  if (!$neighbor) {
    return ['moved' => false, 'direction' => $direction, 'reason' => 'no_neighbor'];
  }

  // Swap positions (three-step using temp slot to avoid conflicts)
  $posA = intval($row->position);
  $posB = intval($neighbor->position);
  $tmp  = $posA + 1000000;

  $a1 = $wpdb->update($table, ['position' => $tmp], ['post_id' => intval($row->post_id)]);
  $a2 = $wpdb->update($table, ['position' => $posA], ['post_id' => intval($neighbor->post_id)]);
  $a3 = $wpdb->update($table, ['position' => $posB], ['post_id' => intval($row->post_id)]);

  if ($a1 === false || $a2 === false || $a3 === false) {
    return new WP_Error('db_swap_failed', 'Failed to swap positions', ['status' => 500]);
  }

  return ['moved' => true, 'direction' => $direction];
}


/* ============================================================================
 * 6) LOAD POSTS (SORTED)
 *    GET /element-posts?element_id=123
 *    Response: array of rows ordered by position ASC (then created_at ASC)
 * ==========================================================================*/
function wow_rest_get_element_posts(WP_REST_Request $req) {
  global $wpdb;
  $table = 'wow_element_posts';

  $element_id = intval($req->get_param('element_id'));
  if ($element_id <= 0) {
    return new WP_Error('missing_param', 'element_id is required', ['status' => 400]);
  }

  $rows = $wpdb->get_results($wpdb->prepare("
    SELECT *
    FROM {$table}
    WHERE element_id=%d
    ORDER BY position ASC, created_at ASC
  ", $element_id));

  $out = [];
  foreach ((array)$rows as $r) {
    $out[] = [
      'post_id'    => intval($r->post_id),
      'element_id' => intval($r->element_id),
      'kind'       => (string)$r->kind,
      'title'      => (string)$r->title,
      'body_text'  => (string)$r->body_text,
      'link_url'   => ($r->link_url !== null && $r->link_url !== '') ? (string)$r->link_url : null,
      'media_id'   => ($r->media_id !== null) ? intval($r->media_id) : null,
      'position'   => intval($r->position),
      'created_at' => (string)$r->created_at,
      'updated_at' => (string)$r->updated_at,
    ];
  }

  return $out;
}
