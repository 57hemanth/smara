interface MediaPreviewProps {
  url: string;
  modality: string;
  maxHeight?: string;
  className?: string;
}

/**
 * MediaPreview component for rendering different types of media files
 * Supports images, videos, audio, and fallback for other file types
 * 
 * Shared across web app and browser extension
 */
export function MediaPreview({ 
  url, 
  modality, 
  maxHeight = '200px', 
  className = '' 
}: MediaPreviewProps) {
  if (modality === "image") {
    return (
      <div className={`max-w-full ${className}`}>
        <img 
          src={url} 
          alt="Media preview"
          style={{ 
            maxHeight,
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '4px',
            border: '1px solid #e5e7eb',
            cursor: 'pointer'
          }}
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
      <div className={`max-w-full ${className}`}>
        <video 
          src={url} 
          controls 
          style={{ 
            maxHeight,
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '4px',
            border: '1px solid #e5e7eb'
          }}
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
      <div className={`w-full ${className}`}>
        <audio 
          src={url} 
          controls 
          style={{ 
            width: '100%',
            height: '32px'
          }}
          onError={(e) => {
            console.error('Failed to load audio:', url);
          }}
        >
          Your browser does not support audio playback.
        </audio>
      </div>
    );
  }

  // For text or other modalities, show as link with icon
  return (
    <div className={className}>
      <a 
        href={url} 
        target="_blank" 
        rel="noreferrer"
        style={{
          color: '#2563eb',
          textDecoration: 'none',
          fontSize: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
      >
        <span>View {modality} file</span>
        <svg 
          width="12" 
          height="12" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
          />
        </svg>
      </a>
    </div>
  );
}

