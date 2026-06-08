import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { ExportConfig, ExportResult, ExportProgress } from '../../types/export';
import { RESOLUTION_MAP, QUALITY_PARAMS } from '../../types/export';

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

export async function loadFFmpeg(
  onProgress?: (progress: number) => void
): Promise<FFmpeg> {
  if (ffmpegLoaded && ffmpegInstance) {
    return ffmpegInstance;
  }

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  ffmpegInstance = new FFmpeg();

  ffmpegInstance.on('log', ({ message }) => {
    console.log('[FFmpeg]', message);
  });

  ffmpegInstance.on('progress', ({ progress }) => {
    if (onProgress) {
      onProgress(progress);
    }
  });

  try {
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    });
    ffmpegLoaded = true;
    return ffmpegInstance;
  } catch (error) {
    console.error('Failed to load FFmpeg:', error);
    throw new Error('FFmpeg 加载失败，请检查网络连接或使用 MediaRecorder 模式');
  }
}

export function isFFmpegLoaded(): boolean {
  return ffmpegLoaded;
}

export interface FrameRenderer {
  renderFrame: (time: number) => void;
  getCanvas: () => HTMLCanvasElement;
}

export async function exportWithFFmpeg(
  config: ExportConfig,
  renderer: FrameRenderer,
  onProgress?: (progress: ExportProgress) => void
): Promise<ExportResult> {
  const ffmpeg = await loadFFmpeg((p) => {
    if (onProgress) {
      onProgress({
        status: 'encoding',
        percent: Math.round(p * 100),
        currentFrame: 0,
        totalFrames: 0
      });
    }
  });

  const resolution = RESOLUTION_MAP[config.resolution];
  const quality = QUALITY_PARAMS[config.quality];
  const totalFrames = config.duration * config.fps;

  if (onProgress) {
    onProgress({
      status: 'rendering',
      percent: 0,
      currentFrame: 0,
      totalFrames
    });
  }

  const canvas = renderer.getCanvas();
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = resolution.width;
  tempCanvas.height = resolution.height;
  const tempCtx = tempCanvas.getContext('2d')!;

  for (let i = 0; i < totalFrames; i++) {
    const time = i / config.fps;
    renderer.renderFrame(time / config.duration);

    tempCtx.drawImage(
      canvas,
      0, 0, canvas.width, canvas.height,
      0, 0, resolution.width, resolution.height
    );

    const imageData = tempCtx.getImageData(0, 0, resolution.width, resolution.height);
    await ffmpeg.writeFile(
      `frame-${i.toString().padStart(6, '0')}.png`,
      new Uint8Array(imageData.data.buffer)
    );

    if (onProgress && i % 10 === 0) {
      onProgress({
        status: 'rendering',
        percent: Math.round((i / totalFrames) * 100),
        currentFrame: i,
        totalFrames
      });
    }

    await new Promise(resolve => setTimeout(resolve, 0));
  }

  if (onProgress) {
    onProgress({
      status: 'encoding',
      percent: 0,
      currentFrame: totalFrames,
      totalFrames
    });
  }

  const outputExt = config.format;
  const outputFile = `output.${outputExt}`;

  const ffmpegArgs = [
    '-framerate', config.fps.toString(),
    '-i', 'frame-%06d.png',
    '-c:v', config.format === 'mp4' ? 'libx264' : 'gif',
    '-pix_fmt', config.format === 'mp4' ? 'yuv420p' : 'rgb8',
    '-crf', quality.crf.toString(),
    '-b:v', quality.bitrate,
    '-preset', 'medium',
    '-movflags', '+faststart',
    '-loop', config.loop ? '0' : '-1',
    outputFile
  ];

  if (config.format === 'gif') {
    ffmpegArgs.push('-f', 'gif');
  }

  await ffmpeg.exec(ffmpegArgs);

  const data = await ffmpeg.readFile(outputFile);
  const blob = new Blob([data], {
    type: config.format === 'mp4' ? 'video/mp4' : 'image/gif'
  });

  for (let i = 0; i < totalFrames; i++) {
    try {
      await ffmpeg.deleteFile(`frame-${i.toString().padStart(6, '0')}.png`);
    } catch (e) {}
  }
  try {
    await ffmpeg.deleteFile(outputFile);
  } catch (e) {}

  const url = URL.createObjectURL(blob);
  const filename = `new-year-card-${Date.now()}.${config.format}`;

  if (onProgress) {
    onProgress({
      status: 'completed',
      percent: 100,
      currentFrame: totalFrames,
      totalFrames
    });
  }

  return {
    url,
    blob,
    filename,
    format: config.format,
    size: blob.size,
    duration: config.duration
  };
}

export async function convertWebmToMp4(
  webmBlob: Blob,
  config: ExportConfig,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg(onProgress);

  const inputFile = 'input.webm';
  const outputFile = 'output.mp4';

  await ffmpeg.writeFile(inputFile, new Uint8Array(await webmBlob.arrayBuffer()));

  const quality = QUALITY_PARAMS[config.quality];
  await ffmpeg.exec([
    '-i', inputFile,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', quality.crf.toString(),
    '-b:v', quality.bitrate,
    '-preset', 'medium',
    '-movflags', '+faststart',
    outputFile
  ]);

  const data = await ffmpeg.readFile(outputFile);
  const blob = new Blob([data], { type: 'video/mp4' });

  try {
    await ffmpeg.deleteFile(inputFile);
    await ffmpeg.deleteFile(outputFile);
  } catch (e) {}

  return blob;
}

export async function convertWebmToGif(
  webmBlob: Blob,
  config: ExportConfig,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const ffmpeg = await loadFFmpeg(onProgress);

  const inputFile = 'input.webm';
  const paletteFile = 'palette.png';
  const outputFile = 'output.gif';

  await ffmpeg.writeFile(inputFile, new Uint8Array(await webmBlob.arrayBuffer()));

  await ffmpeg.exec([
    '-i', inputFile,
    '-vf', 'palettegen',
    paletteFile
  ]);

  await ffmpeg.exec([
    '-i', inputFile,
    '-i', paletteFile,
    '-lavfi', 'paletteuse',
    '-loop', config.loop ? '0' : '-1',
    outputFile
  ]);

  const data = await ffmpeg.readFile(outputFile);
  const blob = new Blob([data], { type: 'image/gif' });

  try {
    await ffmpeg.deleteFile(inputFile);
    await ffmpeg.deleteFile(paletteFile);
    await ffmpeg.deleteFile(outputFile);
  } catch (e) {}

  return blob;
}
