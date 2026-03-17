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
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-lg">
            <h1 className="text-4xl font-heading font-bold text-heading mb-4">
              Oups!
            </h1>
            <p className="text-grey-light mb-4">
              Une erreur inattendue est survenue. Rafraichis la page ou retourne a l'accueil.
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
                className="btn-primary"
              >
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
