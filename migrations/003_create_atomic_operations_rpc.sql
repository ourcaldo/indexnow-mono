-- ============================================================
-- IndexNow Studio - Atomic Operations RPC
-- ============================================================
-- Generated: 2026-02-03
-- Purpose: Prevent race conditions in rank tracking updates
-- ============================================================

-- 1. Atomic Keyword Position Update
-- Prevents race conditions when updating rank positions
CREATE OR REPLACE FUNCTION update_keyword_position_atomic(
  target_keyword_id UUID,
  new_rank_position INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_pos INTEGER;
BEGIN
  -- Lock the row for update
  SELECT position INTO current_pos
  FROM indb_rank_keywords
  WHERE id = target_keyword_id
  FOR UPDATE;

  -- Update with atomic swap logic
  UPDATE indb_rank_keywords
  SET 
    previous_position = current_pos,
    position = new_rank_position,
    last_checked = NOW()
  WHERE id = target_keyword_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Atomic Add Tags
-- Prevents race conditions when adding tags from multiple sources
CREATE OR REPLACE FUNCTION add_tags_to_keywords_atomic(
  target_keyword_ids UUID[],
  target_user_id UUID,
  new_tags TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  WITH updated_rows AS (
    UPDATE indb_rank_keywords
    SET tags = (
      SELECT array_agg(DISTINCT x)
      FROM unnest(COALESCE(tags, ARRAY[]::TEXT[]) || new_tags) t(x)
    )
    WHERE id = ANY(target_keyword_ids)
    AND user_id = target_user_id
    RETURNING 1
  )
  SELECT count(*) INTO updated_count FROM updated_rows;

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
