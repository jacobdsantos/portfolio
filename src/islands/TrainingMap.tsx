import { useState, useMemo, useCallback } from 'react';

interface TrainingLocation {
  name: string;
  lat: number;
  lng: number;
  events: string[];
}

interface Props {
  locations: TrainingLocation[];
}

/**
 * Convert lat/lng to SVG coordinates using a simple equirectangular projection.
 * SVG viewBox is 1000x500 (2:1 aspect ratio).
 */
function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

/**
 * Simplified world map outline path (major continents only).
 * This is a heavily simplified polygon set for rendering without external dependencies.
 */
const WORLD_PATH = `
M 155,85 L 160,80 170,78 180,82 190,78 200,80 205,85 210,82 220,78 230,80 235,85 238,90 240,95 238,100 240,105 238,108 235,112 230,115 225,120 220,125 222,130 225,135 230,140 235,145 228,150 220,155 215,160 210,165 205,170 200,175 195,180 190,185 188,190 192,195 200,198 210,200 218,205 225,210 228,215 230,225 225,235 218,240 210,245 200,250 190,255 185,260 180,265 175,270 168,280 160,290 155,295 148,300 140,305 135,310 130,320 128,330 130,335 135,340 140,345 145,350 140,355 130,360 125,365 120,370 115,375 110,380 105,375 100,370 95,365 90,360 85,350 82,340 80,330 78,320 80,310 85,305 90,300 95,295 100,290 108,280 115,270 120,265 125,260 130,255 140,248 148,240 155,230 158,220 160,210 162,200 163,190 162,180 160,170 158,160 156,150 155,140 156,130 158,120 160,110 158,100 155,90 Z
M 500,50 L 520,48 540,50 560,52 580,55 600,58 620,60 640,65 660,70 680,72 700,70 720,68 740,65 760,62 780,60 790,65 795,70 800,80 805,85 808,90 810,95 812,100 815,105 818,112 822,118 828,125 830,130 832,135 830,140 826,148 822,155 818,160 815,165 812,170 808,172 800,175 795,178 790,180 785,185 780,188 775,192 770,195 765,200 760,205 755,208 748,212 740,215 735,218 730,220 725,222 720,225 715,228 710,232 708,238 712,245 718,248 722,252 718,258 712,262 708,266 700,270 695,275 690,278 685,280 675,282 665,280 660,278 655,275 650,270 648,265 650,260 655,255 660,250 665,245 668,240 670,235 668,228 665,222 660,218 655,215 650,210 648,205 650,200 652,195 655,190 658,185 660,178 658,172 655,165 650,160 645,155 640,152 635,150 630,148 625,145 620,140 615,135 610,130 605,125 600,120 595,118 590,115 585,110 580,108 575,105 570,100 565,95 560,90 555,85 550,80 545,75 540,70 535,68 528,65 520,60 510,55 505,52 500,50 Z
M 530,265 L 545,262 560,260 575,262 590,265 605,268 620,272 635,275 650,278 660,280 668,285 672,290 675,295 678,300 680,305 682,310 685,315 688,320 690,325 692,330 690,335 685,340 680,345 675,350 670,355 665,358 660,360 655,362 645,365 635,368 625,372 615,375 605,378 595,380 585,382 575,384 565,386 555,388 545,390 535,388 528,385 522,380 518,375 515,370 512,365 510,360 512,355 515,350 518,345 520,340 522,335 525,328 528,320 530,312 532,305 530,298 528,290 530,282 532,275 530,268 530,265 Z
M 750,250 L 770,248 790,250 810,255 830,258 845,260 858,265 868,270 875,275 882,280 888,288 892,295 895,305 898,315 900,325 898,335 895,345 890,355 885,360 878,365 870,368 860,370 850,372 840,375 830,378 820,380 810,382 800,385 790,388 780,390 770,392 758,395 745,398 735,400 725,395 720,388 718,380 720,372 722,365 725,358 728,350 730,342 732,335 735,328 738,320 740,312 742,305 745,298 748,290 750,280 752,270 750,260 750,250 Z
M 820,60 L 835,58 850,60 865,62 880,65 895,68 910,72 925,75 935,80 940,85 942,90 938,95 935,100 930,105 928,110 925,115 922,120 920,125 918,130 915,135 912,140 910,145 912,150 915,155 918,160 920,165 918,170 912,175 905,178 898,180 890,182 882,185 875,188 868,190 860,192 850,195 842,198 835,200 828,202 820,205 815,208 810,210 808,215 812,220 818,225 825,228 830,230 838,235 842,240 840,245 835,248 828,250 820,252 812,255 808,258 805,262 808,268 812,272 818,278 822,282 825,285 822,288 818,292 812,295 805,298 798,300 790,302 782,305 775,308 768,310 760,305 755,298 752,290 755,282 758,275 760,268 762,260 758,252 755,245 752,238 748,232 745,225 742,218 740,210 738,202 735,195 730,190 728,185 725,180 722,175 720,168 718,160 720,155 725,148 730,142 738,135 745,128 752,122 758,118 765,112 772,108 778,102 785,95 792,88 798,82 805,75 812,68 818,62 820,60 Z
`;

