import React, { useState } from 'react';
import { Candle, Timeframe } from '../../types/crypto';
import { HistoricalDataService, DatasetStats } from '../../services/historicalDataService';
import { 
  Calendar, 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Database, 
  Sparkles, 
  X, 
  CheckCircle, 
  RefreshCw,
  Clock,
  Layers,
  BarChart2
} from 'lucide-react';

interface FiveYearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  currentCandles: Candle[];
  onApply5YearData: (candles: Candle[], timeframe: Timeframe) => void;
}

export const FiveYearDataModal: React.FC<FiveYearDataModalProps> = ({
  isOpen,
  onClose,
  symbol,
  currentCandles,
  onApply5YearData,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1d');
  const [loading, setLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [downloadedCandles, setDownloadedCandles] = useState<Candle[] | null>(null);
  const [stats, setStats] = useState<DatasetStats | null>(() => {
    return currentCandles.length > 300 ? HistoricalDataService.getDatasetStats(symbol, currentCandles) : null;
  });

  if (!isOpen) return null;

  const handleFetch5YearData = async () => {
    setLoading(true);
    setProgressPercent(10);
    setProgressStatus('5 yıllık veriler hazırlanıyor...');

    try {
      const candles = await HistoricalDataService.load5YearHistoricalKlines(
        symbol,
        selectedTimeframe,
        (pct, count, status) => {
          setProgressPercent(pct);
          setProgressStatus(status);
        }
      );

      setDownloadedCandles(candles);
      const computedStats = HistoricalDataService.getDatasetStats(symbol, candles);
      setStats(computedStats);
    } catch (err) {
      setProgressStatus('Veri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToChart = () => {
    if (downloadedCandles && downloadedCandles.length > 0) {
      onApply5YearData(downloadedCandles, selectedTimeframe);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#1e2329] border border-[#2b313a] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-[#14151a] border-b border-[#2b313a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#fcd535]/15 text-[#fcd535] border border-[#fcd535]/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#eaecef] flex items-center gap-2">
                <span>{symbol} - 5 Yıllık Geçmiş Grafik Verileri</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#fcd535]/20 text-[#fcd535] font-mono font-semibold">
                  2021 – 2026
                </span>
              </h2>
              <p className="text-xs text-[#848e9c]">
                Makro boğa, ayı, halving ve zirve döngülerini içeren tam kapsamlı 5 yıllık mum verisi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b313a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Timeframe & Fetch Trigger Box */}
          <div className="p-3.5 rounded-lg bg-[#14151a] border border-[#2b313a] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold text-[#848e9c]">Mum Zaman Dilimi Seçimi:</span>
              <div className="flex items-center gap-1.5 bg-[#1e2329] p-1 rounded-md border border-[#2b313a]">
                {(['1d', '1w', '4h'] as Timeframe[]).map((tf) => (
                  <button
                    key={tf}
                    disabled={loading}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                      selectedTimeframe === tf
                        ? 'bg-[#fcd535] text-[#181a20] font-bold shadow-xs'
                        : 'text-[#848e9c] hover:text-[#eaecef]'
                    }`}
                  >
                    {tf === '1d' ? '1 Gün (Önerilen)' : tf === '1w' ? '1 Hafta (Makro)' : '4 Saat'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleFetch5YearData}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#fcd535] hover:bg-[#ffe066] text-[#181a20] font-bold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? '5 Yıllık Veriler Çekiliyor...' : `${symbol} 5 Yıllık Verilerini Şimdi İndir / Çek`}</span>
            </button>

            {/* Progress Bar when loading */}
            {loading && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-[#848e9c]">
                  <span>{progressStatus}</span>
                  <span className="font-mono font-bold text-[#fcd535]">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-[#2b313a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-[#fcd535] to-[#0ecb81] transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Historical Macro Cycle Timeline Highlights */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#848e9c] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#fcd535]" />
              <span>5 Yıllık Piyasa Döngüleri Kapsamı (2021 - 2026)</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-lg bg-[#14151a] border border-[#2b313a] text-center">
                <div className="text-[10px] text-[#848e9c] font-semibold">2021</div>
                <div className="text-xs font-bold text-[#0ecb81]">Tarihi Zirve Boğası</div>
                <div className="text-[10px] text-slate-400">ATH Dönemi</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14151a] border border-[#2b313a] text-center">
                <div className="text-[10px] text-[#848e9c] font-semibold">2022</div>
                <div className="text-xs font-bold text-[#f6465d]">Kripto Kışı & Dip</div>
                <div className="text-[10px] text-slate-400">Akümülasyon</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14151a] border border-[#2b313a] text-center">
                <div className="text-[10px] text-[#848e9c] font-semibold">2023 - 2024</div>
                <div className="text-xs font-bold text-[#38bdf8]">Halving & ETF Rallisi</div>
                <div className="text-[10px] text-slate-400">Yükseliş Kanalı</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#14151a] border border-[#2b313a] text-center">
                <div className="text-[10px] text-[#848e9c] font-semibold">2025 - 2026</div>
                <div className="text-xs font-bold text-[#fcd535]">Makro Genişleme</div>
                <div className="text-[10px] text-slate-400">Canlı Seviye</div>
              </div>
            </div>
          </div>

          {/* Dataset Statistics (if available) */}
          {stats && (
            <div className="p-3.5 rounded-lg bg-[#14151a] border border-[#2b313a] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#eaecef] flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-[#0ecb81]" />
                  <span>5 Yıllık Veri Seti Özeti</span>
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/30">
                  {stats.totalCandles} Mum Verisi
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2 rounded bg-[#1e2329] border border-[#2b313a]">
                  <div className="text-[10px] text-[#848e9c]">Dönem Aralığı</div>
                  <div className="text-xs font-semibold text-[#eaecef] font-mono truncate">{stats.startDate} - {stats.endDate}</div>
                </div>
                <div className="p-2 rounded bg-[#1e2329] border border-[#2b313a]">
                  <div className="text-[10px] text-[#848e9c]">5 Yıllık En Yüksek</div>
                  <div className="text-xs font-bold text-[#0ecb81] font-mono">${stats.highestPrice.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded bg-[#1e2329] border border-[#2b313a]">
                  <div className="text-[10px] text-[#848e9c]">5 Yıllık En Düşük</div>
                  <div className="text-xs font-bold text-[#f6465d] font-mono">${stats.lowestPrice.toLocaleString()}</div>
                </div>
                <div className="p-2 rounded bg-[#1e2329] border border-[#2b313a]">
                  <div className="text-[10px] text-[#848e9c]">5 Yıllık Toplam Getiri</div>
                  <div className={`text-xs font-bold font-mono ${stats.priceChangePct >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    {stats.priceChangePct >= 0 ? '+' : ''}{stats.priceChangePct.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    if (downloadedCandles) {
                      HistoricalDataService.exportHistoricalDataCSV(symbol, downloadedCandles);
                    } else if (currentCandles.length > 0) {
                      HistoricalDataService.exportHistoricalDataCSV(symbol, currentCandles);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-[#1e2329] hover:bg-[#2b313a] text-[#eaecef] text-xs font-semibold border border-[#2b313a] transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#fcd535]" />
                  <span>CSV Olarak İndir</span>
                </button>
                <button
                  onClick={() => {
                    if (downloadedCandles) {
                      HistoricalDataService.exportHistoricalDataJSON(symbol, downloadedCandles);
                    } else if (currentCandles.length > 0) {
                      HistoricalDataService.exportHistoricalDataJSON(symbol, currentCandles);
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-[#1e2329] hover:bg-[#2b313a] text-[#eaecef] text-xs font-semibold border border-[#2b313a] transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>JSON Olarak İndir</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#14151a] border-t border-[#2b313a]">
          <span className="text-xs text-[#848e9c]">
            {downloadedCandles ? `✅ ${downloadedCandles.length} mum grafiğe uygulanmaya hazır` : '5 yıllık geçmiş veri seti'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#1e2329] hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] text-xs font-semibold transition-colors"
            >
              Kapat
            </button>
            {downloadedCandles && (
              <button
                onClick={handleApplyToChart}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0ecb81] hover:bg-[#0bb974] text-white font-bold text-xs transition-all shadow-md active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Grafiğe 5 Yıllık Veriyi Yükle</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
