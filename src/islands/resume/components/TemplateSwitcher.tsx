import { useResumeStore } from '../state/store';
import type { TemplateId } from '../../../lib/resume/types';

interface TemplateOption {
  id: TemplateId;
  label: string;
  description: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    id: 'clean',
    label: 'Clean Modern',
    description: 'Minimal design with accent highlights',
  },
  {
    id: 'harvard',
    label: 'Harvard Classic',
    description: 'Traditional format, bold headers',
  },
  {
    id: 'technical',
    label: 'Technical',
    description: 'Compact, skills-forward layout',
  },
  {
    id: 'executive',
    label: 'Executive',
    description: 'Spacious, summary-focused',
  },
];

function TemplatePreview({ id, isActive }: { id: TemplateId; isActive: boolean }) {
  const borderColor = isActive ? '#00dfa2' : '#2a3140';
  const accentColor = isActive ? '#00dfa2' : '#545d68';

  return (
    <div
      className="h-16 w-full rounded border p-1.5"
      style={{ borderColor, backgroundColor: '#0d1117' }}
    >
      {id === 'clean' && (
        <>
          <div className="mb-1 h-1.5 w-10 rounded-sm" style={{ backgroundColor: accentColor }} />
          <div className="mb-0.5 h-1 w-full rounded-sm bg-[#2a3140]" />
          <div className="mb-1 h-1 w-3/4 rounded-sm bg-[#2a3140]" />
          <div className="flex gap-1">
            <div className="h-0.5 w-1/4 rounded-sm bg-[#2a3140]" />
            <div className="h-0.5 w-1/4 rounded-sm bg-[#2a3140]" />
          </div>
          <div className="mt-1 h-0.5 w-full rounded-sm bg-[#1a2030]" />
          <div className="mt-0.5 h-0.5 w-5/6 rounded-sm bg-[#1a2030]" />
        </>
      )}
      {id === 'harvard' && (
        <>
          <div className="mb-1 h-2 w-12 rounded-sm" style={{ backgroundColor: accentColor }} />
          <div className="mb-0.5 border-b border-[#2a3140]" />
          <div className="mb-0.5 h-1 w-6 rounded-sm bg-[#2a3140]" />
          <div className="mb-0.5 h-0.5 w-full rounded-sm bg-[#1a2030]" />
          <div className="mb-0.5 h-0.5 w-full rounded-sm bg-[#1a2030]" />
          <div className="h-0.5 w-4/5 rounded-sm bg-[#1a2030]" />
        </>
      )}
      {id === 'technical' && (
        <>
          <div className="mb-1 flex gap-1">
            <div className="h-1 w-4 rounded-sm" style={{ backgroundColor: accentColor }} />
            <div className="h-1 w-4 rounded-sm bg-[#2a3140]" />
            <div className="h-1 w-4 rounded-sm bg-[#2a3140]" />
          </div>
          <div className="mb-0.5 h-0.5 w-full rounded-sm bg-[#1a2030]" />
          <div className="mb-0.5 flex gap-0.5">
            <div className="h-3 w-1/3 rounded-sm bg-[#161d27]" />
            <div className="h-3 flex-1 rounded-sm bg-[#1a2030]" />
          </div>
        </>
      )}
      {id === 'executive' && (
        <>
          <div className="mb-1.5 h-2 w-14 rounded-sm" style={{ backgroundColor: accentColor }} />
          <div className="mb-1 h-1 w-full rounded-sm bg-[#2a3140]" />
          <div className="mb-1 h-1 w-5/6 rounded-sm bg-[#2a3140]" />
          <div className="mt-1 h-0.5 w-full rounded-sm bg-[#1a2030]" />
          <div className="mt-0.5 h-0.5 w-3/4 rounded-sm bg-[#1a2030]" />
        </>
      )}
    </div>
  );
}

export default function TemplateSwitcher() {
  const templateId = useResumeStore((s) => s.templateId);
  const setTemplateId = useResumeStore((s) => s.setTemplateId);

  return (
    <div>
      <h4
        className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8b949e]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Template
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((template) => {
          const isActive = templateId === template.id;
          return (
            <button
              key={template.id}
              onClick={() => setTemplateId(template.id)}
              className={`rounded-lg border p-2 text-left transition-all ${
                isActive
                  ? 'border-[#00dfa2]/50 bg-[#00dfa2]/5'
                  : 'border-[#2a3140] hover:border-[#8b949e]/30'
              }`}
            >
              <TemplatePreview id={template.id} isActive={isActive} />
              <div className="mt-1.5">
                <div
                  className={`text-xs font-medium ${isActive ? 'text-[#00dfa2]' : 'text-[#e8edf5]'}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {template.label}
                </div>
                <div className="text-[10px] text-[#545d68]">{template.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
