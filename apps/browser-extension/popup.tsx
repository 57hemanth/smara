import { useState, useEffect } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { UploadComponent, SearchComponent } from "./components"
import { apiClient } from "./lib/api"

type ActiveTab = 'upload' | 'search'

function IndexPopup() {
  const [userId, setUserId] = useStorage("smara-user-id", "demo-user")
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload')
  const [currentUrl, setCurrentUrl] = useState<string>("")

  // Get current tab URL on mount
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        setCurrentUrl(tabs[0].url);
      }
    });
  }, []);

  // Set user ID on API client
  if (userId) {
    apiClient.setUserId(userId);
  }

  const handleUploadComplete = (result: any) => {
    console.log("Upload completed:", result)
    // Optionally switch to search tab after upload
    // setActiveTab('search')
  }

  return (
    <div className="w-80 p-4 bg-white">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">SMARA</h2>
          <p className="text-xs text-gray-600">Your personal memory space</p>
        </div>

        {/* User ID Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">
            User ID
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
            className="block w-full px-3 py-2 text-xs border rounded"
          />
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
              userId={userId || 'demo-user'}
              onUpload={(file, options) => apiClient.uploadFile(file, options)}
              onUploadUrl={(url) => apiClient.uploadUrl(url)}
              onUploadComplete={handleUploadComplete}
              showUrlUpload={true}
              currentUrl={currentUrl}
            />
          )}
          {activeTab === 'search' && (
            <SearchComponent 
              userId={userId || 'demo-user'}
              onSearch={(query, options) => apiClient.search(query, options)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default IndexPopup