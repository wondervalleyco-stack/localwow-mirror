<?php
// inc/elements/elements.php
// One file to rule Elements: create, load, update (+locks)

// Block direct access if WordPress didn’t bootstrap
if (!defined('ABSPATH')) exit;

/**
 * TABLES (no WP prefix — per your schema)
 */
const WOW_TBL_ELEMENTS       = 'wow_elements';
const WOW_TBL_TICKET_TYPES   = 'wow_ticket_types';
const WOW_TBL_VOUCHER_TYPES  = 'wow_voucher_types';
const WOW_TBL_ELEMENT_POSTS  = 'wow_element_posts';
const WOW_TBL_ELEMENT_LOCKS  = 'wow_element_locks'; // optional, used if present

/**
 * Register all routes for elements
 */
add_action('rest_api_init', function () {
  error_log('[WOW][elements] rest_api_init ENTER');

  // Create new element (used by “+ אלמנט חדש”)
  register_rest_route('wow/v1', '/elements', [
    'methods'             => 'POST',
    'callback'            => 'wow_create_element',
    'permission_callback' => 'wow_rest_creator_only',
  ]);

  // Get single element full model (+locks)
  register_rest_route('wow/v1', '/elements/(?P<id>\d+)', [
    'methods'             => 'GET',
    'callback'            => 'wow_get_element',
    'permission_callback' => 'wow_rest_creator_only',
    'args'                => [ 'id' => [ 'validate_callback' => fn($v)=>ctype_digit((string)$v) ] ],
  ]);

  // Update single element (PUT full model)
  register_rest_route('wow/v1', '/elements/(?P<id>\d+)', [
    'methods'             => 'PUT',
    'callback'            => 'wow_put_element',
    'permission_callback' => 'wow_rest_creator_only',
    'args'                => [ 'id' => [ 'validate_callback' => fn($v)=>ctype_digit((string)$v) ] ],
  ]);

  // Create/Update a ticket type
  register_rest_route('wow/v1', '/ticket-type', [
  'methods'             => 'POST',
  'callback'            => 'wow_ticket_type_save',
  'permission_callback' => 'wow_rest_creator_only',
  ]);


  error_log('[WOW][elements] rest_api_init EXIT');
});

/** Permission: our creator cookie must resolve to an id */
function wow_rest_creator_only() {
  $id = wow_current_creator_id();
  error_log('[WOW][elements] permission creator_id=' . intval($id));
  return $id > 0;
}

/* ========================================================================
 * POST /wow/v1/elements
 * Create a new element (minimal: name; defaults cover the rest)
 * ====================================================================== */
function wow_create_element( WP_REST_Request $req ) {
  error_log('[WOW][elements] create ENTER');
  global $wpdb;

  $creator_id = wow_current_creator_id();
  if (!$creator_id) {
    return new WP_Error('forbidden', 'Not authorized', ['status' => 401]);
  }

  $name = trim((string)$req->get_param('element_name'));
  if ($name === '') {
    return new WP_Error('bad_request', 'Element name required', ['status' => 400]);
  }

  // Ensure unique per creator
  $exists = $wpdb->get_var(
    $wpdb->prepare(
      "SELECT element_id FROM " . WOW_TBL_ELEMENTS . " WHERE creator_id=%d AND LOWER(element_name)=LOWER(%s) LIMIT 1",
      $creator_id, $name
    )
  );
  if ($exists) {
    return new WP_Error('duplicate', 'Element name already exists for this creator', ['status' => 409]);
  }

  // Reasonable defaults (state/type may be null initially)
  $ok = $wpdb->insert(
    WOW_TBL_ELEMENTS,
    [
      'creator_id'      => (int)$creator_id,
      'element_name'    => $name,
      'element_state'   => 'IN_CREATION',
      // element_type stays NULL until user chooses (HOST|SERVICE|PRODUCTION)
      'created_at'      => current_time('mysql'),
      'updated_at'      => current_time('mysql'),
    ],
    ['%d','%s','%s','%s','%s']
  );
  if (!$ok) {
    return new WP_Error('db_error', 'Failed to create element', ['status' => 500]);
  }

  $id = (int) $wpdb->insert_id;
  error_log('[WOW][elements] CREATED id='.$id);

  return new WP_REST_Response(
    ['element_id'=>$id,'creator_id'=>(int)$creator_id,'element_name'=>$name],
    201
  );
}

