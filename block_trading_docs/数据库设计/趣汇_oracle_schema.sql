-- 趣汇 Oracle 核心实体脚本
-- 说明：仅定义表、字段、唯一约束、检查约束和索引；不定义 SQL 外键。
-- 主键由应用层生成，金额使用最小货币单位。

CREATE TABLE qh_user (
    id NUMBER(19) NOT NULL,
    account_status VARCHAR2(24 CHAR) NOT NULL,
    login_status VARCHAR2(24 CHAR) NOT NULL,
    registered_at TIMESTAMP(6) NOT NULL,
    last_login_at TIMESTAMP(6),
    version NUMBER(10) DEFAULT 0 NOT NULL,
    deleted CHAR(1) DEFAULT 'N' NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_user_deleted CHECK (deleted IN ('Y','N')),
    CONSTRAINT pk_qh_user PRIMARY KEY (id)
);

CREATE TABLE qh_user_identity (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    identity_type VARCHAR2(24 CHAR) NOT NULL,
    identity_value VARCHAR2(160 CHAR) NOT NULL,
    provider_subject VARCHAR2(160 CHAR),
    verified_flag CHAR(1) DEFAULT 'N' NOT NULL,
    verified_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_identity_verified CHECK (verified_flag IN ('Y','N')),
    CONSTRAINT uk_qh_identity UNIQUE (identity_type, identity_value),
    CONSTRAINT pk_qh_user_identity PRIMARY KEY (id)
);

CREATE TABLE qh_user_profile (
    user_id NUMBER(19) NOT NULL,
    nickname VARCHAR2(60 CHAR) NOT NULL,
    username VARCHAR2(60 CHAR) NOT NULL,
    avatar_url VARCHAR2(1024 CHAR),
    signature VARCHAR2(240 CHAR),
    gender VARCHAR2(16 CHAR),
    birthday DATE,
    city_code VARCHAR2(32 CHAR),
    city_name VARCHAR2(64 CHAR),
    district_code VARCHAR2(32 CHAR),
    district_name VARCHAR2(64 CHAR),
    street_name VARCHAR2(96 CHAR),
    good_rate NUMBER(5,2),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_profile_username UNIQUE (username),
    CONSTRAINT ck_qh_profile_rate CHECK (good_rate IS NULL OR (good_rate >= 0 AND good_rate <= 100)),
    CONSTRAINT pk_qh_user_profile PRIMARY KEY (user_id)
);

CREATE TABLE qh_user_preference (
    user_id NUMBER(19) NOT NULL,
    stranger_message_enabled CHAR(1) DEFAULT 'Y' NOT NULL,
    system_notification_enabled CHAR(1) DEFAULT 'Y' NOT NULL,
    business_notification_enabled CHAR(1) DEFAULT 'Y' NOT NULL,
    chat_notification_enabled CHAR(1) DEFAULT 'Y' NOT NULL,
    assistant_sound_enabled CHAR(1) DEFAULT 'Y' NOT NULL,
    assistant_vibration_enabled CHAR(1) DEFAULT 'Y' NOT NULL,
    campus_mode_enabled CHAR(1) DEFAULT 'N' NOT NULL,
    location_precision VARCHAR2(24 CHAR) DEFAULT 'DISTRICT' NOT NULL,
    personalized_recommendation_enabled CHAR(1) DEFAULT 'Y' NOT NULL,
    activity_profile_visibility VARCHAR2(24 CHAR) DEFAULT 'CONFIRMED_MEMBER' NOT NULL,
    quiet_hours_start VARCHAR2(5 CHAR),
    quiet_hours_end VARCHAR2(5 CHAR),
    theme VARCHAR2(16 CHAR) DEFAULT 'SYSTEM' NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_pref_flags CHECK (
        stranger_message_enabled IN ('Y','N') AND system_notification_enabled IN ('Y','N')
        AND business_notification_enabled IN ('Y','N') AND chat_notification_enabled IN ('Y','N')
        AND assistant_sound_enabled IN ('Y','N')
        AND assistant_vibration_enabled IN ('Y','N') AND campus_mode_enabled IN ('Y','N')
        AND personalized_recommendation_enabled IN ('Y','N')
    ),
    CONSTRAINT pk_qh_user_preference PRIMARY KEY (user_id)
);

CREATE TABLE qh_user_login_device (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    device_id VARCHAR2(160 CHAR) NOT NULL,
    device_name VARCHAR2(120 CHAR),
    platform VARCHAR2(24 CHAR) NOT NULL,
    last_ip VARCHAR2(64 CHAR),
    last_login_at TIMESTAMP(6) NOT NULL,
    revoked_at TIMESTAMP(6),
    device_status VARCHAR2(16 CHAR) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_login_device UNIQUE (user_id, device_id),
    CONSTRAINT pk_qh_user_login_device PRIMARY KEY (id)
);

CREATE TABLE qh_campus (
    id NUMBER(19) NOT NULL,
    campus_code VARCHAR2(32 CHAR) NOT NULL,
    school_name VARCHAR2(120 CHAR) NOT NULL,
    campus_name VARCHAR2(120 CHAR) NOT NULL,
    city_name VARCHAR2(64 CHAR),
    status VARCHAR2(16 CHAR) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_campus_code UNIQUE (campus_code),
    CONSTRAINT pk_qh_campus PRIMARY KEY (id)
);

