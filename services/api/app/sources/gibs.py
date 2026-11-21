"""NASA GIBS / Worldview tile + WMS helpers (no auth, public).

The dashboard shows yesterday's true-colour imagery and the aerosol/UV
layers straight from NASA's Global Imagery Browse Services, with a Gombe
marker drawn on top.
"""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any
from urllib.parse import urlencode

from ..config import GOMBE

WMS = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"

# lat_min, lon_min, lat_max, lon_max — northern Nigeria + neighbours
BBOX = (4.0, 3.0, 16.0, 19.0)

LAYERS: list[dict[str, str]] = [
    {
        "id": "truecolor",
        "label": "True colour",
        "layer": "VIIRS_NOAA20_CorrectedReflectance_TrueColor",
        "note": "What the dust looks like from orbit (VIIRS, NOAA-20)",
    },
    {
        "id": "aod",
        "label": "Aerosol optical depth",
        "layer": "MODIS_Terra_Aerosol_Optical_Depth_3km",
        "note": "MODIS 3 km AOD at 550 nm — thicker colour means more dust",
    },
    {
        "id": "uvai",
        "label": "UV aerosol index",
        "layer": "OMI_Aerosol_Index",
        "note": "OMI UV Aerosol Index — absorbing dust and smoke",
    },
]


def image_url(layer: str, day: str, width: int = 960, height: int = 720) -> str:
    params = {
        "SERVICE": "WMS",
        "REQUEST": "GetMap",
        "VERSION": "1.3.0",
        "LAYERS": layer,
        "STYLES": "",
        "FORMAT": "image/jpeg" if "Reflectance" in layer else "image/png",
        "TRANSPARENT": "FALSE" if "Reflectance" in layer else "TRUE",
        "HEIGHT": str(height),
        "WIDTH": str(width),
        "CRS": "EPSG:4326",
        "BBOX": ",".join(str(v) for v in BBOX),
        "TIME": day,
    }
    return f"{WMS}?{urlencode(params)}"


def payload(day: str | None = None) -> dict[str, Any]:
    day = day or (date.today() - timedelta(days=1)).isoformat()
    lat_min, lon_min, lat_max, lon_max = BBOX
    return {
        "date": day,
        "bbox": {"lat_min": lat_min, "lon_min": lon_min, "lat_max": lat_max, "lon_max": lon_max},
        "marker": {
            "lat": GOMBE["lat"],
            "lon": GOMBE["lon"],
            "left_pct": round((GOMBE["lon"] - lon_min) / (lon_max - lon_min) * 100, 2),
            "top_pct": round((lat_max - GOMBE["lat"]) / (lat_max - lat_min) * 100, 2),
        },
        "layers": [
            {
                "id": item["id"],
                "label": item["label"],
                "note": item["note"],
                "url": image_url(item["layer"], day),
            }
            for item in LAYERS
        ],
        "attribution": "NASA GIBS / Worldview",
        "worldview_url": (
            "https://worldview.earthdata.nasa.gov/?v=3.0,4.0,19.0,16.0"
            f"&s={day}&t={day}"
        ),
    }
