import { $ } from "bun";

const INPUT_PATH = "Music1.pck";

// await $`adb pull /sdcard/Android/data/com.miHoYo.GenshinImpact/files/AudioAssets/${INPUT_PATH}`;

const TMPPATH = `.temp/${INPUT_PATH}`;
const OUTPATH = `music`;
await $`mkdir -p ${TMPPATH} ${OUTPATH}`;
const text =
  await $`sh -c "./quickbms -k wavescan.bms ${INPUT_PATH} ${TMPPATH}"`.text();

await Promise.all(
  text
    .split("\n")
    .map((f) => f.split("  ").at(-1)?.trim())
    .filter((f): f is string => Boolean(f))
    .map(async (raw_f) => {
      const wem_f = `"${TMPPATH}/${raw_f}"`;
      const esc_f = raw_f.replace(/~.*(?=\.wem$)/, "");
      const wav_f = `"${TMPPATH}/${esc_f}.wav"`;
      await $`sh -c 'vgmstream-cli -o ${wav_f} ${wem_f}'`;
      const o_f = `"${OUTPATH}/${esc_f.replace(".wem", ".mp3")}"`;
      await $`sh -c 'ffmpeg -y -v -8 -i ${wav_f} ${o_f}'`;
    }),
);

await $`sh -c 'rm -rf ${TMPPATH}'`;
console.log("Done!");
