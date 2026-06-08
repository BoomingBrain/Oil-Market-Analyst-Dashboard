import { 
  Vessel, 
  NewsCard, 
  EIAWeeklyStats, 
  BakerHughesStats, 
  CrackSpreadData, 
  ForwardCurvePoint,
  Tick,
  GlobalSupplyDemandPoint
} from "./types";

// Predefined Workspace Layout configurations
export const LAYOUTS = [
  { id: "morning", name: "Morning Briefing", description: "Priority on fundamental sheets, global futures strip and EIA inventory metrics." },
  { id: "opec", name: "OPEC Meeting Strategy", description: "Highlights geopolitical news catalog, implied volatility subcharts, and Brent pricing forward curve." },
  { id: "hurricane", name: "Gulf Hurricane/Supply Disruption", description: "Maximizes marine container vessel logistics maps, Baker Hughes rig activity, and physical premiums." }
];

export const INITIAL_VESSELS: Vessel[] = [
  { id: "v1", name: "TI Europe", type: "VLCC", status: "Laden", speed: 14.2, cargoSize: 2.1, crudeGrade: "WTI Light Sweet", origin: "Houston", destination: "Rotterdam", eta: "May 25", progressPercent: 82 },
  { id: "v2", name: "Front Horizon", type: "VLCC", status: "Laden", speed: 12.8, cargoSize: 2.0, crudeGrade: "Midland Premium", origin: "Houston", destination: "Qingdao", eta: "June 02", progressPercent: 44 },
  { id: "v3", name: "Pacific Jewel", type: "Suezmax", status: "Laden", speed: 11.5, cargoSize: 1.0, crudeGrade: "Heavy Sour Select", origin: "Montreal", destination: "Rotterdam", eta: "May 28", progressPercent: 65 },
  { id: "v4", name: "Sovereign Wave", type: "Suezmax", status: "Ballast", speed: 15.0, cargoSize: 0, crudeGrade: "North Sea Brent", origin: "Qingdao", destination: "Singapore", eta: "May 24", progressPercent: 95 },
  { id: "v5", name: "Sea Eagle", type: "VLCC", status: "Laden", speed: 13.5, cargoSize: 2.2, crudeGrade: "Urals Urals", origin: "Primorsk", destination: "Qingdao", eta: "June 08", progressPercent: 28 },
  { id: "v6", name: "Hormuz Raider", type: "Suezmax", status: "Anchored", speed: 0.0, cargoSize: 1.1, crudeGrade: "Heavy Sour Select", origin: "Ras Tanura", destination: "Singapore", eta: "Arrived", progressPercent: 100 },
  { id: "v7", name: "Orion Express", type: "VLCC", status: "Laden", speed: 14.8, cargoSize: 2.0, crudeGrade: "Midland Premium", origin: "Houston", destination: "Singapore", eta: "May 30", progressPercent: 55 },
  { id: "v8", name: "Euro Voyager", type: "Suezmax", status: "Laden", speed: 13.0, cargoSize: 1.0, crudeGrade: "North Sea Brent", origin: "Sullom Voe", destination: "Rotterdam", eta: "May 26", progressPercent: 70 }
];

