import React, { ErrorInfo, ReactNode } from 'react';
import { logger } from '../lib/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Application rendering crashed inside ErrorBoundary', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-paper p-6 font-sans">
          <div className="max-w-md w-full bg-surface border border-hairline rounded shadow-xl shadow-black/5 p-8 sm:p-10 text-center space-y-6">
            <div className="bg-red-50 text-negative border border-hairline w-14 h-14 rounded flex items-center justify-center mx-auto">
              <AlertTriangle size={26} />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-semibold text-ink tracking-[-0.02em]">Something went wrong</h2>
              <p className="text-[11px] text-grey font-semibold uppercase tracking-[0.16em]">Application render error</p>
            </div>

            <p className="text-ink-soft text-sm leading-relaxed">
              We hit an unexpected rendering error. It's been logged, and your data remains safe.
            </p>

            {isDev && this.state.error && (
              <div className="text-left bg-paper border border-hairline rounded-sm p-4 text-[10px] font-mono text-negative max-h-40 overflow-y-auto custom-scrollbar whitespace-pre-wrap select-all">
                <strong>{this.state.error.name}:</strong> {this.state.error.message}
                <br />
                {this.state.error.stack}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 bg-ink hover:bg-accent text-paper py-3.5 px-4 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2 group cursor-pointer"
              >
                <RefreshCw size={14} className="group-hover:rotate-45 transition-transform" />
                Retry
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 bg-surface border border-hairline hover:bg-paper text-ink-soft py-3.5 px-4 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home size={14} />
                Refresh page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
