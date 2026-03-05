# Keyword Enrichment System — Deep Dive

## 1. Overview

The keyword enrichment system automatically fetches SEO intelligence data (search volume, CPC, competition, difficulty, keyword intent, search history trends) from the **SeRanking Keyword Export API** and caches it in the `indb_keyword_bank` table. When a user adds a tracked keyword to `indb_rank_keywords`, the enrichment system links it to the bank data via `keyword_bank_id`.

**Purpose**: Users add keywords they want to track. The enrichment system transparently populates the SEO metrics behind the scenes so the frontend can display search volume, CPC, difficulty, etc. alongside rank position data.

---

## 2. Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ENTRY POINTS                                    │
│                                                                        │
│  instrumentation.ts → initializeAllWorkers()                           │
│       │                                                                │
│       ├── initializeKeywordEnrichmentWorker()  (BullMQ path)           │
│       │       └── BullMQ repeatable: pattern '30 * * * *'              │
│       │           └── processKeywordEnrichment(job)                    │
│       │               └── keywordEnrichmentWorker.runManually()        │
│       │                                                                │
│       └── KeywordEnrichmentWorker (also has its own node-cron)         │
│               └── node-cron: pattern '30 * * * *'                      │
│                   └── processKeywords()                                │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    KEYWORD ENRICHMENT WORKER                           │
│                 (job-management/keyword-enrichment-worker.ts)           │
│                                                                        │
│  1. findKeywordsNeedingEnrichment()                                    │
│     SELECT id, keyword, country_id FROM indb_rank_keywords             │
│     WHERE keyword_bank_id IS NULL LIMIT 50                             │
│                                                                        │
│  2. For each keyword:                                                  │
│     a. Resolve country_id UUID → iso2_code (indb_keyword_countries)    │
│     b. Call enrichmentService.enrichKeyword(keyword, countryCode)      │
│     c. On success: UPDATE indb_rank_keywords                           │
│        SET keyword_bank_id = <bank_id>,                                │
│            intelligence_updated_at = NOW()                             │
│     d. Sleep 500ms between keywords                                    │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  KEYWORD ENRICHMENT SERVICE                            │
│          (seranking/services/KeywordEnrichmentService.ts)              │
│                                                                        │
│  enrichKeyword() → delegates to enrichNewKeyword() (Flow 1)           │
│                                                                        │
│  FLOW 1 — New keywords (keyword_bank_id IS NULL):                      │
│    - NO cache check (force API call)                                   │
│    - Call SeRankingApiClient.fetchKeywordData([keyword], countryCode)   │
│    - Store result in indb_keyword_bank via KeywordBankService          │
│    - Return bank entity with id for linking                            │
│                                                                        │
│  FLOW 2 — Stale keywords (data_updated_at > 30 days):                 │
│    - Find stale entries in indb_keyword_bank                           │
│    - Re-fetch from API and update                                      │
│    - Called via refreshStaleKeywords() (not currently triggered)        │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     SERANKING API CLIENT                               │
│            (seranking/client/SeRankingApiClient.ts)                     │
│                                                                        │
│  fetchKeywordData(keywords[], countryCode):                            │
│    1. Check rate limiter (sliding window)                              │
│    2. Get API key from indb_site_integration (cached 5 min)            │
│       WHERE service_name = 'seranking_keyword_export'                  │
│       AND is_active = true                                             │
│    3. Build request via ApiRequestBuilder                              │
│    4. POST https://api.seranking.com/v1/keywords/export                │
│       ?source={countryCode}                                            │
│       Headers: Authorization: Token {apiKey}                           │
│       Body (FormData): keywords[], sort, sort_order, cols              │
│    5. Parse response → SeRankingKeywordData[]                          │
│    6. Record request in rate limiter                                   │
│                                                                        │
│  Retry: 3 attempts, exponential backoff, respects Retry-After header   │
│  Rate limit: In-memory sliding window (minute/hour/day windows)        │
│  Max: 100 keywords per request (enforced by ApiRequestBuilder)         │
└────────────────────────────┬───────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    KEYWORD BANK SERVICE                                │
│          (seranking/services/KeywordBankService.ts)                     │
│                                                                        │
│  storeKeywordData():                                                   │
│    UPSERT INTO indb_keyword_bank                                       │
│    (keyword, country_id, language_code, is_data_found,                 │
│     volume, cpc, competition, difficulty, history_trend,               │
│     keyword_intent, data_updated_at)                                   │
│    ON CONFLICT (keyword, country_id) DO UPDATE                         │
│                                                                        │
│  getKeywordData():                                                     │
│    SELECT FROM indb_keyword_bank                                       │
│    WHERE keyword = $1 AND country_id = $2                              │
│                                                                        │
│  Also provides: getKeywordDataBatch(), search(), cleanup()             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Trigger & Schedule

