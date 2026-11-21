# Hausa copy — review sheet

**Status: needs native-speaker review before any public launch.** The copy is
written in plain, spoken Gombe Hausa by a non-native speaker. It is deliberately
short and concrete so a reviewer can correct it quickly, but it is not yet
field-validated. The demo labels it as a prototype and no messages are sent.

Review target: one market trader, one teacher, one community health worker in
Gombe. Ask each person to read the four severity levels and the four advice
cards, then say back what they would do. Record any phrase they would not use.

## Severity labels

| English | Current Hausa | Reviewer question |
| --- | --- | --- |
| Low | Ƙarami | Is "Ƙarami" natural for low risk, or is "Babu matsala" clearer? |
| Moderate | Matsakaici | Understood, or prefer "A ɗan yi hankali"? |
| High | Yawa | "Yawa" alone may read as "a lot" rather than "high risk". Consider "Haɗari sosai". |
| Severe | Haɗari | Is this strong enough for "severe"? Consider "Mummunan haɗari". |

## Headlines

| Level | Hausa |
| --- | --- |
| Low | Yau ƙura ba ta da yawa a Gombe. |
| Moderate | Ƙura kaɗan tana iska yau. |
| High | Ana sa ran ƙura mai yawa. Ka gyara shirinka. |
| Severe | Ƙura mai haɗari. Ka kasance a ciki idan za ka iya. |

## Advice cards

### Laundry

| Level | Hausa |
| --- | --- |
| Low | Yanayi mai kyau don busar da tufafi. Ka shimfiɗa a waje. |
| Moderate | Za ka iya shimfiɗa a waje, amma ka girgiza tufafin kafin ka shigo da su. |
| High | Kada ka shimfiɗa tufafi a waje — ƙura za ta zauna a kansu. |
| Severe | Ajiye tufafi a ciki. Idan dole sai an shimfiɗa a waje, a rufe su da mayafi. |

### Market / goods

| Level | Hausa |
| --- | --- |
| Low | Rana ta al'ada ce don baje kaya a waje. |
| Moderate | Rufe kayanka da mayafi idan za ka bar rumfar. |
| High | Rufe duk kayanka da roba ko mayafi. Ƙura tana shiga komai. |
| Severe | Kaɗa kayanka ko ka rufe su sosai. Idan za ka iya, sayar daga rumfa da aka rufe. |

### School / children

| Level | Hausa |
| --- | --- |
| Low | Yara za su iya zuwa makaranta kamar kullum. |
| Moderate | Aika ruwan sha tare da yara; ƙura kaɗan za ta kasance a iska. |
| High | Yara su sa abin rufe baki idan za su tafi makaranta. A rufe tagogin aji. |
| Severe | Idan zai yiwu, a tsayar da yara a ciki. Idan makaranta a buɗe, a rufe tagogi kuma a daina wasa a waje. |

### Health (non-medical guidance)

| Level | Hausa |
| --- | --- |
| Low | Iska a buɗe take. Masu asma za su iya tafiya kamar kullum. |
| Moderate | Masu asma, rashin lafiyar ido ko ciwon ido su riƙe maganinsu kusa. |
| High | Masu asma da ciwon ido su guje wa tafiya waje, su riƙe maganinsu. |
| Severe | Masu matsalar numfashi su kasance a ciki. Nemi taimakon likita idan numfashi ya yi wahala. |

## Flood copy

| Level | Headline | Advice |
| --- | --- | --- |
| Low | Babu alamar ambaliya a cikin kwanaki uku masu zuwa. | Yanayi na al'ada. A share magudanar ruwa yayin da ƙasa ta bushe. |
| Moderate | Ana iya samun ruwan sama mai yawa. Duba magudanar ruwa. | A share magudanar ruwa, a ɗaga buhu ko kaya kan tudu kafin ruwa. |
| High | Haɗarin ambaliya. Ɗaga kayanka daga ƙasa. | Guje wa tituna masu ƙasa da magudanar ruwa. Ɗaga kaya masu daraja zuwa sama. |
| Severe | Ana sa ran ambaliya mai haɗari. Guje wa tituna masu ƙasa. | Kada ka tsallake ruwa mai gudu. Koma zuwa waje mai tudu, ka riƙe yara kusa. |

## Terms and choices to confirm

| Term | Current use | Note |
| --- | --- | --- |
| Harmattan | Not used in UI body copy; "ƙura" is used instead | Harmattan is understood, but "ƙura" is the everyday word for the dust. |
| AOD | Kept as "AOD" | Technical panel only; explained in English. |
| WhatsApp broadcast | "WhatsApp" kept | Product name. |
| SMS | "SMS" kept | Product name. |
| mm | "mm" kept | Standard on rain gauges and phone weather. |
| µg/m³ | "µg/m³" kept | Technical panel only. |
| "likita" | clinician/doctor | Confirm it reads as a health facility, not necessarily a doctor. |

## Known risks

1. **Register.** The copy avoids slang so it travels across Gombe, but it may
   read as formal to a market audience. Review with a trader.
2. **Health wording.** "Nemi taimakon likita" is intentionally cautious. It
   must not be read as diagnosis or treatment advice. The English and Hausa
   disclaimers both say the guidance is general.
3. **Severity vocabulary.** "Yawa" and "Haɗari" are the weakest choices; see
   the table above. A reviewer may replace them with local risk idioms.
4. **Numbers.** Scores are shown as `21/100`. Confirm that a slash score is
   understood, or switch to a word-only label for SMS.

## Mitigation in the build

- Every surface carries the English and Hausa disclaimer.
- The pitch and demo script explicitly say the Hausa copy is pending review.
- All strings live in one file (`services/api/app/advice.py`) plus the UI
  dictionary (`apps/web/lib/i18n.ts`), so a reviewer's corrections are a
  single small pull request, not a rewrite.
