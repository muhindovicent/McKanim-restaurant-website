# Mckanim Restaurant — Design Specification

**Role:** Senior UI/UX Designer & Front-end Architect
**Project:** Mckanim Restaurant website
**Aesthetic:** "Warm Heritage"
**Status:** v1.0 — spec + working static prototype (HTML/CSS/JS, no frameworks)
**Last updated:** 2026

> **Placeholder warning.** The prototype and this spec contain *invented sample
> content* (address, phone, hours, prices, story, reviews, stats). Every fact
> marked **[VERIFY]** must be confirmed with the owner before launch. This
> document does not assert any unverified real-world fact about the restaurant.

---

## 1. Research Brief

### 1.1 What a visitor needs in the first 10 seconds

Success = a first-time visitor can answer, without scrolling or tapping more
than needed: *"What is this place, is it any good, and how do I eat here?"*

Ranked by likely use **on a phone** (thumb-first, often on mobile data, often
in-transit or hungry at night):

| Rank | Need | Why it ranks here | Confidence |
|---|---|---|---|
| 1 | **Menu + prices** | The single biggest "is this for me?" decision. Food photos + price = appetite + trust. | High |
| 2 | **How to order / book** | The conversion. Tapping to order or reserve must be obvious within one glance. | High |
| 3 | **Hours (open now?)** | Determines whether they act *today*. "Closed" = bounce. | High |
| 4 | **Location / directions** | Needed before visiting; also "can I reach it / is it near me?" | Medium-High |
| 5 | **Phone** | Tap-to-call is the fallback for large parties, questions, takeaway. | Medium |
| 6 | **Delivery / pickup options** | Only matters if offered. **[VERIFY]** | Medium |
| 7 | **Reviews / social proof** | Reduces risk for a first-timer ("is it good?"). | Medium |

**10-second hierarchy on the hero:** Brand name → one appetite line → primary
CTA (Order/Reserve) → secondary CTA → open-hours + location strip. Nothing else
in the first viewport on mobile.

### 1.2 Assumptions (labelled by confidence)

| # | Assumption | Confidence | Consequence if wrong |
|---|---|---|---|
| A1 | Visitors are mostly mobile, local, decision-in-the-moment | **High** | If desktop-dominant, rebalance hero to two-column emphasis |
| A2 | A physical dine-in restaurant exists | **High** | If virtual/cloud kitchen only, drop Reservations & Visit page |
| A3 | The site should drive bookings + direct orders (not just be a brochure) | **Medium** | If brochure-only, remove cart and use "call to order" |
| A4 | Menu changes seasonally, not daily | **Medium** | If daily specials, need a "today's specials" mechanism |
| A5 | Owner can supply real food photography | **Medium** | If not, budget for a paid shoot; emoji/stock reads cheap |
| A6 | Takeaway / delivery is offered | **Low** | Remove delivery strip line and Order page if not |
| A7 | Online payment can be handled (or is via a third party) | **Low** | If cash/no-online, checkout becomes "call to confirm" |
| A8 | English is the primary language | **Medium** | Add language toggle if not |
| A9 | Party size rarely exceeds 5 (hence "5+ call us") | **Medium** | If large-group bookings common, add a private-dining flow |
| A10 | One location, one phone number | **Medium** | Multiple locations need a location picker in nav |

### 1.3 Must be verified with the owner (open questions)

Concierge/owner conversation checklist — **do not invent any of these**:

1. **Opening hours** — per weekday, holiday hours, last kitchen order time, closed days. (Prototype says *Daily 11:00 AM–11:00 PM* **[VERIFY]**.)
2. **Price range / actual prices** — all prototype prices are placeholders **[VERIFY]**.
3. **Delivery / pickup** — offered? own drivers, app, or third-party (Uber Eats, etc.)? fees, minimum, radius, delivery hours?
4. **Payment methods** — cards, cash, mobile wallets, split bills, deposits for large parties?
5. **Signature dishes** — which are genuinely the must-try items? (Used for hero + "Chef's Pick" tags.)
6. **Reservations policy** — walk-ins? hold time? deposit for large parties? max party size? online booking tool or form-to-WhatsApp?
7. **Dietary info** — allergens, vegan/vegetarian/gluten-free/halal options and kitchen handling.
8. **Address, phone, email, socials** — exact, and whether phone is WhatsApp-enabled.
9. **Real photography** — quantity, resolution, rights. Who owns the shoot?
10. **Brand assets** — logo, exact spelling (McKanim vs Mckanim), colours, cuisine descriptor, established year.
11. **Cuisine descriptor** — this brief says "casual-fine dining"; confirm. It affects imagery and tone.
12. **Legal** — privacy notice (forms collect personal data), cookie policy, terms.

### 1.4 Positioning note

The menu prototype spans burgers, grills, fried chicken, salads, drinks and
desserts. That reads as **casual dining / grill house**, not white-tablecloth
fine dining. Recommendation: position as *"A warm neighbourhood grill house
with the attention to detail of a fine kitchen."* **[VERIFY cuisine with owner.]**

---

## 2. Structure (System Design)

### 2.1 Site map

