import { useResumeStore } from '../state/store';

export default function JDInput() {
  const jdText = useResumeStore((s) => s.jdText);
  const setJdText = useResumeStore((s) => s.setJdText);
  const runMatch = useResumeStore((s) => s.runMatch);
  const targetRole = useResumeStore((s) => s.targetRole);
  const setTargetRole = useResumeStore((s) => s.setTargetRole);

  const charCount = jdText.length;

  return (
    <div className="space-y-3">
      <label className="block">
        <span
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8b949e]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Target Role
        </span>
        <input
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Senior Threat Researcher"
          className="w-full rounded-lg border border-[#2a3140] bg-[#0d1117] px-3 py-2 text-sm text-[#e8edf5] placeholder-[#545d68] outline-none transition-colors focus:border-[#00dfa2]/50"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        />
      </label>

      <label className="block">
        <span
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#8b949e]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Job Description
        </span>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the job description here to analyze keyword matches and optimize your resume for ATS systems..."
          rows={8}
          className="w-full resize-y rounded-lg border border-[#2a3140] bg-[#0d1117] px-3 py-2 text-sm text-[#e8edf5] placeholder-[#545d68] outline-none transition-colors focus:border-[#00dfa2]/50"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        />
      </label>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[#545d68]">
          {charCount.toLocaleString()} characters
        </span>
        <button
          onClick={runMatch}
          disabled={jdText.trim().length === 0}
          className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            backgroundColor: jdText.trim().length > 0 ? '#00dfa2' : '#2a3140',
            color: jdText.trim().length > 0 ? '#07090f' : '#545d68',
          }}
        >
          Analyze Match
        </button>
      </div>
    </div>
  );
}
