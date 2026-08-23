import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { X, Search, PackageSearch, Loader2, Barcode } from 'lucide-react';
import { Product } from '../../types/product';
import { formatCurrencyValue } from '../../lib/financial';

interface ProductPickerModalProps {
  products: Product[];
  loading?: boolean;
  currency?: string;
  onPick: (product: Product) => void;
  onClose: () => void;
}

const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  products,
  loading = false,
  currency = 'USD',
  onPick,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
    );
  }, [products, query]);

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
        aria-label="Add from catalog"
        className="relative w-full max-w-lg bg-paper border border-hairline rounded shadow-xl shadow-black/10 flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <h3 className="font-display font-semibold text-ink text-sm uppercase tracking-wide flex items-center gap-2">
            <PackageSearch size={16} className="text-accent" /> Add from catalog
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-grey hover:text-ink hover:bg-slate-100 rounded transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 border-b border-hairline">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, barcode or SKU"
              className="w-full bg-white border border-hairline rounded pl-10 pr-4 py-2.5 text-sm font-medium text-ink focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-grey">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14 px-6">
              <p className="text-sm font-semibold text-ink">
                {products.length === 0 ? 'Your catalog is empty' : 'No matches'}
              </p>
              <p className="text-xs text-grey mt-1.5">
                {products.length === 0
                  ? 'Add products on the Products page, or scan a new barcode to create one.'
                  : 'Try a different search term.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-hairline">
              {filtered.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onPick(p)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.barcode ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-grey">
                            <Barcode size={11} /> {p.barcode}
                          </span>
                        ) : null}
                        {p.unit ? <span className="text-[10px] text-grey uppercase tracking-wide">/ {p.unit}</span> : null}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-ink tnum flex-shrink-0">
                      {formatCurrencyValue(Number(p.price) || 0, currency)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ProductPickerModal;
