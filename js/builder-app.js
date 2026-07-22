(function () {
  const {
    TEMPLATES,
    THEMES,
    load,
    save,
    setStep,
    updateConfig,
    publish,
    mockCheckout,
    fileToDataUrl,
    emptyService
  } = window.DerraBuilder;

  const PUBLISH_PRICE = 99;
  const PUBLISH_LABEL = "Publier mon site maintenant — 99 CHF";
  const EDITABLE_STEPS = ["template", "details", "preview"];

  const ROUTES = ["template", "details", "preview", "checkout", "success"];
  const STEP_LABELS = {
    template: "Modèle",
    details: "Infos",
    preview: "Aperçu",
    checkout: "Paiement",
    success: "Succès"
  };

  const els = {
    steps: document.getElementById("builder-steps"),
    views: [...document.querySelectorAll("[data-view]")],
    templateGrid: document.getElementById("template-grid"),
    detailsForm: document.getElementById("details-form"),
    servicesList: document.getElementById("services-list"),
    themeGrid: document.getElementById("theme-grid"),
    previewMounts: [...document.querySelectorAll("[data-preview-mount]")],
    previewCtaBar: document.getElementById("preview-cta-bar"),
    summary: document.getElementById("checkout-summary"),
    overlay: document.getElementById("payment-overlay"),
    overlayText: document.getElementById("payment-overlay-text"),
    successMeta: document.getElementById("success-meta"),
    formError: document.getElementById("form-error")
  };

  function routeFromHash() {
    const hash = (location.hash || "#/template").replace(/^#\/?/, "");
    return ROUTES.includes(hash) ? hash : "template";
  }

  function navigate(step) {
    const state = load();
    if (state.locked && step !== "success") {
      location.hash = "#/success";
      return;
    }
    if (step !== "template" && !state.config.template && step !== "success") {
      location.hash = "#/template";
      return;
    }
    if ((step === "preview" || step === "checkout") && !state.config.businessName) {
      const error = validateDetails(state.config);
      if (error) {
        location.hash = "#/details";
        return;
      }
    }
    setStep(step);
    location.hash = "#/" + step;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function canJumpTo(target, state, current) {
    if (state.locked) return target === "success";
    if (target === "checkout" || target === "success") return false;
    if (!EDITABLE_STEPS.includes(target)) return false;
    if (target === "template") return true;
    if (!state.config.template) return false;
    if (target === "details") return true;
    if (target === "preview") return !validateDetails(state.config);
    return ROUTES.indexOf(target) <= ROUTES.indexOf(current);
  }

  function renderSteps(current) {
    const state = load();
    const order = ROUTES;
    els.steps.innerHTML = order
      .map((id, index) => {
        const currentIndex = order.indexOf(current);
        const jumpable = canJumpTo(id, state, current);
        const cls = [
          "step-pill",
          id === current ? "active" : "",
          index < currentIndex ? "done" : "",
          jumpable ? "clickable" : "",
          !jumpable && id !== current ? "locked" : ""
        ]
          .filter(Boolean)
          .join(" ");
        const attrs = jumpable ? `data-step="${id}" role="button" tabindex="0"` : `aria-disabled="true"`;
        return `<button type="button" class="${cls}" ${attrs}><span>${index + 1}</span>${STEP_LABELS[id]}</button>`;
      })
      .join("");
  }

  function renderTemplates(state) {
    els.templateGrid.innerHTML = Object.values(TEMPLATES)
      .map((tpl) => {
        const selected = state.config.template === tpl.id ? "selected" : "";
        return `
          <button type="button" class="template-card ${selected}" data-template="${tpl.id}">
            <div class="template-accent" style="background:${tpl.accent}"></div>
            <h3>${tpl.label}</h3>
            <p>${tpl.description}</p>
          </button>`;
      })
      .join("");
  }

  function renderThemes(state) {
    els.themeGrid.innerHTML = Object.values(THEMES)
      .map((theme) => {
        const selected = state.config.theme === theme.id ? "selected" : "";
        return `
          <button type="button" class="theme-swatch ${selected}" data-theme="${theme.id}">
            <i style="background:linear-gradient(90deg,${theme.primary},${theme.bg})"></i>
            <span>${theme.label}</span>
          </button>`;
      })
      .join("");
  }

  function renderServices(state) {
    els.servicesList.innerHTML = state.config.services
      .map(
        (service) => `
      <div class="service-row" data-service-id="${service.id}">
        <div class="field">
          <label>Service / produit</label>
          <input type="text" data-field="name" value="${escapeAttr(service.name)}" placeholder="Ex. : Coupe femme">
        </div>
        <div class="field">
          <label>Prix</label>
          <input type="text" data-field="price" value="${escapeAttr(service.price)}" placeholder="CHF 45">
        </div>
        <div class="field">
          <label>Image</label>
          <input type="file" data-field="image" accept="image/*">
        </div>
        <button type="button" class="remove" data-remove="${service.id}" ${state.config.services.length <= 1 ? "disabled" : ""}>Retirer</button>
        ${service.image ? `<div class="hint" style="grid-column:1/-1">Image ajoutée ✓</div>` : ""}
      </div>`
      )
      .join("");
  }

  function fillDetailsForm(state) {
    const c = state.config;
    const map = {
      businessName: c.businessName,
      tagline: c.tagline,
      phone: c.phone,
      whatsapp: c.whatsapp,
      address: c.address,
      hours: c.hours
    };
    Object.entries(map).forEach(([key, value]) => {
      const input = els.detailsForm.elements.namedItem(key);
      if (input && "value" in input) input.value = value || "";
    });
  }

  function digitsOnly(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function phoneHref(phone) {
    const digits = digitsOnly(phone);
    return digits ? "tel:+" + digits.replace(/^00/, "") : "#";
  }

  function whatsappHref(whatsapp, businessName) {
    const digits = digitsOnly(whatsapp);
    if (!digits) return "#";
    const text = encodeURIComponent(
      "Bonjour " + (businessName || "") + ", je souhaite obtenir des informations."
    );
    return "https://wa.me/" + digits.replace(/^00/, "") + "?text=" + text;
  }

  function previewHTML(state) {
    const c = state.config;
    const theme = THEMES[c.theme] || THEMES.midnight;
    const tpl = TEMPLATES[c.template];
    const name = c.businessName || "Nom de votre commerce";
    const tagline = c.tagline || (tpl ? tpl.defaultTagline : "Votre accroche");
    const services = (c.services || []).filter((s) => s.name || s.price || s.image);
    const galleryImages = [
      c.banner,
      c.logo,
      ...services.map((s) => s.image)
    ].filter(Boolean);
    const uniqueGallery = [...new Set(galleryImages)].slice(0, 6);
    const heroBg = c.banner
      ? `linear-gradient(180deg,rgba(0,0,0,.25),rgba(0,0,0,.78)), url('${c.banner}')`
      : `linear-gradient(135deg, ${theme.soft}, ${theme.bg} 55%, ${tpl ? tpl.accent : theme.primary})`;
    const callLink = phoneHref(c.phone);
    const waLink = whatsappHref(c.whatsapp || c.phone, name);
    const initial = (name.trim()[0] || "D").toUpperCase();

    const galleryBlock =
      uniqueGallery.length > 0
        ? `<div class="ps-gallery">${uniqueGallery
            .map(
              (src) =>
                `<figure><img src="${src}" alt="Galerie ${escapeAttr(name)}"></figure>`
            )
            .join("")}</div>`
        : `<p class="preview-empty">Ajoutez un logo, une bannière ou des images de services pour constituer la galerie.</p>`;

    const servicesBlock =
      services.length > 0
        ? `<div class="ps-cards">${services
            .map((s) => {
              const media = s.image
                ? `style="background-image:url('${s.image}')"`
                : `style="background:linear-gradient(145deg, ${theme.soft}, ${theme.bg})"`;
              return `
              <article class="ps-card">
                <div class="ps-card-media" ${media}></div>
                <div class="ps-card-body">
                  <strong>${escapeHtml(s.name || "Service")}</strong>
                  <div class="ps-price">${escapeHtml(s.price || "Sur devis")}</div>
                </div>
              </article>`;
            })
            .join("")}</div>`
        : `<p class="preview-empty">Ajoutez vos services ou produits avec leurs prix pour les afficher ici.</p>`;

    return `
      <div class="preview-site" style="--preview-bg:${theme.bg};--preview-text:${theme.text};--preview-soft:${theme.soft};--preview-primary:${theme.primary}">
        <header class="ps-header">
          <div class="ps-brand">
            ${
              c.logo
                ? `<img src="${c.logo}" alt="Logo ${escapeAttr(name)}">`
                : `<span class="ps-brand-mark">${initial}</span>`
            }
            <span>${escapeHtml(name)}</span>
          </div>
          <nav class="ps-nav" aria-label="Navigation du site preview">
            <a href="#preview-services">Services</a>
            <a href="#preview-gallery">Galerie</a>
            <a href="#preview-contact">Contact</a>
          </nav>
        </header>

        <section class="ps-hero" style="background-image:${heroBg}">
          <div class="ps-hero-copy">
            <div class="ps-kicker">${tpl ? escapeHtml(tpl.label) : "Votre site"}</div>
            <h1>${escapeHtml(name)}</h1>
            <p>${escapeHtml(tagline)}</p>
            <div class="ps-hero-actions">
              <a class="ps-btn ps-btn-whatsapp" href="${waLink}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              <a class="ps-btn ps-btn-primary" href="${callLink}">Appeler</a>
              <a class="ps-btn ps-btn-ghost" href="#preview-contact">Voir les horaires</a>
            </div>
          </div>
        </section>

        <section class="ps-section" id="preview-services">
          <h2>Nos services & produits</h2>
          <p class="lead">Découvrez l'offre de ${escapeHtml(name)}.</p>
          ${servicesBlock}
        </section>

        <section class="ps-section alt" id="preview-gallery">
          <h2>Galerie</h2>
          <p class="lead">Ambiance, réalisations et moments forts.</p>
          ${galleryBlock}
        </section>

        <section class="ps-section" id="preview-contact">
          <h2>Contact & horaires</h2>
          <p class="lead">Retrouvez-nous facilement et écrivez-nous en un clic.</p>
          <div class="ps-contact-grid">
            <div class="ps-info-list">
              <div class="ps-info-item"><span>Téléphone</span>${escapeHtml(c.phone || "À compléter")}</div>
              <div class="ps-info-item"><span>WhatsApp</span>${escapeHtml(c.whatsapp || c.phone || "À compléter")}</div>
              <div class="ps-info-item"><span>Adresse</span>${escapeHtml(c.address || "À compléter")}</div>
              <div class="ps-info-item"><span>Horaires</span>${escapeHtml(c.hours || "À compléter")}</div>
            </div>
            <div class="ps-cta-box">
              <p>Une question ? Contactez ${escapeHtml(name)} directement depuis le site.</p>
              <div class="ps-hero-actions">
                <a class="ps-btn ps-btn-whatsapp" href="${waLink}" target="_blank" rel="noopener noreferrer">Écrire sur WhatsApp</a>
                <a class="ps-btn ps-btn-primary" href="${callLink}">Appeler maintenant</a>
              </div>
            </div>
          </div>
        </section>

        <footer class="ps-footer">© ${new Date().getFullYear()} ${escapeHtml(name)} · Propulsé par Derra Digital Studio</footer>
      </div>`;
  }

  function renderPreview(state, mode) {
    const html = `
      <div class="preview-banner">Aperçu de votre site - Essai gratuit</div>
      <div class="preview-frame">${previewHTML(state)}</div>`;

    els.previewMounts.forEach((mount) => {
      const mountMode = mount.dataset.previewMode || "compact";
      if (mode && mountMode !== mode && mode !== "all") return;
      mount.classList.toggle("full-page", mountMode === "full");
      mount.classList.toggle("compact", mountMode === "compact");
      mount.innerHTML = html;
    });
  }

  function renderSummary(state) {
    const c = state.config;
    const tpl = TEMPLATES[c.template];
    els.summary.innerHTML = `
      <h3>Récapitulatif</h3>
      <ul>
        <li>Modèle : <strong>${tpl ? tpl.label : "—"}</strong></li>
        <li>Commerce : <strong>${escapeHtml(c.businessName || "—")}</strong></li>
        <li>Thème : <strong>${(THEMES[c.theme] || THEMES.midnight).label}</strong></li>
        <li>Services : <strong>${(c.services || []).filter((s) => s.name).length}</strong></li>
      </ul>
      <div class="summary-price">CHF ${PUBLISH_PRICE}.–</div>
      <p class="hint">Publication Freemium — mise en ligne après paiement confirmé.</p>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn btn-gold" type="button" data-action="focus-payment" style="width:100%">${PUBLISH_LABEL}</button>
      </div>`;
  }

  function renderSuccess(state) {
    const payment = state.payment || {};
    els.successMeta.innerHTML = `
      <p style="color:#c9d4e1;margin:16px 0 0">
        Paiement <strong>${escapeHtml(payment.provider || "—")}</strong> confirmé
        (${escapeHtml(payment.transactionId || "—")}).
        Votre brouillon est verrouillé et prêt pour la mise en production.
      </p>`;
  }

  function render() {
    const state = load();
    const step = routeFromHash();
    if (state.step !== step && !(state.locked && step === "success")) {
      setStep(step);
    }

    renderSteps(step);
    els.views.forEach((view) => {
      view.classList.toggle("active", view.dataset.view === step);
    });

    if (els.previewCtaBar) {
      els.previewCtaBar.classList.toggle("visible", step === "preview" && !state.locked);
    }

    if (step === "template") renderTemplates(state);
    if (step === "details") {
      fillDetailsForm(state);
      renderThemes(state);
      renderServices(state);
      renderPreview(state, "compact");
    }
    if (step === "preview") renderPreview(state, "full");
    if (step === "checkout") {
      renderPreview(state, "compact");
      renderSummary(state);
    }
    if (step === "success") renderSuccess(state);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  function validateDetails(config) {
    if (!config.businessName.trim()) return "Indiquez le nom du commerce.";
    if (!config.whatsapp.trim() && !config.phone.trim()) return "Ajoutez un téléphone ou un WhatsApp.";
    if (!config.address.trim()) return "Ajoutez une adresse.";
    return "";
  }

  function collectDetailsFromForm() {
    const form = els.detailsForm;
    return {
      businessName: form.businessName.value.trim(),
      tagline: form.tagline.value.trim(),
      phone: form.phone.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      address: form.address.value.trim(),
      hours: form.hours.value.trim()
    };
  }

  async function onPay(provider) {
    const state = load();
    const error = validateDetails(state.config);
    if (error || !state.config.template) {
      alert(error || "Choisissez d'abord un modèle.");
      navigate("details");
      return;
    }

    els.overlay.classList.add("open");
    els.overlayText.textContent =
      provider === "stripe"
        ? "Connexion sécurisée à Stripe…"
        : "Redirection PayPal en cours…";

    try {
      const payment = await mockCheckout({ provider, amount: PUBLISH_PRICE });
      els.overlayText.textContent = "Paiement confirmé. Verrouillage du brouillon…";
      publish(state, payment);
      await new Promise((r) => setTimeout(r, 500));
      els.overlay.classList.remove("open");
      navigate("success");
    } catch (err) {
      els.overlay.classList.remove("open");
      alert(err.message || "Paiement impossible");
    }
  }

  document.addEventListener("click", async (event) => {
    const stepBtn = event.target.closest("[data-step]");
    if (stepBtn) {
      const target = stepBtn.dataset.step;
      const state = load();
      if (!canJumpTo(target, state, routeFromHash())) return;
      if (target === "preview") {
        const error = validateDetails(state.config);
        if (error) {
          if (els.formError) els.formError.textContent = error;
          navigate("details");
          return;
        }
      }
      navigate(target);
      return;
    }

    const target = event.target.closest("[data-action], [data-template], [data-theme], [data-remove], [data-pay]");
    if (!target) return;

    if (target.dataset.template) {
      const tpl = TEMPLATES[target.dataset.template];
      const state = load();
      state.config.template = tpl.id;
      if (!state.config.tagline) state.config.tagline = tpl.defaultTagline;
      save(state);
      renderTemplates(state);
      return;
    }

    if (target.dataset.theme) {
      updateConfig({ theme: target.dataset.theme });
      render();
      return;
    }

    if (target.dataset.remove) {
      const state = load();
      state.config.services = state.config.services.filter((s) => s.id !== target.dataset.remove);
      if (!state.config.services.length) state.config.services = [emptyService()];
      save(state);
      renderServices(state);
      renderPreview(state, "compact");
      return;
    }

    if (target.dataset.pay) {
      onPay(target.dataset.pay);
      return;
    }

    const action = target.dataset.action;
    if (!action) return;

    if (action === "goto-details") {
      const state = load();
      if (!state.config.template) {
        alert("Sélectionnez un modèle pour continuer.");
        return;
      }
      navigate("details");
    }
    if (action === "goto-template") navigate("template");
    if (action === "goto-preview") {
      const partial = collectDetailsFromForm();
      const state = updateConfig(partial);
      const error = validateDetails(state.config);
      if (error) {
        els.formError.textContent = error;
        return;
      }
      els.formError.textContent = "";
      navigate("preview");
    }
    if (action === "goto-checkout") navigate("checkout");
    if (action === "focus-payment") {
      const payBlock = document.querySelector(".pay-options");
      if (payBlock) payBlock.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (action === "back-details") navigate("details");
    if (action === "back-preview") navigate("preview");
    if (action === "add-service") {
      const state = load();
      state.config.services.push(emptyService());
      save(state);
      renderServices(state);
    }
    if (action === "reset-builder") {
      if (confirm("Réinitialiser le brouillon et recommencer ?")) {
        window.DerraBuilder.reset();
        navigate("template");
      }
    }
  });

  els.detailsForm.addEventListener("input", (event) => {
    const field = event.target.name;
    if (!field) return;
    updateConfig({ [field]: event.target.value });
    renderPreview(load(), "compact");
  });

  els.servicesList.addEventListener("input", (event) => {
    const row = event.target.closest("[data-service-id]");
    if (!row) return;
    const id = row.dataset.serviceId;
    const field = event.target.dataset.field;
    if (!field || field === "image") return;
    const state = load();
    state.config.services = state.config.services.map((s) =>
      s.id === id ? { ...s, [field]: event.target.value } : s
    );
    save(state);
    renderPreview(state, "compact");
  });

  els.servicesList.addEventListener("change", async (event) => {
    const input = event.target;
    if (input.dataset.field !== "image" || !input.files?.[0]) return;
    const row = input.closest("[data-service-id]");
    try {
      const dataUrl = await fileToDataUrl(input.files[0]);
      const state = load();
      state.config.services = state.config.services.map((s) =>
        s.id === row.dataset.serviceId ? { ...s, image: dataUrl } : s
      );
      save(state);
      renderServices(state);
      renderPreview(state, "compact");
    } catch (err) {
      alert(err.message);
      input.value = "";
    }
  });

  document.getElementById("logo-input").addEventListener("change", async (event) => {
    try {
      const dataUrl = await fileToDataUrl(event.target.files?.[0]);
      updateConfig({ logo: dataUrl });
      renderPreview(load(), "compact");
    } catch (err) {
      alert(err.message);
      event.target.value = "";
    }
  });

  document.getElementById("banner-input").addEventListener("change", async (event) => {
    try {
      const dataUrl = await fileToDataUrl(event.target.files?.[0]);
      updateConfig({ banner: dataUrl });
      renderPreview(load(), "compact");
    } catch (err) {
      alert(err.message);
      event.target.value = "";
    }
  });

  window.addEventListener("hashchange", render);

  const initial = load();
  if (initial.locked) {
    location.hash = "#/success";
  } else if (!location.hash) {
    location.hash = "#/" + (initial.step || "template");
  }
  render();
})();
