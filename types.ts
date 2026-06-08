export type AssetSymbol = "WTI" | "Brent";

export interface Position {
  id: string;
  symbol: AssetSymbol;
  side: "LONG" | "SHORT";
  entryPrice: number;
  currentPrice: number;
  sizeBarrels: number; // e.g. 50,000 barrels
  leverage: number; // 1x to 50x
  marginUsed: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime: string;
}

export interface TradeHistory {
  id: string;
  symbol: AssetSymbol;
  side: "LONG" | "SHORT";
  entryPrice: number;
  exitPrice: number;
  sizeBarrels: number;
  leverage: number;
  realizedPl: number;
  closeTime: string;
  exitReason: "Manual" | "Stop Loss" | "Take Profit";
}

export interface MarketState {
  wtiPrice: number;
  brentPrice: number;
  wtiChangePercent: number;
  brentChangePercent: number;
  gasolinePrice: number;
  heatingOilPrice: number;
  ovxVolatilityIndex: number; // Volatility Index (OVX)
  rollingCorrelation: number; // Rolling Correlation WTI/Brent
  portfolioValue: number;
  cashBalance: number;
  initialCash: number;
  maxDrawdown: number;
  highWaterMark: number;
  valueAtRisk99: number; // Var Value
}

export interface Tick {
  timestamp: string; // HH:MM:SS
  timeIndex: number; 
  wti: number;
  brent: number;
  gasoline?: number;
  heatingOil?: number;
  ovx: number;
  volume: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  brent_open?: number;
  brent_high?: number;
  brent_low?: number;
  brent_close?: number;
  gasoline_open?: number;
  gasoline_high?: number;
  gasoline_low?: number;
  gasoline_close?: number;
  heatingOil_open?: number;
  heatingOil_high?: number;
  heatingOil_low?: number;
  heatingOil_close?: number;
  sma50_wti?: number;
  sma200_wti?: number;
  upperBB_wti?: number;
  lowerBB_wti?: number;
  macd_wti?: number;
  signal_wti?: number;
  rsi_wti?: number;
}

export interface Vessel {
  id: string;
  name: string;
  type: "VLCC" | "Suezmax";
  status: "Laden" | "Ballast" | "Anchored";
  speed: number; // knots
  cargoSize: number; // million barrels
  crudeGrade: "Midland Premium" | "WTI Light Sweet" | "Heavy Sour Select" | "North Sea Brent" | "Urals Urals";
  origin: string;
  destination: "Rotterdam" | "Qingdao" | "Singapore" | "Houston";
  eta: string; // relative / absolute
  progressPercent: number; // 0 to 100
}

export interface NewsCard {
  id: string;
  time: string;
  headline: string;
  category: "Upstream" | "Midstream" | "Downstream" | "Geopolitical";
  source: string;
  impactRating: "High" | "Medium" | "Low";
  // Analyzed by Gemini
  sentiment?: "Bullish" | "Bearish" | "Neutral";
  confidence?: number;
  explanation?: string;
  recommendedTrade?: "Long" | "Short" | "Hold";
  impactTimeline?: Array<{ time: string; priceDelta: number; description: string }>;
  targetStop?: { target: number; stop: number };
  isAnalyzing?: boolean;
  finbertScore?: number;
}

export interface EIAWeeklyStats {
  weekStarting: string;
  crudeInventory: number; // Million barrels
  inventoryChange: number; // Million barrels draw (-) / build (+)
  sprLevel: number; // Million barrels
  weeklyProduction: number; // Million barrels per day (mb/d)
}

export interface BakerHughesStats {
  weekStarting: string;
  oilRigs: number;
  oilChange?: number;
  gasRigs: number;
  gasChange?: number;
  totalRigs: number;
}

// Crack spreads over time (3-2-1 refining margins)
export interface CrackSpreadData {
  timeIndex: string;
  gasolineCrack: number; // profit margin refining 3 crude to 2 gasoline
  distillateCrack: number; // profit margin refining 1 distillate
  crack321: number; // combined 3-2-1 spread (USD/barrel)
}

export interface ForwardCurvePoint {
  contract: string; // M1, M2, M3 etc.
  price: number;
  type: "Contango" | "Backwardation";
}

export interface GlobalSupplyDemandPoint {
  period: string; // e.g. "Q3 25", "Q4 25", etc.
  supply: number; // mb/d
  demand: number; // mb/d
  netBalance: number; // supply - demand (mb/d)
}

export interface CustomPriceAlert {
  id: string;
  asset: "WTI" | "Brent";
  criteria: "ABOVE" | "BELOW";
  targetPrice: number;
  createdAt: string;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  triggeredPrice?: number;
}

