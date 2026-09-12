import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Server, 
  Table, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Layers, 
  HardDrive, 
  ShieldCheck, 
  Activity, 
  FileText, 
  Terminal,
  Clock,
  Sparkles
} from 'lucide-react';
import { TradeLog } from '../../types/crypto';

interface PostgresDatabasePanelProps {
  currentTrades?: TradeLog[];
  onTradesRestored?: (trades: any[]) => void;
}

interface DbStatus {
  connected: boolean;
  engine: string;
  database: string;
  tables: Record<string, number>;
  lastCheck: string;
  error?: string;
}

export const PostgresDatabasePanel: React.FC<PostgresDatabasePanelProps> = ({
  currentTrades = [],
  onTradesRestored,
}) => {
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('trade_orders');
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  const fetchDbStatus = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/db/status');
      const data = await resp.json();
      setDbStatus(data);
    } catch (err: any) {
      setDbStatus({
        connected: false,
        engine: 'PostgreSQL (Cloud SQL)',
        database: 'postgres',
        tables: { users: 0, trade_orders: 0, strategies: 0, trading_settings: 0, local_ai_configs: 0, agent_logs: 0 },
        lastCheck: new Date().toISOString(),
        error: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTableRows = async (tableName: string) => {
    setIsLoadingTable(true);
    try {
      const resp = await fetch('/api/db/query-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName }),
      });
      const data = await resp.json();
      if (data.success) {
        setTableData(data.rows || []);
      }
    } catch (err) {
      console.error('Error querying table:', err);
    } finally {
      setIsLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchDbStatus();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableRows(selectedTable);
    }
  }, [selectedTable]);

  const handleSyncTrades = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const formattedTrades = currentTrades.map((t) => ({
        symbol: t.symbol,
        side: t.side,
        type: t.exitReason || 'MARKET',
        amount: t.amount,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        pnl: t.pnl,
        pnlPercent: t.pnlPct,
        status: 'CLOSED',
        strategyName: 'Quantitative Bot',
        executedAt: new Date(t.entryTime || Date.now()),
        closedAt: new Date(t.exitTime || Date.now()),
      }));

      const resp = await fetch('/api/db/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUid: 'default-user',
          email: 'trader@kriptobot.pro',
          trades: formattedTrades,
        }),
      });

      const res = await resp.json();
      if (res.success) {
        setSyncMessage({
          type: 'success',
          text: `Toplam ${res.count || currentTrades.length} işlem kaydı PostgreSQL 'trade_orders' tablosuna başarıyla aktarıldı!`,
        });
        fetchDbStatus();
        fetchTableRows(selectedTable);
      } else {
        setSyncMessage({ type: 'error', text: res.error || 'İşlemler veritabanına aktarılamadı' });
      }
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: err.message || 'Senkronizasyon hatası' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreTrades = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const resp = await fetch('/api/db/trades?userUid=default-user');
      const data = await resp.json();
      if (data.success && data.trades) {
        if (onTradesRestored) {
          onTradesRestored(data.trades);
        }
        setSyncMessage({
          type: 'success',
          text: `PostgreSQL üzerinden ${data.trades.length} adet geçmiş işlem geri yüklendi.`,
        });
      }
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: err.message || 'Geri yükleme hatası' });
    } finally {
      setIsSyncing(false);
    }
  };

  const tableList = [
    { name: 'trade_orders', label: 'İşlem Kayıtları (Trade Orders)', icon: FileText, desc: 'Tüm emirler, giriş/çıkış fiyatları ve PnL verileri' },
    { name: 'strategies', label: 'Strateji Parametreleri', icon: Layers, desc: 'Kaydedilen otonom ve kantitatif bot kuralları' },
    { name: 'trading_settings', label: 'Borsa & Sistem Ayarları', icon: Server, desc: 'API anahtarları, risk limitleri ve bildirim ayarları' },
    { name: 'users', label: 'Kullanıcı Hesapları (Users)', icon: ShieldCheck, desc: 'Firebase Auth ile eşleşen kullanıcı kayıtları' },
    { name: 'local_ai_configs', label: 'Yerel AI Modelleri & Ajanlar', icon: Sparkles, desc: 'Ollama, Nous Hermes, LM Studio bağlantıları' },
    { name: 'agent_logs', label: 'Ajan Günlükleri (Agent Logs)', icon: Terminal, desc: 'Otonom yapay zeka analiz ve aksiyon kayıtları' },
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner: Status and Quick Info */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">PostgreSQL Cloud SQL Veritabanı</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                  dbStatus?.connected 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}>
                  {dbStatus?.connected ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {dbStatus?.connected ? 'BAĞLI (LIVE)' : 'BAĞLANTI BEKLENİYOR'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Google Cloud SQL üzerinde barındırılan PostgreSQL 16 ilişkisel veritabanı. Drizzle ORM ile tip güvenli kalıcı depolama.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchDbStatus}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Bağlantıyı Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">Veritabanı Motoru:</span>
            <span className="text-xs font-mono font-bold text-slate-200">{dbStatus?.engine || 'PostgreSQL 16'}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">Aktif Veritabanı:</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{dbStatus?.database || 'postgres'}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">Bağlantı Türü:</span>
            <span className="text-xs font-mono font-bold text-emerald-400">Cloud SQL Auth Proxy</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-500 block">Son Kontrol:</span>
            <span className="text-xs font-mono text-slate-300">
              {dbStatus?.lastCheck ? new Date(dbStatus.lastCheck).toLocaleTimeString() : '---'}
            </span>
          </div>
        </div>
      </div>

      {/* Sync & Backup Actions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Veri Senkronizasyonu & Yedekleme</h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Mevcut Bellek İşlemleri: <strong className="text-white">{currentTrades.length}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleSyncTrades}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 border border-blue-500/30 text-cyan-300 text-xs font-bold transition shadow-xs"
          >
            <ArrowUpCircle className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span>Tüm İşlemleri PostgreSQL'e Aktar (Sync)</span>
          </button>

          <button
            type="button"
            onClick={handleRestoreTrades}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-bold transition"
          >
            <ArrowDownCircle className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL'den Verileri Geri Yükle (Fetch)</span>
          </button>
        </div>

        {syncMessage && (
          <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            syncMessage.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/10 border border-red-500/30 text-red-300'
          }`}>
            {syncMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span>{syncMessage.text}</span>
          </div>
        )}
      </div>

      {/* Database Schema & Tables Explorer */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Veritabanı Tabloları & Kayıt Gezgini</h4>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Drizzle ORM Schema</span>
        </div>

        {/* Table Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {tableList.map((t) => {
            const isSelected = selectedTable === t.name;
            const count = dbStatus?.tables?.[t.name] ?? 0;
            const Icon = t.icon;

            return (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTable(t.name)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-purple-500/10 border-purple-500 text-purple-300 shadow-md'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.name}</span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                    {count} satır
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 truncate">{t.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Selected Table Data Preview */}
        <div className="bg-slate-950/80 rounded-xl border border-slate-800/90 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-purple-400 font-bold">TABLO:</span>
              <span className="text-white font-bold">{selectedTable}</span>
              <span className="text-slate-500">({tableData.length} kayıt listeleniyor)</span>
            </div>
            <button
              type="button"
              onClick={() => fetchTableRows(selectedTable)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingTable ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>
          </div>

          <div className="p-3 max-h-64 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-2">
            {isLoadingTable ? (
              <div className="text-center py-6 text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Kayıtlar sorgulanıyor...</span>
              </div>
            ) : tableData.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                Bu tabloda henüz kayıt bulunmuyor. Senkronize et butonunu kullanarak bellek verilerini aktarabilirsiniz.
              </div>
            ) : (
              <div className="space-y-2">
                {tableData.map((row, idx) => (
                  <div key={idx} className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-slate-800/50 pb-1">
                      <span>Kayıt #{row.id || idx + 1}</span>
                      <span>{row.created_at || row.executed_at || row.updated_at || 'Şimdi'}</span>
                    </div>
                    <pre className="text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(row, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
