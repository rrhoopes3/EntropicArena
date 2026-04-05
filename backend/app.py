"""Entropic Arena — Flask API Game Server.

Serves the game backend with REST endpoints for:
  - Minting entities
  - Viewing entity stats
  - Battle (PvE combat against parasites)
  - Evolution (fusion + mutation)
  - Economy (wallet, rewards)
  - Bestiary (parasite encyclopedia)
"""

from __future__ import annotations

import os
import sys
import time

# Add backend dir to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, jsonify, request
from flask_cors import CORS
from typing import Dict

from creature_engine import SolitonEntity, mint_entity
from parasite_bestiary import get_all_parasites, get_parasite, get_parasites_by_tier, ParasiteTier
from combat_engine import start_battle, player_action, enemy_turn, ActionType, BattlePhase
from evolution import evolve, preview_fusion
from economy import PlayerWallet, mint_cost, battle_reward

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# In-memory game state (replace with DB in production)
# ---------------------------------------------------------------------------

entities: Dict[str, SolitonEntity] = {}          # token_id → entity
player_entities: Dict[str, list] = {}             # player_addr → [token_ids]
wallets: Dict[str, PlayerWallet] = {}             # player_addr → wallet
active_battles: Dict[str, object] = {}            # player_addr → BattleState

DEFAULT_PLAYER = "player_1"

# ---------------------------------------------------------------------------
# Genesis Airdrop — free tokens for the first 24 hours
# ---------------------------------------------------------------------------

GENESIS_START = time.time()
GENESIS_WINDOW = 86400       # 24 hours in seconds
GENESIS_AMOUNT = 2000        # free $VORTEX per player
airdrop_claims: Dict[str, bool] = {}  # player_addr → claimed


def get_wallet(player: str) -> PlayerWallet:
    if player not in wallets:
        wallets[player] = PlayerWallet(address=player, balance=500.0)  # Starting balance
    return wallets[player]


# ---------------------------------------------------------------------------
# Routes: Entities
# ---------------------------------------------------------------------------

@app.route("/api/mint", methods=["POST"])
def api_mint():
    """Mint a new soliton entity."""
    data = request.json or {}
    player = data.get("player", DEFAULT_PLAYER)
    name = data.get("name", "")

    wallet = get_wallet(player)
    cost = mint_cost()

    if not wallet.can_afford(cost):
        return jsonify({"error": f"Insufficient $VORTEX. Need {cost}, have {wallet.balance:.0f}"}), 400

    entity = mint_entity(owner=player, name=name)
    entities[entity.token_id] = entity

    if player not in player_entities:
        player_entities[player] = []
    player_entities[player].append(entity.token_id)

    wallet.debit(cost, "mint_entity")

    return jsonify({
        "entity": entity.to_dict(),
        "cost": cost,
        "wallet": wallet.to_dict(),
    })


@app.route("/api/entities", methods=["GET"])
def api_entities():
    """List all entities for a player."""
    player = request.args.get("player", DEFAULT_PLAYER)
    token_ids = player_entities.get(player, [])
    result = [entities[tid].to_dict() for tid in token_ids if tid in entities]
    return jsonify({"entities": result, "count": len(result)})


@app.route("/api/entity/<token_id>", methods=["GET"])
def api_entity(token_id: str):
    """Get a single entity."""
    entity = entities.get(token_id)
    if not entity:
        return jsonify({"error": "Entity not found"}), 404
    return jsonify(entity.to_dict())


# ---------------------------------------------------------------------------
# Routes: Battle
# ---------------------------------------------------------------------------

@app.route("/api/battle/start", methods=["POST"])
def api_battle_start():
    """Start a battle against a parasite."""
    data = request.json or {}
    player = data.get("player", DEFAULT_PLAYER)
    token_id = data.get("entity_id")
    parasite_name = data.get("parasite")

    entity = entities.get(token_id)
    if not entity:
        return jsonify({"error": "Entity not found"}), 404

    parasite = get_parasite(parasite_name)
    if not parasite:
        return jsonify({"error": f"Unknown parasite: {parasite_name}"}), 404

    state = start_battle(entity, parasite)
    active_battles[player] = state

    return jsonify({"battle": state.to_dict()})


@app.route("/api/battle/action", methods=["POST"])
def api_battle_action():
    """Execute a player action in the current battle."""
    data = request.json or {}
    player = data.get("player", DEFAULT_PLAYER)
    action_str = data.get("action", "attack")

    state = active_battles.get(player)
    if not state:
        return jsonify({"error": "No active battle"}), 404

    try:
        action = ActionType(action_str)
    except ValueError:
        return jsonify({"error": f"Invalid action: {action_str}. Options: attack, special, love_burst, detune, guard"}), 400

    # Player turn
    state = player_action(state, action)

    # If battle didn't end, do enemy turn
    if state.phase == BattlePhase.ENEMY_TURN:
        state = enemy_turn(state)

    active_battles[player] = state

    # Handle victory rewards
    if state.phase == BattlePhase.VICTORY:
        wallet = get_wallet(player)
        wallet.credit(state.vortex_earned, "battle_victory")
        entity = state.player_entity
        entity.battle_count += 1
        entity.wins += 1
        entity.stats.xp += state.xp_earned
        # Level up check
        from economy import xp_for_level
        while entity.stats.xp >= xp_for_level(entity.stats.level + 1):
            entity.stats.level += 1
        del active_battles[player]

    elif state.phase == BattlePhase.DEFEAT:
        entity = state.player_entity
        entity.battle_count += 1
        entity.losses += 1
        del active_battles[player]

    return jsonify({
        "battle": state.to_dict(),
        "wallet": get_wallet(player).to_dict(),
    })


