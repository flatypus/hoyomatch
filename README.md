### genshin audio stripper (android -> macos)

Extracts `.mp3` files from Genshin's raw `.pck` format w/ ~128kbps

Prerequisites:
1. Be on Mac (other Unix should require the [appropriate `quickbms` executable](https://aluigi.altervista.org))
2. Have an android with genshin
3. Enable USB debugging
4. Connect your phone via. USB cable w/ data transfer
5. Install `adb` and run `adb start-server && adb shell`, check connectivity
6. Install `vgmstream` (`brew install vgmstream`)
7. Install `ffmpeg`
8. Install `bun`

Exec:
`bun run music.ts`

Credits:
- @aluigi (`quickbms`)
- @AlphaTwentyThree (`wavescan.bms`)
- @dvingerh [Genshin Audio Exporter](https://github.com/dvingerh/genshin-audio-exporter)