CREATE TABLE qh_student_verification (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    campus_id NUMBER(19) NOT NULL,
    real_name_masked VARCHAR2(80 CHAR),
    student_no_masked VARCHAR2(80 CHAR),
    verification_status VARCHAR2(24 CHAR) NOT NULL,
    submitted_at TIMESTAMP(6) NOT NULL,
    verified_at TIMESTAMP(6),
    reject_reason VARCHAR2(500 CHAR),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_student_verification PRIMARY KEY (id)
);

CREATE TABLE qh_user_follow (
    id NUMBER(19) NOT NULL,
    follower_id NUMBER(19) NOT NULL,
    followed_id NUMBER(19) NOT NULL,
    follow_status VARCHAR2(16 CHAR) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_follow UNIQUE (follower_id, followed_id),
    CONSTRAINT ck_qh_follow_self CHECK (follower_id <> followed_id),
    CONSTRAINT pk_qh_user_follow PRIMARY KEY (id)
);

CREATE TABLE qh_user_block (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    blocked_user_id NUMBER(19) NOT NULL,
    status VARCHAR2(16 CHAR) NOT NULL,
    reason VARCHAR2(240 CHAR),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_block UNIQUE (user_id, blocked_user_id),
    CONSTRAINT ck_qh_block_self CHECK (user_id <> blocked_user_id),
    CONSTRAINT pk_qh_user_block PRIMARY KEY (id)
);

CREATE TABLE qh_user_address (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    consignee_name VARCHAR2(80 CHAR) NOT NULL,
    consignee_phone VARCHAR2(40 CHAR) NOT NULL,
    province_name VARCHAR2(64 CHAR),
    city_name VARCHAR2(64 CHAR),
    district_name VARCHAR2(64 CHAR),
    street_name VARCHAR2(96 CHAR),
    detail_address VARCHAR2(240 CHAR) NOT NULL,
    postal_code VARCHAR2(16 CHAR),
    default_flag CHAR(1) DEFAULT 'N' NOT NULL,
    deleted CHAR(1) DEFAULT 'N' NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_address_flags CHECK (default_flag IN ('Y','N') AND deleted IN ('Y','N')),
    CONSTRAINT pk_qh_user_address PRIMARY KEY (id)
);

CREATE TABLE qh_favorite (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    target_type VARCHAR2(24 CHAR) NOT NULL,
    target_id NUMBER(19) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_favorite UNIQUE (user_id, target_type, target_id),
    CONSTRAINT pk_qh_favorite PRIMARY KEY (id)
);

CREATE TABLE qh_user_membership (
    user_id NUMBER(19) NOT NULL,
    vip_level NUMBER(2) DEFAULT 1 NOT NULL,
    current_points NUMBER(19) DEFAULT 0 NOT NULL,
    lifetime_points NUMBER(19) DEFAULT 0 NOT NULL,
    ec_balance NUMBER(19) DEFAULT 0 NOT NULL,
    checked_in_on DATE,
    invite_count_month NUMBER(5) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_membership_level CHECK (vip_level BETWEEN 1 AND 6),
    CONSTRAINT ck_qh_membership_points CHECK (current_points >= 0 AND lifetime_points >= 0 AND ec_balance >= 0),
    CONSTRAINT pk_qh_user_membership PRIMARY KEY (user_id)
);

CREATE TABLE qh_points_ledger (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    change_type VARCHAR2(32 CHAR) NOT NULL,
    points_delta NUMBER(10) NOT NULL,
    balance_after NUMBER(19) NOT NULL,
    source_type VARCHAR2(32 CHAR),
    source_id NUMBER(19),
    occurred_at TIMESTAMP(6) NOT NULL,
    remark VARCHAR2(240 CHAR),
    CONSTRAINT pk_qh_points_ledger PRIMARY KEY (id)
);

CREATE TABLE qh_invitation (
    id NUMBER(19) NOT NULL,
    inviter_id NUMBER(19) NOT NULL,
    invitee_id NUMBER(19),
    invite_code VARCHAR2(40 CHAR) NOT NULL,
    invitation_status VARCHAR2(24 CHAR) NOT NULL,
    reward_points NUMBER(10) DEFAULT 5 NOT NULL,
    reward_ledger_id NUMBER(19),
    completed_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_invite_code UNIQUE (invite_code),
    CONSTRAINT uk_qh_invitee UNIQUE (invitee_id),
    CONSTRAINT pk_qh_invitation PRIMARY KEY (id)
);

CREATE TABLE qh_redeem_code (
    id NUMBER(19) NOT NULL,
    redeem_code VARCHAR2(80 CHAR) NOT NULL,
    benefit_type VARCHAR2(32 CHAR) NOT NULL,
    benefit_value VARCHAR2(240 CHAR),
    valid_from TIMESTAMP(6),
    valid_until TIMESTAMP(6),
    applicable_scope VARCHAR2(240 CHAR),
    redeem_limit NUMBER(10) DEFAULT 1 NOT NULL,
    redeemed_count NUMBER(10) DEFAULT 0 NOT NULL,
    status VARCHAR2(24 CHAR) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_redeem_code UNIQUE (redeem_code),
    CONSTRAINT pk_qh_redeem_code PRIMARY KEY (id)
);

