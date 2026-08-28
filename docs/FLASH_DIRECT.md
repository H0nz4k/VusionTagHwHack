# Direct flash TAG2 (bez relé)

Obětovaný testovací tag, **ne** golden. Baterie **ven**. Napájení z CC Debugger **pin 9 (3.3 V)** propojeného s **pin 2** (TVCC sense).

```bash
ssh vusion-rpi
/home/hw/bin/ov26-flash-direct.sh
# nebo
/home/hw/bin/ov26-flash-direct.sh /home/hw/OpenVusion26_FW/firmware/releases/v0.10e_nfc_show3.hex
```

Skript **nespíná relé**. USB debuggeru musí jít přímo do Pi (ne přes GPIO21). Napájení tagu = pin 9, ne GPIO17.

1. (volitelně `--isolate-dev` jen když chceš nejdřív odříznout bench DEV — to relé cvakne.)
2. Čeká USB `0451:16a2`.
3. Menu `.hex` z `build/` / `firmware/releases/`.
4. `cc-tool -t` — CC2510. Locked → `WIPE`.
5. Erase+write jen po `TAG2`.

Zapojení padů: PDF `CC2510_Debugger_schemata_v2_PCB_pinout.pdf` strana 7–8 (A1 GND měřeno; A2/A4/A5/B2 ověřit continuity). Pin 9 **jen** na ověřené DVDD, ne na A3/B3–B5.

Po flashi USB neodpojuj, pokud má tag zůstat pod napětím (zdroj je pin 9).
