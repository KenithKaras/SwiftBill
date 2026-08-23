import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { InvoiceData, InvoiceItem, ThemeCustomization } from '../types/invoice';
import { calculateInvoiceTotals } from '../lib/financial';

export interface DBInvoiceRow {
  id?: string;
  invoice_no: string;
  user_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_address?: string;
  date: string;
  due_date: string;
  items: InvoiceItem[];
  gst_enabled: boolean;
  gst_percentage: number;
  total_amount: number;
  status: 'paid' | 'unpaid';
  notes: string;
  template_type: 'modern' | 'minimal' | 'classic' | 'dark' | 'custom';
  font_family?: string;
  header_height?: number;
  logo_position?: 'left' | 'center' | 'right';
  font_size?: number;
  discount_percentage?: number;
  discount_amount?: number;
  currency?: string;
  qr_code?: string;
  signature?: string;
  customization?: ThemeCustomization;
  created_at?: string;
  last_reminder_at?: string;
}

const mapToDB = (data: Partial<InvoiceData>): Partial<DBInvoiceRow> => {
  const mapped: Partial<DBInvoiceRow> = {};
  if (data.invoiceNo !== undefined) mapped.invoice_no = data.invoiceNo;
  if (data.userId !== undefined) mapped.user_id = data.userId;
  if (data.clientName !== undefined) mapped.client_name = data.clientName;
  if (data.clientEmail !== undefined) mapped.client_email = data.clientEmail;
  if (data.clientPhone !== undefined) mapped.client_phone = data.clientPhone;
  if (data.clientAddress !== undefined) mapped.client_address = data.clientAddress;
  if (data.date !== undefined) mapped.date = data.date;
  if (data.dueDate !== undefined) mapped.due_date = data.dueDate;
  if (data.items !== undefined) mapped.items = data.items;
  if (data.gstEnabled !== undefined) mapped.gst_enabled = data.gstEnabled;
  if (data.gstPercentage !== undefined) mapped.gst_percentage = data.gstPercentage;
  if (data.totalAmount !== undefined) mapped.total_amount = data.totalAmount;
  if (data.status !== undefined) mapped.status = data.status;
  if (data.notes !== undefined) mapped.notes = data.notes;
  if (data.templateType !== undefined) mapped.template_type = data.templateType;
  if (data.customization?.fontFamily !== undefined) mapped.font_family = data.customization.fontFamily;
  if (data.customization?.headerHeight !== undefined) mapped.header_height = data.customization.headerHeight;
  if (data.customization?.logoPosition !== undefined) mapped.logo_position = data.customization.logoPosition;
  if (data.customization?.fontSize !== undefined) mapped.font_size = data.customization.fontSize;
  if (data.discountPercentage !== undefined) mapped.discount_percentage = data.discountPercentage;
  if (data.discountAmount !== undefined) mapped.discount_amount = data.discountAmount;
  if (data.currency !== undefined) mapped.currency = data.currency;
  if (data.qrCode !== undefined) mapped.qr_code = data.qrCode;
  if (data.signature !== undefined) mapped.signature = data.signature;
  if (data.customization !== undefined) mapped.customization = data.customization;
  if (data.lastReminderSentAt !== undefined) mapped.last_reminder_at = data.lastReminderSentAt;
  return mapped;
};

const mapFromDB = (data: DBInvoiceRow): InvoiceData => ({
  id: data.id,
  invoiceNo: data.invoice_no,
  userId: data.user_id,
  clientName: data.client_name,
  clientEmail: data.client_email || '',
  clientPhone: data.client_phone || '',
  clientAddress: data.client_address || '',
  date: data.date,
  dueDate: data.due_date,
  items: data.items || [],
  gstEnabled: data.gst_enabled,
  gstPercentage: Number(data.gst_percentage) || 18,
  totalAmount: Number(data.total_amount) || 0,
  status: data.status,
  notes: data.notes || '',
  templateType: data.template_type || 'modern',
  discountPercentage: Number(data.discount_percentage) || 0,
  discountAmount: Number(data.discount_amount) || 0,
  currency: data.currency || 'USD',
  qrCode: data.qr_code || '',
  signature: data.signature || '',
  customization: {
    fontFamily: data.font_family,
    headerHeight: data.header_height,
    logoPosition: data.logo_position,
    fontSize: data.font_size,
    ...(data.customization || {})
  },
  createdAt: data.created_at,
  lastReminderSentAt: data.last_reminder_at,
});

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

const calculateTotal = (
  items: InvoiceItem[],
  gstEnabled: boolean,
  gstPercentage: number,
  discountPercentage?: number,
  discountAmount?: number
): number => {
  return calculateInvoiceTotals({
    items,
    gstEnabled,
    gstPercentage,
    discountPercentage,
    discountAmount,
  }).total;
};

export const invoiceService = {
  async createInvoice(data: Omit<InvoiceData, 'id' | 'createdAt'>): Promise<InvoiceData> {
    try {
      // Security: Recalculate total to prevent client-side tampering
      const validatedTotal = calculateTotal(
        data.items,
        data.gstEnabled,
        data.gstPercentage,
        data.discountPercentage,
        data.discountAmount
      );
      
      const { data: result, error } = await supabase
        .from('invoices')
        .insert([mapToDB({ ...data, totalAmount: validatedTotal })])
        .select()
        .single();
      
      if (error) throw error;
      if (!result) throw new Error('No record returned from database');
      return mapFromDB(result as unknown as DBInvoiceRow);
    } catch (err: any) {
      logger.error('Failed to create invoice', err);
      throw new Error('Database operation failed. The invoice could not be created at this time.');
    }
  },

  async getUserInvoices(userId: string): Promise<InvoiceData[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((row: any) => mapFromDB(row as DBInvoiceRow));
    } catch (err: any) {
      logger.error(`Failed to fetch invoices for user ${userId}`, err);
      throw new Error('Could not retrieve invoices. Please reload the page.');
    }
  },

  async getInvoice(id: string): Promise<InvoiceData> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Invoice not found');
      return mapFromDB(data as DBInvoiceRow);
    } catch (err: any) {
      logger.error(`Failed to fetch invoice ${id}`, err);
      throw new Error('Could not retrieve invoice details.');
    }
  },

  async updateInvoice(id: string, data: Partial<InvoiceData>): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update(mapToDB(data))
        .eq('id', id);
      
      if (error) throw error;
    } catch (err: any) {
      logger.error(`Failed to update invoice ${id}`, err);
      throw new Error('Could not update invoice details. Check database connection.');
    }
  },

  async sendReminder(invoice: InvoiceData): Promise<ServiceResponse<string>> {
    if (!invoice.id || !invoice.clientEmail) {
      return { success: false, error: 'Invalid invoice data for sending reminder.' };
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('invoices')
        .update({ last_reminder_at: now })
        .eq('id', invoice.id);
        
      if (error) throw error;
      
      return { 
        success: true, 
        data: now,
        message: 'Reminder successfully tracked and recorded.'
      };
    } catch (err: any) {
      logger.error(`Failed to send reminder for invoice ${invoice.id}`, err);
      return { success: false, error: 'Failed to record sent reminder in database.' };
    }
  },

  async deleteInvoice(id: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data?.length || 0;
    } catch (err: any) {
      logger.error(`Failed to delete invoice ${id}`, err);
      throw new Error('Unable to complete delete request. Ensure you have appropriate database permissions.');
    }
  }
};
