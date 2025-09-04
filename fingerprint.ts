import { readdir, writeFile, readFile } from "fs/promises";
import { basename, extname, join } from "path";
import { $ } from "bun";

type FingerprintRecord = {
  filename: string;
  metadata: string;
  fingerprint: string;
}

type FingerprintBank = FingerprintRecord[];


class Fingerprint {
  MAX_BIT_ERROR = 2;
  MAX_ALIGN_OFFSET = 120;
  bank_file: string = "fingerprint_bank.json";

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

  async loadBank(): Promise<FingerprintBank> {
    try {
      const data = await readFile(this.bank_file, "utf-8");
      return JSON.parse(data) as FingerprintRecord[];
    } catch (error) {
     return []
    }
  }

  async setupBank(folder_path: string) {
    const directory = await readdir(folder_path);
    const files: { path: string, filename: string, metadata: string }[] = []
    
    for (const f of directory) {
      const accepted_extensions = [".mp3", ".wav", ".m4a", ".flac"];
      if (!accepted_extensions.includes(extname(f).toLowerCase())) continue
      const full_path = join(folder_path, f)
      // my config, depending on how you download the ost dump, your file names may be different
      const split = f.split("._")
      const metadata = split.slice(0, -1).join("._")
      const filename = split.at(-1)
      files.push({
        path: full_path,
        filename: filename,
        metadata: metadata 
      })
    }

    const fingerprint_bank: FingerprintBank = [];

    await Promise.all(files.map(async (f) => {
      const fp = await this.fingerprint(f.path);
      const compressed_fp = this.compressFingerprint(fp);
      fingerprint_bank.push({ filename: f.filename, fingerprint: compressed_fp, metadata: f.metadata });
    }))

    await writeFile(
      this.bank_file,
      JSON.stringify(fingerprint_bank, null, 2)
    );
  }

  async fingerprint(filePath: string): Promise<number[]> {
    const result = await $`fpcalc -raw ${filePath}`.quiet();
    const fingerprint = result.stdout.toString().split("FINGERPRINT=").at(1);
    const fp = fingerprint?.split(",").map(Number) ?? [];
    return fp;
  }


  async find_best_match(ref_file: string) {
    await this.loadBank();
    const start = performance.now();
    const bank = await this.loadBank();
    const ref = await this.fingerprint(ref_file);

    
    const results: { file: FingerprintRecord, similarity: number }[] = [];

    for (let i = 0; i < bank.length; i++) {
      console.log(`Processing ${i} of ${bank.length}`)
      const f = bank[i];
      const fp = this.decompressFingerprint(f.fingerprint);
      const similarity = this.compute_similarity(ref, fp);
      results.push({ file: f, similarity });
    }

    const { file, similarity } = results.sort(
      (a, b) => b.similarity - a.similarity,
    )[0];

    const end = performance.now();
    console.log(`${file}, ${similarity}, (Time taken: ${end - start}ms)`);

    console.log("Top 10 results:")
    for (const r of results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)) {
      console.log(r.file.filename, r.similarity, `(${r.file.metadata})`);
    }
  }
}

const fingerprint = new Fingerprint();
// await fingerprint.setupBank("../ost");
await fingerprint.find_best_match("song.mp3");
