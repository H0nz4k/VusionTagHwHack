# LED map — GL340 PCB overlay vs GU140

Zdroj: [fanhuanji/VUSION4.2BWR_GL340](https://github.com/fanhuanji/VUSION4.2BWR_GL340)
`PCB_Tool/savefile.txt`, `src/util.h`, `top.png`/`bottom.png` (overlay, ne netlist). Deska je **4.2" GL340**, ne GU140 — overlay je **REFERENCE**. Na GU140 povyšuj jen to, co potvrdil test.

## GU140 RGB pouzdro (OVĚŘENO, diode-test)

Člověk, multimetr diode-test:

- RGB LED je **common-anode**
- 1 pin = společné **+**
- 3 piny = katody R / G / B (každá samostatně rozsvítí svou barvu)
- všechny tři čipy fungují

```text
         COMMON +
            |
     +------+------+
     |      |      |
     R      G      B
     |      |      |
    R-     G-     B-
```

Samostatná **bílá** LED existuje vedle RGB (předchozí optika EXP-016..020).

## EXP-021 register delta (OVĚŘENO)

Firmware `v0.3k`, debugger isolated. Jediné řízené LED GPIO = **P2_1 a P2_2**.

| Stav | P2 | P0 | P1 | P0DIR | P1DIR | P2DIR | P0SEL | P1SEL | P2SEL | PERCFG |
|---|---|---|---|---|---|---|---|---|---|---|
| OFF | `19` | `FF` | `FF` | `00` | `10` | `06` | `00` | `40` | `00` | `02` |
| P2_1 | `1B` | `FF` | `FF` | stejné | | | | | | |
| P2_2 | `1D` | `FF` | `FF` | stejné | | | | | | |
| BOTH | `1F` | `FF` | `FF` | stejné | | | | | | |

`P2` bity: `P2_0` a krystal `P2_3/P2_4` zůstávají 1 (vstupy). Mění se jen `P2_1` a `P2_2`.

Při stavu, který dává **RGB WHITE** (BOTH), MCU **nedriveuje** žádný další pin jako výstup. R-/G-/B- proto **nejsou** tři volné GPIO v P0/P1.

GL340 `util.h` (**REFERENCE**): jen `LED_ON=P2_1`, `LED_BOOST=P2_2`. Žádné RGB kanály v kódu. Overlay sítě `LED_A/B/C/D` v `savefile.txt` **nedobíhají k MCU** — končí u pouzdra LED (rezistor/tranzistor). `LED_COM` je dlouhá k boost oblasti. `TPS61071EN` je krátká u boost EN.

## API — co HW teď dovolí

| Funkce | Stav |
|---|---|
| `led_rgb_off()` | **HYPOTÉZA** `P2_1=0` (typicky i `P2_2=0`) |
| `led_rgb_white()` | **HYPOTÉZA** `P2_1=1` + boost `P2_2=1` (R+G+B současně) |
| `led_rgb_red/green/blue` | **blokováno** — chybí mapování tří sink větví |
| yellow/cyan/magenta | později, jen pokud existují nezávislé katodové spínače |

Nesmí se implementovat falešné R/G/B přepínáním náhodných GPIO.

## Jeden měřicí požadavek (TAG je OFF)

Sonda na **far-side** (ne na pouzdru LED) tří katodových rezistorů RGB:

**Jsou tři uzly za R-/G-/B- rezistory navzájem spojené (jeden společný sink), nebo jdou každý do vlastního tranzistoru?**

- společný uzel → software umí jen off / RGB-white; R/G/B API nejde
- tři tranzistory → další krok = gate **jen červeného** FET na který pin MCU

Žádný GPIO sweep, dokud není tahle dichotomie.

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

## Kandidátní mapa (REFERENCE GL340 / HYPOTÉZA GU140)

Pořadí A/B/C ≠ ověřené R/G/B. Overlay barva sítě je kresba, ne barva čipu.

| Net | Kandidát | GPIO? |
|---|---|---|
| LED_A/B/C | tři RGB katody přes R → N-spínač | ne přímo (EXP-021) |
| LED_D | katoda samostatné bílé LED | ne přímo |
| LED_COM | common anode = TPS61071 VOUT | ne |
| TPS61071EN | boost enable | **P2_2** |
| (unnamed sink) | společný nebo sdílený spínač | **P2_1** |

Čtyři katodové sítě v overlay **nedobíhají k CC2510**. GL340 fw nemá R/G/B GPIO. EXP-021 to na GU140 potvrdil v registrech.

**LED_COM = common anode** sedí s GU140 diode-testem. Common cathode by LED_COM šla na GND, ne k boost VOUT.

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

## EXP-019 na GU140 — lidské pozorování

Cyklus vizuálně:

```text
RGB se rozsvítí (lehce pulzuje do modra)
→ přidá se bílá LED
→ obě zhasnou
```

To sedí se stavem **ON=1 BOOST=1** (Vf: RGB dřív, W později) a návratem na 00. Samostatné „jen sink“ / „jen boost“ jako extra svícení **nebylo hlášeno**.

**OVĚŘENO na GU140:** obě LED jdou budit současně P2_1+P2_2; RGB předbíhá bílou; zhasnutí po konci 11.

**HYPOTÉZA:** pulz do modra = ripple/Vf boostu, ne GPIO kanál. R/G/B/W dál nemají vlastní GPIO.

Řízení bez dalších pinů: `LED_OFF` = 00, `LED_ON` = 11. PWM P2_1 při BOOST=1 může měnit jas/směs — další experiment, ne sweep.
