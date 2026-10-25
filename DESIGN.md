# Mechanic controls extension
Preserve the existing sandbox, camera, HUD and cast browser. Add a collapsible
Combat mechanics panel at the left edge, using native buttons (no UI dependency).
Dark #101923 surface, #e8edf5 text, #e9b75b focus/selection, 1px #435268 borders.
System sans 12–14px, 6/12px gaps, 44px touch targets. At <=600px the panel is
collapsed initially, bounded to 90vw and 45vh with scrolling. Buttons expose
name, hotkey, cooldown and instruction; keyboard focus is visible. No decorative
SVG. Live status is text, never color alone. Optional drill and sound default off.
VFX use solid silhouettes, restrained emissive accents and simulation-driven
motion; reduced motion removes orbital flourish without changing timing/collision.