export const INITIAL_NEWS: NewsCard[] = [
  {
    id: "news_trump_tariff",
    time: "Just Now",
    headline: "Trump threatens 25% tariff on Canadian and Mexican crude imports; domestic refiners warn of heavy-crude cost spike.",
    category: "Geopolitical",
    source: "Bloomberg Correspondent",
    impactRating: "High",
    sentiment: "Bullish",
    confidence: 91,
    explanation: "Tariff threats on primary land-based imports threaten downstream supply lines for complex Gulf Coast and Midwest refineries designed to run heavy crudes. This is expected to trigger a significant domestic price premium for domestic light-sweet grades like WTI.",
    recommendedTrade: "Long",
    targetStop: { target: 2.80, stop: -1.10 },
    finbertScore: 0.5820,
    impactTimeline: [
      { time: "1 Hour", priceDelta: 1.20, description: "Cushing pricing registers immediate spike on fears of heavy feedstock blockages." },
      { time: "24 Hours", priceDelta: 1.90, description: "Gulf Coast physical differentials surge to multi-month highs." },
      { time: "3 Days", priceDelta: 2.50, description: "Refinery crude buyers bid aggressively on spot sweets as substitute security." },
      { time: "1 Week", priceDelta: 1.50, description: "Partially moderates as diplomatic negotiations resume." },
      { time: "3 Weeks", priceDelta: 1.00, description: "Domestic shale producers expand drill schedules to meet substitution demand." }
    ]
  },
  {
    id: "news_trump_drill",
    time: "4 Mins Ago",
    headline: "Trump signs 'Unleash Energy' executive order fast-tracking federal drilling permits and offshore leasing programs.",
    category: "Upstream",
    source: "Federal Register Desk",
    impactRating: "High",
    sentiment: "Bearish",
    confidence: 88,
    explanation: "This executive order eliminates several NEPA review cycles and opens vast areas in Alaska and the Gulf of Mexico for immediate leasing. It aims to boost US output, which would increase global supplies and deepen the contango structure.",
    recommendedTrade: "Short",
    targetStop: { target: -2.10, stop: 0.85 },
    finbertScore: -0.4190,
    impactTimeline: [
      { time: "1 Hour", priceDelta: -0.60, description: "Outer month contracts lead the drop as algorithmic models predict long-term supply surges." },
      { time: "24 Hours", priceDelta: -1.20, description: "Independent shale operators declare expansion plans on federal lands." },
      { time: "3 Days", priceDelta: -1.80, description: "WTI front-month discount widens, reflecting potential structural overhangs." },
      { time: "1 Week", priceDelta: -1.40, description: "Consolidates as legal challenges from green coalitions trigger near-term hedges." },
      { time: "3 Weeks", priceDelta: -1.05, description: "Long-term forward curve settles lower as supply modeling digests faster permitting times." }
    ]
  },
  {
    id: "news_1",
    time: "15 Mins Ago",
    headline: "OPEC+ ministers agree to verbal extension of 2.2m b/d voluntary supply cuts until end of next quarter.",
    category: "Geopolitical",
    source: "Reuters Intel",
    impactRating: "High",
    sentiment: "Bullish",
    confidence: 94,
    explanation: "This extension maintains severe pressure on commercial crude supplies, continuing the physical backwardation curve. Spot crude trades at a premium over near futures as stockpiles in Europe draw down.",
    recommendedTrade: "Long",
    targetStop: { target: 3.50, stop: -1.25 },
    finbertScore: 0.7250,
    impactTimeline: [
      { time: "1 Hour", priceDelta: 1.50, description: "Algorithmic CTA systems trigger heavy long positioning." },
      { time: "24 Hours", priceDelta: 2.20, description: "Prompt month spreads lock in higher premiums." },
      { time: "3 Days", priceDelta: 2.80, description: "Short squeezes force proprietary trading desks to cover shorts." },
      { time: "1 Week", priceDelta: 1.90, description: "Dampening as macro economic demand worries cap higher crude levels." },
      { time: "3 Weeks", priceDelta: 1.10, description: "Non-OPEC shale volumes rise slightly to capture premium margins." }
    ]
  },
  {
    id: "news_2",
    time: "1 hour Ago",
    headline: "EIA reports a surprise build of 3.4M barrels in commercial stockpiles at Cushing, Oklahoma storage hub.",
    category: "Midstream",
    source: "EIA Portal",
    impactRating: "High",
    sentiment: "Bearish",
    confidence: 89,
    explanation: "Cushing inventory gains are larger than any analyst expected. This signals that pipeline off-takes to the Gulf Coast or local refining runs are falling behind, causing contango structures in nearest pricing tiers.",
    recommendedTrade: "Short",
    targetStop: { target: -2.30, stop: 0.90 },
    finbertScore: -0.6480,
    impactTimeline: [
      { time: "1 Hour", priceDelta: -0.90, description: "Speculative selling as the prompt WTI spreads collapse." },
      { time: "24 Hours", priceDelta: -1.50, description: "Physical dealers discount prompt deliveries to avoid storage storage cost." },
      { time: "3 Days", priceDelta: -2.00, description: "Refinery crude purchases defer to upcoming delivery tiers." },
      { time: "1 Week", priceDelta: -1.20, description: "Market consolidates on low prices attracting spot arbitrage buyers." },
      { time: "3 Weeks", priceDelta: -0.50, description: "Refineries lift refinery utilization to exploit low-price feedstock." }
    ]
  },
  {
    id: "news_3",
    time: "4 Hours Ago",
    headline: "Rotterdam refinery maintenance extended by two weeks following a compressor valve blowout in downstream operations.",
    category: "Downstream",
    source: "Platts Assess",
    impactRating: "Medium",
    sentiment: "Bearish",
    confidence: 78,
    explanation: "With the key Rotterdam cracker remaining offline, immediate demand for physical Brent/North Sea crude is blocked. At the same time, regional gasoline and diesel supplies tighten, which boosts product crack spreads.",
    recommendedTrade: "Short",
    targetStop: { target: -1.10, stop: 0.50 },
    finbertScore: -0.3450,
    impactTimeline: [
      { time: "1 Hour", priceDelta: -0.40, description: "Brent prompt pricing slips on reduced immediate refinery feedstock demand." },
      { time: "24 Hours", priceDelta: -0.80, description: "Local storage starts building up around the terminal." },
      { time: "3 Days", priceDelta: -1.20, description: "Product prices surge, while raw crude drops, expanding product cracks." },
      { time: "1 Week", priceDelta: -0.70, description: "Crude cargoes re-routed to alternative North-West European refineries." },
      { time: "3 Weeks", priceDelta: 0.00, description: "Refinery prepares for re-commissioning, physical flows return to status-quo." }
    ]
  },
  {
    id: "news_4",
    time: "1 Day Ago",
    headline: "Baker Hughes Weekly Rig Count reveals USA active oil drilling rigs drops by 6 units, setting 10-month low.",
    category: "Upstream",
    source: "Baker Hughes Feed",
    impactRating: "Medium",
    sentiment: "Bullish",
    confidence: 82,
    explanation: "Active drilling declines signal capital discipline. This provides a clear structural indication that US shale production volumes will flatten out or decline in the crucial 3-to-6 month ahead window.",
    recommendedTrade: "Long",
    targetStop: { target: 1.40, stop: -0.60 },
    finbertScore: 0.4810,
    impactTimeline: [
      { time: "1 Hour", priceDelta: 0.20, description: "Algorithmic modeling factors in future capital limits." },
      { time: "24 Hours", priceDelta: 0.60, description: "Shale producers confirm focus on shareholder payouts over rigs additions." },
      { time: "3 Days", priceDelta: 1.10, description: "Outer month contracts (M6-M12) acquire buying momentum." },
      { time: "1 Week", priceDelta: 0.85, description: "Stable trading range established as supply curves shift slightly higher." },
      { time: "3 Weeks", priceDelta: 0.70, description: "Outer curves maintain premium over previous week's baseline." }
    ]
  }
];

