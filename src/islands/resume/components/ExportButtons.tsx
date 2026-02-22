import { useState, useCallback } from 'react';
import { useResumeStore } from '../state/store';

export default function ExportButtons() {
  const [generating, setGenerating] = useState(false);
  const matchOutput = useResumeStore((s) => s.matchOutput);
  const master = useResumeStore((s) => s.master);

  const filename = `${master.basics.name.replace(/\s+/g, '_')}_Resume.pdf`;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handlePdf = useCallback(async () => {
    setGenerating(true);
    try {
      const { exportPdf } = await import('../export/pdf');
      await exportPdf('resume-preview', filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [filename]);

  return (
    <div className="space-y-2">
      <h4
        className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Export
      </h4>
      <div className="flex gap-2">
        <button
          onClick={handlePrint}
          disabled={!matchOutput}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#2a3140] px-3 py-2 text-sm font-medium text-[#e8edf5] transition-colors hover:border-[#00dfa2]/30 hover:text-[#00dfa2] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print
        </button>
        <button
          onClick={handlePdf}
          disabled={!matchOutput || generating}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            backgroundColor: matchOutput && !generating ? '#00dfa2' : '#2a3140',
            color: matchOutput && !generating ? '#07090f' : '#545d68',
          }}
        >
          {generating ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Save PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
