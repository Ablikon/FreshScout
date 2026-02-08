// Unified category mapping: maps raw store categories → unified parent > child
// Magnum already uses "Parent > Child > Sub" format which is great
// Yandex uses english slugs, Wolt/Airba use Russian flat categories

const UNIFIED_CATEGORIES = {
  // ─── Фрукты и овощи ───
  'Фрукты и овощи': {
    icon: 'cat-vegetables',
    children: ['Овощи', 'Фрукты', 'Ягоды', 'Зелень', 'Грибы', 'Сухофрукты и орехи', 'Экзотические фрукты'],
  },
  // ─── Молочные продукты ───
  'Молочные продукты': {
    icon: 'cat-dairy',
    children: ['Молоко', 'Кефир и йогурт', 'Сметана и сливки', 'Творог', 'Сыр', 'Масло сливочное', 'Альтернативное молоко', 'Национальные молочные'],
  },
  // ─── Мясо и птица ───
  'Мясо и птица': {
    icon: 'cat-meat',
    children: ['Говядина', 'Свинина', 'Баранина', 'Курица', 'Индейка', 'Фарш', 'Субпродукты', 'Конина'],
  },
  // ─── Рыба и морепродукты ───
  'Рыба и морепродукты': {
    icon: 'cat-fish',
    children: ['Свежая рыба', 'Замороженная рыба', 'Морепродукты', 'Копченая и соленая рыба', 'Икра'],
  },
  // ─── Хлеб и выпечка ───
  'Хлеб и выпечка': {
    icon: 'cat-bread',
    children: ['Хлеб', 'Лаваш и лепешки', 'Батоны и багеты', 'Булочки', 'Выпечка', 'Торты и пирожные'],
  },
  // ─── Колбасы и деликатесы ───
  'Колбасы и деликатесы': {
    icon: 'cat-sausage',
    children: ['Колбасы', 'Сосиски и сардельки', 'Ветчина и бекон', 'Копчености'],
  },
  // ─── Замороженные продукты ───
  'Замороженные продукты': {
    icon: 'cat-frozen',
    children: ['Пельмени и вареники', 'Замороженные овощи', 'Полуфабрикаты', 'Мороженое', 'Замороженная выпечка', 'Замороженные ягоды'],
  },
  // ─── Крупы, макароны ───
  'Крупы и макароны': {
    icon: 'cat-grains',
    children: ['Крупы', 'Макароны', 'Мука', 'Каши', 'Сухие завтраки', 'Бобовые'],
  },
  // ─── Консервы ───
  'Консервы': {
    icon: 'cat-canned',
    children: ['Мясные консервы', 'Рыбные консервы', 'Овощные консервы', 'Томатная паста', 'Оливки и маслины', 'Горошек и кукуруза'],
  },
  // ─── Масло, соусы, специи ───
  'Масло, соусы, специи': {
    icon: 'cat-oil',
    children: ['Растительное масло', 'Соусы и кетчуп', 'Майонез', 'Специи и приправы', 'Уксус', 'Горчица и хрен'],
  },
  // ─── Напитки ───
  'Напитки': {
    icon: 'cat-drinks',
    children: ['Вода', 'Соки', 'Газировка', 'Чай', 'Кофе', 'Какао', 'Энергетики', 'Морс и компот'],
  },
  // ─── Сладости и снеки ───
  'Сладости и снеки': {
    icon: 'cat-sweets',
    children: ['Шоколад', 'Конфеты', 'Печенье', 'Вафли', 'Чипсы и снеки', 'Батончики', 'Восточные сладости', 'Варенье и мед', 'Жвачки и леденцы'],
  },
  // ─── Алкоголь ───
  'Алкоголь': {
    icon: 'cat-alcohol',
    children: ['Вино', 'Пиво', 'Водка', 'Виски', 'Коньяк', 'Шампанское', 'Ликер', 'Безалкогольное'],
  },
  // ─── Готовая еда ───
  'Готовая еда': {
    icon: 'cat-ready',
    children: ['Салаты', 'Первые блюда', 'Вторые блюда', 'Суши и роллы', 'Пицца', 'Сэндвичи', 'Выпечка готовая'],
  },
  // ─── Детские товары ───
  'Детские товары': {
    icon: 'cat-baby',
    children: ['Детское питание', 'Детские каши', 'Детское пюре', 'Молочные смеси', 'Подгузники', 'Детская гигиена'],
  },
  // ─── Для дома ───
  'Для дома': {
    icon: 'cat-home',
    children: ['Стирка', 'Уборка', 'Бумажные изделия', 'Мешки для мусора', 'Освежители воздуха'],
  },
  // ─── Гигиена и красота ───
  'Гигиена и красота': {
    icon: 'cat-hygiene',
    children: ['Шампуни', 'Гели для душа', 'Зубная паста', 'Уход за лицом', 'Уход за телом', 'Женская гигиена', 'Дезодоранты'],
  },
  // ─── Для животных ───
  'Для животных': {
    icon: 'cat-pets',
    children: ['Корм для кошек', 'Корм для собак', 'Наполнители', 'Аксессуары'],
  },
  // ─── Другое ───
  'Другое': {
    icon: 'package',
    children: ['Прочее'],
  },
};