// EIA Macro Fundamentals Historic Data
export const EIA_HISTORIC: EIAWeeklyStats[] = [
  { weekStarting: "04/17", crudeInventory: 461.2, inventoryChange: 2.1, sprLevel: 364.9, weeklyProduction: 13.1 },
  { weekStarting: "04/24", crudeInventory: 457.8, inventoryChange: -3.4, sprLevel: 365.4, weeklyProduction: 13.1 },
  { weekStarting: "05/01", crudeInventory: 456.2, inventoryChange: -1.6, sprLevel: 366.2, weeklyProduction: 13.2 },
  { weekStarting: "05/08", crudeInventory: 459.7, inventoryChange: 3.5, sprLevel: 366.9, weeklyProduction: 13.2 },
  { weekStarting: "05/15", crudeInventory: 453.3, inventoryChange: -6.4, sprLevel: 367.8, weeklyProduction: 13.3 },
  { weekStarting: "05/22", crudeInventory: 449.9, inventoryChange: -3.4, sprLevel: 368.5, weeklyProduction: 13.3 }
];

// Baker Hughes Rig Count Activity
export const RIGS_HISTORIC: BakerHughesStats[] = [
  { weekStarting: "04/17", oilRigs: 508, gasRigs: 115, totalRigs: 623 },
  { weekStarting: "04/24", oilRigs: 506, gasRigs: 112, totalRigs: 618 },
  { weekStarting: "05/01", oilRigs: 504, gasRigs: 110, totalRigs: 614 },
  { weekStarting: "05/08", oilRigs: 501, gasRigs: 111, totalRigs: 612 },
  { weekStarting: "05/15", oilRigs: 497, gasRigs: 109, totalRigs: 606 },
  { weekStarting: "05/22", oilRigs: 491, gasRigs: 108, totalRigs: 599 }
];