/* ========================================================================
 * GET /wow/v1/elements/{id}
 * Returns full element model + locks (and can be extended later)
 * ====================================================================== */
function wow_get_element( WP_REST_Request $req ) {
  global $wpdb;

  $creator_id = wow_current_creator_id();
  $id = (int) $req['id'];

  $row = $wpdb->get_row(
    $wpdb->prepare(
      "SELECT * FROM " . WOW_TBL_ELEMENTS . " WHERE element_id=%d AND creator_id=%d LIMIT 1",
      $id, $creator_id
    ),
    ARRAY_A
  );
  if (!$row) {
    return new WP_Error('not_found', 'Element not found', ['status' => 404]);
  }

  $model = wow_elements_serialize_element($row);
  $model['locks'] = wow_elements_fetch_locks_for($row);

  return new WP_REST_Response($model, 200);
}

/* ========================================================================
 * PUT /wow/v1/elements/{id}
 * Accept a full model and update allowed fields on the base table
 * (tickets/vouchers/posts can get their own endpoints later)
 * ====================================================================== */
function wow_put_element( WP_REST_Request $req ) {
  global $wpdb;

  $creator_id = wow_current_creator_id();
  $id = (int) $req['id'];

  $row = $wpdb->get_row(
    $wpdb->prepare(
      "SELECT * FROM " . WOW_TBL_ELEMENTS . " WHERE element_id=%d AND creator_id=%d LIMIT 1",
      $id, $creator_id
    ),
    ARRAY_A
  );
  if (!$row) {
    return new WP_Error('not_found', 'Element not found', ['status' => 404]);
  }

  $payload = json_decode($req->get_body(), true);
  if (!is_array($payload)) {
    return new WP_Error('bad_request', 'Invalid JSON body', ['status' => 400]);
  }

  // Map only the columns you allow to change
  $update = wow_elements_pick_update_fields($payload);

  if (!empty($update)) {
    $update['updated_at'] = current_time('mysql');

    // Build formats
    $formats = wow_elements_formats_for($update);

    $ok = $wpdb->update(
      WOW_TBL_ELEMENTS,
      $update,
      [ 'element_id' => $id ],
      $formats,
      [ '%d' ]
    );

    if ($ok === false) {
      return new WP_Error('db_error', 'Failed to update element', ['status' => 500]);
    }
  }

  // Return fresh model
  $fresh = $wpdb->get_row(
    $wpdb->prepare("SELECT * FROM " . WOW_TBL_ELEMENTS . " WHERE element_id=%d LIMIT 1", $id),
    ARRAY_A
  );
  $model = wow_elements_serialize_element($fresh);
  $model['locks'] = wow_elements_fetch_locks_for($fresh);

  return new WP_REST_Response($model, 200);
}

/* ========================================================================
 * Helpers
 * ====================================================================== */

/** Convert DB row to API model (field names = your DB columns) */
function wow_elements_serialize_element(array $r) {
  // Return as-is (you can massage types if needed)
  return [
    'element_id'                => (int)$r['element_id'],
    'creator_id'                => (int)$r['creator_id'],
    'element_name'              => (string)$r['element_name'],
    'element_state'             => (string)$r['element_state'],
    'element_type'              => $r['element_type'], // may be NULL
    'min_participants'          => wow_i_or_null($r['min_participants']),
    'max_participants'          => wow_i_or_null($r['max_participants']),
    'over_min_percent'          => wow_i_or_null($r['over_min_percent']),
    'min_time_slots'            => wow_i_or_null($r['min_time_slots']),
    'duration_minutes'          => wow_i_or_null($r['duration_minutes']),
    'price_per_time_slot'       => wow_d_or_null($r['price_per_time_slot']),
    'location_text'             => $r['location_text'],
    'max_per_hour'              => wow_i_or_null($r['max_per_hour']),
    'min_participants_threshold'=> wow_i_or_null($r['min_participants_threshold']),
    'currency_code'             => $r['currency_code'],
    'language_code'             => $r['language_code'],
    'hero_kind'                 => $r['hero_kind'],
    'hero_link'                 => $r['hero_link'],
    'hero_media_id'             => $r['hero_media_id'],
    'hero_headline'             => $r['hero_headline'],
    'hero_text'                 => $r['hero_text'],
    'created_at'                => $r['created_at'],
    'updated_at'                => $r['updated_at'],
  ];
}


