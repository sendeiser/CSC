import asyncio
import os
import sys
from pathlib import Path
from playwright.async_api import async_playwright

# Configurar encoding UTF-8 seguro para Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Directorio donde se guardarán las capturas del tutorial
OUTPUT_DIR = Path("docs/tutorial-assets")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

TARGET_URL = os.getenv("SHOP_URL", "https://candyshopchamical.netlify.app/")

async def generate_candy_shop_tutorial():
    async with async_playwright() as p:
        is_headless = os.getenv("HEADLESS", "true").lower() != "false"
        browser = await p.chromium.launch(headless=is_headless, slow_mo=300)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 850},
            locale="es-AR"
        )
        page = await context.new_page()

        print(f"[*] Navegando a: {TARGET_URL}")
        
        # -------------------------------------------------------------
        # PASO 1: Ingreso a la tienda y vista del catálogo
        # -------------------------------------------------------------
        try:
            await page.goto(TARGET_URL, wait_until="networkidle", timeout=30000)
        except Exception:
            await page.goto(TARGET_URL, wait_until="domcontentloaded")
            
        await page.wait_for_timeout(2000)
        step1_img = OUTPUT_DIR / "01_catalogo_inicio.png"
        await page.screenshot(path=step1_img, full_page=False)
        print(" -> [Paso 1] Captura del catalogo guardada.")

        # -------------------------------------------------------------
        # PASO 2: Selección y adición de un producto al carrito
        # -------------------------------------------------------------
        nav_catalog = page.locator("button:has-text('Golosinas'), a:has-text('Golosinas'), button:has-text('Ver Catálogo'), a:has-text('Ver Catálogo')").first
        if await nav_catalog.count() > 0:
            try:
                await nav_catalog.click()
                await page.wait_for_timeout(1000)
            except Exception:
                pass

        add_btn = page.locator("button[title*='carrito'], button[title*='Añadir'], button:has-text('Agregar'), button:has-text('Comprar')").first
        
        if await add_btn.count() > 0:
            await add_btn.scroll_into_view_if_needed()
            await page.wait_for_timeout(600)
            step2_img = OUTPUT_DIR / "02_seleccionar_producto.png"
            await page.screenshot(path=step2_img)
            print(" -> [Paso 2] Captura de seleccion de producto guardada.")
            
            await add_btn.click()
            await page.wait_for_timeout(1200)
        else:
            product_card = page.locator("article, .product-card, .card, [class*='rounded-3xl']").first
            if await product_card.count() > 0:
                await product_card.click()
                await page.wait_for_timeout(1000)
                step2_img = OUTPUT_DIR / "02_detalle_producto.png"
                await page.screenshot(path=step2_img)
                print(" -> [Paso 2] Captura del detalle del producto guardada.")
                
                btn_detail = page.locator("button:has-text('Agregar'), button:has-text('Añadir a la bolsa'), button:has-text('Comprar')").first
                if await btn_detail.count() > 0:
                    await btn_detail.click()
                    await page.wait_for_timeout(1200)

        # -------------------------------------------------------------
        # PASO 3: Abrir / Revisar el Carrito de Compras
        # -------------------------------------------------------------
        cart_trigger = page.locator("#floating-cart-btn, #header-cart-btn, #header-mobile-cart-btn, button:has-text('Carrito'), [aria-label*='Carrito'], [aria-label*='cart']").first
        if await cart_trigger.count() > 0:
            await cart_trigger.click()
            await page.wait_for_timeout(1200)

        step3_img = OUTPUT_DIR / "03_carrito_compras.png"
        await page.screenshot(path=step3_img)
        print(" -> [Paso 3] Captura del carrito guardada.")

        # -------------------------------------------------------------
        # PASO 4: Ir al Checkout / Formulario de Envío y Pedido
        # -------------------------------------------------------------
        checkout_btn = page.locator("#drawer-checkout-btn, button:has-text('Finalizar Pedido'), button:has-text('Iniciar Compra'), button:has-text('Continuar')").first
        
        if await checkout_btn.count() > 0:
            await checkout_btn.click()
            await page.wait_for_timeout(2000)
            
            # Scroll para mostrar opciones de entrega y pago
            payment_sec = page.locator("text=Forma de Pago, text=Datos de Entrega, form, #payment-method-selector").first
            if await payment_sec.count() > 0:
                try:
                    await payment_sec.scroll_into_view_if_needed()
                    await page.wait_for_timeout(500)
                except Exception:
                    pass
                    
            step4_img = OUTPUT_DIR / "04_formulario_pedido.png"
            await page.screenshot(path=step4_img)
            print(" -> [Paso 4] Captura de checkout/pedido guardada.")
        else:
            # Fallback navegando directo a la pantalla de carrito
            try:
                await page.goto(f"{TARGET_URL}#carrito", wait_until="networkidle")
                await page.wait_for_timeout(1500)
                step4_img = OUTPUT_DIR / "04_formulario_pedido.png"
                await page.screenshot(path=step4_img)
                print(" -> [Paso 4] Captura de checkout/pedido guardada.")
            except Exception:
                pass

        await browser.close()
        print("[OK] Capturas finalizadas con exito.")

        # -------------------------------------------------------------
        # PASO 5: Generar el archivo Markdown del Tutorial
        # -------------------------------------------------------------
        generate_markdown_tutorial()

def generate_markdown_tutorial():
    tutorial_content = """# 🍬 Guía Paso a Paso: Cómo Comprar en Candy Shop Chamical

¡Bienvenido! En este tutorial te mostramos lo fácil y rápido que es realizar tu pedido desde nuestra tienda online.

---

### Paso 1: Explorá nuestro catálogo
Ingresá a [Candy Shop Chamical](https://candyshopchamical.netlify.app/) y navegá por nuestras categorías de golosinas, combos y promociones.

![Paso 1 - Catálogo](docs/tutorial-assets/01_catalogo_inicio.png)

---

### Paso 2: Elegí tus productos
Hacé clic en el producto que más te guste o presioná directamente en el botón **"Agregar"** / **"Comprar"** para sumarlo a tu pedido.

![Paso 2 - Selección de Producto](docs/tutorial-assets/02_seleccionar_producto.png)

---

### Paso 3: Revisá tu carrito
Accedé a tu carrito de compras en la esquina derecha para verificar las cantidades, los precios y el total acumulado de tu compra.

![Paso 3 - Carrito de Compras](docs/tutorial-assets/03_carrito_compras.png)

---

### Paso 4: Completá tus datos y confirmá el pedido
Hacé clic en **"Finalizar Pedido"**, completá tus datos de entrega o retiro y elegí el medio de pago preferido (Efectivo o Transferencia).

![Paso 4 - Confirmación](docs/tutorial-assets/04_formulario_pedido.png)

---
*¡Listo! Tu pedido quedará registrado y nos pondremos en contacto para coordinar la entrega.*
"""
    with open("TUTORIAL_COMPRA_CANDYSHOP.md", "w", encoding="utf-8") as f:
        f.write(tutorial_content)
    print("[OK] Archivo TUTORIAL_COMPRA_CANDYSHOP.md generado correctamente.")

if __name__ == "__main__":
    asyncio.run(generate_candy_shop_tutorial())
