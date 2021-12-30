require("isomorphic-fetch");
const { stringify } = require("yaml");
const { writeFile, mkdir } = require("fs/promises");
const { join } = require("path");

const CLUSTERS = {
  101: "mainnet-beta",
  102: "testnet",
  103: "devnet",
};

/**
 * fetches all tokens from the original repo
 */
const sync = async () => {
  const req = await fetch(
    "https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json"
  );
  const { tags, tokens } = await req.json();

  const ob = {};

  const allTags = new Set();

  tokens
    // load mainnet tokens first
    .sort((a, b) => a.chainId - b.chainId)
    .map(({ chainId, address, logoURI, tags, ...rest }) => {
      if (!CLUSTERS[chainId]) {
        console.error(`invalid chain ${chainId}`);
        return null;
      }

      rest.clusters = Array.from(
        new Set((ob[address]?.clusters || []).concat(CLUSTERS[chainId]).sort())
      );

      if (tags && tags.length > 0) {
        rest.tags = tags.sort(([a], [b]) => a.localeCompare(b));

        rest.tags.forEach((tag) => allTags.add(tag));
      }

      ob[address] = rest;
    });

  await Promise.all([
    writeFile(
      join(__dirname, "../tags.json"),
      JSON.stringify(
        Object.entries(tags)
          .sort(([a], [b]) => a.localeCompare(b))
          .reduce(
            (acc, [k, v]) => {
              acc.original[k] = v;
              return acc;
            },
            {
              original: {},
              extra: [...allTags]
                .sort((a, b) => a.localeCompare(b))
                .filter((t) => !tags[t]),
            }
          ),
        null,
        2
      )
    ),

    ...Object.entries(ob).map(async ([address, { clusters, ...rest }]) => {
      const dir = `tokens/${address[0].toLowerCase()}`;
      await mkdir(dir, { recursive: true });
      if (clusters.toString() !== "mainnet-beta") {
        rest.clusters = clusters;
      }
      await writeFile(`${dir}/${address}.yml`, stringify(rest));
    }),
  ]);
};

sync();
