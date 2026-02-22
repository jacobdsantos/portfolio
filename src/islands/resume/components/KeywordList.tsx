import { useResumeStore } from '../state/store';

export default function KeywordList() {
  const matchOutput = useResumeStore((s) => s.matchOutput);

  if (!matchOutput) {
    return (
      <div className="rounded-lg border border-[#2a3140] p-4" style={{ backgroundColor: '#0d1117' }}>
        <p className="text-center text-xs text-[#545d68]">
          Analyze a job description to see keyword matches
        </p>
      </div>
    );
  }

  const { matchedKeywords, missingKeywords } = matchOutput.renderModel.meta;

  return (
    <div className="space-y-4">
      {/* Matched keywords */}
      <div>
        <h4
          className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#00dfa2]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Matched ({matchedKeywords.length})
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {matchedKeywords.length === 0 ? (
            <span className="text-xs text-[#545d68]">None found</span>
          ) : (
            matchedKeywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-[#00dfa2]/30 bg-[#00dfa2]/10 px-2.5 py-0.5 text-xs font-medium text-[#00dfa2]"
              >
                {kw}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Missing keywords */}
      <div>
        <h4
          className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#ff6b6b]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Missing ({missingKeywords.length})
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {missingKeywords.length === 0 ? (
            <span className="text-xs text-[#545d68]">All keywords matched</span>
          ) : (
            missingKeywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full border border-[#ff6b6b]/30 bg-[#ff6b6b]/10 px-2.5 py-0.5 text-xs font-medium text-[#ff6b6b]"
              >
                {kw}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
