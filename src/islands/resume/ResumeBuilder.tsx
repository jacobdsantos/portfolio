import { useState, useRef, useEffect } from 'react';
import { useResumeStore } from './state/store';
import TemplateCleanModern from './templates/TemplateCleanModern';
import TemplateHarvardClassic from './templates/TemplateHarvardClassic';
import TemplateTechnical from './templates/TemplateTechnical';
import TemplateExecutive from './templates/TemplateExecutive';
import type { TemplateId, ResumeRenderModel } from '../../lib/resume/types';
import { getProviders } from '../../lib/resume/ai-generate';
import type { ProviderId } from '../../lib/resume/ai-generate';

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const FONT = { fontFamily: "'Space Grotesk', sans-serif" };
const LABEL = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8b949e]';
const INPUT =
  'w-full rounded-lg border border-[#2a3140] bg-[#0d1117] px-3 py-2 text-sm text-[#e8edf5] placeholder-[#545d68] outline-none transition-colors focus:border-[#f0a63a]/50';
const BTN_PRIMARY =
  'rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40';
const BTN_SECONDARY =
  'rounded-lg border border-[#2a3140] px-3 py-2 text-xs font-medium text-[#8b949e] transition-colors hover:border-[#3a4250] hover:text-[#e8edf5]';

/* ------------------------------------------------------------------ */
/*  Resume Preview (read-only, used in print/PDF)                      */
/* ------------------------------------------------------------------ */

function ResumePreview({ renderModel }: { renderModel: ResumeRenderModel; templateId?: TemplateId }) {
  const templateId = renderModel.meta.templateId;
  switch (templateId) {
    case 'clean':
      return <TemplateCleanModern renderModel={renderModel} />;
    case 'harvard':
      return <TemplateHarvardClassic renderModel={renderModel} />;
    case 'technical':
      return <TemplateTechnical renderModel={renderModel} />;
    case 'executive':
      return <TemplateExecutive renderModel={renderModel} />;
    default:
      return <TemplateCleanModern renderModel={renderModel} />;
  }
}

/* ------------------------------------------------------------------ */
/*  API Settings (collapsible)                                         */
/* ------------------------------------------------------------------ */

const PROVIDERS = getProviders();

