-- =====================================================================
-- CâyGiaPhảSố - V4: Fix data integrity & performance issues
-- =====================================================================
-- Based on V1-V3 review. All changes are idempotent (IF EXISTS/IF NOT EXISTS).
-- Safe to re-run if needed.

SET search_path = caygiaphaso, public;

-- ---------------------------------------------------------------------
-- FIX 1: members_count counter sync + trigger
-- ---------------------------------------------------------------------
-- Sync families.member_count with actual family_members count.
UPDATE caygiaphaso.families f
SET member_count = COALESCE(
  (SELECT COUNT(*) FROM caygiaphaso.family_members m WHERE m.family_id = f.id), 0);

-- Trigger function to keep member_count in sync on INSERT/DELETE
CREATE OR REPLACE FUNCTION caygiaphaso.sync_member_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE caygiaphaso.families SET member_count = member_count + 1 WHERE id = NEW.family_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE caygiaphaso.families
      SET member_count = GREATEST(0, member_count - 1)
      WHERE id = OLD.family_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_member_count_ins ON caygiaphaso.family_members;
DROP TRIGGER IF EXISTS trg_member_count_del ON caygiaphaso.family_members;
CREATE TRIGGER trg_member_count_ins AFTER INSERT ON caygiaphaso.family_members
  FOR EACH ROW EXECUTE FUNCTION caygiaphaso.sync_member_count();
CREATE TRIGGER trg_member_count_del AFTER DELETE ON caygiaphaso.family_members
  FOR EACH ROW EXECUTE FUNCTION caygiaphaso.sync_member_count();

-- ---------------------------------------------------------------------
-- FIX 2: family_members uniqueness (one row per user per family)
-- ---------------------------------------------------------------------
-- Add unique partial index: each user can appear at most once per family
CREATE UNIQUE INDEX IF NOT EXISTS uq_family_members_user_family_alive
  ON caygiaphaso.family_members (family_id, user_id)
  WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- FIX 3: recipe_reactions race fix - tighten unique constraint
-- ---------------------------------------------------------------------
-- The application enforces "one reaction per user per recipe", so the
-- schema constraint should reflect that.
ALTER TABLE caygiaphaso.recipe_reactions
  DROP CONSTRAINT IF EXISTS recipe_reactions_recipe_id_user_id_reaction_type_key;

ALTER TABLE caygiaphaso.recipe_reactions
  ADD CONSTRAINT recipe_reactions_unique_user UNIQUE (recipe_id, user_id);

-- ---------------------------------------------------------------------
-- FIX 4: chat_messages content NOT NULL with sensible default
-- ---------------------------------------------------------------------
ALTER TABLE caygiaphaso.chat_messages
  ALTER COLUMN content SET DEFAULT '';

-- Add CHECK so TEXT messages have content, IMAGE/FILE have attachment_url
ALTER TABLE caygiaphaso.chat_messages
  DROP CONSTRAINT IF EXISTS chat_msg_content_or_attachment;
ALTER TABLE caygiaphaso.chat_messages
  ADD CONSTRAINT chat_msg_content_or_attachment
  CHECK (
    (message_type IN ('IMAGE', 'FILE') AND attachment_url IS NOT NULL)
    OR (message_type IN ('TEXT', 'SYSTEM')
        AND content IS NOT NULL AND length(trim(content)) > 0)
  );

-- ---------------------------------------------------------------------
-- FIX 5: story_tags case-insensitive uniqueness
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_story_tags_lower_name
  ON caygiaphaso.story_tags (LOWER(name));

-- ---------------------------------------------------------------------
-- FIX 6: composite indexes for query performance
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_recipes_family_created_at
  ON caygiaphaso.recipes (family_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stories_family_created_at
  ON caygiaphaso.stories (family_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_family_event_date
  ON caygiaphaso.events (family_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created
  ON caygiaphaso.chat_messages (chat_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON caygiaphaso.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
  ON caygiaphaso.notifications (user_id, created_at DESC)
  WHERE is_read = FALSE;

-- ---------------------------------------------------------------------
-- FIX 7: photo_tags add location text support
-- ---------------------------------------------------------------------
ALTER TABLE caygiaphaso.photo_tags
  ADD COLUMN IF NOT EXISTS tag_value TEXT;

ALTER TABLE caygiaphaso.photo_tags
  DROP CONSTRAINT IF EXISTS photo_tags_value_required_for_location;
ALTER TABLE caygiaphaso.photo_tags
  ADD CONSTRAINT photo_tags_value_required_for_location
  CHECK (tag_type <> 'LOCATION' OR (tag_value IS NOT NULL AND length(trim(tag_value)) > 0));

-- ---------------------------------------------------------------------
-- FIX 8: drop redundant indexes
-- ---------------------------------------------------------------------
DROP INDEX IF EXISTS caygiaphaso.idx_users_email;
DROP INDEX IF EXISTS caygiaphaso.idx_users_active;
-- Replace with a more useful partial index
CREATE INDEX IF NOT EXISTS idx_users_active_email
  ON caygiaphaso.users (email) WHERE is_active = TRUE;

DROP INDEX IF EXISTS caygiaphaso.idx_recipes_created_at;
DROP INDEX IF EXISTS caygiaphaso.idx_stories_created_at;

-- =====================================================================
-- End V4
-- =====================================================================