@app.route("/api/battle/state", methods=["GET"])
def api_battle_state():
    """Get current battle state."""
    player = request.args.get("player", DEFAULT_PLAYER)
    state = active_battles.get(player)
    if not state:
        return jsonify({"error": "No active battle"}), 404
    return jsonify({"battle": state.to_dict()})


# ---------------------------------------------------------------------------
# Routes: Evolution
# ---------------------------------------------------------------------------

@app.route("/api/fuse/preview", methods=["POST"])
def api_fuse_preview():
    """Preview a fusion without executing it."""
    data = request.json or {}
    token_a = data.get("entity_a")
    token_b = data.get("entity_b")

    entity_a = entities.get(token_a)
    entity_b = entities.get(token_b)
    if not entity_a or not entity_b:
        return jsonify({"error": "Entity not found"}), 404

    preview = preview_fusion(entity_a, entity_b)
    return jsonify(preview)


@app.route("/api/fuse", methods=["POST"])
def api_fuse():
    """Execute a fusion (evolution)."""
    data = request.json or {}
    player = data.get("player", DEFAULT_PLAYER)
    token_a = data.get("entity_a")
    token_b = data.get("entity_b")
    name = data.get("name", "")

    entity_a = entities.get(token_a)
    entity_b = entities.get(token_b)
    if not entity_a or not entity_b:
        return jsonify({"error": "Entity not found"}), 404

    wallet = get_wallet(player)
    result = evolve(entity_a, entity_b, player, name=name)
    if result is None:
        return jsonify({"error": "Fusion failed. Entities may not be active."}), 400

    child, mutated_genes, cost = result

    if not wallet.can_afford(cost):
        return jsonify({"error": f"Insufficient $VORTEX. Need {cost}, have {wallet.balance:.0f}"}), 400

    wallet.debit(cost, "fusion")

    # Register child, remove parents from player's list
    entities[child.token_id] = child
    player_list = player_entities.get(player, [])
    if token_a in player_list:
        player_list.remove(token_a)
    if token_b in player_list:
        player_list.remove(token_b)
    player_list.append(child.token_id)

    return jsonify({
        "child": child.to_dict(),
        "mutated_genes": mutated_genes,
        "cost": cost,
        "wallet": wallet.to_dict(),
        "parents_consumed": [token_a, token_b],
    })


# ---------------------------------------------------------------------------
# Routes: Bestiary
# ---------------------------------------------------------------------------

@app.route("/api/bestiary", methods=["GET"])
def api_bestiary():
    """Get all parasites in the bestiary."""
    tier = request.args.get("tier")
    if tier:
        parasites = get_parasites_by_tier(ParasiteTier(int(tier)))
    else:
        parasites = get_all_parasites()
    return jsonify({"parasites": [p.to_dict() for p in parasites]})


# ---------------------------------------------------------------------------
# Routes: Economy
# ---------------------------------------------------------------------------

@app.route("/api/wallet", methods=["GET"])
def api_wallet():
    """Get player's wallet."""
    player = request.args.get("player", DEFAULT_PLAYER)
    return jsonify(get_wallet(player).to_dict())


@app.route("/api/wallet/credit", methods=["POST"])
def api_wallet_credit():
    """Add VORTEX to wallet (dev/testing)."""
    data = request.json or {}
    player = data.get("player", DEFAULT_PLAYER)
    amount = data.get("amount", 100)
    wallet = get_wallet(player)
    wallet.credit(amount, "dev_credit")
    return jsonify(wallet.to_dict())


# ---------------------------------------------------------------------------
# Routes: Genesis Airdrop
# ---------------------------------------------------------------------------

@app.route("/api/airdrop/status", methods=["GET"])
def api_airdrop_status():
    """Check genesis airdrop status."""
    player = request.args.get("player", DEFAULT_PLAYER)
    elapsed = time.time() - GENESIS_START
    remaining = max(0, GENESIS_WINDOW - elapsed)
    return jsonify({
        "active": remaining > 0,
        "seconds_remaining": round(remaining),
        "claimed": airdrop_claims.get(player, False),
        "amount": GENESIS_AMOUNT,
    })


@app.route("/api/airdrop/claim", methods=["POST"])
def api_airdrop_claim():
    """Claim genesis airdrop tokens."""
    data = request.json or {}
    player = data.get("player", DEFAULT_PLAYER)

    elapsed = time.time() - GENESIS_START
    if elapsed > GENESIS_WINDOW:
        return jsonify({"error": "Genesis window has ended"}), 400

    if airdrop_claims.get(player):
        return jsonify({"error": "Already claimed"}), 400

    wallet = get_wallet(player)
    wallet.credit(GENESIS_AMOUNT, "genesis_airdrop")
    airdrop_claims[player] = True

    return jsonify({
        "success": True,
        "amount": GENESIS_AMOUNT,
        "wallet": wallet.to_dict(),
    })


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def api_health():
    return jsonify({
        "status": "ok",
        "game": "Entropic Arena",
        "version": "0.1.0",
        "entities_count": len(entities),
        "active_battles": len(active_battles),
    })


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 60)
    print("  ENTROPIC ARENA — Game Server")
    print("  Battle entropic parasites. Evolve soliton entities.")
    print("  $VORTEX on Solana: 5joN44mSAdo7DbGgsKnXWagLKc8kEkFfKiTW2szTFASA")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=True)
