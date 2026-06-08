import React, { useState, useMemo } from "react";
import { Tick } from "../types";
import { Grid, Info, RefreshCw, BarChart2, TrendingUp, HelpCircle } from "lucide-react";

interface ContractCorrelationMatrixProps {
  ticks: Tick[];
  isBackwardation: boolean;
}

// Simple Pearson Correlation helper inside the component
function calcPearson(x: number[], y: number[]): number {
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
  
  return parseFloat((num / den).toFixed(3));
}

export function ContractCorrelationMatrix({ ticks, isBackwardation }: ContractCorrelationMatrixProps) {
  const [selectedAsset, setSelectedAsset] = useState<"WTI" | "Brent">("WTI");
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>({ r: 0, c: 1 });

  // Generate 12 contract tenors' historical series based on the actual live ticks
  const correlationData = useMemo(() => {
    const historyLength = Math.max(10, Math.min(ticks.length, 30));
    if (ticks.length === 0) return { matrix: [], labels: [] };

    // Contract labels: M1 (Prompt Month) through M12
    const labels = Array.from({ length: 12 }, (_, i) => `M${i + 1}`);

    const activeTicks = ticks.slice(-historyLength);

    // Build the 12 series
    const seriesData: number[][] = Array.from({ length: 12 }, () => []);

    activeTicks.forEach((tick, tickIdx) => {
      const baseSpot = selectedAsset === "WTI" ? tick.wti : tick.brent;
      
      for (let c = 0; c < 12; c++) {
        // Curve slope logic: Backwardation vs Contango
        // Backwardation = prompt contracts are priced higher than future ones
        // Contango = prompt contracts are priced lower than future ones
        const slopeFactor = isBackwardation ? -0.015 : 0.012;
        const curveOffset = baseSpot * (1 + slopeFactor * (c / 12));

        // Let's add Samuelson effect: near months have higher volatility & noise
        // This ensures the correlations are highly realistic (not perfectly 1.0 everywhere)
        const tenorVol = 0.45 * (1 - c / 16); 
        // Semi-predictable microstructure oscillation (waves of storage/differentials pressure)
        const wave = Math.sin((tickIdx + c) / 2.5) * tenorVol + Math.cos(tickIdx / (2 + c / 4)) * 0.15;
        
        seriesData[c].push(curveOffset + wave);
      }
    });

    // Compute the 12x12 Pearson Correlation Matrix
    const matrix: number[][] = [];
    for (let r = 0; r < 12; r++) {
      matrix[r] = [];
      for (let c = 0; c < 12; c++) {
        const val = calcPearson(seriesData[r], seriesData[c]);
        // Clip correlation values to make sure floating boundaries are correct
        matrix[r][c] = Math.min(1.0, Math.max(-1.0, val));
      }
    }

    return { matrix, labels, seriesData };
  }, [ticks, selectedAsset, isBackwardation]);

  const { matrix, labels } = correlationData;

  // Custom helper to get background color of cell based on correlation coefficient value
  const getCellBgColor = (val: number) => {
    // Val is between -1 and +1. Usually futures are highly positively correlated (0.7 to 1.0)
    if (val >= 0.98) return "bg-[#fb923c]/90 text-white font-bold"; // orange-400 (Perfect/consecutive)
    if (val >= 0.95) return "bg-[#4338ca]/80 text-blue-100";        // Indigo strong positive
    if (val >= 0.90) return "bg-[#4f46e5]/60 text-slate-200";       // Medium indigo
    if (val >= 0.85) return "bg-indigo-950/70 text-slate-300";      // Deep indigo
    if (val >= 0.80) return "bg-[#1e1b4b]/60 text-slate-400";       // Darkest indigo
    return "bg-slate-900/40 text-slate-550";                        // Low correlation / distal
  };

  const activeSelectedValue = selectedCell && matrix[selectedCell.r] 
    ? matrix[selectedCell.r][selectedCell.c] 
    : null;

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl w-full flex flex-col gap-3.5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-[#fb923c]/15 text-[#fb923c]">
              <Grid className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
              Futures Term-Strip Correlation Profile Matrix
            </h3>
          </div>
          <p className="text-[9px] text-slate-400 max-w-2xl leading-normal">
            Pearson correlations mapping consecutive monthly contracts (<span className="text-orange-400 font-mono">M1 to M12</span>). Useful for hedging, spread strength, and Samuelson term-structure analysis.
          </p>
        </div>

        {/* Toggler buttons */}
        <div className="flex bg-[#0c1015]/80 p-0.5 rounded-lg border border-white/5 self-start sm:self-center font-mono">
          <button
            type="button"
            onClick={() => setSelectedAsset("WTI")}
            className={`px-2 py-1 text-[9px] rounded-md cursor-pointer transition uppercase font-bold tracking-wider ${
              selectedAsset === "WTI" 
                ? "bg-gradient-to-r from-orange-500/20 to-amber-500/10 text-orange-400 border border-orange-550/30" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            WTI Strip
          </button>
          <button
            type="button"
            onClick={() => setSelectedAsset("Brent")}
            className={`px-2 py-1 text-[9px] rounded-md cursor-pointer transition uppercase font-bold tracking-wider ${
              selectedAsset === "Brent" 
                ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/10 text-blue-400 border border-blue-500/30" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Brent Strip
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        {/* Heatmap Matrix Display */}
        <div className="w-full max-w-[360px] md:max-w-[380px] select-none shrink-0">
          {matrix.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-orange-400" />
              Ingesting live Tick sequences for Pearson model parameters...
            </div>
          ) : (
            <div className="p-1.5 bg-slate-950/40 rounded-xl border border-white/5 relative">
              
              {/* Top labels */}
              <div className="grid grid-cols-[1.5rem_repeat(12,minmax(0,1fr))] gap-0.5 text-center mb-1 text-[8px] font-mono text-slate-500 uppercase font-bold">
                <div /> {/* Corner spacer */}
                {labels.map((lbl, idx) => (
                  <div 
                    key={lbl} 
                    className={`py-0.5 transition-colors ${
                      (selectedCell?.c === idx || hoveredCell?.c === idx) ? "text-[#fb923c] font-black bg-white/5 rounded-t" : ""
                    }`}
                  >
                    {lbl}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {matrix.map((rowArr, rIdx) => (
                <div key={rIdx} className="grid grid-cols-[1.5rem_repeat(12,minmax(0,1fr))] gap-0.5 items-center">
                  
                  {/* Left Label */}
                  <div 
                    className={`text-[8px] font-mono text-left pl-1 uppercase font-bold transition-colors ${
                      (selectedCell?.r === rIdx || hoveredCell?.r === rIdx) ? "text-[#fb923c] font-black bg-white/5 rounded-l" : "text-slate-550"
                    }`}
                  >
                    {labels[rIdx]}
                  </div>

                  {/* Cells */}
                  {rowArr.map((cellVal, cIdx) => {
                    const isSelected = selectedCell?.r === rIdx && selectedCell?.c === cIdx;
                    const isHovered = hoveredCell?.r === rIdx && hoveredCell?.c === cIdx;

                    return (
                      <div
                        key={cIdx}
                        onMouseEnter={() => setHoveredCell({ r: rIdx, c: cIdx })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => setSelectedCell({ r: rIdx, c: cIdx })}
                        className={`
                          aspect-square flex items-center justify-center text-[8px] font-mono rounded-sm transition-all duration-150 cursor-pointer text-center
                          ${getCellBgColor(cellVal)}
                          ${isSelected ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 scale-[1.08] z-10 shadow-lg" : ""}
                          ${isHovered && !isSelected ? "brightness-125 saturate-120 scale-105 z-10" : ""}
                        `}
                        title={`${labels[rIdx]} : ${labels[cIdx]} = ${cellVal.toFixed(3)}`}
                      >
                        <span className="scale-[0.8]">{cellVal.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informational sidebar detailing relationships */}
        <div className="flex-1 bg-slate-900/35 border border-white/5 rounded-xl p-3 flex flex-col justify-between font-mono text-[10px]">
          <div>
            <span className="text-[9px] text-[#fb923c] font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Info className="w-3 h-3 text-blue-400" />
              Dynamic Matrix Insight
            </span>

            {/* Selected cell metrics breakdown */}
            {selectedCell && activeSelectedValue !== null ? (
              <div className="space-y-2.5">
                <div className="bg-[#0c1015]/60 p-2 rounded-lg border border-white/5 grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[8px]">PAIR COMBINATION</span>
                    <span className="text-amber-400 font-bold text-[10px]">
                      {labels[selectedCell.r]} × {labels[selectedCell.c]}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px]">PEARSON COEFF (r)</span>
                    <span className="text-white font-black text-[10px] font-numeric">
                      +{activeSelectedValue.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[8px]">CO-MOVEMENT STRENGTH</span>
                    <span className={`font-bold text-[9px] ${
                      activeSelectedValue >= 0.98 ? "text-orange-400" :
                      activeSelectedValue >= 0.93 ? "text-indigo-300" :
                      activeSelectedValue >= 0.88 ? "text-slate-300" : "text-slate-500"
                    }`}>
                      {activeSelectedValue >= 0.98 ? "Absolute" :
                       activeSelectedValue >= 0.95 ? "Very Strong" :
                       activeSelectedValue >= 0.90 ? "Strong +ve" :
                       activeSelectedValue >= 0.85 ? "Robust" : "Decaying"}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 leading-normal">
                  <span className="text-slate-200 font-bold text-[8px] uppercase tracking-wide block mb-0.5">Term Structure Explanation</span>
                  <p className="text-[9.5px]">
                    {selectedCell.r === selectedCell.c ? (
                      `Perfect diagonal self-correlation (r=1.00). A contract month is always perfectly correlated with its own historical settlement.`
                    ) : (
                      `Month ${selectedCell.r + 1} & Month ${selectedCell.c + 1} exhibit a coefficient of ${activeSelectedValue.toFixed(3)}. ${
                        Math.abs(selectedCell.r - selectedCell.c) <= 2
                          ? "Consecutive prompt tenors are tightly coupled by near-term physical delivery constraints and refinery run schedules."
                          : "Distal spacing terms introduce decay as long-term macro storage hedges discount immediate prompt-month spot spikes."
                      }`
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-[9.5px] text-slate-500">Click any coefficient cell on the heatmap matrix to view detailed mathematical analysis & term structures.</p>
            )}
          </div>

          <div className="border-t border-white/5 pt-2 mt-2.5 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div className="flex items-center gap-1 text-[8px] text-[#fb923c] font-bold uppercase shrink-0">
              <BarChart2 className="w-3 h-3" />
              Samuelson Principle
            </div>
            <p className="text-[9px] text-slate-500 leading-tight">
              Near-month contract prices exhibit higher variance than far-month forwards due to physical shock absorption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
