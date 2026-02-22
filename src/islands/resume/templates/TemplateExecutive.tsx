import type { ResumeRenderModel, ResumeSection } from '../../../lib/resume/types';

interface Props {
  renderModel: ResumeRenderModel;
}

function renderSection(section: ResumeSection) {
  switch (section.type) {
    case 'summary':
      return (
        <div className="mb-6">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#555]">
            {section.title}
          </h2>
          {section.blocks.map((block, i) => (
            <p key={i} className="text-[13px] leading-[1.8] text-[#222]">
              {block}
            </p>
          ))}
        </div>
      );

    case 'skills':
      return (
        <div className="mb-6">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#555]">
            {section.title}
          </h2>
          <div className="space-y-2">
            {section.groups.map((group) => (
              <div key={group.group}>
                <div className="text-[12px] font-semibold text-[#07090f]">{group.group}</div>
                <div className="mt-0.5 text-[12px] leading-relaxed text-[#333]">
                  {group.items.join('  \u2022  ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'experience':
      return (
        <div className="mb-6">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#555]">
            {section.title}
          </h2>
          {section.items.map((item, i) => (
            <div key={i} className="mb-5">
              <div className="flex items-baseline justify-between">
                <h3 className="text-[14px] font-bold text-[#07090f]">{item.role}</h3>
                <span className="text-[11px] text-[#777]">{item.dates}</span>
              </div>
              <div className="text-[12px] text-[#555]">
                {item.company}
                {item.location && <span> -- {item.location}</span>}
              </div>
              <ul className="mt-2 space-y-1.5">
                {item.bullets.map((bullet) => (
                  <li
                    key={bullet.id}
                    className="relative pl-5 text-[12px] leading-relaxed text-[#222]"
                  >
                    <span className="absolute left-0 top-[0.45em] h-1.5 w-1.5 rounded-full bg-[#ccc]" />
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
        <div className="mb-6">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#555]">
            {section.title}
          </h2>
          {section.items.map((item, i) => (
            <div key={i} className="mb-3">
              <h3 className="text-[13px] font-bold text-[#07090f]">{item.name}</h3>
              <div className="text-[11px] italic text-[#555]">{item.summary}</div>
              <ul className="mt-1 space-y-1">
                {item.bullets.map((bullet) => (
                  <li
                    key={bullet.id}
                    className="relative pl-5 text-[12px] leading-relaxed text-[#222]"
                  >
                    <span className="absolute left-0 top-[0.45em] h-1.5 w-1.5 rounded-full bg-[#ccc]" />
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
        <div className="mb-6">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#555]">
            {section.title}
          </h2>
          {section.items.map((item, i) => (
            <div key={i} className="mb-1 flex justify-between text-[12px]">
              <div>
                <span className="font-semibold text-[#07090f]">{item.degree}</span>
                <span className="text-[#555]">, {item.school}</span>
              </div>
              <span className="text-[#777]">{item.date}</span>
            </div>
          ))}
        </div>
      );

    case 'certifications':
      return (
        <div className="mb-6">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#555]">
            {section.title}
          </h2>
          {section.items.map((item, i) => (
            <div key={i} className="mb-1 flex justify-between text-[12px]">
              <div>
                <span className="font-semibold text-[#07090f]">{item.name}</span>
                <span className="text-[#555]"> -- {item.issuer}</span>
              </div>
              <span className="text-[#777]">{item.date}</span>
            </div>
          ))}
        </div>
      );

    case 'publications':
      return (
        <div className="mb-6">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.2em] text-[#555]">
            {section.title}
          </h2>
          {section.items.map((item, i) => (
            <div key={i} className="mb-1.5 text-[12px]">
              <div className="font-semibold text-[#07090f]">{item.title}</div>
              <div className="text-[11px] text-[#555]">{item.publisher} | {item.date}</div>
            </div>
          ))}
        </div>
      );
  }
}

export default function TemplateExecutive({ renderModel }: Props) {
  const { header, sections } = renderModel;

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-10 text-[#07090f] shadow-lg print:shadow-none" style={{ fontFamily: "'Georgia', 'Times New Roman', serif", minHeight: '297mm' }}>
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-[26px] font-normal tracking-[0.15em] text-[#07090f]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          {header.name.toUpperCase()}
        </h1>
        {header.label && (
          <div className="mt-1 text-[13px] font-medium tracking-wider text-[#555]">
            {header.label}
          </div>
        )}
        <div className="mt-3 h-[2px] bg-gradient-to-r from-transparent via-[#07090f] to-transparent" />
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-0.5 text-[11px] text-[#555]">
          {header.contactLines.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
          {header.links.map((link, i) => (
            <a key={i} href={link.url} className="text-[#555] underline">
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
