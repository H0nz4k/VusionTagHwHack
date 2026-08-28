# OpenVusionHack RF gateway (host)

Python 3, no hardware required for unit tests.

```text
python -m unittest discover -s tools/rf_gateway/tests -v
python tools/rf_gateway/cli.py probe --dry-run
```

On the lab Pi, `probe` without `--dry-run` exits if `/dev/spidev*` is missing. That is the correct result until a 3.3 V CC2500 module is wired and `OVH_SPI_BUS` / `OVH_SPI_DEV` are set. See `docs/rf/GATEWAY_CC2500.md`.

Do not drive 5 V into the CC2500.
