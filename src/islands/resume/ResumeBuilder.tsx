import { useState } from 'react';
import { useResumeStore } from './state/store';
import JDInput from './components/JDInput';
import MatchScore from './components/MatchScore';
import KeywordList from './components/KeywordList';
import AtsChecker from './components/AtsChecker';
import SectionToggles from './components/SectionToggles';
import TemplateSwitcher from './components/TemplateSwitcher';
import BulletEditor from './components/BulletEditor';
import ExportButtons from './components/ExportButtons';
import TemplateCleanModern from './templates/TemplateCleanModern';
import TemplateHarvardClassic from './templates/TemplateHarvardClassic';
import TemplateTechnical from './templates/TemplateTechnical';
import TemplateExecutive from './templates/TemplateExecutive';
import type { TemplateId, ResumeRenderModel } from '../../lib/resume/types';

type SidebarTab = 'match' | 'customize' | 'ats';

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

export default function ResumeBuilder() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('match');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const matchOutput = useResumeStore((s) => s.matchOutput);
  const templateId = useResumeStore((s) => s.templateId);

  const tabs: { id: SidebarTab; label: string; icon: string }[] = [
    {
      id: 'match',
      label: 'Match',
      icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
    },
    {
      id: 'customize',
      label: 'Customize',
      icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75',
    },
    {
      id: 'ats',
      label: 'ATS',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
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
          sidebarOpen ? 'w-[360px]' : 'w-0 overflow-hidden'
        }`}
        style={{ backgroundColor: '#0a0e14' }}
      >
        <div className="flex h-full w-[360px] flex-col">
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
            {activeTab === 'match' && (
              <div className="space-y-6">
                <JDInput />
                <div className="border-t border-[#2a3140] pt-4">
                  <MatchScore />
                </div>
                <div className="border-t border-[#2a3140] pt-4">
                  <KeywordList />
                </div>
              </div>
            )}

            {activeTab === 'customize' && (
              <div className="space-y-6">
                <TemplateSwitcher />
                <div className="border-t border-[#2a3140] pt-4">
                  <SectionToggles />
                </div>
                <div className="border-t border-[#2a3140] pt-4">
                  <BulletEditor />
                </div>
                <div className="border-t border-[#2a3140] pt-4">
                  <ExportButtons />
                </div>
              </div>
            )}

            {activeTab === 'ats' && (
              <div className="space-y-6">
                <AtsChecker />
              </div>
            )}
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
        {matchOutput ? (
          <div id="resume-preview">
            <ResumePreview renderModel={matchOutput.renderModel} templateId={templateId} />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
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
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p
                className="mt-4 text-sm font-medium text-[#545d68]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Paste a job description and click "Analyze Match"
              </p>
              <p className="mt-1 text-xs text-[#3a4250]">
                Your resume will be optimized and previewed here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
