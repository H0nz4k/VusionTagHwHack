# Session Handoff

## Current firmware

```text
v0.10e_nfc_show3 — EXP-056 v0.10g. SHOW 1 OVH / 2 BWR test / 3 Shut up (zip 22-28-47) / 4 blank white.
```

TAG ON, debug isolated. Idle UART: `ARMED` `WAIT LED=00`.

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