```
Home  (#home)
├── Menu  (#menu)            full menu, category tabs, dish cards, add-to-order
├── Reservations  (#reserve) booking form + hours + contact
├── Order  (cart drawer)     overlay from anywhere — no separate page (v1)
├── Gallery  (#gallery)      photography grid
├── Our Story  (#about)      founder, craft, provenance
└── Visit / Contact  (#contact) address, map, phone, socials
Footer — quick links, contact, hours, legal
```

**v1 is a single-page site** with anchored sections + an order drawer. Rationale:
fewest taps, fastest load, no routing. **When it grows** (see 2.4), split to
`/menu`, `/reservations`, `/visit` as real pages.

### 2.2 Primary user flows (max 3 steps each)

**(a) Find the menu — 1–2 steps**
`Land → scroll/tap "Menu" → read categories & prices.`
Optional 3rd: tap a category tab to filter.

**(b) Reserve a table — 3 steps**
`Tap "Reserve a table" (sticky/hero) → fill name, phone, date, time, party, notes → Submit → confirmation.`

**(c) Order or call — 3 steps**
`Tap "Order" → add dishes to cart → open cart → Checkout/confirm.`
Fallback: `Tap phone number → call.`

**(d) Find directions — 2 steps**
`Tap "Visit" → tap "Get directions" (opens native maps).`

Every flow must be reachable **within one tap from the sticky mobile bar**.

### 2.3 Data models

**Menu item**
```
Dish {
  id:          string      // stable slug, e.g. "signature-burger"
  category:    enum        // signature | burgers | grills | sides | drinks | desserts
  name:        string      // "McKanim Signature Burger"
  description: string      // one appetite line, ~90 chars ideal
  price:       number      // store in minor units (cents) to avoid float bugs
  currency:    string      // "USD" / "GBP" etc.  [VERIFY]
  dietaryTags: string[]    // vegan | vegetarian | gf | halal | spicy | contains-nuts
  allergens:   string[]    // required in many jurisdictions  [VERIFY policy]
  image:       { src, srcset, alt, width, height }
  badge:       string?     // "Bestseller" | "Chef's Pick" | "New"
  available:   boolean     // hide/disable when out of stock
  featured:    boolean     // eligible for hero / chef's pick
  sortOrder:   number
}
```

**Reservation**
```
Reservation {
  id:        string
  name:      string   (required, ≥2 chars)
  phone:     string   (required — primary confirmation channel)  [VERIFY: phone vs email]
  email:     string?  (optional in v1; prototype currently requires it)
  date:      ISO date (required, not in the past)
  time:      "HH:MM"  (required, within service hours)
  partySize: int      (1–4 selectable; 5+ → "call us")
  notes:     string?  (allergies, occasion, accessibility needs)
  status:    enum     // requested | confirmed | declined | seated | cancelled
  createdAt: timestamp
}
```

**Cart line** (client-side only in v1)
```
CartLine { dishId, name, unitPrice, qty }
```

### 2.4 Trade-offs (recommendation + what to revisit as it grows)

| Decision | Option A | Option B | Recommendation |
|---|---|---|---|
| Menu source | **Static** in JS/JSON, edited by developer | **Editable** (CMS / Google Sheet / JSON file) | **v1: static JS array.** Zero cost, fast, no backend. **Revisit at ~40+ items or weekly changes:** move to a single editable `menu.json` the owner can update, then to a lightweight CMS/Sheet-to-JSON |
| Booking | **Form-to-WhatsApp / email** | **Backend booking** with DB + availability | **v1: form → confirmation + deep link to WhatsApp/phone.** No infra, no double-bookings enforced. **Revisit when volume justifies** a real booking engine (OpenTable-style or custom) with availability + deposits |
| Ordering | **Cart + "confirm" (calls you / links out)** | **Real online payment** | **v1: cart → order confirmation reference + call.** Honest, no payment liability. **Revisit:** add Stripe/payment + delivery-app links once pickup/delivery is confirmed |
| Architecture | **Single page (anchors)** | **Multi-page** | **v1: single page.** Fewest taps, one load. **Revisit** when SEO/landing depth matters — split Menu & Reservations to their own URLs |
| Images | **Unsplash stock placeholders** | **Real owner photography** | **Launch with real photography.** Stock must never ship to production |

**Guiding principle:** ship the *smallest honest thing*. Never fake availability,
prices, or an order "placed" state. A confirmation that says "we'll call you"
is trustworthy; a fake "payment received" is not.

---

## 3. Visual Direction

### 3.1 Aesthetic in two words

**Warm Heritage.**

Classic, timeless, photography-led. It should feel like a well-kept restaurant
that has earned its patina — not a startup landing page.

### 3.2 Principles

- **Craft over decoration.** Hairline rules, generous whitespace and a single
  gold accent do more than dropshadows and gradients.
- **Photography is the hero.** Food shots are full-bleed, warmly lit, natural
  colour — never over-saturated. Real plates, real steam, real tables.
- **One idea per screen.** The eye should always know where to go next.
- **Hand-finished.** Every margin, alignment and crop looks deliberate. Nothing
  overlaps, nothing is cramped, nothing is centred "by accident".

### 3.3 Palette

Warm neutrals + one deep accent (forest green) + one gold highlight + cream
paper. Derived from (and matching) the existing `styles.css`.

