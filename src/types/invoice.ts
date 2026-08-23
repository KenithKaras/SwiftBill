export interface InvoiceItem {
  name: string;
  quantity: number | string;
  price: number | string;
}

export interface ThemeCustomization {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontSize?: number;
  logoPosition?: 'left' | 'center' | 'right';
  headerHeight?: number;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  borderWidth?: 'none' | 'thin' | 'medium' | 'thick';
  spacing?: 'compact' | 'comfortable' | 'spacious';
  tableStyle?: 'default' | 'striped' | 'grid' | 'minimal';
  showQrCode?: boolean;
  showSignature?: boolean;
  paperSize?: 'A4' | 'letter';
  logoHeight?: number;
}

export interface BusinessDetails {
  businessName: string;
  businessLogo?: string;
  address: string;
  gstNumber?: string;
  email?: string;
  phone?: string;
  letterheadImage?: string;
}

export interface InvoiceData {
  id?: string;
  invoiceNo: string;
  userId: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  gstEnabled: boolean;
  gstPercentage: number;
  totalAmount: number;
  status: 'paid' | 'unpaid';
  notes: string;
  templateType: 'modern' | 'minimal' | 'classic' | 'dark' | 'custom';
  createdAt?: string;
  lastReminderSentAt?: string;
  
  // Extended Universal Schema attributes
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress?: string;
  
  discountPercentage?: number;
  discountAmount?: number;
  currency?: string;
  qrCode?: string;
  signature?: string;
  
  // Embedded or runtime customization settings
  customization?: ThemeCustomization;
  businessDetails?: BusinessDetails;
}
