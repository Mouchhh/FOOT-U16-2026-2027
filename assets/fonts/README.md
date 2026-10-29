# Fonts for the causerie presentation

These unmodified font files are loaded locally and only when exporting a
presentation. They match the families identified in the coach's Canva reference:
Calistoga for the body, Montserrat bold italic for headings. They do not change
the site's normal typography.

- `calistoga/Calistoga-Regular.ttf`: https://github.com/google/fonts/tree/main/ofl/calistoga
- `montserrat/Montserrat-Italic.ttf`: the variable `Montserrat-Italic[wght].ttf`
  from https://github.com/google/fonts/tree/main/ofl/montserrat
- Each family includes its own `OFL.txt` (SIL Open Font License).

The PPTX declares the font families; it does not embed fonts in the presentation.
The receiving presentation app must resolve those fonts. Check a real Canva
import as well as the generated file before promising identical rendering.
