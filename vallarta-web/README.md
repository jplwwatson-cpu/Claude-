# PV Websites

Static, multi-page site for a web design studio in Puerto Vallarta. No build step: upload this folder to any static host (Netlify Drop, Vercel, GitHub Pages, cPanel).

## Structure

- Five tabs: Inicio, Servicios, Trabajo, Nosotros, Contacto. Each tab is a `<section data-page>` in `index.html`, switched by the URL hash (`#servicios`). On tablets and phones the tabs become a bottom tab bar.
- Three styles from the switch at the top center: Minimalistic, Premium, Interactive. Each one has its own layouts in `styles.css` under `[data-mode="minimal"]`, `[data-mode="premium"]` and `[data-mode="interactive"]`. The choice is saved and also works as a link: `?mode=interactive`.
- Interactive mode shows a 3D model of El Caballito (the seahorse statue on the Malecón), built in `scene3d.js` with three.js. three.js is self-hosted in `vendor/` (MIT license).
- Three languages: Spanish text lives in `index.html`; English and French live in the `en` and `fr` objects in `app.js`.

## Contact form

The form posts to [FormSubmit](https://formsubmit.co), which forwards each message to the email in the form's `action`.

1. Publish the site. The form does not send from a file opened on your computer (`file://`).
2. Send one test message. FormSubmit emails an activation link to the inbox. Click it once.
3. To change the inbox, edit the `action` URL on the `<form>` and the `mailto:` link above it in `index.html`. Repeat the activation for the new address.

After activation, FormSubmit gives you a random alias. Use it in `action` instead of the email to keep the address out of the page source.

## Photos

Free photos from Unsplash (Puerto Vallarta photos by José Carrillo, Nicole Herrero, Taylor Beach and Alonso Reyes, plus general stock). For the best speed and reliability, download the ones you keep, put them in an `img/` folder and point the `src` attributes at them. Replace them with your own photos and your team when you can.

## Fonts and icons

Google Fonts (Geist, Plus Jakarta Sans, Cormorant Garamond, Bricolage Grotesque). Phosphor Icons (MIT), self-hosted in `fonts/`.
