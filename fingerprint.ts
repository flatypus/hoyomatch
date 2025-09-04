import { readdir, writeFile, readFile } from "fs/promises";
import { extname, join } from "path";
import { $ } from "bun";
import { compute_similarity, decompressFingerprint } from "./lib";

type FingerprintRecord = {
  filename: string;
  metadata: string;
  fingerprint: string;
};

type FingerprintBank = FingerprintRecord[];

export class Fingerprint {
  bank_file: string = "fingerprint_bank.json";

  compressFingerprint(fp: Uint32Array): string {
    const buffer = new ArrayBuffer(fp.length * 4);
    const view = new Uint32Array(buffer);
    for (let i = 0; i < fp.length; i++) {
      view[i] = fp[i];
    }
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  }

  async loadBank(): Promise<FingerprintBank> {
    try {
      const data = await readFile(this.bank_file, "utf-8");
      return JSON.parse(data) as FingerprintRecord[];
    } catch (error) {
      return [];
    }
  }

  async setupBank(folder_path: string) {
    const directory = await readdir(folder_path);
    const files: { path: string; filename: string; metadata: string }[] = [];

    for (const f of directory) {
      const accepted_extensions = [".mp3", ".wav", ".m4a", ".flac"];
      if (!accepted_extensions.includes(extname(f).toLowerCase())) continue;
      const full_path = join(folder_path, f);
      // my config, depending on how you download the ost dump, your file names may be different
      const split = f.split("._");
      const metadata = split.slice(0, -1).join("._");
      const filename = split.at(-1);
      files.push({
        path: full_path,
        filename: filename ?? "",
        metadata: metadata,
      });
    }

    const fingerprint_bank: FingerprintBank = [];

    await Promise.all(
      files.map(async (f) => {
        const fp = await this.fingerprint(f.path);
        const compressed_fp = this.compressFingerprint(fp);
        fingerprint_bank.push({
          filename: f.filename,
          fingerprint: compressed_fp,
          metadata: f.metadata,
        });
      }),
    );

    await writeFile(this.bank_file, JSON.stringify(fingerprint_bank, null, 2));
  }

  async fingerprint(filePath: string): Promise<Uint32Array> {
    const result = await $`fpcalc -raw ${filePath}`.quiet();
    const fingerprint = result.stdout.toString().split("FINGERPRINT=").at(1);
    const fp = fingerprint?.split(",").map(Number) ?? [];
    return new Uint32Array(fp);
  }

  async find_best_match(ref_file: string) {
    await this.loadBank();
    const start = performance.now();
    const bank = await this.loadBank();
    const ref = await this.fingerprint(ref_file);
    console.log(`Matching ${ref_file}:`);

    const results: { file: FingerprintRecord; similarity: number }[] = [];

    for (let i = 0; i < bank.length; i++) {
      const progress = ((i + 1) / bank.length) * 100;
      const barLength = 40;
      const filledLength = Math.round((barLength * (i + 1)) / bank.length);
      const bar =
        "█".repeat(filledLength) + "░".repeat(barLength - filledLength);

      process.stdout.write(
        `\r[${bar}] ${progress.toFixed(1)}% (${i + 1}/${
          bank.length
        }) Processing...`,
      );

      const f = bank[i];
      const fp = decompressFingerprint(f.fingerprint);
      const similarity = compute_similarity(ref, fp);
      results.push({
        file: f,
        similarity: parseFloat((similarity * 100).toFixed(4)),
      });
    }

    const { file, similarity } = results.sort(
      (a, b) => b.similarity - a.similarity,
    )[0];

    const end = performance.now();

    process.stdout.write(
      `\r[${"█".repeat(40)}] 100.0% (${bank.length}/${
        bank.length
      }) Complete!     \n\n`,
    );

    console.log("Top 5 results:");
    console.log("=".repeat(100));
    results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .forEach(({ file, similarity: s }) => {
        console.log(`${file.filename}, ${s}% ${s > 80 ? "🔥" : ""}`);
      });
    console.log("=".repeat(100), "\n");
    console.log(
      `Best: ${file.filename}, ${similarity}% (Time taken: ${end - start}ms)`,
    );
    console.log(`Metadata: ${file.metadata}\n`);
    return { file, similarity };
  }
}

const fingerprint = new Fingerprint();
// await fingerprint.setupBank("../ost"); --> // setting up my bank
// await fingerprint.find_best_match("music/Music31_32.mp3"); // --> Whisper_of_Domus_Aurea.flac, 24.6855%
