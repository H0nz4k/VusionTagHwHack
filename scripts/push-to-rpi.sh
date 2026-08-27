#!/usr/bin/env bash
set -euo pipefail

REMOTE_DIR="/home/hw/OpenVusion26_FW"
LOCAL_DIR="firmware"

if [[ ! -d "$LOCAL_DIR" ]]; then
    echo "ERROR: local firmware/ directory does not exist."
    echo "Run: bash scripts/pull-from-rpi.sh"
    exit 2
fi

echo "Pushing local ${LOCAL_DIR}/ into ${REMOTE_DIR} on vusion-rpi ..."
tar -C "$LOCAL_DIR" -czf - . | ssh vusion-rpi "mkdir -p '$REMOTE_DIR' && tar -C '$REMOTE_DIR' -xzf -"

echo "Done."
