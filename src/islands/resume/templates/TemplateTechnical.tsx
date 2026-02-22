import type { ResumeRenderModel, ResumeSection } from '../../../lib/resume/types';

interface Props {
  renderModel: ResumeRenderModel;
}

function renderSection(section: ResumeSection) {
  switch (section.type) {
    case 'summary':
      return (
        <div className="mb-3">
          <h2 className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#6c5ce7]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
            {'// '}{section.title}
          </h2>
          {section.blocks.map((block, i) => (
            <p key={i} className="text-[11px] leading-snug text-[#333]">
              {block}
            </p>
          ))}
        </div>
      );

    case 'skills':
      return (
        <div className="mb-3 rounded border border-[#e0e0e0] bg-[#f8f9fa] p-3">
          <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-[#6c5ce7]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
            {'// '}{section.title}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {section.groups.map((group) => (
              <div key={group.group} className="text-[11px]">
                <span className="font-bold text-[#07090f]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>{group.group}</span>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {group.items.map((item) => (
                    <span key={item} className="rounded bg-[#e8e8e8] px-1.5 py-0.5 text-[10px] text-[#333]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'experience':
      return (
        <div className="mb-3">
          <h2 className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#6c5ce7]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
            {'// '}{section.title}
          </h2>
          {section.items.map((item, i) => (
            <div key={i} className="mb-2 border-l-2 border-[#6c5ce7] pl-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[12px] font-bold text-[#07090f]">{item.role}</span>
                  <span className="text-[11px] text-[#555]"> @ {item.company}</span>
                </div>
                <span className="text-[10px] text-[#777]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>{item.dates}</span>
              </div>
              <ul className="mt-0.5 space-y-0">
                {item.bullets.map((bullet) => (
                  <li key={bullet.id} className="text-[11px] leading-snug text-[#333]">
                    <span className="text-[#6c5ce7]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>{'> '}</span>
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
        <div className="mb-3">
          <h2 className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#6c5ce7]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
            {'// '}{section.title}
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {section.items.map((item, i) => (
              <div key={i} className="rounded border border-[#e0e0e0] p-2">
                <div className="text-[11px] font-bold text-[#07090f]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
                  {item.name}
                </div>
                <div className="mt-0.5 text-[10px] text-[#555]">{item.summary}</div>
                <ul className="mt-1 space-y-0">
                  {item.bullets.map((bullet) => (
                    <li key={bullet.id} className="text-[10px] leading-snug text-[#444]">
                      <span className="text-[#6c5ce7]">-</span> {bullet.text}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );

    case 'education':
      return (
        <div className="mb-3">
          <h2 className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#6c5ce7]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
            {'// '}{section.title}
          </h2>
          {section.items.map((item, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="text-[#07090f]">{item.degree} -- {item.school}</span>
              <span className="text-[#777]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>{item.date}</span>
            </div>
          ))}
        </div>
      );

    case 'certifications':
      return (
        <div className="mb-3">
          <h2 className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#6c5ce7]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
            {'// '}{section.title}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {section.items.map((item, i) => (
              <span key={i} className="rounded border border-[#e0e0e0] bg-[#f8f9fa] px-2 py-0.5 text-[10px]">
                <span className="font-medium text-[#07090f]">{item.name}</span>
                <span className="text-[#777]"> ({item.date})</span>
              </span>
            ))}
          </div>
        </div>
      );

    case 'publications':
      return (
        <div className="mb-3">
          <h2 className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[#6c5ce7]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
            {'// '}{section.title}
          </h2>
          {section.items.map((item, i) => (
            <div key={i} className="text-[10px]">
              <span className="text-[#6c5ce7]">*</span>{' '}
              <span className="font-medium text-[#07090f]">{item.title}</span>
              <span className="text-[#555]"> -- {item.publisher}, {item.date}</span>
            </div>
          ))}
        </div>
      );
  }
}

export default function TemplateTechnical({ renderModel }: Props) {
  const { header, sections } = renderModel;

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-6 text-[#07090f] shadow-lg print:shadow-none" style={{ fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif", minHeight: '297mm' }}>
      {/* Header */}
      <div className="mb-4 border-b-2 border-[#6c5ce7] pb-3">
        <h1 className="text-xl font-bold text-[#07090f]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
          {header.name}
        </h1>
        {header.label && (
          <div className="mt-0.5 text-[12px] font-medium text-[#6c5ce7]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
            {header.label}
          </div>
        )}
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[#555]" style={{ fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}>
          {header.contactLines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
          {header.links.map((link, i) => (
            <a key={i} href={link.url} className="text-[#6c5ce7]">
              {link.label}: {link.url}
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
