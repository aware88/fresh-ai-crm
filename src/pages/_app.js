import React from 'react';

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p>Please try refreshing the page or contact support if the issue persists.</p>
          <a href="/" style={{ padding: '0.5rem 1rem', background: '#3B82F6', color: 'white', borderRadius: '0.25rem', textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
            Go Home
          </a>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom App component with error handling
function MyApp({ Component, pageProps }) {
  // Use a simple fallback for any component that fails to render
  const SafeComponent = React.useMemo(() => {
    return (props) => {
      try {
        return <Component {...props} />;
      } catch (e) {
        console.error("Error rendering component:", e);
        return (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Page Error</h1>
            <p>There was a problem loading this page.</p>
            <a href="/" style={{ padding: '0.5rem 1rem', background: '#3B82F6', color: 'white', borderRadius: '0.25rem', textDecoration: 'none', display: 'inline-block', marginTop: '1rem' }}>
              Go Home
            </a>
          </div>
        );
      }
    };
  }, [Component]);

  return (
    <ErrorBoundary>
      <SafeComponent {...pageProps} />
    </ErrorBoundary>
  );
}

export default MyApp;
