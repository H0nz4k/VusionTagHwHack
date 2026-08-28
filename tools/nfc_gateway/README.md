# ovh-nfc

TWN4 = `/dev/ttyACM0`. Never `--port /dev/ttyUSB0` (tag UART).

```text
python3 tools/nfc_gateway/cli.py --port /dev/ttyACM0 reader-info
python3 tools/nfc_gateway/cli.py --port /dev/ttyACM0 --wait 8 probe
python3 tools/nfc_gateway/cli.py --port /dev/ttyACM0 field-watch --wait 45
python3 tools/nfc_gateway/show_app.py
```

`show_app.py` / `/home/hw/bin/ov26-nfc-show.sh` — menu 1/2/3/4 (4 = smazat/bílá) na firmware **v0.10f**. Flash na nový DEV tag: [`firmware/releases/README.md`](../../firmware/releases/README.md).

`field-watch` keeps HF field on and prints `in_field` / UID until `--wait` seconds. Tag firmware `v0.7a_nfc_fd_led` blinks the LED pair (RGB+white, P2_1+P2_2) while P1_1 FD is low.

Debugger must be isolated (GPIO27/21 OFF) so P2_1/P2_2 are free for LED.
