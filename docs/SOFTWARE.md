# Software inventář — OpenVusion výzkum GU140

Vše, co jsme **napsali**, **upravili** nebo **použili** při zkoumání tagů. Cesty jsou vůči `C:\Home\Projekty\OpenVusion`, pokud není řečeno jinak. Snapshot `OpenVusion.zip` tyto stromy obsahuje; **zip do Gitu nepatří**.

Klasifikace použití:

- **VLASTNÍ** — vzniklo v tomto výzkumu
- **FORK / MIRROR** — cizí kód držený jako reference
- **HOST** — toolchain na Pi / Windows

---

## 1. Mapa `tools/` (nadřazený strom)

| Adresář | Původ | K čemu jsme ho použili |
|---|---|---|
| `tools/VusionTagHwHack` | **VLASTNÍ** | Autonomní FW výzkum CC2510: UART, EPD, relé, tato dokumentace. GitHub `H0nz4k/VusionTagHwHack`. |
| `tools/Debugger/` | **VLASTNÍ** | Debug pinout, schémata, fotky PCB, noční RF prompt. Podstrom `OpenVusion_GU140_Cursor_Agent_Project` = NFC/RF/TagSet checkout stejného GitHubu (`feature/tagset`). |
| `tools/ElaTool` | **VLASTNÍ** | Read-only NFC diagnostika přes TWN4: dump EEPROM, NDEF, session, Logic Analyzer, blok `0x30–0x37`. |
| `tools/PCSniff` | **VLASTNÍ** | Windows probe TWN4, sdílí engine s ElaTool. Bez Pi. |
| `tools/HWSniff` | **VLASTNÍ** | Headless capture na Pi Zero 2 W (tlačítka, DIP, LED). Terénní sběr NTAG / FeliCa. |
| `tools/RPIrelay` | **VLASTNÍ** | První GPIO relé + cold-boot NFC cykly na Pi 3. Předchůdce `ov26-relays.sh`. |
| `tools/Donge` | **VLASTNÍ** | Firmware **nRF52840 dongle** = RF Probe 0.3–0.7.2 (Zephyr). RSSI sweep 2.4 GHz, bez TX paketů. |
| `tools/Waterfall` | **VLASTNÍ** | Web UI spectrum + capture center k RF Probe. Není dekódér Vusion paketů. |
| `tools/TagTinker` | FORK | Flipper Zero IR ESL. **Jiná rodina tagů** (infra), ne GU140 CC2510. |
| `tools/VUSION4.2BWR_GL340` | FORK (`fanhuanji`) | Referenční NFC+EPD na **4.2″ GL340**. Z něj GPIO mapa, LED P2_1/P2_2, CoG nápověda. |
| `tools/SES-Imagotag-UU340` | FORK (`beatskip`) | **Jiný MCU** (AX8052). Pinout a EPD nápověda, ne flashovat na GU140. |
| `tools/OpenEPaperLink` | FORK | Cizí ESL stack (ESP32 AP). Kontext trhu, ne náš protokol. |
| `tools/weatherEpaperDisplay` | FORK | Výměna MCU za ESP8266 na mrtvém 2.6″ panelu. Ukázalo, že sklo jde budit zvenku. |
| `tools/TagStudio` | **VLASTNÍ** (v Debugger checkout) | BWR editor 296×152 / 400×300, export BIN/C, paleta 01–16. |
| `elatec/` (kořen OpenVusion) | **VLASTNÍ** / vendor | TWN4 skripty, poznámky k čtečce. |

Zip archivy vedle složek (`Debugger.zip`, `ElaTool.zip`, `RPIrelay.zip`, `TagStudio.zip`) jsou zálohy. Do Gitu je nedávej.

---

## 2. Vlastní firmware CC2510 (SDCC)

Hostitel: Pi `hw`, SDCC 4.2.0 `#13081`. Parametry: `-mmcs51 -pcc2510fx --model-small --iram-size 256 --xram-loc 0xF000 --xram-size 0xF00 --code-size 32768`. Artifact `.hex`. Od v0.4c+ `--nooverlay`.

### Tento checkout (`research/gu140`)

