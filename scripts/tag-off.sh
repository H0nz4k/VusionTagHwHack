#!/usr/bin/env bash
set -euo pipefail
ssh vusion-rpi 'pinctrl set 17 op dh; pinctrl get 17'
