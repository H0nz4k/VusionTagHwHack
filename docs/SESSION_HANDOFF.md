# Session Handoff

## Current firmware

```text
v0.10e_nfc_show3 — EXP-054. SHOW 1 OVH / 2 BWR test / 3 Shut up.
```

TAG ON, debug isolated. Idle UART: `ARMED` `WAIT LED=00`.

## Show

```text
/home/hw/bin/ov26-nfc-show.sh      # menu 1/2/3
/home/hw/bin/ov26-nfc-show.sh 2    # BWR test directly
/home/hw/bin/ov26-nfc-show.sh 3   # Take my money
```

Hold TWN4 until LED stops, then leave. Glass may still update ~15 s.

TWN4 WRITE user page `0x30` (`OVH` + n). I2C block `0x0C`. Not UID/config/lock.

## LED

Blink ~250 ms only while latching the NFC command. Off = you can walk away.
