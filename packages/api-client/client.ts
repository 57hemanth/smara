/**
 * Shared API Client for communicating with SMARA backend
 * 
 * Used across web app and browser extension
 */

export interface UploadResult {
  success: boolean;
  key: string;
  assetId: string;
  size: number;
  contentType: string;
  publicUrl: string | null;
}

export interface SearchResult {
  assetId: string;
  userId: string;
  modality: string;
  score: number;
  metadata: Record<string, any>;
  preview?: string;
}

export interface HealthCheckResult {
  status: string;
  service: string;
  version: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface CreateUserResponse {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface ApiClientOptions {
  baseUrl?: string;
  userId?: string;
}

export interface UploadOptions {
  prefix?: string;
  onProgress?: (progress: number) => void;
}

export interface SearchOptions {
  modality?: string;
  limit?: number;
}

/**
 * API Client for SMARA backend
 */
export class SmaraApiClient {
  private baseUrl: string;
  private userId?: string;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:8787';
    this.userId = options.userId;
  }

  /**
   * Set user ID for authenticated requests
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * Upload file to backend API
   * The API will stream it to R2 and queue for processing
   */
  async uploadFile(file: File, options?: UploadOptions): Promise<UploadResult> {
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
   * Upload URL (YouTube link) to backend API
   * The API will create metadata and queue for transcript processing
   */
  async uploadUrl(url: string): Promise<UploadResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user ID if available
    if (this.userId) {
      headers['X-User-Id'] = this.userId;
    }

    const response = await fetch(`${this.baseUrl}/upload/url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'URL upload failed' }));
      throw new Error(error.error || `URL upload failed: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Search files using vector embeddings
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
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
   * Health check endpoint
   */
  async healthCheck(): Promise<HealthCheckResult> {
    const response = await fetch(`${this.baseUrl}/`);
    if (!response.ok) {
      throw new Error('API is not responding');
    }
    return await response.json();
  }

  /**
   * Create a new user account
   */
  async createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
    const response = await fetch(`${this.baseUrl}/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'User creation failed' }));
      throw new Error(error.error || `User creation failed: ${response.status}`);
    }

    const user = await response.json();
    
    // Automatically set the user ID after successful creation
    this.setUserId(user.id);
    
    return user;
  }

  /**
   * Get user by ID
   */
  async getUser(): Promise<User> {
    if (!this.userId) {
      throw new Error('User ID not set. Please authenticate first.');
    }

    const response = await fetch(`${this.baseUrl}/user`, {
      method: 'GET',
      headers: {
        'X-User-Id': this.userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get user' }));
      throw new Error(error.error || `Failed to get user: ${response.status}`);
    }

    return await response.json();
  }
}

/**
 * Factory function to create API client with environment-specific defaults
 */
export function createApiClient(options?: ApiClientOptions): SmaraApiClient {
  return new SmaraApiClient(options);
}

