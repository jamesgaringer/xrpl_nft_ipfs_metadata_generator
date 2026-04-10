# XRPL NFT IPFS Metadata Generator

A CLI tool for generating randomized NFT metadata compliant with the [XRP Ledger NFT standard](https://github.com/XRPLF/XRPL-Standards/discussions/69), with weighted rarity traits and IPFS storage via [NFT.Storage](https://nft.storage) + Filecoin.

Built for the **Orx** NFT collection — a fantasy RPG-themed series with weapons, armour, ranks, and backgrounds, each assigned weighted rarity tiers that control drop rates across the collection.

## Features

- **Weighted rarity system** — Configurable drop rates (legendary 5%, exotic 15%, uncommon 30%, common 50%) driven by a cumulative distribution table
- **XRPL-compliant metadata** — Output conforms to the XLS-24d on-ledger NFT metadata schema
- **IPFS + Filecoin persistence** — Pin metadata to IPFS via NFT.Storage with Filecoin-backed persistence guarantees
- **Trait-space analysis** — Calculate total unique combinations across all trait pools before minting
- **Data-driven architecture** — All traits defined in JSON config files, making it easy to add items or swap collections
- **CLI interface** — Configurable batch size, file output, and upload toggle

## Architecture

```
src/
  index.js          CLI entry point with argument parsing
  generator.js      NFT metadata assembly with weighted trait selection
  rarity.js         Cumulative distribution table for rarity rolls
  ipfs.js           NFT.Storage client wrapper for IPFS uploads
  combinatorics.js  Cartesian product for trait-space enumeration

data/
  weapons.json      22 weapon traits across 4 rarity tiers
  armour.json       16 armour traits (chest, legs, hands, head)
  ranks.json        4 rank tiers with base stat scaling
  backgrounds.json  10 background environments
  rarity-weights.json  Drop rate percentages per tier
  collection.json   Collection-level metadata (name, family, type)

schemas/
  xrpl-nft-metadata.json  JSON Schema for output validation
```

## Getting Started

### Prerequisites

- Node.js >= 16
- (Optional) [NFT.Storage API key](https://nft.storage) for IPFS uploads

### Installation

```bash
git clone https://github.com/jamesgaringer/xrpl_nft_ipfs_metadata_generator.git
cd xrpl_nft_ipfs_metadata_generator
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env and add your NFT.Storage API key (only needed for --upload)
```

## Usage

### Generate NFTs to stdout

```bash
node src/index.js              # 10 NFTs (default)
node src/index.js -n 50        # 50 NFTs
```

### Write to file

```bash
node src/index.js -n 100 -o output/batch.json
```

### Upload to IPFS

```bash
node src/index.js -n 5 --upload
# Requires NFT_STORAGE_API_KEY in .env
```

### View trait-space statistics

```bash
node src/index.js --combinations
```

```
Trait-Space Statistics
────────────────────────────────────────
  Weapons:      22 items
  Armour:       16 items
  Ranks:        4 items
  Backgrounds:  10 items
────────────────────────────────────────
  Total unique combinations: 14,080
```

## Example Output

```json
{
  "nftType": "orx.v0",
  "name": "Orx NFT #1",
  "description": "First collection of Orx NFT Mints",
  "image": "",
  "collection": {
    "name": "Orx v.1",
    "family": "Eldar Labs Limited",
    "mintNumber": 1
  },
  "attributes": [
    {
      "trait_type": "Rank",
      "value": "captain",
      "rarity": "uncommon",
      "stats": { "attack": 39, "defence": 39, "stamina": 16 }
    },
    {
      "trait_type": "Weapon",
      "value": "Exotic Mace",
      "rarity": "exotic",
      "stats": { "attack": 9 }
    },
    {
      "trait_type": "Armour",
      "value": "Leather Chestplate",
      "rarity": "common",
      "slot": "chest",
      "stats": { "defence": 3 }
    },
    {
      "trait_type": "Background",
      "value": "Rolling Hills Volcano",
      "rarity": "uncommon",
      "stats": { "stamina": 3 }
    }
  ]
}
```

## Rarity System

Drop rates are controlled by a weighted probability distribution:

| Tier | Weight | Roll Range | Example |
|------|--------|------------|---------|
| Legendary | 5% | 0 - 4.99 | Warchief, Legendary Sword |
| Exotic | 15% | 5 - 19.99 | General, Mithril Chestplate |
| Uncommon | 30% | 20 - 49.99 | Captain, Steel Legplates |
| Common | 50% | 50 - 99.99 | Grunt, Leather Gauntlets |

Weights are configurable in `data/rarity-weights.json` and validated at startup to ensure they sum to 100.

## How It Works

1. **Rarity roll** — A random number in [0, 100) is rolled against a cumulative distribution table built from `rarity-weights.json`
2. **Trait selection** — For each attribute slot (rank, weapon, armour, background), a rarity tier is rolled independently, then a random item is picked from that tier's pool
3. **Metadata assembly** — Selected traits are composed into an XRPL-compliant metadata object with collection info and stat blocks
4. **IPFS storage** (optional) — Metadata is stored on IPFS via NFT.Storage, backed by Filecoin for permanent availability

## Programmatic Usage

```javascript
const { generateBatch } = require("./src/generator");
const { createClient, storeBatch } = require("./src/ipfs");
const { cartesian, countCombinations } = require("./src/combinatorics");

// Generate 20 NFT metadata objects
const nfts = generateBatch(20);

// Count trait-space without materializing
const weapons = require("./data/weapons.json");
const armour = require("./data/armour.json");
const total = countCombinations(weapons, armour);

// Upload to IPFS
const client = createClient(process.env.NFT_STORAGE_API_KEY);
const urls = await storeBatch(client, nfts, {
  onProgress: (i, url) => console.log(`Stored ${i}: ${url}`),
});
```

## License

[MIT](LICENSE)