| Role | Token | Hex | Use |
|---|---|---|---|
| Brand primary | `--green` | `#1b4332` | Buttons, links, category-active, headings accent |
| Brand deep | `--green-dark` | `#0c2b1d` | Footer, dark bands, high-contrast headings |
| Brand soft | `--green-soft` | `#dce9e0` | Tinted panels, chips, social icons |
| Accent / metallic | `--gold` | `#e0a62e` | Eyebrows, badges, stars, active underlines |
| Accent soft | `--gold-soft` | `#f7ecd5` | Section tint (Visit band) |
| Paper / neutral 0 | `--cream` | `#faf5ee` | Page background |
| Surface | `--surface` | `#ffffff` | Cards, forms, drawers |
| Ink | `--text` | `#232323` | Body copy |
| Muted | `--muted` | `#6b6b6b` | Secondary copy, captions |
| Hairline | `--line` | `#e9e2d6` | Rules, dividers, input borders |
| Danger | `--danger` | `#c0392b` | Errors, remove actions |

**Contrast note:** cream-on-white is decorative only. All body text uses
`--text`/`--green-dark` on cream or white to clear 4.5:1 (see §7).

### 3.4 Typography

- **Headings:** *Playfair Display* (serif) — weights 600–800, occasional italic
  for emphasis (`em` inside the hero). Warm, editorial, classic.
- **Body/UI:** *Poppins* (sans) — weights 300–600. Clean, legible, friendly.

Type scale (fluid where noted):

| Token | Size | Weight | Font | Use |
|---|---|---|---|---|
| `--fs-hero` | clamp(2.375rem, 5.4vw, 3.875rem) | 800 | Serif | Hero H1 |
| `--fs-h2` | clamp(1.875rem, 4vw, 2.625rem) | 700 | Serif | Section titles |
| `--fs-h3` | 1.5rem | 700 | Serif | Card / form titles |
| `--fs-lead` | 1rem | 400 | Sans | Hero sub, intro |
| `--fs-body` | 0.9375rem (15px) | 400/500 | Sans | Body |
| `--fs-small` | 0.8125rem (13px) | 500 | Sans | Card copy, labels |
| `--fs-eyebrow` | 0.75rem (12px) | 600 | Sans | Eyebrows, letter-spacing 2.5px, uppercase |

Rules: headings never below 30px on mobile; labels always ≥13px; eyebrows are
uppercase with 2.5px tracking; line-height 1.15 for headings, 1.6 for body.

### 3.5 Layout, texture & imagery

- 12-column mental grid; content max-width **1200px**, page gutters 4% (phone).
- Section rhythm: **90px** vertical padding desktop, **64px** mobile.
- Radial cream "glow" behind hero + dark green bands to break the page.
- Texture = subtle paper-tone (`--cream`) and hairlines, not noise overlays.
- Image crops: square-ish food (4:4.8 hero portrait, 1.3:1 cards, 1:1 gallery).
  Rule of thirds; heat/steam near one third line. Warm grade, +0 saturation cap.
- Shadow language: soft, green-tinted (`rgba(20,50,38,…)`), never black.

---

## 4. Design System

### 4.1 Tokens (`:root`) — as implemented in `styles.css`

