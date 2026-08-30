# Firmware Roadmap

## Phase 0 — Lab automation
- [x] SSH spolehlivé
- [x] local source-of-truth mirror
- [x] tag ON/OFF scripts
- [x] UART capture script
- [x] build + flash workflow přečten a zdokumentován
- [x] autonomous bounded HIL loop
- [x] relé vs debugger parasitic power zdokumentováno
- [x] GPIO17 tag + GPIO27 RESET/DD/DC + GPIO21 USB 5V — EXP-014 attach → CC2510
- [x] autonomous flash via attach (EXP-015 v0.3a verify + isolated UART)

## Phase 1 — Stable MCU baseline
- [x] one boot banner only (nový DEV, EXP-011, bez debug kabelu)
- [x] no repeated POR/BROWNOUT (EXP-011; smyčka EXP-010 byla RESET_N z debuggeru)
- [x] stable UART heartbeat (v0.3a true POR)
- [x] compare 26 MHz XOSC vs ~13 MHz HS-RC (starý kus + debugger)
- [x] document reset behavior (`cc-tool --reset` = EXTERNAL_RESET_N; true POR na desce taky EXT — RC HYPOTÉZA)
- [x] true POR bez debuggeru (EXP-011 PASS)

## Phase 2 — GPIO validation
- [x] passive reads first (P1_3)
- [x] confirm safe EPD candidates (P0_0 EXP-023, P2_0 EXP-024 isolated; identita ne OVĚŘENO)
- [ ] confirm BUSY behavior (EXP-024: P1_3 0→1 po H-L-H; command/polarita ne)
- [x] confirm reset/power candidates buditelné isolated (REFERENCE identita; EXP-024 no storm)
- [x] avoid P2_3/P2_4

## Phase 3 — EPD low-risk bring-up

Po LED continuity. Isolated debugger. P0_2 untouched. Detail `docs/EPD_REFERENCE.md`. Milník: `milestone/epd-first-refresh`.

Po každém EXP commit + log. Bez konzistentního PASS nepokračovat.

- [x] EXP-A passive BUSY
- [x] EXP-B PWR only
- [x] EXP-C RESET H-L-H + BUSY (EXP-024; P2_0 isolated no storm; P1_3 0→1)
- [x] EXP-D SPI idle / clock (P0_3/P0_5, ne P0_2)
- [x] EXP-E command 0x00 + data 0x0E (TX OK; BUSY ACK INCONCLUSIVE)
- [x] EXP-F minimal reference init
- [x] EXP-G blank framebuffer load
- [x] EXP-H 0x12 refresh (EXP-029 UART+BUSY; vizuál EXP-030)
- [x] B/W stripes second refresh (EXP-030; stejný BUSY cyklus)

## Phase 4 — EPD graphics
- [x] B/W pattern (EXP-030 **OVĚŘENO vizuálně**)
- [x] red plane (EXP-032 **OVĚŘENO vizuálně** BLACK/WHITE/RED)
- [ ] full B/W/R test pattern
- [ ] reusable driver abstraction
- [x] first content OpenVusionHack (EXP-033 **OVĚŘENO vizuálně**)

## Phase 5 — External flash
- [ ] identify
- [ ] read ID
- [ ] non-destructive reads
- [ ] only then controlled write tests

## Phase 6 — NFC
- [x] detect I2C device (EXP-040 ACK 0xAA) — sourozenec
- [x] safe EEPROM reads
- [x] SHOW sloty TWN4 + Android NDEF (v0.10g / v0.10i)
- [x] SRAM mailbox OVMB + EPD (v0.12b, EXP-066…071)
- [ ] Android mailbox (celý obraz z telefonu)
- [ ] stock NDEF/SES protokol (záměrně ne)

## Phase 7 — LEDs
- [x] isolate P2_1/P2_2 behavior from debugger (EXP-016 UART stable, colors pending)
- [ ] map white/RGB (společný sink vs FET — fyzické měření)
- [ ] safe driver API

## Phase 8 — RF
- [x] vlastní profil (ne stock Vusion) — `OVH_RF_PROFILE_0`
- [x] RF-A/B/C UART dump / IDLE / RX (EXP-034…036)
- [x] pasivní observatoř nRF52840 + WaterFall (energy only)
- [ ] RF-D/E/F/G OTA — **blok: CC2500 na Pi není**
- [ ] packet PING/PONG = `milestone/rf-first-packet`

## Phase 9 — Integrated firmware
- [ ] scheduler/state machine
- [ ] NFC receive path
- [ ] RF receive path
- [ ] EPD rendering
- [ ] LED status
- [ ] low-power modes
- [ ] watchdog with intentional policy
- [ ] recovery/error telemetry

## Phase 10 — Robustness
- [ ] soak tests
- [ ] repeated power cycles
- [ ] brownout recovery
- [ ] invalid packet handling
- [ ] bounded retries
- [ ] documented releases