// ══════════════════════════════════════════════════════════════════
// PRODUCT-TYPE DETECTORS
// These detect what a product IS (not what flavor it has).
// They are matched BEFORE keyword rules to prevent flavor/scent
// words from overriding the actual product type.
// ══════════════════════════════════════════════════════════════════

const PRODUCT_TYPE_RULES = [
  // ── Non-food: Hygiene & Beauty ──
  { patterns: ['гель для душ', 'крем для душ', 'пена для ванн'], parent: 'Гигиена и красота', child: 'Гели для душа' },
  { patterns: ['шампун', 'бальзам для волос', 'бальзам-ополаскиват', 'кондиционер для волос', 'маска для волос'], parent: 'Гигиена и красота', child: 'Шампуни' },
  { patterns: ['зубная паст', 'зубная щетк', 'ополаскиват для рт', 'ополаскиватель для полости'], parent: 'Гигиена и красота', child: 'Зубная паста' },
  { patterns: ['дезодорант', 'антиперспирант'], parent: 'Гигиена и красота', child: 'Дезодоранты' },
  { patterns: ['мыло жидк', 'мыло туалет', 'мыло хозяйств', 'мыло кусков', 'мыло детск', 'крем-мыло'], parent: 'Гигиена и красота', child: 'Гели для душа' },
  { patterns: ['крем для лиц', 'крем для рук', 'крем для тел', 'крем для ног', 'лосьон', 'крем увлажн'], parent: 'Гигиена и красота', child: 'Уход за лицом' },
  { patterns: ['прокладк', 'тампон', 'женская гигиен'], parent: 'Гигиена и красота', child: 'Женская гигиена' },
  // Brand-based hygiene detection
  { patterns: ['palmolive', 'nivea ', 'dove ', 'fa ', 'rexona', 'head & shoulders', 'head&shoulders', 'pantene', 'garnier', 'loreal', "l'oreal", 'colgate', 'oral-b', 'lacalut', 'splat', 'sensodyne', 'listerine'], parent: 'Гигиена и красота', child: 'Гели для душа' },

  // ── Non-food: Home products ──
  { patterns: ['для мытья посуд', 'гель для посуд', 'средство для посуд', 'средство для мытья'], parent: 'Для дома', child: 'Уборка' },
  { patterns: ['порошок стирал', 'гель для стирк', 'капсулы для стирк', 'кондиционер для бел', 'отбеливат', 'пятновыводител', 'для стирки', 'ariel', 'tide ', 'persil'], parent: 'Для дома', child: 'Стирка' },
  { patterns: ['чистящ средств', 'чистящее', 'моющее средств', 'дезинфиц', 'средство для пол', 'средство для стекол', 'средство для ванн', 'средство для кухн', 'средство для унитаз', 'средство чистящ'], parent: 'Для дома', child: 'Уборка' },
  { patterns: ['туалетная бумаг', 'бумажн полотен', 'салфетк бумажн', 'бумажные салфетк', 'влажные салфетк'], parent: 'Для дома', child: 'Бумажные изделия' },
  { patterns: ['мешки для мусор', 'пакеты для мусор', 'мусорные пакет'], parent: 'Для дома', child: 'Мешки для мусора' },
  { patterns: ['освежитель воздух', 'ароматизатор для дом'], parent: 'Для дома', child: 'Освежители воздуха' },

  // ── Non-food: Baby products ──
  { patterns: ['подгузник', 'памперс', 'huggies', 'merries', 'moony', 'libero'], parent: 'Детские товары', child: 'Подгузники' },
  { patterns: ['детское мыл', 'детский шампун', 'детский крем', 'детская зубн'], parent: 'Детские товары', child: 'Детская гигиена' },
  // Baby food/porridge — prevents "каша с черносливом" → Сухофрукты
  { patterns: ['каша мамако', 'каша hipp', 'каша heinz', 'каша nestle', 'каша fleur alpine', 'каша gerber', 'каша беби', 'каша малютка', 'каша фрутоняня', 'детская каш', 'каша молочн'], parent: 'Детские товары', child: 'Детские каши' },
  { patterns: ['фрутоняня', 'gerber', 'hipp ', 'heinz детск', 'агуша', 'детское пюре', 'пюре детск', 'kabrita', 'semper ', 'bebivita'], parent: 'Детские товары', child: 'Детское питание' },

  // ── Non-food: Pets ──
  { patterns: ['корм для кош', 'кошач', 'whiskas', 'felix', 'sheba', 'perfect fit кош', 'royal canin кош', 'purina кош', 'pro plan кош'], parent: 'Для животных', child: 'Корм для кошек' },
  { patterns: ['корм для соб', 'собач', 'pedigree', 'chappi', 'cesar', 'royal canin соб', 'purina соб', 'pro plan соб'], parent: 'Для животных', child: 'Корм для собак' },
  { patterns: ['наполнител для кош', 'наполнител для туалет', 'кошачий наполнит', 'cat step', 'catsan'], parent: 'Для животных', child: 'Наполнители' },

  // ── Snack/cereal products that have fruit/berry FLAVORS (not actual fruits) ──
  { patterns: ['хлебц'], parent: 'Крупы и макароны', child: 'Сухие завтраки' },
  { patterns: ['палочки зерновы', 'палочки кукурузн', 'кукурузные палочк'], parent: 'Сладости и снеки', child: 'Чипсы и снеки' },
  { patterns: ['рамен ', 'рамен,', 'рамен garak', 'рамен nongshim', 'рамен samyang', 'лапша быстрого приготовлен'], parent: 'Крупы и макароны', child: 'Макароны' },
  { patterns: ['протеиновое печень', 'печенье soj', 'протеиновый батончик', 'протеинов бар'], parent: 'Сладости и снеки', child: 'Батончики' },
  { patterns: ['мюсли', 'гранола', 'хлопья овсян', 'хлопья кукурузн', 'хлопья пшеничн', 'corn flakes'], parent: 'Крупы и макароны', child: 'Сухие завтраки' },
  { patterns: ['молоко сгущен', 'сгущенное молок', 'сгущенк'], parent: 'Молочные продукты', child: 'Молоко' },

  // ── Nut-based spreads (not actual nuts) ──
  { patterns: ['паста арахис', 'арахисовая паста', 'арахисовая ', 'урбеч', 'паста кунжут', 'паста миндал', 'паста ореховая', 'паста шоколадн', 'нутелла', 'nutella'], parent: 'Сладости и снеки', child: 'Варенье и мед' },

  // ── Seeds as standalone snack ──
  { patterns: ['семечк подсолн', 'семечки тыквенн', 'семечки airba', 'семечки жарен'], parent: 'Сладости и снеки', child: 'Чипсы и снеки' },

  // ── Beverages with fruit/berry flavors (prevents "лимонад мандарин" → Фрукты) ──
  { patterns: ['напиток ', 'напиток,', 'лимонад', 'газировк', 'газированн', 'энергетик', 'энергетическ'], parent: 'Напитки', child: 'Газировка' },
  { patterns: ['сок ', 'сок,', 'нектар '], parent: 'Напитки', child: 'Соки' },
  { patterns: ['компот', 'морс '], parent: 'Напитки', child: 'Морс и компот' },
];

