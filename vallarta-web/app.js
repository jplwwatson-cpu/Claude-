// Malecón Studio: mode switch, language toggle, scroll reveals, interactive-mode physics, contact form.
(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(pointer: fine)");
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  };
  const isInteractive = () => root.dataset.mode === "interactive" && !reduceMotion.matches;
  root.classList.add("js");

  /* ---------- Language (Spanish lives in the HTML, English here) ---------- */
  const en = {
    skip: "Skip to content",
    modeLabel: "Site style",
    modeInteractive: "Interactive",
    navServices: "Services", navWork: "Work", navAbout: "About",
    ctaQuote: "Get a quote", ctaWork: "See our work",
    heroAlt: "Sunset over Banderas Bay",
    heroEyebrow: "Web studio in Puerto Vallarta",
    heroTitleA: "Websites that help", heroTitleB: "your business grow.",
    heroLead: "Design, development and local SEO for restaurants, hotels, tours and businesses around Banderas Bay.",
    areasLabel: "Areas we work in",
    servicesTitle: "Everything your business needs online.",
    s1Title: "Custom websites", s1Body: "Our own design, no templates. Fast on phones and easy to update.",
    s2Title: "Online stores", s2Body: "Sell products, tours or bookings with card and OXXO payments.",
    s3Title: "Local SEO and Google Maps", s3Body: "Get found when people search for what you offer in Vallarta.",
    s4Title: "Bilingual from day one", s4Body: "Well-written Spanish and English for locals, tourists and expats.",
    s5Title: "Hosting and support", s5Body: "We take care of the domain, security and updates.",
    workTitle: "Design concepts for businesses around the bay.",
    workLead: "This is how your business could look. Every concept adapts to your brand.",
    workLabel: "Design concepts",
    w1Title: "Seafood restaurant", w1Body: "Online menu, reservations and a WhatsApp button.",
    w2Title: "Boutique hotel", w2Body: "Room gallery and direct bookings with no commissions.",
    w3Title: "Real estate", w3Body: "Listings with filters, a map and bilingual property pages.",
    w4Title: "Boat tours", w4Body: "Calendar, online payments and Google reviews.",
    processTitle: "From the first call to launch day.",
    p1Title: "We talk", p1Body: "We learn about your business, your customers and your goals.",
    p2Title: "We design", p2Body: "You see the design before we write a single line of code.",
    p3Title: "We build", p3Body: "Clean, fast code that is ready for Google.",
    p4Title: "We launch", p4Body: "We publish your site and show you how to use it.",
    aboutAlt: "View of the Puerto Vallarta boardwalk",
    aboutEyebrow: "About us",
    aboutTitle: "We make professional websites.",
    aboutBody1: "For two years we have been in Puerto Vallarta, helping local businesses look great online and win more customers.",
    aboutBody2: "We work face to face, in Spanish and English. Once your site is live, we are still here for whatever you need.",
    fact1: "years in Puerto Vallarta", fact2: "bilingual service", fact3: "direct contact, no middlemen",
    contactTitle: "Tell us about your project.",
    contactLead: "Send us a message and we will reply by email with a proposal and a clear price.",
    fName: "Name", fEmail: "Email", fPhone: "WhatsApp", optional: "(optional)",
    fType: "Project type", o1: "New website", o2: "Redesign my site", o3: "Online store", o4: "SEO and Google Maps", o5: "Other",
    fMsg: "Message", hMsg: "What does your business do, and what do you want your website to achieve?",
    eName: "Enter your name.", eEmail: "Enter a valid email.", eMsg: "Enter a message.",
    send: "Send message", sending: "Sending…",
    sent: "Message sent. We will reply soon.",
    failed: "The message could not be sent. Please try again or write to us by email.",
    footerPlace: "Puerto Vallarta, Jalisco, Mexico",
    footerLabel: "Footer",
  };
  const es = { sent: "Mensaje enviado. Te respondemos pronto.", failed: "No se pudo enviar el mensaje. Inténtalo de nuevo o escríbenos por correo." };

  // Capture the Spanish source text once so switching back is lossless.
  document.querySelectorAll("[data-i18n]").forEach((el) => { es[el.dataset.i18n] = el.textContent; });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => { es[el.dataset.i18nAlt] = el.alt; });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => { es[el.dataset.i18nAria] = el.getAttribute("aria-label"); });

  let lang = "es";
  const t = (k) => (lang === "en" ? en : es)[k] ?? es[k];
  const langBtn = document.querySelector("[data-lang-toggle]");

  function setLang(next) {
    lang = next;
    root.lang = next;
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => { el.alt = t(el.dataset.i18nAlt); });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
    langBtn.textContent = next === "en" ? "ES" : "EN";
    langBtn.setAttribute("aria-label", next === "en" ? "Cambiar a español" : "Switch to English");
    store.set("lang", next);
  }
  langBtn.addEventListener("click", () => setLang(lang === "en" ? "es" : "en"));
  const savedLang = store.get("lang");
  if (savedLang === "en" || (!savedLang && !navigator.language.toLowerCase().startsWith("es"))) setLang("en");

  /* ---------- Mode switch ---------- */
  const modeButtons = [...document.querySelectorAll("[data-set-mode]")];
  const themeColor = { minimal: "#fbfbfa", premium: "#0a0b0d", interactive: "#eef1f5" };

  function applyMode(mode) {
    root.dataset.mode = mode;
    modeButtons.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.setMode === mode)));
    document.querySelector('meta[name="theme-color"]').content = themeColor[mode];
    store.set("mode", mode);
    const url = new URL(location.href);
    url.searchParams.set("mode", mode);
    history.replaceState(null, "", url);
    resetPhysics();
    if (mode === "interactive") { scramble(); waves.start(); } else waves.stop();
  }
  function setMode(mode) {
    if (mode === root.dataset.mode) return;
    if (document.startViewTransition && !reduceMotion.matches) document.startViewTransition(() => applyMode(mode));
    else applyMode(mode);
  }
  modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.setMode)));
  // Arrow keys move between options, as a native radio group does.
  document.querySelector(".mode-switch").addEventListener("keydown", (e) => {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    e.preventDefault();
    const i = modeButtons.findIndex((b) => b.dataset.setMode === root.dataset.mode);
    const next = modeButtons[(i + dir + modeButtons.length) % modeButtons.length];
    setMode(next.dataset.setMode);
    next.focus();
  });
  modeButtons.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.setMode === root.dataset.mode)));
  document.querySelector('meta[name="theme-color"]').content = themeColor[root.dataset.mode];

  /* ---------- Scroll reveal ---------- */
  const reveals = document.querySelectorAll(".reveal");
  reveals.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", siblings.indexOf(el));
  });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add("in"));

  /* ---------- Interactive mode: magnetic buttons, spotlight cards, tilt ---------- */
  function resetPhysics() {
    document.querySelectorAll(".magnetic, .work-card").forEach((el) => { el.style.transform = ""; });
  }
  if (finePointer.matches) {
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        if (!isInteractive()) return;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
    document.querySelectorAll(".card").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        if (!isInteractive()) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
    document.querySelectorAll(".work-card").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        if (!isInteractive() || track.classList.contains("dragging")) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(0)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  // Drag to scroll the work track (interactive mode only; touch scrolls natively).
  const track = document.querySelector(".work-track");
  let drag = null;
  track.addEventListener("pointerdown", (e) => {
    if (!isInteractive() || e.pointerType !== "mouse") return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4 && !drag.moved) { drag.moved = true; track.classList.add("dragging"); }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener("pointerup", () => { drag = null; track.classList.remove("dragging"); });

  /* ---------- Headline scramble when entering interactive mode ---------- */
  function scramble() {
    if (reduceMotion.matches) return;
    const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    document.querySelectorAll("[data-scramble] [data-i18n]").forEach((el) => {
      const final = el.textContent;
      let frame = 0;
      const total = 22;
      el.setAttribute("aria-label", final);
      const tick = () => {
        frame++;
        const done = Math.floor((frame / total) * final.length);
        el.textContent = [...final].map((c, i) => (i < done || c === " " ? c : glyphs[(Math.random() * glyphs.length) | 0])).join("");
        if (frame < total) requestAnimationFrame(tick);
        else { el.textContent = final; el.removeAttribute("aria-label"); }
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Interactive hero: the bay as live waves that bend toward the pointer ---------- */
  const waves = (() => {
    const canvas = document.querySelector(".waves");
    const ctx = canvas.getContext("2d");
    let raf = 0, visible = true, w = 0, h = 0, dpr = 1;
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw(time) {
      const s = time / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      ctx.clearRect(0, 0, w, h);
      const accent = getComputedStyle(root).getPropertyValue("--accent").trim() || "#2b4dff";
      const lines = 18;
      for (let i = 0; i < lines; i++) {
        const baseY = h * 0.08 + (h * 0.6 / lines) * i;
        const amp = 6 + i * 1.1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 8) {
          const dx = x - pointer.x, dy = baseY - pointer.y;
          const pull = Math.exp(-(dx * dx + dy * dy) / 26000) * 46;
          const y = baseY + Math.sin(x * 0.006 + s * 0.9 + i * 0.45) * amp + Math.sin(x * 0.013 - s * 0.6) * amp * 0.4 - pull;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.08 + (i / lines) * 0.32;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    }
    function start() {
      cancelAnimationFrame(raf);
      if (!isInteractive() || !visible) return;
      size();
      raf = requestAnimationFrame(draw);
    }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas.parentElement);
    new ResizeObserver(() => { if (raf) size(); }).observe(canvas);
    canvas.parentElement.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.tx = e.clientX - r.left; pointer.ty = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener("pointerleave", () => { pointer.tx = pointer.ty = -9999; });
    reduceMotion.addEventListener("change", () => (reduceMotion.matches ? stop() : start()));
    return { start, stop };
  })();
  if (root.dataset.mode === "interactive") waves.start();

  /* ---------- Contact form (FormSubmit AJAX, falls back to a normal POST without JS) ---------- */
  const form = document.querySelector(".form");
  const status = form.querySelector(".form-status");
  const required = [
    { input: form.querySelector("#f-name"), ok: (v) => v.trim().length > 0 },
    { input: form.querySelector("#f-email"), ok: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) },
    { input: form.querySelector("#f-msg"), ok: (v) => v.trim().length > 0 },
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
  required.forEach((r) => r.input.addEventListener("blur", () => { if (r.input.value) check(r); }));
  required.forEach((r) => r.input.addEventListener("input", () => { if (r.input.closest(".invalid")) check(r); }));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const results = required.map(check);
    if (results.includes(false)) { required[results.indexOf(false)].input.focus(); return; }
    if (form._honey.value) return; // bot filled the hidden field

    form.classList.add("busy");
    status.className = "form-status";
    status.textContent = "";
    try {
      const res = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === "false") throw new Error(data.message || res.status);
      form.reset();
      status.className = "form-status ok";
      status.innerHTML = `<i class="ph ph-check-circle" aria-hidden="true"></i>`;
      status.append(t("sent"));
    } catch {
      status.className = "form-status fail";
      status.innerHTML = `<i class="ph ph-warning-circle" aria-hidden="true"></i>`;
      status.append(t("failed"));
    } finally {
      form.classList.remove("busy");
    }
  });

  document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
