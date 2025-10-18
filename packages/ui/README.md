# @smara/ui

Shared React UI components for SMARA monorepo.

## Components

### MediaPreview
Renders media files (images, videos, audio) with appropriate previews.

```tsx
import { MediaPreview } from '@smara/ui';

<MediaPreview 
  url="https://example.com/image.jpg"
  modality="image"
  maxHeight="200px"
  className="my-custom-class"
/>
```

### UploadComponent
Component for uploading files to SMARA backend.

```tsx
import { UploadComponent } from '@smara/ui';
import { apiClient } from '@smara/api-client';

<UploadComponent
  userId="user-123"
  onUpload={(file, options) => apiClient.uploadFile(file, options)}
  onUploadComplete={(result) => console.log('Upload complete:', result)}
/>
```

### SearchComponent
Component for searching uploaded files using vector search.

```tsx
import { SearchComponent } from '@smara/ui';
import { apiClient } from '@smara/api-client';

<SearchComponent
  userId="user-123"
  onSearch={(query, options) => apiClient.search(query, options)}
/>
```

## Usage

These components are designed to work with `@smara/api-client` and are used across:
- Web app (`apps/web`)
- Browser extension (`apps/browser-extension`)

## Peer Dependencies

- React >= 18.0.0
- React DOM >= 18.0.0

