import { $ } from "bun";

const INPUT_PATH = "Music1.pck";

await $`adb pull /sdcard/Android/data/com.miHoYo.GenshinImpact/files/AudioAssets/${INPUT_PATH}`;

const TMPPATH = `.temp/${INPUT_PATH}`;
const OUTPATH = `music`;
await $`mkdir -p ${TMPPATH} ${OUTPATH}`;
const text =
  await $`sh -c "./quickbms -k wavescan.bms ${INPUT_PATH} ${TMPPATH}"`.text();

text
  .split("\n")
  .map((f) => /Music.+\.wem/g?.exec(f)?.[0])
  .filter(Boolean)
  .map((f) => `${TMPPATH}/${f}`)
  .forEach(async (f) => {
    await $`sh -c 'vgmstream-cli "${f}"`;
    const i_f = `"${f}.wav"`;
    const o_f = `"${f.replace(TMPPATH, OUTPATH).replace(".wem", ".mp3")}"`;
    await $`sh -c 'ffmpeg -y -i ${i_f} ${o_f}'`;
    await $`sh -c 'rm -f "${f}" ${i_f}'`;
  });
