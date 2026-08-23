import React from 'react';
import { InvoiceData } from '../../../types/invoice';

interface SignatureSectionProps {
  data: InvoiceData;
  height?: number;
}

export const SignatureSection: React.FC<SignatureSectionProps> = ({ data, height = 40 }) => {
  const signatureText = data.signature;
  const customization = data.customization || {};

  if (!customization.showSignature || !signatureText) {
    return null;
  }

  const isUrl = signatureText.startsWith('http://') || signatureText.startsWith('https://');

  return (
    <div className="flex flex-col items-end gap-1.5 pdf-page-break text-right ml-auto">
      <span className="text-[9px] uppercase tracking-widest font-black text-slate-400">Authorized Signature</span>
      
      <div 
        className="flex items-center justify-end border-b border-dashed border-slate-300 pb-1.5 min-w-30 select-none"
        style={{ height: `${height}px` }}
      >
        {isUrl ? (
          <img 
            src={signatureText} 
            alt="Authorized Signature" 
            className="h-full object-contain max-w-37.5"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
          />
        ) : (
          <span 
            className="text-lg font-serif italic font-medium text-slate-700 tracking-wide select-none"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {signatureText}
          </span>
        )}
      </div>
      
      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
        Representative Signature
      </span>
    </div>
  );
};
