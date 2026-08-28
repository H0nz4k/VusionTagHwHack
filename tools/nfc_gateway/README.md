# ovh-nfc

```text
PYTHONPATH=tools/ElaTool/src python tools/nfc_gateway/cli.py probe --port /dev/ttyACM0 --wait 8
```

Never `--port /dev/ttyUSB0` (tag UART). TWN4 = `/dev/ttyACM0`.
