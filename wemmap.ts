import { Fingerprint } from "./fingerprint";
import { $ } from "bun";

const fingerprint = new Fingerprint();

const files = await $`ls music/`.text();
const inputs = files.split("\n").filter((f) => f.trim() !== "");

let index = 0;
for (const input of inputs) {
  console.log(`Processing ${input} (${index + 1}/${inputs.length})`);
  index++;
  const map = await Bun.file("wemmap.json").json();
  if (map[input]) continue;
  let result;
  try {
    const path = `music/${input}`;
    const { file, similarity } = await fingerprint.find_best_match(path);
    result = {
      filename: file.filename,
      similarity: similarity,
    };
  } catch (error) {
    result = {
      filename: "Could not find match",
      similarity: -1,
    };
  }
  const newmap = await Bun.file("wemmap.json").json();
  newmap[input] = result;
  Bun.write("wemmap.json", JSON.stringify(newmap, null, 2));
}
