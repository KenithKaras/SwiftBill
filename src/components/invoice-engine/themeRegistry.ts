import React from 'react';
import { InvoiceData } from '../../types/invoice';

export interface ThemeComponentProps {
  data: InvoiceData;
}

export type ThemeComponentType = React.ComponentType<ThemeComponentProps>;

// Map theme IDs to lazy loaded component files for optimal performance and bundle size control
export const invoiceThemes: Record<
  'modern' | 'minimal' | 'classic' | 'dark' | 'custom', 
  React.LazyExoticComponent<ThemeComponentType>
> = {
  modern: React.lazy(() => import('./themes/ModernTheme')),
  minimal: React.lazy(() => import('./themes/MinimalTheme')),
  classic: React.lazy(() => import('./themes/ClassicTheme')),
  dark: React.lazy(() => import('./themes/DarkTheme')),
  custom: React.lazy(() => import('./themes/CustomTheme')),
};

export const defaultThemeId = 'modern';
export type ThemeId = keyof typeof invoiceThemes;
