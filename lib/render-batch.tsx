"use client"

import React from "react"
import { createRoot } from "react-dom/client"
import { Player, type PlayerRef } from "@remotion/player"
import { compileComposition } from "./compile-composition"
import { captureToBlob, type CaptureResult } from "./render-client"
import { saveBlob, type DirHandle } from "./fs-access"
import { sanitizeName, type Clip } from "./clips"

export type BatchOptions = {
  width: number
  height: number
  fps: number
  durationInFrames: number
  dir: DirHandle | null
}

export type BatchProgress = {
  index: number
  total: number
  clipName: string
  percent: number
}

export type BatchResult = {
  clipName: string
  fileName: string
  status: "saved-folder" | "downloaded" | "error"
  error?: string
}

const waitForMount = (ref: React.RefObject<PlayerRef | null>) =>
  new Promise<void>((resolve) => {
    const check = () => (ref.current ? resolve() : requestAnimationFrame(check))
    requestAnimationFrame(check)
  })

/** Render a single clip offscreen into a video blob (MP4 when supported). */
async function renderClipToBlob(
  clip: Clip,
  opts: BatchOptions,
  onProgress: (percent: number) => void,
): Promise<CaptureResult> {
  const compiled = compileComposition(clip.code)
  if (!compiled.ok) throw new Error(compiled.error)

  const host = document.createElement("div")
  host.style.position = "fixed"
  host.style.left = "-100000px"
  host.style.top = "0"
  host.style.width = `${opts.width}px`
  host.style.height = `${opts.height}px`
  host.style.pointerEvents = "none"
  document.body.appendChild(host)

  const playerRef = React.createRef<PlayerRef>()
  const root = createRoot(host)

  try {
    root.render(
      <Player
        ref={playerRef}
        component={compiled.Component}
        durationInFrames={opts.durationInFrames}
        fps={opts.fps}
        compositionWidth={opts.width}
        compositionHeight={opts.height}
        style={{ width: "100%", height: "100%" }}
        acknowledgeRemotionLicense
      />,
    )
    await waitForMount(playerRef)
    return await captureToBlob({
      playerRef,
      node: host,
      durationInFrames: opts.durationInFrames,
      fps: opts.fps,
      width: opts.width,
      height: opts.height,
      onProgress,
    })
  } finally {
    root.unmount()
    host.remove()
  }
}

/** Render every clip sequentially, saving each to the chosen folder (or downloading). */
export async function renderClips(
  clips: Clip[],
  opts: BatchOptions,
  onProgress: (p: BatchProgress) => void,
): Promise<BatchResult[]> {
  const results: BatchResult[] = []
  const total = clips.length
  const used = new Set<string>()

  for (let i = 0; i < total; i++) {
    const clip = clips[i]
    try {
      const { blob, ext } = await renderClipToBlob(clip, opts, (percent) =>
        onProgress({ index: i, total, clipName: clip.name, percent }),
      )
      // avoid overwriting clips that share a name
      let fileName = `${sanitizeName(clip.name)}.${ext}`
      let n = 2
      while (used.has(fileName)) {
        fileName = `${sanitizeName(clip.name)}_${n++}.${ext}`
      }
      used.add(fileName)

      const where = await saveBlob(blob, fileName, opts.dir)
      results.push({
        clipName: clip.name,
        fileName,
        status: where === "folder" ? "saved-folder" : "downloaded",
      })
    } catch (err) {
      results.push({
        clipName: clip.name,
        fileName: sanitizeName(clip.name),
        status: "error",
        error: (err as Error).message,
      })
    }
  }
  return results
}
