#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-v0.3_reference_probe}"
HEX="$ROOT/build/${TARGET}.hex"

if [[ ! -f "$HEX" ]]; then
  echo "Missing $HEX"
  echo "Build first: ./build_one.sh $TARGET"
  exit 1
fi

case "$TARGET" in
  v0.3_reference_probe)
    ;;
  v0.4_cog_probe)
    echo "WARNING: v0.4 drives P1_2 as EPD D/C."
    echo "Run only after v0.3 plausibly validates the EPD map and P1_2 is accepted/verified."
    read -r -p "Type YES to continue: " ans
    [[ "$ans" == "YES" ]] || exit 1
    ;;
  v0.5_epd_testpattern)
    echo "WARNING: v0.5 performs a real EPD refresh."
    echo "Run only after v0.4 succeeds."
    read -r -p "Type YES to continue: " ans
    [[ "$ans" == "YES" ]] || exit 1
    ;;
  v0.6_nfc_probe)
    echo "WARNING: v0.6 is a prepared NFC pin-map probe."
    echo "Run only after its candidate pin map has been accepted for this board."
    read -r -p "Type YES to continue: " ans
    [[ "$ans" == "YES" ]] || exit 1
    ;;
  *)
    echo "Unknown target: $TARGET" >&2
    exit 2
    ;;
esac

echo "Flashing $HEX"
sudo cc-tool -v read -e -w "$HEX"
