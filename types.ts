export interface Transaction {
  tx_id: string;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  timestamp: string; // ISO string
  token: string;
}

export enum WalletRole {
  NORMAL = 'Normal',
  SOURCE = 'Source', // Initiates fan-out
  MULE = 'Mule', // Layering / Pass-through
  AGGREGATOR = 'Aggregator', // Fan-in collection
}

export interface WalletAnalysis {
  address: string;
  role: WalletRole;
  suspicionScore: number; // 0 to 1
  flags: string[]; // Human readable reasons
  inDegree: number;
  outDegree: number;
  totalSent: number;
  totalReceived: number;
  transactions: Transaction[]; // Related transactions
}

export interface GraphNode {
  id: string;
  role: WalletRole;
  val: number; // for visualization size
  analysis: WalletAnalysis;
  // d3 SimulationNodeDatum properties
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  amount: number;
  // d3 SimulationLinkDatum properties
  index?: number;
}

export interface AnalysisResult {
  wallets: Record<string, WalletAnalysis>;
  transactions: Transaction[];
  suspiciousCount: number;
  totalVolume: number;
  graphData: {
    nodes: GraphNode[];
    links: GraphLink[];
  };
}