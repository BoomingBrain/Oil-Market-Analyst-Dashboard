import React, { useState } from "react";
import { CustomPriceAlert } from "../types";
import { 
  Bell, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash, 
  Radio, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  Sliders, 
  DollarSign,
  HeartCrack,
  FlameKindling
} from "lucide-react";

interface PriceAlertDeskProps {
  wtiPrice: number;
  brentPrice: number;
  alerts: CustomPriceAlert[];
  onAddAlert: (asset: "WTI" | "Brent", criteria: "ABOVE" | "BELOW", targetPrice: number) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  newsAlertEnabled: boolean;
  setNewsAlertEnabled: (val: boolean) => void;
  newsShiftThreshold: number;
  setNewsShiftThreshold: (val: number) => void;
}

export function PriceAlertDesk({
  wtiPrice,
  brentPrice,
  alerts,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert,
  newsAlertEnabled,
  setNewsAlertEnabled,
  newsShiftThreshold,
  setNewsShiftThreshold
}: PriceAlertDeskProps) {
  // Local input states
  const [targetAsset, setTargetAsset] = useState<"WTI" | "Brent">("WTI");
  const [criteria, setCriteria] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [targetVal, setTargetVal] = useState<string>("");

  const currentReferencePrice = targetAsset === "WTI" ? wtiPrice : brentPrice;

  // Add Alert handler
  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(targetVal);
    if (isNaN(priceNum) || priceNum <= 0) {
      return;
    }
    onAddAlert(targetAsset, criteria, priceNum);
    setTargetVal("");
  };

  // Pre-seed a target near spot for ease of use
  const handleQuickSeed = (pctOffset: number) => {
    const shift = currentReferencePrice * pctOffset;
    const computedVal = (currentReferencePrice + shift).toFixed(2);
    setTargetVal(computedVal);
  };

  // Group alerts
  const activeAlerts = alerts.filter(a => !a.isTriggered);
  const triggeredAlerts = alerts.filter(a => a.isTriggered);

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl w-full flex flex-col gap-4 font-sans">
      
      {/* Header element */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-indigo-500/15 text-indigo-400">
              <Bell className="w-4 h-4 animate-swing" />
            </span>
            <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-1.5">
              Catalyst & Real-Time Price Alert Desk
            </h3>
          </div>
          <p className="text-[10px] text-slate-450 leading-normal max-w-xl">
            Set trigger points on active crude benchmarks or configure automated news catalysts surveillance to catch massive macro physical market shocks instantly.
          </p>
        </div>

        {/* Live Spot price markers in header */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <div className="px-2 py-0.5 bg-slate-950/40 border border-white/5 rounded-lg flex items-center gap-1">
            <span className="text-slate-400 font-bold">WTI:</span>
            <span className="text-orange-400 font-bold">${wtiPrice.toFixed(2)}</span>
          </div>
          <div className="px-2 py-0.5 bg-slate-950/40 border border-white/5 rounded-lg flex items-center gap-1">
            <span className="text-slate-400 font-bold">BRENT:</span>
            <span className="text-blue-400 font-bold">${brentPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Left pane: Price Alert Creator */}
        <div className="flex flex-col gap-3">
          <form onSubmit={handleCreateAlert} className="space-y-3">
            <span className="text-[9px] text-slate-400 font-mono uppercase font-bold tracking-widest block flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Create Custom Price Trigger
            </span>

            {/* Asset toggle and Criteria Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-950 rounded border border-white/5 p-0.5 flex">
                <button
                  type="button"
                  onClick={() => setTargetAsset("WTI")}
                  className={`flex-1 text-[10px] py-1 rounded font-semibold transition uppercase ${
                    targetAsset === "WTI" ? "bg-white/10 text-orange-400 font-bold border border-white/5" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  WTI Crude
                </button>
                <button
                  type="button"
                  onClick={() => setTargetAsset("Brent")}
                  className={`flex-1 text-[10px] py-1 rounded font-semibold transition uppercase ${
                    targetAsset === "Brent" ? "bg-white/10 text-blue-400 font-bold border border-white/5" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Brent Oil
                </button>
              </div>

              <div className="bg-slate-950 rounded border border-white/5 p-0.5 flex">
                <button
                  type="button"
                  onClick={() => setCriteria("ABOVE")}
                  className={`flex-1 text-[10px] py-1 rounded font-semibold transition uppercase flex items-center justify-center gap-1 ${
                    criteria === "ABOVE" ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <TrendingUp className="w-3 h-3" /> Above
                </button>
                <button
                  type="button"
                  onClick={() => setCriteria("BELOW")}
                  className={`flex-1 text-[10px] py-1 rounded font-semibold transition uppercase flex items-center justify-center gap-1 ${
                    criteria === "BELOW" ? "bg-red-500/10 text-red-400 font-bold border border-red-500/20" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <TrendingDown className="w-3 h-3" /> Below
                </button>
              </div>
            </div>

            {/* Target Value input with reference metrics */}
            <div className="bg-slate-950 border border-white/5 rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-slate-400 font-bold">Target Price Level (USD)</span>
                <span className="text-slate-500">Spot is ${currentReferencePrice.toFixed(2)}</span>
              </div>

              <div className="relative flex items-center justify-between border-b border-white/10 pb-1">
                <span className="text-slate-400 text-sm font-semibold font-mono pl-1">$</span>
                <input
                  type="number"
                  step="0.05"
                  min="30"
                  max="150"
                  placeholder="Enter target price..."
                  value={targetVal}
                  onChange={(e) => setTargetVal(e.target.value)}
                  className="bg-transparent text-sm text-slate-100 border-none focus:outline-none w-full font-mono pl-1.5 focus:ring-0"
                  required
                />
              </div>

              {/* Quick seed helper pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickSeed(0.015)}
                  className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-400/30 text-emerald-400 transition"
                >
                  +1.5% Spot
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSeed(0.005)}
                  className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-400/30 text-emerald-400 transition"
                >
                  +0.5% Spot
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSeed(-0.005)}
                  className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-400/30 text-red-400 transition"
                >
                  -0.5% Spot
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSeed(-0.015)}
                  className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-400/30 text-red-400 transition"
                >
                  -1.5% Spot
                </button>
              </div>
            </div>

            {/* Create Alert CTA */}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 py-1.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-white transition uppercase font-mono tracking-wider cursor-pointer font-extrabold shadow-md shadow-indigo-900/30"
            >
              <Plus className="w-4 h-4" /> Deploy Pricing Monitor
            </button>
          </form>

          {/* Part 2: Catalyst News Alert Surveillance configuration */}
          <div className="border-t border-white/5 pt-3 space-y-2 mt-1">
            <span className="text-[9px] text-slate-400 font-mono uppercase font-bold tracking-widest block flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" /> News Shock Catalyst Surveillance
            </span>

            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <input
                    id="news_sw"
                    type="checkbox"
                    checked={newsAlertEnabled}
                    onChange={(e) => setNewsAlertEnabled(e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-white/10 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                  />
                  <label htmlFor="news_sw" className="text-[10px] text-slate-300 font-mono tracking-wider cursor-pointer font-bold select-none">
                    Monitor Hot Catalyst News Events
                  </label>
                </div>
                <span className={`px-1 rounded font-mono text-[7px] font-bold ${
                  newsAlertEnabled ? "bg-red-500/10 text-red-400 animate-pulse" : "bg-slate-800 text-slate-500"
                }`}>
                  {newsAlertEnabled ? "WATCHING FEED" : "MUTED"}
                </span>
              </div>

              {newsAlertEnabled && (
                <div className="space-y-1.5 pl-5 border-l border-white/5 font-mono text-[9px] transition">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Minimum Price Shift Alert Threshold:</span>
                    <span className="text-amber-400 font-extrabold">${newsShiftThreshold.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="4.0"
                    step="0.25"
                    value={newsShiftThreshold}
                    onChange={(e) => setNewsShiftThreshold(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none"
                  />
                  <span className="text-slate-500 text-[8px] block leading-tight">
                    Triggers high priority alerts on breaking news events that adjust benchmarks by over <span className="text-slate-400 font-bold">${newsShiftThreshold.toFixed(2)}</span> instantly.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right pane: Configured Pricing Monitors & Log Summary */}
        <div className="flex flex-col gap-3">
          <span className="text-[9px] text-slate-400 font-mono uppercase font-bold tracking-widest block flex items-center justify-between">
            <span>🛡️ Active Monitors Directory ({activeAlerts.length})</span>
            <span className="text-[8px] text-indigo-400 font-extrabold font-mono uppercase">Telemetry Node Live</span>
          </span>

          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 flex-1 max-h-[175px] overflow-y-auto scrollbar-thin flex flex-col gap-1.5 pr-1">
            {activeAlerts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-3 text-slate-550 font-mono text-[9px]">
                <Bell className="w-5 h-5 text-slate-600 mb-1 opacity-50" />
                No active threshold monitors deployed. Deployed threshold monitors will show up here.
              </div>
            ) : (
              activeAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center justify-between gap-1.5 text-[10px] font-mono hover:bg-white/10 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      alert.asset === "WTI" ? "bg-orange-550/15 text-orange-400" : "bg-blue-500/15 text-blue-400"
                    }`}>
                      {alert.asset}
                    </span>
                    <span className="text-slate-400">price goes</span>
                    <span className={`font-bold flex items-center gap-0.5 ${
                      alert.criteria === "ABOVE" ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {alert.criteria === "ABOVE" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {alert.criteria}
                    </span>
                    <span className="text-slate-100 font-bold font-numeric">${alert.targetPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onToggleAlert(alert.id)}
                      className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold cursor-pointer font-mono hover:scale-105 transition ${
                        alert.isActive 
                          ? "bg-emerald-500/10 text-emerald-400 hover:text-emerald-300"
                          : "bg-slate-800 text-slate-500 hover:text-slate-400"
                      }`}
                      title={alert.isActive ? "Pause Monitor" : "Resume Monitor"}
                    >
                      {alert.isActive ? "Active" : "Paused"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAlert(alert.id)}
                      className="p-1 rounded text-slate-500 hover:text-red-400 transition hover:bg-white/5 cursor-pointer"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Triggered Historical Alerts tracker */}
          <div className="space-y-1.5">
            <span className="text-[9px] text-slate-400 font-mono uppercase font-bold tracking-widest block">
              📻 Recent Triggers Log ({triggeredAlerts.length})
            </span>

            <div className="bg-[#0c1015]/60 p-2 rounded-xl border border-white/5 max-h-[85px] overflow-y-auto scrollbar-thin text-[9px] font-mono flex flex-col gap-1 pr-1">
              {triggeredAlerts.length === 0 ? (
                <div className="text-slate-550 text-center py-4 bg-white/5 rounded-lg">
                  No alerts triggered in this session.
                </div>
              ) : (
                triggeredAlerts.slice(-4).reverse().map(alert => (
                  <div
                    key={alert.id}
                    className="p-1.5 bg-red-950/10 border border-red-500/20 rounded-lg text-slate-300 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        <span className="text-slate-400 font-bold uppercase">{alert.asset} M1</span> was breached{" "}
                        <span className="text-red-400 font-bold">{alert.criteria.toLowerCase()}</span>{" "}
                        <span className="font-bold text-white">${alert.targetPrice.toFixed(2)}</span> (Hit @ ${alert.triggeredPrice?.toFixed(2)})
                      </span>
                    </div>
                    <span className="text-slate-550 text-[7.5px] whitespace-nowrap shrink-0">{alert.triggeredAt}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
