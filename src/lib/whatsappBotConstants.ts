export interface IgnoredNumber {
  id: string;
  phone: string;
  label: string;
  created_at: string;
}

export interface CustomMenuOption {
  id: string;
  option_number: string;
  title: string;
  keywords: string[];
  response: string;
}

export const DEFAULT_CHATBOT_KEYWORDS = [
  'pedido', 'candy', 'comprar', 'precio', 'precios', 'gomitas', 
  'catalogo', 'catálogo', 'envio', 'envío', 'local', 'horario', 
  'horarios', 'transferencia', 'alias', 'cbu', 'menu', 'menú', 
  'hola candy', 'promo', 'promos', 'stock', 'tienda', '#csc', 'consulta'
];

export const DEFAULT_TEMPLATES = {
  // 1. Menú Principal y Opciones
  template_menu: `🍬 *¡Hola {cliente}! Bienvenido a Chamical Candy Shop* 🍭\n\n¿En qué podemos ayudarte hoy? *Respondé con el número de opción:*\n\n1️⃣ 📦 *Consultar estado de mi pedido*\n2️⃣ 🏦 *Ver datos de transferencia bancaria*\n3️⃣ 📍 *Horarios y ubicación del local*\n4️⃣ 🛍️ *Ver catálogo de productos y precios*\n5️⃣ 👤 *Hablar con una persona del equipo*\n\n_Escribí *COMPRAR* si querés armar un pedido directo por acá._`,
  menu_response_1: `📦 *Estado de tu Pedido:* #{pedido_id}\n\n• *Estado:* {estado}\n• *Total:* \${total}\n• *Destino:* {direccion}\n\n_Para volver al menú, enviá la palabra *MENU*._`,
  menu_response_2: `🏦 *Datos para Transferencia Bancaria:* 🍬\n\n• *Alias:* \`{alias_banco}\`\n• *Banco:* {banco}\n• *Titular:* {titular}\n• *CBU:* \`{cbu}\`\n\n📸 *Una vez realizada la transferencia, podés enviar la captura o comprobante por este mismo chat.*\n\n_Enviá *MENU* para ver más opciones._`,
  menu_response_3: `📍 *Ubicación y Horarios de Atención:* 🍬\n\n🏠 *Dirección:* {direccion}\n🕒 *Horarios:* {horarios}\n\n¡Te esperamos con las golosinas más ricas! 🍭\n\n_Enviá *MENU* para volver al menú principal._`,
  menu_response_4: `🛍️ *Catálogo & Precios de Chamical Candy Shop* 🍬\n\n{catalogo_lista}\n\n👉 *Respondé con el NÚMERO (1, 2, 3...) de la golosina para pedir o escribí COMPRAR.*\n🌐 *Tienda web:* {catalogo_url}`,
  menu_response_5: `👤 *¡Entendido {cliente}! Un asesor de nuestro equipo te responderá a la brevedad.* 🍬\n\nPor favor dejanos tu consulta detallada para poder ayudarte más rápido. ¡Muchas gracias por tu paciencia!`,
  
  // 2. Flujo de Compra por WhatsApp
  template_buy_catalog: `🛍️ *¡Vamos a armar tu pedido de golosinas!* 🍬\n\n{catalogo_lista}\n\n👉 *Respondé con el NÚMERO (1, 2, 3...) del producto que querés llevar.*`,
  template_product_photo: `🍬 *{producto}* 🍭\n{detalle}{dietas}\n💰 *Precio:* {precio}\n📦 *Stock:* {stock} disponibles\n\n👉 Para pedir este producto escribí *COMPRAR* o su número.`,
  template_weight_prompt: `🍬 *{producto}* (Venta al peso) ⚖️\n💰 *Precio:* \${precio_50g} x 50g (\${precio_kg}/kg)\n\n*¿Qué cantidad querés llevar?*\n{opciones_gramaje}\n\n👉 *Respondé con el número (1 a {cantidad_opciones})* o escribí tus gramos exactos (ej: *50g*, *100g*, *150g*).`,
  template_unit_quantity_prompt: `🍫 *{producto}*\n💰 *Precio:* \${precio_unitario} por unidad\n\n👉 *¿Cuántas unidades querés llevar?* (Escribí la cantidad, ej: 1, 2, 3...)`,
  template_cart_item_added: `✅ *¡Agregaste {producto}!* 🍬 (+{subtotal_item})\n\n🛒 *Tu carrito actual:*\n{carrito_items}\n\n💰 *Subtotal:* \${subtotal}\n\n👉 ¿Querés agregar otro producto? *(Escribí su número)*\n👉 O escribí *LISTO* para continuar y confirmar tu pedido.`,
  template_cart_view: `🛒 *TU CARRITO ACTUAL:* 🍬\n\n{carrito_items}\n\n💰 *Subtotal:* \${subtotal}\n\n👉 Para sumar más productos, escribí su *NÚMERO*.\n👉 Para quitar un producto, escribí *QUITAR [número]* (ej: QUITAR 1).\n👉 O escribí *LISTO* para avanzar con la entrega y el pago.`,
  template_empty_cart: `⚠️ Tu carrito está vacío. Escribí el *NÚMERO* del producto que querés agregar o escribí *CANCELAR*.`,
  template_shipping_prompt: `🛵 *¿Cómo querés recibir tu pedido?*\n\nRespondé con el número de opción:\n1️⃣ *Retiro por el local (Chamical)* — Sin costo\n2️⃣ *Envío a domicilio con cadete (Chamical)*`,
  template_address_prompt: `📍 *Por favor escribí tu dirección de entrega y entrecalles en Chamical:*`,
  template_name_prompt: `👤 *¿A nombre de quién registramos el pedido?* (Escribí tu nombre y apellido):`,
  template_coupon_prompt: `🎟️ *¿Tenés algún Cupón de Descuento?*\n\n👉 Escribí el código de tu cupón (ej: *{ejemplo_cupon}*) o respondé *NO* para continuar sin cupón.`,
  template_coupon_applied: `🎉 *¡Cupón {cupon} aplicado con éxito!* Descuento: -\${descuento} ✨\n\n💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`,
  template_coupon_invalid: `ℹ️ El cupón "{cupon}" no es válido o expiró. Continuamos con el valor regular.\n\n💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`,
  template_payment_prompt: `💳 *¿Cómo preferís abonar tu pedido?*\n\nRespondé con el número:\n1️⃣ *Transferencia Bancaria* (Alias / CBU)\n2️⃣ *Efectivo contra entrega* (Al retirar o recibir)\n3️⃣ *Mercado Pago* (Link directo de pago)`,
  template_order_summary: `🍬 *RESUMEN DE TU PEDIDO* 🍭\n\n🛒 *Golosinas:*\n{carrito_items}\n\n💵 *Subtotal:* \${subtotal}\n{linea_descuento}🛵 *Entrega:* {metodo_entrega}\n📍 *Dirección:* {direccion}\n👤 *Cliente:* {cliente}\n💳 *Forma de Pago:* {medio_pago}\n\n💰 *TOTAL A PAGAR:* \${total}\n\n¿Está todo correcto?\n👉 Respondé *SI* para confirmar tu pedido o *CANCELAR*.`,
  template_order_confirmed: `🎉 *¡PEDIDO #{pedido_id} REGISTRADO CON ÉXITO!* 🍬\n\nMuchas gracias *{cliente}*, tu pedido ya fue cargado automáticamente.\n\n📦 *Detalle:*\n{carrito_items}\n💰 *Total:* \${total}\n📍 *Entrega:* {direccion}\n\n{instrucciones_pago}`,
  template_order_cancelled: `❌ *Proceso de compra cancelado.* ¿En qué más podemos ayudarte?\n\n{menu}`,

  // 3. Notificaciones de Pedidos
  template_new_order: `🍬 *¡Hola {cliente}! Gracias por tu compra en Chamical Candy Shop* 🍭\n\n📦 *Pedido:* #{pedido_id}\n💰 *Total:* \${total}\n📍 *Entrega:* {direccion}\n\n🛒 *Detalle de tus golosinas:*\n{productos}\n\n🏦 *Datos para Transferencia Bancaria:*\n• *Alias:* \`{alias_banco}\`\n• *Banco:* {banco}\n• *Titular:* {titular}\n• *CBU:* \`{cbu}\`\n\n📸 *Por favor envíanos una foto del comprobante de transferencia por aquí para comenzar a preparar tu pedido. ¡Muchas gracias!* 🎉`,
  template_order_preparing: `👨‍🍳 *¡Buenas noticias {cliente}!* 🍬\n\nTu pedido *#{pedido_id}* por *\${total}* ya está *EN PREPARACIÓN*. 🍭\nNuestros expertos están seleccionando y empacando tus golosinas con el mayor cuidado.\n\n¡Te avisaremos apenas esté listo! ⏱️`,
  template_order_ready: `✨ *¡Tu pedido está LISTO {cliente}!* 🎉\n\n📦 Pedido: *#{pedido_id}*\n📍 Ya podés pasar a retirarlo por nuestro local en los horarios habituales.\n\n¡Te esperamos con tus golosinas preparadas! 🍬`,
  template_order_shipped: `🛵 *¡Tu pedido va en camino {cliente}!* 🚀\n\n📦 Pedido: *#{pedido_id}*\n📍 Dirección de entrega: *{direccion}*\n\nEl cadete ya salió con tu pedido. ¡Mantenete atento para recibir tus golosinas! 🍭`,
  template_payment_proof: `📸 *¡Comprobante de pago recibido!* 🎉\n\nMuchas gracias por enviarnos tu comprobante. Nuestro equipo lo verificará a la brevedad para confirmar tu pedido. 🍬`,
  custom_menu_options: []
};

