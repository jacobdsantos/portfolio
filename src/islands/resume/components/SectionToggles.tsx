import { useResumeStore } from '../state/store';

interface SectionConfig {
  key: 'summary' | 'skills' | 'experience' | 'projects' | 'education' | 'certifications' | 'publications';
  label: string;
  icon: string;
}

const SECTIONS: SectionConfig[] = [
  { key: 'summary', label: 'Summary', icon: 'M4 6h16M4 12h16M4 18h7' },
  { key: 'skills', label: 'Skills', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { key: 'experience', label: 'Experience', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { key: 'projects', label: 'Projects', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { key: 'education', label: 'Education', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { key: 'certifications', label: 'Certifications', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
  { key: 'publications', label: 'Publications', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
];

export default function SectionToggles() {
  const includeSections = useResumeStore((s) => s.includeSections);
  const toggleSection = useResumeStore((s) => s.toggleSection);
  const maxPages = useResumeStore((s) => s.maxPages);
  const setMaxPages = useResumeStore((s) => s.setMaxPages);
  const bulletStyle = useResumeStore((s) => s.bulletStyle);
  const setBulletStyle = useResumeStore((s) => s.setBulletStyle);

  return (
    <div className="space-y-4">
      {/* Section toggles */}
      <div>
        <h4
          className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8b949e]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Sections
        </h4>
        <div className="space-y-1">
          {SECTIONS.map((section) => {
            const enabled = includeSections[section.key];
            return (
              <button
                key={section.key}
                onClick={() => toggleSection(section.key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  enabled
                    ? 'bg-[#00dfa2]/10 text-[#00dfa2]'
                    : 'text-[#545d68] hover:bg-[#161d27] hover:text-[#8b949e]'
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={section.icon} />
                </svg>
                <span className="flex-1 text-left">{section.label}</span>
                <div
                  className={`h-4 w-8 rounded-full transition-colors ${
                    enabled ? 'bg-[#00dfa2]' : 'bg-[#2a3140]'
                  }`}
                >
                  <div
                    className={`h-4 w-4 rounded-full border-2 transition-transform ${
                      enabled
                        ? 'translate-x-4 border-[#00dfa2] bg-white'
                        : 'translate-x-0 border-[#2a3140] bg-[#545d68]'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Page limit */}
      <div>
        <h4
          className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8b949e]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Page Limit
        </h4>
        <div className="flex gap-2">
          {([1, 2] as const).map((pages) => (
            <button
              key={pages}
              onClick={() => setMaxPages(pages)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                maxPages === pages
                  ? 'border-[#00dfa2]/50 bg-[#00dfa2]/10 text-[#00dfa2]'
                  : 'border-[#2a3140] text-[#545d68] hover:border-[#8b949e]/30 hover:text-[#8b949e]'
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {pages} Page{pages > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Bullet style */}
      <div>
        <h4
          className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8b949e]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Bullet Style
        </h4>
        <div className="flex gap-2">
          {(['natural', 'harvard'] as const).map((style) => (
            <button
              key={style}
              onClick={() => setBulletStyle(style)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                bulletStyle === style
                  ? 'border-[#00dfa2]/50 bg-[#00dfa2]/10 text-[#00dfa2]'
                  : 'border-[#2a3140] text-[#545d68] hover:border-[#8b949e]/30 hover:text-[#8b949e]'
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
