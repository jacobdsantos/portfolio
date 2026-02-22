import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { validateResumeMaster } from '../schema';
import { extractKeywords } from '../keyword-extract';
import { generateTailoredResume } from '../generate';
import type { GenerateInput } from '../generate';
import { tokenize, normalize, removeStopwords, extractBigrams, simpleHash } from '../text';
import { computeAtsScore, getAtsGrade, findMissingKeywords } from '../ats';
import type { ResumeMaster } from '../types';

// Load test fixtures
const fixturesDir = resolve(__dirname, '../../../../tests/fixtures');

function loadResumeMaster(): unknown {
  const raw = readFileSync(
    resolve(__dirname, '../../../../src/data/resume-master.json'),
    'utf-8',
  );
  return JSON.parse(raw);
}

function loadSampleJD(): string {
  return readFileSync(resolve(fixturesDir, 'sample-jd.txt'), 'utf-8');
}

function loadExpectedKeywords(): Array<{ term: string; weight: number }> {
  const raw = readFileSync(
    resolve(fixturesDir, 'expected-keywords.json'),
    'utf-8',
  );
  return JSON.parse(raw);
}

// --- Schema Validation ---

describe('resume-master.json schema validation', () => {
  it('should validate against the zod schema', () => {
    const data = loadResumeMaster();
    const result = validateResumeMaster(data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.basics.name).toBe('Jacob Santos');
      expect(result.data.experience.length).toBeGreaterThanOrEqual(2);
      expect(result.data.projects.length).toBeGreaterThanOrEqual(5);
      expect(result.data.summaries.length).toBeGreaterThanOrEqual(2);
      expect(result.data.skills.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('should reject data missing required fields', () => {
    const result = validateResumeMaster({ basics: { name: 'Test' } });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email format', () => {
    const data = loadResumeMaster() as Record<string, unknown>;
    const modified = {
      ...data,
      basics: { ...(data.basics as Record<string, unknown>), email: 'not-an-email' },
    };
    const result = validateResumeMaster(modified);
    expect(result.success).toBe(false);
  });

  it('should reject empty experience bullets', () => {
    const data = loadResumeMaster() as Record<string, unknown>;
    const modified = {
      ...data,
      experience: [
        {
          id: 'exp-test',
          company: 'Test',
          role: 'Test',
          location: 'Test',
          startDate: '2024',
          endDate: 'Present',
          tags: [],
          bullets: [], // empty - should fail min(1)
        },
      ],
    };
    const result = validateResumeMaster(modified);
    expect(result.success).toBe(false);
  });
});

// --- Text Utilities ---

describe('text utilities', () => {
  describe('tokenize', () => {
    it('should split text into lowercase tokens', () => {
      const tokens = tokenize('Hello World Test');
      expect(tokens).toEqual(['hello', 'world', 'test']);
    });

    it('should preserve hyphenated words', () => {
      const tokens = tokenize('cross-platform threats');
      expect(tokens).toContain('cross-platform');
    });

    it('should preserve ampersand terms', () => {
      const tokens = tokenize('MITRE ATT&CK framework');
      expect(tokens).toContain('att&ck');
    });

    it('should handle empty string', () => {
      expect(tokenize('')).toEqual([]);
    });
  });

  describe('normalize', () => {
    it('should lowercase and collapse whitespace', () => {
      expect(normalize('  Hello   World  ')).toBe('hello world');
    });
  });

  describe('removeStopwords', () => {
    it('should filter stopwords', () => {
      const result = removeStopwords(['the', 'ransomware', 'is', 'a', 'threat']);
      expect(result).toEqual(['ransomware', 'threat']);
    });
  });

  describe('extractBigrams', () => {
    it('should produce adjacent word pairs', () => {
      const bigrams = extractBigrams(['threat', 'intelligence', 'platform']);
      expect(bigrams).toEqual(['threat intelligence', 'intelligence platform']);
    });

    it('should return empty for single token', () => {
      expect(extractBigrams(['single'])).toEqual([]);
    });
  });

  describe('simpleHash', () => {
    it('should produce consistent results', () => {
      const hash1 = simpleHash('test input');
      const hash2 = simpleHash('test input');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const hash1 = simpleHash('input a');
      const hash2 = simpleHash('input b');
      expect(hash1).not.toBe(hash2);
    });

    it('should return a hex string', () => {
      const hash = simpleHash('hello');
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });
});

// --- ATS Scoring ---

describe('ATS scoring', () => {
  describe('computeAtsScore', () => {
    it('should return 100 when all keywords matched', () => {
      expect(computeAtsScore(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(100);
    });

    it('should return 0 when no keywords matched', () => {
      expect(computeAtsScore([], ['a', 'b', 'c'])).toBe(0);
    });

    it('should return 0 when total keywords is empty', () => {
      expect(computeAtsScore([], [])).toBe(0);
    });

    it('should return correct percentage', () => {
      expect(computeAtsScore(['a', 'b'], ['a', 'b', 'c', 'd'])).toBe(50);
    });
  });

  describe('getAtsGrade', () => {
    it('should return excellent for >= 80', () => {
      expect(getAtsGrade(80)).toBe('excellent');
      expect(getAtsGrade(100)).toBe('excellent');
    });

    it('should return good for 60-79', () => {
      expect(getAtsGrade(60)).toBe('good');
      expect(getAtsGrade(79)).toBe('good');
    });

    it('should return fair for 40-59', () => {
      expect(getAtsGrade(40)).toBe('fair');
      expect(getAtsGrade(59)).toBe('fair');
    });

    it('should return poor for < 40', () => {
      expect(getAtsGrade(39)).toBe('poor');
      expect(getAtsGrade(0)).toBe('poor');
    });
  });

  describe('findMissingKeywords', () => {
    it('should return keywords not found in resume', () => {
      const missing = findMissingKeywords(
        ['python', 'rust', 'go'],
        ['python'],
      );
      expect(missing).toEqual(['rust', 'go']);
    });

    it('should be case-insensitive', () => {
      const missing = findMissingKeywords(['Python'], ['python']);
      expect(missing).toEqual([]);
    });
  });
});

// --- Keyword Extraction ---

describe('keyword extraction', () => {
  it('should extract keywords from sample JD', () => {
    const jdText = loadSampleJD();
    const keywords = extractKeywords(jdText);

    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords.length).toBeLessThanOrEqual(50);

    // All entries should have term and weight
    for (const kw of keywords) {
      expect(typeof kw.term).toBe('string');
      expect(typeof kw.weight).toBe('number');
      expect(kw.weight).toBeGreaterThan(0);
    }
  });

  it('should find key domain terms from the JD', () => {
    const jdText = loadSampleJD();
    const keywords = extractKeywords(jdText);
    const terms = keywords.map((k) => k.term);

    // These terms should definitely be extracted from the sample JD
    const expectedTerms = ['ransomware', 'python', 'osint'];
    for (const expected of expectedTerms) {
      expect(terms).toContain(expected);
    }
  });

  it('should rank domain-boosted terms higher', () => {
    const jdText = loadSampleJD();
    const keywords = extractKeywords(jdText);

    // ransomware should appear with a weight > 1 due to KEYWORD_WEIGHTS boosting
    const ransomware = keywords.find((k) => k.term === 'ransomware');
    expect(ransomware).toBeDefined();
    expect(ransomware!.weight).toBeGreaterThan(1);
  });

  it('should be sorted by weight descending', () => {
    const jdText = loadSampleJD();
    const keywords = extractKeywords(jdText);

    for (let i = 1; i < keywords.length; i++) {
      expect(keywords[i - 1].weight).toBeGreaterThanOrEqual(keywords[i].weight);
    }
  });

  it('should contain expected high-value keywords from the fixture', () => {
    const jdText = loadSampleJD();
    const keywords = extractKeywords(jdText);
    const expectedKeywords = loadExpectedKeywords();

    const extractedTerms = new Set(keywords.map((k) => k.term));

    // At least 60% of the expected keywords should be found
    let matchCount = 0;
    for (const expected of expectedKeywords) {
      if (extractedTerms.has(expected.term)) {
        matchCount++;
      }
    }

    const matchRate = matchCount / expectedKeywords.length;
    expect(matchRate).toBeGreaterThanOrEqual(0.6);
  });
});

// --- generateTailoredResume ---

describe('generateTailoredResume', () => {
  function makeInput(): GenerateInput {
    const master = loadResumeMaster() as ResumeMaster;
    const jdText = loadSampleJD();
    return {
      master,
      jobDescriptionText: jdText,
      options: {
        maxPages: 2,
        includeSections: {
          summary: true,
          skills: true,
          experience: true,
          projects: true,
          education: true,
          certifications: true,
          publications: true,
        },
      },
    };
  }

  it('should produce a valid render model', () => {
    const input = makeInput();
    const output = generateTailoredResume(input);

    expect(output.renderModel).toBeDefined();
    expect(output.renderModel.meta).toBeDefined();
    expect(output.renderModel.header).toBeDefined();
    expect(output.renderModel.sections).toBeDefined();
    expect(Array.isArray(output.renderModel.sections)).toBe(true);
  });

  it('should include all requested sections', () => {
    const input = makeInput();
    const output = generateTailoredResume(input);
    const sectionTypes = output.renderModel.sections.map((s) => s.type);

    expect(sectionTypes).toContain('summary');
    expect(sectionTypes).toContain('skills');
    expect(sectionTypes).toContain('experience');
    expect(sectionTypes).toContain('projects');
    expect(sectionTypes).toContain('education');
    expect(sectionTypes).toContain('publications');
  });

  it('should exclude sections when not requested', () => {
    const input = makeInput();
    input.options.includeSections.projects = false;
    input.options.includeSections.certifications = false;
    const output = generateTailoredResume(input);
    const sectionTypes = output.renderModel.sections.map((s) => s.type);

    expect(sectionTypes).not.toContain('projects');
    expect(sectionTypes).not.toContain('certifications');
  });

  it('should compute an ATS score between 0 and 100', () => {
    const input = makeInput();
    const output = generateTailoredResume(input);

    expect(output.analysis.atsScore).toBeGreaterThanOrEqual(0);
    expect(output.analysis.atsScore).toBeLessThanOrEqual(100);
  });

  it('should achieve a reasonable ATS score for a matching JD', () => {
    const input = makeInput();
    const output = generateTailoredResume(input);

    // Jacob's resume should match well against a threat researcher JD
    expect(output.analysis.atsScore).toBeGreaterThanOrEqual(30);
  });

  it('should provide analysis with detected focus areas', () => {
    const input = makeInput();
    const output = generateTailoredResume(input);

    expect(output.analysis).toBeDefined();
    expect(output.analysis.extractedKeywords.length).toBeGreaterThan(0);
    expect(output.analysis.detectedFocusAreas.length).toBeGreaterThan(0);
    expect(Object.keys(output.analysis.bulletSelections).length).toBeGreaterThan(0);
  });

  it('should be deterministic (same input produces same output, except timestamp)', () => {
    const input = makeInput();

    const output1 = generateTailoredResume(input);
    const output2 = generateTailoredResume(input);

    expect(output1.analysis.atsScore).toBe(output2.analysis.atsScore);
    expect(output1.analysis.matchedKeywords).toEqual(output2.analysis.matchedKeywords);
    expect(output1.analysis.missingKeywords).toEqual(output2.analysis.missingKeywords);
    expect(output1.analysis.detectedFocusAreas).toEqual(output2.analysis.detectedFocusAreas);
    expect(output1.analysis.bulletSelections).toEqual(output2.analysis.bulletSelections);

    // Sections should be identical
    expect(output1.renderModel.sections.length).toBe(
      output2.renderModel.sections.length,
    );
    for (let i = 0; i < output1.renderModel.sections.length; i++) {
      expect(output1.renderModel.sections[i]).toEqual(
        output2.renderModel.sections[i],
      );
    }
  });

  it('should NOT call fetch (pure function check)', () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    try {
      const input = makeInput();
      generateTailoredResume(input);
      expect(mockFetch).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('should set correct header information', () => {
    const input = makeInput();
    const output = generateTailoredResume(input);

    expect(output.renderModel.header.name).toBe('Jacob Santos');
    expect(output.renderModel.header.contactLines).toContain(
      'jacobsantos.d@gmail.com',
    );
    expect(output.renderModel.header.links.length).toBeGreaterThan(0);
  });

  it('should handle single-page mode by trimming content', () => {
    const input = makeInput();
    input.options.maxPages = 1;
    const output = generateTailoredResume(input);

    // In single page mode, total bullets should be limited
    let totalBullets = 0;
    for (const section of output.renderModel.sections) {
      if (section.type === 'experience') {
        for (const item of section.items) {
          totalBullets += item.bullets.length;
        }
      }
      if (section.type === 'projects') {
        for (const item of section.items) {
          totalBullets += item.bullets.length;
        }
      }
    }
    // Should be trimmed to roughly 18 or fewer
    expect(totalBullets).toBeLessThanOrEqual(18);
  });

  it('should use targetRole as header label when provided', () => {
    const input = makeInput();
    input.options.targetRole = 'Threat Intelligence Engineer';
    const output = generateTailoredResume(input);

    expect(output.renderModel.header.label).toBe('Threat Intelligence Engineer');
  });

  it('should detect research-related focus areas for a threat intel JD', () => {
    const input = makeInput();
    const output = generateTailoredResume(input);

    // A threat researcher JD should detect research or threat_intel focus
    const hasThreatFocus = output.analysis.detectedFocusAreas.some(
      (f) => ['research', 'threat_intel', 'engineering'].includes(f),
    );
    expect(hasThreatFocus).toBe(true);
  });
});
