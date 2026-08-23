import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, AlertCircle, Settings, LogOut } from 'lucide-react';
import { invoiceService } from '../services/invoiceService';
import { InvoiceData } from '../types/invoice';
import { formatCurrencyValue } from '../lib/financial';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
  const { businessData, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [priorityInvoices, setPriorityInvoices] = useState<InvoiceData[]>([]);

  useEffect(() => {
    if (user) {
      invoiceService.getUserInvoices(user.id).then(invoices => {
        const priority = invoices.filter(inv => {
          if (inv.status === 'paid') return false;
          const dueDate = new Date(inv.dueDate);
          const now = new Date();
          const diffTime = dueDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        });
        setPriorityInvoices(priority);
      });
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-20 bg-paper border-b border-hairline flex items-center justify-between px-8 sticky top-0 z-30 select-none">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink tracking-tight">
          {businessData?.businessName || "Billing Platform"}
        </h2>
        <p className="text-[10px] text-grey uppercase tracking-[0.18em] mt-1">Financial Overview</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className={`p-2.5 rounded transition-colors relative ${
              notificationsOpen ? 'bg-slate-100 text-ink' : 'text-grey hover:text-ink hover:bg-slate-100'
            }`}
          >
            <Bell size={19} strokeWidth={2} />
            {priorityInvoices.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-negative text-white text-[9px] font-bold rounded-full flex items-center justify-center tnum">
                {priorityInvoices.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 mt-3 w-88 bg-surface border border-hairline rounded shadow-xl shadow-black/5 overflow-hidden z-50"
              >
                <div className="px-5 py-4 border-b border-hairline flex justify-between items-center">
                  <h4 className="font-display font-semibold text-ink text-sm">Notifications</h4>
                  {priorityInvoices.length > 0 && (
                    <span className="text-[10px] font-semibold text-negative uppercase tracking-wider tnum">
                      {priorityInvoices.length} action required
                    </span>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-hairline">
                  {priorityInvoices.length > 0 ? (
                    priorityInvoices.map(inv => (
                      <Link
                        key={inv.id}
                        to="/dashboard/history"
                        onClick={() => setNotificationsOpen(false)}
                        className="px-5 py-4 flex items-start gap-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-sm bg-red-50 text-negative shrink-0 flex items-center justify-center">
                          <AlertCircle size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-[13px] font-semibold text-ink">Invoice overdue</p>
                            <span className="text-[11px] font-medium text-grey tnum">#{inv.invoiceNo}</span>
                          </div>
                          <p className="text-[12px] text-grey mt-0.5 truncate">Payment from {inv.clientName} is pending</p>
                          <p className="text-[13px] font-semibold text-negative mt-1 tnum">{formatCurrencyValue(inv.totalAmount, inv.currency)}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="px-8 py-12 text-center flex flex-col items-center">
                      <div className="bg-slate-100 text-grey w-12 h-12 rounded-sm flex items-center justify-center mb-4">
                        <Bell size={22} />
                      </div>
                      <p className="text-[13px] text-ink font-medium">No urgent actions</p>
                      <p className="text-[12px] text-grey mt-1">You're all caught up.</p>
                    </div>
                  )}
                </div>
                <div className="px-5 py-3 border-t border-hairline">
                  <Link to="/dashboard/history" onClick={() => setNotificationsOpen(false)} className="text-[12px] font-semibold text-accent hover:text-ink transition-colors">
                    View all invoices →
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-3 pl-3 ml-1 border-l border-hairline hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[13px] font-semibold text-ink leading-none">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-grey uppercase tracking-[0.16em] mt-1.5">{businessData?.businessName || 'Administrator'}</p>
            </div>
            <div className="w-9 h-9 rounded-sm bg-slate-100 overflow-hidden border border-hairline flex items-center justify-center">
              {businessData?.businessLogo ? (
                <img src={businessData.businessLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={17} className="text-grey" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 mt-3 w-60 bg-surface border border-hairline rounded shadow-xl shadow-black/5 overflow-hidden z-50 p-1.5"
              >
                <div className="px-3 py-3 border-b border-hairline mb-1">
                  <p className="text-[13px] font-semibold text-ink truncate leading-none">{user?.email}</p>
                  <p className="text-[10px] text-grey uppercase tracking-[0.16em] mt-1.5">Account member</p>
                </div>
                <button
                  onClick={() => {
                    navigate('/dashboard/settings');
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-slate-100 transition-colors text-slate-600"
                >
                  <Settings size={15} className="text-grey" />
                  <span className="text-[13px] font-medium text-ink">Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded hover:bg-red-50 transition-colors text-negative"
                >
                  <LogOut size={15} />
                  <span className="text-[13px] font-medium">Sign out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
