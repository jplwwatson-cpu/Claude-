# PV Websites

Static, multi-page site for a web design studio in Puerto Vallarta. No build step: upload this folder to any static host (Netlify Drop, Vercel, GitHub Pages, cPanel).

## Structure

- Five tabs: Inicio, Servicios, Trabajo, Nosotros, Contacto. Each tab is a `<section data-page>` in `index.html`, switched by the URL hash (`#servicios`). On tablets and phones the tabs become a bottom tab bar.
- Three styles from the switch at the top center: Minimalistic, Premium, Interactive. Each one has its own layouts in `styles.css` under `[data-mode="minimal"]`, `[data-mode="premium"]` and `[data-mode="interactive"]`. The choice is saved and also works as a link: `?mode=interactive`.
- Photos in `img/` are of Puerto Vallarta (the Malecón and Los Muertos beach), supplied by the site owner. Confirm you have the rights to use them, or replace them with your own.
- Work concepts are shown as typographic brand covers made in CSS (`.cover` in `styles.css`), so the site needs no stock photos.
- Three languages: Spanish text lives in `index.html`; English and French live in the `en` and `fr` objects in `app.js`.

## Contact form

The form posts to [FormSubmit](https://formsubmit.co), which forwards each message to the email in the form's `action`.

1. Publish the site. The form does not send from a file opened on your computer (`file://`).
2. Send one test message. FormSubmit emails an activation link to the inbox. Click it once.
3. To change the inbox, edit the `action` URL on the `<form>` and the `mailto:` link above it in `index.html`. Repeat the activation for the new address.

After activation, FormSubmit gives you a random alias. Use it in `action` instead of the email to keep the address out of the page source.


## Fonts and icons

Google Fonts (Geist, Plus Jakarta Sans, Cormorant Garamond, Bricolage Grotesque). Phosphor Icons (MIT), self-hosted in `fonts/`.
