import { readdir, writeFile, readFile } from "fs/promises";
import { basename, extname, join } from "path";
import { $ } from "bun";

class Fingerprint {
  MAX_BIT_ERROR = 2;
  MAX_ALIGN_OFFSET = 120;
  ref_file: string = "";
  folder_path: string = "";
  bank_file: string = "fingerprint_bank.json";
  fingerprint_bank: Record<string, string> = {};

  private _popcount(x: number): number {
    return x.toString(2).split("1").length - 1;
  }

  private compressFingerprint(fp: number[]): string {
    const buffer = new ArrayBuffer(fp.length * 4);
    const view = new Uint32Array(buffer);
    for (let i = 0; i < fp.length; i++) {
      view[i] = fp[i];
    }
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  }

  private decompressFingerprint(compressed: string): number[] {
    const bytes = Uint8Array.from(atob(compressed), (c) => c.charCodeAt(0));
    const buffer = bytes.buffer;
    const view = new Uint32Array(buffer);
    return Array.from(view);
  }

  compute_similarity(a: number[], b: number[]): number {
    const asize = a.length;
    const bsize = b.length;
    const numcounts = asize + bsize + 1;
    const counts = new Array(numcounts).fill(0);

    for (let i = 0; i < asize; i++) {
      const jbegin = Math.max(0, i - this.MAX_ALIGN_OFFSET);
      const jend = Math.min(bsize, i + this.MAX_ALIGN_OFFSET);
      for (let j = jbegin; j < jend; j++) {
        const biterror = this._popcount(a[i] ^ b[j]);
        if (biterror <= this.MAX_BIT_ERROR) {
          const offset = i - j + bsize;
          counts[offset] += 1;
        }
      }
    }

    const topcount = Math.max(...counts);
    return topcount / Math.min(asize, bsize);
  }

  async loadBank() {
    try {
      const data = await readFile(this.bank_file, "utf-8");
      const rawBank = JSON.parse(data);

      this.fingerprint_bank = {};
      for (const [filename, fp] of Object.entries(rawBank)) {
        this.fingerprint_bank[filename] = fp as string;
      }
    } catch (error) {
      this.fingerprint_bank = {};
    }
  }

  async saveBank() {
    await writeFile(
      this.bank_file,
      JSON.stringify(this.fingerprint_bank, null, 2),
    );
  }

  async fingerprint(filePath: string): Promise<number[]> {
    const fileName = basename(filePath);
    if (this.fingerprint_bank[fileName]) {
      return this.decompressFingerprint(this.fingerprint_bank[fileName]);
    }

    const result = await $`fpcalc -raw ${filePath}`.quiet();
    const fingerprint = result.stdout.toString().split("FINGERPRINT=").at(1);
    const fp = fingerprint?.split(",").map(Number) ?? [];

    this.fingerprint_bank[fileName] = this.compressFingerprint(fp);

    return fp;
  }

  async getFiles(dir: string) {
    const files = await readdir(dir);
    return files
      .filter((f) =>
        [".mp3", ".wav", ".m4a", ".flac"].includes(extname(f).toLowerCase()),
      )
      .map((f) => join(dir, f));
  }

  async find_best_match() {
    await this.loadBank();
    const start = performance.now();
    const files = await this.getFiles(this.folder_path);
    const ref = await this.fingerprint(this.ref_file);
    const promises = files.map(async (f) => {
      const fp = await this.fingerprint(f);
      const similarity = this.compute_similarity(ref, fp);
      return { file: f, similarity };
    });

    const results = (await Promise.all(promises)).filter((r) => r !== null);
    const { file, similarity } = results.sort(
      (a, b) => b.similarity - a.similarity,
    )[0];

    await this.saveBank();
    const end = performance.now();
    console.log(`${file}, ${similarity}, (Time taken: ${end - start}ms)`);

    for (const r of results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)) {
      console.log(r.file, r.similarity);
    }
  }

  constructor(ref_file: string, folder_path: string) {
    this.ref_file = ref_file;
    this.folder_path = folder_path;
  }
}

const fingerprint = new Fingerprint("song.mp3", "music");
await fingerprint.find_best_match();
