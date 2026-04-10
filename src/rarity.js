const path = require("path");
const defaultWeights = require("../data/rarity-weights.json");

/**
 * Builds a cumulative distribution table from rarity weight definitions.
 *
 * Given weights like `{ common: 50, uncommon: 30, exotic: 15, legendary: 5 }`,
 * produces an ordered array of `{ rarity, ceiling }` entries that can be
 * binary-searched against a random roll in [0, 100).
 *
 * @param {Record<string, number>} weights - Rarity tier names mapped to their
 *   percentage weight. Values must sum to 100.
 * @returns {{ rarity: string, ceiling: number }[]} Sorted distribution table.
 * @throws {Error} If weights do not sum to 100.
 */
function buildDistributionTable(weights) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (total !== 100) {
    throw new Error(
      `Rarity weights must sum to 100 (got ${total}). ` +
        `Check data/rarity-weights.json.`
    );
  }

  // Sort ascending by weight so the rarest tiers come first in the table.
  // This means a roll of 0–4 hits "legendary" before we ever check "common".
  const sorted = Object.entries(weights).sort(([, a], [, b]) => a - b);

  let cumulative = 0;
  return sorted.map(([rarity, weight]) => {
    cumulative += weight;
    return { rarity, ceiling: cumulative };
  });
}

/**
 * Returns a rarity tier string based on a weighted random roll.
 *
 * @param {{ rarity: string, ceiling: number }[]} table - Cumulative distribution
 *   table produced by {@link buildDistributionTable}.
 * @returns {string} The selected rarity tier (e.g. "common", "legendary").
 */
function rollRarity(table) {
  const roll = Math.random() * 100;
  for (const { rarity, ceiling } of table) {
    if (roll < ceiling) return rarity;
  }
  // Floating-point safety net — return the last tier.
  return table[table.length - 1].rarity;
}

const DEFAULT_TABLE = buildDistributionTable(defaultWeights);

module.exports = { buildDistributionTable, rollRarity, DEFAULT_TABLE };
