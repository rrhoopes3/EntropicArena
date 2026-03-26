"""Creature Engine — maps VRC-48 topological NFTs to game entities.

Each soliton entity's stats, element, rarity, and abilities are derived
deterministically from its 48D topological fingerprint (24 wrapping numbers).

The 24 genes are grouped into 6 trait categories (4 genes each), matching
the condensate model's multi-level architecture:

  Coherence  (genes 0-3)   → Defense (phase alignment, decoherence resistance)
  Amplitude  (genes 4-7)   → HP / Vitality (R-field strength)
  Conductance (genes 8-11) → Speed / Initiative (throat bandwidth)
  Phase Power (genes 12-15)→ Attack (astral projection strength)
  Spectral   (genes 16-19) → Element / Type (chakra alignment)
  Topology   (genes 20-23) → Special abilities (dimensional complexity)
"""

from __future__ import annotations

import math
import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple

from vortexchain.nft import TopoNFT, TopologicalFingerprint, fuse_nfts
from vortexchain.manifold import TopologicalManifold, WrappingNumber

# ---------------------------------------------------------------------------
# Gene groups
# ---------------------------------------------------------------------------

GENE_GROUPS: Dict[str, List[int]] = {
    "coherence": [0, 1, 2, 3],
    "amplitude": [4, 5, 6, 7],
    "conductance": [8, 9, 10, 11],
    "phase_power": [12, 13, 14, 15],
    "spectral": [16, 17, 18, 19],
    "topology": [20, 21, 22, 23],
}

STAT_NAMES: Dict[str, str] = {
    "coherence": "Defense",
    "amplitude": "HP",
    "conductance": "Speed",
    "phase_power": "Attack",
    "spectral": "Element",
    "topology": "Special",
}

# ---------------------------------------------------------------------------
# Elements (7, matching OAM qudit dimension d=7)
# ---------------------------------------------------------------------------

class Element(Enum):
    COHERENCE = "Coherence"    # Pure phase alignment — strong vs Entropy
    AMPLITUDE = "Amplitude"    # Raw field strength — strong vs Void
    PHASE = "Phase"            # Temporal manipulation — strong vs Topology
    ENTROPY = "Entropy"        # Chaos wielder — strong vs Amplitude
    TOPOLOGY = "Topology"      # Dimensional bender — strong vs Coherence
    VOID = "Void"              # Absence/negation — strong vs Phase
    PRIME = "Prime"            # Prime Mover aligned — no weakness, rare

# Element advantage wheel
ELEMENT_ADVANTAGE: Dict[Element, Element] = {
    Element.COHERENCE: Element.ENTROPY,
    Element.AMPLITUDE: Element.VOID,
    Element.PHASE: Element.TOPOLOGY,
    Element.ENTROPY: Element.AMPLITUDE,
    Element.TOPOLOGY: Element.COHERENCE,
    Element.VOID: Element.PHASE,
    # Prime has no specific advantage — balanced
}

ELEMENT_LIST = list(Element)

# ---------------------------------------------------------------------------
# Rarity tiers
# ---------------------------------------------------------------------------

class Rarity(Enum):
    COMMON = "Common"
    UNCOMMON = "Uncommon"
    RARE = "Rare"
    EPIC = "Epic"
    LEGENDARY = "Legendary"
    MYTHIC = "Mythic"  # Only from fusion of two Legendaries

def rarity_from_score(score: float) -> Rarity:
    """Map topological rarity score (0-1) to a tier."""
    if score >= 0.95:
        return Rarity.MYTHIC
    elif score >= 0.85:
        return Rarity.LEGENDARY
    elif score >= 0.70:
        return Rarity.EPIC
    elif score >= 0.50:
        return Rarity.RARE
    elif score >= 0.30:
        return Rarity.UNCOMMON
    return Rarity.COMMON

# ---------------------------------------------------------------------------
# Entity Stats
# ---------------------------------------------------------------------------

@dataclass
class EntityStats:
    """Combat-ready stats derived from VRC-48 genes."""
    defense: int       # 1-100, from coherence genes
    hp: int            # 1-100 (scaled to actual HP in combat)
    speed: int         # 1-100, determines turn order
    attack: int        # 1-100, base damage output
    special: int       # 1-100, ability power
    element: Element
    eta: float         # 0.0-1.0, lower = more powerful
    rarity: Rarity
    rarity_score: float
    level: int = 1
    xp: int = 0

    @property
    def max_hp(self) -> int:
        """Actual HP pool used in combat."""
        return 50 + self.hp * 5 + self.level * 10  # 60-610 base

    @property
    def power_rating(self) -> int:
        """Overall power estimate."""
        base = self.defense + self.hp + self.speed + self.attack + self.special
        eta_bonus = (1 - self.eta) * 100  # Low η = big bonus
        return round(base + eta_bonus)


# ---------------------------------------------------------------------------
# Soliton Entity
# ---------------------------------------------------------------------------

