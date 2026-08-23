import React from 'react';
import { InvoiceData } from '../../../types/invoice';

interface CustomerInfoProps {
  data: InvoiceData;
  accentColor?: string;
}

export const CustomerInfo: React.FC<CustomerInfoProps> = ({ data, accentColor = '#3b82f6' }) => {
  const customization = data.customization || {};
  const spacingClass = customization.spacing === 'compact' 
    ? 'mb-6' 
    : customization.spacing === 'spacious' 
    ? 'mb-12' 
    : 'mb-8';

  return (
    <div className={`w-full grid grid-cols-2 gap-12 text-left pdf-page-break ${spacingClass}`}>
      {/* Client Billing Info */}
      <div>
        <h4 
          className="text-[10px] font-black uppercase tracking-wider mb-3 pb-1 border-b"
          style={{ borderColor: `${accentColor}30`, color: accentColor }}
        >
          Bill To
        </h4>
        <p className="text-sm font-black text-slate-900 leading-none">
          {data.clientName || 'Client Name'}
        </p>
        {data.clientAddress && (
          <p className="text-slate-500 text-xs mt-2 whitespace-pre-wrap leading-relaxed">
            {data.clientAddress}
          </p>
        )}
        <div className="mt-3 space-y-1">
          {data.clientEmail && (
            <p className="text-slate-400 text-[11px] font-medium">
              Email: <span className="text-slate-600 font-bold">{data.clientEmail}</span>
            </p>
          )}
          {data.clientPhone && (
            <p className="text-slate-400 text-[11px] font-medium">
              Phone: <span className="text-slate-600 font-bold">{data.clientPhone}</span>
            </p>
          )}
        </div>
      </div>

      {/* Invoice Details Column */}
      <div>
        <h4 
          className="text-[10px] font-black uppercase tracking-wider mb-3 pb-1 border-b border-slate-100 text-slate-400"
        >
          Invoice Details
        </h4>
        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-semibold">Date Issued:</span>
            <span className="font-bold text-slate-800">{data.date}</span>
          </div>
          {data.dueDate && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Date Due:</span>
              <span className="font-extrabold text-rose-500">{data.dueDate}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-semibold">Currency:</span>
            <span className="font-bold text-slate-800 uppercase">{data.currency}</span>
          </div>
          {data.status && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-semibold">Status:</span>
              <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                data.status === 'paid'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                  : 'bg-amber-50 text-amber-600 border-amber-100/50'
              }`}>
                {data.status}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
