"use client"

import * as React from "react"
import * as Remotion from "remotion"
import { transform } from "@babel/standalone"

export type CompileResult =
  | { ok: true; Component: React.ComponentType; name: string }
  | { ok: false; error: string }

// Modules the user code is allowed to import inside the sandbox.
const SANDBOX_MODULES: Record<string, unknown> = {
  react: React,
  "react/jsx-runtime": React,
  remotion: Remotion,
}

function pickComponent(exports: Record<string, unknown>): {
  Component: React.ComponentType
  name: string
} | null {
  // Prefer a conventional named export, then default, then first function export.
  const preferred = ["ClavieraScene", "VibeGraphic", "Main", "MyComposition", "Composition"]
  for (const key of preferred) {
    if (typeof exports[key] === "function") {
      return { Component: exports[key] as React.ComponentType, name: key }
    }
  }
  if (typeof exports.default === "function") {
    return { Component: exports.default as React.ComponentType, name: "default" }
  }
  for (const [key, value] of Object.entries(exports)) {
    if (typeof value === "function") {
      return { Component: value as React.ComponentType, name: key }
    }
  }
  return null
}

export function compileComposition(code: string): CompileResult {
  let transpiled: string
  try {
    const result = transform(code, {
      filename: "composition.tsx",
      presets: [
        ["react", { runtime: "classic" }],
        ["typescript", { isTSX: true, allExtensions: true, onlyRemoveTypeImports: true }],
      ],
      plugins: ["transform-modules-commonjs"],
    })
    transpiled = result.code ?? ""
  } catch (err) {
    return { ok: false, error: `Compile error: ${(err as Error).message}` }
  }

  try {
    const module = { exports: {} as Record<string, unknown> }
    const requireShim = (name: string) => {
      if (name in SANDBOX_MODULES) return SANDBOX_MODULES[name]
      throw new Error(`Module "${name}" is not available in the preview sandbox.`)
    }
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = new Function("require", "module", "exports", "React", transpiled)
    factory(requireShim, module, module.exports, React)

    const picked = pickComponent(module.exports)
    if (!picked) {
      return {
        ok: false,
        error: "No React component export found. Export a component (e.g. `export const ClavieraScene`).",
      }
    }
    return { ok: true, Component: picked.Component, name: picked.name }
  } catch (err) {
    return { ok: false, error: `Runtime error: ${(err as Error).message}` }
  }
}
