import React from 'react';
import { InvoiceData, BusinessDetails, ThemeCustomization } from '../../../types/invoice';

interface InvoiceHeaderProps {
  data: InvoiceData;
  primaryColor?: string;
}

export const InvoiceHeader: React.FC<InvoiceHeaderProps> = ({ data, primaryColor = '#1e3a2f' }) => {
  const business: Partial<BusinessDetails> = data.businessDetails || {};
  const customization: ThemeCustomization = data.customization || {};
  
  const logoPosition = customization.logoPosition || 'left';
  const headerHeight = customization.headerHeight || 100;
  const letterheadImage = business.letterheadImage;
  const logoHeight = customization.logoHeight || 60;

  const fontStyle = customization.fontFamily?.includes('Playfair') 
    ? '"Playfair Display", Georgia, serif'
    : customization.fontFamily?.includes('JetBrains')
    ? '"JetBrains Mono", monospace'
    : '"Public Sans", sans-serif';

  if (letterheadImage) {
    return (
      <div 
        className="w-full mb-8 flex justify-center pdf-page-break" 
        style={{ height: `${headerHeight}px`, fontFamily: fontStyle }}
      >
        <img 
          src={letterheadImage} 
          alt="Letterhead" 
          className="w-full h-full object-contain" 
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
      </div>
    );
  }

  const alignmentClass = logoPosition === 'center' 
    ? 'items-center text-center' 
    : logoPosition === 'right' 
    ? 'items-end text-right' 
    : 'items-start text-left';

  return (
    <div 
      className="w-full flex flex-row justify-between items-start gap-6 mb-8 border-b pb-6 border-slate-100 pdf-page-break"
      style={{ fontFamily: fontStyle }}
    >
      <div className={`flex flex-col ${alignmentClass} max-w-[60%]`}>
        {business.businessLogo ? (
          <div className="mb-4" style={{ height: `${logoHeight}px` }}>
            <img 
              src={business.businessLogo} 
              alt={business.businessName || 'Business Logo'} 
              className="h-full object-contain max-w-50"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          </div>
        ) : null}
        
        <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">
          {business.businessName || 'MY BUSINESS'}
        </h2>
        <p className="text-slate-400 text-[11px] mt-2 whitespace-pre-wrap leading-relaxed">
          {business.address || 'Your Business Address'}
        </p>
        {business.gstNumber && (
          <p className="text-slate-500 mt-2 font-mono text-[9px] uppercase bg-slate-50 border border-slate-200/60 inline-block px-2 py-0.5 rounded">
            GST: {business.gstNumber}
          </p>
        )}
      </div>

      <div className="text-right flex flex-col items-end justify-start self-stretch">
        <h1 
          className="text-4xl font-black uppercase tracking-widest leading-none mb-3"
          style={{ color: primaryColor }}
        >
          INVOICE
        </h1>
        <div className="font-mono text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-sm inline-block">
          #{data.invoiceNo}
        </div>
      </div>
    </div>
  );
};
