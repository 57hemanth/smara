export const API_CONFIG = {
  // Use environment variable or fallback to development URL
  BASE_URL: process.env.PLASMO_PUBLIC_API_URL || 'http://127.0.0.1:8787',
  // Web app URL for login/signup redirects
  WEB_URL: process.env.PLASMO_PUBLIC_WEB_URL || 'https://smara-ui.pages.dev',
} as const;

export function getApiUrl(): string {
  return API_CONFIG.BASE_URL;
}

export function getWebUrl(): string {
  return API_CONFIG.WEB_URL;
}

export function isDevelopment(): boolean {
  return API_CONFIG.BASE_URL.includes('localhost') || API_CONFIG.BASE_URL.includes('127.0.0.1');
}

export function logConfig(): void {
  console.log('Extension Config:', {
    apiUrl: getApiUrl(),
    webUrl: getWebUrl(),
    isDev: isDevelopment(),
    env: process.env.NODE_ENV
  });
}