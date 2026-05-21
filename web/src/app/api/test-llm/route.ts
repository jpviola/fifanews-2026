import { NextResponse } from "next/server";
import { getLLMConfig, openRouterChatCompletion } from "@/lib/openrouter";

// Endpoint temporal de diagnóstico — llama al LLM con un prompt mínimo
export async function GET() {
  let config: ReturnType<typeof getLLMConfig>;
  try {
    config = getLLMConfig();
  } catch (e) {
    return NextResponse.json({
      ok: false,
      step: "config",
      error: e instanceof Error ? e.message : String(e),
      env: {
        hasGroqKey: Boolean((process.env.GROQ_API_KEY ?? "").trim()),
        hasOpenRouterKey: Boolean((process.env.OPENROUTER_API_KEY ?? "").trim()),
        groqKeyPrefix: (process.env.GROQ_API_KEY ?? "").slice(0, 8) || "(vacío)",
        openRouterKeyPrefix: (process.env.OPENROUTER_API_KEY ?? "").slice(0, 8) || "(vacío)",
      },
    });
  }

  try {
    const result = await openRouterChatCompletion({
      model: config.defaultModel,
      messages: [{ role: "user", content: 'Respondé solo con el JSON: {"ok":true}' }],
      temperature: 0,
      maxTokens: 20,
    });
    return NextResponse.json({
      ok: true,
      provider: config.provider,
      model: config.defaultModel,
      baseUrl: config.baseUrl,
      response: result.choices?.[0]?.message?.content,
      env: {
        hasGroqKey: Boolean((process.env.GROQ_API_KEY ?? "").trim()),
        hasOpenRouterKey: Boolean((process.env.OPENROUTER_API_KEY ?? "").trim()),
        groqKeyPrefix: (process.env.GROQ_API_KEY ?? "").slice(0, 8) || "(vacío)",
        openRouterKeyPrefix: (process.env.OPENROUTER_API_KEY ?? "").slice(0, 8) || "(vacío)",
      },
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      step: "llm_call",
      provider: config.provider,
      model: config.defaultModel,
      baseUrl: config.baseUrl,
      error: e instanceof Error ? e.message : String(e),
      env: {
        hasGroqKey: Boolean((process.env.GROQ_API_KEY ?? "").trim()),
        hasOpenRouterKey: Boolean((process.env.OPENROUTER_API_KEY ?? "").trim()),
        groqKeyPrefix: (process.env.GROQ_API_KEY ?? "").slice(0, 8) || "(vacío)",
        openRouterKeyPrefix: (process.env.OPENROUTER_API_KEY ?? "").slice(0, 8) || "(vacío)",
      },
    });
  }
}