| Trigger | Schedule | Source File |
|---------|----------|-------------|
| BullMQ repeatable job | `30 * * * *` (every hour at :30) | `apps/api/src/lib/queues/workers/keyword-enrichment.worker.ts` |
| node-cron (standalone) | `30 * * * *` (same) + runs once on startup | `apps/api/src/lib/job-management/keyword-enrichment-worker.ts` |

**Both paths are active simultaneously**, meaning the enrichment runs twice per hour (once from BullMQ, once from node-cron). This is a minor redundancy — the BullMQ job calls `runManually()` which calls `processKeywords()`, and the node-cron also calls `processKeywords()`.

**Startup flow**:
1. Next.js calls `register()` in `instrumentation.ts`
2. `initializeAllWorkers()` is called (fire-and-forget)
3. Among others, `initializeKeywordEnrichmentWorker()` registers the BullMQ worker
4. Meanwhile, the singleton `keywordEnrichmentWorker` module-level export triggers `KeywordEnrichmentWorker.getInstance()` → `initialize()` → `start()` → runs `processKeywords()` immediately + sets up node-cron

---

## 4. Database Tables

### 4.1 Primary Tables

#### `indb_keyword_bank` — Global SEO Data Cache
**Purpose**: Caches SeRanking API results. Shared across all users (not per-user). One row per keyword+country pair.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Bank entry ID (this is what `keyword_bank_id` references) |
| `keyword` | VARCHAR(500) | Keyword text (lowercased) |
| `country_id` | UUID FK → `indb_keyword_countries` | Actually stores ISO2 code string (see note) |
| `language_code` | VARCHAR(10) | Default 'en' |
| `is_data_found` | BOOLEAN | Whether SeRanking returned data for this keyword |
| `volume` | INTEGER | Monthly search volume |
| `cpc` | DECIMAL(10,2) | Cost per click |
| `competition` | DECIMAL(5,2) | Competition score |
| `difficulty` | INTEGER | SEO difficulty score |
| `history_trend` | JSONB | Historical search volume trend data |
| `keyword_intent` | VARCHAR(50) | commercial / informational / navigational / transactional |
| `data_updated_at` | TIMESTAMPTZ | When SEO data was last refreshed from API |
| `created_at` / `updated_at` | TIMESTAMPTZ | Standard timestamps |

**Constraints**: `UNIQUE(keyword, country_id)` — enables upsert on cache miss
**Index**: `idx_keyword_bank_updated` on `data_updated_at` — for finding stale entries

---

#### `indb_rank_keywords` — User's Tracked Keywords
**Purpose**: Each row is a keyword a user is tracking. Links to bank data via `keyword_bank_id`.

| Key Columns for Enrichment | Type | Description |
|---------------------------|------|-------------|
| `keyword_bank_id` | UUID FK → `indb_keyword_bank` | **NULL = needs enrichment**. Set after successful enrichment. |
| `intelligence_updated_at` | TIMESTAMPTZ | When enrichment data was last linked |
| `keyword` | TEXT | The keyword text |
| `country_id` | UUID FK → `indb_keyword_countries` | UUID resolved to ISO2 for API call |

**Index**: `idx_rank_keywords_needs_enrichment` on `(keyword_bank_id) WHERE keyword_bank_id IS NULL AND is_active = TRUE`

---

#### `indb_keyword_countries` — Country Lookup
**Purpose**: Maps UUID to ISO2 country code for API calls.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Referenced by `rank_keywords.country_id` |
| `iso2_code` | VARCHAR(2) UNIQUE | e.g., 'id', 'us', 'gb' — sent to SeRanking API |
| `name` | VARCHAR(100) | Country display name |

