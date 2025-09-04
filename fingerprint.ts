import { readdir } from "fs/promises";
import { basename, extname, join } from "path";
import { $ } from "bun";

class Fingerprint {
  MAX_BIT_ERROR = 2;
  MAX_ALIGN_OFFSET = 120;
  ref_file: string = "";
  folder_path: string = "";

  private _popcount(x: number): number {
    return x.toString(2).split("1").length - 1;
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

  async fingerprint(filePath: string): Promise<number[]> {
    const result = await $`fpcalc -raw ${filePath}`.quiet();
    const fingerprint = result.stdout.toString().split("FINGERPRINT=").at(1);
    return fingerprint?.split(",").map(Number) ?? [];
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
    const files = await this.getFiles(this.folder_path);
    const ref = await this.fingerprint(this.ref_file);
    const promises = files.map(async (f) => {
      const fp = await this.fingerprint(f);
      return {
        file: f,
        similarity: this.compute_similarity(ref, fp),
      };
    });

    const results = (await Promise.all(promises)).filter((r) => r !== null);
    const best = results.sort((a, b) => b.similarity - a.similarity);
    for (const result of best) {
      console.log(result.file, result.similarity);
    }

    console.log(basename(best[0].file));
  }
  constructor(ref_file: string, folder_path: string) {
    this.ref_file = ref_file;
    this.folder_path = folder_path;
  }
}

const fingerprint = new Fingerprint("song.mp3", "./music");
await fingerprint.find_best_match();
