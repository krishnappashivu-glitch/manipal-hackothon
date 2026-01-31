import React, { useEffect } from 'react';
import { useForensics } from '../context/ForensicsContext';
import { useNavigate } from 'react-router-dom';
import { LaunderingGraph } from '../components/LaunderingGraph';
import { ArrowLeft } from 'lucide-react';

export const LaunderingGraphPage = () => {
  const { data } = useForensics();
  const navigate = useNavigate();

  useEffect(() => {
    if (!data) navigate('/');
  }, [data, navigate]);

  if (!data) return null;

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Laundering Topology Map</h2>
          <p className="text-slate-400 text-sm">Interactive force-directed graph. Click any node to view forensic details.</p>
        </div>
        <button 
          onClick={() => navigate('/analysis')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Overview
        </button>
      </div>

      <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
         <LaunderingGraph data={data.graphData} />
      </div>
      
      <div className="mt-4 text-xs text-slate-500 text-center">
        Rendering subgraph of {data.graphData.nodes.length} nodes and {data.graphData.links.length} edges involved in suspicious flow.
      </div>
    </div>
  );
};