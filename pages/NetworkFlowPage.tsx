import React, { useEffect, useState } from 'react';
import { useForensics } from '../context/ForensicsContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowRightLeft, Search } from 'lucide-react';

export const NetworkFlowPage = () => {
  const { data } = useForensics();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!data) navigate('/');
  }, [data, navigate]);

  if (!data) return null;

  const filteredTransactions = data.transactions.filter(tx => 
    tx.from_wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.to_wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.tx_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ArrowRightLeft className="text-amber-500" /> Network Flow Log
          </h2>
          <p className="text-zinc-400 text-sm">
            Raw ledger containing {data.transactions.length} immutable transaction records.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 w-full md:w-auto">
            <Search className="text-zinc-500" size={16} />
            <input 
                type="text" 
                placeholder="Search hash or address..." 
                className="bg-transparent border-none outline-none text-zinc-300 text-sm w-full md:w-64 placeholder:text-zinc-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950 text-zinc-500 font-medium uppercase text-xs tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Source Entity</th>
                        <th className="px-6 py-4"></th>
                        <th className="px-6 py-4">Destination Entity</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-center">Type</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                    {filteredTransactions.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-zinc-600">
                                No matching records found in the ledger.
                            </td>
                        </tr>
                    ) : (
                        filteredTransactions.map((tx) => (
                            <tr key={tx.tx_id} className="hover:bg-zinc-800/30 transition-colors group">
                                <td className="px-6 py-4 font-mono text-xs text-zinc-500 whitespace-nowrap">
                                    {new Date(tx.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 font-mono text-zinc-300">
                                    <span 
                                        className="cursor-pointer hover:text-amber-500 transition-colors"
                                        onClick={() => navigate(`/wallet/${tx.from_wallet}`)}
                                        title={tx.from_wallet}
                                    >
                                        {tx.from_wallet.substring(0, 12)}...
                                    </span>
                                </td>
                                <td className="px-2 py-4 text-center">
                                    <ArrowRight size={14} className="text-zinc-600 mx-auto" />
                                </td>
                                <td className="px-6 py-4 font-mono text-zinc-300">
                                     <span 
                                        className="cursor-pointer hover:text-amber-500 transition-colors"
                                        onClick={() => navigate(`/wallet/${tx.to_wallet}`)}
                                        title={tx.to_wallet}
                                    >
                                        {tx.to_wallet.substring(0, 12)}...
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-white">
                                    {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-400">
                                        {tx.token}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        <div className="bg-zinc-950 border-t border-zinc-800 px-6 py-3 text-xs text-zinc-600 flex justify-between items-center">
             <span>Showing {filteredTransactions.length} of {data.transactions.length} records</span>
             <span className="font-mono opacity-50">LE-X9-AUDIT-LOG-V2</span>
        </div>
      </div>
    </div>
  );
};