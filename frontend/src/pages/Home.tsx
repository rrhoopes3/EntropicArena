import { useState, useEffect } from "react";
import { EntityCard } from "../components/EntityCard";
import { getEntities, getWallet, mintEntity, getHealth } from "../services/api";
import { colors } from "../constants/theme";

export function Home() {
  const [entities, setEntities] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      const [entRes, walRes, hRes] = await Promise.all([
        getEntities(),
        getWallet(),
        getHealth(),
      ]);
      setEntities(entRes.entities);
      setWallet(walRes);
      setHealth(hRes);
      setError("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleMint = async () => {
    setMinting(true);
    try {
      await mintEntity();
      await refresh();
    } catch (e: any) {
      setError(e.message);
    }
    setMinting(false);
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, color: colors.primary, margin: 0, letterSpacing: 2 }}>
          ENTROPIC ARENA
        </h1>
        <p style={{ color: colors.textSecondary, marginTop: 8 }}>
          Mint soliton entities. Evolve through fusion. Battle entropic parasites.
        </p>
        {health && (
          <p style={{ color: colors.textMuted, fontSize: 12 }}>
            {health.entities_count} entities minted · {health.active_battles} active battles
          </p>
        )}
      </div>

      {/* Wallet */}
      {wallet && (
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: 20,
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
              $VORTEX Balance
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: colors.primary }}>
              {wallet.balance.toFixed(0)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: colors.textMuted }}>
              Earned: {wallet.total_earned.toFixed(0)} · Spent: {wallet.total_spent.toFixed(0)}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: `${colors.danger}20`,
          border: `1px solid ${colors.danger}`,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          color: colors.danger,
        }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
        <button
          onClick={handleMint}
          disabled={minting}
          style={{
            background: colors.primary,
            color: colors.bg,
            border: "none",
            borderRadius: 12,
            padding: "14px 32px",
            fontSize: 16,
            fontWeight: 700,
            cursor: minting ? "wait" : "pointer",
            opacity: minting ? 0.7 : 1,
          }}
        >
          {minting ? "Minting..." : "Mint Entity (25 $VORTEX)"}
        </button>
      </div>

      {/* Entity Grid */}
      <h2 style={{ color: colors.text, fontSize: 20, marginBottom: 16 }}>
        Your Soliton Entities ({entities.length})
      </h2>

      {entities.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: 64,
          color: colors.textMuted,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔮</div>
          <p>No entities yet. Mint your first soliton configuration from the condensate.</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}>
          {entities.map((entity: any) => (
            <EntityCard key={entity.token_id} entity={entity} />
          ))}
        </div>
      )}
    </div>
  );
}
