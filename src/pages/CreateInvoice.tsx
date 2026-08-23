import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { invoiceService } from '../services/invoiceService';
import { InvoiceItem, ThemeCustomization } from '../types/invoice';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Mail, 
  Phone,
  Save,
  Download,
  Check,
  FileText,
  Percent,
  Sparkles,
  Palette,
  QrCode,
  PenTool,
  Sliders,
  Coins,
  MapPin,
  Maximize2,
  ScanLine,
  PackageSearch
} from 'lucide-react';
import { generateInvoiceNo } from '../lib/utils';
import { format } from 'date-fns';
import { InvoiceLayout } from '../components/InvoiceLayout';
import { motion, AnimatePresence } from 'motion/react';
import FormInput from '../components/ui/FormInput';
import { InvoicePreviewWrapper } from '../components/ui/InvoicePreviewWrapper';
import { logger } from '../lib/logger';
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';
import { calculateInvoiceTotals, formatCurrencyValue } from '../lib/financial';
import { productService } from '../services/productService';
import { Product } from '../types/product';
import { lookupBarcodeName } from '../lib/barcodeLookup';
import BarcodeScanner from '../components/ui/BarcodeScanner';
import ProductPickerModal from '../components/ui/ProductPickerModal';
import ProductFormModal from '../components/ui/ProductFormModal';

