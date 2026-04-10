#!/usr/bin/env node

/**
 * XRPL NFT IPFS Metadata Generator — CLI Entry Point
 *
 * Generates randomised NFT metadata conforming to the XRP Ledger art
 * metadata standard, with optional IPFS storage via NFT.Storage / Filecoin.
 *
 * Usage:
 *   node src/index.js                        # Generate 10 NFTs (default)
 *   node src/index.js --count 50             # Generate 50 NFTs
 *   node src/index.js --count 5 --upload     # Generate 5 and store to IPFS
 *   node src/index.js --combinations         # Show total trait-space size
 */

require("dotenv").config();

const { generateBatch } = require("./generator");
const { createClient, storeBatch } = require("./ipfs");
const { cartesian, countCombinations } = require("./combinatorics");

const weapons = require("../data/weapons.json");
const armour = require("../data/armour.json");
const ranks = require("../data/ranks.json");
const backgrounds = require("../data/backgrounds.json");

function parseArgs(argv) {
  const args = { count: 10, upload: false, combinations: false, output: null };

  for (let i = 2; i < argv.length; i++) {
    switch (argv[i]) {
      case "--count":
      case "-n":
        args.count = parseInt(argv[++i], 10);
        if (isNaN(args.count) || args.count < 1) {
          console.error("Error: --count must be a positive integer.");
          process.exit(1);
        }
        break;
      case "--upload":
      case "-u":
        args.upload = true;
        break;
      case "--combinations":
      case "-c":
        args.combinations = true;
        break;
      case "--output":
      case "-o":
        args.output = argv[++i];
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        console.error(`Unknown option: ${argv[i]}`);
        printHelp();
        process.exit(1);
    }
  }
  return args;
}

function printHelp() {
  console.log(`
XRPL NFT IPFS Metadata Generator

Usage:
  node src/index.js [options]

Options:
  -n, --count <number>    Number of NFTs to generate (default: 10)
  -u, --upload            Upload generated metadata to IPFS via NFT.Storage
  -c, --combinations      Print total trait-space size and exit
  -o, --output <file>     Write generated metadata to a JSON file
  -h, --help              Show this help message

Environment Variables:
  NFT_STORAGE_API_KEY     Required for --upload. Get one at https://nft.storage

Examples:
  node src/index.js                          Generate 10 NFTs to stdout
  node src/index.js -n 50 -o batch.json      Generate 50 NFTs to file
  node src/index.js -n 5 --upload            Generate 5 and pin to IPFS
  node src/index.js --combinations           Show trait-space statistics
`);
}

async function run() {
  const args = parseArgs(process.argv);

  // -- Combinations mode: print statistics and exit -------------------------
  if (args.combinations) {
    const total = countCombinations(weapons, armour, ranks, backgrounds);
    console.log("Trait-Space Statistics");
    console.log("─".repeat(40));
    console.log(`  Weapons:      ${weapons.length} items`);
    console.log(`  Armour:       ${armour.length} items`);
    console.log(`  Ranks:        ${ranks.length} items`);
    console.log(`  Backgrounds:  ${backgrounds.length} items`);
    console.log("─".repeat(40));
    console.log(
      `  Total unique combinations: ${total.toLocaleString()}`
    );
    return;
  }

  // -- Generate metadata batch ----------------------------------------------
  console.log(`Generating ${args.count} NFT metadata object(s)...\n`);
  const batch = generateBatch(args.count);

  // -- Optional: write to file ----------------------------------------------
  if (args.output) {
    const fs = require("fs");
    fs.writeFileSync(args.output, JSON.stringify(batch, null, 2));
    console.log(`Wrote ${batch.length} NFT(s) to ${args.output}`);
  } else {
    console.log(JSON.stringify(batch, null, 2));
  }

  // -- Optional: upload to IPFS ---------------------------------------------
  if (args.upload) {
    const apiKey = process.env.NFT_STORAGE_API_KEY;
    if (!apiKey) {
      console.error(
        "\nError: NFT_STORAGE_API_KEY environment variable is required for upload."
      );
      console.error("Get a free API key at https://nft.storage\n");
      process.exit(1);
    }

    console.log(`\nUploading ${batch.length} NFT(s) to IPFS via NFT.Storage...`);
    const client = createClient(apiKey);
    const urls = await storeBatch(client, batch, {
      onProgress: (i, url) => {
        console.log(`  [${i}/${batch.length}] ${url}`);
      },
    });

    console.log(`\nDone! ${urls.length} NFT(s) stored on IPFS.`);
  }
}

run().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