function APISettings() {
  const provider = useResumeStore((s) => s.provider);
  const apiKey = useResumeStore((s) => s.apiKey);
  const apiEndpoint = useResumeStore((s) => s.apiEndpoint);
  const model = useResumeStore((s) => s.model);
  const setProvider = useResumeStore((s) => s.setProvider);
  const setApiKey = useResumeStore((s) => s.setApiKey);
  const setApiEndpoint = useResumeStore((s) => s.setApiEndpoint);
  const setModel = useResumeStore((s) => s.setModel);

  const [open, setOpen] = useState(!apiKey);

  const keyPlaceholder =
    provider === 'anthropic' ? 'sk-ant-...' :
    provider === 'openai' ? 'sk-...' :
    'AIza...';

  return (
    <div className="rounded-lg border border-[#2a3140] bg-[#0a0e14] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-xs font-medium text-[#8b949e] hover:text-[#e8edf5] transition-colors"
        style={FONT}
      >
        <span className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
          API Configuration
          {apiKey && (
            <span className="rounded-full bg-[#f0a63a]/15 px-1.5 py-0.5 text-[10px] text-[#f0a63a]">
              {PROVIDERS.find((p) => p.id === provider)?.label ?? 'configured'}
            </span>
          )}
        </span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-[#2a3140] px-3 py-3">
          {/* Provider selector */}
          <div>
            <span className={LABEL} style={FONT}>Provider</span>
            <div className="flex gap-1.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                    provider === p.id
                      ? 'border-[#f0a63a] bg-[#f0a63a]/10 text-[#f0a63a]'
                      : 'border-[#2a3140] text-[#545d68] hover:border-[#3a4250] hover:text-[#8b949e]'
                  }`}
                  style={FONT}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className={LABEL} style={FONT}>API Key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={keyPlaceholder}
              className={INPUT}
              style={FONT}
            />
          </label>

          <label className="block">
            <span className={LABEL} style={FONT}>Endpoint</span>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              placeholder={PROVIDERS.find((p) => p.id === provider)?.defaultEndpoint ?? ''}
              className={INPUT}
              style={FONT}
            />
          </label>

          <label className="block">
            <span className={LABEL} style={FONT}>Model</span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={PROVIDERS.find((p) => p.id === provider)?.defaultModel ?? ''}
              className={INPUT}
              style={FONT}
            />
          </label>

          <p className="text-[10px] text-[#3a4250] leading-relaxed">
            Optional: provide your own key for direct API calls. Leave blank to use the server-side key.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Assessment Panel                                                */
/* ------------------------------------------------------------------ */

const FIT_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  strong:   { color: '#f0a63a', label: 'Strong Fit',   bg: '#f0a63a' },
  good:     { color: '#f0a63a', label: 'Good Fit',     bg: '#f0a63a' },
  moderate: { color: '#f0b429', label: 'Moderate Fit',  bg: '#f0b429' },
  stretch:  { color: '#f56565', label: 'Stretch Role',  bg: '#f56565' },
};

function AIAssessmentPanel() {
  const getEffectiveOutput = useResumeStore((s) => s.getEffectiveOutput);
  const generationMode = useResumeStore((s) => s.generationMode);
  const effectiveOutput = getEffectiveOutput();

  if (!effectiveOutput || generationMode !== 'ai' || !effectiveOutput.aiAssessment) {
    // For local generation, show a simpler data-driven summary
    if (effectiveOutput && generationMode === 'local') {
      const { analysis } = effectiveOutput;
      return (
        <div className="space-y-3 rounded-lg border border-[#2a3140] bg-[#0a0e14] p-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#545d68]" style={FONT}>
              Local Generation Summary
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-[#0d1117] px-2.5 py-2 text-center">
              <div className="text-lg font-bold" style={{ color: analysis.atsScore >= 60 ? '#f0a63a' : analysis.atsScore >= 40 ? '#f0b429' : '#f56565', ...FONT }}>
                {analysis.atsScore}
              </div>
              <div className="text-[9px] text-[#545d68]">ATS Score</div>
            </div>
            <div className="rounded-md bg-[#0d1117] px-2.5 py-2 text-center">
              <div className="text-lg font-bold text-[#8b949e]" style={FONT}>
                {analysis.matchedKeywords.length}/{analysis.matchedKeywords.length + analysis.missingKeywords.length}
              </div>
              <div className="text-[9px] text-[#545d68]">Keywords</div>
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-[#3a4250]">
            Rule-based generation matched keywords by string analysis. Use AI mode for intelligent bullet rewriting and deeper JD alignment.
          </p>
        </div>
      );
    }
    return null;
  }

  const { aiAssessment, analysis } = effectiveOutput;
  const fit = FIT_CONFIG[aiAssessment.overallFit] ?? FIT_CONFIG.moderate;

  return (
    <div className="space-y-3 rounded-lg border border-[#2a3140] bg-[#0a0e14] p-3">
      {/* Header with fit badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#545d68]" style={FONT}>
          AI Assessment
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: `${fit.bg}15`, color: fit.color }}
        >
          {fit.label}
        </span>
      </div>

      {/* ATS + Keywords row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-[#0d1117] px-2.5 py-2 text-center">
          <div className="text-lg font-bold" style={{ color: analysis.atsScore >= 60 ? '#f0a63a' : analysis.atsScore >= 40 ? '#f0b429' : '#f56565', ...FONT }}>
            {analysis.atsScore}
          </div>
          <div className="text-[9px] text-[#545d68]">ATS Score</div>
        </div>
        <div className="rounded-md bg-[#0d1117] px-2.5 py-2 text-center">
          <div className="text-lg font-bold text-[#8b949e]" style={FONT}>
            {analysis.matchedKeywords.length}/{analysis.matchedKeywords.length + analysis.missingKeywords.length}
          </div>
          <div className="text-[9px] text-[#545d68]">Keywords</div>
        </div>
      </div>

      {/* JD Analysis */}
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase text-[#545d68]" style={FONT}>
          JD Analysis
        </div>
        <p className="text-[11px] leading-relaxed text-[#8b949e]">
          {aiAssessment.jdAnalysis}
        </p>
      </div>

      {/* Tailoring Approach */}
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase text-[#545d68]" style={FONT}>
          Tailoring Approach
        </div>
        <p className="text-[11px] leading-relaxed text-[#8b949e]">
          {aiAssessment.tailoringApproach}
        </p>
      </div>

      {/* Strengths */}
      {aiAssessment.strengths.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase text-[#545d68]" style={FONT}>
            Strengths
          </div>
          <ul className="space-y-0.5">
            {aiAssessment.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#8b949e]">
                <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-[#f0a63a]" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {aiAssessment.gaps.length > 0 && (
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase text-[#545d68]" style={FONT}>
            Gaps to Address
          </div>
          <ul className="space-y-0.5">
            {aiAssessment.gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-[#8b949e]">
                <span className="mt-1 inline-block h-1 w-1 shrink-0 rounded-full bg-[#f0b429]" />
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Generate Tab                                                       */
/* ------------------------------------------------------------------ */

function JDInputPanel() {
  const jdText = useResumeStore((s) => s.jdText);
  const setJdText = useResumeStore((s) => s.setJdText);
  const generate = useResumeStore((s) => s.generate);
  const generateLocal = useResumeStore((s) => s.generateLocal);
  const isGenerating = useResumeStore((s) => s.isGenerating);
  const targetRole = useResumeStore((s) => s.targetRole);
  const setTargetRole = useResumeStore((s) => s.setTargetRole);
  const generateOutput = useResumeStore((s) => s.generateOutput);
  const error = useResumeStore((s) => s.error);
  const generationMode = useResumeStore((s) => s.generationMode);

  return (
    <div className="space-y-3">
      <APISettings />

      <label className="block">
        <span className={LABEL} style={FONT}>Target Role (optional)</span>
        <input
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="Auto-detected from JD if blank"
          className={INPUT}
          style={FONT}
        />
      </label>

      <label className="block">
        <span className={LABEL} style={FONT}>Job Description</span>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={8}
          className={`${INPUT} resize-y`}
          style={FONT}
        />
      </label>

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-[#f56565]/30 bg-[#f56565]/10 px-3 py-2 text-xs text-[#f56565]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={generate}
          disabled={!jdText.trim() || isGenerating}
          className={BTN_PRIMARY}
          style={{
            ...FONT,
            backgroundColor: jdText.trim() && !isGenerating ? '#f0a63a' : '#2a3140',
            color: jdText.trim() && !isGenerating ? '#07090f' : '#545d68',
            flex: 1,
          }}
        >
          {isGenerating
            ? 'Generating...'
            : generateOutput ? 'Regenerate with AI' : 'Generate with AI'}
        </button>

        <button
            onClick={generateLocal}
            disabled={!jdText.trim() || isGenerating}
            className={BTN_SECONDARY}
            style={FONT}
            title="Generate without AI (rule-based fallback)"
          >
            Local
          </button>
      </div>

      {/* Generation mode indicator */}
      {generationMode && generateOutput && (
        <div className="flex items-center gap-1.5 text-[10px] text-[#545d68]">
          <span
            className={`inline-block h-1.5 w-1.5 rounded-full ${generationMode === 'ai' ? 'bg-[#f0a63a]' : 'bg-[#f0b429]'}`}
          />
          {generationMode === 'ai' ? 'AI-generated' : 'Rule-based (local)'}
        </div>
      )}

      {/* Char count */}
      <div className="text-[10px] text-[#3a4250]">
        {jdText.length.toLocaleString()} chars
      </div>

      {/* AI Assessment Panel */}
      <AIAssessmentPanel />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit Tab                                                           */
/* ------------------------------------------------------------------ */

function EditableText({
  value,
  onChange,
  onReset,
  isEdited,
  rows = 3,
  label,
}: {
  value: string;
  onChange: (text: string) => void;
  onReset?: () => void;
  isEdited: boolean;
  rows?: number;
  label?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      ref.current.setSelectionRange(ref.current.value.length, ref.current.value.length);
    }
  }, [editing]);

  const handleBlur = () => {
    setEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        rows={rows}
        className="w-full rounded border border-[#f0a63a]/30 bg-[#0d1117] px-2 py-1.5 text-xs text-[#e8edf5] outline-none"
        style={FONT}
      />
    );
  }

  return (
    <div className="group relative">
      {label && (
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase text-[#545d68]" style={FONT}>
            {label}
          </span>
          <div className="flex items-center gap-1">
            {isEdited && onReset && (
              <button
                onClick={onReset}
                className="text-[10px] text-[#f0b429] hover:text-[#f0b429]/80"
                title="Reset to AI version"
              >
                reset
              </button>
            )}
            {isEdited && (
              <span className="rounded bg-[#f0b429]/15 px-1 py-0.5 text-[9px] text-[#f0b429]">
                edited
              </span>
            )}
          </div>
        </div>
      )}
      <div
        onClick={() => setEditing(true)}
        className="cursor-text rounded border border-transparent px-2 py-1.5 text-xs leading-relaxed text-[#c8d1dc] transition-colors hover:border-[#2a3140] hover:bg-[#0d1117]/50"
      >
        {value}
      </div>
    </div>
  );
}

function EditPanel() {
  const generateOutput = useResumeStore((s) => s.generateOutput);
  const editedSummary = useResumeStore((s) => s.editedSummary);
  const editedBullets = useResumeStore((s) => s.editedBullets);
  const editSummary = useResumeStore((s) => s.editSummary);
  const editBullet = useResumeStore((s) => s.editBullet);
  const resetEdit = useResumeStore((s) => s.resetEdit);
  const resetAllEdits = useResumeStore((s) => s.resetAllEdits);
  const getEffectiveOutput = useResumeStore((s) => s.getEffectiveOutput);

  const effectiveOutput = getEffectiveOutput();

  if (!effectiveOutput || !generateOutput) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[#545d68]" style={FONT}>Generate a resume first to edit</p>
      </div>
    );
  }

  const editCount = Object.keys(editedBullets).length + (editedSummary !== null ? 1 : 0);

  // Get the current (edited or original) summary and experience
  const summarySection = effectiveOutput.renderModel.sections.find((s) => s.type === 'summary');
  const experienceSection = effectiveOutput.renderModel.sections.find((s) => s.type === 'experience');
  const originalSummary = generateOutput.renderModel.sections.find((s) => s.type === 'summary');

  const currentSummary =
    editedSummary ??
    (summarySection?.type === 'summary' ? summarySection.blocks[0] : '') ?? '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#8b949e]" style={FONT}>
          Click any text to edit
        </span>
        {editCount > 0 && (
          <button onClick={resetAllEdits} className="text-[10px] text-[#f0b429] hover:underline">
            Reset all ({editCount})
          </button>
        )}
      </div>

      {/* Summary */}
      {summarySection?.type === 'summary' && (
        <EditableText
          label="Professional Summary"
          value={currentSummary}
          onChange={editSummary}
          onReset={() => resetEdit('summary')}
          isEdited={editedSummary !== null}
          rows={5}
        />
      )}

      {/* Experience bullets */}
      {experienceSection?.type === 'experience' &&
        experienceSection.items.map((exp) => (
          <div key={exp.company + exp.role}>
            <div className="mb-1.5 text-[10px] font-semibold uppercase text-[#545d68]" style={FONT}>
              {exp.role} - {exp.company}
            </div>
            <div className="space-y-1">
              {exp.bullets.map((bullet) => (
                <EditableText
                  key={bullet.id}
                  value={editedBullets[bullet.id] ?? bullet.text}
                  onChange={(text) => editBullet(bullet.id, text)}
                  onReset={() => resetEdit(bullet.id)}
                  isEdited={bullet.id in editedBullets}
                  rows={3}
                />
              ))}
            </div>
          </div>
        ))}

      {/* Live ATS score */}
      <div className="rounded-lg border border-[#2a3140] bg-[#0a0e14] px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#545d68]" style={FONT}>Live ATS Score</span>
          <span
            className="text-sm font-bold"
            style={{
              ...FONT,
              color:
                effectiveOutput.analysis.atsScore >= 80
                  ? '#f0a63a'
                  : effectiveOutput.analysis.atsScore >= 60
                    ? '#f0b429'
                    : '#f56565',
            }}
          >
            {effectiveOutput.analysis.atsScore}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-[#3a4250]">
          {effectiveOutput.analysis.matchedKeywords.length} / {effectiveOutput.analysis.matchedKeywords.length + effectiveOutput.analysis.missingKeywords.length} keywords matched
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Analysis Tab                                                       */
/* ------------------------------------------------------------------ */

function AnalysisPanel() {
  const getEffectiveOutput = useResumeStore((s) => s.getEffectiveOutput);
  const effectiveOutput = getEffectiveOutput();

  if (!effectiveOutput) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[#545d68]" style={FONT}>Generate a resume first to see the analysis</p>
      </div>
    );
  }

  const { analysis } = effectiveOutput;
  const scoreColor = analysis.atsScore >= 80 ? '#f0a63a' : analysis.atsScore >= 60 ? '#f0b429' : '#f56565';
  const scoreLabel = analysis.atsScore >= 80 ? 'Excellent' : analysis.atsScore >= 60 ? 'Good' : analysis.atsScore >= 40 ? 'Fair' : 'Low';

  return (
    <div className="space-y-5">
      {/* ATS Score */}
      <div>
        <div className={LABEL} style={FONT}>ATS Compatibility Score</div>
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl text-xl font-bold"
            style={{ backgroundColor: `${scoreColor}15`, color: scoreColor, ...FONT }}
          >
            {analysis.atsScore}
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: scoreColor }}>{scoreLabel}</div>
            <div className="text-xs text-[#545d68]">
              {analysis.matchedKeywords.length} of {analysis.matchedKeywords.length + analysis.missingKeywords.length} keywords matched
            </div>
          </div>
        </div>
      </div>

      {/* Matched keywords */}
      <div>
        <div className={LABEL} style={FONT}>Matched Keywords ({analysis.matchedKeywords.length})</div>
        <div className="flex flex-wrap gap-1.5">
          {analysis.matchedKeywords.slice(0, 25).map((kw) => (
            <span key={kw} className="rounded bg-[#f0a63a]/10 px-2 py-0.5 text-xs text-[#f0a63a]">{kw}</span>
          ))}
        </div>
      </div>

      {/* Missing keywords */}
      {analysis.missingKeywords.length > 0 && (
        <div>
          <div className={LABEL} style={FONT}>Missing Keywords ({analysis.missingKeywords.length})</div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.missingKeywords.slice(0, 20).map((kw) => (
              <span key={kw} className="rounded bg-[#f56565]/10 px-2 py-0.5 text-xs text-[#f56565]">{kw}</span>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-[#3a4250] leading-relaxed">
            Switch to the Edit tab to incorporate missing keywords into your bullets. ATS score updates live as you type.
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Customize Tab                                                      */
/* ------------------------------------------------------------------ */

function CustomizePanel() {
  const templateId = useResumeStore((s) => s.templateId);
  const setTemplateId = useResumeStore((s) => s.setTemplateId);
  const maxPages = useResumeStore((s) => s.maxPages);
  const setMaxPages = useResumeStore((s) => s.setMaxPages);
  const includeSections = useResumeStore((s) => s.includeSections);
  const toggleSection = useResumeStore((s) => s.toggleSection);
  const getEffectiveOutput = useResumeStore((s) => s.getEffectiveOutput);
  const master = useResumeStore((s) => s.master);

  const effectiveOutput = getEffectiveOutput();
  const [saving, setSaving] = useState(false);
  const filename = `${master.basics.name.replace(/\s+/g, '_')}_Resume.pdf`;

  const handlePdf = async () => {
    setSaving(true);
    try {
      const { exportPdf } = await import('./export/pdf');
      await exportPdf('resume-preview', filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const templates: { id: TemplateId; label: string }[] = [
    { id: 'clean', label: 'Clean Modern' },
    { id: 'harvard', label: 'Harvard Classic' },
    { id: 'technical', label: 'Technical' },
    { id: 'executive', label: 'Executive' },
  ];

  const sectionKeys: Array<{ key: keyof typeof includeSections; label: string }> = [
    { key: 'summary', label: 'Summary' },
    { key: 'skills', label: 'Technical Skills' },
    { key: 'experience', label: 'Experience' },
    { key: 'projects', label: 'Projects' },
    { key: 'education', label: 'Education' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'publications', label: 'Publications' },
  ];

  return (
    <div className="space-y-5">
      {/* Template */}
      <div>
        <div className={LABEL} style={FONT}>Template</div>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                templateId === t.id
                  ? 'border-[#f0a63a] bg-[#f0a63a]/10 text-[#f0a63a]'
                  : 'border-[#2a3140] text-[#545d68] hover:border-[#3a4250] hover:text-[#8b949e]'
              }`}
              style={FONT}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Page Length */}
      <div>
        <div className={LABEL} style={FONT}>Page Length</div>
        <div className="flex gap-2">
          {([1, 2] as const).map((pages) => (
            <button
              key={pages}
              onClick={() => setMaxPages(pages)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                maxPages === pages
                  ? 'border-[#f0a63a] bg-[#f0a63a]/10 text-[#f0a63a]'
                  : 'border-[#2a3140] text-[#545d68] hover:border-[#3a4250]'
              }`}
              style={FONT}
            >
              {pages} page{pages > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Section toggles */}
      <div>
        <div className={LABEL} style={FONT}>Sections</div>
        <div className="space-y-1.5">
          {sectionKeys.map((s) => (
            <label key={s.key} className="flex cursor-pointer items-center gap-2.5 group">
              <div
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  includeSections[s.key]
                    ? 'border-[#f0a63a] bg-[#f0a63a]'
                    : 'border-[#3a4250] group-hover:border-[#545d68]'
                }`}
                onClick={() => toggleSection(s.key)}
              >
                {includeSections[s.key] && (
                  <svg className="h-3 w-3 text-[#07090f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span
                className="text-xs text-[#8b949e] transition-colors group-hover:text-[#e8edf5]"
                style={FONT}
                onClick={() => toggleSection(s.key)}
              >
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="border-t border-[#2a3140] pt-4">
        <div className={LABEL} style={FONT}>Export</div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            disabled={!effectiveOutput}
            className={`flex-1 ${BTN_SECONDARY} disabled:cursor-not-allowed disabled:opacity-40`}
            style={FONT}
          >
            Print
          </button>
          <button
            onClick={handlePdf}
            disabled={!effectiveOutput || saving}
            className={BTN_PRIMARY}
            style={{
              ...FONT,
              flex: 1,
              backgroundColor: effectiveOutput && !saving ? '#f0a63a' : '#2a3140',
              color: effectiveOutput && !saving ? '#07090f' : '#545d68',
            }}
          >
            {saving ? 'Saving...' : 'Save PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

type SidebarTab = 'generate' | 'edit' | 'customize' | 'analysis';

export default function ResumeBuilder() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('generate');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isGenerating = useResumeStore((s) => s.isGenerating);
  const getEffectiveOutput = useResumeStore((s) => s.getEffectiveOutput);

  const effectiveOutput = getEffectiveOutput();
  const templateId = useResumeStore((s) => s.templateId);

  const tabs: { id: SidebarTab; label: string; icon: string }[] = [
    {
      id: 'generate',
      label: 'Generate',
      icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
    },
    {
      id: 'customize',
      label: 'Customize',
      icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75',
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6',
    },
  ];

  return (
    <div
      className="flex min-h-[80vh] gap-0 overflow-hidden rounded-xl border border-[#2a3140]"
      style={{ backgroundColor: '#0d1117' }}
    >
      {/* Sidebar */}
      <div
        className={`shrink-0 border-r border-[#2a3140] transition-all duration-300 ${
          sidebarOpen ? 'w-[380px]' : 'w-0 overflow-hidden'
        }`}
        style={{ backgroundColor: '#0a0e14' }}
      >
        <div className="flex h-full w-[380px] flex-col">
          {/* Sidebar tabs */}
          <div className="flex border-b border-[#2a3140]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1 px-2 py-3 text-[11px] font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#f0a63a] text-[#f0a63a]'
                    : 'text-[#545d68] hover:text-[#8b949e]'
                }`}
                style={FONT}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'generate' && <JDInputPanel />}
            {activeTab === 'edit' && <EditPanel />}
            {activeTab === 'customize' && <CustomizePanel />}
            {activeTab === 'analysis' && <AnalysisPanel />}
          </div>
        </div>
      </div>

      {/* Toggle sidebar */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex w-6 shrink-0 items-center justify-center border-r border-[#2a3140] text-[#545d68] transition-colors hover:bg-[#161d27] hover:text-[#8b949e]"
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <svg
          className={`h-4 w-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Main preview area */}
      <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#161d27' }}>
        {isGenerating ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#2a3140] border-t-[#f0a63a]" />
              <p className="mt-4 text-sm font-medium text-[#545d68]" style={FONT}>
                Generating your tailored resume...
              </p>
              <p className="mt-1 text-xs text-[#3a4250]">
                Claude is rewriting your experience to match the JD
              </p>
            </div>
          </div>
        ) : effectiveOutput ? (
          <div id="resume-preview">
            <ResumePreview renderModel={effectiveOutput.renderModel} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center">
              <svg
                className="mx-auto h-16 w-16 text-[#2a3140]"
                fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
              >
                <path
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
              <p className="mt-4 text-sm font-medium text-[#545d68]" style={FONT}>
                Paste a job description to generate a tailored resume
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#3a4250]">
                AI will rewrite your experience bullets, generate a custom summary, reorder your skills, and rank projects — all tailored to match the JD's keywords and requirements.
              </p>
              <p className="mt-3 text-[10px] leading-relaxed text-[#3a4250] border-t border-[#2a3140] pt-3">
                Set your API key and endpoint in <strong className="text-[#545d68]">API Configuration</strong> to enable AI generation. Without a key, the builder uses rule-based keyword matching.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
