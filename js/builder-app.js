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
  const PUBLISH_LABEL = "Publier mon site web maintenant — 99 CHF";

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
    setStep(step);
    location.hash = "#/" + step;
    render();
  }

  function renderSteps(current) {
    const order = ROUTES;
    els.steps.innerHTML = order
      .map((id, index) => {
        const currentIndex = order.indexOf(current);
        const cls = [
          "step-pill",
          id === current ? "active" : "",
          index < currentIndex ? "done" : ""
        ]
          .filter(Boolean)
          .join(" ");
        return `<div class="${cls}"><span>${index + 1}</span>${STEP_LABELS[id]}</div>`;
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
        (service, index) => `
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

  function previewHTML(state) {
    const c = state.config;
    const theme = THEMES[c.theme] || THEMES.midnight;
    const tpl = TEMPLATES[c.template];
    const bannerStyle = c.banner
      ? `url("${c.banner}")`
      : `linear-gradient(135deg, ${theme.soft}, ${theme.bg})`;
    const services = (c.services || []).filter((s) => s.name || s.price);

    return `
      <div class="preview-site" style="--preview-bg:${theme.bg};--preview-text:${theme.text};--preview-soft:${theme.soft};--preview-primary:${theme.primary};--preview-banner:${bannerStyle}">
        <div class="phero" style="background-image:linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.75)), ${c.banner ? `url('${c.banner}')` : `linear-gradient(135deg,${theme.soft},${theme.bg})`}">
          ${c.logo ? `<img class="logo" src="${c.logo}" alt="Logo">` : ""}
          <div>
            <div style="color:${theme.primary};font-size:.72rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:8px">${tpl ? tpl.label : "Votre site"}</div>
            <h2>${escapeHtml(c.businessName || "Nom de votre commerce")}</h2>
            <p>${escapeHtml(c.tagline || (tpl ? tpl.defaultTagline : "Votre accroche"))}</p>
          </div>
        </div>
        <div class="preview-body">
          <div class="preview-meta">
            <div><strong>Tél.</strong> ${escapeHtml(c.phone || "—")}</div>
            <div><strong>WhatsApp</strong> ${escapeHtml(c.whatsapp || "—")}</div>
            <div><strong>Adresse</strong> ${escapeHtml(c.address || "—")}</div>
            <div><strong>Horaires</strong> ${escapeHtml(c.hours || "—")}</div>
          </div>
          <h3 style="margin-bottom:12px;font-size:1.15rem">Services & produits</h3>
          <div class="preview-services">
            ${
              services.length
                ? services
                    .map(
                      (s) => `
              <div class="preview-service">
                ${s.image ? `<img src="${s.image}" alt="">` : `<div style="width:64px;height:64px;border-radius:10px;background:rgba(255,255,255,.08)"></div>`}
                <div><strong>${escapeHtml(s.name || "Service")}</strong></div>
                <span>${escapeHtml(s.price || "—")}</span>
              </div>`
                    )
                    .join("")
                : `<p class="preview-empty">Ajoutez des services pour les voir apparaître ici.</p>`
            }
          </div>
        </div>
      </div>`;
  }

  function renderPreview(state) {
    const html = `
      <div class="preview-banner">Aperçu de votre site - Essai gratuit</div>
      <div class="preview-frame">${previewHTML(state)}</div>`;
    els.previewMounts.forEach((mount) => {
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

    if (step === "template") renderTemplates(state);
    if (step === "details") {
      fillDetailsForm(state);
      renderThemes(state);
      renderServices(state);
      renderPreview(state);
    }
    if (step === "preview") renderPreview(state);
    if (step === "checkout") {
      renderPreview(state);
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

  // Events
  document.addEventListener("click", async (event) => {
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
      renderPreview(state);
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
    renderPreview(load());
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
    renderPreview(state);
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
      renderPreview(state);
    } catch (err) {
      alert(err.message);
      input.value = "";
    }
  });

  document.getElementById("logo-input").addEventListener("change", async (event) => {
    try {
      const dataUrl = await fileToDataUrl(event.target.files?.[0]);
      updateConfig({ logo: dataUrl });
      renderPreview(load());
    } catch (err) {
      alert(err.message);
      event.target.value = "";
    }
  });

  document.getElementById("banner-input").addEventListener("change", async (event) => {
    try {
      const dataUrl = await fileToDataUrl(event.target.files?.[0]);
      updateConfig({ banner: dataUrl });
      renderPreview(load());
    } catch (err) {
      alert(err.message);
      event.target.value = "";
    }
  });

  window.addEventListener("hashchange", render);

  // Boot
  const initial = load();
  if (initial.locked) {
    location.hash = "#/success";
  } else if (!location.hash) {
    location.hash = "#/" + (initial.step || "template");
  }
  render();
})();