---

### 4.2 Integration & Quota Tables

#### `indb_site_integration` — API Configuration
**Purpose**: Stores the SeRanking API key and quota tracking. System-wide row (user_id = NULL).

| Key Columns | Type | Description |
|------------|------|-------------|
| `service_name` | VARCHAR(100) | `'seranking_keyword_export'` |
| `api_key` | TEXT | SeRanking API token |
| `api_url` | TEXT | Base URL |
| `is_active` | BOOLEAN | Must be `true` for enrichment to work |
| `api_quota_limit` | INTEGER | Default 10,000 |
| `api_quota_used` | INTEGER | Current usage count |
| `quota_reset_date` | TIMESTAMPTZ | When quota resets |
| `health_status` | VARCHAR(50) | 'healthy' / 'degraded' / 'unhealthy' |

**Unique constraint**: One row per `(service_name)` where `user_id IS NULL`

---

#### `indb_seranking_usage_logs` — Per-Request Logging

Each API call logs a usage entry:

| Column | Type | Description |
|--------|------|-------------|
| `integration_id` | VARCHAR(100) | ID of the integration row |
| `operation_type` | VARCHAR(100) | e.g., 'keyword_export' |
| `request_count` | INTEGER | Keywords in this request |
| `successful_requests` / `failed_requests` | INTEGER | Outcome |
| `response_time_ms` | INTEGER | Latency |
| `metadata` | JSONB | Additional context |
| `date` | DATE | Calendar day for aggregation |

---

#### `indb_seranking_quota_usage` — Detailed Quota Tracking

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID | Who triggered the enrichment (or system) |
| `operation_type` | VARCHAR(50) | 'api_request' |
| `quota_consumed` / `quota_remaining` / `quota_limit` | INTEGER | Quota state |
| `usage_percentage` | DECIMAL | % of quota used |
| `keywords_count` | INTEGER | Number of keywords in request |

---

#### `indb_seranking_metrics_raw` — Per-Request Metrics

| Column | Type | Description |
|--------|------|-------------|
| `endpoint` | VARCHAR(255) | API endpoint called |
| `status` | VARCHAR(20) | 'success' / 'error' / 'timeout' / 'rate_limited' |
| `duration_ms` | INTEGER | Request duration |
| `cache_hit` | BOOLEAN | Whether data came from cache |
| `retry_attempt` | INTEGER | Retry count for this request |
| `keyword_count` | INTEGER | Keywords in batch |

---

#### `indb_seranking_metrics_aggregated` — Rollup Metrics

| Column | Type | Description |
|--------|------|-------------|
| `period` | TIMESTAMPTZ | Period start |
| `period_type` | VARCHAR(10) | 'hour' / 'day' / 'week' / 'month' |
| `total_requests` / `successful_requests` / `failed_requests` | INTEGER | Counts |
| `average_response_time` | DECIMAL | Average latency |
| `cache_hit_rate` | DECIMAL | Cache efficiency |

---

#### `indb_seranking_health_checks` — Health Monitor History

| Column | Type | Description |
|--------|------|-------------|
| `service_name` | VARCHAR(100) | Service being checked |
| `check_type` | VARCHAR(20) | 'api' / 'database' / 'cache' / 'queue' |
| `status` | VARCHAR(20) | 'healthy' / 'degraded' / 'unhealthy' / 'critical' |
| `response_time` | INTEGER | Check latency |
| `diagnostics` / `recommendations` | JSONB | Detailed check data |

---

#### `indb_enrichment_jobs` — DB-Backed Job Queue

| Column | Type | Description |
|--------|------|-------------|
| `job_type` | VARCHAR(50) | 'single_keyword' / 'bulk_enrichment' / 'cache_refresh' |
| `status` | VARCHAR(50) | pending → queued → processing → completed/failed |
| `priority` | INTEGER | 1 (critical) to 4 (low) |
| `config` | JSONB | `EnrichmentJobConfig` (batch size, retries, timeout, etc.) |
| `results` | JSONB | `JobResult` (summary of enrichment outcomes) |
| `worker_id` | VARCHAR(100) | Which worker instance owns this job |
| `locked_at` | TIMESTAMPTZ | For optimistic locking |
| `retry_count` | INTEGER | Number of retries |
| `total_keywords` / `processed_keywords` / `enriched_keywords` / `failed_keywords` | INTEGER | Progress counters |