```text
firmware/OpenVusion26_GU140_FW_UART_DIAG/
  v0.3a … v0.3k   UART, clock, LED, reset
  v0.4a … v0.4l   EPD žebřík → OpenVusionHack
firmware/v0.1_ledtest
firmware/v0.2_p2_static
```

Known-good EPD: **`v0.4k_bwr_19`** (neměnit). First content: **`v0.4l_ovhack`**.

### Sourozenec `feature/tagset` (Debugger project)

```text
v0.5a_rf_dump … v0.5d_rf_txping
v0.6a … v0.6f     NFC I²C ACK / EEPROM
v0.7a … v0.7b     NFC FD + LED
v0.8a             NFC → refresh
v0.9a … v0.9e     SHOW 1–4, BWR test
v0.10a … v0.10i   SHOW TWN4 + Android NDEF
v0.11a … v0.11i   SRAM / PTHRU / mirror
v0.12a_nfc_proto  OVMB bez EPD
v0.12b_nfc_epd    OVMB + CoG 0x12   ← mailbox release
```

Build: `firmware/OpenVusion26_GU140_FW_UART_DIAG/build_one.sh` (CRLF z Windows nejdřív `tr -d '\r'`).

---

## 3. Lab host na Raspberry Pi

| Nástroj | Účel |
|---|---|
| `cc-tool` | erase/write/verify CC2510. `-t` musí říct CC2510. |
| `/home/hw/bin/ov26-relays.sh` | `idle` / `attach` / `reconnect` / `twn4-on` / `tag-on`. GPIO 17/27/21/20. |
| `ov26-relays-idle.service` | boot → všechny cívky OFF |
| `ov26-relays-guard.timer` | každé 2 s: vstup → `op dh` (nikdy `ip`) |
| `/home/hw/bin/ov26-flash-show.sh` | DEV flash SHOW hex |
| `/home/hw/bin/ov26-flash-direct.sh` | TAG2, pin 9, bez relé |
| `/home/hw/bin/ov26-nfc-show.sh` | TWN4 `OVH`+n na page `0x30` |
| `tag-flash-latest` / `tag-send-image` | release `v0.12b` + OVMB BIN |
| `pinctrl` | ruční `dl`/`dh` |
| UART device | `/dev/serial/by-id/usb-Silicon_Labs_CP2102_…-port0` 115200 8N1 |
| TWN4 | `/dev/ttyACM0` (`09d8:0420`), **ne** `ttyUSB0` |

Windows skripty v tomto repo: `scripts/` (pull-from-rpi, gen_ovhack, Pi flash/UART helpery). CRLF → LF před spuštěním na Pi.

---

## 4. NFC software

### ElaTool (`tools/ElaTool`)

Python balíček `elatec_uid_tool`. Výchozí režim **read-only**.

Umí: UID, `GET_VERSION`, `READ`/`FAST_READ`, dump 0x00–0xE1, NDEF, compare, config/session registry, Logic Analyzer, Trigger Analysis, Application Block `0x30–0x37`, Field Collector API pro HWSniff.

Stock naměřeno (OVĚŘENO ElaTool):

```text
UID 04367F5A2D7280
GET_VERSION 00 04 04 05 02 02 13 03
NDEF https://nfc.imagotag.com/AA2CD0C9
SES ID AA2CD0C9  (EEPROM LE: C9 D0 2C AA)
```

Vlastní FW stock NDEF/SES protokol **neimplementuje**.

### PCSniff / HWSniff

- **PCSniff** — jeden COM, jeden tag, jeden capture na Windows.
- **HWSniff v2.1** — Pi Zero 2 W, GPIO tlačítka/LED, NTAG nebo FeliCa dispatch. Spec: `tools/HWSniff/HW/`.

### nfc_gateway + TagSet (Debugger checkout)

- `tools/nfc_gateway/` — `ovh-nfc` CLI, `show_app.py`, field-watch.
- `tools/tagset/` + `tagset-app/` — Local/SSH GUI, flash DEV, poslání BIN.
- Protokol mailbox: OVMB v1, 64 B rámce, 11 248 B obraz. Viz [`nfc/README.md`](nfc/README.md).

### TagStudio 0.3.0

Lokální prohlížečový editor B/W/R (credit HanzG). Export PNG / BIN / C. Paleta 01–16. Native GU140 = 296×152; 400×300 se na 2.6″ jen letterboxuje.

