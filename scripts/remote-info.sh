#!/usr/bin/env bash
set -euo pipefail

ssh vusion-rpi '
echo "HOST: $(hostname)"
echo "USER: $(whoami)"
echo "PWD:  $(pwd)"
echo
echo "TOOLS:"
command -v sdcc || true
command -v cc-tool || true
command -v pinctrl || true
echo
echo "RELAY:"
pinctrl get 17 || true
echo
echo "UART:"
ls -l /dev/serial/by-id/ 2>/dev/null || true
echo
echo "FIRMWARE ROOT:"
ls -la /home/hw/OpenVusion26_FW 2>/dev/null | head -80 || true
'