---

## 5. Complete Processing Flow

### Step-by-Step: New Keyword Enrichment

```
User adds keyword "loker nexjob" for domain nexjob.tech, country Indonesia (UUID: c01e8651...)
  │
  ▼
indb_rank_keywords row created:
  keyword = "loker nexjob"
  domain = "nexjob.tech"
  country_id = "c01e8651..."  (Indonesia)
  keyword_bank_id = NULL       ← triggers enrichment
  │
  ▼  (within ~30 minutes, at :30 of the hour)
  
KeywordEnrichmentWorker.processKeywords()
  │
  ├─ Step 1: findKeywordsNeedingEnrichment(limit=50)
  │    SELECT id, user_id, keyword, country_id, keyword_bank_id, intelligence_updated_at
  │    FROM indb_rank_keywords
  │    WHERE keyword_bank_id IS NULL
  │    LIMIT 50
  │    → Returns [{id: "499f2f1e...", keyword: "loker nexjob", country_id: "c01e8651..."}]
  │
  ├─ Step 2: enrichKeyword(keyword)
  │    │
  │    ├─ 2a: Resolve country UUID → ISO2
  │    │    SELECT iso2_code FROM indb_keyword_countries WHERE id = 'c01e8651...'
  │    │    → "id" (Indonesia)
  │    │
  │    ├─ 2b: Call enrichmentService.enrichKeyword("loker nexjob", "id")
  │    │    │
  │    │    └─ enrichNewKeyword() [FLOW 1 — no cache check]
  │    │         │
  │    │         ├─ fetchFromApi(["loker nexjob"], "id")
  │    │         │    │
  │    │         │    └─ SeRankingApiClient.fetchKeywordData(["loker nexjob"], "id")
  │    │         │         │
  │    │         │         ├─ Rate limiter: check sliding window
  │    │         │         ├─ Get API key from indb_site_integration (cached 5min)
  │    │         │         │    SELECT api_key FROM indb_site_integration
  │    │         │         │    WHERE service_name = 'seranking_keyword_export' AND is_active = true
  │    │         │         │
  │    │         │         ├─ Build request:
  │    │         │         │    POST https://api.seranking.com/v1/keywords/export?source=id
  │    │         │         │    Authorization: Token {apiKey}
  │    │         │         │    Content-Type: multipart/form-data
  │    │         │         │    Body: keywords[]=loker+nexjob&sort=cpc&sort_order=desc
  │    │         │         │           &cols=keyword,volume,cpc,competition,difficulty,history_trend
  │    │         │         │
  │    │         │         └─ Response: [{
  │    │         │              is_data_found: true,
  │    │         │              keyword: "loker nexjob",
  │    │         │              volume: 1200,
  │    │         │              cpc: 0.15,
  │    │         │              competition: 0.45,
  │    │         │              difficulty: 28,
  │    │         │              history_trend: {...}
  │    │         │            }]
  │    │         │
  │    │         └─ storeEnrichedData() → KeywordBankService.storeKeywordData()
  │    │              UPSERT INTO indb_keyword_bank
  │    │              (keyword, country_id, language_code, is_data_found,
  │    │               volume, cpc, competition, difficulty, history_trend, data_updated_at)
  │    │              VALUES ('loker nexjob', 'id', 'en', true, 1200, 0.15, 0.45, 28, '{...}', NOW())
  │    │              ON CONFLICT (keyword, country_id) DO UPDATE SET ...
  │    │              → Returns bank entity with id: "abc123..."
  │    │
  │    └─ 2c: Link keyword to bank entry
  │         UPDATE indb_rank_keywords
  │         SET keyword_bank_id = 'abc123...',
  │             intelligence_updated_at = NOW(),
  │             updated_at = NOW()
  │         WHERE id = '499f2f1e...'
  │
  └─ Step 3: Sleep 500ms, then process next keyword
```

