import { Component } from 'react';
import { Link, useLocation } from 'react-router-dom';

class ErrorBoundaryInner extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.pathname !== this.props.pathname) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-heading font-bold text-heading mb-4">
              Oups!
            </h1>
            <p className="text-grey-light mb-8">
              Une erreur inattendue est survenue. Rafraîchis la page ou retourne à l'accueil.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Rafraîchir
              </button>
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false })}
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
