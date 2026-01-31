import React, { useState } from 'react';
import { Upload, FileText, AlertTriangle, Blocks, Activity, CheckCircle2 } from 'lucide-react';
import { useForensics } from '../context/ForensicsContext';
import { useNavigate } from 'react-router-dom';
import { generateDummyCSV } from '../utils/forensicsEngine';

export const UploadPage = () => {
  const { processFile, startLiveIngestion, isProcessing } = useForensics();
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

  const handleLiveConnect = async () => {
      await startLiveIngestion();
      navigate('/analysis');
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">ChainSleuth AI <span className="text-amber-500">Forensics</span></h2>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Deploy autonomous agents to detect money laundering, smurfing, and layering typologies across blockchain networks.
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-zinc-900 p-1 rounded-xl border border-zinc-800 flex gap-1">
            <button 
                onClick={() => setActiveTab('upload')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'upload' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
                <FileText size={16} /> Historical Analysis (CSV)
            </button>
            <button 
                onClick={() => setActiveTab('live')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'live' ? 'bg-orange-900/30 text-orange-300 border border-orange-500/30' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
                <Blocks size={16} /> Live Blockchain Stream
            </button>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 min-h-[400px] flex flex-col justify-center">
        {activeTab === 'upload' ? (
            <div className="space-y-8">
                <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-12 text-center hover:border-amber-500/50 transition-colors group relative overflow-hidden bg-zinc-900/50">
                    <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isProcessing}
                    />
                    
                    <div className="flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                        {isProcessing ? <Activity className="animate-spin text-amber-500" /> : <Upload className="text-amber-500" size={32} />}
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-white">Upload Transaction Log</h3>
                        <p className="text-zinc-500 mt-2">
                        Supported: Standard CSV, Etherscan Exports
                        </p>
                    </div>
                    <button className="mt-4 px-6 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700 transition-colors z-20 pointer-events-none">
                        {isProcessing ? 'Agents Analyzing...' : 'Select File'}
                    </button>
                    </div>
                </div>

                <div className="flex justify-center">
                    <button 
                    onClick={loadDemoData}
                    disabled={isProcessing}
                    className="text-sm text-amber-500 hover:text-amber-400 flex items-center gap-2 underline underline-offset-4"
                    >
                    <FileText size={16} /> Or load synthetic training data
                    </button>
                </div>
            </div>
        ) : (
            <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-orange-900/20 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
                    <Blocks className="text-orange-500" size={40} />
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white">Connect to Mainnet</h3>
                    <p className="text-zinc-400 mt-2 max-w-md mx-auto">
                        Stream blocks directly from Ethereum/Polygon RPC nodes. 
                        The Data Ingestion Agent will filter for suspicious patterns in real-time.
                    </p>
                </div>
                
                <div className="bg-zinc-900 max-w-md mx-auto rounded-lg p-4 text-left border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                        <CheckCircle2 size={16} className="text-green-500" /> Ethereum (Infura/Alchemy)
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                        <CheckCircle2 size={16} className="text-green-500" /> Polygon PoS
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                        <div className="w-4 h-4 rounded-full border border-zinc-600" /> Bitcoin (Coming Soon)
                    </div>
                </div>

                <button 
                    onClick={handleLiveConnect}
                    disabled={isProcessing}
                    className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black rounded-lg font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Establishing Uplink...' : 'Start Live Monitor'}
                </button>
            </div>
        )}
      </div>

      <div className="mt-8 flex gap-4 justify-center text-xs text-zinc-500">
        <span className="flex items-center gap-1"><AlertTriangle size={12} /> Local Processing Only</span>
        <span>•</span>
        <span>AES-256 Encrypted State</span>
        <span>•</span>
        <span>Zero-Knowledge Proof Ready</span>
      </div>
    </div>
  );
};