// Keyword-based mapping rules for classifying products
// IMPORTANT: More specific rules must come BEFORE general ones
// These are ONLY applied if PRODUCT_TYPE_RULES didn't match
const KEYWORD_RULES = [
  // ══════════════════════════════════════════════
  // FOOD CATEGORIES
  // ══════════════════════════════════════════════

  // Сладости и снеки (before fruits — prevents "печенье с малиной" → Ягоды)
  { keywords: ['печень', 'печенья'], parent: 'Сладости и снеки', child: 'Печенье' },
  { keywords: ['конфет', 'шоколад', 'батончик'], parent: 'Сладости и снеки', child: 'Шоколад' },
  { keywords: ['чипс', 'снек', 'сухарик', 'крекер', 'попкорн', 'начос'], parent: 'Сладости и снеки', child: 'Чипсы и снеки' },
  { keywords: ['вафл'], parent: 'Сладости и снеки', child: 'Вафли' },
  { keywords: ['варень', 'джем', 'повидл', 'мед натур', 'мёд'], parent: 'Сладости и снеки', child: 'Варенье и мед' },
  { keywords: ['жвачк', 'жевательн', 'леденец', 'леденц', 'драже'], parent: 'Сладости и снеки', child: 'Жвачки и леденцы' },

  // Колбасы (before мясо — prevents "сосиски молочные" → Молоко)
  { keywords: ['колбас', 'салями', 'сервелат'], parent: 'Колбасы и деликатесы', child: 'Колбасы' },
  { keywords: ['сосиск', 'сарделек', 'сардельк', 'шпикач'], parent: 'Колбасы и деликатесы', child: 'Сосиски и сардельки' },
  { keywords: ['ветчин', 'бекон', 'буженин', 'балык'], parent: 'Колбасы и деликатесы', child: 'Ветчина и бекон' },

  // Соусы и масла (before vegetables — prevents "перец молотый" → Овощи)
  { keywords: ['соус ', 'соус,', 'кетчуп', 'соевый', 'терияки', 'табаско', 'ткемал', 'аджик', 'сацебел', 'allioli', 'песто'], parent: 'Масло, соусы, специи', child: 'Соусы и кетчуп' },
  { keywords: ['масло подсолн', 'масло оливк', 'масло рапс', 'масло кунжут', 'масло растит', 'масло льнян'], parent: 'Масло, соусы, специи', child: 'Растительное масло' },
  { keywords: ['майонез'], parent: 'Масло, соусы, специи', child: 'Майонез' },
  { keywords: ['перец молот', 'соль поварен', 'соль морск', 'соль пищев', 'приправ', 'специ', 'куркум', 'корица', 'паприк', 'орегано', 'тмин', 'базилик сух'], parent: 'Масло, соусы, специи', child: 'Специи и приправы' },

  // Готовая еда (before ingredients — prevents "рис с курицей" confusion)
  { keywords: ['салат готов', 'салат свеж', 'винегрет', 'оливье', 'цезарь'], parent: 'Готовая еда', child: 'Салаты' },
  { keywords: ['суши', 'ролл', 'сет '], parent: 'Готовая еда', child: 'Суши и роллы' },
  { keywords: ['пицца'], parent: 'Готовая еда', child: 'Пицца' },

  // Замороженные
  { keywords: ['пельмен', 'хинкал', 'манты', 'бууз'], parent: 'Замороженные продукты', child: 'Пельмени и вареники' },
  { keywords: ['мороженое', 'мороженого', 'пломбир', 'эскимо', 'сорбет'], parent: 'Замороженные продукты', child: 'Мороженое' },

  // Молочные
  { keywords: ['сливк', 'сметан'], parent: 'Молочные продукты', child: 'Сметана и сливки' },
  { keywords: ['сыр ', 'сыр,', 'моцарелл', 'пармезан', 'чеддер', 'брынз', 'фета', 'маасдам', 'гауд', 'творожн сыр', 'violette'], parent: 'Молочные продукты', child: 'Сыр' },
  { keywords: ['кефир', 'йогурт', 'ряженк', 'простокваш', 'айран'], parent: 'Молочные продукты', child: 'Кефир и йогурт' },
  { keywords: ['творог', 'сырок'], parent: 'Молочные продукты', child: 'Творог' },
  { keywords: ['масло сливочн', 'масло крестьян', 'спред'], parent: 'Молочные продукты', child: 'Масло сливочное' },
  { keywords: ['молоко', 'молок '], parent: 'Молочные продукты', child: 'Молоко' },
  { keywords: ['овсяное молоко', 'миндальное молоко', 'кокосовое молоко', 'соевое молоко', 'растительное молоко'], parent: 'Молочные продукты', child: 'Альтернативное молоко' },
  { keywords: ['курт', 'қурт', 'кумыс', 'шубат', 'қымыз', 'иримшик', 'ірімшік', 'катык', 'қатық'], parent: 'Молочные продукты', child: 'Национальные молочные' },

  // Мясо
  { keywords: ['говядин', 'говяж', 'стейк говя', 'вырезка говя', 'антрекот'], parent: 'Мясо и птица', child: 'Говядина' },
  { keywords: ['свинин', 'свино', 'шейка свин', 'карбонад'], parent: 'Мясо и птица', child: 'Свинина' },
  { keywords: ['баранин', 'бараний', 'ягнятин'], parent: 'Мясо и птица', child: 'Баранина' },
  { keywords: ['куриц', 'куринo', 'курин', 'бройлер', 'цыплен', 'окорочк', 'филе кури', 'грудка кури', 'бедро кури', 'крыло кури', 'голень кури'], parent: 'Мясо и птица', child: 'Курица' },
  { keywords: ['индейк', 'индюш'], parent: 'Мясо и птица', child: 'Индейка' },
  { keywords: ['фарш'], parent: 'Мясо и птица', child: 'Фарш' },
  { keywords: ['конин', 'казы', 'қазы', 'жая', 'шұжық'], parent: 'Мясо и птица', child: 'Конина' },

  // Рыба
  { keywords: ['лосось', 'семг', 'форел', 'горбуш', 'кета ', 'тунец', 'скумбри', 'сельд', 'минтай', 'треск', 'судак', 'щук', 'карп', 'тилапи', 'пангасиус'], parent: 'Рыба и морепродукты', child: 'Свежая рыба' },
  { keywords: ['креветк', 'краб', 'кальмар', 'мидии', 'осьминог', 'устриц', 'морепродукт', 'морской коктейл'], parent: 'Рыба и морепродукты', child: 'Морепродукты' },
  { keywords: ['икра красн', 'икра черн', 'икра лосос'], parent: 'Рыба и морепродукты', child: 'Икра' },

  // Хлеб
  { keywords: ['хлеб', 'батон ', 'багет'], parent: 'Хлеб и выпечка', child: 'Хлеб' },
  { keywords: ['лаваш', 'лепешк', 'тортилья', 'пита '], parent: 'Хлеб и выпечка', child: 'Лаваш и лепешки' },
  { keywords: ['булочк', 'булка', 'круассан', 'бриош', 'сдоб'], parent: 'Хлеб и выпечка', child: 'Булочки' },
  { keywords: ['торт ', 'торт,', 'пирожн', 'эклер', 'наполеон', 'медовик'], parent: 'Хлеб и выпечка', child: 'Торты и пирожные' },

  // Крупы
  { keywords: ['рис ', 'рис,', 'гречк', 'гречнев', 'пшено', 'булгур', 'кускус', 'овсянк', 'крупа', 'перловк', 'ячневая', 'манка', 'полба', 'киноа'], parent: 'Крупы и макароны', child: 'Крупы' },
  { keywords: ['макарон', 'спагетти', 'лапша', 'вермишел', 'пенне', 'фузилл', 'фарфалле'], parent: 'Крупы и макароны', child: 'Макароны' },
  { keywords: ['мука пшенич', 'мука ржан', 'мука '], parent: 'Крупы и макароны', child: 'Мука' },
  { keywords: ['загустител', 'желатин', 'пектин'], parent: 'Крупы и макароны', child: 'Мука' },

  // Фрукты и овощи (now AFTER snacks/cereals to prevent flavor words from matching)
  { keywords: ['помидор', 'томат ', 'томаты', 'огурец', 'огурцы', 'перец болгар', 'баклажан', 'кабачок', 'цуккини', 'картоф', 'морков', 'лук реп', 'свекл', 'капуст', 'редис', 'редьк', 'тыкв', 'патиссон'], parent: 'Фрукты и овощи', child: 'Овощи' },
  { keywords: ['яблок', 'груш', 'банан', 'апельсин', 'мандарин', 'грейпфрут', 'гранат', 'хурма', 'персик', 'нектарин', 'абрикос', 'виноград'], parent: 'Фрукты и овощи', child: 'Фрукты' },
  { keywords: ['клубник', 'малин', 'черник', 'голубик', 'ежевик', 'смородин', 'крыжовник', 'вишн', 'черешн'], parent: 'Фрукты и овощи', child: 'Ягоды' },
  { keywords: ['укроп', 'петрушк', 'кинз', 'базилик ', 'салат лист', 'руккол', 'шпинат'], parent: 'Фрукты и овощи', child: 'Зелень' },
  { keywords: ['шампиньон', 'вешенк'], parent: 'Фрукты и овощи', child: 'Грибы' },
  { keywords: ['авокадо', 'манго', 'киви', 'ананас', 'папай', 'маракуй', 'помело', 'личи', 'питахай'], parent: 'Фрукты и овощи', child: 'Экзотические фрукты' },
  { keywords: ['сухофрукт', 'курага', 'чернослив', 'изюм', 'финик'], parent: 'Фрукты и овощи', child: 'Сухофрукты и орехи' },
  { keywords: ['орех грецк', 'орехи грецк', 'миндаль ', 'фисташ', 'кешью ', 'фундук '], parent: 'Фрукты и овощи', child: 'Сухофрукты и орехи' },

  // Напитки
  { keywords: ['лимонад'], parent: 'Напитки', child: 'Газировка' },
  { keywords: ['вода питьев', 'вода минерал', 'вода газир', 'вода негаз'], parent: 'Напитки', child: 'Вода' },
  { keywords: ['сок ', 'сок,', 'нектар', 'морс'], parent: 'Напитки', child: 'Соки' },
  { keywords: ['кола', 'пепси', 'спрайт', 'фанта', 'газировк', '7up', 'газирован'], parent: 'Напитки', child: 'Газировка' },
  { keywords: ['чай ', 'чай,', 'чай зелен', 'чай черн', 'чай травян'], parent: 'Напитки', child: 'Чай' },
  { keywords: ['кофе', 'эспрессо', 'капучино', 'латте', 'американо'], parent: 'Напитки', child: 'Кофе' },
  { keywords: ['энерг', 'red bull', 'monster', 'burn', 'adrenaline'], parent: 'Напитки', child: 'Энергетики' },

  // Консервы
  { keywords: ['консерв', 'тушенк', 'тушёнк'], parent: 'Консервы', child: 'Мясные консервы' },
  { keywords: ['шпрот', 'сардин', 'консерв рыбн'], parent: 'Консервы', child: 'Рыбные консервы' },
  { keywords: ['томатная паст', 'паста томатн'], parent: 'Консервы', child: 'Томатная паста' },
  { keywords: ['горошек', 'кукуруза консерв', 'фасоль консерв', 'оливки', 'маслины'], parent: 'Консервы', child: 'Горошек и кукуруза' },

  // Алкоголь
  { keywords: ['вино бел', 'вино красн', 'вино розов', 'вино полусл', 'вино сух', 'вино полусух', 'каберне', 'мерло', 'шардоне', 'совиньон'], parent: 'Алкоголь', child: 'Вино' },
  { keywords: ['пиво ', 'пиво,', 'пивной'], parent: 'Алкоголь', child: 'Пиво' },
  { keywords: ['водка ', 'водка,'], parent: 'Алкоголь', child: 'Водка' },
  { keywords: ['виски ', 'виски,', 'бурбон', 'скотч'], parent: 'Алкоголь', child: 'Виски' },
  { keywords: ['коньяк', 'бренди', 'арманьяк'], parent: 'Алкоголь', child: 'Коньяк' },
  { keywords: ['шампанск', 'игрист', 'просекко'], parent: 'Алкоголь', child: 'Шампанское' },

  // Детские
  { keywords: ['детск пюре', 'пюре детск', 'фрутоняня', 'gerber', 'hipp', 'heinz детск', 'агуша'], parent: 'Детские товары', child: 'Детское питание' },
  { keywords: ['молочн смес', 'nan ', 'nestogen', 'similac', 'nutrilon'], parent: 'Детские товары', child: 'Молочные смеси' },
];

