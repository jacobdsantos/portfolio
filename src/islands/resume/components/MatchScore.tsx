import { useMemo } from 'react';
import { useResumeStore } from '../state/store';

function getScoreColor(score: number): string {
  if (score >= 70) return '#00dfa2';
  if (score >= 40) return '#f9ca24';
  return '#ff6b6b';
}

function getGradeLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

export default function MatchScore() {
  const matchOutput = useResumeStore((s) => s.matchOutput);

  const score = matchOutput?.renderModel.meta.atsScore ?? 0;
  const color = useMemo(() => getScoreColor(score), [score]);
  const grade = useMemo(() => getGradeLabel(score), [score]);

  // SVG circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  if (!matchOutput) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-[#2a3140] p-6" style={{ backgroundColor: '#0d1117' }}>
        <div className="relative flex h-24 w-24 items-center justify-center">
          <svg className="h-24 w-24" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#2a3140"
              strokeWidth="6"
            />
          </svg>
          <span className="absolute text-2xl font-bold text-[#545d68]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            --
          </span>
        </div>
        <span className="mt-2 text-xs text-[#545d68]">Paste a JD to see score</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-[#2a3140] p-6" style={{ backgroundColor: '#0d1117' }}>
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#2a3140"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <span
          className="absolute text-2xl font-bold transition-colors duration-300"
          style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {score}
        </span>
      </div>
      <span
        className="mt-2 text-sm font-semibold transition-colors duration-300"
        style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {grade}
      </span>
      <span className="mt-0.5 text-xs text-[#545d68]">ATS Match Score</span>
    </div>
  );
}
