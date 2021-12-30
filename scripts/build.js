const { mkdir, writeFile } = require("fs/promises");
const compile = require("./compile");

(async () => {
  const output = await compile();

  console.log(output);

  await mkdir("out", { recursive: true });

  await Promise.all(
    output.flatMap((item) =>
      Promise.all([
        writeFile(`out/${item.cluster}.json`, JSON.stringify(item, null, 2)),
        writeFile(`out/${item.cluster}.min.json`, JSON.stringify(item)),
      ])
    )
  );
})();
