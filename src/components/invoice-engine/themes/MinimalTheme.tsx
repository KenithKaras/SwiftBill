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

const MinimalTheme: React.FC<ThemeProps> = ({ data }) => {
  const customization = data.customization || {};
  const primaryColor = customization.primaryColor || '#64748b';
  const fontSize = customization.fontSize || 13;

  const fontStyle = customization.fontFamily?.includes('Playfair') 
    ? '"Playfair Display", Georgia, serif'
    : customization.fontFamily?.includes('JetBrains')
    ? '"JetBrains Mono", monospace'
    : '"Public Sans", sans-serif';

  return (
    <div 
      className="bg-white text-slate-800 p-12 min-h-280.75 flex flex-col relative w-full overflow-hidden select-none border-l-4 border-slate-200"
      style={{ 
        fontFamily: fontStyle, 
        fontSize: `${fontSize}px`
      }}
    >
      <InvoiceHeader data={data} primaryColor={primaryColor} />

      <CustomerInfo data={data} accentColor={primaryColor} />

      <InvoiceTable data={data} primaryColor={primaryColor} themeType="minimal" />

      <div className="flex flex-row items-start justify-between gap-8 mt-6">
        <QRCodeSection data={data} />
        <div className="flex-1 flex flex-col items-end gap-6 self-stretch">
          <TotalsSection data={data} primaryColor={primaryColor} themeType="minimal" />
          <SignatureSection data={data} />
        </div>
      </div>

      <Footer data={data} />
    </div>
  );
};

export default MinimalTheme;
