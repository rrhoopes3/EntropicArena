"""Parasite Bestiary — enemy definitions derived from Montalk's paper.

All parasites are entropic entities: STS soliton configurations in the
parent condensate's high-η region. Their stats, attacks, and weaknesses
map directly to the condensate model's physics.

Classification by astral level:
  Tier 1 (Etheric)  — operate at the etheric level, drain vitality
  Tier 2 (Astral)   — operate at the astral level, inject dark signatures
  Tier 3 (Dual)     — operate at both levels simultaneously (bosses)
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional

from creature_engine import Element


class ParasiteTier(Enum):
    ETHERIC = 1   # Low-level, etheric drain only
    ASTRAL = 2    # Mid-level, astral injection
    DUAL = 3      # Boss, full 4-flow parasitic cycle


class AttackType(Enum):
    ETHERIC_DRAIN = "etheric_drain"       # Drains HP (vitality siphon)
    DREAD_INJECTION = "dread_injection"   # Raises target's η temporarily
    DARK_HARVEST = "dark_harvest"         # Steals attack power
    THROAT_CONSTRICT = "throat_constrict" # Reduces speed (bandwidth)
    FEAR_WAVE = "fear_wave"               # AoE dread injection
    SACRIFICE_PULSE = "sacrifice_pulse"   # Heavy damage, heals self
    FOUR_FLOW_CYCLE = "four_flow_cycle"   # Boss: all 4 flows in sequence


@dataclass
class ParasiteAttack:
    """A parasite's attack action."""
    name: str
    attack_type: AttackType
    damage: int         # Base damage
    effect_value: float # η increase for dread, HP drain amount, etc.
    description: str
    cooldown: int = 0   # Turns between uses


@dataclass
class Parasite:
    """An entropic parasite enemy."""
    name: str
    tier: ParasiteTier
    description: str
    lore: str           # Condensate model explanation

    # Stats
    hp: int
    attack: int
    defense: int
    speed: int
    eta: float          # Always high (0.6-0.95) — they ARE high-η

    # Combat
    weakness: Element   # Element they're weak against
    attacks: List[ParasiteAttack] = field(default_factory=list)

    # Rewards
    vortex_reward: int = 10
    xp_reward: int = 25

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "tier": self.tier.value,
            "description": self.description,
            "lore": self.lore,
            "hp": self.hp,
            "attack": self.attack,
            "defense": self.defense,
            "speed": self.speed,
            "eta": self.eta,
            "weakness": self.weakness.value,
            "attacks": [
                {
                    "name": a.name,
                    "type": a.attack_type.value,
                    "damage": a.damage,
                    "effect_value": a.effect_value,
                    "description": a.description,
                }
                for a in self.attacks
            ],
            "vortex_reward": self.vortex_reward,
            "xp_reward": self.xp_reward,
        }


# ---------------------------------------------------------------------------
# The Bestiary
# ---------------------------------------------------------------------------

