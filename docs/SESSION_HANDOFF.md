# Session Handoff

## Firmware na malém DEV (relé)

Poslední **v tomto checkoutu** zdokumentovaný EPD: `v0.4l_ovhack`.  
Na stejném stole později běžely (sourozenec, DEV only): `v0.10i BIG` SHOW a `v0.12b_nfc_epd` mailbox. Handoff z NFC větve říká pinovaný release `v0.12b_nfc_epd`.

Před flashem vždy `cc-tool -t` = CC2510 a `ov26-relays.sh attach` (nebo `idle` + přímý USB u TAG2).

## Velký tag (TAG2) — čeká na člověka

Clip debugger pin 2 (TVCC) ↔ pin 9 (3.3 V), baterie ven, USB debuggeru **přímo** do Pi. Relé 17/27/21/20 zůstat `dh`. Agent **neflashuje**, dokud nepřijde potvrzení DEV + zapojení.

## Encoding

```text
WHITE = plane10 0, plane13 0
BLACK = plane10 1, plane13 0
RED   = plane10 0, plane13 1
native row = 19 bytes, 296 rows, 5624 B/plane
```

## Dokumentace 2026-08-30

Přibyla zpráva [`PROJECT.md`](PROJECT.md), inventář [`SOFTWARE.md`](SOFTWARE.md), [`nfc/`](nfc/README.md), [`rf/`](rf/README.md), [`GALLERY.md`](GALLERY.md), fotky `captures/hw/`.

## Bezpečný stav

Preferuj `ov26-relays.sh idle` (všechny cívky OFF), pokud neběží řízený test.
