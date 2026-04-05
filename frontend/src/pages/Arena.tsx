import { useState, useEffect, useRef, useCallback } from "react";
import {
  getEntities,
  getBestiary,
  startBattle,
  battleAction,
} from "../services/api";
import CreatureCanvas, { parasiteGenes } from "../components/CreatureCanvas";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const EL_COLORS: Record<string, string> = {
  Coherence: "var(--el-coherence)",
  Amplitude: "var(--el-amplitude)",
  Phase: "var(--el-phase)",
  Entropy: "var(--el-entropy)",
  Topology: "var(--el-topology)",
  Void: "var(--el-void)",
  Prime: "var(--el-prime)",
};

type AnimPhase =
  | "idle"
  | "player-attack"
  | "enemy-hit"
  | "enemy-attack"
  | "player-hit";

interface DmgNum {
  id: number;
  value: number;
  side: "player" | "enemy";
}

let dmgCounter = 0;

export default function Arena() {
  const [entities, setEntities] = useState<any[]>([]);
  const [parasites, setParasites] = useState<any[]>([]);
  const [selEntity, setSelEntity] = useState<any>(null);
  const [selParasite, setSelParasite] = useState<any>(null);
  const [battle, setBattle] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [anim, setAnim] = useState<AnimPhase>("idle");
  const [damages, setDamages] = useState<DmgNum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getEntities(), getBestiary()]).then(([e, b]) => {
      setEntities(e.entities);
      setParasites(b.parasites);
    });
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battle?.log]);

  const showDmg = useCallback((value: number, side: "player" | "enemy") => {
    const id = ++dmgCounter;
    setDamages((p) => [...p, { id, value, side }]);
    setTimeout(() => setDamages((p) => p.filter((d) => d.id !== id)), 1400);
  }, []);

  // --- HANDLE ACTION with animation sequence ---
  const handleAction = async (action: string) => {
    if (!battle) return;
    setLoading(true);
    setError("");

    const oldPlayerHP = battle.player.hp;
    const oldEnemyHP = battle.enemy.hp;

    try {
      // Player attack anim
      setAnim("player-attack");
      await wait(250);

      // API call
      const res = await battleAction(action);
      const nb = res.battle;

      // Damage calc
      const playerDmg = oldEnemyHP - (nb.enemy?.hp ?? 0);
      const enemyDmg = oldPlayerHP - (nb.player?.hp ?? 0);

      // Enemy hit
      setAnim("enemy-hit");
      if (playerDmg > 0) showDmg(playerDmg, "enemy");
      await wait(450);

      // Enemy attacks back (if alive and not victory)
      if (
        nb.phase !== "VICTORY" &&
        nb.phase !== "DEFEAT" &&
        enemyDmg > 0
      ) {
        setAnim("enemy-attack");
        await wait(250);
        setAnim("player-hit");
        if (enemyDmg > 0) showDmg(enemyDmg, "player");
        await wait(450);
      } else if (nb.phase === "DEFEAT" && enemyDmg > 0) {
        setAnim("player-hit");
        showDmg(enemyDmg, "player");
        await wait(500);
      }

      // Settle
      setAnim("idle");
      setBattle(nb);
      setWallet(res.wallet);
    } catch (e: any) {
      setError(e.message);
      setAnim("idle");
    }
    setLoading(false);
  };

  const handleStart = async () => {
    if (!selEntity || !selParasite) return;
    setLoading(true);
    setError("");
    const pKey = selParasite.name.toLowerCase().replace(/ /g, "_");
    try {
      const res = await startBattle(selEntity.token_id, pKey);
      setBattle(res.battle);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const resetArena = () => {
    setBattle(null);
    setWallet(null);
    setSelEntity(null);
    setSelParasite(null);
    setAnim("idle");
    setError("");
    getEntities().then((r) => setEntities(r.entities)).catch(() => {});
  };

  // ========= RESULT SCREEN =========
  if (battle && (battle.phase === "VICTORY" || battle.phase === "DEFEAT")) {
    const won = battle.phase === "VICTORY";
    return (
      <div>
        <div className={`battle-result ${won ? "victory" : "defeat"}`}>
          <h2>{won ? "VICTORY" : "DEFEAT"}</h2>

          {/* Show creatures in final state */}
          <div style={{ display: "flex", justifyContent: "center", gap: 60, margin: "20px 0 32px" }}>
            {selEntity && (
              <div className={won ? "creature-victory" : "creature-defeat"}>
                <CreatureCanvas
                  genes={selEntity.genes}
                  element={selEntity.stats.element}
                  rarity={selEntity.stats.rarity}
                  size={160}
                  animState={won ? "victory" : "defeat"}
                />
              </div>
            )}
            {selParasite && (
              <div className={won ? "creature-defeat" : "creature-victory"}>
                <CreatureCanvas
                  genes={parasiteGenes(selParasite.name)}
                  isParasite
                  tier={selParasite.tier}
                  size={160}
                  animState={won ? "defeat" : "victory"}
                />
              </div>
            )}
          </div>

          {won && (
            <div className="reward-display">
              <div className="reward-item">
                <div className="reward-value">+{battle.vortex_earned}</div>
                <div className="reward-label">$VORTEX</div>
              </div>
              <div className="reward-item">
                <div className="reward-value">+{battle.xp_earned}</div>
                <div className="reward-label">XP</div>
              </div>
            </div>
          )}

          <button className="btn btn-primary" onClick={resetArena}>
            Return to Arena
          </button>
        </div>
      </div>
    );
  }

  // ========= BATTLE SCREEN =========
  if (battle) {
    const p = battle.player;
    const e = battle.enemy;
    const pHpPct = (p.hp / p.max_hp) * 100;
    const eHpPct = (e.hp / e.max_hp) * 100;
    const hpClass = pHpPct > 50 ? "healthy" : pHpPct > 20 ? "wounded" : "critical";
    const isPlayerTurn = battle.phase === "PLAYER_TURN";

    // Creature anim states
    const playerCreatureAnim =
      anim === "player-attack" ? "attacking" : anim === "player-hit" ? "hit" : "idle";
    const enemyCreatureAnim =
      anim === "enemy-attack" ? "attacking" : anim === "enemy-hit" ? "hit" : "idle";

    // CSS classes for lunge/shake
    const playerFrameClass =
      anim === "player-attack"
        ? "creature-lunge-right"
        : anim === "player-hit"
          ? "creature-shake"
          : "creature-idle";
    const enemyFrameClass =
      anim === "enemy-attack"
        ? "creature-lunge-left"
        : anim === "enemy-hit"
          ? "creature-shake"
          : "creature-idle";

    return (
      <div>
        <div className="battle-stage" style={{ position: "relative" }}>
          <div className="battle-turn">Turn {battle.turn}</div>

          {/* Floating damage numbers */}
          {damages.map((d) => (
            <div
              key={d.id}
              className={`damage-number on-${d.side}`}
            >
              -{d.value}
            </div>
          ))}

          <div className="combatants">
            {/* Player */}
            <div className="combatant-panel player glass">
              <div className={`creature-frame ${playerFrameClass}`}>
                {selEntity && (
                  <CreatureCanvas
                    genes={selEntity.genes}
                    element={selEntity.stats.element}
                    rarity={selEntity.stats.rarity}
                    size={170}
                    animState={playerCreatureAnim}
                  />
                )}
              </div>
              <div className="combatant-name" style={{ color: "var(--info)" }}>
                {p.name}
              </div>
              <div className="combatant-eta" style={{ color: "var(--info)" }}>
                {"\u03B7"} {typeof p.eta === "number" ? p.eta.toFixed(4) : p.eta}
              </div>
              {p.dread_stacks > 0 && (
                <div className="dread-indicator">DREAD x{p.dread_stacks}</div>
              )}
              <div className="hp-bar-track">
                <div className={`hp-bar-fill ${hpClass}`} style={{ width: `${pHpPct}%` }} />
              </div>
              <div className="hp-text">
                {p.hp} / {p.max_hp}
              </div>
            </div>

            <div className="vs-divider">VS</div>

            {/* Enemy */}
            <div className="combatant-panel enemy glass">
              <div className={`creature-frame ${enemyFrameClass}`}>
                {selParasite && (
                  <CreatureCanvas
                    genes={parasiteGenes(selParasite.name)}
                    isParasite
                    tier={selParasite.tier}
                    size={170}
                    animState={enemyCreatureAnim}
                  />
                )}
              </div>
              <div className="combatant-name" style={{ color: "var(--danger)" }}>
                {e.name}
              </div>
              <div className="combatant-eta" style={{ color: "var(--danger)" }}>
                {"\u03B7"} {typeof e.eta === "number" ? e.eta.toFixed(4) : e.eta}
              </div>
              <div className="hp-bar-track">
                <div className="hp-bar-fill enemy-bar" style={{ width: `${eHpPct}%` }} />
              </div>
              <div className="hp-text">
                {e.hp} / {e.max_hp}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isPlayerTurn && (
          <div className="action-bar">
            {[
              { action: "attack", cls: "attack", label: "Attack" },
              { action: "special", cls: "special", label: "Special" },
              { action: "love_burst", cls: "love", label: "Love Burst" },
              { action: "detune", cls: "detune", label: "Detune" },
              { action: "guard", cls: "guard", label: "Guard" },
            ].map(({ action, cls, label }) => (
              <button
                key={action}
                className={`action-btn ${cls}`}
                onClick={() => handleAction(action)}
                disabled={loading}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {!isPlayerTurn && !loading && (
          <div className="loading">Enemy turn...</div>
        )}
        {loading && anim !== "idle" && (
          <div style={{ textAlign: "center", margin: "16px 0", fontFamily: "var(--font-display)", fontSize: 11, letterSpacing: "2px", color: "var(--text-muted)" }}>
            ...
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        {/* Compact combat log */}
        <div className="combat-log-compact glass" ref={logRef}>
          {battle.log.map((entry: any, i: number) => (
            <div
              key={i}
              className={`log-entry ${
                entry.actor === "player"
                  ? "player-action"
                  : entry.actor === "system"
                    ? "system-action"
                    : "enemy-action"
              }`}
            >
              {entry.damage > 0 && (
                <span className="log-damage">{entry.damage} dmg</span>
              )}
              {entry.effect && (
                <>
                  {entry.damage > 0 ? " — " : ""}
                  <span className="log-effect">{entry.effect}</span>
                </>
              )}
              {entry.flavor_text && (
                <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>
                  {entry.flavor_text}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ========= SELECTION SCREEN =========
  return (
    <div>
      <div className="arena-header">
        <h1 className="arena-title">ARENA</h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 8, fontSize: 14 }}>
          Choose your entity and face an entropic parasite
        </p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="select-grid">
        {/* Entity Selection */}
        <div className="select-panel glass">
          <h3>Your Entity</h3>
          {entities.length === 0 ? (
            <div style={{ color: "var(--text-muted)", padding: 20, textAlign: "center", fontSize: 13 }}>
              No entities. Mint one first.
            </div>
          ) : (
            entities.map((e) => (
              <div
                key={e.token_id}
                className={`select-option ${selEntity?.token_id === e.token_id ? "selected" : ""}`}
                onClick={() => setSelEntity(e)}
                style={{ display: "flex", gap: 12, alignItems: "center" }}
              >
                <CreatureCanvas
                  genes={e.genes}
                  element={e.stats.element}
                  rarity={e.stats.rarity}
                  size={52}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-secondary)",
                      display: "flex",
                      gap: 10,
                      fontFamily: "var(--font-display)",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <span style={{ color: EL_COLORS[e.stats.element] }}>{e.stats.element}</span>
                    <span>{"\u03B7"} {e.stats.eta.toFixed(3)}</span>
                    <span>PWR {e.stats.power_rating}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Parasite Selection */}
        <div className="select-panel glass">
          <h3>Opponent</h3>
          {parasites.map((p) => (
            <div
              key={p.name}
              className={`select-option ${selParasite?.name === p.name ? "selected-enemy" : ""}`}
              onClick={() => setSelParasite(p)}
              style={{ display: "flex", gap: 12, alignItems: "center" }}
            >
              <CreatureCanvas
                genes={parasiteGenes(p.name)}
                isParasite
                tier={p.tier}
                size={52}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontWeight: 700, color: "var(--danger)", fontSize: 14 }}>{p.name}</span>
                  <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "var(--font-display)", letterSpacing: "1px" }}>
                    T{p.tier}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", display: "flex", gap: 10, fontFamily: "var(--font-display)", letterSpacing: "0.5px" }}>
                  <span>{"\u03B7"} {p.eta}</span>
                  <span>HP {p.hp}</span>
                  <span style={{ color: "var(--warning)" }}>{p.weakness}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview selected matchup */}
      {selEntity && selParasite && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 40, margin: "24px 0 8px" }}>
          <CreatureCanvas
            genes={selEntity.genes}
            element={selEntity.stats.element}
            rarity={selEntity.stats.rarity}
            size={120}
          />
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--text-muted)", letterSpacing: "4px" }}>VS</div>
          <CreatureCanvas
            genes={parasiteGenes(selParasite.name)}
            isParasite
            tier={selParasite.tier}
            size={120}
          />
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button
          className="btn btn-danger"
          onClick={handleStart}
          disabled={!selEntity || !selParasite || loading}
          style={{ padding: "16px 48px", fontSize: 13, letterSpacing: "3px" }}
        >
          {loading ? "Entering..." : "Enter Battle"}
        </button>
      </div>
    </div>
  );
}
