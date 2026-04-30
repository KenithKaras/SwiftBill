import React from 'react';
import { InvoiceData } from '../services/invoiceService';
import { formatCurrency, generateInvoiceNo } from '../lib/utils';

interface InvoiceLayoutProps {
  data: Partial<InvoiceData>;
  businessData: any;
  invoiceCount?: number;
}

export const InvoiceLayout: React.FC<InvoiceLayoutProps> = ({ data, businessData, invoiceCount = 0 }) => {
  const { 
    invoiceNo, 
    clientName, 
    clientEmail, 
    clientPhone, 
    date, 
    dueDate,
    items = [], 
    gstEnabled, 
    gstPercentage = 18, 
    totalAmount, 
    notes, 
    templateType = 'modern' 
  } = data;

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const gst = gstEnabled ? subtotal * (gstPercentage / 100) : 0;
  const total = totalAmount || (subtotal + gst);

  const primaryColor = businessData?.primaryColor || '#2563eb';
  const customAccent = businessData?.accentColor || '#0f172a';
  const letterheadImage = businessData?.letterheadImage;
  const fontFamily = businessData?.fontFamily || 'Inter';
  const headerHeight = businessData?.headerHeight || 100;
  const logoPosition = businessData?.logoPosition || 'left';
  const fontSize = businessData?.fontSize || 14;

  if (templateType === 'custom') {
    return (
      <div 
        className="bg-white min-h-[800px] flex flex-col font-sans text-slate-800" 
        style={{ 
          borderTop: letterheadImage ? 'none' : `10px solid ${primaryColor}`,
          fontFamily: fontFamily,
          fontSize: `${fontSize}px`
        }}
      >
        {letterheadImage ? (
          <div className="w-full" style={{ height: `${headerHeight}px` }}>
            <img 
              src={letterheadImage} 
              alt="Letterhead" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div 
            className="px-12 pb-0 flex flex-col justify-center mb-16" 
            style={{ 
              height: `${headerHeight}px`,
              alignItems: logoPosition === 'center' ? 'center' : logoPosition === 'right' ? 'flex-end' : 'flex-start',
              textAlign: logoPosition
            }}
          >
            <div>
              <h1 className="text-4xl font-black mb-2" style={{ color: primaryColor }}>INVOICE</h1>
              <p className="font-bold text-lg">{businessData?.businessName || 'MY BUSINESS'}</p>
              <p className="text-slate-500 max-w-xs">{businessData?.address}</p>
              {businessData?.gstNumber && <p className="text-slate-400 mt-1 text-xs">GST: {businessData.gstNumber}</p>}
            </div>
          </div>
        )}

        <div className={`px-12 flex flex-col flex-1 ${letterheadImage ? 'pt-8' : ''}`}>
          <div className={`mb-12 flex justify-between items-end ${logoPosition === 'right' ? 'flex-row-reverse' : ''}`}>
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2 border-b border-slate-100 pb-1">Billed To</h4>
              <p className="text-lg font-bold">{clientName || 'Client Name'}</p>
              <p className="text-slate-500">{clientEmail || 'No Email'}</p>
              <p className="text-slate-500">{clientPhone}</p>
            </div>
            
            {!letterheadImage && (
              <div className="text-right">
                <div className="p-4 rounded-2xl inline-block" style={{ backgroundColor: `${primaryColor}10` }}>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Invoice</p>
                  <p className="text-xl font-black" style={{ color: primaryColor }}>#{invoiceNo || generateInvoiceNo(invoiceCount)}</p>
                </div>
                <div className="mt-2 text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Issued: {date}</p>
                  <p className="text-[10px] uppercase font-black text-rose-500">Due By: {dueDate}</p>
                </div>
              </div>
            )}
            
            {letterheadImage && (
               <div className="text-right">
                  <p className="text-xl font-black" style={{ color: primaryColor }}>#{invoiceNo || generateInvoiceNo(invoiceCount)}</p>
                  <p className="text-sm font-bold text-slate-400">{date}</p>
               </div>
            )}
          </div>

        <table className="w-full mb-12">
          <thead>
            <tr className="border-b-2 border-slate-100 text-left">
              <th className="py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest">Description</th>
              <th className="py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-center">Qty</th>
              <th className="py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-right">Price</th>
              <th className="py-4 font-bold text-slate-400 uppercase text-[10px] tracking-widest text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="py-6 font-semibold">{item.name || 'Untitled Item'}</td>
                <td className="py-6 text-center">{item.quantity}</td>
                <td className="py-6 text-right">{formatCurrency(item.price)}</td>
                <td className="py-6 text-right font-bold" style={{ color: customAccent }}>{formatCurrency(item.quantity * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto w-72 space-y-4">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          {gstEnabled && (
            <div className="flex justify-between text-slate-500">
              <span>GST ({gstPercentage}%)</span>
              <span className="font-semibold">{formatCurrency(gst)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-black pt-4 border-t-2 border-slate-100" style={{ color: primaryColor }}>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="mt-auto pt-16">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <h5 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">Notes & Terms</h5>
            <p className="text-xs text-slate-500 leading-relaxed">{notes || 'Thank you for your business. Payment is expected within the due date.'}</p>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Fallback to original templates (slightly refactored for clarity)
  return (
    <div 
      className={`bg-white min-h-[800px] flex flex-col text-[12px] ${
        templateType === 'minimal' ? 'p-16' : 
        templateType === 'classic' ? 'p-12 border-t-8 border-t-slate-800' : 
        'p-10'
      }`}
    >
      <div className={`flex justify-between items-start mb-12 ${templateType === 'classic' ? 'flex-row-reverse' : ''}`}>
         <div className={templateType === 'minimal' ? 'text-center w-full' : ''}>
            <h2 className={`font-black uppercase tracking-tighter mb-2 ${
               templateType === 'minimal' ? 'text-3xl' : 'text-2xl italic'
            }`}>
               {businessData?.businessName || 'MY BUSINESS'}
            </h2>
            <p className="text-slate-500 max-w-[200px]">{businessData?.address || 'Your Business Address'}</p>
            {businessData?.gstNumber && <p className="text-slate-400 mt-1 font-mono uppercase bg-slate-50 inline-block px-1">GST: {businessData.gstNumber}</p>}
         </div>
         {templateType !== 'minimal' && (
            <div className="text-right">
               <h1 className="text-4xl font-light text-slate-200 uppercase tracking-[0.2em] mb-4">Invoice</h1>
               <p className="font-bold text-slate-900">{invoiceNo || generateInvoiceNo(invoiceCount)}</p>
               <p className="text-slate-400">Date: {date}</p>
               {dueDate && <p className="text-slate-400 font-bold text-rose-400">Due: {dueDate}</p>}
            </div>
         )}
      </div>

      <div className={`mb-12 grid grid-cols-2 gap-8 ${templateType === 'minimal' ? 'mt-8' : ''}`}>
         <div>
            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1 w-fit">Bill To</h4>
            <p className="text-sm font-bold text-slate-900">{clientName || 'Client Name'}</p>
            <p className="text-slate-500">{clientEmail}</p>
            <p className="text-slate-500">{clientPhone}</p>
         </div>
         {templateType === 'minimal' && (
            <div className="text-right">
               <p className="font-bold text-slate-900">{invoiceNo || generateInvoiceNo(invoiceCount)}</p>
               <p className="text-slate-400 italic">Created on {date}</p>
               {dueDate && <p className="text-rose-500 font-black">Due on {dueDate}</p>}
            </div>
         )}
      </div>

      <table className={`w-full mb-12 ${templateType === 'classic' ? 'border border-slate-100' : ''}`}>
         <thead>
            <tr className={`uppercase tracking-widest text-[9px] ${
               templateType === 'classic' ? 'bg-slate-800 text-white' : 'border-b border-slate-900 border-opacity-10 text-slate-400'
            }`}>
               <th className={`text-left font-semibold py-3 ${templateType === 'classic' ? 'px-3' : ''}`}>Description</th>
               <th className="text-center font-semibold py-3 w-20">Qty</th>
               <th className="text-right font-semibold py-3 w-32">Price</th>
               <th className={`text-right font-semibold py-3 w-32 ${templateType === 'classic' ? 'px-3' : ''}`}>Total</th>
            </tr>
         </thead>
         <tbody className="divide-y divide-slate-50">
            {items.map((item, i) => (
              <tr key={i} className="text-slate-700">
                 <td className={`py-4 font-medium ${templateType === 'classic' ? 'px-3' : ''}`}>{item.name || 'Untitled Item'}</td>
                 <td className="py-4 text-center">{item.quantity}</td>
                 <td className="py-4 text-right">{formatCurrency(item.price)}</td>
                 <td className={`py-4 text-right font-bold ${templateType === 'classic' ? 'px-3' : ''}`}>{formatCurrency(item.quantity * item.price)}</td>
              </tr>
            ))}
         </tbody>
      </table>

      <div className="ml-auto w-64 space-y-3 pt-6 border-t border-slate-900 border-opacity-10">
         <div className="flex justify-between text-slate-500 px-1">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
         </div>
         {gstEnabled && (
          <div className="flex justify-between text-slate-500 px-1">
            <span>GST ({gstPercentage}%)</span>
            <span>{formatCurrency(gst)}</span>
          </div>
         )}
         <div className={`flex justify-between text-lg font-bold pt-3 border-t ${
            templateType === 'classic' ? 'bg-slate-800 text-white px-3 py-2 rounded-lg mt-2' : 'text-slate-950 border-slate-50'
         }`}>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
         </div>
      </div>

      <div className="mt-auto pt-10 text-slate-400 text-[10px] italic">
         <p className="mb-2 font-bold text-slate-500 not-italic uppercase tracking-widest">Notes</p>
         <p>{notes || 'This invoice was generated electronically. No signature required.'}</p>
      </div>
    </div>
  );
};
