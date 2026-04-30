import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { invoiceService, InvoiceData } from '../services/invoiceService';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Share2, 
  Eye, 
  Trash2,
  Mail,
  MessageCircle,
  Download,
  Clock,
  RefreshCw,
  Bell
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';
import { InvoiceLayout } from '../components/InvoiceLayout';

import { motion, AnimatePresence } from 'motion/react';

const History = () => {
  const { user, businessData } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [showPermissionHint, setShowPermissionHint] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const fetchInvoices = async () => {
    if (user) {
      setLoading(true);
      try {
        const data = await invoiceService.getUserInvoices(user.id);
        setInvoices(data);
        setFilteredInvoices(data);
        setLastError(null);
      } catch (err: any) {
        console.error("Error fetching invoices:", err);
        setLastError(err.message || "Failed to fetch invoices");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const handleSendReminder = async (invoice: InvoiceData) => {
    if (!invoice.id) return;
    setRemindingId(invoice.id);
    try {
      const response = await invoiceService.sendReminder(invoice);
      if (response.success) {
        alert(`Reminder successfully tracked for ${invoice.clientName}`);
        fetchInvoices();
      } else {
        alert(`Could not send reminder: ${response.error}`);
      }
    } catch (err) {
      alert("Failed to send reminder due to a technical error.");
    } finally {
      setRemindingId(null);
    }
  };

  useEffect(() => {
    let result = invoices;
    if (filter !== 'all') {
      result = result.filter(inv => inv.status === filter);
    }
    if (search) {
      result = result.filter(inv => 
        inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
        inv.invoiceNo.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredInvoices(result);
  }, [filter, search, invoices]);

  const handleDelete = async (id: string | undefined) => {
    if (!id) {
      alert("Error: This invoice doesn't have a valid ID. Try refreshing the page.");
      return;
    }

    setDeletingId(id);
    try {
      const count = await invoiceService.deleteInvoice(id);
      
      if (count === 0) {
        setLastError("The database accepted the request but nothing was deleted. This almost always means a missing 'DELETE' policy in Supabase RLS.");
        setShowPermissionHint(true);
      } else {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        setShowPermissionHint(false); 
        setLastError(null);
      }
    } catch (err: any) {
      setLastError(err.message || "A network or database error occurred.");
      setShowPermissionHint(true);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (inv: InvoiceData) => {
    setDownloadingId(inv.id || null);
    
    // Wait for the hidden preview to be rendered
    setTimeout(() => {
      const element = document.getElementById(`pdf-worker-${inv.id}`);
      if (!element) {
        setDownloadingId(null);
        return;
      }

      const opt = {
        margin: 0,
        filename: `Invoice_${inv.invoiceNo}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
      };

      html2pdf().from(element).set(opt).save().then(() => {
        setDownloadingId(null);
      });
    }, 500);
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === 'paid' ? 'unpaid' : 'paid';
    await invoiceService.updateInvoice(id, { status: next as any });
    fetchInvoices();
  };

  const handleShareWhatsApp = (inv: InvoiceData) => {
    const text = `Hi ${inv.clientName}, your invoice ${inv.invoiceNo} for ${formatCurrency(inv.totalAmount)} is ready. Please review it.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const handleShareEmail = (inv: InvoiceData) => {
    const subject = `Invoice ${inv.invoiceNo} from SwiftBill`;
    const body = `Hi ${inv.clientName},\n\nPlease find your invoice ${inv.invoiceNo} attached. Total amount: ${formatCurrency(inv.totalAmount)}.\n\nThank you!`;
    window.open(`mailto:${inv.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="space-y-8 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoice History</h1>
          <p className="text-slate-500 mt-1">Review and manage all your generated invoices.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchInvoices}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            title="Refresh Invoices"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </motion.button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all w-64"
            />
          </div>
          <select 
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none hover:border-blue-200 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPermissionHint && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 border border-amber-100 rounded-2xl p-6 relative overflow-hidden group mb-6"
          >
            <div className="absolute top-0 right-0 p-4 text-amber-200 group-hover:text-amber-300 transition-colors">
              <Eye size={40} />
            </div>
            <div className="relative z-10 space-y-3">
              <h4 className="font-bold text-amber-800 flex items-center gap-2">
                <Trash2 size={18} /> Deletion Failed? Check Permissions
              </h4>
              {lastError && (
                <div className="bg-red-100/50 text-red-800 p-3 rounded-xl text-xs font-bold border border-red-200">
                  Current Error: {lastError}
                </div>
              )}
              <p className="text-sm text-amber-700 leading-relaxed max-w-2xl">
                It looks like the server rejected your request. This is usually due to <b>Supabase Row Level Security (RLS)</b>. 
                Ensure you have a policy that allows <b>DELETE</b> for your own user ID.
              </p>
              <div className="bg-white/50 rounded-xl p-4 font-mono text-[11px] text-amber-900 border border-amber-100 select-all">
                DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;
                CREATE POLICY "Users can delete their own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id);
              </div>
              <button 
                onClick={() => setShowPermissionHint(false)}
                className="text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors underline"
              >
                Dismiss this help box
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Inv No</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredInvoices.map((inv) => (
                  <motion.tr 
                    layout
                    key={inv.id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-8 py-6 font-mono text-[10px] font-black text-slate-900">
                      <span className="bg-slate-100 px-2 py-1 rounded-lg">#{inv.invoiceNo}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800">{inv.clientName}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{inv.clientEmail}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-xs text-slate-500 font-bold">
                      {inv.date}
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-slate-800">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="px-8 py-6">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleStatus(inv.id!, inv.status)}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm ${
                          inv.status === 'paid' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}
                      >
                        {inv.status}
                      </motion.button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-3 translate-x-4">
                        {/* Hidden work area for PDF generation */}
                        <div className="fixed left-[-9999px] top-0">
                          <div id={`pdf-worker-${inv.id}`} className="bg-white">
                            <InvoiceLayout data={inv} businessData={businessData} />
                          </div>
                        </div>

                         <ActionBtn 
                          onClick={() => handleDownload(inv)}
                          loading={downloadingId === inv.id}
                          icon={<Download size={14} />} 
                          color="hover:text-blue-600" 
                        />
                        <ActionBtn 
                          onClick={() => handleShareWhatsApp(inv)}
                          icon={<MessageCircle size={14} />} 
                          color="hover:text-emerald-500" 
                        />
                        <ActionBtn 
                          onClick={() => handleShareEmail(inv)}
                          icon={<Mail size={14} />} 
                          color="hover:text-accent" 
                        />
                        {inv.status === 'unpaid' && (
                          <ActionBtn 
                            onClick={() => handleSendReminder(inv)}
                            loading={remindingId === inv.id}
                            icon={<Bell size={14} />} 
                            color="hover:text-orange-500" 
                            title={inv.lastReminderSentAt ? `Last sent: ${new Date(inv.lastReminderSentAt).toLocaleDateString()}` : "Send Reminder"}
                          />
                        )}
                        <ActionBtn 
                          onClick={() => handleDelete(inv.id)}
                          loading={deletingId === inv.id}
                          icon={<Trash2 size={14} />} 
                          color="hover:text-rose-500" 
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredInvoices.length === 0 && !loading && (
          <div className="py-24 text-center">
            <Search className="mx-auto text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-bold tracking-tight italic">No invoices found matching your criteria</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

interface ActionBtnProps {
  onClick: () => void;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  title?: string;
}

const ActionBtn = ({ onClick, icon, color, loading, title }: ActionBtnProps) => (
  <motion.button 
    whileHover={{ scale: 1.15 }}
    whileTap={{ scale: 0.9 }}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }} 
    title={title}
    disabled={loading}
    className={`p-3 bg-white text-slate-400 ${color} rounded-xl border border-slate-100 shadow-sm transition-all cursor-pointer ${loading ? 'animate-pulse' : ''}`}
  >
    {loading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : icon}
  </motion.button>
);

export default History;
