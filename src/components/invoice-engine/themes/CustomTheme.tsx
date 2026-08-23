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

const CustomTheme: React.FC<ThemeProps> = ({ data }) => {
  const customization = data.customization || {};
  const primaryColor = customization.primaryColor || '#1e3a2f';
  const fontSize = customization.fontSize || 14;
  const letterheadImage = data.businessDetails?.letterheadImage;

  const fontStyle = customization.fontFamily?.includes('Playfair') 
    ? '"Playfair Display", Georgia, serif'
    : customization.fontFamily?.includes('JetBrains')
    ? '"JetBrains Mono", monospace'
    : '"Public Sans", sans-serif';

  // Customize padding spacing class
  const paddingClass = customization.spacing === 'compact' 
    ? 'p-8' 
    : customization.spacing === 'spacious' 
    ? 'p-16' 
    : 'p-12'; // default: comfortable

  // Customize border styles
  const borderTopWidth = customization.borderWidth === 'none' 
    ? '0px' 
    : customization.borderWidth === 'medium' 
    ? '16px' 
    : customization.borderWidth === 'thick' 
    ? '24px' 
    : '12px'; // default: thin

  const borderStyle = {
    fontFamily: fontStyle, 
    fontSize: `${fontSize}px`,
    borderTopWidth: letterheadImage ? '0px' : borderTopWidth,
    borderTopStyle: 'solid' as const,
    borderTopColor: primaryColor
  };

  return (
    <div 
      className={`bg-white text-slate-800 min-h-280.75 flex flex-col relative w-full overflow-hidden select-none ${paddingClass}`}
      style={borderStyle}
    >
      <InvoiceHeader data={data} primaryColor={primaryColor} />

      <CustomerInfo data={data} accentColor={primaryColor} />

      <InvoiceTable data={data} primaryColor={primaryColor} themeType="custom" />

      <div className="flex flex-row items-start justify-between gap-8 mt-6">
        <QRCodeSection data={data} />
        <div className="flex-1 flex flex-col items-end gap-6 self-stretch">
          <TotalsSection data={data} primaryColor={primaryColor} themeType="custom" />
          <SignatureSection data={data} />
        </div>
      </div>

      <Footer data={data} />
    </div>
  );
};

export default CustomTheme;
