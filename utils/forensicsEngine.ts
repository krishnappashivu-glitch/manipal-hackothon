import { Transaction, WalletAnalysis, WalletRole, AnalysisResult, GraphNode, GraphLink, DataSourceType } from '../types';

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

  // Simulated Blockchain API Ingestion
  static async fetchLiveBlockData(startBlock: number): Promise<Transaction[]> {
    // In a real production system, this would call:
    // const provider = new ethers.JsonRpcProvider(RPC_URL);
    // const block = await provider.getBlockWithTransactions(startBlock);
    
    // Simulating API latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generating synthetic "Live" data
    const txCount = Math.floor(Math.random() * 20) + 5;
    const transactions: Transaction[] = [];
    const now = new Date().toISOString();
    
    for(let i=0; i<txCount; i++) {
        const isSmurfing = Math.random() > 0.7;
        const from = isSmurfing ? `0xLiveSmurfSource_${Math.floor(Math.random()*5)}` : `0xUser_${Math.floor(Math.random()*100)}`;
        const to = isSmurfing ? `0xLiveMule_${Math.floor(Math.random()*10)}` : `0xExchange_${Math.floor(Math.random()*5)}`;
        
        transactions.push({
            tx_id: `0x${Math.random().toString(16).substring(2)}`,
            from_wallet: from,
            to_wallet: to,
            amount: Math.random() * 1000,
            timestamp: now,
            token: 'ETH',
            blockNumber: startBlock
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
        return {
            address,
            role: WalletRole.NORMAL,
            suspicionScore: 0,
            flags: [],
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
        const flags: string[] = [];
        let role = WalletRole.NORMAL;

        // Fan-Out Detection
        if (wallet.outDegree >= 3 && wallet.inDegree <= 1) {
            role = WalletRole.SOURCE;
            flags.push(`Fan-Out Pattern: Distributes funds to ${wallet.outDegree} distinct entities.`);
        }
        
        // Fan-In Detection
        else if (wallet.inDegree >= 3 && wallet.outDegree <= 1) {
            role = WalletRole.AGGREGATOR;
            flags.push(`Fan-In Pattern: Collects funds from ${wallet.inDegree} distinct entities.`);
        }

        // Mule/Layering Detection
        else if (wallet.inDegree > 0 && wallet.outDegree > 0) {
            const flowRatio = wallet.totalSent / (wallet.totalReceived || 1);
            if (flowRatio > 0.9 && flowRatio < 1.1) {
                role = WalletRole.MULE;
                flags.push(`Passthrough Pattern: Relays ~${(flowRatio * 100).toFixed(0)}% of incoming funds.`);
            }
        }

        wallet.role = role;
        wallet.flags = flags;
    }
}

// =========================================================
// AGENT 4: RISK SCORING AGENT
// Responsibilities: Quantitative Risk Assessment
// =========================================================
class RiskScoringAgent {
    static score(wallet: WalletAnalysis) {
        let score = 0;
        
        if (wallet.role === WalletRole.SOURCE) score += 0.7;
        if (wallet.role === WalletRole.AGGREGATOR) score += 0.8;
        if (wallet.role === WalletRole.MULE) score += 0.6;

        // Velocity Modifier
        if (wallet.outDegree + wallet.inDegree > 20) score += 0.15;
        
        // Volume Modifier (Simplified)
        if (wallet.totalSent > 10000) score += 0.1;

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
        
        if (wallet.role === WalletRole.NORMAL) {
            narrative += "standard transactional behavior consistent with retail user activity. No anomalies detected.";
            wallet.confidenceScore = 0.95;
        } else {
            narrative += `high-risk behavior characterized as ${wallet.role.toUpperCase()}. `;
            narrative += `The entity engaged in ${wallet.transactions.length} transactions with a total volume of ${wallet.totalSent + wallet.totalReceived}. `;
            
            if (wallet.role === WalletRole.MULE) {
                narrative += "This pattern strongly suggests a layering stage in a money laundering typology, acting as an intermediary hop.";
            } else if (wallet.role === WalletRole.SOURCE) {
                narrative += "This resembles a placement or dispersion strategy (Fan-Out), often used to break large sums into less detectable amounts.";
            } else if (wallet.role === WalletRole.AGGREGATOR) {
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
        sourceType
    };
};

export const generateDummyCSV = () => {
  const header = "tx_id,from_wallet,to_wallet,amount,timestamp,token\n";
  const rows = [
    "tx_1,Source_Alpha,Mule_A,1000,2023-10-27T10:00:00Z,USDT",
    "tx_2,Source_Alpha,Mule_B,1000,2023-10-27T10:05:00Z,USDT",
    "tx_3,Source_Alpha,Mule_C,1000,2023-10-27T10:10:00Z,USDT",
    "tx_4,Mule_A,Aggregator_Omega,995,2023-10-27T11:00:00Z,USDT",
    "tx_5,Mule_B,Aggregator_Omega,995,2023-10-27T11:05:00Z,USDT",
    "tx_6,Mule_C,Aggregator_Omega,995,2023-10-27T11:10:00Z,USDT",
    "tx_7,Civilian_Bob,Civilian_Alice,50,2023-10-27T12:00:00Z,USDT",
    "tx_8,Civilian_Alice,Shop_X,50,2023-10-27T14:00:00Z,USDT"
  ];
  return header + rows.join("\n");
};