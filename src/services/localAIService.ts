import { 
  LocalAIProviderConfig, 
  LocalAIChatMessage, 
  LocalAIChatResponse, 
  LocalAIAgentAction 
} from '../types/localAI';

const STORAGE_KEY = 'kriptobot_local_ai_providers_v1';
const ACTIVE_PROVIDER_KEY = 'kriptobot_active_local_ai_id';

export class LocalAIService {
  private static defaultProviders: LocalAIProviderConfig[] = [
    {
      id: 'ollama-default',
      name: 'Ollama Yerel LLM',
      type: 'ollama',
      endpointUrl: 'http://localhost:11434',
      selectedModel: 'deepseek-r1:8b',
      availableModels: ['deepseek-r1:8b', 'llama3.3:70b', 'qwen2.5-coder:32b', 'mistral:latest'],
      agentRole: 'STRATEGY_GENERATOR',
      temperature: 0.4,
      maxTokens: 2048,
      contextWindow: 8192,
      systemPrompt: 'Sen uzman bir kantitatif kripto analisti ve strateji tasarımcısısın. Verilen grafik ve göstergeleri analiz ederek en karlı al-sat kurallarını çıkarırsın.',
      enabled: true,
      status: 'DISCONNECTED',
      latencyMs: null,
      lastPingTimestamp: null,
    },
    {
      id: 'hermes-agent-default',
      name: 'Nous Hermes 3 AI Agent',
      type: 'hermes_agent',
      endpointUrl: 'http://localhost:8000/v1',
      selectedModel: 'hermes-3-llama-3.1-8b',
      availableModels: ['hermes-3-llama-3.1-8b', 'hermes-3-llama-3.1-70b', 'nous-hermes-2-pro'],
      agentRole: 'AUTONOMOUS_EXECUTION',
      temperature: 0.2,
      maxTokens: 2500,
      contextWindow: 16384,
      systemPrompt: 'You are Hermes, an autonomous quant trading agent with advanced function calling and multi-step reasoning capabilities.',
      enabled: true,
      status: 'DISCONNECTED',
      latencyMs: null,
      lastPingTimestamp: null,
    },
    {
      id: 'aponclaw-agent-default',
      name: 'AponClaw / OpenClaw Autonomous Agent',
      type: 'aponclaw_agent',
      endpointUrl: 'http://localhost:9000/api',
      selectedModel: 'aponclaw-quant-v1',
      availableModels: ['aponclaw-quant-v1', 'aponclaw-risk-sentinel', 'openclaw-swarm-core'],
      agentRole: 'MARKET_ANALYST',
      temperature: 0.3,
      maxTokens: 3000,
      contextWindow: 32768,
      systemPrompt: 'AponClaw otonom ajan motoru. 5 yıllık piyasa rejim değişimlerini, boğa kırılımlarını ve risk faktörlerini analiz eder.',
      enabled: true,
      status: 'DISCONNECTED',
      latencyMs: null,
      lastPingTimestamp: null,
    },
    {
      id: 'lm-studio-default',
      name: 'LM Studio Local Server',
      type: 'lm_studio',
      endpointUrl: 'http://localhost:1234/v1',
      selectedModel: 'local-model',
      availableModels: ['local-model', 'meta-llama-3.1-8b-instruct', 'deepseek-coder-v2'],
      agentRole: 'STRATEGY_GENERATOR',
      temperature: 0.5,
      maxTokens: 2048,
      contextWindow: 4096,
      enabled: false,
      status: 'DISCONNECTED',
      latencyMs: null,
      lastPingTimestamp: null,
    },
  ];

  static getProviders(): LocalAIProviderConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return this.defaultProviders;
  }

  static saveProviders(providers: LocalAIProviderConfig[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
    } catch (e) {
      console.error('Failed to save local AI providers:', e);
    }
  }

  static getActiveProviderId(): string {
    return localStorage.getItem(ACTIVE_PROVIDER_KEY) || 'ollama-default';
  }

  static setActiveProviderId(id: string): void {
    localStorage.setItem(ACTIVE_PROVIDER_KEY, id);
  }

  static getActiveProvider(): LocalAIProviderConfig | undefined {
    const providers = this.getProviders();
    const activeId = this.getActiveProviderId();
    return providers.find((p) => p.id === activeId) || providers[0];
  }

  /**
   * Ping & Test Connection to a Local LLM / Agent
   */
  static async pingProvider(config: LocalAIProviderConfig): Promise<{
    connected: boolean;
    latencyMs: number;
    models: string[];
    serverInfo?: string;
    error?: string;
  }> {
    try {
      const resp = await fetch('/api/local-ai/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpointUrl: config.endpointUrl,
          type: config.type,
          apiKey: config.apiKey,
        }),
      });

      const data = await resp.json();
      return {
        connected: !!data.connected,
        latencyMs: data.latencyMs || 0,
        models: data.models || config.availableModels || [],
        serverInfo: data.serverInfo,
        error: data.error,
      };
    } catch (err: any) {
      return {
        connected: false,
        latencyMs: 0,
        models: config.availableModels || [],
        error: err.message || 'Yerel sunucuya bağlanılamadı',
      };
    }
  }

  /**
   * Execute Chat / Prompt on Local LLM or Agent
   */
  static async executeChat(
    provider: LocalAIProviderConfig,
    messages: LocalAIChatMessage[]
  ): Promise<LocalAIChatResponse> {
    const resp = await fetch('/api/local-ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpointUrl: provider.endpointUrl,
        type: provider.type,
        apiKey: provider.apiKey,
        model: provider.selectedModel,
        messages,
        temperature: provider.temperature,
        maxTokens: provider.maxTokens,
      }),
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || 'Yerel AI çağrısı başarısız oldu');
    }

    const data = await resp.json();
    return {
      content: data.content,
      model: data.model || provider.selectedModel,
      latencyMs: data.latencyMs,
      tokensGenerated: data.tokensGenerated,
    };
  }

  /**
   * Trigger Autonomous Agent Action (Hermes / AponClaw)
   */
  static async dispatchAgentTask(
    provider: LocalAIProviderConfig,
    taskType: 'GENERATE_STRATEGY' | 'MARKET_SCAN' | 'RISK_ALERT',
    symbol: string,
    timeframe: string,
    contextData: any
  ): Promise<LocalAIAgentAction> {
    const resp = await fetch('/api/local-ai/agent-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentConfig: provider,
        taskType,
        symbol,
        timeframe,
        contextData,
      }),
    });

    const data = await resp.json();
    return {
      id: `agent-act-${Date.now()}`,
      agentId: provider.id,
      agentName: provider.name,
      timestamp: Date.now(),
      actionType: taskType,
      title: `${provider.name} - ${taskType === 'GENERATE_STRATEGY' ? 'Otonom Strateji Üretimi' : 'Piyasa Taraması'}`,
      detail: data.resultText || 'Ajan görevi başarıyla tamamladı.',
      status: data.success ? 'SUCCESS' : 'FAILED',
      outputPayload: data,
    };
  }
}
