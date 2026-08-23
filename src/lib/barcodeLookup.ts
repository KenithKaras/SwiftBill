import { logger } from './logger';

export interface BarcodeLookupResult {
  name: string;
  brand?: string;
  source: 'openfoodfacts';
}

/**
 * Best-effort product-name lookup for an unknown barcode using the free,
 * key-less Open Food Facts database (CORS-enabled). This only PREFILLS the
 * "add product" form — the user always sets their own price. It never throws:
 * if the network is blocked, offline, or the code is unknown, it resolves to
 * null and the caller just shows a blank form.
 *
 * Note: Open Food Facts is a grocery/consumer-goods database, so this helps
 * for retail items and is simply empty for custom services — which is fine.
 */
export async function lookupBarcodeName(barcode: string): Promise<BarcodeLookupResult | null> {
  const code = (barcode || '').trim();
  if (!code || !/^\d{6,14}$/.test(code)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,quantity`,
      { signal: controller.signal, headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return null;

    const json = await res.json();
    if (!json || json.status !== 1 || !json.product) return null;

    const p = json.product;
    const productName: string = (p.product_name || '').trim();
    const brand: string = (p.brands || '').split(',')[0].trim();
    const quantity: string = (p.quantity || '').trim();

    if (!productName && !brand) return null;

    const name = [brand, productName, quantity].filter(Boolean).join(' ').trim();
    return { name: name.substring(0, 200), brand: brand || undefined, source: 'openfoodfacts' };
  } catch (err: any) {
    // Aborts, network errors, CORS, offline — all non-fatal.
    if (err?.name !== 'AbortError') {
      logger.warn('Barcode name lookup failed (non-fatal)', err);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
