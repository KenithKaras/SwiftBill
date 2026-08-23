import { ThemeCustomization } from '../../types/invoice';

export interface ThemeMeta {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  darkSupport: boolean;
  printOptimization: boolean;
  defaultCustomization: ThemeCustomization;
}

export const themesConfig: Record<string, ThemeMeta> = {
  modern: {
    id: 'modern',
    name: 'Modern Accent',
    description: 'Vibrant colors, spacious layout, and a premium modern appeal.',
    thumbnail: 'modern',
    darkSupport: false,
    printOptimization: true,
    defaultCustomization: {
      primaryColor: '#1e3a2f',
      accentColor: '#0f172a',
      fontFamily: 'Public Sans',
      fontSize: 14,
      logoPosition: 'left',
      headerHeight: 100,
      borderRadius: 'md',
      borderWidth: 'thin',
      spacing: 'comfortable',
      tableStyle: 'default',
      showQrCode: true,
      showSignature: true,
      paperSize: 'A4',
      logoHeight: 60
    }
  },
  minimal: {
    id: 'minimal',
    name: 'Elegant Minimal',
    description: 'Clean typographic hierarchy with thin lines. Perfect for minimalists.',
    thumbnail: 'minimal',
    darkSupport: false,
    printOptimization: true,
    defaultCustomization: {
      primaryColor: '#64748b',
      accentColor: '#1e293b',
      fontFamily: 'Public Sans',
      fontSize: 13,
      logoPosition: 'left',
      headerHeight: 80,
      borderRadius: 'none',
      borderWidth: 'none',
      spacing: 'compact',
      tableStyle: 'minimal',
      showQrCode: true,
      showSignature: true,
      paperSize: 'A4',
      logoHeight: 50
    }
  },
  classic: {
    id: 'classic',
    name: 'Classic Vintage',
    description: 'Formal serif typography and structured grid borders.',
    thumbnail: 'classic',
    darkSupport: false,
    printOptimization: true,
    defaultCustomization: {
      primaryColor: '#0f172a',
      accentColor: '#0f172a',
      fontFamily: 'Playfair Display',
      fontSize: 14,
      logoPosition: 'right',
      headerHeight: 110,
      borderRadius: 'none',
      borderWidth: 'medium',
      spacing: 'comfortable',
      tableStyle: 'grid',
      showQrCode: false,
      showSignature: true,
      paperSize: 'A4',
      logoHeight: 60
    }
  },
  dark: {
    id: 'dark',
    name: 'Premium Dark',
    description: 'Sleek, dark aesthetic with bright text accents. Premium on-screen feel.',
    thumbnail: 'dark',
    darkSupport: true,
    printOptimization: false,
    defaultCustomization: {
      primaryColor: '#3b82f6',
      accentColor: '#ffffff',
      fontFamily: 'JetBrains Mono',
      fontSize: 13,
      logoPosition: 'left',
      headerHeight: 100,
      borderRadius: 'lg',
      borderWidth: 'thin',
      spacing: 'spacious',
      tableStyle: 'striped',
      showQrCode: true,
      showSignature: true,
      paperSize: 'A4',
      logoHeight: 60
    }
  },
  custom: {
    id: 'custom',
    name: 'Custom Branded',
    description: 'Fine-tune every visual slider to align exactly with your brand guidelines.',
    thumbnail: 'custom',
    darkSupport: true,
    printOptimization: true,
    defaultCustomization: {
      primaryColor: '#1e3a2f',
      accentColor: '#0f172a',
      fontFamily: 'Public Sans',
      fontSize: 14,
      logoPosition: 'left',
      headerHeight: 100,
      borderRadius: 'md',
      borderWidth: 'thin',
      spacing: 'comfortable',
      tableStyle: 'default',
      showQrCode: true,
      showSignature: true,
      paperSize: 'A4',
      logoHeight: 60
    }
  }
};
