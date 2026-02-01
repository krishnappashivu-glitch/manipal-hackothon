import React, { useState } from 'react';
import { Upload, FileText, AlertTriangle, Activity, Globe, Zap, Radio, Server } from 'lucide-react';
import { useForensics } from '../context/ForensicsContext';
import { useNavigate } from 'react-router-dom';
import { generateDummyCSV } from '../utils/forensicsEngine';

export const UploadPage = () => {
  const { processFile, isProcessing, toggleLiveStream, isLive, liveType, stopLiveStream } = useForensics();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upload' | 'live'>('upload');

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
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">THE FAULT <span className="text-amber-600">HUNTER</span></h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Deploy autonomous agents to detect money laundering, smurfing, and layering typologies across blockchain networks.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-200 p-1 rounded-xl flex gap-1 border border-slate-300">
            <button 
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Upload Data
            </button>
            <button 
                onClick={() => setActiveTab('live')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Radio size={14} className={activeTab === 'live' ? "text-amber-600 animate-pulse" : ""} /> Live Stream
            </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 min-h-[400px] flex flex-col justify-center relative overflow-hidden shadow-sm">
            {activeTab === 'upload' ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-amber-500/50 transition-colors group relative overflow-hidden bg-slate-50">
                        <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={isProcessing}
                        />
                        
                        <div className="flex flex-col items-center justify-center gap-4">
                        <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center group-hover:bg-slate-50 transition-colors shadow-sm">
                            {isProcessing ? <Activity className="animate-spin text-amber-600" /> : <Upload className="text-amber-600" size={32} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-slate-900">Upload Transaction Log</h3>
                            <p className="text-slate-500 mt-2">
                            Supported: Standard CSV, Etherscan Exports
                            </p>
                        </div>
                        <button className="mt-4 px-6 py-2 bg-slate-900 text-slate-100 rounded-lg text-sm hover:bg-slate-800 transition-colors z-20 pointer-events-none shadow-lg">
                            {isProcessing ? 'Agents Analyzing...' : 'Select File'}
                        </button>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button 
                        onClick={loadDemoData}
                        disabled={isProcessing}
                        className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-2 underline underline-offset-4 font-medium"
                        >
                        <FileText size={16} /> Or load synthetic training data
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                     {/* Global Monitor Card */}
                    <div 
                        onClick={handleGlobalStream}
                        className={`w-full max-w-2xl relative group cursor-pointer border rounded-2xl p-8 transition-all ${isLive ? 'bg-amber-50 border-amber-200 shadow-xl shadow-amber-900/5' : 'bg-slate-50 border-slate-200 hover:border-amber-500/30'}`}
                    >
                        {isLive && <div className="absolute top-6 right-6 flex items-center gap-2 text-sm text-amber-700 font-bold"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span> SURVEILLANCE ACTIVE</div>}
                        
                        <div className="flex items-center gap-6 mb-6">
                             <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors border ${isLive ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-white border-slate-200 text-slate-400 group-hover:text-slate-600'}`}>
                                <Server size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Global Network Surveillance</h3>
                                <div className="flex items-center gap-3 mt-2 text-slate-500 text-sm">
                                    <span className="flex items-center gap-1"><Zap size={14} className="text-indigo-500" /> Ethereum</span>
                                    <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                    <span className="flex items-center gap-1"><Globe size={14} className="text-orange-500" /> Bitcoin</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-slate-600 text-base mb-8 leading-relaxed">
                            Initialize a high-frequency, multi-threaded connection to global RPC nodes. This mode aggregates mempool data and block propagation from both Ethereum and Bitcoin networks simultaneously, allowing for cross-chain correlation analysis in real-time.
                        </p>
                        
                        <div className="flex gap-4">
                             <button className={`flex-1 py-3 rounded-xl text-base font-bold border transition-colors ${isLive ? 'bg-amber-500 border-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'}`}>
                                {isLive ? 'System Monitoring...' : 'Initialize Global Monitor'}
                             </button>
                        </div>
                    </div>
                    
                    {/* Active Stream Controls */}
                    {isLive && (
                        <div className="mt-8 flex justify-center gap-4 animate-in fade-in">
                            <button 
                                onClick={(e) => { e.stopPropagation(); navigate('/analysis'); }}
                                className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-xl"
                            >
                                <Activity size={18} /> View Mission Control
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); stopLiveStream(); }}
                                className="px-8 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 rounded-xl transition-colors shadow-sm"
                            >
                                Abort Stream
                            </button>
                        </div>
                    )}
                </div>
            )}
      </div>

      <div className="mt-8 flex gap-4 justify-center text-xs text-slate-400">
        <span className="flex items-center gap-1"><AlertTriangle size={12} /> Local Processing Only</span>
        <span>•</span>
        <span>AES-256 Encrypted State</span>
        <span>•</span>
        <span>Zero-Knowledge Proof Ready</span>
      </div>
    </div>
  );
};