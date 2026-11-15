# McKanim — UGX menu pricing baseline

**Status:** Non-binding development sample, 15 November 2026. The restaurant has not approved any menu items or prices. Do not publish these as genuine McKanim offers, charge customers, or accept orders against this list.

## Why Uganda shillings?

DineSight's first restaurant pilot targets Uganda. Ugandan shillings use ISO code **UGX**, and we display prices as `UGX 35,000` rather than USD symbols or cents.

### Example menu (illustrative only)

| ID | Dish | Sample price (UGX) |
|---:|---|---:|
| 1 | McKanim Signature Burger | 35,000 |
| 2 | Original Recipe Bucket (8 pcs) | 70,000 |
| 3 | Char-Grilled Ribeye | 65,000 |
| 4 | Zesty Chicken Wrap | 26,000 |
| 5 | Classic Beef Burger | 25,000 |
| 6 | Grilled Lamb Chops | 55,000 |
| 7 | Golden Seasoned Fries | 12,000 |
| 8 | Smoky BBQ Wings | 25,000 |
| 9 | Fresh Garden Salad | 18,000 |
| 10 | Homemade Lemonade | 10,000 |
| 11 | Iced Caramel Latte | 14,000 |
| 12 | Molten Chocolate Lava | 22,000 |
| 13 | Vanilla Soft Serve | 9,000 |
| 14 | Spicy McWrap Combo | 35,000 |
| 15 | Portobello & Cheese Burger | 33,000 |
| 16 | Mixed Grill Platter | 95,000 |

## Market context, not a pricing source of truth

These samples were informed by published restaurant menus in Uganda. For example, Avesta Hotel Kampala lists beef burgers around UGX 25,000, wraps around UGX 25,000 and fries around UGX 10,000; The Villa publishes grilled chicken and steak in UGX; higher-end establishments have higher-priced grills.

- Avesta Hotel Kampala, menu: https://avestahotels.com/restaurant
- The Villa Uganda, menu: https://thevilla.ug/menu
- Evangiz Restaurant Lubowa, menu: https://evangiz.com/

**Do not reuse another restaurant's price, claims, photographs or recipes as McKanim facts.** This is a UX preview and baseline for verifying formatting.

## Software and data rules

1. All sample price fields are integers representing whole shillings, with no decimal fractions.
2. Present values using `Intl.NumberFormat('en-UG')` and an explicit `UGX` prefix.
3. Every menu item and cart row must use the same formatter and currency.
4. The cart subtotal must remain a clearly labelled sample estimate.
5. When connecting DineSight, store approved integer UGX unit prices in PostgreSQL, use authoritative server-side price calculations, snapshot order item prices, and record any taxes/fees separately.
6. Do not enable customer checkout until inventory, pricing, taxes, billing, and the order acceptance workflow have been verified.

## Restaurant-owner approval checklist

- [ ] Confirm names, descriptions, serving sizes and item availability
- [ ] Set and approve actual prices in UGX
- [ ] Clarify whether listed prices include VAT/service charges, where applicable
- [ ] Confirm discounts, bundles and delivery charges (if offered)
- [ ] Verify original food photography, dietary/allergen details and use rights
- [ ] Approve the final public menu before deployment
