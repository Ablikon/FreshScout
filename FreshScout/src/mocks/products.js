export const FILTER_GROUPS = [
  {
    id: "snacks",
    title: "Сладкое и снеки",
    children: [
      { id: "chips", title: "Чипсы" },
      { id: "chocolate", title: "Шоколад" },
      { id: "cookies", title: "Печенье" },
      { id: "marmalade", title: "Мармелад" },
      { id: "candy", title: "Леденцы" },
    ],
  },
  {
    id: "drinks",
    title: "Вода и напитки",
    children: [
      { id: "water_still", title: "Негазированные напитки" },
      { id: "water_sparkling", title: "Газированные напитки" },
      { id: "soda", title: "Газировка" },
      { id: "juice", title: "Сок" },
      { id: "energy", title: "Энергетик" },
    ],
  },
  {
    id: "dairy",
    title: "Молочка",
    children: [
      { id: "milk", title: "Молоко" },
      { id: "kefir", title: "Кефир" },
      { id: "yogurt", title: "Йогурт" },
    ],
  },
  { id: "eggs", title: "Яйца", children: [{ id: "eggs_c1", title: "Яйца" }] },
];

export const STORES = [
  { id: "store_1", title: "SMALL" },
  { id: "store_2", title: "Magnum Express" },
  { id: "store_3", title: "Green Market" },
];

