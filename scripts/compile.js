require("isomorphic-fetch");

const { readdir, readFile, writeFile } = require("fs/promises");
const { join, basename } = require("path");
const {
  array,
  assert,
  define,
  number,
  object,
  optional,
  string,
} = require("superstruct");
const { parse } = require("yaml");

const { original, extra } = require(join(__dirname, "../tags.json"));
const tags = Object.entries(
  extra.reduce((acc, curr) => {
    acc[curr] = {};
    return acc;
  }, original)
)
  .sort(([a], [b]) => a.localeCompare(b))
  .reduce((acc, [k, v]) => {
    acc[k] = v;
    return acc;
  }, {});

const Tag = define("Tag", (tag) => Boolean(tags[tag]));

const Cluster = define("Cluster", (cluster) =>
  ["mainnet-beta", "devnet", "testnet"].includes(cluster)
);

const re = RegExp(/(https?|ipfs):/);
const Website = define("Website", (url) => re.test(new URL(url).protocol));

let coingeckoIdList;
// no async :( https://github.com/ianstormtaylor/superstruct/issues/48
const CoinGeckoId = define("CoinGeckoId", (id) => coingeckoIdList.has(id));

const Token = object({
  name: string(),
  description: optional(string()),
  symbol: string(),
  decimals: number(),
  extensions: optional(
    object({
      address: optional(string()), // 0xdd974D5C2e2928deA5F71b9825b8b646686BD200
      assetContract: optional(Website), // https://etherscan.io/address/0xdd974D5C2e2928deA5F71b9825b8b646686BD200
      bridgeContract: optional(Website),

      description: optional(string()), // shouldn't be here
      serumV3Usdc: optional(string()), // 4tSvZvnbyzHXLMTiFonMyxZoHmFqau1XArcRCVHLZ5gX
      serumV3Usdt: optional(string()), // 7dLVkUfBVfCGkFhSXDCq1ukM9usathSgS716t643iFGF
      vaultPubkey: optional(string()),

      blog: optional(Website),
      coinmarketcap: optional(Website),
      discord: optional(Website),
      facebook: optional(Website),
      github: optional(Website),
      instagram: optional(Website),
      medium: optional(Website),
      reddit: optional(Website),
      telegram: optional(Website),
      twitter: optional(Website),
      dexWebsite: optional(Website),
      linkedin: optional(Website),
      twitch: optional(Website),
      solanium: optional(Website),
      website: optional(Website),
      vault: optional(Website),
      youtube: optional(Website),
      whitepaper: optional(Website),
      telegramAnnouncements: optional(Website),
      animationUrl: optional(Website),

      waterfallbot: optional(Website),
      imageUrl: optional(Website),

      website: optional(Website),
      coingeckoId: optional(CoinGeckoId),
    })
  ),
  tags: optional(array(Tag)),
  clusters: optional(array(Cluster)),
});

const format = (ob) => {
  assert(ob, Token);
  return ob;
};

async function readFiles(dirname) {
  const dirs = (await readdir(dirname)).filter((d) => !d.startsWith("."));

  const filenames = (
    await Promise.all(
      dirs.flatMap(async (dir) => {
        const files = await readdir(join(dirname, dir));
        return files.map((f) => join(dirname, dir, f));
      })
    )
  )
    .flat()
    .filter((f) => f.endsWith(".yml"));

  const allClusters = {};

  await Promise.all(
    filenames.map(async (filename) => {
      const content = await readFile(filename, "utf-8");
      const { clusters = ["mainnet-beta"], ...data } = format(parse(content));

      clusters.forEach((cluster) => {
        allClusters[cluster] ||= {};
        allClusters[cluster].tokens ||= {};
        allClusters[cluster].tokens[basename(filename, ".yml")] = data;

        data.tags?.forEach((tag) => {
          allClusters[cluster].tags ||= {};
          allClusters[cluster].tags[tag] ||= 0;
          allClusters[cluster].tags[tag] += 1;
        });
      });
    })
  );

  const output = await Promise.all(
    Object.entries(allClusters).map(
      ([cluster, { tags: usedTags, tokens }]) => ({
        name: "Solana Token List",
        cluster,
        tags: Object.entries(usedTags)
          .sort(([a], [b]) => a.localeCompare(b))
          .reduce((acc, [tag, count]) => {
            acc[tag] = {
              ...tags[tag],
              count,
            };
            return acc;
          }, {}),
        keywords: ["solana", "spl"],
        timestamp: new Date().toISOString(),
        tokens,
      })
    )
  );

  return output;
}

const compile = async () => {
  const data = await fetch("https://api.coingecko.com/api/v3/coins/list");
  const list = await data.json();
  coingeckoIdList = new Set(list.map(({ id }) => id));

  return await readFiles(join(__dirname, "../tokens"));
};

module.exports = compile;
