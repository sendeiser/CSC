export const PRODUCTS = [
  {
    id: 'gomitas-explosion-galactica',
    name: 'Gomitas de Explosión Galáctica',
    description: 'Viaja a través de una nebulosa de sabor con nuestras exclusivas gomitas infusionadas con néctar de frutas exóticas. Cada bocado ofrece una textura suave y sedosa que se derrite lentamente, liberando ráfagas de frambuesa azul, pitaya y un toque secreto de lluvia de estrellas ácida.',
    category: 'Gomitas',
    base_price: 12.50,
    stock: 10000,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpiDU1FUsKrUy77WDq6JPCy2kU9uvvnAJaJB_HyQW6SFHSnAiGg4-XadyKR84IP_DOgm4j03h32ZL8T-w3KdxVPPebxMSWvLYbApoy12uPtJO_oCxG9fyXZK_g4qdU0cksgx1E2pWA1RT1RAyvc52ad6l9g0ytPcprx-NV262CI5FU-iUEm4iZ83BDlvcIylfZ57Nb__5-AsVdqhSDmtsgwfDM1znhM1PxdZfzhyPpmfV0qbU9wFxkfRcPZ6LrZMNVznHA15cuX8E',
    tags: ['NUEVO', 'EXPLOSIÓN'],
    stars: 5,
    reviews: 124,
    diet: ['Vegan', 'Orgánico'],
    unit_type: 'weight',
    price_per_kg: 50.00,
    sizes: {
      '250g': 12.50,
      '500g': 22.00,
      '1kg': 40.00
    }
  },
  {
    id: 'ositos-cosmicos',
    name: 'Ositos Cósmicos',
    description: 'Ositos de goma con una infusión estelar y brillo de cristales dulces. Sabor frutal cósmico.',
    category: 'Gomitas',
    base_price: 36.00,
    stock: 8000,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnTn-8eN_rgTy-4OoAKqTOyvmfJe77NZsy_yb5Rw1nconCv-rVZbv-sdRLjJkpIPEplZUYOA6LGKSVyzhMBztoYcSD1Sxsq2gZYRsZHto5J9oSWf-3lrop4Dh6X5ijmDL40Hl4erLX62j92n2qaOoPrktp6E2Mgf7EkTCBVj_zuE10WKqPYkqzUSMz2LA04nVGz04htPOJc8lE4Avun7SHMafBQiiw3eyjQ3Ovh2J45F4l0m6rMmUDSexmQ1_6rriHL9vATX-SYkQ',
    tags: ['VEGANO', 'FRUTAL'],
    stars: 5,
    reviews: 98,
    diet: ['Vegan', 'Sin Azúcar'],
    onSale: true,
    discountPercentage: 20,
    unit_type: 'weight',
    price_per_kg: 120.00,
    sizes: {
      '300g': 36.00,
      '500g': 55.00
    }
  },
  {
    id: 'cintas-neon',
    name: 'Cintas Neón',
    description: 'Tiras ácidas y crujientes que brillan con sabor electrizante a frambuesa y manzana.',
    category: 'Acidulados',
    base_price: 25.00,
    stock: 500,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKcX9ouLcbBZed9-5IMR9dZRT8qVFnD_9hxpyZ_pA213DQ8Bmnyxj7b0Zjjq0JnZwzee2Ym7kok6AhuuvoC-cVDO_-1KtDNzvY-YE6jQqu89oT_GffZ5Jm1GZRXqOib6aR0oeVgD_MM0uhle88ragzvYi0U6oxPMfxC-bC9gUkeMj8BRXXUz3rw3BhSArN7Amaualolqjz4rtqh14usosAeBWR-qomc0TXEZgPTYiNtWl0r1wFrErPenSxEJ5hhmwHEwbLgT7PETE',
    tags: ['EXTRA SOUR', 'NEW'],
    stars: 4,
    reviews: 73,
    diet: ['Vegan'],
    sizes: {
      'Pack Estándar': 25.00,
      'Pack Familiar': 42.00
    }
  },
  {
    id: 'trufas-galacticas',
    name: 'Trufas Galácticas',
    description: 'Chocolate amargo premium al 70% con un suntuoso y celestial relleno de caramelo salado.',
    category: 'Chocolates',
    base_price: 89.00,
    stock: 200,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6PG13q1F54FjFcTqlALl73SWWjXh9dkTtBhWkdbaHptLs529Fxi1giKbBCIPUEL-iUV-nC1YC_Ps2G-rxI-0WKJC0XXBWR0WZXD31xtnDZbvKTEGaIpeM871GYMmL37-9tTzfmpQ8bLWc_OsXCUiVJAZWadhdOzPIbgISCO53AQcZmvnQPKbMlh6FRjmNG84G0LGWw8kqOomb5ZoH7G5FVdEw7Q-DGDFrL2ol9ggf8o3Mm_4GRlJc2OrVUxzu8mGpSWOee5PtpUA',
    tags: ['BESTSELLER', 'RIQUÍSIMO'],
    stars: 5,
    reviews: 212,
    bestseller: true,
    diet: ['Orgánico'],
    sizes: {
      'Caja 12 pzs': 89.00,
      'Caja 24 pzs': 160.00
    }
  },
  {
    id: 'caja-universo-sabor',
    name: 'Caja Universo de Sabor',
    description: 'Un viaje astronómico por todos nuestros mejores dulces en una sola caja de regalo de lujo.',
    category: 'Regalos',
    base_price: 350.00,
    stock: 50,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4yiMyugW0FxSq358OnNzc2tvnzt_kgOhTICeRmGDBDOh3Ke___QNjJMggzh_LP75u3ltsWOWGTP-x9-XXcj7CMCYPh1A54SKMOLeo9K6eX2lf6uZAiyXh6e5f4HJkj408JezSrNqYekV4OT4laSReqD5Wy-mWuR6V49a5Py_1N7K5tg4KyQjltnbyUFprQnB4u6EbKQUXE_3JOpkM1m5MvHjoZZ6CSdGIqyppsPgEa122mKjNHTXS2zgdRYSf5JCAgBbjWN294gU',
    tags: ['EDICIÓN LIMITADA', 'REGALO'],
    stars: 5,
    reviews: 46,
    diet: ['Orgánico'],
    sizes: {
      'Set Premium': 350.00
    }
  },
  {
    id: 'nubes-algodon',
    name: 'Nubes de Algodón',
    description: 'Bombones artesanales ultra esponjosos con una sutil infusión de vainilla de Madagascar natural.',
    category: 'Caramelos',
    base_price: 55.00,
    stock: 150,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD40m9zbl6ELzkkdCNfNeOQ1pZR2u75kMN7FNNp6a_Q2Ou-W7TtEMw2DQ-iT-fhihLw4uRyAJEwp99jm1WjpevuKN7TUwqkgQgXdFqZhs1TJ0OFYx6JSMgwYRPnsnEe_GV5_kgnEJwzPiaTZtWCOIHtImVYoK1LgnJaNaUlaGJchgOzz5EehtdD42YFy4tlhqxViag1NZqLiYvAPU1KTDLzmCXMMHuoh_5LvaW1AniJL_MhNlvF4DFOnRBKwBtrWDqTCGYS16BUAU0',
    tags: ['ORGÁNICO', 'DELICADO'],
    stars: 4,
    reviews: 81,
    diet: ['Orgánico'],
    sizes: {
      'Caja Clásica': 55.00,
      'Caja XL': 98.00
    }
  },
  {
    id: 'coleccion-nubes-oro',
    name: 'Colección "Nubes de Oro"',
    description: 'Chocolates de autor rellenos y decorados con destellos de láminas de oro puro comestible.',
    category: 'Chocolates',
    base_price: 120.00,
    stock: 75,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmchaLyj3bR-x4SDWG_70kZMkZUY2wrNmxVeiEuxuObvmQB1HlqWH-WVip1rN4Pw8ZvkvmxBWHCeeOgKgIQWFLXXmaR-RX79xt4kxmC7idVhti1p2e_Z5fY1U31Pb4_WlgMZc7kPpmFmqT942nvFyBrllXpCGSL_N3NpIT3dE3UA-a2rNx8okqB_lEgIG_NbW51rs5nBeO1DyM60KHhUWJ0P9n1MRUr3AYFSEssnJZcBPu49o0jJQeFVdu9DGJZXbCOMpoYPXpkoY',
    tags: ['EDICIÓN LIMITADA', 'GOURMET'],
    stars: 5,
    reviews: 32,
    diet: ['Orgánico'],
    sizes: {
      'Caja 9 pzs': 120.00,
      'Caja 16 pzs': 195.00
    }
  },
  {
    id: 'paletas-espiral',
    name: 'Paletas Espiral',
    description: 'Preciosos caramelos en espiral artesanales de tonos alegres y sabor nostálgico.',
    category: 'Caramelos',
    base_price: 3.50,
    stock: 300,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhkxMF82LeaMwKBJ7rZZXe6zxHsqZUZmg76n2MkPA6Z2J23q0GVh0kwDq0R6FXfR57rrPIUj4jbhJCQzB44lGHuC6_Ugoj1TT321U8hyHhvkkdSkDsGh2kUOUrrFRE5vMLoqigi2nUAozMwQF5EWtYFTKu3rmtXSLkcBllB02YGBMIfmjFVbU95JjES4nWNAK5LvRlH-1Se_uHy96YYEDcSZuI5er2NIcA3fbgcKqq-6AUXrDvSnSut_d9WNBDFvGO3i7Klhs-gEY',
    tags: ['ARTESANAL'],
    stars: 4,
    reviews: 145,
    diet: ['Vegan'],
    sizes: {
      '1 pieza': 3.50,
      'Pack 3 piezas': 9.00
    }
  },
  {
    id: 'neon-worms',
    name: 'Neon Worms',
    description: 'Luminosos gusanos de gominola cubiertos de azúcar ácido que estallará en tu boca.',
    category: 'Acidulados',
    base_price: 5.99,
    stock: 6000,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8sXldN92lkY1jHTe_PHBwDwsiG2QOllSf7JdaoGxybnVSYbXd_ntULS0HhFlWNJTbIhJojY10iYdLY6erneF3APq6GVQ7bx00GuiLCvwFJ2ctSmUCsWl-3n8i9-GeIjGIqJngz597bOP4u-ncMF-ybno3aR_Z-ZGk2gekjQGIbtcewMYTKX2wdbO3WKRpYNFS0NWY5f_0Sfgqo2ucLp8myRAQMlIU18k8n5swfccRay5203LRtUs_TJ5z_vlhFedl8SIctly0SD4',
    tags: ['EXTRA SOUR', 'DIVERTIDO'],
    stars: 4,
    reviews: 112,
    diet: ['Vegan'],
    unit_type: 'weight',
    price_per_kg: 29.95,
    sizes: {
      'Pack 200g': 5.99,
      'Pack 500g': 12.00
    }
  },
  {
    id: 'pack-macarons',
    name: 'Pack Macarons',
    description: 'Surtido impecable de crujientes y deliciosos macarons franceses en tonos pastel.',
    category: 'Regalos',
    base_price: 18.00,
    stock: 120,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpUF5kb0CbrBqFZP1QAhREbYw1RNtY3iMP65LtOiaGlrq5A_0qF8JXqkSOrltfO4_cfzX2GtJ_207-jryqFH61l79mXdD8PcB8oJPsssUrLfBaspS6UYd7EyTFsq5xn8G89sGalZyp_jp3sNmczAi7Ih_FcT0cLiz5pDiuR0HkcTOZcYsK8XdaOY25DiSFvDD410w_aLG_zYfbpdzmFtMN3QZo9SBY--L22x6mNhjj6gX9bxdlwM7L9Ud-5X2xmgln_2AajGNoGBY',
    tags: ['GOURMET', 'FRUTADO'],
    stars: 5,
    reviews: 79,
    diet: ['Orgánico'],
    sizes: {
      'Estuche 6 pzs': 18.00,
      'Estuche 12 pzs': 32.00
    }
  },
  {
    id: 'fiesta-gummy',
    name: 'Fiesta Gummy',
    description: 'Un magnífico recopilatorio de nuestras gominolas frutales más coloridas y brillantes.',
    category: 'Gomitas',
    base_price: 12.50,
    stock: 10000,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBW_R0yaBzAijbha2wbrpWE_kucWMQaJ8iOiSljgo0TG0QbWCwLgNNBX2Oe52xd8e1DXJuKgh1cvUjVCFssDEy79Laa5qDvOhI4TLGvICFlQ1qpbJfD3NcwKMT1QZmW5-uzQlLUrQ6GRNAHJXOf90NPHrXV8LegH2bZsXXcYPBkxJ2EH5ZETCZZu1kj_lF9H5LFn-s_IqgSuJosNh19y-hbIBxJsGsDvLlBZsh4_WytlZ37GaJQ_7jD79esjQtR3ETufWk8mRExvsk',
    tags: ['COMPARTIR', 'FRUTAL'],
    stars: 4,
    reviews: 94,
    diet: ['Vegan'],
    unit_type: 'weight',
    price_per_kg: 25.00,
    sizes: {
      'Bolsa 500g': 12.50,
      'Bolsa 1kg': 22.00
    }
  },
  {
    id: 'cristales-frutales',
    name: 'Cristales Frutales',
    description: 'Caramelos duros semitransparentes como gemas galácticas con néctar de fruta.',
    category: 'Caramelos',
    base_price: 8.90,
    stock: 5000,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPy5Tx_8hOGucW2qrJhxNV6S2iDaJGd5GCKQ_-W7VxnDvhsCXOzB2mdAJrEtjztJXMrtaNfqeJSaWurIK4cu1vQM3-j8PjZclbxGJTtVddXhBQVl-cKlW2i3E8uiS67Ol412usR9jKwwuAOS_kpAS4ugcRnSVa91j463Wq0gqYKTEhWrQwLM-3vKGCnQfiupgtSsCRQDndgNeH3lKaE4rDJ2LasXQaGfnSDH52xv9vVfOaqB3pzS1rXXdz2fMOqhv3Loa9fReJvGU',
    tags: ['DELICADO', 'INTENSO'],
    stars: 4,
    reviews: 65,
    diet: ['Orgánico', 'Sin Azúcar'],
    unit_type: 'weight',
    price_per_kg: 59.33,
    sizes: {
      'Bolsita 150g': 8.90,
      'Bolsita 300g': 16.00
    }
  },
  {
    id: 'box-trufas',
    name: 'Box Trufas',
    description: 'Exclusiva selección de bombones y trufas artesanas de cacao premium seleccionados de cooperativas.',
    category: 'Chocolates',
    base_price: 24.00,
    stock: 180,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDgyFGma4r5tf4ZWf_K1LBzT9rFlnnlNq6VwoexWlnMUDm3TqIpgQ0VGpY0IxwTAFwJ92ba5jICoVHj02WLmXlKYTJC12mKTx28fOVhvYwvAZi-wJcQ79PEg_1cX9co-stdT1Okc8U3CbrREi8mmPWrZBkfqzdnM1WBCG4Qpu79BW57ESwinctKjlWDMdEu4-in-_PgvHF6QKpB-rkSl4rWIBgnN-kCOLELe_iMRUaZrTKix38scGT7mcyq-Kkizhy6TebvpjU__CM',
    tags: ['EDICIÓN LIMITADA', 'CACAO'],
    stars: 5,
    reviews: 139,
    diet: ['Orgánico'],
    sizes: {
      'Caja 12 pzs': 24.00,
      'Caja 24 pzs': 45.00
    }
  }
];

