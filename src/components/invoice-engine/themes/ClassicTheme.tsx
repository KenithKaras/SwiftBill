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

const ClassicTheme: React.FC<ThemeProps> = ({ data }) => {
  const customization = data.customization || {};
  const primaryColor = customization.primaryColor || '#0f172a';
  const fontSize = customization.fontSize || 14;

  const fontStyle = customization.fontFamily?.includes('Playfair') 
    ? '"Playfair Display", Georgia, serif'
    : customization.fontFamily?.includes('JetBrains')
    ? '"JetBrains Mono", monospace'
    : '"Playfair Display", Georgia, serif'; // Default to serif for classic vintage look

  return (
    <div 
      className="bg-white text-slate-800 p-12 min-h-280.75 flex flex-col relative w-full overflow-hidden select-none border-t-12 border-slate-900"
      style={{ 
        fontFamily: fontStyle, 
        fontSize: `${fontSize}px`
      }}
    >
      <InvoiceHeader data={data} primaryColor={primaryColor} />

      <CustomerInfo data={data} accentColor={primaryColor} />

      <InvoiceTable data={data} primaryColor={primaryColor} themeType="classic" />

      <div className="flex flex-row items-start justify-between gap-8 mt-6">
        <QRCodeSection data={data} />
        <div className="flex-1 flex flex-col items-end gap-6 self-stretch">
          <TotalsSection data={data} primaryColor={primaryColor} themeType="classic" />
          <SignatureSection data={data} />
        </div>
      </div>

      <Footer data={data} />
    </div>
  );
};

export default ClassicTheme;
