(function () {
  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function slugify(text) {
    const base = String(text || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\u4e00-\u9fa5a-z0-9\-]/g, "");
    return base || "section";
  }

  function ensureId(el, used) {
    const raw = el.getAttribute("id") || slugify(el.textContent || "");
    let id = raw;
    let i = 2;
    while (used.has(id)) {
      id = raw + "-" + i;
      i += 1;
    }
    el.setAttribute("id", id);
    used.add(id);
    return id;
  }

  function createToast() {
    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
    let timer = null;
    return function toast(msg, ms) {
      el.textContent = msg;
      el.classList.add("is-show");
      if (timer) clearTimeout(timer);
      timer = setTimeout(
        function () {
          el.classList.remove("is-show");
        },
        clamp(ms || 1400, 600, 4000),
      );
    };
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {
      // fallthrough
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (_) {
      return false;
    }
  }

  function scrollToHash(hash) {
    const id = (hash || "").replace(/^#/, "");
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buildToc(docEl, tocEl, toast) {
    if (!docEl || !tocEl) return { headings: [] };
    const used = new Set();
    const headings = Array.from(docEl.querySelectorAll("h2, h3"));
    headings.forEach(function (h) {
      ensureId(h, used);
      // Make heading clickable for copying deep link
      if (!h.querySelector(".h-anchor")) {
        const span = document.createElement("span");
        span.className = "h-anchor";
        span.innerHTML =
          '<svg class="h-anchor__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 13a5 5 0 007.07 0l1.41-1.41a5 5 0 00-7.07-7.07L10 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M14 11a5 5 0 01-7.07 0L5.52 9.59a5 5 0 017.07-7.07L14 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
        span.appendChild(document.createTextNode(h.textContent || ""));
        h.textContent = "";
        h.appendChild(span);
        span.addEventListener("click", async function () {
          const url = new URL(window.location.href);
          url.hash = "#" + h.id;
          const ok = await copyText(url.toString());
          if (ok) toast("已复制段落链接");
          else toast("复制失败，请手动复制地址栏链接");
          history.replaceState(null, "", url.toString());
        });
      }
    });

    const frag = document.createDocumentFragment();
    const links = [];
    headings.forEach(function (h, idx) {
      const a = document.createElement("a");
      a.className = "toc__a";
      a.href = "#" + h.id;
      a.setAttribute("data-target", h.id);
      const lvl = h.tagName === "H2" ? "H2" : "H3";
      const label = (h.textContent || "").trim();
      a.innerHTML = '<span class="toc__lvl">' + lvl + "</span><span>" + escapeHtml(label) + "</span>";
      a.addEventListener("click", function (e) {
        e.preventDefault();
        history.replaceState(null, "", a.href);
        scrollToHash(a.hash);
      });
      frag.appendChild(a);
      links.push(a);
      if (idx === headings.length - 1) {
        // no-op
      }
    });
    tocEl.innerHTML = "";
    tocEl.appendChild(frag);

    return { headings: headings, links: links };
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function activeSpy(headings, links) {
    if (!headings.length || !links.length) return function () {};
    const map = new Map();
    links.forEach(function (a) {
      map.set(a.getAttribute("data-target"), a);
    });

    const io = new IntersectionObserver(
      function (entries) {
        // pick the most visible heading near top
        const visibles = entries
          .filter(function (e) {
            return e.isIntersecting;
          })
          .sort(function (a, b) {
            return (b.intersectionRatio || 0) - (a.intersectionRatio || 0);
          });
        if (!visibles.length) return;
        const id = visibles[0].target && visibles[0].target.id;
        if (!id) return;
        links.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("data-target") === id);
        });
      },
      {
        root: null,
        threshold: [0.08, 0.18, 0.28, 0.38],
        rootMargin: "-20% 0px -70% 0px",
      },
    );

    headings.forEach(function (h) {
      io.observe(h);
    });

    return function cleanup() {
      io.disconnect();
    };
  }

  function setupBackTop(backTopEl) {
    if (!backTopEl) return;
    function onScroll() {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      backTopEl.classList.toggle("is-show", y > 280);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    backTopEl.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function setupCopyPageLink(copyPageLinkEl, toast) {
    if (!copyPageLinkEl) return;
    copyPageLinkEl.addEventListener("click", async function () {
      const ok = await copyText(window.location.href);
      if (ok) toast("已复制页面链接");
      else toast("复制失败，请手动复制地址栏链接");
    });
  }

  function setupBack(backBtnEl, fallbackBackUrl) {
    if (!backBtnEl) return;
    backBtnEl.addEventListener("click", function () {
      // Prefer browser/webview history
      if (window.history && window.history.length > 1) {
        window.history.back();
        return;
      }
      if (fallbackBackUrl) {
        window.location.href = fallbackBackUrl;
        return;
      }
    });
  }

  function init(opts) {
    const toast = createToast();
    const tocEl = opts && opts.tocEl;
    const docEl = opts && opts.docEl;
    const backTopEl = opts && opts.backTopEl;
    const copyPageLinkEl = opts && opts.copyPageLinkEl;
    const backBtnEl = opts && opts.backBtnEl;
    const fallbackBackUrl = (opts && opts.fallbackBackUrl) || "";

    const toc = buildToc(docEl, tocEl, toast);
    const cleanupSpy = activeSpy(toc.headings || [], toc.links || []);
    setupBackTop(backTopEl);
    setupCopyPageLink(copyPageLinkEl, toast);
    setupBack(backBtnEl, fallbackBackUrl);

    // initial hash scroll (after layout)
    setTimeout(function () {
      if (window.location.hash) scrollToHash(window.location.hash);
    }, 0);

    return function destroy() {
      cleanupSpy && cleanupSpy();
    };
  }

  window.H5Doc = { init: init };
})();

