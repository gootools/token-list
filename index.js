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

const Tag = define("Tag", (tag) => tags.includes(tag));

const Network = define("Network", (network) =>
  ["mainnet-beta", "devnet", "testnet"].includes(network)
);

const Token = object({
  name: string(),
  symbol: string(),
  decimals: number(),
  extensions: optional(object()),
  tags: optional(array(Tag)),
  networks: optional(array(Network)),
});

const format = (ob) => {
  assert(ob, Token);
  return ob;
};

async function readFiles(dirname) {
  const filenames = await readdir(dirname);

  const tokens = {};

  await Promise.all(
    filenames
      .filter((n) => n.endsWith(".yml"))
      .map(async (filename) => {
        const content = await readFile(dirname + filename, "utf-8");
        const { networks = ["mainnet-beta"], ...data } = format(parse(content));
        networks.forEach((network) => {
          tokens[network] ||= {};
          tokens[network][filename.split(".")[0]] = data;
        });
      })
  );

  writeFile("tokens.json", JSON.stringify(tokens, null, 2));
}

readFiles("tokens/");
