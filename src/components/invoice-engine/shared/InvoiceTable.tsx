import React from 'react';
import { InvoiceData } from '../../../types/invoice';
import { formatCurrencyValue } from '../../../lib/financial';

interface InvoiceTableProps {
  data: InvoiceData;
  primaryColor?: string;
  themeType?: string;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ 
  data, 
  primaryColor = '#1e3a2f',
  themeType = 'modern'
}) => {
  const items = data.items || [];
  const currency = data.currency || 'USD';
  const customization = data.customization || {};
  const tableStyle = customization.tableStyle || 'default';
  
  // Format prices helper
  const format = (amount: number) => formatCurrencyValue(amount, currency);

  // Spacing helper
  const cellPadding = customization.spacing === 'compact' 
    ? 'py-2 px-3' 
    : customization.spacing === 'spacious' 
    ? 'py-4.5 px-4' 
    : 'py-3.5 px-4';

  // Table styling classes
  const isStriped = tableStyle === 'striped';
  const isGrid = tableStyle === 'grid';
  const isMinimal = tableStyle === 'minimal';

  const headerBgStyle = themeType === 'classic'
    ? { backgroundColor: '#0f172a', color: '#ffffff' }
    : themeType === 'dark'
    ? { backgroundColor: '#1e293b', color: '#f8fafc' }
    : themeType === 'minimal'
    ? { backgroundColor: 'transparent', color: '#0f172a', borderBottom: '2px solid #0f172a' }
    : { backgroundColor: `${primaryColor}12`, color: primaryColor };

  const tableBorderClass = isGrid 
    ? 'border border-slate-200 divide-y divide-slate-200' 
    : 'divide-y divide-slate-100';

  const outerContainerClass = isMinimal
    ? 'w-full mb-8 pdf-page-break'
    : 'w-full mb-8 overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm pdf-page-break';

  return (
    <div className={outerContainerClass}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr 
            className="uppercase tracking-wider text-[10px] font-black border-b border-slate-200/50"
            style={headerBgStyle}
          >
            <th className={`${cellPadding} font-extrabold`}>Description</th>
            <th className={`${cellPadding} font-extrabold text-center w-20`}>Qty</th>
            <th className={`${cellPadding} font-extrabold text-right w-28`}>Price</th>
            <th className={`${cellPadding} font-extrabold text-right w-28`}>Total</th>
          </tr>
        </thead>
        <tbody className={`text-slate-700 text-xs ${tableBorderClass}`}>
          {items.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-8 text-center text-slate-400 font-bold italic">
                No items added yet
              </td>
            </tr>
          ) : (
            items.map((item, idx) => {
              const qty = Number(item.quantity) || 0;
              const price = Number(item.price) || 0;
              const itemTotal = qty * price;

              const rowBg = isStriped && idx % 2 === 1 
                ? 'bg-slate-50/60' 
                : 'bg-white hover:bg-slate-50/40';

              const cellBorder = isGrid ? 'border-r border-slate-200 last:border-r-0' : '';

              return (
                <tr key={idx} className={`${rowBg} transition-colors border-b border-slate-100 last:border-b-0`}>
                  <td className={`${cellPadding} ${cellBorder} font-bold text-slate-900 leading-normal max-w-sm wrap-break-word`}>
                    {item.name || 'Untitled Item'}
                  </td>
                  <td className={`${cellPadding} ${cellBorder} text-center font-semibold text-slate-700`}>
                    {item.quantity}
                  </td>
                  <td className={`${cellPadding} ${cellBorder} text-right font-medium text-slate-600`}>
                    {format(price)}
                  </td>
                  <td className={`${cellPadding} ${cellBorder} text-right font-black text-slate-900`}>
                    {format(itemTotal)}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
