import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Package,
  Plus,
  ScanLine,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Barcode,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { Product } from '../types/product';
import { logger } from '../lib/logger';
import { formatCurrencyValue } from '../lib/financial';
import { lookupBarcodeName } from '../lib/barcodeLookup';
import BarcodeScanner from '../components/ui/BarcodeScanner';
import ProductFormModal from '../components/ui/ProductFormModal';

const Products = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [formInitial, setFormInitial] = useState<Partial<Product> | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [showScanner, setShowScanner] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = async () => {
    if (!user) return;
    try {
      const list = await productService.listProducts(user.id);
      setProducts(list);
      setLoadError('');
    } catch (err: any) {
      logger.error('Failed to load products', err);
      setLoadError(err.message || 'Could not load products.');
    }
  };

  useEffect(() => {
    let active = true;
    if (user) {
      setLoading(true);
      productService
        .listProducts(user.id)
        .then((list) => {
          if (active) setProducts(list);
        })
        .catch((err) => {
          if (active) setLoadError(err.message || 'Could not load products.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  const openAdd = (initial?: Partial<Product>) => {
    setEditing(null);
    setFormInitial(initial);
    setSaveError('');
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setFormInitial(product);
    setSaveError('');
    setShowForm(true);
  };

  const handleSave = async (data: Partial<Product>) => {
    if (!user) return;
    setSaving(true);
    setSaveError('');
    try {
      if (editing?.id) {
        await productService.updateProduct(editing.id, data);
      } else {
        await productService.createProduct({
          userId: user.id,
          name: data.name || '',
          barcode: data.barcode || '',
          price: Number(data.price) || 0,
          taxRate: data.taxRate,
          unit: data.unit || '',
          sku: data.sku || '',
          description: data.description || '',
          currency: 'USD',
        });
      }
      await refresh();
      setShowForm(false);
      setEditing(null);
      setFormInitial(undefined);
    } catch (err: any) {
      setSaveError(err.message || 'Could not save the product.');
    } finally {
      setSaving(false);
    }
  };

  const handleScan = async (code: string) => {
    setShowScanner(false);
    if (!user) return;
    try {
      const existing = await productService.getByBarcode(user.id, code);
      if (existing) {
        openEdit(existing);
        return;
      }
    } catch (err) {
      logger.error('Barcode lookup failed on Products page', err);
    }
    // Not in catalog — prefill a new product with a best-effort name.
    const suggestion = await lookupBarcodeName(code);
    openAdd({ barcode: code, name: suggestion?.name || '' });
  };

  const handleDelete = async () => {
    if (!confirmDelete?.id) return;
    setDeleting(true);
    try {
      await productService.deleteProduct(confirmDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err: any) {
      setLoadError(err.message || 'Could not delete the product.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Products</h1>
          <p className="text-grey mt-1.5 text-sm">
            Your catalog. Scan a barcode here or on an invoice to add items instantly.
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowScanner(true)}
            className="px-5 py-3 border border-hairline rounded text-xs font-semibold uppercase tracking-wide hover:bg-slate-50 text-ink-soft transition-colors flex items-center gap-2 bg-white cursor-pointer"
          >
            <ScanLine size={14} className="text-grey" /> Scan to add
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openAdd()}
            className="px-6 py-3 rounded text-xs font-semibold uppercase tracking-wide flex items-center gap-2 bg-ink hover:bg-accent text-paper transition-colors cursor-pointer"
          >
            <Plus size={14} /> Add product
          </motion.button>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-hairline text-negative p-4 rounded text-xs font-medium">
          {loadError}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, barcode or SKU"
          className="w-full bg-white border border-hairline rounded pl-10 pr-4 py-2.5 text-sm font-medium text-ink focus:outline-none focus:border-accent"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-grey">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-hairline rounded py-16 text-center">
          <div className="w-12 h-12 mx-auto rounded bg-slate-100 flex items-center justify-center">
            <Package size={22} className="text-grey" />
          </div>
          <p className="text-sm font-semibold text-ink mt-4">
            {products.length === 0 ? 'No products yet' : 'No matches'}
          </p>
          <p className="text-xs text-grey mt-1.5 max-w-sm mx-auto">
            {products.length === 0
              ? 'Add your products once — with a barcode — and scanning will auto-fill them on every invoice.'
              : 'Try a different search term.'}
          </p>
          {products.length === 0 && (
            <button
              onClick={() => openAdd()}
              className="mt-5 px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wide bg-ink hover:bg-accent text-paper transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={14} /> Add your first product
            </button>
          )}
        </div>
      ) : (
        <div className="border border-hairline rounded overflow-hidden">
          {/* Column header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-hairline">
            <span className="col-span-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em]">Product</span>
            <span className="col-span-3 text-[10px] font-semibold text-grey uppercase tracking-[0.14em]">Barcode</span>
            <span className="col-span-2 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] text-right">Price</span>
            <span className="col-span-2 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] text-right">Actions</span>
          </div>
          <ul className="divide-y divide-hairline">
            <AnimatePresence initial={false}>
              {filtered.map((p) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 items-center hover:bg-slate-50/60 transition-colors"
                >
                  <div className="col-span-2 sm:col-span-5 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                    {(p.unit || p.sku || p.description) && (
                      <p className="text-[11px] text-grey truncate mt-0.5">
                        {[p.sku && `SKU ${p.sku}`, p.unit && `per ${p.unit}`, p.description]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-3">
                    {p.barcode ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-soft bg-paper border border-hairline px-2 py-1 rounded-sm tnum">
                        <Barcode size={12} className="text-grey" /> {p.barcode}
                      </span>
                    ) : (
                      <span className="text-[11px] text-grey">—</span>
                    )}
                  </div>
                  <div className="sm:col-span-2 text-right">
                    <span className="text-sm font-semibold text-ink tnum">
                      {formatCurrencyValue(Number(p.price) || 0, p.currency || 'USD')}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-2 flex justify-end gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="p-2 rounded-sm border border-hairline text-grey hover:text-ink hover:bg-white transition-colors cursor-pointer"
                      aria-label={`Edit ${p.name}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p)}
                      className="p-2 rounded-sm border border-hairline text-grey hover:text-negative hover:bg-white transition-colors cursor-pointer"
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}

      {/* Add / edit modal */}
      {showForm && (
        <ProductFormModal
          initial={formInitial}
          title={editing ? 'Edit product' : 'Add product'}
          saving={saving}
          error={saveError}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
            setFormInitial(undefined);
          }}
        />
      )}

      {/* Scanner */}
      {showScanner && (
        <BarcodeScanner
          title="Scan to add product"
          onDetected={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => !deleting && setConfirmDelete(null)}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative w-full max-w-sm bg-paper border border-hairline rounded shadow-xl shadow-black/10 p-6"
          >
            <div className="w-10 h-10 rounded bg-red-50 flex items-center justify-center">
              <AlertTriangle size={18} className="text-negative" />
            </div>
            <h3 className="font-display font-semibold text-ink mt-4">Delete product?</h3>
            <p className="text-xs text-grey mt-1.5 leading-relaxed">
              “{confirmDelete.name}” will be removed from your catalog. Invoices already created
              are not affected.
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded text-xs font-semibold uppercase tracking-wide border border-hairline text-ink-soft hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded text-xs font-semibold uppercase tracking-wide bg-negative hover:opacity-90 text-white transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Products;
