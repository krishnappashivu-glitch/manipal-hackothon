import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForensics } from '../context/ForensicsContext';
import { RoleBadge } from './AnalysisOverviewPage';
import { ArrowLeft, Share2, CornerRightDown, CornerRightUp, AlertCircle, Bot, Activity } from 'lucide-react';
import { WalletRole } from '../types';

export const WalletDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data, selectWallet, selectedWallet } = useForensics();
  const navigate = useNavigate();

  useEffect(() => {
    if (!data) {
      navigate('/');
      return;
    }
    if (id) {
      selectWallet(id);
    }
  }, [id, data, navigate, selectWallet]);

  if (!selectedWallet) return null;

  const isSuspicious = selectedWallet.role !== WalletRole.NORMAL;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/analysis')}
        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Return to Mission Control
      </button>

      {/* Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 relative overflow-hidden">
        {isSuspicious && (
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertCircle size={120} className="text-red-500" />
            </div>
        )}
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
            <div>
                <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-white font-mono break-all">{selectedWallet.address}</h1>
                </div>
                <div className="flex items-center gap-3 mt-2">
                    <RoleBadge role={selectedWallet.role} />
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                        selectedWallet.riskLevel === 'CRITICAL' ? 'border-red-500 text-red-500' :
                        selectedWallet.riskLevel === 'HIGH' ? 'border-orange-500 text-orange-500' :
                        selectedWallet.riskLevel === 'MEDIUM' ? 'border-yellow-500 text-yellow-500' :
                        'border-green-500 text-green-500'
                    }`}>RISK: {selectedWallet.riskLevel}</span>
                </div>
            </div>
            
            <div className="flex gap-4 text-center">
                 <div>
                    <div className="text-zinc-500 text-xs font-bold uppercase">Confidence</div>
                    <div className="text-xl font-bold text-white">{(selectedWallet.confidenceScore * 100).toFixed(0)}%</div>
                 </div>
                 <div>
                    <div className="text-zinc-500 text-xs font-bold uppercase">Score</div>
                    <div className={`text-xl font-bold ${isSuspicious ? 'text-red-400' : 'text-green-400'}`}>
                    {(selectedWallet.suspicionScore * 100).toFixed(0)}
                    </div>
                 </div>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 relative z-10">
          <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
            <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Outbound Flow</div>
            <div className="text-lg font-bold text-zinc-200">{selectedWallet.totalSent.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
             <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Inbound Flow</div>
            <div className="text-lg font-bold text-zinc-200">{selectedWallet.totalReceived.toLocaleString()}</div>
          </div>
          <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
             <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Volume Ratio</div>
            <div className="text-lg font-bold text-zinc-200">
                {(selectedWallet.totalSent / (selectedWallet.totalReceived || 1)).toFixed(2)}x
            </div>
          </div>
          <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
             <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Activity</div>
            <div className="text-lg font-bold text-zinc-200">
                {selectedWallet.transactions.length} Tx
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Bot size={18} className="text-amber-500" /> Agent Report
                </h3>
                <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-zinc-300 leading-relaxed text-base">
                        {selectedWallet.agentExplanation}
                    </p>
                </div>
                
                <div className="mt-6 pt-6 border-t border-zinc-800 space-y-3">
                    <h4 className="text-sm font-semibold text-zinc-400">Behavioral Flags</h4>
                    {selectedWallet.flags.length > 0 ? (
                        selectedWallet.flags.map((flag, idx) => (
                            <div key={idx} className="flex gap-3 items-start bg-red-950/10 border border-red-900/30 p-3 rounded text-sm text-red-200">
                                <Activity size={16} className="mt-0.5 shrink-0 text-red-500" />
                                <p>{flag}</p>
                            </div>
                        ))
                    ) : (
                        <div className="p-3 bg-green-950/10 border border-green-900/30 rounded text-sm text-green-300">
                            No active behavioral flags.
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-fit">
           <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Share2 size={18} className="text-purple-400" /> Ledger
          </h3>
          <div className="overflow-y-auto max-h-[500px] pr-2 space-y-2">
              {selectedWallet.transactions.map((tx) => {
                  const isIncoming = tx.to_wallet === selectedWallet.address;
                  return (
                      <div key={tx.tx_id} className="p-3 bg-zinc-950 rounded border border-zinc-800 text-xs flex justify-between items-center hover:border-zinc-700 transition-colors cursor-default">
                          <div className="flex flex-col gap-1">
                              <span className="text-zinc-500 font-mono text-[10px]">
                                {tx.timestamp.includes('T') ? tx.timestamp.split('T')[1].replace('Z','') : tx.timestamp}
                              </span>
                              <span className="font-mono text-zinc-300 truncate max-w-[100px]" title={isIncoming ? tx.from_wallet : tx.to_wallet}>
                                  {isIncoming ? '← ' + tx.from_wallet : '→ ' + tx.to_wallet}
                              </span>
                          </div>
                          <div className={`font-bold ${isIncoming ? 'text-green-400' : 'text-red-400'}`}>
                              {isIncoming ? '+' : '-'}{tx.amount.toFixed(2)}
                          </div>
                      </div>
                  )
              })}
          </div>
        </div>
      </div>
    </div>
  );
};