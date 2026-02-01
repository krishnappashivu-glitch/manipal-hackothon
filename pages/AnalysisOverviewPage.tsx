import React, { useEffect, useState } from 'react';
import { useForensics } from '../context/ForensicsContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, ArrowRightLeft, ShieldAlert, AlertOctagon, Cpu, CheckCircle2, Loader2, GitMerge, X } from 'lucide-react';
import { WalletRole, WalletAnalysis, AgentStatus, LaunderingChain } from '../types';

export const AnalysisOverviewPage = () => {
  const { data, pipelineStatus, isProcessing } = useForensics();
  const navigate = useNavigate();
  const [selectedChain, setSelectedChain] = useState<LaunderingChain | null>(null);

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

  const totalChainVolume = data.launderingChains?.reduce((acc, chain) => acc + chain.volume, 0) || 0;

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
          label="Global Flow Volume" 
          value={totalChainVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
          sub="Detected"
          icon={<GitMerge className="text-amber-400" />} 
        />
        <StatsCard 
          label="High Risk Entities" 
          value={data.suspiciousCount.toString()} 
          icon={<AlertOctagon className="text-red-500" />} 
          highlight
        />
      </div>

      {/* Flagged Wallets List (Moved Up) */}
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

      {/* Global Flow Chains Section (Moved Down) */}
      {data.launderingChains && data.launderingChains.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                  <GitMerge className="text-amber-500" size={20} /> Detected Laundering Chains
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.launderingChains.map(chain => (
                      <div 
                        key={chain.id} 
                        onClick={() => setSelectedChain(chain)}
                        className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 cursor-pointer hover:border-amber-500/50 hover:bg-zinc-900/80 transition-all group"
                      >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-amber-500 font-mono font-bold group-hover:text-amber-400">Chain #{chain.id}</span>
                            <span className="text-xs text-zinc-500 group-hover:text-zinc-400">{chain.wallets.length} Entities</span>
                          </div>
                          <div className="text-2xl font-bold text-white mb-1">
                              {chain.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-zinc-400">Total Volume Moved</div>
                          <div className="mt-3 flex gap-1 flex-wrap">
                              {chain.wallets.slice(0, 3).map(w => (
                                  <span key={w} className="text-[10px] px-1.5 py-0.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-500 font-mono">
                                      {w.substring(0,6)}
                                  </span>
                              ))}
                              {chain.wallets.length > 3 && (
                                  <span className="text-[10px] px-1.5 py-0.5 text-zinc-600">+{chain.wallets.length - 3} more</span>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {selectedChain && (
          <ChainDetailsModal 
              chain={selectedChain} 
              wallets={data.wallets}
              onClose={() => setSelectedChain(null)}
              onNavigate={(id) => navigate(`/wallet/${id}`)}
          />
      )}
    </div>
  );
};

const ChainDetailsModal = ({ chain, wallets, onClose, onNavigate }: { 
    chain: LaunderingChain, 
    wallets: Record<string, WalletAnalysis>, 
    onClose: () => void,
    onNavigate: (id: string) => void
}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 rounded-t-xl">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                         <GitMerge className="text-amber-500" size={20} />
                         Laundering Chain #{chain.id}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                        Total Flow Volume: <span className="text-white font-mono">{chain.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    </p>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    <X size={24} />
                </button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-3 custom-scrollbar">
                <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Involved Entities ({chain.wallets.length})</div>
                {chain.wallets.map((walletId) => {
                    const wallet = wallets[walletId];
                    return (
                        <div key={walletId} className="flex items-center justify-between p-3 bg-zinc-950 rounded border border-zinc-800 hover:border-zinc-700 group transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-400`}>
                                    {wallet.role.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-mono text-zinc-300 text-sm group-hover:text-amber-500 transition-colors">{walletId}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                         <RoleBadge role={wallet.role} />
                                         <span className="text-[10px] text-zinc-500">
                                            Score: {(wallet.suspicionScore * 100).toFixed(0)}%
                                         </span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => onNavigate(walletId)}
                                className="text-xs px-3 py-1.5 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:text-white text-zinc-400 rounded transition-colors font-medium"
                            >
                                Investigate
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
);

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
    [WalletRole.DESTINATION]: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    [WalletRole.NORMAL]: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${styles[role]}`}>
      {role}
    </span>
  );
};