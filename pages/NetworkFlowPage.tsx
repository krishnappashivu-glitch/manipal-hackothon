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
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="text-amber-600" /> Network Flow Log
          </h2>
          <p className="text-slate-500 text-sm">
            Raw ledger containing {data.transactions.length} immutable transaction records.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 w-full md:w-auto shadow-sm">
            <Search className="text-slate-400" size={16} />
            <input 
                type="text" 
                placeholder="Search hash or address..." 
                className="bg-transparent border-none outline-none text-slate-700 text-sm w-full md:w-64 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium uppercase text-xs tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Source Entity</th>
                        <th className="px-6 py-4"></th>
                        <th className="px-6 py-4">Destination Entity</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-center">Type</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                No matching records found in the ledger.
                            </td>
                        </tr>
                    ) : (
                        filteredTransactions.map((tx) => (
                            <tr key={tx.tx_id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                                    {new Date(tx.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-700 font-medium">
                                    <span 
                                        className="cursor-pointer hover:text-amber-600 transition-colors"
                                        onClick={() => navigate(`/wallet/${tx.from_wallet}`)}
                                        title={tx.from_wallet}
                                    >
                                        {tx.from_wallet.substring(0, 12)}...
                                    </span>
                                </td>
                                <td className="px-2 py-4 text-center">
                                    <ArrowRight size={14} className="text-slate-400 mx-auto" />
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-700 font-medium">
                                     <span 
                                        className="cursor-pointer hover:text-amber-600 transition-colors"
                                        onClick={() => navigate(`/wallet/${tx.to_wallet}`)}
                                        title={tx.to_wallet}
                                    >
                                        {tx.to_wallet.substring(0, 12)}...
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-slate-900">
                                    {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500">
                                        {tx.token}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex justify-between items-center">
             <span>Showing {filteredTransactions.length} of {data.transactions.length} records</span>
             <span className="font-mono opacity-50">LE-X9-AUDIT-LOG-V2</span>
        </div>
      </div>
    </div>
  );
};