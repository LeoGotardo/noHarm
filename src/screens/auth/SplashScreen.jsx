import { Screen, Btn } from '../../ui/index.js'

export function Logo({ size = 76, withText = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--primary)" strokeWidth="4" opacity="0.28" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--primary)" strokeWidth="5.5"
            strokeLinecap="round" strokeDasharray="276" strokeDashoffset="96" transform="rotate(-90 50 50)" />
          <path d="M34 51 L45 62 L68 38" fill="none" stroke="var(--primary)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {withText && (
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--display-weight)', fontSize: 34, color: 'var(--ink)', letterSpacing: -0.5 }}>
          No<span style={{ color: 'var(--primary)' }}>Harm</span>
        </div>
      )}
    </div>
  );
}

export function SplashScreen({ onGetStarted, onLogin }) {
  return (
    <Screen geo="splash" padTop={0} padBottom={0} noScroll>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div className="nh-rise"><Logo size={92} withText /></div>
        <div className="nh-rise" style={{ animationDelay: '.08s', marginTop: 22, fontSize: 19, lineHeight: 1.45, color: 'var(--ink-2)', fontWeight: 500, maxWidth: 290 }}>
          One clean day at a time.<br />Track your streak, lean on friends, celebrate every milestone.
        </div>
      </div>
      <div className="nh-rise" style={{ animationDelay: '.16s', padding: '0 24px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Btn kind="primary" size="lg" full onClick={onGetStarted}>Get started</Btn>
        <Btn kind="ghost" full onClick={onLogin}>I already have an account</Btn>
      </div>
    </Screen>
  );
}
