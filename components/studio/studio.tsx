"use client"

import { useMemo, useState } from "react"
import { Play, Minus, Square, X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OutputSidebar } from "./output-sidebar"
import { CodeEditorPanel } from "./code-editor-panel"
import { LivePreviewPanel } from "./live-preview-panel"
import { TemplatePanel } from "./template-panel"
import { AutoCoderPanel } from "./auto-coder-panel"
import { DEFAULT_SETTINGS, type OutputSettings } from "@/lib/studio-options"
import { defaultClips, type Clip } from "@/lib/clips"
import type { DirHandle } from "@/lib/fs-access"

const MENU = ["File", "View", "Tools", "Packages", "Help"]

export function Studio() {
  const [clips, setClips] = useState<Clip[]>(() => defaultClips())
  const [activeId, setActiveId] = useState<string>(() => clips[0]?.id ?? "")
  const [outputDir, setOutputDir] = useState<DirHandle | null>(null)
  const [settings, setSettings] = useState<OutputSettings>(DEFAULT_SETTINGS)
  const [tab, setTab] = useState("preview")
  const [generateCount, setGenerateCount] = useState(1)

  const activeClip = useMemo(
    () => clips.find((c) => c.id === activeId) ?? clips[0],
    [clips, activeId],
  )

  const updateSettings = (patch: Partial<OutputSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }))

  // Replace the active clip's code (from editor / template / AI output).
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
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-border bg-[#0c0a12] px-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Play className="size-3 text-primary" />
          <span>Vibe Motion Pro — Motion Graphic Generator for Remotion</span>
        </div>
        <div className="flex items-center gap-3">
          <Minus className="size-3.5" />
          <Square className="size-3" />
          <X className="size-3.5" />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <OutputSidebar
          settings={settings}
          onChange={updateSettings}
          generateCount={generateCount}
          onGenerateCountChange={setGenerateCount}
          outputDir={outputDir}
          onOutputDirChange={setOutputDir}
          onImportClips={importClips}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
            {/* Menubar + tabs */}
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/40 px-3">
              <div className="flex items-center gap-4 py-2 text-xs text-muted-foreground">
                {MENU.map((m) => (
                  <button key={m} className="transition-colors hover:text-foreground" type="button">
                    {m}
                  </button>
                ))}
              </div>
              <TabsList className="my-1.5 bg-secondary/60">
                <TabsTrigger value="code">Code Editor</TabsTrigger>
                <TabsTrigger value="preview">Live Preview</TabsTrigger>
                <TabsTrigger value="template">Custom AI Template</TabsTrigger>
                <TabsTrigger value="auto">Auto Coder</TabsTrigger>
              </TabsList>
              <div className="w-32" aria-hidden />
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
                outputDir={outputDir}
              />
            </TabsContent>
            <TabsContent value="template" className="min-h-0 flex-1 outline-none">
              <TemplatePanel settings={settings} onApply={applyCode} />
            </TabsContent>
            <TabsContent value="auto" className="min-h-0 flex-1 outline-none">
              <AutoCoderPanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
