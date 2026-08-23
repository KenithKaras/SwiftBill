/**
 * Precision Financial Calculations Library
 * Operates in integer cents to ensure exact rounding and eliminate floating point inaccuracies.
 */

export interface InvoiceCalculations {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  total: number;
}

export interface CalculationInputs {
  items: Array<{ quantity: number | string; price: number | string }>;
  gstEnabled: boolean;
  gstPercentage: number;
  discountPercentage?: number;
  discountAmount?: number;
}

/**
 * Calculates all invoice monetary values using safe integer-based cents math.
 */
export function calculateInvoiceTotals(inputs: CalculationInputs): InvoiceCalculations {
  const {
    items = [],
    gstEnabled,
    gstPercentage = 18,
    discountPercentage = 0,
    discountAmount = 0,
  } = inputs;

  // 1. Calculate subtotal in cents
  const subtotalCents = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const priceCents = Math.round(Number(item.price || 0) * 100);
    return sum + Math.round(qty * priceCents);
  }, 0);

  // 2. Calculate discount in cents
  let discountCents = 0;
  if (discountPercentage > 0) {
    discountCents = Math.round(subtotalCents * (discountPercentage / 100));
  } else if (discountAmount > 0) {
    discountCents = Math.round(discountAmount * 100);
  }

  // Ensure discount doesn't exceed subtotal
  discountCents = Math.min(subtotalCents, discountCents);

  // 3. Calculate taxable amount
  const taxableCents = subtotalCents - discountCents;

  // 4. Calculate GST in cents
  const gstCents = gstEnabled ? Math.round(taxableCents * (gstPercentage / 100)) : 0;

  // 5. Calculate grand total
  const totalCents = taxableCents + gstCents;

  return {
    subtotal: subtotalCents / 100,
    discountAmount: discountCents / 100,
    taxableAmount: taxableCents / 100,
    gstAmount: gstCents / 100,
    total: totalCents / 100,
  };
}

/**
 * Format currency Helper
 */
export function formatCurrencyValue(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}
