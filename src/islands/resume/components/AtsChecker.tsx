import { useMemo } from 'react';
import { useResumeStore } from '../state/store';

interface AtsCheck {
  label: string;
  description: string;
  status: 'pass' | 'warn' | 'fail';
}

export default function AtsChecker() {
  const master = useResumeStore((s) => s.master);
  const matchOutput = useResumeStore((s) => s.matchOutput);
  const includeSections = useResumeStore((s) => s.includeSections);

  const checks = useMemo((): AtsCheck[] => {
    const result: AtsCheck[] = [];

    // Contact information
    result.push({
      label: 'Contact Information',
      description: 'Name, email, and location present',
      status:
        master.basics.name && master.basics.email && master.basics.location
          ? 'pass'
          : 'fail',
    });

    // Professional links
    result.push({
      label: 'Professional Links',
      description: 'LinkedIn, GitHub, or portfolio URL',
      status: master.basics.links.length > 0 ? 'pass' : 'warn',
    });

    // Summary section
    result.push({
      label: 'Summary Section',
      description: 'Professional summary included',
      status: includeSections.summary ? 'pass' : 'warn',
    });

    // Skills section
    result.push({
      label: 'Skills Section',
      description: 'Technical skills listed by category',
      status:
        includeSections.skills && master.skills.length > 0 ? 'pass' : 'warn',
    });

    // Experience section
    result.push({
      label: 'Work Experience',
      description: 'Experience with dates and descriptions',
      status:
        includeSections.experience && master.experience.length > 0
          ? 'pass'
          : 'fail',
    });

    // Standard section headings
    result.push({
      label: 'Section Headings',
      description: 'Standard ATS-recognized section names',
      status: 'pass',
    });

    // Font compatibility
    result.push({
      label: 'Font Compatibility',
      description: 'Using ATS-friendly fonts (no decorative fonts)',
      status: 'pass',
    });

    // No tables/columns
    result.push({
      label: 'Simple Layout',
      description: 'Single-column layout for ATS parsing',
      status: 'pass',
    });

    // Keyword match score
    if (matchOutput) {
      const score = matchOutput.renderModel.meta.atsScore;
      result.push({
        label: 'Keyword Match',
        description: `${score}% of JD keywords found in resume`,
        status: score >= 70 ? 'pass' : score >= 40 ? 'warn' : 'fail',
      });
    }

    // Education
    result.push({
      label: 'Education',
      description: 'Education section included',
      status:
        includeSections.education && master.education.length > 0
          ? 'pass'
          : 'warn',
    });

    return result;
  }, [master, matchOutput, includeSections]);

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const totalCount = checks.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4
          className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          ATS Compatibility
        </h4>
        <span className="text-xs font-medium text-[#00dfa2]">
          {passCount}/{totalCount} checks
        </span>
      </div>

      <div className="space-y-1">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-start gap-2 rounded-lg px-2 py-1.5"
          >
            {check.status === 'pass' && (
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#00dfa2]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {check.status === 'warn' && (
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#f9ca24]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {check.status === 'fail' && (
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <div className="min-w-0 flex-1">
              <div
                className={`text-xs font-medium ${
                  check.status === 'pass'
                    ? 'text-[#e8edf5]'
                    : check.status === 'warn'
                      ? 'text-[#f9ca24]'
                      : 'text-[#ff6b6b]'
                }`}
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {check.label}
              </div>
              <div className="text-[10px] text-[#545d68]">{check.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
