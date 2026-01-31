import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForensics } from '../context/ForensicsContext';
import { RoleBadge } from './AnalysisOverviewPage';
import { ArrowLeft, Share2, CornerRightDown, CornerRightUp, AlertCircle, Terminal } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/graph')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Back to Graph
      </button>

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 relative overflow-hidden">
        {isSuspicious && (
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertCircle size={120} className="text-red-500" />
            </div>
        )}
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-white font-mono">{selectedWallet.address}</h1>
            <RoleBadge role={selectedWallet.role} />
          </div>
          <p className="text-slate-400">
            Node Type: <strong className="text-slate-200">{selectedWallet.role}</strong>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-8 relative z-10">
          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Suspicion Score</div>
            <div className={`text-3xl font-bold ${isSuspicious ? 'text-red-400' : 'text-green-400'}`}>
              {(selectedWallet.suspicionScore * 100).toFixed(0)}<span className="text-lg text-slate-600">/100</span>
            </div>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-xs uppercase font-bold mb-1">Total Sent</div>
            <div className="text-2xl font-bold text-slate-200">{selectedWallet.totalSent.toLocaleString()}</div>
            <div className="text-xs text-red-400 flex items-center gap-1 mt-1">
              <CornerRightUp size={12} /> {selectedWallet.outDegree} txs
            </div>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
             <div className="text-slate-400 text-xs uppercase font-bold mb-1">Total Received</div>
            <div className="text-2xl font-bold text-slate-200">{selectedWallet.totalReceived.toLocaleString()}</div>
            <div className="text-xs text-green-400 flex items-center gap-1 mt-1">
              <CornerRightDown size={12} /> {selectedWallet.inDegree} txs
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Terminal size={18} className="text-cyan-400" /> Forensic Analysis
          </h3>
          <div className="space-y-4">
             {selectedWallet.flags.length > 0 ? (
                 selectedWallet.flags.map((flag, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-red-950/10 border border-red-900/30 p-3 rounded text-sm text-red-200">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                        <p>{flag}</p>
                    </div>
                 ))
             ) : (
                <div className="p-4 bg-slate-950/50 text-slate-500 text-sm rounded border border-slate-800">
                    No anomalous behavior patterns detected for this wallet.
                </div>
             )}
             
             {selectedWallet.role === WalletRole.SOURCE && (
                 <p className="text-sm text-slate-400 mt-4 italic">
                     * This wallet exhibits <strong>Fan-Out</strong> behavior, splitting large sums into smaller amounts distributed to multiple recipients quickly. This is typical of the "Placement" or early "Layering" stage.
                 </p>
             )}
             {selectedWallet.role === WalletRole.MULE && (
                 <p className="text-sm text-slate-400 mt-4 italic">
                     * This wallet exhibits <strong>Pass-Through</strong> behavior. Funds are held for a very short duration before being forwarded. This indicates a "Mule" account used to obfuscate the trail.
                 </p>
             )}
             {selectedWallet.role === WalletRole.AGGREGATOR && (
                 <p className="text-sm text-slate-400 mt-4 italic">
                     * This wallet exhibits <strong>Fan-In</strong> behavior, collecting funds from multiple disparate sources. This is typical of the "Integration" stage where laundered funds re-enter the main system.
                 </p>
             )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
           <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Share2 size={18} className="text-purple-400" /> Transaction Log
          </h3>
          <div className="overflow-y-auto max-h-[300px] pr-2 space-y-2">
              {selectedWallet.transactions.map((tx) => {
                  const isIncoming = tx.to_wallet === selectedWallet.address;
                  return (
                      <div key={tx.tx_id} className="p-3 bg-slate-950 rounded border border-slate-800 text-xs flex justify-between items-center">
                          <div className="flex flex-col gap-1">
                              <span className="text-slate-500 font-mono">{tx.timestamp.split('T')[1].replace('Z','')}</span>
                              <span className="font-mono text-slate-300">
                                  {isIncoming ? 'FROM: ' + tx.from_wallet : 'TO: ' + tx.to_wallet}
                              </span>
                          </div>
                          <div className={`font-bold ${isIncoming ? 'text-green-400' : 'text-red-400'}`}>
                              {isIncoming ? '+' : '-'}{tx.amount}
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