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

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

/** Map provider ID to the env var name that holds its key */
const KEY_MAP = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
};

/** Default endpoints per provider */
const DEFAULT_ENDPOINTS = {
  anthropic: 'https://api.anthropic.com',
  openai: 'https://api.openai.com',
  gemini: 'https://generativelanguage.googleapis.com',
};

/** Default models per provider */
const DEFAULT_MODELS = {
  anthropic: 'claude-4.6-opus',
  openai: 'gpt-5.2',
  gemini: 'gemini-3-pro',
};

/* ------------------------------------------------------------------ */
/*  Provider request builders                                          */
/* ------------------------------------------------------------------ */

function buildAnthropicRequest(endpoint, apiKey, model, systemPrompt, userPrompt) {
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

function buildOpenAIRequest(endpoint, apiKey, model, systemPrompt, userPrompt) {
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

function buildGeminiRequest(endpoint, apiKey, model, systemPrompt, userPrompt) {
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

function extractAnthropicText(data) {
  return data.content?.[0]?.text ?? '';
}

function extractOpenAIText(data) {
  return data.choices?.[0]?.message?.content ?? '';
}

function extractGeminiText(data) {
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

const BUILDERS = {
  anthropic: buildAnthropicRequest,
  openai: buildOpenAIRequest,
  gemini: buildGeminiRequest,
};

const EXTRACTORS = {
  anthropic: extractAnthropicText,
  openai: extractOpenAIText,
  gemini: extractGeminiText,
};

/* ------------------------------------------------------------------ */
/*  Handlers                                                           */
/* ------------------------------------------------------------------ */

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { provider, model, endpoint, systemPrompt, userPrompt } = body;

  if (!provider || !systemPrompt || !userPrompt) {
    return errorResponse('Missing required fields: provider, systemPrompt, userPrompt');
  }

  if (!BUILDERS[provider]) {
    return errorResponse(`Unknown provider: ${provider}`);
  }

  // Look up the API key from environment secrets
  const envKey = KEY_MAP[provider];
  const apiKey = context.env[envKey];

  if (!apiKey) {
    return errorResponse(
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

  let upstream;
  try {
    upstream = await fetch(url, init);
  } catch (err) {
    return errorResponse(`Failed to reach ${provider} API: ${err.message}`, 502);
  }

  if (!upstream.ok) {
    const upstreamBody = await upstream.text().catch(() => 'unknown');
    if (upstream.status === 401) return errorResponse('Invalid API key configured on server.', 401);
    if (upstream.status === 429) return errorResponse('Rate limited by provider. Try again shortly.', 429);
    return errorResponse(`Provider returned ${upstream.status}: ${upstreamBody.slice(0, 300)}`, upstream.status);
  }

  const data = await upstream.json();
  const text = EXTRACTORS[provider](data);

  if (!text) {
    return errorResponse('Empty response from provider.', 502);
  }

  return jsonResponse({ text });
}
