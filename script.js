const siteContent = window.McKanimContent;
if (!siteContent || !Array.isArray(siteContent.menuItems) || !Array.isArray(siteContent.galleryImages)) {
  throw new Error("McKanim content is missing. Load content/site-content.js before script.js.");
}
const { restaurant, menuItems, galleryImages } = siteContent;
if (restaurant.currency !== "UGX") throw new Error("Unsupported restaurant currency.");
const validCategories = new Set(["signature", "burgers", "grills", "sides", "drinks", "desserts"]);
const seenMenuIds = new Set();
for (const item of menuItems) {
  if (!Number.isSafeInteger(item.id) || seenMenuIds.has(item.id) ||
      !Number.isSafeInteger(item.price) || item.price <= 0 ||
      !validCategories.has(item.cat) ||
      !item.name || !item.desc || !item.img) {
    throw new Error("Invalid McKanim menu data: item IDs, prices, categories, and copy must be valid.");
  }
  seenMenuIds.add(item.id);
}

// This is a static concept, not a real order-taking application.
if (restaurant.mode !== "concept-preview" || restaurant.approvals.onlineOrdering || restaurant.approvals.reservations) {
  throw new Error("Real orders and reservations cannot be enabled without a tested backend.");
}

let cart = [];
try {
  const stored = JSON.parse(sessionStorage.getItem("mckanim-preview-cart") || "[]");
  if (Array.isArray(stored)) {
    cart = stored.flatMap(row => {
      const item = menuItems.find(m => m.id === row.id);
      return item && Number.isSafeInteger(row.qty) && row.qty > 0 && row.qty <= 99
        ? [{ ...item, qty: row.qty }] : [];
    });
  }
} catch { cart = []; }
function saveCart() {
  try { sessionStorage.setItem("mckanim-preview-cart", JSON.stringify(cart.map(({ id, qty }) => ({ id, qty })))); }
  catch { /* Browsers can disable storage; current-page cart still works. */ }
}
let currentFilter = "all";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// All prototype prices are integer Uganda shillings, not USD conversions.
const ugxFormatter = new Intl.NumberFormat("en-UG", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  useGrouping: true,
});

function money(amountUGX) {
  return `UGX ${ugxFormatter.format(amountUGX)}`;
}

function showToast(msg, type = "ok") {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("ok", "warn");
  t.classList.add("show", type);
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 2600);
}


function renderMenu() {
  const grid = $("#menuGrid");
  if (!grid) return;
  const list =
    currentFilter === "all"
      ? menuItems
      : menuItems.filter((m) => m.cat === currentFilter);

  if (list.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#8a8a8a;padding:40px 0;">No dishes in this category yet.</p>`;
    return;
  }

  grid.innerHTML = list
    .map(
      (m) => `
      <article class="menu-card" data-id="${m.id}">
        <div class="menu-card-img">
          <img src="${m.img}" alt="Illustrative food photography: ${m.name}" width="650" height="500" loading="lazy" decoding="async" />
        </div>
        <div class="menu-card-body">
          <h3>${m.name}</h3>
          <p>${m.desc}</p>
          <div class="menu-card-bottom">
            <span class="menu-price">${money(m.price)}</span>
            <button class="add-btn" data-add="${m.id}" aria-label="Add ${m.name} to cart">+</button>
          </div>
        </div>
      </article>`
    )
    .join("");
}

function initFilters() {
  $$("#menuFilters .filter-btn").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.classList.contains("active")));
    btn.addEventListener("click", () => {
      $$("#menuFilters .filter-btn").forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      currentFilter = btn.dataset.filter;
      renderMenu();
    });
  });
}

function bindAddButtons() {
  const grid = $("#menuGrid");
  if (!grid) return;
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const id = Number(btn.dataset.add);
    const item = menuItems.find((m) => m.id === id);
    if (!item) return;
    addToCart(item);
    btn.classList.add("added");
    setTimeout(() => btn.classList.remove("added"), 400);
  });
}


function addToCart(item) {
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  updateCart();
  saveCart();
  showToast(`${item.name} added to your preview selection`);
}

function changeQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((c) => c.id !== id);
  }
  updateCart();
  saveCart();
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  updateCart();
  saveCart();
  showToast("Item removed", "warn");
}

function updateCart() {
  const count = cart.reduce((sum, c) => sum + c.qty, 0);
  const countEl = $("#cartCount");
  countEl.textContent = count;
  countEl.classList.toggle("empty", count === 0);

  const items = $("#cartItems");
  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  $("#cartSubtotal").textContent = money(subtotal);

  if (cart.length === 0) {
    items.innerHTML = `
      <div class="cart-empty">
        <p>Your cart is empty.<br />Add something delicious from the menu!</p>
      </div>`;
    return;
  }

  items.innerHTML = cart
    .map(
      (c) => `
      <div class="cart-line">
        <img class="cart-line-img" src="${c.img}" alt="" width="64" height="64" loading="lazy" decoding="async" />
        <div class="cart-line-info">
          <h4>${c.name}</h4>
          <div class="price">${money(c.price)}</div>
          <div class="qty-control">
            <button data-minus="${c.id}" aria-label="Decrease quantity">−</button>
            <span>${c.qty}</span>
            <button data-plus="${c.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="cart-line-remove" data-remove="${c.id}" aria-label="Remove ${c.name}">&times;</button>
      </div>`
    )
    .join("");
}