/** Serialize a ticket type DB row to API fields */
function wow_ticket_type_serialize(array $r) {
  return [
    'ticket_type_id'   => (int)$r['ticket_type_id'],
    'element_id'       => (int)$r['element_id'],
    'name'             => (string)$r['name'],
    'kind'             => (string)$r['kind'], // 'SINGLE' | 'GROUP'
    'group_min'        => ($r['group_min'] === null ? null : (int)$r['group_min']),
    'group_max'        => ($r['group_max'] === null ? null : (int)$r['group_max']),
    'price_per_person' => (float)$r['price_per_person'],
    'max_for_sale'     => ($r['max_for_sale'] === null ? null : (int)$r['max_for_sale']),
    'ticket_text'      => $r['ticket_text'],
    'created_at'       => $r['created_at'],
    'updated_at'       => $r['updated_at'],
  ];
}


/** Pick only allowed fields for update from the PUT payload */
function wow_elements_pick_update_fields(array $p) {
  // NOTE: element_state is NOT updated here; “Activate” flow handles that
  $allowed = [
    'element_name',
    'element_type',                 // HOST|SERVICE|PRODUCTION
    'min_participants',
    'max_participants',
    'over_min_percent',
    'min_time_slots',
    'duration_minutes',
    'price_per_time_slot',
    'location_text',
    'max_per_hour',
    'min_participants_threshold',
    'currency_code',
    'language_code',
    'hero_kind',                    // 'embed' | 'post'
    'hero_link',
    'hero_media_id',
    'hero_headline',
    'hero_text',
  ];

  $out = [];
  foreach ($allowed as $k) {
    if (array_key_exists($k, $p)) {
      $out[$k] = wow_elements_coerce($k, $p[$k]);
    }
  }
  return $out;
}

/** Coerce incoming value types */
function wow_elements_coerce($key, $val) {
  // ints
  $ints = [
    'min_participants','max_participants','over_min_percent','min_time_slots',
    'duration_minutes','max_per_hour','min_participants_threshold'
  ];
  if (in_array($key, $ints, true)) {
    return ($val === '' || $val === null) ? null : intval($val);
  }

  // decimals
  if ($key === 'price_per_time_slot') {
    return ($val === '' || $val === null) ? null : (float)$val;
  }

  // strings
  return ($val === null) ? null : (string)$val;
}

/** Formats for wpdb->update by key */
function wow_elements_formats_for(array $assoc) {
  $map = [
    'element_name'                => '%s',
    'element_type'                => '%s',
    'min_participants'            => '%d',
    'max_participants'            => '%d',
    'over_min_percent'            => '%d',
    'min_time_slots'              => '%d',
    'duration_minutes'            => '%d',
    'price_per_time_slot'         => '%f',
    'location_text'               => '%s',
    'max_per_hour'                => '%d',
    'min_participants_threshold'  => '%d',
    'currency_code'               => '%s',
    'language_code'               => '%s',
    'hero_kind'                   => '%s',
    'hero_link'                   => '%s',
    'hero_media_id'               => '%s',
    'hero_headline'               => '%s',
    'hero_text'                   => '%s',
    'updated_at'                  => '%s',
  ];
  $out = [];
  foreach ($assoc as $k => $_) {
    $out[] = $map[$k] ?? '%s';
  }
  return $out;
}

/** Fetch locks for a row (if table exists), else compute defaults */
function wow_elements_fetch_locks_for(array $row) {
  global $wpdb;

  // Try DB locks
  $has_table = $wpdb->get_var(
    $wpdb->prepare("SHOW TABLES LIKE %s", WOW_TBL_ELEMENT_LOCKS)
  );
  if ($has_table) {
    $locks = $wpdb->get_results(
      "SELECT path, rule FROM " . WOW_TBL_ELEMENT_LOCKS . " ORDER BY lock_id ASC",
      ARRAY_A
    );
    if (is_array($locks)) return $locks;
  }

  // Fallback “computed” (same logic the JS has)
  $isActive = ($row['element_state'] === 'ACTIVE');
  $locks = [];
  if ($isActive) {
    $locks[] = ['path'=>'element_type', 'rule'=>'LOCKED'];
    if ($row['element_type'] === 'HOST') {
      $locks[] = ['path'=>'duration_minutes', 'rule'=>'LOCKED'];
    }
    if ($row['element_type'] === 'SERVICE') {
      $locks[] = ['path'=>'max_per_hour', 'rule'=>'INCREASE_ONLY'];
    }
  }
  return $locks;
}

