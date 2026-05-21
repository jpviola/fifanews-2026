export type OpenRouterChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

export type OpenRouterChatCompletionOptions = {
  model: string;
  messages: OpenRouterChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

type OpenRouterChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export function getLLMConfig() {
  // Groq tiene prioridad si está configurado (gratis, sin billing requerido)
  const groqKey = (process.env.GROQ_API_KEY ?? "").trim();
  if (groqKey) {
    return {
      apiKey: groqKey,
      baseUrl: "https://api.groq.com/openai/v1",
      defaultModel: "llama-3.3-70b-versatile",
      provider: "groq" as const,
    };
  }

  // Fallback: OpenRouter
  const openRouterKey = (process.env.OPENROUTER_API_KEY ?? "").trim();
  if (openRouterKey) {
    return {
      apiKey: openRouterKey,
      baseUrl: "https://openrouter.ai/api/v1",
      defaultModel: "deepseek/deepseek-chat-v3-0324:free",
      provider: "openrouter" as const,
      siteUrl: process.env.OPENROUTER_SITE_URL,
      appName: process.env.OPENROUTER_APP_NAME,
    };
  }

  throw new Error("Missing LLM API key: set GROQ_API_KEY or OPENROUTER_API_KEY");
}

// Mantenemos el nombre anterior para no romper imports existentes
export function getOpenRouterConfig() {
  const cfg = getLLMConfig();
  return {
    apiKey: cfg.apiKey,
    baseUrl: cfg.baseUrl,
    siteUrl: "siteUrl" in cfg ? cfg.siteUrl : undefined,
    appName: "appName" in cfg ? cfg.appName : undefined,
  };
}

export async function openRouterChatCompletion(
  opts: OpenRouterChatCompletionOptions,
) {
  const cfg = getLLMConfig();

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      ...("siteUrl" in cfg && cfg.siteUrl ? { "HTTP-Referer": cfg.siteUrl } : {}),
      ...("appName" in cfg && cfg.appName ? { "X-Title": cfg.appName } : {}),
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 900,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM API error (${res.status}): ${text}`);
  }

  return (await res.json()) as OpenRouterChatCompletionResponse;
}

export function getFirstAssistantContent(
  resp: OpenRouterChatCompletionResponse,
): string {
  const content = resp.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM: empty response content");
  return content;
}
