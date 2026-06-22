import { GeoBackground } from './GeoBackground.jsx'

export function Screen({ geo, pulseKey, children, scrollRef, padTop = 52, padBottom = 96, noScroll }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', overflow: 'hidden' }}>
      {geo && <GeoBackground screen={geo} pulseKey={pulseKey} />}
      <div ref={scrollRef} className="nh-scroll" style={{
        position: 'relative', zIndex: 1, height: '100%',
        overflowY: noScroll ? 'hidden' : 'auto', overflowX: 'hidden',
        paddingTop: padTop, paddingBottom: padBottom,
        display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  );
}
