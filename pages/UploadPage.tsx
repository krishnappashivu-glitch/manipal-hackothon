import React, { useState } from 'react';
import { Upload, FileText, AlertTriangle, Activity, Globe, Zap, Radio, Server, PlayCircle, ShieldCheck } from 'lucide-react';
import { useForensics } from '../context/ForensicsContext';
import { useNavigate } from 'react-router-dom';
import { generateDummyCSV } from '../utils/forensicsEngine';

export const UploadPage = () => {
  const { processFile, isProcessing, toggleLiveStream, isLive, stopLiveStream } = useForensics();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'live' | 'upload'>('live');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        await processFile(text);
        navigate('/analysis');
      };
      reader.readAsText(file);
    }
  };

  const loadDemoData = async () => {
    const data = generateDummyCSV();
    await processFile(data);
    navigate('/analysis');
  };

  const handleGlobalStream = () => {
      toggleLiveStream('GLOBAL');
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="text-center mb-10">
        <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">
            THE FRAUD <span className="text-amber-600">HUNTER</span>
        </h2>
        <p className="text-slate-500 text-xl max-w-2xl mx-auto font-light">
          Autonomous multi-agent system for blockchain forensics and AML pattern detection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Instant Access */}
        <div className="lg:col-span-2 space-y-6">
             {/* Live Surveillance Panel */}
             <div 
                onClick={handleGlobalStream}
                className={`relative group cursor-pointer border rounded-2xl p-8 transition-all overflow-hidden ${isLive ? 'bg-amber-950 border-amber-900 text-white shadow-2xl shadow-amber-900/20' : 'bg-slate-900 border-slate-800 text-slate-100 hover:shadow-xl hover:shadow-slate-900/10 hover:-translate-y-1'}`}
            >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Globe size={180} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isLive ? 'bg-amber-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                            <Activity size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold">Global Surveillance</h3>
                            <p className={`text-sm ${isLive ? 'text-amber-400' : 'text-slate-400'}`}>
                                {isLive ? '• SYSTEM ENGAGED' : '• READY TO DEPLOY'}
                            </p>
                        </div>
                    </div>

                    <p className="text-slate-300 text-lg mb-8 max-w-md leading-relaxed">
                        Initialize high-frequency connections to global RPC nodes. Aggregates mempool data from Ethereum and Bitcoin simultaneously.
                    </p>
                    
                    <button className={`w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3 transition-colors ${isLive ? 'bg-amber-600 text-white' : 'bg-white text-slate-900 hover:bg-slate-200'}`}>
                        {isLive ? (
                            <>
                                <Server className="animate-bounce" /> Processing Stream...
                            </>
                        ) : (
                            <>
                                <Zap className="text-amber-600" /> Initialize System
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Quick Simulation Panel */}
             <div 
                onClick={loadDemoData}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-amber-300 transition-all cursor-pointer group flex items-center justify-between shadow-sm hover:shadow-md"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                        <PlayCircle size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg">Load Synthetic Training Data</h4>
                        <p className="text-slate-500 text-sm">Run analysis on a pre-compiled dataset of 100+ transactions.</p>
                    </div>
                </div>
                <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    Run Simulation
                </div>
            </div>
        </div>

        {/* Right Column: File Upload */}
        <div className="lg:col-span-1">
             <div className="h-full bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col relative overflow-hidden">
                <div className="mb-6">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Upload size={18} className="text-slate-400" /> Manual Ingest
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Upload encrypted CSV ledgers.</p>
                </div>

                <div className="flex-1 border-2 border-dashed border-slate-300 rounded-xl bg-white flex flex-col items-center justify-center text-center p-6 hover:border-amber-400 hover:bg-amber-50/10 transition-colors relative group">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        disabled={isProcessing}
                    />
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <FileText size={24} className="text-slate-400 group-hover:text-amber-600" />
                    </div>
                    <p className="font-bold text-slate-700">Drop CSV File</p>
                    <p className="text-xs text-slate-400 mt-2">Max size: 50MB</p>
                </div>

                <div className="mt-6 space-y-3">
                     <div className="flex items-center gap-2 text-xs text-slate-400">
                        <ShieldCheck size={12} className="text-green-500" /> AES-256 Encrypted
                     </div>
                     <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Server size={12} className="text-slate-400" /> Local Processing
                     </div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};