// Yandex slug → unified mapping
const YANDEX_SLUG_MAP = {
  'fruits_berries': { parent: 'Фрукты и овощи', child: 'Фрукты' },
  'vegetables': { parent: 'Фрукты и овощи', child: 'Овощи' },
  'greenery': { parent: 'Фрукты и овощи', child: 'Зелень' },
  'mushrooms': { parent: 'Фрукты и овощи', child: 'Грибы' },
  'dried_fruits_and_nuts': { parent: 'Фрукты и овощи', child: 'Сухофрукты и орехи' },
  'milk': { parent: 'Молочные продукты', child: 'Молоко' },
  'kefir_sour_cream_cottage_cheese': { parent: 'Молочные продукты', child: 'Кефир и йогурт' },
  'cheeses': { parent: 'Молочные продукты', child: 'Сыр' },
  'dairy_national': { parent: 'Молочные продукты', child: 'Национальные молочные' },
  'meat': { parent: 'Мясо и птица', child: 'Говядина' },
  'chicken': { parent: 'Мясо и птица', child: 'Курица' },
  'fish_and_seafood': { parent: 'Рыба и морепродукты', child: 'Свежая рыба' },
  'freezing_fish_and_seafood': { parent: 'Рыба и морепродукты', child: 'Замороженная рыба' },
  'bread': { parent: 'Хлеб и выпечка', child: 'Хлеб' },
  'baked_products': { parent: 'Хлеб и выпечка', child: 'Выпечка' },
  'cakes_cookies_waffles': { parent: 'Хлеб и выпечка', child: 'Торты и пирожные' },
  'sausages': { parent: 'Колбасы и деликатесы', child: 'Колбасы' },
  'dumplings': { parent: 'Замороженные продукты', child: 'Пельмени и вареники' },
  'freezing_iceCream': { parent: 'Замороженные продукты', child: 'Мороженое' },
  'breakfast_cereals_and_porridges': { parent: 'Крупы и макароны', child: 'Сухие завтраки' },
  'pasta_and_noodles': { parent: 'Крупы и макароны', child: 'Макароны' },
  'grains_and_legumes': { parent: 'Крупы и макароны', child: 'Крупы' },
  'canned_food': { parent: 'Консервы', child: 'Овощные консервы' },
  'oil_and_sauces': { parent: 'Масло, соусы, специи', child: 'Растительное масло' },
  'spices': { parent: 'Масло, соусы, специи', child: 'Специи и приправы' },
  'water': { parent: 'Напитки', child: 'Вода' },
  'juices': { parent: 'Напитки', child: 'Соки' },
  'coffee_and_cocoa': { parent: 'Напитки', child: 'Кофе' },
  'tea': { parent: 'Напитки', child: 'Чай' },
  'energetics': { parent: 'Напитки', child: 'Энергетики' },
  'iced_tea_coffee': { parent: 'Напитки', child: 'Чай' },
  'chocolates_candies': { parent: 'Сладости и снеки', child: 'Шоколад' },
  'candy_and_gum': { parent: 'Сладости и снеки', child: 'Жвачки и леденцы' },
  'chips_and_snacks': { parent: 'Сладости и снеки', child: 'Чипсы и снеки' },
  'jams_honey_paste': { parent: 'Сладости и снеки', child: 'Варенье и мед' },
  'beer': { parent: 'Алкоголь', child: 'Пиво' },
  'wine': { parent: 'Алкоголь', child: 'Вино' },
  'strong_alcohol': { parent: 'Алкоголь', child: 'Водка' },
  'all_ready_meals': { parent: 'Готовая еда', child: 'Вторые блюда' },
  'appetizers_and_pates': { parent: 'Готовая еда', child: 'Салаты' },
  'hot_streetfood': { parent: 'Готовая еда', child: 'Вторые блюда' },
  'desserts': { parent: 'Сладости и снеки', child: 'Печенье' },
  'kids_nutrition': { parent: 'Детские товары', child: 'Детское питание' },
  'kids_hygiene_and_care': { parent: 'Детские товары', child: 'Детская гигиена' },
  'kids_water_and_drinks': { parent: 'Детские товары', child: 'Детское питание' },
  'home_cosmetics': { parent: 'Для дома', child: 'Уборка' },
  'hygiene': { parent: 'Гигиена и красота', child: 'Гели для душа' },
  'cooking_and_storing': { parent: 'Для дома', child: 'Уборка' },
  'for_dogs': { parent: 'Для животных', child: 'Корм для собак' },
  'forcats': { parent: 'Для животных', child: 'Корм для кошек' },
  'batteries_and_bulbs': { parent: 'Для дома', child: 'Уборка' },
  'ice': { parent: 'Замороженные продукты', child: 'Мороженое' },
  'coffee_and_pastries': { parent: 'Напитки', child: 'Кофе' },
  'izlavki': { parent: 'Готовая еда', child: 'Вторые блюда' },
  'cashback_and_discounts': { parent: 'Другое', child: 'Прочее' },
};

