"use client"

import { useEffect, useState } from "react"
import Editor from "@monaco-editor/react"
import { Trash2, Save, FileText, Rocket, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  code: string
  onApply: (code: string) => void
}

export function CodeEditorPanel({ code, onApply }: Props) {
  const [draft, setDraft] = useState(code)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setDraft(code)
  }, [code])

  const dirty = draft !== code

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card/40 px-4 py-2.5">
        <span className="text-sm font-semibold text-warn">Total : 1 Video</span>
        <div className="flex items-center gap-2">
          <Button variant="destructive" size="sm" className="gap-1.5">
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
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t border-border bg-card/50 px-4 py-2.5">
        <Button variant="secondary" size="sm" className="gap-1.5">
          <FileText className="size-3.5" />
          Import Multi-Code (.txt)
        </Button>
        <Button size="sm" className="gap-1.5 bg-warn text-warn-foreground hover:bg-warn/90">
          <Rocket className="size-3.5" />
          Render All (Auto-Heal Enabled)
        </Button>
      </div>
    </div>
  )
}