### Flow 2: Stale Keyword Refresh (Not Currently Auto-Triggered)

```
KeywordEnrichmentService.refreshStaleKeywords(limit=50)
  │
  ├─ Find stale entries:
  │    SELECT id, keyword, country_id, data_updated_at
  │    FROM indb_keyword_bank
  │    WHERE data_updated_at < (NOW() - 30 days)
  │    AND is_data_found = true
  │    LIMIT 50
  │
  ├─ For each stale keyword:
  │    ├─ Call SeRanking API with latest data
  │    └─ UPDATE indb_keyword_bank with refreshed values
  │
  └─ Note: This flow exists in code but is NOT automatically triggered
     by any cron/schedule. It must be called manually or via API route.
```

---

## 6. Service Dependency Map

### Core Services

| Service | File | Lines | Purpose |
|---------|------|-------|---------|
| **KeywordEnrichmentWorker** | `job-management/keyword-enrichment-worker.ts` | 468 | Singleton orchestrator; finds keywords, calls enrichment |
| **KeywordEnrichmentService** | `seranking/services/KeywordEnrichmentService.ts` | 926 | Core enrichment logic (Flow 1 + Flow 2) |
| **KeywordBankService** | `seranking/services/KeywordBankService.ts` | 1220 | CRUD for `indb_keyword_bank` |
| **SeRankingApiClient** | `seranking/client/SeRankingApiClient.ts` | 532 | HTTP client for SeRanking API |
| **ApiRequestBuilder** | `seranking/client/ApiRequestBuilder.ts` | ~270 | Builds FormData POST requests |
| **RateLimiter** | `seranking/client/RateLimiter.ts` | 360 | Sliding window rate limiter (in-memory) |
| **IntegrationService** | `seranking/services/IntegrationService.ts` | 1259 | API key retrieval, quota tracking |
| **SeRankingErrorHandler** | `seranking/services/ErrorHandlingService.ts` | 897 | Circuit breaker, retry strategies |
| **ValidationService** | `seranking/services/ValidationService.ts` | 936 | Zod-based input/output validation |

### Supporting Services (Background Timers)

| Service | File | Lines | Timer | Purpose |
|---------|------|-------|-------|---------|
| **EnrichmentQueue** | `seranking/services/EnrichmentQueue.ts` | 1224 | Every 1h (cleanup), 30s (heartbeat) | DB-backed job queue for `indb_enrichment_jobs` |
| **JobProcessor** | `seranking/services/JobProcessor.ts` | 860 | On-demand | Worker pool (1–5 auto-scaling) |
| **HealthChecker** | `seranking/services/HealthChecker.ts` | 1185 | Every 30s | API/DB/cache health monitoring |
| **QuotaMonitor** | `seranking/services/QuotaMonitor.ts` | 1105 | Every 60s | Usage velocity, predictive alerts |
| **ApiMetricsCollector** | `seranking/services/ApiMetricsCollector.ts` | 200 | N/A | In-memory real-time metrics (max 10K entries) |

### Facade

| Service | File | Lines | Purpose |
|---------|------|-------|---------|
| **SeRankingService** | `seranking/services/SeRankingService.ts` | 976 | Wires all sub-services; exports singleton `seRankingService` |

---

## 7. SeRanking API Details

### Endpoint

```
POST https://api.seranking.com/v1/keywords/export?source={countryCode}
```

### Authentication

```
Authorization: Token {apiKey}
```

API key is stored in `indb_site_integration.api_key` where `service_name = 'seranking_keyword_export'`.
Cached for 5 minutes in `SeRankingApiClient` to avoid DB lookups on every request.

### Request Format

```
Content-Type: multipart/form-data

keywords[] = keyword1
keywords[] = keyword2
sort = cpc
sort_order = desc
cols = keyword,volume,cpc,competition,difficulty,history_trend
```

**Max 100 keywords per request** (enforced by `ApiRequestBuilder`).

### Response Format

