import { useEffect } from 'react';
import { useResumeStore } from './resume/state/store';
import JDInput from './resume/components/JDInput';
import MatchScore from './resume/components/MatchScore';
import KeywordList from './resume/components/KeywordList';
import SectionToggles from './resume/components/SectionToggles';
import TemplateSwitcher from './resume/components/TemplateSwitcher';
import ExportButtons from './resume/components/ExportButtons';
import AtsChecker from './resume/components/AtsChecker';
import BulletEditor from './resume/components/BulletEditor';
import TemplateCleanModern from './resume/templates/TemplateCleanModern';
import TemplateHarvardClassic from './resume/templates/TemplateHarvardClassic';
import TemplateTechnical from './resume/templates/TemplateTechnical';
import TemplateExecutive from './resume/templates/TemplateExecutive';

function ResumePreview() {
  const matchOutput = useResumeStore((s) => s.matchOutput);
  const templateId = useResumeStore((s) => s.templateId);

  if (!matchOutput) {
    return (
      <div className="flex h-full min-h-[600px] items-center justify-center rounded-lg border border-dashed border-[#2a3140]" style={{ backgroundColor: '#0d1117' }}>
        <div className="max-w-sm text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-[#2a3140]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3
            className="mb-2 text-lg font-semibold text-[#8b949e]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Resume Preview
          </h3>
          <p className="text-sm text-[#545d68]">
            Paste a job description and click &ldquo;Analyze Match&rdquo; to generate a tailored resume preview with ATS optimization.
          </p>
        </div>
      </div>
    );
  }

  const renderModel = matchOutput.renderModel;

  return (
    <div id="resume-preview" className="overflow-auto">
      {templateId === 'clean' && <TemplateCleanModern renderModel={renderModel} />}
      {templateId === 'harvard' && <TemplateHarvardClassic renderModel={renderModel} />}
      {templateId === 'technical' && <TemplateTechnical renderModel={renderModel} />}
      {templateId === 'executive' && <TemplateExecutive renderModel={renderModel} />}
    </div>
  );
}

export default function ResumeBuilder() {
  const runMatch = useResumeStore((s) => s.runMatch);

  // Generate a default preview on mount (no JD text = default resume)
  useEffect(() => {
    runMatch();
  }, [runMatch]);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left panel: Controls */}
      <div
        className="w-full shrink-0 overflow-y-auto border-b border-[#2a3140] p-4 lg:w-[380px] lg:border-b-0 lg:border-r"
        style={{ backgroundColor: '#131920' }}
      >
        <div className="mb-6">
          <h2
            className="mb-1 text-lg font-bold text-[#e8edf5]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Resume Builder
          </h2>
          <p className="text-xs text-[#545d68]">
            Tailor your resume to any job description with ATS-optimized keyword matching.
          </p>
        </div>

        <div className="space-y-6">
          {/* JD Input */}
          <div className="rounded-lg border border-[#2a3140] p-3" style={{ backgroundColor: '#161d27' }}>
            <JDInput />
          </div>

          {/* Match Score */}
          <MatchScore />

          {/* Keywords */}
          <div className="rounded-lg border border-[#2a3140] p-3" style={{ backgroundColor: '#161d27' }}>
            <KeywordList />
          </div>

          {/* Template Switcher */}
          <div className="rounded-lg border border-[#2a3140] p-3" style={{ backgroundColor: '#161d27' }}>
            <TemplateSwitcher />
          </div>

          {/* Section Toggles */}
          <div className="rounded-lg border border-[#2a3140] p-3" style={{ backgroundColor: '#161d27' }}>
            <SectionToggles />
          </div>

          {/* Bullet Editor */}
          <div className="rounded-lg border border-[#2a3140] p-3" style={{ backgroundColor: '#161d27' }}>
            <BulletEditor />
          </div>

          {/* ATS Checker */}
          <div className="rounded-lg border border-[#2a3140] p-3" style={{ backgroundColor: '#161d27' }}>
            <AtsChecker />
          </div>

          {/* Export */}
          <div className="rounded-lg border border-[#2a3140] p-3" style={{ backgroundColor: '#161d27' }}>
            <ExportButtons />
          </div>
        </div>
      </div>

      {/* Right panel: Preview */}
      <div className="flex-1 overflow-auto p-4" style={{ backgroundColor: '#07090f' }}>
        <ResumePreview />
      </div>
    </div>
  );
}
