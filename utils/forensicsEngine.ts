import { Transaction, WalletAnalysis, WalletRole, AnalysisResult, GraphNode, GraphLink } from '../types';

// Constants for heuristics
const TIME_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const HIGH_FAN_OUT_THRESHOLD = 3;
const HIGH_FAN_IN_THRESHOLD = 3;

export const parseCSV = (csvText: string): Transaction[] => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const transactions: Transaction[] = [];
  
  for (let i = 1; i < lines.length; i++) {
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
};

export const runForensicsAnalysis = (transactions: Transaction[]): AnalysisResult => {
  const walletMap: Record<string, WalletAnalysis> = {};
  let totalVolume = 0;

  // 1. Initialize Wallets & Aggregate Basic Stats
  transactions.forEach(tx => {
    totalVolume += tx.amount;

    if (!walletMap[tx.from_wallet]) {
      walletMap[tx.from_wallet] = createEmptyAnalysis(tx.from_wallet);
    }
    if (!walletMap[tx.to_wallet]) {
      walletMap[tx.to_wallet] = createEmptyAnalysis(tx.to_wallet);
    }

    const sender = walletMap[tx.from_wallet];
    const receiver = walletMap[tx.to_wallet];

    sender.outDegree++;
    sender.totalSent += tx.amount;
    sender.transactions.push(tx);

    receiver.inDegree++;
    receiver.totalReceived += tx.amount;
    receiver.transactions.push(tx);
  });

  // 2. Behavioral Analysis & Role Assignment
  Object.values(walletMap).forEach(wallet => {
    const flags: string[] = [];
    let score = 0;

    // Detect Fan-Out (Source)
    if (wallet.outDegree >= HIGH_FAN_OUT_THRESHOLD && wallet.inDegree <= 1) {
       // Check if sent within short window? (Simplified for this scope: just degree)
       wallet.role = WalletRole.SOURCE;
       score += 0.8;
       flags.push(`High fan-out detected: Sent to ${wallet.outDegree} distinct targets.`);
    }
    
    // Detect Fan-In (Aggregator)
    else if (wallet.inDegree >= HIGH_FAN_IN_THRESHOLD && wallet.outDegree <= 1) {
        wallet.role = WalletRole.AGGREGATOR;
        score += 0.8;
        flags.push(`High fan-in detected: Received from ${wallet.inDegree} distinct sources.`);
    }

    // Detect Mule (Pass-through)
    else if (wallet.inDegree > 0 && wallet.outDegree > 0) {
        // Check balance neutrality (what comes in ~ goes out)
        const flowRatio = wallet.totalSent / (wallet.totalReceived || 1);
        const isPassThrough = flowRatio > 0.9 && flowRatio < 1.1; // 10% margin due to fees
        
        if (isPassThrough) {
            wallet.role = WalletRole.MULE;
            score += 0.6;
            flags.push(`Pass-through behavior: Relayed ${(flowRatio * 100).toFixed(0)}% of funds received.`);
        }
    }

    // Adjust score based on volume/velocity
    if (wallet.outDegree > 10 || wallet.inDegree > 10) {
        score += 0.1;
        flags.push("High transaction velocity.");
    }

    wallet.suspicionScore = Math.min(score, 1);
    wallet.flags = flags;
  });

  // 3. Construct Graph Data
  const nodes: GraphNode[] = Object.values(walletMap).map(w => ({
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

  const suspiciousCount = Object.values(walletMap).filter(w => w.suspicionScore > 0.5).length;

  return {
    wallets: walletMap,
    transactions,
    suspiciousCount,
    totalVolume,
    graphData: { nodes, links }
  };
};

const createEmptyAnalysis = (address: string): WalletAnalysis => ({
  address,
  role: WalletRole.NORMAL,
  suspicionScore: 0,
  flags: [],
  inDegree: 0,
  outDegree: 0,
  totalSent: 0,
  totalReceived: 0,
  transactions: []
});

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