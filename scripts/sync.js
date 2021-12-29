const { tokens } = require("../solana.tokenlist.json");
const { stringify } = require("yaml");
const { writeFile, mkdir } = require("fs/promises");

const CLUSTERS = {
  101: "mainnet-beta",
  102: "testnet",
  103: "devnet",
};

const ob = {};

const go = async () => {
  tokens
    // load mainnet tokens first
    .sort((a, b) => a.chainId - b.chainId)
    .map(({ chainId, address, logoURI, ...rest }) => {
      if (!CLUSTERS[chainId]) {
        console.error(`invalid chain ${chainId}`);
        return null;
      }

      rest.clusters = Array.from(
        new Set((ob[address]?.clusters || []).concat(CLUSTERS[chainId]).sort())
      );

      ob[address] = rest;
    });

  await Promise.all(
    Object.entries(ob).map(async ([address, { clusters, ...rest }]) => {
      const dir = `tokens/${address[0].toLowerCase()}`;
      await mkdir(dir, { recursive: true });
      if (clusters.toString() !== "mainnet-beta") {
        rest.clusters = clusters;
      }
      await writeFile(`${dir}/${address}.yml`, stringify(rest));
    })
  );
};

go();
