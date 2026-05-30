"use client"

import { useEffect, useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import { Trash2, Save, FileText, Rocket, Loader2, Film, Plus, X, FolderCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { filesToClips, type Clip } from "@/lib/clips"
import { RESOLUTIONS, type OutputSettings } from "@/lib/studio-options"
import { renderClips, type BatchProgress, type BatchResult } from "@/lib/render-batch"
import type { DirHandle } from "@/lib/fs-access"

type Props = {
  clips: Clip[]
  activeId: string
  settings: OutputSettings
  outputDir: DirHandle | null
  onSelectClip: (id: string) => void
  onApply: (code: string) => void
  onImportClips: (clips: Clip[]) => void
  onRemoveClip: (id: string) => void
  onClearClips: () => void
}

export function CodeEditorPanel({
  clips,
  activeId,
  settings,
  outputDir,
  onSelectClip,
  onApply,
  onImportClips,
  onRemoveClip,
  onClearClips,
}: Props) {
  const activeClip = clips.find((c) => c.id === activeId) ?? clips[0]
  const [draft, setDraft] = useState(activeClip?.code ?? "")
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [batchRunning, setBatchRunning] = useState(false)
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [results, setResults] = useState<BatchResult[] | null>(null)

  useEffect(() => {
    setDraft(activeClip?.code ?? "")
  }, [activeClip?.id, activeClip?.code])

  const dirty = draft !== (activeClip?.code ?? "")

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const imported = await filesToClips(files)
    onImportClips(imported)
    e.target.value = ""
  }

  const handleRenderAll = async () => {
    if (batchRunning || clips.length === 0) return
    setBatchRunning(true)
    setResults(null)
    setProgress({ index: 0, total: clips.length, clipName: clips[0].name, percent: 0 })
    try {
      const res = RESOLUTIONS[settings.resolutionIndex]
      const out = await renderClips(
        clips,
        {
          width: res.width,
          height: res.height,
          fps: settings.fps,
          durationInFrames: Math.max(1, settings.durationSeconds * settings.fps),
          dir: outputDir,
        },
        setProgress,
      )
      setResults(out)
    } catch (err) {
      console.log("[v0] batch render error:", (err as Error).message)
    } finally {
      setBatchRunning(false)
      setProgress(null)
    }
  }

  return (
    <div className="flex h-full min-h-0">
      {/* Clip list */}
      <div className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/30 md:flex">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-xs font-semibold text-foreground">Compositions ({clips.length})</span>
          <button
            type="button"
            className="flex items-center gap-1 text-[11px] text-primary transition-colors hover:text-primary/80"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="size-3" />
            Add
          </button>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-1 p-2">
            {clips.map((clip, i) => (
              <div
                key={clip.id}
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2.5 py-2 text-xs transition-colors",
                  clip.id === activeId
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Film className="size-3.5 shrink-0" />
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left"
                  onClick={() => onSelectClip(clip.id)}
                  title={clip.name}
                >
                  {i + 1}. {clip.name}
                </button>
                <button
                  type="button"
                  className="opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  onClick={() => onRemoveClip(clip.id)}
                  aria-label={`Remove ${clip.name}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Editor column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border bg-card/40 px-4 py-2.5">
          <span className="text-sm font-semibold text-warn">
            Total : {clips.length} Video{clips.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={onClearClips}>
              <Trash2 className="size-3.5" />
              Delete All
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-success text-success-foreground hover:bg-success/90"
              onClick={() => onApply(draft)}
              disabled={!dirty}
            >
              <Save className="size-3.5" />
              Save &amp; Update Preview
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="relative min-h-0 flex-1">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
              <Loader2 className="size-5 animate-spin text-primary" />
            </div>
          )}
          <Editor
            height="100%"
            defaultLanguage="typescript"
            theme="vs-dark"
            path={activeClip?.id}
            value={draft}
            onChange={(v) => setDraft(v ?? "")}
            onMount={() => setLoading(false)}
            options={{
              fontSize: 13,
              fontFamily: "var(--font-mono), monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 12 },
              tabSize: 2,
              lineNumbers: "on",
              renderLineHighlight: "line",
              smoothScrolling: true,
            }}
          />

          {/* Batch render overlay */}
          {batchRunning && progress && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Rendering {progress.index + 1} / {progress.total}: {progress.clipName}
              </p>
              <div className="h-2 w-64 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{progress.percent}% of current clip</p>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.tsx,.ts,.jsx,.js"
          multiple
          className="hidden"
          onChange={handleImport}
        />
        <div className="flex items-center justify-between border-t border-border bg-card/50 px-4 py-2.5">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileText className="size-3.5" />
            Import Multi-Code (.txt / .tsx)
          </Button>
          <div className="flex items-center gap-3">
            {results && !batchRunning && (
              <span className="flex items-center gap-1.5 text-xs text-success">
                <FolderCheck className="size-3.5" />
                {results.filter((r) => r.status !== "error").length}/{results.length} rendered
                {results.some((r) => r.status === "saved-folder") ? " to folder" : ""}
              </span>
            )}
            <Button
              size="sm"
              className="gap-1.5 bg-warn text-warn-foreground hover:bg-warn/90"
              onClick={handleRenderAll}
              disabled={batchRunning || clips.length === 0}
            >
              {batchRunning ? <Loader2 className="size-3.5 animate-spin" /> : <Rocket className="size-3.5" />}
              Render All ({clips.length})
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
