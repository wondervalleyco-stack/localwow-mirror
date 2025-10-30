// ============================================================================
// WOW DB ELEMENTS SCHEMA — canonical references for all code and API endpoints
// Tables have NO PREFIX. Use these exact names in queries and REST routes.
// ============================================================================

export const DB = {
  tables: {
    elements       : 'wow_elements',
    ticketTypes    : 'wow_ticket_types',
    voucherTypes   : 'wow_voucher_types',
    elementPosts   : 'wow_element_posts',
    elementLocks   : 'wow_element_locks',
  },

  cols: {
    // ---------- wow_elements ----------
    elements: {
      element_id                 : 'element_id',
      creator_id                 : 'creator_id',
      element_name               : 'element_name',
      element_state              : 'element_state',          // 'IN_CREATION' | 'ACTIVE' | 'ARCHIVED'
      element_type               : 'element_type',           // 'HOST' | 'SERVICE' | 'PRODUCTION'

      min_participants           : 'min_participants',
      max_participants           : 'max_participants',
      over_min_percent           : 'over_min_percent',
      min_time_slots             : 'min_time_slots',
      duration_minutes           : 'duration_minutes',       // INT (total minutes)
      price_per_time_slot        : 'price_per_time_slot',    // DECIMAL(10,2)
      location_text              : 'location_text',

      max_per_hour               : 'max_per_hour',
      min_participants_threshold : 'min_participants_threshold',

      currency_code              : 'currency_code',          // 'ILS'
      language_code              : 'language_code',          // 'he'

      hero_kind                  : 'hero_kind',              // 'embed' | 'post'
      hero_link                  : 'hero_link',
      hero_media_id              : 'hero_media_id',
      hero_headline              : 'hero_headline',
      hero_text                  : 'hero_text',

      created_at                 : 'created_at',
      updated_at                 : 'updated_at',
    },

    // ---------- wow_ticket_types ----------
    ticketTypes: {
      ticket_type_id   : 'ticket_type_id',
      element_id       : 'element_id',
      name             : 'name',
      kind             : 'kind',                // 'SINGLE' | 'GROUP'
      group_min        : 'group_min',
      group_max        : 'group_max',
      price_per_person : 'price_per_person',
      max_for_sale     : 'max_for_sale',
      ticket_text      : 'ticket_text',
      created_at       : 'created_at',
      updated_at       : 'updated_at',
    },

    // ---------- wow_voucher_types ----------
    voucherTypes: {
      voucher_type_id     : 'voucher_type_id',
      element_id          : 'element_id',
      category            : 'category',            // 'INCLUDED' | 'CHOICE'
      usage_type          : 'usage_type',          // 'SINGLE' | 'MULTI'
      name                : 'name',
      price_per_person    : 'price_per_person',
      included_qty        : 'included_qty',
      per_participant_max : 'per_participant_max',
      per_time_slot_cap   : 'per_time_slot_cap',
      voucher_text        : 'voucher_text',
      created_at          : 'created_at',
      updated_at          : 'updated_at',
    },

    // ---------- wow_element_posts ----------
    elementPosts: {
      post_id     : 'post_id',
      element_id  : 'element_id',
      kind        : 'kind',          // 'EMBED' | 'POST'
      media_id    : 'media_id',
      link_url    : 'link_url',
      title       : 'title',
      body_text   : 'body_text',
      position    : 'position',
      created_at  : 'created_at',
      updated_at  : 'updated_at',
    },

    // ---------- wow_element_locks ----------
    elementLocks: {
      lock_id     : 'lock_id',
      path        : 'path',
      rule        : 'rule',          // 'LOCKED' | 'INCREASE_ONLY'
      description : 'description',
    },
  },

  enums: {
    ElementState   : { IN_CREATION:'IN_CREATION', ACTIVE:'ACTIVE', ARCHIVED:'ARCHIVED' },
    ElementType    : { HOST:'HOST', SERVICE:'SERVICE', PRODUCTION:'PRODUCTION' },
    TicketKind     : { SINGLE:'SINGLE', GROUP:'GROUP' },
    VoucherCategory: { INCLUDED:'INCLUDED', CHOICE:'CHOICE' },
    VoucherUsage   : { SINGLE:'SINGLE', MULTI:'MULTI' },
    HeroKind       : { EMBED:'embed', POST:'post' },
  },
};
