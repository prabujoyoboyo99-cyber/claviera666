"use client"

import type { RefObject } from "react"
import type { PlayerRef } from "@remotion/player"

type RenderArgs = {
  playerRef: RefObject<PlayerRef | null>
  node: HTMLElement
  durationInFrames: number
  fps: number
  onProgress: (percent: number) => void
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)))
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Best-effort client-side render. Steps the Remotion player frame by frame,
 * snapshots the DOM to a canvas, and records it to a WebM file that downloads
 * to the user's machine. (True multi-codec MP4 export requires the desktop
 * build with @remotion/renderer.)
 */
export async function renderToWebM({ playerRef, node, durationInFrames, fps, onProgress }: RenderArgs) {
  const { toCanvas } = await import("html-to-image")

  const rect = node.getBoundingClientRect()
  const scale = Math.min(1, 1280 / Math.max(1, rect.width))
  const w = Math.max(2, Math.round(rect.width * scale))
  const h = Math.max(2, Math.round(rect.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")

  const stream = canvas.captureStream(fps)
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm"
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 })
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
    try {
      const snap = await toCanvas(node, { pixelRatio: scale, cacheBust: true })
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(snap, 0, 0, w, h)
    } catch {
      // Skip frames that fail to snapshot (e.g. cross-origin assets).
    }
    onProgress(Math.round(((f + 1) / durationInFrames) * 100))
    await wait(1000 / fps)
  }

  recorder.stop()
  await stopped

  const blob = new Blob(chunks, { type: "video/webm" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `vibe-motion-${Date.now()}.webm`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
