// API client for Entropic Arena backend

const API_BASE = "http://localhost:5000/api";

async function fetchJSON(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API error");
  }
  return res.json();
}

// Entities
export const mintEntity = (player = "player_1", name = "") =>
  fetchJSON("/mint", { method: "POST", body: JSON.stringify({ player, name }) });

export const getEntities = (player = "player_1") =>
  fetchJSON(`/entities?player=${player}`);

export const getEntity = (tokenId: string) =>
  fetchJSON(`/entity/${tokenId}`);

// Battle
export const startBattle = (entityId: string, parasite: string, player = "player_1") =>
  fetchJSON("/battle/start", {
    method: "POST",
    body: JSON.stringify({ player, entity_id: entityId, parasite }),
  });

export const battleAction = (action: string, player = "player_1") =>
  fetchJSON("/battle/action", {
    method: "POST",
    body: JSON.stringify({ player, action }),
  });

export const getBattleState = (player = "player_1") =>
  fetchJSON(`/battle/state?player=${player}`);

// Evolution
export const previewFusion = (entityA: string, entityB: string) =>
  fetchJSON("/fuse/preview", {
    method: "POST",
    body: JSON.stringify({ entity_a: entityA, entity_b: entityB }),
  });

export const executeFusion = (entityA: string, entityB: string, player = "player_1", name = "") =>
  fetchJSON("/fuse", {
    method: "POST",
    body: JSON.stringify({ player, entity_a: entityA, entity_b: entityB, name }),
  });

// Bestiary
export const getBestiary = (tier?: number) =>
  fetchJSON(`/bestiary${tier ? `?tier=${tier}` : ""}`);

// Wallet
export const getWallet = (player = "player_1") =>
  fetchJSON(`/wallet?player=${player}`);

export const creditWallet = (amount: number, player = "player_1") =>
  fetchJSON("/wallet/credit", {
    method: "POST",
    body: JSON.stringify({ player, amount }),
  });

// Health
export const getHealth = () => fetchJSON("/health");
