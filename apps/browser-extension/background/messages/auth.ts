/**
 * Background message handler for authentication
 * Receives auth tokens from web app after successful login
 */
import type { PlasmoMessaging } from "@plasmohq/messaging"
import { saveAuth, clearAuth, type AuthUser } from "~lib/auth"

export interface AuthMessageRequest {
  action: 'login' | 'logout'
  token?: string
  user?: AuthUser
}

export interface AuthMessageResponse {
  success: boolean
  error?: string
}

const handler: PlasmoMessaging.MessageHandler<
  AuthMessageRequest,
  AuthMessageResponse
> = async (req, res) => {
  try {
    const { action, token, user } = req.body

    if (action === 'login') {
      if (!token || !user) {
        res.send({
          success: false,
          error: 'Missing token or user data'
        })
        return
      }

      // Save authentication data
      await saveAuth(token, user)
      
      console.log('User authenticated successfully:', user.email)
      
      res.send({ success: true })
    } else if (action === 'logout') {
      // Clear authentication data
      await clearAuth()
      
      console.log('User logged out successfully')
      
      res.send({ success: true })
    } else {
      res.send({
        success: false,
        error: 'Invalid action'
      })
    }
  } catch (error) {
    console.error('Auth message handler error:', error)
    res.send({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    })
  }
}

export default handler

