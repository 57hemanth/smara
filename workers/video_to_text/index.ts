import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, unlink, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

// Helper to run ffmpeg and wait for it to finish, returns output
async function runFFmpeg(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', args);
    let output = '';
    
    p.stderr?.on('data', (data) => {
      output += data.toString();
      process.stderr.write(data);
    });
    
    p.on('exit', code => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${output}`));
      }
    });
  });
}

// Helper to save uploaded file
async function saveUploadedFile(file: File, outputPath: string): Promise<void> {
  const buffer = await file.arrayBuffer();
  const writeStream = createWriteStream(outputPath);
  writeStream.write(Buffer.from(buffer));
  writeStream.end();
  
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

const app = new Hono();

app.get('/', (c) =>
  c.text('🎬 SMARA Video Processor\nPOST /process with multipart/form-data video file')
);

app.post('/process', async (c) => {
  const jobId = randomUUID();
  const workDir = path.resolve(`./work/${jobId}`);
  
  try {
    // Create work directory
    await mkdir(workDir, { recursive: true });

    // Get metadata from headers
    const assetId = c.req.header('x-asset-id');
    const userId = c.req.header('x-user-id');

    if (!assetId || !userId) {
      return c.json({ error: 'asset_id and user_id headers required' }, 400);
    }

    console.log(`Processing video for asset ${assetId}, user ${userId}`);

    // Get video data from request body
    const videoBuffer = await c.req.arrayBuffer();
    if (!videoBuffer || videoBuffer.byteLength === 0) {
      return c.json({ error: 'video data required in body' }, 400);
    }

    // Save video to disk
    const videoPath = path.join(workDir, 'input.mp4');
    const writeStream = createWriteStream(videoPath);
    writeStream.write(Buffer.from(videoBuffer));
    writeStream.end();
    
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    // Extract frames with scene detection
    const framesDir = path.join(workDir, 'frames');
    await mkdir(framesDir, { recursive: true });

    console.log('Extracting frames with scene detection...');
    const sceneThreshold = 0.3;
    
    let output = await runFFmpeg([
      '-hide_banner',
      '-y',
      '-i', videoPath,
      '-vf', `select='gt(scene,${sceneThreshold})',scale=iw:ih:flags=bicubic`,
      '-fps_mode', 'vfr',
      '-pix_fmt', 'yuvj420p',
      '-strict', 'unofficial',
      '-q:v', '2',
      path.join(framesDir, 'frame_%06d.jpg')
    ]);

    // Check extracted frames
    let frameFiles = await readdir(framesDir);
    
    if (frameFiles.length === 0) {
      // Fallback: extract frames every 5 seconds
      console.log('No scene changes detected, extracting frames every 5s...');
      await runFFmpeg([
        '-hide_banner',
        '-y',
        '-i', videoPath,
        '-vf', 'fps=1/5',
        '-pix_fmt', 'yuvj420p',
        '-strict', 'unofficial',
        '-q:v', '2',
        path.join(framesDir, 'frame_%06d.jpg')
      ]);
      
      frameFiles = await readdir(framesDir);
      
      // If still no frames, extract first frame only
      if (frameFiles.length === 0) {
        console.log('Extracting first frame...');
        await runFFmpeg([
          '-hide_banner',
          '-y',
          '-i', videoPath,
          '-vframes', '1',
          '-pix_fmt', 'yuvj420p',
          '-strict', 'unofficial',
          '-q:v', '2',
          path.join(framesDir, 'frame_000001.jpg')
        ]);
        frameFiles = await readdir(framesDir);
      }
    }

    console.log(`Extracted ${frameFiles.length} frames`);

    // Read frames as base64
    const frames = await Promise.all(
      frameFiles.map(async (file) => {
        const framePath = path.join(framesDir, file);
        const frameData = await readFile(framePath);
        return {
          filename: file,
          data: frameData.toString('base64'),
          size: frameData.length
        };
      })
    );

    // Extract audio (if available)
    console.log('Extracting audio...');
    let audio = null;
    const audioPath = path.join(workDir, 'audio.wav');
    
    try {
      await runFFmpeg([
        '-hide_banner',
        '-y',
        '-i', videoPath,
        '-vn',
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        audioPath
      ]);
      
      const audioData = await readFile(audioPath);
      audio = {
        data: audioData.toString('base64'),
        size: audioData.length
      };
      console.log('Audio extracted successfully');
    } catch (err) {
      console.log('No audio stream found or extraction failed:', err);
    }

    // Clean up work directory
    await rm(workDir, { recursive: true, force: true });

    return c.json({
      success: true,
      asset_id: assetId,
      frames,
      audio,
      metadata: {
        frame_count: frames.length,
        has_audio: audio !== null,
        total_size_bytes: frames.reduce((sum, f) => sum + f.size, 0) + (audio?.size || 0)
      }
    });

  } catch (err) {
    console.error('Processing error:', err);
    
    // Clean up on error
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {}
    
    return c.json({ 
      error: err instanceof Error ? err.message : 'Unknown error',
      asset_id: c.req.header('x-asset-id') || 'unknown'
    }, 500);
  }
});

// Run on port 8080 (must match VideoContainer.defaultPort in worker.ts)
const port = parseInt(process.env.PORT || '8080');
serve({ fetch: app.fetch, port });
console.log(`🚀 SMARA Video Processor running on port ${port}`);