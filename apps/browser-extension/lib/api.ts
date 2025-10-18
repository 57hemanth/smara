/**
 * API Client for browser extension
 * Uses shared @smara/api-client package with extension-specific configuration
 */
import { createApiClient } from '@smara/api-client';
import { getApiUrl } from './config';

// Create and export extension-specific API client instance
export const apiClient = createApiClient({
  baseUrl: getApiUrl()
});

// Re-export types for convenience
export type { 
  UploadResult, 
  SearchResult, 
  HealthCheckResult,
  UploadOptions,
  SearchOptions
} from '@smara/api-client';