/** Small numeric helpers */
function wow_i_or_null($v) { return ($v === null || $v === '') ? null : (int)$v; }
function wow_d_or_null($v) { return ($v === null || $v === '') ? null : (float)$v; }


// inc/elements/elements.php (additions)
// Collection endpoint: GET /wow/v1/elements  → list all elements for the current creator (flat records)

if (!defined('ABSPATH')) exit;

add_action('rest_api_init', function () {
  // ...existing routes...

  // List elements (flat rows, no tickets/vouchers/posts)
  register_rest_route('wow/v1', '/elements', [
    'methods'             => 'GET',
    'callback'            => 'wow_list_elements',
    'permission_callback' => 'wow_rest_creator_only',
    'args' => [
      // optional filters/pagination
      'state'    => [ 'validate_callback' => function($v){ return in_array($v, ['IN_CREATION','ACTIVE','ARCHIVED'], true); } ],
      'page'     => [ 'validate_callback' => 'is_numeric' ],
      'per_page' => [ 'validate_callback' => 'is_numeric' ],
      'search'   => [], // optional free text on name
    ],
  ]);
});










/**
 * GET /wow/v1/elements
 * Returns FLAT element rows for the logged-in creator (no nested data).
 * Supports basic pagination and optional state/name filtering.
 */
function wow_list_elements( WP_REST_Request $req ) {
  global $wpdb;

  $creator_id = wow_current_creator_id();
  if (!$creator_id) {
    return new WP_Error('forbidden', 'Not authorized', ['status' => 401]);
  }

  // ---- filters ----
  $state    = $req->get_param('state');             // optional: IN_CREATION | ACTIVE | ARCHIVED
  $search   = trim((string)$req->get_param('search'));
  $page     = max(1, (int)($req->get_param('page') ?: 1));
  $per_page = min(500, max(1, (int)($req->get_param('per_page') ?: 100)));
  $offset   = ($page - 1) * $per_page;

  $where = ["creator_id = %d"];
  $args  = [$creator_id];

  if ($state) {
    $where[] = "element_state = %s";
    $args[]  = $state;
  }
  if ($search !== '') {
    $where[] = "LOWER(element_name) LIKE LOWER(%s)";
    $args[]  = '%' . $wpdb->esc_like($search) . '%';
  }

  $whereSql = 'WHERE ' . implode(' AND ', $where);

  // total count (for pagination, if you want to read it from headers)
  $total = (int)$wpdb->get_var(
    $wpdb->prepare("SELECT COUNT(*) FROM " . WOW_TBL_ELEMENTS . " $whereSql", $args)
  );

  // fetch page (flat rows only)
  $sql = "SELECT *
          FROM " . WOW_TBL_ELEMENTS . "
          $whereSql
          ORDER BY updated_at DESC, element_id DESC
          LIMIT %d OFFSET %d";
  $rows = $wpdb->get_results(
    $wpdb->prepare($sql, array_merge($args, [$per_page, $offset])),
    ARRAY_A
  ) ?: [];

  // serialize to API model (flat), WITHOUT locks / nested data
  $items = array_map('wow_elements_serialize_element', $rows);

  // build response with pagination headers
  $res = new WP_REST_Response($items, 200);
  $res->header('X-WOW-Total', $total);
  $res->header('X-WOW-Page', $page);
  $res->header('X-WOW-Per-Page', $per_page);

  return $res;
}


// ============================================================================
//  WOW — ELEMENTS LOAD ALL DATA FOR ONE ELEMENT
//  Returns: base element + related posts + ticket types + voucher types
//  Used when user clicks “Edit Element” in dashboard
// ============================================================================


// ---------------------------------------------------------------------------
//  1. REGISTER NEW ROUTE (GET /wow/v1/elements/{id}/all)
// ---------------------------------------------------------------------------

add_action('rest_api_init', function () {

  register_rest_route('wow/v1', '/elements/(?P<id>\d+)/all', [
    'methods'             => 'GET',
    'callback'            => 'wow_elements_load_all_for_one',
    'permission_callback' => 'wow_rest_creator_only',
    'args'                => [ 'id' => [ 'validate_callback' => fn($v)=>ctype_digit((string)$v) ] ],
  ]);

});


