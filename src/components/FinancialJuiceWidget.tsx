import React from "react";

export function FinancialJuiceWidget() {
  return (
    <div className="w-full h-full min-h-[350px] bg-[#0c1015]/95 rounded-xl overflow-hidden relative border border-white/5 shadow-2xl flex flex-col">
      {/* Header Bar */}
      <div className="bg-slate-900/40 px-4 py-2 border-b border-white/10 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Live Financial Juice Stream
        </span>
        <a 
          href="https://www.financialjuice.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[9px] text-[#00cbf9] hover:underline font-mono font-bold tracking-wider"
        >
          FINANCIAL JUICE
        </a>
      </div>

      {/* Widget Content Container */}
      <div className="flex-1 w-full relative bg-[#0e131b] p-3 overflow-y-auto flex flex-col justify-start">
        <iframe
          src="https://feed.financialjuice.com/voice-player.aspx?mode=inline&display=1"
          style={{ width: "100%", height: "100%", minHeight: "300px", border: "none" }}
          scrolling="yes"
          title="FinancialJuice Voice Stream"
        />
      </div>
    </div>
  );
}
