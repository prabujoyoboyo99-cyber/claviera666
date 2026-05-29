export type TemplateSettings = {
  entrance: string
  camera: string
  pacing: string
  complexity: string
  artStyle: string
  typography: string
  lighting: string
  background: string
  theme: string
  palette: string
  plugin: string
}

export const DEFAULT_TEMPLATE: TemplateSettings = {
  entrance: "Random",
  camera: "Random",
  pacing: "Random",
  complexity: "Random",
  artStyle: "Random",
  typography: "Random",
  lighting: "Random",
  background: "Normal (Default)",
  theme: "",
  palette: "",
  plugin: "-- Select Plugin --",
}

const PALETTES = [
  ["#7c3aed", "#a855f7", "#22d3ee"],
  ["#06b6d4", "#3b82f6", "#8b5cf6"],
  ["#f59e0b", "#ef4444", "#ec4899"],
  ["#10b981", "#14b8a6", "#06b6d4"],
  ["#f43f5e", "#fb7185", "#fda4af"],
  ["#6366f1", "#818cf8", "#c084fc"],
]

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]
}

// Tiny seeded RNG so output is varied but reproducible enough.
function makeRng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function parsePalette(input: string): string[] | null {
  const found = input.match(/#[0-9a-fA-F]{3,6}/g)
  if (found && found.length >= 2) return found.slice(0, 4)
  return null
}

export function generateOfflineTemplate(t: TemplateSettings): string {
  const rng = makeRng(Date.now() & 0xffffff)
  const palette = parsePalette(t.palette) ?? pick(PALETTES, rng)

  const complexityMap: Record<string, number> = {
    Minimal: 2,
    Moderate: 4,
    Detailed: 7,
    Maximalist: 11,
  }
  const count =
    t.complexity === "Random"
      ? 3 + Math.floor(rng() * 6)
      : (complexityMap[t.complexity] ?? 4)

  const pacingMap: Record<string, number> = {
    "Slow & Cinematic": 0.6,
    Balanced: 1,
    "Fast & Punchy": 1.6,
    "Beat Synced": 1.3,
  }
  const speed = t.pacing === "Random" ? 0.7 + rng() * 1.1 : (pacingMap[t.pacing] ?? 1)

  const dampingMap: Record<string, number> = {
    "Fade In": 200,
    "Slide Up": 14,
    "Zoom Burst": 8,
    "Glitch Reveal": 6,
    Typewriter: 18,
  }
  const damping = t.entrance === "Random" ? 6 + Math.floor(rng() * 14) : (dampingMap[t.entrance] ?? 12)

  const radiusMap: Record<string, number> = {
    "Flat Modern": 12,
    Glassmorphism: 28,
    Neumorphism: 36,
    "Retro 80s": 4,
    Brutalist: 0,
    "3D Isometric": 16,
  }
  const radius = t.artStyle === "Random" ? Math.floor(rng() * 36) : (radiusMap[t.artStyle] ?? 18)

  const glass = t.artStyle === "Glassmorphism"
  const neon = t.lighting === "Neon Glow"
  const fog = t.lighting === "Volumetric Fog"

  const transparentBg = t.background === "Transparent"
  const bg = transparentBg
    ? "transparent"
    : `radial-gradient(circle at ${30 + Math.floor(rng() * 40)}% ${20 + Math.floor(
        rng() * 30,
      )}%, ${palette[0]}55 0%, #150e26 50%, #07050d 100%)`

  const orbit = t.camera === "Orbit"
  const dolly = t.camera === "Dolly Zoom"
  const shake = t.camera === "Handheld Shake"

  // Build element descriptors
  const elements = Array.from({ length: count }).map((_, i) => {
    const size = 80 + Math.floor(rng() * 320)
    const x = Math.floor(rng() * 80) - 40
    const y = Math.floor(rng() * 80) - 40
    const color = pick(palette, rng)
    const rot = Math.floor(rng() * 40) - 20
    const isCircle = rng() > 0.55
    const delay = Math.floor(i * (rng() * 8 + 3))
    return { size, x, y, color, rot, isCircle, delay }
  })

  const elementsJson = JSON.stringify(elements)

  return `import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

// Auto-generated offline template
// Art: ${t.artStyle} · Entrance: ${t.entrance} · Camera: ${t.camera} · Lighting: ${t.lighting}
const ELEMENTS = ${elementsJson};

export const VibeGraphic: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame * ${speed.toFixed(2)};

  const camScale = ${dolly ? "interpolate(frame, [0, 120], [1, 1.25], { extrapolateRight: 'clamp' })" : "1 + Math.sin(t * 0.02) * 0.03"};
  const camRot = ${orbit ? "Math.sin(t * 0.015) * 6" : "Math.sin(t * 0.01) * 2"};
  const shakeX = ${shake ? "Math.sin(t * 0.9) * 6" : "0"};
  const shakeY = ${shake ? "Math.cos(t * 0.7) * 6" : "0"};

  return (
    <div
      style={{
        width,
        height,
        background: '${bg}',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transform: \`scale(\${camScale}) rotate(\${camRot + shakeX * 0.1}deg) translate(\${shakeX}px, \${shakeY}px)\`,
        }}
      >
        {ELEMENTS.map((el, i) => {
          const enter = spring({
            fps,
            frame: frame - el.delay,
            config: { damping: ${damping}, mass: 0.9, stiffness: 110 },
            from: 0,
            to: 1,
          });
          const float = Math.sin((t + i * 30) * 0.04) * 18;
          const driftX = Math.cos((t + i * 20) * 0.03) * 14;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: \`calc(50% + \${el.y}px)\`,
                left: \`calc(50% + \${el.x}px)\`,
                width: el.size,
                height: el.size,
                marginLeft: -el.size / 2,
                marginTop: -el.size / 2,
                borderRadius: el.isCircle ? '50%' : ${radius},
                background: ${glass ? "el.color + '40'" : "el.color"},
                ${glass ? "backdropFilter: 'blur(8px)'," : ""}
                ${glass ? "border: '1px solid rgba(255,255,255,0.18)'," : ""}
                boxShadow: ${neon ? "'0 0 ' + (el.size / 3) + 'px ' + el.color" : fog ? "'0 30px 80px rgba(0,0,0,0.5)'" : "'0 20px 60px ' + el.color + '55'"},
                opacity: enter * ${fog ? "0.85" : "1"},
                transform: \`scale(\${enter}) translate(\${driftX}px, \${float}px) rotate(\${el.rot}deg)\`,
              }}
            />
          );
        })}
        ${fog ? "<div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 60%, transparent 30%, rgba(7,5,13,0.7) 100%)' }} />" : ""}
      </div>
    </div>
  );
};
`
}
