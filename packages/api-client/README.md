# @smara/api-client

Shared API client for communicating with SMARA backend.

## Usage

### Basic Setup

```typescript
import { createApiClient } from '@smara/api-client';

const apiClient = createApiClient({
  baseUrl: 'https://api.smara.dev',
  userId: 'user-123'
});
```

### Upload File

```typescript
const file = new File(['content'], 'test.txt', { type: 'text/plain' });

const result = await apiClient.uploadFile(file, {
  prefix: 'documents'
});

console.log('Uploaded:', result.assetId);
```

### Search

```typescript
const results = await apiClient.search('my query', {
  modality: 'image',
  limit: 10
});

results.forEach(result => {
  console.log(`${result.assetId}: ${result.score}`);
});
```

### Set User ID

```typescript
apiClient.setUserId('new-user-123');
```

### Health Check

```typescript
const health = await apiClient.healthCheck();
console.log('API Status:', health.status);
```

## API Reference

### `createApiClient(options?)`

Creates a new API client instance.

**Options:**
- `baseUrl?: string` - Backend API URL (default: `http://localhost:8787`)
- `userId?: string` - User ID for authenticated requests

### `uploadFile(file, options?)`

Uploads a file to the backend.

**Parameters:**
- `file: File` - File to upload
- `options?.prefix?: string` - R2 prefix (e.g., 'images', 'videos')
- `options?.onProgress?: (progress: number) => void` - Progress callback

**Returns:** `Promise<UploadResult>`

### `search(query, options?)`

Searches uploaded files using vector embeddings.

**Parameters:**
- `query: string` - Search query
- `options?.modality?: string` - Filter by modality (image, video, audio, text)
- `options?.limit?: number` - Maximum results to return

**Returns:** `Promise<SearchResult[]>`

### `healthCheck()`

Checks if the API is responding.

**Returns:** `Promise<HealthCheckResult>`

## Used By

- Web app (`apps/web`)
- Browser extension (`apps/browser-extension`)

