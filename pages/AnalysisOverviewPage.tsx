import React, { useEffect, useState } from 'react';
import { useForensics } from '../context/ForensicsContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, ArrowRightLeft, ShieldAlert, AlertOctagon, Cpu, CheckCircle2, Loader2, GitMerge, X, Activity, Clock } from 'lucide-react';
import { WalletRole, WalletAnalysis, AgentStatus, LaunderingChain, Transaction } from '../types';

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
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Cpu className="text-amber-600" /> Mission Control
          </h2>
          <p className="text-slate-500">
              Source: <span className="font-mono text-amber-600 font-bold">{data.sourceType}</span> 
              <span className="mx-2">|</span> 
              Last Update: {new Date(data.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button 
          onClick={() => navigate('/graph')}
          className="flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-amber-600/20"
        >
          Visualize Graph <ArrowRight size={18} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard 
          label="Active Wallets" 
          value={Object.keys(data.wallets).length.toString()} 
          icon={<Users className="text-sky-500" />} 
        />
        <StatsCard 
          label="Total Tx Processed" 
          value={data.transactions.length.toString()} 
          icon={<ArrowRightLeft className="text-green-500" />} 
        />
        <StatsCard 
          label="Global Flow Volume" 
          value={totalChainVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
          sub="Detected"
          icon={<GitMerge className="text-amber-500" />} 
        />
        <StatsCard 
          label="High Risk Entities" 
          value={data.suspiciousCount.toString()} 
          icon={<AlertOctagon className="text-red-500" />} 
          highlight
        />
      </div>

      {/* Flagged Wallets List (Moved Up) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-900">Flagged Entities (Agent Verified)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Typology</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4">Agent Findings</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suspiciousWallets.length === 0 ? (
                 <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No suspicious patterns detected in this dataset.
                  </td>
                 </tr>
              ) : (
                suspiciousWallets.map((wallet) => (
                  <tr key={wallet.address} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-700 font-medium">{wallet.address.substring(0,12)}...</td>
                    <td className="px-6 py-4">
                      <RoleBadge role={wallet.role} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${wallet.suspicionScore > 0.7 ? 'bg-red-500' : 'bg-orange-500'}`} 
                            style={{ width: `${wallet.suspicionScore * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{(wallet.suspicionScore * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 truncate max-w-xs text-xs italic opacity-80" title={wallet.agentExplanation}>
                      "{wallet.agentExplanation.substring(0, 50)}..."
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => navigate(`/wallet/${wallet.address}`)}
                        className="text-amber-700 hover:text-amber-800 font-medium text-xs border border-amber-200 bg-amber-50 px-3 py-1 rounded hover:bg-amber-100 transition-colors"
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
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                  <GitMerge className="text-amber-600" size={20} /> Detected Laundering Chains
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.launderingChains.map(chain => (
                      <div 
                        key={chain.id} 
                        onClick={() => setSelectedChain(chain)}
                        className="bg-slate-50 p-4 rounded-lg border border-slate-200 cursor-pointer hover:border-amber-300 hover:bg-white hover:shadow-md transition-all group"
                      >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-amber-600 font-mono font-bold group-hover:text-amber-700">Chain #{chain.id}</span>
                            <span className="text-xs text-slate-500 group-hover:text-slate-600">{chain.wallets.length} Entities</span>
                          </div>
                          <div className="text-2xl font-bold text-slate-900 mb-1">
                              {chain.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-slate-500">Total Volume Moved</div>
                          <div className="mt-3 flex gap-1 flex-wrap">
                              {chain.wallets.slice(0, 3).map(w => (
                                  <span key={w} className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-600 font-mono">
                                      {w.substring(0,6)}
                                  </span>
                              ))}
                              {chain.wallets.length > 3 && (
                                  <span className="text-[10px] px-1.5 py-0.5 text-slate-400">+{chain.wallets.length - 3} more</span>
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
              transactions={data.transactions}
              onClose={() => setSelectedChain(null)}
              onNavigate={(id) => navigate(`/wallet/${id}`)}
          />
      )}
    </div>
  );
};

const ChainDetailsModal = ({ chain, wallets, transactions, onClose, onNavigate }: { 
    chain: LaunderingChain, 
    wallets: Record<string, WalletAnalysis>, 
    transactions: Transaction[],
    onClose: () => void,
    onNavigate: (id: string) => void
}) => {
    // Filter transactions relevant to this chain (edges within the subgraph)
    const chainTxs = transactions.filter(tx => 
        chain.wallets.includes(tx.from_wallet) && chain.wallets.includes(tx.to_wallet)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                             <GitMerge className="text-amber-600" size={20} />
                             Laundering Chain #{chain.id}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Total Flow Volume: <span className="text-slate-900 font-mono font-bold">{chain.volume.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Left: Entity List */}
                    <div className="w-full md:w-1/2 p-6 overflow-y-auto border-r border-slate-100 custom-scrollbar">
                         <div className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                            <Users size={14} /> Involved Entities ({chain.wallets.length})
                         </div>
                        <div className="space-y-3">
                            {chain.wallets.map((walletId) => {
                                const wallet = wallets[walletId];
                                return (
                                    <div key={walletId} className="flex items-center justify-between p-3 bg-white rounded border border-slate-200 hover:border-amber-300 hover:shadow-sm group transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-slate-100 border border-slate-200 text-slate-500`}>
                                                {wallet.role.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-mono text-slate-700 text-sm group-hover:text-amber-600 transition-colors font-medium">{walletId}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                     <RoleBadge role={wallet.role} />
                                                     <span className="text-[10px] text-slate-500">
                                                        Score: {(wallet.suspicionScore * 100).toFixed(0)}%
                                                     </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onNavigate(walletId)}
                                            className="text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-white hover:border-amber-300 hover:text-amber-600 text-slate-500 rounded transition-colors font-medium shadow-sm"
                                        >
                                            Investigate
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Flow Visualization */}
                    <div className="w-full md:w-1/2 p-6 bg-slate-50/50 overflow-y-auto custom-scrollbar">
                         <div className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                            <Activity size={14} /> Execution Flow Log
                         </div>
                         
                         <div className="relative border-l-2 border-slate-200 ml-2 space-y-6 pb-2">
                            {chainTxs.map((tx, i) => (
                                <div key={tx.tx_id} className="relative pl-6 animate-in slide-in-from-left-2 duration-300" style={{animationDelay: `${i * 50}ms`}}>
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[5px] top-4 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-slate-50" />
                                    
                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm hover:border-amber-300 transition-colors">
                                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                                            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                                                <Clock size={10} />
                                                {new Date(tx.timestamp).toLocaleTimeString()}
                                            </div>
                                            <span className="font-bold text-slate-900">{tx.amount.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">{tx.token}</span></span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                             <div className="flex-1 min-w-0">
                                                 <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">From</div>
                                                 <div className="font-mono text-xs text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate" title={tx.from_wallet}>
                                                     {tx.from_wallet}
                                                 </div>
                                             </div>
                                             <ArrowRight size={14} className="text-slate-300 shrink-0 mt-3" />
                                             <div className="flex-1 min-w-0 text-right">
                                                 <div className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">To</div>
                                                 <div className="font-mono text-xs text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 truncate ml-auto" title={tx.to_wallet}>
                                                     {tx.to_wallet}
                                                 </div>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {chainTxs.length === 0 && (
                                <div className="text-center text-slate-400 text-sm py-4 italic">
                                    No direct internal transactions found in this view.
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AgentPipelineView = ({ status }: { status: AgentStatus[] }) => (
    <div className="max-w-2xl mx-auto py-20">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">AI Agent Orchestration</h2>
        <div className="space-y-6">
            {status.map((agent, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-4 relative overflow-hidden shadow-sm">
                    {agent.status === 'PROCESSING' && (
                        <div className="absolute inset-0 bg-amber-50/50 animate-pulse" />
                    )}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 border border-slate-200 z-10">
                        {agent.status === 'COMPLETED' ? <CheckCircle2 className="text-green-500" /> : 
                         agent.status === 'PROCESSING' ? <Loader2 className="animate-spin text-amber-500" /> :
                         <div className="w-2 h-2 rounded-full bg-slate-300" />}
                    </div>
                    <div className="flex-1 z-10">
                        <h4 className={`font-bold ${agent.status === 'IDLE' ? 'text-slate-400' : 'text-slate-800'}`}>{agent.name}</h4>
                        {agent.message && <p className="text-sm text-amber-600">{agent.message}</p>}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const StatsCard = ({ label, value, sub, icon, highlight }: any) => (
  <div className={`p-6 rounded-xl border shadow-sm ${highlight ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
    <div className="flex items-start justify-between mb-4">
      <div className={`p-2 rounded-lg ${highlight ? 'bg-white' : 'bg-slate-50'}`}>{icon}</div>
      {highlight && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
    </div>
    <div className="text-2xl font-bold text-slate-900">
      {value} <span className="text-sm font-normal text-slate-500">{sub}</span>
    </div>
    <div className="text-sm text-slate-500">{label}</div>
  </div>
);

export const RoleBadge = ({ role }: { role: WalletRole }) => {
  const styles = {
    [WalletRole.SOURCE]: 'bg-red-50 text-red-700 border-red-200',
    [WalletRole.MULE]: 'bg-orange-50 text-orange-700 border-orange-200',
    [WalletRole.DESTINATION]: 'bg-violet-50 text-violet-700 border-violet-200',
    [WalletRole.NORMAL]: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${styles[role]}`}>
      {role}
    </span>
  );
};