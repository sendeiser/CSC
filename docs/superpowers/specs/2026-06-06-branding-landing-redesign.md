# Chamical Candy Shop - Rebranding y Rediseño de Landing

## Objetivo
Migrar la identidad visual y contenidos de "Candyverse" (marca ficticia galáctica) a "Chamical Candy Shop" (CSC) — tienda real de venta de golosinas, gomitas por granel, chocolates, etc., con local físico en Chamical.

## Cambios Globales

### Brand name en toda la app
- `Candyverse` → `Chamical Candy Shop` (expandido) / `CSC` (abreviado)
- Archivos a modificar: Header.tsx, App.tsx, AdminPanel.tsx, AuthScreens.tsx, ProductDetailScreen.tsx, index.html, metadata.json, server/index.ts, scripts/create-admin.ts
- localStorage keys (`candyverse_token`) y server logs también actualizados

## Nueva Landing Page

### Paleta
Pastel: rosas suaves, lavanda, menta, crema — manteniendo la base actual (#fdf2f8, #f3e8ff, etc.)

### Secciones (6)

1. **Hero** - "Chamical Candy Shop" + tagline local. CTA: Catálogo / Contacto
2. **Sobre Nosotros** - Historia del negocio, valores, atención personalizada
3. **Nuestros Productos** - Categorías (Gomitas, Chocolates, Acidulados, Caramelos, Regalos) con íconos
4. **Nuestra Tienda** - Dirección placeholder, horarios, teléfono, badge físico+online
5. **Galería** - Grid de productos destacados
6. **Contacto** - WhatsApp, Instagram, CTA final

### Datos
- Actualizar `PILLARS` en data.ts para reflejar valores reales del negocio
- Actualizar `TEAM_MEMBERS` o reemplazar con info del equipo real
- Agregar `STORE_INFO` con datos placeholder

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/LandingScreen.tsx` | Rediseño completo |
| `src/components/Header.tsx` | Brand "CSC" |
| `src/App.tsx` | Footer brand |
| `src/components/AdminPanel.tsx` | "CSC Admin" |
| `src/components/AuthScreens.tsx` | Email placeholder, términos |
| `src/components/ProductDetailScreen.tsx` | Referencia "Candyverse" |
| `src/lib/api.ts` | localStorage key |
| `src/server/index.ts` | Log |
| `scripts/create-admin.ts` | Defaults |
| `metadata.json` | Name/description |
| `index.html` | Title |
| `src/data.ts` | PILLARS, STORE_INFO, TEAM |
