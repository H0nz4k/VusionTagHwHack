# START HERE

## 1. Ověř SSH

Z Git Bash / Cursor terminálu:

```bash
ssh vusion-rpi 'hostname; whoami; uname -a'
```

## 2. Stáhni současný firmware z Raspberry Pi

Spusť:

```bash
bash scripts/pull-from-rpi.sh
```

Firmware bude lokálně v:

```text
firmware/
```

Lokální `firmware/` je od tohoto okamžiku preferovaný **source of truth**.

## 3. Inicializuj Git, pokud projekt ještě není Git repository

```bash
git init
git checkout -b research/gu140-autonomous
git add .
git commit -m "chore: initialize GU140 autonomous firmware research project"
```

Pokud už Git repository existuje, nic znovu neinicializuj.

## 4. Agent musí přečíst kontext

Před první autonomní prací:

- `AGENTS.md`
- `.cursor/rules/openvusion-gu140.mdc`
- celý adresář `docs/`

Potom má agent právo pokračovat sám.

## 5. Synchronizace firmware na RPi

Po lokální změně:

```bash
bash scripts/push-to-rpi.sh
```

Agent může tento krok provádět sám.

## 6. Ovládání tagu

TAG ON:

```bash
bash scripts/tag-on.sh
```

TAG OFF:

```bash
bash scripts/tag-off.sh
```

Power-cycle:

```bash
bash scripts/tag-cycle.sh
```

UART capture:

```bash
bash scripts/uart-capture.sh 15
```

## 7. Autonomie

Agent nemusí čekat na člověka mezi bezpečnými experimenty.

Má pokračovat:

```text
analýza
→ jedna hypotéza
→ změna
→ build
→ flash
→ power-cycle
→ UART / měření dostupné softwarem
→ vyhodnocení
→ dokumentace
→ Git commit
→ další experiment
```

dokud:
- nevyřeší aktuální problém,
- nenarazí na skutečnou fyzickou překážku,
- nenastane bezpečnostní stop podmínka,
- nebo není nutné měření / přepojení člověkem.

Všechny smyčky musí být konečné a ohraničené.
