import { Component } from 'react';
import { Link, useLocation } from 'react-router-dom';

class ErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a chunk/module loading error (lazy import failure)
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Loading CSS chunk') ||
      error?.message?.includes('Unable to preload CSS') ||
      error?.message?.includes('error loading dynamically imported module');

    return { hasError: true, error, isChunkError };
  }

  componentDidUpdate(prevProps) {
    // Reset error state on route change - increment resetKey to force fresh React tree
    if (this.state.hasError && prevProps.pathname !== this.props.pathname) {
      this.setState((prev) => ({
        hasError: false,
        error: null,
        isChunkError: false,
        resetKey: prev.resetKey + 1,
      }));
    }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);

    // For chunk loading errors, auto-retry after a short delay
    if (this.state.isChunkError) {
      console.warn('[ErrorBoundary] Chunk load error detected, auto-recovering...');
      setTimeout(() => {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          isChunkError: false,
          resetKey: prev.resetKey + 1,
        }));
      }, 100);
    }
  }

  handleReset = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      isChunkError: false,
      resetKey: prev.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError && !this.state.isChunkError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #1a0533 0%, #2d1b69 50%, #1a0533 100%)' }}>
          <div className="text-center max-w-lg">
            {/* Icone maintenance */}
            <div className="mb-6 flex justify-center">
              <svg className="w-20 h-20 text-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.19-5.19a2.121 2.121 0 113-3l5.19 5.19m0 0l2.83 2.83m-2.83-2.83l2.83-2.83m-8.49 8.49a2.121 2.121 0 01-3-3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 11-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 016.336-4.486l-3.276 3.276a3.004 3.004 0 002.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852z" />
              </svg>
            </div>

            <h1 className="text-4xl font-heading font-bold text-heading mb-3">
              Maintenance en cours
            </h1>
            <p className="text-grey-light mb-2 text-lg">
              Nous effectuons une mise a jour pour ameliorer votre experience.
            </p>
            <p className="text-grey-light/70 mb-8">
              Le site revient dans quelques minutes. Merci de votre patience!
            </p>

            {isDev && this.state.error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-left">
                <p className="text-red-400 text-sm font-mono font-bold mb-1">{this.state.error.toString()}</p>
                <p className="text-red-400/60 text-xs font-mono whitespace-pre-wrap max-h-40 overflow-auto">
                  {this.state.error.stack?.split('\n').slice(1, 6).join('\n')}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l.001-.001" />
                </svg>
                Rafraichir
              </button>
              <Link
                to="/"
                onClick={this.handleReset}
                className="btn-outline"
              >
                Accueil
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Use resetKey to force React to create a fresh component tree after error recovery
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}

function ErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundaryInner pathname={pathname}>{children}</ErrorBoundaryInner>;
}

export default ErrorBoundary;
