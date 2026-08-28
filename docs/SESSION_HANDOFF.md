# Session Handoff

## Current firmware

```text
v0.11d — EXP-060 FAIL. RF WRITE 0xEC NAK. MCU SRAM I2C still OK (zeros). TWN4 can leave.
Next: SRAM_MIRROR via config E8 (persistent, reversible) — not another EC/FE write.
```

GPIO20 TWN4 USB **OVĚŘENO** (`twn4-on` / `twn4-off`). Inventory: `/home/hw/bin/ov26-hw-inventory.sh`.

## Mailbox (in progress)

EXP-057 PASS. EXP-058: PTHRU + `python3 tools/nfc_gateway/cli.py mbox`

## Show

```text
/home/hw/bin/ov26-nfc-show.sh      # menu 1/2/3/4
/home/hw/bin/ov26-nfc-show.sh 2    # BWR test directly
/home/hw/bin/ov26-nfc-show.sh 3    # Take my money
/home/hw/bin/ov26-nfc-show.sh 4    # smazat / bílá
```

Hold TWN4 until LED stops, then leave. Glass may still update ~15 s.

TWN4 WRITE user page `0x30` (`OVH` + n). I2C block `0x0C`. Not UID/config/lock.

## LED

Blink ~250 ms only while latching the NFC command. Off = you can walk away.
