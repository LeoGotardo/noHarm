const GEO = 'var(--geo)';

function Disc({ size, top, left, right, bottom, o = .08, drift = 'A', fill = GEO, delay = 0 }) {
  return <div className={`geo-shape geo-drift${drift}`} style={{
    width: size, height: size, borderRadius: '50%', background: fill, opacity: o,
    top, left, right, bottom, animationDelay: `${delay}s`,
  }} />;
}

function Ring({ size, top, left, right, bottom, o = .14, stroke = 2, drift = 'B', delay = 0, center = false }) {
  const pos = center
    ? { top, left: '50%', marginLeft: -size / 2 }
    : { top, left, right, bottom };
  return <div className={`geo-shape geo-drift${drift}`} style={{
    width: size, height: size, borderRadius: '50%',
    border: `${stroke}px solid ${GEO}`, opacity: o,
    ...pos, animationDelay: `${delay}s`,
  }} />;
}

function Hexes({ o = .07, cell = 34, drift }) {
  const r = cell, h = r * Math.sqrt(3);
  const pid = `hx${Math.round(cell)}`;
  return <div className={`geo-shape ${drift ? 'geo-drift' + drift : ''}`}
    style={{ top: -32, left: -32, width: 'calc(100% + 64px)', height: 'calc(100% + 64px)', opacity: o }}>
    <svg width="100%" height="100%">
      <defs>
        <pattern id={pid} width={r * 1.5} height={h} patternUnits="userSpaceOnUse">
          <path d={`M${r * .5} 0 L${r} ${h * .25} L${r} ${h * .75} L${r * .5} ${h} L0 ${h * .75} L0 ${h * .25} Z`}
            fill="none" stroke={GEO} strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  </div>;
}

function DotGrid({ gap = 24, o = .12, dot = 1.6, drift }) {
  const pid = `dg${gap}`;
  return <div className={`geo-shape ${drift ? 'geo-drift' + drift : ''}`}
    style={{ top: -32, left: -32, width: 'calc(100% + 64px)', height: 'calc(100% + 64px)', opacity: o }}>
    <svg width="100%" height="100%">
      <defs>
        <pattern id={pid} width={gap} height={gap} patternUnits="userSpaceOnUse">
          <circle cx={gap / 2} cy={gap / 2} r={dot} fill={GEO} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${pid})`} />
    </svg>
  </div>;
}

function Diagonals({ o = .06, gap = 16 }) {
  return <div className="geo-shape" style={{ inset: 0, opacity: o }}>
    <svg width="100%" height="100%">
      <defs>
        <pattern id="diag" width={gap} height={gap} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2={gap} stroke={GEO} strokeWidth="1.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#diag)" />
    </svg>
  </div>;
}

function RadialLines({ top, size = 460, o = .5, count = 22 }) {
  const c = size / 2;
  const lines = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const r0 = c * .26, r1 = c * .98;
    return <line key={i} x1={c + Math.cos(a) * r0} y1={c + Math.sin(a) * r0}
      x2={c + Math.cos(a) * r1} y2={c + Math.sin(a) * r1}
      stroke={GEO} strokeWidth="1.4" strokeLinecap="round" />;
  });
  return <div className="geo-shape geo-spin" style={{ top: top ?? -size * .18, left: '50%', marginLeft: -c, width: size, height: size, opacity: o }}>
    <svg width={size} height={size}>{lines}</svg>
  </div>;
}

function Polys({ o = .9 }) {
  const pts = [
    [60, 90, 0], [320, 120, 35], [110, 260, 12], [290, 320, -22], [200, 70, 18],
    [40, 380, -8], [340, 420, 28], [160, 480, 6], [250, 200, -16], [80, 180, 24],
  ];
  return <div className="geo-shape" style={{ inset: 0, opacity: o }}>
    <svg width="100%" height="100%" viewBox="0 0 380 600" preserveAspectRatio="xMidYMid slice">
      {pts.map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`} opacity={.06 + (i % 3) * .03}>
          {i % 3 === 0
            ? <rect x="-9" y="-9" width="18" height="18" rx="3" fill={GEO} />
            : i % 3 === 1
              ? <circle r="8" fill={GEO} />
              : <path d="M0 -11 L10 7 L-10 7 Z" fill={GEO} />}
        </g>
      ))}
    </svg>
  </div>;
}

export function GeoBackground({ screen = 'home', pulseKey = 0 }) {
  const groupCls = pulseKey ? 'geo-pulse' : '';
  let inner;
  switch (screen) {
    case 'splash':
      inner = <>
        <Disc size={360} top={-120} right={-110} o={.13} drift="A" />
        <Disc size={260} top={40} left={-120} o={.09} drift="B" delay={2} />
        <Ring size={420} bottom={-180} left={-90} o={.1} stroke={2} drift="C" />
        <Disc size={120} bottom={140} right={-30} o={.1} drift="A" delay={1} />
      </>;
      break;
    case 'auth':
      inner = <>
        <DotGrid gap={26} o={.13} dot={1.5} />
        <Ring size={340} top={-150} right={-150} o={.14} stroke={2} />
        <Disc size={90} bottom={120} left={-30} o={.08} drift="B" />
      </>;
      break;
    case 'home':
      inner = <>
        <Hexes cell={32} o={.05} drift="C" />
        <RadialLines top={-24} size={520} o={.5} />
        <Disc size={120} top={120} right={-50} o={.06} drift="A" delay={1.5} />
      </>;
      break;
    case 'history':
      inner = <>
        <Diagonals o={.055} gap={18} />
        <Disc size={200} top={-80} right={-90} o={.06} drift="B" />
      </>;
      break;
    case 'friends':
      inner = <>
        <Hexes cell={36} o={.045} drift="C" />
        <Disc size={210} top={-80} right={-70} o={.1} drift="A" />
        <Disc size={130} top={-30} right={60} o={.07} drift="B" delay={1} />
        <Disc size={90} top={70} right={-20} o={.06} drift="C" delay={2} />
      </>;
      break;
    case 'chat':
      inner = <DotGrid gap={26} o={.12} dot={1.4} drift="A" />;
      break;
    case 'badges':
      inner = <Hexes cell={40} o={.07} drift="B" />;
      break;
    case 'badgeDetail':
      inner = <Polys />;
      break;
    case 'profile':
      inner = <>
        <DotGrid gap={26} o={.08} dot={1.4} />
        <Ring size={240} top={20} o={.13} stroke={2} drift="A" center />
        <Ring size={360} top={-40} o={.08} stroke={2} drift="B" delay={1.5} center />
        <Ring size={500} top={-110} o={.05} stroke={2} drift="C" delay={3} center />
      </>;
      break;
    default:
      inner = <Disc size={240} top={-80} right={-80} o={.07} />;
  }
  return (
    <div className="geo-layer">
      <div className={`geo-bloom ${groupCls}`} style={{ position: 'absolute', inset: 0 }} key={pulseKey}>
        {inner}
      </div>
    </div>
  );
}
