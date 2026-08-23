import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  History,
  Package,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

const Sidebar = () => {
  const navigate = useNavigate();
  const { businessData, user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/dashboard/create', icon: FilePlus, label: 'Create invoice', end: false },
    { to: '/dashboard/history', icon: History, label: 'Invoice history', end: false },
    { to: '/dashboard/products', icon: Package, label: 'Products', end: false },
    { to: '/dashboard/settings', icon: Settings, label: 'Settings', end: false },
  ];

  return (
    <div className="w-64 bg-paper border-r border-hairline h-screen flex flex-col sticky top-0 z-40 select-none">
      {/* Brand */}
      <div className="px-6 h-20 flex items-center gap-3 border-b border-hairline">
        <div className="w-9 h-9 rounded-sm bg-ink text-paper flex items-center justify-center font-display font-bold text-sm tracking-tight">
          SB
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display font-semibold text-[15px] text-ink tracking-tight">SwiftBill</span>
          <span className="text-[10px] text-grey uppercase tracking-[0.18em] mt-1">Invoicing</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-6">
        <p className="px-3 mb-2 text-[10px] font-semibold text-grey uppercase tracking-[0.18em]">Menu</p>
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm rounded relative transition-colors",
                isActive
                  ? "text-paper font-semibold"
                  : "text-slate-500 hover:text-ink hover:bg-slate-100 font-medium"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-ink rounded -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <item.icon size={17} strokeWidth={2} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer — account + sign out */}
      <div className="p-3 border-t border-hairline">
        <div className="flex items-center gap-3 px-2 py-2.5">
          <div className="w-9 h-9 rounded-sm bg-slate-100 overflow-hidden border border-hairline flex items-center justify-center shrink-0">
            {businessData?.businessLogo ? (
              <img src={businessData.businessLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User size={17} className="text-grey" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink truncate leading-tight">
              {businessData?.businessName || user?.email?.split('@')[0]}
            </p>
            <p className="text-[11px] text-grey truncate mt-0.5">
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-1 flex items-center gap-3 w-full px-3 py-2.5 rounded text-sm font-medium text-slate-500 hover:text-negative hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
