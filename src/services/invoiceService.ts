import { supabase } from '../lib/supabase';

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

export interface InvoiceData {
  id?: string;
  invoiceNo: string;
  userId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  gstEnabled: boolean;
  gstPercentage: number;
  totalAmount: number;
  status: 'paid' | 'unpaid';
  notes: string;
  templateType: 'modern' | 'minimal' | 'classic' | 'custom';
  fontFamily?: string;
  headerHeight?: number;
  logoPosition?: 'left' | 'center' | 'right';
  fontSize?: number;
  createdAt?: string;
  lastReminderSentAt?: string;
}

const mapToDB = (data: Partial<InvoiceData>) => {
  const mapped: any = {};
  if (data.invoiceNo !== undefined) mapped.invoice_no = data.invoiceNo;
  if (data.userId !== undefined) mapped.user_id = data.userId;
  if (data.clientName !== undefined) mapped.client_name = data.clientName;
  if (data.clientEmail !== undefined) mapped.client_email = data.clientEmail;
  if (data.clientPhone !== undefined) mapped.client_phone = data.clientPhone;
  if (data.date !== undefined) mapped.date = data.date;
  if (data.dueDate !== undefined) mapped.due_date = data.dueDate;
  if (data.items !== undefined) mapped.items = data.items;
  if (data.gstEnabled !== undefined) mapped.gst_enabled = data.gstEnabled;
  if (data.gstPercentage !== undefined) mapped.gst_percentage = data.gstPercentage;
  if (data.totalAmount !== undefined) mapped.total_amount = data.totalAmount;
  if (data.status !== undefined) mapped.status = data.status;
  if (data.notes !== undefined) mapped.notes = data.notes;
  if (data.templateType !== undefined) mapped.template_type = data.templateType;
  if (data.fontFamily !== undefined) mapped.font_family = data.fontFamily;
  if (data.headerHeight !== undefined) mapped.header_height = data.headerHeight;
  if (data.logoPosition !== undefined) mapped.logo_position = data.logoPosition;
  if (data.fontSize !== undefined) mapped.font_size = data.fontSize;
  if (data.lastReminderSentAt !== undefined) mapped.last_reminder_at = data.lastReminderSentAt;
  return mapped;
};

const mapFromDB = (data: any): InvoiceData => ({
  id: data.id,
  invoiceNo: data.invoice_no,
  userId: data.user_id,
  clientName: data.client_name,
  clientEmail: data.client_email,
  clientPhone: data.client_phone,
  date: data.date,
  dueDate: data.due_date,
  items: data.items,
  gstEnabled: data.gst_enabled,
  gstPercentage: data.gst_percentage || 18,
  totalAmount: data.total_amount,
  status: data.status,
  notes: data.notes,
  templateType: data.template_type || 'modern',
  fontFamily: data.font_family,
  headerHeight: data.header_height,
  logoPosition: data.logo_position,
  fontSize: data.font_size,
  createdAt: data.created_at,
  lastReminderSentAt: data.last_reminder_at,
});

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

const calculateTotal = (items: InvoiceItem[], gstEnabled: boolean, gstPercentage: number) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const gst = gstEnabled ? subtotal * (gstPercentage / 100) : 0;
  return subtotal + gst;
};

export const invoiceService = {
  async createInvoice(data: Omit<InvoiceData, 'id' | 'createdAt'>) {
    // Security: Recalculate total to prevent client-side tampering
    const validatedTotal = calculateTotal(data.items, data.gstEnabled, data.gstPercentage);
    
    const { data: result, error } = await supabase
      .from('invoices')
      .insert([mapToDB({ ...data, totalAmount: validatedTotal })])
      .select()
      .single();
    
    if (error) throw new Error(`Database error: ${error.message}`);
    return result;
  },

  async getUserInvoices(userId: string) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(mapFromDB);
  },

  async updateInvoice(id: string, data: Partial<InvoiceData>) {
    const { error } = await supabase
      .from('invoices')
      .update(mapToDB(data))
      .eq('id', id);
    
    if (error) throw error;
  },

  async sendReminder(invoice: InvoiceData): Promise<ServiceResponse<string>> {
    if (!invoice.id || !invoice.clientEmail) {
      return { success: false, error: 'Invalid invoice data for reminder' };
    }

    try {
      // Simulate secure API call delay
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
        message: 'Reminder successfully tracked'
      } as any;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteInvoice(id: string) {
    const { data, error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      throw new Error(`Delete operation failed: ${error.message}`);
    }
    
    return data?.length || 0;
  }
};
