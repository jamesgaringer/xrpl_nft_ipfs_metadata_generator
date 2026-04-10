/**
 * Generates the Cartesian product of any number of arrays.
 *
 * Given N arrays, produces every possible combination containing exactly
 * one element from each input array. Useful for enumerating the full
 * trait-space of an NFT collection to calculate total supply and rarity
 * distributions before minting.
 *
 * @example
 * const weapons = [{ name: "Sword" }, { name: "Axe" }];
 * const armour  = [{ name: "Shield" }, { name: "Helm" }];
 *
 * cartesian(weapons, armour);
 * // [
 * //   [{ name: "Sword" }, { name: "Shield" }],
 * //   [{ name: "Sword" }, { name: "Helm" }],
 * //   [{ name: "Axe" },   { name: "Shield" }],
 * //   [{ name: "Axe" },   { name: "Helm" }],
 * // ]
 *
 * @param {...Array} arrays - Two or more arrays of trait objects.
 * @returns {Array[]} Array of combinations (each combination is an array).
 * @throws {Error} If fewer than two arrays are provided or any argument is not an array.
 */
function cartesian(...arrays) {
  if (arrays.length < 2) {
    throw new Error("cartesian() requires at least two arrays.");
  }
  for (let i = 0; i < arrays.length; i++) {
    if (!Array.isArray(arrays[i])) {
      throw new Error(`Argument at index ${i} is not an array.`);
    }
  }

  return arrays.reduce(
    (combos, current) =>
      combos.flatMap((combo) => current.map((item) => [...combo, item])),
    [[]]
  );
}

/**
 * Counts the total number of unique trait combinations without
 * materializing them in memory. Useful for large trait-spaces where
 * the full Cartesian product would be too large to hold.
 *
 * @param {...Array} arrays - Two or more arrays of trait objects.
 * @returns {number} Total number of unique combinations.
 */
function countCombinations(...arrays) {
  return arrays.reduce((total, arr) => total * arr.length, 1);
}

module.exports = { cartesian, countCombinations };
