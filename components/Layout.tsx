import React from 'react';
import { ShieldAlert, Activity, Network, FileText, Menu, ScrollText } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Upload Data', icon: <FileText size={20} /> },
    { path: '/analysis', label: 'Analysis Overview', icon: <Activity size={20} /> },
    { path: '/graph', label: 'Laundering Graph', icon: <Network size={20} /> },
    { path: '/flow', label: 'Network Flow', icon: <ScrollText size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <ShieldAlert className="text-amber-500" size={28} />
            <h1 className="text-xl font-bold tracking-tight text-white">
              THE FAULT <span className="text-amber-500">HUNTER</span>
            </h1>
          </div>
          
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-amber-950/40 text-amber-500 border border-amber-900/50'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {item.icon}
                <span className="hidden md:block">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 max-w-7xl mx-auto px-4">
        {children}
      </main>
    </div>
  );
};