// 3-2-1 Crack Spreads Over Time
export const CRACK_SPREADS_HISTORIC: CrackSpreadData[] = [
  { timeIndex: "04/17", gasolineCrack: 21.40, distillateCrack: 28.50, crack321: 23.77 },
  { timeIndex: "04/24", gasolineCrack: 22.80, distillateCrack: 29.10, crack321: 24.90 },
  { timeIndex: "05/01", gasolineCrack: 24.10, distillateCrack: 30.50, crack321: 26.23 },
  { timeIndex: "05/08", gasolineCrack: 23.50, distillateCrack: 31.00, crack321: 26.00 },
  { timeIndex: "05/15", gasolineCrack: 25.20, distillateCrack: 32.40, crack321: 27.60 },
  { timeIndex: "05/22", gasolineCrack: 26.80, distillateCrack: 33.50, crack321: 29.03 }
];

export const GLOBAL_SUPPLY_DEMAND: GlobalSupplyDemandPoint[] = [
  { period: "Q1 25", supply: 101.8, demand: 101.2, netBalance: 0.6 },
  { period: "Q2 25", supply: 102.3, demand: 102.7, netBalance: -0.4 },
  { period: "Q3 25", supply: 103.1, demand: 103.4, netBalance: -0.3 },
  { period: "Q4 25", supply: 103.8, demand: 102.9, netBalance: 0.9 },
  { period: "Q1 26", supply: 104.2, demand: 103.7, netBalance: 0.5 },
  { period: "Q2 26", supply: 104.5, demand: 104.9, netBalance: -0.4 }
];

// Brent and WTI Futures contracts curves
export const FORWARD_CURVE_BACKWARDATION: ForwardCurvePoint[] = [
  { contract: "M1", price: 82.10, type: "Backwardation" },
  { contract: "M2", price: 81.30, type: "Backwardation" },
  { contract: "M3", price: 80.60, type: "Backwardation" },
  { contract: "M4", price: 79.90, type: "Backwardation" },
  { contract: "M5", price: 79.25, type: "Backwardation" },
  { contract: "M6", price: 78.60, type: "Backwardation" },
  { contract: "M8", price: 77.40, type: "Backwardation" },
  { contract: "M10", price: 76.50, type: "Backwardation" },
  { contract: "M12", price: 75.80, type: "Backwardation" }
];

export const FORWARD_CURVE_CONTANGO: ForwardCurvePoint[] = [
  { contract: "M1", price: 78.40, type: "Contango" },
  { contract: "M2", price: 79.10, type: "Contango" },
  { contract: "M3", price: 79.70, type: "Contango" },
  { contract: "M4", price: 80.20, type: "Contango" },
  { contract: "M5", price: 80.70, type: "Contango" },
  { contract: "M6", price: 81.10, type: "Contango" },
  { contract: "M8", price: 81.90, type: "Contango" },
  { contract: "M10", price: 82.50, type: "Contango" },
  { contract: "M12", price: 83.10, type: "Contango" }
];

