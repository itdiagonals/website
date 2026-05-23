### IMPORTANT
Remember to make new file instead of changing other file

# Database Migrations

This folder contains database migrations for the Go backend.

## Migration formats

We support two migration formats side-by-side:

1. **`.go` migrations** — the original format used for migrations `0001` through `0015`. These are kept as-is for historical integrity.
2. **`.sql` migrations** — the new format starting from migration `0016`. Recommended for all new migrations.

## Writing a new `.sql` migration

Create a file in this folder named like:

```
migration_0016_add_order_notes.sql
```

Use the following format inside the file:

```sql
-- migration: 0016_add_order_notes
-- description: Add notes column to transactions table

-- up
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- down
ALTER TABLE transactions DROP COLUMN IF EXISTS notes;
```

### Required sections

- `-- migration: <version>` — unique version identifier. If omitted, the filename (without `.sql`) is used as the version.
- `-- up` — SQL statements to apply the migration. At least one statement is required.
- `-- description: <text>` — optional human-readable description shown in logs.

### Optional sections

- `-- down` — SQL statements to roll back the migration. Our current runner does **not** execute down migrations, but documenting them is good practice.

### Rules

- Only statements inside `-- up` are executed.
- Standard single-line SQL comments (`--`) are ignored unless they match the metadata markers above.
- Multiple SQL statements are allowed inside `-- up`.
- Migration versions must be unique across both `.go` and `.sql` files.
- Files are sorted by version string before execution.

## How it works

The `migrations.go` runner loads all `.go` migrations first, then scans this folder for `*.sql` files. Both sets are merged, sorted by version, and applied sequentially. Already-applied migrations (tracked in the `go_schema_migrations` table) are skipped.

## Migration history

- `0001`–`0015`: `.go` files (original GORM-based migrations)
- `0016` and onwards: `.sql` files (recommended)