function bindCartEvents() {
  $("#cartItems").addEventListener("click", (e) => {
    const minus = e.target.closest("[data-minus]");
    const plus = e.target.closest("[data-plus]");
    const remove = e.target.closest("[data-remove]");
    if (minus) changeQty(Number(minus.dataset.minus), -1);
    if (plus) changeQty(Number(plus.dataset.plus), 1);
    if (remove) removeFromCart(Number(remove.dataset.remove));
  });
}

function openCart() {
  const drawer = $("#cartDrawer");
  if (drawer.classList.contains("open")) return;
  drawer.inert = false;
  $("#cartOverlay").classList.add("open");
  drawer.classList.add("open");
  document.body.style.overflow = "hidden";
  $("#cartClose").focus();
  requestAnimationFrame(() => { if (drawer.classList.contains("open")) $("#cartClose").focus(); });
}

function closeCart() {
  const drawer = $("#cartDrawer");
  const wasOpen = drawer.classList.contains("open");
  $("#cartOverlay").classList.remove("open");
  drawer.classList.remove("open");
  drawer.inert = true;
  document.body.style.overflow = "";
  if (wasOpen) $("#cartBtn").focus();
}

function checkout() {
  if (cart.length === 0) {
    showToast("Your menu preview is empty — add something first", "warn");
    return;
  }
  closeCart();
  const dialog = $("#checkoutModal");
  if (!dialog.open) dialog.showModal();
}

function closeCheckoutModal() {
  const dialog = $("#checkoutModal");
  if (dialog.open) dialog.close();
}

function initNav() {
  const navbar = $("#navbar");
  const hamburger = $("#hamburger");
  const navLinks = $("#navLinks");
  const mobileViewport = window.matchMedia("(max-width: 900px)");
  navLinks.inert = mobileViewport.matches;
  const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu(restoreFocus = false) {
    const wasOpen = navLinks.classList.contains("open");
    navLinks.classList.remove("open");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    navLinks.inert = mobileViewport.matches;
    document.body.style.overflow = "";
    if (restoreFocus && wasOpen) hamburger.focus();
  }

  hamburger.addEventListener("click", () => {
    if (navLinks.classList.contains("open")) closeMenu(true);
    else {
      navLinks.inert = false;
      navLinks.classList.add("open");
      hamburger.classList.add("open");
      hamburger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      navLinks.querySelector("a")?.focus();
    }
  });
  mobileViewport.addEventListener("change", () => {
    if (!mobileViewport.matches) {
      closeMenu(false);
      navLinks.inert = false;
    } else if (!navLinks.classList.contains("open")) {
      navLinks.inert = true;
    }
  });
  document.addEventListener("pointerdown", event => {
    if (mobileViewport.matches && navLinks.classList.contains("open") && !navbar.contains(event.target))
      closeMenu(false);
  });

  // Each navigation item opens a real HTML document. Native browser history,
  // reloads and direct links work without JavaScript or scrollspy.
  navLinks.querySelectorAll('a[aria-current="page"]').forEach(a => a.classList.add("active"));

}


function initReveal() {
  const els = $$(".reveal");
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    els.forEach(el => el.classList.add("visible"));
    return;
  }
  document.documentElement.classList.add("motion-ready");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => observer.observe(el));
}


function galleryImageAtWidth(src, width) {
  const image = new URL(src);
  if (image.hostname !== "images.unsplash.com") return src;
  image.searchParams.set("w", String(width));
  image.searchParams.set("q", "78");
  image.searchParams.set("auto", "format");
  return image.toString();
}
function renderGallery() {
  const grid = $("#galleryGrid");
  if (!grid) return;
  grid.innerHTML = galleryImages.map((g, i) => `
    <figure class="gallery-item">
      <button type="button" class="gallery-press" data-gallery-index="${i}" aria-label="View ${g.cap} full screen">
        <img src="${g.url}" alt="Illustrative photograph: ${g.cap}" width="600" height="450" loading="lazy" decoding="async" />
      </button>
      <figcaption class="gallery-caption">${g.cap}</figcaption>
    </figure>`).join("");
}

