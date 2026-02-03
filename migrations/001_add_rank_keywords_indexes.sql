-- ============================================================
-- IndexNow Studio - Missing Indexes Migration
-- ============================================================
-- Generated: 2026-02-03
-- Purpose: Add critical performance indexes for rank tracking queries
-- ============================================================

-- 1. Composite index for faster user domain lookups
-- This optimizes queries that filter keywords by user_id and domain
CREATE INDEX IF NOT EXISTS idx_rank_keywords_user_domain 
ON indb_rank_keywords(user_id, domain);

-- 2. GIN index for faster keyword searches
-- This optimizes ILIKE queries on the keyword column
CREATE INDEX IF NOT EXISTS idx_rank_keywords_keyword_gin 
ON indb_rank_keywords USING gin(keyword gin_trgm_ops);

-- 3. Composite index for filtering by user and tags
-- The tags column is an array, so we use GIN
CREATE INDEX IF NOT EXISTS idx_rank_keywords_user_tags 
ON indb_rank_keywords USING gin(tags);

-- 4. Composite index for filtering active keywords by user
CREATE INDEX IF NOT EXISTS idx_rank_keywords_user_active 
ON indb_rank_keywords(user_id, is_active);

-- 5. Index for last_checked to optimize stale keyword queries
CREATE INDEX IF NOT EXISTS idx_rank_keywords_last_checked 
ON indb_rank_keywords(last_checked);

-- 6. Add pg_trgm extension if not exists (required for GIN trgm ops)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