@dataclass
class SolitonEntity:
    """A game entity backed by a VRC-48 NFT.

    The entity's identity IS its NFT — stats, element, rarity all
    derive deterministically from the topological fingerprint.
    """
    nft: TopoNFT
    stats: EntityStats
    name: str = ""
    genes: List[int] = field(default_factory=list)
    generation: int = 0  # 0 = minted, 1+ = fused
    battle_count: int = 0
    wins: int = 0
    losses: int = 0

    @classmethod
    def from_nft(cls, nft: TopoNFT, name: str = "") -> "SolitonEntity":
        """Create a game entity from a VRC-48 NFT."""
        genes = extract_genes(nft)
        stats = compute_stats(genes, nft)
        generation = len(nft.parent_tokens) // 2 if nft.parent_tokens else 0

        if not name:
            name = generate_name(genes, stats.element)

        return cls(
            nft=nft,
            stats=stats,
            name=name,
            genes=genes,
            generation=generation,
        )

    @property
    def token_id(self) -> str:
        return self.nft.token_id

    def to_dict(self) -> dict:
        """Serialize for API responses."""
        return {
            "token_id": self.nft.token_id,
            "name": self.name,
            "genes": self.genes,
            "stats": {
                "defense": self.stats.defense,
                "hp": self.stats.hp,
                "max_hp": self.stats.max_hp,
                "speed": self.stats.speed,
                "attack": self.stats.attack,
                "special": self.stats.special,
                "element": self.stats.element.value,
                "eta": round(self.stats.eta, 4),
                "rarity": self.stats.rarity.value,
                "rarity_score": round(self.stats.rarity_score, 4),
                "level": self.stats.level,
                "xp": self.stats.xp,
                "power_rating": self.stats.power_rating,
            },
            "generation": self.generation,
            "battle_count": self.battle_count,
            "wins": self.wins,
            "losses": self.losses,
            "fingerprint": {
                "spectrum": list(self.nft.fingerprint.spectrum) if self.nft.fingerprint else [],
                "projection_6d": list(self.nft.fingerprint.projection_6d) if self.nft.fingerprint else [],
            },
        }


# ---------------------------------------------------------------------------
# Stat computation
# ---------------------------------------------------------------------------

def extract_genes(nft: TopoNFT) -> List[int]:
    """Extract the 24 wrapping number genes from an NFT."""
    return [wn.value for wn in nft.manifold.wrapping_numbers]


def compute_stat(genes: List[int], indices: List[int]) -> int:
    """Sum selected wrapping numbers, normalize to 1-100."""
    raw = sum(genes[i] for i in indices)
    max_possible = 997 * len(indices)  # 3988
    return max(1, round(raw / max_possible * 100))


def compute_eta(genes: List[int]) -> float:
    """Entity's η (normal fraction) — lower is more powerful."""
    total = sum(genes)
    max_total = 997 * 24  # 23928
    return total / max_total


def compute_element(genes: List[int]) -> Element:
    """Determine element from spectral affinity genes."""
    spectral_sum = sum(genes[i] for i in GENE_GROUPS["spectral"])
    return ELEMENT_LIST[spectral_sum % 7]


def compute_stats(genes: List[int], nft: TopoNFT) -> EntityStats:
    """Compute full stats from genes."""
    eta = compute_eta(genes)
    rarity_score = nft.fingerprint.topological_rarity() if nft.fingerprint else 0.0

    return EntityStats(
        defense=compute_stat(genes, GENE_GROUPS["coherence"]),
        hp=compute_stat(genes, GENE_GROUPS["amplitude"]),
        speed=compute_stat(genes, GENE_GROUPS["conductance"]),
        attack=compute_stat(genes, GENE_GROUPS["phase_power"]),
        special=compute_stat(genes, GENE_GROUPS["topology"]),
        element=compute_element(genes),
        eta=eta,
        rarity=rarity_from_score(rarity_score),
        rarity_score=rarity_score,
    )


# ---------------------------------------------------------------------------
# Name generation
# ---------------------------------------------------------------------------

_PREFIXES = {
    Element.COHERENCE: ["Lucid", "Crystal", "Harmonic", "Resonant", "Aligned"],
    Element.AMPLITUDE: ["Mighty", "Colossal", "Radiant", "Titan", "Surging"],
    Element.PHASE: ["Swift", "Temporal", "Shifting", "Flux", "Warp"],
    Element.ENTROPY: ["Chaotic", "Fraying", "Scatter", "Turbid", "Erratic"],
    Element.TOPOLOGY: ["Folded", "Twisted", "Knotted", "Manifold", "Dimensional"],
    Element.VOID: ["Hollow", "Null", "Absent", "Silent", "Vacant"],
    Element.PRIME: ["Divine", "Source", "Primal", "Origin", "Absolute"],
}

_SUFFIXES = [
    "Soliton", "Entity", "Condensate", "Vortex", "Phantom",
    "Wraith", "Golem", "Shade", "Wisp", "Specter",
    "Herald", "Walker", "Weaver", "Anchor", "Pulse",
    "Fragment", "Echo", "Sigil", "Glyph", "Nexus",
]

def generate_name(genes: List[int], element: Element) -> str:
    """Generate a thematic name from genes and element."""
    prefix_list = _PREFIXES.get(element, _PREFIXES[Element.COHERENCE])
    prefix = prefix_list[genes[0] % len(prefix_list)]
    suffix = _SUFFIXES[genes[1] % len(_SUFFIXES)]
    return f"{prefix} {suffix}"


# ---------------------------------------------------------------------------
# Minting
# ---------------------------------------------------------------------------

def mint_entity(owner: str, seed: Optional[bytes] = None, name: str = "") -> SolitonEntity:
    """Mint a new soliton entity."""
    if seed is None:
        seed = os.urandom(64)
    nft = TopoNFT.mint(creator=owner, seed=seed)
    return SolitonEntity.from_nft(nft, name=name)
