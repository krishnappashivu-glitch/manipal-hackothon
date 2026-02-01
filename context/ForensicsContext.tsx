import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import { AnalysisResult, WalletAnalysis, AgentStatus, Transaction } from '../types';
import { DataIngestionAgent, runAgentPipeline } from '../utils/forensicsEngine';

interface ForensicsContextType {
  data: AnalysisResult | null;
  processFile: (fileContent: string) => Promise<void>;
  selectedWallet: WalletAnalysis | null;
  selectWallet: (address: string) => void;
  reset: () => void;
  pipelineStatus: AgentStatus[];
  isProcessing: boolean;
  toggleLiveStream: (type: 'ETH' | 'BTC' | 'GLOBAL') => Promise<void>;
  stopLiveStream: () => void;
  isLive: boolean;
  liveType: 'ETH' | 'BTC' | 'GLOBAL' | null;
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
  
  // Live Stream State
  const [isLive, setIsLive] = useState(false);
  const [liveType, setLiveType] = useState<'ETH' | 'BTC' | 'GLOBAL' | null>(null);
  const liveIntervalRef = useRef<number | null>(null);
  
  const currentTransactionsRef = useRef<Transaction[]>([]);

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
    stopLiveStream(); // Ensure live stream is off
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
        currentTransactionsRef.current = transactions;
        
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

  const stopLiveStream = () => {
    if (liveIntervalRef.current) {
        window.clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
    }
    setIsLive(false);
    setLiveType(null);
    setIsProcessing(false);
  };

  const toggleLiveStream = async (type: 'ETH' | 'BTC' | 'GLOBAL') => {
      if (isLive && liveType === type) {
          stopLiveStream();
          return;
      }

      if (liveIntervalRef.current) window.clearInterval(liveIntervalRef.current);

      setIsLive(true);
      setLiveType(type);
      setIsProcessing(true); // Only blocking for the very first fetch
      
      // Reset for fresh stream
      setData(null);
      currentTransactionsRef.current = [];

      let networkName = type === 'GLOBAL' ? 'Multi-Chain' : type;

      setPipelineStatus([
        { name: 'Data Ingestion Agent', status: 'PROCESSING', message: `Connecting to ${networkName} Network...` },
        { name: 'Topology Agent', status: 'IDLE' },
        { name: 'Pattern Agent', status: 'IDLE' },
        { name: 'Risk & Reporting Agent', status: 'IDLE' },
      ]);

      const fetchAndProcess = async () => {
          try {
              let newTxs: Transaction[] = [];
              if (type === 'ETH') {
                  newTxs = await DataIngestionAgent.fetchLiveEthBlock();
              } else if (type === 'BTC') {
                  newTxs = await DataIngestionAgent.fetchLiveBtcMempool();
              } else {
                  // Global / Combined Type
                  newTxs = await DataIngestionAgent.fetchLiveGlobalTraffic();
              }

              if (newTxs.length > 0) {
                  // Rolling window of 300 txs for better density
                  const current = currentTransactionsRef.current;
                  const existingIds = new Set(current.map(t => t.tx_id));
                  const uniqueNew = newTxs.filter(t => !existingIds.has(t.tx_id));
                  
                  if (uniqueNew.length > 0) {
                    const combined = [...current, ...uniqueNew].slice(-300);
                    currentTransactionsRef.current = combined;

                    // Update status text but don't block
                    updateStatus('Data Ingestion Agent', 'PROCESSING', `Stream Active: ${combined.length} txs`);
                    
                    let sourceType: any = type === 'GLOBAL' ? 'LIVE_GLOBAL' : (type === 'ETH' ? 'LIVE_ETH' : 'LIVE_BTC');

                    const result = await runAgentPipeline(combined, sourceType);
                    setData(result);
                    updateStatus('Risk & Reporting Agent', 'COMPLETED', `Updated: ${new Date().toLocaleTimeString()}`);
                    
                    // CRITICAL: Unblock UI after first data set is ready so user can see simultaneous analysis
                    setIsProcessing(false);
                  }
              }
          } catch (e) {
              console.error("Stream error", e);
              updateStatus('Data Ingestion Agent', 'FAILED', 'Stream Interrupted');
              setIsProcessing(false); // Ensure we don't get stuck in loading
          }
      };

      // Initial fetch
      await fetchAndProcess();
      // Poll rapidly every 1.2s for "simultaneous" feel
      liveIntervalRef.current = window.setInterval(fetchAndProcess, 1200);
  };

  const selectWallet = (address: string) => {
    if (data && data.wallets[address]) {
      setSelectedWalletState(data.wallets[address]);
    }
  };

  const reset = () => {
    stopLiveStream();
    setData(null);
    setSelectedWalletState(null);
    setPipelineStatus([]);
    currentTransactionsRef.current = [];
  };

  // Cleanup on unmount
  useEffect(() => {
      return () => {
          if (liveIntervalRef.current) window.clearInterval(liveIntervalRef.current);
      }
  }, []);

  return (
    <ForensicsContext.Provider value={{ 
        data, 
        processFile, 
        selectedWallet, 
        selectWallet, 
        reset,
        pipelineStatus,
        isProcessing,
        toggleLiveStream,
        stopLiveStream,
        isLive,
        liveType
    }}>
      {children}
    </ForensicsContext.Provider>
  );
};