// ---------------------------------------------------------------------------
//  2. CALLBACK FUNCTION — wow_elements_load_all_for_one()
// ---------------------------------------------------------------------------

function wow_elements_load_all_for_one( WP_REST_Request $req ) 
{
  global $wpdb;

  // ------------------------------------------------------------
  //  STEP 1: Identify current logged-in creator
  // ------------------------------------------------------------
  $creator_id = wow_current_creator_id();
  $id         = (int) $req['id'];

  // ------------------------------------------------------------
  //  STEP 2: Make sure this element belongs to this creator
  // ------------------------------------------------------------
  $row = $wpdb->get_row(
    $wpdb->prepare(
      "SELECT * FROM " . WOW_TBL_ELEMENTS . " WHERE element_id=%d AND creator_id=%d LIMIT 1",
      $id, $creator_id
    ),
    ARRAY_A
  );

  if (!$row) 
  {
    return new WP_Error('not_found', 'Element not found', ['status' => 404]);
  }

  // ------------------------------------------------------------
  //  STEP 3: Serialize base element (reuses your helper)
  // ------------------------------------------------------------
  $element = wow_elements_serialize_element($row);

  // ------------------------------------------------------------
  //  STEP 4: Load related data tables
  // ------------------------------------------------------------

  // --- Load tickets for this element ---
  $tickets = $wpdb->get_results(
    $wpdb->prepare(
      "SELECT * FROM " . WOW_TBL_TICKET_TYPES . " WHERE element_id=%d ORDER BY ticket_type_id ASC",
      $id
    ),
    ARRAY_A
  ) ?: [];

  // --- Load vouchers for this element ---
  $vouchers = $wpdb->get_results(
    $wpdb->prepare(
      "SELECT * FROM " . WOW_TBL_VOUCHER_TYPES . " WHERE element_id=%d ORDER BY voucher_type_id ASC",
      $id
    ),
    ARRAY_A
  ) ?: [];

  // --- Load posts for this element ---
  $posts = $wpdb->get_results(
    $wpdb->prepare(
      "SELECT * FROM " . WOW_TBL_ELEMENT_POSTS . " WHERE element_id=%d ORDER BY position ASC, post_id ASC",
      $id
    ),
    ARRAY_A
  ) ?: [];

  // ------------------------------------------------------------
  //  STEP 5: Combine and return response as JSON
  // ------------------------------------------------------------
  return new WP_REST_Response([
    'element'             => $element,     // full base element
    'ElementPostArray'    => $posts,       // connected posts
    'ElementTicketArray'  => $tickets,     // connected ticket types
    'ElementVoucherArray' => $vouchers,    // connected voucher types
  ], 200);
}



/**
 * POST /wow/v1/ticket-type
 * Body JSON:
 * {
 *   element_id: number,               // required
 *   ticket_type_id: number|null,      // optional (when editing)
 *   name: string,                     // required
 *   kind: "SINGLE"|"GROUP",           // required
 *   group_min: number|null,           // required for GROUP, else 1
 *   group_max: number|null,           // required for GROUP, else 1
 *   max_for_sale: number|null,        // optional
 *   price_per_person: number,         // required
 *   ticket_text: string|null          // optional
 * }
 *
 * Creates when ticket_type_id is empty; updates when provided.
 */
