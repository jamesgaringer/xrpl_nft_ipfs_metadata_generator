const { NFTStorage, File } = require("nft.storage");

/**
 * Creates an authenticated NFT.Storage client.
 *
 * @param {string} apiKey - NFT.Storage API token.
 * @returns {NFTStorage} Configured client instance.
 * @throws {Error} If no API key is provided.
 */
function createClient(apiKey) {
  if (!apiKey) {
    throw new Error(
      "NFT.Storage API key is required. " +
        "Set the NFT_STORAGE_API_KEY environment variable or pass it directly."
    );
  }
  return new NFTStorage({ token: apiKey });
}

/**
 * Stores a single NFT metadata object on IPFS via NFT.Storage.
 *
 * The metadata is persisted using Filecoin, ensuring long-term availability
 * without relying on pinning services.
 *
 * @param {NFTStorage} client - Authenticated NFT.Storage client.
 * @param {object} metadata - NFT metadata object to store.
 * @param {{ imagePath?: string }} [options={}] - Optional image attachment.
 * @returns {Promise<string>} The IPFS metadata URI (e.g. `ipfs://bafy.../metadata.json`).
 */
async function storeMetadata(client, metadata, options = {}) {
  const storeData = { ...metadata };

  if (options.imagePath) {
    const fs = require("fs");
    const path = require("path");
    const imageData = await fs.promises.readFile(options.imagePath);
    const fileName = path.basename(options.imagePath);
    storeData.image = new File([imageData], fileName, {
      type: `image/${path.extname(fileName).slice(1)}`,
    });
  }

  const result = await client.store(storeData);
  return result.url;
}

/**
 * Stores a batch of NFT metadata objects on IPFS sequentially.
 *
 * @param {NFTStorage} client - Authenticated NFT.Storage client.
 * @param {object[]} metadataBatch - Array of NFT metadata objects.
 * @param {{ imagePath?: string, onProgress?: (index: number, url: string) => void }} [options={}]
 * @returns {Promise<string[]>} Array of IPFS metadata URIs.
 */
async function storeBatch(client, metadataBatch, options = {}) {
  const urls = [];
  for (let i = 0; i < metadataBatch.length; i++) {
    const url = await storeMetadata(client, metadataBatch[i], options);
    urls.push(url);
    if (options.onProgress) {
      options.onProgress(i + 1, url);
    }
  }
  return urls;
}

module.exports = { createClient, storeMetadata, storeBatch };
