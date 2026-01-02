
export interface StockData {
  tickers: string[];
  priceData: Record<string, (number | null)[]>;
  dates: string[];
}

export interface PortfolioParams {
  maxStockCount: number;
  maxSingleWeight: number;
  minSingleWeight: number;
  strictMode: boolean;
  cagrThreshold: number;
  sharpeThreshold: number;
  maxDDThreshold: number;
}

export interface PriorityStockConfig {
  ticker: string | null;
  minWeight: number;
  maxWeight: number;
}

export interface HedgeConfig {
  enabled: boolean;
  shortMAPeriod: number;
  longMAPeriod: number;
  reentryStrategy: 'golden_cross' | 'short_ma_rebound';
  signalTicker?: string | null; // New field for signal stock
}

export interface OptimizationSettings {
  simulations: number;
  maxStocks: number;
  maxWeight: number;
  minWeight: number;
  strictMode: boolean;
  cagrThreshold: number;
  sharpeThreshold: number;
  maxDDThreshold: number;
  targetCAGR: number;
  rebalanceMode: 'none' | 'quarterly' | 'dynamic';
  optimizeTarget: string;
  optimizationAlgorithm: string;
  priorityStockConfig: PriorityStockConfig;
  hedgeConfig: HedgeConfig;
  dynamicRebalanceThreshold: number;
  userPortfolio?: Record<string, number>;
}

export interface Metrics {
  cagr: number;
  volatility: number;
  maxDD: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  smoothness?: number;
  winRate?: number;
  targetCAGR?: number;
  totalReturn?: number;
  duration?: number;
  // New Stability Metrics
  symmetricUlcerIndex?: number;
  maxResidual?: number;
  maxRollingStdDev?: number;
  channelConsistency?: number;
}

export interface StockMetrics extends Metrics {
  returns: number[];
}

export interface MonthlyReturn {
  year: number;
  month: number;
  value: number;
}

export interface ScatterPoint {
    x: number; 
    y: number;
    weights: Record<string, number>;
    metrics: Metrics;
    score?: number;
    label?: string;
}

export interface OptimizationResult {
  weights: Record<string, number>;
  metrics: Metrics;
  stockMetrics: Record<string, StockMetrics>;
  aiComponents?: Record<string, number>;
  cashPeriods?: { start: number; end: number }[];
  scatterPoints?: ScatterPoint[]; 
  correlationMatrix?: number[][];
  monthlyReturns?: MonthlyReturn[];
  userPortfolioResult?: ScatterPoint;
}

export interface ProgressUpdate {
  type: 'progress' | 'complete' | 'error';
  workerId?: number;
  progress?: number;
  simCount?: number;
  validCount?: number;
  bestScore?: number;
  bestPortfolio?: OptimizationResult | null;
  message?: string;
  totalValidCount?: number;
  scatterChunk?: ScatterPoint[];
}

export enum Tab {
  Data = 'data',
  Params = 'params',
  Optimize = 'optimize',
  Results = 'results',
}