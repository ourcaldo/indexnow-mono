# @indexnow/analytics

Client-side analytics abstraction layer for IndexNow Studio. Wraps PostHog, GA4, Sentry, and Customer.io behind a unified API.

## Exports

| Export                | Description                              |
| --------------------- | ---------------------------------------- |
| `initializeAnalytics` | Bootstrap all analytics providers        |
| `trackPageView`       | Track a page view across all providers   |
| `trackEvent`          | Track a custom event                     |
| `identifyUser`        | Identify a user across all providers     |
| `resetUser`           | Clear user identity on logout            |
| `trackError`          | Report an error to Sentry + event stream |
| `ErrorTracker`        | Class-based error tracking utility       |
| `captureException`    | Direct Sentry exception capture          |

## Usage

```ts
import { initializeAnalytics, trackEvent } from '@indexnow/analytics';

initializeAnalytics();
trackEvent('keyword_added', { domain: 'example.com' });
```

## Install

Workspace dependency — already available via `pnpm`:

```jsonc
"@indexnow/analytics": "workspace:*"
```

See [CONVENTIONS.md](../../CONVENTIONS.md) for code standards.
