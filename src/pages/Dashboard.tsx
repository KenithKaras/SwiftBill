import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { invoiceService } from '../services/invoiceService';
import { InvoiceData } from '../types/invoice';
import {
  FileText,
  CheckCircle2,
  Clock,
  Receipt,
  FilePlus,
  AlertCircle,
  Bell,
  RefreshCw
} from 'lucide-react';
import { formatCurrencyValue } from '../lib/financial';
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
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  format,
  subDays,
  subMonths,
  isSameDay,
  differenceInMonths
} from 'date-fns';

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

const parseInvoiceDate = (dateStr: string): Date => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return new Date(year, month - 1, day);
    }
  } catch (e) {
    // fallback
  }
  return new Date(dateStr);
};

const getChartData = (invoices: InvoiceData[], timeframe: '30days' | '6months' | 'year' | 'all') => {
  const now = new Date();
  let labels: string[] = [];
  let totalData: number[] = [];
  let paidData: number[] = [];
  let pendingData: number[] = [];

  const parsedInvoices = invoices.map(inv => ({
    ...inv,
    parsedDate: parseInvoiceDate(inv.date)
  }));

  if (timeframe === '30days') {
    for (let i = 29; i >= 0; i--) {
      const d = subDays(now, i);
      const label = format(d, 'MMM dd');
      labels.push(label);

      let total = 0;
      let paid = 0;
      let pending = 0;

      parsedInvoices.forEach(inv => {
        if (isSameDay(inv.parsedDate, d)) {
          total += inv.totalAmount;
          if (inv.status === 'paid') {
            paid += inv.totalAmount;
          } else {
            pending += inv.totalAmount;
          }
        }
      });

      totalData.push(total);
      paidData.push(paid);
      pendingData.push(pending);
    }
  } else if (timeframe === '6months') {
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const label = format(d, 'MMM yyyy');
      labels.push(label);

      let total = 0;
      let paid = 0;
      let pending = 0;

      parsedInvoices.forEach(inv => {
        if (inv.parsedDate.getMonth() === d.getMonth() && inv.parsedDate.getFullYear() === d.getFullYear()) {
          total += inv.totalAmount;
          if (inv.status === 'paid') {
            paid += inv.totalAmount;
          } else {
            pending += inv.totalAmount;
          }
        }
      });

      totalData.push(total);
      paidData.push(paid);
      pendingData.push(pending);
    }
  } else if (timeframe === 'year') {
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const label = format(d, 'MMM yyyy');
      labels.push(label);

      let total = 0;
      let paid = 0;
      let pending = 0;

      parsedInvoices.forEach(inv => {
        if (inv.parsedDate.getMonth() === d.getMonth() && inv.parsedDate.getFullYear() === d.getFullYear()) {
          total += inv.totalAmount;
          if (inv.status === 'paid') {
            paid += inv.totalAmount;
          } else {
            pending += inv.totalAmount;
          }
        }
      });

      totalData.push(total);
      paidData.push(paid);
      pendingData.push(pending);
    }
  } else {
    if (parsedInvoices.length === 0) {
      labels = ['No Data'];
      totalData = [0];
      paidData = [0];
      pendingData = [0];
    } else {
      let oldestDate = now;
      parsedInvoices.forEach(inv => {
        if (inv.parsedDate < oldestDate) {
          oldestDate = inv.parsedDate;
        }
      });

      const monthsDiff = differenceInMonths(now, oldestDate);

      if (monthsDiff <= 1) {
        return getChartData(invoices, '30days');
      } else if (monthsDiff <= 24) {
        for (let i = monthsDiff; i >= 0; i--) {
          const d = subMonths(now, i);
          const label = format(d, 'MMM yyyy');
          labels.push(label);

          let total = 0;
          let paid = 0;
          let pending = 0;

          parsedInvoices.forEach(inv => {
            if (inv.parsedDate.getMonth() === d.getMonth() && inv.parsedDate.getFullYear() === d.getFullYear()) {
              total += inv.totalAmount;
              if (inv.status === 'paid') {
                paid += inv.totalAmount;
              } else {
                pending += inv.totalAmount;
              }
            }
          });

          totalData.push(total);
          paidData.push(paid);
          pendingData.push(pending);
        }
      } else {
        const startYear = oldestDate.getFullYear();
        const endYear = now.getFullYear();

        for (let year = startYear; year <= endYear; year++) {
          labels.push(String(year));

          let total = 0;
          let paid = 0;
          let pending = 0;

          parsedInvoices.forEach(inv => {
            if (inv.parsedDate.getFullYear() === year) {
              total += inv.totalAmount;
              if (inv.status === 'paid') {
                paid += inv.totalAmount;
              } else {
                pending += inv.totalAmount;
              }
            }
          });

          totalData.push(total);
          paidData.push(paid);
          pendingData.push(pending);
        }
      }
    }
  }

  return { labels, totalData, paidData, pendingData };
};

