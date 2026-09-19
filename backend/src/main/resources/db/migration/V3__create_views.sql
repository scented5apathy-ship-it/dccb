-- =====================================================================
-- CâyGiaPhảSố - V3: Useful Views
-- =====================================================================
-- Views for common queries: family trees, recipe genealogy,
-- event timelines, member stats.
-- =====================================================================

SET search_path = caygiaphaso, public;

-- ---------------------------------------------------------------------
-- 1. v_family_summary — family overview with creator and counts
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_family_summary AS
SELECT
    f.id,
    f.name,
    f.motto,
    f.origin_location,
    f.founded_year,
    f.member_count,
    f.created_at,
    creator.id            AS creator_id,
    creator.full_name     AS creator_name,
    creator.email         AS creator_email,
    (SELECT COUNT(*) FROM generations g WHERE g.family_id = f.id) AS generation_count,
    (SELECT COUNT(*) FROM recipes r WHERE r.family_id = f.id) AS recipe_count,
    (SELECT COUNT(*) FROM stories s WHERE s.family_id = f.id) AS story_count,
    (SELECT COUNT(*) FROM events e WHERE e.family_id = f.id) AS event_count
FROM families f
JOIN users creator ON creator.id = f.created_by;

-- ---------------------------------------------------------------------
-- 2. v_member_with_user — combine family_members with linked user info
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_member_with_user AS
SELECT
    fm.id,
    fm.family_id,
    f.name             AS family_name,
    fm.user_id,
    fm.full_name,
    fm.nickname,
    fm.gender,
    fm.birth_date,
    fm.death_date,
    fm.is_alive,
    fm.birth_place,
    fm.current_location,
    fm.occupation,
    fm.generation_id,
    g.generation_number,
    g.name             AS generation_name,
    fm.biography,
    u.email            AS user_email,
    u.is_active        AS user_active,
    u.avatar_url       AS user_avatar_url
FROM family_members fm
JOIN families f       ON f.id  = fm.family_id
LEFT JOIN generations g ON g.id = fm.generation_id
LEFT JOIN users u     ON u.id  = fm.user_id;

-- ---------------------------------------------------------------------
-- 3. v_relationships_full — join from->to members for easy display
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_relationships_full AS
SELECT
    r.id,
    r.family_id,
    r.relationship_type,
    r.start_date,
    r.end_date,
    r.notes,
    r.created_at,
    r.from_member_id,
    from_m.full_name   AS from_member_name,
    from_m.nickname    AS from_nickname,
    r.to_member_id,
    to_m.full_name     AS to_member_name,
    to_m.nickname      AS to_nickname
FROM relationships r
JOIN family_members from_m ON from_m.id = r.from_member_id
JOIN family_members to_m   ON to_m.id   = r.to_member_id;

-- ---------------------------------------------------------------------
-- 4. v_recipe_genealogy — recipe with full lineage (caller → recipient)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_recipe_genealogy AS
SELECT
    r.id                AS recipe_id,
    r.title             AS recipe_title,
    r.family_id,
    f.name              AS family_name,
    ro.id               AS origin_id,
    ro.year_transmitted,
    ro.generation_gap,
    ro.story            AS transmission_story,
    from_m.id           AS from_member_id,
    from_m.full_name    AS from_member_name,
    from_g.generation_number AS from_generation,
    from_g.name         AS from_generation_name,
    to_m.id             AS to_member_id,
    to_m.full_name      AS to_member_name,
    to_g.generation_number   AS to_generation,
    to_g.name           AS to_generation_name
FROM recipe_origins ro
JOIN recipes r        ON r.id  = ro.recipe_id
JOIN families f       ON f.id  = r.family_id
JOIN family_members from_m ON from_m.id = ro.from_member_id
LEFT JOIN generations from_g ON from_g.id = from_m.generation_id
JOIN family_members to_m   ON to_m.id   = ro.to_member_id
LEFT JOIN generations to_g ON to_g.id   = to_m.generation_id;

-- ---------------------------------------------------------------------
-- 5. v_recipe_with_stats — recipe + reaction/comment counts
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_recipe_with_stats AS
SELECT
    r.id,
    r.family_id,
    r.title,
    r.cuisine_type,
    r.difficulty,
    r.is_public,
    r.view_count,
    r.created_at,
    author.id           AS author_id,
    author.full_name    AS author_name,
    (SELECT COUNT(*) FROM recipe_reactions  rr WHERE rr.recipe_id = r.id) AS reaction_count,
    (SELECT COUNT(*) FROM recipe_comments   rc WHERE rc.recipe_id = r.id) AS comment_count,
    (SELECT COUNT(*) FROM recipe_origins    ro WHERE ro.recipe_id = r.id) AS origin_count
