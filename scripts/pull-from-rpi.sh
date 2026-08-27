#!/usr/bin/env bash
set -euo pipefail

REMOTE_DIR="/home/hw/OpenVusion26_FW"
LOCAL_DIR="firmware"

mkdir -p "$LOCAL_DIR"

echo "Pulling ${REMOTE_DIR} from vusion-rpi into ${LOCAL_DIR}/ ..."
ssh vusion-rpi "tar -C '$REMOTE_DIR' -czf - ." | tar -C "$LOCAL_DIR" -xzf -

echo "Done."
