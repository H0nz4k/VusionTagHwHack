# Session Handoff

## Current firmware

```text
v0.12b_nfc_epd (pinned in firmware/releases/latest.json)
sha256 2ce75d6241c91d5bef98194515ba5024312fec006b156d485d35426015a927f6
```

```text
tag-flash-latest --dry-run
tag-flash-latest --confirm-dev-tag --yes
tag-send-image captures/nfc/art/ovhack.bin
```

Návod: `docs/FLASH_AND_IMAGE.md`. TWN4 `/dev/ttyACM0`. Bench po utilitách `idle`.
