import React, { useState } from 'react';
import { Sparkles, RefreshCw, TrendingUp, AlertTriangle } from 'lucide-react';
import Markdown from 'react-markdown';
import { Candle, Timeframe } from '../../types/crypto';

interface AIAnalysisCardProps {
  symbol: string;
  timeframe: Timeframe;
  currentPrice: number;
  candles: Candle[];
  srZones: any[]; // Support/Resistance zones to feed to AI
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
  symbol,
  timeframe,
  currentPrice,
  candles,
  srZones,
}) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    if (!symbol || !candles || candles.length === 0) return;
    setIsLoading(true);
    setError(null);

    // Prepare indicator data
    const safeCandles = candles.slice(-50); // Get last 50 candles for analysis
    const currentIndicators = {
      supportResistanceZones: srZones.slice(0, 5).map(z => ({
        price: z.price,
        type: z.type,
        strength: z.strength,
      })),
      trend: safeCandles[safeCandles.length - 1].close > safeCandles[0].close ? 'BULLISH' : 'BEARISH',
      volatility: 'MEDIUM', // simplified
    };

    try {
      const response = await fetch('/api/gemini/analyze-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          timeframe,
          currentPrice,
          currentIndicators,
          historicalDataSample: safeCandles.slice(-10).map(c => ({
            close: c.close,
            high: c.high,
            low: c.low,
            vol: c.volume
          })),
        }),
      });

      if (!response.ok) throw new Error('AI Analysis Fetch Failed');
      const data = await response.json();
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error('Analysis content is empty');
      }
    } catch (err: any) {
      setError(err.message || 'Analiz alınırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-3 flex flex-col shadow-lg relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h2 className="text-xs font-bold text-slate-200">
            YZ Market Analizi <span className="text-slate-500 font-mono">({symbol})</span>
          </h2>
        </div>
        <button
          onClick={fetchAnalysis}
          disabled={isLoading || !candles.length}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[10px] font-bold border border-indigo-500/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          {analysis ? 'Yenile' : 'Analiz Et'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 bg-[#181a20] rounded-lg border border-slate-800 p-3 min-h-[120px] max-h-[300px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-3">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-indigo-500/30 rounded-full animate-spin border-t-indigo-500" />
              <Sparkles className="w-3 h-3 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="text-[10px] animate-pulse">Gemini {symbol} grafiğini yorumluyor...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center text-red-400 space-y-2">
            <AlertTriangle className="w-6 h-6 opacity-80" />
            <p className="text-[10px] text-center px-4 opacity-80">{error}</p>
          </div>
        ) : analysis ? (
          <div className="text-[11px] text-slate-300 leading-relaxed markdown-body">
            <Markdown>{analysis}</Markdown>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 text-center px-4">
            <TrendingUp className="w-6 h-6 opacity-40 mb-1" />
            <p className="text-[10px] opacity-80">
              Mevcut grafik, indikatörler ve S/R bölgelerine dayalı otonom yapay zeka analizi için "Analiz Et" butonuna tıklayın.
            </p>
          </div>
        )}
      </div>
      
      {/* Fade out text at the bottom edge slightly if scrolling is possible */}
      {analysis && !isLoading && (
         <div className="absolute bottom-3 left-3 right-3 h-6 bg-gradient-to-t from-[#181a20] to-transparent pointer-events-none rounded-b-lg" />
      )}
    </div>
  );
};
