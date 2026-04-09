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

export function getOpenRouterConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

  return {
    apiKey,
    baseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    siteUrl: process.env.OPENROUTER_SITE_URL,
    appName: process.env.OPENROUTER_APP_NAME,
  };
}

export async function openRouterChatCompletion(
  opts: OpenRouterChatCompletionOptions,
) {
  const cfg = getOpenRouterConfig();

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      ...(cfg.siteUrl ? { "HTTP-Referer": cfg.siteUrl } : {}),
      ...(cfg.appName ? { "X-Title": cfg.appName } : {}),
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
    throw new Error(`OpenRouter error (${res.status}): ${text}`);
  }

  return (await res.json()) as OpenRouterChatCompletionResponse;
}

export function getFirstAssistantContent(
  resp: OpenRouterChatCompletionResponse,
): string {
  const content = resp.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter: empty response content");
  return content;
}

