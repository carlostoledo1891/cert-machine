/* video.js — a scene to an MP4, frame by frame: the house grammar in motion.
   design/ · cert-machine · 2026-10-29

   WHY FRAME BY FRAME. A screen recording of an animation races the page: a cold font, a slow frame, and the video
   shows something the page never meant. Here the scene is a page that exposes window.frame(t) and draws the state at
   time t, nothing else; Chrome (design/cdp.js, the one client) sets t, waits for the paint, and captures; ffmpeg
   encodes the captures in order. Frame k is the same bytes on every run, so a video can be checked like a figure.

   usage (from a scene builder):
     const { renderVideo } = require('../design/video.js');
     await renderVideo({ html: '/abs/scene.html', out: '/abs/out.mp4', width: 1600, height: 900, fps: 30, seconds: 15,
                         poster: { t: 12, out: '/abs/poster.png' } });
   The scene's page must set window.frame = (t) => { … } and may set window.ready (a promise) for its data.     MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { withChrome, settle } = require('./cdp.js');

async function renderVideo({ html, out, width = 1600, height = 900, fps = 30, seconds = 15, poster, port = 9261, crf = 18 }) {
  if (!fs.existsSync(html)) throw new Error('video.js: no scene at ' + html);
  const frames = Math.round(fps * seconds);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ff = cp.spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(crf), '-preset', 'slow', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c)))));
  await withChrome(async (send) => {
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'file://' + html });
    await settle(1500);
    /* the scene's own readiness, then the fonts: a frame drawn in a fallback face is a different picture */
    const ok = await send('Runtime.evaluate', { expression: 'Promise.resolve(window.ready).then(() => document.fonts.ready).then(() => typeof window.frame === "function")', awaitPromise: true, returnByValue: true });
    if (!ok.result || ok.result.value !== true) throw new Error('video.js: the scene did not define window.frame');
    const shot = async (t) => {
      await send('Runtime.evaluate', { expression: 'window.frame(' + t + '); new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))', awaitPromise: true });
      return Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64');
    };
    for (let k = 0; k < frames; k++) {
      const png = await shot(k / fps);
      if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    if (poster) fs.writeFileSync(poster.out, await shot(poster.t));
  }, { port });
  ff.stdin.end();
  await done;
  return { frames, out };
}

module.exports = { renderVideo };
