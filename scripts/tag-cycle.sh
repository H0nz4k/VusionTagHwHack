#!/usr/bin/env bash
set -euo pipefail

OFF_SECONDS="${1:-2}"

ssh vusion-rpi "pinctrl set 17 op dh; sleep '$OFF_SECONDS'; pinctrl set 17 op dl; pinctrl get 17"
