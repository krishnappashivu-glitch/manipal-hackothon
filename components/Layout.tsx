import React from 'react';
import { ShieldAlert, Activity, Network, FileText, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Upload Data', icon: <FileText size={20} /> },
    { path: '/analysis', label: 'Analysis Overview', icon: <Activity size={20} /> },
    { path: '/graph', label: 'Laundering Graph', icon: <Network size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation */}
      <header className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <ShieldAlert className="text-cyan-400" size={28} />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Chain<span className="text-cyan-400">Sleuth</span>
            </h1>
          </div>
          
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-900/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
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