export default function TrainingMap({ locations }: Props) {
  const [activeLocation, setActiveLocation] = useState<TrainingLocation | null>(null);

  const projected = useMemo(() => {
    return locations.map((loc) => ({
      ...loc,
      ...project(loc.lat, loc.lng),
    }));
  }, [locations]);

  const handleDotHover = useCallback((loc: TrainingLocation | null) => {
    setActiveLocation(loc);
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#2a3140]" style={{ backgroundColor: '#131920' }}>
      <div className="flex items-center justify-between border-b border-[#2a3140] px-4 py-2">
        <h3
          className="text-sm font-semibold text-[#e8edf5]"
          style={{ fontFamily: "'Urbanist', sans-serif" }}
        >
          Training Locations
        </h3>
        <span className="text-xs text-[#545d68]">{locations.length} locations</span>
      </div>

      <div className="relative p-4">
        <svg viewBox="0 0 1000 500" className="w-full" preserveAspectRatio="xMidYMid meet">
          {/* Water background */}
          <rect x="0" y="0" width="1000" height="500" fill="#0a0f18" rx="4" />

          {/* Graticule lines */}
          {[-60, -30, 0, 30, 60].map((lat) => {
            const { y } = project(lat, 0);
            return (
              <line
                key={`lat-${lat}`}
                x1="0"
                y1={y}
                x2="1000"
                y2={y}
                stroke="#1a2030"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
            );
          })}
          {[-120, -60, 0, 60, 120].map((lng) => {
            const { x } = project(0, lng);
            return (
              <line
                key={`lng-${lng}`}
                x1={x}
                y1="0"
                x2={x}
                y2="500"
                stroke="#1a2030"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Land masses */}
          <path d={WORLD_PATH} fill="#161d27" stroke="#2a3140" strokeWidth="0.5" />

          {/* Location dots */}
          {projected.map((loc, i) => {
            const isActive = activeLocation?.name === loc.name;
            return (
              <g key={i}>
                {/* Pulse ring animation */}
                <circle cx={loc.x} cy={loc.y} r="12" fill="none" stroke="#f0a63a" strokeWidth="1" opacity="0.3">
                  <animate
                    attributeName="r"
                    values="6;18;6"
                    dur="3s"
                    repeatCount="indefinite"
                    begin={`${i * 0.5}s`}
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0;0.4"
                    dur="3s"
                    repeatCount="indefinite"
                    begin={`${i * 0.5}s`}
                  />
                </circle>

                {/* Glow */}
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r={isActive ? 10 : 6}
                  fill="#f0a63a"
                  opacity={isActive ? 0.2 : 0.1}
                />

                {/* Dot */}
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r={isActive ? 6 : 4}
                  fill="#f0a63a"
                  stroke={isActive ? '#e8edf5' : '#f0a63a'}
                  strokeWidth={isActive ? 2 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => handleDotHover(loc)}
                  onMouseLeave={() => handleDotHover(null)}
                />

                {/* Label for active */}
                {isActive && (
                  <g>
                    <rect
                      x={loc.x + 12}
                      y={loc.y - 14}
                      width={loc.name.length * 7 + 16}
                      height="24"
                      rx="4"
                      fill="#161d27"
                      stroke="#2a3140"
                      strokeWidth="1"
                    />
                    <text
                      x={loc.x + 20}
                      y={loc.y + 2}
                      fill="#e8edf5"
                      fontSize="11"
                      fontFamily="'Urbanist', sans-serif"
                      fontWeight="500"
                    >
                      {loc.name}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Active location detail */}
      {activeLocation && (
        <div className="border-t border-[#2a3140] px-4 py-3">
          <div className="text-sm font-semibold text-[#e8edf5]" style={{ fontFamily: "'Urbanist', sans-serif" }}>
            {activeLocation.name}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {activeLocation.events.map((event, i) => (
              <span
                key={i}
                className="rounded-md border border-[#2a3140] px-2 py-0.5 text-xs text-[#8b949e]"
                style={{ backgroundColor: '#161d27' }}
              >
                {event}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Location list (mobile-friendly) */}
      {!activeLocation && locations.length > 0 && (
        <div className="border-t border-[#2a3140] px-4 py-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {locations.map((loc, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-[#f0a63a] cursor-pointer transition-colors"
                onMouseEnter={() => setActiveLocation(loc)}
                onMouseLeave={() => setActiveLocation(null)}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#f0a63a]" />
                {loc.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
