import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ForensicsProvider } from './context/ForensicsContext';
import { Layout } from './components/Layout';
import { UploadPage } from './pages/UploadPage';
import { AnalysisOverviewPage } from './pages/AnalysisOverviewPage';
import { LaunderingGraphPage } from './pages/LaunderingGraphPage';
import { WalletDetailsPage } from './pages/WalletDetailsPage';

const App = () => {
  return (
    <ForensicsProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route path="/analysis" element={<AnalysisOverviewPage />} />
            <Route path="/graph" element={<LaunderingGraphPage />} />
            <Route path="/wallet/:id" element={<WalletDetailsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ForensicsProvider>
  );
};

export default App;