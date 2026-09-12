import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  LineData, 
  HistogramData, 
  SeriesMarker, 
  Time,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createSeriesMarkers,
  ISeriesMarkersPluginApi
} from 'lightweight-charts';
import { Candle, IndicatorSettings, Signal, SupportResistanceZone, Timeframe, AlertItem } from '../../types/crypto';
import { IndicatorEngine } from '../../services/indicatorEngine';
import { HistoricalDataService } from '../../services/historicalDataService';
import { DrawingToolbar, DrawingTool } from './DrawingToolbar';
import { QuickAlertModal } from './QuickAlertModal';
import { FiveYearDataModal } from './FiveYearDataModal';
import { 
  Sliders, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  Activity, 
  Zap, 
  TrendingUp, 
  BarChart2, 
  Bell, 
  BellRing, 
  BellPlus, 
  X, 
  Trash2, 
  CheckCircle,
  Plus,
  Calendar,
  Download,
  Database,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface TradingViewChartProps {
  candles?: Candle[];
  symbol: string;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  indicatorSettings: IndicatorSettings;
  onOpenIndicatorModal: () => void;
  srZones?: SupportResistanceZone[];
  strategySignals?: Signal[];
  liveCandle?: Candle | null;
  alerts?: AlertItem[];
  onAddAlert?: (alert: AlertItem) => void;
  onDeleteAlert?: (id: string) => void;
  onApply5YearData?: (candles: Candle[], tf: Timeframe) => void;
}

interface CustomDrawing {
  id: string;
  type: DrawingTool;
  points: { x: number; y: number; price?: number; time?: number }[];
  text?: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  candles = [],
  symbol,
  timeframe,
  onTimeframeChange,
  indicatorSettings,
  onOpenIndicatorModal,
  srZones = [],
  strategySignals = [],
  liveCandle,
  alerts = [],
  onAddAlert,
  onDeleteAlert,
  onApply5YearData,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  
  // 1. Moving Averages & Trend Series Refs
  const smaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const ema200SeriesRef = useRef<ISeriesApi<any> | null>(null);
  const hmaSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const supertrendSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const parabolicSarSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<any> | null>(null);

  // Ichimoku Lines
  const ichimokuTenkanRef = useRef<ISeriesApi<any> | null>(null);
  const ichimokuKijunRef = useRef<ISeriesApi<any> | null>(null);
  const ichimokuSpanARef = useRef<ISeriesApi<any> | null>(null);
  const ichimokuSpanBRef = useRef<ISeriesApi<any> | null>(null);

  // 2. Volatility Bands Series Refs
  const bbUpperSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const bbMidSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<any> | null>(null);

  const keltnerUpperRef = useRef<ISeriesApi<any> | null>(null);
  const keltnerMidRef = useRef<ISeriesApi<any> | null>(null);
  const keltnerLowerRef = useRef<ISeriesApi<any> | null>(null);

  const donchianUpperRef = useRef<ISeriesApi<any> | null>(null);
  const donchianMidRef = useRef<ISeriesApi<any> | null>(null);
  const donchianLowerRef = useRef<ISeriesApi<any> | null>(null);

  // Support & Resistance Price Lines & Alert Lines
  const srPriceLinesRef = useRef<any[]>([]);
  const alertPriceLinesRef = useRef<any[]>([]);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  // Drawing state
  const [activeTool, setActiveTool] = useState<DrawingTool>('cursor');
  const [drawings, setDrawings] = useState<CustomDrawing[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawingPoints, setCurrentDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOscillators, setShowOscillators] = useState(true);
  const [selectedOscillatorTab, setSelectedOscillatorTab] = useState<'rsi' | 'macd' | 'stoch' | 'cci' | 'adx' | 'wr' | 'mfi' | 'obv' | 'atr'>('rsi');

  // Interactive Alert Creation State
  const [isAlertMode, setIsAlertMode] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedAlertPrice, setSelectedAlertPrice] = useState<number>(0);
  const [cursorPrice, setCursorPrice] = useState<number | null>(null);
  const [cursorY, setCursorY] = useState<number | null>(null);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const [isHoveringChart, setIsHoveringChart] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAlertListOpen, setIsAlertListOpen] = useState(false);

  // 5-Year Historical Data State
  const [isFiveYearModalOpen, setIsFiveYearModalOpen] = useState(false);
  const [isLoading5Year, setIsLoading5Year] = useState(false);
  const [fiveYearProgress, setFiveYearProgress] = useState<number>(0);
  const [activeRange, setActiveRange] = useState<'24S' | '7G' | '30G' | '90G' | '1Y' | '5Y' | 'ALL'>('ALL');

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];

  // Current Price & Live Candle
  const safeCandles = candles || [];
  const currentPrice = liveCandle?.close || (safeCandles.length > 0 ? safeCandles[safeCandles.length - 1].close : 0);

  // Quick 5-Year Historical Data Loader Handler
  const handleQuickLoad5Year = async (tf: Timeframe = '1d') => {
    setIsLoading5Year(true);
    setFiveYearProgress(15);
    setToastMessage(`⏳ ${symbol} için 5 yıllık geçmiş veri indiriliyor...`);

    try {
      const candles5y = await HistoricalDataService.load5YearHistoricalKlines(
        symbol,
        tf,
        (pct) => {
          setFiveYearProgress(pct);
        }
      );

      if (onApply5YearData) {
        onApply5YearData(candles5y, tf);
      } else if (onTimeframeChange) {
        onTimeframeChange(tf);
      }

      // Auto-fit chart timescale
      setTimeout(() => {
        try {
          chartRef.current?.timeScale().fitContent();
        } catch {
          // ignore
        }
      }, 200);

      setToastMessage(`✅ ${symbol} için 5 yıllık (${candles5y.length} mum) geçmiş veri yüklendi!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      setToastMessage(`⚠️ 5 yıllık veri yüklenirken hata oluştu.`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsLoading5Year(false);
      setFiveYearProgress(0);
    }
  };

  // Active Symbol Alerts
  const activeSymbolAlerts = useMemo(() => {
    return (alerts || []).filter((a) => a.symbol === symbol && !a.triggered);
  }, [alerts, symbol]);

  // Compute Active Sub-Panel Indicator Values for live metrics bar
  const indicatorValues = useMemo(() => {
    if (!safeCandles || safeCandles.length === 0) return {};

    const res: Record<string, any> = {};

    if (indicatorSettings.rsi.enabled) {
      const rsiArr = IndicatorEngine.calculateRSI(safeCandles, indicatorSettings.rsi.period);
      res.rsi = rsiArr[rsiArr.length - 1];
    }
    if (indicatorSettings.macd.enabled) {
      const macdObj = IndicatorEngine.calculateMACD(safeCandles, indicatorSettings.macd.fast, indicatorSettings.macd.slow, indicatorSettings.macd.signal);
      res.macd = {
        line: macdObj.macdLine[macdObj.macdLine.length - 1],
        signal: macdObj.signalLine[macdObj.signalLine.length - 1],
        hist: macdObj.histogram[macdObj.histogram.length - 1],
      };
    }
    if (indicatorSettings.stochastic.enabled) {
      const stochObj = IndicatorEngine.calculateStochastic(safeCandles, indicatorSettings.stochastic.kPeriod, indicatorSettings.stochastic.dPeriod, indicatorSettings.stochastic.smooth);
      res.stoch = {
        k: stochObj.k[stochObj.k.length - 1],
        d: stochObj.d[stochObj.d.length - 1],
      };
    }
    if (indicatorSettings.cci.enabled) {
      const cciArr = IndicatorEngine.calculateCCI(safeCandles, indicatorSettings.cci.period);
      res.cci = cciArr[cciArr.length - 1];
    }
    if (indicatorSettings.adx.enabled) {
      const adxObj = IndicatorEngine.calculateADX(safeCandles, indicatorSettings.adx.period);
      res.adx = {
        value: adxObj.adx[adxObj.adx.length - 1],
        plusDI: adxObj.plusDI[adxObj.plusDI.length - 1],
        minusDI: adxObj.minusDI[adxObj.minusDI.length - 1],
      };
    }
    if (indicatorSettings.williamsR.enabled) {
      const wrArr = IndicatorEngine.calculateWilliamsR(safeCandles, indicatorSettings.williamsR.period);
      res.wr = wrArr[wrArr.length - 1];
    }
    if (indicatorSettings.mfi.enabled) {
      const mfiArr = IndicatorEngine.calculateMFI(safeCandles, indicatorSettings.mfi.period);
      res.mfi = mfiArr[mfiArr.length - 1];
    }
    if (indicatorSettings.obv.enabled) {
      const obvArr = IndicatorEngine.calculateOBV(safeCandles);
      res.obv = obvArr[obvArr.length - 1];
    }
    if (indicatorSettings.atr.enabled) {
      const atrArr = IndicatorEngine.calculateATR(safeCandles, indicatorSettings.atr.period);
      res.atr = atrArr[atrArr.length - 1];
    }

    return res;
  }, [safeCandles, indicatorSettings]);

  // Count active overlays
  const activeOverlayCount = useMemo(() => {
    let count = 0;
    if (indicatorSettings.sma.enabled) count++;
    if (indicatorSettings.ema20.enabled) count++;
    if (indicatorSettings.ema50.enabled) count++;
    if (indicatorSettings.ema200.enabled) count++;
    if (indicatorSettings.hma.enabled) count++;
    if (indicatorSettings.supertrend.enabled) count++;
    if (indicatorSettings.parabolicSar.enabled) count++;
    if (indicatorSettings.ichimoku.enabled) count++;
    if (indicatorSettings.vwap.enabled) count++;
    if (indicatorSettings.bollingerBands.enabled) count++;
    if (indicatorSettings.keltnerChannels.enabled) count++;
    if (indicatorSettings.donchianChannels.enabled) count++;
    return count;
  }, [indicatorSettings]);

  // Initialize Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: '#181a20' },
        textColor: '#848e9c',
      },
      grid: {
        vertLines: { color: '#23272e' },
        horzLines: { color: '#23272e' },
      },
      crosshair: {
        vertLine: { color: '#848e9c', width: 1, style: 3, labelBackgroundColor: '#2b313a' },
        horzLine: { color: '#848e9c', width: 1, style: 3, labelBackgroundColor: '#2b313a' },
      },
      rightPriceScale: {
        borderColor: '#2b313a',
        scaleMargins: {
          top: 0.08,
          bottom: indicatorSettings.volume.enabled ? 0.22 : 0.08,
        },
      },
      timeScale: {
        borderColor: '#2b313a',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // 1. Candlestick Series
    candleSeriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderVisible: false,
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    // 2. Volume Histogram Series
    if (indicatorSettings.volume.enabled) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '', // overlay inside price scale
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    // 3. Moving Averages & Overlays
    if (indicatorSettings.sma.enabled) {
      smaSeriesRef.current = chart.addSeries(LineSeries, {
        color: indicatorSettings.sma.color,
        lineWidth: 1,
        title: `SMA ${indicatorSettings.sma.period}`,
      });
    }
    if (indicatorSettings.ema20.enabled) {
      ema20SeriesRef.current = chart.addSeries(LineSeries, {
        color: indicatorSettings.ema20.color,
        lineWidth: 1,
        title: `EMA ${indicatorSettings.ema20.period}`,
      });
    }
    if (indicatorSettings.ema50.enabled) {
      ema50SeriesRef.current = chart.addSeries(LineSeries, {
        color: indicatorSettings.ema50.color,
        lineWidth: 1,
        title: `EMA ${indicatorSettings.ema50.period}`,
      });
    }
    if (indicatorSettings.ema200.enabled) {
      ema200SeriesRef.current = chart.addSeries(LineSeries, {
        color: indicatorSettings.ema200.color,
        lineWidth: 2,
        title: `EMA ${indicatorSettings.ema200.period}`,
      });
    }
    if (indicatorSettings.hma.enabled) {
      hmaSeriesRef.current = chart.addSeries(LineSeries, {
        color: indicatorSettings.hma.color,
        lineWidth: 2,
        title: `HMA ${indicatorSettings.hma.period}`,
      });
    }
    if (indicatorSettings.supertrend.enabled) {
      supertrendSeriesRef.current = chart.addSeries(LineSeries, {
        color: '#10b981',
        lineWidth: 2,
        title: 'SuperTrend',
      });
    }
    if (indicatorSettings.parabolicSar.enabled) {
      parabolicSarSeriesRef.current = chart.addSeries(LineSeries, {
        color: indicatorSettings.parabolicSar.color,
        lineWidth: 1,
        lineStyle: 3,
        title: 'SAR',
      });
    }
    if (indicatorSettings.vwap.enabled) {
      vwapSeriesRef.current = chart.addSeries(LineSeries, {
        color: indicatorSettings.vwap.color,
        lineWidth: 1,
        title: 'VWAP',
      });
    }

    // Ichimoku Lines
    if (indicatorSettings.ichimoku.enabled) {
      ichimokuTenkanRef.current = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 1, title: 'Tenkan (9)' });
      ichimokuKijunRef.current = chart.addSeries(LineSeries, { color: '#f43f5e', lineWidth: 1, title: 'Kijun (26)' });
      ichimokuSpanARef.current = chart.addSeries(LineSeries, { color: '#10b981', lineWidth: 1, lineStyle: 2, title: 'Span A' });
      ichimokuSpanBRef.current = chart.addSeries(LineSeries, { color: '#ef4444', lineWidth: 1, lineStyle: 2, title: 'Span B (52)' });
    }

    // Bollinger Bands
    if (indicatorSettings.bollingerBands.enabled) {
      bbUpperSeriesRef.current = chart.addSeries(LineSeries, { color: indicatorSettings.bollingerBands.upperColor, lineWidth: 1, lineStyle: 2 });
      bbMidSeriesRef.current = chart.addSeries(LineSeries, { color: indicatorSettings.bollingerBands.midColor, lineWidth: 1 });
      bbLowerSeriesRef.current = chart.addSeries(LineSeries, { color: indicatorSettings.bollingerBands.lowerColor, lineWidth: 1, lineStyle: 2 });
    }

    // Keltner Channels
    if (indicatorSettings.keltnerChannels.enabled) {
      keltnerUpperRef.current = chart.addSeries(LineSeries, { color: indicatorSettings.keltnerChannels.color, lineWidth: 1, lineStyle: 2, title: 'Keltner Üst' });
      keltnerMidRef.current = chart.addSeries(LineSeries, { color: indicatorSettings.keltnerChannels.color, lineWidth: 1 });
      keltnerLowerRef.current = chart.addSeries(LineSeries, { color: indicatorSettings.keltnerChannels.color, lineWidth: 1, lineStyle: 2, title: 'Keltner Alt' });
    }

    // Donchian Channels
    if (indicatorSettings.donchianChannels.enabled) {
      donchianUpperRef.current = chart.addSeries(LineSeries, { color: indicatorSettings.donchianChannels.color, lineWidth: 1, title: 'Donchian Üst' });
      donchianMidRef.current = chart.addSeries(LineSeries, { color: indicatorSettings.donchianChannels.color, lineWidth: 1, lineStyle: 2 });
      donchianLowerRef.current = chart.addSeries(LineSeries, { color: indicatorSettings.donchianChannels.color, lineWidth: 1, title: 'Donchian Alt' });
    }

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].target) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        markersPluginRef.current = null;
      }
    };
  }, [indicatorSettings]);

  // Feed Data & Render All Indicators
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || safeCandles.length === 0) return;

    // 1. Candles
    const formattedCandles: CandlestickData<Time>[] = safeCandles.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current.setData(formattedCandles);

    // 2. Volume
    if (volumeSeriesRef.current && indicatorSettings.volume.enabled) {
      const volData: HistogramData<Time>[] = safeCandles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(14, 203, 129, 0.25)' : 'rgba(246, 70, 93, 0.25)',
      }));
      volumeSeriesRef.current.setData(volData);
    }

    // Helper to feed line data
    const setLineData = (series: ISeriesApi<any> | null, values: (number | null)[]) => {
      if (!series || !values || values.length === 0) return;
      const data: LineData<Time>[] = [];
      for (let i = 0; i < safeCandles.length; i++) {
        if (values[i] !== null && values[i] !== undefined) {
          data.push({ time: safeCandles[i].time as Time, value: values[i]! });
        }
      }
      series.setData(data);
    };

    // 3. SMA
    if (smaSeriesRef.current && indicatorSettings.sma.enabled) {
      setLineData(smaSeriesRef.current, IndicatorEngine.calculateSMA(safeCandles, indicatorSettings.sma.period));
    }

    // 4. EMAs
    if (ema20SeriesRef.current && indicatorSettings.ema20.enabled) {
      setLineData(ema20SeriesRef.current, IndicatorEngine.calculateEMA(safeCandles, indicatorSettings.ema20.period));
    }
    if (ema50SeriesRef.current && indicatorSettings.ema50.enabled) {
      setLineData(ema50SeriesRef.current, IndicatorEngine.calculateEMA(safeCandles, indicatorSettings.ema50.period));
    }
    if (ema200SeriesRef.current && indicatorSettings.ema200.enabled) {
      setLineData(ema200SeriesRef.current, IndicatorEngine.calculateEMA(safeCandles, indicatorSettings.ema200.period));
    }

    // 5. HMA
    if (hmaSeriesRef.current && indicatorSettings.hma.enabled) {
      setLineData(hmaSeriesRef.current, IndicatorEngine.calculateHMA(safeCandles, indicatorSettings.hma.period));
    }

    // 6. SuperTrend
    if (supertrendSeriesRef.current && indicatorSettings.supertrend.enabled) {
      const st = IndicatorEngine.calculateSuperTrend(safeCandles, indicatorSettings.supertrend.period, indicatorSettings.supertrend.multiplier);
      setLineData(supertrendSeriesRef.current, st.supertrend);
    }

    // 7. Parabolic SAR
    if (parabolicSarSeriesRef.current && indicatorSettings.parabolicSar.enabled) {
      setLineData(parabolicSarSeriesRef.current, IndicatorEngine.calculateParabolicSAR(safeCandles, indicatorSettings.parabolicSar.step, indicatorSettings.parabolicSar.maxStep));
    }

    // 8. VWAP
    if (vwapSeriesRef.current && indicatorSettings.vwap.enabled) {
      setLineData(vwapSeriesRef.current, IndicatorEngine.calculateVWAP(safeCandles));
    }

    // 9. Ichimoku
    if (indicatorSettings.ichimoku.enabled) {
      const ichi = IndicatorEngine.calculateIchimoku(safeCandles, indicatorSettings.ichimoku.conversion, indicatorSettings.ichimoku.base, indicatorSettings.ichimoku.spanB);
      setLineData(ichimokuTenkanRef.current, ichi.tenkanSen);
      setLineData(ichimokuKijunRef.current, ichi.kijunSen);
      setLineData(ichimokuSpanARef.current, ichi.senkouSpanA);
      setLineData(ichimokuSpanBRef.current, ichi.senkouSpanB);
    }

    // 10. Bollinger Bands
    if (indicatorSettings.bollingerBands.enabled && bbUpperSeriesRef.current && bbMidSeriesRef.current && bbLowerSeriesRef.current) {
      const bb = IndicatorEngine.calculateBollingerBands(safeCandles, indicatorSettings.bollingerBands.period, indicatorSettings.bollingerBands.stdDev);
      setLineData(bbUpperSeriesRef.current, bb.upper);
      setLineData(bbMidSeriesRef.current, bb.middle);
      setLineData(bbLowerSeriesRef.current, bb.lower);
    }

    // 11. Keltner Channels
    if (indicatorSettings.keltnerChannels.enabled && keltnerUpperRef.current && keltnerMidRef.current && keltnerLowerRef.current) {
      const kc = IndicatorEngine.calculateKeltnerChannels(safeCandles, indicatorSettings.keltnerChannels.emaPeriod, indicatorSettings.keltnerChannels.atrPeriod, indicatorSettings.keltnerChannels.multiplier);
      setLineData(keltnerUpperRef.current, kc.upper);
      setLineData(keltnerMidRef.current, kc.middle);
      setLineData(keltnerLowerRef.current, kc.lower);
    }

    // 12. Donchian Channels
    if (indicatorSettings.donchianChannels.enabled && donchianUpperRef.current && donchianMidRef.current && donchianLowerRef.current) {
      const dc = IndicatorEngine.calculateDonchianChannels(safeCandles, indicatorSettings.donchianChannels.period);
      setLineData(donchianUpperRef.current, dc.upper);
      setLineData(donchianMidRef.current, dc.middle);
      setLineData(donchianLowerRef.current, dc.lower);
    }

    // Strategy Execution Markers
    const markers: SeriesMarker<Time>[] = [];
    (strategySignals || []).forEach((sig) => {
      if (sig.action === 'BUY') {
        markers.push({
          time: Math.floor(sig.timestamp / 1000) as Time,
          position: 'belowBar',
          color: '#0ecb81',
          shape: 'arrowUp',
          text: `AL: %${sig.confidence}`,
        });
      } else if (sig.action === 'SELL') {
        markers.push({
          time: Math.floor(sig.timestamp / 1000) as Time,
          position: 'aboveBar',
          color: '#f6465d',
          shape: 'arrowDown',
          text: `SAT: %${sig.confidence}`,
        });
      }
    });

    if (candleSeriesRef.current) {
      if (!markersPluginRef.current) {
        markersPluginRef.current = createSeriesMarkers(candleSeriesRef.current, markers);
      } else {
        markersPluginRef.current.setMarkers(markers);
      }
    }
  }, [safeCandles, indicatorSettings, strategySignals]);

  // Support & Resistance Price Lines on Chart
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    srPriceLinesRef.current.forEach((line) => {
      try {
        candleSeriesRef.current?.removePriceLine(line);
      } catch (e) {
        // ignore
      }
    });
    srPriceLinesRef.current = [];

    if (indicatorSettings?.autoSupportResistance?.enabled && srZones.length > 0) {
      srZones.forEach((zone) => {
        const isSupport = zone.type === 'SUPPORT';
        const line = candleSeriesRef.current?.createPriceLine({
          price: zone.price,
          color: isSupport ? '#10b981' : '#ef4444',
          lineWidth: zone.strengthScore > 70 ? 2 : 1,
          lineStyle: zone.strengthScore > 80 ? 0 : 2,
          axisLabelVisible: true,
          title: `${isSupport ? 'DESTEK' : 'DİRENÇ'} (%${zone.strengthScore})`,
        });
        if (line) srPriceLinesRef.current.push(line);
      });
    }

    // Fibonacci Pivot Points
    if (indicatorSettings?.autoSupportResistance?.enabled && indicatorSettings.autoSupportResistance.showPivotPoints && safeCandles.length > 0) {
      const pivots = IndicatorEngine.calculatePivotPoints(safeCandles);
      const pLine = candleSeriesRef.current?.createPriceLine({
        price: pivots.pivot,
        color: '#f59e0b',
        lineWidth: 1,
        lineStyle: 1,
        title: 'FIB PIVOT (P)',
      });
      if (pLine) srPriceLinesRef.current.push(pLine);
    }
  }, [srZones, indicatorSettings?.autoSupportResistance, safeCandles]);

  // Active Alert Price Lines on Chart Surface
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    alertPriceLinesRef.current.forEach((line) => {
      try {
        candleSeriesRef.current?.removePriceLine(line);
      } catch (e) {
        // ignore
      }
    });
    alertPriceLinesRef.current = [];

    activeSymbolAlerts.forEach((al) => {
      const line = candleSeriesRef.current?.createPriceLine({
        price: al.targetValue,
        color: '#f59e0b',
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `🔔 ALARM: $${al.targetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`,
      });
      if (line) alertPriceLinesRef.current.push(line);
    });
  }, [activeSymbolAlerts, symbol]);

  // Live WebSocket Candle Tick Updates
  useEffect(() => {
    if (!liveCandle || !candleSeriesRef.current) return;

    candleSeriesRef.current.update({
      time: liveCandle.time as Time,
      open: liveCandle.open,
      high: liveCandle.high,
      low: liveCandle.low,
      close: liveCandle.close,
    });
  }, [liveCandle]);

  // Chart Container Mouse Trackers for Price Coordinate
  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = chartContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;

    if (candleSeriesRef.current) {
      const price = candleSeriesRef.current.coordinateToPrice(y);
      if (price && price > 0) {
        setCursorPrice(Number(price.toFixed(4)));
        setCursorY(y);
        setCursorX(x);
        setIsHoveringChart(true);
      }
    }
  };

  const handleContainerMouseLeave = () => {
    setIsHoveringChart(false);
    setCursorPrice(null);
    setCursorY(null);
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'alert' || isAlertMode) {
      const rect = chartContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const y = e.clientY - rect.top;
      const price = candleSeriesRef.current?.coordinateToPrice(y);
      if (price && price > 0) {
        setSelectedAlertPrice(Number(price.toFixed(4)));
        setIsAlertModalOpen(true);
        setIsAlertMode(false);
        setActiveTool('cursor');
      }
    }
  };

  const handleCreateAlertFromMarker = (priceToUse: number) => {
    setSelectedAlertPrice(priceToUse);
    setIsAlertModalOpen(true);
  };

  const handleSaveAlert = (newAlert: AlertItem) => {
    if (onAddAlert) {
      onAddAlert(newAlert);
      setToastMessage(`🔔 ${newAlert.symbol} için $${newAlert.targetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} alarmı kuruldu!`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  // Drawing Canvas Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'alert' || isAlertMode) {
      handleContainerClick(e as unknown as React.MouseEvent<HTMLDivElement>);
      return;
    }
    if (activeTool === 'cursor') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentDrawingPoints([{ x, y }]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'cursor') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentDrawingPoints((prev) => [prev[0], { x, y }]);
    redrawCanvas();
  };

  const handleMouseUp = () => {
    if (!isDrawing || activeTool === 'cursor') return;
    if (currentDrawingPoints.length >= 2) {
      setDrawings((prev) => [
        ...prev,
        {
          id: `draw-${Date.now()}`,
          type: activeTool,
          points: currentDrawingPoints,
        },
      ]);
    }
    setIsDrawing(false);
    setCurrentDrawingPoints([]);
    setActiveTool('cursor');
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawings.forEach((d) => {
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 2;

      if (d.type === 'trendline' && d.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(d.points[0].x, d.points[0].y);
        ctx.lineTo(d.points[1].x, d.points[1].y);
        ctx.stroke();
      } else if (d.type === 'horizontal' && d.points.length >= 1) {
        ctx.beginPath();
        ctx.moveTo(0, d.points[0].y);
        ctx.lineTo(canvas.width, d.points[0].y);
        ctx.stroke();
      } else if (d.type === 'rectangle' && d.points.length >= 2) {
        const x = Math.min(d.points[0].x, d.points[1].x);
        const y = Math.min(d.points[0].y, d.points[1].y);
        const w = Math.abs(d.points[1].x - d.points[0].x);
        const h = Math.abs(d.points[1].y - d.points[0].y);
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
      }
    });

    if (currentDrawingPoints.length >= 2) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(currentDrawingPoints[0].x, currentDrawingPoints[0].y);
      ctx.lineTo(currentDrawingPoints[1].x, currentDrawingPoints[1].y);
      ctx.stroke();
    }
  };

  useEffect(() => {
    redrawCanvas();
  }, [drawings]);

  return (
    <div className={`flex flex-col bg-[#181a20] border border-[#2b313a] rounded-xs overflow-hidden ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full h-full min-h-[400px] sm:min-h-[480px] lg:min-h-[520px] 2xl:min-h-[660px]'
    }`}>
      {/* Top Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-2.5 sm:px-3 py-1.5 bg-[#14151a] border-b border-[#2b313a] gap-1.5 sm:gap-2 select-none">
        {/* Symbol & Timeframe Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-[#eaecef] text-xs sm:text-sm tracking-wide font-mono">{symbol}</span>
            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-xs bg-[#0ecb81]/15 text-[#0ecb81] font-mono font-semibold border border-[#0ecb81]/30">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-[#2b313a]" />

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-0.5 bg-[#181a20] p-0.5 rounded-xs border border-[#2b313a] overflow-x-auto no-scrollbar">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-xs transition-all whitespace-nowrap ${
                  timeframe === tf
                    ? 'bg-[#2b313a] text-[#fcd535] font-bold shadow-xs'
                    : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b313a]/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Quick Range / 5Y Zoom Buttons */}
          <div className="hidden 2xl:flex items-center gap-0.5 bg-[#181a20] p-0.5 rounded-xs border border-[#2b313a]">
            {(['24S', '7G', '30G', '90G', '1Y', '5Y', 'TÜMÜ'] as const).map((rng) => (
              <button
                key={rng}
                onClick={() => {
                  setActiveRange(rng === 'TÜMÜ' ? 'ALL' : rng);
                  if (rng === '5Y' || rng === 'TÜMÜ') {
                    handleQuickLoad5Year('1d');
                  } else if (rng === '1Y') {
                    onTimeframeChange('1d');
                  } else if (rng === '90G' || rng === '30G') {
                    onTimeframeChange('4h');
                  } else if (rng === '7G') {
                    onTimeframeChange('1h');
                  } else if (rng === '24S') {
                    onTimeframeChange('15m');
                  }
                }}
                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-xs transition-all ${
                  activeRange === (rng === 'TÜMÜ' ? 'ALL' : rng)
                    ? 'bg-[#2b313a] text-[#fcd535] font-bold shadow-xs'
                    : 'text-[#848e9c] hover:text-[#eaecef]'
                }`}
              >
                {rng}
              </button>
            ))}
          </div>
        </div>

        {/* Right Toolbar (Drawings, Indicators, Alerts, Fullscreen) */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="hidden sm:block">
            <DrawingToolbar
              activeTool={activeTool}
              onSelectTool={(tool) => {
                setActiveTool(tool);
                if (tool === 'alert') {
                  setIsAlertMode(true);
                } else {
                  setIsAlertMode(false);
                }
              }}
              onClearDrawings={() => setDrawings([])}
              drawingCount={drawings.length}
            />
          </div>

          {/* Dedicated 'Set Alert' Mode Toolbar Button */}
          <div className="relative">
            <button
              onClick={() => {
                const nextState = !isAlertMode;
                setIsAlertMode(nextState);
                setActiveTool(nextState ? 'alert' : 'cursor');
              }}
              title="Grafik üzerinden fiyata tıklayarak alarm kur (Set Alert)"
              className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-xs text-xs font-semibold border transition-all ${
                isAlertMode
                  ? 'bg-[#fcd535] text-[#181a20] border-[#fcd535] font-bold shadow-md animate-pulse'
                  : 'bg-[#1e2329] hover:bg-[#2b313a] text-[#eaecef] border-[#2b313a]'
              }`}
            >
              <BellRing className={`w-3.5 h-3.5 shrink-0 ${isAlertMode ? 'text-[#181a20]' : 'text-[#fcd535]'}`} />
              <span className="hidden sm:inline">Alarm Kur</span>
              <span className="sm:hidden text-[11px]">Alarm</span>
              {activeSymbolAlerts.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#f6465d] text-white font-mono font-bold">
                  {activeSymbolAlerts.length}
                </span>
              )}
            </button>

            {/* Quick Active Alerts Dropdown Button if alerts exist */}
            {activeSymbolAlerts.length > 0 && (
              <button
                onClick={() => setIsAlertListOpen(!isAlertListOpen)}
                title="Aktif alarmları göster"
                className="hidden lg:inline-flex ml-1 p-1 rounded-xs bg-[#1e2329] hover:bg-[#2b313a] text-[#fcd535] border border-[#2b313a] text-[10px] font-mono"
              >
                Liste
              </button>
            )}

            {/* Active Alerts List Popover */}
            {isAlertListOpen && activeSymbolAlerts.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-64 z-50 bg-[#1e2329] border border-[#2b313a] rounded-lg shadow-2xl p-2 space-y-1.5 animate-scale-in">
                <div className="flex items-center justify-between pb-1 border-b border-[#2b313a] text-[11px] font-semibold text-[#848e9c]">
                  <span>{symbol} Aktif Alarmları ({activeSymbolAlerts.length})</span>
                  <button onClick={() => setIsAlertListOpen(false)} className="text-[#848e9c] hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {activeSymbolAlerts.map((al) => (
                    <div key={al.id} className="flex items-center justify-between p-1.5 rounded bg-[#181a20] border border-[#2b313a] text-xs">
                      <div>
                        <div className="font-mono font-bold text-[#fcd535]">
                          ${al.targetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </div>
                        <div className="text-[10px] text-[#848e9c] truncate max-w-[150px]">{al.message}</div>
                      </div>
                      {onDeleteAlert && (
                        <button
                          onClick={() => onDeleteAlert(al.id)}
                          className="p-1 text-[#848e9c] hover:text-[#f6465d] hover:bg-[#f6465d]/10 rounded transition-colors"
                          title="Alarmı Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5-Year Historical Data Action Button */}
          <button
            onClick={() => setIsFiveYearModalOpen(true)}
            title="5 Yıllık Geçmiş Piyasa Verilerini İncele ve İndir (2021-2026)"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-xs text-xs font-semibold border transition-all ${
              isLoading5Year
                ? 'bg-[#fcd535]/20 text-[#fcd535] border-[#fcd535]/40 animate-pulse'
                : safeCandles.length >= 1000
                ? 'bg-[#0ecb81]/15 hover:bg-[#0ecb81]/25 text-[#0ecb81] border-[#0ecb81]/40'
                : 'bg-[#1e2329] hover:bg-[#2b313a] text-[#eaecef] border-[#2b313a]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#fcd535] shrink-0" />
            <span className="hidden sm:inline">5 Yıllık Veri</span>
            <span className="sm:hidden text-[11px]">5Y</span>
            {safeCandles.length >= 1000 ? (
              <span className="text-[10px] px-1 py-0.2 rounded-xs bg-[#0ecb81]/20 text-[#0ecb81] font-mono font-bold">
                {safeCandles.length} Mum
              </span>
            ) : (
              <span className="text-[10px] px-1 py-0.2 rounded-xs bg-[#fcd535]/20 text-[#fcd535] font-mono font-bold">
                {isLoading5Year ? `%${fiveYearProgress}` : 'Çek'}
              </span>
            )}
          </button>

          <button
            onClick={onOpenIndicatorModal}
            className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 rounded-xs bg-[#1e2329] hover:bg-[#2b313a] text-[#eaecef] text-xs font-semibold border border-[#2b313a] transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-[#fcd535] shrink-0" />
            <span className="hidden sm:inline">20 Gösterge</span>
            <span className="sm:hidden text-[11px]">Gösterge</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-[#fcd535]/20 text-[#fcd535] font-mono font-bold">
              {activeOverlayCount}
            </span>
          </button>

          <button
            onClick={() => setShowOscillators(!showOscillators)}
            title={showOscillators ? 'Alt Göstergeleri Gizle' : 'Alt Göstergeleri Göster'}
            className="p-1 sm:p-1.5 rounded-xs text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b313a] transition-colors flex items-center justify-center"
          >
            {showOscillators ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
            className="p-1 sm:p-1.5 rounded-xs text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b313a] transition-colors flex items-center justify-center"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </div>

      {/* Main Chart Canvas Area */}
      <div 
        className="relative flex-1 w-full bg-[#181a20] overflow-hidden"
        onMouseMove={handleContainerMouseMove}
        onMouseLeave={handleContainerMouseLeave}
        onClick={handleContainerClick}
      >
        {/* TradingView Lightweight Charts Container */}
        <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />

        {/* Custom Drawings Overlay Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`absolute inset-0 w-full h-full ${
            activeTool !== 'cursor' ? 'cursor-crosshair z-20 pointer-events-auto' : 'pointer-events-none z-10'
          }`}
        />

        {/* Active Alert Mode Top Guide Banner */}
        {(isAlertMode || activeTool === 'alert') && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fcd535] text-[#181a20] shadow-2xl border border-white/30 text-xs font-bold animate-bounce select-none">
            <BellRing className="w-4 h-4 fill-current text-[#181a20]" />
            <span>Fiyat Alarmı Modu: Alarm kurmak için grafikteki bir fiyat seviyesine tıklayın</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAlertMode(false);
                setActiveTool('cursor');
              }}
              className="ml-2 px-2 py-0.5 rounded bg-[#181a20] text-[#fcd535] hover:bg-black text-[10px] font-bold"
            >
              Vazgeç
            </button>
          </div>
        )}

        {/* Interactive Floating 'Set Alert' Marker Button anchored to the cursor price level */}
        {isHoveringChart && cursorPrice && cursorY !== null && !isDrawing && activeTool === 'cursor' && (
          <div
            className="absolute right-0 z-30 pointer-events-auto flex items-center -translate-y-1/2 pr-1 select-none transition-all duration-75 group"
            style={{ top: `${cursorY}px` }}
          >
            {/* Subtle horizontal dotted guideline across the chart */}
            <div className="hidden sm:block absolute right-full mr-2 w-32 md:w-64 h-px border-b border-dashed border-[#fcd535]/60 pointer-events-none" />

            {/* Visual 'Set Alert' Marker Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateAlertFromMarker(cursorPrice);
              }}
              title={`$${cursorPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} seviyesine hızlı alarm kur`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#fcd535] hover:bg-[#ffe066] text-[#181a20] font-bold text-xs shadow-2xl border border-white/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer animate-fade-in"
            >
              <Bell className="w-3.5 h-3.5 fill-current text-[#181a20]" />
              <span className="font-mono text-[11px] font-bold">
                ${cursorPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
              <span className="text-[10px] bg-[#181a20] text-[#fcd535] px-1.5 py-0.2 rounded font-semibold whitespace-nowrap">
                + Alarm Kur
              </span>
            </button>
          </div>
        )}

        {/* Feedback Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-md bg-[#181a20]/95 border border-[#0ecb81] text-[#0ecb81] text-xs font-semibold shadow-2xl backdrop-blur-xs animate-slide-up">
            <CheckCircle className="w-4 h-4 text-[#0ecb81]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Quick Active Indicators Legend Badges */}
        <div className="absolute top-3 left-4 z-10 flex flex-wrap gap-1.5 pointer-events-none max-w-[85%]">
          {indicatorSettings.ema20.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/85 border border-slate-800 text-cyan-400">
              EMA 20
            </span>
          )}
          {indicatorSettings.ema50.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/85 border border-slate-800 text-amber-400">
              EMA 50
            </span>
          )}
          {indicatorSettings.ema200.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/85 border border-slate-800 text-purple-400">
              EMA 200
            </span>
          )}
          {indicatorSettings.hma.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/85 border border-slate-800 text-emerald-400">
              HMA ({indicatorSettings.hma.period})
            </span>
          )}
          {indicatorSettings.supertrend.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/85 border border-slate-800 text-emerald-300">
              SuperTrend
            </span>
          )}
          {indicatorSettings.bollingerBands.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/85 border border-slate-800 text-blue-400">
              Bollinger (20, 2)
            </span>
          )}
          {indicatorSettings.keltnerChannels.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/85 border border-slate-800 text-cyan-300">
              Keltner (20, 2)
            </span>
          )}
          {indicatorSettings.donchianChannels.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/85 border border-slate-800 text-purple-300">
              Donchian ({indicatorSettings.donchianChannels.period})
            </span>
          )}
          {indicatorSettings.parabolicSar.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/85 border border-slate-800 text-amber-300">
              SAR ({indicatorSettings.parabolicSar.step})
            </span>
          )}
          {indicatorSettings.ichimoku.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/85 border border-slate-800 text-teal-300">
              Ichimoku Cloud
            </span>
          )}
          {indicatorSettings.vwap.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/85 border border-slate-800 text-pink-400">
              VWAP
            </span>
          )}
          {indicatorSettings.autoSupportResistance.enabled && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
              Otomatik S/R ({srZones.length})
            </span>
          )}
        </div>
      </div>

      {/* Sub-Panel: Live Oscillators & Momentum Multi-Bar */}
      {showOscillators && (
        <div className="bg-[#0b0f19] border-t border-slate-800/80 px-3 sm:px-4 py-2 space-y-1.5">
          {/* Active Oscillators Chips & Live Values */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {/* RSI Widget */}
              {indicatorSettings.rsi.enabled && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs whitespace-nowrap">
                  <span className="text-slate-400 font-semibold">RSI ({indicatorSettings.rsi.period}):</span>
                  <span className={`font-mono font-bold ${
                    (indicatorValues.rsi || 50) >= 70 ? 'text-red-400' : (indicatorValues.rsi || 50) <= 30 ? 'text-emerald-400' : 'text-cyan-400'
                  }`}>
                    {indicatorValues.rsi !== undefined ? indicatorValues.rsi.toFixed(1) : '--'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {(indicatorValues.rsi || 50) >= 70 ? '🔥 Aşırı Alım' : (indicatorValues.rsi || 50) <= 30 ? '🧊 Aşırı Satım' : 'Nötr'}
                  </span>
                </div>
              )}

              {/* MACD Widget */}
              {indicatorSettings.macd.enabled && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs whitespace-nowrap">
                  <span className="text-slate-400 font-semibold">MACD:</span>
                  <span className={`font-mono font-bold ${
                    (indicatorValues.macd?.hist || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {indicatorValues.macd?.hist ? indicatorValues.macd.hist.toFixed(2) : '0.00'}
                  </span>
                  <span className="text-[10px] text-slate-500">Hist</span>
                </div>
              )}

              {/* Stochastic Widget */}
              {indicatorSettings.stochastic.enabled && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs whitespace-nowrap">
                  <span className="text-slate-400 font-semibold">Stoch (%K/%D):</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {indicatorValues.stoch?.k ? indicatorValues.stoch.k.toFixed(1) : '--'} / {indicatorValues.stoch?.d ? indicatorValues.stoch.d.toFixed(1) : '--'}
                  </span>
                </div>
              )}

              {/* CCI Widget */}
              {indicatorSettings.cci.enabled && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs whitespace-nowrap">
                  <span className="text-slate-400 font-semibold">CCI ({indicatorSettings.cci.period}):</span>
                  <span className={`font-mono font-bold ${
                    (indicatorValues.cci || 0) >= 100 ? 'text-red-400' : (indicatorValues.cci || 0) <= -100 ? 'text-emerald-400' : 'text-orange-400'
                  }`}>
                    {indicatorValues.cci !== undefined ? indicatorValues.cci.toFixed(1) : '--'}
                  </span>
                </div>
              )}

              {/* ADX Widget */}
              {indicatorSettings.adx.enabled && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs whitespace-nowrap">
                  <span className="text-slate-400 font-semibold">ADX Gücü:</span>
                  <span className={`font-mono font-bold ${
                    (indicatorValues.adx?.value || 0) >= indicatorSettings.adx.threshold ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {indicatorValues.adx?.value ? indicatorValues.adx.value.toFixed(1) : '--'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {(indicatorValues.adx?.value || 0) >= 25 ? '⚡ Güçlü Trend' : 'Yatay'}
                  </span>
                </div>
              )}

              {/* Williams %R Widget */}
              {indicatorSettings.williamsR.enabled && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs whitespace-nowrap">
                  <span className="text-slate-400 font-semibold">Williams %R:</span>
                  <span className="font-mono font-bold text-teal-400">
                    {indicatorValues.wr !== undefined ? indicatorValues.wr.toFixed(1) : '--'}
                  </span>
                </div>
              )}

              {/* MFI Widget */}
              {indicatorSettings.mfi.enabled && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs whitespace-nowrap">
                  <span className="text-slate-400 font-semibold">MFI Para Akışı:</span>
                  <span className="font-mono font-bold text-green-400">
                    {indicatorValues.mfi !== undefined ? indicatorValues.mfi.toFixed(1) : '--'}
                  </span>
                </div>
              )}

              {/* OBV Widget */}
              {indicatorSettings.obv.enabled && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs whitespace-nowrap">
                  <span className="text-slate-400 font-semibold">OBV Denge Hacmi:</span>
                  <span className="font-mono font-bold text-indigo-400">
                    {indicatorValues.obv !== undefined ? indicatorValues.obv.toLocaleString() : '--'}
                  </span>
                </div>
              )}

              {/* ATR Widget */}
              {indicatorSettings.atr.enabled && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs whitespace-nowrap">
                  <span className="text-slate-400 font-semibold">ATR Volatilite:</span>
                  <span className="font-mono font-bold text-amber-400">
                    ${indicatorValues.atr !== undefined ? indicatorValues.atr.toFixed(2) : '--'}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Helper */}
            <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Boğa Bölgesi
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Ayı Bölgesi
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Price Alert Modal */}
      <QuickAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        symbol={symbol}
        currentPrice={currentPrice}
        initialPrice={selectedAlertPrice}
        onSaveAlert={handleSaveAlert}
      />

      {/* 5-Year Historical Market Data Modal */}
      <FiveYearDataModal
        isOpen={isFiveYearModalOpen}
        onClose={() => setIsFiveYearModalOpen(false)}
        symbol={symbol}
        currentCandles={safeCandles}
        onApply5YearData={(candles5y, tf) => {
          if (onApply5YearData) {
            onApply5YearData(candles5y, tf);
          } else if (onTimeframeChange) {
            onTimeframeChange(tf);
          }
          setTimeout(() => {
            try {
              chartRef.current?.timeScale().fitContent();
            } catch {
              // ignore
            }
          }, 200);
          setToastMessage(`✅ ${symbol} için 5 yıllık (${candles5y.length} mum) veri grafiğe uygulandı!`);
          setTimeout(() => setToastMessage(null), 3500);
        }}
      />
    </div>
  );
};