// Magnum category path mapping (> separated)
const MAGNUM_PARENT_MAP = {
  'Продукты питания > Молоко, сыр, яйца': { parent: 'Молочные продукты' },
  'Продукты питания > Овощи и фрукты': { parent: 'Фрукты и овощи' },
  'Продукты питания > Мясо, птица': { parent: 'Мясо и птица' },
  'Продукты питания > Рыба, морепродукты': { parent: 'Рыба и морепродукты' },
  'Продукты питания > Хлеб, выпечка, кондитерские изделия': { parent: 'Хлеб и выпечка' },
  'Продукты питания > Колбасы, сосиски, деликатесы': { parent: 'Колбасы и деликатесы' },
  'Продукты питания > Замороженные продукты, мороженое': { parent: 'Замороженные продукты' },
  'Продукты питания > Крупы, хлопья, макароны': { parent: 'Крупы и макароны' },
  'Продукты питания > Консервация': { parent: 'Консервы' },
  'Продукты питания > Масла, соусы': { parent: 'Масло, соусы, специи' },
  'Продукты питания > Чай, кофе, какао': { parent: 'Напитки' },
  'Продукты питания > Напитки': { parent: 'Напитки' },
  'Продукты питания > Шоколад, конфеты': { parent: 'Сладости и снеки' },
  'Продукты питания > Алкоголь': { parent: 'Алкоголь' },
  'Продукты питания > Готовая еда': { parent: 'Готовая еда' },
  'Продукты питания > Все для выпечки': { parent: 'Крупы и макароны' },
  'Продукты питания > Специи, приправы': { parent: 'Масло, соусы, специи' },
  'Продукты питания > Сладости, снеки': { parent: 'Сладости и снеки' },
  'Продукты питания > Вода': { parent: 'Напитки' },
  'Детские товары': { parent: 'Детские товары' },
  'Красота и здоровье': { parent: 'Гигиена и красота' },
  'Бытовая химия': { parent: 'Для дома' },
  'Товары для дома': { parent: 'Для дома' },
  'Зоотовары': { parent: 'Для животных' },
};

