import type { CSSProperties } from "react";
import CreatureCanvas from "./CreatureCanvas";

const ELEMENT_COLORS: Record<string, string> = {
  Coherence: "var(--el-coherence)",
  Amplitude: "var(--el-amplitude)",
  Phase: "var(--el-phase)",
  Entropy: "var(--el-entropy)",
  Topology: "var(--el-topology)",
  Void: "var(--el-void)",
  Prime: "var(--el-prime)",
};

const RARITY_COLORS: Record<string, string> = {
  Common: "#7a7a9a",
  Uncommon: "#00e088",
  Rare: "#4ac8ff",
  Epic: "#a855f7",
  Legendary: "#ff9500",
  Mythic: "#ff3860",
};

const STAT_COLORS: Record<string, string> = {
  ATK: "var(--danger)",
  DEF: "var(--info)",
  HP: "var(--success)",
  SPD: "var(--el-phase)",
  SPC: "var(--gold)",
};

interface Props {
  entity: any;
  onClick?: () => void;
  selected?: boolean;
}

export default function EntityCard({ entity, onClick, selected }: Props) {
  const s = entity.stats;
  const elColor = ELEMENT_COLORS[s.element] || "var(--accent)";
  const rarColor = RARITY_COLORS[s.rarity] || "var(--text-muted)";
  const rarityClass = `rarity-${s.rarity.toLowerCase()}`;

  const stats = [
    { label: "ATK", value: s.attack },
    { label: "DEF", value: s.defense },
    { label: "HP", value: s.hp },
    { label: "SPD", value: s.speed },
    { label: "SPC", value: s.special },
  ];

  return (
    <div
      className={`entity-card ${rarityClass} ${selected ? "selected" : ""}`}
      style={{ "--element-color": elColor, "--rarity-color": rarColor } as CSSProperties}
      onClick={onClick}
    >
      {/* Creature Portrait */}
      <div className="creature-frame">
        <CreatureCanvas
          genes={entity.genes}
          element={s.element}
          rarity={s.rarity}
          size={130}
        />
      </div>

      {/* Name + Badges */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div className="entity-name">{entity.name}</div>
        <div className="entity-meta" style={{ justifyContent: "center" }}>
          <span className="badge badge-element" style={{ "--element-color": elColor } as CSSProperties}>
            {s.element}
          </span>
          <span className="badge badge-rarity" style={{ "--rarity-color": rarColor } as CSSProperties}>
            {s.rarity}
          </span>
          {entity.generation > 0 && <span className="badge">Gen {entity.generation}</span>}
        </div>
      </div>

      {/* Key Stats */}
      <div className="entity-key-stats">
        <div className="key-stat">
          <div className="key-stat-value" style={{ color: elColor }}>{s.eta.toFixed(4)}</div>
          <div className="key-stat-label">eta</div>
        </div>
        <div className="key-stat">
          <div className="key-stat-value">{s.power_rating}</div>
          <div className="key-stat-label">Power</div>
        </div>
        <div className="key-stat">
          <div className="key-stat-value" style={{ color: "var(--gold)" }}>{s.level}</div>
          <div className="key-stat-label">Level</div>
        </div>
      </div>

      {/* Stat Bars */}
      {stats.map((stat) => (
        <div className="stat-row" key={stat.label}>
          <span className="stat-label">{stat.label}</span>
          <div className="stat-bar-track">
            <div
              className="stat-bar-fill"
              style={{ width: `${stat.value}%`, "--stat-color": STAT_COLORS[stat.label] } as CSSProperties}
            />
          </div>
          <span className="stat-value">{stat.value}</span>
        </div>
      ))}

      {/* Battle Record */}
      {entity.battle_count > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)", textAlign: "center", fontFamily: "var(--font-display)", letterSpacing: "1px" }}>
          <span style={{ color: "var(--success)" }}>{entity.wins}W</span>
          {" / "}
          <span style={{ color: "var(--danger)" }}>{entity.losses}L</span>
        </div>
      )}
    </div>
  );
}
