"""Combat Engine — turn-based battle system using condensate physics.

Core damage formula from the paper:
  Damage = (attacker.phase_power / defender.coherence) * η_multiplier
  η_multiplier = exp(defender.η - attacker.η)

Low-η entities dominate high-η parasites — this is the central asymmetry
that makes the game faithful to the model.

Special mechanics:
  - Dread Injection: parasites raise target's η temporarily
  - Detune: active ability to purge dread (costs a turn)
  - Element advantage: 1.5x damage multiplier
  - Sacred Space: passive η reduction buff
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Dict, List, Optional, Tuple

from creature_engine import (
    SolitonEntity, EntityStats, Element, ELEMENT_ADVANTAGE,
)
from parasite_bestiary import (
    Parasite, ParasiteAttack, AttackType,
)


class BattlePhase(Enum):
    STARTING = auto()
    PLAYER_TURN = auto()
    ENEMY_TURN = auto()
    VICTORY = auto()
    DEFEAT = auto()


class ActionType(Enum):
    ATTACK = "attack"
    SPECIAL = "special"         # Element-based special move
    DETUNE = "detune"           # Purge dread status (costs turn)
    LOVE_BURST = "love_burst"   # Positive signature — extra damage to high-η
    GUARD = "guard"             # Reduce incoming damage this turn


@dataclass
class CombatLog:
    """A single entry in the battle log."""
    turn: int
    actor: str
    action: str
    target: str
    damage: int
    effect: str
    flavor_text: str


@dataclass
class CombatantState:
    """Tracks a combatant's state during battle."""
    name: str
    current_hp: int
    max_hp: int
    eta: float          # Can be modified by dread injection
    base_eta: float     # Original η
    dread_stacks: int = 0  # Each stack raises η by 0.05
    is_guarding: bool = False
    cooldowns: Dict[str, int] = field(default_factory=dict)

    @property
    def effective_eta(self) -> float:
        return min(0.99, self.eta + self.dread_stacks * 0.05)

    @property
    def is_alive(self) -> bool:
        return self.current_hp > 0


@dataclass
class BattleState:
    """Full state of a battle in progress."""
    player_entity: SolitonEntity
    parasite: Parasite
    player_state: CombatantState
    enemy_state: CombatantState
    phase: BattlePhase = BattlePhase.STARTING
    turn: int = 0
    log: List[CombatLog] = field(default_factory=list)
    vortex_earned: int = 0
    xp_earned: int = 0

    def to_dict(self) -> dict:
        return {
            "player": {
                "name": self.player_state.name,
                "hp": self.player_state.current_hp,
                "max_hp": self.player_state.max_hp,
                "eta": round(self.player_state.effective_eta, 4),
                "dread_stacks": self.player_state.dread_stacks,
                "is_guarding": self.player_state.is_guarding,
            },
            "enemy": {
                "name": self.enemy_state.name,
                "hp": self.enemy_state.current_hp,
                "max_hp": self.enemy_state.max_hp,
                "eta": round(self.enemy_state.eta, 4),
            },
            "phase": self.phase.name,
            "turn": self.turn,
            "log": [
                {
                    "turn": l.turn,
                    "actor": l.actor,
                    "action": l.action,
                    "target": l.target,
                    "damage": l.damage,
                    "effect": l.effect,
                    "flavor_text": l.flavor_text,
                }
                for l in self.log[-10:]  # Last 10 entries
            ],
            "vortex_earned": self.vortex_earned,
            "xp_earned": self.xp_earned,
        }


# ---------------------------------------------------------------------------
# Battle initialization
# ---------------------------------------------------------------------------

