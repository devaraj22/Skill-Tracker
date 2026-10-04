# Database

PostgreSQL is the primary database (migrations verified on PostgreSQL 16 and SQLite). Enums are stored as constrained `VARCHAR` + `CHECK`, so the same migration works on both. All primary keys are UUIDs.

| Table | Purpose | Key constraints |
|---|---|---|
| `users` | Login identity | unique `email`; `role` in (student, admin); `is_active`; `token_version` |
| `student_profiles` | One per student (1:1 with users) | unique `user_id`, `register_number`, `portfolio_username`; `year_of_study` 1-6; `portfolio_sections` JSON |
| `skills` | Self-reported skills | unique (`user_id`, `name`); category/level enums |
| `certifications` | Certificates + evidence metadata | status in (pending, verified, rejected); `expiry_date >= issue_date`; **CHECK: non-pending rows must have `reviewed_by_id` and `reviewed_at`** |
| `projects` | Portfolio projects | `end_date >= start_date`; `position` for ordering |
| `achievements` | Hackathons, awards, etc. | kind enum |
| `learning_goals` | Goals | **`progress` BETWEEN 0 AND 100** |
| `placement_assessments` | Practice scores | **`score >= 0`, `max_score > 0`, `score <= max_score`** |
| `activity_logs` | Student feed and admin audit trail | `is_admin_action` flag; actor/subject FKs |

Ownership: every student-owned table has `user_id -> users.id ON DELETE CASCADE` and an index on it. `certifications.reviewed_by_id -> users.id ON DELETE SET NULL`.

No dashboard totals are stored; counts and averages are computed from rows on each request.

## Migrations

```
alembic upgrade head      # apply
alembic downgrade base    # revert everything
alembic revision --autogenerate -m "describe change"
alembic check             # reports drift between models and migrations
```
