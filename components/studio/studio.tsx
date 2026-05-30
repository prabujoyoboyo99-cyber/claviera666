"use client"

import { useMemo, useState } from "react"
import { Clapperboard, Minus, Square, X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OutputSidebar } from "./output-sidebar"
import { CodeEditorPanel } from "./code-editor-panel"
import { LivePreviewPanel } from "./live-preview-panel"
import { TemplatePanel } from "./template-panel"
import { DEFAULT_SETTINGS, type OutputSettings } from "@/lib/studio-options"
import { defaultClips, type Clip } from "@/lib/clips"
import type { DirHandle } from "@/lib/fs-access"

export function Studio() {
  const [clips, setClips] = useState<Clip[]>(() => defaultClips())
  const [activeId, setActiveId] = useState<string>(() => clips[0]?.id ?? "")
  const [outputDir, setOutputDir] = useState<DirHandle | null>(null)
  const [settings, setSettings] = useState<OutputSettings>(DEFAULT_SETTINGS)
  const [tab, setTab] = useState("preview")

  const activeClip = useMemo(
    () => clips.find((c) => c.id === activeId) ?? clips[0],
    [clips, activeId],
  )

  const updateSettings = (patch: Partial<OutputSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }))

  // Replace the active clip's code (from editor / template output).
  const applyCode = (next: string) => {
    setClips((prev) => prev.map((c) => (c.id === activeClip?.id ? { ...c, code: next } : c)))
    setTab("preview")
  }

  // Append newly imported clips and focus the first one.
  const importClips = (incoming: Clip[]) => {
    if (incoming.length === 0) return
    setClips((prev) => [...prev, ...incoming])
    setActiveId(incoming[0].id)
    setTab("code")
  }

  const removeClip = (id: string) => {
    setClips((prev) => {
      const next = prev.filter((c) => c.id !== id)
      if (next.length === 0) {
        const seed = defaultClips()
        setActiveId(seed[0].id)
        return seed
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }

  const clearClips = () => {
    const seed = defaultClips()
    setClips(seed)
    setActiveId(seed[0].id)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Window title bar */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card/60 px-4 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Clapperboard className="size-3.5" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight text-foreground">Claviera Motion</span>
            <span className="hidden text-[11px] text-muted-foreground sm:inline">Remotion Studio</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <Minus className="size-3.5 transition-colors hover:text-foreground" />
          <Square className="size-3 transition-colors hover:text-foreground" />
          <X className="size-3.5 transition-colors hover:text-destructive" />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <OutputSidebar
          settings={settings}
          onChange={updateSettings}
          outputDir={outputDir}
          onOutputDirChange={setOutputDir}
          onImportClips={importClips}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
            {/* Tab bar */}
            <div className="flex shrink-0 items-center justify-center border-b border-border bg-card/30 px-3 py-2">
              <TabsList className="bg-secondary/50">
                <TabsTrigger value="code">Code Editor</TabsTrigger>
                <TabsTrigger value="preview">Live Preview</TabsTrigger>
                <TabsTrigger value="template">AI Template</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="code" className="min-h-0 flex-1 outline-none">
              <CodeEditorPanel
                clips={clips}
                activeId={activeClip?.id ?? ""}
                settings={settings}
                outputDir={outputDir}
                onSelectClip={setActiveId}
                onApply={applyCode}
                onImportClips={importClips}
                onRemoveClip={removeClip}
                onClearClips={clearClips}
              />
            </TabsContent>
            <TabsContent value="preview" className="min-h-0 flex-1 outline-none">
              <LivePreviewPanel
                code={activeClip?.code ?? ""}
                settings={settings}
                clips={clips}
                activeName={activeClip?.name ?? ""}
                outputDir={outputDir}
              />
            </TabsContent>
            <TabsContent value="template" className="min-h-0 flex-1 outline-none">
              <TemplatePanel settings={settings} onApply={applyCode} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
