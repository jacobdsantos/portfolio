import { useState, useMemo, useCallback } from 'react';

interface Technique {
  id: string;
  count: number;
  name?: string;
}

interface Props {
  techniques: Technique[];
}

/** MITRE ATT&CK tactic columns in standard kill chain order. */
const TACTICS = [
  { id: 'initial-access', label: 'Initial Access', shortLabel: 'IA' },
  { id: 'execution', label: 'Execution', shortLabel: 'EX' },
  { id: 'persistence', label: 'Persistence', shortLabel: 'PE' },
  { id: 'privilege-escalation', label: 'Priv Escalation', shortLabel: 'PR' },
  { id: 'defense-evasion', label: 'Defense Evasion', shortLabel: 'DE' },
  { id: 'credential-access', label: 'Credential Access', shortLabel: 'CA' },
  { id: 'discovery', label: 'Discovery', shortLabel: 'DI' },
  { id: 'lateral-movement', label: 'Lateral Movement', shortLabel: 'LM' },
  { id: 'collection', label: 'Collection', shortLabel: 'CO' },
  { id: 'command-and-control', label: 'C&C', shortLabel: 'CC' },
  { id: 'exfiltration', label: 'Exfiltration', shortLabel: 'EF' },
  { id: 'impact', label: 'Impact', shortLabel: 'IM' },
] as const;

/**
 * Map technique IDs to tactics based on ATT&CK numbering patterns.
 * This is a simplified mapping using technique ID prefix ranges.
 */
function getTacticForTechnique(id: string): string {
  const num = parseInt(id.replace(/^T/, '').split('.')[0], 10);
  if (isNaN(num)) return 'initial-access';
  if (num >= 1189 && num <= 1199) return 'initial-access';
  if (num >= 1059 && num <= 1072) return 'execution';
  if (num >= 1098 && num <= 1199) return 'initial-access';
  if (num >= 1547 && num <= 1574) return 'persistence';
  if (num >= 1134 && num <= 1145) return 'privilege-escalation';
  if (num >= 1027 && num <= 1036) return 'defense-evasion';
  if (num >= 1003 && num <= 1017) return 'credential-access';
  if (num >= 1007 && num <= 1018) return 'discovery';
  if (num >= 1021 && num <= 1026) return 'lateral-movement';
  if (num >= 1005 && num <= 1006) return 'collection';
  if (num >= 1071 && num <= 1105) return 'command-and-control';
  if (num >= 1041 && num <= 1052) return 'exfiltration';
  if (num >= 1485 && num <= 1499) return 'impact';
  // Distribute evenly across tactics for demo/general use
  const tacticIndex = num % TACTICS.length;
  return TACTICS[tacticIndex].id;
}

function getIntensityColor(ratio: number): string {
  if (ratio >= 0.8) return '#f0a63a';
  if (ratio >= 0.6) return '#00c48c';
  if (ratio >= 0.4) return '#00a876';
  if (ratio >= 0.2) return '#008c60';
  return '#006b48';
}

function getIntensityOpacity(ratio: number): number {
  return 0.3 + ratio * 0.7;
}

export default function MitreHeatmap({ techniques }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    technique: Technique;
  } | null>(null);

  const maxCount = useMemo(() => {
    return Math.max(1, ...techniques.map((t) => t.count));
  }, [techniques]);

  const tacticGroups = useMemo(() => {
    const groups: Record<string, Technique[]> = {};
    for (const tactic of TACTICS) {
      groups[tactic.id] = [];
    }
    for (const tech of techniques) {
      const tacticId = getTacticForTechnique(tech.id);
      if (groups[tacticId]) {
        groups[tacticId].push(tech);
      } else {
        groups[TACTICS[0].id].push(tech);
      }
    }
    return groups;
  }, [techniques]);

  const maxRows = useMemo(() => {
    return Math.max(1, ...Object.values(tacticGroups).map((g) => g.length));
  }, [tacticGroups]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, technique: Technique) => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
        technique,
      });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (techniques.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-[#2a3140] p-8 text-[#545d68]"
           style={{ backgroundColor: '#131920' }}>
        No technique data available
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <div
        className="min-w-[800px] rounded-lg border border-[#2a3140] p-4"
        style={{ backgroundColor: '#131920' }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3
            className="text-sm font-semibold text-[#e8edf5]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            MITRE ATT&CK Heatmap
          </h3>
          <div className="flex items-center gap-2 text-xs text-[#545d68]">
            <span>Low</span>
            <div className="flex gap-0.5">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((ratio) => (
                <div
                  key={ratio}
                  className="h-3 w-5 rounded-sm"
                  style={{
                    backgroundColor: getIntensityColor(ratio),
                    opacity: getIntensityOpacity(ratio),
                  }}
                />
              ))}
            </div>
            <span>High</span>
          </div>
        </div>

        {/* Grid */}
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${TACTICS.length}, minmax(0, 1fr))`,
          }}
        >
          {/* Tactic headers */}
          {TACTICS.map((tactic) => (
            <div
              key={tactic.id}
              className="rounded-t-md px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]"
              style={{ backgroundColor: '#161d27' }}
              title={tactic.label}
            >
              <span className="hidden lg:inline">{tactic.label}</span>
              <span className="lg:hidden">{tactic.shortLabel}</span>
            </div>
          ))}

          {/* Technique cells */}
          {Array.from({ length: maxRows }).map((_, rowIdx) =>
            TACTICS.map((tactic) => {
              const tech = tacticGroups[tactic.id][rowIdx];
              if (!tech) {
                return (
                  <div
                    key={`${tactic.id}-${rowIdx}`}
                    className="h-8 rounded-sm"
                    style={{ backgroundColor: '#0d1117' }}
                  />
                );
              }
              const ratio = tech.count / maxCount;
              return (
                <div
                  key={`${tactic.id}-${rowIdx}`}
                  className="relative flex h-8 cursor-pointer items-center justify-center rounded-sm text-[10px] font-mono font-medium transition-transform hover:scale-110 hover:z-10"
                  style={{
                    backgroundColor: getIntensityColor(ratio),
                    opacity: getIntensityOpacity(ratio),
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, tech)}
                  onMouseLeave={handleMouseLeave}
                  title={`${tech.id}${tech.name ? ` - ${tech.name}` : ''}: ${tech.count}`}
                >
                  <span className="text-[#07090f]">{tech.id}</span>
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-[10000] -translate-x-1/2 -translate-y-full rounded-lg border border-[#2a3140] px-3 py-2 shadow-xl"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            backgroundColor: '#161d27',
          }}
        >
          <div
            className="text-xs font-semibold text-[#f0a63a]"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            {tooltip.technique.id}
          </div>
          {tooltip.technique.name && (
            <div className="text-xs text-[#e8edf5]">{tooltip.technique.name}</div>
          )}
          <div className="mt-1 text-xs text-[#8b949e]">
            Count: <span className="font-semibold text-[#e8edf5]">{tooltip.technique.count}</span>
          </div>
        </div>
      )}
    </div>
  );
}