---

## 5. RF software (mimo CC2510 OTA)

Dvě **oddělené** RF větve. Nesměšuj je.

| Větev | Hardware | Účel | OTA na GU140 |
|---|---|---|---|
| **RF Probe + WaterFall** | nRF52840 dongle | pasivní RSSI 2400–2500 MHz, capture timeline | **ne** — energy inference, ne pakety Vusion |
| **OVH RF v0.1** | CC2510 + plánovaný CC2500 na Pi | vlastní GFSK protokol | UART dump/IDLE/RX **OVĚŘENO**; OTA **ne** (chybí CC2500) |

### Donge / RF Probe

Zephyr firmware `OpenVusion_RF_Probe_v0.7.2` (aktuální kandidát). Příkazy `PING`, `SCAN`, `WATCH`, `BURST`. **Žádný** `TASKS_TXEN`, **žádný** packet RX/EasyDMA. 0.6.1 byla HW-ověřená USB+RSSI základna.

### WaterFall 0.4.1

Web: spectrum, waterfall, SQLite capture, korelace NFC/GPIO markerů. Silný RSSI na 2453 MHz **není** „Vusion paket“.

### rf_gateway

Python unit testy + `cli.py probe`. Bez `/dev/spidev*` korektně končí. Profil `OVH_RF_PROFILE_0`: 2433 MHz, ~10 kBaud GFSK. Viz [`rf/README.md`](rf/README.md).

---

## 6. Debugger složka (`tools/Debugger`)

Vlastní laboratorní dokumentace **před** autonomním FW repo:

| Soubor | Obsah |
|---|---|
| `01_hardware_a_pinout.md` | CC Debugger piny, 5pad skupiny na PCB |
| `02_bezpecny_postup.md` | pořadí napájení |
| `03_smartrf_a_dump_plan.md` | plán radio dump |
| `04_testovaci_pripravek.md` | přípravek |
| `05_zjisteni_a_otevrene_body.md` | otevřené otázky |
| `CC2510_Debugger_schemata*.pdf` | schémata + TAG2 bez baterie |
| `photos/` | PCB, debugger, sklo, lab (zkopírováno do `captures/hw/`) |
| `OpenVusion_GU140_Cursor_Agent_Project/` | živý NFC/TagSet/RF checkout |

---

## 7. RPIrelay — historický předchůdce

`tools/RPIrelay`: cold-boot cyklus baterie přes jedno relé (GPIO17), TWN4 SRAM_RF_READY, read-only. Polarita se zadávala ručně. Dnešní lab má čtyři relé a `ov26-relays.sh`. Captures v `RPIrelay/capture/` jsou historické.

---

## 8. Cizí reference (FORK) — co z nich bereme

| Projekt | Bereme | Nebereme |
|---|---|---|
| **VUSION4.2BWR_GL340** | P0_0 PWR, P0_3 MOSI, P2_0 RESET, P2_1/P2_2 LED, NFC I²C 0xAA | slepý flash 4.2″ binárky na GU140 |
| **SES UU340** | obecná ESL anatomie | AX8052 bootloader / FM11NT NFC |
| **OpenEPaperLink** | existence otevřených ESL AP | 802.15.4 stack, ZBS flasher |
| **weatherEpaperDisplay** | potvrzení, že 2.6″ sklo lze budit cizím MCU | odstranění CC2510 na DEV |
| **TagTinker** | nic pro GU140 RF/NFC | IR protokol Flipperu |

---

## 9. Windows / Cursor

- Lokální source of truth: tento adresář v Cursoru.
- SSH alias `vusion-rpi` (klíč, bez hesla).
- PowerShell maže `$` a Python quoting → skripty na Pi posílat přes `scp` + `tr -d '\r'`.
- Agent pravidla: `AGENTS.md`, `.cursor/rules/openvusion-gu140.mdc`.

---

## 10. Co do tohoto GitHub repo nepatří

- `OpenVusion.zip` (~1.9 GB)
- `*.zip` zálohy tools
- ElaTool raw cycle BIN/JSON dumpů (objemné, částečně session data)
- Zephyr `build/` stromy z Donge
- hesla, tokeny, `secrets.py` hodnoty
