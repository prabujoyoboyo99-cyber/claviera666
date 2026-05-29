"use client"

import { FileUp, Sparkles, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LabeledSelect } from "./labeled-select"
import {
  RESOLUTIONS,
  DURATIONS,
  FRAME_RATES,
  RENDER_FORMATS,
  HARDWARE_ACCEL,
  CONCURRENCY,
  type OutputSettings,
} from "@/lib/studio-options"

type Props = {
  settings: OutputSettings
  onChange: (next: Partial<OutputSettings>) => void
  generateCount: number
  onGenerateCountChange: (n: number) => void
}

export function OutputSidebar({ settings, onChange, generateCount, onGenerateCountChange }: Props) {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-sidebar">
      {/* Brand */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight text-foreground">Vibe Motion Pro</h1>
            <p className="text-[11px] leading-tight text-muted-foreground">Motion Graphic Generator</p>
          </div>
        </div>
      </div>

      {/* Language + file pick */}
      <div className="space-y-3 border-b border-border px-5 py-4">
        <LabeledSelect
          label="Language"
          value="English"
          onValueChange={() => {}}
          options={["English", "Bahasa Indonesia", "Español", "日本語"]}
        />
        <Button variant="secondary" size="sm" className="w-full justify-center gap-2">
          <FileUp className="size-4" />
          Select File Manually
        </Button>
      </div>

      {/* Output settings */}
      <ScrollArea className="flex-1">
        <div className="px-5 py-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground">
            <SlidersHorizontal className="size-3.5 text-primary" />
            Output Settings
          </div>
          <div className="space-y-3">
            <LabeledSelect
              label="Remotion Resolution"
              value={RESOLUTIONS[settings.resolutionIndex].label}
              onValueChange={(label) =>
                onChange({ resolutionIndex: RESOLUTIONS.findIndex((r) => r.label === label) })
              }
              options={RESOLUTIONS.map((r) => r.label)}
            />
            <LabeledSelect
              label="Video Duration"
              value={`${settings.durationSeconds} Seconds`}
              onValueChange={(v) => onChange({ durationSeconds: Number.parseInt(v) })}
              options={DURATIONS.map((d) => `${d} Seconds`)}
            />
            <LabeledSelect
              label="Frame Rate (FPS)"
              value={`${settings.fps} FPS`}
              onValueChange={(v) => onChange({ fps: Number.parseInt(v) })}
              options={FRAME_RATES.map((f) => `${f} FPS`)}
            />
            <LabeledSelect
              label="Render Format"
              value={settings.format}
              onValueChange={(v) => onChange({ format: v })}
              options={RENDER_FORMATS}
            />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Video Theme (Optional)
              </label>
              <Input
                value={settings.theme}
                onChange={(e) => onChange({ theme: e.target.value })}
                placeholder="e.g. fintech, neon, retro"
                className="h-9 bg-input/60 text-sm"
              />
            </div>
            <LabeledSelect
              label="Hardware Acceleration (Render)"
              value={settings.hardware}
              onValueChange={(v) => onChange({ hardware: v })}
              options={HARDWARE_ACCEL}
            />
            <LabeledSelect
              label="Render Concurrency (Performance)"
              value={settings.concurrency}
              onValueChange={(v) => onChange({ concurrency: v })}
              options={CONCURRENCY}
            />
          </div>
        </div>
      </ScrollArea>

      {/* Footer generate */}
      <div className="border-t border-border px-5 py-4">
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Generate Count</label>
          <Input
            type="number"
            min={1}
            max={50}
            value={generateCount}
            onChange={(e) => onGenerateCountChange(Math.max(1, Number.parseInt(e.target.value) || 1))}
            className="h-9 w-24 bg-input/60 text-sm"
          />
        </div>
        <Button className="w-full justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Sparkles className="size-4" />
          Generate Typescript
        </Button>
      </div>
    </aside>
  )
}
