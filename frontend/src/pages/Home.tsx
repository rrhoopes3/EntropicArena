import { useState, useEffect } from "react";
import EntityCard from "../components/EntityCard";
import AirdropBanner from "../components/AirdropBanner";
import { getEntities, getWallet, mintEntity, getHealth } from "../services/api";

export default function Home() {
  const [entities, setEntities] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState("");

  const loadData = () => {
    Promise.all([getEntities(), getWallet(), getHealth()])
      .then(([e, w, h]) => {
        setEntities(e.entities);
        setWallet(w);
        setHealth(h);
        setError("");
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMint = async () => {
    setMinting(true);
    setError("");
    try {
      await mintEntity();
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
    setMinting(false);
  };

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <h1 className="hero-title">ENTROPIC ARENA</h1>
        <p className="hero-subtitle">
          Mint soliton entities from the quantum condensate. Evolve through
          topological fusion. Battle entropic parasites in the arena.
        </p>
        {health && (
          <div className="status-bar">
            <span>
              <span className="status-dot" />
              ONLINE
            </span>
            <span>{health.entities_count} entities minted</span>
            <span>{health.active_battles} active battles</span>
          </div>
        )}
      </div>

      {/* Genesis Airdrop */}
      <AirdropBanner onClaim={loadData} />

      {/* Wallet */}
      {wallet && (
        <div className="wallet-panel glass">
          <div>
            <div className="wallet-balance">
              {wallet.balance.toFixed(0)}
              <small> $VORTEX</small>
            </div>
          </div>
          <div className="wallet-stat">
            <div className="wallet-stat-value" style={{ color: "var(--success)" }}>
              +{wallet.total_earned.toFixed(0)}
            </div>
            <div className="wallet-stat-label">Earned</div>
          </div>
          <div className="wallet-stat">
            <div className="wallet-stat-value" style={{ color: "var(--danger)" }}>
              -{wallet.total_spent.toFixed(0)}
            </div>
            <div className="wallet-stat-label">Spent</div>
          </div>
        </div>
      )}

      {/* Mint */}
      <div style={{ textAlign: "center", margin: "28px 0" }}>
        <button className="btn btn-gold" onClick={handleMint} disabled={minting}>
          {minting ? "Minting..." : "Mint Entity \u2014 25 $VORTEX"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Entity Grid */}
      {entities.length > 0 ? (
        <>
          <div className="section-header">
            <span className="section-title">Your Entities</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {entities.length} owned
            </span>
          </div>
          <div className="entity-grid">
            {entities.map((e: any) => (
              <EntityCard key={e.token_id} entity={e} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">&#9671;</div>
          <div className="empty-state-text">
            No entities yet. Mint your first soliton entity from the quantum
            condensate to begin your journey.
          </div>
        </div>
      )}
    </div>
  );
}
