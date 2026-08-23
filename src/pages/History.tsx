import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { invoiceService, DBInvoiceRow } from '../services/invoiceService';
import { InvoiceData } from '../types/invoice';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Share2, 
  Eye, 
  Trash2,
  Mail,
  MessageCircle,
  Download,
  Clock,
  RefreshCw,
  Bell,
  AlertTriangle,
  Receipt,
  FileCheck,
  LayoutGrid,
  List,
  Edit2,
  Printer,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { InvoiceLayout } from '../components/InvoiceLayout';
import { InvoicePreviewWrapper } from '../components/ui/InvoicePreviewWrapper';
import { formatCurrencyValue } from '../lib/financial';
import { motion, AnimatePresence } from 'motion/react';
import { logger } from '../lib/logger';
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';

const formatMonthYear = (yyyyMM: string) => {
  try {
    const [year, month] = yyyyMM.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month)) {
      const d = new Date(year, month - 1, 1);
      return format(d, 'MMMM yyyy');
    }
  } catch (e) {
    // fallback
  }
  return yyyyMM;
};

const History = () => {
  const { user, businessData } = useAuth();
  const navigate = useNavigate();

  // Basic States
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Filtering & Sorting States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Drawer / Interactive States
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [showPermissionHint, setShowPermissionHint] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch Invoices
  const fetchInvoices = async (showSkeleton = true) => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchUserId = user.id;
    if (showSkeleton) {
      setLoading(true);
    }
    try {
      const data = await invoiceService.getUserInvoices(fetchUserId);
      if (user?.id === fetchUserId) {
        setInvoices(data);
        setLastError(null);
      }
    } catch (err: any) {
      logger.error("Error fetching invoices in History component", err);
      if (user?.id === fetchUserId) {
        setLastError(err.message || "Unable to retrieve invoice list. Please reload the page.");
      }
    } finally {
      if (user?.id === fetchUserId && showSkeleton) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  // Dismiss Banner Notification
  useEffect(() => {
    if (infoMsg) {
      const timer = setTimeout(() => setInfoMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [infoMsg]);

  // Get unique months from invoice dates
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    invoices.forEach(inv => {
      if (inv.date) {
        const yyyyMM = inv.date.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(yyyyMM)) {
          monthsSet.add(yyyyMM);
        }
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [invoices]);

  // Filter & Sort Logic
  const filteredAndSortedInvoices = useMemo(() => {
    let result = [...invoices];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(inv => inv.status === statusFilter);
    }

    // Month filter
    if (monthFilter !== 'all') {
      result = result.filter(inv => inv.date && inv.date.startsWith(monthFilter));
    }

    // Search query
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(inv => 
        inv.clientName.toLowerCase().includes(query) ||
        inv.invoiceNo.toLowerCase().includes(query) ||
        inv.clientEmail.toLowerCase().includes(query)
      );
    }

    // Sort order
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.totalAmount - a.totalAmount;
        case 'amount-asc':
          return a.totalAmount - b.totalAmount;
        case 'client-asc':
          return a.clientName.localeCompare(b.clientName);
        case 'client-desc':
          return b.clientName.localeCompare(a.clientName);
        case 'date-desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return result;
  }, [invoices, search, statusFilter, monthFilter, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, monthFilter, sortBy]);

  // Paginated Sub-list
  const paginatedInvoices = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedInvoices.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredAndSortedInvoices, currentPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAndSortedInvoices.length / itemsPerPage));
  }, [filteredAndSortedInvoices]);

  // Actions handlers
  const handleSendReminder = async (invoice: InvoiceData) => {
    if (!invoice.id) return;
    setRemindingId(invoice.id);
    setInfoMsg(null);
    try {
      const response = await invoiceService.sendReminder(invoice);
      if (response.success) {
        setInfoMsg({ 
          text: `Reminder email successfully dispatched to ${invoice.clientName}.`, 
          type: 'success' 
        });
        await fetchInvoices(false);
        // Sync selected invoice if open
        if (selectedInvoice && selectedInvoice.id === invoice.id) {
          setSelectedInvoice(prev => prev ? { ...prev, lastReminderSentAt: response.data } : null);
        }
      } else {
        setInfoMsg({ 
          text: `Could not send reminder: ${response.error}`, 
          type: 'error' 
        });
      }
    } catch (err: any) {
      logger.error("Failed to send reminder in History component", err);
      setInfoMsg({ 
        text: "Failed to dispatch reminder due to a database/service error.", 
        type: 'error' 
      });
    } finally {
      setRemindingId(null);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) {
      setInfoMsg({ text: "Error: This invoice doesn't have a valid ID.", type: 'error' });
      return;
    }

    if (!confirm("Are you sure you want to delete this invoice? This operation is permanent.")) {
      return;
    }

    setDeletingId(id);
    setInfoMsg(null);
    try {
      const count = await invoiceService.deleteInvoice(id);
      
      if (count === 0) {
        setLastError("Your account doesn't have permission to delete invoices.");
        setShowPermissionHint(true);
      } else {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        setShowPermissionHint(false); 
        setLastError(null);
        setInfoMsg({ text: "Invoice successfully removed.", type: 'success' });
        if (selectedInvoice && selectedInvoice.id === id) {
          setSelectedInvoice(null);
        }
      }
    } catch (err: any) {
      logger.error("Delete invoice caught in History component", err);
      setLastError(err.message || "A network or database error occurred during deletion.");
      setShowPermissionHint(true);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (inv: InvoiceData) => {
    setDownloadingId(inv.id || null);
    setErrorMsg('');
    
    setTimeout(async () => {
      const element = document.getElementById(`pdf-worker-${inv.id}`);
      if (!element) {
        setDownloadingId(null);
        return;
      }

      const opt = {
        margin: 0,
        filename: `Invoice_${inv.invoiceNo}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };

      try {
        await html2pdf().from(element).set(opt).save();
      } catch (err) {
        logger.error('Failed to compile or download PDF in History', err);
        setInfoMsg({ text: "Failed to compile and download PDF document.", type: 'error' });
      } finally {
        setDownloadingId(null);
        document.querySelectorAll('.html2pdf__overlay, .html2pdf__container, .html2canvas-container, iframe').forEach(el => el.remove());
      }
    }, 400);
  };

  // Invisible iframe method for printing Tailwind styled A4 sheets
  const handlePrint = (inv: InvoiceData) => {
    const printElement = document.getElementById(`pdf-worker-${inv.id}`);
    if (!printElement) {
      setInfoMsg({ text: "Invoice content is not rendered. Cannot print.", type: 'error' });
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    let stylesHTML = '';
    const styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const rules = styleSheets[i].cssRules;
        stylesHTML += `<style>`;
        for (let j = 0; j < rules.length; j++) {
          stylesHTML += rules[j].cssText;
        }
        stylesHTML += `</style>`;
      } catch (e) {
        if (styleSheets[i].href) {
          stylesHTML += `<link rel="stylesheet" href="${styleSheets[i].href}">`;
        }
      }
    }

    const printContent = printElement.innerHTML;

    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${inv.invoiceNo}</title>
          ${stylesHTML}
          <style>
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            @page {
              size: A4;
              margin: 0;
            }
            @media print {
              body {
                width: 210mm;
                height: 297mm;
              }
              .pdf-page-break {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div style="width: 794px; min-height: 1123px; margin: 0 auto; box-shadow: none;">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.parent.document.body.removeChild(window.frameElement);
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'paid' ? 'unpaid' : 'paid';
    setInfoMsg(null);
    const originalInvoices = [...invoices];

    // Optimistic Update
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: next } : inv
    ));
    if (selectedInvoice && selectedInvoice.id === id) {
      setSelectedInvoice(prev => prev ? { ...prev, status: next } : null);
    }

    try {
      await invoiceService.updateInvoice(id, { status: next as any });
      setInfoMsg({ text: `Invoice marked as ${next}.`, type: 'success' });
      await fetchInvoices(false);
    } catch (e: any) {
      logger.error("Failed to update status in History", e);
      setInfoMsg({ text: "Failed to update status. Check permissions.", type: 'error' });
      setInvoices(originalInvoices);
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice(originalInvoices.find(i => i.id === id) || null);
      }
    }
  };

  const setErrorMsg = (msg: string) => {
    if (msg) setInfoMsg({ text: msg, type: 'error' });
  };

  const handleShareWhatsApp = (inv: InvoiceData) => {
    const text = `Hi ${inv.clientName}, your invoice ${inv.invoiceNo} for ${formatCurrencyValue(inv.totalAmount, inv.currency)} is ready. Please review it.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const handleShareEmail = (inv: InvoiceData) => {
    const subject = `Invoice ${inv.invoiceNo} from SwiftBill`;
    const body = `Hi ${inv.clientName},\n\nPlease find your invoice ${inv.invoiceNo} attached. Total amount: ${formatCurrencyValue(inv.totalAmount, inv.currency)}.\n\nThank you!`;
    window.open(`mailto:${inv.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="space-y-8 select-none pb-12 relative">
      {/* Title + Filters Header */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-hairline pb-6"
      >
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Invoice History</h1>
          <p className="text-grey mt-1.5 text-sm">Review, track, and share all business billing records.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchInvoices()}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm flex items-center justify-center cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </motion.button>

          {/* Layout Toggle Option */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table view"
            >
              <List size={14} />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card view"
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
          
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input 
              type="text" 
              placeholder="Search client or invoice..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all w-52 sm:w-60"
            />
          </div>
          
          {/* Status selector */}
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl pl-10 pr-8 py-3 text-xs font-bold text-slate-600 focus:outline-none hover:border-blue-200 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Filter size={12} />
            </div>
          </div>

          {/* Month selector */}
          <div className="relative">
            <select 
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl pl-10 pr-8 py-3 text-xs font-bold text-slate-600 focus:outline-none hover:border-blue-200 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              <option value="all">All Months</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {formatMonthYear(month)}
                </option>
              ))}
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Calendar size={12} />
            </div>
          </div>

          {/* Advanced Sorting Selector */}
          <div className="relative">
            <select 
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-2xl pl-5 pr-8 py-3 text-xs font-bold text-slate-600 focus:outline-none hover:border-blue-200 focus:border-blue-500 transition-all cursor-pointer appearance-none"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount: High-Low</option>
              <option value="amount-asc">Amount: Low-High</option>
              <option value="client-asc">Client: A-Z</option>
              <option value="client-desc">Client: Z-A</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Message Notifications */}
      <AnimatePresence>
        {infoMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between shadow-sm ${
              infoMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' 
                : 'bg-rose-50 text-rose-600 border-rose-100/50'
            }`}
          >
            <span>{infoMsg.text}</span>
            <button 
              onClick={() => setInfoMsg(null)}
              className="text-[10px] font-semibold uppercase tracking-wide underline hover:text-opacity-80 transition-opacity ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RLS Permissions Alert Warning */}
      <AnimatePresence>
        {showPermissionHint && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 border border-amber-100 rounded p-5 text-left"
          >
            <div className="space-y-3">
              <h4 className="font-display font-semibold text-ink text-sm flex items-center gap-2">
                <AlertTriangle size={17} className="text-amber-600" /> This invoice couldn't be deleted
              </h4>
              <p className="text-[13px] text-ink-soft leading-relaxed max-w-2xl">
                Your account doesn't currently have permission to delete invoices. Nothing was changed. If this keeps happening, an administrator needs to enable delete access for your workspace.
              </p>
              {lastError && (
                <p className="text-[11px] text-grey font-mono">Reference: {lastError}</p>
              )}
              <button
                onClick={() => setShowPermissionHint(false)}
                className="text-[12px] font-semibold text-amber-600 hover:text-ink transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      {loading ? (
        viewMode === 'list' ? (
          <div className="bg-white rounded border border-slate-200/60 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse min-w-225">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] w-32">Invoice ID</th>
                  <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em]">Client / Contact</th>
                  <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] w-36">Date</th>
                  <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] w-36">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] w-36">Status</th>
                  <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] text-right pr-12 w-64">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <TableRowSkeleton />
              </tbody>
            </table>
          </div>
        ) : (
          <GridSkeleton />
        )
      ) : (
        <>
          {viewMode === 'list' ? (
            /* List / Table Visual View */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded border border-slate-200/60 shadow-sm overflow-hidden"
            >
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-225">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] w-32">Invoice ID</th>
                      <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em]">Client / Contact</th>
                      <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] w-36">Date</th>
                      <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] w-36">Amount</th>
                      <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] w-36">Status</th>
                      <th className="px-8 py-5 text-[10px] font-semibold text-grey uppercase tracking-[0.14em] text-right pr-12 w-64">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedInvoices.map((inv) => (
                      <tr 
                        key={inv.id} 
                        className="hover:bg-slate-50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedInvoice(inv)}
                      >
                        <td className="px-8 py-5">
                          <span className="font-mono text-[10px] text-grey bg-slate-50 border border-hairline px-2 py-0.5 rounded-sm tnum">
                            #{inv.invoiceNo}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-bold text-slate-800 leading-tight">{inv.clientName}</span>
                            <span className="text-[10px] text-slate-400 font-semibold mt-1">{inv.clientEmail}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-xs text-slate-500 font-bold">
                          {inv.date}
                        </td>
                        <td className="px-8 py-5 text-sm font-semibold text-ink tnum">
                          {formatCurrencyValue(inv.totalAmount, inv.currency)}
                        </td>
                        <td className="px-8 py-5">
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatus(inv.id!, inv.status);
                            }}
                            className={`px-3 py-1 rounded-sm text-[10px] font-semibold uppercase tracking-wide border transition-colors cursor-pointer ${
                              inv.status === 'paid' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100/40 hover:bg-emerald-100/30' 
                                : 'bg-amber-50 text-amber-600 border-amber-100/40 hover:bg-amber-100/30'
                            }`}
                          >
                            {inv.status}
                          </motion.button>
                        </td>
                        <td className="px-8 py-5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2.5">
                            {/* Hidden work area for PDF compilation */}
                            <div className="fixed -left-2499.75 top-0 pointer-events-none select-none" aria-hidden="true">
                              <div id={`pdf-worker-${inv.id}`} className="bg-white pdf-container" style={{ width: '794px', minWidth: '794px' }}>
                                <InvoiceLayout data={inv} businessData={businessData} />
                              </div>
                            </div>
      
                            <ActionBtn 
                              onClick={() => setSelectedInvoice(inv)}
                              icon={<Eye size={13} />} 
                              color="hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-100" 
                              title="Preview Invoice"
                            />
                            <ActionBtn 
                              onClick={() => handleDownload(inv)}
                              loading={downloadingId === inv.id}
                              icon={<Download size={13} />} 
                              color="hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-100" 
                              title="Download PDF"
                            />
                            <ActionBtn 
                              onClick={() => handlePrint(inv)}
                              icon={<Printer size={13} />} 
                              color="hover:text-slate-600 hover:bg-slate-50 hover:border-slate-200" 
                              title="Print Invoice"
                            />
                            <ActionBtn 
                              onClick={() => navigate(`/dashboard/create?edit=${inv.id}`)}
                              icon={<Edit2 size={13} />} 
                              color="hover:text-amber-600 hover:bg-amber-50/50 hover:border-amber-100" 
                              title="Edit Details"
                            />
                            <ActionBtn 
                              onClick={() => handleDelete(inv.id)}
                              loading={deletingId === inv.id}
                              icon={<Trash2 size={13} />} 
                              color="hover:text-rose-600 hover:bg-rose-50/50 hover:border-rose-100" 
                              title="Delete Invoice"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            /* Premium Grid / Card Layout View */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {paginatedInvoices.map((inv) => (
                <motion.div
                  whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)' }}
                  onClick={() => setSelectedInvoice(inv)}
                  key={inv.id}
                  className="bg-white border border-hairline p-6 rounded text-left flex flex-col justify-between h-70 cursor-pointer transition-all relative overflow-hidden group hover:border-slate-300"
                >
                  {/* Accent edge */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: inv.customization?.primaryColor || '#1e3a2f' }}
                  ></div>

                  {/* Header Details */}
                  <div className="flex justify-between items-start mt-2">
                    <span className="font-mono text-[10px] text-grey bg-slate-50 border border-hairline px-2 py-0.5 rounded-sm tnum">
                      #{inv.invoiceNo}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(inv.id!, inv.status);
                      }}
                      className={`px-3 py-1 rounded-sm text-[10px] font-semibold uppercase tracking-wide border transition-colors cursor-pointer ${
                        inv.status === 'paid' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100/40 hover:bg-emerald-100/30' 
                          : 'bg-amber-50 text-amber-600 border-amber-100/40 hover:bg-amber-100/30'
                      }`}
                    >
                      {inv.status}
                    </button>
                  </div>

                  {/* Client Details */}
                  <div className="my-4 space-y-1">
                    <h3 className="text-base font-semibold text-ink group-hover:text-accent transition-colors truncate">{inv.clientName}</h3>
                    <p className="text-grey text-xs truncate">{inv.clientEmail || 'No email address'}</p>
                    <div className="flex items-center gap-4 pt-2 text-[11px] text-grey tnum">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {inv.date}</span>
                    </div>
                  </div>

                  {/* Divider line */}
                  <div className="border-t border-slate-100 my-2"></div>

                  {/* Bottom Stats & Trigger */}
                  <div className="flex justify-between items-center" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] uppercase tracking-wide text-grey font-semibold">Total amount</span>
                      <span className="text-lg font-semibold text-ink leading-none mt-1 tnum">
                        {formatCurrencyValue(inv.totalAmount, inv.currency)}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      {/* Hidden work area for PDF compilation */}
                      <div className="fixed -left-2499.75 top-0 pointer-events-none select-none" aria-hidden="true">
                        <div id={`pdf-worker-${inv.id}`} className="bg-white pdf-container" style={{ width: '794px', minWidth: '794px' }}>
                          <InvoiceLayout data={inv} businessData={businessData} />
                        </div>
                      </div>

                      <ActionBtn 
                        onClick={() => setSelectedInvoice(inv)}
                        icon={<Eye size={12} />} 
                        color="hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-100" 
                        title="Preview"
                      />
                      <ActionBtn 
                        onClick={() => handleDownload(inv)}
                        loading={downloadingId === inv.id}
                        icon={<Download size={12} />} 
                        color="hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-100" 
                        title="Download PDF"
                      />
                      <ActionBtn 
                        onClick={() => navigate(`/dashboard/create?edit=${inv.id}`)}
                        icon={<Edit2 size={12} />} 
                        color="hover:text-amber-600 hover:bg-amber-50/50 hover:border-amber-100" 
                        title="Edit"
                      />
                      <ActionBtn 
                        onClick={() => handleDelete(inv.id)}
                        loading={deletingId === inv.id}
                        icon={<Trash2 size={12} />} 
                        color="hover:text-rose-600 hover:bg-rose-50/50 hover:border-rose-100" 
                        title="Delete"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty State visual */}
          {filteredAndSortedInvoices.length === 0 && (
            <div className="py-24 text-center flex flex-col items-center bg-white border border-hairline rounded">
              <div className="bg-slate-100 text-slate-300 p-5 rounded-full mb-4">
                <Search size={30} />
              </div>
              <p className="text-ink font-medium text-sm">No invoices found</p>
              <p className="text-xs text-grey mt-1 max-w-xs">Try adjusting your filters or search keywords.</p>
            </div>
          )}

          {/* Pagination Footer Controls */}
          {filteredAndSortedInvoices.length > itemsPerPage && (
            <div className="flex justify-between items-center pt-4">
              <div className="text-xs font-bold text-slate-500">
                Showing <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="text-slate-800">
                  {Math.min(currentPage * itemsPerPage, filteredAndSortedInvoices.length)}
                </span>{' '}
                of <span className="text-slate-800">{filteredAndSortedInvoices.length}</span> invoices
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`w-9 h-9 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      currentPage === pg
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Side-Over Full Preview Drawer */}
      <AnimatePresence>
        {selectedInvoice && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoice(null)}
              className="fixed inset-0 bg-slate-900 z-40 backdrop-blur-sm cursor-pointer"
            ></motion.div>

            {/* Sliding Drawer Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-4xl bg-paper border-l border-hairline shadow-xl shadow-black/5 z-50 overflow-hidden flex flex-col"
            >
              {/* Header Action Bar */}
              <div className="bg-surface border-b border-hairline p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink-soft bg-paper border border-hairline px-2.5 py-1 rounded-sm tnum">
                    #{selectedInvoice.invoiceNo}
                  </span>
                  <button
                    onClick={() => toggleStatus(selectedInvoice.id!, selectedInvoice.status)}
                    className={`px-3 py-1 rounded-sm text-[10px] font-semibold uppercase tracking-wide border transition-colors cursor-pointer ${
                      selectedInvoice.status === 'paid' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100/40 hover:bg-emerald-100/30' 
                        : 'bg-amber-50 text-amber-600 border-amber-100/40 hover:bg-amber-100/30'
                    }`}
                  >
                    {selectedInvoice.status}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <ActionBtn 
                    onClick={() => handleDownload(selectedInvoice)}
                    loading={downloadingId === selectedInvoice.id}
                    icon={<Download size={14} />} 
                    color="hover:text-blue-600 hover:bg-blue-50/50 hover:border-blue-100" 
                    title="Download PDF"
                  />
                  <ActionBtn 
                    onClick={() => handlePrint(selectedInvoice)}
                    icon={<Printer size={14} />} 
                    color="hover:text-slate-600 hover:bg-slate-50 hover:border-slate-200" 
                    title="Print A4"
                  />
                  <ActionBtn 
                    onClick={() => navigate(`/dashboard/create?edit=${selectedInvoice.id}`)}
                    icon={<Edit2 size={14} />} 
                    color="hover:text-amber-600 hover:bg-amber-50/50 hover:border-amber-100" 
                    title="Edit Invoice"
                  />
                  <ActionBtn 
                    onClick={() => handleShareWhatsApp(selectedInvoice)}
                    icon={<MessageCircle size={14} />} 
                    color="hover:text-emerald-600 hover:bg-emerald-50/50 hover:border-emerald-100" 
                    title="WhatsApp Share"
                  />
                  <ActionBtn 
                    onClick={() => handleShareEmail(selectedInvoice)}
                    icon={<Mail size={14} />} 
                    color="hover:text-violet-600 hover:bg-violet-50/50 hover:border-violet-100" 
                    title="Email Client"
                  />
                  {selectedInvoice.status === 'unpaid' && (
                    <ActionBtn 
                      onClick={() => handleSendReminder(selectedInvoice)}
                      loading={remindingId === selectedInvoice.id}
                      icon={<Bell size={14} />} 
                      color="hover:text-orange-600 hover:bg-orange-50/50 hover:border-orange-100" 
                      title={selectedInvoice.lastReminderSentAt ? `Last reminder sent: ${new Date(selectedInvoice.lastReminderSentAt).toLocaleDateString()}` : "Send Reminder Email"}
                    />
                  )}
                  <ActionBtn 
                    onClick={() => handleDelete(selectedInvoice.id)}
                    loading={deletingId === selectedInvoice.id}
                    icon={<Trash2 size={14} />} 
                    color="hover:text-rose-600 hover:bg-rose-50/50 hover:border-rose-100" 
                    title="Delete Invoice"
                  />
                  <div className="h-6 w-px bg-slate-200 mx-2"></div>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    title="Close Panel"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable Canvas area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-12 flex justify-center custom-scrollbar">
                <div className="w-full max-w-3xl flex justify-center">
                  <InvoicePreviewWrapper>
                    <InvoiceLayout data={selectedInvoice} businessData={businessData} />
                  </InvoicePreviewWrapper>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Skeletons
const TableRowSkeleton = () => (
  <>
    {[1, 2, 3].map((n) => (
      <tr key={n} className="animate-pulse border-b border-slate-100">
        <td className="px-8 py-5">
          <div className="h-4.5 bg-slate-200 rounded-lg w-16"></div>
        </td>
        <td className="px-8 py-5">
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded-lg w-40"></div>
            <div className="h-3 bg-slate-100 rounded-lg w-28"></div>
          </div>
        </td>
        <td className="px-8 py-5">
          <div className="h-4 bg-slate-200 rounded-lg w-20"></div>
        </td>
        <td className="px-8 py-5">
          <div className="h-4 bg-slate-200 rounded-lg w-16"></div>
        </td>
        <td className="px-8 py-5">
          <div className="h-6.5 bg-slate-200 rounded-xl w-14"></div>
        </td>
        <td className="px-8 py-5">
          <div className="flex justify-end gap-2.5">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="h-9 w-9 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </td>
      </tr>
    ))}
  </>
);

const GridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3].map((n) => (
      <div key={n} className="animate-pulse bg-surface border border-hairline p-6 rounded h-70 flex flex-col justify-between text-left">
        <div className="flex justify-between items-start">
          <div className="h-6.5 bg-slate-200 rounded-xl w-16"></div>
          <div className="h-6.5 bg-slate-200 rounded-xl w-14"></div>
        </div>
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 rounded-lg w-3/4"></div>
          <div className="h-3.5 bg-slate-100 rounded-lg w-1/2"></div>
          <div className="h-3.5 bg-slate-100 rounded-lg w-1/3"></div>
        </div>
        <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
          <div className="space-y-1">
            <div className="h-3 bg-slate-100 rounded-lg w-14"></div>
            <div className="h-5 bg-slate-200 rounded-lg w-24"></div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="w-9 h-9 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    ))}
  </div>
);

interface ActionBtnProps {
  onClick: () => void;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  title?: string;
}

const ActionBtn = ({ onClick, icon, color, loading, title }: ActionBtnProps) => (
  <motion.button 
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.92 }}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }} 
    title={title}
    disabled={loading}
    className={`p-2.5 bg-surface text-slate-400 rounded-sm border border-hairline transition-colors cursor-pointer flex items-center justify-center ${color} ${loading ? 'animate-pulse' : ''}`}
  >
    {loading ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : icon}
  </motion.button>
);

export default History;
