import { useState, useCallback } from 'react';

interface Props {
  code: string;
}

export default function CopyCodeButton({ code }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className={`absolute right-2 top-2 rounded-md border px-2 py-1 text-xs font-medium transition-all duration-200 ${
        copied
          ? 'border-[#00dfa2]/40 bg-[#00dfa2]/10 text-[#00dfa2]'
          : 'border-[#2a3140] bg-[#131920] text-[#8b949e] hover:border-[#00dfa2]/40 hover:text-[#e8edf5]'
      }`}
      aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
      title={copied ? 'Copied!' : 'Copy'}
    >
      {copied ? (
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
          Copy
        </span>
      )}
    </button>
  );
}
