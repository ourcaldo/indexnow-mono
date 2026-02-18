# Database Schema Reference

The master schema file lives in the parent directory:

```
../database-schema/database_schema.sql
```

## RPC Functions Actively Called

| Function                              | Purpose                                    |
| ------------------------------------- | ------------------------------------------ |
| `get_user_domain_stats`               | Aggregate domain statistics per user       |
| `update_keyword_position_atomic`      | Atomically update keyword ranking position |
| `add_tags_to_keywords_atomic`         | Atomically attach tags to keywords         |
| `consume_user_quota`                  | Decrement a user's remaining quota         |
| `get_user_emails_by_ids`              | Fetch user emails by an array of IDs       |
| `bulk_delete_keywords_service`        | Delete multiple keywords in one call       |
| `set_default_payment_gateway_service` | Set the default payment gateway for a user |
| `get_error_type_distribution`         | Error analytics — distribution by type     |
| `get_error_severity_distribution`     | Error analytics — distribution by severity |
| `get_error_endpoint_distribution`     | Error analytics — distribution by endpoint |
| `get_user_completed_amount`           | Total completed payment amount for a user  |
| `get_total_revenue`                   | Platform-wide total revenue                |
| `get_domain_keyword_counts`           | Keyword count per domain                   |

## Unused / Superseded Functions

| Function                         | Note                               |
| -------------------------------- | ---------------------------------- |
| `increment_user_quota`           | Superseded by `consume_user_quota` |
| `get_revenue_by_period`          | Currently unused                   |
| `save_rank_check_result_service` | Currently unused                   |

## Migration Strategy

There is **no automated migration system**. Schema changes are applied directly via the Supabase dashboard SQL editor.
