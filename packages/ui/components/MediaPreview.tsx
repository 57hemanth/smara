interface MediaPreviewProps {
  url: string;
  modality: string;
  maxHeight?: string;
  className?: string;
  metadata?: Record<string, any>;
}

/**
 * Extract YouTube video ID from URL
 */
function getYoutubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0];
    }
    
    if (urlObj.hostname.includes('youtube.com')) {
      const vParam = urlObj.searchParams.get('v');
      if (vParam) return vParam;
      
      const embedMatch = urlObj.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return embedMatch[1];
      
      const vMatch = urlObj.pathname.match(/\/v\/([^/?]+)/);
      if (vMatch) return vMatch[1];
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * MediaPreview component for rendering different types of media files
 * Supports images, videos, audio, YouTube links, and fallback for other file types
 * 
 * Shared across web app and browser extension
 */
export function MediaPreview({ 
  url, 
  modality, 
  maxHeight = '200px', 
  className = '',
  metadata
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

  // For YouTube links, show embedded player
  if (modality === "link") {
    const videoId = getYoutubeVideoId(url);
    
    if (videoId) {
      return (
        <div className={`w-full ${className}`}>
          <div style={{ 
            position: 'relative', 
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            maxHeight,
            borderRadius: '4px',
            border: '1px solid #e5e7eb'
          }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video preview"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
          </div>
          <a 
            href={url} 
            target="_blank" 
            rel="noreferrer"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '11px',
              marginTop: '4px',
              display: 'inline-block'
            }}
            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            Open in YouTube ↗
          </a>
        </div>
      );
    }
  }

  // For document files (PDF, etc.), show document icon and link
  if (modality === "document") {
    return (
      <div className={className}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <svg 
            width="24" 
            height="24" 
            fill="none" 
            stroke="#ef4444" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 13h6M9 17h6" 
            />
          </svg>
          <a 
            href={url} 
            target="_blank" 
            rel="noreferrer"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            View PDF Document ↗
          </a>
        </div>
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

