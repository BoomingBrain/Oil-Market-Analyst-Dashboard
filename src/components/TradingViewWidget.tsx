import React, { useEffect, useRef } from "react";

interface TradingViewWidgetProps {
  asset: "WTI" | "Brent" | "Gasoline" | "Heating Oil";
}

export function TradingViewWidget({ asset }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Clear any previous script and widget elements to avoid duplicate embedding
    container.current.innerHTML = "";

    // Map the selected energy asset to its respective active futures/CFD contract code on TradingView.
    // We use fully public, non-restricted CFD tickers (TVC and CAPITALCOM) so they don't fall back to AAPL.
    let symbol = "TVC:USOIL"; // WTI Crude Oil CFD
    if (asset === "Brent") {
      symbol = "TVC:UKOIL"; // Brent Crude Oil CFD
    } else if (asset === "Gasoline") {
      symbol = "CAPITALCOM:GASOLINE"; // Gasoline CFD
    } else if (asset === "Heating Oil") {
      symbol = "CAPITALCOM:HEATINGOIL"; // Heating Oil CFD
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1", // 1 is Candlesticks
      locale: "en",
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      details: true,
      hotlist: false,
      calendar: false,
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650",
      studies: [
        "RSI@tv-basicstudies",
        "MASimple@tv-basicstudies"
      ],
      support_host: "https://www.tradingview.com"
    });

    container.current.appendChild(script);

    return () => {
      // Clean up reference on unmount
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [asset]);

  return (
    <div className="w-full h-full min-h-[360px] bg-[#0c1015]/90 rounded-xl overflow-hidden shadow-2xl relative border border-white/5">
      <div 
        ref={container} 
        style={{ width: "100%", height: "100%" }}
        className="tradingview-widget-container w-full h-full"
      />
    </div>
  );
}
