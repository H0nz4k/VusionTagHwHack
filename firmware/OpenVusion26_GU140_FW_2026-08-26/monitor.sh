#!/usr/bin/env bash
set -euo pipefail

DEV="${1:-}"

if [[ -z "$DEV" ]]; then
  echo "Available serial devices:"
  ls -l /dev/serial/by-id/ 2>/dev/null || true
  echo
  echo "Usage:"
  echo "  ./monitor.sh /dev/serial/by-id/<your-USB-TTL>"
  echo "or:"
  echo "  ./monitor.sh /dev/ttyUSB0"
  exit 1
fi

if command -v picocom >/dev/null 2>&1; then
  exec picocom -b 115200 --flow n --parity n --databits 8 "$DEV"
fi

echo "picocom not installed. Install with:"
echo "  sudo apt install -y picocom"
echo
echo "Fallback: configuring 115200 8N1 and running cat. Ctrl+C exits."
stty -F "$DEV" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
exec cat "$DEV"
