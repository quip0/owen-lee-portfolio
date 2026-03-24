const hero = document.querySelector(".hero");
const menu = document.querySelector("[data-menu]");
const titleHint = document.querySelector("[data-title-hint]");
const title = document.querySelector("[data-title]");
const landing = document.querySelector("[data-landing]");
const about = document.querySelector("[data-about]");
const aboutInner = about?.querySelector(".about__inner");
const aboutText = about?.querySelector("[data-about-text]");
const aboutCopies = [...document.querySelectorAll("[data-about-copy]")];
const aboutSelection = about?.querySelector("[data-about-selection]");
const aboutSocialItems = [...document.querySelectorAll(".about__social-link, .about__social-plug")];
const menuTrigger = document.querySelector("[data-menu-trigger]");
const loadingScreen = document.querySelector("[data-loading-screen]");
const loadingAscii = document.querySelector("[data-loading-ascii]");
const initialView = new URLSearchParams(window.location.search).get("view");

/* ── Cursor glow ── */
const cursorGlow = document.createElement("div");
cursorGlow.className = "cursor-glow";
cursorGlow.style.opacity = "0";
document.body.appendChild(cursorGlow);

let glowX = 0, glowY = 0, glowTargetX = 0, glowTargetY = 0, glowVisible = false;

const updateGlow = () => {
  glowX += (glowTargetX - glowX) * 0.08;
  glowY += (glowTargetY - glowY) * 0.08;
  cursorGlow.style.left = glowX + "px";
  cursorGlow.style.top = glowY + "px";
  requestAnimationFrame(updateGlow);
};
updateGlow();

document.addEventListener("pointermove", (e) => {
  glowTargetX = e.clientX;
  glowTargetY = e.clientY;
  if (!glowVisible) {
    glowVisible = true;
    cursorGlow.style.opacity = "1";
  }
}, { passive: true });

/* ── Floating particles ── */
const particleCanvas = document.createElement("canvas");
particleCanvas.className = "particle-canvas";
hero?.prepend(particleCanvas);

const pCtx = particleCanvas.getContext("2d");
let particles = [];

const resizeParticleCanvas = () => {
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
};
resizeParticleCanvas();

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * particleCanvas.width;
    this.y = Math.random() * particleCanvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.2 - 0.1;
    this.opacity = Math.random() * 0.15 + 0.03;
    this.life = Math.random() * 600 + 200;
    this.maxLife = this.life;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life--;

    const distX = this.x - glowTargetX;
    const distY = this.y - glowTargetY;
    const dist = Math.sqrt(distX * distX + distY * distY);
    if (dist < 200) {
      const force = (200 - dist) / 200 * 0.15;
      this.speedX += (distX / dist) * force;
      this.speedY += (distY / dist) * force;
    }

    this.speedX *= 0.99;
    this.speedY *= 0.99;

    if (this.life <= 0 || this.x < -10 || this.x > particleCanvas.width + 10 ||
        this.y < -10 || this.y > particleCanvas.height + 10) {
      this.reset();
    }
  }

  draw() {
    const fadeIn = Math.min(1, (this.maxLife - this.life) / 60);
    const fadeOut = Math.min(1, this.life / 60);
    const alpha = this.opacity * fadeIn * fadeOut;
    pCtx.beginPath();
    pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    pCtx.fillStyle = `rgba(17, 17, 17, ${alpha})`;
    pCtx.fill();
  }
}

for (let i = 0; i < 60; i++) {
  const p = new Particle();
  p.life = Math.random() * p.maxLife;
  particles.push(p);
}

