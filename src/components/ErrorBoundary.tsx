import { Component, type ErrorInfo, type ReactNode } from 'react'
import { captureError } from '../lib/monitoring'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

/** Fängt Render-Fehler ab und meldet sie ans Monitoring (inert ohne DSN). */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureError(error, { componentStack: info.componentStack })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="empty" style={{ margin: '3rem 1rem' }}>
          <p className="empty__title">Etwas ist schiefgelaufen</p>
          <p>Bitte lade die Seite neu. Der Fehler wurde protokolliert.</p>
          <button className="btn" onClick={() => window.location.reload()}>
            Neu laden
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