export interface TemplateNode {
  id: string;
  category: 'menu' | 'buy_flow' | 'notifications';
  num: string;
  title: string;
  desc: string;
  field: string;
  tags: Array<{ tag: string; label: string }>;
}

export const ALL_TEMPLATE_NODES: TemplateNode[] = [
  // Categoría 1: Menú Principal y Opciones
  {
    id: 'template_menu',
    category: 'menu',
    num: '📋',
    title: 'Menú Principal (Bienvenida)',
    desc: 'Mensaje de bienvenida con opciones numéricas 1 a 5',
    field: 'template_menu',
    tags: [{ tag: '{cliente}', label: 'Nombre' }, { tag: '{catalogo_url}', label: 'Link Tienda' }]
  },
  {
    id: 'menu_response_1',
    category: 'menu',
    num: '1',
    title: 'Opción 1: Estado de Pedido',
    desc: 'Respuesta con ID, estado, total y destino del pedido',
    field: 'menu_response_1',
    tags: [{ tag: '{cliente}', label: 'Nombre' }, { tag: '{pedido_id}', label: 'ID Pedido' }, { tag: '{total}', label: 'Total $' }, { tag: '{estado}', label: 'Estado' }, { tag: '{direccion}', label: 'Dirección' }]
  },
  {
    id: 'menu_response_2',
    category: 'menu',
    num: '2',
    title: 'Opción 2: Datos Bancarios',
    desc: 'Respuesta con Alias, Banco, Titular y CBU oficial',
    field: 'menu_response_2',
    tags: [{ tag: '{alias_banco}', label: 'Alias' }, { tag: '{banco}', label: 'Banco' }, { tag: '{titular}', label: 'Titular' }, { tag: '{cbu}', label: 'CBU' }]
  },
  {
    id: 'menu_response_3',
    category: 'menu',
    num: '3',
    title: 'Opción 3: Horarios y Local',
    desc: 'Dirección física en Chamical y horarios de atención',
    field: 'menu_response_3',
    tags: [{ tag: '{direccion}', label: 'Dirección' }, { tag: '{horarios}', label: 'Horarios' }]
  },
  {
    id: 'menu_response_4',
    category: 'menu',
    num: '4',
    title: 'Opción 4: Catálogo y Precios',
    desc: 'Lista de golosinas en stock y enlace a la tienda online',
    field: 'menu_response_4',
    tags: [{ tag: '{catalogo_lista}', label: 'Lista Productos' }, { tag: '{catalogo_url}', label: 'Link Tienda' }]
  },
  {
    id: 'menu_response_5',
    category: 'menu',
    num: '5',
    title: 'Opción 5: Asesor Humano',
    desc: 'Mensaje de derivación personalizada al equipo',
    field: 'menu_response_5',
    tags: [{ tag: '{cliente}', label: 'Nombre' }]
  },

  // Categoría 2: Flujo de Compra por Chat
  {
    id: 'template_buy_catalog',
    category: 'buy_flow',
    num: '🛍️',
    title: 'Catálogo de Compra (Comprar)',
    desc: 'Lista de golosinas al escribir COMPRAR o PEDIR',
    field: 'template_buy_catalog',
    tags: [{ tag: '{catalogo_lista}', label: 'Lista Productos' }]
  },
  {
    id: 'template_product_photo',
    category: 'buy_flow',
    num: '📸',
    title: 'Ficha y Foto de Producto',
    desc: 'Texto de la imagen con detalles, dietas y precio',
    field: 'template_product_photo',
    tags: [{ tag: '{producto}', label: 'Producto' }, { tag: '{detalle}', label: 'Detalle' }, { tag: '{dietas}', label: 'Dietas' }, { tag: '{precio}', label: 'Precio' }, { tag: '{stock}', label: 'Stock' }]
  },
  {
    id: 'template_weight_prompt',
    category: 'buy_flow',
    num: '⚖️',
    title: 'Selección de Gramajes al Peso',
    desc: 'Pregunta opciones de 25g, 50g, 100g y gramajes libres',
    field: 'template_weight_prompt',
    tags: [{ tag: '{producto}', label: 'Producto' }, { tag: '{precio_kg}', label: 'Precio/kg' }, { tag: '{min_weight}', label: 'Mínimo' }, { tag: '{step_weight}', label: 'Paso' }, { tag: '{opciones_gramaje}', label: 'Opciones' }, { tag: '{cantidad_opciones}', label: 'Cant. Opciones' }]
  },
  {
    id: 'template_unit_quantity_prompt',
    category: 'buy_flow',
    num: '🍫',
    title: 'Cantidad para Productos por Unidad',
    desc: 'Pregunta cuántas unidades llevar (1, 2, 3...)',
    field: 'template_unit_quantity_prompt',
    tags: [{ tag: '{producto}', label: 'Producto' }, { tag: '{precio_unitario}', label: 'Precio Unitario' }]
  },
  {
    id: 'template_cart_item_added',
    category: 'buy_flow',
    num: '➕',
    title: 'Producto Agregado al Carrito',
    desc: 'Confirmación al sumar golosina y resumen parcial',
    field: 'template_cart_item_added',
    tags: [{ tag: '{producto}', label: 'Producto' }, { tag: '{subtotal_item}', label: 'Total Item' }, { tag: '{carrito_items}', label: 'Items Carrito' }, { tag: '{subtotal}', label: 'Subtotal' }]
  },
  {
    id: 'template_cart_view',
    category: 'buy_flow',
    num: '🛒',
    title: 'Ver Carrito Actual (Comando CARRITO)',
    desc: 'Muestra lista de items, subtotal y opciones de edición',
    field: 'template_cart_view',
    tags: [{ tag: '{carrito_items}', label: 'Items Carrito' }, { tag: '{subtotal}', label: 'Subtotal' }]
  },
  {
    id: 'template_empty_cart',
    category: 'buy_flow',
    num: '⚠️',
    title: 'Aviso de Carrito Vacío',
    desc: 'Mensaje si escribe LISTO sin productos en carrito',
    field: 'template_empty_cart',
    tags: []
  },
  {
    id: 'template_shipping_prompt',
    category: 'buy_flow',
    num: '🛵',
    title: 'Método de Entrega',
    desc: 'Opciones: Retiro en Local vs. Envío con Cadete',
    field: 'template_shipping_prompt',
    tags: []
  },
  {
    id: 'template_address_prompt',
    category: 'buy_flow',
    num: '📍',
    title: 'Solicitud de Dirección',
    desc: 'Pide dirección de entrega en Chamical para el cadete',
    field: 'template_address_prompt',
    tags: []
  },
  {
    id: 'template_name_prompt',
    category: 'buy_flow',
    num: '👤',
    title: 'Solicitud de Nombre del Cliente',
    desc: 'Pide nombre y apellido para registrar el pedido',
    field: 'template_name_prompt',
    tags: []
  },
  {
    id: 'template_coupon_prompt',
    category: 'buy_flow',
    num: '🎟️',
    title: 'Pregunta de Cupón de Descuento',
    desc: 'Consulta si el cliente tiene un código promocional',
    field: 'template_coupon_prompt',
    tags: [{ tag: '{ejemplo_cupon}', label: 'Ejemplo Cupón' }]
  },
  {
    id: 'template_coupon_applied',
    category: 'buy_flow',
    num: '🎉',
    title: 'Cupón Aplicado con Éxito',
    desc: 'Mensaje de descuento restado del total',
    field: 'template_coupon_applied',
    tags: [{ tag: '{cupon}', label: 'Código Cupón' }, { tag: '{descuento}', label: 'Descuento $' }]
  },
  {
    id: 'template_coupon_invalid',
    category: 'buy_flow',
    num: 'ℹ️',
    title: 'Cupón Inválido o Expirado',
    desc: 'Aviso si el código no coincide con la base de datos',
    field: 'template_coupon_invalid',
    tags: [{ tag: '{cupon}', label: 'Código Cupón' }]
  },
  {
    id: 'template_payment_prompt',
    category: 'buy_flow',
    num: '💳',
    title: 'Selección de Medio de Pago',
    desc: 'Opciones: Transferencia Bancaria, Efectivo o MP',
    field: 'template_payment_prompt',
    tags: []
  },
  {
    id: 'template_order_summary',
    category: 'buy_flow',
    num: '📋',
    title: 'Resumen Final de Compra',
    desc: 'Resumen con detalle, total y pregunta "¿Está todo bien? (SI)"',
    field: 'template_order_summary',
    tags: [{ tag: '{carrito_items}', label: 'Items' }, { tag: '{subtotal}', label: 'Subtotal' }, { tag: '{linea_descuento}', label: 'Descuento' }, { tag: '{metodo_entrega}', label: 'Entrega' }, { tag: '{direccion}', label: 'Dirección' }, { tag: '{cliente}', label: 'Cliente' }, { tag: '{medio_pago}', label: 'Medio Pago' }, { tag: '{total}', label: 'Total' }]
  },
  {
    id: 'template_order_confirmed',
    category: 'buy_flow',
    num: '✅',
    title: 'Confirmación y Pedido Registrado',
    desc: 'Mensaje final con código de pedido y datos de pago',
    field: 'template_order_confirmed',
    tags: [{ tag: '{pedido_id}', label: 'ID Pedido' }, { tag: '{cliente}', label: 'Cliente' }, { tag: '{carrito_items}', label: 'Items' }, { tag: '{total}', label: 'Total' }, { tag: '{direccion}', label: 'Dirección' }, { tag: '{instrucciones_pago}', label: 'Instrucciones Pago' }]
  },
  {
    id: 'template_order_cancelled',
    category: 'buy_flow',
    num: '❌',
    title: 'Pedido Cancelado',
    desc: 'Respuesta al escribir CANCELAR o SALIR',
    field: 'template_order_cancelled',
    tags: [{ tag: '{menu}', label: 'Menú Principal' }]
  },

  // Categoría 3: Notificaciones de Pedidos
  {
    id: 'template_new_order',
    category: 'notifications',
    num: '🍬',
    title: 'Nuevo Pedido Web Recibido',
    desc: 'Enviado automáticamente al registrar pedido en la tienda',
    field: 'template_new_order',
    tags: [{ tag: '{cliente}', label: 'Cliente' }, { tag: '{pedido_id}', label: 'ID Pedido' }, { tag: '{total}', label: 'Total' }, { tag: '{direccion}', label: 'Dirección' }, { tag: '{productos}', label: 'Productos' }, { tag: '{alias_banco}', label: 'Alias' }, { tag: '{banco}', label: 'Banco' }, { tag: '{titular}', label: 'Titular' }, { tag: '{cbu}', label: 'CBU' }]
  },
  {
    id: 'template_order_preparing',
    category: 'notifications',
    num: '👨‍🍳',
    title: 'Pedido en Preparación',
    desc: 'Enviado al cambiar estado a "En Preparación" en Admin',
    field: 'template_order_preparing',
    tags: [{ tag: '{cliente}', label: 'Cliente' }, { tag: '{pedido_id}', label: 'ID Pedido' }, { tag: '{total}', label: 'Total' }]
  },
  {
    id: 'template_order_ready',
    category: 'notifications',
    num: '✨',
    title: 'Pedido Listo para Retirar',
    desc: 'Enviado al marcar pedido "Listo para Retirar"',
    field: 'template_order_ready',
    tags: [{ tag: '{cliente}', label: 'Cliente' }, { tag: '{pedido_id}', label: 'ID Pedido' }]
  },
  {
    id: 'template_order_shipped',
    category: 'notifications',
    num: '🛵',
    title: 'Pedido Enviado / En Camino',
    desc: 'Enviado al despachar pedido con cadete',
    field: 'template_order_shipped',
    tags: [{ tag: '{cliente}', label: 'Cliente' }, { tag: '{pedido_id}', label: 'ID Pedido' }, { tag: '{direccion}', label: 'Dirección' }]
  },
  {
    id: 'template_payment_proof',
    category: 'notifications',
    num: '📸',
    title: 'Comprobante de Pago Recibido',
    desc: 'Respuesta automática cuando el cliente envía captura',
    field: 'template_payment_proof',
    tags: [{ tag: '{cliente}', label: 'Cliente' }]
  }
];
