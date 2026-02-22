import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';

interface SearchItem {
  title: string;
  url: string;
  category: 'Blog' | 'Research' | 'Tools' | 'Pages';
  excerpt?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  Blog: '\u270D',
  Research: '\uD83D\uDD2C',
  Tools: '\u2699',
  Pages: '\uD83D\uDCC4',
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const fuse = useMemo(() => {
    if (items.length === 0) return null;
    return new Fuse(items, {
      keys: [
        { name: 'title', weight: 0.6 },
        { name: 'excerpt', weight: 0.3 },
        { name: 'category', weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: true,
    });
  }, [items]);

  const results = useMemo(() => {
    if (!fuse || query.trim().length === 0) {
      return items.slice(0, 20);
    }
    return fuse.search(query, { limit: 20 }).map((r) => r.item);
  }, [fuse, query, items]);

  const grouped = useMemo(() => {
    const groups: Record<string, SearchItem[]> = {};
    for (const item of results) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [results]);

  const flatResults = useMemo(() => {
    const flat: SearchItem[] = [];
    for (const category of Object.keys(grouped)) {
      flat.push(...grouped[category]);
    }
    return flat;
  }, [grouped]);

  const loadIndex = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    try {
      const res = await fetch('/search/index.json');
      if (res.ok) {
        const data: SearchItem[] = await res.json();
        setItems(data);
      }
    } catch {
      // Silently fail - search just won't work
    } finally {
      setLoading(false);
    }
  }, []);

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery('');
    setSelectedIndex(0);
    loadIndex();
  }, [loadIndex]);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const navigate = useCallback(
    (item: SearchItem) => {
      closePalette();
      window.location.href = item.url;
    },
    [closePalette],
  );

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          closePalette();
        } else {
          openPalette();
        }
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        closePalette();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, openPalette, closePalette]);

  // Focus input when opening
  useEffect(() => {
    if (open && inputRef.current) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Keyboard navigation within the palette
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flatResults[selectedIndex];
        if (selected) {
          navigate(selected);
        }
      }
    },
    [flatResults, selectedIndex, navigate],
  );

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-label="Command palette"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closePalette}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl rounded-xl border border-[#2a3140] shadow-2xl"
        style={{ backgroundColor: '#131920' }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[#2a3140] px-4 py-3">
          <svg
            className="h-5 w-5 shrink-0 text-[#545d68]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-[#e8edf5] placeholder-[#545d68] outline-none"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            placeholder="Search pages, posts, research..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search"
            autoComplete="off"
          />
          <kbd className="hidden rounded border border-[#2a3140] px-1.5 py-0.5 text-xs text-[#545d68] sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto p-2"
          role="listbox"
          aria-label="Search results"
        >
          {loading && (
            <div className="flex items-center justify-center py-8 text-[#545d68]">
              <svg
                className="mr-2 h-5 w-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="opacity-25"
                />
                <path
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  className="opacity-75"
                />
              </svg>
              Loading search index...
            </div>
          )}

          {!loading && flatResults.length === 0 && query.trim().length > 0 && (
            <div className="py-8 text-center text-[#545d68]">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading &&
            Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category} className="mb-2">
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#545d68]">
                  {category}
                </div>
                {categoryItems.map((item) => {
                  flatIndex++;
                  const idx = flatIndex;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={`${item.url}-${idx}`}
                      data-index={idx}
                      role="option"
                      aria-selected={isSelected}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        isSelected
                          ? 'bg-[#00dfa2]/10 text-[#00dfa2]'
                          : 'text-[#e8edf5] hover:bg-[#161d27]'
                      }`}
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm"
                        style={{ backgroundColor: '#161d27' }}
                        aria-hidden="true"
                      >
                        {CATEGORY_ICONS[item.category] || '\uD83D\uDCC4'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-sm font-medium"
                          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                        >
                          {item.title}
                        </div>
                        {item.excerpt && (
                          <div className="truncate text-xs text-[#8b949e]">
                            {item.excerpt}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <svg
                          className="h-4 w-4 shrink-0 text-[#00dfa2]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-[#2a3140] px-4 py-2 text-xs text-[#545d68]">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[#2a3140] px-1 py-0.5">&uarr;</kbd>
            <kbd className="rounded border border-[#2a3140] px-1 py-0.5">&darr;</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[#2a3140] px-1 py-0.5">&crarr;</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[#2a3140] px-1 py-0.5">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}