```json
[
  {
    "is_data_found": true,
    "keyword": "loker nexjob",
    "volume": 1200,
    "cpc": 0.15,
    "competition": 0.45,
    "difficulty": 28,
    "history_trend": [
      { "month": "2026-01", "volume": 1100 },
      { "month": "2026-02", "volume": 1300 }
    ]
  }
]
```

### Error Handling

- 3 retry attempts with exponential backoff (1s → 2s → 4s)
- Respects `Retry-After` header from 429 responses
- Circuit breaker pattern in `SeRankingErrorHandler`
- Rate limiter: sliding window (minute/hour/day granularity)

---

## 8. Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `ENABLE_BULLMQ` | No | `false` | Enables BullMQ workers (required for enrichment via queue path) |
| `REDIS_HOST` | If BullMQ | `localhost` | Redis for BullMQ |
| `REDIS_PORT` | If BullMQ | `6379` | Redis port |
| `REDIS_PASSWORD` | If BullMQ | — | Redis auth |
| `SUPABASE_URL` | Yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | — | Service role for admin DB access |

**Note**: The SeRanking API key is stored in the database (`indb_site_integration`), not in environment variables. This allows runtime key rotation without redeployment.

---

## 9. API Routes (Status)

All routes are in `apps/api/src/app/api/v1/integrations/seranking/`:

| Route | Method | Status | Description |
|-------|--------|--------|-------------|
| `keyword-data/` | GET | **501 Stub** | Get keyword intelligence |
| `keyword-data/bulk/` | POST | **501 Stub** | Bulk keyword enrichment |
| `health/` | GET | **Partial** | Health check (DB works, API check partial) |
| `health/metrics/` | GET | **501 Stub** | API metrics |
| `quota/status/` | GET | **501 Stub** | Quota status |
| `quota/history/` | GET | **501 Stub** | Quota usage history |

These routes are not used by the enrichment worker (which runs automatically). They would be for admin dashboards or manual triggers.

---

## 10. How the Frontend Accesses Enrichment Data

The frontend never calls the enrichment system directly. Instead:

1. **Keywords list** (`GET /api/v1/rank-tracking/keywords`):
   - Fetches keywords from `indb_rank_keywords`
   - For each keyword with `keyword_bank_id`, the SEO data (volume, CPC, etc.) is available via JOIN to `indb_keyword_bank`
   - Returns enriched keyword objects to the frontend

2. **Dashboard** (`GET /api/v1/dashboard`):
   - Includes keyword counts and position data
   - SEO metrics available through keyword bank linkage

---

## 11. Known Issues & Observations

### 11.1 ~~Dual Processing Path (Redundancy)~~ — FIXED
~~Both BullMQ and node-cron trigger `processKeywords()` at `30 * * * *`.~~ **Fixed**: node-cron removed from `KeywordEnrichmentWorker`. Only BullMQ triggers enrichment now, consistent with all other workers (rank-check, rank-schedule, email, payments).

### 11.2 ~~Flow 2 (Stale Refresh) Not Auto-Triggered~~ — FIXED
~~`refreshStaleKeywords()` exists but is never called by a cron or schedule.~~ **Fixed**: Added a second BullMQ repeatable job `keyword-enrichment-stale-refresh` with pattern `0 3 * * *` (daily at 03:00 UTC) that calls `KeywordEnrichmentWorker.refreshStale()`, which delegates to `KeywordEnrichmentService.refreshStaleKeywords()`. Keywords in `indb_keyword_bank` older than 30 days are now automatically refreshed.

### 11.3 ~~TOCTOU Race in Quota Tracking~~ — FIXED
~~`IntegrationService.recordApiUsage()` reads `api_quota_used`, increments in JS, then writes back — no DB-level atomic increment.~~ **Fixed**: Created PostgreSQL RPC `increment_integration_quota(p_service_name, p_amount)` that does `UPDATE ... SET api_quota_used = api_quota_used + p_amount` atomically at the SQL level. `recordApiUsage()` now calls this RPC first, with a fallback chain if the RPC isn't deployed yet.

### 11.4 `country_id` Column — Intentional Dual Convention (Not a Bug)
The `country_id` column has different semantics in two tables by design:
- **`indb_rank_keywords.country_id`** → UUID FK referencing `indb_keyword_countries.id`
- **`indb_keyword_bank.country_id`** → ISO2 string (e.g., `"us"`, `"id"`) used as a cache key

