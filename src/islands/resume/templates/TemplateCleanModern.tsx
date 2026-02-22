import type { ResumeRenderModel, ResumeSection } from '../../../lib/resume/types';

interface Props {
  renderModel: ResumeRenderModel;
}

function SummarySection({ section }: { section: Extract<ResumeSection, { type: 'summary' }> }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 border-b-2 border-[#00dfa2] pb-1 text-sm font-bold uppercase tracking-wider text-[#07090f]">
        {section.title}
      </h2>
      {section.blocks.map((block, i) => (
        <p key={i} className="text-[13px] leading-relaxed text-[#333]">
          {block}
        </p>
      ))}
    </div>
  );
}

function SkillsSection({ section }: { section: Extract<ResumeSection, { type: 'skills' }> }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 border-b-2 border-[#00dfa2] pb-1 text-sm font-bold uppercase tracking-wider text-[#07090f]">
        {section.title}
      </h2>
      <div className="space-y-1">
        {section.groups.map((group) => (
          <div key={group.group} className="flex text-[12px]">
            <span className="w-40 shrink-0 font-semibold text-[#07090f]">{group.group}:</span>
            <span className="text-[#333]">{group.items.join(', ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExperienceSection({ section }: { section: Extract<ResumeSection, { type: 'experience' }> }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 border-b-2 border-[#00dfa2] pb-1 text-sm font-bold uppercase tracking-wider text-[#07090f]">
        {section.title}
      </h2>
      {section.items.map((item, i) => (
        <div key={i} className="mb-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[13px] font-bold text-[#07090f]">{item.role}</span>
              <span className="text-[13px] text-[#555]"> | {item.company}</span>
            </div>
            <span className="shrink-0 text-[12px] text-[#555]">{item.dates}</span>
          </div>
          {item.location && (
            <div className="text-[11px] text-[#777]">{item.location}</div>
          )}
          <ul className="mt-1 space-y-0.5">
            {item.bullets.map((bullet) => (
              <li
                key={bullet.id}
                className={`pl-3 text-[12px] leading-relaxed ${
                  bullet.matched ? 'text-[#07090f]' : 'text-[#444]'
                }`}
                style={{ textIndent: '-0.75em', paddingLeft: '1.5em' }}
              >
                <span className="text-[#00dfa2]">&bull;</span> {bullet.text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ProjectsSection({ section }: { section: Extract<ResumeSection, { type: 'projects' }> }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 border-b-2 border-[#00dfa2] pb-1 text-sm font-bold uppercase tracking-wider text-[#07090f]">
        {section.title}
      </h2>
      {section.items.map((item, i) => (
        <div key={i} className="mb-2">
          <div className="text-[13px] font-bold text-[#07090f]">
            {item.name}
            {item.links && item.links.length > 0 && (
              <span className="ml-2 text-[11px] font-normal text-[#00dfa2]">
                {item.links.map((l) => l.url).join(' ')}
              </span>
            )}
          </div>
          <div className="text-[12px] italic text-[#555]">{item.summary}</div>
          <ul className="mt-0.5 space-y-0.5">
            {item.bullets.map((bullet) => (
              <li
                key={bullet.id}
                className="pl-3 text-[12px] leading-relaxed text-[#444]"
                style={{ textIndent: '-0.75em', paddingLeft: '1.5em' }}
              >
                <span className="text-[#00dfa2]">&bull;</span> {bullet.text}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function EducationSection({ section }: { section: Extract<ResumeSection, { type: 'education' }> }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 border-b-2 border-[#00dfa2] pb-1 text-sm font-bold uppercase tracking-wider text-[#07090f]">
        {section.title}
      </h2>
      {section.items.map((item, i) => (
        <div key={i} className="flex items-start justify-between text-[12px]">
          <div>
            <span className="font-semibold text-[#07090f]">{item.degree}</span>
            <span className="text-[#555]"> - {item.school}</span>
          </div>
          <span className="shrink-0 text-[#555]">{item.date}</span>
        </div>
      ))}
    </div>
  );
}

function CertificationsSection({ section }: { section: Extract<ResumeSection, { type: 'certifications' }> }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 border-b-2 border-[#00dfa2] pb-1 text-sm font-bold uppercase tracking-wider text-[#07090f]">
        {section.title}
      </h2>
      <div className="space-y-0.5">
        {section.items.map((item, i) => (
          <div key={i} className="flex items-start justify-between text-[12px]">
            <div>
              <span className="font-semibold text-[#07090f]">{item.name}</span>
              <span className="text-[#555]"> - {item.issuer}</span>
            </div>
            <span className="shrink-0 text-[#555]">{item.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PublicationsSection({ section }: { section: Extract<ResumeSection, { type: 'publications' }> }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 border-b-2 border-[#00dfa2] pb-1 text-sm font-bold uppercase tracking-wider text-[#07090f]">
        {section.title}
      </h2>
      <div className="space-y-1">
        {section.items.map((item, i) => (
          <div key={i} className="text-[12px]">
            <span className="font-semibold text-[#07090f]">{item.title}</span>
            <span className="text-[#555]"> - {item.publisher}, {item.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderSection(section: ResumeSection) {
  switch (section.type) {
    case 'summary': return <SummarySection section={section} />;
    case 'skills': return <SkillsSection section={section} />;
    case 'experience': return <ExperienceSection section={section} />;
    case 'projects': return <ProjectsSection section={section} />;
    case 'education': return <EducationSection section={section} />;
    case 'certifications': return <CertificationsSection section={section} />;
    case 'publications': return <PublicationsSection section={section} />;
  }
}

export default function TemplateCleanModern({ renderModel }: Props) {
  const { header, sections } = renderModel;

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 text-[#07090f] shadow-lg print:shadow-none" style={{ fontFamily: "'Space Grotesk', sans-serif", minHeight: '297mm' }}>
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#07090f]">{header.name}</h1>
        {header.label && (
          <div className="mt-0.5 text-sm font-medium text-[#00dfa2]">{header.label}</div>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] text-[#555]">
          {header.contactLines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
          {header.links.map((link, i) => (
            <a key={i} href={link.url} className="text-[#00dfa2] hover:underline">
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, i) => (
        <div key={`${section.type}-${i}`}>
          {renderSection(section)}
        </div>
      ))}
    </div>
  );
}
