(function () {
  "use strict";

  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const yearNodes = document.querySelectorAll("[data-year]");

  yearNodes.forEach(function (node) {
    node.textContent = String(new Date().getFullYear());
  });

  function setNav(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.querySelector(".nav-toggle__label").textContent = open ? "Fechar" : "Menu";
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(!nav.classList.contains("is-open"));
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNav(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setNav(false);
    });
  }

  const links = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
  const sections = links
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (link) {
            link.removeAttribute("aria-current");
          });
          const active = links.find(function (link) {
            return link.getAttribute("href") === "#" + entry.target.id;
          });
          if (active) active.setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-45% 0px -48% 0px", threshold: 0.01 }
    );
    sections.forEach(function (section) {
      spy.observe(section);
    });
  }

  if (header) {
    const onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      if (window.scrollY < 80) {
        links.forEach(function (link) {
          link.removeAttribute("aria-current");
        });
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const cards = Array.from(document.querySelectorAll("[data-kind]"));
  const filterStatus = document.querySelector("[data-filter-status]");
  const filterLabels = {
    todos: "Mostrando tudo.",
    set: "Mostrando sets publicados.",
    festa: "Mostrando destaques do Instagram.",
    circuito: "Mostrando o circuito da cena, sem data fechada."
  };

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const kind = button.dataset.filter;
      filterButtons.forEach(function (item) {
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      cards.forEach(function (card) {
        card.hidden = kind !== "todos" && card.dataset.kind !== kind;
      });
      if (filterStatus) filterStatus.textContent = filterLabels[kind] || "Filtro aplicado.";
    });
  });

  const counters = Array.from(document.querySelectorAll("[data-count]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function formatCount(value) {
    return new Intl.NumberFormat("pt-BR").format(value);
  }

  function runCount(node) {
    const target = Number(node.dataset.count);
    if (!Number.isFinite(target) || reduceMotion) {
      node.textContent = formatCount(target);
      return;
    }
    const start = performance.now();
    const duration = 900;
    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = formatCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (node) {
      counterObserver.observe(node);
    });
  } else {
    counters.forEach(runCount);
  }

  document.querySelectorAll("[data-print]").forEach(function (button) {
    button.addEventListener("click", function () {
      window.print();
    });
  });

  const copyButton = document.querySelector("[data-copy-email]");
  const copyStatus = document.querySelector("[data-copy-status]");
  const email = "Jootech.contato@gmail.com";

  if (copyButton) {
    copyButton.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(email);
        if (copyStatus) copyStatus.textContent = "E-mail copiado.";
      } catch (error) {
        if (copyStatus) copyStatus.textContent = email;
      }
    });
  }

  const form = document.getElementById("booking-form");
  const formError = document.querySelector("[data-form-error]");
  const formStatus = document.querySelector("[data-form-status]");

  function fieldOf(input) {
    return input.closest(".field");
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (formError) {
        formError.hidden = true;
        formError.textContent = "";
      }
      if (formStatus) formStatus.textContent = "";

      const honeypot = form.querySelector("#company");
      if (honeypot && honeypot.value.trim() !== "") {
        if (formStatus) formStatus.textContent = "Mensagem registrada.";
        form.reset();
        return;
      }

      let invalid = null;
      Array.from(form.elements).forEach(function (element) {
        if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
          return;
        }
        if (element.type === "hidden" || element.id === "company") return;
        const wrap = fieldOf(element);
        const failed = !element.checkValidity();
        if (wrap) wrap.classList.toggle("is-invalid", failed);
        if (failed && !invalid) invalid = element;
      });

      if (invalid) {
        if (formError) {
          formError.hidden = false;
          formError.textContent = "Revise os campos marcados antes de montar o e-mail.";
        }
        invalid.focus();
        return;
      }

      const data = new FormData(form);
      const subject = "Booking JooTech — " + data.get("festa");
      const body = [
        "Nome: " + data.get("nome"),
        "E-mail: " + data.get("email"),
        "Festa: " + data.get("festa"),
        "Cidade: " + data.get("cidade"),
        "Data: " + data.get("data"),
        "Estilo: " + data.get("estilo"),
        "",
        String(data.get("mensagem") || "")
      ].join("\n");

      const href =
        "mailto:" +
        email +
        "?subject=" +
        encodeURIComponent(subject) +
        "&body=" +
        encodeURIComponent(body);

      if (formStatus) {
        formStatus.replaceChildren();
        const note = document.createElement("span");
        note.textContent = "Mensagem pronta. ";
        const link = document.createElement("a");
        link.href = href;
        link.textContent = "Abrir no programa de e-mail";
        formStatus.append(note, link);
      }
    });

    form.addEventListener("input", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const wrap = target.closest(".field");
      if (wrap && "checkValidity" in target && target.checkValidity()) {
        wrap.classList.remove("is-invalid");
      }
    });
  }

  const canvas = document.getElementById("wave");
  if (!(canvas instanceof HTMLCanvasElement) || reduceMotion) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  let frame = 0;
  let width = 0;
  let height = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.floor(width * ratio));
    canvas.height = Math.max(1, Math.floor(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    frame += 1;
    context.clearRect(0, 0, width, height);
    const lines = [
      { color: "rgba(141, 123, 255, 0.85)", amp: height * 0.16, freq: 0.008, speed: 0.018 },
      { color: "rgba(226, 255, 87, 0.55)", amp: height * 0.08, freq: 0.014, speed: 0.027 },
      { color: "rgba(244, 241, 234, 0.28)", amp: height * 0.12, freq: 0.006, speed: 0.012 }
    ];

    lines.forEach(function (line, index) {
      context.beginPath();
      for (let x = 0; x <= width; x += 4) {
        const y =
          height * 0.55 +
          Math.sin(x * line.freq + frame * line.speed + index) * line.amp +
          Math.sin(x * line.freq * 0.35 + frame * 0.01) * (line.amp * 0.25);
        if (x === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.strokeStyle = line.color;
      context.lineWidth = index === 0 ? 1.6 : 1;
      context.stroke();
    });

    if (!document.hidden) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) requestAnimationFrame(draw);
  });
  requestAnimationFrame(draw);
})();
