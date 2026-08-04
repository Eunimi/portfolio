(() => {
  const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  const INK_DIM = "rgba(23, 63, 54, 0.18)";
  const INK_FULL = "rgba(23, 63, 54, 1)";
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const desktopHover =
    finePointer && window.matchMedia("(min-width: 769px)").matches;
  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  /* ---------- Mobile nav ---------- */
  const toggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const open = mobileNav.hasAttribute("hidden");
      mobileNav.toggleAttribute("hidden", !open);
      toggle.setAttribute("aria-expanded", String(open));
    });
    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Language switch ---------- */
  const langSwitch = document.querySelector("[data-lang-switch]");
  if (langSwitch) {
    const options = [...langSwitch.querySelectorAll("[data-lang]")];
    const setLang = (lang) => {
      langSwitch.dataset.active = lang;
      document.documentElement.lang = lang === "cn" ? "zh-CN" : "en";
      options.forEach((btn) => {
        const active = btn.dataset.lang === lang;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", String(active));
      });
    };

    const initial =
      options.find((btn) => btn.classList.contains("is-active"))?.dataset
        .lang || "en";
    setLang(initial);

    options.forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });
  }

  /* ---------- Testimonials ---------- */
  const voices = document.querySelector("[data-voices]");
  if (voices) {
    const cards = [...voices.querySelectorAll(".voice-card")];
    let index = 0;
    const paint = () => {
      cards.forEach((card, i) => card.classList.toggle("active", i === index));
    };
    voices.querySelector("[data-voice-prev]")?.addEventListener("click", () => {
      index = (index - 1 + cards.length) % cards.length;
      paint();
    });
    voices.querySelector("[data-voice-next]")?.addEventListener("click", () => {
      index = (index + 1) % cards.length;
      paint();
    });
  }

  /* ---------- Split section heads by line (keep ink for non-hero) ---------- */
  const wrapLines = (el) => {
    if (!el || el.querySelector(".ink-line") || el.querySelector(".char")) {
      return [...(el?.querySelectorAll(".ink-line") || [])];
    }
    const html = el.innerHTML;
    const parts = html
      .split(/<br\s*\/?>/i)
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) {
      const text = el.textContent.trim();
      if (!text) return [];
      el.innerHTML = `<span class="ink-line">${text}</span>`;
    } else {
      el.innerHTML = parts
        .map((part) => `<span class="ink-line">${part}</span>`)
        .join("");
    }
    return [...el.querySelectorAll(".ink-line")];
  };

  document.querySelectorAll("[data-scroll-ink]").forEach((block) => {
    if (block.matches("p, h2")) {
      wrapLines(block);
      return;
    }
    block.querySelectorAll("h2, p").forEach((el) => wrapLines(el));
  });

  /* ---------- Char split for hero intro ---------- */
  const splitChars = (el) => {
    if (!el || el.querySelector(".char")) return [...(el?.querySelectorAll(".char") || [])];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      const text = node.nodeValue;
      if (!text || !text.trim()) return;
      const frag = document.createDocumentFragment();
      [...text].forEach((ch) => {
        if (ch === "\n" || ch === "\r") return;
        if (/\s/.test(ch)) {
          frag.appendChild(document.createTextNode(" "));
          return;
        }
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = ch;
        frag.appendChild(span);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return [...el.querySelectorAll(".char")];
  };

  const revealCopy = document.querySelector("[data-reveal-copy]");
  if (revealCopy) splitChars(revealCopy);

  const settleReduced = () => {
    document
      .querySelectorAll(
        "[data-reveal], [data-project-card], [data-category-card], [data-footer-copy] > *, [data-footer-social] .social-btn, .bar, .ink-line, .char, .hero-intro, .section-head h2, .section-head p, .hero-line, .nav-pill"
      )
      .forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
        el.style.clipPath = "none";
        if (
          el.classList.contains("ink-line") ||
          el.classList.contains("char") ||
          el.matches("h2, p")
        ) {
          el.style.color = INK_FULL;
        }
      });
  };

  document.querySelectorAll("[data-category-card]").forEach((card) => {
    card.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 767px)").matches) {
        document
          .querySelectorAll("[data-category-card].is-active")
          .forEach((el) => {
            if (el !== card) el.classList.remove("is-active");
          });
        card.classList.toggle("is-active");
      }
    });
  });

  /* ---------- Nav highlight (works without GSAP too via CSS left) ---------- */
  const navPill = document.querySelector("[data-nav-pill] .nav-pill");
  const navHighlight = document.querySelector("[data-nav-highlight]");
  const navItems = [...document.querySelectorAll("[data-nav-item]")];
  let activeNav =
    navItems.find((item) => item.classList.contains("is-active")) ||
    navItems[0];

  const moveHighlight = (item, duration = 0.42) => {
    if (!navHighlight || !item || !navPill) return;
    const left = item.offsetLeft;
    const w = item.offsetWidth;
    if (window.gsap && !reduceMotion) {
      window.gsap.to(navHighlight, {
        left,
        width: w,
        duration,
        ease: "power3.inOut",
        overwrite: true,
      });
    } else {
      navHighlight.style.left = `${left}px`;
      navHighlight.style.width = `${w}px`;
    }
  };

  if (navPill && navHighlight && navItems.length) {
    requestAnimationFrame(() => moveHighlight(activeNav, 0));
    navItems.forEach((item) => {
      item.addEventListener("mouseenter", () => moveHighlight(item, 0.42));
      item.addEventListener("focus", () => moveHighlight(item, 0.42));
      item.addEventListener("click", () => {
        navItems.forEach((el) => el.classList.remove("is-active"));
        item.classList.add("is-active");
        activeNav = item;
        moveHighlight(item, 0.42);
      });
    });
    navPill.addEventListener("mouseleave", () =>
      moveHighlight(activeNav, 0.5)
    );
    window.addEventListener("resize", () => moveHighlight(activeNav, 0));
  }

  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    settleReduced();
    return;
  }

  const { gsap } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: EASE });

  const ctx = gsap.context(() => {
    /* ---------- Lenis ---------- */
    let lenis = null;
    let lenisRaf = null;
    if (window.Lenis && !reduceMotion) {
      lenis = new Lenis({
        duration: 1.1,
        lerp: 0.08,
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
        smoothWheel: true,
      });
      lenis.on("scroll", ScrollTrigger.update);
      lenisRaf = (time) => lenis.raf(time * 1000);
      gsap.ticker.add(lenisRaf);
      gsap.ticker.lagSmoothing(0);
    }

    /* ---------- Nav entrance ---------- */
    if (navPill) {
      gsap.fromTo(
        navPill,
        { opacity: 0, y: -22, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          delay: 0.05,
          ease: EASE,
        }
      );
    }

    /* ---------- Section head ink (line-based, not hero intro) ---------- */
    document.querySelectorAll("[data-scroll-ink]").forEach((block) => {
      const lines = block.querySelectorAll(".ink-line");
      if (!lines.length) return;
      gsap.fromTo(
        lines,
        { color: INK_DIM, y: 18 },
        {
          color: INK_FULL,
          y: 0,
          ease: "none",
          stagger: 0.07,
          scrollTrigger: {
            trigger: block,
            start: "top 85%",
            end: "top 45%",
            scrub: 0.8,
          },
        }
      );
    });

    /* ---------- Hero intro char-by-char ---------- */
    if (revealCopy) {
      const chars = revealCopy.querySelectorAll(".char");
      if (chars.length) {
        gsap.fromTo(
          chars,
          { color: INK_DIM, y: 5 },
          {
            color: INK_FULL,
            y: 0,
            ease: "none",
            stagger: 0.025,
            scrollTrigger: {
              trigger: revealCopy,
              start: "top 82%",
              end: "bottom 48%",
              scrub: 0.7,
            },
          }
        );
      }
    }

    /* ---------- Hero ---------- */
    const hero = document.querySelector("[data-hero]");
    if (hero) {
      const line1 = hero.querySelector(".hero-line-1");
      const line2 = hero.querySelector(".hero-line-2");
      const circleBlob = hero.querySelector('[data-hero-blob="circle"]');
      const primaryBlob = hero.querySelector('[data-hero-blob="primary"]');
      const secondaryBlob = hero.querySelector('[data-hero-blob="secondary"]');
      const badge = hero.querySelector("[data-scroll-badge]");
      const xOff = isMobile ? "65vw" : "105vw";
      const enterDur = isMobile ? 0.9 : null;

      gsap.set([circleBlob, primaryBlob, secondaryBlob, badge].filter(Boolean), {
        opacity: 0,
      });

      const heroScrub = {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.8,
      };

      if (circleBlob) {
        gsap.to(circleBlob, {
          y: -55,
          scale: 1.04,
          ease: "none",
          scrollTrigger: { ...heroScrub },
        });
      }
      if (primaryBlob) {
        gsap.to(primaryBlob, {
          y: -85,
          ease: "none",
          scrollTrigger: { ...heroScrub },
        });
      }
      if (secondaryBlob) {
        gsap.to(secondaryBlob, {
          y: -120,
          ease: "none",
          scrollTrigger: { ...heroScrub },
        });
      }

      if (line1 && line2) {
        gsap.set(line1, { x: `-${xOff}`, opacity: 1 });
        gsap.set(line2, { x: xOff, opacity: 1 });

        const heroTimeline = gsap.timeline({
          onComplete: () => {
            gsap.to(line1, {
              x: -90,
              y: -45,
              ease: "none",
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: 0.8,
              },
            });
            gsap.to(line2, {
              x: 110,
              y: -70,
              ease: "none",
              scrollTrigger: {
                trigger: hero,
                start: "top top",
                end: "bottom top",
                scrub: 0.8,
              },
            });
            if (badge) {
              gsap.fromTo(
                badge,
                { y: 0, opacity: 1, scale: 1 },
                {
                  y: -80,
                  opacity: 0,
                  scale: 0.94,
                  ease: "none",
                  scrollTrigger: {
                    trigger: hero,
                    start: "top top",
                    end: "bottom top",
                    scrub: 0.8,
                  },
                }
              );
            }
          },
        });

        heroTimeline.to(
          line1,
          {
            x: "0vw",
            duration: enterDur || 1.35,
            ease: "power4.inOut",
          },
          0.12
        );
        heroTimeline.to(
          line2,
          {
            x: "0vw",
            duration: enterDur || 1.4,
            ease: "power4.inOut",
          },
          0.2
        );
        heroTimeline.to(
          [circleBlob, primaryBlob, secondaryBlob].filter(Boolean),
          { opacity: 1, duration: 0.8, ease: EASE },
          0.55
        );
        if (badge) {
          heroTimeline.fromTo(
            badge,
            { opacity: 0, scale: 0.94 },
            { opacity: 1, scale: 1, duration: 0.7, ease: EASE },
            0.85
          );
        }
      }
    }

    /* ---------- Soft reveals ---------- */
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 1.05,
          ease: EASE,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    /* ---------- Timeline bars ---------- */
    const timeline = document.querySelector("[data-timeline]");
    if (timeline) {
      gsap.fromTo(
        timeline.querySelectorAll(".bar"),
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.05,
          stagger: 0.1,
          ease: EASE,
          scrollTrigger: { trigger: timeline, start: "top 75%" },
        }
      );
    }

    /* ---------- Process float ---------- */
    const process = document.querySelector("[data-process]");
    if (process) {
      process.querySelectorAll("[data-float]").forEach((card, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        gsap.to(card, {
          y: dir * (28 + i * 8),
          ease: "none",
          scrollTrigger: {
            trigger: process,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });
    }

    /* ---------- Project cards enter ---------- */
    document.querySelectorAll("[data-project-card]").forEach((card) => {
      const inRight = Boolean(card.closest(".project-col-right"));
      gsap.fromTo(
        card,
        {
          opacity: 0,
          y: 70,
          scale: 0.985,
          clipPath: "inset(10% 0 0 0 round 28px)",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          clipPath: "inset(0% 0 0 0 round 28px)",
          ease: "none",
          delay: inRight ? 0.1 : 0,
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            end: "top 62%",
            scrub: 0.6,
          },
        }
      );
    });

    /* ---------- SHOW CASE follow ---------- */
    const cleanups = [];
    document.querySelectorAll("[data-project-card]").forEach((card) => {
      const thumb = card.querySelector(".project-thumb");
      const cursor = card.querySelector(".showcase-cursor");
      const media = card.querySelector(".thumb-media, .thumb-fill");
      if (!thumb || !desktopHover || reduceMotion) return;

      let active = false;
      let rafId = 0;
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      const paint = () => {
        if (!cursor) return;
        cursor.style.transform = `translate3d(${currentX - 110}px, ${
          currentY - 110
        }px, 0) scale(${active ? 1 : 0.72}) rotate(${active ? 0 : -8}deg)`;
      };

      const tick = () => {
        currentX += (targetX - currentX) * 0.14;
        currentY += (targetY - currentY) * 0.14;
        paint();
        if (active) rafId = requestAnimationFrame(tick);
        else rafId = 0;
      };

      const onEnter = (e) => {
        active = true;
        card.classList.add("is-hovering");
        const rect = thumb.getBoundingClientRect();
        targetX = currentX = e.clientX - rect.left;
        targetY = currentY = e.clientY - rect.top;
        if (media) {
          media.style.transition = `transform 0.8s ${EASE}`;
          media.style.transform = "translate3d(0,0,0) scale(1.04)";
        }
        if (cursor) {
          cursor.style.transition = "none";
          cursor.style.opacity = "0";
          cursor.style.transform = `translate3d(${currentX - 110}px, ${
            currentY - 110
          }px, 0) scale(0.55) rotate(-8deg)`;
          requestAnimationFrame(() => {
            cursor.style.transition = `transform 0.38s ${EASE}, opacity 0.38s ${EASE}`;
            cursor.style.opacity = "1";
            cursor.style.transform = `translate3d(${currentX - 110}px, ${
              currentY - 110
            }px, 0) scale(1) rotate(0deg)`;
          });
        }
        if (!rafId) rafId = requestAnimationFrame(tick);
      };

      const onMove = (e) => {
        const rect = thumb.getBoundingClientRect();
        targetX = e.clientX - rect.left;
        targetY = e.clientY - rect.top;
        if (media) {
          const nx = (targetX / rect.width - 0.5) * 2;
          const ny = (targetY / rect.height - 0.5) * 2;
          media.style.transition = "none";
          media.style.transform = `translate3d(${-nx * 6}px, ${
            -ny * 6
          }px, 0) scale(1.04)`;
        }
      };

      const onLeave = () => {
        active = false;
        card.classList.remove("is-hovering");
        if (cursor) {
          cursor.style.transition = `transform 0.24s ${EASE}, opacity 0.24s ${EASE}`;
          cursor.style.opacity = "0";
          cursor.style.transform = `translate3d(${currentX - 110}px, ${
            currentY - 110
          }px, 0) scale(0.72) rotate(-8deg)`;
        }
        if (media) {
          media.style.transition = `transform 0.8s ${EASE}`;
          media.style.transform = "translate3d(0,0,0) scale(1)";
        }
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      };

      thumb.addEventListener("pointerenter", onEnter);
      thumb.addEventListener("pointermove", onMove);
      thumb.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        thumb.removeEventListener("pointerenter", onEnter);
        thumb.removeEventListener("pointermove", onMove);
        thumb.removeEventListener("pointerleave", onLeave);
        if (rafId) cancelAnimationFrame(rafId);
      });
    });

    /* ---------- Footer categories ---------- */
    const categoryRow = document.querySelector("[data-category-row]");
    if (categoryRow) {
      gsap.fromTo(
        categoryRow.querySelectorAll("[data-category-card]"),
        { opacity: 0, y: 55 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.07,
          ease: EASE,
          scrollTrigger: {
            trigger: categoryRow,
            start: "top 85%",
            once: true,
          },
        }
      );
    }

    const footerCopies = document.querySelectorAll("[data-footer-copy]");
    if (footerCopies.length) {
      const textItems = [];
      footerCopies.forEach((block) => {
        if (block.classList.contains("footer-nav")) {
          textItems.push(block);
        } else {
          textItems.push(...block.children);
        }
      });
      gsap.fromTo(
        textItems,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.05,
          delay: 0.18,
          ease: EASE,
          scrollTrigger: {
            trigger: footerCopies[0],
            start: "top 85%",
            once: true,
          },
        }
      );
    }

    const social = document.querySelector("[data-footer-social]");
    if (social) {
      gsap.fromTo(
        social.querySelectorAll(".social-btn"),
        { opacity: 0, scale: 0.7 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: EASE,
          scrollTrigger: {
            trigger: social,
            start: "top 90%",
            once: true,
          },
        }
      );
    }

    window.addEventListener(
      "pagehide",
      () => {
        cleanups.forEach((fn) => fn());
        if (lenis) {
          lenis.destroy();
          if (lenisRaf) gsap.ticker.remove(lenisRaf);
        }
      },
      { once: true }
    );
  });

  window.addEventListener(
    "pagehide",
    () => {
      ctx.revert();
    },
    { once: true }
  );
})();
