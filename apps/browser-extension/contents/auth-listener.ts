/**
 * Content script that listens for authentication events from the web app
 * Runs on SMARA web pages to receive auth tokens after login
 */
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "https://smara-ui.pages.dev/*",
    "https://*.smara-ui.pages.dev/*",
    "http://localhost:3000/*",
    "http://127.0.0.1:3000/*"
  ],
  all_frames: false
}

// Listen for messages from the web page
window.addEventListener("message", async (event) => {
  // Verify the message is from the same origin (security check)
  if (event.origin !== window.location.origin) {
    return
  }

  // Check if web page is pinging to see if extension is present
  if (event.data?.type === 'SMARA_EXTENSION_PING') {
    console.log('Extension ping received, responding...')
    window.postMessage({
      type: 'SMARA_EXTENSION_READY'
    }, window.location.origin)
    return
  }

  // Check if this is an auth message from SMARA
  if (event.data?.type === 'SMARA_AUTH') {
    const { action, token, user } = event.data

    try {
      // Send to background script via Chrome messaging
      const response = await chrome.runtime.sendMessage({
        name: "auth",
        body: {
          action,
          token,
          user
        }
      })

      if (response?.success) {
        console.log('Extension authentication successful')
        
        // Notify the web page that auth was saved
        window.postMessage({
          type: 'SMARA_AUTH_RESPONSE',
          success: true
        }, window.location.origin)
        
        // Close the tab after successful auth (optional)
        if (action === 'login') {
          setTimeout(() => {
            window.close()
          }, 1000)
        }
      } else {
        console.error('Extension authentication failed:', response?.error)
        window.postMessage({
          type: 'SMARA_AUTH_RESPONSE',
          success: false,
          error: response?.error
        }, window.location.origin)
      }
    } catch (error) {
      console.error('Error sending auth to extension:', error)
      window.postMessage({
        type: 'SMARA_AUTH_RESPONSE',
        success: false,
        error: 'Failed to communicate with extension'
      }, window.location.origin)
    }
  }
})

// Notify web page that extension is ready to receive auth (on initial load)
window.postMessage({
  type: 'SMARA_EXTENSION_READY'
}, window.location.origin)

console.log('SMARA extension content script loaded')

