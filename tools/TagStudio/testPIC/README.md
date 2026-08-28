# testPIC

Malé fixture pro testy a dokumentaci. Uživatelské exporty a velké fotky do gitu nepatří (`orignal_pic/`, `big_400x300/`, ZIP).

| Soubor | Použití |
| --- | --- |
| `small_296x152/takemoney.jpg` | Playwright e2e (import rastru) |
| `small_296x152/BWR_barevny_test_EDG2-0260-A_296x152.png` | reference vzorníku 01–16 |
| `small_296x152/dithered_image.png` | kopie kořenové kodek fixture |
| `small_296x152/image_data_array.c` | kopie kořenové C fixture |

Unit testy kodeku čtou `dithered_image.png` a `image_data_array.c` z kořene `tools/TagStudio/`.
