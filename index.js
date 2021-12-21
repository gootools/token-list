const { readdir, readFile, writeFile } = require("fs/promises");
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

const tags = require("./tags.json");

const Tag = define("Tag", (tag) => Boolean(tags[tag]));

const Network = define("Network", (network) =>
  ["mainnet-beta", "devnet", "testnet"].includes(network)
);

const re = RegExp(/https?:/);
const Website = define("Website", (url) => re.test(new URL(url).protocol));

const Token = object({
  name: string(),
  symbol: string(),
  decimals: number(),
  extensions: optional(
    object({
      website: optional(Website),
      coingeckoId: optional(string()),
    })
  ),
  tags: optional(array(Tag)),
  networks: optional(array(Network)),
});

const format = (ob) => {
  assert(ob, Token);
  return ob;
};

async function readFiles(dirname) {
  const filenames = await readdir(dirname);

  const allNetworks = {};

  await Promise.all(
    filenames
      .filter((n) => n.endsWith(".yml"))
      .map(async (filename) => {
        const content = await readFile(dirname + filename, "utf-8");
        const { networks = ["mainnet-beta"], ...data } = format(parse(content));
        networks.forEach((network) => {
          allNetworks[network] ||= {};
          allNetworks[network].tokens ||= {};
          allNetworks[network].tokens[filename.split(".")[0]] = data;

          data.tags.forEach((tag) => {
            allNetworks[network].tags ||= {};
            allNetworks[network].tags[tag] ||= 0;
            allNetworks[network].tags[tag] += 1;
          });
        });
      })
  );

  await Promise.all(
    Object.entries(allNetworks).map(([network, {tags: usedTags, tokens}]) =>
      writeFile(
        `${network}.json`,
        JSON.stringify(
          {
            name: "Solana Token List",
            network,
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
          },
          null,
          2
        )
      )
    )
  );
}

readFiles("tokens/");
