/* =========================================================
   MymusicalExplore — app.js
   Vanilla JS: fetches data/videos.json, builds mood filters,
   renders a fluid carousel, pulls live titles from YouTube's
   oEmbed endpoint, and plays videos in a modal.
   ========================================================= */
(() => {
  "use strict";

  const state = {
    videos: [],
    filtered: [],
    activeMood: "Semua",
    index: 0,
    autoplayMs: 6000,
    timer: null,
  };

  const els = {};

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    cacheEls();
    bindNav();
    bindModal();
    bindSubscribeForm();
    document.getElementById("year").textContent = new Date().getFullYear();

    try {
      const res = await fetch("data/videos.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Gagal memuat videos.json");
      const data = await res.json();
      state.videos = data.videos || [];
    } catch (err) {
      console.error(err);
      els.emptyState.hidden = false;
      els.emptyState.textContent = "Tidak bisa memuat data video. Periksa file data/videos.json.";
      return;
    }

    buildChips();
    applyFilter("Semua");
    enrichWithOEmbed();
    bindCarouselControls();
    bindSwipe();
    startAutoplay();
  }

  function cacheEls() {
    els.nav = document.getElementById("nav");
    els.navToggle = document.getElementById("navToggle");
    els.navMobile = document.getElementById("navMobile");

    els.chips = document.getElementById("moodChips");
    els.track = document.getElementById("carouselTrack");
    els.viewport = document.getElementById("carouselViewport");
    els.prevBtn = document.getElementById("prevBtn");
    els.nextBtn = document.getElementById("nextBtn");
    els.dots = document.getElementById("carouselDots");
    els.emptyState = document.getElementById("emptyState");

    els.modal = document.getElementById("videoModal");
    els.modalFrame = document.getElementById("modalFrame");
    els.modalClose = document.getElementById("modalClose");
    els.modalBackdrop = document.getElementById("modalBackdrop");

    els.subscribeForm = document.getElementById("subscribeForm");
    els.subscribeStatus = document.getElementById("subscribeStatus");
  }

  /* ---------------- Nav ---------------- */
  function bindNav() {
    els.navToggle.addEventListener("click", () => {
      const open = els.nav.classList.toggle("is-open");
      els.navToggle.setAttribute("aria-expanded", String(open));
    });
    els.navMobile.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        els.nav.classList.remove("is-open");
        els.navToggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------------- Mood chips ---------------- */
  function buildChips() {
    const moods = ["Semua", ...new Set(state.videos.map((v) => v.mood))];
    els.chips.innerHTML = moods
      .map(
        (m, i) =>
          `<button class="chip${i === 0 ? " is-active" : ""}" data-mood="${escapeAttr(m)}">${escapeHtml(m)}</button>`
      )
      .join("");

    els.chips.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      els.chips.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      applyFilter(btn.dataset.mood);
    });
  }

  function applyFilter(mood) {
    state.activeMood = mood;
    state.filtered = mood === "Semua" ? state.videos.slice() : state.videos.filter((v) => v.mood === mood);
    state.index = 0;
    renderSlides();
    stopAutoplay();
    startAutoplay();
  }

  /* ---------------- Carousel render ---------------- */
  function renderSlides() {
    if (!state.filtered.length) {
      els.track.innerHTML = "";
      els.dots.innerHTML = "";
      els.emptyState.hidden = false;
      return;
    }
    els.emptyState.hidden = true;

    els.track.innerHTML = state.filtered
      .map(
        (v, i) => `
      <li class="slide" data-index="${i}">
        <div class="slide__card">
          <button class="slide__thumb slide__play" data-open="${v.youtubeId}" aria-label="Putar video: ${escapeAttr(v.fallbackTitle)}">
            <img src="https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg" alt="Thumbnail video ${escapeAttr(v.fallbackTitle)}" loading="lazy" data-thumb="${v.youtubeId}">
            <span class="slide__mood accent-${v.accent}">${escapeHtml(v.mood)}</span>
            <span class="slide__play-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="#fff"/></svg>
            </span>
          </button>
          <div class="slide__body">
            <p class="slide__title" data-title="${v.youtubeId}">${escapeHtml(v.fallbackTitle)}</p>
            <p class="slide__channel" data-channel="${v.youtubeId}">${escapeHtml(v.fallbackChannel)}</p>
          </div>
        </div>
      </li>`
      )
      .join("");

    els.dots.innerHTML = state.filtered
      .map((_, i) => `<button class="dot${i === 0 ? " is-active" : ""}" data-goto="${i}" aria-label="Ke video ${i + 1}"></button>`)
      .join("");

    els.track.querySelectorAll("[data-open]").forEach((btn) => {
      btn.addEventListener("click", () => openModal(btn.dataset.open));
    });
    els.dots.querySelectorAll(".dot").forEach((dot) => {
      dot.addEventListener("click", () => goTo(Number(dot.dataset.goto)));
    });

    goTo(0, true);
  }

  function goTo(i, skipAnim) {
    if (!state.filtered.length) return;
    const max = state.filtered.length - 1;
    state.index = i < 0 ? max : i > max ? 0 : i;

    const slide = els.track.children[state.index];
    if (slide) {
      const offset = slide.offsetLeft;
      els.track.style.transition = skipAnim ? "none" : "";
      els.track.style.transform = `translateX(-${offset}px)`;
      if (skipAnim) requestAnimationFrame(() => (els.track.style.transition = ""));
    }

    els.dots.querySelectorAll(".dot").forEach((d, idx) => d.classList.toggle("is-active", idx === state.index));
  }

  function bindCarouselControls() {
    els.prevBtn.addEventListener("click", () => {
      goTo(state.index - 1);
      restartAutoplay();
    });
    els.nextBtn.addEventListener("click", () => {
      goTo(state.index + 1);
      restartAutoplay();
    });

    window.addEventListener("resize", debounce(() => goTo(state.index, true), 150));

    els.viewport.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { goTo(state.index - 1); restartAutoplay(); }
      if (e.key === "ArrowRight") { goTo(state.index + 1); restartAutoplay(); }
    });

    els.viewport.addEventListener("mouseenter", stopAutoplay);
    els.viewport.addEventListener("mouseleave", startAutoplay);
    els.viewport.setAttribute("tabindex", "0");
  }

  function bindSwipe() {
    let startX = 0, dx = 0, dragging = false;
    els.viewport.addEventListener("pointerdown", (e) => {
      dragging = true; startX = e.clientX; dx = 0;
      els.track.style.transition = "none";
    });
    els.viewport.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      els.track.style.transition = "";
      if (dx < -50) goTo(state.index + 1);
      else if (dx > 50) goTo(state.index - 1);
      else goTo(state.index);
      restartAutoplay();
    };
    els.viewport.addEventListener("pointerup", end);
    els.viewport.addEventListener("pointerleave", end);
  }

  function startAutoplay() {
    if (state.filtered.length < 2) return;
    stopAutoplay();
    state.timer = setInterval(() => goTo(state.index + 1), state.autoplayMs);
  }
  function stopAutoplay() {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  }
  function restartAutoplay() { stopAutoplay(); startAutoplay(); }

  /* ---------------- Live YouTube metadata ---------------- */
  async function enrichWithOEmbed() {
    const unique = [...new Map(state.videos.map((v) => [v.youtubeId, v])).values()];
    await Promise.all(
      unique.map(async (v) => {
        try {
          const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
            "https://www.youtube.com/watch?v=" + v.youtubeId
          )}&format=json`;
          const res = await fetch(url);
          if (!res.ok) return;
          const data = await res.json();
          v.fallbackTitle = data.title || v.fallbackTitle;
          v.fallbackChannel = data.author_name || v.fallbackChannel;

          document.querySelectorAll(`[data-title="${v.youtubeId}"]`).forEach((el) => (el.textContent = v.fallbackTitle));
          document.querySelectorAll(`[data-channel="${v.youtubeId}"]`).forEach((el) => (el.textContent = v.fallbackChannel));
          document.querySelectorAll(`[data-open="${v.youtubeId}"]`).forEach((el) => el.setAttribute("aria-label", "Putar video: " + v.fallbackTitle));
        } catch (err) {
          /* silently keep fallback text — offline-safe */
        }
      })
    );
  }

  /* ---------------- Modal player ---------------- */
  let lastFocused = null;

  function openModal(youtubeId) {
    lastFocused = document.activeElement;
    els.modalFrame.innerHTML = `<iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0" title="Pemutar YouTube" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    els.modal.hidden = false;
    stopAutoplay();
    document.body.style.overflow = "hidden";
    els.modalClose.focus();
  }
  function closeModal() {
    els.modal.hidden = true;
    els.modalFrame.innerHTML = "";
    document.body.style.overflow = "";
    startAutoplay();
    if (lastFocused) lastFocused.focus();
  }
  function bindModal() {
    els.modalClose.addEventListener("click", closeModal);
    els.modalBackdrop.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.modal.hidden) closeModal();
    });
  }

  /* ---------------- Subscribe (front-end only) ---------------- */
  function bindSubscribeForm() {
    els.subscribeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      els.subscribeStatus.textContent = "Terima kasih! (Demo — belum tersambung ke layanan email.)";
      els.subscribeForm.reset();
    });
  }

  /* ---------------- Utils ---------------- */
  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }
  function escapeHtml(str = "") {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(str = "") {
    return escapeHtml(str);
  }
})();
