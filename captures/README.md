# UART captures

Raw bounded UART dumps from Raspberry Pi (`/tmp/ov26_exp*.bin`).

| File | Experiment |
|---|---|
| `ov26_exp001.bin` | v0.3a after relay cycle (dots only) |
| `ov26_exp001d_ccreset.bin` | v0.3a `cc-tool --reset` |
| `ov26_exp002.bin` | v0.3b 13 MHz after `cc-tool --reset` (garbled banner) |
| `ov26_exp002.bin.idle` | v0.3b idle 15 s |
| `ov26_exp002b_idle30.bin` | v0.3b idle 30 s |
| `ov26_exp003.bin` | v0.3c passive BUSY |
| `ov26_exp004.bin` | v0.3d power-only |
| `ov26_exp005.bin` | v0.3e reset probe (debugger attached) |
| `ov26_exp006a_tagoff.bin` | TAG OFF listen, debugger disconnected |
| `ov26_exp006b_por.head.bin` | first 256 B of true-POR storm (full dump 105243 B stayed on Pi) |
| `ov26_exp010_tagoff.bin` | 5 s listen tag OFF (1× 0x00) |
| `ov26_exp011_por.bin` | true POR, debug cable off tag — 1 banner + 19 dots |
| `ov26_exp012_tagoff.bin` | EXP-012 idle listen (MCU already heartbeating) |
| `ov26_exp012_por.bin` | EXP-012 GPIO27 dh + GPIO17 on — 15 dots, no banner |
| `ov26_exp012_ident.txt` | EXP-012 GPIO27 dl `cc-tool -t` — no target |
| `ov26_exp012b_idle.bin` | EXP-012b GPIO17 off — 8 dots / 8 s |
| `ov26_exp013b_ident.txt` | EXP-013b: programmer OK, no target |
| `ov26_exp014_ident.txt` | EXP-014 attach: CC2510 ID 0x2510 |
| `ov26_exp015_ident.txt` | EXP-015 identify before flash |
| `ov26_exp015_flash.txt` | EXP-015 erase+write+verify log |
| `ov26_exp016_por.bin` | EXP-016 v0.3f LED P2 UART — 1 banner + state cycle |
| `ov26_exp021_por.bin` | EXP-021 v0.3k LED register dump OFF/P2_1/P2_2/BOTH |
| `ov26_exp022_por.bin` | EXP-022 v0.4a passive BUSY isolated POR |
| `ov26_exp023_por.bin` | EXP-023 v0.4b P0_0 PWR only isolated |
| `ov26_exp024_por.bin` | EXP-024 v0.4c PWR ON + P2_0 H-L-H isolated |
| `ov26_exp025_por.bin` | EXP-025 v0.4d USART0 Alt1 SPI idle isolated |
| `ov26_exp026_por.bin` | EXP-026 v0.4e command 0x00 + data 0x0E isolated |
| `ov26_exp027_por.bin` | EXP-027 v0.4f minimal init register_data_sm |
| `ov26_exp028_por.bin` | EXP-028 v0.4g 5624+5624 white planes |
