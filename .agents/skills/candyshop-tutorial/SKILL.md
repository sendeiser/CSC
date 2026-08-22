---
name: candyshop-tutorial-generator
description: Ejecuta la navegación automatizada en candyshopchamical.netlify.app, captura pantallas reales del catálogo, carrito y checkout, y compila un tutorial de compra en Markdown con imágenes.
---

# Generador de Tutorial Candy Shop Chamical

## Instrucciones
1. Asegurar que las dependencias estén listas (`pip install playwright && playwright install chromium`).
2. Ejecutar `python scripts/generate_tutorial.py`.
3. Validar que las imágenes en `docs/tutorial-assets/` y el archivo `TUTORIAL_COMPRA_CANDYSHOP.md` se hayan creado correctamente.