// Helper to generate initial 50 historical tick ticks for initial charts rendering
export function generateInitialTicks(): Tick[] {
  const ticks: Tick[] = [];
  const initialTime = Date.now() - 50 * 5000; // 50 ticks ago, every 5s

  let wti = 75.80;
  let brent = 79.40;
  let ovx = 32.5;

  for (let i = 0; i < 50; i++) {
    const time = new Date(initialTime + i * 5000);
    const timestamp = time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    // Multi-fractal drift with higher co-movement
    const driftWTI = (Math.sin(i / 10) * 0.1) + (Math.cos(i / 5) * 0.05) + (Math.random() * 0.16 - 0.08);
    const coMovement = driftWTI * 0.85 + (Math.random() * 0.04 - 0.02);

    const openVal = wti;
    wti += driftWTI;
    const closeVal = wti;
    const highVal = Math.max(openVal, closeVal) + (Math.random() * 0.12);
    const lowVal = Math.min(openVal, closeVal) - (Math.random() * 0.12);

    const brentOpen = brent;
    brent += coMovement;
    const brentClose = brent;
    const brentHigh = Math.max(brentOpen, brentClose) + (Math.random() * 0.12);
    const brentLow = Math.min(brentOpen, brentClose) - (Math.random() * 0.12);

    // Gasoline & Heating Oil series based on WTI with some distinct localized noise
    const gasolineOpen = brentOpen * 0.032 + 0.08 + (Math.sin(i / 12) * 0.01);
    const gasolineClose = brentClose * 0.032 + 0.08 + (Math.sin((i+1) / 12) * 0.01);
    const gasolineHigh = Math.max(gasolineOpen, gasolineClose) + (Math.random() * 0.015);
    const gasolineLow = Math.min(gasolineOpen, gasolineClose) - (Math.random() * 0.015);

    const heatingOilOpen = wti * 0.030 + 0.04 + (Math.cos(i / 10) * 0.01);
    const heatingOilClose = wti * 0.030 + 0.04 + (Math.cos((i+1) / 10) * 0.01);
    const heatingOilHigh = Math.max(heatingOilOpen, heatingOilClose) + (Math.random() * 0.012);
    const heatingOilLow = Math.min(heatingOilOpen, heatingOilClose) - (Math.random() * 0.012);

    ovx += (Math.sin(i / 8) * 0.15) + (Math.random() * 0.4 - 0.2);

    if (ovx < 15) ovx = 15;
    if (ovx > 75) ovx = 75;

    // Standard Simple Moving Averages
    const sliceCountWTI = ticks.map(t => t.wti);
    sliceCountWTI.push(wti);
    
    let sma50 = wti;
    let sma200 = wti - 1.20 + (Math.sin(i / 15) * 0.4); // stylized
    if (ticks.length >= 10) {
      sma50 = sliceCountWTI.slice(-10).reduce((a, b) => a + b, 0) / 10;
    }
    
    // Bollinger Band bounds (standard deviation)
    const upperBB = sma50 + 1.2 + (Math.sin(i / 12) * 0.15);
    const lowerBB = sma50 - 1.2 - (Math.sin(i / 12) * 0.15);

    // MACD calculation
    const macd = Math.sin(i / 6) * 0.4 + (Math.random() * 0.05 - 0.025);
    const signal = Math.sin((i - 2) / 6) * 0.35;

    // RSI calculation (dynamic range 30-70)
    const rsi = 50 + Math.sin(i / 4) * 15 + (Math.random() * 6 - 3);

    ticks.push({
      timestamp,
      timeIndex: i,
      wti: parseFloat(wti.toFixed(2)),
      brent: parseFloat(brent.toFixed(2)),
      gasoline: parseFloat(gasolineClose.toFixed(3)),
      heatingOil: parseFloat(heatingOilClose.toFixed(3)),
      ovx: parseFloat(ovx.toFixed(2)),
      volume: Math.floor(45000 + (Math.random() * 15000)),
      open: parseFloat(openVal.toFixed(2)),
      high: parseFloat(highVal.toFixed(2)),
      low: parseFloat(lowVal.toFixed(2)),
      close: parseFloat(closeVal.toFixed(2)),
      brent_open: parseFloat(brentOpen.toFixed(2)),
      brent_high: parseFloat(brentHigh.toFixed(2)),
      brent_low: parseFloat(brentLow.toFixed(2)),
      brent_close: parseFloat(brentClose.toFixed(2)),
      gasoline_open: parseFloat(gasolineOpen.toFixed(3)),
      gasoline_high: parseFloat(gasolineHigh.toFixed(3)),
      gasoline_low: parseFloat(gasolineLow.toFixed(3)),
      gasoline_close: parseFloat(gasolineClose.toFixed(3)),
      heatingOil_open: parseFloat(heatingOilOpen.toFixed(3)),
      heatingOil_high: parseFloat(heatingOilHigh.toFixed(3)),
      heatingOil_low: parseFloat(heatingOilLow.toFixed(3)),
      heatingOil_close: parseFloat(heatingOilClose.toFixed(3)),
      sma50_wti: parseFloat(sma50.toFixed(2)),
      sma200_wti: parseFloat(sma200.toFixed(2)),
      upperBB_wti: parseFloat(upperBB.toFixed(2)),
      lowerBB_wti: parseFloat(lowerBB.toFixed(2)),
      macd_wti: parseFloat(macd.toFixed(2)),
      signal_wti: parseFloat(signal.toFixed(2)),
      rsi_wti: parseFloat(rsi.toFixed(2))
    });
  }

  return ticks;
}
