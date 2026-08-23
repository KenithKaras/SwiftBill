import React from 'react';
import { InvoiceData } from '../../../types/invoice';

interface QRCodeSectionProps {
  data: InvoiceData;
  size?: number;
}

export const QRCodeSection: React.FC<QRCodeSectionProps> = ({ data, size = 80 }) => {
  const qrCodeText = data.qrCode;
  const customization = data.customization || {};
  
  if (!customization.showQrCode || !qrCodeText) {
    return null;
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeText)}`;

  return (
    <div className="flex flex-col items-start gap-1.5 pdf-page-break text-left">
      <span className="text-[9px] uppercase tracking-widest font-black text-slate-400">Payment QR Code</span>
      <div 
        className="p-1.5 border border-slate-200/80 rounded-xl bg-white flex items-center justify-center shadow-sm select-none"
        style={{ width: `${size + 12}px`, height: `${size + 12}px` }}
      >
        <img 
          src={qrImageUrl} 
          alt="Payment QR Reference" 
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
      </div>
      <span className="text-[8px] text-slate-400 font-semibold tracking-tight max-w-30 truncate" title={qrCodeText}>
        Scan to pay / verify
      </span>
    </div>
  );
};
