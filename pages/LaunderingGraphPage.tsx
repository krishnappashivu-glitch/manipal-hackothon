import React, { useEffect, useState } from 'react';
import { useForensics } from '../context/ForensicsContext';
import { useNavigate } from 'react-router-dom';
import { LaunderingGraph } from '../components/LaunderingGraph';
import { ArrowLeft, Filter, RefreshCw } from 'lucide-react';
import { FilterOptions } from '../types';

export const LaunderingGraphPage = () => {
  const { data } = useForensics();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterOptions>({
      minScore: 0,
      showNormal: true,
      minAmount: 0
  });

  useEffect(() => {
    if (!data) navigate('/');
  }, [data, navigate]);

  if (!data) return null;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Laundering Topology Map</h2>
          <p className="text-slate-400 text-sm">Real-time force-directed visualization of transaction flows.</p>
        </div>
        
        <div className="flex items-center gap-4">
             {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-cyan-400" />
                    <span className="text-slate-400">Score &gt;</span>
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={filters.minScore}
                        onChange={(e) => setFilters(p => ({...p, minScore: parseFloat(e.target.value)}))}
                        className="w-24 accent-cyan-500"
                    />
                    <span className="text-white w-8">{filters.minScore}</span>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox"
                        checked={filters.showNormal}
                        onChange={(e) => setFilters(p => ({...p, showNormal: e.target.checked}))}
                        className="rounded bg-slate-800 border-slate-600 text-cyan-500"
                    />
                    <span className="text-slate-300">Show Normal</span>
                </label>
            </div>

            <button 
            onClick={() => navigate('/analysis')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
            <ArrowLeft size={16} /> Back
            </button>
        </div>
      </div>

      <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
         <LaunderingGraph data={data.graphData} filters={filters} />
      </div>
      
      <div className="mt-4 text-xs text-slate-500 text-center flex justify-center items-center gap-2">
        <RefreshCw size={10} /> Live topology update enabled. Rendering {data.graphData.nodes.length} entities.
      </div>
    </div>
  );
};