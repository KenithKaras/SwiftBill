import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ScanLine, Package, Save } from 'lucide-react';
import { Product } from '../../types/product';
import BarcodeScanner from './BarcodeScanner';

interface ProductFormModalProps {
  initial?: Partial<Product>;
  title?: string;
  saving?: boolean;
  error?: string;
  onSave: (data: Partial<Product>) => void;
  onClose: () => void;
}

const labelCls =
  'text-[10px] font-semibold text-grey uppercase tracking-[0.14em] ml-0.5 flex items-center gap-1';
const inputCls =
  'w-full bg-white border border-hairline rounded px-4 py-2.5 text-sm font-medium text-ink focus:outline-none focus:border-accent';

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  initial,
  title = 'Add product',
  saving = false,
  error = '',
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initial?.name || '');
  const [barcode, setBarcode] = useState(initial?.barcode || '');
  const [price, setPrice] = useState<string | number>(initial?.price ?? '');
  const [taxRate, setTaxRate] = useState<string | number>(
    initial?.taxRate === undefined || initial?.taxRate === null ? '' : initial.taxRate
  );
  const [unit, setUnit] = useState(initial?.unit || '');
  const [sku, setSku] = useState(initial?.sku || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [localError, setLocalError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!name.trim()) {
      setLocalError('Product name is required.');
      return;
    }
    if (Number(price) < 0 || price === '' || isNaN(Number(price))) {
      setLocalError('Enter a valid price (0 or more).');
      return;
    }
    onSave({
      name: name.trim().substring(0, 200),
      barcode: barcode.trim().substring(0, 64),
      price: Number(price) || 0,
      taxRate: taxRate === '' ? undefined : Number(taxRate),
      unit: unit.trim().substring(0, 24),
      sku: sku.trim().substring(0, 64),
      description: description.trim().substring(0, 500),
    });
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg bg-paper border border-hairline rounded shadow-xl shadow-black/10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline sticky top-0 bg-paper z-10">
          <h3 className="font-display font-semibold text-ink text-sm uppercase tracking-wide flex items-center gap-2">
            <Package size={16} className="text-accent" /> {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-grey hover:text-ink hover:bg-slate-100 rounded transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Product name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. USB-C Cable 1m"
              className={inputCls}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>
              <ScanLine size={12} /> Barcode
            </label>
            <div className="flex gap-2">
              <input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or type a barcode"
                className={`${inputCls} font-mono tnum`}
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="px-4 py-2.5 rounded text-xs font-semibold uppercase tracking-wide border border-hairline text-ink-soft hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <ScanLine size={14} /> Scan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Price *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className={`${inputCls} tnum`}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Tax rate % (optional)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="e.g. 18"
                className={`${inputCls} tnum`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className={labelCls}>Unit (optional)</label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pc, kg, hr…"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>SKU (optional)</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Internal code"
                className={`${inputCls} font-mono`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description shown when picking from the catalog"
              className={`${inputCls} h-20 resize-none`}
            />
          </div>

          {(localError || error) && (
            <p className="text-[11px] text-negative font-medium">{localError || error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wide border border-hairline text-ink-soft hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wide bg-ink hover:bg-accent text-paper transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Save product'}
            </button>
          </div>
        </form>
      </motion.div>

      {showScanner && (
        <BarcodeScanner
          title="Scan product barcode"
          onDetected={(code) => {
            setBarcode(code);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default ProductFormModal;
