-- ============================================================
-- IndexNow Studio - Atomic Operations RPC
-- ============================================================
-- Generated: 2026-02-03
-- Purpose: Ensure data integrity with atomic updates for positions and tags
-- ============================================================

-- 1. Atomic Keyword Position Update
-- Prevents race conditions when updating rank positions
-- Automatically moves current position to previous_position
CREATE OR REPLACE FUNCTION update_keyword_position_atomic(
  target_keyword_id UUID,
  new_rank_position INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE indb_rank_keywords
  SET 
    previous_position = position,
    position = new_rank_position,
    last_checked = NOW()
  WHERE id = target_keyword_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atomic Tag Addition
-- efficiently appends tags without read-modify-write cycle
-- Uses array operators to handle deduplication
CREATE OR REPLACE FUNCTION add_tags_to_keywords_atomic(
  target_keyword_ids UUID[],
  target_user_id UUID,
  new_tags TEXT[]
) RETURNS INTEGER AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  WITH updated AS (
    UPDATE indb_rank_keywords
    SET tags = (
      SELECT ARRAY(
        SELECT DISTINCT UNNEST(COALESCE(tags, ARRAY[]::TEXT[]) || new_tags)
      )
    )
    WHERE id = ANY(target_keyword_ids)
    AND user_id = target_user_id
    RETURNING 1
  )
  SELECT COUNT(*) INTO updated_rows FROM updated;
  
  RETURN updated_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