def start_battle(entity: SolitonEntity, parasite: Parasite) -> BattleState:
    """Initialize a new battle."""
    player_state = CombatantState(
        name=entity.name,
        current_hp=entity.stats.max_hp,
        max_hp=entity.stats.max_hp,
        eta=entity.stats.eta,
        base_eta=entity.stats.eta,
    )
    enemy_state = CombatantState(
        name=parasite.name,
        current_hp=parasite.hp,
        max_hp=parasite.hp,
        eta=parasite.eta,
        base_eta=parasite.eta,
    )

    state = BattleState(
        player_entity=entity,
        parasite=parasite,
        player_state=player_state,
        enemy_state=enemy_state,
        phase=BattlePhase.PLAYER_TURN,
        turn=1,
    )

    state.log.append(CombatLog(
        turn=0,
        actor="system",
        action="battle_start",
        target="",
        damage=0,
        effect="",
        flavor_text=f"A {parasite.name} materializes from the lower astral. η={parasite.eta:.2f}. "
                    f"Your {entity.name} stands ready. η={entity.stats.eta:.4f}. "
                    f"The exponential physics favors the coherent.",
    ))

    return state


# ---------------------------------------------------------------------------
# Damage calculation
# ---------------------------------------------------------------------------

def calculate_damage(
    attacker_power: int,
    defender_defense: int,
    attacker_eta: float,
    defender_eta: float,
    attacker_element: Optional[Element] = None,
    defender_weakness: Optional[Element] = None,
    is_love_burst: bool = False,
) -> Tuple[int, str]:
    """Calculate damage using condensate physics.

    Core formula:
      base_damage = attacker_power * (100 / (100 + defender_defense))
      η_multiplier = exp(defender_η - attacker_η)
      final_damage = base_damage * η_multiplier * element_bonus * variance

    Returns (damage, description).
    """
    # Base damage with defense reduction
    base = attacker_power * (100 / (100 + defender_defense))

    # η multiplier — THE key mechanic
    # Low-η attacker vs high-η defender = massive multiplier
    eta_diff = defender_eta - attacker_eta
    eta_mult = math.exp(eta_diff)

    # Element advantage
    element_mult = 1.0
    element_desc = ""
    if attacker_element and defender_weakness and attacker_element == defender_weakness:
        element_mult = 1.5
        element_desc = f" (element advantage: {attacker_element.value}!)"

    # Love burst bonus against high-η targets
    love_mult = 1.0
    love_desc = ""
    if is_love_burst and defender_eta > 0.6:
        love_mult = 1.0 + (defender_eta - 0.6) * 2.5  # Up to 2x bonus
        love_desc = " Positive signature is toxic to dark soliton!"

    # Variance (±15%)
    variance = 0.85 + random.random() * 0.30

    final = int(base * eta_mult * element_mult * love_mult * variance)
    final = max(1, final)  # Minimum 1 damage

    desc = f"η-mult: {eta_mult:.2f}x{element_desc}{love_desc}"
    return final, desc


# ---------------------------------------------------------------------------
# Player actions
# ---------------------------------------------------------------------------

