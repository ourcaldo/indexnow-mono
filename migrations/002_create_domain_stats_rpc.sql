-- ============================================================
-- IndexNow Studio - Domain Stats RPC
-- ============================================================
-- Generated: 2026-02-03
-- Purpose: Efficiently aggregate domain statistics on the database side
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_domain_stats(target_user_id UUID)
RETURNS TABLE (
  domain TEXT,
  keyword_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rk.domain,
    COUNT(*) as keyword_count
  FROM indb_rank_keywords rk
  WHERE rk.user_id = target_user_id
  AND rk.domain IS NOT NULL
  GROUP BY rk.domain
  ORDER BY keyword_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