const Dashboard = () => {
  const { user, businessData } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'30days' | '6months' | 'year' | 'all'>('6months');
  const navigate = useNavigate();

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchUserId = user.id;
    setLoading(true);
    try {
      const data = await invoiceService.getUserInvoices(fetchUserId);
      if (user?.id === fetchUserId) {
        setInvoices(data);
      }
    } catch (err: any) {
      console.error("Dashboard data load failed", err);
    } finally {
      if (user?.id === fetchUserId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();

    if (!user) return;

    const channel = supabase
      .channel('dashboard-invoices-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSendReminder = async (invoice: InvoiceData) => {
    if (!invoice.id) return;
    setRemindingId(invoice.id);
    try {
      const response = await invoiceService.sendReminder(invoice);
      if (response.success) {
        alert(`Reminder noted for ${invoice.clientName}.`);
        loadData();
      } else {
        alert(response.error || "Couldn't record the reminder.");
      }
    } catch (err) {
      alert("Something went wrong while recording the reminder.");
    } finally {
      setRemindingId(null);
    }
  };

  const preferredCurrency = invoices.length > 0 ? invoices[0].currency || 'USD' : 'USD';
  const formatVal = (val: number) => {
    return formatCurrencyValue(val, preferredCurrency);
  };

  const stats = {
    totalRevenue: invoices.reduce((sum, inv) => sum + (inv.status === 'paid' ? inv.totalAmount : 0), 0),
    totalInvoices: invoices.length,
    paidCount: invoices.filter(inv => inv.status === 'paid').length,
    pendingCount: invoices.filter(inv => inv.status === 'unpaid').length,
    pendingAmount: invoices.reduce((sum, inv) => sum + (inv.status === 'unpaid' ? inv.totalAmount : 0), 0)
  };
  const paymentRate = stats.totalInvoices ? Math.round((stats.paidCount / stats.totalInvoices) * 100) : 0;

  const priorityInvoices = invoices.filter(inv => {
    if (inv.status === 'paid') return false;
    const dueDate = new Date(inv.dueDate);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const chartData = getChartData(invoices, timePeriod);

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
        backgroundColor: '#121212',
        titleColor: '#fafaf8',
        bodyColor: '#cfcfc9',
        titleFont: { size: 12, weight: 'bold' as const, family: "'Space Grotesk', sans-serif" },
        bodyFont: { size: 12, family: "'Space Mono', monospace" },
        padding: 12,
        borderColor: '#373734',
        borderWidth: 1,
        cornerRadius: 4,
        displayColors: true,
        callbacks: {
          label: (context: any) => `${context.dataset.label}: ${formatVal(context.parsed.y)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#e6e6e2', drawBorder: false },
        ticks: { color: '#8a8a8a', font: { size: 10, family: "'Space Mono', monospace" }, callback: (v: any) => `${v >= 1000 ? (v/1000).toFixed(1) + 'k' : v}` }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#8a8a8a', font: { size: 10 }, maxTicksLimit: 8 }
      }
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const item = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 380, damping: 30 } }
  };

  if (loading) return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-10 w-64 bg-slate-100 rounded"></div>
      <div className="h-36 bg-slate-100 rounded border border-hairline"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-slate-100 rounded border border-hairline"></div>
        <div className="h-96 bg-slate-100 rounded border border-hairline"></div>
      </div>
    </div>
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-350"
    >
      {invoices.length === 0 ? (
        <motion.div variants={item} className="bg-surface border border-hairline rounded p-16 text-center flex flex-col items-center">
          <div className="bg-ink text-paper w-16 h-16 rounded flex items-center justify-center mb-8">
            <Receipt size={30} />
          </div>
          <h2 className="font-display text-3xl font-semibold text-ink mb-3 tracking-tight">Create your first invoice</h2>
          <p className="text-grey mb-8 max-w-sm leading-relaxed text-sm">Welcome to SwiftBill. Issue custom, branded PDF invoices and track every payment in one place.</p>
          <button
            onClick={() => navigate('/dashboard/create')}
            className="bg-ink text-paper px-6 py-3 rounded font-semibold text-sm hover:bg-accent transition-colors inline-flex items-center gap-2"
          >
            <FilePlus size={17} /> Create first invoice
          </button>
        </motion.div>
      ) : (
        <>
          {/* Page header */}
          <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold text-grey uppercase tracking-[0.18em] mb-2">Overview</p>
              <h1 className="font-display text-3xl font-semibold text-ink tracking-tight leading-none">
                Hello, {user?.email?.split('@')[0]}
              </h1>
              <p className="text-grey text-sm mt-2.5">
                A summary of {businessData?.businessName || 'your business'} finances and what needs attention.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/create')}
              className="bg-ink text-paper hover:bg-accent px-5 py-2.5 rounded font-semibold text-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
            >
              <FilePlus size={16} /> New invoice
            </button>
          </motion.div>

          {/* Hero stat band — oversized tabular figures on a strict hairline grid */}
          <motion.div variants={item} className="bg-surface border border-hairline rounded grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-hairline overflow-hidden">
            <StatColumn
              label="Total revenue"
              value={formatVal(stats.totalRevenue)}
              sub={`${stats.paidCount} invoice${stats.paidCount === 1 ? '' : 's'} paid`}
            />
            <StatColumn
              label="Invoices sent"
              value={stats.totalInvoices.toString()}
              sub={`${stats.pendingCount} awaiting payment`}
            />
            <StatColumn
              label="Payment rate"
              value={`${paymentRate}%`}
              sub={`${stats.paidCount} of ${stats.totalInvoices} settled`}
            />
            <StatColumn
              label="Outstanding"
              value={formatVal(stats.pendingAmount)}
              sub={stats.pendingCount ? 'awaiting collection' : 'nothing due'}
              tone={stats.pendingAmount > 0 ? 'negative' : 'default'}
            />
          </motion.div>

          {/* Urgent actions */}
          {priorityInvoices.length > 0 && (
            <motion.div variants={item} className="bg-surface border border-hairline rounded p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="text-amber-600" size={18} />
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink">Needs attention</h3>
                    <p className="text-[12px] text-grey mt-0.5">Due within a week or already overdue</p>
                  </div>
                </div>
                <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-sm text-[10px] font-semibold uppercase tracking-wider tnum">
                  {priorityInvoices.length} open
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {priorityInvoices.slice(0, 3).map((inv) => {
                    const isOverdue = new Date(inv.dueDate) < new Date();
                    return (
                      <motion.div
                        key={inv.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="border border-hairline rounded p-4 relative"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[11px] font-medium text-grey tnum">#{inv.invoiceNo}</span>
                              {isOverdue && (
                                <span className="bg-negative text-white px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider">
                                  Overdue
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-ink truncate max-w-40 text-sm">{inv.clientName}</h4>
                          </div>
                          <p className="text-sm font-semibold text-ink tnum">{formatCurrencyValue(inv.totalAmount, inv.currency)}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] text-grey tnum">
                            <Clock size={12} />
                            Due {new Date(inv.dueDate).toLocaleDateString()}
                          </div>
                          <button
                            onClick={() => handleSendReminder(inv)}
                            disabled={remindingId === inv.id}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-semibold transition-colors ${
                              remindingId === inv.id
                                ? 'bg-slate-100 text-grey cursor-not-allowed'
                                : 'bg-ink text-paper hover:bg-accent'
                            }`}
                          >
                            {remindingId === inv.id ? (
                              <RefreshCw size={11} className="animate-spin" />
                            ) : (
                              <Bell size={11} />
                            )}
                            {remindingId === inv.id ? 'Saving' : 'Remind'}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Chart + recent activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={item} className="lg:col-span-2 bg-surface rounded border border-hairline p-6 sm:p-7 min-h-115 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink tracking-tight">Revenue analytics</h3>
                  <p className="text-[12px] text-grey mt-0.5">Billed, collected and outstanding over time</p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium mt-3 text-grey">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-ink"></span>Billed</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-positive"></span>Collected</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-amber-500"></span>Outstanding</span>
                  </div>
                </div>

                <select
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value as any)}
                  className="bg-paper border border-hairline rounded px-3 py-2 text-[13px] font-medium text-ink focus:outline-none focus:border-accent transition-colors cursor-pointer w-full sm:w-auto"
                >
                  <option value="30days">Last 30 days</option>
                  <option value="6months">Last 6 months</option>
                  <option value="year">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>
              <div className="flex-1 min-h-72.5">
                <Line data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      label: 'Billed',
                      data: chartData.totalData,
                      fill: true,
                      borderColor: '#121212',
                      borderWidth: 2,
                      pointBackgroundColor: '#ffffff',
                      pointBorderColor: '#121212',
                      pointBorderWidth: 1.5,
                      pointRadius: 2.5,
                      pointHoverRadius: 5,
                      backgroundColor: (context: ScriptableContext<'line'>) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(18, 18, 18, 0.06)');
                        gradient.addColorStop(1, 'rgba(18, 18, 18, 0)');
                        return gradient;
                      },
                      tension: 0.3,
                    },
                    {
                      label: 'Collected',
                      data: chartData.paidData,
                      fill: false,
                      borderColor: '#2f6f53',
                      borderWidth: 2,
                      pointBackgroundColor: '#ffffff',
                      pointBorderColor: '#2f6f53',
                      pointBorderWidth: 1.5,
                      pointRadius: 2.5,
                      pointHoverRadius: 5,
                      tension: 0.3,
                    },
                    {
                      label: 'Outstanding',
                      data: chartData.pendingData,
                      fill: false,
                      borderColor: '#b1852f',
                      borderWidth: 2,
                      borderDash: [4, 3],
                      pointBackgroundColor: '#ffffff',
                      pointBorderColor: '#b1852f',
                      pointBorderWidth: 1.5,
                      pointRadius: 2.5,
                      pointHoverRadius: 5,
                      tension: 0.3,
                    }
                  ]
                }} options={chartOptions as any} />
              </div>
            </motion.div>

            {/* Recent activity */}
            <motion.div variants={item} className="bg-surface rounded border border-hairline p-6 sm:p-7 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink tracking-tight">Recent activity</h3>
                  <p className="text-[12px] text-grey mt-0.5">Latest invoices created</p>
                </div>
                <FileText size={16} className="text-grey" />
              </div>

              <div className="flex-1 overflow-y-auto max-h-75 -mr-2 pr-2 custom-scrollbar divide-y divide-hairline">
                <AnimatePresence mode="popLayout">
                  {invoices.slice(0, 6).map((inv, i) => (
                    <motion.div
                      key={inv.id || i}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      onClick={() => navigate('/dashboard/history')}
                      className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-2 px-2 rounded cursor-pointer transition-colors group"
                    >
                      <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 ${
                        inv.status === 'paid'
                          ? 'bg-emerald-50 text-positive'
                          : 'bg-amber-50 text-amber-600'
                      }`}>
                        {inv.status === 'paid' ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-ink truncate">{inv.clientName}</p>
                        <p className="text-[11px] text-grey tnum mt-0.5">#{inv.invoiceNo} · {inv.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold text-ink tnum">{formatCurrencyValue(inv.totalAmount, inv.currency)}</p>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                          inv.status === 'paid' ? 'text-positive' : 'text-amber-600'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <button
                onClick={() => navigate('/dashboard/history')}
                className="mt-5 w-full py-2.5 text-[12px] font-semibold text-ink border border-hairline hover:border-ink rounded transition-colors"
              >
                View all invoices
              </button>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
};

interface StatColumnProps {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'negative';
}

const StatColumn = ({ label, value, sub, tone = 'default' }: StatColumnProps) => (
  <div className="p-6 sm:p-7">
    <p className="text-[11px] font-semibold text-grey uppercase tracking-[0.16em] mb-3">{label}</p>
    <p className={`font-display text-[28px] sm:text-[32px] font-semibold tracking-tight leading-none tnum ${
      tone === 'negative' ? 'text-negative' : 'text-ink'
    }`}>
      {value}
    </p>
    {sub && <p className="text-[12px] text-grey mt-2.5 tnum">{sub}</p>}
  </div>
);

export default Dashboard;