CREATE TABLE qh_redeem_record (
    id NUMBER(19) NOT NULL,
    redeem_code_id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    redeem_status VARCHAR2(24 CHAR) NOT NULL,
    redeemed_at TIMESTAMP(6),
    failure_reason VARCHAR2(500 CHAR),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_redeem_record UNIQUE (redeem_code_id, user_id),
    CONSTRAINT pk_qh_redeem_record PRIMARY KEY (id)
);

CREATE TABLE qh_help_quota_monthly (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    quota_month CHAR(7) NOT NULL,
    normal_limit NUMBER(5) NOT NULL,
    normal_used NUMBER(5) DEFAULT 0 NOT NULL,
    urgent_limit NUMBER(5) NOT NULL,
    urgent_used NUMBER(5) DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_help_quota UNIQUE (user_id, quota_month),
    CONSTRAINT ck_qh_help_quota_used CHECK (normal_used >= 0 AND urgent_used >= 0),
    CONSTRAINT pk_qh_help_quota_monthly PRIMARY KEY (id)
);

CREATE TABLE qh_post (
    id NUMBER(19) NOT NULL,
    author_id NUMBER(19) NOT NULL,
    post_type VARCHAR2(32 CHAR) NOT NULL,
    status VARCHAR2(32 CHAR) NOT NULL,
    visibility_scope VARCHAR2(16 CHAR) NOT NULL,
    campus_id NUMBER(19),
    join_mode VARCHAR2(16 CHAR) DEFAULT 'DIRECT' NOT NULL,
    title VARCHAR2(180 CHAR) NOT NULL,
    content CLOB,
    current_participants NUMBER(5) DEFAULT 0 NOT NULL,
    min_participants NUMBER(5) DEFAULT 1 NOT NULL,
    max_participants NUMBER(5) DEFAULT 1 NOT NULL,
    primary_occurs_at TIMESTAMP(6) NOT NULL,
    signup_deadline_at TIMESTAMP(6) NOT NULL,
    published_at TIMESTAMP(6),
    version NUMBER(10) DEFAULT 0 NOT NULL,
    deleted CHAR(1) DEFAULT 'N' NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_post_visibility CHECK (visibility_scope IN ('PUBLIC','CAMPUS')),
    CONSTRAINT ck_qh_post_counts CHECK (current_participants >= 0 AND current_participants <= max_participants AND min_participants >= 1 AND min_participants <= max_participants),
    CONSTRAINT ck_qh_post_deleted CHECK (deleted IN ('Y','N')),
    CONSTRAINT pk_qh_post PRIMARY KEY (id)
);

CREATE TABLE qh_post_location (
    id NUMBER(19) NOT NULL,
    post_id NUMBER(19) NOT NULL,
    location_role VARCHAR2(24 CHAR) NOT NULL,
    visibility_level VARCHAR2(24 CHAR) NOT NULL,
    province_code VARCHAR2(32 CHAR),
    province_name VARCHAR2(64 CHAR),
    city_code VARCHAR2(32 CHAR),
    city_name VARCHAR2(64 CHAR),
    district_code VARCHAR2(32 CHAR),
    district_name VARCHAR2(64 CHAR),
    street_name VARCHAR2(96 CHAR),
    display_name VARCHAR2(160 CHAR),
    latitude NUMBER(10,7),
    longitude NUMBER(10,7),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_post_location_visibility CHECK (visibility_level IN ('PUBLIC','CONFIRMED_MEMBER','OWNER_ONLY')),
    CONSTRAINT ck_qh_post_location_lat CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_qh_post_location_lon CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    CONSTRAINT pk_qh_post_location PRIMARY KEY (id)
);

CREATE TABLE qh_post_media (
    id NUMBER(19) NOT NULL,
    post_id NUMBER(19) NOT NULL,
    media_type VARCHAR2(16 CHAR) NOT NULL,
    media_url VARCHAR2(1024 CHAR) NOT NULL,
    is_cover CHAR(1) DEFAULT 'N' NOT NULL,
    sort_order NUMBER(5) DEFAULT 0 NOT NULL,
    width NUMBER(10),
    height NUMBER(10),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_post_media_cover CHECK (is_cover IN ('Y','N')),
    CONSTRAINT pk_qh_post_media PRIMARY KEY (id)
);

CREATE TABLE qh_post_participant (
    id NUMBER(19) NOT NULL,
    post_id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    join_status VARCHAR2(24 CHAR) NOT NULL,
    payment_status VARCHAR2(24 CHAR) DEFAULT 'NOT_REQUIRED' NOT NULL,
    member_role VARCHAR2(16 CHAR) NOT NULL,
    applied_at TIMESTAMP(6) NOT NULL,
    confirmed_at TIMESTAMP(6),
    exited_at TIMESTAMP(6),
    version NUMBER(10) DEFAULT 0 NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_post_participant UNIQUE (post_id, user_id),
    CONSTRAINT pk_qh_post_participant PRIMARY KEY (id)
);

