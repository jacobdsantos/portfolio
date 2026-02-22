/**
 * Cloudflare Pages Function — AI resume generation proxy.
 *
 * Reads the API key from Cloudflare environment secrets so the browser
 * never needs to store or transmit it. Supports Anthropic, OpenAI, and
 * Gemini providers.
 *
 * Environment variables (set via Cloudflare dashboard or `wrangler secret put`):
 *   ANTHROPIC_API_KEY  — Anthropic API key
 *   OPENAI_API_KEY     — OpenAI API key (optional)
 *   GEMINI_API_KEY     — Google Gemini API key (optional)
 */

interface Env {
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

type ProviderId = 'anthropic' | 'openai' | 'gemini';

interface ProxyRequest {
  provider: ProviderId;
  model: string;
  endpoint?: string; // optional override
  systemPrompt: string;
  userPrompt: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

/** Map provider ID to the env var name that holds its key */
const KEY_MAP: Record<ProviderId, keyof Env> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

/** Default endpoints per provider */
const DEFAULT_ENDPOINTS: Record<ProviderId, string> = {
  anthropic: 'https://api.anthropic.com',
  openai: 'https://api.openai.com',
  gemini: 'https://generativelanguage.googleapis.com',
};

/** Default models per provider */
const DEFAULT_MODELS: Record<ProviderId, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  gemini: 'gemini-2.5-flash',
};

/* ------------------------------------------------------------------ */
/*  Provider request builders                                          */
/* ------------------------------------------------------------------ */

function buildAnthropicRequest(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): { url: string; init: RequestInit } {
  return {
    url: `${endpoint}/v1/messages`,
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    },
  };
}

function buildOpenAIRequest(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): { url: string; init: RequestInit } {
  return {
    url: `${endpoint}/v1/chat/completions`,
    init: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    },
  };
}

function buildGeminiRequest(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): { url: string; init: RequestInit } {
  return {
    url: `${endpoint}/v1beta/models/${model}:generateContent?key=${apiKey}`,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 4096,
        },
      }),
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Response extractors                                                */
/* ------------------------------------------------------------------ */

function extractAnthropicText(data: Record<string, unknown>): string {
  const content = data.content as Array<{ text?: string }> | undefined;
  return content?.[0]?.text ?? '';
}

function extractOpenAIText(data: Record<string, unknown>): string {
  const choices = data.choices as Array<{ message?: { content?: string } }> | undefined;
  return choices?.[0]?.message?.content ?? '';
}

function extractGeminiText(data: Record<string, unknown>): string {
  const candidates = data.candidates as Array<{
    content?: { parts?: Array<{ text?: string }> };
  }> | undefined;
  return candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

const BUILDERS: Record<ProviderId, typeof buildAnthropicRequest> = {
  anthropic: buildAnthropicRequest,
  openai: buildOpenAIRequest,
  gemini: buildGeminiRequest,
};

const EXTRACTORS: Record<ProviderId, (data: Record<string, unknown>) => string> = {
  anthropic: extractAnthropicText,
  openai: extractOpenAIText,
  gemini: extractGeminiText,
};

/* ------------------------------------------------------------------ */
/*  Handler                                                            */
/* ------------------------------------------------------------------ */

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ProxyRequest;
  try {
    body = await context.request.json();
  } catch {
    return error('Invalid JSON body');
  }

  const { provider, model, endpoint, systemPrompt, userPrompt } = body;

  if (!provider || !systemPrompt || !userPrompt) {
    return error('Missing required fields: provider, systemPrompt, userPrompt');
  }

  if (!BUILDERS[provider]) {
    return error(`Unknown provider: ${provider}`);
  }

  // Look up the API key from environment secrets
  const envKey = KEY_MAP[provider];
  const apiKey = context.env[envKey];

  if (!apiKey) {
    return error(
      `No API key configured for ${provider}. Set ${envKey} in Cloudflare Pages environment settings.`,
      500,
    );
  }

  const resolvedEndpoint = (endpoint || DEFAULT_ENDPOINTS[provider]).replace(/\/+$/, '');
  const resolvedModel = model || DEFAULT_MODELS[provider];

  // Build and execute the upstream request
  const { url, init } = BUILDERS[provider](
    resolvedEndpoint,
    apiKey,
    resolvedModel,
    systemPrompt,
    userPrompt,
  );

  let upstream: Response;
  try {
    upstream = await fetch(url, init);
  } catch (err) {
    return error(`Failed to reach ${provider} API: ${(err as Error).message}`, 502);
  }

  if (!upstream.ok) {
    const upstreamBody = await upstream.text().catch(() => 'unknown');
    if (upstream.status === 401) return error('Invalid API key configured on server.', 401);
    if (upstream.status === 429) return error('Rate limited by provider. Try again shortly.', 429);
    return error(`Provider returned ${upstream.status}: ${upstreamBody.slice(0, 300)}`, upstream.status);
  }

  const data = (await upstream.json()) as Record<string, unknown>;
  const text = EXTRACTORS[provider](data);

  if (!text) {
    return error('Empty response from provider.', 502);
  }

  return json({ text });
};
