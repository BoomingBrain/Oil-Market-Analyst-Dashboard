import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Settings, 
  Ship, 
  Clock, 
  Bell, 
  Maximize2, 
  Eye, 
  ArrowUpDown, 
  RotateCcw, 
  Sparkles, 
  Plus, 
  X, 
  DollarSign, 
  Percent, 
  AlertTriangle,
  Play,
  Activity,
  Layers,
  ChevronRight,
  Compass,
  Zap,
  CheckCircle2,
  Sliders,
  Filter,
  Globe,
  ExternalLink
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  ReferenceArea,
  ComposedChart,
  Cell,
  Legend
} from "recharts";
import { 
  Position, 
  TradeHistory, 
  MarketState, 
  Tick, 
  Vessel, 
  NewsCard, 
  EIAWeeklyStats, 
  BakerHughesStats, 
  CrackSpreadData, 
  ForwardCurvePoint,
  GlobalSupplyDemandPoint,
  CustomPriceAlert
} from "./types";
import { TradingViewWidget } from "./components/TradingViewWidget";
import { ContractCorrelationMatrix } from "./components/ContractCorrelationMatrix";
import { MarineWeatherTracker } from "./components/MarineWeatherTracker";
import { PriceAlertDesk } from "./components/PriceAlertDesk";
import { 
  LAYOUTS, 
  INITIAL_VESSELS, 
  INITIAL_NEWS, 
  EIA_HISTORIC, 
  RIGS_HISTORIC, 
  CRACK_SPREADS_HISTORIC, 
  FORWARD_CURVE_BACKWARDATION, 
  FORWARD_CURVE_CONTANGO, 
  generateInitialTicks,
  GLOBAL_SUPPLY_DEMAND
} from "./data";

function getCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 1.0;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    sumX += xi;
    sumY += yi;
    sumXY += xi * yi;
    sumX2 += xi * xi;
    sumY2 += yi * yi;
  }
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (den === 0) return 0;
  return parseFloat((num / den).toFixed(2));
}

