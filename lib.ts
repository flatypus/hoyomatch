import { cc } from "bun:ffi";

// using ffi c should be like 10x faster (2 minutes -> 5 seconds)
const { symbols } = cc({
  source: "./lib.c",
  symbols: {
    compute_similarity: {
      args: ["ptr", "int", "ptr", "int"],
      returns: "double",
    },
    bytesToUint32Array: {
      args: ["ptr", "int", "ptr", "int"],
      returns: "int",
    },
  } as const,
});

const {
  compute_similarity: _compute_similarity,
  bytesToUint32Array: _bytesToUint32Array,
} = symbols;

export function compute_similarity(
  fingerprint1: Uint32Array,
  fingerprint2: Uint32Array,
) {
  const result = _compute_similarity(
    fingerprint1,
    fingerprint1.length,
    fingerprint2,
    fingerprint2.length,
  );
  return result;
}

export function decompressFingerprint(compressedStr: string): Uint32Array {
  const binaryString = atob(compressedStr);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const result = new Uint32Array(Math.floor(bytes.length / 4));
  const length = _bytesToUint32Array(
    bytes,
    bytes.length,
    result,
    result.length,
  );

  return result.slice(0, length);
}
