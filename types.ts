
export type DataSourceType = 'CSV' | 'LIVE_ETH' | 'LIVE_BTC' | 'LIVE_GLOBAL';

export interface Transaction {
  tx_id: string;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  timestamp: string; // ISO string
  token: string;
  blockNumber?: number; // For live data
}

export enum WalletRole {
  NORMAL = 'Normal',
  SOURCE = 'Source', 
  MULE = 'Mule', 
  DESTINATION = 'Destination',
}

export interface WalletAnalysis {
  address: string;
  role: WalletRole;
  suspicionScore: number; // 0 to 1
  flags: string[]; 
  agentExplanation: string; // New: Agent generated narrative
  confidenceScore: number; // New: Agent confidence
  inDegree: number;
  outDegree: number;
  totalSent: number;
  totalReceived: number;
  transactions: Transaction[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface GraphNode {
  id: string;
  role: WalletRole;
  val: number; 
  analysis: WalletAnalysis;
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
  index?: number;
}

export interface AgentStatus {
  name: string;
  status: 'IDLE' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message?: string;
  progress?: number;
}

export interface LaunderingChain {
  id: number;
  volume: number;
  wallets: string[];
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
  timestamp: string;
  sourceType: DataSourceType;
  launderingChains: LaunderingChain[];
}

export interface FilterOptions {
  minScore: number;
  showNormal: boolean;
  minAmount: number;
  token?: string;
}