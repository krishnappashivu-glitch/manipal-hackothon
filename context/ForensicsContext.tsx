import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnalysisResult, WalletAnalysis } from '../types';
import { runForensicsAnalysis, parseCSV } from '../utils/forensicsEngine';

interface ForensicsContextType {
  data: AnalysisResult | null;
  processFile: (fileContent: string) => void;
  selectedWallet: WalletAnalysis | null;
  selectWallet: (address: string) => void;
  reset: () => void;
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

  const processFile = (fileContent: string) => {
    const transactions = parseCSV(fileContent);
    const result = runForensicsAnalysis(transactions);
    setData(result);
  };

  const selectWallet = (address: string) => {
    if (data && data.wallets[address]) {
      setSelectedWalletState(data.wallets[address]);
    }
  };

  const reset = () => {
    setData(null);
    setSelectedWalletState(null);
  };

  return (
    <ForensicsContext.Provider value={{ data, processFile, selectedWallet, selectWallet, reset }}>
      {children}
    </ForensicsContext.Provider>
  );
};