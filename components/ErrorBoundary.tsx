'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, { error: Error | null; showDetails: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-800 mb-1">Something went wrong</p>
          <p className="text-xs text-red-700 mb-3">We couldn’t load this section. Please try again.</p>
          <button
            onClick={() => this.setState({ error: null, showDetails: false })}
            className="px-3 py-1 text-xs font-medium text-red-800 bg-red-100 hover:bg-red-200 rounded-full transition"
          >
            Try again
          </button>
          {this.state.showDetails && (
            <pre className="mt-3 text-xs text-red-600 whitespace-pre-wrap">{this.state.error.message}</pre>
          )}
          <button
            onClick={() => this.setState({ showDetails: !this.state.showDetails })}
            className="mt-2 text-xs text-red-600 underline"
          >
            {this.state.showDetails ? 'Hide details' : 'Show details'}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}