/**
 * Determine store name from the API file source id
 */
export function getStoreName(sourceId) {
  if (sourceId.includes('airba')) return 'Airba Fresh';
  if (sourceId.includes('arbuz')) return 'Arbuz';
  if (sourceId.includes('magnum')) return 'Magnum';
  if (sourceId.includes('wolt')) return 'Wolt Market';
  if (sourceId.includes('yandex')) return 'Yandex Lavka';
  return sourceId;
}

export function getStoreSlug(sourceId) {
  if (sourceId.includes('airba')) return 'airba';
  if (sourceId.includes('arbuz')) return 'arbuz';
  if (sourceId.includes('magnum')) return 'magnum';
  if (sourceId.includes('wolt')) return 'wolt';
  if (sourceId.includes('yandex')) return 'yandex';
  return sourceId;
}

export function getStoreColor(slug) {
  const colors = {
    airba: '#FF6B35',
    arbuz: '#00C853',
    magnum: '#E53935',
    wolt: '#009DE0',
    yandex: '#FFCC00',
  };
  return colors[slug] || '#666';
}

/**
 * Classify a product into unified category.
 * 
 * Uses a 3-phase approach:
 *   Phase 1: PRODUCT_TYPE_RULES match the product TYPE (what it IS),
 *            preventing flavor/scent words from overriding classification.
 *   Phase 2: KEYWORD_RULES match by title keywords for food products.
 *   Phase 3: categoryPath fallback for anything unmatched.
 */
