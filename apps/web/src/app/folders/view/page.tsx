import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { FolderCanvas } from "./components/FolderCanvas"

// Simple, server-renderable loading skeleton
const CanvasLoadingSkeleton = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center gap-3 text-gray-600">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p>Loading assets...</p>
      </div>
    </div>
  )
}

// Server component - static export compatible
export default function FolderCanvasPage() {
  return (
    <Suspense fallback={<CanvasLoadingSkeleton />}>
      <FolderCanvas />
    </Suspense>
  )
}
