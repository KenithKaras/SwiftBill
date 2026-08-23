export interface Product {
  id?: string;
  userId: string;
  barcode?: string;
  name: string;
  description?: string;
  price: number;
  taxRate?: number;
  unit?: string;
  sku?: string;
  currency?: string;
  createdAt?: string;
  updatedAt?: string;
}
