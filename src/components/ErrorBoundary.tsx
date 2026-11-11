import { Component, type ErrorInfo, type ReactNode } from 'react';

type ErrorBoundaryProps = Readonly<{
  children: ReactNode;
  scope: 'application' | 'viewer';
}>;

type ErrorBoundaryState = Readonly<{ failed: boolean }>;

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`${this.props.scope} error boundary`, error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.scope === 'viewer') {
      return (
        <section className="scene-panel scene-fallback" role="alert">
          <h2>3D viewer unavailable</h2>
          <p>The searchable catalog and scientific details remain available.</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => this.setState({ failed: false })}
          >
            Retry viewer
          </button>
        </section>
      );
    }
    return (
      <main className="fatal-error" role="alert">
        <h1>NearbyStarsViewer could not start</h1>
        <p>Reload the page. If the problem continues, rebuild the catalog and application.</p>
        <button className="primary-button" type="button" onClick={() => window.location.reload()}>
          Reload application
        </button>
      </main>
    );
  }
}