```css
:root {
  /* ---- Color: brand ---- */
  --green:        #1b4332;
  --green-dark:   #0c2b1d;
  --green-soft:   #dce9e0;
  --gold:         #e0a62e;
  --gold-soft:    #f7ecd5;

  /* ---- Color: semantic ---- */
  --danger:       #c0392b;
  --success:      #1b4332;  /* reuse brand green for positive toasts */

  /* ---- Color: neutral ---- */
  --cream:        #faf5ee;
  --surface:      #ffffff;
  --text:         #232323;
  --muted:        #6b6b6b;
  --line:         #e9e2d6;

  /* ---- Type ---- */
  --font-head: "Playfair Display", serif;
  --font-body: "Poppins", system-ui, sans-serif;

  /* ---- Spacing scale (8px base) ---- */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px; --space-9: 90px;

  /* ---- Radius ---- */
  --radius-sm: 12px; --radius: 18px; --radius-lg: 26px; --radius-pill: 50px;

  /* ---- Shadow (green-tinted, never black) ---- */
  --shadow:    0 10px 30px rgba(20, 50, 38, 0.08);
  --shadow-lg: 0 20px 60px rgba(20, 50, 38, 0.16);

  /* ---- Motion ---- */
  --dur-fast: 200ms; --dur: 300ms; --dur-slow: 400ms;
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

> Note: the prototype currently hard-codes some of these (e.g. easing literals,
> explicit paddings). **Handoff action:** promote the spacing/radius/motion
> values above into `:root` and replace literals so the token system is complete.

### 4.2 Component documentation

For each: **variants · states · sizes · accessibility.**

---

#### Button (`.btn`)
- **Variants:** `btn-primary` (solid green), `btn-outline` (2px green outline),
  `btn-dark` (solid deep green), `btn-block` (full width).
- **States:** default → hover (`translateY(-2px)` + darker fill, 200ms) →
  focus (`:focus-visible` 3px gold ring — *to add*) → active (pressed, no
  lift) → disabled (50% opacity, no pointer) → loading ("Reserving…" + spinner,
  width-locked) → error (inherits form error, button unchanged).
- **Sizes:** default padding 13px×26px, font 14px/600; optional `.btn-sm`
  (10×18) and `.btn-lg` (16×32) — *add if needed*.
- **A11y:** real `<button>` or `<a>`; ≥44px tap height; visible focus; label is a
  verb; `aria-busy="true"` while loading; never colour-only.

#### Nav (`.navbar`)
- **Variants:** transparent-over-hero → `.scrolled` (cream, blur, shadow, thinner).
- **States:** link default / hover+active (`::after` gold underline grows) /
  focus-visible ring; hamburger closed/open (animated to X).
- **Sizes:** desktop inline; ≤900px collapses to slide-in drawer (min(300px,78vw)).
- **A11y:** `<nav aria-label="Primary">`; hamburger `aria-expanded`, `aria-label`;
  ESC closes; body scroll locked when open; focus trap *to add*.

#### Menu item row / Dish card (`.menu-card`)
- **Variants:** with/without `badge`; `best` badge (green) vs default (gold);
  desktop 4-up / tablet 3-up / phone 2-up / ≤420px 1-up.
- **States:** default → hover (lift + stronger shadow) → focus-within (ring) →
  `available:false` (desaturate + "Sold out" overlay, add button disabled).
- **Sizes:** image 1.3:1, body padding 18px.
- **A11y:** `<article>`; image has `role="img"`+`aria-label` (or real `<img>`
  with `alt`); add button `aria-label="Add {dish} to order"`; price is text not
  colour; tag badges are text.

#### Category tabs (`.menu-filters`)
- **Variants:** default pill / active (green fill, white text, shadow).
- **States:** default / hover (gold border) / focus-visible / active / pressed.
- **A11y:** implemented as `role="tablist"` with buttons. **Fix:** buttons need
  `role="tab"` + `aria-selected`, and panels `role="tabpanel"`; or drop ARIA and
  treat as a filter with `aria-pressed`. Keyboard ←/→ support *to add*.

#### Form field (`.form-field`)
- **Variants:** text, email, tel, date, time, select, textarea (notes).
- **States:** default / focus (green border + soft ring) / filled / error
  (`--danger` border + message) / disabled / required marker.
- **A11y:** every input has a visible `<label for>`; errors are text with
  `aria-describedby` + `aria-invalid`; error text states what+why+fix; date/time
  use native pickers (best mobile support).

#### Date/time picker
- v1 uses native `<input type="date">` / `<input type="time">` — best
  mobile/keyboard/a11y support, zero JS. **Revisit** only if design demands a
  custom calendar; then build a fully keyboard-accessible grid.
- Guard: disable past dates (`min` today); time constrained to service hours.

#### Reservation summary / Toast (`.toast`)
- **Variants:** `ok` (green), `warn` (danger). Used for confirmations & errors.
- **States:** hidden → shown (slide+fade, 300ms) → auto-dismiss 2.6s.
- **A11y:** `role="status"` `aria-live="polite"` for success, `role="alert"`
  for errors. **Fix:** add these roles; respect reduced-motion.

#### Footer (`.footer`)
- **Variants:** single. Dark-green, 4-col desktop → 2 → 1 col.
- **A11y:** landmark `<footer>`; heading order; link contrast ≥4.5:1 on dark;
  social icons have `aria-label`.

*(Also implemented: cart drawer, modal, overlay, floating cards, gallery item
with `data-cap` caption. Cart/Modal need focus management — see §7/§8.)*

---

## 5. Page Specs

Single-page v1; each "page" = a section (own URL when split). Primary CTA per
section in bold. Layouts: **Desktop 1440 · Tablet 768 · Mobile 375.**

### 5.1 Home (hero) — Primary CTA: **Order now** (secondary: Reserve a table)
- **Order:** Nav → Hero (brand, H1, sub, CTAs, stats) → info strip (hours,
  address, delivery, parking) → [menu teaser].
- **Desktop 1440:** 2-col grid (1.05fr text / 0.95fr image), 60px gap; portrait
  hero image 4:4.8 with 2 floating cards; stats row of 3.
- **Tablet 768:** hero stacks to 1-col, image max 520px centred; stats stay
  inline; strip becomes 2×2.
- **Mobile 375:** H1 ≈34–38px; CTAs full-width stacked; **sticky bottom bar with
  "Reserve a table" + "Order" + call**; stats compress to 3 tight columns;
  floating cards pulled inside edges (no horizontal overflow).
- **Hierarchy:** brand name → appetite line → primary CTA → secondary → hours/
  location. Nothing else above the fold.

### 5.2 Menu — Primary CTA: **Add to order**
- **Order:** heading → category tabs → grid of dish cards → (cart drawer).
- **Desktop 1440:** 4-up grid, 22px gap; tabs centred row.
- **Tablet 768:** 3-up grid.
- **Mobile 375:** 2-up grid (→1-up ≤420px); one-thumb scroll; tabs horizontally
  scrollable if they wrap; add button ≥44px.
- **Hierarchy:** category → dish photo → dish name → one-line description →
  price → add. Price always beside the add button.
- **Data note:** drives the `menuItems` array; confirm prices/tags with owner.

### 5.3 Reservations — Primary CTA: **Reserve a table** (submit)
- **Order:** heading + reassurance → contact details (phone/email/hours) →
  form (name, phone, date, time, party, notes) → submit → confirmation.
- **Desktop 1440:** 2-col (copy left, card-form right).
- **Tablet 768 / Mobile 375:** stacked; form card first or immediately after
  copy; `date`/`time` side-by-side then stack at ≤640px; inputs full width;
  submit full-width.
- **States:** inline validation on blur+submit; success = toast/summary card
  "Table requested for {party} on {date} at {time} — we'll confirm by phone";
  closed-today notice if date is a closed day.
- **Fallback:** "Prefer to talk? Call {number}" link beneath submit.

### 5.4 Order (cart drawer) — Primary CTA: **Checkout / Confirm order**
- Overlay drawer, width min(420px,100vw); slides from right.
- Line items with qty +/− and remove; subtotal; checkout.
- **Confirmation modal:** order reference + honest message ("We'll call to
  confirm") — **do not** claim payment/receipt in v1.
- A11y: focus moves into drawer; ESC closes; focus returns to cart button.

### 5.5 Gallery — Primary CTA: *(none — immersive)* → soft CTA to Menu
- Mosaic grid (some 2-row spans) desktop 4-up; tablet 3-up; mobile 2-up (spans
  removed ≤640px). Lazy-loaded, real photography, captions on `data-cap`.

### 5.6 Our Story — Primary CTA: **Visit us**
- 2-col: image cluster (main + small + "Est." badge) | copy + 3 proof points +
  founder credit + CTA. No invented milestones beyond owner-approved copy.

### 5.7 Visit / Contact — Primary CTA: **Get directions**
- Address card + **map** + phone (`tel:`) + email (`mailto:`) + socials.
- Desktop 2-col; mobile stacked with map after text; "Get directions" opens
  native maps. **[VERIFY address/coords — current map coords are placeholders.]**

### 5.8 Mobile-first & performance rules (all pages)
- **Sticky "Reserve a table"** action accessible on every screen (bottom bar on
  mobile, nav button on desktop).
- **44px minimum** tap targets, 8px minimum spacing between them.
- Menu readable with one thumb: single column at narrow widths, large text,
  price visible without zoom.
- **Performance:** compress images (WebP/AVIF, ~100–200KB), `loading="lazy"` +
  explicit `width`/`height` to prevent layout shift, preconnect fonts, self-host
  or subset fonts, defer JS, aim LCP <2.5s on 3G. (Prototype already lazy-loads
  gallery; menu images load via `background-image` — **change to `<img>`** for
  lazy-loading + a11y.)

---

## 6. UX Copy (sheet)

**Voice:** warm, confident, unfussy. Talk like a good host, not a brochure.
Verb-first CTAs. Short sentences. No exclamation spam. Never oversell.

### 6.1 Hero — two alternatives

**Headline option A (warm/emotional):**
> *Real recipes. Honest food.*
> *Come hungry.*

**Headline option B (place-led):**
> *A warm table,*
> *a full plate,*
> *a proper welcome.*

Prototype currently reads: *"Great food, honest recipes, unforgettable taste."*
— acceptable; options A/B are sharper.

**Sub-copy:**
> From the grill to the dessert trolley — everything at Mckanim is cooked
> fresh, seasoned properly, and served with a smile. Dine in tonight or order
> for pickup.

**CTA — two alternatives:**
- Primary: **Order now** · Secondary: **Reserve a table**
- Alternative pair: **See the menu** · **Book a table**

### 6.2 CTAs (verb-first)
| Context | Label |
|---|---|
| Hero primary | Order now |
| Hero secondary | Reserve a table |
| Nav / sticky | Reserve a table |
| Menu card | Add to order |
| Cart | Checkout |
| Reservation submit | Reserve a table |
| Visit | Get directions |
| Phone | Call Mckanim |
| Empty menu state | *link* View full menu |

### 6.3 Form labels & hints
- Full name — "e.g. Jordan Smith"
- Phone number — "We'll confirm your booking by call or text." **[VERIFY channel]**
- Date — "Today or later"
- Time — "From 11:00 AM to 10:30 PM"
- Party size — "1–4 guests online. 5 or more? Call us."
- Notes — "Allergies, occasions, accessibility — tell us anything."

### 6.4 Validation errors (what happened + why + how to fix)
- Name: "Please enter your name — we need it to hold the table."
- Phone: "That number doesn't look right. Try the full number with area code."
- Date: "Pick a date from today onwards. We can't book dates in the past."
- Time: "We're not open then. Choose a time between 11:00 AM and 10:30 PM."
- Party: "We take up to 4 guests online. For 5 or more, please call us."
- General: "Please fix the highlighted fields and try again."

### 6.5 Empty / system states
- **Empty cart:** "Your basket is empty. Add something delicious from the menu." + *View menu*
- **No dishes in category:** "Nothing here yet — try another category." + *View all*
- **Closed today:** "We're closed today. Reopening {day} at 11:00 AM — you can still book ahead." **[VERIFY hours]**
- **Booking confirmation:** "Table requested for {party} on {date} at {time}. We'll confirm by phone shortly. See you soon, {name}."
- **Order confirmation:** "Order received — reference {id}. We'll call you to confirm pickup/delivery time." **[VERIFY delivery]**
- **404:** "This page left the kitchen. The dish you're after isn't here — head back home or see the menu." + *Home* / *Menu*
- **Server/JS error:** "Something went wrong on our side. Please try again, or call {number} to order."

### 6.6 Microcopy details
- Buttons show loading state: "Reserving…", "Placing…".
- Errors: `role="alert"`; success: `role="status"`.
- Never say "Submit". Never say "Click here". Sentence case for buttons.
- Privacy line under forms: "We only use your details to manage your booking."

---

## 7. Accessibility (WCAG 2.1 AA)

**Target: WCAG 2.1 AA.** Audited against the current prototype.

### 7.1 Contrast (≥4.5:1 body, ≥3:1 large/UI)
| Pair | Ratio (approx) | Verdict |
|---|---|---|
| `--text #232323` / cream `#faf5ee` | ~12.5:1 | ✅ |
| `--green-dark #0c2b1d` / cream | ~13:1 | ✅ |
| `--muted #6b6b6b` / cream | ~4.6:1 | ✅ (borderline — keep for ≥15px) |
| white / `--green #1b4332` | ~8.6:1 | ✅ |
| white / `--green-dark` | ~14:1 | ✅ |
| white / `--gold #e0a62e` | ~2.1:1 | ❌ **Do not use white on gold.** Use `--green-dark` on gold |
| `--gold` on cream (eyebrow) | ~2.1:1 | ❌ fails body — **OK only for ≥large decorative eyebrow; add darker gold `#a97a12` for small text** |
| `--muted` on white | ~4.9:1 | ✅ |

