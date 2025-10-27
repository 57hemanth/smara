import { useState, useEffect } from "react"
import { UploadComponent, SearchComponent } from "./components"
import { apiClient } from "./lib/api"
import { getAuthState, redirectToLogin, clearAuth, type AuthState } from "./lib/auth"
import { getWebUrl } from "./lib/config"
import "./style.css"
import logoIcon from "data-base64:./assets/icon.png"

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
      <div className="extension-popup bg-white">
        <div className="flex items-center justify-center h-[500px]">
          <div className="space-y-3 text-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated - show login prompt
  if (!authState?.isAuthenticated) {
    return (
      <div className="extension-popup bg-gradient-to-br from-slate-50 to-white">
        <div className="p-6 space-y-6">
          {/* Header with Logo */}
          <div className="text-center pt-8 space-y-3">
            <img src={logoIcon} alt="SMARA" className="w-16 h-16 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">SMARA</h1>
              <p className="text-sm text-slate-600 mt-1">Your personal memory space</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl p-6 space-y-4 shadow-lg border border-slate-200">
            <div className="space-y-3 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-slate-900 font-medium">
                  Please sign in to continue
                </p>
                <p className="text-xs text-slate-600">
                  You'll be redirected to complete authentication
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogin}
              className="w-full px-4 py-3 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              Sign In
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 pt-4">
            Powered by AI • Secure & Private
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="extension-popup bg-gradient-to-br from-slate-50 to-white">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={logoIcon} alt="SMARA" className="w-4 h-4" />
            <h2 className="text-base font-bold text-slate-900">SMARA</h2>
          </div>
          
          <a
            href={getWebUrl()}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Open web app"
          >
            <svg className="w-4 h-4 text-slate-600 hover:text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-xl px-3 py-2.5 flex items-center justify-between shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {(authState.user?.name?.[0] || authState.user?.email?.[0] || 'U').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">
                {authState.user?.name || authState.user?.email || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {authState.user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 px-2 py-1 text-[10px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors font-medium"
            title="Sign out"
          >
            Logout
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'upload'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            📤 Capture
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'search'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            🔍 Search
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[320px]">
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