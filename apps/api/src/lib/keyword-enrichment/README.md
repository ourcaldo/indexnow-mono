# Keyword Enrichment

Domain module for keyword enrichment — fetching keyword metadata (search volume, CPC, competition, trends) from an external provider and storing results in the database.

## External Provider

**SeRanking API**
- Endpoint: `POST https://api.seranking.com/v1/keywords/export`
- Auth: API key managed by `lib/integrations/api-key-manager.ts`
- Rate limited: 1 request/second with exponential backoff

## Folder Structure

```
keyword-enrichment/
├── README.md          ← this file
├── client/            ← API client layer (HTTP, rate limiting, request building)
│   ├── ApiRequestBuilder.ts
│   ├── RateLimiter.ts
│   └── SeRankingApiClient.ts
├── services/          ← Business logic (enrichment, validation, quota, health)
│   ├── ApiMetricsCollector.ts
│   ├── EnrichmentQueue.ts
│   ├── ErrorHandlingService.ts
│   ├── HealthChecker.ts
│   ├── IntegrationService.ts
│   ├── JobProcessor.ts
│   ├── KeywordBankService.ts
│   ├── KeywordEnrichmentService.ts
│   ├── QuotaMonitor.ts
│   └── ValidationService.ts
└── types/             ← TypeScript type definitions
    ├── EnrichmentJobTypes.ts
    ├── KeywordBankTypes.ts
    ├── SeRankingTypes.ts
    └── ServiceTypes.ts
```

## Consumer

Primary consumer: `lib/job-management/keyword-enrichment-worker.ts` — orchestrates enrichment jobs using services from this module.
