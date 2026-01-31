import React, { useEffect } from 'react';
import { useForensics } from '../context/ForensicsContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, ArrowRightLeft, ShieldAlert, AlertOctagon } from 'lucide-react';
import { WalletRole, WalletAnalysis } from '../types';

export const AnalysisOverviewPage = () => {
  const { data } = useForensics();
  const navigate = useNavigate();

  useEffect(() => {
    if (!data) navigate('/');
  }, [data, navigate]);

  if (!data) return null;

  const suspiciousWallets = (Object.values(data.wallets) as WalletAnalysis[])
    .filter(w => w.role !== WalletRole.NORMAL)
    .sort((a, b) => b.suspicionScore - a.suspicionScore);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Analysis Overview</h2>
          <p className="text-slate-400">Topology reconstruction complete. Detected {data.suspiciousCount} suspicious entities.</p>
        </div>
        <button 
          onClick={() => navigate('/graph')}
          className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-cyan-500/20"
        >
          Visualize Graph <ArrowRight size={18} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          label="Total Wallets" 
          value={Object.keys(data.wallets).length.toString()} 
          icon={<Users className="text-blue-400" />} 
        />
        <StatsCard 
          label="Transactions" 
          value={data.transactions.length.toString()} 
          icon={<ArrowRightLeft className="text-green-400" />} 
        />
        <StatsCard 
          label="Volume Analyzed" 
          value={data.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
          sub="Tokens"
          icon={<ShieldAlert className="text-purple-400" />} 
        />
        <StatsCard 
          label="Suspicious Entities" 
          value={data.suspiciousCount.toString()} 
          icon={<AlertOctagon className="text-red-400" />} 
          highlight
        />
      </div>

      {/* Flagged Wallets List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white">Flagged Wallets (High Risk)</h3>
          <span className="text-xs font-mono text-slate-500 uppercase">Sorted by Suspicion Score</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Primary Flag</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {suspiciousWallets.length === 0 ? (
                 <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No suspicious patterns detected in this dataset.
                  </td>
                 </tr>
              ) : (
                suspiciousWallets.map((wallet) => (
                  <tr key={wallet.address} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-300">{wallet.address}</td>
                    <td className="px-6 py-4">
                      <RoleBadge role={wallet.role} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${wallet.suspicionScore > 0.7 ? 'bg-red-500' : 'bg-orange-500'}`} 
                            style={{ width: `${wallet.suspicionScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white">{(wallet.suspicionScore * 100).toFixed(0)}/100</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 truncate max-w-xs" title={wallet.flags[0]}>
                      {wallet.flags[0]}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => {
                          // selectWallet called in context via Graph or here?
                          // Let's navigate to details. The details page will load by ID.
                          navigate(`/wallet/${wallet.address}`);
                        }}
                        className="text-cyan-400 hover:text-cyan-300 font-medium text-xs border border-cyan-900 bg-cyan-950/30 px-3 py-1 rounded"
                      >
                        Investigate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ label, value, sub, icon, highlight }: any) => (
  <div className={`p-6 rounded-xl border ${highlight ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900 border-slate-800'}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="p-2 bg-slate-950 rounded-lg">{icon}</div>
      {highlight && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
    </div>
    <div className="text-2xl font-bold text-white">
      {value} <span className="text-sm font-normal text-slate-500">{sub}</span>
    </div>
    <div className="text-sm text-slate-400">{label}</div>
  </div>
);

export const RoleBadge = ({ role }: { role: WalletRole }) => {
  const styles = {
    [WalletRole.SOURCE]: 'bg-red-500/10 text-red-400 border-red-500/20',
    [WalletRole.MULE]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    [WalletRole.AGGREGATOR]: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    [WalletRole.NORMAL]: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[role]}`}>
      {role}
    </span>
  );
};