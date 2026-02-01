import { Transaction, WalletAnalysis, WalletRole, AnalysisResult, GraphNode, GraphLink, DataSourceType, LaunderingChain } from '../types';

// Known Exchange Addresses for labeling (Simulation/Enrichment)
const KNOWN_EXCHANGES: Record<string, string> = {
    '0xBinance_Hot_Wallet': 'Binance',
    '0xCoinbase_Prime': 'Coinbase',
    '0xKraken_Deposit': 'Kraken',
    '0xHuobi_Reserves': 'Huobi',
    'bc1_Binance_Cold': 'Binance (BTC)',
    'bc1_Coinbase_Hot': 'Coinbase (BTC)',
    '1Kraken_Deposit': 'Kraken (BTC)',
    // Add dummy mapping for real high-value nodes if identified (simplified)
    '1BoatSLRHtKNngkdXEeobR76b53LETtpyT': 'MiningPool' 
};

// =========================================================
// AGENT 1: DATA INGESTION AGENT
// Responsibilities: Normalization, CSV Parsing, API Polling
// =========================================================
export class DataIngestionAgent {
  
  static parseCSV(csvText: string): Transaction[] {
    const lines = csvText.trim().split('\n');
    // Skip header if present
    const startIndex = lines[0].startsWith('tx_id') ? 1 : 0;
    
    const transactions: Transaction[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 6) continue;
      
      transactions.push({
        tx_id: values[0],
        from_wallet: values[1],
        to_wallet: values[2],
        amount: parseFloat(values[3]),
        timestamp: values[4],
        token: values[5]
      });
    }
    return transactions;
  }

  // ETHEREUM: Simulated Live Stream
  static async fetchLiveEthBlock(): Promise<Transaction[]> {
    // Fast-path latency for high-speed ingestion
    await new Promise(r => setTimeout(r, 100));
    return this.generateSimulatedTraffic('ETH');
  }

  // BITCOIN: Simulated Live Stream
  static async fetchLiveBtcMempool(): Promise<Transaction[]> {
     // Fast-path latency for high-speed ingestion
     await new Promise(r => setTimeout(r, 100));
     return this.generateSimulatedTraffic('BTC');
  }

  // GLOBAL: Fetch Combined Traffic
  static async fetchLiveGlobalTraffic(): Promise<Transaction[]> {
    // Single latency penalty for fetching "both"
    await new Promise(r => setTimeout(r, 100));
    const ethTxs = this.generateSimulatedTraffic('ETH');
    const btcTxs = this.generateSimulatedTraffic('BTC');
    return [...ethTxs, ...btcTxs];
  }

  private static generateSimulatedTraffic(type: 'ETH' | 'BTC'): Transaction[] {
      const txCount = Math.floor(Math.random() * 5) + 3; // 3-8 txs per tick
      const transactions: Transaction[] = [];
      const now = new Date().toISOString();
      const prefix = type === 'ETH' ? '0x' : 'bc1_';

      // Probabilities
      const isExchangeFlow = Math.random() > 0.4;
      const isLaundering = Math.random() > 0.7;

      for(let i=0; i<txCount; i++) {
        let from, to, amount;

        if (isExchangeFlow) {
            const exchanges = type === 'ETH' 
                ? ['0xBinance_Hot_Wallet', '0xCoinbase_Prime', '0xOKX_Hot'] 
                : ['bc1_Binance_Cold', 'bc1_Coinbase_Hot', '1Kraken_Deposit'];
            
            const randomEx = exchanges[Math.floor(Math.random() * exchanges.length)];
            
            if (Math.random() > 0.5) {
                // Withdrawal
                from = randomEx;
                to = `${prefix}User_${Math.floor(Math.random()*1000)}`;
            } else {
                // Deposit
                from = `${prefix}User_${Math.floor(Math.random()*1000)}`;
                to = randomEx;
            }
            amount = Math.random() * (type === 'ETH' ? 50 : 5);
        } else if (isLaundering) {
            // Smurfing Pattern
            const smurfId = Math.floor(Math.random()*10);
            from = `${prefix}Smurf_Source_${smurfId}`;
            to = `${prefix}Mule_Layer_${Math.floor(Math.random()*20)}`;
            amount = (Math.random() * 10) + 90; // Just under reporting limits often
        } else {
            // Random
            from = `${prefix}Wallet_${Math.floor(Math.random()*500)}`;
            to = `${prefix}Wallet_${Math.floor(Math.random()*500)}`;
            amount = Math.random() * 2;
        }

        transactions.push({
            tx_id: `${prefix}${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
            from_wallet: from,
            to_wallet: to,
            amount: amount,
            timestamp: now,
            token: type
        });
      }
      return transactions;
  }
}

// =========================================================
// AGENT 2: TOPOLOGY AGENT
// Responsibilities: Graph Construction, Node Management
// =========================================================
class TopologyAgent {
    static buildGraph(transactions: Transaction[]): Record<string, WalletAnalysis> {
        const walletMap: Record<string, WalletAnalysis> = {};

        transactions.forEach(tx => {
            if (!walletMap[tx.from_wallet]) walletMap[tx.from_wallet] = this.createEmptyAnalysis(tx.from_wallet);
            if (!walletMap[tx.to_wallet]) walletMap[tx.to_wallet] = this.createEmptyAnalysis(tx.to_wallet);

            const sender = walletMap[tx.from_wallet];
            const receiver = walletMap[tx.to_wallet];

            sender.outDegree++;
            sender.totalSent += tx.amount;
            sender.transactions.push(tx);

            receiver.inDegree++;
            receiver.totalReceived += tx.amount;
            receiver.transactions.push(tx);
        });

        return walletMap;
    }

    private static createEmptyAnalysis(address: string): WalletAnalysis {
        // Auto-label exchanges
        const knownName = Object.keys(KNOWN_EXCHANGES).find(k => address.includes(k) || k === address);
        
        return {
            address,
            role: WalletRole.NORMAL,
            suspicionScore: 0,
            flags: knownName ? [`Identified Entity: ${KNOWN_EXCHANGES[knownName]}`] : [],
            agentExplanation: '',
            confidenceScore: 0,
            inDegree: 0,
            outDegree: 0,
            totalSent: 0,
            totalReceived: 0,
            transactions: [],
            riskLevel: 'LOW'
        };
    }
}

// =========================================================
// AGENT 3: PATTERN DETECTION AGENT
// Responsibilities: Smurfing, Layering, Structural Analysis
// =========================================================
class PatternDetectionAgent {
    static analyze(wallet: WalletAnalysis) {
        // Skip if known exchange (whitelisted essentially, though we track flow)
        if (wallet.flags.some(f => f.includes('Identified Entity'))) {
            wallet.role = WalletRole.DESTINATION; // Exchanges are technically destinations
            wallet.riskLevel = 'LOW';
            return;
        }

        const flags: string[] = [];
        let role = WalletRole.NORMAL;

        // Fan-Out Detection
        if (wallet.outDegree >= 3 && wallet.inDegree <= 1) {
            role = WalletRole.SOURCE;
            flags.push(`Fan-Out Pattern: Distributes funds to ${wallet.outDegree} distinct entities.`);
        }
        
        // Fan-In Detection
        else if (wallet.inDegree >= 3 && wallet.outDegree <= 1) {
            role = WalletRole.DESTINATION;
            flags.push(`Fan-In Pattern: Collects funds from ${wallet.inDegree} distinct entities.`);
        }

        // Mule/Layering Detection
        else if (wallet.inDegree > 0 && wallet.outDegree > 0) {
            const flowRatio = wallet.totalSent / (wallet.totalReceived || 1);
            if (flowRatio > 0.9 && flowRatio < 1.1) {
                // Temporal Analysis
                const sortedTx = [...wallet.transactions].sort((a,b) => 
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );

                let rapidRelayCount = 0;
                
                // Iterate transactions to find IN -> OUT patterns within < 1 hour
                for (let i = 0; i < sortedTx.length; i++) {
                    const inTx = sortedTx[i];
                    if (inTx.to_wallet === wallet.address) {
                        for (let j = i + 1; j < sortedTx.length; j++) {
                            const outTx = sortedTx[j];
                            if (outTx.from_wallet === wallet.address) {
                                const diff = new Date(outTx.timestamp).getTime() - new Date(inTx.timestamp).getTime();
                                if (diff < 3600000) { 
                                    rapidRelayCount++;
                                    break; 
                                } 
                            }
                        }
                    }
                }
                
                if (rapidRelayCount > 0) {
                    flags.push(`High Velocity: ${rapidRelayCount} fund relays occurred within <1 hour.`);
                }

                role = WalletRole.MULE;
                flags.push(`Passthrough Pattern: Relays ~${(flowRatio * 100).toFixed(0)}% of incoming funds.`);
            }
        }

        wallet.role = role;
        wallet.flags = [...wallet.flags, ...flags];
    }
}

// =========================================================
// AGENT 4: RISK SCORING AGENT
// Responsibilities: Quantitative Risk Assessment
// =========================================================
class RiskScoringAgent {
    static score(wallet: WalletAnalysis) {
        if (wallet.flags.some(f => f.includes('Identified Entity'))) {
            wallet.suspicionScore = 0;
            return;
        }

        let score = 0;
        
        if (wallet.role === WalletRole.SOURCE) score += 0.7;
        if (wallet.role === WalletRole.DESTINATION) score += 0.8;
        if (wallet.role === WalletRole.MULE) score += 0.6;

        // Velocity Modifier
        if (wallet.outDegree + wallet.inDegree > 20) score += 0.15;
        
        // Volume Modifier (Simplified)
        if (wallet.totalSent > 10000) score += 0.1;
        
        // Check for specific flags to boost score
        if (wallet.flags.some(f => f.includes('High Velocity'))) score += 0.15;

        wallet.suspicionScore = Math.min(score, 1);
        
        if (wallet.suspicionScore < 0.3) wallet.riskLevel = 'LOW';
        else if (wallet.suspicionScore < 0.6) wallet.riskLevel = 'MEDIUM';
        else if (wallet.suspicionScore < 0.9) wallet.riskLevel = 'HIGH';
        else wallet.riskLevel = 'CRITICAL';
    }
}

// =========================================================
// AGENT 5: EXPLANATION AGENT
// Responsibilities: Natural Language Generation
// =========================================================
class ReportingAgent {
    static generateReport(wallet: WalletAnalysis) {
        let narrative = `Analysis of wallet ${wallet.address.substring(0,8)}... indicates `;
        
        const isExchange = wallet.flags.some(f => f.includes('Identified Entity'));

        if (isExchange) {
            narrative = `This address is a known entity (${wallet.flags[0]}). High volume is expected. Monitored for illicit inflows.`;
            wallet.confidenceScore = 1.0;
        } else if (wallet.role === WalletRole.NORMAL) {
            narrative += "standard transactional behavior consistent with retail user activity. No anomalies detected.";
            wallet.confidenceScore = 0.95;
        } else {
            narrative += `high-risk behavior characterized as ${wallet.role.toUpperCase()}. `;
            narrative += `The entity engaged in ${wallet.transactions.length} transactions with a total volume of ${wallet.totalSent + wallet.totalReceived}. `;
            
            if (wallet.role === WalletRole.MULE) {
                narrative += "This pattern strongly suggests a layering stage in a money laundering typology, acting as an intermediary hop.";
                if (wallet.flags.some(f => f.includes('High Velocity'))) {
                    narrative += " Timestamps indicate rapid movement of funds (<1h latency), typical of automated smurfing scripts.";
                }
            } else if (wallet.role === WalletRole.SOURCE) {
                narrative += "This resembles a placement or dispersion strategy (Fan-Out), often used to break large sums into less detectable amounts.";
            } else if (wallet.role === WalletRole.DESTINATION) {
                narrative += "This indicates an integration point (Fan-In), where laundered funds are re-aggregated.";
            }
            wallet.confidenceScore = 0.85 + (wallet.suspicionScore * 0.1);
        }
        
        wallet.agentExplanation = narrative;
    }
}

// =========================================================
// MAIN ORCHESTRATOR
// =========================================================
export const runAgentPipeline = async (
    transactions: Transaction[], 
    sourceType: DataSourceType,
    onProgress?: (stage: string) => void
): Promise<AnalysisResult> => {
    
    let totalVolume = 0;
    transactions.forEach(t => totalVolume += t.amount);

    if (onProgress) onProgress("Topology Agent: Constructing Graph...");
    // 1. Build Graph
    const walletMap = TopologyAgent.buildGraph(transactions);
    
    // Run Analysis on all wallets
    const wallets = Object.values(walletMap);
    
    if (onProgress) onProgress("Pattern Agent: Detecting Typologies...");
    // 2. Pattern Detection
    wallets.forEach(w => PatternDetectionAgent.analyze(w));
    
    if (onProgress) onProgress("Risk Agent: Calculating Scores...");
    // 3. Risk Scoring
    wallets.forEach(w => RiskScoringAgent.score(w));
    
    if (onProgress) onProgress("Reporting Agent: Generating Narratives...");
    // 4. Generate Reports
    wallets.forEach(w => ReportingAgent.generateReport(w));

    // --- Feature: Global Flow Chain Analysis ---
    // Detect connected components of suspicious wallets to form "Laundering Chains"
    const suspiciousWallets = wallets.filter(w => w.role !== WalletRole.NORMAL && !w.flags.some(f => f.includes('Identified Entity')));
    const suspiciousAddrs = new Set(suspiciousWallets.map(w => w.address));
    const visited = new Set<string>();
    const launderingChains: LaunderingChain[] = [];

    // Find connected components in the suspicious subgraph
    for (const w of suspiciousWallets) {
        if (visited.has(w.address)) continue;

        const chainNodeIds: string[] = [];
        const queue = [w.address];
        visited.add(w.address);

        while (queue.length > 0) {
            const currId = queue.shift()!;
            chainNodeIds.push(currId);
            const currWallet = walletMap[currId];

            // Traverse connected suspicious neighbors
            currWallet.transactions.forEach(tx => {
                const neighbor = tx.from_wallet === currId ? tx.to_wallet : tx.from_wallet;
                if (suspiciousAddrs.has(neighbor)) {
                    if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push(neighbor);
                    }
                }
            });
        }
        
        // Calculate total flow volume within this chain
        const chainSet = new Set(chainNodeIds);
        const chainVolume = transactions
            .filter(tx => chainSet.has(tx.from_wallet) && chainSet.has(tx.to_wallet))
            .reduce((sum, tx) => sum + tx.amount, 0);

        if (chainNodeIds.length > 1 || chainVolume > 0) {
             launderingChains.push({
                 id: launderingChains.length + 1,
                 volume: chainVolume,
                 wallets: chainNodeIds
             });
        }
    }
    // -------------------------------------------

    // 5. Format Output
    const nodes: GraphNode[] = wallets.map(w => ({
        id: w.address,
        role: w.role,
        val: Math.sqrt(w.totalReceived + w.totalSent) + 1,
        analysis: w
    }));

    const links: GraphLink[] = transactions.map(tx => ({
        source: tx.from_wallet,
        target: tx.to_wallet,
        amount: tx.amount
    }));

    const suspiciousCount = wallets.filter(w => w.suspicionScore > 0.5).length;

    return {
        wallets: walletMap,
        transactions,
        suspiciousCount,
        totalVolume,
        graphData: { nodes, links },
        timestamp: new Date().toISOString(),
        sourceType,
        launderingChains // New field
    };
};

export const generateDummyCSV = () => {
  const header = "tx_id,from_wallet,to_wallet,amount,timestamp,token\n";
  const rows = [
    // Chain 1: Temporal High Velocity
    "tx_1,Source_Alpha,Mule_A,1000,2023-10-27T10:00:00Z,USDT",
    "tx_2,Source_Alpha,Mule_B,1000,2023-10-27T10:05:00Z,USDT",
    "tx_3,Source_Alpha,Mule_C,1000,2023-10-27T10:10:00Z,USDT",
    "tx_4,Mule_A,Destination_Omega,995,2023-10-27T10:30:00Z,USDT", // < 1h from tx_1
    "tx_5,Mule_B,Destination_Omega,995,2023-10-27T10:35:00Z,USDT", // < 1h from tx_2
    "tx_6,Mule_C,Destination_Omega,995,2023-10-27T11:50:00Z,USDT", // > 1h from tx_3 (1h40m)
    
    // Normal traffic
    "tx_7,Civilian_Bob,Civilian_Alice,50,2023-10-27T12:00:00Z,USDT",
    "tx_8,Civilian_Alice,Shop_X,50,2023-10-27T14:00:00Z,USDT"
  ];
  return header + rows.join("\n");
};