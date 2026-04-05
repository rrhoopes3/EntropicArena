import { useState, useEffect } from "react";
import { getAirdropStatus, claimAirdrop } from "../services/api";

export default function AirdropBanner({ onClaim }: { onClaim?: () => void }) {
  const [status, setStatus] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    getAirdropStatus()
      .then((s) => {
        setStatus(s);
        setSecondsLeft(s.seconds_remaining);
      })
      .catch(() => {});
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!status?.active || status.claimed) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (!status?.active && !status?.claimed) return null;

  const hours = Math.floor(secondsLeft / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const handleClaim = async () => {
    setClaiming(true);
    try {
      await claimAirdrop();
      setStatus({ ...status, claimed: true });
      onClaim?.();
    } catch {
      // already claimed or expired
    }
    setClaiming(false);
  };

  return (
    <div className="airdrop-banner">
      <div className="airdrop-label">Genesis Airdrop</div>
      <div className="airdrop-amount">
        Claim <span>{status.amount.toLocaleString()}</span> $VORTEX
      </div>
      {!status.claimed && secondsLeft > 0 && (
        <>
          <div className="airdrop-timer">{timeStr}</div>
          <div className="airdrop-timer-label">remaining</div>
        </>
      )}
      {status.claimed ? (
        <div className="airdrop-claimed">CLAIMED</div>
      ) : (
        <button
          className="airdrop-btn"
          onClick={handleClaim}
          disabled={claiming || secondsLeft <= 0}
        >
          {claiming ? "Claiming..." : "Claim Now"}
        </button>
      )}
    </div>
  );
}
