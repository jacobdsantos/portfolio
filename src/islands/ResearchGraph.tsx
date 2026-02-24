import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface ResearchItem {
  slug: string;
  title: string;
  tags: string[];
}

interface Props {
  items: ResearchItem[];
}

interface Node {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface Edge {
  source: number;
  target: number;
  weight: number;
}

const TAG_COLORS: Record<string, string> = {
  ransomware: '#ff6b6b',
  malware: '#ee5a24',
  apt: '#e056fd',
  'threat intelligence': '#f0a63a',
  ai: '#00b4d8',
  automation: '#6c5ce7',
  python: '#f9ca24',
  mcp: '#f0a63a',
  tools: '#6c5ce7',
  training: '#e17055',
  research: '#00b4d8',
};

function getNodeColor(tags: string[]): string {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    if (TAG_COLORS[lower]) return TAG_COLORS[lower];
  }
  return '#f0a63a';
}

export default function ResearchGraph({ items }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [dragNode, setDragNode] = useState<number | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const [, forceRender] = useState(0);

  // Build edges from shared tags
  const edges = useMemo(() => {
    const edgeList: Edge[] = [];
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const shared = items[i].tags.filter((t) =>
          items[j].tags.some((t2) => t2.toLowerCase() === t.toLowerCase()),
        );
        if (shared.length > 0) {
          edgeList.push({ source: i, target: j, weight: shared.length });
        }
      }
    }
    return edgeList;
  }, [items]);

  // Initialize nodes
  useEffect(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const angle = (2 * Math.PI) / Math.max(items.length, 1);
    const radius = Math.min(dimensions.width, dimensions.height) * 0.3;

    nodesRef.current = items.map((item, i) => ({
      id: item.slug,
      slug: item.slug,
      title: item.title,
      tags: item.tags,
      x: centerX + radius * Math.cos(angle * i) + (Math.random() - 0.5) * 40,
      y: centerY + radius * Math.sin(angle * i) + (Math.random() - 0.5) * 40,
      vx: 0,
      vy: 0,
      radius: 8 + Math.min(item.tags.length * 2, 12),
      color: getNodeColor(item.tags),
    }));
    forceRender((n) => n + 1);
  }, [items, dimensions]);

  // Responsive sizing
  useEffect(() => {
    const container = svgRef.current?.parentElement;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(300, entry.contentRect.width * 0.6),
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Physics simulation
  useEffect(() => {
    let running = true;
    let tick = 0;

    const simulate = () => {
      if (!running) return;
      tick++;

      const nodes = nodesRef.current;
      if (nodes.length === 0) {
        animationRef.current = requestAnimationFrame(simulate);
        return;
      }

      const damping = 0.92;
      const repulsion = 2000;
      const attraction = 0.005;
      const centerForce = 0.002;
      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = repulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }

      // Attraction along edges
      for (const edge of edges) {
        const a = nodes[edge.source];
        const b = nodes[edge.target];
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = dist * attraction * edge.weight;
        const fx = (dx / Math.max(dist, 1)) * force;
        const fy = (dy / Math.max(dist, 1)) * force;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      }

      // Center gravity
      for (const node of nodes) {
        node.vx += (cx - node.x) * centerForce;
        node.vy += (cy - node.y) * centerForce;
      }

      // Apply velocities
      for (const node of nodes) {
        if (dragNode !== null && node === nodes[dragNode]) continue;
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;
        // Boundary constraints
        node.x = Math.max(node.radius, Math.min(dimensions.width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(dimensions.height - node.radius, node.y));
      }

      // Slow down over time
      if (tick < 300) {
        forceRender((n) => n + 1);
        animationRef.current = requestAnimationFrame(simulate);
      }
    };

    animationRef.current = requestAnimationFrame(simulate);
    return () => {
      running = false;
      cancelAnimationFrame(animationRef.current);
    };
  }, [edges, dimensions, dragNode]);

  const handleNodeClick = useCallback((node: Node) => {
    window.location.href = `/research/${node.slug}`;
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, idx: number) => {
      e.preventDefault();
      setDragNode(idx);
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragNode === null || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      nodesRef.current[dragNode].x = x;
      nodesRef.current[dragNode].y = y;
      nodesRef.current[dragNode].vx = 0;
      nodesRef.current[dragNode].vy = 0;
      forceRender((n) => n + 1);
    },
    [dragNode],
  );

  const handleMouseUp = useCallback(() => {
    setDragNode(null);
  }, []);

  const nodes = nodesRef.current;

  return (
    <div className="w-full overflow-hidden rounded-lg border border-[#2a3140]" style={{ backgroundColor: '#131920' }}>
      <div className="flex items-center justify-between border-b border-[#2a3140] px-4 py-2">
        <h3
          className="text-sm font-semibold text-[#e8edf5]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Research Connections
        </h3>
        <span className="text-xs text-[#545d68]">{items.length} items</span>
      </div>

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full"
        style={{ cursor: dragNode !== null ? 'grabbing' : 'default' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const a = nodes[edge.source];
          const b = nodes[edge.target];
          if (!a || !b) return null;
          const isHovered =
            hoveredNode && (hoveredNode.id === a.id || hoveredNode.id === b.id);
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={isHovered ? '#f0a63a' : '#2a3140'}
              strokeWidth={isHovered ? 2 : 1}
              strokeOpacity={isHovered ? 0.8 : 0.4}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node, i) => {
          const isHovered = hoveredNode?.id === node.id;
          return (
            <g key={node.id}>
              {/* Glow effect */}
              {isHovered && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius + 6}
                  fill={node.color}
                  opacity={0.15}
                />
              )}
              {/* Node circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={node.radius}
                fill={node.color}
                opacity={isHovered ? 1 : 0.7}
                stroke={isHovered ? '#e8edf5' : 'none'}
                strokeWidth={2}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={(e) => handleMouseDown(e, i)}
                onClick={() => handleNodeClick(node)}
              />
              {/* Label (only for hovered node or large nodes) */}
              {(isHovered || node.radius > 14) && (
                <text
                  x={node.x}
                  y={node.y + node.radius + 14}
                  textAnchor="middle"
                  fill={isHovered ? '#e8edf5' : '#8b949e'}
                  fontSize={11}
                  fontFamily="'Space Grotesk', sans-serif"
                  fontWeight={isHovered ? 600 : 400}
                  className="pointer-events-none select-none"
                >
                  {node.title.length > 25 ? `${node.title.slice(0, 22)}...` : node.title}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hovered node detail */}
      {hoveredNode && (
        <div className="border-t border-[#2a3140] px-4 py-2">
          <div className="text-sm font-medium text-[#e8edf5]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {hoveredNode.title}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {hoveredNode.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${getNodeColor([tag])}20`,
                  color: getNodeColor([tag]),
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
