import { Component, type ErrorInfo, type ReactNode } from 'react'
import { content } from '../config/content'
import { LetterCard } from './LetterOverlay'

/** Friendly 2D fallback: the gift (and the letter) still lands even if WebGL or the scene fails. */
export function ErrorFallback({ onRetry, reason }: { onRetry?: () => void; reason?: 'webgl' | 'crash' }) {
  return (
    <div className="fallback" role="alert">
      <h1>{content.fallback.title}</h1>
      <p>{reason === 'webgl' ? "Your browser can't show the 3D museum, but the letter still works 💌" : content.fallback.text}</p>
      {onRetry && (
        <button className="gift-btn" style={{ animation: 'none', marginTop: 0 }} onClick={onRetry}>
          {content.fallback.retry}
        </button>
      )}
      <LetterCard inline />
    </div>
  )
}

interface BoundaryState {
  failed: boolean
  key: number
}

export class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { failed: false, key: 0 }

  static getDerivedStateFromError(): Partial<BoundaryState> {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // keep a trace in the console for debugging, the user only sees the friendly screen
    console.error('[museum] crashed:', error, info.componentStack)
  }

  retry = () => {
    // the shared store / GL state may be half-broken, so a clean reload is the most reliable retry
    try {
      window.location.reload()
    } catch {
      this.setState((s) => ({ failed: false, key: s.key + 1 }))
    }
  }

  render() {
    if (this.state.failed) return <ErrorFallback onRetry={this.retry} reason="crash" />
    return <div key={this.state.key} style={{ display: 'contents' }}>{this.props.children}</div>
  }
}