CREATE TABLE qh_post_change_log (
    id NUMBER(19) NOT NULL,
    post_id NUMBER(19) NOT NULL,
    operator_id NUMBER(19) NOT NULL,
    change_type VARCHAR2(32 CHAR) NOT NULL,
    changed_fields CLOB NOT NULL,
    before_snapshot CLOB,
    after_snapshot CLOB,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_post_change_log PRIMARY KEY (id)
);

CREATE TABLE qh_post_group_buy (
    post_id NUMBER(19) NOT NULL,
    product_name VARCHAR2(120 CHAR) NOT NULL,
    specification VARCHAR2(240 CHAR),
    estimated_unit_amount_cent NUMBER(19) NOT NULL,
    currency CHAR(3) DEFAULT 'CNY' NOT NULL,
    target_quantity NUMBER(10,2) NOT NULL,
    quantity_unit VARCHAR2(16 CHAR) NOT NULL,
    fulfillment_mode VARCHAR2(24 CHAR) NOT NULL,
    refund_rule VARCHAR2(500 CHAR),
    CONSTRAINT ck_qh_group_buy_amount CHECK (estimated_unit_amount_cent >= 0 AND target_quantity > 0),
    CONSTRAINT pk_qh_post_group_buy PRIMARY KEY (post_id)
);

CREATE TABLE qh_post_carpool (
    post_id NUMBER(19) NOT NULL,
    trip_role VARCHAR2(16 CHAR) NOT NULL,
    origin_name VARCHAR2(120 CHAR) NOT NULL,
    destination_name VARCHAR2(120 CHAR) NOT NULL,
    depart_at TIMESTAMP(6) NOT NULL,
    fare_mode VARCHAR2(16 CHAR) NOT NULL,
    fare_amount_cent NUMBER(19),
    currency CHAR(3) DEFAULT 'CNY' NOT NULL,
    luggage_rule VARCHAR2(240 CHAR),
    CONSTRAINT ck_qh_carpool_fare CHECK (fare_amount_cent IS NULL OR fare_amount_cent >= 0),
    CONSTRAINT pk_qh_post_carpool PRIMARY KEY (post_id)
);

CREATE TABLE qh_post_offline_team (
    post_id NUMBER(19) NOT NULL,
    activity_category VARCHAR2(60 CHAR) NOT NULL,
    destination_name VARCHAR2(120 CHAR) NOT NULL,
    starts_at TIMESTAMP(6) NOT NULL,
    ends_at TIMESTAMP(6),
    estimated_amount_cent NUMBER(19),
    currency CHAR(3) DEFAULT 'CNY' NOT NULL,
    participant_requirement VARCHAR2(500 CHAR),
    cancel_rule VARCHAR2(500 CHAR),
    CONSTRAINT ck_qh_offline_amount CHECK (estimated_amount_cent IS NULL OR estimated_amount_cent >= 0),
    CONSTRAINT pk_qh_post_offline_team PRIMARY KEY (post_id)
);

CREATE TABLE qh_post_online_team (
    post_id NUMBER(19) NOT NULL,
    game_category VARCHAR2(60 CHAR) NOT NULL,
    game_name VARCHAR2(80 CHAR) NOT NULL,
    platform VARCHAR2(80 CHAR) NOT NULL,
    starts_at TIMESTAMP(6) NOT NULL,
    duration_minutes NUMBER(4) NOT NULL,
    skill_requirement VARCHAR2(240 CHAR),
    voice_requirement VARCHAR2(16 CHAR),
    CONSTRAINT ck_qh_online_duration CHECK (duration_minutes > 0),
    CONSTRAINT pk_qh_post_online_team PRIMARY KEY (post_id)
);

CREATE TABLE qh_post_neighbor_help (
    post_id NUMBER(19) NOT NULL,
    help_category VARCHAR2(60 CHAR) NOT NULL,
    timeliness VARCHAR2(16 CHAR) NOT NULL,
    needed_at TIMESTAMP(6),
    needed_start_at TIMESTAMP(6),
    needed_end_at TIMESTAMP(6),
    latest_response_at TIMESTAMP(6) NOT NULL,
    reward_amount_cent NUMBER(19),
    currency CHAR(3) DEFAULT 'CNY' NOT NULL,
    urgent CHAR(1) DEFAULT 'N' NOT NULL,
    CONSTRAINT ck_qh_neighbor_urgent CHECK (urgent IN ('Y','N')),
    CONSTRAINT ck_qh_neighbor_reward CHECK (reward_amount_cent IS NULL OR reward_amount_cent >= 0),
    CONSTRAINT pk_qh_post_neighbor_help PRIMARY KEY (post_id)
);

CREATE TABLE qh_post_comment (
    id NUMBER(19) NOT NULL,
    post_id NUMBER(19) NOT NULL,
    author_id NUMBER(19) NOT NULL,
    parent_id NUMBER(19),
    content VARCHAR2(2000 CHAR) NOT NULL,
    status VARCHAR2(24 CHAR) NOT NULL,
    reply_count NUMBER(10) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_post_comment PRIMARY KEY (id)
);

