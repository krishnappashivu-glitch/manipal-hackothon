import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalysisResult, WalletAnalysis, AgentStatus, DataSourceType } from '../types';
import { DataIngestionAgent, runAgentPipeline } from '../utils/forensicsEngine';

interface ForensicsContextType {
  data: AnalysisResult | null;
  processFile: (fileContent: string) => Promise<void>;
  startLiveIngestion: () => Promise<void>;
  selectedWallet: WalletAnalysis | null;
  selectWallet: (address: string) => void;
  reset: () => void;
  pipelineStatus: AgentStatus[];
  isProcessing: boolean;
}

const ForensicsContext = createContext<ForensicsContextType | undefined>(undefined);

export const useForensics = () => {
  const context = useContext(ForensicsContext);
  if (!context) {
    throw new Error('useForensics must be used within a ForensicsProvider');
  }
  return context;
};

export const ForensicsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [selectedWallet, setSelectedWalletState] = useState<WalletAnalysis | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<AgentStatus[]>([]);

  const updateStatus = (name: string, status: AgentStatus['status'], message?: string) => {
    setPipelineStatus(prev => {
       const idx = prev.findIndex(p => p.name === name);
       if (idx >= 0) {
           const newStat = [...prev];
           newStat[idx] = { name, status, message };
           return newStat;
       }
       return [...prev, { name, status, message }];
    });
  };

  const processFile = async (fileContent: string) => {
    setIsProcessing(true);
    setPipelineStatus([
        { name: 'Data Ingestion Agent', status: 'PROCESSING', message: 'Parsing CSV...' },
        { name: 'Topology Agent', status: 'IDLE' },
        { name: 'Pattern Agent', status: 'IDLE' },
        { name: 'Risk & Reporting Agent', status: 'IDLE' },
    ]);

    try {
        await new Promise(r => setTimeout(r, 500)); // Simulate work
        const transactions = DataIngestionAgent.parseCSV(fileContent);
        
        updateStatus('Data Ingestion Agent', 'COMPLETED', `Ingested ${transactions.length} txs`);
        
        const result = await runAgentPipeline(transactions, 'CSV', (stage) => {
            if (stage.includes("Topology")) updateStatus('Topology Agent', 'PROCESSING', stage);
            if (stage.includes("Pattern")) {
                updateStatus('Topology Agent', 'COMPLETED');
                updateStatus('Pattern Agent', 'PROCESSING', stage);
            }
            if (stage.includes("Risk")) {
                updateStatus('Pattern Agent', 'COMPLETED');
                updateStatus('Risk & Reporting Agent', 'PROCESSING', stage);
            }
        });

        updateStatus('Risk & Reporting Agent', 'COMPLETED');
        setData(result);
    } catch (e) {
        console.error(e);
        updateStatus('Data Ingestion Agent', 'FAILED', 'Error processing file');
    } finally {
        setIsProcessing(false);
    }
  };

  const startLiveIngestion = async () => {
    setIsProcessing(true);
    setPipelineStatus([
        { name: 'Data Ingestion Agent', status: 'PROCESSING', message: 'Connecting to Blockchain Node...' },
        { name: 'Topology Agent', status: 'IDLE' },
        { name: 'Pattern Agent', status: 'IDLE' },
        { name: 'Risk & Reporting Agent', status: 'IDLE' },
    ]);

    try {
        // Simulate block fetch
        await new Promise(r => setTimeout(r, 1500));
        updateStatus('Data Ingestion Agent', 'PROCESSING', 'Fetching latest block data...');
        
        const transactions = await DataIngestionAgent.fetchLiveBlockData(18923044);
        updateStatus('Data Ingestion Agent', 'COMPLETED', `Streamed ${transactions.length} live txs`);
        
        const result = await runAgentPipeline(transactions, 'LIVE_ETH', (stage) => {
             // Simply update last active
             if (stage.includes("Topology")) updateStatus('Topology Agent', 'PROCESSING');
             else if (stage.includes("Reporting")) updateStatus('Risk & Reporting Agent', 'PROCESSING');
        });
        
        updateStatus('Topology Agent', 'COMPLETED');
        updateStatus('Pattern Agent', 'COMPLETED');
        updateStatus('Risk & Reporting Agent', 'COMPLETED');
        
        setData(result);
    } catch (e) {
        updateStatus('Data Ingestion Agent', 'FAILED', 'Connection Failed');
    } finally {
        setIsProcessing(false);
    }
  };

  const selectWallet = (address: string) => {
    if (data && data.wallets[address]) {
      setSelectedWalletState(data.wallets[address]);
    }
  };

  const reset = () => {
    setData(null);
    setSelectedWalletState(null);
    setPipelineStatus([]);
  };

  return (
    <ForensicsContext.Provider value={{ 
        data, 
        processFile, 
        startLiveIngestion, 
        selectedWallet, 
        selectWallet, 
        reset,
        pipelineStatus,
        isProcessing
    }}>
      {children}
    </ForensicsContext.Provider>
  );
};