const animateParticles = () => {
  pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  particles.forEach((p) => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
};
animateParticles();

window.addEventListener("resize", () => {
  resizeParticleCanvas();
});

/* ── Title animation ── */
if (title) {
  window.requestAnimationFrame(() => {
    title.classList.add("is-visible");
  });

  const originalText = title.dataset.text ?? title.textContent ?? "";
  const glyphs = "!@#$%&*+=?/<>[]{}~^";
  const letters = [...originalText];

  title.textContent = "";
  letters.forEach((letter, index) => {
    const span = document.createElement("span");
    span.className = "hero__letter";
    span.dataset.index = String(index);
    span.dataset.char = letter;
    span.textContent = letter;
    title.append(span);
  });

  const spans = [...title.querySelectorAll(".hero__letter")];

  const applyUniformLetterWidth = () => {
    let maxWidth = 0;

    spans.forEach((span) => {
      span.style.width = "auto";
      maxWidth = Math.max(maxWidth, span.getBoundingClientRect().width);
    });

    const uniformWidth = `${Math.ceil(maxWidth * 0.62)}px`;
    spans.forEach((span) => {
      span.style.width = uniformWidth;
    });
  };

  applyUniformLetterWidth();
  window.addEventListener("resize", applyUniformLetterWidth);

  let waveOrigin = -Infinity;
  let waveStartedAt = 0;
  let animationFrame = 0;
  let hasTriggeredInHover = false;

  const renderWave = (now) => {
    const elapsed = now - waveStartedAt;
    const travel = elapsed / 56;
    const bandWidth = 1.35;
    let active = false;

    spans.forEach((span, index) => {
      const distance = Math.abs(index - waveOrigin);
      const bandDistance = Math.abs(distance - travel);
      const edgeFade = Math.max(0, 1 - distance / Math.max(1, spans.length - 1));
      const signal = Math.max(0, 1 - bandDistance / bandWidth) * (0.55 + edgeFade * 0.45);

      if (signal > 0.02) {
        active = true;
        const noiseIndex = Math.floor(Math.random() * glyphs.length);
        span.textContent = glyphs[noiseIndex];
        span.style.opacity = `${0.45 + signal * 0.8}`;
        span.style.transform = `translateY(${signal * -4}px)`;
      } else {
        span.textContent = span.dataset.char;
        span.style.opacity = "1";
        span.style.transform = "translateY(0)";
      }
    });

    if (active) {
      animationFrame = window.requestAnimationFrame(renderWave);
    } else {
      animationFrame = 0;
      spans.forEach((span) => {
        span.textContent = span.dataset.char;
        span.style.opacity = "1";
        span.style.transform = "translateY(0)";
      });
    }
  };

  const findInteractedLetterIndex = (event) => {
    const target = event.target.closest(".hero__letter");

    if (target && title.contains(target)) {
      return Number(target.dataset.index);
    }

    const { clientX, clientY } = event;
    return spans.findIndex((span) => {
      const bounds = span.getBoundingClientRect();
      return (
        clientX >= bounds.left &&
        clientX <= bounds.right &&
        clientY >= bounds.top &&
        clientY <= bounds.bottom
      );
    });
  };

  const triggerWave = (event) => {
    if (hasTriggeredInHover) {
      return;
    }

    const interactedIndex = findInteractedLetterIndex(event);

    if (interactedIndex === -1) {
      return;
    }

    waveOrigin = interactedIndex;
    waveStartedAt = performance.now();
    hasTriggeredInHover = true;

    if (!animationFrame) {
      animationFrame = window.requestAnimationFrame(renderWave);
    }
  };

  title.addEventListener("pointerenter", triggerWave);
  title.addEventListener("pointermove", triggerWave, { passive: true });
  title.addEventListener("pointerenter", () => {
    titleHint?.classList.add("is-visible");
  });
  title.addEventListener("pointerleave", () => {
    hasTriggeredInHover = false;
    titleHint?.classList.remove("is-visible");
  });
}

/* ── Navigation / Menu logic ── */
if (hero && menu) {
  const menuPanel = menu.querySelector(".menu__panel");
  const menuItems = [...menu.querySelectorAll("[data-menu-item]")];
  const menuDescriptionPopup = menu.querySelector("[data-menu-description-popup]");
  const menuClose = menu.querySelector("[data-menu-close]");
  const clickSound = new Audio(new URL("/media/audio/click.wav", import.meta.url).href);
  let activeIndex = 0;
  let isMenuOpen = false;
  let isAboutActive = false;
  let isTransitioningToMenu = false;
  let isMenuReturnMode = false;
  let hasFinishedTyping = false;
  let hasManualMenuRevealOverride = false;
  let motionTimeout = 0;
  let menuDescriptionTimeout = 0;
  let typingTimeout = 0;
  let activeDescriptionItem = null;
  let isNavigatingToProject = false;
  let loadingInterval = 0;

  clickSound.preload = "auto";

  const playClickSound = () => {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  };

  const syncActiveMenuItem = () => {
    menuItems.forEach((item, index) => {
      item.classList.toggle("is-active", index === activeIndex);
    });
  };

  const setActiveMenuIndex = (nextIndex, { playSoundOnChange = false, nudgeDirection = null } = {}) => {
    if (nextIndex < 0 || nextIndex >= menuItems.length || nextIndex === activeIndex) {
      return;
    }

    activeIndex = nextIndex;
    syncActiveMenuItem();

    if (playSoundOnChange) {
      playClickSound();
    }

    if (nudgeDirection) {
      nudgeMenu(nudgeDirection);
    }
  };

  const navigateToMenuItem = (item) => {
    const path = item?.dataset.menuPath;
    if (!path || isNavigatingToProject) {
      return;
    }

    isNavigatingToProject = true;
    hero.classList.add("is-loading");
    loadingScreen?.setAttribute("aria-hidden", "false");

    const frames = [
      "[=   ]",
      "[==  ]",
      "[=== ]",
      "[ ===]",
      "[  ==]",
      "[   =]",
    ];
    let frameIndex = 0;
    loadingAscii.textContent = frames[frameIndex];
    window.clearInterval(loadingInterval);
    loadingInterval = window.setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      if (loadingAscii) {
        loadingAscii.textContent = frames[frameIndex];
      }
    }, 90);

    window.setTimeout(() => {
      window.location.href = path;
    }, 650);
  };

  const nudgeMenu = (direction) => {
    if (!menuPanel) {
      return;
    }

    menuPanel.classList.remove("is-nudging-down", "is-nudging-up");
    window.clearTimeout(motionTimeout);

    window.requestAnimationFrame(() => {
      menuPanel.classList.add(direction === "down" ? "is-nudging-down" : "is-nudging-up");
      motionTimeout = window.setTimeout(() => {
        menuPanel.classList.remove("is-nudging-down", "is-nudging-up");
      }, 240);
    });
  };

  const openMenu = () => {
    if (isMenuOpen || (!isAboutActive && !isMenuReturnMode) || isTransitioningToMenu) {
      return;
    }

    isMenuOpen = true;
    hero.classList.add("menu-open");
    menu.setAttribute("aria-hidden", "false");
    titleHint?.classList.remove("is-visible");
    activeIndex = 0;
    syncActiveMenuItem();
  };

  const closeMenu = () => {
    if (!isMenuOpen) {
      return;
    }

    isMenuOpen = false;
    hero.classList.remove("menu-open");
    menu.setAttribute("aria-hidden", "true");
    menuPanel?.classList.remove("is-nudging-down", "is-nudging-up");
    window.clearTimeout(motionTimeout);
    window.clearTimeout(menuDescriptionTimeout);
    menuDescriptionPopup?.classList.remove("is-visible");
    menuDescriptionPopup?.setAttribute("aria-hidden", "true");
    if (isMenuReturnMode) {
      return;
    }
    about?.classList.remove("is-deleted", "is-selecting");
    restoreAboutText();
    syncMenuTriggerVisibility();
  };

  const handleMenuNavigation = (event) => {
    if (!isMenuOpen || menuItems.length === 0) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      navigateToMenuItem(menuItems[activeIndex]);
      return;
    }

    const moveDown = event.key === "ArrowDown" || event.key === "s" || event.key === "S";
    const moveUp = event.key === "ArrowUp" || event.key === "w" || event.key === "W";

    if (!moveDown && !moveUp) {
      return;
    }

    event.preventDefault();
    const direction = moveDown ? "down" : "up";
    const nextIndex = moveDown
      ? (activeIndex + 1) % menuItems.length
      : (activeIndex - 1 + menuItems.length) % menuItems.length;
    setActiveMenuIndex(nextIndex, { playSoundOnChange: true, nudgeDirection: direction });
  };

  const hideMenuDescription = () => {
    window.clearTimeout(menuDescriptionTimeout);
    menuDescriptionPopup?.classList.remove("is-visible");
    menuDescriptionPopup?.setAttribute("aria-hidden", "true");
    activeDescriptionItem = null;
  };

  const positionMenuDescription = (clientX, clientY) => {
    if (!menuPanel || !menuDescriptionPopup) {
      return;
    }

    const panelBounds = menuPanel.getBoundingClientRect();
    const popupWidth = 168;
    const popupHeight = 168;
    const gap = 14;
    const preferredLeft = clientX - panelBounds.left + gap;
    const preferredTop = clientY - panelBounds.top + gap;
    const maxLeft = Math.max(0, panelBounds.width - popupWidth);
    const maxTop = Math.max(0, panelBounds.height - popupHeight);
    const left = preferredLeft <= maxLeft
      ? preferredLeft
      : Math.max(0, clientX - panelBounds.left - popupWidth - gap);
    const top = preferredTop <= maxTop
      ? preferredTop
      : Math.max(0, clientY - panelBounds.top - popupHeight - gap);

    menuDescriptionPopup.style.left = `${left}px`;
    menuDescriptionPopup.style.top = `${top}px`;
  };

  const showMenuDescription = (item, clientX, clientY) => {
    if (!menuPanel || !menuDescriptionPopup || !item) {
      return;
    }

    const description = item.dataset.menuDescription ?? "";
    if (!description) {
      hideMenuDescription();
      return;
    }

    activeDescriptionItem = item;
    menuDescriptionPopup.textContent = description;
    positionMenuDescription(clientX, clientY);
    menuDescriptionPopup.classList.add("is-visible");
    menuDescriptionPopup.setAttribute("aria-hidden", "false");
  };

  const queueMenuDescription = (item, clientX, clientY) => {
    if (!isMenuOpen) {
      return;
    }

    hideMenuDescription();
    menuDescriptionTimeout = window.setTimeout(() => {
      showMenuDescription(item, clientX, clientY);
    }, 200);
  };

  const typeCopyBlock = (element, onDone) => {
    const text = element.dataset.copyText ?? "";
    let index = 0;
    element.textContent = "";
    element.classList.add("is-typing");

    const getNextDelay = (character) => {
      if (character === " ") {
        return 0;
      }

      if (character === "." || character === "!" || character === "?") {
        return 38 + Math.random() * 28;
      }

      if (character === "," || character === ";" || character === ":") {
        return 24 + Math.random() * 18;
      }

      return 10 + Math.random() * 18;
    };

    const tick = () => {
      element.textContent = text.slice(0, index);
      index += 1;

      if (index <= text.length) {
        const nextDelay = getNextDelay(text[index - 1]);
        typingTimeout = window.setTimeout(tick, nextDelay);
        return;
      }

      element.classList.remove("is-typing");
      onDone?.();
    };

    tick();
  };

  const startAboutTyping = () => {
    const queue = [...aboutCopies];
    hasFinishedTyping = false;

    const runNext = () => {
      const next = queue.shift();
      if (!next) {
        hasFinishedTyping = true;
        syncMenuTriggerVisibility();
        return;
      }

      typeCopyBlock(next, runNext);
    };

    runNext();
  };

  const restoreAboutText = () => {
    window.clearTimeout(typingTimeout);
    aboutCopies.forEach((copy) => {
      copy.textContent = copy.dataset.copyText ?? "";
      copy.classList.remove("is-typing");
    });
    hasFinishedTyping = true;
  };

  const syncSelectionBounds = () => {
    if (!aboutSelection || !aboutText || !aboutInner) {
      return;
    }

    const textBounds = aboutText.getBoundingClientRect();
    const innerBounds = aboutInner.getBoundingClientRect();
    const top = textBounds.top - innerBounds.top + aboutInner.scrollTop;
    const left = textBounds.left - innerBounds.left + aboutInner.scrollLeft;

    aboutSelection.style.setProperty("--selection-top", `${top}px`);
    aboutSelection.style.setProperty("--selection-left", `${left}px`);
    aboutSelection.style.setProperty("--selection-width", `${textBounds.width}px`);
    aboutSelection.style.setProperty("--selection-height", `${textBounds.height}px`);
  };

  const animateDeleteToMenu = () => {
    if (!about || !aboutSelection || isTransitioningToMenu) {
      return;
    }

    isTransitioningToMenu = true;
    restoreAboutText();
    syncSelectionBounds();
    about.classList.remove("is-deleted");
    about.classList.add("is-selecting");

    window.setTimeout(() => {
      about.classList.remove("is-selecting");
      about.classList.add("is-deleted");
    }, 560);

    window.setTimeout(() => {
      isTransitioningToMenu = false;
      openMenu();
    }, 760);
  };

  const syncMenuTriggerVisibility = () => {
    if (!aboutInner || !menuTrigger) {
      return;
    }

    if (!hasFinishedTyping && !hasManualMenuRevealOverride) {
      menuTrigger.classList.remove("is-visible");
      menuTrigger.setAttribute("tabindex", "-1");
      menuTrigger.setAttribute("aria-hidden", "true");
      aboutSocialItems.forEach((item) => item.classList.remove("is-visible"));
      return;
    }

    const maxScroll = aboutInner.scrollHeight - aboutInner.clientHeight;
    const revealPoint = maxScroll <= 24
      ? 0
      : Math.min(72, maxScroll * 0.45);
    const shouldReveal = aboutInner.scrollTop >= revealPoint;
    menuTrigger.classList.toggle("is-visible", shouldReveal);
    menuTrigger.setAttribute("tabindex", shouldReveal && isAboutActive ? "0" : "-1");
    menuTrigger.setAttribute("aria-hidden", shouldReveal && isAboutActive ? "false" : "true");
    aboutSocialItems.forEach((item) => item.classList.toggle("is-visible", shouldReveal));
  };

  const openAbout = ({ skipTyping = false } = {}) => {
    if (isAboutActive) {
      return;
    }

    isAboutActive = true;
    hasManualMenuRevealOverride = false;
    hero.classList.add("is-about-active");
    landing?.setAttribute("aria-hidden", "true");
    about?.setAttribute("aria-hidden", "false");
    titleHint?.classList.remove("is-visible");
    if (skipTyping) {
      restoreAboutText();
      hasManualMenuRevealOverride = true;
      aboutInner?.scrollTo({ top: 0 });
      syncSelectionBounds();
      syncMenuTriggerVisibility();
      return;
    }

    startAboutTyping();
    window.setTimeout(() => {
      aboutInner?.scrollTo({ top: 0 });
      syncSelectionBounds();
      syncMenuTriggerVisibility();
    }, 140);
  };

  landing?.addEventListener("click", openAbout);
  window.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "`") {
      hasManualMenuRevealOverride = true;
      syncMenuTriggerVisibility();
      return;
    }

    handleMenuNavigation(event);
  });
  aboutInner?.addEventListener("scroll", () => {
    syncSelectionBounds();
    syncMenuTriggerVisibility();
  }, { passive: true });
  window.addEventListener("resize", syncSelectionBounds);
  menuTrigger?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
    }
  });
  menuTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!isAboutActive) {
      return;
    }
    animateDeleteToMenu();
  });
  menuItems.forEach((item) => {
    const itemIndex = menuItems.indexOf(item);

    item.addEventListener("pointerenter", (event) => {
      setActiveMenuIndex(itemIndex, { playSoundOnChange: true });
      queueMenuDescription(item, event.clientX, event.clientY);
    });
    item.addEventListener("pointermove", (event) => {
      setActiveMenuIndex(itemIndex, { playSoundOnChange: true });
      if (activeDescriptionItem === item && menuDescriptionPopup?.classList.contains("is-visible")) {
        positionMenuDescription(event.clientX, event.clientY);
      }
    });
    item.addEventListener("pointerleave", hideMenuDescription);
    item.addEventListener("click", () => {
      navigateToMenuItem(item);
    });
  });
  menuClose?.addEventListener("click", (event) => {
    event.stopPropagation();
    window.location.href = "./index.html";
  });

  if (initialView === "menu") {
    isMenuReturnMode = true;
    hero.classList.add("is-menu-return");
    landing?.setAttribute("aria-hidden", "true");
    about?.setAttribute("aria-hidden", "true");
    openMenu();
  }
}
