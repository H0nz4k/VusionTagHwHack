# LED map — GL340 PCB overlay vs GU140

Zdroj: [fanhuanji/VUSION4.2BWR_GL340](https://github.com/fanhuanji/VUSION4.2BWR_GL340)
`PCB_Tool/savefile.txt`, `src/util.h`. Deska je **4.2" GL340**, ne GU140 — vše kromě firmwarových maker je **REFERENCE**, na GU140 **HYPOTÉZA**, dokud EXP nepotvrdí.

## Firmware (REFERENCE, GL340 `src/util.h`)

```c
LED_BOOST_ON()  P2_2 = 1
LED_ON()        P2_1 = 1
```

P2_1/P2_2 **nejsou** RGB kanály. `LED_BOOST_*` se v `main.c` nevolá; `blink()` jen 5 ms `LED_ON`.

## Overlay sítě (savefile.txt)

`savefile.txt` je seznam `Net:[jméno]` + `ShapeLine` souřadnic. **Nemá** pad/součástka → net. Trasování GPIO u LED_A/B/C/D z tohoto souboru **nejde dopočítat** — ty sítě jsou krátké u pouzdra LED (x≈4300–5350).

| Net | Overlay barva (AABBGGRR) | Geometrie |
|---|---|---|
| LED_A | červená | krátká, od LED pouzdra doleva k R/tranzistorům |
| LED_B | zelená | totéž |
| LED_C | modrá | totéž, končí níž (~y 800) |
| LED_D | magenta | totéž, ještě níž (~y 850–1000) |
| LED_COM | žlutá/cyan | **dlouhá**: od LED (≈5264,473) až k ≈3648,304 — oblast boost/3V3 |
| TPS61071EN | (bílá) | **velmi krátká** u boost IC (≈3785,767)–(3919,991) |

TPS61071 = boost, pin **EN**. Krátká síť = EN pad. Firmware: EN = **P2_2**. Spoj EN→P2_2 v overlay **není dokreslený**.

LED_COM končí u boost oblasti, ne u MCU. To je **VOUT** boostu, ne GPIO.

## Kandidátní mapa (REFERENCE / HYPOTÉZA)

| Net | Kandidát | GPIO? |
|---|---|---|
| LED_A | katoda **R** (RGBW die) přes R → N-spínač | ne přímo |
| LED_B | katoda **G** | ne přímo |
| LED_C | katoda **B** | ne přímo |
| LED_D | katoda **W** (bílá die) | ne přímo |
| LED_COM | **common anode** = TPS61071 **VOUT** | ne |
| TPS61071EN | boost enable | **P2_2** LED_BOOST |
| (unnamed sink) | společný spínač katod | **P2_1** LED_ON |

Čtyři barevné sítě v overlay **nedobíhají k CC2510**. V GL340 fw **nejsou** čtyři GPIO na R/G/B/W. Barvy se míchají na společném anodovém railu; bílá má vyšší Vf → RGB naskočí dřív, pak bílá přezáří. To sedí s pozorováním na GU140 (EXP-016..018).

**LED_COM = common anode.** Common cathode by LED_COM šla na GND, ne k boost VOUT.

## Co z overlay nejde

Samostatné gate sítě čtyř tranzistorů k P0_2 / P0_7 / P1_1 overlay **nepojmenovává**. Bez toho na GU140 **nesweepovat** další GPIO.

## Cílený experiment na GU140 (žádný sweep)

Ověřit architekturu boost + společný sink, jen P2_1 a P2_2:

| Stav | P2_1 LED_ON | P2_2 BOOST | Očekávání (HYPOTÉZA) |
|---|---|---|---|
| 0 | 0 | 0 | tma |
| 1 | 1 | 0 | tma (není VLED) |
| 2 | 0 | 1 | tma (není sink) |
| 3 | 1 | 1 | RGB, pak bílá |

Firmware: `v0.3i_led_boost_sink`. Runtime GPIO27+21 off.
