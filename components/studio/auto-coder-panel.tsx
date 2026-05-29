"use client"

import { Bot } from "lucide-react"

export function AutoCoderPanel() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          <Bot className="size-6" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">Auto Coder</h2>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Mass generation via browser automation (Chrome profiles, reference images, batch loops) is a
          desktop-only capability. It is left out of this web build for now — generate compositions with the
          Custom AI Template tab and refine them in the Code Editor instead.
        </p>
      </div>
    </div>
  )
}
