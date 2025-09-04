# Genshin OST Fingerprint Recognition & Audio Extractor

Two small services for those trying to do stuff with Genshin's audio files. Set up on Mac, but helper services should be the same. 
Additionally comes with full wemmap.json (maps Genshin internal .wem file to OST name) as of 5.8

## HoyoMatch: Finds the closest song match from OST database
- Uses C w/ bun FFI for ~48x speedup (4 min -> 5 seconds)
- Searches over 1400+ songs to find closest match

Prerequisites: 
1. Install `chromaprint` (`brew install chromaprint`)
2. Install `bun`

Exec: `bun run fingerprint.ts`

<img width="1030" height="302" alt="image" src="https://github.com/user-attachments/assets/b19d600e-2131-4277-9176-ceff06c16552" />

## Extractor: Extracts `.mp3` files from Genshin's raw `.pck` format

Prerequisites:
1. Be on Mac (other Unix should require the [appropriate `quickbms` executable](https://aluigi.altervista.org))
2. Have an android with genshin
3. Enable USB debugging
4. Connect your phone via. USB cable w/ data transfer
5. Install `vgmstream` (`brew install vgmstream`)
7. Install `ffmpeg`
8. (Optional, if pulling from phone) Install `adb` and run `adb start-server && adb shell`, check connectivity
9. Install `bun`

Exec: `bun run extractor.ts`

Credits:
- @aluigi (`quickbms`)
- @AlphaTwentyThree (`wavescan.bms`)
- @dvingerh [Genshin Audio Exporter](https://github.com/dvingerh/genshin-audio-exporter)
- Lukáš Lalinský (`chromaprint` and `fpcalc`)
