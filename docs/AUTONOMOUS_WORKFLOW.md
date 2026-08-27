# Autonomous HIL Workflow

## Standard experiment

1. Zkontroluj Git:
   ```bash
   git status
   git diff
   ```

2. Zapiš hypotézu do `docs/EXPERIMENT_LOG.md`.

3. Proveď jednu hlavní změnu.

4. Commit zatím nedělej.

5. Push firmware na RPi:
   ```bash
   bash scripts/push-to-rpi.sh
   ```

6. Remote build:
   - nejprve použij existující build script,
   - zachyť stdout/stderr,
   - při build failure nic neflashuj.

7. TAG ON během flash i runtime, dokud je debugger připojen.
   TAG OFF MCU v tomto zapojení neresetuje a nechá ho na parazitním napájení — to nepoužívej jako POR stimulus.

8. Flash DEV tagu:
   - použij existující ověřený script,
   - bez samostatného extra erase, pokud není nutné,
   - verify musí projít, pokud jej workflow podporuje.

9. Připrav bounded UART capture.

10. TAG ON:
    ```bash
    bash scripts/tag-on.sh
    ```

11. Capture:
    ```bash
    bash scripts/uart-capture.sh 15
    ```

12. Vyhodnoť:
    - PASS
    - FAIL
    - INCONCLUSIVE

13. Po testu nech TAG ON, pokud je debugger připojený.
    TAG OFF je fail-safe jen když debugger **není** na tagu.

14. Aktualizuj experiment log.

15. Commit:
    ```bash
    git add .
    git commit -m "exp: ..."
    ```

16. Pokračuj dalším experimentem.

## Stop podmínky

Okamžitě přeruš autonomní loop, pokud:
- target identity je nejasná,
- flash script míří na neověřený target,
- je nutné fyzické přepojení,
- hrozí zápis na stock tag,
- build/flash vykazuje nový destruktivní side effect,
- UART zmizí a další krok vyžaduje fyzickou diagnostiku,
- 3× po sobě dostaneš stejnou failure signature bez nové informace.

## Bounded loops

Každý loop musí mít:
- počet iterací,
- timeout,
- failure condition,
- exit condition.

Výchozí:
- max 5 iterací na hypotézu,
- 10–30 s UART capture,
- max 60 s jeden HIL test.
