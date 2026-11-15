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
  showToast(`${item.name} added to cart`);
}

function changeQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((c) => c.id !== id);
  }
  updateCart();
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  updateCart();
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

  function syncMenu() {
    if (!mobileViewport.matches) {
      closeMenu(false);
      navLinks.inert = false;
    } else if (!navLinks.classList.contains("open")) {
      navLinks.inert = true;
    }
  }

  hamburger.addEventListener("click", () => {
    if (navLinks.classList.contains("open")) {
      closeMenu(true);
    } else {
      navLinks.inert = false;
      navLinks.classList.add("open");
      hamburger.classList.add("open");
      hamburger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
      navLinks.querySelector("a")?.focus();
    }
  });

  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => closeMenu(false))
  );

  document.addEventListener("pointerdown", (e) => {
    if (mobileViewport.matches && navLinks.classList.contains("open")
      && !navbar.contains(e.target)) closeMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks.classList.contains("open")) closeMenu(true);
  });
  mobileViewport.addEventListener("change", syncMenu);
  syncMenu();

  // Scrollspy
  const sections = $$("section[id]");
  const navMap = new Map();
  navLinks.querySelectorAll("a").forEach((a) => {
    const id = a.getAttribute("href");
    if (id.startsWith("#")) navMap.set(id.slice(1), a);
  });

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.querySelectorAll(".nav-link").forEach((a) => { a.classList.remove("active"); a.removeAttribute("aria-current"); });
        const link = navMap.get(entry.target.id);
        if (link) { link.classList.add("active"); link.setAttribute("aria-current", "location"); }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((s) => spy.observe(s));
}


function initReveal() {
  const els = $$(".reveal");
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


function renderGallery() {
  $("#galleryGrid").innerHTML = galleryImages
    .map(
      (g, i) => `
      <figure class="gallery-item">
        <img src="${g.url}" alt="Illustrative food photo: ${g.cap}" width="600" height="450" loading="lazy" decoding="async" />
        <figcaption class="gallery-caption">${g.cap}</figcaption>
      </figure>`
    )
    .join("");
}


document.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = new Date().getFullYear();

  renderMenu();
  renderGallery();

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
});