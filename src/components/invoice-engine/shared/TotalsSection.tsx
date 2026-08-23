import React from 'react';
import { InvoiceData } from '../../../types/invoice';
import { calculateInvoiceTotals, formatCurrencyValue } from '../../../lib/financial';

interface TotalsSectionProps {
  data: InvoiceData;
  primaryColor?: string;
  themeType?: string;
}

export const TotalsSection: React.FC<TotalsSectionProps> = ({ 
  data, 
  primaryColor = '#1e3a2f',
  themeType = 'modern'
}) => {
  const currency = data.currency || 'USD';
  
  // Calculate exact totals using our integer math library
  const {
    subtotal,
    discountAmount,
    taxableAmount,
    gstAmount,
    total
  } = calculateInvoiceTotals({
    items: data.items,
    gstEnabled: data.gstEnabled,
    gstPercentage: data.gstPercentage,
    discountPercentage: data.discountPercentage,
    discountAmount: data.discountAmount
  });

  const format = (val: number) => formatCurrencyValue(val, currency);

  // Styling based on theme type
  const totalBoxStyle = themeType === 'classic'
    ? 'bg-slate-900 text-white px-4 py-3 rounded-xl'
    : themeType === 'dark'
    ? 'bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700'
    : themeType === 'minimal'
    ? 'border-t-2 border-slate-950 text-slate-950 font-black py-2.5'
    : 'bg-slate-50 text-slate-900 px-4 py-3 rounded-xl border border-slate-200/50';

  const totalTextThemeStyle = themeType === 'minimal' || themeType === 'classic' || themeType === 'dark'
    ? {}
    : { color: primaryColor };

  return (
    <div className="ml-auto w-72 space-y-3.5 pt-4 text-xs pdf-page-break">
      <div className="flex justify-between text-slate-500 font-semibold px-1">
        <span>Subtotal</span>
        <span className="font-bold text-slate-800">{format(subtotal)}</span>
      </div>

      {discountAmount > 0 && (
        <div className="flex justify-between text-rose-500 font-bold px-1 animate-pulse">
          <span>
            Discount 
            {data.discountPercentage ? ` (${data.discountPercentage}%)` : ''}
          </span>
          <span>-{format(discountAmount)}</span>
        </div>
      )}

      {data.gstEnabled && (
        <div className="flex justify-between text-slate-500 font-semibold px-1">
          <span>GST ({data.gstPercentage}%)</span>
          <span className="font-bold text-slate-800">{format(gstAmount)}</span>
        </div>
      )}

      <div 
        className={`flex justify-between items-center text-xs font-black shadow-sm ${totalBoxStyle}`}
      >
        <span className="uppercase tracking-wider">Total Due</span>
        <span className="text-base font-black" style={totalTextThemeStyle}>{format(total)}</span>
      </div>
    </div>
  );
};
