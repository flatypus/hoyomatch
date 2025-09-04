import { Fingerprint } from "./fingerprint";
import { $ } from "bun";

const fingerprint = new Fingerprint();

const files = await $`ls music/`.text();
const inputs = files.split("\n").filter((f) => f.trim() !== "");

for (const input of inputs) {
  const map = await Bun.file("wemmap.json").json();
  if (map[input]) continue;
  try {
    const path = `music/${input}`;
    const { file, similarity } = await fingerprint.find_best_match(path);
    map[input] = {
      filename: file.filename,
      similarity: similarity,
    };
  } catch (error) {
    map[input] = {
      filename: "Could not find match",
      similarity: -1,
    };
  }
  Bun.write("wemmap.json", JSON.stringify(map, null, 2));
}