**Actions:** darken gold text or reserve gold for large text/underlines only;
ensure any text over food photos sits on a gradient/scrim (gallery caption
already uses a dark gradient ✅).

### 7.2 Keyboard & focus
- **Must add** a global `:focus-visible` style (3px gold/green ring, 2px offset)
  — many components currently suppress outlines.
- Full keyboard order: skip-link → nav → hero CTAs → menu tabs → dish add →
  **cart drawer** (focus moves in, ESC closes, focus returns) → form → footer.
- **Add a "Skip to menu" skip-link** as first focusable element.
- Tabs: arrow-key navigation, roving tabindex (or convert to filters with
  `aria-pressed`).

### 7.3 Semantics & ARIA
- Landmarks: `header`, `nav[aria-label]`, `main`, `footer`. **Add `<main>`
  wrapper** — sections currently sit directly in `<body>`.
- Headings: one `<h1>` (hero), sequential `<h2>` per section, `<h3>` in cards.
  Current markup is close; verify no skipped levels.
- Toasts: `role="status"`/`aria-live="polite"` (success) and `role="alert"`
  (errors) — **add**.
- Form: `aria-invalid` + `aria-describedby` on each input; success message in a
  live region.
- Drawer/modal: `role="dialog"` `aria-modal="true"` + focus trap + labelled by
  title — **add**.

