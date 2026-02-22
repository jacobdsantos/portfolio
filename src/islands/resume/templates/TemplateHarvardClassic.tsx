import type { ResumeRenderModel, ResumeSection } from '../../../lib/resume/types';

interface Props {
  renderModel: ResumeRenderModel;
}

function SectionDivider() {
  return <hr className="my-1 border-t border-[#333]" />;
}

function renderSection(section: ResumeSection) {
  switch (section.type) {
    case 'summary':
      return (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase text-[#07090f]">{section.title}</h2>
          <SectionDivider />
          {section.blocks.map((block, i) => (
            <p key={i} className="mt-1 text-[12px] leading-relaxed text-[#222]">
              {block}
            </p>
          ))}
        </div>
      );

    case 'skills':
      return (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase text-[#07090f]">{section.title}</h2>
          <SectionDivider />
          <div className="mt-1 space-y-0.5">
            {section.groups.map((group) => (
              <div key={group.group} className="text-[12px]">
                <span className="font-bold text-[#07090f]">{group.group}: </span>
                <span className="text-[#222]">{group.items.join(' | ')}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'experience':
      return (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase text-[#07090f]">{section.title}</h2>
          <SectionDivider />
          {section.items.map((item, i) => (
            <div key={i} className="mt-2">
              <div className="flex justify-between">
                <span className="text-[13px] font-bold text-[#07090f]">{item.company}</span>
                <span className="text-[12px] text-[#555]">{item.dates}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] italic text-[#333]">{item.role}</span>
                {item.location && (
                  <span className="text-[11px] text-[#555]">{item.location}</span>
                )}
              </div>
              <ul className="mt-1 space-y-0.5 pl-4">
                {item.bullets.map((bullet) => (
                  <li key={bullet.id} className="list-disc text-[12px] leading-relaxed text-[#222]">
                    {bullet.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case 'projects':
      return (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase text-[#07090f]">{section.title}</h2>
          <SectionDivider />
          {section.items.map((item, i) => (
            <div key={i} className="mt-2">
              <span className="text-[13px] font-bold text-[#07090f]">{item.name}</span>
              <span className="text-[12px] text-[#555]"> -- {item.summary}</span>
              <ul className="mt-0.5 space-y-0.5 pl-4">
                {item.bullets.map((bullet) => (
                  <li key={bullet.id} className="list-disc text-[12px] leading-relaxed text-[#222]">
                    {bullet.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case 'education':
      return (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase text-[#07090f]">{section.title}</h2>
          <SectionDivider />
          {section.items.map((item, i) => (
            <div key={i} className="mt-1 flex justify-between text-[12px]">
              <div>
                <span className="font-bold text-[#07090f]">{item.school}</span>
                <span className="text-[#222]">, {item.degree}</span>
              </div>
              <span className="text-[#555]">{item.date}</span>
            </div>
          ))}
        </div>
      );

    case 'certifications':
      return (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase text-[#07090f]">{section.title}</h2>
          <SectionDivider />
          {section.items.map((item, i) => (
            <div key={i} className="mt-0.5 flex justify-between text-[12px]">
              <div>
                <span className="font-bold text-[#07090f]">{item.name}</span>
                <span className="text-[#555]">, {item.issuer}</span>
              </div>
              <span className="text-[#555]">{item.date}</span>
            </div>
          ))}
        </div>
      );

    case 'publications':
      return (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase text-[#07090f]">{section.title}</h2>
          <SectionDivider />
          {section.items.map((item, i) => (
            <div key={i} className="mt-0.5 text-[12px]">
              <span className="text-[#222]">&ldquo;{item.title}&rdquo;</span>
              <span className="text-[#555]"> {item.publisher}, {item.date}</span>
            </div>
          ))}
        </div>
      );
  }
}

export default function TemplateHarvardClassic({ renderModel }: Props) {
  const { header, sections } = renderModel;

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-10 text-[#07090f] shadow-lg print:shadow-none" style={{ fontFamily: "'Times New Roman', 'Georgia', serif", minHeight: '297mm' }}>
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-widest text-[#07090f]">{header.name}</h1>
        <div className="mt-1.5 text-[12px] text-[#555]">
          {header.contactLines.join(' | ')}
          {header.links.length > 0 && (
            <>
              {' | '}
              {header.links.map((l) => l.url).join(' | ')}
            </>
          )}
        </div>
      </div>

      <hr className="mb-4 border-t-2 border-[#07090f]" />

      {/* Sections */}
      {sections.map((section, i) => (
        <div key={`${section.type}-${i}`}>
          {renderSection(section)}
        </div>
      ))}
    </div>
  );
}
