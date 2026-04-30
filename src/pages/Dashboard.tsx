import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { invoiceService, InvoiceData } from '../services/invoiceService';
import { 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Receipt,
  FilePlus,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Bell,
  Mail,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  ScriptableContext
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'motion/react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const loadData = async () => {
    if (user) {
      setLoading(true);
      try {
        const data = await invoiceService.getUserInvoices(user.id);
        setInvoices(data);
      } catch (err: any) {
        // Log generic error message without exposing PII
        console.error("Dashboard data load failed");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSendReminder = async (invoice: InvoiceData) => {
    if (!invoice.id) return;
    setRemindingId(invoice.id);
    try {
      const response = await invoiceService.sendReminder(invoice);
      if (response.success) {
        alert(`Reminder tracked successfully`);
        loadData();
      } else {
        alert(response.error || "Failed to send reminder");
      }
    } catch (err) {
      alert("An unexpected error occurred during the reminder process.");
    } finally {
      setRemindingId(null);
    }
  };

  const stats = {
    totalRevenue: invoices.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.totalAmount : 0), 0),
    totalInvoices: invoices.length,
    paidCount: invoices.filter(inv => inv.status === 'paid').length,
    pendingAmount: invoices.reduce((sum, inv) => sum + (inv.status === 'unpaid' ? inv.totalAmount : 0), 0)
  };

  const priorityInvoices = invoices.filter(inv => {
    if (inv.status === 'paid') return false;
    const dueDate = new Date(inv.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7; // Due within 7 days or overdue
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#0f172a',
        bodyColor: '#64748b',
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
        padding: 16,
        borderColor: '#e2e8f0',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (context: any) => `Revenue: ${formatCurrency(context.parsed.y)}`
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v: any) => `${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}` }
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11, weight: '600' } }
      }
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  if (loading) return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse"></div>)}
      </div>
      <div className="h-96 bg-slate-50 rounded-3xl animate-pulse"></div>
    </div>
  );

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {invoices.length === 0 ? (
        <motion.div variants={item} className="bg-white border border-slate-200 rounded-[2.5rem] p-16 text-center shadow-lg shadow-slate-200/50">
          <div className="bg-blue-50 text-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
            <Receipt size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome to your Dashboard</h2>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">You haven't created any invoices yet. Start by generating your first invoice to see your analytics here.</p>
          <button 
            onClick={() => window.location.href = '/create'}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 inline-flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <FilePlus size={20} /> Create First Invoice
          </button>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              variants={item}
              icon={<TrendingUp size={20} />} 
              label="Total Revenue" 
              value={formatCurrency(stats.totalRevenue)} 
              trend="+12.5%" 
              trendLabel="vs last month"
              isPositive={true}
            />
            <StatCard 
              variants={item}
              icon={<FileText size={20} />} 
              label="Invoices Sent" 
              value={stats.totalInvoices.toString()} 
              trend={`${invoices.filter(i => i.status === 'unpaid').length}`}
              trendLabel="pending"
              isPositive={false}
              iconBg="bg-blue-50 text-blue-600"
            />
            <StatCard 
              variants={item}
              icon={<CheckCircle2 size={20} />} 
              label="Payment Rate" 
              value={`${Math.round((stats.paidCount / stats.totalInvoices) * 100)}%`} 
              trend={`${stats.paidCount}`}
              trendLabel="settled"
              isPositive={true}
              iconBg="bg-emerald-50 text-emerald-600"
            />
            <StatCard 
              variants={item}
              icon={<Clock size={20} />} 
              label="Outstanding" 
              value={formatCurrency(stats.pendingAmount)} 
              trend="Due soon"
              isPositive={null}
              iconBg="bg-rose-50 text-rose-600"
              valueColor="text-rose-600"
            />
          </div>

          {priorityInvoices.length > 0 && (
            <motion.div variants={item} className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                    <AlertCircle className="text-orange-600" size={20} />
                    Priority Actions
                  </h3>
                  <p className="text-xs text-orange-700 font-medium">Invoices due soon or overdue</p>
                </div>
                <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {priorityInvoices.length} Urgent
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {priorityInvoices.slice(0, 3).map((inv) => {
                    const isOverdue = new Date(inv.dueDate) < new Date();
                    return (
                      <motion.div 
                        key={inv.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white border border-orange-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                      >
                        {isOverdue && (
                          <div className="absolute top-0 right-0 bg-rose-500 text-white px-2 py-0.5 rounded-bl-lg text-[8px] font-black uppercase tracking-widest">
                            Overdue
                          </div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">{inv.invoiceNo}</p>
                            <h4 className="font-bold text-slate-800 truncate max-w-[150px]">{inv.clientName}</h4>
                          </div>
                          <p className="text-sm font-black text-slate-900">{formatCurrency(inv.totalAmount)}</p>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                            <Clock size={12} />
                            Due {new Date(inv.dueDate).toLocaleDateString()}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSendReminder(inv)}
                            disabled={remindingId === inv.id}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              remindingId === inv.id 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-200'
                            }`}
                          >
                            {remindingId === inv.id ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <Bell size={12} />
                            )}
                            {remindingId === inv.id ? 'Sending...' : 'Remind'}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={item} className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 min-h-[450px] flex flex-col shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Revenue Growth</h3>
                  <p className="text-xs text-slate-400 font-medium">Performance over time</p>
                </div>
                <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all">
                  <option>Last 6 Months</option>
                  <option>Last Year</option>
                </select>
              </div>
              <div className="flex-1 min-h-[300px]">
                <Line data={{
                  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  datasets: [{
                    label: 'Revenue',
                    data: [stats.totalRevenue * 0.1, stats.totalRevenue * 0.3, stats.totalRevenue * 0.2, stats.totalRevenue * 0.6, stats.totalRevenue * 0.8, stats.totalRevenue],
                    fill: true,
                    borderColor: '#2563eb',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    backgroundColor: (context: ScriptableContext<'line'>) => {
                      const ctx = context.chart.ctx;
                      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                      gradient.addColorStop(0, 'rgba(37, 99, 235, 0.1)');
                      gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
                      return gradient;
                    },
                    tension: 0.45,
                  }]
                }} options={chartOptions as any} />
              </div>
            </motion.div>

            <motion.div variants={item} className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-slate-800">Recent Transactions</h3>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <FileText size={16} />
                </div>
              </div>
              <div className="space-y-6 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {invoices.slice(0, 8).map((inv, i) => (
                    <motion.div 
                      key={inv.id || i} 
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-500 font-bold' : 'bg-amber-50 text-amber-500 font-bold'}`}>
                        {inv.status === 'paid' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{inv.clientName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">#{inv.invoiceNo} • {inv.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-800">{formatCurrency(inv.totalAmount)}</p>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                          {inv.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/history'}
                className="mt-8 w-full py-4 text-xs font-black uppercase tracking-widest text-blue-600 bg-blue-50/50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all duration-300"
              >
                Full Audit Trail
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
  trendLabel?: string;
  isPositive?: boolean | null;
  iconBg?: string;
  valueColor?: string;
  variants?: any;
}

const StatCard = ({ icon, label, value, trend, trendLabel, isPositive, iconBg, valueColor, variants }: StatCardProps) => (
  <motion.div 
    variants={variants}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-2xl hover:shadow-slate-200/50 group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:bg-blue-50 transition-colors duration-500"></div>
    <div className={`relative w-12 h-12 rounded-2xl ${iconBg || 'bg-slate-50 text-slate-600'} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
      {icon}
    </div>
    <div className="relative">
      <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mb-1">{label}</p>
      <h3 className={`text-2xl font-black ${valueColor || 'text-slate-900'}`}>{value}</h3>
      {trend && (
        <div className={`mt-3 flex items-center gap-1.5`}>
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
            isPositive === true ? 'bg-emerald-50 text-emerald-600' : 
            isPositive === false ? 'bg-amber-50 text-amber-600' : 
            'bg-slate-50 text-slate-400'
          }`}>
            {isPositive === true && <ArrowUpRight size={10} />}
            {isPositive === false && <ArrowDownRight size={10} />}
            {trend}
          </div>
          <span className="text-[10px] text-slate-400 font-bold">{trendLabel}</span>
        </div>
      )}
    </div>
  </motion.div>
);

export default Dashboard;