CREATE TABLE qh_report (
    id NUMBER(19) NOT NULL,
    reporter_id NUMBER(19) NOT NULL,
    target_type VARCHAR2(24 CHAR) NOT NULL,
    target_id NUMBER(19) NOT NULL,
    reason_code VARCHAR2(32 CHAR) NOT NULL,
    description VARCHAR2(1000 CHAR),
    status VARCHAR2(24 CHAR) NOT NULL,
    handled_by NUMBER(19),
    handled_at TIMESTAMP(6),
    result_note VARCHAR2(1000 CHAR),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_report_once UNIQUE (reporter_id, target_type, target_id),
    CONSTRAINT pk_qh_report PRIMARY KEY (id)
);

CREATE TABLE qh_chat_room (
    id NUMBER(19) NOT NULL,
    room_type VARCHAR2(16 CHAR) NOT NULL,
    post_id NUMBER(19),
    owner_id NUMBER(19),
    room_name VARCHAR2(120 CHAR),
    avatar_url VARCHAR2(1024 CHAR),
    room_status VARCHAR2(24 CHAR) NOT NULL,
    member_count NUMBER(5) DEFAULT 0 NOT NULL,
    last_message_id NUMBER(19),
    last_message_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_chat_room PRIMARY KEY (id)
);

CREATE TABLE qh_chat_member (
    id NUMBER(19) NOT NULL,
    room_id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    member_role VARCHAR2(16 CHAR) NOT NULL,
    member_status VARCHAR2(24 CHAR) NOT NULL,
    muted_until TIMESTAMP(6),
    joined_at TIMESTAMP(6) NOT NULL,
    left_at TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_chat_member UNIQUE (room_id, user_id),
    CONSTRAINT pk_qh_chat_member PRIMARY KEY (id)
);

CREATE TABLE qh_chat_message (
    id NUMBER(19) NOT NULL,
    room_id NUMBER(19) NOT NULL,
    sender_id NUMBER(19),
    message_type VARCHAR2(24 CHAR) NOT NULL,
    content CLOB,
    related_type VARCHAR2(24 CHAR),
    related_id NUMBER(19),
    reply_to_id NUMBER(19),
    send_status VARCHAR2(24 CHAR) NOT NULL,
    recalled_flag CHAR(1) DEFAULT 'N' NOT NULL,
    sent_at TIMESTAMP(6) NOT NULL,
    recalled_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_chat_recalled CHECK (recalled_flag IN ('Y','N')),
    CONSTRAINT pk_qh_chat_message PRIMARY KEY (id)
);

CREATE TABLE qh_chat_message_media (
    id NUMBER(19) NOT NULL,
    message_id NUMBER(19) NOT NULL,
    media_type VARCHAR2(16 CHAR) NOT NULL,
    media_url VARCHAR2(1024 CHAR) NOT NULL,
    duration_seconds NUMBER(8,2),
    file_size_bytes NUMBER(19),
    sort_order NUMBER(5) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_chat_media_duration CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
    CONSTRAINT ck_qh_chat_media_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    CONSTRAINT pk_qh_chat_message_media PRIMARY KEY (id)
);

CREATE TABLE qh_chat_read_cursor (
    room_id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    last_read_message_id NUMBER(19),
    last_read_at TIMESTAMP(6),
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_chat_cursor UNIQUE (room_id, user_id),
    CONSTRAINT pk_qh_chat_read_cursor PRIMARY KEY (room_id, user_id)
);

CREATE TABLE qh_notification (
    id NUMBER(19) NOT NULL,
    notification_type VARCHAR2(24 CHAR) NOT NULL,
    priority VARCHAR2(16 CHAR) NOT NULL,
    title VARCHAR2(180 CHAR) NOT NULL,
    summary VARCHAR2(500 CHAR),
    content CLOB,
    related_type VARCHAR2(24 CHAR),
    related_id NUMBER(19),
    requires_confirmation CHAR(1) DEFAULT 'N' NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_notification_confirm CHECK (requires_confirmation IN ('Y','N')),
    CONSTRAINT pk_qh_notification PRIMARY KEY (id)
);

CREATE TABLE qh_user_notification (
    id NUMBER(19) NOT NULL,
    notification_id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    read_flag CHAR(1) DEFAULT 'N' NOT NULL,
    confirmed_flag CHAR(1) DEFAULT 'N' NOT NULL,
    read_at TIMESTAMP(6),
    confirmed_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_user_notification UNIQUE (notification_id, user_id),
    CONSTRAINT ck_qh_user_notification_flags CHECK (read_flag IN ('Y','N') AND confirmed_flag IN ('Y','N')),
    CONSTRAINT pk_qh_user_notification PRIMARY KEY (id)
);

CREATE TABLE qh_product_category (
    id NUMBER(19) NOT NULL,
    parent_id NUMBER(19),
    category_name VARCHAR2(80 CHAR) NOT NULL,
    category_type VARCHAR2(24 CHAR) NOT NULL,
    sort_order NUMBER(5) DEFAULT 0 NOT NULL,
    status VARCHAR2(16 CHAR) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_product_category PRIMARY KEY (id)
);

