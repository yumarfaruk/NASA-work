"""Bilingual (English / Hausa) advice templates and share messages.

Hausa copy is written to be plain, spoken Gombe Hausa. It is flagged for
native-speaker review in docs/hausa-copy.md before the live demo — the PRD's
own mitigation for language risk.
"""
from __future__ import annotations

from datetime import date
from typing import Any

HAUSA_DAYS = ["Litinin", "Talata", "Laraba", "Alhamis", "Juma'a", "Asabar", "Lahadi"]
HAUSA_MONTHS = [
    "Janairu", "Faburairu", "Maris", "Afrilu", "Mayu", "Yuni",
    "Yuli", "Agusta", "Satumba", "Oktoba", "Nuwamba", "Disamba",
]
ENGLISH_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
ENGLISH_MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

# topic -> level -> {en, ha}
ADVICE: dict[str, dict[str, dict[str, str]]] = {
    "laundry": {
        "low": {
            "en": "Good drying weather. Hang clothes outside as normal.",
            "ha": "Yanayi mai kyau don busar da tufafi. Ka shimfiɗa a waje.",
        },
        "moderate": {
            "en": "You can dry outside, but shake clothes before bringing them in.",
            "ha": "Za ka iya shimfiɗa a waje, amma ka girgiza tufafin kafin ka shigo da su.",
        },
        "high": {
            "en": "Don't hang laundry outside — dust will settle on it.",
            "ha": "Kada ka shimfiɗa tufafi a waje — ƙura za ta zauna a kansu.",
        },
        "severe": {
            "en": "Keep laundry indoors. If you must dry outside, cover it with a sheet.",
            "ha": "Ajiye tufafi a ciki. Idan dole sai an shimfiɗa a waje, a rufe su da mayafi.",
        },
    },
    "market": {
        "low": {
            "en": "A normal day to display goods in the open.",
            "ha": "Rana ta al'ada ce don baje kaya a waje.",
        },
        "moderate": {
            "en": "Cover goods with a cloth when you step away from the stall.",
            "ha": "Rufe kayanka da mayafi idan za ka bar rumfar.",
        },
        "high": {
            "en": "Cover all goods with plastic or cloth. Dust gets into everything.",
            "ha": "Rufe duk kayanka da roba ko mayafi. Ƙura tana shiga komai.",
        },
        "severe": {
            "en": "Pack goods away or cover them fully. Sell from a closed stall if you can.",
            "ha": "Kaɗa kayanka ko ka rufe su sosai. Idan za ka iya, sayar daga rumfa da aka rufe.",
        },
    },
    "school": {
        "low": {
            "en": "Children can walk to school as usual.",
            "ha": "Yara za su iya zuwa makaranta kamar kullum.",
        },
        "moderate": {
            "en": "Send water with the children; a little dust will be in the air.",
            "ha": "Aika ruwan sha tare da yara; ƙura kaɗan za ta kasance a iska.",
        },
        "high": {
            "en": "Children should wear a mask walking to school. Close classroom windows.",
            "ha": "Yara su sa abin rufe baki idan za su tafi makaranta. A rufe tagogin aji.",
        },
        "severe": {
            "en": "Keep children indoors if possible. If school is open, close windows and skip outdoor play.",
            "ha": "Idan zai yiwu, a tsayar da yara a ciki. Idan makaranta a buɗe, a rufe tagogi kuma a daina wasa a waje.",
        },
    },
    "health": {
        "low": {
            "en": "Air is clear. People with asthma can go about normally.",
            "ha": "Iska a buɗe take. Masu asma za su iya tafiya kamar kullum.",
        },
        "moderate": {
            "en": "People with asthma, allergies or eye problems should keep medicine close.",
            "ha": "Masu asma, rashin lafiyar ido ko ciwon ido su riƙe maganinsu kusa.",
        },
        "high": {
            "en": "Asthma and eye patients should avoid outdoor travel and keep inhalers handy.",
            "ha": "Masu asma da ciwon ido su guje wa tafiya waje, su riƙe maganinsu.",
        },
        "severe": {
            "en": "People with breathing problems should stay indoors. Seek care if breathing gets hard.",
            "ha": "Masu matsalar numfashi su kasance a ciki. Nemi taimakon likita idan numfashi ya yi wahala.",
        },
    },
}

