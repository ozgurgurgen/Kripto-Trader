import React, { useState, useEffect } from 'react';
import { ArbitrageOpportunity, ExchangePriceQuote } from '../../types/crypto';
import { ArbitrageService } from '../../services/arbitrageService';
import { 
  Scale, 
  Layers, 
  Zap, 
  RefreshCw, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Activity, 
  Server, 
  Globe,
  Sliders,
  DollarSign
} from 'lucide-react';

interface ArbitrageRadarPanelProps {
  symbol: string;
  currentPrice: number;
}

export const ArbitrageRadarPanel: React.FC<ArbitrageRadarPanelProps> = ({
  symbol,
  currentPrice,
}) => {
  const [quotes, setQuotes] = useState<ExchangePriceQuote[]>(() => ArbitrageService.getExchangeQuotes(symbol, currentPrice));
  const [spatialOpportunities, setSpatialOpportunities] = useState<ArbitrageOpportunity[]>(() => 
    ArbitrageService.scanSpatialArbitrage(symbol, currentPrice)
  );
  const [triangularOpportunities, setTriangularOpportunities] = useState<ArbitrageOpportunity[]>(() =>
    ArbitrageService.scanTriangularArbitrage(currentPrice)
  );
  const [isScanning, setIsScanning] = useState(false);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'spatial' | 'triangular' | 'matrix'>('spatial');

  const handleRefresh = () => {
    setIsScanning(true);
    setTimeout(() => {
      setQuotes(ArbitrageService.getExchangeQuotes(symbol, currentPrice));
      setSpatialOpportunities(ArbitrageService.scanSpatialArbitrage(symbol, currentPrice));
      setTriangularOpportunities(ArbitrageService.scanTriangularArbitrage(currentPrice));
      setIsScanning(false);
    }, 500);
  };

  useEffect(() => {
    handleRefresh();
  }, [symbol, currentPrice]);

  const handleExecuteArbitrage = (opp: ArbitrageOpportunity) => {
    setExecutionMessage(`Arbitraj İşlemi Başlatıldı: ${opp.buyExchange} ➔ ${opp.sellExchange} | Beklenen Net Kâr: $${opp.estimatedProfitUsd.toFixed(2)} (${opp.netProfitPct.toFixed(2)}%)`);
    setTimeout(() => setExecutionMessage(null), 5000);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">Çoklu Borsa & Arbitraj / Triangulation Radarı</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  UNIFIED API
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Binance, Coinbase, Kraken, Bybit ve OKX arası anlık fiyat farkları (Spatial) ve Üçgen (Triangular) arbitraj fırsatları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
              <span>Fiyatları Tara</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('spatial')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeTab === 'spatial'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Borsalar Arası Arbitraj ({spatialOpportunities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('triangular')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeTab === 'triangular'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Üçgen Arbitraj (Triangular) ({triangularOpportunities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 ${
              activeTab === 'matrix'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-white bg-slate-900/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Canlı Borsa Fiyat Matrisi (5 Borsa)</span>
          </button>
        </div>
      </div>

      {/* Execution Feedback Notification */}
      {executionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{executionMessage}</span>
        </div>
      )}

      {/* TAB 1: Spatial Arbitrage */}
      {activeTab === 'spatial' && (
        <div className="space-y-3">
          {spatialOpportunities.length === 0 ? (
            <div className="p-8 text-center bg-[#0e131f] border border-slate-800 rounded-2xl">
              <Scale className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-mono">Şu an net komisyon sonrası pozitif getiri sunan borsalar arası arbitraj bulunamadı.</p>
            </div>
          ) : (
            spatialOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-amber-500/40 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      SPATIAL ARB
                    </span>
                    <span className="text-xs font-mono font-bold text-white">{opp.symbol}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[10px]">AL:</span>
                      <span className="text-white font-bold">{opp.buyExchange}</span>
                      <span className="text-emerald-400">${opp.buyPrice.toFixed(2)}</span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-600" />

                    <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 text-[10px]">SAT:</span>
                      <span className="text-white font-bold">{opp.sellExchange}</span>
                      <span className="text-red-400">${opp.sellPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                  <div className="text-right font-mono">
                    <div className="text-xs text-slate-400">Net Kâr (Komisyon Sonrası):</div>
                    <div className="text-base font-bold text-emerald-400">
                      +{opp.netProfitPct.toFixed(2)}% <span className="text-xs text-slate-400">(${opp.estimatedProfitUsd.toFixed(2)})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecuteArbitrage(opp)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-500/10"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>İşlemi Yürüt</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Triangular Arbitrage */}
      {activeTab === 'triangular' && (
        <div className="space-y-3">
          {triangularOpportunities.map((opp) => (
            <div
              key={opp.id}
              className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-amber-500/40 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    TRIANGULAR LOOP
                  </span>
                  <span className="text-xs font-mono font-bold text-white">{opp.symbol}</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-400">Döngü Net Kârı: </span>
                    <span className="text-emerald-400 font-bold">+{opp.netProfitPct.toFixed(3)}% (${opp.estimatedProfitUsd.toFixed(2)})</span>
                  </div>

                  <button
                    onClick={() => handleExecuteArbitrage(opp)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Döngüyü Başlat</span>
                  </button>
                </div>
              </div>

              {/* Execution Path */}
              {opp.path && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  {opp.path.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-mono text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-amber-400 shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Exchange Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono text-white">Birleşik Borsa Fiyat & Likidite Karşılaştırması</h4>
            <span className="text-[10px] font-mono text-slate-400">Otomatik Failover Korumalı</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-left">
                  <th className="p-3">Borsa</th>
                  <th className="p-3">Alış (Bid)</th>
                  <th className="p-3">Satış (Ask)</th>
                  <th className="p-3">Son Fiyat</th>
                  <th className="p-3">24s Hacim</th>
                  <th className="p-3">Gecikme</th>
                  <th className="p-3 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {quotes.map((q) => (
                  <tr key={q.exchangeName} className="hover:bg-slate-800/20">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <Server className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{q.exchangeName}</span>
                    </td>
                    <td className="p-3 text-emerald-400 font-bold">${q.bidPrice.toFixed(2)}</td>
                    <td className="p-3 text-red-400 font-bold">${q.askPrice.toFixed(2)}</td>
                    <td className="p-3 text-slate-200">${q.lastPrice.toFixed(2)}</td>
                    <td className="p-3 text-slate-400">${(q.volume24hUsd / 1000000).toFixed(1)}M</td>
                    <td className="p-3 text-slate-400">{q.latencyMs} ms</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        BAĞLI (CANLI)
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