const CreateInvoice = () => {
  const { user, businessData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const isEditMode = !!editId;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  
  // Basic states
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const [dates, setDates] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { name: '', quantity: 1, price: 0 }
  ]);

  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [templateType, setTemplateType] = useState<'modern' | 'minimal' | 'classic' | 'dark' | 'custom'>('modern');
  const [notes, setNotes] = useState('');
  const [invoiceCount, setInvoiceCount] = useState(0);

  // Extended schema states
  const [currency, setCurrency] = useState('USD');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [qrCode, setQrCode] = useState('');
  const [signature, setSignature] = useState('');

  // Local overrides for theme customization
  const [customColors, setCustomColors] = useState({
    primaryColor: '',
    accentColor: '',
  });
  const [customizationOverrides, setCustomizationOverrides] = useState<Partial<ThemeCustomization>>({});

  // Barcode / product-catalog states
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [newProductPrefill, setNewProductPrefill] = useState<Partial<Product> | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productError, setProductError] = useState('');
  const [scanNote, setScanNote] = useState('');

  useEffect(() => {
    if (businessData) {
      setCustomColors({
        primaryColor: businessData.primaryColor || '#2563eb',
        accentColor: businessData.accentColor || '#0f172a',
      });
      // Sync default QR and signature if any
      setSignature(businessData.businessName || '');
    }
  }, [businessData]);

  // Fetch count
  useEffect(() => {
    let active = true;
    if (user) {
      invoiceService.getUserInvoices(user.id)
        .then(docs => {
          if (active) {
            setInvoiceCount(docs.length);
          }
        })
        .catch(err => {
          if (active) {
            logger.error('Error fetching count in CreateInvoice', err);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [user]);

  // Load existing invoice if in edit mode
  useEffect(() => {
    if (isEditMode && editId) {
      setLoading(true);
      invoiceService.getInvoice(editId)
        .then(inv => {
          setClientInfo({
            name: inv.clientName,
            email: inv.clientEmail,
            phone: inv.clientPhone,
            address: inv.clientAddress || '',
          });
          setDates({
            date: inv.date,
            dueDate: inv.dueDate,
          });
          setItems(inv.items);
          setGstEnabled(inv.gstEnabled);
          setGstPercentage(inv.gstPercentage);
          setTemplateType(inv.templateType);
          setNotes(inv.notes || '');
          setCurrency(inv.currency || 'USD');
          setDiscountPercentage(inv.discountPercentage || 0);
          setQrCode(inv.qrCode || '');
          setSignature(inv.signature || '');
          setInvoiceNo(inv.invoiceNo);
          if (inv.customization) {
            setCustomColors({
              primaryColor: inv.customization.primaryColor || '',
              accentColor: inv.customization.accentColor || '',
            });
            setCustomizationOverrides(inv.customization);
          }
        })
        .catch(err => {
          logger.error('Failed to load invoice for editing', err);
          setErrorMsg('Failed to load invoice details for editing.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isEditMode, editId]);

  // Set default invoiceNo when count changes (only in non-edit mode)
  useEffect(() => {
    if (!isEditMode) {
      setInvoiceNo(generateInvoiceNo(invoiceCount));
    }
  }, [invoiceCount, isEditMode]);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { name: '', quantity: 1, price: 0 }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  }, []);

  const updateItem = useCallback((index: number, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => {
      return prev.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            [field]: value
          };
        }
        return item;
      });
    });
  }, []);

  // Load the product catalog once (used by the "Catalog" picker and barcode lookups)
  const loadCatalog = useCallback(async () => {
    if (!user) return;
    setCatalogLoading(true);
    try {
      const list = await productService.listProducts(user.id);
      setCatalog(list);
    } catch (err) {
      logger.error('Failed to load product catalog in CreateInvoice', err);
    } finally {
      setCatalogLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadCatalog();
  }, [user, loadCatalog]);

  const flashNote = useCallback((msg: string) => {
    setScanNote(msg);
    window.setTimeout(() => setScanNote(''), 2600);
  }, []);

  // Add a catalog product (or scanned item) as an invoice line item.
  // Merges into an existing identical line, or replaces a single empty starter row.
  const addLineFromProduct = useCallback((p: { name: string; price: number | string }) => {
    const line: InvoiceItem = { name: p.name, quantity: 1, price: Number(p.price) || 0 };
    setItems(prev => {
      const matchIdx = prev.findIndex(
        it =>
          it.name.trim().toLowerCase() === line.name.trim().toLowerCase() &&
          Number(it.price) === Number(line.price)
      );
      if (matchIdx >= 0) {
        return prev.map((it, i) =>
          i === matchIdx ? { ...it, quantity: (Number(it.quantity) || 0) + 1 } : it
        );
      }
      const onlyEmptyRow =
        prev.length === 1 && !prev[0].name.trim() && (!prev[0].price || Number(prev[0].price) === 0);
      return onlyEmptyRow ? [line] : [...prev, line];
    });
  }, []);

  // Called when the scanner returns a barcode.
  const handleScanDetected = useCallback(
    async (code: string) => {
      setShowScanner(false);
      if (!user) return;
      try {
        const existing = await productService.getByBarcode(user.id, code);
        if (existing) {
          addLineFromProduct(existing);
          flashNote(`Added “${existing.name}” from your catalog.`);
          return;
        }
      } catch (err) {
        logger.error('Barcode lookup failed in CreateInvoice', err);
      }
      // Unknown barcode — offer to create it (best-effort name prefill).
      const suggestion = await lookupBarcodeName(code);
      setProductError('');
      setNewProductPrefill({ barcode: code, name: suggestion?.name || '' });
    },
    [user, addLineFromProduct, flashNote]
  );

  const handlePickProduct = useCallback(
    (product: Product) => {
      addLineFromProduct(product);
      setShowPicker(false);
      flashNote(`Added “${product.name}”.`);
    },
    [addLineFromProduct, flashNote]
  );

  // Save a brand-new product to the catalog AND drop it onto the invoice.
  const handleSaveNewProduct = useCallback(
    async (data: Partial<Product>) => {
      if (!user) return;
      setSavingProduct(true);
      setProductError('');
      try {
        const created = await productService.createProduct({
          userId: user.id,
          name: data.name || '',
          barcode: data.barcode || '',
          price: Number(data.price) || 0,
          taxRate: data.taxRate,
          unit: data.unit || '',
          sku: data.sku || '',
          description: data.description || '',
          currency,
        });
        addLineFromProduct(created);
        setCatalog(prev => [...prev, created]);
        setNewProductPrefill(null);
        flashNote(`Saved “${created.name}” to your catalog and added it.`);
      } catch (err: any) {
        setProductError(err.message || 'Could not save the product.');
      } finally {
        setSavingProduct(false);
      }
    },
    [user, currency, addLineFromProduct, flashNote]
  );

  // Compute precise values using high precision integer financial library
  const totals = useMemo(() => {
    return calculateInvoiceTotals({
      items,
      gstEnabled,
      gstPercentage,
      discountPercentage,
    });
  }, [items, gstEnabled, gstPercentage, discountPercentage]);

  // Validate date range constraints
  const dateError = useMemo(() => {
    if (new Date(dates.dueDate) < new Date(dates.date)) {
      return 'Due date must be on or after the invoice date.';
    }
    return '';
  }, [dates]);

  // Construct active dynamic customization
  const activeCustomization = useMemo((): ThemeCustomization => {
    return {
      primaryColor: customColors.primaryColor || businessData?.primaryColor || '#2563eb',
      accentColor: customColors.accentColor || businessData?.accentColor || '#0f172a',
      fontFamily: businessData?.fontFamily || 'Inter',
      fontSize: businessData?.fontSize || 14,
      logoPosition: businessData?.logoPosition || 'left',
      headerHeight: businessData?.headerHeight || 100,
      borderRadius: customizationOverrides.borderRadius || 'md',
      borderWidth: customizationOverrides.borderWidth || 'thin',
      spacing: customizationOverrides.spacing || 'comfortable',
      tableStyle: customizationOverrides.tableStyle || 'default',
      showQrCode: qrCode ? (customizationOverrides.showQrCode !== false) : false,
      showSignature: signature ? (customizationOverrides.showSignature !== false) : false,
      paperSize: customizationOverrides.paperSize || 'A4',
      logoHeight: 60
    };
  }, [customColors, businessData, customizationOverrides, qrCode, signature]);

  const handleSave = async () => {
    if (!user) return;
    setErrorMsg('');
    
    if (!clientInfo.name.trim()) {
      setErrorMsg("Please enter a client name.");
      return;
    }

    if (dateError) {
      setErrorMsg(dateError);
      return;
    }

    const validItems = items.filter(item => 
      item.name.trim() !== '' && 
      Number(item.price || 0) >= 0 && 
      Number(item.quantity || 0) > 0
    );
    if (validItems.length === 0) {
      setErrorMsg("Please add at least one valid item with a description, non-negative price, and positive quantity.");
      return;
    }

    setLoading(true);
    try {
      const invoicePayload = {
        invoiceNo: isEditMode ? invoiceNo : generateInvoiceNo(invoiceCount),
        userId: user.id,
        clientName: clientInfo.name.trim().substring(0, 100),
        clientEmail: clientInfo.email.trim().substring(0, 100),
        clientPhone: clientInfo.phone.trim().substring(0, 20),
        clientAddress: clientInfo.address.trim().substring(0, 500),
        date: dates.date,
        dueDate: dates.dueDate,
        items: validItems.map(item => ({
          name: item.name.trim().substring(0, 200),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0
        })),
        gstEnabled,
        gstPercentage,
        totalAmount: totals.total, 
        notes: notes.trim().substring(0, 1000),
        templateType,
        discountPercentage,
        currency,
        qrCode,
        signature,
        customization: activeCustomization
      };

      if (isEditMode && editId) {
        await invoiceService.updateInvoice(editId, invoicePayload);
      } else {
        await invoiceService.createInvoice({
          ...invoicePayload,
          status: 'unpaid'
        });
      }
      
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/history'), 1500);
    } catch (error: any) {
      logger.error('Error saving invoice caught in component', error);
      setErrorMsg(error.message || 'Error saving invoice. Please verify connection and permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;
    setErrorMsg('');
    const opt = {
      margin: 0,
      filename: `Invoice_${invoiceNo || generateInvoiceNo(invoiceCount)}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    try {
      await html2pdf().from(element).set(opt).save();
    } catch (err: any) {
      logger.error('Failed to compile or download PDF in CreateInvoice', err);
      setErrorMsg('Failed to compile and download PDF document.');
    } finally {
      document.querySelectorAll('.html2pdf__overlay, .html2pdf__container, .html2canvas-container, iframe').forEach(el => el.remove());
    }
  };

  // Helper formatting for currency symbol display
  const currencySymbol = useMemo(() => {
    return formatCurrencyValue(0, currency).replace(/[0. ,]/g, '');
  }, [currency]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 select-none">
      {/* Sticky Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            {isEditMode ? 'Edit invoice' : 'Create invoice'}
          </h1>
          <p className="text-grey mt-1.5 text-sm">Build a professional invoice and export it as a PDF.</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPDF}
            className="px-5 py-3 border border-hairline rounded text-xs font-semibold uppercase tracking-wide hover:bg-slate-50 text-ink-soft transition-colors flex items-center gap-2 bg-white cursor-pointer"
          >
            <Download size={14} className="text-grey" /> Download PDF
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={loading || !!dateError}
            className={`px-6 py-3 rounded text-xs font-semibold uppercase tracking-wide flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              success
                ? 'bg-positive text-white'
                : 'bg-ink hover:bg-accent text-paper'
            }`}
          >
            {success ? <Check size={14} /> : <Save size={14} />}
            {loading ? 'Saving…' : success ? 'Saved' : 'Save invoice'}
          </motion.button>
        </div>
      </div>

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-100/50 text-rose-600 p-4.5 rounded-2xl text-xs font-bold text-left"
        >
          {errorMsg}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Editor Form Columns */}
        <div className="lg:col-span-7 space-y-6">
          {/* Client details card */}
          <section className="bg-white p-6 sm:p-8 rounded border border-slate-200/60 shadow-sm space-y-5">
            <h3 className="font-display font-semibold border-b border-hairline pb-3 flex items-center gap-2 text-ink text-sm uppercase tracking-wide">
              <User size={16} className="text-blue-600" /> Client Details
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput 
                  label="Client Name" 
                  value={clientInfo.name} 
                  onChange={(v) => setClientInfo(prev => ({ ...prev, name: v }))} 
                  placeholder="Acme Corporation" 
                  required
                />
                <FormInput 
                  label="Email Address" 
                  type="email"
                  value={clientInfo.email} 
                  onChange={(v) => setClientInfo(prev => ({ ...prev, email: v }))} 
                  placeholder="billing@acme.com" 
                  icon={<Mail size={14}/>} 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput 
                  label="Phone Number" 
                  type="tel"
                  value={clientInfo.phone} 
                  onChange={(v) => setClientInfo(prev => ({ ...prev, phone: v }))} 
                  placeholder="+1 (555) 019-2834" 
                  icon={<Phone size={14}/>} 
                />
                <div className="flex flex-col space-y-1.5 text-left">
                  <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1 flex items-center gap-1">
                    <Coins size={12} /> Currency
                  </label>
                  <select 
                    value={currency} 
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="JPY">JPY (¥) - Japanese Yen</option>
                    <option value="CAD">CAD ($) - Canadian Dollar</option>
                    <option value="AUD">AUD ($) - Australian Dollar</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1 flex items-center gap-1">
                  <MapPin size={12} /> Client Billing Address
                </label>
                <textarea 
                  value={clientInfo.address}
                  onChange={e => setClientInfo(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street 104, Industrial Area, San Francisco, CA, USA"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs h-20 focus:outline-none focus:border-blue-500 font-semibold text-slate-700 placeholder-slate-400 resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput 
                  label="Invoice Date" 
                  type="date" 
                  value={dates.date} 
                  onChange={(v) => setDates(prev => ({ ...prev, date: v }))} 
                  icon={<Calendar size={14}/>} 
                />
                <FormInput 
                  label="Due Date" 
                  type="date" 
                  value={dates.dueDate} 
                  onChange={(v) => setDates(prev => ({ ...prev, dueDate: v }))} 
                  icon={<Calendar size={14}/>} 
                  error={dateError}
                />
              </div>
            </div>
          </section>

          {/* Invoice Items card */}
          <section className="bg-white p-6 sm:p-8 rounded border border-slate-200/60 shadow-sm space-y-5">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-3">
              <h3 className="font-display font-semibold flex items-center gap-2 text-ink text-sm uppercase tracking-wide">
                <FileText size={16} className="text-accent" /> Invoice Line Items
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="px-3 py-2 rounded-sm border border-hairline text-[10px] font-semibold uppercase tracking-wide text-ink-soft hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ScanLine size={14} className="text-accent" /> Scan
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPicker(true); if (catalog.length === 0) loadCatalog(); }}
                  className="px-3 py-2 rounded-sm border border-hairline text-[10px] font-semibold uppercase tracking-wide text-ink-soft hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PackageSearch size={14} className="text-grey" /> Catalog
                </button>
                <button
                  onClick={addItem}
                  className="text-xs font-semibold text-accent hover:text-ink flex items-center gap-1 transition-colors uppercase tracking-wide cursor-pointer"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>
            </div>

            {scanNote && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-[11px] font-medium text-positive bg-emerald-50 border border-emerald-100 rounded-sm px-3 py-2"
              >
                <Check size={13} /> {scanNote}
              </motion.div>
            )}
            
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {items.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-3 items-end"
                  >
                    <div className="flex-1">
                      <FormInput 
                        label={idx === 0 ? "Item Description" : undefined} 
                        value={item.name} 
                        onChange={v => updateItem(idx, 'name', v)} 
                        placeholder="e.g. Graphic Design Services" 
                        required
                      />
                    </div>
                    <div className="w-18 sm:w-20">
                      <FormInput 
                        label={idx === 0 ? "Qty" : undefined} 
                        type="number" 
                        min="1"
                        value={item.quantity} 
                        onChange={v => updateItem(idx, 'quantity', v)} 
                        required
                      />
                    </div>
                    <div className="w-24 sm:w-32">
                      <FormInput 
                        label={idx === 0 ? `Price (${currencySymbol})` : undefined} 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={item.price} 
                        onChange={v => updateItem(idx, 'price', v)} 
                        required
                      />
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeItem(idx)} 
                      disabled={items.length <= 1}
                      className="p-3 text-slate-400 hover:text-rose-500 mb-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={addItem}
              className="border border-dashed border-hairline hover:border-accent text-grey hover:text-accent rounded py-3.5 w-full transition-colors text-[10px] font-semibold uppercase tracking-wide flex items-center justify-center gap-1.5 cursor-pointer mt-4"
            >
              <Plus size={14} /> Add Additional Line Item
            </motion.button>
          </section>

          {/* Calculations & Discounts Card */}
          <section className="bg-white p-6 sm:p-8 rounded border border-hairline space-y-6">
            <h3 className="font-display font-semibold border-b border-hairline pb-3 flex items-center gap-2 text-ink text-sm uppercase tracking-wide">
              <Percent size={16} className="text-blue-600" /> Taxes, Fees & Discounts
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Discount rates */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">
                  Discount Percentage (%)
                </label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={discountPercentage} 
                    onChange={(e) => setDiscountPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. 10"
                  />
                  <span className="text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* GST rate */}
              <div className="flex items-center justify-between pt-4.5">
                <div>
                  <label className="text-xs font-semibold text-ink-soft">
                    Apply GST / Tax rate
                  </label>
                  <p className="text-[10px] text-slate-400 font-medium">Toggle and configure tax percentage.</p>
                </div>
                <div className="flex items-center gap-3">
                  {gstEnabled && (
                    <div className="flex items-center gap-1.5 animate-fadeIn">
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={gstPercentage} 
                        onChange={(e) => setGstPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-center focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-xs text-slate-400 font-bold">%</span>
                    </div>
                  )}
                  <button 
                    onClick={() => setGstEnabled(!gstEnabled)}
                    className={`w-12 h-6.5 rounded-full transition-all duration-300 relative cursor-pointer ${gstEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-sm ${gstEnabled ? 'left-7' : 'left-1.5'}`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Pay Reference & Cursive handwriting settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1 flex items-center gap-1">
                  <QrCode size={12} /> QR Code Reference (UPI / Link / Text)
                </label>
                <input 
                  type="text" 
                  value={qrCode} 
                  onChange={e => setQrCode(e.target.value)}
                  placeholder="e.g. payswift@upi or payment-link"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1 flex items-center gap-1">
                  <PenTool size={12} /> Cursive Signature Text (or image URL)
                </label>
                <input 
                  type="text" 
                  value={signature} 
                  onChange={e => setSignature(e.target.value)}
                  placeholder="e.g. Kenith Karas"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Theme Visual Settings Suite */}
          <section className="bg-white p-6 sm:p-8 rounded border border-hairline space-y-6">
            <h3 className="font-display font-semibold border-b border-hairline pb-3 flex items-center gap-2 text-ink text-sm uppercase tracking-wide">
              <Sliders size={16} className="text-blue-600" /> Theme Styling Overrides
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Override Accent Color</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={customColors.primaryColor}
                    onChange={e => setCustomColors(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200/60 p-0 overflow-hidden"
                  />
                  <input 
                    type="text"
                    value={customColors.primaryColor}
                    onChange={e => setCustomColors(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Table styling */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Table Visual Layout</label>
                <select 
                  value={customizationOverrides.tableStyle || 'default'} 
                  onChange={e => setCustomizationOverrides(prev => ({ ...prev, tableStyle: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="default">Default Colors</option>
                  <option value="striped">Zebra Striped Rows</option>
                  <option value="grid">Bordered Grid Box</option>
                  <option value="minimal">Ultra Clean Minimalist</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-5">
              {/* Padding spacing */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Layout Spacing</label>
                <select 
                  value={customizationOverrides.spacing || 'comfortable'} 
                  onChange={e => setCustomizationOverrides(prev => ({ ...prev, spacing: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="compact">Compact Space</option>
                  <option value="comfortable">Comfortable Grid</option>
                  <option value="spacious">Spacious Breathing</option>
                </select>
              </div>

              {/* Borders */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Top Ribbon Width</label>
                <select 
                  value={customizationOverrides.borderWidth || 'thin'} 
                  onChange={e => setCustomizationOverrides(prev => ({ ...prev, borderWidth: e.target.value as any }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="none">No Ribbon</option>
                  <option value="thin">Thin Accent Line</option>
                  <option value="medium">Medium Accent block</option>
                  <option value="thick">Thick Banner block</option>
                </select>
              </div>

              {/* Toggle controls */}
              <div className="space-y-2 text-left flex flex-col justify-end pb-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={customizationOverrides.showQrCode !== false} 
                    onChange={e => setCustomizationOverrides(prev => ({ ...prev, showQrCode: e.target.checked }))}
                    className="rounded border-slate-200 text-blue-600 accent-blue-600"
                  />
                  <span>Show QR Code if text active</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 font-semibold cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={customizationOverrides.showSignature !== false} 
                    onChange={e => setCustomizationOverrides(prev => ({ ...prev, showSignature: e.target.checked }))}
                    className="rounded border-slate-200 text-blue-600 accent-blue-600"
                  />
                  <span>Show Representative Signature</span>
                </label>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-5">
              <label className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1">Terms Footnotes</label>
              <textarea 
                value={notes}
                maxLength={1000}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Remit payments within terms. Interest fees accrue at 2% weekly on late drafts."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs h-20 focus:outline-none focus:border-blue-500 font-semibold text-slate-800 transition-all resize-none"
              />
            </div>
          </section>
        </div>

        {/* Live Preview Columns */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
          {/* Visual Theme Selection Suite */}
          <div className="space-y-3">
            <span className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-1 block text-left">
              Select Invoice Theme
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'modern', name: 'Modern Accent', style: 'border-t-4 border-blue-600' },
                { id: 'minimal', name: 'Elegant Minimal', style: 'border-l-4 border-slate-300' },
                { id: 'classic', name: 'Classic Vintage', style: 'border-t-4 border-slate-900 font-serif' },
                { id: 'dark', name: 'Premium Dark', style: 'bg-slate-900 text-white border border-slate-800' },
                { id: 'custom', name: 'Brand Custom', style: 'border-t-4 border-rose-500 border-dashed' },
              ].map((themeOpt) => {
                const isActive = templateType === themeOpt.id;
                return (
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    key={themeOpt.id}
                    type="button"
                    onClick={() => setTemplateType(themeOpt.id as any)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-500/20' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-[8px] font-semibold uppercase tracking-wide ${isActive ? 'text-accent' : 'text-slate-400'}`}>
                      {themeOpt.id}
                    </span>
                    <span className={`text-[10px] font-semibold truncate ${themeOpt.style}`}>
                      {themeOpt.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-semibold text-grey uppercase tracking-[0.14em]">Document Real-time Preview</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-[8px] font-semibold uppercase text-positive tracking-wide">Live</span>
            </span>
          </div>
          
          <div className="bg-slate-50 border border-hairline rounded p-6 flex justify-center max-h-[75vh] overflow-y-auto custom-scrollbar w-full">
            <InvoicePreviewWrapper>
              <div id="invoice-preview">
                <InvoiceLayout 
                  data={{
                    invoiceNo: invoiceNo || generateInvoiceNo(invoiceCount),
                    clientName: clientInfo.name,
                    clientEmail: clientInfo.email,
                    clientPhone: clientInfo.phone,
                    clientAddress: clientInfo.address,
                    date: dates.date,
                    dueDate: dates.dueDate,
                    items: items,
                    gstEnabled,
                    gstPercentage,
                    totalAmount: totals.total,
                    notes,
                    templateType,
                    discountPercentage,
                    currency,
                    qrCode,
                    signature,
                    customization: activeCustomization
                  }} 
                  businessData={businessData} 
                  invoiceCount={invoiceCount} 
                />
              </div>
            </InvoicePreviewWrapper>
          </div>
        </div>
      </div>

      {/* Barcode scanner — reads a code, then looks it up in the catalog */}
      {showScanner && (
        <BarcodeScanner
          title="Scan item barcode"
          onDetected={handleScanDetected}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Catalog picker — search saved products and click to add a line */}
      {showPicker && (
        <ProductPickerModal
          products={catalog}
          loading={catalogLoading}
          currency={currency}
          onPick={handlePickProduct}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Unknown scanned barcode — save it to the catalog and add it to the invoice */}
      {newProductPrefill && (
        <ProductFormModal
          initial={newProductPrefill}
          title="Add product to catalog"
          saving={savingProduct}
          error={productError}
          onSave={handleSaveNewProduct}
          onClose={() => setNewProductPrefill(null)}
        />
      )}
    </div>
  );
};

export default CreateInvoice;
