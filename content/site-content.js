/* McKanim preview content. Edit this file to change sample dishes and images.
   Do not mark details as verified without owner approval. No backend is connected. */
(() => {
  "use strict";
  const menuItems = [
    {
      id: 1,
      name: "McKanim Signature Burger",
      desc: "Double beef patty, melted cheddar, house golden sauce & caramelized onions.",
      price: 35000,
      cat: "burgers",
      badge: "Bestseller",
      best: true,
      img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
    },
    {
      id: 2,
      name: "Original Recipe Bucket",
      desc: "8 pieces of our famous 12-spice crispy chicken, juicy to the bone.",
      price: 70000,
      cat: "signature",
      badge: "Signature",
      img: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&q=80",
    },
    {
      id: 3,
      name: "Char-Grilled Ribeye",
      desc: "350g ribeye over open flame, rosemary butter & grilled vegetables.",
      price: 65000,
      cat: "grills",
      badge: "Chef's Pick",
      img: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500&q=80",
    },
    {
      id: 4,
      name: "Zesty Chicken Wrap",
      desc: "Crispy chicken strips, fresh slaw & smoky chili mayo in a warm tortilla.",
      price: 26000,
      cat: "signature",
      badge: "Popular",
      img: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&q=80",
    },
    {
      id: 5,
      name: "Classic Beef Burger",
      desc: "A timeless favorite with juicy patty, lettuce, tomato & secret sauce.",
      price: 25000,
      cat: "burgers",
      badge: "",
      img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=80",
    },
    {
      id: 6,
      name: "Grilled Lamb Chops",
      desc: "Tender lamb chops marinated in herbs, served with mint yogurt dip.",
      price: 55000,
      cat: "grills",
      badge: "",
      img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80",
    },
    {
      id: 7,
      name: "Golden Seasoned Fries",
      desc: "Crispy double-fried fries dusted with our signature seasoning.",
      price: 12000,
      cat: "sides",
      badge: "Popular",
      img: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500&q=80",
    },
    {
      id: 8,
      name: "Smoky BBQ Wings",
      desc: "8 glazed wings with a sticky, smoky-sweet barbecue finish.",
      price: 25000,
      cat: "sides",
      badge: "",
      img: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&q=80",
    },
    {
      id: 9,
      name: "Fresh Garden Salad",
      desc: "Crisp greens, cherry tomatoes, feta & citrus vinaigrette.",
      price: 18000,
      cat: "sides",
      badge: "Healthy",
      img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80",
    },
    {
      id: 10,
      name: "Homemade Lemonade",
      desc: "Freshly squeezed lemons, mint & a hint of honey. Ice cold.",
      price: 10000,
      cat: "drinks",
      badge: "Fresh",
      img: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500&q=80",
    },
    {
      id: 11,
      name: "Iced Caramel Latte",
      desc: "Rich espresso, silky milk & caramel drizzle over ice.",
      price: 14000,
      cat: "drinks",
      badge: "",
      img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80",
    },
    {
      id: 12,
      name: "Molten Chocolate Lava",
      desc: "Warm chocolate cake with a gooey molten center & vanilla scoop.",
      price: 22000,
      cat: "desserts",
      badge: "Must Try",
      img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=500&q=80",
    },
    {
      id: 13,
      name: "Vanilla Soft Serve",
      desc: "Silky, creamy hand-spun soft serve with your choice of topping.",
      price: 9000,
      cat: "desserts",
      badge: "",
      img: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80",
    },
    {
      id: 14,
      name: "Spicy McWrap Combo",
      desc: "Spicy wrap with golden fries and an ice-cold drink.",
      price: 35000,
      cat: "signature",
      badge: "Value",
      img: "https://images.unsplash.com/photo-1562967914-608f82629710?w=500&q=80",
    },
    {
      id: 15,
      name: "Portobello & Cheese Burger",
      desc: "Juicy patty topped with roasted portobello and melted swiss.",
      price: 33000,
      cat: "burgers",
      badge: "New",
      img: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80",
    },
    {
      id: 16,
      name: "Mixed Grill Platter",
      desc: "A generous platter of chicken, beef & lamb with grilled sides.",
      price: 95000,
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

  const restaurant = {
    name: "McKanim Restaurant",
    currency: "UGX",
    mode: "concept-preview",
    approvals: {
      menu: false,
      businessDetails: false,
      photography: false,
      onlineOrdering: false,
      reservations: false
    },
    businessDetails: {
      phone: null,
      email: null,
      location: null,
      hours: null
    }
  };

  window.McKanimContent = Object.freeze({ restaurant, menuItems, galleryImages });
})();
