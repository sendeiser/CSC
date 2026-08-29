import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export interface CatalogProduct {
  id: string;
  name: string;
  price?: number;
  base_price?: number;
  price_per_kg?: number;
  unit_type?: string;
  is_bulk?: boolean;
  min_weight?: number;
  image_url?: string;
  images?: string[];
  stock?: number;
}

/**
 * Calcula y formatea el precio de 50g para productos al peso y el precio unitario
 */
export function getProductPricingInfo(p: CatalogProduct): {
  isWeight: boolean;
  price50g: number;
  pricePerKg: number;
  unitPrice: number;
  displayPriceShort: string;
  displayPriceFull: string;
} {
  const isWeight = p.unit_type === 'weight' || p.is_bulk || false;
  const pricePerKg = Number(p.price_per_kg || p.base_price || p.price || 10000);
  const price50g = Math.round((pricePerKg / 1000) * 50);
  const unitPrice = Number(p.base_price || p.price || 0);

  if (isWeight) {
    return {
      isWeight: true,
      price50g,
      pricePerKg,
      unitPrice,
      displayPriceShort: `\$${price50g.toLocaleString('es-AR')} x 50g`,
      displayPriceFull: `\$${price50g.toLocaleString('es-AR')} x 50g (\$${pricePerKg.toLocaleString('es-AR')}/kg)`
    };
  } else {
    return {
      isWeight: false,
      price50g: 0,
      pricePerKg: 0,
      unitPrice,
      displayPriceShort: `\$${unitPrice.toLocaleString('es-AR')} u.`,
      displayPriceFull: `\$${unitPrice.toLocaleString('es-AR')} por unidad`
    };
  }
}

/**
 * Limpia y escapa texto para SVG
 */
function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Cache en memoria para imágenes y collages generados
const imageMemoryCache = new Map<string, Buffer>();
let lastCollageCache: { hashKey: string; buffer: Buffer; timestamp: number } | null = null;

/**
 * Obtiene el buffer de imagen de un producto (descarga de URL o lee local o crea fallback) con cache en memoria
 */
