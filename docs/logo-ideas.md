# Logo ideas

Ƙura Alert needs a mark that reads at 32 px in a WhatsApp profile, on a
laminated school poster, and on a 16×2 LCD beside an Arduino. The shipped
mark is **Concept 1: Harmattan K**; three alternates are included for a
future rebrand.

All files are SVG, so they scale without assets and can be recoloured in one
line.

| Concept | File | Best for | Why it works |
| --- | --- | --- | --- |
| **1. Harmattan K** (shipped) | [`assets/logo-mark.svg`](../assets/logo-mark.svg) | App icon, header, favicon, sticker | A hard-edged **Ƙ** with a dust wave under it, a brass sun, and a warm clay horizon. It is a letter first, so Hausa speakers recognise it instantly. |
| 2. Wind compass | [`assets/concepts/logo-wind-compass.svg`](../assets/concepts/logo-wind-compass.svg) | Report covers, dashboards, wayfinding | A compass rose made from a K and a wind arrow. Suggests direction and forecast without a cloud or a droplet cliché. |
| 3. Sun through haze | [`assets/concepts/logo-sun-haze.svg`](../assets/concepts/logo-sun-haze.svg) | Social posts, presentation title slides | Three dust bands over a brass sun: the harmattan in one image. Warmer and more emotional than the shipped mark. |
| 4. Node signal | [`assets/concepts/logo-node-signal.svg`](../assets/concepts/logo-node-signal.svg) | Hardware labels, Arduino enclosure, field guide | A sensor mast with signal arcs and a ground wave. Connects the satellite forecast to the physical node. |

## The shipped mark

![Ƙura Alert mark](../assets/logo-mark.svg)

**Story.** The glyph is the Hausa **Ƙ** (a hooked K), which is the first sound
of *ƙura* — dust. The two strokes that extend beyond the letter become the
horizon and the dust front. The small brass circle is the sun that harmattan
haze turns flat and white. The dark green is the palm/savannah, not the usual
"dust = orange" shorthand, so the product does not look like a pollution
warning all year round.

**Palette**

| Token | Hex | Use |
| --- | --- | --- |
| Night green | `#16241c` | Mark background, primary dark surfaces |
| Sand | `#f8f1e3` | Page background |
| Brass | `#e6b566` | Sun, CTA, highlights |
| Clay | `#bf5a30` | Dust waves, alert accents |
| Palm | `#2c5f46` | Low-risk / positive state |
| Ink | `#1d1712` | Text |

**Type.** Display: Iowan Old Style / Palatino / Georgia (system serif, no web
font download). UI: the system sans stack. The wordmark keeps the hooked Ƙ
and the macron-free "Alert" so it stays legible on cheap Android screens.

## Lockups and variants

- Horizontal lockup: [`assets/logo-lockup.svg`](../assets/logo-lockup.svg)
  — mark + "Ƙura Alert" + "HARMATTAN DUST FORECAST · GOMBE".
- App icon: [`apps/web/app/icon.svg`](../apps/web/app/icon.svg) — simplified,
  20 px radius, no wordmark.
- One-colour use: print the mark in `#1d1712` on sand, or in `#f8f1e3` on
  night green. The brass sun may become a ring if the printer is monochrome.

## Rules of thumb

1. Keep clear space equal to the sun's diameter on every side.
2. Do not put the mark on a busy satellite image; use the solid night-green
   tile instead.
3. Minimum sizes: 24 px for the icon, 120 px wide for the horizontal lockup.
4. Do not stretch, outline, gradient-fill, or rotate the mark.
5. The Ƙ is not a decorative K. Do not replace it with "Kura" in the wordmark.

## If we rebrand

Concept 2 is the safest evolution: it keeps the compass/forecast idea and
works in a square avatar. Concept 3 is the strongest poster image. Concept 4
should become the hardware badge even if the main mark changes — it tells the
field story better than a letter can.
