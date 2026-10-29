import type { PackSpec } from '../types.ts';

export default {
  id: 'videogames',
  prompts: [
    // ───────────────────────────── HARDWARE ─────────────────────────────
    {
      id: 'nintendo-console',
      q: {
        en: 'Name a Nintendo console (to 2025)',
        pl: 'Podaj konsolę Nintendo (do 2025)',
        uk: 'Назвіть консоль Nintendo (до 2025)',
      },
      answers: {
        1: [
          "Nintendo Switch||Нінтендо Світч|Switch", "Wii||Віі|Nintendo Wii",
          "Game Boy||Гейм Бой|Gameboy|GB", "Nintendo Entertainment System||Нінтендо Ентертейнмент Систем|NES|Famicom",
          "Nintendo DS||Нінтендо ДС|DS",
        ],
        2: [
          "Nintendo 64||Нінтендо 64|N64", "Super Nintendo Entertainment System||Супер Нінтендо|SNES|Super Nintendo|Super Famicom",
          "GameCube||ГеймК'юб|Nintendo GameCube|NGC", "Nintendo 3DS||Нінтендо 3DS|3DS",
        ],
        3: [
          "Wii U||Віі Ю", "Game Boy Advance||Гейм Бой Едванс|GBA", "Game Boy Color||Гейм Бой Колор|GBC|Game Boy Colour",
          "Nintendo Switch 2||Нінтендо Світч 2|Switch 2", "Nintendo Switch Lite||Нінтендо Світч Лайт|Switch Lite",
        ],
        4: [
          "Virtual Boy||Віртуал Бой", "Game & Watch||Гейм енд Вотч|Game and Watch", "Nintendo 2DS||Нінтендо 2DS|2DS",
          "Nintendo DS Lite||Нінтендо ДС Лайт|DS Lite", "Nintendo Switch OLED||Нінтендо Світч OLED|Switch OLED",
          "Game Boy Advance SP||Гейм Бой Едванс SP|GBA SP",
        ],
        5: [
          "Nintendo DSi||Нінтендо DSi|DSi", "New Nintendo 3DS|||New 3DS", "Game Boy Pocket||Гейм Бой Покет",
          "Nintendo 3DS XL|||3DS XL|3DS LL", "Nintendo DSi XL|||DSi XL|DSi LL", "Wii Mini", "NES Classic Edition|||NES Mini|NES Classic",
          "SNES Classic Edition|||SNES Mini|SNES Classic|Super NES Classic",
        ],
        6: [
          "Color TV-Game|||Color TV Game|Colour TV Game", "Game Boy Micro||Гейм Бой Мікро", "Game Boy Light||Гейм Бой Лайт",
          "Pokémon Mini||Покемон Міні|Pokemon Mini", "New Nintendo 2DS XL|||New 2DS XL", "New Nintendo 3DS XL|||New 3DS XL",
        ],
      },
      reject: ['PlayStation', 'Xbox', 'Sega Genesis', 'Game Gear', 'Wii 2', 'Switch Pro', 'Nintendo Switch Pro', 'Nintendo 128', 'Game Boy Advance DS'],
    },

    // ───────────────────────────── POKÉMON ─────────────────────────────
    {
      id: 'pokemon-gen1',
      q: {
        en: 'Name a Gen 1 Pokémon (the original 151)',
        pl: 'Podaj Pokémona z I generacji (pierwsze 151)',
        uk: 'Назвіть покемона I покоління (перші 151)',
      },
      answers: {
        1: [
          "Pikachu||Пікачу", "Charizard||Чарізард", "Bulbasaur||Бульбазавр", "Charmander||Чармандер",
          "Squirtle||Сквіртл", "Mewtwo||Мьюту", "Eevee||Іві", "Snorlax||Снорлакс",
        ],
        2: [
          "Mew||Мью", "Jigglypuff||Джиґліпаф", "Psyduck||Сайдак", "Meowth||Мяут", "Gengar||Генгар", "Magikarp||Меджікарп",
          "Gyarados||Гаярадос", "Blastoise||Бластойз", "Venusaur||Венузавр", "Dragonite||Драгонайт", "Onix||Онікс",
          "Raichu||Райчу", "Ditto||Дітто", "Lapras||Лапрас", "Articuno||Артікуно", "Zapdos||Запдос", "Moltres||Молтрес",
        ],
        3: [
          "Ivysaur", "Charmeleon", "Wartortle", "Caterpie", "Metapod", "Butterfree", "Pidgey", "Rattata", "Ekans", "Arbok",
          "Vulpix", "Ninetales", "Zubat", "Golbat", "Geodude", "Slowpoke", "Abra", "Kadabra", "Alakazam", "Machamp", "Cubone",
          "Gastly", "Haunter", "Growlithe", "Arcanine", "Vaporeon", "Jolteon", "Flareon", "Mr. Mime|||Mister Mime",
          "Scyther", "Chansey", "Diglett", "Clefairy", "Ponyta", "Voltorb", "Hitmonlee", "Hitmonchan", "Aerodactyl",
          "Dratini", "Pidgeot",
        ],
        4: [
          "Weedle", "Kakuna", "Beedrill", "Pidgeotto", "Raticate", "Spearow", "Sandshrew", "Sandslash",
          "Nidoran|||Nidoran female|Nidoran male|Nidoran F|Nidoran M", "Nidoking", "Nidoqueen", "Clefable", "Wigglytuff",
          "Oddish", "Gloom", "Paras", "Dugtrio", "Persian", "Golduck", "Mankey", "Primeape", "Poliwag", "Poliwhirl",
          "Machop", "Machoke", "Bellsprout", "Tentacool", "Tentacruel", "Graveler", "Golem", "Rapidash", "Slowbro",
          "Magnemite", "Magneton", "Farfetch'd|||Farfetchd", "Seel", "Grimer", "Muk", "Koffing", "Weezing", "Rhyhorn",
          "Rhydon", "Electrode", "Kangaskhan", "Staryu", "Starmie", "Magmar", "Electabuzz", "Jynx", "Tauros", "Porygon",
          "Omanyte", "Kabuto", "Horsea", "Goldeen", "Lickitung", "Marowak", "Drowzee", "Hypno", "Krabby", "Dragonair",
          "Exeggutor",
        ],
        5: [
          "Fearow", "Nidorino", "Vileplume", "Venonat", "Poliwrath", "Victreebel", "Doduo", "Shellder", "Cloyster",
          "Exeggcute", "Pinsir", "Omastar", "Kabutops",
        ],
        6: [
          "Nidorina", "Parasect", "Venomoth", "Weepinbell", "Dodrio", "Dewgong", "Kingler", "Tangela", "Seadra", "Seaking",
        ],
      },
      reject: ['Pichu', 'Togepi', 'Lucario', 'Mimikyu', 'Greninja', 'Marill', 'Chikorita', 'Cyndaquil', 'Totodile', 'Mewthree', 'Magnezone', 'Scizor', 'Steelix', 'Espeon', 'Umbreon', 'Kingdra', 'Politoed', 'Slowking'],
    },
    {
      id: 'pokemon-legendary',
      q: {
        en: 'Name a Legendary or Mythical Pokémon (to 2024)',
        pl: 'Podaj legendarnego lub mitycznego Pokémona (do 2024)',
        uk: 'Назвіть легендарного чи міфічного покемона (до 2024)',
      },
      answers: {
        1: [
          "Mewtwo||Мьюту", "Mew||Мью", "Lugia||Луґія", "Rayquaza||Рейкваза", "Articuno||Артікуно", "Zapdos||Запдос",
          "Moltres||Молтрес", "Ho-Oh||Хо-Ох",
        ],
        2: [
          "Celebi||Селебі", "Groudon||Граудон", "Kyogre||Кайоґр", "Arceus||Арсеус", "Deoxys||Деоксіс", "Jirachi||Джирачі",
          "Suicune||Суйкун", "Entei||Ентей", "Raikou||Райку", "Darkrai||Даркрай", "Dialga||Діалга", "Palkia||Палкія",
          "Giratina||Гіратина",
        ],
        3: [
          "Latias", "Latios", "Reshiram", "Zekrom", "Kyurem", "Xerneas", "Yveltal", "Zacian", "Zamazenta", "Solgaleo",
          "Lunala", "Necrozma", "Zygarde", "Regirock", "Regice", "Registeel", "Koraidon", "Miraidon", "Eternatus",
          "Victini", "Shaymin", "Manaphy",
        ],
        4: [
          "Heatran", "Regigigas", "Cresselia", "Uxie", "Mesprit", "Azelf", "Cobalion", "Terrakion", "Virizion", "Tornadus",
          "Thundurus", "Landorus", "Genesect", "Meloetta", "Keldeo", "Diancie", "Hoopa", "Volcanion", "Tapu Koko",
          "Tapu Lele", "Tapu Bulu", "Tapu Fini", "Marshadow", "Magearna", "Zeraora", "Meltan", "Melmetal", "Calyrex",
          "Urshifu", "Kubfu", "Zarude", "Phione",
        ],
        5: [
          "Type: Null|||Type Null", "Silvally", "Cosmog", "Regieleki", "Regidrago", "Enamorus", "Wo-Chien", "Chien-Pao",
          "Chi-Yu", "Ogerpon", "Terapagos", "Pecharunt",
        ],
        6: [
          "Cosmoem", "Glastrier", "Spectrier", "Ting-Lu", "Okidogi", "Munkidori", "Fezandipiti",
        ],
      },
      reject: [
        'Lucario', 'Dragonite', 'Gyarados', 'Snorlax', 'Charizard', 'Nihilego', 'Buzzwole', 'Pheromosa', 'Xurkitree',
        'Celesteela', 'Kartana', 'Guzzlord', 'Poipole', 'Naganadel', 'Stakataka', 'Blacephalon', 'Walking Wake',
        'Iron Leaves', 'Gouging Fire', 'Raging Bolt', 'Iron Boulder', 'Iron Crown', 'Mewthree', 'Missingno',
      ],
    },

    // ───────────────────────────── NINTENDO ─────────────────────────────
    {
      id: 'mario-character',
      q: {
        en: 'Name a Super Mario character',
        pl: 'Podaj postać z Super Mario',
        uk: 'Назвіть персонажа Super Mario',
      },
      answers: {
        1: [
          "Mario||Маріо", "Luigi||Луїджі", "Princess Peach|Księżniczka Peach|Принцеса Піч|Peach|Princess Toadstool",
          "Bowser||Боузер|King Koopa", "Yoshi||Йоші", "Toad||Тоад", "Donkey Kong||Донкі Конг|DK", "Wario||Варіо",
        ],
        2: [
          "Waluigi||Валуїджі", "Princess Daisy|Księżniczka Daisy|Принцеса Дейзі|Daisy", "Rosalina||Розаліна|Rosetta",
          "Bowser Jr.||Боузер-молодший|Bowser Junior", "Koopa Troopa||Купа Трупа|Koopa", "Goomba||Гумба",
          "Boo||Бу", "Shy Guy||Шай Гай",
        ],
        3: [
          "Toadette||Тоадетта", "Birdo||Бьордо", "King Boo||Кінг Бу", "Diddy Kong||Дідді Конг", "Kamek||Камек",
          "Lakitu||Лакіту", "Piranha Plant||Рослина-піранья", "Bullet Bill", "Chain Chomp", "Dry Bones",
          "Hammer Bro|||Hammer Brother|Hammer Bros", "Pauline||Полін", "Captain Toad||Капітан Тоад",
          "Professor E. Gadd|||E. Gadd|Elvin Gadd", "Cappy||Кеппі", "Petey Piranha", "Blooper", "Bob-omb", "Thwomp",
          "Wiggler", "Cheep Cheep",
        ],
        4: [
          "Larry Koopa", "Morton Koopa Jr.|||Morton Koopa|Morton", "Wendy O. Koopa|||Wendy Koopa|Wendy",
          "Iggy Koopa", "Roy Koopa", "Lemmy Koopa", "Ludwig von Koopa|||Ludwig Koopa|Ludwig", "Toadsworth", "Nabbit",
          "Luma", "Spiny", "Buzzy Beetle", "Monty Mole", "Pokey", "Whomp", "King Bob-omb", "Boom Boom", "Pom Pom",
          "Dry Bowser", "Baby Mario", "Baby Luigi", "Baby Peach", "Lubba",
        ],
        5: [
          "Fawful", "Cackletta", "Geno", "Mallow", "Smithy", "Count Bleck", "Dimentio", "Goombella", "Kooper", "Vivian",
          "Wart", "Tatanga", "Foreman Spike", "Polari", "Prince Florian", "Pianta", "Noki", "Olivia", "King Olly",
          "Admiral Bobbery|||Bobbery", "Doopliss", "Huey",
        ],
        6: [
          "Mouser", "Tryclyde", "Fryguy", "Clawgrip", "Croco", "Bowyer", "Booster", "Valentina", "Exor", "Poplin",
          "Talking Flower", "Ninji", "Dorrie", "Klepto",
        ],
      },
      reject: ['Link', 'Kirby', 'Sonic', 'Princess Zelda', 'Zelda', 'Samus', 'Pikachu', 'Fox McCloud', 'King K. Rool', 'Funky Kong', 'Cranky Kong', 'Dixie Kong'],
    },
    {
      id: 'zelda-game',
      q: {
        en: 'Name a Legend of Zelda game (to 2024)',
        pl: 'Podaj grę z serii Zelda (do 2024)',
        uk: 'Назвіть гру серії Zelda (до 2024)',
      },
      answers: {
        1: [
          "Breath of the Wild|||BotW|Zelda BotW|The Legend of Zelda: Breath of the Wild",
          "Ocarina of Time|||OoT|Ocarina of Time 3D", "Tears of the Kingdom|||TotK|Breath of the Wild 2|BotW 2",
          "Twilight Princess|||TP|Twilight Princess HD", "Majora's Mask|||Majoras Mask|MM|Majora's Mask 3D",
          "The Wind Waker|||Wind Waker|TWW|Wind Waker HD", "The Legend of Zelda (1986)|||The Legend of Zelda|Zelda|Zelda 1|LoZ",
        ],
        2: [
          "Link's Awakening|||Links Awakening|LA", "A Link to the Past|||Link to the Past|ALttP|LttP",
          "Skyward Sword|||SS|Skyward Sword HD",
        ],
        3: [
          "Echoes of Wisdom|||EoW", "The Minish Cap|||Minish Cap|TMC", "Phantom Hourglass|||PH",
          "Zelda II: The Adventure of Link|||Zelda II|Zelda 2|The Adventure of Link|Adventure of Link",
          "Hyrule Warriors|||HW|Hyrule Warriors Legends|Hyrule Warriors Definitive Edition",
          "Hyrule Warriors: Age of Calamity|||Age of Calamity|AoC", "A Link Between Worlds|||Link Between Worlds|ALBW",
        ],
        4: [
          "Spirit Tracks|||ST", "Oracle of Seasons|||OoS", "Oracle of Ages|||OoA", "Four Swords",
          "Four Swords Adventures|||FSA", "Tri Force Heroes|||Triforce Heroes|TFH", "Cadence of Hyrule|||CoH",
        ],
        5: [
          "Link: The Faces of Evil|||Faces of Evil", "Zelda: The Wand of Gamelon|||Wand of Gamelon",
          "Zelda's Adventure|||Zeldas Adventure", "Link's Crossbow Training|||Links Crossbow Training",
          "BS The Legend of Zelda|||BS Zelda",
        ],
        6: [
          "BS The Legend of Zelda: Ancient Stone Tablets|||Ancient Stone Tablets",
          "Freshly-Picked Tingle's Rosy Rupeeland|||Tingle's Rosy Rupeeland|Rosy Rupeeland",
          "Ripened Tingle's Balloon Trip of Love|||Tingle's Balloon Trip of Love", "My Nintendo Picross: The Legend of Zelda: Twilight Princess|||Picross Twilight Princess",
          "Game & Watch: The Legend of Zelda|||Game and Watch Zelda",
        ],
      },
      reject: ['Age of Imprisonment', 'Hyrule Warriors: Age of Imprisonment', 'Breath of Fire', 'Echoes of Time', 'Twilight Prince Link', 'Ocarina of Light', 'Skyrim', 'Wind Walker Heroes'],
    },

    // ───────────────────────────── FROMSOFTWARE ─────────────────────────────
    {
      id: 'dark-souls-1-boss',
      q: {
        en: 'Name a boss from Dark Souls 1 (incl. DLC)',
        pl: 'Podaj bossa z Dark Souls 1 (z DLC)',
        uk: 'Назвіть боса з Dark Souls 1 (з DLC)',
      },
      answers: {
        1: [
          "Ornstein and Smough||Орнштейн і Смоуг|Ornstein & Smough|Ornstein|Smough|Dragon Slayer Ornstein|Executioner Smough|O&S",
          "Gwyn, Lord of Cinder||Гвін|Gwyn|Lord Gwyn|Гвін",
          "Knight Artorias||Арторіас|Artorias|Artorias the Abysswalker|Арторіас",
          "Asylum Demon",
          "Great Grey Wolf Sif||Сіф|Sif|Сіф",
        ],
        2: [
          "Taurus Demon", "Bell Gargoyles|||Bell Gargoyle|Gargoyles",
          "Capra Demon", "Four Kings|||The Four Kings",
          "Manus, Father of the Abyss||Манус|Manus|Манус", "Seath the Scaleless||Сіт|Seath|Сіт",
        ],
        3: [
          "Gravelord Nito||Ніто|Nito|Ніто", "Chaos Witch Quelaag||Квелаг|Quelaag|Квелаг",
          "Crossbreed Priscilla||Прісцилла|Priscilla|Прісцилла",
          "Black Dragon Kalameet||Каламіт|Kalameet|Каламіт", "Gaping Dragon",
        ],
        4: [
          "Iron Golem", "Bed of Chaos", "Pinwheel||Пінвіл",
          "Stray Demon", "Dark Sun Gwyndolin||Гвіндолін|Gwyndolin|Гвіндолін",
        ],
        5: [
          "Ceaseless Discharge", "Centipede Demon",
          "Moonlight Butterfly",
        ],
        6: [
          "Sanctuary Guardian", "Demon Firesage|||Firesage",
        ],
      },
      reject: [
        'Nameless King', 'Old Iron King', 'Soul of Cinder', 'Gwynevere', 'Havel', 'Havel the Rock', 'Black Knight',
        'Titanite Demon', 'Hellkite Drake', 'Hellkite', 'Solaire', 'Lautrec', 'Kirk', 'Ciaran', 'Gough', 'Smelter Demon',
        'Old Demon King', 'Demon Prince', 'Abyss Watchers', 'Dancer of the Boreal Valley', 'Pontiff Sulyvahn',
        'Slave Knight Gael', 'Gael', 'Sister Friede', 'Aldrich', 'Lothric', 'Lorian', 'Vordt', 'Iudex Gundyr', 'Gundyr',
        'Ornstein the Dragon Slayer Armor', 'Hydra', 'Pursuer', 'Iron Giant',
      ],
    },
    {
      id: 'elden-ring-boss',
      q: {
        en: 'Name an Elden Ring boss (incl. DLC)',
        pl: 'Podaj bossa z Elden Ring (z DLC)',
        uk: 'Назвіть боса з Elden Ring (з DLC)',
      },
      answers: {
        1: [
          "Malenia, Blade of Miquella||Маленія|Malenia|Malenia, Goddess of Rot|Маленія",
          "Margit, the Fell Omen||Марґіт|Margit|Марґіт", "Starscourge Radahn||Радан|Radahn|General Radahn|Радан",
          "Godrick the Grafted||Годрік|Godrick|Годрік",
          "Rennala, Queen of the Full Moon||Ренала|Rennala|Ренала",
        ],
        2: [
          "Morgott, the Omen King||Морґотт|Morgott|Морґотт", "Mohg, Lord of Blood||Моґ|Mohg|Моґ",
          "Rykard, Lord of Blasphemy||Райкард|Rykard|Райкард",
          "Elden Beast", "Radagon of the Golden Order||Радагон|Radagon|Радагон",
          "Maliketh, the Black Blade||Малікет|Maliketh|Beast Clergyman|Малікет",
          "Godfrey, First Elden Lord||Ґодфрі|Godfrey|Hoarah Loux|Ґодфрі",
          "Messmer the Impaler||Мессмер|Messmer|Мессмер",
          "Promised Consort Radahn|||Consort Radahn",
          "Dragonlord Placidusax||Плацидусакс|Placidusax",
        ],
        3: [
          "Tree Sentinel", "Fire Giant", "Astel, Naturalborn of the Void|||Astel",
          "Godskin Duo", "Mimic Tear", "Red Wolf of Radagon", "Royal Knight Loretta|||Loretta", "Crucible Knight",
          "Bayle the Dread|||Bayle", "Rellana, Twin Moon Knight|||Rellana", "Midra, Lord of Frenzied Flame|||Midra",
          "Divine Beast Dancing Lion|||Dancing Lion", "Lichdragon Fortissax|||Fortissax", "Leonine Misbegotten",
          "Night's Cavalry|||Nights Cavalry", "Godskin Apostle", "Godskin Noble", "Fell Twins",
        ],
        4: [
          "Ancestor Spirit", "Regal Ancestor Spirit", "Valiant Gargoyles", "Magma Wyrm Makar|||Makar",
          "Loretta, Knight of the Haligtree", "Commander Niall|||Niall", "Commander O'Neil|||O'Neil",
          "Elemer of the Briar|||Elemer", "Draconic Tree Sentinel", "Flying Dragon Agheel|||Agheel",
          "Glintstone Dragon Smarag|||Smarag", "Erdtree Avatar", "Godefroy the Grafted|||Godefroy",
          "Mohg, the Omen", "Borealis the Freezing Fog|||Borealis", "Sir Gideon Ofnir|||Gideon Ofnir|Gideon",
          "Black Blade Kindred", "Full-Grown Fallingstar Beast|||Fallingstar Beast", "Decaying Ekzykes|||Ekzykes",
          "Ancient Dragon Lansseax|||Lansseax", "Great Wyrm Theodorix|||Theodorix", "Putrescent Knight",
          "Romina, Saint of the Bud|||Romina", "Metyr, Mother of Fingers|||Metyr", "Commander Gaius|||Gaius",
          "Scadutree Avatar", "Golden Hippopotamus", "Rakshasa", "Bell Bearing Hunter", "Death Rite Bird", "Deathbird",
          "Ulcerated Tree Spirit", "Grafted Scion", "Royal Revenant", "Dragonkin Soldier of Nokstella|||Dragonkin Soldier",
          "Esgar, Priest of Blood|||Esgar", "Abductor Virgins", "Black Knife Assassin", "Erdtree Burial Watchdog",
          "Grave Warden Duelist", "Soldier of Godrick", "Crystalian", "Magma Wyrm", "Red Wolf of the Champion",
          "Fia's Champions|||Fias Champions", "Mad Pumpkin Head", "Cemetery Shade",
        ],
        5: [
          "Alecto, Black Knife Ringleader|||Alecto", "Adan, Thief of Fire|||Adan", "Patches", "Bloodhound Knight Darriwil|||Darriwil",
          "Stonedigger Troll", "Spiritcaller Snail", "Necromancer Garris|||Garris", "Kindred of Rot", "Putrid Avatar",
          "Omenkiller", "Ancient Hero of Zamor", "Misbegotten Warrior", "Roundtable Knight Vyke|||Vyke",
          "Battlemage Hugues|||Hugues", "Dryleaf Dane", "Jori, Elder Inquisitor|||Jori", "Ancient Dragon Senessax|||Senessax",
          "Ralva the Great Red Bear|||Ralva", "Death Knight", "Black Knight Garrew|||Garrew",
          "Demi-Human Swordmaster Onze|||Onze", "Jagged Peak Drake", "Tibia Mariner", "Cleanrot Knight",
          "Beastman of Farum Azula", "Demi-Human Queen Gilika|||Gilika", "Perfumer Tricia", "Sanguine Noble",
          "Wormface", 
        ],
        6: [
          "Astel, Stars of Darkness", "High Priest Count Ymir|||Count Ymir|Ymir", "Lamenter", "Chief Bloodfiend",
          "Fire Knight Queelign|||Queelign", "Knight of the Solitary Gate", "Guardian Golem", "Erdtree Burial Watchdog Duo",
          "Demi-Human Chiefs", "Frenzied Duelist", "Onyx Lord", "Alabaster Lord",
          "Mausoleum Knight", "Misbegotten Crusader", "Crystalian Spearman", 
        ],
      },
      reject: [
        'Ranni', 'Ranni the Witch', 'Melina', 'Blaidd', 'Marika', 'Queen Marika', 'Miquella', 'Godwyn', 'Godwyn the Golden',
        'Gwyn', 'Nameless King', 'Fia', 'Iji', 'Hewg', 'Varre', 'White Mask Varre', 'Sellen', 'Torrent', 'Two Fingers',
        'Greater Will', 'Messmer the Impaled', 'Malenia Blade of Michael', 'Mohg the Omen King',
      ],
    },
    {
      id: 'fromsoftware-game',
      q: {
        en: 'Name a FromSoftware game (to 2025)',
        pl: 'Podaj grę studia FromSoftware (do 2025)',
        uk: 'Назвіть гру від FromSoftware (до 2025)',
      },
      answers: {
        1: [
          "Dark Souls|||DS1|Dark Souls 1|Dark Souls Remastered|Dark Souls: Prepare to Die Edition", "Elden Ring|||ER",
          "Bloodborne|||BB", "Sekiro: Shadows Die Twice|||Sekiro", "Dark Souls III|||Dark Souls 3|DS3",
        ],
        2: [
          "Demon's Souls|||Demons Souls|DeS", "Dark Souls II|||Dark Souls 2|DS2|Scholar of the First Sin",
        ],
        3: [
          "Armored Core VI: Fires of Rubicon|||Armored Core 6|AC6|ACVI|Fires of Rubicon", "Armored Core|||AC1|Armored Core 1",
          "Elden Ring Nightreign|||Nightreign",
        ],
        4: [
          "King's Field|||Kings Field", "Déraciné|||Deracine", "Armored Core 4|||AC4", "Armored Core V|||Armored Core 5|AC5|ACV",
          "Armored Core: For Answer|||For Answer", "Metal Wolf Chaos", "Ninja Blade", "Chromehounds",
          "Steel Battalion: Heavy Armor|||Steel Battalion Heavy Armor", "Enchanted Arms",
        ],
        5: [
          "King's Field II|||Kings Field 2", "King's Field III|||Kings Field 3", "King's Field IV|||Kings Field 4|King's Field: The Ancient City",
          "Shadow Tower", "Otogi: Myth of Demons|||Otogi", "Otogi 2: Immortal Warriors|||Otogi 2", "Armored Core 2|||AC2",
          "Armored Core 3|||AC3", "Armored Core: Verdict Day|||Verdict Day", "Armored Core: Last Raven|||Last Raven",
          "Armored Core: Nexus", "Armored Core: Silent Line|||Silent Line", "Echo Night", "Lost Kingdoms|||Rune",
        ],
        6: [
          "Armored Core: Project Phantasma|||Project Phantasma", "Armored Core: Master of Arena|||Master of Arena",
          "Armored Core 2: Another Age|||Another Age", "Armored Core: Nine Breaker|||Nine Breaker",
          "Shadow Tower Abyss", "Evergrace", "Eternal Ring", "Kuon", "Murakumo: Renegade Mech Pursuit|||Murakumo",
          "Frame Gride", "Spriggan: Lunar Verse", "Echo Night 2", "Echo Night: Beyond", "Lost Kingdoms II|||Lost Kingdoms 2",
          
        ],
      },
      reject: [
        'Lords of the Fallen', 'Nioh', 'Nioh 2', 'Hollow Knight', 'Lies of P', 'Mortal Shell', 'Salt and Sanctuary',
        'The Surge', 'Wo Long', 'Code Vein', 'Dark Souls 4', 'Bloodborne 2', 'Demons Souls Remake', 'Sekiro 2',
        'Elden Ring 2', 'Tenchu', 'Black Myth: Wukong', 'Duskbloods', 'The Duskbloods',
      ],
    },

    // ───────────────────────────── FINAL FANTASY ─────────────────────────────
    {
      id: 'final-fantasy-main',
      q: {
        en: 'Name a numbered Final Fantasy (I–XVI)',
        pl: 'Podaj numerowany Final Fantasy (I–XVI)',
        uk: 'Назвіть номерну Final Fantasy (I–XVI)',
      },
      answers: {
        1: [
          "Final Fantasy VII|||Final Fantasy 7|FF7|FFVII|Final Fantasy VII Remake|FF7 Remake",
          "Final Fantasy X|||Final Fantasy 10|FF10|FFX", "Final Fantasy XV|||Final Fantasy 15|FF15|FFXV",
          "Final Fantasy XVI|||Final Fantasy 16|FF16|FFXVI",
        ],
        2: [
          "Final Fantasy VIII|||Final Fantasy 8|FF8|FFVIII", "Final Fantasy IX|||Final Fantasy 9|FF9|FFIX",
          "Final Fantasy XII|||Final Fantasy 12|FF12|FFXII|The Zodiac Age",
        ],
        3: [
          "Final Fantasy XIII|||Final Fantasy 13|FF13|FFXIII", "Final Fantasy XIV|||Final Fantasy 14|FF14|FFXIV|A Realm Reborn",
          "Final Fantasy VI|||Final Fantasy 6|FF6|FFVI|Final Fantasy III (US)",
        ],
        4: [
          "Final Fantasy IV|||Final Fantasy 4|FF4|FFIV|Final Fantasy II (US)", "Final Fantasy|||Final Fantasy I|Final Fantasy 1|FF1|FFI",
        ],
        5: [
          "Final Fantasy V|||Final Fantasy 5|FF5|FFV", "Final Fantasy XI|||Final Fantasy 11|FF11|FFXI|Final Fantasy Online",
          "Final Fantasy III|||Final Fantasy 3|FF3|FFIII",
        ],
        6: ["Final Fantasy II|||Final Fantasy 2|FF2|FFII"],
      },
      reject: [
        'Final Fantasy XIII-2', 'FF13-2', 'Final Fantasy XIII 2', 'Lightning Returns', 'Final Fantasy X-2', 'FFX-2',
        'Final Fantasy X 2', 'Final Fantasy XVII', 'Final Fantasy 17', 'FF17', 'Final Fantasy Tactics', 'Crisis Core',
        'Dissidia', 'Final Fantasy Type-0', 'Final Fantasy VII Rebirth', 'Kingdom Hearts', 'Final Fantasy Origin',
      ],
    },

    // ───────────────────────────── FIGHTING GAMES ─────────────────────────────
    {
      id: 'mortal-kombat-fighter',
      q: {
        en: 'Name a Mortal Kombat fighter (to 2024)',
        pl: 'Podaj wojownika z Mortal Kombat (do 2024)',
        uk: 'Назвіть бійця Mortal Kombat (до 2024)',
      },
      answers: {
        1: [
          "Scorpion||Скорпіон|Hanzo Hasashi", "Sub-Zero||Саб-Зіро|Kuai Liang|Bi-Han", "Liu Kang||Лю Кан",
          "Raiden||Рейден|Rayden", "Sonya Blade||Соня Блейд|Sonya", "Johnny Cage||Джонні Кейдж",
          "Kitana||Кітана", "Shao Kahn||Шао Кан",
        ],
        2: [
          "Mileena||Мілена", "Kano||Кано", "Goro||Горо", "Shang Tsung||Шан Цзун|Shang Cung", "Jax||Джакс|Jax Briggs",
          "Kung Lao||Кун Лао", "Reptile||Рептилія|Syzoth", "Baraka||Барака",
        ],
        3: [
          "Smoke||Смоук", "Noob Saibot||Нуб Сайбот|Noob", "Ermac||Ермак", "Jade||Джейд", "Kabal||Кабал",
          "Nightwolf||Найтвулф", "Sindel||Сіндел", "Sektor||Сектор", "Cyrax||Сайракс", "Quan Chi||Куан Чі",
          "Shinnok||Шіннок", "Cassie Cage||Кессі Кейдж", "Kotal Kahn||Котал Кан", "Kenshi||Кенші", "Frost||Фрост",
        ],
        4: [
          "Stryker|||Kurtis Stryker", "D'Vorah|||DVorah", "Jacqui Briggs|||Jacqui", "Erron Black", "Takeda|||Takeda Takahashi",
          "Kung Jin", "Ferra/Torr|||Ferra|Torr|Ferra and Torr", "Rain", "Sheeva", "Motaro", "Kintaro", "Tanya", "Li Mei",
          "Bo' Rai Cho|||Bo Rai Cho", "Fujin", "Geras", "Cetrion", "Kollector", "Kratos", "Freddy Krueger|||Freddy",
          "Jason Voorhees|||Jason", "Predator", "Terminator|||T-800", "RoboCop", "Joker|||The Joker", "Spawn", "Rambo",
          "Omni-Man", "Homelander", "Peacemaker", "Alien|||Xenomorph", "Leatherface", "Havik", "Tremor", "Skarlet",
          "Triborg",
        ],
        5: [
          "Kira", "Kobra", "Hotaru", "Onaga", "Nitara", "Ashrah", "Reiko", "Sareena", "Shujinko", "Jarek",
          "Khameleon", "Chameleon", "Mavado", "Hsu Hao", "Kai", 
        ],
        6: [
          "Dairou", "Darrius", "Taven", "Daegon", "Blaze", "Moloch", "Drahmin", "Meat", "Mokap", 
        ],
      },
      reject: ['Ryu', 'Ken', 'Batman', 'Superman', 'Conan', 'T-1000', 'Sub Zero Jr', 'Scorpio', 'Kratos God of War', 'Raiden Metal Gear', 'Kung Fu Panda'],
    },
    {
      id: 'street-fighter-fighter',
      q: {
        en: 'Name a Street Fighter fighter (to 2024)',
        pl: 'Podaj wojownika ze Street Fightera (do 2024)',
        uk: 'Назвіть бійця Street Fighter (до 2024)',
      },
      answers: {
        1: [
          "Ryu||Рю", "Ken||Кен|Ken Masters", "Chun-Li||Чун Лі", "Guile||Гайл", "Blanka||Бланка", "Zangief||Зангієф",
          "M. Bison||М. Байсон|Bison|Dictator", "Dhalsim||Дхалсім",
        ],
        2: [
          "E. Honda||Е. Хонда|Edmond Honda|Honda", "Akuma||Акума|Gouki", "Cammy||Кеммі|Cammy White", "Sagat||Сагат",
          "Vega||Вега|Claw", "Balrog||Балрог|Boxer",
        ],
        3: [
          "Sakura||Сакура", "Juri||Джурі", "Dan||Ден|Dan Hibiki", "Fei Long||Фей Лонг", "Dee Jay||Ді Джей", "T. Hawk||Т. Хоук",
          "Luke||Люк", "Karin||Карін", "Rashid||Рашид",
        ],
        4: [
          "Gouken", "Seth", "Rose", "Charlie Nash|||Charlie|Nash", "Cody", "Guy", "R. Mika|||Rainbow Mika|Mika", "Ibuki",
          "Makoto", "Dudley", "Alex", "Abel", "C. Viper|||Crimson Viper|Viper", "Rufus", "El Fuerte", "Jamie", "Kimberly",
          "Manon", "Marisa", "JP", "Lily", "Ed", "Laura", "Necalli", "Menat", "Poison", "Hugo", "Elena", "Yun", "Yang",
        ],
        5: [
          "Gen", "Sodom", "Rolento", "Birdie", "Adon", "Oro", "Urien", "Gill", "Necro", "Twelve", "Q", "Remy", "Sean",
          "Hakan", "Decapre", "F.A.N.G|||FANG", "Zeku", "Falke", "Kolin", "G", "Lucia", "A.K.I.|||AKI",
          "Terry Bogard|||Terry", "Evil Ryu", "Violent Ken", "Juni", "Juli",
        ],
        6: ["Retsu", "Geki", "Joe", "Lee", "Mike", "Eagle", "Ingrid", "Kage", ],
      },
      reject: ['Mai Shiranui', 'Mai', 'Kyo Kusanagi', 'Ryo Sakazaki', 'Ryo', 'Iori', 'Jin Kazama', 'Kazuya', 'Liu Kang', 'Scorpion', 'Chunli Tekken'],
    },

    // ───────────────────────────── ONLINE / MOBA / SANDBOX ─────────────────────────────
    {
      id: 'overwatch-hero',
      q: {
        en: 'Name an Overwatch hero (to 2024)',
        pl: 'Podaj bohatera Overwatch (do 2024)',
        uk: 'Назвіть героя Overwatch (до 2024)',
      },
      answers: {
        1: [
          "Tracer||Трейсер|Lena Oxton", "Mercy||Мерсі|Angela Ziegler", "Reinhardt||Райнгардт|Reinhardt Wilhelm",
          "D.Va||Ді.Ва|Dva|Hana Song", "Genji||Ґендзі|Genji Shimada", "Widowmaker||Відоумейкер|Widow|Amélie Lacroix",
          "Reaper||Жнець|Gabriel Reyes", "Soldier: 76||Солдат-76|Soldier 76|Jack Morrison",
        ],
        2: [
          "Hanzo||Ханзо|Hanzo Shimada", "Mei||Мей", "Winston||Вінстон", "Junkrat||Джанкрет", "Roadhog||Роудгог",
          "Pharah||Фара", "Lúcio||Лусіо|Lucio", "Bastion||Бастіон", "Cassidy||Кессіді|McCree|Cole Cassidy|Jesse McCree",
        ],
        3: [
          "Ana||Ана|Ana Amari", "Zarya||Заря", "Torbjörn||Торб'єрн|Torbjorn|Torb", "Symmetra||Симметра",
          "Zenyatta||Зеньятта", "Sombra||Сомбра", "Moira||Мойра", "Doomfist||Думфіст|Akande Ogundimu",
        ],
        4: [
          "Brigitte||Бріґітта|Brigitte Lindholm", "Orisa||Оріса", "Ashe||Еш", "Baptiste||Батист", "Sigma||Сиґма",
          "Echo||Ехо", "Wrecking Ball||Руйнівна куля|Hammond", "Kiriko||Кіріко",
        ],
        5: ["Sojourn||Соджорн", "Junker Queen||Джанкер Квін", "Ramattra||Раматтра", "Lifeweaver||Лайфвівер", "Illari||Ілларі"],
        6: ["Mauga||Мауґа", "Venture||Венчур", "Juno||Юнона", "Hazard||Гезард"],
      },
      reject: ['Freja', 'Aqua', 'Wuyang', 'Emre', 'Athena', 'Efi', 'Talon', 'Jetpack Cat', 'Tracer Oxton'],
    },
    {
      id: 'minecraft-mob',
      q: {
        en: 'Name a Minecraft mob (to 2024)',
        pl: 'Podaj moba z Minecrafta (do 2024)',
        uk: 'Назвіть моба з Minecraft (до 2024)',
      },
      answers: {
        1: [
          "Creeper|Creeper|Кріпер", "Zombie|Zombie|Зомбі", "Skeleton|Szkielet|Скелет", "Enderman||Ендермен",
          "Spider|Pająk|Павук", "Ender Dragon|||Enderdragon", "Villager|Osadnik|Житель|Wieśniak|Testificate",
          "Pig|Świnia|Свиня",
        ],
        2: [
          "Cow|Krowa|Корова", "Sheep|Owca|Вівця", "Chicken|Kura|Курка|Kurczak", "Wither",
          "Iron Golem|Żelazny golem|Залізний голем", "Ghast", "Slime", "Blaze",
          "Wolf|Wilk|Вовк|Dog|Pies", "Witch|Wiedźma|Відьма", "Warden",
        ],
        3: [
          "Horse|Koń|Кінь", "Cat|Kot|Кіт", "Zombified Piglin|||Zombie Pigman|Pigman",
          "Piglin||Піглін", "Wither Skeleton", "Squid",
          "Bat|Nietoperz|Кажан", "Snow Golem|||Snowman", "Phantom",
          "Drowned", "Magma Cube", "Pillager",
          "Silverfish", "Cave Spider|Pająk jaskiniowy|Печерний павук", "Axolotl|Aksolotl|Аксолотль",
          "Bee|Pszczoła|Бджола", "Fox|Lis|Лисиця", "Rabbit|Królik|Кролик", "Panda||Панда", "Llama|Lama|Лама",
          "Parrot|Papuga|Папуга", "Dolphin|Delfin|Дельфін", "Turtle|Żółw|Черепаха", "Goat|Koza|Коза", "Frog|Żaba|Жаба",
          "Polar Bear|Niedźwiedź polarny|Білий ведмідь", "Ocelot|Ocelot|Оцелот", "Donkey|Osioł|Віслюк",
          "Mooshroom|||Mushroom Cow", "Guardian", "Wandering Trader|Wędrowny handlarz|Мандрівний торговець",
        ],
        4: [
          "Hoglin", "Strider", "Shulker", "Elder Guardian",
          "Evoker", "Vindicator", "Ravager", "Vex",
          "Husk", "Stray", "Endermite", "Allay", "Camel|Wielbłąd|Верблюд",
          "Sniffer", "Mule|Muł|Мул", "Glow Squid",
          "Zombie Villager|Zombie osadnik|Зомбі-житель", "Breeze", "Armadillo",
          "Tadpole|Kijanka|Пуголовок",
        ],
        5: [
          "Piglin Brute", "Zoglin", "Skeleton Horse|Koń-szkielet|Кінь-скелет",
          "Zombie Horse|Koń-zombie|Кінь-зомбі", "Trader Llama", "Bogged",
          "Pufferfish", "Cod|Dorsz|Тріска", "Salmon|Łosoś|Лосось", "Tropical Fish|Ryba tropikalna|Тропічна риба",
          "Creaking",
        ],
        6: ["Illusioner", "Giant", "Killer Bunny|||Killer Rabbit"],
      },
      reject: [
        'Herobrine', 'Steve', 'Alex', 'Notch', 'Wildfire', 'Moobloom', 'Glare', 'Copper Golem', 'Penguin', 'Crab',
        'Rascal', 'Happy Ghast', 'Iceologer', 'Firefly', 'Barnacle', 'Mountain Golem', 'Redstone Monstrosity', 'Wither Storm',
        'Ender Golem', 'Enderwoman',
      ],
    },

    // ───────────────────────────── INDUSTRY ─────────────────────────────
    {
      id: 'game-company',
      q: {
        en: 'Name a video game developer or publisher',
        pl: 'Podaj producenta lub wydawcę gier',
        uk: 'Назвіть розробника чи видавця ігор',
      },
      answers: {
        1: [
          "Nintendo||Нінтендо", "Sony Interactive Entertainment|Sony|Sony|PlayStation Studios|SIE|Соні",
          "Microsoft|Microsoft|Майкрософт|Xbox Game Studios", "Electronic Arts||Електронік Артс|EA|EA Games|EA Sports",
          "Ubisoft||Юбісофт", "Rockstar Games||Рокстар|Rockstar", "CD Projekt||СіДі Проджект|CD Projekt Red|CDPR|CD Projekt RED",
          "Valve||Валв|Valve Corporation",
        ],
        2: [
          "Activision||Активіжн|Activision Blizzard", "Blizzard Entertainment||Близзард|Blizzard", "Bethesda||Бетесда|Bethesda Softworks|Bethesda Game Studios",
          "Square Enix||Сквер Енікс", "Capcom||Капком", "Konami||Конамі", "Sega||Сега", "Bandai Namco||Бандай Намко|Namco",
          "FromSoftware||ФромСофтвер|From Software", "Epic Games||Епік Геймс|Epic", "Riot Games||Райот|Riot", "Techland||Техленд",
        ],
        3: [
          "Naughty Dog", "BioWare", "Bungie", "id Software|||id", "Treyarch", "Infinity Ward", "Insomniac Games|||Insomniac",
          "Santa Monica Studio", "Guerrilla Games|||Guerrilla", "Sucker Punch Productions|||Sucker Punch", "Quantic Dream",
          "Paradox Interactive|||Paradox", "Remedy Entertainment|||Remedy", "11 bit studios||11 біт студіос|11bit|11 bit",
          "Larian Studios|||Larian", "Obsidian Entertainment|||Obsidian", "Mojang", "Take-Two Interactive|||Take-Two|Take Two",
          "2K Games|||2K", "Rare", "Respawn Entertainment|||Respawn", "DICE|||EA DICE", "Kojima Productions",
          "GSC Game World||GSC Game World|GSC", "4A Games||4A Games", "Tencent||Тенсент", "Atari||Атарі", "Bloober Team",
          "People Can Fly|||PCF", "Crytek", "Game Freak", "Atlus", "Supercell", "Rovio", "THQ", "Sierra|||Sierra On-Line",
          "LucasArts", "Westwood Studios|||Westwood", "Blizzard North",
        ],
        4: [
          "CI Games|||City Interactive", "Flying Wild Hog", "Frogwares||Фроґварес", "Firaxis Games|||Firaxis", "Gearbox Software|||Gearbox",
          "Criterion Games|||Criterion", "Codemasters", "Massive Entertainment|||Massive", "Sledgehammer Games|||Sledgehammer",
          "Raven Software", "Arkane Studios|||Arkane", "MachineGames|||Machine Games", "ZeniMax Media|||ZeniMax",
          "Playground Games", "Ninja Theory", "Double Fine Productions|||Double Fine", "Media Molecule", "Team Ninja",
          "Koei Tecmo", "NetEase", "miHoYo|||HoYoverse", "Krafton", "Nexon", "Devolver Digital|||Devolver",
          "Annapurna Interactive", "Focus Entertainment|||Focus Home Interactive", "Warhorse Studios|||Warhorse",
          "Bohemia Interactive", "Starbreeze Studios|||Starbreeze", "Avalanche Studios", "IO Interactive|||IOI",
          "THQ Nordic", "Embracer Group|||Embracer", "Wargaming", "Creative Assembly", "Relic Entertainment|||Relic",
          "Ensemble Studios", "Irrational Games", "Telltale Games|||Telltale", "Hello Games", "Klei Entertainment|||Klei",
          "Rocksteady Studios|||Rocksteady", "NetherRealm Studios|||NetherRealm", "Warner Bros. Games|||WB Games",
          "Monolith Productions", "Bluepoint Games|||Bluepoint", "Housemarque", "Supergiant Games|||Supergiant",
          "Team Cherry", "PlatinumGames|||Platinum Games", "Level-5|||Level 5", "HAL Laboratory|||HAL", "SNK",
          "Taito", "Hudson Soft|||Hudson", "Retro Studios", "Intelligent Systems", "Monolith Soft", "Lionhead Studios|||Lionhead",
          "Bullfrog Productions|||Bullfrog", "Psygnosis",
        ],
        5: [
          "Reality Pump", "The Farm 51", "Destructive Creations", "PlayWay", "Ten Square Games", "Superhot Team",
          "One More Level", "Fool's Theory|||Fools Theory", "Anshar Studios", "Reikon Games", "Best Way||Best Way",
          "Vostok Games||Vostok Games", "Action Forms||Action Forms", "Gaijin Entertainment|||Gaijin", "Facepunch Studios|||Facepunch",
          "Re-Logic", "ConcernedApe", "inXile Entertainment|||inXile", "Frictional Games|||Frictional",
          "Arc System Works", "Spike Chunsoft", "Nippon Ichi Software|||NIS", "Grasshopper Manufacture", "Treasure",
          "Deck13 Interactive|||Deck13", "Hexworks", "Saber Interactive|||Saber", "Paradox Development Studio",
          "Croteam", "Asobo Studio|||Asobo", "Ubisoft Montreal", "Ubisoft Kyiv", "Thunder Lotus",
          "Mimimi Games|||Mimimi", "Piranha Bytes", "Coffee Stain Studios|||Coffee Stain", "Iron Galaxy", "Sumo Digital",
        ],
        6: [
          "Metropolis Software", "Acid Wizard Studio", "Huuuge Games", "Madmind Studio", "Juggler Games", "Polyslash",
          "CreativeForge Games|||CreativeForge", "Red Dot Games", "Empyrean", "Event Horizon", "IMGN.PRO", "Nicolas Games",
          "Muha Games", "Creoteam", "Flying Cafe for Semianimals", "Reflections Interactive", "Looking Glass Studios",
          "Origin Systems", "Ion Storm", "Troika Games", "Black Isle Studios", "Clover Studio", "Silicon Knights",
          "Free Radical Design", "Pandemic Studios", "Neversoft", "Toys for Bob", "Beenox", "High Moon Studios",
          "Vicarious Visions", "Bizarre Creations", "Midway Games|||Midway", "Acclaim Entertainment|||Acclaim",
          "Interplay Entertainment|||Interplay", "Eidos Interactive|||Eidos", "Core Design",
        ],
      },
      reject: ['Steam', 'Epic Games Store', 'Twitch', 'Discord', 'Unity', 'Unreal', 'Nvidia', 'AMD', 'Xbox Live', 'GOG', 'Origin', 'Battle.net', 'Roblox Studio'],
    },

    // ───────────────────────────── POLAND ─────────────────────────────
    {
      id: 'polish-game',
      q: {
        en: 'Name a game made in Poland (to 2024)',
        pl: 'Podaj grę z polskiego studia (do 2024)',
        uk: 'Назвіть гру польської студії (до 2024)',
      },
      answers: {
        1: [
          "The Witcher 3: Wild Hunt|Wiedźmin 3: Dziki Gon|Відьмак 3: Дикий Гін|The Witcher 3|Witcher 3|Wiedźmin 3|Відьмак 3|W3",
          "Cyberpunk 2077||Кіберпанк 2077|Cyberpunk", "The Witcher|Wiedźmin|Відьмак|Witcher 1|Wiedźmin 1",
          "Dying Light", "Frostpunk", "This War of Mine|||TWoM",
        ],
        2: [
          "The Witcher 2: Assassins of Kings|Wiedźmin 2: Zabójcy królów|Відьмак 2: Вбивці королів|The Witcher 2|Witcher 2|Wiedźmin 2|Відьмак 2",
          "Dying Light 2: Stay Human|||Dying Light 2", "Painkiller", "Bulletstorm", "Superhot", "Dead Island",
        ],
        3: [
          "Frostpunk 2", "Layers of Fear", "The Medium", "Sniper: Ghost Warrior|||Sniper Ghost Warrior|Sniper Ghost Warrior Contracts",
          "Call of Juarez", "Shadow Warrior", "Outriders", "Gwent: The Witcher Card Game|Gwint|Гвинт|Gwent",
          "Thronebreaker: The Witcher Tales|Wojna Krwi: Wiedźmińskie opowieści||Thronebreaker|Wojna Krwi",
          "Silent Hill 2 (2024)|||Silent Hill 2 Remake|Silent Hill 2", "Ghostrunner", "Observer|||>observer_", "Two Worlds",
          "Car Mechanic Simulator", "House Flipper",
        ],
        4: [
          "Hard Reset", "Get Even", "Chernobylite", "Blair Witch", "Call of Juarez: Gunslinger|||Gunslinger",
          "Call of Juarez: Bound in Blood|||Bound in Blood", "Darkwood", "Ruiner", "Hatred", "The Thaumaturge",
          "Ancestors Legacy", "Anomaly: Warzone Earth|||Anomaly Warzone Earth", "Thief Simulator", "Dead Island: Riptide|||Riptide",
          "Earth 2150", "Gorky 17", "Phantom Doctrine", "Hard West", "We. The Revolution|||We the Revolution",
          "Ghostrunner 2", "Two Worlds II|||Two Worlds 2", "Superhot: Mind Control Delete",
          "Shadow Warrior 2", "Shadow Warrior 3", "Bulletstorm: Full Clip Edition", 
        ],
        5: [
          "Teenagent", "The Prince and the Coward|Książę i Tchórz", "Afterfall: InSanity|||Afterfall",
          "Enemy Front", "Gamedec", "Thea: The Awakening|||Thea", "Chrome", "Xpand Rally", "Agony", "My Memory of Us",
          "Seven: The Days Long Gone|||Seven", "Tower of Time", "Earth 2140", "Earth 2160", "Painkiller: Hell & Damnation",
          "The Chronicles of Myrtana: Archolos|Kroniki Myrtany: Archolos||Archolos|Kroniki Myrtany", 
          
        ],
        6: [
          "Crime Cities", "Mad Riders", "Mortyr", 
          "Inner Chains", "Hellish Quart", "Steel Rats", "Zombie Driver",
        ],
      },
      reject: [
        'Euro Truck Simulator', 'Euro Truck Simulator 2', 'Kingdom Come: Deliverance', 'Kingdom Come', 'Mafia', 'Gothic',
        'ARMA', 'Hollow Knight', 'Dead Island 2', 'Metro 2033', 'STALKER', 'Hellraid', 'Dying Light: The Beast',
        'Dying Light 3', 'The Witcher 4', 'Witcher 4', 'Wiedźmin 4', 'Cyberpunk 2', 'Mount & Blade', 'Farming Simulator',
      ],
    },
    {
      id: 'witcher-character',
      q: {
        en: 'Name a character from The Witcher',
        pl: 'Podaj postać z Wiedźmina',
        uk: 'Назвіть персонажа з «Відьмака»',
      },
      answers: {
        1: [
          "Geralt of Rivia|Geralt z Rivii|Геральт із Рівії|Geralt|Геральт|White Wolf|Biały Wilk|Gwynbleidd",
          "Yennefer of Vengerberg|Yennefer z Vengerbergu|Єннефер із Венгерберга|Yennefer|Yen|Йеннефер",
          "Ciri|Ciri|Цірі|Cirilla|Zireael|Cirilla Fiona Elen Riannon", "Dandelion|Jaskier|Любисток",
          "Triss Merigold||Трісс Мерігольд|Triss", "Roach|Płotka|Плітка",
        ],
        2: [
          "Vesemir||Весемир", "Zoltan Chivay||Золтан Хівай|Zoltan", "Lambert||Ламберт", "Eskel||Ескель",
          "Emhyr var Emreis||Емгир вар Емрейс|Emhyr|Duny|Jeż z Erlenwaldu|Urcheon", "Eredin||Ередін|Eredin Bréacc Glas",
          "Regis|Emiel Regis|Регіс|Emiel Regis Rohellec Terzieff-Godefroy",
        ],
        3: [
          "Keira Metz||Кейра Мец|Keira", "Philippa Eilhart|Filippa Eilhart|Філіппа Ейльгарт|Philippa", "Sigismund Dijkstra||Сигізмунд Дійкстра|Dijkstra",
          "Radovid V|Radowid V|Радовид|Radovid|Radowid", "Foltest||Фольтест", "Iorveth|Iorweth|Йорвет",
          "Vernon Roche||Вернон Рош|Roche", "Letho of Gulet|Letho z Gulety|Лето з Гулети|Letho",
          "Gaunter O'Dimm|Gaunter O'Dimm|Гюнтер О'Дім|Man of Glass|Pan Lusterko|Master Mirror|O'Dimm",
          "Olgierd von Everec||Ольгерд фон Еверек|Olgierd", "Bloody Baron|Krwawy Baron|Кривавий Барон|Phillip Strenger|Filip Strenger",
          "Cerys an Craite||Керіс ан Крайт|Cerys", "Avallac'h||Аваллак'х|Avallach", "Calanthe||Каланте",
          "Milva||Мільва", "Cahir||Кагір|Cahir Mawr Dyffryn aep Ceallach", "Shani||Шані", "Imlerith||Імлеріт",
          "Caranthir||Карантір", "Anna Henrietta||Анна Генрієтта|Anarietta", "Dettlaff||Детлафф|Detlaff|Dettlaff van der Eretein",
          "Syanna||Сіанна|Sylvia Anna",
        ],
        4: [
          "Vilgefortz|Vilgefortz z Roggeveen|Вільгефорц", "Leo Bonhart||Лео Бонарт|Bonhart", "Angoulême||Ангулема|Angouleme",
          "Stregobor||Стреґобор", "Renfri||Ренфрі", "Tissaia de Vries||Тіссая де Фріс|Tissaia", "Fringilla Vigo||Фрінгілья Віго|Fringilla",
          "Francesca Findabair||Франческа Фіндабаїр|Francesca|Enid an Gleanna", "Pavetta||Павета", "Mousesack|Myszowór|Мишовур|Ermion",
          "Hjalmar an Craite||Яльмар ан Крайт|Hjalmar", "Crach an Craite||Крах ан Крайт|Crach", "Saskia|Saskia|Саскія|Saesenthessis",
          "Síle de Tansarville||Шиле де Тансервіль|Sile", "Nenneke||Ненеке", "Yarpen Zigrin||Ярпен Зіґрін|Yarpen",
          "Ves||Вес", "Margarita Laux-Antille||Маргарита Ло-Антіль|Margarita", "Ida Emean||Іда Емеан",
          "Jacques de Aldersberg||Жак де Альдерсберг", "Azar Javed||Азар Явед", "Alvin||Альвін", "Uma||Ума",
          "Morvran Voorhis||Морвран Воргіс", "Whoreson Junior||Джуніор|Junior",
          "Corinne Tilly||Корінна Тіллі", "Dudu Biberveldt|Dudu|Дуду|Dudu", "Ge'els||Ґеельс|Geels",
        ],
        5: [
          "Jarre||Ярре", "Mistle||Містле", "Kayleigh||Кайлі", "Giselher||Гізельгер", "Reef||Риф", "Asse||Ассе",
          "Iskra|Iskra|Іскра|Spark", "Coën||Коен|Coen", "Lytta Neyd|Koral|Літта Нейд|Coral",
          "Istredd||Істредд", "Borch Three Jackdaws|Borch Trzy Kawki|Борх Три Галки|Borch|Villentretenmerth",
          "Essi Daven|Oczko|Ессі Давен|Little Eye", "Eist Tuirseach||Ейст Туірсеах|Eist", "Visenna||Візенна",
          "Sabrina Glevissig||Сабріна Глевіссіг", "Assire var Anahid||Ассіре вар Анагід", "Fercart||Феркарт",
          "Artaud Terranova||Арто Терранова", "Rience||Ріенс", "Lydia van Bredevoort||Лідія ван Бредеворт",
          "Stefan Skellen|Stefan Skellen|Стефан Скеллен|Puszczyk|Tawny Owl", "Nimue||Німуе", "Condwiramurs||Кондвірамурс",
          "Henselt||Генсельт", "Demavend||Демавенд", "Meve||Меве", "Brouver Hoog||Броувер Гоог",
        ],
        6: [
          "Vysogota of Corvo|Wysogota z Corvo|Висогота з Корво|Vysogota|Wysogota", "Eithné||Ейтне|Eithne",
          "Braenn||Браенн", "Freixenet||Фрейксенет", "Nivellen||Нівеллен", "Falwick||Фалвік", "Duke Vimme Vivaldi|Vimme Vivaldi|Вімме Вівальді|Vivaldi",
          "Toruviel||Торувієль", "Filavandrel aén Fidháil|Filavandrel|Філавандрель|Filavandrel",
          "Codringher||Кодрінгер", "Fenn||Фенн", "Kalkstein||Калькштайн", "Thaler||Талер", "Berengar||Беренгар",
        ],
      },
      reject: ['Henry Cavill', 'Kaer Morhen', 'Novigrad', 'Toussaint', 'Nilfgaard', 'Witcher', 'Wiedźmin', 'Sapkowski', 'Andrzej Sapkowski', 'Jaskier the bard Dandelion', 'Gerald of Rivia'],
    },
    {
      id: 'cyberpunk-character',
      q: {
        en: 'Name a Cyberpunk 2077 character',
        pl: 'Podaj postać z Cyberpunka 2077',
        uk: 'Назвіть персонажа Cyberpunk 2077',
      },
      answers: {
        1: [
          "V||Ві|Vincent|Valerie", "Johnny Silverhand||Джонні Сільвергенд|Johnny|Silverhand|Robert John Linder",
          "Judy Alvarez||Джуді Альварес|Judy", "Panam Palmer||Панам Палмер|Panam", "Jackie Welles||Джекі Веллс|Jackie",
        ],
        2: [
          "Adam Smasher||Адам Смешер|Smasher", "Goro Takemura||Ґоро Такемура|Takemura", "Kerry Eurodyne||Керрі Євродайн|Kerry",
          "River Ward||Рівер Ворд|River", "Viktor Vektor||Віктор Вектор|Viktor|Vik", "Evelyn Parker||Евелін Паркер|Evelyn",
        ],
        3: [
          "Rogue Amendiares||Роуґ Амендіарес|Rogue", "Dexter DeShawn||Декстер Дешон|Dex", "T-Bug||Ті-Баґ|TBug",
          "Misty Olszewski||Місті Ольшевскі|Misty", "Alt Cunningham||Альт Каннінгем|Alt", "Saburo Arasaka||Сабуро Арасака|Saburo",
          "Yorinobu Arasaka||Йорінобу Арасака|Yorinobu", "Hanako Arasaka||Ханако Арасака|Hanako", "Songbird||Сонгберд|So Mi",
          "Solomon Reed||Соломон Рід|Reed", "Delamain||Деламейн", "Claire Russell||Клер Рассел|Claire",
        ],
        4: [
          "Meredith Stout||Мередіт Стаут|Meredith", "Royce||Ройс", "Dum Dum||Дам-Дам", "Placide||Пласід",
          "Kurt Hansen||Курт Хансен|Hansen", "Mr. Blue Eyes||Містер Блакитні Очі|Blue Eyes", "Mama Welles||Мама Веллс",
          "Brigitte||Бріжит", "Lizzy Wizzy||Ліззі Віззі", "Mr. Hands||Містер Хендс", "Rosalind Myers||Розалінд Маєрс|Myers",
          "Padre||Падре|Sebastian Ibarra", "Wakako Okada||Вакако Окада|Wakako", "Jefferson Peralez||Джефферсон Пералес|Peralez",
          "Saul Bright||Сол Брайт|Saul", "Mitch Anderson||Мітч Андерсон|Mitch", "Oda||Ода", "Anders Hellman||Андерс Гелман|Hellman",
          "Sasquatch||Сасквоч", "Nix||Нікс", "Fingers||Фінгерс", "Woodman||Вудмен",
        ],
        5: [
          "Brendan||Брендан", "Denny||Денні", "Nancy Hartley||Ненсі Гартлі|Bes Isis", "Henry||Генрі", "Elizabeth Peralez||Елізабет Пералес",
          "Alex||Алекс", "Dakota Smith||Дакота Сміт|Dakota", "Regina Jones||Реджина Джонс|Regina",
          "Garry the Prophet||Ґаррі Пророк|Garry",
        ],
        6: [ "Barry Lewis||Баррі Льюїс|Barry", "Joshua Stephenson||Джошуа Стівенсон|Joshua", "Lucius Rhyne||Луціус Райн|Rhyne", "Ozob Bozo||Озоб Бозо|Ozob", "Aurore Cassel||Аврора Кассель|Aurore",
        ],
      },
      reject: ['Keanu Reeves', 'Lucy', 'David Martinez', 'Rebecca', 'Maine', 'Kiwi', 'Faraday', 'Geralt', 'Morgan Blackhand'],
    },

    // ───────────────────────────── UKRAINE ─────────────────────────────
    {
      id: 'ukrainian-game',
      q: {
        en: 'Name a game made in Ukraine (to 2024)',
        pl: 'Podaj grę z ukraińskiego studia (do 2024)',
        uk: 'Назвіть гру української студії (до 2024)',
      },
      answers: {
        1: [
          "S.T.A.L.K.E.R.: Shadow of Chernobyl|S.T.A.L.K.E.R.: Cień Czarnobyla|S.T.A.L.K.E.R.: Тінь Чорнобиля|STALKER|Shadow of Chernobyl|Cień Czarnobyla|Тінь Чорнобиля|Сталкер",
          "S.T.A.L.K.E.R. 2: Heart of Chornobyl||S.T.A.L.K.E.R. 2: Серце Чорнобиля|STALKER 2|Heart of Chornobyl|Heart of Chernobyl|Сталкер 2",
          "Metro 2033||Метро 2033", "Metro Exodus||Метро Exodus",
          "Cossacks: European Wars|Kozacy: Europejskie Boje|Козаки: Європейські війни|Cossacks|Kozacy|Козаки",
        ],
        2: [
          "S.T.A.L.K.E.R.: Call of Pripyat|S.T.A.L.K.E.R.: Zew Prypeci|S.T.A.L.K.E.R.: Поклик Прип'яті|Call of Pripyat|Zew Prypeci|Поклик Прип'яті",
          "S.T.A.L.K.E.R.: Clear Sky|S.T.A.L.K.E.R.: Czyste Niebo|S.T.A.L.K.E.R.: Чисте небо|Clear Sky|Czyste Niebo|Чисте небо",
          "Metro: Last Light|||Metro Last Light|Last Light",
        ],
        3: [
          "Cossacks 3|Kozacy 3|Козаки 3", "Cossacks II: Napoleonic Wars|Kozacy II: Wojny napoleońskie|Козаки 2: Наполеонівські війни|Cossacks 2|Kozacy 2|Козаки 2",
          "The Sinking City", "Men of War", "American Conquest",
          "Sherlock Holmes: Chapter One|||Sherlock Holmes Chapter One",
        ],
        4: [
          "Sherlock Holmes: Crimes & Punishments|||Crimes and Punishments|Crimes & Punishments", "Sherlock Holmes: The Devil's Daughter|||The Devil's Daughter",
          "Soldiers: Heroes of World War II|||Soldiers Heroes of World War 2", "Heroes of Annihilated Empires",
          "Alexander||Олександр", "Cryostasis|||Cryostasis: Sleep of Reason", "Collapse", "Survarium", "Fear the Wolves",
          "Sherlock Holmes Versus Jack the Ripper|||Sherlock Holmes vs Jack the Ripper",
          "Sherlock Holmes Versus Arsène Lupin|||Sherlock Holmes vs Arsene Lupin", "Metro Redux",
        ],
        5: [
          "Vivisector: Beast Within|||Vivisector", "Chasm: The Rift|||Chasm The Rift", "Magrunner: Dark Pulse|||Magrunner",
          "Cradle", "Firestarter", "Sherlock Holmes: The Awakened|||The Awakened", "Dracula: Origin",
          "Cossacks: Back to War|||Back to War", "Cossacks: The Art of War|||The Art of War",
          
        ],
        6: [
          "Journey to the Center of the Earth", "80 Days", "Sherlock Holmes: The Silver Earring|||The Silver Earring",
          "Sherlock Holmes: The Mystery of the Mummy|||Mystery of the Mummy",
          "Codename: Outbreak|||Venom. Codename: Outbreak",
          "Sherlock Holmes: Nemesis",
        ],
      },
      reject: [
        'Metro Awakening', 'Chernobylite', 'Atomic Heart', 'Pathologic', 'Escape from Tarkov', 'Tarkov', 'Sea Dogs',
        'Hello Neighbor', 'Kingdom Come', 'Cyberpunk 2077', 'Frostpunk', 'World of Tanks', 'Blitzkrieg', 'Call of Cthulhu',
        'Fallout', 'STALKER 3', 'Metro 2034', 'Metro 2035', 'War Thunder',
      ],
    },

    // ───────────────────────────── ACTION ─────────────────────────────
    {
      id: 'gta-protagonist',
      q: {
        en: 'Name a GTA protagonist (to 2024)',
        pl: 'Podaj protagonistę serii GTA (do 2024)',
        uk: 'Назвіть протагоніста серії GTA (до 2024)',
      },
      answers: {
        1: [
          "Carl Johnson||Карл Джонсон|CJ|Carl", "Tommy Vercetti||Томмі Версетті|Tommy", "Niko Bellic||Ніко Беллік|Niko",
          "Michael De Santa||Майкл Де Санта|Michael|Michael Townley", "Franklin Clinton||Франклін Клінтон|Franklin",
          "Trevor Philips||Тревор Філіпс|Trevor",
        ],
        2: ["Claude||Клод|Claude (GTA III)"],
        3: ["Toni Cipriani||Тоні Сіпріані|Toni", "Victor Vance||Віктор Венс|Vic Vance|Vic", "Huang Lee||Хуанг Лі|Huang"],
        4: ["Johnny Klebitz||Джонні Клебіц|Johnny", "Luis Lopez||Луїс Лопес|Luis|Luis Fernando Lopez"],
        5: ["Claude Speed||Клод Спід", "Mike||Майк|Mike (GTA Advance)"],
        6: ["Kivlov||Ківлов", "Mikki||Міккі", "Travis||Тревіс", "Ulrika||Ульріка", "Bubba||Бабба", "Troy||Трой", "Katie||Кеті", "Divine||Дівайн"],
      },
      reject: ['Lucia', 'Jason', 'Jason Duval', 'Lucia Caminos', 'Big Smoke', 'Ryder', 'Lamar', 'Roman', 'Roman Bellic', 'Lester', 'Sweet', 'Tommy Shelby', 'Ken Rosenberg', 'Catalina'],
    },
    {
      id: 'call-of-duty-title',
      q: {
        en: 'Name a Call of Duty game (to 2024)',
        pl: 'Podaj grę z serii Call of Duty (do 2024)',
        uk: 'Назвіть гру серії Call of Duty (до 2024)',
      },
      answers: {
        1: [
          "Call of Duty 4: Modern Warfare|||Modern Warfare|CoD4|CoD 4|MW|Call of Duty Modern Warfare|Modern Warfare 2019|CoD MW",
          "Call of Duty: Black Ops|||Black Ops|BO1|Black Ops 1", "Call of Duty: Modern Warfare 2|||Modern Warfare 2|Modern Warfare II|MW2|MWII",
          "Call of Duty: Warzone|||Warzone|Warzone 2.0|Warzone 2|WZ", "Call of Duty: Modern Warfare 3|||Modern Warfare 3|Modern Warfare III|MW3|MWIII",
        ],
        2: [
          "Call of Duty: Black Ops II|||Black Ops 2|Black Ops II|BO2", "Call of Duty: Black Ops III|||Black Ops 3|Black Ops III|BO3",
          "Call of Duty: World at War|||World at War|WaW", "Call of Duty 2|||CoD2|CoD 2", "Call of Duty: Ghosts|||Ghosts",
          "Call of Duty: WWII|||WWII|WW2|Call of Duty WW2",
        ],
        3: [
          "Call of Duty: Black Ops 4|||Black Ops 4|BO4", "Call of Duty: Black Ops Cold War|||Black Ops Cold War|Cold War|BOCW",
          "Call of Duty: Advanced Warfare|||Advanced Warfare|AW", "Call of Duty: Infinite Warfare|||Infinite Warfare|IW",
          "Call of Duty: Vanguard|||Vanguard", "Call of Duty (2003)|||Call of Duty|CoD1|CoD 1|Call of Duty 1",
          "Call of Duty: Black Ops 6|||Black Ops 6|BO6|Black Ops VI", "Call of Duty: Mobile|||CoD Mobile|Call of Duty Mobile",
        ],
        4: [
          "Call of Duty 3|||CoD3|CoD 3", "Call of Duty: United Offensive|||United Offensive",
          "Call of Duty: Modern Warfare Remastered|||Modern Warfare Remastered|MWR", "Call of Duty: Warzone Mobile|||Warzone Mobile",
        ],
        5: [
          "Call of Duty 2: Big Red One|||Big Red One", "Call of Duty: Finest Hour|||Finest Hour",
          "Call of Duty: Roads to Victory|||Roads to Victory", "Call of Duty: Black Ops – Declassified|||Black Ops Declassified|Declassified",
          "Call of Duty: Modern Warfare 2 Campaign Remastered|||MW2 Campaign Remastered|Modern Warfare 2 Campaign Remastered",
        ],
        6: [
          "Call of Duty: World at War – Final Fronts|||Final Fronts", "Call of Duty: Modern Warfare – Mobilized|||Mobilized",
          "Call of Duty: Modern Warfare – Reflex Edition|||Reflex Edition|Modern Warfare Reflex", "Call of Duty: Strike Team|||Strike Team",
          "Call of Duty: Heroes|||CoD Heroes", "Call of Duty: Black Ops Zombies|||Black Ops Zombies",
          "Call of Duty: Modern Warfare 3 – Defiance|||Defiance", "Call of Duty: Zombies",
        ],
      },
      reject: [
        'Black Ops 7', 'Black Ops VII', 'Black Ops 5', 'Modern Warfare 4', 'Modern Warfare IV', 'MW4', 'BO7', 'BO5',
        'Battlefield', 'Medal of Honor', 'Call of Juarez', 'Call of Cthulhu', 'Warzone 3', 'Black Ops Cold War 2',
      ],
    },
    {
      id: 'game-engine',
      q: {
        en: 'Name a video game engine',
        pl: 'Podaj silnik gier wideo',
        uk: 'Назвіть ігровий рушій',
      },
      answers: {
        1: [
          "Unreal Engine||Анріл Енджин|Unreal|UE|UE4|UE5|Unreal Engine 4|Unreal Engine 5", "Unity||Юніті|Unity3D|Unity Engine",
          "Godot||Ґодо|Godot Engine", "CryEngine||КрайЕнджин|Cry Engine", "Source||Сорс|Source Engine",
          "Frostbite||Фростбайт|Frostbite Engine",
        ],
        2: [
          "RE Engine||RE Енджин|Reach for the Moon Engine", "id Tech||айді Тек|idTech|id Tech 6|id Tech 7",
          "Creation Engine||Крієйшн Енджин|Creation Engine 2", "REDengine||РЕДенджин|RED Engine|REDengine 4",
          "RAGE|||Rockstar Advanced Game Engine", "GameMaker||ГеймМейкер|GameMaker Studio|Game Maker",
        ],
        3: [
          "Source 2|||Source2", "Decima||Децима|Decima Engine", "Anvil||Енвіл|AnvilNext|Anvil Engine", "Snowdrop||Сноудроп",
          "RPG Maker||RPG Мейкер", "Gamebryo||Геймбрайо", "Fox Engine||Фокс Енджин", "Luminous Engine||Люмінос Енджин|Luminous",
          "Chrome Engine||Хром Енджин|C-Engine", "X-Ray Engine||Ікс-Рей|X-Ray|XRay", "4A Engine||4A Енджин",
          "Construct||Констракт|Construct 3", "Doom engine|||id Tech 1", "Quake engine|||Quake Engine",
        ],
        4: [
          "GoldSrc|||GoldSource|Gold Source", "Build engine|||Build", "Dunia Engine|||Dunia", "IW engine|||IW", "Glacier|||Glacier 2",
          "Northlight Engine|||Northlight", "Clausewitz Engine|||Clausewitz", "Amazon Lumberyard|||Lumberyard",
          "Infinity Engine", "Ren'Py|||Renpy", "Defold", "Cocos2d|||Cocos Creator|Cocos", "MonoGame", "Microsoft XNA|||XNA",
          "Havok Vision Engine|||Vision Engine", "Open 3D Engine|||O3DE",
        ],
        5: [
          "Dagor Engine|||Dagor", "Serious Engine", "LithTech", "Torque|||Torque 3D|Torque Game Engine", "Aurora Engine",
          "Odyssey Engine", "Slipspace Engine|||Slipspace", "Blam!|||Blam", "Crystal Tools", "Void Engine", "Foundation Engine",
          "Apex Engine|||Avalanche Engine", "Bitsquid|||Autodesk Stingray|Stingray", "LÖVE|||Love2D|LOVE", "Phaser", "Bevy",
          "Adventure Game Studio|||AGS", "SCUMM", "Panda3D", "Twine", "Ego Engine|||EGO", "ForzaTech", "Disrupt Engine",
          "Real Virtuality", "Enfusion", "Solar2D|||Corona SDK", "Kex Engine|||Kex", "jMonkeyEngine",
        ],
        6: [
          "Jade Engine", "Asura Engine", "Vengeance Engine", "Diesel Engine|||Diesel", "Sith Engine", "Jedi Engine", "Freescape", "AGI|||Adventure Game Interpreter",
          "SCI|||Sierra Creative Interpreter", "Z-machine", "Irrlicht", "Cube 2|||Sauerbraten",
          "Clickteam Fusion|||Multimedia Fusion|Klik & Play", "Stencyl", "GDevelop", 
        ],
      },
      reject: ['Havok', 'PhysX', 'Hammer', 'Hammer Editor', 'DirectX', 'OpenGL', 'Vulkan', 'Steam', 'Blender', 'Maya', 'Photoshop', 'Roblox', 'Minecraft', 'Unreal Tournament'],
    },
    {
      id: 'battle-royale-game',
      q: {
        en: 'Name a battle royale game (to 2024)',
        pl: 'Podaj grę battle royale (do 2024)',
        uk: 'Назвіть гру жанру battle royale (до 2024)',
      },
      answers: {
        1: [
          "Fortnite||Фортнайт|Fortnite Battle Royale", "PUBG: Battlegrounds||ПАБГ|PUBG|PlayerUnknown's Battlegrounds|Battlegrounds",
          "Apex Legends||Апекс Леджендс|Apex", "Call of Duty: Warzone|||Warzone|CoD Warzone|Warzone 2.0", "Free Fire||Фрі Фаєр|Garena Free Fire",
          "Fall Guys||Фол Гайз|Fall Guys: Ultimate Knockout",
        ],
        2: [
          "H1Z1|||Z1 Battle Royale|King of the Kill", "Realm Royale", "Spellbreak", "Naraka: Bladepoint|||Naraka",
          "PUBG Mobile|||Battlegrounds Mobile India|BGMI", "Call of Duty: Black Ops 4 – Blackout|||Blackout",
          "Battlefield V – Firestorm|||Firestorm|Battlefield Firestorm", "Tetris 99", "Stumble Guys",
        ],
        3: [
          "Super Mario Bros. 35|||Super Mario Bros 35", "Pac-Man 99|||Pac Man 99", "Hyper Scape", "Ring of Elysium",
          "Rules of Survival", "Knives Out", "The Culling", "Darwin Project", "Super Animal Royale",
          "Totally Accurate Battlegrounds|||TABG", "Vampire: The Masquerade – Bloodhunt|||Bloodhunt", "Farlight 84",
          "Call of Duty: Mobile|||CoD Mobile",
        ],
        4: [
          "Islands of Nyne", "Super People", "Battlelands Royale", "Ark: Survival of the Fittest|||Survival of the Fittest",
          "Rumbleverse", "Call of Duty: Warzone Mobile|||Warzone Mobile", "Cuisine Royale", "Fear the Wolves",
          "F-Zero 99|||F Zero 99", "Super Bomberman R Online", "Creative Destruction", "Battlerite Royale",
        ],
        5: [
          "Last Tide", "Paladins: Battlegrounds|||Paladins Battlegrounds", "Dying Light: Bad Blood|||Bad Blood",
          "Planetside Arena", "Danger Zone|||CS:GO Danger Zone",
          "Grand Theft Auto Online: Motor Wars|||Motor Wars",
        ],
        6: [
          "SOS|||SOS: The Ultimate Escape", "Mini Royale: Nations|||Mini Royale",
          "Population: One|||Population One", "Cyber Hunter", "Sausage Man", "Pubg Lite|||PUBG Lite",
        ],
      },
      reject: [
        'Escape from Tarkov', 'Tarkov', 'Dead by Daylight', 'Among Us', 'Counter-Strike', 'Valorant', 'Overwatch',
        'League of Legends', 'Hunger Games', 'Battlefield 2042', 'Rust', 'DayZ', 'Mavericks', 'Hunt Showdown',
      ],
    },

    // ───────────────────────────── SEGA ─────────────────────────────
    {
      id: 'sonic-character',
      q: {
        en: 'Name a Sonic the Hedgehog character',
        pl: 'Podaj postać z gier o Sonicu',
        uk: 'Назвіть персонажа з ігор про Соніка',
      },
      answers: {
        1: [
          "Sonic||Сонік|Sonic the Hedgehog", "Tails||Тейлз|Miles Prower|Miles \"Tails\" Prower", "Knuckles||Наклз|Knuckles the Echidna",
          "Dr. Eggman||Доктор Еґман|Eggman|Dr. Robotnik|Robotnik|Ivo Robotnik", "Shadow||Шедоу|Shadow the Hedgehog",
          "Amy Rose||Емі Роуз|Amy",
        ],
        2: [
          "Rouge the Bat||Руж|Rouge", "Silver the Hedgehog||Сільвер|Silver", "Metal Sonic||Метал Сонік", "Cream the Rabbit||Крім|Cream",
          "Blaze the Cat||Блейз|Blaze", "Big the Cat||Біг|Big", "Chaos||Хаос",
        ],
        3: [
          "E-123 Omega||Омега|Omega", "Espio the Chameleon||Еспіо|Espio", "Vector the Crocodile||Вектор|Vector",
          "Charmy Bee||Чармі|Charmy", "Cheese||Чіз", "Infinite||Інфініт", "Tikal||Тікал|Tikal the Echidna",
          "Mephiles the Dark||Мефілес|Mephiles", "Orbot||Орбот", "Cubot||Кубот", "Zavok||Завок", "Sage||Сейдж",
          "Jet the Hawk||Джет|Jet", "Wave the Swallow||Вейв|Wave", "Storm the Albatross||Шторм|Storm",
        ],
        4: [
          "Mighty the Armadillo||Майті|Mighty", "Ray the Flying Squirrel||Рей|Ray", "Sticks the Badger||Стікс|Sticks",
          "E-102 Gamma||Гамма|Gamma", "Maria Robotnik||Марія Роботнік|Maria", "Gerald Robotnik||Джеральд Роботнік|Gerald",
          "Black Doom||Блек Дум", "Marine the Raccoon||Марін|Marine", "Emerl||Емерл", "Eggman Nega||Еґман Неґа",
          "Iblis||Ібліс", "Princess Elise||Принцеса Еліза|Elise", "Dark Gaia||Темна Гея", "Chip||Чіп|Light Gaia",
          "Zazz||Зазз", "Zeena||Зіна", "Zomom||Зомом", "Master Zik||Майстер Зік|Zik", "Zor||Зор", "Shade the Echidna||Шейд|Shade",
          "Fang the Sniper||Фенг|Fang|Nack the Weasel|Nack", "Bean the Dynamite||Бін|Bean", "Bark the Polar Bear||Барк|Bark",
        ],
        5: [
          "Merlina||Мерліна", "Erazor Djinn||Еразор Джин|Erazor", "Shahra||Шахра", "Hard Boiled Heavies||Хард Бойлд Гевіз",
          "Heavy King||Геві Кінг", "E-100 Alpha||Альфа|Zero|E-100 Zero", "Captain Whisker||Капітан Віскер|Whisker",
          "Johnny||Джонні", "Pachacamac||Пачакамак",
          "Froggy||Фроггі", "Biolizard||Біоящір|Prototype Biolizard", "Mecha Sonic||Меха Сонік|Silver Sonic",
          "Bocoe and Decoe|||Bocoe|Decoe", "Bokkun||Боккун", "Lyric||Лірик|Lyric the Last Ancient",
        ],
        6: [ "Honey the Cat||Гані|Honey", "Sir Lancelot||Сер Ланселот|Lancelot", "Sir Gawain||Сер Ґавейн|Gawain", "Sir Percival||Сер Персіваль|Percival",
          "King Arthur||Король Артур|Dark Knight", "Ix||Ікс", 
        ],
      },
      reject: ['Mario', 'Crash', 'Crash Bandicoot', 'Spyro', 'Ristar', 'Shadow the Hedgehog 2', 'Sonia', 'Manic', 'Scourge', 'Tangle', 'Whisper', 'Sally Acorn'],
    },

    // ───────────────────────────── GENRES ─────────────────────────────
    {
      id: 'metroidvania',
      q: {
        en: 'Name a Metroidvania game (to 2024)',
        pl: 'Podaj grę typu metroidvania (do 2024)',
        uk: 'Назвіть метроїдванію (до 2024)',
      },
      answers: {
        1: [
          "Hollow Knight||Голлоу Найт", "Metroid (series)|||Metroid", "Castlevania: Symphony of the Night|||Symphony of the Night|SotN",
          "Ori and the Blind Forest|||Ori|Ori and the Blind Forest Definitive Edition", "Dead Cells", "Blasphemous",
        ],
        2: [
          "Metroid Dread", "Super Metroid", "Ori and the Will of the Wisps|||Will of the Wisps",
          "Bloodstained: Ritual of the Night|||Bloodstained|Ritual of the Night", "Axiom Verge", "Guacamelee!|||Guacamelee",
          "Prince of Persia: The Lost Crown|||The Lost Crown|Lost Crown", "Castlevania (series)|||Castlevania",
        ],
        3: [
          "Metroid Prime", "Castlevania: Aria of Sorrow|||Aria of Sorrow", "Salt and Sanctuary", "Blasphemous 2",
          "Shadow Complex", "Ender Lilies: Quietus of the Knights|||Ender Lilies", "Afterimage", "SteamWorld Dig 2",
          "Metroid Fusion", "Cave Story", "Animal Well", "Nine Sols", "Guacamelee! 2|||Guacamelee 2",
        ],
        4: [
          "Castlevania: Dawn of Sorrow|||Dawn of Sorrow", "Castlevania: Order of Ecclesia|||Order of Ecclesia",
          "Castlevania: Portrait of Ruin|||Portrait of Ruin", "Castlevania: Circle of the Moon|||Circle of the Moon",
          "Castlevania: Harmony of Dissonance|||Harmony of Dissonance", "Metroid: Zero Mission|||Zero Mission",
          "Metroid: Samus Returns|||Samus Returns", "Grime", "Death's Gambit|||Deaths Gambit", "Iconoclasts", "La-Mulana|||La Mulana",
          "Timespinner", "Momodora: Reverie Under the Moonlight|||Momodora", "Ghost Song", "Aeterna Noctis",
          "Monster Boy and the Cursed Kingdom|||Monster Boy", "Shantae and the Pirate's Curse|||Shantae", "Wonder Boy: The Dragon's Trap|||The Dragon's Trap|Wonder Boy III",
          "Axiom Verge 2", "Castlevania II: Simon's Quest|||Simon's Quest",
        ],
        5: [
          "Rabi-Ribi|||Rabi Ribi", "Environmental Station Alpha", "Chasm", "Sundered", "Gato Roboto", "Haiku, the Robot|||Haiku the Robot",
          "Islets", "Touhou Luna Nights|||Luna Nights", "Yoku's Island Express|||Yokus Island Express", "Vigil: The Longest Night|||Vigil",
          "Pseudoregalia", "Tevi", "Metroid II: Return of Samus|||Metroid 2|Return of Samus", "Strider (2014)|||Strider",
          "Metroid Prime 2: Echoes|||Metroid Prime 2|Echoes", "Metroid Prime 3: Corruption|||Metroid Prime 3|Corruption",
          "Bloodstained: Curse of the Moon|||Curse of the Moon", "Dandara", "Song of the Deep", "Outland", "Xeodrifter",
        ],
        6: [
          "Valdis Story: Abyssal City|||Valdis Story",
          "Cathedral", "Mummy Demastered|||The Mummy Demastered", "Feudal Alloy", "The Messenger", "Elderand", "Record of Lodoss War: Deedlit in Wonder Labyrinth|||Deedlit in Wonder Labyrinth",
          "Moonscars", "Ghost 1.0",
        ],
      },
      reject: ['Hollow Knight: Silksong', 'Silksong', 'Hollow Knight 2', 'Metroid Prime 4', 'Metroid Prime 4: Beyond', 'Ender Magnolia', 'Hades', 'Celeste', 'Cuphead', 'Dark Souls', 'Terraria', 'Super Mario Bros'],
    },
    {
      id: 'roguelike',
      q: {
        en: 'Name a roguelike or roguelite (to 2024)',
        pl: 'Podaj grę roguelike lub roguelite (do 2024)',
        uk: 'Назвіть roguelike чи roguelite (до 2024)',
      },
      answers: {
        1: [
          "Hades||Гадес", "The Binding of Isaac|||Binding of Isaac|Isaac|The Binding of Isaac: Rebirth|Binding of Isaac Rebirth",
          "Slay the Spire|||StS", "Dead Cells", "Enter the Gungeon|||Gungeon|EtG", "Spelunky", "Balatro", "Vampire Survivors",
        ],
        2: [
          "FTL: Faster Than Light|||FTL|Faster Than Light", "Risk of Rain 2|||RoR2", "Darkest Dungeon", "Into the Breach",
          "Rogue Legacy", "Returnal", "Noita", "Rogue||Роґ", "Cult of the Lamb",
        ],
        3: [
          "NetHack", "Crypt of the NecroDancer|||NecroDancer", "Inscryption", "Monster Train", "Loop Hero", "Spelunky 2",
          "Hades II|||Hades 2", "Risk of Rain|||RoR", "Darkest Dungeon II|||Darkest Dungeon 2", "Rogue Legacy 2", "Brotato",
          "Nuclear Throne",
        ],
        4: [
          "Angband", "Dungeon Crawl Stone Soup|||DCSS|Crawl", "ADOM|||Ancient Domains of Mystery", "Brogue", "Caves of Qud",
          "Tales of Maj'Eyal|||ToME|Tales of Majeyal", "Pokémon Mystery Dungeon|||Pokemon Mystery Dungeon",
          "Shiren the Wanderer|||Mystery Dungeon: Shiren the Wanderer", "Dicey Dungeons", "Downwell", "Children of Morta",
          "Wizard of Legend", "Curse of the Dead Gods", "Skul: The Hero Slayer|||Skul", "Gunfire Reborn", "Roboquest",
          "Neon Abyss", "Ravenswatch", "Halls of Torment", "20 Minutes Till Dawn", "Moonlighter", "Streets of Rogue",
          "Wildfrost", "Dome Keeper", "Hand of Fate", "Peglin", "Luck be a Landlord", "Death Must Die", "Backpack Hero",
        ],
        5: [
          "Cogmind", "DoomRL|||DRL", "Synthetik", "Ziggurat", "Tangledeep", "Sproggiwood", "Dungeons of Dredmor|||Dredmor",
          "Desktop Dungeons", "Pixel Dungeon", "Shattered Pixel Dungeon", "Unexplored", "Rift Wizard", "Cardinal Quest",
          "Teleglitch", "Barony", "Sword of the Stars: The Pit|||The Pit", "Hoplite", "Nova Drift",
          "Everspace", "Dungeon of the Endless", "UnReal World",
          "Jupiter Hell", "Rogue Genesia",
        ],
        6: [
          "Hack", "Larn", "Moria|||Umoria", "Omega", "Linley's Dungeon Crawl", "Beneath Apple Manor",
          "Sil", "Incursion", "Dungeonmans", "POWDER", "IVAN|||Iter Vehemens ad Necem", "Golden Krone Hotel",
          "Infra Arcana", "Ultima Ratio Regum", "Zorbus", "Hyperrogue|||HyperRogue",
        ],
      },
      reject: ['Dark Souls', 'Elden Ring', 'Hollow Knight', 'Diablo', 'Path of Exile', 'Minecraft', 'Rogue One', 'Rogue Squadron', 'Rogue Trader', 'Rogue Company', 'Hades 3', 'Slay the Spire 2'],
    },

    // ───────────────────────────── VALVE ─────────────────────────────
    {
      id: 'half-life-character',
      q: {
        en: 'Name a Half-Life character or creature',
        pl: 'Podaj postać lub stwora z Half-Life',
        uk: 'Назвіть персонажа чи істоту з Half-Life',
      },
      answers: {
        1: [
          "Gordon Freeman||Гордон Фрімен|Gordon|Freeman", "Alyx Vance||Алікс Венс|Alyx", "G-Man||Джі-Мен|GMan",
          "Headcrab||Хедкраб|Head crab", "Barney Calhoun||Барні Калгун|Barney",
        ],
        2: [
          "Eli Vance||Ілай Венс|Eli", "Isaac Kleiner||Айзек Кляйнер|Kleiner|Dr. Kleiner", "Dog||Пес",
          "Combine||Альянс|The Combine", "Vortigaunt||Вортигонт|Vort", "Father Grigori||Отець Григорій|Grigori",
          "Wallace Breen||Воллес Брін|Breen|Dr. Breen",
        ],
        3: [
          "Judith Mossman||Джудіт Моссман|Mossman", "Lamarr||Ламарр", "Adrian Shephard||Едріан Шепард|Shephard",
          "Strider||Страйдер", "Antlion||Мурашиний лев", "Zombie||Зомбі|Headcrab Zombie", "Barnacle||Барнакл",
          "Nihilanth||Ніхілант", "Gargantua||Гаргантюа|Garg", "Houndeye||Гаундай", "Bullsquid||Буллсквід",
          "Manhack||Менгек", "Combine Gunship||Ганшип|Gunship", "Hunter||Мисливець", "Combine Soldier||Солдат Альянсу|Overwatch Soldier",
          "Metrocop||Метрокоп|Civil Protection|Metro Police", "City Scanner||Сканер|Scanner", "Combine Advisor||Радник|Advisor",
          "Antlion Guard||Мурашиний лев-вартовий|Antlion Guardian",
        ],
        4: [
          "Arne Magnusson||Арне Магнуссон|Magnusson", "Odessa Cubbage||Одеса Каббедж|Odessa", "Ichthyosaur||Іхтіозавр",
          "Gonarch||Гонарх|Big Momma", "Alien Grunt||Чужий солдат|Hornet gun alien", "Alien Controller||Контролер",
          "Snark||Снарк", "Tentacle||Щупальце", "HECU Marine|||HECU|Grunt|Marine", "Black Ops Assassin|||Female Assassin",
          "Fast Zombie||Швидкий зомбі", "Poison Headcrab||Отруйний хедкраб|Black Headcrab", "Zombine||Зомбайн",
          "Combine Dropship||Дропшип|Dropship", "Combine Elite||Еліта Альянсу", "Russell||Рассел", "Shock Trooper||Шок-трупер",
          "Pit Drone||Піт-дрон", "Voltigore||Вольтигор", "Gene Worm||Генний черв'як", "Gina Cross||Джина Кросс",
          "Colette Green||Колетт Грін", "Leech||П'явка", "Chumtoad||Чамтоуд", "Jeff||Джефф", "Stalker||Сталкер",
        ],
        5: [
          "Dr. Rosenberg||Доктор Розенберг|Rosenberg", "Otis Laurey||Отіс|Otis", "Dr. Richard Keller||Доктор Келлер|Keller",
          "Baby Headcrab||Хедкраб-малюк", "Pit Worm||Піт-ворм",
          "Shock Roach||Шок-тарган", "Gonome||Гоном", "Antlion Worker", "Race X||Раса Ікс", "Panthereye||Пантерай",
          "Shield Scanner||Щитовий сканер",
        ],
        6: [ "Drill Sergeant||Сержант-інструктор", "Combine Charger|||Charger", "Combine Suppressor|||Suppressor", "Combine Ordinal|||Ordinal", "Reviver", "Antlion Grub", "Male Assassin",  "Combine Synth||Синт|Synth", "Xen Tree||Ксен-дерево", 
        ],
      },
      reject: ['Chell', 'GLaDOS', 'Wheatley', 'Cave Johnson', 'Black Mesa', 'City 17', 'Xen', 'Lambda', 'Crowbar', 'Gravity Gun', 'Portal', 'Francis', 'Zoey', 'Ellis'],
    },
  ],
} satisfies PackSpec;
