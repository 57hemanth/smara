#!/usr/bin/env python3
"""
Python API server for fetching YouTube transcripts using youtube-transcript-api.
Runs in Cloudflare Container and handles transcript requests.
"""
import os
import json
import logging
import time
import xml.etree.ElementTree as ET
from flask import Flask, request, jsonify
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
    YouTubeRequestFailed
)

# Note: TooManyRequests doesn't exist in youtube-transcript-api
# We'll catch it as a general exception or YouTubeRequestFailed

app = Flask(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

PORT = int(os.environ.get('PORT', 8080))

# Log startup info
logger.info(f"YouTube Transcript API Server starting on port {PORT}")


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'youtube-transcript-api'})


@app.route('/transcript', methods=['POST'])
def get_transcript():
    """
    Fetch YouTube transcript for a given video ID or URL.
    
    Expected JSON body:
    {
        "video_id": "VIDEO_ID",  # Required
        "languages": ["en", "es"],  # Optional: preferred languages
        "url": "https://youtube.com/watch?v=VIDEO_ID"  # Optional: for logging
    }
    
    Returns:
    {
        "success": true,
        "transcript": "full transcript text",
        "segments": [{"text": "...", "start": 0.0, "duration": 5.0}],
        "language": "en",
        "video_id": "VIDEO_ID"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON body provided'
            }), 400
        
        video_id = data.get('video_id')
        if not video_id:
            return jsonify({
                'success': False,
                'error': 'video_id is required'
            }), 400
        
        languages = data.get('languages', ['en'])
        url = data.get('url', '')
        
        logger.info(f"Fetching transcript for video_id={video_id}, languages={languages}, url={url}")
        
        # Try fetching transcript with retry logic
        # Using exact pattern from user's working code
        transcript = None
        max_retries = 3
        retry_delay = 1  # seconds
        
        for attempt in range(max_retries):
            try:
                # Create an instance of the API (exactly like user's working code)
                ytt_api = YouTubeTranscriptApi()
                
                # Fetch transcript (auto or manual) - exactly like user's working code
                # IMPORTANT: Convert to list immediately since transcript is an iterator
                transcript = list(ytt_api.fetch(video_id))
                
                if transcript and len(transcript) > 0:
                    logger.info(f"Successfully fetched transcript for {video_id}: {len(transcript)} segments")
                else:
                    logger.error(f"Transcript fetch returned empty list for {video_id}")
                    raise NoTranscriptFound(video_id)
                    
                break  # Success, exit retry loop
                        
            except (VideoUnavailable, TranscriptsDisabled, NoTranscriptFound) as e:
                # Permanent errors - don't retry
                logger.error(f"Permanent error for {video_id}: {e}")
                raise
                
            except (ET.ParseError, UnicodeDecodeError) as xml_error:
                # XML parsing errors - likely YouTube blocking or empty response
                error_msg = str(xml_error)
                logger.warning(f"XML parsing error on attempt {attempt + 1}/{max_retries} for {video_id}: {error_msg}")
                
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (attempt + 1)
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"All retry attempts failed for {video_id} due to XML parsing error")
                    return jsonify({
                        'success': False,
                        'error': f'YouTube returned invalid response. This may be due to rate limiting or unavailable transcripts.',
                        'error_type': 'xml_parse_error',
                        'video_id': video_id
                    }), 503
                    
            except YouTubeRequestFailed as api_error:
                # Transient API errors - retry with exponential backoff
                error_msg = str(api_error)
                logger.warning(f"API error on attempt {attempt + 1}/{max_retries} for {video_id}: {error_msg}")
                
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (2 ** attempt)
                    logger.info(f"Retrying in {wait_time} seconds...")
                    time.sleep(wait_time)
                else:
                    raise
                    
            except Exception as e:
                # Catch-all for other errors
                error_str = str(e).lower()
                logger.warning(f"Error on attempt {attempt + 1}/{max_retries} for {video_id}: {e}")
                
                # Check if it's a transcript-related error (permanent)
                if 'transcript' in error_str and ('disabled' in error_str or 'not available' in error_str):
                    raise NoTranscriptFound(video_id)
                
                # Check if it's an XML/parsing error (transient)
                if 'xml' in error_str or 'parse' in error_str or 'element' in error_str:
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (attempt + 1)
                        time.sleep(wait_time)
                    else:
                        return jsonify({
                            'success': False,
                            'error': f'Failed to fetch transcript: {str(e)}',
                            'error_type': 'parse_error',
                            'video_id': video_id
                        }), 503
                else:
                    # Unknown error, retry once
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay)
                    else:
                        raise
        
        if not transcript:
            logger.error(f"Failed to fetch transcript for {video_id} after {max_retries} attempts")
            return jsonify({
                'success': False,
                'error': f'No transcript available for video {video_id}',
                'error_type': 'no_transcript',
                'video_id': video_id
            }), 404
        
        # Process transcript into chunks with timestamps
        try:
            # Build segments with timing info
            segments = []
            for snippet in transcript:
                segments.append({
                    'text': snippet.text,
                    'start': getattr(snippet, 'start', 0.0),
                    'duration': getattr(snippet, 'duration', 0.0)
                })
            
            # Combine full text for metadata
            captions_list = [snippet.text for snippet in transcript]
            full_text = ' '.join(captions_list)
            
            # Create chunks (max ~300 chars per chunk for better similarity matching)
            # Group segments into chunks while preserving timestamps
            chunks = []
            current_chunk_text = []
            current_chunk_segments = []
            chunk_char_count = 0
            max_chunk_chars = 300  # Smaller chunks for better search precision
            
            for segment in segments:
                segment_text = segment['text']
                segment_len = len(segment_text)
                
                # If adding this segment would exceed the limit, save current chunk and start new
                if current_chunk_text and (chunk_char_count + segment_len > max_chunk_chars):
                    # Save current chunk
                    chunks.append({
                        'text': ' '.join(current_chunk_text),
                        'start_ms': int(current_chunk_segments[0]['start'] * 1000),
                        'end_ms': int((current_chunk_segments[-1]['start'] + current_chunk_segments[-1]['duration']) * 1000),
                        'segment_count': len(current_chunk_segments)
                    })
                    
                    # Start new chunk
                    current_chunk_text = []
                    current_chunk_segments = []
                    chunk_char_count = 0
                
                # Add segment to current chunk
                current_chunk_text.append(segment_text)
                current_chunk_segments.append(segment)
                chunk_char_count += segment_len + 1  # +1 for space
            
            # Add final chunk if any
            if current_chunk_text:
                chunks.append({
                    'text': ' '.join(current_chunk_text),
                    'start_ms': int(current_chunk_segments[0]['start'] * 1000),
                    'end_ms': int((current_chunk_segments[-1]['start'] + current_chunk_segments[-1]['duration']) * 1000),
                    'segment_count': len(current_chunk_segments)
                })
            
            detected_language = languages[0] if languages else 'unknown'
            
            logger.info(f"Processed {video_id}: {len(chunks)} chunks, {len(full_text)} chars")
            
        except Exception as parse_error:
            logger.error(f"Error parsing transcript segments: {parse_error}")
            return jsonify({
                'success': False,
                'error': f'Failed to parse transcript data: {str(parse_error)}',
                'error_type': 'parse_error',
                'video_id': video_id
            }), 500
        
        return jsonify({
            'success': True,
            'transcript': full_text,  # Full text for reference
            'chunks': chunks,  # Chunks with timestamps for embedding
            'segments': segments,  # Original segments
            'language': detected_language,
            'video_id': video_id,
            'segment_count': len(segments),
            'chunk_count': len(chunks),
            'char_count': len(full_text)
        })
        
    except TranscriptsDisabled as e:
        logger.error(f"Transcripts disabled for video {video_id}: {e}")
        return jsonify({
            'success': False,
            'error': f'Transcripts are disabled for this video',
            'error_type': 'transcripts_disabled',
            'video_id': video_id
        }), 404
        
    except VideoUnavailable as e:
        logger.error(f"Video unavailable: {e}")
        return jsonify({
            'success': False,
            'error': f'Video is unavailable or does not exist',
            'error_type': 'video_unavailable',
            'video_id': video_id
        }), 404
        
    except YouTubeRequestFailed as e:
        # This includes rate limiting and other API failures
        error_msg = str(e).lower()
        is_rate_limit = 'rate' in error_msg or 'too many' in error_msg or '429' in error_msg
        
        if is_rate_limit:
            logger.error(f"Rate limited: {e}")
            return jsonify({
                'success': False,
                'error': 'Rate limit exceeded, please retry later',
                'error_type': 'rate_limit',
                'video_id': video_id
            }), 429
        
        logger.error(f"YouTube API request failed: {e}")
        return jsonify({
            'success': False,
            'error': 'YouTube API request failed, may be transient',
            'error_type': 'api_error',
            'video_id': video_id
        }), 503
    
    except (ET.ParseError, UnicodeDecodeError) as xml_error:
        logger.error(f"XML parsing error: {xml_error}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'YouTube returned invalid response (XML parsing error). This may indicate rate limiting or unavailable transcripts.',
            'error_type': 'xml_parse_error',
            'video_id': video_id if 'video_id' in locals() else 'unknown'
        }), 503
        
    except Exception as e:
        error_str = str(e).lower()
        error_type = 'internal_error'
        
        # Check if it's an XML parsing error
        if 'xml' in error_str or 'parse' in error_str or 'element' in error_str or 'no element found' in error_str:
            error_type = 'xml_parse_error'
            logger.error(f"XML parsing error (caught in general handler): {e}", exc_info=True)
            return jsonify({
                'success': False,
                'error': f'YouTube returned invalid response. Video may not have transcripts available or YouTube is blocking requests.',
                'error_type': error_type,
                'video_id': video_id if 'video_id' in locals() else 'unknown',
                'raw_error': str(e)
            }), 503
        else:
            logger.error(f"Unexpected error fetching transcript: {e}", exc_info=True)
            return jsonify({
                'success': False,
                'error': f'Internal error: {str(e)}',
                'error_type': error_type,
                'video_id': video_id if 'video_id' in locals() else 'unknown'
            }), 500


if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=PORT, debug=False, threaded=True)
    except Exception as e:
        logger.error(f"Failed to start server: {e}", exc_info=True)
        raise