def player_action(state: BattleState, action: ActionType) -> BattleState:
    """Execute a player action."""
    if state.phase != BattlePhase.PLAYER_TURN:
        return state

    entity = state.player_entity
    ps = state.player_state
    es = state.enemy_state
    ps.is_guarding = False  # Reset guard from previous turn

    if action == ActionType.ATTACK:
        damage, desc = calculate_damage(
            attacker_power=entity.stats.attack,
            defender_defense=state.parasite.defense,
            attacker_eta=ps.effective_eta,
            defender_eta=es.eta,
            attacker_element=entity.stats.element,
            defender_weakness=state.parasite.weakness,
        )
        es.current_hp -= damage
        state.log.append(CombatLog(
            turn=state.turn,
            actor=ps.name,
            action="attack",
            target=es.name,
            damage=damage,
            effect=desc,
            flavor_text=f"Phase power channels through the throat aperture. {damage} damage.",
        ))

    elif action == ActionType.SPECIAL:
        damage, desc = calculate_damage(
            attacker_power=entity.stats.special + entity.stats.attack // 2,
            defender_defense=state.parasite.defense // 2,  # Specials bypass some defense
            attacker_eta=ps.effective_eta,
            defender_eta=es.eta,
            attacker_element=entity.stats.element,
            defender_weakness=state.parasite.weakness,
        )
        es.current_hp -= damage
        state.log.append(CombatLog(
            turn=state.turn,
            actor=ps.name,
            action="special",
            target=es.name,
            damage=damage,
            effect=desc,
            flavor_text=f"{entity.stats.element.value} resonance tears through the parasite's etheric body. {damage} damage.",
        ))

    elif action == ActionType.LOVE_BURST:
        damage, desc = calculate_damage(
            attacker_power=entity.stats.special,
            defender_defense=state.parasite.defense,
            attacker_eta=ps.effective_eta,
            defender_eta=es.eta,
            is_love_burst=True,
        )
        es.current_hp -= damage
        # Love burst also reduces own dread
        if ps.dread_stacks > 0:
            ps.dread_stacks = max(0, ps.dread_stacks - 2)
        state.log.append(CombatLog(
            turn=state.turn,
            actor=ps.name,
            action="love_burst",
            target=es.name,
            damage=damage,
            effect=desc,
            flavor_text=f"Genuine compassion radiates — a low-η configuration structurally incompatible with the demon's soliton. {damage} damage.",
        ))

    elif action == ActionType.DETUNE:
        removed = ps.dread_stacks
        ps.dread_stacks = 0
        ps.eta = ps.base_eta
        state.log.append(CombatLog(
            turn=state.turn,
            actor=ps.name,
            action="detune",
            target=ps.name,
            damage=0,
            effect=f"Removed {removed} dread stacks. η restored to {ps.base_eta:.4f}.",
            flavor_text="I refuse to amplify. This signature is not mine. ⟨θ_fear|θ_STO⟩² → 0.",
        ))

    elif action == ActionType.GUARD:
        ps.is_guarding = True
        state.log.append(CombatLog(
            turn=state.turn,
            actor=ps.name,
            action="guard",
            target=ps.name,
            damage=0,
            effect="Defense doubled for this turn.",
            flavor_text="Throat aperture sealed. Coherence barrier raised.",
        ))

    # Check victory
    if es.current_hp <= 0:
        es.current_hp = 0
        state.phase = BattlePhase.VICTORY
        state.vortex_earned = state.parasite.vortex_reward
        state.xp_earned = state.parasite.xp_reward
        state.log.append(CombatLog(
            turn=state.turn,
            actor="system",
            action="victory",
            target="",
            damage=0,
            effect=f"+{state.vortex_earned} $VORTEX, +{state.xp_earned} XP",
            flavor_text=f"The {state.parasite.name}'s soliton structure dissolves. "
                        f"Its high-η form cannot sustain against your coherent field. "
                        f"The entropic parasite is banished.",
        ))
        return state

    # Switch to enemy turn
    state.phase = BattlePhase.ENEMY_TURN
    return state


# ---------------------------------------------------------------------------
# Enemy AI
# ---------------------------------------------------------------------------

