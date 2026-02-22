import type { ResumeMaster } from './types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ProviderId = 'anthropic' | 'openai' | 'gemini';

export interface AIGenerateInput {
  provider: ProviderId;
  apiKey: string;
  apiEndpoint: string;
  model: string;
  master: ResumeMaster;
  jobDescriptionText: string;
  targetRole?: string;
}

export interface AIGenerateResult {
  summary: string;
  targetRole: string;
  experience: Array<{
    id: string;
    bullets: Array<{ id: string; text: string }>;
  }>;
  skillGroups: Array<{ group: string; items: string[] }>;
  projectOrder: string[];
  publicationOrder: string[];
}

/* ------------------------------------------------------------------ */
/*  Provider abstraction                                               */
/* ------------------------------------------------------------------ */

interface ProviderConfig {
  id: ProviderId;
  label: string;
  defaultEndpoint: string;
  defaultModel: string;
  /** Build the fetch URL and RequestInit for this provider */
  buildRequest: (params: {
    endpoint: string;
    apiKey: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
  }) => { url: string; init: RequestInit };
  /** Extract the text content from the provider's response JSON */
  extractText: (data: unknown) => string;
}

const anthropicProvider: ProviderConfig = {
  id: 'anthropic',
  label: 'Anthropic (Claude)',
  defaultEndpoint: 'https://api.anthropic.com',
  defaultModel: 'claude-4.6-opus',
  buildRequest({ endpoint, apiKey, model, systemPrompt, userPrompt }) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };
    if (endpoint.includes('anthropic.com')) {
      headers['anthropic-dangerous-direct-browser-access'] = 'true';
    }
    return {
      url: `${endpoint}/v1/messages`,
      init: {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      },
    };
  },
  extractText(data: unknown): string {
    const d = data as { content?: Array<{ text?: string }> };
    return d.content?.[0]?.text ?? '';
  },
};

const openaiProvider: ProviderConfig = {
  id: 'openai',
  label: 'OpenAI (GPT)',
  defaultEndpoint: 'https://api.openai.com',
  defaultModel: 'gpt-5.2',
  buildRequest({ endpoint, apiKey, model, systemPrompt, userPrompt }) {
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
  },
  extractText(data: unknown): string {
    const d = data as { choices?: Array<{ message?: { content?: string } }> };
    return d.choices?.[0]?.message?.content ?? '';
  },
};

const geminiProvider: ProviderConfig = {
  id: 'gemini',
  label: 'Google (Gemini)',
  defaultEndpoint: 'https://generativelanguage.googleapis.com',
  defaultModel: 'gemini-3-pro',
  buildRequest({ endpoint, apiKey, model, systemPrompt, userPrompt }) {
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
  },
  extractText(data: unknown): string {
    const d = data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return d.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  },
};

/* ------------------------------------------------------------------ */
/*  Provider registry                                                  */
/* ------------------------------------------------------------------ */

const PROVIDERS: Record<ProviderId, ProviderConfig> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  gemini: geminiProvider,
};

/** Get the list of available providers for the UI */
export function getProviders(): Array<{ id: ProviderId; label: string; defaultEndpoint: string; defaultModel: string }> {
  return Object.values(PROVIDERS).map(({ id, label, defaultEndpoint, defaultModel }) => ({
    id,
    label,
    defaultEndpoint,
    defaultModel,
  }));
}

/** Get default endpoint and model for a provider */
export function getProviderDefaults(providerId: ProviderId): { endpoint: string; model: string } {
  const p = PROVIDERS[providerId];
  return { endpoint: p.defaultEndpoint, model: p.defaultModel };
}

