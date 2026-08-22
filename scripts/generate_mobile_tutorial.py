import asyncio
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

# Configurar encoding UTF-8 seguro para Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

OUTPUT_DIR = Path("docs/tutorial-mobile")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR = Path("docs/tutorial-mobile/raw")
RAW_DIR.mkdir(parents=True, exist_ok=True)

TARGET_URL = os.getenv("SHOP_URL", "https://candyshopchamical.netlify.app/")

def add_banner_annotation(
    image_path: Path,
    output_path: Path,
    step_number: str,
    title: str,
    instruction: str,
    footer_tip: str = "",
    highlight_box: tuple = None,
    callout_text: str = "",
    callout_pos: tuple = None
):
    """
    Agrega un banner superior premium, barra inferior de tips y señaladores visuales interactivos
    (cajas de enfoque y badges con flechas) para que el paso se entienda a simple vista.
    """
    img = Image.open(image_path).convert("RGBA")
    w, h = img.size

    # Altura del banner superior e inferior
    banner_top_h = 240
    banner_bottom_h = 100 if footer_tip else 0

    total_h = h + banner_top_h + banner_bottom_h
    canvas = Image.new("RGBA", (w, total_h), (248, 250, 252, 255))
    draw = ImageDraw.Draw(canvas)

    # 1. Gradiente del Banner Superior
    for y in range(banner_top_h):
        ratio = y / banner_top_h
        r = int(219 * (1 - ratio * 0.4) + 124 * (ratio * 0.4))
        g = int(39 * (1 - ratio * 0.4) + 58 * (ratio * 0.4))
        b = int(119 * (1 - ratio * 0.4) + 237 * (ratio * 0.4))
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

    # Línea inferior decorativa del banner
    draw.line([(0, banner_top_h - 2), (w, banner_top_h - 2)], fill=(255, 255, 255, 120), width=2)

    # Cargar tipografías seguras de Windows
    try:
        font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 26)
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 36)
        font_desc = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 25)
        font_callout = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 23)
        font_footer = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", 22)
    except Exception:
        font_badge = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_desc = ImageFont.load_default()
        font_callout = ImageFont.load_default()
        font_footer = ImageFont.load_default()

    # Badge de Paso (Píldora blanca destacada)
    badge_text = f" PASO {step_number} DE 5 "
    badge_x = 32
    badge_y = 24
    draw.rounded_rectangle(
        [(badge_x, badge_y), (badge_x + 215, badge_y + 42)],
        radius=12,
        fill=(255, 255, 255, 255)
    )
    draw.text((badge_x + 14, badge_y + 6), badge_text, fill=(190, 24, 93, 255), font=font_badge)

    # Título principal del paso
    title_x = 32
    title_y = 78
    # Sombra del título para alto contraste
    draw.text((title_x + 2, title_y + 2), title, fill=(0, 0, 0, 120), font=font_title)
    draw.text((title_x, title_y), title, fill=(255, 255, 255, 255), font=font_title)

    # Instrucción con auto-wrap de 2 líneas
    desc_x = 32
    desc_y = 132
    # Separar en líneas si es muy largo
    import textwrap
    lines = textwrap.wrap(instruction, width=48)
    for idx, line in enumerate(lines[:2]):
        draw.text((desc_x, desc_y + (idx * 34)), line, fill=(254, 242, 242, 255), font=font_desc)

    # 2. Pegar la captura de pantalla del celular en el medio
    canvas.paste(img, (0, banner_top_h), img)

    # 3. Resaltados y Punteros en Pantalla (Highlight Box & Callout Badge)
    if highlight_box:
        x1, y1, x2, y2 = highlight_box
        y1_adj = y1 + banner_top_h
        y2_adj = y2 + banner_top_h

        # Resplandor exterior (Glow)
        for offset in range(8, 0, -1):
            alpha = int(35 * (1 - offset / 8))
            draw.rounded_rectangle(
                [(x1 - offset, y1_adj - offset), (x2 + offset, y2_adj + offset)],
                radius=18,
                outline=(236, 72, 153, alpha),
                width=2
            )

        # Borde principal brillante neón
        draw.rounded_rectangle(
            [(x1, y1_adj), (x2, y2_adj)],
            radius=16,
            outline=(244, 63, 94, 255),
            width=5
        )

    # Callout Badge con flecha/ícono
    if callout_text and callout_pos:
        cx, cy = callout_pos
        cy_adj = cy + banner_top_h

        # Limpiar emojis o caracteres no soportados por la fuente
        clean_callout = (
            callout_text
            .replace("👇", "")
            .replace("💡", "")
            .replace("👉", "")
            .replace("▶", "")
            .replace("★", "")
            .strip()
        )

        # Medir ancho del texto
        text_w = len(clean_callout) * 14 + 60
        badge_w = min(w - 40, max(320, text_w))
        badge_h = 52

        bx1 = max(20, min(cx - badge_w // 2, w - badge_w - 20))
        by1 = cy_adj - badge_h // 2
        bx2 = bx1 + badge_w
        by2 = by1 + badge_h

        # Sombra del badge
        draw.rounded_rectangle(
            [(bx1 + 3, by1 + 4), (bx2 + 3, by2 + 4)],
            radius=16,
            fill=(0, 0, 0, 140)
        )
        # Fondo del badge en rojo/fucsia sólido de alto contraste
        draw.rounded_rectangle(
            [(bx1, by1), (bx2, by2)],
            radius=16,
            fill=(225, 29, 72, 255),
            outline=(255, 255, 255, 255),
            width=3
        )
        # Texto del badge centrado
        draw.text((bx1 + 20, by1 + 11), clean_callout, fill=(255, 255, 255, 255), font=font_callout)

    # 4. Barra Inferior de Tips / Siguiente Acción
    if footer_tip:
        foot_y = total_h - banner_bottom_h
        clean_foot = footer_tip.replace("💡", "").replace("👉", "").strip()
        if not clean_foot.startswith("TIP:") and not clean_foot.startswith("Tip:"):
            clean_foot = f"TIP: {clean_foot}"

        # Fondo oscuro elegante
        for y in range(banner_bottom_h):
            ratio = y / banner_bottom_h
            r = int(24 * (1 - ratio) + 15 * ratio)
            g = int(18 * (1 - ratio) + 12 * ratio)
            b = int(40 * (1 - ratio) + 30 * ratio)
            draw.line([(0, foot_y + y), (w, foot_y + y)], fill=(r, g, b, 255))

        # Línea superior de la barra
        draw.line([(0, foot_y), (w, foot_y)], fill=(168, 85, 247, 180), width=2)
        
        # Texto del footer con auto-wrap si es largo
        import textwrap
        foot_lines = textwrap.wrap(clean_foot, width=54)
        for f_idx, f_line in enumerate(foot_lines[:2]):
            draw.text((32, foot_y + 22 + (f_idx * 28)), f_line, fill=(243, 232, 255, 255), font=font_footer)

    canvas.convert("RGB").save(output_path, "PNG", optimize=True)
    print(f" -> Editada y guardada: {output_path.name}")


async def capture_mobile_flow():
    async with async_playwright() as p:
        is_headless = os.getenv("HEADLESS", "true").lower() != "false"
        browser = await p.chromium.launch(headless=is_headless, slow_mo=350)
        
        context = await browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
            locale="es-AR"
        )
        page = await context.new_page()

        print(f"[*] Navegando en vista celular a: {TARGET_URL}")

        # -------------------------------------------------------------
        # PASO 1: Ingreso a la tienda y catálogo
        # -------------------------------------------------------------
        try:
            await page.goto(f"{TARGET_URL}#catalogo", wait_until="networkidle", timeout=30000)
        except Exception:
            await page.goto(f"{TARGET_URL}#catalogo", wait_until="domcontentloaded")
            
        await page.wait_for_timeout(2500)
        # Scroll para centrar las tarjetas de productos y categorías
        await page.evaluate("window.scrollTo(0, 460)")
        await page.wait_for_timeout(600)

        raw1 = RAW_DIR / "01_catalogo_raw.png"
        await page.screenshot(path=raw1)
        print(" -> [Paso 1] Captura base del catálogo tomada.")

        add_banner_annotation(
            raw1,
            OUTPUT_DIR / "01_paso1_catalogo_celular.png",
            step_number="1",
            title="1. Explorá el Catálogo",
            instruction="Navegá por categorías (Gomitas, Chocolates) y elegí tu golosina favorita.",
            footer_tip="Tip: Podés usar el buscador superior para encontrar cualquier dulce rápido.",
            highlight_box=(20, 320, 760, 1640),
            callout_text="1. TOCA UNA GOLOSINA PARA ELEGIR SABORES O PESO",
            callout_pos=(390, 280)
        )

        # -------------------------------------------------------------
        # PASO 2: Ver detalle y seleccionar peso o sabores
        # -------------------------------------------------------------
        detail_btn = page.locator("button[title='Ver detalle']").first
        if await detail_btn.count() > 0:
            await detail_btn.click()
            await page.wait_for_timeout(1500)
        else:
            first_card = page.locator(".group.relative, article, .product-card").first
            if await first_card.count() > 0:
                await first_card.click()
                await page.wait_for_timeout(1500)

        # Seleccionar gramaje si existe botón de peso (ej. 150g o 200g)
        weight_btn = page.locator("button:has-text('150g'), button:has-text('200g'), button:has-text('100g')").first
        if await weight_btn.count() > 0:
            try:
                await weight_btn.click()
                await page.wait_for_timeout(500)
            except Exception:
                pass

        # Scroll para mostrar claramente los botones de peso y el botón de añadir a la bolsa
        await page.evaluate("window.scrollTo(0, 360)")
        await page.wait_for_timeout(600)

        raw2 = RAW_DIR / "02_detalle_raw.png"
        await page.screenshot(path=raw2)
        print(" -> [Paso 2] Captura base de detalle de producto tomada.")

        add_banner_annotation(
            raw2,
            OUTPUT_DIR / "02_paso2_elegir_producto.png",
            step_number="2",
            title="2. Elegí Gramaje y Añadí a la Bolsa",
            instruction="Seleccioná la cantidad en gramos (50g, 100g, 250g) y tocá 'Añadir a la bolsa'.",
            footer_tip="Tip: El precio se calcula automáticamente según los gramos que elijas.",
            highlight_box=(20, 720, 760, 1600),
            callout_text="2. ELEGI LOS GRAMOS Y TOCA 'AGREGAR A LA BOLSA'",
            callout_pos=(390, 680)
        )

        # Añadir al carrito
        add_btn = page.locator("#addToCartDetail").first
        if await add_btn.count() > 0:
            await add_btn.click()
            await page.wait_for_timeout(1200)

        # -------------------------------------------------------------
        # PASO 3: Abrir Slide Drawer del Carrito en Celular
        # -------------------------------------------------------------
        cart_btn = page.locator("#floating-cart-btn, #header-mobile-cart-btn").first
        if await cart_btn.count() > 0:
            await cart_btn.click()
            await page.wait_for_timeout(1500)

        raw3 = RAW_DIR / "03_carrito_drawer_raw.png"
        await page.screenshot(path=raw3)
        print(" -> [Paso 3] Captura base del carrito lateral tomada.")

        add_banner_annotation(
            raw3,
            OUTPUT_DIR / "03_paso3_carrito_lateral.png",
            step_number="3",
            title="3. Revisá tu Pedido en el Carrito",
            instruction="Verificá tus productos, ajustá cantidades y tocá 'Finalizar Pedido'.",
            footer_tip="Tip: Podés usar [+] y [-] para ajustar cantidades o seguir comprando.",
            highlight_box=(20, 1280, 760, 1650),
            callout_text="3. REVISA TU PEDIDO Y TOCA 'FINALIZAR PEDIDO'",
            callout_pos=(390, 1230)
        )

        # -------------------------------------------------------------
        # PASO 4: Formulario de Envío y Forma de Pago (Paso 'shipping')
        # -------------------------------------------------------------
        checkout_drawer_btn = page.locator("#drawer-checkout-btn").first
        if await checkout_drawer_btn.count() > 0:
            await checkout_drawer_btn.click()
            await page.wait_for_timeout(1500)

        # En CartScreen, hacer clic en 'Proceder al Pago' para abrir el formulario
        proceder_btn = page.locator("button:has-text('Proceder al Pago')").first
        if await proceder_btn.count() > 0:
            await proceder_btn.click()
            await page.wait_for_timeout(1500)

        # Llenar datos del cliente
        name_input = page.locator("input[placeholder*='Tu nombre y apellido']").first
        if await name_input.count() > 0:
            try:
                await name_input.fill("Camila Gómez")
            except Exception:
                pass

        phone_input = page.locator("input[placeholder*='+54 9'], input[placeholder*='WhatsApp']").first
        if await phone_input.count() > 0:
            try:
                await phone_input.fill("+54 9 3826 445566")
            except Exception:
                pass

        # Seleccionar método de pago Transferencia
        transfer_opt = page.locator("label:has-text('Transferencia')").first
        if await transfer_opt.count() > 0:
            try:
                await transfer_opt.click()
                await page.wait_for_timeout(500)
            except Exception:
                pass

        # Posicionar scroll para ver datos, métodos de pago y botón confirmar
        await page.evaluate("window.scrollTo(0, 440)")
        await page.wait_for_timeout(800)

        raw4 = RAW_DIR / "04_checkout_raw.png"
        await page.screenshot(path=raw4)
        print(" -> [Paso 4] Captura base del formulario de checkout tomada.")

        add_banner_annotation(
            raw4,
            OUTPUT_DIR / "04_paso4_datos_y_pago.png",
            step_number="4",
            title="4. Datos de Envío y Forma de Pago",
            instruction="Elegí Retiro o Delivery, completá tu WhatsApp y seleccioná Transferencia.",
            footer_tip="Tip: Podés pagar por Transferencia bancaria/CVU o en Efectivo al recibir.",
            highlight_box=(20, 620, 760, 1650),
            callout_text="4. CARGA TUS DATOS Y ELEGI TRANSFERENCIA",
            callout_pos=(390, 580)
        )

        # -------------------------------------------------------------
        # PASO 5: Confirmación de Pedido y Envío por WhatsApp
        # -------------------------------------------------------------
        confirm_btn = page.locator("button:has-text('Confirmar pedido')").first
        if await confirm_btn.count() > 0:
            await confirm_btn.scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            await confirm_btn.click()
            await page.wait_for_timeout(2500)

        # Scroll enfocado en la tarjeta de transferencia bancaria y botón de WhatsApp
        await page.evaluate("window.scrollTo(0, 480)")
        await page.wait_for_timeout(800)

        raw5 = RAW_DIR / "05_confirmacion_raw.png"
        await page.screenshot(path=raw5)
        print(" -> [Paso 5] Captura base de confirmación de pedido tomada.")

        add_banner_annotation(
            raw5,
            OUTPUT_DIR / "05_paso5_confirmacion_whatsapp.png",
            step_number="5",
            title="5. Confirmación y Envío de Comprobante",
            instruction="Copiá el Alias para transferir y tocá el botón verde para mandar el comprobante.",
            footer_tip="Tip: Al tocar el botón verde, se abre WhatsApp con tu pedido ya armado.",
            highlight_box=(20, 520, 760, 1650),
            callout_text="5. COPIA EL ALIAS Y ENVIA EL COMPROBANTE",
            callout_pos=(390, 480)
        )

        await browser.close()
        print("[OK] Flujo móvil completado y todas las imágenes editadas con éxito.")

        generate_mobile_markdown_tutorial()


def generate_mobile_markdown_tutorial():
    content = """# 📱 Guía Paso a Paso: Cómo Comprar desde tu Celular en Candy Shop Chamical

¡Comprar tus golosinas favoritas desde tu celular es súper fácil y rápido! Seguí estos 5 simples pasos:

---

### 🛍️ Paso 1: Explorá nuestro catálogo desde tu celular
Ingresá a [Candy Shop Chamical](https://candyshopchamical.netlify.app/) desde el navegador de tu celular (Chrome, Safari, etc.). Podés navegar por categorías de gomitas por peso, combos, bandejas surtidas y chocolates.

![Paso 1: Explorá el Catálogo](docs/tutorial-mobile/01_paso1_catalogo_celular.png)

---

### 🍬 Paso 2: Elegí tus productos y personalizá gramos o sabores
Tocá en **"Ver detalle"** sobre la golosina que más te guste:
- **Gomitas por peso:** Podés elegir 50g, 100g, 150g, 200g, etc.
- **Bandejas y combos:** Podés elegir los sabores de gomitas que más te gusten.
- Presioná **"Añadir a la bolsa"** para sumarlo a tu compra.

![Paso 2: Elegí Gramaje y Sabores](docs/tutorial-mobile/02_paso2_elegir_producto.png)

---

### 🛒 Paso 3: Revisá tu carrito en el menú lateral
Tocá el **botón flotante del carrito** en la esquina inferior derecha o el ícono de bolsa en la barra superior.
- Se deslizará un menú lateral desde la derecha donde verás todos tus productos y el **Total Acumulado**.
- Podés sumar o restar cantidades con los botones `+` y `-`.
- Presioná el botón **"Finalizar Pedido 🚀"**.

![Paso 3: Menú Lateral del Carrito](docs/tutorial-mobile/03_paso3_carrito_lateral.png)

---

### 📝 Paso 4: Completá tus datos de entrega y medio de pago
En la pantalla de compra:
1. Seleccioná si querés **Retiro en el local** o **Envío a domicilio**.
2. Ingresá tu **Nombre y Apellido** y tu número de **WhatsApp / Celular**.
3. Elegí tu medio de pago: **Efectivo** al recibir o **Transferencia bancaria** (con alias directo).
4. Tocá en **"Confirmar pedido"**.

![Paso 4: Datos de Envío y Pago](docs/tutorial-mobile/04_paso4_datos_y_pago.png)

---

### 📲 Paso 5: ¡Pedido Confirmado y Envío por WhatsApp!
¡Listo! Tu pedido quedó registrado:
- Vas a ver tu **Número de Pedido** oficial (ej: `#3A89F12B`).
- Si pagás por transferencia, tenés a mano el **Alias** y datos de la cuenta.
- Presioná el botón **"Enviar comprobante por WhatsApp 💬"** para mandarnos el comprobante y coordinar la entrega en minutos.

![Paso 5: Confirmación y Envío](docs/tutorial-mobile/05_paso5_confirmacion_whatsapp.png)

---

🍬 **¡Listo! Disfrutá de las golosinas más ricas de Chamical!**
"""
    with open("TUTORIAL_COMPRA_CELULAR.md", "w", encoding="utf-8") as f:
        f.write(content)
    print("[OK] Archivo TUTORIAL_COMPRA_CELULAR.md creado con éxito.")


if __name__ == "__main__":
    asyncio.run(capture_mobile_flow())
