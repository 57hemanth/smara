import { YoutubeTranscript } from 'youtube-transcript';

/**
 * Fetch YouTube video transcript/captions
 * @param videoId YouTube video ID
 * @returns Concatenated transcript text
 */
export async function getYoutubeCaption(videoId: string): Promise<string> {
  const transcript = await YoutubeTranscript.fetchTranscript(videoId);
  return transcript.map(item => item.text).join(' ');
}

/**
 * Check if a URL is a YouTube URL
 * @param url URL to check
 * @returns true if YouTube URL
 */
export function isYoutubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Extract video ID from YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * @param url YouTube URL
 * @returns Video ID or null if not found
 */
export function getYoutubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Handle youtu.be short links
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0];
    }
    
    // Handle youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com')) {
      // Check for /watch?v= format
      const vParam = urlObj.searchParams.get('v');
      if (vParam) {
        return vParam;
      }
      
      // Check for /embed/VIDEO_ID format
      const embedMatch = urlObj.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) {
        return embedMatch[1];
      }
      
      // Check for /v/VIDEO_ID format
      const vMatch = urlObj.pathname.match(/\/v\/([^/?]+)/);
      if (vMatch) {
        return vMatch[1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null;
  }
}