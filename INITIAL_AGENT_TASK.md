# Initial Agent Task

Přečti nejdříve:
- `AGENTS.md`
- `.cursor/rules/openvusion-gu140.mdc`
- všechny soubory v `docs/`

Potom pracuj autonomně.

## Cíl první session

1. Ověř SSH a lab tools:
   ```bash
   bash scripts/check-connection.sh
   ```

2. Pokud `firmware/` ještě neobsahuje aktuální vzdálený projekt, stáhni jej:
   ```bash
   bash scripts/pull-from-rpi.sh
   ```

3. Prozkoumej:
   - všechny build/flash skripty,
   - současný reset-cause firmware,
   - clock init,
   - UART init,
   - linker/build options.

4. Zjisti přesně:
   - zda flash script provádí erase,
   - jaký artifact zapisuje,
   - zda verify probíhá,
   - zda target musí být ON během programování,
   - jestli debugger může zůstat připojený během runtime bez ovlivnění testu.

5. Bez čekání na člověka navrhni a proveď bezpečný první experiment:
   - čistý A/B baseline test 26MHz XOSC vs reset-default HS-RC ~13MHz,
   - žádný EPD,
   - žádný watchdog,
   - bounded UART capture,
   - bezpečný power-cycle.

6. DEV tag můžeš flashovat autonomně.

7. Každý experiment:
   - dokumentuj v `docs/EXPERIMENT_LOG.md`,
   - commitni,
   - pokračuj dalším krokem podle výsledku.

8. Neopakuj bezmyšlenkovitě stejný neúspěšný test.
   Po 3 stejných failure signatures změň hypotézu nebo diagnostickou metodu.

9. Pokračuj co nejdále v roadmapě, pokud jsou validační předpoklady splněné.

10. Pokud narazíš na nutnost fyzického zásahu člověka:
    - TAG OFF,
    - aktualizuj `docs/SESSION_HANDOFF.md`,
    - přesně napiš jediný požadovaný zásah,
    - zastav.

## Důležité

Není cílem čekat na uživatele mezi bezpečnými flash/test iteracemi.

Máš volnou ruku nad DEV tagem, ale:
- žádný stock tag,
- žádné nekonečné smyčky,
- žádné nekontrolované GPIO sweeps,
- žádné destruktivní operace mimo ověřený DEV firmware workflow.
