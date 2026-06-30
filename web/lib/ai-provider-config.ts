export type AiProviderType = "openai" | "anthropic" | "openrouter" | "gemini" | "ollama" | "lmstudio" | "compatible";

export type AiProviderConfig = {
  type: AiProviderType;
  apiKey?: string;
  baseUrl?: string;
  model: string;
};

export const AI_PROVIDER_STORAGE_KEY = "rabbit-hole-ai-provider";

export const AI_PROVIDER_OPTIONS: Array<{ type: AiProviderType; label: string; defaultModel: string; baseUrl?: string; needsKey: boolean; description: string }> = [
  { type: "anthropic", label: "Anthropic", defaultModel: "claude-sonnet-4-20250514", needsKey: true, description: "Claude via your Anthropic API key." },
  { type: "openai", label: "OpenAI", defaultModel: "gpt-4.1-mini", needsKey: true, description: "OpenAI models with your API key." },
  { type: "openrouter", label: "OpenRouter", defaultModel: "anthropic/claude-sonnet-4", baseUrl: "https://openrouter.ai/api/v1", needsKey: true, description: "Route to Claude, OpenAI, Gemini, and open models from one key." },
  { type: "gemini", label: "Gemini", defaultModel: "gemini-2.5-flash", needsKey: true, description: "Google Gemini API with your key." },
  { type: "ollama", label: "Ollama", defaultModel: "llama3.1", baseUrl: "http://localhost:11434", needsKey: false, description: "Local models running on your machine." },
  { type: "lmstudio", label: "LM Studio", defaultModel: "local-model", baseUrl: "http://localhost:1234/v1", needsKey: false, description: "OpenAI-compatible local server from LM Studio." },
  { type: "compatible", label: "OpenAI-compatible", defaultModel: "model-name", needsKey: false, description: "Any endpoint that speaks the OpenAI chat completions API." },
];

export const DEFAULT_AI_PROVIDER: AiProviderConfig = {
  type: "openrouter",
  model: "anthropic/claude-sonnet-4",
  baseUrl: "https://openrouter.ai/api/v1",
};

export function providerOption(type: AiProviderType) {
  return AI_PROVIDER_OPTIONS.find((option) => option.type === type) ?? AI_PROVIDER_OPTIONS[0];
}

export function readAiProviderConfig(): AiProviderConfig {
  if (typeof window === "undefined") return DEFAULT_AI_PROVIDER;
  try {
    const raw = window.localStorage.getItem(AI_PROVIDER_STORAGE_KEY);
    return raw ? { ...DEFAULT_AI_PROVIDER, ...(JSON.parse(raw) as Partial<AiProviderConfig>) } : DEFAULT_AI_PROVIDER;
  } catch {
    return DEFAULT_AI_PROVIDER;
  }
}

export function writeAiProviderConfig(config: AiProviderConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AI_PROVIDER_STORAGE_KEY, JSON.stringify(config));
}

type ExtensionConfig = {
  settings?: Record<string, boolean> | null;
  aiProvider?: AiProviderConfig | null;
};

function extensionRequest<T>(requestType: string, responseType: string, payload: Record<string, unknown> = {}, timeoutMs = 800): Promise<T | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const requestId = crypto.randomUUID();
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(null);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type !== responseType || event.data.requestId !== requestId) return;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve(event.data as T);
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ type: requestType, requestId, ...payload }, window.location.origin);
  });
}

export async function readExtensionConfig(): Promise<ExtensionConfig | null> {
  const response = await extensionRequest<ExtensionConfig & { type: string }>("rabbit-holes:get-config", "rabbit-holes:config");
  return response ? { settings: response.settings ?? null, aiProvider: response.aiProvider ?? null } : null;
}

export async function writeExtensionConfig(config: ExtensionConfig): Promise<boolean> {
  const response = await extensionRequest<{ ok?: boolean }>("rabbit-holes:set-config", "rabbit-holes:config-updated", config as Record<string, unknown>);
  return Boolean(response?.ok);
}

export async function clearExtensionLocalData(): Promise<boolean> {
  const response = await extensionRequest<{ ok?: boolean }>("rabbit-holes:clear-local-data", "rabbit-holes:local-data-cleared");
  return Boolean(response?.ok);
}

export function providerReady(config: AiProviderConfig): boolean {
  const option = providerOption(config.type);
  if (!config.model.trim()) return false;
  if (option.needsKey && !config.apiKey?.trim()) return false;
  if ((config.type === "compatible" || config.type === "lmstudio" || config.type === "ollama") && !config.baseUrl?.trim()) return false;
  return true;
}
