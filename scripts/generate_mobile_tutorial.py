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
    highlight_box: tuple = None
):
    """
    Agrega un banner superior premium con estilo Candy Shop a la captura del celular.
    """
    img = Image.open(image_path).convert("RGBA")
    w, h = img.size

    # Dimensiones del banner explicativo superior
    banner_height = int(150 * (w / 780))
    banner_height = max(160, min(banner_height, 220))

    # Crear nueva imagen con espacio para el banner
    canvas = Image.new("RGBA", (w, h + banner_height), (248, 250, 252, 255))
    
    # Dibujar el banner con degradado candy (Rosa fucsia a Violeta púrpura)
    draw = ImageDraw.Draw(canvas)
    
    for y in range(banner_height):
        ratio = y / banner_height
        r = int(236 * (1 - ratio * 0.4) + 139 * (ratio * 0.4))
        g = int(72 * (1 - ratio * 0.4) + 92 * (ratio * 0.4))
        b = int(153 * (1 - ratio * 0.4) + 246 * (ratio * 0.4))
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

    # Cargar fuentes
    try:
        font_badge = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", int(w * 0.032))
        font_title = ImageFont.truetype("C:/Windows/Fonts/segoeuib.ttf", int(w * 0.040))
        font_desc = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", int(w * 0.029))
    except Exception:
        font_badge = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_desc = ImageFont.load_default()

    # Pastilla de Paso (Badge blanco)
    badge_text = f" PASO {step_number} "
    badge_x = int(w * 0.05)
    badge_y = int(banner_height * 0.15)
    
    draw.rounded_rectangle(
        [(badge_x, badge_y), (badge_x + int(w * 0.25), badge_y + int(banner_height * 0.28))],
        radius=int(w * 0.015),
        fill=(255, 255, 255, 240)
    )
    draw.text((badge_x + int(w * 0.02), badge_y + int(banner_height * 0.04)), badge_text, fill=(190, 24, 93, 255), font=font_badge)

    # Título principal
    title_x = badge_x + int(w * 0.28)
    title_y = badge_y + int(banner_height * 0.02)
    draw.text((title_x, title_y), title, fill=(255, 255, 255, 255), font=font_title)

    # Descripción / Instrucción
    desc_x = int(w * 0.05)
    desc_y = int(banner_height * 0.54)
    draw.text((desc_x, desc_y), instruction, fill=(254, 242, 242, 255), font=font_desc)

    # Pegar captura del celular debajo del banner
    canvas.paste(img, (0, banner_height), img)

    # Si hay recuadro de resaltado (highlight)
    if highlight_box:
        x1, y1, x2, y2 = highlight_box
        y1_adj = y1 + banner_height
        y2_adj = y2 + banner_height
        for offset in range(4):
            draw.rounded_rectangle(
                [(x1 - offset, y1_adj - offset), (x2 + offset, y2_adj + offset)],
                radius=12,
                outline=(236, 72, 153, 255)
            )

    # Guardar imagen final optimizada
    canvas.convert("RGB").save(output_path, "PNG", optimize=True)
    print(f" -> Editada y guardada: {output_path.name}")


