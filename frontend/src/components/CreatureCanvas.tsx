import { useRef, useEffect, useCallback } from "react";

// Element → RGB color
const EL_RGB: Record<string, [number, number, number]> = {
  Coherence: [74, 200, 255],
  Amplitude: [255, 107, 107],
  Phase: [168, 85, 247],
  Entropy: [255, 149, 0],
  Topology: [0, 224, 136],
  Void: [128, 144, 170],
  Prime: [255, 215, 0],
};

// Parasite tier → RGB (increasingly menacing reds)
const PARASITE_RGB: Record<number, [number, number, number]> = {
  1: [140, 200, 80],
  2: [160, 60, 200],
  3: [220, 40, 60],
};

const RARITY_PARTICLES: Record<string, number> = {
  Common: 4,
  Uncommon: 7,
  Rare: 10,
  Epic: 14,
  Legendary: 20,
  Mythic: 28,
};

/** Generate deterministic pseudo-genes for parasites from their name */
export function parasiteGenes(name: string): number[] {
  let seed = 0;
  for (let i = 0; i < name.length; i++) {
    seed = ((seed << 5) - seed + name.charCodeAt(i)) | 0;
  }
  const genes: number[] = [];
  for (let i = 0; i < 24; i++) {
    seed = (seed * 1103515245 + 12345) | 0;
    genes.push(Math.abs(seed) % 997);
  }
  return genes;
}

interface Props {
  genes: number[];
  element?: string;
  rarity?: string;
  size?: number;
  isParasite?: boolean;
  tier?: number;
  animState?: "idle" | "attacking" | "hit" | "victory" | "defeat";
}

