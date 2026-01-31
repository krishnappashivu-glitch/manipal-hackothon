import React, { useEffect } from 'react';
import { useForensics } from '../context/ForensicsContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, ArrowRightLeft, ShieldAlert, AlertOctagon, Cpu, CheckCircle2, Loader2 } from 'lucide-react';
import { WalletRole, WalletAnalysis, AgentStatus } from '../types';

export const AnalysisOverviewPage = () => {
  const { data, pipelineStatus, isProcessing } = useForensics();
  const navigate = useNavigate();

  useEffect(() => {
    // If no data and not processing, go back
    if (!data && !isProcessing && pipelineStatus.length === 0) navigate('/');
  }, [data, isProcessing, pipelineStatus, navigate]);

  // If processing, show pipeline view
  if (isProcessing || (pipelineStatus.length > 0 && !data)) {
      return <AgentPipelineView status={pipelineStatus} />;
  }

  if (!data) return null;

  const suspiciousWallets = (Object.values(data.wallets) as WalletAnalysis[])
    .filter(w => w.role !== WalletRole.NORMAL)
    .sort((a, b) => b.suspicionScore - a.suspicionScore);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Cpu className="text-amber-500" /> Mission Control
          </h2>
          <p className="text-zinc-400">
              Source: <span className="font-mono text-amber-500">{data.sourceType}</span> 
              <span className="mx-2">|</span> 
              Last Update: {new Date(data.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button 
          onClick={() => navigate('/graph')}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-black rounded-lg font-semibold transition-all shadow-lg shadow-amber-500/20"
        >
          Visualize Graph <ArrowRight size={18} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          label="Active Wallets" 
          value={Object.keys(data.wallets).length.toString()} 
          icon={<Users className="text-sky-400" />} 
        />
        <StatsCard 
          label="Total Tx Processed" 
          value={data.transactions.length.toString()} 
          icon={<ArrowRightLeft className="text-green-400" />} 
        />
        <StatsCard 
          label="Risk Volume" 
          value={data.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
          sub="ETH/Tokens"
          icon={<ShieldAlert className="text-purple-400" />} 
        />
        <StatsCard 
          label="High Risk Entities" 
          value={data.suspiciousCount.toString()} 
          icon={<AlertOctagon className="text-red-500" />} 
          highlight
        />
      </div>

      {/* Flagged Wallets List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white">Flagged Entities (Agent Verified)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-950 text-zinc-200 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Typology</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4">Agent Findings</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {suspiciousWallets.length === 0 ? (
                 <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    No suspicious patterns detected in this dataset.
                  </td>
                 </tr>
              ) : (
                suspiciousWallets.map((wallet) => (
                  <tr key={wallet.address} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-zinc-300">{wallet.address.substring(0,12)}...</td>
                    <td className="px-6 py-4">
                      <RoleBadge role={wallet.role} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${wallet.suspicionScore > 0.7 ? 'bg-red-500' : 'bg-orange-500'}`} 
                            style={{ width: `${wallet.suspicionScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white">{(wallet.suspicionScore * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 truncate max-w-xs text-xs italic opacity-80" title={wallet.agentExplanation}>
                      "{wallet.agentExplanation.substring(0, 50)}..."
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => navigate(`/wallet/${wallet.address}`)}
                        className="text-amber-500 hover:text-amber-400 font-medium text-xs border border-amber-900 bg-amber-950/30 px-3 py-1 rounded"
                      >
                        Deep Dive
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

const AgentPipelineView = ({ status }: { status: AgentStatus[] }) => (
    <div className="max-w-2xl mx-auto py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-10">AI Agent Orchestration</h2>
        <div className="space-y-6">
            {status.map((agent, idx) => (
                <div key={idx} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden">
                    {agent.status === 'PROCESSING' && (
                        <div className="absolute inset-0 bg-amber-500/5 animate-pulse" />
                    )}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-950 border border-zinc-800 z-10">
                        {agent.status === 'COMPLETED' ? <CheckCircle2 className="text-green-500" /> : 
                         agent.status === 'PROCESSING' ? <Loader2 className="animate-spin text-amber-500" /> :
                         <div className="w-2 h-2 rounded-full bg-zinc-700" />}
                    </div>
                    <div className="flex-1 z-10">
                        <h4 className={`font-bold ${agent.status === 'IDLE' ? 'text-zinc-500' : 'text-zinc-200'}`}>{agent.name}</h4>
                        {agent.message && <p className="text-sm text-amber-500">{agent.message}</p>}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const StatsCard = ({ label, value, sub, icon, highlight }: any) => (
  <div className={`p-6 rounded-xl border ${highlight ? 'bg-red-950/20 border-red-900/50' : 'bg-zinc-900 border-zinc-800'}`}>
    <div className="flex items-start justify-between mb-4">
      <div className="p-2 bg-zinc-950 rounded-lg">{icon}</div>
      {highlight && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
    </div>
    <div className="text-2xl font-bold text-white">
      {value} <span className="text-sm font-normal text-zinc-500">{sub}</span>
    </div>
    <div className="text-sm text-zinc-400">{label}</div>
  </div>
);

export const RoleBadge = ({ role }: { role: WalletRole }) => {
  const styles = {
    [WalletRole.SOURCE]: 'bg-red-500/10 text-red-400 border-red-500/20',
    [WalletRole.MULE]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    [WalletRole.AGGREGATOR]: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    [WalletRole.NORMAL]: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[role]}`}>
      {role}
    </span>
  );
};