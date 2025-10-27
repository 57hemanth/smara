import { useState, useEffect } from "react"
import { UploadComponent, SearchComponent } from "./components"
import { apiClient } from "./lib/api"
import { getAuthState, redirectToLogin, clearAuth, type AuthState } from "./lib/auth"
import { getWebUrl } from "./lib/config"

type ActiveTab = 'upload' | 'search'

function IndexPopup() {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload')
  const [currentUrl, setCurrentUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const state = await getAuthState()
        setAuthState(state)
        
        // Set user ID on API client if authenticated
        if (state.isAuthenticated && state.userId) {
          apiClient.setUserId(state.userId)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  // Get current tab URL on mount
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
      }
    });
  }, [])

  const handleUploadComplete = (result: any) => {
    console.log("Upload completed:", result)
    // Optionally switch to search tab after upload
    // setActiveTab('search')
  }

  const handleLogin = async () => {
    try {
      await redirectToLogin(getWebUrl())
    } catch (error) {
      console.error('Error redirecting to login:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await clearAuth()
      setAuthState({
        isAuthenticated: false,
        token: null,
        userId: null,
        user: null
      })
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-80 p-4 bg-white">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  // Not authenticated - show login prompt
  if (!authState?.isAuthenticated) {
    return (
      <div className="w-80 p-4 bg-white">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900">SMARA</h2>
            <p className="text-xs text-gray-600">Your personal memory space</p>
          </div>

          {/* Login prompt */}
          <div className="text-center py-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                Please sign in to use SMARA
              </p>
              <p className="text-xs text-gray-500">
                You'll be redirected to the web app to login
              </p>
            </div>
            <button
              onClick={handleLogin}
              className="w-full px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 p-4 bg-white">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">SMARA</h2>
          <p className="text-xs text-gray-600">Your personal memory space</p>
        </div>

        {/* User Info */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {authState.user?.name || authState.user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {authState.user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'upload'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'search'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Search
          </button>
        </div>

        {/* Content */}
        <div className="min-h-32">
          {activeTab === 'upload' && (
            <UploadComponent 
              userId={authState.userId || ''}
              currentUrl={currentUrl}
              onUpload={(file) => apiClient.uploadFile(file)}
              onUploadUrl={(url) => apiClient.uploadUrl(url)}
            />
          )}
          {activeTab === 'search' && (
            <SearchComponent 
              userId={authState.userId || ''}
              onSearch={(query) => apiClient.search(query)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default IndexPopup