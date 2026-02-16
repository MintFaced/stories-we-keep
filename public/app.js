// =====================================================================
// Stories We Keep — Frontend
// =====================================================================

(function () {
  "use strict";

  // -------------------------------------------------------------------
  // Prices & DOM references (set up immediately — no async needed)
  // -------------------------------------------------------------------
  const PRICES = { audio: 299, video: 499, storage: 99 };

  const tiers = [
    {
      key: "audio",
      btn: document.getElementById("checkout-audio"),
      priceEl: document.getElementById("price-audio"),
      check: document.querySelector('[data-tier="audio"]'),
      baseLink: "/checkout/audio",
      storageLink: "/checkout/audio-storage",
    },
    {
      key: "video",
      btn: document.getElementById("checkout-video"),
      priceEl: document.getElementById("price-video"),
      check: document.querySelector('[data-tier="video"]'),
      baseLink: "/checkout/video",
      storageLink: "/checkout/video-storage",
    },
  ];

  // -------------------------------------------------------------------
  // Price update + checkout — works immediately, links filled in later
  // -------------------------------------------------------------------
  const checkoutIds = new Set(["checkout-audio", "checkout-video"]);

  tiers.forEach(function (tier) {
    if (!tier.btn || !tier.check) return;

    function getLink() {
      return tier.check.checked ? tier.storageLink : tier.baseLink;
    }

    function updateTier() {
      var withStorage = tier.check.checked;
      var total = PRICES[tier.key] + (withStorage ? PRICES.storage : 0);
      var link = getLink();

      // Update price displays
      if (tier.priceEl) {
        tier.priceEl.textContent = "$" + total;
        tier.priceEl.classList.add("price-updated");
        setTimeout(function () {
          tier.priceEl.classList.remove("price-updated");
        }, 300);
      }

      var priceSpan = tier.btn.querySelector(".checkout-price");
      if (priceSpan) priceSpan.textContent = "$" + total;

      // Update button link
      tier.btn.href =
        link ||
        "/checkout/" + tier.key + (withStorage ? "-storage" : "");
    }

    // Checkout button click
    tier.btn.addEventListener("click", function (e) {
      var link = getLink();
      if (link) {
        e.preventDefault();
        window.location.href = link;
      }
      // If no link, the href fallback takes the user to server-side checkout redirect
    });

    // Storage checkbox change
    tier.check.addEventListener("change", updateTier);

    // Set initial state
    updateTier();

    // Expose setter so the async config loader can inject links later
    tier._update = updateTier;
  });

  // -------------------------------------------------------------------
  // Load config from server (async — fills in Stripe links + Calendly)
  // -------------------------------------------------------------------
  fetch("/api/config")
    .then(function (res) {
      if (!res.ok) throw new Error("config " + res.status);
      return res.json();
    })
    .then(function (config) {
      // Inject Stripe payment links
      tiers.forEach(function (tier) {
        if (tier.key === "audio") {
          tier.baseLink = config.stripeAudioLink || tier.baseLink;
          tier.storageLink = config.stripeAudioStorageLink || tier.storageLink;
        } else if (tier.key === "video") {
          tier.baseLink = config.stripeVideoLink || tier.baseLink;
          tier.storageLink = config.stripeVideoStorageLink || tier.storageLink;
        }
        // Re-run to set the correct href now that links are available
        if (tier._update) tier._update();
      });

      // Calendly embed
      var calendlyUrl = config.calendlyUrl;
      var calendlyContainer = document.getElementById("calendly-container");
      var calendlyPlaceholder = document.getElementById(
        "calendly-placeholder"
      );

      if (calendlyContainer && calendlyUrl) {
        function initCalendly() {
          if (typeof Calendly === "undefined") return false;
          if (calendlyPlaceholder) calendlyPlaceholder.remove();
          Calendly.initInlineWidget({
            url: calendlyUrl,
            parentElement: calendlyContainer,
            prefill: {},
            utm: {},
          });
          var iframe = calendlyContainer.querySelector("iframe");
          if (iframe) {
            iframe.style.minWidth = "100%";
            iframe.style.minHeight = "660px";
          }
          return true;
        }

        if (!initCalendly()) {
          var attempts = 0;
          var poll = setInterval(function () {
            attempts++;
            if (initCalendly() || attempts > 40) clearInterval(poll);
          }, 250);
        }
      }
    })
    .catch(function () {
      // Config fetch failed — buttons fall back to #book scroll
    });

  // -------------------------------------------------------------------
  // Mobile nav toggle
  // -------------------------------------------------------------------
  var navToggle = document.getElementById("nav-toggle");
  var navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navToggle.classList.toggle("nav__toggle--active");
      navLinks.classList.toggle("nav__links--open");
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navToggle.classList.remove("nav__toggle--active");
        navLinks.classList.remove("nav__links--open");
      });
    });
  }

  // -------------------------------------------------------------------
  // Scroll-reveal animation
  // -------------------------------------------------------------------
  var revealTargets = document.querySelectorAll(
    ".step, .feature, .pricing-card, .pricing-card--featured, .faq, .interlude__title, .interlude__text"
  );

  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
  });

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add("reveal--visible");
    });
  }

  // -------------------------------------------------------------------
  // Smooth scroll for anchor links (skip checkout buttons)
  // -------------------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    if (checkoutIds.has(anchor.id)) return;

    anchor.addEventListener("click", function (e) {
      var targetId = anchor.getAttribute("href");
      if (targetId === "#") return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
})();
