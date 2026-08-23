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

const ModernTheme: React.FC<ThemeProps> = ({ data }) => {
  const customization = data.customization || {};
  const primaryColor = customization.primaryColor || '#1e3a2f';
  const accentColor = customization.accentColor || '#0f172a';

  const fontStyle = customization.fontFamily?.includes('Playfair') 
    ? '"Playfair Display", Georgia, serif'
    : customization.fontFamily?.includes('JetBrains')
    ? '"JetBrains Mono", monospace'
    : '"Public Sans", sans-serif';

  const fontSize = customization.fontSize || 14;

  // Border radius utility
  const getRadiusClass = () => {
    if (customization.borderRadius === 'none') return 'rounded-none';
    if (customization.borderRadius === 'sm') return 'rounded-xl';
    if (customization.borderRadius === 'lg') return 'rounded-3xl';
    if (customization.borderRadius === 'full') return 'rounded-[2rem]';
    return 'rounded-2xl'; // default: md
  };

  return (
    <div 
      className="bg-white text-slate-800 p-12 min-h-280.75 flex flex-col relative w-full overflow-hidden select-none border-t-12"
      style={{ 
        fontFamily: fontStyle, 
        fontSize: `${fontSize}px`,
        borderTopColor: primaryColor
      }}
    >
      {/* Header Block */}
      <InvoiceHeader data={data} primaryColor={primaryColor} />

      {/* Recipient details */}
      <CustomerInfo data={data} accentColor={primaryColor} />

      {/* Invoiced items list */}
      <InvoiceTable data={data} primaryColor={primaryColor} themeType="modern" />

      {/* Calculations & Extra Details block */}
      <div className="flex flex-row items-start justify-between gap-8 mt-6">
        <QRCodeSection data={data} />
        <div className="flex-1 flex flex-col items-end gap-6 self-stretch">
          <TotalsSection data={data} primaryColor={primaryColor} themeType="modern" />
          <SignatureSection data={data} />
        </div>
      </div>

      {/* Footer terms */}
      <Footer data={data} />
    </div>
  );
};

export default ModernTheme;
