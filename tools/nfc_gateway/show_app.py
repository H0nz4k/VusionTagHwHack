#!/usr/bin/env python3
"""OpenVusion NFC SHOW — choose graphic 1/2/3/4 and write it to the DEV tag.

TWN4 only on /dev/ttyACM0. Never ttyUSB0 (CP2102 UART).
Run on the Pi:  python3 /home/hw/OpenVusion26_FW/tools/nfc_gateway/show_app.py
Or:             /home/hw/bin/ov26-nfc-show.sh
"""
from __future__ import annotations

import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

CHOICES = (
    (1, "OpenVusionHack", "Logo OpenVusionHack (ověřená grafika v0.4l)."),
    (2, "BWR test", "16 políček: plná bílá/černá/červená a dither vzory 01–16."),
    (3, "Shut up and take my money", "TagStudio export 2026-08-28_22-28-47, 296×152 BWR."),
    (4, "Smazat / bílá", "Jen refresh: obě roviny nuly, sklo na bílou."),
)

def _print_menu() -> None:
    print()
    print("OpenVusion GU140  —  NFC SHOW")
    print("Nejdřív volba 1/2/3/4, potom přilož TWN4 na tag.")
    print("LED bliká = držet, LED zhasne = můžeš odejít. Sklo ještě ~15 s.")
    print()
    for n, title, desc in CHOICES:
        print(f"  {n}  {title}")
        print(f"     {desc}")
    print()
    print("  q  Konec")
    print()


def main() -> int:
    import cli as ovh_nfc

    while True:
        _print_menu()
        try:
            raw = input("Volba [1/2/3/4/q]: ").strip().lower()
        except EOFError:
            print()
            return 0
        if raw in ("q", "quit", "exit"):
            return 0
        if raw not in ("1", "2", "3", "4"):
            print("Zadej 1, 2, 3, 4 nebo q.")
            continue
        title = next(t for n, t, _d in CHOICES if n == int(raw))
        print()
        print(f"Volba {raw}: {title}")
        print("Teď přilož TWN4 na tag. Čekám, až ho čtečka uvidí (max 45 s).")
        print("Až LED zhasne, čtečku sundej.")
        rc = ovh_nfc.main(["--port", "/dev/ttyACM0", "show", raw, "--wait", "45"])
        if rc == 0:
            print("Zápis OK. LED zhasne → odejdi. Sklo může ještě refreshovat.")
        elif rc == 2:
            print("Tag v poli TWN4 nenašel (timeout).")
        else:
            print(f"SHOW selhalo (kód {rc}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