CREATE TABLE qh_product (
    id NUMBER(19) NOT NULL,
    category_id NUMBER(19) NOT NULL,
    product_name VARCHAR2(180 CHAR) NOT NULL,
    short_selling_point VARCHAR2(500 CHAR),
    detail_content CLOB,
    product_type VARCHAR2(24 CHAR) NOT NULL,
    sale_status VARCHAR2(24 CHAR) NOT NULL,
    self_owned_flag CHAR(1) DEFAULT 'Y' NOT NULL,
    delivery_scope VARCHAR2(240 CHAR),
    after_sale_policy VARCHAR2(1000 CHAR),
    version NUMBER(10) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_product_self_owned CHECK (self_owned_flag IN ('Y','N')),
    CONSTRAINT pk_qh_product PRIMARY KEY (id)
);

CREATE TABLE qh_product_sku (
    id NUMBER(19) NOT NULL,
    product_id NUMBER(19) NOT NULL,
    sku_code VARCHAR2(80 CHAR) NOT NULL,
    specification_json CLOB,
    sale_price_cent NUMBER(19) NOT NULL,
    market_price_cent NUMBER(19),
    stock_quantity NUMBER(10,2) DEFAULT 0 NOT NULL,
    locked_quantity NUMBER(10,2) DEFAULT 0 NOT NULL,
    limit_quantity NUMBER(10,2),
    delivery_days NUMBER(4),
    status VARCHAR2(16 CHAR) NOT NULL,
    version NUMBER(10) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_product_sku_code UNIQUE (sku_code),
    CONSTRAINT ck_qh_sku_stock CHECK (stock_quantity >= 0 AND locked_quantity >= 0 AND locked_quantity <= stock_quantity),
    CONSTRAINT pk_qh_product_sku PRIMARY KEY (id)
);

CREATE TABLE qh_product_media (
    id NUMBER(19) NOT NULL,
    product_id NUMBER(19) NOT NULL,
    media_type VARCHAR2(16 CHAR) NOT NULL,
    media_url VARCHAR2(1024 CHAR) NOT NULL,
    is_cover CHAR(1) DEFAULT 'N' NOT NULL,
    sort_order NUMBER(5) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT ck_qh_product_media_cover CHECK (is_cover IN ('Y','N')),
    CONSTRAINT pk_qh_product_media PRIMARY KEY (id)
);

CREATE TABLE qh_user_listing (
    id NUMBER(19) NOT NULL,
    seller_id NUMBER(19) NOT NULL,
    category_id NUMBER(19),
    listing_type VARCHAR2(24 CHAR) NOT NULL,
    title VARCHAR2(180 CHAR) NOT NULL,
    description CLOB,
    item_condition VARCHAR2(24 CHAR) NOT NULL,
    sale_price_cent NUMBER(19) NOT NULL,
    currency CHAR(3) DEFAULT 'CNY' NOT NULL,
    available_quantity NUMBER(10,2) DEFAULT 1 NOT NULL,
    sold_quantity NUMBER(10,2) DEFAULT 0 NOT NULL,
    delivery_mode VARCHAR2(24 CHAR) NOT NULL,
    listing_status VARCHAR2(24 CHAR) NOT NULL,
    published_at TIMESTAMP(6),
    closed_at TIMESTAMP(6),
    version NUMBER(10) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_user_listing PRIMARY KEY (id),
    CONSTRAINT ck_qh_user_listing_amount CHECK (sale_price_cent >= 0 AND available_quantity > 0 AND sold_quantity >= 0 AND sold_quantity <= available_quantity)
);

CREATE TABLE qh_user_listing_media (
    id NUMBER(19) NOT NULL,
    listing_id NUMBER(19) NOT NULL,
    media_type VARCHAR2(16 CHAR) NOT NULL,
    media_url VARCHAR2(1024 CHAR) NOT NULL,
    is_cover CHAR(1) DEFAULT 'N' NOT NULL,
    sort_order NUMBER(5) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_user_listing_media PRIMARY KEY (id),
    CONSTRAINT ck_qh_listing_media_cover CHECK (is_cover IN ('Y','N'))
);

CREATE TABLE qh_cart_item (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    product_id NUMBER(19),
    sku_id NUMBER(19),
    quantity NUMBER(10,2) NOT NULL,
    selected_flag CHAR(1) DEFAULT 'Y' NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_cart_item UNIQUE (user_id, sku_id),
    CONSTRAINT ck_qh_cart_selected CHECK (selected_flag IN ('Y','N')),
    CONSTRAINT pk_qh_cart_item PRIMARY KEY (id)
);

