"use client"

// Minimal typings for the File System Access API (not in all lib.dom versions).
type FileSystemWritableFileStream = {
  write: (data: Blob | BufferSource | string) => Promise<void>
  close: () => Promise<void>
}
export type DirHandle = {
  name: string
  getFileHandle: (name: string, opts?: { create?: boolean }) => Promise<{
    createWritable: () => Promise<FileSystemWritableFileStream>
  }>
}

type WindowWithFS = Window & {
  showDirectoryPicker?: (opts?: { mode?: "read" | "readwrite" }) => Promise<DirHandle>
}

/** True when the browser supports choosing a real output folder. */
export function supportsDirectoryPicker(): boolean {
  return typeof window !== "undefined" && typeof (window as WindowWithFS).showDirectoryPicker === "function"
}

/** Prompt the user to choose an output folder. Returns null if cancelled/unsupported. */
export async function pickOutputDirectory(): Promise<DirHandle | null> {
  const w = window as WindowWithFS
  if (!w.showDirectoryPicker) return null
  try {
    return await w.showDirectoryPicker({ mode: "readwrite" })
  } catch {
    // user cancelled the picker
    return null
  }
}

/** Write a blob into the chosen folder, or fall back to a browser download. */
export async function saveBlob(blob: Blob, fileName: string, dir: DirHandle | null): Promise<"folder" | "download"> {
  if (dir) {
    try {
      const handle = await dir.getFileHandle(fileName, { create: true })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return "folder"
    } catch {
      // fall through to download if the write fails
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return "download"
}
