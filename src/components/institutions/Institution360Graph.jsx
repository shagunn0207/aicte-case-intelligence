import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Shield,
  User,
  ArrowRight,
  Info,
  Network
} from 'lucide-react';
import { BUREAU_DEFINITIONS } from '../../utils/formatters';
import { formatDate } from '../../utils/formatters';

// ─────────────────────────────────────────────────────────────────────────────
// Keyframe animations injected once via a <style> tag
// ─────────────────────────────────────────────────────────────────────────────
const CANVAS_STYLES = `
  @keyframes inst-pulse {
    0%, 100% { box-shadow: 0 0 18px 4px rgba(59,130,246,0.45), inset 0 0 16px rgba(255,255,255,0.04); }
    50%       { box-shadow: 0 0 32px 8px rgba(59,130,246,0.70), inset 0 0 20px rgba(255,255,255,0.07); }
  }
  @keyframes node-appear {
    from { opacity: 0; transform: translate(-50%,-50%) scale(0.6); }
    to   { opacity: 1; transform: translate(-50%,-50%) scale(1); }
  }
  @keyframes line-appear {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .inst-pulse   { animation: inst-pulse 3s ease-in-out infinite; }
  .node-appear  { animation: node-appear 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
  .line-appear  { animation: line-appear 0.6s ease both; }
  .graph-node:hover { transform: translate(-50%,-50%) scale(1.06) !important; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Map a case status string to dark-canvas colour tokens. */
function caseVisual(status) {
  const s = (status || '').toLowerCase();
  if (s === 'disposed' || s === 'resolved' || s === 'closed')
    return { bg: 'rgba(5,150,105,0.18)', border: 'rgba(52,211,153,0.55)', text: '#6ee7b7', glow: 'rgba(52,211,153,0.35)' };
  if (s.includes('escalat') || s === 'overdue')
    return { bg: 'rgba(220,38,38,0.18)', border: 'rgba(248,113,113,0.55)', text: '#fca5a5', glow: 'rgba(248,113,113,0.35)' };
  if (s.includes('progress') || s.includes('process') || s.includes('review'))
    return { bg: 'rgba(59,130,246,0.18)', border: 'rgba(96,165,250,0.55)', text: '#93c5fd', glow: 'rgba(96,165,250,0.35)' };
  // pending / unknown → amber
  return { bg: 'rgba(245,158,11,0.18)', border: 'rgba(251,191,36,0.55)', text: '#fcd34d', glow: 'rgba(251,191,36,0.35)' };
}

/**
 * Radial position calculator.
 * Returns { x, y } in [0,100] coordinate space (SVG viewBox / CSS %).
 * Nodes near the edge are clamped to keep them within the canvas.
 */
function radialPos(index, total, cx, cy, radius, angleOffset = -Math.PI / 2) {
  const angle = total === 1
    ? angleOffset
    : angleOffset + (2 * Math.PI * index) / total;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

/**
 * Build a quadratic bezier path string between two [0,100] points.
 * A gentle lateral curve is applied so parallel lines are visually distinct.
 */
function bezierPath(from, to, curvature = 0.18) {
  if (!from || !to) return null;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cpx = mx - dy * curvature;
  const cpy = my + dx * curvature;
  return `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function Institution360Graph({ institution, cases = [], className = '' }) {
  const [selectedNode, setSelectedNode] = useState({ type: 'institution', id: 'root' });
  const [hoveredNode, setHoveredNode]   = useState(null);

  // ── Data processing (unchanged from original) ───────────────────────────

  const bureauMap = useMemo(() => {
    const map = {};
    cases.forEach((c) => {
      const code = c.bureau || 'UNK';
      if (!map[code]) map[code] = { code, cases: [] };
      map[code].cases.push(c);
    });
    return map;
  }, [cases]);

  const bureaus  = useMemo(() => Object.values(bureauMap), [bureauMap]);

  const officerMap = useMemo(() => {
    const map = {};
    cases.forEach((c) => {
      const officer = c.assigned_officer;
      if (officer) {
        if (!map[officer]) map[officer] = { name: officer, cases: [] };
        map[officer].cases.push(c.case_id || c.caseId);
      }
    });
    return map;
  }, [cases]);

  const officers = useMemo(() => Object.values(officerMap), [officerMap]);

  // ── Radial layout: positions in [0,100] space ───────────────────────────

  const nodePositions = useMemo(() => {
    const pos = {};
    const cx = 50;
    const cy = 50;

    // Institution: dead centre
    pos['institution'] = { x: cx, y: cy };

    // Cases: inner ring — radius scales with case count
    const caseR = cases.length <= 3 ? 20 : cases.length <= 7 ? 24 : 28;
    cases.forEach((c, i) => {
      const cid = c.case_id || c.caseId;
      pos[`case-${cid}`] = radialPos(i, cases.length, cx, cy, caseR);
    });

    // Bureaus + officers share the outer ring so same-bureau/officer nodes
    // from multiple cases converge on a single outer node
    const outerItems = [
      ...bureaus.map(b => ({ key: `bureau-${b.code}` })),
      ...officers.map(o => ({ key: `officer-${o.name}` })),
    ];
    const outerR = bureaus.length + officers.length > 6 ? 42 : 40;
    // Start outer ring at a slight offset so nodes don't land directly on top
    // of a case node
    const outerOffset = cases.length > 0
      ? (Math.PI * 2) / cases.length / 2   // halfway between two case angles
      : 0;
    outerItems.forEach(({ key }, i) => {
      pos[key] = radialPos(i, Math.max(outerItems.length, 1), cx, cy, outerR, -Math.PI / 2 + outerOffset);
    });

    return pos;
  }, [cases, bureaus, officers]);

  // ── Connections ─────────────────────────────────────────────────────────

  const connections = useMemo(() => {
    const lines = [];
    cases.forEach((c) => {
      const cid = c.case_id || c.caseId;
      lines.push({ from: 'institution',      to: `case-${cid}`,               type: 'inst-case' });
      if (c.bureau)            lines.push({ from: `case-${cid}`, to: `bureau-${c.bureau}`,          type: 'case-bureau' });
      if (c.assigned_officer)  lines.push({ from: `case-${cid}`, to: `officer-${c.assigned_officer}`, type: 'case-officer' });
    });
    return lines;
  }, [cases]);

  // ── Hover highlighting ───────────────────────────────────────────────────

  const highlightedSet = useMemo(() => {
    if (!hoveredNode) return null;
    const set  = new Set();
    const { type, id } = hoveredNode;

    if (type === 'institution') {
      set.add('institution');
      cases.forEach((c) => {
        const cid = c.case_id || c.caseId;
        set.add(`case-${cid}`);
        if (c.bureau)           set.add(`bureau-${c.bureau}`);
        if (c.assigned_officer) set.add(`officer-${c.assigned_officer}`);
      });
    } else if (type === 'case') {
      set.add('institution');
      set.add(`case-${id}`);
      const c = cases.find(x => (x.case_id || x.caseId) === id);
      if (c) {
        if (c.bureau)           set.add(`bureau-${c.bureau}`);
        if (c.assigned_officer) set.add(`officer-${c.assigned_officer}`);
      }
    } else if (type === 'bureau') {
      set.add('institution');
      set.add(`bureau-${id}`);
      (bureauMap[id]?.cases || []).forEach((c) => {
        const cid = c.case_id || c.caseId;
        set.add(`case-${cid}`);
        if (c.assigned_officer) set.add(`officer-${c.assigned_officer}`);
      });
    } else if (type === 'officer') {
      set.add('institution');
      set.add(`officer-${id}`);
      (officerMap[id]?.cases || []).forEach((cid) => {
        set.add(`case-${cid}`);
        const c = cases.find(x => (x.case_id || x.caseId) === cid);
        if (c?.bureau) set.add(`bureau-${c.bureau}`);
      });
    }
    return set;
  }, [hoveredNode, cases, bureauMap, officerMap]);

  const nodeOpacity   = (key)  => !highlightedSet || highlightedSet.has(key)  ? 1 : 0.12;
  const lineHighlight = (conn) => !highlightedSet || (highlightedSet.has(conn.from) && highlightedSet.has(conn.to));

  const select = (type, id) => setSelectedNode({ type, id });
  const hover  = (type, id) => setHoveredNode(type ? { type, id } : null);

  // ── Inspector panel content (identical logic to original) ───────────────

  const inspectorContent = useMemo(() => {
    const { type, id } = selectedNode;

    if (type === 'institution') {
      return {
        entityType : 'Central Institution',
        title      : institution.name || institution.institution_id,
        subtitle   : institution.institution_id,
        attrs: [
          { label: 'AICTE ID',        value: institution.institution_id },
          { label: 'Region / State',  value: institution.region || institution.state || '—' },
          { label: 'Type',            value: institution.institution_type || 'Technical Institution' },
          { label: 'Address',         value: institution.address || '—' },
          { label: 'Total Cases',     value: cases.length },
          { label: 'Bureaus Involved',value: bureaus.length },
        ],
        action: null,
      };
    }

    if (type === 'bureau') {
      const b   = bureauMap[id];
      const def = BUREAU_DEFINITIONS[id] || {};
      return {
        entityType : 'Bureau / Cell',
        title      : def.name || id,
        subtitle   : `${id} — ${b?.cases?.length ?? 0} case(s)`,
        attrs: [
          { label: 'Bureau Code',   value: id },
          { label: 'Full Name',     value: def.name || id },
          { label: 'Cases Handled', value: b?.cases?.length ?? 0 },
          { label: 'Case IDs',      value: (b?.cases || []).map(c => c.case_id || c.caseId).join(', ') || '—' },
        ],
        action: null,
      };
    }

    if (type === 'case') {
      const c = cases.find(x => (x.case_id || x.caseId) === id);
      if (!c) return null;
      const caseId = c.case_id || c.caseId;
      return {
        entityType : 'Complaint / Case File',
        title      : caseId,
        subtitle   : c.category || 'General Grievance',
        attrs: [
          { label: 'Case ID',          value: caseId },
          { label: 'Bureau',           value: c.bureau || '—' },
          { label: 'Status',           value: c.status || '—' },
          { label: 'Category',         value: c.category || '—' },
          { label: 'Received',         value: formatDate(c.received_date) || '—' },
          { label: 'Due Date',         value: formatDate(c.due_date) || '—' },
          { label: 'Assigned Officer', value: c.assigned_officer || '—' },
          { label: 'Description',      value: c.description || c.summary || c.title || '—' },
        ],
        action: { label: 'View Case File', to: `/cases/${caseId}` },
      };
    }

    if (type === 'officer') {
      const o = officerMap[id];
      return {
        entityType : 'Desk Officer',
        title      : id,
        subtitle   : `Assigned to ${o?.cases?.length ?? 0} case(s)`,
        attrs: [
          { label: 'Officer Name',    value: id },
          { label: 'Assigned Cases',  value: (o?.cases || []).join(', ') || '—' },
        ],
        action: null,
      };
    }

    return null;
  }, [selectedNode, institution, cases, bureauMap, officerMap, bureaus]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`border border-slate-700 rounded-xl shadow-lg overflow-hidden ${className}`}
      style={{ background: '#0d1525' }}>

      {/* inject keyframes once */}
      <style>{CANVAS_STYLES}</style>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2"
        style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-blue-400" />
          <h4 className="text-sm font-bold text-white">Institution 360° Relationship Map</h4>
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            {cases.length} case(s) · {bureaus.length} bureau(s) · {officers.length} officer(s)
          </span>
        </div>
        <span className="text-[11px] text-slate-600 font-mono">Click any node to inspect</span>
      </div>

      {/* ── Two-column layout: canvas + inspector ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>

        {/* ── Dark graph canvas ──────────────────────────────────────────── */}
        <div
          className="lg:col-span-8 relative overflow-hidden"
          style={{
            minHeight: '520px',
            background: 'radial-gradient(ellipse 80% 70% at 50% 50%, #111c33 0%, #0d1525 55%, #080e1a 100%)',
          }}
        >
          {/* Dot-grid texture */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.12 }}>
            <defs>
              <pattern id="dot-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="#60a5fa" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dot-grid)" />
          </svg>

          {/* Atmospheric centre glow */}
          <div className="absolute pointer-events-none"
            style={{
              left: '50%', top: '50%',
              transform: 'translate(-50%,-50%)',
              width: '300px', height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)',
            }} />

          {/* Legend ─ top-left overlay */}
          <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-3 px-3 py-1.5 rounded-lg text-[10px]"
            style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-slate-400 font-semibold mr-1">Legend</span>
            <LegendDot color="#3b82f6" label="Institution" />
            <LegendDot color="#a855f7" label="Bureau" />
            <LegendDot color="#60a5fa" label="Case" />
            {officers.length > 0 && <LegendDot color="#10b981" label="Officer" />}
          </div>

          {/* ── Relationship SVG ─────────────────────────────────────────── */}
          {/*
            viewBox="0 0 100 100" + preserveAspectRatio="none" maps perfectly
            onto the CSS %-based node positions: a node at left=x% top=y%
            corresponds to SVG coordinate (x, y) in this viewBox, because the
            SVG is stretched to fill the same container without preserving ratio.
          */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none line-appear"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ zIndex: 1 }}
          >
            <defs>
              {/* Soft glow filter for lines */}
              <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.25" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {connections.map((conn, i) => {
              const path = bezierPath(nodePositions[conn.from], nodePositions[conn.to]);
              if (!path) return null;

              const isLit = lineHighlight(conn);
              const stroke =
                conn.type === 'inst-case'    ? 'rgba(96,165,250,1)'   :
                conn.type === 'case-bureau'  ? 'rgba(168,85,247,1)'   :
                                               'rgba(52,211,153,1)';

              return (
                <path
                  key={i}
                  d={path}
                  stroke={stroke}
                  strokeWidth={isLit ? '0.45' : '0.2'}
                  fill="none"
                  opacity={isLit ? 0.65 : 0.06}
                  strokeLinecap="round"
                  filter={isLit ? 'url(#line-glow)' : undefined}
                  style={{ transition: 'opacity 0.3s ease, stroke-width 0.3s ease' }}
                />
              );
            })}

            {/* Endpoint dots on each connection */}
            {connections.map((conn, i) => {
              const to   = nodePositions[conn.to];
              const from = nodePositions[conn.from];
              if (!to || !from) return null;
              const isLit = lineHighlight(conn);
              const fill =
                conn.type === 'inst-case'   ? 'rgba(96,165,250,0.9)'  :
                conn.type === 'case-bureau' ? 'rgba(168,85,247,0.9)'  :
                                              'rgba(52,211,153,0.9)';
              return (
                <circle key={`dot-${i}`} cx={to.x} cy={to.y} r="0.6"
                  fill={fill} opacity={isLit ? 0.9 : 0.08}
                  style={{ transition: 'opacity 0.3s ease' }} />
              );
            })}
          </svg>

          {/* ── Institution node ──────────────────────────────────────────── */}
          <GraphNode
            pos={nodePositions['institution']}
            nodeKey="institution"
            opacity={nodeOpacity('institution')}
            isSelected={selectedNode.type === 'institution'}
            animDelay="0ms"
            onClick={() => select('institution', 'root')}
            onHover={(on) => hover(on ? 'institution' : null, 'root')}
          >
            <div
              className={selectedNode.type === 'institution' ? 'inst-pulse' : ''}
              style={{
                background   : 'linear-gradient(145deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%)',
                border       : `2px solid ${selectedNode.type === 'institution' ? 'rgba(147,197,253,0.9)' : 'rgba(96,165,250,0.55)'}`,
                boxShadow    : selectedNode.type === 'institution'
                  ? '0 0 28px 6px rgba(59,130,246,0.60), inset 0 0 18px rgba(255,255,255,0.06)'
                  : '0 0 16px 3px rgba(59,130,246,0.35), inset 0 0 10px rgba(255,255,255,0.03)',
                borderRadius : '16px',
                padding      : '10px 14px',
                width        : '124px',
                textAlign    : 'center',
                transition   : 'border-color 0.3s ease',
              }}
            >
              <div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-1.5"
                style={{ background: 'rgba(255,255,255,0.14)' }}>
                <Building2 className="w-4 h-4 text-blue-200" />
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: '#93c5fd', textTransform: 'uppercase' }}>
                Institution
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', lineHeight: 1.25, marginTop: '3px' }}
                className="line-clamp-2">
                {institution.name || institution.institution_id}
              </div>
              <div style={{ fontSize: '9px', fontFamily: 'monospace', color: 'rgba(147,197,253,0.65)', marginTop: '2px' }}>
                {institution.institution_id}
              </div>
              {institution.region && (
                <div style={{ fontSize: '9px', color: 'rgba(147,197,253,0.50)', marginTop: '1px' }}>
                  {institution.region}
                </div>
              )}
            </div>
          </GraphNode>

          {/* ── Case nodes ────────────────────────────────────────────────── */}
          {cases.map((c, idx) => {
            const cid  = c.case_id || c.caseId;
            const key  = `case-${cid}`;
            const pos  = nodePositions[key];
            if (!pos) return null;
            const v = caseVisual(c.status);
            const isOverdue =
              c.due_date &&
              (c.status || '').toLowerCase() !== 'disposed' &&
              new Date(c.due_date) < new Date();
            const isSel = selectedNode.type === 'case' && selectedNode.id === cid;

            return (
              <GraphNode
                key={key}
                pos={pos}
                nodeKey={key}
                opacity={nodeOpacity(key)}
                isSelected={isSel}
                animDelay={`${80 + idx * 40}ms`}
                onClick={() => select('case', cid)}
                onHover={(on) => hover(on ? 'case' : null, cid)}
              >
                <div style={{
                  background   : v.bg,
                  border       : `1.5px solid ${isSel ? v.border : v.border.replace('0.55', '0.35')}`,
                  boxShadow    : isSel
                    ? `0 0 22px 4px ${v.glow}, 0 4px 16px rgba(0,0,0,0.5)`
                    : `0 0 10px 1px ${v.glow.replace('0.35','0.18')}, 0 3px 10px rgba(0,0,0,0.4)`,
                  borderRadius : '10px',
                  padding      : '7px 9px',
                  width        : '92px',
                  transition   : 'border-color 0.25s, box-shadow 0.25s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', color: v.text }}>
                      {cid}
                    </span>
                    {isOverdue && (
                      <span style={{ fontSize: '8px', fontWeight: 800, color: '#f87171' }}>⚠</span>
                    )}
                  </div>
                  {c.category && (
                    <div style={{ fontSize: '9px', color: 'rgba(203,213,225,0.75)', lineHeight: 1.3, marginBottom: '4px' }}
                      className="line-clamp-1">
                      {c.category}
                    </div>
                  )}
                  <span style={{
                    display      : 'inline-block',
                    fontSize     : '8px',
                    fontWeight   : 600,
                    padding      : '1px 5px',
                    borderRadius : '4px',
                    background   : v.bg,
                    color        : v.text,
                    border       : `1px solid ${v.border}`,
                  }}>
                    {c.status || 'Unknown'}
                  </span>
                </div>
              </GraphNode>
            );
          })}

          {/* ── Bureau nodes ──────────────────────────────────────────────── */}
          {bureaus.map((b, idx) => {
            const key = `bureau-${b.code}`;
            const pos = nodePositions[key];
            if (!pos) return null;
            const def = BUREAU_DEFINITIONS[b.code] || {};
            const isSel = selectedNode.type === 'bureau' && selectedNode.id === b.code;

            return (
              <GraphNode
                key={key}
                pos={pos}
                nodeKey={key}
                opacity={nodeOpacity(key)}
                isSelected={isSel}
                animDelay={`${200 + idx * 50}ms`}
                onClick={() => select('bureau', b.code)}
                onHover={(on) => hover(on ? 'bureau' : null, b.code)}
              >
                <div style={{
                  background   : 'rgba(109,40,217,0.20)',
                  border       : `1.5px solid ${isSel ? 'rgba(192,132,252,0.85)' : 'rgba(168,85,247,0.40)'}`,
                  boxShadow    : isSel
                    ? '0 0 22px 4px rgba(168,85,247,0.50), 0 4px 16px rgba(0,0,0,0.5)'
                    : '0 0 10px 1px rgba(168,85,247,0.18), 0 3px 10px rgba(0,0,0,0.4)',
                  borderRadius : '10px',
                  padding      : '7px 10px',
                  width        : '90px',
                  transition   : 'border-color 0.25s, box-shadow 0.25s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                    <Shield style={{ width: '10px', height: '10px', color: '#c084fc', flexShrink: 0 }} />
                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#c084fc' }}>
                      Bureau
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#e9d5ff', lineHeight: 1.1 }}>
                    {b.code}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(216,180,254,0.65)', marginTop: '2px' }} className="line-clamp-1">
                    {def.shortName || def.name || b.code}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(192,132,252,0.50)', marginTop: '2px' }}>
                    {b.cases.length} case(s)
                  </div>
                </div>
              </GraphNode>
            );
          })}

          {/* ── Officer nodes ─────────────────────────────────────────────── */}
          {officers.map((o, idx) => {
            const key = `officer-${o.name}`;
            const pos = nodePositions[key];
            if (!pos) return null;
            const isSel = selectedNode.type === 'officer' && selectedNode.id === o.name;

            return (
              <GraphNode
                key={key}
                pos={pos}
                nodeKey={key}
                opacity={nodeOpacity(key)}
                isSelected={isSel}
                animDelay={`${280 + idx * 50}ms`}
                onClick={() => select('officer', o.name)}
                onHover={(on) => hover(on ? 'officer' : null, o.name)}
              >
                <div style={{
                  background   : 'rgba(5,150,105,0.20)',
                  border       : `1.5px solid ${isSel ? 'rgba(110,231,183,0.85)' : 'rgba(52,211,153,0.40)'}`,
                  boxShadow    : isSel
                    ? '0 0 22px 4px rgba(52,211,153,0.50), 0 4px 16px rgba(0,0,0,0.5)'
                    : '0 0 10px 1px rgba(52,211,153,0.18), 0 3px 10px rgba(0,0,0,0.4)',
                  borderRadius : '10px',
                  padding      : '7px 10px',
                  width        : '90px',
                  transition   : 'border-color 0.25s, box-shadow 0.25s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                    <User style={{ width: '10px', height: '10px', color: '#34d399', flexShrink: 0 }} />
                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#34d399' }}>
                      Officer
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#a7f3d0', lineHeight: 1.25 }} className="line-clamp-2">
                    {o.name}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(52,211,153,0.50)', marginTop: '2px' }}>
                    {o.cases.length} case(s)
                  </div>
                </div>
              </GraphNode>
            );
          })}

          {/* Empty state overlay */}
          {cases.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center" style={{ color: 'rgba(148,163,184,0.5)', fontSize: '13px' }}>
                <Network className="w-10 h-10 mx-auto mb-2 opacity-20" />
                No cases to map for this institution.
              </div>
            </div>
          )}
        </div>

        {/* ── Entity Inspector Panel ─────────────────────────────────────────── */}
        <div className="lg:col-span-4 p-5 flex flex-col"
          style={{ background: '#fff', borderLeft: '1px solid rgba(0,0,0,0.07)', minHeight: '520px' }}>

          {inspectorContent ? (
            <>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase pb-3 border-b border-slate-200">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                Entity Inspector
              </div>

              <div className="mt-4 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  {inspectorContent.entityType}
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                  {inspectorContent.title}
                </h4>
                {inspectorContent.subtitle && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{inspectorContent.subtitle}</p>
                )}

                <div className="mt-4 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Attributes
                  </div>
                  {inspectorContent.attrs.map((attr, i) => (
                    <div key={i} className="text-xs leading-relaxed">
                      <span className="text-slate-500">{attr.label}: </span>
                      <span className="font-semibold text-slate-800 break-words">{String(attr.value)}</span>
                    </div>
                  ))}
                </div>

                {inspectorContent.action && (
                  <Link
                    to={inspectorContent.action.to}
                    className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-aicte-navy text-white text-xs font-semibold hover:bg-aicte-navy-light transition-colors shadow-sm"
                  >
                    {inspectorContent.action.label}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              <p className="text-[11px] text-slate-400 pt-4 border-t border-slate-100 mt-6 leading-relaxed">
                Click any node in the graph to inspect its details.
                Hover to highlight connected relationships.
              </p>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-slate-500 text-center">
                Select a node to inspect its details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GraphNode — absolutely positioned wrapper with hover/select transitions
// ─────────────────────────────────────────────────────────────────────────────
function GraphNode({ pos, nodeKey, opacity, isSelected, animDelay, onClick, onHover, children }) {
  if (!pos) return null;
  return (
    <div
      className="graph-node node-appear"
      style={{
        position     : 'absolute',
        left         : `${pos.x}%`,
        top          : `${pos.y}%`,
        transform    : `translate(-50%, -50%) scale(${isSelected ? 1.07 : 1})`,
        opacity,
        zIndex       : isSelected ? 10 : 3,
        cursor       : 'pointer',
        transition   : 'opacity 0.3s ease, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        animationDelay: animDelay || '0ms',
        userSelect   : 'none',
      }}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LegendDot — small coloured dot + label for the canvas legend
// ─────────────────────────────────────────────────────────────────────────────
function LegendDot({ color, label }) {
  return (
    <span className="flex items-center gap-1 text-slate-400">
      <span
        style={{
          display      : 'inline-block',
          width        : '8px',
          height       : '8px',
          borderRadius : '50%',
          background   : color,
          boxShadow    : `0 0 5px ${color}`,
          flexShrink   : 0,
        }}
      />
      {label}
    </span>
  );
}
