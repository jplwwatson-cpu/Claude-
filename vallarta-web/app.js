// PV Websites: page tabs, three visual modes, three languages, interactive extras and the contact form.
(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(pointer: fine)");
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };
  const isInteractive = () => root.dataset.mode === "interactive" && !reduceMotion.matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  root.classList.add("js");

  /* ================= LANGUAGES (Spanish lives in the HTML) ================= */
  const en = {
    skip: "Skip to content", modeLabel: "Site style", modeInteractive: "Interactive", navLabel: "Main", langLabel: "Language",
    navHome: "Home", navServices: "Services", navWork: "Work", navAbout: "About", navContact: "Contact",
    heroEyebrow: "Web studio in Puerto Vallarta",
    heroTitleA: "Websites that help", heroTitleB: "your business grow.",
    heroLead: "Design, development and local SEO for restaurants, hotels, tours and businesses around Banderas Bay.",
    ctaQuote: "Get a quote", ctaWork: "See our work",
    areasLabel: "Areas we work in",
    whyTitle: "A website as good as what you offer.",
    why1Title: "Our own design", why1Body: "No templates. Your site looks like your business, not like the one next door.",
    why2Title: "Fast on phones", why2Body: "Almost all your customers find you on their phone. We design for them first.",
    why3Title: "In three languages", why3Body: "Spanish, English and French for locals, tourists and expats.",
    featuredTitle: "Recent concepts.",
    bandTitle: "Ready for your new website?", bandBody: "Tell us about your business and we will send you a clear proposal.",
    servicesTitle: "Everything your business needs online.",
    servicesLead: "Pick one service or combine them. Every project includes design, development and launch.",
    s1Title: "Custom websites", s1Body: "Our own design, no templates. Fast on phones and easy to update.",
    s1a: "A unique design for your brand", s1b: "All the pages your business needs", s1c: "A panel to edit text and photos",
    s2Title: "Online stores", s2Body: "Sell products, tours or bookings with online payments.",
    s2a: "Catalog with photos and prices", s2b: "Cart and card payments", s2c: "Order alerts by email",
    s3Title: "Local SEO and Google Maps", s3Body: "Get found when people search for what you offer in Vallarta.",
    s3a: "Optimized Google Business profile", s3b: "Copy written for local searches", s3c: "Speed and technical details in order",
    s4Title: "Trilingual from day one", s4Body: "Well-written Spanish, English and French for locals, tourists and expats.",
    s4a: "Language switch on every page", s4b: "Translations reviewed by people", s4c: "Google shows you in the right language",
    s5Title: "Hosting and support", s5Body: "We take care of the domain, security and updates.",
    s5a: "Domain and security certificate", s5b: "Backups and updates", s5c: "Content changes whenever you need them",
    processTitle: "From the first call to launch day.",
    p1Title: "We talk", p1Body: "We learn about your business, your customers and your goals.",
    p2Title: "We design", p2Body: "You see the design before we write a single line of code.",
    p3Title: "We build", p3Body: "Clean, fast code that is ready for Google.",
    p4Title: "We launch", p4Body: "We publish your site and show you how to use it.",
    faqTitle: "Frequently asked questions",
    q1: "How long does a website take?", a1: "It depends on the size of the project. The proposal includes a clear delivery date, and we keep it.",
    q2: "Can I update the site myself?", a2: "Yes. You get a simple panel to change text, photos and prices, and we show you how to use it.",
    q3: "Are the domain and hosting included?", a3: "We can take care of everything, or use the domain you already have. You always own your domain.",
    q4: "I already have a site. Can you improve it?", a4: "Yes. We review what you have, keep what works and redesign the rest.",
    workTitle: "Design concepts for businesses around the bay.",
    workLead: "This is how your business could look. Tap a concept to see what it includes.",
    filterLabel: "Filter concepts", fAll: "All", fFood: "Restaurants", fStay: "Lodging", fTours: "Tours", fHomes: "Real estate",
    w1Title: "Seafood restaurant", w1Body: "Online menu, reservations and a WhatsApp button.", w1a: "Menu with photos and prices", w1b: "Online reservations", w1c: "WhatsApp button and map",
    w2Title: "Beach club", w2Body: "Lounger bookings, events and a photo gallery.", w2a: "Lounger bookings", w2b: "Events calendar", w2c: "Instagram gallery",
    w3Title: "Boutique hotel", w3Body: "Room gallery and direct bookings with no commissions.", w3a: "Room gallery", w3b: "Direct booking engine", w3c: "Guest reviews",
    w4Title: "Vacation rental", w4Body: "Availability calendar and direct contact with the owner.", w4a: "Availability calendar", w4b: "Area guide for guests", w4c: "Direct contact with the owner",
    w5Title: "Boat tours", w5Body: "Calendar, online payments and Google reviews.", w5a: "Departure calendar", w5b: "Online deposit payment", w5c: "Google reviews on the site",
    w6Title: "Surf school", w6Body: "Lessons by level, board rentals and a surf report.", w6a: "Lessons by level", w6b: "Board rentals", w6c: "Daily surf report",
    w7Title: "Real estate", w7Body: "Listings with filters, a map and multilingual property pages.", w7a: "Search with filters", w7b: "Property map", w7c: "Property pages in three languages",
    w8Title: "Condos in the Marina", w8Body: "Pre-sale with floor plans, construction updates and an interest form.", w8a: "Floor plans and pre-sale prices", w8b: "Construction updates with photos", w8c: "Interest form",
    c1: "Seafood", c2: "Beach club", c3: "Hotel", c4: "Villa", c5: "On board", c6: "Surf", c7: "Homes", c8: "Marina",
    close: "Close", includesLabel: "What it includes", wantThis: "I want one like this",
    aboutAlt: "Banderas Bay beach and palm trees seen from above", aboutEyebrow: "About us", aboutTitle: "We make professional websites.",
    aboutBody1: "For two years we have been in Puerto Vallarta, helping local businesses look great online and win more customers.",
    aboutBody2: "We work face to face, in Spanish, English and French. Once your site is live, we are still here for whatever you need.",
    fact1: "years in Puerto Vallarta", fact2: "languages: Spanish, English and French", fact3: "direct contact, no middlemen",
    valuesTitle: "How we work.",
    v1Title: "You talk to the designer", v1Body: "No salespeople, no middlemen. The person who listens to you is the one who builds your site.",
    v2Title: "Clear prices", v2Body: "You get a fixed price in writing before we start. No surprises.",
    v3Title: "We are local", v3Body: "We know Vallarta and its customers. You can meet us in person whenever you want.",
    contactTitle: "Tell us about your project.",
    contactLead: "Build your project, send us a message and we will reply by email with a proposal and a clear price.",
    footerPlace: "Puerto Vallarta, Jalisco, Mexico", footerLabel: "Footer",
    bType: "What do you need?", o1: "New website", o2: "Redesign my site", o3: "Online store", o4: "SEO and Google Maps",
    bExtras: "Extras (pick any)", x1: "Reservations", x2: "Online payments", x3: "Three languages", x4: "Gallery", x5: "Blog", x6: "WhatsApp button",
    fName: "Name", eName: "Enter your name.", fEmail: "Email", eEmail: "Enter a valid email.", fPhone: "WhatsApp", optional: "(optional)",
    fMsg: "Message", hMsg: "What does your business do, and what do you want your website to achieve?", eMsg: "Enter a message.",
    send: "Send message", sending: "Sending…",
    sent: "Message sent. We will reply soon.",
    failed: "The message could not be sent. Try again, or write to us at the email on this page.",
    timeout: "The server took too long to answer. Check your connection and try again.",
    activate: "Almost there: the inbox owner must click the activation link FormSubmit just emailed. After that, messages arrive.",
    fileProto: "The form only sends from the published site (for example on Netlify), not from a file opened on your computer.",
    interest: "I am interested in a site like this concept:",
    preview: "This is a preview, so the form does not send. Write to us at jplw.watson@gmail.com.",
  };
  const fr = {
    skip: "Aller au contenu", modeLabel: "Style du site", modeInteractive: "Interactif", navLabel: "Principal", langLabel: "Langue",
    navHome: "Accueil", navServices: "Services", navWork: "Projets", navAbout: "À propos", navContact: "Contact",
    heroEyebrow: "Studio web à Puerto Vallarta",
    heroTitleA: "Des sites web qui font", heroTitleB: "grandir votre entreprise.",
    heroLead: "Design, développement et référencement local pour restaurants, hôtels, excursions et commerces de la baie de Banderas.",
    ctaQuote: "Demander un devis", ctaWork: "Voir nos projets",
    areasLabel: "Zones où nous travaillons",
    whyTitle: "Un site à la hauteur de ce que vous offrez.",
    why1Title: "Un design unique", why1Body: "Aucun modèle tout fait. Votre site ressemble à votre entreprise, pas à celle d’à côté.",
    why2Title: "Rapide sur mobile", why2Body: "Presque tous vos clients vous cherchent depuis leur téléphone. Nous pensons d’abord à eux.",
    why3Title: "En trois langues", why3Body: "Espagnol, anglais et français pour les locaux, les touristes et les résidents étrangers.",
    featuredTitle: "Concepts récents.",
    bandTitle: "Prêt pour votre nouveau site ?", bandBody: "Parlez-nous de votre entreprise et nous vous enverrons une proposition claire.",
    servicesTitle: "Tout ce dont votre entreprise a besoin en ligne.",
    servicesLead: "Choisissez un service ou combinez-les. Chaque projet comprend le design, le développement et la mise en ligne.",
    s1Title: "Sites web sur mesure", s1Body: "Un design unique, sans modèle. Rapide sur mobile et facile à mettre à jour.",
    s1a: "Un design unique pour votre marque", s1b: "Toutes les pages dont vous avez besoin", s1c: "Un panneau pour modifier textes et photos",
    s2Title: "Boutiques en ligne", s2Body: "Vendez des produits, des excursions ou des réservations avec paiement en ligne.",
    s2a: "Catalogue avec photos et prix", s2b: "Panier et paiement par carte", s2c: "Alertes de commande par e-mail",
    s3Title: "Référencement local et Google Maps", s3Body: "Soyez trouvé quand on cherche ce que vous offrez à Vallarta.",
    s3a: "Fiche Google Business optimisée", s3b: "Textes pensés pour les recherches locales", s3c: "Vitesse et détails techniques en ordre",
    s4Title: "Trilingue dès le départ", s4Body: "Espagnol, anglais et français bien écrits, pour les locaux, les touristes et les résidents étrangers.",
    s4a: "Sélecteur de langue sur chaque page", s4b: "Traductions relues par des personnes", s4c: "Google vous affiche dans la bonne langue",
    s5Title: "Hébergement et assistance", s5Body: "Nous nous occupons du domaine, de la sécurité et des modifications.",
    s5a: "Domaine et certificat de sécurité", s5b: "Sauvegardes et mises à jour", s5c: "Modifications de contenu quand vous voulez",
    processTitle: "Du premier appel à la mise en ligne.",
    p1Title: "On discute", p1Body: "Nous découvrons votre entreprise, vos clients et vos objectifs.",
    p2Title: "On dessine", p2Body: "Vous voyez le design avant que nous écrivions une seule ligne de code.",
    p3Title: "On construit", p3Body: "Un code propre, rapide et prêt pour Google.",
    p4Title: "On lance", p4Body: "Nous publions votre site et vous apprenons à l’utiliser.",
    faqTitle: "Questions fréquentes",
    q1: "Combien de temps faut-il pour un site ?", a1: "Cela dépend de la taille du projet. La proposition indique une date de livraison claire, et nous la respectons.",
    q2: "Puis-je mettre à jour le site moi-même ?", a2: "Oui. Vous avez un panneau simple pour changer textes, photos et prix, et nous vous montrons comment faire.",
    q3: "Le domaine et l’hébergement sont-ils inclus ?", a3: "Nous pouvons tout gérer, ou utiliser le domaine que vous avez déjà. Le domaine reste toujours à vous.",
    q4: "J’ai déjà un site. Pouvez-vous l’améliorer ?", a4: "Oui. Nous analysons l’existant, gardons ce qui fonctionne et refaisons le reste.",
    workTitle: "Concepts de design pour les entreprises de la baie.",
    workLead: "Voici à quoi pourrait ressembler votre entreprise. Touchez un concept pour voir ce qu’il comprend.",
    filterLabel: "Filtrer les concepts", fAll: "Tous", fFood: "Restaurants", fStay: "Hébergement", fTours: "Excursions", fHomes: "Immobilier",
    w1Title: "Restaurant de fruits de mer", w1Body: "Menu en ligne, réservations et bouton WhatsApp.", w1a: "Menu avec photos et prix", w1b: "Réservations en ligne", w1c: "Bouton WhatsApp et carte",
    w2Title: "Club de plage", w2Body: "Réservation de transats, événements et galerie photo.", w2a: "Réservation de transats", w2b: "Calendrier des événements", w2c: "Galerie Instagram",
    w3Title: "Hôtel boutique", w3Body: "Galerie des chambres et réservations directes sans commission.", w3a: "Galerie des chambres", w3b: "Moteur de réservation directe", w3c: "Avis des clients",
    w4Title: "Location de vacances", w4Body: "Calendrier de disponibilité et contact direct avec le propriétaire.", w4a: "Calendrier de disponibilité", w4b: "Guide du quartier pour les hôtes", w4c: "Contact direct avec le propriétaire",
    w5Title: "Excursions en bateau", w5Body: "Calendrier, paiement en ligne et avis Google.", w5a: "Calendrier des départs", w5b: "Acompte payé en ligne", w5c: "Avis Google sur le site",
    w6Title: "École de surf", w6Body: "Cours par niveau, location de planches et bulletin des vagues.", w6a: "Cours par niveau", w6b: "Location de planches", w6c: "Bulletin des vagues du jour",
    w7Title: "Immobilier", w7Body: "Annonces avec filtres, carte et fiches en plusieurs langues.", w7a: "Recherche avec filtres", w7b: "Carte des propriétés", w7c: "Fiches en trois langues",
    w8Title: "Condos à la Marina", w8Body: "Prévente avec plans, avancement des travaux et formulaire d’intérêt.", w8a: "Plans et prix de prévente", w8b: "Avancement des travaux en photos", w8c: "Formulaire d’intérêt",
    c1: "Fruits de mer", c2: "Beach club", c3: "Hôtel", c4: "Villa", c5: "À bord", c6: "Surf", c7: "Maisons", c8: "Marina",
    close: "Fermer", includesLabel: "Ce qui est inclus", wantThis: "J’en veux un comme ça",
    aboutAlt: "Plage et palmiers de la baie de Banderas vus d’en haut", aboutEyebrow: "À propos", aboutTitle: "Nous créons des sites web professionnels.",
    aboutBody1: "Depuis deux ans, nous aidons à Puerto Vallarta les entreprises locales à soigner leur image en ligne et à gagner des clients.",
    aboutBody2: "Nous travaillons en personne, en espagnol, en anglais et en français. Une fois votre site en ligne, nous restons là pour vous.",
    fact1: "ans à Puerto Vallarta", fact2: "langues : espagnol, anglais et français", fact3: "contact direct, sans intermédiaire",
    valuesTitle: "Notre façon de travailler.",
    v1Title: "Vous parlez au designer", v1Body: "Ni vendeurs ni intermédiaires. La personne qui vous écoute est celle qui crée votre site.",
    v2Title: "Des prix clairs", v2Body: "Vous recevez un prix fixe par écrit avant de commencer. Aucune surprise.",
    v3Title: "Nous sommes d’ici", v3Body: "Nous connaissons Vallarta et ses clients. Vous pouvez nous rencontrer quand vous voulez.",
    contactTitle: "Parlez-nous de votre projet.",
    contactLead: "Composez votre projet, écrivez-nous et nous répondrons par e-mail avec une proposition et un prix clair.",
    footerPlace: "Puerto Vallarta, Jalisco, Mexique", footerLabel: "Pied de page",
    bType: "De quoi avez-vous besoin ?", o1: "Nouveau site web", o2: "Refonte de mon site", o3: "Boutique en ligne", o4: "Référencement et Google Maps",
    bExtras: "Options (choisissez librement)", x1: "Réservations", x2: "Paiement en ligne", x3: "Trois langues", x4: "Galerie", x5: "Blog", x6: "Bouton WhatsApp",
    fName: "Nom", eName: "Indiquez votre nom.", fEmail: "E-mail", eEmail: "Indiquez un e-mail valide.", fPhone: "WhatsApp", optional: "(facultatif)",
    fMsg: "Message", hMsg: "Que fait votre entreprise et qu’attendez-vous de votre site ?", eMsg: "Écrivez un message.",
    send: "Envoyer le message", sending: "Envoi…",
    sent: "Message envoyé. Nous vous répondrons bientôt.",
    failed: "Le message n’a pas pu être envoyé. Réessayez ou écrivez-nous à l’adresse indiquée sur cette page.",
    timeout: "Le serveur a mis trop de temps à répondre. Vérifiez votre connexion et réessayez.",
    activate: "Presque prêt : le propriétaire de la boîte doit cliquer sur le lien d’activation envoyé par FormSubmit. Ensuite, les messages arrivent.",
    fileProto: "Le formulaire n’envoie que depuis le site publié (par exemple sur Netlify), pas depuis un fichier ouvert sur votre ordinateur.",
    interest: "Je suis intéressé par un site comme ce concept :",
    preview: "Ceci est un aperçu : le formulaire n’envoie rien. Écrivez-nous à jplw.watson@gmail.com.",
  };
  const es = {
    navLabel: "Principal", langLabel: "Idioma",
    sent: "Mensaje enviado. Te respondemos pronto.",
    failed: "No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos al correo de esta página.",
    timeout: "El servidor tardó demasiado en responder. Revisa tu conexión e inténtalo de nuevo.",
    activate: "Casi listo: el dueño del correo debe hacer clic en el enlace de activación que FormSubmit acaba de enviar. Después llegan los mensajes.",
    fileProto: "El formulario solo envía desde el sitio publicado (por ejemplo en Netlify), no desde un archivo abierto en tu computadora.",
    interest: "Me interesa un sitio como este concepto:",
    preview: "Esta es una vista previa y el formulario no envía. Escríbenos a jplw.watson@gmail.com.",
  };
  $$("[data-i18n]").forEach((el) => { es[el.dataset.i18n] ??= el.textContent; });
  $$("[data-i18n-alt]").forEach((el) => { es[el.dataset.i18nAlt] ??= el.alt; });
  $$("[data-i18n-aria]").forEach((el) => { es[el.dataset.i18nAria] ??= el.getAttribute("aria-label"); });
  const dict = { es, en, fr };
  let lang = "es";
  const t = (k) => dict[lang][k] ?? es[k] ?? "";

  function setLang(next) {
    lang = next;
    root.lang = next;
    $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-alt]").forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
    $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === next)));
    store.set("lang", next);
    updateTitle();
    placeFilterThumb();
  }
  $$("[data-lang]").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

  /* ================= PAGE TABS (hash routing) ================= */
  const pages = $$("[data-page]");
  const tabs = $$("[data-tab]");
  let current = null;

  function updateTitle() {
    const tab = tabs.find((a) => a.dataset.tab === current);
    const label = tab ? tab.textContent.trim() : "";
    document.title = current === "inicio" || !label ? `PV Websites | ${t("heroEyebrow")}` : `${label} | PV Websites`;
  }
  function showPage(id, { focus = true } = {}) {
    if (!pages.some((p) => p.dataset.page === id)) id = "inicio";
    if (id === current) return;
    const swap = () => {
      pages.forEach((p) => { p.hidden = p.dataset.page !== id; });
      tabs.forEach((a) => (a.dataset.tab === id ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
      current = id;
      window.scrollTo(0, 0);
      updateTitle();
      placeFilterThumb();
      syncVideos();
    };
    if (current && document.startViewTransition && !reduceMotion.matches) document.startViewTransition(swap);
    else swap();
    if (focus) $("#main").focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", () => {
    const id = location.hash.slice(1);
    if (pages.some((p) => p.dataset.page === id)) showPage(id);
  });

  /* ================= MODES ================= */
  const modeButtons = $$("[data-set-mode]");
  const themeColor = { minimal: "#fafaf9", premium: "#0b0c0e", interactive: "#edf1f6" };
  function syncModeUi() {
    const mode = root.dataset.mode;
    modeButtons.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.setMode === mode)));
    $('meta[name="theme-color"]').content = themeColor[mode];
  }
  function applyMode(mode) {
    root.dataset.mode = mode;
    syncModeUi();
    store.set("mode", mode);
    const url = new URL(location.href);
    url.searchParams.set("mode", mode);
    try { history.replaceState(null, "", url); } catch {}
    $$(".tilt-on").forEach((el) => { el.style.transform = ""; });
    $$(".magnetic").forEach((el) => { el.style.translate = ""; });
    heroMedia.style.transform = "";
    placeFilterThumb();
    syncVideos();
    if (mode === "interactive") scramble();
  }
  function setMode(mode) {
    if (mode === root.dataset.mode) return;
    if (document.startViewTransition && !reduceMotion.matches) document.startViewTransition(() => applyMode(mode));
    else applyMode(mode);
  }
  modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.setMode)));
  $(".mode-switch").addEventListener("keydown", (e) => {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const i = modeButtons.findIndex((b) => b.dataset.setMode === root.dataset.mode);
    const next = modeButtons[(i + dir + modeButtons.length) % modeButtons.length];
    setMode(next.dataset.setMode);
    next.focus();
  });

  /* ================= HERO VIDEO ================= */
  const heroVideos = $$(".hero-video");
  function syncVideos() {
    heroVideos.forEach((v) => {
      const on = v.dataset.videoMode === root.dataset.mode && current === "inicio" && !reduceMotion.matches;
      if (on) {
        if (v.preload === "none") { v.preload = "auto"; v.load(); }
        v.play().catch(() => {});
      } else v.pause();
    });
  }
  reduceMotion.addEventListener("change", syncVideos);

  /* ================= REVEAL ON SCROLL ================= */
  const reveals = $$(".reveal");
  reveals.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", sibs.indexOf(el));
  });
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); countUp(e.target); } });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.1 }) : null;
  reveals.forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
  $$(".service").forEach((el, i) => el.style.setProperty("--n", i));

  function countUp(el) {
    if (!isInteractive()) return;
    $$("[data-count]", el).forEach((dt) => {
      const end = Number(dt.dataset.count), start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 900);
        dt.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ================= INTERACTIVE: magnetic, spotlight, tilt, drag ================= */
  if (finePointer.matches) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        if (!isInteractive()) return;
        const r = el.getBoundingClientRect();
        el.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.25}px ${(e.clientY - r.top - r.height / 2) * 0.35}px`;
      });
      el.addEventListener("pointerleave", () => { el.style.translate = ""; });
    });
    $$(".card").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        if (!isInteractive()) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
    $$(".work-card").forEach((el) => {
      el.classList.add("tilt-on");
      el.addEventListener("pointermove", (e) => {
        if (!isInteractive()) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateY(${px * 12}deg) rotateX(${-py * 12}deg)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  const heroMedia = $(".hero-media");
  if (finePointer.matches) {
    $(".hero").addEventListener("pointermove", (e) => {
      if (!isInteractive()) return;
      const r = heroMedia.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      heroMedia.style.transform = `perspective(1200px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg)`;
      heroMedia.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
      heroMedia.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
    });
    $(".hero").addEventListener("pointerleave", () => { heroMedia.style.transform = ""; });
  }

  const track = $(".featured-track");
  let drag = null;
  track.addEventListener("pointerdown", (e) => {
    if (!isInteractive() || e.pointerType !== "mouse") return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5 && !drag.moved) { drag.moved = true; track.classList.add("dragging"); }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener("pointerup", () => {
    if (drag?.moved) setTimeout(() => track.classList.remove("dragging"), 0);
    drag = null;
  });

  function scramble() {
    if (reduceMotion.matches || current !== "inicio") return;
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    $$("[data-scramble] [data-i18n]").forEach((el) => {
      const final = t(el.dataset.i18n);
      let frame = 0;
      const total = 22;
      const tick = () => {
        frame++;
        const done = Math.floor((frame / total) * final.length);
        el.textContent = [...final].map((c, i) => (i < done || c === " " ? c : glyphs[(Math.random() * glyphs.length) | 0])).join("");
        if (frame < total) requestAnimationFrame(tick);
        else el.textContent = t(el.dataset.i18n);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ================= WORK: filters + detail dialog ================= */
  const filterButtons = $$("[data-filter]");
  const thumb = $(".filter-thumb");
  function placeFilterThumb() {
    const on = filterButtons.find((b) => b.getAttribute("aria-pressed") === "true");
    if (!on || !on.offsetParent) return;
    thumb.style.width = `${on.offsetWidth}px`;
    thumb.style.height = `${on.offsetHeight}px`;
    thumb.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`;
  }
  filterButtons.forEach((b) => b.addEventListener("click", () => {
    filterButtons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    placeFilterThumb();
    let k = 0;
    $$(".work-card").forEach((card) => {
      const show = b.dataset.filter === "all" || card.dataset.cat === b.dataset.filter;
      card.classList.toggle("out", !show);
      card.classList.remove("in-filter");
      if (show) { void card.offsetWidth; card.style.setProperty("--k", k++); card.classList.add("in-filter"); }
    });
  }));
  window.addEventListener("resize", placeFilterThumb);

  const dialog = $(".work-dialog");
  let picked = "";
  $$(".work-card").forEach((card) => card.addEventListener("click", () => {
    $(".dialog-img", dialog).replaceChildren($(".cover", card).cloneNode(true));
    $(".dialog-cat", dialog).textContent = $(".work-cat", card).textContent;
    $("#dlg-title").textContent = picked = $(".work-title", card).textContent;
    $(".dialog-desc", dialog).textContent = $(".work-desc", card).textContent;
    $(".dialog-list", dialog).replaceChildren(...$$(".work-list [data-i18n]", card).map((s) => Object.assign(document.createElement("li"), { textContent: s.textContent })));
    dialog.showModal();
  }));
  $(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
  $(".dialog-cta").addEventListener("click", () => {
    dialog.close();
    const msg = $("#f-msg");
    if (!msg.value.trim()) msg.value = `${t("interest")} ${picked}.\n\n`;
  });

  /* ================= CONTACT FORM (FormSubmit AJAX; normal POST without JS) ================= */
  const form = $(".form");
  const status = $(".form-status", form);
  const required = [
    { input: $("#f-name"), ok: (v) => v.trim().length > 0 },
    { input: $("#f-email"), ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) },
    { input: $("#f-msg"), ok: (v) => v.trim().length > 0 },
  ];
  function check({ input, ok }) {
    const valid = ok(input.value);
    input.closest(".field").classList.toggle("invalid", !valid);
    input.setAttribute("aria-invalid", String(!valid));
    const help = input.dataset.help ?? (input.dataset.help = input.getAttribute("aria-describedby") || "");
    const ids = valid ? help : `${help} ${input.id}-err`.trim();
    ids ? input.setAttribute("aria-describedby", ids) : input.removeAttribute("aria-describedby");
    return valid;
  }
  required.forEach((r) => {
    r.input.addEventListener("blur", () => { if (r.input.value) check(r); });
    r.input.addEventListener("input", () => { if (r.input.closest(".invalid")) check(r); });
  });
  function say(kind, key) {
    status.className = `form-status ${kind}`;
    status.innerHTML = `<i class="ph ${kind === "ok" ? "ph-check-circle" : "ph-warning-circle"}" aria-hidden="true"></i>`;
    status.append(t(key));
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const results = required.map(check);
    if (results.includes(false)) { required[results.indexOf(false)].input.focus(); return; }
    if (form._honey.value) return;
    if (location.protocol === "file:") { say("fail", "fileProto"); return; }
    if (!(form.getAttribute("action") || "").includes("formsubmit.co")) { say("fail", "preview"); return; }

    const data = new FormData(form);
    const body = {};
    for (const [k, v] of data) body[k] = body[k] ? `${body[k]}, ${v}` : v;
    body.idioma = lang;

    form.classList.add("busy");
    status.className = "form-status";
    status.textContent = "";
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      const json = await res.json().catch(() => ({}));
      if (/activat/i.test(json.message || "")) { say("ok", "activate"); return; }
      if (!res.ok || String(json.success) === "false") throw new Error(json.message || res.status);
      form.reset();
      say("ok", "sent");
      if (isInteractive()) confetti();
    } catch (err) {
      say("fail", err.name === "AbortError" ? "timeout" : "failed");
    } finally {
      clearTimeout(timer);
      form.classList.remove("busy");
    }
  });

  function confetti() {
    const c = $(".confetti"), ctx = c.getContext("2d");
    c.width = innerWidth; c.height = innerHeight;
    const colors = ["#2448ff", "#ffb88c", "#0c1021", "#7aa8ff"];
    const bits = Array.from({ length: 140 }, () => ({
      x: innerWidth / 2, y: innerHeight * 0.6, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 16 - 6,
      s: 4 + Math.random() * 6, r: Math.random() * 6, c: colors[(Math.random() * colors.length) | 0],
    }));
    let frames = 0;
    (function draw() {
      ctx.clearRect(0, 0, c.width, c.height);
      bits.forEach((b) => {
        b.vy += 0.45; b.x += b.vx; b.y += b.vy; b.r += 0.1;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 2, b.s, b.s * 0.6); ctx.restore();
      });
      if (++frames < 150) requestAnimationFrame(draw); else ctx.clearRect(0, 0, c.width, c.height);
    })();
  }

  /* ================= IMAGES: hide broken ones instead of showing a broken icon ================= */
  $$("img").forEach((img) => {
    const fail = () => img.classList.add("img-missing");
    if (img.complete && img.naturalWidth === 0 && img.src) fail();
    img.addEventListener("error", fail);
  });

  /* ================= BOOT ================= */
  syncModeUi();
  const saved = store.get("lang");
  const nav = (navigator.language || "es").slice(0, 2).toLowerCase();
  const startLang = dict[saved] ? saved : dict[nav] ? nav : "es";
  showPage(location.hash.slice(1) || "inicio", { focus: false });
  if (startLang !== "es") setLang(startLang); else updateTitle();
  $$("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
