#!/usr/bin/env bash
set -euo pipefail

SECONDS="${1:-15}"

if ! [[ "$SECONDS" =~ ^[0-9]+$ ]]; then
    echo "Usage: $0 [seconds]"
    exit 2
fi

if (( SECONDS < 1 || SECONDS > 60 )); then
    echo "ERROR: capture must be between 1 and 60 seconds."
    exit 2
fi

UART="/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0"

ssh vusion-rpi "
set -e
UART='$UART'
test -e \"\$UART\"
stty -F \"\$UART\" 115200 cs8 -cstopb -parenb -ixon -ixoff -crtscts raw -echo
timeout '$SECONDS' cat \"\$UART\" || rc=\$?
if [ \"\${rc:-0}\" -ne 0 ] && [ \"\${rc:-0}\" -ne 124 ]; then
    exit \"\$rc\"
fi
"
