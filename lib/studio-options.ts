export type Resolution = {
  label: string
  width: number
  height: number
}

export const RESOLUTIONS: Resolution[] = [
  { label: "HD (1280x720)", width: 1280, height: 720 },
  { label: "Full HD (1920x1080)", width: 1920, height: 1080 },
  { label: "2K (2560x1440)", width: 2560, height: 1440 },
  { label: "4K (3840x2160)", width: 3840, height: 2160 },
  { label: "Square (1080x1080)", width: 1080, height: 1080 },
  { label: "Vertical (1080x1920)", width: 1080, height: 1920 },
]

export const DURATIONS = [5, 10, 15, 20, 30, 60] // seconds

export const FRAME_RATES = [24, 25, 30, 60]

export const RENDER_FORMATS = ["MP4", "WebM", "GIF"]

export const HARDWARE_ACCEL = ["Auto (Default)", "GPU (NVENC)", "GPU (Apple)", "CPU Only"]

export const CONCURRENCY = ["25%", "50%", "75%", "100%"]

// Custom AI Template dropdown options
export const ENTRANCE_STYLES = ["Random", "Fade In", "Slide Up", "Zoom Burst", "Glitch Reveal", "Typewriter"]
export const CAMERA_MOVEMENTS = ["Random", "Idle Drift", "Dolly Zoom", "Orbit", "Handheld Shake", "Static"]
export const PACING = ["Random", "Slow & Cinematic", "Balanced", "Fast & Punchy", "Beat Synced"]
export const COMPLEXITY = ["Random", "Minimal", "Moderate", "Detailed", "Maximalist"]
export const ART_STYLES = ["Random", "Flat Modern", "Glassmorphism", "Neumorphism", "Retro 80s", "Brutalist", "3D Isometric"]
export const TYPOGRAPHY = ["Random", "Geometric Sans", "Bold Display", "Mono Tech", "Elegant Serif", "Handwritten"]
export const LIGHTING = ["Random", "Soft Ambient", "Neon Glow", "Studio Spotlight", "Volumetric Fog", "High Contrast"]
export const BACKGROUNDS = ["Normal (Default)", "Transparent", "Solid Color", "Animated Gradient", "Particle Field"]

export type OutputSettings = {
  resolutionIndex: number
  durationSeconds: number
  fps: number
  format: string
  theme: string
  hardware: string
  concurrency: string
}

export const DEFAULT_SETTINGS: OutputSettings = {
  resolutionIndex: 2, // 2K
  durationSeconds: 15,
  fps: 30,
  format: "MP4",
  theme: "",
  hardware: "Auto (Default)",
  concurrency: "100%",
}
