import React, { Suspense } from 'react';
import { InvoiceData } from '../../types/invoice';
import { invoiceThemes, defaultThemeId, ThemeId } from './themeRegistry';
import ModernTheme from './themes/ModernTheme';

interface InvoiceRendererProps {
  theme?: string;
  invoiceData: Partial<InvoiceData>;
  businessData: any;
}

// Elegant loading skeleton of an invoice layout for Suspense fallback
const InvoiceSkeleton = () => (
  <div className="bg-white p-12 min-h-210 flex flex-col space-y-6 animate-pulse w-full select-none border-t-12 border-slate-100">
    <div className="flex justify-between items-start">
      <div className="space-y-3">
        <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
        <div className="h-3 w-36 bg-slate-100 rounded-md"></div>
      </div>
      <div className="h-10 w-28 bg-slate-100 rounded-md"></div>
    </div>
    <div className="h-16 w-1/3 bg-slate-50 rounded-xl"></div>
    <div className="h-44 w-full bg-slate-50 rounded-2xl"></div>
    <div className="ml-auto h-24 w-60 bg-slate-50 rounded-xl"></div>
    <div className="h-12 w-full bg-slate-50 rounded-xl mt-auto"></div>
  </div>
);

// Self-correcting theme boundary: if a theme crashes or fails to load, gracefully fall back to the standard Modern theme
class ThemeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallbackData: InvoiceData },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[Engine] Invoice rendering failure. Falling back to default layout.', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="relative">
          <div className="absolute top-2 left-2 z-50 bg-negative text-white text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-sm">
            Fallback Theme Active
          </div>
          <ModernTheme data={this.props.fallbackData} />
        </div>
      );
    }
    return this.props.children;
  }
}

export const InvoiceRenderer: React.FC<InvoiceRendererProps> = ({
  theme,
  invoiceData,
  businessData,
}) => {
  // 1. Resolve and validate the target theme ID
  const selectedThemeId = (theme && theme in invoiceThemes ? theme : defaultThemeId) as ThemeId;
  const TargetThemeComponent = invoiceThemes[selectedThemeId];

  // 2. Build the unified payload merged with default preferences and customization
  const customization = {
    primaryColor: businessData?.primaryColor || '#1e3a2f',
    accentColor: businessData?.accentColor || '#0f172a',
    fontFamily: businessData?.fontFamily || 'Public Sans',
    fontSize: businessData?.fontSize || 14,
    logoPosition: businessData?.logoPosition || 'left',
    headerHeight: businessData?.headerHeight || 100,
    // Add additional visual options merging from customizable metadata
    borderRadius: businessData?.customization?.borderRadius || 'md',
    borderWidth: businessData?.customization?.borderWidth || 'thin',
    spacing: businessData?.customization?.spacing || 'comfortable',
    tableStyle: businessData?.customization?.tableStyle || 'default',
    showQrCode: businessData?.customization?.showQrCode !== false,
    showSignature: businessData?.customization?.showSignature !== false,
    paperSize: businessData?.customization?.paperSize || 'A4',
    logoHeight: businessData?.customization?.logoHeight || 60,
    ...invoiceData.customization,
  };

  const businessDetails = {
    businessName: businessData?.businessName || 'My Business',
    businessLogo: businessData?.businessLogo || '',
    address: businessData?.address || '',
    gstNumber: businessData?.gstNumber || '',
    email: businessData?.email || '',
    phone: businessData?.phone || '',
    letterheadImage: businessData?.letterheadImage || '',
    ...invoiceData.businessDetails,
  };

  const fullInvoicePayload: InvoiceData = {
    invoiceNo: invoiceData.invoiceNo || 'INV-001',
    userId: invoiceData.userId || '',
    clientName: invoiceData.clientName || 'Client Name',
    clientEmail: invoiceData.clientEmail || '',
    clientPhone: invoiceData.clientPhone || '',
    clientAddress: invoiceData.clientAddress || '',
    date: invoiceData.date || new Date().toISOString().split('T')[0],
    dueDate: invoiceData.dueDate || new Date().toISOString().split('T')[0],
    items: invoiceData.items || [],
    gstEnabled: invoiceData.gstEnabled || false,
    gstPercentage: invoiceData.gstPercentage || 18,
    totalAmount: invoiceData.totalAmount || 0,
    status: invoiceData.status || 'unpaid',
    notes: invoiceData.notes || '',
    templateType: selectedThemeId,
    discountPercentage: invoiceData.discountPercentage || 0,
    discountAmount: invoiceData.discountAmount || 0,
    currency: invoiceData.currency || 'USD',
    qrCode: invoiceData.qrCode || '',
    signature: invoiceData.signature || '',
    customization,
    businessDetails,
  };

  return (
    <ThemeErrorBoundary fallbackData={fullInvoicePayload}>
      <Suspense fallback={<InvoiceSkeleton />}>
        <div className="w-198.5 min-w-198.5 mx-auto bg-white shadow-sm">
          <TargetThemeComponent data={fullInvoicePayload} />
        </div>
      </Suspense>
    </ThemeErrorBoundary>
  );
};

export default InvoiceRenderer;
