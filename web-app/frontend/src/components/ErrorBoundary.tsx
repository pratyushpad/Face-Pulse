import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

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

  handleReset = (): void => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center h-64 rounded-[6px] border border-danger/30 bg-surface p-6 text-center">
          <p className="text-danger font-semibold mb-2">Something went wrong</p>
          <p className="text-text-secondary text-sm font-mono mb-4">
            {this.state.errorMessage}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-[6px] bg-accent hover:bg-accent-hover text-black text-sm font-medium transition-colors duration-150 cursor-pointer border-none"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
