import React, { useState, useEffect } from 'react';
import { 
  LocalAIProviderConfig, 
  LocalAIProviderType, 
  LocalAIAgentRole, 
  LocalAIChatMessage, 
  LocalAIChatResponse, 
  LocalAIAgentAction 
} from '../../types/localAI';
import { LocalAIService } from '../../services/localAIService';
import { 
  BrainCircuit, 
  Cpu, 
  Server, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Play, 
  Send, 
  Plus, 
  Trash2, 
  Settings2, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Bot, 
  Sliders, 
  Radio, 
  Check, 
  AlertCircle,
  Clock,
  Layers,
  Flame,
  Globe
} from 'lucide-react';

interface LocalAIIntegrationPanelProps {
  currentSymbol?: string;
  onStrategyGenerated?: (strategyParams: any) => void;
}

export const LocalAIIntegrationPanel: React.FC<LocalAIIntegrationPanelProps> = ({
  currentSymbol = 'BTCUSDT',
  onStrategyGenerated,
}) => {
  const [providers, setProviders] = useState<LocalAIProviderConfig[]>(() => LocalAIService.getProviders());
  const [activeProviderId, setActiveProviderId] = useState<string>(() => LocalAIService.getActiveProviderId());
  
  // Playground state
  const [promptInput, setPromptInput] = useState<string>(
    `${currentSymbol} paritesinde 5 yıllık grafiğe göre maksimum kasa büyütme sağlayacak otonom bir al-sat stratejisi mantığını analiz et.`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatResponse, setChatResponse] = useState<LocalAIChatResponse | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  // Agent Actions Log
  const [agentActions, setAgentActions] = useState<LocalAIAgentAction[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  // Testing status per provider
  const [testingMap, setTestingMap] = useState<Record<string, boolean>>({});

  // Active Provider
  const activeProvider = providers.find((p) => p.id === activeProviderId) || providers[0];

  useEffect(() => {
    LocalAIService.saveProviders(providers);
  }, [providers]);

  useEffect(() => {
    LocalAIService.setActiveProviderId(activeProviderId);
  }, [activeProviderId]);

  // Ping test for a single provider
  const handlePingProvider = async (provider: LocalAIProviderConfig) => {
    setTestingMap((prev) => ({ ...prev, [provider.id]: true }));

    const res = await LocalAIService.pingProvider(provider);
    const safeModels = res?.models || [];

    setProviders((prev) =>
      prev.map((p) => {
        if (p.id === provider.id) {
          return {
            ...p,
            status: res.connected ? 'CONNECTED' : 'DISCONNECTED',
            latencyMs: res.latencyMs,
            lastPingTimestamp: Date.now(),
            availableModels: safeModels.length > 0 ? safeModels : p.availableModels || [],
            selectedModel: safeModels.includes(p.selectedModel)
              ? p.selectedModel
              : safeModels[0] || p.selectedModel,
            errorMessage: res.error,
          };
        }
        return p;
      })
    );

    setTestingMap((prev) => ({ ...prev, [provider.id]: false }));
  };

  // Ping all providers on initial load or manual refresh
  const handlePingAll = async () => {
    providers.forEach((p) => handlePingProvider(p));
  };

  // Update provider field
  const handleUpdateProvider = (id: string, updates: Partial<LocalAIProviderConfig>) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  // Add new provider from preset template
  const handleAddTemplate = (type: LocalAIProviderType) => {
    const id = `${type}-${Date.now()}`;
    let newConfig: LocalAIProviderConfig;

    switch (type) {
      case 'ollama':
        newConfig = {
          id,
          name: 'Ollama Yerel LLM',
          type: 'ollama',
          endpointUrl: 'http://localhost:11434',
          selectedModel: 'deepseek-r1:8b',
          availableModels: ['deepseek-r1:8b', 'llama3.3:70b', 'qwen2.5:32b', 'mistral:latest'],
          agentRole: 'STRATEGY_GENERATOR',
          temperature: 0.4,
          maxTokens: 2048,
          contextWindow: 8192,
          enabled: true,
          status: 'DISCONNECTED',
          latencyMs: null,
          lastPingTimestamp: null,
        };
        break;
      case 'hermes_agent':
        newConfig = {
          id,
          name: 'Nous Hermes 3 AI Agent',
          type: 'hermes_agent',
          endpointUrl: 'http://localhost:8000/v1',
          selectedModel: 'hermes-3-llama-3.1-8b',
          availableModels: ['hermes-3-llama-3.1-8b', 'hermes-3-llama-3.1-70b', 'nous-hermes-2-pro'],
          agentRole: 'AUTONOMOUS_EXECUTION',
          temperature: 0.2,
          maxTokens: 2500,
          contextWindow: 16384,
          systemPrompt: 'You are Hermes, an autonomous quant trading agent with advanced reasoning and tool use capabilities.',
          enabled: true,
          status: 'DISCONNECTED',
          latencyMs: null,
          lastPingTimestamp: null,
        };
        break;
      case 'aponclaw_agent':
        newConfig = {
          id,
          name: 'AponClaw / OpenClaw Autonomous Agent',
          type: 'aponclaw_agent',
          endpointUrl: 'http://localhost:9000/api',
          selectedModel: 'aponclaw-quant-v1',
          availableModels: ['aponclaw-quant-v1', 'aponclaw-risk-sentinel', 'openclaw-swarm-core'],
          agentRole: 'MARKET_ANALYST',
          temperature: 0.3,
          maxTokens: 3000,
          contextWindow: 32768,
          systemPrompt: 'AponClaw otonom ajan motoru. Piyasa rejim değişimlerini ve risk faktörlerini analiz eder.',
          enabled: true,
          status: 'DISCONNECTED',
          latencyMs: null,
          lastPingTimestamp: null,
        };
        break;
      case 'lm_studio':
        newConfig = {
          id,
          name: 'LM Studio Yerel Sunucu',
          type: 'lm_studio',
          endpointUrl: 'http://localhost:1234/v1',
          selectedModel: 'local-model',
          availableModels: ['local-model', 'meta-llama-3.1-8b-instruct'],
          agentRole: 'STRATEGY_GENERATOR',
          temperature: 0.5,
          maxTokens: 2048,
          contextWindow: 4096,
          enabled: true,
          status: 'DISCONNECTED',
          latencyMs: null,
          lastPingTimestamp: null,
        };
        break;
      case 'vllm':
      default:
        newConfig = {
          id,
          name: 'vLLM / LocalAI High-Throughput',
          type: 'vllm',
          endpointUrl: 'http://localhost:8000/v1',
          selectedModel: 'meta-llama/Llama-3.3-70B-Instruct',
          availableModels: ['meta-llama/Llama-3.3-70B-Instruct', 'Qwen/Qwen2.5-72B-Instruct'],
          agentRole: 'STRATEGY_GENERATOR',
          temperature: 0.3,
          maxTokens: 4096,
          contextWindow: 32768,
          enabled: true,
          status: 'DISCONNECTED',
          latencyMs: null,
          lastPingTimestamp: null,
        };
        break;
    }

    setProviders((prev) => [...prev, newConfig]);
    setActiveProviderId(id);
    handlePingProvider(newConfig);
  };

  const handleDeleteProvider = (id: string) => {
    if (providers.length <= 1) return;
    const remaining = providers.filter((p) => p.id !== id);
    setProviders(remaining);
    if (activeProviderId === id) {
      setActiveProviderId(remaining[0].id);
    }
  };

  // Run test prompt in Playground
  const handleSendPrompt = async () => {
    if (!promptInput.trim() || !activeProvider) return;
    setIsGenerating(true);
    setChatError(null);
    setChatResponse(null);

    try {
      const messages: LocalAIChatMessage[] = [
        {
          role: 'system',
          content: activeProvider.systemPrompt || 'Sen uzman bir kantitatif kripto ticaret analistisin.',
        },
        {
          role: 'user',
          content: promptInput,
        },
      ];

      const res = await LocalAIService.executeChat(activeProvider, messages);
      setChatResponse(res);
    } catch (err: any) {
      setChatError(err.message || 'Yerel AI çağrısı sırasında hata oluştu');
    } finally {
      setIsGenerating(false);
    }
  };

  // Dispatch an Autonomous Agent Action
  const handleDispatchAgentAction = async (taskType: 'GENERATE_STRATEGY' | 'MARKET_SCAN' | 'RISK_ALERT') => {
    if (!activeProvider) return;
    setIsAgentRunning(true);

    try {
      const action = await LocalAIService.dispatchAgentTask(
        activeProvider,
        taskType,
        currentSymbol,
        '1d',
        {
          symbol: currentSymbol,
          strategyGoal: 'MAKSİMUM KASA BÜYÜTMESİ',
          timestamp: Date.now(),
        }
      );

      setAgentActions((prev) => [action, ...prev]);

      if (taskType === 'GENERATE_STRATEGY' && onStrategyGenerated) {
        onStrategyGenerated(action.outputPayload);
      }
    } catch (e) {
      console.error('Agent action failed:', e);
    } finally {
      setIsAgentRunning(false);
    }
  };

  const connectedCount = providers.filter((p) => p.status === 'CONNECTED').length;

  return (
    <div className="w-full space-y-5 animate-fade-in text-slate-100">
      
      {/* 1. Header & System Status Bar */}
      <div className="bg-[#0e1422] border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Yerel Dil Modelleri (Local LLM) & AI Agent Entegrasyon Merkezi
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Ollama • Nous Hermes • AponClaw • LM Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Kendi bilgisayarınızda (GPU/CPU) çalışan yerel yapay zeka modellerini ve otonom trading ajanlarını kripto al-sat botuna doğrudan bağlayın.
            </p>
          </div>
        </div>

        {/* Global Stats & Ping All */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${connectedCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-slate-400">Bağlı Yerel Motor:</span>
            <strong className={connectedCount > 0 ? 'text-emerald-400' : 'text-slate-400'}>
              {connectedCount} / {providers.length}
            </strong>
          </div>

          <button
            onClick={handlePingAll}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5 transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tümünü Test Et</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Connect Preset Cards (Tek Tıkla Ekleyin) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hızlı Şablonlar & Popüler Yerel Ajanlar</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Template: Ollama */}
          <div
            onClick={() => handleAddTemplate('ollama')}
            className="group cursor-pointer bg-[#101726] hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 p-3 rounded-xl transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition flex items-center gap-1.5">
                🦙 Ollama LLM
              </span>
              <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-2">
              DeepSeek R1, Llama 3.3, Qwen 2.5 (Port 11434)
            </p>
          </div>

          {/* Template: Nous Hermes Agent */}
          <div
            onClick={() => handleAddTemplate('hermes_agent')}
            className="group cursor-pointer bg-[#101726] hover:bg-slate-900 border border-slate-800 hover:border-purple-500/60 p-3 rounded-xl transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white group-hover:text-purple-400 transition flex items-center gap-1.5">
                🔮 Nous Hermes 3
              </span>
              <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-2">
              Ajanik Akıl Yürütme & Fonksiyon Çağrısı (Port 8000)
            </p>
          </div>

          {/* Template: AponClaw / OpenClaw */}
          <div
            onClick={() => handleAddTemplate('aponclaw_agent')}
            className="group cursor-pointer bg-[#101726] hover:bg-slate-900 border border-slate-800 hover:border-amber-500/60 p-3 rounded-xl transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white group-hover:text-amber-400 transition flex items-center gap-1.5">
                🦅 AponClaw Agent
              </span>
              <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-2">
              Otonom Piyasa Tarama & Strateji Ajanı (Port 9000)
            </p>
          </div>

          {/* Template: LM Studio */}
          <div
            onClick={() => handleAddTemplate('lm_studio')}
            className="group cursor-pointer bg-[#101726] hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 p-3 rounded-xl transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition flex items-center gap-1.5">
                🧪 LM Studio
              </span>
              <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-2">
              Yerel OpenAI Uyumlu Sunucu (Port 1234)
            </p>
          </div>

          {/* Template: vLLM */}
          <div
            onClick={() => handleAddTemplate('vllm')}
            className="group cursor-pointer bg-[#101726] hover:bg-slate-900 border border-slate-800 hover:border-blue-500/60 p-3 rounded-xl transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white group-hover:text-blue-400 transition flex items-center gap-1.5">
                ⚡ vLLM / LocalAI
              </span>
              <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
            </div>
            <p className="text-[10px] text-slate-400 line-clamp-2">
              Yüksek Hızlı Tensor Paralel Çıkarım (Port 8000)
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Provider Cards on Left, Interactive Playground / Agent Terminal on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Registered Local Engines & Agents (6 cols on lg, 7 on xl) */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Kayıtlı Yerel Modeller & Ajanlar</span>
            </h3>
            <span className="text-xs text-slate-400">
              Aktif Motor: <strong className="text-cyan-300">{activeProvider?.name}</strong>
            </span>
          </div>

          <div className="space-y-3">
            {providers.map((prov) => {
              const isSelected = prov.id === activeProviderId;
              const isTesting = testingMap[prov.id];
              const isConnected = prov.status === 'CONNECTED';

              return (
                <div
                  key={prov.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'bg-[#101726] border-cyan-500/70 shadow-lg shadow-cyan-500/10'
                      : 'bg-[#0b101c] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Provider Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setActiveProviderId(prov.id)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500 text-slate-950 font-bold'
                            : 'border-slate-600 hover:border-slate-400'
                        }`}
                        title="Bu motoru varsayılan aktif model yap"
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div>
                        <span className="text-xs font-bold text-white block">
                          {prov.name}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          {prov.type} • {prov.agentRole}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge & Latency */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 border ${
                          isConnected
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : prov.status === 'ERROR'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {isConnected ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Bağlandı ({prov.latencyMs}ms)</span>
                          </>
                        ) : isTesting ? (
                          <>
                            <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                            <span>Test Ediliyor...</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>Bağlantı Yok</span>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteProvider(prov.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Endpoint & Model Settings Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    
                    {/* Endpoint URL */}
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">
                        Sunucu / Ajan Endpoint URL:
                      </label>
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={prov.endpointUrl}
                          onChange={(e) => handleUpdateProvider(prov.id, { endpointUrl: e.target.value })}
                          placeholder="http://localhost:11434"
                          className="w-full bg-transparent text-white text-xs font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Model Selector / Refresh */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-medium text-slate-400">
                          Seçilen Model:
                        </label>
                        <button
                          onClick={() => handlePingProvider(prov)}
                          disabled={isTesting}
                          className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>Modelleri Yenile</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {prov.availableModels.length > 0 ? (
                          <select
                            value={prov.selectedModel}
                            onChange={(e) => handleUpdateProvider(prov.id, { selectedModel: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                          >
                            {prov.availableModels.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={prov.selectedModel}
                            onChange={(e) => handleUpdateProvider(prov.id, { selectedModel: e.target.value })}
                            placeholder="model-adi (örn: deepseek-r1:8b)"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-hidden"
                          />
                        )}
                      </div>
                    </div>

                    {/* Agent Role */}
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">
                        AI Ajan Rolü / Görevi:
                      </label>
                      <select
                        value={prov.agentRole}
                        onChange={(e) => handleUpdateProvider(prov.id, { agentRole: e.target.value as any })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 focus:outline-hidden"
                      >
                        <option value="STRATEGY_GENERATOR">🚀 Strateji Üretici & AutoML</option>
                        <option value="MARKET_ANALYST">🧠 Piyasa Rejim & Döngü Analisti</option>
                        <option value="AUTONOMOUS_EXECUTION">⚡ Otonom Al-Sat Ajanı (Hermes / AponClaw)</option>
                        <option value="RISK_SENTINEL">🛡️ Risk & Volatilite Nöbetçisi</option>
                      </select>
                    </div>

                    {/* Ping Test Button & Auth Token */}
                    <div className="flex items-end gap-2">
                      <button
                        onClick={() => handlePingProvider(prov)}
                        disabled={isTesting}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center justify-center gap-1.5 transition"
                      >
                        {isTesting ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Activity className="w-3.5 h-3.5" />
                        )}
                        <span>Bağlantıyı Test Et</span>
                      </button>

                      {isSelected ? (
                        <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          Aktif Motor
                        </span>
                      ) : (
                        <button
                          onClick={() => setActiveProviderId(prov.id)}
                          className="py-1.5 px-3 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition"
                        >
                          Seç
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Error hint if disconnected */}
                  {prov.errorMessage && (
                    <div className="mt-2.5 p-2 bg-rose-950/40 border border-rose-800/40 rounded-lg text-[10px] text-rose-300 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                      <span>{prov.errorMessage}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live AI Playground & Agent Dispatcher (6 cols on lg, 5 on xl) */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-4">
          
          {/* Playground Header */}
          <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white">
                  Yerel AI & Ajan Test Terminali ({activeProvider?.name})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                {activeProvider?.selectedModel}
              </span>
            </div>

            {/* Quick Sample Prompts */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setPromptInput(`${currentSymbol} 5 yıllık grafiğinde boğa dalgalarını yakalayan trend stratejisi üret.`)}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded transition"
              >
                📊 5Y Trend Stratejisi
              </button>
              <button
                onClick={() => setPromptInput(`Hermes Agent: ${currentSymbol} için volatilite sıkışması ve rejim analizi yap.`)}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-purple-300 px-2 py-1 rounded transition"
              >
                🔮 Hermes Volatilite Analizi
              </button>
              <button
                onClick={() => setPromptInput(`AponClaw Agent: Kripto piyasasında sermaye korumalı trailing kâr mekanizması tasarla.`)}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 px-2 py-1 rounded transition"
              >
                🦅 AponClaw Trailing Mantığı
              </button>
            </div>

            {/* Prompt Textarea */}
            <div className="space-y-2">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                rows={3}
                placeholder="Yerel modele veya ajana göndermek istediğiniz analiz promptunu yazın..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 resize-none font-sans"
              />

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {activeProvider?.type === 'ollama' ? 'Native Ollama Endpoint' : 'OpenAI-Compatible Local API'}
                </span>

                <button
                  onClick={handleSendPrompt}
                  disabled={isGenerating || !promptInput.trim()}
                  className={`py-1.5 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    isGenerating
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-md shadow-cyan-500/20'
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Yerel GPU Yanıtlıyor...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>İstemi Gönder</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output / Response Area */}
            {chatResponse && (
              <div className="mt-3 bg-slate-950/90 border border-cyan-500/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Model: {chatResponse.model}
                  </span>
                  <span>Gecikme: <strong className="text-cyan-400">{chatResponse.latencyMs}ms</strong></span>
                </div>
                <div className="text-xs text-slate-200 leading-relaxed font-sans max-h-56 overflow-y-auto whitespace-pre-wrap">
                  {chatResponse.content}
                </div>
              </div>
            )}

            {chatError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{chatError}</span>
              </div>
            )}
          </div>

          {/* Autonomous Agent One-Click Actions */}
          <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>Otonom Ajan Görev Tetikleyicileri (AponClaw / Hermes)</span>
              </h3>
              <span className="text-[10px] text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/40">
                Otonom Mod
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleDispatchAgentAction('GENERATE_STRATEGY')}
                disabled={isAgentRunning}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-left transition space-y-1 hover:border-cyan-500"
              >
                <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Strateji Formüle Et</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {currentSymbol} için 5 yıllık otonom kurallar çıkarır.
                </p>
              </button>

              <button
                onClick={() => handleDispatchAgentAction('MARKET_SCAN')}
                disabled={isAgentRunning}
                className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/30 text-left transition space-y-1 hover:border-purple-500"
              >
                <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Piyasa Rejim Taraması</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Boğa/ayı geçişlerini ve hacim kırılımlarını tarar.
                </p>
              </button>
            </div>

            {/* Agent Actions Log */}
            {agentActions.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                <span className="text-[10px] font-bold text-slate-400 block">
                  Son Ajan Eylemleri:
                </span>
                {agentActions.map((act) => (
                  <div key={act.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span className="font-semibold text-cyan-300">{act.title}</span>
                      <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300">{act.detail}</p>
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
