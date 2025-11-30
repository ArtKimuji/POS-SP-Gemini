
import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, FileText, Settings as SettingsIcon } from 'lucide-react';
import PosPage from './pages/PosPage';
import ProductManagerPage from './pages/ProductManagerPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';

const NavLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${isActive ? 'bg-accent text-white shadow-lg shadow-sky-200' : 'text-slate-500 hover:bg-slate-100'}`}
    >
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] font-bold mt-1">{label}</span>
    </Link>
  );
};

export default function App() {
  return (
    <Router>
      <div className="flex h-screen bg-slate-100 overflow-hidden font-sans no-print">
        {/* Sidebar */}
        <nav className="w-24 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-2 z-10">
          <div className="mb-6">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-lg">SP</div>
          </div>
          
          <NavLink to="/" icon={ShoppingCart} label="POS" />
          <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavLink to="/products" icon={Package} label="Products" />
          <NavLink to="/transactions" icon={FileText} label="History" />
          <NavLink to="/settings" icon={SettingsIcon} label="Settings" />
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden relative overflow-y-auto">
          <Routes>
            <Route path="/" element={<PosPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductManagerPage />} />
            <Route path="/transactions" element={<TransactionHistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