This is intentional. `indb_keyword_bank` is a global SEO data cache keyed by `(keyword, country_id, language_code)` where `country_id` is a lowercase ISO2 code. The enrichment worker correctly resolves `indb_rank_keywords.country_id` (UUID) → `indb_keyword_countries.iso2_code` → lowercase string before querying `indb_keyword_bank`. No code change needed.

### 11.5 ~~API Routes Are Stubs~~ — Clarified (No Route Files Exist)
~~5 of 6 SeRanking routes return HTTP 501.~~ **Clarified**: There are no enrichment route files at all — no stubs, no 501s. The enrichment system is entirely background-driven via BullMQ workers. Admin monitoring of enrichment health/quota/metrics would be a future feature request, not a bug.

### 11.6 ~~No is_active Filter in Enrichment Query~~ — Not Applicable
~~`findKeywordsNeedingEnrichment()` does not filter `is_active = TRUE`.~~ **Not applicable**: Keywords are hard-deleted from `indb_rank_keywords` when removed — there is no soft-delete, no `is_active` flag, no deactivation. All rows in the table are active keywords. The index `idx_rank_keywords_needs_enrichment` with `is_active = TRUE` predicate is a vestigial index from an earlier design and can be dropped in a future cleanup.

### 11.7 Immediate Enrichment on Keyword Creation — NEW
Previously, newly added keywords had to wait up to 60 minutes for the hourly enrichment sweep. **Fixed**: The POST `/api/v1/rank-tracking/keywords` route now enqueues an `immediate-keyword-enrichment` BullMQ job (mode `'immediate'`) with `priority: 1` for each batch of new keywords. SEO data (volume, CPC, difficulty) is populated within seconds of keyword creation.

### 11.8 Schedule Changes — NEW
- Hourly new-keyword sweep changed from `30 * * * *` (at :30) to `0 * * * *` (at :00)
- Daily stale-refresh added at `0 3 * * *` (03:00 UTC)

---

## 12. Table Relationship Diagram

```
auth.users
    │
    ├──(1:N)── indb_rank_keywords ──(N:1)── indb_keyword_bank
    │              │                              │
    │              │ country_id                    │ country_id
    │              ▼                               ▼
    │          indb_keyword_countries ◄─────────────┘
    │              │
    │              │ (also referenced by)
    │              ▼
    │          indb_keyword_rankings (rank history)
    │
    ├──(1:N)── indb_keyword_domains
    │
    └──(1:N)── indb_enrichment_jobs
    
indb_site_integration (system-wide, user_id = NULL)
    │
    ├── api_key, quota → used by SeRankingApiClient
    │
    └── referenced by:
        ├── indb_seranking_usage_logs
        ├── indb_seranking_quota_usage
        ├── indb_seranking_metrics_raw
        ├── indb_seranking_metrics_aggregated
        └── indb_seranking_health_checks
```

---

## 13. Summary of All 11 Tables

| # | Table | Purpose | Growth Pattern |
|---|-------|---------|----------------|
| 1 | `indb_keyword_bank` | Global SEO data cache | Grows with unique keyword+country pairs |
| 2 | `indb_rank_keywords` | User tracked keywords | Grows per user keyword addition |
| 3 | `indb_keyword_countries` | Country lookup (ISO2↔UUID) | Static / rarely changes |
| 4 | `indb_keyword_domains` | User verified domains | Grows per user domain |
| 5 | `indb_site_integration` | API config (SeRanking key, quota) | 1 row per service |
| 6 | `indb_seranking_usage_logs` | Per-request usage log | Grows per API call |
| 7 | `indb_seranking_quota_usage` | Detailed quota tracking | Grows per API call |
| 8 | `indb_seranking_metrics_raw` | Raw per-request metrics | High growth (needs cleanup) |
| 9 | `indb_seranking_metrics_aggregated` | Periodic rollup metrics | Slow growth (unique per period) |
| 10 | `indb_seranking_health_checks` | Health check history | Grows every 30s |
| 11 | `indb_enrichment_jobs` | DB-backed job queue | Grows per enrichment batch |
