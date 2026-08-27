#!/usr/bin/env bash
set -euo pipefail
echo "Setting DEV tag to fail-safe OFF state..."
ssh vusion-rpi 'pinctrl set 17 op dh; pinctrl get 17'
