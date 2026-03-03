/**
 * ErrorBoundary — catches runtime errors in the React component tree.
 *
 * Wraps the camera section so a webcam or canvas crash doesn't bring down
 * the whole page. Displays a styled fallback UI instead.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  /** Content to render inside the boundary. */
  children: ReactNode
  /** Optional custom fallback. Defaults to the built-in error card. */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

/**
 * Class-based error boundary (React requires class components for this API).
 * Catches any render or lifecycle errors in its subtree.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info)
  }

  /** Reset the error state so the user can retry. */
  handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center h-64 rounded-lg border border-red-500/30 bg-surface p-6 text-center">
          <p className="text-red-400 font-semibold mb-2">Something went wrong</p>
          <p className="text-white/50 text-sm font-mono mb-4">
            {this.state.errorMessage}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-md bg-accent hover:bg-accent-light text-white text-sm font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