async function getProductImageBuffer(p: CatalogProduct, width: number, height: number): Promise<Buffer> {
  const imageUrl = p.image_url || (Array.isArray(p.images) && p.images[0] ? p.images[0] : '');

  if (imageUrl) {
    if (imageMemoryCache.has(imageUrl)) {
      return imageMemoryCache.get(imageUrl)!;
    }

    try {
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(imageUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const resized = await sharp(buffer)
            .resize(width, height, { fit: 'cover', position: 'center' })
            .toBuffer();
          imageMemoryCache.set(imageUrl, resized);
          return resized;
        }
      } else {
        // Archivo local
        const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
        const possiblePaths = [
          path.join(process.cwd(), cleanPath),
          path.join(process.cwd(), 'uploads', path.basename(cleanPath)),
          path.join(process.cwd(), 'public', cleanPath)
        ];

        for (const localPath of possiblePaths) {
          if (fs.existsSync(localPath)) {
            const resized = await sharp(localPath)
              .resize(width, height, { fit: 'cover', position: 'center' })
              .toBuffer();
            imageMemoryCache.set(imageUrl, resized);
            return resized;
          }
        }
      }
    } catch (err) {
      console.warn(`[CatalogCollage]: Error cargando imagen para "${p.name}":`, err);
    }
  }

  // Fallback visual con gradiente y emoji de golosina
  const svgPlaceholder = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4c1d95" />
          <stop offset="50%" stop-color="#7c3aed" />
          <stop offset="100%" stop-color="#db2777" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#tileGrad)" rx="16" />
      <circle cx="${width / 2}" cy="${height / 2 - 20}" r="65" fill="#ffffff" fill-opacity="0.15" />
      <text x="${width / 2}" y="${height / 2 - 5}" font-family="Arial, Helvetica, sans-serif" font-size="64" text-anchor="middle" dominant-baseline="middle">🍬</text>
      <text x="${width / 2}" y="${height / 2 + 55}" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="#ffffff" text-anchor="middle">CSC Candy</text>
    </svg>
  `;

  return await sharp(Buffer.from(svgPlaceholder)).png().toBuffer();
}

/**
 * Genera el collage de catálogo numerado con fotos, números 1..N y precios x 50g
 */
export async function generateCatalogCollage(
  products: CatalogProduct[],
  options?: { startIndex?: number; pageNumber?: number; totalPages?: number }
): Promise<Buffer> {
  const startIndex = options?.startIndex || 0;
  const pageNumber = options?.pageNumber || 1;
  const totalPages = options?.totalPages || 1;

  const prods = products.slice(0, 9);
  if (prods.length === 0) {
    const emptySvg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="#0f172a" />
        <text x="400" y="300" fill="#ffffff" font-size="24" font-family="Arial" text-anchor="middle">🍬 Chamical Candy Shop 🍭</text>
      </svg>
    `;
    return await sharp(Buffer.from(emptySvg)).jpeg().toBuffer();
  }

  // Verificar cache de collage
  const hashKey = `${startIndex}_${pageNumber}_${prods.map(p => `${p.id}_${p.price_per_kg || p.base_price || 0}_${p.image_url || ''}`).join('|')}`;
  if (lastCollageCache && lastCollageCache.hashKey === hashKey && Date.now() - lastCollageCache.timestamp < 10 * 60 * 1000) {
    return lastCollageCache.buffer;
  }

  // Dimensiones del collage
  const cols = prods.length <= 4 ? 2 : 3;
  const rows = Math.ceil(prods.length / cols);
  
  const tileWidth = 360;
  const tileHeight = 360;
  const tilePadding = 16;
  const headerHeight = 110;
  const footerHeight = 60;

  const totalWidth = cols * tileWidth + (cols + 1) * tilePadding;
  const totalHeight = headerHeight + rows * tileHeight + (rows + 1) * tilePadding + footerHeight;

  const pageSubtitle = totalPages > 1 
    ? `CATÁLOGO DE GOLOSINAS &amp; GOMITAS (Página ${pageNumber} de ${totalPages})`
    : `CATÁLOGO DE GOLOSINAS &amp; GOMITAS EN STOCK`;

  // 1. Canvas Base
  const bgSvg = `
    <svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="40%" stop-color="#1e1138" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ec4899" />
          <stop offset="50%" stop-color="#8b5cf6" />
          <stop offset="100%" stop-color="#06b6d4" />
        </linearGradient>
      </defs>
      
      <rect width="${totalWidth}" height="${totalHeight}" fill="url(#bgGrad)" />
      <rect x="0" y="0" width="${totalWidth}" height="8" fill="url(#headerGrad)" />
      
      <text x="${totalWidth / 2}" y="46" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="1">
        🍬 CHAMICAL CANDY SHOP 🍭
      </text>
      <text x="${totalWidth / 2}" y="76" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="bold" fill="#38bdf8" text-anchor="middle">
        ${pageSubtitle}
      </text>
      <text x="${totalWidth / 2}" y="98" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="#fbcfe8" text-anchor="middle">
        👉 Respondé por WhatsApp con el NÚMERO (${startIndex + 1}, ${startIndex + 2}...) para pedir
      </text>

      <text x="${totalWidth / 2}" y="${totalHeight - 24}" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="#94a3b8" text-anchor="middle">
        ✨ Envíos a domicilio en Chamical y Retiro por el local • Venta x50g, 100g, 250g y por unidad
      </text>
    </svg>
  `;

  // 2. Procesar Tiles en Paralelo
  const badgeColors = ['#ec4899', '#8b5cf6', '#059669', '#3b82f6', '#d97706', '#06b6d4', '#e11d48', '#10b981'];

  const tilePromises = prods.map(async (p, i) => {
    const itemNumber = startIndex + i + 1;
    const colIndex = i % cols;
    const rowIndex = Math.floor(i / cols);

    const left = tilePadding + colIndex * (tileWidth + tilePadding);
    const top = headerHeight + tilePadding + rowIndex * (tileHeight + tilePadding);

    const pricing = getProductPricingInfo(p);
    const rawTileBuffer = await getProductImageBuffer(p, tileWidth, tileHeight);
    const badgeColor = badgeColors[(startIndex + i) % badgeColors.length];

    const overlaySvg = `
      <svg width="${tileWidth}" height="${tileHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.6"/>
          </filter>
          <linearGradient id="bottomBannerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0f172a" stop-opacity="0" />
            <stop offset="30%" stop-color="#0f172a" stop-opacity="0.85" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.98" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="${tileWidth}" height="${tileHeight}" rx="18" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.2" />

        <!-- BADGE DEL NÚMERO -->
        <g filter="url(#dropShadow)">
          <circle cx="44" cy="44" r="28" fill="${badgeColor}" stroke="#ffffff" stroke-width="3" />
          <text x="44" y="45" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="central">
            ${itemNumber}
          </text>
        </g>

        <!-- BANNER INFERIOR CON NOMBRE Y PRECIO x50g -->
        <rect x="0" y="${tileHeight - 96}" width="${tileWidth}" height="96" rx="0" fill="url(#bottomBannerGrad)" />

        <text x="${tileWidth / 2}" y="${tileHeight - 64}" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="900" fill="#ffffff" text-anchor="middle" filter="url(#dropShadow)">
          ${escapeXml(p.name.length > 26 ? p.name.slice(0, 24) + '…' : p.name)}
        </text>

        <g filter="url(#dropShadow)">
          <rect x="24" y="${tileHeight - 48}" width="${tileWidth - 48}" height="34" rx="10" fill="#0f172a" stroke="${badgeColor}" stroke-width="1.5" />
          <text x="${tileWidth / 2}" y="${tileHeight - 26}" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="900" fill="#fbbf24" text-anchor="middle">
            ${escapeXml(pricing.displayPriceFull)}
          </text>
        </g>
      </svg>
    `;

    const tileWithOverlay = await sharp(rawTileBuffer)
      .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
      .png()
      .toBuffer();

    return {
      input: tileWithOverlay,
      top,
      left
    } as sharp.OverlayOptions;
  });

  const composites = await Promise.all(tilePromises);

  // 3. Crear Imagen Final Compuesta
  const finalCollageBuffer = await sharp(Buffer.from(bgSvg))
    .composite(composites)
    .jpeg({ quality: 90 })
    .toBuffer();

  lastCollageCache = {
    hashKey,
    buffer: finalCollageBuffer,
    timestamp: Date.now()
  };

  return finalCollageBuffer;
}

