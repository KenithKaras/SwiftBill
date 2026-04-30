import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, AlertCircle, Settings, LogOut, ChevronRight } from 'lucide-react';
import { invoiceService, InvoiceData } from '../services/invoiceService';
import { formatCurrency } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

const Navbar = () => {
  const { businessData, user } = useAuth();
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
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-50">
      <div>
        <h2 className="text-lg font-bold text-slate-800">SwiftBill</h2>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Financial Overview</p>
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setProfileOpen(false);
            }}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative"
          >
            <Bell size={20} />
            {priorityInvoices.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {priorityInvoices.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h4 className="font-bold text-sm">Notifications</h4>
                  <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full">
                    {priorityInvoices.length} New
                  </span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {priorityInvoices.length > 0 ? (
                    priorityInvoices.map(inv => (
                      <Link 
                        key={inv.id}
                        to="/history" 
                        onClick={() => setNotificationsOpen(false)}
                        className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex-shrink-0 flex items-center justify-center">
                          <AlertCircle size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Invoice Overdue</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">#{inv.invoiceNo} for {inv.clientName} is due.</p>
                          <p className="text-[10px] font-black text-rose-500 mt-1 uppercase tracking-tighter">{formatCurrency(inv.totalAmount)}</p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="mx-auto text-slate-200 mb-2" size={32} />
                      <p className="text-xs text-slate-400 font-medium tracking-tight">No urgent notifications</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                  <Link to="/history" onClick={() => setNotificationsOpen(false)} className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">
                    View All Invoices
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-3 pl-6 border-l border-slate-200 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold leading-none">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">{businessData?.businessName || 'Administrator'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-slate-200 flex items-center justify-center">
              {businessData?.businessLogo ? (
                <img src={businessData.businessLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={20} className="text-slate-400" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 p-2"
              >
                <div className="p-3 border-b border-slate-50 mb-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.email}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Account Member</p>
                </div>
                <button 
                  onClick={() => {
                    navigate('/settings');
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 group"
                >
                  <div className="flex items-center gap-3">
                    <Settings size={16} />
                    <span className="text-xs font-bold">Settings</span>
                  </div>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50 transition-colors text-red-500 group"
                >
                  <div className="flex items-center gap-3">
                    <LogOut size={16} />
                    <span className="text-xs font-bold">Logout</span>
                  </div>
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
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
