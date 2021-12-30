const { mkdir, writeFile } = require("fs/promises");
const compile = require("./compile");
const { join } = require("path");

(async () => {
  const output = await compile();

  const dir = join(__dirname, "../out/v1");

  await mkdir(dir, { recursive: true });

  await Promise.all(
    output.flatMap((item) =>
      Promise.all([
        writeFile(
          join(dir, `${item.cluster}.json`),
          JSON.stringify(item, null, 2)
        ),
        writeFile(join(dir, `${item.cluster}.min.json`), JSON.stringify(item)),
      ])
    )
  );
})();