FROM recipes r
JOIN users author ON author.id = r.author_id;

-- ---------------------------------------------------------------------
-- 6. v_event_summary — event with attendee counts by status
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_event_summary AS
SELECT
    e.id,
    e.family_id,
    e.title,
    e.description,
    e.event_type,
    e.event_date,
    e.end_date,
    e.location,
    e.cover_image_url,
    e.created_at,
    creator.id          AS creator_id,
    creator.full_name   AS creator_name,
    (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id) AS total_attendees,
    (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.rsvp_status = 'GOING')     AS going_count,
    (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.rsvp_status = 'MAYBE')     AS maybe_count,
    (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.rsvp_status = 'NOT_GOING') AS not_going_count,
    (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id AND ea.rsvp_status = 'PENDING')   AS pending_count,
    (SELECT COUNT(*) FROM event_photos ep WHERE ep.event_id = e.id) AS photo_count
FROM events e
JOIN users creator ON creator.id = e.creator_id;

-- ---------------------------------------------------------------------
-- 7. v_story_with_media — story + media + tag list
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_story_with_media AS
SELECT
    s.id,
    s.family_id,
    s.title,
    s.story_date,
    s.story_location,
    s.is_featured,
    s.view_count,
    s.created_at,
    author.id            AS author_id,
    author.full_name     AS author_name,
    (SELECT COUNT(*) FROM story_media sm WHERE sm.story_id = s.id) AS media_count,
    (SELECT COALESCE(array_agg(st.name ORDER BY st.name), '{}')
       FROM story_tag_map m JOIN story_tags st ON st.id = m.tag_id
      WHERE m.story_id = s.id) AS tags
FROM stories s
JOIN users author ON author.id = s.author_id;

-- ---------------------------------------------------------------------
-- 8. v_time_capsule_status — countdown + open status
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_time_capsule_status AS
SELECT
    tc.id,
    tc.family_id,
    tc.title,
    tc.creator_id,
    creator.full_name   AS creator_name,
    tc.recipient_member_id,
    recipient.full_name AS recipient_name,
    tc.unlock_date,
    tc.unlock_condition,
    tc.is_opened,
    tc.opened_at,
    tc.opened_by,
    opener.full_name    AS opener_name,
    CASE
        WHEN tc.is_opened THEN 'OPENED'
        WHEN tc.unlock_condition = 'DATE'
             AND tc.unlock_date IS NOT NULL
             AND tc.unlock_date <= CURRENT_DATE
        THEN 'AVAILABLE'
        ELSE 'LOCKED'
    END AS current_status,
    CASE
        WHEN tc.unlock_condition = 'DATE' AND tc.unlock_date IS NOT NULL
        THEN tc.unlock_date - CURRENT_DATE
        ELSE NULL
    END AS days_until_unlock
FROM time_capsules tc
JOIN users creator       ON creator.id   = tc.creator_id
LEFT JOIN family_members recipient ON recipient.id = tc.recipient_member_id
LEFT JOIN users opener          ON opener.id     = tc.opened_by;

-- ---------------------------------------------------------------------
-- 9. v_user_activity — per-user engagement summary
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_user_activity AS
SELECT
    u.id,
    u.email,
    u.full_name,
    u.is_active,
    u.last_login_at,
    u.created_at,
    (SELECT COUNT(*) FROM recipes r        WHERE r.author_id  = u.id) AS recipes_authored,
    (SELECT COUNT(*) FROM recipe_reactions rr WHERE rr.user_id = u.id) AS reactions_given,
    (SELECT COUNT(*) FROM recipe_comments  rc WHERE rc.user_id = u.id) AS comments_given,
    (SELECT COUNT(*) FROM stories s        WHERE s.author_id = u.id) AS stories_authored,
    (SELECT COUNT(*) FROM events e         WHERE e.creator_id= u.id) AS events_created,
    (SELECT COUNT(*) FROM chat_messages cm WHERE cm.sender_id= u.id) AS messages_sent,
    (SELECT COUNT(*) FROM photos p         WHERE p.uploader_id = u.id) AS photos_uploaded
FROM users u;

-- ---------------------------------------------------------------------
-- 10. v_active_notifications — unread notifications per user
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_active_notifications AS
SELECT
    n.id,
    n.user_id,
    u.full_name        AS user_name,
    n.notification_type,
    n.title,
    n.content,
    n.related_entity_type,
    n.related_entity_id,
    n.is_read,
    n.created_at
FROM notifications n
JOIN users u ON u.id = n.user_id
WHERE n.is_read = FALSE;

-- =====================================================================
-- End V3
-- =====================================================================