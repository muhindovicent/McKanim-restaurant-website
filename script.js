
const menuItems = [
  {
    id: 1,
    name: "McKanim Signature Burger",
    desc: "Double beef patty, melted cheddar, house golden sauce & caramelized onions.",
    price: 14.9,
    cat: "burgers",
    badge: "Bestseller",
    best: true,
    img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
  },
  {
    id: 2,
    name: "Original Recipe Bucket",
    desc: "8 pieces of our famous 12-spice crispy chicken, juicy to the bone.",
    price: 24.9,
    cat: "signature",
    badge: "Signature",
    img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80",
  },
  {
    id: 3,
    name: "Char-Grilled Ribeye",
    desc: "350g ribeye over open flame, rosemary butter & grilled vegetables.",
    price: 29.5,
    cat: "grills",
    badge: "Chef's Pick",
    img: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&q=80",
  },
  {
    id: 4,
    name: "Zesty Chicken Wrap",
    desc: "Crispy chicken strips, fresh slaw & smoky chili mayo in a warm tortilla.",
    price: 9.9,
    cat: "signature",
    badge: "Popular",
    img: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&q=80",
  },
  {
    id: 5,
    name: "Classic Beef Burger",
    desc: "A timeless favorite with juicy patty, lettuce, tomato & secret sauce.",
    price: 10.5,
    cat: "burgers",
    badge: "",
    img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=80",
  },
  {
    id: 6,
    name: "Grilled Lamb Chops",
    desc: "Tender lamb chops marinated in herbs, served with mint yogurt dip.",
    price: 26.0,
    cat: "grills",
    badge: "",
    img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80",
  },
  {
    id: 7,
    name: "Golden Seasoned Fries",
    desc: "Crispy double-fried fries dusted with our signature seasoning.",
    price: 4.5,
    cat: "sides",
    badge: "Popular",
    img: "https://images.unsplash.com/photo-1630384060421-cb20d0e06497?w=500&q=80",
  },
  {
    id: 8,
    name: "Smoky BBQ Wings",
    desc: "8 glazed wings with a sticky, smoky-sweet barbecue finish.",
    price: 11.9,
    cat: "sides",
    badge: "",
    img: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&q=80",
  },
  {
    id: 9,
    name: "Fresh Garden Salad",
    desc: "Crisp greens, cherry tomatoes, feta & citrus vinaigrette.",
    price: 7.5,
    cat: "sides",
    badge: "Healthy",
    img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80",
  },
  {
    id: 10,
    name: "Homemade Lemonade",
    desc: "Freshly squeezed lemons, mint & a hint of honey. Ice cold.",
    price: 3.9,
    cat: "drinks",
    badge: "Fresh",
    img: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500&q=80",
  },
  {
    id: 11,
    name: "Iced Caramel Latte",
    desc: "Rich espresso, silky milk & caramel drizzle over ice.",
    price: 4.9,
    cat: "drinks",
    badge: "",
    img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80",
  },
  {
    id: 12,
    name: "Molten Chocolate Lava",
    desc: "Warm chocolate cake with a gooey molten center & vanilla scoop.",
    price: 6.9,
    cat: "desserts",
    badge: "Must Try",
    img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&q=80",
  },
  {
    id: 13,
    name: "Vanilla Soft Serve",
    desc: "Silky, creamy hand-spun soft serve with your choice of topping.",
    price: 3.5,
    cat: "desserts",
    badge: "",
    img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80",
  },
  {
    id: 14,
    name: "Spicy McWrap Combo",
    desc: "Spicy wrap with golden fries and an ice-cold drink.",
    price: 13.5,
    cat: "signature",
    badge: "Value",
    img: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80",
  },
  {
    id: 15,
    name: "Portobello & Cheese Burger",
    desc: "Juicy patty topped with roasted portobello and melted swiss.",
    price: 12.9,
    cat: "burgers",
    badge: "New",
    img: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80",
  },
  {
    id: 16,
    name: "Mixed Grill Platter",
    desc: "A generous platter of chicken, beef & lamb with grilled sides.",
    price: 34.0,
    cat: "grills",
    badge: "For Sharing",
    img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80",
  },
];

