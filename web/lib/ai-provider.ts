import { providerOption, providerReady, readAiProviderConfig, type AiProviderConfig } from "./ai-provider-config";

export type AiGenerateOptions = {
  temperature?: number;
  maxTokens?: number;
  system?: string;
};

function stripJsonFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function openAiBase(config: AiProviderConfig): string {
  if (config.type === "openai") return "https://api.openai.com/v1";
  return (config.baseUrl || providerOption(config.type).baseUrl || "").replace(/\/$/, "");
}

function extensionGenerateText(prompt: string, options: AiGenerateOptions, timeoutMs = 45_000): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const requestId = crypto.randomUUID();
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      window.removeEventListener("message", onMessage);
      resolve(null);
    }, timeoutMs);

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type !== "rabbit-holes:provider-result" || event.data.requestId !== requestId) return;
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
      resolve(event.data.ok ? String(event.data.text || "") : null);
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ type: "rabbit-holes:generate-text", requestId, prompt, options }, window.location.origin);
  });
}

async function generateOpenAiCompatible(config: AiProviderConfig, prompt: string, options: AiGenerateOptions): Promise<string> {
  const baseUrl = openAiBase(config);
  if (!baseUrl) throw new Error("Missing OpenAI-compatible base URL");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
  if (config.type === "openrouter") {
    headers["HTTP-Referer"] = typeof window !== "undefined" ? window.location.origin : "https://userabbitholes.com";
    headers["X-Title"] = "Rabbit Holes";
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 900,
      messages: [
        ...(options.system ? [{ role: "system", content: options.system }] : []),
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  const json = await response.json();
  return String(json?.choices?.[0]?.message?.content || "").trim();
}

async function generateAnthropic(config: AiProviderConfig, prompt: string, options: AiGenerateOptions): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey || "",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: options.maxTokens ?? 900,
      temperature: options.temperature ?? 0.2,
      ...(options.system ? { system: options.system } : {}),
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  const json = await response.json();
  return String(json?.content?.map((part: { text?: string }) => part.text || "").join("\n") || "").trim();
}

async function generateGemini(config: AiProviderConfig, prompt: string, options: AiGenerateOptions): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey || "")}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: options.system ? `${options.system}\n\n${prompt}` : prompt }] }],
      generationConfig: { temperature: options.temperature ?? 0.2, maxOutputTokens: options.maxTokens ?? 900 },
    }),
  });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  const json = await response.json();
  return String(json?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("\n") || "").trim();
}

async function generateOllama(config: AiProviderConfig, prompt: string, options: AiGenerateOptions): Promise<string> {
  const baseUrl = (config.baseUrl || providerOption(config.type).baseUrl || "http://localhost:11434").replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      messages: [
        ...(options.system ? [{ role: "system", content: options.system }] : []),
        { role: "user", content: prompt },
      ],
      options: { temperature: options.temperature ?? 0.2, num_predict: options.maxTokens ?? 900 },
    }),
  });
  if (!response.ok) throw new Error(`Provider returned ${response.status}`);
  const json = await response.json();
  return String(json?.message?.content || json?.response || "").trim();
}

export function activeProvider(): AiProviderConfig | null {
  const config = readAiProviderConfig();
  if (config.apiKey) return null;
  return providerReady(config) ? config : null;
}

export async function generateText(prompt: string, options: AiGenerateOptions = {}): Promise<string | null> {
  const extensionText = await extensionGenerateText(prompt, options);
  if (extensionText) return extensionText;

  const config = activeProvider();
  if (!config) return null;
  try {
    if (["openai", "openrouter", "lmstudio", "compatible"].includes(config.type)) return await generateOpenAiCompatible(config, prompt, options);
    if (config.type === "anthropic") return await generateAnthropic(config, prompt, options);
    if (config.type === "gemini") return await generateGemini(config, prompt, options);
    if (config.type === "ollama") return await generateOllama(config, prompt, options);
    return null;
  } catch (error) {
    console.warn("Rabbit Holes provider call failed; using local fallback", error);
    return null;
  }
}

export async function validateCurrentProvider(): Promise<boolean> {
  const text = await extensionGenerateText(
    "Reply with exactly: OK",
    { temperature: 0, maxTokens: 4, system: "You are validating that this API key and model can make a tiny request." },
    10_000,
  );
  return Boolean(text?.trim());
}

export async function generateJson<T>(prompt: string, options: AiGenerateOptions = {}): Promise<T | null> {
  const text = await generateText(prompt, { ...options, system: options.system ?? "Return only valid JSON. No markdown." });
  if (!text) return null;
  try {
    return JSON.parse(stripJsonFence(text)) as T;
  } catch (error) {
    console.warn("Rabbit Holes provider JSON parse failed; using local fallback", error);
    return null;
  }
}