CREATE TABLE qh_order (
    id NUMBER(19) NOT NULL,
    order_no VARCHAR2(40 CHAR) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    order_status VARCHAR2(24 CHAR) NOT NULL,
    payment_status VARCHAR2(24 CHAR) NOT NULL,
    fulfillment_status VARCHAR2(24 CHAR) NOT NULL,
    total_amount_cent NUMBER(19) NOT NULL,
    discount_amount_cent NUMBER(19) DEFAULT 0 NOT NULL,
    payable_amount_cent NUMBER(19) NOT NULL,
    currency CHAR(3) DEFAULT 'CNY' NOT NULL,
    consignee_name VARCHAR2(80 CHAR) NOT NULL,
    consignee_phone VARCHAR2(40 CHAR) NOT NULL,
    province_name VARCHAR2(64 CHAR),
    city_name VARCHAR2(64 CHAR),
    district_name VARCHAR2(64 CHAR),
    street_name VARCHAR2(96 CHAR),
    detail_address VARCHAR2(240 CHAR),
    buyer_remark VARCHAR2(500 CHAR),
    placed_at TIMESTAMP(6) NOT NULL,
    paid_at TIMESTAMP(6),
    completed_at TIMESTAMP(6),
    cancelled_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_order_no UNIQUE (order_no),
    CONSTRAINT ck_qh_order_amount CHECK (total_amount_cent >= 0 AND discount_amount_cent >= 0 AND payable_amount_cent >= 0),
    CONSTRAINT pk_qh_order PRIMARY KEY (id)
);

CREATE TABLE qh_order_item (
    id NUMBER(19) NOT NULL,
    order_id NUMBER(19) NOT NULL,
    product_id NUMBER(19) NOT NULL,
    sku_id NUMBER(19) NOT NULL,
    source_type VARCHAR2(24 CHAR) DEFAULT 'PRODUCT_SKU' NOT NULL,
    source_id NUMBER(19),
    product_name_snapshot VARCHAR2(180 CHAR) NOT NULL,
    sku_spec_snapshot CLOB,
    unit_price_cent NUMBER(19) NOT NULL,
    quantity NUMBER(10,2) NOT NULL,
    item_amount_cent NUMBER(19) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_order_item PRIMARY KEY (id),
    CONSTRAINT ck_qh_order_item_source CHECK (
        (source_type = 'PRODUCT_SKU' AND product_id IS NOT NULL AND sku_id IS NOT NULL)
        OR (source_type = 'USER_LISTING' AND source_id IS NOT NULL)
    )
);

CREATE TABLE qh_payment (
    id NUMBER(19) NOT NULL,
    order_id NUMBER(19) NOT NULL,
    payment_no VARCHAR2(40 CHAR) NOT NULL,
    payment_channel VARCHAR2(24 CHAR) NOT NULL,
    payment_status VARCHAR2(24 CHAR) NOT NULL,
    amount_cent NUMBER(19) NOT NULL,
    provider_transaction_no VARCHAR2(120 CHAR),
    paid_at TIMESTAMP(6),
    expired_at TIMESTAMP(6),
    failure_reason VARCHAR2(500 CHAR),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_payment_no UNIQUE (payment_no),
    CONSTRAINT ck_qh_payment_amount CHECK (amount_cent >= 0),
    CONSTRAINT pk_qh_payment PRIMARY KEY (id)
);

CREATE TABLE qh_order_status_log (
    id NUMBER(19) NOT NULL,
    order_id NUMBER(19) NOT NULL,
    from_status VARCHAR2(24 CHAR),
    to_status VARCHAR2(24 CHAR) NOT NULL,
    operator_type VARCHAR2(16 CHAR) NOT NULL,
    operator_id NUMBER(19),
    remark VARCHAR2(500 CHAR),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_order_status_log PRIMARY KEY (id)
);

CREATE TABLE qh_after_sale (
    id NUMBER(19) NOT NULL,
    after_sale_no VARCHAR2(40 CHAR) NOT NULL,
    order_id NUMBER(19) NOT NULL,
    order_item_id NUMBER(19),
    user_id NUMBER(19) NOT NULL,
    after_sale_type VARCHAR2(24 CHAR) NOT NULL,
    reason_code VARCHAR2(32 CHAR) NOT NULL,
    description VARCHAR2(1000 CHAR),
    requested_amount_cent NUMBER(19),
    approved_amount_cent NUMBER(19),
    status VARCHAR2(24 CHAR) NOT NULL,
    handled_by NUMBER(19),
    handled_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_after_sale_no UNIQUE (after_sale_no),
    CONSTRAINT pk_qh_after_sale PRIMARY KEY (id)
);

CREATE TABLE qh_order_delivery (
    id NUMBER(19) NOT NULL,
    order_id NUMBER(19) NOT NULL,
    order_item_id NUMBER(19),
    delivery_no VARCHAR2(80 CHAR),
    carrier_name VARCHAR2(120 CHAR),
    delivery_status VARCHAR2(24 CHAR) NOT NULL,
    shipped_at TIMESTAMP(6),
    delivered_at TIMESTAMP(6),
    last_tracking_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_order_delivery PRIMARY KEY (id)
);

CREATE TABLE qh_order_delivery_event (
    id NUMBER(19) NOT NULL,
    delivery_id NUMBER(19) NOT NULL,
    event_status VARCHAR2(24 CHAR) NOT NULL,
    event_description VARCHAR2(500 CHAR),
    occurred_at TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_order_delivery_event PRIMARY KEY (id)
);