export default function App() {
  // Global control configurations
  const [selectedLayout, setSelectedLayout] = useState<string>("morning");
  const [dateRange, setDateRange] = useState<"Today" | "7D" | "Custom">("7D");
  
  // Real-time oil ticks & price simulation stats
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [marketState, setMarketState] = useState<MarketState>({
    wtiPrice: 76.40,
    brentPrice: 80.20,
    wtiChangePercent: 0.79,
    brentChangePercent: 0.98,
    gasolinePrice: 2.10,
    heatingOilPrice: 2.45,
    ovxVolatilityIndex: 31.4,
    rollingCorrelation: 0.88,
    portfolioValue: 10000000, // $10,000,000 initial fund size
    cashBalance: 10000000,
    initialCash: 10000000,
    maxDrawdown: 0,
    highWaterMark: 10000000,
    valueAtRisk99: 145000 // $145,000 VaR (99% confidence baseline)
  });

  // Track previous prices for flickering flash indicators
  const [prevWti, setPrevWti] = useState<number>(76.40);
  const [prevBrent, setPrevBrent] = useState<number>(80.20);
  const [wtiTrend, setWtiTrend] = useState<"up" | "down" | "flat">("flat");
  const [brentTrend, setBrentTrend] = useState<"up" | "down" | "flat">("flat");

  // Dynamic news engine
  const [newsList, setNewsList] = useState<NewsCard[]>(INITIAL_NEWS);
  const [selectedNewsId, setSelectedNewsId] = useState<string>("news_1");
  const [isGeneratingAlert, setIsGeneratingAlert] = useState<boolean>(false);
  const [newsTab, setNewsTab] = useState<"trump" | "oilprice">("trump");
  const [oilPriceNews, setOilPriceNews] = useState<NewsCard[]>([]);
  const [isLoadingOilPrice, setIsLoadingOilPrice] = useState<boolean>(false);
  const [gasMult, setGasMult] = useState<number>(2);
  const [hoMult, setHoMult] = useState<number>(1);
  const [crudeMult, setCrudeMult] = useState<number>(3);
  const [crudeBasis, setCrudeBasis] = useState<"WTI" | "Brent">("WTI");

  const fetchOilPriceNews = async () => {
    setIsLoadingOilPrice(true);
    try {
      const response = await fetch("/api/oilprice-news");
      if (response.ok) {
        const data = await response.json();
        setOilPriceNews(data);
        if (data.length > 0) {
          setSelectedNewsId(data[0].id);
        }
      } else {
        triggerSysNotification("Failed to load live OilPrice.com news feed.", "alert");
      }
    } catch (e) {
      console.error(e);
      triggerSysNotification("Failed to fetch news from OilPrice.com feed.", "alert");
    } finally {
      setIsLoadingOilPrice(false);
    }
  };

  const isTrumpNews = (n: NewsCard) => {
    const h = n.headline.toLowerCase();
    return h.includes("trump") || 
           h.includes("executive order") || 
           h.includes("tariff") || 
           h.includes("unleash energy") || 
           h.includes("white house") || 
           h.includes("government") || 
           h.includes("spr ") || 
           h.includes("petroleum reserve") || 
           h.includes("permitting") ||
           h.includes("dereg") ||
           h.includes("secretary of energy") ||
           h.includes("drill baby drill") ||
           h.includes("socialmedia") ||
           h.includes("policy:");
  };
  
  // EIA & Upstream datasets
  const [eiaStats, setEiaStats] = useState<EIAWeeklyStats[]>(EIA_HISTORIC);
  const [eiaIsSimulated, setEiaIsSimulated] = useState<boolean>(true);
  const [rigsStats, setRigsStats] = useState<BakerHughesStats[]>(RIGS_HISTORIC);
  const [rigsIsSimulated, setRigsIsSimulated] = useState<boolean>(true);
  const [supplyDemandData, setSupplyDemandData] = useState<GlobalSupplyDemandPoint[]>(GLOBAL_SUPPLY_DEMAND);
  const [crackSpreads, setCrackSpreads] = useState<CrackSpreadData[]>(CRACK_SPREADS_HISTORIC);
  const [customForwardCurve, setCustomForwardCurve] = useState<ForwardCurvePoint[]>(FORWARD_CURVE_BACKWARDATION);
  const [isBackwardation, setIsBackwardation] = useState<boolean>(true);

  // Ship tracking marine state
  const [vessels, setVessels] = useState<Vessel[]>(INITIAL_VESSELS);
  const [selectedVesselId, setSelectedVesselId] = useState<string>("v1");
  const [vesselFilter, setVesselFilter] = useState<"ALL" | "VLCC" | "Suezmax">("ALL");

  // Charting engine controls & overlays
  const [showSMA50, setShowSMA50] = useState<boolean>(true);
  const [showSMA200, setShowSMA200] = useState<boolean>(false);
  const [showBB, setShowBB] = useState<boolean>(false);
  const [showFib, setShowFib] = useState<boolean>(false);
  const [chartType, setChartType] = useState<"area" | "candle" | "tradingview">("tradingview");
  const [selectedAsset, setSelectedAsset] = useState<"WTI" | "Brent" | "Gasoline" | "Heating Oil">("WTI");

  // Trade Desk states
  const [tradeAsset, setTradeAsset] = useState<"WTI" | "Brent">("WTI");
  const [tradeSide, setTradeSide] = useState<"LONG" | "SHORT">("LONG");
  const [tradeBarrels, setTradeBarrels] = useState<number>(25000); // barrels to purchase
  const [tradeLeverage, setTradeLeverage] = useState<number>(10); // leverage
  const [tradeStopLoss, setTradeStopLoss] = useState<string>("");
  const [tradeTakeProfit, setTradeTakeProfit] = useState<string>("");

  // Risk levels threshold alerts config (analyst customized)
  const [riskLimitVaR, setRiskLimitVaR] = useState<number>(450000); // alert limit
  const [riskLimitVol, setRiskLimitVol] = useState<number>(40.0); // alert limit Max Volatility
  const [brokerAlerts, setBrokerAlerts] = useState<Array<{id: string; msg: string; type: "alert" | "info" | "success" | "warning"; time: string}>>([]);

  // Custom price & catalyst news alert states
  const [customAlerts, setCustomAlerts] = useState<CustomPriceAlert[]>([
    {
      id: "preseed_1",
      asset: "WTI",
      criteria: "ABOVE",
      targetPrice: 77.50,
      createdAt: "System Seeded",
      isActive: true,
      isTriggered: false
    },
    {
      id: "preseed_2",
      asset: "Brent",
      criteria: "BELOW",
      targetPrice: 78.50,
      createdAt: "System Seeded",
      isActive: true,
      isTriggered: false
    }
  ]);
  const [newsAlertEnabled, setNewsAlertEnabled] = useState<boolean>(true);
  const [newsShiftThreshold, setNewsShiftThreshold] = useState<number>(1.5);

  const handleAddAlert = (asset: "WTI" | "Brent", criteria: "ABOVE" | "BELOW", targetPrice: number) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newAlert: CustomPriceAlert = {
      id: "alert_" + Date.now() + "_" + Math.floor(Math.random() * 1000000),
      asset,
      criteria,
      targetPrice,
      createdAt: time,
      isActive: true,
      isTriggered: false
    };
    setCustomAlerts(prev => [newAlert, ...prev]);
    triggerSysNotification(`Custom price monitor deployed: ${asset} ${criteria.toLowerCase()} $${targetPrice.toFixed(2)}`, "info");
  };

  const handleToggleAlert = (id: string) => {
    setCustomAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const handleDeleteAlert = (id: string) => {
    setCustomAlerts(prev => prev.filter(a => a.id !== id));
    triggerSysNotification(`Price monitor removed.`, "info");
  };

  const evaluateNewsImpactAlert = (news: NewsCard, priceShift?: number) => {
    if (!newsAlertEnabled) return;
    const absShift = priceShift !== undefined ? Math.abs(priceShift) : 0;
    const isHighImpact = news.impactRating === "High";
    const titleSnippet = news.headline.length > 55 ? news.headline.slice(0, 55) + "..." : news.headline;

    if (absShift >= newsShiftThreshold || isHighImpact) {
       let msg = `🚨 NEWS SHOCK TRIGGERED: "${titleSnippet}" has high volatility warning metrics.`;
       if (absShift > 0) {
         msg += ` Instant price drift shift: $${priceShift?.toFixed(2)}`;
       }
       triggerSysNotification(msg, "warning");
    }
  };

  // Active positions & logs
  const [activePositions, setActivePositions] = useState<Position[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);

  // Local helper for flashing state
  const lastAnalyzedNewsRef = useRef<string | null>(null);

  // Initialize ticks once
  useEffect(() => {
    const historical = generateInitialTicks();
    setTicks(historical);
    if (historical.length > 0) {
       const last = historical[historical.length - 1];
       setMarketState(prev => ({
         ...prev,
         wtiPrice: last.wti,
         brentPrice: last.brent,
         ovxVolatilityIndex: last.ovx
       }));
    }
  }, []);

  // Fetch real-time historical crack spreads from Yahoo Finance via backend
  useEffect(() => {
    const fetchSpreads = async () => {
      try {
        const response = await fetch("/api/spreads");
        if (response.ok) {
          const data = await response.json();
          setCrackSpreads(data);
        }
      } catch (err) {
        console.error("Failed to fetch historical spreads:", err);
      }
    };
    fetchSpreads();
  }, []);

  // Fetch real-time market prices from Yahoo Finance via backend
  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        const response = await fetch("/api/market-prices");
        if (response.ok) {
          const data = await response.json();
          setMarketState(prev => ({
            ...prev,
            wtiPrice: data.wtiPrice,
            wtiChangePercent: data.wtiChangePercent,
            brentPrice: data.brentPrice,
            brentChangePercent: data.brentChangePercent,
            gasolinePrice: data.gasolinePrice,
            heatingOilPrice: data.heatingOilPrice
          }));
          
          setWtiTrend(data.wtiChangePercent >= 0 ? "up" : "down");
          setBrentTrend(data.brentChangePercent >= 0 ? "up" : "down");
        }
      } catch (err) {
        console.error("Failed to fetch real market prices:", err);
      }
    };
    
    fetchMarketPrices();
    const intervalId = setInterval(fetchMarketPrices, 30000); // refresh every 30 seconds
    return () => clearInterval(intervalId);
  }, []);

  // Fetch real-time EIA macro fundamentals from backend
  useEffect(() => {
    const fetchEiaData = async () => {
      try {
        const response = await fetch("/api/eia-data");
        if (response.ok) {
          const json = await response.json();
          if (json && json.data) {
            setEiaStats(json.data);
            setEiaIsSimulated(!!json.isSimulated);
          }
        }
      } catch (err) {
        console.error("Failed to fetch EIA data:", err);
      }
    };
    fetchEiaData();
  }, []);

  // Fetch real-time Baker Hughes rig counts from backend
  useEffect(() => {
    const fetchRigsData = async () => {
      try {
        const response = await fetch("/api/rigs-data");
        if (response.ok) {
          const json = await response.json();
          if (json && json.data) {
            setRigsStats(json.data);
            setRigsIsSimulated(!!json.isSimulated);
          }
        }
      } catch (err) {
        console.error("Failed to fetch rigs data:", err);
      }
    };
    fetchRigsData();
  }, []);

  // Reactive price-break monitors evaluator
  useEffect(() => {
    if (marketState.wtiPrice <= 0 || marketState.brentPrice <= 0) return;
    setCustomAlerts(prevAlerts => {
      let triggeredAny = false;
      const updated = prevAlerts.map(alert => {
        if (alert.isActive && !alert.isTriggered) {
          const currentPrice = alert.asset === "WTI" ? marketState.wtiPrice : marketState.brentPrice;
          let triggered = false;
          if (alert.criteria === "ABOVE" && currentPrice >= alert.targetPrice) {
            triggered = true;
          } else if (alert.criteria === "BELOW" && currentPrice <= alert.targetPrice) {
            triggered = true;
          }

          if (triggered) {
            triggeredAny = true;
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            triggerSysNotification(
              `🔔 LIMIT TARGET GATED: [${alert.asset}] Spot is now $${currentPrice.toFixed(2)}, breaching your customized limit threshold of $${alert.targetPrice.toFixed(2)} (${alert.criteria}).`,
              alert.criteria === "ABOVE" ? "success" : "alert"
            );
            return {
              ...alert,
              isTriggered: true,
              isActive: false,
              triggeredAt: timeStr,
              triggeredPrice: currentPrice
            };
          }
        }
        return alert;
      });
      return triggeredAny ? updated : prevAlerts;
    });
  }, [marketState.wtiPrice, marketState.brentPrice]);

  // System alert dispatch helper
  const triggerSysNotification = (msg: string, type: "alert" | "info" | "success" | "warning" = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setBrokerAlerts(prev => [
      { id: Date.now().toString() + "_" + Math.floor(Math.random() * 1000000), msg, type, time },
      ...prev.slice(0, 5) // restrict to latest 6 alerts
    ]);
  };

  // Preset layouts loader
  useEffect(() => {
    if (selectedLayout === "opec") {
      setShowSMA50(true);
      setShowSMA200(true);
      setShowBB(false);
      setDateRange("Today");
      setCustomForwardCurve(FORWARD_CURVE_BACKWARDATION);
      setIsBackwardation(true);
      triggerSysNotification("OPEC Meeting Workspace Loaded. Maximizing geopolitical intelligence & futures curve.", "info");
    } else if (selectedLayout === "hurricane") {
      setShowSMA50(false);
      setShowSMA200(false);
      setShowBB(true);
      setDateRange("7D");
      setCustomForwardCurve(FORWARD_CURVE_CONTANGO);
      setIsBackwardation(false);
      triggerSysNotification("Gulf Hurricane Workspace Loaded. Emphasizing logistics maps, refining crack margins, and rig changes.", "warning");
    } else {
      // morning briefing
      setShowSMA50(true);
      setShowSMA200(true);
      setShowBB(false);
      setShowFib(false);
      setDateRange("7D");
      triggerSysNotification("Morning Briefing Dashboard Loaded. Stabilizing core indexes & Cushing supply indicators.", "success");
    }
  }, [selectedLayout]);

  // Real-time price and ship simulator tick loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTicks(prevTicks => {
        if (prevTicks.length === 0) return prevTicks;
        const lastTick = prevTicks[prevTicks.length - 1];
        
        // Minor dynamic shifts
        const randomShiftWti = (Math.random() * 0.4 - 0.19);
        const randomShiftBrent = randomShiftWti * 0.82 + (Math.random() * 0.08 - 0.04);
        
        const nextWti = parseFloat((lastTick.wti + randomShiftWti).toFixed(2));
        const nextBrent = parseFloat((lastTick.brent + randomShiftBrent).toFixed(2));
        const nextOvx = parseFloat(Math.max(15, Math.min(80, lastTick.ovx + (Math.random() * 0.6 - 0.3))).toFixed(2));

        // Manage flashes tracking trend
        setPrevWti(lastTick.wti);
        setPrevBrent(lastTick.brent);

        if (nextWti > lastTick.wti) setWtiTrend("up");
        else if (nextWti < lastTick.wti) setWtiTrend("down");
        else setWtiTrend("flat");

        if (nextBrent > lastTick.brent) setBrentTrend("up");
        else if (nextBrent < lastTick.brent) setBrentTrend("down");
        else setBrentTrend("flat");

        // Calculate moving averages iteratively
        const allWtis = prevTicks.map(t => t.wti).concat(nextWti);
        const sma50 = parseFloat((allWtis.slice(-10).reduce((a, b) => a + b, 0) / 10).toFixed(2));
        const sma200 = parseFloat((allWtis.slice(-25).reduce((a, b) => a + b, 0) / 25).toFixed(2));
        const upperBB = parseFloat((sma50 + 1.25).toFixed(2));
        const lowerBB = parseFloat((sma50 - 1.25).toFixed(2));
        
        const macd = parseFloat((Math.sin(allWtis.length / 5) * 0.35).toFixed(2));
        const signal = parseFloat((Math.sin((allWtis.length - 1) / 5) * 0.3).toFixed(2));
        const rsi = parseFloat((48 + Math.sin(allWtis.length / 3) * 16).toFixed(2));

        const nextTickIndex = lastTick.timeIndex + 1;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const tickOpen = lastTick.wti;
        const tickClose = nextWti;
        const tickHigh = parseFloat((Math.max(tickOpen, tickClose) + (Math.random() * 0.14)).toFixed(2));
        const tickLow = parseFloat((Math.min(tickOpen, tickClose) - (Math.random() * 0.14)).toFixed(2));

        const brentOpen = lastTick.brent;
        const brentClose = nextBrent;
        const brentHigh = parseFloat((Math.max(brentOpen, brentClose) + (Math.random() * 0.14)).toFixed(2));
        const brentLow = parseFloat((Math.min(brentOpen, brentClose) - (Math.random() * 0.14)).toFixed(2));

        const gasolineOpen = brentOpen * 0.032 + 0.08 + (Math.sin(nextTickIndex / 12) * 0.01);
        const gasolineClose = brentClose * 0.032 + 0.08 + (Math.sin((nextTickIndex+1) / 12) * 0.01);
        const gasolineHigh = parseFloat((Math.max(gasolineOpen, gasolineClose) + (Math.random() * 0.015)).toFixed(3));
        const gasolineLow = parseFloat((Math.min(gasolineOpen, gasolineClose) - (Math.random() * 0.015)).toFixed(3));

        const heatingOilOpen = nextWti * 0.030 + 0.04 + (Math.cos(nextTickIndex / 10) * 0.01);
        const heatingOilClose = nextWti * 0.030 + 0.04 + (Math.cos((nextTickIndex+1) / 10) * 0.01);
        const heatingOilHigh = parseFloat((Math.max(heatingOilOpen, heatingOilClose) + (Math.random() * 0.012)).toFixed(3));
        const heatingOilLow = parseFloat((Math.min(heatingOilOpen, heatingOilClose) - (Math.random() * 0.012)).toFixed(3));

        const updatedTicks = prevTicks.slice(1).concat({
          timestamp,
          timeIndex: nextTickIndex,
          wti: nextWti,
          brent: nextBrent,
          gasoline: parseFloat(gasolineClose.toFixed(3)),
          heatingOil: parseFloat(heatingOilClose.toFixed(3)),
          ovx: nextOvx,
          volume: Math.floor(40000 + (Math.random() * 20000)),
          open: tickOpen,
          high: tickHigh,
          low: tickLow,
          close: tickClose,
          brent_open: brentOpen,
          brent_high: brentHigh,
          brent_low: brentLow,
          brent_close: brentClose,
          gasoline_open: gasolineOpen,
          gasoline_high: gasolineHigh,
          gasoline_low: gasolineLow,
          gasoline_close: gasolineClose,
          heatingOil_open: heatingOilOpen,
          heatingOil_high: heatingOilHigh,
          heatingOil_low: heatingOilLow,
          heatingOil_close: heatingOilClose,
          sma50_wti: sma50,
          sma200_wti: sma200,
          upperBB_wti: upperBB,
          lowerBB_wti: lowerBB,
          macd_wti: macd,
          signal_wti: signal,
          rsi_wti: rsi
        });

        // Trigger real-time calculation in underlying active trades P&L
        setActivePositions(oldPositions => {
          const finishedPositions: TradeHistory[] = [];
          const keptPositions: Position[] = [];

          for (const pos of oldPositions) {
            const currentAssetPrice = pos.symbol === "WTI" ? nextWti : nextBrent;
            const diffPrice = currentAssetPrice - pos.entryPrice;
            const multiplier = pos.side === "LONG" ? 1 : -1;
            const unrealizedPl = diffPrice * pos.sizeBarrels * multiplier;
            
            // Check stop-loss / take-profit exits
            let exited = false;
            let exitReason: "Stop Loss" | "Take Profit" | "Manual" = "Manual";
            let exitPrice = currentAssetPrice;

            if (pos.stopLoss !== undefined) {
              if (pos.side === "LONG" && currentAssetPrice <= pos.stopLoss) {
                exited = true;
                exitReason = "Stop Loss";
                exitPrice = pos.stopLoss;
              } else if (pos.side === "SHORT" && currentAssetPrice >= pos.stopLoss) {
                exited = true;
                exitReason = "Stop Loss";
                exitPrice = pos.stopLoss;
              }
            }

            if (pos.takeProfit !== undefined) {
              if (pos.side === "LONG" && currentAssetPrice >= pos.takeProfit) {
                exited = true;
                exitReason = "Take Profit";
                exitPrice = pos.takeProfit;
              } else if (pos.side === "SHORT" && currentAssetPrice <= pos.takeProfit) {
                exited = true;
                exitReason = "Take Profit";
                exitPrice = pos.takeProfit;
              }
            }

            if (exited) {
              // Liquidate position to cash balance
              const currentUnrealized = (exitPrice - pos.entryPrice) * pos.sizeBarrels * multiplier;
              const marginRefunded = pos.marginUsed;
              const netPl = currentUnrealized;
              
              finishedPositions.push({
                id: pos.id,
                symbol: pos.symbol,
                side: pos.side,
                entryPrice: pos.entryPrice,
                exitPrice: exitPrice,
                sizeBarrels: pos.sizeBarrels,
                leverage: pos.leverage,
                realizedPl: netPl,
                closeTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                exitReason
              });
            } else {
              keptPositions.push({
                ...pos,
                currentPrice: currentAssetPrice
              });
            }
          }

          if (finishedPositions.length > 0) {
            setTradeHistory(prevHist => [...finishedPositions, ...prevHist]);
            finishedPositions.forEach(exitedTrade => {
              const netChange = exitedTrade.realizedPl;
              setMarketState(prevM => {
                const updatedCash = prevM.cashBalance + (exitedTrade.sizeBarrels * exitedTrade.entryPrice / exitedTrade.leverage) + netChange;
                const updatedPort = updatedCash + keptPositions.reduce((sum, p) => {
                  const m = p.side === "LONG" ? 1 : -1;
                  const pl = (p.currentPrice - p.entryPrice) * p.sizeBarrels * m;
                  return sum + (p.sizeBarrels * p.entryPrice / p.leverage) + pl;
                }, 0);

                const newHighWater = Math.max(prevM.highWaterMark, updatedPort);
                const drawdown = ((newHighWater - updatedPort) / newHighWater) * 100;
                
                triggerSysNotification(`Position LIQUIDATED via system ${exitedTrade.exitReason}: ${exitedTrade.symbol} ${exitedTrade.side} at $${exitedTrade.exitPrice}. P&L: $${netChange.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, netChange >= 0 ? "success" : "alert");
                
                return {
                  ...prevM,
                  cashBalance: updatedCash,
                  portfolioValue: updatedPort,
                  highWaterMark: newHighWater,
                  maxDrawdown: parseFloat(Math.max(prevM.maxDrawdown, drawdown).toFixed(2))
                };
              });
            });
          }

          return keptPositions;
        });

        // Run general portfolio metrics math for the remaining kept positions
        setMarketState(prevM => {
          const currentOpenPl = keptPositionsPlSum();
          const marginLocked = activePositions.reduce((acc, p) => acc + p.marginUsed, 0);
          const totalPortValue = prevM.cashBalance + marginLocked + currentOpenPl;
          const newHighWater = Math.max(prevM.highWaterMark, totalPortValue);
          const drawdown = ((newHighWater - totalPortValue) / newHighWater) * 100;

          // Estimate dynamic VaR
          const positionDelta = activePositions.reduce((acc, p) => acc + (p.sizeBarrels * p.entryPrice * (p.side === "LONG" ? 1 : -1)), 0);
          const impliedVar = Math.abs(positionDelta) * (nextOvx / 100) * 0.05 + 145000;

          return {
            ...prevM,
            // Keep WTI and Brent prices tied to real Yahoo Finance data fetched separately
            portfolioValue: totalPortValue,
            highWaterMark: newHighWater,
            maxDrawdown: parseFloat(Math.max(prevM.maxDrawdown, drawdown).toFixed(2)),
            valueAtRisk99: parseFloat(impliedVar.toFixed(0)),
            ovxVolatilityIndex: nextOvx
          };
        });

        return updatedTicks;
      });

      // Tick ship progress
      setVessels(oldVessels => {
        return oldVessels.map(v => {
          if (v.status === "Anchored") return v;
          const additionalProgress = 0.5 + (Math.random() * 0.5);
          const nextProgress = Math.min(100, v.progressPercent + additionalProgress);
          return {
            ...v,
            progressPercent: parseFloat(nextProgress.toFixed(1)),
            status: nextProgress >= 100 ? "Anchored" : v.status,
            eta: nextProgress >= 100 ? "Arrived" : v.eta
          };
        });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activePositions]);

  // Helper calculating ongoing unrealized P&L
  const keptPositionsPlSum = () => {
    let plSum = 0;
    activePositions.forEach(p => {
      // Find current asset price from state
      const currentPrice = p.symbol === "WTI" ? marketState.wtiPrice : marketState.brentPrice;
      const term = p.side === "LONG" ? 1 : -1;
      plSum += (currentPrice - p.entryPrice) * p.sizeBarrels * term;
    });
    return plSum;
  };

  // Trigger Gemini API News Analysis
  const analyzeNewsItem = async (newsCard: NewsCard) => {
    // Prevent duplicate analyses
    if (newsCard.sentiment && lastAnalyzedNewsRef.current === newsCard.id) return;
    
    // Mark as isAnalyzing
    const updateAnalyzing = (prev: NewsCard[]) => prev.map(n => n.id === newsCard.id ? { ...n, isAnalyzing: true } : n);
    if (newsTab === "oilprice") {
      setOilPriceNews(updateAnalyzing);
    } else {
      setNewsList(updateAnalyzing);
    }
    lastAnalyzedNewsRef.current = newsCard.id;

    try {
      const response = await fetch("/api/analyze-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline: newsCard.headline, category: newsCard.category })
      });

      if (!response.ok) {
        throw new Error("Analysis request failed");
      }

      const analyzedData = await response.json();
      const updateData = (prev: NewsCard[]) => prev.map(n => n.id === newsCard.id ? {
        ...n,
        isAnalyzing: false,
        sentiment: analyzedData.sentiment,
        confidence: analyzedData.confidence,
        explanation: analyzedData.explanation,
        recommendedTrade: analyzedData.recommendedTrade,
        impactTimeline: analyzedData.impactTimeline,
        targetStop: analyzedData.targetStop,
        finbertScore: analyzedData.finbertScore
      } : n);

      if (newsTab === "oilprice") {
        setOilPriceNews(updateData);
      } else {
        setNewsList(updateData);
      }

      triggerSysNotification(`AI Insight Generated: OPEC/Geopolitical sentiment evaluated as ${analyzedData.sentiment}.`, "success");
    } catch (err: any) {
      console.error("Failed to analyze news via backend:", err);
      const isBullishFallback = newsCard.headline.toLowerCase().includes("cut") || 
                              newsCard.headline.toLowerCase().includes("draw") || 
                              newsCard.headline.toLowerCase().includes("disruption") || 
                              newsCard.headline.toLowerCase().includes("leak") || 
                              newsCard.headline.toLowerCase().includes("strike") ||
                              newsCard.headline.toLowerCase().includes("attack");
      // Fail safely to mock analytic parameters inside client
      const updateFallback = (prev: NewsCard[]) => prev.map(n => n.id === newsCard.id ? {
        ...n,
        isAnalyzing: false,
        sentiment: isBullishFallback ? "Bullish" : "Bearish",
        confidence: 84,
        explanation: isBullishFallback 
          ? "Strategic assessment: This news triggers immediate physical supply constraints. Strong buying momentum expected to push nearby WTI/Brent delivery prices up due to tight inventories."
          : "Strategic assessment: Standard inventory or regulatory signals indicate a build in supply or refining margin slowdown, driving near-month pricing down.",
        recommendedTrade: isBullishFallback ? "Long" : "Short",
        targetStop: isBullishFallback ? { target: 2.80, stop: -1.00 } : { target: -2.10, stop: 0.85 },
        finbertScore: isBullishFallback ? 0.7420 : -0.6280,
        impactTimeline: isBullishFallback ? [
          { time: "1 Hour", priceDelta: 1.10, description: "Instant speculative algorithms bid prompt Brent." },
          { time: "24 Hours", priceDelta: 1.95, description: "Midland vs. WTI differentials widen out." },
          { time: "3 Days", priceDelta: 2.60, description: "Refinery crude margins absorb physical premium." },
          { time: "1 Week", priceDelta: 2.10, description: "Consolidated trading limits set in." },
          { time: "3 Weeks", priceDelta: 0.90, description: "Alternative supplies ease bottlenecks." }
        ] : [
          { time: "1 Hour", priceDelta: -0.80, description: "Speculators sell nearby contract tiers." },
          { time: "24 Hours", priceDelta: -1.40, description: "Physical dealers discount spot deliveries." },
          { time: "3 Days", priceDelta: -1.95, description: "Refineries defer purchase requests." },
          { time: "1 Week", priceDelta: -1.10, description: "Consolidates as lower price triggers buying." },
          { time: "3 Weeks", priceDelta: -0.40, description: "Utilization adjustments help rebalance." }
        ]
      } : n);

      if (newsTab === "oilprice") {
        setOilPriceNews(updateFallback);
      } else {
        setNewsList(updateFallback);
      }
      triggerSysNotification("AI Insight generated (Local Sandbox Buffer).", "info");
    }
  };

  // Trigger server news generation
  const handleGenerateEmergencyNews = async () => {
    setIsGeneratingAlert(true);
    triggerSysNotification("Contacting broker intelligence desk for breaking news feeds...", "info");
    
    // Determine sentiment bias from current trades to make it fun!
    let sentimentBias = "stable";
    if (activePositions.length > 0) {
      sentimentBias = activePositions[0].side === "LONG" ? "bullish" : "bearish";
    }

    try {
      const response = await fetch("/api/generate-news-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentTrend: sentimentBias })
      });

      if (!response.ok) throw new Error("Generator offline");

      const rawNews = await response.json();
      
      const newAlert: NewsCard = {
        id: `gen_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        time: "Just Now",
        headline: rawNews.headline,
        category: rawNews.category || "Geopolitical",
        source: rawNews.source || "Reuters",
        impactRating: rawNews.impactRating || "High",
        finbertScore: rawNews.finbertScore
      };

      setNewsTab("trump");
      setNewsList(prev => [newAlert, ...prev]);
      setSelectedNewsId(newAlert.id);
      setIsGeneratingAlert(false);

      // Trigger large localized WTI/Brent pricing move based on generation context
      const lowercase = newAlert.headline.toLowerCase();
      let shift = 0;
      if (lowercase.includes("cut") || lowercase.includes("draw") || lowercase.includes("strike") || lowercase.includes("disruption") || lowercase.includes("leak") || lowercase.includes("attack")) {
        shift = 2.40 + (Math.random() * 1.5);
        triggerSysNotification(`⚠️ SEVERE BREAKING: ${newAlert.headline} (SQUEEZE DETECTED! Price jumped +$${shift.toFixed(2)})`, "warning");
      } else {
        shift = -(1.80 + (Math.random() * 1.2));
        triggerSysNotification(`⚠️ SEVERE BREAKING: ${newAlert.headline} (LIQUIDATION DETECTED! Price dropped $${shift.toFixed(2)})`, "alert");
      }

      // Implement instant chart adjustments
      setTicks(prevTicks => {
        if (prevTicks.length === 0) return prevTicks;
        return prevTicks.map((t, idx) => {
          if (idx === prevTicks.length - 1) {
            return {
              ...t,
              wti: parseFloat((t.wti + shift).toFixed(2)),
              brent: parseFloat((t.brent + shift * 0.9).toFixed(2)),
              ovx: parseFloat(Math.min(80, t.ovx + 8).toFixed(2))
            };
          }
          return t;
        });
      });

      // Analyze automatically with Gemini
      analyzeNewsItem(newAlert);
      evaluateNewsImpactAlert(newAlert, shift);
      
    } catch (e) {
      // Offline fallback alert
      console.warn("Using offline generic emergency generator:", e);
      const fallbackAlert: NewsCard = {
        id: `gen_fall_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
        time: "Just Now",
        headline: "URGENT: Major Pipeline shutdown reported at Cushing, OK outbound pipeline routing terminals due to sudden pressure leak.",
        category: "Midstream",
        source: "Emergency Network",
        impactRating: "High",
        finbertScore: 0.8120
      };

      setNewsTab("trump");
      setNewsList(prev => [fallbackAlert, ...prev]);
      setSelectedNewsId(fallbackAlert.id);
      setIsGeneratingAlert(false);

      const shiftPrice = 2.85;
      setTicks(prevTicks => {
        if (prevTicks.length === 0) return prevTicks;
        return prevTicks.map((t, idx) => {
          if (idx === prevTicks.length - 1) {
            return {
              ...t,
              wti: parseFloat((t.wti + shiftPrice).toFixed(2)),
              brent: parseFloat((t.brent + shiftPrice * 0.9).toFixed(2)),
              ovx: parseFloat(Math.min(80, t.ovx + 10).toFixed(2))
            };
          }
          return t;
        });
      });

      triggerSysNotification(`⚠️ SEVERE CRUDE SUPPLY DISRUPTION: Cushing outlet offline! (Benchmark WTI spikes +$${shiftPrice})`, "warning");
      analyzeNewsItem(fallbackAlert);
      evaluateNewsImpactAlert(fallbackAlert, shiftPrice);
    }
  };

  // Launch a new trade position
  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    
    const entryPrice = tradeAsset === "WTI" ? marketState.wtiPrice : marketState.brentPrice;
    const requiredMargin = (tradeBarrels * entryPrice) / tradeLeverage;

    if (requiredMargin > marketState.cashBalance) {
      triggerSysNotification(`Trade Rejected: Insufficient free margin balance. Needed $${requiredMargin.toLocaleString()}, Cash $${marketState.cashBalance.toLocaleString()}`, "alert");
      return;
    }

    const sl = tradeStopLoss ? parseFloat(tradeStopLoss) : undefined;
    const tp = tradeTakeProfit ? parseFloat(tradeTakeProfit) : undefined;

    // Validate stop loss directions
    if (sl !== undefined) {
      if (tradeSide === "LONG" && sl >= entryPrice) {
        triggerSysNotification("Trade Rejected: Long Stop-Loss must be below entry price.", "alert");
        return;
      }
      if (tradeSide === "SHORT" && sl <= entryPrice) {
        triggerSysNotification("Trade Rejected: Short Stop-Loss must be above entry price.", "alert");
        return;
      }
    }

    // Validate take profit directions
    if (tp !== undefined) {
      if (tradeSide === "LONG" && tp <= entryPrice) {
        triggerSysNotification("Trade Rejected: Long Take Profit must be above entry price.", "alert");
        return;
      }
      if (tradeSide === "SHORT" && tp >= entryPrice) {
        triggerSysNotification("Trade Rejected: Short Take Profit must be below entry price.", "alert");
        return;
      }
    }

    const newPosition: Position = {
      id: `pos_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      symbol: tradeAsset,
      side: tradeSide,
      entryPrice,
      currentPrice: entryPrice,
      sizeBarrels: tradeBarrels,
      leverage: tradeLeverage,
      marginUsed: requiredMargin,
      stopLoss: sl,
      takeProfit: tp,
      openTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    setActivePositions(prev => [newPosition, ...prev]);
    
    // Deduct cash balance
    setMarketState(prev => ({
      ...prev,
      cashBalance: prev.cashBalance - requiredMargin
    }));

    triggerSysNotification(`Order Executed: ${tradeSide} ${tradeBarrels.toLocaleString()} bbl ${tradeAsset} @ $${entryPrice} with ${tradeLeverage}x leverage.`, "success");
    
    // Clear stop inputs
    setTradeStopLoss("");
    setTradeTakeProfit("");
  };

  // Close an active position manually
  const handleClosePositionManually = (posId: string) => {
    const pos = activePositions.find(p => p.id === posId);
    if (!pos) return;

    const exitPrice = pos.symbol === "WTI" ? marketState.wtiPrice : marketState.brentPrice;
    const delta = exitPrice - pos.entryPrice;
    const sideMult = pos.side === "LONG" ? 1 : -1;
    const realizedPl = delta * pos.sizeBarrels * sideMult;

    // Refund margin + P&L
    setMarketState(prev => {
      const refund = pos.marginUsed + realizedPl;
      const nextCash = prev.cashBalance + refund;
      
      const nextActive = activePositions.filter(p => p.id !== posId);
      const openPl = nextActive.reduce((sum, p) => {
        const pCurrentPrice = p.symbol === "WTI" ? marketState.wtiPrice : marketState.brentPrice;
        const pDelta = pCurrentPrice - p.entryPrice;
        const pMult = p.side === "LONG" ? 1 : -1;
        return sum + (pDelta * p.sizeBarrels * pMult);
      }, 0);
      const nextMarginLocked = nextActive.reduce((sum, p) => sum + p.marginUsed, 0);
      const totalPortValue = nextCash + nextMarginLocked + openPl;

      return {
        ...prev,
        cashBalance: nextCash,
        portfolioValue: totalPortValue
      };
    });

    setActivePositions(prev => prev.filter(p => p.id !== posId));
    
    setTradeHistory(prev => [
      {
        id: pos.id,
        symbol: pos.symbol,
        side: pos.side,
        entryPrice: pos.entryPrice,
        exitPrice,
        sizeBarrels: pos.sizeBarrels,
        leverage: pos.leverage,
        realizedPl,
        closeTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        exitReason: "Manual"
      },
      ...prev
    ]);

    triggerSysNotification(`Manual Close: Liquidated ${pos.symbol} ${pos.side} at $${exitPrice}. Realized P&L: $${realizedPl.toLocaleString(undefined, {minimumFractionDigits: 2})}`, realizedPl >= 0 ? "success" : "alert");
  };

  // Auto trigger news analysis on change news
  useEffect(() => {
    const news = newsTab === "oilprice"
      ? oilPriceNews.find(n => n.id === selectedNewsId)
      : newsList.find(n => n.id === selectedNewsId);
    if (news && !news.sentiment && !news.isAnalyzing) {
      analyzeNewsItem(news);
    }
  }, [selectedNewsId, newsTab, oilPriceNews]);

  // Vessels list filtering
  const filteredVessels = vessels.filter(v => {
    if (vesselFilter === "ALL") return true;
    return v.type === vesselFilter;
  });

  const selectedVessel = vessels.find(v => v.id === selectedVesselId) || vessels[0];

  // Filtered news per selected active tab
  const filteredNews = newsTab === "oilprice"
    ? oilPriceNews
    : newsList;

  const selectedNews = (newsTab === "oilprice"
    ? oilPriceNews.find(n => n.id === selectedNewsId) || oilPriceNews[0]
    : newsList.find(n => n.id === selectedNewsId) || filteredNews[0] || newsList[0]) || newsList[0];

  const handleTabChange = (tab: "trump" | "oilprice") => {
    setNewsTab(tab);
    if (tab === "oilprice") {
      fetchOilPriceNews();
    } else {
      if (newsList.length > 0) {
        setSelectedNewsId(newsList[0].id);
      }
    }
  };

  // Visual warning borders triggers if thresholds exceeded
  const latestRig = rigsStats.length > 0 ? rigsStats[rigsStats.length - 1] : null;
  const isVaRBreached = marketState.valueAtRisk99 > riskLimitVaR;
  const isVolBreached = marketState.ovxVolatilityIndex > riskLimitVol;

  // Dynamic series calculations for correlation matrix
  const wtiSeries = ticks.map(t => t.wti);
  const brentSeries = ticks.map(t => t.brent);
  const gasolineSeries = ticks.map(t => t.gasoline ?? (t.brent * 0.032 + 0.08));
  const heatingOilSeries = ticks.map(t => t.heatingOil ?? (t.wti * 0.030 + 0.04));
  const ovxSeries = ticks.map(t => t.ovx);

  const matrixLabels = ["WTI", "Brent", "Gasoline", "Heating Oil", "OVX Vol"];
  const matrixSeries = [wtiSeries, brentSeries, gasolineSeries, heatingOilSeries, ovxSeries];

  const correlationMatrix: number[][] = [];
  for (let i = 0; i < matrixSeries.length; i++) {
    correlationMatrix[i] = [];
    for (let j = 0; j < matrixSeries.length; j++) {
      if (i === j) {
        correlationMatrix[i][j] = 1.0;
      } else if (ticks.length === 0) {
        correlationMatrix[i][j] = 0.0;
      } else {
        correlationMatrix[i][j] = getCorrelation(matrixSeries[i], matrixSeries[j]);
      }
    }
  }

  return (
    <div className={`min-h-screen bg-[#0c1015] text-slate-100 flex flex-col font-sans relative select-none antialiased overflow-x-hidden ${
      isVaRBreached ? "border-2 border-red-500/80 animate-pulse" : (isVolBreached ? "border-2 border-amber-500/80" : "")
    }`}>
      
      {/* Background Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-emerald-900/20 rounded-full blur-[100px]"></div>
      </div>
      
      {/* 1. TOP GLOBAL CONTROL HEADER & TELEMETRY */}
      <header className="relative z-50 sticky top-0 bg-white/5 backdrop-blur-md border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        
        {/* Core Logo Brand */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-1.5 bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 rounded-lg shadow-lg text-indigo-300">
            <Activity className="w-5 h-5 animate-pulse" id="logo_icon" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2">
              LUMINA<span className="text-indigo-400 font-mono font-bold">TRADE</span> <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono font-normal tracking-wide animate-pulse">• LIVE</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">PETROFLOW GATEWAY · GLOBAL FORECAST ENGINE</p>
          </div>
        </div>

        {/* Global Summary Ticker Tape */}
        <div className="flex items-center gap-6 overflow-x-auto py-1 scrollbar-none max-w-full md:max-w-xl lg:max-w-3xl xl:max-w-5xl relative z-10">
          
          {/* WTI Strip */}
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 font-mono">
            <span className="text-xs font-semibold text-slate-300">WTI Contract (M1)</span>
            <span className={`text-xs font-bold font-numeric transition-colors duration-300 ${
              wtiTrend === "up" ? "text-emerald-400" : (wtiTrend === "down" ? "text-red-400" : "text-amber-300")
            }`}>
              ${marketState.wtiPrice.toFixed(2)}
            </span>
            <span className={`text-[10px] font-semibold flex items-center ${
              marketState.wtiChangePercent >= 0 ? "text-emerald-400" : "text-red-400"
            }`}>
              {marketState.wtiChangePercent >= 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
              {marketState.wtiChangePercent >= 0 ? "+" : ""}{marketState.wtiChangePercent}%
            </span>
          </div>

          {/* Brent Strip */}
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 font-mono">
            <span className="text-xs font-semibold text-slate-300">BRENT (M1)</span>
            <span className={`text-xs font-bold font-numeric transition-colors duration-300 ${
              brentTrend === "up" ? "text-emerald-400" : (brentTrend === "down" ? "text-red-400" : "text-amber-300")
            }`}>
              ${marketState.brentPrice.toFixed(2)}
            </span>
            <span className={`text-[10px] font-semibold flex items-center ${
              marketState.brentChangePercent >= 0 ? "text-emerald-400" : "text-red-400"
            }`}>
              {marketState.brentChangePercent >= 0 ? <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5" />}
              {marketState.brentChangePercent >= 0 ? "+" : ""}{marketState.brentChangePercent}%
            </span>
          </div>

          {/* Volatility Ticker */}
          <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 font-mono text-[11px]">
            <span className="text-slate-400">CBOE OVX:</span>
            <span className={`font-bold ${isVolBreached ? "text-amber-400 animate-pulse font-extrabold" : "text-slate-200"}`}>
              {marketState.ovxVolatilityIndex}%
            </span>
          </div>

          {/* Aggregate Net Change */}
          <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 font-mono text-[11px]">
            <span className="text-slate-400">EIA STOCK INVENTORY:</span>
            <span className="font-bold text-red-400">-3.4M bbl</span>
            <span className="text-[9px] text-slate-500">Cushing draws</span>
          </div>

          {/* Sentiment Level indicator */}
          <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 font-mono text-[11px]">
            <span className="text-slate-400">NET SENTIMENT:</span>
            <span className="font-bold text-emerald-400">82% BULLISH</span>
          </div>
        </div>

        {/* Global Persistence Filters */}
        <div className="flex items-center gap-2 relative z-10">
          
          {/* Global Date Control */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-0.5 flex gap-1 backdrop-blur-md">
            <button 
              onClick={() => { setDateRange("Today"); triggerSysNotification("Global filter updated: Intraday 24H", "info"); }}
              className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition ${dateRange === "Today" ? "bg-white/10 text-slate-100 border border-white/10" : "text-slate-450 hover:text-slate-200"}`}>
              Today
            </button>
            <button 
              onClick={() => { setDateRange("7D"); triggerSysNotification("Global filter updated: Historic 7D", "info"); }}
              className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition ${dateRange === "7D" ? "bg-white/10 text-slate-100 border border-white/10" : "text-slate-450 hover:text-slate-200"}`}>
              7 Days
            </button>
            <button 
              onClick={() => setDateRange("Custom")}
              className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition ${dateRange === "Custom" ? "bg-white/10 text-slate-100 border border-white/10" : "text-slate-450 hover:text-slate-200"}`}>
              Custom
            </button>
          </div>

          {/* Workspace dropdown layout selector */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 backdrop-blur-md">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <select 
              value={selectedLayout} 
              onChange={(e) => setSelectedLayout(e.target.value)}
              className="bg-transparent text-xs text-slate-200 border-none focus:outline-none cursor-pointer pr-1">
              <optgroup label="Select Workspace Layout" className="bg-[#0c1015] text-slate-200">
                <option value="morning" className="bg-[#0c1015]">Morning Briefing</option>
                <option value="opec" className="bg-[#0c1015]">OPEC Session View</option>
                <option value="hurricane" className="bg-[#0c1015]">Supply Vulnerability</option>
              </optgroup>
            </select>
          </div>
        </div>

      </header>

      {/* Extreme System Warning Bar when parameters are breached */}
      {isVaRBreached && (
        <div className="bg-red-500 text-slate-950 text-[11px] font-bold py-1 px-4 text-center tracking-wider animate-pulse uppercase flex items-center justify-center gap-2 relative z-20">
          <ShieldAlert className="w-4 h-4" /> 
          ALERT VALUE-AT-RISK EXCEEDS PORTFOLIO Desk THRESHOLD (${marketState.valueAtRisk99.toLocaleString()} &gt; ${riskLimitVaR.toLocaleString()}) - CLOSE POSITIONS OR LOWER LEVERAGE SIZES IMMEDIATELY
        </div>
      )}

      {/* Main Grid Workspace Dashboard Layout */}
      <main className="flex-1 p-4 grid grid-cols-1 xl:grid-cols-12 gap-4 relative z-10">
        
        {/* -- LEFT COLUMN: REAL-TIME PHYSICAL MARKET TRACKERS & STOCKS -- */}
        <section className="xl:col-span-3 flex flex-col gap-4">
          {/* Spreads & Refining Margins + Real-time Pearson Correlation Matrix card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between gap-2 mb-3">
              <span className="flex items-center gap-1.5"><Layers className="w-4 h-4 text-indigo-400" /> Oil Spreads & Margins</span>
              <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono uppercase">
                Real-Time
              </span>
            </h3>

            {/* Grid of Real-Time Spreads Calculated from Yahoo Finance Data */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">Brent-WTI</div>
                <div className="text-sm font-bold text-sky-400 font-numeric">${(marketState.brentPrice - marketState.wtiPrice).toFixed(2)}/bbl</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">Gasoline Crack</div>
                <div className="text-sm font-bold text-emerald-400 font-numeric">${(marketState.gasolinePrice * 42 - marketState.wtiPrice).toFixed(2)}/bbl</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">Heating Oil Crack</div>
                <div className="text-sm font-bold text-amber-400 font-numeric">${(marketState.heatingOilPrice * 42 - marketState.wtiPrice).toFixed(2)}/bbl</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">3-2-1 Crack</div>
                <div className="text-sm font-bold text-purple-400 font-numeric">${((2 * (marketState.gasolinePrice * 42) + (marketState.heatingOilPrice * 42) - 3 * marketState.wtiPrice) / 3).toFixed(2)}/bbl</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">Gas-HO Spread</div>
                <div className="text-sm font-bold text-indigo-400 font-numeric">${((marketState.gasolinePrice - marketState.heatingOilPrice) * 42).toFixed(2)}/bbl</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">WTI-WCS Heavy</div>
                <div className="text-sm font-bold text-rose-400 font-numeric">-$14.50/bbl</div>
              </div>
            </div>

            {/* Dynamic Real-time Correlation matrix */}
            <div className="mt-4 border-t border-white/5 pt-3">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mb-2 font-semibold flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Pearson Correlation Matrix
              </span>
              <div className="grid grid-cols-6 gap-1 text-center font-mono">
                {/* Top Header Row */}
                <div className="text-[8px] text-slate-500 font-sans flex items-center justify-center">Asset</div>
                {matrixLabels.map(l => (
                  <div key={l} className="text-[8px] text-slate-400 font-bold bg-white/5 py-0.5 rounded uppercase font-mono">
                    {l === "Heating Oil" ? "HO" : l === "Gasoline" ? "GAS" : l === "OVX Vol" ? "OVX" : l.slice(0,3)}
                  </div>
                ))}

                {/* Grid Cells */}
                {matrixLabels.map((rowLabel, rIdx) => {
                  const shortRowLabel = rowLabel === "Heating Oil" ? "HO" : rowLabel === "Gasoline" ? "GAS" : rowLabel === "OVX Vol" ? "OVX" : rowLabel.slice(0,3);
                  return (
                    <React.Fragment key={rowLabel}>
                      <div className="text-[8px] text-slate-400 font-bold bg-white/5 py-1 rounded flex items-center justify-center uppercase font-mono">
                        {shortRowLabel}
                      </div>
                      {matrixLabels.map((colLabel, cIdx) => {
                        const val = correlationMatrix[rIdx]?.[cIdx] ?? 0;
                        let cellBg = "bg-white/5";
                        let textColor = "text-slate-400";
                        if (val > 0.8) {
                          cellBg = "bg-emerald-500/25 border border-emerald-500/20";
                          textColor = "text-emerald-300 font-extrabold";
                        } else if (val > 0.4) {
                          cellBg = "bg-emerald-500/10 border border-emerald-500/10";
                          textColor = "text-emerald-250 font-bold";
                        } else if (val < -0.4) {
                          cellBg = "bg-rose-500/10 border border-rose-500/10";
                          textColor = "text-rose-300 font-bold";
                        } else if (val < -0.8) {
                          cellBg = "bg-rose-500/25 border border-rose-500/20";
                          textColor = "text-rose-400 font-extrabold";
                        } else {
                          cellBg = "bg-slate-905 border border-white/5";
                          textColor = "text-slate-300";
                        }
                        return (
                          <div 
                            key={colLabel} 
                            className={`text-[9px] py-1 rounded flex flex-col items-center justify-center transition-all duration-300 cursor-help ${cellBg} ${textColor}`}
                            title={`${rowLabel} vs ${colLabel}: Correlation score: ${val.toFixed(2)}`}
                          >
                            {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono mt-2">
                <span>-1.0 inverse</span>
                <span>+1.0 synergy</span>
              </div>
            </div>

          </div>

          {/* Platts / Argus Physical differentials panel */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between gap-2 mb-3">
              <span className="flex items-center gap-2"><ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" /> Physical Crude Differentials</span>
              <span className="text-[9px] text-slate-500 font-mono">End of Day pricing</span>
            </h3>
            
            <div className="space-y-2 text-xs">
              
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center transition hover:bg-white/10">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    Midland vs WTI Sweet
                  </div>
                  <span className="text-[9px] text-slate-500 uppercase font-mono">Permian to Gulf Coast arbitrage</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-emerald-400 font-bold block">+$1.45/bbl</span>
                  <span className="text-[9px] text-slate-500">Premium widens</span>
                </div>
              </div>

              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center transition hover:bg-white/10">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    Urals vs Dated Brent CFR
                  </div>
                  <span className="text-[9px] text-slate-500 uppercase font-mono">Geopolarity sanction discount tracking</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-red-400 font-bold block">-$13.80/bbl</span>
                  <span className="text-[9px] text-slate-500">Discount stabilizes</span>
                </div>
              </div>

              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center transition hover:bg-white/10">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    Western Canadian Select
                  </div>
                  <span className="text-[9px] text-slate-500 uppercase font-mono">Heavy acid discount vs WTI Cushing</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-slate-300 font-bold block">-$16.50/bbl</span>
                  <span className="text-[9px] text-slate-400">Pipeline bottlenecks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trump Administration Government Actions & Policy Desk */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex-1 flex flex-col min-h-[350px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <img referrerPolicy="no-referrer" src="https://flagcdn.com/us.svg" alt="US Flag" className="w-4 h-2.5 rounded shadow-sm opacity-90 object-cover" />
                Trump Policy Desk
              </h3>
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-mono uppercase animate-pulse">
                Executive Action Watch
              </span>
            </div>

            {/* Quick Policy Stats metrics */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 block uppercase font-mono">SPR TARGET BASIS</span>
                <span className="text-xs font-bold text-slate-100 font-numeric">$68.50 - $72.00</span>
              </div>
              <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl text-center">
                <span className="text-[8px] text-slate-500 block uppercase font-mono">PROPOSED TARIFFS</span>
                <span className="text-xs font-bold text-red-400 font-mono">15% - 25%</span>
              </div>
            </div>

            {/* list of Federal Directives */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin max-h-[220px]">
              {[
                {
                  id: "order_1",
                  title: "ANWR / Alaska Leasing Order",
                  action: "Executive Order Signed",
                  impact: "Bearish (Long Term)",
                  desc: "Opens Arctic reserves to immediate exploratory drilling schedules.",
                  color: "border-emerald-500/30 text-emerald-300 bg-emerald-500/5"
                },
                {
                  id: "order_2",
                  title: "Heavy Crude Tariff Threat",
                  action: "Diplomacy Alert",
                  impact: "WCS CFR Spread Premium",
                  desc: "25% import levies on land-based suppliers Canada and Mexico.",
                  color: "border-amber-500/30 text-amber-300 bg-amber-500/5"
                },
                {
                  id: "order_3",
                  title: "Strategic Reserve Aggressive Refill",
                  action: "SPR Purchase Authorization",
                  impact: "Bullish Floor",
                  desc: "DOE commanded to build massive cushion below $70 baseline.",
                  color: "border-indigo-500/30 text-indigo-305 bg-indigo-500/5"
                },
                {
                  id: "order_4",
                  title: "Permian Pipeline Fast-Track",
                  action: "NEPA Environmental Bypass",
                  impact: "Clears Permian discount",
                  desc: "Eliminates multi-year regulatory studies for deep-water export lines.",
                  color: "border-sky-500/30 text-sky-400 bg-sky-500/5"
                },
                {
                  id: "order_5",
                  title: "EPA Permitting Reforms",
                  action: "Administrative Fast-Track",
                  impact: "Accelerates Shale Output",
                  desc: "Review timeline for carbon-capture and shale drilling reduced to 60 days.",
                  color: "border-slate-500/30 text-slate-300 bg-slate-500/5"
                }
              ].map((policy) => (
                <div 
                  key={policy.id} 
                  onClick={() => {
                    triggerSysNotification(`Simulated Market Reaction to: ${policy.title}. Analysis added to news catalog!`, "info");
                    
                    const customNewAlert: NewsCard = {
                      id: `policy_alert_${Date.now()}`,
                      time: "Just Now",
                      headline: `WHITE HOUSE POLICY: Trump confirms ${policy.title.toLowerCase()} is moving into ${policy.action.toLowerCase()} phase.`,
                      category: "Geopolitical",
                      source: "Federal Register Desk",
                      impactRating: "High",
                      sentiment: policy.impact.toLowerCase().includes("bearish") ? "Bearish" : "Bullish",
                      confidence: 89,
                      explanation: `This government regulatory action accelerates energy flows. ${policy.desc} Immediate structural forecast: ${policy.impact}. Traders are adjusting futures expectations accordingly.`,
                      recommendedTrade: policy.impact.toLowerCase().includes("bearish") ? "Short" : "Long",
                      targetStop: { target: policy.impact.toLowerCase().includes("bearish") ? -1.80 : 2.10, stop: 0.80 }
                    };
                    setNewsList(prev => [customNewAlert, ...prev]);
                    setNewsTab("trump");
                    setSelectedNewsId(customNewAlert.id);
                    evaluateNewsImpactAlert(customNewAlert, customNewAlert.targetStop?.target);
                  }}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition cursor-pointer text-left group animate-fade-in"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-slate-200 text-xs group-hover:text-indigo-300 transition">
                      {policy.title}
                    </span>
                    <span className={`text-[8px] px-1 rounded uppercase font-mono border font-bold ${policy.color}`}>
                      {policy.action}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mb-1">
                    {policy.desc}
                  </p>
                  <div className="flex items-center justify-between text-[9px] font-mono mt-1 pt-1 border-t border-white/5">
                    <span className="text-slate-500">Market Bias:</span>
                    <span className="text-amber-400 font-semibold">{policy.impact}</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] text-slate-500 text-center uppercase font-mono mt-3">
              💡 Click on any policy to simulate live market reaction
            </p>
          </div>

        </section>

        {/* -- CENTER STAGE: MODULAR CHARTING ENGINE & METRICS DRAWDOWN -- */}
        <section className="xl:col-span-6 flex flex-col gap-4">
          
          {/* Main Chart Box */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            
            {/* Chart Config Panel Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-3 mb-3">
              <div>
                <h2 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> {selectedAsset} Interactive Futures Chart Terminal
                </h2>
                <span className="text-[10px] text-slate-450 font-medium">
                  {selectedAsset === "WTI" && "West Texas Intermediate Crude Spot Price (USD / Barrel)"}
                  {selectedAsset === "Brent" && "North Sea Brent Blend Crude Spot Price (USD / Barrel)"}
                  {selectedAsset === "Gasoline" && "RBOB Premium Unleaded Gasoline NYMEX Spot (USD / Gallon)"}
                  {selectedAsset === "Heating Oil" && "No. 2 Heating Oil New York Harbor Spot (USD / Gallon)"}
                </span>
              </div>

              {/* Indicators checklist overlays */}
              <div className="flex flex-wrap items-center gap-3">
                
                {/* Active Commodity/Asset selector */}
                <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                  {(["WTI", "Brent", "Gasoline", "Heating Oil"] as const).map(asset => (
                    <button
                      key={asset}
                      type="button"
                      onClick={() => setSelectedAsset(asset)}
                      className={`px-2 py-1 text-[10px] rounded-lg cursor-pointer transition uppercase font-mono tracking-wider font-semibold ${
                        selectedAsset === asset
                          ? "bg-emerald-500/20 text-emerald-300 font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {asset === "Heating Oil" ? "Heating" : asset}
                    </button>
                  ))}
                </div>

                {/* Chart Type Toggle Segment */}
                <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setChartType("area")}
                    className={`px-2.5 py-1 text-[10px] rounded-lg cursor-pointer transition uppercase font-mono tracking-wider font-semibold ${chartType === "area" ? "bg-indigo-500/25 text-indigo-300 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Area
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("candle")}
                    className={`px-2.5 py-1 text-[10px] rounded-lg cursor-pointer transition uppercase font-mono tracking-wider font-semibold ${chartType === "candle" ? "bg-indigo-500/25 text-indigo-300 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    Candles
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType("tradingview")}
                    className={`px-2.5 py-1 text-[10px] rounded-lg cursor-pointer transition uppercase font-mono tracking-wider font-semibold ${chartType === "tradingview" ? "bg-indigo-500/25 text-indigo-300 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    TradingView
                  </button>
                </div>

                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showSMA50} 
                    onChange={() => setShowSMA50(!showSMA50)}
                    className="rounded border-white/15 bg-white/5 text-amber-500 focus:ring-0 cursor-pointer" 
                  />
                  <span>SMA-50</span>
                </label>

                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showSMA200} 
                    onChange={() => setShowSMA200(!showSMA200)}
                    className="rounded border-white/15 bg-white/5 text-indigo-500 focus:ring-0 cursor-pointer" 
                  />
                  <span>SMA-200</span>
                </label>

                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showBB} 
                    onChange={() => setShowBB(!showBB)}
                    className="rounded border-white/15 bg-white/5 text-pink-500 focus:ring-0 cursor-pointer" 
                  />
                  <span>Bollinger Bands</span>
                </label>

                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer mr-2">
                  <input 
                    type="checkbox" 
                    checked={showFib} 
                    onChange={() => setShowFib(!showFib)}
                    className="rounded border-white/15 bg-white/5 text-cyan-500 focus:ring-0 cursor-pointer" 
                  />
                  <span>Fibonacci retracements</span>
                </label>

              </div>
            </div>

            {/* WTI Prime Price Chart (Recharts / TradingView) */}
            {chartType === "tradingview" ? (
              <div className="h-[420px] w-full relative">
                <TradingViewWidget asset={selectedAsset} />
              </div>
            ) : (
              <div className="h-[280px] w-full relative">
                {(() => {
                  const mappedChartData = ticks.map((t, idx) => {
                  let defaultPrice = t.wti;
                  let o = t.open ?? t.wti;
                  let c = t.close ?? t.wti;
                  let h = t.high ?? t.wti;
                  let l = t.low ?? t.wti;

                  if (selectedAsset === "Brent") {
                    defaultPrice = t.brent;
                    o = t.brent_open ?? t.brent;
                    c = t.brent_close ?? t.brent;
                    h = t.brent_high ?? t.brent;
                    l = t.brent_low ?? t.brent;
                  } else if (selectedAsset === "Gasoline") {
                    const fallback = t.brent * 0.032 + 0.08;
                    defaultPrice = t.gasoline ?? fallback;
                    o = t.gasoline_open ?? fallback;
                    c = t.gasoline_close ?? fallback;
                    h = t.gasoline_high ?? fallback;
                    l = t.gasoline_low ?? fallback;
                  } else if (selectedAsset === "Heating Oil") {
                    const fallback = t.wti * 0.030 + 0.04;
                    defaultPrice = t.heatingOil ?? fallback;
                    o = t.heatingOil_open ?? fallback;
                    c = t.heatingOil_close ?? fallback;
                    h = t.heatingOil_high ?? fallback;
                    l = t.heatingOil_low ?? fallback;
                  }

                  // Compute dynamic indicators on the fly
                  const windowIdx = Math.max(0, idx - 9);
                  const windowSlice = ticks.slice(windowIdx, idx + 1).map(tik => {
                    if (selectedAsset === "Brent") return tik.brent;
                    if (selectedAsset === "Gasoline") return tik.gasoline ?? (tik.brent * 0.032 + 0.08);
                    if (selectedAsset === "Heating Oil") return tik.heatingOil ?? (tik.wti * 0.030 + 0.04);
                    return tik.wti;
                  });
                  const s50 = windowSlice.reduce((sum, v) => sum + v, 0) / windowSlice.length;

                  const windowIdx200 = Math.max(0, idx - 24);
                  const windowSlice200 = ticks.slice(windowIdx200, idx + 1).map(tik => {
                    if (selectedAsset === "Brent") return tik.brent;
                    if (selectedAsset === "Gasoline") return tik.gasoline ?? (tik.brent * 0.032 + 0.08);
                    if (selectedAsset === "Heating Oil") return tik.heatingOil ?? (tik.wti * 0.030 + 0.04);
                    return tik.wti;
                  });
                  const s200 = windowSlice200.reduce((sum, v) => sum + v, 0) / windowSlice200.length;

                  const offsetBB = (selectedAsset === "Gasoline" || selectedAsset === "Heating Oil") ? 0.04 : 1.25;
                  const uBB = s50 + offsetBB;
                  const lBB = s50 - offsetBB;

                  return {
                    ...t,
                    activePrice: parseFloat(defaultPrice.toFixed(3)),
                    openVal: parseFloat(o.toFixed(3)),
                    closeVal: parseFloat(c.toFixed(3)),
                    highVal: parseFloat(h.toFixed(3)),
                    lowVal: parseFloat(l.toFixed(3)),
                    candleWick: [parseFloat(l.toFixed(3)), parseFloat(h.toFixed(3))],
                    candleBody: [parseFloat(o.toFixed(3)), parseFloat(c.toFixed(3))],
                    sma50: parseFloat(s50.toFixed(3)),
                    sma200: parseFloat(s200.toFixed(3)),
                    upperBB: parseFloat(uBB.toFixed(3)),
                    lowerBB: parseFloat(lBB.toFixed(3))
                  };
                });

                const isProduct = selectedAsset === "Gasoline" || selectedAsset === "Heating Oil";
                const formatPrice = (v: number) => `$${v.toFixed(isProduct ? 3 : 2)}`;

                // Fibonacci dynamic calculation based on visible range
                let fib100 = 80.50, fib618 = 78.70, fib50 = 77.20, fib382 = 75.80, fib0 = 73.50;
                if (mappedChartData.length > 0) {
                  const prices = mappedChartData.map(d => d.activePrice);
                  const maxPrice = Math.max(...prices);
                  const minPrice = Math.min(...prices);
                  const diff = maxPrice - minPrice;
                  if (diff > 0) {
                    fib100 = maxPrice;
                    fib618 = maxPrice - diff * 0.382;
                    fib50 = maxPrice - diff * 0.50;
                    fib382 = maxPrice - diff * 0.618;
                    fib0 = minPrice;
                  }
                }

                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mappedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWti" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#475569" 
                        fontSize={10} 
                        tickLine={false} 
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        stroke="#475569" 
                        fontSize={10} 
                        tickLine={false} 
                        orientation="right"
                        tickFormatter={(v) => v.toFixed(isProduct ? 3 : 1)}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0c1015', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9', borderRadius: '12px' }}
                        labelStyle={{ fontSize: '11px', color: '#94a3b8' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-950/95 border border-white/15 p-3 rounded-2xl text-[11px] font-mono shadow-2xl backdrop-blur-md min-w-[140px]">
                                <p className="text-slate-400 mb-1.5 border-b border-white/5 pb-1 font-bold">Time: {label}</p>
                                <p className="text-indigo-400 mb-1.5 uppercase font-bold">{selectedAsset} Spot</p>
                                {chartType === "candle" ? (
                                  <div className="space-y-1">
                                    <p className="flex justify-between gap-4 text-slate-405">Open: <span className="text-slate-100 font-bold">{formatPrice(data.openVal)}</span></p>
                                    <p className="flex justify-between gap-4 text-emerald-400 font-semibold">High: <span className="text-slate-100 font-bold">{formatPrice(data.highVal)}</span></p>
                                    <p className="flex justify-between gap-4 text-red-400 font-semibold">Low: <span className="text-slate-100 font-bold">{formatPrice(data.lowVal)}</span></p>
                                    <p className="flex justify-between gap-4 text-slate-405">Close: <span className="text-slate-100 font-bold">{formatPrice(data.closeVal)}</span></p>
                                  </div>
                                ) : (
                                  <p className="text-indigo-300 flex justify-between gap-4">Spot: <span className="text-slate-100 font-bold">{formatPrice(data.activePrice)}</span></p>
                                )}
                                <p className="text-slate-505 mt-2 text-[10px] border-t border-white/5 pt-1">Vol: {data.volume.toLocaleString()}</p>
                                {payload.map((p, i) => {
                                  if (p.name && !["candleWick", "candleBody", "Wick", "Body", "activePrice"].includes(p.name)) {
                                    const valNum = typeof p.value === 'number' ? p.value : 0;
                                    return <p key={i} style={{ color: p.stroke }} className="text-[10px] mt-0.5">{p.name}: {formatPrice(valNum)}</p>
                                  }
                                  return null;
                                })}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      
                      {/* Render based on chartType */}
                      {chartType === "area" ? (
                        <Area type="monotone" dataKey="activePrice" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorWti)" name={`${selectedAsset} Price`} />
                      ) : (
                        // Candlestick rendering
                        [
                          // Wick bar (very thin with custom colors per tick)
                          <Bar key="wick" dataKey="candleWick" barSize={1} name="Wick">
                            {mappedChartData.map((entry, idx) => (
                              <Cell key={`wick-cell-${idx}`} fill={entry.closeVal >= entry.openVal ? '#10b981' : '#ef4444'} />
                            ))}
                          </Bar>,
                          // Body bar (full width with custom colors per tick)
                          <Bar key="body" dataKey="candleBody" barSize={6} name="Body">
                            {mappedChartData.map((entry, idx) => (
                              <Cell key={`body-cell-${idx}`} fill={entry.closeVal >= entry.openVal ? '#10b981' : '#ef4444'} />
                            ))}
                          </Bar>
                        ]
                      )}

                      {/* Standard indicators conditionally loaded */}
                      {showSMA50 && (
                        <Line type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="SMA 50" />
                      )}
                      {showSMA200 && (
                        <Line type="monotone" dataKey="sma200" stroke="#6366f1" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="SMA 200" />
                      )}
                      {showBB && (
                        <Line type="monotone" dataKey="upperBB" stroke="#ec4899" strokeWidth={1} dot={false} name="Upper BB" />
                      )}
                      {showBB && (
                        <Line type="monotone" dataKey="lowerBB" stroke="#ec4899" strokeWidth={1} dot={false} name="Lower BB" />
                      )}

                      {/* Fibonacci retracements lines */}
                      {showFib && ticks.length > 0 && (
                        <React.Fragment>
                          <ReferenceLine y={fib100} label={{ value: `Fib 100% (${fib100.toFixed(isProduct ? 3 : 2)})`, fill: '#ef4444', fontSize: 10, position: 'insideRight' }} stroke="#ef4444" strokeDasharray="2 4" />
                          <ReferenceLine y={fib618} label={{ value: `Fib 61.8% (${fib618.toFixed(isProduct ? 3 : 2)})`, fill: '#fb923c', fontSize: 10, position: 'insideRight' }} stroke="#fb923c" strokeDasharray="2 4" />
                          <ReferenceLine y={fib50} label={{ value: `Fib 50.0% (${fib50.toFixed(isProduct ? 3 : 2)})`, fill: '#fbbf24', fontSize: 10, position: 'insideRight' }} stroke="#fbbf24" strokeDasharray="2 4" />
                          <ReferenceLine y={fib382} label={{ value: `Fib 38.2% (${fib382.toFixed(isProduct ? 3 : 2)})`, fill: '#22c55e', fontSize: 10, position: 'insideRight' }} stroke="#22c55e" strokeDasharray="2 4" />
                          <ReferenceLine y={fib0} label={{ value: `Fib 0.0% (${fib0.toFixed(isProduct ? 3 : 2)})`, fill: '#10b981', fontSize: 10, position: 'insideRight' }} stroke="#10b981" strokeDasharray="2 4" />
                        </React.Fragment>
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
            )}



          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* EIA Weekly macro statistics block  */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" /> 
                  EIA Macro Fundamentals
                  {eiaIsSimulated ? (
                    <span className="ml-2 text-[8px] font-mono font-normal bg-amber-500/10 text-amber-500 border border-amber-500/25 px-1.5 py-0.2 rounded animate-pulse" title="Configure EIA_API_KEY in .env for live API access">
                      Simulated
                    </span>
                  ) : (
                    <span className="ml-2 text-[8px] font-mono font-normal bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.2 rounded">
                      Live API
                    </span>
                  )}
                </span>
                <span className="text-[9px] text-slate-500 font-mono font-normal">Wednesdays reporting</span>
              </h3>

              <div className="space-y-2 mb-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#0c1015]/40 p-2.5 rounded-xl border border-white/10 text-center">
                    <span className="text-[8px] text-slate-500 block font-mono">CRUDE STOCK</span>
                    <span className="text-xs font-bold text-slate-100">
                      {eiaStats.length > 0 ? `${eiaStats[eiaStats.length - 1].crudeInventory.toFixed(1)}M` : "---"} bbl
                    </span>
                  </div>
                  <div className="bg-[#0c1015]/40 p-2.5 rounded-xl border border-white/10 text-center">
                    <span className="text-[8px] text-slate-500 block font-mono">SPR LEVELS</span>
                    <span className="text-xs font-bold text-slate-100">
                      {eiaStats.length > 0 ? `${eiaStats[eiaStats.length - 1].sprLevel.toFixed(1)}M` : "---"} bbl
                    </span>
                  </div>
                  <div className="bg-[#0c1015]/40 p-2.5 rounded-xl border border-white/10 text-center">
                    <span className="text-[8px] text-slate-500 block font-mono">US PRODUCTION</span>
                    <span className="text-xs font-bold text-slate-100">
                      {eiaStats.length > 0 ? `${eiaStats[eiaStats.length - 1].weeklyProduction.toFixed(1)}` : "---"} mb/d
                    </span>
                  </div>
                </div>
              </div>

              {/* EIA inventory changes mini charts */}
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={eiaStats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="weekStarting" fontSize={8} stroke="#475569" />
                    <YAxis fontSize={8} stroke="#475569" />
                    <Tooltip contentStyle={{ backgroundColor: '#0c1015', fontSize: 10, borderRadius: '8px', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="inventoryChange" fill="#3b82f6" name="Inventory Draws (-) / Builds (+)">
                      {eiaStats.map((entry, index) => (
                        <cell key={`cell-${index}`} fill={entry.inventoryChange < 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* Baker Hughes / Rig counts upstream widget */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
              <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> 
                  Baker Hughes Rig Counts
                  {rigsIsSimulated ? (
                    <span className="ml-2 text-[8px] font-mono font-normal bg-amber-500/10 text-amber-500 border border-amber-500/25 px-1.5 py-0.2 rounded animate-pulse" title="Configure EIA_API_KEY in .env for live API access">
                      Simulated
                    </span>
                  ) : (
                    <span className="ml-2 text-[8px] font-mono font-normal bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.2 rounded">
                      Live API
                    </span>
                  )}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">Fridays reporting</span>
              </h3>

              <div className="space-y-2 mb-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#0c1015]/40 p-2.5 rounded-xl border border-white/10 text-center">
                    <span className="text-[8px] text-slate-500 block font-mono">US OIL RIGS</span>
                    <span className="text-xs font-bold text-red-400">
                      {latestRig ? latestRig.oilRigs : "---"}
                      {latestRig && latestRig.oilChange !== undefined && latestRig.oilChange !== 0 && (
                        <span className={`text-[9px] font-normal ml-1 ${latestRig.oilChange >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                          ({latestRig.oilChange >= 0 ? "+" : ""}{latestRig.oilChange})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="bg-[#0c1015]/40 p-2.5 rounded-xl border border-white/10 text-center">
                    <span className="text-[8px] text-slate-500 block font-mono">GAS RIGS</span>
                    <span className="text-xs font-bold text-slate-200">
                      {latestRig ? latestRig.gasRigs : "---"}
                      {latestRig && latestRig.gasChange !== undefined && latestRig.gasChange !== 0 && (
                        <span className={`text-[9px] font-normal ml-1 ${latestRig.gasChange >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                          ({latestRig.gasChange >= 0 ? "+" : ""}{latestRig.gasChange})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="bg-[#0c1015]/40 p-2.5 rounded-xl border border-white/10 text-center">
                    <span className="text-[8px] text-slate-500 block font-mono">TOTAL US RIGS</span>
                    <span className="text-xs font-bold text-slate-100">
                      {latestRig ? latestRig.totalRigs : "---"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rigs history lines charting */}
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rigsStats} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="weekStarting" fontSize={8} stroke="#475569" />
                    <YAxis domain={['auto', 'auto']} fontSize={8} stroke="#475569" />
                    <Tooltip contentStyle={{ backgroundColor: '#0c1015', fontSize: 10, borderRadius: '8px', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Line type="monotone" dataKey="oilRigs" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} name="Active Oil Rigs" />
                    <Line type="monotone" dataKey="gasRigs" stroke="#6366f1" strokeWidth={1} dot={false} name="Active Gas Rigs" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>

          </div>

          {/* Global supply & demand of oil widget - Full Page Width */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl w-full">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              
              {/* Left Column: Metadata & KPIs */}
              <div className="lg:w-1/3 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" /> Global Supply & Demand Balance
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-normal mb-4">
                    Track global petroleum supply versus demand projections based on the latest IEA quarterly energy reports.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#0c1015]/40 p-2.5 rounded-xl border border-white/10 text-center">
                      <span className="text-[8px] text-slate-500 block font-mono">GLO SUPPLY</span>
                      <span className="text-xs font-bold text-emerald-400">104.5 mb/d</span>
                    </div>
                    <div className="bg-[#0c1015]/40 p-2.5 rounded-xl border border-white/10 text-center">
                      <span className="text-[8px] text-slate-500 block font-mono">GLO DEMAND</span>
                      <span className="text-xs font-bold text-indigo-400">104.9 mb/d</span>
                    </div>
                    <div className="bg-[#0c1015]/40 p-2.5 rounded-xl border border-white/10 text-center">
                      <span className="text-[8px] text-slate-500 block font-mono">BALANCE (NET)</span>
                      <span className="text-xs font-bold text-red-400">-0.4 mb/d</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Expanded Chart */}
              <div className="lg:w-2/3 h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supplyDemandData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="period" fontSize={9} stroke="#475569" />
                    <YAxis domain={[98, 107]} fontSize={9} stroke="#475569" />
                    <Tooltip contentStyle={{ backgroundColor: '#0c1015', fontSize: 10, borderRadius: '8px', borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: 9 }} />
                    <Bar dataKey="supply" fill="#10b981" name="Supply (mb/d)" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="demand" fill="#6366f1" name="Demand (mb/d)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>

          {/* Dynamic Crack Spreads, Forward Curves, & Product Fly Butterfly - Full Width Page Stack */}
          <div className="space-y-4 w-full">
            
            {/* Crack spread margins (3-2-1) */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl w-full">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                
                {/* Left Column: Metadata */}
                <div className="lg:w-1/3 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-2">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" /> Crack Spreads (3-2-1 Margins)
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-normal mb-4">
                      Assesses typical refinery gross output profitability. Calculated under the industry standard 3-2-1 formula representing 3 barrels of crude oil refined into 2 barrels of clean gasoline and 1 barrel of heating oil/distillates.
                    </p>
                  </div>
                  
                  <div className="bg-[#0c1015]/40 p-3 rounded-xl border border-white/10 font-mono text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Feedstock:</span>
                      <span className="text-slate-300 font-bold">WTI Light Sweet</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current 3-2-1 Crack Margin:</span>
                      <span className="text-purple-400 font-bold">${crackSpreads.length > 0 ? crackSpreads[crackSpreads.length - 1].crack321.toFixed(2) : "0.00"}/bbl</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Chart */}
                <div className="lg:w-2/3 h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={crackSpreads} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="crack" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="timeIndex" fontSize={9} stroke="#475569" />
                      <YAxis fontSize={9} stroke="#475569" />
                      <Tooltip contentStyle={{ backgroundColor: '#0c1015', fontSize: 10, borderRadius: '8px', borderColor: 'rgba(255,255,255,0.1)' }} />
                      <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: 9 }} />
                      <Area type="monotone" dataKey="crack321" stroke="#a855f7" fillOpacity={1} fill="url(#crack)" strokeWidth={1.5} name="3-2-1 Crack Margin ($/bbl)" />
                      <Line type="monotone" dataKey="gasolineCrack" stroke="#10b981" strokeWidth={1} dot={false} name="Gasoline Spread" />
                      <Line type="monotone" dataKey="distillateCrack" stroke="#f59e0b" strokeWidth={1} dot={false} name="Distillate Spread" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>

            {/* Product & Crude Butterfly FLY Terminal */}
            {(() => {
              const flyData = ticks.map((t) => {
                const w = t.wti;
                const b = t.brent;
                const g = t.gasoline ?? (b * 0.032 + 0.08); // gal
                const h = t.heatingOil ?? (w * 0.030 + 0.04); // gal
                
                const gasBbl = g * 42;
                const hoBbl = h * 42;
                
                // Butterfly Fly Formula: Net refined fuel prices relative to underlying crude oil input raw feed
                const flyValue = parseFloat((gasBbl + hoBbl - 2 * w).toFixed(2));
                const meanVal = 38.50; // Historical benchmark
                return {
                  timeIndex: t.timestamp,
                  flyValue,
                  upperLimit: parseFloat((meanVal + 5.5).toFixed(2)),
                  lowerLimit: parseFloat((meanVal - 5.5).toFixed(2)),
                  mean: meanVal
                };
              });

              const latestFly = flyData.length > 0 ? flyData[flyData.length - 1].flyValue : 0;
              const isFlyWidening = flyData.length > 1 ? latestFly > flyData[flyData.length - 2].flyValue : true;

              return (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl w-full">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    
                    {/* Left Column: Metadata */}
                    <div className="lg:w-1/3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-violet-400" /> Product & Crude FLY (Butterfly)
                          </h3>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isFlyWidening ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                            {isFlyWidening ? "▲ Widening Fly" : "▼ Mean Reverting"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal mb-4">
                          Structure: <code className="text-slate-300 font-mono font-semibold bg-white/5 px-1 py-0.2 rounded">(RBOB + HO) - (2 × WTI)</code>. Tracks absolute value difference of product gains relative to crude inputs. Helps detect overbought margins.
                        </p>
                      </div>

                      <div className="bg-[#0c1015]/40 p-3 rounded-xl border border-white/10 font-mono text-[10px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Current FLY Margin:</span>
                          <span className="text-violet-400 font-bold">${latestFly.toFixed(2)}/bbl</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Median Basis:</span>
                          <span className="text-slate-400">$38.50/bbl</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Chart */}
                    <div className="lg:w-2/3 h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={flyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <XAxis dataKey="timeIndex" hide />
                          <YAxis domain={['auto', 'auto']} fontSize={9} stroke="#475569" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0c1015', fontSize: 10, borderRadius: '8px', borderColor: 'rgba(255,255,255,0.1)' }}
                          />
                          <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: 9 }} />
                          <Line type="monotone" dataKey="flyValue" stroke="#c084fc" strokeWidth={1.8} dot={false} name="Butterfly Spread ($)" />
                          <Line type="monotone" dataKey="upperLimit" stroke="#f43f5e" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Overbought (+2σ)" />
                          <Line type="monotone" dataKey="lowerLimit" stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Oversold (-2σ)" />
                          <Line type="monotone" dataKey="mean" stroke="#64748b" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Median Basis" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* Price Delivery Forward Curve */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl w-full">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                
                {/* Left Column: Metadata & Toggler */}
                <div className="lg:w-1/3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-400" /> Price Delivery Forward Curve
                      </h3>
                      
                      {/* Structural toggler */}
                      <button 
                        onClick={() => {
                          setIsBackwardation(!isBackwardation);
                          setCustomForwardCurve(isBackwardation ? FORWARD_CURVE_CONTANGO : FORWARD_CURVE_BACKWARDATION);
                          triggerSysNotification(`Curve toggled to ${isBackwardation ? "Contango (Oversupply)" : "Backwardation (Premium demand)"}`, "info");
                        }}
                        className="text-[9px] bg-white/5 border border-white/10 hover:bg-white/20 text-indigo-405 font-mono px-2 py-1 rounded-xl transition uppercase cursor-pointer">
                        Structure: {isBackwardation ? "Backwardation" : "Contango"}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal mb-4">
                      Plots the futures term structure of contracts expiring across sequential tenors (M1 to M6). Toggle to visualize market supply glut (Contango) versus tight prompt physical delivery demand (Backwardation).
                    </p>
                  </div>

                  <div className="bg-[#0c1015]/40 p-3 rounded-xl border border-white/10 font-mono text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Prompt Contract (M1):</span>
                      <span className="text-orange-400 font-bold">${customForwardCurve[0]?.price.toFixed(2)}/bbl</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Back Tenor (M6):</span>
                      <span className="text-slate-400 font-bold">${customForwardCurve[customForwardCurve.length - 1]?.price.toFixed(2)}/bbl</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Chart */}
                <div className="lg:w-2/3 h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={customForwardCurve} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="contract" fontSize={9} stroke="#475569" />
                      <YAxis domain={['auto', 'auto']} fontSize={9} stroke="#475569" />
                      <Tooltip contentStyle={{ backgroundColor: '#0c1015', fontSize: 10, borderRadius: '8px', borderColor: 'rgba(255,255,255,0.1)' }} />
                      <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: 9 }} />
                      <Line type="monotone" dataKey="price" stroke="#fb923c" strokeWidth={2} activeDot={{ r: 4 }} name="Expiring Forward Price" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </div>


          </div>

          {/* WATERMARKED EQUITY CURVE & HISTORIC TRADED CLOSED POSITIONS */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between mb-3 animate-fade-in">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-450" /> Equity Balance Curve</span>
              <span className="text-[10px] text-emerald-450 font-mono">Max Drawdown (MDD): <span className="font-bold">{marketState.maxDrawdown}%</span></span>
            </h3>

            {/* Simulated mini equity curve showing high water mark drawdown shaded areas in red */}
            <div className="h-28 w-full bg-slate-950/20 p-2.5 rounded-2xl border border-white/10 relative">
              
              {/* Drawdown watermark warning indicators */}
              {marketState.maxDrawdown > 0 && (
                <div className="absolute top-2 right-4 text-[9px] text-red-400 font-mono uppercase bg-red-950/20 border border-red-500/20 px-1.5 py-0.5 rounded-xl flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Under High-Water drawdown!
                </div>
              )}

              <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-650 uppercase z-10">PORTFOLIO CAPITAL EQUITIES WATERMARK</div>

              {/* Graphical simulation of equity curve lines */}
              <div className="w-full h-full flex flex-col justify-end">
                <div className="flex-1 flex items-end">
                  {/* Dynamic bars depicting peak vs drawdown depth */}
                  <div className="w-full h-1/2 flex items-stretch gap-1">
                    {Array.from({ length: 45 }).map((_, idx) => {
                      // Stylize a capital curve fluctuation
                      const sinDev = Math.sin(idx / 6) * 15;
                      const noise = Math.cos(idx / 3) * 5;
                      const scaleHeight = 40 + sinDev + noise;

                      // Drawdown color shading
                      const isEndSegmentUnder = idx > 30;

                      return (
                        <div 
                          key={idx} 
                          title={`Segment ${idx}`}
                          className={`flex-1 rounded-sm transition-all duration-300 ${
                            isEndSegmentUnder ? "bg-red-500/35 border-t border-red-400" : "bg-emerald-500/15"
                          }`}
                          style={{ height: `${Math.max(10, Math.min(100, scaleHeight))}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1.5 font-mono">
                  <span>Start capitalization ($10M)</span>
                  <span className="text-emerald-400 font-bold font-numeric">Current Equity: ${marketState.portfolioValue.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                </div>
              </div>
            </div>

            {/* Traded Close History Log Items */}
            <div className="mt-3 overflow-x-auto">
              <span className="text-[10px] text-slate-550 uppercase font-mono block mb-1.5">Executed Trades Log History</span>
              {tradeHistory.length === 0 ? (
                <div className="text-[11px] text-slate-400 py-3 text-center border border-dashed border-white/10 rounded-xl font-mono bg-white/5">
                  No completed positions logged in this session yet. Use execution desk on the right.
                </div>
              ) : (
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
                  {tradeHistory.map(th => (
                    <div key={th.id} className="flex items-center justify-between p-1.5 border border-white/10 bg-white/5 rounded-xl mb-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold uppercase text-[9px] px-1.5 py-0.5 rounded-xl ${th.side === "LONG" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>{th.side}</span>
                        <span className="text-slate-200 font-semibold">{th.sizeBarrels.toLocaleString()} bbl {th.symbol}</span>
                        <span className="text-slate-500">Entry @ ${th.entryPrice.toFixed(2)} → Exit @ ${th.exitPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-slate-500 uppercase">{th.exitReason}</span>
                        <span className={`font-bold ${th.realizedPl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {th.realizedPl >= 0 ? "+" : ""}${th.realizedPl.toLocaleString(undefined, {maximumFractionDigits:0})}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </section>

        {/* -- RIGHT COLUMN: INTEGRATED SENTIMENT / CORE BROKER / TRADE BAR -- */}
        <section className="xl:col-span-3 flex flex-col gap-4">
          
          {/* Real-time system / broker alerts logs tickers */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Integrated Telemetry Logs</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </h3>

            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin text-[10px] font-mono">
              {brokerAlerts.length === 0 ? (
                <p className="text-slate-500 text-center py-4 bg-white/5 rounded-xl border border-white/10">
                  SYSTEM READY: Listening for geopolitical or EIA storage volatility alerts...
                </p>
              ) : (
                brokerAlerts.map(alert => (
                  <div key={alert.id} className="p-1.5 bg-white/5 rounded-xl border border-white/10 flex items-start gap-1.5">
                    <span className="text-[8px] text-slate-505 mt-0.5">{alert.time}</span>
                    <p className={`flex-1 ${
                      alert.type === "alert" ? "text-red-400 font-bold" : (alert.type === "warning" ? "text-amber-400 font-semibold" : "text-slate-300")
                    }`}>
                      {alert.msg}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Segmented News catalog and list */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex-1 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-emerald-400" /> Catalyst Feed News
              </h3>
              
              {/* Trigger news generation manual */}
              <button 
                onClick={handleGenerateEmergencyNews}
                disabled={isGeneratingAlert}
                title="Generates random realistic oil market breaking news events using Gemini"
                className="text-[9px] bg-white/10 text-amber-500 border border-white/15 hover:bg-white/20 px-2 py-1 rounded-xl flex items-center gap-1 font-mono uppercase cursor-pointer disabled:opacity-50 transition">
                <Zap className="w-3 h-3 text-amber-500 animate-bounce" /> Push Breaking Alert
              </button>
            </div>

            {/* Horizontal Trump vs OilPrice tab switches */}
            <div className="flex bg-white/5 p-1 rounded-xl mb-3 border border-white/10 gap-1 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => handleTabChange("trump")}
                className={`flex-1 flex items-center justify-center gap-0.5 py-1.5 rounded-lg uppercase transition cursor-pointer ${
                  newsTab === "trump"
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <img referrerPolicy="no-referrer" src="https://flagcdn.com/us.svg" alt="US Flag" className="w-3.5 h-2 rounded shadow shadow-sm opacity-90 object-cover" />
                Trump Feed
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("oilprice")}
                className={`flex-1 flex items-center justify-center gap-0.5 py-1.5 rounded-lg uppercase transition cursor-pointer ${
                  newsTab === "oilprice"
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/25 shadow-sm font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-sky-400" /> OilPrice Live
              </button>
            </div>

            <>
                {/* News Lists catalog */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin max-h-[200px]">
                  {filteredNews.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-500 font-mono px-4 border border-white/5 border-dashed rounded-xl">
                      {isLoadingOilPrice 
                        ? "Loading live feed from OilPrice.com..."
                        : newsTab === "trump"
                        ? "No live administration feeds active. Trigger actions via the Policy Desk or push breaking alerts."
                        : newsTab === "oilprice"
                        ? "Failed to load live feed. Ensure your server is online."
                        : "No general market catalyst news active."}
                    </div>
                  ) : (
                    filteredNews.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => setSelectedNewsId(n.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer text-left ${
                          selectedNewsId === n.id 
                            ? "bg-white/15 border-indigo-500/50" 
                            : "bg-white/5 hover:bg-white/10 border-white/10"
                        }`}>
                        <div className="flex items-center justify-between text-[9px] font-mono mb-1.5">
                          <span className={`px-1.5 py-0.5 rounded-xl text-[8px] uppercase ${
                            n.category === "Geopolitical" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            n.category === "Downstream" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                            n.category === "Midstream" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" :
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {n.category}
                          </span>
                          <span className="text-slate-500">{n.time}</span>
                        </div>
                        <h4 className="text-xs font-medium text-slate-100 line-clamp-2 leading-snug">
                          {n.headline}
                        </h4>
                        <div className="flex items-center justify-between mt-2 text-[9px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1.5 flex-wrap">
                            <span>Source: {n.source}</span>
                            {n.link && (
                              <a 
                                href={n.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                onClick={(e) => e.stopPropagation()} 
                                className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-0.5"
                                title="Open full article on OilPrice.com"
                              >
                                [Read <ExternalLink className="w-2.5 h-2.5 inline" />]
                              </a>
                            )}
                            {n.finbertScore !== undefined && (
                              <span className={`px-1.5 py-0.2 rounded font-semibold ${
                                n.finbertScore > 0.15 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                                n.finbertScore < -0.15 ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                              }`}>
                                FinBERT: {n.finbertScore > 0 ? "+" : ""}{n.finbertScore.toFixed(2)}
                              </span>
                            )}
                          </span>
                          <span className={`font-bold ${n.impactRating === "High" ? "text-red-400" : "text-amber-400"}`}>
                            {n.impactRating} Impact
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* AI Sentiment Analysis Side/Footer Panel */}
                <div className="mt-3 pt-3 border-t border-white/10 flex-1 flex flex-col justify-between text-xs">
                  <div>
                    {/* Visual article link button */}
                    {selectedNews.link && (
                      <div className="mb-2.5">
                        <a 
                          href={selectedNews.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/20 rounded-xl font-mono text-[9px] uppercase tracking-wider transition shadow hover:shadow-md cursor-pointer"
                        >
                          Read Full Article on OilPrice.com <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* FinBERT Sentiment Gauge */}
                    {selectedNews.finbertScore !== undefined && (
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 mb-3 text-xs">
                        <div className="flex items-center justify-between mb-1.5 font-mono">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest text-indigo-300">📊 FinBERT NLP Sentiment</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] uppercase ${
                            selectedNews.finbertScore > 0.15 ? "bg-emerald-500/15 text-emerald-400" :
                            selectedNews.finbertScore < -0.15 ? "bg-red-500/15 text-red-400" : "bg-slate-500/15 text-slate-400"
                          }`}>
                            {selectedNews.finbertScore > 0.15 ? "BULLISH" : selectedNews.finbertScore < -0.15 ? "BEARISH" : "NEUTRAL"} ({selectedNews.finbertScore > 0 ? "+" : ""}{selectedNews.finbertScore.toFixed(4)})
                          </span>
                        </div>
                        {/* Visual Gauge Track */}
                        <div className="relative h-2 w-full bg-gradient-to-r from-red-500/80 via-slate-650 to-emerald-500/80 rounded-full overflow-visible my-2.5 border border-white/5">
                          {/* Indicator needle */}
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-2 border-indigo-500 rounded-full shadow-lg transition-all duration-500 flex items-center justify-center"
                            style={{ left: `${((selectedNews.finbertScore + 1) / 2) * 100}%` }}
                          >
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                          </div>
                        </div>
                        {/* Axis labels */}
                        <div className="flex justify-between text-[8px] text-slate-500 font-mono">
                          <span>-1.0 BEARISH</span>
                          <span>0.0 NEUTRAL</span>
                          <span>+1.0 BULLISH</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-slate-400 font-mono tracking-widest block uppercase font-bold text-indigo-400">
                        📡 Gemini AI Strategic Report
                      </span>
                      {selectedNews.sentiment ? (
                        <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded-xl ${
                          selectedNews.sentiment === "Bullish" ? "bg-emerald-500/15 text-emerald-400" :
                          selectedNews.sentiment === "Bearish" ? "bg-red-500/15 text-red-400" : "bg-slate-500/15 text-slate-400"
                        }`}>
                          {selectedNews.sentiment} (Conf: {selectedNews.confidence}%)
                        </span>
                      ) : selectedNews.isAnalyzing ? (
                        <span className="text-[9px] font-mono text-amber-400 animate-pulse uppercase">
                          Gemini loading analysis...
                        </span>
                      ) : null}
                    </div>

                    {selectedNews.isAnalyzing ? (
                      <div className="py-6 text-center text-slate-400 font-mono text-[10px] space-y-2">
                        <Activity className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
                        <span>Executing full-stack intelligence query with Gemini 3.5...</span>
                      </div>
                    ) : selectedNews.sentiment ? (
                      <div className="space-y-2 text-[11px] leading-relaxed">
                        <p className="text-slate-300 font-medium">{selectedNews.explanation}</p>
                        
                        {/* Recommended position summary */}
                        <div className="grid grid-cols-2 gap-2 bg-white/5 p-2 rounded-xl border border-white/10 font-mono text-[10px]">
                          <div>
                            <span className="text-slate-500 block">TRADE POSITION</span>
                            <span className={`font-bold uppercase ${
                              selectedNews.recommendedTrade === "Long" ? "text-emerald-400" :
                              selectedNews.recommendedTrade === "Short" ? "text-red-400" : "text-slate-400"
                            }`}>{selectedNews.recommendedTrade || "Hold Basis"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">TP / SL TARGET</span>
                            <span className="text-slate-300 font-medium font-numeric">
                              Target: +${selectedNews.targetStop?.target.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Impact Horizon Curve charting preview list */}
                        {selectedNews.impactTimeline && (
                          <div className="mt-2.5">
                            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest block mb-1">
                              Estimated Reaction Horizon Timeline
                            </span>
                            
                            <div className="h-20 w-full mt-1.5">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={selectedNews.impactTimeline} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="horizonColor" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={selectedNews.sentiment === "Bullish" ? "#10b981" : "#ef4444"} stopOpacity={0.25}/>
                                      <stop offset="95%" stopColor={selectedNews.sentiment === "Bullish" ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <XAxis dataKey="time" fontSize={7} stroke="#475569" tickLine={false} />
                                  <YAxis domain={['auto', 'auto']} fontSize={7} stroke="#475569" tickLine={false} />
                                  <Tooltip contentStyle={{ backgroundColor: '#0c1015', fontSize: 9, borderRadius: '8px', borderColor: 'rgba(255,255,255,0.1)' }} />
                                  <Area type="monotone" dataKey="priceDelta" stroke={selectedNews.sentiment === "Bullish" ? "#10b981" : "#ef4444"} fillOpacity={1} fill="url(#horizonColor)" strokeWidth={1} name="Est Delta (USD)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-4 text-center bg-white/5 rounded-xl border border-white/10 border-dashed">
                        <button 
                          onClick={() => analyzeNewsItem(selectedNews)}
                          className="text-xs bg-white/10 hover:bg-white/20 text-indigo-405 font-mono px-3.5 py-1.5 border border-white/10 shadow hover:shadow-lg rounded-xl uppercase cursor-pointer transition">
                          Analyze News
                        </button>
                        <p className="text-[9px] text-slate-500 mt-1">Leverage Gemini to parse mechanical price delta curves.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>

          </div>

          {/* TradingView Spread Desk */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-xl text-slate-100 flex flex-col gap-3.5">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-sky-400 animate-pulse" /> TradingView Spread Desk
              </span>
              <span className="text-[9px] text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded font-mono font-normal">MANUAL EVALUATOR</span>
            </h3>

            {/* Real-time Tickers (TradingView tickers mapping) */}
            <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center bg-slate-950 p-2 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-500 block text-[8px] uppercase">TVC:USOIL</span>
                <span className="font-bold text-slate-200">${marketState.wtiPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[8px] uppercase">TVC:UKOIL</span>
                <span className="font-bold text-slate-200">${marketState.brentPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[8px] uppercase">GASOLINE</span>
                <span className="font-bold text-slate-200">${marketState.gasolinePrice.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[8px] uppercase">HEATINGOIL</span>
                <span className="font-bold text-slate-200">${marketState.heatingOilPrice.toFixed(3)}</span>
              </div>
            </div>

            {/* Spreads calculations */}
            <div className="space-y-2.5 text-xs">
              {/* Multi-Commodity Spread Calculations */}
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col gap-2.5">
                
                {/* Brent-WTI Spread */}
                <div className="flex justify-between items-center font-mono border-b border-white/5 pb-1">
                  <span className="text-slate-400">Brent-WTI Spread:</span>
                  <span className="font-bold text-sky-400 font-numeric text-sm">
                    ${(marketState.brentPrice - marketState.wtiPrice).toFixed(2)}
                  </span>
                </div>

                {/* Gas-WTI Crack Spread */}
                <div className="flex justify-between items-center font-mono border-b border-white/5 pb-1">
                  <span className="text-slate-400">Gasoline-WTI Crack:</span>
                  <span className="font-bold text-sky-400 font-numeric text-sm">
                    ${((marketState.gasolinePrice * 42) - marketState.wtiPrice).toFixed(2)}
                  </span>
                </div>

                {/* HO-WTI Crack Spread */}
                <div className="flex justify-between items-center font-mono border-b border-white/5 pb-1">
                  <span className="text-slate-400">Heating Oil-WTI Crack:</span>
                  <span className="font-bold text-sky-400 font-numeric text-sm">
                    ${((marketState.heatingOilPrice * 42) - marketState.wtiPrice).toFixed(2)}
                  </span>
                </div>

                {/* Gas-HO Spread */}
                <div className="flex justify-between items-center font-mono border-b border-white/5 pb-1">
                  <span className="text-slate-400">Gasoline-HO Spread:</span>
                  <span className="font-bold text-sky-400 font-numeric text-sm">
                    ${((marketState.gasolinePrice - marketState.heatingOilPrice) * 42).toFixed(2)}
                  </span>
                </div>

                {/* WCS-WTI Heavy Discount */}
                <div className="flex justify-between items-center font-mono border-b border-white/5 pb-1">
                  <span className="text-slate-400">WTI-WCS Heavy Discount:</span>
                  <span className="font-bold text-amber-400 font-numeric text-sm">
                    -$14.50
                  </span>
                </div>

                <p className="text-[9px] text-slate-500 font-mono leading-normal pt-1">
                  {marketState.brentPrice - marketState.wtiPrice > 4.0
                    ? "🚢 ARBITRAGE WIDE: Brent premium is wide. US exports to Europe are highly attractive. Favor US exports."
                    : "🚢 ARBITRAGE CLOSED: Brent-WTI premium is narrow. Freight spreads suppress Atlantic Basin export arbitrage."}
                </p>
              </div>

              {/* Custom Crack Spread Calculator */}
              <div className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex flex-col gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Refinery Crack Spread Calculator</span>
                
                {/* Inputs grid */}
                <div className="grid grid-cols-4 gap-1.5 items-center font-mono text-[10px]">
                  {/* Gasoline Multiplier */}
                  <div className="flex flex-col gap-0.5">
                    <label className="text-slate-500 text-[8px]">GAS MULT</label>
                    <input 
                      type="number" 
                      min="0"
                      value={gasMult} 
                      onChange={(e) => setGasMult(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-slate-950 border border-slate-800 rounded p-1 text-center font-bold text-slate-200 w-full" 
                    />
                  </div>
                  {/* Heating Oil Multiplier */}
                  <div className="flex flex-col gap-0.5">
                    <label className="text-slate-500 text-[8px]">HO MULT</label>
                    <input 
                      type="number" 
                      min="0"
                      value={hoMult} 
                      onChange={(e) => setHoMult(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-slate-950 border border-slate-800 rounded p-1 text-center font-bold text-slate-200 w-full" 
                    />
                  </div>
                  {/* Crude Multiplier */}
                  <div className="flex flex-col gap-0.5">
                    <label className="text-slate-500 text-[8px]">CRUDE MULT</label>
                    <input 
                      type="number" 
                      min="1"
                      value={crudeMult} 
                      onChange={(e) => setCrudeMult(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-slate-950 border border-slate-800 rounded p-1 text-center font-bold text-slate-200 w-full" 
                    />
                  </div>
                  {/* Crude Basis Selection */}
                  <div className="flex flex-col gap-0.5">
                    <label className="text-slate-500 text-[8px]">CRUDE BASIS</label>
                    <select 
                      value={crudeBasis} 
                      onChange={(e) => setCrudeBasis(e.target.value as "WTI" | "Brent")}
                      className="bg-slate-950 border border-slate-800 rounded p-0.5 text-[9px] font-bold text-slate-200 h-6"
                    >
                      <option value="WTI">WTI</option>
                      <option value="Brent">Brent</option>
                    </select>
                  </div>
                </div>

                {/* Manual calculation */}
                {(() => {
                  const gasPrice = marketState.gasolinePrice * 42;
                  const hoPrice = marketState.heatingOilPrice * 42;
                  const crudePrice = crudeBasis === "WTI" ? marketState.wtiPrice : marketState.brentPrice;
                  
                  // Manual calculation formula: (gasMult * gasPrice + hoMult * hoPrice - crudeMult * crudePrice) / crudeMult
                  const customCrack = (gasMult * gasPrice + hoMult * hoPrice - crudeMult * crudePrice) / (crudeMult || 3);
                  
                  return (
                    <div className="mt-1 pt-1.5 border-t border-white/5 flex flex-col gap-1">
                      <div className="flex justify-between items-center font-mono">
                        <span className="text-slate-400">Custom Crack Spread:</span>
                        <span className={`font-bold font-numeric text-sm ${customCrack >= 25 ? "text-emerald-400" : (customCrack < 15 ? "text-red-400" : "text-amber-400")}`}>
                          ${customCrack.toFixed(2)} /bbl
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 font-mono leading-normal">
                        Formula: ({gasMult}x Gas + {hoMult}x HO - {crudeMult}x {crudeBasis}) / {crudeMult}
                      </p>
                      <p className="text-[8.5px] text-slate-400 font-medium font-mono leading-normal">
                        {customCrack >= 25 
                          ? "🔥 REFINERY BONANZA: Margins are strong. Refinery yields are yielding high profits." 
                          : (customCrack < 15 
                            ? "📉 REFINING SQUEEZE: Feedstock costs are too high relative to output values." 
                            : "⚖️ STABLE RUNS: Crack margins tracking historical seasonal averages.")}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Core trading desk execution manager */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-xl">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-400 animate-pulse" /> Trade Execution Desk</span>
              <span className="text-[10px] text-slate-500 font-mono">Cash: ${marketState.cashBalance.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
            </h3>

            <form onSubmit={handleExecuteTrade} className="space-y-3">
              
              {/* Asset Selection & Direction Button Pills */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 rounded border border-slate-800 p-0.5 flex">
                  <button 
                    type="button"
                    onClick={() => setTradeAsset("WTI")}
                    className={`flex-1 text-[11px] py-1 rounded font-semibold transition ${
                      tradeAsset === "WTI" ? "bg-slate-800 text-slate-100 border border-slate-705" : "text-slate-400"
                    }`}>
                    WTI
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTradeAsset("Brent")}
                    className={`flex-1 text-[11px] py-1 rounded font-semibold transition ${
                      tradeAsset === "Brent" ? "bg-slate-800 text-slate-100 border border-slate-705" : "text-slate-400"
                    }`}>
                    BRENT
                  </button>
                </div>

                <div className="bg-slate-950 rounded border border-slate-800 p-0.5 flex">
                  <button 
                    type="button"
                    onClick={() => setTradeSide("LONG")}
                    className={`flex-1 text-[11px] py-1 rounded font-bold transition ${
                      tradeSide === "LONG" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-extrabold" : "text-slate-400"
                    }`}>
                    LONG
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTradeSide("SHORT")}
                    className={`flex-1 text-[11px] py-1 rounded font-bold transition ${
                      tradeSide === "SHORT" ? "bg-red-500/10 text-red-500 border border-red-500/30" : "text-slate-400"
                    }`}>
                    SHORT
                  </button>
                </div>
              </div>

              {/* Barrel Position Sizing Box */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block mb-1">Contract volume (bbl)</label>
                  <div className="relative bg-slate-950 border border-slate-800 rounded p-1 flex items-center justify-between">
                    <input 
                      type="number" 
                      step="5000"
                      min="5000"
                      max="1000000"
                      value={tradeBarrels}
                      onChange={(e) => setTradeBarrels(parseInt(e.target.value) || 0)}
                      className="bg-transparent text-xs text-slate-200 border-none focus:outline-none w-full font-mono pl-1" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block mb-1">Margin Leverage ({tradeLeverage}x)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input 
                      type="range"
                      min="1"
                      max="50"
                      value={tradeLeverage}
                      onChange={(e) => setTradeLeverage(parseInt(e.target.value))}
                      className="w-full select-none cursor-pointer accent-amber-500 h-1 bg-slate-800 rounded-lg outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Take-Profit & Stop-Loss Limits Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-400 block font-mono">STOP LOSS PRICE</label>
                  <input 
                    type="number"
                    step="0.05"
                    placeholder={`e.g. ${tradeSide === 'LONG' ? (marketState.wtiPrice - 1.5).toFixed(2) : (marketState.wtiPrice + 1.5).toFixed(2)}`}
                    value={tradeStopLoss}
                    onChange={(e) => setTradeStopLoss(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 block font-mono">TAKE PROFIT PRICE</label>
                  <input 
                    type="number"
                    step="0.05"
                    placeholder={`e.g. ${tradeSide === 'LONG' ? (marketState.wtiPrice + 3.0).toFixed(2) : (marketState.wtiPrice - 3.0).toFixed(2)}`}
                    value={tradeTakeProfit}
                    onChange={(e) => setTradeTakeProfit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-center font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic order math calculation overview info */}
              <div className="bg-slate-950 p-2 border border-slate-850 rounded text-[10px] font-mono leading-relaxed text-slate-400">
                <div className="flex justify-between"><span>Nominal Capital:</span> <span className="text-slate-200">${((tradeBarrels * (tradeAsset === "WTI" ? marketState.wtiPrice : marketState.brentPrice))).toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
                <div className="flex justify-between"><span>Margin Needed:</span> <span className="text-amber-500 font-bold">${((tradeBarrels * (tradeAsset === "WTI" ? marketState.wtiPrice : marketState.brentPrice) / tradeLeverage)).toLocaleString(undefined, {maximumFractionDigits:0})}</span></div>
              </div>

              <button 
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 text-xs font-bold uppercase rounded shadow-lg shadow-emerald-500/10 cursor-pointer">
                Place {tradeSide} Market Order
              </button>
            </form>
          </div>

          {/* ACTIVE POSITIONS PORTFOLIO DESK LIST */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-xl flex-1 flex flex-col min-h-[180px]">
            <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-300" /> Active Desk Positions</span>
              <span className="text-[10px] text-slate-500 font-mono">Count: {activePositions.length}</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[11px] max-h-[160px]">
              {activePositions.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No active trade positions. Use Trade Desk execution triggers.
                </div>
              ) : (
                activePositions.map(p => {
                  const currentPrice = p.symbol === "WTI" ? marketState.wtiPrice : marketState.brentPrice;
                  const delta = currentPrice - p.entryPrice;
                  const sideMult = p.side === "LONG" ? 1 : -1;
                  const unrealizedPl = delta * p.sizeBarrels * sideMult;

                  return (
                    <div key={p.id} className="p-2 bg-slate-950 rounded border border-slate-850 flex flex-col gap-1 text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-slate-700 pointer-events-none" />
                      <div className="flex justify-between items-center text-[10px]">
                        <div>
                          <span className={`font-bold mr-1 ${p.side === "LONG" ? "text-emerald-400" : "text-red-400"}`}>{p.side}</span>
                          <span className="text-slate-100 font-bold">{p.sizeBarrels.toLocaleString()} bbl WTI</span>
                        </div>
                        <button 
                          onClick={() => handleClosePositionManually(p.id)}
                          className="hover:text-red-400 text-slate-500 border-none bg-none p-0 cursor-pointer"
                          title="Close Position at Market Price">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Entry: ${p.entryPrice.toFixed(2)} → ${currentPrice.toFixed(2)}</span>
                        {p.stopLoss && <span className="text-red-400/80">SL: {p.stopLoss.toFixed(2)}</span>}
                      </div>

                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-slate-850">
                        <span className="text-[9px] text-slate-500 font-mono">Lev: {p.leverage}x</span>
                        <span className={`font-bold text-xs ${unrealizedPl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {unrealizedPl >= 0 ? "+" : ""}${unrealizedPl.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Value at Risk (VaR) Desk Thermal Gauge */}
            <div className="mt-3.5 pt-3.5 border-t border-slate-800">
              <div className="flex justify-between items-center text-[10px] mb-1 font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" /> Desk Value-At-Risk (99% VaR)
                </span>
                <span className={`${isVaRBreached ? "text-red-400 animate-pulse font-bold" : "text-slate-300"}`}>
                  ${marketState.valueAtRisk99.toLocaleString()} / <span className="text-slate-500">${riskLimitVaR.toLocaleString()} limit</span>
                </span>
              </div>
              
              {/* Thermal color bar gauge indicator implementation */}
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex font-mono">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isVaRBreached ? "bg-gradient-to-r from-red-600 to-amber-500 animate-pulse" : "bg-gradient-to-r from-emerald-400 to-amber-500"
                  }`} 
                  style={{ width: `${Math.min(100, (marketState.valueAtRisk99 / riskLimitVaR) * 100)}%` }}
                />
              </div>

              {/* Adjustable thermal risk threshold slide limit settings input */}
              <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono text-slate-500">
                <span>Set risk alarm threshold triggers:</span>
                <input 
                  type="number"
                  step="50000"
                  value={riskLimitVaR}
                  onChange={(e) => setRiskLimitVaR(parseInt(e.target.value) || 200000)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] rounded px-1.5 py-0.5 max-w-[85px] font-numeric text-center focus:outline-none" 
                />
              </div>

            </div>

          </div>

        </section>

        {/* Full-width bottom section for term-strip correlation profile matrix, marine weather tracker, and price alerts */}
        <div className="xl:col-span-12 grid grid-cols-1 xl:grid-cols-3 gap-4 mt-2">
          <PriceAlertDesk 
            wtiPrice={marketState.wtiPrice}
            brentPrice={marketState.brentPrice}
            alerts={customAlerts}
            onAddAlert={handleAddAlert}
            onToggleAlert={handleToggleAlert}
            onDeleteAlert={handleDeleteAlert}
            newsAlertEnabled={newsAlertEnabled}
            setNewsAlertEnabled={setNewsAlertEnabled}
            newsShiftThreshold={newsShiftThreshold}
            setNewsShiftThreshold={setNewsShiftThreshold}
          />
          <ContractCorrelationMatrix ticks={ticks} isBackwardation={isBackwardation} />
          <MarineWeatherTracker vessels={vessels} onTriggerNotification={triggerSysNotification} />
        </div>

      </main>

      {/* FOOTER STRIP STATUS BAR */}
      <footer className="bg-slate-900/90 border-t border-slate-800 px-4 py-1.5 flex items-center justify-between text-[10px] font-mono text-slate-500 z-10">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            REFINITIV EIKON ACTIVE CONNECT
          </span>
          <span>BRENT/WTI ARBITRAGE: ${(marketState.brentPrice - marketState.wtiPrice).toFixed(2)}/bbl</span>
          <span>TOTAL VOL: {ticks.length > 0 ? (ticks[ticks.length - 1].volume).toLocaleString() : ""} Lots</span>
        </div>
        <div>
          <span>SECURE SECRETS INJECTED · SANDBOX PORT 3000</span>
        </div>
      </footer>

    </div>
  );
}
