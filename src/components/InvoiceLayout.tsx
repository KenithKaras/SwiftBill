import React from 'react';
import { InvoiceData } from '../types/invoice';
import { InvoiceRenderer } from './invoice-engine/InvoiceRenderer';

interface InvoiceLayoutProps {
  data: Partial<InvoiceData>;
  businessData: any;
  invoiceCount?: number;
}

export const InvoiceLayout: React.FC<InvoiceLayoutProps> = ({ data, businessData }) => {
  return (
    <InvoiceRenderer 
      theme={data.templateType} 
      invoiceData={data} 
      businessData={businessData} 
    />
  );
};
