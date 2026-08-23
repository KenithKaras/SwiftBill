import React from 'react';
import { InvoiceData } from '../../../types/invoice';

interface FooterProps {
  data: InvoiceData;
}

export const Footer: React.FC<FooterProps> = ({ data }) => {
  const notesText = data.notes;

  return (
    <div className="mt-auto pt-10 text-left text-slate-400 text-[10px] italic leading-relaxed border-t border-slate-100/50 pdf-page-break">
      <span className="mb-1.5 font-bold text-slate-500 not-italic uppercase tracking-widest text-[9px] block">
        Notes & Terms
      </span>
      <p className="whitespace-pre-wrap">
        {notesText || 'This invoice was generated electronically. No physical signature is required. Thank you for your business!'}
      </p>
    </div>
  );
};