BESTIARY: Dict[str, Parasite] = {
    # --- Tier 1: Etheric ---

    "etheric_leech": Parasite(
        name="Etheric Leech",
        tier=ParasiteTier.ETHERIC,
        description="A basic etheric parasite that siphons coherent flux from nearby entities.",
        lore="The demon's etheric body passively emits incoherent excitations, elevating local η. The victim experiences biological depletion: fatigue, cold, weakness.",
        hp=120,
        attack=15,
        defense=10,
        speed=20,
        eta=0.75,
        weakness=Element.COHERENCE,
        attacks=[
            ParasiteAttack(
                name="Vitality Siphon",
                attack_type=AttackType.ETHERIC_DRAIN,
                damage=12,
                effect_value=15,
                description="Drains coherent flux from target's etheric body.",
            ),
        ],
        vortex_reward=8,
        xp_reward=20,
    ),

    "cold_spot": Parasite(
        name="Cold Spot",
        tier=ParasiteTier.ETHERIC,
        description="A localized η-elevation zone that manifests as sudden temperature drops.",
        lore="Temperature drops during encounters arise from etheric drain reducing biological heat production.",
        hp=80,
        attack=10,
        defense=20,
        speed=5,
        eta=0.70,
        weakness=Element.AMPLITUDE,
        attacks=[
            ParasiteAttack(
                name="Thermal Drain",
                attack_type=AttackType.ETHERIC_DRAIN,
                damage=8,
                effect_value=10,
                description="Reduces local R-field amplitude, causing cold sensation.",
            ),
        ],
        vortex_reward=5,
        xp_reward=15,
    ),

    # --- Tier 2: Astral ---

    "shadow_projector": Parasite(
        name="Shadow Projector",
        tier=ParasiteTier.ASTRAL,
        description="A mid-level entity that constructs etheric projections from stolen vitality.",
        lore="The demon constructs a field configuration in θ_etheric, giving it spatiotemporal localization. Clairvoyants describe them as dark, shadowy forms.",
        hp=200,
        attack=25,
        defense=15,
        speed=30,
        eta=0.80,
        weakness=Element.PHASE,
        attacks=[
            ParasiteAttack(
                name="Shadow Strike",
                attack_type=AttackType.DARK_HARVEST,
                damage=20,
                effect_value=5,
                description="Attacks from shadow projection, stealing astral energy.",
            ),
            ParasiteAttack(
                name="Dread Whisper",
                attack_type=AttackType.DREAD_INJECTION,
                damage=5,
                effect_value=0.05,
                description="Injects dark astral signatures to raise target's η.",
            ),
        ],
        vortex_reward=15,
        xp_reward=40,
    ),

    "throat_worm": Parasite(
        name="Throat Worm",
        tier=ParasiteTier.ASTRAL,
        description="Constricts the target's throat aperture, reducing bandwidth.",
        lore="The demon actively widens or creates new throat apertures connecting to its native lower-astral region, while constricting the target's upper-chakra connections.",
        hp=180,
        attack=20,
        defense=25,
        speed=15,
        eta=0.78,
        weakness=Element.TOPOLOGY,
        attacks=[
            ParasiteAttack(
                name="Aperture Crush",
                attack_type=AttackType.THROAT_CONSTRICT,
                damage=15,
                effect_value=20,
                description="Constricts throat geometry, reducing G_throat exponentially.",
            ),
            ParasiteAttack(
                name="Bandwidth Drain",
                attack_type=AttackType.ETHERIC_DRAIN,
                damage=18,
                effect_value=10,
                description="Siphons conductance from throat infrastructure.",
            ),
        ],
        vortex_reward=15,
        xp_reward=40,
    ),

    "voice_injector": Parasite(
        name="Voice Injector",
        tier=ParasiteTier.ASTRAL,
        description="Projects auditory dark signatures through compromised throat channels.",
        lore="When the personal throat becomes leaky, parent-level information leaks into awareness. Voices with personality, commands, or commentary are direct registration of the demon's emotional-intentional signature.",
        hp=150,
        attack=30,
        defense=12,
        speed=35,
        eta=0.82,
        weakness=Element.COHERENCE,
        attacks=[
            ParasiteAttack(
                name="Dark Signature Broadcast",
                attack_type=AttackType.DREAD_INJECTION,
                damage=10,
                effect_value=0.08,
                description="Broadcasts fear/malice astral signatures through leaky throat.",
            ),
            ParasiteAttack(
                name="Command Override",
                attack_type=AttackType.DARK_HARVEST,
                damage=25,
                effect_value=8,
                description="Attempts to override target's will via direct astral injection.",
            ),
        ],
        vortex_reward=18,
        xp_reward=45,
    ),

    # --- Tier 3: Dual (Bosses) ---

    "dread_lord": Parasite(
        name="Dread Lord",
        tier=ParasiteTier.DUAL,
        description="A high-level dual-operator that terraforms both etheric and astral levels simultaneously.",
        lore="The demon constructs an integrated self-sustaining feeding system: a demonic stronghold hostile to inhabitants at both levels. Pervasive dread, intrusive thoughts, nightmares, amplified anger.",
        hp=500,
        attack=40,
        defense=35,
        speed=25,
        eta=0.88,
        weakness=Element.VOID,
        attacks=[
            ParasiteAttack(
                name="Fear Wave",
                attack_type=AttackType.FEAR_WAVE,
                damage=15,
                effect_value=0.10,
                description="AoE dread injection affecting all entities in range.",
            ),
            ParasiteAttack(
                name="Dual Terraform",
                attack_type=AttackType.ETHERIC_DRAIN,
                damage=30,
                effect_value=25,
                description="Simultaneously elevates local η and injects dark signatures.",
            ),
            ParasiteAttack(
                name="Chakra Reconfiguration",
                attack_type=AttackType.DARK_HARVEST,
                damage=35,
                effect_value=15,
                description="Stimulates lower chakras, suppresses upper chakras.",
            ),
        ],
        vortex_reward=50,
        xp_reward=150,
    ),

    "soliton_archon": Parasite(
        name="Soliton Archon",
        tier=ParasiteTier.DUAL,
        description="The apex predator. Executes the full four-flow parasitic cycle.",
        lore="The complete accounting of demonic parasitism involves four distinct flows across two levels. Flow 1: etheric drain. Flow 2: sacrifice. Flow 3: dark astral harvest. Flow 4: astral injection. The system is a closed predatory loop.",
        hp=1000,
        attack=55,
        defense=45,
        speed=20,
        eta=0.92,
        weakness=Element.PRIME,
        attacks=[
            ParasiteAttack(
                name="Flow 1: Etheric Drain",
                attack_type=AttackType.ETHERIC_DRAIN,
                damage=25,
                effect_value=30,
                description="Siphons coherent flux from target's etheric body to fuel projection.",
            ),
            ParasiteAttack(
                name="Flow 2: Sacrifice Pulse",
                attack_type=AttackType.SACRIFICE_PULSE,
                damage=60,
                effect_value=40,
                description="Massive damage burst, heals the Archon. Represents forced etheric dissolution.",
                cooldown=3,
            ),
            ParasiteAttack(
                name="Flow 3: Dark Harvest",
                attack_type=AttackType.DARK_HARVEST,
                damage=35,
                effect_value=20,
                description="Harvests dark astral energy from target's fear and pain.",
            ),
            ParasiteAttack(
                name="Flow 4: Astral Injection",
                attack_type=AttackType.DREAD_INJECTION,
                damage=15,
                effect_value=0.15,
                description="Injects demon's native phase patterns into target's chakra system.",
            ),
            ParasiteAttack(
                name="Four-Flow Cycle",
                attack_type=AttackType.FOUR_FLOW_CYCLE,
                damage=40,
                effect_value=0.12,
                description="Executes all four flows in sequence. The self-reinforcing predatory loop.",
                cooldown=4,
            ),
        ],
        vortex_reward=100,
        xp_reward=500,
    ),
}


def get_parasite(name: str) -> Optional[Parasite]:
    return BESTIARY.get(name)


def get_parasites_by_tier(tier: ParasiteTier) -> List[Parasite]:
    return [p for p in BESTIARY.values() if p.tier == tier]


def get_all_parasites() -> List[Parasite]:
    return list(BESTIARY.values())
