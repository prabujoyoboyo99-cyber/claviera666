"use client"

import type { RefObject } from "react"
import type { PlayerRef } from "@remotion/player"

type CaptureArgs = {
  playerRef: RefObject<PlayerRef | null>
  node: HTMLElement
  durationInFrames: number
  fps: number
  /** Target output resolution. Defaults to the node's measured size. */
  width?: number
  height?: number
  onProgress: (percent: number) => void
}

export type CaptureResult = {
  blob: Blob
  ext: "mp4" | "webm"
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)))
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** True when the browser can encode H.264/MP4 with WebCodecs. */
function supportsWebCodecs(): boolean {
  return typeof window !== "undefined" && "VideoEncoder" in window && "VideoFrame" in window
}

/** Pick the highest H.264 level the encoder accepts for the given resolution. */
async function pickAvcCodec(width: number, height: number, fps: number, bitrate: number): Promise<string | null> {
  // High profile (6400) across descending levels: 5.2 → 4.0. Covers 4K down to 720p.
  const candidates = ["avc1.640034", "avc1.640033", "avc1.640032", "avc1.640028", "avc1.64001f"]
  for (const codec of candidates) {
    try {
      const support = await (window as any).VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate,
        framerate: fps,
      })
      if (support?.supported) return codec
    } catch {
      // try next codec string
    }
  }
  return null
}

/** Max-quality bitrate target derived from resolution and frame rate. */
function targetBitrate(width: number, height: number, fps: number): number {
  return Math.min(80_000_000, Math.max(6_000_000, Math.round(width * height * fps * 0.18)))
}

/**
 * Render the Remotion player to a video Blob entirely on the client.
 * Steps the player frame by frame, snapshots the DOM, and encodes to MP4
 * (H.264) using WebCodecs when available — frame-accurate and far faster than
 * real time. Falls back to a WebM MediaRecorder capture otherwise.
 */
export async function captureToBlob(args: CaptureArgs): Promise<CaptureResult> {
  const { toCanvas } = await import("html-to-image")
  const { playerRef, node, durationInFrames, fps, onProgress } = args

  const rect = node.getBoundingClientRect()
  // Even dimensions are required by H.264.
  const outW = Math.max(2, Math.round((args.width ?? rect.width) / 2) * 2)
  const outH = Math.max(2, Math.round((args.height ?? rect.height) / 2) * 2)
  const pixelRatio = outW / Math.max(1, rect.width)

  // Exact-size scratch canvas the encoder reads from.
  const out = document.createElement("canvas")
  out.width = outW
  out.height = outH
  const octx = out.getContext("2d")
  if (!octx) throw new Error("Canvas 2D context unavailable")

  const snapshotFrame = async () => {
    try {
      const snap = await toCanvas(node, { pixelRatio, cacheBust: true })
      octx.clearRect(0, 0, outW, outH)
      octx.drawImage(snap, 0, 0, outW, outH)
    } catch {
      // Keep the previous frame if a snapshot fails (e.g. cross-origin asset).
    }
  }

  if (supportsWebCodecs()) {
    try {
      return await encodeMp4({ ...args, outW, outH, octx, out, snapshotFrame, playerRef, durationInFrames, fps, onProgress })
    } catch (err) {
      console.log("[v0] WebCodecs MP4 failed, falling back to WebM:", (err as Error).message)
    }
  }

  return encodeWebm({ outW, outH, octx, out, snapshotFrame, playerRef, durationInFrames, fps, onProgress })
}

type EncodeArgs = {
  outW: number
  outH: number
  octx: CanvasRenderingContext2D
  out: HTMLCanvasElement
  snapshotFrame: () => Promise<void>
  playerRef: RefObject<PlayerRef | null>
  durationInFrames: number
  fps: number
  onProgress: (percent: number) => void
}

/** Frame-accurate H.264 MP4 encode via WebCodecs + mp4-muxer. */
async function encodeMp4(args: EncodeArgs): Promise<CaptureResult> {
  const { outW, outH, out, snapshotFrame, playerRef, durationInFrames, fps, onProgress } = args
  const { Muxer, ArrayBufferTarget } = await import("mp4-muxer")

  const bitrate = targetBitrate(outW, outH, fps)
  const codec = await pickAvcCodec(outW, outH, fps, bitrate)
  if (!codec) throw new Error("No supported H.264 configuration")

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width: outW, height: outH, frameRate: fps },
    fastStart: "in-memory",
  })

  const VideoEncoderCtor = (window as any).VideoEncoder
  const VideoFrameCtor = (window as any).VideoFrame
  let encodeError: Error | null = null

  const encoder = new VideoEncoderCtor({
    output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
    error: (e: Error) => {
      encodeError = e
    },
  })
  encoder.configure({
    codec,
    width: outW,
    height: outH,
    bitrate,
    framerate: fps,
    latencyMode: "quality",
  })

  const frameDuration = 1_000_000 / fps // microseconds
  const gop = Math.max(1, Math.round(fps * 2)) // keyframe every ~2s

  for (let f = 0; f < durationInFrames; f++) {
    if (encodeError) throw encodeError
    playerRef.current?.seekTo(f)
    await nextFrame()
    await nextFrame()
    await snapshotFrame()

    const frame = new VideoFrameCtor(out, {
      timestamp: Math.round(f * frameDuration),
      duration: Math.round(frameDuration),
    })
    encoder.encode(frame, { keyFrame: f % gop === 0 })
    frame.close()

    // Apply backpressure so the encode queue never balloons.
    while (encoder.encodeQueueSize > 8) await wait(2)

    onProgress(Math.round(((f + 1) / durationInFrames) * 100))
  }

  await encoder.flush()
  if (encodeError) throw encodeError
  muxer.finalize()

  const { buffer } = muxer.target as { buffer: ArrayBuffer }
  return { blob: new Blob([buffer], { type: "video/mp4" }), ext: "mp4" }
}

/** WebM fallback for environments without WebCodecs. */
async function encodeWebm(args: EncodeArgs): Promise<CaptureResult> {
  const { outW, outH, out, snapshotFrame, playerRef, durationInFrames, fps, onProgress } = args

  const stream = out.captureStream(fps)
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm"
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: targetBitrate(outW, outH, fps) })
  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })
  recorder.start()

  for (let f = 0; f < durationInFrames; f++) {
    playerRef.current?.seekTo(f)
    await nextFrame()
    await nextFrame()
    await snapshotFrame()
    onProgress(Math.round(((f + 1) / durationInFrames) * 100))
    await wait(1000 / fps)
  }

  recorder.stop()
  await stopped
  return { blob: new Blob(chunks, { type: "video/webm" }), ext: "webm" }
}
