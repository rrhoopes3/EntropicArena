import { useState, useEffect } from "react";
import { getEntities, getBestiary, startBattle, battleAction } from "../services/api";
import { colors } from "../constants/theme";

export function Arena() {
  const [entities, setEntities] = useState<any[]>([]);
  const [parasites, setParasites] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [selectedParasite, setSelectedParasite] = useState<string>("");
  const [battle, setBattle] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([getEntities(), getBestiary()]).then(([e, b]) => {
      setEntities(e.entities);
      setParasites(b.parasites);
    });
  }, []);

  const handleStartBattle = async () => {
    if (!selectedEntity || !selectedParasite) return;
    setLoading(true);
    try {
      const res = await startBattle(selectedEntity, selectedParasite);
      setBattle(res.battle);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      const res = await battleAction(action);
      setBattle(res.battle);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  // Pre-battle: selection screen
  if (!battle) {
    return (
      <div style={{ padding: 32, maxWidth: 1000, margin: "0 auto" }}>
        <h1 style={{ color: colors.primary, fontSize: 36, fontWeight: 800, textAlign: "center" }}>
          ENTROPIC ARENA
        </h1>
        <p style={{ color: colors.textSecondary, textAlign: "center", marginBottom: 32 }}>
          Choose your entity and face an entropic parasite.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
          {/* Entity Selection */}
          <div>
            <h3 style={{ color: colors.text, marginBottom: 12 }}>Your Entity</h3>
            {entities.map((e: any) => (
              <div
                key={e.token_id}
                onClick={() => setSelectedEntity(e.token_id)}
                style={{
                  background: selectedEntity === e.token_id ? `${colors.primary}20` : colors.surface,
                  border: `2px solid ${selectedEntity === e.token_id ? colors.primary : colors.border}`,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <div style={{ color: colors.text, fontWeight: 600 }}>{e.name}</div>
                <div style={{ color: colors.textMuted, fontSize: 12 }}>
                  η={e.stats.eta.toFixed(4)} · {e.stats.element} · Power {e.stats.power_rating}
                </div>
              </div>
            ))}
            {entities.length === 0 && (
              <p style={{ color: colors.textMuted }}>No entities. Mint one first!</p>
            )}
          </div>

          {/* Parasite Selection */}
          <div>
            <h3 style={{ color: colors.text, marginBottom: 12 }}>Opponent</h3>
            {parasites.map((p: any) => (
              <div
                key={p.name}
                onClick={() => setSelectedParasite(p.name.toLowerCase().replace(/ /g, "_"))}
                style={{
                  background: selectedParasite === p.name.toLowerCase().replace(/ /g, "_") ? `${colors.danger}20` : colors.surface,
                  border: `2px solid ${selectedParasite === p.name.toLowerCase().replace(/ /g, "_") ? colors.danger : colors.border}`,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 8,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ color: colors.text, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ color: colors.danger, fontSize: 12, fontWeight: 700 }}>
                    Tier {p.tier}
                  </div>
                </div>
                <div style={{ color: colors.textMuted, fontSize: 12 }}>
                  η={p.eta} · HP {p.hp} · Weak: {p.weakness}
                </div>
                <div style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                  {p.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button
            onClick={handleStartBattle}
            disabled={!selectedEntity || !selectedParasite || loading}
            style={{
              background: selectedEntity && selectedParasite ? colors.danger : colors.surfaceElevated,
              color: colors.text,
              border: "none",
              borderRadius: 12,
              padding: "16px 48px",
              fontSize: 18,
              fontWeight: 700,
              cursor: selectedEntity && selectedParasite ? "pointer" : "not-allowed",
            }}
          >
            {loading ? "Entering Arena..." : "ENTER THE ARENA"}
          </button>
        </div>
      </div>
    );
  }

  // Active battle
  const isOver = battle.phase === "VICTORY" || battle.phase === "DEFEAT";
  const isPlayerTurn = battle.phase === "PLAYER_TURN";

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ color: colors.primary, textAlign: "center", marginBottom: 24 }}>
        {isOver ? (battle.phase === "VICTORY" ? "VICTORY" : "DEFEAT") : `Turn ${battle.turn}`}
      </h2>

      {/* Combatant Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, marginBottom: 32 }}>
        {/* Player */}
        <div style={{ background: colors.surface, borderRadius: 16, padding: 20, border: `1px solid ${colors.border}` }}>
          <div style={{ color: colors.text, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{battle.player.name}</div>
          <div style={{ color: colors.info, fontSize: 12, marginBottom: 8 }}>η = {battle.player.eta}</div>
          <div style={{ background: colors.surfaceElevated, borderRadius: 6, height: 12, overflow: "hidden", marginBottom: 4 }}>
            <div style={{
              width: `${(battle.player.hp / battle.player.max_hp) * 100}%`,
              height: "100%",
              background: battle.player.hp / battle.player.max_hp > 0.5 ? colors.success : colors.danger,
              borderRadius: 6,
              transition: "width 0.3s",
            }} />
          </div>
          <div style={{ color: colors.textMuted, fontSize: 12 }}>
            HP: {battle.player.hp} / {battle.player.max_hp}
          </div>
          {battle.player.dread_stacks > 0 && (
            <div style={{ color: colors.warning, fontSize: 12, marginTop: 4 }}>
              Dread x{battle.player.dread_stacks}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", color: colors.textMuted, fontSize: 32 }}>VS</div>

        {/* Enemy */}
        <div style={{ background: colors.surface, borderRadius: 16, padding: 20, border: `1px solid ${colors.danger}40` }}>
          <div style={{ color: colors.danger, fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{battle.enemy.name}</div>
          <div style={{ color: colors.danger, fontSize: 12, marginBottom: 8, opacity: 0.7 }}>η = {battle.enemy.eta}</div>
          <div style={{ background: colors.surfaceElevated, borderRadius: 6, height: 12, overflow: "hidden", marginBottom: 4 }}>
            <div style={{
              width: `${(battle.enemy.hp / battle.enemy.max_hp) * 100}%`,
              height: "100%",
              background: colors.danger,
              borderRadius: 6,
              transition: "width 0.3s",
            }} />
          </div>
          <div style={{ color: colors.textMuted, fontSize: 12 }}>
            HP: {battle.enemy.hp} / {battle.enemy.max_hp}
          </div>
        </div>
      </div>

      {/* Actions */}
      {isPlayerTurn && !isOver && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
          {[
            { action: "attack", label: "Attack", color: colors.danger },
            { action: "special", label: "Special", color: colors.accent },
            { action: "love_burst", label: "Love Burst", color: "#ff69b4" },
            { action: "detune", label: "Detune", color: colors.primary },
            { action: "guard", label: "Guard", color: colors.info },
          ].map(({ action, label, color }) => (
            <button
              key={action}
              onClick={() => handleAction(action)}
              disabled={loading}
              style={{
                background: `${color}20`,
                color,
                border: `1px solid ${color}40`,
                borderRadius: 10,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Victory/Defeat */}
      {isOver && (
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          {battle.phase === "VICTORY" && (
            <div style={{ color: colors.success, fontSize: 18, marginBottom: 8 }}>
              +{battle.vortex_earned} $VORTEX · +{battle.xp_earned} XP
            </div>
          )}
          <button
            onClick={() => setBattle(null)}
            style={{
              background: colors.primary,
              color: colors.bg,
              border: "none",
              borderRadius: 12,
              padding: "14px 32px",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Return to Arena
          </button>
        </div>
      )}

      {/* Combat Log */}
      <div style={{ background: colors.surface, borderRadius: 16, padding: 20, border: `1px solid ${colors.border}` }}>
        <h3 style={{ color: colors.text, marginBottom: 12, fontSize: 14 }}>Combat Log</h3>
        <div style={{ maxHeight: 300, overflow: "auto" }}>
          {[...battle.log].reverse().map((entry: any, i: number) => (
            <div key={i} style={{
              padding: "8px 0",
              borderBottom: `1px solid ${colors.border}`,
              fontSize: 13,
            }}>
              <div style={{ color: colors.textSecondary }}>
                <span style={{ color: entry.actor === "system" ? colors.primary : colors.text, fontWeight: 600 }}>
                  {entry.actor}
                </span>
                {entry.damage > 0 && (
                  <span style={{ color: colors.danger, marginLeft: 8 }}>-{entry.damage} HP</span>
                )}
                {entry.effect && (
                  <span style={{ color: colors.textMuted, marginLeft: 8, fontSize: 11 }}>{entry.effect}</span>
                )}
              </div>
              <div style={{ color: colors.textMuted, fontSize: 11, fontStyle: "italic", marginTop: 2 }}>
                {entry.flavor_text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
