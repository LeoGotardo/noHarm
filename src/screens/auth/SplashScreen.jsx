import { Btn } from '@ui'
import { Screen, Logo } from '@components'

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
  )
}
