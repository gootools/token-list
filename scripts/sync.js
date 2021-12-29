const { tokens } = require("../solana.tokenlist.json");
const { stringify } = require("yaml");
const { writeFile, mkdir } = require("fs/promises");

// const tags = {};

const parse = async () => {
  await mkdir(`tokens`, { recursive: true });

  await Promise.all(
    tokens
      .filter((t) => t.chainId === 101)
      .map(async ({ chainId, address, logoURI, ...rest }) => {
        const ob = stringify(rest);
        // rest.tags?.forEach(tag => {tags[tag] = {}})
        await mkdir(`tokens/${address[0].toLowerCase()}`, { recursive: true });
        await writeFile(
          `tokens/${address[0].toLowerCase()}/${address}.yml`,
          ob
        );
      })
  );

  // console.log(JSON.stringify(tags,null,2))
};

parse();