CREATE TABLE qh_product_review (
    id NUMBER(19) NOT NULL,
    order_id NUMBER(19) NOT NULL,
    order_item_id NUMBER(19) NOT NULL,
    product_id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    rating NUMBER(2) NOT NULL,
    content VARCHAR2(2000 CHAR),
    media_json CLOB,
    review_status VARCHAR2(24 CHAR) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_product_review UNIQUE (order_item_id, user_id),
    CONSTRAINT ck_qh_product_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT pk_qh_product_review PRIMARY KEY (id)
);

CREATE TABLE qh_content_event (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19),
    content_type VARCHAR2(24 CHAR) NOT NULL,
    content_id NUMBER(19) NOT NULL,
    event_type VARCHAR2(24 CHAR) NOT NULL,
    recommendation_position NUMBER(10),
    filter_snapshot CLOB,
    occurred_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_content_event PRIMARY KEY (id)
);

CREATE TABLE qh_content_feedback (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    content_type VARCHAR2(24 CHAR) NOT NULL,
    content_id NUMBER(19) NOT NULL,
    feedback_type VARCHAR2(24 CHAR) NOT NULL,
    reason_code VARCHAR2(32 CHAR),
    expires_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_content_feedback UNIQUE (user_id, content_type, content_id),
    CONSTRAINT pk_qh_content_feedback PRIMARY KEY (id)
);

CREATE TABLE qh_mini_program (
    id NUMBER(19) NOT NULL,
    app_code VARCHAR2(80 CHAR) NOT NULL,
    app_name VARCHAR2(120 CHAR) NOT NULL,
    icon_url VARCHAR2(1024 CHAR),
    target_path VARCHAR2(500 CHAR),
    applicable_gender VARCHAR2(16 CHAR) DEFAULT 'ALL' NOT NULL,
    status VARCHAR2(16 CHAR) NOT NULL,
    traffic_heat NUMBER(19) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_mini_program_code UNIQUE (app_code),
    CONSTRAINT pk_qh_mini_program PRIMARY KEY (id)
);

CREATE TABLE qh_user_mini_program (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    mini_program_id NUMBER(19) NOT NULL,
    favorite_flag CHAR(1) DEFAULT 'N' NOT NULL,
    group_name VARCHAR2(80 CHAR),
    sort_order NUMBER(5) DEFAULT 0 NOT NULL,
    use_count NUMBER(10) DEFAULT 0 NOT NULL,
    last_queried_at TIMESTAMP(6),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT uk_qh_user_mini_program UNIQUE (user_id, mini_program_id),
    CONSTRAINT ck_qh_user_mini_favorite CHECK (favorite_flag IN ('Y','N')),
    CONSTRAINT pk_qh_user_mini_program PRIMARY KEY (id)
);

CREATE TABLE qh_support_ticket (
    id NUMBER(19) NOT NULL,
    user_id NUMBER(19) NOT NULL,
    ticket_type VARCHAR2(24 CHAR) NOT NULL,
    subject VARCHAR2(180 CHAR) NOT NULL,
    content CLOB NOT NULL,
    related_type VARCHAR2(24 CHAR),
    related_id NUMBER(19),
    status VARCHAR2(24 CHAR) NOT NULL,
    handled_by NUMBER(19),
    handled_at TIMESTAMP(6),
    result_note VARCHAR2(1000 CHAR),
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT pk_qh_support_ticket PRIMARY KEY (id)
);

CREATE INDEX ix_qh_post_feed ON qh_post (status, post_type, primary_occurs_at, published_at);
CREATE INDEX ix_qh_post_scope ON qh_post (visibility_scope, campus_id, published_at);
CREATE INDEX ix_qh_post_participant_user ON qh_post_participant (user_id, join_status, updated_at);
CREATE INDEX ix_qh_post_comment ON qh_post_comment (post_id, parent_id, created_at);
CREATE INDEX ix_qh_chat_room_user_time ON qh_chat_room (room_status, last_message_at);
CREATE INDEX ix_qh_chat_message_room_time ON qh_chat_message (room_id, sent_at);
CREATE INDEX ix_qh_chat_media_message ON qh_chat_message_media (message_id, sort_order);
CREATE INDEX ix_qh_user_notification ON qh_user_notification (user_id, read_flag, created_at);
CREATE INDEX ix_qh_order_user_status ON qh_order (user_id, order_status, created_at);
CREATE INDEX ix_qh_order_item_order ON qh_order_item (order_id);
CREATE INDEX ix_qh_product_sale ON qh_product (sale_status, category_id);
CREATE INDEX ix_qh_listing_feed ON qh_user_listing (listing_status, category_id, published_at);
CREATE INDEX ix_qh_listing_media ON qh_user_listing_media (listing_id, sort_order);
CREATE INDEX ix_qh_content_event_content ON qh_content_event (content_type, content_id, event_type, occurred_at);
CREATE INDEX ix_qh_favorite_target ON qh_favorite (target_type, target_id, created_at);
CREATE INDEX ix_qh_redeem_user ON qh_redeem_record (user_id, created_at);
CREATE INDEX ix_qh_delivery_order ON qh_order_delivery (order_id, delivery_status);
CREATE INDEX ix_qh_delivery_event ON qh_order_delivery_event (delivery_id, occurred_at);
CREATE INDEX ix_qh_support_user_status ON qh_support_ticket (user_id, status, updated_at);
