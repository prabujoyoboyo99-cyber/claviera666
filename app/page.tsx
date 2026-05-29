"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const Studio = dynamic(() => import("@/components/studio/studio").then((m) => m.Studio), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  ),
})

export default function Page() {
  return <Studio />
}
