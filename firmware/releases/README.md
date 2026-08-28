# v0.10f — NFC SHOW (tři grafiky + smazání)

Uložený firmware pro **VUSION 2.6 BWR GU140** / **CC2510**.

Hex: [`v0.10e_nfc_show3.hex`](v0.10e_nfc_show3.hex) (build target stejný, banner **EXP-056 v0.10g SHOW4**)  
Zdroj: `firmware/OpenVusion26_GU140_FW_UART_DIAG/v0.10e_nfc_show3/`  
ROM: **29896 / 32768 B**  

## Co umí

TWN4 zapíše na NTAG stránku `0x30` čtyři bajty `OVH` + číslo. MCU to přečte po I²C a překreslí e-ink.

| Volba | Grafika |
|---|---|
| 1 | OpenVusionHack |
| 2 | BWR test (16 políček palety / ditheru) |
| 3 | Shut up and take my money (TagStudio `TAG_Project_2026-08-28_22-28-47`) |
| 4 | Smazat / bílá (prázdný refresh, bez čtvrté bitmapy) |

LED bliká jen při příjmu příkazu. Zhasne = čtečku můžeš sundat. Sklo se kreslí ještě ~15 s.

## Nahrát na nový tag

**Smaže celý flash CC2510.** Jen obětovaný DEV kus (originální FW už je pryč). Stock/golden tag **ne**.

Jednoduše na lab Pi (tag zapojený na CC Debugger podle AGENTS.md: GND, DVDD sense, DD, DC, RESET; pin 9 programátoru **nepřipojovat**):

```bash
ssh vusion-rpi
/home/hw/bin/ov26-flash-show.sh
```

Skript: relé attach → ověří USB `0451:16a2` a `cc-tool -t` = **CC2510** → erase+write+verify → debugger odpojí → tag nechá zapnutý.

Ručně totéž:

```bash
ssh vusion-rpi
HEX=/home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG/build/v0.10e_nfc_show3.hex
# nebo z gitu: firmware/releases/v0.10e_nfc_show3.hex

/home/hw/bin/ov26-relays.sh attach
# počkej na zelenou LED debuggeru / TVCC
lsusb | grep 0451:16a2
sudo cc-tool -t          # musí být CC2510
sudo cc-tool -v read -e -w "$HEX"
/home/hw/bin/ov26-relays.sh dbg-off
/home/hw/bin/ov26-relays.sh usb-off
/home/hw/bin/ov26-relays.sh tag-on
```

Když `cc-tool -t` neřekne CC2510, **zastav** — není to ověřený DEV target.

## Po flashe: poslat grafiku

TWN4 = `/dev/ttyACM0` (ne `ttyUSB0`).

```bash
/home/hw/bin/ov26-nfc-show.sh
```

Menu 1 / 2 / 3 / **4 smazat (bílá)** / q. **Až po volbě** přilož čtečku — appka čeká až 45 s.

Nebo rovnou:

```bash
/home/hw/bin/ov26-nfc-show.sh 1
/home/hw/bin/ov26-nfc-show.sh 2
/home/hw/bin/ov26-nfc-show.sh 3
/home/hw/bin/ov26-nfc-show.sh 4   # smazat / bílá
```

## Build ze zdroje (když hex nemáš)

Na Pi, SDCC 4.2.0:

```bash
cd /home/hw/OpenVusion26_FW/OpenVusion26_GU140_FW_UART_DIAG
./build_one.sh v0.10e_nfc_show3
```

Vznikne `build/v0.10e_nfc_show3.hex`.
