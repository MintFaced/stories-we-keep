// =====================================================================
// Stories We Keep — Frontend
// =====================================================================

(function () {
  "use strict";

  // -------------------------------------------------------------------
  // Prices & DOM references (set up immediately — no async needed)
  // -------------------------------------------------------------------
  const PRICES = { audio: 299, video: 499, storage: 99 };

  // Tier config — keyed by tier name for easy lookup
  var tierMap = {
    audio: {
      key: "audio",
      btn: document.getElementById("checkout-audio"),
      priceEl: document.getElementById("price-audio"),
      check: document.querySelector('[data-tier="audio"]'),
      baseLink: "/checkout/audio",
      storageLink: "/checkout/audio-storage",
    },
    video: {
      key: "video",
      btn: document.getElementById("checkout-video"),
      priceEl: document.getElementById("price-video"),
      check: document.querySelector('[data-tier="video"]'),
      baseLink: "/checkout/video",
      storageLink: "/checkout/video-storage",
    },
  };
  var tiers = [tierMap.audio, tierMap.video];

  // -------------------------------------------------------------------
  // Price update + checkout — works immediately, links filled in later
  // -------------------------------------------------------------------
  var checkoutIds = new Set(["checkout-audio", "checkout-video"]);

  function updateTier(tier) {
    if (!tier || !tier.btn || !tier.check) return;
    var withStorage = tier.check.checked;
    var total = PRICES[tier.key] + (withStorage ? PRICES.storage : 0);
    var link = withStorage ? tier.storageLink : tier.baseLink;

    // Update price in card header
    if (tier.priceEl) {
      tier.priceEl.textContent = "$" + total;
      tier.priceEl.classList.add("price-updated");
      setTimeout(function () {
        tier.priceEl.classList.remove("price-updated");
      }, 300);
    }

    // Update price on button
    var priceSpan = tier.btn.querySelector(".checkout-price");
    if (priceSpan) priceSpan.textContent = "$" + total;

    // Update button link
    tier.btn.href =
      link || "/checkout/" + tier.key + (withStorage ? "-storage" : "");
  }

  // Initial render
  tiers.forEach(function (tier) {
    updateTier(tier);
  });

  // -------------------------------------------------------------------
  // Checkbox handling via document-level event delegation
  // -------------------------------------------------------------------
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (!el.matches || !el.matches(".pricing-card__addon-check")) return;
    var key = el.getAttribute("data-tier");
    if (key && tierMap[key]) updateTier(tierMap[key]);
  });

  // Belt-and-suspenders: also listen for click (covers edge-case
  // browsers that fire click but not change on label-wrapped checkboxes)
  document.addEventListener("click", function (e) {
    var el = e.target.closest && e.target.closest(".pricing-card__addon");
    if (!el) return;
    var checkbox = el.querySelector(".pricing-card__addon-check");
    if (!checkbox) return;
    var key = checkbox.getAttribute("data-tier");
    if (!key || !tierMap[key]) return;
    // Defer so the browser has toggled `checked` before we read it
    setTimeout(function () {
      updateTier(tierMap[key]);
    }, 0);
  });

  // -------------------------------------------------------------------
  // Checkout button clicks
  // -------------------------------------------------------------------
  tiers.forEach(function (tier) {
    if (!tier.btn) return;
    tier.btn.addEventListener("click", function (e) {
      var link = tier.check && tier.check.checked
        ? tier.storageLink
        : tier.baseLink;
      if (link) {
        e.preventDefault();
        window.location.href = link;
      }
    });
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
      if (config.stripeAudioLink) tierMap.audio.baseLink = config.stripeAudioLink;
      if (config.stripeAudioStorageLink) tierMap.audio.storageLink = config.stripeAudioStorageLink;
      if (config.stripeVideoLink) tierMap.video.baseLink = config.stripeVideoLink;
      if (config.stripeVideoStorageLink) tierMap.video.storageLink = config.stripeVideoStorageLink;

      // Re-render with the Stripe links
      tiers.forEach(function (tier) {
        updateTier(tier);
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
