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
  user: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
  token: string;
}

export interface ApiClientOptions {
  baseUrl?: string;
  userId?: string;
}

export interface UploadOptions {
  prefix?: string;
  folder?: string;
  onProgress?: (progress: number) => void;
}

export interface UrlUploadOptions {
  folder?: string;
}

export interface SearchOptions {
  modality?: string;
  limit?: number;
  minScore?: number; // Minimum relevance score (0.1-1.0)
}

export interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFolderRequest {
  name: string;
}

export interface UpdateFolderRequest {
  name: string;
}

export interface FoldersResponse {
  success: boolean;
  folders: Folder[];
}

export interface FolderResponse {
  success: boolean;
  folder: Folder;
}

export interface Asset {
  id: string;
  user_id: string;
  folder_id: string;
  r2_key: string;
  mime: string;
  modality: 'image' | 'audio' | 'video' | 'text' | 'link';
  bytes: number;
  sha256: string;
  source?: 'web' | 'extension';
  source_url?: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  created_at: string;
  updated_at: string;
  preview?: string;
}

export interface AssetsResponse {
  success: boolean;
  assets: Asset[];
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

    // Add folder if specified
    if (options?.folder) {
      headers['X-Folder'] = options.folder;
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
  async uploadUrl(url: string, options?: UrlUploadOptions): Promise<UploadResult> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user ID if available
    if (this.userId) {
      headers['X-User-Id'] = this.userId;
    }

    // Add folder if specified
    if (options?.folder) {
      headers['X-Folder'] = options.folder;
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
      user_id: this.userId,
      topK: options?.limit || 10,
      ...(options?.minScore && { minScore: options.minScore }),
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

    const result = await response.json();
    // Handle both old and new response formats
    return Array.isArray(result) ? result : (result.data || result);
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

    const result = await response.json();
    
    // Automatically set the user ID after successful creation
    this.setUserId(result.user.id);
    
    return result;
  }

  /**
   * Login with email and password
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseUrl}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || `Login failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Automatically set the user ID after successful login
    this.setUserId(result.user.id);
    
    return result;
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

  /**
   * Get all folders for the authenticated user
   */
  async getFolders(): Promise<Folder[]> {
    if (!this.userId) {
      throw new Error('User ID not set. Please authenticate first.');
    }

    const response = await fetch(`${this.baseUrl}/folders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': this.userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch folders' }));
      throw new Error(error.error || `Failed to fetch folders: ${response.status}`);
    }

    const data: FoldersResponse = await response.json();
    return data.folders;
  }

  /**
   * Create a new folder
   */
  async createFolder(data: CreateFolderRequest): Promise<Folder> {
    if (!this.userId) {
      throw new Error('User ID not set. Please authenticate first.');
    }

    const response = await fetch(`${this.baseUrl}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': this.userId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to create folder' }));
      throw new Error(error.error || `Failed to create folder: ${response.status}`);
    }

    const result: FolderResponse = await response.json();
    return result.folder;
  }

  /**
   * Update a folder (rename)
   */
  async updateFolder(folderId: string, data: UpdateFolderRequest): Promise<Folder> {
    if (!this.userId) {
      throw new Error('User ID not set. Please authenticate first.');
    }

    const response = await fetch(`${this.baseUrl}/folders/${folderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': this.userId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update folder' }));
      throw new Error(error.error || `Failed to update folder: ${response.status}`);
    }

    const result: FolderResponse = await response.json();
    return result.folder;
  }

  /**
   * Delete a folder
   */
  async deleteFolder(folderId: string): Promise<void> {
    if (!this.userId) {
      throw new Error('User ID not set. Please authenticate first.');
    }

    const response = await fetch(`${this.baseUrl}/folders/${folderId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': this.userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to delete folder' }));
      throw new Error(error.error || `Failed to delete folder: ${response.status}`);
    }
  }

  /**
   * Get all assets for a specific folder
   */
  async getFolderAssets(folderId: string, limit?: number, offset?: number): Promise<Asset[]> {
    if (!this.userId) {
      throw new Error('User ID not set. Please authenticate first.');
    }

    const url = new URL(`${this.baseUrl}/folders/${folderId}/assets`);
    if (limit) url.searchParams.set('limit', limit.toString());
    if (offset) url.searchParams.set('offset', offset.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': this.userId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch folder assets' }));
      throw new Error(error.error || `Failed to fetch folder assets: ${response.status}`);
    }

    const data: AssetsResponse = await response.json();
    return data.assets;
  }
}

/**
 * Factory function to create API client with environment-specific defaults
 */
export function createApiClient(options?: ApiClientOptions): SmaraApiClient {
  return new SmaraApiClient(options);
}