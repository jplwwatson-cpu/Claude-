# Malecón Studio website

Static site for a web design studio in Puerto Vallarta. No build step: open `index.html` or upload the folder to any static host (Netlify, Vercel, GitHub Pages, cPanel).

## Three styles, same content

The switch at the top center changes `<html data-mode>` between `minimal`, `premium` and `interactive`. All styling lives in `styles.css` under those selectors. The chosen mode is saved in the browser and in the URL (`?mode=interactive`), so you can share a link to a specific style.

The language button toggles Spanish and English. Spanish text lives in `index.html`; English text lives in the `en` object in `app.js`.

## Contact form

The form posts to [FormSubmit](https://formsubmit.co), which forwards each message to the email in the form's `action` attribute.

1. Publish the site and send one test message.
2. FormSubmit emails an activation link to that inbox. Click it once. Messages arrive after that.
3. To change the inbox, edit the `action` URL on the `<form>` and the `mailto:` link above it in `index.html`. Repeat the activation for the new address.

After activation, FormSubmit also gives you a random alias. Put that alias in place of the email in `action` to keep the address out of the page source.

## Before going live

- Replace the `picsum.photos` placeholder images with real photos of Puerto Vallarta and your work. Search `picsum` in `index.html` and `styles.css` to find all 8 spots.
- "Malecón Studio" is a placeholder name. Search and replace it.
- Icons: Phosphor Icons (MIT), self-hosted in `fonts/`.
