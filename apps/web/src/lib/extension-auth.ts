/**
 * Utility to communicate authentication to SMARA browser extension
 * Used after successful login/signup when opened from extension
 */

export interface AuthData {
  token: string
  user: {
    id: string
    name: string
    email: string
    created_at: string
    updated_at: string
  }
}

/**
 * Check if page was opened from extension
 */
export function isExtensionAuth(): boolean {
  if (typeof window === 'undefined') return false
  
  const params = new URLSearchParams(window.location.search)
  return params.get('extension') === 'true'
}

/**
 * Send authentication data to extension
 */
export function sendAuthToExtension(authData: AuthData): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    let responseReceived = false

    // Listen for response from extension
    const handleResponse = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data?.type === 'SMARA_AUTH_RESPONSE') {
        responseReceived = true
        window.removeEventListener('message', handleResponse)
        resolve(event.data.success === true)
      }
    }

    window.addEventListener('message', handleResponse)

    // Send auth data to extension content script
    window.postMessage({
      type: 'SMARA_AUTH',
      action: 'login',
      token: authData.token,
      user: authData.user
    }, window.location.origin)

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!responseReceived) {
        window.removeEventListener('message', handleResponse)
        resolve(false)
      }
    }, 5000)
  })
}

/**
 * Wait for extension to be ready
 */
export function waitForExtension(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    let extensionReady = false

    const handleReady = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data?.type === 'SMARA_EXTENSION_READY') {
        extensionReady = true
        window.removeEventListener('message', handleReady)
        console.log('Extension detected and ready')
        resolve(true)
      }
    }

    window.addEventListener('message', handleReady)

    // Send ping to extension to check if it's present
    console.log('Pinging extension...')
    window.postMessage({
      type: 'SMARA_EXTENSION_PING'
    }, window.location.origin)

    // Timeout after 3 seconds
    setTimeout(() => {
      if (!extensionReady) {
        console.log('Extension not detected (timeout)')
        window.removeEventListener('message', handleReady)
        resolve(false)
      }
    }, 3000)
  })
}