export default function CreatureCanvas({
  genes,
  element = "Coherence",
  rarity = "Common",
  size = 200,
  isParasite = false,
  tier = 1,
  animState = "idle",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef(0);
  const animRef = useRef(animState);
  animRef.current = animState;

  const g = useCallback((i: number) => genes[i % genes.length] || 0, [genes]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== size * dpr) {
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      ctx.scale(dpr, dpr);
    }

    frameRef.current++;
    const f = frameRef.current;
    const t = f * 0.012;
    const sc = size / 200;
    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Color
    const rgb = isParasite
      ? PARASITE_RGB[tier] || PARASITE_RGB[1]
      : EL_RGB[element] || [124, 92, 231];
    const [cr, cg, cb] = rgb;

    // Gene-derived params
    const vertices = isParasite ? 4 + tier * 2 : 3 + (g(20) % 6);
    const coreSize = (10 + g(4) * 0.02) * sc;
    const shell = (48 + g(0) * 0.025) * sc;
    const orbits = isParasite ? tier : 1 + (g(8) % 3);
    const nodeCount = isParasite ? 2 + tier * 2 : 3 + (g(12) % 5);
    const particles = isParasite ? tier * 5 + 3 : RARITY_PARTICLES[rarity] || 5;

    // Anim modifiers
    const anim = animRef.current;
    let hitFlash = 0;
    let attackPush = 0;
    let scaleBoost = 1;
    if (anim === "hit") {
      hitFlash = Math.sin(f * 0.6) * 0.5 + 0.5;
    }
    if (anim === "attacking") {
      attackPush = Math.sin(f * 0.15) * 8 * sc;
      scaleBoost = 1 + Math.sin(f * 0.15) * 0.06;
    }
    if (anim === "victory") {
      scaleBoost = 1 + Math.sin(t * 2) * 0.08;
    }
    if (anim === "defeat") {
      ctx.globalAlpha = 0.4 + Math.sin(t) * 0.1;
    }

    ctx.save();
    ctx.translate(attackPush, 0);
    ctx.translate(cx, cy);
    ctx.scale(scaleBoost, scaleBoost);
    ctx.translate(-cx, -cy);

    // Hit flash overlay
    if (hitFlash > 0.1) {
      ctx.fillStyle = `rgba(255,255,255,${hitFlash * 0.2})`;
      ctx.fillRect(0, 0, size, size);
    }

    // 1 — Aura
    const auraG = ctx.createRadialGradient(cx, cy, coreSize, cx, cy, shell * 1.8);
    auraG.addColorStop(0, `rgba(${cr},${cg},${cb},${isParasite ? 0.08 : 0.1})`);
    auraG.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = auraG;
    ctx.beginPath();
    ctx.arc(cx, cy, shell * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 2 — Orbital ellipses
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.12)`;
    ctx.lineWidth = sc * 0.8;
    for (let i = 0; i < orbits; i++) {
      const ang = (g(8 + i) / 997) * Math.PI + t * 0.12;
      const rx = shell * (0.65 + i * 0.28);
      const ry = shell * (0.35 + i * 0.18);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3 — Shell outline
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.25)`;
    ctx.lineWidth = 1.2 * sc;
    ctx.beginPath();
    for (let i = 0; i <= vertices; i++) {
      const a = (i / vertices) * Math.PI * 2 + t * 0.06;
      let r: number;
      if (isParasite) {
        r = i % 2 === 0 ? shell : shell * 0.5;
      } else {
        r = shell * (0.88 + Math.sin(t * 0.4 + i * 1.8) * 0.12);
      }
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = `rgba(${cr},${cg},${cb},0.02)`;
    ctx.fill();

    // 4 — Energy lines core → vertices
    ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.15)`;
    ctx.lineWidth = sc * 0.6;
    for (let i = 0; i < vertices; i++) {
      const a = (i / vertices) * Math.PI * 2 + t * 0.06;
      const r = isParasite
        ? i % 2 === 0
          ? shell
          : shell * 0.5
        : shell * (0.88 + Math.sin(t * 0.4 + i * 1.8) * 0.12);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
    }

    // 5 — Orbiting nodes
    for (let i = 0; i < nodeCount; i++) {
      const speed = 0.18 + (i % 3) * 0.12;
      const dir = i % 2 === 0 ? 1 : -1;
      const na = (i / nodeCount) * Math.PI * 2 + t * speed * dir;
      const nr = shell * (0.45 + Math.sin(t * 0.35 + i * 1.7) * 0.25);
      const nx = cx + Math.cos(na) * nr;
      const ny = cy + Math.sin(na) * nr;

      const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 5 * sc);
      ng.addColorStop(0, `rgba(${cr},${cg},${cb},0.75)`);
      ng.addColorStop(0.6, `rgba(${cr},${cg},${cb},0.2)`);
      ng.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ng;
      ctx.beginPath();
      ctx.arc(nx, ny, 5 * sc, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6 — Free particles
    for (let i = 0; i < particles; i++) {
      const speed = 0.06 + (i % 5) * 0.025;
      const dir = i % 2 === 0 ? 1 : -1;
      const pa = (i / particles) * Math.PI * 2 + t * speed * dir;
      const wobble = Math.sin(t * 0.4 + i * 2.1) * 0.2;
      const pr = shell * (0.25 + 0.55 * Math.abs(Math.sin(t * 0.18 + i * 1.3)) + wobble);
      const px = cx + Math.cos(pa) * pr;
      const py = cy + Math.sin(pa) * pr;
      const alpha = 0.2 + Math.sin(t * 0.7 + i * 0.9) * 0.15;

      ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 1.3 * sc, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7 — Core glow
    const cg1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize);
    cg1.addColorStop(0, "rgba(255,255,255,0.85)");
    cg1.addColorStop(0.35, `rgba(${cr},${cg},${cb},0.7)`);
    cg1.addColorStop(0.75, `rgba(${cr},${cg},${cb},0.15)`);
    cg1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cg1;
    ctx.beginPath();
    ctx.arc(cx, cy, coreSize, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright point
    const cg2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreSize * 0.35);
    cg2.addColorStop(0, "rgba(255,255,255,0.9)");
    cg2.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = cg2;
    ctx.beginPath();
    ctx.arc(cx, cy, coreSize * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.globalAlpha = 1;

    rafRef.current = requestAnimationFrame(draw);
  }, [g, element, rarity, size, isParasite, tier]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: "block" }}
    />
  );
}
