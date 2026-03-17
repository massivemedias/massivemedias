import { Component } from 'react';
import { Link, useLocation } from 'react-router-dom';

class ErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.pathname !== this.props.pathname) {
      this.setState({ hasError: false, error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
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
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn-outline"
              >
                Accueil
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ErrorBoundary({ children }) {
  const { pathname } = useLocation();
  return <ErrorBoundaryInner pathname={pathname}>{children}</ErrorBoundaryInner>;
}

export default ErrorBoundary;
