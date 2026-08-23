import React from 'react';
import { InvoiceData } from '../../../types/invoice';
import { InvoiceHeader } from '../shared/InvoiceHeader';
import { CustomerInfo } from '../shared/CustomerInfo';
import { InvoiceTable } from '../shared/InvoiceTable';
import { TotalsSection } from '../shared/TotalsSection';
import { QRCodeSection } from '../shared/QRCodeSection';
import { SignatureSection } from '../shared/SignatureSection';
import { Footer } from '../shared/Footer';

interface ThemeProps {
  data: InvoiceData;
}

const DarkTheme: React.FC<ThemeProps> = ({ data }) => {
  const customization = data.customization || {};
  const primaryColor = customization.primaryColor || '#3b82f6';
  const fontSize = customization.fontSize || 13;

  const fontStyle = customization.fontFamily?.includes('Playfair') 
    ? '"Playfair Display", Georgia, serif'
    : customization.fontFamily?.includes('JetBrains')
    ? '"JetBrains Mono", monospace'
    : '"JetBrains Mono", monospace'; // default to monospace for tech aesthetic

  return (
    <div 
      className="bg-slate-950 text-slate-100 p-12 min-h-280.75 flex flex-col relative w-full overflow-hidden select-none border border-slate-800 dark-theme-wrapper"
      style={{ 
        fontFamily: fontStyle, 
        fontSize: `${fontSize}px`
      }}
    >
      {/* Decorative dark-mode element */}
      <div 
        className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[120px] opacity-10 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      ></div>

      <style>{`
        @media print {
          .dark-theme-wrapper {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border: none !important;
          }
          .dark-theme-wrapper * {
            color: #0f172a !important;
            border-color: #e2e8f0 !important;
            background-color: transparent !important;
          }
          .dark-theme-wrapper h1,
          .dark-theme-wrapper h2 {
            color: #0f172a !important;
          }
        }
      `}</style>

      <InvoiceHeader data={data} primaryColor={primaryColor} />

      <CustomerInfo data={data} accentColor={primaryColor} />

      <InvoiceTable data={data} primaryColor={primaryColor} themeType="dark" />

      <div className="flex flex-row items-start justify-between gap-8 mt-6">
        <QRCodeSection data={data} />
        <div className="flex-1 flex flex-col items-end gap-6 self-stretch">
          <TotalsSection data={data} primaryColor={primaryColor} themeType="dark" />
          <SignatureSection data={data} />
        </div>
      </div>

      <Footer data={data} />
    </div>
  );
};

export default DarkTheme;
