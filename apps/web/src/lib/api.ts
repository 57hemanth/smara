/**
 * API Client for web app
 * Uses shared @smara/api-client package with web-specific configuration
 */
import { createApiClient } from '@smara/api-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

// Create and export web-specific API client instance
export const apiClient = createApiClient({
  baseUrl: API_URL
});

// Re-export types for convenience
export type { 
  UploadResult, 
  SearchResult, 
  HealthCheckResult,
  UploadOptions,
  SearchOptions,
  Folder,
  CreateFolderRequest,
  UpdateFolderRequest,
  FoldersResponse,
  FolderResponse,
} from '@smara/api-client';