# Rabbit Holes — logo assets

The brand mark is the "o" in *Holes*, drawn as a bunny (an open ring + two ears).
The live web/extension logo is rendered inline from `components/Logo.tsx`; these files
are standalone exports for everything outside the app (README, social, store listings).

| File | Use |
| --- | --- |
| `bunny-mark.svg` | Mark in ink (`#2a2018`) for light backgrounds |
| `bunny-mark-cream.svg` | Mark in cream (`#f3e8d4`) for dark backgrounds |
| `app-icon.svg` | Rounded paper tile + mark — store / app-icon lockup |
| `wordmark-lockup.svg` | Horizontal mark + "Rabbit Holes" wordmark |

Notes:
- The mark uses a single colour and works monochrome — recolour by editing `fill`/`stroke`.
- `wordmark-lockup.svg` sets the type in Playfair Display with a Georgia serif fallback;
  convert the text to outlines before sending anywhere the webfont won't load.
- The sitting-bunny illustration (`app/icon.png`) is the favicon only; the
  bunny-over-a-hole art (`assets/images/rabbit-hole-hero.png`) is the decorative sprite.
