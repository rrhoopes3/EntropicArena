import { elementColors, colors } from "../constants/theme";

interface EntityStats {
  defense: number;
  hp: number;
  max_hp: number;
  speed: number;
  attack: number;
  special: number;
  element: string;
  eta: number;
  rarity: string;
  rarity_score: number;
  level: number;
  xp: number;
  power_rating: number;
}

interface Entity {
  token_id: string;
  name: string;
  stats: EntityStats;
  generation: number;
  battle_count: number;
  wins: number;
  losses: number;
  genes: number[];
}

interface Props {
  entity: Entity;
  onClick?: () => void;
  selected?: boolean;
}

const rarityColors: Record<string, string> = {
  Common: "#6b7280",
  Uncommon: "#22c55e",
  Rare: "#3b82f6",
  Epic: "#a855f7",
  Legendary: "#f59e0b",
  Mythic: "#ef4444",
};

export function EntityCard({ entity, onClick, selected }: Props) {
  const { stats } = entity;
  const elColor = elementColors[stats.element] || colors.text;
  const rarColor = rarityColors[stats.rarity] || colors.textMuted;

  return (
    <div
      onClick={onClick}
      style={{
        background: colors.surface,
        border: `2px solid ${selected ? colors.primary : colors.border}`,
        borderRadius: 16,
        padding: 20,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
        minWidth: 280,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{entity.name}</div>
          <div style={{ fontSize: 12, color: rarColor, fontWeight: 600 }}>
            {stats.rarity} · Gen {entity.generation}
          </div>
        </div>
        <div style={{
          background: `${elColor}20`,
          color: elColor,
          padding: "4px 10px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
        }}>
          {stats.element}
        </div>
      </div>

      {/* η and Power */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 200, color: colors.text, fontVariantNumeric: "tabular-nums" }}>
            {stats.eta.toFixed(4)}
          </div>
          <div style={{ fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>η</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.primary }}>
            {stats.power_rating}
          </div>
          <div style={{ fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Power</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 600, color: colors.info }}>
            Lv.{stats.level}
          </div>
          <div style={{ fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Level</div>
        </div>
      </div>

      {/* Stat Bars */}
      {[
        { label: "ATK", value: stats.attack, color: "#ff6b6b" },
        { label: "DEF", value: stats.defense, color: "#4ac8ff" },
        { label: "HP", value: stats.hp, color: "#00e088" },
        { label: "SPD", value: stats.speed, color: "#a855f7" },
        { label: "SPC", value: stats.special, color: "#ffd700" },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: 6, gap: 8 }}>
          <div style={{ width: 30, fontSize: 10, color: colors.textMuted, fontWeight: 600 }}>{label}</div>
          <div style={{ flex: 1, height: 6, background: colors.surfaceElevated, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3 }} />
          </div>
          <div style={{ width: 24, fontSize: 11, color: colors.textSecondary, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            {value}
          </div>
        </div>
      ))}

      {/* Battle record */}
      {entity.battle_count > 0 && (
        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 8, textAlign: "center" }}>
          {entity.wins}W / {entity.losses}L ({entity.battle_count} battles)
        </div>
      )}
    </div>
  );
}
