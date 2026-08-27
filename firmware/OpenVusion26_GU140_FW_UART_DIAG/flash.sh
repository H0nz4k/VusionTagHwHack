#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${1:-v0.3a_uart_baseline}"
HEX="$ROOT/build/$TARGET.hex"
[[ -f "$HEX" ]] || { echo "Build first: ./build_one.sh $TARGET"; exit 1; }
sudo cc-tool -v read -e -w "$HEX"