function wow_ticket_type_save( WP_REST_Request $req ) {
  global $wpdb;

  $creator_id = wow_current_creator_id();
  if (!$creator_id) {
    return new WP_Error('forbidden', 'Not authorized', ['status' => 401]);
  }

  $p = json_decode($req->get_body(), true);
  if (!is_array($p)) {
    return new WP_Error('bad_request', 'Invalid JSON body', ['status' => 400]);
  }

  // ---- Coerce & validate input ----
  $element_id     = isset($p['element_id']) ? (int)$p['element_id'] : 0;
  $ticket_type_id = isset($p['ticket_type_id']) && $p['ticket_type_id'] !== '' ? (int)$p['ticket_type_id'] : null;

  $name           = trim((string)($p['name'] ?? ''));
  $kind           = strtoupper(trim((string)($p['kind'] ?? 'SINGLE')));
  $group_min      = array_key_exists('group_min', $p) ? ($p['group_min'] === null ? null : (int)$p['group_min']) : null;
  $group_max      = array_key_exists('group_max', $p) ? ($p['group_max'] === null ? null : (int)$p['group_max']) : null;
  $max_for_sale   = array_key_exists('max_for_sale', $p) ? ($p['max_for_sale'] === null ? null : (int)$p['max_for_sale']) : null;
  $price          = (float)($p['price_per_person'] ?? 0);
  $ticket_text    = array_key_exists('ticket_text', $p) ? (string)$p['ticket_text'] : null;

  if ($element_id <= 0)  return new WP_Error('bad_request', 'element_id required', ['status' => 400]);
  if ($name === '')      return new WP_Error('bad_request', 'name required', ['status' => 400]);
  if (!in_array($kind, ['SINGLE','GROUP'], true)) {
    return new WP_Error('bad_request', 'kind must be SINGLE or GROUP', ['status' => 400]);
  }
  if ($price < 0) {
    return new WP_Error('bad_request', 'price_per_person must be >= 0', ['status' => 400]);
  }

  // Enforce group bounds for GROUP; default to 1..1 for SINGLE
  if ($kind === 'GROUP') {
    if ($group_min === null || $group_max === null) {
      return new WP_Error('bad_request', 'group_min and group_max required for GROUP', ['status' => 400]);
    }
    if ($group_min < 1 || $group_max < 1 || $group_min > $group_max) {
      return new WP_Error('bad_request', 'Invalid group_min/group_max', ['status' => 400]);
    }
  } else {
    $group_min = 1;
    $group_max = 1;
  }

  // ---- Ownership: ensure element belongs to the current creator ----
  $owner = $wpdb->get_var(
    $wpdb->prepare(
      "SELECT creator_id FROM " . WOW_TBL_ELEMENTS . " WHERE element_id=%d LIMIT 1",
      $element_id
    )
  );
  if (!$owner || (int)$owner !== (int)$creator_id) {
    return new WP_Error('forbidden', 'Element does not belong to current creator', ['status' => 403]);
  }

  // ---- Update flow: ensure the ticket row belongs to this element (if editing) ----
  if ($ticket_type_id) {
    $exists = $wpdb->get_var(
      $wpdb->prepare(
        "SELECT ticket_type_id FROM " . WOW_TBL_TICKET_TYPES . " WHERE ticket_type_id=%d AND element_id=%d LIMIT 1",
        $ticket_type_id, $element_id
      )
    );
    if (!$exists) {
      return new WP_Error('not_found', 'Ticket type not found for this element', ['status' => 404]);
    }
  }

  // ---- Prepare data + formats ----
  $now = current_time('mysql');

  $data = [
    'element_id'       => $element_id,
    'name'             => $name,
    'kind'             => $kind,
    'group_min'        => $group_min,
    'group_max'        => $group_max,
    'price_per_person' => $price,
    'max_for_sale'     => $max_for_sale,
    'ticket_text'      => $ticket_text,
    'updated_at'       => $now,
  ];
  $formats = [
    '%d','%s','%s','%d','%d','%f','%d','%s','%s'
  ];

  // NULLs must be set explicitly for nullable columns
  if ($group_min === null)  $data['group_min'] = null;
  if ($group_max === null)  $data['group_max'] = null;
  if ($max_for_sale === null) $data['max_for_sale'] = null;
  if ($ticket_text === null)  $data['ticket_text'] = null;

  // ---- Insert or Update ----
  if ($ticket_type_id) {
    // UPDATE
    $ok = $wpdb->update(
      WOW_TBL_TICKET_TYPES,
      $data,
      ['ticket_type_id' => $ticket_type_id],
      $formats,
      ['%d']
    );
    if ($ok === false) {
      return new WP_Error('db_error', 'Failed to update ticket type', ['status' => 500]);
    }
    $saved_id = $ticket_type_id;
  } else {
    // INSERT
    $data['created_at'] = $now;
    $formats[] = '%s';

    $ok = $wpdb->insert(WOW_TBL_TICKET_TYPES, $data, $formats);
    if (!$ok) {
      return new WP_Error('db_error', 'Failed to create ticket type', ['status' => 500]);
    }
    $saved_id = (int)$wpdb->insert_id;
  }

  // ---- Return fresh row ----
  $fresh = $wpdb->get_row(
    $wpdb->prepare("SELECT * FROM " . WOW_TBL_TICKET_TYPES . " WHERE ticket_type_id=%d", $saved_id),
    ARRAY_A
  );

  $res = new WP_REST_Response(wow_ticket_type_serialize($fresh), $ticket_type_id ? 200 : 201);
  return $res;
}


