import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

// Helper to run ffmpeg and wait for it to finish, returns output
async function runFFmpeg(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args);
    let output = '';
    
    p.stderr?.on('data', (data) => {
      output += data.toString();
      process.stderr.write(data); // Still show output
    });
    
    p.on('exit', code => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
}

const app = new Hono();

app.get('/', (c) =>
  c.text('🎬 Video extractor is running.\nPOST /extract { "input": "path/to/video.mp4", "scene": 0.2 }')
);

app.post('/process', async (c) => {
  const { input, scene = 0.2 } = await c.req.json();

  if (!input) return c.json({ error: 'input video path required' }, 400);

  const outDir = path.resolve('./output');
  const audioPath = path.resolve('./output/audio.wav');
  await mkdir(outDir, { recursive: true });

  try {
    // Extract frames
    const output = await runFFmpeg([
      '-hide_banner',
      '-y',
      '-i', input,
      '-vf', `select='gt(scene,${scene})',scale=iw:ih:flags=bicubic`, // Handle different color spaces
      '-fps_mode', 'vfr',
      '-pix_fmt', 'yuvj420p',
      '-strict', 'unofficial',
      '-q:v', '2', // High quality JPEG (1-31, lower is better)
      path.join(outDir, '%06d.jpg')
    ]);

    // Check if any frames were extracted from FFmpeg output
    const frameMatch = output.match(/frame=\s*(\d+)/);
    const frameCount = frameMatch ? parseInt(frameMatch[1]) : 0;

    if (frameCount === 0) {
      // Fallback: extract first frame
      console.log('\nNo scene changes detected, extracting first frame...');
      await runFFmpeg([
        '-hide_banner',
        '-y',
        '-i', input,
        '-vframes', '1',
        '-update', '1',
        '-pix_fmt', 'yuvj420p',
        '-strict', 'unofficial',
        '-q:v', '2',
        path.join(outDir, '000001.jpg')
      ]);
    }

    // Extract audio (if available)
    console.log('\nExtracting audio...');
    let hasAudio = false;
    try {
      await runFFmpeg([
        '-hide_banner',
        '-y',
        '-i', input,
        '-vn', // No video
        '-acodec', 'pcm_s16le', // WAV format
        '-ar', '16000', // 16kHz sample rate (good for speech recognition)
        '-ac', '1', // Mono
        audioPath
      ]);
      hasAudio = true;
    } catch (err) {
      console.log('No audio stream found or extraction failed');
    }

    return c.json({ 
      message: hasAudio 
        ? 'Frames and audio extracted successfully!' 
        : 'Frames extracted successfully! (no audio found)',
      outputDir: outDir,
      audioPath: hasAudio ? audioPath : null,
      frameCount: frameCount === 0 ? 1 : frameCount,
      hasAudio
    });
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});

// Run on localhost:8787
serve({ fetch: app.fetch, port: 8787 });
console.log('🚀 Server running at http://localhost:8787');