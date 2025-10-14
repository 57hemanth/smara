interface MediaPreviewProps {
  url: string;
  modality: string;
  maxHeight?: string;
  className?: string;
}

/**
 * MediaPreview component for rendering different types of media files
 * Supports images, videos, audio, and fallback for other file types
 */
export function MediaPreview({ 
  url, 
  modality, 
  maxHeight = '200px', 
  className = '' 
}: MediaPreviewProps) {
  const baseClasses = "rounded border shadow-sm";

  if (modality === "image") {
    return (
      <div className={`max-w-md ${className}`}>
        <img 
          src={url} 
          alt="Media preview"
          className={`max-w-full h-auto ${baseClasses} cursor-pointer hover:opacity-90 transition-opacity`}
          style={{ maxHeight }}
          onClick={() => window.open(url, '_blank')}
          onError={(e) => {
            console.error('Failed to load image:', url);
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    );
  }

  if (modality === "video") {
    return (
      <div className={`max-w-md ${className}`}>
        <video 
          src={url} 
          controls 
          className={`max-w-full h-auto ${baseClasses}`}
          style={{ maxHeight }}
          onError={(e) => {
            console.error('Failed to load video:', url);
          }}
        >
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (modality === "audio") {
    return (
      <div className={`max-w-md ${className}`}>
        <audio 
          src={url} 
          controls 
          className="w-full"
          onError={(e) => {
            console.error('Failed to load audio:', url);
          }}
        >
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  // For text or other modalities, show as link
  return (
    <div className={className}>
      <a 
        href={url} 
        target="_blank" 
        rel="noreferrer"
        className="text-blue-600 hover:underline text-xs inline-flex items-center gap-1"
      >
        <span>View {modality} file</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
