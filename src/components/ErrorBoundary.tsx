import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="min-h-[50vh] w-full bg-black flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-[#1a1a1a] border-2 border-red-600/30 rounded-2xl p-6 md:p-8 text-center shadow-2xl">
            <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-red-400 mx-auto mb-4 animate-pulse" />
            <h1 className="text-xl md:text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred inside this view.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-black text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                <span>Reload Page</span>
              </button>
              <a
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
