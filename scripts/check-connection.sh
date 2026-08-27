#!/usr/bin/env bash
set -euo pipefail

echo "== SSH =="
ssh vusion-rpi 'hostname; whoami; uname -a'

echo
echo "== Tools =="
ssh vusion-rpi 'which sdcc || true; which cc-tool || true; which pinctrl || true'

echo
echo "== UART devices =="
ssh vusion-rpi 'ls -l /dev/serial/by-id/ 2>/dev/null || true'

echo
echo "== Relay =="
ssh vusion-rpi 'pinctrl get 17 || true'
