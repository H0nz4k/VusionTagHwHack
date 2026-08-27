# Firmware Roadmap

## Phase 0 — Lab automation
- [x] SSH spolehlivé
- [x] local source-of-truth mirror
- [x] tag ON/OFF scripts
- [x] UART capture script
- [x] build + flash workflow přečten a zdokumentován
- [x] autonomous bounded HIL loop
- [x] relé vs debugger parasitic power zdokumentováno

## Phase 1 — Stable MCU baseline
- [x] one boot banner only (v aktuálním zapojení: debugger + TAG ON)
- [x] no repeated POR/BROWNOUT (v tomto zapojení nereprodukováno)
- [x] stable UART heartbeat (26 MHz i 13 MHz idle)
- [x] compare 26 MHz XOSC vs ~13 MHz HS-RC
- [x] document reset behavior (`cc-tool --reset` = EXTERNAL_RESET_N)
- [x] true POR bez debuggeru (relé řeže; v0.3e na POR padá)

## Phase 2 — GPIO validation
- [x] passive reads first (P1_3)
- [ ] confirm safe EPD candidates (P0_0/P2_0 bezpečně buditelné, identita ne)
- [ ] confirm BUSY behavior (P1_3 se mění, ready=HIGH po resetu NE)
- [ ] confirm reset/power candidates (chování zaznamenáno, mapa HYPOTÉZA)
- [x] avoid P2_3/P2_4

## Phase 3 — EPD low-risk bring-up
- [ ] EPD power only
- [ ] EPD reset only
- [ ] SPI idle validation
- [ ] first command
- [ ] busy transitions
- [ ] first blank refresh

## Phase 4 — EPD graphics
- [ ] B/W pattern
- [ ] red plane
- [ ] full B/W/R test pattern
- [ ] reusable driver abstraction

## Phase 5 — External flash
- [ ] identify
- [ ] read ID
- [ ] non-destructive reads
- [ ] only then controlled write tests

## Phase 6 — NFC
- [ ] detect I2C device
- [ ] safe reads
- [ ] session/config understanding
- [ ] SRAM mailbox
- [ ] CRC/payload framing

## Phase 7 — LEDs
- [ ] isolate P2_1/P2_2 behavior from debugger
- [ ] map white/RGB
- [ ] safe driver API

## Phase 8 — RF
- [ ] understand stock/reference RF architecture
- [ ] receive-only diagnostics first
- [ ] controlled TX only after baseline
- [ ] packet framing

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
