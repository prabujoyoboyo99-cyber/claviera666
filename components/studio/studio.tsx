"use client"

import { useState } from "react"
import { Play, Minus, Square, X } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OutputSidebar } from "./output-sidebar"
import { CodeEditorPanel } from "./code-editor-panel"
import { LivePreviewPanel } from "./live-preview-panel"
import { TemplatePanel } from "./template-panel"
import { AutoCoderPanel } from "./auto-coder-panel"
import { DEFAULT_CODE } from "@/lib/default-code"
import { DEFAULT_SETTINGS, type OutputSettings } from "@/lib/studio-options"

const MENU = ["File", "View", "Tools", "Packages", "Help"]

export function Studio() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [settings, setSettings] = useState<OutputSettings>(DEFAULT_SETTINGS)
  const [tab, setTab] = useState("preview")
  const [generateCount, setGenerateCount] = useState(1)

  const updateSettings = (patch: Partial<OutputSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }))

  const applyCode = (next: string) => {
    setCode(next)
    setTab("preview")
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
              <CodeEditorPanel code={code} onApply={applyCode} />
            </TabsContent>
            <TabsContent value="preview" className="min-h-0 flex-1 outline-none">
              <LivePreviewPanel code={code} settings={settings} />
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
