# Stillpoint — `atlas/stillpoint`
Control · zone · range 2–16 m · dome r 3.2 m, 2.3 m high · ≈ 0.4 s travel + 0.6 s form + 0.8 s tear/catch + 2.2 s held + 1.1 s release flight + 1.2 s dissolve

## Read in one line
A faceted violet seed drifts on an arc to a ring closing on the floor; a dome of dark time-glass panes rises out of it, the floor tears and its stones and glass are caught dead in the air and slowly turned while a time-hand drags round the dome, then everything stored lets go at once and the fragments throw the bodies down.

## Beats
| t (s, from cast) | Beat | On screen |
|-------|------|-----------|
| 0.00–0.4 | Anticipation + travel | A 0.32 m faceted seed (deep #0d0626 body, violet facets, pale rim, slow white heart) grows out of the hand and arcs to the mark, leaving motes hanging; on the floor a violet ring closes on the landing point over a darkening disc. |
| 0.4–1.0 | Form (impact) | Ripple decal and thump; the dome draws itself up from the floor, each pane on its own lag, the leading row burning; floor goes dark indigo #080320 with dilation rings creeping inward. |
| 0.7–1.2 | Tear + catch | Crack + dust ring; 26 rocks and 18 glass slivers flung up and decelerated to a dead stop at their hang points, cracks glowing violet; bodies inside freeze mid-breath and stain violet. |
| 1.2–1.9 | Held (linger with motion) | The constellation turns about the centre (0.6 rad/s), each piece turning slowly; a time hand — a bright meridian with a cooling wake — rolls round the dome, dragging at ×0.25 while held; ripples crawl inside each pane; the image drags inward (lens). |
| ≈1.9–2.2 | Release (impact 2) | Tremble, then every fragment flies outward along its own bearing with streaks; shockwave, violet AIR burst, warp ring, flash + shake; bodies touched are thrown along the fragment. |
| 2.2–4.3 | Exit | Dome dissolves crown-first with a burning edge, floor fades, the crack decal stays. |

## Layers
1. Dome (hero) — geodesic icosphere, two premultiplied passes (far wall, near wall): filled dark glass panes (fresnel-thick, faceted sun glint, per-pane tint, inner ripples), time-hand sweep, thin frames and nodes, form/dissolve.
2. Floor — premultiplied: deep indigo disc, inward-creeping rings, spokes, torn patches; telegraph ring in flight.
3. Debris — instanced lumpy rock (lit, voronoi cracks glowing) and refractive glass slivers, closed-form paths.
4. Seed — faceted premultiplied crystal on the travel arc + mote trail.
5. Particles & impacts — SMOKE dust, SOFT motes, STREAK streaks; CRACK, DUSTRING, SHOCKWAVE, RIPPLE decals; AIR burst.
6. Dilation lens on LAYER.DISTORTION.

## Palette (four-stop)
#fbf8ff nodes/glint → #9b7dff frames / #8a66ff rim → #3a1d9e pane body → #0d0626 pane deep (most of the mass); floor #5a3ae0 rings on #080320.

## Hits
Unchanged rules: held bodies released at the release, killed only by a fragment's swept segment within `killReach` 9 m / `fragmentHitRadius` 0.55 m. Default `holdTime` stays 2.2 s (the freeze duration is gameplay); captures of the release need `--frames` past 4 s.
