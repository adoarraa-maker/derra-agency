/**
 * Freemium Website Builder — mock state management
 * Persists draft config in localStorage. Payment is simulated client-side.
 */
(function (global) {
  const STORAGE_KEY = "derra_builder_draft_v1";
  const PAID_KEY = "derra_builder_published_v1";

  const TEMPLATES = {
    restaurant: {
      id: "restaurant",
      label: "Restaurant & Café",
      description: "Menu digital, ambiance gourmande, réservation WhatsApp.",
      defaultTagline: "Cuisine locale, moments partagés",
      accent: "#c4a574"
    },
    salon: {
      id: "salon",
      label: "Salon de coiffure & beauté",
      description: "Prestations, tarifs, prise de RDV WhatsApp.",
      defaultTagline: "Votre style, notre signature",
      accent: "#c98982"
    },
    tobacco: {
      id: "tobacco",
      label: "Tabac / Press",
      description: "Horaires, services du quotidien, contact rapide.",
      defaultTagline: "Votre commerce de proximité",
      accent: "#8b7355"
    },
    artisan: {
      id: "artisan",
      label: "Métier / Artisan",
      description: "Services, devis, mise en avant du savoir-faire.",
      defaultTagline: "Savoir-faire & qualité",
      accent: "#5a8f7b"
    }
  };

  const THEMES = {
    midnight: { id: "midnight", label: "Minuit bleu", primary: "#3d8bfd", bg: "#07111f", text: "#f8fbff", soft: "#0d1b2d" },
    gold: { id: "gold", label: "Or & encre", primary: "#d9b86c", bg: "#12100c", text: "#f7f1e6", soft: "#1c1812" },
    forest: { id: "forest", label: "Forêt", primary: "#4caf82", bg: "#0b1511", text: "#eef7f2", soft: "#12201a" },
    blush: { id: "blush", label: "Rose soft", primary: "#d48a8a", bg: "#161014", text: "#f8f0f0", soft: "#22181c" }
  };

  function emptyService() {
    const id =
      (global.crypto && typeof global.crypto.randomUUID === "function" && global.crypto.randomUUID()) ||
      ("s-" + Date.now().toString(36) + "-" + Math.random().toString(16).slice(2));
    return { id, name: "", price: "", image: "" };
  }

  function defaultState() {
    return {
      step: "template",
      locked: false,
      payment: null,
      publishedAt: null,
      config: {
        template: null,
        businessName: "",
        tagline: "",
        logo: "",
        banner: "",
        phone: "",
        whatsapp: "",
        address: "",
        hours: "",
        theme: "midnight",
        logoUpsell: false,
        logoStyle: null,
        generatedLogoSvg: "",
        generatedLogoPng: "",
        services: [emptyService(), emptyService()]
      }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return {
        ...defaultState(),
        ...parsed,
        config: { ...defaultState().config, ...(parsed.config || {}) }
      };
    } catch {
      return defaultState();
    }
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }

  function getPublished() {
    try {
      const raw = localStorage.getItem(PAID_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function publish(state, paymentMeta) {
    const locked = {
      ...state,
      locked: true,
      payment: paymentMeta,
      publishedAt: new Date().toISOString(),
      step: "success"
    };
    save(locked);
    localStorage.setItem(PAID_KEY, JSON.stringify(locked));
    return locked;
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return defaultState();
  }

  function updateConfig(partial) {
    const state = load();
    if (state.locked) return state;
    state.config = { ...state.config, ...partial };
    return save(state);
  }

  function setStep(step) {
    const state = load();
    if (state.locked && step !== "success") return state;
    state.step = step;
    return save(state);
  }

  const STRIPE_PAYMENT_URL_SITE = "https://buy.stripe.com/14A4gA4AFdnybkr6MzcAo02";
  const STRIPE_PAYMENT_URL_SITE_LOGO = "https://buy.stripe.com/cNifZid7bgzKdsz5IvcAo03";
  const LOGO_OPTION_ENABLED = false; // temporarily disabled
  const SUCCESS_RETURN_URL =
    "https://adoarraa-maker.github.io/agency/builder.html?paid=1#/success";

  function getStripePaymentUrl() {
    // Logo upsell temporarily disabled — always use site-only Payment Link.
    return STRIPE_PAYMENT_URL_SITE;
  }

  function getCheckoutAmount() {
    return 99;
  }

  function markPendingStripePayment(state) {
    const pending = {
      ...state,
      paymentPending: true,
      paymentProvider: "stripe",
      paymentStartedAt: new Date().toISOString(),
      checkoutAmount: getCheckoutAmount(),
      stripePaymentUrl: getStripePaymentUrl(),
      step: "checkout"
    };
    save(pending);
    return pending;
  }

  function completeStripeReturn(state) {
    const current = state || load();
    return publish(current, {
      provider: "stripe",
      amount: getCheckoutAmount(),
      currency: "CHF",
      status: "succeeded",
      transactionId: "STRIPE-LINK-" + Date.now().toString(36).toUpperCase(),
      paidAt: new Date().toISOString(),
      source: "stripe_payment_link",
      logoUpsell: false
    });
  }

  /**
   * Mock PayPal checkout — Stripe uses the live Payment Link.
   */
  function mockCheckout({ provider, amount = 99 }) {
    return new Promise((resolve, reject) => {
      if (provider !== "paypal") {
        reject(new Error("Utilisez le paiement Stripe pour publier."));
        return;
      }
      window.setTimeout(() => {
        resolve({
          provider,
          amount,
          currency: "CHF",
          status: "succeeded",
          transactionId: "PAYPAL-" + Date.now().toString(36).toUpperCase(),
          paidAt: new Date().toISOString()
        });
      }, 1600);
    });
  }

  function fileToDataUrl(file, maxBytes = 900000) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      if (file.size > maxBytes) {
        reject(new Error("Image trop lourde (max ~900 Ko). Compressez-la puis réessayez."));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
      reader.readAsDataURL(file);
    });
  }

  global.DerraBuilder = {
    TEMPLATES,
    THEMES,
    STORAGE_KEY,
    STRIPE_PAYMENT_URL_SITE,
    STRIPE_PAYMENT_URL_SITE_LOGO,
    LOGO_OPTION_ENABLED,
    SUCCESS_RETURN_URL,
    getStripePaymentUrl,
    getCheckoutAmount,
    emptyService,
    defaultState,
    load,
    save,
    getPublished,
    publish,
    reset,
    updateConfig,
    setStep,
    markPendingStripePayment,
    completeStripeReturn,
    mockCheckout,
    fileToDataUrl
  };
})(window);
