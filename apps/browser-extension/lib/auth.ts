/**
 * Authentication utilities for browser extension
 * Manages token storage and authentication state
 */
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export interface AuthUser {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  isAuthenticated: boolean
  token: string | null
  userId: string | null
  user: AuthUser | null
}

/**
 * Storage keys for authentication data
 */
const AUTH_KEYS = {
  TOKEN: 'smara_token',
  USER_ID: 'smara_user_id',
  USER: 'smara_user',
} as const

/**
 * Get current authentication state
 */
export async function getAuthState(): Promise<AuthState> {
  try {
    const token = await storage.get<string>(AUTH_KEYS.TOKEN)
    const userId = await storage.get<string>(AUTH_KEYS.USER_ID)
    const user = await storage.get<AuthUser>(AUTH_KEYS.USER)

    const isAuthenticated = !!(token && userId)

    return {
      isAuthenticated,
      token: token || null,
      userId: userId || null,
      user: user || null,
    }
  } catch (error) {
    console.error('Error getting auth state:', error)
    return {
      isAuthenticated: false,
      token: null,
      userId: null,
      user: null,
    }
  }
}

/**
 * Save authentication data to storage
 */
export async function saveAuth(token: string, user: AuthUser): Promise<void> {
  try {
    await storage.set(AUTH_KEYS.TOKEN, token)
    await storage.set(AUTH_KEYS.USER_ID, user.id)
    await storage.set(AUTH_KEYS.USER, user)
  } catch (error) {
    console.error('Error saving auth:', error)
    throw new Error('Failed to save authentication data')
  }
}

/**
 * Clear all authentication data
 */
export async function clearAuth(): Promise<void> {
  try {
    await storage.remove(AUTH_KEYS.TOKEN)
    await storage.remove(AUTH_KEYS.USER_ID)
    await storage.remove(AUTH_KEYS.USER)
  } catch (error) {
    console.error('Error clearing auth:', error)
  }
}

/**
 * Get authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await storage.get<string>(AUTH_KEYS.TOKEN)
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

/**
 * Get user ID
 */
export async function getUserId(): Promise<string | null> {
  try {
    return await storage.get<string>(AUTH_KEYS.USER_ID)
  } catch (error) {
    console.error('Error getting user ID:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const authState = await getAuthState()
  return authState.isAuthenticated
}

/**
 * Get the web app login URL with extension authentication flow
 */
export function getLoginUrl(webUrl: string): string {
  // Add extension=true parameter so web app knows to handle extension auth
  const url = new URL('/login', webUrl)
  url.searchParams.set('extension', 'true')
  return url.toString()
}

/**
 * Open web login page in new tab
 */
export async function redirectToLogin(webUrl: string): Promise<void> {
  const loginUrl = getLoginUrl(webUrl)
  await chrome.tabs.create({ url: loginUrl })
}

