"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PlayerRef } from "@remotion/player"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronFirst,
  ChevronLast,
  Maximize2,
  Film,
  Download,
  Layers,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { RemotionPreview } from "./remotion-preview"
import { captureToBlob } from "@/lib/render-client"
import { renderClips, type BatchProgress } from "@/lib/render-batch"
import { saveBlob, type DirHandle } from "@/lib/fs-access"
import { sanitizeName, type Clip } from "@/lib/clips"
import { RESOLUTIONS, type OutputSettings } from "@/lib/studio-options"

type Props = {
  code: string
  settings: OutputSettings
  clips: Clip[]
  activeName: string
  outputDir: DirHandle | null
}

function formatTime(frame: number, fps: number) {
  const totalSeconds = frame / fps
  const mm = Math.floor(totalSeconds / 60)
  const ss = Math.floor(totalSeconds % 60)
  const ff = Math.floor(frame % fps)
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(ff).padStart(2, "0")}`
}

export function LivePreviewPanel({ code, settings, clips, activeName, outputDir }: Props) {
  const res = RESOLUTIONS[settings.resolutionIndex]
  const durationInFrames = Math.max(1, settings.durationSeconds * settings.fps)

  const playerRef = useRef<PlayerRef | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [frame, setFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [rendering, setRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null)

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    player.addEventListener("frameupdate", onFrame)
    player.addEventListener("play", onPlay)
    player.addEventListener("pause", onPause)
    return () => {
      player.removeEventListener("frameupdate", onFrame)
      player.removeEventListener("play", onPlay)
      player.removeEventListener("pause", onPause)
    }
  }, [code])

  const togglePlay = useCallback(() => playerRef.current?.toggle(), [])
  const seek = useCallback((f: number) => {
    playerRef.current?.seekTo(f)
    setFrame(f)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const el = stageRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.()
  }, [])

  const handleRender = useCallback(async () => {
    if (!containerRef.current || rendering) return
    setRendering(true)
    setRenderProgress(0)
    try {
      playerRef.current?.pause()
      const { blob, ext } = await captureToBlob({
        playerRef,
        node: containerRef.current,
        durationInFrames,
        fps: settings.fps,
        width: res.width,
        height: res.height,
        onProgress: setRenderProgress,
      })
      await saveBlob(blob, `claviera-${sanitizeName(activeName || "clip")}-${Date.now()}.${ext}`, outputDir)
    } catch (err) {
      console.log("[v0] render error:", (err as Error).message)
    } finally {
      setRendering(false)
      setRenderProgress(0)
    }
  }, [durationInFrames, settings.fps, rendering, activeName, outputDir, res.width, res.height])

  const handleRenderAll = useCallback(async () => {
    if (rendering || clips.length === 0) return
    setRendering(true)
    setBatchProgress({ index: 0, total: clips.length, clipName: clips[0].name, percent: 0 })
    try {
      playerRef.current?.pause()
      await renderClips(
        clips,
        {
          width: res.width,
          height: res.height,
          fps: settings.fps,
          durationInFrames,
          dir: outputDir,
        },
        setBatchProgress,
      )
    } catch (err) {
      console.log("[v0] batch render error:", (err as Error).message)
    } finally {
      setRendering(false)
      setBatchProgress(null)
    }
  }, [rendering, clips, res.width, res.height, settings.fps, durationInFrames, outputDir])

  return (
    <div className="flex h-full flex-col">
      {/* Sub-toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-card/40 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="rounded bg-secondary px-2 py-0.5 font-medium text-foreground">{activeName || "Composition"}</span>
        </div>
        <span className="tabular-nums">
          {res.width}x{res.height} · {settings.fps} FPS · {settings.durationSeconds}s · {settings.format}
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Compositions list */}
        <div className="hidden w-56 flex-col border-r border-border bg-card/30 md:flex">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-xs font-semibold text-foreground">
            <Layers className="size-3.5 text-primary" />
            Compositions ({clips.length})
          </div>
          <div className="space-y-1 p-2">
            {clips.map((clip) => (
              <div
                key={clip.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-xs",
                  clip.name === activeName
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground",
                )}
              >
                <Film className="size-3.5 shrink-0" />
                <span className="truncate" title={clip.name}>
                  {clip.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stage */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div ref={stageRef} className="flex min-h-0 flex-1 items-center justify-center bg-[#08060d] p-4">
            <div className="relative flex h-full w-full max-w-full items-center justify-center">
              <RemotionPreview
                code={code}
                width={res.width}
                height={res.height}
                fps={settings.fps}
                durationInFrames={durationInFrames}
                playerRef={playerRef}
                containerRef={containerRef}
              />
              {rendering && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  {batchProgress ? (
                    <>
                      <p className="text-sm text-foreground">
                        Rendering {batchProgress.index + 1} / {batchProgress.total}: {batchProgress.clipName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {batchProgress.percent}% · {outputDir ? `saving to ${outputDir.name}` : "downloading"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-foreground">Encoding MP4 on your machine… {renderProgress}%</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2 border-t border-border bg-card/50 px-4 py-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-8" onClick={() => seek(0)} aria-label="Go to start">
                <ChevronFirst className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => seek(Math.max(0, frame - 1))}
                aria-label="Previous frame"
              >
                <SkipBack className="size-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="size-9"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => seek(Math.min(durationInFrames - 1, frame + 1))}
                aria-label="Next frame"
              >
                <SkipForward className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => seek(durationInFrames - 1)}
                aria-label="Go to end"
              >
                <ChevronLast className="size-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="tabular-nums">{settings.fps.toFixed(0)} FPS</span>
              <Button variant="ghost" size="icon" className="size-8" onClick={toggleFullscreen} aria-label="Fullscreen">
                <Maximize2 className="size-4" />
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="border-t border-border bg-card/30 px-4 py-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-mono tabular-nums text-foreground">{formatTime(frame, settings.fps)}</span>
              <span className="font-mono tabular-nums text-primary">{frame}</span>
            </div>
            <Slider
              value={[frame]}
              min={0}
              max={durationInFrames - 1}
              step={1}
              onValueChange={(v) => seek(v[0])}
              aria-label="Timeline"
            />
          </div>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center gap-3 border-t border-border bg-card/60 px-4 py-3">
        <Button
          className="flex-1 gap-2 bg-success text-success-foreground hover:bg-success/90"
          onClick={handleRender}
          disabled={rendering}
        >
          <Download className="size-4" />
          Export Current (MP4)
        </Button>
        <Button
          className="flex-1 gap-2 bg-info text-info-foreground hover:bg-info/90"
          onClick={handleRenderAll}
          disabled={rendering || clips.length === 0}
        >
          <Film className="size-4" />
          Render All ({clips.length})
        </Button>
      </div>
    </div>
  )
}
