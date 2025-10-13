/**
 * API Client for communicating with Hono backend
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export class ApiClient {
  private baseUrl: string;
  private userId?: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set user ID for authenticated requests
   */
  setUserId(userId: string) {
    this.userId = userId;
  }

  /**
   * Upload file directly to Hono API
   * The API will stream it to R2
   */
  async uploadFile(file: File, options?: {
    prefix?: string;
    onProgress?: (progress: number) => void;
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

    // Add user ID if available (will be replaced by auth token later)
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
export const apiClient = new ApiClient();