import React, { useState, useEffect } from 'react';
import { CryptoNewsItem, OnChainMetrics, SentimentMetrics, WhaleTransaction } from '../../types/crypto';
import { MarketIntelligenceService } from '../../services/marketIntelligenceService';
import { 
  Activity, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Compass, 
  Globe, 
  ExternalLink, 
  RefreshCw, 
  ShieldAlert, 
  Zap, 
  Radio, 
  Coins, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles
} from 'lucide-react';

interface MarketIntelligencePanelProps {
  symbol: string;
  currentPrice: number;
}

export const MarketIntelligencePanel: React.FC<MarketIntelligencePanelProps> = ({
  symbol,
  currentPrice,
}) => {
  const [sentiment, setSentiment] = useState<SentimentMetrics>(() => MarketIntelligenceService.getSentimentMetrics(symbol));
  const [whaleTxs, setWhaleTxs] = useState<WhaleTransaction[]>(() => MarketIntelligenceService.getWhaleTransactions(symbol));
  const [onChain, setOnChain] = useState<OnChainMetrics>(() => MarketIntelligenceService.getOnChainMetrics(currentPrice));
  const [news, setNews] = useState<CryptoNewsItem[]>(() => MarketIntelligenceService.getCryptoNews());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'onchain' | 'news' | 'sentiment'>('all');

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setSentiment(MarketIntelligenceService.getSentimentMetrics(symbol));
      setWhaleTxs(MarketIntelligenceService.getWhaleTransactions(symbol));
      setOnChain(MarketIntelligenceService.getOnChainMetrics(currentPrice));
      setNews(MarketIntelligenceService.getCryptoNews());
      setIsRefreshing(false);
    }, 600);
  };

  useEffect(() => {
    refreshData();
  }, [symbol]);

  const getFearGreedColor = (val: number) => {
    if (val >= 75) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (val >= 55) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    if (val >= 45) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">Piyasa İstihbaratı, On-Chain & Duyarlılık Radarı</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  CANLI AKIŞ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Korku & Açgözlülük İndeksi, Balina Cüzdan Transferleri, Borsa Net Giriş/Çıkışları ve AI Haber Duyarlılığı
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* Vital Gauges & Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          {/* 1. Fear & Greed */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-400 font-mono">Korku & Açgözlülük:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getFearGreedColor(sentiment.fearAndGreedIndex)}`}>
                {sentiment.fearAndGreedClassification}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-cyan-400">{sentiment.fearAndGreedIndex}</span>
              <span className="text-xs text-slate-500 font-mono">/ 100</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${sentiment.fearAndGreedIndex}%` }}
              />
            </div>
          </div>

          {/* 2. Exchange Net Flow */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-400 font-mono">Borsa Net Akışı (24s):</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Çıkış (Boğa)
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-400">-$142.8M</span>
              <span className="text-[10px] text-slate-400 font-mono">Soğuk Cüzdana</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">Borsalardan coin çekilmesi arzı daraltır.</div>
          </div>

          {/* 3. Whale Accumulation */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-400 font-mono">Balina Birikim Skoru:</span>
              <span className="text-xs font-mono font-bold text-purple-400">{onChain.whaleAccumulationIndex}%</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-purple-300">Güçlü Akümülasyon</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">1,000+ BTC cüzdan bakiyeleri artışta.</div>
          </div>

          {/* 4. Funding & Open Interest */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-slate-400 font-mono">Fonlama & Açık Pozisyon:</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">+{onChain.fundingRatePct}%</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-slate-200">$28.45B</span>
              <span className="text-[10px] text-slate-400 font-mono">OI Hacmi</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">Pozitif fonlama: Long pozisyonlar baskın.</div>
          </div>
        </div>
      </div>

      {/* AI Sentiment Summary Banner */}
      <div className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-slate-900/40 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white font-mono uppercase">Yapay Zeka Piyasa Duyarlılık Değerlendirmesi</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {sentiment.aiSentimentSummary}
          </p>
        </div>
      </div>

      {/* Two Column Layout: Whale Transactions vs Live Crypto News */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Whale Tracker */}
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h4 className="text-xs font-bold text-slate-200 font-mono uppercase">Canlı Balina Transfer Radarı (Whale Alert)</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Son 4 Saat</span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {whaleTxs.map((tx) => {
              const isBullish = tx.impactScore === 'BULLISH';
              const isBearish = tx.impactScore === 'BEARISH';

              return (
                <div key={tx.id} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-2 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-mono font-bold text-white">
                      <span>{tx.amount.toLocaleString()} {tx.symbol}</span>
                      <span className="text-slate-400 font-normal">(${(tx.amountUsd / 1000000).toFixed(1)}M USD)</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                      isBullish ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      isBearish ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {isBullish ? <ArrowUpRight className="w-3 h-3" /> : isBearish ? <ArrowDownRight className="w-3 h-3" /> : null}
                      {tx.impactScore === 'BULLISH' ? 'BOĞA ETKİSİ' : tx.impactScore === 'BEARISH' ? 'AYI BASKISI' : 'NÖTR TRANSFER'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded-lg">
                    <div className="truncate max-w-[140px]" title={tx.fromAddress}>
                      <span className="text-slate-500 text-[9px] block">KAYNAK:</span>
                      <span className="text-slate-300">{tx.fromAddress}</span>
                    </div>
                    <span className="text-cyan-400 font-bold">➔</span>
                    <div className="truncate max-w-[140px] text-right" title={tx.toAddress}>
                      <span className="text-slate-500 text-[9px] block">HEDEF:</span>
                      <span className="text-slate-300">{tx.toAddress}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Tx: {tx.txHash}</span>
                    <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live Crypto News & Sentiment */}
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-200 font-mono uppercase">Finansal Haberler & Duyarlılık Akışı</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Doğrulanmış Kaynaklar</span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {news.map((item) => (
              <div key={item.id} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1.5 hover:border-slate-700 transition">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-cyan-400 font-bold">{item.source}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                    item.sentiment === 'POSITIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    item.sentiment === 'NEGATIVE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {item.sentiment === 'POSITIVE' ? 'POZİTİF (+)' : item.sentiment === 'NEGATIVE' ? 'NEGATİF (-)' : 'NÖTR (0)'}
                  </span>
                </div>

                <h5 className="text-xs font-bold text-white leading-snug hover:text-cyan-300 transition cursor-pointer">
                  {item.title}
                </h5>

                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-slate-500 border-t border-slate-800/60">
                  <div className="flex items-center gap-1.5">
                    <span>Etkilenen:</span>
                    {item.relatedCoins.map((c) => (
                      <span key={c} className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 font-bold">
                        {c}
                      </span>
                    ))}
                  </div>
                  <span>{new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
