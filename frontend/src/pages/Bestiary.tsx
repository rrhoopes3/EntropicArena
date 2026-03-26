import { useState, useEffect } from "react";
import { getBestiary } from "../services/api";
import { colors } from "../constants/theme";

export function Bestiary() {
  const [parasites, setParasites] = useState<any[]>([]);

  useEffect(() => {
    getBestiary().then((res) => setParasites(res.parasites));
  }, []);

  const tierNames: Record<number, string> = {
    1: "Etheric (Tier 1)",
    2: "Astral (Tier 2)",
    3: "Dual — Boss (Tier 3)",
  };

  const grouped = parasites.reduce<Record<number, any[]>>((acc, p) => {
    if (!acc[p.tier]) acc[p.tier] = [];
    acc[p.tier].push(p);
    return acc;
  }, {});

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ color: colors.primary, fontSize: 36, fontWeight: 800, textAlign: "center" }}>
        Parasite Bestiary
      </h1>
      <p style={{ color: colors.textSecondary, textAlign: "center", marginBottom: 32 }}>
        Entropic parasites classified by astral level. Know your enemy.
      </p>

      {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([tier, parasiteList]) => (
        <div key={tier} style={{ marginBottom: 32 }}>
          <h2 style={{ color: colors.danger, fontSize: 18, marginBottom: 12 }}>
            {tierNames[Number(tier)] || `Tier ${tier}`}
          </h2>

          {parasiteList.map((p: any) => (
            <div key={p.name} style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: 20,
              marginBottom: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{p.description}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: colors.danger, fontWeight: 600 }}>η = {p.eta}</div>
                  <div style={{ fontSize: 11, color: colors.success }}>Reward: {p.vortex_reward} $V</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 12 }}>
                <span style={{ color: colors.textMuted }}>HP <span style={{ color: colors.text }}>{p.hp}</span></span>
                <span style={{ color: colors.textMuted }}>ATK <span style={{ color: colors.text }}>{p.attack}</span></span>
                <span style={{ color: colors.textMuted }}>DEF <span style={{ color: colors.text }}>{p.defense}</span></span>
                <span style={{ color: colors.textMuted }}>SPD <span style={{ color: colors.text }}>{p.speed}</span></span>
                <span style={{ color: colors.textMuted }}>Weak: <span style={{ color: colors.warning }}>{p.weakness}</span></span>
              </div>

              {/* Lore */}
              <div style={{
                background: colors.surfaceElevated,
                borderRadius: 8,
                padding: 12,
                fontSize: 12,
                color: colors.textMuted,
                fontStyle: "italic",
                lineHeight: 1.6,
                marginBottom: 12,
              }}>
                {p.lore}
              </div>

              {/* Attacks */}
              <div style={{ fontSize: 12 }}>
                <div style={{ color: colors.textMuted, fontWeight: 600, marginBottom: 4 }}>Attacks:</div>
                {p.attacks.map((a: any, i: number) => (
                  <div key={i} style={{ color: colors.textSecondary, marginBottom: 2 }}>
                    <span style={{ color: colors.danger }}>{a.name}</span>
                    <span style={{ color: colors.textMuted }}> — {a.damage} dmg — </span>
                    <span>{a.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
