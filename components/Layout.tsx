import React from 'react';
import { ShieldAlert, Activity, Network, FileText, Menu, ScrollText, Wifi } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'System Entry', icon: <FileText size={20} /> },
    { path: '/analysis', label: 'Mission Control', icon: <Activity size={20} /> },
    { path: '/graph', label: 'Topology Map', icon: <Network size={20} /> },
    { path: '/flow', label: 'Flow Logs', icon: <ScrollText size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-200 selection:text-amber-900">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <ShieldAlert className="text-amber-600" size={28} />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              THE FRAUD <span className="text-amber-600">HUNTER</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Status Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold uppercase tracking-wider">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                System Online
            </div>

            <nav className="flex gap-1">
                {navItems.map((item) => (
                <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                        ? 'bg-amber-50 text-amber-700 border border-amber-200 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    {item.icon}
                    <span className="hidden md:block">{item.label}</span>
                </button>
                ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 max-w-7xl mx-auto px-4">
        {children}
      </main>
    </div>
  );
};