# OpenVusion 2.6 GU140 — Cursor Agent Control Project

Tento adresář je určen k otevření **lokálně ve Windows v Cursoru**.

Lokální adresář je **source of truth** pro:
- dokumentaci,
- experimentální log,
- Git historii,
- firmware zdrojové kódy po jejich stažení z RPi.

Laboratorní Raspberry Pi je dostupné přes SSH alias:

```text
vusion-rpi
```

Připojení je již nastavené pomocí SSH klíče bez hesla.

## První použití

Otevři tento adresář v Cursoru a dej agentovi:

```text
Přečti AGENTS.md a všechny soubory v docs/. Potom spusť bootstrap podle START_HERE.md.
Pracuj autonomně podle pravidel projektu.
```

Potom postupuj podle [START_HERE.md](START_HERE.md).

## Důležité

Agent má na **ověřeném DEV tagu** volnou ruku:
- buildovat,
- flashovat,
- power-cycle,
- číst UART,
- upravovat firmware,
- opakovat kontrolované experimenty.

Nemusí žádat o potvrzení před každým flashem.

Naopak nesmí svévolně provádět fyzické manipulace ani ničivé operace na zachovaných stock tagech.
