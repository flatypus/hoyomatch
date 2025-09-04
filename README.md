## Genshin OST Fingerprint & Audio Extractor

Two small services for those trying to do stuff with Genshin's audio files. Set up on Mac, but helper services should be the same

### HoyoMatch: Accepts any `.mp3` & finds the closest song match from OST database

Prerequisites: 
1. Install `chromaprint` (`brew install chromaprint`)
2. Install `bun`

Exec: `bun run fingerprint.ts`

### Extractor: Extracts `.mp3` files from Genshin's raw `.pck` format w/ ~128kbps

Prerequisites:
1. Be on Mac (other Unix should require the [appropriate `quickbms` executable](https://aluigi.altervista.org))
2. Have an android with genshin
3. Enable USB debugging
4. Connect your phone via. USB cable w/ data transfer
5. Install `vgmstream` (`brew install vgmstream`)
7. Install `ffmpeg`
8. (Optional) Install `adb` and run `adb start-server && adb shell`, check connectivity
9. Install `bun`

Exec: `bun run extractor.ts`

Credits:
- @aluigi (`quickbms`)
- @AlphaTwentyThree (`wavescan.bms`)
- @dvingerh [Genshin Audio Exporter](https://github.com/dvingerh/genshin-audio-exporter)
- Lukáš Lalinský (`chromaprint` and `fpcalc`)