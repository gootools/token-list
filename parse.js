const { tokens } = require("./solana.tokenlist.json");
const { stringify } = require("yaml");
const { writeFile } = require("fs/promises");

const tags = {}

const parse = async () => {

  await Promise.all(
    tokens
      .filter((t) => t.chainId === 101)
      .map(async ({ chainId, address, logoURI, ...rest }) => {
        // const ob = stringify(rest)
        rest.tags?.forEach(tag => {tags[tag] = {}})
        // await writeFile(`tokens/${address}.yml`, ob)
      }
      )
  );

  console.log(JSON.stringify(tags,null,2))
}


parse()
