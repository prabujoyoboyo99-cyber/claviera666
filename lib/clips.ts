import { DEFAULT_CODE } from "./default-code"

export type Clip = {
  id: string
  name: string
  code: string
}

let counter = 0
function uid() {
  counter += 1
  return `clip_${Date.now().toString(36)}_${counter}`
}

export function createClip(name: string, code: string): Clip {
  return { id: uid(), name: sanitizeName(name), code }
}

export function defaultClips(): Clip[] {
  return [createClip("VibeGraphic", DEFAULT_CODE)]
}

/** Strip extension + unsafe chars so a clip name can become a filename. */
export function sanitizeName(raw: string): string {
  const base = raw.replace(/\.[a-z0-9]+$/i, "").trim()
  const safe = base.replace(/[^a-z0-9-_ ]/gi, "").replace(/\s+/g, "_")
  return safe || "clip"
}

/**
 * Turn a set of uploaded files into clips.
 * - .txt / .tsx / .ts / .jsx / .js → one clip per file
 * - a single file may contain multiple compositions separated by a
 *   `// === name ===` style delimiter, which are split into separate clips.
 */
export async function filesToClips(files: FileList | File[]): Promise<Clip[]> {
  const list = Array.from(files)
  const clips: Clip[] = []
  for (const file of list) {
    const text = await file.text()
    const parts = splitMultiCode(text)
    if (parts.length <= 1) {
      clips.push(createClip(file.name, text))
    } else {
      parts.forEach((part, i) => {
        clips.push(createClip(part.name || `${sanitizeName(file.name)}_${i + 1}`, part.code))
      })
    }
  }
  return clips
}

type CodePart = { name: string; code: string }

/** Split a single document into multiple compositions on `// === name ===` markers. */
export function splitMultiCode(text: string): CodePart[] {
  const markerRe = /^[ \t]*\/\/[ \t]*=+[ \t]*(.+?)[ \t]*=+[ \t]*$/gm
  const matches = [...text.matchAll(markerRe)]
  if (matches.length === 0) return [{ name: "", code: text }]

  const parts: CodePart[] = []
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const name = m[1].trim()
    const start = (m.index ?? 0) + m[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index ?? text.length : text.length
    const code = text.slice(start, end).trim()
    if (code) parts.push({ name, code })
  }
  return parts.length ? parts : [{ name: "", code: text }]
}