let activeGalleryIndex = 0;
let lastGalleryTrigger = null;
function galleryFullsize(image) {
  const link = new URL(image.url);
  if (link.hostname === "images.unsplash.com") {
    link.searchParams.set("w", "1400");
    link.searchParams.set("q", "84");
    link.searchParams.set("auto", "format");
  }
  return link.href;
}
function updateLightbox() {
  const image = galleryImages[activeGalleryIndex];
  $("#lightboxImage").src = galleryFullsize(image);
  $("#lightboxImage").alt = "Illustrative photograph: " + image.cap;
  $("#lightboxCaption").textContent = image.cap;
  $("#lightboxPosition").textContent = (activeGalleryIndex + 1) + " / " + galleryImages.length;
}
function initGalleryLightbox() {
  const grid = $("#galleryGrid");
  const dialog = $("#galleryLightbox");
  if (!grid || !dialog) return;
  const move = delta => {
    activeGalleryIndex = (activeGalleryIndex + delta + galleryImages.length) % galleryImages.length;
    updateLightbox();
  };
  grid.addEventListener("click", event => {
    const trigger = event.target.closest("[data-gallery-index]");
    if (!trigger) return;
    activeGalleryIndex = Number(trigger.dataset.galleryIndex);
    if (!Number.isInteger(activeGalleryIndex) || activeGalleryIndex < 0 || activeGalleryIndex >= galleryImages.length) return;
    lastGalleryTrigger = trigger;
    updateLightbox();
    dialog.showModal();
    $("#lightboxClose").focus();
  });
  $("#lightboxClose").addEventListener("click", () => dialog.close());
  $("#lightboxNext").addEventListener("click", () => move(1));
  $("#lightboxPrevious").addEventListener("click", () => move(-1));
  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
  });
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    $("#lightboxImage").removeAttribute("src");
    lastGalleryTrigger?.focus();
  });
}

let cinemaStarted = false;
let cinemaManuallyPaused = false;

function pauseCinematicVideo() {
  const video = $("#heroCinemaVideo");
  if (video && !video.paused) video.pause();
}

function resumeCinematicVideo() {
  const video = $("#heroCinemaVideo");
  if (!video || !cinemaStarted || cinemaManuallyPaused || document.hidden) return;
  void video.play().catch(() => pauseCinematicVideo());
}

function initCinema() {
  const video = $("#heroCinemaVideo");
  const toggle = $("#heroMotionToggle");
  if (!video || !toggle) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (prefersReducedMotion.matches || connection?.saveData) return;

  video.muted = true;
  video.playsInline = true;
  video.src = video.dataset.src;
  cinemaStarted = true;

  video.addEventListener("playing", () => {
    $("#home")?.classList.add("is-film-playing");
    toggle.hidden = false;
    toggle.textContent = "Pause film";
    toggle.setAttribute("aria-pressed", "true");
  });

  video.addEventListener("error", () => {
    toggle.hidden = true;
    $("#home")?.classList.remove("is-film-playing");
  });

  toggle.addEventListener("click", () => {
    if (!video.paused) {
      cinemaManuallyPaused = true;
      pauseCinematicVideo();
      toggle.textContent = "Play film";
      toggle.setAttribute("aria-pressed", "false");
    } else {
      cinemaManuallyPaused = false;
      toggle.textContent = "Pause film";
      toggle.setAttribute("aria-pressed", "true");
      resumeCinematicVideo();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseCinematicVideo();
    else resumeCinematicVideo();
  });

  void video.play().catch(() => {
    toggle.hidden = true;
  });
}

function initReservationForm() {
  const form = $("#reservationForm");
  if (!form) return;
  const date = $("#visitDate");
  const now = new Date();
  const localISODate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2,"0"), String(now.getDate()).padStart(2,"0")].join("-");
  date.min = localISODate;
  const fields = [...form.querySelectorAll("input, select")];
  function validate(field) {
    const message = field.validity.valid ? "" : field.validationMessage;
    if (message) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
    const error = $("#" + field.id + "Error");
    if (error) error.textContent = message;
    return !message;
  }
  fields.forEach(field => {
    field.addEventListener("input", () => { if (field.hasAttribute("aria-invalid")) validate(field); });
    field.addEventListener("change", () => { if (field.hasAttribute("aria-invalid")) validate(field); });
  });
  form.addEventListener("submit", event => {
    event.preventDefault();
    const invalid = fields.filter(field => !validate(field));
    const status = $("#reservationStatus");
    if (invalid.length) {
      status.textContent = "Please correct the highlighted details. No booking request has been sent.";
      status.className = "form-status warn";
      invalid[0].focus();
      return;
    }
    status.textContent = "Your details look complete, but this was a local preview check. No reservation was sent or confirmed.";
    status.className = "form-status ok";
  });
}
document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();

  renderMenu();
  renderGallery();
  initReveal();

  initLightbox();
  initCinema();
  initFilters();
  bindAddButtons();
  bindCartEvents();
  initNav();

  $("#cartBtn").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  $("#cartOverlay").addEventListener("click", closeCart);
  $("#checkoutBtn").addEventListener("click", checkout);
  $("#modalClose").addEventListener("click", closeCheckoutModal);
  $("#checkoutModal").addEventListener("close", () => $("#cartBtn").focus());

  document.addEventListener("keydown", (e) => {
    const drawer = $("#cartDrawer");
    if (e.key === "Escape" && drawer.classList.contains("open")) closeCart();
    if (e.key === "Tab" && drawer.classList.contains("open")) {
      const focusables = [...drawer.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
      if (focusables.length === 0) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  updateCart();
  initGalleryLightbox();
  initReservationForm();
});