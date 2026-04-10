const path = require("path");
const { rollRarity, DEFAULT_TABLE } = require("./rarity");

const weapons = require("../data/weapons.json");
const armour = require("../data/armour.json");
const ranks = require("../data/ranks.json");
const backgrounds = require("../data/backgrounds.json");
const collection = require("../data/collection.json");

/**
 * Groups an array of items by their `rarity` field for O(1) tier lookups.
 *
 * @param {object[]} items - Array of trait objects, each with a `rarity` string.
 * @returns {Record<string, object[]>} Items keyed by rarity tier.
 */
function groupByRarity(items) {
  return items.reduce((acc, item) => {
    (acc[item.rarity] ??= []).push(item);
    return acc;
  }, {});
}

const traitPools = {
  weapon: groupByRarity(weapons),
  armour: groupByRarity(armour),
  rank: groupByRarity(ranks),
  background: groupByRarity(backgrounds),
};

/**
 * Selects a random item from the given pool using weighted rarity.
 *
 * Rolls a rarity tier via the distribution table, then picks a uniformly
 * random item from that tier's pool.
 *
 * @param {Record<string, object[]>} pool - Trait items grouped by rarity.
 * @param {{ rarity: string, ceiling: number }[]} [table=DEFAULT_TABLE] -
 *   Rarity distribution table.
 * @returns {object} A randomly selected trait object.
 * @throws {Error} If the rolled rarity tier has no items in the pool.
 */
function pickTrait(pool, table = DEFAULT_TABLE) {
  const rarity = rollRarity(table);
  const candidates = pool[rarity];
  if (!candidates || candidates.length === 0) {
    throw new Error(`No items found for rarity tier "${rarity}".`);
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Generates a single XRPL-compliant NFT metadata object.
 *
 * Each call produces a unique combination of rank, weapon, armour, and
 * background attributes, selected via weighted rarity rolls.
 *
 * The output conforms to the XRP Ledger NFT art metadata standard
 * (see `schemas/xrpl-nft-metadata.json`).
 *
 * @param {number} mintNumber - Sequential mint index for this NFT.
 * @param {{ imageCid?: string }} [options={}] - Optional overrides.
 * @param {string} [options.imageCid] - IPFS CID of the NFT artwork image.
 * @returns {object} A complete NFT metadata object ready for IPFS storage.
 */
function generateNftMetadata(mintNumber, options = {}) {
  const rank = pickTrait(traitPools.rank);
  const weapon = pickTrait(traitPools.weapon);
  const armourPiece = pickTrait(traitPools.armour);
  const background = pickTrait(traitPools.background);

  return {
    nftType: collection.nftType,
    name: `${collection.name} #${mintNumber}`,
    description: collection.description,
    image: options.imageCid ? `ipfs://${options.imageCid}` : "",
    collection: {
      name: collection.collectionName,
      family: collection.family,
      mintNumber,
    },
    attributes: [
      {
        trait_type: "Rank",
        value: rank.value,
        rarity: rank.rarity,
        stats: {
          attack: rank.attack,
          defence: rank.defence,
          stamina: rank.stamina,
        },
      },
      {
        trait_type: "Weapon",
        value: weapon.name,
        rarity: weapon.rarity,
        stats: { attack: weapon.attack },
      },
      {
        trait_type: "Armour",
        value: armourPiece.name,
        rarity: armourPiece.rarity,
        slot: armourPiece.slot,
        stats: { defence: armourPiece.defence },
      },
      {
        trait_type: "Background",
        value: background.name,
        rarity: background.rarity,
        stats: { stamina: background.stamina },
      },
    ],
  };
}

/**
 * Generates a batch of NFT metadata objects.
 *
 * @param {number} count - Number of NFTs to generate.
 * @param {{ imageCid?: string, startIndex?: number }} [options={}]
 * @returns {object[]} Array of NFT metadata objects.
 */
function generateBatch(count, options = {}) {
  const startIndex = options.startIndex ?? 1;
  return Array.from({ length: count }, (_, i) =>
    generateNftMetadata(startIndex + i, options)
  );
}

module.exports = { generateNftMetadata, generateBatch, pickTrait, traitPools };