### 7.4 Images & media
- Every dish image needs real `alt` text describing the food (e.g. "Char-grilled
  ribeye with rosemary butter and grilled vegetables"). Decorative images: `alt=""`.
- Replace CSS `background-image` dish photos with `<img alt>` so alt + lazy-load
  + responsive `srcset` all work.
- Icons that convey meaning need `aria-label`; purely decorative `aria-hidden`.
- Video (if added): captions + no autoplay audio.

### 7.5 Motion & input
- `prefers-reduced-motion: reduce` — **already implemented** (disables all
  animation/transition; reveals shown). Keep.
- No content that flashes >3×/sec. No motion-only meaning.
- Touch targets ≥44×44px with spacing (§5.8).
- Zoom to 200% without loss of content; reflow to 320px width (WCAG 1.4.10).

---

## 8. Handoff (Design → Code)

**Stack:** plain **HTML + CSS + JavaScript only.** No frameworks, no build tools,
no bundler, no npm. Files: `index.html`, `styles.css`, `script.js`.

### 8.1 HTML structure (semantic)
```html
<header class="navbar">
  <a class="skip-link" href="#menu">Skip to menu</a>
  <nav aria-label="Primary">…</nav>
</header>
<main>
  <section id="home"    class="hero">…</section>
  <section id="menu"    class="section menu">…</section>
  <section id="about"   class="section about">…</section>
  <section id="gallery" class="section gallery">…</section>
  <section id="reserve" class="section reserve">…</section>
  <section id="contact" class="section contact">…</section>
</main>
<footer class="footer">…</footer>
<aside role="dialog" aria-modal="true" aria-label="Your order" id="cartDrawer">…</aside>
<div role="dialog" aria-modal="true" id="checkoutModal">…</div>
<div role="status" aria-live="polite" id="toast"></div>
```

### 8.2 CSS architecture
- Tokens in `:root` (§4.1). One **reusable base class per component**
  (`.btn`, `.menu-card`, `.form-field`, `.toast`, …) plus modifier classes
  (`.btn-primary`, `.menu-badge.best`).
- Layout with **CSS Grid** (hero, menu, about, reserve, contact, gallery, footer)
  and **Flexbox** (nav, buttons, cart lines). Fluid sizing with `clamp()`.
- Breakpoints already present: **1024px** (grid density, hide nav CTA),
  **900px** (stacked heroes, nav drawer), **640px** (spacing, 2-up grids),
  **420px** (1-up menu, smaller type).
- `styles.css` is the single source of styling truth; no inline styles except
  the dynamic `background-image` set by JS.

### 8.3 JavaScript behaviour (interactive elements)
| Feature | Trigger | Behaviour |
|---|---|---|
| Mobile menu | `.hamburger` click | Toggle `.open` on `#navLinks` + hamburger; `aria-expanded`; lock body scroll; close on link/ESC |
| Category tabs | `.filter-btn` click | Set `currentFilter`, re-render `#menuGrid`; update active class |
| Add to order | `.add-btn` click | Push to `cart`, `updateCart()`, toast |
| Cart drawer | cart button / overlay / ESC | Slide in/out; qty +/−; remove line |
| Checkout | `#checkoutBtn` | Generate order ref, open modal, clear cart (honest copy — no fake payment) |
| Reservation | `#reserveForm` submit | Validate fields; inline errors; success toast/summary; reset |
| Gallery | render on load | Build grid; lazy `<img>`; captions |
| Scroll effects | scroll/resize | Navbar `.scrolled`; IntersectionObserver scrollspy + `.reveal` |
| Carousel/accordion | — | Not in v1 |

**Data lives in `script.js`** (`menuItems`, `galleryImages`) — the owner/dev edits
these arrays. **Revisit:** externalise to `menu.json` (fetch) when editable menu
is needed.

### 8.4 Asset list (name · size · format · alt text)

> Current prototype uses **Unsplash URLs** (placeholders). Production must use
> real, licensed photography. Recommended export: **WebP**, plus JPEG fallback.

| Asset | Dimensions | Format | Alt text |
|---|---|---|---|
| `hero-porridge…` → `hero-dish.webp` | 900×1080 | WebP | "Roast dish plated at Mckanim, warm lighting" |
| `menu-signature-burger.webp` | 650×500 | WebP | "McKanim signature double cheeseburger with golden sauce" |
| `menu-bucket.webp` | 650×500 | WebP | "Bucket of crispy twelve-spice fried chicken" |
| `menu-ribeye.webp` | 650×500 | WebP | "Char-grilled ribeye with rosemary butter and vegetables" |
| `menu-wrap.webp` | 650×500 | WebP | "Zesty chicken wrap with slaw and chili mayo" |
| `menu-beef-burger.webp` | 650×500 | WebP | "Classic beef burger with lettuce, tomato and sauce" |
| `menu-lamb-chops.webp` | 650×500 | WebP | "Grilled lamb chops with mint yogurt dip" |
| `menu-fries.webp` | 650×500 | WebP | "Golden seasoned fries" |
| `menu-wings.webp` | 650×500 | WebP | "Smoky glazed barbecue chicken wings" |
| `menu-salad.webp` | 650×500 | WebP | "Fresh garden salad with feta and citrus vinaigrette" |
| `menu-lemonade.webp` | 650×500 | WebP | "Homemade iced lemonade with mint" |
| `menu-latte.webp` | 650×500 | WebP | "Iced caramel latte" |
| `menu-lava.webp` | 650×500 | WebP | "Molten chocolate lava cake with vanilla ice cream" |
| `menu-softserve.webp` | 650×500 | WebP | "Vanilla soft serve with topping" |
| `menu-mcwrap-combo.webp` | 650×500 | WebP | "Spicy wrap combo with fries and a drink" |
| `menu-portobello-burger.webp` | 650×500 | WebP | "Portobello and swiss cheese burger" |
| `menu-mixed-grill.webp` | 650×500 | WebP | "Mixed grill platter of chicken, beef and lamb" |
| `about-room.webp` | 900×950 | WebP | "The Mckanim dining room, set for service" |
| `about-detail.webp` | 500×450 | WebP | "Chef plating a dish in the Mckanim kitchen" |
| `gallery-01…08.webp` | 600×600 | WebP | Per caption: "Char-grilled chops", "Breakfast plates", … |
| `logo-mark.svg` | vector | SVG | (decorative, `aria-label="Mckanim home"` on parent link) |
| `favicon.ico` / `favicon.svg` | 32/vector | ICO/SVG | — |

Total budget: keep hero ≤150KB, cards ≤60KB each, gallery ≤40KB each.

### 8.5 Visual targets
- **Hero (desktop 1440):** screenshot `design/hero-1440.png` **is the visual
  target** — 2-col, portrait food image with two floating cards, stats row.
- **Menu grid (1440 / 768 / 375):** screenshot `design/menu-{bp}.png` **is the
  target** — 4/3/2-up cards, tabs centred.
- **Reservations (1440):** screenshot `design/reserve-1440.png` **is the
  target** — split copy + form card.
- *(No Figma file exists for this project; screenshots serve as the spec target.
  If a Figma frame is produced, link it here and treat it as authoritative.)*

### 8.6 Definition of done (per component)
Tokens used (no magic values) · all states designed · keyboard reachable ·
focus visible · contrast ≥4.5:1 · mobile 375 verified · reduced-motion respected ·
alt/labels present · passes a Lighthouse a11y ≥95.

---

## 9. Deliverables & Plan

### 9.1 Deliverables (this document = all of the above)
1. ✅ Research brief + open questions (§1)
2. ✅ Site map + flows + data models + trade-offs (§2)
3. ✅ Design tokens (§4.1)
4. ✅ Component documentation (§4.2)
5. ✅ Annotated page specs (§5)
6. ✅ UX copy sheet (§6)
7. ✅ Build checklist with owner & status (§9.2)
8. ✅ Top 5 risks (§9.3)

### 9.2 Build checklist (priority-ordered)

**P0 — Home, Menu, Reservations first.** Owner column: `Design` = designer,
`Dev` = front-end, `Owner` = restaurant owner, `Content` = photographer/copy.

| # | Task | Pri | Owner | Status |
|---|---|---|---|---|
| 1 | Confirm all **[VERIFY]** facts (hours, prices, phone, address, delivery, payments, cuisine) | P0 | Owner | ⬜ To do |
| 2 | Finalise hero headline + CTA pair (§6.1) | P0 | Design | ⬜ To do |
| 3 | Complete `:root` tokens (spacing/radius/motion) & replace literals | P0 | Dev | 🟡 Partial |
| 4 | Wrap sections in `<main>` + add skip-link + focus-visible styles | P0 | Dev | ⬜ To do |
| 5 | Home page: hero, info strip, sticky mobile Reserve/Order/Call bar | P0 | Dev | 🟡 Partial |
| 6 | Menu: replace CSS bg images with `<img alt>` + lazy + srcset | P0 | Dev | ⬜ To do |
| 7 | Menu: real prices, descriptions, dietary tags, availability | P0 | Content/Owner | ⬜ To do |
| 8 | Reservations: add phone field, notes, inline validation, success summary | P0 | Dev | 🟡 Partial |
| 9 | Reservations: closed-day + past-date guards; form→WhatsApp/call fallback | P0 | Dev | ⬜ To do |
| 10 | Real food + interior photography delivered & optimised (WebP) | P0 | Content/Owner | ⬜ To do |
| 11 | Fix gold-on-white contrast (darker gold for small text) | P0 | Design/Dev | ⬜ To do |
| 12 | Toast roles (`status`/`alert`); dialog roles + focus trap for cart/modal | P1 | Dev | ⬜ To do |
| 13 | Cart: honest confirmation copy (no fake payment) + order ref | P1 | Design/Dev | 🟡 Partial |
| 14 | Category tabs: correct ARIA (tab or aria-pressed) + arrow keys | P1 | Dev | ⬜ To do |
| 15 | Out-of-stock dish state (desaturate + disable add) | P1 | Dev | ⬜ To do |
| 16 | Gallery with real captioned images; lightbox optional | P1 | Dev | 🟡 Partial |
| 17 | Our Story + Visit/Contact final copy, real map coordinates | P1 | Content/Dev | 🟡 Partial |
| 18 | Mobile menu: focus trap + ESC + scroll lock verify | P1 | Dev | 🟡 Partial |
| 19 | 404 page + empty/error/loading states implemented | P2 | Dev | ⬜ To do |
| 20 | Performance pass: LCP <2.5s on 3G, Lighthouse ≥90 all | P2 | Dev | ⬜ To do |
| 21 | Full WCAG 2.1 AA audit + keyboard-only walkthrough | P2 | Design/Dev | ⬜ To do |
| 22 | Privacy notice / cookie consent (forms collect personal data) | P2 | Owner/Legal | ⬜ To do |
| 23 | Decide editable-menu / booking-engine upgrade (§2.4) | P2 | Owner | ⬜ To do |
| 24 | Cross-browser + 200% zoom + 320px reflow test | P2 | Dev | ⬜ To do |

Legend: ⬜ To do · 🟡 Partial (prototype has a starting point) · ✅ Done

### 9.3 The 5 riskiest assumptions

1. **Real content & photography will arrive on time.** Without true photos and
   confirmed facts, the site stays a stock-filled mock-up. *Mitigation:* lock the
   shoot + fact-sheet (checklist items 1, 7, 10) before dev continues.
2. **Orders and bookings can be fulfilled honestly by a form → WhatsApp/call
   flow.** If volume is high, unanswered calls and no availability check = lost
   trust. *Mitigation:* monitor volume; move to a booking engine sooner (§2.4).
3. **The restaurant actually offers delivery/pickup and takes online orders.** If
   not, the entire cart + Order flow is misleading. *Mitigation:* confirm item 1;
   be ready to remove the cart and ship "Call to order".
4. **Mobile-first local visitors are the primary audience.** If traffic is
   desktop-heavy or tourists planning days ahead, the sticky-CTA single-page
   model under-serves them. *Mitigation:* validate with analytics post-launch;
   split to multi-page + SEO landing pages.
5. **Menu stays small/stable enough for a static array.** If dishes change weekly
   or exceed ~40 items, hand-edited JS becomes a maintenance hazard. *Mitigation:*
   externalise to `menu.json`/CMS before that threshold.

---

*End of specification. Prototype files: `index.html`, `styles.css`, `script.js`.
All facts in brackets are unverified placeholders and must not ship until the
owner signs them off.*
