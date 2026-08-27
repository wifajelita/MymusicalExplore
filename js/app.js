/* =========================================================================
   MymusicalExplore — app.js
   Fitur: load data.json, render carousel & genre grid, filter genre,
   modal player YouTube, oEmbed title fetch, favorit (localStorage),
   nav mobile, scroll reveal, back-to-top, newsletter (front-end only).
   ========================================================================= */

(function () {
  "use strict";

  const STORAGE_KEY = "mymusicalexplore:favorites";
  const state = {
    data: null,
    activeFilter: "all",
    visibleVideos: [],
    activeIndex: 0,
    favorites: loadFavorites(),
  };

  /* ---------------------------------------------------------------------
     Utilities
     --------------------------------------------------------------------- */
  function loadFavorites() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveFavorites() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.favorites));
    } catch (e) {
      /* localStorage unavailable — favorites just won't persist */
    }
  }

  function isFavorite(id) {
    return state.favorites.includes(id);
  }

  function toggleFavorite(id) {
    if (isFavorite(id)) {
      state.favorites = state.favorites.filter((v) => v !== id);
    } else {
      state.favorites.push(id);
    }
    saveFavorites();
    updateFavCount();
  }

  function updateFavCount() {
    const el = document.getElementById("favCount");
    if (el) el.textContent = state.favorites.length;
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  function genreById(id) {
    return state.data.genres.find((g) => g.id === id);
  }

  /* ---------------------------------------------------------------------
     Load data.json
     --------------------------------------------------------------------- */
  function loadData() {
    return fetch("js/data.json")
      .then((res) => res.json())
      .catch(() => {
        console.error("Gagal memuat data.json");
        return { site: {}, genres: [], videos: [] };
      });
  }

  /* ---------------------------------------------------------------------
     Render: filter pills
     --------------------------------------------------------------------- */
  function renderFilterPills() {
    const wrap = document.getElementById("filterPills");
    state.data.genres.forEach((g) => {
      const btn = document.createElement("button");
      btn.className = "pill";
      btn.dataset.filter = g.id;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", "false");
      btn.textContent = g.label;
      wrap.appendChild(btn);
    });

    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest(".pill");
      if (!btn) return;
      setActiveFilter(btn.dataset.filter);
    });
  }

  function setActiveFilter(filterId) {
    state.activeFilter = filterId;
    document.querySelectorAll("#filterPills .pill").forEach((p) => {
      const active = p.dataset.filter === filterId;
      p.classList.toggle("is-active", active);
      p.setAttribute("aria-selected", String(active));
    });
    applyFilter();
  }

  function applyFilter() {
    const cards = document.querySelectorAll(".video-card");
    cards.forEach((card) => {
      const match = state.activeFilter === "all" || card.dataset.genre === state.activeFilter;
      card.classList.toggle("is-fading", !match);
    });
    const firstMatch = Array.from(cards).find(
      (c) => state.activeFilter === "all" || c.dataset.genre === state.activeFilter
    );
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  /* ---------------------------------------------------------------------
     Render: video carousel cards
     --------------------------------------------------------------------- */
  function renderCarousel() {
    const track = document.getElementById("carouselTrack");
    const dotsWrap = document.getElementById("carouselDots");

    state.data.videos.forEach((video, i) => {
      const genre = genreById(video.genreId);
      const card = document.createElement("article");
      card.className = "video-card";
      card.dataset.genre = video.genreId;
      card.dataset.index = i;
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "Putar " + video.fallbackTitle);

      card.innerHTML = `
        <div class="video-thumb">
          <span class="card-genre-badge" style="background:${genre ? genre.accent + "55" : ""}">${genre ? genre.label : ""}</span>
          <button class="card-fav-btn" aria-label="Tandai favorit" data-fav-id="${video.youtubeId}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
          </button>
          <img src="https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg" alt="Thumbnail ${video.fallbackTitle}" loading="lazy">
          <button class="play-btn" aria-hidden="true" tabindex="-1">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>
        <div class="video-info">
          <span class="video-mood">${video.mood}</span>
          <h3 class="video-title" data-title-for="${video.youtubeId}">${video.fallbackTitle}</h3>
          <p class="video-author" data-author-for="${video.youtubeId}">${video.fallbackAuthor}</p>
          <p class="video-note">${video.note}</p>
        </div>
      `;

      card.addEventListener("click", (e) => {
        if (e.target.closest(".card-fav-btn")) return;
        openModal(video);
      });
      card.addEventListener("keypress", (e) => {
        if (e.key === "Enter") openModal(video);
      });

      track.appendChild(card);

      const dot = document.createElement("span");
      dot.className = "dot" + (i === 0 ? " is-active" : "");
      dotsWrap.appendChild(dot);
    });

    // Favorite buttons
    track.querySelectorAll(".card-fav-btn").forEach((btn) => {
      const id = btn.dataset.favId;
      btn.classList.toggle("is-active", isFavorite(id));
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(id);
        btn.classList.toggle("is-active", isFavorite(id));
        showToast(isFavorite(id) ? "Ditambahkan ke favorit ♥" : "Dihapus dari favorit");
      });
    });

    updateFavCount();
    fetchRealTitles();
    setupCarouselNav();
  }

  /* ---------------------------------------------------------------------
     Fetch real titles via YouTube oEmbed (progressive enhancement)
     --------------------------------------------------------------------- */
  function fetchRealTitles() {
    state.data.videos.forEach((video) => {
      const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${video.youtubeId}&format=json`;
      fetch(url)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((info) => {
          const titleEl = document.querySelector(`[data-title-for="${video.youtubeId}"]`);
          const authorEl = document.querySelector(`[data-author-for="${video.youtubeId}"]`);
          if (titleEl && info.title) titleEl.textContent = info.title;
          if (authorEl && info.author_name) authorEl.textContent = info.author_name;
          video.liveTitle = info.title;
          video.liveAuthor = info.author_name;
        })
        .catch(() => {
          /* keep fallback title/author already rendered */
        });
    });
  }

  /* ---------------------------------------------------------------------
     Carousel navigation (prev/next + dots + scroll sync)
     --------------------------------------------------------------------- */
  function setupCarouselNav() {
    const track = document.getElementById("carouselTrack");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const dots = Array.from(document.querySelectorAll("#carouselDots .dot"));

    function cardWidth() {
      const card = track.querySelector(".video-card");
      if (!card) return 320;
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || "24");
      return card.getBoundingClientRect().width + gap;
    }

    prevBtn.addEventListener("click", () => track.scrollBy({ left: -cardWidth(), behavior: "smooth" }));
    nextBtn.addEventListener("click", () => track.scrollBy({ left: cardWidth(), behavior: "smooth" }));

    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") track.scrollBy({ left: cardWidth(), behavior: "smooth" });
      if (e.key === "ArrowLeft") track.scrollBy({ left: -cardWidth(), behavior: "smooth" });
    });

    const cards = Array.from(track.querySelectorAll(".video-card"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Number(entry.target.dataset.index);
            dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
            prevBtn.disabled = idx === 0;
            nextBtn.disabled = idx === cards.length - 1;
          }
        });
      },
      { root: track, threshold: [0.6] }
    );
    cards.forEach((c) => observer.observe(c));

    dots.forEach((dot, i) => {
      dot.style.cursor = "pointer";
      dot.addEventListener("click", () => {
        cards[i].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
    });
  }

  /* ---------------------------------------------------------------------
     Render: genre explorer grid
     --------------------------------------------------------------------- */
  function renderGenreGrid() {
    const grid = document.getElementById("genreGrid");
    state.data.genres.forEach((g) => {
      const card = document.createElement("button");
      card.className = "genre-card";
      card.style.setProperty("--card-accent", g.accent);
      card.innerHTML = `
        <span class="genre-dot" style="background:${g.accent}"></span>
        <h3>${g.label}</h3>
        <p>${g.description}</p>
        <span class="genre-link">Lihat lagu →</span>
      `;
      card.addEventListener("click", () => {
        setActiveFilter(g.id);
        document.getElementById("gallery").scrollIntoView({ behavior: "smooth" });
      });
      grid.appendChild(card);
    });
  }

  /* ---------------------------------------------------------------------
     Modal player
     --------------------------------------------------------------------- */
  function openModal(video) {
    const backdrop = document.getElementById("modalBackdrop");
    const iframe = document.getElementById("modalIframe");
    const loading = document.getElementById("modalLoading");
    const title = document.getElementById("modalTitle");
    const author = document.getElementById("modalAuthor");
    const genreBadge = document.getElementById("modalGenreBadge");
    const genre = genreById(video.genreId);

    loading.classList.remove("is-hidden");
    title.textContent = video.liveTitle || video.fallbackTitle;
    author.textContent = video.liveAuthor || video.fallbackAuthor;
    genreBadge.textContent = (genre ? genre.label : "") + " · " + video.mood;

    let src = `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`;
    if (video.playlistId) src += `&list=${video.playlistId}`;
    iframe.src = src;

    iframe.onload = () => loading.classList.add("is-hidden");

    backdrop.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    const backdrop = document.getElementById("modalBackdrop");
    const iframe = document.getElementById("modalIframe");
    backdrop.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => {
      iframe.src = "";
    }, 300);
  }

  function setupModal() {
    document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
    document.getElementById("modalBackdrop").addEventListener("click", (e) => {
      if (e.target.id === "modalBackdrop") closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  /* ---------------------------------------------------------------------
     Favorites quick-view (header heart button)
     --------------------------------------------------------------------- */
  function setupFavToggle() {
    document.getElementById("favToggleBtn").addEventListener("click", () => {
      if (state.favorites.length === 0) {
        showToast("Belum ada lagu favorit — tandai dari kartu video ♥");
        return;
      }
      setActiveFilter("all");
      const track = document.getElementById("carouselTrack");
      const cards = Array.from(track.querySelectorAll(".video-card"));
      cards.forEach((c) => {
        const favBtn = c.querySelector(".card-fav-btn");
        const id = favBtn ? favBtn.dataset.favId : null;
        c.classList.toggle("is-fading", !(id && isFavorite(id)));
      });
      document.getElementById("gallery").scrollIntoView({ behavior: "smooth" });
      showToast(`Menampilkan ${state.favorites.length} lagu favorit`);
    });
  }

  /* ---------------------------------------------------------------------
     Header / nav behavior
     --------------------------------------------------------------------- */
  function setupHeader() {
    const header = document.getElementById("siteHeader");
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const hamburger = document.getElementById("hamburgerBtn");
    const nav = document.getElementById("mainNav");
    hamburger.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      hamburger.classList.toggle("is-open", open);
      hamburger.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        hamburger.classList.remove("is-open");
      });
    });

    // Active link highlight via IntersectionObserver
    const sections = ["hero", "gallery", "genres", "about", "newsletter"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const links = Array.from(document.querySelectorAll(".nav-link"));
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + entry.target.id));
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach((s) => navObserver.observe(s));
  }

  /* ---------------------------------------------------------------------
     Back to top
     --------------------------------------------------------------------- */
  function setupBackToTop() {
    const btn = document.getElementById("backToTopBtn");
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------------------------------------------------------------------
     Newsletter (front-end only demo)
     --------------------------------------------------------------------- */
  function setupNewsletter() {
    const form = document.getElementById("newsletterForm");
    const note = document.getElementById("newsletterNote");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("newsletterEmail").value.trim();
      if (!email) return;
      note.textContent = `Terima kasih! Kami akan mengabari ${email} soal lagu-lagu baru.`;
      form.reset();
      showToast("Berlangganan berhasil ♪");
    });
  }

  /* ---------------------------------------------------------------------
     Scroll reveal
     --------------------------------------------------------------------- */
  function setupReveal() {
    const items = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => observer.observe(el));
  }

  /* ---------------------------------------------------------------------
     Stat counters
     --------------------------------------------------------------------- */
  function setupStatCounters() {
    const nums = document.querySelectorAll(".stat-num");
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.dataset.count || "0");
          const suffix = el.dataset.suffix || "";
          const duration = 900;
          const start = performance.now();
          function tick(now) {
            const p = Math.min(1, (now - start) / duration);
            el.textContent = Math.round(p * target) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
          obs.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    nums.forEach((n) => observer.observe(n));
  }

  /* ---------------------------------------------------------------------
     Init
     --------------------------------------------------------------------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  loadData().then((data) => {
    state.data = data;
    renderFilterPills();
    renderCarousel();
    renderGenreGrid();
    setupModal();
    setupFavToggle();
    setupHeader();
    setupBackToTop();
    setupNewsletter();
    setupReveal();
    setupStatCounters();
  });
})();
