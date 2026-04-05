import { useState, useEffect } from "react";
import { getBestiary } from "../services/api";

const TIER_NAMES: Record<number, string> = {
  1: "Tier I \u2014 Etheric",
  2: "Tier II \u2014 Astral",
  3: "Tier III \u2014 Dual (Boss)",
};

const ELEMENT_COLORS: Record<string, string> = {
  Coherence: "var(--el-coherence)",
  Amplitude: "var(--el-amplitude)",
  Phase: "var(--el-phase)",
  Entropy: "var(--el-entropy)",
  Topology: "var(--el-topology)",
  Void: "var(--el-void)",
  Prime: "var(--el-prime)",
};

export default function Bestiary() {
  const [parasites, setParasites] = useState<any[]>([]);

  useEffect(() => {
    getBestiary()
      .then((r) => setParasites(r.parasites))
      .catch(() => {});
  }, []);

  const tiers = [1, 2, 3];

  return (
    <div>
      <div className="bestiary-header">
        <h1 className="bestiary-title">BESTIARY</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>
          Entropic parasites of the nested condensate. Know your enemy.
        </p>
      </div>

      {tiers.map((tier) => {
        const tierParasites = parasites.filter((p) => p.tier === tier);
        if (tierParasites.length === 0) return null;
        return (
          <div key={tier} className="tier-section">
            <div className="tier-label">{TIER_NAMES[tier]}</div>
            {tierParasites.map((p) => (
              <div key={p.name} className="parasite-card glass">
                <div className="parasite-header">
                  <div>
                    <span className="parasite-name">{p.name}</span>
                    <span className="parasite-eta">
                      {"\u03B7"} {p.eta}
                    </span>
                  </div>
                  <div className="parasite-reward">+{p.vortex_reward} $VORTEX</div>
                </div>

                <div className="parasite-desc">{p.description}</div>

                <div className="parasite-stats">
                  <div className="parasite-stat">
                    <div className="parasite-stat-value" style={{ color: "var(--success)" }}>
                      {p.hp}
                    </div>
                    <div className="parasite-stat-label">HP</div>
                  </div>
                  <div className="parasite-stat">
                    <div className="parasite-stat-value" style={{ color: "var(--danger)" }}>
                      {p.attack}
                    </div>
                    <div className="parasite-stat-label">ATK</div>
                  </div>
                  <div className="parasite-stat">
                    <div className="parasite-stat-value" style={{ color: "var(--info)" }}>
                      {p.defense}
                    </div>
                    <div className="parasite-stat-label">DEF</div>
                  </div>
                  <div className="parasite-stat">
                    <div className="parasite-stat-value" style={{ color: "var(--el-phase)" }}>
                      {p.speed}
                    </div>
                    <div className="parasite-stat-label">SPD</div>
                  </div>
                  <div className="parasite-stat">
                    <div
                      className="parasite-stat-value"
                      style={{
                        color: ELEMENT_COLORS[p.weakness] || "var(--warning)",
                      }}
                    >
                      {p.weakness}
                    </div>
                    <div className="parasite-stat-label">Weakness</div>
                  </div>
                </div>

                {p.lore && <div className="parasite-lore">{p.lore}</div>}

                {p.attacks && p.attacks.length > 0 && (
                  <div className="parasite-attacks">
                    {p.attacks.map((a: any, i: number) => (
                      <div key={i} className="parasite-attack">
                        <span className="attack-name">{a.name}</span>
                        <span className="attack-dmg">{a.damage} dmg</span>
                        <span className="attack-desc">{a.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}

      {parasites.length === 0 && <div className="loading">Loading bestiary...</div>}
    </div>
  );
}