export const PRODUCTS = [
  { id: "p1", title: "Молоко 2.5%", unit: "1 л", group: "dairy", sub: "milk", img: "🥛", price: 520, stores: ["store_1", "store_2"] },
  { id: "p2", title: "Кефир 2.5%", unit: "1 л", group: "dairy", sub: "kefir", img: "🥛", price: 560, stores: ["store_1", "store_3"] },
  { id: "p3", title: "Йогурт клубничный", unit: "250 г", group: "dairy", sub: "yogurt", img: "🍓", price: 420, stores: ["store_2", "store_3"] },

  { id: "p4", title: "Яйца C1", unit: "10 шт", group: "eggs", sub: "eggs_c1", img: "🥚", price: 890, stores: ["store_1", "store_2", "store_3"] },

  { id: "p5", title: "Чипсы", unit: "150 г", group: "snacks", sub: "chips", img: "🥔", price: 690, stores: ["store_1", "store_2"] },
  { id: "p6", title: "Шоколад", unit: "90 г", group: "snacks", sub: "chocolate", img: "🍫", price: 590, stores: ["store_2", "store_3"] },
  { id: "p9", title: "Печенье", unit: "180 г", group: "snacks", sub: "cookies", img: "🍪", price: 520, stores: ["store_1", "store_3"] },
  { id: "p10", title: "Мармелад", unit: "200 г", group: "snacks", sub: "marmalade", img: "🧸", price: 480, stores: ["store_2"] },
  { id: "p11", title: "Леденцы", unit: "120 г", group: "snacks", sub: "candy", img: "🍬", price: 360, stores: ["store_1", "store_2", "store_3"] },

  { id: "p8", title: "Вода", unit: "1.5 л", group: "drinks", sub: "water_still", img: "💧", price: 290, stores: ["store_1", "store_3"] },
  { id: "p12", title: "Вода газированная", unit: "1.5 л", group: "drinks", sub: "water_sparkling", img: "💧", price: 320, stores: ["store_2", "store_3"] },
  { id: "p7", title: "Газировка", unit: "1 л", group: "drinks", sub: "soda", img: "🥤", price: 450, stores: ["store_1", "store_2"] },
  { id: "p13", title: "Сок", unit: "1 л", group: "drinks", sub: "juice", img: "🧃", price: 720, stores: ["store_3"] },
  { id: "p14", title: "Энергетик", unit: "0.45 л", group: "drinks", sub: "energy", img: "⚡", price: 610, stores: ["store_2"] },

  { id: "p15", title: "Чипсы острые", unit: "120 г", group: "snacks", sub: "chips", img: "🌶️", price: 670, stores: ["store_1", "store_2"] },
  { id: "p16", title: "Чипсы сыр", unit: "140 г", group: "snacks", sub: "chips", img: "🧀", price: 710, stores: ["store_2", "store_3"] },
  { id: "p17", title: "Шоколад молочный", unit: "100 г", group: "snacks", sub: "chocolate", img: "🍫", price: 640, stores: ["store_1", "store_3"] },
  { id: "p18", title: "Шоколад тёмный 70%", unit: "90 г", group: "snacks", sub: "chocolate", img: "🍫", price: 690, stores: ["store_2"] },
  { id: "p19", title: "Печенье овсяное", unit: "220 г", group: "snacks", sub: "cookies", img: "🍪", price: 560, stores: ["store_1", "store_2", "store_3"] },
  { id: "p20", title: "Печенье с шоколадом", unit: "200 г", group: "snacks", sub: "cookies", img: "🍪", price: 610, stores: ["store_2"] },
  { id: "p21", title: "Мармелад фруктовый", unit: "250 г", group: "snacks", sub: "marmalade", img: "🍓", price: 520, stores: ["store_1", "store_3"] },
  { id: "p22", title: "Мармелад кислый", unit: "180 г", group: "snacks", sub: "marmalade", img: "🍋", price: 490, stores: ["store_2", "store_3"] },
  { id: "p23", title: "Леденцы мятные", unit: "90 г", group: "snacks", sub: "candy", img: "🍬", price: 330, stores: ["store_1", "store_2"] },
  { id: "p24", title: "Леденцы ягодные", unit: "110 г", group: "snacks", sub: "candy", img: "🍬", price: 350, stores: ["store_3"] },

  { id: "p25", title: "Вода негазированная", unit: "0.5 л", group: "drinks", sub: "water_still", img: "💧", price: 170, stores: ["store_1", "store_2", "store_3"] },
  { id: "p26", title: "Вода газированная", unit: "0.5 л", group: "drinks", sub: "water_sparkling", img: "💧", price: 190, stores: ["store_2"] },
  { id: "p27", title: "Газировка лимон", unit: "1 л", group: "drinks", sub: "soda", img: "🥤", price: 460, stores: ["store_1", "store_2"] },
  { id: "p28", title: "Газировка кола", unit: "1 л", group: "drinks", sub: "soda", img: "🥤", price: 520, stores: ["store_2", "store_3"] },
  { id: "p29", title: "Сок апельсин", unit: "1 л", group: "drinks", sub: "juice", img: "🧃", price: 760, stores: ["store_1", "store_3"] },
  { id: "p30", title: "Сок яблоко", unit: "1 л", group: "drinks", sub: "juice", img: "🧃", price: 700, stores: ["store_2"] },
  { id: "p31", title: "Энергетик классический", unit: "0.45 л", group: "drinks", sub: "energy", img: "⚡", price: 590, stores: ["store_1", "store_2"] },
  { id: "p32", title: "Энергетик без сахара", unit: "0.45 л", group: "drinks", sub: "energy", img: "⚡", price: 610, stores: ["store_3"] },

  { id: "p33", title: "Молоко 3.2%", unit: "1 л", group: "dairy", sub: "milk", img: "🥛", price: 540, stores: ["store_1", "store_2"] },
  { id: "p34", title: "Кефир 1%", unit: "1 л", group: "dairy", sub: "kefir", img: "🥛", price: 520, stores: ["store_2", "store_3"] },
  { id: "p35", title: "Йогурт натуральный", unit: "350 г", group: "dairy", sub: "yogurt", img: "🥣", price: 520, stores: ["store_1", "store_3"] },

  { id: "p36", title: "Яйца C0", unit: "10 шт", group: "eggs", sub: "eggs_c1", img: "🥚", price: 990, stores: ["store_2", "store_3"] },
];
