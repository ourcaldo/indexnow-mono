# @indexnow/mail

Email service for IndexNow Studio. Sends transactional emails via SMTP using Handlebars HTML templates.

## Key Exports

| Export         | Description                                             |
| -------------- | ------------------------------------------------------- |
| `EmailService` | Class — configure SMTP transport, send templated emails |
| `EmailOptions` | Interface — `to`, `subject`, `template`, `context`      |

## Usage

```ts
import { EmailService } from '@indexnow/mail';

const mailer = new EmailService();
await mailer.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome',
  template: 'welcome',
  context: { name: 'Alice' },
});
```

Templates live in `src/templates/*.html` and are compiled with Handlebars at send time (cached after first use).

## Install

```jsonc
"@indexnow/mail": "workspace:*"
```

See [CONVENTIONS.md](../../CONVENTIONS.md) for code standards.
