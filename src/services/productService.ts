import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { Product } from '../types/product';

export interface DBProductRow {
  id?: string;
  user_id: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  price: number;
  tax_rate?: number | null;
  unit?: string | null;
  sku?: string | null;
  currency?: string | null;
  created_at?: string;
  updated_at?: string;
}

const mapToDB = (data: Partial<Product>): Partial<DBProductRow> => {
  const mapped: Partial<DBProductRow> = {};
  if (data.userId !== undefined) mapped.user_id = data.userId;
  if (data.barcode !== undefined) mapped.barcode = data.barcode ? data.barcode.trim() : null;
  if (data.name !== undefined) mapped.name = data.name;
  if (data.description !== undefined) mapped.description = data.description || null;
  if (data.price !== undefined) mapped.price = Number(data.price) || 0;
  if (data.taxRate !== undefined) mapped.tax_rate = data.taxRate === undefined || data.taxRate === null ? null : Number(data.taxRate);
  if (data.unit !== undefined) mapped.unit = data.unit || null;
  if (data.sku !== undefined) mapped.sku = data.sku || null;
  if (data.currency !== undefined) mapped.currency = data.currency || 'USD';
  return mapped;
};

const mapFromDB = (data: DBProductRow): Product => ({
  id: data.id,
  userId: data.user_id,
  barcode: data.barcode || '',
  name: data.name,
  description: data.description || '',
  price: Number(data.price) || 0,
  taxRate: data.tax_rate === null || data.tax_rate === undefined ? undefined : Number(data.tax_rate),
  unit: data.unit || '',
  sku: data.sku || '',
  currency: data.currency || 'USD',
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const productService = {
  async listProducts(userId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map((row: any) => mapFromDB(row as DBProductRow));
    } catch (err: any) {
      logger.error(`Failed to fetch products for user ${userId}`, err);
      throw new Error('Could not load your product catalog. Please reload the page.');
    }
  },

  // Returns the matching product for a scanned barcode, or null if none is saved yet.
  async getByBarcode(userId: string, barcode: string): Promise<Product | null> {
    const trimmed = (barcode || '').trim();
    if (!trimmed) return null;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .eq('barcode', trimmed)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ? mapFromDB(data as DBProductRow) : null;
    } catch (err: any) {
      logger.error(`Failed to look up barcode ${trimmed}`, err);
      throw new Error('Could not search the catalog for that barcode.');
    }
  },

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    try {
      const { data: result, error } = await supabase
        .from('products')
        .insert([mapToDB(data)])
        .select()
        .single();

      if (error) throw error;
      if (!result) throw new Error('No record returned from database');
      return mapFromDB(result as unknown as DBProductRow);
    } catch (err: any) {
      logger.error('Failed to create product', err);
      // Surface the common duplicate-barcode case with a clear message.
      if (err?.code === '23505' || /duplicate key|unique/i.test(err?.message || '')) {
        throw new Error('A product with this barcode already exists in your catalog.');
      }
      throw new Error('Could not save the product. Please try again.');
    }
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .update(mapToDB(data))
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      logger.error(`Failed to update product ${id}`, err);
      if (err?.code === '23505' || /duplicate key|unique/i.test(err?.message || '')) {
        throw new Error('A product with this barcode already exists in your catalog.');
      }
      throw new Error('Could not update the product. Please try again.');
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      logger.error(`Failed to delete product ${id}`, err);
      throw new Error('Could not delete the product. Please try again.');
    }
  },
};