/* ------------------------------------------------------------------ */
/*  Prompt (shared across all providers)                               */
/* ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are an expert resume writer specializing in ATS-optimized cybersecurity and threat intelligence resumes.

STRICT RULES:
1. ONLY use facts from the provided master resume data. NEVER fabricate experience, skills, metrics, or achievements.
2. Rewrite each experience bullet to naturally incorporate keywords from the job description where truthful.
3. Use strong Harvard-style action verbs (Spearheaded, Architected, Engineered, Investigated, Deployed, Pioneered, etc.).
4. PRESERVE all quantitative metrics from the original data (e.g., "17 articles", "10+ tools", "4 regions", "100+ officers").
5. Front-load the most JD-relevant information in each bullet.
6. For skills: reorder to prioritize JD-matched terms. You may add recognized synonyms the candidate demonstrably has (e.g., add "SIEM" if they list Splunk/Elastic).
7. For the summary: write 3-4 impactful sentences directly addressing the target role's key requirements using the candidate's actual accomplishments.
8. For projectOrder and publicationOrder: rank by JD relevance, most relevant first.
9. Return ONLY valid JSON — no markdown fences, no commentary, no explanation.`;

function buildUserPrompt(input: AIGenerateInput): string {
  const { master, jobDescriptionText, targetRole } = input;

  return `## Candidate Master Resume Data
${JSON.stringify(master, null, 2)}

## Target Job Description
${jobDescriptionText}

${targetRole ? `## Target Role Title\n${targetRole}` : '## Infer the most appropriate role title from the JD.'}

## Task
Rewrite this candidate's resume content to maximize ATS keyword alignment with the target JD while staying 100% truthful to their actual experience.

Return this exact JSON structure (no markdown, no code fences):
{
  "summary": "3-4 sentence tailored professional summary",
  "targetRole": "inferred or provided role title",
  "experience": [
    {
      "id": "experience ID from master data",
      "bullets": [
        { "id": "bullet ID from master data", "text": "rewritten bullet incorporating JD keywords naturally" }
      ]
    }
  ],
  "skillGroups": [
    { "group": "group name", "items": ["skill1", "skill2"] }
  ],
  "projectOrder": ["project-id-most-relevant-first"],
  "publicationOrder": ["pub-id-most-relevant-first"]
}`;
}

/* ------------------------------------------------------------------ */
/*  API Call (provider-agnostic)                                       */
/* ------------------------------------------------------------------ */

export async function generateWithAI(
  input: AIGenerateInput,
): Promise<AIGenerateResult> {
  const { provider, apiKey, apiEndpoint, model } = input;
  const providerConfig = PROVIDERS[provider];

  if (!providerConfig) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  const systemPrompt = SYSTEM_PROMPT;
  const userPrompt = buildUserPrompt(input);

  let content: string;

  if (apiKey) {
    // Direct call — user provided their own API key
    const endpoint = apiEndpoint.replace(/\/+$/, '');

    const { url, init } = providerConfig.buildRequest({
      endpoint,
      apiKey,
      model,
      systemPrompt,
      userPrompt,
    });

    const response = await fetch(url, init);

    if (!response.ok) {
      const body = await response.text().catch(() => 'unknown');
      if (response.status === 401) throw new Error('Invalid API key. Check your key and try again.');
      if (response.status === 429) throw new Error('Rate limited. Wait a moment and try again.');
      if (response.status === 403) throw new Error('Access forbidden. Your API key may not have permission for this model.');
      throw new Error(`API error ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = await response.json();
    content = providerConfig.extractText(data);
  } else {
    // Proxy call — use the Cloudflare Pages Function (server holds the key)
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        model,
        endpoint: apiEndpoint !== providerConfig.defaultEndpoint ? apiEndpoint : undefined,
        systemPrompt,
        userPrompt,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error((data as { error?: string }).error ?? `Proxy error ${response.status}`);
    }

    const data = await response.json() as { text: string };
    content = data.text;
  }

  if (!content) {
    throw new Error('Empty response from API. Try again.');
  }

  // Parse JSON — handle potential markdown code fences
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '');
  }

  let result: AIGenerateResult;
  try {
    result = JSON.parse(jsonStr);
  } catch {
    throw new Error('Failed to parse AI response as JSON. Try regenerating.');
  }

  // Validate structure
  if (!result.summary || !Array.isArray(result.experience) || !Array.isArray(result.skillGroups)) {
    throw new Error('AI response missing required fields. Try regenerating.');
  }

  return result;
}