async def capture_mobile_flow():
    async with async_playwright() as p:
        is_headless = os.getenv("HEADLESS", "true").lower() != "false"
        browser = await p.chromium.launch(headless=is_headless, slow_mo=350)
        
        # Emular Celular moderno (iPhone 14 / Pixel 7: 390x844 con device_scale_factor=2 para ultra nitidez)
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
        # PASO 1: Ingreso a la tienda y vista del catálogo en celular
        # -------------------------------------------------------------
        try:
            await page.goto(f"{TARGET_URL}#catalogo", wait_until="networkidle", timeout=30000)
        except Exception:
            await page.goto(f"{TARGET_URL}#catalogo", wait_until="domcontentloaded")
            
        await page.wait_for_timeout(2500)
        raw1 = RAW_DIR / "01_catalogo_raw.png"
        await page.screenshot(path=raw1)
        print(" -> [Paso 1] Captura base del catálogo tomada.")

        add_banner_annotation(
            raw1,
            OUTPUT_DIR / "01_paso1_catalogo_celular.png",
            step_number="1",
            title="Explorá las Golosinas",
            instruction="Ingresá a la tienda, navegá por categorías y elegí lo que más te guste."
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

        raw2 = RAW_DIR / "02_detalle_raw.png"
        await page.screenshot(path=raw2)
        print(" -> [Paso 2] Captura base de detalle de producto tomada.")

        add_banner_annotation(
            raw2,
            OUTPUT_DIR / "02_paso2_elegir_producto.png",
            step_number="2",
            title="Elegí Gramaje y Sabores",
            instruction="Seleccioná los gramos o sabores y tocá 'Añadir a la bolsa'."
        )

        # Añadir al carrito usando el botón #addToCartDetail
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
            title="Revisá tu Carrito Lateral",
            instruction="Mirá tus golosinas, ajustá cantidades y tocá 'Finalizar Pedido'."
        )

        # -------------------------------------------------------------
        # PASO 4: Formulario de Checkout / Envío y Forma de Pago
        # -------------------------------------------------------------
        checkout_drawer_btn = page.locator("#drawer-checkout-btn").first
        if await checkout_drawer_btn.count() > 0:
            await checkout_drawer_btn.click()
            await page.wait_for_timeout(2000)

        # Llenar datos de prueba para que se vea completo y claro en la captura
        name_input = page.locator("input[placeholder*='Nombre'], #buyer-name, input[name='name']").first
        if await name_input.count() > 0:
            try:
                await name_input.fill("Camila Gómez")
            except Exception:
                pass

        phone_input = page.locator("input[placeholder*='Celular'], input[placeholder*='WhatsApp'], #buyer-phone, input[name='phone']").first
        if await phone_input.count() > 0:
            try:
                await phone_input.fill("3826 123456")
            except Exception:
                pass

        # Scroll hacia la sección de método de pago
        await page.evaluate("window.scrollBy(0, 340)")
        await page.wait_for_timeout(800)

        raw4 = RAW_DIR / "04_checkout_raw.png"
        await page.screenshot(path=raw4)
        print(" -> [Paso 4] Captura base del formulario de checkout tomada.")

        add_banner_annotation(
            raw4,
            OUTPUT_DIR / "04_paso4_datos_y_pago.png",
            step_number="4",
            title="Datos de Envío y Pago",
            instruction="Ingresá tu nombre, celular y seleccioná Efectivo o Transferencia."
        )

        # -------------------------------------------------------------
        # PASO 5: Confirmación de Pedido y Resumen
        # -------------------------------------------------------------
        # Hacer clic en Confirmar pedido
        confirm_btn = page.locator("button:has-text('Confirmar pedido'), button:has-text('Confirmar')").first
        if await confirm_btn.count() > 0:
            await confirm_btn.click()
            await page.wait_for_timeout(2500)

        # Scroll al botón de WhatsApp
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(800)

        raw5 = RAW_DIR / "05_confirmacion_raw.png"
        await page.screenshot(path=raw5)
        print(" -> [Paso 5] Captura base de confirmación de pedido tomada.")

        add_banner_annotation(
            raw5,
            OUTPUT_DIR / "05_paso5_confirmacion_whatsapp.png",
            step_number="5",
            title="Confirmá y Coordiná por WhatsApp",
            instruction="¡Listo! Tu pedido está registrado. Tocá el botón verde para enviar a WhatsApp."
        )

        await browser.close()
        print("[OK] Flujo móvil completado y todas las imágenes editadas con éxito.")

        # Generar Markdown tutorial
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
2. Ingresá tu **Nombre** y tu número de **WhatsApp / Celular**.
3. Elegí tu medio de pago: **Efectivo** al recibir o **Transferencia bancaria** (con alias directo).

![Paso 4: Datos de Envío y Pago](docs/tutorial-mobile/04_paso4_datos_y_pago.png)

---

### 📲 Paso 5: Confirmá tu pedido y envialo por WhatsApp
Presioná **"Confirmar Pedido"**:
- Tu pedido quedará registrado inmediatamente en nuestro sistema.
- Se abrirá WhatsApp con el mensaje ya armado con todos los detalles para que nos llegue directamente y coordinemos la entrega en minutos.

![Paso 5: Confirmación y Envío](docs/tutorial-mobile/05_paso5_confirmacion_whatsapp.png)

---

🍬 **¡Listo! Disfrutá de las golosinas más ricas de Chamical!**
"""
    with open("TUTORIAL_COMPRA_CELULAR.md", "w", encoding="utf-8") as f:
        f.write(content)
    print("[OK] Archivo TUTORIAL_COMPRA_CELULAR.md creado con éxito.")


if __name__ == "__main__":
    asyncio.run(capture_mobile_flow())
