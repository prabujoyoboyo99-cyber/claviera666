"use client"

import { useState } from "react"
import { Wand2, Sparkles, ClipboardCheck, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LabeledSelect } from "./labeled-select"
import {
  RESOLUTIONS,
  DURATIONS,
  FRAME_RATES,
  ENTRANCE_STYLES,
  CAMERA_MOVEMENTS,
  PACING,
  COMPLEXITY,
  ART_STYLES,
  TYPOGRAPHY,
  LIGHTING,
  BACKGROUNDS,
  type OutputSettings,
} from "@/lib/studio-options"
import { generateOfflineTemplate, DEFAULT_TEMPLATE, type TemplateSettings } from "@/lib/template-generator"

type Props = {
  settings: OutputSettings
  onApply: (code: string) => void
}

const PLUGINS = ["-- Select Plugin --", "Particle Kit", "Glitch FX", "Liquid Shapes", "Kinetic Grid"]

export function TemplatePanel({ settings, onApply }: Props) {
  const [t, setT] = useState<TemplateSettings>(DEFAULT_TEMPLATE)
  const set = (patch: Partial<TemplateSettings>) => setT((prev) => ({ ...prev, ...patch }))
  const res = RESOLUTIONS[settings.resolutionIndex]

  const generate = () => onApply(generateOfflineTemplate(t))

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-card/40 px-4 py-2.5 text-center text-sm font-semibold text-foreground">
        Custom AI Template
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-2">
          {/* Left column — output mirror */}
          <LabeledSelect
            label="Resolution Ratio"
            value={res.label}
            onValueChange={() => {}}
            options={RESOLUTIONS.map((r) => r.label)}
          />
          <LabeledSelect
            label="Entrance Animation Style"
            value={t.entrance}
            onValueChange={(v) => set({ entrance: v })}
            options={ENTRANCE_STYLES}
          />
          <LabeledSelect
            label="Video Duration"
            value={`${settings.durationSeconds} Seconds`}
            onValueChange={() => {}}
            options={DURATIONS.map((d) => `${d} Seconds`)}
          />
          <LabeledSelect
            label="Camera Movement / Idle"
            value={t.camera}
            onValueChange={(v) => set({ camera: v })}
            options={CAMERA_MOVEMENTS}
          />
          <LabeledSelect
            label="Frame Rate (FPS)"
            value={`${settings.fps} FPS`}
            onValueChange={() => {}}
            options={FRAME_RATES.map((f) => `${f} FPS`)}
          />
          <LabeledSelect
            label="Pacing / Rhythm"
            value={t.pacing}
            onValueChange={(v) => set({ pacing: v })}
            options={PACING}
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Theme (Optional)</label>
            <Input
              value={t.theme}
              onChange={(e) => set({ theme: e.target.value })}
              placeholder="e.g. crypto launch, sports"
              className="h-9 bg-input/60 text-sm"
            />
          </div>
          <LabeledSelect
            label="Complexity Level"
            value={t.complexity}
            onValueChange={(v) => set({ complexity: v })}
            options={COMPLEXITY}
          />
          <LabeledSelect
            label="Art Style / Aesthetic"
            value={t.artStyle}
            onValueChange={(v) => set({ artStyle: v })}
            options={ART_STYLES}
          />
          <LabeledSelect
            label="Typography / Text Style"
            value={t.typography}
            onValueChange={(v) => set({ typography: v })}
            options={TYPOGRAPHY}
          />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Visual Color Palette</label>
            <div className="flex items-center gap-2">
              <Input
                value={t.palette}
                onChange={(e) => set({ palette: e.target.value })}
                placeholder="#22d3ee, #2dd4bf"
                className="h-9 bg-input/60 text-sm"
              />
              <Button
                variant="secondary"
                size="icon"
                className="size-9 shrink-0"
                aria-label="Shuffle palette"
                onClick={() => set({ palette: "" })}
              >
                <Palette className="size-4" />
              </Button>
            </div>
          </div>
          <LabeledSelect
            label="Lighting Effect"
            value={t.lighting}
            onValueChange={(v) => set({ lighting: v })}
            options={LIGHTING}
          />
          <LabeledSelect
            label="Background Setting"
            value={t.background}
            onValueChange={(v) => set({ background: v })}
            options={BACKGROUNDS}
          />
          <LabeledSelect
            label="Load Plugin Template"
            value={t.plugin}
            onValueChange={(v) => set({ plugin: v })}
            options={PLUGINS}
          />
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between gap-3 border-t border-border bg-card/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={generate}>
            <Wand2 className="size-3.5" />
            Generate Offline Template
          </Button>
          <Button size="sm" className="gap-1.5 bg-info text-info-foreground hover:bg-info/90" onClick={generate}>
            <Sparkles className="size-3.5" />
            Generate Template with AI
          </Button>
        </div>
        <Button size="sm" className="gap-1.5 bg-warn text-warn-foreground hover:bg-warn/90" onClick={generate}>
          <ClipboardCheck className="size-3.5" />
          Copy Template &amp; Apply (Generate)
        </Button>
      </div>
    </div>
  )
}
