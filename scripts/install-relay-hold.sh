#!/usr/bin/env bash
# Copy relay hold scripts to the Pi and enable boot + 2s input guard.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
ssh vusion-rpi 'mkdir -p /tmp/ov26-relay-install /home/hw/bin'
scp -o BatchMode=yes \
    "$ROOT/pi/ov26-relays.sh" \
    "$ROOT/pi/ov26-relays-idle.service" \
    "$ROOT/pi/ov26-relays-guard.service" \
    "$ROOT/pi/ov26-relays-guard.timer" \
    vusion-rpi:/tmp/ov26-relay-install/
ssh vusion-rpi 'set -euo pipefail
cp /tmp/ov26-relay-install/ov26-relays.sh /home/hw/bin/ov26-relays.sh
chmod +x /home/hw/bin/ov26-relays.sh
sudo cp /tmp/ov26-relay-install/ov26-relays-idle.service /etc/systemd/system/
sudo cp /tmp/ov26-relay-install/ov26-relays-guard.service /etc/systemd/system/
sudo cp /tmp/ov26-relay-install/ov26-relays-guard.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now ov26-relays-idle.service
sudo systemctl enable --now ov26-relays-guard.timer
/home/hw/bin/ov26-relays.sh idle
echo ENABLED_IDLE=$(systemctl is-enabled ov26-relays-idle.service)
echo ENABLED_GUARD=$(systemctl is-enabled ov26-relays-guard.timer)
pinctrl get 17
pinctrl get 27
'
