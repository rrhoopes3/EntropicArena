# Entropic Arena

An evolution-based blockchain game built on **VortexChain's VRC-48 topological NFTs** and **$VORTEX on Solana**. Mint soliton entities from the condensate, evolve them through topological fusion, and battle entropic parasites in the arena.

Lore and combat physics derived from *"Entropic Parasites: Demonic Entities in the Nested Condensate Model"* by Thomas Minderle (Montalk).

## Core Mechanics

### Soliton Entities (VRC-48 NFTs)
Each entity is a VRC-48 topological NFT with a 48D manifold fingerprint. The 24 wrapping numbers serve as **genes** grouped into 6 stat categories:

| Gene Group | Genes | Stat | Description |
|-----------|-------|------|-------------|
| Coherence | 0-3 | Defense | Phase alignment, decoherence resistance |
| Amplitude | 4-7 | HP | R-field strength, vitality |
| Conductance | 8-11 | Speed | Throat bandwidth, initiative |
| Phase Power | 12-15 | Attack | Astral projection strength |
| Spectral | 16-19 | Element | Chakra alignment (7 elements) |
| Topology | 20-23 | Special | Dimensional complexity, abilities |

**η (normal fraction)** is computed from total gene values — **lower η = more powerful entity**. This is the central asymmetry: low-η entities dominate high-η parasites exponentially.

### 7 Elements (matching OAM qudit dimension d=7)
Coherence > Entropy > Amplitude > Void > Phase > Topology > Coherence

**Prime** element (rare) has no specific weakness.

### Evolution via NFT Fusion
Fuse two entities → both parents consumed → child inherits combined genes:
- Child wrapping numbers = `(parent_a + parent_b) mod 997`
- 15% mutation chance per gene (±50 perturbation)
- Cost scales with parent rarity and generation

### Combat (η-Based Physics)
Turn-based PvE against entropic parasites:

```
Damage = (attacker.phase_power / defender.coherence) * exp(defender.η - attacker.η)
```

**Special Moves:**
- **Love Burst** — Positive astral configurations toxic to high-η enemies (bonus damage scales with target's η)
- **Detune** — Purge dread status, restore base η
- **Guard** — Double defense for one turn

**Parasite Mechanics:**
- **Dread Injection** — Temporarily raises your entity's η
- **Four-Flow Cycle** — Boss attack executing all 4 parasitic flows (etheric drain → sacrifice → dark harvest → astral injection)

### Entropic Parasites (Bestiary)

| Parasite | Tier | η | Weakness | Description |
|----------|------|---|----------|-------------|
| Etheric Leech | 1 | 0.75 | Coherence | Basic etheric drain |
| Cold Spot | 1 | 0.70 | Amplitude | Localized η-elevation |
| Shadow Projector | 2 | 0.80 | Phase | Etheric projection attacker |
| Throat Worm | 2 | 0.78 | Topology | Constricts throat bandwidth |
| Voice Injector | 2 | 0.82 | Coherence | Auditory dark signatures |
| Dread Lord | 3 | 0.88 | Void | Dual-level terraformer (Boss) |
| Soliton Archon | 3 | 0.92 | Prime | Full 4-flow parasitic cycle (Final Boss) |

### $VORTEX Economy
- **Token**: Solana SPL (`5joN44mSAdo7DbGgsKnXWagLKc8kEkFfKiTW2szTFASA`)
- **Mint entity**: 25 VORTEX
- **Fuse entities**: 50-600 VORTEX (scales with rarity)
- **Battle rewards**: 5-100 VORTEX per victory

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python (Flask) |
| Creature Engine | VortexChain VRC-48 NFTs (48D topological manifolds) |
| Combat Engine | η-based damage with element advantages |
| Frontend | React + TypeScript + Vite |
| Token | $VORTEX on Solana |

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# UI runs on http://localhost:5173
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/mint` | Mint a new entity |
| GET | `/api/entities?player=X` | List player's entities |
| GET | `/api/entity/<id>` | Get entity details |
| POST | `/api/battle/start` | Start a battle |
| POST | `/api/battle/action` | Execute combat action |
| POST | `/api/fuse/preview` | Preview fusion result |
| POST | `/api/fuse` | Execute fusion |
| GET | `/api/bestiary` | List all parasites |
| GET | `/api/wallet?player=X` | Get wallet balance |
| GET | `/api/health` | Server status |

## Project Structure

```
EntropicArena/
├── backend/
│   ├── app.py                # Flask API server
│   ├── creature_engine.py    # VRC-48 → entity stats
│   ├── combat_engine.py      # η-based combat system
│   ├── parasite_bestiary.py  # Enemy definitions
│   ├── evolution.py          # Fusion + mutation
│   ├── economy.py            # $VORTEX pricing
│   └── vortexchain/          # Core VRC-48 modules
├── frontend/
│   └── src/
│       ├── pages/            # Home, Arena, Bestiary
│       ├── components/       # EntityCard, etc.
│       ├── services/api.ts   # Backend client
│       └── constants/        # Theme
└── README.md
```

## Based On

- **VortexChain** — 48D topological manifold cryptography & VRC-48 NFT standard
- **Montalk's Entropic Parasites** — Nested condensate model of demonic entities
- **$VORTEX** — Solana SPL token (48M supply)

## License

MIT
