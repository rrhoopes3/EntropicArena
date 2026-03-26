"""Evolution Engine — fusion + mutation mechanics.

Wraps VortexChain's existing fuse_nfts() with game-specific additions:
  - Mutation: small random perturbation on fusion for surprise traits
  - Cost scaling: fusion cost increases with parent rarity
  - Generation tracking: fused entities have higher generation count
"""

from __future__ import annotations

import os
import random
from typing import Optional, Tuple

from vortexchain.nft import TopoNFT, fuse_nfts, TopoNFTState
from vortexchain.manifold import WrappingNumber
from creature_engine import SolitonEntity, Rarity


# ---------------------------------------------------------------------------
# Mutation
# ---------------------------------------------------------------------------

MUTATION_CHANCE = 0.15  # 15% chance per gene
MUTATION_RANGE = 50     # ±50 on the wrapping number (mod 997)


def apply_mutation(nft: TopoNFT) -> Tuple[TopoNFT, list[int]]:
    """Apply random mutations to a freshly fused NFT.

    Returns the mutated NFT and a list of mutated gene indices.
    """
    mutated_indices = []

    for i, wn in enumerate(nft.manifold.wrapping_numbers):
        if random.random() < MUTATION_CHANCE:
            delta = random.randint(-MUTATION_RANGE, MUTATION_RANGE)
            new_value = (wn.value + delta) % 997
            nft.manifold.wrapping_numbers[i] = WrappingNumber(
                sphere_index=wn.sphere_index,
                value=new_value,
            )
            mutated_indices.append(i)

    # Recompute fingerprint after mutation
    if mutated_indices:
        from vortexchain.nft import TopologicalFingerprint
        nft.fingerprint = TopologicalFingerprint.from_manifold(nft.manifold)

    return nft, mutated_indices


# ---------------------------------------------------------------------------
# Fusion cost
# ---------------------------------------------------------------------------

RARITY_COST_MULT = {
    Rarity.COMMON: 1.0,
    Rarity.UNCOMMON: 1.5,
    Rarity.RARE: 2.5,
    Rarity.EPIC: 4.0,
    Rarity.LEGENDARY: 7.0,
    Rarity.MYTHIC: 12.0,
}

BASE_FUSION_COST = 50  # VORTEX

def fusion_cost(parent_a: SolitonEntity, parent_b: SolitonEntity) -> int:
    """Calculate $VORTEX cost for fusing two entities."""
    mult_a = RARITY_COST_MULT.get(parent_a.stats.rarity, 1.0)
    mult_b = RARITY_COST_MULT.get(parent_b.stats.rarity, 1.0)
    avg_mult = (mult_a + mult_b) / 2
    gen_mult = 1.0 + max(parent_a.generation, parent_b.generation) * 0.2
    return int(BASE_FUSION_COST * avg_mult * gen_mult)


# ---------------------------------------------------------------------------
# Evolution (fuse + mutate)
# ---------------------------------------------------------------------------

def evolve(
    parent_a: SolitonEntity,
    parent_b: SolitonEntity,
    owner: str,
    name: str = "",
) -> Optional[Tuple[SolitonEntity, list[int], int]]:
    """Fuse two entities into a new evolved entity.

    Returns:
        (child_entity, mutated_gene_indices, vortex_cost) or None if invalid.
    """
    # Validate
    if parent_a.nft.state != TopoNFTState.ACTIVE:
        return None
    if parent_b.nft.state != TopoNFTState.ACTIVE:
        return None

    cost = fusion_cost(parent_a, parent_b)

    # Perform fusion (this consumes both parents)
    child_nft = fuse_nfts(parent_a.nft, parent_b.nft, owner)
    if child_nft is None:
        return None

    # Apply mutation
    child_nft, mutated = apply_mutation(child_nft)

    # Create entity from fused NFT
    child = SolitonEntity.from_nft(child_nft, name=name)
    child.generation = max(parent_a.generation, parent_b.generation) + 1

    return child, mutated, cost


def preview_fusion(
    parent_a: SolitonEntity,
    parent_b: SolitonEntity,
) -> dict:
    """Preview what a fusion would produce (without executing it).

    Shows predicted stats based on gene combination (without mutation).
    """
    genes_a = parent_a.genes
    genes_b = parent_b.genes

    # Predicted child genes (no mutation)
    predicted_genes = [(a + b) % 997 for a, b in zip(genes_a, genes_b)]

    from creature_engine import compute_stat, compute_eta, compute_element, GENE_GROUPS

    cost = fusion_cost(parent_a, parent_b)

    return {
        "predicted_stats": {
            "defense": compute_stat(predicted_genes, GENE_GROUPS["coherence"]),
            "hp": compute_stat(predicted_genes, GENE_GROUPS["amplitude"]),
            "speed": compute_stat(predicted_genes, GENE_GROUPS["conductance"]),
            "attack": compute_stat(predicted_genes, GENE_GROUPS["phase_power"]),
            "special": compute_stat(predicted_genes, GENE_GROUPS["topology"]),
            "element": compute_element(predicted_genes).value,
            "eta": round(compute_eta(predicted_genes), 4),
        },
        "predicted_genes": predicted_genes,
        "mutation_chance": f"{MUTATION_CHANCE * 100:.0f}% per gene",
        "cost_vortex": cost,
        "parent_a": parent_a.name,
        "parent_b": parent_b.name,
        "child_generation": max(parent_a.generation, parent_b.generation) + 1,
    }