TOPIC_ICONS = {
    "laundry": "shirt",
    "market": "shopping-basket",
    "school": "graduation-cap",
    "health": "heart-pulse",
}

HEADLINES: dict[str, dict[str, str]] = {
    "low": {
        "en": "Dust is low today in Gombe.",
        "ha": "Yau ƙura ba ta da yawa a Gombe.",
    },
    "moderate": {
        "en": "A little dust in the air today.",
        "ha": "Ƙura kaɗan tana iska yau.",
    },
    "high": {
        "en": "Heavy dust expected. Adjust your day.",
        "ha": "Ana sa ran ƙura mai yawa. Ka gyara shirinka.",
    },
    "severe": {
        "en": "Dangerous dust. Stay indoors where you can.",
        "ha": "Ƙura mai haɗari. Ka kasance a ciki idan za ka iya.",
    },
}

DISCLAIMER = {
    "en": "General guidance from a dust forecast, not medical advice.",
    "ha": "Shawara ce ta gama-gari daga hasashen ƙura, ba magani ba.",
}

SITE_URL = "kura.alert/gombe"
BRAND = "Ƙura Alert"


def _fmt_date(iso: str, lang: str, index: int = 0) -> str:
    d = date.fromisoformat(iso)
    if lang == "ha":
        return f"{HAUSA_DAYS[d.weekday()]} {d.day} {HAUSA_MONTHS[d.month - 1]}"
    return f"{ENGLISH_DAYS[d.weekday()]} {d.day} {ENGLISH_MONTHS[d.month - 1]}"


def build_advice(level: str) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for topic, by_level in ADVICE.items():
        text = by_level[level]
        out[topic] = {
            "en": text["en"],
            "ha": text["ha"],
            "icon": TOPIC_ICONS[topic],
        }
    return out


def build_message(day: dict[str, Any], lang: str) -> str:
    level = day["level"]
    meta = day["level_meta"]
    title = "Yau" if day.get("is_today") else _fmt_date(day["date"], lang)
    headline = HEADLINES[level][lang]
    laundry = ADVICE["laundry"][level][lang]
    market = ADVICE["market"][level][lang]
    if lang == "ha":
        lines = [
            f"{BRAND} — Gombe",
            f"{title} · {meta['ha']} ({day['score']}/100)",
            headline,
            laundry,
            market,
            f"Ƙarin bayani: {SITE_URL}",
            DISCLAIMER["ha"],
        ]
    else:
        lines = [
            f"{BRAND} — Gombe",
            f"{title} · {meta['en']} dust ({day['score']}/100)",
            headline,
            laundry,
            market,
            f"More: {SITE_URL}",
            DISCLAIMER["en"],
        ]
    return "\n".join(lines)


def build_sms(day: dict[str, Any], lang: str) -> str:
    level = day["level"]
    if lang == "ha":
        return (
            f"{BRAND}: {_fmt_date(day['date'], 'ha')} — {day['level_meta']['ha']} "
            f"({day['score']}/100). {ADVICE['laundry'][level]['ha']} "
            f"Shawara ce, ba magani ba."
        )
    return (
        f"{BRAND}: {_fmt_date(day['date'], 'en')} — {day['level_meta']['en']} dust "
        f"({day['score']}/100). {ADVICE['laundry'][level]['en']} General guidance only."
    )


def day_payload(day: dict[str, Any], thresholds: dict[str, Any]) -> dict[str, Any]:
    from .index import score_day
    from .sources.openmeteo import today_local

    scored = score_day(day, thresholds)
    enriched = {
        **day,
        **scored,
        "is_today": day["date"] == today_local(),
        "weekday_en": ENGLISH_DAYS[date.fromisoformat(day["date"]).weekday()],
        "weekday_ha": HAUSA_DAYS[date.fromisoformat(day["date"]).weekday()],
        "date_label_en": _fmt_date(day["date"], "en"),
        "date_label_ha": _fmt_date(day["date"], "ha"),
        "headline": HEADLINES[scored["level"]],
        "advice": build_advice(scored["level"]),
    }
    enriched["message"] = {
        "whatsapp_en": build_message(enriched, "en"),
        "whatsapp_ha": build_message(enriched, "ha"),
        "sms_en": build_sms(enriched, "en"),
        "sms_ha": build_sms(enriched, "ha"),
    }
    return enriched
