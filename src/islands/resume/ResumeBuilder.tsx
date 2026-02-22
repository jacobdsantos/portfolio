import { useState } from 'react';
import { useResumeStore } from './state/store';
import TemplateCleanModern from './templates/TemplateCleanModern';
import TemplateHarvardClassic from './templates/TemplateHarvardClassic';
import TemplateTechnical from './templates/TemplateTechnical';
import TemplateExecutive from './templates/TemplateExecutive';
import type { TemplateId, ResumeRenderModel } from '../../lib/resume/types';

type SidebarTab = 'generate' | 'customize' | 'analysis';

function ResumePreview({ renderModel, templateId }: { renderModel: ResumeRenderModel; templateId: TemplateId }) {
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

function JDInputPanel() {
  const jdText = useResumeStore((s) => s.jdText);
  const setJdText = useResumeStore((s) => s.setJdText);
  const generate = useResumeStore((s) => s.generate);
  const isGenerating = useResumeStore((s) => s.isGenerating);
  const targetRole = useResumeStore((s) => s.targetRole);
  const setTargetRole = useResumeStore((s) => s.setTargetRole);
  const generateOutput = useResumeStore((s) => s.generateOutput);

  const charCount = jdText.length;

  return (
    <div className="space-y-3">
      <label className="block">
        <span
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8b949e]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Target Role (optional)
        </span>
        <input
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="Auto-detected from JD if blank"
          className="w-full rounded-lg border border-[#2a3140] bg-[#0d1117] px-3 py-2 text-sm text-[#e8edf5] placeholder-[#545d68] outline-none transition-colors focus:border-[#00dfa2]/50"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        />
      </label>

      <label className="block">
        <span
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8b949e]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Job Description
        </span>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description here. The engine will analyze it and generate a tailored resume aligned to this role..."
          rows={10}
          className="w-full resize-y rounded-lg border border-[#2a3140] bg-[#0d1117] px-3 py-2 text-sm text-[#e8edf5] placeholder-[#545d68] outline-none transition-colors focus:border-[#00dfa2]/50"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        />
      </label>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[#545d68]">
          {charCount.toLocaleString()} chars
        </span>
        <button
          onClick={generate}
          disabled={jdText.trim().length === 0 || isGenerating}
          className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            backgroundColor: jdText.trim().length > 0 && !isGenerating ? '#00dfa2' : '#2a3140',
            color: jdText.trim().length > 0 && !isGenerating ? '#07090f' : '#545d68',
          }}
        >
          {isGenerating ? 'Generating...' : generateOutput ? 'Regenerate Resume' : 'Generate Tailored Resume'}
        </button>
      </div>

      {/* Focus areas detected */}
      {generateOutput && (
        <div className="rounded-lg border border-[#2a3140] bg-[#0a0e14] p-3 mt-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Detected Focus Areas
          </div>
          <div className="flex flex-wrap gap-1.5">
            {generateOutput.analysis.detectedFocusAreas.map((focus) => (
              <span
                key={focus}
                className="rounded-full bg-[#00dfa2]/10 px-2.5 py-0.5 text-xs font-medium text-[#00dfa2]"
              >
                {focus.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisPanel() {
  const generateOutput = useResumeStore((s) => s.generateOutput);

  if (!generateOutput) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[#545d68]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Generate a resume first to see the analysis
        </p>
      </div>
    );
  }

  const { analysis } = generateOutput;
  const scoreColor = analysis.atsScore >= 80 ? '#00dfa2' : analysis.atsScore >= 60 ? '#f0b429' : '#f56565';
  const scoreLabel = analysis.atsScore >= 80 ? 'Excellent' : analysis.atsScore >= 60 ? 'Good' : analysis.atsScore >= 40 ? 'Fair' : 'Low';

  return (
    <div className="space-y-5">
      {/* ATS Score */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          ATS Compatibility Score
        </div>
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl text-xl font-bold"
            style={{ backgroundColor: `${scoreColor}15`, color: scoreColor, fontFamily: "'Space Grotesk', sans-serif" }}
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
        <div className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Matched Keywords ({analysis.matchedKeywords.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {analysis.matchedKeywords.slice(0, 20).map((kw) => (
            <span key={kw} className="rounded bg-[#00dfa2]/10 px-2 py-0.5 text-xs text-[#00dfa2]">
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* Missing keywords */}
      {analysis.missingKeywords.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Missing Keywords ({analysis.missingKeywords.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.missingKeywords.slice(0, 15).map((kw) => (
              <span key={kw} className="rounded bg-[#f56565]/10 px-2 py-0.5 text-xs text-[#f56565]">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bullet variant selections */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Bullet Variants Selected
        </div>
        <div className="space-y-1">
          {Object.entries(analysis.bulletSelections).map(([id, focus]) => (
            <div key={id} className="flex items-center justify-between text-xs">
              <span className="text-[#545d68] font-mono">{id}</span>
              <span className="rounded bg-[#6c5ce7]/10 px-2 py-0.5 text-[#6c5ce7]">
                {focus.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomizePanel() {
  const templateId = useResumeStore((s) => s.templateId);
  const setTemplateId = useResumeStore((s) => s.setTemplateId);
  const maxPages = useResumeStore((s) => s.maxPages);
  const setMaxPages = useResumeStore((s) => s.setMaxPages);
  const includeSections = useResumeStore((s) => s.includeSections);
  const toggleSection = useResumeStore((s) => s.toggleSection);
  const generateOutput = useResumeStore((s) => s.generateOutput);
  const master = useResumeStore((s) => s.master);

  const [generating, setGenerating] = useState(false);
  const filename = `${master.basics.name.replace(/\s+/g, '_')}_Resume.pdf`;

  const handlePdf = async () => {
    setGenerating(true);
    try {
      const { exportPdf } = await import('./export/pdf');
      await exportPdf('resume-preview', filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
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
        <div className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Template
        </div>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                templateId === t.id
                  ? 'border-[#00dfa2] bg-[#00dfa2]/10 text-[#00dfa2]'
                  : 'border-[#2a3140] text-[#545d68] hover:border-[#3a4250] hover:text-[#8b949e]'
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Page Length */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Page Length
        </div>
        <div className="flex gap-2">
          {([1, 2] as const).map((pages) => (
            <button
              key={pages}
              onClick={() => setMaxPages(pages)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                maxPages === pages
                  ? 'border-[#00dfa2] bg-[#00dfa2]/10 text-[#00dfa2]'
                  : 'border-[#2a3140] text-[#545d68] hover:border-[#3a4250]'
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {pages} page{pages > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Section toggles */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Sections
        </div>
        <div className="space-y-1.5">
          {sectionKeys.map((s) => (
            <label key={s.key} className="flex items-center gap-2.5 cursor-pointer group">
              <div
                className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                  includeSections[s.key]
                    ? 'border-[#00dfa2] bg-[#00dfa2]'
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
                className="text-xs text-[#8b949e] group-hover:text-[#e8edf5] transition-colors"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
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
        <div className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Export
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            disabled={!generateOutput}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#2a3140] px-3 py-2 text-xs font-medium text-[#e8edf5] transition-colors hover:border-[#00dfa2]/30 hover:text-[#00dfa2] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Print
          </button>
          <button
            onClick={handlePdf}
            disabled={!generateOutput || generating}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              backgroundColor: generateOutput && !generating ? '#00dfa2' : '#2a3140',
              color: generateOutput && !generating ? '#07090f' : '#545d68',
            }}
          >
            {generating ? 'Saving...' : 'Save PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResumeBuilder() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('generate');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const generateOutput = useResumeStore((s) => s.generateOutput);
  const templateId = useResumeStore((s) => s.templateId);
  const isGenerating = useResumeStore((s) => s.isGenerating);

  const tabs: { id: SidebarTab; label: string; icon: string }[] = [
    {
      id: 'generate',
      label: 'Generate',
      icon: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
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
      className="flex min-h-[80vh] gap-0 rounded-xl border border-[#2a3140] overflow-hidden"
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
                className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-[#00dfa2] text-[#00dfa2]'
                    : 'text-[#545d68] hover:text-[#8b949e]'
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'generate' && <JDInputPanel />}
            {activeTab === 'customize' && <CustomizePanel />}
            {activeTab === 'analysis' && <AnalysisPanel />}
          </div>
        </div>
      </div>

      {/* Toggle sidebar button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="flex w-6 shrink-0 items-center justify-center border-r border-[#2a3140] text-[#545d68] transition-colors hover:bg-[#161d27] hover:text-[#8b949e]"
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <svg
          className={`h-4 w-4 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Main preview area */}
      <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: '#161d27' }}>
        {isGenerating ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#2a3140] border-t-[#00dfa2]" />
              <p className="mt-4 text-sm font-medium text-[#545d68]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Generating your tailored resume...
              </p>
              <p className="mt-1 text-xs text-[#3a4250]">
                Analyzing JD, selecting bullet variants, reordering skills
              </p>
            </div>
          </div>
        ) : generateOutput ? (
          <div id="resume-preview">
            <ResumePreview renderModel={generateOutput.renderModel} templateId={templateId} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <svg
                className="mx-auto h-16 w-16 text-[#2a3140]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
              <p
                className="mt-4 text-sm font-medium text-[#545d68]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Paste a job description to generate a tailored resume
              </p>
              <p className="mt-2 text-xs text-[#3a4250] leading-relaxed">
                The engine analyzes the JD to detect focus areas, then generates a custom professional summary,
                selects the best bullet variants for each experience, reorders your skills, and cherry-picks
                relevant projects — all aligned to what the role needs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
