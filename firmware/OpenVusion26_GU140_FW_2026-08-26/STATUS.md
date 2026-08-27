# Prepared status

## Ready to build/run
- [x] v0.3_reference_probe
- [x] UART1 Alt2 telemetry on P1_6
- [x] WDT ~2-ms timebase
- [x] BUSY transition logger
- [x] build / flash / monitor scripts

## Prepared, intentionally gated
- [x] v0.4_cog_probe
- [x] v0.5_epd_testpattern
- [x] v0.6_nfc_probe draft

## Validation gates
1. v0.3 UART works
2. v0.3 timebase prints its second self-test line after ~0.5 s
3. candidate P1_3 BUSY behavior recorded
4. P1_2 D/C role accepted/verified before v0.4
5. v0.4 COG init passes BUSY timeout
6. only then run v0.5
