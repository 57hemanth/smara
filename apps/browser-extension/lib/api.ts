/**
 * API Client for browser extension to communicate with SMARA backend
 */
import { getApiUrl } from './config';

export class ExtensionApiClient {
  private baseUrl: string;
  private userId?: string;

  constructor(baseUrl: string = getApiUrl()) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set user ID for authenticated requests
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * Upload file directly to backend API
   */
  async uploadFile(file: File, options?: {
    prefix?: string;
  }): Promise<{
    success: boolean;
    key: string;
    assetId: string;
    size: number;
    contentType: string;
    publicUrl: string | null;
  }> {
    const headers: Record<string, string> = {
      'Content-Type': file.type || 'application/octet-stream',
    };

    // Add user ID if available
    if (this.userId) {
      headers['X-User-Id'] = this.userId;
    }

    // Build URL with optional prefix
    const url = new URL(`${this.baseUrl}/upload`);
    if (options?.prefix) {
      url.searchParams.set('prefix', options.prefix);
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: file,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `Upload failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Search files using vector embeddings
   */
  async search(query: string, options?: {
    modality?: string;
    limit?: number;
  }): Promise<Array<{
    assetId: string;
    userId: string;
    modality: string;
    score: number;
    metadata: Record<string, any>;
    preview?: string;
  }>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user ID if available
    if (this.userId) {
      headers['X-User-Id'] = this.userId;
    }

    const body = {
      query,
      ...options,
    };

    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Search failed' }));
      throw new Error(error.error || `Search failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/`);
    if (!response.ok) {
      throw new Error('API is not responding');
    }
    return await response.json();
  }
}

// Export singleton instance
export const apiClient = new ExtensionApiClient();