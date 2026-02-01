import React, { useEffect, useState } from 'react';
import { useForensics } from '../context/ForensicsContext';
import { useNavigate } from 'react-router-dom';
import { LaunderingGraph } from '../components/LaunderingGraph';
import { ArrowLeft, Filter, Layers } from 'lucide-react';
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
          <h2 className="text-2xl font-bold text-slate-900">Laundering Topology Map</h2>
          <p className="text-slate-500 text-sm">Force-directed visualization of transaction flows.</p>
        </div>
        
        <div className="flex items-center gap-4">
             {/* Filter Bar */}
            <div className="bg-white border border-slate-200 p-2 rounded-lg flex items-center gap-4 text-sm shadow-sm">
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-amber-600" />
                    <span className="text-slate-500">Score &gt;</span>
                    <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={filters.minScore}
                        onChange={(e) => setFilters(p => ({...p, minScore: parseFloat(e.target.value)}))}
                        className="w-24 accent-amber-600"
                    />
                    <span className="text-slate-900 font-mono w-8">{filters.minScore}</span>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                        type="checkbox"
                        checked={filters.showNormal}
                        onChange={(e) => setFilters(p => ({...p, showNormal: e.target.checked}))}
                        className="rounded bg-slate-100 border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-700">Show Normal</span>
                </label>
            </div>

            <button 
            onClick={() => navigate('/analysis')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
            >
            <ArrowLeft size={16} /> Back
            </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden relative shadow-sm">
         <LaunderingGraph data={data.graphData} filters={filters} />
      </div>
      
      <div className="mt-4 text-xs text-slate-400 text-center flex justify-center items-center gap-2">
        <Layers size={10} /> Rendering {data.graphData.nodes.length} entities.
      </div>
    </div>
  );
};