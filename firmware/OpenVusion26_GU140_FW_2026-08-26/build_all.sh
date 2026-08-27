#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for t in \
  v0.3_reference_probe \
  v0.4_cog_probe \
  v0.5_epd_testpattern \
  v0.6_nfc_probe
do
  "$ROOT/build_one.sh" "$t"
done