export function classifyProduct(product, sourceId) {
  const title = (product.title || '').toLowerCase();
  const categoryPath = (product.category_full_path || '').toLowerCase();
  const storeSlug = getStoreSlug(sourceId);

  // 1. Try Yandex slug mapping (most reliable — direct slug → category)
  if (storeSlug === 'yandex' && YANDEX_SLUG_MAP[product.category_full_path]) {
    return YANDEX_SLUG_MAP[product.category_full_path];
  }

  // 2. Try Magnum path mapping (structured "Parent > Child > Sub" format)
  if (storeSlug === 'magnum' && product.category_full_path) {
    for (const [prefix, mapped] of Object.entries(MAGNUM_PARENT_MAP)) {
      if (product.category_full_path.startsWith(prefix)) {
        const parts = product.category_full_path.split(' > ');
        const lastSegment = parts[parts.length - 1];
        const parentCat = UNIFIED_CATEGORIES[mapped.parent];
        if (parentCat) {
          for (const child of parentCat.children) {
            if (lastSegment.toLowerCase().includes(child.toLowerCase().substring(0, 4))) {
              return { parent: mapped.parent, child };
            }
          }
          return { parent: mapped.parent, child: parentCat.children[0] };
        }
      }
    }
  }

  // 3. PHASE 1: Product-type detection (title only)
  //    Detects what the product IS — prevents flavor/scent words from misclassifying
  for (const rule of PRODUCT_TYPE_RULES) {
    for (const pat of rule.patterns) {
      if (title.includes(pat)) {
        return { parent: rule.parent, child: rule.child };
      }
    }
  }

  // 4. PHASE 2: Keyword classification (title only)
  for (const rule of KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      if (title.includes(kw)) {
        return { parent: rule.parent, child: rule.child };
      }
    }
  }

  // 5. PHASE 3: Try categoryPath as last resort
  //    First product-type rules, then keyword rules
  for (const rule of PRODUCT_TYPE_RULES) {
    for (const pat of rule.patterns) {
      if (categoryPath.includes(pat)) {
        return { parent: rule.parent, child: rule.child };
      }
    }
  }
  for (const rule of KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      if (categoryPath.includes(kw)) {
        return { parent: rule.parent, child: rule.child };
      }
    }
  }

  // 6. Fallback
  return { parent: 'Другое', child: 'Прочее' };
}

/**
 * Get the full category tree for the API response
 */
export function getCategoryTree() {
  return Object.entries(UNIFIED_CATEGORIES).map(([name, data]) => ({
    slug: name.toLowerCase().replace(/[^а-яёa-z0-9]+/gi, '-').replace(/^-|-$/g, ''),
    name,
    icon: data.icon,
    children: data.children.map(child => ({
      slug: child.toLowerCase().replace(/[^а-яёa-z0-9]+/gi, '-').replace(/^-|-$/g, ''),
      name: child,
      parentName: name,
    })),
  }));
}

export default UNIFIED_CATEGORIES;
