# @smara/database

Drizzle ORM package for SMARA database operations on Cloudflare D1.

## Features

- 🔒 Type-safe database operations with Drizzle ORM
- 📦 Repository pattern for clean data access
- 🔄 Automatic migrations with Drizzle Kit
- 🎯 Shared across all apps and workers

## Installation

```bash
pnpm install
```

## Setup



```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "metadata_db",
      "database_id": "your_actual_database_id"
    }
  ]
}
```

2. Generate migrations:

```bash
pnpm db:generate
```

3. Apply migrations:

```bash
# Local development
wrangler d1 migrations apply metadata_db --local

# Production
wrangler d1 migrations apply metadata_db
```

## Usage

### Basic Usage

```typescript
import { createDbClient } from '@smara/database';

// In a Cloudflare Worker
export default {
  async fetch(request: Request, env: Env) {
    const db = createDbClient(env.DB);
    
    // Direct query
    const users = await db.query.users.findMany();
    
    return Response.json(users);
  }
}
```

### Repository Pattern

```typescript
import { createDbClient, UserRepository } from '@smara/database';

export default {
  async fetch(request: Request, env: Env) {
    const db = createDbClient(env.DB);
    const userRepo = new UserRepository(db);
    
    // Find user by email
    const user = await userRepo.findByEmail('user@example.com');
    
    // Create new user
    const newUser = await userRepo.create({
      id: nanoid(),
      full_name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed_password',
    });
    
    return Response.json(newUser);
  }
}
```

## Schema

### Users
- `id`: Primary key
- `full_name`: User's full name
- `email`: Unique email address
- `password`: Hashed password
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Workspaces
- `id`: Primary key
- `name`: Workspace name
- `user_id`: Foreign key to users
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Assets
- `id`: Primary key
- `user_id`: Foreign key to users
- `workspace_id`: Foreign key to workspaces
- `r2_key`: R2 object key
- `mime`: MIME type
- `modality`: Type (image|audio|video|text|link)
- `bytes`: File size
- `sha256`: Content hash
- `source`: Origin (web|extension)
- `source_url`: Original URL for extension captures
- `status`: Processing status
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Labels
- Metadata key-value pairs for assets

### Text Chunks
- Extracted text from assets (ASR, OCR, descriptions)

### Errors
- Error tracking for processing failures

## Development

### Generate Migration

```bash
pnpm db:generate
```

### Apply Migration

```bash
pnpm db:migrate
```

### Push Schema (Development)

```bash
pnpm db:push
```

### Drizzle Studio

```bash
pnpm db:studio
```

## Scripts

- `db:generate`: Generate migration files from schema
- `db:migrate`: Apply migrations to database
- `db:push`: Push schema changes directly (dev only)
- `db:studio`: Open Drizzle Studio GUI