def enemy_turn(state: BattleState) -> BattleState:
    """Execute the parasite's turn (AI-controlled)."""
    if state.phase != BattlePhase.ENEMY_TURN:
        return state

    ps = state.player_state
    es = state.enemy_state
    parasite = state.parasite

    # Decrement cooldowns
    for key in list(es.cooldowns.keys()):
        es.cooldowns[key] -= 1
        if es.cooldowns[key] <= 0:
            del es.cooldowns[key]

    # Select attack (simple AI: prioritize dread if target not already dread-stacked,
    # then use strongest available attack)
    available = [
        a for a in parasite.attacks
        if a.name not in es.cooldowns
    ]
    if not available:
        available = [parasite.attacks[0]]  # Fallback to first attack

    # Strategy: if player has low dread, inject dread; otherwise, hit hard
    dread_attacks = [a for a in available if a.attack_type == AttackType.DREAD_INJECTION]
    heavy_attacks = [a for a in available if a.attack_type in (
        AttackType.SACRIFICE_PULSE, AttackType.FOUR_FLOW_CYCLE, AttackType.DARK_HARVEST
    )]

    if ps.dread_stacks < 3 and dread_attacks and random.random() < 0.4:
        chosen = random.choice(dread_attacks)
    elif heavy_attacks and random.random() < 0.5:
        chosen = random.choice(heavy_attacks)
    else:
        chosen = random.choice(available)

    # Apply cooldown
    if chosen.cooldown > 0:
        es.cooldowns[chosen.name] = chosen.cooldown

    # Calculate and apply effects
    defense_mult = 2 if ps.is_guarding else 1

    if chosen.attack_type == AttackType.DREAD_INJECTION:
        damage = max(1, chosen.damage - ps.is_guarding * 5)
        ps.current_hp -= damage
        ps.dread_stacks += 1
        ps.eta = ps.base_eta + ps.dread_stacks * 0.05
        state.log.append(CombatLog(
            turn=state.turn,
            actor=es.name,
            action=chosen.name,
            target=ps.name,
            damage=damage,
            effect=f"Dread +1 (total: {ps.dread_stacks}). η raised to {ps.effective_eta:.4f}.",
            flavor_text=chosen.description,
        ))

    elif chosen.attack_type == AttackType.FEAR_WAVE:
        damage = max(1, chosen.damage)
        ps.current_hp -= damage
        ps.dread_stacks += 2
        ps.eta = ps.base_eta + ps.dread_stacks * 0.05
        state.log.append(CombatLog(
            turn=state.turn,
            actor=es.name,
            action=chosen.name,
            target=ps.name,
            damage=damage,
            effect=f"Dread +2! η raised to {ps.effective_eta:.4f}.",
            flavor_text="A wave of existential dread washes over the field. Fear operates destructively at all three levels simultaneously.",
        ))

    elif chosen.attack_type == AttackType.SACRIFICE_PULSE:
        damage = max(1, int(chosen.damage / defense_mult))
        ps.current_hp -= damage
        heal = damage // 2
        es.current_hp = min(es.max_hp, es.current_hp + heal)
        state.log.append(CombatLog(
            turn=state.turn,
            actor=es.name,
            action=chosen.name,
            target=ps.name,
            damage=damage,
            effect=f"Self-healed {heal} HP.",
            flavor_text="Etheric energy released by forced dissolution fuels the demon's projection.",
        ))

    elif chosen.attack_type == AttackType.FOUR_FLOW_CYCLE:
        total_damage = 0
        # Execute all 4 flows
        drain = max(1, int(chosen.damage * 0.25 / defense_mult))
        ps.current_hp -= drain
        total_damage += drain
        harvest = max(1, int(chosen.damage * 0.35 / defense_mult))
        ps.current_hp -= harvest
        total_damage += harvest
        ps.dread_stacks += 2
        ps.eta = ps.base_eta + ps.dread_stacks * 0.05
        heal = total_damage // 3
        es.current_hp = min(es.max_hp, es.current_hp + heal)
        state.log.append(CombatLog(
            turn=state.turn,
            actor=es.name,
            action=chosen.name,
            target=ps.name,
            damage=total_damage,
            effect=f"4-flow cycle! Dread +2, enemy healed {heal}.",
            flavor_text="The self-reinforcing predatory loop activates: etheric drain → sacrifice → dark harvest → astral injection. The system closes.",
        ))

    else:
        # Standard attack (ETHERIC_DRAIN, DARK_HARVEST, THROAT_CONSTRICT)
        damage = max(1, int(chosen.damage / defense_mult))
        ps.current_hp -= damage
        state.log.append(CombatLog(
            turn=state.turn,
            actor=es.name,
            action=chosen.name,
            target=ps.name,
            damage=damage,
            effect="",
            flavor_text=chosen.description,
        ))

    # Check defeat
    if ps.current_hp <= 0:
        ps.current_hp = 0
        state.phase = BattlePhase.DEFEAT
        state.log.append(CombatLog(
            turn=state.turn,
            actor="system",
            action="defeat",
            target="",
            damage=0,
            effect="",
            flavor_text=f"Your {ps.name}'s coherence collapses. The entropic parasite prevails. "
                        f"Recalibrate your throat and return stronger.",
        ))
        return state

    # Advance turn
    state.turn += 1
    state.phase = BattlePhase.PLAYER_TURN
    return state
