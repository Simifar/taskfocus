# Neon Database Migration Guide

## Overview

This guide explains how to migrate your TaskFocus database on Neon to support the enhanced project system.

## Prerequisites

- Your Neon database URL is configured in `.env` file
- You have Prisma CLI installed
- Database connection is working

## Migration Steps

### 1. Verify Database Connection

```bash
# Test connection
npx prisma db pull
```

This should pull your current schema from Neon successfully.

### 2. Apply Schema Changes

```bash
# Push schema changes to Neon
npx prisma db push

# Generate updated Prisma client
npx prisma generate
```

### 3. Verify Migration

```bash
# Check database status
npx prisma migrate status
```

## Neon-Specific Considerations

### Connection Pooling
Neon uses connection pooling. Make sure your `DATABASE_URL` includes the pooling parameters:

```
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require&pgbouncer=true"
```

### Migration Safety
Neon supports safe migrations with:

- **Automatic backups**: Neon creates backups before migrations
- **Rollback support**: You can rollback if needed
- **Zero downtime**: Migrations don't interrupt your app

### Performance
- Neon handles the new indexes efficiently
- The added columns are lightweight
- Queries remain optimized

## Manual Migration (if needed)

If `prisma db push` doesn't work, you can run SQL directly:

```sql
-- Connect to your Neon database and run:
ALTER TABLE categories 
ADD COLUMN description TEXT,
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE,
ADD COLUMN parent_id TEXT,
ADD COLUMN position INTEGER DEFAULT 0;

-- Add constraints
ALTER TABLE categories 
ADD CONSTRAINT categories_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX categories_user_id_is_archived_idx ON categories(user_id, is_archived);
CREATE INDEX categories_parent_id_idx ON categories(parent_id);
```

## Verification

After migration, verify the schema:

```bash
# View current schema
npx prisma db pull --print

# Test with Prisma Studio
npx prisma studio
```

## Troubleshooting

### Common Neon Issues

1. **Connection Timeout**
   ```bash
   # Check your DATABASE_URL
   echo $DATABASE_URL
   ```

2. **Permission Errors**
   - Ensure your Neon user has ALTER permissions
   - Check if you're using the correct database

3. **SSL Issues**
   - Make sure `sslmode=require` is in your connection string
   - Neon requires SSL connections

### Rollback Plan

If something goes wrong:

```bash
# Reset to previous state (WARNING: This deletes data!)
npx prisma migrate reset

# Or manually rollback:
ALTER TABLE categories 
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS is_favorite,
DROP COLUMN IF EXISTS is_archived,
DROP COLUMN IF EXISTS parent_id,
DROP COLUMN IF EXISTS position;
```

## Next Steps

After successful migration:

1. Restart your development server
2. Test the new project features
3. Verify existing functionality still works
4. Check the `/projects` page

## Support

If you encounter issues:

1. Check Neon logs in your dashboard
2. Verify Prisma configuration
3. Test database connection manually
4. Contact Neon support if needed

---

**Note**: Neon automatically handles most migration complexities. The process should be smooth and safe.
