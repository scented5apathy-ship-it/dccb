-- =====================================================================
-- CâyGiaPhảSố - Digital Family Tree Platform
-- V1: Initial Schema (33 tables)
-- =====================================================================
-- Conventions:
--   * Primary keys: UUID generated via gen_random_uuid() (pgcrypto)
--   * Timestamps:   TIMESTAMPTZ with DEFAULT NOW()
--   * Strings:      TEXT (no length limits)
--   * Enums:        CREATE TYPE ... AS ENUM
--   * FK behavior:  CASCADE for owned data, SET NULL for optional links
-- =====================================================================

-- Isolate this project in its own schema to coexist with the existing
-- 'skillseed' tables (users, notifications, etc.) in the public schema.
CREATE SCHEMA IF NOT EXISTS caygiaphaso;
SET search_path = caygiaphaso, public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------
-- A. USERS & AUTH
-- ---------------------------------------------------------------------

CREATE TABLE users (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email              TEXT         NOT NULL UNIQUE,
    password_hash      TEXT         NOT NULL,
    full_name          TEXT         NOT NULL,
    avatar_url         TEXT,
    phone              TEXT,
    bio                TEXT,
    is_active          BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    last_login_at      TIMESTAMPTZ,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email        ON users (email);
CREATE INDEX idx_users_active       ON users (is_active);
CREATE INDEX idx_users_created_at   ON users (created_at);

CREATE TABLE refresh_tokens (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token         TEXT         NOT NULL UNIQUE,
    expires_at    TIMESTAMPTZ  NOT NULL,
    revoked_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user       ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- ---------------------------------------------------------------------
-- B. FAMILY CORE
-- ---------------------------------------------------------------------

CREATE TABLE families (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT         NOT NULL,
    description       TEXT,
    founded_year      INTEGER      CHECK (founded_year IS NULL OR (founded_year > 0 AND founded_year < 3000)),
    motto             TEXT,
    logo_url          TEXT,
    cover_image_url   TEXT,
    origin_location   TEXT,
    member_count      INTEGER      NOT NULL DEFAULT 0 CHECK (member_count >= 0),
    created_by        UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_families_created_by  ON families (created_by);
CREATE INDEX idx_families_name        ON families (name);
CREATE INDEX idx_families_created_at  ON families (created_at);

CREATE TABLE generations (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id           UUID         NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    generation_number   INTEGER      NOT NULL CHECK (generation_number > 0),
    name                TEXT         NOT NULL,
    start_year          INTEGER      CHECK (start_year IS NULL OR start_year > 0),
    end_year            INTEGER      CHECK (end_year IS NULL OR end_year > 0),
    description         TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (family_id, generation_number)
);

CREATE INDEX idx_generations_family ON generations (family_id);

CREATE TABLE family_members (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id         UUID         NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id           UUID         REFERENCES users(id) ON DELETE SET NULL,
    full_name         TEXT         NOT NULL,
    nickname          TEXT,
    avatar_url        TEXT,
    gender            TEXT         CHECK (gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER')),
    birth_date        DATE,
    death_date        DATE,
    birth_place       TEXT,
    current_location  TEXT,
    occupation        TEXT,
    biography         TEXT,
    generation_id     UUID         REFERENCES generations(id) ON DELETE SET NULL,
    is_alive          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CHECK (death_date IS NULL OR death_date >= birth_date)
);

CREATE INDEX idx_family_members_family      ON family_members (family_id);
CREATE INDEX idx_family_members_user        ON family_members (user_id);
CREATE INDEX idx_family_members_generation  ON family_members (generation_id);
CREATE INDEX idx_family_members_full_name   ON family_members (full_name);

-- ENUM for relationships (kept as TEXT + CHECK for flexibility with DDL evolution)
CREATE TABLE relationships (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id         UUID         NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    from_member_id    UUID         NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    to_member_id      UUID         NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    relationship_type TEXT         NOT NULL
                                  CHECK (relationship_type IN
                                         ('PARENT','CHILD','SPOUSE','SIBLING','ADOPTED','GODPARENT')),
    start_date        DATE,
    end_date          DATE,
    notes             TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CHECK (from_member_id <> to_member_id),
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_relationships_family    ON relationships (family_id);
CREATE INDEX idx_relationships_from      ON relationships (from_member_id);
CREATE INDEX idx_relationships_to        ON relationships (to_member_id);
CREATE INDEX idx_relationships_pair      ON relationships (from_member_id, to_member_id);
CREATE INDEX idx_relationships_type      ON relationships (relationship_type);

CREATE TABLE family_invitations (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id       UUID         NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    inviter_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_email   TEXT         NOT NULL,
    invite_code     TEXT         NOT NULL UNIQUE,
    role            TEXT         NOT NULL CHECK (role IN ('ADMIN','EDITOR','VIEWER')),
    expires_at      TIMESTAMPTZ  NOT NULL,
    accepted_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_family_invitations_family ON family_invitations (family_id);
CREATE INDEX idx_family_invitations_inviter ON family_invitations (inviter_id);
CREATE INDEX idx_family_invitations_email  ON family_invitations (invitee_email);

-- ---------------------------------------------------------------------
-- C. RECIPES (with genealogy)
-- ---------------------------------------------------------------------

CREATE TABLE recipes (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id            UUID         NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    author_id            UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title                TEXT         NOT NULL,
    description          TEXT,
    story                TEXT,
    cuisine_type         TEXT,
    difficulty           TEXT         NOT NULL DEFAULT 'MEDIUM'
                                     CHECK (difficulty IN ('EASY','MEDIUM','HARD')),
    prep_time_minutes    INTEGER      CHECK (prep_time_minutes IS NULL OR prep_time_minutes >= 0),
    cook_time_minutes    INTEGER      CHECK (cook_time_minutes IS NULL OR cook_time_minutes >= 0),
    servings             INTEGER      CHECK (servings IS NULL OR servings > 0),
    instructions         TEXT         NOT NULL,
    image_url            TEXT,
    is_public            BOOLEAN      NOT NULL DEFAULT FALSE,
    view_count           INTEGER      NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipes_family     ON recipes (family_id);
CREATE INDEX idx_recipes_author     ON recipes (author_id);
CREATE INDEX idx_recipes_cuisine    ON recipes (cuisine_type);
CREATE INDEX idx_recipes_public     ON recipes (is_public);
CREATE INDEX idx_recipes_created_at ON recipes (created_at);

CREATE TABLE recipe_ingredients (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id    UUID         NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name         TEXT         NOT NULL,
    quantity     NUMERIC(10,2) CHECK (quantity IS NULL OR quantity > 0),
    unit         TEXT,
    notes        TEXT,
    order_index  INTEGER      NOT NULL DEFAULT 0
);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients (recipe_id);

CREATE TABLE recipe_steps (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id         UUID         NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    step_number       INTEGER      NOT NULL CHECK (step_number > 0),
    instruction       TEXT         NOT NULL,
    duration_minutes  INTEGER      CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
    image_url         TEXT,
    UNIQUE (recipe_id, step_number)
);

CREATE INDEX idx_recipe_steps_recipe ON recipe_steps (recipe_id);

CREATE TABLE recipe_origins (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id         UUID         NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    from_member_id    UUID         NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    to_member_id      UUID         NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    year_transmitted  INTEGER      CHECK (year_transmitted IS NULL OR year_transmitted > 0),
    generation_gap    INTEGER      CHECK (generation_gap IS NULL OR generation_gap >= 0),
    story             TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CHECK (from_member_id <> to_member_id)
);

CREATE INDEX idx_recipe_origins_recipe  ON recipe_origins (recipe_id);
CREATE INDEX idx_recipe_origins_from    ON recipe_origins (from_member_id);
CREATE INDEX idx_recipe_origins_to      ON recipe_origins (to_member_id);

CREATE TABLE recipe_reactions (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id      UUID         NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type  TEXT         NOT NULL
                                 CHECK (reaction_type IN ('LIKE','LOVE','YUM','WANT_TO_TRY')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (recipe_id, user_id, reaction_type)
);

CREATE INDEX idx_recipe_reactions_recipe ON recipe_reactions (recipe_id);
CREATE INDEX idx_recipe_reactions_user   ON recipe_reactions (user_id);

CREATE TABLE recipe_comments (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id           UUID         NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    user_id             UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT         NOT NULL,
    parent_comment_id   UUID         REFERENCES recipe_comments(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recipe_comments_recipe   ON recipe_comments (recipe_id);
CREATE INDEX idx_recipe_comments_user     ON recipe_comments (user_id);
CREATE INDEX idx_recipe_comments_parent   ON recipe_comments (parent_comment_id);

-- ---------------------------------------------------------------------
-- D. STORIES (multi-generational)
-- ---------------------------------------------------------------------

CREATE TABLE stories (
    id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id              UUID         NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    author_id              UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title                  TEXT         NOT NULL,
    content                TEXT         NOT NULL,
    story_date             DATE,
    story_location         TEXT,
    related_member_ids     UUID[]       NOT NULL DEFAULT '{}',
    related_generation_id  UUID         REFERENCES generations(id) ON DELETE SET NULL,
    is_featured            BOOLEAN      NOT NULL DEFAULT FALSE,
    view_count             INTEGER      NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stories_family      ON stories (family_id);
CREATE INDEX idx_stories_author      ON stories (author_id);
CREATE INDEX idx_stories_featured    ON stories (is_featured);
CREATE INDEX idx_stories_created_at  ON stories (created_at);
CREATE INDEX idx_stories_members_gin ON stories USING GIN (related_member_ids);

CREATE TABLE story_media (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id     UUID         NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    media_type   TEXT         NOT NULL
                             CHECK (media_type IN ('IMAGE','VIDEO','AUDIO','DOCUMENT')),
    media_url    TEXT         NOT NULL,
    caption      TEXT,
    order_index  INTEGER      NOT NULL DEFAULT 0,
    uploaded_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_story_media_story ON story_media (story_id);

CREATE TABLE story_tags (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT         NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE story_tag_map (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id  UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    tag_id    UUID NOT NULL REFERENCES story_tags(id) ON DELETE CASCADE,
    UNIQUE (story_id, tag_id)
);

CREATE INDEX idx_story_tag_map_story ON story_tag_map (story_id);
CREATE INDEX idx_story_tag_map_tag   ON story_tag_map (tag_id);

-- ---------------------------------------------------------------------
-- E. TIME CAPSULES
-- ---------------------------------------------------------------------

CREATE TABLE time_capsules (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id           UUID         NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    creator_id          UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title               TEXT         NOT NULL,
    content             TEXT,
    media_url           TEXT,
    recipient_member_id UUID         REFERENCES family_members(id) ON DELETE SET NULL,
    unlock_date         DATE,
    unlock_condition    TEXT         NOT NULL DEFAULT 'DATE'
                                      CHECK (unlock_condition IN ('DATE','EVENT','MANUAL')),
    unlock_event        TEXT,
    is_opened           BOOLEAN      NOT NULL DEFAULT FALSE,
    opened_at           TIMESTAMPTZ,
    opened_by           UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CHECK (unlock_condition <> 'DATE' OR unlock_date IS NOT NULL)
);

CREATE INDEX idx_time_capsules_family      ON time_capsules (family_id);
CREATE INDEX idx_time_capsules_creator     ON time_capsules (creator_id);
CREATE INDEX idx_time_capsules_recipient   ON time_capsules (recipient_member_id);
CREATE INDEX idx_time_capsules_unlock_date ON time_capsules (unlock_date);
CREATE INDEX idx_time_capsules_opened      ON time_capsules (is_opened);

-- ---------------------------------------------------------------------
-- F. EVENTS
-- ---------------------------------------------------------------------

CREATE TABLE events (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id         UUID         NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    creator_id        UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title             TEXT         NOT NULL,
    description       TEXT,
    event_type        TEXT         NOT NULL
                                  CHECK (event_type IN
                                         ('WEDDING','FUNERAL','BIRTHDAY','REUNION',
                                          'ANNIVERSARY','RELIGIOUS','OTHER')),
    event_date        TIMESTAMPTZ  NOT NULL,
    end_date          TIMESTAMPTZ,
    location          TEXT,
    latitude          NUMERIC(9,6) CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)),
    longitude         NUMERIC(9,6) CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180)),
    cover_image_url   TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CHECK (end_date IS NULL OR end_date >= event_date)
);

CREATE INDEX idx_events_family      ON events (family_id);
CREATE INDEX idx_events_creator     ON events (creator_id);
CREATE INDEX idx_events_event_date  ON events (event_date);
CREATE INDEX idx_events_type        ON events (event_type);

CREATE TABLE event_attendees (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id      UUID         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id     UUID         NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    rsvp_status   TEXT         NOT NULL DEFAULT 'PENDING'
                               CHECK (rsvp_status IN ('GOING','MAYBE','NOT_GOING','PENDING')),
    notes         TEXT,
    responded_at  TIMESTAMPTZ,
    UNIQUE (event_id, member_id)
);

CREATE INDEX idx_event_attendees_event  ON event_attendees (event_id);
CREATE INDEX idx_event_attendees_member ON event_attendees (member_id);

CREATE TABLE event_photos (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id     UUID         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    photo_url    TEXT         NOT NULL,
    caption      TEXT,
    uploaded_by  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_photos_event ON event_photos (event_id);
CREATE INDEX idx_event_photos_user  ON event_photos (uploaded_by);

-- ---------------------------------------------------------------------
-- G. PHOTOS
-- ---------------------------------------------------------------------

CREATE TABLE photo_albums (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id        UUID         NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    creator_id       UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title            TEXT         NOT NULL,
    description      TEXT,
    cover_photo_url  TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photo_albums_family  ON photo_albums (family_id);
CREATE INDEX idx_photo_albums_creator ON photo_albums (creator_id);

CREATE TABLE photos (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id        UUID         NOT NULL REFERENCES photo_albums(id) ON DELETE CASCADE,
    uploader_id     UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    photo_url       TEXT         NOT NULL,
    caption         TEXT,
    photo_date      DATE,
    photo_location  TEXT,
    member_ids      UUID[]       NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_album        ON photos (album_id);
CREATE INDEX idx_photos_uploader     ON photos (uploader_id);
CREATE INDEX idx_photos_members_gin  ON photos USING GIN (member_ids);

CREATE TABLE photo_tags (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id            UUID         NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    tag_type            TEXT         NOT NULL
                                    CHECK (tag_type IN ('MEMBER','LOCATION','EVENT')),
    tagged_member_id    UUID         REFERENCES family_members(id) ON DELETE CASCADE,
    tagged_event_id     UUID         REFERENCES events(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CHECK ((tag_type = 'MEMBER'   AND tagged_member_id IS NOT NULL AND tagged_event_id IS NULL)
        OR (tag_type = 'EVENT'    AND tagged_event_id  IS NOT NULL AND tagged_member_id IS NULL)
        OR (tag_type = 'LOCATION' AND tagged_member_id IS NULL     AND tagged_event_id IS NULL))
);

CREATE INDEX idx_photo_tags_photo  ON photo_tags (photo_id);
CREATE INDEX idx_photo_tags_member ON photo_tags (tagged_member_id);
CREATE INDEX idx_photo_tags_event  ON photo_tags (tagged_event_id);

-- ---------------------------------------------------------------------
-- H. CHAT
-- ---------------------------------------------------------------------

CREATE TABLE family_chats (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id    UUID         NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name         TEXT         NOT NULL,
    description  TEXT,
    created_by   UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_family_chats_family ON family_chats (family_id);

CREATE TABLE chat_members (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id      UUID         NOT NULL REFERENCES family_chats(id) ON DELETE CASCADE,
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    role         TEXT         NOT NULL DEFAULT 'MEMBER'
                             CHECK (role IN ('MEMBER','ADMIN')),
    UNIQUE (chat_id, user_id)
);

CREATE INDEX idx_chat_members_chat ON chat_members (chat_id);
CREATE INDEX idx_chat_members_user ON chat_members (user_id);

CREATE TABLE chat_messages (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id             UUID         NOT NULL REFERENCES family_chats(id) ON DELETE CASCADE,
    sender_id           UUID         REFERENCES users(id) ON DELETE SET NULL,
    content             TEXT,
    message_type        TEXT         NOT NULL DEFAULT 'TEXT'
                                    CHECK (message_type IN ('TEXT','IMAGE','FILE','SYSTEM')),
    attachment_url      TEXT,
    reply_to_message_id UUID         REFERENCES chat_messages(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    edited_at           TIMESTAMPTZ,
    deleted_at          TIMESTAMPTZ
);

CREATE INDEX idx_chat_messages_chat    ON chat_messages (chat_id);
CREATE INDEX idx_chat_messages_sender  ON chat_messages (sender_id);
CREATE INDEX idx_chat_messages_reply   ON chat_messages (reply_to_message_id);
CREATE INDEX idx_chat_messages_created ON chat_messages (created_at);

-- ---------------------------------------------------------------------
-- I. ENGAGEMENT
-- ---------------------------------------------------------------------

CREATE TABLE achievements (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code         TEXT NOT NULL UNIQUE,
    name         TEXT NOT NULL,
    description  TEXT,
    icon_url     TEXT,
    points       INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0)
);

CREATE TABLE member_achievements (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id      UUID         NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    achievement_id UUID         NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    notes          TEXT,
    UNIQUE (member_id, achievement_id)
);

CREATE INDEX idx_member_achievements_member      ON member_achievements (member_id);
CREATE INDEX idx_member_achievements_achievement ON member_achievements (achievement_id);

CREATE TABLE family_heritages (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id        UUID         NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    heritage_type    TEXT         NOT NULL
                                  CHECK (heritage_type IN
                                         ('MOTTO','SYMBOL','TRADITION','SONG','STORY','RECIPE')),
    title            TEXT         NOT NULL,
    description      TEXT,
    media_url        TEXT,
    year_established INTEGER      CHECK (year_established IS NULL OR year_established > 0),
    created_by       UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_family_heritages_family ON family_heritages (family_id);
CREATE INDEX idx_family_heritages_type   ON family_heritages (heritage_type);

CREATE TABLE notifications (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type    TEXT         NOT NULL,
    title                TEXT         NOT NULL,
    content              TEXT,
    related_entity_type  TEXT,
    related_entity_id    UUID,
    is_read              BOOLEAN      NOT NULL DEFAULT FALSE,
    read_at              TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user      ON notifications (user_id);
CREATE INDEX idx_notifications_unread    ON notifications (user_id, is_read);
CREATE INDEX idx_notifications_created   ON notifications (created_at);
CREATE INDEX idx_notifications_entity    ON notifications (related_entity_type, related_entity_id);

-- Polymorphic comments: entity_type must match entity_id source (no FK by design)
CREATE TABLE comments (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type  TEXT         NOT NULL
                             CHECK (entity_type IN ('STORY','PHOTO','EVENT')),
    entity_id    UUID         NOT NULL,
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content      TEXT         NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_entity ON comments (entity_type, entity_id);
CREATE INDEX idx_comments_user   ON comments (user_id);

CREATE TABLE reactions (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type    TEXT         NOT NULL,
    entity_id      UUID         NOT NULL,
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type  TEXT         NOT NULL
                                CHECK (reaction_type IN ('LIKE','LOVE','YUM','WANT_TO_TRY')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (entity_type, entity_id, user_id, reaction_type)
);

CREATE INDEX idx_reactions_entity ON reactions (entity_type, entity_id);
CREATE INDEX idx_reactions_user   ON reactions (user_id);

-- ---------------------------------------------------------------------
-- AUTO-UPDATE updated_at via trigger
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users','families','family_members','recipes','stories',
        'events','recipe_comments'
    ]
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
            t, t);
    END LOOP;
END $$;

-- =====================================================================
-- End V1
-- =====================================================================