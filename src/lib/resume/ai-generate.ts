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

export interface AIAssessment {
  jdAnalysis: string;
  tailoringApproach: string;
  strengths: string[];
  gaps: string[];
  overallFit: 'strong' | 'good' | 'moderate' | 'stretch';
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
  assessment: AIAssessment;
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

const SYSTEM_PROMPT = `You are an expert resume writer specializing in ATS-optimized cybersecurity and threat intelligence resumes. Your goal is to maximize ATS keyword match rates while keeping content 100% truthful.

STRICT RULES:
1. ONLY use facts from the provided master resume data. NEVER fabricate experience, skills, metrics, or achievements.
2. Rewrite EVERY experience bullet to incorporate as many JD keywords as possible while sounding natural. Each bullet should contain 2-4 JD keywords minimum.
3. Use strong Harvard-style action verbs (Spearheaded, Architected, Engineered, Investigated, Deployed, Pioneered, etc.).
4. PRESERVE all quantitative metrics from the original data (e.g., "17 articles", "10+ tools", "4 regions", "100+ officers").
5. Front-load the most JD-relevant information in each bullet.
6. For skills: reorder to prioritize JD-matched terms. You MUST add recognized synonyms the candidate demonstrably has (e.g., add "SIEM" if they mention Splunk/Elastic; add "threat modeling" if they do threat analysis). Be aggressive — add every legitimate skill variant.
7. For the summary: write 3-4 impactful sentences that PACK IN as many JD keywords as possible while referencing the candidate's actual accomplishments. The summary is prime ATS real estate — use it.
8. For projectOrder and publicationOrder: rank by JD relevance, most relevant first.
9. Include an "assessment" object with your analysis of the JD, how you tailored the resume, candidate strengths, gaps, and overall fit rating.
10. Return ONLY valid JSON — no markdown fences, no commentary, no explanation.
11. ATS OPTIMIZATION: Extract the top technical terms, tools, methodologies, and domain keywords from the JD. Make sure at least 70% of these appear somewhere in the resume — in bullets, skills, summary, or project descriptions. Distribute keywords across sections for maximum coverage.`;

function buildUserPrompt(input: AIGenerateInput): string {
  const { master, jobDescriptionText, targetRole } = input;

  // Pre-extract key terms from the JD to guide the AI
  const jdLower = jobDescriptionText.toLowerCase();
  const techTerms = new Set<string>();
  const importantPatterns = [
    // Security domain
    'threat intelligence', 'threat hunting', 'malware analysis', 'incident response',
    'ransomware', 'phishing', 'vulnerability', 'penetration testing', 'red team',
    'blue team', 'purple team', 'soc', 'siem', 'soar', 'edr', 'xdr', 'ndr',
    'mitre att&ck', 'mitre', 'kill chain', 'ioc', 'osint', 'dfir', 'forensics',
    'detection engineering', 'threat modeling', 'risk assessment', 'compliance',
    'devsecops', 'appsec', 'cloud security', 'network security', 'endpoint',
    // Tech
    'python', 'javascript', 'typescript', 'node.js', 'react', 'sql', 'api',
    'rest', 'graphql', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd',
    'automation', 'machine learning', 'ai', 'llm', 'nlp',
    // Platforms
    'splunk', 'elastic', 'virustotal', 'opencti', 'jira', 'confluence',
    'sentinel', 'crowdstrike', 'carbon black', 'palo alto',
    // Process
    'research', 'published', 'training', 'mentoring', 'leadership',
    'cross-functional', 'collaboration', 'technical writing', 'presentation',
  ];

  for (const term of importantPatterns) {
    if (jdLower.includes(term)) techTerms.add(term);
  }

  const keyTermsList = techTerms.size > 0
    ? `\n## Key JD Terms to Incorporate\nThese terms were detected in the JD. Maximize their presence across your output:\n${Array.from(techTerms).join(', ')}\n`
    : '';

  return `## Candidate Master Resume Data
${JSON.stringify(master, null, 2)}

## Target Job Description
${jobDescriptionText}
${keyTermsList}
${targetRole ? `## Target Role Title\n${targetRole}` : '## Infer the most appropriate role title from the JD.'}

## Task
Rewrite this candidate's resume content to maximize ATS keyword alignment with the target JD while staying 100% truthful to their actual experience. Your goal is to achieve the highest possible keyword match rate (aim for 70%+ of domain-specific JD terms appearing in the resume).

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
  "publicationOrder": ["pub-id-most-relevant-first"],
  "assessment": {
    "jdAnalysis": "2-3 sentence analysis of what this JD is really looking for — the core competencies, seniority level, and team context",
    "tailoringApproach": "2-3 sentence explanation of how you tailored the resume — what you emphasized, reworded, or reordered and why",
    "strengths": ["3-5 specific areas where the candidate strongly matches the JD"],
    "gaps": ["1-3 areas where the candidate's experience is weaker relative to the JD, with honest assessment"],
    "overallFit": "strong|good|moderate|stretch — honest rating of candidate-JD alignment"
  }
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

  // Always route through the Cloudflare Pages Function proxy.
  // This avoids CORS issues with third-party API endpoints.
  // The proxy makes the server-side call and returns the result.
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      apiKey: apiKey || undefined,
      model,
      endpoint: apiEndpoint ? apiEndpoint.replace(/\/+$/, '') : undefined,
      systemPrompt,
      userPrompt,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    const msg = (data as { error?: string }).error ?? `API error ${response.status}`;
    throw new Error(msg);
  }

  const responseData = await response.json() as { text: string };
  const content = responseData.text;

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