const galleryImages = [
  { url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80", cap: "Char-Grilled Chops" },
  { url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80", cap: "Breakfast Plates" },
  { url: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80", cap: "Flame Grilled Steak" },
  { url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80", cap: "Fresh Salads" },
  { url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80", cap: "Signature Burgers" },
  { url: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=80", cap: "BBQ Favorites" },
  { url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80", cap: "Sweet Treats" },
  { url: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80", cap: "Crispy Chicken" },
];


let cart = [];
let currentFilter = "all";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function money(n) {
  return "$" + n.toFixed(2);
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
        <div class="menu-card-img" style="background-image:url('${m.img}')" role="img" aria-label="${m.name}">
          ${m.badge ? `<span class="menu-badge ${m.best ? "best" : ""}">${m.badge}</span>` : ""}
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
    btn.addEventListener("click", () => {
      $$("#menuFilters .filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
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
        <span class="cart-emoji">🍽️</span>
        <p>Your cart is empty.<br />Add something delicious from the menu!</p>
      </div>`;
    return;
  }

  items.innerHTML = cart
    .map(
      (c) => `
      <div class="cart-line">
        <div class="cart-line-img" style="background-image:url('${c.img}')"></div>
        <div class="cart-line-info">
          <h4>${c.name}</h4>
          <div class="price">${money(c.price)}</div>
          <div class="qty-control">
            <button data-minus="${c.id}" aria-label="Decrease quantity">−</button>
            <span>${c.qty}</span>
            <button data-plus="${c.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <button class="cart-line-remove" data-remove="${c.id}" aria-label="Remove ${c.name}">✕</button>
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
  $("#cartOverlay").classList.add("open");
  $("#cartDrawer").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  $("#cartOverlay").classList.remove("open");
  $("#cartDrawer").classList.remove("open");
  document.body.style.overflow = "";
}

function checkout() {
  if (cart.length === 0) {
    showToast("Your cart is empty — add something first", "warn");
    return;
  }

  const orderId = "MK-" + Date.now().toString().slice(-6);
  $("#modalOrderId").textContent = "Order reference: " + orderId;
  closeCart();
  $("#checkoutModal").classList.add("open");
  cart = [];
  updateCart();
}


function initReservation() {
  const form = $("#reserveForm");
  const fields = {
    resName: { test: (v) => v.trim().length >= 2, msg: "Please enter your name." },
    resEmail: {
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      msg: "Enter a valid email address.",
    },
    resDate: { test: (v) => !!v, msg: "Pick a date." },
    resTime: { test: (v) => !!v, msg: "Pick a time." },
  };

  const validateField = (id) => {
    const field = fields[id];
    const input = $("#" + id);
    const msgEl = document.querySelector(`.error-msg[data-for="${id}"]`);
    const valid = field.test(input.value);
    input.classList.toggle("error", !valid);
    msgEl.textContent = valid ? "" : field.msg;
    return valid;
  };

  Object.keys(fields).forEach((id) => {
    $("#" + id).addEventListener("input", () => validateField(id));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const allValid = Object.keys(fields).every(validateField);

    if (!allValid) {
      showToast("Please fix the highlighted fields", "warn");
      return;
    }

    const date = new Date($("#resDate").value + "T00:00:00");
    const prettyDate = date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const name = $("#resName").value.trim().split(" ")[0];
    const guests = $("#resGuests").value;

    showToast(
      `Table reserved for ${guests} guest${guests > 1 ? "s" : ""} on ${prettyDate} at ${$("#resTime").value}. See you soon, ${name}!`
    );
    form.reset();
  });
}

function initNav() {
  const navbar = $("#navbar");
  const hamburger = $("#hamburger");
  const navLinks = $("#navLinks");

  const onScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 40);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggleMenu = () => {
    const open = navLinks.classList.toggle("open");
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };

  hamburger.addEventListener("click", toggleMenu);

  navLinks.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navLinks.classList.remove("open");
      hamburger.classList.remove("open");
      document.body.style.overflow = "";
    })
  );

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
        navLinks.querySelectorAll(".nav-link").forEach((a) => a.classList.remove("active"));
        const link = navMap.get(entry.target.id);
        if (link) link.classList.add("active");
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
      <div class="gallery-item" data-cap="${g.cap}" style="animation-delay:${i * 40}ms">
        <img src="${g.url}" alt="${g.cap}" loading="lazy" />
      </div>`
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
  initReservation();
  initNav();
  initReveal();

  $("#cartBtn").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  $("#cartOverlay").addEventListener("click", closeCart);
  $("#checkoutBtn").addEventListener("click", checkout);
  $("#modalClose").addEventListener("click", () =>
    $("#checkoutModal").classList.remove("open")
  );
  $("#checkoutModal").addEventListener("click", (e) => {
    if (e.target === $("#checkoutModal"))
      $("#checkoutModal").classList.remove("open");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCart();
      $("#checkoutModal").classList.remove("open");
    }
  });

  updateCart();
});