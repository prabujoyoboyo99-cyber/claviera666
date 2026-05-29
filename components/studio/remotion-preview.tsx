"use client"

import { useMemo, type RefObject } from "react"
import { Player, type PlayerRef } from "@remotion/player"
import { AlertTriangle } from "lucide-react"
import { compileComposition } from "@/lib/compile-composition"

type Props = {
  code: string
  width: number
  height: number
  fps: number
  durationInFrames: number
  playerRef: RefObject<PlayerRef | null>
  containerRef: RefObject<HTMLDivElement | null>
}

export function RemotionPreview({
  code,
  width,
  height,
  fps,
  durationInFrames,
  playerRef,
  containerRef,
}: Props) {
  const compiled = useMemo(() => compileComposition(code), [code])

  if (!compiled.ok) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div className="max-w-md rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="size-4" />
            Composition error
          </div>
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-destructive/90">
            {compiled.error}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full items-center justify-center"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <Player
        ref={playerRef}
        component={compiled.Component}
        durationInFrames={durationInFrames}
        fps={fps}
        compositionWidth={width}
        compositionHeight={height}
        style={{ width: "100%", height: "100%" }}
        acknowledgeRemotionLicense
        loop
      />
    </div>
  )
}
