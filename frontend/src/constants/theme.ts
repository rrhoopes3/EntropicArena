// Entropic Arena dark theme — reusing DemonBGone's indigo/purple/gold palette

export const colors = {
  bg: "#0a0a1a",
  surface: "#12122a",
  surfaceElevated: "#1a1a3a",
  card: "#16162e",
  primary: "#ffd700",
  primaryDim: "#b8960a",
  accent: "#6b4ce6",
  accentLight: "#8b6ff0",
  text: "#e8e8f0",
  textSecondary: "#9090b0",
  textMuted: "#606080",
  success: "#00e088",
  warning: "#ff9500",
  danger: "#ff3b5c",
  info: "#4ac8ff",
  border: "#2a2a4a",
  // Element colors
  coherence: "#4ac8ff",
  amplitude: "#ff6b6b",
  phase: "#a855f7",
  entropy: "#ff9500",
  topology: "#00e088",
  void: "#6b7280",
  prime: "#ffd700",
} as const;

export const elementColors: Record<string, string> = {
  Coherence: colors.coherence,
  Amplitude: colors.amplitude,
  Phase: colors.phase,
  Entropy: colors.entropy,
  Topology: colors.topology,
  Void: colors.void,
  Prime: colors.prime,
};