export const FLAVOR_CATEGORIES = [
  { id: 'Frutales', icon: 'restaurant_menu', color: 'bg-primary-fixed', text: 'text-primary' },
  { id: 'Ácidos', icon: 'bolt', color: 'bg-secondary-fixed', text: 'text-secondary' },
  { id: 'Cremosos', icon: 'mood', color: 'bg-tertiary-fixed', text: 'text-tertiary' },
  { id: 'Picantes', icon: 'local_fire_department', color: 'bg-inverse-primary', text: 'text-primary' },
  { id: 'Postres', icon: 'cake', color: 'bg-surface-container-high', text: 'text-on-surface-variant' }
];

export const STORE_INFO = {
  name: 'Chamical Candy Shop',
  shortName: 'CSC',
  address: 'Av. Principal 123, Chamical, La Rioja',
  phone: '+54 9 3854 00-0000',
  whatsapp: '5493854000000',
  email: 'info@chamicalcandy.shop',
  instagram: '@chamicalcandy',
  hours: [
    { day: 'Lun - Vie', time: '09:00 - 13:00 / 17:00 - 21:00' },
    { day: 'Sáb', time: '09:00 - 14:00 / 17:00 - 20:00' },
    { day: 'Dom', time: 'Cerrado' },
  ]
}

