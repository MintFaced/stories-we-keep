// =====================================================================
// Stories We Keep — Frontend
// =====================================================================

(async function () {
  "use strict";

  // -------------------------------------------------------------------
  // Load config from server
  // -------------------------------------------------------------------
  let config = {
    calendlyUrl: "https://calendly.com",
    stripeAudioLink: null,
    stripeAudioStorageLink: null,
    stripeVideoLink: null,
    stripeVideoStorageLink: null,
  };

  try {
    const res = await fetch("/api/config");
    if (res.ok) config = await res.json();
  } catch {
    // Use defaults
  }

  // -------------------------------------------------------------------
  // Payment links — set checkout button URLs + storage add-on toggle
  // -------------------------------------------------------------------
  const PRICES = { audio: 299, video: 499, storage: 99 };

  const checkoutIds = new Set(["checkout-audio", "checkout-video"]);

  const tiers = [
    {
      key: "audio",
      btn: document.getElementById("checkout-audio"),
      priceEl: document.getElementById("price-audio"),
      check: document.querySelector('[data-tier="audio"]'),
      baseLink: config.stripeAudioLink,
      storageLink: config.stripeAudioStorageLink,
    },
    {
      key: "video",
      btn: document.getElementById("checkout-video"),
      priceEl: document.getElementById("price-video"),
      check: document.querySelector('[data-tier="video"]'),
      baseLink: config.stripeVideoLink,
      storageLink: config.stripeVideoStorageLink,
    },
  ];

  tiers.forEach((tier) => {
    if (!tier.btn || !tier.check) return;

    function getLink() {
      return tier.check.checked ? tier.storageLink : tier.baseLink;
    }

    function updateTier() {
      const withStorage = tier.check.checked;
      const total = PRICES[tier.key] + (withStorage ? PRICES.storage : 0);
      const link = getLink();

      // Update price displays
      if (tier.priceEl) {
        tier.priceEl.textContent = "$" + total;
        tier.priceEl.classList.add("price-updated");
        setTimeout(() => tier.priceEl.classList.remove("price-updated"), 300);
      }

      const priceSpan = tier.btn.querySelector(".checkout-price");
      if (priceSpan) priceSpan.textContent = "$" + total;

      // Update button link
      if (link) {
        tier.btn.href = link;
      } else {
        tier.btn.href = "#book";
      }
    }

    // Handle checkout button clicks
    tier.btn.addEventListener("click", function (e) {
      const link = getLink();
      if (link) {
        // Navigate to Stripe
        e.preventDefault();
        window.location.href = link;
      }
      // If no link, the href="#book" fallback scrolls to the booking section
    });

    tier.check.addEventListener("change", updateTier);
    updateTier(); // set initial state
  });

  // -------------------------------------------------------------------
  // Calendly embed
  // -------------------------------------------------------------------
  const calendlyContainer = document.getElementById("calendly-container");
  const calendlyPlaceholder = document.getElementById("calendly-placeholder");

  if (calendlyContainer && config.calendlyUrl) {
    function initCalendly() {
      if (typeof Calendly === "undefined") return false;

      if (calendlyPlaceholder) calendlyPlaceholder.remove();

      Calendly.initInlineWidget({
        url: config.calendlyUrl,
        parentElement: calendlyContainer,
        prefill: {},
        utm: {},
      });

      const iframe = calendlyContainer.querySelector("iframe");
      if (iframe) {
        iframe.style.minWidth = "100%";
        iframe.style.minHeight = "660px";
      }

      return true;
    }

    // Try immediately, then poll for Calendly script
    if (!initCalendly()) {
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        if (initCalendly() || attempts > 40) clearInterval(poll);
      }, 250);
    }
  }

  // -------------------------------------------------------------------
  // Mobile nav toggle
  // -------------------------------------------------------------------
  const navToggle = document.getElementById("nav-toggle");
  const navLinks = document.getElementById("nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("nav__toggle--active");
      navLinks.classList.toggle("nav__links--open");
    });

    // Close menu on link click
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navToggle.classList.remove("nav__toggle--active");
        navLinks.classList.remove("nav__links--open");
      });
    });
  }

  // -------------------------------------------------------------------
  // Scroll-reveal animation
  // -------------------------------------------------------------------
  const revealTargets = document.querySelectorAll(
    ".step, .feature, .pricing-card, .pricing-card--featured, .faq, .interlude__title, .interlude__text"
  );

  revealTargets.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    revealTargets.forEach((el) => observer.observe(el));
  } else {
    // Fallback: just show everything
    revealTargets.forEach((el) => el.classList.add("reveal--visible"));
  }

  // -------------------------------------------------------------------
  // Smooth scroll for anchor links (skip checkout buttons)
  // -------------------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    // Skip checkout buttons — they have their own click handler
    if (checkoutIds.has(anchor.id)) return;

    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      if (targetId === "#") return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });
})();
