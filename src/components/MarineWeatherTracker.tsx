import React, { useState, useMemo, useEffect } from "react";
import { Vessel } from "../types";
import { 
  Wind, 
  CloudRain, 
  Compass, 
  Ship, 
  AlertTriangle, 
  ChevronRight, 
  TrendingDown, 
  Anchor, 
  Map, 
  Activity, 
  Zap,
  Info
} from "lucide-react";

interface MarineWeatherTrackerProps {
  vessels: Vessel[];
  onTriggerNotification: (msg: string, type: "alert" | "info" | "success" | "warning") => void;
}

export interface StormThreat {
  id: string;
  name: string;
  type: "Hurricane" | "Typhoon" | "Cyclone" | "Gale Storm";
  category: string; // e.g., Cat 3, Cat 4, Severe
  windSpeed: number; // knots
  waveHeight: number; // meters
  affectedRoute: string;
  affectedAsset: "WTI" | "Brent" | "Both";
  status: "Expanding" | "Stationary" | "Weakening";
  coordinates: { x: number; y: number }; // Percentage for visual overlay
  radius: number; // Visual aura radius
}

export function MarineWeatherTracker({ vessels, onTriggerNotification }: MarineWeatherTrackerProps) {
  // Local state for active storm warnings on oil routes
  const [storms, setStorms] = useState<StormThreat[]>([
    {
      id: "s1",
      name: "Beatrice",
      type: "Hurricane",
      category: "Category 3",
      windSpeed: 115,
      waveHeight: 8.2,
      affectedRoute: "US Gulf Coast / Houston Lines",
      affectedAsset: "WTI",
      status: "Expanding",
      coordinates: { x: 22, y: 55 },
      radius: 45
    },
    {
      id: "s2",
      name: "Maria",
      type: "Typhoon",
      category: "Category 4",
      windSpeed: 130,
      waveHeight: 10.5,
      affectedRoute: "South China Sea Transit Lanes",
      affectedAsset: "Brent",
      status: "Stationary",
      coordinates: { x: 78, y: 62 },
      radius: 50
    },
    {
      id: "s3",
      name: "Ashobaa",
      type: "Cyclone",
      category: "Severe Tropical",
      windSpeed: 85,
      waveHeight: 5.6,
      affectedRoute: "Strait of Malacca / Indian Ocean East",
      affectedAsset: "Both",
      status: "Weakening",
      coordinates: { x: 62, y: 78 },
      radius: 35
    }
  ]);

  const [selectedStormId, setSelectedStormId] = useState<string>("s1");
  const [selectedVesselId, setSelectedVesselId] = useState<string>("v1");
  const [isSimulatingHeavySeas, setIsSimulatingHeavySeas] = useState(false);

  const selectedStorm = storms.find(s => s.id === selectedStormId) || storms[0];

  // Helper static positions on a flat horizontal coordinate schematic world map (100x100 space)
  // Maps route origins-destinations to draw ship lines:
  // v1: Texas -> Rotterdam. WTI, laden.
  // v2: Texas -> Qingdao.
  // v3: Montreal -> Rotterdam.
  // v4: Singapore -> Houston.
  // etc.
  const routePaths = useMemo(() => {
    return {
      Houston: { x: 18, y: 48 },
      Rotterdam: { x: 48, y: 28 },
      Qingdao: { x: 82, y: 45 },
      Singapore: { x: 74, y: 72 },
      Primorsk: { x: 55, y: 22 },
      Montreal: { x: 26, y: 34 },
      "Ras Tanura": { x: 58, y: 58 },
      "Sullom Voe": { x: 44, y: 18 }
    };
  }, []);

  // Compute live vessel coordinate position on the flat grid based on progressPercent
  const getVesselCoordinates = (v: Vessel) => {
    const originKey = v.origin as keyof typeof routePaths;
    const destKey = v.destination as keyof typeof routePaths;
    
    const origin = routePaths[originKey] || { x: 50, y: 50 };
    const dest = routePaths[destKey] || { x: 50, y: 50 };

    const ratio = v.progressPercent / 100;
    const x = origin.x + (dest.x - origin.x) * ratio;
    const y = origin.y + (dest.y - origin.y) * ratio;

    return { x, y };
  };

  // Determine if a vessel is actively inside or adjacent to any active storm area (simple distance math)
  const getVesselStatusInStorm = (v: Vessel): { alertText: string; alertType: "none" | "caution" | "critical"; nearestStorm: string } => {
    const vCoord = getVesselCoordinates(v);
    let alertText = "Normal Cruise Path";
    let alertType: "none" | "caution" | "critical" = "none";
    let nearestStorm = "";

    storms.forEach(storm => {
      const dx = vCoord.x - storm.coordinates.x;
      const dy = vCoord.y - storm.coordinates.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < storm.radius * 0.45) {
        alertText = `CRITICAL: Routing directly inside ${storm.type} ${storm.name}! Heavy rolling waves (${storm.waveHeight}m).`;
        alertType = "critical";
        nearestStorm = storm.name;
      } else if (distance < storm.radius * 0.85 && alertType !== "critical") {
        alertText = `CAUTION: Moderate wind shear (${storm.windSpeed} kts) near ${storm.type} ${storm.name} bands.`;
        alertType = "caution";
        nearestStorm = storm.name;
      }
    });

    return { alertText, alertType, nearestStorm };
  };

  // Inject a synthetic weather event (Hurricane / Cyclone update)
  const handleSimulateNewStorm = () => {
    setIsSimulatingHeavySeas(true);
    
    // Choose randomized properties
    const names = ["Danielle", "Eugene", "Hellen", "Kirk", "Nadine", "Oscar", "Zorba"];
    const index = Math.floor(Math.random() * names.length);
    const chosenName = names[index];
    
    const routes = [
      { name: "Taiwan Strait / East China Sea", asset: "Brent" as const, x: 80, y: 50 },
      { name: "Caribbean Sea / Loop Current", asset: "WTI" as const, x: 26, y: 58 },
      { name: "North Sea Channels", asset: "Brent" as const, x: 46, y: 24 },
      { name: "Gulf of Oman / Hormuz", asset: "Both" as const, x: 59, y: 64 }
    ];
    const chosenRoute = routes[Math.floor(Math.random() * routes.length)];

    const newStorm: StormThreat = {
      id: `storm_${Date.now()}`,
      name: chosenName,
      type: Math.random() > 0.4 ? "Hurricane" : "Cyclone",
      category: Math.random() > 0.5 ? "Category 4" : "Category 2",
      windSpeed: 85 + Math.floor(Math.random() * 55),
      waveHeight: 5 + parseFloat((Math.random() * 6).toFixed(1)),
      affectedRoute: chosenRoute.name,
      affectedAsset: chosenRoute.asset,
      status: "Expanding",
      coordinates: { x: chosenRoute.x, y: chosenRoute.y },
      radius: 40 + Math.floor(Math.random() * 20)
    };

    setStorms(prev => [newStorm, ...prev.filter(s => s.id !== "s3")]); // keep count to 3
    setSelectedStormId(newStorm.id);
    
    onTriggerNotification(
      `WEATHER ALERT: Severe ${newStorm.type} ${newStorm.name} has formed along ${newStorm.affectedRoute}! Implied freight spreads widening.`, 
      "alert"
    );

    setTimeout(() => {
      setIsSimulatingHeavySeas(false);
    }, 1500);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl w-full flex flex-col gap-4">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-red-500/15 text-red-400 animate-pulse">
              <Wind className="w-4 h-4 animate-spin-slow" />
            </span>
            <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase flex items-center gap-1.5">
              Live Marine Weather & Route Disruption Center
            </h3>
          </div>
          <p className="text-[10px] text-slate-450 max-w-3xl leading-normal">
            Geopolitical maritime shipping lanes overlay with real-time cyclone, hurricane, and typhoon tracking bounds. Highly coupled with WTI arbitrage and Brent logistics flow rates.
          </p>
        </div>

        {/* Dynamic Storm injector block */}
        <button
          type="button"
          onClick={handleSimulateNewStorm}
          disabled={isSimulatingHeavySeas}
          className="text-[9px] bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-500/15 py-1.5 px-3 rounded-xl flex items-center gap-1.5 font-mono uppercase font-bold tracking-wider cursor-pointer disabled:opacity-50 transition"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          {isSimulatingHeavySeas ? "Generating Storm Axis..." : "Simulate Storm Shock"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Column Left: Visual Routing Map Schematic using High Quality SVGs */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-h-[290px]">
          <span className="text-[9px] text-slate-400 font-mono uppercase font-bold tracking-widest flex items-center gap-1">
            <Map className="w-3.5 h-3.5 text-emerald-400" /> Interactive Freight Routing Map & Storm Intersects
          </span>

          <div className="relative w-full aspect-[2/1] rounded-xl border border-white/5 bg-[#090b0e] overflow-hidden select-none">
            {/* Soft grid background */}
            <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="coordGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#coordGrid)" />
            </svg>

            {/* Flat styled land masses representation vectors for context */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-[0.06] fill-blue-200 pointer-events-none">
              {/* North America */}
              <path d="M 0,20 Q 15,30 20,40 T 15,62 T 14,80 L 0,80 Z" />
              {/* Europe & Africa */}
              <path d="M 40,10 Q 55,20 52,44 T 48,68 T 58,85 L 35,90 Z" />
              {/* Asia */}
              <path d="M 60,10 Q 75,5 85,25 T 90,55 T 82,75 L 94,80 Z" />
            </svg>

            {/* Static route paths drawn */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Draw Shipping Lines */}
              <g stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3,3" strokeWidth="0.5">
                {/* Houston to Rotterdam */}
                <line x1={routePaths.Houston.x} y1={routePaths.Houston.y} x2={routePaths.Rotterdam.x} y2={routePaths.Rotterdam.y} />
                {/* Houston to Singapore */}
                <line x1={routePaths.Houston.x} y1={routePaths.Houston.y} x2={routePaths.Singapore.x} y2={routePaths.Singapore.y} />
                {/* Houston to Qingdao */}
                <line x1={routePaths.Houston.x} y1={routePaths.Houston.y} x2={routePaths.Qingdao.x} y2={routePaths.Qingdao.y} />
                {/* Primorsk to Qingdao */}
                <line x1={routePaths.Primorsk.x} y1={routePaths.Primorsk.y} x2={routePaths.Qingdao.x} y2={routePaths.Qingdao.y} />
                {/* Sullom Voe to Rotterdam */}
                <line x1={routePaths["Sullom Voe"].x} y1={routePaths["Sullom Voe"].y} x2={routePaths.Rotterdam.x} y2={routePaths.Rotterdam.y} />
                {/* Montreal to Rotterdam */}
                <line x1={routePaths.Montreal.x} y1={routePaths.Montreal.y} x2={routePaths.Rotterdam.x} y2={routePaths.Rotterdam.y} />
                {/* Ras Tanura to Singapore */}
                <line x1={routePaths["Ras Tanura"].x} y1={routePaths["Ras Tanura"].y} x2={routePaths.Singapore.x} y2={routePaths.Singapore.y} />
                {/* Singapore to Houston */}
                <line x1={routePaths.Singapore.x} y1={routePaths.Singapore.y} x2={routePaths.Houston.x} y2={routePaths.Houston.y} />
              </g>

              {/* Draw Port Landmark Circles */}
              <g fill="#475569" stroke="#1e293b" strokeWidth="1">
                {(Object.entries(routePaths) as [string, { x: number; y: number }][]).map(([name, pt]) => (
                  <g key={name}>
                    <circle cx={pt.x} cy={pt.y} r="1.5" />
                  </g>
                ))}
              </g>
            </svg>

            {/* Port Names Overlay */}
            {(Object.entries(routePaths) as [string, { x: number; y: number }][]).map(([name, pt]) => (
              <span 
                key={name}
                style={{ left: `${pt.x}%`, top: `${pt.y + 3}%` }}
                className="absolute text-[8px] font-mono text-slate-500 -translate-x-1/2 pointer-events-none"
              >
                {name}
              </span>
            ))}

            {/* Live Storm Danger Zones Overlays */}
            {storms.map(storm => {
              const isSelected = storm.id === selectedStormId;
              return (
                <div
                  key={storm.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStormId(storm.id);
                  }}
                  style={{
                    left: `${storm.coordinates.x}%`,
                    top: `${storm.coordinates.y}%`,
                    width: `${storm.radius}%`,
                    height: `${storm.radius * 2}%` // adjust since aspect is 2/1
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer group transition-all duration-300 ${
                    isSelected ? "z-20 scale-105" : "z-10 bg-red-650/5 hover:bg-red-600/10"
                  }`}
                >
                  {/* Glowing pulsing threat ring */}
                  <div className={`absolute inset-0 rounded-full border border-dashed animate-pulse-slow ${
                    isSelected 
                      ? "border-red-500 bg-red-600/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                      : "border-red-500/30"
                  }`} />
                  
                  {/* Swirling hurricane effect inside */}
                  <div className="absolute inset-2 border-t-2 border-l border-red-500/40 rounded-full animate-spin" style={{ animationDuration: `${6 - (storm.windSpeed / 30)}s` }} />

                  {/* Core spot */}
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 shadow-md flex items-center justify-center">
                    <span className="animate-ping absolute h-full w-full rounded-full bg-red-405 opacity-75" />
                  </div>

                  {/* Tiny text box for storm name */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-slate-950/90 border border-red-500/40 rounded-md px-1.5 py-0.5 text-[8px] font-mono text-slate-200 shadow-xl whitespace-nowrap pointer-events-none font-bold">
                    🌀 {storm.type} {storm.name} ({storm.category})
                  </div>
                </div>
              );
            })}

            {/* Vessel markers drawn on map */}
            {vessels.map(v => {
              const coords = getVesselCoordinates(v);
              const isSelected = v.id === selectedVesselId;
              const { alertType } = getVesselStatusInStorm(v);

              // Setup background and color based on asset and storm threat
              let markerBg = "bg-blue-500";
              let markerBorder = "border-blue-300";
              if (alertType === "caution") {
                markerBg = "bg-amber-500";
                markerBorder = "border-amber-300 animate-pulse";
              } else if (alertType === "critical") {
                markerBg = "bg-red-500";
                markerBorder = "border-red-400 animate-ping";
              } else if (isSelected) {
                markerBg = "bg-emerald-500";
                markerBorder = "border-emerald-300";
              }

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setSelectedVesselId(v.id);
                  }}
                  style={{
                    left: `${coords.x}%`,
                    top: `${coords.y}%`
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform hover:scale-125 z-40 cursor-pointer ${markerBg} ${markerBorder}`}
                  title={`${v.name} status: ${v.status} (${v.progressPercent}% along)`}
                >
                  <Ship className="w-2.5 h-2.5 text-white" />
                  
                  {/* Name label for selected or critical */}
                  {(isSelected || alertType === "critical" || alertType === "caution") && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0c1015]/95 border border-white/10 rounded px-1.5 py-0.5 text-[7px] font-mono whitespace-nowrap text-slate-200 select-none shadow z-50">
                      <span className="font-bold">{v.name}</span>
                      <span className="text-slate-400"> ({v.progressPercent}%)</span>
                    </div>
                  )}
                </button>
              );
            })}

          </div>
        </div>

        {/* Column Right: Details & Threat Metrics Matrix */}
        <div className="lg:col-span-5 flex flex-col gap-3 justify-between">
          
          {/* Section 1: Active Storms Directory */}
          <div className="space-y-2">
            <span className="text-[9px] text-slate-400 font-mono uppercase font-bold tracking-widest block">
              🌪️ Local Cyclonic Systems Directory
            </span>

            <div className="grid grid-cols-3 gap-2">
              {storms.map(storm => {
                const isSelected = storm.id === selectedStormId;
                return (
                  <button
                    key={storm.id}
                    onClick={() => setSelectedStormId(storm.id)}
                    className={`p-2 rounded-xl text-left border flex flex-col justify-between h-[68px] cursor-pointer transition ${
                      isSelected 
                        ? "bg-red-500/10 border-red-500/50 text-red-400 shadow-md" 
                        : "bg-white/5 border-white/10 text-slate-405 hover:bg-white/10 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[7px] font-mono uppercase">
                      <span>{storm.type}</span>
                      <span className={`px-1 rounded-sm text-[7px] font-bold ${
                        storm.status === "Expanding" ? "bg-red-500/15 text-red-400" : "bg-slate-500/15 text-slate-300"
                      }`}>{storm.status}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight truncate">{storm.name}</h4>
                      <span className="text-[8px] font-mono text-slate-500 block truncate">{storm.affectedRoute}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Selected Storm Technical Insights */}
          <div className="bg-[#0c1015]/80 p-3 rounded-xl border border-white/5 space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-450 block font-bold">STORM METRIC DATA</span>
              <span className="text-[8px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-550 rounded-full animate-ping" />
                ACTIVE THREAT: {selectedStorm.category}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[8px] uppercase">Wind Velocity</span>
                <span className="font-bold text-white text-xs font-numeric">{selectedStorm.windSpeed} kts</span>
                <span className="text-slate-450 text-[7px] block">Extremely violent gusts</span>
              </div>
              <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[8px] uppercase">Peak Swells</span>
                <span className="font-bold text-white text-xs font-numeric">{selectedStorm.waveHeight} meters</span>
                <span className="text-[#fb923c] text-[7px] block font-bold">Severe drift danger</span>
              </div>
            </div>

            <div className="text-[10px] space-y-1 text-slate-300 leading-normal">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-slate-500">Target Asset Impact:</span>
                <span className="text-amber-400 font-bold uppercase text-[9px]">{selectedStorm.affectedAsset} Premium Shifting</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Impact Lane:</span>
                <span className="text-slate-300 text-[8px] max-w-[200px] text-right truncate font-bold">{selectedStorm.affectedRoute}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Selected Vessel Status Response */}
          <div className="border-t border-white/5 pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] text-slate-400 font-mono uppercase font-bold tracking-widest flex items-center gap-1">
                <Ship className="w-3.5 h-3.5 text-blue-450" /> Routing Integrity Indicator
              </span>
              <select
                value={selectedVesselId}
                onChange={(e) => setSelectedVesselId(e.target.value)}
                className="bg-[#0c1015] border border-white/10 text-slate-200 text-[9px] font-mono rounded px-1.5 py-0.5 cursor-pointer max-w-[130px]"
              >
                {vessels.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.type})</option>
                ))}
              </select>
            </div>

            {(() => {
              const activeV = vessels.find(v => v.id === selectedVesselId) || vessels[0];
              const { alertText, alertType } = getVesselStatusInStorm(activeV);
              return (
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition ${
                  alertType === "critical" 
                    ? "bg-red-500/10 border-red-500/40 text-red-400" 
                    : (alertType === "caution" ? "bg-amber-500/10 border-amber-500/40 text-amber-400" : "bg-white/5 border-white/15 text-slate-300")
                }`}>
                  {alertType !== "none" ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse text-red-400" />
                  ) : (
                    <Anchor className="w-4 h-4 shrink-0 text-slate-450" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[8px] font-mono uppercase">
                      <span className="font-bold text-slate-250 truncate">{activeV.name} ({activeV.origin} &rarr; {activeV.destination})</span>
                      <span className="text-slate-500 font-bold truncate">Speed: {activeV.speed > 0 ? `${activeV.speed} kts` : "Cargo Anchored"}</span>
                    </div>
                    <p className="text-[9px] font-mono leading-normal mt-0.5 max-w-full block font-bold text-slate-200 overflow-hidden text-ellipsis">
                      {alertType !== "none" ? alertText : "Standard passage condition. Ship progress advancing smoothly towards terminal."}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

      </div>

    </div>
  );
}
