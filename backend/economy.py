"""$VORTEX Token Economy — pricing, rewards, and staking.

All costs and rewards are denominated in $VORTEX tokens.
Token: Solana SPL, mint 5joN44mSAdo7DbGgsKnXWagLKc8kEkFfKiTW2szTFASA
Total supply: 48,000,000 VORTEX
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict

from creature_engine import Rarity


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VORTEX_MINT = "5joN44mSAdo7DbGgsKnXWagLKc8kEkFfKiTW2szTFASA"
VORTEX_DECIMALS = 9

# Minting costs (base, before rarity modifier)
MINT_COST_BASE = 25  # VORTEX

# Battle rewards
BATTLE_REWARD_MULT = {
    1: 1.0,   # Tier 1 parasites
    2: 2.0,   # Tier 2
    3: 5.0,   # Tier 3 (bosses)
}

# Staking yields (VORTEX per day per entity staked)
STAKING_YIELD = {
    Rarity.COMMON: 0.5,
    Rarity.UNCOMMON: 1.0,
    Rarity.RARE: 2.0,
    Rarity.EPIC: 4.0,
    Rarity.LEGENDARY: 8.0,
    Rarity.MYTHIC: 15.0,
}

# XP required per level
def xp_for_level(level: int) -> int:
    """XP needed to reach the given level."""
    return int(100 * (level ** 1.5))


# ---------------------------------------------------------------------------
# Player Wallet (in-game balance tracker)
# ---------------------------------------------------------------------------

@dataclass
class PlayerWallet:
    """Tracks a player's in-game $VORTEX balance."""
    address: str
    balance: float = 0.0
    total_earned: float = 0.0
    total_spent: float = 0.0

    def credit(self, amount: float, reason: str = "") -> bool:
        self.balance += amount
        self.total_earned += amount
        return True

    def debit(self, amount: float, reason: str = "") -> bool:
        if self.balance < amount:
            return False
        self.balance -= amount
        self.total_spent += amount
        return True

    def can_afford(self, amount: float) -> bool:
        return self.balance >= amount

    def to_dict(self) -> dict:
        return {
            "address": self.address,
            "balance": round(self.balance, 2),
            "total_earned": round(self.total_earned, 2),
            "total_spent": round(self.total_spent, 2),
        }


# ---------------------------------------------------------------------------
# Economy functions
# ---------------------------------------------------------------------------

def mint_cost() -> int:
    """Cost to mint a new entity."""
    return MINT_COST_BASE


def battle_reward(parasite_tier: int, player_level: int = 1) -> int:
    """Calculate battle reward."""
    base = 10
    tier_mult = BATTLE_REWARD_MULT.get(parasite_tier, 1.0)
    level_bonus = 1.0 + player_level * 0.05
    return int(base * tier_mult * level_bonus)


def staking_yield_per_day(rarity: Rarity) -> float:
    """Daily VORTEX yield for staking an entity."""
    return STAKING_YIELD.get(rarity, 0.5)
