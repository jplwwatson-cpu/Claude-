# Bahía Studio

Static, multi-page site for a web design studio in Puerto Vallarta. No build step: upload this folder to any static host (Netlify Drop, Vercel, GitHub Pages, cPanel).

## Structure

- Five tabs: Inicio, Servicios, Trabajo, Nosotros, Contacto. Each tab is a `<section data-page>` in `index.html`, switched by the URL hash (`#servicios`). On tablets and phones the tabs become a bottom tab bar.
- Six styles from the Style menu at the top center: Fluid (default), Minimalistic, Premium, Interactive, Editorial and Playa (beach: sand and turquoise, script headings, wave edges). Each one has its own tokens and layouts in `styles.css` under `[data-mode="fluid"]`, `minimal`, `premium`, `interactive`, `editorial` and `playa`. The content is the same in all of them. The choice is saved and also works as a link: `?mode=editorial`.
- Home hero: one video per style in `video/` (MP4 with a WebM fallback, 720p, no audio), each with a poster in `img/`. `app.js` loads and plays only the clip for the current style and pauses it on other tabs or under reduced motion.
- Photos and footage of Puerto Vallarta in `img/` and `video/` were supplied by the site owner from Pexels (free for commercial use).
- Work concepts are brand covers: some on photos (`.cover.photo`), some typographic, all in `styles.css`.
- Three languages: Spanish text lives in `index.html`; English and French live in the `en` and `fr` objects in `app.js`.

## Contact form

The form posts to [FormSubmit](https://formsubmit.co), which forwards each message to the email in the form's `action`.

1. Publish the site. The form does not send from a file opened on your computer (`file://`).
2. Send one test message. FormSubmit emails an activation link to the inbox. Click it once.
3. To change the inbox, edit the `action` URL on the `<form>` and the `mailto:` link above it in `index.html`. Repeat the activation for the new address.

After activation, FormSubmit gives you a random alias. Use it in `action` instead of the email to keep the address out of the page source.


## Fonts and icons

Geist, Geist Mono, Plus Jakarta Sans, Cormorant Garamond, Bricolage Grotesque and Outfit (SIL OFL), Yellowtail (Apache 2.0), all from Fontsource, and Phosphor Icons (MIT), all self-hosted in `fonts/`, so no visitor data goes to a font CDN.
