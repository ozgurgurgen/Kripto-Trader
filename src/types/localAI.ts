export type LocalAIProviderType = 
  | 'ollama' 
  | 'lm_studio' 
  | 'hermes_agent' 
  | 'aponclaw_agent' 
  | 'vllm' 
  | 'custom_agent';

export type LocalAIAgentRole = 
  | 'STRATEGY_GENERATOR' 
  | 'MARKET_ANALYST' 
  | 'AUTONOMOUS_EXECUTION' 
  | 'RISK_SENTINEL';

export type LocalAIConnectionStatus = 
  | 'CONNECTED' 
  | 'DISCONNECTED' 
  | 'TESTING' 
  | 'ERROR';

export interface LocalAIProviderConfig {
  id: string;
  name: string;
  type: LocalAIProviderType;
  endpointUrl: string;
  apiKey?: string;
  selectedModel: string;
  availableModels: string[];
  agentRole: LocalAIAgentRole;
  temperature: number;
  maxTokens: number;
  contextWindow: number;
  systemPrompt?: string;
  enabled: boolean;
  status: LocalAIConnectionStatus;
  latencyMs: number | null;
  lastPingTimestamp: number | null;
  errorMessage?: string;
}

export interface LocalAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: number;
}

export interface LocalAIChatResponse {
  content: string;
  model: string;
  latencyMs: number;
  tokensGenerated?: number;
  finishReason?: string;
}

export interface LocalAIAgentAction {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: number;
  actionType: 'GENERATE_STRATEGY' | 'MARKET_SCAN' | 'RISK_ALERT' | 'SIGNAL_DISPATCH';
  title: string;
  detail: string;
  status: 'SUCCESS' | 'RUNNING' | 'FAILED';
  outputPayload?: any;
}