export const TEAM_MEMBERS = [
  {
    name: 'Familia Chamical',
    role: 'Dueños & Fundadores',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAV8Cq1ch8kXuNOnnRjKwov8EyNOpgt2yyYxNztsYjE0HjFWaEGU0Eyiw3tQBgGpO8iE1MAc_XaNyJdx9eDEw-CI5izZHBcxonLFZHlk_rbaocfhu82Mt0GCpwR4t35owybd7WCWkvxjOlPUnivhElL7DSnfmdHAFn5rmCa5ogZIBLReeilPT_FPNx50d7OQbxjNtn41Xn7k_FJLhi_n5_sS04p4yogjLH_RPhlO-TiQnniNFsCoENLSqb7P0wyxNoO6Tj9dMOL3fE'
  },
  {
    name: 'Carlos',
    role: 'Encargado de Local',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhjh0cN6hWO-Jf7-9SjnIep6vOWU0cpzIHusXHhoKHpzesVytWgEd1DnbC_hwxw7_BWxj9sKlCa0abjtLjh5om0GMO__o9YjJ--DvZtN--JryV96vqwmxOTfWW4CNzDKPtfha7hPzH1tGb7ESc7bgoTL5hncZFhShhA8gfU8tFfbyIRzDTn41wHmfU52YRyAO1r8sqAFmJpIDpDXHdTscBV4k8CZVQu9KUmP0ylcPdwvuxRxxyTIteCC8TocfVJ-_NVq7H0qPAdwQ'
  },
  {
    name: 'María',
    role: 'Atención al Cliente',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnppGKn40yhl3MxJ23H5kJiloIMe1yDA_BWDpXKS39dgT9L9PcFYEUE97ittkJRGUS_FbKmZEXAGW0emqB1jTFNviXQLe3DswtbJST9W5cg4yXLoD0CQxipe5wzXfoa4dWDfPz8xXL9tyVDt1lklcRbQgzbXC7VCFZO9O1gJVLm-b11Iz-tfD2SK7HzQDFl7HFoP7d4h5xwrCj05YoMmx3_h1I1SOSWoPcG8CF0zodOOJPc2utxy1eYusEqcrdOvDqWC37tNH64CA'
  },
  {
    name: 'Pedro',
    role: 'Logística y Reparto',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvWMtlYvPTNoHWd6SeF3L85CRDa9OdfBX3HEWxvGBb4qDFbXBauQnp3gspNSB5ajerc_EQa7ZiQD52ZuvtIYgqvguZQfMkZm8aSEBqW9H3ilpjrGZKinvujoRPhdM7rZ6By5dVr_Zkp6yvCz94WCuGiKpNxgjk_tdaTzgyTp4dWRL8Ix8in4FG_NMqVcfgC5wH6t5UcCQC5z33Q9j5wEMC_gREphNh3vg87i4BGTdR4KJVAzZPYLnix5ytK0ggQwElXpQij6KwZw0'
  }
];

export const PILLARS = [
  {
    title: 'Calidad Artesanal',
    desc: 'Seleccionamos cada producto con cuidado, priorizando proveedores locales y marcas con trayectoria. Todo llega fresco a tu mesa.',
    icon: 'magic_button',
    bg: 'bg-pink-100',
    text: 'text-pink-700'
  },
  {
    title: 'Variedad por Granel',
    desc: 'Gomitas, chocolates, caramelos acidulados y más — elegís la cantidad que quieras, pagás justo por lo que llevás. Ideal para cumpleaños y eventos.',
    icon: 'public',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    dark: true
  },
  {
    title: 'Atención Local',
    desc: 'Te atendemos con el calor de Chamical. Consultanos por WhatsApp, visitanos en el local o hacé tu pedido online y lo retirás cuando quieras.',
    icon: 'favorite',
    bg: 'bg-teal-100',
    text: 'text-teal-700'
  }
];
